var i_ = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var $K = i_((Tr, xr) => {
  /**
   * @vue/shared v3.4.21
   * (c) 2018-present Yuxi (Evan) You and Vue contributors
   * @license MIT
   **/
  function Ao(e, t) {
    const r = new Set(e.split(","));
    return t ? n => r.has(n.toLowerCase()) : n => r.has(n);
  }
  const Ue = {}.NODE_ENV !== "production" ? Object.freeze({}) : {},
    ho = {}.NODE_ENV !== "production" ? Object.freeze([]) : [],
    dt = () => {},
    s_ = () => !1,
    Ti = e =>
      e.charCodeAt(0) === 111 &&
      e.charCodeAt(1) === 110 && // uppercase letter
      (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97),
    Rs = e => e.startsWith("onUpdate:"),
    ot = Object.assign,
    yc = (e, t) => {
      const r = e.indexOf(t);
      r > -1 && e.splice(r, 1);
    },
    a_ = Object.prototype.hasOwnProperty,
    Me = (e, t) => a_.call(e, t),
    he = Array.isArray,
    xn = e => ua(e) === "[object Map]",
    Kh = e => ua(e) === "[object Set]",
    be = e => typeof e == "function",
    nt = e => typeof e == "string",
    So = e => typeof e == "symbol",
    Be = e => e !== null && typeof e == "object",
    _c = e => (Be(e) || be(e)) && be(e.then) && be(e.catch),
    Gh = Object.prototype.toString,
    ua = e => Gh.call(e),
    $c = e => ua(e).slice(8, -1),
    qh = e => ua(e) === "[object Object]",
    bc = e =>
      nt(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e,
    ai = /* @__PURE__ */ Ao(
      // the leading comma is intentional so empty string "" is also included
      ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
    ),
    l_ = /* @__PURE__ */ Ao(
      "bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo"
    ),
    fa = e => {
      const t = /* @__PURE__ */ Object.create(null);
      return r => t[r] || (t[r] = e(r));
    },
    c_ = /-(\w)/g,
    Ct = fa(e => e.replace(c_, (t, r) => (r ? r.toUpperCase() : ""))),
    u_ = /\B([A-Z])/g,
    Bt = fa(e => e.replace(u_, "-$1").toLowerCase()),
    Vn = fa(e => e.charAt(0).toUpperCase() + e.slice(1)),
    Cr = fa(e => (e ? `on${Vn(e)}` : "")),
    un = (e, t) => !Object.is(e, t),
    Ko = (e, t) => {
      for (let r = 0; r < e.length; r++) e[r](t);
    },
    Ms = (e, t, r) => {
      Object.defineProperty(e, t, {
        configurable: !0,
        enumerable: !1,
        value: r,
      });
    },
    f_ = e => {
      const t = parseFloat(e);
      return isNaN(t) ? e : t;
    },
    If = e => {
      const t = nt(e) ? Number(e) : NaN;
      return isNaN(t) ? e : t;
    };
  let Rf;
  const wc = () =>
    Rf ||
    (Rf =
      typeof globalThis < "u"
        ? globalThis
        : typeof self < "u"
          ? self
          : typeof window < "u"
            ? window
            : typeof global < "u"
              ? global
              : {});
  function Gn(e) {
    if (he(e)) {
      const t = {};
      for (let r = 0; r < e.length; r++) {
        const n = e[r],
          o = nt(n) ? g_(n) : Gn(n);
        if (o) for (const i in o) t[i] = o[i];
      }
      return t;
    } else if (nt(e) || Be(e)) return e;
  }
  const d_ = /;(?![^(]*\))/g,
    p_ = /:([^]+)/,
    h_ = /\/\*[^]*?\*\//g;
  function g_(e) {
    const t = {};
    return (
      e
        .replace(h_, "")
        .split(d_)
        .forEach(r => {
          if (r) {
            const n = r.split(p_);
            n.length > 1 && (t[n[0].trim()] = n[1].trim());
          }
        }),
      t
    );
  }
  function it(e) {
    let t = "";
    if (nt(e)) t = e;
    else if (he(e))
      for (let r = 0; r < e.length; r++) {
        const n = it(e[r]);
        n && (t += n + " ");
      }
    else if (Be(e)) for (const r in e) e[r] && (t += r + " ");
    return t.trim();
  }
  function No(e) {
    if (!e) return null;
    let { class: t, style: r } = e;
    return t && !nt(t) && (e.class = it(t)), r && (e.style = Gn(r)), e;
  }
  const m_ =
      "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",
    v_ = /* @__PURE__ */ Ao(m_);
  function Yh(e) {
    return !!e || e === "";
  }
  const kn = e =>
      nt(e)
        ? e
        : e == null
          ? ""
          : he(e) || (Be(e) && (e.toString === Gh || !be(e.toString)))
            ? JSON.stringify(e, Jh, 2)
            : String(e),
    Jh = (e, t) =>
      t && t.__v_isRef
        ? Jh(e, t.value)
        : xn(t)
          ? {
              [`Map(${t.size})`]: [...t.entries()].reduce(
                (r, [n, o], i) => ((r[Za(n, i) + " =>"] = o), r),
                {}
              ),
            }
          : Kh(t)
            ? {
                [`Set(${t.size})`]: [...t.values()].map(r => Za(r)),
              }
            : So(t)
              ? Za(t)
              : Be(t) && !he(t) && !qh(t)
                ? String(t)
                : t,
    Za = (e, t = "") => {
      var r;
      return So(e) ? `Symbol(${(r = e.description) != null ? r : t})` : e;
    };
  /**
   * @vue/reactivity v3.4.21
   * (c) 2018-present Yuxi (Evan) You and Vue contributors
   * @license MIT
   **/
  function _r(e, ...t) {
    console.warn(`[Vue warn] ${e}`, ...t);
  }
  let Lt;
  class Xh {
    constructor(t = !1) {
      (this.detached = t),
        (this._active = !0),
        (this.effects = []),
        (this.cleanups = []),
        (this.parent = Lt),
        !t &&
          Lt &&
          (this.index = (Lt.scopes || (Lt.scopes = [])).push(this) - 1);
    }
    get active() {
      return this._active;
    }
    run(t) {
      if (this._active) {
        const r = Lt;
        try {
          return (Lt = this), t();
        } finally {
          Lt = r;
        }
      } else
        ({}).NODE_ENV !== "production" &&
          _r("cannot run an inactive effect scope.");
    }
    /**
     * This should only be called on non-detached scopes
     * @internal
     */
    on() {
      Lt = this;
    }
    /**
     * This should only be called on non-detached scopes
     * @internal
     */
    off() {
      Lt = this.parent;
    }
    stop(t) {
      if (this._active) {
        let r, n;
        for (r = 0, n = this.effects.length; r < n; r++) this.effects[r].stop();
        for (r = 0, n = this.cleanups.length; r < n; r++) this.cleanups[r]();
        if (this.scopes)
          for (r = 0, n = this.scopes.length; r < n; r++)
            this.scopes[r].stop(!0);
        if (!this.detached && this.parent && !t) {
          const o = this.parent.scopes.pop();
          o &&
            o !== this &&
            ((this.parent.scopes[this.index] = o), (o.index = this.index));
        }
        (this.parent = void 0), (this._active = !1);
      }
    }
  }
  function Zh(e) {
    return new Xh(e);
  }
  function y_(e, t = Lt) {
    t && t.active && t.effects.push(e);
  }
  function Ec() {
    return Lt;
  }
  function Qh(e) {
    Lt
      ? Lt.cleanups.push(e)
      : {}.NODE_ENV !== "production" &&
        _r(
          "onScopeDispose() is called when there is no active effect scope to be associated with."
        );
  }
  let Dn;
  class Oc {
    constructor(t, r, n, o) {
      (this.fn = t),
        (this.trigger = r),
        (this.scheduler = n),
        (this.active = !0),
        (this.deps = []),
        (this._dirtyLevel = 4),
        (this._trackId = 0),
        (this._runnings = 0),
        (this._shouldSchedule = !1),
        (this._depsLength = 0),
        y_(this, o);
    }
    get dirty() {
      if (this._dirtyLevel === 2 || this._dirtyLevel === 3) {
        (this._dirtyLevel = 1), hn();
        for (let t = 0; t < this._depsLength; t++) {
          const r = this.deps[t];
          if (r.computed && (__(r.computed), this._dirtyLevel >= 4)) break;
        }
        this._dirtyLevel === 1 && (this._dirtyLevel = 0), gn();
      }
      return this._dirtyLevel >= 4;
    }
    set dirty(t) {
      this._dirtyLevel = t ? 4 : 0;
    }
    run() {
      if (((this._dirtyLevel = 0), !this.active)) return this.fn();
      let t = an,
        r = Dn;
      try {
        return (an = !0), (Dn = this), this._runnings++, Mf(this), this.fn();
      } finally {
        jf(this), this._runnings--, (Dn = r), (an = t);
      }
    }
    stop() {
      var t;
      this.active &&
        (Mf(this),
        jf(this),
        (t = this.onStop) == null || t.call(this),
        (this.active = !1));
    }
  }
  function __(e) {
    return e.value;
  }
  function Mf(e) {
    e._trackId++, (e._depsLength = 0);
  }
  function jf(e) {
    if (e.deps.length > e._depsLength) {
      for (let t = e._depsLength; t < e.deps.length; t++) eg(e.deps[t], e);
      e.deps.length = e._depsLength;
    }
  }
  function eg(e, t) {
    const r = e.get(t);
    r !== void 0 &&
      t._trackId !== r &&
      (e.delete(t), e.size === 0 && e.cleanup());
  }
  let an = !0,
    xl = 0;
  const tg = [];
  function hn() {
    tg.push(an), (an = !1);
  }
  function gn() {
    const e = tg.pop();
    an = e === void 0 ? !0 : e;
  }
  function Ac() {
    xl++;
  }
  function Sc() {
    for (xl--; !xl && Dl.length; ) Dl.shift()();
  }
  function rg(e, t, r) {
    var n;
    if (t.get(e) !== e._trackId) {
      t.set(e, e._trackId);
      const o = e.deps[e._depsLength];
      o !== t
        ? (o && eg(o, e), (e.deps[e._depsLength++] = t))
        : e._depsLength++,
        {}.NODE_ENV !== "production" &&
          ((n = e.onTrack) == null || n.call(e, ot({ effect: e }, r)));
    }
  }
  const Dl = [];
  function ng(e, t, r) {
    var n;
    Ac();
    for (const o of e.keys()) {
      let i;
      o._dirtyLevel < t &&
        (i ?? (i = e.get(o) === o._trackId)) &&
        (o._shouldSchedule || (o._shouldSchedule = o._dirtyLevel === 0),
        (o._dirtyLevel = t)),
        o._shouldSchedule &&
          (i ?? (i = e.get(o) === o._trackId)) &&
          ({}.NODE_ENV !== "production" &&
            ((n = o.onTrigger) == null || n.call(o, ot({ effect: o }, r))),
          o.trigger(),
          (!o._runnings || o.allowRecurse) &&
            o._dirtyLevel !== 2 &&
            ((o._shouldSchedule = !1), o.scheduler && Dl.push(o.scheduler)));
    }
    Sc();
  }
  const og = (e, t) => {
      const r = /* @__PURE__ */ new Map();
      return (r.cleanup = e), (r.computed = t), r;
    },
    js = /* @__PURE__ */ new WeakMap(),
    In = Symbol({}.NODE_ENV !== "production" ? "iterate" : ""),
    Il = Symbol({}.NODE_ENV !== "production" ? "Map key iterate" : "");
  function bt(e, t, r) {
    if (an && Dn) {
      let n = js.get(e);
      n || js.set(e, (n = /* @__PURE__ */ new Map()));
      let o = n.get(r);
      o || n.set(r, (o = og(() => n.delete(r)))),
        rg(
          Dn,
          o,
          {}.NODE_ENV !== "production"
            ? {
                target: e,
                type: t,
                key: r,
              }
            : void 0
        );
    }
  }
  function yr(e, t, r, n, o, i) {
    const s = js.get(e);
    if (!s) return;
    let a = [];
    if (t === "clear") a = [...s.values()];
    else if (r === "length" && he(e)) {
      const l = Number(n);
      s.forEach((c, u) => {
        (u === "length" || (!So(u) && u >= l)) && a.push(c);
      });
    } else
      switch ((r !== void 0 && a.push(s.get(r)), t)) {
        case "add":
          he(e)
            ? bc(r) && a.push(s.get("length"))
            : (a.push(s.get(In)), xn(e) && a.push(s.get(Il)));
          break;
        case "delete":
          he(e) || (a.push(s.get(In)), xn(e) && a.push(s.get(Il)));
          break;
        case "set":
          xn(e) && a.push(s.get(In));
          break;
      }
    Ac();
    for (const l of a)
      l &&
        ng(
          l,
          4,
          {}.NODE_ENV !== "production"
            ? {
                target: e,
                type: t,
                key: r,
                newValue: n,
                oldValue: o,
                oldTarget: i,
              }
            : void 0
        );
    Sc();
  }
  function $_(e, t) {
    var r;
    return (r = js.get(e)) == null ? void 0 : r.get(t);
  }
  const b_ = /* @__PURE__ */ Ao("__proto__,__v_isRef,__isVue"),
    ig = new Set(
      /* @__PURE__ */ Object.getOwnPropertyNames(Symbol)
        .filter(e => e !== "arguments" && e !== "caller")
        .map(e => Symbol[e])
        .filter(So)
    ),
    Ff = /* @__PURE__ */ w_();
  function w_() {
    const e = {};
    return (
      ["includes", "indexOf", "lastIndexOf"].forEach(t => {
        e[t] = function (...r) {
          const n = Ne(this);
          for (let i = 0, s = this.length; i < s; i++) bt(n, "get", i + "");
          const o = n[t](...r);
          return o === -1 || o === !1 ? n[t](...r.map(Ne)) : o;
        };
      }),
      ["push", "pop", "shift", "unshift", "splice"].forEach(t => {
        e[t] = function (...r) {
          hn(), Ac();
          const n = Ne(this)[t].apply(this, r);
          return Sc(), gn(), n;
        };
      }),
      e
    );
  }
  function E_(e) {
    const t = Ne(this);
    return bt(t, "has", e), t.hasOwnProperty(e);
  }
  class sg {
    constructor(t = !1, r = !1) {
      (this._isReadonly = t), (this._isShallow = r);
    }
    get(t, r, n) {
      const o = this._isReadonly,
        i = this._isShallow;
      if (r === "__v_isReactive") return !o;
      if (r === "__v_isReadonly") return o;
      if (r === "__v_isShallow") return i;
      if (r === "__v_raw")
        return n === (o ? (i ? pg : dg) : i ? fg : ug).get(t) || // receiver is not the reactive proxy, but has the same prototype
          // this means the reciever is a user proxy of the reactive proxy
          Object.getPrototypeOf(t) === Object.getPrototypeOf(n)
          ? t
          : void 0;
      const s = he(t);
      if (!o) {
        if (s && Me(Ff, r)) return Reflect.get(Ff, r, n);
        if (r === "hasOwnProperty") return E_;
      }
      const a = Reflect.get(t, r, n);
      return (So(r) ? ig.has(r) : b_(r)) || (o || bt(t, "get", r), i)
        ? a
        : yt(a)
          ? s && bc(r)
            ? a
            : a.value
          : Be(a)
            ? o
              ? ha(a)
              : xi(a)
            : a;
    }
  }
  class ag extends sg {
    constructor(t = !1) {
      super(!1, t);
    }
    set(t, r, n, o) {
      let i = t[r];
      if (!this._isShallow) {
        const l = fn(i);
        if (
          (!Mn(n) && !fn(n) && ((i = Ne(i)), (n = Ne(n))),
          !he(t) && yt(i) && !yt(n))
        )
          return l ? !1 : ((i.value = n), !0);
      }
      const s = he(t) && bc(r) ? Number(r) < t.length : Me(t, r),
        a = Reflect.set(t, r, n, o);
      return (
        t === Ne(o) &&
          (s ? un(n, i) && yr(t, "set", r, n, i) : yr(t, "add", r, n)),
        a
      );
    }
    deleteProperty(t, r) {
      const n = Me(t, r),
        o = t[r],
        i = Reflect.deleteProperty(t, r);
      return i && n && yr(t, "delete", r, void 0, o), i;
    }
    has(t, r) {
      const n = Reflect.has(t, r);
      return (!So(r) || !ig.has(r)) && bt(t, "has", r), n;
    }
    ownKeys(t) {
      return bt(t, "iterate", he(t) ? "length" : In), Reflect.ownKeys(t);
    }
  }
  class lg extends sg {
    constructor(t = !1) {
      super(!0, t);
    }
    set(t, r) {
      return (
        {}.NODE_ENV !== "production" &&
          _r(
            `Set operation on key "${String(r)}" failed: target is readonly.`,
            t
          ),
        !0
      );
    }
    deleteProperty(t, r) {
      return (
        {}.NODE_ENV !== "production" &&
          _r(
            `Delete operation on key "${String(r)}" failed: target is readonly.`,
            t
          ),
        !0
      );
    }
  }
  const O_ = /* @__PURE__ */ new ag(),
    A_ = /* @__PURE__ */ new lg(),
    S_ = /* @__PURE__ */ new ag(!0),
    N_ = /* @__PURE__ */ new lg(!0),
    Nc = e => e,
    da = e => Reflect.getPrototypeOf(e);
  function os(e, t, r = !1, n = !1) {
    e = e.__v_raw;
    const o = Ne(e),
      i = Ne(t);
    r || (un(t, i) && bt(o, "get", t), bt(o, "get", i));
    const { has: s } = da(o),
      a = n ? Nc : r ? Pc : wi;
    if (s.call(o, t)) return a(e.get(t));
    if (s.call(o, i)) return a(e.get(i));
    e !== o && e.get(t);
  }
  function is(e, t = !1) {
    const r = this.__v_raw,
      n = Ne(r),
      o = Ne(e);
    return (
      t || (un(e, o) && bt(n, "has", e), bt(n, "has", o)),
      e === o ? r.has(e) : r.has(e) || r.has(o)
    );
  }
  function ss(e, t = !1) {
    return (
      (e = e.__v_raw), !t && bt(Ne(e), "iterate", In), Reflect.get(e, "size", e)
    );
  }
  function Lf(e) {
    e = Ne(e);
    const t = Ne(this);
    return da(t).has.call(t, e) || (t.add(e), yr(t, "add", e, e)), this;
  }
  function Vf(e, t) {
    t = Ne(t);
    const r = Ne(this),
      { has: n, get: o } = da(r);
    let i = n.call(r, e);
    i
      ? {}.NODE_ENV !== "production" && cg(r, n, e)
      : ((e = Ne(e)), (i = n.call(r, e)));
    const s = o.call(r, e);
    return (
      r.set(e, t),
      i ? un(t, s) && yr(r, "set", e, t, s) : yr(r, "add", e, t),
      this
    );
  }
  function kf(e) {
    const t = Ne(this),
      { has: r, get: n } = da(t);
    let o = r.call(t, e);
    o
      ? {}.NODE_ENV !== "production" && cg(t, r, e)
      : ((e = Ne(e)), (o = r.call(t, e)));
    const i = n ? n.call(t, e) : void 0,
      s = t.delete(e);
    return o && yr(t, "delete", e, void 0, i), s;
  }
  function Bf() {
    const e = Ne(this),
      t = e.size !== 0,
      r =
        {}.NODE_ENV !== "production"
          ? xn(e)
            ? new Map(e)
            : new Set(e)
          : void 0,
      n = e.clear();
    return t && yr(e, "clear", void 0, void 0, r), n;
  }
  function as(e, t) {
    return function (n, o) {
      const i = this,
        s = i.__v_raw,
        a = Ne(s),
        l = t ? Nc : e ? Pc : wi;
      return (
        !e && bt(a, "iterate", In),
        s.forEach((c, u) => n.call(o, l(c), l(u), i))
      );
    };
  }
  function ls(e, t, r) {
    return function (...n) {
      const o = this.__v_raw,
        i = Ne(o),
        s = xn(i),
        a = e === "entries" || (e === Symbol.iterator && s),
        l = e === "keys" && s,
        c = o[e](...n),
        u = r ? Nc : t ? Pc : wi;
      return (
        !t && bt(i, "iterate", l ? Il : In),
        {
          // iterator protocol
          next() {
            const { value: f, done: d } = c.next();
            return d
              ? { value: f, done: d }
              : {
                  value: a ? [u(f[0]), u(f[1])] : u(f),
                  done: d,
                };
          },
          // iterable protocol
          [Symbol.iterator]() {
            return this;
          },
        }
      );
    };
  }
  function Yr(e) {
    return function (...t) {
      if ({}.NODE_ENV !== "production") {
        const r = t[0] ? `on key "${t[0]}" ` : "";
        _r(`${Vn(e)} operation ${r}failed: target is readonly.`, Ne(this));
      }
      return e === "delete" ? !1 : e === "clear" ? void 0 : this;
    };
  }
  function P_() {
    const e = {
        get(i) {
          return os(this, i);
        },
        get size() {
          return ss(this);
        },
        has: is,
        add: Lf,
        set: Vf,
        delete: kf,
        clear: Bf,
        forEach: as(!1, !1),
      },
      t = {
        get(i) {
          return os(this, i, !1, !0);
        },
        get size() {
          return ss(this);
        },
        has: is,
        add: Lf,
        set: Vf,
        delete: kf,
        clear: Bf,
        forEach: as(!1, !0),
      },
      r = {
        get(i) {
          return os(this, i, !0);
        },
        get size() {
          return ss(this, !0);
        },
        has(i) {
          return is.call(this, i, !0);
        },
        add: Yr("add"),
        set: Yr("set"),
        delete: Yr("delete"),
        clear: Yr("clear"),
        forEach: as(!0, !1),
      },
      n = {
        get(i) {
          return os(this, i, !0, !0);
        },
        get size() {
          return ss(this, !0);
        },
        has(i) {
          return is.call(this, i, !0);
        },
        add: Yr("add"),
        set: Yr("set"),
        delete: Yr("delete"),
        clear: Yr("clear"),
        forEach: as(!0, !0),
      };
    return (
      ["keys", "values", "entries", Symbol.iterator].forEach(i => {
        (e[i] = ls(i, !1, !1)),
          (r[i] = ls(i, !0, !1)),
          (t[i] = ls(i, !1, !0)),
          (n[i] = ls(i, !0, !0));
      }),
      [e, r, t, n]
    );
  }
  const [C_, T_, x_, D_] = /* @__PURE__ */ P_();
  function pa(e, t) {
    const r = t ? (e ? D_ : x_) : e ? T_ : C_;
    return (n, o, i) =>
      o === "__v_isReactive"
        ? !e
        : o === "__v_isReadonly"
          ? e
          : o === "__v_raw"
            ? n
            : Reflect.get(Me(r, o) && o in n ? r : n, o, i);
  }
  const I_ = {
      get: /* @__PURE__ */ pa(!1, !1),
    },
    R_ = {
      get: /* @__PURE__ */ pa(!1, !0),
    },
    M_ = {
      get: /* @__PURE__ */ pa(!0, !1),
    },
    j_ = {
      get: /* @__PURE__ */ pa(!0, !0),
    };
  function cg(e, t, r) {
    const n = Ne(r);
    if (n !== r && t.call(e, n)) {
      const o = $c(e);
      _r(
        `Reactive ${o} contains both the raw and reactive versions of the same object${o === "Map" ? " as keys" : ""}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
      );
    }
  }
  const ug = /* @__PURE__ */ new WeakMap(),
    fg = /* @__PURE__ */ new WeakMap(),
    dg = /* @__PURE__ */ new WeakMap(),
    pg = /* @__PURE__ */ new WeakMap();
  function F_(e) {
    switch (e) {
      case "Object":
      case "Array":
        return 1;
      case "Map":
      case "Set":
      case "WeakMap":
      case "WeakSet":
        return 2;
      default:
        return 0;
    }
  }
  function L_(e) {
    return e.__v_skip || !Object.isExtensible(e) ? 0 : F_($c(e));
  }
  function xi(e) {
    return fn(e) ? e : ga(e, !1, O_, I_, ug);
  }
  function V_(e) {
    return ga(e, !1, S_, R_, fg);
  }
  function ha(e) {
    return ga(e, !0, A_, M_, dg);
  }
  function qt(e) {
    return ga(e, !0, N_, j_, pg);
  }
  function ga(e, t, r, n, o) {
    if (!Be(e))
      return (
        {}.NODE_ENV !== "production" &&
          _r(`value cannot be made reactive: ${String(e)}`),
        e
      );
    if (e.__v_raw && !(t && e.__v_isReactive)) return e;
    const i = o.get(e);
    if (i) return i;
    const s = L_(e);
    if (s === 0) return e;
    const a = new Proxy(e, s === 2 ? n : r);
    return o.set(e, a), a;
  }
  function Rn(e) {
    return fn(e) ? Rn(e.__v_raw) : !!(e && e.__v_isReactive);
  }
  function fn(e) {
    return !!(e && e.__v_isReadonly);
  }
  function Mn(e) {
    return !!(e && e.__v_isShallow);
  }
  function Fs(e) {
    return Rn(e) || fn(e);
  }
  function Ne(e) {
    const t = e && e.__v_raw;
    return t ? Ne(t) : e;
  }
  function hg(e) {
    return Object.isExtensible(e) && Ms(e, "__v_skip", !0), e;
  }
  const wi = e => (Be(e) ? xi(e) : e),
    Pc = e => (Be(e) ? ha(e) : e),
    k_ =
      "Computed is still dirty after getter evaluation, likely because a computed is mutating its own dependency in its getter. State mutations in computed getters should be avoided.  Check the docs for more details: https://vuejs.org/guide/essentials/computed.html#getters-should-be-side-effect-free";
  class gg {
    constructor(t, r, n, o) {
      (this.getter = t),
        (this._setter = r),
        (this.dep = void 0),
        (this.__v_isRef = !0),
        (this.__v_isReadonly = !1),
        (this.effect = new Oc(
          () => t(this._value),
          () => li(this, this.effect._dirtyLevel === 2 ? 2 : 3)
        )),
        (this.effect.computed = this),
        (this.effect.active = this._cacheable = !o),
        (this.__v_isReadonly = n);
    }
    get value() {
      const t = Ne(this);
      return (
        (!t._cacheable || t.effect.dirty) &&
          un(t._value, (t._value = t.effect.run())) &&
          li(t, 4),
        Cc(t),
        t.effect._dirtyLevel >= 2 &&
          ({}.NODE_ENV !== "production" &&
            this._warnRecursive &&
            _r(
              k_,
              `

getter: `,
              this.getter
            ),
          li(t, 2)),
        t._value
      );
    }
    set value(t) {
      this._setter(t);
    }
    // #region polyfill _dirty for backward compatibility third party code for Vue <= 3.3.x
    get _dirty() {
      return this.effect.dirty;
    }
    set _dirty(t) {
      this.effect.dirty = t;
    }
    // #endregion
  }
  function B_(e, t, r = !1) {
    let n, o;
    const i = be(e);
    i
      ? ((n = e),
        (o =
          {}.NODE_ENV !== "production"
            ? () => {
                _r("Write operation failed: computed value is readonly");
              }
            : dt))
      : ((n = e.get), (o = e.set));
    const s = new gg(n, o, i || !o, r);
    return (
      {}.NODE_ENV !== "production" &&
        t &&
        !r &&
        ((s.effect.onTrack = t.onTrack), (s.effect.onTrigger = t.onTrigger)),
      s
    );
  }
  function Cc(e) {
    var t;
    an &&
      Dn &&
      ((e = Ne(e)),
      rg(
        Dn,
        (t = e.dep) != null
          ? t
          : (e.dep = og(() => (e.dep = void 0), e instanceof gg ? e : void 0)),
        {}.NODE_ENV !== "production"
          ? {
              target: e,
              type: "get",
              key: "value",
            }
          : void 0
      ));
  }
  function li(e, t = 4, r) {
    e = Ne(e);
    const n = e.dep;
    n &&
      ng(
        n,
        t,
        {}.NODE_ENV !== "production"
          ? {
              target: e,
              type: "set",
              key: "value",
              newValue: r,
            }
          : void 0
      );
  }
  function yt(e) {
    return !!(e && e.__v_isRef === !0);
  }
  function Ee(e) {
    return vg(e, !1);
  }
  function mg(e) {
    return vg(e, !0);
  }
  function vg(e, t) {
    return yt(e) ? e : new z_(e, t);
  }
  class z_ {
    constructor(t, r) {
      (this.__v_isShallow = r),
        (this.dep = void 0),
        (this.__v_isRef = !0),
        (this._rawValue = r ? t : Ne(t)),
        (this._value = r ? t : wi(t));
    }
    get value() {
      return Cc(this), this._value;
    }
    set value(t) {
      const r = this.__v_isShallow || Mn(t) || fn(t);
      (t = r ? t : Ne(t)),
        un(t, this._rawValue) &&
          ((this._rawValue = t), (this._value = r ? t : wi(t)), li(this, 4, t));
    }
  }
  function z(e) {
    return yt(e) ? e.value : e;
  }
  const U_ = {
    get: (e, t, r) => z(Reflect.get(e, t, r)),
    set: (e, t, r, n) => {
      const o = e[t];
      return yt(o) && !yt(r) ? ((o.value = r), !0) : Reflect.set(e, t, r, n);
    },
  };
  function yg(e) {
    return Rn(e) ? e : new Proxy(e, U_);
  }
  class W_ {
    constructor(t) {
      (this.dep = void 0), (this.__v_isRef = !0);
      const { get: r, set: n } = t(
        () => Cc(this),
        () => li(this)
      );
      (this._get = r), (this._set = n);
    }
    get value() {
      return this._get();
    }
    set value(t) {
      this._set(t);
    }
  }
  function H_(e) {
    return new W_(e);
  }
  function xt(e) {
    ({}).NODE_ENV !== "production" &&
      !Fs(e) &&
      _r("toRefs() expects a reactive object but received a plain one.");
    const t = he(e) ? new Array(e.length) : {};
    for (const r in e) t[r] = _g(e, r);
    return t;
  }
  class K_ {
    constructor(t, r, n) {
      (this._object = t),
        (this._key = r),
        (this._defaultValue = n),
        (this.__v_isRef = !0);
    }
    get value() {
      const t = this._object[this._key];
      return t === void 0 ? this._defaultValue : t;
    }
    set value(t) {
      this._object[this._key] = t;
    }
    get dep() {
      return $_(Ne(this._object), this._key);
    }
  }
  class G_ {
    constructor(t) {
      (this._getter = t), (this.__v_isRef = !0), (this.__v_isReadonly = !0);
    }
    get value() {
      return this._getter();
    }
  }
  function q_(e, t, r) {
    return yt(e)
      ? e
      : be(e)
        ? new G_(e)
        : Be(e) && arguments.length > 1
          ? _g(e, t, r)
          : Ee(e);
  }
  function _g(e, t, r) {
    const n = e[t];
    return yt(n) ? n : new K_(e, t, r);
  }
  /**
   * @vue/runtime-core v3.4.21
   * (c) 2018-present Yuxi (Evan) You and Vue contributors
   * @license MIT
   **/
  const jn = [];
  function Es(e) {
    jn.push(e);
  }
  function Os() {
    jn.pop();
  }
  function Z(e, ...t) {
    hn();
    const r = jn.length ? jn[jn.length - 1].component : null,
      n = r && r.appContext.config.warnHandler,
      o = Y_();
    if (n)
      Dr(n, r, 11, [
        e +
          t
            .map(i => {
              var s, a;
              return (a = (s = i.toString) == null ? void 0 : s.call(i)) != null
                ? a
                : JSON.stringify(i);
            })
            .join(""),
        r && r.proxy,
        o.map(({ vnode: i }) => `at <${wa(r, i.type)}>`).join(`
`),
        o,
      ]);
    else {
      const i = [`[Vue warn]: ${e}`, ...t];
      o.length &&
        i.push(
          `
`,
          ...J_(o)
        ),
        console.warn(...i);
    }
    gn();
  }
  function Y_() {
    let e = jn[jn.length - 1];
    if (!e) return [];
    const t = [];
    for (; e; ) {
      const r = t[0];
      r && r.vnode === e
        ? r.recurseCount++
        : t.push({
            vnode: e,
            recurseCount: 0,
          });
      const n = e.component && e.component.parent;
      e = n && n.vnode;
    }
    return t;
  }
  function J_(e) {
    const t = [];
    return (
      e.forEach((r, n) => {
        t.push(
          ...(n === 0
            ? []
            : [
                `
`,
              ]),
          ...X_(r)
        );
      }),
      t
    );
  }
  function X_({ vnode: e, recurseCount: t }) {
    const r = t > 0 ? `... (${t} recursive calls)` : "",
      n = e.component ? e.component.parent == null : !1,
      o = ` at <${wa(e.component, e.type, n)}`,
      i = ">" + r;
    return e.props ? [o, ...Z_(e.props), i] : [o + i];
  }
  function Z_(e) {
    const t = [],
      r = Object.keys(e);
    return (
      r.slice(0, 3).forEach(n => {
        t.push(...$g(n, e[n]));
      }),
      r.length > 3 && t.push(" ..."),
      t
    );
  }
  function $g(e, t, r) {
    return nt(t)
      ? ((t = JSON.stringify(t)), r ? t : [`${e}=${t}`])
      : typeof t == "number" || typeof t == "boolean" || t == null
        ? r
          ? t
          : [`${e}=${t}`]
        : yt(t)
          ? ((t = $g(e, Ne(t.value), !0)), r ? t : [`${e}=Ref<`, t, ">"])
          : be(t)
            ? [`${e}=fn${t.name ? `<${t.name}>` : ""}`]
            : ((t = Ne(t)), r ? t : [`${e}=`, t]);
  }
  const Tc = {
    sp: "serverPrefetch hook",
    bc: "beforeCreate hook",
    c: "created hook",
    bm: "beforeMount hook",
    m: "mounted hook",
    bu: "beforeUpdate hook",
    u: "updated",
    bum: "beforeUnmount hook",
    um: "unmounted hook",
    a: "activated hook",
    da: "deactivated hook",
    ec: "errorCaptured hook",
    rtc: "renderTracked hook",
    rtg: "renderTriggered hook",
    0: "setup function",
    1: "render function",
    2: "watcher getter",
    3: "watcher callback",
    4: "watcher cleanup function",
    5: "native event handler",
    6: "component event handler",
    7: "vnode hook",
    8: "directive hook",
    9: "transition hook",
    10: "app errorHandler",
    11: "app warnHandler",
    12: "ref function",
    13: "async component loader",
    14: "scheduler flush. This is likely a Vue internals bug. Please open an issue at https://github.com/vuejs/core .",
  };
  function Dr(e, t, r, n) {
    try {
      return n ? e(...n) : e();
    } catch (o) {
      Di(o, t, r);
    }
  }
  function ir(e, t, r, n) {
    if (be(e)) {
      const i = Dr(e, t, r, n);
      return (
        i &&
          _c(i) &&
          i.catch(s => {
            Di(s, t, r);
          }),
        i
      );
    }
    const o = [];
    for (let i = 0; i < e.length; i++) o.push(ir(e[i], t, r, n));
    return o;
  }
  function Di(e, t, r, n = !0) {
    const o = t ? t.vnode : null;
    if (t) {
      let i = t.parent;
      const s = t.proxy,
        a =
          {}.NODE_ENV !== "production"
            ? Tc[r]
            : `https://vuejs.org/error-reference/#runtime-${r}`;
      for (; i; ) {
        const c = i.ec;
        if (c) {
          for (let u = 0; u < c.length; u++) if (c[u](e, s, a) === !1) return;
        }
        i = i.parent;
      }
      const l = t.appContext.config.errorHandler;
      if (l) {
        Dr(l, null, 10, [e, s, a]);
        return;
      }
    }
    Q_(e, r, o, n);
  }
  function Q_(e, t, r, n = !0) {
    if ({}.NODE_ENV !== "production") {
      const o = Tc[t];
      if (
        (r && Es(r),
        Z(`Unhandled error${o ? ` during execution of ${o}` : ""}`),
        r && Os(),
        n)
      )
        throw e;
      console.error(e);
    } else console.error(e);
  }
  let Ei = !1,
    Rl = !1;
  const Ot = [];
  let pr = 0;
  const go = [];
  let Pr = null,
    tn = 0;
  const bg = /* @__PURE__ */ Promise.resolve();
  let xc = null;
  const e$ = 100;
  function mn(e) {
    const t = xc || bg;
    return e ? t.then(this ? e.bind(this) : e) : t;
  }
  function t$(e) {
    let t = pr + 1,
      r = Ot.length;
    for (; t < r; ) {
      const n = (t + r) >>> 1,
        o = Ot[n],
        i = Oi(o);
      i < e || (i === e && o.pre) ? (t = n + 1) : (r = n);
    }
    return t;
  }
  function ma(e) {
    (!Ot.length || !Ot.includes(e, Ei && e.allowRecurse ? pr + 1 : pr)) &&
      (e.id == null ? Ot.push(e) : Ot.splice(t$(e.id), 0, e), wg());
  }
  function wg() {
    !Ei && !Rl && ((Rl = !0), (xc = bg.then(Ag)));
  }
  function r$(e) {
    const t = Ot.indexOf(e);
    t > pr && Ot.splice(t, 1);
  }
  function Eg(e) {
    he(e)
      ? go.push(...e)
      : (!Pr || !Pr.includes(e, e.allowRecurse ? tn + 1 : tn)) && go.push(e),
      wg();
  }
  function zf(e, t, r = Ei ? pr + 1 : 0) {
    for (
      {}.NODE_ENV !== "production" && (t = t || /* @__PURE__ */ new Map());
      r < Ot.length;
      r++
    ) {
      const n = Ot[r];
      if (n && n.pre) {
        if ((e && n.id !== e.uid) || ({}.NODE_ENV !== "production" && Dc(t, n)))
          continue;
        Ot.splice(r, 1), r--, n();
      }
    }
  }
  function Og(e) {
    if (go.length) {
      const t = [...new Set(go)].sort((r, n) => Oi(r) - Oi(n));
      if (((go.length = 0), Pr)) {
        Pr.push(...t);
        return;
      }
      for (
        Pr = t,
          {}.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map()),
          tn = 0;
        tn < Pr.length;
        tn++
      )
        (({}).NODE_ENV !== "production" && Dc(e, Pr[tn])) || Pr[tn]();
      (Pr = null), (tn = 0);
    }
  }
  const Oi = e => (e.id == null ? 1 / 0 : e.id),
    n$ = (e, t) => {
      const r = Oi(e) - Oi(t);
      if (r === 0) {
        if (e.pre && !t.pre) return -1;
        if (t.pre && !e.pre) return 1;
      }
      return r;
    };
  function Ag(e) {
    (Rl = !1),
      (Ei = !0),
      {}.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map()),
      Ot.sort(n$);
    const t = {}.NODE_ENV !== "production" ? r => Dc(e, r) : dt;
    try {
      for (pr = 0; pr < Ot.length; pr++) {
        const r = Ot[pr];
        if (r && r.active !== !1) {
          if ({}.NODE_ENV !== "production" && t(r)) continue;
          Dr(r, null, 14);
        }
      }
    } finally {
      (pr = 0),
        (Ot.length = 0),
        Og(e),
        (Ei = !1),
        (xc = null),
        (Ot.length || go.length) && Ag(e);
    }
  }
  function Dc(e, t) {
    if (!e.has(t)) e.set(t, 1);
    else {
      const r = e.get(t);
      if (r > e$) {
        const n = t.ownerInstance,
          o = n && Bc(n.type);
        return (
          Di(
            `Maximum recursive updates exceeded${o ? ` in component <${o}>` : ""}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`,
            null,
            10
          ),
          !0
        );
      } else e.set(t, r + 1);
    }
  }
  let ln = !1;
  const uo = /* @__PURE__ */ new Set();
  ({}).NODE_ENV !== "production" &&
    (wc().__VUE_HMR_RUNTIME__ = {
      createRecord: Qa(Sg),
      rerender: Qa(s$),
      reload: Qa(a$),
    });
  const Bn = /* @__PURE__ */ new Map();
  function o$(e) {
    const t = e.type.__hmrId;
    let r = Bn.get(t);
    r || (Sg(t, e.type), (r = Bn.get(t))), r.instances.add(e);
  }
  function i$(e) {
    Bn.get(e.type.__hmrId).instances.delete(e);
  }
  function Sg(e, t) {
    return Bn.has(e)
      ? !1
      : (Bn.set(e, {
          initialDef: ci(t),
          instances: /* @__PURE__ */ new Set(),
        }),
        !0);
  }
  function ci(e) {
    return im(e) ? e.__vccOpts : e;
  }
  function s$(e, t) {
    const r = Bn.get(e);
    r &&
      ((r.initialDef.render = t),
      [...r.instances].forEach(n => {
        t && ((n.render = t), (ci(n.type).render = t)),
          (n.renderCache = []),
          (ln = !0),
          (n.effect.dirty = !0),
          n.update(),
          (ln = !1);
      }));
  }
  function a$(e, t) {
    const r = Bn.get(e);
    if (!r) return;
    (t = ci(t)), Uf(r.initialDef, t);
    const n = [...r.instances];
    for (const o of n) {
      const i = ci(o.type);
      uo.has(i) || (i !== r.initialDef && Uf(i, t), uo.add(i)),
        o.appContext.propsCache.delete(o.type),
        o.appContext.emitsCache.delete(o.type),
        o.appContext.optionsCache.delete(o.type),
        o.ceReload
          ? (uo.add(i), o.ceReload(t.styles), uo.delete(i))
          : o.parent
            ? ((o.parent.effect.dirty = !0), ma(o.parent.update))
            : o.appContext.reload
              ? o.appContext.reload()
              : typeof window < "u"
                ? window.location.reload()
                : console.warn(
                    "[HMR] Root or manually mounted instance modified. Full reload required."
                  );
    }
    Eg(() => {
      for (const o of n) uo.delete(ci(o.type));
    });
  }
  function Uf(e, t) {
    ot(e, t);
    for (const r in e) r !== "__file" && !(r in t) && delete e[r];
  }
  function Qa(e) {
    return (t, r) => {
      try {
        return e(t, r);
      } catch (n) {
        console.error(n),
          console.warn(
            "[HMR] Something went wrong during Vue component hot-reload. Full reload required."
          );
      }
    };
  }
  let hr,
    ni = [],
    Ml = !1;
  function Ii(e, ...t) {
    hr ? hr.emit(e, ...t) : Ml || ni.push({ event: e, args: t });
  }
  function Ng(e, t) {
    var r, n;
    (hr = e),
      hr
        ? ((hr.enabled = !0),
          ni.forEach(({ event: o, args: i }) => hr.emit(o, ...i)),
          (ni = []))
        : /* handle late devtools injection - only do this if we are in an actual */ /* browser environment to avoid the timer handle stalling test runner exit */ /* (#4815) */ typeof window <
              "u" && // some envs mock window but not fully
            window.HTMLElement && // also exclude jsdom
            !(
              (n = (r = window.navigator) == null ? void 0 : r.userAgent) !=
                null && n.includes("jsdom")
            )
          ? ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ =
              t.__VUE_DEVTOOLS_HOOK_REPLAY__ || []).push(i => {
              Ng(i, t);
            }),
            setTimeout(() => {
              hr ||
                ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ = null), (Ml = !0), (ni = []));
            }, 3e3))
          : ((Ml = !0), (ni = []));
  }
  function l$(e, t) {
    Ii("app:init", e, t, {
      Fragment: Vt,
      Text: Mi,
      Comment: Tt,
      Static: As,
    });
  }
  function c$(e) {
    Ii("app:unmount", e);
  }
  const u$ = /* @__PURE__ */ Ic(
      "component:added"
      /* COMPONENT_ADDED */
    ),
    Pg = /* @__PURE__ */ Ic(
      "component:updated"
      /* COMPONENT_UPDATED */
    ),
    f$ = /* @__PURE__ */ Ic(
      "component:removed"
      /* COMPONENT_REMOVED */
    ),
    d$ = e => {
      hr &&
        typeof hr.cleanupBuffer == "function" && // remove the component if it wasn't buffered
        !hr.cleanupBuffer(e) &&
        f$(e);
    };
  function Ic(e) {
    return t => {
      Ii(e, t.appContext.app, t.uid, t.parent ? t.parent.uid : void 0, t);
    };
  }
  const p$ = /* @__PURE__ */ Cg(
      "perf:start"
      /* PERFORMANCE_START */
    ),
    h$ = /* @__PURE__ */ Cg(
      "perf:end"
      /* PERFORMANCE_END */
    );
  function Cg(e) {
    return (t, r, n) => {
      Ii(e, t.appContext.app, t.uid, t, r, n);
    };
  }
  function g$(e, t, r) {
    Ii("component:emit", e.appContext.app, e, t, r);
  }
  function m$(e, t, ...r) {
    if (e.isUnmounted) return;
    const n = e.vnode.props || Ue;
    if ({}.NODE_ENV !== "production") {
      const {
        emitsOptions: u,
        propsOptions: [f],
      } = e;
      if (u)
        if (!(t in u))
          (!f || !(Cr(t) in f)) &&
            Z(
              `Component emitted event "${t}" but it is neither declared in the emits option nor as an "${Cr(t)}" prop.`
            );
        else {
          const d = u[t];
          be(d) &&
            (d(...r) ||
              Z(
                `Invalid event arguments: event validation failed for event "${t}".`
              ));
        }
    }
    let o = r;
    const i = t.startsWith("update:"),
      s = i && t.slice(7);
    if (s && s in n) {
      const u = `${s === "modelValue" ? "model" : s}Modifiers`,
        { number: f, trim: d } = n[u] || Ue;
      d && (o = r.map(p => (nt(p) ? p.trim() : p))), f && (o = r.map(f_));
    }
    if (
      ({}.NODE_ENV !== "production" && g$(e, t, o),
      {}.NODE_ENV !== "production")
    ) {
      const u = t.toLowerCase();
      u !== t &&
        n[Cr(u)] &&
        Z(
          `Event "${u}" is emitted in component ${wa(
            e,
            e.type
          )} but the handler is registered for "${t}". Note that HTML attributes are case-insensitive and you cannot use v-on to listen to camelCase events when using in-DOM templates. You should probably use "${Bt(
            t
          )}" instead of "${t}".`
        );
    }
    let a,
      l =
        n[(a = Cr(t))] || // also try camelCase event handler (#2249)
        n[(a = Cr(Ct(t)))];
    !l && i && (l = n[(a = Cr(Bt(t)))]), l && ir(l, e, 6, o);
    const c = n[a + "Once"];
    if (c) {
      if (!e.emitted) e.emitted = {};
      else if (e.emitted[a]) return;
      (e.emitted[a] = !0), ir(c, e, 6, o);
    }
  }
  function Tg(e, t, r = !1) {
    const n = t.emitsCache,
      o = n.get(e);
    if (o !== void 0) return o;
    const i = e.emits;
    let s = {},
      a = !1;
    if (!be(e)) {
      const l = c => {
        const u = Tg(c, t, !0);
        u && ((a = !0), ot(s, u));
      };
      !r && t.mixins.length && t.mixins.forEach(l),
        e.extends && l(e.extends),
        e.mixins && e.mixins.forEach(l);
    }
    return !i && !a
      ? (Be(e) && n.set(e, null), null)
      : (he(i) ? i.forEach(l => (s[l] = null)) : ot(s, i),
        Be(e) && n.set(e, s),
        s);
  }
  function va(e, t) {
    return !e || !Ti(t)
      ? !1
      : ((t = t.slice(2).replace(/Once$/, "")),
        Me(e, t[0].toLowerCase() + t.slice(1)) || Me(e, Bt(t)) || Me(e, t));
  }
  let ut = null,
    xg = null;
  function Ls(e) {
    const t = ut;
    return (ut = e), (xg = (e && e.type.__scopeId) || null), t;
  }
  function oe(e, t = ut, r) {
    if (!t || e._n) return e;
    const n = (...o) => {
      n._d && nd(-1);
      const i = Ls(t);
      let s;
      try {
        s = e(...o);
      } finally {
        Ls(i), n._d && nd(1);
      }
      return {}.NODE_ENV !== "production" && Pg(t), s;
    };
    return (n._n = !0), (n._c = !0), (n._d = !0), n;
  }
  let jl = !1;
  function Vs() {
    jl = !0;
  }
  function el(e) {
    const {
      type: t,
      vnode: r,
      proxy: n,
      withProxy: o,
      props: i,
      propsOptions: [s],
      slots: a,
      attrs: l,
      emit: c,
      render: u,
      renderCache: f,
      data: d,
      setupState: p,
      ctx: h,
      inheritAttrs: m,
    } = e;
    let v, g;
    const _ = Ls(e);
    ({}).NODE_ENV !== "production" && (jl = !1);
    try {
      if (r.shapeFlag & 4) {
        const D = o || n,
          S =
            {}.NODE_ENV !== "production" && p.__isScriptSetup
              ? new Proxy(D, {
                  get(O, j, B) {
                    return (
                      Z(
                        `Property '${String(
                          j
                        )}' was accessed via 'this'. Avoid using 'this' in templates.`
                      ),
                      Reflect.get(O, j, B)
                    );
                  },
                })
              : D;
        (v = rr(u.call(S, D, f, i, p, d, h))), (g = l);
      } else {
        const D = t;
        ({}).NODE_ENV !== "production" && l === i && Vs(),
          (v = rr(
            D.length > 1
              ? D(
                  i,
                  {}.NODE_ENV !== "production"
                    ? {
                        get attrs() {
                          return Vs(), l;
                        },
                        slots: a,
                        emit: c,
                      }
                    : { attrs: l, slots: a, emit: c }
                )
              : D(
                  i,
                  null
                  /* we know it doesn't need it */
                )
          )),
          (g = t.props ? l : v$(l));
      }
    } catch (D) {
      (hi.length = 0), Di(D, e, 1), (v = Le(Tt));
    }
    let E = v,
      A;
    if (
      ({}.NODE_ENV !== "production" &&
        v.patchFlag > 0 &&
        v.patchFlag & 2048 &&
        ([E, A] = Dg(v)),
      g && m !== !1)
    ) {
      const D = Object.keys(g),
        { shapeFlag: S } = E;
      if (D.length) {
        if (S & 7) s && D.some(Rs) && (g = y$(g, s)), (E = jr(E, g));
        else if ({}.NODE_ENV !== "production" && !jl && E.type !== Tt) {
          const O = Object.keys(l),
            j = [],
            B = [];
          for (let W = 0, re = O.length; W < re; W++) {
            const G = O[W];
            Ti(G)
              ? Rs(G) || j.push(G[2].toLowerCase() + G.slice(3))
              : B.push(G);
          }
          B.length &&
            Z(
              `Extraneous non-props attributes (${B.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes.`
            ),
            j.length &&
              Z(
                `Extraneous non-emits event listeners (${j.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes. If the listener is intended to be a component custom event listener only, declare it using the "emits" option.`
              );
        }
      }
    }
    return (
      r.dirs &&
        ({}.NODE_ENV !== "production" &&
          !Wf(E) &&
          Z(
            "Runtime directive used on component with non-element root node. The directives will not function as intended."
          ),
        (E = jr(E)),
        (E.dirs = E.dirs ? E.dirs.concat(r.dirs) : r.dirs)),
      r.transition &&
        ({}.NODE_ENV !== "production" &&
          !Wf(E) &&
          Z(
            "Component inside <Transition> renders non-element root node that cannot be animated."
          ),
        (E.transition = r.transition)),
      {}.NODE_ENV !== "production" && A ? A(E) : (v = E),
      Ls(_),
      v
    );
  }
  const Dg = e => {
    const t = e.children,
      r = e.dynamicChildren,
      n = Rc(t, !1);
    if (n) {
      if ({}.NODE_ENV !== "production" && n.patchFlag > 0 && n.patchFlag & 2048)
        return Dg(n);
    } else return [e, void 0];
    const o = t.indexOf(n),
      i = r ? r.indexOf(n) : -1,
      s = a => {
        (t[o] = a),
          r &&
            (i > -1
              ? (r[i] = a)
              : a.patchFlag > 0 && (e.dynamicChildren = [...r, a]));
      };
    return [rr(n), s];
  };
  function Rc(e, t = !0) {
    let r;
    for (let n = 0; n < e.length; n++) {
      const o = e[n];
      if (_o(o)) {
        if (o.type !== Tt || o.children === "v-if") {
          if (r) return;
          if (
            ((r = o),
            {}.NODE_ENV !== "production" &&
              t &&
              r.patchFlag > 0 &&
              r.patchFlag & 2048)
          )
            return Rc(r.children);
        }
      } else return;
    }
    return r;
  }
  const v$ = e => {
      let t;
      for (const r in e)
        (r === "class" || r === "style" || Ti(r)) &&
          ((t || (t = {}))[r] = e[r]);
      return t;
    },
    y$ = (e, t) => {
      const r = {};
      for (const n in e) (!Rs(n) || !(n.slice(9) in t)) && (r[n] = e[n]);
      return r;
    },
    Wf = e => e.shapeFlag & 7 || e.type === Tt;
  function _$(e, t, r) {
    const { props: n, children: o, component: i } = e,
      { props: s, children: a, patchFlag: l } = t,
      c = i.emitsOptions;
    if (
      ({}.NODE_ENV !== "production" && (o || a) && ln) ||
      t.dirs ||
      t.transition
    )
      return !0;
    if (r && l >= 0) {
      if (l & 1024) return !0;
      if (l & 16) return n ? Hf(n, s, c) : !!s;
      if (l & 8) {
        const u = t.dynamicProps;
        for (let f = 0; f < u.length; f++) {
          const d = u[f];
          if (s[d] !== n[d] && !va(c, d)) return !0;
        }
      }
    } else
      return (o || a) && (!a || !a.$stable)
        ? !0
        : n === s
          ? !1
          : n
            ? s
              ? Hf(n, s, c)
              : !0
            : !!s;
    return !1;
  }
  function Hf(e, t, r) {
    const n = Object.keys(t);
    if (n.length !== Object.keys(e).length) return !0;
    for (let o = 0; o < n.length; o++) {
      const i = n[o];
      if (t[i] !== e[i] && !va(r, i)) return !0;
    }
    return !1;
  }
  function $$({ vnode: e, parent: t }, r) {
    for (; t; ) {
      const n = t.subTree;
      if (
        (n.suspense && n.suspense.activeBranch === e && (n.el = e.el), n === e)
      )
        ((e = t.vnode).el = r), (t = t.parent);
      else break;
    }
  }
  const ks = "components";
  function Qe(e, t) {
    return Rg(ks, e, !0, t) || e;
  }
  const Ig = Symbol.for("v-ndc");
  function b$(e) {
    return nt(e) ? Rg(ks, e, !1) || e : e || Ig;
  }
  function Rg(e, t, r = !0, n = !1) {
    const o = ut || mt;
    if (o) {
      const i = o.type;
      if (e === ks) {
        const a = Bc(i, !1);
        if (a && (a === t || a === Ct(t) || a === Vn(Ct(t)))) return i;
      }
      const s =
        // local registration
        // check instance[type] first which is resolved for options API
        Kf(o[e] || i[e], t) || // global registration
        Kf(o.appContext[e], t);
      if (!s && n) return i;
      if ({}.NODE_ENV !== "production" && r && !s) {
        const a =
          e === ks
            ? `
If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement.`
            : "";
        Z(`Failed to resolve ${e.slice(0, -1)}: ${t}${a}`);
      }
      return s;
    } else
      ({}).NODE_ENV !== "production" &&
        Z(
          `resolve${Vn(e.slice(0, -1))} can only be used in render() or setup().`
        );
  }
  function Kf(e, t) {
    return e && (e[t] || e[Ct(t)] || e[Vn(Ct(t))]);
  }
  const w$ = e => e.__isSuspense;
  function E$(e, t) {
    t && t.pendingBranch
      ? he(e)
        ? t.effects.push(...e)
        : t.effects.push(e)
      : Eg(e);
  }
  const O$ = Symbol.for("v-scx"),
    A$ = () => {
      {
        const e = di(O$);
        return (
          e ||
            ({}.NODE_ENV !== "production" &&
              Z(
                "Server rendering context not provided. Make sure to only call useSSRContext() conditionally in the server build."
              )),
          e
        );
      }
    };
  function Jt(e, t) {
    return Mc(e, null, t);
  }
  const cs = {};
  function vt(e, t, r) {
    return (
      {}.NODE_ENV !== "production" &&
        !be(t) &&
        Z(
          "`watch(fn, options?)` signature has been moved to a separate API. Use `watchEffect(fn, options?)` instead. `watch` now only supports `watch(source, cb, options?) signature."
        ),
      Mc(e, t, r)
    );
  }
  function Mc(
    e,
    t,
    { immediate: r, deep: n, flush: o, once: i, onTrack: s, onTrigger: a } = Ue
  ) {
    if (t && i) {
      const O = t;
      t = (...j) => {
        O(...j), S();
      };
    }
    ({}).NODE_ENV !== "production" &&
      n !== void 0 &&
      typeof n == "number" &&
      Z(
        'watch() "deep" option with number value will be used as watch depth in future versions. Please use a boolean instead to avoid potential breakage.'
      ),
      {}.NODE_ENV !== "production" &&
        !t &&
        (r !== void 0 &&
          Z(
            'watch() "immediate" option is only respected when using the watch(source, callback, options?) signature.'
          ),
        n !== void 0 &&
          Z(
            'watch() "deep" option is only respected when using the watch(source, callback, options?) signature.'
          ),
        i !== void 0 &&
          Z(
            'watch() "once" option is only respected when using the watch(source, callback, options?) signature.'
          ));
    const l = O => {
        Z(
          "Invalid watch source: ",
          O,
          "A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types."
        );
      },
      c = mt,
      u = O =>
        n === !0
          ? O
          : // for deep: false, only traverse root-level properties
            Cn(O, n === !1 ? 1 : void 0);
    let f,
      d = !1,
      p = !1;
    if (
      (yt(e)
        ? ((f = () => e.value), (d = Mn(e)))
        : Rn(e)
          ? ((f = () => u(e)), (d = !0))
          : he(e)
            ? ((p = !0),
              (d = e.some(O => Rn(O) || Mn(O))),
              (f = () =>
                e.map(O => {
                  if (yt(O)) return O.value;
                  if (Rn(O)) return u(O);
                  if (be(O)) return Dr(O, c, 2);
                  ({}).NODE_ENV !== "production" && l(O);
                })))
            : be(e)
              ? t
                ? (f = () => Dr(e, c, 2))
                : (f = () => (h && h(), ir(e, c, 3, [m])))
              : ((f = dt), {}.NODE_ENV !== "production" && l(e)),
      t && n)
    ) {
      const O = f;
      f = () => Cn(O());
    }
    let h,
      m = O => {
        h = A.onStop = () => {
          Dr(O, c, 4), (h = A.onStop = void 0);
        };
      },
      v;
    if ($a)
      if (
        ((m = dt),
        t ? r && ir(t, c, 3, [f(), p ? [] : void 0, m]) : f(),
        o === "sync")
      ) {
        const O = A$();
        v = O.__watcherHandles || (O.__watcherHandles = []);
      } else return dt;
    let g = p ? new Array(e.length).fill(cs) : cs;
    const _ = () => {
      if (!(!A.active || !A.dirty))
        if (t) {
          const O = A.run();
          (n || d || (p ? O.some((j, B) => un(j, g[B])) : un(O, g))) &&
            (h && h(),
            ir(t, c, 3, [
              O,
              // pass undefined as the old value when it's changed for the first time
              g === cs ? void 0 : p && g[0] === cs ? [] : g,
              m,
            ]),
            (g = O));
        } else A.run();
    };
    _.allowRecurse = !!t;
    let E;
    o === "sync"
      ? (E = _)
      : o === "post"
        ? (E = () => It(_, c && c.suspense))
        : ((_.pre = !0), c && (_.id = c.uid), (E = () => ma(_)));
    const A = new Oc(f, dt, E),
      D = Ec(),
      S = () => {
        A.stop(), D && yc(D.effects, A);
      };
    return (
      {}.NODE_ENV !== "production" && ((A.onTrack = s), (A.onTrigger = a)),
      t
        ? r
          ? _()
          : (g = A.run())
        : o === "post"
          ? It(A.run.bind(A), c && c.suspense)
          : A.run(),
      v && v.push(S),
      S
    );
  }
  function S$(e, t, r) {
    const n = this.proxy,
      o = nt(e) ? (e.includes(".") ? Mg(n, e) : () => n[e]) : e.bind(n, n);
    let i;
    be(t) ? (i = t) : ((i = t.handler), (r = t));
    const s = ji(this),
      a = Mc(o, i.bind(n), r);
    return s(), a;
  }
  function Mg(e, t) {
    const r = t.split(".");
    return () => {
      let n = e;
      for (let o = 0; o < r.length && n; o++) n = n[r[o]];
      return n;
    };
  }
  function Cn(e, t, r = 0, n) {
    if (!Be(e) || e.__v_skip) return e;
    if (t && t > 0) {
      if (r >= t) return e;
      r++;
    }
    if (((n = n || /* @__PURE__ */ new Set()), n.has(e))) return e;
    if ((n.add(e), yt(e))) Cn(e.value, t, r, n);
    else if (he(e)) for (let o = 0; o < e.length; o++) Cn(e[o], t, r, n);
    else if (Kh(e) || xn(e))
      e.forEach(o => {
        Cn(o, t, r, n);
      });
    else if (qh(e)) for (const o in e) Cn(e[o], t, r, n);
    return e;
  }
  function jg(e) {
    l_(e) &&
      Z("Do not use built-in directive ids as custom directive id: " + e);
  }
  function N$(e, t) {
    if (ut === null)
      return (
        {}.NODE_ENV !== "production" &&
          Z("withDirectives can only be used inside render functions."),
        e
      );
    const r = ba(ut) || ut.proxy,
      n = e.dirs || (e.dirs = []);
    for (let o = 0; o < t.length; o++) {
      let [i, s, a, l = Ue] = t[o];
      i &&
        (be(i) &&
          (i = {
            mounted: i,
            updated: i,
          }),
        i.deep && Cn(s),
        n.push({
          dir: i,
          instance: r,
          value: s,
          oldValue: void 0,
          arg: a,
          modifiers: l,
        }));
    }
    return e;
  }
  function bn(e, t, r, n) {
    const o = e.dirs,
      i = t && t.dirs;
    for (let s = 0; s < o.length; s++) {
      const a = o[s];
      i && (a.oldValue = i[s].value);
      let l = a.dir[n];
      l && (hn(), ir(l, r, 8, [e.el, a, e, t]), gn());
    }
  }
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function ge(e, t) {
    return be(e)
      ? // #8326: extend call and options.name access are considered side-effects
        // by Rollup, so we have to wrap it in a pure-annotated IIFE.
        /* @__PURE__ */ (() => ot({ name: e.name }, t, { setup: e }))()
      : e;
  }
  const ui = e => !!e.type.__asyncLoader,
    jc = e => e.type.__isKeepAlive;
  function P$(e, t) {
    Fg(e, "a", t);
  }
  function C$(e, t) {
    Fg(e, "da", t);
  }
  function Fg(e, t, r = mt) {
    const n =
      e.__wdc ||
      (e.__wdc = () => {
        let o = r;
        for (; o; ) {
          if (o.isDeactivated) return;
          o = o.parent;
        }
        return e();
      });
    if ((ya(t, n, r), r)) {
      let o = r.parent;
      for (; o && o.parent; )
        jc(o.parent.vnode) && T$(n, t, r, o), (o = o.parent);
    }
  }
  function T$(e, t, r, n) {
    const o = ya(
      t,
      e,
      n,
      !0
      /* prepend */
    );
    Ri(() => {
      yc(n[t], o);
    }, r);
  }
  function ya(e, t, r = mt, n = !1) {
    if (r) {
      const o = r[e] || (r[e] = []),
        i =
          t.__weh ||
          (t.__weh = (...s) => {
            if (r.isUnmounted) return;
            hn();
            const a = ji(r),
              l = ir(t, r, e, s);
            return a(), gn(), l;
          });
      return n ? o.unshift(i) : o.push(i), i;
    } else if ({}.NODE_ENV !== "production") {
      const o = Cr(Tc[e].replace(/ hook$/, ""));
      Z(
        `${o} is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.`
      );
    }
  }
  const Br =
      e =>
      (t, r = mt) =>
        // post-create lifecycle registrations are noops during SSR (except for serverPrefetch)
        (!$a || e === "sp") && ya(e, (...n) => t(...n), r),
    x$ = Br("bm"),
    zr = Br("m"),
    D$ = Br("bu"),
    I$ = Br("u"),
    Lg = Br("bum"),
    Ri = Br("um"),
    R$ = Br("sp"),
    M$ = Br("rtg"),
    j$ = Br("rtc");
  function F$(e, t = mt) {
    ya("ec", e, t);
  }
  function fe(e, t, r = {}, n, o) {
    if (ut.isCE || (ut.parent && ui(ut.parent) && ut.parent.isCE))
      return t !== "default" && (r.name = t), Le("slot", r, n && n());
    let i = e[t];
    ({}).NODE_ENV !== "production" &&
      i &&
      i.length > 1 &&
      (Z(
        "SSR-optimized slot function detected in a non-SSR-optimized render function. You need to mark this component with $dynamic-slots in the parent template."
      ),
      (i = () => [])),
      i && i._c && (i._d = !1),
      ue();
    const s = i && Vg(i(r)),
      a = ve(
        Vt,
        {
          key:
            r.key || // slot content array of a dynamic conditional slot may have a branch
            // key attached in the `createSlots` helper, respect that
            (s && s.key) ||
            `_${t}`,
        },
        s || (n ? n() : []),
        s && e._ === 1 ? 64 : -2
      );
    return (
      !o && a.scopeId && (a.slotScopeIds = [a.scopeId + "-s"]),
      i && i._c && (i._d = !0),
      a
    );
  }
  function Vg(e) {
    return e.some(t =>
      _o(t) ? !(t.type === Tt || (t.type === Vt && !Vg(t.children))) : !0
    )
      ? e
      : null;
  }
  function L$(e, t) {
    const r = {};
    if ({}.NODE_ENV !== "production" && !Be(e))
      return Z("v-on with no argument expects an object value."), r;
    for (const n in e) r[t && /[A-Z]/.test(n) ? `on:${n}` : Cr(n)] = e[n];
    return r;
  }
  const Fl = e => (e ? (rm(e) ? ba(e) || e.proxy : Fl(e.parent)) : null),
    Fn =
      // Move PURE marker to new line to workaround compiler discarding it
      // due to type annotation
      /* @__PURE__ */ ot(/* @__PURE__ */ Object.create(null), {
        $: e => e,
        $el: e => e.vnode.el,
        $data: e => e.data,
        $props: e => ({}).NODE_ENV !== "production" ? qt(e.props) : e.props,
        $attrs: e => ({}).NODE_ENV !== "production" ? qt(e.attrs) : e.attrs,
        $slots: e => ({}).NODE_ENV !== "production" ? qt(e.slots) : e.slots,
        $refs: e => ({}).NODE_ENV !== "production" ? qt(e.refs) : e.refs,
        $parent: e => Fl(e.parent),
        $root: e => Fl(e.root),
        $emit: e => e.emit,
        $options: e => Lc(e),
        $forceUpdate: e =>
          e.f ||
          (e.f = () => {
            (e.effect.dirty = !0), ma(e.update);
          }),
        $nextTick: e => e.n || (e.n = mn.bind(e.proxy)),
        $watch: e => S$.bind(e),
      }),
    Fc = e => e === "_" || e === "$",
    tl = (e, t) => e !== Ue && !e.__isScriptSetup && Me(e, t),
    kg = {
      get({ _: e }, t) {
        const {
          ctx: r,
          setupState: n,
          data: o,
          props: i,
          accessCache: s,
          type: a,
          appContext: l,
        } = e;
        if ({}.NODE_ENV !== "production" && t === "__isVue") return !0;
        let c;
        if (t[0] !== "$") {
          const p = s[t];
          if (p !== void 0)
            switch (p) {
              case 1:
                return n[t];
              case 2:
                return o[t];
              case 4:
                return r[t];
              case 3:
                return i[t];
            }
          else {
            if (tl(n, t)) return (s[t] = 1), n[t];
            if (o !== Ue && Me(o, t)) return (s[t] = 2), o[t];
            if (
              // only cache other properties when instance has declared (thus stable)
              // props
              (c = e.propsOptions[0]) &&
              Me(c, t)
            )
              return (s[t] = 3), i[t];
            if (r !== Ue && Me(r, t)) return (s[t] = 4), r[t];
            Vl && (s[t] = 0);
          }
        }
        const u = Fn[t];
        let f, d;
        if (u)
          return (
            t === "$attrs"
              ? (bt(e, "get", t), {}.NODE_ENV !== "production" && Vs())
              : {}.NODE_ENV !== "production" &&
                t === "$slots" &&
                bt(e, "get", t),
            u(e)
          );
        if (
          // css module (injected by vue-loader)
          (f = a.__cssModules) &&
          (f = f[t])
        )
          return f;
        if (r !== Ue && Me(r, t)) return (s[t] = 4), r[t];
        if (
          // global properties
          ((d = l.config.globalProperties), Me(d, t))
        )
          return d[t];
        ({}).NODE_ENV !== "production" &&
          ut &&
          (!nt(t) || // #1091 avoid internal isRef/isVNode checks on component instance leading
            // to infinite warning loop
            t.indexOf("__v") !== 0) &&
          (o !== Ue && Fc(t[0]) && Me(o, t)
            ? Z(
                `Property ${JSON.stringify(
                  t
                )} must be accessed via $data because it starts with a reserved character ("$" or "_") and is not proxied on the render context.`
              )
            : e === ut &&
              Z(
                `Property ${JSON.stringify(t)} was accessed during render but is not defined on instance.`
              ));
      },
      set({ _: e }, t, r) {
        const { data: n, setupState: o, ctx: i } = e;
        return tl(o, t)
          ? ((o[t] = r), !0)
          : {}.NODE_ENV !== "production" && o.__isScriptSetup && Me(o, t)
            ? (Z(
                `Cannot mutate <script setup> binding "${t}" from Options API.`
              ),
              !1)
            : n !== Ue && Me(n, t)
              ? ((n[t] = r), !0)
              : Me(e.props, t)
                ? ({}.NODE_ENV !== "production" &&
                    Z(`Attempting to mutate prop "${t}". Props are readonly.`),
                  !1)
                : t[0] === "$" && t.slice(1) in e
                  ? ({}.NODE_ENV !== "production" &&
                      Z(
                        `Attempting to mutate public property "${t}". Properties starting with $ are reserved and readonly.`
                      ),
                    !1)
                  : ({}.NODE_ENV !== "production" &&
                    t in e.appContext.config.globalProperties
                      ? Object.defineProperty(i, t, {
                          enumerable: !0,
                          configurable: !0,
                          value: r,
                        })
                      : (i[t] = r),
                    !0);
      },
      has(
        {
          _: {
            data: e,
            setupState: t,
            accessCache: r,
            ctx: n,
            appContext: o,
            propsOptions: i,
          },
        },
        s
      ) {
        let a;
        return (
          !!r[s] ||
          (e !== Ue && Me(e, s)) ||
          tl(t, s) ||
          ((a = i[0]) && Me(a, s)) ||
          Me(n, s) ||
          Me(Fn, s) ||
          Me(o.config.globalProperties, s)
        );
      },
      defineProperty(e, t, r) {
        return (
          r.get != null
            ? (e._.accessCache[t] = 0)
            : Me(r, "value") && this.set(e, t, r.value, null),
          Reflect.defineProperty(e, t, r)
        );
      },
    };
  ({}).NODE_ENV !== "production" &&
    (kg.ownKeys = e => (
      Z(
        "Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead."
      ),
      Reflect.ownKeys(e)
    ));
  function V$(e) {
    const t = {};
    return (
      Object.defineProperty(t, "_", {
        configurable: !0,
        enumerable: !1,
        get: () => e,
      }),
      Object.keys(Fn).forEach(r => {
        Object.defineProperty(t, r, {
          configurable: !0,
          enumerable: !1,
          get: () => Fn[r](e),
          // intercepted by the proxy so no need for implementation,
          // but needed to prevent set errors
          set: dt,
        });
      }),
      t
    );
  }
  function k$(e) {
    const {
      ctx: t,
      propsOptions: [r],
    } = e;
    r &&
      Object.keys(r).forEach(n => {
        Object.defineProperty(t, n, {
          enumerable: !0,
          configurable: !0,
          get: () => e.props[n],
          set: dt,
        });
      });
  }
  function B$(e) {
    const { ctx: t, setupState: r } = e;
    Object.keys(Ne(r)).forEach(n => {
      if (!r.__isScriptSetup) {
        if (Fc(n[0])) {
          Z(
            `setup() return property ${JSON.stringify(
              n
            )} should not start with "$" or "_" which are reserved prefixes for Vue internals.`
          );
          return;
        }
        Object.defineProperty(t, n, {
          enumerable: !0,
          configurable: !0,
          get: () => r[n],
          set: dt,
        });
      }
    });
  }
  function z$() {
    return U$().slots;
  }
  function U$() {
    const e = Ur();
    return (
      {}.NODE_ENV !== "production" &&
        !e &&
        Z("useContext() called without active instance."),
      e.setupContext || (e.setupContext = om(e))
    );
  }
  function Ll(e) {
    return he(e) ? e.reduce((t, r) => ((t[r] = null), t), {}) : e;
  }
  function W$(e, t) {
    const r = Ll(e);
    for (const n in t) {
      if (n.startsWith("__skip")) continue;
      let o = r[n];
      o
        ? he(o) || be(o)
          ? (o = r[n] = { type: o, default: t[n] })
          : (o.default = t[n])
        : o === null
          ? (o = r[n] = { default: t[n] })
          : {}.NODE_ENV !== "production" &&
            Z(`props default key "${n}" has no corresponding declaration.`),
        o && t[`__skip_${n}`] && (o.skipFactory = !0);
    }
    return r;
  }
  function H$() {
    const e = /* @__PURE__ */ Object.create(null);
    return (t, r) => {
      e[r]
        ? Z(`${t} property "${r}" is already defined in ${e[r]}.`)
        : (e[r] = t);
    };
  }
  let Vl = !0;
  function K$(e) {
    const t = Lc(e),
      r = e.proxy,
      n = e.ctx;
    (Vl = !1), t.beforeCreate && Gf(t.beforeCreate, e, "bc");
    const {
        // state
        data: o,
        computed: i,
        methods: s,
        watch: a,
        provide: l,
        inject: c,
        // lifecycle
        created: u,
        beforeMount: f,
        mounted: d,
        beforeUpdate: p,
        updated: h,
        activated: m,
        deactivated: v,
        beforeDestroy: g,
        beforeUnmount: _,
        destroyed: E,
        unmounted: A,
        render: D,
        renderTracked: S,
        renderTriggered: O,
        errorCaptured: j,
        serverPrefetch: B,
        // public API
        expose: W,
        inheritAttrs: re,
        // assets
        components: G,
        directives: Se,
        filters: ce,
      } = t,
      Pe = {}.NODE_ENV !== "production" ? H$() : null;
    if ({}.NODE_ENV !== "production") {
      const [ae] = e.propsOptions;
      if (ae) for (const me in ae) Pe("Props", me);
    }
    if ((c && G$(c, n, Pe), s))
      for (const ae in s) {
        const me = s[ae];
        be(me)
          ? ({}.NODE_ENV !== "production"
              ? Object.defineProperty(n, ae, {
                  value: me.bind(r),
                  configurable: !0,
                  enumerable: !0,
                  writable: !0,
                })
              : (n[ae] = me.bind(r)),
            {}.NODE_ENV !== "production" && Pe("Methods", ae))
          : {}.NODE_ENV !== "production" &&
            Z(
              `Method "${ae}" has type "${typeof me}" in the component definition. Did you reference the function correctly?`
            );
      }
    if (o) {
      ({}).NODE_ENV !== "production" &&
        !be(o) &&
        Z(
          "The data option must be a function. Plain object usage is no longer supported."
        );
      const ae = o.call(r, r);
      if (
        ({}.NODE_ENV !== "production" &&
          _c(ae) &&
          Z(
            "data() returned a Promise - note data() cannot be async; If you intend to perform data fetching before component renders, use async setup() + <Suspense>."
          ),
        !Be(ae))
      )
        ({}).NODE_ENV !== "production" && Z("data() should return an object.");
      else if (((e.data = xi(ae)), {}.NODE_ENV !== "production"))
        for (const me in ae)
          Pe("Data", me),
            Fc(me[0]) ||
              Object.defineProperty(n, me, {
                configurable: !0,
                enumerable: !0,
                get: () => ae[me],
                set: dt,
              });
    }
    if (((Vl = !0), i))
      for (const ae in i) {
        const me = i[ae],
          ze = be(me) ? me.bind(r, r) : be(me.get) ? me.get.bind(r, r) : dt;
        ({}).NODE_ENV !== "production" &&
          ze === dt &&
          Z(`Computed property "${ae}" has no getter.`);
        const Q =
            !be(me) && be(me.set)
              ? me.set.bind(r)
              : {}.NODE_ENV !== "production"
                ? () => {
                    Z(
                      `Write operation failed: computed property "${ae}" is readonly.`
                    );
                  }
                : dt,
          I = Oe({
            get: ze,
            set: Q,
          });
        Object.defineProperty(n, ae, {
          enumerable: !0,
          configurable: !0,
          get: () => I.value,
          set: R => (I.value = R),
        }),
          {}.NODE_ENV !== "production" && Pe("Computed", ae);
      }
    if (a) for (const ae in a) Bg(a[ae], n, r, ae);
    if (l) {
      const ae = be(l) ? l.call(r) : l;
      Reflect.ownKeys(ae).forEach(me => {
        Ug(me, ae[me]);
      });
    }
    u && Gf(u, e, "c");
    function _e(ae, me) {
      he(me) ? me.forEach(ze => ae(ze.bind(r))) : me && ae(me.bind(r));
    }
    if (
      (_e(x$, f),
      _e(zr, d),
      _e(D$, p),
      _e(I$, h),
      _e(P$, m),
      _e(C$, v),
      _e(F$, j),
      _e(j$, S),
      _e(M$, O),
      _e(Lg, _),
      _e(Ri, A),
      _e(R$, B),
      he(W))
    )
      if (W.length) {
        const ae = e.exposed || (e.exposed = {});
        W.forEach(me => {
          Object.defineProperty(ae, me, {
            get: () => r[me],
            set: ze => (r[me] = ze),
          });
        });
      } else e.exposed || (e.exposed = {});
    D && e.render === dt && (e.render = D),
      re != null && (e.inheritAttrs = re),
      G && (e.components = G),
      Se && (e.directives = Se);
  }
  function G$(e, t, r = dt) {
    he(e) && (e = kl(e));
    for (const n in e) {
      const o = e[n];
      let i;
      Be(o)
        ? "default" in o
          ? (i = di(o.from || n, o.default, !0))
          : (i = di(o.from || n))
        : (i = di(o)),
        yt(i)
          ? Object.defineProperty(t, n, {
              enumerable: !0,
              configurable: !0,
              get: () => i.value,
              set: s => (i.value = s),
            })
          : (t[n] = i),
        {}.NODE_ENV !== "production" && r("Inject", n);
    }
  }
  function Gf(e, t, r) {
    ir(he(e) ? e.map(n => n.bind(t.proxy)) : e.bind(t.proxy), t, r);
  }
  function Bg(e, t, r, n) {
    const o = n.includes(".") ? Mg(r, n) : () => r[n];
    if (nt(e)) {
      const i = t[e];
      be(i)
        ? vt(o, i)
        : {}.NODE_ENV !== "production" &&
          Z(`Invalid watch handler specified by key "${e}"`, i);
    } else if (be(e)) vt(o, e.bind(r));
    else if (Be(e))
      if (he(e)) e.forEach(i => Bg(i, t, r, n));
      else {
        const i = be(e.handler) ? e.handler.bind(r) : t[e.handler];
        be(i)
          ? vt(o, i, e)
          : {}.NODE_ENV !== "production" &&
            Z(`Invalid watch handler specified by key "${e.handler}"`, i);
      }
    else ({}).NODE_ENV !== "production" && Z(`Invalid watch option: "${n}"`, e);
  }
  function Lc(e) {
    const t = e.type,
      { mixins: r, extends: n } = t,
      {
        mixins: o,
        optionsCache: i,
        config: { optionMergeStrategies: s },
      } = e.appContext,
      a = i.get(t);
    let l;
    return (
      a
        ? (l = a)
        : !o.length && !r && !n
          ? (l = t)
          : ((l = {}),
            o.length && o.forEach(c => Bs(l, c, s, !0)),
            Bs(l, t, s)),
      Be(t) && i.set(t, l),
      l
    );
  }
  function Bs(e, t, r, n = !1) {
    const { mixins: o, extends: i } = t;
    i && Bs(e, i, r, !0), o && o.forEach(s => Bs(e, s, r, !0));
    for (const s in t)
      if (n && s === "expose")
        ({}).NODE_ENV !== "production" &&
          Z(
            '"expose" option is ignored when declared in mixins or extends. It should only be declared in the base component itself.'
          );
      else {
        const a = q$[s] || (r && r[s]);
        e[s] = a ? a(e[s], t[s]) : t[s];
      }
    return e;
  }
  const q$ = {
    data: qf,
    props: Yf,
    emits: Yf,
    // objects
    methods: oi,
    computed: oi,
    // lifecycle
    beforeCreate: Nt,
    created: Nt,
    beforeMount: Nt,
    mounted: Nt,
    beforeUpdate: Nt,
    updated: Nt,
    beforeDestroy: Nt,
    beforeUnmount: Nt,
    destroyed: Nt,
    unmounted: Nt,
    activated: Nt,
    deactivated: Nt,
    errorCaptured: Nt,
    serverPrefetch: Nt,
    // assets
    components: oi,
    directives: oi,
    // watch
    watch: J$,
    // provide / inject
    provide: qf,
    inject: Y$,
  };
  function qf(e, t) {
    return t
      ? e
        ? function () {
            return ot(
              be(e) ? e.call(this, this) : e,
              be(t) ? t.call(this, this) : t
            );
          }
        : t
      : e;
  }
  function Y$(e, t) {
    return oi(kl(e), kl(t));
  }
  function kl(e) {
    if (he(e)) {
      const t = {};
      for (let r = 0; r < e.length; r++) t[e[r]] = e[r];
      return t;
    }
    return e;
  }
  function Nt(e, t) {
    return e ? [...new Set([].concat(e, t))] : t;
  }
  function oi(e, t) {
    return e ? ot(/* @__PURE__ */ Object.create(null), e, t) : t;
  }
  function Yf(e, t) {
    return e
      ? he(e) && he(t)
        ? [.../* @__PURE__ */ new Set([...e, ...t])]
        : ot(/* @__PURE__ */ Object.create(null), Ll(e), Ll(t ?? {}))
      : t;
  }
  function J$(e, t) {
    if (!e) return t;
    if (!t) return e;
    const r = ot(/* @__PURE__ */ Object.create(null), e);
    for (const n in t) r[n] = Nt(e[n], t[n]);
    return r;
  }
  function zg() {
    return {
      app: null,
      config: {
        isNativeTag: s_,
        performance: !1,
        globalProperties: {},
        optionMergeStrategies: {},
        errorHandler: void 0,
        warnHandler: void 0,
        compilerOptions: {},
      },
      mixins: [],
      components: {},
      directives: {},
      provides: /* @__PURE__ */ Object.create(null),
      optionsCache: /* @__PURE__ */ new WeakMap(),
      propsCache: /* @__PURE__ */ new WeakMap(),
      emitsCache: /* @__PURE__ */ new WeakMap(),
    };
  }
  let X$ = 0;
  function Z$(e, t) {
    return function (n, o = null) {
      be(n) || (n = ot({}, n)),
        o != null &&
          !Be(o) &&
          ({}.NODE_ENV !== "production" &&
            Z("root props passed to app.mount() must be an object."),
          (o = null));
      const i = zg(),
        s = /* @__PURE__ */ new WeakSet();
      let a = !1;
      const l = (i.app = {
        _uid: X$++,
        _component: n,
        _props: o,
        _container: null,
        _context: i,
        _instance: null,
        version: ad,
        get config() {
          return i.config;
        },
        set config(c) {
          ({}).NODE_ENV !== "production" &&
            Z(
              "app.config cannot be replaced. Modify individual options instead."
            );
        },
        use(c, ...u) {
          return (
            s.has(c)
              ? {}.NODE_ENV !== "production" &&
                Z("Plugin has already been applied to target app.")
              : c && be(c.install)
                ? (s.add(c), c.install(l, ...u))
                : be(c)
                  ? (s.add(c), c(l, ...u))
                  : {}.NODE_ENV !== "production" &&
                    Z(
                      'A plugin must either be a function or an object with an "install" function.'
                    ),
            l
          );
        },
        mixin(c) {
          return (
            i.mixins.includes(c)
              ? {}.NODE_ENV !== "production" &&
                Z(
                  "Mixin has already been applied to target app" +
                    (c.name ? `: ${c.name}` : "")
                )
              : i.mixins.push(c),
            l
          );
        },
        component(c, u) {
          return (
            {}.NODE_ENV !== "production" && Kl(c, i.config),
            u
              ? ({}.NODE_ENV !== "production" &&
                  i.components[c] &&
                  Z(
                    `Component "${c}" has already been registered in target app.`
                  ),
                (i.components[c] = u),
                l)
              : i.components[c]
          );
        },
        directive(c, u) {
          return (
            {}.NODE_ENV !== "production" && jg(c),
            u
              ? ({}.NODE_ENV !== "production" &&
                  i.directives[c] &&
                  Z(
                    `Directive "${c}" has already been registered in target app.`
                  ),
                (i.directives[c] = u),
                l)
              : i.directives[c]
          );
        },
        mount(c, u, f) {
          if (a)
            ({}).NODE_ENV !== "production" &&
              Z(
                "App has already been mounted.\nIf you want to remount the same app, move your app creation logic into a factory function and create fresh app instances for each mount - e.g. `const createMyApp = () => createApp(App)`"
              );
          else {
            ({}).NODE_ENV !== "production" &&
              c.__vue_app__ &&
              Z(
                "There is already an app instance mounted on the host container.\n If you want to mount another app on the same host container, you need to unmount the previous app by calling `app.unmount()` first."
              );
            const d = Le(n, o);
            return (
              (d.appContext = i),
              f === !0 ? (f = "svg") : f === !1 && (f = void 0),
              {}.NODE_ENV !== "production" &&
                (i.reload = () => {
                  e(jr(d), c, f);
                }),
              u && t ? t(d, c) : e(d, c, f),
              (a = !0),
              (l._container = c),
              (c.__vue_app__ = l),
              {}.NODE_ENV !== "production" &&
                ((l._instance = d.component), l$(l, ad)),
              ba(d.component) || d.component.proxy
            );
          }
        },
        unmount() {
          a
            ? (e(null, l._container),
              {}.NODE_ENV !== "production" && ((l._instance = null), c$(l)),
              delete l._container.__vue_app__)
            : {}.NODE_ENV !== "production" &&
              Z("Cannot unmount an app that is not mounted.");
        },
        provide(c, u) {
          return (
            {}.NODE_ENV !== "production" &&
              c in i.provides &&
              Z(
                `App already provides property with key "${String(c)}". It will be overwritten with the new value.`
              ),
            (i.provides[c] = u),
            l
          );
        },
        runWithContext(c) {
          const u = fi;
          fi = l;
          try {
            return c();
          } finally {
            fi = u;
          }
        },
      });
      return l;
    };
  }
  let fi = null;
  function Ug(e, t) {
    if (!mt)
      ({}).NODE_ENV !== "production" &&
        Z("provide() can only be used inside setup().");
    else {
      let r = mt.provides;
      const n = mt.parent && mt.parent.provides;
      n === r && (r = mt.provides = Object.create(n)), (r[e] = t);
    }
  }
  function di(e, t, r = !1) {
    const n = mt || ut;
    if (n || fi) {
      const o = n
        ? n.parent == null
          ? n.vnode.appContext && n.vnode.appContext.provides
          : n.parent.provides
        : fi._context.provides;
      if (o && e in o) return o[e];
      if (arguments.length > 1) return r && be(t) ? t.call(n && n.proxy) : t;
      ({}).NODE_ENV !== "production" &&
        Z(`injection "${String(e)}" not found.`);
    } else
      ({}).NODE_ENV !== "production" &&
        Z("inject() can only be used inside setup() or functional components.");
  }
  function Q$(e, t, r, n = !1) {
    const o = {},
      i = {};
    Ms(i, _a, 1),
      (e.propsDefaults = /* @__PURE__ */ Object.create(null)),
      Wg(e, t, o, i);
    for (const s in e.propsOptions[0]) s in o || (o[s] = void 0);
    ({}).NODE_ENV !== "production" && Kg(t || {}, o, e),
      r
        ? (e.props = n ? o : V_(o))
        : e.type.props
          ? (e.props = o)
          : (e.props = i),
      (e.attrs = i);
  }
  function eb(e) {
    for (; e; ) {
      if (e.type.__hmrId) return !0;
      e = e.parent;
    }
  }
  function tb(e, t, r, n) {
    const {
        props: o,
        attrs: i,
        vnode: { patchFlag: s },
      } = e,
      a = Ne(o),
      [l] = e.propsOptions;
    let c = !1;
    if (
      // always force full diff in dev
      // - #1942 if hmr is enabled with sfc component
      // - vite#872 non-sfc component used by sfc component
      !({}.NODE_ENV !== "production" && eb(e)) &&
      (n || s > 0) &&
      !(s & 16)
    ) {
      if (s & 8) {
        const u = e.vnode.dynamicProps;
        for (let f = 0; f < u.length; f++) {
          let d = u[f];
          if (va(e.emitsOptions, d)) continue;
          const p = t[d];
          if (l)
            if (Me(i, d)) p !== i[d] && ((i[d] = p), (c = !0));
            else {
              const h = Ct(d);
              o[h] = Bl(l, a, h, p, e, !1);
            }
          else p !== i[d] && ((i[d] = p), (c = !0));
        }
      }
    } else {
      Wg(e, t, o, i) && (c = !0);
      let u;
      for (const f in a)
        (!t || // for camelCase
          (!Me(t, f) && // it's possible the original props was passed in as kebab-case
            // and converted to camelCase (#955)
            ((u = Bt(f)) === f || !Me(t, u)))) &&
          (l
            ? r && // for camelCase
              (r[f] !== void 0 || // for kebab-case
                r[u] !== void 0) &&
              (o[f] = Bl(l, a, f, void 0, e, !0))
            : delete o[f]);
      if (i !== a)
        for (const f in i) (!t || !Me(t, f)) && (delete i[f], (c = !0));
    }
    c && yr(e, "set", "$attrs"),
      {}.NODE_ENV !== "production" && Kg(t || {}, o, e);
  }
  function Wg(e, t, r, n) {
    const [o, i] = e.propsOptions;
    let s = !1,
      a;
    if (t)
      for (let l in t) {
        if (ai(l)) continue;
        const c = t[l];
        let u;
        o && Me(o, (u = Ct(l)))
          ? !i || !i.includes(u)
            ? (r[u] = c)
            : ((a || (a = {}))[u] = c)
          : va(e.emitsOptions, l) ||
            ((!(l in n) || c !== n[l]) && ((n[l] = c), (s = !0)));
      }
    if (i) {
      const l = Ne(r),
        c = a || Ue;
      for (let u = 0; u < i.length; u++) {
        const f = i[u];
        r[f] = Bl(o, l, f, c[f], e, !Me(c, f));
      }
    }
    return s;
  }
  function Bl(e, t, r, n, o, i) {
    const s = e[r];
    if (s != null) {
      const a = Me(s, "default");
      if (a && n === void 0) {
        const l = s.default;
        if (s.type !== Function && !s.skipFactory && be(l)) {
          const { propsDefaults: c } = o;
          if (r in c) n = c[r];
          else {
            const u = ji(o);
            (n = c[r] = l.call(null, t)), u();
          }
        } else n = l;
      }
      s[0] &&
        /* shouldCast */
        (i && !a
          ? (n = !1)
          : s[1] &&
            /* shouldCastTrue */
            (n === "" || n === Bt(r)) &&
            (n = !0));
    }
    return n;
  }
  function Hg(e, t, r = !1) {
    const n = t.propsCache,
      o = n.get(e);
    if (o) return o;
    const i = e.props,
      s = {},
      a = [];
    let l = !1;
    if (!be(e)) {
      const u = f => {
        l = !0;
        const [d, p] = Hg(f, t, !0);
        ot(s, d), p && a.push(...p);
      };
      !r && t.mixins.length && t.mixins.forEach(u),
        e.extends && u(e.extends),
        e.mixins && e.mixins.forEach(u);
    }
    if (!i && !l) return Be(e) && n.set(e, ho), ho;
    if (he(i))
      for (let u = 0; u < i.length; u++) {
        ({}).NODE_ENV !== "production" &&
          !nt(i[u]) &&
          Z("props must be strings when using array syntax.", i[u]);
        const f = Ct(i[u]);
        Jf(f) && (s[f] = Ue);
      }
    else if (i) {
      ({}).NODE_ENV !== "production" && !Be(i) && Z("invalid props options", i);
      for (const u in i) {
        const f = Ct(u);
        if (Jf(f)) {
          const d = i[u],
            p = (s[f] = he(d) || be(d) ? { type: d } : ot({}, d));
          if (p) {
            const h = Zf(Boolean, p.type),
              m = Zf(String, p.type);
            (p[0] = h > -1),
              /* shouldCast */
              (p[1] = m < 0 || h < m),
              /* shouldCastTrue */
              (h > -1 || Me(p, "default")) && a.push(f);
          }
        }
      }
    }
    const c = [s, a];
    return Be(e) && n.set(e, c), c;
  }
  function Jf(e) {
    return e[0] !== "$" && !ai(e)
      ? !0
      : ({}.NODE_ENV !== "production" &&
          Z(`Invalid prop name: "${e}" is a reserved property.`),
        !1);
  }
  function zl(e) {
    return e === null
      ? "null"
      : typeof e == "function"
        ? e.name || ""
        : (typeof e == "object" && e.constructor && e.constructor.name) || "";
  }
  function Xf(e, t) {
    return zl(e) === zl(t);
  }
  function Zf(e, t) {
    return he(t) ? t.findIndex(r => Xf(r, e)) : be(t) && Xf(t, e) ? 0 : -1;
  }
  function Kg(e, t, r) {
    const n = Ne(t),
      o = r.propsOptions[0];
    for (const i in o) {
      let s = o[i];
      s != null &&
        rb(
          i,
          n[i],
          s,
          {}.NODE_ENV !== "production" ? qt(n) : n,
          !Me(e, i) && !Me(e, Bt(i))
        );
    }
  }
  function rb(e, t, r, n, o) {
    const { type: i, required: s, validator: a, skipCheck: l } = r;
    if (s && o) {
      Z('Missing required prop: "' + e + '"');
      return;
    }
    if (!(t == null && !s)) {
      if (i != null && i !== !0 && !l) {
        let c = !1;
        const u = he(i) ? i : [i],
          f = [];
        for (let d = 0; d < u.length && !c; d++) {
          const { valid: p, expectedType: h } = ob(t, u[d]);
          f.push(h || ""), (c = p);
        }
        if (!c) {
          Z(ib(e, t, f));
          return;
        }
      }
      a &&
        !a(t, n) &&
        Z('Invalid prop: custom validator check failed for prop "' + e + '".');
    }
  }
  const nb = /* @__PURE__ */ Ao("String,Number,Boolean,Function,Symbol,BigInt");
  function ob(e, t) {
    let r;
    const n = zl(t);
    if (nb(n)) {
      const o = typeof e;
      (r = o === n.toLowerCase()), !r && o === "object" && (r = e instanceof t);
    } else
      n === "Object"
        ? (r = Be(e))
        : n === "Array"
          ? (r = he(e))
          : n === "null"
            ? (r = e === null)
            : (r = e instanceof t);
    return {
      valid: r,
      expectedType: n,
    };
  }
  function ib(e, t, r) {
    if (r.length === 0)
      return `Prop type [] for prop "${e}" won't match anything. Did you mean to use type Array instead?`;
    let n = `Invalid prop: type check failed for prop "${e}". Expected ${r.map(Vn).join(" | ")}`;
    const o = r[0],
      i = $c(t),
      s = Qf(t, o),
      a = Qf(t, i);
    return (
      r.length === 1 && ed(o) && !sb(o, i) && (n += ` with value ${s}`),
      (n += `, got ${i} `),
      ed(i) && (n += `with value ${a}.`),
      n
    );
  }
  function Qf(e, t) {
    return t === "String" ? `"${e}"` : t === "Number" ? `${Number(e)}` : `${e}`;
  }
  function ed(e) {
    return ["string", "number", "boolean"].some(r => e.toLowerCase() === r);
  }
  function sb(...e) {
    return e.some(t => t.toLowerCase() === "boolean");
  }
  const Gg = e => e[0] === "_" || e === "$stable",
    Vc = e => (he(e) ? e.map(rr) : [rr(e)]),
    ab = (e, t, r) => {
      if (t._n) return t;
      const n = oe(
        (...o) => (
          {}.NODE_ENV !== "production" &&
            mt &&
            (!r || r.root === mt.root) &&
            Z(
              `Slot "${e}" invoked outside of the render function: this will not track dependencies used in the slot. Invoke the slot function inside the render function instead.`
            ),
          Vc(t(...o))
        ),
        r
      );
      return (n._c = !1), n;
    },
    qg = (e, t, r) => {
      const n = e._ctx;
      for (const o in e) {
        if (Gg(o)) continue;
        const i = e[o];
        if (be(i)) t[o] = ab(o, i, n);
        else if (i != null) {
          ({}).NODE_ENV !== "production" &&
            Z(
              `Non-function value encountered for slot "${o}". Prefer function slots for better performance.`
            );
          const s = Vc(i);
          t[o] = () => s;
        }
      }
    },
    Yg = (e, t) => {
      ({}).NODE_ENV !== "production" &&
        !jc(e.vnode) &&
        Z(
          "Non-function value encountered for default slot. Prefer function slots for better performance."
        );
      const r = Vc(t);
      e.slots.default = () => r;
    },
    lb = (e, t) => {
      if (e.vnode.shapeFlag & 32) {
        const r = t._;
        r ? ((e.slots = Ne(t)), Ms(t, "_", r)) : qg(t, (e.slots = {}));
      } else (e.slots = {}), t && Yg(e, t);
      Ms(e.slots, _a, 1);
    },
    cb = (e, t, r) => {
      const { vnode: n, slots: o } = e;
      let i = !0,
        s = Ue;
      if (n.shapeFlag & 32) {
        const a = t._;
        a
          ? {}.NODE_ENV !== "production" && ln
            ? (ot(o, t), yr(e, "set", "$slots"))
            : r && a === 1
              ? (i = !1)
              : (ot(o, t), !r && a === 1 && delete o._)
          : ((i = !t.$stable), qg(t, o)),
          (s = t);
      } else t && (Yg(e, t), (s = { default: 1 }));
      if (i) for (const a in o) !Gg(a) && s[a] == null && delete o[a];
    };
  function Ul(e, t, r, n, o = !1) {
    if (he(e)) {
      e.forEach((d, p) => Ul(d, t && (he(t) ? t[p] : t), r, n, o));
      return;
    }
    if (ui(n) && !o) return;
    const i = n.shapeFlag & 4 ? ba(n.component) || n.component.proxy : n.el,
      s = o ? null : i,
      { i: a, r: l } = e;
    if ({}.NODE_ENV !== "production" && !a) {
      Z(
        "Missing ref owner context. ref cannot be used on hoisted vnodes. A vnode with ref must be created inside the render function."
      );
      return;
    }
    const c = t && t.r,
      u = a.refs === Ue ? (a.refs = {}) : a.refs,
      f = a.setupState;
    if (
      (c != null &&
        c !== l &&
        (nt(c)
          ? ((u[c] = null), Me(f, c) && (f[c] = null))
          : yt(c) && (c.value = null)),
      be(l))
    )
      Dr(l, a, 12, [s, u]);
    else {
      const d = nt(l),
        p = yt(l);
      if (d || p) {
        const h = () => {
          if (e.f) {
            const m = d ? (Me(f, l) ? f[l] : u[l]) : l.value;
            o
              ? he(m) && yc(m, i)
              : he(m)
                ? m.includes(i) || m.push(i)
                : d
                  ? ((u[l] = [i]), Me(f, l) && (f[l] = u[l]))
                  : ((l.value = [i]), e.k && (u[e.k] = l.value));
          } else
            d
              ? ((u[l] = s), Me(f, l) && (f[l] = s))
              : p
                ? ((l.value = s), e.k && (u[e.k] = s))
                : {}.NODE_ENV !== "production" &&
                  Z("Invalid template ref type:", l, `(${typeof l})`);
        };
        s ? ((h.id = -1), It(h, r)) : h();
      } else
        ({}).NODE_ENV !== "production" &&
          Z("Invalid template ref type:", l, `(${typeof l})`);
    }
  }
  let Go, on;
  function Sr(e, t) {
    e.appContext.config.performance && zs() && on.mark(`vue-${t}-${e.uid}`),
      {}.NODE_ENV !== "production" && p$(e, t, zs() ? on.now() : Date.now());
  }
  function Nr(e, t) {
    if (e.appContext.config.performance && zs()) {
      const r = `vue-${t}-${e.uid}`,
        n = r + ":end";
      on.mark(n),
        on.measure(`<${wa(e, e.type)}> ${t}`, r, n),
        on.clearMarks(r),
        on.clearMarks(n);
    }
    ({}).NODE_ENV !== "production" && h$(e, t, zs() ? on.now() : Date.now());
  }
  function zs() {
    return (
      Go !== void 0 ||
        (typeof window < "u" && window.performance
          ? ((Go = !0), (on = window.performance))
          : (Go = !1)),
      Go
    );
  }
  function ub() {
    const e = [];
    if ({}.NODE_ENV !== "production" && e.length) {
      const t = e.length > 1;
      console.warn(
        `Feature flag${t ? "s" : ""} ${e.join(", ")} ${t ? "are" : "is"} not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.

For more details, see https://link.vuejs.org/feature-flags.`
      );
    }
  }
  const It = E$;
  function fb(e) {
    return db(e);
  }
  function db(e, t) {
    ub();
    const r = wc();
    (r.__VUE__ = !0),
      {}.NODE_ENV !== "production" && Ng(r.__VUE_DEVTOOLS_GLOBAL_HOOK__, r);
    const {
        insert: n,
        remove: o,
        patchProp: i,
        createElement: s,
        createText: a,
        createComment: l,
        setText: c,
        setElementText: u,
        parentNode: f,
        nextSibling: d,
        setScopeId: p = dt,
        insertStaticContent: h,
      } = e,
      m = (
        b,
        T,
        k,
        K = null,
        H = null,
        J = null,
        ee = void 0,
        Y = null,
        X = {}.NODE_ENV !== "production" && ln ? !1 : !!T.dynamicChildren
      ) => {
        if (b === T) return;
        b && !qo(b, T) && ((K = F(b)), P(b, H, J, !0), (b = null)),
          T.patchFlag === -2 && ((X = !1), (T.dynamicChildren = null));
        const { type: U, ref: te, shapeFlag: se } = T;
        switch (U) {
          case Mi:
            v(b, T, k, K);
            break;
          case Tt:
            g(b, T, k, K);
            break;
          case As:
            b == null
              ? _(T, k, K, ee)
              : {}.NODE_ENV !== "production" && E(b, T, k, ee);
            break;
          case Vt:
            Se(b, T, k, K, H, J, ee, Y, X);
            break;
          default:
            se & 1
              ? S(b, T, k, K, H, J, ee, Y, X)
              : se & 6
                ? ce(b, T, k, K, H, J, ee, Y, X)
                : se & 64 || se & 128
                  ? U.process(b, T, k, K, H, J, ee, Y, X, $e)
                  : {}.NODE_ENV !== "production" &&
                    Z("Invalid VNode type:", U, `(${typeof U})`);
        }
        te != null && H && Ul(te, b && b.ref, J, T || b, !T);
      },
      v = (b, T, k, K) => {
        if (b == null) n((T.el = a(T.children)), k, K);
        else {
          const H = (T.el = b.el);
          T.children !== b.children && c(H, T.children);
        }
      },
      g = (b, T, k, K) => {
        b == null ? n((T.el = l(T.children || "")), k, K) : (T.el = b.el);
      },
      _ = (b, T, k, K) => {
        [b.el, b.anchor] = h(b.children, T, k, K, b.el, b.anchor);
      },
      E = (b, T, k, K) => {
        if (T.children !== b.children) {
          const H = d(b.anchor);
          D(b), ([T.el, T.anchor] = h(T.children, k, H, K));
        } else (T.el = b.el), (T.anchor = b.anchor);
      },
      A = ({ el: b, anchor: T }, k, K) => {
        let H;
        for (; b && b !== T; ) (H = d(b)), n(b, k, K), (b = H);
        n(T, k, K);
      },
      D = ({ el: b, anchor: T }) => {
        let k;
        for (; b && b !== T; ) (k = d(b)), o(b), (b = k);
        o(T);
      },
      S = (b, T, k, K, H, J, ee, Y, X) => {
        T.type === "svg" ? (ee = "svg") : T.type === "math" && (ee = "mathml"),
          b == null ? O(T, k, K, H, J, ee, Y, X) : W(b, T, H, J, ee, Y, X);
      },
      O = (b, T, k, K, H, J, ee, Y) => {
        let X, U;
        const { props: te, shapeFlag: se, transition: ie, dirs: ye } = b;
        if (
          ((X = b.el = s(b.type, J, te && te.is, te)),
          se & 8
            ? u(X, b.children)
            : se & 16 && B(b.children, X, null, K, H, rl(b, J), ee, Y),
          ye && bn(b, null, K, "created"),
          j(X, b, b.scopeId, ee, K),
          te)
        ) {
          for (const Ce in te)
            Ce !== "value" &&
              !ai(Ce) &&
              i(X, Ce, null, te[Ce], J, b.children, K, H, M);
          "value" in te && i(X, "value", null, te.value, J),
            (U = te.onVnodeBeforeMount) && dr(U, K, b);
        }
        ({}).NODE_ENV !== "production" &&
          (Object.defineProperty(X, "__vnode", {
            value: b,
            enumerable: !1,
          }),
          Object.defineProperty(X, "__vueParentComponent", {
            value: K,
            enumerable: !1,
          })),
          ye && bn(b, null, K, "beforeMount");
        const xe = pb(H, ie);
        xe && ie.beforeEnter(X),
          n(X, T, k),
          ((U = te && te.onVnodeMounted) || xe || ye) &&
            It(() => {
              U && dr(U, K, b),
                xe && ie.enter(X),
                ye && bn(b, null, K, "mounted");
            }, H);
      },
      j = (b, T, k, K, H) => {
        if ((k && p(b, k), K)) for (let J = 0; J < K.length; J++) p(b, K[J]);
        if (H) {
          let J = H.subTree;
          if (
            ({}.NODE_ENV !== "production" &&
              J.patchFlag > 0 &&
              J.patchFlag & 2048 &&
              (J = Rc(J.children) || J),
            T === J)
          ) {
            const ee = H.vnode;
            j(b, ee, ee.scopeId, ee.slotScopeIds, H.parent);
          }
        }
      },
      B = (b, T, k, K, H, J, ee, Y, X = 0) => {
        for (let U = X; U < b.length; U++) {
          const te = (b[U] = Y ? rn(b[U]) : rr(b[U]));
          m(null, te, T, k, K, H, J, ee, Y);
        }
      },
      W = (b, T, k, K, H, J, ee) => {
        const Y = (T.el = b.el);
        let { patchFlag: X, dynamicChildren: U, dirs: te } = T;
        X |= b.patchFlag & 16;
        const se = b.props || Ue,
          ie = T.props || Ue;
        let ye;
        if (
          (k && wn(k, !1),
          (ye = ie.onVnodeBeforeUpdate) && dr(ye, k, T, b),
          te && bn(T, b, k, "beforeUpdate"),
          k && wn(k, !0),
          {}.NODE_ENV !== "production" &&
            ln &&
            ((X = 0), (ee = !1), (U = null)),
          U
            ? (re(b.dynamicChildren, U, Y, k, K, rl(T, H), J),
              {}.NODE_ENV !== "production" && pi(b, T))
            : ee || ze(b, T, Y, null, k, K, rl(T, H), J, !1),
          X > 0)
        ) {
          if (X & 16) G(Y, T, se, ie, k, K, H);
          else if (
            (X & 2 && se.class !== ie.class && i(Y, "class", null, ie.class, H),
            X & 4 && i(Y, "style", se.style, ie.style, H),
            X & 8)
          ) {
            const xe = T.dynamicProps;
            for (let Ce = 0; Ce < xe.length; Ce++) {
              const ke = xe[Ce],
                st = se[ke],
                Dt = ie[ke];
              (Dt !== st || ke === "value") &&
                i(Y, ke, st, Dt, H, b.children, k, K, M);
            }
          }
          X & 1 && b.children !== T.children && u(Y, T.children);
        } else !ee && U == null && G(Y, T, se, ie, k, K, H);
        ((ye = ie.onVnodeUpdated) || te) &&
          It(() => {
            ye && dr(ye, k, T, b), te && bn(T, b, k, "updated");
          }, K);
      },
      re = (b, T, k, K, H, J, ee) => {
        for (let Y = 0; Y < T.length; Y++) {
          const X = b[Y],
            U = T[Y],
            te =
              // oldVNode may be an errored async setup() component inside Suspense
              // which will not have a mounted element
              X.el && // - In the case of a Fragment, we need to provide the actual parent
              // of the Fragment itself so it can move its children.
              (X.type === Vt || // - In the case of different nodes, there is going to be a replacement
                // which also requires the correct parent container
                !qo(X, U) || // - In the case of a component, it could contain anything.
                X.shapeFlag & 70)
                ? f(X.el)
                : // In other cases, the parent container is not actually used so we
                  // just pass the block element here to avoid a DOM parentNode call.
                  k;
          m(X, U, te, null, K, H, J, ee, !0);
        }
      },
      G = (b, T, k, K, H, J, ee) => {
        if (k !== K) {
          if (k !== Ue)
            for (const Y in k)
              !ai(Y) &&
                !(Y in K) &&
                i(b, Y, k[Y], null, ee, T.children, H, J, M);
          for (const Y in K) {
            if (ai(Y)) continue;
            const X = K[Y],
              U = k[Y];
            X !== U && Y !== "value" && i(b, Y, U, X, ee, T.children, H, J, M);
          }
          "value" in K && i(b, "value", k.value, K.value, ee);
        }
      },
      Se = (b, T, k, K, H, J, ee, Y, X) => {
        const U = (T.el = b ? b.el : a("")),
          te = (T.anchor = b ? b.anchor : a(""));
        let { patchFlag: se, dynamicChildren: ie, slotScopeIds: ye } = T;
        ({}).NODE_ENV !== "production" && // #5523 dev root fragment may inherit directives
          (ln || se & 2048) &&
          ((se = 0), (X = !1), (ie = null)),
          ye && (Y = Y ? Y.concat(ye) : ye),
          b == null
            ? (n(U, k, K),
              n(te, k, K),
              B(
                // #10007
                // such fragment like `<></>` will be compiled into
                // a fragment which doesn't have a children.
                // In this case fallback to an empty array
                T.children || [],
                k,
                te,
                H,
                J,
                ee,
                Y,
                X
              ))
            : se > 0 &&
                se & 64 &&
                ie && // #2715 the previous fragment could've been a BAILed one as a result
                // of renderSlot() with no valid children
                b.dynamicChildren
              ? (re(b.dynamicChildren, ie, k, H, J, ee, Y),
                {}.NODE_ENV !== "production"
                  ? pi(b, T)
                  : // #2080 if the stable fragment has a key, it's a <template v-for> that may
                    //  get moved around. Make sure all root level vnodes inherit el.
                    // #2134 or if it's a component root, it may also get moved around
                    // as the component is being moved.
                    (T.key != null || (H && T === H.subTree)) &&
                    pi(
                      b,
                      T,
                      !0
                      /* shallow */
                    ))
              : ze(b, T, k, te, H, J, ee, Y, X);
      },
      ce = (b, T, k, K, H, J, ee, Y, X) => {
        (T.slotScopeIds = Y),
          b == null
            ? T.shapeFlag & 512
              ? H.ctx.activate(T, k, K, ee, X)
              : Pe(T, k, K, H, J, ee, X)
            : _e(b, T, X);
      },
      Pe = (b, T, k, K, H, J, ee) => {
        const Y = (b.component = Eb(b, K, H));
        if (
          ({}.NODE_ENV !== "production" && Y.type.__hmrId && o$(Y),
          {}.NODE_ENV !== "production" && (Es(b), Sr(Y, "mount")),
          jc(b) && (Y.ctx.renderer = $e),
          {}.NODE_ENV !== "production" && Sr(Y, "init"),
          Ab(Y),
          {}.NODE_ENV !== "production" && Nr(Y, "init"),
          Y.asyncDep)
        ) {
          if ((H && H.registerDep(Y, ae), !b.el)) {
            const X = (Y.subTree = Le(Tt));
            g(null, X, T, k);
          }
        } else ae(Y, b, T, k, H, J, ee);
        ({}).NODE_ENV !== "production" && (Os(), Nr(Y, "mount"));
      },
      _e = (b, T, k) => {
        const K = (T.component = b.component);
        if (_$(b, T, k))
          if (K.asyncDep && !K.asyncResolved) {
            ({}).NODE_ENV !== "production" && Es(T),
              me(K, T, k),
              {}.NODE_ENV !== "production" && Os();
            return;
          } else (K.next = T), r$(K.update), (K.effect.dirty = !0), K.update();
        else (T.el = b.el), (K.vnode = T);
      },
      ae = (b, T, k, K, H, J, ee) => {
        const Y = () => {
            if (b.isMounted) {
              let { next: te, bu: se, u: ie, parent: ye, vnode: xe } = b;
              {
                const Wt = Jg(b);
                if (Wt) {
                  te && ((te.el = xe.el), me(b, te, ee)),
                    Wt.asyncDep.then(() => {
                      b.isUnmounted || Y();
                    });
                  return;
                }
              }
              let Ce = te,
                ke;
              ({}).NODE_ENV !== "production" && Es(te || b.vnode),
                wn(b, !1),
                te ? ((te.el = xe.el), me(b, te, ee)) : (te = xe),
                se && Ko(se),
                (ke = te.props && te.props.onVnodeBeforeUpdate) &&
                  dr(ke, ye, te, xe),
                wn(b, !0),
                {}.NODE_ENV !== "production" && Sr(b, "render");
              const st = el(b);
              ({}).NODE_ENV !== "production" && Nr(b, "render");
              const Dt = b.subTree;
              (b.subTree = st),
                {}.NODE_ENV !== "production" && Sr(b, "patch"),
                m(
                  Dt,
                  st,
                  // parent may have changed if it's in a teleport
                  f(Dt.el),
                  // anchor may have changed if it's in a fragment
                  F(Dt),
                  b,
                  H,
                  J
                ),
                {}.NODE_ENV !== "production" && Nr(b, "patch"),
                (te.el = st.el),
                Ce === null && $$(b, st.el),
                ie && It(ie, H),
                (ke = te.props && te.props.onVnodeUpdated) &&
                  It(() => dr(ke, ye, te, xe), H),
                {}.NODE_ENV !== "production" && Pg(b),
                {}.NODE_ENV !== "production" && Os();
            } else {
              let te;
              const { el: se, props: ie } = T,
                { bm: ye, m: xe, parent: Ce } = b,
                ke = ui(T);
              if (
                (wn(b, !1),
                ye && Ko(ye),
                !ke && (te = ie && ie.onVnodeBeforeMount) && dr(te, Ce, T),
                wn(b, !0),
                se && qe)
              ) {
                const st = () => {
                  ({}).NODE_ENV !== "production" && Sr(b, "render"),
                    (b.subTree = el(b)),
                    {}.NODE_ENV !== "production" && Nr(b, "render"),
                    {}.NODE_ENV !== "production" && Sr(b, "hydrate"),
                    qe(se, b.subTree, b, H, null),
                    {}.NODE_ENV !== "production" && Nr(b, "hydrate");
                };
                ke
                  ? T.type.__asyncLoader().then(
                      // note: we are moving the render call into an async callback,
                      // which means it won't track dependencies - but it's ok because
                      // a server-rendered async wrapper is already in resolved state
                      // and it will never need to change.
                      () => !b.isUnmounted && st()
                    )
                  : st();
              } else {
                ({}).NODE_ENV !== "production" && Sr(b, "render");
                const st = (b.subTree = el(b));
                ({}).NODE_ENV !== "production" && Nr(b, "render"),
                  {}.NODE_ENV !== "production" && Sr(b, "patch"),
                  m(null, st, k, K, b, H, J),
                  {}.NODE_ENV !== "production" && Nr(b, "patch"),
                  (T.el = st.el);
              }
              if ((xe && It(xe, H), !ke && (te = ie && ie.onVnodeMounted))) {
                const st = T;
                It(() => dr(te, Ce, st), H);
              }
              (T.shapeFlag & 256 ||
                (Ce && ui(Ce.vnode) && Ce.vnode.shapeFlag & 256)) &&
                b.a &&
                It(b.a, H),
                (b.isMounted = !0),
                {}.NODE_ENV !== "production" && u$(b),
                (T = k = K = null);
            }
          },
          X = (b.effect = new Oc(
            Y,
            dt,
            () => ma(U),
            b.scope
            // track it in component's effect scope
          )),
          U = (b.update = () => {
            X.dirty && X.run();
          });
        (U.id = b.uid),
          wn(b, !0),
          {}.NODE_ENV !== "production" &&
            ((X.onTrack = b.rtc ? te => Ko(b.rtc, te) : void 0),
            (X.onTrigger = b.rtg ? te => Ko(b.rtg, te) : void 0),
            (U.ownerInstance = b)),
          U();
      },
      me = (b, T, k) => {
        T.component = b;
        const K = b.vnode.props;
        (b.vnode = T),
          (b.next = null),
          tb(b, T.props, K, k),
          cb(b, T.children, k),
          hn(),
          zf(b),
          gn();
      },
      ze = (b, T, k, K, H, J, ee, Y, X = !1) => {
        const U = b && b.children,
          te = b ? b.shapeFlag : 0,
          se = T.children,
          { patchFlag: ie, shapeFlag: ye } = T;
        if (ie > 0) {
          if (ie & 128) {
            I(U, se, k, K, H, J, ee, Y, X);
            return;
          } else if (ie & 256) {
            Q(U, se, k, K, H, J, ee, Y, X);
            return;
          }
        }
        ye & 8
          ? (te & 16 && M(U, H, J), se !== U && u(k, se))
          : te & 16
            ? ye & 16
              ? I(U, se, k, K, H, J, ee, Y, X)
              : M(U, H, J, !0)
            : (te & 8 && u(k, ""), ye & 16 && B(se, k, K, H, J, ee, Y, X));
      },
      Q = (b, T, k, K, H, J, ee, Y, X) => {
        (b = b || ho), (T = T || ho);
        const U = b.length,
          te = T.length,
          se = Math.min(U, te);
        let ie;
        for (ie = 0; ie < se; ie++) {
          const ye = (T[ie] = X ? rn(T[ie]) : rr(T[ie]));
          m(b[ie], ye, k, null, H, J, ee, Y, X);
        }
        U > te ? M(b, H, J, !0, !1, se) : B(T, k, K, H, J, ee, Y, X, se);
      },
      I = (b, T, k, K, H, J, ee, Y, X) => {
        let U = 0;
        const te = T.length;
        let se = b.length - 1,
          ie = te - 1;
        for (; U <= se && U <= ie; ) {
          const ye = b[U],
            xe = (T[U] = X ? rn(T[U]) : rr(T[U]));
          if (qo(ye, xe)) m(ye, xe, k, null, H, J, ee, Y, X);
          else break;
          U++;
        }
        for (; U <= se && U <= ie; ) {
          const ye = b[se],
            xe = (T[ie] = X ? rn(T[ie]) : rr(T[ie]));
          if (qo(ye, xe)) m(ye, xe, k, null, H, J, ee, Y, X);
          else break;
          se--, ie--;
        }
        if (U > se) {
          if (U <= ie) {
            const ye = ie + 1,
              xe = ye < te ? T[ye].el : K;
            for (; U <= ie; )
              m(null, (T[U] = X ? rn(T[U]) : rr(T[U])), k, xe, H, J, ee, Y, X),
                U++;
          }
        } else if (U > ie) for (; U <= se; ) P(b[U], H, J, !0), U++;
        else {
          const ye = U,
            xe = U,
            Ce = /* @__PURE__ */ new Map();
          for (U = xe; U <= ie; U++) {
            const He = (T[U] = X ? rn(T[U]) : rr(T[U]));
            He.key != null &&
              ({}.NODE_ENV !== "production" &&
                Ce.has(He.key) &&
                Z(
                  "Duplicate keys found during update:",
                  JSON.stringify(He.key),
                  "Make sure keys are unique."
                ),
              Ce.set(He.key, U));
          }
          let ke,
            st = 0;
          const Dt = ie - xe + 1;
          let Wt = !1,
            zo = 0;
          const yn = new Array(Dt);
          for (U = 0; U < Dt; U++) yn[U] = 0;
          for (U = ye; U <= se; U++) {
            const He = b[U];
            if (st >= Dt) {
              P(He, H, J, !0);
              continue;
            }
            let Ht;
            if (He.key != null) Ht = Ce.get(He.key);
            else
              for (ke = xe; ke <= ie; ke++)
                if (yn[ke - xe] === 0 && qo(He, T[ke])) {
                  Ht = ke;
                  break;
                }
            Ht === void 0
              ? P(He, H, J, !0)
              : ((yn[Ht - xe] = U + 1),
                Ht >= zo ? (zo = Ht) : (Wt = !0),
                m(He, T[Ht], k, null, H, J, ee, Y, X),
                st++);
          }
          const Uo = Wt ? hb(yn) : ho;
          for (ke = Uo.length - 1, U = Dt - 1; U >= 0; U--) {
            const He = xe + U,
              Ht = T[He],
              es = He + 1 < te ? T[He + 1].el : K;
            yn[U] === 0
              ? m(null, Ht, k, es, H, J, ee, Y, X)
              : Wt && (ke < 0 || U !== Uo[ke] ? R(Ht, k, es, 2) : ke--);
          }
        }
      },
      R = (b, T, k, K, H = null) => {
        const { el: J, type: ee, transition: Y, children: X, shapeFlag: U } = b;
        if (U & 6) {
          R(b.component.subTree, T, k, K);
          return;
        }
        if (U & 128) {
          b.suspense.move(T, k, K);
          return;
        }
        if (U & 64) {
          ee.move(b, T, k, $e);
          return;
        }
        if (ee === Vt) {
          n(J, T, k);
          for (let se = 0; se < X.length; se++) R(X[se], T, k, K);
          n(b.anchor, T, k);
          return;
        }
        if (ee === As) {
          A(b, T, k);
          return;
        }
        if (K !== 2 && U & 1 && Y)
          if (K === 0) Y.beforeEnter(J), n(J, T, k), It(() => Y.enter(J), H);
          else {
            const { leave: se, delayLeave: ie, afterLeave: ye } = Y,
              xe = () => n(J, T, k),
              Ce = () => {
                se(J, () => {
                  xe(), ye && ye();
                });
              };
            ie ? ie(J, xe, Ce) : Ce();
          }
        else n(J, T, k);
      },
      P = (b, T, k, K = !1, H = !1) => {
        const {
          type: J,
          props: ee,
          ref: Y,
          children: X,
          dynamicChildren: U,
          shapeFlag: te,
          patchFlag: se,
          dirs: ie,
        } = b;
        if ((Y != null && Ul(Y, null, k, b, !0), te & 256)) {
          T.ctx.deactivate(b);
          return;
        }
        const ye = te & 1 && ie,
          xe = !ui(b);
        let Ce;
        if (
          (xe && (Ce = ee && ee.onVnodeBeforeUnmount) && dr(Ce, T, b), te & 6)
        )
          N(b.component, k, K);
        else {
          if (te & 128) {
            b.suspense.unmount(k, K);
            return;
          }
          ye && bn(b, null, T, "beforeUnmount"),
            te & 64
              ? b.type.remove(b, T, k, H, $e, K)
              : U && // #1153: fast path should not be taken for non-stable (v-for) fragments
                  (J !== Vt || (se > 0 && se & 64))
                ? M(U, T, k, !1, !0)
                : ((J === Vt && se & 384) || (!H && te & 16)) && M(X, T, k),
            K && y(b);
        }
        ((xe && (Ce = ee && ee.onVnodeUnmounted)) || ye) &&
          It(() => {
            Ce && dr(Ce, T, b), ye && bn(b, null, T, "unmounted");
          }, k);
      },
      y = b => {
        const { type: T, el: k, anchor: K, transition: H } = b;
        if (T === Vt) {
          ({}).NODE_ENV !== "production" &&
          b.patchFlag > 0 &&
          b.patchFlag & 2048 &&
          H &&
          !H.persisted
            ? b.children.forEach(ee => {
                ee.type === Tt ? o(ee.el) : y(ee);
              })
            : $(k, K);
          return;
        }
        if (T === As) {
          D(b);
          return;
        }
        const J = () => {
          o(k), H && !H.persisted && H.afterLeave && H.afterLeave();
        };
        if (b.shapeFlag & 1 && H && !H.persisted) {
          const { leave: ee, delayLeave: Y } = H,
            X = () => ee(k, J);
          Y ? Y(b.el, J, X) : X();
        } else J();
      },
      $ = (b, T) => {
        let k;
        for (; b !== T; ) (k = d(b)), o(b), (b = k);
        o(T);
      },
      N = (b, T, k) => {
        ({}).NODE_ENV !== "production" && b.type.__hmrId && i$(b);
        const { bum: K, scope: H, update: J, subTree: ee, um: Y } = b;
        K && Ko(K),
          H.stop(),
          J && ((J.active = !1), P(ee, b, T, k)),
          Y && It(Y, T),
          It(() => {
            b.isUnmounted = !0;
          }, T),
          T &&
            T.pendingBranch &&
            !T.isUnmounted &&
            b.asyncDep &&
            !b.asyncResolved &&
            b.suspenseId === T.pendingId &&
            (T.deps--, T.deps === 0 && T.resolve()),
          {}.NODE_ENV !== "production" && d$(b);
      },
      M = (b, T, k, K = !1, H = !1, J = 0) => {
        for (let ee = J; ee < b.length; ee++) P(b[ee], T, k, K, H);
      },
      F = b =>
        b.shapeFlag & 6
          ? F(b.component.subTree)
          : b.shapeFlag & 128
            ? b.suspense.next()
            : d(b.anchor || b.el);
    let q = !1;
    const ne = (b, T, k) => {
        b == null
          ? T._vnode && P(T._vnode, null, null, !0)
          : m(T._vnode || null, b, T, null, null, null, k),
          q || ((q = !0), zf(), Og(), (q = !1)),
          (T._vnode = b);
      },
      $e = {
        p: m,
        um: P,
        m: R,
        r: y,
        mt: Pe,
        mc: B,
        pc: ze,
        pbc: re,
        n: F,
        o: e,
      };
    let Te, qe;
    return (
      t && ([Te, qe] = t($e)),
      {
        render: ne,
        hydrate: Te,
        createApp: Z$(ne, Te),
      }
    );
  }
  function rl({ type: e, props: t }, r) {
    return (r === "svg" && e === "foreignObject") ||
      (r === "mathml" &&
        e === "annotation-xml" &&
        t &&
        t.encoding &&
        t.encoding.includes("html"))
      ? void 0
      : r;
  }
  function wn({ effect: e, update: t }, r) {
    e.allowRecurse = t.allowRecurse = r;
  }
  function pb(e, t) {
    return (!e || (e && !e.pendingBranch)) && t && !t.persisted;
  }
  function pi(e, t, r = !1) {
    const n = e.children,
      o = t.children;
    if (he(n) && he(o))
      for (let i = 0; i < n.length; i++) {
        const s = n[i];
        let a = o[i];
        a.shapeFlag & 1 &&
          !a.dynamicChildren &&
          ((a.patchFlag <= 0 || a.patchFlag === 32) &&
            ((a = o[i] = rn(o[i])), (a.el = s.el)),
          r || pi(s, a)),
          a.type === Mi && (a.el = s.el),
          {}.NODE_ENV !== "production" &&
            a.type === Tt &&
            !a.el &&
            (a.el = s.el);
      }
  }
  function hb(e) {
    const t = e.slice(),
      r = [0];
    let n, o, i, s, a;
    const l = e.length;
    for (n = 0; n < l; n++) {
      const c = e[n];
      if (c !== 0) {
        if (((o = r[r.length - 1]), e[o] < c)) {
          (t[n] = o), r.push(n);
          continue;
        }
        for (i = 0, s = r.length - 1; i < s; )
          (a = (i + s) >> 1), e[r[a]] < c ? (i = a + 1) : (s = a);
        c < e[r[i]] && (i > 0 && (t[n] = r[i - 1]), (r[i] = n));
      }
    }
    for (i = r.length, s = r[i - 1]; i-- > 0; ) (r[i] = s), (s = t[s]);
    return r;
  }
  function Jg(e) {
    const t = e.subTree.component;
    if (t) return t.asyncDep && !t.asyncResolved ? t : Jg(t);
  }
  const gb = e => e.__isTeleport,
    mo = e => e && (e.disabled || e.disabled === ""),
    td = e => typeof SVGElement < "u" && e instanceof SVGElement,
    rd = e => typeof MathMLElement == "function" && e instanceof MathMLElement,
    Wl = (e, t) => {
      const r = e && e.to;
      if (nt(r))
        if (t) {
          const n = t(r);
          return (
            n ||
              ({}.NODE_ENV !== "production" &&
                Z(
                  `Failed to locate Teleport target with selector "${r}". Note the target element must exist before the component is mounted - i.e. the target cannot be rendered by the component itself, and ideally should be outside of the entire Vue component tree.`
                )),
            n
          );
        } else
          return (
            {}.NODE_ENV !== "production" &&
              Z(
                "Current renderer does not support string target for Teleports. (missing querySelector renderer option)"
              ),
            null
          );
      else
        return (
          {}.NODE_ENV !== "production" &&
            !r &&
            !mo(e) &&
            Z(`Invalid Teleport target: ${r}`),
          r
        );
    },
    mb = {
      name: "Teleport",
      __isTeleport: !0,
      process(e, t, r, n, o, i, s, a, l, c) {
        const {
            mc: u,
            pc: f,
            pbc: d,
            o: { insert: p, querySelector: h, createText: m, createComment: v },
          } = c,
          g = mo(t.props);
        let { shapeFlag: _, children: E, dynamicChildren: A } = t;
        if (
          ({}.NODE_ENV !== "production" && ln && ((l = !1), (A = null)),
          e == null)
        ) {
          const D = (t.el =
              {}.NODE_ENV !== "production" ? v("teleport start") : m("")),
            S = (t.anchor =
              {}.NODE_ENV !== "production" ? v("teleport end") : m(""));
          p(D, r, n), p(S, r, n);
          const O = (t.target = Wl(t.props, h)),
            j = (t.targetAnchor = m(""));
          O
            ? (p(j, O),
              s === "svg" || td(O)
                ? (s = "svg")
                : (s === "mathml" || rd(O)) && (s = "mathml"))
            : {}.NODE_ENV !== "production" &&
              !g &&
              Z("Invalid Teleport target on mount:", O, `(${typeof O})`);
          const B = (W, re) => {
            _ & 16 && u(E, W, re, o, i, s, a, l);
          };
          g ? B(r, S) : O && B(O, j);
        } else {
          t.el = e.el;
          const D = (t.anchor = e.anchor),
            S = (t.target = e.target),
            O = (t.targetAnchor = e.targetAnchor),
            j = mo(e.props),
            B = j ? r : S,
            W = j ? D : O;
          if (
            (s === "svg" || td(S)
              ? (s = "svg")
              : (s === "mathml" || rd(S)) && (s = "mathml"),
            A
              ? (d(e.dynamicChildren, A, B, o, i, s, a), pi(e, t, !0))
              : l || f(e, t, B, W, o, i, s, a, !1),
            g)
          )
            j
              ? t.props &&
                e.props &&
                t.props.to !== e.props.to &&
                (t.props.to = e.props.to)
              : us(t, r, D, c, 1);
          else if ((t.props && t.props.to) !== (e.props && e.props.to)) {
            const re = (t.target = Wl(t.props, h));
            re
              ? us(t, re, null, c, 0)
              : {}.NODE_ENV !== "production" &&
                Z("Invalid Teleport target on update:", S, `(${typeof S})`);
          } else j && us(t, S, O, c, 1);
        }
        Xg(t);
      },
      remove(e, t, r, n, { um: o, o: { remove: i } }, s) {
        const {
          shapeFlag: a,
          children: l,
          anchor: c,
          targetAnchor: u,
          target: f,
          props: d,
        } = e;
        if ((f && i(u), s && i(c), a & 16)) {
          const p = s || !mo(d);
          for (let h = 0; h < l.length; h++) {
            const m = l[h];
            o(m, t, r, p, !!m.dynamicChildren);
          }
        }
      },
      move: us,
      hydrate: vb,
    };
  function us(e, t, r, { o: { insert: n }, m: o }, i = 2) {
    i === 0 && n(e.targetAnchor, t, r);
    const { el: s, anchor: a, shapeFlag: l, children: c, props: u } = e,
      f = i === 2;
    if ((f && n(s, t, r), (!f || mo(u)) && l & 16))
      for (let d = 0; d < c.length; d++) o(c[d], t, r, 2);
    f && n(a, t, r);
  }
  function vb(
    e,
    t,
    r,
    n,
    o,
    i,
    { o: { nextSibling: s, parentNode: a, querySelector: l } },
    c
  ) {
    const u = (t.target = Wl(t.props, l));
    if (u) {
      const f = u._lpa || u.firstChild;
      if (t.shapeFlag & 16)
        if (mo(t.props))
          (t.anchor = c(s(e), t, a(e), r, n, o, i)), (t.targetAnchor = f);
        else {
          t.anchor = s(e);
          let d = f;
          for (; d; )
            if (
              ((d = s(d)),
              d && d.nodeType === 8 && d.data === "teleport anchor")
            ) {
              (t.targetAnchor = d),
                (u._lpa = t.targetAnchor && s(t.targetAnchor));
              break;
            }
          c(f, t, u, r, n, o, i);
        }
      Xg(t);
    }
    return t.anchor && s(t.anchor);
  }
  const yb = mb;
  function Xg(e) {
    const t = e.ctx;
    if (t && t.ut) {
      let r = e.children[0].el;
      for (; r && r !== e.targetAnchor; )
        r.nodeType === 1 && r.setAttribute("data-v-owner", t.uid),
          (r = r.nextSibling);
      t.ut();
    }
  }
  const Vt = Symbol.for("v-fgt"),
    Mi = Symbol.for("v-txt"),
    Tt = Symbol.for("v-cmt"),
    As = Symbol.for("v-stc"),
    hi = [];
  let or = null;
  function ue(e = !1) {
    hi.push((or = e ? null : []));
  }
  function _b() {
    hi.pop(), (or = hi[hi.length - 1] || null);
  }
  let Ai = 1;
  function nd(e) {
    Ai += e;
  }
  function Zg(e) {
    return (
      (e.dynamicChildren = Ai > 0 ? or || ho : null),
      _b(),
      Ai > 0 && or && or.push(e),
      e
    );
  }
  function Po(e, t, r, n, o, i) {
    return Zg(qn(e, t, r, n, o, i, !0));
  }
  function ve(e, t, r, n, o) {
    return Zg(Le(e, t, r, n, o, !0));
  }
  function _o(e) {
    return e ? e.__v_isVNode === !0 : !1;
  }
  function qo(e, t) {
    return {}.NODE_ENV !== "production" && t.shapeFlag & 6 && uo.has(t.type)
      ? ((e.shapeFlag &= -257), (t.shapeFlag &= -513), !1)
      : e.type === t.type && e.key === t.key;
  }
  const $b = (...e) => em(...e),
    _a = "__vInternal",
    Qg = ({ key: e }) => e ?? null,
    Ss = ({ ref: e, ref_key: t, ref_for: r }) => (
      typeof e == "number" && (e = "" + e),
      e != null
        ? nt(e) || yt(e) || be(e)
          ? { i: ut, r: e, k: t, f: !!r }
          : e
        : null
    );
  function qn(
    e,
    t = null,
    r = null,
    n = 0,
    o = null,
    i = e === Vt ? 0 : 1,
    s = !1,
    a = !1
  ) {
    const l = {
      __v_isVNode: !0,
      __v_skip: !0,
      type: e,
      props: t,
      key: t && Qg(t),
      ref: t && Ss(t),
      scopeId: xg,
      slotScopeIds: null,
      children: r,
      component: null,
      suspense: null,
      ssContent: null,
      ssFallback: null,
      dirs: null,
      transition: null,
      el: null,
      anchor: null,
      target: null,
      targetAnchor: null,
      staticCount: 0,
      shapeFlag: i,
      patchFlag: n,
      dynamicProps: o,
      dynamicChildren: null,
      appContext: null,
      ctx: ut,
    };
    return (
      a
        ? (kc(l, r), i & 128 && e.normalize(l))
        : r && (l.shapeFlag |= nt(r) ? 8 : 16),
      {}.NODE_ENV !== "production" &&
        l.key !== l.key &&
        Z("VNode created with invalid key (NaN). VNode type:", l.type),
      Ai > 0 && // avoid a block node from tracking itself
        !s && // has current parent block
        or && // presence of a patch flag indicates this node needs patching on updates.
        // component nodes also should always be patched, because even if the
        // component doesn't need to update, it needs to persist the instance on to
        // the next vnode so that it can be properly unmounted later.
        (l.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
        // vnode should not be considered dynamic due to handler caching.
        l.patchFlag !== 32 &&
        or.push(l),
      l
    );
  }
  const Le = {}.NODE_ENV !== "production" ? $b : em;
  function em(e, t = null, r = null, n = 0, o = null, i = !1) {
    if (
      ((!e || e === Ig) &&
        ({}.NODE_ENV !== "production" &&
          !e &&
          Z(`Invalid vnode type when creating vnode: ${e}.`),
        (e = Tt)),
      _o(e))
    ) {
      const a = jr(
        e,
        t,
        !0
        /* mergeRef: true */
      );
      return (
        r && kc(a, r),
        Ai > 0 &&
          !i &&
          or &&
          (a.shapeFlag & 6 ? (or[or.indexOf(e)] = a) : or.push(a)),
        (a.patchFlag |= -2),
        a
      );
    }
    if ((im(e) && (e = e.__vccOpts), t)) {
      t = Yn(t);
      let { class: a, style: l } = t;
      a && !nt(a) && (t.class = it(a)),
        Be(l) && (Fs(l) && !he(l) && (l = ot({}, l)), (t.style = Gn(l)));
    }
    const s = nt(e) ? 1 : w$(e) ? 128 : gb(e) ? 64 : Be(e) ? 4 : be(e) ? 2 : 0;
    return (
      {}.NODE_ENV !== "production" &&
        s & 4 &&
        Fs(e) &&
        ((e = Ne(e)),
        Z(
          "Vue received a Component that was made a reactive object. This can lead to unnecessary performance overhead and should be avoided by marking the component with `markRaw` or using `shallowRef` instead of `ref`.",
          `
Component that was made reactive: `,
          e
        )),
      qn(e, t, r, n, o, s, i, !0)
    );
  }
  function Yn(e) {
    return e ? (Fs(e) || _a in e ? ot({}, e) : e) : null;
  }
  function jr(e, t, r = !1) {
    const { props: n, ref: o, patchFlag: i, children: s } = e,
      a = t ? pt(n || {}, t) : n;
    return {
      __v_isVNode: !0,
      __v_skip: !0,
      type: e.type,
      props: a,
      key: a && Qg(a),
      ref:
        t && t.ref
          ? // #2078 in the case of <component :is="vnode" ref="extra"/>
            // if the vnode itself already has a ref, cloneVNode will need to merge
            // the refs so the single vnode can be set on multiple refs
            r && o
            ? he(o)
              ? o.concat(Ss(t))
              : [o, Ss(t)]
            : Ss(t)
          : o,
      scopeId: e.scopeId,
      slotScopeIds: e.slotScopeIds,
      children:
        {}.NODE_ENV !== "production" && i === -1 && he(s) ? s.map(tm) : s,
      target: e.target,
      targetAnchor: e.targetAnchor,
      staticCount: e.staticCount,
      shapeFlag: e.shapeFlag,
      // if the vnode is cloned with extra props, we can no longer assume its
      // existing patch flag to be reliable and need to add the FULL_PROPS flag.
      // note: preserve flag for fragments since they use the flag for children
      // fast paths only.
      patchFlag: t && e.type !== Vt ? (i === -1 ? 16 : i | 16) : i,
      dynamicProps: e.dynamicProps,
      dynamicChildren: e.dynamicChildren,
      appContext: e.appContext,
      dirs: e.dirs,
      transition: e.transition,
      // These should technically only be non-null on mounted VNodes. However,
      // they *should* be copied for kept-alive vnodes. So we just always copy
      // them since them being non-null during a mount doesn't affect the logic as
      // they will simply be overwritten.
      component: e.component,
      suspense: e.suspense,
      ssContent: e.ssContent && jr(e.ssContent),
      ssFallback: e.ssFallback && jr(e.ssFallback),
      el: e.el,
      anchor: e.anchor,
      ctx: e.ctx,
      ce: e.ce,
    };
  }
  function tm(e) {
    const t = jr(e);
    return he(e.children) && (t.children = e.children.map(tm)), t;
  }
  function $o(e = " ", t = 0) {
    return Le(Mi, null, e, t);
  }
  function mr(e = "", t = !1) {
    return t ? (ue(), ve(Tt, null, e)) : Le(Tt, null, e);
  }
  function rr(e) {
    return e == null || typeof e == "boolean"
      ? Le(Tt)
      : he(e)
        ? Le(
            Vt,
            null,
            // #3666, avoid reference pollution when reusing vnode
            e.slice()
          )
        : typeof e == "object"
          ? rn(e)
          : Le(Mi, null, String(e));
  }
  function rn(e) {
    return (e.el === null && e.patchFlag !== -1) || e.memo ? e : jr(e);
  }
  function kc(e, t) {
    let r = 0;
    const { shapeFlag: n } = e;
    if (t == null) t = null;
    else if (he(t)) r = 16;
    else if (typeof t == "object")
      if (n & 65) {
        const o = t.default;
        o && (o._c && (o._d = !1), kc(e, o()), o._c && (o._d = !0));
        return;
      } else {
        r = 32;
        const o = t._;
        !o && !(_a in t)
          ? (t._ctx = ut)
          : o === 3 &&
            ut &&
            (ut.slots._ === 1 ? (t._ = 1) : ((t._ = 2), (e.patchFlag |= 1024)));
      }
    else
      be(t)
        ? ((t = { default: t, _ctx: ut }), (r = 32))
        : ((t = String(t)), n & 64 ? ((r = 16), (t = [$o(t)])) : (r = 8));
    (e.children = t), (e.shapeFlag |= r);
  }
  function pt(...e) {
    const t = {};
    for (let r = 0; r < e.length; r++) {
      const n = e[r];
      for (const o in n)
        if (o === "class")
          t.class !== n.class && (t.class = it([t.class, n.class]));
        else if (o === "style") t.style = Gn([t.style, n.style]);
        else if (Ti(o)) {
          const i = t[o],
            s = n[o];
          s &&
            i !== s &&
            !(he(i) && i.includes(s)) &&
            (t[o] = i ? [].concat(i, s) : s);
        } else o !== "" && (t[o] = n[o]);
    }
    return t;
  }
  function dr(e, t, r, n = null) {
    ir(e, t, 7, [r, n]);
  }
  const bb = zg();
  let wb = 0;
  function Eb(e, t, r) {
    const n = e.type,
      o = (t ? t.appContext : e.appContext) || bb,
      i = {
        uid: wb++,
        vnode: e,
        type: n,
        parent: t,
        appContext: o,
        root: null,
        // to be immediately set
        next: null,
        subTree: null,
        // will be set synchronously right after creation
        effect: null,
        update: null,
        // will be set synchronously right after creation
        scope: new Xh(
          !0
          /* detached */
        ),
        render: null,
        proxy: null,
        exposed: null,
        exposeProxy: null,
        withProxy: null,
        provides: t ? t.provides : Object.create(o.provides),
        accessCache: null,
        renderCache: [],
        // local resolved assets
        components: null,
        directives: null,
        // resolved props and emits options
        propsOptions: Hg(n, o),
        emitsOptions: Tg(n, o),
        // emit
        emit: null,
        // to be set immediately
        emitted: null,
        // props default value
        propsDefaults: Ue,
        // inheritAttrs
        inheritAttrs: n.inheritAttrs,
        // state
        ctx: Ue,
        data: Ue,
        props: Ue,
        attrs: Ue,
        slots: Ue,
        refs: Ue,
        setupState: Ue,
        setupContext: null,
        attrsProxy: null,
        slotsProxy: null,
        // suspense related
        suspense: r,
        suspenseId: r ? r.pendingId : 0,
        asyncDep: null,
        asyncResolved: !1,
        // lifecycle hooks
        // not using enums here because it results in computed properties
        isMounted: !1,
        isUnmounted: !1,
        isDeactivated: !1,
        bc: null,
        c: null,
        bm: null,
        m: null,
        bu: null,
        u: null,
        um: null,
        bum: null,
        da: null,
        a: null,
        rtg: null,
        rtc: null,
        ec: null,
        sp: null,
      };
    return (
      {}.NODE_ENV !== "production" ? (i.ctx = V$(i)) : (i.ctx = { _: i }),
      (i.root = t ? t.root : i),
      (i.emit = m$.bind(null, i)),
      e.ce && e.ce(i),
      i
    );
  }
  let mt = null;
  const Ur = () => mt || ut;
  let Us, Hl;
  {
    const e = wc(),
      t = (r, n) => {
        let o;
        return (
          (o = e[r]) || (o = e[r] = []),
          o.push(n),
          i => {
            o.length > 1 ? o.forEach(s => s(i)) : o[0](i);
          }
        );
      };
    (Us = t("__VUE_INSTANCE_SETTERS__", r => (mt = r))),
      (Hl = t("__VUE_SSR_SETTERS__", r => ($a = r)));
  }
  const ji = e => {
      const t = mt;
      return (
        Us(e),
        e.scope.on(),
        () => {
          e.scope.off(), Us(t);
        }
      );
    },
    od = () => {
      mt && mt.scope.off(), Us(null);
    },
    Ob = /* @__PURE__ */ Ao("slot,component");
  function Kl(e, { isNativeTag: t }) {
    (Ob(e) || t(e)) &&
      Z("Do not use built-in or reserved HTML elements as component id: " + e);
  }
  function rm(e) {
    return e.vnode.shapeFlag & 4;
  }
  let $a = !1;
  function Ab(e, t = !1) {
    t && Hl(t);
    const { props: r, children: n } = e.vnode,
      o = rm(e);
    Q$(e, r, o, t), lb(e, n);
    const i = o ? Sb(e, t) : void 0;
    return t && Hl(!1), i;
  }
  function Sb(e, t) {
    var r;
    const n = e.type;
    if ({}.NODE_ENV !== "production") {
      if ((n.name && Kl(n.name, e.appContext.config), n.components)) {
        const i = Object.keys(n.components);
        for (let s = 0; s < i.length; s++) Kl(i[s], e.appContext.config);
      }
      if (n.directives) {
        const i = Object.keys(n.directives);
        for (let s = 0; s < i.length; s++) jg(i[s]);
      }
      n.compilerOptions &&
        Nb() &&
        Z(
          '"compilerOptions" is only supported when using a build of Vue that includes the runtime compiler. Since you are using a runtime-only build, the options should be passed via your build tool config instead.'
        );
    }
    (e.accessCache = /* @__PURE__ */ Object.create(null)),
      (e.proxy = hg(new Proxy(e.ctx, kg))),
      {}.NODE_ENV !== "production" && k$(e);
    const { setup: o } = n;
    if (o) {
      const i = (e.setupContext = o.length > 1 ? om(e) : null),
        s = ji(e);
      hn();
      const a = Dr(o, e, 0, [
        {}.NODE_ENV !== "production" ? qt(e.props) : e.props,
        i,
      ]);
      if ((gn(), s(), _c(a))) {
        if ((a.then(od, od), t))
          return a
            .then(l => {
              id(e, l, t);
            })
            .catch(l => {
              Di(l, e, 0);
            });
        if (((e.asyncDep = a), {}.NODE_ENV !== "production" && !e.suspense)) {
          const l = (r = n.name) != null ? r : "Anonymous";
          Z(
            `Component <${l}>: setup function returned a promise, but no <Suspense> boundary was found in the parent component tree. A component with async setup() must be nested in a <Suspense> in order to be rendered.`
          );
        }
      } else id(e, a, t);
    } else nm(e, t);
  }
  function id(e, t, r) {
    be(t)
      ? e.type.__ssrInlineRender
        ? (e.ssrRender = t)
        : (e.render = t)
      : Be(t)
        ? ({}.NODE_ENV !== "production" &&
            _o(t) &&
            Z(
              "setup() should not return VNodes directly - return a render function instead."
            ),
          {}.NODE_ENV !== "production" && (e.devtoolsRawSetupState = t),
          (e.setupState = yg(t)),
          {}.NODE_ENV !== "production" && B$(e))
        : {}.NODE_ENV !== "production" &&
          t !== void 0 &&
          Z(
            `setup() should return an object. Received: ${t === null ? "null" : typeof t}`
          ),
      nm(e, r);
  }
  let Gl;
  const Nb = () => !Gl;
  function nm(e, t, r) {
    const n = e.type;
    if (!e.render) {
      if (!t && Gl && !n.render) {
        const o = n.template || Lc(e).template;
        if (o) {
          ({}).NODE_ENV !== "production" && Sr(e, "compile");
          const { isCustomElement: i, compilerOptions: s } =
              e.appContext.config,
            { delimiters: a, compilerOptions: l } = n,
            c = ot(
              ot(
                {
                  isCustomElement: i,
                  delimiters: a,
                },
                s
              ),
              l
            );
          (n.render = Gl(o, c)),
            {}.NODE_ENV !== "production" && Nr(e, "compile");
        }
      }
      e.render = n.render || dt;
    }
    {
      const o = ji(e);
      hn();
      try {
        K$(e);
      } finally {
        gn(), o();
      }
    }
    ({}).NODE_ENV !== "production" &&
      !n.render &&
      e.render === dt &&
      !t &&
      (n.template
        ? Z(
            'Component provided template option but runtime compilation is not supported in this build of Vue. Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".'
          )
        : Z("Component is missing template or render function."));
  }
  function sd(e) {
    return (
      e.attrsProxy ||
      (e.attrsProxy = new Proxy(
        e.attrs,
        {}.NODE_ENV !== "production"
          ? {
              get(t, r) {
                return Vs(), bt(e, "get", "$attrs"), t[r];
              },
              set() {
                return Z("setupContext.attrs is readonly."), !1;
              },
              deleteProperty() {
                return Z("setupContext.attrs is readonly."), !1;
              },
            }
          : {
              get(t, r) {
                return bt(e, "get", "$attrs"), t[r];
              },
            }
      ))
    );
  }
  function Pb(e) {
    return (
      e.slotsProxy ||
      (e.slotsProxy = new Proxy(e.slots, {
        get(t, r) {
          return bt(e, "get", "$slots"), t[r];
        },
      }))
    );
  }
  function om(e) {
    const t = r => {
      if (
        {}.NODE_ENV !== "production" &&
        (e.exposed && Z("expose() should be called only once per setup()."),
        r != null)
      ) {
        let n = typeof r;
        n === "object" && (he(r) ? (n = "array") : yt(r) && (n = "ref")),
          n !== "object" &&
            Z(`expose() should be passed a plain object, received ${n}.`);
      }
      e.exposed = r || {};
    };
    return {}.NODE_ENV !== "production"
      ? Object.freeze({
          get attrs() {
            return sd(e);
          },
          get slots() {
            return Pb(e);
          },
          get emit() {
            return (r, ...n) => e.emit(r, ...n);
          },
          expose: t,
        })
      : {
          get attrs() {
            return sd(e);
          },
          slots: e.slots,
          emit: e.emit,
          expose: t,
        };
  }
  function ba(e) {
    if (e.exposed)
      return (
        e.exposeProxy ||
        (e.exposeProxy = new Proxy(yg(hg(e.exposed)), {
          get(t, r) {
            if (r in t) return t[r];
            if (r in Fn) return Fn[r](e);
          },
          has(t, r) {
            return r in t || r in Fn;
          },
        }))
      );
  }
  const Cb = /(?:^|[-_])(\w)/g,
    Tb = e => e.replace(Cb, t => t.toUpperCase()).replace(/[-_]/g, "");
  function Bc(e, t = !0) {
    return be(e) ? e.displayName || e.name : e.name || (t && e.__name);
  }
  function wa(e, t, r = !1) {
    let n = Bc(t);
    if (!n && t.__file) {
      const o = t.__file.match(/([^/\\]+)\.\w+$/);
      o && (n = o[1]);
    }
    if (!n && e && e.parent) {
      const o = i => {
        for (const s in i) if (i[s] === t) return s;
      };
      n =
        o(e.components || e.parent.type.components) ||
        o(e.appContext.components);
    }
    return n ? Tb(n) : r ? "App" : "Anonymous";
  }
  function im(e) {
    return be(e) && "__vccOpts" in e;
  }
  const Oe = (e, t) => {
    const r = B_(e, t, $a);
    if ({}.NODE_ENV !== "production") {
      const n = Ur();
      n && n.appContext.config.warnRecursiveComputed && (r._warnRecursive = !0);
    }
    return r;
  };
  function Ns(e, t, r) {
    const n = arguments.length;
    return n === 2
      ? Be(t) && !he(t)
        ? _o(t)
          ? Le(e, null, [t])
          : Le(e, t)
        : Le(e, null, t)
      : (n > 3
          ? (r = Array.prototype.slice.call(arguments, 2))
          : n === 3 && _o(r) && (r = [r]),
        Le(e, t, r));
  }
  function xb() {
    if ({}.NODE_ENV === "production" || typeof window > "u") return;
    const e = { style: "color:#3ba776" },
      t = { style: "color:#1677ff" },
      r = { style: "color:#f5222d" },
      n = { style: "color:#eb2f96" },
      o = {
        header(f) {
          return Be(f)
            ? f.__isVue
              ? ["div", e, "VueInstance"]
              : yt(f)
                ? ["div", {}, ["span", e, u(f)], "<", a(f.value), ">"]
                : Rn(f)
                  ? [
                      "div",
                      {},
                      ["span", e, Mn(f) ? "ShallowReactive" : "Reactive"],
                      "<",
                      a(f),
                      `>${fn(f) ? " (readonly)" : ""}`,
                    ]
                  : fn(f)
                    ? [
                        "div",
                        {},
                        ["span", e, Mn(f) ? "ShallowReadonly" : "Readonly"],
                        "<",
                        a(f),
                        ">",
                      ]
                    : null
            : null;
        },
        hasBody(f) {
          return f && f.__isVue;
        },
        body(f) {
          if (f && f.__isVue) return ["div", {}, ...i(f.$)];
        },
      };
    function i(f) {
      const d = [];
      f.type.props && f.props && d.push(s("props", Ne(f.props))),
        f.setupState !== Ue && d.push(s("setup", f.setupState)),
        f.data !== Ue && d.push(s("data", Ne(f.data)));
      const p = l(f, "computed");
      p && d.push(s("computed", p));
      const h = l(f, "inject");
      return (
        h && d.push(s("injected", h)),
        d.push([
          "div",
          {},
          [
            "span",
            {
              style: n.style + ";opacity:0.66",
            },
            "$ (internal): ",
          ],
          ["object", { object: f }],
        ]),
        d
      );
    }
    function s(f, d) {
      return (
        (d = ot({}, d)),
        Object.keys(d).length
          ? [
              "div",
              { style: "line-height:1.25em;margin-bottom:0.6em" },
              [
                "div",
                {
                  style: "color:#476582",
                },
                f,
              ],
              [
                "div",
                {
                  style: "padding-left:1.25em",
                },
                ...Object.keys(d).map(p => [
                  "div",
                  {},
                  ["span", n, p + ": "],
                  a(d[p], !1),
                ]),
              ],
            ]
          : ["span", {}]
      );
    }
    function a(f, d = !0) {
      return typeof f == "number"
        ? ["span", t, f]
        : typeof f == "string"
          ? ["span", r, JSON.stringify(f)]
          : typeof f == "boolean"
            ? ["span", n, f]
            : Be(f)
              ? ["object", { object: d ? Ne(f) : f }]
              : ["span", r, String(f)];
    }
    function l(f, d) {
      const p = f.type;
      if (be(p)) return;
      const h = {};
      for (const m in f.ctx) c(p, m, d) && (h[m] = f.ctx[m]);
      return h;
    }
    function c(f, d, p) {
      const h = f[p];
      if (
        (he(h) && h.includes(d)) ||
        (Be(h) && d in h) ||
        (f.extends && c(f.extends, d, p)) ||
        (f.mixins && f.mixins.some(m => c(m, d, p)))
      )
        return !0;
    }
    function u(f) {
      return Mn(f) ? "ShallowRef" : f.effect ? "ComputedRef" : "Ref";
    }
    window.devtoolsFormatters
      ? window.devtoolsFormatters.push(o)
      : (window.devtoolsFormatters = [o]);
  }
  const ad = "3.4.21",
    zc = {}.NODE_ENV !== "production" ? Z : dt;
  /**
   * @vue/runtime-dom v3.4.21
   * (c) 2018-present Yuxi (Evan) You and Vue contributors
   * @license MIT
   **/
  const Db = "http://www.w3.org/2000/svg",
    Ib = "http://www.w3.org/1998/Math/MathML",
    nn = typeof document < "u" ? document : null,
    ld = nn && /* @__PURE__ */ nn.createElement("template"),
    Rb = {
      insert: (e, t, r) => {
        t.insertBefore(e, r || null);
      },
      remove: e => {
        const t = e.parentNode;
        t && t.removeChild(e);
      },
      createElement: (e, t, r, n) => {
        const o =
          t === "svg"
            ? nn.createElementNS(Db, e)
            : t === "mathml"
              ? nn.createElementNS(Ib, e)
              : nn.createElement(e, r ? { is: r } : void 0);
        return (
          e === "select" &&
            n &&
            n.multiple != null &&
            o.setAttribute("multiple", n.multiple),
          o
        );
      },
      createText: e => nn.createTextNode(e),
      createComment: e => nn.createComment(e),
      setText: (e, t) => {
        e.nodeValue = t;
      },
      setElementText: (e, t) => {
        e.textContent = t;
      },
      parentNode: e => e.parentNode,
      nextSibling: e => e.nextSibling,
      querySelector: e => nn.querySelector(e),
      setScopeId(e, t) {
        e.setAttribute(t, "");
      },
      // __UNSAFE__
      // Reason: innerHTML.
      // Static content here can only come from compiled templates.
      // As long as the user only uses trusted templates, this is safe.
      insertStaticContent(e, t, r, n, o, i) {
        const s = r ? r.previousSibling : t.lastChild;
        if (o && (o === i || o.nextSibling))
          for (
            ;
            t.insertBefore(o.cloneNode(!0), r),
              !(o === i || !(o = o.nextSibling));

          );
        else {
          ld.innerHTML =
            n === "svg"
              ? `<svg>${e}</svg>`
              : n === "mathml"
                ? `<math>${e}</math>`
                : e;
          const a = ld.content;
          if (n === "svg" || n === "mathml") {
            const l = a.firstChild;
            for (; l.firstChild; ) a.appendChild(l.firstChild);
            a.removeChild(l);
          }
          t.insertBefore(a, r);
        }
        return [
          // first
          s ? s.nextSibling : t.firstChild,
          // last
          r ? r.previousSibling : t.lastChild,
        ];
      },
    },
    Mb = Symbol("_vtc");
  function jb(e, t, r) {
    const n = e[Mb];
    n && (t = (t ? [t, ...n] : [...n]).join(" ")),
      t == null
        ? e.removeAttribute("class")
        : r
          ? e.setAttribute("class", t)
          : (e.className = t);
  }
  const Ws = Symbol("_vod"),
    sm = Symbol("_vsh"),
    am = {
      beforeMount(e, { value: t }, { transition: r }) {
        (e[Ws] = e.style.display === "none" ? "" : e.style.display),
          r && t ? r.beforeEnter(e) : Yo(e, t);
      },
      mounted(e, { value: t }, { transition: r }) {
        r && t && r.enter(e);
      },
      updated(e, { value: t, oldValue: r }, { transition: n }) {
        !t != !r &&
          (n
            ? t
              ? (n.beforeEnter(e), Yo(e, !0), n.enter(e))
              : n.leave(e, () => {
                  Yo(e, !1);
                })
            : Yo(e, t));
      },
      beforeUnmount(e, { value: t }) {
        Yo(e, t);
      },
    };
  ({}).NODE_ENV !== "production" && (am.name = "show");
  function Yo(e, t) {
    (e.style.display = t ? e[Ws] : "none"), (e[sm] = !t);
  }
  const Fb = Symbol({}.NODE_ENV !== "production" ? "CSS_VAR_TEXT" : ""),
    Lb = /(^|;)\s*display\s*:/;
  function Vb(e, t, r) {
    const n = e.style,
      o = nt(r);
    let i = !1;
    if (r && !o) {
      if (t)
        if (nt(t))
          for (const s of t.split(";")) {
            const a = s.slice(0, s.indexOf(":")).trim();
            r[a] == null && Ps(n, a, "");
          }
        else for (const s in t) r[s] == null && Ps(n, s, "");
      for (const s in r) s === "display" && (i = !0), Ps(n, s, r[s]);
    } else if (o) {
      if (t !== r) {
        const s = n[Fb];
        s && (r += ";" + s), (n.cssText = r), (i = Lb.test(r));
      }
    } else t && e.removeAttribute("style");
    Ws in e && ((e[Ws] = i ? n.display : ""), e[sm] && (n.display = "none"));
  }
  const kb = /[^\\];\s*$/,
    cd = /\s*!important$/;
  function Ps(e, t, r) {
    if (he(r)) r.forEach(n => Ps(e, t, n));
    else if (
      (r == null && (r = ""),
      {}.NODE_ENV !== "production" &&
        kb.test(r) &&
        zc(`Unexpected semicolon at the end of '${t}' style value: '${r}'`),
      t.startsWith("--"))
    )
      e.setProperty(t, r);
    else {
      const n = Bb(e, t);
      cd.test(r)
        ? e.setProperty(Bt(n), r.replace(cd, ""), "important")
        : (e[n] = r);
    }
  }
  const ud = ["Webkit", "Moz", "ms"],
    nl = {};
  function Bb(e, t) {
    const r = nl[t];
    if (r) return r;
    let n = Ct(t);
    if (n !== "filter" && n in e) return (nl[t] = n);
    n = Vn(n);
    for (let o = 0; o < ud.length; o++) {
      const i = ud[o] + n;
      if (i in e) return (nl[t] = i);
    }
    return t;
  }
  const fd = "http://www.w3.org/1999/xlink";
  function zb(e, t, r, n, o) {
    if (n && t.startsWith("xlink:"))
      r == null
        ? e.removeAttributeNS(fd, t.slice(6, t.length))
        : e.setAttributeNS(fd, t, r);
    else {
      const i = v_(t);
      r == null || (i && !Yh(r))
        ? e.removeAttribute(t)
        : e.setAttribute(t, i ? "" : r);
    }
  }
  function Ub(e, t, r, n, o, i, s) {
    if (t === "innerHTML" || t === "textContent") {
      n && s(n, o, i), (e[t] = r ?? "");
      return;
    }
    const a = e.tagName;
    if (
      t === "value" &&
      a !== "PROGRESS" && // custom elements may use _value internally
      !a.includes("-")
    ) {
      const c = a === "OPTION" ? e.getAttribute("value") || "" : e.value,
        u = r ?? "";
      (c !== u || !("_value" in e)) && (e.value = u),
        r == null && e.removeAttribute(t),
        (e._value = r);
      return;
    }
    let l = !1;
    if (r === "" || r == null) {
      const c = typeof e[t];
      c === "boolean"
        ? (r = Yh(r))
        : r == null && c === "string"
          ? ((r = ""), (l = !0))
          : c === "number" && ((r = 0), (l = !0));
    }
    try {
      e[t] = r;
    } catch (c) {
      ({}).NODE_ENV !== "production" &&
        !l &&
        zc(
          `Failed setting prop "${t}" on <${a.toLowerCase()}>: value ${r} is invalid.`,
          c
        );
    }
    l && e.removeAttribute(t);
  }
  function Wb(e, t, r, n) {
    e.addEventListener(t, r, n);
  }
  function Hb(e, t, r, n) {
    e.removeEventListener(t, r, n);
  }
  const dd = Symbol("_vei");
  function Kb(e, t, r, n, o = null) {
    const i = e[dd] || (e[dd] = {}),
      s = i[t];
    if (n && s) s.value = n;
    else {
      const [a, l] = Gb(t);
      if (n) {
        const c = (i[t] = Jb(n, o));
        Wb(e, a, c, l);
      } else s && (Hb(e, a, s, l), (i[t] = void 0));
    }
  }
  const pd = /(?:Once|Passive|Capture)$/;
  function Gb(e) {
    let t;
    if (pd.test(e)) {
      t = {};
      let n;
      for (; (n = e.match(pd)); )
        (e = e.slice(0, e.length - n[0].length)), (t[n[0].toLowerCase()] = !0);
    }
    return [e[2] === ":" ? e.slice(3) : Bt(e.slice(2)), t];
  }
  let ol = 0;
  const qb = /* @__PURE__ */ Promise.resolve(),
    Yb = () => ol || (qb.then(() => (ol = 0)), (ol = Date.now()));
  function Jb(e, t) {
    const r = n => {
      if (!n._vts) n._vts = Date.now();
      else if (n._vts <= r.attached) return;
      ir(Xb(n, r.value), t, 5, [n]);
    };
    return (r.value = e), (r.attached = Yb()), r;
  }
  function Xb(e, t) {
    if (he(t)) {
      const r = e.stopImmediatePropagation;
      return (
        (e.stopImmediatePropagation = () => {
          r.call(e), (e._stopped = !0);
        }),
        t.map(n => o => !o._stopped && n && n(o))
      );
    } else return t;
  }
  const hd = e =>
      e.charCodeAt(0) === 111 &&
      e.charCodeAt(1) === 110 && // lowercase letter
      e.charCodeAt(2) > 96 &&
      e.charCodeAt(2) < 123,
    Zb = (e, t, r, n, o, i, s, a, l) => {
      const c = o === "svg";
      t === "class"
        ? jb(e, n, c)
        : t === "style"
          ? Vb(e, r, n)
          : Ti(t)
            ? Rs(t) || Kb(e, t, r, n, s)
            : (
                  t[0] === "."
                    ? ((t = t.slice(1)), !0)
                    : t[0] === "^"
                      ? ((t = t.slice(1)), !1)
                      : Qb(e, t, n, c)
                )
              ? Ub(e, t, n, i, s, a, l)
              : (t === "true-value"
                  ? (e._trueValue = n)
                  : t === "false-value" && (e._falseValue = n),
                zb(e, t, n, c));
    };
  function Qb(e, t, r, n) {
    if (n)
      return !!(
        t === "innerHTML" ||
        t === "textContent" ||
        (t in e && hd(t) && be(r))
      );
    if (
      t === "spellcheck" ||
      t === "draggable" ||
      t === "translate" ||
      t === "form" ||
      (t === "list" && e.tagName === "INPUT") ||
      (t === "type" && e.tagName === "TEXTAREA")
    )
      return !1;
    if (t === "width" || t === "height") {
      const o = e.tagName;
      if (o === "IMG" || o === "VIDEO" || o === "CANVAS" || o === "SOURCE")
        return !1;
    }
    return hd(t) && nt(r) ? !1 : t in e;
  }
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function Fi(e, t) {
    const r = /* @__PURE__ */ ge(e);
    class n extends Uc {
      constructor(i) {
        super(r, i, t);
      }
    }
    return (n.def = r), n;
  }
  const e0 = typeof HTMLElement < "u" ? HTMLElement : class {};
  class Uc extends e0 {
    constructor(t, r = {}, n) {
      super(),
        (this._def = t),
        (this._props = r),
        (this._instance = null),
        (this._connected = !1),
        (this._resolved = !1),
        (this._numberProps = null),
        (this._ob = null),
        this.shadowRoot && n
          ? n(this._createVNode(), this.shadowRoot)
          : ({}.NODE_ENV !== "production" &&
              this.shadowRoot &&
              zc(
                "Custom element has pre-rendered declarative shadow root but is not defined as hydratable. Use `defineSSRCustomElement`."
              ),
            this.attachShadow({ mode: "open" }),
            this._def.__asyncLoader || this._resolveProps(this._def));
    }
    connectedCallback() {
      (this._connected = !0),
        this._instance ||
          (this._resolved ? this._update() : this._resolveDef());
    }
    disconnectedCallback() {
      (this._connected = !1),
        this._ob && (this._ob.disconnect(), (this._ob = null)),
        mn(() => {
          this._connected ||
            (md(null, this.shadowRoot), (this._instance = null));
        });
    }
    /**
     * resolve inner component definition (handle possible async component)
     */
    _resolveDef() {
      this._resolved = !0;
      for (let n = 0; n < this.attributes.length; n++)
        this._setAttr(this.attributes[n].name);
      (this._ob = new MutationObserver(n => {
        for (const o of n) this._setAttr(o.attributeName);
      })),
        this._ob.observe(this, { attributes: !0 });
      const t = (n, o = !1) => {
          const { props: i, styles: s } = n;
          let a;
          if (i && !he(i))
            for (const l in i) {
              const c = i[l];
              (c === Number || (c && c.type === Number)) &&
                (l in this._props && (this._props[l] = If(this._props[l])),
                ((a || (a = /* @__PURE__ */ Object.create(null)))[Ct(l)] = !0));
            }
          (this._numberProps = a),
            o && this._resolveProps(n),
            this._applyStyles(s),
            this._update();
        },
        r = this._def.__asyncLoader;
      r ? r().then(n => t(n, !0)) : t(this._def);
    }
    _resolveProps(t) {
      const { props: r } = t,
        n = he(r) ? r : Object.keys(r || {});
      for (const o of Object.keys(this))
        o[0] !== "_" && n.includes(o) && this._setProp(o, this[o], !0, !1);
      for (const o of n.map(Ct))
        Object.defineProperty(this, o, {
          get() {
            return this._getProp(o);
          },
          set(i) {
            this._setProp(o, i);
          },
        });
    }
    _setAttr(t) {
      let r = this.getAttribute(t);
      const n = Ct(t);
      this._numberProps && this._numberProps[n] && (r = If(r)),
        this._setProp(n, r, !1);
    }
    /**
     * @internal
     */
    _getProp(t) {
      return this._props[t];
    }
    /**
     * @internal
     */
    _setProp(t, r, n = !0, o = !0) {
      r !== this._props[t] &&
        ((this._props[t] = r),
        o && this._instance && this._update(),
        n &&
          (r === !0
            ? this.setAttribute(Bt(t), "")
            : typeof r == "string" || typeof r == "number"
              ? this.setAttribute(Bt(t), r + "")
              : r || this.removeAttribute(Bt(t))));
    }
    _update() {
      md(this._createVNode(), this.shadowRoot);
    }
    _createVNode() {
      const t = Le(this._def, ot({}, this._props));
      return (
        this._instance ||
          (t.ce = r => {
            (this._instance = r),
              (r.isCE = !0),
              {}.NODE_ENV !== "production" &&
                (r.ceReload = i => {
                  this._styles &&
                    (this._styles.forEach(s => this.shadowRoot.removeChild(s)),
                    (this._styles.length = 0)),
                    this._applyStyles(i),
                    (this._instance = null),
                    this._update();
                });
            const n = (i, s) => {
              this.dispatchEvent(
                new CustomEvent(i, {
                  detail: s,
                })
              );
            };
            r.emit = (i, ...s) => {
              n(i, s), Bt(i) !== i && n(Bt(i), s);
            };
            let o = this;
            for (; (o = o && (o.parentNode || o.host)); )
              if (o instanceof Uc) {
                (r.parent = o._instance), (r.provides = o._instance.provides);
                break;
              }
          }),
        t
      );
    }
    _applyStyles(t) {
      t &&
        t.forEach(r => {
          const n = document.createElement("style");
          (n.textContent = r),
            this.shadowRoot.appendChild(n),
            {}.NODE_ENV !== "production" &&
              (this._styles || (this._styles = [])).push(n);
        });
    }
  }
  const t0 = ["ctrl", "shift", "alt", "meta"],
    r0 = {
      stop: e => e.stopPropagation(),
      prevent: e => e.preventDefault(),
      self: e => e.target !== e.currentTarget,
      ctrl: e => !e.ctrlKey,
      shift: e => !e.shiftKey,
      alt: e => !e.altKey,
      meta: e => !e.metaKey,
      left: e => "button" in e && e.button !== 0,
      middle: e => "button" in e && e.button !== 1,
      right: e => "button" in e && e.button !== 2,
      exact: (e, t) => t0.some(r => e[`${r}Key`] && !t.includes(r)),
    },
    n0 = (e, t) => {
      const r = e._withMods || (e._withMods = {}),
        n = t.join(".");
      return (
        r[n] ||
        (r[n] = (o, ...i) => {
          for (let s = 0; s < t.length; s++) {
            const a = r0[t[s]];
            if (a && a(o, t)) return;
          }
          return e(o, ...i);
        })
      );
    },
    o0 = /* @__PURE__ */ ot({ patchProp: Zb }, Rb);
  let gd;
  function i0() {
    return gd || (gd = fb(o0));
  }
  const md = (...e) => {
    i0().render(...e);
  };
  /**
   * vue v3.4.21
   * (c) 2018-present Yuxi (Evan) You and Vue contributors
   * @license MIT
   **/
  function s0() {
    xb();
  }
  ({}).NODE_ENV !== "production" && s0();
  const a0 = ["top", "right", "bottom", "left"],
    dn = Math.min,
    kt = Math.max,
    Hs = Math.round,
    fs = Math.floor,
    pn = e => ({
      x: e,
      y: e,
    }),
    l0 = {
      left: "right",
      right: "left",
      bottom: "top",
      top: "bottom",
    },
    c0 = {
      start: "end",
      end: "start",
    };
  function ql(e, t, r) {
    return kt(e, dn(t, r));
  }
  function Fr(e, t) {
    return typeof e == "function" ? e(t) : e;
  }
  function Lr(e) {
    return e.split("-")[0];
  }
  function Co(e) {
    return e.split("-")[1];
  }
  function Wc(e) {
    return e === "x" ? "y" : "x";
  }
  function Hc(e) {
    return e === "y" ? "height" : "width";
  }
  function To(e) {
    return ["top", "bottom"].includes(Lr(e)) ? "y" : "x";
  }
  function Kc(e) {
    return Wc(To(e));
  }
  function u0(e, t, r) {
    r === void 0 && (r = !1);
    const n = Co(e),
      o = Kc(e),
      i = Hc(o);
    let s =
      o === "x"
        ? n === (r ? "end" : "start")
          ? "right"
          : "left"
        : n === "start"
          ? "bottom"
          : "top";
    return t.reference[i] > t.floating[i] && (s = Ks(s)), [s, Ks(s)];
  }
  function f0(e) {
    const t = Ks(e);
    return [Yl(e), t, Yl(t)];
  }
  function Yl(e) {
    return e.replace(/start|end/g, t => c0[t]);
  }
  function d0(e, t, r) {
    const n = ["left", "right"],
      o = ["right", "left"],
      i = ["top", "bottom"],
      s = ["bottom", "top"];
    switch (e) {
      case "top":
      case "bottom":
        return r ? (t ? o : n) : t ? n : o;
      case "left":
      case "right":
        return t ? i : s;
      default:
        return [];
    }
  }
  function p0(e, t, r, n) {
    const o = Co(e);
    let i = d0(Lr(e), r === "start", n);
    return (
      o && ((i = i.map(s => s + "-" + o)), t && (i = i.concat(i.map(Yl)))), i
    );
  }
  function Ks(e) {
    return e.replace(/left|right|bottom|top/g, t => l0[t]);
  }
  function h0(e) {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...e,
    };
  }
  function lm(e) {
    return typeof e != "number"
      ? h0(e)
      : {
          top: e,
          right: e,
          bottom: e,
          left: e,
        };
  }
  function Gs(e) {
    return {
      ...e,
      top: e.y,
      left: e.x,
      right: e.x + e.width,
      bottom: e.y + e.height,
    };
  }
  function vd(e, t, r) {
    let { reference: n, floating: o } = e;
    const i = To(t),
      s = Kc(t),
      a = Hc(s),
      l = Lr(t),
      c = i === "y",
      u = n.x + n.width / 2 - o.width / 2,
      f = n.y + n.height / 2 - o.height / 2,
      d = n[a] / 2 - o[a] / 2;
    let p;
    switch (l) {
      case "top":
        p = {
          x: u,
          y: n.y - o.height,
        };
        break;
      case "bottom":
        p = {
          x: u,
          y: n.y + n.height,
        };
        break;
      case "right":
        p = {
          x: n.x + n.width,
          y: f,
        };
        break;
      case "left":
        p = {
          x: n.x - o.width,
          y: f,
        };
        break;
      default:
        p = {
          x: n.x,
          y: n.y,
        };
    }
    switch (Co(t)) {
      case "start":
        p[s] -= d * (r && c ? -1 : 1);
        break;
      case "end":
        p[s] += d * (r && c ? -1 : 1);
        break;
    }
    return p;
  }
  const g0 = async (e, t, r) => {
    const {
        placement: n = "bottom",
        strategy: o = "absolute",
        middleware: i = [],
        platform: s,
      } = r,
      a = i.filter(Boolean),
      l = await (s.isRTL == null ? void 0 : s.isRTL(t));
    let c = await s.getElementRects({
        reference: e,
        floating: t,
        strategy: o,
      }),
      { x: u, y: f } = vd(c, n, l),
      d = n,
      p = {},
      h = 0;
    for (let m = 0; m < a.length; m++) {
      const { name: v, fn: g } = a[m],
        {
          x: _,
          y: E,
          data: A,
          reset: D,
        } = await g({
          x: u,
          y: f,
          initialPlacement: n,
          placement: d,
          strategy: o,
          middlewareData: p,
          rects: c,
          platform: s,
          elements: {
            reference: e,
            floating: t,
          },
        });
      (u = _ ?? u),
        (f = E ?? f),
        (p = {
          ...p,
          [v]: {
            ...p[v],
            ...A,
          },
        }),
        D &&
          h <= 50 &&
          (h++,
          typeof D == "object" &&
            (D.placement && (d = D.placement),
            D.rects &&
              (c =
                D.rects === !0
                  ? await s.getElementRects({
                      reference: e,
                      floating: t,
                      strategy: o,
                    })
                  : D.rects),
            ({ x: u, y: f } = vd(c, d, l))),
          (m = -1));
    }
    return {
      x: u,
      y: f,
      placement: d,
      strategy: o,
      middlewareData: p,
    };
  };
  async function Si(e, t) {
    var r;
    t === void 0 && (t = {});
    const { x: n, y: o, platform: i, rects: s, elements: a, strategy: l } = e,
      {
        boundary: c = "clippingAncestors",
        rootBoundary: u = "viewport",
        elementContext: f = "floating",
        altBoundary: d = !1,
        padding: p = 0,
      } = Fr(t, e),
      h = lm(p),
      v = a[d ? (f === "floating" ? "reference" : "floating") : f],
      g = Gs(
        await i.getClippingRect({
          element:
            (r = await (i.isElement == null ? void 0 : i.isElement(v))) ==
              null || r
              ? v
              : v.contextElement ||
                (await (i.getDocumentElement == null
                  ? void 0
                  : i.getDocumentElement(a.floating))),
          boundary: c,
          rootBoundary: u,
          strategy: l,
        })
      ),
      _ =
        f === "floating"
          ? {
              ...s.floating,
              x: n,
              y: o,
            }
          : s.reference,
      E = await (i.getOffsetParent == null
        ? void 0
        : i.getOffsetParent(a.floating)),
      A = (await (i.isElement == null ? void 0 : i.isElement(E)))
        ? (await (i.getScale == null ? void 0 : i.getScale(E))) || {
            x: 1,
            y: 1,
          }
        : {
            x: 1,
            y: 1,
          },
      D = Gs(
        i.convertOffsetParentRelativeRectToViewportRelativeRect
          ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
              elements: a,
              rect: _,
              offsetParent: E,
              strategy: l,
            })
          : _
      );
    return {
      top: (g.top - D.top + h.top) / A.y,
      bottom: (D.bottom - g.bottom + h.bottom) / A.y,
      left: (g.left - D.left + h.left) / A.x,
      right: (D.right - g.right + h.right) / A.x,
    };
  }
  const m0 = e => ({
      name: "arrow",
      options: e,
      async fn(t) {
        const {
            x: r,
            y: n,
            placement: o,
            rects: i,
            platform: s,
            elements: a,
            middlewareData: l,
          } = t,
          { element: c, padding: u = 0 } = Fr(e, t) || {};
        if (c == null) return {};
        const f = lm(u),
          d = {
            x: r,
            y: n,
          },
          p = Kc(o),
          h = Hc(p),
          m = await s.getDimensions(c),
          v = p === "y",
          g = v ? "top" : "left",
          _ = v ? "bottom" : "right",
          E = v ? "clientHeight" : "clientWidth",
          A = i.reference[h] + i.reference[p] - d[p] - i.floating[h],
          D = d[p] - i.reference[p],
          S = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(c));
        let O = S ? S[E] : 0;
        (!O || !(await (s.isElement == null ? void 0 : s.isElement(S)))) &&
          (O = a.floating[E] || i.floating[h]);
        const j = A / 2 - D / 2,
          B = O / 2 - m[h] / 2 - 1,
          W = dn(f[g], B),
          re = dn(f[_], B),
          G = W,
          Se = O - m[h] - re,
          ce = O / 2 - m[h] / 2 + j,
          Pe = ql(G, ce, Se),
          _e =
            !l.arrow &&
            Co(o) != null &&
            ce !== Pe &&
            i.reference[h] / 2 - (ce < G ? W : re) - m[h] / 2 < 0,
          ae = _e ? (ce < G ? ce - G : ce - Se) : 0;
        return {
          [p]: d[p] + ae,
          data: {
            [p]: Pe,
            centerOffset: ce - Pe - ae,
            ...(_e && {
              alignmentOffset: ae,
            }),
          },
          reset: _e,
        };
      },
    }),
    v0 = function (e) {
      return (
        e === void 0 && (e = {}),
        {
          name: "flip",
          options: e,
          async fn(t) {
            var r, n;
            const {
                placement: o,
                middlewareData: i,
                rects: s,
                initialPlacement: a,
                platform: l,
                elements: c,
              } = t,
              {
                mainAxis: u = !0,
                crossAxis: f = !0,
                fallbackPlacements: d,
                fallbackStrategy: p = "bestFit",
                fallbackAxisSideDirection: h = "none",
                flipAlignment: m = !0,
                ...v
              } = Fr(e, t);
            if ((r = i.arrow) != null && r.alignmentOffset) return {};
            const g = Lr(o),
              _ = Lr(a) === a,
              E = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)),
              A = d || (_ || !m ? [Ks(a)] : f0(a));
            !d && h !== "none" && A.push(...p0(a, m, h, E));
            const D = [a, ...A],
              S = await Si(t, v),
              O = [];
            let j = ((n = i.flip) == null ? void 0 : n.overflows) || [];
            if ((u && O.push(S[g]), f)) {
              const G = u0(o, s, E);
              O.push(S[G[0]], S[G[1]]);
            }
            if (
              ((j = [
                ...j,
                {
                  placement: o,
                  overflows: O,
                },
              ]),
              !O.every(G => G <= 0))
            ) {
              var B, W;
              const G = (((B = i.flip) == null ? void 0 : B.index) || 0) + 1,
                Se = D[G];
              if (Se)
                return {
                  data: {
                    index: G,
                    overflows: j,
                  },
                  reset: {
                    placement: Se,
                  },
                };
              let ce =
                (W = j
                  .filter(Pe => Pe.overflows[0] <= 0)
                  .sort((Pe, _e) => Pe.overflows[1] - _e.overflows[1])[0]) ==
                null
                  ? void 0
                  : W.placement;
              if (!ce)
                switch (p) {
                  case "bestFit": {
                    var re;
                    const Pe =
                      (re = j
                        .map(_e => [
                          _e.placement,
                          _e.overflows
                            .filter(ae => ae > 0)
                            .reduce((ae, me) => ae + me, 0),
                        ])
                        .sort((_e, ae) => _e[1] - ae[1])[0]) == null
                        ? void 0
                        : re[0];
                    Pe && (ce = Pe);
                    break;
                  }
                  case "initialPlacement":
                    ce = a;
                    break;
                }
              if (o !== ce)
                return {
                  reset: {
                    placement: ce,
                  },
                };
            }
            return {};
          },
        }
      );
    };
  function yd(e, t) {
    return {
      top: e.top - t.height,
      right: e.right - t.width,
      bottom: e.bottom - t.height,
      left: e.left - t.width,
    };
  }
  function _d(e) {
    return a0.some(t => e[t] >= 0);
  }
  const y0 = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: "hide",
        options: e,
        async fn(t) {
          const { rects: r } = t,
            { strategy: n = "referenceHidden", ...o } = Fr(e, t);
          switch (n) {
            case "referenceHidden": {
              const i = await Si(t, {
                  ...o,
                  elementContext: "reference",
                }),
                s = yd(i, r.reference);
              return {
                data: {
                  referenceHiddenOffsets: s,
                  referenceHidden: _d(s),
                },
              };
            }
            case "escaped": {
              const i = await Si(t, {
                  ...o,
                  altBoundary: !0,
                }),
                s = yd(i, r.floating);
              return {
                data: {
                  escapedOffsets: s,
                  escaped: _d(s),
                },
              };
            }
            default:
              return {};
          }
        },
      }
    );
  };
  async function _0(e, t) {
    const { placement: r, platform: n, elements: o } = e,
      i = await (n.isRTL == null ? void 0 : n.isRTL(o.floating)),
      s = Lr(r),
      a = Co(r),
      l = To(r) === "y",
      c = ["left", "top"].includes(s) ? -1 : 1,
      u = i && l ? -1 : 1,
      f = Fr(t, e);
    let {
      mainAxis: d,
      crossAxis: p,
      alignmentAxis: h,
    } = typeof f == "number"
      ? {
          mainAxis: f,
          crossAxis: 0,
          alignmentAxis: null,
        }
      : {
          mainAxis: 0,
          crossAxis: 0,
          alignmentAxis: null,
          ...f,
        };
    return (
      a && typeof h == "number" && (p = a === "end" ? h * -1 : h),
      l
        ? {
            x: p * u,
            y: d * c,
          }
        : {
            x: d * c,
            y: p * u,
          }
    );
  }
  const $0 = function (e) {
      return (
        e === void 0 && (e = 0),
        {
          name: "offset",
          options: e,
          async fn(t) {
            var r, n;
            const { x: o, y: i, placement: s, middlewareData: a } = t,
              l = await _0(t, e);
            return s === ((r = a.offset) == null ? void 0 : r.placement) &&
              (n = a.arrow) != null &&
              n.alignmentOffset
              ? {}
              : {
                  x: o + l.x,
                  y: i + l.y,
                  data: {
                    ...l,
                    placement: s,
                  },
                };
          },
        }
      );
    },
    b0 = function (e) {
      return (
        e === void 0 && (e = {}),
        {
          name: "shift",
          options: e,
          async fn(t) {
            const { x: r, y: n, placement: o } = t,
              {
                mainAxis: i = !0,
                crossAxis: s = !1,
                limiter: a = {
                  fn: v => {
                    let { x: g, y: _ } = v;
                    return {
                      x: g,
                      y: _,
                    };
                  },
                },
                ...l
              } = Fr(e, t),
              c = {
                x: r,
                y: n,
              },
              u = await Si(t, l),
              f = To(Lr(o)),
              d = Wc(f);
            let p = c[d],
              h = c[f];
            if (i) {
              const v = d === "y" ? "top" : "left",
                g = d === "y" ? "bottom" : "right",
                _ = p + u[v],
                E = p - u[g];
              p = ql(_, p, E);
            }
            if (s) {
              const v = f === "y" ? "top" : "left",
                g = f === "y" ? "bottom" : "right",
                _ = h + u[v],
                E = h - u[g];
              h = ql(_, h, E);
            }
            const m = a.fn({
              ...t,
              [d]: p,
              [f]: h,
            });
            return {
              ...m,
              data: {
                x: m.x - r,
                y: m.y - n,
              },
            };
          },
        }
      );
    },
    w0 = function (e) {
      return (
        e === void 0 && (e = {}),
        {
          options: e,
          fn(t) {
            const { x: r, y: n, placement: o, rects: i, middlewareData: s } = t,
              { offset: a = 0, mainAxis: l = !0, crossAxis: c = !0 } = Fr(e, t),
              u = {
                x: r,
                y: n,
              },
              f = To(o),
              d = Wc(f);
            let p = u[d],
              h = u[f];
            const m = Fr(a, t),
              v =
                typeof m == "number"
                  ? {
                      mainAxis: m,
                      crossAxis: 0,
                    }
                  : {
                      mainAxis: 0,
                      crossAxis: 0,
                      ...m,
                    };
            if (l) {
              const E = d === "y" ? "height" : "width",
                A = i.reference[d] - i.floating[E] + v.mainAxis,
                D = i.reference[d] + i.reference[E] - v.mainAxis;
              p < A ? (p = A) : p > D && (p = D);
            }
            if (c) {
              var g, _;
              const E = d === "y" ? "width" : "height",
                A = ["top", "left"].includes(Lr(o)),
                D =
                  i.reference[f] -
                  i.floating[E] +
                  ((A && ((g = s.offset) == null ? void 0 : g[f])) || 0) +
                  (A ? 0 : v.crossAxis),
                S =
                  i.reference[f] +
                  i.reference[E] +
                  (A ? 0 : ((_ = s.offset) == null ? void 0 : _[f]) || 0) -
                  (A ? v.crossAxis : 0);
              h < D ? (h = D) : h > S && (h = S);
            }
            return {
              [d]: p,
              [f]: h,
            };
          },
        }
      );
    },
    E0 = function (e) {
      return (
        e === void 0 && (e = {}),
        {
          name: "size",
          options: e,
          async fn(t) {
            const { placement: r, rects: n, platform: o, elements: i } = t,
              { apply: s = () => {}, ...a } = Fr(e, t),
              l = await Si(t, a),
              c = Lr(r),
              u = Co(r),
              f = To(r) === "y",
              { width: d, height: p } = n.floating;
            let h, m;
            c === "top" || c === "bottom"
              ? ((h = c),
                (m =
                  u ===
                  ((await (o.isRTL == null ? void 0 : o.isRTL(i.floating)))
                    ? "start"
                    : "end")
                    ? "left"
                    : "right"))
              : ((m = c), (h = u === "end" ? "top" : "bottom"));
            const v = p - l[h],
              g = d - l[m],
              _ = !t.middlewareData.shift;
            let E = v,
              A = g;
            if (f) {
              const S = d - l.left - l.right;
              A = u || _ ? dn(g, S) : S;
            } else {
              const S = p - l.top - l.bottom;
              E = u || _ ? dn(v, S) : S;
            }
            if (_ && !u) {
              const S = kt(l.left, 0),
                O = kt(l.right, 0),
                j = kt(l.top, 0),
                B = kt(l.bottom, 0);
              f
                ? (A =
                    d - 2 * (S !== 0 || O !== 0 ? S + O : kt(l.left, l.right)))
                : (E =
                    p - 2 * (j !== 0 || B !== 0 ? j + B : kt(l.top, l.bottom)));
            }
            await s({
              ...t,
              availableWidth: A,
              availableHeight: E,
            });
            const D = await o.getDimensions(i.floating);
            return d !== D.width || p !== D.height
              ? {
                  reset: {
                    rects: !0,
                  },
                }
              : {};
          },
        }
      );
    };
  function Vr(e) {
    return Gc(e) ? (e.nodeName || "").toLowerCase() : "#document";
  }
  function zt(e) {
    var t;
    return (
      (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) ||
      window
    );
  }
  function Wr(e) {
    var t;
    return (t = (Gc(e) ? e.ownerDocument : e.document) || window.document) ==
      null
      ? void 0
      : t.documentElement;
  }
  function Gc(e) {
    return e instanceof Node || e instanceof zt(e).Node;
  }
  function kr(e) {
    return e instanceof Element || e instanceof zt(e).Element;
  }
  function $r(e) {
    return e instanceof HTMLElement || e instanceof zt(e).HTMLElement;
  }
  function $d(e) {
    return typeof ShadowRoot > "u"
      ? !1
      : e instanceof ShadowRoot || e instanceof zt(e).ShadowRoot;
  }
  function Li(e) {
    const { overflow: t, overflowX: r, overflowY: n, display: o } = Xt(e);
    return (
      /auto|scroll|overlay|hidden|clip/.test(t + n + r) &&
      !["inline", "contents"].includes(o)
    );
  }
  function O0(e) {
    return ["table", "td", "th"].includes(Vr(e));
  }
  function qc(e) {
    const t = Yc(),
      r = Xt(e);
    return (
      r.transform !== "none" ||
      r.perspective !== "none" ||
      (r.containerType ? r.containerType !== "normal" : !1) ||
      (!t && (r.backdropFilter ? r.backdropFilter !== "none" : !1)) ||
      (!t && (r.filter ? r.filter !== "none" : !1)) ||
      ["transform", "perspective", "filter"].some(n =>
        (r.willChange || "").includes(n)
      ) ||
      ["paint", "layout", "strict", "content"].some(n =>
        (r.contain || "").includes(n)
      )
    );
  }
  function A0(e) {
    let t = bo(e);
    for (; $r(t) && !Ea(t); ) {
      if (qc(t)) return t;
      t = bo(t);
    }
    return null;
  }
  function Yc() {
    return typeof CSS > "u" || !CSS.supports
      ? !1
      : CSS.supports("-webkit-backdrop-filter", "none");
  }
  function Ea(e) {
    return ["html", "body", "#document"].includes(Vr(e));
  }
  function Xt(e) {
    return zt(e).getComputedStyle(e);
  }
  function Oa(e) {
    return kr(e)
      ? {
          scrollLeft: e.scrollLeft,
          scrollTop: e.scrollTop,
        }
      : {
          scrollLeft: e.pageXOffset,
          scrollTop: e.pageYOffset,
        };
  }
  function bo(e) {
    if (Vr(e) === "html") return e;
    const t =
      // Step into the shadow DOM of the parent of a slotted node.
      e.assignedSlot || // DOM Element detected.
      e.parentNode || // ShadowRoot detected.
      ($d(e) && e.host) || // Fallback.
      Wr(e);
    return $d(t) ? t.host : t;
  }
  function cm(e) {
    const t = bo(e);
    return Ea(t)
      ? e.ownerDocument
        ? e.ownerDocument.body
        : e.body
      : $r(t) && Li(t)
        ? t
        : cm(t);
  }
  function Ni(e, t, r) {
    var n;
    t === void 0 && (t = []), r === void 0 && (r = !0);
    const o = cm(e),
      i = o === ((n = e.ownerDocument) == null ? void 0 : n.body),
      s = zt(o);
    return i
      ? t.concat(
          s,
          s.visualViewport || [],
          Li(o) ? o : [],
          s.frameElement && r ? Ni(s.frameElement) : []
        )
      : t.concat(o, Ni(o, [], r));
  }
  function um(e) {
    const t = Xt(e);
    let r = parseFloat(t.width) || 0,
      n = parseFloat(t.height) || 0;
    const o = $r(e),
      i = o ? e.offsetWidth : r,
      s = o ? e.offsetHeight : n,
      a = Hs(r) !== i || Hs(n) !== s;
    return (
      a && ((r = i), (n = s)),
      {
        width: r,
        height: n,
        $: a,
      }
    );
  }
  function Jc(e) {
    return kr(e) ? e : e.contextElement;
  }
  function vo(e) {
    const t = Jc(e);
    if (!$r(t)) return pn(1);
    const r = t.getBoundingClientRect(),
      { width: n, height: o, $: i } = um(t);
    let s = (i ? Hs(r.width) : r.width) / n,
      a = (i ? Hs(r.height) : r.height) / o;
    return (
      (!s || !Number.isFinite(s)) && (s = 1),
      (!a || !Number.isFinite(a)) && (a = 1),
      {
        x: s,
        y: a,
      }
    );
  }
  const S0 = /* @__PURE__ */ pn(0);
  function fm(e) {
    const t = zt(e);
    return !Yc() || !t.visualViewport
      ? S0
      : {
          x: t.visualViewport.offsetLeft,
          y: t.visualViewport.offsetTop,
        };
  }
  function N0(e, t, r) {
    return t === void 0 && (t = !1), !r || (t && r !== zt(e)) ? !1 : t;
  }
  function zn(e, t, r, n) {
    t === void 0 && (t = !1), r === void 0 && (r = !1);
    const o = e.getBoundingClientRect(),
      i = Jc(e);
    let s = pn(1);
    t && (n ? kr(n) && (s = vo(n)) : (s = vo(e)));
    const a = N0(i, r, n) ? fm(i) : pn(0);
    let l = (o.left + a.x) / s.x,
      c = (o.top + a.y) / s.y,
      u = o.width / s.x,
      f = o.height / s.y;
    if (i) {
      const d = zt(i),
        p = n && kr(n) ? zt(n) : n;
      let h = d,
        m = h.frameElement;
      for (; m && n && p !== h; ) {
        const v = vo(m),
          g = m.getBoundingClientRect(),
          _ = Xt(m),
          E = g.left + (m.clientLeft + parseFloat(_.paddingLeft)) * v.x,
          A = g.top + (m.clientTop + parseFloat(_.paddingTop)) * v.y;
        (l *= v.x),
          (c *= v.y),
          (u *= v.x),
          (f *= v.y),
          (l += E),
          (c += A),
          (h = zt(m)),
          (m = h.frameElement);
      }
    }
    return Gs({
      width: u,
      height: f,
      x: l,
      y: c,
    });
  }
  const P0 = [":popover-open", ":modal"];
  function dm(e) {
    return P0.some(t => {
      try {
        return e.matches(t);
      } catch {
        return !1;
      }
    });
  }
  function C0(e) {
    let { elements: t, rect: r, offsetParent: n, strategy: o } = e;
    const i = o === "fixed",
      s = Wr(n),
      a = t ? dm(t.floating) : !1;
    if (n === s || (a && i)) return r;
    let l = {
        scrollLeft: 0,
        scrollTop: 0,
      },
      c = pn(1);
    const u = pn(0),
      f = $r(n);
    if (
      (f || (!f && !i)) &&
      ((Vr(n) !== "body" || Li(s)) && (l = Oa(n)), $r(n))
    ) {
      const d = zn(n);
      (c = vo(n)), (u.x = d.x + n.clientLeft), (u.y = d.y + n.clientTop);
    }
    return {
      width: r.width * c.x,
      height: r.height * c.y,
      x: r.x * c.x - l.scrollLeft * c.x + u.x,
      y: r.y * c.y - l.scrollTop * c.y + u.y,
    };
  }
  function T0(e) {
    return Array.from(e.getClientRects());
  }
  function pm(e) {
    return zn(Wr(e)).left + Oa(e).scrollLeft;
  }
  function x0(e) {
    const t = Wr(e),
      r = Oa(e),
      n = e.ownerDocument.body,
      o = kt(t.scrollWidth, t.clientWidth, n.scrollWidth, n.clientWidth),
      i = kt(t.scrollHeight, t.clientHeight, n.scrollHeight, n.clientHeight);
    let s = -r.scrollLeft + pm(e);
    const a = -r.scrollTop;
    return (
      Xt(n).direction === "rtl" && (s += kt(t.clientWidth, n.clientWidth) - o),
      {
        width: o,
        height: i,
        x: s,
        y: a,
      }
    );
  }
  function D0(e, t) {
    const r = zt(e),
      n = Wr(e),
      o = r.visualViewport;
    let i = n.clientWidth,
      s = n.clientHeight,
      a = 0,
      l = 0;
    if (o) {
      (i = o.width), (s = o.height);
      const c = Yc();
      (!c || (c && t === "fixed")) && ((a = o.offsetLeft), (l = o.offsetTop));
    }
    return {
      width: i,
      height: s,
      x: a,
      y: l,
    };
  }
  function I0(e, t) {
    const r = zn(e, !0, t === "fixed"),
      n = r.top + e.clientTop,
      o = r.left + e.clientLeft,
      i = $r(e) ? vo(e) : pn(1),
      s = e.clientWidth * i.x,
      a = e.clientHeight * i.y,
      l = o * i.x,
      c = n * i.y;
    return {
      width: s,
      height: a,
      x: l,
      y: c,
    };
  }
  function bd(e, t, r) {
    let n;
    if (t === "viewport") n = D0(e, r);
    else if (t === "document") n = x0(Wr(e));
    else if (kr(t)) n = I0(t, r);
    else {
      const o = fm(e);
      n = {
        ...t,
        x: t.x - o.x,
        y: t.y - o.y,
      };
    }
    return Gs(n);
  }
  function hm(e, t) {
    const r = bo(e);
    return r === t || !kr(r) || Ea(r)
      ? !1
      : Xt(r).position === "fixed" || hm(r, t);
  }
  function R0(e, t) {
    const r = t.get(e);
    if (r) return r;
    let n = Ni(e, [], !1).filter(a => kr(a) && Vr(a) !== "body"),
      o = null;
    const i = Xt(e).position === "fixed";
    let s = i ? bo(e) : e;
    for (; kr(s) && !Ea(s); ) {
      const a = Xt(s),
        l = qc(s);
      !l && a.position === "fixed" && (o = null),
        (
          i
            ? !l && !o
            : (!l &&
                a.position === "static" &&
                !!o &&
                ["absolute", "fixed"].includes(o.position)) ||
              (Li(s) && !l && hm(e, s))
        )
          ? (n = n.filter(u => u !== s))
          : (o = a),
        (s = bo(s));
    }
    return t.set(e, n), n;
  }
  function M0(e) {
    let { element: t, boundary: r, rootBoundary: n, strategy: o } = e;
    const s = [
        ...(r === "clippingAncestors" ? R0(t, this._c) : [].concat(r)),
        n,
      ],
      a = s[0],
      l = s.reduce(
        (c, u) => {
          const f = bd(t, u, o);
          return (
            (c.top = kt(f.top, c.top)),
            (c.right = dn(f.right, c.right)),
            (c.bottom = dn(f.bottom, c.bottom)),
            (c.left = kt(f.left, c.left)),
            c
          );
        },
        bd(t, a, o)
      );
    return {
      width: l.right - l.left,
      height: l.bottom - l.top,
      x: l.left,
      y: l.top,
    };
  }
  function j0(e) {
    const { width: t, height: r } = um(e);
    return {
      width: t,
      height: r,
    };
  }
  function F0(e, t, r) {
    const n = $r(t),
      o = Wr(t),
      i = r === "fixed",
      s = zn(e, !0, i, t);
    let a = {
      scrollLeft: 0,
      scrollTop: 0,
    };
    const l = pn(0);
    if (n || (!n && !i))
      if (((Vr(t) !== "body" || Li(o)) && (a = Oa(t)), n)) {
        const f = zn(t, !0, i, t);
        (l.x = f.x + t.clientLeft), (l.y = f.y + t.clientTop);
      } else o && (l.x = pm(o));
    const c = s.left + a.scrollLeft - l.x,
      u = s.top + a.scrollTop - l.y;
    return {
      x: c,
      y: u,
      width: s.width,
      height: s.height,
    };
  }
  function wd(e, t) {
    return !$r(e) || Xt(e).position === "fixed"
      ? null
      : t
        ? t(e)
        : e.offsetParent;
  }
  function gm(e, t) {
    const r = zt(e);
    if (!$r(e) || dm(e)) return r;
    let n = wd(e, t);
    for (; n && O0(n) && Xt(n).position === "static"; ) n = wd(n, t);
    return n &&
      (Vr(n) === "html" ||
        (Vr(n) === "body" && Xt(n).position === "static" && !qc(n)))
      ? r
      : n || A0(e) || r;
  }
  const L0 = async function (e) {
    const t = this.getOffsetParent || gm,
      r = this.getDimensions;
    return {
      reference: F0(e.reference, await t(e.floating), e.strategy),
      floating: {
        x: 0,
        y: 0,
        ...(await r(e.floating)),
      },
    };
  };
  function V0(e) {
    return Xt(e).direction === "rtl";
  }
  const k0 = {
    convertOffsetParentRelativeRectToViewportRelativeRect: C0,
    getDocumentElement: Wr,
    getClippingRect: M0,
    getOffsetParent: gm,
    getElementRects: L0,
    getClientRects: T0,
    getDimensions: j0,
    getScale: vo,
    isElement: kr,
    isRTL: V0,
  };
  function B0(e, t) {
    let r = null,
      n;
    const o = Wr(e);
    function i() {
      var a;
      clearTimeout(n), (a = r) == null || a.disconnect(), (r = null);
    }
    function s(a, l) {
      a === void 0 && (a = !1), l === void 0 && (l = 1), i();
      const {
        left: c,
        top: u,
        width: f,
        height: d,
      } = e.getBoundingClientRect();
      if ((a || t(), !f || !d)) return;
      const p = fs(u),
        h = fs(o.clientWidth - (c + f)),
        m = fs(o.clientHeight - (u + d)),
        v = fs(c),
        _ = {
          rootMargin: -p + "px " + -h + "px " + -m + "px " + -v + "px",
          threshold: kt(0, dn(1, l)) || 1,
        };
      let E = !0;
      function A(D) {
        const S = D[0].intersectionRatio;
        if (S !== l) {
          if (!E) return s();
          S
            ? s(!1, S)
            : (n = setTimeout(() => {
                s(!1, 1e-7);
              }, 100));
        }
        E = !1;
      }
      try {
        r = new IntersectionObserver(A, {
          ..._,
          // Handle <iframe>s
          root: o.ownerDocument,
        });
      } catch {
        r = new IntersectionObserver(A, _);
      }
      r.observe(e);
    }
    return s(!0), i;
  }
  function z0(e, t, r, n) {
    n === void 0 && (n = {});
    const {
        ancestorScroll: o = !0,
        ancestorResize: i = !0,
        elementResize: s = typeof ResizeObserver == "function",
        layoutShift: a = typeof IntersectionObserver == "function",
        animationFrame: l = !1,
      } = n,
      c = Jc(e),
      u = o || i ? [...(c ? Ni(c) : []), ...Ni(t)] : [];
    u.forEach(g => {
      o &&
        g.addEventListener("scroll", r, {
          passive: !0,
        }),
        i && g.addEventListener("resize", r);
    });
    const f = c && a ? B0(c, r) : null;
    let d = -1,
      p = null;
    s &&
      ((p = new ResizeObserver(g => {
        let [_] = g;
        _ &&
          _.target === c &&
          p &&
          (p.unobserve(t),
          cancelAnimationFrame(d),
          (d = requestAnimationFrame(() => {
            var E;
            (E = p) == null || E.observe(t);
          }))),
          r();
      })),
      c && !l && p.observe(c),
      p.observe(t));
    let h,
      m = l ? zn(e) : null;
    l && v();
    function v() {
      const g = zn(e);
      m &&
        (g.x !== m.x ||
          g.y !== m.y ||
          g.width !== m.width ||
          g.height !== m.height) &&
        r(),
        (m = g),
        (h = requestAnimationFrame(v));
    }
    return (
      r(),
      () => {
        var g;
        u.forEach(_ => {
          o && _.removeEventListener("scroll", r),
            i && _.removeEventListener("resize", r);
        }),
          f == null || f(),
          (g = p) == null || g.disconnect(),
          (p = null),
          l && cancelAnimationFrame(h);
      }
    );
  }
  const U0 = b0,
    Ed = v0,
    W0 = E0,
    H0 = y0,
    K0 = m0,
    G0 = w0,
    q0 = (e, t, r) => {
      const n = /* @__PURE__ */ new Map(),
        o = {
          platform: k0,
          ...r,
        },
        i = {
          ...o.platform,
          _c: n,
        };
      return g0(e, t, {
        ...o,
        platform: i,
      });
    };
  function Y0(e) {
    return e != null && typeof e == "object" && "$el" in e;
  }
  function Jl(e) {
    if (Y0(e)) {
      const t = e.$el;
      return Gc(t) && Vr(t) === "#comment" ? null : t;
    }
    return e;
  }
  function J0(e) {
    return {
      name: "arrow",
      options: e,
      fn(t) {
        const r = Jl(z(e.element));
        return r == null
          ? {}
          : K0({
              element: r,
              padding: e.padding,
            }).fn(t);
      },
    };
  }
  function mm(e) {
    return typeof window > "u"
      ? 1
      : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
  }
  function Od(e, t) {
    const r = mm(e);
    return Math.round(t * r) / r;
  }
  function X0(e, t, r) {
    r === void 0 && (r = {});
    const n = r.whileElementsMounted,
      o = Oe(() => {
        var O;
        return (O = z(r.open)) != null ? O : !0;
      }),
      i = Oe(() => z(r.middleware)),
      s = Oe(() => {
        var O;
        return (O = z(r.placement)) != null ? O : "bottom";
      }),
      a = Oe(() => {
        var O;
        return (O = z(r.strategy)) != null ? O : "absolute";
      }),
      l = Oe(() => {
        var O;
        return (O = z(r.transform)) != null ? O : !0;
      }),
      c = Oe(() => Jl(e.value)),
      u = Oe(() => Jl(t.value)),
      f = Ee(0),
      d = Ee(0),
      p = Ee(a.value),
      h = Ee(s.value),
      m = mg({}),
      v = Ee(!1),
      g = Oe(() => {
        const O = {
          position: p.value,
          left: "0",
          top: "0",
        };
        if (!u.value) return O;
        const j = Od(u.value, f.value),
          B = Od(u.value, d.value);
        return l.value
          ? {
              ...O,
              transform: "translate(" + j + "px, " + B + "px)",
              ...(mm(u.value) >= 1.5 && {
                willChange: "transform",
              }),
            }
          : {
              position: p.value,
              left: j + "px",
              top: B + "px",
            };
      });
    let _;
    function E() {
      c.value == null ||
        u.value == null ||
        q0(c.value, u.value, {
          middleware: i.value,
          placement: s.value,
          strategy: a.value,
        }).then(O => {
          (f.value = O.x),
            (d.value = O.y),
            (p.value = O.strategy),
            (h.value = O.placement),
            (m.value = O.middlewareData),
            (v.value = !0);
        });
    }
    function A() {
      typeof _ == "function" && (_(), (_ = void 0));
    }
    function D() {
      if ((A(), n === void 0)) {
        E();
        return;
      }
      if (c.value != null && u.value != null) {
        _ = n(c.value, u.value, E);
        return;
      }
    }
    function S() {
      o.value || (v.value = !1);
    }
    return (
      vt([i, s, a], E, {
        flush: "sync",
      }),
      vt([c, u], D, {
        flush: "sync",
      }),
      vt(o, S, {
        flush: "sync",
      }),
      Ec() && Qh(A),
      {
        x: qt(f),
        y: qt(d),
        strategy: qt(p),
        placement: qt(h),
        middlewareData: qt(m),
        isPositioned: qt(v),
        floatingStyles: g,
        update: E,
      }
    );
  }
  function Jn(e, t) {
    const r = typeof e == "string" && !t ? `${e}Context` : t,
      n = Symbol(r);
    return [
      o => {
        const i = di(n, o);
        if (i || i === null) return i;
        throw new Error(
          `Injection \`${n.toString()}\` not found. Component must be used within ${
            Array.isArray(e)
              ? `one of the following components: ${e.join(", ")}`
              : `\`${e}\``
          }`
        );
      },
      o => (Ug(n, o), o),
    ];
  }
  function vm(e, t, r) {
    const n = r.originalEvent.target,
      o = new CustomEvent(e, {
        bubbles: !1,
        cancelable: !0,
        detail: r,
      });
    t && n.addEventListener(e, t, { once: !0 }), n.dispatchEvent(o);
  }
  function Z0(e, t) {
    var r;
    const n = mg();
    return (
      Jt(
        () => {
          n.value = e();
        },
        {
          ...t,
          flush: (r = void 0) != null ? r : "sync",
        }
      ),
      ha(n)
    );
  }
  function Vi(e) {
    return Ec() ? (Qh(e), !0) : !1;
  }
  function Q0() {
    const e = /* @__PURE__ */ new Set(),
      t = r => {
        e.delete(r);
      };
    return {
      on: r => {
        e.add(r);
        const n = () => t(r);
        return (
          Vi(n),
          {
            off: n,
          }
        );
      },
      off: t,
      trigger: (...r) => Promise.all(Array.from(e).map(n => n(...r))),
    };
  }
  function ew(e) {
    let t = !1,
      r;
    const n = Zh(!0);
    return (...o) => (t || ((r = n.run(() => e(...o))), (t = !0)), r);
  }
  function tw(e) {
    let t = 0,
      r,
      n;
    const o = () => {
      (t -= 1), n && t <= 0 && (n.stop(), (r = void 0), (n = void 0));
    };
    return (...i) => (
      (t += 1), r || ((n = Zh(!0)), (r = n.run(() => e(...i)))), Vi(o), r
    );
  }
  function Ln(e) {
    return typeof e == "function" ? e() : z(e);
  }
  const vn = typeof window < "u" && typeof document < "u";
  typeof WorkerGlobalScope < "u" && globalThis instanceof WorkerGlobalScope;
  const rw = e => typeof e < "u",
    nw = Object.prototype.toString,
    ow = e => nw.call(e) === "[object Object]",
    iw = () => {},
    Ad = /* @__PURE__ */ sw();
  function sw() {
    var e, t;
    return (
      vn &&
      ((e = window == null ? void 0 : window.navigator) == null
        ? void 0
        : e.userAgent) &&
      (/iP(?:ad|hone|od)/.test(window.navigator.userAgent) ||
        (((t = window == null ? void 0 : window.navigator) == null
          ? void 0
          : t.maxTouchPoints) > 2 &&
          /iPad|Macintosh/.test(
            window == null ? void 0 : window.navigator.userAgent
          )))
    );
  }
  function aw(e) {
    return Ur();
  }
  function lw(e, t = 1e4) {
    return H_((r, n) => {
      let o = Ln(e),
        i;
      const s = () =>
        setTimeout(() => {
          (o = Ln(e)), n();
        }, Ln(t));
      return (
        Vi(() => {
          clearTimeout(i);
        }),
        {
          get() {
            return r(), o;
          },
          set(a) {
            (o = a), n(), clearTimeout(i), (i = s());
          },
        }
      );
    });
  }
  function cw(e, t) {
    aw() && Lg(e, t);
  }
  function ym(e, t, r = {}) {
    const { immediate: n = !0 } = r,
      o = Ee(!1);
    let i = null;
    function s() {
      i && (clearTimeout(i), (i = null));
    }
    function a() {
      (o.value = !1), s();
    }
    function l(...c) {
      s(),
        (o.value = !0),
        (i = setTimeout(() => {
          (o.value = !1), (i = null), e(...c);
        }, Ln(t)));
    }
    return (
      n && ((o.value = !0), vn && l()),
      Vi(a),
      {
        isPending: ha(o),
        start: l,
        stop: a,
      }
    );
  }
  function ki(e) {
    var t;
    const r = Ln(e);
    return (t = r == null ? void 0 : r.$el) != null ? t : r;
  }
  const _m = vn ? window : void 0;
  function qs(...e) {
    let t, r, n, o;
    if (
      (typeof e[0] == "string" || Array.isArray(e[0])
        ? (([r, n, o] = e), (t = _m))
        : ([t, r, n, o] = e),
      !t)
    )
      return iw;
    Array.isArray(r) || (r = [r]), Array.isArray(n) || (n = [n]);
    const i = [],
      s = () => {
        i.forEach(u => u()), (i.length = 0);
      },
      a = (u, f, d, p) => (
        u.addEventListener(f, d, p), () => u.removeEventListener(f, d, p)
      ),
      l = vt(
        () => [ki(t), Ln(o)],
        ([u, f]) => {
          if ((s(), !u)) return;
          const d = ow(f) ? { ...f } : f;
          i.push(...r.flatMap(p => n.map(h => a(u, p, h, d))));
        },
        { immediate: !0, flush: "post" }
      ),
      c = () => {
        l(), s();
      };
    return Vi(c), c;
  }
  function uw(e) {
    return typeof e == "function"
      ? e
      : typeof e == "string"
        ? t => t.key === e
        : Array.isArray(e)
          ? t => e.includes(t.key)
          : () => !0;
  }
  function fw(...e) {
    let t,
      r,
      n = {};
    e.length === 3
      ? ((t = e[0]), (r = e[1]), (n = e[2]))
      : e.length === 2
        ? typeof e[1] == "object"
          ? ((t = !0), (r = e[0]), (n = e[1]))
          : ((t = e[0]), (r = e[1]))
        : ((t = !0), (r = e[0]));
    const {
        target: o = _m,
        eventName: i = "keydown",
        passive: s = !1,
        dedupe: a = !1,
      } = n,
      l = uw(t);
    return qs(
      o,
      i,
      c => {
        (c.repeat && Ln(a)) || (l(c) && r(c));
      },
      s
    );
  }
  function dw() {
    const e = Ee(!1),
      t = Ur();
    return (
      t &&
        zr(() => {
          e.value = !0;
        }, t),
      e
    );
  }
  function pw(e) {
    return JSON.parse(JSON.stringify(e));
  }
  function $m(e, t, r, n = {}) {
    var o, i, s;
    const {
        clone: a = !1,
        passive: l = !1,
        eventName: c,
        deep: u = !1,
        defaultValue: f,
        shouldEmit: d,
      } = n,
      p = Ur(),
      h =
        r ||
        (p == null ? void 0 : p.emit) ||
        ((o = p == null ? void 0 : p.$emit) == null ? void 0 : o.bind(p)) ||
        ((s = (i = p == null ? void 0 : p.proxy) == null ? void 0 : i.$emit) ==
        null
          ? void 0
          : s.bind(p == null ? void 0 : p.proxy));
    let m = c;
    t || (t = "modelValue"), (m = m || `update:${t.toString()}`);
    const v = E => (a ? (typeof a == "function" ? a(E) : pw(E)) : E),
      g = () => (rw(e[t]) ? v(e[t]) : f),
      _ = E => {
        d ? d(E) && h(m, E) : h(m, E);
      };
    if (l) {
      const E = g(),
        A = Ee(E);
      let D = !1;
      return (
        vt(
          () => e[t],
          S => {
            D || ((D = !0), (A.value = v(S)), mn(() => (D = !1)));
          }
        ),
        vt(
          A,
          S => {
            !D && (S !== e[t] || u) && _(S);
          },
          { deep: u }
        ),
        A
      );
    } else
      return Oe({
        get() {
          return g();
        },
        set(E) {
          _(E);
        },
      });
  }
  function Xc(e) {
    return e ? e.flatMap(t => (t.type === Vt ? Xc(t.children) : [t])) : [];
  }
  function il(e) {
    if (e === null || typeof e != "object") return !1;
    const t = Object.getPrototypeOf(e);
    return (t !== null &&
      t !== Object.prototype &&
      Object.getPrototypeOf(t) !== null) ||
      Symbol.iterator in e
      ? !1
      : Symbol.toStringTag in e
        ? Object.prototype.toString.call(e) === "[object Module]"
        : !0;
  }
  function Xl(e, t, r = ".", n) {
    if (!il(t)) return Xl(e, {}, r, n);
    const o = Object.assign({}, t);
    for (const i in e) {
      if (i === "__proto__" || i === "constructor") continue;
      const s = e[i];
      s != null &&
        ((n && n(o, i, s, r)) ||
          (Array.isArray(s) && Array.isArray(o[i])
            ? (o[i] = [...s, ...o[i]])
            : il(s) && il(o[i])
              ? (o[i] = Xl(s, o[i], (r ? `${r}.` : "") + i.toString(), n))
              : (o[i] = s)));
    }
    return o;
  }
  function hw(e) {
    return (...t) =>
      // eslint-disable-next-line unicorn/no-array-reduce
      t.reduce((r, n) => Xl(r, n, "", e), {});
  }
  const gw = hw(),
    [bm, wK] = Jn("ConfigProvider");
  let mw = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",
    vw = (e = 21) => {
      let t = "",
        r = e;
      for (; r--; ) t += mw[(Math.random() * 64) | 0];
      return t;
    };
  const yw = tw(() => {
    const e = Ee(/* @__PURE__ */ new Map()),
      t = Ee(),
      r = Oe(() => {
        for (const s of e.value.values()) if (s) return !0;
        return !1;
      }),
      n = bm({
        scrollBody: Ee(!0),
      });
    let o = null;
    const i = () => {
      (document.body.style.paddingRight = ""),
        (document.body.style.marginRight = ""),
        (document.body.style.pointerEvents = ""),
        document.body.style.removeProperty("--scrollbar-width"),
        (document.body.style.overflow = t.value ?? ""),
        Ad && (o == null || o()),
        (t.value = void 0);
    };
    return (
      vt(
        r,
        (s, a) => {
          var l;
          if (!vn) return;
          if (!s) {
            a && i();
            return;
          }
          t.value === void 0 && (t.value = document.body.style.overflow);
          const c = window.innerWidth - document.documentElement.clientWidth,
            u = { padding: c, margin: 0 },
            f =
              (l = n.scrollBody) != null && l.value
                ? typeof n.scrollBody.value == "object"
                  ? gw(
                      {
                        padding:
                          n.scrollBody.value.padding === !0
                            ? c
                            : n.scrollBody.value.padding,
                        margin:
                          n.scrollBody.value.margin === !0
                            ? c
                            : n.scrollBody.value.margin,
                      },
                      u
                    )
                  : u
                : { padding: 0, margin: 0 };
          c > 0 &&
            ((document.body.style.paddingRight = `${f.padding}px`),
            (document.body.style.marginRight = `${f.margin}px`),
            document.body.style.setProperty("--scrollbar-width", `${c}px`),
            (document.body.style.overflow = "hidden")),
            Ad &&
              (o = qs(
                document,
                "touchmove",
                d => {
                  var p;
                  d.target === document.documentElement &&
                    (d.touches.length > 1 ||
                      (p = d.preventDefault) == null ||
                      p.call(d));
                },
                { passive: !1 }
              )),
            mn(() => {
              (document.body.style.pointerEvents = "none"),
                (document.body.style.overflow = "hidden");
            });
        },
        { immediate: !0, flush: "sync" }
      ),
      e
    );
  });
  function _w(e) {
    const t = vw(6),
      r = yw();
    r.value.set(t, e ?? !1);
    const n = Oe({
      get: () => r.value.get(t) ?? !1,
      set: o => r.value.set(t, o),
    });
    return (
      cw(() => {
        r.value.delete(t);
      }),
      n
    );
  }
  function Aa(e) {
    const t = Ur(),
      r = t == null ? void 0 : t.type.emits,
      n = {};
    return (
      (r != null && r.length) ||
        console.warn(
          `No emitted event found. Please check component: ${t == null ? void 0 : t.type.__name}`
        ),
      r == null ||
        r.forEach(o => {
          n[Cr(Ct(o))] = (...i) => e(o, ...i);
        }),
      n
    );
  }
  function wm(e) {
    const t = Ur(),
      r = Object.keys((t == null ? void 0 : t.type.props) ?? {}).reduce(
        (o, i) => {
          const s = (t == null ? void 0 : t.type.props[i]).default;
          return s !== void 0 && (o[i] = s), o;
        },
        {}
      ),
      n = q_(e);
    return Oe(() => {
      const o = {},
        i = (t == null ? void 0 : t.vnode.props) ?? {};
      return (
        Object.keys(i).forEach(s => {
          o[Ct(s)] = i[s];
        }),
        Object.keys({ ...r, ...o }).reduce(
          (s, a) => (n.value[a] !== void 0 && (s[a] = n.value[a]), s),
          {}
        )
      );
    });
  }
  function Zc(e, t) {
    const r = wm(e),
      n = t ? Aa(t) : {};
    return Oe(() => ({
      ...r.value,
      ...n,
    }));
  }
  function We() {
    const e = Ur(),
      t = Ee(),
      r = Oe(() => {
        var s, a;
        return ["#text", "#comment"].includes(
          (s = t.value) == null ? void 0 : s.$el.nodeName
        )
          ? (a = t.value) == null
            ? void 0
            : a.$el.nextElementSibling
          : ki(t);
      }),
      n = Object.assign({}, e.exposed),
      o = {};
    for (const s in e.props)
      Object.defineProperty(o, s, {
        enumerable: !0,
        configurable: !0,
        get: () => e.props[s],
      });
    if (Object.keys(n).length > 0)
      for (const s in n)
        Object.defineProperty(o, s, {
          enumerable: !0,
          configurable: !0,
          get: () => n[s],
        });
    Object.defineProperty(o, "$el", {
      enumerable: !0,
      configurable: !0,
      get: () => e.vnode.el,
    }),
      (e.exposed = o);
    function i(s) {
      (t.value = s),
        !(s instanceof Element || !s) &&
          (Object.defineProperty(o, "$el", {
            enumerable: !0,
            configurable: !0,
            get: () => s.$el,
          }),
          (e.exposed = o));
    }
    return { forwardRef: i, currentRef: t, currentElement: r };
  }
  function $w(e, t) {
    const r = lw(!1, 300),
      n = Ee(null),
      o = Q0();
    function i() {
      (n.value = null), (r.value = !1);
    }
    function s(a, l) {
      const c = a.currentTarget,
        u = { x: a.clientX, y: a.clientY },
        f = bw(u, c.getBoundingClientRect()),
        d = ww(u, f),
        p = Ew(l.getBoundingClientRect()),
        h = Aw([...d, ...p]);
      (n.value = h), (r.value = !0);
    }
    return (
      Jt(a => {
        if (e.value && t.value) {
          const l = u => s(u, t.value),
            c = u => s(u, e.value);
          e.value.addEventListener("pointerleave", l),
            t.value.addEventListener("pointerleave", c),
            a(() => {
              var u, f;
              (u = e.value) == null || u.removeEventListener("pointerleave", l),
                (f = t.value) == null ||
                  f.removeEventListener("pointerleave", c);
            });
        }
      }),
      Jt(a => {
        if (n.value) {
          const l = c => {
            var u, f;
            if (!n.value) return;
            const d = c.target,
              p = { x: c.clientX, y: c.clientY },
              h =
                ((u = e.value) == null ? void 0 : u.contains(d)) ||
                ((f = t.value) == null ? void 0 : f.contains(d)),
              m = !Ow(p, n.value),
              v = d.hasAttribute("data-grace-area-trigger");
            h ? i() : (m || v) && (i(), o.trigger());
          };
          document.addEventListener("pointermove", l),
            a(() => document.removeEventListener("pointermove", l));
        }
      }),
      {
        isPointerInTransit: r,
        onPointerExit: o.on,
      }
    );
  }
  function bw(e, t) {
    const r = Math.abs(t.top - e.y),
      n = Math.abs(t.bottom - e.y),
      o = Math.abs(t.right - e.x),
      i = Math.abs(t.left - e.x);
    switch (Math.min(r, n, o, i)) {
      case i:
        return "left";
      case o:
        return "right";
      case r:
        return "top";
      case n:
        return "bottom";
      default:
        throw new Error("unreachable");
    }
  }
  function ww(e, t, r = 5) {
    const n = [];
    switch (t) {
      case "top":
        n.push({ x: e.x - r, y: e.y + r }, { x: e.x + r, y: e.y + r });
        break;
      case "bottom":
        n.push({ x: e.x - r, y: e.y - r }, { x: e.x + r, y: e.y - r });
        break;
      case "left":
        n.push({ x: e.x + r, y: e.y - r }, { x: e.x + r, y: e.y + r });
        break;
      case "right":
        n.push({ x: e.x - r, y: e.y - r }, { x: e.x - r, y: e.y + r });
        break;
    }
    return n;
  }
  function Ew(e) {
    const { top: t, right: r, bottom: n, left: o } = e;
    return [
      { x: o, y: t },
      { x: r, y: t },
      { x: r, y: n },
      { x: o, y: n },
    ];
  }
  function Ow(e, t) {
    const { x: r, y: n } = e;
    let o = !1;
    for (let i = 0, s = t.length - 1; i < t.length; s = i++) {
      const a = t[i].x,
        l = t[i].y,
        c = t[s].x,
        u = t[s].y;
      l > n != u > n && r < ((c - a) * (n - l)) / (u - l) + a && (o = !o);
    }
    return o;
  }
  function Aw(e) {
    const t = e.slice();
    return (
      t.sort((r, n) =>
        r.x < n.x ? -1 : r.x > n.x ? 1 : r.y < n.y ? -1 : r.y > n.y ? 1 : 0
      ),
      Sw(t)
    );
  }
  function Sw(e) {
    if (e.length <= 1) return e.slice();
    const t = [];
    for (let n = 0; n < e.length; n++) {
      const o = e[n];
      for (; t.length >= 2; ) {
        const i = t[t.length - 1],
          s = t[t.length - 2];
        if ((i.x - s.x) * (o.y - s.y) >= (i.y - s.y) * (o.x - s.x)) t.pop();
        else break;
      }
      t.push(o);
    }
    t.pop();
    const r = [];
    for (let n = e.length - 1; n >= 0; n--) {
      const o = e[n];
      for (; r.length >= 2; ) {
        const i = r[r.length - 1],
          s = r[r.length - 2];
        if ((i.x - s.x) * (o.y - s.y) >= (i.y - s.y) * (o.x - s.x)) r.pop();
        else break;
      }
      r.push(o);
    }
    return (
      r.pop(),
      t.length === 1 && r.length === 1 && t[0].x === r[0].x && t[0].y === r[0].y
        ? t
        : t.concat(r)
    );
  }
  var Nw = function (e) {
      if (typeof document > "u") return null;
      var t = Array.isArray(e) ? e[0] : e;
      return t.ownerDocument.body;
    },
    ao = /* @__PURE__ */ new WeakMap(),
    ds = /* @__PURE__ */ new WeakMap(),
    ps = {},
    sl = 0,
    Em = function (e) {
      return e && (e.host || Em(e.parentNode));
    },
    Pw = function (e, t) {
      return t
        .map(function (r) {
          if (e.contains(r)) return r;
          var n = Em(r);
          return n && e.contains(n)
            ? n
            : (console.error(
                "aria-hidden",
                r,
                "in not contained inside",
                e,
                ". Doing nothing"
              ),
              null);
        })
        .filter(function (r) {
          return !!r;
        });
    },
    Cw = function (e, t, r, n) {
      var o = Pw(t, Array.isArray(e) ? e : [e]);
      ps[r] || (ps[r] = /* @__PURE__ */ new WeakMap());
      var i = ps[r],
        s = [],
        a = /* @__PURE__ */ new Set(),
        l = new Set(o),
        c = function (f) {
          !f || a.has(f) || (a.add(f), c(f.parentNode));
        };
      o.forEach(c);
      var u = function (f) {
        !f ||
          l.has(f) ||
          Array.prototype.forEach.call(f.children, function (d) {
            if (a.has(d)) u(d);
            else
              try {
                var p = d.getAttribute(n),
                  h = p !== null && p !== "false",
                  m = (ao.get(d) || 0) + 1,
                  v = (i.get(d) || 0) + 1;
                ao.set(d, m),
                  i.set(d, v),
                  s.push(d),
                  m === 1 && h && ds.set(d, !0),
                  v === 1 && d.setAttribute(r, "true"),
                  h || d.setAttribute(n, "true");
              } catch (g) {
                console.error("aria-hidden: cannot operate on ", d, g);
              }
          });
      };
      return (
        u(t),
        a.clear(),
        sl++,
        function () {
          s.forEach(function (f) {
            var d = ao.get(f) - 1,
              p = i.get(f) - 1;
            ao.set(f, d),
              i.set(f, p),
              d || (ds.has(f) || f.removeAttribute(n), ds.delete(f)),
              p || f.removeAttribute(r);
          }),
            sl--,
            sl ||
              ((ao = /* @__PURE__ */ new WeakMap()),
              (ao = /* @__PURE__ */ new WeakMap()),
              (ds = /* @__PURE__ */ new WeakMap()),
              (ps = {}));
        }
      );
    },
    Tw = function (e, t, r) {
      r === void 0 && (r = "data-aria-hidden");
      var n = Array.from(Array.isArray(e) ? e : [e]),
        o = Nw(e);
      return o
        ? (n.push.apply(n, Array.from(o.querySelectorAll("[aria-live]"))),
          Cw(n, o, r, "aria-hidden"))
        : function () {
            return null;
          };
    };
  function xw(e) {
    let t;
    vt(
      () => ki(e),
      r => {
        r ? (t = Tw(r)) : t && t();
      }
    ),
      Ri(() => {
        t && t();
      });
  }
  let Dw = 0;
  function Ys(e, t = "radix") {
    if (e) return e;
    const { useId: r } = bm({ useId: void 0 });
    return r && typeof r == "function" ? `${t}-${r()}` : `${t}-${++Dw}`;
  }
  function Iw(e) {
    const t = Ee(),
      r = Oe(() => {
        var o;
        return ((o = t.value) == null ? void 0 : o.width) ?? 0;
      }),
      n = Oe(() => {
        var o;
        return ((o = t.value) == null ? void 0 : o.height) ?? 0;
      });
    return (
      zr(() => {
        const o = ki(e);
        if (o) {
          t.value = { width: o.offsetWidth, height: o.offsetHeight };
          const i = new ResizeObserver(s => {
            if (!Array.isArray(s) || !s.length) return;
            const a = s[0];
            let l, c;
            if ("borderBoxSize" in a) {
              const u = a.borderBoxSize,
                f = Array.isArray(u) ? u[0] : u;
              (l = f.inlineSize), (c = f.blockSize);
            } else (l = o.offsetWidth), (c = o.offsetHeight);
            t.value = { width: l, height: c };
          });
          return i.observe(o, { box: "border-box" }), () => i.unobserve(o);
        } else t.value = void 0;
      }),
      {
        width: r,
        height: n,
      }
    );
  }
  function Rw(e, t) {
    const r = Ee(e);
    function n(o) {
      return t[r.value][o] ?? r.value;
    }
    return {
      state: r,
      dispatch: o => {
        r.value = n(o);
      },
    };
  }
  const Mw = /* @__PURE__ */ ge({
      name: "PrimitiveSlot",
      inheritAttrs: !1,
      setup(e, { attrs: t, slots: r }) {
        return () => {
          var n, o;
          if (!r.default) return null;
          const i = Xc(r.default()),
            s = i.findIndex(u => u.type !== Tt);
          if (s === -1) return i;
          const a = i[s];
          (n = a.props) == null || delete n.ref;
          const l = a.props ? pt(t, a.props) : t;
          t.class && (o = a.props) != null && o.class && delete a.props.class;
          const c = jr(a, l);
          for (const u in l)
            u.startsWith("on") &&
              (c.props || (c.props = {}), (c.props[u] = l[u]));
          return i.length === 1 ? c : ((i[s] = c), i);
        };
      },
    }),
    St = /* @__PURE__ */ ge({
      name: "Primitive",
      inheritAttrs: !1,
      props: {
        asChild: {
          type: Boolean,
          default: !1,
        },
        as: {
          type: [String, Object],
          default: "div",
        },
      },
      setup(e, { attrs: t, slots: r }) {
        const n = e.asChild ? "template" : e.as;
        return typeof n == "string" && ["area", "img", "input"].includes(n)
          ? () => Ns(n, t)
          : n !== "template"
            ? () => Ns(e.as, t, { default: r.default })
            : () => Ns(Mw, t, { default: r.default });
      },
    });
  function jw(e, t) {
    const r = Ee({}),
      n = Ee("none"),
      o = e.value ? "mounted" : "unmounted",
      { state: i, dispatch: s } = Rw(o, {
        mounted: {
          UNMOUNT: "unmounted",
          ANIMATION_OUT: "unmountSuspended",
        },
        unmountSuspended: {
          MOUNT: "mounted",
          ANIMATION_END: "unmounted",
        },
        unmounted: {
          MOUNT: "mounted",
        },
      }),
      a = d => {
        var p;
        if (vn) {
          const h = new CustomEvent(d, { bubbles: !1, cancelable: !1 });
          (p = t.value) == null || p.dispatchEvent(h);
        }
      };
    vt(
      e,
      async (d, p) => {
        var h;
        const m = p !== d;
        if ((await mn(), m)) {
          const v = n.value,
            g = hs(t.value);
          d
            ? (s("MOUNT"), a("enter"), g === "none" && a("after-enter"))
            : g === "none" ||
                ((h = r.value) == null ? void 0 : h.display) === "none"
              ? (s("UNMOUNT"), a("leave"), a("after-leave"))
              : p && v !== g
                ? (s("ANIMATION_OUT"), a("leave"))
                : (s("UNMOUNT"), a("after-leave"));
        }
      },
      { immediate: !0 }
    );
    const l = d => {
        const p = hs(t.value),
          h = p.includes(d.animationName),
          m = i.value === "mounted" ? "enter" : "leave";
        d.target === t.value && h && (a(`after-${m}`), s("ANIMATION_END")),
          d.target === t.value && p === "none" && s("ANIMATION_END");
      },
      c = d => {
        d.target === t.value && (n.value = hs(t.value));
      },
      u = vt(
        t,
        (d, p) => {
          d
            ? ((r.value = getComputedStyle(d)),
              d.addEventListener("animationstart", c),
              d.addEventListener("animationcancel", l),
              d.addEventListener("animationend", l))
            : (s("ANIMATION_END"),
              p == null || p.removeEventListener("animationstart", c),
              p == null || p.removeEventListener("animationcancel", l),
              p == null || p.removeEventListener("animationend", l));
        },
        { immediate: !0 }
      ),
      f = vt(i, () => {
        const d = hs(t.value);
        n.value = i.value === "mounted" ? d : "none";
      });
    return (
      Ri(() => {
        u(), f();
      }),
      {
        isPresent: Oe(() => ["mounted", "unmountSuspended"].includes(i.value)),
      }
    );
  }
  function hs(e) {
    return (e && getComputedStyle(e).animationName) || "none";
  }
  const Qc = /* @__PURE__ */ ge({
      name: "Presence",
      props: {
        present: {
          type: Boolean,
          required: !0,
        },
        forceMount: {
          type: Boolean,
        },
      },
      slots: {},
      setup(e, { slots: t, expose: r }) {
        var n;
        const { present: o, forceMount: i } = xt(e),
          s = Ee(),
          { isPresent: a } = jw(o, s);
        r({ present: a });
        let l = t.default({ present: a });
        l = Xc(l || []);
        const c = Ur();
        if (l && (l == null ? void 0 : l.length) > 1) {
          const u =
            (n = c == null ? void 0 : c.parent) != null && n.type.name
              ? `<${c.parent.type.name} />`
              : "component";
          throw new Error(
            [
              `Detected an invalid children for \`${u}\` for  \`Presence\` component.`,
              "",
              "Note: Presence works similarly to `v-if` directly, but it waits for animation/transition to finished before unmounting. So it expect only one direct child of valid VNode type.",
              "You can apply a few solutions:",
              [
                "Provide a single child element so that `presence` directive attach correctly.",
                "Ensure the first child is an actual element instead of a raw text node or comment node.",
              ].map(f => `  - ${f}`).join(`
`),
            ].join(`
`)
          );
        }
        return () =>
          i.value || o.value || a.value
            ? Ns(t.default({ present: a })[0], {
                ref: u => {
                  const f = ki(u);
                  return (
                    typeof (f == null ? void 0 : f.hasAttribute) > "u" ||
                      (f != null &&
                      f.hasAttribute("data-radix-popper-content-wrapper")
                        ? (s.value = f.firstElementChild)
                        : (s.value = f)),
                    f
                  );
                },
              })
            : null;
      },
    }),
    [wr, Fw] = Jn("DialogRoot"),
    Lw = /* @__PURE__ */ ge({
      __name: "DialogRoot",
      props: {
        open: { type: Boolean, default: void 0 },
        defaultOpen: { type: Boolean, default: !1 },
        modal: { type: Boolean, default: !0 },
      },
      emits: ["update:open"],
      setup(e, { emit: t }) {
        const r = e,
          n = $m(r, "open", t, {
            defaultValue: r.defaultOpen,
            passive: r.open === void 0,
          }),
          o = Ee(),
          i = Ee(),
          { modal: s } = xt(r);
        return (
          Fw({
            open: n,
            modal: s,
            openModal: () => {
              n.value = !0;
            },
            onOpenChange: a => {
              n.value = a;
            },
            onOpenToggle: () => {
              n.value = !n.value;
            },
            contentId: "",
            titleId: "",
            descriptionId: "",
            triggerElement: o,
            contentElement: i,
          }),
          (a, l) => fe(a.$slots, "default", { open: z(n) })
        );
      },
    }),
    Vw = /* @__PURE__ */ ge({
      __name: "DialogTrigger",
      props: {
        asChild: { type: Boolean },
        as: { default: "button" },
      },
      setup(e) {
        const t = e,
          r = wr(),
          { forwardRef: n, currentElement: o } = We();
        return (
          r.contentId || (r.contentId = Ys(void 0, "radix-vue-dialog-content")),
          zr(() => {
            r.triggerElement.value = o.value;
          }),
          (i, s) => (
            ue(),
            ve(
              z(St),
              pt(t, {
                ref: z(n),
                type: i.as === "button" ? "button" : void 0,
                "aria-haspopup": "dialog",
                "aria-expanded": z(r).open.value || !1,
                "aria-controls": z(r).open.value ? z(r).contentId : void 0,
                "data-state": z(r).open.value ? "open" : "closed",
                onClick: z(r).onOpenToggle,
              }),
              {
                default: oe(() => [fe(i.$slots, "default")]),
                _: 3,
              },
              16,
              [
                "type",
                "aria-expanded",
                "aria-controls",
                "data-state",
                "onClick",
              ]
            )
          )
        );
      },
    }),
    Om = /* @__PURE__ */ ge({
      __name: "Teleport",
      props: {
        to: { default: "body" },
        disabled: { type: Boolean },
        forceMount: { type: Boolean },
      },
      setup(e) {
        const t = dw();
        return (r, n) =>
          z(t) || r.forceMount
            ? (ue(),
              ve(
                yb,
                {
                  key: 0,
                  to: r.to,
                  disabled: r.disabled,
                },
                [fe(r.$slots, "default")],
                8,
                ["to", "disabled"]
              ))
            : mr("", !0);
      },
    }),
    kw = /* @__PURE__ */ ge({
      __name: "DialogPortal",
      props: {
        to: {},
        disabled: { type: Boolean },
        forceMount: { type: Boolean },
      },
      setup(e) {
        const t = e;
        return (r, n) => (
          ue(),
          ve(
            z(Om),
            No(Yn(t)),
            {
              default: oe(() => [fe(r.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    Bw = "dismissableLayer.pointerDownOutside",
    zw = "dismissableLayer.focusOutside";
  function Am(e, t) {
    const r = t.closest("[data-dismissable-layer]"),
      n =
        e.dataset.dismissableLayer === ""
          ? e
          : e.querySelector("[data-dismissable-layer]"),
      o = Array.from(
        e.ownerDocument.querySelectorAll("[data-dismissable-layer]")
      );
    return !!((r && n === r) || o.indexOf(n) < o.indexOf(r));
  }
  function Uw(e, t) {
    var r;
    const n =
        ((r = t == null ? void 0 : t.value) == null
          ? void 0
          : r.ownerDocument) ??
        (globalThis == null ? void 0 : globalThis.document),
      o = Ee(!1),
      i = Ee(() => {});
    return (
      Jt(s => {
        if (!vn) return;
        const a = async c => {
            const u = c.target;
            if (t != null && t.value) {
              if (Am(t.value, u)) {
                o.value = !1;
                return;
              }
              if (c.target && !o.value) {
                let f = function () {
                  vm(Bw, e, d);
                };
                const d = { originalEvent: c };
                c.pointerType === "touch"
                  ? (n.removeEventListener("click", i.value),
                    (i.value = f),
                    n.addEventListener("click", i.value, {
                      once: !0,
                    }))
                  : f();
              } else n.removeEventListener("click", i.value);
              o.value = !1;
            }
          },
          l = window.setTimeout(() => {
            n.addEventListener("pointerdown", a);
          }, 0);
        s(() => {
          window.clearTimeout(l),
            n.removeEventListener("pointerdown", a),
            n.removeEventListener("click", i.value);
        });
      }),
      {
        onPointerDownCapture: () => (o.value = !0),
      }
    );
  }
  function Ww(e, t) {
    var r;
    const n =
        ((r = t == null ? void 0 : t.value) == null
          ? void 0
          : r.ownerDocument) ??
        (globalThis == null ? void 0 : globalThis.document),
      o = Ee(!1);
    return (
      Jt(i => {
        if (!vn) return;
        const s = async a => {
          t != null &&
            t.value &&
            (await mn(),
            !(!t.value || Am(t.value, a.target)) &&
              a.target &&
              !o.value &&
              vm(zw, e, { originalEvent: a }));
        };
        n.addEventListener("focusin", s),
          i(() => n.removeEventListener("focusin", s));
      }),
      {
        onFocusCapture: () => (o.value = !0),
        onBlurCapture: () => (o.value = !1),
      }
    );
  }
  const Or = xi({
      layersRoot: /* @__PURE__ */ new Set(),
      layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
      branches: /* @__PURE__ */ new Set(),
    }),
    Sm = /* @__PURE__ */ ge({
      __name: "DismissableLayer",
      props: {
        disableOutsidePointerEvents: { type: Boolean, default: !1 },
        asChild: { type: Boolean },
        as: {},
      },
      emits: [
        "escapeKeyDown",
        "pointerDownOutside",
        "focusOutside",
        "interactOutside",
        "dismiss",
      ],
      setup(e, { emit: t }) {
        const r = e,
          n = t,
          { forwardRef: o, currentElement: i } = We(),
          s = Oe(() => {
            var h;
            return (
              ((h = i.value) == null ? void 0 : h.ownerDocument) ??
              globalThis.document
            );
          }),
          a = Oe(() => Or.layersRoot),
          l = Oe(() => (i.value ? Array.from(a.value).indexOf(i.value) : -1)),
          c = Oe(() => Or.layersWithOutsidePointerEventsDisabled.size > 0),
          u = Oe(() => {
            const h = Array.from(a.value),
              [m] = [...Or.layersWithOutsidePointerEventsDisabled].slice(-1),
              v = h.indexOf(m);
            return l.value >= v;
          }),
          f = Uw(async h => {
            const m = [...Or.branches].some(v => v.contains(h.target));
            !u.value ||
              m ||
              (n("pointerDownOutside", h),
              n("interactOutside", h),
              await mn(),
              h.defaultPrevented || n("dismiss"));
          }, i),
          d = Ww(h => {
            [...Or.branches].some(m => m.contains(h.target)) ||
              (n("focusOutside", h),
              n("interactOutside", h),
              h.defaultPrevented || n("dismiss"));
          }, i);
        fw("Escape", h => {
          l.value === a.value.size - 1 &&
            (n("escapeKeyDown", h), h.defaultPrevented || n("dismiss"));
        });
        let p;
        return (
          Jt(h => {
            i.value &&
              (r.disableOutsidePointerEvents &&
                (Or.layersWithOutsidePointerEventsDisabled.size === 0 &&
                  ((p = s.value.body.style.pointerEvents),
                  (s.value.body.style.pointerEvents = "none")),
                Or.layersWithOutsidePointerEventsDisabled.add(i.value)),
              a.value.add(i.value),
              h(() => {
                r.disableOutsidePointerEvents &&
                  Or.layersWithOutsidePointerEventsDisabled.size === 1 &&
                  (s.value.body.style.pointerEvents = p);
              }));
          }),
          Jt(h => {
            h(() => {
              i.value &&
                (a.value.delete(i.value),
                Or.layersWithOutsidePointerEventsDisabled.delete(i.value));
            });
          }),
          (h, m) => (
            ue(),
            ve(
              z(St),
              {
                ref: z(o),
                "as-child": h.asChild,
                as: h.as,
                "data-dismissable-layer": "",
                style: Gn({
                  pointerEvents: c.value ? (u.value ? "auto" : "none") : void 0,
                }),
                onFocusCapture: z(d).onFocusCapture,
                onBlurCapture: z(d).onBlurCapture,
                onPointerdownCapture: z(f).onPointerDownCapture,
              },
              {
                default: oe(() => [fe(h.$slots, "default")]),
                _: 3,
              },
              8,
              [
                "as-child",
                "as",
                "style",
                "onFocusCapture",
                "onBlurCapture",
                "onPointerdownCapture",
              ]
            )
          )
        );
      },
    }),
    al = "focusScope.autoFocusOnMount",
    ll = "focusScope.autoFocusOnUnmount",
    Sd = { bubbles: !1, cancelable: !0 };
  function Hw(e, { select: t = !1 } = {}) {
    const r = document.activeElement;
    for (const n of e)
      if ((en(n, { select: t }), document.activeElement !== r)) return !0;
  }
  function Kw(e) {
    const t = Nm(e),
      r = Nd(t, e),
      n = Nd(t.reverse(), e);
    return [r, n];
  }
  function Nm(e) {
    const t = [],
      r = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
        acceptNode: n => {
          const o = n.tagName === "INPUT" && n.type === "hidden";
          return n.disabled || n.hidden || o
            ? NodeFilter.FILTER_SKIP
            : n.tabIndex >= 0
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_SKIP;
        },
      });
    for (; r.nextNode(); ) t.push(r.currentNode);
    return t;
  }
  function Nd(e, t) {
    for (const r of e) if (!Gw(r, { upTo: t })) return r;
  }
  function Gw(e, { upTo: t }) {
    if (getComputedStyle(e).visibility === "hidden") return !0;
    for (; e; ) {
      if (t !== void 0 && e === t) return !1;
      if (getComputedStyle(e).display === "none") return !0;
      e = e.parentElement;
    }
    return !1;
  }
  function qw(e) {
    return e instanceof HTMLInputElement && "select" in e;
  }
  function en(e, { select: t = !1 } = {}) {
    if (e && e.focus) {
      const r = document.activeElement;
      e.focus({ preventScroll: !0 }), e !== r && qw(e) && t && e.select();
    }
  }
  const Yw = ew(() => Ee([]));
  function Jw() {
    const e = Yw();
    return {
      add(t) {
        const r = e.value[0];
        t !== r && (r == null || r.pause()),
          (e.value = Pd(e.value, t)),
          e.value.unshift(t);
      },
      remove(t) {
        var r;
        (e.value = Pd(e.value, t)), (r = e.value[0]) == null || r.resume();
      },
    };
  }
  function Pd(e, t) {
    const r = [...e],
      n = r.indexOf(t);
    return n !== -1 && r.splice(n, 1), r;
  }
  function Xw(e) {
    return e.filter(t => t.tagName !== "A");
  }
  const Zw = /* @__PURE__ */ ge({
    __name: "FocusScope",
    props: {
      loop: { type: Boolean, default: !1 },
      trapped: { type: Boolean, default: !1 },
      asChild: { type: Boolean },
      as: {},
    },
    emits: ["mountAutoFocus", "unmountAutoFocus"],
    setup(e, { emit: t }) {
      const r = e,
        n = t,
        { currentRef: o, currentElement: i } = We(),
        s = Ee(null),
        a = Jw(),
        l = xi({
          paused: !1,
          pause() {
            this.paused = !0;
          },
          resume() {
            this.paused = !1;
          },
        });
      Jt(u => {
        if (!vn) return;
        const f = i.value;
        if (!r.trapped) return;
        function d(v) {
          if (l.paused || !f) return;
          const g = v.target;
          f.contains(g) ? (s.value = g) : en(s.value, { select: !0 });
        }
        function p(v) {
          if (l.paused || !f) return;
          const g = v.relatedTarget;
          g !== null && (f.contains(g) || en(s.value, { select: !0 }));
        }
        function h(v) {
          f.contains(s.value) || en(f);
        }
        document.addEventListener("focusin", d),
          document.addEventListener("focusout", p);
        const m = new MutationObserver(h);
        f && m.observe(f, { childList: !0, subtree: !0 }),
          u(() => {
            document.removeEventListener("focusin", d),
              document.removeEventListener("focusout", p),
              m.disconnect();
          });
      }),
        Jt(async u => {
          const f = i.value;
          if ((await mn(), !f)) return;
          a.add(l);
          const d = document.activeElement;
          if (!f.contains(d)) {
            const p = new CustomEvent(al, Sd);
            f.addEventListener(al, h => n("mountAutoFocus", h)),
              f.dispatchEvent(p),
              p.defaultPrevented ||
                (Hw(Xw(Nm(f)), {
                  select: !0,
                }),
                document.activeElement === d && en(f));
          }
          u(() => {
            f.removeEventListener(al, m => n("mountAutoFocus", m));
            const p = new CustomEvent(ll, Sd),
              h = m => {
                n("unmountAutoFocus", m);
              };
            f.addEventListener(ll, h),
              f.dispatchEvent(p),
              setTimeout(() => {
                p.defaultPrevented || en(d ?? document.body, { select: !0 }),
                  f.removeEventListener(ll, h),
                  a.remove(l);
              }, 0);
          });
        });
      function c(u) {
        if ((!r.loop && !r.trapped) || l.paused) return;
        const f = u.key === "Tab" && !u.altKey && !u.ctrlKey && !u.metaKey,
          d = document.activeElement;
        if (f && d) {
          const p = u.currentTarget,
            [h, m] = Kw(p);
          h && m
            ? !u.shiftKey && d === m
              ? (u.preventDefault(), r.loop && en(h, { select: !0 }))
              : u.shiftKey &&
                d === h &&
                (u.preventDefault(), r.loop && en(m, { select: !0 }))
            : d === p && u.preventDefault();
        }
      }
      return (u, f) => (
        ue(),
        ve(
          z(St),
          {
            ref_key: "currentRef",
            ref: o,
            tabindex: "-1",
            "as-child": u.asChild,
            as: u.as,
            onKeydown: c,
          },
          {
            default: oe(() => [fe(u.$slots, "default")]),
            _: 3,
          },
          8,
          ["as-child", "as"]
        )
      );
    },
  });
  function Qw(e) {
    return e ? "open" : "closed";
  }
  const eE = "DialogTitle",
    tE = "DialogContent";
  function rE({
    titleName: e = eE,
    contentName: t = tE,
    componentLink: r = "dialog.html#title",
    titleId: n,
    descriptionId: o,
    contentElement: i,
  }) {
    const s = `Warning: \`${t}\` requires a \`${e}\` for the component to be accessible for screen reader users.

If you want to hide the \`${e}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://www.radix-vue.com/components/${r}`,
      a = `Warning: Missing \`Description\` or \`aria-describedby="undefined"\` for ${t}.`;
    zr(() => {
      var l;
      document.getElementById(n) || console.warn(s);
      const c =
        (l = i.value) == null ? void 0 : l.getAttribute("aria-describedby");
      o && !c && (document.getElementById(o) || console.warn(a));
    });
  }
  const Pm = /* @__PURE__ */ ge({
      __name: "DialogContentImpl",
      props: {
        forceMount: { type: Boolean },
        trapFocus: { type: Boolean },
        disableOutsidePointerEvents: { type: Boolean },
        asChild: { type: Boolean },
        as: {},
      },
      emits: [
        "escapeKeyDown",
        "pointerDownOutside",
        "focusOutside",
        "interactOutside",
        "openAutoFocus",
        "closeAutoFocus",
      ],
      setup(e, { emit: t }) {
        const r = e,
          n = t,
          o = wr(),
          { forwardRef: i, currentElement: s } = We();
        return (
          o.titleId || (o.titleId = Ys(void 0, "radix-vue-dialog-title")),
          o.descriptionId ||
            (o.descriptionId = Ys(void 0, "radix-vue-dialog-description")),
          zr(() => {
            (o.contentElement = s),
              document.activeElement !== document.body &&
                (o.triggerElement.value = document.activeElement);
          }),
          {}.NODE_ENV !== "production" &&
            rE({
              titleName: "DialogTitle",
              contentName: "DialogContent",
              componentLink: "dialog.html#title",
              titleId: o.titleId,
              descriptionId: o.descriptionId,
              contentElement: o.contentElement,
            }),
          (a, l) => (
            ue(),
            ve(
              z(Zw),
              {
                "as-child": "",
                loop: "",
                trapped: r.trapFocus,
                onMountAutoFocus: l[5] || (l[5] = c => n("openAutoFocus", c)),
                onUnmountAutoFocus:
                  l[6] || (l[6] = c => n("closeAutoFocus", c)),
              },
              {
                default: oe(() => [
                  Le(
                    z(Sm),
                    pt(
                      {
                        id: z(o).contentId,
                        ref: z(i),
                        as: a.as,
                        "as-child": a.asChild,
                        "disable-outside-pointer-events":
                          a.disableOutsidePointerEvents,
                        role: "dialog",
                        "aria-describedby": z(o).descriptionId,
                        "aria-labelledby": z(o).titleId,
                        "data-state": z(Qw)(z(o).open.value),
                      },
                      a.$attrs,
                      {
                        onDismiss: l[0] || (l[0] = c => z(o).onOpenChange(!1)),
                        onEscapeKeyDown:
                          l[1] || (l[1] = c => n("escapeKeyDown", c)),
                        onFocusOutside:
                          l[2] || (l[2] = c => n("focusOutside", c)),
                        onInteractOutside:
                          l[3] || (l[3] = c => n("interactOutside", c)),
                        onPointerDownOutside:
                          l[4] || (l[4] = c => n("pointerDownOutside", c)),
                      }
                    ),
                    {
                      default: oe(() => [fe(a.$slots, "default")]),
                      _: 3,
                    },
                    16,
                    [
                      "id",
                      "as",
                      "as-child",
                      "disable-outside-pointer-events",
                      "aria-describedby",
                      "aria-labelledby",
                      "data-state",
                    ]
                  ),
                ]),
                _: 3,
              },
              8,
              ["trapped"]
            )
          )
        );
      },
    }),
    nE = /* @__PURE__ */ ge({
      __name: "DialogContentModal",
      props: {
        forceMount: { type: Boolean },
        trapFocus: { type: Boolean },
        disableOutsidePointerEvents: { type: Boolean },
        asChild: { type: Boolean },
        as: {},
      },
      emits: [
        "escapeKeyDown",
        "pointerDownOutside",
        "focusOutside",
        "interactOutside",
        "openAutoFocus",
        "closeAutoFocus",
      ],
      setup(e, { emit: t }) {
        const r = e,
          n = t,
          o = wr(),
          i = Aa(n),
          { forwardRef: s, currentElement: a } = We();
        return (
          xw(a),
          (l, c) => (
            ue(),
            ve(
              Pm,
              pt(
                { ...r, ...z(i) },
                {
                  ref: z(s),
                  "trap-focus": z(o).open.value,
                  "disable-outside-pointer-events": !0,
                  onCloseAutoFocus:
                    c[0] ||
                    (c[0] = u => {
                      var f;
                      u.defaultPrevented ||
                        (u.preventDefault(),
                        (f = z(o).triggerElement.value) == null || f.focus());
                    }),
                  onPointerDownOutside:
                    c[1] ||
                    (c[1] = u => {
                      const f = u.detail.originalEvent,
                        d = f.button === 0 && f.ctrlKey === !0;
                      (f.button === 2 || d) && u.preventDefault();
                    }),
                  onFocusOutside:
                    c[2] ||
                    (c[2] = u => {
                      u.preventDefault();
                    }),
                }
              ),
              {
                default: oe(() => [fe(l.$slots, "default")]),
                _: 3,
              },
              16,
              ["trap-focus"]
            )
          )
        );
      },
    }),
    oE = /* @__PURE__ */ ge({
      __name: "DialogContentNonModal",
      props: {
        forceMount: { type: Boolean },
        trapFocus: { type: Boolean },
        disableOutsidePointerEvents: { type: Boolean },
        asChild: { type: Boolean },
        as: {},
      },
      emits: [
        "escapeKeyDown",
        "pointerDownOutside",
        "focusOutside",
        "interactOutside",
        "openAutoFocus",
        "closeAutoFocus",
      ],
      setup(e, { emit: t }) {
        const r = e,
          n = Aa(t);
        We();
        const o = wr(),
          i = Ee(!1),
          s = Ee(!1);
        return (a, l) => (
          ue(),
          ve(
            Pm,
            pt(
              { ...r, ...z(n) },
              {
                "trap-focus": !1,
                "disable-outside-pointer-events": !1,
                onCloseAutoFocus:
                  l[0] ||
                  (l[0] = c => {
                    var u;
                    c.defaultPrevented ||
                      (i.value ||
                        (u = z(o).triggerElement.value) == null ||
                        u.focus(),
                      c.preventDefault()),
                      (i.value = !1),
                      (s.value = !1);
                  }),
                onInteractOutside:
                  l[1] ||
                  (l[1] = c => {
                    var u;
                    c.defaultPrevented ||
                      ((i.value = !0),
                      c.detail.originalEvent.type === "pointerdown" &&
                        (s.value = !0));
                    const f = c.target;
                    (u = z(o).triggerElement.value) != null &&
                      u.contains(f) &&
                      c.preventDefault(),
                      c.detail.originalEvent.type === "focusin" &&
                        s.value &&
                        c.preventDefault();
                  }),
              }
            ),
            {
              default: oe(() => [fe(a.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    iE = /* @__PURE__ */ ge({
      __name: "DialogContent",
      props: {
        forceMount: { type: Boolean },
        trapFocus: { type: Boolean },
        disableOutsidePointerEvents: { type: Boolean },
        asChild: { type: Boolean },
        as: {},
      },
      emits: [
        "escapeKeyDown",
        "pointerDownOutside",
        "focusOutside",
        "interactOutside",
        "openAutoFocus",
        "closeAutoFocus",
      ],
      setup(e, { emit: t }) {
        const r = e,
          n = t,
          o = wr(),
          i = Aa(n),
          { forwardRef: s } = We();
        return (a, l) => (
          ue(),
          ve(
            z(Qc),
            {
              present: a.forceMount || z(o).open.value,
            },
            {
              default: oe(() => [
                z(o).modal.value
                  ? (ue(),
                    ve(
                      nE,
                      pt(
                        {
                          key: 0,
                          ref: z(s),
                        },
                        { ...r, ...z(i), ...a.$attrs }
                      ),
                      {
                        default: oe(() => [fe(a.$slots, "default")]),
                        _: 3,
                      },
                      16
                    ))
                  : (ue(),
                    ve(
                      oE,
                      pt(
                        {
                          key: 1,
                          ref: z(s),
                        },
                        { ...r, ...z(i), ...a.$attrs }
                      ),
                      {
                        default: oe(() => [fe(a.$slots, "default")]),
                        _: 3,
                      },
                      16
                    )),
              ]),
              _: 3,
            },
            8,
            ["present"]
          )
        );
      },
    }),
    sE = /* @__PURE__ */ ge({
      __name: "DialogOverlayImpl",
      props: {
        asChild: { type: Boolean },
        as: {},
      },
      setup(e) {
        const t = wr();
        return (
          _w(!0),
          We(),
          (r, n) => (
            ue(),
            ve(
              z(St),
              {
                as: r.as,
                "as-child": r.asChild,
                "data-state": z(t).open.value ? "open" : "closed",
                style: { "pointer-events": "auto" },
              },
              {
                default: oe(() => [fe(r.$slots, "default")]),
                _: 3,
              },
              8,
              ["as", "as-child", "data-state"]
            )
          )
        );
      },
    }),
    aE = /* @__PURE__ */ ge({
      __name: "DialogOverlay",
      props: {
        forceMount: { type: Boolean },
        asChild: { type: Boolean },
        as: {},
      },
      setup(e) {
        const t = wr(),
          { forwardRef: r } = We();
        return (n, o) => {
          var i;
          return (i = z(t)) != null && i.modal.value
            ? (ue(),
              ve(
                z(Qc),
                {
                  key: 0,
                  present: n.forceMount || z(t).open.value,
                },
                {
                  default: oe(() => [
                    Le(
                      sE,
                      pt(n.$attrs, {
                        ref: z(r),
                        as: n.as,
                        "as-child": n.asChild,
                      }),
                      {
                        default: oe(() => [fe(n.$slots, "default")]),
                        _: 3,
                      },
                      16,
                      ["as", "as-child"]
                    ),
                  ]),
                  _: 3,
                },
                8,
                ["present"]
              ))
            : mr("", !0);
        };
      },
    }),
    lE = /* @__PURE__ */ ge({
      __name: "DialogClose",
      props: {
        asChild: { type: Boolean },
        as: { default: "button" },
      },
      setup(e) {
        const t = e;
        We();
        const r = wr();
        return (n, o) => (
          ue(),
          ve(
            z(St),
            pt(t, {
              type: n.as === "button" ? "button" : void 0,
              onClick: o[0] || (o[0] = i => z(r).onOpenChange(!1)),
            }),
            {
              default: oe(() => [fe(n.$slots, "default")]),
              _: 3,
            },
            16,
            ["type"]
          )
        );
      },
    }),
    cE = /* @__PURE__ */ ge({
      __name: "DialogTitle",
      props: {
        asChild: { type: Boolean },
        as: { default: "h2" },
      },
      setup(e) {
        const t = e,
          r = wr();
        return (
          We(),
          (n, o) => (
            ue(),
            ve(
              z(St),
              pt(t, {
                id: z(r).titleId,
              }),
              {
                default: oe(() => [fe(n.$slots, "default")]),
                _: 3,
              },
              16,
              ["id"]
            )
          )
        );
      },
    }),
    uE = /* @__PURE__ */ ge({
      __name: "DialogDescription",
      props: {
        asChild: { type: Boolean },
        as: { default: "p" },
      },
      setup(e) {
        const t = e;
        We();
        const r = wr();
        return (n, o) => (
          ue(),
          ve(
            z(St),
            pt(t, {
              id: z(r).descriptionId,
            }),
            {
              default: oe(() => [fe(n.$slots, "default")]),
              _: 3,
            },
            16,
            ["id"]
          )
        );
      },
    }),
    [Cm, fE] = Jn("AvatarRoot"),
    dE = /* @__PURE__ */ ge({
      __name: "AvatarRoot",
      props: {
        asChild: { type: Boolean },
        as: { default: "span" },
      },
      setup(e) {
        return (
          We(),
          fE({
            imageLoadingStatus: Ee("loading"),
          }),
          (t, r) => (
            ue(),
            ve(
              z(St),
              {
                "as-child": t.asChild,
                as: t.as,
              },
              {
                default: oe(() => [fe(t.$slots, "default")]),
                _: 3,
              },
              8,
              ["as-child", "as"]
            )
          )
        );
      },
    });
  function pE(e) {
    const t = Ee("idle"),
      r = Ee(!1),
      n = o => () => {
        r.value && (t.value = o);
      };
    return (
      zr(() => {
        (r.value = !0),
          vt(
            e,
            o => {
              if (!o) t.value = "error";
              else {
                const i = new window.Image();
                (t.value = "loading"),
                  (i.onload = n("loaded")),
                  (i.onerror = n("error")),
                  (i.src = o);
              }
            },
            { immediate: !0 }
          );
      }),
      Ri(() => {
        r.value = !1;
      }),
      t
    );
  }
  const hE = /* @__PURE__ */ ge({
      __name: "AvatarImage",
      props: {
        src: {},
        asChild: { type: Boolean },
        as: { default: "img" },
      },
      emits: ["loadingStatusChange"],
      setup(e, { emit: t }) {
        const r = e,
          n = t,
          { src: o } = xt(r);
        We();
        const i = Cm(),
          s = pE(o);
        return (
          vt(
            s,
            a => {
              n("loadingStatusChange", a),
                a !== "idle" && (i.imageLoadingStatus.value = a);
            },
            { immediate: !0 }
          ),
          (a, l) =>
            N$(
              (ue(),
              ve(
                z(St),
                {
                  role: "img",
                  "as-child": a.asChild,
                  as: a.as,
                  src: z(o),
                },
                {
                  default: oe(() => [fe(a.$slots, "default")]),
                  _: 3,
                },
                8,
                ["as-child", "as", "src"]
              )),
              [[am, z(s) === "loaded"]]
            )
        );
      },
    }),
    gE = /* @__PURE__ */ ge({
      __name: "AvatarFallback",
      props: {
        delayMs: { default: 0 },
        asChild: { type: Boolean },
        as: { default: "span" },
      },
      setup(e) {
        const t = e,
          r = Cm();
        We();
        const n = Ee(!1);
        let o;
        return (
          vt(
            r.imageLoadingStatus,
            i => {
              i === "loading" &&
                ((n.value = !1),
                t.delayMs
                  ? (o = setTimeout(() => {
                      (n.value = !0), clearTimeout(o);
                    }, t.delayMs))
                  : (n.value = !0));
            },
            { immediate: !0 }
          ),
          (i, s) =>
            n.value && z(r).imageLoadingStatus.value !== "loaded"
              ? (ue(),
                ve(
                  z(St),
                  {
                    key: 0,
                    "as-child": i.asChild,
                    as: i.as,
                  },
                  {
                    default: oe(() => [fe(i.$slots, "default")]),
                    _: 3,
                  },
                  8,
                  ["as-child", "as"]
                ))
              : mr("", !0)
        );
      },
    }),
    [Tm, mE] = Jn("PopperRoot"),
    vE = /* @__PURE__ */ ge({
      __name: "PopperRoot",
      setup(e) {
        const t = Ee();
        return (
          mE({
            anchor: t,
            onAnchorChange: r => (t.value = r),
          }),
          (r, n) => fe(r.$slots, "default")
        );
      },
    }),
    yE = /* @__PURE__ */ ge({
      __name: "PopperAnchor",
      props: {
        element: {},
        asChild: { type: Boolean },
        as: {},
      },
      setup(e) {
        const t = e,
          { forwardRef: r, currentElement: n } = We(),
          o = Tm();
        return (
          vt(n, () => {
            o.onAnchorChange(t.element ?? n.value);
          }),
          (i, s) => (
            ue(),
            ve(
              z(St),
              {
                ref: z(r),
                as: i.as,
                "as-child": i.asChild,
              },
              {
                default: oe(() => [fe(i.$slots, "default")]),
                _: 3,
              },
              8,
              ["as", "as-child"]
            )
          )
        );
      },
    });
  function _E(e) {
    return e !== null;
  }
  function $E(e) {
    return {
      name: "transformOrigin",
      options: e,
      fn(t) {
        var r, n, o;
        const { placement: i, rects: s, middlewareData: a } = t,
          l = ((r = a.arrow) == null ? void 0 : r.centerOffset) !== 0,
          c = l ? 0 : e.arrowWidth,
          u = l ? 0 : e.arrowHeight,
          [f, d] = Zl(i),
          p = { start: "0%", center: "50%", end: "100%" }[d],
          h = (((n = a.arrow) == null ? void 0 : n.x) ?? 0) + c / 2,
          m = (((o = a.arrow) == null ? void 0 : o.y) ?? 0) + u / 2;
        let v = "",
          g = "";
        return (
          f === "bottom"
            ? ((v = l ? p : `${h}px`), (g = `${-u}px`))
            : f === "top"
              ? ((v = l ? p : `${h}px`), (g = `${s.floating.height + u}px`))
              : f === "right"
                ? ((v = `${-u}px`), (g = l ? p : `${m}px`))
                : f === "left" &&
                  ((v = `${s.floating.width + u}px`), (g = l ? p : `${m}px`)),
          { data: { x: v, y: g } }
        );
      },
    };
  }
  function Zl(e) {
    const [t, r = "center"] = e.split("-");
    return [t, r];
  }
  const bE = {
      side: "bottom",
      sideOffset: 0,
      align: "center",
      alignOffset: 0,
      arrowPadding: 0,
      avoidCollisions: !0,
      collisionBoundary: () => [],
      collisionPadding: 0,
      sticky: "partial",
      hideWhenDetached: !1,
      updatePositionStrategy: "optimized",
      prioritizePosition: !1,
    },
    [wE, EE] = Jn("PopperContent"),
    OE = /* @__PURE__ */ ge({
      inheritAttrs: !1,
      __name: "PopperContent",
      props: /* @__PURE__ */ W$(
        {
          side: {},
          sideOffset: {},
          align: {},
          alignOffset: {},
          avoidCollisions: { type: Boolean },
          collisionBoundary: {},
          collisionPadding: {},
          arrowPadding: {},
          sticky: {},
          hideWhenDetached: { type: Boolean },
          updatePositionStrategy: {},
          prioritizePosition: { type: Boolean },
          asChild: { type: Boolean },
          as: {},
        },
        {
          ...bE,
        }
      ),
      emits: ["placed"],
      setup(e, { emit: t }) {
        const r = e,
          n = t,
          o = Tm(),
          { forwardRef: i, currentElement: s } = We(),
          a = Ee(),
          l = Ee(),
          { width: c, height: u } = Iw(l),
          f = Oe(() => r.side + (r.align !== "center" ? `-${r.align}` : "")),
          d = Oe(() =>
            typeof r.collisionPadding == "number"
              ? r.collisionPadding
              : { top: 0, right: 0, bottom: 0, left: 0, ...r.collisionPadding }
          ),
          p = Oe(() =>
            Array.isArray(r.collisionBoundary)
              ? r.collisionBoundary
              : [r.collisionBoundary]
          ),
          h = Oe(() => ({
            padding: d.value,
            boundary: p.value.filter(_E),
            // with `strategy: 'fixed'`, this is the only way to get it to respect boundaries
            altBoundary: p.value.length > 0,
          })),
          m = Z0(() => [
            $0({
              mainAxis: r.sideOffset + u.value,
              alignmentAxis: r.alignOffset,
            }),
            r.prioritizePosition &&
              r.avoidCollisions &&
              Ed({
                ...h.value,
              }),
            r.avoidCollisions &&
              U0({
                mainAxis: !0,
                crossAxis: !!r.prioritizePosition,
                limiter: r.sticky === "partial" ? G0() : void 0,
                ...h.value,
              }),
            !r.prioritizePosition &&
              r.avoidCollisions &&
              Ed({
                ...h.value,
              }),
            W0({
              ...h.value,
              apply: ({
                elements: W,
                rects: re,
                availableWidth: G,
                availableHeight: Se,
              }) => {
                const { width: ce, height: Pe } = re.reference,
                  _e = W.floating.style;
                _e.setProperty("--radix-popper-available-width", `${G}px`),
                  _e.setProperty("--radix-popper-available-height", `${Se}px`),
                  _e.setProperty("--radix-popper-anchor-width", `${ce}px`),
                  _e.setProperty("--radix-popper-anchor-height", `${Pe}px`);
              },
            }),
            l.value && J0({ element: l.value, padding: r.arrowPadding }),
            $E({
              arrowWidth: c.value,
              arrowHeight: u.value,
            }),
            r.hideWhenDetached &&
              H0({ strategy: "referenceHidden", ...h.value }),
          ]),
          {
            floatingStyles: v,
            placement: g,
            isPositioned: _,
            middlewareData: E,
          } = X0(o.anchor, a, {
            strategy: "fixed",
            placement: f,
            whileElementsMounted: (...W) =>
              z0(...W, {
                animationFrame: r.updatePositionStrategy === "always",
              }),
            middleware: m,
          }),
          A = Oe(() => Zl(g.value)[0]),
          D = Oe(() => Zl(g.value)[1]);
        Jt(() => {
          _.value && n("placed");
        });
        const S = Oe(() => {
            var W;
            return (
              ((W = E.value.arrow) == null ? void 0 : W.centerOffset) !== 0
            );
          }),
          O = Ee("");
        Jt(() => {
          s.value && (O.value = window.getComputedStyle(s.value).zIndex);
        });
        const j = Oe(() => {
            var W;
            return ((W = E.value.arrow) == null ? void 0 : W.x) ?? 0;
          }),
          B = Oe(() => {
            var W;
            return ((W = E.value.arrow) == null ? void 0 : W.y) ?? 0;
          });
        return (
          EE({
            placedSide: A,
            onArrowChange: W => (l.value = W),
            arrowX: j,
            arrowY: B,
            shouldHideArrow: S,
          }),
          (W, re) => {
            var G, Se, ce;
            return (
              ue(),
              Po(
                "div",
                {
                  ref_key: "floatingRef",
                  ref: a,
                  "data-radix-popper-content-wrapper": "",
                  style: Gn({
                    ...z(v),
                    transform: z(_) ? z(v).transform : "translate(0, -200%)",
                    // keep off the page when measuring
                    minWidth: "max-content",
                    zIndex: O.value,
                    "--radix-popper-transform-origin": [
                      (G = z(E).transformOrigin) == null ? void 0 : G.x,
                      (Se = z(E).transformOrigin) == null ? void 0 : Se.y,
                    ].join(" "),
                    // hide the content if using the hide middleware and should be hidden
                    // set visibility to hidden and disable pointer events so the UI behaves
                    // as if the PopperContent isn't there at all
                    ...(((ce = z(E).hide) == null
                      ? void 0
                      : ce.referenceHidden) && {
                      visibility: "hidden",
                      pointerEvents: "none",
                    }),
                  }),
                },
                [
                  Le(
                    z(St),
                    pt({ ref: z(i) }, W.$attrs, {
                      "as-child": r.asChild,
                      as: W.as,
                      "data-side": A.value,
                      "data-align": D.value,
                      style: {
                        // if the PopperContent hasn't been placed yet (not all measurements done)
                        // we prevent animations so that users's animation don't kick in too early referring wrong sides
                        animation: z(_) ? void 0 : "none",
                      },
                    }),
                    {
                      default: oe(() => [fe(W.$slots, "default")]),
                      _: 3,
                    },
                    16,
                    ["as-child", "as", "data-side", "data-align", "style"]
                  ),
                ],
                4
              )
            );
          }
        );
      },
    }),
    AE = /* @__PURE__ */ qn("polygon", { points: "0,0 30,0 15,10" }, null, -1),
    SE = /* @__PURE__ */ ge({
      __name: "Arrow",
      props: {
        width: { default: 10 },
        height: { default: 5 },
        asChild: { type: Boolean },
        as: { default: "svg" },
      },
      setup(e) {
        const t = e;
        return (
          We(),
          (r, n) => (
            ue(),
            ve(
              z(St),
              pt(t, {
                width: r.width,
                height: r.height,
                viewBox: r.asChild ? void 0 : "0 0 30 10",
                preserveAspectRatio: r.asChild ? void 0 : "none",
              }),
              {
                default: oe(() => [fe(r.$slots, "default", {}, () => [AE])]),
                _: 3,
              },
              16,
              ["width", "height", "viewBox", "preserveAspectRatio"]
            )
          )
        );
      },
    }),
    NE = {
      top: "bottom",
      right: "left",
      bottom: "top",
      left: "right",
    },
    PE = /* @__PURE__ */ ge({
      inheritAttrs: !1,
      __name: "PopperArrow",
      props: {
        width: {},
        height: {},
        asChild: { type: Boolean },
        as: { default: "svg" },
      },
      setup(e) {
        const { forwardRef: t } = We(),
          r = wE(),
          n = Oe(() => NE[r.placedSide.value]);
        return (o, i) => {
          var s, a, l, c;
          return (
            ue(),
            Po(
              "span",
              {
                ref: u => {
                  z(r).onArrowChange(u);
                },
                style: Gn({
                  position: "absolute",
                  left:
                    (s = z(r).arrowX) != null && s.value
                      ? `${(a = z(r).arrowX) == null ? void 0 : a.value}px`
                      : void 0,
                  top:
                    (l = z(r).arrowY) != null && l.value
                      ? `${(c = z(r).arrowY) == null ? void 0 : c.value}px`
                      : void 0,
                  [n.value]: 0,
                  transformOrigin: {
                    top: "",
                    right: "0 0",
                    bottom: "center 0",
                    left: "100% 0",
                  }[z(r).placedSide.value],
                  transform: {
                    top: "translateY(100%)",
                    right: "translateY(50%) rotate(90deg) translateX(-50%)",
                    bottom: "rotate(180deg)",
                    left: "translateY(50%) rotate(-90deg) translateX(50%)",
                  }[z(r).placedSide.value],
                  visibility: z(r).shouldHideArrow.value ? "hidden" : void 0,
                }),
              },
              [
                Le(
                  SE,
                  pt(o.$attrs, {
                    ref: z(t),
                    style: {
                      display: "block",
                    },
                    as: o.as,
                    "as-child": o.asChild,
                    width: o.width,
                    height: o.height,
                  }),
                  {
                    default: oe(() => [fe(o.$slots, "default")]),
                    _: 3,
                  },
                  16,
                  ["as", "as-child", "width", "height"]
                ),
              ],
              4
            )
          );
        };
      },
    }),
    CE = /* @__PURE__ */ ge({
      __name: "VisuallyHidden",
      props: {
        asChild: { type: Boolean },
        as: { default: "span" },
      },
      setup(e) {
        return (
          We(),
          (t, r) => (
            ue(),
            ve(
              z(St),
              {
                as: t.as,
                "as-child": t.asChild,
                style: {
                  // See: https://github.com/twbs/bootstrap/blob/master/scss/mixins/_screen-reader.scss
                  position: "absolute",
                  border: 0,
                  width: "1px",
                  display: "inline-block",
                  height: "1px",
                  padding: 0,
                  margin: "-1px",
                  overflow: "hidden",
                  clip: "rect(0, 0, 0, 0)",
                  whiteSpace: "nowrap",
                  wordWrap: "normal",
                },
              },
              {
                default: oe(() => [fe(t.$slots, "default")]),
                _: 3,
              },
              8,
              ["as", "as-child"]
            )
          )
        );
      },
    });
  function TE() {
    if (typeof matchMedia == "function")
      return matchMedia("(pointer:coarse)").matches ? "coarse" : "fine";
  }
  TE();
  const xm = "tooltip.open",
    [eu, xE] = Jn("TooltipProvider"),
    DE = /* @__PURE__ */ ge({
      __name: "TooltipProvider",
      props: {
        delayDuration: { default: 700 },
        skipDelayDuration: { default: 300 },
        disableHoverableContent: { type: Boolean, default: !1 },
        disableClosingTrigger: { type: Boolean },
        disabled: { type: Boolean },
        ignoreNonKeyboardFocus: { type: Boolean, default: !1 },
      },
      setup(e) {
        const t = e,
          {
            delayDuration: r,
            skipDelayDuration: n,
            disableHoverableContent: o,
            disableClosingTrigger: i,
            ignoreNonKeyboardFocus: s,
            disabled: a,
          } = xt(t);
        We();
        const l = Ee(!0),
          c = Ee(!1),
          { start: u, stop: f } = ym(
            () => {
              l.value = !0;
            },
            n,
            { immediate: !1 }
          );
        return (
          xE({
            isOpenDelayed: l,
            delayDuration: r,
            onOpen() {
              f(), (l.value = !1);
            },
            onClose() {
              u();
            },
            isPointerInTransitRef: c,
            disableHoverableContent: o,
            disableClosingTrigger: i,
            disabled: a,
            ignoreNonKeyboardFocus: s,
          }),
          (d, p) => fe(d.$slots, "default")
        );
      },
    }),
    [Sa, IE] = Jn("TooltipRoot"),
    RE = /* @__PURE__ */ ge({
      __name: "TooltipRoot",
      props: {
        defaultOpen: { type: Boolean, default: !1 },
        open: { type: Boolean, default: void 0 },
        delayDuration: { default: void 0 },
        disableHoverableContent: { type: Boolean, default: void 0 },
        disableClosingTrigger: { type: Boolean, default: void 0 },
        disabled: { type: Boolean, default: void 0 },
        ignoreNonKeyboardFocus: { type: Boolean, default: void 0 },
      },
      emits: ["update:open"],
      setup(e, { emit: t }) {
        const r = e,
          n = t;
        We();
        const o = eu(),
          i = Oe(
            () => r.disableHoverableContent ?? o.disableHoverableContent.value
          ),
          s = Oe(
            () => r.disableClosingTrigger ?? o.disableClosingTrigger.value
          ),
          a = Oe(() => r.disabled ?? o.disabled.value),
          l = Oe(() => r.delayDuration ?? o.delayDuration.value),
          c = Oe(
            () => r.ignoreNonKeyboardFocus ?? o.ignoreNonKeyboardFocus.value
          ),
          u = $m(r, "open", n, {
            defaultValue: r.defaultOpen,
            passive: r.open === void 0,
          });
        vt(u, E => {
          o.onClose &&
            (E
              ? (o.onOpen(), document.dispatchEvent(new CustomEvent(xm)))
              : o.onClose());
        });
        const f = Ee(!1),
          d = Ee(),
          p = Oe(() =>
            u.value ? (f.value ? "delayed-open" : "instant-open") : "closed"
          ),
          { start: h, stop: m } = ym(
            () => {
              (f.value = !0), (u.value = !0);
            },
            l,
            { immediate: !1 }
          );
        function v() {
          m(), (f.value = !1), (u.value = !0);
        }
        function g() {
          m(), (u.value = !1);
        }
        function _() {
          h();
        }
        return (
          IE({
            contentId: "",
            open: u,
            stateAttribute: p,
            trigger: d,
            onTriggerChange(E) {
              d.value = E;
            },
            onTriggerEnter() {
              o.isOpenDelayed.value ? _() : v();
            },
            onTriggerLeave() {
              i.value ? g() : m();
            },
            onOpen: v,
            onClose: g,
            disableHoverableContent: i,
            disableClosingTrigger: s,
            disabled: a,
            ignoreNonKeyboardFocus: c,
          }),
          (E, A) => (
            ue(),
            ve(z(vE), null, {
              default: oe(() => [fe(E.$slots, "default", { open: z(u) })]),
              _: 3,
            })
          )
        );
      },
    }),
    ME = /* @__PURE__ */ ge({
      __name: "TooltipTrigger",
      props: {
        asChild: { type: Boolean },
        as: { default: "button" },
      },
      setup(e) {
        const t = e,
          r = Sa(),
          n = eu();
        r.contentId || (r.contentId = Ys(void 0, "radix-vue-tooltip-content"));
        const { forwardRef: o, currentElement: i } = We(),
          s = Ee(!1),
          a = Ee(!1),
          l = Oe(() =>
            r.disabled.value
              ? {}
              : {
                  click: m,
                  focus: p,
                  pointermove: f,
                  pointerleave: d,
                  pointerdown: u,
                  blur: h,
                }
          );
        zr(() => {
          r.onTriggerChange(i.value);
        });
        function c() {
          s.value = !1;
        }
        function u() {
          (s.value = !0),
            document.addEventListener("pointerup", c, { once: !0 });
        }
        function f(v) {
          v.pointerType !== "touch" &&
            !a.value &&
            !n.isPointerInTransitRef.value &&
            (r.onTriggerEnter(), (a.value = !0));
        }
        function d() {
          r.onTriggerLeave(), (a.value = !1);
        }
        function p(v) {
          var g, _;
          s.value ||
            (r.ignoreNonKeyboardFocus.value &&
              !(
                (_ = (g = v.target).matches) != null &&
                _.call(g, ":focus-visible")
              )) ||
            r.onOpen();
        }
        function h() {
          r.onClose();
        }
        function m() {
          r.disableClosingTrigger.value || r.onClose();
        }
        return (v, g) => (
          ue(),
          ve(
            z(yE),
            { "as-child": "" },
            {
              default: oe(() => [
                Le(
                  z(St),
                  pt(
                    {
                      ref: z(o),
                      "aria-describedby": z(r).open.value
                        ? z(r).contentId
                        : void 0,
                      "data-state": z(r).stateAttribute.value,
                      as: v.as,
                      "as-child": t.asChild,
                      "data-grace-area-trigger": "",
                    },
                    L$(l.value)
                  ),
                  {
                    default: oe(() => [fe(v.$slots, "default")]),
                    _: 3,
                  },
                  16,
                  ["aria-describedby", "data-state", "as", "as-child"]
                ),
              ]),
              _: 3,
            }
          )
        );
      },
    }),
    Dm = /* @__PURE__ */ ge({
      __name: "TooltipContentImpl",
      props: {
        ariaLabel: {},
        asChild: { type: Boolean },
        as: {},
        side: { default: "top" },
        sideOffset: { default: 0 },
        align: { default: "center" },
        alignOffset: {},
        avoidCollisions: { type: Boolean, default: !0 },
        collisionBoundary: { default: () => [] },
        collisionPadding: { default: 0 },
        arrowPadding: { default: 0 },
        sticky: { default: "partial" },
        hideWhenDetached: { type: Boolean, default: !1 },
      },
      emits: ["escapeKeyDown", "pointerDownOutside"],
      setup(e, { emit: t }) {
        const r = e,
          n = t,
          o = Sa(),
          { forwardRef: i } = We(),
          s = z$(),
          a = Oe(() => {
            var u;
            return (u = s.default) == null ? void 0 : u.call(s);
          }),
          l = Oe(() => {
            var u;
            if (r.ariaLabel) return r.ariaLabel;
            let f = "";
            function d(p) {
              typeof p.children == "string"
                ? (f += p.children)
                : Array.isArray(p.children) && p.children.forEach(h => d(h));
            }
            return (u = a.value) == null || u.forEach(p => d(p)), f;
          }),
          c = Oe(() => {
            const { ariaLabel: u, ...f } = r;
            return f;
          });
        return (
          zr(() => {
            qs(window, "scroll", u => {
              const f = u.target;
              f != null && f.contains(o.trigger.value) && o.onClose();
            }),
              qs(window, xm, o.onClose);
          }),
          (u, f) => (
            ue(),
            ve(
              z(Sm),
              {
                "as-child": "",
                "disable-outside-pointer-events": !1,
                onEscapeKeyDown: f[0] || (f[0] = d => n("escapeKeyDown", d)),
                onPointerDownOutside:
                  f[1] ||
                  (f[1] = d => {
                    var p;
                    z(o).disableClosingTrigger.value &&
                      (p = z(o).trigger.value) != null &&
                      p.contains(d.target) &&
                      d.preventDefault(),
                      n("pointerDownOutside", d);
                  }),
                onFocusOutside: f[2] || (f[2] = n0(() => {}, ["prevent"])),
                onDismiss: f[3] || (f[3] = d => z(o).onClose()),
              },
              {
                default: oe(() => [
                  Le(
                    z(OE),
                    pt(
                      {
                        ref: z(i),
                        "data-state": z(o).stateAttribute.value,
                      },
                      { ...u.$attrs, ...c.value },
                      {
                        style: {
                          "--radix-tooltip-content-transform-origin":
                            "var(--radix-popper-transform-origin)",
                          "--radix-tooltip-content-available-width":
                            "var(--radix-popper-available-width)",
                          "--radix-tooltip-content-available-height":
                            "var(--radix-popper-available-height)",
                          "--radix-tooltip-trigger-width":
                            "var(--radix-popper-anchor-width)",
                          "--radix-tooltip-trigger-height":
                            "var(--radix-popper-anchor-height)",
                        },
                      }
                    ),
                    {
                      default: oe(() => [
                        fe(u.$slots, "default"),
                        Le(
                          z(CE),
                          {
                            id: z(o).contentId,
                            role: "tooltip",
                          },
                          {
                            default: oe(() => [$o(kn(l.value), 1)]),
                            _: 1,
                          },
                          8,
                          ["id"]
                        ),
                      ]),
                      _: 3,
                    },
                    16,
                    ["data-state"]
                  ),
                ]),
                _: 3,
              }
            )
          )
        );
      },
    }),
    jE = /* @__PURE__ */ ge({
      __name: "TooltipContentHoverable",
      props: {
        ariaLabel: {},
        asChild: { type: Boolean },
        as: {},
        side: {},
        sideOffset: {},
        align: {},
        alignOffset: {},
        avoidCollisions: { type: Boolean },
        collisionBoundary: {},
        collisionPadding: {},
        arrowPadding: {},
        sticky: {},
        hideWhenDetached: { type: Boolean },
      },
      setup(e) {
        const t = wm(e),
          { forwardRef: r, currentElement: n } = We(),
          { trigger: o, onClose: i } = Sa(),
          s = eu(),
          { isPointerInTransit: a, onPointerExit: l } = $w(o, n);
        return (
          (s.isPointerInTransitRef = a),
          l(() => {
            i();
          }),
          (c, u) => (
            ue(),
            ve(
              Dm,
              pt({ ref: z(r) }, z(t)),
              {
                default: oe(() => [fe(c.$slots, "default")]),
                _: 3,
              },
              16
            )
          )
        );
      },
    }),
    FE = /* @__PURE__ */ ge({
      __name: "TooltipContent",
      props: {
        forceMount: { type: Boolean },
        ariaLabel: {},
        asChild: { type: Boolean },
        as: {},
        side: { default: "top" },
        sideOffset: {},
        align: {},
        alignOffset: {},
        avoidCollisions: { type: Boolean },
        collisionBoundary: {},
        collisionPadding: {},
        arrowPadding: {},
        sticky: {},
        hideWhenDetached: { type: Boolean },
      },
      emits: ["escapeKeyDown", "pointerDownOutside"],
      setup(e, { emit: t }) {
        const r = e,
          n = t,
          o = Sa(),
          i = Zc(r, n),
          { forwardRef: s } = We();
        return (a, l) => (
          ue(),
          ve(
            z(Qc),
            {
              present: a.forceMount || z(o).open.value,
            },
            {
              default: oe(() => [
                (ue(),
                ve(
                  b$(z(o).disableHoverableContent.value ? Dm : jE),
                  pt({ ref: z(s) }, z(i)),
                  {
                    default: oe(() => [fe(a.$slots, "default")]),
                    _: 3,
                  },
                  16
                )),
              ]),
              _: 3,
            },
            8,
            ["present"]
          )
        );
      },
    }),
    LE = /* @__PURE__ */ ge({
      __name: "TooltipArrow",
      props: {
        width: { default: 10 },
        height: { default: 5 },
        asChild: { type: Boolean },
        as: { default: "svg" },
      },
      setup(e) {
        const t = e;
        return (
          We(),
          (r, n) => (
            ue(),
            ve(
              z(PE),
              No(Yn(t)),
              {
                default: oe(() => [fe(r.$slots, "default")]),
                _: 3,
              },
              16
            )
          )
        );
      },
    }),
    VE = /* @__PURE__ */ ge({
      __name: "TooltipPortal",
      props: {
        to: {},
        disabled: { type: Boolean },
        forceMount: { type: Boolean },
      },
      setup(e) {
        const t = e;
        return (r, n) => (
          ue(),
          ve(
            z(Om),
            No(Yn(t)),
            {
              default: oe(() => [fe(r.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    });
  function Im(e) {
    var t,
      r,
      n = "";
    if (typeof e == "string" || typeof e == "number") n += e;
    else if (typeof e == "object")
      if (Array.isArray(e))
        for (t = 0; t < e.length; t++)
          e[t] && (r = Im(e[t])) && (n && (n += " "), (n += r));
      else for (t in e) e[t] && (n && (n += " "), (n += t));
    return n;
  }
  function Rm() {
    for (var e, t, r = 0, n = ""; r < arguments.length; )
      (e = arguments[r++]) && (t = Im(e)) && (n && (n += " "), (n += t));
    return n;
  }
  const Cd = e => (typeof e == "boolean" ? "".concat(e) : e === 0 ? "0" : e),
    Td = Rm,
    gt = (e, t) => r => {
      var n;
      if ((t == null ? void 0 : t.variants) == null)
        return Td(
          e,
          r == null ? void 0 : r.class,
          r == null ? void 0 : r.className
        );
      const { variants: o, defaultVariants: i } = t,
        s = Object.keys(o).map(c => {
          const u = r == null ? void 0 : r[c],
            f = i == null ? void 0 : i[c];
          if (u === null) return null;
          const d = Cd(u) || Cd(f);
          return o[c][d];
        }),
        a =
          r &&
          Object.entries(r).reduce((c, u) => {
            let [f, d] = u;
            return d === void 0 || (c[f] = d), c;
          }, {}),
        l =
          t == null || (n = t.compoundVariants) === null || n === void 0
            ? void 0
            : n.reduce((c, u) => {
                let { class: f, className: d, ...p } = u;
                return Object.entries(p).every(h => {
                  let [m, v] = h;
                  return Array.isArray(v)
                    ? v.includes(
                        {
                          ...i,
                          ...a,
                        }[m]
                      )
                    : {
                        ...i,
                        ...a,
                      }[m] === v;
                })
                  ? [...c, f, d]
                  : c;
              }, []);
      return Td(
        e,
        s,
        l,
        r == null ? void 0 : r.class,
        r == null ? void 0 : r.className
      );
    },
    kE = gt(
      "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:!opacity-50",
      {
        variants: {
          variant: {
            flat: "border-transparent hover:bg-opacity-90",
            outline:
              "bg-opacity-0 hover:border-opacity-80 hover:text-opacity-80",
            ghost: "border-transparent bg-opacity-0 hover:bg-opacity-90",
            link: "border-transparent bg-transparent underline-offset-4 hover:underline",
            tonal: "border border-transparent",
          },
          color: {
            base: "text-base-background bg-base-foreground",
            primary: "bg-primary text-primary-foreground",
            secondary: "bg-secondary text-secondary-foreground",
            accent: "bg-accent text-accent-foreground",
            promotion: "bg-promotion text-promotion-foreground",
            destructive: "bg-error text-error-foreground",
            success: "bg-success text-success-foreground",
            info: "bg-info text-info-foreground",
            error: "bg-error text-error-foreground",
            warning: "bg-warning text-warning-foreground",
          },
          size: {
            md: "h-10 gap-x-2 px-4 py-1",
            xs: "h-7 gap-x-1 px-2 py-1",
            sm: "h-9 gap-x-2 px-3 py-1",
            lg: "h-11 gap-x-2 px-8 py-1",
            icon: "h-10 w-10 gap-x-2 px-2 py-1 ",
          },
          block: {
            true: "w-full basis-full",
          },
        },
        compoundVariants: [
          // --- outline
          {
            color: "base",
            variant: "outline",
            class: "border-base-foreground text-base-foreground",
          },
          {
            color: "primary",
            variant: "outline",
            class: "border-primary text-primary",
          },
          {
            color: "secondary",
            variant: "outline",
            class: "border-secondary text-secondary",
          },
          {
            color: "accent",
            variant: "outline",
            class: "border-accent text-accent",
          },
          {
            color: "promotion",
            variant: "outline",
            class: "border-promotion text-promotion",
          },
          {
            color: "destructive",
            variant: "outline",
            class: "border-error text-error",
          },
          {
            color: "success",
            variant: "outline",
            class: "border-success text-success",
          },
          { color: "info", variant: "outline", class: "border-info text-info" },
          {
            color: "error",
            variant: "outline",
            class: "border-error text-error",
          },
          {
            color: "warning",
            variant: "outline",
            class: "border-warning text-warning",
          },
          // --- tonal
          {
            color: "base",
            variant: "tonal",
            class: "bg-base-200 text-base-foreground hover:bg-base-300",
          },
          {
            color: "primary",
            variant: "tonal",
            class: "bg-primary-50 text-primary hover:bg-primary-100",
          },
          {
            color: "secondary",
            variant: "tonal",
            class: "bg-secondary-50 text-secondary hover:bg-secondary-100",
          },
          {
            color: "accent",
            variant: "tonal",
            class: "bg-accent-50 text-accent hover:bg-accent-100",
          },
          {
            color: "promotion",
            variant: "tonal",
            class: "bg-promotion-50 text-promotion hover:bg-promotion-100",
          },
          {
            color: "destructive",
            variant: "tonal",
            class: "bg-error-50 text-error hover:bg-error-100",
          },
          {
            color: "success",
            variant: "tonal",
            class: "bg-success-50 text-success hover:bg-success-100",
          },
          {
            color: "info",
            variant: "tonal",
            class: "bg-info-50 text-info hover:bg-info-100",
          },
          {
            color: "error",
            variant: "tonal",
            class: "bg-error-50 text-error hover:bg-error-100",
          },
          {
            color: "warning",
            variant: "tonal",
            class: "bg-warning-50 text-warning hover:bg-warning-100",
          },
          // --- ghost
          {
            color: "base",
            variant: "ghost",
            class: "bg-base-200 text-base-foreground",
          },
          {
            color: "primary",
            variant: "ghost",
            class: "bg-primary-50 text-primary",
          },
          {
            color: "secondary",
            variant: "ghost",
            class: "bg-secondary-50 text-secondary",
          },
          {
            color: "accent",
            variant: "ghost",
            class: "bg-accent-50 text-accent",
          },
          {
            color: "promotion",
            variant: "ghost",
            class: "bg-promotion-50 text-promotion",
          },
          {
            color: "destructive",
            variant: "ghost",
            class: "bg-error-50 text-error",
          },
          {
            color: "success",
            variant: "ghost",
            class: "bg-success-50 text-success",
          },
          { color: "info", variant: "ghost", class: "bg-info-50 text-info" },
          { color: "error", variant: "ghost", class: "bg-error-50 text-error" },
          {
            color: "warning",
            variant: "ghost",
            class: "bg-warning-50 text-warning",
          },
          // --- link
          {
            color: "base",
            variant: "link",
            class: "text-base-foreground bg-transparent",
          },
          {
            color: "primary",
            variant: "link",
            class: "text-primary bg-transparent",
          },
          {
            color: "secondary",
            variant: "link",
            class: "text-secondary bg-transparent",
          },
          {
            color: "accent",
            variant: "link",
            class: "text-accent bg-transparent",
          },
          {
            color: "promotion",
            variant: "link",
            class: "text-promotion bg-transparent",
          },
          {
            color: "destructive",
            variant: "link",
            class: "text-error bg-transparent",
          },
          {
            color: "success",
            variant: "link",
            class: "text-success bg-transparent",
          },
          { color: "info", variant: "link", class: "text-info bg-transparent" },
          {
            color: "error",
            variant: "link",
            class: "text-error bg-transparent",
          },
          {
            color: "warning",
            variant: "link",
            class: "text-warning bg-transparent",
          },
        ],
        defaultVariants: {
          variant: "flat",
          color: "base",
          size: "md",
        },
      }
    ),
    BE = {
      button: {
        root: kE,
        label: gt(
          "truncate"
          // {
          // variants: {
          //   size: {
          //     icon: "sr-only",
          //   },
          // },
          // }
        ),
      },
    },
    tu = "-";
  function zE(e) {
    const t = WE(e),
      { conflictingClassGroups: r, conflictingClassGroupModifiers: n } = e;
    function o(s) {
      const a = s.split(tu);
      return a[0] === "" && a.length !== 1 && a.shift(), Mm(a, t) || UE(s);
    }
    function i(s, a) {
      const l = r[s] || [];
      return a && n[s] ? [...l, ...n[s]] : l;
    }
    return {
      getClassGroupId: o,
      getConflictingClassGroupIds: i,
    };
  }
  function Mm(e, t) {
    var s;
    if (e.length === 0) return t.classGroupId;
    const r = e[0],
      n = t.nextPart.get(r),
      o = n ? Mm(e.slice(1), n) : void 0;
    if (o) return o;
    if (t.validators.length === 0) return;
    const i = e.join(tu);
    return (s = t.validators.find(({ validator: a }) => a(i))) == null
      ? void 0
      : s.classGroupId;
  }
  const xd = /^\[(.+)\]$/;
  function UE(e) {
    if (xd.test(e)) {
      const t = xd.exec(e)[1],
        r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
      if (r) return "arbitrary.." + r;
    }
  }
  function WE(e) {
    const { theme: t, prefix: r } = e,
      n = {
        nextPart: /* @__PURE__ */ new Map(),
        validators: [],
      };
    return (
      KE(Object.entries(e.classGroups), r).forEach(([i, s]) => {
        Ql(s, n, i, t);
      }),
      n
    );
  }
  function Ql(e, t, r, n) {
    e.forEach(o => {
      if (typeof o == "string") {
        const i = o === "" ? t : Dd(t, o);
        i.classGroupId = r;
        return;
      }
      if (typeof o == "function") {
        if (HE(o)) {
          Ql(o(n), t, r, n);
          return;
        }
        t.validators.push({
          validator: o,
          classGroupId: r,
        });
        return;
      }
      Object.entries(o).forEach(([i, s]) => {
        Ql(s, Dd(t, i), r, n);
      });
    });
  }
  function Dd(e, t) {
    let r = e;
    return (
      t.split(tu).forEach(n => {
        r.nextPart.has(n) ||
          r.nextPart.set(n, {
            nextPart: /* @__PURE__ */ new Map(),
            validators: [],
          }),
          (r = r.nextPart.get(n));
      }),
      r
    );
  }
  function HE(e) {
    return e.isThemeGetter;
  }
  function KE(e, t) {
    return t
      ? e.map(([r, n]) => {
          const o = n.map(i =>
            typeof i == "string"
              ? t + i
              : typeof i == "object"
                ? Object.fromEntries(
                    Object.entries(i).map(([s, a]) => [t + s, a])
                  )
                : i
          );
          return [r, o];
        })
      : e;
  }
  function GE(e) {
    if (e < 1)
      return {
        get: () => {},
        set: () => {},
      };
    let t = 0,
      r = /* @__PURE__ */ new Map(),
      n = /* @__PURE__ */ new Map();
    function o(i, s) {
      r.set(i, s),
        t++,
        t > e && ((t = 0), (n = r), (r = /* @__PURE__ */ new Map()));
    }
    return {
      get(i) {
        let s = r.get(i);
        if (s !== void 0) return s;
        if ((s = n.get(i)) !== void 0) return o(i, s), s;
      },
      set(i, s) {
        r.has(i) ? r.set(i, s) : o(i, s);
      },
    };
  }
  const jm = "!";
  function qE(e) {
    const t = e.separator,
      r = t.length === 1,
      n = t[0],
      o = t.length;
    return function (s) {
      const a = [];
      let l = 0,
        c = 0,
        u;
      for (let m = 0; m < s.length; m++) {
        let v = s[m];
        if (l === 0) {
          if (v === n && (r || s.slice(m, m + o) === t)) {
            a.push(s.slice(c, m)), (c = m + o);
            continue;
          }
          if (v === "/") {
            u = m;
            continue;
          }
        }
        v === "[" ? l++ : v === "]" && l--;
      }
      const f = a.length === 0 ? s : s.substring(c),
        d = f.startsWith(jm),
        p = d ? f.substring(1) : f,
        h = u && u > c ? u - c : void 0;
      return {
        modifiers: a,
        hasImportantModifier: d,
        baseClassName: p,
        maybePostfixModifierPosition: h,
      };
    };
  }
  function YE(e) {
    if (e.length <= 1) return e;
    const t = [];
    let r = [];
    return (
      e.forEach(n => {
        n[0] === "[" ? (t.push(...r.sort(), n), (r = [])) : r.push(n);
      }),
      t.push(...r.sort()),
      t
    );
  }
  function JE(e) {
    return {
      cache: GE(e.cacheSize),
      splitModifiers: qE(e),
      ...zE(e),
    };
  }
  const XE = /\s+/;
  function ZE(e, t) {
    const {
        splitModifiers: r,
        getClassGroupId: n,
        getConflictingClassGroupIds: o,
      } = t,
      i = /* @__PURE__ */ new Set();
    return e
      .trim()
      .split(XE)
      .map(s => {
        const {
          modifiers: a,
          hasImportantModifier: l,
          baseClassName: c,
          maybePostfixModifierPosition: u,
        } = r(s);
        let f = n(u ? c.substring(0, u) : c),
          d = !!u;
        if (!f) {
          if (!u)
            return {
              isTailwindClass: !1,
              originalClassName: s,
            };
          if (((f = n(c)), !f))
            return {
              isTailwindClass: !1,
              originalClassName: s,
            };
          d = !1;
        }
        const p = YE(a).join(":");
        return {
          isTailwindClass: !0,
          modifierId: l ? p + jm : p,
          classGroupId: f,
          originalClassName: s,
          hasPostfixModifier: d,
        };
      })
      .reverse()
      .filter(s => {
        if (!s.isTailwindClass) return !0;
        const { modifierId: a, classGroupId: l, hasPostfixModifier: c } = s,
          u = a + l;
        return i.has(u)
          ? !1
          : (i.add(u), o(l, c).forEach(f => i.add(a + f)), !0);
      })
      .reverse()
      .map(s => s.originalClassName)
      .join(" ");
  }
  function QE() {
    let e = 0,
      t,
      r,
      n = "";
    for (; e < arguments.length; )
      (t = arguments[e++]) && (r = Fm(t)) && (n && (n += " "), (n += r));
    return n;
  }
  function Fm(e) {
    if (typeof e == "string") return e;
    let t,
      r = "";
    for (let n = 0; n < e.length; n++)
      e[n] && (t = Fm(e[n])) && (r && (r += " "), (r += t));
    return r;
  }
  function e1(e, ...t) {
    let r,
      n,
      o,
      i = s;
    function s(l) {
      const c = t.reduce((u, f) => f(u), e());
      return (r = JE(c)), (n = r.cache.get), (o = r.cache.set), (i = a), a(l);
    }
    function a(l) {
      const c = n(l);
      if (c) return c;
      const u = ZE(l, r);
      return o(l, u), u;
    }
    return function () {
      return i(QE.apply(null, arguments));
    };
  }
  function Je(e) {
    const t = r => r[e] || [];
    return (t.isThemeGetter = !0), t;
  }
  const Lm = /^\[(?:([a-z-]+):)?(.+)\]$/i,
    t1 = /^\d+\/\d+$/,
    r1 = /* @__PURE__ */ new Set(["px", "full", "screen"]),
    n1 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
    o1 =
      /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
    i1 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/,
    s1 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
    a1 =
      /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
  function Ar(e) {
    return Tn(e) || r1.has(e) || t1.test(e);
  }
  function Jr(e) {
    return xo(e, "length", g1);
  }
  function Tn(e) {
    return !!e && !Number.isNaN(Number(e));
  }
  function gs(e) {
    return xo(e, "number", Tn);
  }
  function Jo(e) {
    return !!e && Number.isInteger(Number(e));
  }
  function l1(e) {
    return e.endsWith("%") && Tn(e.slice(0, -1));
  }
  function De(e) {
    return Lm.test(e);
  }
  function Xr(e) {
    return n1.test(e);
  }
  const c1 = /* @__PURE__ */ new Set(["length", "size", "percentage"]);
  function u1(e) {
    return xo(e, c1, Vm);
  }
  function f1(e) {
    return xo(e, "position", Vm);
  }
  const d1 = /* @__PURE__ */ new Set(["image", "url"]);
  function p1(e) {
    return xo(e, d1, v1);
  }
  function h1(e) {
    return xo(e, "", m1);
  }
  function Xo() {
    return !0;
  }
  function xo(e, t, r) {
    const n = Lm.exec(e);
    return n
      ? n[1]
        ? typeof t == "string"
          ? n[1] === t
          : t.has(n[1])
        : r(n[2])
      : !1;
  }
  function g1(e) {
    return o1.test(e) && !i1.test(e);
  }
  function Vm() {
    return !1;
  }
  function m1(e) {
    return s1.test(e);
  }
  function v1(e) {
    return a1.test(e);
  }
  function y1() {
    const e = Je("colors"),
      t = Je("spacing"),
      r = Je("blur"),
      n = Je("brightness"),
      o = Je("borderColor"),
      i = Je("borderRadius"),
      s = Je("borderSpacing"),
      a = Je("borderWidth"),
      l = Je("contrast"),
      c = Je("grayscale"),
      u = Je("hueRotate"),
      f = Je("invert"),
      d = Je("gap"),
      p = Je("gradientColorStops"),
      h = Je("gradientColorStopPositions"),
      m = Je("inset"),
      v = Je("margin"),
      g = Je("opacity"),
      _ = Je("padding"),
      E = Je("saturate"),
      A = Je("scale"),
      D = Je("sepia"),
      S = Je("skew"),
      O = Je("space"),
      j = Je("translate"),
      B = () => ["auto", "contain", "none"],
      W = () => ["auto", "hidden", "clip", "visible", "scroll"],
      re = () => ["auto", De, t],
      G = () => [De, t],
      Se = () => ["", Ar, Jr],
      ce = () => ["auto", Tn, De],
      Pe = () => [
        "bottom",
        "center",
        "left",
        "left-bottom",
        "left-top",
        "right",
        "right-bottom",
        "right-top",
        "top",
      ],
      _e = () => ["solid", "dashed", "dotted", "double", "none"],
      ae = () => [
        "normal",
        "multiply",
        "screen",
        "overlay",
        "darken",
        "lighten",
        "color-dodge",
        "color-burn",
        "hard-light",
        "soft-light",
        "difference",
        "exclusion",
        "hue",
        "saturation",
        "color",
        "luminosity",
        "plus-lighter",
      ],
      me = () => [
        "start",
        "end",
        "center",
        "between",
        "around",
        "evenly",
        "stretch",
      ],
      ze = () => ["", "0", De],
      Q = () => [
        "auto",
        "avoid",
        "all",
        "avoid-page",
        "page",
        "left",
        "right",
        "column",
      ],
      I = () => [Tn, gs],
      R = () => [Tn, De];
    return {
      cacheSize: 500,
      separator: ":",
      theme: {
        colors: [Xo],
        spacing: [Ar, Jr],
        blur: ["none", "", Xr, De],
        brightness: I(),
        borderColor: [e],
        borderRadius: ["none", "", "full", Xr, De],
        borderSpacing: G(),
        borderWidth: Se(),
        contrast: I(),
        grayscale: ze(),
        hueRotate: R(),
        invert: ze(),
        gap: G(),
        gradientColorStops: [e],
        gradientColorStopPositions: [l1, Jr],
        inset: re(),
        margin: re(),
        opacity: I(),
        padding: G(),
        saturate: I(),
        scale: I(),
        sepia: ze(),
        skew: R(),
        space: G(),
        translate: G(),
      },
      classGroups: {
        // Layout
        /**
         * Aspect Ratio
         * @see https://tailwindcss.com/docs/aspect-ratio
         */
        aspect: [
          {
            aspect: ["auto", "square", "video", De],
          },
        ],
        /**
         * Container
         * @see https://tailwindcss.com/docs/container
         */
        container: ["container"],
        /**
         * Columns
         * @see https://tailwindcss.com/docs/columns
         */
        columns: [
          {
            columns: [Xr],
          },
        ],
        /**
         * Break After
         * @see https://tailwindcss.com/docs/break-after
         */
        "break-after": [
          {
            "break-after": Q(),
          },
        ],
        /**
         * Break Before
         * @see https://tailwindcss.com/docs/break-before
         */
        "break-before": [
          {
            "break-before": Q(),
          },
        ],
        /**
         * Break Inside
         * @see https://tailwindcss.com/docs/break-inside
         */
        "break-inside": [
          {
            "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"],
          },
        ],
        /**
         * Box Decoration Break
         * @see https://tailwindcss.com/docs/box-decoration-break
         */
        "box-decoration": [
          {
            "box-decoration": ["slice", "clone"],
          },
        ],
        /**
         * Box Sizing
         * @see https://tailwindcss.com/docs/box-sizing
         */
        box: [
          {
            box: ["border", "content"],
          },
        ],
        /**
         * Display
         * @see https://tailwindcss.com/docs/display
         */
        display: [
          "block",
          "inline-block",
          "inline",
          "flex",
          "inline-flex",
          "table",
          "inline-table",
          "table-caption",
          "table-cell",
          "table-column",
          "table-column-group",
          "table-footer-group",
          "table-header-group",
          "table-row-group",
          "table-row",
          "flow-root",
          "grid",
          "inline-grid",
          "contents",
          "list-item",
          "hidden",
        ],
        /**
         * Floats
         * @see https://tailwindcss.com/docs/float
         */
        float: [
          {
            float: ["right", "left", "none", "start", "end"],
          },
        ],
        /**
         * Clear
         * @see https://tailwindcss.com/docs/clear
         */
        clear: [
          {
            clear: ["left", "right", "both", "none", "start", "end"],
          },
        ],
        /**
         * Isolation
         * @see https://tailwindcss.com/docs/isolation
         */
        isolation: ["isolate", "isolation-auto"],
        /**
         * Object Fit
         * @see https://tailwindcss.com/docs/object-fit
         */
        "object-fit": [
          {
            object: ["contain", "cover", "fill", "none", "scale-down"],
          },
        ],
        /**
         * Object Position
         * @see https://tailwindcss.com/docs/object-position
         */
        "object-position": [
          {
            object: [...Pe(), De],
          },
        ],
        /**
         * Overflow
         * @see https://tailwindcss.com/docs/overflow
         */
        overflow: [
          {
            overflow: W(),
          },
        ],
        /**
         * Overflow X
         * @see https://tailwindcss.com/docs/overflow
         */
        "overflow-x": [
          {
            "overflow-x": W(),
          },
        ],
        /**
         * Overflow Y
         * @see https://tailwindcss.com/docs/overflow
         */
        "overflow-y": [
          {
            "overflow-y": W(),
          },
        ],
        /**
         * Overscroll Behavior
         * @see https://tailwindcss.com/docs/overscroll-behavior
         */
        overscroll: [
          {
            overscroll: B(),
          },
        ],
        /**
         * Overscroll Behavior X
         * @see https://tailwindcss.com/docs/overscroll-behavior
         */
        "overscroll-x": [
          {
            "overscroll-x": B(),
          },
        ],
        /**
         * Overscroll Behavior Y
         * @see https://tailwindcss.com/docs/overscroll-behavior
         */
        "overscroll-y": [
          {
            "overscroll-y": B(),
          },
        ],
        /**
         * Position
         * @see https://tailwindcss.com/docs/position
         */
        position: ["static", "fixed", "absolute", "relative", "sticky"],
        /**
         * Top / Right / Bottom / Left
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        inset: [
          {
            inset: [m],
          },
        ],
        /**
         * Right / Left
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        "inset-x": [
          {
            "inset-x": [m],
          },
        ],
        /**
         * Top / Bottom
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        "inset-y": [
          {
            "inset-y": [m],
          },
        ],
        /**
         * Start
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        start: [
          {
            start: [m],
          },
        ],
        /**
         * End
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        end: [
          {
            end: [m],
          },
        ],
        /**
         * Top
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        top: [
          {
            top: [m],
          },
        ],
        /**
         * Right
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        right: [
          {
            right: [m],
          },
        ],
        /**
         * Bottom
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        bottom: [
          {
            bottom: [m],
          },
        ],
        /**
         * Left
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        left: [
          {
            left: [m],
          },
        ],
        /**
         * Visibility
         * @see https://tailwindcss.com/docs/visibility
         */
        visibility: ["visible", "invisible", "collapse"],
        /**
         * Z-Index
         * @see https://tailwindcss.com/docs/z-index
         */
        z: [
          {
            z: ["auto", Jo, De],
          },
        ],
        // Flexbox and Grid
        /**
         * Flex Basis
         * @see https://tailwindcss.com/docs/flex-basis
         */
        basis: [
          {
            basis: re(),
          },
        ],
        /**
         * Flex Direction
         * @see https://tailwindcss.com/docs/flex-direction
         */
        "flex-direction": [
          {
            flex: ["row", "row-reverse", "col", "col-reverse"],
          },
        ],
        /**
         * Flex Wrap
         * @see https://tailwindcss.com/docs/flex-wrap
         */
        "flex-wrap": [
          {
            flex: ["wrap", "wrap-reverse", "nowrap"],
          },
        ],
        /**
         * Flex
         * @see https://tailwindcss.com/docs/flex
         */
        flex: [
          {
            flex: ["1", "auto", "initial", "none", De],
          },
        ],
        /**
         * Flex Grow
         * @see https://tailwindcss.com/docs/flex-grow
         */
        grow: [
          {
            grow: ze(),
          },
        ],
        /**
         * Flex Shrink
         * @see https://tailwindcss.com/docs/flex-shrink
         */
        shrink: [
          {
            shrink: ze(),
          },
        ],
        /**
         * Order
         * @see https://tailwindcss.com/docs/order
         */
        order: [
          {
            order: ["first", "last", "none", Jo, De],
          },
        ],
        /**
         * Grid Template Columns
         * @see https://tailwindcss.com/docs/grid-template-columns
         */
        "grid-cols": [
          {
            "grid-cols": [Xo],
          },
        ],
        /**
         * Grid Column Start / End
         * @see https://tailwindcss.com/docs/grid-column
         */
        "col-start-end": [
          {
            col: [
              "auto",
              {
                span: ["full", Jo, De],
              },
              De,
            ],
          },
        ],
        /**
         * Grid Column Start
         * @see https://tailwindcss.com/docs/grid-column
         */
        "col-start": [
          {
            "col-start": ce(),
          },
        ],
        /**
         * Grid Column End
         * @see https://tailwindcss.com/docs/grid-column
         */
        "col-end": [
          {
            "col-end": ce(),
          },
        ],
        /**
         * Grid Template Rows
         * @see https://tailwindcss.com/docs/grid-template-rows
         */
        "grid-rows": [
          {
            "grid-rows": [Xo],
          },
        ],
        /**
         * Grid Row Start / End
         * @see https://tailwindcss.com/docs/grid-row
         */
        "row-start-end": [
          {
            row: [
              "auto",
              {
                span: [Jo, De],
              },
              De,
            ],
          },
        ],
        /**
         * Grid Row Start
         * @see https://tailwindcss.com/docs/grid-row
         */
        "row-start": [
          {
            "row-start": ce(),
          },
        ],
        /**
         * Grid Row End
         * @see https://tailwindcss.com/docs/grid-row
         */
        "row-end": [
          {
            "row-end": ce(),
          },
        ],
        /**
         * Grid Auto Flow
         * @see https://tailwindcss.com/docs/grid-auto-flow
         */
        "grid-flow": [
          {
            "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"],
          },
        ],
        /**
         * Grid Auto Columns
         * @see https://tailwindcss.com/docs/grid-auto-columns
         */
        "auto-cols": [
          {
            "auto-cols": ["auto", "min", "max", "fr", De],
          },
        ],
        /**
         * Grid Auto Rows
         * @see https://tailwindcss.com/docs/grid-auto-rows
         */
        "auto-rows": [
          {
            "auto-rows": ["auto", "min", "max", "fr", De],
          },
        ],
        /**
         * Gap
         * @see https://tailwindcss.com/docs/gap
         */
        gap: [
          {
            gap: [d],
          },
        ],
        /**
         * Gap X
         * @see https://tailwindcss.com/docs/gap
         */
        "gap-x": [
          {
            "gap-x": [d],
          },
        ],
        /**
         * Gap Y
         * @see https://tailwindcss.com/docs/gap
         */
        "gap-y": [
          {
            "gap-y": [d],
          },
        ],
        /**
         * Justify Content
         * @see https://tailwindcss.com/docs/justify-content
         */
        "justify-content": [
          {
            justify: ["normal", ...me()],
          },
        ],
        /**
         * Justify Items
         * @see https://tailwindcss.com/docs/justify-items
         */
        "justify-items": [
          {
            "justify-items": ["start", "end", "center", "stretch"],
          },
        ],
        /**
         * Justify Self
         * @see https://tailwindcss.com/docs/justify-self
         */
        "justify-self": [
          {
            "justify-self": ["auto", "start", "end", "center", "stretch"],
          },
        ],
        /**
         * Align Content
         * @see https://tailwindcss.com/docs/align-content
         */
        "align-content": [
          {
            content: ["normal", ...me(), "baseline"],
          },
        ],
        /**
         * Align Items
         * @see https://tailwindcss.com/docs/align-items
         */
        "align-items": [
          {
            items: ["start", "end", "center", "baseline", "stretch"],
          },
        ],
        /**
         * Align Self
         * @see https://tailwindcss.com/docs/align-self
         */
        "align-self": [
          {
            self: ["auto", "start", "end", "center", "stretch", "baseline"],
          },
        ],
        /**
         * Place Content
         * @see https://tailwindcss.com/docs/place-content
         */
        "place-content": [
          {
            "place-content": [...me(), "baseline"],
          },
        ],
        /**
         * Place Items
         * @see https://tailwindcss.com/docs/place-items
         */
        "place-items": [
          {
            "place-items": ["start", "end", "center", "baseline", "stretch"],
          },
        ],
        /**
         * Place Self
         * @see https://tailwindcss.com/docs/place-self
         */
        "place-self": [
          {
            "place-self": ["auto", "start", "end", "center", "stretch"],
          },
        ],
        // Spacing
        /**
         * Padding
         * @see https://tailwindcss.com/docs/padding
         */
        p: [
          {
            p: [_],
          },
        ],
        /**
         * Padding X
         * @see https://tailwindcss.com/docs/padding
         */
        px: [
          {
            px: [_],
          },
        ],
        /**
         * Padding Y
         * @see https://tailwindcss.com/docs/padding
         */
        py: [
          {
            py: [_],
          },
        ],
        /**
         * Padding Start
         * @see https://tailwindcss.com/docs/padding
         */
        ps: [
          {
            ps: [_],
          },
        ],
        /**
         * Padding End
         * @see https://tailwindcss.com/docs/padding
         */
        pe: [
          {
            pe: [_],
          },
        ],
        /**
         * Padding Top
         * @see https://tailwindcss.com/docs/padding
         */
        pt: [
          {
            pt: [_],
          },
        ],
        /**
         * Padding Right
         * @see https://tailwindcss.com/docs/padding
         */
        pr: [
          {
            pr: [_],
          },
        ],
        /**
         * Padding Bottom
         * @see https://tailwindcss.com/docs/padding
         */
        pb: [
          {
            pb: [_],
          },
        ],
        /**
         * Padding Left
         * @see https://tailwindcss.com/docs/padding
         */
        pl: [
          {
            pl: [_],
          },
        ],
        /**
         * Margin
         * @see https://tailwindcss.com/docs/margin
         */
        m: [
          {
            m: [v],
          },
        ],
        /**
         * Margin X
         * @see https://tailwindcss.com/docs/margin
         */
        mx: [
          {
            mx: [v],
          },
        ],
        /**
         * Margin Y
         * @see https://tailwindcss.com/docs/margin
         */
        my: [
          {
            my: [v],
          },
        ],
        /**
         * Margin Start
         * @see https://tailwindcss.com/docs/margin
         */
        ms: [
          {
            ms: [v],
          },
        ],
        /**
         * Margin End
         * @see https://tailwindcss.com/docs/margin
         */
        me: [
          {
            me: [v],
          },
        ],
        /**
         * Margin Top
         * @see https://tailwindcss.com/docs/margin
         */
        mt: [
          {
            mt: [v],
          },
        ],
        /**
         * Margin Right
         * @see https://tailwindcss.com/docs/margin
         */
        mr: [
          {
            mr: [v],
          },
        ],
        /**
         * Margin Bottom
         * @see https://tailwindcss.com/docs/margin
         */
        mb: [
          {
            mb: [v],
          },
        ],
        /**
         * Margin Left
         * @see https://tailwindcss.com/docs/margin
         */
        ml: [
          {
            ml: [v],
          },
        ],
        /**
         * Space Between X
         * @see https://tailwindcss.com/docs/space
         */
        "space-x": [
          {
            "space-x": [O],
          },
        ],
        /**
         * Space Between X Reverse
         * @see https://tailwindcss.com/docs/space
         */
        "space-x-reverse": ["space-x-reverse"],
        /**
         * Space Between Y
         * @see https://tailwindcss.com/docs/space
         */
        "space-y": [
          {
            "space-y": [O],
          },
        ],
        /**
         * Space Between Y Reverse
         * @see https://tailwindcss.com/docs/space
         */
        "space-y-reverse": ["space-y-reverse"],
        // Sizing
        /**
         * Width
         * @see https://tailwindcss.com/docs/width
         */
        w: [
          {
            w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", De, t],
          },
        ],
        /**
         * Min-Width
         * @see https://tailwindcss.com/docs/min-width
         */
        "min-w": [
          {
            "min-w": [De, t, "min", "max", "fit"],
          },
        ],
        /**
         * Max-Width
         * @see https://tailwindcss.com/docs/max-width
         */
        "max-w": [
          {
            "max-w": [
              De,
              t,
              "none",
              "full",
              "min",
              "max",
              "fit",
              "prose",
              {
                screen: [Xr],
              },
              Xr,
            ],
          },
        ],
        /**
         * Height
         * @see https://tailwindcss.com/docs/height
         */
        h: [
          {
            h: [De, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"],
          },
        ],
        /**
         * Min-Height
         * @see https://tailwindcss.com/docs/min-height
         */
        "min-h": [
          {
            "min-h": [De, t, "min", "max", "fit", "svh", "lvh", "dvh"],
          },
        ],
        /**
         * Max-Height
         * @see https://tailwindcss.com/docs/max-height
         */
        "max-h": [
          {
            "max-h": [De, t, "min", "max", "fit", "svh", "lvh", "dvh"],
          },
        ],
        /**
         * Size
         * @see https://tailwindcss.com/docs/size
         */
        size: [
          {
            size: [De, t, "auto", "min", "max", "fit"],
          },
        ],
        // Typography
        /**
         * Font Size
         * @see https://tailwindcss.com/docs/font-size
         */
        "font-size": [
          {
            text: ["base", Xr, Jr],
          },
        ],
        /**
         * Font Smoothing
         * @see https://tailwindcss.com/docs/font-smoothing
         */
        "font-smoothing": ["antialiased", "subpixel-antialiased"],
        /**
         * Font Style
         * @see https://tailwindcss.com/docs/font-style
         */
        "font-style": ["italic", "not-italic"],
        /**
         * Font Weight
         * @see https://tailwindcss.com/docs/font-weight
         */
        "font-weight": [
          {
            font: [
              "thin",
              "extralight",
              "light",
              "normal",
              "medium",
              "semibold",
              "bold",
              "extrabold",
              "black",
              gs,
            ],
          },
        ],
        /**
         * Font Family
         * @see https://tailwindcss.com/docs/font-family
         */
        "font-family": [
          {
            font: [Xo],
          },
        ],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        "fvn-normal": ["normal-nums"],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        "fvn-ordinal": ["ordinal"],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        "fvn-slashed-zero": ["slashed-zero"],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        "fvn-figure": ["lining-nums", "oldstyle-nums"],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        "fvn-spacing": ["proportional-nums", "tabular-nums"],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        "fvn-fraction": ["diagonal-fractions", "stacked-fractons"],
        /**
         * Letter Spacing
         * @see https://tailwindcss.com/docs/letter-spacing
         */
        tracking: [
          {
            tracking: [
              "tighter",
              "tight",
              "normal",
              "wide",
              "wider",
              "widest",
              De,
            ],
          },
        ],
        /**
         * Line Clamp
         * @see https://tailwindcss.com/docs/line-clamp
         */
        "line-clamp": [
          {
            "line-clamp": ["none", Tn, gs],
          },
        ],
        /**
         * Line Height
         * @see https://tailwindcss.com/docs/line-height
         */
        leading: [
          {
            leading: [
              "none",
              "tight",
              "snug",
              "normal",
              "relaxed",
              "loose",
              Ar,
              De,
            ],
          },
        ],
        /**
         * List Style Image
         * @see https://tailwindcss.com/docs/list-style-image
         */
        "list-image": [
          {
            "list-image": ["none", De],
          },
        ],
        /**
         * List Style Type
         * @see https://tailwindcss.com/docs/list-style-type
         */
        "list-style-type": [
          {
            list: ["none", "disc", "decimal", De],
          },
        ],
        /**
         * List Style Position
         * @see https://tailwindcss.com/docs/list-style-position
         */
        "list-style-position": [
          {
            list: ["inside", "outside"],
          },
        ],
        /**
         * Placeholder Color
         * @deprecated since Tailwind CSS v3.0.0
         * @see https://tailwindcss.com/docs/placeholder-color
         */
        "placeholder-color": [
          {
            placeholder: [e],
          },
        ],
        /**
         * Placeholder Opacity
         * @see https://tailwindcss.com/docs/placeholder-opacity
         */
        "placeholder-opacity": [
          {
            "placeholder-opacity": [g],
          },
        ],
        /**
         * Text Alignment
         * @see https://tailwindcss.com/docs/text-align
         */
        "text-alignment": [
          {
            text: ["left", "center", "right", "justify", "start", "end"],
          },
        ],
        /**
         * Text Color
         * @see https://tailwindcss.com/docs/text-color
         */
        "text-color": [
          {
            text: [e],
          },
        ],
        /**
         * Text Opacity
         * @see https://tailwindcss.com/docs/text-opacity
         */
        "text-opacity": [
          {
            "text-opacity": [g],
          },
        ],
        /**
         * Text Decoration
         * @see https://tailwindcss.com/docs/text-decoration
         */
        "text-decoration": [
          "underline",
          "overline",
          "line-through",
          "no-underline",
        ],
        /**
         * Text Decoration Style
         * @see https://tailwindcss.com/docs/text-decoration-style
         */
        "text-decoration-style": [
          {
            decoration: [..._e(), "wavy"],
          },
        ],
        /**
         * Text Decoration Thickness
         * @see https://tailwindcss.com/docs/text-decoration-thickness
         */
        "text-decoration-thickness": [
          {
            decoration: ["auto", "from-font", Ar, Jr],
          },
        ],
        /**
         * Text Underline Offset
         * @see https://tailwindcss.com/docs/text-underline-offset
         */
        "underline-offset": [
          {
            "underline-offset": ["auto", Ar, De],
          },
        ],
        /**
         * Text Decoration Color
         * @see https://tailwindcss.com/docs/text-decoration-color
         */
        "text-decoration-color": [
          {
            decoration: [e],
          },
        ],
        /**
         * Text Transform
         * @see https://tailwindcss.com/docs/text-transform
         */
        "text-transform": [
          "uppercase",
          "lowercase",
          "capitalize",
          "normal-case",
        ],
        /**
         * Text Overflow
         * @see https://tailwindcss.com/docs/text-overflow
         */
        "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
        /**
         * Text Wrap
         * @see https://tailwindcss.com/docs/text-wrap
         */
        "text-wrap": [
          {
            text: ["wrap", "nowrap", "balance", "pretty"],
          },
        ],
        /**
         * Text Indent
         * @see https://tailwindcss.com/docs/text-indent
         */
        indent: [
          {
            indent: G(),
          },
        ],
        /**
         * Vertical Alignment
         * @see https://tailwindcss.com/docs/vertical-align
         */
        "vertical-align": [
          {
            align: [
              "baseline",
              "top",
              "middle",
              "bottom",
              "text-top",
              "text-bottom",
              "sub",
              "super",
              De,
            ],
          },
        ],
        /**
         * Whitespace
         * @see https://tailwindcss.com/docs/whitespace
         */
        whitespace: [
          {
            whitespace: [
              "normal",
              "nowrap",
              "pre",
              "pre-line",
              "pre-wrap",
              "break-spaces",
            ],
          },
        ],
        /**
         * Word Break
         * @see https://tailwindcss.com/docs/word-break
         */
        break: [
          {
            break: ["normal", "words", "all", "keep"],
          },
        ],
        /**
         * Hyphens
         * @see https://tailwindcss.com/docs/hyphens
         */
        hyphens: [
          {
            hyphens: ["none", "manual", "auto"],
          },
        ],
        /**
         * Content
         * @see https://tailwindcss.com/docs/content
         */
        content: [
          {
            content: ["none", De],
          },
        ],
        // Backgrounds
        /**
         * Background Attachment
         * @see https://tailwindcss.com/docs/background-attachment
         */
        "bg-attachment": [
          {
            bg: ["fixed", "local", "scroll"],
          },
        ],
        /**
         * Background Clip
         * @see https://tailwindcss.com/docs/background-clip
         */
        "bg-clip": [
          {
            "bg-clip": ["border", "padding", "content", "text"],
          },
        ],
        /**
         * Background Opacity
         * @deprecated since Tailwind CSS v3.0.0
         * @see https://tailwindcss.com/docs/background-opacity
         */
        "bg-opacity": [
          {
            "bg-opacity": [g],
          },
        ],
        /**
         * Background Origin
         * @see https://tailwindcss.com/docs/background-origin
         */
        "bg-origin": [
          {
            "bg-origin": ["border", "padding", "content"],
          },
        ],
        /**
         * Background Position
         * @see https://tailwindcss.com/docs/background-position
         */
        "bg-position": [
          {
            bg: [...Pe(), f1],
          },
        ],
        /**
         * Background Repeat
         * @see https://tailwindcss.com/docs/background-repeat
         */
        "bg-repeat": [
          {
            bg: [
              "no-repeat",
              {
                repeat: ["", "x", "y", "round", "space"],
              },
            ],
          },
        ],
        /**
         * Background Size
         * @see https://tailwindcss.com/docs/background-size
         */
        "bg-size": [
          {
            bg: ["auto", "cover", "contain", u1],
          },
        ],
        /**
         * Background Image
         * @see https://tailwindcss.com/docs/background-image
         */
        "bg-image": [
          {
            bg: [
              "none",
              {
                "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"],
              },
              p1,
            ],
          },
        ],
        /**
         * Background Color
         * @see https://tailwindcss.com/docs/background-color
         */
        "bg-color": [
          {
            bg: [e],
          },
        ],
        /**
         * Gradient Color Stops From Position
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        "gradient-from-pos": [
          {
            from: [h],
          },
        ],
        /**
         * Gradient Color Stops Via Position
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        "gradient-via-pos": [
          {
            via: [h],
          },
        ],
        /**
         * Gradient Color Stops To Position
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        "gradient-to-pos": [
          {
            to: [h],
          },
        ],
        /**
         * Gradient Color Stops From
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        "gradient-from": [
          {
            from: [p],
          },
        ],
        /**
         * Gradient Color Stops Via
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        "gradient-via": [
          {
            via: [p],
          },
        ],
        /**
         * Gradient Color Stops To
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        "gradient-to": [
          {
            to: [p],
          },
        ],
        // Borders
        /**
         * Border Radius
         * @see https://tailwindcss.com/docs/border-radius
         */
        rounded: [
          {
            rounded: [i],
          },
        ],
        /**
         * Border Radius Start
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-s": [
          {
            "rounded-s": [i],
          },
        ],
        /**
         * Border Radius End
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-e": [
          {
            "rounded-e": [i],
          },
        ],
        /**
         * Border Radius Top
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-t": [
          {
            "rounded-t": [i],
          },
        ],
        /**
         * Border Radius Right
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-r": [
          {
            "rounded-r": [i],
          },
        ],
        /**
         * Border Radius Bottom
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-b": [
          {
            "rounded-b": [i],
          },
        ],
        /**
         * Border Radius Left
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-l": [
          {
            "rounded-l": [i],
          },
        ],
        /**
         * Border Radius Start Start
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-ss": [
          {
            "rounded-ss": [i],
          },
        ],
        /**
         * Border Radius Start End
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-se": [
          {
            "rounded-se": [i],
          },
        ],
        /**
         * Border Radius End End
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-ee": [
          {
            "rounded-ee": [i],
          },
        ],
        /**
         * Border Radius End Start
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-es": [
          {
            "rounded-es": [i],
          },
        ],
        /**
         * Border Radius Top Left
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-tl": [
          {
            "rounded-tl": [i],
          },
        ],
        /**
         * Border Radius Top Right
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-tr": [
          {
            "rounded-tr": [i],
          },
        ],
        /**
         * Border Radius Bottom Right
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-br": [
          {
            "rounded-br": [i],
          },
        ],
        /**
         * Border Radius Bottom Left
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-bl": [
          {
            "rounded-bl": [i],
          },
        ],
        /**
         * Border Width
         * @see https://tailwindcss.com/docs/border-width
         */
        "border-w": [
          {
            border: [a],
          },
        ],
        /**
         * Border Width X
         * @see https://tailwindcss.com/docs/border-width
         */
        "border-w-x": [
          {
            "border-x": [a],
          },
        ],
        /**
         * Border Width Y
         * @see https://tailwindcss.com/docs/border-width
         */
        "border-w-y": [
          {
            "border-y": [a],
          },
        ],
        /**
         * Border Width Start
         * @see https://tailwindcss.com/docs/border-width
         */
        "border-w-s": [
          {
            "border-s": [a],
          },
        ],
        /**
         * Border Width End
         * @see https://tailwindcss.com/docs/border-width
         */
        "border-w-e": [
          {
            "border-e": [a],
          },
        ],
        /**
         * Border Width Top
         * @see https://tailwindcss.com/docs/border-width
         */
        "border-w-t": [
          {
            "border-t": [a],
          },
        ],
        /**
         * Border Width Right
         * @see https://tailwindcss.com/docs/border-width
         */
        "border-w-r": [
          {
            "border-r": [a],
          },
        ],
        /**
         * Border Width Bottom
         * @see https://tailwindcss.com/docs/border-width
         */
        "border-w-b": [
          {
            "border-b": [a],
          },
        ],
        /**
         * Border Width Left
         * @see https://tailwindcss.com/docs/border-width
         */
        "border-w-l": [
          {
            "border-l": [a],
          },
        ],
        /**
         * Border Opacity
         * @see https://tailwindcss.com/docs/border-opacity
         */
        "border-opacity": [
          {
            "border-opacity": [g],
          },
        ],
        /**
         * Border Style
         * @see https://tailwindcss.com/docs/border-style
         */
        "border-style": [
          {
            border: [..._e(), "hidden"],
          },
        ],
        /**
         * Divide Width X
         * @see https://tailwindcss.com/docs/divide-width
         */
        "divide-x": [
          {
            "divide-x": [a],
          },
        ],
        /**
         * Divide Width X Reverse
         * @see https://tailwindcss.com/docs/divide-width
         */
        "divide-x-reverse": ["divide-x-reverse"],
        /**
         * Divide Width Y
         * @see https://tailwindcss.com/docs/divide-width
         */
        "divide-y": [
          {
            "divide-y": [a],
          },
        ],
        /**
         * Divide Width Y Reverse
         * @see https://tailwindcss.com/docs/divide-width
         */
        "divide-y-reverse": ["divide-y-reverse"],
        /**
         * Divide Opacity
         * @see https://tailwindcss.com/docs/divide-opacity
         */
        "divide-opacity": [
          {
            "divide-opacity": [g],
          },
        ],
        /**
         * Divide Style
         * @see https://tailwindcss.com/docs/divide-style
         */
        "divide-style": [
          {
            divide: _e(),
          },
        ],
        /**
         * Border Color
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color": [
          {
            border: [o],
          },
        ],
        /**
         * Border Color X
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-x": [
          {
            "border-x": [o],
          },
        ],
        /**
         * Border Color Y
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-y": [
          {
            "border-y": [o],
          },
        ],
        /**
         * Border Color Top
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-t": [
          {
            "border-t": [o],
          },
        ],
        /**
         * Border Color Right
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-r": [
          {
            "border-r": [o],
          },
        ],
        /**
         * Border Color Bottom
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-b": [
          {
            "border-b": [o],
          },
        ],
        /**
         * Border Color Left
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-l": [
          {
            "border-l": [o],
          },
        ],
        /**
         * Divide Color
         * @see https://tailwindcss.com/docs/divide-color
         */
        "divide-color": [
          {
            divide: [o],
          },
        ],
        /**
         * Outline Style
         * @see https://tailwindcss.com/docs/outline-style
         */
        "outline-style": [
          {
            outline: ["", ..._e()],
          },
        ],
        /**
         * Outline Offset
         * @see https://tailwindcss.com/docs/outline-offset
         */
        "outline-offset": [
          {
            "outline-offset": [Ar, De],
          },
        ],
        /**
         * Outline Width
         * @see https://tailwindcss.com/docs/outline-width
         */
        "outline-w": [
          {
            outline: [Ar, Jr],
          },
        ],
        /**
         * Outline Color
         * @see https://tailwindcss.com/docs/outline-color
         */
        "outline-color": [
          {
            outline: [e],
          },
        ],
        /**
         * Ring Width
         * @see https://tailwindcss.com/docs/ring-width
         */
        "ring-w": [
          {
            ring: Se(),
          },
        ],
        /**
         * Ring Width Inset
         * @see https://tailwindcss.com/docs/ring-width
         */
        "ring-w-inset": ["ring-inset"],
        /**
         * Ring Color
         * @see https://tailwindcss.com/docs/ring-color
         */
        "ring-color": [
          {
            ring: [e],
          },
        ],
        /**
         * Ring Opacity
         * @see https://tailwindcss.com/docs/ring-opacity
         */
        "ring-opacity": [
          {
            "ring-opacity": [g],
          },
        ],
        /**
         * Ring Offset Width
         * @see https://tailwindcss.com/docs/ring-offset-width
         */
        "ring-offset-w": [
          {
            "ring-offset": [Ar, Jr],
          },
        ],
        /**
         * Ring Offset Color
         * @see https://tailwindcss.com/docs/ring-offset-color
         */
        "ring-offset-color": [
          {
            "ring-offset": [e],
          },
        ],
        // Effects
        /**
         * Box Shadow
         * @see https://tailwindcss.com/docs/box-shadow
         */
        shadow: [
          {
            shadow: ["", "inner", "none", Xr, h1],
          },
        ],
        /**
         * Box Shadow Color
         * @see https://tailwindcss.com/docs/box-shadow-color
         */
        "shadow-color": [
          {
            shadow: [Xo],
          },
        ],
        /**
         * Opacity
         * @see https://tailwindcss.com/docs/opacity
         */
        opacity: [
          {
            opacity: [g],
          },
        ],
        /**
         * Mix Blend Mode
         * @see https://tailwindcss.com/docs/mix-blend-mode
         */
        "mix-blend": [
          {
            "mix-blend": ae(),
          },
        ],
        /**
         * Background Blend Mode
         * @see https://tailwindcss.com/docs/background-blend-mode
         */
        "bg-blend": [
          {
            "bg-blend": ae(),
          },
        ],
        // Filters
        /**
         * Filter
         * @deprecated since Tailwind CSS v3.0.0
         * @see https://tailwindcss.com/docs/filter
         */
        filter: [
          {
            filter: ["", "none"],
          },
        ],
        /**
         * Blur
         * @see https://tailwindcss.com/docs/blur
         */
        blur: [
          {
            blur: [r],
          },
        ],
        /**
         * Brightness
         * @see https://tailwindcss.com/docs/brightness
         */
        brightness: [
          {
            brightness: [n],
          },
        ],
        /**
         * Contrast
         * @see https://tailwindcss.com/docs/contrast
         */
        contrast: [
          {
            contrast: [l],
          },
        ],
        /**
         * Drop Shadow
         * @see https://tailwindcss.com/docs/drop-shadow
         */
        "drop-shadow": [
          {
            "drop-shadow": ["", "none", Xr, De],
          },
        ],
        /**
         * Grayscale
         * @see https://tailwindcss.com/docs/grayscale
         */
        grayscale: [
          {
            grayscale: [c],
          },
        ],
        /**
         * Hue Rotate
         * @see https://tailwindcss.com/docs/hue-rotate
         */
        "hue-rotate": [
          {
            "hue-rotate": [u],
          },
        ],
        /**
         * Invert
         * @see https://tailwindcss.com/docs/invert
         */
        invert: [
          {
            invert: [f],
          },
        ],
        /**
         * Saturate
         * @see https://tailwindcss.com/docs/saturate
         */
        saturate: [
          {
            saturate: [E],
          },
        ],
        /**
         * Sepia
         * @see https://tailwindcss.com/docs/sepia
         */
        sepia: [
          {
            sepia: [D],
          },
        ],
        /**
         * Backdrop Filter
         * @deprecated since Tailwind CSS v3.0.0
         * @see https://tailwindcss.com/docs/backdrop-filter
         */
        "backdrop-filter": [
          {
            "backdrop-filter": ["", "none"],
          },
        ],
        /**
         * Backdrop Blur
         * @see https://tailwindcss.com/docs/backdrop-blur
         */
        "backdrop-blur": [
          {
            "backdrop-blur": [r],
          },
        ],
        /**
         * Backdrop Brightness
         * @see https://tailwindcss.com/docs/backdrop-brightness
         */
        "backdrop-brightness": [
          {
            "backdrop-brightness": [n],
          },
        ],
        /**
         * Backdrop Contrast
         * @see https://tailwindcss.com/docs/backdrop-contrast
         */
        "backdrop-contrast": [
          {
            "backdrop-contrast": [l],
          },
        ],
        /**
         * Backdrop Grayscale
         * @see https://tailwindcss.com/docs/backdrop-grayscale
         */
        "backdrop-grayscale": [
          {
            "backdrop-grayscale": [c],
          },
        ],
        /**
         * Backdrop Hue Rotate
         * @see https://tailwindcss.com/docs/backdrop-hue-rotate
         */
        "backdrop-hue-rotate": [
          {
            "backdrop-hue-rotate": [u],
          },
        ],
        /**
         * Backdrop Invert
         * @see https://tailwindcss.com/docs/backdrop-invert
         */
        "backdrop-invert": [
          {
            "backdrop-invert": [f],
          },
        ],
        /**
         * Backdrop Opacity
         * @see https://tailwindcss.com/docs/backdrop-opacity
         */
        "backdrop-opacity": [
          {
            "backdrop-opacity": [g],
          },
        ],
        /**
         * Backdrop Saturate
         * @see https://tailwindcss.com/docs/backdrop-saturate
         */
        "backdrop-saturate": [
          {
            "backdrop-saturate": [E],
          },
        ],
        /**
         * Backdrop Sepia
         * @see https://tailwindcss.com/docs/backdrop-sepia
         */
        "backdrop-sepia": [
          {
            "backdrop-sepia": [D],
          },
        ],
        // Tables
        /**
         * Border Collapse
         * @see https://tailwindcss.com/docs/border-collapse
         */
        "border-collapse": [
          {
            border: ["collapse", "separate"],
          },
        ],
        /**
         * Border Spacing
         * @see https://tailwindcss.com/docs/border-spacing
         */
        "border-spacing": [
          {
            "border-spacing": [s],
          },
        ],
        /**
         * Border Spacing X
         * @see https://tailwindcss.com/docs/border-spacing
         */
        "border-spacing-x": [
          {
            "border-spacing-x": [s],
          },
        ],
        /**
         * Border Spacing Y
         * @see https://tailwindcss.com/docs/border-spacing
         */
        "border-spacing-y": [
          {
            "border-spacing-y": [s],
          },
        ],
        /**
         * Table Layout
         * @see https://tailwindcss.com/docs/table-layout
         */
        "table-layout": [
          {
            table: ["auto", "fixed"],
          },
        ],
        /**
         * Caption Side
         * @see https://tailwindcss.com/docs/caption-side
         */
        caption: [
          {
            caption: ["top", "bottom"],
          },
        ],
        // Transitions and Animation
        /**
         * Tranisition Property
         * @see https://tailwindcss.com/docs/transition-property
         */
        transition: [
          {
            transition: [
              "none",
              "all",
              "",
              "colors",
              "opacity",
              "shadow",
              "transform",
              De,
            ],
          },
        ],
        /**
         * Transition Duration
         * @see https://tailwindcss.com/docs/transition-duration
         */
        duration: [
          {
            duration: R(),
          },
        ],
        /**
         * Transition Timing Function
         * @see https://tailwindcss.com/docs/transition-timing-function
         */
        ease: [
          {
            ease: ["linear", "in", "out", "in-out", De],
          },
        ],
        /**
         * Transition Delay
         * @see https://tailwindcss.com/docs/transition-delay
         */
        delay: [
          {
            delay: R(),
          },
        ],
        /**
         * Animation
         * @see https://tailwindcss.com/docs/animation
         */
        animate: [
          {
            animate: ["none", "spin", "ping", "pulse", "bounce", De],
          },
        ],
        // Transforms
        /**
         * Transform
         * @see https://tailwindcss.com/docs/transform
         */
        transform: [
          {
            transform: ["", "gpu", "none"],
          },
        ],
        /**
         * Scale
         * @see https://tailwindcss.com/docs/scale
         */
        scale: [
          {
            scale: [A],
          },
        ],
        /**
         * Scale X
         * @see https://tailwindcss.com/docs/scale
         */
        "scale-x": [
          {
            "scale-x": [A],
          },
        ],
        /**
         * Scale Y
         * @see https://tailwindcss.com/docs/scale
         */
        "scale-y": [
          {
            "scale-y": [A],
          },
        ],
        /**
         * Rotate
         * @see https://tailwindcss.com/docs/rotate
         */
        rotate: [
          {
            rotate: [Jo, De],
          },
        ],
        /**
         * Translate X
         * @see https://tailwindcss.com/docs/translate
         */
        "translate-x": [
          {
            "translate-x": [j],
          },
        ],
        /**
         * Translate Y
         * @see https://tailwindcss.com/docs/translate
         */
        "translate-y": [
          {
            "translate-y": [j],
          },
        ],
        /**
         * Skew X
         * @see https://tailwindcss.com/docs/skew
         */
        "skew-x": [
          {
            "skew-x": [S],
          },
        ],
        /**
         * Skew Y
         * @see https://tailwindcss.com/docs/skew
         */
        "skew-y": [
          {
            "skew-y": [S],
          },
        ],
        /**
         * Transform Origin
         * @see https://tailwindcss.com/docs/transform-origin
         */
        "transform-origin": [
          {
            origin: [
              "center",
              "top",
              "top-right",
              "right",
              "bottom-right",
              "bottom",
              "bottom-left",
              "left",
              "top-left",
              De,
            ],
          },
        ],
        // Interactivity
        /**
         * Accent Color
         * @see https://tailwindcss.com/docs/accent-color
         */
        accent: [
          {
            accent: ["auto", e],
          },
        ],
        /**
         * Appearance
         * @see https://tailwindcss.com/docs/appearance
         */
        appearance: [
          {
            appearance: ["none", "auto"],
          },
        ],
        /**
         * Cursor
         * @see https://tailwindcss.com/docs/cursor
         */
        cursor: [
          {
            cursor: [
              "auto",
              "default",
              "pointer",
              "wait",
              "text",
              "move",
              "help",
              "not-allowed",
              "none",
              "context-menu",
              "progress",
              "cell",
              "crosshair",
              "vertical-text",
              "alias",
              "copy",
              "no-drop",
              "grab",
              "grabbing",
              "all-scroll",
              "col-resize",
              "row-resize",
              "n-resize",
              "e-resize",
              "s-resize",
              "w-resize",
              "ne-resize",
              "nw-resize",
              "se-resize",
              "sw-resize",
              "ew-resize",
              "ns-resize",
              "nesw-resize",
              "nwse-resize",
              "zoom-in",
              "zoom-out",
              De,
            ],
          },
        ],
        /**
         * Caret Color
         * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
         */
        "caret-color": [
          {
            caret: [e],
          },
        ],
        /**
         * Pointer Events
         * @see https://tailwindcss.com/docs/pointer-events
         */
        "pointer-events": [
          {
            "pointer-events": ["none", "auto"],
          },
        ],
        /**
         * Resize
         * @see https://tailwindcss.com/docs/resize
         */
        resize: [
          {
            resize: ["none", "y", "x", ""],
          },
        ],
        /**
         * Scroll Behavior
         * @see https://tailwindcss.com/docs/scroll-behavior
         */
        "scroll-behavior": [
          {
            scroll: ["auto", "smooth"],
          },
        ],
        /**
         * Scroll Margin
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        "scroll-m": [
          {
            "scroll-m": G(),
          },
        ],
        /**
         * Scroll Margin X
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        "scroll-mx": [
          {
            "scroll-mx": G(),
          },
        ],
        /**
         * Scroll Margin Y
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        "scroll-my": [
          {
            "scroll-my": G(),
          },
        ],
        /**
         * Scroll Margin Start
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        "scroll-ms": [
          {
            "scroll-ms": G(),
          },
        ],
        /**
         * Scroll Margin End
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        "scroll-me": [
          {
            "scroll-me": G(),
          },
        ],
        /**
         * Scroll Margin Top
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        "scroll-mt": [
          {
            "scroll-mt": G(),
          },
        ],
        /**
         * Scroll Margin Right
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        "scroll-mr": [
          {
            "scroll-mr": G(),
          },
        ],
        /**
         * Scroll Margin Bottom
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        "scroll-mb": [
          {
            "scroll-mb": G(),
          },
        ],
        /**
         * Scroll Margin Left
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        "scroll-ml": [
          {
            "scroll-ml": G(),
          },
        ],
        /**
         * Scroll Padding
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        "scroll-p": [
          {
            "scroll-p": G(),
          },
        ],
        /**
         * Scroll Padding X
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        "scroll-px": [
          {
            "scroll-px": G(),
          },
        ],
        /**
         * Scroll Padding Y
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        "scroll-py": [
          {
            "scroll-py": G(),
          },
        ],
        /**
         * Scroll Padding Start
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        "scroll-ps": [
          {
            "scroll-ps": G(),
          },
        ],
        /**
         * Scroll Padding End
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        "scroll-pe": [
          {
            "scroll-pe": G(),
          },
        ],
        /**
         * Scroll Padding Top
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        "scroll-pt": [
          {
            "scroll-pt": G(),
          },
        ],
        /**
         * Scroll Padding Right
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        "scroll-pr": [
          {
            "scroll-pr": G(),
          },
        ],
        /**
         * Scroll Padding Bottom
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        "scroll-pb": [
          {
            "scroll-pb": G(),
          },
        ],
        /**
         * Scroll Padding Left
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        "scroll-pl": [
          {
            "scroll-pl": G(),
          },
        ],
        /**
         * Scroll Snap Align
         * @see https://tailwindcss.com/docs/scroll-snap-align
         */
        "snap-align": [
          {
            snap: ["start", "end", "center", "align-none"],
          },
        ],
        /**
         * Scroll Snap Stop
         * @see https://tailwindcss.com/docs/scroll-snap-stop
         */
        "snap-stop": [
          {
            snap: ["normal", "always"],
          },
        ],
        /**
         * Scroll Snap Type
         * @see https://tailwindcss.com/docs/scroll-snap-type
         */
        "snap-type": [
          {
            snap: ["none", "x", "y", "both"],
          },
        ],
        /**
         * Scroll Snap Type Strictness
         * @see https://tailwindcss.com/docs/scroll-snap-type
         */
        "snap-strictness": [
          {
            snap: ["mandatory", "proximity"],
          },
        ],
        /**
         * Touch Action
         * @see https://tailwindcss.com/docs/touch-action
         */
        touch: [
          {
            touch: ["auto", "none", "manipulation"],
          },
        ],
        /**
         * Touch Action X
         * @see https://tailwindcss.com/docs/touch-action
         */
        "touch-x": [
          {
            "touch-pan": ["x", "left", "right"],
          },
        ],
        /**
         * Touch Action Y
         * @see https://tailwindcss.com/docs/touch-action
         */
        "touch-y": [
          {
            "touch-pan": ["y", "up", "down"],
          },
        ],
        /**
         * Touch Action Pinch Zoom
         * @see https://tailwindcss.com/docs/touch-action
         */
        "touch-pz": ["touch-pinch-zoom"],
        /**
         * User Select
         * @see https://tailwindcss.com/docs/user-select
         */
        select: [
          {
            select: ["none", "text", "all", "auto"],
          },
        ],
        /**
         * Will Change
         * @see https://tailwindcss.com/docs/will-change
         */
        "will-change": [
          {
            "will-change": ["auto", "scroll", "contents", "transform", De],
          },
        ],
        // SVG
        /**
         * Fill
         * @see https://tailwindcss.com/docs/fill
         */
        fill: [
          {
            fill: [e, "none"],
          },
        ],
        /**
         * Stroke Width
         * @see https://tailwindcss.com/docs/stroke-width
         */
        "stroke-w": [
          {
            stroke: [Ar, Jr, gs],
          },
        ],
        /**
         * Stroke
         * @see https://tailwindcss.com/docs/stroke
         */
        stroke: [
          {
            stroke: [e, "none"],
          },
        ],
        // Accessibility
        /**
         * Screen Readers
         * @see https://tailwindcss.com/docs/screen-readers
         */
        sr: ["sr-only", "not-sr-only"],
        /**
         * Forced Color Adjust
         * @see https://tailwindcss.com/docs/forced-color-adjust
         */
        "forced-color-adjust": [
          {
            "forced-color-adjust": ["auto", "none"],
          },
        ],
      },
      conflictingClassGroups: {
        overflow: ["overflow-x", "overflow-y"],
        overscroll: ["overscroll-x", "overscroll-y"],
        inset: [
          "inset-x",
          "inset-y",
          "start",
          "end",
          "top",
          "right",
          "bottom",
          "left",
        ],
        "inset-x": ["right", "left"],
        "inset-y": ["top", "bottom"],
        flex: ["basis", "grow", "shrink"],
        gap: ["gap-x", "gap-y"],
        p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
        px: ["pr", "pl"],
        py: ["pt", "pb"],
        m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
        mx: ["mr", "ml"],
        my: ["mt", "mb"],
        size: ["w", "h"],
        "font-size": ["leading"],
        "fvn-normal": [
          "fvn-ordinal",
          "fvn-slashed-zero",
          "fvn-figure",
          "fvn-spacing",
          "fvn-fraction",
        ],
        "fvn-ordinal": ["fvn-normal"],
        "fvn-slashed-zero": ["fvn-normal"],
        "fvn-figure": ["fvn-normal"],
        "fvn-spacing": ["fvn-normal"],
        "fvn-fraction": ["fvn-normal"],
        "line-clamp": ["display", "overflow"],
        rounded: [
          "rounded-s",
          "rounded-e",
          "rounded-t",
          "rounded-r",
          "rounded-b",
          "rounded-l",
          "rounded-ss",
          "rounded-se",
          "rounded-ee",
          "rounded-es",
          "rounded-tl",
          "rounded-tr",
          "rounded-br",
          "rounded-bl",
        ],
        "rounded-s": ["rounded-ss", "rounded-es"],
        "rounded-e": ["rounded-se", "rounded-ee"],
        "rounded-t": ["rounded-tl", "rounded-tr"],
        "rounded-r": ["rounded-tr", "rounded-br"],
        "rounded-b": ["rounded-br", "rounded-bl"],
        "rounded-l": ["rounded-tl", "rounded-bl"],
        "border-spacing": ["border-spacing-x", "border-spacing-y"],
        "border-w": [
          "border-w-s",
          "border-w-e",
          "border-w-t",
          "border-w-r",
          "border-w-b",
          "border-w-l",
        ],
        "border-w-x": ["border-w-r", "border-w-l"],
        "border-w-y": ["border-w-t", "border-w-b"],
        "border-color": [
          "border-color-t",
          "border-color-r",
          "border-color-b",
          "border-color-l",
        ],
        "border-color-x": ["border-color-r", "border-color-l"],
        "border-color-y": ["border-color-t", "border-color-b"],
        "scroll-m": [
          "scroll-mx",
          "scroll-my",
          "scroll-ms",
          "scroll-me",
          "scroll-mt",
          "scroll-mr",
          "scroll-mb",
          "scroll-ml",
        ],
        "scroll-mx": ["scroll-mr", "scroll-ml"],
        "scroll-my": ["scroll-mt", "scroll-mb"],
        "scroll-p": [
          "scroll-px",
          "scroll-py",
          "scroll-ps",
          "scroll-pe",
          "scroll-pt",
          "scroll-pr",
          "scroll-pb",
          "scroll-pl",
        ],
        "scroll-px": ["scroll-pr", "scroll-pl"],
        "scroll-py": ["scroll-pt", "scroll-pb"],
        touch: ["touch-x", "touch-y", "touch-pz"],
        "touch-x": ["touch"],
        "touch-y": ["touch"],
        "touch-pz": ["touch"],
      },
      conflictingClassGroupModifiers: {
        "font-size": ["leading"],
      },
    };
  }
  const _1 = /* @__PURE__ */ e1(y1);
  var $1 =
    typeof global == "object" && global && global.Object === Object && global;
  const km = $1;
  var b1 = typeof self == "object" && self && self.Object === Object && self,
    w1 = km || b1 || Function("return this")();
  const Hr = w1;
  var E1 = Hr.Symbol;
  const br = E1;
  var Bm = Object.prototype,
    O1 = Bm.hasOwnProperty,
    A1 = Bm.toString,
    Zo = br ? br.toStringTag : void 0;
  function S1(e) {
    var t = O1.call(e, Zo),
      r = e[Zo];
    try {
      e[Zo] = void 0;
      var n = !0;
    } catch {}
    var o = A1.call(e);
    return n && (t ? (e[Zo] = r) : delete e[Zo]), o;
  }
  var N1 = Object.prototype,
    P1 = N1.toString;
  function C1(e) {
    return P1.call(e);
  }
  var T1 = "[object Null]",
    x1 = "[object Undefined]",
    Id = br ? br.toStringTag : void 0;
  function Xn(e) {
    return e == null
      ? e === void 0
        ? x1
        : T1
      : Id && Id in Object(e)
        ? S1(e)
        : C1(e);
  }
  function Un(e) {
    return e != null && typeof e == "object";
  }
  var D1 = "[object Symbol]";
  function Na(e) {
    return typeof e == "symbol" || (Un(e) && Xn(e) == D1);
  }
  function Pa(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length, o = Array(n); ++r < n; )
      o[r] = t(e[r], r, e);
    return o;
  }
  var I1 = Array.isArray;
  const At = I1;
  var R1 = 1 / 0,
    Rd = br ? br.prototype : void 0,
    Md = Rd ? Rd.toString : void 0;
  function zm(e) {
    if (typeof e == "string") return e;
    if (At(e)) return Pa(e, zm) + "";
    if (Na(e)) return Md ? Md.call(e) : "";
    var t = e + "";
    return t == "0" && 1 / e == -R1 ? "-0" : t;
  }
  var M1 = /\s/;
  function j1(e) {
    for (var t = e.length; t-- && M1.test(e.charAt(t)); );
    return t;
  }
  var F1 = /^\s+/;
  function L1(e) {
    return e && e.slice(0, j1(e) + 1).replace(F1, "");
  }
  function sr(e) {
    var t = typeof e;
    return e != null && (t == "object" || t == "function");
  }
  var jd = 0 / 0,
    V1 = /^[-+]0x[0-9a-f]+$/i,
    k1 = /^0b[01]+$/i,
    B1 = /^0o[0-7]+$/i,
    z1 = parseInt;
  function U1(e) {
    if (typeof e == "number") return e;
    if (Na(e)) return jd;
    if (sr(e)) {
      var t = typeof e.valueOf == "function" ? e.valueOf() : e;
      e = sr(t) ? t + "" : t;
    }
    if (typeof e != "string") return e === 0 ? e : +e;
    e = L1(e);
    var r = k1.test(e);
    return r || B1.test(e) ? z1(e.slice(2), r ? 2 : 8) : V1.test(e) ? jd : +e;
  }
  var Fd = 1 / 0,
    W1 = 17976931348623157e292;
  function H1(e) {
    if (!e) return e === 0 ? e : 0;
    if (((e = U1(e)), e === Fd || e === -Fd)) {
      var t = e < 0 ? -1 : 1;
      return t * W1;
    }
    return e === e ? e : 0;
  }
  function Um(e) {
    var t = H1(e),
      r = t % 1;
    return t === t ? (r ? t - r : t) : 0;
  }
  function Wm(e) {
    return e;
  }
  var K1 = "[object AsyncFunction]",
    G1 = "[object Function]",
    q1 = "[object GeneratorFunction]",
    Y1 = "[object Proxy]";
  function ru(e) {
    if (!sr(e)) return !1;
    var t = Xn(e);
    return t == G1 || t == q1 || t == K1 || t == Y1;
  }
  var J1 = Hr["__core-js_shared__"];
  const cl = J1;
  var Ld = (function () {
    var e = /[^.]+$/.exec((cl && cl.keys && cl.keys.IE_PROTO) || "");
    return e ? "Symbol(src)_1." + e : "";
  })();
  function X1(e) {
    return !!Ld && Ld in e;
  }
  var Z1 = Function.prototype,
    Q1 = Z1.toString;
  function Zn(e) {
    if (e != null) {
      try {
        return Q1.call(e);
      } catch {}
      try {
        return e + "";
      } catch {}
    }
    return "";
  }
  var eO = /[\\^$.*+?()[\]{}|]/g,
    tO = /^\[object .+?Constructor\]$/,
    rO = Function.prototype,
    nO = Object.prototype,
    oO = rO.toString,
    iO = nO.hasOwnProperty,
    sO = RegExp(
      "^" +
        oO
          .call(iO)
          .replace(eO, "\\$&")
          .replace(
            /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
            "$1.*?"
          ) +
        "$"
    );
  function aO(e) {
    if (!sr(e) || X1(e)) return !1;
    var t = ru(e) ? sO : tO;
    return t.test(Zn(e));
  }
  function lO(e, t) {
    return e == null ? void 0 : e[t];
  }
  function Qn(e, t) {
    var r = lO(e, t);
    return aO(r) ? r : void 0;
  }
  var cO = Qn(Hr, "WeakMap");
  const ec = cO;
  var uO = (function () {
    try {
      var e = Qn(Object, "defineProperty");
      return e({}, "", {}), e;
    } catch {}
  })();
  const Vd = uO;
  function fO(e, t) {
    for (
      var r = -1, n = e == null ? 0 : e.length;
      ++r < n && t(e[r], r, e) !== !1;

    );
    return e;
  }
  function Hm(e, t, r, n) {
    for (var o = e.length, i = r + (n ? 1 : -1); n ? i-- : ++i < o; )
      if (t(e[i], i, e)) return i;
    return -1;
  }
  function dO(e) {
    return e !== e;
  }
  function pO(e, t, r) {
    for (var n = r - 1, o = e.length; ++n < o; ) if (e[n] === t) return n;
    return -1;
  }
  function hO(e, t, r) {
    return t === t ? pO(e, t, r) : Hm(e, dO, r);
  }
  var gO = 9007199254740991,
    mO = /^(?:0|[1-9]\d*)$/;
  function nu(e, t) {
    var r = typeof e;
    return (
      (t = t ?? gO),
      !!t &&
        (r == "number" || (r != "symbol" && mO.test(e))) &&
        e > -1 &&
        e % 1 == 0 &&
        e < t
    );
  }
  function Km(e, t, r) {
    t == "__proto__" && Vd
      ? Vd(e, t, {
          configurable: !0,
          enumerable: !0,
          value: r,
          writable: !0,
        })
      : (e[t] = r);
  }
  function ou(e, t) {
    return e === t || (e !== e && t !== t);
  }
  var vO = Object.prototype,
    yO = vO.hasOwnProperty;
  function _O(e, t, r) {
    var n = e[t];
    (!(yO.call(e, t) && ou(n, r)) || (r === void 0 && !(t in e))) &&
      Km(e, t, r);
  }
  var $O = 9007199254740991;
  function iu(e) {
    return typeof e == "number" && e > -1 && e % 1 == 0 && e <= $O;
  }
  function eo(e) {
    return e != null && iu(e.length) && !ru(e);
  }
  var bO = Object.prototype;
  function su(e) {
    var t = e && e.constructor,
      r = (typeof t == "function" && t.prototype) || bO;
    return e === r;
  }
  function wO(e, t) {
    for (var r = -1, n = Array(e); ++r < e; ) n[r] = t(r);
    return n;
  }
  var EO = "[object Arguments]";
  function kd(e) {
    return Un(e) && Xn(e) == EO;
  }
  var Gm = Object.prototype,
    OO = Gm.hasOwnProperty,
    AO = Gm.propertyIsEnumerable,
    SO = kd(
      (function () {
        return arguments;
      })()
    )
      ? kd
      : function (e) {
          return Un(e) && OO.call(e, "callee") && !AO.call(e, "callee");
        };
  const Ca = SO;
  function NO() {
    return !1;
  }
  var qm = typeof Tr == "object" && Tr && !Tr.nodeType && Tr,
    Bd = qm && typeof xr == "object" && xr && !xr.nodeType && xr,
    PO = Bd && Bd.exports === qm,
    zd = PO ? Hr.Buffer : void 0,
    CO = zd ? zd.isBuffer : void 0,
    TO = CO || NO;
  const Js = TO;
  var xO = "[object Arguments]",
    DO = "[object Array]",
    IO = "[object Boolean]",
    RO = "[object Date]",
    MO = "[object Error]",
    jO = "[object Function]",
    FO = "[object Map]",
    LO = "[object Number]",
    VO = "[object Object]",
    kO = "[object RegExp]",
    BO = "[object Set]",
    zO = "[object String]",
    UO = "[object WeakMap]",
    WO = "[object ArrayBuffer]",
    HO = "[object DataView]",
    KO = "[object Float32Array]",
    GO = "[object Float64Array]",
    qO = "[object Int8Array]",
    YO = "[object Int16Array]",
    JO = "[object Int32Array]",
    XO = "[object Uint8Array]",
    ZO = "[object Uint8ClampedArray]",
    QO = "[object Uint16Array]",
    eA = "[object Uint32Array]",
    Xe = {};
  Xe[KO] =
    Xe[GO] =
    Xe[qO] =
    Xe[YO] =
    Xe[JO] =
    Xe[XO] =
    Xe[ZO] =
    Xe[QO] =
    Xe[eA] =
      !0;
  Xe[xO] =
    Xe[DO] =
    Xe[WO] =
    Xe[IO] =
    Xe[HO] =
    Xe[RO] =
    Xe[MO] =
    Xe[jO] =
    Xe[FO] =
    Xe[LO] =
    Xe[VO] =
    Xe[kO] =
    Xe[BO] =
    Xe[zO] =
    Xe[UO] =
      !1;
  function tA(e) {
    return Un(e) && iu(e.length) && !!Xe[Xn(e)];
  }
  function rA(e) {
    return function (t) {
      return e(t);
    };
  }
  var Ym = typeof Tr == "object" && Tr && !Tr.nodeType && Tr,
    gi = Ym && typeof xr == "object" && xr && !xr.nodeType && xr,
    nA = gi && gi.exports === Ym,
    ul = nA && km.process,
    oA = (function () {
      try {
        var e = gi && gi.require && gi.require("util").types;
        return e || (ul && ul.binding && ul.binding("util"));
      } catch {}
    })();
  const Ud = oA;
  var Wd = Ud && Ud.isTypedArray,
    iA = Wd ? rA(Wd) : tA;
  const au = iA;
  var sA = Object.prototype,
    aA = sA.hasOwnProperty;
  function Jm(e, t) {
    var r = At(e),
      n = !r && Ca(e),
      o = !r && !n && Js(e),
      i = !r && !n && !o && au(e),
      s = r || n || o || i,
      a = s ? wO(e.length, String) : [],
      l = a.length;
    for (var c in e)
      (t || aA.call(e, c)) &&
        !(
          s && // Safari 9 has enumerable `arguments.length` in strict mode.
          (c == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            (o && (c == "offset" || c == "parent")) || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            (i && (c == "buffer" || c == "byteLength" || c == "byteOffset")) || // Skip index properties.
            nu(c, l))
        ) &&
        a.push(c);
    return a;
  }
  function Xm(e, t) {
    return function (r) {
      return e(t(r));
    };
  }
  var lA = Xm(Object.keys, Object);
  const cA = lA;
  var uA = Object.prototype,
    fA = uA.hasOwnProperty;
  function Zm(e) {
    if (!su(e)) return cA(e);
    var t = [];
    for (var r in Object(e)) fA.call(e, r) && r != "constructor" && t.push(r);
    return t;
  }
  function Bi(e) {
    return eo(e) ? Jm(e) : Zm(e);
  }
  function dA(e) {
    var t = [];
    if (e != null) for (var r in Object(e)) t.push(r);
    return t;
  }
  var pA = Object.prototype,
    hA = pA.hasOwnProperty;
  function gA(e) {
    if (!sr(e)) return dA(e);
    var t = su(e),
      r = [];
    for (var n in e) (n == "constructor" && (t || !hA.call(e, n))) || r.push(n);
    return r;
  }
  function mA(e) {
    return eo(e) ? Jm(e, !0) : gA(e);
  }
  var vA = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    yA = /^\w*$/;
  function lu(e, t) {
    if (At(e)) return !1;
    var r = typeof e;
    return r == "number" ||
      r == "symbol" ||
      r == "boolean" ||
      e == null ||
      Na(e)
      ? !0
      : yA.test(e) || !vA.test(e) || (t != null && e in Object(t));
  }
  var _A = Qn(Object, "create");
  const Pi = _A;
  function $A() {
    (this.__data__ = Pi ? Pi(null) : {}), (this.size = 0);
  }
  function bA(e) {
    var t = this.has(e) && delete this.__data__[e];
    return (this.size -= t ? 1 : 0), t;
  }
  var wA = "__lodash_hash_undefined__",
    EA = Object.prototype,
    OA = EA.hasOwnProperty;
  function AA(e) {
    var t = this.__data__;
    if (Pi) {
      var r = t[e];
      return r === wA ? void 0 : r;
    }
    return OA.call(t, e) ? t[e] : void 0;
  }
  var SA = Object.prototype,
    NA = SA.hasOwnProperty;
  function PA(e) {
    var t = this.__data__;
    return Pi ? t[e] !== void 0 : NA.call(t, e);
  }
  var CA = "__lodash_hash_undefined__";
  function TA(e, t) {
    var r = this.__data__;
    return (
      (this.size += this.has(e) ? 0 : 1),
      (r[e] = Pi && t === void 0 ? CA : t),
      this
    );
  }
  function Wn(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  Wn.prototype.clear = $A;
  Wn.prototype.delete = bA;
  Wn.prototype.get = AA;
  Wn.prototype.has = PA;
  Wn.prototype.set = TA;
  function xA() {
    (this.__data__ = []), (this.size = 0);
  }
  function Ta(e, t) {
    for (var r = e.length; r--; ) if (ou(e[r][0], t)) return r;
    return -1;
  }
  var DA = Array.prototype,
    IA = DA.splice;
  function RA(e) {
    var t = this.__data__,
      r = Ta(t, e);
    if (r < 0) return !1;
    var n = t.length - 1;
    return r == n ? t.pop() : IA.call(t, r, 1), --this.size, !0;
  }
  function MA(e) {
    var t = this.__data__,
      r = Ta(t, e);
    return r < 0 ? void 0 : t[r][1];
  }
  function jA(e) {
    return Ta(this.__data__, e) > -1;
  }
  function FA(e, t) {
    var r = this.__data__,
      n = Ta(r, e);
    return n < 0 ? (++this.size, r.push([e, t])) : (r[n][1] = t), this;
  }
  function Kr(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  Kr.prototype.clear = xA;
  Kr.prototype.delete = RA;
  Kr.prototype.get = MA;
  Kr.prototype.has = jA;
  Kr.prototype.set = FA;
  var LA = Qn(Hr, "Map");
  const Ci = LA;
  function VA() {
    (this.size = 0),
      (this.__data__ = {
        hash: new Wn(),
        map: new (Ci || Kr)(),
        string: new Wn(),
      });
  }
  function kA(e) {
    var t = typeof e;
    return t == "string" || t == "number" || t == "symbol" || t == "boolean"
      ? e !== "__proto__"
      : e === null;
  }
  function xa(e, t) {
    var r = e.__data__;
    return kA(t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
  }
  function BA(e) {
    var t = xa(this, e).delete(e);
    return (this.size -= t ? 1 : 0), t;
  }
  function zA(e) {
    return xa(this, e).get(e);
  }
  function UA(e) {
    return xa(this, e).has(e);
  }
  function WA(e, t) {
    var r = xa(this, e),
      n = r.size;
    return r.set(e, t), (this.size += r.size == n ? 0 : 1), this;
  }
  function Gr(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  Gr.prototype.clear = VA;
  Gr.prototype.delete = BA;
  Gr.prototype.get = zA;
  Gr.prototype.has = UA;
  Gr.prototype.set = WA;
  var HA = "Expected a function";
  function cu(e, t) {
    if (typeof e != "function" || (t != null && typeof t != "function"))
      throw new TypeError(HA);
    var r = function () {
      var n = arguments,
        o = t ? t.apply(this, n) : n[0],
        i = r.cache;
      if (i.has(o)) return i.get(o);
      var s = e.apply(this, n);
      return (r.cache = i.set(o, s) || i), s;
    };
    return (r.cache = new (cu.Cache || Gr)()), r;
  }
  cu.Cache = Gr;
  var KA = 500;
  function GA(e) {
    var t = cu(e, function (n) {
        return r.size === KA && r.clear(), n;
      }),
      r = t.cache;
    return t;
  }
  var qA =
      /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
    YA = /\\(\\)?/g,
    JA = GA(function (e) {
      var t = [];
      return (
        e.charCodeAt(0) === 46 && t.push(""),
        e.replace(qA, function (r, n, o, i) {
          t.push(o ? i.replace(YA, "$1") : n || r);
        }),
        t
      );
    });
  const XA = JA;
  function ZA(e) {
    return e == null ? "" : zm(e);
  }
  function Da(e, t) {
    return At(e) ? e : lu(e, t) ? [e] : XA(ZA(e));
  }
  var QA = 1 / 0;
  function zi(e) {
    if (typeof e == "string" || Na(e)) return e;
    var t = e + "";
    return t == "0" && 1 / e == -QA ? "-0" : t;
  }
  function uu(e, t) {
    t = Da(t, e);
    for (var r = 0, n = t.length; e != null && r < n; ) e = e[zi(t[r++])];
    return r && r == n ? e : void 0;
  }
  function fu(e, t, r) {
    var n = e == null ? void 0 : uu(e, t);
    return n === void 0 ? r : n;
  }
  function du(e, t) {
    for (var r = -1, n = t.length, o = e.length; ++r < n; ) e[o + r] = t[r];
    return e;
  }
  var Hd = br ? br.isConcatSpreadable : void 0;
  function eS(e) {
    return At(e) || Ca(e) || !!(Hd && e && e[Hd]);
  }
  function Qm(e, t, r, n, o) {
    var i = -1,
      s = e.length;
    for (r || (r = eS), o || (o = []); ++i < s; ) {
      var a = e[i];
      t > 0 && r(a)
        ? t > 1
          ? Qm(a, t - 1, r, n, o)
          : du(o, a)
        : n || (o[o.length] = a);
    }
    return o;
  }
  var tS = Xm(Object.getPrototypeOf, Object);
  const rS = tS;
  function nS(e, t, r, n) {
    var o = -1,
      i = e == null ? 0 : e.length;
    for (n && i && (r = e[++o]); ++o < i; ) r = t(r, e[o], o, e);
    return r;
  }
  function oS() {
    (this.__data__ = new Kr()), (this.size = 0);
  }
  function iS(e) {
    var t = this.__data__,
      r = t.delete(e);
    return (this.size = t.size), r;
  }
  function sS(e) {
    return this.__data__.get(e);
  }
  function aS(e) {
    return this.__data__.has(e);
  }
  var lS = 200;
  function cS(e, t) {
    var r = this.__data__;
    if (r instanceof Kr) {
      var n = r.__data__;
      if (!Ci || n.length < lS - 1)
        return n.push([e, t]), (this.size = ++r.size), this;
      r = this.__data__ = new Gr(n);
    }
    return r.set(e, t), (this.size = r.size), this;
  }
  function Ir(e) {
    var t = (this.__data__ = new Kr(e));
    this.size = t.size;
  }
  Ir.prototype.clear = oS;
  Ir.prototype.delete = iS;
  Ir.prototype.get = sS;
  Ir.prototype.has = aS;
  Ir.prototype.set = cS;
  function uS(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length, o = 0, i = []; ++r < n; ) {
      var s = e[r];
      t(s, r, e) && (i[o++] = s);
    }
    return i;
  }
  function ev() {
    return [];
  }
  var fS = Object.prototype,
    dS = fS.propertyIsEnumerable,
    Kd = Object.getOwnPropertySymbols,
    pS = Kd
      ? function (e) {
          return e == null
            ? []
            : ((e = Object(e)),
              uS(Kd(e), function (t) {
                return dS.call(e, t);
              }));
        }
      : ev;
  const tv = pS;
  var hS = Object.getOwnPropertySymbols,
    gS = hS
      ? function (e) {
          for (var t = []; e; ) du(t, tv(e)), (e = rS(e));
          return t;
        }
      : ev;
  const mS = gS;
  function rv(e, t, r) {
    var n = t(e);
    return At(e) ? n : du(n, r(e));
  }
  function Gd(e) {
    return rv(e, Bi, tv);
  }
  function vS(e) {
    return rv(e, mA, mS);
  }
  var yS = Qn(Hr, "DataView");
  const tc = yS;
  var _S = Qn(Hr, "Promise");
  const rc = _S;
  var $S = Qn(Hr, "Set");
  const nc = $S;
  var qd = "[object Map]",
    bS = "[object Object]",
    Yd = "[object Promise]",
    Jd = "[object Set]",
    Xd = "[object WeakMap]",
    Zd = "[object DataView]",
    wS = Zn(tc),
    ES = Zn(Ci),
    OS = Zn(rc),
    AS = Zn(nc),
    SS = Zn(ec),
    On = Xn;
  ((tc && On(new tc(new ArrayBuffer(1))) != Zd) ||
    (Ci && On(new Ci()) != qd) ||
    (rc && On(rc.resolve()) != Yd) ||
    (nc && On(new nc()) != Jd) ||
    (ec && On(new ec()) != Xd)) &&
    (On = function (e) {
      var t = Xn(e),
        r = t == bS ? e.constructor : void 0,
        n = r ? Zn(r) : "";
      if (n)
        switch (n) {
          case wS:
            return Zd;
          case ES:
            return qd;
          case OS:
            return Yd;
          case AS:
            return Jd;
          case SS:
            return Xd;
        }
      return t;
    });
  const oc = On;
  var NS = Hr.Uint8Array;
  const Qd = NS;
  var PS = "__lodash_hash_undefined__";
  function CS(e) {
    return this.__data__.set(e, PS), this;
  }
  function TS(e) {
    return this.__data__.has(e);
  }
  function Xs(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.__data__ = new Gr(); ++t < r; ) this.add(e[t]);
  }
  Xs.prototype.add = Xs.prototype.push = CS;
  Xs.prototype.has = TS;
  function xS(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length; ++r < n; )
      if (t(e[r], r, e)) return !0;
    return !1;
  }
  function DS(e, t) {
    return e.has(t);
  }
  var IS = 1,
    RS = 2;
  function nv(e, t, r, n, o, i) {
    var s = r & IS,
      a = e.length,
      l = t.length;
    if (a != l && !(s && l > a)) return !1;
    var c = i.get(e),
      u = i.get(t);
    if (c && u) return c == t && u == e;
    var f = -1,
      d = !0,
      p = r & RS ? new Xs() : void 0;
    for (i.set(e, t), i.set(t, e); ++f < a; ) {
      var h = e[f],
        m = t[f];
      if (n) var v = s ? n(m, h, f, t, e, i) : n(h, m, f, e, t, i);
      if (v !== void 0) {
        if (v) continue;
        d = !1;
        break;
      }
      if (p) {
        if (
          !xS(t, function (g, _) {
            if (!DS(p, _) && (h === g || o(h, g, r, n, i))) return p.push(_);
          })
        ) {
          d = !1;
          break;
        }
      } else if (!(h === m || o(h, m, r, n, i))) {
        d = !1;
        break;
      }
    }
    return i.delete(e), i.delete(t), d;
  }
  function MS(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (n, o) {
        r[++t] = [o, n];
      }),
      r
    );
  }
  function jS(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (n) {
        r[++t] = n;
      }),
      r
    );
  }
  var FS = 1,
    LS = 2,
    VS = "[object Boolean]",
    kS = "[object Date]",
    BS = "[object Error]",
    zS = "[object Map]",
    US = "[object Number]",
    WS = "[object RegExp]",
    HS = "[object Set]",
    KS = "[object String]",
    GS = "[object Symbol]",
    qS = "[object ArrayBuffer]",
    YS = "[object DataView]",
    ep = br ? br.prototype : void 0,
    fl = ep ? ep.valueOf : void 0;
  function JS(e, t, r, n, o, i, s) {
    switch (r) {
      case YS:
        if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
          return !1;
        (e = e.buffer), (t = t.buffer);
      case qS:
        return !(e.byteLength != t.byteLength || !i(new Qd(e), new Qd(t)));
      case VS:
      case kS:
      case US:
        return ou(+e, +t);
      case BS:
        return e.name == t.name && e.message == t.message;
      case WS:
      case KS:
        return e == t + "";
      case zS:
        var a = MS;
      case HS:
        var l = n & FS;
        if ((a || (a = jS), e.size != t.size && !l)) return !1;
        var c = s.get(e);
        if (c) return c == t;
        (n |= LS), s.set(e, t);
        var u = nv(a(e), a(t), n, o, i, s);
        return s.delete(e), u;
      case GS:
        if (fl) return fl.call(e) == fl.call(t);
    }
    return !1;
  }
  var XS = 1,
    ZS = Object.prototype,
    QS = ZS.hasOwnProperty;
  function eN(e, t, r, n, o, i) {
    var s = r & XS,
      a = Gd(e),
      l = a.length,
      c = Gd(t),
      u = c.length;
    if (l != u && !s) return !1;
    for (var f = l; f--; ) {
      var d = a[f];
      if (!(s ? d in t : QS.call(t, d))) return !1;
    }
    var p = i.get(e),
      h = i.get(t);
    if (p && h) return p == t && h == e;
    var m = !0;
    i.set(e, t), i.set(t, e);
    for (var v = s; ++f < l; ) {
      d = a[f];
      var g = e[d],
        _ = t[d];
      if (n) var E = s ? n(_, g, d, t, e, i) : n(g, _, d, e, t, i);
      if (!(E === void 0 ? g === _ || o(g, _, r, n, i) : E)) {
        m = !1;
        break;
      }
      v || (v = d == "constructor");
    }
    if (m && !v) {
      var A = e.constructor,
        D = t.constructor;
      A != D &&
        "constructor" in e &&
        "constructor" in t &&
        !(
          typeof A == "function" &&
          A instanceof A &&
          typeof D == "function" &&
          D instanceof D
        ) &&
        (m = !1);
    }
    return i.delete(e), i.delete(t), m;
  }
  var tN = 1,
    tp = "[object Arguments]",
    rp = "[object Array]",
    ms = "[object Object]",
    rN = Object.prototype,
    np = rN.hasOwnProperty;
  function nN(e, t, r, n, o, i) {
    var s = At(e),
      a = At(t),
      l = s ? rp : oc(e),
      c = a ? rp : oc(t);
    (l = l == tp ? ms : l), (c = c == tp ? ms : c);
    var u = l == ms,
      f = c == ms,
      d = l == c;
    if (d && Js(e)) {
      if (!Js(t)) return !1;
      (s = !0), (u = !1);
    }
    if (d && !u)
      return (
        i || (i = new Ir()),
        s || au(e) ? nv(e, t, r, n, o, i) : JS(e, t, l, r, n, o, i)
      );
    if (!(r & tN)) {
      var p = u && np.call(e, "__wrapped__"),
        h = f && np.call(t, "__wrapped__");
      if (p || h) {
        var m = p ? e.value() : e,
          v = h ? t.value() : t;
        return i || (i = new Ir()), o(m, v, r, n, i);
      }
    }
    return d ? (i || (i = new Ir()), eN(e, t, r, n, o, i)) : !1;
  }
  function pu(e, t, r, n, o) {
    return e === t
      ? !0
      : e == null || t == null || (!Un(e) && !Un(t))
        ? e !== e && t !== t
        : nN(e, t, r, n, pu, o);
  }
  var oN = 1,
    iN = 2;
  function sN(e, t, r, n) {
    var o = r.length,
      i = o,
      s = !n;
    if (e == null) return !i;
    for (e = Object(e); o--; ) {
      var a = r[o];
      if (s && a[2] ? a[1] !== e[a[0]] : !(a[0] in e)) return !1;
    }
    for (; ++o < i; ) {
      a = r[o];
      var l = a[0],
        c = e[l],
        u = a[1];
      if (s && a[2]) {
        if (c === void 0 && !(l in e)) return !1;
      } else {
        var f = new Ir();
        if (n) var d = n(c, u, l, e, t, f);
        if (!(d === void 0 ? pu(u, c, oN | iN, n, f) : d)) return !1;
      }
    }
    return !0;
  }
  function ov(e) {
    return e === e && !sr(e);
  }
  function aN(e) {
    for (var t = Bi(e), r = t.length; r--; ) {
      var n = t[r],
        o = e[n];
      t[r] = [n, o, ov(o)];
    }
    return t;
  }
  function iv(e, t) {
    return function (r) {
      return r == null ? !1 : r[e] === t && (t !== void 0 || e in Object(r));
    };
  }
  function lN(e) {
    var t = aN(e);
    return t.length == 1 && t[0][2]
      ? iv(t[0][0], t[0][1])
      : function (r) {
          return r === e || sN(r, e, t);
        };
  }
  function cN(e, t) {
    return e != null && t in Object(e);
  }
  function uN(e, t, r) {
    t = Da(t, e);
    for (var n = -1, o = t.length, i = !1; ++n < o; ) {
      var s = zi(t[n]);
      if (!(i = e != null && r(e, s))) break;
      e = e[s];
    }
    return i || ++n != o
      ? i
      : ((o = e == null ? 0 : e.length),
        !!o && iu(o) && nu(s, o) && (At(e) || Ca(e)));
  }
  function fN(e, t) {
    return e != null && uN(e, t, cN);
  }
  var dN = 1,
    pN = 2;
  function hN(e, t) {
    return lu(e) && ov(t)
      ? iv(zi(e), t)
      : function (r) {
          var n = fu(r, e);
          return n === void 0 && n === t ? fN(r, e) : pu(t, n, dN | pN);
        };
  }
  function gN(e) {
    return function (t) {
      return t == null ? void 0 : t[e];
    };
  }
  function mN(e) {
    return function (t) {
      return uu(t, e);
    };
  }
  function vN(e) {
    return lu(e) ? gN(zi(e)) : mN(e);
  }
  function to(e) {
    return typeof e == "function"
      ? e
      : e == null
        ? Wm
        : typeof e == "object"
          ? At(e)
            ? hN(e[0], e[1])
            : lN(e)
          : vN(e);
  }
  function yN(e) {
    return function (t, r, n) {
      for (var o = -1, i = Object(t), s = n(t), a = s.length; a--; ) {
        var l = s[e ? a : ++o];
        if (r(i[l], l, i) === !1) break;
      }
      return t;
    };
  }
  var _N = yN();
  const $N = _N;
  function sv(e, t) {
    return e && $N(e, t, Bi);
  }
  function bN(e, t) {
    return function (r, n) {
      if (r == null) return r;
      if (!eo(r)) return e(r, n);
      for (
        var o = r.length, i = t ? o : -1, s = Object(r);
        (t ? i-- : ++i < o) && n(s[i], i, s) !== !1;

      );
      return r;
    };
  }
  var wN = bN(sv);
  const hu = wN;
  function EN(e) {
    return typeof e == "function" ? e : Wm;
  }
  function ON(e, t) {
    var r = At(e) ? fO : hu;
    return r(e, EN(t));
  }
  function AN(e) {
    return function (t, r, n) {
      var o = Object(t);
      if (!eo(t)) {
        var i = to(r);
        (t = Bi(t)),
          (r = function (a) {
            return i(o[a], a, o);
          });
      }
      var s = e(t, r, n);
      return s > -1 ? o[i ? t[s] : s] : void 0;
    };
  }
  var SN = Math.max;
  function NN(e, t, r) {
    var n = e == null ? 0 : e.length;
    if (!n) return -1;
    var o = r == null ? 0 : Um(r);
    return o < 0 && (o = SN(n + o, 0)), Hm(e, to(t), o);
  }
  var PN = AN(NN);
  const CN = PN;
  function TN(e, t) {
    var r = -1,
      n = eo(e) ? Array(e.length) : [];
    return (
      hu(e, function (o, i, s) {
        n[++r] = t(o, i, s);
      }),
      n
    );
  }
  function op(e, t) {
    var r = At(e) ? Pa : TN;
    return r(e, to(t));
  }
  var xN = 1 / 0;
  function DN(e) {
    var t = e == null ? 0 : e.length;
    return t ? Qm(e, xN) : [];
  }
  var IN = "[object String]";
  function av(e) {
    return typeof e == "string" || (!At(e) && Un(e) && Xn(e) == IN);
  }
  function RN(e, t) {
    return Pa(t, function (r) {
      return e[r];
    });
  }
  function MN(e) {
    return e == null ? [] : RN(e, Bi(e));
  }
  var jN = Math.max;
  function FN(e, t, r, n) {
    (e = eo(e) ? e : MN(e)), (r = r && !n ? Um(r) : 0);
    var o = e.length;
    return (
      r < 0 && (r = jN(o + r, 0)),
      av(e) ? r <= o && e.indexOf(t, r) > -1 : !!o && hO(e, t, r) > -1
    );
  }
  var LN = "[object Map]",
    VN = "[object Set]",
    kN = Object.prototype,
    BN = kN.hasOwnProperty;
  function mi(e) {
    if (e == null) return !0;
    if (
      eo(e) &&
      (At(e) ||
        typeof e == "string" ||
        typeof e.splice == "function" ||
        Js(e) ||
        au(e) ||
        Ca(e))
    )
      return !e.length;
    var t = oc(e);
    if (t == LN || t == VN) return !e.size;
    if (su(e)) return !Zm(e).length;
    for (var r in e) if (BN.call(e, r)) return !1;
    return !0;
  }
  function zN(e) {
    return e == null;
  }
  function UN(e, t) {
    var r = {};
    return (
      (t = to(t)),
      sv(e, function (n, o, i) {
        Km(r, o, t(n, o, i));
      }),
      r
    );
  }
  var WN = "Expected a function";
  function HN(e) {
    if (typeof e != "function") throw new TypeError(WN);
    return function () {
      var t = arguments;
      switch (t.length) {
        case 0:
          return !e.call(this);
        case 1:
          return !e.call(this, t[0]);
        case 2:
          return !e.call(this, t[0], t[1]);
        case 3:
          return !e.call(this, t[0], t[1], t[2]);
      }
      return !e.apply(this, t);
    };
  }
  function lv(e, t, r, n) {
    if (!sr(e)) return e;
    t = Da(t, e);
    for (var o = -1, i = t.length, s = i - 1, a = e; a != null && ++o < i; ) {
      var l = zi(t[o]),
        c = r;
      if (l === "__proto__" || l === "constructor" || l === "prototype")
        return e;
      if (o != s) {
        var u = a[l];
        (c = n ? n(u, l, a) : void 0),
          c === void 0 && (c = sr(u) ? u : nu(t[o + 1]) ? [] : {});
      }
      _O(a, l, c), (a = a[l]);
    }
    return e;
  }
  function KN(e, t, r) {
    for (var n = -1, o = t.length, i = {}; ++n < o; ) {
      var s = t[n],
        a = uu(e, s);
      r(a, s) && lv(i, Da(s, e), a);
    }
    return i;
  }
  function GN(e, t) {
    if (e == null) return {};
    var r = Pa(vS(e), function (n) {
      return [n];
    });
    return (
      (t = to(t)),
      KN(e, r, function (n, o) {
        return t(n, o[0]);
      })
    );
  }
  function qN(e, t) {
    return GN(e, HN(to(t)));
  }
  function YN(e, t, r, n, o) {
    return (
      o(e, function (i, s, a) {
        r = n ? ((n = !1), i) : t(r, i, s, a);
      }),
      r
    );
  }
  function cv(e, t, r) {
    var n = At(e) ? nS : YN,
      o = arguments.length < 3;
    return n(e, to(t), r, o, hu);
  }
  function uv(e, t, r) {
    return e == null ? e : lv(e, t, r);
  }
  const JN = Ee(),
    XN = Ee({}),
    ZN = Ee(),
    dl = {
      activeTheme: JN,
      config: XN,
      providedThemes: ZN,
    };
  function QN(e, t = {}) {
    const r = e.map(Object.keys).flat();
    return cv(
      r,
      (n, o) => {
        const i = op(e, a => fu(a, o, {})),
          s = op(i, a => (ru(a) ? a(t) : a));
        return uv(n, o, _1(Rm(...s))), n;
      },
      {}
    );
  }
  function ar(e, t = {}, ...r) {
    return Oe(() => {
      (e = At(e) ? e : [e]), (r = DN(r));
      const n = z(dl == null ? void 0 : dl.config);
      mi(n) || r.push(n);
      const o = qN(
          UN(z(t), s => z(s)),
          zN
        ),
        i = {};
      return (
        ON(e, s => {
          const a = cv(
            r,
            (l, c) => {
              c = Ne(z(c));
              const u = fu(c, s);
              return sr(u) && !mi(u) && l.push(u), l;
            },
            []
          );
          uv(i, s, QN(a, o));
        }),
        i
      );
    });
  }
  var ii =
      typeof globalThis < "u"
        ? globalThis
        : typeof window < "u"
          ? window
          : typeof global < "u"
            ? global
            : typeof self < "u"
              ? self
              : {},
    eP = Object.prototype;
  function tP(e) {
    var t = e && e.constructor,
      r = (typeof t == "function" && t.prototype) || eP;
    return e === r;
  }
  var gu = tP;
  function rP(e, t) {
    return function (r) {
      return e(t(r));
    };
  }
  var fv = rP,
    nP = fv,
    oP = nP(Object.keys, Object),
    iP = oP,
    sP = gu,
    aP = iP,
    lP = Object.prototype,
    cP = lP.hasOwnProperty;
  function uP(e) {
    if (!sP(e)) return aP(e);
    var t = [];
    for (var r in Object(e)) cP.call(e, r) && r != "constructor" && t.push(r);
    return t;
  }
  var dv = uP,
    fP = typeof ii == "object" && ii && ii.Object === Object && ii,
    pv = fP,
    dP = pv,
    pP = typeof self == "object" && self && self.Object === Object && self,
    hP = dP || pP || Function("return this")(),
    jt = hP,
    gP = jt,
    mP = gP.Symbol,
    Do = mP,
    ip = Do,
    hv = Object.prototype,
    vP = hv.hasOwnProperty,
    yP = hv.toString,
    Qo = ip ? ip.toStringTag : void 0;
  function _P(e) {
    var t = vP.call(e, Qo),
      r = e[Qo];
    try {
      e[Qo] = void 0;
      var n = !0;
    } catch {}
    var o = yP.call(e);
    return n && (t ? (e[Qo] = r) : delete e[Qo]), o;
  }
  var $P = _P,
    bP = Object.prototype,
    wP = bP.toString;
  function EP(e) {
    return wP.call(e);
  }
  var OP = EP,
    sp = Do,
    AP = $P,
    SP = OP,
    NP = "[object Null]",
    PP = "[object Undefined]",
    ap = sp ? sp.toStringTag : void 0;
  function CP(e) {
    return e == null
      ? e === void 0
        ? PP
        : NP
      : ap && ap in Object(e)
        ? AP(e)
        : SP(e);
  }
  var ro = CP;
  function TP(e) {
    var t = typeof e;
    return e != null && (t == "object" || t == "function");
  }
  var Zt = TP,
    xP = ro,
    DP = Zt,
    IP = "[object AsyncFunction]",
    RP = "[object Function]",
    MP = "[object GeneratorFunction]",
    jP = "[object Proxy]";
  function FP(e) {
    if (!DP(e)) return !1;
    var t = xP(e);
    return t == RP || t == MP || t == IP || t == jP;
  }
  var Ia = FP,
    LP = jt,
    VP = LP["__core-js_shared__"],
    kP = VP,
    pl = kP,
    lp = (function () {
      var e = /[^.]+$/.exec((pl && pl.keys && pl.keys.IE_PROTO) || "");
      return e ? "Symbol(src)_1." + e : "";
    })();
  function BP(e) {
    return !!lp && lp in e;
  }
  var zP = BP,
    UP = Function.prototype,
    WP = UP.toString;
  function HP(e) {
    if (e != null) {
      try {
        return WP.call(e);
      } catch {}
      try {
        return e + "";
      } catch {}
    }
    return "";
  }
  var gv = HP,
    KP = Ia,
    GP = zP,
    qP = Zt,
    YP = gv,
    JP = /[\\^$.*+?()[\]{}|]/g,
    XP = /^\[object .+?Constructor\]$/,
    ZP = Function.prototype,
    QP = Object.prototype,
    eC = ZP.toString,
    tC = QP.hasOwnProperty,
    rC = RegExp(
      "^" +
        eC
          .call(tC)
          .replace(JP, "\\$&")
          .replace(
            /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
            "$1.*?"
          ) +
        "$"
    );
  function nC(e) {
    if (!qP(e) || GP(e)) return !1;
    var t = KP(e) ? rC : XP;
    return t.test(YP(e));
  }
  var oC = nC;
  function iC(e, t) {
    return e == null ? void 0 : e[t];
  }
  var sC = iC,
    aC = oC,
    lC = sC;
  function cC(e, t) {
    var r = lC(e, t);
    return aC(r) ? r : void 0;
  }
  var no = cC,
    uC = no,
    fC = jt,
    dC = uC(fC, "DataView"),
    pC = dC,
    hC = no,
    gC = jt,
    mC = hC(gC, "Map"),
    mu = mC,
    vC = no,
    yC = jt,
    _C = vC(yC, "Promise"),
    $C = _C,
    bC = no,
    wC = jt,
    EC = bC(wC, "Set"),
    OC = EC,
    AC = no,
    SC = jt,
    NC = AC(SC, "WeakMap"),
    mv = NC,
    ic = pC,
    sc = mu,
    ac = $C,
    lc = OC,
    cc = mv,
    vv = ro,
    Io = gv,
    cp = "[object Map]",
    PC = "[object Object]",
    up = "[object Promise]",
    fp = "[object Set]",
    dp = "[object WeakMap]",
    pp = "[object DataView]",
    CC = Io(ic),
    TC = Io(sc),
    xC = Io(ac),
    DC = Io(lc),
    IC = Io(cc),
    An = vv;
  ((ic && An(new ic(new ArrayBuffer(1))) != pp) ||
    (sc && An(new sc()) != cp) ||
    (ac && An(ac.resolve()) != up) ||
    (lc && An(new lc()) != fp) ||
    (cc && An(new cc()) != dp)) &&
    (An = function (e) {
      var t = vv(e),
        r = t == PC ? e.constructor : void 0,
        n = r ? Io(r) : "";
      if (n)
        switch (n) {
          case CC:
            return pp;
          case TC:
            return cp;
          case xC:
            return up;
          case DC:
            return fp;
          case IC:
            return dp;
        }
      return t;
    });
  var Ui = An;
  function RC(e) {
    return e != null && typeof e == "object";
  }
  var Qt = RC,
    MC = ro,
    jC = Qt,
    FC = "[object Arguments]";
  function LC(e) {
    return jC(e) && MC(e) == FC;
  }
  var VC = LC,
    hp = VC,
    kC = Qt,
    yv = Object.prototype,
    BC = yv.hasOwnProperty,
    zC = yv.propertyIsEnumerable,
    UC = hp(
      (function () {
        return arguments;
      })()
    )
      ? hp
      : function (e) {
          return kC(e) && BC.call(e, "callee") && !zC.call(e, "callee");
        },
    Ra = UC,
    WC = Array.isArray,
    Ft = WC,
    HC = 9007199254740991;
  function KC(e) {
    return typeof e == "number" && e > -1 && e % 1 == 0 && e <= HC;
  }
  var vu = KC,
    GC = Ia,
    qC = vu;
  function YC(e) {
    return e != null && qC(e.length) && !GC(e);
  }
  var Ma = YC,
    Zs = { exports: {} };
  function JC() {
    return !1;
  }
  var XC = JC;
  Zs.exports;
  (function (e, t) {
    var r = jt,
      n = XC,
      o = t && !t.nodeType && t,
      i = o && !0 && e && !e.nodeType && e,
      s = i && i.exports === o,
      a = s ? r.Buffer : void 0,
      l = a ? a.isBuffer : void 0,
      c = l || n;
    e.exports = c;
  })(Zs, Zs.exports);
  var ja = Zs.exports,
    ZC = ro,
    QC = vu,
    eT = Qt,
    tT = "[object Arguments]",
    rT = "[object Array]",
    nT = "[object Boolean]",
    oT = "[object Date]",
    iT = "[object Error]",
    sT = "[object Function]",
    aT = "[object Map]",
    lT = "[object Number]",
    cT = "[object Object]",
    uT = "[object RegExp]",
    fT = "[object Set]",
    dT = "[object String]",
    pT = "[object WeakMap]",
    hT = "[object ArrayBuffer]",
    gT = "[object DataView]",
    mT = "[object Float32Array]",
    vT = "[object Float64Array]",
    yT = "[object Int8Array]",
    _T = "[object Int16Array]",
    $T = "[object Int32Array]",
    bT = "[object Uint8Array]",
    wT = "[object Uint8ClampedArray]",
    ET = "[object Uint16Array]",
    OT = "[object Uint32Array]",
    Ze = {};
  Ze[mT] =
    Ze[vT] =
    Ze[yT] =
    Ze[_T] =
    Ze[$T] =
    Ze[bT] =
    Ze[wT] =
    Ze[ET] =
    Ze[OT] =
      !0;
  Ze[tT] =
    Ze[rT] =
    Ze[hT] =
    Ze[nT] =
    Ze[gT] =
    Ze[oT] =
    Ze[iT] =
    Ze[sT] =
    Ze[aT] =
    Ze[lT] =
    Ze[cT] =
    Ze[uT] =
    Ze[fT] =
    Ze[dT] =
    Ze[pT] =
      !1;
  function AT(e) {
    return eT(e) && QC(e.length) && !!Ze[ZC(e)];
  }
  var ST = AT;
  function NT(e) {
    return function (t) {
      return e(t);
    };
  }
  var yu = NT,
    Qs = { exports: {} };
  Qs.exports;
  (function (e, t) {
    var r = pv,
      n = t && !t.nodeType && t,
      o = n && !0 && e && !e.nodeType && e,
      i = o && o.exports === n,
      s = i && r.process,
      a = (function () {
        try {
          var l = o && o.require && o.require("util").types;
          return l || (s && s.binding && s.binding("util"));
        } catch {}
      })();
    e.exports = a;
  })(Qs, Qs.exports);
  var _u = Qs.exports,
    PT = ST,
    CT = yu,
    gp = _u,
    mp = gp && gp.isTypedArray,
    TT = mp ? CT(mp) : PT,
    $u = TT;
  function xT(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length, o = Array(n); ++r < n; )
      o[r] = t(e[r], r, e);
    return o;
  }
  var _v = xT,
    DT = ro,
    IT = Qt,
    RT = "[object Symbol]";
  function MT(e) {
    return typeof e == "symbol" || (IT(e) && DT(e) == RT);
  }
  var Wi = MT,
    vp = Do,
    jT = _v,
    FT = Ft,
    LT = Wi,
    VT = 1 / 0,
    yp = vp ? vp.prototype : void 0,
    _p = yp ? yp.toString : void 0;
  function $v(e) {
    if (typeof e == "string") return e;
    if (FT(e)) return jT(e, $v) + "";
    if (LT(e)) return _p ? _p.call(e) : "";
    var t = e + "";
    return t == "0" && 1 / e == -VT ? "-0" : t;
  }
  var kT = $v,
    BT = kT;
  function zT(e) {
    return e == null ? "" : BT(e);
  }
  var bv = zT;
  function UT(e, t, r) {
    var n = -1,
      o = e.length;
    t < 0 && (t = -t > o ? 0 : o + t),
      (r = r > o ? o : r),
      r < 0 && (r += o),
      (o = t > r ? 0 : (r - t) >>> 0),
      (t >>>= 0);
    for (var i = Array(o); ++n < o; ) i[n] = e[n + t];
    return i;
  }
  var WT = UT;
  function HT(e, t) {
    for (var r = -1, n = Array(e); ++r < e; ) n[r] = t(r);
    return n;
  }
  var KT = HT,
    GT = 9007199254740991,
    qT = /^(?:0|[1-9]\d*)$/;
  function YT(e, t) {
    var r = typeof e;
    return (
      (t = t ?? GT),
      !!t &&
        (r == "number" || (r != "symbol" && qT.test(e))) &&
        e > -1 &&
        e % 1 == 0 &&
        e < t
    );
  }
  var Hi = YT,
    JT = KT,
    XT = Ra,
    ZT = Ft,
    QT = ja,
    ex = Hi,
    tx = $u,
    rx = Object.prototype,
    nx = rx.hasOwnProperty;
  function ox(e, t) {
    var r = ZT(e),
      n = !r && XT(e),
      o = !r && !n && QT(e),
      i = !r && !n && !o && tx(e),
      s = r || n || o || i,
      a = s ? JT(e.length, String) : [],
      l = a.length;
    for (var c in e)
      (t || nx.call(e, c)) &&
        !(
          s && // Safari 9 has enumerable `arguments.length` in strict mode.
          (c == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            (o && (c == "offset" || c == "parent")) || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            (i && (c == "buffer" || c == "byteLength" || c == "byteOffset")) || // Skip index properties.
            ex(c, l))
        ) &&
        a.push(c);
    return a;
  }
  var wv = ox,
    ix = wv,
    sx = dv,
    ax = Ma;
  function lx(e) {
    return ax(e) ? ix(e) : sx(e);
  }
  var Fa = lx;
  function cx() {
    (this.__data__ = []), (this.size = 0);
  }
  var ux = cx;
  function fx(e, t) {
    return e === t || (e !== e && t !== t);
  }
  var Ki = fx,
    dx = Ki;
  function px(e, t) {
    for (var r = e.length; r--; ) if (dx(e[r][0], t)) return r;
    return -1;
  }
  var La = px,
    hx = La,
    gx = Array.prototype,
    mx = gx.splice;
  function vx(e) {
    var t = this.__data__,
      r = hx(t, e);
    if (r < 0) return !1;
    var n = t.length - 1;
    return r == n ? t.pop() : mx.call(t, r, 1), --this.size, !0;
  }
  var yx = vx,
    _x = La;
  function $x(e) {
    var t = this.__data__,
      r = _x(t, e);
    return r < 0 ? void 0 : t[r][1];
  }
  var bx = $x,
    wx = La;
  function Ex(e) {
    return wx(this.__data__, e) > -1;
  }
  var Ox = Ex,
    Ax = La;
  function Sx(e, t) {
    var r = this.__data__,
      n = Ax(r, e);
    return n < 0 ? (++this.size, r.push([e, t])) : (r[n][1] = t), this;
  }
  var Nx = Sx,
    Px = ux,
    Cx = yx,
    Tx = bx,
    xx = Ox,
    Dx = Nx;
  function Ro(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  Ro.prototype.clear = Px;
  Ro.prototype.delete = Cx;
  Ro.prototype.get = Tx;
  Ro.prototype.has = xx;
  Ro.prototype.set = Dx;
  var Va = Ro,
    Ix = Va;
  function Rx() {
    (this.__data__ = new Ix()), (this.size = 0);
  }
  var Mx = Rx;
  function jx(e) {
    var t = this.__data__,
      r = t.delete(e);
    return (this.size = t.size), r;
  }
  var Fx = jx;
  function Lx(e) {
    return this.__data__.get(e);
  }
  var Vx = Lx;
  function kx(e) {
    return this.__data__.has(e);
  }
  var Bx = kx,
    zx = no,
    Ux = zx(Object, "create"),
    ka = Ux,
    $p = ka;
  function Wx() {
    (this.__data__ = $p ? $p(null) : {}), (this.size = 0);
  }
  var Hx = Wx;
  function Kx(e) {
    var t = this.has(e) && delete this.__data__[e];
    return (this.size -= t ? 1 : 0), t;
  }
  var Gx = Kx,
    qx = ka,
    Yx = "__lodash_hash_undefined__",
    Jx = Object.prototype,
    Xx = Jx.hasOwnProperty;
  function Zx(e) {
    var t = this.__data__;
    if (qx) {
      var r = t[e];
      return r === Yx ? void 0 : r;
    }
    return Xx.call(t, e) ? t[e] : void 0;
  }
  var Qx = Zx,
    eD = ka,
    tD = Object.prototype,
    rD = tD.hasOwnProperty;
  function nD(e) {
    var t = this.__data__;
    return eD ? t[e] !== void 0 : rD.call(t, e);
  }
  var oD = nD,
    iD = ka,
    sD = "__lodash_hash_undefined__";
  function aD(e, t) {
    var r = this.__data__;
    return (
      (this.size += this.has(e) ? 0 : 1),
      (r[e] = iD && t === void 0 ? sD : t),
      this
    );
  }
  var lD = aD,
    cD = Hx,
    uD = Gx,
    fD = Qx,
    dD = oD,
    pD = lD;
  function Mo(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  Mo.prototype.clear = cD;
  Mo.prototype.delete = uD;
  Mo.prototype.get = fD;
  Mo.prototype.has = dD;
  Mo.prototype.set = pD;
  var hD = Mo,
    bp = hD,
    gD = Va,
    mD = mu;
  function vD() {
    (this.size = 0),
      (this.__data__ = {
        hash: new bp(),
        map: new (mD || gD)(),
        string: new bp(),
      });
  }
  var yD = vD;
  function _D(e) {
    var t = typeof e;
    return t == "string" || t == "number" || t == "symbol" || t == "boolean"
      ? e !== "__proto__"
      : e === null;
  }
  var $D = _D,
    bD = $D;
  function wD(e, t) {
    var r = e.__data__;
    return bD(t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
  }
  var Ba = wD,
    ED = Ba;
  function OD(e) {
    var t = ED(this, e).delete(e);
    return (this.size -= t ? 1 : 0), t;
  }
  var AD = OD,
    SD = Ba;
  function ND(e) {
    return SD(this, e).get(e);
  }
  var PD = ND,
    CD = Ba;
  function TD(e) {
    return CD(this, e).has(e);
  }
  var xD = TD,
    DD = Ba;
  function ID(e, t) {
    var r = DD(this, e),
      n = r.size;
    return r.set(e, t), (this.size += r.size == n ? 0 : 1), this;
  }
  var RD = ID,
    MD = yD,
    jD = AD,
    FD = PD,
    LD = xD,
    VD = RD;
  function jo(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  jo.prototype.clear = MD;
  jo.prototype.delete = jD;
  jo.prototype.get = FD;
  jo.prototype.has = LD;
  jo.prototype.set = VD;
  var bu = jo,
    kD = Va,
    BD = mu,
    zD = bu,
    UD = 200;
  function WD(e, t) {
    var r = this.__data__;
    if (r instanceof kD) {
      var n = r.__data__;
      if (!BD || n.length < UD - 1)
        return n.push([e, t]), (this.size = ++r.size), this;
      r = this.__data__ = new zD(n);
    }
    return r.set(e, t), (this.size = r.size), this;
  }
  var HD = WD,
    KD = Va,
    GD = Mx,
    qD = Fx,
    YD = Vx,
    JD = Bx,
    XD = HD;
  function Fo(e) {
    var t = (this.__data__ = new KD(e));
    this.size = t.size;
  }
  Fo.prototype.clear = GD;
  Fo.prototype.delete = qD;
  Fo.prototype.get = YD;
  Fo.prototype.has = JD;
  Fo.prototype.set = XD;
  var za = Fo,
    ZD = no,
    QD = (function () {
      try {
        var e = ZD(Object, "defineProperty");
        return e({}, "", {}), e;
      } catch {}
    })(),
    Ev = QD,
    wp = Ev;
  function eI(e, t, r) {
    t == "__proto__" && wp
      ? wp(e, t, {
          configurable: !0,
          enumerable: !0,
          value: r,
          writable: !0,
        })
      : (e[t] = r);
  }
  var wu = eI,
    tI = wu,
    rI = Ki;
  function nI(e, t, r) {
    ((r !== void 0 && !rI(e[t], r)) || (r === void 0 && !(t in e))) &&
      tI(e, t, r);
  }
  var Ov = nI;
  function oI(e) {
    return function (t, r, n) {
      for (var o = -1, i = Object(t), s = n(t), a = s.length; a--; ) {
        var l = s[e ? a : ++o];
        if (r(i[l], l, i) === !1) break;
      }
      return t;
    };
  }
  var iI = oI,
    sI = iI,
    aI = sI(),
    lI = aI,
    ea = { exports: {} };
  ea.exports;
  (function (e, t) {
    var r = jt,
      n = t && !t.nodeType && t,
      o = n && !0 && e && !e.nodeType && e,
      i = o && o.exports === n,
      s = i ? r.Buffer : void 0,
      a = s ? s.allocUnsafe : void 0;
    function l(c, u) {
      if (u) return c.slice();
      var f = c.length,
        d = a ? a(f) : new c.constructor(f);
      return c.copy(d), d;
    }
    e.exports = l;
  })(ea, ea.exports);
  var Av = ea.exports,
    cI = jt,
    uI = cI.Uint8Array,
    Sv = uI,
    Ep = Sv;
  function fI(e) {
    var t = new e.constructor(e.byteLength);
    return new Ep(t).set(new Ep(e)), t;
  }
  var Eu = fI,
    dI = Eu;
  function pI(e, t) {
    var r = t ? dI(e.buffer) : e.buffer;
    return new e.constructor(r, e.byteOffset, e.length);
  }
  var Nv = pI;
  function hI(e, t) {
    var r = -1,
      n = e.length;
    for (t || (t = Array(n)); ++r < n; ) t[r] = e[r];
    return t;
  }
  var Gi = hI,
    gI = Zt,
    Op = Object.create,
    mI = (function () {
      function e() {}
      return function (t) {
        if (!gI(t)) return {};
        if (Op) return Op(t);
        e.prototype = t;
        var r = new e();
        return (e.prototype = void 0), r;
      };
    })(),
    Ua = mI,
    vI = fv,
    yI = vI(Object.getPrototypeOf, Object),
    Ou = yI,
    _I = Ua,
    $I = Ou,
    bI = gu;
  function wI(e) {
    return typeof e.constructor == "function" && !bI(e) ? _I($I(e)) : {};
  }
  var Pv = wI,
    EI = Ma,
    OI = Qt;
  function AI(e) {
    return OI(e) && EI(e);
  }
  var SI = AI,
    NI = ro,
    PI = Ou,
    CI = Qt,
    TI = "[object Object]",
    xI = Function.prototype,
    DI = Object.prototype,
    Cv = xI.toString,
    II = DI.hasOwnProperty,
    RI = Cv.call(Object);
  function MI(e) {
    if (!CI(e) || NI(e) != TI) return !1;
    var t = PI(e);
    if (t === null) return !0;
    var r = II.call(t, "constructor") && t.constructor;
    return typeof r == "function" && r instanceof r && Cv.call(r) == RI;
  }
  var Tv = MI;
  function jI(e, t) {
    if (!(t === "constructor" && typeof e[t] == "function") && t != "__proto__")
      return e[t];
  }
  var xv = jI,
    FI = wu,
    LI = Ki,
    VI = Object.prototype,
    kI = VI.hasOwnProperty;
  function BI(e, t, r) {
    var n = e[t];
    (!(kI.call(e, t) && LI(n, r)) || (r === void 0 && !(t in e))) &&
      FI(e, t, r);
  }
  var Au = BI,
    zI = Au,
    UI = wu;
  function WI(e, t, r, n) {
    var o = !r;
    r || (r = {});
    for (var i = -1, s = t.length; ++i < s; ) {
      var a = t[i],
        l = n ? n(r[a], e[a], a, r, e) : void 0;
      l === void 0 && (l = e[a]), o ? UI(r, a, l) : zI(r, a, l);
    }
    return r;
  }
  var qi = WI;
  function HI(e) {
    var t = [];
    if (e != null) for (var r in Object(e)) t.push(r);
    return t;
  }
  var KI = HI,
    GI = Zt,
    qI = gu,
    YI = KI,
    JI = Object.prototype,
    XI = JI.hasOwnProperty;
  function ZI(e) {
    if (!GI(e)) return YI(e);
    var t = qI(e),
      r = [];
    for (var n in e) (n == "constructor" && (t || !XI.call(e, n))) || r.push(n);
    return r;
  }
  var QI = ZI,
    eR = wv,
    tR = QI,
    rR = Ma;
  function nR(e) {
    return rR(e) ? eR(e, !0) : tR(e);
  }
  var Yi = nR,
    oR = qi,
    iR = Yi;
  function sR(e) {
    return oR(e, iR(e));
  }
  var aR = sR,
    Ap = Ov,
    lR = Av,
    cR = Nv,
    uR = Gi,
    fR = Pv,
    Sp = Ra,
    Np = Ft,
    dR = SI,
    pR = ja,
    hR = Ia,
    gR = Zt,
    mR = Tv,
    vR = $u,
    Pp = xv,
    yR = aR;
  function _R(e, t, r, n, o, i, s) {
    var a = Pp(e, r),
      l = Pp(t, r),
      c = s.get(l);
    if (c) {
      Ap(e, r, c);
      return;
    }
    var u = i ? i(a, l, r + "", e, t, s) : void 0,
      f = u === void 0;
    if (f) {
      var d = Np(l),
        p = !d && pR(l),
        h = !d && !p && vR(l);
      (u = l),
        d || p || h
          ? Np(a)
            ? (u = a)
            : dR(a)
              ? (u = uR(a))
              : p
                ? ((f = !1), (u = lR(l, !0)))
                : h
                  ? ((f = !1), (u = cR(l, !0)))
                  : (u = [])
          : mR(l) || Sp(l)
            ? ((u = a), Sp(a) ? (u = yR(a)) : (!gR(a) || hR(a)) && (u = fR(l)))
            : (f = !1);
    }
    f && (s.set(l, u), o(u, l, n, i, s), s.delete(l)), Ap(e, r, u);
  }
  var $R = _R,
    bR = za,
    wR = Ov,
    ER = lI,
    OR = $R,
    AR = Zt,
    SR = Yi,
    NR = xv;
  function Dv(e, t, r, n, o) {
    e !== t &&
      ER(
        t,
        function (i, s) {
          if ((o || (o = new bR()), AR(i))) OR(e, t, s, r, Dv, n, o);
          else {
            var a = n ? n(NR(e, s), i, s + "", e, t, o) : void 0;
            a === void 0 && (a = i), wR(e, s, a);
          }
        },
        SR
      );
  }
  var PR = Dv;
  function CR(e) {
    return e;
  }
  var Wa = CR;
  function TR(e, t, r) {
    switch (r.length) {
      case 0:
        return e.call(t);
      case 1:
        return e.call(t, r[0]);
      case 2:
        return e.call(t, r[0], r[1]);
      case 3:
        return e.call(t, r[0], r[1], r[2]);
    }
    return e.apply(t, r);
  }
  var Su = TR,
    xR = Su,
    Cp = Math.max;
  function DR(e, t, r) {
    return (
      (t = Cp(t === void 0 ? e.length - 1 : t, 0)),
      function () {
        for (
          var n = arguments, o = -1, i = Cp(n.length - t, 0), s = Array(i);
          ++o < i;

        )
          s[o] = n[t + o];
        o = -1;
        for (var a = Array(t + 1); ++o < t; ) a[o] = n[o];
        return (a[t] = r(s)), xR(e, this, a);
      }
    );
  }
  var Iv = DR;
  function IR(e) {
    return function () {
      return e;
    };
  }
  var RR = IR,
    MR = RR,
    Tp = Ev,
    jR = Wa,
    FR = Tp
      ? function (e, t) {
          return Tp(e, "toString", {
            configurable: !0,
            enumerable: !1,
            value: MR(t),
            writable: !0,
          });
        }
      : jR,
    LR = FR,
    VR = 800,
    kR = 16,
    BR = Date.now;
  function zR(e) {
    var t = 0,
      r = 0;
    return function () {
      var n = BR(),
        o = kR - (n - r);
      if (((r = n), o > 0)) {
        if (++t >= VR) return arguments[0];
      } else t = 0;
      return e.apply(void 0, arguments);
    };
  }
  var Rv = zR,
    UR = LR,
    WR = Rv,
    HR = WR(UR),
    Nu = HR,
    KR = Wa,
    GR = Iv,
    qR = Nu;
  function YR(e, t) {
    return qR(GR(e, t, KR), e + "");
  }
  var JR = YR,
    XR = Ki,
    ZR = Ma,
    QR = Hi,
    eM = Zt;
  function tM(e, t, r) {
    if (!eM(r)) return !1;
    var n = typeof t;
    return (n == "number" ? ZR(r) && QR(t, r.length) : n == "string" && t in r)
      ? XR(r[t], e)
      : !1;
  }
  var rM = tM,
    nM = JR,
    oM = rM;
  function iM(e) {
    return nM(function (t, r) {
      var n = -1,
        o = r.length,
        i = o > 1 ? r[o - 1] : void 0,
        s = o > 2 ? r[2] : void 0;
      for (
        i = e.length > 3 && typeof i == "function" ? (o--, i) : void 0,
          s && oM(r[0], r[1], s) && ((i = o < 3 ? void 0 : i), (o = 1)),
          t = Object(t);
        ++n < o;

      ) {
        var a = r[n];
        a && e(t, a, n, i);
      }
      return t;
    });
  }
  var sM = iM,
    aM = PR,
    lM = sM;
  lM(function (e, t, r) {
    aM(e, t, r);
  });
  function cM(e, t) {
    for (
      var r = -1, n = e == null ? 0 : e.length;
      ++r < n && t(e[r], r, e) !== !1;

    );
    return e;
  }
  var Pu = cM,
    uM = qi,
    fM = Fa;
  function dM(e, t) {
    return e && uM(t, fM(t), e);
  }
  var Mv = dM,
    pM = qi,
    hM = Yi;
  function gM(e, t) {
    return e && pM(t, hM(t), e);
  }
  var mM = gM;
  function vM(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length, o = 0, i = []; ++r < n; ) {
      var s = e[r];
      t(s, r, e) && (i[o++] = s);
    }
    return i;
  }
  var yM = vM;
  function _M() {
    return [];
  }
  var jv = _M,
    $M = yM,
    bM = jv,
    wM = Object.prototype,
    EM = wM.propertyIsEnumerable,
    xp = Object.getOwnPropertySymbols,
    OM = xp
      ? function (e) {
          return e == null
            ? []
            : ((e = Object(e)),
              $M(xp(e), function (t) {
                return EM.call(e, t);
              }));
        }
      : bM,
    Cu = OM,
    AM = qi,
    SM = Cu;
  function NM(e, t) {
    return AM(e, SM(e), t);
  }
  var PM = NM;
  function CM(e, t) {
    for (var r = -1, n = t.length, o = e.length; ++r < n; ) e[o + r] = t[r];
    return e;
  }
  var Tu = CM,
    TM = Tu,
    xM = Ou,
    DM = Cu,
    IM = jv,
    RM = Object.getOwnPropertySymbols,
    MM = RM
      ? function (e) {
          for (var t = []; e; ) TM(t, DM(e)), (e = xM(e));
          return t;
        }
      : IM,
    Fv = MM,
    jM = qi,
    FM = Fv;
  function LM(e, t) {
    return jM(e, FM(e), t);
  }
  var VM = LM,
    kM = Tu,
    BM = Ft;
  function zM(e, t, r) {
    var n = t(e);
    return BM(e) ? n : kM(n, r(e));
  }
  var Lv = zM,
    UM = Lv,
    WM = Cu,
    HM = Fa;
  function KM(e) {
    return UM(e, HM, WM);
  }
  var Vv = KM,
    GM = Lv,
    qM = Fv,
    YM = Yi;
  function JM(e) {
    return GM(e, YM, qM);
  }
  var XM = JM,
    ZM = Object.prototype,
    QM = ZM.hasOwnProperty;
  function ej(e) {
    var t = e.length,
      r = new e.constructor(t);
    return (
      t &&
        typeof e[0] == "string" &&
        QM.call(e, "index") &&
        ((r.index = e.index), (r.input = e.input)),
      r
    );
  }
  var tj = ej,
    rj = Eu;
  function nj(e, t) {
    var r = t ? rj(e.buffer) : e.buffer;
    return new e.constructor(r, e.byteOffset, e.byteLength);
  }
  var oj = nj,
    ij = /\w*$/;
  function sj(e) {
    var t = new e.constructor(e.source, ij.exec(e));
    return (t.lastIndex = e.lastIndex), t;
  }
  var aj = sj,
    Dp = Do,
    Ip = Dp ? Dp.prototype : void 0,
    Rp = Ip ? Ip.valueOf : void 0;
  function lj(e) {
    return Rp ? Object(Rp.call(e)) : {};
  }
  var cj = lj,
    uj = Eu,
    fj = oj,
    dj = aj,
    pj = cj,
    hj = Nv,
    gj = "[object Boolean]",
    mj = "[object Date]",
    vj = "[object Map]",
    yj = "[object Number]",
    _j = "[object RegExp]",
    $j = "[object Set]",
    bj = "[object String]",
    wj = "[object Symbol]",
    Ej = "[object ArrayBuffer]",
    Oj = "[object DataView]",
    Aj = "[object Float32Array]",
    Sj = "[object Float64Array]",
    Nj = "[object Int8Array]",
    Pj = "[object Int16Array]",
    Cj = "[object Int32Array]",
    Tj = "[object Uint8Array]",
    xj = "[object Uint8ClampedArray]",
    Dj = "[object Uint16Array]",
    Ij = "[object Uint32Array]";
  function Rj(e, t, r) {
    var n = e.constructor;
    switch (t) {
      case Ej:
        return uj(e);
      case gj:
      case mj:
        return new n(+e);
      case Oj:
        return fj(e, r);
      case Aj:
      case Sj:
      case Nj:
      case Pj:
      case Cj:
      case Tj:
      case xj:
      case Dj:
      case Ij:
        return hj(e, r);
      case vj:
        return new n();
      case yj:
      case bj:
        return new n(e);
      case _j:
        return dj(e);
      case $j:
        return new n();
      case wj:
        return pj(e);
    }
  }
  var Mj = Rj,
    jj = Ui,
    Fj = Qt,
    Lj = "[object Map]";
  function Vj(e) {
    return Fj(e) && jj(e) == Lj;
  }
  var kj = Vj,
    Bj = kj,
    zj = yu,
    Mp = _u,
    jp = Mp && Mp.isMap,
    Uj = jp ? zj(jp) : Bj,
    Wj = Uj,
    Hj = Ui,
    Kj = Qt,
    Gj = "[object Set]";
  function qj(e) {
    return Kj(e) && Hj(e) == Gj;
  }
  var Yj = qj,
    Jj = Yj,
    Xj = yu,
    Fp = _u,
    Lp = Fp && Fp.isSet,
    Zj = Lp ? Xj(Lp) : Jj,
    Qj = Zj,
    e2 = za,
    t2 = Pu,
    r2 = Au,
    n2 = Mv,
    o2 = mM,
    i2 = Av,
    s2 = Gi,
    a2 = PM,
    l2 = VM,
    c2 = Vv,
    u2 = XM,
    f2 = Ui,
    d2 = tj,
    p2 = Mj,
    h2 = Pv,
    g2 = Ft,
    m2 = ja,
    v2 = Wj,
    y2 = Zt,
    _2 = Qj,
    $2 = Fa,
    b2 = Yi,
    w2 = 1,
    E2 = 2,
    O2 = 4,
    kv = "[object Arguments]",
    A2 = "[object Array]",
    S2 = "[object Boolean]",
    N2 = "[object Date]",
    P2 = "[object Error]",
    Bv = "[object Function]",
    C2 = "[object GeneratorFunction]",
    T2 = "[object Map]",
    x2 = "[object Number]",
    zv = "[object Object]",
    D2 = "[object RegExp]",
    I2 = "[object Set]",
    R2 = "[object String]",
    M2 = "[object Symbol]",
    j2 = "[object WeakMap]",
    F2 = "[object ArrayBuffer]",
    L2 = "[object DataView]",
    V2 = "[object Float32Array]",
    k2 = "[object Float64Array]",
    B2 = "[object Int8Array]",
    z2 = "[object Int16Array]",
    U2 = "[object Int32Array]",
    W2 = "[object Uint8Array]",
    H2 = "[object Uint8ClampedArray]",
    K2 = "[object Uint16Array]",
    G2 = "[object Uint32Array]",
    Ge = {};
  Ge[kv] =
    Ge[A2] =
    Ge[F2] =
    Ge[L2] =
    Ge[S2] =
    Ge[N2] =
    Ge[V2] =
    Ge[k2] =
    Ge[B2] =
    Ge[z2] =
    Ge[U2] =
    Ge[T2] =
    Ge[x2] =
    Ge[zv] =
    Ge[D2] =
    Ge[I2] =
    Ge[R2] =
    Ge[M2] =
    Ge[W2] =
    Ge[H2] =
    Ge[K2] =
    Ge[G2] =
      !0;
  Ge[P2] = Ge[Bv] = Ge[j2] = !1;
  function Cs(e, t, r, n, o, i) {
    var s,
      a = t & w2,
      l = t & E2,
      c = t & O2;
    if ((r && (s = o ? r(e, n, o, i) : r(e)), s !== void 0)) return s;
    if (!y2(e)) return e;
    var u = g2(e);
    if (u) {
      if (((s = d2(e)), !a)) return s2(e, s);
    } else {
      var f = f2(e),
        d = f == Bv || f == C2;
      if (m2(e)) return i2(e, a);
      if (f == zv || f == kv || (d && !o)) {
        if (((s = l || d ? {} : h2(e)), !a))
          return l ? l2(e, o2(s, e)) : a2(e, n2(s, e));
      } else {
        if (!Ge[f]) return o ? e : {};
        s = p2(e, f, a);
      }
    }
    i || (i = new e2());
    var p = i.get(e);
    if (p) return p;
    i.set(e, s),
      _2(e)
        ? e.forEach(function (v) {
            s.add(Cs(v, t, r, v, e, i));
          })
        : v2(e) &&
          e.forEach(function (v, g) {
            s.set(g, Cs(v, t, r, g, e, i));
          });
    var h = c ? (l ? u2 : c2) : l ? b2 : $2,
      m = u ? void 0 : h(e);
    return (
      t2(m || e, function (v, g) {
        m && ((g = v), (v = e[g])), r2(s, g, Cs(v, t, r, g, e, i));
      }),
      s
    );
  }
  var Uv = Cs,
    Wv = {};
  (function (e) {
    (e.aliasToReal = {
      // Lodash aliases.
      each: "forEach",
      eachRight: "forEachRight",
      entries: "toPairs",
      entriesIn: "toPairsIn",
      extend: "assignIn",
      extendAll: "assignInAll",
      extendAllWith: "assignInAllWith",
      extendWith: "assignInWith",
      first: "head",
      // Methods that are curried variants of others.
      conforms: "conformsTo",
      matches: "isMatch",
      property: "get",
      // Ramda aliases.
      __: "placeholder",
      F: "stubFalse",
      T: "stubTrue",
      all: "every",
      allPass: "overEvery",
      always: "constant",
      any: "some",
      anyPass: "overSome",
      apply: "spread",
      assoc: "set",
      assocPath: "set",
      complement: "negate",
      compose: "flowRight",
      contains: "includes",
      dissoc: "unset",
      dissocPath: "unset",
      dropLast: "dropRight",
      dropLastWhile: "dropRightWhile",
      equals: "isEqual",
      identical: "eq",
      indexBy: "keyBy",
      init: "initial",
      invertObj: "invert",
      juxt: "over",
      omitAll: "omit",
      nAry: "ary",
      path: "get",
      pathEq: "matchesProperty",
      pathOr: "getOr",
      paths: "at",
      pickAll: "pick",
      pipe: "flow",
      pluck: "map",
      prop: "get",
      propEq: "matchesProperty",
      propOr: "getOr",
      props: "at",
      symmetricDifference: "xor",
      symmetricDifferenceBy: "xorBy",
      symmetricDifferenceWith: "xorWith",
      takeLast: "takeRight",
      takeLastWhile: "takeRightWhile",
      unapply: "rest",
      unnest: "flatten",
      useWith: "overArgs",
      where: "conformsTo",
      whereEq: "isMatch",
      zipObj: "zipObject",
    }),
      (e.aryMethod = {
        1: [
          "assignAll",
          "assignInAll",
          "attempt",
          "castArray",
          "ceil",
          "create",
          "curry",
          "curryRight",
          "defaultsAll",
          "defaultsDeepAll",
          "floor",
          "flow",
          "flowRight",
          "fromPairs",
          "invert",
          "iteratee",
          "memoize",
          "method",
          "mergeAll",
          "methodOf",
          "mixin",
          "nthArg",
          "over",
          "overEvery",
          "overSome",
          "rest",
          "reverse",
          "round",
          "runInContext",
          "spread",
          "template",
          "trim",
          "trimEnd",
          "trimStart",
          "uniqueId",
          "words",
          "zipAll",
        ],
        2: [
          "add",
          "after",
          "ary",
          "assign",
          "assignAllWith",
          "assignIn",
          "assignInAllWith",
          "at",
          "before",
          "bind",
          "bindAll",
          "bindKey",
          "chunk",
          "cloneDeepWith",
          "cloneWith",
          "concat",
          "conformsTo",
          "countBy",
          "curryN",
          "curryRightN",
          "debounce",
          "defaults",
          "defaultsDeep",
          "defaultTo",
          "delay",
          "difference",
          "divide",
          "drop",
          "dropRight",
          "dropRightWhile",
          "dropWhile",
          "endsWith",
          "eq",
          "every",
          "filter",
          "find",
          "findIndex",
          "findKey",
          "findLast",
          "findLastIndex",
          "findLastKey",
          "flatMap",
          "flatMapDeep",
          "flattenDepth",
          "forEach",
          "forEachRight",
          "forIn",
          "forInRight",
          "forOwn",
          "forOwnRight",
          "get",
          "groupBy",
          "gt",
          "gte",
          "has",
          "hasIn",
          "includes",
          "indexOf",
          "intersection",
          "invertBy",
          "invoke",
          "invokeMap",
          "isEqual",
          "isMatch",
          "join",
          "keyBy",
          "lastIndexOf",
          "lt",
          "lte",
          "map",
          "mapKeys",
          "mapValues",
          "matchesProperty",
          "maxBy",
          "meanBy",
          "merge",
          "mergeAllWith",
          "minBy",
          "multiply",
          "nth",
          "omit",
          "omitBy",
          "overArgs",
          "pad",
          "padEnd",
          "padStart",
          "parseInt",
          "partial",
          "partialRight",
          "partition",
          "pick",
          "pickBy",
          "propertyOf",
          "pull",
          "pullAll",
          "pullAt",
          "random",
          "range",
          "rangeRight",
          "rearg",
          "reject",
          "remove",
          "repeat",
          "restFrom",
          "result",
          "sampleSize",
          "some",
          "sortBy",
          "sortedIndex",
          "sortedIndexOf",
          "sortedLastIndex",
          "sortedLastIndexOf",
          "sortedUniqBy",
          "split",
          "spreadFrom",
          "startsWith",
          "subtract",
          "sumBy",
          "take",
          "takeRight",
          "takeRightWhile",
          "takeWhile",
          "tap",
          "throttle",
          "thru",
          "times",
          "trimChars",
          "trimCharsEnd",
          "trimCharsStart",
          "truncate",
          "union",
          "uniqBy",
          "uniqWith",
          "unset",
          "unzipWith",
          "without",
          "wrap",
          "xor",
          "zip",
          "zipObject",
          "zipObjectDeep",
        ],
        3: [
          "assignInWith",
          "assignWith",
          "clamp",
          "differenceBy",
          "differenceWith",
          "findFrom",
          "findIndexFrom",
          "findLastFrom",
          "findLastIndexFrom",
          "getOr",
          "includesFrom",
          "indexOfFrom",
          "inRange",
          "intersectionBy",
          "intersectionWith",
          "invokeArgs",
          "invokeArgsMap",
          "isEqualWith",
          "isMatchWith",
          "flatMapDepth",
          "lastIndexOfFrom",
          "mergeWith",
          "orderBy",
          "padChars",
          "padCharsEnd",
          "padCharsStart",
          "pullAllBy",
          "pullAllWith",
          "rangeStep",
          "rangeStepRight",
          "reduce",
          "reduceRight",
          "replace",
          "set",
          "slice",
          "sortedIndexBy",
          "sortedLastIndexBy",
          "transform",
          "unionBy",
          "unionWith",
          "update",
          "xorBy",
          "xorWith",
          "zipWith",
        ],
        4: ["fill", "setWith", "updateWith"],
      }),
      (e.aryRearg = {
        2: [1, 0],
        3: [2, 0, 1],
        4: [3, 2, 0, 1],
      }),
      (e.iterateeAry = {
        dropRightWhile: 1,
        dropWhile: 1,
        every: 1,
        filter: 1,
        find: 1,
        findFrom: 1,
        findIndex: 1,
        findIndexFrom: 1,
        findKey: 1,
        findLast: 1,
        findLastFrom: 1,
        findLastIndex: 1,
        findLastIndexFrom: 1,
        findLastKey: 1,
        flatMap: 1,
        flatMapDeep: 1,
        flatMapDepth: 1,
        forEach: 1,
        forEachRight: 1,
        forIn: 1,
        forInRight: 1,
        forOwn: 1,
        forOwnRight: 1,
        map: 1,
        mapKeys: 1,
        mapValues: 1,
        partition: 1,
        reduce: 2,
        reduceRight: 2,
        reject: 1,
        remove: 1,
        some: 1,
        takeRightWhile: 1,
        takeWhile: 1,
        times: 1,
        transform: 2,
      }),
      (e.iterateeRearg = {
        mapKeys: [1],
        reduceRight: [1, 0],
      }),
      (e.methodRearg = {
        assignInAllWith: [1, 0],
        assignInWith: [1, 2, 0],
        assignAllWith: [1, 0],
        assignWith: [1, 2, 0],
        differenceBy: [1, 2, 0],
        differenceWith: [1, 2, 0],
        getOr: [2, 1, 0],
        intersectionBy: [1, 2, 0],
        intersectionWith: [1, 2, 0],
        isEqualWith: [1, 2, 0],
        isMatchWith: [2, 1, 0],
        mergeAllWith: [1, 0],
        mergeWith: [1, 2, 0],
        padChars: [2, 1, 0],
        padCharsEnd: [2, 1, 0],
        padCharsStart: [2, 1, 0],
        pullAllBy: [2, 1, 0],
        pullAllWith: [2, 1, 0],
        rangeStep: [1, 2, 0],
        rangeStepRight: [1, 2, 0],
        setWith: [3, 1, 2, 0],
        sortedIndexBy: [2, 1, 0],
        sortedLastIndexBy: [2, 1, 0],
        unionBy: [1, 2, 0],
        unionWith: [1, 2, 0],
        updateWith: [3, 1, 2, 0],
        xorBy: [1, 2, 0],
        xorWith: [1, 2, 0],
        zipWith: [1, 2, 0],
      }),
      (e.methodSpread = {
        assignAll: { start: 0 },
        assignAllWith: { start: 0 },
        assignInAll: { start: 0 },
        assignInAllWith: { start: 0 },
        defaultsAll: { start: 0 },
        defaultsDeepAll: { start: 0 },
        invokeArgs: { start: 2 },
        invokeArgsMap: { start: 2 },
        mergeAll: { start: 0 },
        mergeAllWith: { start: 0 },
        partial: { start: 1 },
        partialRight: { start: 1 },
        without: { start: 1 },
        zipAll: { start: 0 },
      }),
      (e.mutate = {
        array: {
          fill: !0,
          pull: !0,
          pullAll: !0,
          pullAllBy: !0,
          pullAllWith: !0,
          pullAt: !0,
          remove: !0,
          reverse: !0,
        },
        object: {
          assign: !0,
          assignAll: !0,
          assignAllWith: !0,
          assignIn: !0,
          assignInAll: !0,
          assignInAllWith: !0,
          assignInWith: !0,
          assignWith: !0,
          defaults: !0,
          defaultsAll: !0,
          defaultsDeep: !0,
          defaultsDeepAll: !0,
          merge: !0,
          mergeAll: !0,
          mergeAllWith: !0,
          mergeWith: !0,
        },
        set: {
          set: !0,
          setWith: !0,
          unset: !0,
          update: !0,
          updateWith: !0,
        },
      }),
      (e.realToAlias = (function () {
        var t = Object.prototype.hasOwnProperty,
          r = e.aliasToReal,
          n = {};
        for (var o in r) {
          var i = r[o];
          t.call(n, i) ? n[i].push(o) : (n[i] = [o]);
        }
        return n;
      })()),
      (e.remap = {
        assignAll: "assign",
        assignAllWith: "assignWith",
        assignInAll: "assignIn",
        assignInAllWith: "assignInWith",
        curryN: "curry",
        curryRightN: "curryRight",
        defaultsAll: "defaults",
        defaultsDeepAll: "defaultsDeep",
        findFrom: "find",
        findIndexFrom: "findIndex",
        findLastFrom: "findLast",
        findLastIndexFrom: "findLastIndex",
        getOr: "get",
        includesFrom: "includes",
        indexOfFrom: "indexOf",
        invokeArgs: "invoke",
        invokeArgsMap: "invokeMap",
        lastIndexOfFrom: "lastIndexOf",
        mergeAll: "merge",
        mergeAllWith: "mergeWith",
        padChars: "pad",
        padCharsEnd: "padEnd",
        padCharsStart: "padStart",
        propertyOf: "get",
        rangeStep: "range",
        rangeStepRight: "rangeRight",
        restFrom: "rest",
        spreadFrom: "spread",
        trimChars: "trim",
        trimCharsEnd: "trimEnd",
        trimCharsStart: "trimStart",
        zipAll: "zip",
      }),
      (e.skipFixed = {
        castArray: !0,
        flow: !0,
        flowRight: !0,
        iteratee: !0,
        mixin: !0,
        rearg: !0,
        runInContext: !0,
      }),
      (e.skipRearg = {
        add: !0,
        assign: !0,
        assignIn: !0,
        bind: !0,
        bindKey: !0,
        concat: !0,
        difference: !0,
        divide: !0,
        eq: !0,
        gt: !0,
        gte: !0,
        isEqual: !0,
        lt: !0,
        lte: !0,
        matchesProperty: !0,
        merge: !0,
        multiply: !0,
        overArgs: !0,
        partial: !0,
        partialRight: !0,
        propertyOf: !0,
        random: !0,
        range: !0,
        rangeRight: !0,
        subtract: !0,
        zip: !0,
        zipObject: !0,
        zipObjectDeep: !0,
      });
  })(Wv);
  var hl, Vp;
  function xu() {
    return Vp || ((Vp = 1), (hl = {})), hl;
  }
  var ht = Wv,
    q2 = xu(),
    kp = Array.prototype.push;
  function Y2(e, t) {
    return t == 2
      ? function (r, n) {
          return e.apply(void 0, arguments);
        }
      : function (r) {
          return e.apply(void 0, arguments);
        };
  }
  function gl(e, t) {
    return t == 2
      ? function (r, n) {
          return e(r, n);
        }
      : function (r) {
          return e(r);
        };
  }
  function Bp(e) {
    for (var t = e ? e.length : 0, r = Array(t); t--; ) r[t] = e[t];
    return r;
  }
  function J2(e) {
    return function (t) {
      return e({}, t);
    };
  }
  function X2(e, t) {
    return function () {
      for (var r = arguments.length, n = r - 1, o = Array(r); r--; )
        o[r] = arguments[r];
      var i = o[t],
        s = o.slice(0, t);
      return (
        i && kp.apply(s, i),
        t != n && kp.apply(s, o.slice(t + 1)),
        e.apply(this, s)
      );
    };
  }
  function ml(e, t) {
    return function () {
      var r = arguments.length;
      if (r) {
        for (var n = Array(r); r--; ) n[r] = arguments[r];
        var o = (n[0] = t.apply(void 0, n));
        return e.apply(void 0, n), o;
      }
    };
  }
  function uc(e, t, r, n) {
    var o = typeof t == "function",
      i = t === Object(t);
    if ((i && ((n = r), (r = t), (t = void 0)), r == null))
      throw new TypeError();
    n || (n = {});
    var s = {
        cap: "cap" in n ? n.cap : !0,
        curry: "curry" in n ? n.curry : !0,
        fixed: "fixed" in n ? n.fixed : !0,
        immutable: "immutable" in n ? n.immutable : !0,
        rearg: "rearg" in n ? n.rearg : !0,
      },
      a = o ? r : q2,
      l = "curry" in n && n.curry,
      c = "fixed" in n && n.fixed,
      u = "rearg" in n && n.rearg,
      f = o ? r.runInContext() : void 0,
      d = o
        ? r
        : {
            ary: e.ary,
            assign: e.assign,
            clone: e.clone,
            curry: e.curry,
            forEach: e.forEach,
            isArray: e.isArray,
            isError: e.isError,
            isFunction: e.isFunction,
            isWeakMap: e.isWeakMap,
            iteratee: e.iteratee,
            keys: e.keys,
            rearg: e.rearg,
            toInteger: e.toInteger,
            toPath: e.toPath,
          },
      p = d.ary,
      h = d.assign,
      m = d.clone,
      v = d.curry,
      g = d.forEach,
      _ = d.isArray,
      E = d.isError,
      A = d.isFunction,
      D = d.isWeakMap,
      S = d.keys,
      O = d.rearg,
      j = d.toInteger,
      B = d.toPath,
      W = S(ht.aryMethod),
      re = {
        castArray: function ($) {
          return function () {
            var N = arguments[0];
            return _(N) ? $(Bp(N)) : $.apply(void 0, arguments);
          };
        },
        iteratee: function ($) {
          return function () {
            var N = arguments[0],
              M = arguments[1],
              F = $(N, M),
              q = F.length;
            return s.cap && typeof M == "number"
              ? ((M = M > 2 ? M - 2 : 1), q && q <= M ? F : gl(F, M))
              : F;
          };
        },
        mixin: function ($) {
          return function (N) {
            var M = this;
            if (!A(M)) return $(M, Object(N));
            var F = [];
            return (
              g(S(N), function (q) {
                A(N[q]) && F.push([q, M.prototype[q]]);
              }),
              $(M, Object(N)),
              g(F, function (q) {
                var ne = q[1];
                A(ne) ? (M.prototype[q[0]] = ne) : delete M.prototype[q[0]];
              }),
              M
            );
          };
        },
        nthArg: function ($) {
          return function (N) {
            var M = N < 0 ? 1 : j(N) + 1;
            return v($(N), M);
          };
        },
        rearg: function ($) {
          return function (N, M) {
            var F = M ? M.length : 0;
            return v($(N, M), F);
          };
        },
        runInContext: function ($) {
          return function (N) {
            return uc(e, $(N), n);
          };
        },
      };
    function G($, N) {
      if (s.cap) {
        var M = ht.iterateeRearg[$];
        if (M) return Q(N, M);
        var F = !o && ht.iterateeAry[$];
        if (F) return ze(N, F);
      }
      return N;
    }
    function Se($, N, M) {
      return l || (s.curry && M > 1) ? v(N, M) : N;
    }
    function ce($, N, M) {
      if (s.fixed && (c || !ht.skipFixed[$])) {
        var F = ht.methodSpread[$],
          q = F && F.start;
        return q === void 0 ? p(N, M) : X2(N, q);
      }
      return N;
    }
    function Pe($, N, M) {
      return s.rearg && M > 1 && (u || !ht.skipRearg[$])
        ? O(N, ht.methodRearg[$] || ht.aryRearg[M])
        : N;
    }
    function _e($, N) {
      N = B(N);
      for (
        var M = -1, F = N.length, q = F - 1, ne = m(Object($)), $e = ne;
        $e != null && ++M < F;

      ) {
        var Te = N[M],
          qe = $e[Te];
        qe != null &&
          !(A(qe) || E(qe) || D(qe)) &&
          ($e[Te] = m(M == q ? qe : Object(qe))),
          ($e = $e[Te]);
      }
      return ne;
    }
    function ae($) {
      return P.runInContext.convert($)(void 0);
    }
    function me($, N) {
      var M = ht.aliasToReal[$] || $,
        F = ht.remap[M] || M,
        q = n;
      return function (ne) {
        var $e = o ? f : d,
          Te = o ? f[F] : N,
          qe = h(h({}, q), ne);
        return uc($e, M, Te, qe);
      };
    }
    function ze($, N) {
      return I($, function (M) {
        return typeof M == "function" ? gl(M, N) : M;
      });
    }
    function Q($, N) {
      return I($, function (M) {
        var F = N.length;
        return Y2(O(gl(M, F), N), F);
      });
    }
    function I($, N) {
      return function () {
        var M = arguments.length;
        if (!M) return $();
        for (var F = Array(M); M--; ) F[M] = arguments[M];
        var q = s.rearg ? 0 : M - 1;
        return (F[q] = N(F[q])), $.apply(void 0, F);
      };
    }
    function R($, N, M) {
      var F,
        q = ht.aliasToReal[$] || $,
        ne = N,
        $e = re[q];
      return (
        $e
          ? (ne = $e(N))
          : s.immutable &&
            (ht.mutate.array[q]
              ? (ne = ml(N, Bp))
              : ht.mutate.object[q]
                ? (ne = ml(N, J2(N)))
                : ht.mutate.set[q] && (ne = ml(N, _e))),
        g(W, function (Te) {
          return (
            g(ht.aryMethod[Te], function (qe) {
              if (q == qe) {
                var b = ht.methodSpread[q],
                  T = b && b.afterRearg;
                return (
                  (F = T ? ce(q, Pe(q, ne, Te), Te) : Pe(q, ce(q, ne, Te), Te)),
                  (F = G(q, F)),
                  (F = Se(q, F, Te)),
                  !1
                );
              }
            }),
            !F
          );
        }),
        F || (F = ne),
        F == N &&
          (F = l
            ? v(F, 1)
            : function () {
                return N.apply(this, arguments);
              }),
        (F.convert = me(q, N)),
        (F.placeholder = N.placeholder = M),
        F
      );
    }
    if (!i) return R(t, r, a);
    var P = r,
      y = [];
    return (
      g(W, function ($) {
        g(ht.aryMethod[$], function (N) {
          var M = P[ht.remap[N] || N];
          M && y.push([N, R(N, M, P)]);
        });
      }),
      g(S(P), function ($) {
        var N = P[$];
        if (typeof N == "function") {
          for (var M = y.length; M--; ) if (y[M][0] == $) return;
          (N.convert = me($, N)), y.push([$, N]);
        }
      }),
      g(y, function ($) {
        P[$[0]] = $[1];
      }),
      (P.convert = ae),
      (P.placeholder = P),
      g(S(P), function ($) {
        g(ht.realToAlias[$] || [], function (N) {
          P[N] = P[$];
        });
      }),
      P
    );
  }
  var Z2 = uc,
    zp = mv,
    Q2 = zp && new zp(),
    Hv = Q2,
    eF = Wa,
    Up = Hv,
    tF = Up
      ? function (e, t) {
          return Up.set(e, t), e;
        }
      : eF,
    Kv = tF,
    rF = Ua,
    nF = Zt;
  function oF(e) {
    return function () {
      var t = arguments;
      switch (t.length) {
        case 0:
          return new e();
        case 1:
          return new e(t[0]);
        case 2:
          return new e(t[0], t[1]);
        case 3:
          return new e(t[0], t[1], t[2]);
        case 4:
          return new e(t[0], t[1], t[2], t[3]);
        case 5:
          return new e(t[0], t[1], t[2], t[3], t[4]);
        case 6:
          return new e(t[0], t[1], t[2], t[3], t[4], t[5]);
        case 7:
          return new e(t[0], t[1], t[2], t[3], t[4], t[5], t[6]);
      }
      var r = rF(e.prototype),
        n = e.apply(r, t);
      return nF(n) ? n : r;
    };
  }
  var Ha = oF,
    iF = Ha,
    sF = jt,
    aF = 1;
  function lF(e, t, r) {
    var n = t & aF,
      o = iF(e);
    function i() {
      var s = this && this !== sF && this instanceof i ? o : e;
      return s.apply(n ? r : this, arguments);
    }
    return i;
  }
  var cF = lF,
    uF = Math.max;
  function fF(e, t, r, n) {
    for (
      var o = -1,
        i = e.length,
        s = r.length,
        a = -1,
        l = t.length,
        c = uF(i - s, 0),
        u = Array(l + c),
        f = !n;
      ++a < l;

    )
      u[a] = t[a];
    for (; ++o < s; ) (f || o < i) && (u[r[o]] = e[o]);
    for (; c--; ) u[a++] = e[o++];
    return u;
  }
  var Gv = fF,
    dF = Math.max;
  function pF(e, t, r, n) {
    for (
      var o = -1,
        i = e.length,
        s = -1,
        a = r.length,
        l = -1,
        c = t.length,
        u = dF(i - a, 0),
        f = Array(u + c),
        d = !n;
      ++o < u;

    )
      f[o] = e[o];
    for (var p = o; ++l < c; ) f[p + l] = t[l];
    for (; ++s < a; ) (d || o < i) && (f[p + r[s]] = e[o++]);
    return f;
  }
  var qv = pF;
  function hF(e, t) {
    for (var r = e.length, n = 0; r--; ) e[r] === t && ++n;
    return n;
  }
  var gF = hF;
  function mF() {}
  var Du = mF,
    vF = Ua,
    yF = Du,
    _F = 4294967295;
  function ta(e) {
    (this.__wrapped__ = e),
      (this.__actions__ = []),
      (this.__dir__ = 1),
      (this.__filtered__ = !1),
      (this.__iteratees__ = []),
      (this.__takeCount__ = _F),
      (this.__views__ = []);
  }
  ta.prototype = vF(yF.prototype);
  ta.prototype.constructor = ta;
  var Iu = ta;
  function $F() {}
  var bF = $F,
    Wp = Hv,
    wF = bF,
    EF = Wp
      ? function (e) {
          return Wp.get(e);
        }
      : wF,
    Yv = EF,
    OF = {},
    AF = OF,
    Hp = AF,
    SF = Object.prototype,
    NF = SF.hasOwnProperty;
  function PF(e) {
    for (
      var t = e.name + "", r = Hp[t], n = NF.call(Hp, t) ? r.length : 0;
      n--;

    ) {
      var o = r[n],
        i = o.func;
      if (i == null || i == e) return o.name;
    }
    return t;
  }
  var CF = PF,
    TF = Ua,
    xF = Du;
  function ra(e, t) {
    (this.__wrapped__ = e),
      (this.__actions__ = []),
      (this.__chain__ = !!t),
      (this.__index__ = 0),
      (this.__values__ = void 0);
  }
  ra.prototype = TF(xF.prototype);
  ra.prototype.constructor = ra;
  var Jv = ra,
    DF = Iu,
    IF = Jv,
    RF = Gi;
  function MF(e) {
    if (e instanceof DF) return e.clone();
    var t = new IF(e.__wrapped__, e.__chain__);
    return (
      (t.__actions__ = RF(e.__actions__)),
      (t.__index__ = e.__index__),
      (t.__values__ = e.__values__),
      t
    );
  }
  var jF = MF,
    FF = Iu,
    Kp = Jv,
    LF = Du,
    VF = Ft,
    kF = Qt,
    BF = jF,
    zF = Object.prototype,
    UF = zF.hasOwnProperty;
  function na(e) {
    if (kF(e) && !VF(e) && !(e instanceof FF)) {
      if (e instanceof Kp) return e;
      if (UF.call(e, "__wrapped__")) return BF(e);
    }
    return new Kp(e);
  }
  na.prototype = LF.prototype;
  na.prototype.constructor = na;
  var WF = na,
    HF = Iu,
    KF = Yv,
    GF = CF,
    qF = WF;
  function YF(e) {
    var t = GF(e),
      r = qF[t];
    if (typeof r != "function" || !(t in HF.prototype)) return !1;
    if (e === r) return !0;
    var n = KF(r);
    return !!n && e === n[0];
  }
  var JF = YF,
    XF = Kv,
    ZF = Rv,
    QF = ZF(XF),
    Xv = QF,
    eL = /\{\n\/\* \[wrapped with (.+)\] \*/,
    tL = /,? & /;
  function rL(e) {
    var t = e.match(eL);
    return t ? t[1].split(tL) : [];
  }
  var nL = rL,
    oL = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/;
  function iL(e, t) {
    var r = t.length;
    if (!r) return e;
    var n = r - 1;
    return (
      (t[n] = (r > 1 ? "& " : "") + t[n]),
      (t = t.join(r > 2 ? ", " : " ")),
      e.replace(
        oL,
        `{
/* [wrapped with ` +
          t +
          `] */
`
      )
    );
  }
  var sL = iL;
  function aL(e, t, r, n) {
    for (var o = e.length, i = r + (n ? 1 : -1); n ? i-- : ++i < o; )
      if (t(e[i], i, e)) return i;
    return -1;
  }
  var lL = aL;
  function cL(e) {
    return e !== e;
  }
  var uL = cL;
  function fL(e, t, r) {
    for (var n = r - 1, o = e.length; ++n < o; ) if (e[n] === t) return n;
    return -1;
  }
  var dL = fL,
    pL = lL,
    hL = uL,
    gL = dL;
  function mL(e, t, r) {
    return t === t ? gL(e, t, r) : pL(e, hL, r);
  }
  var vL = mL,
    yL = vL;
  function _L(e, t) {
    var r = e == null ? 0 : e.length;
    return !!r && yL(e, t, 0) > -1;
  }
  var $L = _L,
    bL = Pu,
    wL = $L,
    EL = 1,
    OL = 2,
    AL = 8,
    SL = 16,
    NL = 32,
    PL = 64,
    CL = 128,
    TL = 256,
    xL = 512,
    DL = [
      ["ary", CL],
      ["bind", EL],
      ["bindKey", OL],
      ["curry", AL],
      ["curryRight", SL],
      ["flip", xL],
      ["partial", NL],
      ["partialRight", PL],
      ["rearg", TL],
    ];
  function IL(e, t) {
    return (
      bL(DL, function (r) {
        var n = "_." + r[0];
        t & r[1] && !wL(e, n) && e.push(n);
      }),
      e.sort()
    );
  }
  var RL = IL,
    ML = nL,
    jL = sL,
    FL = Nu,
    LL = RL;
  function VL(e, t, r) {
    var n = t + "";
    return FL(e, jL(n, LL(ML(n), r)));
  }
  var Zv = VL,
    kL = JF,
    BL = Xv,
    zL = Zv,
    UL = 1,
    WL = 2,
    HL = 4,
    KL = 8,
    Gp = 32,
    qp = 64;
  function GL(e, t, r, n, o, i, s, a, l, c) {
    var u = t & KL,
      f = u ? s : void 0,
      d = u ? void 0 : s,
      p = u ? i : void 0,
      h = u ? void 0 : i;
    (t |= u ? Gp : qp), (t &= ~(u ? qp : Gp)), t & HL || (t &= ~(UL | WL));
    var m = [e, t, o, p, f, h, d, a, l, c],
      v = r.apply(void 0, m);
    return kL(e) && BL(v, m), (v.placeholder = n), zL(v, e, t);
  }
  var Qv = GL;
  function qL(e) {
    var t = e;
    return t.placeholder;
  }
  var ey = qL,
    YL = Gi,
    JL = Hi,
    XL = Math.min;
  function ZL(e, t) {
    for (var r = e.length, n = XL(t.length, r), o = YL(e); n--; ) {
      var i = t[n];
      e[n] = JL(i, r) ? o[i] : void 0;
    }
    return e;
  }
  var QL = ZL,
    Yp = "__lodash_placeholder__";
  function eV(e, t) {
    for (var r = -1, n = e.length, o = 0, i = []; ++r < n; ) {
      var s = e[r];
      (s === t || s === Yp) && ((e[r] = Yp), (i[o++] = r));
    }
    return i;
  }
  var Ru = eV,
    tV = Gv,
    rV = qv,
    nV = gF,
    Jp = Ha,
    oV = Qv,
    iV = ey,
    sV = QL,
    aV = Ru,
    lV = jt,
    cV = 1,
    uV = 2,
    fV = 8,
    dV = 16,
    pV = 128,
    hV = 512;
  function ty(e, t, r, n, o, i, s, a, l, c) {
    var u = t & pV,
      f = t & cV,
      d = t & uV,
      p = t & (fV | dV),
      h = t & hV,
      m = d ? void 0 : Jp(e);
    function v() {
      for (var g = arguments.length, _ = Array(g), E = g; E--; )
        _[E] = arguments[E];
      if (p)
        var A = iV(v),
          D = nV(_, A);
      if (
        (n && (_ = tV(_, n, o, p)),
        i && (_ = rV(_, i, s, p)),
        (g -= D),
        p && g < c)
      ) {
        var S = aV(_, A);
        return oV(e, t, ty, v.placeholder, r, _, S, a, l, c - g);
      }
      var O = f ? r : this,
        j = d ? O[e] : e;
      return (
        (g = _.length),
        a ? (_ = sV(_, a)) : h && g > 1 && _.reverse(),
        u && l < g && (_.length = l),
        this && this !== lV && this instanceof v && (j = m || Jp(j)),
        j.apply(O, _)
      );
    }
    return v;
  }
  var ry = ty,
    gV = Su,
    mV = Ha,
    vV = ry,
    yV = Qv,
    _V = ey,
    $V = Ru,
    bV = jt;
  function wV(e, t, r) {
    var n = mV(e);
    function o() {
      for (var i = arguments.length, s = Array(i), a = i, l = _V(o); a--; )
        s[a] = arguments[a];
      var c = i < 3 && s[0] !== l && s[i - 1] !== l ? [] : $V(s, l);
      if (((i -= c.length), i < r))
        return yV(e, t, vV, o.placeholder, void 0, s, c, void 0, void 0, r - i);
      var u = this && this !== bV && this instanceof o ? n : e;
      return gV(u, this, s);
    }
    return o;
  }
  var EV = wV,
    OV = Su,
    AV = Ha,
    SV = jt,
    NV = 1;
  function PV(e, t, r, n) {
    var o = t & NV,
      i = AV(e);
    function s() {
      for (
        var a = -1,
          l = arguments.length,
          c = -1,
          u = n.length,
          f = Array(u + l),
          d = this && this !== SV && this instanceof s ? i : e;
        ++c < u;

      )
        f[c] = n[c];
      for (; l--; ) f[c++] = arguments[++a];
      return OV(d, o ? r : this, f);
    }
    return s;
  }
  var CV = PV,
    TV = Gv,
    xV = qv,
    Xp = Ru,
    Zp = "__lodash_placeholder__",
    vl = 1,
    DV = 2,
    IV = 4,
    Qp = 8,
    ei = 128,
    eh = 256,
    RV = Math.min;
  function MV(e, t) {
    var r = e[1],
      n = t[1],
      o = r | n,
      i = o < (vl | DV | ei),
      s =
        (n == ei && r == Qp) ||
        (n == ei && r == eh && e[7].length <= t[8]) ||
        (n == (ei | eh) && t[7].length <= t[8] && r == Qp);
    if (!(i || s)) return e;
    n & vl && ((e[2] = t[2]), (o |= r & vl ? 0 : IV));
    var a = t[3];
    if (a) {
      var l = e[3];
      (e[3] = l ? TV(l, a, t[4]) : a), (e[4] = l ? Xp(e[3], Zp) : t[4]);
    }
    return (
      (a = t[5]),
      a &&
        ((l = e[5]),
        (e[5] = l ? xV(l, a, t[6]) : a),
        (e[6] = l ? Xp(e[5], Zp) : t[6])),
      (a = t[7]),
      a && (e[7] = a),
      n & ei && (e[8] = e[8] == null ? t[8] : RV(e[8], t[8])),
      e[9] == null && (e[9] = t[9]),
      (e[0] = t[0]),
      (e[1] = o),
      e
    );
  }
  var jV = MV,
    FV = /\s/;
  function LV(e) {
    for (var t = e.length; t-- && FV.test(e.charAt(t)); );
    return t;
  }
  var VV = LV,
    kV = VV,
    BV = /^\s+/;
  function zV(e) {
    return e && e.slice(0, kV(e) + 1).replace(BV, "");
  }
  var UV = zV,
    WV = UV,
    th = Zt,
    HV = Wi,
    rh = 0 / 0,
    KV = /^[-+]0x[0-9a-f]+$/i,
    GV = /^0b[01]+$/i,
    qV = /^0o[0-7]+$/i,
    YV = parseInt;
  function JV(e) {
    if (typeof e == "number") return e;
    if (HV(e)) return rh;
    if (th(e)) {
      var t = typeof e.valueOf == "function" ? e.valueOf() : e;
      e = th(t) ? t + "" : t;
    }
    if (typeof e != "string") return e === 0 ? e : +e;
    e = WV(e);
    var r = GV.test(e);
    return r || qV.test(e) ? YV(e.slice(2), r ? 2 : 8) : KV.test(e) ? rh : +e;
  }
  var XV = JV,
    ZV = XV,
    nh = 1 / 0,
    QV = 17976931348623157e292;
  function ek(e) {
    if (!e) return e === 0 ? e : 0;
    if (((e = ZV(e)), e === nh || e === -nh)) {
      var t = e < 0 ? -1 : 1;
      return t * QV;
    }
    return e === e ? e : 0;
  }
  var tk = ek,
    rk = tk;
  function nk(e) {
    var t = rk(e),
      r = t % 1;
    return t === t ? (r ? t - r : t) : 0;
  }
  var ny = nk,
    ok = Kv,
    ik = cF,
    sk = EV,
    ak = ry,
    lk = CV,
    ck = Yv,
    uk = jV,
    fk = Xv,
    dk = Zv,
    oh = ny,
    pk = "Expected a function",
    ih = 1,
    hk = 2,
    yl = 8,
    _l = 16,
    $l = 32,
    sh = 64,
    ah = Math.max;
  function gk(e, t, r, n, o, i, s, a) {
    var l = t & hk;
    if (!l && typeof e != "function") throw new TypeError(pk);
    var c = n ? n.length : 0;
    if (
      (c || ((t &= ~($l | sh)), (n = o = void 0)),
      (s = s === void 0 ? s : ah(oh(s), 0)),
      (a = a === void 0 ? a : oh(a)),
      (c -= o ? o.length : 0),
      t & sh)
    ) {
      var u = n,
        f = o;
      n = o = void 0;
    }
    var d = l ? void 0 : ck(e),
      p = [e, t, r, n, o, u, f, i, s, a];
    if (
      (d && uk(p, d),
      (e = p[0]),
      (t = p[1]),
      (r = p[2]),
      (n = p[3]),
      (o = p[4]),
      (a = p[9] = p[9] === void 0 ? (l ? 0 : e.length) : ah(p[9] - c, 0)),
      !a && t & (yl | _l) && (t &= ~(yl | _l)),
      !t || t == ih)
    )
      var h = ik(e, t, r);
    else
      t == yl || t == _l
        ? (h = sk(e, t, a))
        : (t == $l || t == (ih | $l)) && !o.length
          ? (h = lk(e, t, r, n))
          : (h = ak.apply(void 0, p));
    var m = d ? ok : fk;
    return dk(m(h, p), e, t);
  }
  var Mu = gk,
    mk = Mu,
    vk = 128;
  function yk(e, t, r) {
    return (
      (t = r ? void 0 : t),
      (t = e && t == null ? e.length : t),
      mk(e, vk, void 0, void 0, void 0, void 0, t)
    );
  }
  var _k = yk,
    $k = Uv,
    bk = 4;
  function wk(e) {
    return $k(e, bk);
  }
  var Ek = wk,
    Ok = Mu,
    Ak = 8;
  function ju(e, t, r) {
    t = r ? void 0 : t;
    var n = Ok(e, Ak, void 0, void 0, void 0, void 0, void 0, t);
    return (n.placeholder = ju.placeholder), n;
  }
  ju.placeholder = {};
  var Sk = ju,
    Nk = ro,
    Pk = Qt,
    Ck = Tv,
    Tk = "[object DOMException]",
    xk = "[object Error]";
  function Dk(e) {
    if (!Pk(e)) return !1;
    var t = Nk(e);
    return (
      t == xk ||
      t == Tk ||
      (typeof e.message == "string" && typeof e.name == "string" && !Ck(e))
    );
  }
  var Ik = Dk,
    Rk = Ui,
    Mk = Qt,
    jk = "[object WeakMap]";
  function Fk(e) {
    return Mk(e) && Rk(e) == jk;
  }
  var Lk = Fk,
    Vk = "__lodash_hash_undefined__";
  function kk(e) {
    return this.__data__.set(e, Vk), this;
  }
  var Bk = kk;
  function zk(e) {
    return this.__data__.has(e);
  }
  var Uk = zk,
    Wk = bu,
    Hk = Bk,
    Kk = Uk;
  function oa(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.__data__ = new Wk(); ++t < r; ) this.add(e[t]);
  }
  oa.prototype.add = oa.prototype.push = Hk;
  oa.prototype.has = Kk;
  var Gk = oa;
  function qk(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length; ++r < n; )
      if (t(e[r], r, e)) return !0;
    return !1;
  }
  var Yk = qk;
  function Jk(e, t) {
    return e.has(t);
  }
  var Xk = Jk,
    Zk = Gk,
    Qk = Yk,
    e3 = Xk,
    t3 = 1,
    r3 = 2;
  function n3(e, t, r, n, o, i) {
    var s = r & t3,
      a = e.length,
      l = t.length;
    if (a != l && !(s && l > a)) return !1;
    var c = i.get(e),
      u = i.get(t);
    if (c && u) return c == t && u == e;
    var f = -1,
      d = !0,
      p = r & r3 ? new Zk() : void 0;
    for (i.set(e, t), i.set(t, e); ++f < a; ) {
      var h = e[f],
        m = t[f];
      if (n) var v = s ? n(m, h, f, t, e, i) : n(h, m, f, e, t, i);
      if (v !== void 0) {
        if (v) continue;
        d = !1;
        break;
      }
      if (p) {
        if (
          !Qk(t, function (g, _) {
            if (!e3(p, _) && (h === g || o(h, g, r, n, i))) return p.push(_);
          })
        ) {
          d = !1;
          break;
        }
      } else if (!(h === m || o(h, m, r, n, i))) {
        d = !1;
        break;
      }
    }
    return i.delete(e), i.delete(t), d;
  }
  var oy = n3;
  function o3(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (n, o) {
        r[++t] = [o, n];
      }),
      r
    );
  }
  var i3 = o3;
  function s3(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (n) {
        r[++t] = n;
      }),
      r
    );
  }
  var a3 = s3,
    lh = Do,
    ch = Sv,
    l3 = Ki,
    c3 = oy,
    u3 = i3,
    f3 = a3,
    d3 = 1,
    p3 = 2,
    h3 = "[object Boolean]",
    g3 = "[object Date]",
    m3 = "[object Error]",
    v3 = "[object Map]",
    y3 = "[object Number]",
    _3 = "[object RegExp]",
    $3 = "[object Set]",
    b3 = "[object String]",
    w3 = "[object Symbol]",
    E3 = "[object ArrayBuffer]",
    O3 = "[object DataView]",
    uh = lh ? lh.prototype : void 0,
    bl = uh ? uh.valueOf : void 0;
  function A3(e, t, r, n, o, i, s) {
    switch (r) {
      case O3:
        if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
          return !1;
        (e = e.buffer), (t = t.buffer);
      case E3:
        return !(e.byteLength != t.byteLength || !i(new ch(e), new ch(t)));
      case h3:
      case g3:
      case y3:
        return l3(+e, +t);
      case m3:
        return e.name == t.name && e.message == t.message;
      case _3:
      case b3:
        return e == t + "";
      case v3:
        var a = u3;
      case $3:
        var l = n & d3;
        if ((a || (a = f3), e.size != t.size && !l)) return !1;
        var c = s.get(e);
        if (c) return c == t;
        (n |= p3), s.set(e, t);
        var u = c3(a(e), a(t), n, o, i, s);
        return s.delete(e), u;
      case w3:
        if (bl) return bl.call(e) == bl.call(t);
    }
    return !1;
  }
  var S3 = A3,
    fh = Vv,
    N3 = 1,
    P3 = Object.prototype,
    C3 = P3.hasOwnProperty;
  function T3(e, t, r, n, o, i) {
    var s = r & N3,
      a = fh(e),
      l = a.length,
      c = fh(t),
      u = c.length;
    if (l != u && !s) return !1;
    for (var f = l; f--; ) {
      var d = a[f];
      if (!(s ? d in t : C3.call(t, d))) return !1;
    }
    var p = i.get(e),
      h = i.get(t);
    if (p && h) return p == t && h == e;
    var m = !0;
    i.set(e, t), i.set(t, e);
    for (var v = s; ++f < l; ) {
      d = a[f];
      var g = e[d],
        _ = t[d];
      if (n) var E = s ? n(_, g, d, t, e, i) : n(g, _, d, e, t, i);
      if (!(E === void 0 ? g === _ || o(g, _, r, n, i) : E)) {
        m = !1;
        break;
      }
      v || (v = d == "constructor");
    }
    if (m && !v) {
      var A = e.constructor,
        D = t.constructor;
      A != D &&
        "constructor" in e &&
        "constructor" in t &&
        !(
          typeof A == "function" &&
          A instanceof A &&
          typeof D == "function" &&
          D instanceof D
        ) &&
        (m = !1);
    }
    return i.delete(e), i.delete(t), m;
  }
  var x3 = T3,
    wl = za,
    D3 = oy,
    I3 = S3,
    R3 = x3,
    dh = Ui,
    ph = Ft,
    hh = ja,
    M3 = $u,
    j3 = 1,
    gh = "[object Arguments]",
    mh = "[object Array]",
    vs = "[object Object]",
    F3 = Object.prototype,
    vh = F3.hasOwnProperty;
  function L3(e, t, r, n, o, i) {
    var s = ph(e),
      a = ph(t),
      l = s ? mh : dh(e),
      c = a ? mh : dh(t);
    (l = l == gh ? vs : l), (c = c == gh ? vs : c);
    var u = l == vs,
      f = c == vs,
      d = l == c;
    if (d && hh(e)) {
      if (!hh(t)) return !1;
      (s = !0), (u = !1);
    }
    if (d && !u)
      return (
        i || (i = new wl()),
        s || M3(e) ? D3(e, t, r, n, o, i) : I3(e, t, l, r, n, o, i)
      );
    if (!(r & j3)) {
      var p = u && vh.call(e, "__wrapped__"),
        h = f && vh.call(t, "__wrapped__");
      if (p || h) {
        var m = p ? e.value() : e,
          v = h ? t.value() : t;
        return i || (i = new wl()), o(m, v, r, n, i);
      }
    }
    return d ? (i || (i = new wl()), R3(e, t, r, n, o, i)) : !1;
  }
  var V3 = L3,
    k3 = V3,
    yh = Qt;
  function iy(e, t, r, n, o) {
    return e === t
      ? !0
      : e == null || t == null || (!yh(e) && !yh(t))
        ? e !== e && t !== t
        : k3(e, t, r, n, iy, o);
  }
  var sy = iy,
    B3 = za,
    z3 = sy,
    U3 = 1,
    W3 = 2;
  function H3(e, t, r, n) {
    var o = r.length,
      i = o,
      s = !n;
    if (e == null) return !i;
    for (e = Object(e); o--; ) {
      var a = r[o];
      if (s && a[2] ? a[1] !== e[a[0]] : !(a[0] in e)) return !1;
    }
    for (; ++o < i; ) {
      a = r[o];
      var l = a[0],
        c = e[l],
        u = a[1];
      if (s && a[2]) {
        if (c === void 0 && !(l in e)) return !1;
      } else {
        var f = new B3();
        if (n) var d = n(c, u, l, e, t, f);
        if (!(d === void 0 ? z3(u, c, U3 | W3, n, f) : d)) return !1;
      }
    }
    return !0;
  }
  var K3 = H3,
    G3 = Zt;
  function q3(e) {
    return e === e && !G3(e);
  }
  var ay = q3,
    Y3 = ay,
    J3 = Fa;
  function X3(e) {
    for (var t = J3(e), r = t.length; r--; ) {
      var n = t[r],
        o = e[n];
      t[r] = [n, o, Y3(o)];
    }
    return t;
  }
  var Z3 = X3;
  function Q3(e, t) {
    return function (r) {
      return r == null ? !1 : r[e] === t && (t !== void 0 || e in Object(r));
    };
  }
  var ly = Q3,
    eB = K3,
    tB = Z3,
    rB = ly;
  function nB(e) {
    var t = tB(e);
    return t.length == 1 && t[0][2]
      ? rB(t[0][0], t[0][1])
      : function (r) {
          return r === e || eB(r, e, t);
        };
  }
  var oB = nB,
    iB = Ft,
    sB = Wi,
    aB = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    lB = /^\w*$/;
  function cB(e, t) {
    if (iB(e)) return !1;
    var r = typeof e;
    return r == "number" ||
      r == "symbol" ||
      r == "boolean" ||
      e == null ||
      sB(e)
      ? !0
      : lB.test(e) || !aB.test(e) || (t != null && e in Object(t));
  }
  var Fu = cB,
    cy = bu,
    uB = "Expected a function";
  function Lu(e, t) {
    if (typeof e != "function" || (t != null && typeof t != "function"))
      throw new TypeError(uB);
    var r = function () {
      var n = arguments,
        o = t ? t.apply(this, n) : n[0],
        i = r.cache;
      if (i.has(o)) return i.get(o);
      var s = e.apply(this, n);
      return (r.cache = i.set(o, s) || i), s;
    };
    return (r.cache = new (Lu.Cache || cy)()), r;
  }
  Lu.Cache = cy;
  var fB = Lu,
    dB = fB,
    pB = 500;
  function hB(e) {
    var t = dB(e, function (n) {
        return r.size === pB && r.clear(), n;
      }),
      r = t.cache;
    return t;
  }
  var gB = hB,
    mB = gB,
    vB =
      /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
    yB = /\\(\\)?/g,
    _B = mB(function (e) {
      var t = [];
      return (
        e.charCodeAt(0) === 46 && t.push(""),
        e.replace(vB, function (r, n, o, i) {
          t.push(o ? i.replace(yB, "$1") : n || r);
        }),
        t
      );
    }),
    uy = _B,
    $B = Ft,
    bB = Fu,
    wB = uy,
    EB = bv;
  function OB(e, t) {
    return $B(e) ? e : bB(e, t) ? [e] : wB(EB(e));
  }
  var Ka = OB,
    AB = Wi,
    SB = 1 / 0;
  function NB(e) {
    if (typeof e == "string" || AB(e)) return e;
    var t = e + "";
    return t == "0" && 1 / e == -SB ? "-0" : t;
  }
  var oo = NB,
    PB = Ka,
    CB = oo;
  function TB(e, t) {
    t = PB(t, e);
    for (var r = 0, n = t.length; e != null && r < n; ) e = e[CB(t[r++])];
    return r && r == n ? e : void 0;
  }
  var Vu = TB,
    xB = Vu;
  function DB(e, t, r) {
    var n = e == null ? void 0 : xB(e, t);
    return n === void 0 ? r : n;
  }
  var IB = DB;
  function RB(e, t) {
    return e != null && t in Object(e);
  }
  var MB = RB,
    jB = Ka,
    FB = Ra,
    LB = Ft,
    VB = Hi,
    kB = vu,
    BB = oo;
  function zB(e, t, r) {
    t = jB(t, e);
    for (var n = -1, o = t.length, i = !1; ++n < o; ) {
      var s = BB(t[n]);
      if (!(i = e != null && r(e, s))) break;
      e = e[s];
    }
    return i || ++n != o
      ? i
      : ((o = e == null ? 0 : e.length),
        !!o && kB(o) && VB(s, o) && (LB(e) || FB(e)));
  }
  var UB = zB,
    WB = MB,
    HB = UB;
  function KB(e, t) {
    return e != null && HB(e, t, WB);
  }
  var GB = KB,
    qB = sy,
    YB = IB,
    JB = GB,
    XB = Fu,
    ZB = ay,
    QB = ly,
    ez = oo,
    tz = 1,
    rz = 2;
  function nz(e, t) {
    return XB(e) && ZB(t)
      ? QB(ez(e), t)
      : function (r) {
          var n = YB(r, e);
          return n === void 0 && n === t ? JB(r, e) : qB(t, n, tz | rz);
        };
  }
  var oz = nz;
  function iz(e) {
    return function (t) {
      return t == null ? void 0 : t[e];
    };
  }
  var sz = iz,
    az = Vu;
  function lz(e) {
    return function (t) {
      return az(t, e);
    };
  }
  var cz = lz,
    uz = sz,
    fz = cz,
    dz = Fu,
    pz = oo;
  function hz(e) {
    return dz(e) ? uz(pz(e)) : fz(e);
  }
  var gz = hz,
    mz = oB,
    vz = oz,
    yz = Wa,
    _z = Ft,
    $z = gz;
  function bz(e) {
    return typeof e == "function"
      ? e
      : e == null
        ? yz
        : typeof e == "object"
          ? _z(e)
            ? vz(e[0], e[1])
            : mz(e)
          : $z(e);
  }
  var wz = bz,
    Ez = Uv,
    Oz = wz,
    Az = 1;
  function Sz(e) {
    return Oz(typeof e == "function" ? e : Ez(e, Az));
  }
  var Nz = Sz,
    _h = Do,
    Pz = Ra,
    Cz = Ft,
    $h = _h ? _h.isConcatSpreadable : void 0;
  function Tz(e) {
    return Cz(e) || Pz(e) || !!($h && e && e[$h]);
  }
  var xz = Tz,
    Dz = Tu,
    Iz = xz;
  function fy(e, t, r, n, o) {
    var i = -1,
      s = e.length;
    for (r || (r = Iz), o || (o = []); ++i < s; ) {
      var a = e[i];
      t > 0 && r(a)
        ? t > 1
          ? fy(a, t - 1, r, n, o)
          : Dz(o, a)
        : n || (o[o.length] = a);
    }
    return o;
  }
  var Rz = fy,
    Mz = Rz;
  function jz(e) {
    var t = e == null ? 0 : e.length;
    return t ? Mz(e, 1) : [];
  }
  var Fz = jz,
    Lz = Fz,
    Vz = Iv,
    kz = Nu;
  function Bz(e) {
    return kz(Vz(e, void 0, Lz), e + "");
  }
  var zz = Bz,
    Uz = Mu,
    Wz = zz,
    Hz = 256,
    Kz = Wz(function (e, t) {
      return Uz(e, Hz, void 0, void 0, void 0, t);
    }),
    Gz = Kz,
    qz = _v,
    Yz = Gi,
    Jz = Ft,
    Xz = Wi,
    Zz = uy,
    Qz = oo,
    e4 = bv;
  function t4(e) {
    return Jz(e) ? qz(e, Qz) : Xz(e) ? [e] : Yz(Zz(e4(e)));
  }
  var r4 = t4,
    n4 = {
      ary: _k,
      assign: Mv,
      clone: Ek,
      curry: Sk,
      forEach: Pu,
      isArray: Ft,
      isError: Ik,
      isFunction: Ia,
      isWeakMap: Lk,
      iteratee: Nz,
      keys: dv,
      rearg: Gz,
      toInteger: ny,
      toPath: r4,
    },
    o4 = Z2,
    i4 = n4;
  function s4(e, t, r) {
    return o4(i4, e, t, r);
  }
  var dy = s4,
    El,
    bh;
  function a4() {
    if (bh) return El;
    bh = 1;
    var e = Au,
      t = Ka,
      r = Hi,
      n = Zt,
      o = oo;
    function i(s, a, l, c) {
      if (!n(s)) return s;
      a = t(a, s);
      for (var u = -1, f = a.length, d = f - 1, p = s; p != null && ++u < f; ) {
        var h = o(a[u]),
          m = l;
        if (h === "__proto__" || h === "constructor" || h === "prototype")
          return s;
        if (u != d) {
          var v = p[h];
          (m = c ? c(v, h, p) : void 0),
            m === void 0 && (m = n(v) ? v : r(a[u + 1]) ? [] : {});
        }
        e(p, h, m), (p = p[h]);
      }
      return s;
    }
    return (El = i), El;
  }
  var Ol, wh;
  function l4() {
    if (wh) return Ol;
    wh = 1;
    var e = a4();
    function t(r, n, o) {
      return r == null ? r : e(r, n, o);
    }
    return (Ol = t), Ol;
  }
  var c4 = dy,
    u4 = c4("set", l4());
  u4.placeholder = xu();
  function f4(e) {
    var t = e == null ? 0 : e.length;
    return t ? e[t - 1] : void 0;
  }
  var d4 = f4,
    p4 = Vu,
    h4 = WT;
  function g4(e, t) {
    return t.length < 2 ? e : p4(e, h4(t, 0, -1));
  }
  var m4 = g4,
    v4 = Ka,
    y4 = d4,
    _4 = m4,
    $4 = oo;
  function b4(e, t) {
    return (t = v4(t, e)), (e = _4(e, t)), e == null || delete e[$4(y4(t))];
  }
  var w4 = b4,
    Al,
    Eh;
  function E4() {
    if (Eh) return Al;
    Eh = 1;
    var e = w4;
    function t(r, n) {
      return r == null ? !0 : e(r, n);
    }
    return (Al = t), Al;
  }
  var O4 = dy,
    A4 = O4("unset", E4());
  A4.placeholder = xu();
  var fc = { exports: {} },
    py = {},
    Yt = {},
    wo = {},
    Lo = {},
    Ie = {},
    Eo = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.regexpCode =
        e.getEsmExportName =
        e.getProperty =
        e.safeStringify =
        e.stringify =
        e.strConcat =
        e.addCodeArg =
        e.str =
        e._ =
        e.nil =
        e._Code =
        e.Name =
        e.IDENTIFIER =
        e._CodeOrName =
          void 0);
    class t {}
    (e._CodeOrName = t), (e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i);
    class r extends t {
      constructor(_) {
        if ((super(), !e.IDENTIFIER.test(_)))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = _;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return !1;
      }
      get names() {
        return { [this.str]: 1 };
      }
    }
    e.Name = r;
    class n extends t {
      constructor(_) {
        super(), (this._items = typeof _ == "string" ? [_] : _);
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1) return !1;
        const _ = this._items[0];
        return _ === "" || _ === '""';
      }
      get str() {
        var _;
        return (_ = this._str) !== null && _ !== void 0
          ? _
          : (this._str = this._items.reduce((E, A) => `${E}${A}`, ""));
      }
      get names() {
        var _;
        return (_ = this._names) !== null && _ !== void 0
          ? _
          : (this._names = this._items.reduce(
              (E, A) => (A instanceof r && (E[A.str] = (E[A.str] || 0) + 1), E),
              {}
            ));
      }
    }
    (e._Code = n), (e.nil = new n(""));
    function o(g, ..._) {
      const E = [g[0]];
      let A = 0;
      for (; A < _.length; ) a(E, _[A]), E.push(g[++A]);
      return new n(E);
    }
    e._ = o;
    const i = new n("+");
    function s(g, ..._) {
      const E = [p(g[0])];
      let A = 0;
      for (; A < _.length; ) E.push(i), a(E, _[A]), E.push(i, p(g[++A]));
      return l(E), new n(E);
    }
    e.str = s;
    function a(g, _) {
      _ instanceof n
        ? g.push(..._._items)
        : _ instanceof r
          ? g.push(_)
          : g.push(f(_));
    }
    e.addCodeArg = a;
    function l(g) {
      let _ = 1;
      for (; _ < g.length - 1; ) {
        if (g[_] === i) {
          const E = c(g[_ - 1], g[_ + 1]);
          if (E !== void 0) {
            g.splice(_ - 1, 3, E);
            continue;
          }
          g[_++] = "+";
        }
        _++;
      }
    }
    function c(g, _) {
      if (_ === '""') return g;
      if (g === '""') return _;
      if (typeof g == "string")
        return _ instanceof r || g[g.length - 1] !== '"'
          ? void 0
          : typeof _ != "string"
            ? `${g.slice(0, -1)}${_}"`
            : _[0] === '"'
              ? g.slice(0, -1) + _.slice(1)
              : void 0;
      if (typeof _ == "string" && _[0] === '"' && !(g instanceof r))
        return `"${g}${_.slice(1)}`;
    }
    function u(g, _) {
      return _.emptyStr() ? g : g.emptyStr() ? _ : s`${g}${_}`;
    }
    e.strConcat = u;
    function f(g) {
      return typeof g == "number" || typeof g == "boolean" || g === null
        ? g
        : p(Array.isArray(g) ? g.join(",") : g);
    }
    function d(g) {
      return new n(p(g));
    }
    e.stringify = d;
    function p(g) {
      return JSON.stringify(g)
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
    }
    e.safeStringify = p;
    function h(g) {
      return typeof g == "string" && e.IDENTIFIER.test(g)
        ? new n(`.${g}`)
        : o`[${g}]`;
    }
    e.getProperty = h;
    function m(g) {
      if (typeof g == "string" && e.IDENTIFIER.test(g)) return new n(`${g}`);
      throw new Error(
        `CodeGen: invalid export name: ${g}, use explicit $id name mapping`
      );
    }
    e.getEsmExportName = m;
    function v(g) {
      return new n(g.toString());
    }
    e.regexpCode = v;
  })(Eo);
  var dc = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.ValueScope =
        e.ValueScopeName =
        e.Scope =
        e.varKinds =
        e.UsedValueState =
          void 0);
    const t = Eo;
    class r extends Error {
      constructor(c) {
        super(`CodeGen: "code" for ${c} not defined`), (this.value = c.value);
      }
    }
    var n;
    (function (l) {
      (l[(l.Started = 0)] = "Started"), (l[(l.Completed = 1)] = "Completed");
    })((n = e.UsedValueState || (e.UsedValueState = {}))),
      (e.varKinds = {
        const: new t.Name("const"),
        let: new t.Name("let"),
        var: new t.Name("var"),
      });
    class o {
      constructor({ prefixes: c, parent: u } = {}) {
        (this._names = {}), (this._prefixes = c), (this._parent = u);
      }
      toName(c) {
        return c instanceof t.Name ? c : this.name(c);
      }
      name(c) {
        return new t.Name(this._newName(c));
      }
      _newName(c) {
        const u = this._names[c] || this._nameGroup(c);
        return `${c}${u.index++}`;
      }
      _nameGroup(c) {
        var u, f;
        if (
          (!(
            (f =
              (u = this._parent) === null || u === void 0
                ? void 0
                : u._prefixes) === null || f === void 0
          ) &&
            f.has(c)) ||
          (this._prefixes && !this._prefixes.has(c))
        )
          throw new Error(
            `CodeGen: prefix "${c}" is not allowed in this scope`
          );
        return (this._names[c] = { prefix: c, index: 0 });
      }
    }
    e.Scope = o;
    class i extends t.Name {
      constructor(c, u) {
        super(u), (this.prefix = c);
      }
      setValue(c, { property: u, itemIndex: f }) {
        (this.value = c), (this.scopePath = (0, t._)`.${new t.Name(u)}[${f}]`);
      }
    }
    e.ValueScopeName = i;
    const s = (0, t._)`\n`;
    class a extends o {
      constructor(c) {
        super(c),
          (this._values = {}),
          (this._scope = c.scope),
          (this.opts = { ...c, _n: c.lines ? s : t.nil });
      }
      get() {
        return this._scope;
      }
      name(c) {
        return new i(c, this._newName(c));
      }
      value(c, u) {
        var f;
        if (u.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const d = this.toName(c),
          { prefix: p } = d,
          h = (f = u.key) !== null && f !== void 0 ? f : u.ref;
        let m = this._values[p];
        if (m) {
          const _ = m.get(h);
          if (_) return _;
        } else m = this._values[p] = /* @__PURE__ */ new Map();
        m.set(h, d);
        const v = this._scope[p] || (this._scope[p] = []),
          g = v.length;
        return (v[g] = u.ref), d.setValue(u, { property: p, itemIndex: g }), d;
      }
      getValue(c, u) {
        const f = this._values[c];
        if (f) return f.get(u);
      }
      scopeRefs(c, u = this._values) {
        return this._reduceValues(u, f => {
          if (f.scopePath === void 0)
            throw new Error(`CodeGen: name "${f}" has no value`);
          return (0, t._)`${c}${f.scopePath}`;
        });
      }
      scopeCode(c = this._values, u, f) {
        return this._reduceValues(
          c,
          d => {
            if (d.value === void 0)
              throw new Error(`CodeGen: name "${d}" has no value`);
            return d.value.code;
          },
          u,
          f
        );
      }
      _reduceValues(c, u, f = {}, d) {
        let p = t.nil;
        for (const h in c) {
          const m = c[h];
          if (!m) continue;
          const v = (f[h] = f[h] || /* @__PURE__ */ new Map());
          m.forEach(g => {
            if (v.has(g)) return;
            v.set(g, n.Started);
            let _ = u(g);
            if (_) {
              const E = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
              p = (0, t._)`${p}${E} ${g} = ${_};${this.opts._n}`;
            } else if ((_ = d == null ? void 0 : d(g)))
              p = (0, t._)`${p}${_}${this.opts._n}`;
            else throw new r(g);
            v.set(g, n.Completed);
          });
        }
        return p;
      }
    }
    e.ValueScope = a;
  })(dc);
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.or =
        e.and =
        e.not =
        e.CodeGen =
        e.operators =
        e.varKinds =
        e.ValueScopeName =
        e.ValueScope =
        e.Scope =
        e.Name =
        e.regexpCode =
        e.stringify =
        e.getProperty =
        e.nil =
        e.strConcat =
        e.str =
        e._ =
          void 0);
    const t = Eo,
      r = dc;
    var n = Eo;
    Object.defineProperty(e, "_", {
      enumerable: !0,
      get: function () {
        return n._;
      },
    }),
      Object.defineProperty(e, "str", {
        enumerable: !0,
        get: function () {
          return n.str;
        },
      }),
      Object.defineProperty(e, "strConcat", {
        enumerable: !0,
        get: function () {
          return n.strConcat;
        },
      }),
      Object.defineProperty(e, "nil", {
        enumerable: !0,
        get: function () {
          return n.nil;
        },
      }),
      Object.defineProperty(e, "getProperty", {
        enumerable: !0,
        get: function () {
          return n.getProperty;
        },
      }),
      Object.defineProperty(e, "stringify", {
        enumerable: !0,
        get: function () {
          return n.stringify;
        },
      }),
      Object.defineProperty(e, "regexpCode", {
        enumerable: !0,
        get: function () {
          return n.regexpCode;
        },
      }),
      Object.defineProperty(e, "Name", {
        enumerable: !0,
        get: function () {
          return n.Name;
        },
      });
    var o = dc;
    Object.defineProperty(e, "Scope", {
      enumerable: !0,
      get: function () {
        return o.Scope;
      },
    }),
      Object.defineProperty(e, "ValueScope", {
        enumerable: !0,
        get: function () {
          return o.ValueScope;
        },
      }),
      Object.defineProperty(e, "ValueScopeName", {
        enumerable: !0,
        get: function () {
          return o.ValueScopeName;
        },
      }),
      Object.defineProperty(e, "varKinds", {
        enumerable: !0,
        get: function () {
          return o.varKinds;
        },
      }),
      (e.operators = {
        GT: new t._Code(">"),
        GTE: new t._Code(">="),
        LT: new t._Code("<"),
        LTE: new t._Code("<="),
        EQ: new t._Code("==="),
        NEQ: new t._Code("!=="),
        NOT: new t._Code("!"),
        OR: new t._Code("||"),
        AND: new t._Code("&&"),
        ADD: new t._Code("+"),
      });
    class i {
      optimizeNodes() {
        return this;
      }
      optimizeNames(y, $) {
        return this;
      }
    }
    class s extends i {
      constructor(y, $, N) {
        super(), (this.varKind = y), (this.name = $), (this.rhs = N);
      }
      render({ es5: y, _n: $ }) {
        const N = y ? r.varKinds.var : this.varKind,
          M = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${N} ${this.name}${M};` + $;
      }
      optimizeNames(y, $) {
        if (y[this.name.str])
          return this.rhs && (this.rhs = ce(this.rhs, y, $)), this;
      }
      get names() {
        return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
      }
    }
    class a extends i {
      constructor(y, $, N) {
        super(), (this.lhs = y), (this.rhs = $), (this.sideEffects = N);
      }
      render({ _n: y }) {
        return `${this.lhs} = ${this.rhs};` + y;
      }
      optimizeNames(y, $) {
        if (
          !(this.lhs instanceof t.Name && !y[this.lhs.str] && !this.sideEffects)
        )
          return (this.rhs = ce(this.rhs, y, $)), this;
      }
      get names() {
        const y = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
        return Se(y, this.rhs);
      }
    }
    class l extends a {
      constructor(y, $, N, M) {
        super(y, N, M), (this.op = $);
      }
      render({ _n: y }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + y;
      }
    }
    class c extends i {
      constructor(y) {
        super(), (this.label = y), (this.names = {});
      }
      render({ _n: y }) {
        return `${this.label}:` + y;
      }
    }
    class u extends i {
      constructor(y) {
        super(), (this.label = y), (this.names = {});
      }
      render({ _n: y }) {
        return `break${this.label ? ` ${this.label}` : ""};` + y;
      }
    }
    class f extends i {
      constructor(y) {
        super(), (this.error = y);
      }
      render({ _n: y }) {
        return `throw ${this.error};` + y;
      }
      get names() {
        return this.error.names;
      }
    }
    class d extends i {
      constructor(y) {
        super(), (this.code = y);
      }
      render({ _n: y }) {
        return `${this.code};` + y;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(y, $) {
        return (this.code = ce(this.code, y, $)), this;
      }
      get names() {
        return this.code instanceof t._CodeOrName ? this.code.names : {};
      }
    }
    class p extends i {
      constructor(y = []) {
        super(), (this.nodes = y);
      }
      render(y) {
        return this.nodes.reduce(($, N) => $ + N.render(y), "");
      }
      optimizeNodes() {
        const { nodes: y } = this;
        let $ = y.length;
        for (; $--; ) {
          const N = y[$].optimizeNodes();
          Array.isArray(N)
            ? y.splice($, 1, ...N)
            : N
              ? (y[$] = N)
              : y.splice($, 1);
        }
        return y.length > 0 ? this : void 0;
      }
      optimizeNames(y, $) {
        const { nodes: N } = this;
        let M = N.length;
        for (; M--; ) {
          const F = N[M];
          F.optimizeNames(y, $) || (Pe(y, F.names), N.splice(M, 1));
        }
        return N.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((y, $) => G(y, $.names), {});
      }
    }
    class h extends p {
      render(y) {
        return "{" + y._n + super.render(y) + "}" + y._n;
      }
    }
    class m extends p {}
    class v extends h {}
    v.kind = "else";
    class g extends h {
      constructor(y, $) {
        super($), (this.condition = y);
      }
      render(y) {
        let $ = `if(${this.condition})` + super.render(y);
        return this.else && ($ += "else " + this.else.render(y)), $;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const y = this.condition;
        if (y === !0) return this.nodes;
        let $ = this.else;
        if ($) {
          const N = $.optimizeNodes();
          $ = this.else = Array.isArray(N) ? new v(N) : N;
        }
        if ($)
          return y === !1
            ? $ instanceof g
              ? $
              : $.nodes
            : this.nodes.length
              ? this
              : new g(_e(y), $ instanceof g ? [$] : $.nodes);
        if (!(y === !1 || !this.nodes.length)) return this;
      }
      optimizeNames(y, $) {
        var N;
        if (
          ((this.else =
            (N = this.else) === null || N === void 0
              ? void 0
              : N.optimizeNames(y, $)),
          !!(super.optimizeNames(y, $) || this.else))
        )
          return (this.condition = ce(this.condition, y, $)), this;
      }
      get names() {
        const y = super.names;
        return Se(y, this.condition), this.else && G(y, this.else.names), y;
      }
    }
    g.kind = "if";
    class _ extends h {}
    _.kind = "for";
    class E extends _ {
      constructor(y) {
        super(), (this.iteration = y);
      }
      render(y) {
        return `for(${this.iteration})` + super.render(y);
      }
      optimizeNames(y, $) {
        if (super.optimizeNames(y, $))
          return (this.iteration = ce(this.iteration, y, $)), this;
      }
      get names() {
        return G(super.names, this.iteration.names);
      }
    }
    class A extends _ {
      constructor(y, $, N, M) {
        super(),
          (this.varKind = y),
          (this.name = $),
          (this.from = N),
          (this.to = M);
      }
      render(y) {
        const $ = y.es5 ? r.varKinds.var : this.varKind,
          { name: N, from: M, to: F } = this;
        return `for(${$} ${N}=${M}; ${N}<${F}; ${N}++)` + super.render(y);
      }
      get names() {
        const y = Se(super.names, this.from);
        return Se(y, this.to);
      }
    }
    class D extends _ {
      constructor(y, $, N, M) {
        super(),
          (this.loop = y),
          (this.varKind = $),
          (this.name = N),
          (this.iterable = M);
      }
      render(y) {
        return (
          `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` +
          super.render(y)
        );
      }
      optimizeNames(y, $) {
        if (super.optimizeNames(y, $))
          return (this.iterable = ce(this.iterable, y, $)), this;
      }
      get names() {
        return G(super.names, this.iterable.names);
      }
    }
    class S extends h {
      constructor(y, $, N) {
        super(), (this.name = y), (this.args = $), (this.async = N);
      }
      render(y) {
        return (
          `${this.async ? "async " : ""}function ${this.name}(${this.args})` +
          super.render(y)
        );
      }
    }
    S.kind = "func";
    class O extends p {
      render(y) {
        return "return " + super.render(y);
      }
    }
    O.kind = "return";
    class j extends h {
      render(y) {
        let $ = "try" + super.render(y);
        return (
          this.catch && ($ += this.catch.render(y)),
          this.finally && ($ += this.finally.render(y)),
          $
        );
      }
      optimizeNodes() {
        var y, $;
        return (
          super.optimizeNodes(),
          (y = this.catch) === null || y === void 0 || y.optimizeNodes(),
          ($ = this.finally) === null || $ === void 0 || $.optimizeNodes(),
          this
        );
      }
      optimizeNames(y, $) {
        var N, M;
        return (
          super.optimizeNames(y, $),
          (N = this.catch) === null || N === void 0 || N.optimizeNames(y, $),
          (M = this.finally) === null || M === void 0 || M.optimizeNames(y, $),
          this
        );
      }
      get names() {
        const y = super.names;
        return (
          this.catch && G(y, this.catch.names),
          this.finally && G(y, this.finally.names),
          y
        );
      }
    }
    class B extends h {
      constructor(y) {
        super(), (this.error = y);
      }
      render(y) {
        return `catch(${this.error})` + super.render(y);
      }
    }
    B.kind = "catch";
    class W extends h {
      render(y) {
        return "finally" + super.render(y);
      }
    }
    W.kind = "finally";
    class re {
      constructor(y, $ = {}) {
        (this._values = {}),
          (this._blockStarts = []),
          (this._constants = {}),
          (this.opts = {
            ...$,
            _n: $.lines
              ? `
`
              : "",
          }),
          (this._extScope = y),
          (this._scope = new r.Scope({ parent: y })),
          (this._nodes = [new m()]);
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(y) {
        return this._scope.name(y);
      }
      // reserves unique name in the external scope
      scopeName(y) {
        return this._extScope.name(y);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(y, $) {
        const N = this._extScope.value(y, $);
        return (
          (
            this._values[N.prefix] ||
            (this._values[N.prefix] = /* @__PURE__ */ new Set())
          ).add(N),
          N
        );
      }
      getScopeValue(y, $) {
        return this._extScope.getValue(y, $);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(y) {
        return this._extScope.scopeRefs(y, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(y, $, N, M) {
        const F = this._scope.toName($);
        return (
          N !== void 0 && M && (this._constants[F.str] = N),
          this._leafNode(new s(y, F, N)),
          F
        );
      }
      // `const` declaration (`var` in es5 mode)
      const(y, $, N) {
        return this._def(r.varKinds.const, y, $, N);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(y, $, N) {
        return this._def(r.varKinds.let, y, $, N);
      }
      // `var` declaration with optional assignment
      var(y, $, N) {
        return this._def(r.varKinds.var, y, $, N);
      }
      // assignment code
      assign(y, $, N) {
        return this._leafNode(new a(y, $, N));
      }
      // `+=` code
      add(y, $) {
        return this._leafNode(new l(y, e.operators.ADD, $));
      }
      // appends passed SafeExpr to code or executes Block
      code(y) {
        return (
          typeof y == "function"
            ? y()
            : y !== t.nil && this._leafNode(new d(y)),
          this
        );
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...y) {
        const $ = ["{"];
        for (const [N, M] of y)
          $.length > 1 && $.push(","),
            $.push(N),
            (N !== M || this.opts.es5) &&
              ($.push(":"), (0, t.addCodeArg)($, M));
        return $.push("}"), new t._Code($);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(y, $, N) {
        if ((this._blockNode(new g(y)), $ && N))
          this.code($).else().code(N).endIf();
        else if ($) this.code($).endIf();
        else if (N) throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(y) {
        return this._elseNode(new g(y));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new v());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(g, v);
      }
      _for(y, $) {
        return this._blockNode(y), $ && this.code($).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(y, $) {
        return this._for(new E(y), $);
      }
      // `for` statement for a range of values
      forRange(
        y,
        $,
        N,
        M,
        F = this.opts.es5 ? r.varKinds.var : r.varKinds.let
      ) {
        const q = this._scope.toName(y);
        return this._for(new A(F, q, $, N), () => M(q));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(y, $, N, M = r.varKinds.const) {
        const F = this._scope.toName(y);
        if (this.opts.es5) {
          const q = $ instanceof t.Name ? $ : this.var("_arr", $);
          return this.forRange("_i", 0, (0, t._)`${q}.length`, ne => {
            this.var(F, (0, t._)`${q}[${ne}]`), N(F);
          });
        }
        return this._for(new D("of", M, F, $), () => N(F));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(y, $, N, M = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(y, (0, t._)`Object.keys(${$})`, N);
        const F = this._scope.toName(y);
        return this._for(new D("in", M, F, $), () => N(F));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(_);
      }
      // `label` statement
      label(y) {
        return this._leafNode(new c(y));
      }
      // `break` statement
      break(y) {
        return this._leafNode(new u(y));
      }
      // `return` statement
      return(y) {
        const $ = new O();
        if ((this._blockNode($), this.code(y), $.nodes.length !== 1))
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(O);
      }
      // `try` statement
      try(y, $, N) {
        if (!$ && !N)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const M = new j();
        if ((this._blockNode(M), this.code(y), $)) {
          const F = this.name("e");
          (this._currNode = M.catch = new B(F)), $(F);
        }
        return (
          N && ((this._currNode = M.finally = new W()), this.code(N)),
          this._endBlockNode(B, W)
        );
      }
      // `throw` statement
      throw(y) {
        return this._leafNode(new f(y));
      }
      // start self-balancing block
      block(y, $) {
        return (
          this._blockStarts.push(this._nodes.length),
          y && this.code(y).endBlock($),
          this
        );
      }
      // end the current self-balancing block
      endBlock(y) {
        const $ = this._blockStarts.pop();
        if ($ === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const N = this._nodes.length - $;
        if (N < 0 || (y !== void 0 && N !== y))
          throw new Error(
            `CodeGen: wrong number of nodes: ${N} vs ${y} expected`
          );
        return (this._nodes.length = $), this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(y, $ = t.nil, N, M) {
        return (
          this._blockNode(new S(y, $, N)), M && this.code(M).endFunc(), this
        );
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(S);
      }
      optimize(y = 1) {
        for (; y-- > 0; )
          this._root.optimizeNodes(),
            this._root.optimizeNames(this._root.names, this._constants);
      }
      _leafNode(y) {
        return this._currNode.nodes.push(y), this;
      }
      _blockNode(y) {
        this._currNode.nodes.push(y), this._nodes.push(y);
      }
      _endBlockNode(y, $) {
        const N = this._currNode;
        if (N instanceof y || ($ && N instanceof $))
          return this._nodes.pop(), this;
        throw new Error(
          `CodeGen: not in block "${$ ? `${y.kind}/${$.kind}` : y.kind}"`
        );
      }
      _elseNode(y) {
        const $ = this._currNode;
        if (!($ instanceof g)) throw new Error('CodeGen: "else" without "if"');
        return (this._currNode = $.else = y), this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const y = this._nodes;
        return y[y.length - 1];
      }
      set _currNode(y) {
        const $ = this._nodes;
        $[$.length - 1] = y;
      }
    }
    e.CodeGen = re;
    function G(P, y) {
      for (const $ in y) P[$] = (P[$] || 0) + (y[$] || 0);
      return P;
    }
    function Se(P, y) {
      return y instanceof t._CodeOrName ? G(P, y.names) : P;
    }
    function ce(P, y, $) {
      if (P instanceof t.Name) return N(P);
      if (!M(P)) return P;
      return new t._Code(
        P._items.reduce(
          (F, q) => (
            q instanceof t.Name && (q = N(q)),
            q instanceof t._Code ? F.push(...q._items) : F.push(q),
            F
          ),
          []
        )
      );
      function N(F) {
        const q = $[F.str];
        return q === void 0 || y[F.str] !== 1 ? F : (delete y[F.str], q);
      }
      function M(F) {
        return (
          F instanceof t._Code &&
          F._items.some(
            q => q instanceof t.Name && y[q.str] === 1 && $[q.str] !== void 0
          )
        );
      }
    }
    function Pe(P, y) {
      for (const $ in y) P[$] = (P[$] || 0) - (y[$] || 0);
    }
    function _e(P) {
      return typeof P == "boolean" || typeof P == "number" || P === null
        ? !P
        : (0, t._)`!${R(P)}`;
    }
    e.not = _e;
    const ae = I(e.operators.AND);
    function me(...P) {
      return P.reduce(ae);
    }
    e.and = me;
    const ze = I(e.operators.OR);
    function Q(...P) {
      return P.reduce(ze);
    }
    e.or = Q;
    function I(P) {
      return (y, $) =>
        y === t.nil ? $ : $ === t.nil ? y : (0, t._)`${R(y)} ${P} ${R($)}`;
    }
    function R(P) {
      return P instanceof t.Name ? P : (0, t._)`(${P})`;
    }
  })(Ie);
  var Ve = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.checkStrictMode =
        e.getErrorPath =
        e.Type =
        e.useFunc =
        e.setEvaluated =
        e.evaluatedPropsToName =
        e.mergeEvaluated =
        e.eachItem =
        e.unescapeJsonPointer =
        e.escapeJsonPointer =
        e.escapeFragment =
        e.unescapeFragment =
        e.schemaRefOrVal =
        e.schemaHasRulesButRef =
        e.schemaHasRules =
        e.checkUnknownRules =
        e.alwaysValidSchema =
        e.toHash =
          void 0);
    const t = Ie,
      r = Eo;
    function n(S) {
      const O = {};
      for (const j of S) O[j] = !0;
      return O;
    }
    e.toHash = n;
    function o(S, O) {
      return typeof O == "boolean"
        ? O
        : Object.keys(O).length === 0
          ? !0
          : (i(S, O), !s(O, S.self.RULES.all));
    }
    e.alwaysValidSchema = o;
    function i(S, O = S.schema) {
      const { opts: j, self: B } = S;
      if (!j.strictSchema || typeof O == "boolean") return;
      const W = B.RULES.keywords;
      for (const re in O) W[re] || D(S, `unknown keyword: "${re}"`);
    }
    e.checkUnknownRules = i;
    function s(S, O) {
      if (typeof S == "boolean") return !S;
      for (const j in S) if (O[j]) return !0;
      return !1;
    }
    e.schemaHasRules = s;
    function a(S, O) {
      if (typeof S == "boolean") return !S;
      for (const j in S) if (j !== "$ref" && O.all[j]) return !0;
      return !1;
    }
    e.schemaHasRulesButRef = a;
    function l({ topSchemaRef: S, schemaPath: O }, j, B, W) {
      if (!W) {
        if (typeof j == "number" || typeof j == "boolean") return j;
        if (typeof j == "string") return (0, t._)`${j}`;
      }
      return (0, t._)`${S}${O}${(0, t.getProperty)(B)}`;
    }
    e.schemaRefOrVal = l;
    function c(S) {
      return d(decodeURIComponent(S));
    }
    e.unescapeFragment = c;
    function u(S) {
      return encodeURIComponent(f(S));
    }
    e.escapeFragment = u;
    function f(S) {
      return typeof S == "number"
        ? `${S}`
        : S.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    e.escapeJsonPointer = f;
    function d(S) {
      return S.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    e.unescapeJsonPointer = d;
    function p(S, O) {
      if (Array.isArray(S)) for (const j of S) O(j);
      else O(S);
    }
    e.eachItem = p;
    function h({
      mergeNames: S,
      mergeToName: O,
      mergeValues: j,
      resultToName: B,
    }) {
      return (W, re, G, Se) => {
        const ce =
          G === void 0
            ? re
            : G instanceof t.Name
              ? (re instanceof t.Name ? S(W, re, G) : O(W, re, G), G)
              : re instanceof t.Name
                ? (O(W, G, re), re)
                : j(re, G);
        return Se === t.Name && !(ce instanceof t.Name) ? B(W, ce) : ce;
      };
    }
    e.mergeEvaluated = {
      props: h({
        mergeNames: (S, O, j) =>
          S.if((0, t._)`${j} !== true && ${O} !== undefined`, () => {
            S.if(
              (0, t._)`${O} === true`,
              () => S.assign(j, !0),
              () =>
                S.assign(j, (0, t._)`${j} || {}`).code(
                  (0, t._)`Object.assign(${j}, ${O})`
                )
            );
          }),
        mergeToName: (S, O, j) =>
          S.if((0, t._)`${j} !== true`, () => {
            O === !0
              ? S.assign(j, !0)
              : (S.assign(j, (0, t._)`${j} || {}`), v(S, j, O));
          }),
        mergeValues: (S, O) => (S === !0 ? !0 : { ...S, ...O }),
        resultToName: m,
      }),
      items: h({
        mergeNames: (S, O, j) =>
          S.if((0, t._)`${j} !== true && ${O} !== undefined`, () =>
            S.assign(
              j,
              (0, t._)`${O} === true ? true : ${j} > ${O} ? ${j} : ${O}`
            )
          ),
        mergeToName: (S, O, j) =>
          S.if((0, t._)`${j} !== true`, () =>
            S.assign(j, O === !0 ? !0 : (0, t._)`${j} > ${O} ? ${j} : ${O}`)
          ),
        mergeValues: (S, O) => (S === !0 ? !0 : Math.max(S, O)),
        resultToName: (S, O) => S.var("items", O),
      }),
    };
    function m(S, O) {
      if (O === !0) return S.var("props", !0);
      const j = S.var("props", (0, t._)`{}`);
      return O !== void 0 && v(S, j, O), j;
    }
    e.evaluatedPropsToName = m;
    function v(S, O, j) {
      Object.keys(j).forEach(B =>
        S.assign((0, t._)`${O}${(0, t.getProperty)(B)}`, !0)
      );
    }
    e.setEvaluated = v;
    const g = {};
    function _(S, O) {
      return S.scopeValue("func", {
        ref: O,
        code: g[O.code] || (g[O.code] = new r._Code(O.code)),
      });
    }
    e.useFunc = _;
    var E;
    (function (S) {
      (S[(S.Num = 0)] = "Num"), (S[(S.Str = 1)] = "Str");
    })((E = e.Type || (e.Type = {})));
    function A(S, O, j) {
      if (S instanceof t.Name) {
        const B = O === E.Num;
        return j
          ? B
            ? (0, t._)`"[" + ${S} + "]"`
            : (0, t._)`"['" + ${S} + "']"`
          : B
            ? (0, t._)`"/" + ${S}`
            : (0, t._)`"/" + ${S}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
      }
      return j ? (0, t.getProperty)(S).toString() : "/" + f(S);
    }
    e.getErrorPath = A;
    function D(S, O, j = S.opts.strictSchema) {
      if (j) {
        if (((O = `strict mode: ${O}`), j === !0)) throw new Error(O);
        S.self.logger.warn(O);
      }
    }
    e.checkStrictMode = D;
  })(Ve);
  var lr = {};
  Object.defineProperty(lr, "__esModule", { value: !0 });
  const wt = Ie,
    S4 = {
      // validation function arguments
      data: new wt.Name("data"),
      // args passed from referencing schema
      valCxt: new wt.Name("valCxt"),
      instancePath: new wt.Name("instancePath"),
      parentData: new wt.Name("parentData"),
      parentDataProperty: new wt.Name("parentDataProperty"),
      rootData: new wt.Name("rootData"),
      dynamicAnchors: new wt.Name("dynamicAnchors"),
      // function scoped variables
      vErrors: new wt.Name("vErrors"),
      errors: new wt.Name("errors"),
      this: new wt.Name("this"),
      // "globals"
      self: new wt.Name("self"),
      scope: new wt.Name("scope"),
      // JTD serialize/parse name for JSON string and position
      json: new wt.Name("json"),
      jsonPos: new wt.Name("jsonPos"),
      jsonLen: new wt.Name("jsonLen"),
      jsonPart: new wt.Name("jsonPart"),
    };
  lr.default = S4;
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.extendErrors =
        e.resetErrorsCount =
        e.reportExtraError =
        e.reportError =
        e.keyword$DataError =
        e.keywordError =
          void 0);
    const t = Ie,
      r = Ve,
      n = lr;
    (e.keywordError = {
      message: ({ keyword: v }) =>
        (0, t.str)`must pass "${v}" keyword validation`,
    }),
      (e.keyword$DataError = {
        message: ({ keyword: v, schemaType: g }) =>
          g
            ? (0, t.str)`"${v}" keyword must be ${g} ($data)`
            : (0, t.str)`"${v}" keyword is invalid ($data)`,
      });
    function o(v, g = e.keywordError, _, E) {
      const { it: A } = v,
        { gen: D, compositeRule: S, allErrors: O } = A,
        j = f(v, g, _);
      E ?? (S || O) ? l(D, j) : c(A, (0, t._)`[${j}]`);
    }
    e.reportError = o;
    function i(v, g = e.keywordError, _) {
      const { it: E } = v,
        { gen: A, compositeRule: D, allErrors: S } = E,
        O = f(v, g, _);
      l(A, O), D || S || c(E, n.default.vErrors);
    }
    e.reportExtraError = i;
    function s(v, g) {
      v.assign(n.default.errors, g),
        v.if((0, t._)`${n.default.vErrors} !== null`, () =>
          v.if(
            g,
            () => v.assign((0, t._)`${n.default.vErrors}.length`, g),
            () => v.assign(n.default.vErrors, null)
          )
        );
    }
    e.resetErrorsCount = s;
    function a({
      gen: v,
      keyword: g,
      schemaValue: _,
      data: E,
      errsCount: A,
      it: D,
    }) {
      if (A === void 0) throw new Error("ajv implementation error");
      const S = v.name("err");
      v.forRange("i", A, n.default.errors, O => {
        v.const(S, (0, t._)`${n.default.vErrors}[${O}]`),
          v.if((0, t._)`${S}.instancePath === undefined`, () =>
            v.assign(
              (0, t._)`${S}.instancePath`,
              (0, t.strConcat)(n.default.instancePath, D.errorPath)
            )
          ),
          v.assign(
            (0, t._)`${S}.schemaPath`,
            (0, t.str)`${D.errSchemaPath}/${g}`
          ),
          D.opts.verbose &&
            (v.assign((0, t._)`${S}.schema`, _),
            v.assign((0, t._)`${S}.data`, E));
      });
    }
    e.extendErrors = a;
    function l(v, g) {
      const _ = v.const("err", g);
      v.if(
        (0, t._)`${n.default.vErrors} === null`,
        () => v.assign(n.default.vErrors, (0, t._)`[${_}]`),
        (0, t._)`${n.default.vErrors}.push(${_})`
      ),
        v.code((0, t._)`${n.default.errors}++`);
    }
    function c(v, g) {
      const { gen: _, validateName: E, schemaEnv: A } = v;
      A.$async
        ? _.throw((0, t._)`new ${v.ValidationError}(${g})`)
        : (_.assign((0, t._)`${E}.errors`, g), _.return(!1));
    }
    const u = {
      keyword: new t.Name("keyword"),
      schemaPath: new t.Name("schemaPath"),
      params: new t.Name("params"),
      propertyName: new t.Name("propertyName"),
      message: new t.Name("message"),
      schema: new t.Name("schema"),
      parentSchema: new t.Name("parentSchema"),
    };
    function f(v, g, _) {
      const { createErrors: E } = v.it;
      return E === !1 ? (0, t._)`{}` : d(v, g, _);
    }
    function d(v, g, _ = {}) {
      const { gen: E, it: A } = v,
        D = [p(A, _), h(v, _)];
      return m(v, g, D), E.object(...D);
    }
    function p({ errorPath: v }, { instancePath: g }) {
      const _ = g ? (0, t.str)`${v}${(0, r.getErrorPath)(g, r.Type.Str)}` : v;
      return [
        n.default.instancePath,
        (0, t.strConcat)(n.default.instancePath, _),
      ];
    }
    function h(
      { keyword: v, it: { errSchemaPath: g } },
      { schemaPath: _, parentSchema: E }
    ) {
      let A = E ? g : (0, t.str)`${g}/${v}`;
      return (
        _ && (A = (0, t.str)`${A}${(0, r.getErrorPath)(_, r.Type.Str)}`),
        [u.schemaPath, A]
      );
    }
    function m(v, { params: g, message: _ }, E) {
      const { keyword: A, data: D, schemaValue: S, it: O } = v,
        { opts: j, propertyName: B, topSchemaRef: W, schemaPath: re } = O;
      E.push(
        [u.keyword, A],
        [u.params, typeof g == "function" ? g(v) : g || (0, t._)`{}`]
      ),
        j.messages && E.push([u.message, typeof _ == "function" ? _(v) : _]),
        j.verbose &&
          E.push(
            [u.schema, S],
            [u.parentSchema, (0, t._)`${W}${re}`],
            [n.default.data, D]
          ),
        B && E.push([u.propertyName, B]);
    }
  })(Lo);
  Object.defineProperty(wo, "__esModule", { value: !0 });
  wo.boolOrEmptySchema = wo.topBoolOrEmptySchema = void 0;
  const N4 = Lo,
    P4 = Ie,
    C4 = lr,
    T4 = {
      message: "boolean schema is false",
    };
  function x4(e) {
    const { gen: t, schema: r, validateName: n } = e;
    r === !1
      ? hy(e, !1)
      : typeof r == "object" && r.$async === !0
        ? t.return(C4.default.data)
        : (t.assign((0, P4._)`${n}.errors`, null), t.return(!0));
  }
  wo.topBoolOrEmptySchema = x4;
  function D4(e, t) {
    const { gen: r, schema: n } = e;
    n === !1 ? (r.var(t, !1), hy(e)) : r.var(t, !0);
  }
  wo.boolOrEmptySchema = D4;
  function hy(e, t) {
    const { gen: r, data: n } = e,
      o = {
        gen: r,
        keyword: "false schema",
        data: n,
        schema: !1,
        schemaCode: !1,
        schemaValue: !1,
        params: {},
        it: e,
      };
    (0, N4.reportError)(o, T4, void 0, t);
  }
  var Ji = {},
    Hn = {};
  Object.defineProperty(Hn, "__esModule", { value: !0 });
  Hn.getRules = Hn.isJSONType = void 0;
  const I4 = [
      "string",
      "number",
      "integer",
      "boolean",
      "null",
      "object",
      "array",
    ],
    R4 = new Set(I4);
  function M4(e) {
    return typeof e == "string" && R4.has(e);
  }
  Hn.isJSONType = M4;
  function j4() {
    const e = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] },
    };
    return {
      types: { ...e, integer: !0, boolean: !0, null: !0 },
      rules: [{ rules: [] }, e.number, e.string, e.array, e.object],
      post: { rules: [] },
      all: {},
      keywords: {},
    };
  }
  Hn.getRules = j4;
  var Rr = {};
  Object.defineProperty(Rr, "__esModule", { value: !0 });
  Rr.shouldUseRule = Rr.shouldUseGroup = Rr.schemaHasRulesForType = void 0;
  function F4({ schema: e, self: t }, r) {
    const n = t.RULES.types[r];
    return n && n !== !0 && gy(e, n);
  }
  Rr.schemaHasRulesForType = F4;
  function gy(e, t) {
    return t.rules.some(r => my(e, r));
  }
  Rr.shouldUseGroup = gy;
  function my(e, t) {
    var r;
    return (
      e[t.keyword] !== void 0 ||
      ((r = t.definition.implements) === null || r === void 0
        ? void 0
        : r.some(n => e[n] !== void 0))
    );
  }
  Rr.shouldUseRule = my;
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.reportTypeError =
        e.checkDataTypes =
        e.checkDataType =
        e.coerceAndCheckDataType =
        e.getJSONTypes =
        e.getSchemaTypes =
        e.DataType =
          void 0);
    const t = Hn,
      r = Rr,
      n = Lo,
      o = Ie,
      i = Ve;
    var s;
    (function (E) {
      (E[(E.Correct = 0)] = "Correct"), (E[(E.Wrong = 1)] = "Wrong");
    })((s = e.DataType || (e.DataType = {})));
    function a(E) {
      const A = l(E.type);
      if (A.includes("null")) {
        if (E.nullable === !1)
          throw new Error("type: null contradicts nullable: false");
      } else {
        if (!A.length && E.nullable !== void 0)
          throw new Error('"nullable" cannot be used without "type"');
        E.nullable === !0 && A.push("null");
      }
      return A;
    }
    e.getSchemaTypes = a;
    function l(E) {
      const A = Array.isArray(E) ? E : E ? [E] : [];
      if (A.every(t.isJSONType)) return A;
      throw new Error("type must be JSONType or JSONType[]: " + A.join(","));
    }
    e.getJSONTypes = l;
    function c(E, A) {
      const { gen: D, data: S, opts: O } = E,
        j = f(A, O.coerceTypes),
        B =
          A.length > 0 &&
          !(
            j.length === 0 &&
            A.length === 1 &&
            (0, r.schemaHasRulesForType)(E, A[0])
          );
      if (B) {
        const W = m(A, S, O.strictNumbers, s.Wrong);
        D.if(W, () => {
          j.length ? d(E, A, j) : g(E);
        });
      }
      return B;
    }
    e.coerceAndCheckDataType = c;
    const u = /* @__PURE__ */ new Set([
      "string",
      "number",
      "integer",
      "boolean",
      "null",
    ]);
    function f(E, A) {
      return A
        ? E.filter(D => u.has(D) || (A === "array" && D === "array"))
        : [];
    }
    function d(E, A, D) {
      const { gen: S, data: O, opts: j } = E,
        B = S.let("dataType", (0, o._)`typeof ${O}`),
        W = S.let("coerced", (0, o._)`undefined`);
      j.coerceTypes === "array" &&
        S.if(
          (0, o._)`${B} == 'object' && Array.isArray(${O}) && ${O}.length == 1`,
          () =>
            S.assign(O, (0, o._)`${O}[0]`)
              .assign(B, (0, o._)`typeof ${O}`)
              .if(m(A, O, j.strictNumbers), () => S.assign(W, O))
        ),
        S.if((0, o._)`${W} !== undefined`);
      for (const G of D)
        (u.has(G) || (G === "array" && j.coerceTypes === "array")) && re(G);
      S.else(),
        g(E),
        S.endIf(),
        S.if((0, o._)`${W} !== undefined`, () => {
          S.assign(O, W), p(E, W);
        });
      function re(G) {
        switch (G) {
          case "string":
            S.elseIf((0, o._)`${B} == "number" || ${B} == "boolean"`)
              .assign(W, (0, o._)`"" + ${O}`)
              .elseIf((0, o._)`${O} === null`)
              .assign(W, (0, o._)`""`);
            return;
          case "number":
            S.elseIf(
              (0, o._)`${B} == "boolean" || ${O} === null
              || (${B} == "string" && ${O} && ${O} == +${O})`
            ).assign(W, (0, o._)`+${O}`);
            return;
          case "integer":
            S.elseIf(
              (0, o._)`${B} === "boolean" || ${O} === null
              || (${B} === "string" && ${O} && ${O} == +${O} && !(${O} % 1))`
            ).assign(W, (0, o._)`+${O}`);
            return;
          case "boolean":
            S.elseIf((0, o._)`${O} === "false" || ${O} === 0 || ${O} === null`)
              .assign(W, !1)
              .elseIf((0, o._)`${O} === "true" || ${O} === 1`)
              .assign(W, !0);
            return;
          case "null":
            S.elseIf((0, o._)`${O} === "" || ${O} === 0 || ${O} === false`),
              S.assign(W, null);
            return;
          case "array":
            S.elseIf(
              (0, o._)`${B} === "string" || ${B} === "number"
              || ${B} === "boolean" || ${O} === null`
            ).assign(W, (0, o._)`[${O}]`);
        }
      }
    }
    function p({ gen: E, parentData: A, parentDataProperty: D }, S) {
      E.if((0, o._)`${A} !== undefined`, () =>
        E.assign((0, o._)`${A}[${D}]`, S)
      );
    }
    function h(E, A, D, S = s.Correct) {
      const O = S === s.Correct ? o.operators.EQ : o.operators.NEQ;
      let j;
      switch (E) {
        case "null":
          return (0, o._)`${A} ${O} null`;
        case "array":
          j = (0, o._)`Array.isArray(${A})`;
          break;
        case "object":
          j = (0, o._)`${A} && typeof ${A} == "object" && !Array.isArray(${A})`;
          break;
        case "integer":
          j = B((0, o._)`!(${A} % 1) && !isNaN(${A})`);
          break;
        case "number":
          j = B();
          break;
        default:
          return (0, o._)`typeof ${A} ${O} ${E}`;
      }
      return S === s.Correct ? j : (0, o.not)(j);
      function B(W = o.nil) {
        return (0, o.and)(
          (0, o._)`typeof ${A} == "number"`,
          W,
          D ? (0, o._)`isFinite(${A})` : o.nil
        );
      }
    }
    e.checkDataType = h;
    function m(E, A, D, S) {
      if (E.length === 1) return h(E[0], A, D, S);
      let O;
      const j = (0, i.toHash)(E);
      if (j.array && j.object) {
        const B = (0, o._)`typeof ${A} != "object"`;
        (O = j.null ? B : (0, o._)`!${A} || ${B}`),
          delete j.null,
          delete j.array,
          delete j.object;
      } else O = o.nil;
      j.number && delete j.integer;
      for (const B in j) O = (0, o.and)(O, h(B, A, D, S));
      return O;
    }
    e.checkDataTypes = m;
    const v = {
      message: ({ schema: E }) => `must be ${E}`,
      params: ({ schema: E, schemaValue: A }) =>
        typeof E == "string" ? (0, o._)`{type: ${E}}` : (0, o._)`{type: ${A}}`,
    };
    function g(E) {
      const A = _(E);
      (0, n.reportError)(A, v);
    }
    e.reportTypeError = g;
    function _(E) {
      const { gen: A, data: D, schema: S } = E,
        O = (0, i.schemaRefOrVal)(E, S, "type");
      return {
        gen: A,
        keyword: "type",
        data: D,
        schema: S.type,
        schemaCode: O,
        schemaValue: O,
        parentSchema: S,
        params: {},
        it: E,
      };
    }
  })(Ji);
  var Ga = {};
  Object.defineProperty(Ga, "__esModule", { value: !0 });
  Ga.assignDefaults = void 0;
  const lo = Ie,
    L4 = Ve;
  function V4(e, t) {
    const { properties: r, items: n } = e.schema;
    if (t === "object" && r) for (const o in r) Oh(e, o, r[o].default);
    else
      t === "array" &&
        Array.isArray(n) &&
        n.forEach((o, i) => Oh(e, i, o.default));
  }
  Ga.assignDefaults = V4;
  function Oh(e, t, r) {
    const { gen: n, compositeRule: o, data: i, opts: s } = e;
    if (r === void 0) return;
    const a = (0, lo._)`${i}${(0, lo.getProperty)(t)}`;
    if (o) {
      (0, L4.checkStrictMode)(e, `default is ignored for: ${a}`);
      return;
    }
    let l = (0, lo._)`${a} === undefined`;
    s.useDefaults === "empty" &&
      (l = (0, lo._)`${l} || ${a} === null || ${a} === ""`),
      n.if(l, (0, lo._)`${a} = ${(0, lo.stringify)(r)}`);
  }
  var vr = {},
    Re = {};
  Object.defineProperty(Re, "__esModule", { value: !0 });
  Re.validateUnion =
    Re.validateArray =
    Re.usePattern =
    Re.callValidateCode =
    Re.schemaProperties =
    Re.allSchemaProperties =
    Re.noPropertyInData =
    Re.propertyInData =
    Re.isOwnProperty =
    Re.hasPropFunc =
    Re.reportMissingProp =
    Re.checkMissingProp =
    Re.checkReportMissingProp =
      void 0;
  const et = Ie,
    ku = Ve,
    Zr = lr,
    k4 = Ve;
  function B4(e, t) {
    const { gen: r, data: n, it: o } = e;
    r.if(zu(r, n, t, o.opts.ownProperties), () => {
      e.setParams({ missingProperty: (0, et._)`${t}` }, !0), e.error();
    });
  }
  Re.checkReportMissingProp = B4;
  function z4({ gen: e, data: t, it: { opts: r } }, n, o) {
    return (0, et.or)(
      ...n.map(i =>
        (0, et.and)(zu(e, t, i, r.ownProperties), (0, et._)`${o} = ${i}`)
      )
    );
  }
  Re.checkMissingProp = z4;
  function U4(e, t) {
    e.setParams({ missingProperty: t }, !0), e.error();
  }
  Re.reportMissingProp = U4;
  function vy(e) {
    return e.scopeValue("func", {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref: Object.prototype.hasOwnProperty,
      code: (0, et._)`Object.prototype.hasOwnProperty`,
    });
  }
  Re.hasPropFunc = vy;
  function Bu(e, t, r) {
    return (0, et._)`${vy(e)}.call(${t}, ${r})`;
  }
  Re.isOwnProperty = Bu;
  function W4(e, t, r, n) {
    const o = (0, et._)`${t}${(0, et.getProperty)(r)} !== undefined`;
    return n ? (0, et._)`${o} && ${Bu(e, t, r)}` : o;
  }
  Re.propertyInData = W4;
  function zu(e, t, r, n) {
    const o = (0, et._)`${t}${(0, et.getProperty)(r)} === undefined`;
    return n ? (0, et.or)(o, (0, et.not)(Bu(e, t, r))) : o;
  }
  Re.noPropertyInData = zu;
  function yy(e) {
    return e ? Object.keys(e).filter(t => t !== "__proto__") : [];
  }
  Re.allSchemaProperties = yy;
  function H4(e, t) {
    return yy(t).filter(r => !(0, ku.alwaysValidSchema)(e, t[r]));
  }
  Re.schemaProperties = H4;
  function K4(
    {
      schemaCode: e,
      data: t,
      it: { gen: r, topSchemaRef: n, schemaPath: o, errorPath: i },
      it: s,
    },
    a,
    l,
    c
  ) {
    const u = c ? (0, et._)`${e}, ${t}, ${n}${o}` : t,
      f = [
        [
          Zr.default.instancePath,
          (0, et.strConcat)(Zr.default.instancePath, i),
        ],
        [Zr.default.parentData, s.parentData],
        [Zr.default.parentDataProperty, s.parentDataProperty],
        [Zr.default.rootData, Zr.default.rootData],
      ];
    s.opts.dynamicRef &&
      f.push([Zr.default.dynamicAnchors, Zr.default.dynamicAnchors]);
    const d = (0, et._)`${u}, ${r.object(...f)}`;
    return l !== et.nil
      ? (0, et._)`${a}.call(${l}, ${d})`
      : (0, et._)`${a}(${d})`;
  }
  Re.callValidateCode = K4;
  const G4 = (0, et._)`new RegExp`;
  function q4({ gen: e, it: { opts: t } }, r) {
    const n = t.unicodeRegExp ? "u" : "",
      { regExp: o } = t.code,
      i = o(r, n);
    return e.scopeValue("pattern", {
      key: i.toString(),
      ref: i,
      code: (0,
      et._)`${o.code === "new RegExp" ? G4 : (0, k4.useFunc)(e, o)}(${r}, ${n})`,
    });
  }
  Re.usePattern = q4;
  function Y4(e) {
    const { gen: t, data: r, keyword: n, it: o } = e,
      i = t.name("valid");
    if (o.allErrors) {
      const a = t.let("valid", !0);
      return s(() => t.assign(a, !1)), a;
    }
    return t.var(i, !0), s(() => t.break()), i;
    function s(a) {
      const l = t.const("len", (0, et._)`${r}.length`);
      t.forRange("i", 0, l, c => {
        e.subschema(
          {
            keyword: n,
            dataProp: c,
            dataPropType: ku.Type.Num,
          },
          i
        ),
          t.if((0, et.not)(i), a);
      });
    }
  }
  Re.validateArray = Y4;
  function J4(e) {
    const { gen: t, schema: r, keyword: n, it: o } = e;
    if (!Array.isArray(r)) throw new Error("ajv implementation error");
    if (r.some(l => (0, ku.alwaysValidSchema)(o, l)) && !o.opts.unevaluated)
      return;
    const s = t.let("valid", !1),
      a = t.name("_valid");
    t.block(() =>
      r.forEach((l, c) => {
        const u = e.subschema(
          {
            keyword: n,
            schemaProp: c,
            compositeRule: !0,
          },
          a
        );
        t.assign(s, (0, et._)`${s} || ${a}`),
          e.mergeValidEvaluated(u, a) || t.if((0, et.not)(s));
      })
    ),
      e.result(
        s,
        () => e.reset(),
        () => e.error(!0)
      );
  }
  Re.validateUnion = J4;
  Object.defineProperty(vr, "__esModule", { value: !0 });
  vr.validateKeywordUsage =
    vr.validSchemaType =
    vr.funcKeywordCode =
    vr.macroKeywordCode =
      void 0;
  const Pt = Ie,
    Sn = lr,
    X4 = Re,
    Z4 = Lo;
  function Q4(e, t) {
    const { gen: r, keyword: n, schema: o, parentSchema: i, it: s } = e,
      a = t.macro.call(s.self, o, i, s),
      l = _y(r, n, a);
    s.opts.validateSchema !== !1 && s.self.validateSchema(a, !0);
    const c = r.name("valid");
    e.subschema(
      {
        schema: a,
        schemaPath: Pt.nil,
        errSchemaPath: `${s.errSchemaPath}/${n}`,
        topSchemaRef: l,
        compositeRule: !0,
      },
      c
    ),
      e.pass(c, () => e.error(!0));
  }
  vr.macroKeywordCode = Q4;
  function eU(e, t) {
    var r;
    const {
      gen: n,
      keyword: o,
      schema: i,
      parentSchema: s,
      $data: a,
      it: l,
    } = e;
    rU(l, t);
    const c = !a && t.compile ? t.compile.call(l.self, i, s, l) : t.validate,
      u = _y(n, o, c),
      f = n.let("valid");
    e.block$data(f, d), e.ok((r = t.valid) !== null && r !== void 0 ? r : f);
    function d() {
      if (t.errors === !1) m(), t.modifying && Ah(e), v(() => e.error());
      else {
        const g = t.async ? p() : h();
        t.modifying && Ah(e), v(() => tU(e, g));
      }
    }
    function p() {
      const g = n.let("ruleErrs", null);
      return (
        n.try(
          () => m((0, Pt._)`await `),
          _ =>
            n.assign(f, !1).if(
              (0, Pt._)`${_} instanceof ${l.ValidationError}`,
              () => n.assign(g, (0, Pt._)`${_}.errors`),
              () => n.throw(_)
            )
        ),
        g
      );
    }
    function h() {
      const g = (0, Pt._)`${u}.errors`;
      return n.assign(g, null), m(Pt.nil), g;
    }
    function m(g = t.async ? (0, Pt._)`await ` : Pt.nil) {
      const _ = l.opts.passContext ? Sn.default.this : Sn.default.self,
        E = !(("compile" in t && !a) || t.schema === !1);
      n.assign(
        f,
        (0, Pt._)`${g}${(0, X4.callValidateCode)(e, u, _, E)}`,
        t.modifying
      );
    }
    function v(g) {
      var _;
      n.if((0, Pt.not)((_ = t.valid) !== null && _ !== void 0 ? _ : f), g);
    }
  }
  vr.funcKeywordCode = eU;
  function Ah(e) {
    const { gen: t, data: r, it: n } = e;
    t.if(n.parentData, () =>
      t.assign(r, (0, Pt._)`${n.parentData}[${n.parentDataProperty}]`)
    );
  }
  function tU(e, t) {
    const { gen: r } = e;
    r.if(
      (0, Pt._)`Array.isArray(${t})`,
      () => {
        r
          .assign(
            Sn.default.vErrors,
            (0,
            Pt._)`${Sn.default.vErrors} === null ? ${t} : ${Sn.default.vErrors}.concat(${t})`
          )
          .assign(Sn.default.errors, (0, Pt._)`${Sn.default.vErrors}.length`),
          (0, Z4.extendErrors)(e);
      },
      () => e.error()
    );
  }
  function rU({ schemaEnv: e }, t) {
    if (t.async && !e.$async) throw new Error("async keyword in sync schema");
  }
  function _y(e, t, r) {
    if (r === void 0) throw new Error(`keyword "${t}" failed to compile`);
    return e.scopeValue(
      "keyword",
      typeof r == "function"
        ? { ref: r }
        : { ref: r, code: (0, Pt.stringify)(r) }
    );
  }
  function nU(e, t, r = !1) {
    return (
      !t.length ||
      t.some(n =>
        n === "array"
          ? Array.isArray(e)
          : n === "object"
            ? e && typeof e == "object" && !Array.isArray(e)
            : typeof e == n || (r && typeof e > "u")
      )
    );
  }
  vr.validSchemaType = nU;
  function oU({ schema: e, opts: t, self: r, errSchemaPath: n }, o, i) {
    if (Array.isArray(o.keyword) ? !o.keyword.includes(i) : o.keyword !== i)
      throw new Error("ajv implementation error");
    const s = o.dependencies;
    if (s != null && s.some(a => !Object.prototype.hasOwnProperty.call(e, a)))
      throw new Error(
        `parent schema must have dependencies of ${i}: ${s.join(",")}`
      );
    if (o.validateSchema && !o.validateSchema(e[i])) {
      const l =
        `keyword "${i}" value is invalid at path "${n}": ` +
        r.errorsText(o.validateSchema.errors);
      if (t.validateSchema === "log") r.logger.error(l);
      else throw new Error(l);
    }
  }
  vr.validateKeywordUsage = oU;
  var cn = {};
  Object.defineProperty(cn, "__esModule", { value: !0 });
  cn.extendSubschemaMode = cn.extendSubschemaData = cn.getSubschema = void 0;
  const gr = Ie,
    $y = Ve;
  function iU(
    e,
    {
      keyword: t,
      schemaProp: r,
      schema: n,
      schemaPath: o,
      errSchemaPath: i,
      topSchemaRef: s,
    }
  ) {
    if (t !== void 0 && n !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (t !== void 0) {
      const a = e.schema[t];
      return r === void 0
        ? {
            schema: a,
            schemaPath: (0, gr._)`${e.schemaPath}${(0, gr.getProperty)(t)}`,
            errSchemaPath: `${e.errSchemaPath}/${t}`,
          }
        : {
            schema: a[r],
            schemaPath: (0,
            gr._)`${e.schemaPath}${(0, gr.getProperty)(t)}${(0, gr.getProperty)(r)}`,
            errSchemaPath: `${e.errSchemaPath}/${t}/${(0, $y.escapeFragment)(r)}`,
          };
    }
    if (n !== void 0) {
      if (o === void 0 || i === void 0 || s === void 0)
        throw new Error(
          '"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"'
        );
      return {
        schema: n,
        schemaPath: o,
        topSchemaRef: s,
        errSchemaPath: i,
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  cn.getSubschema = iU;
  function sU(
    e,
    t,
    { dataProp: r, dataPropType: n, data: o, dataTypes: i, propertyName: s }
  ) {
    if (o !== void 0 && r !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: a } = t;
    if (r !== void 0) {
      const { errorPath: c, dataPathArr: u, opts: f } = t,
        d = a.let("data", (0, gr._)`${t.data}${(0, gr.getProperty)(r)}`, !0);
      l(d),
        (e.errorPath = (0,
        gr.str)`${c}${(0, $y.getErrorPath)(r, n, f.jsPropertySyntax)}`),
        (e.parentDataProperty = (0, gr._)`${r}`),
        (e.dataPathArr = [...u, e.parentDataProperty]);
    }
    if (o !== void 0) {
      const c = o instanceof gr.Name ? o : a.let("data", o, !0);
      l(c), s !== void 0 && (e.propertyName = s);
    }
    i && (e.dataTypes = i);
    function l(c) {
      (e.data = c),
        (e.dataLevel = t.dataLevel + 1),
        (e.dataTypes = []),
        (t.definedProperties = /* @__PURE__ */ new Set()),
        (e.parentData = t.data),
        (e.dataNames = [...t.dataNames, c]);
    }
  }
  cn.extendSubschemaData = sU;
  function aU(
    e,
    {
      jtdDiscriminator: t,
      jtdMetadata: r,
      compositeRule: n,
      createErrors: o,
      allErrors: i,
    }
  ) {
    n !== void 0 && (e.compositeRule = n),
      o !== void 0 && (e.createErrors = o),
      i !== void 0 && (e.allErrors = i),
      (e.jtdDiscriminator = t),
      (e.jtdMetadata = r);
  }
  cn.extendSubschemaMode = aU;
  var $t = {},
    by = function e(t, r) {
      if (t === r) return !0;
      if (t && r && typeof t == "object" && typeof r == "object") {
        if (t.constructor !== r.constructor) return !1;
        var n, o, i;
        if (Array.isArray(t)) {
          if (((n = t.length), n != r.length)) return !1;
          for (o = n; o-- !== 0; ) if (!e(t[o], r[o])) return !1;
          return !0;
        }
        if (t.constructor === RegExp)
          return t.source === r.source && t.flags === r.flags;
        if (t.valueOf !== Object.prototype.valueOf)
          return t.valueOf() === r.valueOf();
        if (t.toString !== Object.prototype.toString)
          return t.toString() === r.toString();
        if (((i = Object.keys(t)), (n = i.length), n !== Object.keys(r).length))
          return !1;
        for (o = n; o-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(r, i[o])) return !1;
        for (o = n; o-- !== 0; ) {
          var s = i[o];
          if (!e(t[s], r[s])) return !1;
        }
        return !0;
      }
      return t !== t && r !== r;
    },
    wy = { exports: {} },
    sn = (wy.exports = function (e, t, r) {
      typeof t == "function" && ((r = t), (t = {})), (r = t.cb || r);
      var n = typeof r == "function" ? r : r.pre || function () {},
        o = r.post || function () {};
      Ts(t, n, o, e, "", e);
    });
  sn.keywords = {
    additionalItems: !0,
    items: !0,
    contains: !0,
    additionalProperties: !0,
    propertyNames: !0,
    not: !0,
    if: !0,
    then: !0,
    else: !0,
  };
  sn.arrayKeywords = {
    items: !0,
    allOf: !0,
    anyOf: !0,
    oneOf: !0,
  };
  sn.propsKeywords = {
    $defs: !0,
    definitions: !0,
    properties: !0,
    patternProperties: !0,
    dependencies: !0,
  };
  sn.skipKeywords = {
    default: !0,
    enum: !0,
    const: !0,
    required: !0,
    maximum: !0,
    minimum: !0,
    exclusiveMaximum: !0,
    exclusiveMinimum: !0,
    multipleOf: !0,
    maxLength: !0,
    minLength: !0,
    pattern: !0,
    format: !0,
    maxItems: !0,
    minItems: !0,
    uniqueItems: !0,
    maxProperties: !0,
    minProperties: !0,
  };
  function Ts(e, t, r, n, o, i, s, a, l, c) {
    if (n && typeof n == "object" && !Array.isArray(n)) {
      t(n, o, i, s, a, l, c);
      for (var u in n) {
        var f = n[u];
        if (Array.isArray(f)) {
          if (u in sn.arrayKeywords)
            for (var d = 0; d < f.length; d++)
              Ts(e, t, r, f[d], o + "/" + u + "/" + d, i, o, u, n, d);
        } else if (u in sn.propsKeywords) {
          if (f && typeof f == "object")
            for (var p in f)
              Ts(e, t, r, f[p], o + "/" + u + "/" + lU(p), i, o, u, n, p);
        } else
          (u in sn.keywords || (e.allKeys && !(u in sn.skipKeywords))) &&
            Ts(e, t, r, f, o + "/" + u, i, o, u, n);
      }
      r(n, o, i, s, a, l, c);
    }
  }
  function lU(e) {
    return e.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  var cU = wy.exports;
  Object.defineProperty($t, "__esModule", { value: !0 });
  $t.getSchemaRefs =
    $t.resolveUrl =
    $t.normalizeId =
    $t._getFullPath =
    $t.getFullPath =
    $t.inlineRef =
      void 0;
  const uU = Ve,
    fU = by,
    dU = cU,
    pU = /* @__PURE__ */ new Set([
      "type",
      "format",
      "pattern",
      "maxLength",
      "minLength",
      "maxProperties",
      "minProperties",
      "maxItems",
      "minItems",
      "maximum",
      "minimum",
      "uniqueItems",
      "multipleOf",
      "required",
      "enum",
      "const",
    ]);
  function hU(e, t = !0) {
    return typeof e == "boolean" ? !0 : t === !0 ? !pc(e) : t ? Ey(e) <= t : !1;
  }
  $t.inlineRef = hU;
  const gU = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor",
  ]);
  function pc(e) {
    for (const t in e) {
      if (gU.has(t)) return !0;
      const r = e[t];
      if ((Array.isArray(r) && r.some(pc)) || (typeof r == "object" && pc(r)))
        return !0;
    }
    return !1;
  }
  function Ey(e) {
    let t = 0;
    for (const r in e) {
      if (r === "$ref") return 1 / 0;
      if (
        (t++,
        !pU.has(r) &&
          (typeof e[r] == "object" && (0, uU.eachItem)(e[r], n => (t += Ey(n))),
          t === 1 / 0))
      )
        return 1 / 0;
    }
    return t;
  }
  function Oy(e, t = "", r) {
    r !== !1 && (t = yo(t));
    const n = e.parse(t);
    return Ay(e, n);
  }
  $t.getFullPath = Oy;
  function Ay(e, t) {
    return e.serialize(t).split("#")[0] + "#";
  }
  $t._getFullPath = Ay;
  const mU = /#\/?$/;
  function yo(e) {
    return e ? e.replace(mU, "") : "";
  }
  $t.normalizeId = yo;
  function vU(e, t, r) {
    return (r = yo(r)), e.resolve(t, r);
  }
  $t.resolveUrl = vU;
  const yU = /^[a-z_][-a-z0-9._]*$/i;
  function _U(e, t) {
    if (typeof e == "boolean") return {};
    const { schemaId: r, uriResolver: n } = this.opts,
      o = yo(e[r] || t),
      i = { "": o },
      s = Oy(n, o, !1),
      a = {},
      l = /* @__PURE__ */ new Set();
    return (
      dU(e, { allKeys: !0 }, (f, d, p, h) => {
        if (h === void 0) return;
        const m = s + d;
        let v = i[h];
        typeof f[r] == "string" && (v = g.call(this, f[r])),
          _.call(this, f.$anchor),
          _.call(this, f.$dynamicAnchor),
          (i[d] = v);
        function g(E) {
          const A = this.opts.uriResolver.resolve;
          if (((E = yo(v ? A(v, E) : E)), l.has(E))) throw u(E);
          l.add(E);
          let D = this.refs[E];
          return (
            typeof D == "string" && (D = this.refs[D]),
            typeof D == "object"
              ? c(f, D.schema, E)
              : E !== yo(m) &&
                (E[0] === "#"
                  ? (c(f, a[E], E), (a[E] = f))
                  : (this.refs[E] = m)),
            E
          );
        }
        function _(E) {
          if (typeof E == "string") {
            if (!yU.test(E)) throw new Error(`invalid anchor "${E}"`);
            g.call(this, `#${E}`);
          }
        }
      }),
      a
    );
    function c(f, d, p) {
      if (d !== void 0 && !fU(f, d)) throw u(p);
    }
    function u(f) {
      return new Error(`reference "${f}" resolves to more than one schema`);
    }
  }
  $t.getSchemaRefs = _U;
  Object.defineProperty(Yt, "__esModule", { value: !0 });
  Yt.getData = Yt.KeywordCxt = Yt.validateFunctionCode = void 0;
  const Sy = wo,
    Sh = Ji,
    Uu = Rr,
    ia = Ji,
    $U = Ga,
    vi = vr,
    Sl = cn,
    le = Ie,
    we = lr,
    bU = $t,
    Mr = Ve,
    ti = Lo;
  function wU(e) {
    if (Cy(e) && (Ty(e), Py(e))) {
      AU(e);
      return;
    }
    Ny(e, () => (0, Sy.topBoolOrEmptySchema)(e));
  }
  Yt.validateFunctionCode = wU;
  function Ny(
    { gen: e, validateName: t, schema: r, schemaEnv: n, opts: o },
    i
  ) {
    o.code.es5
      ? e.func(
          t,
          (0, le._)`${we.default.data}, ${we.default.valCxt}`,
          n.$async,
          () => {
            e.code((0, le._)`"use strict"; ${Nh(r, o)}`), OU(e, o), e.code(i);
          }
        )
      : e.func(t, (0, le._)`${we.default.data}, ${EU(o)}`, n.$async, () =>
          e.code(Nh(r, o)).code(i)
        );
  }
  function EU(e) {
    return (0,
    le._)`{${we.default.instancePath}="", ${we.default.parentData}, ${we.default.parentDataProperty}, ${we.default.rootData}=${we.default.data}${e.dynamicRef ? (0, le._)`, ${we.default.dynamicAnchors}={}` : le.nil}}={}`;
  }
  function OU(e, t) {
    e.if(
      we.default.valCxt,
      () => {
        e.var(
          we.default.instancePath,
          (0, le._)`${we.default.valCxt}.${we.default.instancePath}`
        ),
          e.var(
            we.default.parentData,
            (0, le._)`${we.default.valCxt}.${we.default.parentData}`
          ),
          e.var(
            we.default.parentDataProperty,
            (0, le._)`${we.default.valCxt}.${we.default.parentDataProperty}`
          ),
          e.var(
            we.default.rootData,
            (0, le._)`${we.default.valCxt}.${we.default.rootData}`
          ),
          t.dynamicRef &&
            e.var(
              we.default.dynamicAnchors,
              (0, le._)`${we.default.valCxt}.${we.default.dynamicAnchors}`
            );
      },
      () => {
        e.var(we.default.instancePath, (0, le._)`""`),
          e.var(we.default.parentData, (0, le._)`undefined`),
          e.var(we.default.parentDataProperty, (0, le._)`undefined`),
          e.var(we.default.rootData, we.default.data),
          t.dynamicRef && e.var(we.default.dynamicAnchors, (0, le._)`{}`);
      }
    );
  }
  function AU(e) {
    const { schema: t, opts: r, gen: n } = e;
    Ny(e, () => {
      r.$comment && t.$comment && Dy(e),
        TU(e),
        n.let(we.default.vErrors, null),
        n.let(we.default.errors, 0),
        r.unevaluated && SU(e),
        xy(e),
        IU(e);
    });
  }
  function SU(e) {
    const { gen: t, validateName: r } = e;
    (e.evaluated = t.const("evaluated", (0, le._)`${r}.evaluated`)),
      t.if((0, le._)`${e.evaluated}.dynamicProps`, () =>
        t.assign((0, le._)`${e.evaluated}.props`, (0, le._)`undefined`)
      ),
      t.if((0, le._)`${e.evaluated}.dynamicItems`, () =>
        t.assign((0, le._)`${e.evaluated}.items`, (0, le._)`undefined`)
      );
  }
  function Nh(e, t) {
    const r = typeof e == "object" && e[t.schemaId];
    return r && (t.code.source || t.code.process)
      ? (0, le._)`/*# sourceURL=${r} */`
      : le.nil;
  }
  function NU(e, t) {
    if (Cy(e) && (Ty(e), Py(e))) {
      PU(e, t);
      return;
    }
    (0, Sy.boolOrEmptySchema)(e, t);
  }
  function Py({ schema: e, self: t }) {
    if (typeof e == "boolean") return !e;
    for (const r in e) if (t.RULES.all[r]) return !0;
    return !1;
  }
  function Cy(e) {
    return typeof e.schema != "boolean";
  }
  function PU(e, t) {
    const { schema: r, gen: n, opts: o } = e;
    o.$comment && r.$comment && Dy(e), xU(e), DU(e);
    const i = n.const("_errs", we.default.errors);
    xy(e, i), n.var(t, (0, le._)`${i} === ${we.default.errors}`);
  }
  function Ty(e) {
    (0, Mr.checkUnknownRules)(e), CU(e);
  }
  function xy(e, t) {
    if (e.opts.jtd) return Ph(e, [], !1, t);
    const r = (0, Sh.getSchemaTypes)(e.schema),
      n = (0, Sh.coerceAndCheckDataType)(e, r);
    Ph(e, r, !n, t);
  }
  function CU(e) {
    const { schema: t, errSchemaPath: r, opts: n, self: o } = e;
    t.$ref &&
      n.ignoreKeywordsWithRef &&
      (0, Mr.schemaHasRulesButRef)(t, o.RULES) &&
      o.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
  }
  function TU(e) {
    const { schema: t, opts: r } = e;
    t.default !== void 0 &&
      r.useDefaults &&
      r.strictSchema &&
      (0, Mr.checkStrictMode)(e, "default is ignored in the schema root");
  }
  function xU(e) {
    const t = e.schema[e.opts.schemaId];
    t && (e.baseId = (0, bU.resolveUrl)(e.opts.uriResolver, e.baseId, t));
  }
  function DU(e) {
    if (e.schema.$async && !e.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function Dy({ gen: e, schemaEnv: t, schema: r, errSchemaPath: n, opts: o }) {
    const i = r.$comment;
    if (o.$comment === !0)
      e.code((0, le._)`${we.default.self}.logger.log(${i})`);
    else if (typeof o.$comment == "function") {
      const s = (0, le.str)`${n}/$comment`,
        a = e.scopeValue("root", { ref: t.root });
      e.code(
        (0, le._)`${we.default.self}.opts.$comment(${i}, ${s}, ${a}.schema)`
      );
    }
  }
  function IU(e) {
    const {
      gen: t,
      schemaEnv: r,
      validateName: n,
      ValidationError: o,
      opts: i,
    } = e;
    r.$async
      ? t.if(
          (0, le._)`${we.default.errors} === 0`,
          () => t.return(we.default.data),
          () => t.throw((0, le._)`new ${o}(${we.default.vErrors})`)
        )
      : (t.assign((0, le._)`${n}.errors`, we.default.vErrors),
        i.unevaluated && RU(e),
        t.return((0, le._)`${we.default.errors} === 0`));
  }
  function RU({ gen: e, evaluated: t, props: r, items: n }) {
    r instanceof le.Name && e.assign((0, le._)`${t}.props`, r),
      n instanceof le.Name && e.assign((0, le._)`${t}.items`, n);
  }
  function Ph(e, t, r, n) {
    const { gen: o, schema: i, data: s, allErrors: a, opts: l, self: c } = e,
      { RULES: u } = c;
    if (
      i.$ref &&
      (l.ignoreKeywordsWithRef || !(0, Mr.schemaHasRulesButRef)(i, u))
    ) {
      o.block(() => My(e, "$ref", u.all.$ref.definition));
      return;
    }
    l.jtd || MU(e, t),
      o.block(() => {
        for (const d of u.rules) f(d);
        f(u.post);
      });
    function f(d) {
      (0, Uu.shouldUseGroup)(i, d) &&
        (d.type
          ? (o.if((0, ia.checkDataType)(d.type, s, l.strictNumbers)),
            Ch(e, d),
            t.length === 1 &&
              t[0] === d.type &&
              r &&
              (o.else(), (0, ia.reportTypeError)(e)),
            o.endIf())
          : Ch(e, d),
        a || o.if((0, le._)`${we.default.errors} === ${n || 0}`));
    }
  }
  function Ch(e, t) {
    const {
      gen: r,
      schema: n,
      opts: { useDefaults: o },
    } = e;
    o && (0, $U.assignDefaults)(e, t.type),
      r.block(() => {
        for (const i of t.rules)
          (0, Uu.shouldUseRule)(n, i) && My(e, i.keyword, i.definition, t.type);
      });
  }
  function MU(e, t) {
    e.schemaEnv.meta ||
      !e.opts.strictTypes ||
      (jU(e, t), e.opts.allowUnionTypes || FU(e, t), LU(e, e.dataTypes));
  }
  function jU(e, t) {
    if (t.length) {
      if (!e.dataTypes.length) {
        e.dataTypes = t;
        return;
      }
      t.forEach(r => {
        Iy(e.dataTypes, r) ||
          Wu(
            e,
            `type "${r}" not allowed by context "${e.dataTypes.join(",")}"`
          );
      }),
        kU(e, t);
    }
  }
  function FU(e, t) {
    t.length > 1 &&
      !(t.length === 2 && t.includes("null")) &&
      Wu(e, "use allowUnionTypes to allow union type keyword");
  }
  function LU(e, t) {
    const r = e.self.RULES.all;
    for (const n in r) {
      const o = r[n];
      if (typeof o == "object" && (0, Uu.shouldUseRule)(e.schema, o)) {
        const { type: i } = o.definition;
        i.length &&
          !i.some(s => VU(t, s)) &&
          Wu(e, `missing type "${i.join(",")}" for keyword "${n}"`);
      }
    }
  }
  function VU(e, t) {
    return e.includes(t) || (t === "number" && e.includes("integer"));
  }
  function Iy(e, t) {
    return e.includes(t) || (t === "integer" && e.includes("number"));
  }
  function kU(e, t) {
    const r = [];
    for (const n of e.dataTypes)
      Iy(t, n)
        ? r.push(n)
        : t.includes("integer") && n === "number" && r.push("integer");
    e.dataTypes = r;
  }
  function Wu(e, t) {
    const r = e.schemaEnv.baseId + e.errSchemaPath;
    (t += ` at "${r}" (strictTypes)`),
      (0, Mr.checkStrictMode)(e, t, e.opts.strictTypes);
  }
  class Ry {
    constructor(t, r, n) {
      if (
        ((0, vi.validateKeywordUsage)(t, r, n),
        (this.gen = t.gen),
        (this.allErrors = t.allErrors),
        (this.keyword = n),
        (this.data = t.data),
        (this.schema = t.schema[n]),
        (this.$data =
          r.$data && t.opts.$data && this.schema && this.schema.$data),
        (this.schemaValue = (0, Mr.schemaRefOrVal)(
          t,
          this.schema,
          n,
          this.$data
        )),
        (this.schemaType = r.schemaType),
        (this.parentSchema = t.schema),
        (this.params = {}),
        (this.it = t),
        (this.def = r),
        this.$data)
      )
        this.schemaCode = t.gen.const("vSchema", jy(this.$data, t));
      else if (
        ((this.schemaCode = this.schemaValue),
        !(0, vi.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      )
        throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
      ("code" in r ? r.trackErrors : r.errors !== !1) &&
        (this.errsCount = t.gen.const("_errs", we.default.errors));
    }
    result(t, r, n) {
      this.failResult((0, le.not)(t), r, n);
    }
    failResult(t, r, n) {
      this.gen.if(t),
        n ? n() : this.error(),
        r
          ? (this.gen.else(), r(), this.allErrors && this.gen.endIf())
          : this.allErrors
            ? this.gen.endIf()
            : this.gen.else();
    }
    pass(t, r) {
      this.failResult((0, le.not)(t), void 0, r);
    }
    fail(t) {
      if (t === void 0) {
        this.error(), this.allErrors || this.gen.if(!1);
        return;
      }
      this.gen.if(t),
        this.error(),
        this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    fail$data(t) {
      if (!this.$data) return this.fail(t);
      const { schemaCode: r } = this;
      this.fail(
        (0, le._)`${r} !== undefined && (${(0, le.or)(this.invalid$data(), t)})`
      );
    }
    error(t, r, n) {
      if (r) {
        this.setParams(r), this._error(t, n), this.setParams({});
        return;
      }
      this._error(t, n);
    }
    _error(t, r) {
      (t ? ti.reportExtraError : ti.reportError)(this, this.def.error, r);
    }
    $dataError() {
      (0, ti.reportError)(this, this.def.$dataError || ti.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, ti.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(t) {
      this.allErrors || this.gen.if(t);
    }
    setParams(t, r) {
      r ? Object.assign(this.params, t) : (this.params = t);
    }
    block$data(t, r, n = le.nil) {
      this.gen.block(() => {
        this.check$data(t, n), r();
      });
    }
    check$data(t = le.nil, r = le.nil) {
      if (!this.$data) return;
      const { gen: n, schemaCode: o, schemaType: i, def: s } = this;
      n.if((0, le.or)((0, le._)`${o} === undefined`, r)),
        t !== le.nil && n.assign(t, !0),
        (i.length || s.validateSchema) &&
          (n.elseIf(this.invalid$data()),
          this.$dataError(),
          t !== le.nil && n.assign(t, !1)),
        n.else();
    }
    invalid$data() {
      const { gen: t, schemaCode: r, schemaType: n, def: o, it: i } = this;
      return (0, le.or)(s(), a());
      function s() {
        if (n.length) {
          if (!(r instanceof le.Name))
            throw new Error("ajv implementation error");
          const l = Array.isArray(n) ? n : [n];
          return (0,
          le._)`${(0, ia.checkDataTypes)(l, r, i.opts.strictNumbers, ia.DataType.Wrong)}`;
        }
        return le.nil;
      }
      function a() {
        if (o.validateSchema) {
          const l = t.scopeValue("validate$data", { ref: o.validateSchema });
          return (0, le._)`!${l}(${r})`;
        }
        return le.nil;
      }
    }
    subschema(t, r) {
      const n = (0, Sl.getSubschema)(this.it, t);
      (0, Sl.extendSubschemaData)(n, this.it, t),
        (0, Sl.extendSubschemaMode)(n, t);
      const o = { ...this.it, ...n, items: void 0, props: void 0 };
      return NU(o, r), o;
    }
    mergeEvaluated(t, r) {
      const { it: n, gen: o } = this;
      n.opts.unevaluated &&
        (n.props !== !0 &&
          t.props !== void 0 &&
          (n.props = Mr.mergeEvaluated.props(o, t.props, n.props, r)),
        n.items !== !0 &&
          t.items !== void 0 &&
          (n.items = Mr.mergeEvaluated.items(o, t.items, n.items, r)));
    }
    mergeValidEvaluated(t, r) {
      const { it: n, gen: o } = this;
      if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
        return o.if(r, () => this.mergeEvaluated(t, le.Name)), !0;
    }
  }
  Yt.KeywordCxt = Ry;
  function My(e, t, r, n) {
    const o = new Ry(e, r, t);
    "code" in r
      ? r.code(o, n)
      : o.$data && r.validate
        ? (0, vi.funcKeywordCode)(o, r)
        : "macro" in r
          ? (0, vi.macroKeywordCode)(o, r)
          : (r.compile || r.validate) && (0, vi.funcKeywordCode)(o, r);
  }
  const BU = /^\/(?:[^~]|~0|~1)*$/,
    zU = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function jy(e, { dataLevel: t, dataNames: r, dataPathArr: n }) {
    let o, i;
    if (e === "") return we.default.rootData;
    if (e[0] === "/") {
      if (!BU.test(e)) throw new Error(`Invalid JSON-pointer: ${e}`);
      (o = e), (i = we.default.rootData);
    } else {
      const c = zU.exec(e);
      if (!c) throw new Error(`Invalid JSON-pointer: ${e}`);
      const u = +c[1];
      if (((o = c[2]), o === "#")) {
        if (u >= t) throw new Error(l("property/index", u));
        return n[t - u];
      }
      if (u > t) throw new Error(l("data", u));
      if (((i = r[t - u]), !o)) return i;
    }
    let s = i;
    const a = o.split("/");
    for (const c of a)
      c &&
        ((i = (0,
        le._)`${i}${(0, le.getProperty)((0, Mr.unescapeJsonPointer)(c))}`),
        (s = (0, le._)`${s} && ${i}`));
    return s;
    function l(c, u) {
      return `Cannot access ${c} ${u} levels up, current level is ${t}`;
    }
  }
  Yt.getData = jy;
  var Xi = {};
  Object.defineProperty(Xi, "__esModule", { value: !0 });
  class UU extends Error {
    constructor(t) {
      super("validation failed"),
        (this.errors = t),
        (this.ajv = this.validation = !0);
    }
  }
  Xi.default = UU;
  var Zi = {};
  Object.defineProperty(Zi, "__esModule", { value: !0 });
  const Nl = $t;
  class WU extends Error {
    constructor(t, r, n, o) {
      super(o || `can't resolve reference ${n} from id ${r}`),
        (this.missingRef = (0, Nl.resolveUrl)(t, r, n)),
        (this.missingSchema = (0, Nl.normalizeId)(
          (0, Nl.getFullPath)(t, this.missingRef)
        ));
    }
  }
  Zi.default = WU;
  var Mt = {};
  Object.defineProperty(Mt, "__esModule", { value: !0 });
  Mt.resolveSchema =
    Mt.getCompilingSchema =
    Mt.resolveRef =
    Mt.compileSchema =
    Mt.SchemaEnv =
      void 0;
  const er = Ie,
    HU = Xi,
    En = lr,
    nr = $t,
    Th = Ve,
    KU = Yt;
  class qa {
    constructor(t) {
      var r;
      (this.refs = {}), (this.dynamicAnchors = {});
      let n;
      typeof t.schema == "object" && (n = t.schema),
        (this.schema = t.schema),
        (this.schemaId = t.schemaId),
        (this.root = t.root || this),
        (this.baseId =
          (r = t.baseId) !== null && r !== void 0
            ? r
            : (0, nr.normalizeId)(n == null ? void 0 : n[t.schemaId || "$id"])),
        (this.schemaPath = t.schemaPath),
        (this.localRefs = t.localRefs),
        (this.meta = t.meta),
        (this.$async = n == null ? void 0 : n.$async),
        (this.refs = {});
    }
  }
  Mt.SchemaEnv = qa;
  function Hu(e) {
    const t = Fy.call(this, e);
    if (t) return t;
    const r = (0, nr.getFullPath)(this.opts.uriResolver, e.root.baseId),
      { es5: n, lines: o } = this.opts.code,
      { ownProperties: i } = this.opts,
      s = new er.CodeGen(this.scope, { es5: n, lines: o, ownProperties: i });
    let a;
    e.$async &&
      (a = s.scopeValue("Error", {
        ref: HU.default,
        code: (0, er._)`require("ajv/dist/runtime/validation_error").default`,
      }));
    const l = s.scopeName("validate");
    e.validateName = l;
    const c = {
      gen: s,
      allErrors: this.opts.allErrors,
      data: En.default.data,
      parentData: En.default.parentData,
      parentDataProperty: En.default.parentDataProperty,
      dataNames: [En.default.data],
      dataPathArr: [er.nil],
      dataLevel: 0,
      dataTypes: [],
      definedProperties: /* @__PURE__ */ new Set(),
      topSchemaRef: s.scopeValue(
        "schema",
        this.opts.code.source === !0
          ? { ref: e.schema, code: (0, er.stringify)(e.schema) }
          : { ref: e.schema }
      ),
      validateName: l,
      ValidationError: a,
      schema: e.schema,
      schemaEnv: e,
      rootId: r,
      baseId: e.baseId || r,
      schemaPath: er.nil,
      errSchemaPath: e.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, er._)`""`,
      opts: this.opts,
      self: this,
    };
    let u;
    try {
      this._compilations.add(e),
        (0, KU.validateFunctionCode)(c),
        s.optimize(this.opts.code.optimize);
      const f = s.toString();
      (u = `${s.scopeRefs(En.default.scope)}return ${f}`),
        this.opts.code.process && (u = this.opts.code.process(u, e));
      const p = new Function(`${En.default.self}`, `${En.default.scope}`, u)(
        this,
        this.scope.get()
      );
      if (
        (this.scope.value(l, { ref: p }),
        (p.errors = null),
        (p.schema = e.schema),
        (p.schemaEnv = e),
        e.$async && (p.$async = !0),
        this.opts.code.source === !0 &&
          (p.source = {
            validateName: l,
            validateCode: f,
            scopeValues: s._values,
          }),
        this.opts.unevaluated)
      ) {
        const { props: h, items: m } = c;
        (p.evaluated = {
          props: h instanceof er.Name ? void 0 : h,
          items: m instanceof er.Name ? void 0 : m,
          dynamicProps: h instanceof er.Name,
          dynamicItems: m instanceof er.Name,
        }),
          p.source && (p.source.evaluated = (0, er.stringify)(p.evaluated));
      }
      return (e.validate = p), e;
    } catch (f) {
      throw (
        (delete e.validate,
        delete e.validateName,
        u && this.logger.error("Error compiling schema, function code:", u),
        f)
      );
    } finally {
      this._compilations.delete(e);
    }
  }
  Mt.compileSchema = Hu;
  function GU(e, t, r) {
    var n;
    r = (0, nr.resolveUrl)(this.opts.uriResolver, t, r);
    const o = e.refs[r];
    if (o) return o;
    let i = JU.call(this, e, r);
    if (i === void 0) {
      const s = (n = e.localRefs) === null || n === void 0 ? void 0 : n[r],
        { schemaId: a } = this.opts;
      s && (i = new qa({ schema: s, schemaId: a, root: e, baseId: t }));
    }
    if (i !== void 0) return (e.refs[r] = qU.call(this, i));
  }
  Mt.resolveRef = GU;
  function qU(e) {
    return (0, nr.inlineRef)(e.schema, this.opts.inlineRefs)
      ? e.schema
      : e.validate
        ? e
        : Hu.call(this, e);
  }
  function Fy(e) {
    for (const t of this._compilations) if (YU(t, e)) return t;
  }
  Mt.getCompilingSchema = Fy;
  function YU(e, t) {
    return e.schema === t.schema && e.root === t.root && e.baseId === t.baseId;
  }
  function JU(e, t) {
    let r;
    for (; typeof (r = this.refs[t]) == "string"; ) t = r;
    return r || this.schemas[t] || Ya.call(this, e, t);
  }
  function Ya(e, t) {
    const r = this.opts.uriResolver.parse(t),
      n = (0, nr._getFullPath)(this.opts.uriResolver, r);
    let o = (0, nr.getFullPath)(this.opts.uriResolver, e.baseId, void 0);
    if (Object.keys(e.schema).length > 0 && n === o) return Pl.call(this, r, e);
    const i = (0, nr.normalizeId)(n),
      s = this.refs[i] || this.schemas[i];
    if (typeof s == "string") {
      const a = Ya.call(this, e, s);
      return typeof (a == null ? void 0 : a.schema) != "object"
        ? void 0
        : Pl.call(this, r, a);
    }
    if (typeof (s == null ? void 0 : s.schema) == "object") {
      if ((s.validate || Hu.call(this, s), i === (0, nr.normalizeId)(t))) {
        const { schema: a } = s,
          { schemaId: l } = this.opts,
          c = a[l];
        return (
          c && (o = (0, nr.resolveUrl)(this.opts.uriResolver, o, c)),
          new qa({ schema: a, schemaId: l, root: e, baseId: o })
        );
      }
      return Pl.call(this, r, s);
    }
  }
  Mt.resolveSchema = Ya;
  const XU = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions",
  ]);
  function Pl(e, { baseId: t, schema: r, root: n }) {
    var o;
    if (((o = e.fragment) === null || o === void 0 ? void 0 : o[0]) !== "/")
      return;
    for (const a of e.fragment.slice(1).split("/")) {
      if (typeof r == "boolean") return;
      const l = r[(0, Th.unescapeFragment)(a)];
      if (l === void 0) return;
      r = l;
      const c = typeof r == "object" && r[this.opts.schemaId];
      !XU.has(a) && c && (t = (0, nr.resolveUrl)(this.opts.uriResolver, t, c));
    }
    let i;
    if (
      typeof r != "boolean" &&
      r.$ref &&
      !(0, Th.schemaHasRulesButRef)(r, this.RULES)
    ) {
      const a = (0, nr.resolveUrl)(this.opts.uriResolver, t, r.$ref);
      i = Ya.call(this, n, a);
    }
    const { schemaId: s } = this.opts;
    if (
      ((i = i || new qa({ schema: r, schemaId: s, root: n, baseId: t })),
      i.schema !== i.root.schema)
    )
      return i;
  }
  const ZU =
      "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
    QU = "Meta-schema for $data reference (JSON AnySchema extension proposal)",
    eW = "object",
    tW = ["$data"],
    rW = {
      $data: {
        type: "string",
        anyOf: [
          {
            format: "relative-json-pointer",
          },
          {
            format: "json-pointer",
          },
        ],
      },
    },
    nW = !1,
    oW = {
      $id: ZU,
      description: QU,
      type: eW,
      required: tW,
      properties: rW,
      additionalProperties: nW,
    };
  var Ku = {},
    hc = { exports: {} };
  /** @license URI.js v4.4.1 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */
  (function (e, t) {
    (function (r, n) {
      n(t);
    })(ii, function (r) {
      function n() {
        for (var C = arguments.length, w = Array(C), x = 0; x < C; x++)
          w[x] = arguments[x];
        if (w.length > 1) {
          w[0] = w[0].slice(0, -1);
          for (var V = w.length - 1, L = 1; L < V; ++L)
            w[L] = w[L].slice(1, -1);
          return (w[V] = w[V].slice(1)), w.join("");
        } else return w[0];
      }
      function o(C) {
        return "(?:" + C + ")";
      }
      function i(C) {
        return C === void 0
          ? "undefined"
          : C === null
            ? "null"
            : Object.prototype.toString
                .call(C)
                .split(" ")
                .pop()
                .split("]")
                .shift()
                .toLowerCase();
      }
      function s(C) {
        return C.toUpperCase();
      }
      function a(C) {
        return C != null
          ? C instanceof Array
            ? C
            : typeof C.length != "number" || C.split || C.setInterval || C.call
              ? [C]
              : Array.prototype.slice.call(C)
          : [];
      }
      function l(C, w) {
        var x = C;
        if (w) for (var V in w) x[V] = w[V];
        return x;
      }
      function c(C) {
        var w = "[A-Za-z]",
          x = "[0-9]",
          V = n(x, "[A-Fa-f]"),
          L = o(
            o("%[EFef]" + V + "%" + V + V + "%" + V + V) +
              "|" +
              o("%[89A-Fa-f]" + V + "%" + V + V) +
              "|" +
              o("%" + V + V)
          ),
          de = "[\\:\\/\\?\\#\\[\\]\\@]",
          pe = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
          Fe = n(de, pe),
          Ye = C
            ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]"
            : "[]",
          at = C ? "[\\uE000-\\uF8FF]" : "[]",
          je = n(w, x, "[\\-\\.\\_\\~]", Ye);
        o(w + n(w, x, "[\\+\\-\\.]") + "*"),
          o(o(L + "|" + n(je, pe, "[\\:]")) + "*");
        var Ke = o(
            o("25[0-5]") +
              "|" +
              o("2[0-4]" + x) +
              "|" +
              o("1" + x + x) +
              "|" +
              o("0?[1-9]" + x) +
              "|0?0?" +
              x
          ),
          lt = o(Ke + "\\." + Ke + "\\." + Ke + "\\." + Ke),
          Ae = o(V + "{1,4}"),
          tt = o(o(Ae + "\\:" + Ae) + "|" + lt),
          ft = o(o(Ae + "\\:") + "{6}" + tt),
          rt = o("\\:\\:" + o(Ae + "\\:") + "{5}" + tt),
          qr = o(o(Ae) + "?\\:\\:" + o(Ae + "\\:") + "{4}" + tt),
          cr = o(
            o(o(Ae + "\\:") + "{0,1}" + Ae) +
              "?\\:\\:" +
              o(Ae + "\\:") +
              "{3}" +
              tt
          ),
          ur = o(
            o(o(Ae + "\\:") + "{0,2}" + Ae) +
              "?\\:\\:" +
              o(Ae + "\\:") +
              "{2}" +
              tt
          ),
          so = o(o(o(Ae + "\\:") + "{0,3}" + Ae) + "?\\:\\:" + Ae + "\\:" + tt),
          _n = o(o(o(Ae + "\\:") + "{0,4}" + Ae) + "?\\:\\:" + tt),
          Kt = o(o(o(Ae + "\\:") + "{0,5}" + Ae) + "?\\:\\:" + Ae),
          fr = o(o(o(Ae + "\\:") + "{0,6}" + Ae) + "?\\:\\:"),
          $n = o([ft, rt, qr, cr, ur, so, _n, Kt, fr].join("|")),
          Er = o(o(je + "|" + L) + "+");
        o("[vV]" + V + "+\\." + n(je, pe, "[\\:]") + "+"),
          o(o(L + "|" + n(je, pe)) + "*");
        var Wo = o(L + "|" + n(je, pe, "[\\:\\@]"));
        return (
          o(o(L + "|" + n(je, pe, "[\\@]")) + "+"),
          o(o(Wo + "|" + n("[\\/\\?]", at)) + "*"),
          {
            NOT_SCHEME: new RegExp(n("[^]", w, x, "[\\+\\-\\.]"), "g"),
            NOT_USERINFO: new RegExp(n("[^\\%\\:]", je, pe), "g"),
            NOT_HOST: new RegExp(n("[^\\%\\[\\]\\:]", je, pe), "g"),
            NOT_PATH: new RegExp(n("[^\\%\\/\\:\\@]", je, pe), "g"),
            NOT_PATH_NOSCHEME: new RegExp(n("[^\\%\\/\\@]", je, pe), "g"),
            NOT_QUERY: new RegExp(
              n("[^\\%]", je, pe, "[\\:\\@\\/\\?]", at),
              "g"
            ),
            NOT_FRAGMENT: new RegExp(
              n("[^\\%]", je, pe, "[\\:\\@\\/\\?]"),
              "g"
            ),
            ESCAPE: new RegExp(n("[^]", je, pe), "g"),
            UNRESERVED: new RegExp(je, "g"),
            OTHER_CHARS: new RegExp(n("[^\\%]", je, Fe), "g"),
            PCT_ENCODED: new RegExp(L, "g"),
            IPV4ADDRESS: new RegExp("^(" + lt + ")$"),
            IPV6ADDRESS: new RegExp(
              "^\\[?(" +
                $n +
                ")" +
                o(o("\\%25|\\%(?!" + V + "{2})") + "(" + Er + ")") +
                "?\\]?$"
            ),
            //RFC 6874, with relaxed parsing rules
          }
        );
      }
      var u = c(!1),
        f = c(!0),
        d = (function () {
          function C(w, x) {
            var V = [],
              L = !0,
              de = !1,
              pe = void 0;
            try {
              for (
                var Fe = w[Symbol.iterator](), Ye;
                !(L = (Ye = Fe.next()).done) &&
                (V.push(Ye.value), !(x && V.length === x));
                L = !0
              );
            } catch (at) {
              (de = !0), (pe = at);
            } finally {
              try {
                !L && Fe.return && Fe.return();
              } finally {
                if (de) throw pe;
              }
            }
            return V;
          }
          return function (w, x) {
            if (Array.isArray(w)) return w;
            if (Symbol.iterator in Object(w)) return C(w, x);
            throw new TypeError(
              "Invalid attempt to destructure non-iterable instance"
            );
          };
        })(),
        p = function (C) {
          if (Array.isArray(C)) {
            for (var w = 0, x = Array(C.length); w < C.length; w++) x[w] = C[w];
            return x;
          } else return Array.from(C);
        },
        h = 2147483647,
        m = 36,
        v = 1,
        g = 26,
        _ = 38,
        E = 700,
        A = 72,
        D = 128,
        S = "-",
        O = /^xn--/,
        j = /[^\0-\x7E]/,
        B = /[\x2E\u3002\uFF0E\uFF61]/g,
        W = {
          overflow: "Overflow: input needs wider integers to process",
          "not-basic": "Illegal input >= 0x80 (not a basic code point)",
          "invalid-input": "Invalid input",
        },
        re = m - v,
        G = Math.floor,
        Se = String.fromCharCode;
      function ce(C) {
        throw new RangeError(W[C]);
      }
      function Pe(C, w) {
        for (var x = [], V = C.length; V--; ) x[V] = w(C[V]);
        return x;
      }
      function _e(C, w) {
        var x = C.split("@"),
          V = "";
        x.length > 1 && ((V = x[0] + "@"), (C = x[1])), (C = C.replace(B, "."));
        var L = C.split("."),
          de = Pe(L, w).join(".");
        return V + de;
      }
      function ae(C) {
        for (var w = [], x = 0, V = C.length; x < V; ) {
          var L = C.charCodeAt(x++);
          if (L >= 55296 && L <= 56319 && x < V) {
            var de = C.charCodeAt(x++);
            (de & 64512) == 56320
              ? w.push(((L & 1023) << 10) + (de & 1023) + 65536)
              : (w.push(L), x--);
          } else w.push(L);
        }
        return w;
      }
      var me = function (w) {
          return String.fromCodePoint.apply(String, p(w));
        },
        ze = function (w) {
          return w - 48 < 10
            ? w - 22
            : w - 65 < 26
              ? w - 65
              : w - 97 < 26
                ? w - 97
                : m;
        },
        Q = function (w, x) {
          return w + 22 + 75 * (w < 26) - ((x != 0) << 5);
        },
        I = function (w, x, V) {
          var L = 0;
          for (
            w = V ? G(w / E) : w >> 1, w += G(w / x);
            /* no initialization */
            w > (re * g) >> 1;
            L += m
          )
            w = G(w / re);
          return G(L + ((re + 1) * w) / (w + _));
        },
        R = function (w) {
          var x = [],
            V = w.length,
            L = 0,
            de = D,
            pe = A,
            Fe = w.lastIndexOf(S);
          Fe < 0 && (Fe = 0);
          for (var Ye = 0; Ye < Fe; ++Ye)
            w.charCodeAt(Ye) >= 128 && ce("not-basic"),
              x.push(w.charCodeAt(Ye));
          for (var at = Fe > 0 ? Fe + 1 : 0; at < V; ) {
            for (
              var je = L, Ke = 1, lt = m;
              ;
              /* no condition */
              lt += m
            ) {
              at >= V && ce("invalid-input");
              var Ae = ze(w.charCodeAt(at++));
              (Ae >= m || Ae > G((h - L) / Ke)) && ce("overflow"),
                (L += Ae * Ke);
              var tt = lt <= pe ? v : lt >= pe + g ? g : lt - pe;
              if (Ae < tt) break;
              var ft = m - tt;
              Ke > G(h / ft) && ce("overflow"), (Ke *= ft);
            }
            var rt = x.length + 1;
            (pe = I(L - je, rt, je == 0)),
              G(L / rt) > h - de && ce("overflow"),
              (de += G(L / rt)),
              (L %= rt),
              x.splice(L++, 0, de);
          }
          return String.fromCodePoint.apply(String, x);
        },
        P = function (w) {
          var x = [];
          w = ae(w);
          var V = w.length,
            L = D,
            de = 0,
            pe = A,
            Fe = !0,
            Ye = !1,
            at = void 0;
          try {
            for (
              var je = w[Symbol.iterator](), Ke;
              !(Fe = (Ke = je.next()).done);
              Fe = !0
            ) {
              var lt = Ke.value;
              lt < 128 && x.push(Se(lt));
            }
          } catch (Ho) {
            (Ye = !0), (at = Ho);
          } finally {
            try {
              !Fe && je.return && je.return();
            } finally {
              if (Ye) throw at;
            }
          }
          var Ae = x.length,
            tt = Ae;
          for (Ae && x.push(S); tt < V; ) {
            var ft = h,
              rt = !0,
              qr = !1,
              cr = void 0;
            try {
              for (
                var ur = w[Symbol.iterator](), so;
                !(rt = (so = ur.next()).done);
                rt = !0
              ) {
                var _n = so.value;
                _n >= L && _n < ft && (ft = _n);
              }
            } catch (Ho) {
              (qr = !0), (cr = Ho);
            } finally {
              try {
                !rt && ur.return && ur.return();
              } finally {
                if (qr) throw cr;
              }
            }
            var Kt = tt + 1;
            ft - L > G((h - de) / Kt) && ce("overflow"),
              (de += (ft - L) * Kt),
              (L = ft);
            var fr = !0,
              $n = !1,
              Er = void 0;
            try {
              for (
                var Wo = w[Symbol.iterator](), Cf;
                !(fr = (Cf = Wo.next()).done);
                fr = !0
              ) {
                var Tf = Cf.value;
                if ((Tf < L && ++de > h && ce("overflow"), Tf == L)) {
                  for (
                    var ts = de, rs = m;
                    ;
                    /* no condition */
                    rs += m
                  ) {
                    var ns = rs <= pe ? v : rs >= pe + g ? g : rs - pe;
                    if (ts < ns) break;
                    var xf = ts - ns,
                      Df = m - ns;
                    x.push(Se(Q(ns + (xf % Df), 0))), (ts = G(xf / Df));
                  }
                  x.push(Se(Q(ts, 0))),
                    (pe = I(de, Kt, tt == Ae)),
                    (de = 0),
                    ++tt;
                }
              }
            } catch (Ho) {
              ($n = !0), (Er = Ho);
            } finally {
              try {
                !fr && Wo.return && Wo.return();
              } finally {
                if ($n) throw Er;
              }
            }
            ++de, ++L;
          }
          return x.join("");
        },
        y = function (w) {
          return _e(w, function (x) {
            return O.test(x) ? R(x.slice(4).toLowerCase()) : x;
          });
        },
        $ = function (w) {
          return _e(w, function (x) {
            return j.test(x) ? "xn--" + P(x) : x;
          });
        },
        N = {
          /**
           * A string representing the current Punycode.js version number.
           * @memberOf punycode
           * @type String
           */
          version: "2.1.0",
          /**
           * An object of methods to convert from JavaScript's internal character
           * representation (UCS-2) to Unicode code points, and back.
           * @see <https://mathiasbynens.be/notes/javascript-encoding>
           * @memberOf punycode
           * @type Object
           */
          ucs2: {
            decode: ae,
            encode: me,
          },
          decode: R,
          encode: P,
          toASCII: $,
          toUnicode: y,
        },
        M = {};
      function F(C) {
        var w = C.charCodeAt(0),
          x = void 0;
        return (
          w < 16
            ? (x = "%0" + w.toString(16).toUpperCase())
            : w < 128
              ? (x = "%" + w.toString(16).toUpperCase())
              : w < 2048
                ? (x =
                    "%" +
                    ((w >> 6) | 192).toString(16).toUpperCase() +
                    "%" +
                    ((w & 63) | 128).toString(16).toUpperCase())
                : (x =
                    "%" +
                    ((w >> 12) | 224).toString(16).toUpperCase() +
                    "%" +
                    (((w >> 6) & 63) | 128).toString(16).toUpperCase() +
                    "%" +
                    ((w & 63) | 128).toString(16).toUpperCase()),
          x
        );
      }
      function q(C) {
        for (var w = "", x = 0, V = C.length; x < V; ) {
          var L = parseInt(C.substr(x + 1, 2), 16);
          if (L < 128) (w += String.fromCharCode(L)), (x += 3);
          else if (L >= 194 && L < 224) {
            if (V - x >= 6) {
              var de = parseInt(C.substr(x + 4, 2), 16);
              w += String.fromCharCode(((L & 31) << 6) | (de & 63));
            } else w += C.substr(x, 6);
            x += 6;
          } else if (L >= 224) {
            if (V - x >= 9) {
              var pe = parseInt(C.substr(x + 4, 2), 16),
                Fe = parseInt(C.substr(x + 7, 2), 16);
              w += String.fromCharCode(
                ((L & 15) << 12) | ((pe & 63) << 6) | (Fe & 63)
              );
            } else w += C.substr(x, 9);
            x += 9;
          } else (w += C.substr(x, 3)), (x += 3);
        }
        return w;
      }
      function ne(C, w) {
        function x(V) {
          var L = q(V);
          return L.match(w.UNRESERVED) ? L : V;
        }
        return (
          C.scheme &&
            (C.scheme = String(C.scheme)
              .replace(w.PCT_ENCODED, x)
              .toLowerCase()
              .replace(w.NOT_SCHEME, "")),
          C.userinfo !== void 0 &&
            (C.userinfo = String(C.userinfo)
              .replace(w.PCT_ENCODED, x)
              .replace(w.NOT_USERINFO, F)
              .replace(w.PCT_ENCODED, s)),
          C.host !== void 0 &&
            (C.host = String(C.host)
              .replace(w.PCT_ENCODED, x)
              .toLowerCase()
              .replace(w.NOT_HOST, F)
              .replace(w.PCT_ENCODED, s)),
          C.path !== void 0 &&
            (C.path = String(C.path)
              .replace(w.PCT_ENCODED, x)
              .replace(C.scheme ? w.NOT_PATH : w.NOT_PATH_NOSCHEME, F)
              .replace(w.PCT_ENCODED, s)),
          C.query !== void 0 &&
            (C.query = String(C.query)
              .replace(w.PCT_ENCODED, x)
              .replace(w.NOT_QUERY, F)
              .replace(w.PCT_ENCODED, s)),
          C.fragment !== void 0 &&
            (C.fragment = String(C.fragment)
              .replace(w.PCT_ENCODED, x)
              .replace(w.NOT_FRAGMENT, F)
              .replace(w.PCT_ENCODED, s)),
          C
        );
      }
      function $e(C) {
        return C.replace(/^0*(.*)/, "$1") || "0";
      }
      function Te(C, w) {
        var x = C.match(w.IPV4ADDRESS) || [],
          V = d(x, 2),
          L = V[1];
        return L ? L.split(".").map($e).join(".") : C;
      }
      function qe(C, w) {
        var x = C.match(w.IPV6ADDRESS) || [],
          V = d(x, 3),
          L = V[1],
          de = V[2];
        if (L) {
          for (
            var pe = L.toLowerCase().split("::").reverse(),
              Fe = d(pe, 2),
              Ye = Fe[0],
              at = Fe[1],
              je = at ? at.split(":").map($e) : [],
              Ke = Ye.split(":").map($e),
              lt = w.IPV4ADDRESS.test(Ke[Ke.length - 1]),
              Ae = lt ? 7 : 8,
              tt = Ke.length - Ae,
              ft = Array(Ae),
              rt = 0;
            rt < Ae;
            ++rt
          )
            ft[rt] = je[rt] || Ke[tt + rt] || "";
          lt && (ft[Ae - 1] = Te(ft[Ae - 1], w));
          var qr = ft.reduce(function (Kt, fr, $n) {
              if (!fr || fr === "0") {
                var Er = Kt[Kt.length - 1];
                Er && Er.index + Er.length === $n
                  ? Er.length++
                  : Kt.push({ index: $n, length: 1 });
              }
              return Kt;
            }, []),
            cr = qr.sort(function (Kt, fr) {
              return fr.length - Kt.length;
            })[0],
            ur = void 0;
          if (cr && cr.length > 1) {
            var so = ft.slice(0, cr.index),
              _n = ft.slice(cr.index + cr.length);
            ur = so.join(":") + "::" + _n.join(":");
          } else ur = ft.join(":");
          return de && (ur += "%" + de), ur;
        } else return C;
      }
      var b =
          /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i,
        T = "".match(/(){0}/)[1] === void 0;
      function k(C) {
        var w =
            arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
          x = {},
          V = w.iri !== !1 ? f : u;
        w.reference === "suffix" &&
          (C = (w.scheme ? w.scheme + ":" : "") + "//" + C);
        var L = C.match(b);
        if (L) {
          T
            ? ((x.scheme = L[1]),
              (x.userinfo = L[3]),
              (x.host = L[4]),
              (x.port = parseInt(L[5], 10)),
              (x.path = L[6] || ""),
              (x.query = L[7]),
              (x.fragment = L[8]),
              isNaN(x.port) && (x.port = L[5]))
            : ((x.scheme = L[1] || void 0),
              (x.userinfo = C.indexOf("@") !== -1 ? L[3] : void 0),
              (x.host = C.indexOf("//") !== -1 ? L[4] : void 0),
              (x.port = parseInt(L[5], 10)),
              (x.path = L[6] || ""),
              (x.query = C.indexOf("?") !== -1 ? L[7] : void 0),
              (x.fragment = C.indexOf("#") !== -1 ? L[8] : void 0),
              isNaN(x.port) &&
                (x.port = C.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/)
                  ? L[4]
                  : void 0)),
            x.host && (x.host = qe(Te(x.host, V), V)),
            x.scheme === void 0 &&
            x.userinfo === void 0 &&
            x.host === void 0 &&
            x.port === void 0 &&
            !x.path &&
            x.query === void 0
              ? (x.reference = "same-document")
              : x.scheme === void 0
                ? (x.reference = "relative")
                : x.fragment === void 0
                  ? (x.reference = "absolute")
                  : (x.reference = "uri"),
            w.reference &&
              w.reference !== "suffix" &&
              w.reference !== x.reference &&
              (x.error =
                x.error || "URI is not a " + w.reference + " reference.");
          var de = M[(w.scheme || x.scheme || "").toLowerCase()];
          if (!w.unicodeSupport && (!de || !de.unicodeSupport)) {
            if (x.host && (w.domainHost || (de && de.domainHost)))
              try {
                x.host = N.toASCII(
                  x.host.replace(V.PCT_ENCODED, q).toLowerCase()
                );
              } catch (pe) {
                x.error =
                  x.error ||
                  "Host's domain name can not be converted to ASCII via punycode: " +
                    pe;
              }
            ne(x, u);
          } else ne(x, V);
          de && de.parse && de.parse(x, w);
        } else x.error = x.error || "URI can not be parsed.";
        return x;
      }
      function K(C, w) {
        var x = w.iri !== !1 ? f : u,
          V = [];
        return (
          C.userinfo !== void 0 && (V.push(C.userinfo), V.push("@")),
          C.host !== void 0 &&
            V.push(
              qe(Te(String(C.host), x), x).replace(
                x.IPV6ADDRESS,
                function (L, de, pe) {
                  return "[" + de + (pe ? "%25" + pe : "") + "]";
                }
              )
            ),
          (typeof C.port == "number" || typeof C.port == "string") &&
            (V.push(":"), V.push(String(C.port))),
          V.length ? V.join("") : void 0
        );
      }
      var H = /^\.\.?\//,
        J = /^\/\.(\/|$)/,
        ee = /^\/\.\.(\/|$)/,
        Y = /^\/?(?:.|\n)*?(?=\/|$)/;
      function X(C) {
        for (var w = []; C.length; )
          if (C.match(H)) C = C.replace(H, "");
          else if (C.match(J)) C = C.replace(J, "/");
          else if (C.match(ee)) (C = C.replace(ee, "/")), w.pop();
          else if (C === "." || C === "..") C = "";
          else {
            var x = C.match(Y);
            if (x) {
              var V = x[0];
              (C = C.slice(V.length)), w.push(V);
            } else throw new Error("Unexpected dot segment condition");
          }
        return w.join("");
      }
      function U(C) {
        var w =
            arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
          x = w.iri ? f : u,
          V = [],
          L = M[(w.scheme || C.scheme || "").toLowerCase()];
        if (
          (L && L.serialize && L.serialize(C, w),
          C.host && !x.IPV6ADDRESS.test(C.host))
        ) {
          if (w.domainHost || (L && L.domainHost))
            try {
              C.host = w.iri
                ? N.toUnicode(C.host)
                : N.toASCII(C.host.replace(x.PCT_ENCODED, q).toLowerCase());
            } catch (Fe) {
              C.error =
                C.error ||
                "Host's domain name can not be converted to " +
                  (w.iri ? "Unicode" : "ASCII") +
                  " via punycode: " +
                  Fe;
            }
        }
        ne(C, x),
          w.reference !== "suffix" &&
            C.scheme &&
            (V.push(C.scheme), V.push(":"));
        var de = K(C, w);
        if (
          (de !== void 0 &&
            (w.reference !== "suffix" && V.push("//"),
            V.push(de),
            C.path && C.path.charAt(0) !== "/" && V.push("/")),
          C.path !== void 0)
        ) {
          var pe = C.path;
          !w.absolutePath && (!L || !L.absolutePath) && (pe = X(pe)),
            de === void 0 && (pe = pe.replace(/^\/\//, "/%2F")),
            V.push(pe);
        }
        return (
          C.query !== void 0 && (V.push("?"), V.push(C.query)),
          C.fragment !== void 0 && (V.push("#"), V.push(C.fragment)),
          V.join("")
        );
      }
      function te(C, w) {
        var x =
            arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {},
          V = arguments[3],
          L = {};
        return (
          V || ((C = k(U(C, x), x)), (w = k(U(w, x), x))),
          (x = x || {}),
          !x.tolerant && w.scheme
            ? ((L.scheme = w.scheme),
              (L.userinfo = w.userinfo),
              (L.host = w.host),
              (L.port = w.port),
              (L.path = X(w.path || "")),
              (L.query = w.query))
            : (w.userinfo !== void 0 || w.host !== void 0 || w.port !== void 0
                ? ((L.userinfo = w.userinfo),
                  (L.host = w.host),
                  (L.port = w.port),
                  (L.path = X(w.path || "")),
                  (L.query = w.query))
                : (w.path
                    ? (w.path.charAt(0) === "/"
                        ? (L.path = X(w.path))
                        : ((C.userinfo !== void 0 ||
                            C.host !== void 0 ||
                            C.port !== void 0) &&
                          !C.path
                            ? (L.path = "/" + w.path)
                            : C.path
                              ? (L.path =
                                  C.path.slice(0, C.path.lastIndexOf("/") + 1) +
                                  w.path)
                              : (L.path = w.path),
                          (L.path = X(L.path))),
                      (L.query = w.query))
                    : ((L.path = C.path),
                      w.query !== void 0
                        ? (L.query = w.query)
                        : (L.query = C.query)),
                  (L.userinfo = C.userinfo),
                  (L.host = C.host),
                  (L.port = C.port)),
              (L.scheme = C.scheme)),
          (L.fragment = w.fragment),
          L
        );
      }
      function se(C, w, x) {
        var V = l({ scheme: "null" }, x);
        return U(te(k(C, V), k(w, V), V, !0), V);
      }
      function ie(C, w) {
        return (
          typeof C == "string"
            ? (C = U(k(C, w), w))
            : i(C) === "object" && (C = k(U(C, w), w)),
          C
        );
      }
      function ye(C, w, x) {
        return (
          typeof C == "string"
            ? (C = U(k(C, x), x))
            : i(C) === "object" && (C = U(C, x)),
          typeof w == "string"
            ? (w = U(k(w, x), x))
            : i(w) === "object" && (w = U(w, x)),
          C === w
        );
      }
      function xe(C, w) {
        return C && C.toString().replace(!w || !w.iri ? u.ESCAPE : f.ESCAPE, F);
      }
      function Ce(C, w) {
        return (
          C &&
          C.toString().replace(!w || !w.iri ? u.PCT_ENCODED : f.PCT_ENCODED, q)
        );
      }
      var ke = {
          scheme: "http",
          domainHost: !0,
          parse: function (w, x) {
            return (
              w.host || (w.error = w.error || "HTTP URIs must have a host."), w
            );
          },
          serialize: function (w, x) {
            var V = String(w.scheme).toLowerCase() === "https";
            return (
              (w.port === (V ? 443 : 80) || w.port === "") && (w.port = void 0),
              w.path || (w.path = "/"),
              w
            );
          },
        },
        st = {
          scheme: "https",
          domainHost: ke.domainHost,
          parse: ke.parse,
          serialize: ke.serialize,
        };
      function Dt(C) {
        return typeof C.secure == "boolean"
          ? C.secure
          : String(C.scheme).toLowerCase() === "wss";
      }
      var Wt = {
          scheme: "ws",
          domainHost: !0,
          parse: function (w, x) {
            var V = w;
            return (
              (V.secure = Dt(V)),
              (V.resourceName =
                (V.path || "/") + (V.query ? "?" + V.query : "")),
              (V.path = void 0),
              (V.query = void 0),
              V
            );
          },
          serialize: function (w, x) {
            if (
              ((w.port === (Dt(w) ? 443 : 80) || w.port === "") &&
                (w.port = void 0),
              typeof w.secure == "boolean" &&
                ((w.scheme = w.secure ? "wss" : "ws"), (w.secure = void 0)),
              w.resourceName)
            ) {
              var V = w.resourceName.split("?"),
                L = d(V, 2),
                de = L[0],
                pe = L[1];
              (w.path = de && de !== "/" ? de : void 0),
                (w.query = pe),
                (w.resourceName = void 0);
            }
            return (w.fragment = void 0), w;
          },
        },
        zo = {
          scheme: "wss",
          domainHost: Wt.domainHost,
          parse: Wt.parse,
          serialize: Wt.serialize,
        },
        yn = {},
        Uo =
          "[A-Za-z0-9\\-\\.\\_\\~\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]",
        He = "[0-9A-Fa-f]",
        Ht = o(
          o("%[EFef]" + He + "%" + He + He + "%" + He + He) +
            "|" +
            o("%[89A-Fa-f]" + He + "%" + He + He) +
            "|" +
            o("%" + He + He)
        ),
        es = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]",
        Xy = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]",
        Zy = n(Xy, '[\\"\\\\]'),
        Qy = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]",
        e_ = new RegExp(Uo, "g"),
        io = new RegExp(Ht, "g"),
        t_ = new RegExp(n("[^]", es, "[\\.]", '[\\"]', Zy), "g"),
        Af = new RegExp(n("[^]", Uo, Qy), "g"),
        r_ = Af;
      function Xa(C) {
        var w = q(C);
        return w.match(e_) ? w : C;
      }
      var Sf = {
          scheme: "mailto",
          parse: function (w, x) {
            var V = w,
              L = (V.to = V.path ? V.path.split(",") : []);
            if (((V.path = void 0), V.query)) {
              for (
                var de = !1,
                  pe = {},
                  Fe = V.query.split("&"),
                  Ye = 0,
                  at = Fe.length;
                Ye < at;
                ++Ye
              ) {
                var je = Fe[Ye].split("=");
                switch (je[0]) {
                  case "to":
                    for (
                      var Ke = je[1].split(","), lt = 0, Ae = Ke.length;
                      lt < Ae;
                      ++lt
                    )
                      L.push(Ke[lt]);
                    break;
                  case "subject":
                    V.subject = Ce(je[1], x);
                    break;
                  case "body":
                    V.body = Ce(je[1], x);
                    break;
                  default:
                    (de = !0), (pe[Ce(je[0], x)] = Ce(je[1], x));
                    break;
                }
              }
              de && (V.headers = pe);
            }
            V.query = void 0;
            for (var tt = 0, ft = L.length; tt < ft; ++tt) {
              var rt = L[tt].split("@");
              if (((rt[0] = Ce(rt[0])), x.unicodeSupport))
                rt[1] = Ce(rt[1], x).toLowerCase();
              else
                try {
                  rt[1] = N.toASCII(Ce(rt[1], x).toLowerCase());
                } catch (qr) {
                  V.error =
                    V.error ||
                    "Email address's domain name can not be converted to ASCII via punycode: " +
                      qr;
                }
              L[tt] = rt.join("@");
            }
            return V;
          },
          serialize: function (w, x) {
            var V = w,
              L = a(w.to);
            if (L) {
              for (var de = 0, pe = L.length; de < pe; ++de) {
                var Fe = String(L[de]),
                  Ye = Fe.lastIndexOf("@"),
                  at = Fe.slice(0, Ye)
                    .replace(io, Xa)
                    .replace(io, s)
                    .replace(t_, F),
                  je = Fe.slice(Ye + 1);
                try {
                  je = x.iri
                    ? N.toUnicode(je)
                    : N.toASCII(Ce(je, x).toLowerCase());
                } catch (tt) {
                  V.error =
                    V.error ||
                    "Email address's domain name can not be converted to " +
                      (x.iri ? "Unicode" : "ASCII") +
                      " via punycode: " +
                      tt;
                }
                L[de] = at + "@" + je;
              }
              V.path = L.join(",");
            }
            var Ke = (w.headers = w.headers || {});
            w.subject && (Ke.subject = w.subject), w.body && (Ke.body = w.body);
            var lt = [];
            for (var Ae in Ke)
              Ke[Ae] !== yn[Ae] &&
                lt.push(
                  Ae.replace(io, Xa).replace(io, s).replace(Af, F) +
                    "=" +
                    Ke[Ae].replace(io, Xa).replace(io, s).replace(r_, F)
                );
            return lt.length && (V.query = lt.join("&")), V;
          },
        },
        n_ = /^([^\:]+)\:(.*)/,
        Nf = {
          scheme: "urn",
          parse: function (w, x) {
            var V = w.path && w.path.match(n_),
              L = w;
            if (V) {
              var de = x.scheme || L.scheme || "urn",
                pe = V[1].toLowerCase(),
                Fe = V[2],
                Ye = de + ":" + (x.nid || pe),
                at = M[Ye];
              (L.nid = pe),
                (L.nss = Fe),
                (L.path = void 0),
                at && (L = at.parse(L, x));
            } else L.error = L.error || "URN can not be parsed.";
            return L;
          },
          serialize: function (w, x) {
            var V = x.scheme || w.scheme || "urn",
              L = w.nid,
              de = V + ":" + (x.nid || L),
              pe = M[de];
            pe && (w = pe.serialize(w, x));
            var Fe = w,
              Ye = w.nss;
            return (Fe.path = (L || x.nid) + ":" + Ye), Fe;
          },
        },
        o_ = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/,
        Pf = {
          scheme: "urn:uuid",
          parse: function (w, x) {
            var V = w;
            return (
              (V.uuid = V.nss),
              (V.nss = void 0),
              !x.tolerant &&
                (!V.uuid || !V.uuid.match(o_)) &&
                (V.error = V.error || "UUID is not valid."),
              V
            );
          },
          serialize: function (w, x) {
            var V = w;
            return (V.nss = (w.uuid || "").toLowerCase()), V;
          },
        };
      (M[ke.scheme] = ke),
        (M[st.scheme] = st),
        (M[Wt.scheme] = Wt),
        (M[zo.scheme] = zo),
        (M[Sf.scheme] = Sf),
        (M[Nf.scheme] = Nf),
        (M[Pf.scheme] = Pf),
        (r.SCHEMES = M),
        (r.pctEncChar = F),
        (r.pctDecChars = q),
        (r.parse = k),
        (r.removeDotSegments = X),
        (r.serialize = U),
        (r.resolveComponents = te),
        (r.resolve = se),
        (r.normalize = ie),
        (r.equal = ye),
        (r.escapeComponent = xe),
        (r.unescapeComponent = Ce),
        Object.defineProperty(r, "__esModule", { value: !0 });
    });
  })(hc, hc.exports);
  var iW = hc.exports;
  Object.defineProperty(Ku, "__esModule", { value: !0 });
  const Ly = iW;
  Ly.code = 'require("ajv/dist/runtime/uri").default';
  Ku.default = Ly;
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.CodeGen =
        e.Name =
        e.nil =
        e.stringify =
        e.str =
        e._ =
        e.KeywordCxt =
          void 0);
    var t = Yt;
    Object.defineProperty(e, "KeywordCxt", {
      enumerable: !0,
      get: function () {
        return t.KeywordCxt;
      },
    });
    var r = Ie;
    Object.defineProperty(e, "_", {
      enumerable: !0,
      get: function () {
        return r._;
      },
    }),
      Object.defineProperty(e, "str", {
        enumerable: !0,
        get: function () {
          return r.str;
        },
      }),
      Object.defineProperty(e, "stringify", {
        enumerable: !0,
        get: function () {
          return r.stringify;
        },
      }),
      Object.defineProperty(e, "nil", {
        enumerable: !0,
        get: function () {
          return r.nil;
        },
      }),
      Object.defineProperty(e, "Name", {
        enumerable: !0,
        get: function () {
          return r.Name;
        },
      }),
      Object.defineProperty(e, "CodeGen", {
        enumerable: !0,
        get: function () {
          return r.CodeGen;
        },
      });
    const n = Xi,
      o = Zi,
      i = Hn,
      s = Mt,
      a = Ie,
      l = $t,
      c = Ji,
      u = Ve,
      f = oW,
      d = Ku,
      p = (Q, I) => new RegExp(Q, I);
    p.code = "new RegExp";
    const h = ["removeAdditional", "useDefaults", "coerceTypes"],
      m = /* @__PURE__ */ new Set([
        "validate",
        "serialize",
        "parse",
        "wrapper",
        "root",
        "schema",
        "keyword",
        "pattern",
        "formats",
        "validate$data",
        "func",
        "obj",
        "Error",
      ]),
      v = {
        errorDataPath: "",
        format: "`validateFormats: false` can be used instead.",
        nullable: '"nullable" keyword is supported by default.',
        jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
        extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
        missingRefs:
          "Pass empty schema with $id that should be ignored to ajv.addSchema.",
        processCode:
          "Use option `code: {process: (code, schemaEnv: object) => string}`",
        sourceCode: "Use option `code: {source: true}`",
        strictDefaults: "It is default now, see option `strict`.",
        strictKeywords: "It is default now, see option `strict`.",
        uniqueItems: '"uniqueItems" keyword is always validated.',
        unknownFormats:
          "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
        cache: "Map is used as cache, schema object as key.",
        serialize: "Map is used as cache, schema object as key.",
        ajvErrors: "It is default now.",
      },
      g = {
        ignoreKeywordsWithRef: "",
        jsPropertySyntax: "",
        unicode:
          '"minLength"/"maxLength" account for unicode characters by default.',
      },
      _ = 200;
    function E(Q) {
      var I,
        R,
        P,
        y,
        $,
        N,
        M,
        F,
        q,
        ne,
        $e,
        Te,
        qe,
        b,
        T,
        k,
        K,
        H,
        J,
        ee,
        Y,
        X,
        U,
        te,
        se;
      const ie = Q.strict,
        ye = (I = Q.code) === null || I === void 0 ? void 0 : I.optimize,
        xe = ye === !0 || ye === void 0 ? 1 : ye || 0,
        Ce =
          (P = (R = Q.code) === null || R === void 0 ? void 0 : R.regExp) !==
            null && P !== void 0
            ? P
            : p,
        ke = (y = Q.uriResolver) !== null && y !== void 0 ? y : d.default;
      return {
        strictSchema:
          (N = ($ = Q.strictSchema) !== null && $ !== void 0 ? $ : ie) !==
            null && N !== void 0
            ? N
            : !0,
        strictNumbers:
          (F = (M = Q.strictNumbers) !== null && M !== void 0 ? M : ie) !==
            null && F !== void 0
            ? F
            : !0,
        strictTypes:
          (ne = (q = Q.strictTypes) !== null && q !== void 0 ? q : ie) !==
            null && ne !== void 0
            ? ne
            : "log",
        strictTuples:
          (Te = ($e = Q.strictTuples) !== null && $e !== void 0 ? $e : ie) !==
            null && Te !== void 0
            ? Te
            : "log",
        strictRequired:
          (b = (qe = Q.strictRequired) !== null && qe !== void 0 ? qe : ie) !==
            null && b !== void 0
            ? b
            : !1,
        code: Q.code
          ? { ...Q.code, optimize: xe, regExp: Ce }
          : { optimize: xe, regExp: Ce },
        loopRequired: (T = Q.loopRequired) !== null && T !== void 0 ? T : _,
        loopEnum: (k = Q.loopEnum) !== null && k !== void 0 ? k : _,
        meta: (K = Q.meta) !== null && K !== void 0 ? K : !0,
        messages: (H = Q.messages) !== null && H !== void 0 ? H : !0,
        inlineRefs: (J = Q.inlineRefs) !== null && J !== void 0 ? J : !0,
        schemaId: (ee = Q.schemaId) !== null && ee !== void 0 ? ee : "$id",
        addUsedSchema: (Y = Q.addUsedSchema) !== null && Y !== void 0 ? Y : !0,
        validateSchema:
          (X = Q.validateSchema) !== null && X !== void 0 ? X : !0,
        validateFormats:
          (U = Q.validateFormats) !== null && U !== void 0 ? U : !0,
        unicodeRegExp:
          (te = Q.unicodeRegExp) !== null && te !== void 0 ? te : !0,
        int32range: (se = Q.int32range) !== null && se !== void 0 ? se : !0,
        uriResolver: ke,
      };
    }
    class A {
      constructor(I = {}) {
        (this.schemas = {}),
          (this.refs = {}),
          (this.formats = {}),
          (this._compilations = /* @__PURE__ */ new Set()),
          (this._loading = {}),
          (this._cache = /* @__PURE__ */ new Map()),
          (I = this.opts = { ...I, ...E(I) });
        const { es5: R, lines: P } = this.opts.code;
        (this.scope = new a.ValueScope({
          scope: {},
          prefixes: m,
          es5: R,
          lines: P,
        })),
          (this.logger = G(I.logger));
        const y = I.validateFormats;
        (I.validateFormats = !1),
          (this.RULES = (0, i.getRules)()),
          D.call(this, v, I, "NOT SUPPORTED"),
          D.call(this, g, I, "DEPRECATED", "warn"),
          (this._metaOpts = W.call(this)),
          I.formats && j.call(this),
          this._addVocabularies(),
          this._addDefaultMetaSchema(),
          I.keywords && B.call(this, I.keywords),
          typeof I.meta == "object" && this.addMetaSchema(I.meta),
          O.call(this),
          (I.validateFormats = y);
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: I, meta: R, schemaId: P } = this.opts;
        let y = f;
        P === "id" && ((y = { ...f }), (y.id = y.$id), delete y.$id),
          R && I && this.addMetaSchema(y, y[P], !1);
      }
      defaultMeta() {
        const { meta: I, schemaId: R } = this.opts;
        return (this.opts.defaultMeta =
          typeof I == "object" ? I[R] || I : void 0);
      }
      validate(I, R) {
        let P;
        if (typeof I == "string") {
          if (((P = this.getSchema(I)), !P))
            throw new Error(`no schema with key or ref "${I}"`);
        } else P = this.compile(I);
        const y = P(R);
        return "$async" in P || (this.errors = P.errors), y;
      }
      compile(I, R) {
        const P = this._addSchema(I, R);
        return P.validate || this._compileSchemaEnv(P);
      }
      compileAsync(I, R) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: P } = this.opts;
        return y.call(this, I, R);
        async function y(ne, $e) {
          await $.call(this, ne.$schema);
          const Te = this._addSchema(ne, $e);
          return Te.validate || N.call(this, Te);
        }
        async function $(ne) {
          ne && !this.getSchema(ne) && (await y.call(this, { $ref: ne }, !0));
        }
        async function N(ne) {
          try {
            return this._compileSchemaEnv(ne);
          } catch ($e) {
            if (!($e instanceof o.default)) throw $e;
            return (
              M.call(this, $e),
              await F.call(this, $e.missingSchema),
              N.call(this, ne)
            );
          }
        }
        function M({ missingSchema: ne, missingRef: $e }) {
          if (this.refs[ne])
            throw new Error(
              `AnySchema ${ne} is loaded but ${$e} cannot be resolved`
            );
        }
        async function F(ne) {
          const $e = await q.call(this, ne);
          this.refs[ne] || (await $.call(this, $e.$schema)),
            this.refs[ne] || this.addSchema($e, ne, R);
        }
        async function q(ne) {
          const $e = this._loading[ne];
          if ($e) return $e;
          try {
            return await (this._loading[ne] = P(ne));
          } finally {
            delete this._loading[ne];
          }
        }
      }
      // Adds schema to the instance
      addSchema(I, R, P, y = this.opts.validateSchema) {
        if (Array.isArray(I)) {
          for (const N of I) this.addSchema(N, void 0, P, y);
          return this;
        }
        let $;
        if (typeof I == "object") {
          const { schemaId: N } = this.opts;
          if ((($ = I[N]), $ !== void 0 && typeof $ != "string"))
            throw new Error(`schema ${N} must be string`);
        }
        return (
          (R = (0, l.normalizeId)(R || $)),
          this._checkUnique(R),
          (this.schemas[R] = this._addSchema(I, P, R, y, !0)),
          this
        );
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(I, R, P = this.opts.validateSchema) {
        return this.addSchema(I, R, !0, P), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(I, R) {
        if (typeof I == "boolean") return !0;
        let P;
        if (((P = I.$schema), P !== void 0 && typeof P != "string"))
          throw new Error("$schema must be a string");
        if (((P = P || this.opts.defaultMeta || this.defaultMeta()), !P))
          return (
            this.logger.warn("meta-schema not available"),
            (this.errors = null),
            !0
          );
        const y = this.validate(P, I);
        if (!y && R) {
          const $ = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log") this.logger.error($);
          else throw new Error($);
        }
        return y;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(I) {
        let R;
        for (; typeof (R = S.call(this, I)) == "string"; ) I = R;
        if (R === void 0) {
          const { schemaId: P } = this.opts,
            y = new s.SchemaEnv({ schema: {}, schemaId: P });
          if (((R = s.resolveSchema.call(this, y, I)), !R)) return;
          this.refs[I] = R;
        }
        return R.validate || this._compileSchemaEnv(R);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(I) {
        if (I instanceof RegExp)
          return (
            this._removeAllSchemas(this.schemas, I),
            this._removeAllSchemas(this.refs, I),
            this
          );
        switch (typeof I) {
          case "undefined":
            return (
              this._removeAllSchemas(this.schemas),
              this._removeAllSchemas(this.refs),
              this._cache.clear(),
              this
            );
          case "string": {
            const R = S.call(this, I);
            return (
              typeof R == "object" && this._cache.delete(R.schema),
              delete this.schemas[I],
              delete this.refs[I],
              this
            );
          }
          case "object": {
            const R = I;
            this._cache.delete(R);
            let P = I[this.opts.schemaId];
            return (
              P &&
                ((P = (0, l.normalizeId)(P)),
                delete this.schemas[P],
                delete this.refs[P]),
              this
            );
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(I) {
        for (const R of I) this.addKeyword(R);
        return this;
      }
      addKeyword(I, R) {
        let P;
        if (typeof I == "string")
          (P = I),
            typeof R == "object" &&
              (this.logger.warn(
                "these parameters are deprecated, see docs for addKeyword"
              ),
              (R.keyword = P));
        else if (typeof I == "object" && R === void 0) {
          if (((R = I), (P = R.keyword), Array.isArray(P) && !P.length))
            throw new Error(
              "addKeywords: keyword must be string or non-empty array"
            );
        } else throw new Error("invalid addKeywords parameters");
        if ((ce.call(this, P, R), !R))
          return (0, u.eachItem)(P, $ => Pe.call(this, $)), this;
        ae.call(this, R);
        const y = {
          ...R,
          type: (0, c.getJSONTypes)(R.type),
          schemaType: (0, c.getJSONTypes)(R.schemaType),
        };
        return (
          (0, u.eachItem)(
            P,
            y.type.length === 0
              ? $ => Pe.call(this, $, y)
              : $ => y.type.forEach(N => Pe.call(this, $, y, N))
          ),
          this
        );
      }
      getKeyword(I) {
        const R = this.RULES.all[I];
        return typeof R == "object" ? R.definition : !!R;
      }
      // Remove keyword
      removeKeyword(I) {
        const { RULES: R } = this;
        delete R.keywords[I], delete R.all[I];
        for (const P of R.rules) {
          const y = P.rules.findIndex($ => $.keyword === I);
          y >= 0 && P.rules.splice(y, 1);
        }
        return this;
      }
      // Add format
      addFormat(I, R) {
        return (
          typeof R == "string" && (R = new RegExp(R)),
          (this.formats[I] = R),
          this
        );
      }
      errorsText(
        I = this.errors,
        { separator: R = ", ", dataVar: P = "data" } = {}
      ) {
        return !I || I.length === 0
          ? "No errors"
          : I.map(y => `${P}${y.instancePath} ${y.message}`).reduce(
              (y, $) => y + R + $
            );
      }
      $dataMetaSchema(I, R) {
        const P = this.RULES.all;
        I = JSON.parse(JSON.stringify(I));
        for (const y of R) {
          const $ = y.split("/").slice(1);
          let N = I;
          for (const M of $) N = N[M];
          for (const M in P) {
            const F = P[M];
            if (typeof F != "object") continue;
            const { $data: q } = F.definition,
              ne = N[M];
            q && ne && (N[M] = ze(ne));
          }
        }
        return I;
      }
      _removeAllSchemas(I, R) {
        for (const P in I) {
          const y = I[P];
          (!R || R.test(P)) &&
            (typeof y == "string"
              ? delete I[P]
              : y && !y.meta && (this._cache.delete(y.schema), delete I[P]));
        }
      }
      _addSchema(
        I,
        R,
        P,
        y = this.opts.validateSchema,
        $ = this.opts.addUsedSchema
      ) {
        let N;
        const { schemaId: M } = this.opts;
        if (typeof I == "object") N = I[M];
        else {
          if (this.opts.jtd) throw new Error("schema must be object");
          if (typeof I != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let F = this._cache.get(I);
        if (F !== void 0) return F;
        P = (0, l.normalizeId)(N || P);
        const q = l.getSchemaRefs.call(this, I, P);
        return (
          (F = new s.SchemaEnv({
            schema: I,
            schemaId: M,
            meta: R,
            baseId: P,
            localRefs: q,
          })),
          this._cache.set(F.schema, F),
          $ &&
            !P.startsWith("#") &&
            (P && this._checkUnique(P), (this.refs[P] = F)),
          y && this.validateSchema(I, !0),
          F
        );
      }
      _checkUnique(I) {
        if (this.schemas[I] || this.refs[I])
          throw new Error(`schema with key or id "${I}" already exists`);
      }
      _compileSchemaEnv(I) {
        if (
          (I.meta ? this._compileMetaSchema(I) : s.compileSchema.call(this, I),
          !I.validate)
        )
          throw new Error("ajv implementation error");
        return I.validate;
      }
      _compileMetaSchema(I) {
        const R = this.opts;
        this.opts = this._metaOpts;
        try {
          s.compileSchema.call(this, I);
        } finally {
          this.opts = R;
        }
      }
    }
    (e.default = A),
      (A.ValidationError = n.default),
      (A.MissingRefError = o.default);
    function D(Q, I, R, P = "error") {
      for (const y in Q) {
        const $ = y;
        $ in I && this.logger[P](`${R}: option ${y}. ${Q[$]}`);
      }
    }
    function S(Q) {
      return (Q = (0, l.normalizeId)(Q)), this.schemas[Q] || this.refs[Q];
    }
    function O() {
      const Q = this.opts.schemas;
      if (Q)
        if (Array.isArray(Q)) this.addSchema(Q);
        else for (const I in Q) this.addSchema(Q[I], I);
    }
    function j() {
      for (const Q in this.opts.formats) {
        const I = this.opts.formats[Q];
        I && this.addFormat(Q, I);
      }
    }
    function B(Q) {
      if (Array.isArray(Q)) {
        this.addVocabulary(Q);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const I in Q) {
        const R = Q[I];
        R.keyword || (R.keyword = I), this.addKeyword(R);
      }
    }
    function W() {
      const Q = { ...this.opts };
      for (const I of h) delete Q[I];
      return Q;
    }
    const re = { log() {}, warn() {}, error() {} };
    function G(Q) {
      if (Q === !1) return re;
      if (Q === void 0) return console;
      if (Q.log && Q.warn && Q.error) return Q;
      throw new Error("logger must implement log, warn and error methods");
    }
    const Se = /^[a-z_$][a-z0-9_$:-]*$/i;
    function ce(Q, I) {
      const { RULES: R } = this;
      if (
        ((0, u.eachItem)(Q, P => {
          if (R.keywords[P]) throw new Error(`Keyword ${P} is already defined`);
          if (!Se.test(P)) throw new Error(`Keyword ${P} has invalid name`);
        }),
        !!I && I.$data && !("code" in I || "validate" in I))
      )
        throw new Error(
          '$data keyword must have "code" or "validate" function'
        );
    }
    function Pe(Q, I, R) {
      var P;
      const y = I == null ? void 0 : I.post;
      if (R && y)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: $ } = this;
      let N = y ? $.post : $.rules.find(({ type: F }) => F === R);
      if (
        (N || ((N = { type: R, rules: [] }), $.rules.push(N)),
        ($.keywords[Q] = !0),
        !I)
      )
        return;
      const M = {
        keyword: Q,
        definition: {
          ...I,
          type: (0, c.getJSONTypes)(I.type),
          schemaType: (0, c.getJSONTypes)(I.schemaType),
        },
      };
      I.before ? _e.call(this, N, M, I.before) : N.rules.push(M),
        ($.all[Q] = M),
        (P = I.implements) === null ||
          P === void 0 ||
          P.forEach(F => this.addKeyword(F));
    }
    function _e(Q, I, R) {
      const P = Q.rules.findIndex(y => y.keyword === R);
      P >= 0
        ? Q.rules.splice(P, 0, I)
        : (Q.rules.push(I), this.logger.warn(`rule ${R} is not defined`));
    }
    function ae(Q) {
      let { metaSchema: I } = Q;
      I !== void 0 &&
        (Q.$data && this.opts.$data && (I = ze(I)),
        (Q.validateSchema = this.compile(I, !0)));
    }
    const me = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
    };
    function ze(Q) {
      return { anyOf: [Q, me] };
    }
  })(py);
  var Gu = {},
    qu = {},
    Yu = {};
  Object.defineProperty(Yu, "__esModule", { value: !0 });
  const sW = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    },
  };
  Yu.default = sW;
  var Kn = {};
  Object.defineProperty(Kn, "__esModule", { value: !0 });
  Kn.callRef = Kn.getValidate = void 0;
  const aW = Zi,
    xh = Re,
    Rt = Ie,
    co = lr,
    Dh = Mt,
    ys = Ve,
    lW = {
      keyword: "$ref",
      schemaType: "string",
      code(e) {
        const { gen: t, schema: r, it: n } = e,
          { baseId: o, schemaEnv: i, validateName: s, opts: a, self: l } = n,
          { root: c } = i;
        if ((r === "#" || r === "#/") && o === c.baseId) return f();
        const u = Dh.resolveRef.call(l, c, o, r);
        if (u === void 0) throw new aW.default(n.opts.uriResolver, o, r);
        if (u instanceof Dh.SchemaEnv) return d(u);
        return p(u);
        function f() {
          if (i === c) return xs(e, s, i, i.$async);
          const h = t.scopeValue("root", { ref: c });
          return xs(e, (0, Rt._)`${h}.validate`, c, c.$async);
        }
        function d(h) {
          const m = Vy(e, h);
          xs(e, m, h, h.$async);
        }
        function p(h) {
          const m = t.scopeValue(
              "schema",
              a.code.source === !0
                ? { ref: h, code: (0, Rt.stringify)(h) }
                : { ref: h }
            ),
            v = t.name("valid"),
            g = e.subschema(
              {
                schema: h,
                dataTypes: [],
                schemaPath: Rt.nil,
                topSchemaRef: m,
                errSchemaPath: r,
              },
              v
            );
          e.mergeEvaluated(g), e.ok(v);
        }
      },
    };
  function Vy(e, t) {
    const { gen: r } = e;
    return t.validate
      ? r.scopeValue("validate", { ref: t.validate })
      : (0, Rt._)`${r.scopeValue("wrapper", { ref: t })}.validate`;
  }
  Kn.getValidate = Vy;
  function xs(e, t, r, n) {
    const { gen: o, it: i } = e,
      { allErrors: s, schemaEnv: a, opts: l } = i,
      c = l.passContext ? co.default.this : Rt.nil;
    n ? u() : f();
    function u() {
      if (!a.$async) throw new Error("async schema referenced by sync schema");
      const h = o.let("valid");
      o.try(
        () => {
          o.code((0, Rt._)`await ${(0, xh.callValidateCode)(e, t, c)}`),
            p(t),
            s || o.assign(h, !0);
        },
        m => {
          o.if((0, Rt._)`!(${m} instanceof ${i.ValidationError})`, () =>
            o.throw(m)
          ),
            d(m),
            s || o.assign(h, !1);
        }
      ),
        e.ok(h);
    }
    function f() {
      e.result(
        (0, xh.callValidateCode)(e, t, c),
        () => p(t),
        () => d(t)
      );
    }
    function d(h) {
      const m = (0, Rt._)`${h}.errors`;
      o.assign(
        co.default.vErrors,
        (0,
        Rt._)`${co.default.vErrors} === null ? ${m} : ${co.default.vErrors}.concat(${m})`
      ),
        o.assign(co.default.errors, (0, Rt._)`${co.default.vErrors}.length`);
    }
    function p(h) {
      var m;
      if (!i.opts.unevaluated) return;
      const v =
        (m = r == null ? void 0 : r.validate) === null || m === void 0
          ? void 0
          : m.evaluated;
      if (i.props !== !0)
        if (v && !v.dynamicProps)
          v.props !== void 0 &&
            (i.props = ys.mergeEvaluated.props(o, v.props, i.props));
        else {
          const g = o.var("props", (0, Rt._)`${h}.evaluated.props`);
          i.props = ys.mergeEvaluated.props(o, g, i.props, Rt.Name);
        }
      if (i.items !== !0)
        if (v && !v.dynamicItems)
          v.items !== void 0 &&
            (i.items = ys.mergeEvaluated.items(o, v.items, i.items));
        else {
          const g = o.var("items", (0, Rt._)`${h}.evaluated.items`);
          i.items = ys.mergeEvaluated.items(o, g, i.items, Rt.Name);
        }
    }
  }
  Kn.callRef = xs;
  Kn.default = lW;
  Object.defineProperty(qu, "__esModule", { value: !0 });
  const cW = Yu,
    uW = Kn,
    fW = [
      "$schema",
      "$id",
      "$defs",
      "$vocabulary",
      { keyword: "$comment" },
      "definitions",
      cW.default,
      uW.default,
    ];
  qu.default = fW;
  var Ju = {},
    Xu = {};
  Object.defineProperty(Xu, "__esModule", { value: !0 });
  const sa = Ie,
    Qr = sa.operators,
    aa = {
      maximum: { okStr: "<=", ok: Qr.LTE, fail: Qr.GT },
      minimum: { okStr: ">=", ok: Qr.GTE, fail: Qr.LT },
      exclusiveMaximum: { okStr: "<", ok: Qr.LT, fail: Qr.GTE },
      exclusiveMinimum: { okStr: ">", ok: Qr.GT, fail: Qr.LTE },
    },
    dW = {
      message: ({ keyword: e, schemaCode: t }) =>
        (0, sa.str)`must be ${aa[e].okStr} ${t}`,
      params: ({ keyword: e, schemaCode: t }) =>
        (0, sa._)`{comparison: ${aa[e].okStr}, limit: ${t}}`,
    },
    pW = {
      keyword: Object.keys(aa),
      type: "number",
      schemaType: "number",
      $data: !0,
      error: dW,
      code(e) {
        const { keyword: t, data: r, schemaCode: n } = e;
        e.fail$data((0, sa._)`${r} ${aa[t].fail} ${n} || isNaN(${r})`);
      },
    };
  Xu.default = pW;
  var Zu = {};
  Object.defineProperty(Zu, "__esModule", { value: !0 });
  const yi = Ie,
    hW = {
      message: ({ schemaCode: e }) => (0, yi.str)`must be multiple of ${e}`,
      params: ({ schemaCode: e }) => (0, yi._)`{multipleOf: ${e}}`,
    },
    gW = {
      keyword: "multipleOf",
      type: "number",
      schemaType: "number",
      $data: !0,
      error: hW,
      code(e) {
        const { gen: t, data: r, schemaCode: n, it: o } = e,
          i = o.opts.multipleOfPrecision,
          s = t.let("res"),
          a = i
            ? (0, yi._)`Math.abs(Math.round(${s}) - ${s}) > 1e-${i}`
            : (0, yi._)`${s} !== parseInt(${s})`;
        e.fail$data((0, yi._)`(${n} === 0 || (${s} = ${r}/${n}, ${a}))`);
      },
    };
  Zu.default = gW;
  var Qu = {},
    ef = {};
  Object.defineProperty(ef, "__esModule", { value: !0 });
  function ky(e) {
    const t = e.length;
    let r = 0,
      n = 0,
      o;
    for (; n < t; )
      r++,
        (o = e.charCodeAt(n++)),
        o >= 55296 &&
          o <= 56319 &&
          n < t &&
          ((o = e.charCodeAt(n)), (o & 64512) === 56320 && n++);
    return r;
  }
  ef.default = ky;
  ky.code = 'require("ajv/dist/runtime/ucs2length").default';
  Object.defineProperty(Qu, "__esModule", { value: !0 });
  const Nn = Ie,
    mW = Ve,
    vW = ef,
    yW = {
      message({ keyword: e, schemaCode: t }) {
        const r = e === "maxLength" ? "more" : "fewer";
        return (0, Nn.str)`must NOT have ${r} than ${t} characters`;
      },
      params: ({ schemaCode: e }) => (0, Nn._)`{limit: ${e}}`,
    },
    _W = {
      keyword: ["maxLength", "minLength"],
      type: "string",
      schemaType: "number",
      $data: !0,
      error: yW,
      code(e) {
        const { keyword: t, data: r, schemaCode: n, it: o } = e,
          i = t === "maxLength" ? Nn.operators.GT : Nn.operators.LT,
          s =
            o.opts.unicode === !1
              ? (0, Nn._)`${r}.length`
              : (0, Nn._)`${(0, mW.useFunc)(e.gen, vW.default)}(${r})`;
        e.fail$data((0, Nn._)`${s} ${i} ${n}`);
      },
    };
  Qu.default = _W;
  var tf = {};
  Object.defineProperty(tf, "__esModule", { value: !0 });
  const $W = Re,
    la = Ie,
    bW = {
      message: ({ schemaCode: e }) => (0, la.str)`must match pattern "${e}"`,
      params: ({ schemaCode: e }) => (0, la._)`{pattern: ${e}}`,
    },
    wW = {
      keyword: "pattern",
      type: "string",
      schemaType: "string",
      $data: !0,
      error: bW,
      code(e) {
        const { data: t, $data: r, schema: n, schemaCode: o, it: i } = e,
          s = i.opts.unicodeRegExp ? "u" : "",
          a = r
            ? (0, la._)`(new RegExp(${o}, ${s}))`
            : (0, $W.usePattern)(e, n);
        e.fail$data((0, la._)`!${a}.test(${t})`);
      },
    };
  tf.default = wW;
  var rf = {};
  Object.defineProperty(rf, "__esModule", { value: !0 });
  const _i = Ie,
    EW = {
      message({ keyword: e, schemaCode: t }) {
        const r = e === "maxProperties" ? "more" : "fewer";
        return (0, _i.str)`must NOT have ${r} than ${t} properties`;
      },
      params: ({ schemaCode: e }) => (0, _i._)`{limit: ${e}}`,
    },
    OW = {
      keyword: ["maxProperties", "minProperties"],
      type: "object",
      schemaType: "number",
      $data: !0,
      error: EW,
      code(e) {
        const { keyword: t, data: r, schemaCode: n } = e,
          o = t === "maxProperties" ? _i.operators.GT : _i.operators.LT;
        e.fail$data((0, _i._)`Object.keys(${r}).length ${o} ${n}`);
      },
    };
  rf.default = OW;
  var nf = {};
  Object.defineProperty(nf, "__esModule", { value: !0 });
  const ri = Re,
    $i = Ie,
    AW = Ve,
    SW = {
      message: ({ params: { missingProperty: e } }) =>
        (0, $i.str)`must have required property '${e}'`,
      params: ({ params: { missingProperty: e } }) =>
        (0, $i._)`{missingProperty: ${e}}`,
    },
    NW = {
      keyword: "required",
      type: "object",
      schemaType: "array",
      $data: !0,
      error: SW,
      code(e) {
        const {
            gen: t,
            schema: r,
            schemaCode: n,
            data: o,
            $data: i,
            it: s,
          } = e,
          { opts: a } = s;
        if (!i && r.length === 0) return;
        const l = r.length >= a.loopRequired;
        if ((s.allErrors ? c() : u(), a.strictRequired)) {
          const p = e.parentSchema.properties,
            { definedProperties: h } = e.it;
          for (const m of r)
            if ((p == null ? void 0 : p[m]) === void 0 && !h.has(m)) {
              const v = s.schemaEnv.baseId + s.errSchemaPath,
                g = `required property "${m}" is not defined at "${v}" (strictRequired)`;
              (0, AW.checkStrictMode)(s, g, s.opts.strictRequired);
            }
        }
        function c() {
          if (l || i) e.block$data($i.nil, f);
          else for (const p of r) (0, ri.checkReportMissingProp)(e, p);
        }
        function u() {
          const p = t.let("missing");
          if (l || i) {
            const h = t.let("valid", !0);
            e.block$data(h, () => d(p, h)), e.ok(h);
          } else
            t.if((0, ri.checkMissingProp)(e, r, p)),
              (0, ri.reportMissingProp)(e, p),
              t.else();
        }
        function f() {
          t.forOf("prop", n, p => {
            e.setParams({ missingProperty: p }),
              t.if((0, ri.noPropertyInData)(t, o, p, a.ownProperties), () =>
                e.error()
              );
          });
        }
        function d(p, h) {
          e.setParams({ missingProperty: p }),
            t.forOf(
              p,
              n,
              () => {
                t.assign(h, (0, ri.propertyInData)(t, o, p, a.ownProperties)),
                  t.if((0, $i.not)(h), () => {
                    e.error(), t.break();
                  });
              },
              $i.nil
            );
        }
      },
    };
  nf.default = NW;
  var of = {};
  Object.defineProperty(of, "__esModule", { value: !0 });
  const bi = Ie,
    PW = {
      message({ keyword: e, schemaCode: t }) {
        const r = e === "maxItems" ? "more" : "fewer";
        return (0, bi.str)`must NOT have ${r} than ${t} items`;
      },
      params: ({ schemaCode: e }) => (0, bi._)`{limit: ${e}}`,
    },
    CW = {
      keyword: ["maxItems", "minItems"],
      type: "array",
      schemaType: "number",
      $data: !0,
      error: PW,
      code(e) {
        const { keyword: t, data: r, schemaCode: n } = e,
          o = t === "maxItems" ? bi.operators.GT : bi.operators.LT;
        e.fail$data((0, bi._)`${r}.length ${o} ${n}`);
      },
    };
  of.default = CW;
  var sf = {},
    Qi = {};
  Object.defineProperty(Qi, "__esModule", { value: !0 });
  const By = by;
  By.code = 'require("ajv/dist/runtime/equal").default';
  Qi.default = By;
  Object.defineProperty(sf, "__esModule", { value: !0 });
  const Cl = Ji,
    _t = Ie,
    TW = Ve,
    xW = Qi,
    DW = {
      message: ({ params: { i: e, j: t } }) =>
        (0,
        _t.str)`must NOT have duplicate items (items ## ${t} and ${e} are identical)`,
      params: ({ params: { i: e, j: t } }) => (0, _t._)`{i: ${e}, j: ${t}}`,
    },
    IW = {
      keyword: "uniqueItems",
      type: "array",
      schemaType: "boolean",
      $data: !0,
      error: DW,
      code(e) {
        const {
          gen: t,
          data: r,
          $data: n,
          schema: o,
          parentSchema: i,
          schemaCode: s,
          it: a,
        } = e;
        if (!n && !o) return;
        const l = t.let("valid"),
          c = i.items ? (0, Cl.getSchemaTypes)(i.items) : [];
        e.block$data(l, u, (0, _t._)`${s} === false`), e.ok(l);
        function u() {
          const h = t.let("i", (0, _t._)`${r}.length`),
            m = t.let("j");
          e.setParams({ i: h, j: m }),
            t.assign(l, !0),
            t.if((0, _t._)`${h} > 1`, () => (f() ? d : p)(h, m));
        }
        function f() {
          return c.length > 0 && !c.some(h => h === "object" || h === "array");
        }
        function d(h, m) {
          const v = t.name("item"),
            g = (0, Cl.checkDataTypes)(
              c,
              v,
              a.opts.strictNumbers,
              Cl.DataType.Wrong
            ),
            _ = t.const("indices", (0, _t._)`{}`);
          t.for((0, _t._)`;${h}--;`, () => {
            t.let(v, (0, _t._)`${r}[${h}]`),
              t.if(g, (0, _t._)`continue`),
              c.length > 1 &&
                t.if(
                  (0, _t._)`typeof ${v} == "string"`,
                  (0, _t._)`${v} += "_"`
                ),
              t
                .if((0, _t._)`typeof ${_}[${v}] == "number"`, () => {
                  t.assign(m, (0, _t._)`${_}[${v}]`),
                    e.error(),
                    t.assign(l, !1).break();
                })
                .code((0, _t._)`${_}[${v}] = ${h}`);
          });
        }
        function p(h, m) {
          const v = (0, TW.useFunc)(t, xW.default),
            g = t.name("outer");
          t.label(g).for((0, _t._)`;${h}--;`, () =>
            t.for((0, _t._)`${m} = ${h}; ${m}--;`, () =>
              t.if((0, _t._)`${v}(${r}[${h}], ${r}[${m}])`, () => {
                e.error(), t.assign(l, !1).break(g);
              })
            )
          );
        }
      },
    };
  sf.default = IW;
  var af = {};
  Object.defineProperty(af, "__esModule", { value: !0 });
  const gc = Ie,
    RW = Ve,
    MW = Qi,
    jW = {
      message: "must be equal to constant",
      params: ({ schemaCode: e }) => (0, gc._)`{allowedValue: ${e}}`,
    },
    FW = {
      keyword: "const",
      $data: !0,
      error: jW,
      code(e) {
        const { gen: t, data: r, $data: n, schemaCode: o, schema: i } = e;
        n || (i && typeof i == "object")
          ? e.fail$data(
              (0, gc._)`!${(0, RW.useFunc)(t, MW.default)}(${r}, ${o})`
            )
          : e.fail((0, gc._)`${i} !== ${r}`);
      },
    };
  af.default = FW;
  var lf = {};
  Object.defineProperty(lf, "__esModule", { value: !0 });
  const si = Ie,
    LW = Ve,
    VW = Qi,
    kW = {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: e }) => (0, si._)`{allowedValues: ${e}}`,
    },
    BW = {
      keyword: "enum",
      schemaType: "array",
      $data: !0,
      error: kW,
      code(e) {
        const {
          gen: t,
          data: r,
          $data: n,
          schema: o,
          schemaCode: i,
          it: s,
        } = e;
        if (!n && o.length === 0)
          throw new Error("enum must have non-empty array");
        const a = o.length >= s.opts.loopEnum;
        let l;
        const c = () => l ?? (l = (0, LW.useFunc)(t, VW.default));
        let u;
        if (a || n) (u = t.let("valid")), e.block$data(u, f);
        else {
          if (!Array.isArray(o)) throw new Error("ajv implementation error");
          const p = t.const("vSchema", i);
          u = (0, si.or)(...o.map((h, m) => d(p, m)));
        }
        e.pass(u);
        function f() {
          t.assign(u, !1),
            t.forOf("v", i, p =>
              t.if((0, si._)`${c()}(${r}, ${p})`, () => t.assign(u, !0).break())
            );
        }
        function d(p, h) {
          const m = o[h];
          return typeof m == "object" && m !== null
            ? (0, si._)`${c()}(${r}, ${p}[${h}])`
            : (0, si._)`${r} === ${m}`;
        }
      },
    };
  lf.default = BW;
  Object.defineProperty(Ju, "__esModule", { value: !0 });
  const zW = Xu,
    UW = Zu,
    WW = Qu,
    HW = tf,
    KW = rf,
    GW = nf,
    qW = of,
    YW = sf,
    JW = af,
    XW = lf,
    ZW = [
      // number
      zW.default,
      UW.default,
      // string
      WW.default,
      HW.default,
      // object
      KW.default,
      GW.default,
      // array
      qW.default,
      YW.default,
      // any
      { keyword: "type", schemaType: ["string", "array"] },
      { keyword: "nullable", schemaType: "boolean" },
      JW.default,
      XW.default,
    ];
  Ju.default = ZW;
  var cf = {},
    Vo = {};
  Object.defineProperty(Vo, "__esModule", { value: !0 });
  Vo.validateAdditionalItems = void 0;
  const Pn = Ie,
    mc = Ve,
    QW = {
      message: ({ params: { len: e } }) =>
        (0, Pn.str)`must NOT have more than ${e} items`,
      params: ({ params: { len: e } }) => (0, Pn._)`{limit: ${e}}`,
    },
    e9 = {
      keyword: "additionalItems",
      type: "array",
      schemaType: ["boolean", "object"],
      before: "uniqueItems",
      error: QW,
      code(e) {
        const { parentSchema: t, it: r } = e,
          { items: n } = t;
        if (!Array.isArray(n)) {
          (0, mc.checkStrictMode)(
            r,
            '"additionalItems" is ignored when "items" is not an array of schemas'
          );
          return;
        }
        zy(e, n);
      },
    };
  function zy(e, t) {
    const { gen: r, schema: n, data: o, keyword: i, it: s } = e;
    s.items = !0;
    const a = r.const("len", (0, Pn._)`${o}.length`);
    if (n === !1)
      e.setParams({ len: t.length }), e.pass((0, Pn._)`${a} <= ${t.length}`);
    else if (typeof n == "object" && !(0, mc.alwaysValidSchema)(s, n)) {
      const c = r.var("valid", (0, Pn._)`${a} <= ${t.length}`);
      r.if((0, Pn.not)(c), () => l(c)), e.ok(c);
    }
    function l(c) {
      r.forRange("i", t.length, a, u => {
        e.subschema({ keyword: i, dataProp: u, dataPropType: mc.Type.Num }, c),
          s.allErrors || r.if((0, Pn.not)(c), () => r.break());
      });
    }
  }
  Vo.validateAdditionalItems = zy;
  Vo.default = e9;
  var uf = {},
    ko = {};
  Object.defineProperty(ko, "__esModule", { value: !0 });
  ko.validateTuple = void 0;
  const Ih = Ie,
    Ds = Ve,
    t9 = Re,
    r9 = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "array", "boolean"],
      before: "uniqueItems",
      code(e) {
        const { schema: t, it: r } = e;
        if (Array.isArray(t)) return Uy(e, "additionalItems", t);
        (r.items = !0),
          !(0, Ds.alwaysValidSchema)(r, t) && e.ok((0, t9.validateArray)(e));
      },
    };
  function Uy(e, t, r = e.schema) {
    const { gen: n, parentSchema: o, data: i, keyword: s, it: a } = e;
    u(o),
      a.opts.unevaluated &&
        r.length &&
        a.items !== !0 &&
        (a.items = Ds.mergeEvaluated.items(n, r.length, a.items));
    const l = n.name("valid"),
      c = n.const("len", (0, Ih._)`${i}.length`);
    r.forEach((f, d) => {
      (0, Ds.alwaysValidSchema)(a, f) ||
        (n.if((0, Ih._)`${c} > ${d}`, () =>
          e.subschema(
            {
              keyword: s,
              schemaProp: d,
              dataProp: d,
            },
            l
          )
        ),
        e.ok(l));
    });
    function u(f) {
      const { opts: d, errSchemaPath: p } = a,
        h = r.length,
        m = h === f.minItems && (h === f.maxItems || f[t] === !1);
      if (d.strictTuples && !m) {
        const v = `"${s}" is ${h}-tuple, but minItems or maxItems/${t} are not specified or different at path "${p}"`;
        (0, Ds.checkStrictMode)(a, v, d.strictTuples);
      }
    }
  }
  ko.validateTuple = Uy;
  ko.default = r9;
  Object.defineProperty(uf, "__esModule", { value: !0 });
  const n9 = ko,
    o9 = {
      keyword: "prefixItems",
      type: "array",
      schemaType: ["array"],
      before: "uniqueItems",
      code: e => (0, n9.validateTuple)(e, "items"),
    };
  uf.default = o9;
  var ff = {};
  Object.defineProperty(ff, "__esModule", { value: !0 });
  const Rh = Ie,
    i9 = Ve,
    s9 = Re,
    a9 = Vo,
    l9 = {
      message: ({ params: { len: e } }) =>
        (0, Rh.str)`must NOT have more than ${e} items`,
      params: ({ params: { len: e } }) => (0, Rh._)`{limit: ${e}}`,
    },
    c9 = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      error: l9,
      code(e) {
        const { schema: t, parentSchema: r, it: n } = e,
          { prefixItems: o } = r;
        (n.items = !0),
          !(0, i9.alwaysValidSchema)(n, t) &&
            (o
              ? (0, a9.validateAdditionalItems)(e, o)
              : e.ok((0, s9.validateArray)(e)));
      },
    };
  ff.default = c9;
  var df = {};
  Object.defineProperty(df, "__esModule", { value: !0 });
  const Gt = Ie,
    _s = Ve,
    u9 = {
      message: ({ params: { min: e, max: t } }) =>
        t === void 0
          ? (0, Gt.str)`must contain at least ${e} valid item(s)`
          : (0,
            Gt.str)`must contain at least ${e} and no more than ${t} valid item(s)`,
      params: ({ params: { min: e, max: t } }) =>
        t === void 0
          ? (0, Gt._)`{minContains: ${e}}`
          : (0, Gt._)`{minContains: ${e}, maxContains: ${t}}`,
    },
    f9 = {
      keyword: "contains",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      trackErrors: !0,
      error: u9,
      code(e) {
        const { gen: t, schema: r, parentSchema: n, data: o, it: i } = e;
        let s, a;
        const { minContains: l, maxContains: c } = n;
        i.opts.next ? ((s = l === void 0 ? 1 : l), (a = c)) : (s = 1);
        const u = t.const("len", (0, Gt._)`${o}.length`);
        if ((e.setParams({ min: s, max: a }), a === void 0 && s === 0)) {
          (0, _s.checkStrictMode)(
            i,
            '"minContains" == 0 without "maxContains": "contains" keyword ignored'
          );
          return;
        }
        if (a !== void 0 && s > a) {
          (0, _s.checkStrictMode)(
            i,
            '"minContains" > "maxContains" is always invalid'
          ),
            e.fail();
          return;
        }
        if ((0, _s.alwaysValidSchema)(i, r)) {
          let m = (0, Gt._)`${u} >= ${s}`;
          a !== void 0 && (m = (0, Gt._)`${m} && ${u} <= ${a}`), e.pass(m);
          return;
        }
        i.items = !0;
        const f = t.name("valid");
        a === void 0 && s === 1
          ? p(f, () => t.if(f, () => t.break()))
          : s === 0
            ? (t.let(f, !0),
              a !== void 0 && t.if((0, Gt._)`${o}.length > 0`, d))
            : (t.let(f, !1), d()),
          e.result(f, () => e.reset());
        function d() {
          const m = t.name("_valid"),
            v = t.let("count", 0);
          p(m, () => t.if(m, () => h(v)));
        }
        function p(m, v) {
          t.forRange("i", 0, u, g => {
            e.subschema(
              {
                keyword: "contains",
                dataProp: g,
                dataPropType: _s.Type.Num,
                compositeRule: !0,
              },
              m
            ),
              v();
          });
        }
        function h(m) {
          t.code((0, Gt._)`${m}++`),
            a === void 0
              ? t.if((0, Gt._)`${m} >= ${s}`, () => t.assign(f, !0).break())
              : (t.if((0, Gt._)`${m} > ${a}`, () => t.assign(f, !1).break()),
                s === 1
                  ? t.assign(f, !0)
                  : t.if((0, Gt._)`${m} >= ${s}`, () => t.assign(f, !0)));
        }
      },
    };
  df.default = f9;
  var Wy = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0);
    const t = Ie,
      r = Ve,
      n = Re;
    e.error = {
      message: ({ params: { property: l, depsCount: c, deps: u } }) => {
        const f = c === 1 ? "property" : "properties";
        return (0, t.str)`must have ${f} ${u} when property ${l} is present`;
      },
      params: ({
        params: { property: l, depsCount: c, deps: u, missingProperty: f },
      }) => (0, t._)`{property: ${l},
    missingProperty: ${f},
    depsCount: ${c},
    deps: ${u}}`,
      // TODO change to reference
    };
    const o = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: e.error,
      code(l) {
        const [c, u] = i(l);
        s(l, c), a(l, u);
      },
    };
    function i({ schema: l }) {
      const c = {},
        u = {};
      for (const f in l) {
        if (f === "__proto__") continue;
        const d = Array.isArray(l[f]) ? c : u;
        d[f] = l[f];
      }
      return [c, u];
    }
    function s(l, c = l.schema) {
      const { gen: u, data: f, it: d } = l;
      if (Object.keys(c).length === 0) return;
      const p = u.let("missing");
      for (const h in c) {
        const m = c[h];
        if (m.length === 0) continue;
        const v = (0, n.propertyInData)(u, f, h, d.opts.ownProperties);
        l.setParams({
          property: h,
          depsCount: m.length,
          deps: m.join(", "),
        }),
          d.allErrors
            ? u.if(v, () => {
                for (const g of m) (0, n.checkReportMissingProp)(l, g);
              })
            : (u.if((0, t._)`${v} && (${(0, n.checkMissingProp)(l, m, p)})`),
              (0, n.reportMissingProp)(l, p),
              u.else());
      }
    }
    e.validatePropertyDeps = s;
    function a(l, c = l.schema) {
      const { gen: u, data: f, keyword: d, it: p } = l,
        h = u.name("valid");
      for (const m in c)
        (0, r.alwaysValidSchema)(p, c[m]) ||
          (u.if(
            (0, n.propertyInData)(u, f, m, p.opts.ownProperties),
            () => {
              const v = l.subschema({ keyword: d, schemaProp: m }, h);
              l.mergeValidEvaluated(v, h);
            },
            () => u.var(h, !0)
            // TODO var
          ),
          l.ok(h));
    }
    (e.validateSchemaDeps = a), (e.default = o);
  })(Wy);
  var pf = {};
  Object.defineProperty(pf, "__esModule", { value: !0 });
  const Hy = Ie,
    d9 = Ve,
    p9 = {
      message: "property name must be valid",
      params: ({ params: e }) => (0, Hy._)`{propertyName: ${e.propertyName}}`,
    },
    h9 = {
      keyword: "propertyNames",
      type: "object",
      schemaType: ["object", "boolean"],
      error: p9,
      code(e) {
        const { gen: t, schema: r, data: n, it: o } = e;
        if ((0, d9.alwaysValidSchema)(o, r)) return;
        const i = t.name("valid");
        t.forIn("key", n, s => {
          e.setParams({ propertyName: s }),
            e.subschema(
              {
                keyword: "propertyNames",
                data: s,
                dataTypes: ["string"],
                propertyName: s,
                compositeRule: !0,
              },
              i
            ),
            t.if((0, Hy.not)(i), () => {
              e.error(!0), o.allErrors || t.break();
            });
        }),
          e.ok(i);
      },
    };
  pf.default = h9;
  var Ja = {};
  Object.defineProperty(Ja, "__esModule", { value: !0 });
  const $s = Re,
    tr = Ie,
    g9 = lr,
    bs = Ve,
    m9 = {
      message: "must NOT have additional properties",
      params: ({ params: e }) =>
        (0, tr._)`{additionalProperty: ${e.additionalProperty}}`,
    },
    v9 = {
      keyword: "additionalProperties",
      type: ["object"],
      schemaType: ["boolean", "object"],
      allowUndefined: !0,
      trackErrors: !0,
      error: m9,
      code(e) {
        const {
          gen: t,
          schema: r,
          parentSchema: n,
          data: o,
          errsCount: i,
          it: s,
        } = e;
        if (!i) throw new Error("ajv implementation error");
        const { allErrors: a, opts: l } = s;
        if (
          ((s.props = !0),
          l.removeAdditional !== "all" && (0, bs.alwaysValidSchema)(s, r))
        )
          return;
        const c = (0, $s.allSchemaProperties)(n.properties),
          u = (0, $s.allSchemaProperties)(n.patternProperties);
        f(), e.ok((0, tr._)`${i} === ${g9.default.errors}`);
        function f() {
          t.forIn("key", o, v => {
            !c.length && !u.length ? h(v) : t.if(d(v), () => h(v));
          });
        }
        function d(v) {
          let g;
          if (c.length > 8) {
            const _ = (0, bs.schemaRefOrVal)(s, n.properties, "properties");
            g = (0, $s.isOwnProperty)(t, _, v);
          } else
            c.length
              ? (g = (0, tr.or)(...c.map(_ => (0, tr._)`${v} === ${_}`)))
              : (g = tr.nil);
          return (
            u.length &&
              (g = (0, tr.or)(
                g,
                ...u.map(_ => (0, tr._)`${(0, $s.usePattern)(e, _)}.test(${v})`)
              )),
            (0, tr.not)(g)
          );
        }
        function p(v) {
          t.code((0, tr._)`delete ${o}[${v}]`);
        }
        function h(v) {
          if (
            l.removeAdditional === "all" ||
            (l.removeAdditional && r === !1)
          ) {
            p(v);
            return;
          }
          if (r === !1) {
            e.setParams({ additionalProperty: v }), e.error(), a || t.break();
            return;
          }
          if (typeof r == "object" && !(0, bs.alwaysValidSchema)(s, r)) {
            const g = t.name("valid");
            l.removeAdditional === "failing"
              ? (m(v, g, !1),
                t.if((0, tr.not)(g), () => {
                  e.reset(), p(v);
                }))
              : (m(v, g), a || t.if((0, tr.not)(g), () => t.break()));
          }
        }
        function m(v, g, _) {
          const E = {
            keyword: "additionalProperties",
            dataProp: v,
            dataPropType: bs.Type.Str,
          };
          _ === !1 &&
            Object.assign(E, {
              compositeRule: !0,
              createErrors: !1,
              allErrors: !1,
            }),
            e.subschema(E, g);
        }
      },
    };
  Ja.default = v9;
  var hf = {};
  Object.defineProperty(hf, "__esModule", { value: !0 });
  const y9 = Yt,
    Mh = Re,
    Tl = Ve,
    jh = Ja,
    _9 = {
      keyword: "properties",
      type: "object",
      schemaType: "object",
      code(e) {
        const { gen: t, schema: r, parentSchema: n, data: o, it: i } = e;
        i.opts.removeAdditional === "all" &&
          n.additionalProperties === void 0 &&
          jh.default.code(
            new y9.KeywordCxt(i, jh.default, "additionalProperties")
          );
        const s = (0, Mh.allSchemaProperties)(r);
        for (const f of s) i.definedProperties.add(f);
        i.opts.unevaluated &&
          s.length &&
          i.props !== !0 &&
          (i.props = Tl.mergeEvaluated.props(t, (0, Tl.toHash)(s), i.props));
        const a = s.filter(f => !(0, Tl.alwaysValidSchema)(i, r[f]));
        if (a.length === 0) return;
        const l = t.name("valid");
        for (const f of a)
          c(f)
            ? u(f)
            : (t.if((0, Mh.propertyInData)(t, o, f, i.opts.ownProperties)),
              u(f),
              i.allErrors || t.else().var(l, !0),
              t.endIf()),
            e.it.definedProperties.add(f),
            e.ok(l);
        function c(f) {
          return (
            i.opts.useDefaults && !i.compositeRule && r[f].default !== void 0
          );
        }
        function u(f) {
          e.subschema(
            {
              keyword: "properties",
              schemaProp: f,
              dataProp: f,
            },
            l
          );
        }
      },
    };
  hf.default = _9;
  var gf = {};
  Object.defineProperty(gf, "__esModule", { value: !0 });
  const Fh = Re,
    ws = Ie,
    Lh = Ve,
    Vh = Ve,
    $9 = {
      keyword: "patternProperties",
      type: "object",
      schemaType: "object",
      code(e) {
        const { gen: t, schema: r, data: n, parentSchema: o, it: i } = e,
          { opts: s } = i,
          a = (0, Fh.allSchemaProperties)(r),
          l = a.filter(m => (0, Lh.alwaysValidSchema)(i, r[m]));
        if (
          a.length === 0 ||
          (l.length === a.length && (!i.opts.unevaluated || i.props === !0))
        )
          return;
        const c = s.strictSchema && !s.allowMatchingProperties && o.properties,
          u = t.name("valid");
        i.props !== !0 &&
          !(i.props instanceof ws.Name) &&
          (i.props = (0, Vh.evaluatedPropsToName)(t, i.props));
        const { props: f } = i;
        d();
        function d() {
          for (const m of a)
            c && p(m), i.allErrors ? h(m) : (t.var(u, !0), h(m), t.if(u));
        }
        function p(m) {
          for (const v in c)
            new RegExp(m).test(v) &&
              (0, Lh.checkStrictMode)(
                i,
                `property ${v} matches pattern ${m} (use allowMatchingProperties)`
              );
        }
        function h(m) {
          t.forIn("key", n, v => {
            t.if((0, ws._)`${(0, Fh.usePattern)(e, m)}.test(${v})`, () => {
              const g = l.includes(m);
              g ||
                e.subschema(
                  {
                    keyword: "patternProperties",
                    schemaProp: m,
                    dataProp: v,
                    dataPropType: Vh.Type.Str,
                  },
                  u
                ),
                i.opts.unevaluated && f !== !0
                  ? t.assign((0, ws._)`${f}[${v}]`, !0)
                  : !g && !i.allErrors && t.if((0, ws.not)(u), () => t.break());
            });
          });
        }
      },
    };
  gf.default = $9;
  var mf = {};
  Object.defineProperty(mf, "__esModule", { value: !0 });
  const b9 = Ve,
    w9 = {
      keyword: "not",
      schemaType: ["object", "boolean"],
      trackErrors: !0,
      code(e) {
        const { gen: t, schema: r, it: n } = e;
        if ((0, b9.alwaysValidSchema)(n, r)) {
          e.fail();
          return;
        }
        const o = t.name("valid");
        e.subschema(
          {
            keyword: "not",
            compositeRule: !0,
            createErrors: !1,
            allErrors: !1,
          },
          o
        ),
          e.failResult(
            o,
            () => e.reset(),
            () => e.error()
          );
      },
      error: { message: "must NOT be valid" },
    };
  mf.default = w9;
  var vf = {};
  Object.defineProperty(vf, "__esModule", { value: !0 });
  const E9 = Re,
    O9 = {
      keyword: "anyOf",
      schemaType: "array",
      trackErrors: !0,
      code: E9.validateUnion,
      error: { message: "must match a schema in anyOf" },
    };
  vf.default = O9;
  var yf = {};
  Object.defineProperty(yf, "__esModule", { value: !0 });
  const Is = Ie,
    A9 = Ve,
    S9 = {
      message: "must match exactly one schema in oneOf",
      params: ({ params: e }) => (0, Is._)`{passingSchemas: ${e.passing}}`,
    },
    N9 = {
      keyword: "oneOf",
      schemaType: "array",
      trackErrors: !0,
      error: S9,
      code(e) {
        const { gen: t, schema: r, parentSchema: n, it: o } = e;
        if (!Array.isArray(r)) throw new Error("ajv implementation error");
        if (o.opts.discriminator && n.discriminator) return;
        const i = r,
          s = t.let("valid", !1),
          a = t.let("passing", null),
          l = t.name("_valid");
        e.setParams({ passing: a }),
          t.block(c),
          e.result(
            s,
            () => e.reset(),
            () => e.error(!0)
          );
        function c() {
          i.forEach((u, f) => {
            let d;
            (0, A9.alwaysValidSchema)(o, u)
              ? t.var(l, !0)
              : (d = e.subschema(
                  {
                    keyword: "oneOf",
                    schemaProp: f,
                    compositeRule: !0,
                  },
                  l
                )),
              f > 0 &&
                t
                  .if((0, Is._)`${l} && ${s}`)
                  .assign(s, !1)
                  .assign(a, (0, Is._)`[${a}, ${f}]`)
                  .else(),
              t.if(l, () => {
                t.assign(s, !0),
                  t.assign(a, f),
                  d && e.mergeEvaluated(d, Is.Name);
              });
          });
        }
      },
    };
  yf.default = N9;
  var _f = {};
  Object.defineProperty(_f, "__esModule", { value: !0 });
  const P9 = Ve,
    C9 = {
      keyword: "allOf",
      schemaType: "array",
      code(e) {
        const { gen: t, schema: r, it: n } = e;
        if (!Array.isArray(r)) throw new Error("ajv implementation error");
        const o = t.name("valid");
        r.forEach((i, s) => {
          if ((0, P9.alwaysValidSchema)(n, i)) return;
          const a = e.subschema({ keyword: "allOf", schemaProp: s }, o);
          e.ok(o), e.mergeEvaluated(a);
        });
      },
    };
  _f.default = C9;
  var $f = {};
  Object.defineProperty($f, "__esModule", { value: !0 });
  const ca = Ie,
    Ky = Ve,
    T9 = {
      message: ({ params: e }) =>
        (0, ca.str)`must match "${e.ifClause}" schema`,
      params: ({ params: e }) => (0, ca._)`{failingKeyword: ${e.ifClause}}`,
    },
    x9 = {
      keyword: "if",
      schemaType: ["object", "boolean"],
      trackErrors: !0,
      error: T9,
      code(e) {
        const { gen: t, parentSchema: r, it: n } = e;
        r.then === void 0 &&
          r.else === void 0 &&
          (0, Ky.checkStrictMode)(
            n,
            '"if" without "then" and "else" is ignored'
          );
        const o = kh(n, "then"),
          i = kh(n, "else");
        if (!o && !i) return;
        const s = t.let("valid", !0),
          a = t.name("_valid");
        if ((l(), e.reset(), o && i)) {
          const u = t.let("ifClause");
          e.setParams({ ifClause: u }), t.if(a, c("then", u), c("else", u));
        } else o ? t.if(a, c("then")) : t.if((0, ca.not)(a), c("else"));
        e.pass(s, () => e.error(!0));
        function l() {
          const u = e.subschema(
            {
              keyword: "if",
              compositeRule: !0,
              createErrors: !1,
              allErrors: !1,
            },
            a
          );
          e.mergeEvaluated(u);
        }
        function c(u, f) {
          return () => {
            const d = e.subschema({ keyword: u }, a);
            t.assign(s, a),
              e.mergeValidEvaluated(d, s),
              f ? t.assign(f, (0, ca._)`${u}`) : e.setParams({ ifClause: u });
          };
        }
      },
    };
  function kh(e, t) {
    const r = e.schema[t];
    return r !== void 0 && !(0, Ky.alwaysValidSchema)(e, r);
  }
  $f.default = x9;
  var bf = {};
  Object.defineProperty(bf, "__esModule", { value: !0 });
  const D9 = Ve,
    I9 = {
      keyword: ["then", "else"],
      schemaType: ["object", "boolean"],
      code({ keyword: e, parentSchema: t, it: r }) {
        t.if === void 0 &&
          (0, D9.checkStrictMode)(r, `"${e}" without "if" is ignored`);
      },
    };
  bf.default = I9;
  Object.defineProperty(cf, "__esModule", { value: !0 });
  const R9 = Vo,
    M9 = uf,
    j9 = ko,
    F9 = ff,
    L9 = df,
    V9 = Wy,
    k9 = pf,
    B9 = Ja,
    z9 = hf,
    U9 = gf,
    W9 = mf,
    H9 = vf,
    K9 = yf,
    G9 = _f,
    q9 = $f,
    Y9 = bf;
  function J9(e = !1) {
    const t = [
      // any
      W9.default,
      H9.default,
      K9.default,
      G9.default,
      q9.default,
      Y9.default,
      // object
      k9.default,
      B9.default,
      V9.default,
      z9.default,
      U9.default,
    ];
    return (
      e ? t.push(M9.default, F9.default) : t.push(R9.default, j9.default),
      t.push(L9.default),
      t
    );
  }
  cf.default = J9;
  var wf = {},
    Ef = {};
  Object.defineProperty(Ef, "__esModule", { value: !0 });
  const ct = Ie,
    X9 = {
      message: ({ schemaCode: e }) => (0, ct.str)`must match format "${e}"`,
      params: ({ schemaCode: e }) => (0, ct._)`{format: ${e}}`,
    },
    Z9 = {
      keyword: "format",
      type: ["number", "string"],
      schemaType: "string",
      $data: !0,
      error: X9,
      code(e, t) {
        const {
            gen: r,
            data: n,
            $data: o,
            schema: i,
            schemaCode: s,
            it: a,
          } = e,
          { opts: l, errSchemaPath: c, schemaEnv: u, self: f } = a;
        if (!l.validateFormats) return;
        o ? d() : p();
        function d() {
          const h = r.scopeValue("formats", {
              ref: f.formats,
              code: l.code.formats,
            }),
            m = r.const("fDef", (0, ct._)`${h}[${s}]`),
            v = r.let("fType"),
            g = r.let("format");
          r.if(
            (0, ct._)`typeof ${m} == "object" && !(${m} instanceof RegExp)`,
            () =>
              r
                .assign(v, (0, ct._)`${m}.type || "string"`)
                .assign(g, (0, ct._)`${m}.validate`),
            () => r.assign(v, (0, ct._)`"string"`).assign(g, m)
          ),
            e.fail$data((0, ct.or)(_(), E()));
          function _() {
            return l.strictSchema === !1 ? ct.nil : (0, ct._)`${s} && !${g}`;
          }
          function E() {
            const A = u.$async
                ? (0, ct._)`(${m}.async ? await ${g}(${n}) : ${g}(${n}))`
                : (0, ct._)`${g}(${n})`,
              D = (0,
              ct._)`(typeof ${g} == "function" ? ${A} : ${g}.test(${n}))`;
            return (0, ct._)`${g} && ${g} !== true && ${v} === ${t} && !${D}`;
          }
        }
        function p() {
          const h = f.formats[i];
          if (!h) {
            _();
            return;
          }
          if (h === !0) return;
          const [m, v, g] = E(h);
          m === t && e.pass(A());
          function _() {
            if (l.strictSchema === !1) {
              f.logger.warn(D());
              return;
            }
            throw new Error(D());
            function D() {
              return `unknown format "${i}" ignored in schema at path "${c}"`;
            }
          }
          function E(D) {
            const S =
                D instanceof RegExp
                  ? (0, ct.regexpCode)(D)
                  : l.code.formats
                    ? (0, ct._)`${l.code.formats}${(0, ct.getProperty)(i)}`
                    : void 0,
              O = r.scopeValue("formats", { key: i, ref: D, code: S });
            return typeof D == "object" && !(D instanceof RegExp)
              ? [D.type || "string", D.validate, (0, ct._)`${O}.validate`]
              : ["string", D, O];
          }
          function A() {
            if (typeof h == "object" && !(h instanceof RegExp) && h.async) {
              if (!u.$async) throw new Error("async format in sync schema");
              return (0, ct._)`await ${g}(${n})`;
            }
            return typeof v == "function"
              ? (0, ct._)`${g}(${n})`
              : (0, ct._)`${g}.test(${n})`;
          }
        }
      },
    };
  Ef.default = Z9;
  Object.defineProperty(wf, "__esModule", { value: !0 });
  const Q9 = Ef,
    eH = [Q9.default];
  wf.default = eH;
  var Oo = {};
  Object.defineProperty(Oo, "__esModule", { value: !0 });
  Oo.contentVocabulary = Oo.metadataVocabulary = void 0;
  Oo.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples",
  ];
  Oo.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema",
  ];
  Object.defineProperty(Gu, "__esModule", { value: !0 });
  const tH = qu,
    rH = Ju,
    nH = cf,
    oH = wf,
    Bh = Oo,
    iH = [
      tH.default,
      rH.default,
      (0, nH.default)(),
      oH.default,
      Bh.metadataVocabulary,
      Bh.contentVocabulary,
    ];
  Gu.default = iH;
  var Of = {},
    Gy = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.DiscrError = void 0),
      (function (t) {
        (t.Tag = "tag"), (t.Mapping = "mapping");
      })(e.DiscrError || (e.DiscrError = {}));
  })(Gy);
  Object.defineProperty(Of, "__esModule", { value: !0 });
  const fo = Ie,
    vc = Gy,
    zh = Mt,
    sH = Ve,
    aH = {
      message: ({ params: { discrError: e, tagName: t } }) =>
        e === vc.DiscrError.Tag
          ? `tag "${t}" must be string`
          : `value of tag "${t}" must be in oneOf`,
      params: ({ params: { discrError: e, tag: t, tagName: r } }) =>
        (0, fo._)`{error: ${e}, tag: ${r}, tagValue: ${t}}`,
    },
    lH = {
      keyword: "discriminator",
      type: "object",
      schemaType: "object",
      error: aH,
      code(e) {
        const { gen: t, data: r, schema: n, parentSchema: o, it: i } = e,
          { oneOf: s } = o;
        if (!i.opts.discriminator)
          throw new Error("discriminator: requires discriminator option");
        const a = n.propertyName;
        if (typeof a != "string")
          throw new Error("discriminator: requires propertyName");
        if (n.mapping)
          throw new Error("discriminator: mapping is not supported");
        if (!s) throw new Error("discriminator: requires oneOf keyword");
        const l = t.let("valid", !1),
          c = t.const("tag", (0, fo._)`${r}${(0, fo.getProperty)(a)}`);
        t.if(
          (0, fo._)`typeof ${c} == "string"`,
          () => u(),
          () =>
            e.error(!1, { discrError: vc.DiscrError.Tag, tag: c, tagName: a })
        ),
          e.ok(l);
        function u() {
          const p = d();
          t.if(!1);
          for (const h in p)
            t.elseIf((0, fo._)`${c} === ${h}`), t.assign(l, f(p[h]));
          t.else(),
            e.error(!1, {
              discrError: vc.DiscrError.Mapping,
              tag: c,
              tagName: a,
            }),
            t.endIf();
        }
        function f(p) {
          const h = t.name("valid"),
            m = e.subschema({ keyword: "oneOf", schemaProp: p }, h);
          return e.mergeEvaluated(m, fo.Name), h;
        }
        function d() {
          var p;
          const h = {},
            m = g(o);
          let v = !0;
          for (let A = 0; A < s.length; A++) {
            let D = s[A];
            D != null &&
              D.$ref &&
              !(0, sH.schemaHasRulesButRef)(D, i.self.RULES) &&
              ((D = zh.resolveRef.call(
                i.self,
                i.schemaEnv.root,
                i.baseId,
                D == null ? void 0 : D.$ref
              )),
              D instanceof zh.SchemaEnv && (D = D.schema));
            const S =
              (p = D == null ? void 0 : D.properties) === null || p === void 0
                ? void 0
                : p[a];
            if (typeof S != "object")
              throw new Error(
                `discriminator: oneOf subschemas (or referenced schemas) must have "properties/${a}"`
              );
            (v = v && (m || g(D))), _(S, A);
          }
          if (!v) throw new Error(`discriminator: "${a}" must be required`);
          return h;
          function g({ required: A }) {
            return Array.isArray(A) && A.includes(a);
          }
          function _(A, D) {
            if (A.const) E(A.const, D);
            else if (A.enum) for (const S of A.enum) E(S, D);
            else
              throw new Error(
                `discriminator: "properties/${a}" must have "const" or "enum"`
              );
          }
          function E(A, D) {
            if (typeof A != "string" || A in h)
              throw new Error(
                `discriminator: "${a}" values must be unique strings`
              );
            h[A] = D;
          }
        }
      },
    };
  Of.default = lH;
  const cH = "http://json-schema.org/draft-07/schema#",
    uH = "http://json-schema.org/draft-07/schema#",
    fH = "Core schema meta-schema",
    dH = {
      schemaArray: {
        type: "array",
        minItems: 1,
        items: {
          $ref: "#",
        },
      },
      nonNegativeInteger: {
        type: "integer",
        minimum: 0,
      },
      nonNegativeIntegerDefault0: {
        allOf: [
          {
            $ref: "#/definitions/nonNegativeInteger",
          },
          {
            default: 0,
          },
        ],
      },
      simpleTypes: {
        enum: [
          "array",
          "boolean",
          "integer",
          "null",
          "number",
          "object",
          "string",
        ],
      },
      stringArray: {
        type: "array",
        items: {
          type: "string",
        },
        uniqueItems: !0,
        default: [],
      },
    },
    pH = ["object", "boolean"],
    hH = {
      $id: {
        type: "string",
        format: "uri-reference",
      },
      $schema: {
        type: "string",
        format: "uri",
      },
      $ref: {
        type: "string",
        format: "uri-reference",
      },
      $comment: {
        type: "string",
      },
      title: {
        type: "string",
      },
      description: {
        type: "string",
      },
      default: !0,
      readOnly: {
        type: "boolean",
        default: !1,
      },
      examples: {
        type: "array",
        items: !0,
      },
      multipleOf: {
        type: "number",
        exclusiveMinimum: 0,
      },
      maximum: {
        type: "number",
      },
      exclusiveMaximum: {
        type: "number",
      },
      minimum: {
        type: "number",
      },
      exclusiveMinimum: {
        type: "number",
      },
      maxLength: {
        $ref: "#/definitions/nonNegativeInteger",
      },
      minLength: {
        $ref: "#/definitions/nonNegativeIntegerDefault0",
      },
      pattern: {
        type: "string",
        format: "regex",
      },
      additionalItems: {
        $ref: "#",
      },
      items: {
        anyOf: [
          {
            $ref: "#",
          },
          {
            $ref: "#/definitions/schemaArray",
          },
        ],
        default: !0,
      },
      maxItems: {
        $ref: "#/definitions/nonNegativeInteger",
      },
      minItems: {
        $ref: "#/definitions/nonNegativeIntegerDefault0",
      },
      uniqueItems: {
        type: "boolean",
        default: !1,
      },
      contains: {
        $ref: "#",
      },
      maxProperties: {
        $ref: "#/definitions/nonNegativeInteger",
      },
      minProperties: {
        $ref: "#/definitions/nonNegativeIntegerDefault0",
      },
      required: {
        $ref: "#/definitions/stringArray",
      },
      additionalProperties: {
        $ref: "#",
      },
      definitions: {
        type: "object",
        additionalProperties: {
          $ref: "#",
        },
        default: {},
      },
      properties: {
        type: "object",
        additionalProperties: {
          $ref: "#",
        },
        default: {},
      },
      patternProperties: {
        type: "object",
        additionalProperties: {
          $ref: "#",
        },
        propertyNames: {
          format: "regex",
        },
        default: {},
      },
      dependencies: {
        type: "object",
        additionalProperties: {
          anyOf: [
            {
              $ref: "#",
            },
            {
              $ref: "#/definitions/stringArray",
            },
          ],
        },
      },
      propertyNames: {
        $ref: "#",
      },
      const: !0,
      enum: {
        type: "array",
        items: !0,
        minItems: 1,
        uniqueItems: !0,
      },
      type: {
        anyOf: [
          {
            $ref: "#/definitions/simpleTypes",
          },
          {
            type: "array",
            items: {
              $ref: "#/definitions/simpleTypes",
            },
            minItems: 1,
            uniqueItems: !0,
          },
        ],
      },
      format: {
        type: "string",
      },
      contentMediaType: {
        type: "string",
      },
      contentEncoding: {
        type: "string",
      },
      if: {
        $ref: "#",
      },
      then: {
        $ref: "#",
      },
      else: {
        $ref: "#",
      },
      allOf: {
        $ref: "#/definitions/schemaArray",
      },
      anyOf: {
        $ref: "#/definitions/schemaArray",
      },
      oneOf: {
        $ref: "#/definitions/schemaArray",
      },
      not: {
        $ref: "#",
      },
    },
    gH = {
      $schema: cH,
      $id: uH,
      title: fH,
      definitions: dH,
      type: pH,
      properties: hH,
      default: !0,
    };
  (function (e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 }),
      (t.MissingRefError =
        t.ValidationError =
        t.CodeGen =
        t.Name =
        t.nil =
        t.stringify =
        t.str =
        t._ =
        t.KeywordCxt =
          void 0);
    const r = py,
      n = Gu,
      o = Of,
      i = gH,
      s = ["/properties"],
      a = "http://json-schema.org/draft-07/schema";
    class l extends r.default {
      _addVocabularies() {
        super._addVocabularies(),
          n.default.forEach(h => this.addVocabulary(h)),
          this.opts.discriminator && this.addKeyword(o.default);
      }
      _addDefaultMetaSchema() {
        if ((super._addDefaultMetaSchema(), !this.opts.meta)) return;
        const h = this.opts.$data ? this.$dataMetaSchema(i, s) : i;
        this.addMetaSchema(h, a, !1),
          (this.refs["http://json-schema.org/schema"] = a);
      }
      defaultMeta() {
        return (this.opts.defaultMeta =
          super.defaultMeta() || (this.getSchema(a) ? a : void 0));
      }
    }
    (e.exports = t = l),
      Object.defineProperty(t, "__esModule", { value: !0 }),
      (t.default = l);
    var c = Yt;
    Object.defineProperty(t, "KeywordCxt", {
      enumerable: !0,
      get: function () {
        return c.KeywordCxt;
      },
    });
    var u = Ie;
    Object.defineProperty(t, "_", {
      enumerable: !0,
      get: function () {
        return u._;
      },
    }),
      Object.defineProperty(t, "str", {
        enumerable: !0,
        get: function () {
          return u.str;
        },
      }),
      Object.defineProperty(t, "stringify", {
        enumerable: !0,
        get: function () {
          return u.stringify;
        },
      }),
      Object.defineProperty(t, "nil", {
        enumerable: !0,
        get: function () {
          return u.nil;
        },
      }),
      Object.defineProperty(t, "Name", {
        enumerable: !0,
        get: function () {
          return u.Name;
        },
      }),
      Object.defineProperty(t, "CodeGen", {
        enumerable: !0,
        get: function () {
          return u.CodeGen;
        },
      });
    var f = Xi;
    Object.defineProperty(t, "ValidationError", {
      enumerable: !0,
      get: function () {
        return f.default;
      },
    });
    var d = Zi;
    Object.defineProperty(t, "MissingRefError", {
      enumerable: !0,
      get: function () {
        return d.default;
      },
    });
  })(fc, fc.exports);
  var qy = fc.exports,
    Uh = { exports: {} },
    Yy = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.formatNames = e.fastFormats = e.fullFormats = void 0);
    function t(B, W) {
      return { validate: B, compare: W };
    }
    (e.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: t(i, s),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: t(l, c),
      "date-time": t(f, d),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration:
        /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri: m,
      "uri-reference":
        /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      "uri-template":
        /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email:
        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname:
        /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex: j,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      "json-pointer-uri-fragment":
        /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      "relative-json-pointer":
        /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte: g,
      // signed 32 bit integer
      int32: { type: "number", validate: A },
      // signed 64 bit integer
      int64: { type: "number", validate: D },
      // C-type float
      float: { type: "number", validate: S },
      // C-type double
      double: { type: "number", validate: S },
      // hint to the UI to hide input strings
      password: !0,
      // unchecked string payload
      binary: !0,
    }),
      (e.fastFormats = {
        ...e.fullFormats,
        date: t(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, s),
        time: t(
          /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
          c
        ),
        "date-time": t(
          /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
          d
        ),
        // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
        uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
        "uri-reference":
          /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
        // email (sources from jsen validator):
        // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
        // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
        email:
          /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
      }),
      (e.formatNames = Object.keys(e.fullFormats));
    function r(B) {
      return B % 4 === 0 && (B % 100 !== 0 || B % 400 === 0);
    }
    const n = /^(\d\d\d\d)-(\d\d)-(\d\d)$/,
      o = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function i(B) {
      const W = n.exec(B);
      if (!W) return !1;
      const re = +W[1],
        G = +W[2],
        Se = +W[3];
      return (
        G >= 1 && G <= 12 && Se >= 1 && Se <= (G === 2 && r(re) ? 29 : o[G])
      );
    }
    function s(B, W) {
      if (B && W) return B > W ? 1 : B < W ? -1 : 0;
    }
    const a = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
    function l(B, W) {
      const re = a.exec(B);
      if (!re) return !1;
      const G = +re[1],
        Se = +re[2],
        ce = +re[3],
        Pe = re[5];
      return (
        ((G <= 23 && Se <= 59 && ce <= 59) ||
          (G === 23 && Se === 59 && ce === 60)) &&
        (!W || Pe !== "")
      );
    }
    function c(B, W) {
      if (!(B && W)) return;
      const re = a.exec(B),
        G = a.exec(W);
      if (re && G)
        return (
          (B = re[1] + re[2] + re[3] + (re[4] || "")),
          (W = G[1] + G[2] + G[3] + (G[4] || "")),
          B > W ? 1 : B < W ? -1 : 0
        );
    }
    const u = /t|\s/i;
    function f(B) {
      const W = B.split(u);
      return W.length === 2 && i(W[0]) && l(W[1], !0);
    }
    function d(B, W) {
      if (!(B && W)) return;
      const [re, G] = B.split(u),
        [Se, ce] = W.split(u),
        Pe = s(re, Se);
      if (Pe !== void 0) return Pe || c(G, ce);
    }
    const p = /\/|:/,
      h =
        /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function m(B) {
      return p.test(B) && h.test(B);
    }
    const v =
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function g(B) {
      return (v.lastIndex = 0), v.test(B);
    }
    const _ = -(2 ** 31),
      E = 2 ** 31 - 1;
    function A(B) {
      return Number.isInteger(B) && B <= E && B >= _;
    }
    function D(B) {
      return Number.isInteger(B);
    }
    function S() {
      return !0;
    }
    const O = /[^\\]\\Z/;
    function j(B) {
      if (O.test(B)) return !1;
      try {
        return new RegExp(B), !0;
      } catch {
        return !1;
      }
    }
  })(Yy);
  var Jy = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.formatLimitDefinition = void 0);
    const t = qy,
      r = Ie,
      n = r.operators,
      o = {
        formatMaximum: { okStr: "<=", ok: n.LTE, fail: n.GT },
        formatMinimum: { okStr: ">=", ok: n.GTE, fail: n.LT },
        formatExclusiveMaximum: { okStr: "<", ok: n.LT, fail: n.GTE },
        formatExclusiveMinimum: { okStr: ">", ok: n.GT, fail: n.LTE },
      },
      i = {
        message: ({ keyword: a, schemaCode: l }) =>
          r.str`should be ${o[a].okStr} ${l}`,
        params: ({ keyword: a, schemaCode: l }) =>
          r._`{comparison: ${o[a].okStr}, limit: ${l}}`,
      };
    e.formatLimitDefinition = {
      keyword: Object.keys(o),
      type: "string",
      schemaType: "string",
      $data: !0,
      error: i,
      code(a) {
        const { gen: l, data: c, schemaCode: u, keyword: f, it: d } = a,
          { opts: p, self: h } = d;
        if (!p.validateFormats) return;
        const m = new t.KeywordCxt(d, h.RULES.all.format.definition, "format");
        m.$data ? v() : g();
        function v() {
          const E = l.scopeValue("formats", {
              ref: h.formats,
              code: p.code.formats,
            }),
            A = l.const("fmt", r._`${E}[${m.schemaCode}]`);
          a.fail$data(
            r.or(
              r._`typeof ${A} != "object"`,
              r._`${A} instanceof RegExp`,
              r._`typeof ${A}.compare != "function"`,
              _(A)
            )
          );
        }
        function g() {
          const E = m.schema,
            A = h.formats[E];
          if (!A || A === !0) return;
          if (
            typeof A != "object" ||
            A instanceof RegExp ||
            typeof A.compare != "function"
          )
            throw new Error(
              `"${f}": format "${E}" does not define "compare" function`
            );
          const D = l.scopeValue("formats", {
            key: E,
            ref: A,
            code: p.code.formats
              ? r._`${p.code.formats}${r.getProperty(E)}`
              : void 0,
          });
          a.fail$data(_(D));
        }
        function _(E) {
          return r._`${E}.compare(${c}, ${u}) ${o[f].fail} 0`;
        }
      },
      dependencies: ["format"],
    };
    const s = a => (a.addKeyword(e.formatLimitDefinition), a);
    e.default = s;
  })(Jy);
  (function (e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 });
    const r = Yy,
      n = Jy,
      o = Ie,
      i = new o.Name("fullFormats"),
      s = new o.Name("fastFormats"),
      a = (c, u = { keywords: !0 }) => {
        if (Array.isArray(u)) return l(c, u, r.fullFormats, i), c;
        const [f, d] =
            u.mode === "fast" ? [r.fastFormats, s] : [r.fullFormats, i],
          p = u.formats || r.formatNames;
        return l(c, p, f, d), u.keywords && n.default(c), c;
      };
    a.get = (c, u = "full") => {
      const d = (u === "fast" ? r.fastFormats : r.fullFormats)[c];
      if (!d) throw new Error(`Unknown format "${c}"`);
      return d;
    };
    function l(c, u, f, d) {
      var p, h;
      ((p = (h = c.opts.code).formats) !== null && p !== void 0) ||
        (h.formats = o._`require("ajv-formats/dist/formats").${d}`);
      for (const m of u) c.addFormat(m, f[m]);
    }
    (e.exports = t = a),
      Object.defineProperty(t, "__esModule", { value: !0 }),
      (t.default = a);
  })(Uh, Uh.exports);
  var Wh;
  (function (e) {
    (e.HIDE = "HIDE"),
      (e.SHOW = "SHOW"),
      (e.ENABLE = "ENABLE"),
      (e.DISABLE = "DISABLE");
  })(Wh || (Wh = {}));
  var Et;
  (function (e) {
    (e.addTooltip = "addTooltip"),
      (e.addAriaLabel = "addAriaLabel"),
      (e.removeTooltip = "removeTooltip"),
      (e.upAriaLabel = "upAriaLabel"),
      (e.downAriaLabel = "downAriaLabel"),
      (e.noSelection = "noSelection"),
      (e.removeAriaLabel = "removeAriaLabel"),
      (e.noDataMessage = "noDataMessage"),
      (e.deleteDialogTitle = "deleteDialogTitle"),
      (e.deleteDialogMessage = "deleteDialogMessage"),
      (e.deleteDialogAccept = "deleteDialogAccept"),
      (e.deleteDialogDecline = "deleteDialogDecline"),
      (e.up = "up"),
      (e.down = "down");
  })(Et || (Et = {}));
  Et.addTooltip,
    Et.addAriaLabel,
    Et.removeTooltip,
    Et.removeAriaLabel,
    Et.upAriaLabel,
    Et.up,
    Et.down,
    Et.downAriaLabel,
    Et.noDataMessage,
    Et.noSelection,
    Et.deleteDialogTitle,
    Et.deleteDialogMessage,
    Et.deleteDialogAccept,
    Et.deleteDialogDecline;
  var po;
  (function (e) {
    (e.clearDialogTitle = "clearDialogTitle"),
      (e.clearDialogMessage = "clearDialogMessage"),
      (e.clearDialogAccept = "clearDialogAccept"),
      (e.clearDialogDecline = "clearDialogDecline");
  })(po || (po = {}));
  po.clearDialogTitle,
    po.clearDialogMessage,
    po.clearDialogAccept,
    po.clearDialogDecline;
  var Hh = { exports: {} };
  (function (e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 });
    const r = qy,
      n = Ie,
      o = Eo,
      i = Yt,
      s = Lo,
      a = lr,
      l = "errorMessage",
      c = new r.Name("emUsed"),
      u = {
        required: "missingProperty",
        dependencies: "property",
        dependentRequired: "property",
      },
      f = /\$\{[^}]+\}/,
      d = /\$\{([^}]+)\}/g,
      p = /^""\s*\+\s*|\s*\+\s*""$/g;
    function h(v) {
      return {
        keyword: l,
        schemaType: ["string", "object"],
        post: !0,
        code(g) {
          const { gen: _, data: E, schema: A, schemaValue: D, it: S } = g;
          if (S.createErrors === !1) return;
          const O = A,
            j = n.strConcat(a.default.instancePath, S.errorPath);
          _.if(r._`${a.default.errors} > 0`, () => {
            if (typeof O == "object") {
              const [P, y] = W(O);
              y && re(y), P && G(P), Se(B(O));
            }
            const R = typeof O == "string" ? O : O._;
            R && ce(R), v.keepErrors || Pe();
          });
          function B({ properties: R, items: P }) {
            const y = {};
            if (R) {
              y.props = {};
              for (const $ in R) y.props[$] = [];
            }
            if (P) {
              y.items = {};
              for (let $ = 0; $ < P.length; $++) y.items[$] = [];
            }
            return y;
          }
          function W(R) {
            let P, y;
            for (const $ in R) {
              if ($ === "properties" || $ === "items") continue;
              const N = R[$];
              if (typeof N == "object") {
                P || (P = {});
                const M = (P[$] = {});
                for (const F in N) M[F] = [];
              } else y || (y = {}), (y[$] = []);
            }
            return [P, y];
          }
          function re(R) {
            const P = _.const("emErrors", r.stringify(R)),
              y = _.const("templates", ze(R, A));
            _.forOf("err", a.default.vErrors, F =>
              _.if(_e(F, P), () =>
                _.code(r._`${P}[${F}.keyword].push(${F})`).assign(
                  r._`${F}.${c}`,
                  !0
                )
              )
            );
            const { singleError: $ } = v;
            if ($) {
              const F = _.let("message", r._`""`),
                q = _.let("paramsErrors", r._`[]`);
              N(ne => {
                _.if(F, () =>
                  _.code(r._`${F} += ${typeof $ == "string" ? $ : ";"}`)
                ),
                  _.code(r._`${F} += ${M(ne)}`),
                  _.assign(q, r._`${q}.concat(${P}[${ne}])`);
              }),
                s.reportError(g, { message: F, params: r._`{errors: ${q}}` });
            } else
              N(F =>
                s.reportError(g, {
                  message: M(F),
                  params: r._`{errors: ${P}[${F}]}`,
                })
              );
            function N(F) {
              _.forIn("key", P, q => _.if(r._`${P}[${q}].length`, () => F(q)));
            }
            function M(F) {
              return r._`${F} in ${y} ? ${y}[${F}]() : ${D}[${F}]`;
            }
          }
          function G(R) {
            const P = _.const("emErrors", r.stringify(R)),
              y = [];
            for (const q in R) y.push([q, ze(R[q], A[q])]);
            const $ = _.const("templates", _.object(...y)),
              N = _.scopeValue("obj", {
                ref: u,
                code: r.stringify(u),
              }),
              M = _.let("emPropParams"),
              F = _.let("emParamsErrors");
            _.forOf("err", a.default.vErrors, q =>
              _.if(_e(q, P), () => {
                _.assign(M, r._`${N}[${q}.keyword]`),
                  _.assign(F, r._`${P}[${q}.keyword][${q}.params[${M}]]`),
                  _.if(F, () =>
                    _.code(r._`${F}.push(${q})`).assign(r._`${q}.${c}`, !0)
                  );
              })
            ),
              _.forIn("key", P, q =>
                _.forIn("keyProp", r._`${P}[${q}]`, ne => {
                  _.assign(F, r._`${P}[${q}][${ne}]`),
                    _.if(r._`${F}.length`, () => {
                      const $e = _.const(
                        "tmpl",
                        r._`${$}[${q}] && ${$}[${q}][${ne}]`
                      );
                      s.reportError(g, {
                        message: r._`${$e} ? ${$e}() : ${D}[${q}][${ne}]`,
                        params: r._`{errors: ${F}}`,
                      });
                    });
                })
              );
          }
          function Se(R) {
            const { props: P, items: y } = R;
            if (!P && !y) return;
            const $ = r._`typeof ${E} == "object"`,
              N = r._`Array.isArray(${E})`,
              M = _.let("emErrors");
            let F, q;
            const ne = _.let("templates");
            P && y
              ? ((F = _.let("emChildKwd")),
                _.if($),
                _.if(
                  N,
                  () => {
                    $e(y, A.items), _.assign(F, r.str`items`);
                  },
                  () => {
                    $e(P, A.properties), _.assign(F, r.str`properties`);
                  }
                ),
                (q = r._`[${F}]`))
              : y
                ? (_.if(N), $e(y, A.items), (q = r._`.items`))
                : P &&
                  (_.if(n.and($, n.not(N))),
                  $e(P, A.properties),
                  (q = r._`.properties`)),
              _.forOf("err", a.default.vErrors, Te =>
                ae(Te, M, qe =>
                  _.code(r._`${M}[${qe}].push(${Te})`).assign(
                    r._`${Te}.${c}`,
                    !0
                  )
                )
              ),
              _.forIn("key", M, Te =>
                _.if(r._`${M}[${Te}].length`, () => {
                  s.reportError(g, {
                    message: r._`${Te} in ${ne} ? ${ne}[${Te}]() : ${D}${q}[${Te}]`,
                    params: r._`{errors: ${M}[${Te}]}`,
                  }),
                    _.assign(
                      r._`${a.default.vErrors}[${a.default.errors}-1].instancePath`,
                      r._`${j} + "/" + ${Te}.replace(/~/g, "~0").replace(/\\//g, "~1")`
                    );
                })
              ),
              _.endIf();
            function $e(Te, qe) {
              _.assign(M, r.stringify(Te)), _.assign(ne, ze(Te, qe));
            }
          }
          function ce(R) {
            const P = _.const("emErrs", r._`[]`);
            _.forOf("err", a.default.vErrors, y =>
              _.if(me(y), () =>
                _.code(r._`${P}.push(${y})`).assign(r._`${y}.${c}`, !0)
              )
            ),
              _.if(r._`${P}.length`, () =>
                s.reportError(g, {
                  message: Q(R),
                  params: r._`{errors: ${P}}`,
                })
              );
          }
          function Pe() {
            const R = _.const("emErrs", r._`[]`);
            _.forOf("err", a.default.vErrors, P =>
              _.if(r._`!${P}.${c}`, () => _.code(r._`${R}.push(${P})`))
            ),
              _.assign(a.default.vErrors, R).assign(
                a.default.errors,
                r._`${R}.length`
              );
          }
          function _e(R, P) {
            return n.and(
              r._`${R}.keyword !== ${l}`,
              r._`!${R}.${c}`,
              r._`${R}.instancePath === ${j}`,
              r._`${R}.keyword in ${P}`,
              // TODO match the end of the string?
              r._`${R}.schemaPath.indexOf(${S.errSchemaPath}) === 0`,
              r._`/^\\/[^\\/]*$/.test(${R}.schemaPath.slice(${S.errSchemaPath.length}))`
            );
          }
          function ae(R, P, y) {
            _.if(
              n.and(
                r._`${R}.keyword !== ${l}`,
                r._`!${R}.${c}`,
                r._`${R}.instancePath.indexOf(${j}) === 0`
              ),
              () => {
                const $ = _.scopeValue("pattern", {
                    ref: /^\/([^/]*)(?:\/|$)/,
                    code: r._`new RegExp("^\\\/([^/]*)(?:\\\/|$)")`,
                  }),
                  N = _.const(
                    "emMatches",
                    r._`${$}.exec(${R}.instancePath.slice(${j}.length))`
                  ),
                  M = _.const(
                    "emChild",
                    r._`${N} && ${N}[1].replace(/~1/g, "/").replace(/~0/g, "~")`
                  );
                _.if(r._`${M} !== undefined && ${M} in ${P}`, () => y(M));
              }
            );
          }
          function me(R) {
            return n.and(
              r._`${R}.keyword !== ${l}`,
              r._`!${R}.${c}`,
              n.or(
                r._`${R}.instancePath === ${j}`,
                n.and(
                  r._`${R}.instancePath.indexOf(${j}) === 0`,
                  r._`${R}.instancePath[${j}.length] === "/"`
                )
              ),
              r._`${R}.schemaPath.indexOf(${S.errSchemaPath}) === 0`,
              r._`${R}.schemaPath[${S.errSchemaPath}.length] === "/"`
            );
          }
          function ze(R, P) {
            const y = [];
            for (const $ in R) {
              const N = P[$];
              f.test(N) && y.push([$, I(N)]);
            }
            return _.object(...y);
          }
          function Q(R) {
            return f.test(R)
              ? new o._Code(
                  o
                    .safeStringify(R)
                    .replace(
                      d,
                      (P, y) => `" + JSON.stringify(${i.getData(y, S)}) + "`
                    )
                    .replace(p, "")
                )
              : r.stringify(R);
          }
          function I(R) {
            return r._`function(){return ${Q(R)}}`;
          }
        },
        metaSchema: {
          anyOf: [
            { type: "string" },
            {
              type: "object",
              properties: {
                properties: { $ref: "#/$defs/stringMap" },
                items: { $ref: "#/$defs/stringList" },
                required: { $ref: "#/$defs/stringOrMap" },
                dependencies: { $ref: "#/$defs/stringOrMap" },
              },
              additionalProperties: { type: "string" },
            },
          ],
          $defs: {
            stringMap: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            stringOrMap: {
              anyOf: [{ type: "string" }, { $ref: "#/$defs/stringMap" }],
            },
            stringList: { type: "array", items: { type: "string" } },
          },
        },
      };
    }
    const m = (v, g = {}) => {
      if (!v.opts.allErrors)
        throw new Error("ajv-errors: Ajv option allErrors must be true");
      if (v.opts.jsPropertySyntax)
        throw new Error(
          "ajv-errors: ajv option jsPropertySyntax is not supported"
        );
      return v.addKeyword(h(g));
    };
    (t.default = m), (e.exports = m), (e.exports.default = m);
  })(Hh, Hh.exports);
  const mH = /* @__PURE__ */ ge({
      name: "UwButton",
      components: {
        Primitive: St,
      },
      props: {
        as: {
          type: String,
          default: "button",
        },
        asChild: {
          type: Boolean,
        },
        label: { type: String },
        color: { type: String },
        variant: { type: String },
        size: { type: String },
        upwindConfig: { type: Object },
        block: { type: Boolean },
        disabled: { type: Boolean },
        loading: { type: Boolean },
      },
      setup(e) {
        return { styles: ar("button", xt(e), BE, e.upwindConfig) };
      },
    }),
    Ut = (e, t) => {
      const r = e.__vccOpts || e;
      for (const [n, o] of t) r[n] = o;
      return r;
    };
  function vH(e, t, r, n, o, i) {
    const s = Qe("primitive");
    return (
      ue(),
      ve(
        s,
        {
          as: e.as,
          "as-child": e.asChild,
          class: it(e.styles.button.root),
          disabled: e.disabled,
        },
        {
          default: oe(() => [
            fe(e.$slots, "prepend"),
            fe(e.$slots, "default", {}, () => [
              qn(
                "span",
                {
                  class: it(e.styles.button.label),
                },
                kn(e.label),
                3
              ),
            ]),
            fe(e.$slots, "append"),
          ]),
          _: 3,
        },
        8,
        ["as", "as-child", "class", "disabled"]
      )
    );
  }
  const yH = /* @__PURE__ */ Ut(mH, [["render", vH]]),
    _H = /* @__PURE__ */ Fi(yH),
    $H = gt(
      "bg-base-200 text-base-foreground relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-normal",
      {
        variants: {
          size: {
            sm: "h-10 w-10 text-xs",
            md: "h-16 w-16 text-2xl",
            lg: "h-32 w-32 text-5xl",
          },
          shape: {
            circle: "rounded-full",
            square: "rounded-md",
          },
        },
        defaultVariants: {
          size: "md",
          shape: "circle",
        },
      }
    ),
    bH = {
      avatar: {
        root: $H,
        icon: gt("m-1 h-full w-full object-cover"),
        caption: gt(
          "absolute bottom-0 left-0 right-0 top-0 z-0 inline-flex items-center justify-center text-center"
        ),
        image: gt("relative z-10 h-full w-full object-cover"),
      },
    },
    wH = /* @__PURE__ */ ge({
      name: "UwAvatar",
      components: {
        AvatarFallback: gE,
        AvatarImage: hE,
        AvatarRoot: dE,
      },
      props: {
        shape: {
          type: String,
          default: "circle",
        },
        size: {
          type: String,
          default: "md",
        },
        avatar: { type: Object, default: () => ({}) },
        loading: { type: Boolean },
        upwindConfig: { type: Object, default: () => ({}) },
      },
      setup(e) {
        return {
          styles: ar("avatar", xt(e), bH, e.upwindConfig),
        };
      },
      computed: {
        meta() {
          var e, t, r, n;
          return {
            isLoading: this.loading,
            hasIcon:
              av(this.avatar) ||
              !mi((e = this.avatar) == null ? void 0 : e.name),
            hasImage: !mi((t = this.avatar) == null ? void 0 : t.src),
            hasCaption:
              ((r = this.avatar) == null ? void 0 : r.forceCaption) ||
              !mi((n = this.avatar) == null ? void 0 : n.caption),
          };
        },
      },
    });
  function EH(e, t, r, n, o, i) {
    const s = Qe("avatar-image"),
      a = Qe("avatar-fallback"),
      l = Qe("avatar-root");
    return (
      ue(),
      ve(
        l,
        {
          class: it(e.styles.avatar.root),
        },
        {
          default: oe(() => [
            fe(e.$slots, "default", {}, () => [
              e.meta.hasImage
                ? (ue(),
                  ve(
                    s,
                    {
                      key: 0,
                      src: e.avatar.src,
                      alt: "avatar",
                      class: it(e.styles.avatar.image),
                    },
                    null,
                    8,
                    ["src", "class"]
                  ))
                : mr("", !0),
              e.meta.hasCaption
                ? (ue(),
                  ve(
                    a,
                    {
                      key: 1,
                      class: it(e.styles.avatar.caption),
                    },
                    {
                      default: oe(() => [$o(kn(e.avatar.caption), 1)]),
                      _: 1,
                    },
                    8,
                    ["class"]
                  ))
                : mr("", !0),
            ]),
          ]),
          _: 3,
        },
        8,
        ["class"]
      )
    );
  }
  const OH = /* @__PURE__ */ Ut(wH, [["render", EH]]),
    AH = /* @__PURE__ */ Fi(OH),
    SH = gt(
      "focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
      {
        variants: {
          variant: {
            flat: "border border-transparent",
            outlined: "border bg-opacity-0",
            tonal: "border border-transparent",
          },
          color: {
            base: "text-base-background bg-base-foreground",
            primary: "bg-primary text-primary-foreground",
            secondary: "bg-secondary text-secondary-foreground",
            accent: "bg-accent text-accent-foreground",
            promotion: "bg-promotion text-promotion-foreground",
            destructive: "bg-destructive text-destructive-foreground",
            success: "bg-success text-success-foreground",
            info: "bg-info text-info-foreground",
            error: "bg-error text-error-foreground",
            warning: "bg-warning text-warning-foreground",
          },
        },
        compoundVariants: [
          {
            color: "base",
            variant: "outlined",
            class: "border-base-foreground text-base-foreground",
          },
          {
            color: "primary",
            variant: "outlined",
            class: "border-primary text-primary",
          },
          {
            color: "secondary",
            variant: "outlined",
            class: "border-secondary text-secondary",
          },
          {
            color: "accent",
            variant: "outlined",
            class: "border-accent text-accent",
          },
          {
            color: "promotion",
            variant: "outlined",
            class: "border-promotion text-promotion",
          },
          {
            color: "destructive",
            variant: "outlined",
            class: "border-destructive text-destructive",
          },
          {
            color: "success",
            variant: "outlined",
            class: "border-success text-success",
          },
          {
            color: "info",
            variant: "outlined",
            class: "border-info text-info",
          },
          {
            color: "error",
            variant: "outlined",
            class: "border-error text-error",
          },
          {
            color: "warning",
            variant: "outlined",
            class: "border-warning text-warning",
          },
          // ---
          {
            color: "base",
            variant: "tonal",
            class: "bg-base-200 text-base-foreground",
          },
          {
            color: "primary",
            variant: "tonal",
            class: "bg-primary-50 text-primary",
          },
          {
            color: "secondary",
            variant: "tonal",
            class: "bg-secondary-50 text-secondary",
          },
          {
            color: "accent",
            variant: "tonal",
            class: "bg-accent-50 text-accent",
          },
          {
            color: "promotion",
            variant: "tonal",
            class: "bg-promotion-50 text-promotion",
          },
          {
            color: "destructive",
            variant: "tonal",
            class: "bg-destructive-50 text-destructive",
          },
          {
            color: "success",
            variant: "tonal",
            class: "bg-success-50 text-success",
          },
          { color: "info", variant: "tonal", class: "bg-info-50 text-info" },
          { color: "error", variant: "tonal", class: "bg-error-50 text-error" },
          {
            color: "warning",
            variant: "tonal",
            class: "bg-warning-50 text-warning",
          },
        ],
        defaultVariants: {
          variant: "flat",
          color: "base",
        },
      }
    ),
    NH = {
      badge: {
        root: SH,
        label: gt("font-normal"),
      },
    },
    PH = /* @__PURE__ */ ge({
      name: "UwBadge",
      props: {
        variant: {
          type: String,
        },
        color: {
          type: String,
          default: "base",
        },
        label: { type: String },
        // --- Provide a way to add custom styles for a specific instance of the component
        upwindConfig: { type: Object, default: () => ({}) },
      },
      setup(e) {
        return {
          styles: ar("badge", xt(e), NH, e.upwindConfig),
        };
      },
    });
  function CH(e, t, r, n, o, i) {
    return (
      ue(),
      Po(
        "span",
        {
          class: it(e.styles.badge.root),
        },
        [
          fe(e.$slots, "prepend"),
          qn(
            "span",
            {
              class: it(e.styles.badge.label),
            },
            [fe(e.$slots, "default", {}, () => [$o(kn(e.label), 1)])],
            2
          ),
          fe(e.$slots, "append"),
        ],
        2
      )
    );
  }
  const TH = /* @__PURE__ */ Ut(PH, [["render", CH]]),
    xH = /* @__PURE__ */ Fi(TH),
    DH = /* @__PURE__ */ ge({
      components: {
        DialogRoot: Lw,
      },
      emits: ["update:open"],
    });
  function IH(e, t, r, n, o, i) {
    const s = Qe("dialog-root");
    return (
      ue(),
      ve(
        s,
        {
          "onUpdate:open": t[0] || (t[0] = a => e.$emit("update:open", a)),
        },
        {
          default: oe(() => [fe(e.$slots, "default")]),
          _: 3,
        }
      )
    );
  }
  const RH = /* @__PURE__ */ Ut(DH, [["render", IH]]),
    MH = /* @__PURE__ */ ge({
      components: {
        DialogTrigger: Vw,
      },
    });
  function jH(e, t, r, n, o, i) {
    const s = Qe("dialog-trigger", !0);
    return (
      ue(),
      ve(s, null, {
        default: oe(() => [fe(e.$slots, "default")]),
        _: 3,
      })
    );
  }
  const FH = /* @__PURE__ */ Ut(MH, [["render", jH]]),
    LH = gt(
      "border-border bg-background relative z-50 my-8 grid w-full gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg md:w-full",
      {
        variants: {
          size: {
            sm: "max-w-sm",
            md: "max-w-md",
            lg: "max-w-lg",
            xl: "max-w-xl",
            "2xl": "max-w-2xl",
            "3xl": "max-w-3xl",
            "4xl": "max-w-4xl",
            full: "max-w-full",
          },
          overflow: {
            auto: "overflow-auto",
            hidden: "overflow-hidden",
            visible: "overflow-visible",
            scroll: "overflow-scroll",
          },
        },
        defaultVariants: {
          size: "lg",
          overflow: "visible",
        },
      }
    ),
    Bo = {
      dialog: {
        content: LH,
        header: gt("flex flex-col gap-y-2 text-center sm:text-left"),
        title: gt("text-lg font-semibold leading-none tracking-tight"),
        description: gt("text-muted-foreground text-sm"),
        footer: gt(
          "flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-x-2"
        ),
        close: gt("absolute right-3 top-3 rounded-md p-0.5 transition-colors"),
        closeIcon: gt("h-3 w-3"),
        overlay: gt(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80"
        ),
      },
    },
    VH = /* @__PURE__ */ ge({
      setup(e) {
        return {
          styles: ar("dialog", xt(e), Bo),
        };
      },
    });
  function kH(e, t, r, n, o, i) {
    return (
      ue(),
      Po(
        "div",
        {
          class: it(e.styles.dialog.header),
        },
        [fe(e.$slots, "default")],
        2
      )
    );
  }
  const BH = /* @__PURE__ */ Ut(VH, [["render", kH]]),
    zH = /* @__PURE__ */ ge({
      components: {
        DialogTitle: cE,
      },
      setup(e) {
        return {
          styles: ar("dialog", xt(e), Bo),
        };
      },
    });
  function UH(e, t, r, n, o, i) {
    const s = Qe("dialog-title", !0);
    return (
      ue(),
      ve(
        s,
        {
          class: it(e.styles.dialog.title),
        },
        {
          default: oe(() => [fe(e.$slots, "default")]),
          _: 3,
        },
        8,
        ["class"]
      )
    );
  }
  const WH = /* @__PURE__ */ Ut(zH, [["render", UH]]),
    HH = /* @__PURE__ */ ge({
      components: {
        DialogDescription: uE,
      },
      props: {
        asChild: Boolean,
      },
      setup(e) {
        return {
          styles: ar("dialog", xt(e), Bo),
        };
      },
    });
  function KH(e, t, r, n, o, i) {
    const s = Qe("dialog-description", !0);
    return (
      ue(),
      ve(
        s,
        {
          class: it(e.styles.dialog.description),
          "as-child": e.asChild,
        },
        {
          default: oe(() => [fe(e.$slots, "default")]),
          _: 3,
        },
        8,
        ["class", "as-child"]
      )
    );
  }
  const GH = /* @__PURE__ */ Ut(HH, [["render", KH]]),
    qH = {
      icon: {
        root: gt("inline-flex flex-shrink-0 align-middle", {
          variants: {
            size: {
              xs: "size-6",
              sm: "size-8",
              md: "size-10",
              lg: "size-12",
              xl: "size-14",
              "2xl": "size-16",
            },
          },
          defaultVariants: {
            size: "none",
          },
        }),
      },
    },
    YH = /* @__PURE__ */ ge({
      name: "UpwIcon",
      props: {
        size: {
          type: String,
          default: "auto",
          validator: e =>
            ["auto", "xs", "sm", "md", "lg", "xl", "2xl"].includes(e),
        },
        icon: {
          type: [String, Object],
          required: !0,
        },
        // --- Provide a way to add custom styles for a specific instance of the component
        upwindConfig: {
          type: Object,
          default: null,
        },
      },
      setup(e) {
        const t = ar("icon", xt(e), qH, e.upwindConfig),
          r = /* @__PURE__ */ Object.assign({}),
          n = Ee();
        return (
          Jt(async () => {
            var a, l;
            const o = sr(e.icon)
                ? `${(a = e.icon) == null ? void 0 : a.path}/`
                : "",
              i = sr(e.icon)
                ? (l = e.icon) == null
                  ? void 0
                  : l.name
                : e.icon,
              s = CN(r, (c, u) => FN(u, `${o}${i}.svg`));
            if (!s) {
              console.warn("icon", "import not found", {
                icon: e.icon,
                icons: r,
              }),
                (n.value = null);
              return;
            }
            n.value = await s().catch(
              c => (
                console.error("icon", "import error", {
                  icon: e.icon,
                  error: c,
                  icons: r,
                }),
                null
              )
            );
          }),
          {
            styles: t,
            svg: n,
          }
        );
      },
    }),
    JH = ["innerHTML", "aria-label"];
  function XH(e, t, r, n, o, i) {
    var s;
    return e.svg
      ? (ue(),
        Po(
          "i",
          {
            key: 0,
            class: it(["icon", e.styles.icon.root]),
            innerHTML: e.svg,
            role: "img",
            "aria-label": `${((s = e.icon) == null ? void 0 : s.name) || e.icon} icon`,
          },
          null,
          10,
          JH
        ))
      : mr("", !0);
  }
  const ZH = /* @__PURE__ */ Ut(YH, [["render", XH]]),
    QH = /* @__PURE__ */ ge({
      components: {
        DialogClose: lE,
        DialogContent: iE,
        DialogOverlay: aE,
        DialogPortal: kw,
        UpwIcon: ZH,
      },
      props: {
        size: {
          type: String,
          default: "lg",
        },
        overflow: {
          type: String,
          default: "visible",
        },
      },
      emits: [
        "update:open",
        "openChange",
        "escapeKeyDown",
        "pointerDownOutside",
        "interactOutside",
        "close",
      ],
      setup(e) {
        const t = ar("dialog", xt(e), Bo);
        return {
          handlePointerDownOutside: n => {
            const o = n,
              i = o.detail.originalEvent.target;
            (o.detail.originalEvent.offsetX > i.clientWidth ||
              o.detail.originalEvent.offsetY > i.clientHeight) &&
              n.preventDefault();
          },
          styles: t,
        };
      },
    }),
    eK = /* @__PURE__ */ qn("span", { class: "sr-only" }, "Close", -1);
  function tK(e, t, r, n, o, i) {
    const s = Qe("upw-icon"),
      a = Qe("dialog-close"),
      l = Qe("dialog-content"),
      c = Qe("dialog-overlay"),
      u = Qe("dialog-portal");
    return (
      ue(),
      ve(u, null, {
        default: oe(() => [
          Le(
            c,
            {
              class: it(e.styles.dialog.overlay),
            },
            {
              default: oe(() => [
                Le(
                  l,
                  {
                    class: it(e.styles.dialog.content),
                    onPointerDownOutside: e.handlePointerDownOutside,
                  },
                  {
                    default: oe(() => [
                      fe(e.$slots, "default"),
                      Le(
                        a,
                        {
                          class: it(e.styles.dialog.close),
                        },
                        {
                          default: oe(() => [
                            Le(
                              s,
                              {
                                icon: "close",
                                class: it(e.styles.dialog.closeIcon),
                              },
                              null,
                              8,
                              ["class"]
                            ),
                            eK,
                          ]),
                          _: 1,
                        },
                        8,
                        ["class"]
                      ),
                    ]),
                    _: 3,
                  },
                  8,
                  ["class", "onPointerDownOutside"]
                ),
              ]),
              _: 3,
            },
            8,
            ["class"]
          ),
        ]),
        _: 3,
      })
    );
  }
  const rK = /* @__PURE__ */ Ut(QH, [["render", tK]]),
    nK = /* @__PURE__ */ ge({
      setup(e) {
        return {
          styles: ar("dialog", xt(e), Bo),
        };
      },
    });
  function oK(e, t, r, n, o, i) {
    return (
      ue(),
      Po(
        "div",
        {
          class: it(e.styles.dialog.footer),
        },
        [fe(e.$slots, "default")],
        2
      )
    );
  }
  const iK = /* @__PURE__ */ Ut(nK, [["render", oK]]),
    sK = /* @__PURE__ */ ge({
      components: {
        DialogRoot: RH,
        DialogScrollContent: rK,
        DialogDescription: GH,
        DialogFooter: iK,
        DialogHeader: BH,
        DialogTitle: WH,
        DialogTrigger: FH,
      },
      props: {
        title: { type: String },
        description: { type: String },
        size: {
          type: String,
          default: "lg",
        },
        overflow: {
          type: String,
          default: "visible",
        },
        upwindConfig: { type: Object, default: () => ({}) },
      },
      setup(e) {
        const t = ar("dialog", xt(e), Bo, e.upwindConfig);
        return {
          props: e,
          styles: t,
        };
      },
    });
  function aK(e, t, r, n, o, i) {
    const s = Qe("dialog-trigger"),
      a = Qe("dialog-title"),
      l = Qe("dialog-description"),
      c = Qe("dialog-header"),
      u = Qe("dialog-footer"),
      f = Qe("dialog-scroll-content"),
      d = Qe("dialog-root");
    return (
      ue(),
      ve(d, null, {
        default: oe(() => [
          Le(s, null, {
            default: oe(() => [fe(e.$slots, "trigger")]),
            _: 3,
          }),
          Le(
            f,
            {
              size: e.size,
              overflow: e.overflow,
            },
            {
              default: oe(() => [
                e.title || e.description
                  ? (ue(),
                    ve(
                      c,
                      { key: 0 },
                      {
                        default: oe(() => [
                          e.title
                            ? (ue(),
                              ve(
                                a,
                                { key: 0 },
                                {
                                  default: oe(() => [$o(kn(e.title), 1)]),
                                  _: 1,
                                }
                              ))
                            : mr("", !0),
                          e.description
                            ? (ue(),
                              ve(
                                l,
                                { key: 1 },
                                {
                                  default: oe(() => [$o(kn(e.description), 1)]),
                                  _: 1,
                                }
                              ))
                            : mr("", !0),
                        ]),
                        _: 1,
                      }
                    ))
                  : mr("", !0),
                fe(e.$slots, "content"),
                fe(e.$slots, "default"),
                e.$slots.footer
                  ? (ue(),
                    ve(
                      u,
                      { key: 1 },
                      {
                        default: oe(() => [fe(e.$slots, "footer")]),
                        _: 3,
                      }
                    ))
                  : mr("", !0),
              ]),
              _: 3,
            },
            8,
            ["size", "overflow"]
          ),
        ]),
        _: 3,
      })
    );
  }
  const lK = /* @__PURE__ */ Ut(sK, [["render", aK]]),
    cK = /* @__PURE__ */ Fi(lK),
    uK = /* @__PURE__ */ ge({
      __name: "Tooltip",
      props: {
        defaultOpen: { type: Boolean },
        open: { type: Boolean },
        delayDuration: {},
        disableHoverableContent: { type: Boolean },
        disableClosingTrigger: { type: Boolean },
        disabled: { type: Boolean },
        ignoreNonKeyboardFocus: { type: Boolean },
      },
      emits: ["update:open"],
      setup(e, { emit: t }) {
        const o = Zc(e, t);
        return (i, s) => (
          ue(),
          ve(
            z(RE),
            No(Yn(z(o))),
            {
              default: oe(() => [fe(i.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    fK = /* @__PURE__ */ ge({
      inheritAttrs: !1,
      __name: "TooltipContent",
      props: {
        forceMount: { type: Boolean },
        ariaLabel: {},
        asChild: { type: Boolean },
        as: {},
        side: {},
        sideOffset: { default: 4 },
        align: {},
        alignOffset: {},
        avoidCollisions: { type: Boolean },
        collisionBoundary: {},
        collisionPadding: {},
        arrowPadding: {},
        sticky: {},
        hideWhenDetached: { type: Boolean },
        class: {},
      },
      emits: ["escapeKeyDown", "pointerDownOutside"],
      setup(e, { emit: t }) {
        const r = e,
          n = t,
          o = Oe(() => {
            const { class: s, ...a } = r;
            return a;
          }),
          i = Zc(o, n);
        return (s, a) => (
          ue(),
          ve(z(VE), null, {
            default: oe(() => [
              Le(
                z(FE),
                pt(
                  { ...z(i), ...s.$attrs },
                  {
                    class: r.class,
                  }
                ),
                {
                  default: oe(() => [fe(s.$slots, "default")]),
                  _: 3,
                },
                16,
                ["class"]
              ),
            ]),
            _: 3,
          })
        );
      },
    }),
    dK = /* @__PURE__ */ ge({
      __name: "TooltipTrigger",
      props: {
        asChild: { type: Boolean },
        as: {},
      },
      setup(e) {
        const t = e;
        return (r, n) => (
          ue(),
          ve(
            z(ME),
            No(Yn(t)),
            {
              default: oe(() => [fe(r.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    pK = /* @__PURE__ */ ge({
      __name: "TooltipProvider",
      props: {
        delayDuration: {},
        skipDelayDuration: {},
        disableHoverableContent: { type: Boolean },
        disableClosingTrigger: { type: Boolean },
        disabled: { type: Boolean },
        ignoreNonKeyboardFocus: { type: Boolean },
      },
      setup(e) {
        const t = e;
        return (r, n) => (
          ue(),
          ve(
            z(DE),
            No(Yn(t)),
            {
              default: oe(() => [fe(r.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    hK = gt(
      "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-base-800 z-50 overflow-hidden rounded px-3 py-1.5 text-sm text-white",
      {
        variants: {
          color: {
            base: "bg-base-800 text-base-50",
            primary: "bg-primary text-primary-foreground",
            secondary: "bg-secondary text-secondary-foreground",
            accent: "bg-accent text-accent-foreground",
            success: "bg-success text-success-foreground",
            error: "bg-error text-error-foreground",
            warning: "bg-warning text-warning-foreground",
            info: "bg-info text-info-foreground",
            promotion: "bg-promotion text-promotion-foreground",
          },
        },
      }
    ),
    gK = {
      tooltip: {
        content: hK,
        arrow: gt("text-base-800", {
          variants: {
            color: {
              base: "text-base-800",
              primary: "text-primary",
              secondary: "text-secondary",
              accent: "text-accent",
              success: "text-success",
              error: "text-error",
              warning: "text-warning",
              info: "text-info",
              promotion: "text-promotion",
            },
          },
        }),
      },
    },
    mK = /* @__PURE__ */ ge({
      name: "UwTooltip",
      components: {
        Tooltip: uK,
        TooltipContent: fK,
        TooltipTrigger: dK,
        TooltipProvider: pK,
        TooltipArrow: LE,
      },
      props: {
        label: { type: String },
        open: { type: Boolean },
        direction: {
          type: String,
          default: "bottom",
        },
        color: String,
        delayDuration: {
          type: Number,
          default: 300,
        },
        sideOffset: {
          type: Number,
          default: 7,
        },
        upwindConfig: { type: Object, default: () => ({}) },
      },
      setup(e) {
        return {
          styles: ar("tooltip", xt(e), gK, e.upwindConfig),
        };
      },
    });
  function vK(e, t, r, n, o, i) {
    const s = Qe("tooltip-trigger"),
      a = Qe("tooltip-arrow"),
      l = Qe("tooltip-content"),
      c = Qe("tooltip"),
      u = Qe("tooltip-provider");
    return (
      ue(),
      ve(
        u,
        { "delay-duration": e.delayDuration },
        {
          default: oe(() => [
            Le(
              c,
              { open: e.open },
              {
                default: oe(() => [
                  Le(s, null, {
                    default: oe(() => [fe(e.$slots, "default")]),
                    _: 3,
                  }),
                  Le(
                    l,
                    {
                      side: e.direction,
                      sideOffset: e.sideOffset,
                      class: it(e.styles.tooltip.content),
                    },
                    {
                      default: oe(() => [
                        fe(e.$slots, "content", {}, () => [
                          qn("div", null, kn(e.label), 1),
                        ]),
                        Le(
                          a,
                          {
                            fill: "currentColor",
                            class: it(e.styles.tooltip.arrow),
                          },
                          null,
                          8,
                          ["class"]
                        ),
                      ]),
                      _: 3,
                    },
                    8,
                    ["side", "sideOffset", "class"]
                  ),
                ]),
                _: 3,
              },
              8,
              ["open"]
            ),
          ]),
          _: 3,
        },
        8,
        ["delay-duration"]
      )
    );
  }
  const yK = /* @__PURE__ */ Ut(mK, [["render", vK]]),
    _K = /* @__PURE__ */ Fi(yK);
  customElements.define("uw-avatar", AH);
  customElements.define("uw-badge", xH);
  customElements.define("uw-button", _H);
  customElements.define("uw-dialog", cK);
  customElements.define("uw-tooltip", _K);
});
export default $K();
