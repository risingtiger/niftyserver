// --THE FOLLOWING GET BUNDLED INTO THE MAIN BUNDLE
import { Init as SwitchStationInit } from './alwaysload/switchstation.js';
import './thirdparty/lit-html.js';
import './alwaysload/fetchlassie.js';
import { Init as LocalDBSyncInit } from './alwaysload/localdbsync.js';
import './alwaysload/influxdb.js';
//import { Init as LazyLoadFilesInit } from './alwaysload/lazyload_files.js';
import { Init as SSEInit, Close as SSEClose } from './alwaysload/sse.js';
import { Init as LoggerInit } from './alwaysload/logger.js';
import { Init as EngagementListenInit } from './alwaysload/engagementlisten.js';
import { Init as CMechInit } from './alwaysload/cmech.js';
import { Init as IDBInit } from './alwaysload/indexeddb.js';
import './alwaysload/utils.js';
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
 const SETTINGS={ "MAIN": {
  "INFO": {
    "localdb_objectstores": [
      {"name": "localdbsync_pending_sync_operations"},
      {"name": "pending_logs"}
    ]
  },
  "LAZYLOADS": [
	  {
		"type": "view",
		"urlmatch": "^appmsgs$",
		"name": "appmsgs",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "view",
		"urlmatch": "^login$",
		"name": "login",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "view",
		"urlmatch": "^setup_push_allowance$",
		"name": "setup_push_allowance",
		"is_instance": false,
		"dependencies": [
		  { "type": "component", "name": "ol" },
		  { "type": "component", "name": "btn" }
		],
		"auth": ["admin", "store_manager", "scanner"]
	  },
	  {
		"type": "component",
		"name": "graphing",
		"is_instance": false,
		"dependencies": [{ "type": "thirdparty", "name": "chartist" }],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "ol2",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "ol",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "pol",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "tl",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "reveal",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "dselect",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "in",
		"is_instance": false,
		"dependencies": [
		  { "type": "component", "name": "dselect" },
		  { "type": "component", "name": "animeffect" }
		],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "in2",
		"is_instance": false,
		"dependencies": [
		  { "type": "component", "name": "dselect" },
		  { "type": "component", "name": "animeffect" }
		],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "animeffect",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "toast",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "component",
		"name": "btn",
		"is_instance": false,
		"dependencies": [
		  { "type": "component", "name": "animeffect" }
		],
		"auth": []
	  },
	  {
		"type": "thirdparty",
		"name": "chartist",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  },
	  {
		"type": "lib",
		"name": "testlib",
		"is_instance": false,
		"dependencies": [],
		"auth": []
	  }
	]
}
, "INSTANCE": {
  "INFO": {
    "name": "INSTANCE_NAME",
	"shortname": "pwt",
    "firebase": {
      "project": "purewatertech",
      "identity_platform_key": "AIzaSyCdBd4FDBCZbL03_M4k2mLPaIdkUo32giI",
      "dbversion": 14
    },
    "localdb_objectstores": [
      {"name": "machines"}
    ]
  },
  "LAZYLOADS": [
    {
      "type": "view",
      "urlmatch": "home",
      "name": "home",
      "is_instance": true,
      "dependencies": [
        {"type": "component", "name": "in2"},
        {"type": "component", "name": "btn"},
        {"type": "component", "name": "toast"}
      ],
      "auth": []
    },
    {
      "type": "view",
      "urlmatch": "^machines$",
      "name": "machines",
      "is_instance": true,
      "dependencies": [
        {"type": "component", "name": "ol"},
        {"type": "component", "name": "ol2"},
        {"type": "component", "name": "pol"},
        {"type": "component", "name": "in"},
        {"type": "component", "name": "dselect"},
        {"type": "component", "name": "btn"},
        {"type": "component", "name": "toast"},
        {"type": "component", "name": "metersreport"},
        {"type": "component", "name": "machinedetails"},
        {"type": "component", "name": "machinemap"}
      ],
      "auth": ["user", "admin", "store_manager", "scanner"],
      "localdb_preload": ["machines"]
    },
    {
      "type": "view",
      "urlmatch": "^machines/:id$",
      "name": "machine",
      "is_instance": true,
      "dependencies": [
        {"type": "component", "name": "ol"},
        {"type": "component", "name": "reveal"},
        {"type": "component", "name": "in"},
        {"type": "component", "name": "dselect"},
        {"type": "component", "name": "btn"},
        {"type": "component", "name": "toast"},
        {"type": "component", "name": "metersreport"},
        {"type": "component", "name": "machinedetails"},
        {"type": "component", "name": "machinemap"}
      ],
      "auth": ["user", "admin", "store_manager", "scanner"],
      "localdb_preload": ["machines"]
    },
    {
      "type": "view",
      "urlmatch": "^machines/:id/telemetry$",
      "name": "machinetelemetry",
      "is_instance": true,
      "dependencies": [
        {"type": "component", "name": "graphing"},
        {"type": "component", "name": "ol"},
        {"type": "component", "name": "toast"}
      ],
      "auth": ["user", "admin", "store_manager", "scanner"],
      "localdb_preload": ["machines"]
    },
    {
      "type": "view",
      "urlmatch": "^notifications$",
      "name": "notifications",
      "is_instance": true,
      "dependencies": [
        {"type": "component", "name": "ol"},
        {"type": "component", "name": "btn"},
        {"type": "component", "name": "in"},
        {"type": "component", "name": "reveal"},
        {"type": "component", "name": "toast"}
      ],
      "auth": ["user", "admin", "store_manager", "scanner"]
    },
    {
      "type": "view",
      "urlmatch": "tradeup",
      "name": "tradeup",
      "is_instance": true,
      "dependencies": [
        {"type": "thirdparty", "name": "chartist"},
        {"type": "component", "name": "btn"},
        {"type": "component", "name": "toast"}
      ],
      "auth": ["admin"]
    },
    {
      "type": "component",
      "name": "metersreport",
      "is_instance": true,
      "dependencies": [
        {"type": "component", "name": "dselect"},
        {"type": "component", "name": "btn"},
        {"type": "component", "name": "in"},
        {"type": "component", "name": "toast"}
      ],
      "auth": []
    },
    {
      "type": "component",
      "name": "machinedetails",
      "is_instance": true,
      "dependencies": [
        {"type": "component", "name": "btn"},
        {"type": "component", "name": "toast"}
      ],
      "auth": []
    },
    {
      "type": "component",
      "name": "machinemap",
      "is_instance": true,
      "dependencies": [
        {"type": "component", "name": "btn"},
        {"type": "component", "name": "toast"}
      ],
      "auth": []
    }
  ]
}
 };
let _serviceworker_reg;
//let _shared_worker: SharedWorker|null = null;
//let _worker_port: MessagePort|null = null;
const LAZYLOAD_DATA_FUNCS = {
    appmsgs_indexeddb: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        }),
    appmsgs_other: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        }),
    login_indexeddb: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        }),
    login_other: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        }),
    setup_push_allowance_indexeddb: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        }),
    setup_push_allowance_other: (_pathparams, _old_searchparams, _new_searchparams)=>new Promise(async (res, _rej)=>{
            res(new Map());
        })
};
window.addEventListener("load", async (_e)=>{
    // for testing purposes, 
    /*
	if (window.location.href.includes("localhost")) {
		const test_div = document.createElement("div");
		test_div.id = "local_testing_purposes";
		
		const test_button = document.createElement("button");
		test_button.textContent = "Check Latest";
		
		test_button.addEventListener("click", () => {
			LocalDBSyncRunCheckLatest();
		});
		
		const test_button_wipe = document.createElement("button");
		test_button_wipe.textContent = "Wipe Local";
		
		test_button_wipe.addEventListener("click", () => {
			LocalDBSyncRunWipeLocal();
		});
		
		test_div.appendChild(test_button);
		test_div.appendChild(test_button_wipe);
		document.body.appendChild(test_div);
	}
	*/ const performance_timer = performance.now();
    const lazyload_data_funcs = {
        ...LAZYLOAD_DATA_FUNCS,
        ...INSTANCE_LAZYLOAD_DATA_FUNCS
    };
    const lazyloads = [
        ...SETTINGS.MAIN.LAZYLOADS,
        ...SETTINGS.INSTANCE.LAZYLOADS
    ];
    const all_localdb_objectstores = [
        ...SETTINGS.INSTANCE.INFO.localdb_objectstores,
        ...SETTINGS.MAIN.INFO.localdb_objectstores
    ];
    {
        IDBInit(all_localdb_objectstores, SETTINGS.INSTANCE.INFO.firebase.project, SETTINGS.INSTANCE.INFO.firebase.dbversion);
        EngagementListenInit();
        LocalDBSyncInit(SETTINGS.INSTANCE.INFO.localdb_objectstores, SETTINGS.INSTANCE.INFO.firebase.project, SETTINGS.INSTANCE.INFO.firebase.dbversion);
        CMechInit(lazyload_data_funcs);
        LoggerInit();
    }
    localStorage.setItem("identity_platform_key", SETTINGS.INSTANCE.INFO.firebase.identity_platform_key);
    const lazyload_view_urlpatterns = SwitchStationInit(lazyloads);
    const performance_timer_b = performance.now() - performance_timer;
    console.log(`App loaded in ${performance_timer_b.toFixed(2)} ms`);
    if (window.APPVERSION > 0) await setup_service_worker(lazyload_view_urlpatterns);
    //init_shared_worker()
    setTimeout(()=>SSEInit(), 1800);
//await new Promise<void>((res)=> setTimeout(()=>{ res() }, 500)); 
});
document.querySelector("#views").addEventListener("visibled", ()=>{});
let toast_id_counter = 0;
function ToastShow(msg, level, _duration) {
    const toast_id = `maintoast-${toast_id_counter}`;
    const toast_el = document.createElement('c-toast'); // Cast to any for custom element properties
    toast_el.id = toast_id;
    toast_el.setAttribute("msg", msg || "");
    toast_el.setAttribute("level", level?.toString() || '0');
    toast_el.setAttribute("duration", '2147483647');
    document.body.append(toast_el);
    toast_el.setAttribute("action", "run");
    toast_el.addEventListener("click", ()=>{
        if (toast_el.parentElement) {
            toast_el.remove();
        }
    });
    toast_el.addEventListener("done", ()=>{
        if (toast_el.parentElement) {
            toast_el.remove();
        }
    });
    setTimeout(()=>{
        const toast_els = document.querySelectorAll("c-toast");
        let bottom_position = 20;
        for (const el of toast_els){
            el.style.bottom = `${bottom_position}px`;
            bottom_position += 60;
        }
    }, 10);
}
$N.ToastShow = ToastShow;
/*
function init_shared_worker() {
	_shared_worker = new SharedWorker('/shared_worker.js');
	_worker_port = _shared_worker.port;
	
	_worker_port.removeEventListener('message', handle_shared_worker_message); // Remove any previous listeners to avoid duplicates
	_worker_port.addEventListener('message', handle_shared_worker_message);
	_worker_port.start();
}
function handle_shared_worker_message(e: MessageEvent) {

	if (e.data.action === 'WORKER_CONNECTED') {
		console.log("Shared Worker connected");
	
	} else if (e.data.action === 'SSE_EVENT' || 
		e.data.action === 'SSE_CONNECTION_STATUS' || 
		e.data.action === 'SSE_CONNECTED' || 
		e.data.action === 'SSE_ERROR') {
		
		// Forward SSE messages to the SSE module
		if ($N.SSEvents && $N.SSEvents.HandleMessage) {
			$N.SSEvents.HandleMessage(e.data);
		}
	}
}
$N.GetSharedWorkerPort = ()=>_worker_port!;
*/ async function Unrecoverable(subj, msg, btnmsg, logsubj, logerrmsg, redirectionurl) {
    const redirect = redirectionurl || `/v/appmsgs?logsubj=${logsubj}`;
    setalertbox(subj, msg, btnmsg, redirect);
    $N.Logger.Log(40, logsubj, logerrmsg || "");
}
$N.Unrecoverable = Unrecoverable;
function setalertbox(subj, msg, btnmsg, redirect, clickHandler) {
    const modal = document.getElementById('alert_notice');
    if (!modal) return; // Guard clause if modal isn't found
    modal.classList.add('active');
    const titleEl = document.getElementById('alert_notice_title');
    const msgEl = document.getElementById('alert_notice_msg');
    const btnReset = document.getElementById('alert_notice_btn');
    if (titleEl) titleEl.textContent = subj;
    if (msgEl) msgEl.textContent = msg;
    if (btnReset) {
        btnReset.textContent = btnmsg;
        // To prevent multiple listeners if setalertbox is called multiple times for the same button,
        // replace the button with a clone of itself. This removes all old event listeners.
        const newBtnReset = btnReset.cloneNode(true);
        btnReset.parentNode?.replaceChild(newBtnReset, btnReset); // Use parentNode for safety
        newBtnReset.addEventListener('click', ()=>{
            if (clickHandler) {
                clickHandler();
            } else {
                window.location.href = redirect;
            }
        });
    }
}
const setup_service_worker = (lazyload_view_urlpatterns)=>new Promise((resolve, _reject)=>{
        // Check if very first time loading the service worker, so we can skip the controllerchange event
        let hasPreviousController = navigator.serviceWorker.controller ? true : false;
        navigator.serviceWorker.register('/sw.js').then((registration)=>{
            _serviceworker_reg = registration;
            navigator.serviceWorker.ready.then(()=>{
                registration.active?.postMessage({
                    action: "initial_data_pass",
                    id_token: localStorage.getItem("id_token"),
                    token_expires_at: localStorage.getItem("token_expires_at"),
                    refresh_token: localStorage.getItem("refresh_token"),
                    user_email: localStorage.getItem("user_email"),
                    lazyload_view_urlpatterns
                });
                resolve();
            });
            navigator.serviceWorker.addEventListener('message', (event)=>{
                if (event.data.action === 'update_auth_info') {
                    localStorage.setItem("id_token", event.data.id_token);
                    localStorage.setItem("token_expires_at", event.data.token_expires_at.toString());
                    localStorage.setItem("refresh_token", event.data.refresh_token);
                } else if (event.data.action === 'update_init') {
                    SSEClose();
                    setTimeout(()=>{
                        if (_serviceworker_reg) _serviceworker_reg?.update();
                    }, 300);
                } else if (event.data.action === 'error_out') {
                    if (event.data.subject === "sw4") {
                        Unrecoverable("Not Authenticated", "Please Login", "Login", "sw4", event.data.errmsg, "/v/login");
                    } else {
                        Unrecoverable("App Error", event.data.errmsg, "Restart App", event.data.subject, event.data.errmsg, null);
                    }
                }
            /*
			else if (event.data.action === 'logit') {
				// can add this back in to logger if needed
			}
			*/ });
            navigator.serviceWorker.addEventListener('controllerchange', onNewServiceWorkerControllerChange);
            navigator.serviceWorker.addEventListener('updatefound', (_e)=>{
                SSEClose();
            });
            function onNewServiceWorkerControllerChange() {
                // This event is fired when the service worker controller changes. skip on very first load
                if (!hasPreviousController) {
                    hasPreviousController = true;
                    return;
                }
                const redirect = `/v/appmsgs?appupdate=done`;
                window.location.href = redirect;
            //setalertbox("App Update", "app has been updated. needs restarted", "Restart App", redirect);
            }
        });
    });
