var ModeT = /*#__PURE__*/ function(ModeT) {
    ModeT[ModeT["CLOSED"] = 0] = "CLOSED";
    ModeT[ModeT["OPEN"] = 1] = "OPEN";
    ModeT[ModeT["OPENING"] = 2] = "OPENING";
    ModeT[ModeT["CLOSING"] = 3] = "CLOSING";
    return ModeT;
}(ModeT || {});
var LevelT = /*#__PURE__*/ function(LevelT) {
    LevelT[LevelT["INFO"] = 0] = "INFO";
    LevelT[LevelT["SAVED"] = 1] = "SAVED";
    LevelT[LevelT["SUCCESS"] = 2] = "SUCCESS";
    LevelT[LevelT["WARNING"] = 3] = "WARNING";
    LevelT[LevelT["ERROR"] = 4] = "ERROR";
    return LevelT;
}(LevelT || {});
const DEFAULT_DURATION = 2000;
const DUMMYEL = document.createElement("div");
class CToast extends HTMLElement {
    s;
    m;
    els;
    shadow;
    static get observedAttributes() {
        return [
            'action'
        ];
    }
    constructor(){
        super();
        this.shadow = this.attachShadow({
            mode: 'open'
        });
        this.s = {
            mode: 0,
            level: 0,
            isanimating: false,
            msg: "",
            level_class: ""
        };
        this.m = {
            c: ""
        };
        this.els = {
            msg: DUMMYEL
        };
    }
    connectedCallback() {
        this.sc();
    }
    async attributeChangedCallback(name, oldval, newval) {
        if (name == "action" && newval === 'run' && (oldval === '' || oldval === null)) {
            const msg = this.getAttribute("msg") || "";
            const level = this.getAttribute("level") || "0";
            const duration = this.getAttribute("duration") || DEFAULT_DURATION;
            await this.action(msg, Number(level), Number(duration));
            this.setAttribute("action", "");
        }
    }
    action(msg, level, duration) {
        return new Promise((res)=>{
            duration = duration || DEFAULT_DURATION;
            this.els.msg = this.shadow.getElementById("msg");
            this.els.msg.textContent = msg;
            switch(level){
                case 0:
                    this.classList.add("level_info");
                    break;
                case 1:
                    this.classList.add("level_saved");
                    break;
                case 2:
                    this.classList.add("level_success");
                    break;
                case 3:
                    this.classList.add("level_warning");
                    break;
                case 4:
                    this.classList.add("level_error");
                    break;
            }
            this.style.display = "block";
            this.offsetHeight;
            this.classList.add("active");
            setTimeout(()=>{
                this.classList.remove("active");
                this.addEventListener("transitionend", transitionend);
            }, duration);
            function transitionend() {
                this.removeEventListener("transitionend", transitionend);
                this.style.display = "none";
                this.dispatchEvent(new CustomEvent('done'));
                res(1);
            }
        });
    }
    sc() {
        render(this.template(), this.shadow);
    }
    template = ()=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('c-toast', CToast);
export { };
