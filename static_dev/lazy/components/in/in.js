//declare var Lit_Css: any;
var ModeT = /*#__PURE__*/ function(ModeT) {
    ModeT[ModeT["EDIT"] = 0] = "EDIT";
    ModeT[ModeT["VIEW"] = 1] = "VIEW";
    ModeT[ModeT["SAVING"] = 2] = "SAVING";
    ModeT[ModeT["SAVED"] = 3] = "SAVED";
    ModeT[ModeT["ERRORED"] = 4] = "ERRORED";
    return ModeT;
}(ModeT || {});
var TypeT = /*#__PURE__*/ function(TypeT) {
    TypeT[TypeT["INPUT"] = 0] = "INPUT";
    TypeT[TypeT["DSELECT"] = 1] = "DSELECT";
    TypeT[TypeT["TOGGLE"] = 2] = "TOGGLE";
    return TypeT;
}(TypeT || {});
class CIn extends Lit_Element {
    s;
    m;
    els;
    animatehandles;
    keyframes;
    shadow;
    static get observedAttributes() {
        return [
            'val'
        ];
    }
    constructor(){
        super();
        this.shadow = this.attachShadow({
            mode: 'open'
        });
        this.s = {
            mode: 1,
            val: "",
            isanimating: false,
            err_msg: ""
        };
        this.m = {
            name: "",
            type: 0,
            inputtype: "text",
            label: "",
            labelwidth: 0,
            placeholder: ""
        };
        this.els = {
            label: null,
            section: null,
            view: null,
            edit: null,
            displayval: null,
            action: null,
            editdone: null,
            animeffect: null,
            input: null,
            switch: null,
            dselect: null
        };
        this.animatehandles = {
            view: null,
            edit: null
        } // label: null}
        ;
        this.keyframes = {
            view: null,
            edit: null
        } // label: null}
        ;
    }
    connectedCallback() {
        this.sc();
        const attr_typestr = this.getAttribute("type") || "toggle";
        this.s.val = this.getAttribute("val") || "";
        this.m.label = this.getAttribute("label") || "";
        this.m.labelwidth = parseInt(this.getAttribute("labelwidth") || "125");
        this.m.name = this.getAttribute("name") || "";
        if (attr_typestr === "toggle") {
            this.s.mode = 0;
            this.m.type = 2;
            this.m.inputtype = "none";
        } else if (attr_typestr === "dselect") {
            this.s.mode = 1;
            this.m.type = 1;
            this.m.inputtype = "none";
        } else {
            this.s.mode = 1;
            this.m.type = 0;
            this.m.inputtype = attr_typestr;
        }
        const frag = document.createDocumentFragment();
        this.els.label = document.createElement("label");
        this.els.section = document.createElement("section");
        this.els.label.part.add("label");
        this.els.label.textContent = this.m.label;
        this.els.label.style.width = this.m.labelwidth + "px";
        if (this.s.mode === 0) {
            this.insert_edit();
        } else {
            this.insert_view();
        }
        frag.appendChild(this.els.label);
        frag.appendChild(this.els.section);
        this.shadow.appendChild(frag);
        this.addEventListener("click", (e)=>this.clicked(e), true);
    }
    async attributeChangedCallback(name, oldval, newval) {
        if (oldval === null || newval === oldval) return;
        if (name === "val") {
            this.s.val = newval;
            if (this.s.mode === 1 && !this.s.isanimating) {
                // TOGGLE IS NEVER IN VIEW MODE
                if (this.m.type === 0) {
                    this.els.displayval.textContent = this.s.val;
                } else if (this.m.type === 1) {
                    this.els.displayval.textContent = this.gettextofoptionsval();
                }
            } else if (this.s.mode === 0 && !this.s.isanimating) {
                if (this.m.type === 2) {
                    if (this.s.val === "true") {
                        this.els.switch.classList.add("istrue");
                    } else {
                        this.els.switch.classList.remove("istrue");
                    }
                }
                if (this.m.type === 0) {
                    this.els.input.value = this.s.val;
                } else if (this.m.type === 1) {
                    this.els.dselect.setAttribute("val", this.s.val);
                }
            }
        }
    }
    set_update_fail(reverttoval, error) {
        if (this.s.mode === 2) {
            this.to_error_result(reverttoval, error);
        }
    }
    clicked(e) {
        let allow_propagation = false;
        if (this.s.mode === 0) {
            if (this.m.type === 2) {
                allow_propagation = true;
            } else if (this.m.type === 0) {
                this.els.input?.focus();
                allow_propagation = true;
            } else if (this.m.type === 1) {
                allow_propagation = true;
            }
        } else if (this.s.mode === 1) {
            if (this.m.type === 0 || this.m.type === 1) {
                this.to_edit();
                this.els.input?.focus();
            }
        }
        if (allow_propagation === false) e.stopPropagation();
    /*
        if (this.s.mode === ModeT.VIEW && this.m.dselect_initial_mode === ModeT.EDIT) {
            this.to_dselect_edit()
        }

        else {
            this.to_edit()
        }
        */ }
    set_existing_dom_according_to_attr_val() {
        if (this.m.type === 2) {}
    }
    insert_edit(immediate_focus = false) {
        this.els.edit = document.createElement("span");
        this.els.edit.id = "edit";
        if (this.m.type === 2) {
            this.els.switch = document.createElement("span");
            const span_inner_el = document.createElement("span");
            this.els.switch.className = "switch";
            span_inner_el.className = "inner";
            this.els.switch.style.transition = "none";
            span_inner_el.style.transition = "none";
            if (this.s.val === "true") {
                this.els.switch.classList.add("istrue");
            }
            this.els.switch.appendChild(span_inner_el);
            this.els.edit.appendChild(this.els.switch);
            setTimeout(()=>{
                this.els.switch.style.transition = "";
                span_inner_el.style.transition = "";
            }, 700);
            this.els.switch.addEventListener("click", ()=>{
                const newval = this.s.val === "true" ? "false" : "true";
                if (newval === "true") {
                    this.els.switch.classList.add("istrue");
                } else {
                    this.els.switch.classList.remove("istrue");
                }
                this.to_updating(this.s.val, newval);
            });
        } else if (this.m.type === 0) {
            this.els.input = document.createElement("input");
            this.els.input.type = this.m.inputtype;
            this.els.input.value = this.s.val;
            this.els.input.placeholder = this.getAttribute("placeholder") || "";
            this.els.input.enterKeyHint = "done";
            if (this.els.input.type === "range") {
                this.els.input.min = this.getAttribute("min") || "";
                this.els.input.max = this.getAttribute("max") || "";
            }
            this.els.edit.appendChild(this.els.input);
            this.els.input.addEventListener("input", ()=>{
                this.dispatchEvent(new CustomEvent("change", {
                    detail: {
                        newval: this.els.input.value,
                        oldval: this.s.val
                    }
                }));
            });
            this.els.editdone = document.createElement("i");
            this.els.editdone.innerHTML = "&#xf103;";
            this.els.input.addEventListener('keydown', (e)=>{
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const newval = this.els.input?.value || "";
                    const oldval = this.s.val;
                    this.to_updating(oldval, newval);
                    this.els.input?.blur();
                }
            });
            this.els.editdone.addEventListener("click", ()=>{
                const newval = this.els.input?.value || "";
                const oldval = this.s.val;
                this.to_updating(oldval, newval);
            });
            this.els.edit.appendChild(this.els.editdone);
            if (immediate_focus) {
                setTimeout(()=>this.els.input.focus(), 800);
            }
        } else if (this.m.type === 1) {
            this.els.dselect = document.createElement("c-dselect");
            this.els.dselect.setAttribute("options", this.getAttribute("options") || "");
            this.els.dselect.setAttribute("val", this.s.val);
            this.els.dselect.addEventListener("changed", (e)=>{
                const newval = e.detail.newval || "";
                const oldval = e.detail.oldval;
                this.to_updating(oldval, newval);
            });
            this.els.dselect.addEventListener("cancelled", (_e)=>{
                this.s.mode = 3;
                this.to_view();
            });
            this.els.edit.appendChild(this.els.dselect);
            if (immediate_focus) {
                setTimeout(()=>this.els.dselect.setAttribute("open", ""), 200);
            }
        }
        this.els.section?.appendChild(this.els.edit);
    }
    insert_view() {
        this.els.view = document.createElement("span");
        this.els.view.id = "view";
        this.els.displayval = document.createElement("p");
        this.els.action = document.createElement("i");
        this.els.action.innerHTML = "&#xf114;";
        if (this.m.type === 1) {
            this.els.displayval.textContent = this.gettextofoptionsval();
        } else {
            this.els.displayval.textContent = this.s.val;
        }
        this.els.view.appendChild(this.els.displayval);
        this.els.view.appendChild(this.els.action);
        if (this.s.err_msg) {
            const err_msg_el = document.createElement("span");
            err_msg_el.id = "err_msg";
            err_msg_el.textContent = this.s.err_msg;
            this.els.view.appendChild(err_msg_el);
        }
        this.els.section?.appendChild(this.els.view);
    }
    to_edit() {
        if (this.s.mode === 1 && this.s.isanimating === false) {
            this.s.mode = 0;
            this.s.isanimating = true;
            this.insert_edit(true);
            this.set_animation();
            this.animatehandles.edit.play();
            this.animatehandles.view.play();
            this.animatehandles.edit.onfinish = ()=>{
                this.s.isanimating = false;
                this.els.view?.parentElement?.removeChild(this.els.view);
            };
        }
    }
    to_updating(oldval = null, newval) {
        if (this.s.mode === 0 && this.s.isanimating === false) {
            this.s.mode = 2;
            if (newval === oldval) {
                this.to_updated_result(newval);
                return;
            }
            if (this.m.type === 0) {
                this.els.editdone?.classList.add("hide_while_spinner");
            }
            this.els.animeffect = document.createElement("c-animeffect");
            this.els.animeffect.setAttribute("active", "");
            this.els.edit?.appendChild(this.els.animeffect);
            /*
            if (this.m.type === TypeT.TOGGLE) {
            } else if (this.m.type === TypeT.INPUT) {
            } else if (this.m.type === TypeT.DSELECT) {
            }
            */ this.els.animeffect.offsetWidth;
            this.els.animeffect.className = "active";
            this.dispatchEvent(new CustomEvent("update", {
                detail: {
                    name: this.m.name,
                    newval,
                    oldval,
                    set_update_fail: this.set_update_fail.bind(this)
                }
            }));
            setTimeout(()=>{
                this.to_updated_result(newval);
            }, 350);
        }
    }
    to_updated_result(newval) {
        this.s.err_msg = "";
        this.s.mode = 3;
        // this triggers attribute changed right away, so mode will be SAVED and thus NOT run further event code, just set the s.val thats it
        this.setAttribute("val", newval);
        if (this.m.type === 2) {
            console.log("about to move forward on toggle mode set");
            this.els.animeffect?.remove();
            this.s.mode = 0;
        } else if (this.m.type === 0) {
            this.to_view();
        } else if (this.m.type === 1) {
            this.to_view();
        }
    }
    to_error_result(reverttoval, error) {
        this.s.err_msg = error || "";
        if (this.m.type === 2) {
            this.els.animeffect?.remove();
            if (reverttoval === "true") {
                this.els.switch.classList.add("istrue");
            } else {
                this.els.switch.classList.remove("istrue");
            }
            this.s.mode = 0;
        } else if (this.m.type === 0) {
            this.s.mode = 4;
            this.setAttribute("val", reverttoval ? reverttoval : this.s.val);
            this.els.input.value = this.s.val;
            this.to_view();
        } else if (this.m.type === 1) {
            this.s.mode = 4;
            this.setAttribute("val", reverttoval ? reverttoval : this.s.val);
            this.to_view();
        }
        console.error("error: unable to save " + this.m.name + " -- " + error);
    }
    to_view() {
        if ((this.s.mode === 3 || this.s.mode === 4) && this.s.isanimating === false) {
            this.s.mode = 1;
            this.s.isanimating = true;
            this.insert_view();
            this.set_animation();
            this.animatehandles.edit.reverse();
            this.animatehandles.view.reverse();
            this.animatehandles.edit.onfinish = ()=>{
                this.s.isanimating = false;
                this.els.edit?.parentElement?.removeChild(this.els.edit);
            };
        }
    }
    set_animation() {
        const a = this.animatehandles;
        const k = this.keyframes;
        k.view = new KeyframeEffect(this.els.view, [
            {
                opacity: 1,
                transform: "perspective(300px) translate3d(0, 0, 0)"
            },
            {
                transform: "perspective(300px) translate3d(0, -21px, 0)",
                opacity: 0
            }
        ], {
            duration: 290,
            easing: "cubic-bezier(.18,.24,.15,1)",
            fill: "both"
        });
        k.edit = new KeyframeEffect(this.els.edit, [
            {
                transform: "perspective(300px) translate3d(0, 21px, 13px) rotateX(72deg)",
                opacity: 0
            },
            {
                transform: "perspective(300px) translate3d(0, 0, 0) rotateX(0)",
                opacity: 1
            }
        ], {
            duration: 290,
            easing: "cubic-bezier(.18,.24,.15,1.0)",
            fill: "both"
        });
        a.view = new Animation(k.view, document.timeline);
        a.edit = new Animation(k.edit, document.timeline);
    }
    gettextofoptionsval() {
        const options = this.getAttribute("options") || "";
        if (options) {
            const options_arr = options.split(",");
            const option = options_arr.find((o)=>o.split(":")[1] === this.s.val);
            return option ? option.split(":")[0] : this.s.val;
        } else {
            return this.s.val;
        }
    }
    /*
    EditDoneClicked() {
        if (this.s.mode === 'edit' && this.s.isanimating === false) {

            const inputel = this.shadow.getElementById("input") as HTMLInputElement
            if (inputel.value === this.s.val) {
                this.to_view()
            }

            else {
                this.to_saving()
            }

        }
    }
    */ sc() {
        render(this.template(), this.shadow);
    }
    template = ()=>{
        return html`{--css--}{--html--}`;
    };
}
//@ts-ignore
customElements.define('c-in', CIn);
export { };
