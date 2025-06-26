(() => {
  // ../../.nifty/files/lazy/components/btn_group/btn_group.js
  var ModeT = function(ModeT2) {
    ModeT2[ModeT2["INERT"] = 0] = "INERT";
    ModeT2[ModeT2["SAVING"] = 1] = "SAVING";
    ModeT2[ModeT2["SAVED"] = 2] = "SAVED";
    return ModeT2;
  }(ModeT || {});
  var CBtnGroup = class extends HTMLElement {
    shadow;
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      this.render();
    }
    render() {
      render(this.template(), this.shadow);
    }
    template = () => {
      return html`<style>

:host {
    display: inline-flex;
}

.btn-group {
    display: inline-flex;
    border-radius: 4px;
    overflow: hidden;
}

::slotted(*) {
    margin: 0;
    border-radius: 0;
    border-right-width: 0;
}

::slotted(*:first-child) {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
}

::slotted(*:last-child) {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-right-width: 1px;
}



</style>
<div class="btn-group">
    <slot></slot>
</div>
`;
    };
  };
  customElements.define("c-btn-group", CBtnGroup);
})();
