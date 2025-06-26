(() => {
  // ../../.nifty/files/lazy/components/btn/btn.js
  var ModeT = function(ModeT2) {
    ModeT2[ModeT2["INERT"] = 0] = "INERT";
    ModeT2[ModeT2["SAVING"] = 1] = "SAVING";
    ModeT2[ModeT2["SAVED"] = 2] = "SAVED";
    return ModeT2;
  }(ModeT || {});
  var CBtn = class extends HTMLElement {
    s;
    m;
    els;
    shadow;
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "open" });
      this.s = { mode: 0 };
      this.m = { show_anime_on_click: true };
      this.els = { animeffect: null };
    }
    connectedCallback() {
      this.m.show_anime_on_click = this.hasAttribute("noanime") ? false : true;
      this.sc();
      this.addEventListener("click", () => {
        this.is_clicked();
      });
    }
    async attributeChangedCallback(_name, _oldval, _newval) {
    }
    done() {
      this.to_stop_anime();
    }
    is_clicked() {
      if (this.s.mode == 0) {
        if (this.m.show_anime_on_click) this.to_start_anime();
        this.dispatchEvent(new CustomEvent("btnclick", { detail: { resolved: this.done.bind(this) } }));
      }
    }
    to_start_anime() {
      if (this.s.mode === 0) {
        this.s.mode = 1;
        this.els.animeffect = document.createElement("c-animeffect");
        this.els.animeffect.setAttribute("active", "");
        this.shadow.appendChild(this.els.animeffect);
        this.els.animeffect.offsetWidth;
        this.els.animeffect.className = "active";
        this.shadow.getElementById("slotwrap").classList.add("subdued");
      }
    }
    to_stop_anime() {
      if (this.s.mode === 1) {
        this.s.mode = 2;
        this.els.animeffect.className = "";
        setTimeout(() => {
          this.els.animeffect.remove();
          this.shadow.querySelector("#slotwrap").classList.remove("subdued");
          this.s.mode = 0;
        }, 100);
      }
    }
    sc() {
      render(this.template(), this.shadow);
    }
    template = () => {
      return html`<style>

:host {
    position: relative;
    font-weight: 600;
    display: inline-block;
    padding: 8px 15px 0px 15px;
    border-radius: 22px;
    box-sizing: border-box;
    height: 36px;
    color: gray;
    background-color: white;
    border-color: var(--actioncolor);
    border-width: 1px;
    border-style: solid;
    cursor: pointer;
    transition-property: background-color;
    transition-duration: 0.1s;
    transition-timing-function: ease-in-out;
}
:host(:hover) {
    background-color: #f2f5f6;
}

:host([primary]) {
    border-color: white;
    background-color: var(--actioncolor);
}

:host([primary]) #slotwrap {
    color: white;
    transition: opacity 0.4s ease-in;
}


:host([small]) {
    padding: 2px 10px 0 10px;
    height: 24px;
}

:host #slotwrap.subdued {
    opacity: 0.4;
}

:host c-animeffect {
    position: absolute;
    top: 7px;
    left: calc(50% - 10px);
    width: 20px;
    height: 20px;
}



</style>
<span id="slotwrap">
    <slot></slot>
</span>
`;
    };
  };
  customElements.define("c-btn", CBtn);
})();
