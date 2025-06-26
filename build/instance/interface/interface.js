async function ClientSync(db, client_id, clientdata) {
    return new Promise(async (res, _rej)=>{
        if (!clientdata.chipID) {
            res({
                message: "No chipID provided. No sync."
            });
            return;
        }
        if (!clientdata.storeID) {
            res({
                message: "No storeID provided. No sync."
            });
            return;
        }
        if (!clientdata.machineID) {
            res({
                message: "No machineID provided. No sync."
            });
            return;
        }
        if (!clientdata.clientName || !clientdata.city || !clientdata.state || !clientdata.zip || !clientdata.latitude || !clientdata.longitude) {
            res({
                message: "Missing one or more of: clientName, city, state, zip, latitude, longitude. No sync."
            });
            return;
        }
        client_id = client_id.padStart(7, "0");
        clientdata.chipID = clientdata.chipID.padStart(7, "0");
        clientdata.storeID = clientdata.storeID.padStart(7, "0");
        clientdata.machineID = clientdata.machineID.padStart(7, "0");
        const snapshot = await db.collection("machines").where("chip", "==", clientdata.chipID).limit(1).get();
        if (snapshot.empty) {
            res({
                message: "chipID not found. No sync."
            });
            return;
        }
        const machine = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
        };
        if (machine.pwtdataid !== "0000000" && machine.pwtdataid !== client_id) {
            res({
                message: `Chip is already associated to store: ${machine.store.name}. No sync.`
            });
            return;
        }
        const s1p = db.collection("machines").where("pwtdataid", "==", client_id).get();
        const s2p = db.collection("machines").where("store.id", "==", clientdata.storeID).get();
        const s3p = db.collection("machines").where("machineid", "==", clientdata.machineID).get();
        const [s1, s2, s3] = await Promise.all([
            s1p,
            s2p,
            s3p
        ]);
        const hasalready_a = clientsync_has_already(s1, clientdata.chipID, "client_id", client_id);
        const hasalready_b = clientsync_has_already(s2, clientdata.chipID, "storeID", clientdata.storeID);
        const hasalready_c = clientsync_has_already(s3, clientdata.chipID, "machineid", clientdata.machineID);
        if (hasalready_a) {
            res({
                message: `There is already another store with that client id associated: ${hasalready_a.store.name}`
            });
            return;
        }
        if (hasalready_b) {
            res({
                message: `storeID already in use by: ${hasalready_b.store.name}. No sync.`
            });
            return;
        }
        if (hasalready_c) {
            res({
                message: `machineID already in use by: ${hasalready_c.store.name}. No sync.`
            });
            return;
        }
        const lat = parseFloat(clientdata.latitude);
        const lon = parseFloat(clientdata.longitude);
        if (isNaN(lat) || isNaN(lon) || lat < 22 || lat > 50 || lon > -65 || lon < -125) {
            res({
                message: "Invalid lat/lon. No sync."
            });
            return;
        }
        const update = {
            "pwtdataid": client_id,
            "machineid": clientdata.machineID,
            "store.id": clientdata.storeID,
            "store.telemid": machine.store.telemid === "0000000" ? clientdata.storeID : machine.store.telemid,
            "store.name": clientdata.clientName,
            "store.city": clientdata.city,
            "store.state": clientdata.state,
            "store.zip": clientdata.zip,
            "store.latlon": [
                lat,
                lon
            ]
        };
        await db.collection("machines").doc(machine.id).update(update);
        res({
            message: "Synced"
        });
    });
}
function clientsync_has_already(snapshot, chip, prop, propval) {
    if (snapshot.empty) {
        return false;
    } else {
        const hasalready = snapshot.docs.find((d)=>{
            const data = d.data();
            let comp = false;
            if (prop === "client_id") {
                comp = data.pwtdataid === propval;
            } else if (prop === "storeID") {
                comp = data.store.id === propval;
            } else if (prop === "machineid") {
                comp = data.machineid === propval;
            }
            return data.chip !== chip && comp;
        });
        return hasalready ? hasalready.data() : false;
    }
}
async function ClientsMeters(db, influxdb, client_ids_str, timerange_str) {
    return new Promise(async (res, _rej)=>{
        const client_ids = (client_ids_str || "").split(",").map((id)=>id.padStart(7, "0"));
        const timerange = (timerange_str || "").split(",").map((t)=>parseInt(t));
        if (client_ids.length === 0) {
            res({
                message: "No client_ids provided. No meters."
            });
            return;
        }
        if (timerange.length !== 2 || isNaN(timerange[0]) || isNaN(timerange[1]) || timerange[0] > timerange[1]) {
            res({
                message: "No timerange provided or is invalid time stamps. No meters."
            });
            return;
        }
        const snapshot = await db.collection("machines").where("pwtdataid", "in", client_ids).get();
        if (snapshot.empty) {
            res({
                message: "No machines found for the provided client_ids"
            });
            return;
        }
        const machines = snapshot.docs.map((d)=>({
                id: d.id,
                ...d.data()
            }));
        let fluxstr = "";
        let ids = "";
        for(let i = 0; i < machines.length; i++){
            ids += `r.id == "${machines[i].store.telemid}" `;
            if (i < machines.length - 1) ids += "or ";
        }
        fluxstr = `from(bucket: "PWT")
                    |> range(start: ${timerange[0]}, stop: ${timerange[1]})
                    |> filter(fn: (r) => r._measurement == "MTR")
                    |> filter(fn: (r) => r._field == "Store" or r._field == "Pure1")
                    |> filter(fn: (r) => ${ids})
                    |> sum()
                    `;
        const results = await influxdb.Retrieve("PWT", fluxstr);
        const parsed_results = client_meters_parse(results);
        if (parsed_results.length === 0) {
            res({
                message: "No meters found for the provided client_ids"
            });
            return;
        }
        res(parsed_results);
    });
}
function client_meters_parse(csvstr) {
    const records = csvstr.split("\n").slice(1, -1).filter((s)=>s.length > 24).map((l)=>{
        const parts = l.trim().split(",").map((p)=>p.trim());
        return {
            id: parts[8],
            val: parts[5],
            date: new Date(parts[3]),
            field: parts[6]
        };
    });
    const result = new Array();
    records.forEach((r)=>{
        let c = result.find((c)=>c.id === r.id);
        if (!c) {
            result.push({
                id: r.id,
                store: 0,
                pure1: 0,
                mineral1: 0,
                pure2: 0,
                mineral2: 0
            });
            c = result[result.length - 1];
        }
        c[r.field.toLowerCase()] = parseInt(r.val) || 0;
    });
    return result;
}
const Interface = {
    ClientSync,
    ClientsMeters
};
export default Interface;
