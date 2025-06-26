(() => {
  // ../../.nifty/files/instance/lazy/views/machines/parts/addmachine/addmachine.js
  var ModeE = function(ModeE2) {
    ModeE2[ModeE2["FIND"] = 0] = "FIND";
    ModeE2[ModeE2["FOUND"] = 1] = "FOUND";
    return ModeE2;
  }(ModeE || {});
  var ATTRIBUTES = { propa: "" };
  var VPMachineAddMachine = class extends HTMLElement {
    a = { ...ATTRIBUTES };
    m = { propa: "" };
    s = { mode: 0, newmachine: null };
    newmachine;
    shadow;
    static get observedAttributes() {
      return Object.keys(ATTRIBUTES);
    }
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "open" });
    }
    async connectedCallback() {
      await $N.CMech.ViewPartConnectedCallback(this);
      this.dispatchEvent(new Event("hydrated"));
    }
    async attributeChangedCallback(name, oldval, newval) {
      $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
      $N.CMech.ViewPartDisconnectedCallback(this);
    }
    kd(_loadeddata, loadstate) {
      if (loadstate === "initial") {
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
      switch (particle_account) {
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
      const particle_info = { account: particle_account_email_term, codeversion, id: r.particle_id, product: r.product_id, serial: r.serial_number };
      const store_info = { id: "0000000", brand: null, city: "", latlon: [0, 0], name: "Ready To Deploy " + chipid_int, state: "", zip: "" };
      const newmachine = { id: "", cell: [1, 1, 2], chip: chipid_int.toString().padStart(7, "0"), dispenser: { lora_version: 0, mode: 2 /* OnDiscrete */ }, cellgps: [0, 0, 0], incrs: [10, 10, 10, 10, 10], machineid: "0000000", meters_tally: [0, 0, 0, 0, 0], meters_reconciles: [], particle: particle_info, pwtdataid: "0000000", state: { active: false, latest: "@@@" }, store: store_info, timezone: "Denver", ts: Math.floor((/* @__PURE__ */ new Date()).getTime() / 1e3) };
      delete newmachine.id;
      console.log("need to put in a check to see if this chip id has already been added ");
      e.detail.resolved();
      this.s.mode = 1;
      this.s.newmachine = newmachine;
      this.sc();
    }
    async AddChip(_e) {
      this.s.newmachine.id;
      const n = this.s.newmachine;
      await $N.LocalDBSync.Add("machines", n);
      $N.ToastShow(this.s.newmachine.chip + " Added", 1);
      this.s.mode = 0;
      this.sc();
    }
    template = (_s) => {
      return html`<link rel='stylesheet' href='/assets/main.css'><style>
#findchip {
    display: none;
}
#findchip.active {
    display: block;
}

#addchip {
    display: none;
}
#addchip.active {
    display: block;
}
</style>
<div id="findchip" class="${_s.mode === 0 ? "active" : ""}">
        <c-in label="Chip ID" name="chipid" type="number" val="" nosave edit placeholder="e.g. pwt_0239 would be 239"></c-in>
        <c-in label="Particle Account" name="particle_account" type="dselect" term="East" val="RFS_RISINGTIGER_COM" nosave edit options="LLC:ACCOUNTS_RISINGTIGER_COM,East:RFS_RISINGTIGER_COM,West:WEST_PWT_RISINGTIGER_COM,Nat:NEWSLETTERS_RISINGTIGER_COM"></c-in>

        <div style="text-align: center;padding-top:16px;padding-bottom:24px;">
            <c-btn noanime name="findchip" primary @btnclick="${(e) => this.find_chip(e)}">Find Chip</c-btn>
        </div>
</div>




<div id="addchip" class="${_s.mode === 1 ? "active" : ""}">
    <ul class="items">
        <li>
            <h5>Chip ID</h5>
            <p>${_s.newmachine?.chip}</p>
        </li>
        <li>
            <h5>Name</h5>
            <p>${_s.newmachine?.store?.name}</p>
        </li>
        <li>
            <h5>Particle Account</h5>
            <p>${_s.newmachine?.particle?.account}</p>
        </li>
        <li>
            <h5>Particle ID</h5>
            <p>${_s.newmachine?.particle?.id}</p>
        </li>
        <li>
            <h5>Particle Serial</h5>
            <p>${_s.newmachine?.particle?.serial}</p>
        </li>
        <li>
            <h5>Particle Product</h5>
            <p>${_s.newmachine?.particle?.product}</p>
        </li>
        <li>
            <h5>Particle Code Version</h5>
            <p>${_s.newmachine?.particle?.codeversion}</p>
        </li>
    </ul>

    <div style="text-align: center;padding-top:16px;padding-bottom:24px;">
        <c-btn noanime name="addchip" primary @click="${(e) => this.AddChip(e)}">Add It Now</c-btn>
    </div>
</div>


`;
    };
  };
  customElements.define("vp-machine-addmachine", VPMachineAddMachine);

  // ../../.nifty/files/instance/lazy/views/machines/parts/notification/notification.js
  var ATTRIBUTES2 = { propa: "" };
  var VPMachineNnotification = class extends HTMLElement {
    a = { ...ATTRIBUTES2 };
    s = { errRows: [] };
    m = { propa: "" };
    shadow;
    static get observedAttributes() {
      return Object.keys(ATTRIBUTES2);
    }
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "open" });
    }
    async connectedCallback() {
      await $N.CMech.ViewPartConnectedCallback(this);
      this.dispatchEvent(new Event("hydrated"));
    }
    async attributeChangedCallback(name, oldval, newval) {
      $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
      $N.CMech.ViewPartDisconnectedCallback(this);
    }
    kd = () => {
    };
    addNotification(title, errmsg, ts, bitName, type) {
      if (!this.s.errRows.find((err) => err.bitName === bitName)) {
        const errRowData = { bitName, msg: errmsg, title, ts, datetime: new Date(ts * 1e3).toLocaleString(), element: null };
        this.s.errRows.unshift(errRowData);
        const errRowEl = document.createElement("div");
        errRowEl.className = "errrow " + type;
        const titleEl = document.createElement("div");
        titleEl.className = "errrowtitle";
        titleEl.textContent = errRowData.title;
        const msgEl = document.createElement("div");
        msgEl.className = "errrowmsg";
        msgEl.textContent = errRowData.msg;
        const datetimeEl = document.createElement("div");
        datetimeEl.className = "errrowdatetime";
        datetimeEl.textContent = errRowData.datetime;
        const closeBtn = document.createElement("button");
        closeBtn.className = "close-btn";
        closeBtn.textContent = "\xD7";
        closeBtn.addEventListener("click", () => this.dismissAlert(bitName));
        errRowEl.appendChild(titleEl);
        errRowEl.appendChild(msgEl);
        errRowEl.appendChild(datetimeEl);
        errRowEl.appendChild(closeBtn);
        errRowData.element = errRowEl;
        const containerEl = this.shadow.querySelector(".errrow-container");
        containerEl.style.height = `${this.s.errRows.length * 85}px`;
        containerEl.insertBefore(errRowEl, containerEl.firstChild);
        setTimeout(() => {
          errRowEl.setAttribute("active", "");
        }, 30);
      }
      this.setAttribute("active", "");
    }
    dismissAlert(bitName) {
      const index = this.s.errRows.findIndex((err) => err.bitName === bitName);
      if (index > -1) {
        const errRowData = this.s.errRows[index];
        const errRowEl = errRowData.element;
        if (errRowEl) {
          errRowEl.classList.add("exit");
          errRowEl.addEventListener("transitionend", () => {
            errRowEl.remove();
            this.s.errRows.splice(index, 1);
            const containerEl = this.shadow.querySelector(".errrow-container");
            containerEl.style.height = `${this.s.errRows.length * 85}px`;
            if (this.s.errRows.length === 0) {
              this.removeAttribute("active");
            }
          }, { once: true });
        }
      }
    }
    async sc() {
      render(this.template(), this.shadow);
    }
    template = () => {
      return html`<link rel='stylesheet' href='/assets/main.css'><style>
:host {
	width: 80%;
	margin-left: -40%;
	box-sizing: border-box;
	bottom: 20px;
}

.errrow-container {
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	justify-content: flex-end;
	/* background:rgba(128, 128, 128, 0.39); */
}
.errrow {
	color: white;
	padding: 0 32px;
	margin-bottom: 5px;
	position: relative;
	opacity: 0;
	transform: translateY(-20px);
	transition: all 0.5s ease-in-out;
	box-sizing: border-box;
	height: 80px;
	border-radius: 12px;
	display: flex;
	flex-wrap: wrap;
}
.errrow.error {
	background-color: #c93e25;
	& > .errrowmsg {
		background: #df5137;
	}
}
.errrow.warn {
	background-color: #f48106;
	
	& > .errrowmsg {
		background: #ff9b2f;
	}
}
.errrow.info {
	background-color: #259fc9;
	
	& > .errrowmsg {
		background: #4bb9df;
	}
}
.errrow[active] {
	opacity: 1;
	transform: translateY(0);
}
.errrow.exit {
	opacity: 0;
	transform: translateX(100%);
}
.errrowtitle, .errrowmsg, .errrowdatetime {
	color: white;
	font-weight: bold;
	font-size: 15px;
}
.errrowtitle {
	color: white;
	font-weight: bold;
	padding-right: 21px;
	font-size: 17px;
	position: relative;
	top: 27px;
	width: 179px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.errrowmsg {
	color: white;
	font-weight: normal;
	position: relative;
	top: 22px;
	height: 32px;
	margin-right: 37px;
	border-radius: 8px;
	padding: 6px 14px;
	width: 173px;
	text-align: left;
	box-sizing: border-box;
}
.errrowdatetime {
	color: white;
	font-weight: normal;
	font-size: 13px;
	position: relative;
	top: 29px;
	color: #ffffffb8;
}
.close-btn {
	position: absolute;
	top: 0px;
	right: 5px;
	background: transparent;
	border: none;
	font-size: 18px;
	color: white;
	cursor: pointer;
	padding: 8px 9px;
}



@media only screen and (max-device-width: 767px) {

	:host {
		width: 94%;
		margin-left: -47%;
		bottom: 8px;
	}

	.errrow-container {
		display: flex;
	}
	.errrow {
		padding: 0px 10px;
	}
	.errrowtitle {
	top: 7px;
}
.errrowmsg {
	top: 3px;
	margin-right: 6px;
	left: 169px;
}
.errrowdatetime {
	top: -3px;
	left: -178px;
}

}

@media only screen and (min-device-width: 768px) {
    .aux.brandname:hover, .aux.viewmetersreport:hover {
        cursor: pointer;

		& > h6 {
			text-decoration: underline;
		}
    }
}
</style>
<div class="errrow-container"></div>
`;
    };
  };
  customElements.define("vp-machine-notification", VPMachineNnotification);

  // ../../.nifty/files/instance/lazy/views/machines/machines.js
  var ATTRIBUTES3 = { propa: "" };
  var filterbymap = /* @__PURE__ */ new Map([["storename", ""], ["storeid", ""], ["machineid", ""], ["chip", ""], ["serial", ""]]);
  var month_abbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var VMachines = class extends HTMLElement {
    s = { filtered_sorted_machines: [], sortby: "state", show_addmachine: 0, show_logs: 0, meters_report_view: { show: 0, machine_record_id: "", machine_incrs: [], machine_ts: 0, header_name: "" }, details_view: { show: 0, machine_record_id: "" }, map_view: { show: 0, machine_record_id: "" }, filterby: filterbymap, retrieve_tries: 0 };
    m = { machines: [] };
    a = { ...ATTRIBUTES3 };
    shadow;
    static get observedAttributes() {
      return Object.keys(ATTRIBUTES3);
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
    constructor() {
      super();
      let fbstr = localStorage.getItem("filterby");
      if (fbstr && fbstr != "" && fbstr != "{}" && fbstr != "[]") {
        filterbymap = new Map(JSON.parse(fbstr));
      } else {
        localStorage.setItem("filterby", "[]");
      }
      this.shadow = this.attachShadow({ mode: "open" });
    }
    async connectedCallback() {
      await $N.CMech.ViewConnectedCallback(this);
      this.dispatchEvent(new Event("hydrated"));
      $N.SSEvents.Add_Listener(document.body, "machines_for_notification", [2], 10, (event) => {
        const machinepathregex = /^machines\/([^/]+)$/;
        const match = event.path.match(machinepathregex);
        if (!match) return;
        const oldmachine = this.m.machines.find((m) => m.id === match[1]);
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
    kd = (loadeddata, loadstate, _pathparams, _searchparams) => {
      if (loadstate === "initial" || loadstate === "datachanged") {
        this.m.machines = loadeddata.get("1:machines");
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
      const m = this.m.machines.find((m2) => m2.id === this.s.meters_report_view.machine_record_id);
      this.s.meters_report_view.machine_incrs = m.incrs;
      this.s.meters_report_view.machine_ts = m.ts;
      this.s.meters_report_view.header_name = m.store.brand ? m.store.brand + " " + m.store.city + ", " + m.store.state : m.store.name;
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
      if (newbits.procpwr && !oldbits.procpwr) alerts.push({ bitName: "procpwr", type: "error", message: "Processor Power Out" });
      if (newbits.drppan && !oldbits.drppan) alerts.push({ bitName: "drppan", type: "error", message: "Drip Pan Over" });
      if (newbits.smpovr1 && !oldbits.smpovr1 || newbits.smpovr2 && !oldbits.smpovr2) alerts.push({ bitName: "smpovr", type: "error", message: "Sump Over" });
      if (newbits.uvblb1 && !oldbits.uvblb1 || newbits.uvblb2 && !oldbits.uvblb2) alerts.push({ bitName: "uvblb", type: "error", message: "UV Bulb Out" });
      if (newbits.loramia && !oldbits.loramia) alerts.push({ bitName: "loramia", type: "error", message: "LoRa chip isn't calling in" });
      if (alerts.length > 0) {
        const el = this.shadow.querySelector("vp-machine-notification");
        const title = get_title(updated_machine);
        alerts.forEach((alert2) => {
          el.addNotification(title, alert2.message, updated_machine.ts, alert2.bitName, alert2.type);
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
      this.m.machines.forEach((m) => {
        m.machineid = m.machineid;
        m.chip = m.chip;
        m.store.id = m.store.id;
        const now = Date.now();
        const ts_d = new Date(m.ts * 1e3);
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
        } else if (ts_d.getTime() < now - 864e5 * 30) {
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
    template = (_s, _m) => {
      return html`<link rel='stylesheet' href='/assets/main.css'><style>
.viewheader > .right > i.icon-add {
	font-size: 15px;position: relative;top: 0px;
	-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
.viewheader > .right > i.icon-refresh {
	font-size: 16px;
	position: absolute;
	top: 11px;
	right: 28px;
	-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}


vp-machine-notification {
	position: fixed;
	z-index: 2;
    left: -5000%;
}
vp-machine-notification[active] {
	left: 50%;
}

#filterwrap {
	width: 100%;
	overflow-x: scroll;


    form#filter {
		width: 100%;
        display: flex;
        flex-wrap: nowrap;
        justify-content: flex-start;
        position: relative;
        padding: 11px 11px 17px 11px;
        box-sizing: border-box;
        overflow-x: scroll;
        /*border-bottom: 2px solid #e8e8e8;*/

        & > .justinput.search {
            flex: 1;
			padding-right: 10px;

			& > input {
				border-radius: 8px;
			}
        }
        & > .justinput.search:last-child {
            padding-right: 0;
        }

        /*
        & >
        span.filtertype {
            display: block;
        position: relative;
        padding-right: 10px;
        position: relative;
        width: 100%;

            & >
        input {
                font-size: 13px;
        box-sizing: border-box;
        outline: none;
        border: 1px solid #cecece;
        border-radius: 4px;
        padding: 7px 5px 8px 25px;
        color: #6d6d6d;
        display: block;
        margin-top: 0;
        width: 100%;
            }
            & >
        input::placeholder {
                color: #b5b5b5;
            }

            & >
        i {
                color: #bdbdbd;
        font-size: 19px;
        position: absolute;
        top: 6px;
        left: 6px;
            }
        }
        & >
        span.filtertype:last-child {
            padding-right: 0;
        }
    ;
        width: 100%;
			*/
    }
}


ul.items {
    & li {
        & .aux.brandname {
            width: 195px;
            min-width: 195px;
            max-width: 195px;
            margin-right: 7px;
            overflow: hidden;

			p.bitslegend > .bit {
				font-size: 13px;
				color: var(--textcolor-fade);
			}
        }

        & .aux.identifiers {
            width: 80px;
            flex: 1;

            & h6.bits {
				span:nth-child(1) {
					width: 100px;
				}
				span:nth-child(2) {
					width: 52px;
				}
            }
            & p.bitslegend {
				span:nth-child(1) {
					width: 52px;
				}
				span:nth-child(2) {
					width: 52px;
				}
            }
        }


        & .aux.info {
            width: 220px;
            flex: 1;

            & h6.bits {
				justify-content: flex-start;

				span:nth-child(1) {
					width: 100px;
				}
            }
            & p.bitslegend {
				justify-content: flex-start;
				
				
				span:nth-child(1) {
					width: 100px;
				}
            }
        }
    }
	& li:hover {
		& > .brandname > h6 {
			text-decoration: underline;
		}
	}
}

ion-item:nth-child(1) ion-label {
    margin-top: 8;
}

ion-avatar {
    width: 27px;
    height: 27px;
}

h3 + p {
    padding-left: 10px;
}

.isoffline_text {
    color: red;
}




@media only screen and (max-device-width: 767px) {

	.viewheader > .right > i.icon-refresh {
		top: 0px;
	}

	ul.items > li > i.action, ul.items > li > .aux.info {
		display: none;
	}

	ul.items > li > .actions > i.icon-meter {
		display: none;
	}


    #filterwrap {

        form#filter {
            width: 842px;
            padding-top: 8px;
            padding-bottom: 8px;
        }
    }

}

@media only screen and (min-device-width: 768px) {
}



</style>


<header class="viewheader">
	<a class="left" @click="${() => $N.SwitchStation.NavigateBack({ default: "home" })}"><span>‸</span></a>
	<div class="middle"><h1>Machines <a @click="${() => this.tempnoti()}"> &nbsp; &nbsp; </a></h1></div>
	<div class="right">
        ${localStorage.getItem("user_email") === "accounts@risingtiger.com" ? html`
            <i class="icon-add"  @click="${() => {
        this.ShowAddMachineUI();
      }}" style=""></i>
			<!--<i class="icon-edit1"  @click="${() => {
        Firestore.Patch(`machines/NhDu4jmNyRBHN0AXs4WX`, { "store.brand": "Luckys" + Math.floor(Math.random() * 20) });
      }}" style="font-size: 25px;position: relative;top: 5px;"></i>-->
        ` : ""}
	</div>
</header>




<div class="content">

    <div id="filterwrap">
        <form id="filter">
            <span class="justinput search">
                <i class="icon-search"></i>
                <input name="storename" @keyup="${(e) => this.filterkeyup(e)}" @focus="${(e) => this.filterkeyup(e)}" type="text" value="${_s.filterby.get("storename")}" placeholder="Store Name"></input>
            </span>
            <span class="justinput search">
                <i class="icon-search"></i>
                <input name="storeid" @keyup="${(e) => this.filterkeyup(e)}" @focus="${(e) => this.filterkeyup(e)}" type="text" value="${_s.filterby.get("storeid")}" placeholder="Store ID"></input>
            </span>
            <span class="justinput search">
                <i class="icon-search"></i>
                <input name="machineid" @keyup="${(e) => this.filterkeyup(e)}" @focus="${(e) => this.filterkeyup(e)}" type="text" value="${_s.filterby.get("machineid")}" placeholder="Machine ID"></input>
            </span>
            <span class="justinput search">
                <i class="icon-search"></i>
                <input name="chip" @keyup="${(e) => this.filterkeyup(e)}" @focus="${(e) => this.filterkeyup(e)}" type="text" value="${_s.filterby.get("chip")}" placeholder="Chip ID"></input>
            </span>
            <span class="justinput search">
                <i class="icon-search"></i>
                <input name="serial" @keyup="${(e) => this.filterkeyup(e)}" @focus="${(e) => this.filterkeyup(e)}" type="text" value="${_s.filterby.get("serial")}" placeholder="Serial Number"></input>
            </span>
        </form>
    </div>

	<ul class="items">

    ${_s.filtered_sorted_machines.map((m) => html`
		<li @click="${(e) => this.gotoMachine(e.currentTarget.dataset.id)}" data-id="${m.id}">
	    <div class="thumbnail"><img src="/assets/media/bubble_${m.stateToShowColor}.svg"></div>

	    <div class="aux brandname">
            <h6 class="bits">
				<span class="bit">${get_title(m)}</span>
			</h6>
			<p class="bitslegend">
				<span class="bit">${m.msg}</span>
			</p>
        </div>

	    <div class="aux identifiers">
			<h6 class="bits">
				<span class="bit">${m.store.id.replace(/^0+/, "") || "null"}</span>
				<!--<span class="bit">${m.particle.codeversion || "--"}</span>-->
				<!--<span class="bit">${m.particle.product === 11723 || m.particle.product === 20405 || m.particle.product === 20568 ? "Boron" : "BSeries"}</span>-->
			</h6>
			<p class="bitslegend">
				<span class="bit">store</span>
				<!--<span class="bit">version</span>-->
				<!--<span class="bit">type</span>-->
			</p>
	    </div>


		<!-- 
				${m.particle.product === 11723 || m.particle.product === 20405 || m.particle.product === 20568 ? "Boron" : "BSeries"} / ${m.particle.serial.substring(m.particle.serial.length - 4)} / ${m.particle.codeversion || "--"}</h6>
		-->

	    <div class="aux info">
			<h6 class="bits">
				<!--<span class="bit">${m.cell[0]} & ${m.cell[1]}</span>-->
				<span class="bit">${m.d}</span>
			</h6>
			<p class="bitslegend">
				<!--<span class="bit">cell sig</span>-->
				<span class="bit">last call</span>
			</p>
		</div>

		<div class="actions">
			<i class="action icon-info" data-machine_record_id="${m.id}" @click="${(e) => this.show_details(e)}"></i>
			<i class="action icon-meter" data-machine_record_id="${m.id}" @click="${(e) => this.meters_report_clicked(e)}"></i>
			<i class="action icon-location" data-machine_record_id="${m.id}" @click="${(e) => this.show_map(e)}"></i>
		</div>
		
		
		<!--
        <div class="aux btnactions">
			<h6 data-machine_record_id="${m.id}" @click="${(e) => this.show_details(e)}"><i class="icon-info" style=""></i></h6>
			<h6 data-machine_record_id="${m.id}" @click="${(e) => this.metersReportClicked(e)}"><i class="icon-location" style=""></i></h6>
			<h6 data-machine_record_id="${m.id}" @click="${(e) => this.meters_report_clicked(e)}"><i class="icon-meter" style=""></i></h6>
        </div>
		-->
    </li>
    `)}

  </ul>

	<vp-machine-notification></vp-machine-notification>

</div>




${_s.show_addmachine !== 0 ? html`
    <c-ol shape="1" title="Add Machine" @close="${() => this.sc({ show_addmachine: 0 })}">
        <span slot="headermiddle">Add New Machine</span>
        <vp-machine-addmachine></vp-machine-addmachine>
    </c-ol>
` : ""}







${_s.show_logs ? html`
	<c-pol shape="1" title="Logs" showheader="true" @close="${() => this.sc({ show_logs: 0 })}">
		<span slot="headermiddle">Logs</span>
		<vp-machine-logs></vp-machine-logs>
	</c-pol>
` : ""}



${_s.meters_report_view.show !== 0 ? html`
	<c-ol shape="1" title="${_s.meters_report_view.header_name}" @close="${() => {
        this.s.meters_report_view.show = 0;
        this.sc();
      }}">
		<vp-metersreport machine_record_id="${_s.meters_report_view.machine_record_id}" machine_incrs="${_s.meters_report_view.machine_incrs}" machine_ts="${_s.meters_report_view.ts}"></vp-metersreport>
    </c-ol>
` : ""}

${_s.details_view.show !== 0 ? html`
	<c-ol shape="1" title="Machine Details" @close="${() => {
        this.s.details_view.show = 0;
        this.sc();
      }}">
        <vp-machine-details machine_record_id="${_s.details_view.machine_record_id}"></vp-machine-details>
    </c-ol>
` : ""}

${_s.map_view.show !== 0 ? html`
	<c-ol shape="1" title="Machine Map" @close="${() => {
        this.s.map_view.show = 0;
        this.sc();
      }}">
        <vp-machine-map machine_record_id="${_s.map_view.machine_record_id}"></vp-machine-map>
    </c-ol>
` : ""}


`;
    };
  };
  customElements.define("v-machines", VMachines);
  function get_filtered_machines(filterby, machines) {
    let m = machines.map((machine) => machine);
    m = m.filter((m2) => {
      const str = m2.store.brand ? m2.store.brand.toLowerCase() + " " + m2.store.city.toLowerCase() + ", " + m2.store.state.toLowerCase() : m2.store.name.toLowerCase();
      return str.includes(filterby.get("storename"));
    });
    m = m.filter((m2) => m2.store.id.toLowerCase().includes(filterby.get("storeid")));
    m = m.filter((m2) => m2.machineid.toLowerCase().includes(filterby.get("machineid")));
    m = m.filter((m2) => m2.chip.includes(filterby.get("chip")));
    m = m.filter((m2) => m2.particle.serial.toLowerCase().includes(filterby.get("serial")));
    return m;
  }
  function get_sorted_machines(sortby, machines) {
    const m = machines.map((machine) => machine);
    if (sortby === "state") {
      m.sort((a, b) => {
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
      bitsXp = { procpwr: snB2 >> 4 & 1, drppan: snB1 >> 5 & 1, tnklvl: snB1 >> 4 & 1, afltlw: snB1 >> 3 & 1, dsppwr1: snB2 >> 5 & 1, nzl1: snB1 >> 0 & 1, smpovr1: snB1 >> 2 & 1, uvblb1: snB1 >> 1 & 1, srvdr1: snB2 >> 3 & 1, nzl2: snB3 >> 5 & 1, smpovr2: snB2 >> 2 & 1, uvblb2: snB2 >> 1 & 1, srvdr2: snB2 >> 0 & 1, loramia: snB3 >> 4 & 1 };
    } else if (particle_id === "e00fce68c42d8d0b3a8d019a") {
      bitsXp = { procpwr: 0, drppan: snB1 >> 4 & 1, tnklvl: snB1 >> 3 & 1, afltlw: snB1 >> 2 & 1, dsppwr1: snB1 >> 1 & 1, smpovr1: snB1 >> 0 & 1, smptime: snB2 >> 5 & 1, smptime_b: snB2 >> 4 & 1, uvblb1: snB2 >> 3 & 1, uvblb2: snB2 >> 2 & 1, srvdr1: snB2 >> 1 & 1, loramia: snB2 >> 0 & 1, smpovr2: 0, nzl1: 0, nzl2: 0, srvdr2: 0 };
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
    return { errmsg, warnmsg, infomsg };
  }
  function get_last_callin(machine_ts) {
    const date = new Date(machine_ts * 1e3);
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
})();
