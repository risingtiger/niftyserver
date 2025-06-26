function Retrieve_Series(bucket, begins, ends, msrs, fields, tags, intrv, priors) {
    return new Promise(async (res, rej)=>{
        const body = {
            bucket,
            begins,
            ends,
            msrs,
            fields,
            tags,
            intrv,
            priors
        };
        const r = await influx_fetch_paths("retrieve_series", body);
        if (!r.ok) {
            rej();
            return;
        }
        const parsed_data = r.data;
        for(let i = 0; i < parsed_data.length; i++){
            for(let ii = 0; ii < parsed_data[i].length; ii++){
                for(let iii = 0; iii < parsed_data[i][ii].points.length; iii++){
                    parsed_data[i][ii].points[iii].date = new Date(parsed_data[i][ii].points[iii].date);
                }
            }
        }
        res(parsed_data);
    });
}
function Retrieve_Points(bucket, begins, ends, msrs, fields, tags) {
    return new Promise(async (res, rej)=>{
        const body = {
            bucket,
            begins,
            ends,
            msrs,
            fields,
            tags
        };
        const r = await influx_fetch_paths("retrieve_points", body);
        if (!r.ok) {
            rej();
            return;
        }
        const parsed_data = r.data;
        for(let i = 0; i < parsed_data.length; i++){
            parsed_data[i].date = new Date(parsed_data[i].date);
            parsed_data[i].val = parsed_data[i].val === "true" ? true : false;
        }
        res(parsed_data);
    });
}
function Retrieve_Medians(bucket, begins, ends, dur_amounts, dur_units, msrs, fields, tags, aggregate_fn) {
    return new Promise(async (res, rej)=>{
        const body = {
            bucket,
            begins,
            ends,
            dur_amounts,
            dur_units,
            msrs,
            fields,
            tags,
            aggregate_fn
        };
        const r = await influx_fetch_paths("retrieve_medians", body);
        if (!r.ok) {
            rej();
            return;
        }
        const parsed_data = r.data;
        res(parsed_data);
    });
}
function influx_fetch_paths(path, body) {
    return new Promise(async (res)=>{
        const fetchopts = {
            method: "POST",
            body: JSON.stringify(body)
        };
        const r = await $N.FetchLassie('/api/influxdb_' + path, fetchopts);
        res(r);
    });
}
if (!window.$N) {
    window.$N = {};
}
window.$N.InfluxDB = {
    Retrieve_Series,
    Retrieve_Points,
    Retrieve_Medians
};
export { };
