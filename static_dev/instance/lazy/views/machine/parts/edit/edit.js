const ATTRIBUTES = {
    propa: ""
};
class VPMachineEdit extends HTMLElement {
    a = {
        ...ATTRIBUTES
    };
    s = {
        matching_stores: []
    };
    m = {
        machine: {},
        pwtdatastores: [],
        brands: [
            "NONE",
            "Bees",
            "Davis",
            "Good Earth",
            "Lins",
            "Luckys",
            "Sprouts",
            "Thyme",
            "WinCo"
        ]
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
    kd(loadeddata, loadstate, pathparams) {
        if (loadstate === "initial" || loadstate === "datachanged") {
            const m = loadeddata.get(`1:machines/${pathparams.id}`);
            this.m.machine = m[0];
        }
    }
    sc(state_changes = {}) {
        this.s = Object.assign(this.s, state_changes);
        render(this.template(this.s, this.m), this.shadow);
    }
    /*
async show_fedit(e:Event, what:str) {

    const et = e.target as HTMLElement
    if (et.classList.contains("fedit") || et.closest(".fedit")) { return }

    const li = e.currentTarget as HTMLLIElement
    const ul = li.parentElement as HTMLUListElement;
    const lis = Array.from(ul.children) as HTMLLIElement[]
    const liindex = lis.indexOf(li)
    const nextli = lis[liindex + 1] || null
    const fedit = li.querySelector(".fedit") as HTMLElement
    const wrapper = li.querySelector(".fedit > .feditwrap") as HTMLElement
    const li_height = li.offsetHeight
    const isactive = li.classList.contains("active")

    const x = { li, ul, lis, liindex, nextli, fedit, wrapper, li_height, isactive }

    if (ul.querySelector(".transitioning")) { return }

    console.log("proceeding")

    if (!isactive) { fedit_open(x) } else { fedit_close(x) }

    for(const l of lis) {
        if (l.classList.contains("active") && l !== li) {
            fedit_close({ li:l, ul, lis, liindex:lis.indexOf(l), fedit:l.querySelector(".fedit"), li_height: l.offsetHeight, isactive:true })
            break;
        }
    }
}
*/ /*
	async update_isactive(_e:Event) {

		const formel = this.shadow.querySelector("form[name='machineedit']") as HTMLFormElement
		const isactive_el = formel.elements["isactive"] as HTMLInputElement

		const isactive = isactive_el.checked

		await $N.Firestore.Patch(`machines/${this.m.machine.id}`, { "state.active": isactive })

		this.m.machine.state.active = isactive

		this.sc()
	}
	*/ /*
	async send_request_to_link_store(e:Event) {
		return false

		const button_el = e.currentTarget as HTMLButtonElement
		const machine_chip = button_el.dataset.chip
		const user_email = localStorage.getItem("user_email")
		const storeid_el = this.shadow.querySelector("input#link_storeid") as HTMLInputElement
		const storeid = storeid_el.value
		const machineid_el = this.shadow.querySelector("input#link_machineid") as HTMLInputElement
		const machineid = machineid_el.value

		const to = "davis@risingtiger.com"
		const subject = "Machine Link to ClientID"
		const message = `Request by ${user_email} to link machine ${machine_chip} to store of store id ${storeid} and machine id of ${machineid}`
		const from = user_email

		const body = { to, subject, message, from }

		await FetchLassie("/api/emailing/send", {method: "POST", body:JSON.stringify(body) })

		this.sc()
	}
	*/ async getstorelist() {
        if (this.m.pwtdatastores.length > 0 || this.m.machine.pwtdataid !== '0000000') {
            return;
        }
        const r = await $N.FetchLassie(`/api/pwt/pwtdata_interface/getstorelist`);
        if (!r.ok) {
            alert("unable to get store list");
            return;
        }
        this.m.pwtdatastores = r.data;
        this.sc();
    }
    async search_store_name_changed(newval) {
        newval = newval.trim();
        newval = newval.toLowerCase();
        if (this.m.pwtdatastores.length === 0) {
            this.s.matching_stores = [];
            this.sc();
            return;
        }
        let filtered = this.m.pwtdatastores.filter((m)=>{
            return m.name.toLowerCase().includes(newval);
        });
        if (filtered.length > 5) {
            filtered = filtered.slice(0, 5);
        }
        if (filtered.length === 0) {
            this.s.matching_stores = [];
        } else {
            this.s.matching_stores = filtered;
        }
        this.sc();
    }
    async attach_store(e) {
        const el = e.currentTarget;
        const pwtdataid = el.dataset.pwtdataid;
        if (!confirm("Are you sure you want to attach this store?")) {
            return;
        }
        const r = await $N.FetchLassie(`/api/pwt/pwtdata_interface/attachstore?pwtdataid=${pwtdataid}&machinerecordid=${this.m.machine.id}&ts=${this.m.machine.ts}`);
        if (!r.ok) {
            alert("unable to attach store");
            return;
        }
        this.m.machine = r.data;
        this.sc();
        $N.ToastShow("Store Attached");
    }
    /*
	async attach_store(_e:Event) {

		const brand = this.shadow.querySelector("c-form[name='brand'] c-in[name='inputbrand']") as HTMLFormElement

		if (brand.getAttribute("val") === "") {
			alert("Please Enter Brand")
			return
		}

		this.s.attachstoredata["store.brand"] = brand.getAttribute("val") || ""

		//await $N.Firestore.Patch(`machines/${this.m.machine.id}`, this.s.attachstoredata);

		const rel = this.shadow.querySelector("c-reveal#store_assign") as HTMLElement;
		rel!.removeAttribute("active");

		setTimeout(async (_:any)=> {
			await this.initit();
			this.s.matching_stores = []
			this.s.attachstoredata.pwtdataid = ""
			this.sc()
		}, 1200);

		$N.ToastShow("Store Attached")
	}
*/ async cancel_attach_store(_e) {
        this.s.matching_stores = [];
        this.sc();
    }
    async updateprop(e) {
        let updateobj = {};
        let prop = "";
        let incrs_what = "";
        if (e.detail.name.includes("incrs_")) {
            const x = e.detail.name.split("_");
            prop = x[0];
            incrs_what = x[1];
        } else {
            prop = e.detail.name;
        }
        switch(prop){
            case "isactive":
                updateobj = {
                    state: {
                        active: e.detail.newval === "true" ? true : false
                    }
                };
                break;
            case "brand":
                if (e.detail.newval.length < 3) {
                    alert("Needs 3 characters long");
                    e.detail.set_update_fail(e.detail.oldval, "unable to save");
                    return;
                }
                updateobj = {
                    store: {
                        brand: e.detail.newval
                    }
                };
                break;
            case "incrs":
                const incrs = this.m.machine.incrs.slice();
                const indexmatches = [
                    'store',
                    'pure1',
                    'min1',
                    'pure2',
                    'min2'
                ];
                const index = indexmatches.indexOf(incrs_what);
                incrs[index] = Number(e.detail.newval);
                updateobj = {
                    incrs
                };
                break;
        }
        //const r = await $N.Firestore.Patch([ `machines/${this.m.machine.id}` ], [ updateobj ], [ this.m.machine.ts ]);
        await $N.LocalDBSync.Patch("machines/" + this.m.machine.id, updateobj);
    }
    /*
	async FindStore() {
		
		const form = this.shadow.querySelector("c-form[name='store_assign']") as HTMLFormElement
		const storename_el = form.querySelector("c-in[name='name']") as HTMLElement 
		const storename = storename_el.getAttribute("val")

		const r:FindStoreListT[] = await FetchLassie(`/api/pwt/pwtdata_interface/findstores?name=${storename}`)

		if (r.length === 0) {
			this.s.findstore_nonefound = true
			this.s.findstorelist = []
		} else {
			this.s.findstore_nonefound = false
			this.s.findstorelist = r
		}

		this.sc()
	}
	*/ /*
async Save() {

    const formel = this.querySelector("form[name='machineedit']") as HTMLFormElement

    const { machineid, state, store, incrs, errmsg } = verify_and_correct_input_local(formel.elements) 

    if (errmsg) { 
        alert(errmsg)
        return false
    }

    this.s.savingState = 1
    this.sc()

    const qr = await (window as any).Firestore.Patch(`machines/${this.machine.id}`, { machineid, state, store, incrs })
    const tr = new Promise(r=> setTimeout((_:any)=> r(1), 1000))
    await Promise.all([qr, tr])

    this.s.savingState = 2
    this.sc()

    setTimeout((_:any)=> { 
        this.dispatchEvent(new Event('close'))

    }, 1400)

}
    */ template = (_s, _m)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('vp-machine-edit', VPMachineEdit); /*
function verify_and_correct_input_local(els:any) : any {

    let flag = false
    let errmsg = "\n"

    let machineid                 = els.machineid.value
    let state                 = { active: els.isactive.checked }
    let store                 = { id: els.storeid.value, name:els.storename.value }
    let incrs                 = ["store", "pure1", "min1", "pure2", "min2"].map(m=> Number(els["incrs_"+m].value))

    if (machineid.trim().length !== 7 || !(/^[0-9]+$/.test(machineid)) ) { 
        errmsg += ("machine id should contain only numeric characters and should be 4 in length\n")
        flag = true
    }

    if (store.id.length !== 7 || !(/^[0-9]+$/.test(store.id))) {
        errmsg += ("store id should be a number and should be 4 in length\n")
        flag = true
    }

    if (store.name.trim().length === 0 || store.id.length > 30 || (store.name.search(/[^-A-Za-z0-9_ ]+/) !== -1) ) {
        errmsg += ("store name should be no longer than 20 characters. And should only contain A-Z or a-z\n")
        flag = true
    } else {
        store.name = store.name.trim()
    }

    incrs.forEach((n:int) => {
        if ( isNaN(n) || !(n === 1 || n === 10 ) ) {
            errmsg += ("gallon increment should be 1 or 10\n")
            flag = true
        }    
    })

    return { machineid, state, store, incrs, errmsg: (flag ? errmsg : "") }
}
*/ 
export { };
