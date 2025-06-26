class VPMachineTelemetryMedians extends HTMLElement {
    $;
    s;
    static get observedAttributes() {
        return [
            'fields'
        ];
    }
    constructor(){
        super();
        this.$ = this.querySelector;
        this.s = {
            measurement: "",
            fields: "",
            chip: "",
            aggregate_fn: "",
            unitterms: "",
            medians: []
        };
    }
    async attributeChangedCallback(_name, _oldValue, _newValue) {
        setTimeout(async ()=>{
            this.s.fields = this.getAttribute("fields") || "";
            this.s.chip = this.getAttribute("chip") || "";
            this.s.aggregate_fn = this.getAttribute("aggregate_fn") || "";
            this.s.unitterms = this.getAttribute("unitterms") || "";
            this.s.measurement = this.getAttribute("measurement") || "";
            const end = Math.floor(Date.now() / 1000);
            const begin = end - 86400 * 30;
            if (this.s.fields) this.s.medians = await get_medians(begin, end, this.s.measurement, this.s.fields, this.s.chip, this.s.aggregate_fn);
            else this.s.medians = [];
            this.stateChanged();
            this.dispatchEvent(new Event('hydrated'));
        }, 20);
    }
    stateChanged() {
        render(this.template(this.s), this);
    }
    runit() {}
    template = (_s)=>html`{--htmlcss--}`;
}
customElements.define("vp-machinetelemetry-medians", VPMachineTelemetryMedians);
function get_medians(begin, end, measurement, fields, chip, aggregate_fn) {
    return new Promise(async (res, _rej)=>{
        const m = await InfluxDB.Retrieve_Medians("PWT", [
            begin
        ], [
            end
        ], [
            1
        ], [
            'd'
        ], [
            measurement
        ], [
            fields
        ], [
            "chip:" + chip
        ], [
            aggregate_fn
        ]);
        const medians = m[0];
        res(medians);
    });
}
export { };
