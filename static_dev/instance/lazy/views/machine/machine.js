const ATTRIBUTES = {
    propa: ""
};
class VMachine extends HTMLElement {
    m = {
        machine: {}
    };
    a = {
        ...ATTRIBUTES
    };
    s = {
        show_details: 0,
        show_edit: 0,
        show_map: 0,
        show_metersreport: 0
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
    kd(loadeddata, loadstate, pathparams, _searchparams) {
        if (loadstate === "initial" || loadstate === "datachanged") {
            const machines = loadeddata.get('1:machines/' + pathparams.id); // is one row in an array
            this.m.machine = machines[0];
        }
    }
    disconnectedCallback() {
        $N.CMech.ViewDisconnectedCallback(this);
    }
    sc(state_changes = {}) {
        this.s = Object.assign(this.s, state_changes);
        render(this.template(this.s, this.m), this.shadow);
    }
    editdone() {
        this.s.show_edit = 0;
        this.sc();
    }
    actions_menu_selected(e) {
        switch(e.detail.newval){
            case "details":
                this.show_details();
                break;
            case "edit":
                this.show_edit();
                break;
            case "map":
                this.show_map();
                break;
            case "telemetry":
                this.show_telemetry();
                break;
            case "metersreport":
                this.show_metersreport();
                break;
        }
    }
    show_details() {
        this.s.show_details = 1;
        this.sc();
    }
    show_edit() {
        this.s.show_edit = 1;
        this.sc();
    }
    async show_map() {
        this.s.show_map = 1;
        this.sc();
    }
    async show_metersreport() {
        this.s.show_metersreport = 1;
        this.sc();
    }
    show_telemetry() {
        if (this.m.machine.machineid === "0000000") {
            alert("This machine has no telemetry");
            return;
        } else {
            $N.SwitchStation.NavigateTo(`machines/${this.m.machine.id}/telemetry`);
        }
    }
    template = (_s, _m)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('v-machine', VMachine);
export { };
