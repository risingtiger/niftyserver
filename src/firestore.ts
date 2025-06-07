type str = string; type int = number; type num = number; type bool = boolean;

import { SSETriggersE, GenericRowT } from "./defs.js"




type RetrieveOptsT   = { order_by:str|null, ts:int|null, limit:int|null, startafter: string|null }

type OperationTypeT = 'add' | 'patch' | 'delete';
type PendingSyncOperationT = {
	operation_type: OperationTypeT;
	target_store: str;
	docId: str;
	ts: num;
	oldts: num;
	payload: GenericRowT | null;
};




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
				return parsedocdata(doc)
			})
			returns.push(docs)
		} 
		else {
			returns.push(parsedocdata(r[i]))
		}
	}
	res(returns)
})}




function Add(db:any, sse:any, path:str, newdata:{[key:string]:any}, id:str, ts:num, sse_id:str|null) {   return new Promise<null|number>(async (res, _rej)=> {

    let d = parse_request(db, path, null);
    const doc_ref = d.doc(id)

	newdata.ts = ts

	parse_data_to_update(db, newdata);
    
    const r = await doc_ref.add(newdata).catch(()=> null);
    if (r === null) { res(null); return; }
    
    // Use the original newdoc with id for the event
    sse.TriggerEvent(SSETriggersE.FIRESTORE_DOC_ADD, { path, data: newdata }, { exclude:[ sse_id ] });

    res(1)
})}




function Patch(db:any, sse:any, path:str, newdata:any, sse_id:str|null) {   return new Promise<number>(async (res, _rej)=> {

	// newdata should always have the ts field set from client side

    let d = parse_request(db, path, null);
    
	// First, get the existing document to check if exists, but more importantly, to check if the incoming patch is older and should be ignored
	const docsnapshot = await d.get();
	if (!docsnapshot.exists)   { 
		res( 10 ); // code for its been deleted 
		return;
	}
	
	const existingdata = docsnapshot.data();
	
	if (newdata.ts < existingdata.ts) {  
		res( { id: docsnapshot.id, ...existingdata } ); // send back newer data
		return;
	}

	parse_data_to_update(db, newdata);
	
	// Only update the fields that are provided in the data object
	const r = await d.update(newdata);
	if (r === null) { res(11); return; } // data write error
	
	const updatedrecord = { ...existingdata, ...newdata };
	
	// Trigger event with the complete merged document of existing and new data -- so we dont pull again from database
	sse.TriggerEvent(SSETriggersE.FIRESTORE_DOC_PATCH, { path: path, data: updatedrecord }, { exclude:[ sse_id ] });
	
	res(1);
})}




function Delete(db:any, sse:any, path:str, sse_id:str|null) {   return new Promise<null|number>(async (res, _rej)=> {

    let d = parse_request(db, path, null);
    
    const r = await d.delete().catch(() => null);
    if (r === null) { res(null); return; }
    
    sse.TriggerEvent(SSETriggersE.FIRESTORE_DOC_DELETE, { path }, { exclude:[ sse_id ] });
    
    res(1);
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

		const docs   = o.docs.map((doc:any)=> parsedocdata(doc) )
		const isdone = caller.isdones[i]
		returns.push({ isdone, docs }) // docs array could be empty
	}

	if (caller.isdones.every(d=> d === true)) {
		callers.splice(callers.findIndex((c:any)=> c.runid === runid), 1)
	}

	res(returns)
})




const SyncPending = (db:any, all_pending:PendingSyncOperationT[]) => new Promise<boolean>(async (res, rej)=> {

	try {
		const batch = db.batch()

		for (const pending of all_pending) {
			const collection_ref = db.collection(pending.target_store)

			if (pending.operation_type === 'add') {
				const new_doc_ref = collection_ref.doc()
				const data_to_add = { ...pending.payload, ts: pending.ts }
				const parsed_data = parse_data_to_update(db, data_to_add)
				
				batch.set(new_doc_ref, parsed_data)
			}
			else if (pending.operation_type === 'patch') {
				const doc_ref = collection_ref.doc(pending.docId)
				const existing_doc = await doc_ref.get()

				if (!existing_doc.exists) continue

				const existing_data = existing_doc.data()
				if (existing_data.ts > pending.oldts) continue

				const data_to_patch = { ...pending.payload, ts: pending.ts }
				const parsed_data = parse_data_to_update(db, data_to_patch)
				
				batch.set(doc_ref, parsed_data)
			}
			else if (pending.operation_type === 'delete') {
				const doc_ref = collection_ref.doc(pending.docId)
				const existing_doc = await doc_ref.get()

				if (!existing_doc.exists) continue

				const existing_data = existing_doc.data()
				if (existing_data.ts > pending.oldts) continue

				batch.delete(doc_ref)
			}
		}

		await batch.commit()
		res(true)
	}
	catch (error) {
		console.error('SyncPending error:', error)
		rej(error)
	}
})




function parsedocdata(doc:any) {
	const data = { id: doc.id, ...doc.data() }
	
	for (const key in data) {
		const value = data[key]
		// Check if value is not null/undefined and is an object
		if (value && typeof value === 'object') {
			// Then check for _path property
			if (value._path) {
				data[key] = { __path: value._path.segments }
			}
		}
	}
	
	return data
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




function parse_data_to_update(db:any, data:any) {
	for (const key in data) {
		if (typeof data[key] === 'object' && data[key].__path) {
			const docref                     = db.collection(data[key].__path[0]).doc(data[key].__path[1]);
			data[key] = docref;
		}
	}
}




const Firestore = { Retrieve, Add, Patch, Delete, GetBatch, SyncPending }
export { Firestore }
