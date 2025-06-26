const ATTRIBUTES = {
    propa: ""
};
class VLogin extends HTMLElement {
    m = {
        propa: ""
    };
    a = {
        ...ATTRIBUTES
    };
    s = {
        propa: false,
        email: "",
        password: "",
        isLoading: false,
        errorMessage: "",
        resetlink: ""
    };
    shadow;
    static get observedAttributes() {
        return Object.keys(ATTRIBUTES);
    }
    constructor(){
        super();
        this.shadow = this.attachShadow({
            mode: 'open'
        });
    }
    async connectedCallback() {
        await $N.CMech.ViewConnectedCallback(this);
        this.dispatchEvent(new Event('hydrated'));
        const emailInput = this.shadow.getElementById('emailinput');
        const passwordInput = this.shadow.getElementById('passwordinput');
        emailInput.addEventListener('input', (e)=>this.s.email = e.target.value);
        passwordInput.addEventListener('input', (e)=>this.s.password = e.target.value);
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewDisconnectedCallback(this);
    }
    kd(_loadeddata, loadstate, _pathparams, searchparams) {
        if (loadstate === 'initial' || loadstate === 'searchchanged') {
            // Check for error parameter in URL
            if (searchparams.error) {
                this.s.errorMessage = decodeURIComponent(searchparams.error);
            }
            // Restore email from URL params if available
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
        const body = {
            email,
            password,
            returnSecureToken: true
        };
        const opts = {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        };
        try {
            const response = await fetch(url, opts);
            const data = await response.json();
            if (!response.ok) {
                this.s.isLoading = false;
                this.s.errorMessage = "Login failed. Please check your credentials and try again.";
                this.sc();
                return;
            }
            localStorage.setItem('id_token', data.idToken);
            localStorage.setItem('token_expires_at', (Math.floor(Date.now() / 1000) + Number(data.expiresIn)).toString()), localStorage.setItem('refresh_token', data.refreshToken);
            localStorage.setItem('user_email', data.email);
            if (data.email === "accounts@risingtiger.com") localStorage.setItem('auth_group', 'admin');
            else localStorage.setItem('auth_group', 'user');
            window.location.href = "/v/home";
        } catch (error) {
            this.s.isLoading = false;
            this.s.errorMessage = "Login failed. Please try again.";
            this.sc();
        }
    }
    validateForm() {
        // Simple validation
        if (!this.s.email || !this.s.email.includes('@')) {
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
        if (!this.s.email || !this.s.email.includes('@')) {
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
            // Handle error response
            let errorMessage = "Password reset failed. Please try again.";
            if (r.data && typeof r.data === 'object' && r.data.error) {
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
    template = (_s)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('v-login', VLogin);
export { };
