const ATTRIBUTES = {
    propa: ""
};
class VPMachineNnotification extends HTMLElement {
    a = {
        ...ATTRIBUTES
    };
    s = {
        errRows: []
    };
    m = {
        propa: ""
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
        await $N.CMech.ViewPartConnectedCallback(this);
        this.dispatchEvent(new Event('hydrated'));
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewPartDisconnectedCallback(this);
    }
    kd = ()=>{};
    addNotification(title, errmsg, ts, bitName, type) {
        if (!this.s.errRows.find((err)=>err.bitName === bitName)) {
            const errRowData = {
                bitName: bitName,
                msg: errmsg,
                title: title,
                ts: ts,
                datetime: new Date(ts * 1000).toLocaleString(),
                element: null
            };
            this.s.errRows.unshift(errRowData);
            // Create the errrow div
            const errRowEl = document.createElement('div');
            errRowEl.className = 'errrow ' + type;
            // Create the contents of errrow
            const titleEl = document.createElement('div');
            titleEl.className = 'errrowtitle';
            titleEl.textContent = errRowData.title;
            const msgEl = document.createElement('div');
            msgEl.className = 'errrowmsg';
            msgEl.textContent = errRowData.msg;
            const datetimeEl = document.createElement('div');
            datetimeEl.className = 'errrowdatetime';
            datetimeEl.textContent = errRowData.datetime;
            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', ()=>this.dismissAlert(bitName));
            // Append elements to errrow
            errRowEl.appendChild(titleEl);
            errRowEl.appendChild(msgEl);
            errRowEl.appendChild(datetimeEl);
            errRowEl.appendChild(closeBtn);
            errRowData.element = errRowEl;
            const containerEl = this.shadow.querySelector('.errrow-container');
            containerEl.style.height = `${this.s.errRows.length * 85}px`;
            containerEl.insertBefore(errRowEl, containerEl.firstChild);
            setTimeout(()=>{
                errRowEl.setAttribute('active', '');
            }, 30);
        }
        this.setAttribute('active', '');
    }
    dismissAlert(bitName) {
        const index = this.s.errRows.findIndex((err)=>err.bitName === bitName);
        if (index > -1) {
            const errRowData = this.s.errRows[index];
            const errRowEl = errRowData.element;
            if (errRowEl) {
                errRowEl.classList.add('exit');
                errRowEl.addEventListener('transitionend', ()=>{
                    errRowEl.remove();
                    this.s.errRows.splice(index, 1);
                    const containerEl = this.shadow.querySelector('.errrow-container');
                    containerEl.style.height = `${this.s.errRows.length * 85}px`;
                    if (this.s.errRows.length === 0) {
                        this.removeAttribute('active');
                    }
                }, {
                    once: true
                });
            }
        }
    }
    async sc() {
        render(this.template(), this.shadow);
    }
    template = ()=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('vp-machine-notification', VPMachineNnotification);
export { };
