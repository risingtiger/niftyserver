var TypeT = /*#__PURE__*/ function(TypeT) {
    TypeT[TypeT["INPUT"] = 0] = "INPUT";
    TypeT[TypeT["DSELECT"] = 1] = "DSELECT";
    TypeT[TypeT["TOGGLE"] = 2] = "TOGGLE";
    return TypeT;
}(TypeT || {});
const ATTRIBUTES = {
    val: ""
};
class CIn2 extends Lit_Element {
    a = {
        ...ATTRIBUTES
    };
    s = {
        val: "",
        newval: "",
        issaving: false,
        err_msg: "",
        options: "",
        min: "",
        max: "",
        updatemoment: 0
    };
    m = {
        name: "",
        type: 2,
        inputtype: "text",
        label: "",
        labelwidth: 0,
        placeholder: ""
    };
    controlel = document.body;
    animatehandles = {
        view: null,
        edit: null
    } // label: null }
    ;
    keyframes = {
        view: null,
        edit: null
    } // label: null }
    ;
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
    connectedCallback() {
        const attr_typestr = this.getAttribute("type") || "text";
        this.s.val = this.getAttribute("val") || "";
        this.m.label = this.getAttribute("label") || "";
        this.m.labelwidth = parseInt(this.getAttribute("labelwidth") || "125");
        this.m.name = this.getAttribute("name") || "";
        this.s.options = this.getAttribute("options") || "";
        this.s.min = this.getAttribute("min") || "";
        this.s.max = this.getAttribute("max") || "";
        this.a.val = this.s.val;
        if (attr_typestr === "toggle") {
            this.m.type = 2;
            this.m.inputtype = "none";
        } else if (attr_typestr === "dselect") {
            this.m.type = 1;
            this.m.inputtype = "none";
        } else {
            this.m.type = 0;
            this.m.inputtype = attr_typestr;
        }
        this.addEventListener("click", (e)=>this.clicked(e), true);
        this.sc();
        this.controlel = this.shadow.querySelector(".controlel");
    }
    async attributeChangedCallback(name, oldval, newval) {
        if (oldval === null) return;
        const a = this.a;
        a[name] = newval;
        if (name === "val") {
            this.s.val = newval;
        }
        if (!a.updatescheduled) {
            a.updatescheduled = true;
            Promise.resolve().then(()=>{
                this.sc();
                a.updatescheduled = false;
            });
        }
    }
    sc() {
        render(this.template(this.a, this.s, this.m), this.shadow);
    }
    updatedone(newval) {
        const diff = Date.now() - this.s.updatemoment;
        if (diff > 1000) {
            this.setAttribute("val", newval || this.s.newval);
            this.s.issaving = false;
            this.sc();
        } else {
            setTimeout(()=>{
                this.setAttribute("val", newval || this.s.newval);
                this.s.issaving = false;
                this.sc();
            }, 1000);
        }
    }
    updatefailed(reverttoval, _error) {
        const diff = Date.now() - this.s.updatemoment;
        if (diff > 1000) {
            this.setAttribute("val", reverttoval || this.s.val);
        } else {
            setTimeout(()=>{
                this.setAttribute("val", reverttoval || this.s.val);
            }, 1000);
        }
    }
    clicked(_e) {}
    inputchanged() {
        this.dispatchEvent(new CustomEvent("input", {
            detail: {
                name: this.m.name,
                newval: this.s.newval,
                oldval: this.s.val
            }
        }));
    }
    focused() {
        this.controlel.select();
        this.sc();
    }
    blurred() {
        const val = this.controlel.value || "";
        if (val !== this.s.val) {
            confirm("Do you want to save changes?") ? this.runupdate() : console.log('nope');
        }
    }
    keyupped(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            this.runupdate();
            this.sc();
        }
    }
    dselect_updated() {
        this.runupdate();
        this.sc();
    }
    toggle_toggled(e) {
        const el = e.currentTarget;
        el.classList.add("animate");
        if (this.s.val === "true") {
            el.classList.remove("istrue");
        } else {
            el.classList.add("istrue");
        }
        this.runupdate();
    }
    actionicon_clicked(_e) {
        this.controlel.focus();
    }
    label_clicked(_e) {
        this.controlel.focus();
    }
    rendercontrol() {
        if (this.m.type === 2) {
            return html`<span 
							class="switch ${this.s.val === 'true' ? 'istrue' : ''}"
							@click="${(e)=>this.toggle_toggled(e)}"
							class="controlel"><span class="inner"></span></span>`;
        } else if (this.m.type === 1) {
            return html`<c-dselect 
							options="${this.getAttribute('options') || ''}" 
							@update="${()=>this.dselect_updated()}" 
							val="${this.s.val}"></c-dselect>`;
        } else if (this.m.type === 0) {
            let minmax = this.s.min ? `min="${this.s.min}"` : "";
            minmax += this.s.max ? ` max="${this.s.max}"` : "";
            return html`
				<input 
							@input="${()=>this.inputchanged()}"  
							@blur="${()=>this.blurred()}" 
							@focus="${()=>this.focused()}" 
							@keyup="${(e)=>this.keyupped(e)}" 
							class="controlel"
							type="${this.m.inputtype}" 
							value="${this.s.val}" 
							placeholder="${this.m.placeholder}" 
							enterkeyhint="done" ${minmax} name="${this.m.name}"></input>`;
        }
    }
    runupdate() {
        if (this.m.type === 2) {
            const toggleel = this.shadow.querySelector(".switch");
            this.s.newval = toggleel.classList.contains("istrue") ? "true" : "false";
        } else if (this.m.type === 0) {
            const inputel = this.shadow.querySelector("input");
            this.s.newval = inputel.value;
        } else if (this.m.type === 1) {
            const dselectel = this.shadow.querySelector("c-dselect");
            this.s.newval = dselectel.getAttribute("val");
        }
        if (this.s.newval === this.s.val) {
            this.s.newval = "";
            return;
        }
        this.s.updatemoment = Date.now();
        this.dispatchEvent(new CustomEvent("update", {
            detail: {
                name: this.m.name,
                newval: this.s.newval,
                oldval: this.s.val,
                failed: this.updatefailed.bind(this),
                done: this.updatedone.bind(this)
            }
        }));
        this.s.issaving = true;
        this.sc();
    }
    template = (_a, _s, _m)=>{
        return html`{--css--}{--html--}`;
    };
}
//@ts-ignore
customElements.define('c-in2', CIn2);
export { };
