var ModeT = /*#__PURE__*/ function(ModeT) {
    ModeT[ModeT["INERT"] = 0] = "INERT";
    ModeT[ModeT["SAVING"] = 1] = "SAVING";
    ModeT[ModeT["SAVED"] = 2] = "SAVED";
    return ModeT;
}(ModeT || {});
class CBtn extends HTMLElement {
    s;
    m;
    els;
    shadow;
    constructor(){
        super();
        this.shadow = this.attachShadow({
            mode: 'open'
        });
        this.s = {
            mode: 0
        };
        this.m = {
            show_anime_on_click: true
        };
        this.els = {
            animeffect: null
        };
    }
    connectedCallback() {
        this.m.show_anime_on_click = this.hasAttribute("noanime") ? false : true;
        this.sc();
        this.addEventListener("click", ()=>{
            this.is_clicked();
        });
    }
    async attributeChangedCallback(_name, _oldval, _newval) {}
    done() {
        this.to_stop_anime();
    }
    is_clicked() {
        if (this.s.mode == 0) {
            if (this.m.show_anime_on_click) this.to_start_anime();
            this.dispatchEvent(new CustomEvent("btnclick", {
                detail: {
                    resolved: this.done.bind(this)
                }
            }));
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
            setTimeout(()=>{
                this.els.animeffect.remove();
                this.shadow.querySelector("#slotwrap").classList.remove("subdued");
                this.s.mode = 0;
            }, 100);
        }
    }
    sc() {
        render(this.template(), this.shadow);
    }
    template = ()=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('c-btn', CBtn);
export { };
