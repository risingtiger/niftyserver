import { appendFileSync, writeFileSync } from "fs";
const CHIPS_DATAUSAGE_CSVFILE = "./particle_datausage.csv";
const CHIPS_DATAUSAGE_CSV_HEADER = "account,id,serial,name,iccid,type,connected,last_handshake,data_usage\n";
const CHIPS_INFO_CSVFILE = "./particle_chips_info.csv";
const CHIPS_INFO_CSV_HEADER = "account,id,serial,name,iccid,type,online,status,deviceos_version,firmware_version,last_handshake,last_heard,notes\n";
const Chips_Info = ()=>{
    return new Promise(async (res, _rej)=>{
        const all_chips = await all_account_chips();
        const all_chips_combined = [
            ...all_chips.llc,
            ...all_chips.east,
            ...all_chips.west,
            ...all_chips.nat
        ];
        let str = "";
        for (const chip of all_chips_combined){
            const account = chip.account;
            const id = chip.id;
            const serial = chip.serial_number;
            const name = chip.name;
            const iccid = chip.iccid;
            const type = chip.platform_id === 13 ? "Boron" : "BSeries";
            const online = chip.online;
            const status = chip.status;
            const deviceos_version = chip.system_firmware_version;
            const firmware_version = chip.firmware_version;
            const last_handshake = chip.last_handshake_at;
            const last_heard = chip.last_heard;
            const notes = chip.notes;
            str += `${account},${id},${serial},${name},${iccid},${type},${online},${status},${deviceos_version},${firmware_version},${last_handshake},${last_heard},${notes}\n`;
        }
        writeFileSync(CHIPS_INFO_CSVFILE, CHIPS_INFO_CSV_HEADER + str);
        res("done. should be in file at: " + CHIPS_INFO_CSVFILE);
    });
};
const Data_Usage = ()=>{
    return new Promise(async (res, _rej)=>{
        const all_chips = await all_account_chips();
        const all_chips_combined = [
            ...all_chips.llc,
            ...all_chips.east,
            ...all_chips.west,
            ...all_chips.nat
        ];
        let chip_index = 0;
        writeFileSync(CHIPS_DATAUSAGE_CSVFILE, CHIPS_DATAUSAGE_CSV_HEADER);
        datausage_next(all_chips_combined, chip_index);
        res("done. keep checking file for updates");
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
function datausage_next(chips, chip_index) {
    setTimeout(async ()=>{
        let chip = chips[chip_index];
        let token = "";
        switch(chip.account){
            case "llc":
                token = process.env["PWT_ACCOUNTS_RISINGTIGER_COM"];
                break;
            case "east":
                token = process.env["PWT_RFS_RISINGTIGER_COM"];
                break;
            case "west":
                token = process.env["PWT_WEST_PWT_RISINGTIGER_COM"];
                break;
            case "nat":
                token = process.env["PWT_NEWSLETTERS_RISINGTIGER_COM"];
                break;
        }
        let data_usage_p = await fetch(`https://api.particle.io/v1/sims/${chip.iccid}/data_usage?access_token=${token}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        let data_usage = await data_usage_p.json();
        let byday = data_usage.usage_by_day && data_usage.usage_by_day.length ? data_usage.usage_by_day : null;
        let chip_data_usage = null;
        if (byday !== null) chip_data_usage = data_usage.usage_by_day[data_usage.usage_by_day.length - 1].mbs_used_cumulative;
        if (chip_index === chips.length - 1) {
            appendFileSync(CHIPS_DATAUSAGE_CSVFILE, `\n\nDONE\n`);
        } else {
            const account = chip.account;
            const id = chip.id;
            const serial = chip.serial_number;
            const name = chip.name;
            const iccid = chip.iccid;
            const type = chip.platform_id === 13 ? "Boron" : "BSeries";
            const connected = chip.connected;
            const last_handshake = chip.last_handshake_at;
            const data_usage = chip_data_usage;
            const str = `${account},${id},${serial},${name},${iccid},${type},${connected},${last_handshake},${data_usage}\n`;
            appendFileSync(CHIPS_DATAUSAGE_CSVFILE, str);
            chip_index++;
            datausage_next(chips, chip_index);
        }
    }, 210);
}
const Admin_Particle = {
    Chips_Info,
    Data_Usage
};
export default Admin_Particle;
