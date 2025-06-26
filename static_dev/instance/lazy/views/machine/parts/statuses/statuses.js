var Meter_Name = /*#__PURE__*/ function(Meter_Name) {
    Meter_Name["Store"] = "Store";
    Meter_Name["Pure1"] = "Pure1";
    Meter_Name["Mineral1"] = "Mineral1";
    Meter_Name["Pure2"] = "Pure2";
    Meter_Name["Mineral2"] = "Mineral2";
    return Meter_Name;
}(Meter_Name || {});
const DAY_IN_SECONDS = 86400;
const DAILY_STATUS_CALLIN_IN_SECONDS = 8 * 3600;
const ATTRIBUTES = {
    propa: ""
};
class VPMachineStatuses extends HTMLElement {
    m = {
        machine: {},
        statuses: [],
        daygroups: [],
        timezone_at_headquarters: "Denver",
        meters_grand_totals: []
    };
    s = {
        timezone: "",
        is_timezone_set_to_headquarters: false
    };
    a = {
        ...ATTRIBUTES
    };
    subels = [];
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
        this.dispatchEvent(new Event('hydrated'));
        $N.SSEvents.Add_Listener(document.body, "machines_for_notification", [
            2
        ], 110, async (event)=>{
            const machinepathregex = /^machines\/([^/]+)$/;
            const match = event.path.match(machinepathregex);
            if (!match || match[1] !== this.m.machine.id) return;
            const paths = [
                `machines/${this.m.machine.id}/statuses2`
            ];
            const opts = [
                {
                    order_by: "ts,desc",
                    limit: 200
                }
            ];
            const httpopts = {
                method: "POST",
                body: JSON.stringify({
                    paths,
                    opts
                })
            };
            const r = await $N.FetchLassie('/api/firestore_retrieve', httpopts, {});
            if (!r.ok) {
                return;
            }
            // TODO: THIS IS SUCH A HACK. I need a unified strategy in nifty framework for handling subels of a main view and what the fuck the data pipeline looks like from localdbsync -> cmech -> view component -> subel component
            console.log("THIS IS SUCH A HACK. I need a unified strategy in nifty framework for handling subels of a main view and what the fuck the data pipeline looks like from localdbsync -> cmech -> view component -> subel component");
            this.m.machine = event.data // should be complete data machine
            ;
            this.m.meters_grand_totals = get_meters_grand_totals(this.m.machine.meters_tally, this.m.machine.incrs, this.m.machine.meters_reconciles);
            this.s.timezone = this.s.is_timezone_set_to_headquarters ? this.m.timezone_at_headquarters : this.m.machine.timezone;
            this.m.statuses = parse_statuses(r[0], this.m.machine.incrs, this.s.timezone, this.m.machine.particle.id).sort((a, b)=>b.ts - a.ts);
            this.m.daygroups = set_day_groups(this.m.statuses);
            this.sc();
        });
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewPartDisconnectedCallback(this);
    }
    kd(loadeddata, loadstate, viewparams) {
        if (loadstate === "initial") {
            const rawstatuses = loadeddata.get(`2:machines/${viewparams.id}/statuses2`);
            const m = loadeddata.get(`1:machines/${viewparams.id}`)// is actually one row in an array
            ;
            this.m.machine = m[0];
            this.m.meters_grand_totals = get_meters_grand_totals(this.m.machine.meters_tally, this.m.machine.incrs, this.m.machine.meters_reconciles);
            this.s.timezone = this.s.is_timezone_set_to_headquarters ? this.m.timezone_at_headquarters : this.m.machine.timezone;
            this.m.statuses = parse_statuses(rawstatuses, this.m.machine.incrs, this.s.timezone, this.m.machine.particle.id).sort((a, b)=>b.ts - a.ts);
            this.m.daygroups = set_day_groups(this.m.statuses);
        }
    }
    async Switch_Time_Zone() {
        this.s.is_timezone_set_to_headquarters = this.s.is_timezone_set_to_headquarters ? false : true;
        this.s.timezone = this.s.is_timezone_set_to_headquarters ? this.m.timezone_at_headquarters : this.m.machine.timezone;
        this.sc();
    }
    sc() {
        render(this.template(this.s, this.m), this.shadow);
    }
    template = (_s, _m)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('vp-machine-statuses', VPMachineStatuses);
function get_meters_grand_totals(meters_tally, incrs, meters_reconciles) {
    let total_meters = meters_tally.slice();
    for (let reconcile of meters_reconciles){
        for(let i = 0; i < 5; i++){
            total_meters[i] += reconcile.deltas[i];
        }
    }
    const x = [
        total_meters[0] * incrs[0],
        total_meters[1] * incrs[1] + total_meters[3] * incrs[3],
        total_meters[2] * incrs[2] + total_meters[4] * incrs[4]
    ];
    return x.map((v)=>{
        if (v < 1000) {
            return v.toString();
        } else if (v < 1000000) {
            return (v / 1000).toFixed(0) + "K";
        } else {
            return (v / 1000000).toFixed(0) + "M";
        }
    });
}
function parse_statuses(raw_statuses, incrs, timezone, particle_id) {
    const parsed_statuses = [];
    for(let i = 0; i < raw_statuses.length; i++){
        const s = raw_statuses[i];
        let type = 0;
        switch(s.tags.type){
            case 0:
                type = 0;
                break;
            case 1:
                type = 1;
                break;
            case 2:
                type = 2;
                break;
        }
        const is_resend = s.tags.is_resend;
        const date = new Date(s.ts * 1000);
        const x = date.toLocaleDateString("en-US", {
            timeZone: "America/" + timezone
        });
        const y = x.split("/");
        y[0] = y[0].padStart(2, "0");
        y[1] = y[1].padStart(2, "0");
        const day_of_month = Number(y[1]);
        const month = Number(y[0]);
        const datestr = y[0] + "/" + y[1];
        const timestr = date.toLocaleTimeString("en-US", {
            hour12: false,
            timeZone: "America/" + timezone
        });
        let meters;
        meters = new Map([
            [
                "Store",
                getMeter(incrs[0], s.meters_tally[0], raw_statuses[i + 1]?.meters_tally[0])
            ],
            [
                "Pure1",
                getMeter(incrs[1], s.meters_tally[1], raw_statuses[i + 1]?.meters_tally[1])
            ],
            [
                "Mineral1",
                getMeter(incrs[2], s.meters_tally[2], raw_statuses[i + 1]?.meters_tally[2])
            ],
            [
                "Pure2",
                getMeter(incrs[3], s.meters_tally[3], raw_statuses[i + 1]?.meters_tally[3])
            ],
            [
                "Mineral2",
                getMeter(incrs[4], s.meters_tally[4], raw_statuses[i + 1]?.meters_tally[4])
            ]
        ]);
        const bits_xp = parse_bits(s.bits, particle_id);
        parsed_statuses.push({
            id: s.id,
            bits_xp,
            meters,
            datestr,
            timestr,
            date,
            day_of_month,
            month,
            day_summary: null,
            is_resend,
            type,
            ts: s.ts
        });
    }
    for(let i = parsed_statuses.length - 1; i >= 0; i--){
        const s = parsed_statuses[i];
        const snext = parsed_statuses[i + 1] || null;
        s.indicators = parse_indicators(s.bits_xp, snext?.bits_xp);
    }
    return parsed_statuses;
    function getMeter(increment, meter_tally, previous_meter_tally) {
        return previous_meter_tally ? (meter_tally - previous_meter_tally) * increment : 0;
    }
}
function parse_bits(bitStr, machine_id) {
    const snB1 = bitStr.charCodeAt(0);
    const snB2 = bitStr.charCodeAt(1);
    const snB3 = bitStr.charCodeAt(2);
    let bitsXp = {};
    if (machine_id !== "e00fce68c42d8d0b3a8d019a") {
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
    } else if (machine_id === "e00fce68c42d8d0b3a8d019a") {
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
function parse_indicators(sBitsXp, sNextBitsXp) {
    const procpwr = htmlstr(1, "error", sBitsXp.procpwr, sNextBitsXp?.procpwr, null, null);
    const drppan = htmlstr(1, "error", sBitsXp.drppan, sNextBitsXp?.drppan, null, null);
    const tnklvl = htmlstr(1, "warn", sBitsXp.tnklvl, sNextBitsXp?.tnklvl, null, null);
    const afltlw = htmlstr(1, "warn", sBitsXp.afltlw, sNextBitsXp?.afltlw, null, null);
    const dsppwr = htmlstr(1, "warn", sBitsXp.dsppwr1, sNextBitsXp?.dsppwr1, null, null);
    const nzl = htmlstr(2, "warn", sBitsXp.nzl1, sNextBitsXp?.nzl1, sBitsXp.nzl2, sNextBitsXp?.nzl2);
    const smpovr = htmlstr(2, "error", sBitsXp.smpovr1, sNextBitsXp?.smpovr1, sBitsXp.smpovr2, sNextBitsXp?.smpovr2);
    const uvblb = htmlstr(2, "error", sBitsXp.uvblb1, sNextBitsXp?.uvblb1, sBitsXp.uvblb2, sNextBitsXp?.uvblb2);
    const srvdr = htmlstr(2, "info", sBitsXp.srvdr1, sNextBitsXp?.srvdr1, sBitsXp.srvdr2, sNextBitsXp?.srvdr2);
    const loramia = htmlstr(1, "error", sBitsXp.loramia, sBitsXp?.loramia, null, null);
    return {
        procpwr,
        drppan,
        tnklvl,
        afltlw,
        dsppwr,
        nzl,
        smpovr,
        uvblb,
        srvdr,
        loramia
    };
    function htmlstr(classt, wstr, bit1, nbit1, bit2, nbit2) {
        let str = "";
        if (classt === 1) {
            const x = bit1 ? wstr : nbit1 ? "recovered" : "";
            str = x ? `<span class='single'><img src='/assets/media/bubble_${x}.svg' /></span>` : "";
        } else if (classt === 2) {
            if (!bit1 && !nbit1 && !bit2 && !nbit2) {
                str = "";
            } else {
                const x1 = bit1 ? wstr : nbit1 ? "recovered" : "ok";
                const x2 = bit2 ? wstr : nbit2 ? "recovered" : "ok";
                str = `<span class='double ${x1}'><img src='/assets/media/bubble_${x1}.svg' /></span>`;
                str += `<span class='double ${x2}'><img src='/assets/media/bubble_${x2}.svg' /></span>`;
            }
        }
        return str;
    }
}
function set_day_groups(parsed_statuses) {
    const day_groups = [];
    parsed_statuses.forEach((s, index)=>{
        const day_group_ts = calculate_day_group_ts(s.ts);
        let day_group = day_groups.find((dg)=>dg.ts === day_group_ts);
        if (!day_group) {
            day_groups.push({
                ts: day_group_ts,
                summary: {
                    day_of_month: s.day_of_month,
                    month: s.month,
                    meters: new Map([
                        [
                            "Store",
                            0
                        ],
                        [
                            "Pure1",
                            0
                        ],
                        [
                            "Mineral1",
                            0
                        ],
                        [
                            "Pure2",
                            0
                        ],
                        [
                            "Mineral2",
                            0
                        ]
                    ])
                },
                statuses: get_statuses_for_day_group(parsed_statuses, index, day_group_ts)
            });
            day_group = day_groups[day_groups.length - 1];
        }
    });
    day_groups.forEach(calc_day_group_meter_totals);
    return day_groups;
    function calc_day_group_meter_totals(day_group) {
        day_group.statuses.forEach((s)=>{
            //@ts-ignore
            for (let [key, value] of day_group.summary.meters){
                day_group.summary.meters.set(key, value + s.meters.get(key));
            }
        });
    }
    function get_statuses_for_day_group(parsed_statuses, index, day_group_ts) {
        const day_group_statuses = [];
        for(let i = index; i < parsed_statuses.length; i++){
            const s = parsed_statuses[i];
            if (s.ts >= day_group_ts && s.ts < day_group_ts + DAY_IN_SECONDS) {
                day_group_statuses.push(s);
            }
        }
        return day_group_statuses;
    }
    function calculate_day_group_ts(status_ts) {
        let ts_last_daily_callin = 0;
        let ts_seconds_into_day = status_ts % DAY_IN_SECONDS;
        if (ts_seconds_into_day > DAILY_STATUS_CALLIN_IN_SECONDS) {
            const last_midnight = status_ts - ts_seconds_into_day;
            ts_last_daily_callin = last_midnight + DAILY_STATUS_CALLIN_IN_SECONDS;
        } else {
            const two_midnights_ago = status_ts - ts_seconds_into_day - DAY_IN_SECONDS;
            ts_last_daily_callin = two_midnights_ago + DAILY_STATUS_CALLIN_IN_SECONDS;
        }
        return ts_last_daily_callin;
    }
}
export { };
