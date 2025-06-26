import Particle from "./particle.js";
import Location from "./location.js";
import Reports_Meters from "./reports/reports_meters.js";
import Reconcile_Meters from "./reconcile_meters.js";
import PWTData_Sync from "./pwtdatasync.js";
import Notifications from "./notifications.js";
import Admin_Firestore from "./admin/admin_firestore.js";
import Admin_Particle from "./admin/admin_particle.js";
import Admin_Reconcile from "./admin/admin_reconcile.js";
import Admin_InfluxDB from "./admin/admin_influxdb.js";
import Admin_GenReports from "./admin/admin_gen_reports.js";
//import Stats from "./admin/stats.js";
//import Admin_Particle from "./admin/admin_particle.js";
//import { Particle_Data_Usage_All_Product_Chips }  from "./particle_data_usage.js";
//import { General_Funcs_Get_Particle_Device_Info }  from "./generalfuncs.js";
//import { Admin_Particle_Rename_Devices_To_Match_Machine_Chip } from "./admin_particle.js";
//import { Get_Machines_To_Sync_With_PWTData, Sync_PWT_Machines } from "./pwtdatasync.js";
//import { Location_Match } from "./location_match.js"
//import { Reconcile }  from "./reconcile.js";
//import { Misc_Quicky_Show_Prop_Of_All_Machines }  from "./misc_quickies.js";
//import { GetMachinesForSync as AdminPWTDataGetMachinesForSync, Sync as AdminPWTDataSync } from "./admin/pwtdatasync.js";
const SERVER_MAINS = {
    app: {},
    db: {},
    appversion: 0,
    sheets: {},
    gemini: {},
    push_subscriptions: {},
    firestore: {},
    influxdb: {},
    emailing: {},
    sse: {},
    validate_request: (_req)=>Promise.resolve("")
};
function Set_Server_Mains(m) {
    SERVER_MAINS.app = m.app;
    SERVER_MAINS.db = m.db;
    SERVER_MAINS.appversion = m.appversion;
    SERVER_MAINS.sheets = m.sheets;
    SERVER_MAINS.gemini = m.gemini;
    SERVER_MAINS.firestore = m.firestore;
    SERVER_MAINS.influxdb = m.influxdb;
    SERVER_MAINS.emailing = m.emailing;
    SERVER_MAINS.sse = m.sse;
    SERVER_MAINS.validate_request = m.validate_request;
}
function Set_Routes() {
    //SERVER_MAINS.app.post( '/api/pwt/aiask/machine_statuses',                                aiask_machine_statuses)
    SERVER_MAINS.app.get('/api/pwt/particle/getchipdetails', particle_getchipdetails);
    SERVER_MAINS.app.get('/api/pwt/particle/id_from_chipid', particle_id_from_chipid);
    SERVER_MAINS.app.get("/api/pwt/reports/meters_timerange", reports_meters_timerange);
    SERVER_MAINS.app.get("/api/pwt/reports/meters_alltime", reports_meters_alltime);
    SERVER_MAINS.app.get('/api/pwt/chip_gps', chip_gps);
    SERVER_MAINS.app.get('/api/pwt/get_reverse_geo_code_zip_state', get_reverse_geo_code_zip_state);
    SERVER_MAINS.app.put("/api/pwt/machine/:id/reconcile_meters", reconcile_meters);
    SERVER_MAINS.app.get('/api/pwt/notifications/get_users_schedules', get_users_schedules);
    SERVER_MAINS.app.post('/api/pwt/notifications/add_user_schedule', add_user_schedule);
    SERVER_MAINS.app.post('/api/pwt/notifications/remove_user_schedule', remove_user_schedule);
    SERVER_MAINS.app.post('/api/pwt/notifications/update_user_schedule', update_user_schedule);
    SERVER_MAINS.app.post('/api/pwt/notifications/set_user_alwaysnotify', set_user_alwaysnotify);
    SERVER_MAINS.app.post('/api/pwt/notifications/set_user_tag', set_user_tag);
    SERVER_MAINS.app.post('/api/pwt/internal/notify/savestatus_processed', internal_notify_savestatus_processed);
    SERVER_MAINS.app.get('/api/pwt/internal/notify/cronschedule_bulkstatuses', internal_notify_cronschedule_bulkstatuses);
    SERVER_MAINS.app.get('/api/pwt/admin/particle/chipsinfo', admin_particle_chipsinfo);
    SERVER_MAINS.app.get('/api/pwt/admin/particle/data_usage', admin_particle_data_usage);
    SERVER_MAINS.app.get('/api/pwt/admin/reconcile/between_particle_and_machines', admin_reconcile_between_particle_and_machines);
    SERVER_MAINS.app.get('/api/pwt/admin/status_resend_counts', admin_status_resend_counts);
    SERVER_MAINS.app.get('/api/pwt/admin/cell_locations', admin_cell_locations);
    SERVER_MAINS.app.get('/api/pwt/admin/firestore_misc_update', admin_firestore_misc_update);
    SERVER_MAINS.app.get('/api/pwt/admin/firestore_misc_get', admin_firestore_misc_get);
    SERVER_MAINS.app.get('/api/pwt/admin/firestore_misc_add', admin_firestore_misc_add);
    SERVER_MAINS.app.get('/api/pwt/admin/influxdb_misc_add', admin_influxdb_misc_add);
    SERVER_MAINS.app.get('/api/pwt/admin/test/sse', admin_test_sse);
    SERVER_MAINS.app.get('/api/pwt/admin/test/pushnotifications', admin_test_pushnotifications);
    SERVER_MAINS.app.get('/api/pwt/admin/test/email', admin_test_email);
    SERVER_MAINS.app.get("/api/pwt/pwtdata_interface/getstorelist", pwtdata_interface_getstorelist);
    SERVER_MAINS.app.get("/api/pwt/pwtdata_interface/getstore", pwtdata_interface_getstore);
    SERVER_MAINS.app.get("/api/pwt/pwtdata_interface/updatestorelist", pwtdata_interface_updatestorelist);
    SERVER_MAINS.app.get("/api/pwt/pwtdata_interface/attachstore", pwtdata_interface_attachstore);
    SERVER_MAINS.app.get("/api/pwt/pwtdata_interface/sync_all_machines", pwtdata_interface_sync_all_machines);
/*
    SERVER_MAINS.app.patch( "/api/pwt/pwtdata_interface/client/:id/sync",                    pwtdata_interface_client_sync)
    SERVER_MAINS.app.get( "/api/pwt/pwtdata_interface/clients/meters",                       pwtdata_interface_clients_meters)
    */ // ALIASES -- hopefully remove
//SERVER_MAINS.app.patch( "/api/pwt/interface/client/:id/sync",                            pwtdata_interface_client_sync)
//SERVER_MAINS.app.get( "/api/pwt/interface/clients/meters",                               pwtdata_interface_clients_meters)
}
// -- ROUTE HANDLERS --
/*
async function aiask_machine_statuses(req:any, res:any) {

    if (! await SERVER_MAINS.validate_request(res, req)) return 

    const machineid     = req.body.machineid as str
    const question      = req.body.question as str

    const info = await AiAsk.AskAboutMachineStatuses(SERVER_MAINS.gemini, machineid, question).catch(()=>null)
	if (info === null) {   res.status(400).send(); return;   }

    res.status(200).send(JSON.stringify(info))
}
*/ async function particle_getchipdetails(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const id = req.query.particleid;
    let info;
    try {
        info = await Particle.GetChipDetails(id);
    } catch  {
        res.status(400).send();
        return;
    }
    res.status(200).send(JSON.stringify(info));
}
async function particle_id_from_chipid(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const chipid = req.query.chipid;
    const r = await Particle.GetIdFromChipid(chipid);
    if (!r) {
        res.status(400).send();
        return;
    }
    res.status(200).send(r);
}
async function reports_meters_timerange(req, res) {
    //if (! await SERVER_MAINS.validate_request(res, req)) return 
    const machine_record_id = req.query.machine_record_id;
    let pwtdataid = req.query.pwtdataid;
    const daystart = req.query.daystart;
    const dayend = req.query.dayend;
    pwtdataid = pwtdataid ? pwtdataid.padStart(7, '0') : undefined;
    const meters = await Reports_Meters.TimeRange(SERVER_MAINS.db, machine_record_id, pwtdataid, daystart, dayend);
    if (!meters) {
        res.status(400).send();
        return;
    }
    res.status(200).send(meters);
}
async function reports_meters_alltime(req, res) {
    //if (! await SERVER_MAINS.validate_request(res, req)) return 
    const m = req.query.machine_record_id;
    const p = req.query.pwtdataid;
    const machine_record_ids = Array.isArray(m) ? m : m ? [
        m
    ] : undefined;
    const pwtdata_ids = Array.isArray(p) ? p : p ? [
        p
    ] : undefined;
    pwtdata_ids?.forEach((v, i)=>pwtdata_ids[i] = v.padStart(7, '0'));
    const metersTotal = await Reports_Meters.AllTime(SERVER_MAINS.db, machine_record_ids, pwtdata_ids);
    if (!metersTotal) {
        res.status(400).send();
        return;
    }
    res.status(200).send(metersTotal);
}
async function chip_gps(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const machine_id = req.query.id;
    let gps;
    try {
        gps = await Location.GetGPS(SERVER_MAINS.db, machine_id);
    } catch  {
        res.status(400).send();
        return;
    }
    res.status(200).send(JSON.stringify(gps));
}
async function get_reverse_geo_code_zip_state(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const lat = req.query.lat;
    const lon = req.query.lon;
    const gps = await Location.GetReverseGeoCodeZipState(lat, lon);
    if (!gps) {
        res.status(400);
        return;
    }
    res.status(200).send(JSON.stringify(gps));
}
async function reconcile_meters(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const id = req.params.id;
    const reconcile = req.body.reconcile;
    const r = await Reconcile_Meters(SERVER_MAINS.db, SERVER_MAINS.sse, SERVER_MAINS.firestore, id, reconcile);
    if (!r) {
        res.status(400).send();
        return;
    }
    res.status(200).send(r);
}
async function get_users_schedules(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const r = await Notifications.GetSchedules(SERVER_MAINS.db);
    if (!r) {
        res.status(400).send();
        return;
    }
    res.status(200).send(JSON.stringify(r));
}
async function add_user_schedule(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const schedule = req.body.newSchedule;
    const r = await Notifications.AddSchedule(SERVER_MAINS.db, schedule);
    if (!r) {
        res.status(400).send();
        return;
    }
    res.status(200).send(JSON.stringify({
        ok: true
    }));
}
async function remove_user_schedule(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const schedule = req.body.oldSchedule;
    const r = await Notifications.RemoveSchedule(SERVER_MAINS.db, schedule);
    if (!r) {
        res.status(400).send();
        return;
    }
    res.status(200).send(JSON.stringify({
        ok: true
    }));
}
async function update_user_schedule(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const oldSchedule = req.body.oldSchedule;
    const newSchedule = req.body.newSchedule;
    const r = await Notifications.UpdateSchedule(SERVER_MAINS.db, oldSchedule, newSchedule);
    if (!r) {
        res.status(400).send();
        return;
    }
    res.status(200).send(JSON.stringify({
        ok: true
    }));
}
async function set_user_alwaysnotify(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const alwaysnotify = req.body.alwaysnotify;
    const user_email = req.body.user_email;
    const r = await Notifications.SetAlwaysNotify(SERVER_MAINS.db, user_email, alwaysnotify);
    if (!r) {
        res.status(400).send();
        return;
    }
    res.status(200).send(JSON.stringify({
        ok: true
    }));
}
async function set_user_tag(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const action = req.body.action;
    const tag = req.body.tag;
    const user_email = req.body.user_email;
    const r = await Notifications.SetTag(SERVER_MAINS.db, user_email, action, tag);
    if (!r) {
        res.status(400).send();
        return;
    }
    res.status(200).send(JSON.stringify({
        ok: true
    }));
}
/*
async function save_users_schedules(req:any, res:any) {


    if (! await SERVER_MAINS.validate_request(res, req)) return 

    const userEmail = req.body.userEmail as str
    const schedules = req.body.schedules as any[]
    const timeZone  = req.body.timeZone as str

    if (!userEmail || !schedules || !timeZone) {   res.status(400).send(JSON.stringify({message:"Missingu userEmail, schedules or timeZone"})); return;   }


	const r = await Notifications.SaveSchedules(SERVER_MAINS.db, userEmail, schedules, timeZone)
	if (!r)   { res.status(500).send({message:"error saving"}); return; }

	res.status(200).send()
}
*/ // INTERNAL ROUTES 
async function internal_notify_savestatus_processed(req, res) {
    const updated_machine = req.body.updated_machine;
    const alertstr = req.body.alertstr;
    if (alertstr) {
        // this needs to be updated to use new pwt notifications schedule and tag system
        //try   { await SERVER_MAINS.push_subscriptions.Send_Msg(SERVER_MAINS.db, "Machine Status", alertstr, ["errors"]); }
        //catch { res.status(400).send(); return; }
        const r = await SERVER_MAINS.emailing.SendNotification(SERVER_MAINS.db, "Machine Status", alertstr, [
            "errors"
        ]);
        if (!r) {
            res.status(400).send();
            return;
        }
    }
    SERVER_MAINS.sse.TriggerEvent(2, {
        path: "machines/" + updated_machine.id,
        data: {
            ...updated_machine
        }
    });
    res.status(200).send();
}
async function internal_notify_cronschedule_bulkstatuses(_req, res) {
    SERVER_MAINS.sse.TriggerEvent(4, {
        paths: [
            "machines"
        ]
    });
    res.status(200).send(JSON.stringify({
        message: "ok"
    }));
}
// PWTDATA INTERFACE ROUTES 
async function pwtdata_interface_getstorelist(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const r = await PWTData_Sync.GetStoreList(SERVER_MAINS.db);
    if (!r) {
        res.status(400).send();
        return;
    }
    res.status(200).send(r);
}
async function pwtdata_interface_getstore(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const r = await PWTData_Sync.GetStore(req.query.pwtdataid);
    if (!r) {
        res.status(400).send();
        return;
    }
    res.status(200).send(JSON.stringify(r));
}
async function pwtdata_interface_updatestorelist(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    try {
        await PWTData_Sync.UpdateStoreList(SERVER_MAINS.db);
    } catch  {
        res.status(400).send();
        return;
    }
    res.status(200).send(JSON.stringify({
        ok: true
    }));
}
async function pwtdata_interface_attachstore(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const pwtdataid = req.query.pwtdataid;
    const machinerecordid = req.query.machinerecordid;
    const ts = req.query.ts;
    let r = {};
    try {
        r = await PWTData_Sync.AttachStore(SERVER_MAINS.db, pwtdataid, machinerecordid, Number(ts));
    } catch  {
        res.status(400).send();
        return;
    }
    SERVER_MAINS.sse.TriggerEvent(2, {
        path: "machines/" + machinerecordid,
        data: r
    });
    res.status(200).send(r);
}
async function pwtdata_interface_sync_all_machines(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    await PWTData_Sync.SyncAllMachines(SERVER_MAINS.db);
    SERVER_MAINS.sse.TriggerEvent(4, {
        paths: [
            "machines"
        ]
    });
    res.status(200).send();
}
/*
async function pwtdata_interface_client_sync(req:any, res:any) {

    //if (! await SERVER_MAINS.validate_request(res, req)) return 

    const client_id = req.params.id
    const body:any  = req.body

    const r = await Interface.ClientSync(SERVER_MAINS.db, client_id, body)

    const email1 = "davis@risingtiger.com"
    const email2 = "pwtdata@gmail.com"

    const email_name1 = "davis@risingtiger.com"
    const email_name2 = "pwtdata@gmail.com"

    const emailmsg = {
        From: {
            Email: "accounts@risingtiger.com",
            Name:  "Davis Hammon"
        },
        To: [
            {
                Email: "",
                Name: ""
            }
        ],
        Subject: "",
        TextPart: "",
        HTMLPart: ``
    }
    

    if (r.message.includes("Synced")) {
        const msg1 = JSON.parse(JSON.stringify(emailmsg))
        const msg2 = JSON.parse(JSON.stringify(emailmsg))

        const message_prefix = `
        --- SYNCED -- 
        Store Name: ${body.clientName} -- Chip ID: ${body.chipID} 
        `
        const message = message_prefix + r.message

        msg1.To[0].Email = email1
        msg1.To[0].Name  = email_name1
        msg1.Subject    = "Synced PWTDATA & MACHINES DATA"
        msg1.TextPart   = message
        msg1.HTMLPart   = `<p>${message}</p>`

        msg2.To[0].Email = email2
        msg2.To[0].Name  = email_name2
        msg2.Subject    = "Synced PWTDATA & MACHINES DATA"
        msg2.TextPart   = message
        msg2.HTMLPart   = `<p>${message}</p>`

        await Emailing.Send([msg1, msg2])

        res.status( 200 ).send(JSON.stringify(r))
    } 

    else {

        const msg1 = JSON.parse(JSON.stringify(emailmsg))
        const msg2 = JSON.parse(JSON.stringify(emailmsg))

        const message_prefix = `
        --- NOT SYNCED -- 
        Store Name: ${body.clientName} -- Chip ID: ${body.chipID} 
        `
        const message = message_prefix + r.message

        msg1.To[0].Email = email1
        msg1.To[0].Name  = email_name1
        msg1.Subject    = "PWTDATA & MACHINES DATA -- NOT SYNCED --"
        msg1.TextPart   = message
        msg1.HTMLPart   = `<p>${message}</p>`

        msg2.To[0].Email = email2
        msg2.To[0].Name  = email_name2
        msg2.Subject    = "PWTDATA & MACHINES DATA -- NOT SYNCED --"
        msg2.TextPart   = message
        msg2.HTMLPart   = `<p>${message}</p>`

        await Emailing.Send([msg1, msg2])

        res.status( 400 ).send(JSON.stringify(r))
    }
}




async function pwtdata_interface_clients_meters(req:any, res:any) {

    //if (! await SERVER_MAINS.validate_request(res, req)) return 

    const client_ids = req.query.client_ids as str
    const timerange  = req.query.timerange as str

    const r = await Interface.ClientsMeters(SERVER_MAINS.db, SERVER_MAINS.influxdb, client_ids, timerange)

    if (r.message) {
        res.status(400).send(JSON.stringify(r))
    } 

    else {
        res.status(200).send(JSON.stringify(r))
    }
}
*/ // ADMIN ROUTES
async function admin_particle_chipsinfo(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const results_message = await Admin_Particle.Chips_Info();
    res.status(200).send({
        message: results_message
    });
}
async function admin_particle_data_usage(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const results_message = await Admin_Particle.Data_Usage();
    res.status(200).send({
        message: results_message
    });
}
async function admin_reconcile_between_particle_and_machines(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const results_message = await Admin_Reconcile.Between_Particle_And_Machines(SERVER_MAINS.db);
    res.status(200).send({
        message: results_message
    });
}
async function admin_status_resend_counts(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const results_message = await Admin_GenReports.Status_Resend_Counts(SERVER_MAINS.db);
    res.status(200).send({
        message: results_message
    });
}
async function admin_cell_locations(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const r = await Location.Get_All_Cell_Locations(SERVER_MAINS.db);
    if (!r) {
        res.status(204).send(null);
        return;
    }
    res.status(200).send({
        ok: true
    });
}
async function admin_firestore_misc_update(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const results_str = await Admin_Firestore.Misc_Update(SERVER_MAINS.db);
    res.status(200).send({
        message: results_str
    });
}
async function admin_firestore_misc_get(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const results_str = await Admin_Firestore.Misc_Get(SERVER_MAINS.db);
    res.status(200).send({
        message: results_str
    });
}
async function admin_firestore_misc_add(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const results_str = await Admin_Firestore.Misc_Add(SERVER_MAINS.db);
    res.status(200).send({
        message: results_str
    });
}
async function admin_influxdb_misc_add(req, res) {
    if (!await SERVER_MAINS.validate_request(res, req)) return;
    const results_str = await Admin_InfluxDB.Misc_Add();
    res.status(200).send({
        message: results_str
    });
}
async function admin_test_sse(req, res) {
    const trigger = Number(req.query.trigger);
    const path = req.query.path;
    if (trigger === 2) {
        const split = path.split('/');
        const docid = split[1];
        const data = await amachinechange(docid, false);
        SERVER_MAINS.sse.TriggerEvent(2, {
            path: "machines/" + docid,
            data
        });
    } else if (trigger === 4) {
        await amachinechange("Nyb5qBMg6SYp7Jbb2n4f", true);
        await amachinechange("bzblQfm7lHvvLv1VbyyX", true);
        SERVER_MAINS.sse.TriggerEvent(trigger, {
            paths: [
                'machines'
            ]
        });
    }
    res.status(200).send({
        message: "ok"
    });
    function amachinechange(docid, commitchange = false) {
        return new Promise((resolve, _reject)=>{
            const ts = Math.floor(Date.now() / 1000);
            SERVER_MAINS.db.collection("machines").doc(docid).onSnapshot(async (doc)=>{
                const data = doc.data();
                const rannumber = Math.floor(Math.random() * 40);
                const brandsplit = data.store.brand.split('_');
                data.store.brand = brandsplit[0] + '_' + rannumber;
                data.ts = ts;
                data.id = docid;
                if (commitchange) {
                    await SERVER_MAINS.db.collection("machines").doc(docid).set(data);
                }
                resolve(data);
            });
        });
    }
}
async function admin_test_pushnotifications(_req, res) {
    try {
        await SERVER_MAINS.push_subscriptions.Send_Msg(SERVER_MAINS.db, "Test", "Test String", [
            "errors"
        ]);
    } catch  {
        res.status(400).send();
        return;
    }
    res.status(200).send();
}
async function admin_test_email(req, res) {
    const title = req.query.title;
    const body = req.query.body;
    const tags = req.query.tags.split(',');
    SERVER_MAINS.emailing.SendNotification(SERVER_MAINS.db, title, body, tags);
    res.status(200).send({
        message: "ok"
    });
}
/*
 *
 
    const csvdata_str = await Reports_Meters.Month(db, 2023, 11)

    res.setHeader('Appversion', APPVERSION);
    res.status(200).send(csvdata_str)


    app.get('/api/getstatusstats', (_req:any, res:any) => {
    
        Stats_Get_All_MachineStatusStats(db )
            .then((statusstats:any)=> {
                res.setHeader('Appversion', APPVERSION);
                res.status(200).send(JSON.stringify(statusstats))
            })
            .catch((er:any)=> {
                res.status(400).send(er)
            })
    })
*/ /*
  app.get('/api/reconcile', (_req:any, res:any) => {

    Reconcile(db, secrets_client)
      .then(results=> {
        res.setHeader('Appversion', APPVERSION);
        res.status(200).send(JSON.stringify(results))
      })
      .catch(er=> {
        res.status(400).send(er)
      })

  })
*/ /*
    app.get('/api/data_usage/:particle_account', (req:any, res:any) => {

        Particle_Data_Usage_All_Product_Chips(db, req.params.particle_account, secrets_client)

            .then(results=> {
                res.setHeader('Appversion', APPVERSION);
                res.status(200).send(JSON.stringify(results))
            })

            .catch(er=> {
                res.status(400).send(er)
            })

    })
*/ /*
    app.get('/api/location_match', (req:any, res:any) => {

        Location_Match(db)

            .then(results=> {
                res.setHeader('Appversion', APPVERSION);
                res.status(200).send(JSON.stringify(results))
            })

            .catch(er=> {
                res.status(400).send(er)
            })

    })
*/ /*
  app.get('/api/admin_particle_rename', (_req:any, res:any) => {

    Admin_Particle_Rename_Devices_To_Match_Machine_Chip(db, "accounts_risingtiger_com", secrets_client)
      .then(results=> {
        res.setHeader('Appversion', APPVERSION);
        res.status(200).send(JSON.stringify(results))
      })
      .catch(er=> {
        res.status(400).send(er)
      })

  })
*/ /*
  app.get('/api/misc_quicky', (_req:any, res:any) => {

    Misc_Quicky_Show_Prop_Of_All_Machines(db, secrets_client)
      .then(results=> {
        res.setHeader('Appversion', APPVERSION);
        res.status(200).send(JSON.stringify(results))
      })
      .catch(er=> {
        res.status(400).send(er)
      })

  })
*/ // Admin APIs
/*
    app.get('/api/admin/pwtdata/getmachines_for_sync', (_req:any, res:any) => {
        AdminPWTDataGetMachinesForSync(res, db);   
    })
*/ /*
    app.post('/api/admin/pwtdata/sync', (_req:any, res:any) => {   
        AdminPWTDataSync(res, db);  
    })
*/ const INSTANCEID = "pwt";
const PROJECTID = "purewatertech";
const KEYJSONFILE = "/Users/dave/.ssh/purewatertech-ad1adb2947b8.json";
const SHEETS_KEYJSONFILE = "/Users/dave/.ssh/purewatertech_sheets_a65a5ee58ee0.json";
const IDENTITY_PLATFORM_API = "AIzaSyCdBd4FDBCZbL03_M4k2mLPaIdkUo32giI";
export default {
    INSTANCEID,
    PROJECTID,
    KEYJSONFILE,
    IDENTITY_PLATFORM_API,
    SHEETS_KEYJSONFILE,
    Set_Server_Mains,
    Set_Routes
};
