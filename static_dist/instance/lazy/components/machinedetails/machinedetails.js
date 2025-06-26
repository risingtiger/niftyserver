(() => {
  // ../../.nifty/files/instance/lazy/components/machinedetails/machinedetails.js
  var ATTRIBUTES = { machine_record_id: "" };
  var VPMachineDetails = class extends HTMLElement {
    a = { ...ATTRIBUTES };
    m = { mdetails: { particle: {}, state: {}, store_meters: [], incrs: [] } };
    s = { show_particle_more: false };
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
      return new Promise(async (res) => {
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
        setTimeout(() => {
          this.shadow.querySelector(".definewrap").scrollTo({ behavior: "smooth", top: 1e4 });
        }, 100);
        res(1);
      });
    }
    template = (_s, _mdetails) => {
      return html`<link rel="stylesheet" href="/assets/main.css"><style>
:host {
    display: block;
}

.definewrap {
    width: 100%;
    height: 100%;
}


    h4 {
        padding: 12px 0 5px 12px;
        font-size: 18px;
        border-bottom: 1px solid #ebebeb;
    }

</style>

<div class="definewrap">

    <h4>Identifiers &amp; Accounts</h4>

    <ul class="items">
        <li>
            <h5>Code Version</h5>
            <p>${_mdetails.particle.codeversion}</p>
        </li>

        <li>
            <h5>Chip ID</h5>
            <p>${_mdetails.chip}</p>
        </li>

        <li>
            <h5>PwtData ID</h5>
            <p><a href="https://pwtdata.com/index.php?action=view&controller=clients&clientID=${_mdetails.pwtdataid}" target="_blank">${_mdetails.pwtdataid}</a></p>
        </li>

        <li>
            <h5>Machine ID</h5>
            <p>${_mdetails.machineid}</p>
        </li>

        <li>
            <h5>Store ID</h5>
            <p>${_mdetails.store_id}</p>
        </li>

        <li>
            <h5>Store Name</h5>
            <p>${_mdetails.store_name}</p>
        </li>

        <li>
            <h5>Record ID</h5>
            <p>${_mdetails.id}</p>
        </li>

        <li>
            <h5>Particle Id</h5>
            <p>${_mdetails.particle.id}</p>
        </li>

        <li>
            <h5>Particle Serial</h5>
            <p>${_mdetails.particle.serial}</p>
        </li>

        <li>
            <h5>Particle Product</h5>
            <p>${_mdetails.particle.product}</p>
        </li>
    </ul>

    <br><br>
    <h4>Current State</h4>

    <ul class="items">
        <li>
            <h5>Is Active</h5>
            <p>${_mdetails.state_isactive}</p>
        </li>

        <li>
            <h5>Cellular</h5>
            <p>Strength ${_mdetails.cellsignal} -- Quality ${_mdetails.cellquality}</p>
        </li>

        <li>
            <h5>Cell Connectivity</h5>
            <p>${_mdetails.cellconnectivity === 2 ? "Full Connect" : _mdetails.cellconnectivity === 1 ? "Partial Connect" : "?"}</p>
        </li>

        <li>
            <h5>Cellular GPS</h5>
            <p>${_mdetails.cellgps_lat}, ${_mdetails.cellgps_lon}</p>
        </li>

        <li>
            <h5>GPS Last Update</h5>
            <p>
				${_mdetails.cellgps_ts > 0 ? new Date(_mdetails.cellgps_ts * 1e3).toLocaleDateString() : "N/A"} 
            </p>
        </li>

        <li>
            <h5>Status Str</h5>
            <p>${_mdetails.state_latest}</p>
        </li>

        <li>
            <h5>Dispenser Mode</h5>
            <p>${_mdetails.dispenser_mode === "lora" ? "LoRa" : _mdetails.dispenser_mode === "switching" ? "Switching Discrete" : _mdetails.dispenser_mode === "discrete" ? "Discrete" : "?"}</p>
        </li>

        <li>
            <h5>Lora Version</h5>
            <p>${_mdetails.dispenser_loraversion}</p>
        </li>

        <li>
            <h5>Meters Tally</h5>
            <p>${_mdetails.meters_tally[0]}, ${_mdetails.meters_tally[1]}, ${_mdetails.meters_tally[2]}, ${_mdetails.meters_tally[3]}, ${_mdetails.meters_tally[4]}</p>
        </li>

        <li>
            <h5>Meter Increments</h5>
            <p>${_mdetails.incrs[0]}, ${_mdetails.incrs[1]}, ${_mdetails.incrs[2]}, ${_mdetails.incrs[3]}, ${_mdetails.incrs[4]}</p>
        </li>
            
        <li>
            <h5>TS</h5>
            <p>${new Date(_mdetails.ts * 1e3).toLocaleDateString()} at ${new Date(_mdetails.ts * 1e3).toLocaleTimeString()}</p>
        </li>
    </ul>

    <br><br>

    ${_s.show_particle_more ? html`` : html`
        <div style="text-align: center;padding: 20px;">
            <c-btn @btnclick="${(e) => this.GetAndShowParticleDeviceDetails(e)}">VIEW MORE PARTICLE DETAILS</button>
			<br><br>&nbsp;
        </div>
    `}

    ${_s.show_particle_more ? html`
        <h4>Particle More Details</h4>

        <ul class="items" style="margin-bottom:14px;">
            <li>
                <h5>Name</h5>
                <p>${_mdetails.particle_more.name}</p>
            </li>

            <li>
                <h5>Last Heard</h5>
                <p>${new Date(_mdetails.particle_more.last_heard).toLocaleDateString() + " at " + new Date(_mdetails.particle_more.last_heard).toLocaleTimeString()}</p>
            </li>

            <li>
                <h5>Last Handshake At</h5>
                <p>${new Date(_mdetails.particle_more.last_handshake_at).toLocaleDateString() + " at " + new Date(_mdetails.particle_more.last_handshake_at).toLocaleTimeString()}</p>
            </li>

            <li>
                <h5>Is Online</h5>
                <p>${_mdetails.particle_more.online}</p>
            </li>

            <li>
                <h5>System Firmware Version</h5>
                <p>${_mdetails.particle_more.system_firmware_version}</p>
            </li>

            <li>
                <h5>Firmware Version</h5>
                <p>${_mdetails.particle_more.firmware_version}</p>
            </li>
        </ul>
    ` : html``}

    <span style="display: block;padding-left: 13px;padding-bottom: 13px;font-size: 0.9em;">*timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}</span>

</div>



`;
    };
  };
  customElements.define("vp-machine-details", VPMachineDetails);
  function expand(machine) {
    let dispenser_mode = "";
    let particle_product = "";
    switch (machine.dispenser.mode) {
      case 0 /* OnLoRa */:
        dispenser_mode = "lora";
        break;
      case 1 /* OnSwitchingDiscrete */:
        dispenser_mode = "switching";
        break;
      case 2 /* OnDiscrete */:
        dispenser_mode = "discrete";
        break;
      default:
        dispenser_mode = "discrete";
        break;
    }
    switch (machine.particle.product) {
      case 11724:
        particle_product = "BSeries";
        break;
      case 11723:
        particle_product = "Boron";
        break;
      default:
        particle_product = "Unknown";
        break;
    }
    const machine_details = { cellsignal: machine.cell[0], cellquality: machine.cell[1], cellconnectivity: machine.cell[2], chip: machine.chip, id: machine.id, dispenser_mode, dispenser_loraversion: dispenser_mode == "lora" ? machine.dispenser.lora_version.toString() : "N/A", cellgps_lat: machine.cellgps[2] > 0 ? machine.cellgps[0].toString() : "N/A", cellgps_lon: machine.cellgps[2] > 0 ? machine.cellgps[1].toString() : "N/A", cellgps_ts: machine.cellgps[2] > 0 ? machine.cellgps[1] : 0, incrs: machine.incrs, pwtdataid: machine.pwtdataid, machineid: machine.machineid, meters_tally: machine.meters_tally, particle: { codeversion: machine.particle.codeversion, id: machine.particle.id, product: particle_product, serial: machine.particle.serial }, particle_more: null, state_isactive: machine.state.active, state_latest: machine.state.latest, store_id: machine.store.id, store_name: machine.store.name, ts: machine.ts };
    return machine_details;
  }
})();
