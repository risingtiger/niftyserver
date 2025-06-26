async function GetChipGPSLocation(product_id, device_id) {
    return new Promise(async (res, rej)=>{
        let apir;
        let returnit;
        //@ts-ignore
        let token = process.env["PWT_DAVIS_RISINGTIGER_COM"];
        try {
            apir = await fetch(`https://api.particle.io/v1/products/${product_id}/locations/${device_id}?access_token=${token}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (apir.status !== 200) throw new Error(apir.statusText);
            let location_p = await apir.json();
            let location = location_p?.location;
            if (!location || !location.geometry || !location.geometry.coordinates || location.geometry.coordinates.length < 2 || !location.last_heard) {
                throw new Error("invalid format for particle location data");
            }
            returnit = {
                lat: location.geometry.coordinates[1],
                lon: location.geometry.coordinates[0],
                last_heard: Math.floor(new Date(location.last_heard).getTime() / 1000)
            };
        } catch (error) {
            rej();
            return;
        }
        res(returnit);
    });
}
async function GetChipDiagnostics(id) {
    return new Promise(async (res, rej)=>{
        let diagnostics_p;
        let returnit;
        //@ts-ignore
        let token = process.env["PWT_DAVIS_RISINGTIGER_COM"];
        try {
            diagnostics_p = await fetch(`https://api.particle.io/v1/diagnostics/${id}/last?access_token=${token}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (diagnostics_p.status !== 200) throw new Error(diagnostics_p.statusText);
            let diagnostics = await diagnostics_p.json();
            diagnostics = diagnostics?.diagnostics;
            if (!diagnostics || !diagnostics.payload || !diagnostics.updated_at) throw new Error();
            const nd = new Date(diagnostics.updated_at);
            const ts = Math.floor(nd.getTime() / 1000);
            returnit = {
                ...diagnostics.payload,
                ts
            };
        } catch (error) {
            rej();
            return;
        }
        res(returnit);
    });
}
async function GetChipDetails(id) {
    return new Promise(async (res, rej)=>{
        //@ts-ignore
        let token = process.env["PWT_DAVIS_RISINGTIGER_COM"];
        const details_req = await fetch(`https://api.particle.io/v1/devices/${id}?access_token=${token}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).catch(()=>null);
        const details = details_req ? await details_req.json() : null;
        if (!details) {
            rej();
            return;
        }
        if (details.error) {
            let message = "";
            if (details.error_description) message = details.error_description;
            else if (details.info) message = details.info;
            rej();
            return false;
        }
        const return_details = {
            particle_id: details.id,
            name: details.name,
            last_heard: details.last_heard,
            last_handshake_at: details.last_handshake_at,
            online: details.online,
            system_firmware_version: details.system_firmware_version,
            firmware_version: details.firmware_version,
            product_id: Number(details.product_id),
            platform_id: details.platform_id,
            serial_number: details.serial_number
        };
        res(return_details);
    });
}
async function GetIdFromChipid(chipid) {
    return new Promise(async (res, _rej)=>{
        if (chipid.length > 4) {
            res({
                message: "Chip id must be no more than 4 characters"
            });
            return;
        }
        chipid = chipid.padStart(4, "0");
        //@ts-ignore
        let token = process.env["PWT_DAVIS_RISINGTIGER_COM"];
        const devicesp = await fetch(`https://api.particle.io/v1/devices?access_token=${token}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).catch(()=>null);
        const devices = devicesp ? await devicesp.json() : null;
        if (!devices) {
            res(null);
            return;
        }
        const device = devices.find((d)=>d.name === "pwt_" + chipid);
        if (!device) {
            res(null);
            return;
        }
        res({
            id: device.id
        });
    });
}
/*
const TriggerChipFunc = (account:str, id:str, func_name:str, func_arg:str) => new Promise<any>(async (rs, _rj)=> {

	let is_ok_request = false

	switch (func_name) {

		case "sendstatus" :
			if (func_arg === "1") is_ok_request = true
			break;

		case "restart" :
			if (func_arg === "1") is_ok_request = true
			break;

		default:
			is_ok_request = false
	}

	if (!is_ok_request) {
		rs({error: "Invalid function name or argument"})
		return
	}


    let token = process.env["PWT_" + account.toUpperCase()]

    const r = await fetch(`https://api.particle.io/v1/devices/${id}/${func_name}`, { 
		method:"POST", 
		headers:  { 
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json' 
		},
		body: JSON.stringify({arg:func_arg})
	})
		.then(f=>f.json())
		.catch(error=> error)

	if (r.error) {
		rs({error: "Unable to trigger function. Error: " + r.error})
		return
	}

	rs(r)
}) 
*/ const Particle = {
    GetChipDiagnostics,
    GetChipGPSLocation,
    GetChipDetails,
    GetIdFromChipid
};
export default Particle;
