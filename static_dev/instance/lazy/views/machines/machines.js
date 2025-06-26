const ATTRIBUTES = {
    propa: ""
};
let filterbymap = new Map([
    [
        "storename",
        ""
    ],
    [
        "storeid",
        ""
    ],
    [
        "machineid",
        ""
    ],
    [
        "chip",
        ""
    ],
    [
        "serial",
        ""
    ]
]);
const month_abbr = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];
class VMachines extends HTMLElement {
    s = {
        filtered_sorted_machines: [],
        sortby: "state",
        show_addmachine: 0,
        show_logs: 0,
        meters_report_view: {
            show: 0,
            machine_record_id: "",
            machine_incrs: [],
            machine_ts: 0,
            header_name: ""
        },
        details_view: {
            show: 0,
            machine_record_id: ""
        },
        map_view: {
            show: 0,
            machine_record_id: ""
        },
        filterby: filterbymap,
        retrieve_tries: 0
    };
    m = {
        machines: []
    };
    a = {
        ...ATTRIBUTES
    };
    shadow;
    static get observedAttributes() {
        return Object.keys(ATTRIBUTES);
    }
    tmpycount = 0;
    tempnoti() {
        const i = Math.floor(Math.random() * this.m.machines.length);
        const m = this.m.machines[i];
        const oldbits = parse_bits(m.state.latest, this.m.machines[i].particle.id);
        const newbits = JSON.parse(JSON.stringify(oldbits));
        if (this.tmpycount === 0) {
            newbits.procpwr = 1;
            this.tmpycount = 1;
        } else if (this.tmpycount === 1) {
            newbits.tnklvl = 1;
            this.tmpycount = 2;
        } else if (this.tmpycount === 2) {
            newbits.srvdr1 = 1;
            this.tmpycount = 3;
        } else if (this.tmpycount === 3) {
            newbits.uvblb1 = 1;
            this.tmpycount = 0;
        }
        this.handleUpdateToNotification(m, newbits, oldbits);
    }
    constructor(){
        super();
        let fbstr = localStorage.getItem("filterby");
        if (fbstr && fbstr != "" && fbstr != "{}" && fbstr != "[]") {
            filterbymap = new Map(JSON.parse(fbstr));
        } else {
            localStorage.setItem("filterby", "[]");
        }
        this.shadow = this.attachShadow({
            mode: 'open'
        });
    }
    async connectedCallback() {
        await $N.CMech.ViewConnectedCallback(this);
        this.dispatchEvent(new Event('hydrated'));
        $N.SSEvents.Add_Listener(document.body, "machines_for_notification", [
            2
        ], 10, (event)=>{
            const machinepathregex = /^machines\/([^/]+)$/;
            const match = event.path.match(machinepathregex);
            if (!match) return;
            const oldmachine = this.m.machines.find((m)=>m.id === match[1]);
            if (!oldmachine) return;
            const oldbits = parse_bits(oldmachine.state.latest, oldmachine.particle.id);
            const newbits = parse_bits(event.data?.state?.latest ?? {}, event.data?.particle?.id);
            this.handleUpdateToNotification(event.data, newbits, oldbits);
        });
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewDisconnectedCallback(this);
    }
    kd = (loadeddata, loadstate, _pathparams, _searchparams)=>{
        if (loadstate === "initial" || loadstate === "datachanged") {
            this.m.machines = loadeddata.get('1:machines');
        }
        this.aux_data();
    };
    filterkeyup(e) {
        this.s.filterby = set_filterby(e.currentTarget, e.key, this.s.filterby);
        const filtered_machines = get_filtered_machines(this.s.filterby, this.m.machines);
        this.s.filtered_sorted_machines = get_sorted_machines(this.s.sortby, filtered_machines);
        localStorage.setItem("filterby", JSON.stringify(Array.from(this.s.filterby.entries())));
        this.aux_data();
        this.sc();
    }
    ShowAddMachineUI() {
        this.s.show_addmachine = 1;
        this.sc();
    }
    FilterFocus(e) {
        e.currentTarget.select();
    }
    gotoMachine(id) {
        $N.SwitchStation.NavigateTo(`machines/${id}`);
    }
    meters_report_clicked(e) {
        this.s.meters_report_view.show = 1;
        this.s.meters_report_view.machine_record_id = e.currentTarget.getAttribute("data-machine_record_id");
        const m = this.m.machines.find((m)=>m.id === this.s.meters_report_view.machine_record_id);
        this.s.meters_report_view.machine_incrs = m.incrs;
        this.s.meters_report_view.machine_ts = m.ts;
        this.s.meters_report_view.header_name = m.store.brand ? m.store.brand + ' ' + m.store.city + ', ' + m.store.state : m.store.name;
        this.sc();
        e.stopPropagation();
    }
    show_details(e) {
        this.s.details_view.show = 1;
        this.s.details_view.machine_record_id = e.currentTarget.getAttribute("data-machine_record_id");
        this.sc();
        e.stopPropagation();
    }
    show_map(e) {
        this.s.map_view.show = 1;
        this.s.map_view.machine_record_id = e.currentTarget.getAttribute("data-machine_record_id");
        this.sc();
        e.stopPropagation();
    }
    handleUpdateToNotification(updated_machine, newbits, oldbits) {
        let alerts = [];
        if (newbits.procpwr && !oldbits.procpwr) alerts.push({
            bitName: "procpwr",
            type: 'error',
            message: "Processor Power Out"
        });
        if (newbits.drppan && !oldbits.drppan) alerts.push({
            bitName: "drppan",
            type: 'error',
            message: "Drip Pan Over"
        });
        if (newbits.smpovr1 && !oldbits.smpovr1 || newbits.smpovr2 && !oldbits.smpovr2) alerts.push({
            bitName: "smpovr",
            type: 'error',
            message: "Sump Over"
        });
        if (newbits.uvblb1 && !oldbits.uvblb1 || newbits.uvblb2 && !oldbits.uvblb2) alerts.push({
            bitName: "uvblb",
            type: 'error',
            message: "UV Bulb Out"
        });
        if (newbits.loramia && !oldbits.loramia) alerts.push({
            bitName: "loramia",
            type: 'error',
            message: "LoRa chip isn't calling in"
        });
        if (alerts.length > 0) {
            const el = this.shadow.querySelector('vp-machine-notification');
            const title = get_title(updated_machine);
            alerts.forEach((alert)=>{
                el.addNotification(title, alert.message, updated_machine.ts, alert.bitName, alert.type);
            });
        }
    }
    showLogs() {
        this.s.show_logs = 1;
        this.sc();
    }
    sc(state_changes = {}) {
        this.s = Object.assign(this.s, state_changes);
        render(this.template(this.s, this.m), this.shadow);
    }
    aux_data() {
        this.m.machines.forEach((m)=>{
            m.machineid = m.machineid;
            m.chip = m.chip;
            m.store.id = m.store.id;
            const now = Date.now();
            const ts_d = new Date(m.ts * 1000);
            const bits = parse_bits(m.state.latest, m.particle.id);
            const { errmsg, warnmsg, infomsg } = get_states(bits);
            const chip_num = Number(m.chip);
            m.d = get_last_callin(m.ts);
            m.stateToShow = 5;
            m.stateToShowColor = "recovered";
            if (!m.state.active) {
                m.stateToShow = 7;
                m.stateToShowColor = "inactive";
            } else if (chip_num > 0 && chip_num <= 10) {
                m.stateToShow = 6;
                m.stateToShowColor = "testing";
            //} else if (ts_d.getTime() < (now - (86400000*2))) {
            } else if (ts_d.getTime() < now - 86400000 * 30) {
                m.stateToShow = 1;
                m.stateToShowColor = "offline";
            } else if (errmsg) {
                m.stateToShow = 2;
                m.stateToShowColor = "error";
            } else if (warnmsg) {
                m.stateToShow = 3;
                m.stateToShowColor = "warn";
            } else if (infomsg) {
                m.stateToShow = 4;
                m.stateToShowColor = "info";
            }
            if (errmsg) m.msg = errmsg;
            else if (warnmsg) m.msg = warnmsg;
            else if (infomsg) m.msg = infomsg;
            else if (m.stateToShow === 1) m.msg = "Offline";
            else m.msg = "Ok";
        });
        const filtered_machines = get_filtered_machines(this.s.filterby, this.m.machines);
        this.s.filtered_sorted_machines = get_sorted_machines(this.s.sortby, filtered_machines);
    }
    template = (_s, _m)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define("v-machines", VMachines);
function get_filtered_machines(filterby, machines) {
    let m = machines.map((machine)=>machine);
    m = m.filter((m)=>{
        const str = m.store.brand ? m.store.brand.toLowerCase() + " " + m.store.city.toLowerCase() + ", " + m.store.state.toLowerCase() : m.store.name.toLowerCase();
        return str.includes(filterby.get("storename"));
    });
    m = m.filter((m)=>m.store.id.toLowerCase().includes(filterby.get("storeid")));
    m = m.filter((m)=>m.machineid.toLowerCase().includes(filterby.get("machineid")));
    m = m.filter((m)=>m.chip.includes(filterby.get("chip")));
    m = m.filter((m)=>m.particle.serial.toLowerCase().includes(filterby.get("serial")));
    return m;
}
function get_sorted_machines(sortby, machines) {
    const m = machines.map((machine)=>machine);
    if (sortby === "state") {
        m.sort((a, b)=>{
            return a.stateToShow > b.stateToShow ? 1 : -1;
        });
    }
    return m;
}
function parse_bits(bitStr, particle_id) {
    const snB1 = bitStr.charCodeAt(0);
    const snB2 = bitStr.charCodeAt(1);
    const snB3 = bitStr.charCodeAt(2);
    let bitsXp = {};
    if (particle_id !== "e00fce68c42d8d0b3a8d019a") {
        bitsXp = {
            procpwr: snB2 >> 4 & 1,
            drppan: snB1 >> 5 & 1,
            tnklvl: snB1 >> 4 & 1,
            afltlw: snB1 >> 3 & 1,
            dsppwr1: snB2 >> 5 & 1,
            nzl1: snB1 >> 0 & 1,
            smpovr1: snB1 >> 2 & 1,
            uvblb1: snB1 >> 1 & 1,
            srvdr1: snB2 >> 3 & 1,
            nzl2: snB3 >> 5 & 1,
            smpovr2: snB2 >> 2 & 1,
            uvblb2: snB2 >> 1 & 1,
            srvdr2: snB2 >> 0 & 1,
            loramia: snB3 >> 4 & 1
        };
    } else if (particle_id === "e00fce68c42d8d0b3a8d019a") {
        bitsXp = {
            procpwr: 0,
            drppan: snB1 >> 4 & 1,
            tnklvl: snB1 >> 3 & 1,
            afltlw: snB1 >> 2 & 1,
            dsppwr1: snB1 >> 1 & 1,
            smpovr1: snB1 >> 0 & 1,
            smptime: snB2 >> 5 & 1,
            smptime_b: snB2 >> 4 & 1,
            uvblb1: snB2 >> 3 & 1,
            uvblb2: snB2 >> 2 & 1,
            srvdr1: snB2 >> 1 & 1,
            loramia: snB2 >> 0 & 1,
            smpovr2: 0,
            nzl1: 0,
            nzl2: 0,
            srvdr2: 0
        };
    }
    return bitsXp;
}
function get_states(bitsXp) {
    let errmsg = "";
    let warnmsg = "";
    let infomsg = "";
    if (bitsXp.procpwr) errmsg = "Processor Power";
    else if (bitsXp.drppan) errmsg = "Drip Pan";
    else if (bitsXp.smpovr1 || bitsXp.smpovr2) errmsg = "Sump Over";
    else if (bitsXp.uvblb1 || bitsXp.uvblb2) errmsg = "UV Bulb";
    else if (bitsXp.loramia) errmsg = "LoRa MIA";
    if (bitsXp.tnklvl) warnmsg = "Tank Level";
    else if (bitsXp.afltlw) warnmsg = "After Filter";
    else if (bitsXp.dsppwr1) warnmsg = "Dispenser Power";
    else if (bitsXp.nzl1 || bitsXp.nzl2) warnmsg = "Nozzle Stuck";
    if (bitsXp.srvdr1 || bitsXp.srvdr1) infomsg = "Service Door";
    return {
        errmsg,
        warnmsg,
        infomsg
    };
}
function get_last_callin(machine_ts) {
    const date = new Date(machine_ts * 1000);
    const dstr = month_abbr[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
    return dstr;
}
function get_title(m) {
    return m.store.brand ? m.store.brand + " " + m.store.city + ", " + m.store.state : m.store.name;
}
function set_filterby(form_element, key, filterby) {
    if (key === "Shift") {
        return filterby;
    }
    const fb = new Map(filterby.entries());
    let val = form_element.value.toLowerCase();
    fb.set(form_element.name, val);
    return fb;
}
export { };
