class CGraphing extends HTMLElement {
    s;
    m;
    shadow;
    static get observedAttributes() {
        return [
            'runupdate'
        ];
    }
    constructor(){
        super();
        this.s = {
            bucket: "",
            msr: "",
            fields: "",
            tags: "",
            type: "line",
            intrv: 300,
            ppf: 288,
            priors: "",
            ismdn: true,
            lowhigh: "",
            unitterms: "",
            begin: 0,
            tmzncy: ""
        };
        this.shadow = this.attachShadow({
            mode: 'open'
        });
    }
    async connectedCallback() {
        this.sc();
        //await new Promise<void>(async res=> setTimeout(()=> res(), 20) )
        this.setit().then(()=>{
            this.sc();
            this.dispatchEvent(new Event('hydrated'));
        }).catch(()=>{
            window.location.href = "/index.html";
        // TODO: dont do this. fuck sakes. deal with the error
        });
    }
    async attributeChangedCallback(name, oldValue, _newValue) {
        if (name === "runupdate" && oldValue !== null) {
            this.setit().then(()=>{
                this.sc();
                this.dispatchEvent(new Event('hydrated'));
            }).catch(()=>{
                window.location.href = "/index.html";
            });
        // lets take an example. Say, at 2:03am the machine records 10 gallons and then again at 2:46am records 20 gallons. 
        //   The machine stores those records and then sums them at 3:00am. So now the telemetry's timestamp at 3:00am will show 30 gallons. 
        //   But those gallons didn't happen at 3:00am. They happened during the preceding hour. 
        // Now, the problem is that influxdb gets a telemetry point of 30 gallons at 3:00am and is assuming those gallons happened at 3:00am.
        // If you run a influx query and ask for gallons between 2:00am and 3:00am it actually returns 0 gallons because that timestamp is at 3:00am.
        // If you ask for gallons between 3:00am and 4:00am it returns 30 gallons which is not correct. 
        // The problem gets exasperated when you ask influx to aggregate the data into time windows. If you do that it actually aggregates the gallons 
        // to 4am instead of 3am. So, a reading that occured at 2:03am at the machine actually gets slotted at the 4am aggregated time window frame.
        // thats why I'm moving the begin and end dates around so the graph will actually show gallons at the 2am x frame, which is 2 frames back from influxdb aggregated time window
        // kinda funky I know.
        //const actual_begin = this.s.begin + this.s.intrv
        //const actual_end = end + this.s.intrv
        //const queries_list = await InfluxDB.Retrieve_Series(this.s.bucket, [actual_begin], [actual_end], [this.s.msr], [this.s.fields], [this.s.tags], [this.s.intrv], [this.s.priors])
        /*
			queries_list[0].forEach((q:any)=> {
				q.points.forEach((p:any)=> {
					const s = Math.floor(p.date.getTime() / 1000 - (this.s.intrv * 2))
					p.date = new Date(s * 1000)
				})
			})
			*/ // .... AND now all that crap in previous comments is irrelevant 
        }
    }
    sc() {
        render(this.template(this.s, this.m), this.shadow);
    }
    setit = ()=>new Promise(async (res, rej)=>{
            this.s.bucket = this.getAttribute("bucket");
            this.s.msr = this.getAttribute("measurement");
            this.s.fields = this.getAttribute("fields");
            this.s.tags = this.getAttribute("tags");
            this.s.type = this.getAttribute("type");
            this.s.intrv = Number(this.getAttribute("intrv"));
            this.s.ppf = Number(this.getAttribute("ppf"));
            this.s.priors = this.getAttribute("priors");
            this.s.ismdn = this.getAttribute("ismdn") === "true";
            this.s.lowhigh = this.getAttribute("lowhigh");
            this.s.unitterms = this.getAttribute("unitterms");
            this.s.begin = Number(this.getAttribute("begintime"));
            this.s.tmzncy = this.getAttribute("tmzncy");
            const end = this.s.ismdn ? this.s.begin + 86400 : this.s.begin + this.s.intrv * this.s.ppf;
            const qr = await $N.InfluxDB.Retrieve_Series(this.s.bucket, [
                this.s.begin
            ], [
                end
            ], [
                this.s.msr
            ], [
                this.s.fields
            ], [
                this.s.tags
            ], [
                this.s.intrv
            ], [
                this.s.priors
            ]).catch(()=>"");
            if (qr === "") {
                alert("error in setting graph");
                rej();
                return;
            }
            render_graph_frame(this.shadow.querySelector('.ct-chart'), this.s.type, qr[0], this.s.lowhigh, this.s.unitterms);
            res();
        });
    template = (_s, _m)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('c-graphing', CGraphing);
function render_graph_frame(el, type, series_list, y_lowhigh, unitterms) {
    const ylow = Number(y_lowhigh.split(",")[0]);
    const yhigh = Number(y_lowhigh.split(",")[1]);
    let data = {
        labels: [],
        series: []
    };
    let x_rangeticks = [];
    let x_disp_str = [];
    data = render_graph_frame___series_to_chartist_data(series_list);
    x_rangeticks = data.labels;
    x_disp_str = render_graph_frame___get_x_disp_str(series_list[0].points.map((p)=>p.date), x_rangeticks.length);
    const opts = render_graph_frame___set_common_opts(x_disp_str, ylow, yhigh, unitterms);
    el.innerHTML = "";
    const graph = type === "line" ? new Chartist_LineChart(el, data, opts) : new Chartist_BarChart(el, data, opts);
    graph.update();
    return graph;
}
function render_graph_frame___get_x_disp_str(point_dates, _ticks_count) {
    const x_disp_str = [];
    point_dates.forEach((d, _index)=>{
        const hrs = d.getHours();
        let hr12 = "";
        if (hrs === 0) hr12 = "12am";
        else if (hrs === 12) hr12 = "12pm";
        else if (hrs < 12) hr12 = hrs + "am";
        else hr12 = hrs - 12 + "pm";
        x_disp_str.push(hr12);
    });
    return x_disp_str;
}
function render_graph_frame___series_to_chartist_data(s) {
    const labels = s[0].points.map((p)=>Math.floor(p.date.getTime() / 1000));
    const series = s.map((ss)=>ss.points.map((p)=>p.val));
    return {
        labels,
        series
    };
}
function render_graph_frame___set_common_opts(x_disp_str, yl, yh, ut) {
    const short_hand_unit_term = ut.split(",")[1];
    return {
        fullWidth: true,
        showPoint: false,
        //chartPadding: {
        //    right: 20
        //},
        axisY: {
            onlyInteger: true,
            low: yl,
            high: yh,
            divisor: 10,
            labelInterpolationFnc: (val, _indx)=>{
                return `${val}${short_hand_unit_term}`;
            }
        },
        axisX: {
            labelInterpolationFnc: (_unixstamp, index)=>{
                return x_disp_str[index];
            }
        }
    };
}
export { };
