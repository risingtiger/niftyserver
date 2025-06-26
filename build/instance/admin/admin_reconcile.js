import { writeFileSync } from "fs";
const RECONCILE_CSVFILE = "./reconcile.csv";
const RECONCILE_CSV_HEADER = "chip,msg\n";
//import {FieldValue} from "@google-cloud/firestore"
//import fs from "fs";
const Between_Particle_And_Machines = async (db)=>{
    return new Promise(async (res, _rej)=>{
        debugger;
        const particle_chips = await all_account_chips();
        const machines_collection = db.collection("machines");
        const machines_snapshot = await machines_collection.get();
        const machines = machines_snapshot.docs.map((m)=>({
                id: m.id,
                ...m.data()
            }));
        const all_particle_chips = [
            ...particle_chips.llc,
            ...particle_chips.east,
            ...particle_chips.west,
            ...particle_chips.nat
        ];
        let csv_str = "";
        machines.forEach((m)=>{
            let rowstr = "";
            const particle_chip = all_particle_chips.find((d)=>{
                return d.id == m.particle.id;
            });
            const particle_account_and_chip_type_from_product_id = match_particle_product_to_account_and_chip_type(m.particle.product);
            if (!particle_chip) {
                rowstr = m.chip + "," + `doesn't have matching particle device`;
            } else {
                const is_particle_id_duplicate = machines.filter((mm)=>mm !== m && mm.particle.id === m.particle.id);
                const is_machineid_duplicate = machines.filter((mm)=>mm !== m && mm.machineid !== "0000000" && mm.machineid === m.machineid);
                const is_chip_duplicate = machines.filter((mm)=>mm !== m && mm.chip === m.chip);
                const is_store_id_duplicate = machines.filter((mm)=>mm !== m && mm.store.id !== "0000000" && mm.store.id === m.store.id);
                const is_pwtdataid_duplicate = machines.filter((mm)=>mm !== m && mm.pwtdataid !== "0000000" && mm.pwtdataid === m.pwtdataid);
                const is_missing_machineid = m.pwtdataid !== "0000000" && m.machineid === "0000000";
                const is_missing_storeid = m.pwtdataid !== "0000000" && m.store.id === "0000000";
                const is_missing_latlon = m.pwtdataid !== "0000000" && (m.store.lat === 0 || m.store.lon === 0);
                const is_ids_not_7_chars = m.chip.length !== 7 || m.machineid.length !== 7 || m.store.id.length !== 7 || m.pwtdataid.length !== 7;
                const is_particle_serial_wrong = m.particle.serial !== particle_chip.serial_number;
                const is_particle_product_wrong = m.particle.product !== particle_chip.product_id;
                const is_particle_account_wrong = get_is_particle_account_wrong(m.particle.account, particle_account_and_chip_type_from_product_id?.account);
                const is_particle_name_wrong = "pwt_" + m.chip.slice(3) !== particle_chip.name;
                const is_particle_not_in_product = particle_chip.product_id === particle_chip.platform_id;
                if (is_particle_id_duplicate.length > 0) {
                    rowstr = m.chip + "," + `has duplicate particle id ${m.particle.id}`;
                }
                if (is_machineid_duplicate.length > 0) {
                    rowstr = m.chip + "," + `has duplicate machineid ${m.machineid}`;
                }
                if (is_chip_duplicate.length > 0) {
                    rowstr = m.chip + "," + `has duplicate chip ${m.chip}`;
                }
                if (is_store_id_duplicate.length > 0) {
                    rowstr = m.chip + "," + `has duplicate store id ${m.store.id}`;
                }
                if (is_pwtdataid_duplicate.length > 0) {
                    rowstr = m.chip + "," + `has duplicate pwtdataid ${m.pwtdataid}`;
                }
                if (is_missing_machineid) {
                    rowstr = m.chip + "," + `missing machineid`;
                }
                if (is_missing_storeid) {
                    rowstr = m.chip + "," + `missing store id`;
                }
                if (is_missing_latlon) {
                    rowstr = m.chip + "," + `missing lat lon`;
                }
                if (is_ids_not_7_chars) {
                    rowstr = m.chip + "," + `has ids not 7 chars`;
                }
                if (is_particle_serial_wrong) {
                    rowstr = m.chip + "," + `has wrong particle serial`;
                }
                if (is_particle_product_wrong) {
                    rowstr = m.chip + "," + `has wrong particle product`;
                }
                if (is_particle_account_wrong) {
                    rowstr = m.chip + "," + `has wrong particle account`;
                }
                if (is_particle_name_wrong) {
                    rowstr = m.chip + "," + `particle chip name ${particle_chip.name} doesnt match firestore machine chip ${m.chip}`;
                }
                if (is_particle_not_in_product) {
                    rowstr = m.chip + "," + `particle chip ${particle_chip.id} not in product`;
                }
            }
            if (rowstr.length > 0) {
                csv_str += rowstr + "\n";
            }
        });
        all_particle_chips.forEach((p)=>{
            if (!machines.find((mm)=>mm.particle.id == p.id)) {
                csv_str += `null,particle chip ${p.id} of ${p.account} doesn't have matching firestore machine\n`;
            }
        });
        writeFileSync(RECONCILE_CSVFILE, RECONCILE_CSV_HEADER + csv_str);
        res("done. should be in file at: " + RECONCILE_CSVFILE);
    });
};
async function all_account_chips() {
    return new Promise(async (res, _rej)=>{
        const llc = await account_chips("ACCOUNTS_RISINGTIGER_COM");
        const east = await account_chips("RFS_RISINGTIGER_COM");
        const west = await account_chips("WEST_PWT_RISINGTIGER_COM");
        const nat = await account_chips("NEWSLETTERS_RISINGTIGER_COM");
        llc.forEach((d)=>d.account = "llc");
        east.forEach((d)=>d.account = "east");
        west.forEach((d)=>d.account = "west");
        nat.forEach((d)=>d.account = "nat");
        return res({
            llc,
            east,
            west,
            nat
        });
    });
}
async function account_chips(particle_account) {
    return new Promise(async (res, _rej)=>{
        const key = process.env["PWT_" + particle_account];
        const response = await fetch('https://api.particle.io/v1/devices?access_token=' + key, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        let chips = await response.json();
        return res(chips);
    });
}
function match_particle_product_to_account_and_chip_type(product_id) {
    switch(product_id){
        case 11723:
            return {
                account: 'llc',
                chip_type: 'boron'
            };
        case 11724:
            return {
                account: 'llc',
                chip_type: 'bseries'
            };
        case 20405:
            return {
                account: 'east',
                chip_type: 'boron'
            };
        case 20406:
            return {
                account: 'east',
                chip_type: 'bseries'
            };
        case 20568:
            return {
                account: 'west',
                chip_type: 'boron'
            };
        case 20567:
            return {
                account: 'west',
                chip_type: 'bseries'
            };
        case 33275:
            return {
                account: 'nat',
                chip_type: 'boron'
            };
        case 33276:
            return {
                account: 'nat',
                chip_type: 'bseries'
            };
    }
    return null;
}
function get_is_particle_account_wrong(account_email, account_name) {
    if (account_email === "accounts_risingtiger_com") {
        return account_name !== "llc";
    }
    if (account_email === "rfs_risingtiger_com") {
        return account_name !== "east";
    }
    if (account_email === "west_pwt_risingtiger_com") {
        return account_name !== "west";
    }
    if (account_email === "newsletters_risingtiger_com") {
        return account_name !== "nat";
    } else {
        return true;
    }
}
const Admin_Reconcile = {
    Between_Particle_And_Machines
};
export default Admin_Reconcile;
