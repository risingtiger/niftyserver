(() => {
  // ../../.nifty/files/instance/lazy/components/machinemap/machinemap.js
  var ATTRIBUTES = { machine_record_id: "" };
  var VPMachineMap = class extends HTMLElement {
    a = { ...ATTRIBUTES };
    m = { lat: 0, lon: 0, storedistance: 0, ts: 0, sourcedfrom: "database", errmsg: "" };
    s = { success: false, isold: false, istoofar: false };
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
      const r = await $N.FetchLassie(`/api/pwt/chip_gps?id=${this.a.machine_record_id}`, {});
      if (!r.ok) {
        this.m.lat = 0;
        this.m.lon = 0;
        this.s.success = false;
        this.m.storedistance = 0;
        this.m.ts = 0;
        console.log("map fetch error: ", r.statusText);
      } else {
        const rd = r.data;
        this.m.sourcedfrom = rd.sourcedfrom || "";
        this.m.lat = rd.lat;
        this.m.lon = rd.lon;
        this.s.success = rd.lat !== 0 && rd.lon !== 0;
        this.m.storedistance = rd.storedistance || 0;
        this.m.errmsg = r.statusText || "";
        this.m.ts = rd.ts || 0;
        const now = (/* @__PURE__ */ new Date()).getTime() / 1e3;
        if (now - this.m.ts > 60 * 60 * 24 * 7) {
          this.s.isold = true;
        }
        if (this.m.storedistance > 6) {
          this.s.istoofar = true;
        }
      }
      this.sc();
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
      } else if (loadstate === "lateloaded") {
      }
    }
    sc() {
      render(this.template(this.s, this.m), this.shadow);
    }
    template = (_s, _m) => {
      return html`<style>:host {
  display: block;
}


#map_info {
  margin-top: 15px;
  display: b;
  justify-content: space-around; /* Use space-around for better spacing */
  align-items: center; /* Vertically align items */
  padding: 0 10px; /* Add some horizontal padding */
  flex-wrap: wrap; /* Allow items to wrap on smaller screens */
  gap: 10px; /* Add gap between items */
}

.info-item {
  display: block;
  align-items: center;
  gap: 8px; /* Space between icon, label, and value */
  text-align: left; /* Align text to the left */
  padding: 5px 0; /* Add some vertical padding */
}

.info-item ion-icon {
  font-size: 22px; /* Slightly smaller icon */
  color: var(--ion-color-medium-shade); /* Use a standard color */
}

.info-item .label {
  font-weight: normal; /* Less emphasis on label */
  color: var(--ion-color-medium-shade);
}

.info-item .value {
  font-weight: bold; /* Emphasize the value */
  color: var(--ion-color-dark-shade);
}

.info-item .value.attention {
  color: var(--errorcolor); /* Use theme's danger color for attention */
}

/* Responsive adjustments if needed */
@media (max-width: 400px) {
  #map_info {
    flex-direction: column; /* Stack items vertically on small screens */
    align-items: flex-start; /* Align items to the start */
    padding-left: 20px; /* Indent stacked items */
  }
  .info-item {
    width: 100%; /* Make items take full width when stacked */
  }
}

.warning-container {
  display: flex;
  text-align: center;
  margin-top: 10px;
  width: 100%;
  border-top: 1px solid #ececec;
  padding-top: 10px;
}



.warning-item {
  flex: 1;
  font-weight: bold;
  font-size: 17px;
}
.warning-item.attention {
  color: var(--errorcolor); /* Use theme's danger color for attention */
}



</style>

<!--<span slot="headermiddle">Location</span>-->

${_s.success ? html`
<iframe 
    width="100%" 
    height="400px" 
    frameborder="0" 
    src="https://www.google.com/maps/embed/v1/place?key=AIzaSyCGeIYK8t4IZuhyAf7z_xsFTjGZKIHePHI&q=${_m.lat},${_m.lon}&zoom=10&maptype=roadmap"
    allowfullscreen
    style="border-bottom: 3px solid #a0a0a0;">
</iframe>

<div id="map_info">
    <div class="info-item">
        <span class="label">Last Located at:</span>
        ${_m.ts ? html`
            <span class="value ${_s.isold ? "attention" : ""}">
                ${new Date(_m.ts * 1e3).toLocaleDateString()}
            </span>
        ` : html`<span class="value">Unknown</span>`}
    </div>
    <div class="info-item">
        <span class="label">Cell Tower Distance from Store:</span>
        ${_m.storedistance ? html`
            <span class="value ${_s.istoofar ? "attention" : ""}">
                ${_m.storedistance.toFixed(2)} miles
            </span>
        ` : html`<span class="value">Unknown</span>`}
    </div>

    ${_s.isold || _s.istoofar ? html`
    <div class="warning-container">
		${_s.isold ? html`<div class="warning-item attention">Out of Date</div>` : ""}
		${_s.istoofar ? html`<div class="warning-item attention">Not at Store</div>` : ""}
    </div>
    ` : ""}

    <div class="info-item">
		${_m.sourcedfrom === "database" ? html`STALE & Err Msg: ${_m.errmsg}` : _m.sourcedfrom}
	</div>
</div>


` : html`

<div id="map_info">
    <div class="info-item">
        <p>Loading or Unable to Locate Machine</p>
    </div>
</div>

`}



`;
    };
  };
  customElements.define("vp-machine-map", VPMachineMap);
})();
