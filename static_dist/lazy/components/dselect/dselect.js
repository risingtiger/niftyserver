(() => {
  // ../../.nifty/files/lazy/components/dselect/dselect.js
  var ModeE = function(ModeE2) {
    ModeE2[ModeE2["CLOSED"] = 0] = "CLOSED";
    ModeE2[ModeE2["OPEN"] = 1] = "OPEN";
    return ModeE2;
  }(ModeE || {});
  var TypeE = function(TypeE2) {
    TypeE2[TypeE2["SELECTBOX"] = 0] = "SELECTBOX";
    TypeE2[TypeE2["MENU"] = 1] = "MENU";
    TypeE2[TypeE2["GENERAL"] = 1] = "GENERAL";
    return TypeE2;
  }(TypeE || {});
  var DUMMY_EL = document.createElement("div");
  var CDselect = class extends HTMLElement {
    s;
    m;
    els;
    animatehandles;
    keyframes;
    shadow;
    static get observedAttributes() {
      return ["term", "val", "open"];
    }
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "open" });
      this.s = { mode: 0, isanimating: false, instigator_term: "", options: [], options_str: "", val: "", term: "", did_first_run: false, focusedOptionIndex: -1 };
      this.m = { type: 0 };
      this.els = { instigator: DUMMY_EL, instigator_cnt: DUMMY_EL, dialog_view: DUMMY_EL, option_items_ul: null };
      this.animatehandles = { view: null, instigator: null };
      this.keyframes = { view: null, instigator: null };
    }
    connectedCallback() {
      this.s.options_str = this.getAttribute("options") || "";
      this.s.val = this.getAttribute("val") || "";
      const typestr = this.getAttribute("type") || (this.s.options_str ? "selectbox" : "general");
      switch (typestr) {
        case "selectbox":
          this.m.type = 0;
          break;
        case "menu":
          this.m.type = 1;
          break;
        default:
          this.m.type = 1;
          break;
      }
      if (this.s.options_str) this.s.options = parse_options(this.s.options_str);
      this.s.term = set_term(this.getAttribute("term"), this.m.type, this.s.options, this.s.val);
      this.sc();
      this.els.instigator = this.shadow.getElementById("instigator");
      this.els.instigator_cnt = this.els.instigator.querySelector(".cnt");
      this.els.dialog_view = this.shadow.getElementById("dialog_view");
      this.els.instigator.setAttribute("role", "combobox");
      this.els.instigator.setAttribute("aria-haspopup", "listbox");
      this.els.instigator.setAttribute("aria-expanded", "false");
      this.els.instigator.setAttribute("tabindex", "0");
      this.els.instigator.addEventListener("click", () => this.instigator_clicked());
      this.els.instigator.addEventListener("keydown", (event) => this.instigator_keydown(event));
      this.els.dialog_view.addEventListener("click", (e) => this.dialog_clicked(e));
      document.addEventListener("keydown", (event) => this.document_keydown(event));
      this.s.did_first_run = true;
      if (this.hasAttribute("open")) {
        setTimeout(() => this.to_open(), 20);
      }
    }
    async attributeChangedCallback(name, old_val, new_val) {
      if (this.s.did_first_run === false) return;
      if (name === "term") {
        this.s.term = set_term(new_val, this.m.type, this.s.options, this.s.val);
        this.sc();
      } else if (name === "val") {
        this.s.val = new_val;
        this.sc();
        if (this.s.mode === 1 && this.m.type === 0) {
          set_active_option(this.els.dialog_view, new_val);
        }
      } else if (name === "open" && new_val === "" && old_val === null && this.s.mode === 0) {
        this.to_open();
      } else if (name === "open" && new_val === null && old_val === "" && this.s.mode === 1) {
        this.to_closed();
      }
    }
    sc() {
      render(this.template(this.s), this.shadow);
    }
    dialog_clicked(e) {
      if (e.target === this.els.dialog_view && this.s.mode === 1) {
        this.removeAttribute("open");
        this.dispatchEvent(new CustomEvent("cancelled", {}));
      }
    }
    instigator_clicked() {
      this.setAttribute("open", "");
    }
    instigator_keydown(event) {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (this.s.mode === 0) {
          this.setAttribute("open", "");
        } else {
          this.removeAttribute("open");
        }
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (this.s.mode === 0) {
          this.setAttribute("open", "");
        }
        setTimeout(() => this.focusOption(0), 100);
      }
    }
    document_keydown(event) {
      if (event.key === "Escape" && this.s.mode === 1) {
        event.preventDefault();
        this.removeAttribute("open");
        this.els.instigator.focus();
      }
    }
    options_keydown(event) {
      const optionsLength = this.s.options.length;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.s.focusedOptionIndex = (this.s.focusedOptionIndex + 1) % optionsLength;
        this.focusOption(this.s.focusedOptionIndex);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this.s.focusedOptionIndex = (this.s.focusedOptionIndex - 1 + optionsLength) % optionsLength;
        this.focusOption(this.s.focusedOptionIndex);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.selectOption(this.s.focusedOptionIndex);
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.removeAttribute("open");
        this.els.instigator.focus();
      }
    }
    focusOption(index) {
      if (!this.els.option_items_ul) return;
      const options = this.els.option_items_ul.querySelectorAll("li");
      if (options.length === 0) return;
      options.forEach((option) => {
        option.setAttribute("tabindex", "-1");
        option.classList.remove("focused");
      });
      const optionToFocus = options[index];
      optionToFocus.setAttribute("tabindex", "0");
      optionToFocus.focus();
      optionToFocus.classList.add("focused");
      this.els.instigator.setAttribute("aria-activedescendant", optionToFocus.id);
    }
    selectOption(index) {
      const option = this.s.options[index];
      if (option) {
        const detail = {};
        detail.newval = option.val;
        detail.oldval = this.s.val;
        this.setAttribute("val", option.val);
        this.setAttribute("term", option.label);
        setTimeout(() => {
          this.removeAttribute("open");
          this.dispatchEvent(new CustomEvent("update", { detail }));
          this.els.instigator.focus();
        }, 200);
      }
    }
    async option_clicked(e) {
      const el = e.currentTarget;
      const detail = {};
      const val = el.getAttribute("val");
      const term = el.querySelector("h5").textContent;
      detail.newval = val;
      detail.oldval = this.s.val;
      this.setAttribute("val", val);
      this.setAttribute("term", term);
      setTimeout(() => {
        this.removeAttribute("open");
        this.dispatchEvent(new CustomEvent("update", { detail }));
        this.els.instigator.focus();
      }, 200);
    }
    to_open = () => {
      if (this.s.mode === 0 && this.s.isanimating === false) {
        const xy = this.els.instigator.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const margin = 3;
        if (this.m.type === 0 || this.m.type === 1) {
          const option_items_ul = render_options(this.s.options, this.s.val, this.m.type, this.option_clicked.bind(this));
          const existing_ul = this.shadow.getElementById("option_items");
          if (existing_ul) {
            existing_ul.remove();
          }
          this.els.dialog_view.querySelector("#dialog_wrap").prepend(option_items_ul);
          this.els.option_items_ul = option_items_ul;
          option_items_ul.setAttribute("role", "listbox");
          option_items_ul.addEventListener("keydown", (event) => this.options_keydown(event));
        }
        this.els.instigator.setAttribute("aria-expanded", "true");
        this.els.dialog_view.style.visibility = "hidden";
        this.els.dialog_view.style.display = "block";
        const dialogContent = this.els.dialog_view.querySelector("#dialog_wrap");
        const contentHeight = dialogContent.offsetHeight;
        const contentWidth = dialogContent.offsetWidth;
        const dialogHeight = contentHeight + 7;
        const dialogWidth = contentWidth;
        const width = `${dialogWidth}px`;
        this.els.dialog_view.style.display = "";
        this.els.dialog_view.style.visibility = "";
        const height = `${dialogHeight}px`;
        let top;
        if (xy.bottom + dialogHeight + margin <= viewportHeight) {
          top = xy.bottom + margin;
        } else if (xy.top - dialogHeight - margin >= 0) {
          top = xy.top - dialogHeight - margin;
        } else {
          top = Math.max(0, (viewportHeight - dialogHeight) / 2);
        }
        let left;
        if (xy.left + dialogWidth + margin <= viewportWidth) {
          left = xy.left;
        } else if (xy.right - dialogWidth - margin >= 0) {
          left = xy.right - dialogWidth;
        } else {
          left = Math.max(0, (viewportWidth - dialogWidth) / 2);
        }
        this.els.dialog_view.style.width = width;
        this.els.dialog_view.style.height = height;
        this.els.dialog_view.style.top = `${top}px`;
        this.els.dialog_view.style.left = `${left}px`;
        this.els.dialog_view.showModal();
        this.s.mode = 1;
        this.sc();
        this.s.focusedOptionIndex = 0;
        setTimeout(() => this.focusOption(this.s.focusedOptionIndex), 100);
      }
    };
    to_closed = () => new Promise((resolve) => {
      if (this.s.mode === 1 && this.s.isanimating === false) {
        this.sc();
        this.s.mode = 0;
        this.els.dialog_view.classList.add("closing");
        this.els.instigator.setAttribute("aria-expanded", "false");
        this.els.instigator.removeAttribute("aria-activedescendant");
        setTimeout(() => {
          this.els.dialog_view.classList.remove("closing");
          this.els.dialog_view.close();
          resolve();
        }, 400);
      }
    });
    animate_view_end() {
      if (this.animatehandles.view.currentTime === 0) {
      } else {
      }
      this.s.isanimating = false;
    }
    animate_instigator_end() {
      if (this.animatehandles.instigator.currentTime === 0) {
      } else {
      }
    }
    template = (_s) => {
      return html`<style>:host {
    display: inline-block;
}

:host > #instigator {
	display: flex;
	justify-content: space-between;
    cursor: pointer;
    position: relative;
    padding: 7px 5px 8px 8px;
    border: 1px solid #cecece;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
    background: white;
	outline: none;
	cursor:pointer;

    & > [name='instigator'] > .cnt {
        color: #6d6d6d;
        font-size: 14px;
        display: flex;
        align-items: center;
        height: 100%;
    }

    & > [name='instigator'] > .crt {
        position: absolute;
        transform: rotate(90deg);
        top: 0;
        right: 0;
    }

    & > [name='instigator'] > svg {
        color: #7e7e7e;
        width: 1rem;
        height: 1rem;
        position: relative;
        top: 1px;
    }
}
:host > #instigator:hover {
	background: var(--background-highlight);
}

::part(instigator) {
}



:host > dialog {
    position: relative;
    margin: 0;
    background-color: white;
    box-shadow: 0 3px 5px 0px rgb(0 0 0 / 10%);
    padding: 0;
    border-radius: 6px;
    border: 1px solid #dfdfdf;
    padding: 0;
    inset: 0;
    outline: none;
    opacity: 0;
	transform: translateY(-40px) scale(0.73);
	transition: 0.25s cubic-bezier(0.13, 0.15, 0.35, 1);
	transition-property: opacity, transform;

    &[open] {
        opacity: 1;
        transform: translateY(0) scale(1);
        @starting-style {
            opacity: 0;
            transform: translateY(-10px) scale(0.96);
        }
    }

    &.closing {
        opacity: 0;
        transform: translateY(8px) scale(0.96);
    }

    & > #dialog_wrap {
        width: 100%;

        & > ul.options {
            list-style-type: none;
            padding: 5px 4px;
            margin: 0;
            max-height: 500px;
            overflow-y: scroll;

            & > li {
                display: flex;
                justify-content: space-between;
                padding: 7px 4px 9px 8px;
                cursor: pointer;

                & > .postpend {
                    width: 18px;
                    min-height: 10px;
                    display: block;
                }

                & > h5 {
                    margin: 0;
                    font-size: 13px;
                    color: #787878;
                    padding-top: 2px;
                    -webkit-font-smoothing: antialiased;
                    text-wrap: nowrap;
                }
                margin-bottom: 4px;
            }
            & > li:hover {
                background-color: #f3f3f3;
            }
            & > li.selected {
                background-color: #f3f3f3;
                border-radius: 5px;

                & > .postpend::before {
                    content: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http://www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2019%2019%22%20fill%3D%22none%22%20stroke%3D%22gray%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M5%2013l4%204L19%207%22/%3E%3C/svg%3E");
                }
            }
        }
    }
}
:host > dialog::backdrop {
    background-color: rgba(0, 0, 0, 0);
}
</style>
<span id="instigator" part="instigator">
	<slot name="instigator">
		<span class="cnt">${_s.term}</span>
		<!--<span class="crt">ᗏ</span>-->
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down h-4 w-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
	</slot>
</span>
<dialog id="dialog_view">
    <div id="dialog_wrap">
        <slot></slot>
    </div>
</dialog>
`;
    };
  };
  customElements.define("c-dselect", CDselect);
  function render_options(options, options_val, type, option_clicked) {
    const ulitemsel = document.createElement("ul");
    ulitemsel.classList.add("options");
    ulitemsel.id = "option_items";
    ulitemsel.classList.add("items");
    ulitemsel.setAttribute("role", "listbox");
    options.forEach((x, index) => {
      const liel = document.createElement("li");
      const h5el = document.createElement("h5");
      h5el.textContent = x.label;
      liel.setAttribute("val", x.val);
      liel.appendChild(h5el);
      if (x.val === options_val && type === 0) {
        liel.classList.add("selected");
      } else {
        liel.insertAdjacentHTML("beforeend", `<span class='postpend'></span>`);
      }
      liel.insertAdjacentHTML("beforeend", `<span class='postpend'></span>`);
      liel.addEventListener("click", (e) => option_clicked(e));
      liel.setAttribute("role", "option");
      liel.setAttribute("tabindex", "-1");
      liel.id = `option-${index}`;
      ulitemsel.appendChild(liel);
    });
    return ulitemsel;
  }
  function parse_options(options_str) {
    const options = options_str.split(",").map((x, _i) => {
      const parts = x.trim().split(":");
      return { label: parts[0], val: parts[1] ?? parts[0] };
    });
    return options;
  }
  function set_term(term, type, options, val) {
    if (term) {
      return term;
    } else if (!term && (type === 0 || type === 1)) {
      const option = options ? options.find((o) => o.val === val) : null;
      return option ? option.label : val;
    } else {
      return val;
    }
  }
  function set_active_option(dialog_view_el, val) {
    const option_els = dialog_view_el.querySelectorAll("#option_items > li");
    option_els.forEach((x, _i) => {
      x.classList.remove("selected");
    });
    const active_li_el = dialog_view_el.querySelector(`#option_items > li[val='${val}']`);
    if (active_li_el) {
      active_li_el.classList.add("selected");
    }
  }
})();
