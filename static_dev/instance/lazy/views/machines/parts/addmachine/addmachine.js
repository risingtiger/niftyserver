//import { num } from "../../../../../defs_server_symlink.js"
import { MachineDispenserModeE } from "../../../../../defs.js";
var ModeE = /*#__PURE__*/ function(ModeE) {
    ModeE[ModeE["FIND"] = 0] = "FIND";
    ModeE[ModeE["FOUND"] = 1] = "FOUND";
    return ModeE;
}(ModeE || {});
const ATTRIBUTES = {
    propa: ""
};
class VPMachineAddMachine extends HTMLElement {
    a = {
        ...ATTRIBUTES
    };
    m = {
        propa: ""
    };
    s = {
        mode: 0,
        newmachine: null
    };
    newmachine;
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
    kd(_loadeddata, loadstate) {
        if (loadstate === "initial") {
        // nothing
        }
    }
    sc(state_changes = {}) {
        this.s = Object.assign(this.s, state_changes);
        render(this.template(this.s), this.shadow);
    }
    async find_chip(e) {
        const chip_id_el = this.shadow.querySelector("c-in[name='chipid']");
        const particle_account_el = this.shadow.querySelector("c-in[name='particle_account']");
        const chipid = chip_id_el.getAttribute("val") || "";
        const particle_account = particle_account_el.getAttribute("val");
        if (chipid === "" || isNaN(parseInt(chipid))) {
            alert("Please enter a valid Chip ID");
            return null;
        }
        const chipid_int = parseInt(chipid);
        const chipname = "pwt_" + chipid_int.toString().padStart(4, "0");
        const ra = await $N.FetchLassie("/api/pwt/particle/getchipdetails?particleaccount=" + particle_account + "&particleid=" + chipname);
        if (!ra.ok) {
            $N.ToastShow("Unable to Find Chip", 4);
            return false;
        }
        const r = ra.data;
        const codeversion = "1.2.7";
        let particle_account_email_term = "";
        switch(particle_account){
            case "ACCOUNTS_RISINGTIGER_COM":
                particle_account_email_term = "accounts_risingtiger_com";
                break;
            case "RFS_RISINGTIGER_COM":
                particle_account_email_term = "rfs_risingtiger_com";
                break;
            case "WEST_PWT_RISINGTIGER_COM":
                particle_account_email_term = "west_pwt_risingtiger_com";
                break;
            case "NEWSLETTERS_RISINGTIGER_COM":
                particle_account_email_term = "newsletters_risingtiger_com";
                break;
        }
        const particle_info = {
            account: particle_account_email_term,
            codeversion,
            id: r.particle_id,
            product: r.product_id,
            serial: r.serial_number
        };
        const store_info = {
            id: "0000000",
            brand: null,
            city: "",
            latlon: [
                0,
                0
            ],
            name: "Ready To Deploy " + chipid_int,
            state: "",
            zip: ""
        };
        const newmachine = {
            id: "",
            cell: [
                1,
                1,
                2
            ],
            chip: chipid_int.toString().padStart(7, "0"),
            dispenser: {
                lora_version: 0,
                mode: MachineDispenserModeE.OnDiscrete
            },
            cellgps: [
                0,
                0,
                0
            ],
            incrs: [
                10,
                10,
                10,
                10,
                10
            ],
            machineid: "0000000",
            meters_tally: [
                0,
                0,
                0,
                0,
                0
            ],
            meters_reconciles: [],
            particle: particle_info,
            pwtdataid: "0000000",
            state: {
                active: false,
                latest: "@@@"
            },
            store: store_info,
            timezone: "Denver",
            ts: Math.floor(new Date().getTime() / 1000)
        };
        // @ts-ignore
        delete newmachine.id // have to assign in newmachine because of Typescript, but need entirely gone before going to firestore generic Add on server side
        ;
        console.log("need to put in a check to see if this chip id has already been added ");
        e.detail.resolved();
        this.s.mode = 1;
        this.s.newmachine = newmachine;
        this.sc();
    }
    async AddChip(_e) {
        //@ts-ignore
        this.s.newmachine.id;
        const n = this.s.newmachine;
        await $N.LocalDBSync.Add("machines", n);
        $N.ToastShow(this.s.newmachine.chip + " Added", 1);
        this.s.mode = 0;
        this.sc();
    }
    /* async SaveNewMachine(_e:Event) {


    const formel = this.shadow.querySelector("form[name='addmachine']") as HTMLFormElement
    const chipid = (formel.elements["chipid"] as HTMLInputElement).value
    const particle_account = (formel.elements["particle_account"] as HTMLInputElement).value

    let r = await FetchLassie("/api/pwt/particle/id_from_chipid?particleaccount=" + particle_account + "&chipid=" + chipid)
    if (r.message) {
        alert(r.message)
        return false
    }

    const particleid = r.id
    const padded_chipid = chipid.toString().padStart(7, "0")

        console.log("if chip isnt at particle the whole fucken boat sunks")

    r = await FetchLassie("/api/pwt/particle/getchipdetails?particleaccount=" + particle_account + "&particleid=" + r.id)
    if (r.message) {
        alert(r.message)
        return false
    }

    console.log("test if chip is added to a product -- and ideally, if has been added to group")

    const particle_info = {
        id: particleid,
        account: particle_account.toLowerCase(),
        codeversion: "1.2.6",
        product: r.product_id,
        serial: r.serial_number
    }

    this.s.particle_info = particle_info

    this.sc()

    const new_machine = set_blank_machine()

    new_machine.chip = padded_chipid
    new_machine.particle = particle_info

    r = await Firestore.Retrieve("machines:chip=='"+padded_chipid+"'")

    if (r[0]) {
        alert("Chip ID already exists in database")
        return false
    }

    r = await FetchLassie("/api/pwt/machine/add", { method: "POST", body: JSON.stringify({ new_machine }) })

    console.log(r)

    if (r.message) {
        alert(r.message)
        return false
    }

    //this.sc()
}
*/ template = (_s)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('vp-machine-addmachine', VPMachineAddMachine);
