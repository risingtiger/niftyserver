(() => {
  // ../../.nifty/files/instance/lazy/views/tradeup/tradeup.js
  var ATTRIBUTES = { propa: "" };
  var VTradeUp = class extends HTMLElement {
    a = { ...ATTRIBUTES };
    m = { propa: "" };
    s = { propa: false, charts: [] };
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
    visibled = () => new Promise((res) => {
      console.log("VTradeUp is now visible");
      fetch("http://localhost:3000/getdoge?timestart=1740842760").then((response) => response.json()).then((data) => {
        console.log("Dogecoin API response:", data);
        const chartPoints = data.map((item, index) => {
          return [index + 1, item.open];
        });
        if (chartPoints.length > 0) {
          const end_gross = chartPoints[chartPoints.length - 1][1];
          const chart = { meta: { yend: end_gross }, points: chartPoints };
          this.render_chart(chartPoints, end_gross);
        }
      }).catch((error) => {
        console.error("Error fetching Dogecoin data:", error);
      }).finally(() => {
        res();
      });
    });
    render_chart(points, end_gross) {
      const labels = points.map((point) => point[0]);
      const seriesData = points.map((point) => point[1]);
      const markerSeries = seriesData.map((y) => {
        if (Math.abs(y - end_gross) < 1e-4) {
          return y;
        }
        return null;
      });
      const data = { labels, series: [{ data: seriesData }, { className: "ct-marker", data: markerSeries }] };
      const options = { showPoint: true, fullWidth: true, chartPadding: { right: 20 } };
      const chartContainer = this.shadow.querySelector(".ct-chart");
      new Chartist_LineChart(chartContainer, data, options);
    }
    generateSingle(e) {
      const container = this.shadow.getElementById(`sideA`);
      if (!container) return;
      const ampInput = container.querySelector('input[name="amplitude"]');
      const commInput = container.querySelector('input[name="commission"]');
      const slipInput = container.querySelector('input[name="slippage"]');
      const stopInput = container.querySelector('input[name="stop"]');
      const biasInput = container.querySelector('input[name="bias"]');
      const trailInput = container.querySelector('input[name="is_trailing"]');
      const amplitude = parseFloat(ampInput.value);
      const commission = parseFloat(commInput.value);
      const slippage = parseFloat(slipInput.value);
      const stop = parseFloat(stopInput.value);
      const bias = parseFloat(biasInput.value);
      const is_trailing = trailInput.checked;
      const chart = generate_randomchart(amplitude, bias);
      const r = runtrade(1, chart, commission, slippage, stop, is_trailing);
      this.render_chart(chart.points, r.end_gross);
      const row = document.createElement("tr");
      row.innerHTML = `
						<td>${r.end_gross.toFixed(4)}</td>
						<td>--</td>
						<td>--</td>
						<td>--</td>
						<td>${r.iswin ? 1 : 0}</td>
						<td>${r.iswin ? 0 : 1}</td>
						<td>--</td>
						<td>${r.is_stopped ? 1 : 0}</td>`;
      const resultsArea = container.querySelector(".ab-results tbody");
      resultsArea.innerHTML = "";
      resultsArea.appendChild(row);
      e.detail.resolved();
    }
    generateBatch(side) {
      const container = this.shadow.getElementById(`side${side}`);
      if (!container) return;
      const ampInput = container.querySelector('input[name="amplitude"]');
      const commInput = container.querySelector('input[name="commission"]');
      const slipInput = container.querySelector('input[name="slippage"]');
      const stopInput = container.querySelector('input[name="stop"]');
      const biasInput = container.querySelector('input[name="bias"]');
      const trailInput = container.querySelector('input[name="is_trailing"]');
      const amplitude = parseFloat(ampInput.value);
      const commission = parseFloat(commInput.value);
      const slippage = parseFloat(slipInput.value);
      const stop = parseFloat(stopInput.value);
      const bias = parseFloat(biasInput.value);
      const is_trailing = trailInput.checked;
      const batch = run_averaged_batch(amplitude, 1, commission, slippage, stop, is_trailing, bias);
      const row = document.createElement("tr");
      row.innerHTML = `
						<td>${batch.yend.toFixed(4)}</td>
						<td>${batch.price.toFixed(4)}</td>
						<td>${batch.wins_price.toFixed(4)}</td>
						<td>${batch.losses_price.toFixed(4)}</td>
						<td>${batch.ratio.toFixed(3)}</td>
						<td>${batch.wins_cnt}</td>
						<td>${batch.losses_cnt}</td>
						<td>${batch.stopped_price.toFixed(4)}</td>
						<td>${batch.stopped_cnt}</td>`;
      const resultsArea = container.querySelector(".ab-results tbody");
      resultsArea?.appendChild(row);
    }
    generateBatchA(e) {
      this.generateBatch("A");
      e.detail.resolved();
    }
    generateBatchB(e) {
      this.generateBatch("B");
      e.detail.resolved();
    }
    sc() {
      render(this.template(this.s, this.m), this.shadow);
    }
    template = (_s, _m) => {
      return html`<link rel='stylesheet' href='/assets/main.css'><style>



.ct-label{fill:rgba(0,0,0,.4);color:rgba(0,0,0,.4);font-size:.75rem;line-height:1}.ct-chart-bar .ct-label,.ct-chart-line .ct-label{display:flex}.ct-chart-donut .ct-label,.ct-chart-pie .ct-label{dominant-baseline:central}.ct-label.ct-horizontal.ct-start{align-items:flex-end;justify-content:flex-start;text-align:left}.ct-label.ct-horizontal.ct-end{align-items:flex-start;justify-content:flex-start;text-align:left}.ct-label.ct-vertical.ct-start{align-items:flex-end;justify-content:flex-end;text-align:right}.ct-label.ct-vertical.ct-end{align-items:flex-end;justify-content:flex-start;text-align:left}.ct-chart-bar .ct-label.ct-horizontal.ct-start{align-items:flex-end;justify-content:center;text-align:center}.ct-chart-bar .ct-label.ct-horizontal.ct-end{align-items:flex-start;justify-content:center;text-align:center}.ct-chart-bar.ct-horizontal-bars .ct-label.ct-horizontal.ct-start{align-items:flex-end;justify-content:flex-start;text-align:left}.ct-chart-bar.ct-horizontal-bars .ct-label.ct-horizontal.ct-end{align-items:flex-start;justify-content:flex-start;text-align:left}.ct-chart-bar.ct-horizontal-bars .ct-label.ct-vertical.ct-start{align-items:center;justify-content:flex-end;text-align:right}.ct-chart-bar.ct-horizontal-bars .ct-label.ct-vertical.ct-end{align-items:center;justify-content:flex-start;text-align:left}.ct-grid{stroke:rgba(0,0,0,.2);stroke-width:1px;stroke-dasharray:2px}.ct-grid-background{fill:none}.ct-point{stroke-width:10px;stroke-linecap:round}.ct-line{fill:none;stroke-width:4px}.ct-area{stroke:none;fill-opacity:.1}.ct-bar{fill:none;stroke-width:10px}.ct-slice-donut{fill:none;stroke-width:60px}.ct-series-a .ct-bar,.ct-series-a .ct-line,.ct-series-a .ct-point,.ct-series-a .ct-slice-donut{stroke:#d70206}.ct-series-a .ct-area,.ct-series-a .ct-slice-pie{fill:#d70206}.ct-series-b .ct-bar,.ct-series-b .ct-line,.ct-series-b .ct-point,.ct-series-b .ct-slice-donut{stroke:#f05b4f}.ct-series-b .ct-area,.ct-series-b .ct-slice-pie{fill:#f05b4f}.ct-series-c .ct-bar,.ct-series-c .ct-line,.ct-series-c .ct-point,.ct-series-c .ct-slice-donut{stroke:#f4c63d}.ct-series-c .ct-area,.ct-series-c .ct-slice-pie{fill:#f4c63d}.ct-series-d .ct-bar,.ct-series-d .ct-line,.ct-series-d .ct-point,.ct-series-d .ct-slice-donut{stroke:#d17905}.ct-series-d .ct-area,.ct-series-d .ct-slice-pie{fill:#d17905}.ct-series-e .ct-bar,.ct-series-e .ct-line,.ct-series-e .ct-point,.ct-series-e .ct-slice-donut{stroke:#453d3f}.ct-series-e .ct-area,.ct-series-e .ct-slice-pie{fill:#453d3f}.ct-series-f .ct-bar,.ct-series-f .ct-line,.ct-series-f .ct-point,.ct-series-f .ct-slice-donut{stroke:#59922b}.ct-series-f .ct-area,.ct-series-f .ct-slice-pie{fill:#59922b}.ct-series-g .ct-bar,.ct-series-g .ct-line,.ct-series-g .ct-point,.ct-series-g .ct-slice-donut{stroke:#0544d3}.ct-series-g .ct-area,.ct-series-g .ct-slice-pie{fill:#0544d3}.ct-series-h .ct-bar,.ct-series-h .ct-line,.ct-series-h .ct-point,.ct-series-h .ct-slice-donut{stroke:#6b0392}.ct-series-h .ct-area,.ct-series-h .ct-slice-pie{fill:#6b0392}.ct-series-i .ct-bar,.ct-series-i .ct-line,.ct-series-i .ct-point,.ct-series-i .ct-slice-donut{stroke:#e6805e}.ct-series-i .ct-area,.ct-series-i .ct-slice-pie{fill:#e6805e}.ct-series-j .ct-bar,.ct-series-j .ct-line,.ct-series-j .ct-point,.ct-series-j .ct-slice-donut{stroke:#dda458}.ct-series-j .ct-area,.ct-series-j .ct-slice-pie{fill:#dda458}.ct-series-k .ct-bar,.ct-series-k .ct-line,.ct-series-k .ct-point,.ct-series-k .ct-slice-donut{stroke:#eacf7d}.ct-series-k .ct-area,.ct-series-k .ct-slice-pie{fill:#eacf7d}.ct-series-l .ct-bar,.ct-series-l .ct-line,.ct-series-l .ct-point,.ct-series-l .ct-slice-donut{stroke:#86797d}.ct-series-l .ct-area,.ct-series-l .ct-slice-pie{fill:#86797d}.ct-series-m .ct-bar,.ct-series-m .ct-line,.ct-series-m .ct-point,.ct-series-m .ct-slice-donut{stroke:#b2c326}.ct-series-m .ct-area,.ct-series-m .ct-slice-pie{fill:#b2c326}.ct-series-n .ct-bar,.ct-series-n .ct-line,.ct-series-n .ct-point,.ct-series-n .ct-slice-donut{stroke:#6188e2}.ct-series-n .ct-area,.ct-series-n .ct-slice-pie{fill:#6188e2}.ct-series-o .ct-bar,.ct-series-o .ct-line,.ct-series-o .ct-point,.ct-series-o .ct-slice-donut{stroke:#a748ca}.ct-series-o .ct-area,.ct-series-o .ct-slice-pie{fill:#a748ca}.ct-square{display:block;position:relative;width:100%}.ct-square:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:100%}.ct-square:after{content:"";display:table;clear:both}.ct-square>svg{display:block;position:absolute;top:0;left:0}.ct-minor-second{display:block;position:relative;width:100%}.ct-minor-second:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:93.75%}.ct-minor-second:after{content:"";display:table;clear:both}.ct-minor-second>svg{display:block;position:absolute;top:0;left:0}.ct-major-second{display:block;position:relative;width:100%}.ct-major-second:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:88.8888888889%}.ct-major-second:after{content:"";display:table;clear:both}.ct-major-second>svg{display:block;position:absolute;top:0;left:0}.ct-minor-third{display:block;position:relative;width:100%}.ct-minor-third:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:83.3333333333%}.ct-minor-third:after{content:"";display:table;clear:both}.ct-minor-third>svg{display:block;position:absolute;top:0;left:0}.ct-major-third{display:block;position:relative;width:100%}.ct-major-third:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:80%}.ct-major-third:after{content:"";display:table;clear:both}.ct-major-third>svg{display:block;position:absolute;top:0;left:0}.ct-perfect-fourth{display:block;position:relative;width:100%}.ct-perfect-fourth:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:75%}.ct-perfect-fourth:after{content:"";display:table;clear:both}.ct-perfect-fourth>svg{display:block;position:absolute;top:0;left:0}.ct-perfect-fifth{display:block;position:relative;width:100%}.ct-perfect-fifth:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:66.6666666667%}.ct-perfect-fifth:after{content:"";display:table;clear:both}.ct-perfect-fifth>svg{display:block;position:absolute;top:0;left:0}.ct-minor-sixth{display:block;position:relative;width:100%}.ct-minor-sixth:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:62.5%}.ct-minor-sixth:after{content:"";display:table;clear:both}.ct-minor-sixth>svg{display:block;position:absolute;top:0;left:0}.ct-golden-section{display:block;position:relative;width:100%}.ct-golden-section:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:61.804697157%}.ct-golden-section:after{content:"";display:table;clear:both}.ct-golden-section>svg{display:block;position:absolute;top:0;left:0}.ct-major-sixth{display:block;position:relative;width:100%}.ct-major-sixth:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:60%}.ct-major-sixth:after{content:"";display:table;clear:both}.ct-major-sixth>svg{display:block;position:absolute;top:0;left:0}.ct-minor-seventh{display:block;position:relative;width:100%}.ct-minor-seventh:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:56.25%}.ct-minor-seventh:after{content:"";display:table;clear:both}.ct-minor-seventh>svg{display:block;position:absolute;top:0;left:0}.ct-major-seventh{display:block;position:relative;width:100%}.ct-major-seventh:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:53.3333333333%}.ct-major-seventh:after{content:"";display:table;clear:both}.ct-major-seventh>svg{display:block;position:absolute;top:0;left:0}.ct-octave{display:block;position:relative;width:100%}.ct-octave:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:50%}.ct-octave:after{content:"";display:table;clear:both}.ct-octave>svg{display:block;position:absolute;top:0;left:0}.ct-major-tenth{display:block;position:relative;width:100%}.ct-major-tenth:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:40%}.ct-major-tenth:after{content:"";display:table;clear:both}.ct-major-tenth>svg{display:block;position:absolute;top:0;left:0}.ct-major-eleventh{display:block;position:relative;width:100%}.ct-major-eleventh:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:37.5%}.ct-major-eleventh:after{content:"";display:table;clear:both}.ct-major-eleventh>svg{display:block;position:absolute;top:0;left:0}.ct-major-twelfth{display:block;position:relative;width:100%}.ct-major-twelfth:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:33.3333333333%}.ct-major-twelfth:after{content:"";display:table;clear:both}.ct-major-twelfth>svg{display:block;position:absolute;top:0;left:0}.ct-double-octave{display:block;position:relative;width:100%}.ct-double-octave:before{display:block;float:left;content:"";width:0;height:0;padding-bottom:25%}.ct-double-octave:after{content:"";display:table;clear:both}.ct-double-octave>svg{display:block;position:absolute;top:0;left:0}
.ct-series.ct-marker .ct-point {
  stroke: #000000;
  stroke-width: 20px;
}


.ct-chart {

	& .ct-series { 
		& .ct-line {
			stroke-width: 1.5px;
		}

		& .ct-bar {
		}
	}
	& .ct-series-a .ct-line, & .ct-series-a .ct-bar { stroke: #0091e8; }
	& .ct-series-b .ct-line, & .ct-series-b .ct-bar { stroke: #1eeba7; }
	& .ct-series-c .ct-line, & .ct-series-c .ct-bar { stroke: #eb1e7c; }
	& .ct-series-d .ct-line, & .ct-series-d .ct-bar { stroke: #1ad0ff; }
}

/* A/B Comparison Styles */
.ab-comparison {
  display: flex;
  gap: 10px;
}
.ab-column {
  flex: 1;
  border: none;
  padding: 0;
  min-width: 0; /* Prevents content from overflowing the flex item */
  overflow-x: auto; /* Allows horizontal scrolling if table content overflows */
}
.ab-column h2 {
  text-align: center;
  margin-top: 0;
}
.ab-field {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}
.ab-field label {
  flex-basis: 40%;
  margin-right: 0.5rem;
}
.ab-field input[type="number"],
.ab-field input[type="checkbox"] {
  flex: 1;
}

.ab-results {
  margin-top: 1rem;
}
.ab-results table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.ab-results th,
.ab-results td {
  border: 1px solid #ddd;
  padding: 0 0 0 5px;
  text-align: left;
  font-size: 12px;
}
.ab-results th {
  background-color: #f7f7f7;
}
</style>


<header class="viewheader">
    <a class="left" @click="${() => $N.SwitchStation.NavigateBack({ default: "home" })}"><span>‸</span></a>
    <div class="middle">
        <h1>
			Trade Up
		</h1>
    </div>
    <div class="right">
		&nbsp;
    </div>
</header>

<div class="content">


  <div class="ab-comparison">
    <div class="ab-column" id="sideA">
      <h2>Option A</h2>
      <div class="ab-field">
        <label for="ampA">Amplitude:</label>
        <input id="ampA" name="amplitude" type="number" step="0.001" value="0.06">
      </div>
      <div class="ab-field">
        <label for="commA">Commission:</label>
        <input id="commA" name="commission" type="number" step="0.001" value="0.002">
      </div>
      <div class="ab-field">
        <label for="slipA">Slippage:</label>
        <input id="slipA" name="slippage" type="number" step="0.001" value="0.002">
      </div>
      <div class="ab-field">
        <label for="stopA">Stop:</label>
        <input id="stopA" name="stop" type="number" step="0.001" value="0.965">
      </div>
      <div class="ab-field">
        <label for="biasA">Bias:</label>
        <input id="biasA" name="bias" type="number" step="0.001" value="0">
      </div>
      <div class="ab-field">
        <label for="trailA">Trailing:</label>
        <input id="trailA" name="is_trailing" type="checkbox">
      </div>
      <c-btn @btnclick="${(e) => this.generateBatchA(e)}">Batch</c-btn>
      <c-btn @btnclick="${(e) => this.generateSingle(e)}">Single</c-btn>
      <div class="ab-results" id="resultsA">
        <table>
          <thead>
            <tr>
              <th>yend</th>
              <th>price</th>
              <th>wins</th>
              <th>losses</th>
              <th>ratio</th>
              <th>wins</th>
              <th>losses</th>
              <th>stopped</th>
              <th>stopped</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>

    <!-- Column B -->
    <div class="ab-column" id="sideB">

      <h2>Option B</h2>
      <div class="ab-field">
        <label for="ampB">Amplitude:</label>
        <input id="ampB" name="amplitude" type="number" step="0.001" value="0.06">
      </div>
      <div class="ab-field">
        <label for="commB">Commission:</label>
        <input id="commB" name="commission" type="number" step="0.001" value="0.002">
      </div>
      <div class="ab-field">
        <label for="slipB">Slippage:</label>
        <input id="slipB" name="slippage" type="number" step="0.001" value="0.002">
      </div>
      <div class="ab-field">
        <label for="stopB">Stop:</label>
        <input id="stopB" name="stop" type="number" step="0.001" value="0.965">
      </div>
      <div class="ab-field">
        <label for="biasA">Bias:</label>
        <input id="biasA" name="bias" type="number" step="0.001" value="0">
      </div>

      <div class="ab-field">
        <label for="trailB">Trailing:</label>
        <input id="trailB" name="is_trailing" type="checkbox">
      </div>
      <c-btn @btnclick="${(e) => this.generateBatchB(e)}">Generate</c-btn>
      <div class="ab-results" id="resultsB">
        <table>
          <thead>
            <tr>
              <th>yend</th>
              <th>price</th>
              <th>wins</th>
              <th>losses</th>
              <th>ratio</th>
              <th>wins</th>
              <th>losses</th>
              <th>stopped</th>
              <th>stopped</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  </div>

  <br><br><br>
  <div class="ct-chart ct-octave"></div>
  <c-btn @btnclick="${(e) => this.view_randomchart(e)}">View Random Chart</c-btn>

</div>


`;
    };
  };
  customElements.define("v-tradeup", VTradeUp);
  var SegmentTypeE = function(SegmentTypeE2) {
    SegmentTypeE2[SegmentTypeE2["low_vol"] = 0] = "low_vol";
    SegmentTypeE2[SegmentTypeE2["normal"] = 1] = "normal";
    SegmentTypeE2[SegmentTypeE2["high_vol"] = 2] = "high_vol";
    SegmentTypeE2[SegmentTypeE2["jump"] = 3] = "jump";
    SegmentTypeE2[SegmentTypeE2["trend"] = 4] = "trend";
    return SegmentTypeE2;
  }(SegmentTypeE || {});
  function generate_randomchart(amplitude, bias = 0) {
    const rnd = Math.random();
    const biasedRnd = bias === 0 ? rnd : bias > 0 ? Math.pow(rnd, 1 / (1 + bias)) : 1 - Math.pow(1 - rnd, 1 / (1 - bias));
    const yend = 1 - amplitude + biasedRnd * (2 * amplitude);
    const scale = amplitude / 0.04;
    const numSegments = Math.floor(Math.random() * 5) + 1;
    const changePoints = [];
    while (changePoints.length < numSegments - 1) {
      const cp = Math.floor(Math.random() * 29) + 1;
      if (!changePoints.includes(cp)) changePoints.push(cp);
    }
    changePoints.sort((a, b) => a - b);
    const segments = [];
    let start = 0;
    for (const cp of changePoints) {
      segments.push({ start, end: cp, type: 1, mu: 0 });
      start = cp;
    }
    segments.push({ start, end: 30, type: 1, mu: 0 });
    const movementTypes = [0, 1, 2, 3, 4];
    for (const seg of segments) {
      seg.type = movementTypes[Math.floor(Math.random() * 5)];
      if (seg.type === 4) {
        seg.mu = -2e-3 * scale + Math.random() * 4e-3;
      }
    }
    const increments = [];
    for (let k = 1; k <= 30; k++) {
      const seg = segments.find((s) => k > s.start && k <= s.end);
      let eta = 0;
      switch (seg?.type) {
        case 0:
          eta = 1e-3 * scale * normalRandom();
          break;
        case 1:
          eta = 5e-3 * scale * normalRandom();
          break;
        case 2:
          eta = 0.01 * scale * normalRandom();
          break;
        case 3:
          eta = 5e-3 * scale * normalRandom();
          if (Math.random() < 0.1) {
            eta += 0.02 * scale * (Math.random() < 0.5 ? -1 : 1);
          }
          break;
        case 4:
          eta = seg.mu + 5e-3 * scale * normalRandom();
          break;
      }
      increments.push(eta);
    }
    const w = [0];
    let currentW = 0;
    for (const eta of increments) {
      currentW += eta;
      w.push(currentW);
    }
    const points = [];
    for (let k = 0; k <= 30; k++) {
      const bridge = w[k] - k / 30 * w[30] + k / 30 * (yend - 1);
      const y = 1 + bridge;
      points.push([k, y > 0 ? y : 0]);
    }
    return { meta: { yend }, points };
    function normalRandom() {
      const u1 = Math.random();
      const u2 = Math.random();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
  }
  function runtrade(entry, chart, commission, slippage, stop, is_trailing) {
    let high = entry;
    let price = 0;
    let is_stopped = false;
    let current_stop = stop;
    const trailgap = entry - stop;
    for (const point of chart.points) {
      price = point[1];
      if (price < current_stop) {
        is_stopped = true;
        break;
      }
      if (price > high) {
        high = price;
        if (is_trailing) current_stop = high - trailgap;
      }
    }
    const end = price - commission - slippage;
    const iswin = end > entry;
    return { entry, end, end_gross: price, iswin, commission, slippage, is_stopped, is_trailing };
  }
  function run_averaged_batch(amplitutde, entry_price, commission, slippage, stop, is_trailing, bias) {
    const charts = [];
    for (let i = 0; i < 1e3; i++) {
      const chart = generate_randomchart(amplitutde, bias);
      charts.push(chart);
    }
    const trades = charts.map((c, _i) => runtrade(entry_price, c, commission, slippage, stop, is_trailing));
    const wintrades = trades.filter((trade) => trade.iswin);
    const losstrades = trades.filter((trade) => !trade.iswin);
    const stoppedtrades = trades.filter((trade) => trade.is_stopped);
    const price = trades.reduce((acc, trade) => acc + trade.end, 0) / trades.length;
    const wins_price = wintrades.length ? wintrades.reduce((acc, trade) => acc + trade.end, 0) / wintrades.length : 0;
    const losses_price = losstrades.length ? losstrades.reduce((acc, trade) => acc + trade.end, 0) / losstrades.length : 0;
    const stopped_price = stoppedtrades.length ? stoppedtrades.reduce((acc, trade) => acc + trade.end_gross, 0) / stoppedtrades.length : 0;
    const wins_cnt = trades.filter((trade) => trade.iswin).length;
    const losses_cnt = trades.filter((trade) => !trade.iswin).length;
    const stopped_cnt = trades.filter((trade) => trade.is_stopped).length;
    const yend = charts.reduce((acc, chart) => acc + chart.meta.yend, 0) / charts.length;
    const ratio = wins_cnt / (wins_cnt + losses_cnt);
    return { price, wins_price, losses_price, stopped_price, wins_cnt, losses_cnt, stopped_cnt, ratio, yend };
  }
})();
