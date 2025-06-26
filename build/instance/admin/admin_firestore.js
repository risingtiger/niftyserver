//type str = string; //type int = number; type bool = boolean;
import { FieldValue } from "@google-cloud/firestore";
//import fs from "fs";
const emails = [
    {
        fname: 'Judith',
        lname: 'Olschewski',
        email: 'jolschewski@arcticmountain.com'
    },
    {
        fname: 'Z',
        lname: 'Olschewski',
        email: 'zolschewski@arcticmountain.com'
    },
    {
        fname: 'Ken',
        lname: 'Kasper',
        email: 'kkasper@freshpure.com'
    },
    {
        fname: 'Chris',
        lname: 'Donnelly',
        email: 'cdonnelly@freshpure.com'
    },
    {
        fname: 'Esther',
        lname: 'Olsen',
        email: 'eolsen@arcticmountain.com'
    },
    {
        fname: 'Toni',
        lname: 'Bennett',
        email: 'toni@freshpure.com'
    }
];
const Misc_Add = async (db)=>{
    return new Promise(async (res, _rej)=>{
        const ts = Math.floor(Date.now() / 1000);
        let batch = db.batch();
        const users_collection = db.collection("users");
        for (const user of emails){
            const userDoc = users_collection.doc(user.email);
            const userData = {
                fname: user.fname,
                lname: user.lname,
                notification: {
                    tags: [
                        '-'
                    ]
                },
                ts: ts
            };
            batch.set(userDoc, userData);
        }
        await batch.commit().catch((er)=>console.error(er));
        res("Done with misc add");
    });
};
const Misc_Update = async (db)=>{
    return new Promise(async (res, _rej)=>{
        const ts = Math.floor(Date.now() / 1000);
        let batch = db.batch();
        /*
        const machines_collection = db.collection("machines")
        const statuses_collection = machines_collection.doc('Nyb5qBMg6SYp7Jbb2n4f').collection('statuses')
        const statuses_snapshot = await statuses_collection.get()
        const statuses = statuses_snapshot.docs.map((s: any) => ({ id: s.id, ...s.data() }));

		const machine = db.collection("machines").doc('Nyb5qBMg6SYp7Jbb2n4f')

		const statuses_to_add = JSON.parse(strofstatuses)


		for(const status of statuses_to_add) {
			const ndoc = statuses_collection.doc()
			batch.set(ndoc, status)
		}

		await batch.commit().catch((er:any)=> console.error(er))
		*/ const users_collection = await db.collection("users");
        const users_r = await users_collection.get();
        const users = users_r.docs.map((m)=>({
                id: m.id,
                ...m.data()
            }));
        for (const user of users){
            const updateobj = {
                cellgps: [
                    0,
                    0,
                    0
                ]
            };
            if (user.gps_chip) {
                updateobj.gps_chip = FieldValue.delete();
            }
            if (user.gps) {
                updateobj.gps = FieldValue.delete();
            }
            batch.update(users_collection.doc(user.id), updateobj);
        }
        await batch.commit().catch((er)=>console.error(er));
        res("Done Misc Update");
    });
};
const Misc_Get = async (db)=>{
    return new Promise(async (res, _rej)=>{
        const machines_collection = db.collection("machines");
        const machines_snapshot = await machines_collection.get();
        const machines = machines_snapshot.docs.map((m)=>({
                id: m.id,
                ...m.data()
            }));
        for (const m of machines){
            if (m.pwtdataid !== "0000000") {
                if (!m.store.brand) {
                    console.log("Machine: ", m.chip, m.store.brand, m.store.name);
                }
            }
        }
        //res(objarray)
        console.log("done");
        res([]);
    });
};
const Admin_Firestore = {
    Misc_Add,
    Misc_Update,
    Misc_Get
};
export default Admin_Firestore;
