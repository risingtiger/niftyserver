const TimeRange = async (db, machine_record_id, pwtdataid, daystart, dayend)=>new Promise(async (res, _rej)=>{
        // Grab meters_tally at first day call in, because that becomes our reference for any increase delta calculations since
        const dayStart = new Date(daystart + 'T00:00:00Z');
        const dayEnd = new Date(dayend + 'T00:05:00Z');
        const startSeconds = Math.floor(dayStart.getTime() / 1000);
        const endSeconds = Math.floor(dayEnd.getTime() / 1000);
        const { machineRef, machine } = await get_machine_reference(db, machine_record_id, pwtdataid);
        const reconciles = machine.meters_reconciles.filter((s)=>s.ts > startSeconds && s.ts <= endSeconds);
        const statusesRef = machineRef.collection('statuses2');
        const query = statusesRef.where('ts', '>', startSeconds).where('ts', '<=', endSeconds).orderBy('ts', 'desc');
        const snapshot = await query.get().catch(()=>null);
        const statuses = snapshot ? snapshot.docs.map((doc)=>({
                id: doc.id,
                ...doc.data()
            })) : null;
        if (!statuses) {
            res(null);
            return;
        }
        if (statuses.length === 0 || statuses.length === 1) {
            res([
                0,
                0,
                0,
                0,
                0
            ]);
            return;
        }
        const reconcile_totals = reconciles.reduce((acc, r)=>acc.map((v, i)=>v + r.deltas[i]), [
            0,
            0,
            0,
            0,
            0
        ]);
        const startStatus = statuses[statuses.length - 1];
        const endStatus = statuses[0];
        const metersTotal = endStatus.meters_tally.map((end, i)=>(end - startStatus.meters_tally[i] + reconcile_totals[i]) * machine.incrs[i]);
        res(metersTotal);
    });
const AllTime = async (db, machine_record_ids, pwtdata_ids)=>new Promise(async (res, _rej)=>{
        let total_meters = [];
        let m;
        if (machine_record_ids) {
            for (const mri of machine_record_ids){
                const r = await get_machine_reference(db, mri, undefined).catch(()=>null);
                if (!r) {
                    res(null);
                    return;
                }
                const { machine } = r;
                m = machine;
            }
        } else if (pwtdata_ids) {
            for (const pdi of pwtdata_ids){
                const r = await get_machine_reference(db, undefined, pdi);
                if (!r) {
                    res(null);
                    return;
                }
                const { machine } = r;
                m = machine;
            }
        }
        const tm = get_machine_totals(m.meters_reconciles, m.meters_tally, m.incrs);
        total_meters.push(tm);
        res(total_meters);
    });
const get_machine_reference = (db, machine_record_id, pwtdataid)=>new Promise(async (res, _rej)=>{
        let machineRef;
        let machineDoc;
        if (machine_record_id) {
            machineRef = db.collection('machines').doc(machine_record_id);
            machineDoc = await machineRef.get().catch(()=>null);
            if (!machineDoc) {
                res(null);
                return;
            }
        } else {
            const query = db.collection('machines').where('pwtdataid', '==', pwtdataid);
            const querySnapshot = await query.get().catch(()=>null);
            if (!querySnapshot) {
                res(null);
                return;
            }
            if (querySnapshot.empty) {
                res(null);
                return;
            }
            machineDoc = querySnapshot.docs[0];
            machineRef = machineDoc.ref;
        }
        const x = {
            machineRef: machineRef,
            statusesRef: machineRef,
            machine: machineDoc.data()
        };
        res(x);
    });
const get_machine_totals = (reconciles, meters_tally, incrs)=>{
    const reconcile_totals = reconciles.reduce((acc, r)=>acc.map((v, i)=>v + r.deltas[i]), [
        0,
        0,
        0,
        0,
        0
    ]);
    const total_meters = meters_tally.map((value, index)=>(value + reconcile_totals[index]) * incrs[index]);
    return total_meters;
};
const Reports_Meters = {
    TimeRange,
    AllTime
};
export default Reports_Meters;
