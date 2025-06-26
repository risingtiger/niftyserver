//import { General_Funcs_Get_All_Machines } from "./generalfuncs.js";
import Particle from "./particle.js";
import { writeFileSync, appendFileSync, existsSync } from "fs";
var CellLocationStatusE = /*#__PURE__*/ function(CellLocationStatusE) {
    CellLocationStatusE["INACTIVE"] = "inactive";
    CellLocationStatusE["UNLINKED"] = "unlinked";
    CellLocationStatusE["NO_STORE_GPS"] = "no_store_gps";
    CellLocationStatusE["GET_ERROR"] = "get_error";
    CellLocationStatusE["VALID"] = "valid";
    return CellLocationStatusE;
}(CellLocationStatusE || {});
const CELL_LOCATIONS_CSVFILE = "./cell_locations.csv";
const CELL_LOCATIONS_CSV_HEADER = "chip,status,lastupdate,machine_lat,machine_lon,store_lat,store_lon,distance,istoofar,isold,sourcedfrom,errmsg\n";
const Get_All_Cell_Locations = (db)=>new Promise(async (res, _rej)=>{
        const m = await db.collection("machines").get();
        const machines = m.docs.map((doc)=>({
                id: doc.id,
                ...doc.data()
            }));
        let machines_index = 0;
        const doesfileexist = existsSync(CELL_LOCATIONS_CSVFILE);
        if (!doesfileexist) {
            writeFileSync(CELL_LOCATIONS_CSVFILE, CELL_LOCATIONS_CSV_HEADER);
        }
        get_all_cell_locations__next(db, machines, machines_index);
        res(1);
    });
async function GetGPS(db, id) {
    return new Promise(async (res, rej)=>{
        let m;
        let ts = 0;
        let lat = 0;
        let lon = 0;
        let sourcedfrom = "";
        let storedistance = 0;
        let particle_diagnostics;
        let particle_location;
        let gr;
        let machine;
        try {
            m = await db.collection("machines").doc(id).get();
            machine = {
                id: m.id,
                ...m.data()
            };
        } catch  {
            rej();
            return;
        }
        try {
            particle_location = await Particle.GetChipGPSLocation(machine.particle.product, machine.particle.id);
            lat = particle_location.lat;
            lon = particle_location.lon;
            ts = particle_location.last_heard;
            sourcedfrom = "particle";
            storedistance = store_celltower_distance(lat, lon, machine.store.latlon[0], machine.store.latlon[1]);
            await db.collection("machines").doc(id).update({
                cellgps: [
                    lat,
                    lon,
                    ts
                ]
            });
            res({
                lat,
                lon,
                sourcedfrom,
                ts,
                storedistance
            });
            return;
        } catch  {}
        try {
            gr = await get_gps_from_sources(machine.particle.id);
            lat = gr.lat;
            lon = gr.lon;
            sourcedfrom = gr.sourcedfrom;
            ts = particle_diagnostics.ts;
            storedistance = store_celltower_distance(lat, lon, machine.store.latlon[0], machine.store.latlon[1]);
            await db.collection("machines").doc(id).update({
                cellgps: [
                    lat,
                    lon,
                    ts
                ]
            });
            res({
                lat,
                lon,
                sourcedfrom,
                ts,
                storedistance
            });
            return;
        } catch  {}
        try {
            if (!machine.cellgps[0] || !machine.cellgps[1] || !machine.cellgps[2]) {
                throw new Error();
            }
            lat = machine.cellgps[0];
            lon = machine.cellgps[1];
            ts = machine.cellgps[2];
            storedistance = store_celltower_distance(lat, lon, machine.store.latlon[0], machine.store.latlon[1]);
            res({
                lat,
                lon,
                sourcedfrom,
                ts,
                storedistance
            });
            return;
        } catch  {
        // no data
        }
        // at this point, give up and return a default empty location
        res({
            lat: 0,
            lon: 0,
            sourcedfrom: "none",
            ts: 0,
            storedistance: 0
        });
    });
}
async function GetReverseGeoCodeZipState(lat, lon) {
    return new Promise(async (res, _rej)=>{
        const r = await find_reverse_geocoding_zip_state(lat, lon).catch(()=>null);
        if (!r) {
            res(null);
            return;
        }
        res(r);
    });
}
async function get_gps_from_sources(particle_id) {
    return new Promise(async (res, rej)=>{
        let particle_diagnostics;
        try {
            particle_diagnostics = await Particle.GetChipDiagnostics(particle_id);
        } catch  {
            rej();
            return;
        }
        const celltower = get_celltower_identity_from_particle_diagnostics(particle_diagnostics);
        if (!celltower) {
            rej();
            return;
        }
        let sourcedfrom = "";
        let lat = 0;
        let lon = 0;
        try {
            const gr = await get_gps_from_opencellid(celltower);
            lat = gr[0];
            lon = gr[1];
            sourcedfrom = "opencellid";
        } catch  {
            try {
                const gr = await get_gps_from_unwiredlabs(celltower);
                lat = gr[0];
                lon = gr[1];
                sourcedfrom = "unwiredlabs";
            } catch  {
                rej();
                return;
            }
        }
        res({
            lat,
            lon,
            sourcedfrom
        });
    });
}
const get_celltower_identity_from_particle_diagnostics = (diagnostics)=>{
    const cellular = diagnostics.device?.network?.cellular;
    const cellGlobalIdentity = diagnostics.device?.network?.cellular?.cell_global_identity;
    if (!cellular || !cellGlobalIdentity) {
        return null;
    }
    let operator = "";
    cellular.operator = cellular.operator ? cellular.operator : "AT&T";
    if (cellular.operator.includes("AT&T")) operator = "AT&T";
    else if (cellular.operator.includes("Verizon")) operator = "Verizon";
    else if (cellular.operator.includes("T-Mobile")) operator = "T-Mobile";
    else operator = "AT&T";
    let return_obj = {
        cell_id: Number(cellGlobalIdentity.cell_id),
        country_code: Number(cellGlobalIdentity.mobile_country_code),
        network_code: Number(cellGlobalIdentity.mobile_network_code),
        area_code: Number(cellGlobalIdentity.location_area_code),
        radio_type: cellular.radio_access_technology ? cellular.radio_access_technology.toLowerCase() : "lte",
        carrier: operator
    };
    return return_obj;
};
const get_gps_from_opencellid = (celltower)=>new Promise(async (res, rej)=>{
        //@ts-ignore
        const key = process.env["OPEN_CELLID_API_KEY"];
        const mcc = celltower.country_code;
        const mnc = celltower.network_code;
        const lac = celltower.area_code;
        const cellid = celltower.cell_id;
        const url = `https://opencellid.org/cell/get?key=${key}&mcc=${mcc}&mnc=${mnc}&lac=${lac}&cid=${cellid}&format=json`;
        try {
            const openCellIdResponseP = await fetch(url, {
                method: "GET"
            });
            if (!openCellIdResponseP.ok) {
                throw new Error("status: " + openCellIdResponseP.status + " text: " + openCellIdResponseP.statusText);
            }
            const openCellIdResponse = await openCellIdResponseP.json();
            if (openCellIdResponse.error || !openCellIdResponse.lat || !openCellIdResponse.lon || openCellIdResponse.lat === 0 || openCellIdResponse.lon === 0) {
                throw new Error(openCellIdResponse.error || 'Missing/Zero lat/lon');
            }
            const gps = [
                Number(openCellIdResponse.lat.toFixed(4)),
                Number(openCellIdResponse.lon.toFixed(4))
            ];
            res(gps);
        } catch (error) {
            // no data
            rej();
        }
    });
const get_gps_from_unwiredlabs = (celltower)=>new Promise(async (res, rej)=>{
        //@ts-ignore
        const key = process.env["UNWIRED_LABS_API_KEY"];
        const mcc = celltower.country_code;
        const mnc = celltower.network_code;
        const lac = celltower.area_code;
        const cellid = celltower.cell_id;
        const url = `https://us1.unwiredlabs.com/v2/process.php`;
        const payload = {
            token: key,
            radio: celltower.radio_type,
            mcc: mcc,
            mnc: mnc,
            cells: [
                {
                    lac: lac,
                    cid: cellid
                }
            ]
        };
        try {
            const unwiredLabsResponseP = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!unwiredLabsResponseP.ok) {
                throw new Error("status: " + unwiredLabsResponseP.status + " text: " + unwiredLabsResponseP.statusText);
            }
            const unwiredLabsResponse = await unwiredLabsResponseP.json();
            if (unwiredLabsResponse.status !== 'ok' || !unwiredLabsResponse.lat || !unwiredLabsResponse.lon || unwiredLabsResponse.lat === 0 || unwiredLabsResponse.lon === 0) {
                throw new Error(unwiredLabsResponse.status || 'Missing/Zero lat/lon');
            }
            const gps = [
                Number(unwiredLabsResponse.lat.toFixed(4)),
                Number(unwiredLabsResponse.lon.toFixed(4))
            ];
            res(gps);
        } catch (error) {
            // no data
            rej();
        }
    });
async function find_reverse_geocoding_zip_state(lat, lon) {
    return new Promise(async (res, _rej)=>{
        //@ts-ignore
        let googletoken = process.env["GOOGLEAPIS_KEY"];
        let urlstr = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googletoken}`;
        const googlAPIResponseP = await fetch(urlstr, {
            method: "GET"
        }).catch(()=>null);
        if (!googlAPIResponseP) {
            res(null);
            return;
        }
        if (!googlAPIResponseP.ok) {
            res(null);
            return;
        }
        const googlAPIResponse = await googlAPIResponseP.json();
        if (googlAPIResponse && googlAPIResponse.status === "OK") {
            let zipCode = "";
            let state = "";
            if (googlAPIResponse.results && googlAPIResponse.results.length > 0) {
                const addressComponents = googlAPIResponse.results[0].address_components;
                for (const component of addressComponents){
                    if (component.types.includes("postal_code")) {
                        zipCode = component.short_name;
                    }
                    if (component.types.includes("administrative_area_level_1")) {
                        state = component.short_name;
                    }
                }
            }
            res({
                zipCode,
                state
            });
        } else {
            res({
                ok: false,
                errmsg: "Geocoding failed: " + googlAPIResponse.status
            });
            return;
        }
    });
}
/*
async function find_time_zone_by_gps(lat:number, lon:number) {   

	return new Promise<any>(async (res:any, rej:any)=> {

		let googletoken = process.env["GOOGLEAPIS_KEY"]
		const timestamp = Math.round(Date.now()/1000)

		let urlstr:string = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat}%2C${lon}&timestamp=${timestamp}&key=${googletoken}`

		const googlAPIResponseP = await fetch(urlstr, {   method: "GET"  })

		if (!googlAPIResponseP.ok) {
			const errmsg = `google timezone not ok. status: ${googlAPIResponseP.status} text: ${googlAPIResponseP.statusText}`
			rej(errmsg)
		}

		const googlAPIResponse = await googlAPIResponseP.json() as any

		if (googlAPIResponse && googlAPIResponse.status === "OK") {
		  let x = googlAPIResponse.timeZoneId.split("/")[1]
		  res(x)
		}
	}
)} 
*/ function store_celltower_distance(lat1, lon1, lat2, lon2) {
    if (lat1 === 0 || lon1 === 0 || lat2 === 0 || lon2 === 0) return 0;
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
        dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    /*
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	*/ dist = dist * 0.8684;
    return dist;
}
function get_all_cell_locations__next(db, machines, machine_index) {
    setTimeout(async ()=>{
        if (machine_index >= machines.length) {
            return;
        }
        let m = machines[machine_index];
        let r;
        try {
            r = await GetGPS(db, m.id);
            if (!r.lat || !r.lon) {
                throw new Error("Unable to retrieve GPS data and database is empty");
            }
        } catch (e) {
            appendFileSync(CELL_LOCATIONS_CSVFILE, `${m.chip},${"no_store_gps"},unknown,0,0,0,0,0.00,no,unknown,none,${e || 'none'}\n`);
            machine_index++;
            get_all_cell_locations__next(db, machines, machine_index);
            return;
        }
        const statuse = "valid";
        const formatted_date = r.ts ? new Date((r.ts || 0) * 1000).toISOString().slice(0, 10) : "unknown";
        const nowts = Math.round(Date.now() / 1000);
        const isold = r.ts ? nowts - r.ts > 60 * 60 * 24 * 7 ? "yes" : "no" : "unknown";
        const istoofar = r.storedistance ? r.storedistance > 6 ? "yes" : "no" : "unknown";
        appendFileSync(CELL_LOCATIONS_CSVFILE, `${m.chip},${statuse},${formatted_date},${r.lat},${r.lon},${m.store.latlon[0]},${m.store.latlon[1]},${r.storedistance.toFixed(2)},${istoofar},${isold},${r.sourcedfrom},${r.errmsg || 'none'}\n`);
        machine_index++;
        get_all_cell_locations__next(db, machines, machine_index);
    }, 200);
}
/*
const Is_Chip_At_Store = (db:any) => {

    return new Promise(async (res, _rej)=> {
    
        const all_machines = await General_Funcs_Get_All_Machines(db)

        for (const machine of all_machines) {
            const is_at_expected_location = get_is_at_expected_location(machine.gps, machine.storegps)
        }

        res(true)
    })
} 




function get_is_at_expected_location(gps:int[], storegps:int[]|null) : bool|null {

    const mile_in_gps = 0.000176

    if (gps[0] === 0 || gps[1] === 0 || storegps === null || storegps[0] === 0 || storegps[1] === 0) {
        return null
    }

    const d = ( (gps[1]-gps[0])**2 + (storegps[1]-storegps[0])**2 )
    const distance = Math.sqrt( Math.abs(d) )

    return (distance < mile_in_gps*5) ? true : false 
}
*/ const Location = {
    Get_All_Cell_Locations,
    GetGPS,
    GetReverseGeoCodeZipState
};
export default Location;
