(() => {
  // ../../.nifty/files/lazy/views/appmsgs/appmsgs.js
  var ATTRIBUTES = { propa: "" };
  var VAppMsgs = class extends HTMLElement {
    m = { propa: "" };
    a = { ...ATTRIBUTES };
    s = { showlogs: false, showappupdated: false, showdatawipe: false, show_gen_logsubj: false, logs: [], logsubj: "" };
    shadow;
    static get observedAttributes() {
      return Object.keys(ATTRIBUTES);
    }
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "open" });
    }
    async connectedCallback() {
      await $N.CMech.ViewConnectedCallback(this);
      this.dispatchEvent(new Event("hydrated"));
    }
    async attributeChangedCallback(name, oldval, newval) {
      $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
      $N.CMech.ViewDisconnectedCallback(this);
    }
    kd(_loadeddata, loadstate, _pathparams, searchparams) {
      if (loadstate === "initial" || loadstate === "searchchanged") {
        this.s.logsubj = searchparams.logsubj || "";
        this.s.showappupdated = searchparams.appupdate || false;
        if (searchparams.appupdate) {
          this.s.showappupdated = true;
        } else if (this.s.logsubj === "ldr") {
          this.s.showdatawipe = true;
        } else if (this.s.logsubj) {
          this.s.show_gen_logsubj = true;
        }
      }
    }
    sc() {
      render(this.template(this.s), this.shadow);
    }
    show_logs() {
      const l = localStorage.getItem("logs");
      this.s.logs = l && l.includes("-") ? l.split("-") : [l || ""];
      this.s.showlogs = true;
      this.sc();
    }
    template = (s) => {
      return html`<link rel='stylesheet' href='/assets/main.css'><style>

h2 {
    font-size: 15px;
    padding-bottom: 16px;
}

.message-container {
    text-align: center;
    margin: 20px auto;
    padding: 15px;
    max-width: 90%;
    background-color: #f8f8f8;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.error-message {
    font-weight: bold;
    font-size: 1.1em;
    color: #e53935;
}

.app-link {
    display: inline-block;
    margin-top: 10px;
    font-weight: bold;
    color: #2196F3;
    text-decoration: none;
}

.log-container {
    display: none;
    padding: 15px;
    margin: 10px 0;
    border-radius: 5px;
    background-color: #f5f5f5;
    max-height: 70vh;
    overflow-y: auto;
}

.log-container.active {
    display: block;
}

.log-entry {
    padding: 8px 12px;
    margin-bottom: 6px;
    border-bottom: 1px solid #e0e0e0;
    font-family: monospace;
    word-break: break-word;
}

#logsubj {
    display: none;
}

#logsubj.active {
    display: block;
}

#appupdated {
    display: none;
}

#appupdated.active {
    display: block;
    text-align: center;
    font-size: 1.2em;
    margin: 20px auto;
    padding: 15px;
    background-color: white;
    color: white;
    border-radius: 8px;

	& h2 {
		font-size: 21px;
		padding-bottom: 37px;
	}
	
	& button {
		background: var(--actioncolor);
		border: none;
		border-radius: 10px;
		padding: 9px 25px;
		font-size: 18px;
		color: white;
		cursor: pointer;
	}
}


</style>

<header class="viewheader">
    <a class="left" @click="${() => $N.SwitchStation.NavigateBack({ default: "home" })}"><span>‸</span></a>
    <div class="middle"><h1>App Messages</h1></div>
    <div class="right">
        &nbsp;
    </div>
</header>


<div class="content">
    ${s.showdatawipe ? html`
		<div class="message-container">
			<strong>App Data Refreshed</strong>
			<br>
			<a href="/v/home" class="app-link">Go to Home</a>
		</div>
    ` : ""}

    ${s.show_gen_logsubj && localStorage.getItem("id_token") ? html`
		<div class="message-container">
			<strong class="error-message">There was an error in the app.</strong>
			<br>
			<a href="/v/home" class="app-link">Go to Home</a>
			<br><br>
			<a href="#" @click="${() => this.show_logs()}" class="app-link">Show Logs</a>
		</div>
    ` : ""}


	<div id="logsubj" class="log-container ${s.showlogs ? "active" : ""}">
		${s.logs.map((row) => html`<div class="log-entry">${row}</div>`)}
	</div>

	<div id="appupdated" class="message-container ${s.showappupdated ? "active" : ""}">
		<h2>App Updated</h2>
		<button @click="${() => window.location.href = "/v/home"}">Go to Home</button>
	</div>
</div>



`;
    };
  };
  customElements.define("v-appmsgs", VAppMsgs);
})();
