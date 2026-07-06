/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const kt = globalThis, Ht = kt.ShadowRoot && (kt.ShadyCSS === void 0 || kt.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Wt = Symbol(), Xt = /* @__PURE__ */ new WeakMap();
let ve = class {
  constructor(e, i, n) {
    if (this._$cssResult$ = !0, n !== Wt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (Ht && e === void 0) {
      const n = i !== void 0 && i.length === 1;
      n && (e = Xt.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && Xt.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Pe = (t) => new ve(typeof t == "string" ? t : t + "", void 0, Wt), rt = (t, ...e) => {
  const i = t.length === 1 ? t[0] : e.reduce((n, r, o) => n + ((s) => {
    if (s._$cssResult$ === !0) return s.cssText;
    if (typeof s == "number") return s;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + s + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + t[o + 1], t[0]);
  return new ve(i, t, Wt);
}, Re = (t, e) => {
  if (Ht) t.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const n = document.createElement("style"), r = kt.litNonce;
    r !== void 0 && n.setAttribute("nonce", r), n.textContent = i.cssText, t.appendChild(n);
  }
}, Jt = Ht ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const n of e.cssRules) i += n.cssText;
  return Pe(i);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Le, defineProperty: je, getOwnPropertyDescriptor: Me, getOwnPropertyNames: ze, getOwnPropertySymbols: Ue, getPrototypeOf: De } = Object, D = globalThis, Kt = D.trustedTypes, He = Kt ? Kt.emptyScript : "", Tt = D.reactiveElementPolyfillSupport, ct = (t, e) => t, At = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? He : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let i = t;
  switch (e) {
    case Boolean:
      i = t !== null;
      break;
    case Number:
      i = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(t);
      } catch {
        i = null;
      }
  }
  return i;
} }, Bt = (t, e) => !Le(t, e), Zt = { attribute: !0, type: String, converter: At, reflect: !1, useDefault: !1, hasChanged: Bt };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), D.litPropertyMetadata ?? (D.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let tt = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = Zt) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const n = Symbol(), r = this.getPropertyDescriptor(e, n, i);
      r !== void 0 && je(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, i, n) {
    const { get: r, set: o } = Me(this.prototype, e) ?? { get() {
      return this[i];
    }, set(s) {
      this[i] = s;
    } };
    return { get: r, set(s) {
      const l = r == null ? void 0 : r.call(this);
      o == null || o.call(this, s), this.requestUpdate(e, l, n);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Zt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(ct("elementProperties"))) return;
    const e = De(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(ct("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(ct("properties"))) {
      const i = this.properties, n = [...ze(i), ...Ue(i)];
      for (const r of n) this.createProperty(r, i[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [n, r] of i) this.elementProperties.set(n, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, n] of this.elementProperties) {
      const r = this._$Eu(i, n);
      r !== void 0 && this._$Eh.set(r, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const n = new Set(e.flat(1 / 0).reverse());
      for (const r of n) i.unshift(Jt(r));
    } else e !== void 0 && i.push(Jt(e));
    return i;
  }
  static _$Eu(e, i) {
    const n = i.attribute;
    return n === !1 ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((i) => this.enableUpdating = i), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((i) => i(this));
  }
  addController(e) {
    var i;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((i = e.hostConnected) == null || i.call(e));
  }
  removeController(e) {
    var i;
    (i = this._$EO) == null || i.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const n of i.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Re(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((i) => {
      var n;
      return (n = i.hostConnected) == null ? void 0 : n.call(i);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var n;
      return (n = i.hostDisconnected) == null ? void 0 : n.call(i);
    });
  }
  attributeChangedCallback(e, i, n) {
    this._$AK(e, n);
  }
  _$ET(e, i) {
    var o;
    const n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
    if (r !== void 0 && n.reflect === !0) {
      const s = (((o = n.converter) == null ? void 0 : o.toAttribute) !== void 0 ? n.converter : At).toAttribute(i, n.type);
      this._$Em = e, s == null ? this.removeAttribute(r) : this.setAttribute(r, s), this._$Em = null;
    }
  }
  _$AK(e, i) {
    var o, s;
    const n = this.constructor, r = n._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const l = n.getPropertyOptions(r), a = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((o = l.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? l.converter : At;
      this._$Em = r;
      const c = a.fromAttribute(i, l.type);
      this[r] = c ?? ((s = this._$Ej) == null ? void 0 : s.get(r)) ?? c, this._$Em = null;
    }
  }
  requestUpdate(e, i, n, r = !1, o) {
    var s;
    if (e !== void 0) {
      const l = this.constructor;
      if (r === !1 && (o = this[e]), n ?? (n = l.getPropertyOptions(e)), !((n.hasChanged ?? Bt)(o, i) || n.useDefault && n.reflect && o === ((s = this._$Ej) == null ? void 0 : s.get(e)) && !this.hasAttribute(l._$Eu(e, n)))) return;
      this.C(e, i, n);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: n, reflect: r, wrapped: o }, s) {
    n && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, s ?? i ?? this[e]), o !== !0 || s !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (i = void 0), this._$AL.set(e, i)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var n;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [o, s] of this._$Ep) this[o] = s;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [o, s] of r) {
        const { wrapped: l } = s, a = this[o];
        l !== !0 || this._$AL.has(o) || a === void 0 || this.C(o, void 0, s, a);
      }
    }
    let e = !1;
    const i = this._$AL;
    try {
      e = this.shouldUpdate(i), e ? (this.willUpdate(i), (n = this._$EO) == null || n.forEach((r) => {
        var o;
        return (o = r.hostUpdate) == null ? void 0 : o.call(r);
      }), this.update(i)) : this._$EM();
    } catch (r) {
      throw e = !1, this._$EM(), r;
    }
    e && this._$AE(i);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var i;
    (i = this._$EO) == null || i.forEach((n) => {
      var r;
      return (r = n.hostUpdated) == null ? void 0 : r.call(n);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((i) => this._$ET(i, this[i]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
tt.elementStyles = [], tt.shadowRootOptions = { mode: "open" }, tt[ct("elementProperties")] = /* @__PURE__ */ new Map(), tt[ct("finalized")] = /* @__PURE__ */ new Map(), Tt == null || Tt({ ReactiveElement: tt }), (D.reactiveElementVersions ?? (D.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const dt = globalThis, Qt = (t) => t, It = dt.trustedTypes, te = It ? It.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, me = "$lit$", z = `lit$${Math.random().toFixed(9).slice(2)}$`, be = "?" + z, We = `<${be}>`, J = document, gt = () => J.createComment(""), $t = (t) => t === null || typeof t != "object" && typeof t != "function", Vt = Array.isArray, Be = (t) => Vt(t) || typeof (t == null ? void 0 : t[Symbol.iterator]) == "function", Ct = `[ 	
\f\r]`, at = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ee = /-->/g, ie = />/g, W = RegExp(`>|${Ct}(?:([^\\s"'>=/]+)(${Ct}*=${Ct}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ne = /'/g, re = /"/g, _e = /^(?:script|style|textarea|title)$/i, we = (t) => (e, ...i) => ({ _$litType$: t, strings: e, values: i }), p = we(1), w = we(2), K = Symbol.for("lit-noChange"), m = Symbol.for("lit-nothing"), oe = /* @__PURE__ */ new WeakMap(), Y = J.createTreeWalker(J, 129);
function xe(t, e) {
  if (!Vt(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return te !== void 0 ? te.createHTML(e) : e;
}
const Ve = (t, e) => {
  const i = t.length - 1, n = [];
  let r, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", s = at;
  for (let l = 0; l < i; l++) {
    const a = t[l];
    let c, d, u = -1, h = 0;
    for (; h < a.length && (s.lastIndex = h, d = s.exec(a), d !== null); ) h = s.lastIndex, s === at ? d[1] === "!--" ? s = ee : d[1] !== void 0 ? s = ie : d[2] !== void 0 ? (_e.test(d[2]) && (r = RegExp("</" + d[2], "g")), s = W) : d[3] !== void 0 && (s = W) : s === W ? d[0] === ">" ? (s = r ?? at, u = -1) : d[1] === void 0 ? u = -2 : (u = s.lastIndex - d[2].length, c = d[1], s = d[3] === void 0 ? W : d[3] === '"' ? re : ne) : s === re || s === ne ? s = W : s === ee || s === ie ? s = at : (s = W, r = void 0);
    const f = s === W && t[l + 1].startsWith("/>") ? " " : "";
    o += s === at ? a + We : u >= 0 ? (n.push(c), a.slice(0, u) + me + a.slice(u) + z + f) : a + z + (u === -2 ? l : f);
  }
  return [xe(t, o + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), n];
};
class yt {
  constructor({ strings: e, _$litType$: i }, n) {
    let r;
    this.parts = [];
    let o = 0, s = 0;
    const l = e.length - 1, a = this.parts, [c, d] = Ve(e, i);
    if (this.el = yt.createElement(c, n), Y.currentNode = this.el.content, i === 2 || i === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (r = Y.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const u of r.getAttributeNames()) if (u.endsWith(me)) {
          const h = d[s++], f = r.getAttribute(u).split(z), g = /([.?@])?(.*)/.exec(h);
          a.push({ type: 1, index: o, name: g[2], strings: f, ctor: g[1] === "." ? Fe : g[1] === "?" ? Ge : g[1] === "@" ? Ye : St }), r.removeAttribute(u);
        } else u.startsWith(z) && (a.push({ type: 6, index: o }), r.removeAttribute(u));
        if (_e.test(r.tagName)) {
          const u = r.textContent.split(z), h = u.length - 1;
          if (h > 0) {
            r.textContent = It ? It.emptyScript : "";
            for (let f = 0; f < h; f++) r.append(u[f], gt()), Y.nextNode(), a.push({ type: 2, index: ++o });
            r.append(u[h], gt());
          }
        }
      } else if (r.nodeType === 8) if (r.data === be) a.push({ type: 2, index: o });
      else {
        let u = -1;
        for (; (u = r.data.indexOf(z, u + 1)) !== -1; ) a.push({ type: 7, index: o }), u += z.length - 1;
      }
      o++;
    }
  }
  static createElement(e, i) {
    const n = J.createElement("template");
    return n.innerHTML = e, n;
  }
}
function et(t, e, i = t, n) {
  var s, l;
  if (e === K) return e;
  let r = n !== void 0 ? (s = i._$Co) == null ? void 0 : s[n] : i._$Cl;
  const o = $t(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== o && ((l = r == null ? void 0 : r._$AO) == null || l.call(r, !1), o === void 0 ? r = void 0 : (r = new o(t), r._$AT(t, i, n)), n !== void 0 ? (i._$Co ?? (i._$Co = []))[n] = r : i._$Cl = r), r !== void 0 && (e = et(t, r._$AS(t, e.values), r, n)), e;
}
class qe {
  constructor(e, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: i }, parts: n } = this._$AD, r = ((e == null ? void 0 : e.creationScope) ?? J).importNode(i, !0);
    Y.currentNode = r;
    let o = Y.nextNode(), s = 0, l = 0, a = n[0];
    for (; a !== void 0; ) {
      if (s === a.index) {
        let c;
        a.type === 2 ? c = new ot(o, o.nextSibling, this, e) : a.type === 1 ? c = new a.ctor(o, a.name, a.strings, this, e) : a.type === 6 && (c = new Xe(o, this, e)), this._$AV.push(c), a = n[++l];
      }
      s !== (a == null ? void 0 : a.index) && (o = Y.nextNode(), s++);
    }
    return Y.currentNode = J, r;
  }
  p(e) {
    let i = 0;
    for (const n of this._$AV) n !== void 0 && (n.strings !== void 0 ? (n._$AI(e, n, i), i += n.strings.length - 2) : n._$AI(e[i])), i++;
  }
}
class ot {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, i, n, r) {
    this.type = 2, this._$AH = m, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = n, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = i.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, i = this) {
    e = et(this, e, i), $t(e) ? e === m || e == null || e === "" ? (this._$AH !== m && this._$AR(), this._$AH = m) : e !== this._$AH && e !== K && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Be(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== m && $t(this._$AH) ? this._$AA.nextSibling.data = e : this.T(J.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var o;
    const { values: i, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = yt.createElement(xe(n.h, n.h[0]), this.options)), n);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === r) this._$AH.p(i);
    else {
      const s = new qe(r, this), l = s.u(this.options);
      s.p(i), this.T(l), this._$AH = s;
    }
  }
  _$AC(e) {
    let i = oe.get(e.strings);
    return i === void 0 && oe.set(e.strings, i = new yt(e)), i;
  }
  k(e) {
    Vt(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let n, r = 0;
    for (const o of e) r === i.length ? i.push(n = new ot(this.O(gt()), this.O(gt()), this, this.options)) : n = i[r], n._$AI(o), r++;
    r < i.length && (this._$AR(n && n._$AB.nextSibling, r), i.length = r);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    var n;
    for ((n = this._$AP) == null ? void 0 : n.call(this, !1, !0, i); e !== this._$AB; ) {
      const r = Qt(e).nextSibling;
      Qt(e).remove(), e = r;
    }
  }
  setConnected(e) {
    var i;
    this._$AM === void 0 && (this._$Cv = e, (i = this._$AP) == null || i.call(this, e));
  }
}
class St {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, i, n, r, o) {
    this.type = 1, this._$AH = m, this._$AN = void 0, this.element = e, this.name = i, this._$AM = r, this.options = o, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(new String()), this.strings = n) : this._$AH = m;
  }
  _$AI(e, i = this, n, r) {
    const o = this.strings;
    let s = !1;
    if (o === void 0) e = et(this, e, i, 0), s = !$t(e) || e !== this._$AH && e !== K, s && (this._$AH = e);
    else {
      const l = e;
      let a, c;
      for (e = o[0], a = 0; a < o.length - 1; a++) c = et(this, l[n + a], i, a), c === K && (c = this._$AH[a]), s || (s = !$t(c) || c !== this._$AH[a]), c === m ? e = m : e !== m && (e += (c ?? "") + o[a + 1]), this._$AH[a] = c;
    }
    s && !r && this.j(e);
  }
  j(e) {
    e === m ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Fe extends St {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === m ? void 0 : e;
  }
}
class Ge extends St {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== m);
  }
}
class Ye extends St {
  constructor(e, i, n, r, o) {
    super(e, i, n, r, o), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = et(this, e, i, 0) ?? m) === K) return;
    const n = this._$AH, r = e === m && n !== m || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, o = e !== m && (n === m || r);
    r && this.element.removeEventListener(this.name, this, n), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var i;
    typeof this._$AH == "function" ? this._$AH.call(((i = this.options) == null ? void 0 : i.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Xe {
  constructor(e, i, n) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = n;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    et(this, e);
  }
}
const Je = { I: ot }, Nt = dt.litHtmlPolyfillSupport;
Nt == null || Nt(yt, ot), (dt.litHtmlVersions ?? (dt.litHtmlVersions = [])).push("3.3.3");
const Ke = (t, e, i) => {
  const n = (i == null ? void 0 : i.renderBefore) ?? e;
  let r = n._$litPart$;
  if (r === void 0) {
    const o = (i == null ? void 0 : i.renderBefore) ?? null;
    n._$litPart$ = r = new ot(e.insertBefore(gt(), o), o, void 0, i ?? {});
  }
  return r._$AI(t), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const X = globalThis;
let E = class extends tt {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var i;
    const e = super.createRenderRoot();
    return (i = this.renderOptions).renderBefore ?? (i.renderBefore = e.firstChild), e;
  }
  update(e) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ke(i, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return K;
  }
};
var ye;
E._$litElement$ = !0, E.finalized = !0, (ye = X.litElementHydrateSupport) == null || ye.call(X, { LitElement: E });
const Pt = X.litElementPolyfillSupport;
Pt == null || Pt({ LitElement: E });
(X.litElementVersions ?? (X.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Q = (t) => (e, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ze = { attribute: !0, type: String, converter: At, reflect: !1, hasChanged: Bt }, Qe = (t = Ze, e, i) => {
  const { kind: n, metadata: r } = i;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), n === "setter" && ((t = Object.create(t)).wrapped = !0), o.set(i.name, t), n === "accessor") {
    const { name: s } = i;
    return { set(l) {
      const a = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(s, a, t, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(s, void 0, t, l), l;
    } };
  }
  if (n === "setter") {
    const { name: s } = i;
    return function(l) {
      const a = this[s];
      e.call(this, l), this.requestUpdate(s, a, t, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + n);
};
function b(t) {
  return (e, i) => typeof i == "object" ? Qe(t, e, i) : ((n, r, o) => {
    const s = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, n), s ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(t, e, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function _(t) {
  return b({ ...t, state: !0, attribute: !1 });
}
function ti(t) {
  return t.filter((e) => e.configUnavailable).map((e) => ({
    id: `config-unavailable:${e.entityId}`,
    severity: "error",
    automationEntityId: e.entityId,
    automationAlias: e.alias,
    message: "Automation config could not be loaded (likely a YAML-mode automation without a storage id) — review manually in the editor."
  }));
}
function ei(t) {
  const e = [];
  for (const i of t)
    i.parseWarnings.forEach((n, r) => {
      e.push({
        id: `parse-warning:${i.entityId}:${r}`,
        severity: "warning",
        automationEntityId: i.entityId,
        automationAlias: i.alias,
        message: n
      });
    });
  return e;
}
function ii(t) {
  return t.filter((e) => !e.configUnavailable && !e.isBlueprintInstance && e.triggers.length === 0).map((e) => ({
    id: `no-triggers:${e.entityId}`,
    severity: "warning",
    automationEntityId: e.entityId,
    automationAlias: e.alias,
    message: "No triggers — this automation can only run when triggered manually or by another automation."
  }));
}
function ni(t, e) {
  const i = [];
  for (const n of t)
    for (const r of n.refs)
      e.has(r.entityId) || i.push({
        id: `orphaned-ref:${n.entityId}:${r.path}:${r.entityId}`,
        severity: r.heuristic ? "info" : "error",
        automationEntityId: n.entityId,
        automationAlias: n.alias,
        entityId: r.entityId,
        path: r.path,
        message: r.heuristic ? `Possibly references \`${r.entityId}\`, which doesn't currently exist (heuristically extracted from a template, may be inaccurate).` : `References \`${r.entityId}\`, which no longer exists (may have been renamed or removed).`
      });
  return i;
}
function ri(t, e) {
  const i = [];
  for (const n of t)
    if (n.enabled)
      for (const r of n.refs)
        e.has(r.entityId) && i.push({
          id: `disabled-ref:${n.entityId}:${r.path}:${r.entityId}`,
          severity: r.heuristic ? "info" : "warning",
          automationEntityId: n.entityId,
          automationAlias: n.alias,
          entityId: r.entityId,
          path: r.path,
          message: r.heuristic ? `Possibly references \`${r.entityId}\`, which is currently disabled (heuristically extracted from a template, may be inaccurate).` : `References \`${r.entityId}\`, which is currently disabled.`
        });
  return i;
}
function oi(t) {
  const e = new Map(t.map((r) => [r.entityId, r.enabled])), i = new Map(t.map((r) => [r.entityId, r.alias])), n = [];
  for (const r of t)
    if (r.enabled)
      for (const o of r.refs)
        o.role === "action-invoke" && (!e.has(o.entityId) || e.get(o.entityId) !== !1 || n.push({
          id: `disabled-automation-invoked:${r.entityId}:${o.path}:${o.entityId}`,
          severity: "warning",
          automationEntityId: r.entityId,
          automationAlias: r.alias,
          entityId: o.entityId,
          path: o.path,
          message: `Triggers automation \`${i.get(o.entityId) ?? o.entityId}\`, which is currently disabled — this call is a no-op.`
        }));
  return n;
}
function si(t, e, i) {
  const { automations: n } = t, r = /* @__PURE__ */ new Set([...Object.keys(i.states), ...e.map((s) => s.entity_id)]), o = new Map(
    e.filter((s) => s.disabled_by !== null).map((s) => [s.entity_id, s.disabled_by])
  );
  return [
    ...ti(n),
    ...ei(n),
    ...ii(n),
    ...ni(n, r),
    ...ri(n, o),
    ...oi(n)
  ];
}
const ke = /[a-z_]+\.[a-z0-9_]+/, ai = new RegExp(
  `(?:states|is_state|state_attr|has_value|expand)\\(\\s*['"](${ke.source})['"]`,
  "g"
), li = new RegExp(`states\\.(${ke.source})`, "g");
function vt(t) {
  const e = /* @__PURE__ */ new Set();
  for (const i of t.matchAll(ai))
    i[1] && e.add(i[1]);
  for (const i of t.matchAll(li))
    i[1] && e.add(i[1]);
  return [...e];
}
const ci = /* @__PURE__ */ new Set(["automation.trigger"]);
function Et(t, e, i) {
  if (!(!t.includes("{{") && !t.includes("{%")))
    for (const n of vt(t))
      i.push({ entityId: n, role: "template", path: e, heuristic: !0 });
}
function ut(t, e, i) {
  if (typeof t == "string")
    Et(t, e, i);
  else if (Array.isArray(t))
    for (const n of t) ut(n, e, i);
  else if (t && typeof t == "object")
    for (const n of Object.values(t)) ut(n, e, i);
}
function G(t, e, i, n) {
  switch (t.kind) {
    case "state":
    case "numeric_state":
    case "zone":
      for (const r of t.entityId) n.push({ entityId: r, role: i, path: e });
      t.kind === "numeric_state" && t.valueTemplate && Et(t.valueTemplate, e, n);
      break;
    case "template":
      for (const r of t.entityIds) n.push({ entityId: r, role: "template", path: e, heuristic: !0 });
      break;
    case "and":
    case "or":
    case "not":
      for (const r of t.children) G(r, e, i, n);
      break;
  }
}
function V(t, e) {
  var i;
  switch (t.kind) {
    case "service": {
      const n = ci.has(t.service) ? "action-invoke" : "action-write";
      for (const r of ((i = t.target) == null ? void 0 : i.entityId) ?? []) e.push({ entityId: r, role: n, path: t.path });
      t.data && ut(t.data, t.path, e);
      break;
    }
    case "choose":
      for (const n of t.branches) {
        for (const r of n.conditions) G(r, t.path, "condition-read", e);
        for (const r of n.sequence) V(r, e);
      }
      for (const n of t.default ?? []) V(n, e);
      break;
    case "if":
      for (const n of t.conditions) G(n, t.path, "condition-read", e);
      for (const n of t.then) V(n, e);
      for (const n of t.else ?? []) V(n, e);
      break;
    case "parallel":
      for (const n of t.branches) for (const r of n) V(r, e);
      break;
    case "repeat":
      for (const n of t.whileConditions ?? []) G(n, t.path, "condition-read", e);
      for (const n of t.untilConditions ?? []) G(n, t.path, "condition-read", e);
      for (const n of t.sequence) V(n, e);
      break;
    case "wait_template":
      Et(t.template, t.path, e);
      break;
    case "wait_for_trigger":
      for (const n of t.triggers)
        if ("entityId" in n)
          for (const r of n.entityId) e.push({ entityId: r, role: "trigger", path: t.path });
      break;
    case "delay":
      typeof t.duration == "string" && ut(t.duration, t.path, e);
      break;
    case "condition":
      G(t.condition, t.path, "condition-read", e);
      break;
    case "variables":
      ut(t.variables, t.path, e);
      break;
  }
}
function di(t) {
  const e = [];
  for (const n of t.triggers) {
    if ("entityId" in n)
      for (const r of n.entityId) e.push({ entityId: r, role: "trigger", path: n.path });
    if (n.kind === "template")
      for (const r of n.entityIds) e.push({ entityId: r, role: "template", path: n.path, heuristic: !0 });
    n.kind === "numeric_state" && n.valueTemplate && Et(n.valueTemplate, n.path, e);
  }
  t.conditions.forEach((n, r) => G(n, `condition/${r}`, "condition-read", e));
  for (const n of t.actions) V(n, e);
  const i = /* @__PURE__ */ new Set();
  return e.filter((n) => {
    const r = `${n.entityId}|${n.role}|${n.path}`;
    return i.has(r) ? !1 : (i.add(r), !0);
  });
}
function $(t) {
  return t == null ? [] : Array.isArray(t) ? t : [t];
}
function A(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function Ae(t, e, i) {
  if (!A(t))
    return i.push(`Unrecognized trigger at ${e}`), { kind: "unknown", path: e, raw: t };
  const n = t.trigger ?? t.platform, r = typeof t.id == "string" ? t.id : void 0;
  switch (n) {
    case "state": {
      const o = $(t.entity_id).filter(
        (s) => typeof s == "string"
      );
      return {
        kind: "state",
        path: e,
        id: r,
        entityId: o,
        from: t.from ?? void 0,
        to: t.to ?? void 0,
        for: t.for,
        attribute: t.attribute
      };
    }
    case "numeric_state": {
      const o = $(t.entity_id).filter(
        (s) => typeof s == "string"
      );
      return {
        kind: "numeric_state",
        path: e,
        id: r,
        entityId: o,
        above: t.above,
        below: t.below,
        for: t.for,
        attribute: t.attribute,
        valueTemplate: t.value_template
      };
    }
    case "time":
      return {
        kind: "time",
        path: e,
        id: r,
        at: $(t.at).filter(
          (o) => typeof o == "string"
        )
      };
    case "time_pattern":
      return {
        kind: "time_pattern",
        path: e,
        id: r,
        hours: t.hours != null ? String(t.hours) : void 0,
        minutes: t.minutes != null ? String(t.minutes) : void 0,
        seconds: t.seconds != null ? String(t.seconds) : void 0
      };
    case "sun":
      return {
        kind: "sun",
        path: e,
        id: r,
        event: t.event,
        offset: t.offset
      };
    case "template": {
      const o = t.value_template ?? "";
      return { kind: "template", path: e, id: r, template: o, entityIds: vt(o) };
    }
    case "event":
      return {
        kind: "event",
        path: e,
        id: r,
        eventType: t.event_type,
        eventData: t.event_data
      };
    case "zone":
      return {
        kind: "zone",
        path: e,
        id: r,
        entityId: $(t.entity_id).filter(
          (o) => typeof o == "string"
        ),
        zone: $(t.zone).filter(
          (o) => typeof o == "string"
        ),
        event: t.event
      };
    case "device":
      return {
        kind: "device",
        path: e,
        id: r,
        deviceId: t.device_id,
        domain: t.domain,
        type: t.type
      };
    case "mqtt":
      return { kind: "mqtt", path: e, id: r, topic: t.topic };
    case "webhook":
      return { kind: "webhook", path: e, id: r, webhookId: t.webhook_id };
    case "calendar":
      return {
        kind: "calendar",
        path: e,
        id: r,
        entityId: $(t.entity_id).filter(
          (o) => typeof o == "string"
        ),
        event: t.event
      };
    case "homeassistant":
      return { kind: "homeassistant", path: e, id: r, event: t.event };
    default:
      return i.push(`Unrecognized trigger kind "${String(n)}" at ${e}`), { kind: "unknown", path: e, id: r, raw: t };
  }
}
function N(t, e, i = "condition") {
  if (typeof t == "string")
    return { kind: "template", template: t, entityIds: vt(t) };
  if (!A(t))
    return e.push(`Unrecognized condition at ${i}`), { kind: "unknown", raw: t };
  const n = t.condition;
  switch (n) {
    case "state":
      return {
        kind: "state",
        entityId: $(t.entity_id).filter(
          (o) => typeof o == "string"
        ),
        state: t.state,
        attribute: t.attribute,
        forDuration: t.for
      };
    case "numeric_state":
      return {
        kind: "numeric_state",
        entityId: $(t.entity_id).filter(
          (o) => typeof o == "string"
        ),
        above: t.above,
        below: t.below,
        attribute: t.attribute,
        valueTemplate: t.value_template
      };
    case "time":
      return {
        kind: "time",
        after: t.after,
        before: t.before,
        weekday: t.weekday ? $(t.weekday).filter((r) => typeof r == "string") : void 0
      };
    case "sun":
      return {
        kind: "sun",
        before: t.before,
        after: t.after,
        beforeOffset: t.before_offset,
        afterOffset: t.after_offset
      };
    case "zone":
      return {
        kind: "zone",
        entityId: $(t.entity_id).filter(
          (r) => typeof r == "string"
        ),
        zone: $(t.zone).filter(
          (r) => typeof r == "string"
        )
      };
    case "template": {
      const r = t.value_template ?? "";
      return { kind: "template", template: r, entityIds: vt(r) };
    }
    case "trigger":
      return {
        kind: "trigger",
        triggerIds: $(t.id).filter((r) => typeof r == "string")
      };
    case "device":
      return {
        kind: "device",
        deviceId: t.device_id,
        domain: t.domain,
        type: t.type
      };
    case "and":
      return {
        kind: "and",
        children: $(t.conditions).map((r) => N(r, e, i))
      };
    case "or":
      return {
        kind: "or",
        children: $(t.conditions).map((r) => N(r, e, i))
      };
    case "not":
      return {
        kind: "not",
        children: $(t.conditions).map((r) => N(r, e, i))
      };
    default:
      return e.push(`Unrecognized condition kind "${String(n)}" at ${i}`), { kind: "unknown", raw: t };
  }
}
function ui(t) {
  const e = A(t.target) ? t.target : t, i = $(e.entity_id).filter(
    (s) => typeof s == "string"
  ), n = $(e.device_id).filter(
    (s) => typeof s == "string"
  ), r = $(e.area_id).filter(
    (s) => typeof s == "string"
  ), o = $(e.label_id).filter(
    (s) => typeof s == "string"
  );
  if (!(!i.length && !n.length && !r.length && !o.length))
    return {
      ...i.length ? { entityId: i } : {},
      ...n.length ? { deviceId: n } : {},
      ...r.length ? { areaId: r } : {},
      ...o.length ? { labelId: o } : {}
    };
}
function j(t, e, i) {
  if (!A(t))
    return i.push(`Unrecognized action at ${e}`), { kind: "unknown", path: e, raw: t };
  if (Array.isArray(t.choose)) {
    const r = t.choose.map((s, l) => {
      const a = A(s) ? s : {};
      return {
        conditions: $(a.conditions).map((c) => N(c, i, `${e}/choose/${l}`)),
        sequence: $(a.sequence).map(
          (c, d) => j(c, `${e}/choose/${l}/sequence/${d}`, i)
        )
      };
    }), o = t.default ? $(t.default).map((s, l) => j(s, `${e}/choose/default/${l}`, i)) : void 0;
    return { kind: "choose", path: e, branches: r, default: o };
  }
  if (Array.isArray(t.if)) {
    const r = t.if.map((l) => N(l, i, `${e}/if`)), o = $(t.then).map((l, a) => j(l, `${e}/then/${a}`, i)), s = t.else ? $(t.else).map((l, a) => j(l, `${e}/else/${a}`, i)) : void 0;
    return { kind: "if", path: e, conditions: r, then: o, else: s };
  }
  if (Array.isArray(t.parallel)) {
    const r = t.parallel.map((o, s) => A(o) && Array.isArray(o.sequence) ? o.sequence.map(
      (l, a) => j(l, `${e}/parallel/${s}/${a}`, i)
    ) : [j(o, `${e}/parallel/${s}/0`, i)]);
    return { kind: "parallel", path: e, branches: r };
  }
  if (A(t.repeat)) {
    const r = t.repeat, o = $(r.sequence).map(
      (s, l) => j(s, `${e}/repeat/sequence/${l}`, i)
    );
    return r.count !== void 0 ? { kind: "repeat", path: e, mode: "count", count: Number(r.count), sequence: o } : r.while !== void 0 ? {
      kind: "repeat",
      path: e,
      mode: "while",
      whileConditions: $(r.while).map((s) => N(s, i, `${e}/repeat`)),
      sequence: o
    } : r.until !== void 0 ? {
      kind: "repeat",
      path: e,
      mode: "until",
      untilConditions: $(r.until).map((s) => N(s, i, `${e}/repeat`)),
      sequence: o
    } : r.for_each !== void 0 ? {
      kind: "repeat",
      path: e,
      mode: "for_each",
      forEachItems: r.for_each,
      sequence: o
    } : (i.push(`repeat action at ${e} has no count/while/until/for_each`), { kind: "repeat", path: e, mode: "count", count: 0, sequence: o });
  }
  if (typeof t.wait_template == "string")
    return {
      kind: "wait_template",
      path: e,
      template: t.wait_template,
      timeout: t.timeout,
      continueOnTimeout: t.continue_on_timeout
    };
  if (Array.isArray(t.wait_for_trigger))
    return {
      kind: "wait_for_trigger",
      path: e,
      triggers: t.wait_for_trigger.map(
        (r, o) => Ae(r, `${e}/wait_for_trigger/${o}`, i)
      ),
      timeout: t.timeout,
      continueOnTimeout: t.continue_on_timeout
    };
  if (t.delay !== void 0)
    return { kind: "delay", path: e, duration: t.delay };
  if (typeof t.condition == "string" || A(t.condition))
    return { kind: "condition", path: e, condition: N(t, i, e) };
  if (t.event !== void 0)
    return {
      kind: "event",
      path: e,
      eventType: t.event,
      eventData: t.event_data
    };
  if (typeof t.scene == "string")
    return { kind: "scene", path: e, sceneId: t.scene };
  if (t.stop !== void 0)
    return {
      kind: "stop",
      path: e,
      reason: typeof t.stop == "string" ? t.stop : void 0,
      error: t.error
    };
  if (A(t.variables))
    return { kind: "variables", path: e, variables: t.variables };
  if (typeof t.device_id == "string" && typeof t.domain == "string" && typeof t.type == "string")
    return {
      kind: "device",
      path: e,
      deviceId: t.device_id,
      domain: t.domain,
      type: t.type,
      entityRegistryId: typeof t.entity_id == "string" ? t.entity_id : void 0
    };
  const n = t.action ?? t.service;
  return typeof n == "string" ? {
    kind: "service",
    path: e,
    service: n,
    target: ui(t),
    data: A(t.data) ? t.data : A(t.service_data) ? t.service_data : void 0
  } : (i.push(`Unrecognized action shape at ${e}`), { kind: "unknown", path: e, raw: t });
}
function hi(t) {
  const e = [], i = t.raw;
  if (!A(i))
    return {
      id: t.entityId,
      entityId: t.entityId,
      alias: t.entityId,
      mode: "single",
      enabled: t.enabled,
      lastTriggered: t.lastTriggered,
      triggers: [],
      conditions: [],
      actions: [],
      refs: [],
      raw: i,
      parseWarnings: ["Config is not a readable object"],
      configUnavailable: !0
    };
  if (typeof i.use_blueprint == "object" && i.use_blueprint !== null) {
    const d = i.use_blueprint;
    return {
      id: i.id ?? t.entityId,
      entityId: t.entityId,
      alias: i.alias ?? t.entityId,
      description: i.description,
      mode: i.mode ?? "single",
      enabled: t.enabled,
      lastTriggered: t.lastTriggered,
      triggers: [],
      conditions: [],
      actions: [],
      refs: [],
      raw: i,
      parseWarnings: ["Blueprint instance — rendered config not expanded; showing inputs only"],
      isBlueprintInstance: !0,
      blueprintPath: d.path,
      blueprintInputs: A(d.input) ? d.input : void 0
    };
  }
  const n = $(i.triggers ?? i.trigger), r = $(i.conditions ?? i.condition), o = $(i.actions ?? i.action), s = n.map((d, u) => Ae(d, `trigger/${u}`, e)), l = r.map((d) => N(d, e, "condition")), a = o.map((d, u) => j(d, `action/${u}`, e)), c = {
    id: i.id ?? t.entityId,
    entityId: t.entityId,
    alias: i.alias ?? t.entityId,
    description: i.description,
    mode: i.mode ?? "single",
    enabled: t.enabled,
    lastTriggered: t.lastTriggered,
    triggers: s,
    conditions: l,
    actions: a,
    refs: [],
    raw: i,
    parseWarnings: e
  };
  return c.refs = di(c), c;
}
const fi = /* @__PURE__ */ new Set(["automation.trigger"]);
function q(t, e, i) {
  var n, r, o, s, l, a, c;
  switch (t.kind) {
    case "service": {
      const d = fi.has(t.service) ? "action-invoke" : "action-write";
      for (const u of ((n = t.target) == null ? void 0 : n.deviceId) ?? [])
        for (const h of e.deviceToEntities.get(u) ?? [])
          i.push({
            entityId: h,
            role: d,
            path: t.path,
            resolvedVia: { kind: "device", id: u, name: (r = e.deviceNames) == null ? void 0 : r.get(u) }
          });
      for (const u of ((o = t.target) == null ? void 0 : o.areaId) ?? [])
        for (const h of e.areaToEntities.get(u) ?? [])
          i.push({
            entityId: h,
            role: d,
            path: t.path,
            resolvedVia: { kind: "area", id: u, name: (s = e.areaNames) == null ? void 0 : s.get(u) }
          });
      for (const u of ((l = t.target) == null ? void 0 : l.labelId) ?? [])
        for (const h of e.labelToEntities.get(u) ?? [])
          i.push({
            entityId: h,
            role: d,
            path: t.path,
            resolvedVia: { kind: "label", id: u, name: (a = e.labelNames) == null ? void 0 : a.get(u) }
          });
      break;
    }
    case "choose":
      for (const d of t.branches) for (const u of d.sequence) q(u, e, i);
      for (const d of t.default ?? []) q(d, e, i);
      break;
    case "if":
      for (const d of t.then) q(d, e, i);
      for (const d of t.else ?? []) q(d, e, i);
      break;
    case "parallel":
      for (const d of t.branches) for (const u of d) q(u, e, i);
      break;
    case "repeat":
      for (const d of t.sequence) q(d, e, i);
      break;
    case "device": {
      const d = t.entityRegistryId && ((c = e.registryIdToEntity) == null ? void 0 : c.get(t.entityRegistryId));
      d && i.push({
        entityId: d,
        role: "action-write",
        path: t.path,
        resolvedVia: { kind: "registry-id", id: t.entityRegistryId }
      });
      break;
    }
  }
}
function pi(t, e) {
  const i = [];
  for (const n of t.actions) q(n, e, i);
  return i;
}
function gi(t) {
  const e = /* @__PURE__ */ new Map();
  for (const i of t)
    for (const n of i.refs) {
      const r = e.get(n.entityId) ?? [];
      r.push({ automationId: i.entityId, role: n.role, path: n.path }), e.set(n.entityId, r);
    }
  return { byEntity: e };
}
function $i(t) {
  return Object.values(t.states).filter((e) => e.entity_id.startsWith("automation."));
}
async function yi(t, e) {
  const i = e.attributes.id;
  if (i)
    try {
      return await t.callApi("GET", `config/automation/config/${i}`);
    } catch {
    }
  try {
    return (await t.callWS({
      type: "automation/config",
      entity_id: e.entity_id
    })).config;
  } catch {
    return;
  }
}
async function vi(t) {
  const [e, i, n, r] = await Promise.all([
    t.callWS({ type: "config/entity_registry/list" }),
    t.callWS({ type: "config/device_registry/list" }),
    t.callWS({ type: "config/area_registry/list" }),
    t.callWS({ type: "config/label_registry/list" })
  ]), o = new Map(i.map((f) => [f.id, f.area_id])), s = new Map(i.map((f) => [f.id, f.name_by_user || f.name || f.id])), l = new Map(n.map((f) => [f.area_id, f.name])), a = new Map(r.map((f) => [f.label_id, f.name])), c = new Map(e.map((f) => [f.id, f.entity_id])), d = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map();
  for (const f of e) {
    if (f.device_id) {
      const v = d.get(f.device_id) ?? [];
      v.push(f.entity_id), d.set(f.device_id, v);
    }
    const g = f.area_id ?? (f.device_id ? o.get(f.device_id) ?? null : null);
    if (g) {
      const v = u.get(g) ?? [];
      v.push(f.entity_id), u.set(g, v);
    }
    for (const v of f.labels) {
      const S = h.get(v) ?? [];
      S.push(f.entity_id), h.set(v, S);
    }
  }
  return {
    entities: e,
    registries: { deviceToEntities: d, areaToEntities: u, labelToEntities: h, deviceNames: s, areaNames: l, labelNames: a, registryIdToEntity: c }
  };
}
function mi(t, e) {
  const i = new Map(
    e.map((n) => [n.entity_id, n.name || n.original_name || void 0])
  );
  return (n) => {
    var r;
    return i.get(n) ?? ((r = t.states[n]) == null ? void 0 : r.attributes.friendly_name);
  };
}
async function bi(t) {
  const e = $i(t), { entities: i, registries: n } = await vi(t), r = await Promise.all(
    e.map(async (o) => {
      const s = await yi(t, o), l = hi({
        entityId: o.entity_id,
        raw: s ?? null,
        enabled: o.state !== "off",
        lastTriggered: o.attributes.last_triggered
      });
      return s !== void 0 && (l.refs = [...l.refs, ...pi(l, n)]), l;
    })
  );
  return { atlas: { automations: r, index: gi(r) }, entityRegistry: i };
}
function _i(t, e) {
  return t.connection.subscribeEvents(() => e(), "automation_reloaded");
}
async function wi(t, e) {
  try {
    return await t.callWS({ type: "trace/list", domain: "automation", item_id: e });
  } catch {
    return [];
  }
}
function xi(t, e, i) {
  return t.callWS({ type: "trace/get", domain: "automation", item_id: e, run_id: i });
}
async function ki(t, e) {
  const i = await wi(t, e);
  if (!i.length) return;
  const n = [...i].sort((r, o) => {
    var s, l;
    return (((s = o.timestamp) == null ? void 0 : s.start) ?? "").localeCompare(((l = r.timestamp) == null ? void 0 : l.start) ?? "");
  })[0];
  if (n)
    return xi(t, e, n.run_id);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ai = { CHILD: 2 }, Ii = (t) => (...e) => ({ _$litDirective$: t, values: e });
let Si = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, i, n) {
    this._$Ct = e, this._$AM = i, this._$Ci = n;
  }
  _$AS(e, i) {
    return this.update(e, i);
  }
  update(e, i) {
    return this.render(...i);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: Ei } = Je, se = (t) => t, ae = () => document.createComment(""), lt = (t, e, i) => {
  var o;
  const n = t._$AA.parentNode, r = e === void 0 ? t._$AB : e._$AA;
  if (i === void 0) {
    const s = n.insertBefore(ae(), r), l = n.insertBefore(ae(), r);
    i = new Ei(s, l, t, t.options);
  } else {
    const s = i._$AB.nextSibling, l = i._$AM, a = l !== t;
    if (a) {
      let c;
      (o = i._$AQ) == null || o.call(i, t), i._$AM = t, i._$AP !== void 0 && (c = t._$AU) !== l._$AU && i._$AP(c);
    }
    if (s !== r || a) {
      let c = i._$AA;
      for (; c !== s; ) {
        const d = se(c).nextSibling;
        se(n).insertBefore(c, r), c = d;
      }
    }
  }
  return i;
}, B = (t, e, i = t) => (t._$AI(e, i), t), Oi = {}, Ti = (t, e = Oi) => t._$AH = e, Ci = (t) => t._$AH, Rt = (t) => {
  t._$AR(), t._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const le = (t, e, i) => {
  const n = /* @__PURE__ */ new Map();
  for (let r = e; r <= i; r++) n.set(t[r], r);
  return n;
}, Ie = Ii(class extends Si {
  constructor(t) {
    if (super(t), t.type !== Ai.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(t, e, i) {
    let n;
    i === void 0 ? i = e : e !== void 0 && (n = e);
    const r = [], o = [];
    let s = 0;
    for (const l of t) r[s] = n ? n(l, s) : s, o[s] = i(l, s), s++;
    return { values: o, keys: r };
  }
  render(t, e, i) {
    return this.dt(t, e, i).values;
  }
  update(t, [e, i, n]) {
    const r = Ci(t), { values: o, keys: s } = this.dt(e, i, n);
    if (!Array.isArray(r)) return this.ut = s, o;
    const l = this.ut ?? (this.ut = []), a = [];
    let c, d, u = 0, h = r.length - 1, f = 0, g = o.length - 1;
    for (; u <= h && f <= g; ) if (r[u] === null) u++;
    else if (r[h] === null) h--;
    else if (l[u] === s[f]) a[f] = B(r[u], o[f]), u++, f++;
    else if (l[h] === s[g]) a[g] = B(r[h], o[g]), h--, g--;
    else if (l[u] === s[g]) a[g] = B(r[u], o[g]), lt(t, a[g + 1], r[u]), u++, g--;
    else if (l[h] === s[f]) a[f] = B(r[h], o[f]), lt(t, r[u], r[h]), h--, f++;
    else if (c === void 0 && (c = le(s, f, g), d = le(l, u, h)), c.has(l[u])) if (c.has(l[h])) {
      const v = d.get(s[f]), S = v !== void 0 ? r[v] : null;
      if (S === null) {
        const _t = lt(t, r[u]);
        B(_t, o[f]), a[f] = _t;
      } else a[f] = B(S, o[f]), lt(t, r[u], S), r[v] = null;
      f++;
    } else Rt(r[h]), h--;
    else Rt(r[u]), u++;
    for (; f <= g; ) {
      const v = lt(t, a[g + 1]);
      B(v, o[f]), a[f++] = v;
    }
    for (; u <= h; ) {
      const v = r[u++];
      v !== null && Rt(v);
    }
    return this.ut = s, Ti(t, a), K;
  }
}), P = () => {
}, Ni = /* @__PURE__ */ new Set(["person", "sun"]);
function qt(t, e = P) {
  const i = e(t);
  if (!i) return `\`${t}\``;
  const n = t.split(".")[0] ?? "";
  return Ni.has(n) || i.toLowerCase().startsWith("the ") ? i : `the ${i}`;
}
function x(t, e = P, i = "or") {
  const n = t.map((r) => qt(r, e));
  return n.length === 0 ? "" : n.length === 1 ? n[0] : n.length === 2 ? `${n[0]} ${i} ${n[1]}` : `${n.slice(0, -1).join(", ")}, ${i} ${n[n.length - 1]}`;
}
const Pi = [
  ["hours", "hour"],
  ["minutes", "minute"],
  ["seconds", "second"],
  ["milliseconds", "millisecond"]
];
function Ri(t, e) {
  return `${t} ${e}${t === 1 ? "" : "s"}`;
}
function ht(t) {
  if (t === void 0) return "";
  if (typeof t == "string") {
    const i = /^(\d+):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(t.trim());
    if (!i) return t;
    const [, n, r, o] = i.map(Number);
    return ht({ hours: n, minutes: r, seconds: o });
  }
  const e = [];
  for (const [i, n] of Pi) {
    const r = t[i];
    r && e.push(Ri(r, n));
  }
  return e.length ? e.join(" ") : "0 seconds";
}
function zt(t) {
  const e = /^(\d{1,2}):(\d{2})(:\d{2})?$/.exec(t.trim());
  return e ? `${e[1]}:${e[2]}` : t;
}
function Ut(t) {
  return t.split("_").filter(Boolean).map((e) => e[0].toUpperCase() + e.slice(1)).join(" ");
}
function Lt(t) {
  return t && t[0].toUpperCase() + t.slice(1);
}
function Li(t, e = 80) {
  return t.length <= e ? t : `${t.slice(0, e - 1)}…`;
}
function ce(t) {
  return t ? ` (attribute \`${t}\`)` : "";
}
function de(t, e, i, n) {
  return t.map((r) => {
    const o = it(r, e);
    return (r.kind === "and" || r.kind === "or") && r.kind !== i ? `(${o})` : o;
  }).join(n);
}
function it(t, e) {
  var i;
  switch (t.kind) {
    case "state": {
      const n = Array.isArray(t.state) ? t.state.join(", ") : t.state, r = Array.isArray(t.state) ? "is one of" : "is";
      return `${x(t.entityId, e, "and")}${ce(t.attribute)} ${r} "${n}"`;
    }
    case "numeric_state": {
      if (t.valueTemplate)
        return `a template value is ${t.above !== void 0 ? `above ${t.above}` : ""}${t.below !== void 0 ? `below ${t.below}` : ""}`;
      const n = [];
      return t.above !== void 0 && n.push(`above ${t.above}`), t.below !== void 0 && n.push(`below ${t.below}`), `${x(t.entityId, e, "and")}${ce(t.attribute)} is ${n.join(" and ")}`;
    }
    case "time": {
      const n = [];
      return t.after && n.push(`after ${zt(t.after)}`), t.before && n.push(`before ${zt(t.before)}`), (i = t.weekday) != null && i.length && n.push(`on ${t.weekday.join(", ")}`), `it is ${n.join(" and ")}`;
    }
    case "sun":
      return t.before ? `it is before ${t.before}${t.beforeOffset ? ` (offset ${t.beforeOffset})` : ""}` : t.after ? `it is after ${t.after}${t.afterOffset ? ` (offset ${t.afterOffset})` : ""}` : "a sun condition holds";
    case "zone":
      return `${x(t.entityId, e, "and")} is in ${t.zone.map((n) => qt(n, e)).join(" or ")}`;
    case "template":
      return `a template condition holds${t.entityIds.length ? ` (involves ${x(t.entityIds, e, "and")})` : ""}`;
    case "trigger":
      return `this run was triggered by "${t.triggerIds.map(Ut).join('" or "')}"`;
    case "device":
      return `a device condition on \`${t.deviceId}\` holds`;
    case "and":
      return de(t.children, e, "and", ", AND ");
    case "or":
      return de(t.children, e, "or", ", OR ");
    case "not":
      return `NOT (${t.children.map((n) => it(n, e)).join(", ")})`;
    case "unknown":
      return "a condition Atlas can't describe yet (show raw)";
  }
}
function C(t, e) {
  return t.length === 0 ? "true" : t.length === 1 ? it(t[0], e) : t.map((i) => it(i, e)).join(", AND ");
}
function ft(t, e, i = 80) {
  if (typeof t != "string" || !t.includes("{{") && !t.includes("{%"))
    return `"${Li(String(t ?? "?"), i)}"`;
  const n = vt(t);
  return n.length ? `a dynamic value mentioning ${x(n, e, "and")}` : "a dynamic value";
}
function y(t, e, i = []) {
  var r, o, s, l;
  if (!t) return "(no target)";
  const n = [];
  return (r = t.entityId) != null && r.length && n.push(x(t.entityId, e, "and")), (o = t.deviceId) != null && o.length && n.push(
    i.length ? x(i, e, "and") : `${t.deviceId.length} device(s)`
  ), (s = t.areaId) != null && s.length && n.push(
    i.length ? x(i, e, "and") : `area(s) ${t.areaId.join(", ")}`
  ), (l = t.labelId) != null && l.length && n.push(
    i.length ? x(i, e, "and") : `label(s) ${t.labelId.join(", ")}`
  ), n.join(", ") || "(no target)";
}
const ji = {
  "switch.turn_on": (t, e, i, n) => `turn on ${y(t, i, n)}`,
  "switch.turn_off": (t, e, i, n) => `turn off ${y(t, i, n)}`,
  "switch.toggle": (t, e, i, n) => `toggle ${y(t, i, n)}`,
  "light.turn_on": (t, e, i, n) => {
    const r = [];
    return (e == null ? void 0 : e.brightness) !== void 0 && r.push(`brightness ${e.brightness}`), (e == null ? void 0 : e.color_temp_kelvin) !== void 0 && r.push(`${e.color_temp_kelvin}K`), (e == null ? void 0 : e.rgb_color) !== void 0 && r.push(`color ${JSON.stringify(e.rgb_color)}`), `turn on ${y(t, i, n)}${r.length ? ` (${r.join(", ")})` : ""}`;
  },
  "light.turn_off": (t, e, i, n) => `turn off ${y(t, i, n)}`,
  "climate.turn_off": (t, e, i, n) => `turn off ${y(t, i, n)}`,
  "climate.turn_on": (t, e, i, n) => `turn on ${y(t, i, n)}`,
  "climate.set_temperature": (t, e, i, n) => `set ${y(t, i, n)} to ${String((e == null ? void 0 : e.temperature) ?? "?")}°`,
  "climate.set_hvac_mode": (t, e, i, n) => `set ${y(t, i, n)} to ${ft(e == null ? void 0 : e.hvac_mode, i)} mode`,
  "climate.set_fan_mode": (t, e, i, n) => `set ${y(t, i, n)}'s fan mode to ${ft(e == null ? void 0 : e.fan_mode, i)}`,
  "input_boolean.turn_on": (t, e, i, n) => `turn on ${y(t, i, n)}`,
  "input_boolean.turn_off": (t, e, i, n) => `turn off ${y(t, i, n)}`,
  "input_select.select_option": (t, e, i, n) => `set ${y(t, i, n)} to ${ft(e == null ? void 0 : e.option, i)}`,
  "input_number.set_value": (t, e, i, n) => `set ${y(t, i, n)} to ${String((e == null ? void 0 : e.value) ?? "?")}`,
  "cover.open_cover": (t, e, i, n) => `open ${y(t, i, n)}`,
  "cover.close_cover": (t, e, i, n) => `close ${y(t, i, n)}`,
  "lock.lock": (t, e, i, n) => `lock ${y(t, i, n)}`,
  "lock.unlock": (t, e, i, n) => `unlock ${y(t, i, n)}`,
  "fan.turn_on": (t, e, i, n) => `turn on ${y(t, i, n)}`,
  "fan.turn_off": (t, e, i, n) => `turn off ${y(t, i, n)}`,
  "media_player.turn_on": (t, e, i, n) => `turn on ${y(t, i, n)}`,
  "media_player.turn_off": (t, e, i, n) => `turn off ${y(t, i, n)}`,
  "media_player.media_play": (t, e, i, n) => `play media on ${y(t, i, n)}`,
  "media_player.media_pause": (t, e, i, n) => `pause ${y(t, i, n)}`,
  "scene.turn_on": (t, e, i, n) => `activate scene ${y(t, i, n)}`,
  "automation.trigger": (t, e, i, n) => `manually re-run ${y(t, i, n)}`,
  "automation.turn_on": (t, e, i, n) => `enable ${y(t, i, n)}`,
  "automation.turn_off": (t, e, i, n) => `disable ${y(t, i, n)}`
};
function Mi(t, e, i) {
  const n = t.startsWith("notify.mobile_app_") ? Ut(t.replace("notify.mobile_app_", "")) : t.startsWith("notify.") ? Ut(t.replace("notify.", "")) : "a notify target";
  if (!(e != null && e.title) && !(e != null && e.message)) return `send a phone notification to ${n}`;
  const r = typeof (e == null ? void 0 : e.title) == "string" ? ft(e.title, i) : void 0, o = typeof (e == null ? void 0 : e.message) == "string" ? ft(e.message, i) : void 0, s = [r, o].filter(Boolean);
  return `send a phone notification to ${n}: ${s.join(" — ")}`;
}
function zi(t, e, i, n, r = []) {
  if (t.startsWith("notify.")) return Mi(t, i, n);
  const o = ji[t];
  return o ? o(e, i, n, r) : `call \`${t}\` on ${y(e, n, r)}`;
}
const Ui = /* @__PURE__ */ new Map();
function ue(t, e) {
  return (e.get(t) ?? []).filter((i) => i.resolvedVia).map((i) => i.entityId);
}
const Di = {
  "cover.open": "open",
  "cover.close": "close",
  "cover.stop": "stop",
  "valve.open": "open",
  "valve.close": "close"
};
function Hi(t, e) {
  return Di[`${t}.${e}`] ?? e.replace(/_/g, " ");
}
function M(t, e, i, n = Ui) {
  var r, o;
  switch (t.kind) {
    case "service": {
      const s = ue(t.path, n);
      return [
        {
          indent: i,
          text: Lt(zi(t.service, t.target, t.data, e, s))
        }
      ];
    }
    case "choose": {
      const s = [{ indent: i, text: "Then, depending on the situation:" }];
      if (t.branches.forEach((l, a) => {
        const c = a === 0 ? "If" : "Otherwise, if";
        s.push({ indent: i + 1, text: `${c} ${C(l.conditions, e)}:` });
        for (const d of l.sequence) s.push(...M(d, e, i + 2, n));
      }), (r = t.default) != null && r.length) {
        s.push({ indent: i + 1, text: "Otherwise:" });
        for (const l of t.default) s.push(...M(l, e, i + 2, n));
      }
      return s;
    }
    case "if": {
      const s = [{ indent: i, text: `If ${C(t.conditions, e)}:` }];
      for (const l of t.then) s.push(...M(l, e, i + 1, n));
      if ((o = t.else) != null && o.length) {
        s.push({ indent: i, text: "Otherwise:" });
        for (const l of t.else) s.push(...M(l, e, i + 1, n));
      }
      return s;
    }
    case "parallel": {
      const s = [{ indent: i, text: "Then, all at the same time:" }];
      return t.branches.forEach((l) => {
        for (const a of l) s.push(...M(a, e, i + 1, n));
      }), s;
    }
    case "repeat": {
      let s;
      switch (t.mode) {
        case "count":
          s = `Repeat ${t.count} time${t.count === 1 ? "" : "s"}:`;
          break;
        case "while":
          s = `Repeat while ${C(t.whileConditions ?? [], e)}:`;
          break;
        case "until":
          s = `Repeat until ${C(t.untilConditions ?? [], e)}:`;
          break;
        case "for_each":
          s = "Repeat for each item in the list:";
          break;
      }
      const l = [{ indent: i, text: s }];
      for (const a of t.sequence) l.push(...M(a, e, i + 1, n));
      return l;
    }
    case "wait_template":
      return [
        {
          indent: i,
          text: `Wait until a template condition becomes true${t.timeout ? ` (up to ${ht(t.timeout)})` : ""}`
        }
      ];
    case "wait_for_trigger":
      return [
        {
          indent: i,
          text: `Wait for a trigger${t.timeout ? ` (up to ${ht(t.timeout)})` : ""}`
        }
      ];
    case "delay":
      return [
        {
          indent: i,
          text: `Wait ${typeof t.duration == "string" ? t.duration : ht(t.duration)}`
        }
      ];
    case "condition":
      return [{ indent: i, text: `But only continue if ${it(t.condition, e)}` }];
    case "event":
      return [{ indent: i, text: `Fire the event "${t.eventType}"` }];
    case "scene":
      return [{ indent: i, text: `Activate the scene \`${t.sceneId}\`` }];
    case "stop":
      return [{ indent: i, text: `Stop here${t.reason ? `: ${t.reason}` : ""}${t.error ? " (as an error)" : ""}` }];
    case "variables":
      return [{ indent: i, text: `Set variable(s): ${Object.keys(t.variables).join(", ")}` }];
    case "device": {
      const s = ue(t.path, n), l = Hi(t.domain, t.type);
      return s.length ? [{ indent: i, text: Lt(`${l} ${x(s, e, "and")}`) }] : [
        {
          indent: i,
          text: Lt(
            `${l} \`${t.domain}\` on device \`${t.deviceId}\` — entity reference could not be resolved (the device may no longer exist)`
          )
        }
      ];
    }
    case "unknown":
      return [{ indent: i, text: "1 step Atlas can't describe yet (show raw)" }];
  }
}
function wt(t) {
  return t ? ` for ${ht(t)}` : "";
}
function Se(t, e) {
  switch (t.kind) {
    case "state": {
      const i = x(t.entityId, e, "or"), n = t.attribute ? ` attribute \`${t.attribute}\`` : "";
      if (t.to !== void 0 && t.to !== null) {
        const r = Array.isArray(t.to) ? t.to.join('" or "') : t.to;
        return `When ${i}${n} changes to "${r}"${wt(t.for)}`;
      }
      if (t.from !== void 0 && t.from !== null) {
        const r = Array.isArray(t.from) ? t.from.join('" or "') : t.from;
        return `When ${i}${n} changes from "${r}"${wt(t.for)}`;
      }
      return `When ${i}${n} changes state${wt(t.for)}`;
    }
    case "numeric_state": {
      const i = x(t.entityId, e, "or"), n = t.attribute ? ` attribute \`${t.attribute}\`` : "", r = [];
      return t.above !== void 0 && r.push(`rises above ${t.above}`), t.below !== void 0 && r.push(`drops below ${t.below}`), `When ${i}${n} ${r.join(" or ")}${wt(t.for)}`;
    }
    case "time":
      return `At ${t.at.map(zt).join(" or ")}`;
    case "time_pattern": {
      const i = [];
      return t.minutes && i.push(`every ${t.minutes.replace("/", "")} minutes`), t.hours && i.push(`every ${t.hours.replace("/", "")} hours`), t.seconds && i.push(`every ${t.seconds.replace("/", "")} seconds`), `On a schedule, ${i.join(" and ") || "periodically"}`;
    }
    case "sun":
      return `At ${t.event}${t.offset ? ` (offset ${t.offset})` : ""}`;
    case "template":
      return `When a template becomes true${t.entityIds.length ? ` (involves ${x(t.entityIds, e, "and")})` : ""}`;
    case "event":
      return `When event "${Array.isArray(t.eventType) ? t.eventType.join('" or "') : t.eventType}" fires`;
    case "zone":
      return `When ${x(t.entityId, e, "or")} ${t.event === "leave" ? "leaves" : "enters"} ${t.zone.map((i) => qt(i, e)).join(" or ")}`;
    case "device":
      return `On a device event (\`${t.deviceId}\`)`;
    case "mqtt":
      return `When an MQTT message arrives on \`${t.topic}\``;
    case "webhook":
      return `When webhook \`${t.webhookId}\` is called`;
    case "calendar":
      return `When ${x(t.entityId, e, "or")} calendar event ${t.event === "end" ? "ends" : "starts"}`;
    case "homeassistant":
      return `When Home Assistant ${t.event === "shutdown" ? "shuts down" : "starts up"}`;
    case "unknown":
      return "An unrecognized trigger (show raw)";
  }
}
function Wi(t) {
  const e = /* @__PURE__ */ new Map();
  for (const i of t) {
    const n = e.get(i.path) ?? [];
    n.push(i), e.set(i.path, n);
  }
  return e;
}
const Bi = {
  single: void 0,
  restart: "re-runs restart any in-progress run",
  queued: "re-runs queue up and run one after another",
  parallel: "multiple runs can execute at the same time"
};
function Vi(t, e = P) {
  const i = Wi(t.refs);
  return {
    triggerLines: t.triggers.map((n) => Se(n, e)),
    conditionLine: t.conditions.length ? `But only if: ${C(t.conditions, e)}` : void 0,
    actionLines: t.actions.flatMap((n) => M(n, e, 0, i)),
    modeNote: Bi[t.mode]
  };
}
function pt(t) {
  return t.split(/`([^`]+)`/g).map((i, n) => n % 2 === 1 ? p`<code>${i}</code>` : i);
}
function qi(t, e = Date.now()) {
  if (!t) return "never triggered";
  const i = new Date(t).getTime();
  if (Number.isNaN(i)) return "never triggered";
  const n = Math.round((e - i) / 1e3);
  if (n < 60) return "just now";
  const r = Math.round(n / 60);
  if (r < 60) return `${r} minute${r === 1 ? "" : "s"} ago`;
  const o = Math.round(r / 60);
  if (o < 24) return `${o} hour${o === 1 ? "" : "s"} ago`;
  const s = Math.round(o / 24);
  if (s < 90) return `${s} day${s === 1 ? "" : "s"} ago`;
  const l = Math.round(s / 30);
  return `${l} month${l === 1 ? "" : "s"} ago`;
}
var Fi = Object.defineProperty, Gi = Object.getOwnPropertyDescriptor, bt = (t, e, i, n) => {
  for (var r = n > 1 ? void 0 : n ? Gi(e, i) : e, o = t.length - 1, s; o >= 0; o--)
    (s = t[o]) && (r = (n ? s(e, i, r) : s(r)) || r);
  return n && r && Fi(e, i, r), r;
};
let Z = class extends E {
  constructor() {
    super(...arguments), this.names = P, this.expanded = !1, this.showRaw = !1;
  }
  renderBody() {
    const t = this.automation;
    if (t.configUnavailable)
      return p`<div class="warning">Config not readable via API — likely a YAML-mode automation without a
        storage id. Excluded from the dependency graph and audit.</div>`;
    if (t.isBlueprintInstance)
      return p`
        <div class="warning">Blueprint instance (${t.blueprintPath ?? "unknown blueprint"}) — inputs shown below,
        rendered triggers/conditions/actions aren't expanded.</div>
        ${t.blueprintInputs ? p`<pre class="blueprint-inputs">${JSON.stringify(t.blueprintInputs, null, 2)}</pre>` : ""}
      `;
    const e = Vi(t, this.names);
    return p`
      <div class="section-label">Triggers</div>
      ${e.triggerLines.map((i) => p`<div class="trigger-line">${pt(i)}</div>`)}
      ${e.conditionLine ? p`<div class="section-label">Conditions</div>
            <div class="condition-line">${pt(e.conditionLine)}</div>` : ""}
      <div class="section-label">Actions</div>
      ${e.actionLines.map(
      (i) => p`<div class="action-line" style="padding-left: ${i.indent * 16}px">${pt(i.text)}</div>`
    )}
      ${e.modeNote ? p`<div class="mode-note">(${e.modeNote})</div>` : ""}
      ${t.parseWarnings.length ? p`<div class="section-label">Warnings</div>
            ${t.parseWarnings.map((i) => p`<div class="warning">${i}</div>`)}` : ""}
      <button class="raw-toggle" @click=${() => this.showRaw = !this.showRaw}>
        ${this.showRaw ? "Hide" : "Show"} raw config
      </button>
      ${this.showRaw ? p`<pre>${JSON.stringify(t.raw, null, 2)}</pre>` : ""}
    `;
  }
  onViewFlowchart(t) {
    t.stopPropagation(), this.dispatchEvent(
      new CustomEvent("view-flowchart", { detail: { entityId: this.automation.entityId }, bubbles: !0, composed: !0 })
    );
  }
  onViewDependencyGraph(t) {
    t.stopPropagation(), this.dispatchEvent(
      new CustomEvent("view-dependency-graph", {
        detail: { entityId: this.automation.entityId },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    const t = this.automation;
    return p`
      <div class="card">
        <div class="header" @click=${() => this.expanded = !this.expanded}>
          <span class="dot ${t.enabled ? "on" : "off"}" title=${t.enabled ? "Enabled" : "Disabled"}></span>
          <span class="alias">${t.alias}</span>
          <span class="last-triggered">${qi(t.lastTriggered)}</span>
          ${!t.configUnavailable && !t.isBlueprintInstance ? p`
                <a class="edit-link" href="#" @click=${this.onViewFlowchart}>Flowchart</a>
                <a class="edit-link" href="#" @click=${this.onViewDependencyGraph}>Dependency Graph</a>
              ` : ""}
          <a
            class="edit-link"
            href="/config/automation/edit/${t.id}"
            target="_top"
            @click=${(e) => e.stopPropagation()}
            >Edit ↗</a
          >
        </div>
        ${this.expanded ? p`<div class="body">${this.renderBody()}</div>` : ""}
      </div>
    `;
  }
};
Z.styles = rt`
    :host {
      display: block;
      margin-bottom: 8px;
    }
    .card {
      background: var(--card-background-color, #fff);
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.12));
      color: var(--primary-text-color);
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      cursor: pointer;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot.on {
      background: var(--state-active-color, #4caf50);
    }
    .dot.off {
      background: var(--disabled-text-color, #bdbdbd);
    }
    .alias {
      font-weight: 500;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .last-triggered {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      flex-shrink: 0;
    }
    a.edit-link {
      color: var(--primary-color);
      text-decoration: none;
      flex-shrink: 0;
      font-size: 0.85em;
    }
    @media (max-width: 480px) {
      .header {
        flex-wrap: wrap;
      }
      .alias {
        flex-basis: 100%;
        order: 1;
      }
      .last-triggered {
        order: 2;
      }
      a.edit-link {
        order: 3;
      }
    }
    .body {
      padding: 0 16px 16px;
      border-top: 1px solid var(--divider-color);
      overflow-wrap: anywhere;
    }
    .section-label {
      font-size: 0.75em;
      text-transform: uppercase;
      color: var(--secondary-text-color);
      margin: 12px 0 4px;
    }
    .trigger-line,
    .condition-line {
      margin: 2px 0;
    }
    .action-line {
      margin: 2px 0;
    }
    .mode-note {
      font-style: italic;
      color: var(--secondary-text-color);
      font-size: 0.85em;
      margin-top: 8px;
    }
    .warning {
      color: var(--warning-color, #ff9800);
    }
    code {
      background: var(--code-editor-background-color, rgba(0, 0, 0, 0.06));
      border-radius: 4px;
      padding: 0 4px;
      font-size: 0.9em;
    }
    button.raw-toggle {
      background: none;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      padding: 8px 0;
      font-size: 0.85em;
    }
    pre {
      background: var(--code-editor-background-color, rgba(0, 0, 0, 0.06));
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.8em;
    }
    .blueprint-inputs {
      font-size: 0.9em;
    }
  `;
bt([
  b({ attribute: !1 })
], Z.prototype, "automation", 2);
bt([
  b({ attribute: !1 })
], Z.prototype, "names", 2);
bt([
  _()
], Z.prototype, "expanded", 2);
bt([
  _()
], Z.prototype, "showRaw", 2);
Z = bt([
  Q("atlas-automation-card")
], Z);
var Yi = Object.defineProperty, Xi = Object.getOwnPropertyDescriptor, Ot = (t, e, i, n) => {
  for (var r = n > 1 ? void 0 : n ? Xi(e, i) : e, o = t.length - 1, s; o >= 0; o--)
    (s = t[o]) && (r = (n ? s(e, i, r) : s(r)) || r);
  return n && r && Yi(e, i, r), r;
};
let nt = class extends E {
  constructor() {
    super(...arguments), this.names = P, this.search = "";
  }
  onSearch(t) {
    this.search = t.target.value;
  }
  render() {
    const t = this.search.trim().toLowerCase(), e = t ? this.atlas.automations.filter((i) => i.alias.toLowerCase().includes(t)) : this.atlas.automations;
    return p`
      <div class="toolbar">
        <input type="search" placeholder="Search automations…" .value=${this.search} @input=${this.onSearch} />
      </div>
      <div class="count">${e.length} of ${this.atlas.automations.length} automations</div>
      ${Ie(
      e,
      (i) => i.entityId,
      (i) => p`<atlas-automation-card .automation=${i} .names=${this.names}></atlas-automation-card>`
    )}
    `;
  }
};
nt.styles = rt`
    :host {
      display: block;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }
    input[type="search"] {
      flex: 1;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 1em;
    }
    .count {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      margin-bottom: 8px;
    }
  `;
Ot([
  b({ attribute: !1 })
], nt.prototype, "atlas", 2);
Ot([
  b({ attribute: !1 })
], nt.prototype, "names", 2);
Ot([
  _()
], nt.prototype, "search", 2);
nt = Ot([
  Q("atlas-plain-language-view")
], nt);
const Ji = 26, Ki = 20;
function U(t, e = Ji) {
  const i = t.split(/\s+/), n = [];
  let r = "";
  for (const o of i) {
    const s = r ? `${r} ${o}` : o;
    s.length > e && r ? (n.push(r), r = o) : r = s;
  }
  return r && n.push(r), n.length ? n : [t];
}
function Zi(t, e, i, n, r, o) {
  var s, l;
  switch (t.kind) {
    case "choose": {
      const a = t.path;
      n.push({ id: a, kind: "decision", lines: ["Depending on the situation…"], source: t });
      for (const d of e) o(d, a, i);
      const c = `${t.path}/join`;
      if (n.push({ id: c, kind: "join", lines: [] }), t.branches.forEach((d, u) => {
        const h = `${u === 0 ? "If" : "Otherwise, if"} ${C(d.conditions, r)}`;
        if (d.sequence.length === 0)
          o(a, c, h);
        else {
          const f = F(d.sequence, [a], h, n, r, o);
          for (const g of f) o(g, c);
        }
      }), (s = t.default) != null && s.length) {
        const d = F(t.default, [a], "Otherwise", n, r, o);
        for (const u of d) o(u, c);
      } else
        o(a, c, "Otherwise: (nothing)");
      return [c];
    }
    case "if": {
      const a = t.path;
      n.push({
        id: a,
        kind: "decision",
        lines: U(C(t.conditions, r), 40),
        source: t
      });
      for (const d of e) o(d, a, i);
      const c = `${t.path}/join`;
      if (n.push({ id: c, kind: "join", lines: [] }), t.then.length === 0) o(a, c, "yes");
      else {
        const d = F(t.then, [a], "yes", n, r, o);
        for (const u of d) o(u, c);
      }
      if ((l = t.else) != null && l.length) {
        const d = F(t.else, [a], "no", n, r, o);
        for (const u of d) o(u, c);
      } else
        o(a, c, "no");
      return [c];
    }
    case "parallel": {
      const a = t.path;
      n.push({ id: a, kind: "fork", lines: ["All at the same time"], source: t });
      for (const d of e) o(d, a, i);
      const c = `${t.path}/join`;
      return n.push({ id: c, kind: "join", lines: [] }), t.branches.forEach((d) => {
        if (d.length === 0) return;
        const u = F(d, [a], void 0, n, r, o);
        for (const h of u) o(h, c);
      }), [c];
    }
    case "repeat": {
      const a = t.path;
      let c;
      switch (t.mode) {
        case "count":
          c = `Repeat ${t.count}×`;
          break;
        case "while":
          c = `Repeat while ${C(t.whileConditions ?? [], r)}`;
          break;
        case "until":
          c = `Repeat until ${C(t.untilConditions ?? [], r)}`;
          break;
        case "for_each":
          c = "Repeat for each item";
          break;
      }
      n.push({ id: a, kind: "decision", lines: U(c, 40), source: t });
      for (const d of e) o(d, a, i);
      if (t.sequence.length) {
        const d = F(t.sequence, [a], "loop body", n, r, o);
        for (const u of d) o(u, a, "repeat");
      }
      return [a];
    }
    case "condition": {
      const a = t.path;
      n.push({
        id: a,
        kind: "decision",
        lines: U(`Continue only if ${it(t.condition, r)}`, 40),
        source: t
      });
      for (const d of e) o(d, a, i);
      const c = `${t.path}/stop`;
      return n.push({ id: c, kind: "terminal", lines: ["Stops here"] }), o(a, c, "otherwise"), [a];
    }
    case "stop": {
      const a = t.path;
      n.push({
        id: a,
        kind: "terminal",
        lines: U(`Stop${t.reason ? `: ${t.reason}` : ""}`),
        source: t
      });
      for (const c of e) o(c, a, i);
      return [];
    }
    default: {
      const a = t.path, [c] = M(t, r, 0);
      n.push({ id: a, kind: "action", lines: U((c == null ? void 0 : c.text) ?? t.kind), source: t });
      for (const d of e) o(d, a, i);
      return [a];
    }
  }
}
function F(t, e, i, n, r, o) {
  let s = e, l = i;
  for (const a of t)
    if (s = Zi(a, s, l, n, r, o), l = void 0, s.length === 0) break;
  return s;
}
function Qi(t, e = P) {
  const i = [], n = [];
  let r = 0;
  const o = (c, d, u) => {
    n.push({ id: `e${r++}`, source: c, target: d, label: u ? U(u, Ki) : void 0 });
  };
  let s = t.triggers.map((c) => (i.push({ id: c.path, kind: "trigger", lines: U(Se(c, e)), source: c }), c.path));
  s.length === 0 && (i.push({ id: "start", kind: "trigger", lines: ["(no triggers)"] }), s = ["start"]);
  let l = s;
  if (t.conditions.length) {
    const c = "condition-gate";
    i.push({
      id: c,
      kind: "condition",
      lines: U(`Only if: ${C(t.conditions, e)}`, 34)
    });
    for (const u of s) o(u, c);
    const d = "condition-gate/stop";
    i.push({ id: d, kind: "terminal", lines: ["Doesn't run"] }), o(c, d, "otherwise"), l = [c];
  }
  const a = F(t.actions, l, void 0, i, e, o);
  if (a.length) {
    i.push({ id: "done", kind: "terminal", lines: ["Done"] });
    for (const c of a) o(c, "done");
  }
  return { nodes: i, edges: n };
}
const tn = 16, en = 16, nn = 10, rn = 90, he = 14, Ee = 11, on = 10, sn = 13, an = new Set("iIl.,:;'|!()[]{}fjt- ".split("")), ln = new Set("mMWw@%&#".split(""));
function cn(t, e) {
  return an.has(t) ? e * 0.28 : ln.has(t) ? e * 0.85 : t >= "A" && t <= "Z" ? e * 0.68 : t >= "0" && t <= "9" ? e * 0.55 : e * 0.52;
}
function dn(t, e) {
  let i = 0;
  for (const n of t) i += cn(n, e);
  return i;
}
let xt;
function un() {
  return xt !== void 0 || (xt = typeof document > "u" ? null : document.createElement("canvas").getContext("2d") ?? null), xt;
}
function hn(t, e = Ee) {
  const i = un();
  return i ? (i.font = `${e}px sans-serif`, i.measureText(t).width) : dn(t, e);
}
function Oe(t, e) {
  return Math.max(0, ...t.map((i) => hn(i, e)));
}
function fn(t) {
  return t.kind === "join" ? { width: he, height: he } : {
    width: Math.max(rn, Oe(t.lines, Ee) + en * 2),
    height: Math.max(30, t.lines.length * tn + nn * 2)
  };
}
const pn = 6, gn = 4;
function $n(t) {
  return {
    width: Oe(t, on) + pn * 2,
    height: t.length * sn + gn * 2
  };
}
let fe;
function yn() {
  return fe ?? (fe = import("./elk.bundled-CyREwZVf.js").then((t) => t.e)), fe;
}
async function Te(t, e, i) {
  const { default: n } = await yn(), r = new n(), o = new Map(t.map((h) => [h.id, fn(h)])), s = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.layered.spacing.nodeNodeBetweenLayers": "50",
      "elk.spacing.nodeNode": "24",
      "elk.spacing.edgeLabel": "6",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.edgeLabels.sideSelection": "SMART"
    },
    children: t.map((h) => ({ id: h.id, ...o.get(h.id) })),
    edges: e.map((h) => {
      const f = h.label ? $n(h.label) : void 0;
      return {
        id: h.id,
        sources: [h.source],
        targets: [h.target],
        labels: f ? [{ text: h.label.join(`
`), ...f }] : void 0
      };
    })
  }, l = await r.layout(s), a = new Map(t.map((h) => [h.id, h])), c = (l.children ?? []).map((h) => {
    const f = a.get(h.id), g = o.get(h.id);
    return { ...f, x: h.x ?? 0, y: h.y ?? 0, width: h.width ?? g.width, height: h.height ?? g.height };
  }), d = new Map(e.map((h) => [h.id, h])), u = (l.edges ?? []).map((h) => {
    var Gt, Yt;
    const f = d.get(h.id), g = (Gt = h.sections) == null ? void 0 : Gt[0], v = g ? [g.startPoint, ...g.bendPoints ?? [], g.endPoint] : [], S = (Yt = h.labels) == null ? void 0 : Yt[0], _t = f.label && S ? {
      lines: f.label,
      x: S.x ?? 0,
      y: S.y ?? 0,
      width: S.width ?? 0,
      height: S.height ?? 0
    } : void 0;
    return { ...f, label: _t, points: v };
  });
  return {
    nodes: c,
    edges: u,
    width: l.width ?? 0,
    height: l.height ?? 0
  };
}
function vn(t) {
  return Te(t.nodes, t.edges);
}
function mn(t) {
  return new Set(t.action_trace.map((e) => e.path));
}
function pe(t, e, i) {
  return (e === void 0 || t > e) && (i === void 0 || t < i);
}
function bn(t, e) {
  var l;
  const i = e.trigger;
  if (!(i != null && i.entity_id)) return;
  let n = t.triggers.filter((a) => "entityId" in a && a.entityId.includes(i.entity_id));
  if (n.length <= 1) return (l = n[0]) == null ? void 0 : l.path;
  const r = Number(i.to_state), o = i.from_state !== void 0 ? Number(i.from_state) : NaN;
  if (!Number.isNaN(r)) {
    const a = n.filter((c) => !(c.kind !== "numeric_state" || !pe(r, c.above, c.below) || !Number.isNaN(o) && pe(o, c.above, c.below)));
    if (a.length === 1) return a[0].path;
  }
  const s = n.filter((a) => a.kind === i.platform);
  return s.length === 1 ? s[0].path : void 0;
}
function _n(t, e) {
  return { executedPaths: mn(e), firedTriggerId: bn(t, e) };
}
function wn(t, e) {
  return e.executedPaths.has(t.id) || t.id === e.firedTriggerId;
}
function xn(t, e) {
  return t.source.startsWith("trigger/") || t.source === "start" ? t.source === e.firedTriggerId : e.executedPaths.has(t.target);
}
const jt = 13;
function Ce(t, e, i = "var(--card-background-color, #fff)", n = "var(--primary-text-color, #333)") {
  if (!t) return "";
  const r = t.y + jt * 0.8 + (t.height - t.lines.length * jt) / 2;
  return w`
    <g>
      <rect
        x=${t.x}
        y=${t.y}
        width=${t.width}
        height=${t.height}
        rx="3"
        ry="3"
        fill=${i}
        stroke=${e}
        stroke-width="1"
      />
      ${t.lines.map(
    (o, s) => w`<text
            x=${t.x + t.width / 2}
            y=${r + s * jt}
            text-anchor="middle"
            font-family="sans-serif"
            font-size="10px"
            font-weight="500"
            fill=${n}
          >${o}</text>`
  )}
    </g>
  `;
}
var kn = Object.defineProperty, An = Object.getOwnPropertyDescriptor, R = (t, e, i, n) => {
  for (var r = n > 1 ? void 0 : n ? An(e, i) : e, o = t.length - 1, s; o >= 0; o--)
    (s = t[o]) && (r = (n ? s(e, i, r) : s(r)) || r);
  return n && r && kn(e, i, r), r;
};
const k = {
  trigger: { fill: "#e3f2fd", stroke: "#1976d2" },
  condition: { fill: "#fff3e0", stroke: "#f57c00" },
  decision: { fill: "#fff3e0", stroke: "#f57c00" },
  fork: { fill: "#f3e5f5", stroke: "#8e24aa" },
  action: { fill: "#ffffff", stroke: "#666666" },
  terminal: { fill: "#eeeeee", stroke: "#999999" },
  join: { fill: "#999999", stroke: "#999999" },
  text: "#212121",
  edge: "#888888",
  executedStroke: "#2e7d32",
  executedFill: "#c8e6c9",
  dimOpacity: "0.35",
  selectedStroke: "#0288d1",
  labelFill: "var(--card-background-color, #fff)",
  labelText: "var(--primary-text-color, #333)"
};
let O = class extends E {
  constructor() {
    super(...arguments), this.names = P, this.layoutState = "loading", this.traceState = "idle";
  }
  async willUpdate(t) {
    if (t.has("ir") && this.ir) {
      this.layoutState = "loading", this.overlay = void 0, this.traceState = "idle", this.selectedNode = void 0;
      try {
        const e = Qi(this.ir, this.names);
        this.laidOut = await vn(e), this.layoutState = "ready";
      } catch {
        this.layoutState = "error";
      }
    }
  }
  async loadTrace() {
    if (this.hass) {
      this.traceState = "loading";
      try {
        const t = await ki(this.hass, this.ir.id);
        if (!t) {
          this.traceState = "none";
          return;
        }
        this.overlay = _n(this.ir, t), this.traceState = "loaded";
      } catch {
        this.traceState = "error";
      }
    }
  }
  clearTrace() {
    this.overlay = void 0, this.traceState = "idle";
  }
  onNodeClick(t) {
    var e;
    this.selectedNode = ((e = this.selectedNode) == null ? void 0 : e.id) === t.id ? void 0 : t;
  }
  nodeColors(t) {
    const e = k[t.kind] ?? k.action;
    return this.overlay ? wn(t, this.overlay) ? { fill: k.executedFill, stroke: k.executedStroke, opacity: "1" } : { fill: e.fill, stroke: e.stroke, opacity: k.dimOpacity } : { fill: e.fill, stroke: e.stroke, opacity: "1" };
  }
  renderNodeShape(t) {
    var u, h;
    const { x: e, y: i, width: n, height: r, kind: o } = t, { fill: s, stroke: l, opacity: a } = this.nodeColors(t), c = ((u = this.selectedNode) == null ? void 0 : u.id) === t.id ? 3 : 1.5, d = ((h = this.selectedNode) == null ? void 0 : h.id) === t.id ? k.selectedStroke : l;
    if (o === "join")
      return w`<circle cx=${e + n / 2} cy=${i + r / 2} r=${n / 2} fill=${s} opacity=${a} />`;
    if (o === "decision" || o === "condition") {
      const f = e + n / 2, g = i + r / 2, v = `${f},${i} ${e + n},${g} ${f},${i + r} ${e},${g}`;
      return w`<polygon points=${v} fill=${s} stroke=${d} stroke-width=${c} opacity=${a} />`;
    }
    return o === "trigger" ? w`<rect x=${e} y=${i} width=${n} height=${r} rx=${r / 2} ry=${r / 2} fill=${s} stroke=${d} stroke-width=${c} opacity=${a} />` : o === "terminal" ? w`<rect x=${e} y=${i} width=${n} height=${r} rx="6" ry="6" fill=${s} stroke=${d} stroke-width=${c} stroke-dasharray="4 3" opacity=${a} />` : w`<rect x=${e} y=${i} width=${n} height=${r} rx="4" ry="4" fill=${s} stroke=${d} stroke-width=${c} opacity=${a} />`;
  }
  renderNode(t) {
    const i = t.y + t.height / 2 - (t.lines.length - 1) * 13 / 2;
    return w`
      <g class="node" @click=${() => this.onNodeClick(t)}>
        ${this.renderNodeShape(t)}
        ${t.lines.map(
      (n, r) => w`<text x=${t.x + t.width / 2} y=${i + r * 13} text-anchor="middle" dominant-baseline="middle" fill=${k.text}>${n}</text>`
    )}
      </g>
    `;
  }
  renderEdge(t) {
    if (!t.points.length) return w``;
    const e = t.points.map((s, l) => `${l === 0 ? "M" : "L"} ${s.x} ${s.y}`).join(" "), i = this.overlay ? xn(t, this.overlay) : !1, n = this.overlay && i ? k.executedStroke : k.edge, r = this.overlay && !i ? k.dimOpacity : "1";
    return w`
      <g opacity=${r}>
        <path d=${e} fill="none" stroke=${n} stroke-width=${i ? 2.5 : 1.5} marker-end="url(#arrow)" />
        ${Ce(t.label, n, k.labelFill, k.labelText)}
      </g>
    `;
  }
  getSvgElement() {
    return this.renderRoot.querySelector("svg");
  }
  async copyAsSvg() {
    const t = this.getSvgElement();
    if (!t) return;
    const e = new XMLSerializer().serializeToString(t);
    await navigator.clipboard.writeText(e);
  }
  downloadPng() {
    const t = this.getSvgElement();
    if (!t || !this.laidOut) return;
    const e = new XMLSerializer().serializeToString(t), i = new Blob([e], { type: "image/svg+xml;charset=utf-8" }), n = URL.createObjectURL(i), r = new Image();
    r.onload = () => {
      const s = document.createElement("canvas");
      s.width = this.laidOut.width * 2, s.height = this.laidOut.height * 2;
      const l = s.getContext("2d");
      l.fillStyle = "#ffffff", l.fillRect(0, 0, s.width, s.height), l.scale(2, 2), l.drawImage(r, 0, 0), URL.revokeObjectURL(n), s.toBlob((a) => {
        if (!a) return;
        const c = document.createElement("a");
        c.href = URL.createObjectURL(a), c.download = `${this.ir.alias.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`, c.click(), URL.revokeObjectURL(c.href);
      }, "image/png");
    }, r.src = n;
  }
  renderDetailPanel() {
    if (!this.selectedNode) return "";
    const t = this.selectedNode.lines.join(" ");
    return p`
      <div class="detail-panel">
        <div>${pt(t)}</div>
        ${this.selectedNode.source ? p`<pre>${JSON.stringify(this.selectedNode.source, null, 2)}</pre>` : ""}
        <button @click=${() => this.selectedNode = void 0}>Close</button>
      </div>
    `;
  }
  render() {
    return this.layoutState === "loading" ? p`<div class="status">Laying out flowchart…</div>` : this.layoutState === "error" || !this.laidOut ? p`<div class="status error">Couldn't lay out this automation's flowchart.</div>` : p`
      <div class="toolbar">
        <button @click=${() => this.loadTrace()} ?disabled=${!this.hass || this.traceState === "loading"}>
          ${this.traceState === "loading" ? "Loading trace…" : "Overlay last trace"}
        </button>
        ${this.overlay ? p`<button @click=${() => this.clearTrace()}>Clear overlay</button>` : ""}
        <button @click=${() => this.copyAsSvg()}>Copy as SVG</button>
        <button @click=${() => this.downloadPng()}>Download PNG</button>
      </div>
      ${this.traceState === "none" ? p`<div class="status">No trace recorded yet for this automation.</div>` : ""}
      ${this.traceState === "error" ? p`<div class="status error">Couldn't load the last trace.</div>` : ""}
      <div class="canvas">
        <svg viewBox="0 0 ${this.laidOut.width} ${this.laidOut.height}" width=${this.laidOut.width} height=${this.laidOut.height}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill=${k.edge} />
            </marker>
          </defs>
          ${this.laidOut.edges.map((t) => this.renderEdge(t))}
          ${this.laidOut.nodes.map((t) => this.renderNode(t))}
        </svg>
      </div>
      ${this.renderDetailPanel()}
    `;
  }
};
O.styles = rt`
    :host {
      display: block;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    button {
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 0.85em;
      color: var(--primary-text-color);
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .status {
      color: var(--secondary-text-color);
      padding: 8px 0;
    }
    .status.error {
      color: var(--error-color, #b00020);
    }
    .canvas {
      overflow: auto;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      max-height: 70vh;
    }
    svg text {
      font-family: sans-serif;
      font-size: 11px;
    }
    .node {
      cursor: pointer;
    }
    .detail-panel {
      margin-top: 8px;
      padding: 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      overflow-wrap: anywhere;
      color: var(--primary-text-color);
    }
    .detail-panel pre {
      background: rgba(0, 0, 0, 0.05);
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.75em;
      margin-top: 8px;
    }
    code {
      background: rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      padding: 0 4px;
    }
  `;
R([
  b({ attribute: !1 })
], O.prototype, "ir", 2);
R([
  b({ attribute: !1 })
], O.prototype, "names", 2);
R([
  b({ attribute: !1 })
], O.prototype, "hass", 2);
R([
  _()
], O.prototype, "laidOut", 2);
R([
  _()
], O.prototype, "layoutState", 2);
R([
  _()
], O.prototype, "overlay", 2);
R([
  _()
], O.prototype, "traceState", 2);
R([
  _()
], O.prototype, "selectedNode", 2);
O = R([
  Q("atlas-flowchart-view")
], O);
const In = /* @__PURE__ */ new Set(["trigger", "condition-read", "action-read", "template"]), Sn = {
  trigger: "triggers",
  "condition-read": "reads (condition)",
  "action-read": "reads",
  "action-write": "sets",
  "action-invoke": "triggers run of",
  template: "reads (template)"
};
function ge(t) {
  return t.startsWith("automation.") ? "automation" : "entity";
}
function Mt(t, e, i, n, r) {
  const o = In.has(n), s = o ? i : e, l = o ? e : i, a = `${s}->${l}`, c = t.get(a);
  c ? (c.roles.add(n), c.heuristic = c.heuristic || r) : t.set(a, { source: s, target: l, roles: /* @__PURE__ */ new Set([n]), heuristic: r });
}
function En(t, e, i = P) {
  const n = e.automations.find((a) => a.entityId === t), r = /* @__PURE__ */ new Map();
  if (n) {
    for (const c of n.refs)
      Mt(r, t, c.entityId, c.role, c.heuristic ?? !1);
    const a = e.index.byEntity.get(t) ?? [];
    for (const c of a)
      c.automationId !== t && Mt(r, c.automationId, t, c.role, !1);
  } else {
    const a = e.index.byEntity.get(t) ?? [];
    for (const c of a)
      Mt(r, c.automationId, t, c.role, !1);
  }
  const o = /* @__PURE__ */ new Set();
  for (const { source: a, target: c } of r.values())
    a !== t && o.add(a), c !== t && o.add(c);
  const s = [
    { id: t, kind: ge(t), lines: [i(t) ?? t], isCenter: !0 },
    ...[...o].map(
      (a) => ({ id: a, kind: ge(a), lines: [i(a) ?? a], isCenter: !1 })
    )
  ], l = [...r.entries()].map(([a, { source: c, target: d, roles: u, heuristic: h }]) => {
    const f = [...u];
    return {
      id: a,
      source: c,
      target: d,
      label: [f.map((g) => Sn[g]).join(", ")],
      roles: f,
      heuristic: h
    };
  });
  return { nodes: s, edges: l };
}
var On = Object.defineProperty, Tn = Object.getOwnPropertyDescriptor, st = (t, e, i, n) => {
  for (var r = n > 1 ? void 0 : n ? Tn(e, i) : e, o = t.length - 1, s; o >= 0; o--)
    (s = t[o]) && (r = (n ? s(e, i, r) : s(r)) || r);
  return n && r && On(e, i, r), r;
};
const L = {
  automation: { fill: "#e3f2fd", stroke: "#1976d2" },
  entity: { fill: "#e8f5e9", stroke: "#388e3c" },
  text: "#212121",
  edge: "#888888",
  centerStroke: "#0288d1",
  labelFill: "var(--card-background-color, #fff)",
  labelText: "var(--primary-text-color, #333)"
};
let H = class extends E {
  constructor() {
    super(...arguments), this.names = P, this.layoutState = "loading";
  }
  async willUpdate(t) {
    if ((t.has("centerId") || t.has("atlas")) && this.centerId && this.atlas) {
      this.layoutState = "loading";
      try {
        const e = En(this.centerId, this.atlas, this.names);
        this.laidOut = await Te(e.nodes, e.edges), this.layoutState = "ready";
      } catch {
        this.layoutState = "error";
      }
    }
  }
  onNodeClick(t) {
    t.isCenter || this.dispatchEvent(new CustomEvent("recenter", { detail: { id: t.id }, bubbles: !0, composed: !0 }));
  }
  renderNode(t) {
    const { x: e, y: i, width: n, height: r } = t, o = L[t.kind], s = t.isCenter ? 3 : 1.5, l = t.isCenter ? L.centerStroke : o.stroke, a = 13, c = i + r / 2 - (t.lines.length - 1) * a / 2;
    return w`
      <g class="node" @click=${() => this.onNodeClick(t)}>
        <rect x=${e} y=${i} width=${n} height=${r} rx="8" ry="8" fill=${o.fill} stroke=${l} stroke-width=${s} />
        ${t.lines.map(
      (d, u) => w`<text x=${e + n / 2} y=${c + u * a} text-anchor="middle" dominant-baseline="middle" fill=${L.text}>${d}</text>`
    )}
      </g>
    `;
  }
  renderEdge(t) {
    if (!t.points.length) return w``;
    const e = t.points.map((n, r) => `${r === 0 ? "M" : "L"} ${n.x} ${n.y}`).join(" "), i = t.heuristic ? "4 3" : void 0;
    return w`
      <g>
        <path d=${e} fill="none" stroke=${L.edge} stroke-width="1.5" stroke-dasharray=${i} marker-end="url(#arrow)" />
        ${Ce(t.label, L.edge, L.labelFill, L.labelText)}
      </g>
    `;
  }
  getSvgElement() {
    return this.renderRoot.querySelector("svg");
  }
  async copyAsSvg() {
    const t = this.getSvgElement();
    if (!t) return;
    const e = new XMLSerializer().serializeToString(t);
    await navigator.clipboard.writeText(e);
  }
  downloadPng() {
    const t = this.getSvgElement();
    if (!t || !this.laidOut) return;
    const e = new XMLSerializer().serializeToString(t), i = new Blob([e], { type: "image/svg+xml;charset=utf-8" }), n = URL.createObjectURL(i), r = new Image();
    r.onload = () => {
      const s = document.createElement("canvas");
      s.width = this.laidOut.width * 2, s.height = this.laidOut.height * 2;
      const l = s.getContext("2d");
      l.fillStyle = "#ffffff", l.fillRect(0, 0, s.width, s.height), l.scale(2, 2), l.drawImage(r, 0, 0), URL.revokeObjectURL(n), s.toBlob((a) => {
        if (!a) return;
        const c = document.createElement("a");
        c.href = URL.createObjectURL(a), c.download = `${(this.names(this.centerId) ?? this.centerId).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-graph.png`, c.click(), URL.revokeObjectURL(c.href);
      }, "image/png");
    }, r.src = n;
  }
  render() {
    return this.layoutState === "loading" ? p`<div class="status">Laying out graph…</div>` : this.layoutState === "error" || !this.laidOut ? p`<div class="status error">Couldn't lay out this graph.</div>` : p`
      <div class="toolbar">
        <button @click=${() => this.copyAsSvg()}>Copy as SVG</button>
        <button @click=${() => this.downloadPng()}>Download PNG</button>
      </div>
      <div class="canvas">
        <svg viewBox="0 0 ${this.laidOut.width} ${this.laidOut.height}" width=${this.laidOut.width} height=${this.laidOut.height}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill=${L.edge} />
            </marker>
          </defs>
          ${this.laidOut.edges.map((t) => this.renderEdge(t))}
          ${this.laidOut.nodes.map((t) => this.renderNode(t))}
        </svg>
      </div>
    `;
  }
};
H.styles = rt`
    :host {
      display: block;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    button {
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 0.85em;
      color: var(--primary-text-color);
    }
    .status {
      color: var(--secondary-text-color);
      padding: 8px 0;
    }
    .status.error {
      color: var(--error-color, #b00020);
    }
    .canvas {
      overflow: auto;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      max-height: 70vh;
    }
    svg text {
      font-family: sans-serif;
      font-size: 11px;
    }
    .node {
      cursor: pointer;
    }
  `;
st([
  b({ attribute: !1 })
], H.prototype, "centerId", 2);
st([
  b({ attribute: !1 })
], H.prototype, "atlas", 2);
st([
  b({ attribute: !1 })
], H.prototype, "names", 2);
st([
  _()
], H.prototype, "laidOut", 2);
st([
  _()
], H.prototype, "layoutState", 2);
H = st([
  Q("atlas-ego-graph-view")
], H);
var Cn = Object.defineProperty, Nn = Object.getOwnPropertyDescriptor, Ft = (t, e, i, n) => {
  for (var r = n > 1 ? void 0 : n ? Nn(e, i) : e, o = t.length - 1, s; o >= 0; o--)
    (s = t[o]) && (r = (n ? s(e, i, r) : s(r)) || r);
  return n && r && Cn(e, i, r), r;
};
const $e = { error: 0, warning: 1, info: 2 }, Pn = { error: "Error", warning: "Warning", info: "Info" };
let mt = class extends E {
  constructor() {
    super(...arguments), this.findings = [];
  }
  storageIdFor(t) {
    var e;
    if (!(!t || !this.atlas))
      return (e = this.atlas.automations.find((i) => i.entityId === t)) == null ? void 0 : e.id;
  }
  render() {
    if (this.findings.length === 0)
      return p`<div class="empty">No issues found.</div>`;
    const t = [...this.findings].sort((i, n) => {
      const r = $e[i.severity] - $e[n.severity];
      return r !== 0 ? r : (i.automationAlias ?? "").localeCompare(n.automationAlias ?? "");
    }), e = { error: 0, warning: 0, info: 0 };
    for (const i of this.findings) e[i.severity]++;
    return p`
      <div class="summary">${e.error} errors, ${e.warning} warnings, ${e.info} info</div>
      ${Ie(
      t,
      (i) => i.id,
      (i) => {
        const n = this.storageIdFor(i.automationEntityId);
        return p`
            <div class="row">
              <span class="chip ${i.severity}">${Pn[i.severity]}</span>
              <span class="message">
                ${i.automationAlias ? p`<strong>${i.automationAlias}</strong>: ` : ""}${pt(i.message)}
              </span>
              ${n ? p`<a class="edit-link" href="/config/automation/edit/${n}" target="_top">Edit ↗</a>` : ""}
            </div>
          `;
      }
    )}
    `;
  }
};
mt.styles = rt`
    :host {
      display: block;
    }
    .summary {
      color: var(--secondary-text-color);
      font-size: 0.9em;
      margin-bottom: 12px;
    }
    .row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .chip {
      flex-shrink: 0;
      font-size: 0.7em;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 10px;
      color: #fff;
    }
    .chip.error {
      background: var(--error-color, #b00020);
    }
    .chip.warning {
      background: var(--warning-color, #ff9800);
    }
    .chip.info {
      background: var(--secondary-text-color, #727272);
    }
    .message {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    a.edit-link {
      color: var(--primary-color);
      text-decoration: none;
      flex-shrink: 0;
      font-size: 0.85em;
    }
    @media (max-width: 480px) {
      .row {
        flex-wrap: wrap;
      }
    }
    .empty {
      color: var(--secondary-text-color);
      padding: 16px 0;
    }
    code {
      background: rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      padding: 0 4px;
    }
  `;
Ft([
  b({ attribute: !1 })
], mt.prototype, "findings", 2);
Ft([
  b({ attribute: !1 })
], mt.prototype, "atlas", 2);
mt = Ft([
  Q("atlas-audit-view")
], mt);
var Rn = Object.defineProperty, Ln = Object.getOwnPropertyDescriptor, Ne = (t, e, i, n) => {
  for (var r = n > 1 ? void 0 : n ? Ln(e, i) : e, o = t.length - 1, s; o >= 0; o--)
    (s = t[o]) && (r = (n ? s(e, i, r) : s(r)) || r);
  return n && r && Rn(e, i, r), r;
};
let Dt = class extends E {
  setConfig(t) {
  }
  render() {
    return p`<ha-card header="Automation Atlas">Coming soon.</ha-card>`;
  }
};
Ne([
  b({ attribute: !1 })
], Dt.prototype, "hass", 2);
Dt = Ne([
  Q("automation-atlas-card")
], Dt);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "automation-atlas-card",
  name: "Automation Atlas",
  description: "Plain-language view of your automations."
});
var jn = Object.defineProperty, Mn = Object.getOwnPropertyDescriptor, T = (t, e, i, n) => {
  for (var r = n > 1 ? void 0 : n ? Mn(e, i) : e, o = t.length - 1, s; o >= 0; o--)
    (s = t[o]) && (r = (n ? s(e, i, r) : s(r)) || r);
  return n && r && jn(e, i, r), r;
};
let I = class extends E {
  constructor() {
    super(...arguments), this.narrow = !1, this.load = { status: "loading" }, this.names = () => {
    }, this.activeTab = "plain-language", this.auditFindings = [], this.hasLoaded = !1;
  }
  async updated(t) {
    t.has("hass") && this.hass && !this.hasLoaded && (this.hasLoaded = !0, await this.loadAtlas(), this.unsubscribeReload = await _i(this.hass, () => this.loadAtlas()));
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this.unsubscribeReload) == null || t.call(this);
  }
  async loadAtlas() {
    this.load = { status: "loading" };
    try {
      const { atlas: t, entityRegistry: e } = await bi(this.hass);
      this.names = mi(this.hass, e), this.auditFindings = si(t, e, this.hass), this.load = { status: "ready", atlas: t };
    } catch (t) {
      this.load = { status: "error", message: t instanceof Error ? t.message : String(t) };
    }
  }
  onViewFlowchart(t) {
    this.flowchartEntityId = t.detail.entityId, this.activeTab = "flowchart";
  }
  onViewDependencyGraph(t) {
    this.centerId = t.detail.entityId, this.activeTab = "dependency-graph";
  }
  onRecenter(t) {
    this.centerId = t.detail.id;
  }
  onPickFlowchartAutomation(t) {
    this.flowchartEntityId = t.target.value;
  }
  onPickCenter(t) {
    this.centerId = t.target.value;
  }
  renderTabs() {
    return p`
      <div class="tabs">
        <button class=${this.activeTab === "plain-language" ? "active" : ""} @click=${() => this.activeTab = "plain-language"}>
          Plain Language
        </button>
        <button class=${this.activeTab === "flowchart" ? "active" : ""} @click=${() => this.activeTab = "flowchart"}>
          Flowchart
        </button>
        <button class=${this.activeTab === "dependency-graph" ? "active" : ""} @click=${() => this.activeTab = "dependency-graph"}>
          Dependency Graph
        </button>
        <button class=${this.activeTab === "audit" ? "active" : ""} @click=${() => this.activeTab = "audit"}>
          Audit
        </button>
      </div>
    `;
  }
  renderFlowchartTab(t) {
    var r;
    const e = t.automations.filter((o) => !o.configUnavailable && !o.isBlueprintInstance), i = this.flowchartEntityId ?? ((r = e[0]) == null ? void 0 : r.entityId), n = e.find((o) => o.entityId === i);
    return p`
      <select .value=${i ?? ""} @change=${this.onPickFlowchartAutomation}>
        ${e.map((o) => p`<option value=${o.entityId}>${o.alias}</option>`)}
      </select>
      ${n ? p`<atlas-flowchart-view .ir=${n} .names=${this.names} .hass=${this.hass}></atlas-flowchart-view>` : p`<div class="status">No automations available to diagram.</div>`}
    `;
  }
  renderDependencyGraphTab(t) {
    var r;
    const e = t.automations.filter((o) => !o.configUnavailable && !o.isBlueprintInstance), i = this.centerId ?? ((r = e[0]) == null ? void 0 : r.entityId), n = e.some((o) => o.entityId === i);
    return i ? p`
      ${n ? p`
            <select .value=${i} @change=${this.onPickCenter}>
              ${e.map((o) => p`<option value=${o.entityId}>${o.alias}</option>`)}
            </select>
          ` : p`
            <div class="status">
              Centered on: <strong>${this.names(i) ?? i}</strong>
              <a href="#" @click=${(o) => {
      var s;
      o.preventDefault(), this.centerId = (s = e[0]) == null ? void 0 : s.entityId;
    }}>
                Back to automation list
              </a>
            </div>
          `}
      <atlas-ego-graph-view .centerId=${i} .atlas=${t} .names=${this.names}></atlas-ego-graph-view>
    ` : p`<div class="status">No automations available to graph.</div>`;
  }
  renderAuditTab() {
    return p`
      <atlas-audit-view
        .findings=${this.auditFindings}
        .atlas=${this.load.status === "ready" ? this.load.atlas : void 0}
      ></atlas-audit-view>
    `;
  }
  render() {
    return p`
      <div class="topbar">
        <h1>Automation Atlas</h1>
        <button class="refresh" @click=${() => this.loadAtlas()}>Refresh</button>
      </div>
      ${this.renderTabs()}
      ${this.load.status === "loading" ? p`<div class="status">Loading automations…</div>` : this.load.status === "error" ? p`<div class="status error">Couldn't load automations: ${this.load.message}</div>` : p`
              <div @view-flowchart=${this.onViewFlowchart} @view-dependency-graph=${this.onViewDependencyGraph} @recenter=${this.onRecenter} style="display: contents">
                ${this.activeTab === "plain-language" ? p`<atlas-plain-language-view .atlas=${this.load.atlas} .names=${this.names}></atlas-plain-language-view>` : this.activeTab === "flowchart" ? this.renderFlowchartTab(this.load.atlas) : this.activeTab === "dependency-graph" ? this.renderDependencyGraphTab(this.load.atlas) : this.renderAuditTab()}
              </div>
            `}
    `;
  }
};
I.styles = rt`
    :host {
      display: block;
      padding: 16px;
      color: var(--primary-text-color);
      background: var(--primary-background-color);
      min-height: 100vh;
      box-sizing: border-box;
      max-width: 1100px;
      margin: 0 auto;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 1.4em;
      margin: 0;
    }
    button.refresh {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
    }
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .tabs button {
      background: none;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 0.95em;
      color: var(--secondary-text-color);
      border-bottom: 2px solid transparent;
    }
    @media (max-width: 480px) {
      :host {
        padding: 8px;
      }
      .tabs button {
        padding: 8px 10px;
        font-size: 0.85em;
      }
    }
    .tabs button.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
      font-weight: 500;
    }
    .status {
      color: var(--secondary-text-color);
      padding: 32px 0;
      text-align: center;
    }
    .status.error {
      color: var(--error-color, #b00020);
    }
    select {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      margin-bottom: 12px;
      max-width: 100%;
    }
  `;
T([
  b({ attribute: !1 })
], I.prototype, "hass", 2);
T([
  b({ type: Boolean })
], I.prototype, "narrow", 2);
T([
  b({ attribute: !1 })
], I.prototype, "panel", 2);
T([
  b({ attribute: !1 })
], I.prototype, "route", 2);
T([
  _()
], I.prototype, "load", 2);
T([
  _()
], I.prototype, "names", 2);
T([
  _()
], I.prototype, "activeTab", 2);
T([
  _()
], I.prototype, "flowchartEntityId", 2);
T([
  _()
], I.prototype, "centerId", 2);
T([
  _()
], I.prototype, "auditFindings", 2);
I = T([
  Q("automation-atlas-panel")
], I);
export {
  I as AutomationAtlasPanel
};
