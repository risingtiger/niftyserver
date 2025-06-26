import { writeFileSync, appendFileSync } from "fs";
const STATUS_RESEND_COUNTS_CSVFILE = "./status_resend_counts.csv";
const STATUS_RESEND_COUNTS_CSV_HEADER = "id,chip,count\n";
let machines_index = 0;
function Status_Resend_Counts(db) {
    return new Promise(async (res, _rej)=>{
        const machines_collection = db.collection("machines");
        const machines_snapshot = await machines_collection.get();
        const machines = machines_snapshot.docs.map((m)=>({
                id: m.id,
                ...m.data()
            }));
        machines_index = 0;
        writeFileSync(STATUS_RESEND_COUNTS_CSVFILE, STATUS_RESEND_COUNTS_CSV_HEADER);
        status_resend___counts_next(db, machines);
        res("done. keep checking file for updates: " + STATUS_RESEND_COUNTS_CSVFILE);
    });
}
function status_resend___counts_next(db, machines) {
    setTimeout(async ()=>{
        let m = machines[machines_index];
        const statuses_collection = db.collection("machines").doc(m.id).collection("statuses");
        const statuses_snapshot = await statuses_collection.where("tags.is_resend", "==", true).get();
        const statuses = statuses_snapshot.docs.map((s)=>({
                id: s.id,
                ...s.data()
            }));
        const count = statuses.length;
        appendFileSync(STATUS_RESEND_COUNTS_CSVFILE, `${m.id},${m.chip},${count}\n`);
        machines_index++;
        if (machines_index === machines.length) {
            appendFileSync(STATUS_RESEND_COUNTS_CSVFILE, `\n\nDONE\n`);
            return;
        } else {
            status_resend___counts_next(db, machines);
        }
    }, 110);
}
const Admin_Gen_Reports = {
    Status_Resend_Counts
};
export default Admin_Gen_Reports;
