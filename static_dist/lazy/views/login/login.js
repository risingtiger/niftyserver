(() => {
  // ../../.nifty/files/lazy/views/login/login.js
  var ATTRIBUTES = { propa: "" };
  var VLogin = class extends HTMLElement {
    m = { propa: "" };
    a = { ...ATTRIBUTES };
    s = { propa: false, email: "", password: "", isLoading: false, errorMessage: "", resetlink: "" };
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
      const emailInput = this.shadow.getElementById("emailinput");
      const passwordInput = this.shadow.getElementById("passwordinput");
      emailInput.addEventListener("input", (e) => this.s.email = e.target.value);
      passwordInput.addEventListener("input", (e) => this.s.password = e.target.value);
    }
    async attributeChangedCallback(name, oldval, newval) {
      $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
      $N.CMech.ViewDisconnectedCallback(this);
    }
    kd(_loadeddata, loadstate, _pathparams, searchparams) {
      if (loadstate === "initial" || loadstate === "searchchanged") {
        if (searchparams.error) {
          this.s.errorMessage = decodeURIComponent(searchparams.error);
        }
        if (searchparams.email) {
          this.s.email = decodeURIComponent(searchparams.email);
        }
        this.sc();
      }
    }
    sc() {
      render(this.template(this.s), this.shadow);
    }
    async login() {
      this.s.isLoading = true;
      this.s.errorMessage = "";
      this.sc();
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=` + localStorage.getItem("identity_platform_key");
      const email = this.s.email;
      const password = this.s.password;
      if (!this.validateForm()) {
        this.s.isLoading = false;
        return;
      }
      const body = { email, password, returnSecureToken: true };
      const opts = { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } };
      try {
        const response = await fetch(url, opts);
        const data = await response.json();
        if (!response.ok) {
          this.s.isLoading = false;
          this.s.errorMessage = "Login failed. Please check your credentials and try again.";
          this.sc();
          return;
        }
        localStorage.setItem("id_token", data.idToken);
        localStorage.setItem("token_expires_at", (Math.floor(Date.now() / 1e3) + Number(data.expiresIn)).toString()), localStorage.setItem("refresh_token", data.refreshToken);
        localStorage.setItem("user_email", data.email);
        if (data.email === "accounts@risingtiger.com") localStorage.setItem("auth_group", "admin");
        else localStorage.setItem("auth_group", "user");
        window.location.href = "/v/home";
      } catch (error) {
        this.s.isLoading = false;
        this.s.errorMessage = "Login failed. Please try again.";
        this.sc();
      }
    }
    validateForm() {
      if (!this.s.email || !this.s.email.includes("@")) {
        this.s.errorMessage = "Please enter a valid email address";
        this.sc();
        return false;
      }
      if (!this.s.password || this.s.password.length < 6) {
        this.s.errorMessage = "Password must be at least 6 characters";
        this.sc();
        return false;
      }
      return true;
    }
    async ResetPassword() {
      if (!this.s.email || !this.s.email.includes("@")) {
        this.s.errorMessage = "Please enter your email address to reset your password";
        this.sc();
        return;
      }
      this.s.isLoading = true;
      this.s.errorMessage = "";
      this.sc();
      const r = await $N.FetchLassie(`/api/reset_password?email=${this.s.email}`);
      this.s.isLoading = false;
      if (!r.ok) {
        let errorMessage = "Password reset failed. Please try again.";
        if (r.data && typeof r.data === "object" && r.data.error) {
          errorMessage = r.data.error;
        }
        this.s.errorMessage = errorMessage;
        this.sc();
        return;
      }
      this.s.errorMessage = "";
      this.s.password = "";
      this.s.resetlink = r.data.link;
      this.sc();
    }
    template = (_s) => {
      return html`<link rel='stylesheet' href='/assets/main.css'><style>h2 {
    font-size: 18px;
    padding-bottom: 16px;
    color: var(--primary-color, #333);
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 300px;
    margin: 0 auto;
    padding: 20px;
    background-color: var(--surface-color, #fff);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);



	input {
		width: 100%;
		box-sizing: border-box;
		padding: 10px;
		border: 1px solid var(--border-color, #ccc);
		border-radius: 4px;
		font-size: 14px;
	}
	button {
		width: 100%;
		padding: 12px;
		background-color: var(--primary-color, #0066cc);
		color: #fff;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		cursor: pointer;
	}
}

.forgot-password {
    text-align: center;
    margin-top: 16px;
    font-size: 14px;

	& h3 {
		padding: 12px 0;
	}

	& a {
		background: white;
		border: 1px solid #dddddd;
		padding: 6px 14px;
		border-radius: 8px;
		display: inline-block;
	}
}

.forgot-password a {
    color: var(--primary-color, #0066cc);
    text-decoration: none;
}

.forgot-password a:hover {
    text-decoration: underline;
}

.error-message {
    background-color: #ffe6e6;
    color: #d32f2f;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 16px;
    font-size: 14px;
    text-align: left;
    border-left: 4px solid #d32f2f;
}

</style>    <header class="viewheader">
        <a class="left" @click="${() => $N.SwitchStation.NavigateBack({ default: "home" })}"><span>‸</span></a>
        <div class="middle"><h1>Login</h1></div>
        <div class="right">
            &nbsp;
        </div>
    </header>

    <div class="content">
        <div style="text-align:center; padding-top: 30px;">
            <h2>Enter your credentials ---</h2>
            <div class="login-form">
                ${_s.errorMessage ? html`<div class="error-message">${_s.errorMessage}</div>` : ""}
                <input label="Email" id="emailinput" type="email" value="${_s.email}" @input="${(e) => _s.email = e.target.value}"></input>
                <input label="Password" type="password" id="passwordinput" @input="${(e) => _s.password = e.target.value}"></input>
                <button @click="${() => this.login()}" ?disabled="${_s.isLoading}">
                    ${_s.isLoading ? "Logging in..." : "Login"}
                </button>
                <div class="forgot-password">
                    <a href="#" @click="${() => this.ResetPassword()}">Forgot password?</a>
					${_s.resetlink ? html`
						<h3>Link Successfully Generated</h3>
						<a href="${_s.resetlink}" target="_blank">Click to Reset Password</a>
					` : ""}
                </div>
            </div>
        </div>
    </div>
`;
    };
  };
  customElements.define("v-login", VLogin);
})();
