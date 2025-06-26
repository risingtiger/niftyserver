let _db = null;
let _localdb_objectstores = [];
let _db_name = "";
let _db_version = 0;
const Init = async (localdb_objectstores, db_name, db_version)=>{
    _localdb_objectstores = localdb_objectstores;
    _db_name = db_name;
    _db_version = db_version;
};
const GetDB = ()=>new Promise(async (res, rej)=>{
        try {
            _db = await openindexeddb();
        } catch  {
            rej();
            return;
        }
        res(_db);
    });
const GetOne = (objectstore_name, id)=>new Promise(async (res, rej)=>{
        try {
            _db = await openindexeddb();
        } catch  {
            rej();
            return;
        }
        const transaction = _db.transaction(objectstore_name, 'readonly');
        const objectStore = transaction.objectStore(objectstore_name);
        let result = {};
        try {
            result = await GetOne_S(objectStore, id);
        } catch  {
            rej();
        }
        transaction.onerror = ()=>rej();
        transaction.oncomplete = ()=>res(result);
    });
const GetAll = (objectstore_names)=>new Promise(async (res, rej)=>{
        try {
            _db = await openindexeddb();
        } catch  {
            rej();
            return;
        }
        const returns = new Map() // key being the objectstore name
        ;
        const transaction = _db.transaction(objectstore_names, 'readonly');
        const promises = [];
        for (const objectstore_name of objectstore_names){
            const objectstore = transaction.objectStore(objectstore_name);
            promises.push(GetAll_S(objectstore));
        }
        const r = await Promise.all(promises).catch(()=>null);
        if (r === null) {
            rej();
            return;
        }
        for(let i = 0; i < r.length; i++){
            returns.set(objectstore_names[i], r[i]);
        }
        transaction.onerror = ()=>rej();
        transaction.oncomplete = ()=>res(returns);
    });
const ClearAll = (objectstore_name)=>new Promise(async (res, rej)=>{
        try {
            _db = await openindexeddb();
        } catch  {
            rej();
            return;
        }
        const tx = _db.transaction(objectstore_name, 'readwrite');
        let aye_errs = false;
        const objstore = tx.objectStore(objectstore_name);
        const request = objstore.clear();
        request.onerror = ()=>{
            aye_errs = true;
        };
        tx.onerror = ()=>rej();
        tx.oncomplete = ()=>{
            if (aye_errs) {
                rej();
                return;
            }
            res(1);
        };
    });
const AddOne = (objectstore_name, data)=>new Promise(async (res, rej)=>{
        try {
            _db = await openindexeddb();
        } catch  {
            rej();
            return;
        }
        const transaction = _db.transaction(objectstore_name, 'readonly');
        const objectstore = transaction.objectStore(objectstore_name);
        let keystring = "";
        try {
            keystring = await AddOne_S(objectstore, data.id);
        } catch  {
            rej();
        }
        transaction.onerror = ()=>rej();
        transaction.oncomplete = ()=>res(keystring);
    });
const PutOne = (objectstore_name, data)=>new Promise(async (res, rej)=>{
        try {
            _db = await openindexeddb();
        } catch  {
            rej();
            return;
        }
        const transaction = _db.transaction(objectstore_name, 'readwrite');
        const objectstore = transaction.objectStore(objectstore_name);
        let keystring = "";
        try {
            keystring = await PutOne_S(objectstore, data);
        } catch  {
            rej();
        }
        transaction.onerror = ()=>rej();
        transaction.oncomplete = ()=>res(keystring);
    });
const DeleteOne = (objectstore_name, id)=>new Promise(async (res, rej)=>{
        try {
            _db = await openindexeddb();
        } catch  {
            rej();
            return;
        }
        const transaction = _db.transaction(objectstore_name, 'readwrite');
        const objectstore = transaction.objectStore(objectstore_name);
        const request = objectstore.delete(id);
        request.onsuccess = (ev)=>res(ev.target.result); // result of add is the key of the added item
        request.onerror = (ev)=>rej(ev.target.error);
    });
const Count = (objectstore_name)=>new Promise(async (res, rej)=>{
        try {
            _db = await openindexeddb();
        } catch  {
            rej();
            return;
        }
        const transaction = _db.transaction(objectstore_name, 'readonly');
        const objectstore = transaction.objectStore(objectstore_name);
        let aye_errs = false;
        let count = 0;
        const request = objectstore.count();
        request.onsuccess = (ev)=>count = Number(ev.target.result);
        request.onerror = (_ev)=>aye_errs = true;
        transaction.onerror = ()=>rej();
        transaction.oncomplete = ()=>{
            if (aye_errs) {
                rej();
                return;
            }
            res(count);
        };
    });
const GetAll_S = (objectstore)=>new Promise((res, rej)=>{
        const request = objectstore.getAll();
        request.onsuccess = (ev)=>{
            const records = ev.target.result.filter((r)=>!r.isdeleted);
            res(records);
        };
        request.onerror = (ev)=>rej(ev.target.error);
    });
const GetOne_S = (objectstore, id)=>new Promise((res, rej)=>{
        const request = objectstore.get(id);
        request.onsuccess = (ev)=>res(ev.target.result);
        request.onerror = (ev)=>rej(ev.target.error);
    });
const AddOne_S = (objectstore, data)=>new Promise((res, rej)=>{
        const request = objectstore.add(data);
        request.onsuccess = (ev)=>res(ev.target.result); // result of add is the key of the added item
        request.onerror = (ev)=>rej(ev.target.error);
    });
const PutOne_S = (objectstore, data)=>new Promise((res, rej)=>{
        const request = objectstore.put(data);
        request.onsuccess = (ev)=>res(ev.target.result); // result of add is the key of the added item
        request.onerror = (ev)=>rej(ev.target.error);
    });
const DeleteOne_S = (objectstore, id)=>new Promise((res, rej)=>{
        const request = objectstore.delete(id);
        request.onsuccess = (ev)=>res(ev.target.result); // result of add is the key of the added item
        request.onerror = (ev)=>rej(ev.target.error);
    });
const TXResult = (tx)=>new Promise((res, rej)=>{
        tx.onerror = (event)=>{
            rej(event.target.error);
        };
        tx.oncomplete = ()=>{
            res(1);
        };
        tx.onabort = (event)=>{
            rej(event.target.error || new Error("Transaction aborted"));
        };
    });
const openindexeddb = ()=>new Promise(async (res, rej)=>{
        let dbconnect = indexedDB.open(_db_name, _db_version);
        dbconnect.onerror = (_event)=>{
            rej();
        };
        dbconnect.onsuccess = async (event)=>{
            const db = event.target.result;
            res(db);
        };
        dbconnect.onupgradeneeded = (event)=>{
            const db = event.target.result;
            _localdb_objectstores.forEach((dc)=>{
                if (!db.objectStoreNames.contains(dc.name)) {
                    const objectStore = db.createObjectStore(dc.name, {
                        keyPath: 'id'
                    });
                    (dc.indexes || []).forEach((prop)=>{
                        objectStore.createIndex(prop, prop, {
                            unique: false
                        });
                    });
                }
            });
        };
    });
export { Init };
if (!window.$N) {
    window.$N = {};
}
window.$N.IDB = {
    GetDB,
    GetOne,
    GetAll,
    ClearAll,
    AddOne,
    PutOne,
    DeleteOne,
    Count,
    GetOne_S,
    GetAll_S,
    AddOne_S,
    PutOne_S,
    DeleteOne_S,
    TXResult
};
