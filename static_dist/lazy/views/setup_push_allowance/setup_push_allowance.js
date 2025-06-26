(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../../.nifty/files/lazy/views/setup_push_allowance/setup_push_allowance.js
  var firebaseConfig = { apiKey: "AIzaSyAx0ix0_Yz6RN6_-5kiwU-_uWm4sErpXdw", authDomain: "purewatertech.firebaseapp.com", databaseURL: "https://purewatertech.firebaseio.com", projectId: "purewatertech", storageBucket: "purewatertech.firebasestorage.app", messagingSenderId: "805737116651", appId: "1:805737116651:web:9baada48dc65d9b72c9fae", measurementId: "G-5VBS981F9K" };
  var vapidKey = "BF6MOQVRtD-cw7q34V_3x2xGdnEyym2wNj0wS_qJQtnRnZHagqxV1vVpfVKX6Km-qkhCn4IIS_Pt4mMfqPxyd68";
  var firebase_service = {};
  firebase_service.initializeApp = {};
  firebase_service.getMessaging = {};
  firebase_service.getToken = {};
  firebase_service.app = {};
  firebase_service.messaging = {};
  var ATTRIBUTES = { propa: "" };
  var VSetupPushAllowance = class extends HTMLElement {
    m = { propa: "" };
    a = { ...ATTRIBUTES };
    s = { is_subscribed: false };
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
      await loadfirebase();
      navigator.serviceWorker.ready.then((registration) => {
        return registration.pushManager.getSubscription();
      }).then((subscription) => {
        if (subscription) {
          this.s.is_subscribed = true;
        } else {
          this.s.is_subscribed = false;
        }
        this.sc();
        setTimeout(() => {
          this.dispatchEvent(new Event("hydrated"));
        }, 100);
      });
    }
    async attributeChangedCallback(name, oldval, newval) {
      $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
      $N.CMech.ViewDisconnectedCallback(this);
    }
    kd() {
    }
    sc() {
      render(this.template(this.s), this.shadow);
    }
    async Subscribe(e) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          throw new Error("Permission not granted for Notification");
        } else {
          await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });
          firebase_service.messaging = firebase_service.getMessaging();
          const fcm_token = await firebase_service.getToken(firebase_service.messaging, { serviceWorkerRegistration: reg, vapidKey });
          const user_email = localStorage.getItem("user_email");
          const r = await $N.FetchLassie("/api/push_subscriptions/add?user_email=" + user_email + "&fcm_token=" + fcm_token, { method: "GET", headers: { "Content-type": "application/json" } });
          e.detail.resolved();
          if (!r.ok) {
            alert("Error trying to subscribe: " + r.statusText);
            return;
          }
          this.s.is_subscribed = true;
          this.sc();
          await reg.showNotification("Notification with ServiceWorker", { body: "Notification with ServiceWorker" });
        }
      });
    }
    async Unsubscribe(btnel) {
      navigator.serviceWorker.ready.then(async (reg) => {
        reg.pushManager.getSubscription().then((subscription) => {
          subscription.unsubscribe().then(async (_successful) => {
            const user_email = localStorage.getItem("user_email");
            await $N.FetchLassie("/api/push_subscriptions/remove?user_email=" + user_email, { method: "GET", headers: { "Content-type": "application/json" } });
            this.s.is_subscribed = false;
            this.sc();
            btnel.setAttribute("resolved", true);
          }).catch((_e) => {
          });
        });
      }).catch((_) => {
      });
    }
    template = (_s) => {
      return html`<link rel='stylesheet' href='/assets/main.css'><style>

h2 {
    font-size: 15px;
    padding-bottom: 16px;
}


</style>

<header class="viewheader">
    <a class="left" @click="${() => $N.SwitchStation.NavigateBack({ default: "home" })}"><span>‸</span></a>
    <div class="middle"><h1>Notifications</h1></div>
    <div class="right">
        &nbsp;
    </div>
</header>


<div class="content">
    <div style="text-align:center; padding-top: 30px;">

        ${_s.is_subscribed ? html`
            <h2>This Device is subscribed to notifications</h2>
            <c-btn @click="${(e) => this.Unsubscribe(e.target)}">Unsubscribe</c-btn>
        ` : html`
            <h2>This Device is not subscribed to notifications</h2>
            <c-btn @click="${(e) => this.Subscribe(e.target)}">Subscribe</c-btn>
        `}

    </div>

</div>



`;
    };
  };
  customElements.define("v-setup_push_allowance", VSetupPushAllowance);
  function loadfirebase() {
    return new Promise(async (res, _rej) => {
      const promises = [];
      promises.push(import("https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js"));
      promises.push(import("https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging.js"));
      const r = await Promise.all(promises);
      firebase_service.initializeApp = r[0].initializeApp;
      firebase_service.getMessaging = r[1].getMessaging;
      firebase_service.getToken = r[1].getToken;
      firebase_service.app = firebase_service.initializeApp(firebaseConfig);
      res(true);
    });
  }
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
})();
