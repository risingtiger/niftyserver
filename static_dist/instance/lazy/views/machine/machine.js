(() => {
  // ../../.nifty/files/instance/lazy/views/machine/parts/edit/edit.js
  var ATTRIBUTES = { propa: "" };
  var VPMachineEdit = class extends HTMLElement {
    a = { ...ATTRIBUTES };
    s = { matching_stores: [] };
    m = { machine: {}, pwtdatastores: [], brands: ["NONE", "Bees", "Davis", "Good Earth", "Lins", "Luckys", "Sprouts", "Thyme", "WinCo"] };
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
    async getstorelist() {
      if (this.m.pwtdatastores.length > 0 || this.m.machine.pwtdataid !== "0000000") {
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
      let filtered = this.m.pwtdatastores.filter((m) => {
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
    async cancel_attach_store(_e) {
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
      switch (prop) {
        case "isactive":
          updateobj = { state: { active: e.detail.newval === "true" ? true : false } };
          break;
        case "brand":
          if (e.detail.newval.length < 3) {
            alert("Needs 3 characters long");
            e.detail.set_update_fail(e.detail.oldval, "unable to save");
            return;
          }
          updateobj = { store: { brand: e.detail.newval } };
          break;
        case "incrs":
          const incrs = this.m.machine.incrs.slice();
          const indexmatches = ["store", "pure1", "min1", "pure2", "min2"];
          const index = indexmatches.indexOf(incrs_what);
          incrs[index] = Number(e.detail.newval);
          updateobj = { incrs };
          break;
      }
      await $N.LocalDBSync.Patch("machines/" + this.m.machine.id, updateobj);
    }
    template = (_s, _m) => {
      return html`<link rel='stylesheet' href='/assets/main.css'><style>:host {
    position: relative;
}

ul.items > li > h5 {
    color: rgb(190 56 151);
}

c-reveal#storelink,
c-reveal#increments,
c-reveal#store_assign {
    padding: 0px 0px 0 0px;

    & > h5 {
        padding: 0px 0 5px 0;
    }

    & > p {
        padding: 0 0 19px 0;
    }

    & .linkrefs {
        display: flex;
        justify-content: space-around;
        padding-bottom: 25px;

        & > div {
            & label {
                padding-bottom: 5px;
                padding-left: 7px;
            }

            & input {
                width: 115px;
            }
        }
    }

    .confirm_msg {
        color: #009e88;
        text-align: center;
        font-weight: 900;
    }

    .heightfix {
        height: 115px;
        overflow: hidden;
    }
}

c-reveal#store_assign {
    & .alreadyassigned {
        height: 50px;
        padding: 0 0 0 13px;
    }

    .justinput.search {
        width: calc(100% - 20px);
        margin: 0 11px 0 11px;

        & > input {
            background-color: white;
        }
    }

    & #storelist {
        height: 300px;

        & > .storeitem {
            margin-bottom: 0px;

            & > p:first-child {
                font-weight: bold;
                font-size: 14px;

                & > span {
                    color: #52c3b5;
                    font-size: 14px;
                }
                & > span::after {
                    content: " - ";
                }
                width: 100%;
                box-sizing: border-box;
                overflow: hidden;
                text-wrap: nowrap;
            }
            & > p:nth-child(2) {
                font-size: 14px;
                color: #a8a5a5;
            }
            padding: var(--padding-container);
            padding-left: 17px;
        }
        & > .storeitem:hover {
            background-color: #f0f0f0;
        }

        padding-top: 4px;
    }

    #attachstoredata {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 341px;
        background: #fff;
        padding: 16px 11px 20px 17px;
        box-sizing: border-box;

        & > h1 {
            font-size: 16px;
            padding-bottom: 9px;
        }

        & > p.latlon {
            padding-bottom: 10px;
        }
        & > p.ids {
            font-size: 14px;

            & > span:nth-child(1) {
                display: inline-block;
                width: 85px;
            }
            & > span:nth-child(2) {
                display: inline-block;
                width: 224px;
            }
        }

        & .attachbtns {
            display: flex;
            justify-content: space-between;
            padding-top: 10px;
        }
    }
    #attachstoredata.active {
        display: block;
    }
}

c-reveal#increments {
    & .amounts {
        & > div {
            display: flex;
            justify-content: space-between;

            & > label {
                padding-top: 7px;
                flex-grow: 2;
                width: 100px;
                display: block;
                text-align: right;
                padding-right: 12px;
            }

            & > span.input {
                padding-bottom: 8px;
                display: block;
                flex-grow: 1;
            }

            & > span.input > input {
                width: 62px;
            }
        }
    }
}


.savingstate {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    & h4 {
        position: absolute;
        width: 100%;
        text-align: center;
        font-size: 20px;
        color: gray;
        top: 171px;
    }
}
.savingstate.active {
    display: block;
}

.checkcircle {
    position: absolute;
    top: 41px;
    left: 0;
    width: 100%;
    margin: 0 auto 10px auto;
    text-align: center;

    & .icon-checkcircle {
        font-size: 98px;
        color: purple;
    }
}

/*& .spinnerhldr {
    }
    */

.spinner {
    position: absolute;
    display: block;
    width: 64px;
    height: 64px;
    top: 67px;
    left: calc(50% - 32px);

    .container1 > div,
    & .container2 > div,
    & .container3 > div {
        width: 10px;
        height: 10px;
        background-color: #b833da;

        border-radius: 100%;
        position: absolute;
        animation: bouncedelay 1.2s infinite ease-in-out;
        /* Prevent first frame from flickering when animation starts */
        animation-fill-mode: both;
    }

    .spinner-container {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    .container2 {
        transform: rotateZ(45deg);
    }

    .container3 {
        transform: rotateZ(90deg);
    }

    .circle1 {
        top: 0;
        left: 0;
    }
    .circle2 {
        top: 0;
        right: 0;
    }
    .circle3 {
        right: 0;
        bottom: 0;
    }
    .circle4 {
        left: 0;
        bottom: 0;
    }

    .container2 .circle1 {
        animation-delay: -1.1s;
    }

    .container3 .circle1 {
        animation-delay: -1s;
    }

    .container1 .circle2 {
        animation-delay: -0.9s;
    }

    .container2 .circle2 {
        animation-delay: -0.8s;
    }

    .container3 .circle2 {
        animation-delay: -0.7s;
    }

    .container1 .circle3 {
        animation-delay: -0.6s;
    }

    .container2 .circle3 {
        animation-delay: -0.5s;
    }

    .container3 .circle3 {
        animation-delay: -0.4s;
    }

    .container1 .circle4 {
        animation-delay: -0.3s;
    }

    .container2 .circle4 {
        animation-delay: -0.2s;
    }

    .container3 .circle4 {
        animation-delay: -0.1s;
    }
}

.savingstate_bg {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffffdb;
}
.savingstate_bg.active {
    display: block;
}

@-webkit-keyframes bouncedelay {
    40% {
        transform: scale(1);
    }
}

@-webkit-keyframes bouncedelay {
    0%,
    80%,
    100% {
        transform: scale(0);
    }
    40% {
        transform: scale(1);
    }
}
</style>
<c-in label="Is Active" name="isactive" type="toggle" val="${_m.machine.state.active ? "true" : "false"}" @update="${(e) => this.updateprop(e)}"></c-in>
<!--<c-in label="Brand" name="brand" type="dselect" options="${_m.brands.map((m) => m + ":" + m)}" val="${_m.machine.store.brand || "NONE"}" @update="${(e) => this.updateprop(e)}"></c-in>-->
<c-in label="Brand" name="brand" type="text" val="${_m.machine.store.brand || "NONE"}" @update="${(e) => this.updateprop(e)}"></c-in>

<ul class="items">


	<li @click="${() => this.getstorelist()}">
		<h5>Store Assignment:</h5>
		<p>${_m.machine.pwtdataid === "0000000" ? "NONE" : _m.machine.store.brand ? _m.machine.store.brand + " " + _m.machine.store.city + ", " + _m.machine.store.state : _m.machine.store.name}</p>

		<div class="actions">
			<i class="action bolder icon-edit1"></i>
		</div>

		<c-reveal id="store_assign">

			${_m.machine.pwtdataid !== "0000000" ? html`<div class="alreadyassigned">Already Assigned</div>` : html`

			<span class="justinput search">
				<i class="icon-search"></i>
				<input type="text" placeholder="Search Store Names" value="" @input="${(e) => this.search_store_name_changed(e.target.value)}">
		   </span>

			<div id="storelist">
				${_s.matching_stores.map((i) => html`
					<div class="storeitem" @click="${(e) => this.attach_store(e)}" data-pwtdataid="${i.id}">
						<p><span>#${i.storeid}</span> ${i.name}</p> 
						<p>${i.city}, ${i.state}</p>
					</div>
				`)}
			</div>
		`}

	</c-reveal>
   </li>



    <li>
        <h5>Meter Increments:</h5>
        <p>${_m.machine.incrs[0]}, ${_m.machine.incrs[1]}, ${_m.machine.incrs[2]}, ${_m.machine.incrs[3]}, ${_m.machine.incrs[4]}</p>
        <i class="action bolder icon-edit1"></i>

        <c-reveal id="increments">

			<c-in label="Store" name="incrs_store" type="dselect" val="${_m.machine.incrs[0]}" options="10 Gallon Increments:10,1 Gallon Increments:1" @update="${(e) => this.updateprop(e)}"></c-in>
			<c-in label="Pure 1" name="incrs_pure1" type="dselect" val="${_m.machine.incrs[1]}" options="10 Gallon Increments:10,1 Gallon Increments:1" @update="${(e) => this.updateprop(e)}"></c-in>
			<c-in label="Mineral 1" name="incrs_min1" type="dselect" val="${_m.machine.incrs[2]}" options="10 Gallon Increments:10,1 Gallon Increments:1" @update="${(e) => this.updateprop(e)}"></c-in>
			<c-in label="Pure 2"  name="incrs_pure2" type="dselect" val="${_m.machine.incrs[3]}" options="10 Gallon Increments:10,1 Gallon Increments:1" @update="${(e) => this.updateprop(e)}"></c-in>
			<c-in label="Mineral 2" name="incrs_min2" type="dselect" val="${_m.machine.incrs[4]}" options="10 Gallon Increments:10,1 Gallon Increments:1" @update="${(e) => this.updateprop(e)}"></c-in>

        </c-reveal>
    </li>

	<li>
		<br><br><br><br>
		<br><br><br><br>
		<br><br><br><br>
	</li>
</ul>



  <div class="savingstate_bg ${_s.savingState === 1 || _s.savingState === 2 ? "active" : ""}"></div>

  <div class="savingstate spinnerhldr ${_s.savingState === 1 ? "active" : ""}">
    <div class="spinner">
      <div class="spinner-container container1">
        <div class="circle1"></div>
        <div class="circle2"></div>
        <div class="circle3"></div>
        <div class="circle4"></div>
      </div>
      <div class="spinner-container container2">
        <div class="circle1"></div>
        <div class="circle2"></div>
        <div class="circle3"></div>
        <div class="circle4"></div>
      </div>
      <div class="spinner-container container3">
        <div class="circle1"></div>
        <div class="circle2"></div>
        <div class="circle3"></div>
        <div class="circle4"></div>
      </div>
    </div>
    <h4>Saving...</h4>
  </div>


  <div class="savingstate check ${_s.savingState === 2 ? "active" : ""}">
    <div class="checkcircle">
      <i class="icon-checkcircle"></i>
    </div>

    <h4>Saved</h4>
  </div>






`;
    };
  };
  customElements.define("vp-machine-edit", VPMachineEdit);

  // ../../.nifty/files/instance/lazy/views/machine/parts/statuses/statuses.js
  var Meter_Name = function(Meter_Name2) {
    Meter_Name2["Store"] = "Store";
    Meter_Name2["Pure1"] = "Pure1";
    Meter_Name2["Mineral1"] = "Mineral1";
    Meter_Name2["Pure2"] = "Pure2";
    Meter_Name2["Mineral2"] = "Mineral2";
    return Meter_Name2;
  }(Meter_Name || {});
  var DAY_IN_SECONDS = 86400;
  var DAILY_STATUS_CALLIN_IN_SECONDS = 8 * 3600;
  var ATTRIBUTES2 = { propa: "" };
  var VPMachineStatuses = class extends HTMLElement {
    m = { machine: {}, statuses: [], daygroups: [], timezone_at_headquarters: "Denver", meters_grand_totals: [] };
    s = { timezone: "", is_timezone_set_to_headquarters: false };
    a = { ...ATTRIBUTES2 };
    subels = [];
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
      $N.SSEvents.Add_Listener(document.body, "machines_for_notification", [2], 110, async (event) => {
        const machinepathregex = /^machines\/([^/]+)$/;
        const match = event.path.match(machinepathregex);
        if (!match || match[1] !== this.m.machine.id) return;
        const paths = [`machines/${this.m.machine.id}/statuses2`];
        const opts = [{ order_by: "ts,desc", limit: 200 }];
        const httpopts = { method: "POST", body: JSON.stringify({ paths, opts }) };
        const r = await $N.FetchLassie("/api/firestore_retrieve", httpopts, {});
        if (!r.ok) {
          return;
        }
        console.log("THIS IS SUCH A HACK. I need a unified strategy in nifty framework for handling subels of a main view and what the fuck the data pipeline looks like from localdbsync -> cmech -> view component -> subel component");
        this.m.machine = event.data;
        this.m.meters_grand_totals = get_meters_grand_totals(this.m.machine.meters_tally, this.m.machine.incrs, this.m.machine.meters_reconciles);
        this.s.timezone = this.s.is_timezone_set_to_headquarters ? this.m.timezone_at_headquarters : this.m.machine.timezone;
        this.m.statuses = parse_statuses(r[0], this.m.machine.incrs, this.s.timezone, this.m.machine.particle.id).sort((a, b) => b.ts - a.ts);
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
        const m = loadeddata.get(`1:machines/${viewparams.id}`);
        this.m.machine = m[0];
        this.m.meters_grand_totals = get_meters_grand_totals(this.m.machine.meters_tally, this.m.machine.incrs, this.m.machine.meters_reconciles);
        this.s.timezone = this.s.is_timezone_set_to_headquarters ? this.m.timezone_at_headquarters : this.m.machine.timezone;
        this.m.statuses = parse_statuses(rawstatuses, this.m.machine.incrs, this.s.timezone, this.m.machine.particle.id).sort((a, b) => b.ts - a.ts);
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
    template = (_s, _m) => {
      return html`<link rel='stylesheet' href='/assets/main.css'><style>


  .content {
    overflow-y: hidden;
  }

  .statusheader { 
    display: flex;
    border-bottom: 3px solid #c5decf;
    background: white;
    box-sizing: border-box;
    height: 103px;

    & > #auxheaderspace_a { 
      display:flex;
      width: 324px;

      & > div { 
        font-size: 12px;
        padding-top: 62px;

        & strong { 
          display: inline-block;
          padding-bottom: 3px;
          font-size: 14px;
          font-weight: 600;
        }
      }
      & > div:nth-child(1) { width: 15px;  }
      & > div:nth-child(2) { width: 103px; }
      & > div:nth-child(3) { width: 72px; }
      & > div:nth-child(4) { width: 70px; }
      & > div:nth-child(5) {  }
    }
  }


  .rotate {
    display: flex;
    flex-grow: 1;
    position: relative;

    & > div {
      position: relative;
      width:10%;
      height: 100px;
      white-space: nowrap;
      text-align: left;

      & > div {
        transform: rotate(300deg);
        transform-origin: bottom left;
        width: 100%;
        position: absolute;
        bottom: 0;
        left: 58%;
        height: 25px;

        & > span {
          /*border-bottom: 8px solid #c6decf;	*/
          font-weight: 700;
        }
      }
    }
  }


  .no_statuses {
    text-align: center;
    padding: 40px;
    font-size: 21px;
  }


  ul.statuses {
    list-style: none;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    padding-top: 0;
    display: block;
    width: 100%;
    height: calc(100% - 103px);
    overflow-x: hidden;
    overflow-y: scroll;

    & > li {
      display: flex;
      margin: 0;
      padding: 0;
      height: 38px;
      background-image: linear-gradient(180deg, transparent, transparent 48%, #c6decf 48%, #c6decf 52%, transparent 52%);

      & > aside {
        display:flex;
        width: 324px;

        & .datetime {
		  position: relative;
          color: #7b7b7b;
          width: 107px;
          font-size: 13px;
          padding: 4px 0 0 8px;
          margin: 6px 0 0 5px;
          height: 26px;
          box-sizing: border-box;
          border-radius: 8px 0 0 8px;
          background: white;
          border-radius: 8px 0 0 8px;
          border-width: 1px 0 1px 1px;
          border-color: #dee7f1;
          border-style: solid;
        }
        & .datetime.is_startup::before {
		  content: "isstartup";
		  position: absolute;
		  width: 8px;
		  height: 8px;
		  background-color: #5a8cca;
		  border-radius: 50%;
		  margin-right: 5px;
		}
        & .datetime.is_resend::before {
		  content: "isresend";
		  position: absolute;
		  width: 8px;
		  height: 8px;
		  background-color: #5a8cca;
		  border-radius: 50%;
		  margin-right: 5px;
		}

        & > .gallons {
          display: flex;
          font-size: 13px;
          padding: 6px 0px 0 0px;

          & > div {
            width: 70px;
            height: 26px;
            color: #7b7b7b;
            font-weight: normal;
            padding: 4px 0 0 8px;
            background: white;
            box-sizing: border-box;
            border-radius: 0;
            border-width: 0;
            border-color: #dee7f1;
            border-style: solid;

            & > span:nth-child(1) {
              display: inline-block;
              width: 23px;
            }
            & > span:nth-child(2) {
              display: inline-block;
              width: 16px;
            }
            & > span:nth-child(3) {
              display: inline-block;
              width: 10px;
            }

          }
          & > div:nth-child(1) {
            border-radius: 0;
            border-width: 1px 0 1px 0;
          }
          & > div:nth-child(2) {
            border-radius: 0;
            border-width: 1px 0 1px 0;
          }
          & > div:nth-child(3) {
            border-radius: 0 8px 8px 0;
            border-width: 1px 1px 1px 0;
          }
        }
      }

      & > .statuses {
        flex-grow: 1;
        display: flex;

        & > div {
          position: relative;
          text-align: center;
          width: 10%;
          background-image: linear-gradient(90deg, transparent, transparent 49%, #d9e8e0 49%, #d9e8e0 50%, transparent 50%);

          & > span.single {
            display: inline-block;
            padding-top: 6px;

            & > img {
              width: 24px;
            }
          }
          & > span.double {
            position: absolute;
            top: 6px;
            display: block;
            left: 50%;
            z-index: 2;

            & > img {
              width: 24px;
            }
          }
          & > span.double:nth-child(1) {
            margin-left: -18px;
          }
          & > span.double:nth-child(2) {
            margin-left: -7px;
          }
          & > span.double.ok {
            z-index: 1;
          }
        }
      }
    }
    
    & > li.totalsrow {
      margin-bottom: 36px;
      margin-top: 0px;

      & > aside {

        & .datetime {
          font-weight: bold;
          color: #5a8cca;
          background-color: #ebeef2;
        }

        & > .gallons {

          & > div {
            color: white;
            font-weight: bold;
            border-width: 0;
            padding-top: 5px;
          }
          & > div:nth-child(1) {
            background-color: #5b88bf;
            border-right: 2px solid #d3e5fc;
          }
          & > div:nth-child(2) {
            background-color: #5b88bf;
            border-right: 2px solid #d3e5fc;
          }
          & > div:nth-child(3) {
            background-color: #5b88bf;
          }
        }
      }
    }
  }




@media only screen and (max-device-width: 767px) {

    .statusheader .rotate {
        display: none;
    }

    ul.statuses > li > .statuses {
        display: none;
    }
}




@media only screen and (min-device-width: 768px) {

}



</style>


<div class="statusheader">
  <div id="auxheaderspace_a">
    <div>&nbsp;</div>
	<div @click="${() => this.Switch_Time_Zone()}"><strong>Timezone</strong><br>${_s.timezone == "Denver" ? "Salt Lake" : _s.timezone}</div>

	<div><strong>Store</strong><br>${_m.meters_grand_totals[0]}</div>
	<div><strong>Pure</strong><br>${_m.meters_grand_totals[1]}</div>
	<div><strong>Min</strong><br>${_m.meters_grand_totals[2]}</div>
  </div>

  <div class="rotate">
    <div><div><span>After Filter</span></div></div>
    <div><div><span>Disp Pwr</span></div></div>
    <div><div><span>Drip Pan</span></div></div>
    <div><div><span>Sump</span></div></div>
    <div><div><span>Tank</span></div></div>
    <div><div><span>UV Bulb</span></div></div>
    <div><div><span>Proc Pwr</span></div></div>
    <div><div><span>Nozzle</span></div></div>
    <div><div><span>LoRa MIA</span></div></div>
    <div><div><span>Door</span></div></div>
  </div>
</div>

<ul class="statuses">

    <li style="background:none;height: 19px;">
        <aside></aside>

        <div class="statuses">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    </li>

    ${!_m.daygroups.length ? html`
        <li style="background:none;height: 19px;">
            There are no statuses yet
        </li>
    ` : html``}

    ${_m.daygroups.map((dg) => html`

        ${dg.statuses.map((s) => html`
            <li>

              <aside>
				<div class="datetime type_${s.type}  ${s.is_startup ? "is_resend" : ""}">${s.datestr}&nbsp${s.timestr}</div>

                <div class="gallons">
                  <div><span>${s.meters.get("Store")}</span></div>
                  <div><span>${s.meters.get("Pure1")}</span><span>◉</span><span>${s.meters.get("Pure2")}</span></div>
                  <div><span>${s.meters.get("Mineral1")}</span><span>◉</span><span>${s.meters.get("Mineral2")}</span></div>
                </div>
              </aside>


              <div class="statuses">
                <div>${Lit_UnsafeHtml(s.indicators.afltlw)}</div>
                <div>${Lit_UnsafeHtml(s.indicators.dsppwr)}</div>
                <div>${Lit_UnsafeHtml(s.indicators.drppan)}</div>
                <div>${Lit_UnsafeHtml(s.indicators.smpovr)}</div>
                <div>${Lit_UnsafeHtml(s.indicators.tnklvl)}</div>
                <div>${Lit_UnsafeHtml(s.indicators.uvblb)}</div>
                <div>${Lit_UnsafeHtml(s.indicators.procpwr)}</div>
                <div>${Lit_UnsafeHtml(s.indicators.nzl)}</div>
                <div>${Lit_UnsafeHtml(s.indicators.loramia)}</div>
                <div>${Lit_UnsafeHtml(s.indicators.srvdr)}</div>
              </div>

            </li>
        `)}   

        <li class="totalsrow">

          <aside>

            <div class="datetime"><span></span><span>daily approx.</span></div>

            <div class="gallons">
              <div>${dg.summary.meters.get("Store")}</div>
              <div>${dg.summary.meters.get("Pure1") + dg.summary.meters.get("Pure2")}</div>
              <div>${dg.summary.meters.get("Mineral1") + dg.summary.meters.get("Mineral2")}</div>
            </div>

          </aside>

          <div class="statuses"></div>
        </li>

    `)}

</ul>




`;
    };
  };
  customElements.define("vp-machine-statuses", VPMachineStatuses);
  function get_meters_grand_totals(meters_tally, incrs, meters_reconciles) {
    let total_meters = meters_tally.slice();
    for (let reconcile of meters_reconciles) {
      for (let i = 0; i < 5; i++) {
        total_meters[i] += reconcile.deltas[i];
      }
    }
    const x = [total_meters[0] * incrs[0], total_meters[1] * incrs[1] + total_meters[3] * incrs[3], total_meters[2] * incrs[2] + total_meters[4] * incrs[4]];
    return x.map((v) => {
      if (v < 1e3) {
        return v.toString();
      } else if (v < 1e6) {
        return (v / 1e3).toFixed(0) + "K";
      } else {
        return (v / 1e6).toFixed(0) + "M";
      }
    });
  }
  function parse_statuses(raw_statuses, incrs, timezone, particle_id) {
    const parsed_statuses = [];
    for (let i = 0; i < raw_statuses.length; i++) {
      const s = raw_statuses[i];
      let type = 0;
      switch (s.tags.type) {
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
      const date = new Date(s.ts * 1e3);
      const x = date.toLocaleDateString("en-US", { timeZone: "America/" + timezone });
      const y = x.split("/");
      y[0] = y[0].padStart(2, "0");
      y[1] = y[1].padStart(2, "0");
      const day_of_month = Number(y[1]);
      const month = Number(y[0]);
      const datestr = y[0] + "/" + y[1];
      const timestr = date.toLocaleTimeString("en-US", { hour12: false, timeZone: "America/" + timezone });
      let meters;
      meters = /* @__PURE__ */ new Map([["Store", getMeter(incrs[0], s.meters_tally[0], raw_statuses[i + 1]?.meters_tally[0])], ["Pure1", getMeter(incrs[1], s.meters_tally[1], raw_statuses[i + 1]?.meters_tally[1])], ["Mineral1", getMeter(incrs[2], s.meters_tally[2], raw_statuses[i + 1]?.meters_tally[2])], ["Pure2", getMeter(incrs[3], s.meters_tally[3], raw_statuses[i + 1]?.meters_tally[3])], ["Mineral2", getMeter(incrs[4], s.meters_tally[4], raw_statuses[i + 1]?.meters_tally[4])]]);
      const bits_xp = parse_bits(s.bits, particle_id);
      parsed_statuses.push({ id: s.id, bits_xp, meters, datestr, timestr, date, day_of_month, month, day_summary: null, is_resend, type, ts: s.ts });
    }
    for (let i = parsed_statuses.length - 1; i >= 0; i--) {
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
      bitsXp = { procpwr: snB2 >> 4 & 1, drppan: snB1 >> 5 & 1, tnklvl: snB1 >> 4 & 1, afltlw: snB1 >> 3 & 1, dsppwr1: snB2 >> 5 & 1, nzl1: snB1 >> 0 & 1, smpovr1: snB1 >> 2 & 1, uvblb1: snB1 >> 1 & 1, srvdr1: snB2 >> 3 & 1, nzl2: snB3 >> 5 & 1, smpovr2: snB2 >> 2 & 1, uvblb2: snB2 >> 1 & 1, srvdr2: snB2 >> 0 & 1, loramia: snB3 >> 4 & 1 };
    } else if (machine_id === "e00fce68c42d8d0b3a8d019a") {
      bitsXp = { procpwr: 0, drppan: snB1 >> 4 & 1, tnklvl: snB1 >> 3 & 1, afltlw: snB1 >> 2 & 1, dsppwr1: snB1 >> 1 & 1, smpovr1: snB1 >> 0 & 1, smptime: snB2 >> 5 & 1, smptime_b: snB2 >> 4 & 1, uvblb1: snB2 >> 3 & 1, uvblb2: snB2 >> 2 & 1, srvdr1: snB2 >> 1 & 1, loramia: snB2 >> 0 & 1, smpovr2: 0, nzl1: 0, nzl2: 0, srvdr2: 0 };
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
    return { procpwr, drppan, tnklvl, afltlw, dsppwr, nzl, smpovr, uvblb, srvdr, loramia };
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
    parsed_statuses.forEach((s, index) => {
      const day_group_ts = calculate_day_group_ts(s.ts);
      let day_group = day_groups.find((dg) => dg.ts === day_group_ts);
      if (!day_group) {
        day_groups.push({ ts: day_group_ts, summary: { day_of_month: s.day_of_month, month: s.month, meters: /* @__PURE__ */ new Map([["Store", 0], ["Pure1", 0], ["Mineral1", 0], ["Pure2", 0], ["Mineral2", 0]]) }, statuses: get_statuses_for_day_group(parsed_statuses, index, day_group_ts) });
        day_group = day_groups[day_groups.length - 1];
      }
    });
    day_groups.forEach(calc_day_group_meter_totals);
    return day_groups;
    function calc_day_group_meter_totals(day_group) {
      day_group.statuses.forEach((s) => {
        for (let [key, value] of day_group.summary.meters) {
          day_group.summary.meters.set(key, value + s.meters.get(key));
        }
      });
    }
    function get_statuses_for_day_group(parsed_statuses2, index, day_group_ts) {
      const day_group_statuses = [];
      for (let i = index; i < parsed_statuses2.length; i++) {
        const s = parsed_statuses2[i];
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

  // ../../.nifty/files/instance/lazy/views/machine/machine.js
  var ATTRIBUTES3 = { propa: "" };
  var VMachine = class extends HTMLElement {
    m = { machine: {} };
    a = { ...ATTRIBUTES3 };
    s = { show_details: 0, show_edit: 0, show_map: 0, show_metersreport: 0 };
    shadow;
    static get observedAttributes() {
      return Object.keys(ATTRIBUTES3);
    }
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "open" });
    }
    async connectedCallback() {
      await $N.CMech.ViewConnectedCallback(this);
      this.dispatchEvent(new Event("hydrated"));
    }
    async attributeChangedCallback(name, oldval, newval) {
      $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    kd(loadeddata, loadstate, pathparams, _searchparams) {
      if (loadstate === "initial" || loadstate === "datachanged") {
        const machines = loadeddata.get("1:machines/" + pathparams.id);
        this.m.machine = machines[0];
      }
    }
    disconnectedCallback() {
      $N.CMech.ViewDisconnectedCallback(this);
    }
    sc(state_changes = {}) {
      this.s = Object.assign(this.s, state_changes);
      render(this.template(this.s, this.m), this.shadow);
    }
    editdone() {
      this.s.show_edit = 0;
      this.sc();
    }
    actions_menu_selected(e) {
      switch (e.detail.newval) {
        case "details":
          this.show_details();
          break;
        case "edit":
          this.show_edit();
          break;
        case "map":
          this.show_map();
          break;
        case "telemetry":
          this.show_telemetry();
          break;
        case "metersreport":
          this.show_metersreport();
          break;
      }
    }
    show_details() {
      this.s.show_details = 1;
      this.sc();
    }
    show_edit() {
      this.s.show_edit = 1;
      this.sc();
    }
    async show_map() {
      this.s.show_map = 1;
      this.sc();
    }
    async show_metersreport() {
      this.s.show_metersreport = 1;
      this.sc();
    }
    show_telemetry() {
      if (this.m.machine.machineid === "0000000") {
        alert("This machine has no telemetry");
        return;
      } else {
        $N.SwitchStation.NavigateTo(`machines/${this.m.machine.id}/telemetry`);
      }
    }
    template = (_s, _m) => {
      return html`<link rel='stylesheet' href='/assets/main.css'><style>
header.viewheader .right {
	& i               {font-size: 15px;position:relative;top: 0;left: 0;padding-right: 1px;}
	& i.icon-location { font-size: 15px; }
	& i.icon-graph    {font-size: 15px;top: -4px;padding-right: 7px;}
	& i.icon-info     {font-size: 18px;top: -3px;}
	& i.icon-edit1    {font-size: 17px;top: -1px;}
	& i.icon-location {font-size: 17px;top: -2px;}
	& i.icon-meter    {font-size: 17px;top: -2px;}
}



#actions_menu::part(instigator) {
    font-size: 22px;
    border: none;
    padding: 0;
    font-weight: bold;
	-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

#actions_menu {
	position:relative;
	font-size: 20px;
	top: -4px;
	padding: 0;
	width: 23px;
	padding-right: 15px;
	
    & > span[slot="instigator"] {
        color: var(--actioncolor);
		width: 100%;
    }
}


@media only screen and (max-device-width: 767px) {

    header.viewheader .middle {
    }

    header.viewheader .right {
    }

    header.viewheader .middle h1 {
    }

    header.viewheader .right {
		& .icon-location { display: none; }
		& .icon-graph    { display: none; }
		& .icon-info     { display: none; }
		& .icon-edit1    { display: none; }
		& .icon-location { display: none; }
		& .icon-meter    { display: none; }
    }

    header.viewheader .right .icon-graph {
    }
}

</style>

<!-- -- -->
<header class="viewheader">
    <a class="left" @click="${() => $N.SwitchStation.NavigateBack({ default: "machines" })}"><span>‸</span></a>
    <div class="middle">
        <h1>
			${_m.machine.store.brand ? _m.machine.store.brand + " " + _m.machine.store.city + ", " + _m.machine.store.state : _m.machine.store.name}
		</h1>
    </div>
    <div class="right">
		<i class="icon-info"  @click="${() => {
        this.show_details();
      }}" style=""></i>
		<i class="icon-edit1"  @click="${() => {
        this.show_edit();
      }}" style=""></i>
		<i class="icon-meter"  @click="${() => {
        this.show_metersreport();
      }}" style=""></i>
		<i class="icon-location"  @click="${() => {
        this.show_map();
      }}" style=""></i>
		<i class="icon-graph"  @click="${() => {
        this.show_telemetry();
      }}" style=""></i>
        <c-dselect id="actions_menu" type="menu" options="${localStorage.getItem("user_email") === "accounts@risingtiger.com" ? "Machine Details:details,Edit Machine:edit,Show Map:map,Show Telemetry:telemetry,Meters Report:metersreport" : "Machine Details:details,Show Map:map,Show Telemetry:telemetry,Meters Report:metersreport"}" val="" @changed="${(e) => this.actions_menu_selected(e)}"><span slot="instigator"><i class="icon-tripledot" style=""></i></span></c-dselect>
    </div>
</header>


<div class="content">

	<!--
	<h5 @click="${() => $N.FetchLassie(`/api/pwt/reports/meters_timerange?machine_record_id=${_machine.id}&daystart=${"2024-05-01"}&dayend=${"2024-06-01"}`)}">Temp Meters TimeRange</h5>
	<h5 @click="${() => $N.FetchLassie(`/api/pwt/reports/meters_alltime?machine_record_id=${_machine.id}`)}">Temp Meters AllTime</h5>
	-->

    <vp-machine-statuses></vp-machine-statuses>

</div>




${_s.show_details !== 0 ? html`
    <c-ol shape="1" title="Machine Details" @close="${() => this.sc({ show_details: 0 })}">
        <vp-machine-details machine_record_id="${_m.machine.id}"></vp-machine-details>
    </c-ol>
` : ""}




${_s.show_edit !== 0 ? html`
    <c-ol shape="1" title="Edit Machine" @close="${() => this.editdone()}">
        <vp-machine-edit></vp-machine-edit>
    </c-ol>
` : ""}




${_s.show_map !== 0 ? html`
    <c-ol shape="1" title="Location" @close="${() => this.sc({ show_map: 0 })}">
        <vp-machine-map machine_record_id="${_m.machine.id}"></vp-machine-map>
    </c-ol>
` : ""}




${_s.show_metersreport !== 0 ? html`
	<c-ol shape="1" title="${_m.machine.store.brand ? _m.machine.store.brand + " " + _m.machine.store.city + ", " + _m.machine.store.state : _m.machine.store.name}" @close="${() => this.sc({ show_metersreport: 0 })}">
		<vp-metersreport machine_record_id="${_m.machine.id}" machine_incrs="${_m.machine.incrs}" machine_ts="${_m.machine.ts}"></vp-metersreport>
    </c-ol>
` : ""}



`;
    };
  };
  customElements.define("v-machine", VMachine);
})();
