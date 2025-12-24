type str = string; type int = number; type num = number; type bool = boolean;

import { GenericRowT } from "./defs.js"




type RetrieveOptsT   = { order_by:str|null, ts:int|null, limit:int|null, startafter: string|null }

//type OperationTypeT = 'add' | 'patch' | 'delete';
// type PendingSyncOperationT = {
// 	id: str,
// 	docid: str;
// 	operation_type: OperationTypeT;
// 	target_store: str;
// 	ts: num;
// 	oldts?: num;
// 	payload: GenericRowT | null;
// };




function Retrieve(db:any, pathstr:str[], opts:RetrieveOptsT[]|null|undefined) {   return new Promise<null|Array<{[key:string]:any}[]>>(async (res, _rej) => {

    const promises:any = []

    if (!opts) opts = [{ order_by: null, ts: null, limit: null, startafter: null }];

    for (let i = opts.length; i < pathstr.length; i++) {
        opts.push({ ...opts[opts.length - 1] });
    }
    opts.forEach((o: any) => {
        if (o.order_by === undefined) o.order_by = null;
        if (o.ts === undefined) o.ts = null;
        if (o.limit === undefined) o.limit = null;
        if (o.startafter === undefined) o.startafter = null;
        if (o.startafter !== null && (o.order_by === null || o.limit === null)) 
            throw new Error("When startby is set, both order_by and limit must be provided.");
    });


    for (let i = 0; i < pathstr.length; i++) {

        let d = parse_request(db, pathstr[i], opts[i].ts)

        if (!opts[i].ts && opts[i].order_by !== null) {

            const [field, direction] = opts[i].order_by!.split(",");

            d = d.orderBy(field, direction);

            if (opts[i].startafter !== null) {
				const doc_ref = await db.doc(opts[i].startafter).get()
                d = d.startAfter(doc_ref)
            }
        }
        if (opts[i].limit) {
            d = d.limit(opts[i].limit);
        }

        promises.push(d.get())
    }

	const r = await Promise.all(promises).catch(()=> null)
	if (r === null) { res(null); return; }

	const returns:any = []
	for (let i = 0; i < r.length; i++) {

		if (r[i].docs && r[i].docs.length === 0) {
			returns.push([])
		} 
		else if (r[i].docs && r[i].docs.length) {
			const docs = r[i].docs.map((doc:any)=> {
				return ParseDocDataForClient({ id:doc.id, ...doc.data()})
			})
			returns.push(docs)
		} 
		else {
			returns.push(ParseDocDataForClient({ id:r[i].id, ...r[i].data() }))
		}
	}
	res(returns)
})}




function Add(db:any, path:str, data:{[key:string]:any}) {   return new Promise<number|null>(async (res, _rej)=> {

	let serverts = Math.round(Date.now())

	if (!data.id || data.ts) {  res(null); return; }

	if (data.ts < serverts - 5 || data.ts > serverts + 5) { res(null); return; }

    let d = parse_request(db, path, null);
    const doc_ref = d.doc(data.id)

	ConvertRefPathsFromClient(db, data);

    const r = await doc_ref.add(data).catch(()=> null);
    if (r === null) { res(null); return; }

    res(1)
})}




type	 PatchReturnT = { code:0|1|10|11|12 };
function Patch(db:any, path:str, oldts:num, newdata:any) {   return new Promise<PatchReturnT>(async (res, _rej)=> {

	// code: 0 = transaction failed
	// code: 1 = is ok
	// code: 10 = is deleted or not exists
	// code: 11 = is older data, send back newer data
	// code: 12 = local ts and server ts is too far off

	// newdata should always have the ts field set from client side

	let serverts = Math.round(Date.now() / 1000)
    let doc_ref  = parse_request(db, path, null);

	if (newdata.ts < serverts - 5 || newdata.ts > serverts + 5) { res({ code:12 }); return; }
    
	try {
		const r = await db.runTransaction(async (transaction:any) => {

			const docsnapshot = await transaction.get(doc_ref);
			
			if (!docsnapshot.exists) {				return { code:10 };   }
			if (oldts < (docsnapshot.data()).ts) {  return { code:11 };   }

			ConvertRefPathsFromClient(db, newdata);
			
			await transaction.set(doc_ref, newdata);
			
			return { code:1 };	
		});

		res(r);

		if (r.code === 1) {
			/*
			const merged_data = { ...existingdata }
			
			for (const key in newdata) {
				if (key.includes('.')) {
					// Handle dot notation like 'parent.child'
					const keys = key.split('.')
					let current = merged_data
					
					// Navigate to the parent object, creating nested objects as needed
					for (let i = 0; i < keys.length - 1; i++) {
						if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
							current[keys[i]] = {}
						}
						current = current[keys[i]]
					}
					
					// Set the final value
					current[keys[keys.length - 1]] = newdata[key]
				} else {
					// Direct property assignment
					merged_data[key] = newdata[key]
				}
			}
			
			const exclude = suppress_sse ? [sse_id] : []
			const parsed_merged_data = parsedocdata_for_client(merged_data)
			r.data = parsed_merged_data
			*/
		}
	}
	catch (error) {
		res({ code:0 });
	}
})}




function Delete(db:any, path:str, oldts:num, ts:num) {   return new Promise<GenericRowT>(async (res, _rej)=> {

    let doc_ref         = parse_request(db, path, null);
	let split           = path.split("/")
	let path_collection = split[0]
	let doc_id          = split[1]
	let serverts        = Math.round(Date.now() / 1000)

	if (ts < serverts - 5 || ts > serverts + 5) { res({ code:12 }); return; }

	try {
		const r = await db.runTransaction(async (transaction:any) => {

			const docsnapshot = await transaction.get(doc_ref);
			
			if (!docsnapshot.exists) {					return { code:10 };   }
			if ((docsnapshot.doc()).ts >= oldts) {		return { code:11 };   }

			await transaction.delete(doc_ref);
			await db.collection('__deleted_docs').doc().set({ collection:path_collection, docid:doc_id, ts });
			return { code:1 };	
		});
		res(r);
	}
	catch (error) {
		res({ code:0 });
	}
})}




const callers:{ runid:string, paths:string[], tses:number[], startafters: Array<object|null>, isdones: boolean[] }[] = []
const GetBatch = (db:any, paths:str[], tses:number[], runid:str) => new Promise<Array<{isdone:boolean, docs:object[]}>|null>(async (res, _rej)=> {

	let   caller = callers.find((c:any)=> c.runid === runid)
	if (!caller)   callers.push({ runid, paths, tses, startafters: paths.map(()=> null), isdones: paths.map(()=> false) })
	caller       = caller || callers.find((c:any)=> c.runid === runid)!

	const limit_on_all         = Math.floor( 2000 / caller.paths.filter((_p:any, i:any)=> !caller.isdones[i]).length )

	const promises:Promise<any>[] = []

	for(let i = 0; i < caller.paths.length; i++) {

		if (caller.isdones[i]) {
			promises.push(Promise.resolve({isdone: true, docs:[]}))
			continue
		}

		const ts         = caller.tses[i] || 0
		const startafter = caller.startafters[i] || null

		let q = db.collection(caller.paths[i]).where("ts", ">", ts).orderBy("ts")

		if (startafter) q = q.startAfter(startafter)

		q = q.limit(limit_on_all)

		promises.push( q.get() )
	}

	const r = await Promise.all(promises).catch(()=> null)
	if (!r) { res(null); return; }


	const returns:Array<{ isdone:boolean, docs:object[] }> = []

	for(let i = 0; i < r.length; i++) {
		const o = r[i]

		if (o.isdone) {
			returns.push(o)
			continue
		}

		if (o.docs.length === limit_on_all) {
			caller.startafters[i] = o.docs[o.docs.length - 1]
			caller.isdones[i] = false
		}
		else if (o.docs.length < limit_on_all) { // including if 0
			caller.startafters[i] = null
			caller.isdones[i] = true
		}

		const docs   = o.docs.map((doc:any)=> ParseDocDataForClient({ id:doc.id,...doc.data() }) )
		const isdone = caller.isdones[i]
		returns.push({ isdone, docs }) // docs array could be empty
	}

	if (caller.isdones.every(d=> d === true)) {
		callers.splice(callers.findIndex((c:any)=> c.runid === runid), 1)
	}

	res(returns)
})




/* **********************************************************
      !!KEEP!!    I WANT TO CYCLE BACK TO THIS SOON 
   **********************************************************

const SyncPending = (db:any, sse:any, all_pending:PendingSyncOperationT[], sse_id:str|null) => new Promise<boolean>(async (res, rej)=> {

	if (!all_pending || all_pending.length === 0) { res(true); return; }

	const all_collections = new Set<str>()

	try {
		const batch = db.batch()

		for (const pending of all_pending) {

			const collection_ref = db.collection(pending.target_store)

			if (pending.operation_type === 'add') {
				const new_doc_ref = collection_ref.doc()
				const data_to_add = { ...pending.payload, ts: pending.ts }
				const parsed_data = convert_refpaths_from_client(db, data_to_add)
				
				batch.set(new_doc_ref, parsed_data)
			}
			else if (pending.operation_type === 'patch') {
				const doc_ref = collection_ref.doc(pending.docid)
				const existing_doc = await doc_ref.get()

				if (!existing_doc.exists) continue

				const existing_data = existing_doc.data()
				if (existing_data.ts > pending.oldts!) continue

				const data_to_patch = { ...pending.payload, ts: pending.ts }
				const parsed_data = convert_refpaths_from_client(db, data_to_patch)
				
				batch.set(doc_ref, parsed_data)
			}
			else if (pending.operation_type === 'delete') {
				const doc_ref = collection_ref.doc(pending.docid)
				const existing_doc = await doc_ref.get()

				if (!existing_doc.exists) continue

				const existing_data = existing_doc.data()
				if (existing_data.ts > pending.oldts!) continue

				existing_data.ts = pending.payload!.ts
				existing_data.isdeleted = true
				batch.set(doc_ref, existing_data)
			}

			all_collections.add(pending.target_store) // Set forces unique collection names 
		}

		await batch.commit()


		res(true)
	}
	catch (error) {
		console.error('SyncPending error:', error)
		rej(error)
	}
})
*/




function ParseDocDataForClient(data:GenericRowT) {

	for (const key in data) {
		const value = data[key]
		// Check if value is not null/undefined and is an object
		if (value && typeof value === 'object') {
			// Check if value is an array
			if (Array.isArray(value)) {
				for (let i = 0; i < value.length; i++) {
					if (value[i] && value[i]._path) {
						value[i] = { __path: value[i]._path.segments }
					}
				}
			}
			// Then check for _path property on object
			else if (value._path) {
				data[key] = { __path: value._path.segments }
			}
		}
	}
	
	return data
}




function ConvertRefPathsFromClient(db:any, data:any) {
	for (const key in data) {
		const value = data[key]
		if (value && typeof value === 'object') {
			// Check if value is an array
			if (Array.isArray(value)) {
				for (let i = 0; i < value.length; i++) {
					if (value[i] && value[i].__path) {
						const docref = db.collection(value[i].__path[0]).doc(value[i].__path[1]);
						value[i] = docref;
					}
				}
			}
			// Then check for __path property on object
			else if (value.__path) {
				const docref = db.collection(value.__path[0]).doc(value.__path[1]);
				data[key] = docref;
			}
			else {
				ConvertRefPathsFromClient(db, value);
			}
		}
		else {
			// leave untouched
		}
	}
}




function parse_request(db:any, pathstr:str, ts:int|null) : any {

    const pathsplit = pathstr.split("/")
    let d = db

    for (let i = 0; i < pathsplit.length; i++) {

        if (i % 2 === 1) { // doc
            d = d.doc(pathsplit[i])

        } else { // collection

            if (pathsplit[i].includes(":")) {

                const querystr = pathsplit[i].substring(pathsplit[i].indexOf(":") + 1, pathsplit[i].length)
                const collection_name = pathsplit[i].substring(0,pathsplit[i].indexOf(":"))

                d = d.collection(collection_name)

                /*
                let valuestr = ""
                let field = {fieldPath: ""}
                */
                let field = ""
                let op = ""
                let splitquery:str[] = []
                let val:str|int|bool = 0

                if (querystr.includes("==")) {
                    splitquery = querystr.split("==")
                    field = splitquery[0]
                    op = "=="

                    if (splitquery[1] === 'true') val = true
                    else if (splitquery[1] === 'false') val = false
                    else if (splitquery[1].charAt(0) === "'") val = splitquery[1].substring(1, splitquery[1].length-1)
                    else if (splitquery[1].charAt(0) === '"') val = splitquery[1].substring(1, splitquery[1].length-1)
                    else if ( !isNaN(Number(splitquery[1])) ) val = Number(splitquery[1])
        
                    /*
                    op = "EQUAL"
                    field.fieldPath = querystr.substring(0, querystr.indexOf("=="))
                    valuestr = querystr.substring(querystr.indexOf("==") + 2)
                    */
                }
                else if (querystr.includes("<")) {
                    splitquery = querystr.split("<")
                    field = splitquery[0]
                    op = "<"
                    val = Number(splitquery[1])
                    /*
                    op = "LESS_THAN"
                    field.fieldPath = querystr.substring(0, querystr.indexOf("<"))
                    valuestr = querystr.substring(querystr.indexOf("<") + 1)
                    */
                }
                else if (querystr.includes(">")) {
                    splitquery = querystr.split(">")
                    field = splitquery[0]
                    op = ">"
                    val = Number(splitquery[1])
                    /*
                    op = "GREATER_THAN" 
                    field.fieldPath = querystr.substring(0, querystr.indexOf(">"))
                    valuestr = querystr.substring(querystr.indexOf(">") + 1)
                    */
                }
                else if (querystr.includes("<=")) {
                    splitquery = querystr.split("<=")
                    field = splitquery[0]
                    op = "<="
                    val = Number(splitquery[1])
                    /*
                    op = "LESS_THAN_OR_EQUAL"
                    field.fieldPath = querystr.substring(0, querystr.indexOf("<="))
                    valuestr = querystr.substring(querystr.indexOf("<=") + 2)
                    */
                }
                else if (querystr.includes(">=")) {
                    splitquery = querystr.split(">=")
                    field = splitquery[0]
                    op = ">="
                    val = Number(splitquery[1])
                    /*
                    op = "GREATER_THAN_OR_EQUAL"
                    field.fieldPath = querystr.substring(0, querystr.indexOf(">="))
                    valuestr = querystr.substring(querystr.indexOf(">=") + 2)
                    */
                }

                //const field = splitquery[0]
                //const op = splitquery[1]

                //if (!isNaN(Number(valuestr))) value = { integerValue: Number(valuestr) }
                //else if (valuestr === "true") value = { booleanValue: true }
                //else if (valuestr === "false") value = { booleanValue: false }
                //else value = { stringValue: valuestr }

                d = d.where(field, op, val)
            }

            else if (ts !== null && i === pathsplit.length - 1) {
                d = d.collection(pathsplit[i]).where("ts", ">", ts)

            } else {
                d = d.collection(pathsplit[i])
            }
        }
    }
    return d
}




/*
const update_record_with_new_data = (record: GenericRowT, newdata: any): void => {
	for (const key in newdata) {
		if (typeof record[key] == 'object') 
			update_record_with_new_data(record[key], newdata[key])
		else 
			record[key] = newdata[key]
	}
}
*/




const Firestore = { Retrieve, Add, Patch, Delete, GetBatch, ParseDocDataForClient, ConvertRefPathsFromClient }
export { Firestore  }
