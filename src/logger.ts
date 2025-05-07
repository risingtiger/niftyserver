
import { str } from './defs.js'




const Save = (db:any, user_email:str, device:str, browser:str, logs_string:str) => new Promise(async (resolve, _reject) => { 

	const logs = logs_string.split("--")

	const collection = db.collection("logs")

	let batch = db.batch()

	for (let i = 0; i < logs.length; i++) {
		const log = logs[i].split(",")
		const doc = { 
			user_email,
			device,
			browser,
			type: Number(log[0]),
			subject: log[1],
			msg: log[2],
			ts: Number(log[3]),
		}

		batch.set(collection.doc(), doc)
	}

	await batch.commit().catch((er:any)=> console.error(er))

	resolve(1)
})




const Get = (db:any, user_email:str ) => new Promise(async (resolve, _reject) => { 

	const output_csv_header = `user_email,device,browser,type,subject,msg,datetime\n`

	const collection = db.collection("logs")

	const items_snapshot = await collection.where("user_email", "==", user_email).limit(10000).get().catch(()=>null)
	if (!items_snapshot) {   resolve(null); return; }


	const items = items_snapshot.docs.map((m: any) => ({ id: m.id, ...m.data() })).sort((a:any, b:any) => b.ts - a.ts)

	const output_csv = items.map((m:any) => `${m.user_email},${m.device},${m.browser},${m.type},${m.subject},${m.msg},${new Date(m.ts*1000).toISOString()}\n`).join("")

	resolve(output_csv_header + output_csv)
})




export default { Save, Get }



