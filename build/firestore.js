function Retrieve(db, pathstr, opts) {
    return new Promise(async (res, _rej)=>{
        const promises = [];
        if (!opts) opts = [
            {
                order_by: null,
                ts: null,
                limit: null,
                startafter: null
            }
        ];
        for(let i = opts.length; i < pathstr.length; i++){
            opts.push({
                ...opts[opts.length - 1]
            });
        }
        opts.forEach((o)=>{
            if (o.order_by === undefined) o.order_by = null;
            if (o.ts === undefined) o.ts = null;
            if (o.limit === undefined) o.limit = null;
            if (o.startafter === undefined) o.startafter = null;
            if (o.startafter !== null && (o.order_by === null || o.limit === null)) throw new Error("When startby is set, both order_by and limit must be provided.");
        });
        for(let i = 0; i < pathstr.length; i++){
            let d = parse_request(db, pathstr[i], opts[i].ts);
            if (!opts[i].ts && opts[i].order_by !== null) {
                const [field, direction] = opts[i].order_by.split(",");
                d = d.orderBy(field, direction);
                if (opts[i].startafter !== null) {
                    const doc_ref = await db.doc(opts[i].startafter).get();
                    d = d.startAfter(doc_ref);
                }
            }
            if (opts[i].limit) {
                d = d.limit(opts[i].limit);
            }
            promises.push(d.get());
        }
        const r = await Promise.all(promises).catch(()=>null);
        if (r === null) {
            res(null);
            return;
        }
        const returns = [];
        for(let i = 0; i < r.length; i++){
            if (r[i].docs && r[i].docs.length === 0) {
                returns.push([]);
            } else if (r[i].docs && r[i].docs.length) {
                const docs = r[i].docs.map((doc)=>{
                    return parsedocdata(doc);
                });
                returns.push(docs);
            } else {
                returns.push(parsedocdata(r[i]));
            }
        }
        res(returns);
    });
}
function Add(db, sse, path, data, sse_id) {
    return new Promise(async (res, _rej)=>{
        if (!data.id || data.ts) {
            res(null);
            return;
        }
        let d = parse_request(db, path, null);
        const doc_ref = d.doc(data.id);
        parse_data_to_update(db, data);
        const r = await doc_ref.add(data).catch(()=>null);
        if (r === null) {
            res(null);
            return;
        }
        // Use the original newdoc with id for the event
        sse.TriggerEvent(1, {
            path,
            data
        }, {
            exclude: [
                sse_id
            ]
        });
        res(1);
    });
}
function Patch(db, sse, path, oldts, newdata, sse_id) {
    return new Promise(async (res, _rej)=>{
        // code: 0 = transaction failed
        // code: 1 = is ok
        // code: 10 = is deleted or not exists
        // code: 11 = is older data, send back newer data
        // newdata should always have the ts field set from client side
        let doc_ref = parse_request(db, path, null);
        try {
            const r = await db.runTransaction(async (transaction)=>{
                let data = {};
                const docsnapshot = await transaction.get(doc_ref);
                if (!docsnapshot.exists) {
                    data = {};
                    return {
                        code: 10,
                        data
                    };
                }
                const existingdata = {
                    id: docsnapshot.id,
                    ...docsnapshot.data()
                };
                if (oldts < existingdata.ts) {
                    data = {
                        id: docsnapshot.id,
                        ...existingdata
                    };
                    return {
                        code: 11,
                        data
                    };
                }
                parse_data_to_update(db, newdata);
                await transaction.update(doc_ref, newdata);
                data = {
                    ...existingdata,
                    ...newdata
                };
                return {
                    code: 1,
                    existingdata
                };
            });
            if (r.code === 1) {
                // Merge newdata with existingdata, expanding dot notation properties
                const merged_data = {
                    ...r.existingdata
                };
                for(const key in newdata){
                    if (key.includes('.')) {
                        // Handle dot notation like 'parent.child'
                        const keys = key.split('.');
                        let current = merged_data;
                        // Navigate to the parent object, creating nested objects as needed
                        for(let i = 0; i < keys.length - 1; i++){
                            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                                current[keys[i]] = {};
                            }
                            current = current[keys[i]];
                        }
                        // Set the final value
                        current[keys[keys.length - 1]] = newdata[key];
                    } else {
                        // Direct property assignment
                        merged_data[key] = newdata[key];
                    }
                }
                sse.TriggerEvent(2, {
                    path,
                    data: merged_data
                }, {
                    exclude: [
                        sse_id
                    ]
                });
            }
            res(r);
        } catch (error) {
            res({
                code: 0,
                data: {}
            });
        }
    });
}
function Delete(db, sse, path, oldts, ts, sse_id) {
    return new Promise(async (res, _rej)=>{
        let doc_ref = parse_request(db, path, null);
        try {
            const r = await db.runTransaction(async (transaction)=>{
                let data = {};
                const docsnapshot = await transaction.get(doc_ref);
                if (!docsnapshot.exists) {
                    data = {};
                    return {
                        code: 10,
                        data
                    };
                }
                const existingdata = docsnapshot.data();
                if (oldts < existingdata.ts) {
                    data = {
                        id: docsnapshot.id,
                        ...existingdata
                    };
                    return {
                        code: 11,
                        data
                    };
                }
                existingdata.isdeleted = true;
                await transaction.update(doc_ref, existingdata);
                return {
                    code: 1,
                    data: {}
                };
            });
            if (r.code === 1) {
                sse.TriggerEvent(3, {
                    path,
                    ts
                }, {
                    exclude: [
                        sse_id
                    ]
                });
            }
            res(r);
        } catch (error) {
            res({
                code: 0,
                data: {}
            });
        }
    });
}
const callers = [];
const GetBatch = (db, paths, tses, runid)=>new Promise(async (res, _rej)=>{
        let caller = callers.find((c)=>c.runid === runid);
        if (!caller) callers.push({
            runid,
            paths,
            tses,
            startafters: paths.map(()=>null),
            isdones: paths.map(()=>false)
        });
        caller = caller || callers.find((c)=>c.runid === runid);
        const limit_on_all = Math.floor(2000 / caller.paths.filter((_p, i)=>!caller.isdones[i]).length);
        const promises = [];
        for(let i = 0; i < caller.paths.length; i++){
            if (caller.isdones[i]) {
                promises.push(Promise.resolve({
                    isdone: true,
                    docs: []
                }));
                continue;
            }
            const ts = caller.tses[i] || 0;
            const startafter = caller.startafters[i] || null;
            let q = db.collection(caller.paths[i]).where("ts", ">", ts).orderBy("ts");
            if (startafter) q = q.startAfter(startafter);
            q = q.limit(limit_on_all);
            promises.push(q.get());
        }
        const r = await Promise.all(promises).catch(()=>null);
        if (!r) {
            res(null);
            return;
        }
        const returns = [];
        for(let i = 0; i < r.length; i++){
            const o = r[i];
            if (o.isdone) {
                returns.push(o);
                continue;
            }
            if (o.docs.length === limit_on_all) {
                caller.startafters[i] = o.docs[o.docs.length - 1];
                caller.isdones[i] = false;
            } else if (o.docs.length < limit_on_all) {
                caller.startafters[i] = null;
                caller.isdones[i] = true;
            }
            const docs = o.docs.map((doc)=>parsedocdata(doc));
            const isdone = caller.isdones[i];
            returns.push({
                isdone,
                docs
            }) // docs array could be empty
            ;
        }
        if (caller.isdones.every((d)=>d === true)) {
            callers.splice(callers.findIndex((c)=>c.runid === runid), 1);
        }
        res(returns);
    });
const SyncPending = (db, sse, all_pending, sse_id)=>new Promise(async (res, rej)=>{
        if (!all_pending || all_pending.length === 0) {
            res(true);
            return;
        }
        const all_collections = new Set();
        try {
            const batch = db.batch();
            for (const pending of all_pending){
                const collection_ref = db.collection(pending.target_store);
                if (pending.operation_type === 'add') {
                    const new_doc_ref = collection_ref.doc();
                    const data_to_add = {
                        ...pending.payload,
                        ts: pending.ts
                    };
                    const parsed_data = parse_data_to_update(db, data_to_add);
                    batch.set(new_doc_ref, parsed_data);
                } else if (pending.operation_type === 'patch') {
                    const doc_ref = collection_ref.doc(pending.docid);
                    const existing_doc = await doc_ref.get();
                    if (!existing_doc.exists) continue;
                    const existing_data = existing_doc.data();
                    if (existing_data.ts > pending.oldts) continue;
                    const data_to_patch = {
                        ...pending.payload,
                        ts: pending.ts
                    };
                    const parsed_data = parse_data_to_update(db, data_to_patch);
                    batch.set(doc_ref, parsed_data);
                } else if (pending.operation_type === 'delete') {
                    const doc_ref = collection_ref.doc(pending.docid);
                    const existing_doc = await doc_ref.get();
                    if (!existing_doc.exists) continue;
                    const existing_data = existing_doc.data();
                    if (existing_data.ts > pending.oldts) continue;
                    existing_data.ts = pending.payload.ts;
                    existing_data.isdeleted = true;
                    batch.set(doc_ref, existing_data);
                }
                all_collections.add(pending.target_store) // Set forces unique collection names 
                ;
            }
            await batch.commit();
            sse.TriggerEvent(4, {
                paths: all_collections
            }, {
                exclude: [
                    sse_id
                ]
            });
            res(true);
        } catch (error) {
            console.error('SyncPending error:', error);
            rej(error);
        }
    });
function parsedocdata(doc) {
    const data = {
        id: doc.id,
        ...doc.data()
    };
    for(const key in data){
        const value = data[key];
        // Check if value is not null/undefined and is an object
        if (value && typeof value === 'object') {
            // Then check for _path property
            if (value._path) {
                data[key] = {
                    __path: value._path.segments
                };
            }
        }
    }
    return data;
}
function parse_request(db, pathstr, ts) {
    const pathsplit = pathstr.split("/");
    let d = db;
    for(let i = 0; i < pathsplit.length; i++){
        if (i % 2 === 1) {
            d = d.doc(pathsplit[i]);
        } else {
            if (pathsplit[i].includes(":")) {
                const querystr = pathsplit[i].substring(pathsplit[i].indexOf(":") + 1, pathsplit[i].length);
                const collection_name = pathsplit[i].substring(0, pathsplit[i].indexOf(":"));
                d = d.collection(collection_name);
                /*
                let valuestr = ""
                let field = {fieldPath: ""}
                */ let field = "";
                let op = "";
                let splitquery = [];
                let val = 0;
                if (querystr.includes("==")) {
                    splitquery = querystr.split("==");
                    field = splitquery[0];
                    op = "==";
                    if (splitquery[1] === 'true') val = true;
                    else if (splitquery[1] === 'false') val = false;
                    else if (splitquery[1].charAt(0) === "'") val = splitquery[1].substring(1, splitquery[1].length - 1);
                    else if (splitquery[1].charAt(0) === '"') val = splitquery[1].substring(1, splitquery[1].length - 1);
                    else if (!isNaN(Number(splitquery[1]))) val = Number(splitquery[1]);
                /*
                    op = "EQUAL"
                    field.fieldPath = querystr.substring(0, querystr.indexOf("=="))
                    valuestr = querystr.substring(querystr.indexOf("==") + 2)
                    */ } else if (querystr.includes("<")) {
                    splitquery = querystr.split("<");
                    field = splitquery[0];
                    op = "<";
                    val = Number(splitquery[1]);
                /*
                    op = "LESS_THAN"
                    field.fieldPath = querystr.substring(0, querystr.indexOf("<"))
                    valuestr = querystr.substring(querystr.indexOf("<") + 1)
                    */ } else if (querystr.includes(">")) {
                    splitquery = querystr.split(">");
                    field = splitquery[0];
                    op = ">";
                    val = Number(splitquery[1]);
                /*
                    op = "GREATER_THAN" 
                    field.fieldPath = querystr.substring(0, querystr.indexOf(">"))
                    valuestr = querystr.substring(querystr.indexOf(">") + 1)
                    */ } else if (querystr.includes("<=")) {
                    splitquery = querystr.split("<=");
                    field = splitquery[0];
                    op = "<=";
                    val = Number(splitquery[1]);
                /*
                    op = "LESS_THAN_OR_EQUAL"
                    field.fieldPath = querystr.substring(0, querystr.indexOf("<="))
                    valuestr = querystr.substring(querystr.indexOf("<=") + 2)
                    */ } else if (querystr.includes(">=")) {
                    splitquery = querystr.split(">=");
                    field = splitquery[0];
                    op = ">=";
                    val = Number(splitquery[1]);
                /*
                    op = "GREATER_THAN_OR_EQUAL"
                    field.fieldPath = querystr.substring(0, querystr.indexOf(">="))
                    valuestr = querystr.substring(querystr.indexOf(">=") + 2)
                    */ }
                //const field = splitquery[0]
                //const op = splitquery[1]
                //if (!isNaN(Number(valuestr))) value = { integerValue: Number(valuestr) }
                //else if (valuestr === "true") value = { booleanValue: true }
                //else if (valuestr === "false") value = { booleanValue: false }
                //else value = { stringValue: valuestr }
                d = d.where(field, op, val);
            } else if (ts !== null && i === pathsplit.length - 1) {
                d = d.collection(pathsplit[i]).where("ts", ">", ts);
            } else {
                d = d.collection(pathsplit[i]);
            }
        }
    }
    return d;
}
function parse_data_to_update(db, data) {
    for(const key in data){
        if (typeof data[key] === 'object') {
            if (data[key].__path) {
                const docref = db.collection(data[key].__path[0]).doc(data[key].__path[1]);
                data[key] = docref;
            } else {
                parse_data_to_update(db, data[key]);
            }
        } else {
        // leave untouched
        }
    }
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
*/ const Firestore = {
    Retrieve,
    Add,
    Patch,
    Delete,
    GetBatch,
    SyncPending
};
export { Firestore };
