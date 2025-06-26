let s = {
    state: 'loggedout',
    error_rows: [],
    error_rows_show: false,
    loginerror: '',
    updatedone: false
};
const template = (_s)=>{
    return html`

	<div id="login" class="${_s.state === 'loggingin' ? 'active' : ''} ${_s.loginerror !== '' ? 'error' : ''}">
		<h1>Pure Water Login</h1>

		<ul class="items">
			<li>
				<h5>Email</h5>
				<input type="text" name="username" id="email" value="" class="${_s.loginerror !== '' ? 'input-error' : ''}">
			</li>

			<li>
				<h5>Password</h5>
				<input type="password" name="password" id="password" value="" class="${_s.loginerror !== '' ? 'input-error' : ''}">
			</li>
		</ul>

		<div @click="${()=>loginsubmit()}" class="btn" id="submit_login_button">login</div>


		<div id="login_errormsg" class="${_s.loginerror !== '' ? 'active' : ''}">${_s.loginerror}</div>


	</div>

	<div id="logged_out" class="${_s.state === 'loggedout' ? 'active' : ''}">
		<div id="login_button" class="btn"><a href='/index.html?loggingin=true'>Pure Water Login</a></div>

	</div>

	${_s.updatedone ? html`<div id="update_done"><br><br><br>Update Done</div>` : ''}

	<div id="logged_in" class="${_s.state === 'loggedin' ? 'active' : ''}">
		<div id="home_button" class="btn"><a href="/v/home">Pure Water Dashboard Home</a></div>
		<!--<div id="logout_button" class="btn"><a>Log out</a></div>-->
	</div>

	<div id="error" class="${_s.error_rows.length ? 'active' : ''}">
		<br><br><h6 style="text-align: center;">An Error Occurred in the App. - <a href="#" @click="${()=>{
        s.error_rows_show = true;
        sc();
    }}">Show Errors</a></h6>
		${s.error_rows_show ? html`
			${s.error_rows.map((row)=>html`<div>${row}</div>`)}
		` : ''}
	</div>
`;
};
function sc() {
    // hopefully soon I can circle back to this and get entry working on lit. AND, better yet, get all auth stuff back into home and/or turn auth view into component that is in home and create dashboard that is logged in stuff
    render(template(s), document.getElementById("litroot"));
}
window.addEventListener("load", async (_e)=>{
    const id_token = localStorage.getItem('id_token');
    localStorage.removeItem('synccollections');
    if (window.location.search.includes("appupdate=done")) {
        s.state = 'loggedout';
        s.updatedone = true;
        sc();
    } else if (window.location.search.includes("logsubj")) {
        s.state = id_token ? 'loggedin' : 'loggedout';
        s.error_rows_show = false;
        const l = localStorage.getItem('logs');
        const logs = l && l.includes('-') ? l.split('-') : [];
        s.error_rows = logs;
        sc();
    } else if (id_token) {
        s.state = 'loggedin';
        sc();
    } else if (window.location.search.includes("loggingin")) {
        s.state = 'loggingin';
        sc();
    } else {
        s.state = 'loggedout';
        sc();
    }
});
async function loginsubmit() {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=` + window.identity_platform_key;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
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
    const r = await fetch(url, opts);
    const data = await r.json();
    if (data.error) {
        s.loginerror = data.error.message;
        sc();
    } else {
        localStorage.setItem('id_token', data.idToken);
        localStorage.setItem('token_expires_at', (Math.floor(Date.now() / 1000) + Number(data.expiresIn)).toString()), localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('user_email', data.email);
        if (data.email === "accounts@risingtiger.com") localStorage.setItem('auth_group', 'admin');
        else localStorage.setItem('auth_group', 'user');
        window.location.href = '/v/home';
    }
}
