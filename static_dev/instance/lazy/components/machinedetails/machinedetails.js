import { MachineDispenserModeE } from "../../../defs.js";
const ATTRIBUTES = {
    machine_record_id: ""
};
class VPMachineDetails extends HTMLElement {
    a = {
        ...ATTRIBUTES
    };
    m = {
        mdetails: {
            particle: {},
            state: {},
            store_meters: [],
            incrs: []
        }
    };
    s = {
        show_particle_more: false
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
        this.dispatchEvent(new Event('hydrated'));
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewPartDisconnectedCallback(this);
    }
    kd(loadeddata, loadstate) {
        if (loadstate === "initial") {
            let m = loadeddata.get("1:machines") || loadeddata.get(`1:machines/${this.a.machine_record_id}`);
            const machine = m[0];
            this.m.mdetails = expand(machine);
        }
    }
    sc() {
        render(this.template(this.s, this.m.mdetails), this.shadow);
    }
    async GetAndShowParticleDeviceDetails(e) {
        return new Promise(async (res)=>{
            const urlstr = `/api/pwt/particle/getchipdetails?particleid=${this.m.mdetails.particle.id}`;
            const pm = await $N.FetchLassie(urlstr);
            if (!pm.ok) {
                e.detail.resolved();
                alert("Error getting particle details");
                res(0);
                return;
            }
            this.m.mdetails.particle_more = pm.data;
            this.s.show_particle_more = true;
            this.sc();
            setTimeout(()=>{
                this.shadow.querySelector(".definewrap").scrollTo({
                    behavior: 'smooth',
                    top: 10000
                });
            }, 100);
            res(1);
        });
    }
    template = (_s, _mdetails)=>{
        return html`<link rel="stylesheet" href="/assets/main.css">{--css--}{--html--}`;
    };
}
customElements.define('vp-machine-details', VPMachineDetails);
function expand(machine) {
    let dispenser_mode = "";
    let particle_product = "";
    switch(machine.dispenser.mode){
        case MachineDispenserModeE.OnLoRa:
            dispenser_mode = "lora";
            break;
        case MachineDispenserModeE.OnSwitchingDiscrete:
            dispenser_mode = "switching";
            break;
        case MachineDispenserModeE.OnDiscrete:
            dispenser_mode = "discrete";
            break;
        default:
            dispenser_mode = "discrete";
            break;
    }
    switch(machine.particle.product){
        case 11724:
            particle_product = "BSeries";
            break; //llc account
        case 11723:
            particle_product = "Boron";
            break; //llc account
        default:
            particle_product = "Unknown";
            break;
    }
    const machine_details = {
        cellsignal: machine.cell[0],
        cellquality: machine.cell[1],
        cellconnectivity: machine.cell[2],
        chip: machine.chip,
        id: machine.id,
        dispenser_mode: dispenser_mode,
        dispenser_loraversion: dispenser_mode == 'lora' ? machine.dispenser.lora_version.toString() : 'N/A',
        cellgps_lat: machine.cellgps[2] > 0 ? machine.cellgps[0].toString() : "N/A",
        cellgps_lon: machine.cellgps[2] > 0 ? machine.cellgps[1].toString() : "N/A",
        cellgps_ts: machine.cellgps[2] > 0 ? machine.cellgps[1] : 0,
        incrs: machine.incrs,
        pwtdataid: machine.pwtdataid,
        machineid: machine.machineid,
        meters_tally: machine.meters_tally,
        particle: {
            codeversion: machine.particle.codeversion,
            id: machine.particle.id,
            product: particle_product,
            serial: machine.particle.serial
        },
        particle_more: null,
        state_isactive: machine.state.active,
        state_latest: machine.state.latest,
        store_id: machine.store.id,
        store_name: machine.store.name,
        ts: machine.ts
    };
    return machine_details;
}
