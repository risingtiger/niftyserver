

import { str, ServerInstanceT, ServerMainsT } from "./defs.js"
import fs from "fs";

import express from "express";

import bodyParser from 'body-parser'
import cors from "cors";

import pg from 'pg'

import { initializeApp, cert }  from "firebase-admin/app";
import { getFirestore }  from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { google as googleapis } from "googleapis";


import { Firestore } from "./firestore.js"
import { InfluxDB } from "./influxdb.js"
import SSE from "./sse.js"
import Push_Subscriptions from "./push_subscriptions.js"
import FileRequest from "./filerequest.js"
import View from "./view.js"
import SelfExtractingBundle from "./self_extracting_bundle.js"
import Logger from "./logger.js"
import Emailing from "./emailing.js"
import Utils from "./utils.js"
import Ai from "./ai.js"


declare var INSTANCE:ServerInstanceT // for LSP only


//BASING PATHS OFF OF VAR_NODE_ENV done fucked a lot. fixer


const { Pool } = pg
const pgpool = new Pool();


//{--index_instance.js--} 

const VAR_NODE_ENV        = process.env.NODE_ENV || 'dev';

const STATIC_DIR = VAR_NODE_ENV === "dev" ? "static_dev/" : "static_dist/"
const APPVERSION=0; 
const IS_PROD = VAR_NODE_ENV === "dev" ? false : true


const VAR_PORT            = process.env["NIFTY_INSTANCE_"+INSTANCE.INSTANCEID.toUpperCase()+"_PORT"] || process.env.PORT || "8080";
const VAR_OFFLINEDATE_DIR = VAR_NODE_ENV === "dev" && process.env.NIFTY_OFFLINEDATA_DIR

let   _json_configs = {}

const app = express()

let db:any = null;
let storage:any = null;

let sheets:any = {};




app.use(bodyParser.json())





app.get(['/','/index.html'], (req:any, res:any) => {
    req.params.restofpath = ["home"]
    serveview(req, res)
})


app.get("/apple-touch-icon.png", (_req:any, res:any) => {
	res.sendFile(process.cwd() + "/" +  STATIC_DIR + '/media/pwticons/apple-touch-icon.png')
})
app.get("/apple-touch-icon-precomposed.png", (_req:any, res:any) => {
	res.sendFile(process.cwd() + "/" +  STATIC_DIR + '/media/pwticons/apple-touch-icon-precomposed.png')
})

app.get([
    '/app.webmanifest', 
    '/assets/*file',
    '/sw.js',
	'/shared_worker.js',
], assets_general)





app.post('/api/refresh_auth', refresh_auth)

app.get('/api/testdata', testdata)
app.get('/api/ping', ping)
app.post('/api/firestore_retrieve', firestore_retrieve)
app.post('/api/firestore_add', firestore_add)
app.post('/api/firestore_patch', firestore_patch)
app.post('/api/firestore_delete', firestore_delete)
app.post('/api/firestore_get_batch', firestore_get_batch)



app.post('/api/influxdb_retrieve_series', influxdb_retrieve_series)

app.post('/api/influxdb_retrieve_points', influxdb_retrieve_points)

app.post('/api/influxdb_retrieve_medians', influxdb_retrieve_medians)



app.options("/sse_add_listener", cors());
app.get("/sse_add_listener",     cors(), sse_add_listener)




app.post("/api/logger/save", express.text(), logger_save)
app.get("/api/logger/get",   logger_get)



app.get("/api/push_subscriptions/add",    push_subscriptions_add)
app.get("/api/push_subscriptions/remove", push_subscriptions_remove)





app.get('/v/*restofpath', serveview)




async function assets_general(req:any, res:any) {
	const fileurl = req.url
	const nocache = !req.url.includes("shared_worker.js")
    FileRequest.runit(fileurl, res, STATIC_DIR, IS_PROD, nocache);
}





async function refresh_auth(req:any, res:any) {

    const url = `https://securetoken.googleapis.com/v1/token?key=${INSTANCE.IDENTITY_PLATFORM_API}`
     
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=refresh_token&refresh_token=${req.body.refresh_token}`
    })
    .then(async (result:any) => {
        const data = await result.json()
        res.status(200).send(JSON.stringify(data))
    })
    .catch((err:any) => {
		res.statusMessage = "unable to refresh auth: " + err;
        res.status(401).send()
    })
}




async function firestore_retrieve(req:any, res:any) {

    if (! await validate_request(res, req)) return 

    const r = await Firestore.Retrieve(db, req.body.paths, req.body.opts)
	if (r === null) { res.statusMessage = "unable to retrieve firestore"; res.status(400).send(); return; }

    const jsoned = JSON.stringify(r)
    await Utils.Compress.Send(jsoned, res)
}




async function firestore_add(req:any, res:any) {

    if (! await validate_request(res, req)) return 

    const sse_id       = req.headers['sse_id'] || null
	const suppress_sse = req.body.suppress_sse || false
	const exclude      = suppress_sse ? [sse_id] : [ ]

    const r = await Firestore.Add(db, req.body.path, req.body.data)
	if (r === null) { res.status(400).send(JSON.stringify({ code: 0, error: "unable to add firestore" })); return; }

    SSE.TriggerEvent("datasync_doc_add", { path: req.body.path, data:req.body.data }, { exclude });

	res.status(200).send(JSON.stringify({ code: 1 }))
}




async function firestore_patch(req:any, res:any) {

    if (! await validate_request(res, req)) return 

	const sse_id       = req.headers['sse_id'] || null
	const path         = req.body.path
	const oldts        = req.body.oldts
	const newdata      = req.body.newdata
	const suppress_sse = req.body.suppress_sse || false
	const exclude      = suppress_sse ? [sse_id] : []

    const r = await Firestore.Patch(db, path, oldts, newdata)
	res.status(200).send(JSON.stringify(r))

	if (r.code === 1) {
		SSE.TriggerEvent("datasync_doc_patch", { path, data: newdata }, { exclude });
	}
}




async function firestore_delete(req:any, res:any) {

    if (! await validate_request(res, req)) return 

	const sse_id       = req.headers['sse_id'] || null
	const suppress_sse = req.body.suppress_sse || false
	const exclude      = suppress_sse ? [sse_id] : []

    const r = await Firestore.Delete(db, req.body.path, req.body.oldts, req.body.ts)
	res.status(200).send(JSON.stringify(r))

	if (r.code === 1) {
		SSE.TriggerEvent("datasync_doc_delete", { path:req.body.path }, { exclude });
	}
}




async function firestore_get_batch(req:any, res:any) {

    if (! await validate_request(res, req)) return 

    const r = await Firestore.GetBatch(db, req.body.paths, req.body.tses, req.body.runid)
	if (!r) {  res.statusMessage = "unable to get batch"; res.status(400).send(); return }

    const jsoned = JSON.stringify(r)
    await Utils.Compress.Send(jsoned, res)
}




async function influxdb_retrieve_series(req:any, res:any) {

    if (! await validate_request(res, req)) return 

    const rb = req.body

    const results = await InfluxDB.Retrieve_Series(rb.bucket, rb.begins, rb.ends, rb.msrs, rb.fields, rb.tags, rb.intrv)
	if (!results) { res.status(400).send(); return; }

    const jsoned = JSON.stringify(results)
    await Utils.Compress.Send(jsoned, res)
}




async function influxdb_retrieve_points(req:any, res:any) {

    if (! await validate_request(res, req)) return 

    const rb = req.body

    const results = await InfluxDB.Retrieve_Points(rb.bucket, rb.begins, rb.ends, rb.msrs, rb.fields, rb.tags)
	if (!results) { res.status(400).send(); return; }

    const jsoned = JSON.stringify(results)
    await Utils.Compress.Send(jsoned, res)
}




async function influxdb_retrieve_medians(req:any, res:any) {

    if (! await validate_request(res, req)) return 

    const rb = req.body

    const results = await InfluxDB.Retrieve_Medians(rb.bucket, rb.begins, rb.ends, rb.dur_amounts, rb.dur_units, rb.msrs, rb.fields, rb.tags, rb.aggregate_fn)
	if (!results) { res.status(400).send(); return; }

    const jsoned = JSON.stringify(results)
    await Utils.Compress.Send(jsoned, res)
}




async function sse_add_listener(req:any, res:any) {

    SSE.Add_Listener(req, res)
}




async function logger_save(req:any, res:any) {

	await Logger.Save(db, req.body)

	res.status(200).send()
}




async function logger_get(req:any, res:any) {

    if (! await validate_request(res, req)) return 

	const r = await Logger.Get(db, req.query.user_email)
	if (!r) { res.status(400).send(); return; }

	res.setHeader('Content-Type', 'text/csv');
	res.status(200).send(r)
}




async function push_subscriptions_add(req:any, res:any) {

    if (! await validate_request(res, req)) return 

    const user_email:str = req.query.user_email as string
    const fcm_token:str = req.query.fcm_token as string

    const r = await Push_Subscriptions.Add_Subscription(db, fcm_token, user_email)
	if (!r) { res.status(400).send(); return; }

    res.status(200).send(JSON.stringify({message:"saved"}))
}




async function push_subscriptions_remove(req:any, res:any) {

    if (! await validate_request(res, req)) return 

    const user_email:str = req.query.user_email as string

    const r = await Push_Subscriptions.Remove_Subscription(db, user_email)
	if (!r) { res.status(400).send(); return; }

    res.status(200).send(JSON.stringify({message:"saved"}))
}




async function testdata(_req:any, res:any) {
	const testdata = [{id:1, name:"Alice" }, {id:2, name:"Bob" }, {id:3, name:"Charlie" }, {id:4, name:"Diana" }, {id:5, name:"Ethan" }, {id:6, name:"Fiona" }, {id:7, name:"George" }, {id:8, name:"Hannah" }, {id:9, name:"Ian" }, {id:10, name:"Julia" }]
    res.status(200).send(JSON.stringify(testdata))
}




async function ping(_req:any, res:any) {
    res.status(200).send()
}




async function serveview(req:any, res:any) {

	let rstr:str = ""

	res.set('Content-Type', 'text/html; charset=UTF-8');
	res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')

	const restofpath = req.params.restofpath ? req.params.restofpath : "home"
	const path_str = restofpath.join("/")

	const self_extract = req.query.self_extract === 'true'

	if (self_extract && IS_PROD) { // self_extract is not actually used yet
		try {
			const { returnstr, viewname } = await SelfExtractingBundle.Handle(path_str, STATIC_DIR, _json_configs)
			rstr = returnstr
			res.set('View-Name', viewname)
		} catch (e) {
			rstr = "Could not load self-extracting bundle for view: " + path_str
			res.status(400).send(rstr)
			return
		}
	} else {
		try {
			const { returnstr, viewname } = await View.HandlePath(path_str, STATIC_DIR, _json_configs, IS_PROD)
			rstr = returnstr
			res.set('View-Name', viewname)
		} catch {
			rstr = "Could not load view: " + path_str
			res.status(400).send(rstr)
			return
		}
	}

	await Utils.Compress.Send(rstr, res)
}




// END ROUTES












async function init() { return new Promise(async (res, _rej)=> {

	const jsonconfigcontents = fs.readFileSync(process.cwd() + "/" + STATIC_DIR + "/main.json", 'utf8')
	_json_configs = JSON.parse(jsonconfigcontents)

	parse_json_configs(_json_configs)

    if ( (VAR_NODE_ENV === "dev" || VAR_NODE_ENV === "dist") && !VAR_OFFLINEDATE_DIR)  {

		/*
		const googleauth = new googleapis.auth.GoogleAuth({
			//keyFile: INSTANCE.SHEETS_KEYJSONFILE,
			keyFile: '/Users/dave/.ssh/xenfinancesheets_key.json',
			scopes: ['https://www.googleapis.com/auth/spreadsheets'],
		})
		let google_auth:any = await googleauth.getClient();
		sheets = googleapis.sheets({version: 'v4', auth: google_auth});
		*/

		const googleauth = new googleapis.auth.GoogleAuth({
			keyFile: INSTANCE.KEYJSONFILE,
			scopes: ['https://www.googleapis.com/auth/spreadsheets'],
		})
		let google_auth:any = await googleauth.getClient();
		sheets = googleapis.sheets({version: 'v4', auth: google_auth});

		initializeApp({   credential: cert(INSTANCE.KEYJSONFILE)   })
    } 

    else if (VAR_NODE_ENV === 'gcloud') { 

        const googleauth = new googleapis.auth.GoogleAuth({
            //keyFile: INSTANCE.SHEETS_KEYJSONFILE, // Using instance config for consistency
            // keyFile: process.cwd() + '/sheets_key.json', // Original path
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })
        let google_auth:any = await googleauth.getClient();
        sheets = googleapis.sheets({version: 'v4', auth: google_auth});

        initializeApp()

    } else {
		//
	}

	db      = getFirestore();
	storage = getStorage();

    res(1)
})}


async function startit() {

    if (VAR_NODE_ENV === 'gcloud') {

        app.listen( Number(VAR_PORT), () => {
            console.info(`HTTPS App listening on port ${(VAR_PORT)}`);
        })
    }

	else {

		const port_num = VAR_NODE_ENV === "dev" ? Number(VAR_PORT) : Number(VAR_PORT)+1

		app.listen( port_num, () => {
			console.info(`APPVERSION: ${APPVERSION}. PORT: ${(port_num)}`);
		})
    } 

}



async function validate_request(res:any, req:any, whitelistemails:string[]|null = null):Promise<boolean|object> {

	const appversion = Number(req.headers["versionofapp"])

	if (APPVERSION === 0 && VAR_NODE_ENV === "dev") return true

	if (appversion !== APPVERSION) {
		res.set('updaterequired', 'true')
		res.status(410).send()
		return false
	}

	const authHeader = req.headers.authorization
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		res.status(401).send()
		return false
	}

	const id_token = authHeader.substring(7)
	let decodedToken:object

	try {
		decodedToken = await getAuth().verifyIdToken(id_token)
	} catch {
		res.status(401).send()
		return false
	}

	if (whitelistemails && whitelistemails.length > 0) {
		const token_email = "email" in decodedToken && typeof decodedToken.email === "string" ? decodedToken.email.toLowerCase() : ""
		const whitelist = whitelistemails.map((email) => email.toLowerCase())

		if (!token_email || !whitelist.includes(token_email)) {
			res.status(403).send()
			return false
		}
	}

	return decodedToken
}




async function bootstrapit() {

    await init()

	let servermains:ServerMainsT = {
		app, 
		db, 
		storage,
		pg:pgpool,
		ai:Ai,
		appversion:APPVERSION, 
		sheets, 
		push_subscriptions:Push_Subscriptions, 
		firestore:Firestore, 
		influxdb:InfluxDB, 
		emailing:Emailing,
		sse:SSE,
		utils:Utils,
		validate_request,
	}

    INSTANCE.Set_Server_Mains(servermains)
    INSTANCE.Set_Routes()

    startit()
}




function parse_json_configs(json_configs:any) {
    
    [...json_configs.MAIN.LAZYLOADS, ...json_configs.INSTANCE.LAZYLOADS].forEach((lazyload:any) => {
        if (!lazyload.urlmatch) return;

        let regex_pattern = lazyload.urlmatch;

        regex_pattern = regex_pattern.replace(/\/:[a-z0-9A-Z_]+/g, (_match:str) => {
            return '/[a-zA-Z0-9_]+';
        });

        lazyload.urlmatch_regex = new RegExp(regex_pattern);
    });
}




//@ts-ignore
(process.openStdin()).addListener("data", async (a:any) => {

	if (VAR_NODE_ENV !== "dev") return;


	let data = (Buffer.from(a, 'base64').toString()).trim();

	if (data == "start") {
		bootstrapit()
	}
})




process.on('SIGTERM', async () => {
    if (pgpool) {
		await pgpool.end()
    }
});



bootstrapit()


export default app



