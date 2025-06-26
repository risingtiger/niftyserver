var ModeE = /*#__PURE__*/ function(ModeE) {
    ModeE["alltime"] = "alltime";
    ModeE["monthtodate"] = "monthtodate";
    ModeE["month"] = "month";
    ModeE["custom"] = "custom";
    return ModeE;
}(ModeE || {});
const ATTRIBUTES = {
    machine_record_id: "",
    machine_incrs: "",
    machine_ts: ""
};
class VPMetersReport extends HTMLElement {
    a = {
        ...ATTRIBUTES
    };
    s = {
        mode: "alltime",
        startday: "",
        endday: "",
        months: this.generateLast12Months(),
        meters_report: [],
        reconcile_mode: false
    };
    m = {
        prop: ""
    };
    shadow;
    meterLabels = [
        'Store',
        'Pure 1',
        'Mineral 1',
        'Pure 2',
        'Mineral 2'
    ];
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
        // set to last month so that date selectors are preset to most common use case and easy to slightly adjust from there
        const today = new Date();
        const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        this.s.startday = firstOfLastMonth.toISOString().slice(0, 10);
        this.s.endday = firstOfThisMonth.toISOString().slice(0, 10);
        await $N.CMech.ViewPartConnectedCallback(this);
        await this.setToAllTime();
        this.dispatchEvent(new Event('hydrated'));
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewPartDisconnectedCallback(this);
    }
    kd(_loadeddata, loadstate) {
        if (loadstate === "initial") {
        //
        }
    }
    sc(state_changes = {}) {
        this.s = Object.assign(this.s, state_changes);
        if (this.s.mode !== "alltime") {
            this.s.reconcile_mode = false;
        }
        render(this.template(this.s, this.m), this.shadow);
    }
    generateLast12Months() {
        const months = [];
        const today = new Date();
        for(let i = 1; i <= 12; i++){
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            const label = date.toLocaleString('default', {
                month: 'long',
                year: 'numeric'
            });
            const startday = date.toISOString().slice(0, 7) + '-01';
            const endday = nextMonth.toISOString().slice(0, 7) + '-01';
            months.push({
                label,
                startday,
                endday
            });
        }
        return months;
    }
    async setToMonthToDate() {
        const today = new Date();
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        this.s.mode = "monthtodate";
        this.s.startday = firstOfMonth.toISOString().slice(0, 10);
        this.s.endday = today.toISOString().slice(0, 10);
        await this.retrieveTimeRangeMetersReport();
        this.sc();
    }
    async setToMonth(detail) {
        const monthsindex = Number(detail.newval);
        if (monthsindex === -1) {
            return;
        }
        const month = this.s.months[monthsindex];
        this.s.mode = "month";
        this.s.startday = month.startday;
        this.s.endday = month.endday;
        await this.retrieveTimeRangeMetersReport();
        this.sc();
    }
    handleTypeMonthClick(e) {
        if (!e.target.closest('c-dselect')) {
            const cDselect = this.shadowRoot.querySelector('#select_month');
            if (cDselect) {
                cDselect.setAttribute('open', '');
            }
        }
    }
    updateStartDayFromInput(e) {
        const target = e.target;
        this.s.startday = target.value;
    }
    updateEndDayFromInput(e) {
        const target = e.target;
        this.s.endday = target.value;
    }
    async handleCustomReport() {
        await this.setToCustom(this.s.startday, this.s.endday);
    }
    async setToAllTime() {
        const r = await $N.FetchLassie(`/api/pwt/reports/meters_alltime?machine_record_id=${this.a.machine_record_id}`);
        if (!r.ok) {
            alert("Not able to get All Time Meters - ");
            return;
        }
        this.s.meters_report = r.data[0];
        this.s.mode = "alltime";
        this.sc();
    }
    async setToCustom(startday, endday) {
        this.s.mode = "custom";
        this.s.startday = startday;
        this.s.endday = endday;
        await this.retrieveTimeRangeMetersReport();
        this.sc();
    }
    async retrieveTimeRangeMetersReport() {
        const r = await $N.FetchLassie(`/api/pwt/reports/meters_timerange?machine_record_id=${this.a.machine_record_id}&daystart=${this.s.startday}&dayend=${this.s.endday}`);
        if (!r.ok) {
            alert("Not able to get Time Range Meters - ");
            return;
        }
        this.s.meters_report = r.data;
    }
    meterRowClicked(e) {
        const meterindex = Number(e.currentTarget.dataset.meterindex);
        const value = this.s.meters_report[meterindex].toString();
        navigator.clipboard.writeText(value).catch((err)=>{
            console.error('Failed to copy value to clipboard:', err);
        });
        $N.ToastShow(value + " copied to clipboard");
    }
    getMeterLabel(index) {
        return this.meterLabels[index] || '';
    }
    meterInputChanged(_e, _index) {}
    async reconcileClicked(e) {
        if (this.s.mode !== "alltime") {
            await this.setToAllTime();
            await new Promise((resolve)=>setTimeout(resolve, 100));
        }
        this.s.reconcile_mode = true;
        e.detail.resolved();
        this.sc();
    }
    async reconcileSaveClicked(e) {
        const newMeterValues = [];
        for(let i = 0; i < 5; i++){
            const input = this.shadow.querySelector(`input[name='new_reconcile_meter_${i}']`);
            const value = input ? parseFloat(input.value) || 0 : 0;
            newMeterValues.push(value);
        }
        let confirmstr = `Please verify these updated meters are correct:\n\n${newMeterValues.map((value, i)=>`${this.meterLabels[i]}: ${value.toLocaleString()}`).join('\n')}`;
        if (newMeterValues.every((v, i)=>Math.abs(v - this.s.meters_report[i]) < 10)) {
            this.s.reconcile_mode = false;
            e.detail.resolved();
            this.sc();
            alert("No changes or changes were less than 10.  Not saving reconcile.");
            return false;
        }
        if (!confirm(confirmstr)) {
            this.s.reconcile_mode = false;
            e.detail.resolved();
            this.sc();
            return false;
        }
        const incrs = this.a.machine_incrs.split(",").map((m)=>Number(m));
        const deltas = newMeterValues.map((newmeter, i)=>newmeter - this.s.meters_report[i]).map((m, i)=>Math.round(m / incrs[i]));
        const ts = this.a.machine_ts;
        const r = await $N.FetchLassie(`/api/pwt/machine/${this.a.machine_record_id}/reconcile_meters`, {
            method: 'PUT',
            body: JSON.stringify({
                reconcile: {
                    deltas,
                    ts
                }
            })
        });
        if (!r.ok) {
            alert("Not able to add Reconcile - ");
            return;
        }
        this.s.reconcile_mode = false;
        e.detail.resolved();
        setTimeout(()=>{
            this.setToAllTime();
        }, 300);
        $N.ToastShow("reconcile saved");
    }
    reconcileCancelClicked() {
        this.s.reconcile_mode = false;
        this.sc();
    }
    template = (_s, _m)=>{
        return html`<link rel="stylesheet" href="/assets/main.css">{--css--}{--html--}`;
    };
}
customElements.define('vp-metersreport', VPMetersReport);
export { };
