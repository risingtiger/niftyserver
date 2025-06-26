const ATTRIBUTES = {
    propa: ""
};
class VMachineTelemetry extends HTMLElement {
    a = {
        ...ATTRIBUTES
    };
    s = {
        what: "",
        run_graph_update: 0,
        storename: '',
        begintime: 0,
        datestr: "",
        whatstr: "",
        timezone: "Denver",
        measurement: "",
        fields: [],
        tags: "",
        type: "line",
        intrv: 0,
        ppf: 0,
        priors: "",
        ismdn: true,
        lowhigh: "",
        unitterms: "",
        median_fields: "",
        median_fn: "",
        aggregate_str: "",
        statusrow_begin: 0,
        show_controls: 0
    };
    m = {
        machine: {}
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
    kd = (loadeddata, loadstate, pathparams)=>{
        if (loadstate === "initial" || loadstate === "datachanged") {
            const m = loadeddata.get(`1:machines/${pathparams.id}`);
            this.m.machine = m[0];
            this.s.begintime = get_machines_midnight_UTC_time(this.s.timezone);
            this.s.datestr = get_localized_date_str(this.s.begintime, this.s.timezone);
            this.Set_It({
                what: "meter_store"
            });
        }
    };
    sc(state_changes = {}) {
        this.s = Object.assign(this.s, state_changes);
        render(this.template(this.s, this.m), this.shadow);
    }
    Set_It(opt = {}) {
        const prev_s = JSON.parse(JSON.stringify(this.s));
        if (opt.what) {
            this.s.what = opt.what;
            switch(opt.what){
                case "meter_store":
                    this.s.whatstr = "Store Meter";
                    this.s.measurement = "MTR", this.s.fields = [
                        {
                            name: "Store",
                            active: true
                        },
                        {
                            name: "Pure1",
                            active: false
                        },
                        {
                            name: "Pure2",
                            active: false
                        },
                        {
                            name: "Mineral1",
                            active: false
                        }
                    ];
                    this.s.tags = "machine:" + this.m.machine.machineid;
                    this.s.type = "bar";
                    this.s.priors = "";
                    this.s.ismdn = true;
                    this.s.lowhigh = "0,120";
                    this.s.unitterms = "Gallons,gal";
                    this.s.median_fields = "";
                    this.s.median_fn = "sum";
                    this.s.aggregate_str = "1_h";
                    this.s.statusrow_begin = 0;
                    break;
                case "psi":
                    this.s.whatstr = "PSI";
                    this.s.measurement = "PSI";
                    this.s.fields = [
                        {
                            name: "Filter",
                            active: true
                        },
                        {
                            name: "Tank",
                            active: true
                        }
                    ];
                    this.s.tags = "machine:" + this.m.machine.machineid;
                    this.s.type = "line";
                    this.s.priors = "";
                    this.s.ismdn = true;
                    this.s.lowhigh = "0,120";
                    this.s.unitterms = "PSI,psi";
                    this.s.median_fields = "";
                    this.s.median_fn = "median";
                    this.s.aggregate_str = "2_h";
                    this.s.statusrow_begin = 0;
                    break;
            }
        } else if (opt.begintime) {
            this.s.begintime = opt.begintime;
            this.s.datestr = get_localized_date_str(this.s.begintime, this.s.timezone);
        } else {
            this.s.aggregate_str = opt.aggregate_str ? opt.aggregate_str : this.s.aggregate_str;
            this.s.tags = opt.xtratags ? "machine:" + this.m.machine.machineid + "," + opt.xtratags : this.s.tags;
            if (opt.xtratags !== undefined) {
                this.s.tags = "machine:" + this.m.machine.machineid + "," + opt.xtratags;
                this.s.fields.forEach((f, i)=>{
                    f.active = i === 0 ? true : false;
                });
                this.s.priors = "";
                this.s.aggregate_str = "4_h";
            }
            if (opt.field !== undefined) {
                if (this.s.tags.split(",").length > 1 || this.s.priors !== "") {
                    this.s.fields.forEach((f)=>{
                        f.active = f.name === opt.field ? true : false;
                    });
                } else {
                    const f = this.s.fields.find((f)=>f.name === opt.field);
                    f.active = f.active ? false : true;
                }
            }
            if (opt.priors !== undefined) {
                this.s.priors = opt.priors;
                this.s.tags = "machine:" + this.m.machine.machineid;
                this.s.fields.forEach((f, i)=>{
                    f.active = i === 0 ? true : false;
                });
                this.s.aggregate_str = "4_h";
            }
        }
        const split = this.s.aggregate_str.split("_");
        const val = Number(split[0]);
        const unit = split[1];
        const seconds = unit === "m" ? val * 60 : val * 3600 // minutes or hours
        ;
        this.s.intrv = seconds;
        this.s.ppf = 86400 / seconds;
        if (this.s.median_fields) {
            this.s.median_fields = this.s.fields.map((f)=>f.active ? f.name : "").join(",");
        }
        if (this.s.statusrow_begin) {
            this.s.statusrow_begin = this.s.begintime;
        }
        if (this.s.aggregate_str !== prev_s.aggregate_str || this.s.begintime !== prev_s.begintime || JSON.stringify(this.s.fields) !== JSON.stringify(prev_s.fields) || this.s.tags !== prev_s.tags || this.s.priors !== prev_s.priors) {
            this.s.run_graph_update++;
        }
    }
    Set_Aggregate(val) {
        this.s.show_controls = 2;
        this.Set_It({
            aggregate_str: val
        });
        this.sc();
    }
    Set_Xtratags(val) {
        this.s.show_controls = 2;
        this.Set_It({
            xtratags: val
        });
        this.sc();
    }
    Set_Fields(ev) {
        this.Set_It({
            field: ev.currentTarget.dataset.fieldname
        });
        this.sc();
    }
    Set_Priors(val) {
        this.s.show_controls = 2;
        this.Set_It({
            priors: val
        });
        this.sc();
    }
    Go_To_Selected_Day(e) {
        let datestr = e.currentTarget.value;
        const begintime = set_begin_from_selected_day(datestr, this.s.timezone);
        this.Set_It({
            begintime
        });
        this.sc();
        function set_begin_from_selected_day(datestr, timezone) {
            const d = new Date(datestr);
            const timeLocalized = d.toLocaleTimeString("en-US", {
                hour12: false,
                timeZone: "America/" + timezone
            });
            const utcstamp = d.getTime();
            const s = timeLocalized.split(":");
            const hourseconds = Number(s[0]) * 3600;
            const minuteseconds = Number(s[1]) * 60;
            const seconds = Number(s[2]);
            const seconds_past_midnight = hourseconds + minuteseconds + seconds;
            const y = seconds_past_midnight * 1000;
            return Math.floor((utcstamp + y) / 1000);
        }
    }
    Go_Back_One_Day() {
        const begintime = this.s.begintime - 86400;
        this.Set_It({
            begintime
        });
        this.sc();
    }
    Go_Next_One_Day() {
        const begintime = this.s.begintime + 86400;
        this.Set_It({
            begintime
        });
        this.sc();
    }
    async Set_Is_Status_Row_Shown(ev) {
        this.s.show_controls = 2;
        this.s.statusrow_begin = ev.currentTarget.checked ? 1 : 0;
        this.Set_It();
        this.sc();
    }
    async Set_Is_Median_Shown(ev) {
        this.s.show_controls = 2;
        this.s.median_fields = ev.currentTarget.checked ? "-" : "";
        this.Set_It();
        this.sc();
    }
    template = (_s, _m)=>html`{--css--}{--html--}`;
}
customElements.define("v-machinetelemetry", VMachineTelemetry);
function get_localized_date_str(begintime, city) {
    const d = new Date(begintime * 1000).toLocaleDateString("en-US", {
        timeZone: "America/" + city
    });
    const split = d.split("/");
    const year = split[2];
    const month = split[0].padStart(2, "0");
    const day = split[1].padStart(2, "0");
    return year + "-" + month + "-" + day;
}
function get_machines_midnight_UTC_time(city) {
    const timeLocalized = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "America/" + city
    });
    const nowUTC = Date.now() / 1000;
    const s = timeLocalized.split(":");
    const hourseconds = Number(s[0]) * 3600;
    const minuteseconds = Number(s[1]) * 60;
    const seconds = Number(s[2]);
    const secondsPastMidnight = hourseconds + minuteseconds + seconds;
    const localizedMidnight = Math.floor(nowUTC - secondsPastMidnight);
    return localizedMidnight;
}
export { };
