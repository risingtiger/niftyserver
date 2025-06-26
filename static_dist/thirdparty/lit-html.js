(() => {
  // ../niftyclient/node_modules/@lit/reactive-element/css-tag.js
  var t = globalThis;
  var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
  var s = Symbol();
  var o = /* @__PURE__ */ new WeakMap();
  var n = class {
    constructor(t4, e6, o6) {
      if (this._$cssResult$ = true, o6 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
      this.cssText = t4, this.t = e6;
    }
    get styleSheet() {
      let t4 = this.o;
      const s4 = this.t;
      if (e && void 0 === t4) {
        const e6 = void 0 !== s4 && 1 === s4.length;
        e6 && (t4 = o.get(s4)), void 0 === t4 && ((this.o = t4 = new CSSStyleSheet()).replaceSync(this.cssText), e6 && o.set(s4, t4));
      }
      return t4;
    }
    toString() {
      return this.cssText;
    }
  };
  var r = (t4) => new n("string" == typeof t4 ? t4 : t4 + "", void 0, s);
  var i = (t4, ...e6) => {
    const o6 = 1 === t4.length ? t4[0] : e6.reduce((e7, s4, o7) => e7 + ((t5) => {
      if (true === t5._$cssResult$) return t5.cssText;
      if ("number" == typeof t5) return t5;
      throw Error("Value passed to 'css' function must be a 'css' function result: " + t5 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
    })(s4) + t4[o7 + 1], t4[0]);
    return new n(o6, t4, s);
  };
  var S = (s4, o6) => {
    if (e) s4.adoptedStyleSheets = o6.map((t4) => t4 instanceof CSSStyleSheet ? t4 : t4.styleSheet);
    else for (const e6 of o6) {
      const o7 = document.createElement("style"), n4 = t.litNonce;
      void 0 !== n4 && o7.setAttribute("nonce", n4), o7.textContent = e6.cssText, s4.appendChild(o7);
    }
  };
  var c = e ? (t4) => t4 : (t4) => t4 instanceof CSSStyleSheet ? ((t5) => {
    let e6 = "";
    for (const s4 of t5.cssRules) e6 += s4.cssText;
    return r(e6);
  })(t4) : t4;

  // ../niftyclient/node_modules/@lit/reactive-element/reactive-element.js
  var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
  var a = globalThis;
  var c2 = a.trustedTypes;
  var l = c2 ? c2.emptyScript : "";
  var p = a.reactiveElementPolyfillSupport;
  var d = (t4, s4) => t4;
  var u = { toAttribute(t4, s4) {
    switch (s4) {
      case Boolean:
        t4 = t4 ? l : null;
        break;
      case Object:
      case Array:
        t4 = null == t4 ? t4 : JSON.stringify(t4);
    }
    return t4;
  }, fromAttribute(t4, s4) {
    let i6 = t4;
    switch (s4) {
      case Boolean:
        i6 = null !== t4;
        break;
      case Number:
        i6 = null === t4 ? null : Number(t4);
        break;
      case Object:
      case Array:
        try {
          i6 = JSON.parse(t4);
        } catch (t5) {
          i6 = null;
        }
    }
    return i6;
  } };
  var f = (t4, s4) => !i2(t4, s4);
  var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
  Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
  var y = class extends HTMLElement {
    static addInitializer(t4) {
      this._$Ei(), (this.l ??= []).push(t4);
    }
    static get observedAttributes() {
      return this.finalize(), this._$Eh && [...this._$Eh.keys()];
    }
    static createProperty(t4, s4 = b) {
      if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t4) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t4, s4), !s4.noAccessor) {
        const i6 = Symbol(), h3 = this.getPropertyDescriptor(t4, i6, s4);
        void 0 !== h3 && e2(this.prototype, t4, h3);
      }
    }
    static getPropertyDescriptor(t4, s4, i6) {
      const { get: e6, set: r4 } = h(this.prototype, t4) ?? { get() {
        return this[s4];
      }, set(t5) {
        this[s4] = t5;
      } };
      return { get: e6, set(s5) {
        const h3 = e6?.call(this);
        r4?.call(this, s5), this.requestUpdate(t4, h3, i6);
      }, configurable: true, enumerable: true };
    }
    static getPropertyOptions(t4) {
      return this.elementProperties.get(t4) ?? b;
    }
    static _$Ei() {
      if (this.hasOwnProperty(d("elementProperties"))) return;
      const t4 = n2(this);
      t4.finalize(), void 0 !== t4.l && (this.l = [...t4.l]), this.elementProperties = new Map(t4.elementProperties);
    }
    static finalize() {
      if (this.hasOwnProperty(d("finalized"))) return;
      if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
        const t5 = this.properties, s4 = [...r2(t5), ...o2(t5)];
        for (const i6 of s4) this.createProperty(i6, t5[i6]);
      }
      const t4 = this[Symbol.metadata];
      if (null !== t4) {
        const s4 = litPropertyMetadata.get(t4);
        if (void 0 !== s4) for (const [t5, i6] of s4) this.elementProperties.set(t5, i6);
      }
      this._$Eh = /* @__PURE__ */ new Map();
      for (const [t5, s4] of this.elementProperties) {
        const i6 = this._$Eu(t5, s4);
        void 0 !== i6 && this._$Eh.set(i6, t5);
      }
      this.elementStyles = this.finalizeStyles(this.styles);
    }
    static finalizeStyles(s4) {
      const i6 = [];
      if (Array.isArray(s4)) {
        const e6 = new Set(s4.flat(1 / 0).reverse());
        for (const s5 of e6) i6.unshift(c(s5));
      } else void 0 !== s4 && i6.push(c(s4));
      return i6;
    }
    static _$Eu(t4, s4) {
      const i6 = s4.attribute;
      return false === i6 ? void 0 : "string" == typeof i6 ? i6 : "string" == typeof t4 ? t4.toLowerCase() : void 0;
    }
    constructor() {
      super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
    }
    _$Ev() {
      this._$ES = new Promise((t4) => this.enableUpdating = t4), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t4) => t4(this));
    }
    addController(t4) {
      (this._$EO ??= /* @__PURE__ */ new Set()).add(t4), void 0 !== this.renderRoot && this.isConnected && t4.hostConnected?.();
    }
    removeController(t4) {
      this._$EO?.delete(t4);
    }
    _$E_() {
      const t4 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
      for (const i6 of s4.keys()) this.hasOwnProperty(i6) && (t4.set(i6, this[i6]), delete this[i6]);
      t4.size > 0 && (this._$Ep = t4);
    }
    createRenderRoot() {
      const t4 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
      return S(t4, this.constructor.elementStyles), t4;
    }
    connectedCallback() {
      this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t4) => t4.hostConnected?.());
    }
    enableUpdating(t4) {
    }
    disconnectedCallback() {
      this._$EO?.forEach((t4) => t4.hostDisconnected?.());
    }
    attributeChangedCallback(t4, s4, i6) {
      this._$AK(t4, i6);
    }
    _$ET(t4, s4) {
      const i6 = this.constructor.elementProperties.get(t4), e6 = this.constructor._$Eu(t4, i6);
      if (void 0 !== e6 && true === i6.reflect) {
        const h3 = (void 0 !== i6.converter?.toAttribute ? i6.converter : u).toAttribute(s4, i6.type);
        this._$Em = t4, null == h3 ? this.removeAttribute(e6) : this.setAttribute(e6, h3), this._$Em = null;
      }
    }
    _$AK(t4, s4) {
      const i6 = this.constructor, e6 = i6._$Eh.get(t4);
      if (void 0 !== e6 && this._$Em !== e6) {
        const t5 = i6.getPropertyOptions(e6), h3 = "function" == typeof t5.converter ? { fromAttribute: t5.converter } : void 0 !== t5.converter?.fromAttribute ? t5.converter : u;
        this._$Em = e6, this[e6] = h3.fromAttribute(s4, t5.type) ?? this._$Ej?.get(e6) ?? null, this._$Em = null;
      }
    }
    requestUpdate(t4, s4, i6) {
      if (void 0 !== t4) {
        const e6 = this.constructor, h3 = this[t4];
        if (i6 ??= e6.getPropertyOptions(t4), !((i6.hasChanged ?? f)(h3, s4) || i6.useDefault && i6.reflect && h3 === this._$Ej?.get(t4) && !this.hasAttribute(e6._$Eu(t4, i6)))) return;
        this.C(t4, s4, i6);
      }
      false === this.isUpdatePending && (this._$ES = this._$EP());
    }
    C(t4, s4, { useDefault: i6, reflect: e6, wrapped: h3 }, r4) {
      i6 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t4) && (this._$Ej.set(t4, r4 ?? s4 ?? this[t4]), true !== h3 || void 0 !== r4) || (this._$AL.has(t4) || (this.hasUpdated || i6 || (s4 = void 0), this._$AL.set(t4, s4)), true === e6 && this._$Em !== t4 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t4));
    }
    async _$EP() {
      this.isUpdatePending = true;
      try {
        await this._$ES;
      } catch (t5) {
        Promise.reject(t5);
      }
      const t4 = this.scheduleUpdate();
      return null != t4 && await t4, !this.isUpdatePending;
    }
    scheduleUpdate() {
      return this.performUpdate();
    }
    performUpdate() {
      if (!this.isUpdatePending) return;
      if (!this.hasUpdated) {
        if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
          for (const [t6, s5] of this._$Ep) this[t6] = s5;
          this._$Ep = void 0;
        }
        const t5 = this.constructor.elementProperties;
        if (t5.size > 0) for (const [s5, i6] of t5) {
          const { wrapped: t6 } = i6, e6 = this[s5];
          true !== t6 || this._$AL.has(s5) || void 0 === e6 || this.C(s5, void 0, i6, e6);
        }
      }
      let t4 = false;
      const s4 = this._$AL;
      try {
        t4 = this.shouldUpdate(s4), t4 ? (this.willUpdate(s4), this._$EO?.forEach((t5) => t5.hostUpdate?.()), this.update(s4)) : this._$EM();
      } catch (s5) {
        throw t4 = false, this._$EM(), s5;
      }
      t4 && this._$AE(s4);
    }
    willUpdate(t4) {
    }
    _$AE(t4) {
      this._$EO?.forEach((t5) => t5.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t4)), this.updated(t4);
    }
    _$EM() {
      this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
    }
    get updateComplete() {
      return this.getUpdateComplete();
    }
    getUpdateComplete() {
      return this._$ES;
    }
    shouldUpdate(t4) {
      return true;
    }
    update(t4) {
      this._$Eq &&= this._$Eq.forEach((t5) => this._$ET(t5, this[t5])), this._$EM();
    }
    updated(t4) {
    }
    firstUpdated(t4) {
    }
  };
  y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.0");

  // ../niftyclient/node_modules/lit-html/lit-html.js
  var t2 = globalThis;
  var i3 = t2.trustedTypes;
  var s2 = i3 ? i3.createPolicy("lit-html", { createHTML: (t4) => t4 }) : void 0;
  var e3 = "$lit$";
  var h2 = `lit$${Math.random().toFixed(9).slice(2)}$`;
  var o3 = "?" + h2;
  var n3 = `<${o3}>`;
  var r3 = document;
  var l2 = () => r3.createComment("");
  var c3 = (t4) => null === t4 || "object" != typeof t4 && "function" != typeof t4;
  var a2 = Array.isArray;
  var u2 = (t4) => a2(t4) || "function" == typeof t4?.[Symbol.iterator];
  var d2 = "[ 	\n\f\r]";
  var f2 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
  var v = /-->/g;
  var _ = />/g;
  var m = RegExp(`>|${d2}(?:([^\\s"'>=/]+)(${d2}*=${d2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
  var p2 = /'/g;
  var g = /"/g;
  var $ = /^(?:script|style|textarea|title)$/i;
  var y2 = (t4) => (i6, ...s4) => ({ _$litType$: t4, strings: i6, values: s4 });
  var x = y2(1);
  var b2 = y2(2);
  var w = y2(3);
  var T = Symbol.for("lit-noChange");
  var E = Symbol.for("lit-nothing");
  var A = /* @__PURE__ */ new WeakMap();
  var C = r3.createTreeWalker(r3, 129);
  function P(t4, i6) {
    if (!a2(t4) || !t4.hasOwnProperty("raw")) throw Error("invalid template strings array");
    return void 0 !== s2 ? s2.createHTML(i6) : i6;
  }
  var V = (t4, i6) => {
    const s4 = t4.length - 1, o6 = [];
    let r4, l3 = 2 === i6 ? "<svg>" : 3 === i6 ? "<math>" : "", c4 = f2;
    for (let i7 = 0; i7 < s4; i7++) {
      const s5 = t4[i7];
      let a3, u3, d3 = -1, y3 = 0;
      for (; y3 < s5.length && (c4.lastIndex = y3, u3 = c4.exec(s5), null !== u3); ) y3 = c4.lastIndex, c4 === f2 ? "!--" === u3[1] ? c4 = v : void 0 !== u3[1] ? c4 = _ : void 0 !== u3[2] ? ($.test(u3[2]) && (r4 = RegExp("</" + u3[2], "g")), c4 = m) : void 0 !== u3[3] && (c4 = m) : c4 === m ? ">" === u3[0] ? (c4 = r4 ?? f2, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? m : '"' === u3[3] ? g : p2) : c4 === g || c4 === p2 ? c4 = m : c4 === v || c4 === _ ? c4 = f2 : (c4 = m, r4 = void 0);
      const x2 = c4 === m && t4[i7 + 1].startsWith("/>") ? " " : "";
      l3 += c4 === f2 ? s5 + n3 : d3 >= 0 ? (o6.push(a3), s5.slice(0, d3) + e3 + s5.slice(d3) + h2 + x2) : s5 + h2 + (-2 === d3 ? i7 : x2);
    }
    return [P(t4, l3 + (t4[s4] || "<?>") + (2 === i6 ? "</svg>" : 3 === i6 ? "</math>" : "")), o6];
  };
  var N = class _N {
    constructor({ strings: t4, _$litType$: s4 }, n4) {
      let r4;
      this.parts = [];
      let c4 = 0, a3 = 0;
      const u3 = t4.length - 1, d3 = this.parts, [f3, v2] = V(t4, s4);
      if (this.el = _N.createElement(f3, n4), C.currentNode = this.el.content, 2 === s4 || 3 === s4) {
        const t5 = this.el.content.firstChild;
        t5.replaceWith(...t5.childNodes);
      }
      for (; null !== (r4 = C.nextNode()) && d3.length < u3; ) {
        if (1 === r4.nodeType) {
          if (r4.hasAttributes()) for (const t5 of r4.getAttributeNames()) if (t5.endsWith(e3)) {
            const i6 = v2[a3++], s5 = r4.getAttribute(t5).split(h2), e6 = /([.?@])?(.*)/.exec(i6);
            d3.push({ type: 1, index: c4, name: e6[2], strings: s5, ctor: "." === e6[1] ? H : "?" === e6[1] ? I : "@" === e6[1] ? L : k }), r4.removeAttribute(t5);
          } else t5.startsWith(h2) && (d3.push({ type: 6, index: c4 }), r4.removeAttribute(t5));
          if ($.test(r4.tagName)) {
            const t5 = r4.textContent.split(h2), s5 = t5.length - 1;
            if (s5 > 0) {
              r4.textContent = i3 ? i3.emptyScript : "";
              for (let i6 = 0; i6 < s5; i6++) r4.append(t5[i6], l2()), C.nextNode(), d3.push({ type: 2, index: ++c4 });
              r4.append(t5[s5], l2());
            }
          }
        } else if (8 === r4.nodeType) if (r4.data === o3) d3.push({ type: 2, index: c4 });
        else {
          let t5 = -1;
          for (; -1 !== (t5 = r4.data.indexOf(h2, t5 + 1)); ) d3.push({ type: 7, index: c4 }), t5 += h2.length - 1;
        }
        c4++;
      }
    }
    static createElement(t4, i6) {
      const s4 = r3.createElement("template");
      return s4.innerHTML = t4, s4;
    }
  };
  function S2(t4, i6, s4 = t4, e6) {
    if (i6 === T) return i6;
    let h3 = void 0 !== e6 ? s4._$Co?.[e6] : s4._$Cl;
    const o6 = c3(i6) ? void 0 : i6._$litDirective$;
    return h3?.constructor !== o6 && (h3?._$AO?.(false), void 0 === o6 ? h3 = void 0 : (h3 = new o6(t4), h3._$AT(t4, s4, e6)), void 0 !== e6 ? (s4._$Co ??= [])[e6] = h3 : s4._$Cl = h3), void 0 !== h3 && (i6 = S2(t4, h3._$AS(t4, i6.values), h3, e6)), i6;
  }
  var M = class {
    constructor(t4, i6) {
      this._$AV = [], this._$AN = void 0, this._$AD = t4, this._$AM = i6;
    }
    get parentNode() {
      return this._$AM.parentNode;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    u(t4) {
      const { el: { content: i6 }, parts: s4 } = this._$AD, e6 = (t4?.creationScope ?? r3).importNode(i6, true);
      C.currentNode = e6;
      let h3 = C.nextNode(), o6 = 0, n4 = 0, l3 = s4[0];
      for (; void 0 !== l3; ) {
        if (o6 === l3.index) {
          let i7;
          2 === l3.type ? i7 = new R(h3, h3.nextSibling, this, t4) : 1 === l3.type ? i7 = new l3.ctor(h3, l3.name, l3.strings, this, t4) : 6 === l3.type && (i7 = new z(h3, this, t4)), this._$AV.push(i7), l3 = s4[++n4];
        }
        o6 !== l3?.index && (h3 = C.nextNode(), o6++);
      }
      return C.currentNode = r3, e6;
    }
    p(t4) {
      let i6 = 0;
      for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t4, s4, i6), i6 += s4.strings.length - 2) : s4._$AI(t4[i6])), i6++;
    }
  };
  var R = class _R {
    get _$AU() {
      return this._$AM?._$AU ?? this._$Cv;
    }
    constructor(t4, i6, s4, e6) {
      this.type = 2, this._$AH = E, this._$AN = void 0, this._$AA = t4, this._$AB = i6, this._$AM = s4, this.options = e6, this._$Cv = e6?.isConnected ?? true;
    }
    get parentNode() {
      let t4 = this._$AA.parentNode;
      const i6 = this._$AM;
      return void 0 !== i6 && 11 === t4?.nodeType && (t4 = i6.parentNode), t4;
    }
    get startNode() {
      return this._$AA;
    }
    get endNode() {
      return this._$AB;
    }
    _$AI(t4, i6 = this) {
      t4 = S2(this, t4, i6), c3(t4) ? t4 === E || null == t4 || "" === t4 ? (this._$AH !== E && this._$AR(), this._$AH = E) : t4 !== this._$AH && t4 !== T && this._(t4) : void 0 !== t4._$litType$ ? this.$(t4) : void 0 !== t4.nodeType ? this.T(t4) : u2(t4) ? this.k(t4) : this._(t4);
    }
    O(t4) {
      return this._$AA.parentNode.insertBefore(t4, this._$AB);
    }
    T(t4) {
      this._$AH !== t4 && (this._$AR(), this._$AH = this.O(t4));
    }
    _(t4) {
      this._$AH !== E && c3(this._$AH) ? this._$AA.nextSibling.data = t4 : this.T(r3.createTextNode(t4)), this._$AH = t4;
    }
    $(t4) {
      const { values: i6, _$litType$: s4 } = t4, e6 = "number" == typeof s4 ? this._$AC(t4) : (void 0 === s4.el && (s4.el = N.createElement(P(s4.h, s4.h[0]), this.options)), s4);
      if (this._$AH?._$AD === e6) this._$AH.p(i6);
      else {
        const t5 = new M(e6, this), s5 = t5.u(this.options);
        t5.p(i6), this.T(s5), this._$AH = t5;
      }
    }
    _$AC(t4) {
      let i6 = A.get(t4.strings);
      return void 0 === i6 && A.set(t4.strings, i6 = new N(t4)), i6;
    }
    k(t4) {
      a2(this._$AH) || (this._$AH = [], this._$AR());
      const i6 = this._$AH;
      let s4, e6 = 0;
      for (const h3 of t4) e6 === i6.length ? i6.push(s4 = new _R(this.O(l2()), this.O(l2()), this, this.options)) : s4 = i6[e6], s4._$AI(h3), e6++;
      e6 < i6.length && (this._$AR(s4 && s4._$AB.nextSibling, e6), i6.length = e6);
    }
    _$AR(t4 = this._$AA.nextSibling, i6) {
      for (this._$AP?.(false, true, i6); t4 && t4 !== this._$AB; ) {
        const i7 = t4.nextSibling;
        t4.remove(), t4 = i7;
      }
    }
    setConnected(t4) {
      void 0 === this._$AM && (this._$Cv = t4, this._$AP?.(t4));
    }
  };
  var k = class {
    get tagName() {
      return this.element.tagName;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    constructor(t4, i6, s4, e6, h3) {
      this.type = 1, this._$AH = E, this._$AN = void 0, this.element = t4, this.name = i6, this._$AM = e6, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = E;
    }
    _$AI(t4, i6 = this, s4, e6) {
      const h3 = this.strings;
      let o6 = false;
      if (void 0 === h3) t4 = S2(this, t4, i6, 0), o6 = !c3(t4) || t4 !== this._$AH && t4 !== T, o6 && (this._$AH = t4);
      else {
        const e7 = t4;
        let n4, r4;
        for (t4 = h3[0], n4 = 0; n4 < h3.length - 1; n4++) r4 = S2(this, e7[s4 + n4], i6, n4), r4 === T && (r4 = this._$AH[n4]), o6 ||= !c3(r4) || r4 !== this._$AH[n4], r4 === E ? t4 = E : t4 !== E && (t4 += (r4 ?? "") + h3[n4 + 1]), this._$AH[n4] = r4;
      }
      o6 && !e6 && this.j(t4);
    }
    j(t4) {
      t4 === E ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t4 ?? "");
    }
  };
  var H = class extends k {
    constructor() {
      super(...arguments), this.type = 3;
    }
    j(t4) {
      this.element[this.name] = t4 === E ? void 0 : t4;
    }
  };
  var I = class extends k {
    constructor() {
      super(...arguments), this.type = 4;
    }
    j(t4) {
      this.element.toggleAttribute(this.name, !!t4 && t4 !== E);
    }
  };
  var L = class extends k {
    constructor(t4, i6, s4, e6, h3) {
      super(t4, i6, s4, e6, h3), this.type = 5;
    }
    _$AI(t4, i6 = this) {
      if ((t4 = S2(this, t4, i6, 0) ?? E) === T) return;
      const s4 = this._$AH, e6 = t4 === E && s4 !== E || t4.capture !== s4.capture || t4.once !== s4.once || t4.passive !== s4.passive, h3 = t4 !== E && (s4 === E || e6);
      e6 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t4), this._$AH = t4;
    }
    handleEvent(t4) {
      "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t4) : this._$AH.handleEvent(t4);
    }
  };
  var z = class {
    constructor(t4, i6, s4) {
      this.element = t4, this.type = 6, this._$AN = void 0, this._$AM = i6, this.options = s4;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AI(t4) {
      S2(this, t4);
    }
  };
  var j = t2.litHtmlPolyfillSupport;
  j?.(N, R), (t2.litHtmlVersions ??= []).push("3.3.0");
  var B = (t4, i6, s4) => {
    const e6 = s4?.renderBefore ?? i6;
    let h3 = e6._$litPart$;
    if (void 0 === h3) {
      const t5 = s4?.renderBefore ?? null;
      e6._$litPart$ = h3 = new R(i6.insertBefore(l2(), t5), t5, void 0, s4 ?? {});
    }
    return h3._$AI(t4), h3;
  };

  // ../niftyclient/node_modules/lit-element/lit-element.js
  var s3 = globalThis;
  var i4 = class extends y {
    constructor() {
      super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
    }
    createRenderRoot() {
      const t4 = super.createRenderRoot();
      return this.renderOptions.renderBefore ??= t4.firstChild, t4;
    }
    update(t4) {
      const r4 = this.render();
      this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t4), this._$Do = B(r4, this.renderRoot, this.renderOptions);
    }
    connectedCallback() {
      super.connectedCallback(), this._$Do?.setConnected(true);
    }
    disconnectedCallback() {
      super.disconnectedCallback(), this._$Do?.setConnected(false);
    }
    render() {
      return T;
    }
  };
  i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
  var o4 = s3.litElementPolyfillSupport;
  o4?.({ LitElement: i4 });
  (s3.litElementVersions ??= []).push("4.2.0");

  // ../niftyclient/node_modules/lit-html/directive.js
  var t3 = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 };
  var e4 = (t4) => (...e6) => ({ _$litDirective$: t4, values: e6 });
  var i5 = class {
    constructor(t4) {
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AT(t4, e6, i6) {
      this._$Ct = t4, this._$AM = e6, this._$Ci = i6;
    }
    _$AS(t4, e6) {
      return this.update(t4, e6);
    }
    update(t4, e6) {
      return this.render(...e6);
    }
  };

  // ../niftyclient/node_modules/lit-html/directives/unsafe-html.js
  var e5 = class extends i5 {
    constructor(i6) {
      if (super(i6), this.it = E, i6.type !== t3.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
    }
    render(r4) {
      if (r4 === E || null == r4) return this._t = void 0, this.it = r4;
      if (r4 === T) return r4;
      if ("string" != typeof r4) throw Error(this.constructor.directiveName + "() called with a non-string value");
      if (r4 === this.it) return this._t;
      this.it = r4;
      const s4 = [r4];
      return s4.raw = s4, this._t = { _$litType$: this.constructor.resultType, strings: s4, values: [] };
    }
  };
  e5.directiveName = "unsafeHTML", e5.resultType = 1;
  var o5 = e4(e5);

  // ../niftyclient/thirdparty/lit-html.ts
  window.render = B;
  window.html = x;
  window.Lit_Element = i4;
  window.Lit_UnsafeHtml = o5;
  window.Lit_Css = i;
})();
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
lit-html/directive.js:
lit-html/directives/unsafe-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
