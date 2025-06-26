(() => {
  // ../../.nifty/files/lazy/components/in2/in2.js
  var TypeT = function(TypeT2) {
    TypeT2[TypeT2["INPUT"] = 0] = "INPUT";
    TypeT2[TypeT2["DSELECT"] = 1] = "DSELECT";
    TypeT2[TypeT2["TOGGLE"] = 2] = "TOGGLE";
    return TypeT2;
  }(TypeT || {});
  var ATTRIBUTES = { val: "" };
  var CIn2 = class extends Lit_Element {
    a = { ...ATTRIBUTES };
    s = { val: "", newval: "", issaving: false, err_msg: "", options: "", min: "", max: "", updatemoment: 0 };
    m = { name: "", type: 2, inputtype: "text", label: "", labelwidth: 0, placeholder: "" };
    controlel = document.body;
    animatehandles = { view: null, edit: null };
    keyframes = { view: null, edit: null };
    shadow;
    static get observedAttributes() {
      return Object.keys(ATTRIBUTES);
    }
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      const attr_typestr = this.getAttribute("type") || "text";
      this.s.val = this.getAttribute("val") || "";
      this.m.label = this.getAttribute("label") || "";
      this.m.labelwidth = parseInt(this.getAttribute("labelwidth") || "125");
      this.m.name = this.getAttribute("name") || "";
      this.s.options = this.getAttribute("options") || "";
      this.s.min = this.getAttribute("min") || "";
      this.s.max = this.getAttribute("max") || "";
      this.a.val = this.s.val;
      if (attr_typestr === "toggle") {
        this.m.type = 2;
        this.m.inputtype = "none";
      } else if (attr_typestr === "dselect") {
        this.m.type = 1;
        this.m.inputtype = "none";
      } else {
        this.m.type = 0;
        this.m.inputtype = attr_typestr;
      }
      this.addEventListener("click", (e) => this.clicked(e), true);
      this.sc();
      this.controlel = this.shadow.querySelector(".controlel");
    }
    async attributeChangedCallback(name, oldval, newval) {
      if (oldval === null) return;
      const a = this.a;
      a[name] = newval;
      if (name === "val") {
        this.s.val = newval;
      }
      if (!a.updatescheduled) {
        a.updatescheduled = true;
        Promise.resolve().then(() => {
          this.sc();
          a.updatescheduled = false;
        });
      }
    }
    sc() {
      render(this.template(this.a, this.s, this.m), this.shadow);
    }
    updatedone(newval) {
      const diff = Date.now() - this.s.updatemoment;
      if (diff > 1e3) {
        this.setAttribute("val", newval || this.s.newval);
        this.s.issaving = false;
        this.sc();
      } else {
        setTimeout(() => {
          this.setAttribute("val", newval || this.s.newval);
          this.s.issaving = false;
          this.sc();
        }, 1e3);
      }
    }
    updatefailed(reverttoval, _error) {
      const diff = Date.now() - this.s.updatemoment;
      if (diff > 1e3) {
        this.setAttribute("val", reverttoval || this.s.val);
      } else {
        setTimeout(() => {
          this.setAttribute("val", reverttoval || this.s.val);
        }, 1e3);
      }
    }
    clicked(_e) {
    }
    inputchanged() {
      this.dispatchEvent(new CustomEvent("input", { detail: { name: this.m.name, newval: this.s.newval, oldval: this.s.val } }));
    }
    focused() {
      this.controlel.select();
      this.sc();
    }
    blurred() {
      const val = this.controlel.value || "";
      if (val !== this.s.val) {
        confirm("Do you want to save changes?") ? this.runupdate() : console.log("nope");
      }
    }
    keyupped(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.runupdate();
        this.sc();
      }
    }
    dselect_updated() {
      this.runupdate();
      this.sc();
    }
    toggle_toggled(e) {
      const el = e.currentTarget;
      el.classList.add("animate");
      if (this.s.val === "true") {
        el.classList.remove("istrue");
      } else {
        el.classList.add("istrue");
      }
      this.runupdate();
    }
    actionicon_clicked(_e) {
      this.controlel.focus();
    }
    label_clicked(_e) {
      this.controlel.focus();
    }
    rendercontrol() {
      if (this.m.type === 2) {
        return html`<span 
							class="switch ${this.s.val === "true" ? "istrue" : ""}"
							@click="${(e) => this.toggle_toggled(e)}"
							class="controlel"><span class="inner"></span></span>`;
      } else if (this.m.type === 1) {
        return html`<c-dselect 
							options="${this.getAttribute("options") || ""}" 
							@update="${() => this.dselect_updated()}" 
							val="${this.s.val}"></c-dselect>`;
      } else if (this.m.type === 0) {
        let minmax = this.s.min ? `min="${this.s.min}"` : "";
        minmax += this.s.max ? ` max="${this.s.max}"` : "";
        return html`
				<input 
							@input="${() => this.inputchanged()}"  
							@blur="${() => this.blurred()}" 
							@focus="${() => this.focused()}" 
							@keyup="${(e) => this.keyupped(e)}" 
							class="controlel"
							type="${this.m.inputtype}" 
							value="${this.s.val}" 
							placeholder="${this.m.placeholder}" 
							enterkeyhint="done" ${minmax} name="${this.m.name}"></input>`;
      }
    }
    runupdate() {
      if (this.m.type === 2) {
        const toggleel = this.shadow.querySelector(".switch");
        this.s.newval = toggleel.classList.contains("istrue") ? "true" : "false";
      } else if (this.m.type === 0) {
        const inputel = this.shadow.querySelector("input");
        this.s.newval = inputel.value;
      } else if (this.m.type === 1) {
        const dselectel = this.shadow.querySelector("c-dselect");
        this.s.newval = dselectel.getAttribute("val");
      }
      if (this.s.newval === this.s.val) {
        this.s.newval = "";
        return;
      }
      this.s.updatemoment = Date.now();
      this.dispatchEvent(new CustomEvent("update", { detail: { name: this.m.name, newval: this.s.newval, oldval: this.s.val, failed: this.updatefailed.bind(this), done: this.updatedone.bind(this) } }));
      this.s.issaving = true;
      this.sc();
    }
    template = (_a, _s, _m) => {
      return html`<style>:host {
    color: orange;
    -webkit-font-smoothing: antialiased;
    display: flex;
    -webkit-font-smoothing: antialiased;
    position: relative;
    box-sizing: border-box;
    justify-content: space-between;
    flex-wrap: nowrap;
    text-indent: 0;

    padding-left: 11px;
    height: 52px;
    border-bottom-width: 0.5px;
    border-bottom-style: solid;
    border-bottom-color: var(--bordercolor);
    padding-right: 8px;
}


:host > label {
    overflow: hidden;
    text-wrap: nowrap;
    margin-right: 6px;
    font-family: var(--fontfamily);
    font-weight: 700;
    color: rgb(190 56 151);
    padding: 17px 0 0 0px;
}
:host > label::after {
    content: ":";
}

:host > section {
    position: relative;
    flex: 1;
	padding-right: 20px;


	& > i.icon {
		display:block;
		position:absolute;
		right: 0px;
		font-family: icons !important;
		font-style: normal;
		font-weight: normal !important;
		font-variant: normal;
		text-transform: none;
		-webkit-font-smoothing: antialiased;
	}
	& > i.icon::before {
		font-size: 18px;
		color: var(--actioncolor);
		padding: 20px 0px 0 13px;
		cursor: pointer;
	}

}

c-animeffect {
	position: absolute;
	opacity: 1;
	top: 9px;
	right: 4px;
	width: 18px;
	height: 18px;
}
c-animeffect.active {
	opacity: 1;
}


c-dselect + c-animeffect {
	top: 8px;
	right: 5px;
}


.switch + c-animeffect {
	top: 7px;
	right: 3px;
}

:host input {
	font-size: var(--textsize);
	height: 35px;
	box-sizing: border-box;
	outline: none;
	border: none;
	border-radius: 4px;
	border: 1px solid #dcdcdc;
	padding: 7px 5px 8px 8px;
	color: #6d6d6d;
	display: block;
	margin-top: 0;
	width: 100%;
	height: 39px;
}

:host c-dselect {
	display: block;
	width: 100%;
}

:host span.switch {
    position: relative;
    display: inline-block;
    border-width: 1px;
    border-color: rgb(0 0 0 / 16%);
    border-style: solid;
    border-radius: 52px;
    background-color: #fff;
    width: 30px;
    height: 18px;
    user-select: none;

    margin-top: 6px;
    margin-right: 2px;

    & > .inner {
        position: relative;
        display: block;
        width: 14px;
        height: 14px;
        margin-top: 2px;
        border-radius: 50%;
        background-color: #d9dadc;
        user-select: none;
        transform: translateX(2px);
    }
}
:host span.switch.animate {
	transition: 0.4s cubic-bezier(0.73, 0.01, 0.28, 1);
	transition-property: background-color, border-color, transform;

	& > .inner {
		transition: 0.4s cubic-bezier(0.73, 0.01, 0.28, 1);
		transition-property: background-color, transform;
	}
}
:host span.switch.istrue {
    border-color: rgba(255, 255, 255, 0);
    background-color: #36cf90;

    & > .inner {
        background-color: white;
        transform: translateX(14px);
    }
}

</style>
<label part="label" @click="${(e) => this.label_clicked(e)}" style="width: ${_m.labelwidth}px;">${_m.label}</label>
<section>
	<i class="icon" @click="${(e) => this.actionicon_clicked(e)}"></i>
	${_s.issaving ? html`<c-animeffect active></c-animeffect>` : ""}
	${this.rendercontrol()}
</section>
`;
    };
  };
  customElements.define("c-in2", CIn2);
})();
