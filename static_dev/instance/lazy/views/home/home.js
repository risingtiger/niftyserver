const ATTRIBUTES = {
    propa: ""
};
class VHome extends HTMLElement {
    a = {
        ...ATTRIBUTES
    };
    m = {
        propa: ""
    };
    s = {
        showAuth: false,
        showTesty: false,
        admin_response_str: "",
        pwtdata_interface_response_str: "",
        report_month_meters: [],
        month_names: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ]
    };
    reconcile_return_str;
    shadow;
    static get observedAttributes() {
        return Object.keys(ATTRIBUTES);
    }
    constructor(){
        super();
        this.reconcile_return_str = "";
        this.shadow = this.attachShadow({
            mode: 'open'
        });
    }
    async connectedCallback() {
        const d = new Date();
        d.setUTCDate(1);
        d.setUTCHours(0);
        d.setUTCMinutes(0);
        d.setUTCSeconds(0);
        d.setUTCMilliseconds(0);
        d.setUTCMonth(d.getUTCMonth() - 1);
        this.s.report_month_meters.push({
            year: d.getUTCFullYear(),
            month: d.getUTCMonth()
        });
        d.setUTCMonth(d.getUTCMonth() - 1);
        this.s.report_month_meters.push({
            year: d.getUTCFullYear(),
            month: d.getUTCMonth()
        });
        d.setUTCMonth(d.getUTCMonth() - 1);
        this.s.report_month_meters.push({
            year: d.getUTCFullYear(),
            month: d.getUTCMonth()
        });
        await $N.CMech.ViewConnectedCallback(this);
        this.dispatchEvent(new Event('hydrated'));
        const tel = this.shadow.getElementById("aiask_textarea");
        if (tel) {
            tel.addEventListener("keydown", (e)=>{
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.aiask();
                }
            });
        }
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewDisconnectedCallback(this);
    }
    kd = ()=>{};
    sc() {
        render(this.template(this.s, this.reconcile_return_str), this.shadow);
    }
    testing2(e) {
        setTimeout(()=>{
            e.detail.done();
        }, 5000);
    }
    async LogoutUser() {
        localStorage.removeItem("id_token");
        localStorage.removeItem("token_expires_at");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("auth_group");
        localStorage.removeItem("user_email");
        setTimeout(()=>{
            window.location.href = "/v/login";
        }, 600);
        this.sc();
    }
    get_reverse_geo_code_zip_state = ()=>new Promise(async (res, _rej)=>{
            const lat = 36.988873;
            const lon = -112.968119;
            const r = await $N.FetchLassie("/api/pwt/get_reverse_geo_code_zip_state?lat=" + lat + "&lon=" + lon);
            if (!r.ok) {
                alert("Error");
                res(1);
                return;
            }
            console.log(r);
            res(1);
        });
    async meters_monthly() {}
    async run_report_month_meters(btnel) {
        const val = this.shadow.getElementById("report_month_meters").value;
        const split = val.split(",");
        const year = parseInt(split[0]);
        const month = parseInt(split[1]);
        const csvstr = await $N.FetchLassie("/api/pwt/reports/meters_monthly?year=" + year + "&month=" + month, {
            headers: {
                'Content-Type': 'text/csv',
                'Accept': 'text/csv'
            }
        });
        if (!csvstr.ok) {
            alert("Error");
            btnel.setAttribute("resolved", true);
            this.sc();
            return;
        }
        $N.Utils.CSV_Download(csvstr.data, "meters_monthly_" + year + "_" + month);
        btnel.setAttribute("resolved", true);
        this.sc();
    }
    async aiask() {
        const aiask_textarea_el = this.shadow.getElementById("aiask_textarea");
        const question = aiask_textarea_el.value;
        if (!question) {
            alert("Please enter a question");
            return;
        }
        const body = {
            question,
            machineid: "0002231"
        };
        const obj = {
            method: "POST",
            body: JSON.stringify(body)
        };
        const r = await $N.FetchLassie("/api/pwt/aiask/machine_statuses", obj);
        if (!r.ok) {
            alert("Error");
            return;
        }
        if (r.ok && r.data.answer) {
            aiask_textarea_el.value = aiask_textarea_el.value + "\n\n" + r.answer + "\n\n";
            // Scroll to the bottom of the textarea to show the latest text
            aiask_textarea_el.scrollTop = aiask_textarea_el.scrollHeight;
        } else {
            alert("No answer found");
        }
        this.sc();
    }
    async adminetc(api, method = "GET", body, queries) {
        if (confirm("Are you sure you want to run admin: " + api)) {
            const obj = {
                method
            };
            if (body) {
                obj.body = JSON.stringify(body);
            }
            if (queries) {
                const queryString = Object.entries(queries).map(([key, value])=>`${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
                api = `${api}${api.includes('?') ? '&' : '?'}${queryString}`;
            }
            const response = await $N.FetchLassie("/api/pwt/admin/" + api, obj);
            if (!response.ok) {
                alert("Error");
                return;
            }
            this.s.admin_response_str = response.data.message;
            this.sc();
        }
    }
    async pwtdata_interfaceetc(api, method, body) {
        if (confirm("Are you sure you want to run pwtdata interface: " + api)) {
            const obj = {
                method
            };
            if (body) {
                obj.body = JSON.stringify(body);
            }
            const response_str = await $N.FetchLassie("/api/pwt/pwtdata_interface/" + api, obj);
            if (!response_str.ok) {
                alert("Error");
                return;
            }
            this.s.pwtdata_interface_response_str = response_str.data;
            this.sc();
        }
    }
    get_logs() {
        $N.Logger.Get();
    }
    /*
async Admin_Firestore_Update_Collection_Docs() {

    if (confirm("Are you sure you want to update the machines?")) {
        const returndata = FetchLassie("/api/admin_firestore_update_collection_docs")
        this.reconcile_return_str = returndata.return_str
        this.sc()
    }
}




async Data_Usage(account:str) {

    if (confirm("Are you sure you want to run data usage queries. LOTS of hits to particles servers?")) {
        const returndata = FetchLassie(`/api/data_usage/${account}`)
        this.reconcile_return_str = returndata.return_str
        this.sc()
    }
}




async Status_Stats() {
    if (confirm("Are you sure you want to run status stats. LOTS of hits to database?")) {
        const returndata = FetchLassie(`/api/getstatusstats`)
        console.info(returndata)
        this.sc()
    }
}




async Location_Match() {
    if (confirm("Are you sure you want to run status stats. LOTS of hits to database?")) {
        const returndataP = await fetch(`/api/location_match`)
        const returndata = await returndataP.json()

        console.info(returndata)

        this.sc()
    }
}




  async Misc_Quicky() {

    if (confirm("Are you sure you want to run the quicky?")) {
      const returndataP = await fetch(`/api/misc_quicky`)
      const returndata = await returndataP.json()

      this.reconcile_return_str = returndata.return_str

      this.sc()
    }

  }




    async Firestore_Admin_Misc_Get() {

        if (confirm("Are you sure you want to run firestore admin misc get?")) {
            const returndataP = await fetch(`/api/admin_firestore_misc_get`)
            const returndata = await returndataP.json()

            this.reconcile_return_str = returndata.return_str

            this.sc()
        }
    }




    async Misc_Admin_Particle() {

        if (confirm("Are you sure you want to run the msc admin particle?")) {
          const returndataP = await fetch(`/api/admin_particle_rename`)
          const returndata = await returndataP.json()

          this.reconcile_return_str = returndata.return_str

          this.sc()
        }
    }



    async WebPush_Send_Msg() {

        if (confirm("Are you sure you want to send to topic?")) {

            const returndataP = await fetch(`/api/webpush_send_msg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: "This is a Test",
                    body: 'Sending to all testing devices',
                    tags: ['testing']
                })
            })

            const returndata = await returndataP.json()

            this.reconcile_return_str = returndata.return_str

            this.sc()
        }
    }




    async Listen_Test_Trigger() {

        const returndataP = await fetch(`/api/listen_test_trigger`, {
            method: 'GET',
        })

        const returndata = await returndataP.json()

        console.info(returndata)

        this.reconcile_return_str = returndata.message

        this.sc()
    }




    async RunAdminAPI(adminapi_str:str) {

        if (confirm("Run admin api: " + adminapi_str + "?")) {
            const returndataP = await fetch(`/api/admin/${adminapi_str}`)
            const returndata = await returndataP.json()

            this.reconcile_return_str = returndata.return_str

            this.sc()
        }
    }
*/ template = (_s, _reconcile_return_str)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('v-home', VHome);
export { };
