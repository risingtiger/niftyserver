const ATTRIBUTES = {
    propa: ""
};
class VAppMsgs extends HTMLElement {
    m = {
        propa: ""
    };
    a = {
        ...ATTRIBUTES
    };
    s = {
        showlogs: false,
        showappupdated: false,
        showdatawipe: false,
        show_gen_logsubj: false,
        logs: [],
        logsubj: ""
    };
    shadow;
    static get observedAttributes() {
        return Object.keys(ATTRIBUTES);
    }
    constructor(){
        super();
        this.shadow = this.attachShadow({
            mode: 'open'
        });
    }
    async connectedCallback() {
        await $N.CMech.ViewConnectedCallback(this);
        this.dispatchEvent(new Event('hydrated'));
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewDisconnectedCallback(this);
    }
    kd(_loadeddata, loadstate, _pathparams, searchparams) {
        if (loadstate === 'initial' || loadstate === 'searchchanged') {
            this.s.logsubj = searchparams.logsubj || '';
            this.s.showappupdated = searchparams.appupdate || false;
            if (searchparams.appupdate) {
                this.s.showappupdated = true;
            } else if (this.s.logsubj === 'ldr') {
                this.s.showdatawipe = true;
            } else if (this.s.logsubj) {
                this.s.show_gen_logsubj = true;
            }
        }
    }
    sc() {
        render(this.template(this.s), this.shadow);
    }
    show_logs() {
        const l = localStorage.getItem('logs');
        this.s.logs = l && l.includes('-') ? l.split('-') : [
            l || ''
        ];
        this.s.showlogs = true;
        this.sc();
    }
    template = (s)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('v-appmsgs', VAppMsgs);
export { };
