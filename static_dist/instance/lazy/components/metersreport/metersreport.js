(() => {
  // ../../.nifty/files/instance/lazy/components/metersreport/metersreport.js
  var ModeE = function(ModeE2) {
    ModeE2["alltime"] = "alltime";
    ModeE2["monthtodate"] = "monthtodate";
    ModeE2["month"] = "month";
    ModeE2["custom"] = "custom";
    return ModeE2;
  }(ModeE || {});
  var ATTRIBUTES = { machine_record_id: "", machine_incrs: "", machine_ts: "" };
  var VPMetersReport = class extends HTMLElement {
    a = { ...ATTRIBUTES };
    s = { mode: "alltime", startday: "", endday: "", months: this.generateLast12Months(), meters_report: [], reconcile_mode: false };
    m = { prop: "" };
    shadow;
    meterLabels = ["Store", "Pure 1", "Mineral 1", "Pure 2", "Mineral 2"];
    static get observedAttributes() {
      return Object.keys(ATTRIBUTES);
    }
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "open" });
    }
    async connectedCallback() {
      const today = /* @__PURE__ */ new Date();
      const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      this.s.startday = firstOfLastMonth.toISOString().slice(0, 10);
      this.s.endday = firstOfThisMonth.toISOString().slice(0, 10);
      await $N.CMech.ViewPartConnectedCallback(this);
      await this.setToAllTime();
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
      if (this.s.mode !== "alltime") {
        this.s.reconcile_mode = false;
      }
      render(this.template(this.s, this.m), this.shadow);
    }
    generateLast12Months() {
      const months = [];
      const today = /* @__PURE__ */ new Date();
      for (let i = 1; i <= 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        const label = date.toLocaleString("default", { month: "long", year: "numeric" });
        const startday = date.toISOString().slice(0, 7) + "-01";
        const endday = nextMonth.toISOString().slice(0, 7) + "-01";
        months.push({ label, startday, endday });
      }
      return months;
    }
    async setToMonthToDate() {
      const today = /* @__PURE__ */ new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      this.s.mode = "monthtodate";
      this.s.startday = firstOfMonth.toISOString().slice(0, 10);
      this.s.endday = today.toISOString().slice(0, 10);
      await this.retrieveTimeRangeMetersReport();
      this.sc();
    }
    async setToMonth(detail) {
      const monthsindex = Number(detail.newval);
      if (monthsindex === -1) {
        return;
      }
      const month = this.s.months[monthsindex];
      this.s.mode = "month";
      this.s.startday = month.startday;
      this.s.endday = month.endday;
      await this.retrieveTimeRangeMetersReport();
      this.sc();
    }
    handleTypeMonthClick(e) {
      if (!e.target.closest("c-dselect")) {
        const cDselect = this.shadowRoot.querySelector("#select_month");
        if (cDselect) {
          cDselect.setAttribute("open", "");
        }
      }
    }
    updateStartDayFromInput(e) {
      const target = e.target;
      this.s.startday = target.value;
    }
    updateEndDayFromInput(e) {
      const target = e.target;
      this.s.endday = target.value;
    }
    async handleCustomReport() {
      await this.setToCustom(this.s.startday, this.s.endday);
    }
    async setToAllTime() {
      const r = await $N.FetchLassie(`/api/pwt/reports/meters_alltime?machine_record_id=${this.a.machine_record_id}`);
      if (!r.ok) {
        alert("Not able to get All Time Meters - ");
        return;
      }
      this.s.meters_report = r.data[0];
      this.s.mode = "alltime";
      this.sc();
    }
    async setToCustom(startday, endday) {
      this.s.mode = "custom";
      this.s.startday = startday;
      this.s.endday = endday;
      await this.retrieveTimeRangeMetersReport();
      this.sc();
    }
    async retrieveTimeRangeMetersReport() {
      const r = await $N.FetchLassie(`/api/pwt/reports/meters_timerange?machine_record_id=${this.a.machine_record_id}&daystart=${this.s.startday}&dayend=${this.s.endday}`);
      if (!r.ok) {
        alert("Not able to get Time Range Meters - ");
        return;
      }
      this.s.meters_report = r.data;
    }
    meterRowClicked(e) {
      const meterindex = Number(e.currentTarget.dataset.meterindex);
      const value = this.s.meters_report[meterindex].toString();
      navigator.clipboard.writeText(value).catch((err) => {
        console.error("Failed to copy value to clipboard:", err);
      });
      $N.ToastShow(value + " copied to clipboard");
    }
    getMeterLabel(index) {
      return this.meterLabels[index] || "";
    }
    meterInputChanged(_e, _index) {
    }
    async reconcileClicked(e) {
      if (this.s.mode !== "alltime") {
        await this.setToAllTime();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      this.s.reconcile_mode = true;
      e.detail.resolved();
      this.sc();
    }
    async reconcileSaveClicked(e) {
      const newMeterValues = [];
      for (let i = 0; i < 5; i++) {
        const input = this.shadow.querySelector(`input[name='new_reconcile_meter_${i}']`);
        const value = input ? parseFloat(input.value) || 0 : 0;
        newMeterValues.push(value);
      }
      let confirmstr = `Please verify these updated meters are correct:

${newMeterValues.map((value, i) => `${this.meterLabels[i]}: ${value.toLocaleString()}`).join("\n")}`;
      if (newMeterValues.every((v, i) => Math.abs(v - this.s.meters_report[i]) < 10)) {
        this.s.reconcile_mode = false;
        e.detail.resolved();
        this.sc();
        alert("No changes or changes were less than 10.  Not saving reconcile.");
        return false;
      }
      if (!confirm(confirmstr)) {
        this.s.reconcile_mode = false;
        e.detail.resolved();
        this.sc();
        return false;
      }
      const incrs = this.a.machine_incrs.split(",").map((m) => Number(m));
      const deltas = newMeterValues.map((newmeter, i) => newmeter - this.s.meters_report[i]).map((m, i) => Math.round(m / incrs[i]));
      const ts = this.a.machine_ts;
      const r = await $N.FetchLassie(`/api/pwt/machine/${this.a.machine_record_id}/reconcile_meters`, { method: "PUT", body: JSON.stringify({ reconcile: { deltas, ts } }) });
      if (!r.ok) {
        alert("Not able to add Reconcile - ");
        return;
      }
      this.s.reconcile_mode = false;
      e.detail.resolved();
      setTimeout(() => {
        this.setToAllTime();
      }, 300);
      $N.ToastShow("reconcile saved");
    }
    reconcileCancelClicked() {
      this.s.reconcile_mode = false;
      this.sc();
    }
    template = (_s, _m) => {
      return html`<link rel="stylesheet" href="/assets/main.css"><style>:host {
}

#types {
	display: flex;
	flex-wrap: wrap;
	box-sizing: border-box;
	justify-content: space-around;
	padding: 5px;

	& > div {
		flex: 0 0 calc(50% - 10px);
		height: 135px;
		margin-bottom: 10px;
		max-height: 135px;
		overflow: hidden;
		box-sizing: border-box;
		padding: 3px 3px;
		border: 1px solid #e9e9e9;
		border-radius: 5px;
		
		& > .wrap {
			height: 100%;
			box-sizing: border-box;
			border-radius: 5px;
			padding: 6px 6px;
			background: #f8f8f8;
		
			& > h4 {
				text-align: center;
				margin: 0;
				padding: 0 0 10px 0;
			}

			& > p {
				text-align: center;
				margin: 0;
				padding: 0;
			}
		}
	}

	& > div.slimmer {
		height: 45px;
		max-height: 45px;

		& > .wrap {
			padding-top: 9px;
		}
	}


	& > div.selected {
		border: 1px solid #a8c2d1;
		
		& h4, & p {
			color: white;
		}

		& > .wrap {
			background: #379ad5;
			color: #fff;
		}
	}


	& > div:not(.selected):hover {
		cursor: pointer;

		& > .wrap {
			background: #ddedf7;
		}
	}
}

#types > div .wrap .dateselector {

	.dateselector_row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 4px;
		padding: 0 10px;
		
		
		

		span {
			color: gray;
			position: relative;
			top: 1px;
			width: 31px;
			display: block;
			text-align: left;
		}
		input[type="date"] {
			color: gray;
			font-size: 11px;
			border: 1px solid #d1d1d1;
			border-radius: 4px;
			padding: 2px 7px;
			box-sizing: border-box;
			width: 103px;
		}
	}

	& c-btn {
		box-sizing: border-box;
		height: 26px;
		padding: 4px 6px 4px 7px;
		font-size: 12px;
		margin-top: 6px;
		width: 84px;
		text-align: center;
	}
}
#types > div.selected .wrap .dateselector span {
	color: white;
}


#results {
	& ul.items > li {
		cursor: pointer;


		& > i {
			font-size: 14px;
			position: relative;
			top: 2px;
			right: -3px;
		}


		& > h5 {
			width: 82px;
		}

		& > p {
			text-align: left;
			
		}

		& > p:last-child {
			text-align: right;
			position: relative;
			top: -8px;
			
			& > input {
				width: 95px;
				border-radius: 4px;
				border: 1px solid #dedede;
				box-sizing: border-box;
				padding: 5px 7px;
				font-size: 17px;
			}
		}
	}
	& ul.items > li:hover {
		background: #f8f8f8;
	}
}



#actionbuttons {
	margin-top: 11px;
	margin-bottom: 9px;
	padding: var(--padding-container);
	
	
	
	
	
	
	
	
	
	
	

	& > .buttonrow {
		display: flex;
		justify-content: center;

		& > p {
			color: var(--actioncolor);
			cursor: pointer;
			position: relative;
			top: 7px;
		}

		& c-btn {
			padding-left: 20px;
			padding-right: 20px;
		}
	}
	
}


</style>

<div id="types">
	<div id="type_alltime" class="${_s.mode == "alltime" ? "selected slimmer" : "slimmer"}" @click="${() => this.setToAllTime()}">
		<div class="wrap">
			<h4>Meters - All Time</h4>
			<p>&nbsp;</p>
		</div>		
	</div>

	<div id="type_monthtodate" class="${_s.mode == "monthtodate" ? "selected slimmer" : "slimmer"}" @click="${() => this.setToMonthToDate()}">
		<div class="wrap">
			<h4>Meters - MTD</h4>
			<p>&nbsp;</p>
		</div>
	</div>

	<div id="type_month" class="${_s.mode == "month" ? "selected" : ""}" @click="${(e) => this.handleTypeMonthClick(e)}">
		<div class="wrap">
			<h4>Meters - Month</h4>
			<p>
				<c-dselect 
					id="select_month" 
					options="Choose Month:-1,${_s.months.map((m, i) => m.label + ":" + i).join(",")}" 
					val="-1"
					@changed="${(e) => this.setToMonth(e.detail)}"
					@click="${(e) => e.stopPropagation()}"
				></c-dselect>
			</p>
		</div>
	</div>

	<div id="type_custom" class="${_s.mode == "custom" ? "selected" : ""}">
		<div class="wrap">
			<h4>Meters - Date Range</h4>
			<div class="dateselector">
				<div class="dateselector_row">
					<span>start</span>
					<input type="date" id="startday" name="startday" value="${_s.startday}" @change="${(e) => this.updateStartDayFromInput(e)}">
				</div>
				<div class="dateselector_row">
					<span>end</span>
					<input type="date" id="endday" name="endday" value="${_s.endday}" @change="${(e) => this.updateEndDayFromInput(e)}">
				</div>
				<div class="dateselector_row">
					<span>&nbsp;</span>
					<c-btn @click="${() => this.handleCustomReport()}" noanime>Run Report</c-btn>
				</div>
			</div>
		</div>		
	</div>
</div>


<div id="results">
	<ul class="items">
		${_s.meters_report.map(
        (meter, index) => _s.reconcile_mode ? html`
			<li class="meter-item">
				<h5>${this.getMeterLabel(index)}</h5>
				<p>${meter.toLocaleString()}</p>
				<p>	
					set new total: <input type="number" name="new_reconcile_meter_${index}" value="${meter}" @change="${(e) => this.meterInputChanged(e, index)}" />
				</p>
			</li>
			` : html`
			<li @click="${(e) => this.meterRowClicked(e)}" data-meterindex="${index}">
				<h5>${this.getMeterLabel(index)}</h5>
				<p>${meter.toLocaleString()} gallons</p>
				<i class="icon-copy action bolder"></i>
			</li>
			`
      )}
	</ul>
</div>


<div id="actionbuttons">
	${_s.reconcile_mode ? html`
			<div class="buttonrow">
				<p @click="${() => this.reconcileCancelClicked()}">cancel &nbsp; </p>
				<c-btn primary @btnclick="${(e) => this.reconcileSaveClicked(e)}" noanime>Save New Reconcile</c-btn>
			</div>
		` : html`
			<div class="buttonrow">
				<c-btn @btnclick="${(e) => this.reconcileClicked(e)}" noanime>Reconcile Meters</c-btn>
			</div>
		`}
</div>


`;
    };
  };
  customElements.define("vp-metersreport", VPMetersReport);
})();
