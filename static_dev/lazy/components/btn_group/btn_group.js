var ModeT = /*#__PURE__*/ function(ModeT) {
    ModeT[ModeT["INERT"] = 0] = "INERT";
    ModeT[ModeT["SAVING"] = 1] = "SAVING";
    ModeT[ModeT["SAVED"] = 2] = "SAVED";
    return ModeT;
}(ModeT || {});
class CBtnGroup extends HTMLElement {
    shadow;
    constructor(){
        super();
        this.shadow = this.attachShadow({
            mode: 'open'
        });
    }
    connectedCallback() {
        this.render();
    }
    render() {
        render(this.template(), this.shadow);
    }
    template = ()=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('c-btn-group', CBtnGroup);
export { };
