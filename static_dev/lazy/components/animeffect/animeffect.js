var WhatE = /*#__PURE__*/ function(WhatE) {
    WhatE[WhatE["INIT"] = 0] = "INIT";
    WhatE[WhatE["SPIN"] = 1] = "SPIN";
    return WhatE;
}(WhatE || {});
class CAnimeffect extends HTMLElement {
    s;
    m;
    shadow;
    static get observedAttributes() {
        return [
            'active'
        ];
    }
    constructor(){
        super();
        this.shadow = this.attachShadow({
            mode: 'open'
        });
        this.s = {
            what: 0
        };
    }
    connectedCallback() {}
    async attributeChangedCallback(name, _old_val, new_val) {
        if (name === "active" && new_val === "") {
            if (this.s.what === 0) {
                switch(this.getAttribute("what")){
                    case "spin":
                        this.s.what = 1;
                        break;
                    default:
                        this.s.what = 1;
                        break;
                }
                this.sc();
            }
        }
    }
    sc() {
        render(this.template(this.s, this.m), this.shadow);
    }
    template = (_s, _m)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('c-animeffect', CAnimeffect);
export { };
