const INSTANCE_LAZYLOAD_DATA_FUNCS = {
    home_indexeddb: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        }),
    home_other: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        }),
    machines_indexeddb: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, rej)=>{
            const d = new Map();
            try {
                let m = await $N.IDB.GetAll([
                    "machines"
                ]);
                d.set("1:machines", m.get("machines"));
            } catch  {
                rej();
            }
            res(d);
        }),
    machines_other: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        }),
    machine_indexeddb: (pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, rej)=>{
            const d = new Map();
            try {
                let ir = await $N.IDB.GetOne("machines", pathparams.id);
                d.set("1:machines/" + pathparams.id, [
                    ir
                ]);
            } catch  {
                rej();
                return;
            }
            res(d);
        }),
    machine_other: (pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, rej)=>{
            const d = new Map();
            const path = `machines/${pathparams.id}/statuses2`;
            const opts = {
                order_by: "ts,desc",
                limit: 200
            };
            const httpopts = {
                method: "POST",
                body: JSON.stringify({
                    paths: [
                        path
                    ],
                    opts: [
                        opts
                    ]
                })
            };
            const r = await $N.FetchLassie('/api/firestore_retrieve', httpopts, {});
            if (!r.ok) {
                rej();
                return;
            }
            d.set("2:" + path, r.data[0]);
            res(d);
        }),
    machinetelemetry_indexeddb: (pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, rej)=>{
            const d = new Map();
            try {
                let ir = await $N.IDB.GetOne("machines", pathparams.id);
                d.set("1:machines/" + pathparams.id, [
                    ir
                ]);
            } catch  {
                rej();
                return;
            }
            res(d);
        }),
    machinetelemetry_other: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        }),
    notifications_indexeddb: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        }),
    notifications_other: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, rej)=>{
            const d = new Map();
            const path = '/api/pwt/notifications/get_users_schedules';
            const r = await $N.FetchLassie(path);
            if (!r.ok) {
                rej();
                return;
            }
            d.set("3:" + path, r.data);
            res(d);
        })
};
export { };
