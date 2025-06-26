const ATTRIBUTES = {
    propa: ""
};
class VTradeUp extends HTMLElement {
    a = {
        ...ATTRIBUTES
    };
    m = {
        propa: ""
    };
    s = {
        propa: false,
        charts: []
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
        await $N.CMech.ViewConnectedCallback(this);
        this.dispatchEvent(new Event('hydrated'));
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewDisconnectedCallback(this);
    }
    visibled = ()=>new Promise((res)=>{
            console.log('VTradeUp is now visible');
            // Call the Dogecoin API and log the results
            fetch('http://localhost:3000/getdoge?timestart=1740842760').then((response)=>response.json()).then((data)=>{
                console.log('Dogecoin API response:', data);
                // Convert API response to a matrix format for render_chart
                const chartPoints = data.map((item, index)=>{
                    return [
                        index + 1,
                        item.open
                    ]; // First number is index+1, second is open price
                });
                // If we have data, render the chart
                if (chartPoints.length > 0) {
                    // Calculate the end value for the chart
                    const end_gross = chartPoints[chartPoints.length - 1][1];
                    // Create a chart object and render it
                    const chart = {
                        meta: {
                            yend: end_gross
                        },
                        points: chartPoints
                    };
                    this.render_chart(chartPoints, end_gross);
                }
            }).catch((error)=>{
                console.error('Error fetching Dogecoin data:', error);
            }).finally(()=>{
                res();
            });
        });
    render_chart(points, end_gross) {
        // Extract labels and y-values from chartData.points (each point is [x, y])
        const labels = points.map((point)=>point[0]);
        const seriesData = points.map((point)=>point[1]);
        const markerSeries = seriesData.map((y)=>{
            if (Math.abs(y - end_gross) < 0.0001) {
                return y;
            }
            return null;
        });
        // Prepare data in Chartist format
        const data = {
            labels: labels,
            series: [
                {
                    data: seriesData
                },
                {
                    className: 'ct-marker',
                    data: markerSeries
                }
            ]
        };
        // Define Chartist options as needed (this example enables smooth lines)
        const options = {
            showPoint: true,
            fullWidth: true,
            chartPadding: {
                right: 20
            }
        };
        // Find the chart container; assuming it is within the shadow DOM
        const chartContainer = this.shadow.querySelector('.ct-chart');
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
        const resultsArea = container.querySelector('.ab-results tbody');
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
        const resultsArea = container.querySelector('.ab-results tbody');
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
    template = (_s, _m)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('v-tradeup', VTradeUp);
var SegmentTypeE = /*#__PURE__*/ function(SegmentTypeE) {
    SegmentTypeE[SegmentTypeE["low_vol"] = 0] = "low_vol";
    SegmentTypeE[SegmentTypeE["normal"] = 1] = "normal";
    SegmentTypeE[SegmentTypeE["high_vol"] = 2] = "high_vol";
    SegmentTypeE[SegmentTypeE["jump"] = 3] = "jump";
    SegmentTypeE[SegmentTypeE["trend"] = 4] = "trend";
    return SegmentTypeE;
}(SegmentTypeE || {});
function generate_randomchart(amplitude, bias = 0) {
    const rnd = Math.random();
    const biasedRnd = bias === 0 ? rnd : bias > 0 ? Math.pow(rnd, 1 / (1 + bias)) : 1 - Math.pow(1 - rnd, 1 / (1 - bias));
    const yend = 1 - amplitude + biasedRnd * (2 * amplitude);
    const scale = amplitude / 0.04;
    // Step 2: Choose number of segments (1 to 5)
    const numSegments = Math.floor(Math.random() * 5) + 1;
    // Step 3: Select change points
    const changePoints = [];
    while(changePoints.length < numSegments - 1){
        const cp = Math.floor(Math.random() * 29) + 1; // 1 to 29
        if (!changePoints.includes(cp)) changePoints.push(cp);
    }
    changePoints.sort((a, b)=>a - b);
    // Step 4: Define segments
    const segments = [];
    let start = 0;
    for (const cp of changePoints){
        segments.push({
            start,
            end: cp,
            type: 1,
            mu: 0
        });
        start = cp;
    }
    segments.push({
        start,
        end: 30,
        type: 1,
        mu: 0
    });
    // Step 5: Assign movement types to segments
    const movementTypes = [
        0,
        1,
        2,
        3,
        4
    ];
    for (const seg of segments){
        seg.type = movementTypes[Math.floor(Math.random() * 5)];
        if (seg.type === 4) {
            seg.mu = -0.002 * scale + Math.random() * 0.004; // μ in [-0.002, 0.002]
        }
    }
    // Step 6: Generate increments for steps 1 to 30
    const increments = [];
    for(let k = 1; k <= 30; k++){
        const seg = segments.find((s)=>k > s.start && k <= s.end);
        let eta = 0;
        switch(seg?.type){
            case 0:
                eta = 0.001 * scale * normalRandom(); // σ = 0.001
                break;
            case 1:
                eta = 0.005 * scale * normalRandom(); // σ = 0.005
                break;
            case 2:
                eta = 0.01 * scale * normalRandom(); // σ = 0.01
                break;
            case 3:
                eta = 0.005 * scale * normalRandom();
                if (Math.random() < 0.1) {
                    eta += 0.02 * scale * (Math.random() < 0.5 ? -1 : 1); // ±0.02
                }
                break;
            case 4:
                eta = seg.mu + 0.005 * scale * normalRandom(); // Drift + noise
                break;
        }
        increments.push(eta);
    }
    // Step 7: Build the random walk w_k
    const w = [
        0
    ]; // w_0 = 0
    let currentW = 0;
    for (const eta of increments){
        currentW += eta;
        w.push(currentW);
    }
    // Step 8: Apply bridge adjustment and compute points
    const points = [];
    for(let k = 0; k <= 30; k++){
        const bridge = w[k] - k / 30 * w[30] + k / 30 * (yend - 1);
        const y = 1 + bridge;
        points.push([
            k,
            y > 0 ? y : 0
        ]);
    }
    return {
        meta: {
            yend
        },
        points
    };
    function normalRandom() {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
}
function geometricBrownianMotionStockMotion(time, initial_stock_price, drift, volatility) {
    // Number of time steps (arbitrary, can be adjusted)
    const steps = 100;
    const dt = time / steps; // Time increment
    const path = [
        [
            0,
            initial_stock_price
        ]
    ]; // Array to store [time, price] pairs
    // Current stock price starts at initial value
    let current_price = initial_stock_price;
    // Simulate the path
    for(let i = 1; i <= steps; i++){
        // Generate a random standard normal variable (using Box-Muller transform)
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        // GBM formula: S(t) = S(0) * exp((drift - 0.5 * volatility^2) * dt + volatility * sqrt(dt) * Z)
        const exponent = (drift - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * z;
        current_price = current_price * Math.exp(exponent);
        // Add the new [time, price] point to the path
        const current_time = i * dt;
        path.push([
            current_time,
            current_price
        ]);
    }
    return path;
}
function runtrade(entry, chart, commission, slippage, stop, is_trailing) {
    let high = entry;
    let price = 0;
    let is_stopped = false;
    let current_stop = stop;
    const trailgap = entry - stop;
    for (const point of chart.points){
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
    return {
        entry,
        end,
        end_gross: price,
        iswin,
        commission,
        slippage,
        is_stopped,
        is_trailing
    };
}
function run_averaged_batch(amplitutde, entry_price, commission, slippage, stop, is_trailing, bias) {
    const charts = [];
    for(let i = 0; i < 1000; i++){
        const chart = generate_randomchart(amplitutde, bias);
        charts.push(chart);
    }
    const trades = charts.map((c, _i)=>runtrade(entry_price, c, commission, slippage, stop, is_trailing));
    const wintrades = trades.filter((trade)=>trade.iswin);
    const losstrades = trades.filter((trade)=>!trade.iswin);
    const stoppedtrades = trades.filter((trade)=>trade.is_stopped);
    const price = trades.reduce((acc, trade)=>acc + trade.end, 0) / trades.length;
    const wins_price = wintrades.length ? wintrades.reduce((acc, trade)=>acc + trade.end, 0) / wintrades.length : 0;
    const losses_price = losstrades.length ? losstrades.reduce((acc, trade)=>acc + trade.end, 0) / losstrades.length : 0;
    const stopped_price = stoppedtrades.length ? stoppedtrades.reduce((acc, trade)=>acc + trade.end_gross, 0) / stoppedtrades.length : 0;
    const wins_cnt = trades.filter((trade)=>trade.iswin).length;
    const losses_cnt = trades.filter((trade)=>!trade.iswin).length;
    const stopped_cnt = trades.filter((trade)=>trade.is_stopped).length;
    const yend = charts.reduce((acc, chart)=>acc + chart.meta.yend, 0) / charts.length;
    const ratio = wins_cnt / (wins_cnt + losses_cnt);
    return {
        price,
        wins_price,
        losses_price,
        stopped_price,
        wins_cnt,
        losses_cnt,
        stopped_cnt,
        ratio,
        yend
    };
}
export { };
