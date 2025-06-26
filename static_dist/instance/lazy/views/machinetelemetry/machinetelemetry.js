(() => {
  // ../../.nifty/files/instance/lazy/views/machinetelemetry/machinetelemetry.js
  var ATTRIBUTES = { propa: "" };
  var VMachineTelemetry = class extends HTMLElement {
    a = { ...ATTRIBUTES };
    s = { what: "", run_graph_update: 0, storename: "", begintime: 0, datestr: "", whatstr: "", timezone: "Denver", measurement: "", fields: [], tags: "", type: "line", intrv: 0, ppf: 0, priors: "", ismdn: true, lowhigh: "", unitterms: "", median_fields: "", median_fn: "", aggregate_str: "", statusrow_begin: 0, show_controls: 0 };
    m = { machine: {} };
    shadow;
    static get observedAttributes() {
      return Object.keys(ATTRIBUTES);
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
    disconnectedCallback() {
      $N.CMech.ViewDisconnectedCallback(this);
    }
    kd = (loadeddata, loadstate, pathparams) => {
      if (loadstate === "initial" || loadstate === "datachanged") {
        const m = loadeddata.get(`1:machines/${pathparams.id}`);
        this.m.machine = m[0];
        this.s.begintime = get_machines_midnight_UTC_time(this.s.timezone);
        this.s.datestr = get_localized_date_str(this.s.begintime, this.s.timezone);
        this.Set_It({ what: "meter_store" });
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
        switch (opt.what) {
          case "meter_store":
            this.s.whatstr = "Store Meter";
            this.s.measurement = "MTR", this.s.fields = [{ name: "Store", active: true }, { name: "Pure1", active: false }, { name: "Pure2", active: false }, { name: "Mineral1", active: false }];
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
            this.s.fields = [{ name: "Filter", active: true }, { name: "Tank", active: true }];
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
        if (opt.xtratags !== void 0) {
          this.s.tags = "machine:" + this.m.machine.machineid + "," + opt.xtratags;
          this.s.fields.forEach((f, i) => {
            f.active = i === 0 ? true : false;
          });
          this.s.priors = "";
          this.s.aggregate_str = "4_h";
        }
        if (opt.field !== void 0) {
          if (this.s.tags.split(",").length > 1 || this.s.priors !== "") {
            this.s.fields.forEach((f) => {
              f.active = f.name === opt.field ? true : false;
            });
          } else {
            const f = this.s.fields.find((f2) => f2.name === opt.field);
            f.active = f.active ? false : true;
          }
        }
        if (opt.priors !== void 0) {
          this.s.priors = opt.priors;
          this.s.tags = "machine:" + this.m.machine.machineid;
          this.s.fields.forEach((f, i) => {
            f.active = i === 0 ? true : false;
          });
          this.s.aggregate_str = "4_h";
        }
      }
      const split = this.s.aggregate_str.split("_");
      const val = Number(split[0]);
      const unit = split[1];
      const seconds = unit === "m" ? val * 60 : val * 3600;
      this.s.intrv = seconds;
      this.s.ppf = 86400 / seconds;
      if (this.s.median_fields) {
        this.s.median_fields = this.s.fields.map((f) => f.active ? f.name : "").join(",");
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
      this.Set_It({ aggregate_str: val });
      this.sc();
    }
    Set_Xtratags(val) {
      this.s.show_controls = 2;
      this.Set_It({ xtratags: val });
      this.sc();
    }
    Set_Fields(ev) {
      this.Set_It({ field: ev.currentTarget.dataset.fieldname });
      this.sc();
    }
    Set_Priors(val) {
      this.s.show_controls = 2;
      this.Set_It({ priors: val });
      this.sc();
    }
    Go_To_Selected_Day(e) {
      let datestr = e.currentTarget.value;
      const begintime = set_begin_from_selected_day(datestr, this.s.timezone);
      this.Set_It({ begintime });
      this.sc();
      function set_begin_from_selected_day(datestr2, timezone) {
        const d = new Date(datestr2);
        const timeLocalized = d.toLocaleTimeString("en-US", { hour12: false, timeZone: "America/" + timezone });
        const utcstamp = d.getTime();
        const s = timeLocalized.split(":");
        const hourseconds = Number(s[0]) * 3600;
        const minuteseconds = Number(s[1]) * 60;
        const seconds = Number(s[2]);
        const seconds_past_midnight = hourseconds + minuteseconds + seconds;
        const y = seconds_past_midnight * 1e3;
        return Math.floor((utcstamp + y) / 1e3);
      }
    }
    Go_Back_One_Day() {
      const begintime = this.s.begintime - 86400;
      this.Set_It({ begintime });
      this.sc();
    }
    Go_Next_One_Day() {
      const begintime = this.s.begintime + 86400;
      this.Set_It({ begintime });
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
    template = (_s, _m) => html`<link rel='stylesheet' href='/assets/main.css'><style>


    .viewheader {

        & .left, & .right {
            width: 38%;
        }
        & .middle {
            width: 24%;
        }

        & .right {
            display: flex;
            justify-content: flex-end;
        }
    }

    c-graphing {
        width: 100%;
        box-sizing: border-box;
    }

    header.viewheader .middle h1 {
        font-size: 16px;
    }

    input[type="date"] {
        padding: 0px 0px 0px 10px;
        color: #ffffff;
        font-size: 12px;
        font-weight: bold;
        border: none;
        outline: none;
        border-radius: 5px;
        background-image: linear-gradient(0deg, #007ac2, #19a2f4);
    }
    input[type="date"]:before, & input[type="date"]:after {
        padding: 0;
        margin: 0;
        box-sizing: border-box;
    }

    i[data-direction="dateback"] {
        display: inline-block;
        font-size: 18px;
        position: relative;
        padding-right: 8px;
        top: 3px;
        color: var(--actioncolor);
    }

    i[data-direction="dateforward"] {
        display: inline-block;
        font-size: 18px;
        position: relative;
        padding-left: 8px;
        top: 3px;
        color: var(--actioncolor);
    }

    ::-webkit-calendar-picker-indicator {
        background-color:#fff;
        padding: 5px;
        cursor: pointer;
        border-radius: 3px;
    }

    .btn-group {

        justify-content: center;

        & > button {
            font-size: 14px;
            padding: 4px 9px;
            box-shadow: none;
        }

    }

    .bottomarea {
        padding: 0px 0px 20px 0px;
        margin: 0 14px 0 50px;
    }

    #inforow {
        display: flex;
        justify-content: space-between;

        & #legend {
            display: flex;
            padding-bottom: 11px;

            & .fields {
                display: flex;
                border-right: 1px solid #979797;
                margin-right: 10px;

                & .field {
                    cursor: pointer;
                }
            }

            & .xtratags {
                display: flex;
            }

            & .priors {
                display: flex;
            }

            & .prior, & .field, & .xtratag {
                display: flex;
                align-items: center;
                margin-right: 9px;
            }

            & .color {
                width: 0px;
                height: 10px;
                border-radius: 5px;
            }
            & .color.active {
                width: 10px;
                margin-right: 5px;
            }

            & .name {
                font-size: 12px;
            }

            & .active {

                & .name {
                    font-weight: bold;
                }
            }

            & .color_0 {   background: #0091e8;   }
            & .color_1 {   background: #1eeba7;   }
            & .color_2 {   background: #eb1e7c;   }
            & .color_3 {   background: #1ad0ff;   }
        }

        & #stats {
            display: flex;

            & .average_fields {
                display: flex;

                & .average_field {
                    color: gray;
                }
            }
        }
    }


    .statuses {
        box-sizing: border-box;
        padding-left: 50px;
        padding-right: 15px;
        width: 100%;
        height: 30px;
        position: relative;
        background-color: blue;

        & .points {
            position: relative;
            width: 100%;
            height: 30px;
            background-color: red;

            & .point {
                position: absolute;
                background: green;
                width: 20px;
                height: 20px;
                border-radius: 10px;
                overflow: hidden;
            }
        }

    }


    .controls {
        padding: 14px 12px 0 12px;

        & h2 {
            padding-bottom: 10px;
            font-size: 15px;
            font-weight: bold;
            padding-bottom: 10px;
        }
    }

    .choices {
        background-color: #f8f8f8;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #dedede;
        display: flex;
        gap: 10px;
        margin-bottom: 20px;


        & .choice {
            padding: 5px 10px;
            width: 100%;
            height: 28px;
            cursor: pointer;
            background-color: white;
            border: 1px solid #c2c2c2;
            border-radius: 4px;
            box-sizing: border-box;
        }
        & .choice.active {
            background-color: var(--actioncolor);
            color: white;
            font-weight: bold;
            border: none;
        }
    }



/** Chrome */
@supports (-webkit-appearance:none) {
    input[type="date"] { padding: 3px 10px 4px 10px; } 
}


</style>
<!--

  <div class="right">
    <i class="icon-info" @click="${() => {
      this.ShowDetailsUI();
    }}" style="font-size: 25px;position: relative;top: -3px; padding-right: 12px;"></i>
    <i class="icon-edit1" @click="${() => {
      this.ShowEditUI();
    }}" style="font-size: 27px;position: relative;top: -1px; padding-right: 7px;"></i>
    <i class="icon-location" @click="${() => {
      this.ShowMap();
    }}" style="font-size: 21px;position: relative;top: 1px; padding-right: 9px;"></i>
    <i class="icon-graph" @click="${() => {
      window.location.hash = "machinetelemetry/" + _machine.chip;
    }}" style="font-size: 21px;position: relative;top: 1px;"></i>
  </div>
-->
<header class="viewheader" style="justify-content: space-between;">
    <a class="left" @click="${() => $N.SwitchStation.NavigateBack({ default: "machines" })}" style="width:34%;"><span>‸</span><span>back</span></a>
    <div class="middle" style="width:30%;">
        <div class="btn-group" style="position:relative; top:2px;">
            <button class="${_s.whatstr === "Store Meter" ? "active" : ""}" @click="${() => {
      this.Set_It({ what: "meter_store" });
    }}"><i class="icon-meter"></i> &nbsp;METERS</button>
            <button class="${_s.whatstr === "PSI" ? "active" : ""}" @click="${() => {
      this.Set_It({ what: "psi" });
    }}"><i class="icon-pressure"></i> &nbsp;PSI</button>
        </div>
    </div>
    <div class="right" style="width:30%;">
        <i id="show_aggregate_clicker" class="icon-tune" @click="${() => this.sc({ show_controls: 1 })}" style="font-size: 19px;position: relative;top: 2.5px;padding-right: 30px;position: absolute;top: 14px;right: 189px;"></i>
        <span style="display: inline-block;position: relative;top: 0px;">
            <i class="icon-arrowleft1" data-direction="dateback" @click="${() => {
      this.Go_Back_One_Day();
    }}"></i>
            <input type="date" id="day" name="day" value="${_s.datestr}" @change="${(e) => this.Go_To_Selected_Day(e)}">
            <i class="icon-arrowright1" data-direction="dateforward" @click="${() => {
      this.Go_Next_One_Day();
    }}"></i>
        </span>
    </div>
</header>

<div class="content">

    <div class="ct-chart"></div>

    <c-graphing  
        runupdate="${_s.run_graph_update}"
        tmzncy="${_s.timezone}" 
        bucket="PWT" 
        begintime="${_s.begintime}"
        measurement="${_s.measurement}" 
        fields="${_s.fields.filter((f) => f.active).map((f) => f.name).join(",")}" 
        tags="${_s.tags}" 
        type="${_s.type}" 
        intrv="${_s.intrv}" 
        nifl="${_s.nifl}"
        ppf="${_s.ppf}"
        priors="${_s.priors}"
        ismdn="${_s.ismdn}"
        lowhigh="${_s.lowhigh}"
        unitterms="${_s.unitterms}"
        median="${_s.median}">
    </c-graphing>

    <div class="bottomarea">

        <!--<vc-machinetelemetry-statusrow begin="${_s.statusrow_begin}" chip="${_s.tags.split(",")[0].split(":")[1]}"></vc-machinetelemetry-statusrow>-->

        <div id="inforow">
            <div id="legend">
                <div class="fields">
                    ${_s.fields.map((f, i) => html`
                        <div class="field ${f.active ? "active" : ""}" @click="${(ev) => this.Set_Fields(ev)}" data-fieldname="${f.name}">
                            <div class="color color_${i} ${_s.tags.split(",").length === 1 && _s.priors.length === 0 ? "active" : ""}"></div>
                            <div class="name">${f.name}</div>
                        </div>
                    `)}
                </div>

                <div class="xtratags">
                    ${_s.tags.split(",").length > 1 ? html`
                        ${_s.tags.split(",").map((t, i) => html`
                            <div class="xtratag">
                                <div class="color color_${i} active"></div>
                                <div class="name">${t.split(":")[0]}: ${t.split(":")[1]}</div>
                            </div>
                        `)}
                    ` : ""}
                </div>

                <div class="priors">
                    ${_s.priors.split(",").length > 1 ? html`
                        <div class="prior">
                            <div class="color color_0 active"></div>
                            <div class="name">Selected ${_s.priors.charAt(_s.priors.length - 1) == "d" ? "Day" : "Week"}</div>
                        </div>
                    ` : ""}

                    ${_s.priors.split(",").map((p, i) => html`
                        ${i == _s.priors.split(",").length - 1 ? "" : html`
                            <div class="prior">
                                <div class="color color_${i + 1} active"></div>
                                <div class="name">${p} ${_s.priors.charAt(_s.priors.length - 1) == "d" ? "Day" : "Week"}${Number(p) > 1 ? "s" : ""} Prior</div>
                            </div>
                        `}
                    `)}
                </div>
            </div>
            <div id="stats">
                <div class="averages">

                    <!--<vc-machinetelemetry-medians-->
                    <!--    fields="${_s.median_fields}"-->
                    <!--    chip="${_s.tags.split(",")[0].split(":")[1]}"-->
                    <!--    aggregate_fn="${_s.median_fn}"-->
                    <!--    measurement="${_s.measurement}"-->
                    <!--    unitterms="${_s.unitterms}">-->
                    <!--</vc-machinetelemetry-medians>-->

                </div>
            </div>
        </div>

    </div>

</div>




${_s.show_controls !== 0 ? html`
    <c-ol 
        shape="1" closebtn="true" showheader="true"
        @close="${() => this.sc({ show_controls: 0 })}">

        <span slot="headermiddle">Graph Settings</span>
        <div class="controls">

            <h2>Aggregate (Median) Amount</h2>

            <div class="choices aggregate">
                <div class="choice ${_s.aggregate_str === "1_h" ? "active" : ""}" @click="${() => this.Set_Aggregate("1_h")}">1hr</div>
                <div class="choice ${_s.aggregate_str === "2_h" ? "active" : ""}" @click="${() => this.Set_Aggregate("2_h")}">2hr</div>
                <div class="choice ${_s.aggregate_str === "3_h" ? "active" : ""}" @click="${() => this.Set_Aggregate("3_h")}">3hr</div>
                <div class="choice ${_s.aggregate_str === "4_h" ? "active" : ""}" @click="${() => this.Set_Aggregate("4_h")}">4hr</div>
            </div>


            <h2>Compare Stores</h2>

            <div class="choices compare_stores">
                <div class="choice ${!_s.tags.includes(",") ? "active" : ""}" @click="${() => this.Set_Xtratags("")}">Off</div>
                <div class="choice ${_s.tags.includes("chip:0064") ? "active" : ""}" @click="${() => this.Set_Xtratags("chip:0064")}">0064</div>
                <div class="choice ${_s.tags.includes("chip:0063") ? "active" : ""}" @click="${() => this.Set_Xtratags("chip:0063")}">0063</div>
            </div>

            <h2>Compare From History</h2>

            <div class="choices compare_stores">
                <div class="choice ${_s.priors.length === 0 ? "active" : ""}" @click="${() => this.Set_Priors("")}">Off</div>
                <div class="choice ${_s.priors.includes("1,2,3,d") ? "active" : ""}" @click="${() => this.Set_Priors("1,2,3,d")}">1,2,3,d</div>
                <div class="choice ${_s.priors.includes("1,7,30,d") ? "active" : ""}" @click="${() => this.Set_Priors("1,7,30,d")}">1,7,30,d</div>
            </div>

            <div>Show Average (Median) <input type="checkbox" @change="${(ev) => this.Set_Is_Median_Shown(ev)}" .checked="${_s.median_fields != ""}"></div>
            <br>

            <div>Show Status Row <input type="checkbox" @change="${(ev) => this.Set_Is_Status_Row_Shown(ev)}" .checked="${_s.statusrow_begin !== 0}"></div>
            <br>

        </div>
    </c-ol>
` : ""}



`;
  };
  customElements.define("v-machinetelemetry", VMachineTelemetry);
  function get_localized_date_str(begintime, city) {
    const d = new Date(begintime * 1e3).toLocaleDateString("en-US", { timeZone: "America/" + city });
    const split = d.split("/");
    const year = split[2];
    const month = split[0].padStart(2, "0");
    const day = split[1].padStart(2, "0");
    return year + "-" + month + "-" + day;
  }
  function get_machines_midnight_UTC_time(city) {
    const timeLocalized = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false, timeZone: "America/" + city });
    const nowUTC = Date.now() / 1e3;
    const s = timeLocalized.split(":");
    const hourseconds = Number(s[0]) * 3600;
    const minuteseconds = Number(s[1]) * 60;
    const seconds = Number(s[2]);
    const secondsPastMidnight = hourseconds + minuteseconds + seconds;
    const localizedMidnight = Math.floor(nowUTC - secondsPastMidnight);
    return localizedMidnight;
  }
})();
