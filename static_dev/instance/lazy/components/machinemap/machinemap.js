const ATTRIBUTES = {
    machine_record_id: ""
};
class VPMachineMap extends HTMLElement {
    a = {
        ...ATTRIBUTES
    };
    m = {
        lat: 0,
        lon: 0,
        storedistance: 0,
        ts: 0,
        sourcedfrom: "database",
        errmsg: ""
    };
    s = {
        success: false,
        isold: false,
        istoofar: false
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
        await $N.CMech.ViewPartConnectedCallback(this);
        const r = await $N.FetchLassie(`/api/pwt/chip_gps?id=${this.a.machine_record_id}`, {});
        if (!r.ok) {
            this.m.lat = 0;
            this.m.lon = 0;
            this.s.success = false;
            this.m.storedistance = 0;
            this.m.ts = 0;
            console.log("map fetch error: ", r.statusText);
        } else {
            const rd = r.data;
            this.m.sourcedfrom = rd.sourcedfrom || "";
            this.m.lat = rd.lat;
            this.m.lon = rd.lon;
            this.s.success = rd.lat !== 0 && rd.lon !== 0;
            this.m.storedistance = rd.storedistance || 0;
            this.m.errmsg = r.statusText || "";
            this.m.ts = rd.ts || 0;
            const now = new Date().getTime() / 1000;
            if (now - this.m.ts > 60 * 60 * 24 * 7) {
                this.s.isold = true;
            }
            if (this.m.storedistance > 6) {
                this.s.istoofar = true;
            }
        }
        this.sc();
        this.dispatchEvent(new Event('hydrated'));
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewPartDisconnectedCallback(this);
    }
    kd(_loadeddata, loadstate) {
        if (loadstate === "initial") {} else if (loadstate === "lateloaded") {
        // loaded
        }
    }
    sc() {
        render(this.template(this.s, this.m), this.shadow);
    }
    template = (_s, _m)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('vp-machine-map', VPMachineMap);
export { };
