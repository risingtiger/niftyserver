//type str = string; //type int = number; type bool = boolean;
//import fs from "fs"
//@ts-ignore
import jsdom from "jsdom";
import { writeFileSync, appendFileSync, existsSync } from "fs";
const SYNC_STATUS_CSVFILE = "./pwtdata_sync_all_machines_status.csv";
const SYNC_STATUS_CSV_HEADER = "chip,status,blockreason\n";
const { JSDOM } = jsdom;
var SyncStatusE = /*#__PURE__*/ function(SyncStatusE) {
    SyncStatusE["UNLINKED"] = "unlinked";
    SyncStatusE["UPDATED"] = "updated";
    SyncStatusE["BLOCKED"] = "blocked";
    SyncStatusE["UNCHANGED"] = "unchanged";
    SyncStatusE["NETWORK_ERROR"] = "network_error";
    return SyncStatusE;
}(SyncStatusE || {});
var SyncStatusBlockReasonE = /*#__PURE__*/ function(SyncStatusBlockReasonE) {
    SyncStatusBlockReasonE["NONE"] = "none";
    SyncStatusBlockReasonE["STORE_ID_CHANGED"] = "store_id_changed";
    SyncStatusBlockReasonE["MACHINE_ID_CHANGED"] = "machine_id_changed";
    SyncStatusBlockReasonE["STORE_ID_NOT_SET"] = "store_id_note_set";
    SyncStatusBlockReasonE["MACHINE_ID_NOT_SET"] = "machine_id_not_set";
    return SyncStatusBlockReasonE;
}(SyncStatusBlockReasonE || {});
const UpdateStoreList = (db)=>new Promise(async (res, rej)=>{
        let rawstorelist = "";
        try {
            const r = await fetch("https://pwtdata.com/views/default/loadList.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": "cookpass=9547ad6b651e2087bac67651aa92cd0d; cookname=Davish; PHPSESSID=7063daq66p9kd54i0fke345oa4"
                },
                body: "vid=store"
            });
            rawstorelist = await r.text();
        } catch  {
            rej();
            return;
        }
        // kind of dumb way to check if query worked or not
        if (!rawstorelist.includes("btn btn-link btn-xs btn-edit")) {
            rej();
            return;
        }
        const dom = new JSDOM(`<!DOCTYPE html><body><table>${rawstorelist}</table></body></html>`);
        const rawrows = dom.window.document.querySelector("tbody").children;
        const batch = db.batch();
        for(let i = 0; i < rawrows.length; i++){
            const tds = rawrows[i].children;
            const btnel = tds[5].querySelector("button");
            const storeid = tds[0].textContent.padStart(7, "0");
            const name = tds[1].textContent;
            const city = tds[2].textContent;
            const state = tds[3].textContent;
            const phone = tds[4].textContent;
            const id = btnel.getAttribute("data-id").padStart(7, "0");
            const client = {
                storeid,
                name,
                city,
                state,
                phone
            };
            const newdoc = db.collection('pwtdata_stores').doc(id);
            batch.set(newdoc, client);
        }
        try {
            await batch.commit();
        } catch  {
            rej();
            return;
        }
        res(1);
    });
const SyncAllMachines = (db)=>new Promise(async (res, _rej)=>{
        const machines_snapshot = await db.collection("machines").get();
        const machines = machines_snapshot.docs.map((m)=>({
                id: m.id,
                ...m.data()
            }));
        let machines_index = 0;
        const doesfileexist = existsSync(SYNC_STATUS_CSVFILE);
        if (!doesfileexist) {
            writeFileSync(SYNC_STATUS_CSVFILE, SYNC_STATUS_CSV_HEADER);
        }
        sync_all_machines___next(db, machines, machines_index);
        res(1);
    });
const GetStore = (pwtdataid)=>new Promise(async (res, rej)=>{
        //@ts-ignore
        const apikey = process.env.PWTDATA_COM_API_KEY;
        fetch(`https://pwtdata.com/get_client.php?clientID=${pwtdataid}`, {
            headers: {
                'Authorization': `Bearer ${apikey}`
            }
        }).then((r)=>{
            if (r.status !== 200) {
                rej();
                return;
            }
            return r;
        }).then((r)=>r.json()).then((r)=>{
            if (r.error) {
                rej();
                return;
            }
            res(r);
        }).catch((_err)=>{
            rej(null);
        });
    });
const GetStoreList = (db)=>new Promise(async (res, _rej)=>{
        const loadlist_collection = db.collection("pwtdata_stores");
        const r = await loadlist_collection.get().catch(()=>null);
        if (!r) {
            res(null);
            return;
        }
        const loadlist = r.docs.map((m)=>({
                id: m.id,
                ...m.data()
            }));
        res(loadlist);
    });
const AttachStore = (db, pwtdataid, machinerecordid, ts)=>new Promise(async (res, rej)=>{
        const pwtdataid_str = parseInt(pwtdataid).toString();
        const pwtdataid_str_padded = pwtdataid_str.padStart(7, "0");
        let pwtdatastore = {};
        try {
            pwtdatastore = await GetStore(pwtdataid_str);
        } catch  {
            rej();
            return;
        }
        if (pwtdatastore.active !== "1") {
            rej();
            return;
        }
        const machine_r = await db.collection("machines").doc(machinerecordid).get().catch(()=>null);
        if (!machine_r) {
            rej();
            return;
        }
        const machine = machine_r.data();
        if (machine.pwtdataid !== "0000000" || machine.store.id !== "0000000" || machine.machineid !== "0000000") {
            rej();
            return;
        }
        if (ts !== machine.ts) {
            rej();
            return;
        }
        const newts = Math.floor(Date.now() / 1000);
        const already_attached_machine_r = await db.collection("machines").where("pwtdataid", "==", pwtdataid_str_padded).get().catch(()=>null);
        if (!already_attached_machine_r || already_attached_machine_r && already_attached_machine_r.size > 0) {
            rej();
            return;
        }
        const storeid = pwtdatastore.storeID ? pwtdatastore.storeID.trim().padStart(7, "0") : "";
        const machineid = pwtdatastore.machineID ? pwtdatastore.machineID.trim().padStart(7, "0") : "";
        const name = pwtdatastore.clientName ? pwtdatastore.clientName.trim() : "";
        const city = pwtdatastore.city ? pwtdatastore.city.trim() : "";
        const state = pwtdatastore.state ? pwtdatastore.state.trim() : "";
        const zip = pwtdatastore.zip ? pwtdatastore.zip.trim() : "";
        const lat = !isNaN(pwtdatastore.latitude) ? parseFloat(pwtdatastore.latitude || 0) : 0;
        const lon = !isNaN(pwtdatastore.longitude) ? parseFloat(pwtdatastore.longitude || 0) : 0;
        if (storeid && machineid && name && city && state && zip && lat && lon) {
            const updateobj = {
                pwtdataid: pwtdataid_str_padded,
                machineid: machineid,
                "store.id": storeid,
                "store.name": name,
                "store.city": city,
                "store.state": state,
                "store.zip": zip,
                "store.latlon": [
                    lat,
                    lon
                ],
                ts: newts
            };
            try {
                await db.collection("machines").doc(machinerecordid).update(updateobj).catch(()=>null);
            } catch  {
                rej();
                return;
            }
            const store = {
                id: storeid,
                name,
                city,
                state,
                zip,
                lat,
                lon
            };
            machine.pwtdataid = pwtdataid_str_padded;
            machine.machineid = machineid, machine.store = store;
            machine.ts = newts;
            res(machine);
            return;
        }
        rej();
    });
function sync_all_machines___next(db, machines, machine_index) {
    setTimeout(async ()=>{
        if (machine_index >= machines.length) {
            console.log("done syncing machines");
            return;
        }
        let m = machines[machine_index];
        if (m.pwtdataid === "0000000") {
            appendFileSync(SYNC_STATUS_CSVFILE, `${m.chip},${"unlinked"},${"none"}\n`);
            machine_index++;
            sync_all_machines___next(db, machines, machine_index);
            return;
        }
        const r = await GetStore(parseInt(m.pwtdataid).toString());
        if (!r) {
            appendFileSync(SYNC_STATUS_CSVFILE, `${m.chip},${"network_error"},${"none"}\n`);
            machine_index++;
            sync_all_machines___next(db, machines, machine_index);
            return;
        } else if (!r.storeID || /^0+$/.test(r.storeID)) {
            appendFileSync(SYNC_STATUS_CSVFILE, `${m.chip},${"blocked"},${"store_id_note_set"}\n`);
            machine_index++;
            sync_all_machines___next(db, machines, machine_index);
            return;
        } else if (!r.machineID || /^0+$/.test(r.machineID)) {
            appendFileSync(SYNC_STATUS_CSVFILE, `${m.chip},${"blocked"},${"machine_id_not_set"}\n`);
            machine_index++;
            sync_all_machines___next(db, machines, machine_index);
            return;
        } else if (r.storeID.trim().padStart(7, '0') != m.store.id.padStart(7, '0')) {
            appendFileSync(SYNC_STATUS_CSVFILE, `${m.chip},${"blocked"},${"store_id_changed"}\n`);
            machine_index++;
            sync_all_machines___next(db, machines, machine_index);
            return;
        } else if (r.machineID.padStart(7, '0') != m.machineid.padStart(7, '0')) {
            appendFileSync(SYNC_STATUS_CSVFILE, `${m.chip},${"blocked"},${"machine_id_changed"}\n`);
            machine_index++;
            sync_all_machines___next(db, machines, machine_index);
            return;
        }
        const name = r.clientName ? r.clientName.trim() : "";
        const city = r.city ? r.city.trim() : "";
        const state = r.state ? r.state.trim() : "";
        const zip = r.zip ? r.zip.trim() : "";
        const lat = !isNaN(r.latitude) ? parseFloat(r.latitude || 0) : 0;
        const lon = !isNaN(r.longitude) ? parseFloat(r.longitude || 0) : 0;
        const changed = {};
        if (city && city != m.store.city) {
            changed["store.city"] = city;
        }
        if (state && state != m.store.state) {
            changed["store.state"] = state;
        }
        if (zip && zip != m.store.zip) {
            changed["store.zip"] = zip;
        }
        if (name && name != m.store.name) {
            changed["store.name"] = name;
        }
        if (lat && lat != m.store.latlon[0]) {
            changed["store.latlon"] = [
                lat,
                lon
            ];
        }
        if (Object.keys(changed).length > 0) {
            await db.collection("machines").doc(m.id).update(changed);
            appendFileSync(SYNC_STATUS_CSVFILE, `${m.chip},${"updated"},${"none"}\n`);
        } else {
            appendFileSync(SYNC_STATUS_CSVFILE, `${m.chip},${"unchanged"},${"none"}\n`);
        }
        machine_index++;
        sync_all_machines___next(db, machines, machine_index);
    }, 100);
}
const PWTData_Interface = {
    GetStore,
    UpdateStoreList,
    GetStoreList,
    AttachStore,
    SyncAllMachines
};
export default PWTData_Interface;
