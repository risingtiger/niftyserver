(() => {
  // ../../.nifty/files/alwaysload/localdbsync.js
  var DBNAME = "";
  var DBVERSION = 0;
  var PERIODIC_PAGELOAD_DELAY_MS = 3 * 1e3;
  var PERIODIC_INTERVAL_MS = 1 * 60 * 1e3;
  var SYNC_PENDING_INTERVAL_MS = 1 * 60 * 1e3;
  var CHECK_LATEST_INTERVAL_MS = 5 * 60 * 1e3;
  var WIPE_LOCAL_INTERVAL_MS = 72 * 60 * 60 * 1e3;
  var SYNC_PENDING_INTERVAL_LOCALSTORAGE_KEY = "localdbsync_sync_pending_interval_ts";
  var CHECK_LATEST_INTERVAL_LOCALSTORAGE_KEY = "localdbsync_check_latest_interval_ts";
  var WIPE_LOCAL_INTERVAL_LOCALSTORAGE_KEY = "localdbsync_wipe_local_interval_ts";
  var PENDING_SYNC_STORE_NAME = "localdbsync_pending_sync_operations";
  var COLLECTION_TS = "localdbsync_collections_ts";
  var _syncobjectstores = [];
  var _activepaths = [];
  var _a_millis = 0;
  var Init = (localdb_objectstores_tosync, db_name, db_version) => {
    _a_millis = Math.floor(Date.now() / 1e3);
    DBNAME = db_name;
    DBVERSION = db_version;
    {
      const objectstores_tosync_names = localdb_objectstores_tosync.map((item) => item.name);
      const localstorage_syncobjectstores = JSON.parse(localStorage.getItem(COLLECTION_TS) || "[]");
      const synccollections_not_in_localstorage = objectstores_tosync_names.filter((name) => !localstorage_syncobjectstores.find((item) => item.name === name));
      synccollections_not_in_localstorage.forEach((name) => {
        localstorage_syncobjectstores.push({ name, ts: null });
      });
      _syncobjectstores = localstorage_syncobjectstores.map((dc, _i) => ({ name: dc.name, ts: dc.ts, lock: false, indexes: localdb_objectstores_tosync.find((l_ots) => l_ots.name === dc.name)?.indexes || null }));
      localStorage.setItem(COLLECTION_TS, JSON.stringify(localstorage_syncobjectstores));
      _activepaths = _syncobjectstores.filter((so) => so.ts !== null && so.ts > 0).map((so) => parse_into_pathspec(so.name));
    }
    setup_local_db_interval_periodic();
    $N.EngagementListen.Add_Listener(document.body, "firestore", "visible", 100, async () => {
      RunCheckLatest();
    });
    $N.SSEvents.Add_Listener(document.body, "firestore_doc_add", [1], 100, (event) => {
      handle_firestore_doc_add_or_patch(parse_into_pathspec(event.path), event.data);
    });
    $N.SSEvents.Add_Listener(document.body, "firestore_doc_patch", [2], 100, (event) => {
      handle_firestore_doc_add_or_patch(parse_into_pathspec(event.path), event.data);
    });
    $N.SSEvents.Add_Listener(document.body, "firestore_doc_delete", [3], 100, async (event) => {
      const pathspec = parse_into_pathspec(event.path);
      let db;
      try {
        db = await $N.IDB.GetDB();
      } catch {
        return;
      }
      const cname = pathspec.syncobjectstore.name;
      const tx = db.transaction(cname, "readwrite", { durability: "relaxed" });
      const objectStore = tx.objectStore(cname);
      let wholedata;
      try {
        wholedata = await $N.IDB.GetOne_S(objectStore, pathspec.docid);
      } catch {
        return;
      }
      wholedata.ts = event.ts;
      wholedata.isdeleted = true;
      try {
        await $N.IDB.PutOne_S(objectStore, wholedata);
      } catch {
        return;
      }
      try {
        await $N.IDB.TXResult(tx);
      } catch {
        return;
      }
      const datapath = "1:" + pathspec.collection;
      DataChanged(/* @__PURE__ */ new Map([[datapath, [wholedata]]]));
      return;
    });
    $N.SSEvents.Add_Listener(document.body, "firestore_doc_collection", [4], 100, async (event) => {
      const pathspecs = findrelevantpathspecs_from_ssepaths(event.paths);
      if (!pathspecs) return;
      const r = await datasetter(pathspecs, {}, true, true);
      if (r === null || r === 1) return;
      notify_of_datachange(r);
    });
    return true;
    function findrelevantpathspecs_from_ssepaths(ssepaths) {
      const ssepathspecs = ssepaths?.map((sp) => parse_into_pathspec(sp)) || [];
      const pathspecs = _activepaths.filter((aps) => {
        return ssepathspecs.find((sp) => sp.collection === aps.collection && sp.docid === aps.docid && sp.subcollection === aps.subcollection);
      });
      if (pathspecs.length === 0) return null;
      return pathspecs;
    }
  };
  var RunCheckLatest = async () => {
    if (_activepaths.length === 0) return;
    const r = await datasetter(_activepaths, { retries: 2 }, true, true);
    if (r === null || r === 1) return;
    notify_of_datachange(r);
  };
  var EnsureObjectStoresActive = (names) => new Promise(async (res, rej) => {
    const pathspecs = names.map((name) => parse_into_pathspec(name));
    const newpathspecs = pathspecs.filter((pathspec) => !_activepaths.some((activePath) => activePath.collection === pathspec.collection && activePath.docid === pathspec.docid && activePath.subcollection === pathspec.subcollection));
    if (newpathspecs.length === 0) {
      res(1);
      return;
    }
    const r = await datasetter(newpathspecs, {}, false, false);
    if (r === null) {
      rej();
      return;
    }
    _activepaths = [..._activepaths, ...newpathspecs];
    res(1);
  });
  var Add = (path, data) => new Promise(async (res, _rej) => {
    const pathspec = parse_into_pathspec(path);
    let wholedata = {};
    let db;
    try {
      db = await $N.IDB.GetDB();
    } catch {
      record_failed();
      return;
    }
    data.ts = Math.floor(Date.now() / 1e3);
    data.id = crypto.randomUUID();
    let aye_errs = false;
    const cname = pathspec.syncobjectstore.name;
    const tx = db.transaction([cname], "readwrite", { durability: "relaxed" });
    const objectstore = tx.objectStore(cname);
    try {
      await $N.IDB.AddOne_S(objectstore, data);
    } catch {
      aye_errs = true;
    }
    try {
      await $N.IDB.TXResult(tx);
    } catch {
      aye_errs = true;
    }
    if (aye_errs) {
      record_failed();
      return;
    }
    res(1);
    const datapath = "1:" + pathspec.collection;
    const returnmap = /* @__PURE__ */ new Map([[datapath, [wholedata]]]);
    DataChanged(returnmap);
    {
      const body = { path: cname, data };
      const opts = { method: "POST", body: JSON.stringify(body) };
      const r = await $N.FetchLassie("/api/firestore_add", opts, null);
      if (!r.ok) {
        record_failed();
        return;
      }
    }
  });
  var Patch = (pathstr, newdata) => new Promise(async (res, _rej) => {
    const pathspec = parse_into_pathspec(pathstr);
    let db;
    try {
      db = await $N.IDB.GetDB();
    } catch {
      record_failed();
      return;
    }
    const cname = pathspec.syncobjectstore.name;
    const tx = db.transaction([cname], "readwrite", { durability: "relaxed" });
    const objectStore = tx.objectStore(cname);
    let wholedata;
    try {
      wholedata = await $N.IDB.GetOne_S(objectStore, pathspec.docid);
    } catch {
      record_failed();
      return;
    }
    update_record_with_new_data(wholedata, newdata);
    const oldts = wholedata.ts;
    wholedata.ts = Math.floor(Date.now() / 1e3);
    newdata.ts = wholedata.ts;
    try {
      await $N.IDB.PutOne_S(objectStore, wholedata);
    } catch {
      record_failed();
      return;
    }
    try {
      await $N.IDB.TXResult(tx);
    } catch {
      record_failed();
      return;
    }
    res(1);
    const datapath = "1:" + pathspec.collection;
    DataChanged(/* @__PURE__ */ new Map([[datapath, [wholedata]]]));
    {
      const body = { path: pathspec.path, oldts, newdata: change_newdata_for_firestore_update(newdata) };
      const opts = { method: "POST", body: JSON.stringify(body) };
      const r = await $N.FetchLassie("/api/firestore_patch", opts, null);
      if (!r.ok) {
        record_failed();
        return;
      } else if (r.data.code === 10) {
        await $N.IDB.DeleteOne(cname, pathspec.docid);
        const data = { id: pathspec.docid, isdeleted: true };
        DataChanged(/* @__PURE__ */ new Map([[datapath, [data]]]));
        return;
      } else if (r.data.code === 11) {
        await $N.IDB.PutOne(cname, r.data.data);
        DataChanged(/* @__PURE__ */ new Map([[datapath, [r.data.data]]]));
        return;
      } else if (r.data.code === 1) {
        return;
      } else {
        return;
      }
    }
    function change_newdata_for_firestore_update(newdata2) {
      const firestore_ready_data = {};
      for (const key in newdata2) {
        if (typeof newdata2[key] === "object" && newdata2[key] !== null) {
          if (newdata2[key].__path) {
            firestore_ready_data[key] = newdata2[key];
          } else {
            for (const subkey in newdata2[key]) {
              firestore_ready_data[`${key}.${subkey}`] = newdata2[key][subkey];
            }
          }
        } else {
          firestore_ready_data[key] = newdata2[key];
        }
      }
      return firestore_ready_data;
    }
  });
  var Delete = (pathstr) => new Promise(async (res, _rej) => {
    const pathspec = parse_into_pathspec(pathstr);
    const db = await $N.IDB.GetDB();
    const cname = pathspec.syncobjectstore.name;
    const tx = db.transaction([cname], "readwrite", { durability: "relaxed" });
    const objectStore = tx.objectStore(cname);
    let existingdata = {};
    try {
      existingdata = await $N.IDB.GetOne_S(objectStore, pathspec.docid);
    } catch {
      record_failed();
      return;
    }
    const oldts = existingdata.ts;
    existingdata.isdeleted = true;
    existingdata.ts = Math.floor(Date.now() / 1e3);
    try {
      await $N.IDB.PutOne_S(objectStore, existingdata);
    } catch {
      record_failed();
      return;
    }
    res(1);
    const datapath = "1:" + pathspec.collection;
    DataChanged(/* @__PURE__ */ new Map([[datapath, [existingdata]]]));
    {
      const body = { path: pathspec.path, oldts, ts: existingdata.ts };
      const opts = { method: "POST", body: JSON.stringify(body) };
      const r = await $N.FetchLassie("/api/firestore_delete", opts, null);
      if (!r.ok) {
        record_failed();
        return;
      } else if (r.data.code === 10) {
        await $N.IDB.DeleteOne(cname, pathspec.docid);
        const data = { id: pathspec.docid, isdeleted: true };
        DataChanged(/* @__PURE__ */ new Map([[datapath, [data]]]));
        return;
      } else if (r.data.code === 11) {
        await $N.IDB.PutOne(cname, r.data.data);
        DataChanged(/* @__PURE__ */ new Map([[datapath, [existingdata]]]));
        return;
      } else if (r.data.code === 1) {
        return;
      } else {
        return;
      }
    }
  });
  var RunWipeLocal = async () => {
    try {
      const db = await $N.IDB.GetDB();
      db.close();
      await new Promise((resolve) => {
        const check_closed = () => {
          try {
            db.transaction([PENDING_SYNC_STORE_NAME], "readonly");
            setTimeout(check_closed, 10);
          } catch {
            resolve();
          }
        };
        check_closed();
      });
      const deleteRequest = indexedDB.deleteDatabase(DBNAME);
      await new Promise((resolve, reject) => {
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onblocked = () => {
          console.warn("Database deletion blocked, forcing close");
          setTimeout(() => resolve(), 1e3);
        };
      });
      localStorage.removeItem(PENDING_SYNC_STORE_NAME + "_exists");
      localStorage.removeItem(COLLECTION_TS);
      localStorage.removeItem(SYNC_PENDING_INTERVAL_LOCALSTORAGE_KEY);
      localStorage.removeItem(CHECK_LATEST_INTERVAL_LOCALSTORAGE_KEY);
      localStorage.removeItem(WIPE_LOCAL_INTERVAL_LOCALSTORAGE_KEY);
      $N.Unrecoverable("Info", "App Data Refresh Needed", "Ok", "ldr", "", null);
    } catch (error) {
      console.error("Error wiping local database:", error);
      localStorage.removeItem("pending_sync_operations_exists");
      localStorage.removeItem(COLLECTION_TS);
    }
  };
  var setup_local_db_interval_periodic = () => {
    const run_sync_if_needed = () => {
      const now = Date.now();
      const sync_pending_interval_ts_str = localStorage.getItem(SYNC_PENDING_INTERVAL_LOCALSTORAGE_KEY);
      let sync_pending_interval_ts = sync_pending_interval_ts_str ? parseInt(sync_pending_interval_ts_str) : 0;
      const check_latest_run_str = localStorage.getItem(CHECK_LATEST_INTERVAL_LOCALSTORAGE_KEY);
      let check_latest_run_ts = check_latest_run_str ? parseInt(check_latest_run_str) : 0;
      const wipe_local_run_str = localStorage.getItem(WIPE_LOCAL_INTERVAL_LOCALSTORAGE_KEY);
      let wipe_local_run_ts = wipe_local_run_str ? parseInt(wipe_local_run_str) : 0;
      if (!sync_pending_interval_ts) {
        sync_pending_interval_ts = now;
        localStorage.setItem(SYNC_PENDING_INTERVAL_LOCALSTORAGE_KEY, now.toString());
      }
      if (!check_latest_run_ts) {
        check_latest_run_ts = now;
        localStorage.setItem(CHECK_LATEST_INTERVAL_LOCALSTORAGE_KEY, now.toString());
      }
      if (!wipe_local_run_ts) {
        wipe_local_run_ts = now;
        localStorage.setItem(WIPE_LOCAL_INTERVAL_LOCALSTORAGE_KEY, now.toString());
      }
      if (now - sync_pending_interval_ts >= SYNC_PENDING_INTERVAL_MS) {
        localStorage.setItem(SYNC_PENDING_INTERVAL_LOCALSTORAGE_KEY, now.toString());
      }
      if (now - check_latest_run_ts >= CHECK_LATEST_INTERVAL_MS) {
        localStorage.setItem(CHECK_LATEST_INTERVAL_LOCALSTORAGE_KEY, now.toString());
        RunCheckLatest();
      }
      if (now - wipe_local_run_ts >= WIPE_LOCAL_INTERVAL_MS) {
        localStorage.setItem(WIPE_LOCAL_INTERVAL_LOCALSTORAGE_KEY, now.toString());
        RunWipeLocal();
      }
    };
    setTimeout(run_sync_if_needed, PERIODIC_PAGELOAD_DELAY_MS);
    setInterval(run_sync_if_needed, PERIODIC_INTERVAL_MS);
  };
  function notify_of_datachange(returns) {
    let is_too_large_to_update = false;
    if ([...returns].some((rr) => rr[1].length === 300)) is_too_large_to_update = true;
    if (is_too_large_to_update) {
      HandleLocalDBSyncUpdateTooLarge();
      return;
    }
    if ([...returns].some((rr) => rr[1].length >= 1)) {
      DataChanged(returns);
    }
  }
  var handle_firestore_doc_add_or_patch = (pathspec, data) => new Promise(async (res, _rej) => {
    if (pathspec.syncobjectstore) {
      await write_to_indexeddb_store([pathspec.syncobjectstore], [[data]]);
    }
    const datapathspec = "1:" + pathspec.collection;
    DataChanged(/* @__PURE__ */ new Map([[datapathspec, [data]]]));
    res(1);
  });
  var datasetter = (pathspecs, opts, force_refresh_syncobjectstores = false, returnnewdata = false) => new Promise(async (res, _rej) => {
    opts = opts || { retries: 0 };
    opts.retries = opts.retries || 0;
    let returns = /* @__PURE__ */ new Map();
    const paths_tosync = pathspecs.filter((p) => p.syncobjectstore.ts === null || force_refresh_syncobjectstores);
    const syncobjectstores_tosync_withduplicates = paths_tosync.map((p) => p.syncobjectstore);
    const syncobjectstores_tosync = syncobjectstores_tosync_withduplicates.filter((item, index) => syncobjectstores_tosync_withduplicates.indexOf(item) === index);
    const syncobjectstores_tosync_unlocked = syncobjectstores_tosync.filter((dc) => !dc.lock);
    const syncobjectstores_tosync_locked = syncobjectstores_tosync.filter((dc) => dc.lock);
    {
      if (syncobjectstores_tosync_unlocked.length) {
        const rs = await load_into_syncobjectstores(syncobjectstores_tosync_unlocked, opts.retries, returnnewdata);
        if (rs === null) {
          res(null);
          return;
        }
        if (returnnewdata) returns = rs;
      }
      if (syncobjectstores_tosync_locked.length) {
        await new Promise((resolve_inner) => {
          const intrvl = setInterval(() => {
            if (syncobjectstores_tosync_locked.every((dc) => !dc.lock)) {
              clearInterval(intrvl);
              resolve_inner(1);
            }
          }, 10);
        });
      }
    }
    if (returnnewdata) res(returns);
    else res(1);
  });
  function parse_into_pathspec(path) {
    const p = path.split("/");
    const collection = p[0];
    const docid = p[1] || null;
    const subcollection = docid && p[2] ? p[2] : null;
    const syncobjectstore = _syncobjectstores.find((dc) => dc.name === collection);
    return { path, p, collection, docid, subcollection, syncobjectstore };
  }
  var load_into_syncobjectstores = (syncobjectstores, retries = 0, returnnewdata, returnnewdata_limit = 300) => new Promise(async (res, _rej) => {
    syncobjectstores.forEach((dc) => dc.lock = true);
    const runidstring = Math.random().toString(15).substring(2, 12);
    let continue_calling = true;
    const paths = syncobjectstores.map((dc) => dc.name);
    const tses = syncobjectstores.map((dc) => dc.ts || null);
    const returns = new Map(paths.map((path) => ["1:" + path, []]));
    const body = { runid: runidstring, paths, tses };
    while (continue_calling) {
      const r = await $N.FetchLassie("/api/firestore_get_batch", { method: "POST", body: JSON.stringify(body) }, { retries });
      if (!r.ok) {
        cleanup();
        res(null);
        return;
      }
      for (let i = 0; i < paths.length; i++) {
        if (r.data[i].docs.length === 0) continue;
        await write_to_indexeddb_store([syncobjectstores[i]], [r.data[i].docs]);
        if (returnnewdata) pushtoreturns(paths[i], r.data[i].docs);
      }
      continue_calling = r.data.every((rr) => rr.isdone) ? false : true;
    }
    const newts = Math.floor(Date.now() / 1e3);
    syncobjectstores.forEach((dc) => dc.ts = newts);
    localStorage.setItem(COLLECTION_TS, JSON.stringify(_syncobjectstores.map((dc) => ({ name: dc.name, ts: dc.ts }))));
    cleanup();
    if (returnnewdata) res(returns);
    else res(1);
    function cleanup() {
      continue_calling = false;
      syncobjectstores.forEach((dc) => dc.lock = false);
    }
    function pushtoreturns(path, docs) {
      const rp = returns.get("1:" + path);
      const available_space = returnnewdata_limit - rp.length;
      rp.push(...docs.slice(0, available_space));
    }
  });
  var write_to_indexeddb_store = (syncobjectstores, datas) => new Promise(async (resolve, _reject) => {
    if (!datas.some((d) => d.length > 0)) {
      resolve();
      return;
    }
    const db = await $N.IDB.GetDB();
    const tx = db.transaction(syncobjectstores.map((ds) => ds.name), "readwrite", { durability: "relaxed" });
    let are_there_any_put_errors = false;
    for (let i = 0; i < syncobjectstores.length; i++) {
      const ds = syncobjectstores[i];
      if (datas[i].length === 0) continue;
      const os = tx.objectStore(ds.name);
      for (let ii = 0; ii < datas[i].length; ii++) {
        const db_put = os.put(datas[i][ii]);
        db_put.onerror = (_event) => are_there_any_put_errors = true;
      }
    }
    tx.oncomplete = (_event) => {
      if (are_there_any_put_errors) redirect_from_error("write_to_indexeddb_store");
      resolve();
    };
    tx.onerror = (_event) => {
      redirect_from_error("write_to_indexeddb_store");
    };
  });
  var update_record_with_new_data = (record, newdata) => {
    for (const key in newdata) {
      if (typeof record[key] == "object") update_record_with_new_data(record[key], newdata[key]);
      else record[key] = newdata[key];
    }
  };
  var record_failed = () => {
    RunWipeLocal();
  };
  async function redirect_from_error(errmsg) {
    $N.Unrecoverable("Error", "Error in LocalDBSync", "Reset App", "ixe", errmsg, null);
  }
  if (!window.$N) {
    window.$N = {};
  }
  window.$N.LocalDBSync = { Add, Patch, Delete };

  // ../../.nifty/files/alwaysload/cmech.js
  var _lazyload_data_funcs = [];
  var _loadeddata = /* @__PURE__ */ new Map();
  var _searchparams = /* @__PURE__ */ new Map();
  var _pathparams = /* @__PURE__ */ new Map();
  var Init2 = (lazyload_data_funcs) => {
    _lazyload_data_funcs = lazyload_data_funcs;
  };
  var AddView = (componentname, pathparams, searchparams_raw, localdb_preload) => new Promise(async (res, rej) => {
    const searchparams_genericrowt = {};
    for (const [key, value] of searchparams_raw.entries()) {
      searchparams_genericrowt[key] = decodeURIComponent(value);
    }
    {
      const promises = [];
      let promises_r = [];
      const localdbsync_promise = localdb_preload ? EnsureObjectStoresActive(localdb_preload) : Promise.resolve(1);
      promises.push(localdbsync_promise);
      promises.push(_lazyload_data_funcs[componentname + "_other"](pathparams, new URLSearchParams(), searchparams_raw));
      promises.push(new Promise(async (res2, rej2) => {
        let r = {};
        let _ = {};
        try {
          _ = await localdbsync_promise;
          r = await _lazyload_data_funcs[componentname + "_indexeddb"](pathparams, new URLSearchParams(), searchparams_raw);
        } catch {
          rej2();
          return;
        }
        res2(r);
      }));
      try {
        promises_r = await Promise.all(promises);
      } catch {
        rej();
        return;
      }
      const loadeddata = /* @__PURE__ */ new Map();
      for (const [datapath, generic_row_array] of promises_r[1].entries()) loadeddata.set(datapath, generic_row_array);
      for (const [datapath, generic_row_array] of promises_r[2].entries()) loadeddata.set(datapath, generic_row_array);
      _loadeddata.set(componentname, loadeddata);
    }
    _searchparams.set(componentname, searchparams_genericrowt);
    _pathparams.set(componentname, pathparams);
    const parentEl = document.querySelector("#views");
    parentEl.insertAdjacentHTML("beforeend", `<v-${componentname} class='view'></v-${componentname}>`);
    const el = parentEl.getElementsByTagName(`v-${componentname}`)[0];
    el.addEventListener("hydrated", () => {
      res(1);
    });
    el.addEventListener("failed", () => {
      _loadeddata.delete(componentname);
      _searchparams.delete(componentname);
      _pathparams.delete(componentname);
      el.remove();
      res(null);
    });
    el.addEventListener("lateloaded", lateloaded);
    parentEl.addEventListener("visibled", visibled);
    let has_late_loaded = false;
    let has_visibled = false;
    function visibled() {
      if (el.opts?.kdonvisibled) {
        el.kd(_loadeddata.get(componentname), "visibled", _pathparams.get(componentname), _searchparams.get(componentname));
        el.sc();
        has_visibled = true;
        handle_visibled_and_late_loaded();
      }
      parentEl.removeEventListener("visibled", visibled);
    }
    function lateloaded() {
      if (el.opts?.kdonvisibled) {
        has_late_loaded = true;
        handle_visibled_and_late_loaded();
      }
      parentEl.removeEventListener("lateloaded", lateloaded);
    }
    function handle_visibled_and_late_loaded() {
      if (has_late_loaded && has_visibled && el.opts?.kdonlateloaded) {
        el.kd(_loadeddata.get(componentname), "lateloaded", _pathparams.get(componentname), _searchparams.get(componentname));
        el.sc();
      }
    }
  });
  var ViewConnectedCallback = async (component, opts = { kdonvisibled: false, kdonlateloaded: false }) => new Promise(async (res, _rej) => {
    const tagname = component.tagName.toLowerCase();
    const tagname_split = tagname.split("-");
    const viewname = tagname_split[1];
    if (tagname_split[0] !== "v") throw new Error("Not a view component");
    for (const prop in component.a) component.a[prop] = component.getAttribute(prop);
    if (!opts.kdonvisilbed) opts.kdonvisilbed = false;
    if (!opts.kdonlateloaded) opts.kdonlateloaded = false;
    component.opts = opts;
    component.subelshldr = [];
    const loadeddata = _loadeddata.get(viewname);
    component.kd(loadeddata, "initial", _pathparams.get(viewname), _searchparams.get(viewname));
    component.sc();
    $N.EngagementListen.Add_Listener(component, "component", "resize", null, async () => {
      component.sc();
    });
    component.subelshldr?.forEach((el) => {
      el.addEventListener("failed", () => {
        component.dispatchEvent(new CustomEvent("failed"));
        res();
        return;
      });
      el.addEventListener("hydrated", () => {
        el.dataset.sub_is_hydrated = "1";
        if (component.subelshldr.every((el2) => el2.dataset.sub_is_hydrated === "1")) {
          res();
          return;
        }
      });
    }) ?? res();
  });
  var ViewPartConnectedCallback = async (component) => new Promise(async (res, _rej) => {
    const tagname = component.tagName.toLowerCase();
    const tagname_split = tagname.split("-");
    if (tagname_split[0] !== "vp") throw new Error("Not a view part component");
    const rootnode = component.getRootNode();
    const host = rootnode.host;
    const ancestor_view_tagname = host.tagName.toLowerCase();
    const ancestor_view_tagname_split = ancestor_view_tagname.split("-");
    const ancestor_viewname = ancestor_view_tagname_split[1];
    for (const prop in component.a) component.a[prop] = component.getAttribute(prop);
    host.subelshldr.push(component);
    component.hostview = host;
    const loadeddata = _loadeddata.get(ancestor_viewname);
    component.kd(loadeddata, "initial", _pathparams.get(ancestor_viewname), _searchparams.get(ancestor_viewname));
    component.sc();
    $N.EngagementListen.Add_Listener(component, "component", "resize", null, async () => {
      component.sc();
    });
    res();
  });
  var AttributeChangedCallback = (component, name, oldval, newval, _opts) => {
    console.log("I THINK THIS IS FIXED. JUST DONT PASS DATA TO ATTRIBUTE FUNCTION DUMB ASS. .... need to somehow wrap in logic where if data is changed or searchparams that (for subels) it allows the attributes to be changed first, then wait for the load and kd calls to transpire before calling sc");
    if (oldval === null) return;
    const a = component.a;
    a[name] = newval;
    if (!a.updatescheduled) {
      a.updatescheduled = true;
      Promise.resolve().then(() => {
        component.sc();
        a.updatescheduled = false;
      });
    }
  };
  var ViewDisconnectedCallback = (component) => {
    if (!component.tagName.startsWith("V-")) throw new Error("Not a view component");
    const componentname = component.tagName.toLowerCase().split("-")[1];
    _loadeddata.delete(componentname);
    _searchparams.delete(componentname);
    _pathparams.delete(componentname);
  };
  var ViewPartDisconnectedCallback = (component) => {
    if (!component.tagName.startsWith("VP-")) throw new Error("Not a view part component");
    const index = component.hostview.subelshldr.indexOf(component);
    component.hostview.subelshldr.splice(index, 1);
  };
  var SearchParamsChanged = (newsearchparams) => new Promise(async (res, rej) => {
    const activeviewel = document.getElementById("views").lastElementChild;
    const componentname = activeviewel.tagName.toLowerCase().split("-")[1];
    const pathparams = _pathparams.get(componentname);
    const oldsearchparams = _searchparams.get(componentname);
    const promises = [];
    let promises_r = [];
    promises.push(_lazyload_data_funcs[componentname + "_other"](pathparams, oldsearchparams, newsearchparams));
    promises.push(_lazyload_data_funcs[componentname + "_indexeddb"](pathparams, oldsearchparams, newsearchparams));
    try {
      promises_r = await Promise.all(promises);
    } catch {
      rej();
      return;
    }
    _searchparams.set(componentname, newsearchparams);
    const loadeddata = /* @__PURE__ */ new Map();
    for (const [datapath, generic_row_array] of promises_r[1].entries()) loadeddata.set(datapath, generic_row_array);
    for (const [datapath, generic_row_array] of promises_r[2].entries()) loadeddata.set(datapath, generic_row_array);
    _loadeddata.set(componentname, loadeddata);
    activeviewel.kd(loadeddata, "searchchanged", _pathparams.get(componentname), _searchparams.get(componentname));
    activeviewel.sc();
    for (const subel of activeviewel.subelshldr) {
      subel.kd(loadeddata, "searchchanged", _pathparams.get(componentname), _searchparams.get(componentname));
      subel.sc();
    }
    res();
  });
  var DataChanged = (updated) => {
    const viewsel = document.getElementById("views");
    const update_types = [];
    const update_paths = [];
    const update_lists = [];
    for (const [datapath, updatedlist] of updated) {
      update_types.push(Number(datapath.charAt(0)));
      update_paths.push(datapath.slice(2));
      update_lists.push(updatedlist);
    }
    for (const [view_component_name, loadeddata] of _loadeddata) {
      const viewel = viewsel.querySelector(`v-${view_component_name}`);
      const loadeddata_types = [];
      const loadeddata_paths = [];
      const loadeddata_arrays = [];
      for (const [loadeddata_path_raw, loadeddata_array] of loadeddata) {
        loadeddata_types.push(Number(loadeddata_path_raw.charAt(0)));
        loadeddata_paths.push(loadeddata_path_raw.slice(2));
        loadeddata_arrays.push(loadeddata_array);
      }
      for (let i = 0; i < update_types.length; i++) {
        let loadeddata_index = -1;
        for (let j = 0; j < loadeddata_types.length; j++) {
          if (loadeddata_types[j] !== update_types[i]) continue;
          if (loadeddata_paths[j] === update_paths[i]) {
            loadeddata_index = j;
            break;
          }
          if (update_types[i] === 1 && loadeddata_paths[j].includes("/") && loadeddata_paths[j].startsWith(update_paths[i] + "/")) {
            loadeddata_index = j;
            break;
          }
        }
        if (loadeddata_index === -1) continue;
        const list_of_add_and_patches = [];
        const list_of_deletes = [];
        for (const d of update_lists[i]) {
          if (d.isdeleted) list_of_deletes.push(d);
          else list_of_add_and_patches.push(d);
        }
        updateArrayIfPresent(loadeddata_arrays[loadeddata_index], list_of_add_and_patches, list_of_deletes);
        viewel.kd(loadeddata, "datachanged", _pathparams.get(view_component_name), _searchparams.get(view_component_name));
        viewel.sc();
        for (const subel of viewel.subelshldr) {
          subel.kd(loadeddata, "datachanged", _pathparams.get(view_component_name), _searchparams.get(view_component_name));
          subel.sc();
        }
      }
    }
  };
  var RemoveActiveView = () => {
    const viewsel = document.getElementById("views");
    const activeview = viewsel.lastElementChild;
    const viewname = activeview.tagName.toLowerCase().split("-")[1];
    if (!activeview) return;
    _loadeddata.delete(viewname);
    _searchparams.delete(viewname);
    _pathparams.delete(viewname);
    activeview.remove();
  };
  var updateArrayIfPresent = (tolist, list_of_add_and_patches, list_of_deletes) => {
    const index_map = /* @__PURE__ */ new Map();
    tolist.forEach((row, i) => index_map.set(row.id, i));
    for (const d of list_of_add_and_patches) {
      const rowindex = index_map.get(d.id);
      if (rowindex === void 0) tolist.push(d);
      else tolist[rowindex] = d;
    }
    const delete_indices = list_of_deletes.map((d) => index_map.get(d.id)).filter((idx) => idx !== void 0).sort((a, b) => b - a);
    for (const rowindex of delete_indices) {
      tolist.splice(rowindex, 1);
    }
  };
  if (!window.$N) {
    window.$N = {};
  }
  window.$N.CMech = { ViewConnectedCallback, ViewPartConnectedCallback, AttributeChangedCallback, ViewDisconnectedCallback, ViewPartDisconnectedCallback };

  // ../../.nifty/files/alwaysload/switchstation_uri.js
  var RegExParams = (original_matchstr) => {
    const pathparamnames = [];
    const pattern = original_matchstr.replace(/:([a-z][a-z_0-9]+)/g, (_match, pathparamname) => {
      pathparamnames.push(pathparamname);
      return "([a-zA-Z0-9_]+)";
    });
    const regex = new RegExp(pattern);
    const paramnames = pathparamnames;
    return { regex, paramnames, pattern };
  };
  var GetPathParams = (pathparams_propnames, pathparams_vals) => {
    const pathparams = pathparams_propnames.map((_, i) => {
      return { [pathparams_propnames[i]]: pathparams_vals[i] };
    });
    return Object.assign({}, ...pathparams);
  };

  // ../../.nifty/files/alwaysload/lazyload_files.js
  var _lazyloads = [];
  var _loaded = /* @__PURE__ */ new Map();
  var timeoutWaitingAnimateId = null;
  function Init3(lazyloads_) {
    _lazyloads = lazyloads_;
    const script_tags = document.head.querySelectorAll("script[is_lazyload_asset]");
    const keymap = /* @__PURE__ */ new Map();
    lazyloads_.forEach((lazyload) => {
      const key = get_filepath(lazyload.type, lazyload.name, lazyload.is_instance);
      keymap.set(key, lazyload);
    });
    script_tags.forEach((script) => {
      const src = script.getAttribute("src");
      if (!src) return;
      const lazyload = keymap.get(src);
      _loaded.set(src, lazyload);
    });
  }
  function LoadView(lazyloadview) {
    return new Promise(async (res, rej) => {
      setBackgroundOverlay(true);
      timeoutWaitingAnimateId = setTimeout(() => {
        setWaitingAnimate(true);
      }, 1e3);
      const loadque = [];
      addtoque(lazyloadview, loadque);
      const r = await retrieve_loadque(loadque);
      clearTimeout(timeoutWaitingAnimateId);
      setBackgroundOverlay(false);
      setWaitingAnimate(false);
      if (r === null) {
        rej();
        return;
      }
      res(1);
    });
  }
  function addtoque(load, loadque) {
    const load_key = get_filepath(load.type, load.name, load.is_instance);
    if (load.dependencies && load.dependencies.length !== 0) {
      for (const dep of load.dependencies) {
        const dep_load = _lazyloads.find((l) => l.type === dep.type && l.name === dep.name);
        addtoque(dep_load, loadque);
      }
    }
    if (!_loaded.has(load_key)) loadque.push(load);
  }
  function retrieve_loadque(loadque) {
    return new Promise(async (res, _rej) => {
      const promises = [];
      const filepaths = loadque.map((l) => get_filepath(l.type, l.name, l.is_instance));
      for (const f of filepaths) {
        promises.push(import_file(f));
      }
      try {
        await Promise.all(promises);
      } catch {
        res(null);
        return;
      }
      for (const load of loadque) {
        const load_key = get_filepath(load.type, load.name, load.is_instance);
        _loaded.set(load_key, load);
      }
      res(1);
    });
  }
  var import_file = (path) => new Promise((res, rej) => {
    import(path).then((module) => {
      res(module);
    }).catch((err) => {
      rej(err);
    });
  });
  function get_filepath(type, name, is_instance) {
    let path = is_instance ? `/assets/instance/` : "/assets/";
    switch (type) {
      case "view":
        path += `lazy/views/${name}/${name}.js`;
        break;
      case "component":
        path += `lazy/components/${name}/${name}.js`;
        break;
      case "thirdparty":
        path += `thirdparty/${name}.js`;
        break;
      case "workers":
        path += `lazy/workers/${name}.js`;
        break;
      case "lib":
        path += `lazy/libs/${name}.js`;
        break;
      case "directive":
        path += `lazy/directives/${name}.js`;
        break;
    }
    return path;
  }
  function setBackgroundOverlay(ison) {
    const xel = document.querySelector("#lazyload_overlay");
    if (ison) {
      xel.classList.add("active");
    } else {
      xel.classList.remove("active");
    }
  }
  function setWaitingAnimate(ison) {
    const xel = document.querySelector("#lazyload_overlay .waiting_animate");
    if (ison) {
      xel.classList.add("active");
    } else {
      xel.classList.remove("active");
    }
  }

  // ../../.nifty/files/alwaysload/switchstation.js
  var _routes = [];
  var Init4 = (lazyloads) => {
    Init3(lazyloads);
    const lazyload_view_urlpatterns = lazyloads.filter((l) => l.type === "view").map((r) => addroute(r)).map((l) => [l.viewname, l.pattern]);
    setuproute(window.location.pathname.slice(3));
    history.replaceState({}, "", window.location.pathname);
    window.addEventListener("popstate", async (_e) => {
      RemoveActiveView();
      if (document.getElementById("views").children.length === 0) {
        setuproute("/v/home");
      }
    });
    return lazyload_view_urlpatterns;
  };
  async function NavigateTo(newPath) {
    const p = "/v/" + newPath;
    history.pushState({ path: p }, "", p);
    setuproute(newPath);
  }
  async function NavigateBack(opts) {
    if (document.getElementById("views").children.length === 1) {
      const defaultpath = opts.default || "home";
      RemoveActiveView();
      history.replaceState({ path: "/v/" + defaultpath }, "", "/v/" + defaultpath);
      await setuproute(defaultpath);
      return;
    }
    history.back();
  }
  async function UpdateSearchParams(newsearchparams) {
    const searchparams = new URLSearchParams(window.location.search);
    Object.entries(newsearchparams).forEach(([key, value]) => {
      searchparams.set(key, value);
    });
    window.location.search = searchparams.toString();
    SearchParamsChanged(newsearchparams);
  }
  function HandleLocalDBSyncUpdateTooLarge() {
    $N.ToastShow("LocalDB Sync Too Large", 4, 5e6);
  }
  var addroute = (lazyload_view) => {
    const { regex, paramnames: pathparams_propnames, pattern } = RegExParams(lazyload_view.urlmatch);
    _routes.push({ lazyload_view, path_regex: regex, pathparams_propnames });
    return { viewname: lazyload_view.name, pattern };
  };
  var setuproute = (path) => new Promise(async (res, _rej) => {
    const [urlmatches, routeindex] = get_route_uri(path);
    try {
      await LoadView(_routes[routeindex].lazyload_view);
    } catch {
      handle_route_fail(_routes[routeindex], true);
      res(null);
      return;
    }
    const viewsel = document.getElementById("views");
    const loadresult = await routeload(routeindex, path, urlmatches);
    if (loadresult === "failed") {
      handle_route_fail(_routes[routeindex], true);
      res(null);
      return;
    }
    viewsel.children[viewsel.children.length - 1].style.display = "block";
    viewsel.children[viewsel.children.length - 1].dataset.active = "true";
    document.querySelector("#views").dispatchEvent(new Event("visibled"));
    res(1);
  });
  var routeload = (routeindex, _uri, urlmatches) => new Promise(async (res, _rej) => {
    const route = _routes[routeindex];
    const pathparams = GetPathParams(route.pathparams_propnames, urlmatches);
    const searchparams = new URLSearchParams(window.location.search);
    const localdb_preload = route.lazyload_view.localdb_preload;
    const promises = [];
    promises.push(AddView(route.lazyload_view.name, pathparams, searchparams, localdb_preload));
    try {
      await Promise.all(promises);
    } catch {
      res("failed");
      return;
    }
    res("success");
  });
  function get_route_uri(url) {
    for (let i = 0; i < _routes.length; i++) {
      let urlmatchstr = url.match(_routes[i].path_regex);
      if (urlmatchstr) {
        return [urlmatchstr.slice(1), i];
      }
    }
    return [[], _routes.findIndex((r) => r.lazyload_view.name === "home")];
  }
  var handle_route_fail = (route, redirect = false) => {
    if (redirect) {
      const routename = route.lazyload_view.name;
      $N.Unrecoverable("App Load Error", "Unable to Load App Page", "Restart App", "srf", `route:${routename}`, null);
    } else {
      $N.ToastShow("Unable to Load View", 4);
    }
  };
  if (!window.$N) {
    window.$N = {};
  }
  window.$N.SwitchStation = { NavigateTo, NavigateBack, UpdateSearchParams };

  // ../../.nifty/files/thirdparty/lit-html.js
  (() => {
    var t = globalThis;
    var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
    var s = Symbol();
    var o = /* @__PURE__ */ new WeakMap();
    var n = class {
      constructor(t4, e6, o6) {
        if (this._$cssResult$ = true, o6 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
        this.cssText = t4, this.t = e6;
      }
      get styleSheet() {
        let t4 = this.o;
        const s4 = this.t;
        if (e && void 0 === t4) {
          const e6 = void 0 !== s4 && 1 === s4.length;
          e6 && (t4 = o.get(s4)), void 0 === t4 && ((this.o = t4 = new CSSStyleSheet()).replaceSync(this.cssText), e6 && o.set(s4, t4));
        }
        return t4;
      }
      toString() {
        return this.cssText;
      }
    };
    var r = (t4) => new n("string" == typeof t4 ? t4 : t4 + "", void 0, s);
    var i = (t4, ...e6) => {
      const o6 = 1 === t4.length ? t4[0] : e6.reduce((e7, s4, o7) => e7 + ((t5) => {
        if (true === t5._$cssResult$) return t5.cssText;
        if ("number" == typeof t5) return t5;
        throw Error("Value passed to 'css' function must be a 'css' function result: " + t5 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
      })(s4) + t4[o7 + 1], t4[0]);
      return new n(o6, t4, s);
    };
    var S = (s4, o6) => {
      if (e) s4.adoptedStyleSheets = o6.map((t4) => t4 instanceof CSSStyleSheet ? t4 : t4.styleSheet);
      else for (const e6 of o6) {
        const o7 = document.createElement("style"), n4 = t.litNonce;
        void 0 !== n4 && o7.setAttribute("nonce", n4), o7.textContent = e6.cssText, s4.appendChild(o7);
      }
    };
    var c = e ? (t4) => t4 : (t4) => t4 instanceof CSSStyleSheet ? ((t5) => {
      let e6 = "";
      for (const s4 of t5.cssRules) e6 += s4.cssText;
      return r(e6);
    })(t4) : t4;
    var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
    var a = globalThis;
    var c2 = a.trustedTypes;
    var l = c2 ? c2.emptyScript : "";
    var p = a.reactiveElementPolyfillSupport;
    var d = (t4, s4) => t4;
    var u = { toAttribute(t4, s4) {
      switch (s4) {
        case Boolean:
          t4 = t4 ? l : null;
          break;
        case Object:
        case Array:
          t4 = null == t4 ? t4 : JSON.stringify(t4);
      }
      return t4;
    }, fromAttribute(t4, s4) {
      let i6 = t4;
      switch (s4) {
        case Boolean:
          i6 = null !== t4;
          break;
        case Number:
          i6 = null === t4 ? null : Number(t4);
          break;
        case Object:
        case Array:
          try {
            i6 = JSON.parse(t4);
          } catch (t5) {
            i6 = null;
          }
      }
      return i6;
    } };
    var f = (t4, s4) => !i2(t4, s4);
    var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
    Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
    var y = class extends HTMLElement {
      static addInitializer(t4) {
        this._$Ei(), (this.l ??= []).push(t4);
      }
      static get observedAttributes() {
        return this.finalize(), this._$Eh && [...this._$Eh.keys()];
      }
      static createProperty(t4, s4 = b) {
        if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t4) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t4, s4), !s4.noAccessor) {
          const i6 = Symbol(), h3 = this.getPropertyDescriptor(t4, i6, s4);
          void 0 !== h3 && e2(this.prototype, t4, h3);
        }
      }
      static getPropertyDescriptor(t4, s4, i6) {
        const { get: e6, set: r4 } = h(this.prototype, t4) ?? { get() {
          return this[s4];
        }, set(t5) {
          this[s4] = t5;
        } };
        return { get: e6, set(s5) {
          const h3 = e6?.call(this);
          r4?.call(this, s5), this.requestUpdate(t4, h3, i6);
        }, configurable: true, enumerable: true };
      }
      static getPropertyOptions(t4) {
        return this.elementProperties.get(t4) ?? b;
      }
      static _$Ei() {
        if (this.hasOwnProperty(d("elementProperties"))) return;
        const t4 = n2(this);
        t4.finalize(), void 0 !== t4.l && (this.l = [...t4.l]), this.elementProperties = new Map(t4.elementProperties);
      }
      static finalize() {
        if (this.hasOwnProperty(d("finalized"))) return;
        if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
          const t5 = this.properties, s4 = [...r2(t5), ...o2(t5)];
          for (const i6 of s4) this.createProperty(i6, t5[i6]);
        }
        const t4 = this[Symbol.metadata];
        if (null !== t4) {
          const s4 = litPropertyMetadata.get(t4);
          if (void 0 !== s4) for (const [t5, i6] of s4) this.elementProperties.set(t5, i6);
        }
        this._$Eh = /* @__PURE__ */ new Map();
        for (const [t5, s4] of this.elementProperties) {
          const i6 = this._$Eu(t5, s4);
          void 0 !== i6 && this._$Eh.set(i6, t5);
        }
        this.elementStyles = this.finalizeStyles(this.styles);
      }
      static finalizeStyles(s4) {
        const i6 = [];
        if (Array.isArray(s4)) {
          const e6 = new Set(s4.flat(1 / 0).reverse());
          for (const s5 of e6) i6.unshift(c(s5));
        } else void 0 !== s4 && i6.push(c(s4));
        return i6;
      }
      static _$Eu(t4, s4) {
        const i6 = s4.attribute;
        return false === i6 ? void 0 : "string" == typeof i6 ? i6 : "string" == typeof t4 ? t4.toLowerCase() : void 0;
      }
      constructor() {
        super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
      }
      _$Ev() {
        this._$ES = new Promise((t4) => this.enableUpdating = t4), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t4) => t4(this));
      }
      addController(t4) {
        (this._$EO ??= /* @__PURE__ */ new Set()).add(t4), void 0 !== this.renderRoot && this.isConnected && t4.hostConnected?.();
      }
      removeController(t4) {
        this._$EO?.delete(t4);
      }
      _$E_() {
        const t4 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
        for (const i6 of s4.keys()) this.hasOwnProperty(i6) && (t4.set(i6, this[i6]), delete this[i6]);
        t4.size > 0 && (this._$Ep = t4);
      }
      createRenderRoot() {
        const t4 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
        return S(t4, this.constructor.elementStyles), t4;
      }
      connectedCallback() {
        this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t4) => t4.hostConnected?.());
      }
      enableUpdating(t4) {
      }
      disconnectedCallback() {
        this._$EO?.forEach((t4) => t4.hostDisconnected?.());
      }
      attributeChangedCallback(t4, s4, i6) {
        this._$AK(t4, i6);
      }
      _$ET(t4, s4) {
        const i6 = this.constructor.elementProperties.get(t4), e6 = this.constructor._$Eu(t4, i6);
        if (void 0 !== e6 && true === i6.reflect) {
          const h3 = (void 0 !== i6.converter?.toAttribute ? i6.converter : u).toAttribute(s4, i6.type);
          this._$Em = t4, null == h3 ? this.removeAttribute(e6) : this.setAttribute(e6, h3), this._$Em = null;
        }
      }
      _$AK(t4, s4) {
        const i6 = this.constructor, e6 = i6._$Eh.get(t4);
        if (void 0 !== e6 && this._$Em !== e6) {
          const t5 = i6.getPropertyOptions(e6), h3 = "function" == typeof t5.converter ? { fromAttribute: t5.converter } : void 0 !== t5.converter?.fromAttribute ? t5.converter : u;
          this._$Em = e6, this[e6] = h3.fromAttribute(s4, t5.type) ?? this._$Ej?.get(e6) ?? null, this._$Em = null;
        }
      }
      requestUpdate(t4, s4, i6) {
        if (void 0 !== t4) {
          const e6 = this.constructor, h3 = this[t4];
          if (i6 ??= e6.getPropertyOptions(t4), !((i6.hasChanged ?? f)(h3, s4) || i6.useDefault && i6.reflect && h3 === this._$Ej?.get(t4) && !this.hasAttribute(e6._$Eu(t4, i6)))) return;
          this.C(t4, s4, i6);
        }
        false === this.isUpdatePending && (this._$ES = this._$EP());
      }
      C(t4, s4, { useDefault: i6, reflect: e6, wrapped: h3 }, r4) {
        i6 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t4) && (this._$Ej.set(t4, r4 ?? s4 ?? this[t4]), true !== h3 || void 0 !== r4) || (this._$AL.has(t4) || (this.hasUpdated || i6 || (s4 = void 0), this._$AL.set(t4, s4)), true === e6 && this._$Em !== t4 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t4));
      }
      async _$EP() {
        this.isUpdatePending = true;
        try {
          await this._$ES;
        } catch (t5) {
          Promise.reject(t5);
        }
        const t4 = this.scheduleUpdate();
        return null != t4 && await t4, !this.isUpdatePending;
      }
      scheduleUpdate() {
        return this.performUpdate();
      }
      performUpdate() {
        if (!this.isUpdatePending) return;
        if (!this.hasUpdated) {
          if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
            for (const [t6, s5] of this._$Ep) this[t6] = s5;
            this._$Ep = void 0;
          }
          const t5 = this.constructor.elementProperties;
          if (t5.size > 0) for (const [s5, i6] of t5) {
            const { wrapped: t6 } = i6, e6 = this[s5];
            true !== t6 || this._$AL.has(s5) || void 0 === e6 || this.C(s5, void 0, i6, e6);
          }
        }
        let t4 = false;
        const s4 = this._$AL;
        try {
          t4 = this.shouldUpdate(s4), t4 ? (this.willUpdate(s4), this._$EO?.forEach((t5) => t5.hostUpdate?.()), this.update(s4)) : this._$EM();
        } catch (s5) {
          throw t4 = false, this._$EM(), s5;
        }
        t4 && this._$AE(s4);
      }
      willUpdate(t4) {
      }
      _$AE(t4) {
        this._$EO?.forEach((t5) => t5.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t4)), this.updated(t4);
      }
      _$EM() {
        this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
      }
      get updateComplete() {
        return this.getUpdateComplete();
      }
      getUpdateComplete() {
        return this._$ES;
      }
      shouldUpdate(t4) {
        return true;
      }
      update(t4) {
        this._$Eq &&= this._$Eq.forEach((t5) => this._$ET(t5, this[t5])), this._$EM();
      }
      updated(t4) {
      }
      firstUpdated(t4) {
      }
    };
    y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.0");
    var t2 = globalThis;
    var i3 = t2.trustedTypes;
    var s2 = i3 ? i3.createPolicy("lit-html", { createHTML: (t4) => t4 }) : void 0;
    var e3 = "$lit$";
    var h2 = `lit$${Math.random().toFixed(9).slice(2)}$`;
    var o3 = "?" + h2;
    var n3 = `<${o3}>`;
    var r3 = document;
    var l2 = () => r3.createComment("");
    var c3 = (t4) => null === t4 || "object" != typeof t4 && "function" != typeof t4;
    var a2 = Array.isArray;
    var u2 = (t4) => a2(t4) || "function" == typeof t4?.[Symbol.iterator];
    var d2 = "[ 	\n\f\r]";
    var f2 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
    var v = /-->/g;
    var _ = />/g;
    var m = RegExp(`>|${d2}(?:([^\\s"'>=/]+)(${d2}*=${d2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
    var p2 = /'/g;
    var g = /"/g;
    var $ = /^(?:script|style|textarea|title)$/i;
    var y2 = (t4) => (i6, ...s4) => ({ _$litType$: t4, strings: i6, values: s4 });
    var x = y2(1);
    var b2 = y2(2);
    var w = y2(3);
    var T = Symbol.for("lit-noChange");
    var E = Symbol.for("lit-nothing");
    var A = /* @__PURE__ */ new WeakMap();
    var C = r3.createTreeWalker(r3, 129);
    function P(t4, i6) {
      if (!a2(t4) || !t4.hasOwnProperty("raw")) throw Error("invalid template strings array");
      return void 0 !== s2 ? s2.createHTML(i6) : i6;
    }
    var V = (t4, i6) => {
      const s4 = t4.length - 1, o6 = [];
      let r4, l3 = 2 === i6 ? "<svg>" : 3 === i6 ? "<math>" : "", c4 = f2;
      for (let i7 = 0; i7 < s4; i7++) {
        const s5 = t4[i7];
        let a3, u3, d3 = -1, y3 = 0;
        for (; y3 < s5.length && (c4.lastIndex = y3, u3 = c4.exec(s5), null !== u3); ) y3 = c4.lastIndex, c4 === f2 ? "!--" === u3[1] ? c4 = v : void 0 !== u3[1] ? c4 = _ : void 0 !== u3[2] ? ($.test(u3[2]) && (r4 = RegExp("</" + u3[2], "g")), c4 = m) : void 0 !== u3[3] && (c4 = m) : c4 === m ? ">" === u3[0] ? (c4 = r4 ?? f2, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? m : '"' === u3[3] ? g : p2) : c4 === g || c4 === p2 ? c4 = m : c4 === v || c4 === _ ? c4 = f2 : (c4 = m, r4 = void 0);
        const x2 = c4 === m && t4[i7 + 1].startsWith("/>") ? " " : "";
        l3 += c4 === f2 ? s5 + n3 : d3 >= 0 ? (o6.push(a3), s5.slice(0, d3) + e3 + s5.slice(d3) + h2 + x2) : s5 + h2 + (-2 === d3 ? i7 : x2);
      }
      return [P(t4, l3 + (t4[s4] || "<?>") + (2 === i6 ? "</svg>" : 3 === i6 ? "</math>" : "")), o6];
    };
    var N = class _N {
      constructor({ strings: t4, _$litType$: s4 }, n4) {
        let r4;
        this.parts = [];
        let c4 = 0, a3 = 0;
        const u3 = t4.length - 1, d3 = this.parts, [f3, v2] = V(t4, s4);
        if (this.el = _N.createElement(f3, n4), C.currentNode = this.el.content, 2 === s4 || 3 === s4) {
          const t5 = this.el.content.firstChild;
          t5.replaceWith(...t5.childNodes);
        }
        for (; null !== (r4 = C.nextNode()) && d3.length < u3; ) {
          if (1 === r4.nodeType) {
            if (r4.hasAttributes()) for (const t5 of r4.getAttributeNames()) if (t5.endsWith(e3)) {
              const i6 = v2[a3++], s5 = r4.getAttribute(t5).split(h2), e6 = /([.?@])?(.*)/.exec(i6);
              d3.push({ type: 1, index: c4, name: e6[2], strings: s5, ctor: "." === e6[1] ? H : "?" === e6[1] ? I : "@" === e6[1] ? L : k }), r4.removeAttribute(t5);
            } else t5.startsWith(h2) && (d3.push({ type: 6, index: c4 }), r4.removeAttribute(t5));
            if ($.test(r4.tagName)) {
              const t5 = r4.textContent.split(h2), s5 = t5.length - 1;
              if (s5 > 0) {
                r4.textContent = i3 ? i3.emptyScript : "";
                for (let i6 = 0; i6 < s5; i6++) r4.append(t5[i6], l2()), C.nextNode(), d3.push({ type: 2, index: ++c4 });
                r4.append(t5[s5], l2());
              }
            }
          } else if (8 === r4.nodeType) if (r4.data === o3) d3.push({ type: 2, index: c4 });
          else {
            let t5 = -1;
            for (; -1 !== (t5 = r4.data.indexOf(h2, t5 + 1)); ) d3.push({ type: 7, index: c4 }), t5 += h2.length - 1;
          }
          c4++;
        }
      }
      static createElement(t4, i6) {
        const s4 = r3.createElement("template");
        return s4.innerHTML = t4, s4;
      }
    };
    function S2(t4, i6, s4 = t4, e6) {
      if (i6 === T) return i6;
      let h3 = void 0 !== e6 ? s4._$Co?.[e6] : s4._$Cl;
      const o6 = c3(i6) ? void 0 : i6._$litDirective$;
      return h3?.constructor !== o6 && (h3?._$AO?.(false), void 0 === o6 ? h3 = void 0 : (h3 = new o6(t4), h3._$AT(t4, s4, e6)), void 0 !== e6 ? (s4._$Co ??= [])[e6] = h3 : s4._$Cl = h3), void 0 !== h3 && (i6 = S2(t4, h3._$AS(t4, i6.values), h3, e6)), i6;
    }
    var M = class {
      constructor(t4, i6) {
        this._$AV = [], this._$AN = void 0, this._$AD = t4, this._$AM = i6;
      }
      get parentNode() {
        return this._$AM.parentNode;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      u(t4) {
        const { el: { content: i6 }, parts: s4 } = this._$AD, e6 = (t4?.creationScope ?? r3).importNode(i6, true);
        C.currentNode = e6;
        let h3 = C.nextNode(), o6 = 0, n4 = 0, l3 = s4[0];
        for (; void 0 !== l3; ) {
          if (o6 === l3.index) {
            let i7;
            2 === l3.type ? i7 = new R(h3, h3.nextSibling, this, t4) : 1 === l3.type ? i7 = new l3.ctor(h3, l3.name, l3.strings, this, t4) : 6 === l3.type && (i7 = new z(h3, this, t4)), this._$AV.push(i7), l3 = s4[++n4];
          }
          o6 !== l3?.index && (h3 = C.nextNode(), o6++);
        }
        return C.currentNode = r3, e6;
      }
      p(t4) {
        let i6 = 0;
        for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t4, s4, i6), i6 += s4.strings.length - 2) : s4._$AI(t4[i6])), i6++;
      }
    };
    var R = class _R {
      get _$AU() {
        return this._$AM?._$AU ?? this._$Cv;
      }
      constructor(t4, i6, s4, e6) {
        this.type = 2, this._$AH = E, this._$AN = void 0, this._$AA = t4, this._$AB = i6, this._$AM = s4, this.options = e6, this._$Cv = e6?.isConnected ?? true;
      }
      get parentNode() {
        let t4 = this._$AA.parentNode;
        const i6 = this._$AM;
        return void 0 !== i6 && 11 === t4?.nodeType && (t4 = i6.parentNode), t4;
      }
      get startNode() {
        return this._$AA;
      }
      get endNode() {
        return this._$AB;
      }
      _$AI(t4, i6 = this) {
        t4 = S2(this, t4, i6), c3(t4) ? t4 === E || null == t4 || "" === t4 ? (this._$AH !== E && this._$AR(), this._$AH = E) : t4 !== this._$AH && t4 !== T && this._(t4) : void 0 !== t4._$litType$ ? this.$(t4) : void 0 !== t4.nodeType ? this.T(t4) : u2(t4) ? this.k(t4) : this._(t4);
      }
      O(t4) {
        return this._$AA.parentNode.insertBefore(t4, this._$AB);
      }
      T(t4) {
        this._$AH !== t4 && (this._$AR(), this._$AH = this.O(t4));
      }
      _(t4) {
        this._$AH !== E && c3(this._$AH) ? this._$AA.nextSibling.data = t4 : this.T(r3.createTextNode(t4)), this._$AH = t4;
      }
      $(t4) {
        const { values: i6, _$litType$: s4 } = t4, e6 = "number" == typeof s4 ? this._$AC(t4) : (void 0 === s4.el && (s4.el = N.createElement(P(s4.h, s4.h[0]), this.options)), s4);
        if (this._$AH?._$AD === e6) this._$AH.p(i6);
        else {
          const t5 = new M(e6, this), s5 = t5.u(this.options);
          t5.p(i6), this.T(s5), this._$AH = t5;
        }
      }
      _$AC(t4) {
        let i6 = A.get(t4.strings);
        return void 0 === i6 && A.set(t4.strings, i6 = new N(t4)), i6;
      }
      k(t4) {
        a2(this._$AH) || (this._$AH = [], this._$AR());
        const i6 = this._$AH;
        let s4, e6 = 0;
        for (const h3 of t4) e6 === i6.length ? i6.push(s4 = new _R(this.O(l2()), this.O(l2()), this, this.options)) : s4 = i6[e6], s4._$AI(h3), e6++;
        e6 < i6.length && (this._$AR(s4 && s4._$AB.nextSibling, e6), i6.length = e6);
      }
      _$AR(t4 = this._$AA.nextSibling, i6) {
        for (this._$AP?.(false, true, i6); t4 && t4 !== this._$AB; ) {
          const i7 = t4.nextSibling;
          t4.remove(), t4 = i7;
        }
      }
      setConnected(t4) {
        void 0 === this._$AM && (this._$Cv = t4, this._$AP?.(t4));
      }
    };
    var k = class {
      get tagName() {
        return this.element.tagName;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      constructor(t4, i6, s4, e6, h3) {
        this.type = 1, this._$AH = E, this._$AN = void 0, this.element = t4, this.name = i6, this._$AM = e6, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = E;
      }
      _$AI(t4, i6 = this, s4, e6) {
        const h3 = this.strings;
        let o6 = false;
        if (void 0 === h3) t4 = S2(this, t4, i6, 0), o6 = !c3(t4) || t4 !== this._$AH && t4 !== T, o6 && (this._$AH = t4);
        else {
          const e7 = t4;
          let n4, r4;
          for (t4 = h3[0], n4 = 0; n4 < h3.length - 1; n4++) r4 = S2(this, e7[s4 + n4], i6, n4), r4 === T && (r4 = this._$AH[n4]), o6 ||= !c3(r4) || r4 !== this._$AH[n4], r4 === E ? t4 = E : t4 !== E && (t4 += (r4 ?? "") + h3[n4 + 1]), this._$AH[n4] = r4;
        }
        o6 && !e6 && this.j(t4);
      }
      j(t4) {
        t4 === E ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t4 ?? "");
      }
    };
    var H = class extends k {
      constructor() {
        super(...arguments), this.type = 3;
      }
      j(t4) {
        this.element[this.name] = t4 === E ? void 0 : t4;
      }
    };
    var I = class extends k {
      constructor() {
        super(...arguments), this.type = 4;
      }
      j(t4) {
        this.element.toggleAttribute(this.name, !!t4 && t4 !== E);
      }
    };
    var L = class extends k {
      constructor(t4, i6, s4, e6, h3) {
        super(t4, i6, s4, e6, h3), this.type = 5;
      }
      _$AI(t4, i6 = this) {
        if ((t4 = S2(this, t4, i6, 0) ?? E) === T) return;
        const s4 = this._$AH, e6 = t4 === E && s4 !== E || t4.capture !== s4.capture || t4.once !== s4.once || t4.passive !== s4.passive, h3 = t4 !== E && (s4 === E || e6);
        e6 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t4), this._$AH = t4;
      }
      handleEvent(t4) {
        "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t4) : this._$AH.handleEvent(t4);
      }
    };
    var z = class {
      constructor(t4, i6, s4) {
        this.element = t4, this.type = 6, this._$AN = void 0, this._$AM = i6, this.options = s4;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      _$AI(t4) {
        S2(this, t4);
      }
    };
    var j = t2.litHtmlPolyfillSupport;
    j?.(N, R), (t2.litHtmlVersions ??= []).push("3.3.0");
    var B = (t4, i6, s4) => {
      const e6 = s4?.renderBefore ?? i6;
      let h3 = e6._$litPart$;
      if (void 0 === h3) {
        const t5 = s4?.renderBefore ?? null;
        e6._$litPart$ = h3 = new R(i6.insertBefore(l2(), t5), t5, void 0, s4 ?? {});
      }
      return h3._$AI(t4), h3;
    };
    var s3 = globalThis;
    var i4 = class extends y {
      constructor() {
        super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
      }
      createRenderRoot() {
        const t4 = super.createRenderRoot();
        return this.renderOptions.renderBefore ??= t4.firstChild, t4;
      }
      update(t4) {
        const r4 = this.render();
        this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t4), this._$Do = B(r4, this.renderRoot, this.renderOptions);
      }
      connectedCallback() {
        super.connectedCallback(), this._$Do?.setConnected(true);
      }
      disconnectedCallback() {
        super.disconnectedCallback(), this._$Do?.setConnected(false);
      }
      render() {
        return T;
      }
    };
    i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
    var o4 = s3.litElementPolyfillSupport;
    o4?.({ LitElement: i4 });
    (s3.litElementVersions ??= []).push("4.2.0");
    var t3 = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 };
    var e4 = (t4) => (...e6) => ({ _$litDirective$: t4, values: e6 });
    var i5 = class {
      constructor(t4) {
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      _$AT(t4, e6, i6) {
        this._$Ct = t4, this._$AM = e6, this._$Ci = i6;
      }
      _$AS(t4, e6) {
        return this.update(t4, e6);
      }
      update(t4, e6) {
        return this.render(...e6);
      }
    };
    var e5 = class extends i5 {
      constructor(i6) {
        if (super(i6), this.it = E, i6.type !== t3.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
      }
      render(r4) {
        if (r4 === E || null == r4) return this._t = void 0, this.it = r4;
        if (r4 === T) return r4;
        if ("string" != typeof r4) throw Error(this.constructor.directiveName + "() called with a non-string value");
        if (r4 === this.it) return this._t;
        this.it = r4;
        const s4 = [r4];
        return s4.raw = s4, this._t = { _$litType$: this.constructor.resultType, strings: s4, values: [] };
      }
    };
    e5.directiveName = "unsafeHTML", e5.resultType = 1;
    var o5 = e4(e5);
    window.render = B;
    window.html = x;
    window.Lit_Element = i4;
    window.Lit_UnsafeHtml = o5;
    window.Lit_Css = i;
  })();

  // ../../.nifty/files/alwaysload/fetchlassie.js
  var _timeoutWaitingAnimateId = null;
  var _activeRequestCount = 0;
  function FetchLassie(url, http_optsP, opts) {
    return new Promise(async (fetch_callback) => {
      const http_opts = http_optsP || { method: "GET", headers: {}, body: null };
      http_opts.method = typeof http_opts.method !== "undefined" ? http_opts.method : "GET";
      http_opts.headers = typeof http_opts.headers !== "undefined" ? http_opts.headers : {};
      http_opts.body = typeof http_opts.body !== "undefined" ? http_opts.body : null;
      if (!opts) {
        opts = { retries: 0, background: true, animate: true };
      }
      opts.retries = opts.retries || 0;
      opts.background = opts.background || true;
      opts.animate = opts.animate || true;
      _activeRequestCount++;
      if (opts.background) {
        setBackgroundOverlay2(true);
      }
      if (opts.background && opts.animate && _timeoutWaitingAnimateId === null) {
        _timeoutWaitingAnimateId = setTimeout(() => {
          setWaitingAnimate2(true);
        }, 1e3);
      }
      if (!http_opts.headers["Content-Type"]) http_opts.headers["Content-Type"] = "application/json";
      if (!http_opts.headers["Accept"]) http_opts.headers["Accept"] = "application/json";
      http_opts.headers["sse_id"] = localStorage.getItem("sse_id") || null;
      if (opts.retries && opts.retries > 0) {
        http_opts.headers["call_even_if_offline"] = "true";
        http_opts.headers["exitdelay"] = 2.7;
      }
      let result = null;
      for (let i = 0; i < opts.retries + 1; i++) {
        result = await fetchit(url, http_opts);
        if (result.status !== 503) break;
      }
      _activeRequestCount--;
      if (_activeRequestCount === 0) {
        if (_timeoutWaitingAnimateId !== null) {
          clearTimeout(_timeoutWaitingAnimateId);
          _timeoutWaitingAnimateId = null;
        }
        setBackgroundOverlay2(false);
        setWaitingAnimate2(false);
      }
      if (result.status === 503) {
        fetch_callback({ status: 503, statusText: "Network error", ok: false });
        return;
      }
      if (result.status === 410) {
        return;
      }
      const returnobj = { status: result.status, statusText: result.statusText, ok: result.status === 200 };
      try {
        if (result.status === 200) {
          if (http_opts.headers["Accept"] === "application/json") {
            returnobj.data = await result.json();
          } else {
            returnobj.data = await result.text();
          }
        }
      } catch (e) {
      }
      fetch_callback(returnobj);
    });
  }
  var fetchit = (url, http_opts) => new Promise((response_callback, _rej) => {
    fetch(url, http_opts).then(async (server_response) => {
      response_callback(server_response);
    });
  });
  function setBackgroundOverlay2(ison) {
    const xel = document.querySelector("#fetchlassy_overlay");
    if (ison) {
      xel.classList.add("active");
    } else {
      xel.classList.remove("active");
    }
  }
  function setWaitingAnimate2(ison) {
    const xel = document.querySelector("#fetchlassy_overlay .waiting_animate");
    if (ison) {
      xel.classList.add("active");
    } else {
      xel.classList.remove("active");
    }
  }
  if (!window.$N) {
    window.$N = {};
  }
  window.$N.FetchLassie = FetchLassie;

  // ../../.nifty/files/alwaysload/influxdb.js
  function Retrieve_Series(bucket, begins, ends, msrs, fields, tags, intrv, priors) {
    return new Promise(async (res, rej) => {
      const body = { bucket, begins, ends, msrs, fields, tags, intrv, priors };
      const r = await influx_fetch_paths("retrieve_series", body);
      if (!r.ok) {
        rej();
        return;
      }
      const parsed_data = r.data;
      for (let i = 0; i < parsed_data.length; i++) {
        for (let ii = 0; ii < parsed_data[i].length; ii++) {
          for (let iii = 0; iii < parsed_data[i][ii].points.length; iii++) {
            parsed_data[i][ii].points[iii].date = new Date(parsed_data[i][ii].points[iii].date);
          }
        }
      }
      res(parsed_data);
    });
  }
  function Retrieve_Points(bucket, begins, ends, msrs, fields, tags) {
    return new Promise(async (res, rej) => {
      const body = { bucket, begins, ends, msrs, fields, tags };
      const r = await influx_fetch_paths("retrieve_points", body);
      if (!r.ok) {
        rej();
        return;
      }
      const parsed_data = r.data;
      for (let i = 0; i < parsed_data.length; i++) {
        parsed_data[i].date = new Date(parsed_data[i].date);
        parsed_data[i].val = parsed_data[i].val === "true" ? true : false;
      }
      res(parsed_data);
    });
  }
  function Retrieve_Medians(bucket, begins, ends, dur_amounts, dur_units, msrs, fields, tags, aggregate_fn) {
    return new Promise(async (res, rej) => {
      const body = { bucket, begins, ends, dur_amounts, dur_units, msrs, fields, tags, aggregate_fn };
      const r = await influx_fetch_paths("retrieve_medians", body);
      if (!r.ok) {
        rej();
        return;
      }
      const parsed_data = r.data;
      res(parsed_data);
    });
  }
  function influx_fetch_paths(path, body) {
    return new Promise(async (res) => {
      const fetchopts = { method: "POST", body: JSON.stringify(body) };
      const r = await $N.FetchLassie("/api/influxdb_" + path, fetchopts);
      res(r);
    });
  }
  if (!window.$N) {
    window.$N = {};
  }
  window.$N.InfluxDB = { Retrieve_Series, Retrieve_Points, Retrieve_Medians };

  // ../../.nifty/files/alwaysload/sse.js
  var _sse_listeners = [];
  var _sse_event_source = null;
  function Init5() {
    let sse_id = localStorage.getItem("sse_id");
    if (!sse_id) {
      sse_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("sse_id", sse_id);
    }
    const is_localhost = self.location.hostname === "localhost";
    let event_source_url = "";
    if (is_localhost) event_source_url = "/sse_add_listener?id=" + sse_id;
    else if (location.hostname.includes("purewater")) event_source_url = "https://webapp-805737116651.us-central1.run.app/sse_add_listener?id=" + sse_id;
    else if (location.hostname.includes("purewater")) event_source_url = "https://webapp-805737116651.us-central1.run.app/sse_add_listener?id=" + sse_id;
    else event_source_url = "https://xenwebapp-962422772741.us-central1.run.app/sse_add_listener?id=" + sse_id;
    _sse_event_source = new EventSource(event_source_url);
    _sse_event_source.onerror = (_e) => {
    };
    _sse_event_source.addEventListener("connected", (_e) => {
    });
    _sse_event_source.addEventListener("a_1", (e) => {
      handle_message({ action: "SSE_EVENT", trigger: 1, data: e.data });
    });
    _sse_event_source.addEventListener("a_2", (e) => {
      handle_message({ action: "SSE_EVENT", trigger: 2, data: e.data });
    });
    _sse_event_source.addEventListener("a_3", (e) => {
      handle_message({ action: "SSE_EVENT", trigger: 3, data: e.data });
    });
    _sse_event_source.addEventListener("a_4", (e) => {
      handle_message({ action: "SSE_EVENT", trigger: 4, data: e.data });
    });
  }
  function Add_Listener(el, name, triggers, priority_, callback_) {
    for (let i = 0; i < _sse_listeners.length; i++) {
      if (!_sse_listeners[i].el.parentElement) {
        _sse_listeners.splice(i, 1);
      }
    }
    const priority = priority_ || 0;
    const newlistener = { name, el, triggers, priority, cb: callback_ };
    Remove_Listener(el, name);
    _sse_listeners.push(newlistener);
    _sse_listeners.sort((a, b) => a.priority - b.priority);
  }
  function Close() {
    if (_sse_event_source) {
      _sse_event_source.close();
    }
  }
  function Remove_Listener(el, name) {
    const i = _sse_listeners.findIndex((l) => l.el.tagName === el.tagName && l.name === name);
    if (i === -1) return;
    _sse_listeners.splice(i, 1);
  }
  function handle_message(data) {
    const trigger = data.trigger;
    const event_data = JSON.parse(data.data);
    handle_firestore_docs_from_worker(event_data, trigger);
  }
  function handle_firestore_docs_from_worker(data, trigger) {
    const ls = _sse_listeners.filter((l) => l.triggers.includes(trigger));
    if (!ls) throw new Error("should be at least one listener for FIRESTORE_COLLECTION, but none found");
    ls.forEach((l) => l.cb(data));
  }
  if (!window.$N) {
    window.$N = {};
  }
  window.$N.SSEvents = { Add_Listener, Remove_Listener };

  // ../../.nifty/files/alwaysload/logger.js
  var DeviceTypeE = function(DeviceTypeE2) {
    DeviceTypeE2["desktop"] = "dsk";
    DeviceTypeE2["mobile"] = "mbl";
    DeviceTypeE2["tablet"] = "tbl";
    return DeviceTypeE2;
  }(DeviceTypeE || {});
  var BrowserE = function(BrowserE2) {
    BrowserE2["chrome"] = "chr";
    BrowserE2["firefox"] = "frx";
    BrowserE2["safari"] = "saf";
    BrowserE2["other"] = "otr";
    return BrowserE2;
  }(BrowserE || {});
  var LOG_STORE_NAME = "pending_logs";
  var MAX_SENDBEACON_PAYLOAD_SIZE = 60 * 1024;
  function Init6() {
    $N.EngagementListen.Add_Listener(document.body, "logger", "hidden", null, () => {
      sendlogs();
    });
  }
  async function Log(type, subject, message) {
    if (window.location.hostname === "localhost") return;
    let ts = Math.floor(Date.now() / 1e3);
    if (message.length > 36) {
      message = message.slice(0, 33) + "...";
    }
    const log_entry = { type, subject, message, ts };
    try {
      await $N.IDB.AddOne(LOG_STORE_NAME, log_entry);
    } catch {
    }
  }
  async function Get() {
    let user_email = localStorage.getItem("user_email");
    if (!user_email) return;
    const url = "/api/logger/get?user_email=" + user_email;
    const csvstr = await $N.FetchLassie(url, { headers: { "Content-Type": "text/csv", "Accept": "text/csv" } }, {});
    if (!csvstr.ok) {
      alert("unable to retrieve logs");
      return;
    }
    $N.Utils.CSV_Download(csvstr.data, "logs");
  }
  async function sendlogs() {
    let all_logs;
    try {
      all_logs = await $N.IDB.GetAll([LOG_STORE_NAME]);
    } catch {
      return;
    }
    if (all_logs.get(LOG_STORE_NAME)?.length === 0) return;
    let logs_str = all_logs.get(LOG_STORE_NAME)?.map(format_logitem).join("\n") || "";
    let user_email = localStorage.getItem("user_email") || "unknown";
    logs_str = `${user_email}
${get_device()}
${get_browser()}
` + logs_str;
    if (logs_str.length > MAX_SENDBEACON_PAYLOAD_SIZE) {
      await $N.IDB.ClearAll(LOG_STORE_NAME).catch(() => null);
      return;
    }
    if (navigator.sendBeacon("/api/logger/save", logs_str)) {
      await $N.IDB.ClearAll(LOG_STORE_NAME).catch(() => null);
    }
  }
  function format_logitem(logitem) {
    return `${logitem.type},${logitem.subject},${logitem.message},${logitem.ts}`;
  }
  function get_device() {
    const ua = navigator.userAgent;
    const isTablet = /iPad|Tablet|PlayBook|Nexus 7|Nexus 10|KFAPWI/i.test(ua) || /(Android)/i.test(ua) && !/Mobile/i.test(ua);
    const isMobile = /Mobi|Mobile|iPhone|iPod|BlackBerry|Windows Phone|Opera Mini/i.test(ua);
    if (isTablet) {
      return "tbl";
    } else if (isMobile) {
      return "mbl";
    } else {
      return "dsk";
    }
  }
  function get_browser() {
    const ua = navigator.userAgent;
    let browser = "otr";
    if (/Firefox\/\d+/.test(ua)) {
      browser = "frx";
    } else if (/Edg\/\d+/.test(ua)) {
      browser = "chr";
    } else if (/Chrome\/\d+/.test(ua) && !/Edg\/\d+/.test(ua) && !/OPR\/\d+/.test(ua)) {
      browser = "chr";
    } else if (/Safari\/\d+/.test(ua) && !/Chrome\/\d+/.test(ua) && !/OPR\/\d+/.test(ua) && !/Edg\/\d+/.test(ua)) {
      browser = "saf";
    } else if (/OPR\/\d+/.test(ua)) {
      browser = "chr";
    }
    return browser;
  }
  if (!window.$N) {
    window.$N = {};
  }
  window.$N.Logger = { Log, Get };

  // ../../.nifty/files/alwaysload/engagementlisten.js
  var elisteners = [];
  function Add_Listener2(el, name, type_, priority_, callback_) {
    const type = type_;
    for (let i = 0; i < elisteners.length; i++) {
      if (!elisteners[i].el.parentElement) {
        elisteners.splice(i, 1);
      }
    }
    const existing_listener = elisteners.find((l) => l.type === type && l.name === name);
    if (existing_listener) Remove_Listener2(el, name, type);
    const priority = priority_ || 0;
    elisteners.push({ el, name, type, priority, callback: callback_ });
    elisteners.sort((a, b) => a.priority - b.priority);
  }
  function Remove_Listener2(el, name, type_) {
    const i = elisteners.findIndex((l) => l.el.tagName === el.tagName && l.name === name && l.type === type_);
    if (i === -1) return;
    elisteners.splice(i, 1);
  }
  function Init7() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => {
          for (const l of elisteners.filter((l2) => l2.type === "visible")) {
            l.callback();
          }
        }, 500);
      } else if (document.visibilityState === "hidden") {
        setTimeout(() => {
          for (const l of elisteners.filter((l2) => l2.type === "hidden")) {
            l.callback();
          }
        }, 500);
      }
    });
    window.addEventListener("resize", () => {
      for (const l of elisteners.filter((l2) => l2.type === "resize")) {
        l.callback();
      }
    });
  }
  if (!window.$N) {
    window.$N = {};
  }
  window.$N.EngagementListen = { Init: Init7, Add_Listener: Add_Listener2, Remove_Listener: Remove_Listener2 };

  // ../../.nifty/files/alwaysload/indexeddb.js
  var _db = null;
  var _localdb_objectstores = [];
  var _db_name = "";
  var _db_version = 0;
  var Init8 = async (localdb_objectstores, db_name, db_version) => {
    _localdb_objectstores = localdb_objectstores;
    _db_name = db_name;
    _db_version = db_version;
  };
  var GetDB = () => new Promise(async (res, rej) => {
    try {
      _db = await openindexeddb();
    } catch {
      rej();
      return;
    }
    res(_db);
  });
  var GetOne = (objectstore_name, id) => new Promise(async (res, rej) => {
    try {
      _db = await openindexeddb();
    } catch {
      rej();
      return;
    }
    const transaction = _db.transaction(objectstore_name, "readonly");
    const objectStore = transaction.objectStore(objectstore_name);
    let result = {};
    try {
      result = await GetOne_S(objectStore, id);
    } catch {
      rej();
    }
    transaction.onerror = () => rej();
    transaction.oncomplete = () => res(result);
  });
  var GetAll = (objectstore_names) => new Promise(async (res, rej) => {
    try {
      _db = await openindexeddb();
    } catch {
      rej();
      return;
    }
    const returns = /* @__PURE__ */ new Map();
    const transaction = _db.transaction(objectstore_names, "readonly");
    const promises = [];
    for (const objectstore_name of objectstore_names) {
      const objectstore = transaction.objectStore(objectstore_name);
      promises.push(GetAll_S(objectstore));
    }
    const r = await Promise.all(promises).catch(() => null);
    if (r === null) {
      rej();
      return;
    }
    for (let i = 0; i < r.length; i++) {
      returns.set(objectstore_names[i], r[i]);
    }
    transaction.onerror = () => rej();
    transaction.oncomplete = () => res(returns);
  });
  var ClearAll = (objectstore_name) => new Promise(async (res, rej) => {
    try {
      _db = await openindexeddb();
    } catch {
      rej();
      return;
    }
    const tx = _db.transaction(objectstore_name, "readwrite");
    let aye_errs = false;
    const objstore = tx.objectStore(objectstore_name);
    const request = objstore.clear();
    request.onerror = () => {
      aye_errs = true;
    };
    tx.onerror = () => rej();
    tx.oncomplete = () => {
      if (aye_errs) {
        rej();
        return;
      }
      res(1);
    };
  });
  var AddOne = (objectstore_name, data) => new Promise(async (res, rej) => {
    try {
      _db = await openindexeddb();
    } catch {
      rej();
      return;
    }
    const transaction = _db.transaction(objectstore_name, "readonly");
    const objectstore = transaction.objectStore(objectstore_name);
    let keystring = "";
    try {
      keystring = await AddOne_S(objectstore, data.id);
    } catch {
      rej();
    }
    transaction.onerror = () => rej();
    transaction.oncomplete = () => res(keystring);
  });
  var PutOne = (objectstore_name, data) => new Promise(async (res, rej) => {
    try {
      _db = await openindexeddb();
    } catch {
      rej();
      return;
    }
    const transaction = _db.transaction(objectstore_name, "readwrite");
    const objectstore = transaction.objectStore(objectstore_name);
    let keystring = "";
    try {
      keystring = await PutOne_S(objectstore, data);
    } catch {
      rej();
    }
    transaction.onerror = () => rej();
    transaction.oncomplete = () => res(keystring);
  });
  var DeleteOne = (objectstore_name, id) => new Promise(async (res, rej) => {
    try {
      _db = await openindexeddb();
    } catch {
      rej();
      return;
    }
    const transaction = _db.transaction(objectstore_name, "readwrite");
    const objectstore = transaction.objectStore(objectstore_name);
    const request = objectstore.delete(id);
    request.onsuccess = (ev) => res(ev.target.result);
    request.onerror = (ev) => rej(ev.target.error);
  });
  var Count = (objectstore_name) => new Promise(async (res, rej) => {
    try {
      _db = await openindexeddb();
    } catch {
      rej();
      return;
    }
    const transaction = _db.transaction(objectstore_name, "readonly");
    const objectstore = transaction.objectStore(objectstore_name);
    let aye_errs = false;
    let count = 0;
    const request = objectstore.count();
    request.onsuccess = (ev) => count = Number(ev.target.result);
    request.onerror = (_ev) => aye_errs = true;
    transaction.onerror = () => rej();
    transaction.oncomplete = () => {
      if (aye_errs) {
        rej();
        return;
      }
      res(count);
    };
  });
  var GetAll_S = (objectstore) => new Promise((res, rej) => {
    const request = objectstore.getAll();
    request.onsuccess = (ev) => {
      const records = ev.target.result.filter((r) => !r.isdeleted);
      res(records);
    };
    request.onerror = (ev) => rej(ev.target.error);
  });
  var GetOne_S = (objectstore, id) => new Promise((res, rej) => {
    const request = objectstore.get(id);
    request.onsuccess = (ev) => res(ev.target.result);
    request.onerror = (ev) => rej(ev.target.error);
  });
  var AddOne_S = (objectstore, data) => new Promise((res, rej) => {
    const request = objectstore.add(data);
    request.onsuccess = (ev) => res(ev.target.result);
    request.onerror = (ev) => rej(ev.target.error);
  });
  var PutOne_S = (objectstore, data) => new Promise((res, rej) => {
    const request = objectstore.put(data);
    request.onsuccess = (ev) => res(ev.target.result);
    request.onerror = (ev) => rej(ev.target.error);
  });
  var DeleteOne_S = (objectstore, id) => new Promise((res, rej) => {
    const request = objectstore.delete(id);
    request.onsuccess = (ev) => res(ev.target.result);
    request.onerror = (ev) => rej(ev.target.error);
  });
  var TXResult = (tx) => new Promise((res, rej) => {
    tx.onerror = (event) => {
      rej(event.target.error);
    };
    tx.oncomplete = () => {
      res(1);
    };
    tx.onabort = (event) => {
      rej(event.target.error || new Error("Transaction aborted"));
    };
  });
  var openindexeddb = () => new Promise(async (res, rej) => {
    let dbconnect = indexedDB.open(_db_name, _db_version);
    dbconnect.onerror = (_event) => {
      rej();
    };
    dbconnect.onsuccess = async (event) => {
      const db = event.target.result;
      res(db);
    };
    dbconnect.onupgradeneeded = (event) => {
      const db = event.target.result;
      _localdb_objectstores.forEach((dc) => {
        if (!db.objectStoreNames.contains(dc.name)) {
          const objectStore = db.createObjectStore(dc.name, { keyPath: "id" });
          (dc.indexes || []).forEach((prop) => {
            objectStore.createIndex(prop, prop, { unique: false });
          });
        }
      });
    };
  });
  if (!window.$N) {
    window.$N = {};
  }
  window.$N.IDB = { GetDB, GetOne, GetAll, ClearAll, AddOne, PutOne, DeleteOne, Count, GetOne_S, GetAll_S, AddOne_S, PutOne_S, DeleteOne_S, TXResult };

  // ../../.nifty/files/alwaysload/utils.js
  function CSV_Download(csvstr, filename) {
    const blob = new Blob([csvstr], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `${filename}.csv`);
    a.click();
  }
  function resolve_object_references(list, object_stores) {
    const lookup_maps = /* @__PURE__ */ new Map();
    for (const item of list) {
      for (const key in item) {
        const value = item[key];
        if (!value || typeof value !== "object" || !value.__path) {
          continue;
        }
        const [storeName, itemId] = value.__path;
        let lookup_map = lookup_maps.get(storeName);
        if (!lookup_map) {
          const storeData = object_stores.get(storeName);
          lookup_map = /* @__PURE__ */ new Map();
          for (const storeItem of storeData) lookup_map.set(storeItem.id, storeItem);
          lookup_maps.set(storeName, lookup_map);
        }
        item[key + "ref"] = lookup_map.get(itemId);
      }
    }
    return list;
  }
  if (!window.$N) {
    window.$N = {};
  }
  window.$N.Utils = { CSV_Download, resolve_object_references };

  // ../../.nifty/files/main.js
  var INSTANCE_LAZYLOAD_DATA_FUNCS = { home_indexeddb: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }), home_other: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }), machines_indexeddb: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, rej) => {
    const d = /* @__PURE__ */ new Map();
    try {
      let m = await $N.IDB.GetAll(["machines"]);
      d.set("1:machines", m.get("machines"));
    } catch {
      rej();
    }
    res(d);
  }), machines_other: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }), machine_indexeddb: (pathparams, _old_searchparams, _new_searchparams) => new Promise(async (res, rej) => {
    const d = /* @__PURE__ */ new Map();
    try {
      let ir = await $N.IDB.GetOne("machines", pathparams.id);
      d.set("1:machines/" + pathparams.id, [ir]);
    } catch {
      rej();
      return;
    }
    res(d);
  }), machine_other: (pathparams, _old_searchparams, _new_searchparams) => new Promise(async (res, rej) => {
    const d = /* @__PURE__ */ new Map();
    const path = `machines/${pathparams.id}/statuses2`;
    const opts = { order_by: "ts,desc", limit: 200 };
    const httpopts = { method: "POST", body: JSON.stringify({ paths: [path], opts: [opts] }) };
    const r = await $N.FetchLassie("/api/firestore_retrieve", httpopts, {});
    if (!r.ok) {
      rej();
      return;
    }
    d.set("2:" + path, r.data[0]);
    res(d);
  }), machinetelemetry_indexeddb: (pathparams, _old_searchparams, _new_searchparams) => new Promise(async (res, rej) => {
    const d = /* @__PURE__ */ new Map();
    try {
      let ir = await $N.IDB.GetOne("machines", pathparams.id);
      d.set("1:machines/" + pathparams.id, [ir]);
    } catch {
      rej();
      return;
    }
    res(d);
  }), machinetelemetry_other: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }), notifications_indexeddb: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }), notifications_other: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, rej) => {
    const d = /* @__PURE__ */ new Map();
    const path = "/api/pwt/notifications/get_users_schedules";
    const r = await $N.FetchLassie(path);
    if (!r.ok) {
      rej();
      return;
    }
    d.set("3:" + path, r.data);
    res(d);
  }) };
  var SETTINGS = { "MAIN": { "INFO": { "localdb_objectstores": [{ "name": "localdbsync_pending_sync_operations" }, { "name": "pending_logs" }] }, "LAZYLOADS": [{ "type": "view", "urlmatch": "^appmsgs$", "name": "appmsgs", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "view", "urlmatch": "^login$", "name": "login", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "view", "urlmatch": "^setup_push_allowance$", "name": "setup_push_allowance", "is_instance": false, "dependencies": [{ "type": "component", "name": "ol" }, { "type": "component", "name": "btn" }], "auth": ["admin", "store_manager", "scanner"] }, { "type": "component", "name": "graphing", "is_instance": false, "dependencies": [{ "type": "thirdparty", "name": "chartist" }], "auth": [] }, { "type": "component", "name": "ol2", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "component", "name": "ol", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "component", "name": "pol", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "component", "name": "tl", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "component", "name": "reveal", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "component", "name": "dselect", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "component", "name": "in", "is_instance": false, "dependencies": [{ "type": "component", "name": "dselect" }, { "type": "component", "name": "animeffect" }], "auth": [] }, { "type": "component", "name": "in2", "is_instance": false, "dependencies": [{ "type": "component", "name": "dselect" }, { "type": "component", "name": "animeffect" }], "auth": [] }, { "type": "component", "name": "animeffect", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "component", "name": "toast", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "component", "name": "btn", "is_instance": false, "dependencies": [{ "type": "component", "name": "animeffect" }], "auth": [] }, { "type": "thirdparty", "name": "chartist", "is_instance": false, "dependencies": [], "auth": [] }, { "type": "lib", "name": "testlib", "is_instance": false, "dependencies": [], "auth": [] }] }, "INSTANCE": { "INFO": { "name": "INSTANCE_NAME", "shortname": "pwt", "firebase": { "project": "purewatertech", "identity_platform_key": "AIzaSyCdBd4FDBCZbL03_M4k2mLPaIdkUo32giI", "dbversion": 14 }, "localdb_objectstores": [{ "name": "machines" }] }, "LAZYLOADS": [{ "type": "view", "urlmatch": "home", "name": "home", "is_instance": true, "dependencies": [{ "type": "component", "name": "in2" }, { "type": "component", "name": "btn" }, { "type": "component", "name": "toast" }], "auth": [] }, { "type": "view", "urlmatch": "^machines$", "name": "machines", "is_instance": true, "dependencies": [{ "type": "component", "name": "ol" }, { "type": "component", "name": "ol2" }, { "type": "component", "name": "pol" }, { "type": "component", "name": "in" }, { "type": "component", "name": "dselect" }, { "type": "component", "name": "btn" }, { "type": "component", "name": "toast" }, { "type": "component", "name": "metersreport" }, { "type": "component", "name": "machinedetails" }, { "type": "component", "name": "machinemap" }], "auth": ["user", "admin", "store_manager", "scanner"], "localdb_preload": ["machines"] }, { "type": "view", "urlmatch": "^machines/:id$", "name": "machine", "is_instance": true, "dependencies": [{ "type": "component", "name": "ol" }, { "type": "component", "name": "reveal" }, { "type": "component", "name": "in" }, { "type": "component", "name": "dselect" }, { "type": "component", "name": "btn" }, { "type": "component", "name": "toast" }, { "type": "component", "name": "metersreport" }, { "type": "component", "name": "machinedetails" }, { "type": "component", "name": "machinemap" }], "auth": ["user", "admin", "store_manager", "scanner"], "localdb_preload": ["machines"] }, { "type": "view", "urlmatch": "^machines/:id/telemetry$", "name": "machinetelemetry", "is_instance": true, "dependencies": [{ "type": "component", "name": "graphing" }, { "type": "component", "name": "ol" }, { "type": "component", "name": "toast" }], "auth": ["user", "admin", "store_manager", "scanner"], "localdb_preload": ["machines"] }, { "type": "view", "urlmatch": "^notifications$", "name": "notifications", "is_instance": true, "dependencies": [{ "type": "component", "name": "ol" }, { "type": "component", "name": "btn" }, { "type": "component", "name": "in" }, { "type": "component", "name": "reveal" }, { "type": "component", "name": "toast" }], "auth": ["user", "admin", "store_manager", "scanner"] }, { "type": "view", "urlmatch": "tradeup", "name": "tradeup", "is_instance": true, "dependencies": [{ "type": "thirdparty", "name": "chartist" }, { "type": "component", "name": "btn" }, { "type": "component", "name": "toast" }], "auth": ["admin"] }, { "type": "component", "name": "metersreport", "is_instance": true, "dependencies": [{ "type": "component", "name": "dselect" }, { "type": "component", "name": "btn" }, { "type": "component", "name": "in" }, { "type": "component", "name": "toast" }], "auth": [] }, { "type": "component", "name": "machinedetails", "is_instance": true, "dependencies": [{ "type": "component", "name": "btn" }, { "type": "component", "name": "toast" }], "auth": [] }, { "type": "component", "name": "machinemap", "is_instance": true, "dependencies": [{ "type": "component", "name": "btn" }, { "type": "component", "name": "toast" }], "auth": [] }] } };
  var _serviceworker_reg;
  var LAZYLOAD_DATA_FUNCS = { appmsgs_indexeddb: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }), appmsgs_other: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }), login_indexeddb: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }), login_other: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }), setup_push_allowance_indexeddb: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }), setup_push_allowance_other: (_pathparams2, _old_searchparams, _new_searchparams) => new Promise(async (res, _rej) => {
    res(/* @__PURE__ */ new Map());
  }) };
  window.addEventListener("load", async (_e) => {
    const performance_timer = performance.now();
    const lazyload_data_funcs = { ...LAZYLOAD_DATA_FUNCS, ...INSTANCE_LAZYLOAD_DATA_FUNCS };
    const lazyloads = [...SETTINGS.MAIN.LAZYLOADS, ...SETTINGS.INSTANCE.LAZYLOADS];
    const all_localdb_objectstores = [...SETTINGS.INSTANCE.INFO.localdb_objectstores, ...SETTINGS.MAIN.INFO.localdb_objectstores];
    {
      Init8(all_localdb_objectstores, SETTINGS.INSTANCE.INFO.firebase.project, SETTINGS.INSTANCE.INFO.firebase.dbversion);
      Init7();
      Init(SETTINGS.INSTANCE.INFO.localdb_objectstores, SETTINGS.INSTANCE.INFO.firebase.project, SETTINGS.INSTANCE.INFO.firebase.dbversion);
      Init2(lazyload_data_funcs);
      Init6();
    }
    localStorage.setItem("identity_platform_key", SETTINGS.INSTANCE.INFO.firebase.identity_platform_key);
    const lazyload_view_urlpatterns = Init4(lazyloads);
    const performance_timer_b = performance.now() - performance_timer;
    console.log(`App loaded in ${performance_timer_b.toFixed(2)} ms`);
    if (window.APPVERSION > 0) await setup_service_worker(lazyload_view_urlpatterns);
    setTimeout(() => Init5(), 1800);
  });
  document.querySelector("#views").addEventListener("visibled", () => {
  });
  var toast_id_counter = 0;
  function ToastShow(msg, level, _duration) {
    const toast_id = `maintoast-${toast_id_counter}`;
    const toast_el = document.createElement("c-toast");
    toast_el.id = toast_id;
    toast_el.setAttribute("msg", msg || "");
    toast_el.setAttribute("level", level?.toString() || "0");
    toast_el.setAttribute("duration", "2147483647");
    document.body.append(toast_el);
    toast_el.setAttribute("action", "run");
    toast_el.addEventListener("click", () => {
      if (toast_el.parentElement) {
        toast_el.remove();
      }
    });
    toast_el.addEventListener("done", () => {
      if (toast_el.parentElement) {
        toast_el.remove();
      }
    });
    setTimeout(() => {
      const toast_els = document.querySelectorAll("c-toast");
      let bottom_position = 20;
      for (const el of toast_els) {
        el.style.bottom = `${bottom_position}px`;
        bottom_position += 60;
      }
    }, 10);
  }
  $N.ToastShow = ToastShow;
  async function Unrecoverable(subj, msg, btnmsg, logsubj, logerrmsg, redirectionurl) {
    const redirect = redirectionurl || `/v/appmsgs?logsubj=${logsubj}`;
    setalertbox(subj, msg, btnmsg, redirect);
    $N.Logger.Log(40, logsubj, logerrmsg || "");
  }
  $N.Unrecoverable = Unrecoverable;
  function setalertbox(subj, msg, btnmsg, redirect, clickHandler) {
    const modal = document.getElementById("alert_notice");
    if (!modal) return;
    modal.classList.add("active");
    const titleEl = document.getElementById("alert_notice_title");
    const msgEl = document.getElementById("alert_notice_msg");
    const btnReset = document.getElementById("alert_notice_btn");
    if (titleEl) titleEl.textContent = subj;
    if (msgEl) msgEl.textContent = msg;
    if (btnReset) {
      btnReset.textContent = btnmsg;
      const newBtnReset = btnReset.cloneNode(true);
      btnReset.parentNode?.replaceChild(newBtnReset, btnReset);
      newBtnReset.addEventListener("click", () => {
        if (clickHandler) {
          clickHandler();
        } else {
          window.location.href = redirect;
        }
      });
    }
  }
  var setup_service_worker = (lazyload_view_urlpatterns) => new Promise((resolve, _reject) => {
    let hasPreviousController = navigator.serviceWorker.controller ? true : false;
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      _serviceworker_reg = registration;
      navigator.serviceWorker.ready.then(() => {
        registration.active?.postMessage({ action: "initial_data_pass", id_token: localStorage.getItem("id_token"), token_expires_at: localStorage.getItem("token_expires_at"), refresh_token: localStorage.getItem("refresh_token"), user_email: localStorage.getItem("user_email"), lazyload_view_urlpatterns });
        resolve();
      });
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.action === "update_auth_info") {
          localStorage.setItem("id_token", event.data.id_token);
          localStorage.setItem("token_expires_at", event.data.token_expires_at.toString());
          localStorage.setItem("refresh_token", event.data.refresh_token);
        } else if (event.data.action === "update_init") {
          Close();
          setTimeout(() => {
            if (_serviceworker_reg) _serviceworker_reg?.update();
          }, 300);
        } else if (event.data.action === "error_out") {
          if (event.data.subject === "sw4") {
            Unrecoverable("Not Authenticated", "Please Login", "Login", "sw4", event.data.errmsg, "/v/login");
          } else {
            Unrecoverable("App Error", event.data.errmsg, "Restart App", event.data.subject, event.data.errmsg, null);
          }
        }
      });
      navigator.serviceWorker.addEventListener("controllerchange", onNewServiceWorkerControllerChange);
      navigator.serviceWorker.addEventListener("updatefound", (_e) => {
        Close();
      });
      function onNewServiceWorkerControllerChange() {
        if (!hasPreviousController) {
          hasPreviousController = true;
          return;
        }
        const redirect = `/v/appmsgs?appupdate=done`;
        window.location.href = redirect;
      }
    });
  });
})();
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
lit-html/directive.js:
lit-html/directives/unsafe-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
