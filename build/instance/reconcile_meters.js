//@ts-ignore
import { FieldValue } from "@google-cloud/firestore";
/*
import { readFileSync } from "fs"

const offlinedata_dir = process.env.NIFTY_OFFLINEDATA_DIR || ""
*/ async function Reconcile_Meters(db, sse, firestore, id, reconcile) {
    return new Promise(async (res, _rej)=>{
        const machine_r = await firestore.Retrieve(db, [
            "machines/" + id
        ], null);
        if (!machine_r) {
            res(null);
            return false;
        }
        const machine = machine_r[0];
        const deltas = reconcile.deltas;
        const ts = Number(reconcile.ts);
        if (machine.ts < Math.round(Date.now() / 1000) - 86400 * 1) {
            res(null);
            return false;
        }
        if (machine.ts !== ts) {
            res(null);
            return false;
        }
        if (deltas.length !== 5 || !deltas.every((m)=>Number.isInteger(m))) {
            res(null);
            return false;
        }
        const newts = Math.floor(Date.now() / 1000);
        const newreconcile = {
            ts: newts,
            deltas
        };
        await db.collection("machines").doc(id).update({
            meters_reconciles: FieldValue.arrayUnion(newreconcile)
        });
        machine.meters_reconciles.push(newreconcile);
        machine.ts = newts;
        sse.TriggerEvent(2, {
            path: `machines/${id}`,
            data: machine
        });
        res(1);
    });
}
export default Reconcile_Meters;
