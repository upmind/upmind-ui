var y_ = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var yK = y_((Mr, jr) => {
  var Xh = {};
  /**
   * @vue/shared v3.4.35
   * (c) 2018-present Yuxi (Evan) You and Vue contributors
   * @license MIT
   **/
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function xo(e, t) {
    const r = new Set(e.split(","));
    return n => r.has(n);
  }
  const We = Xh.NODE_ENV !== "production" ? Object.freeze({}) : {},
    $o = Xh.NODE_ENV !== "production" ? Object.freeze([]) : [],
    ut = () => {},
    __ = () => !1,
    Ii = e =>
      e.charCodeAt(0) === 111 &&
      e.charCodeAt(1) === 110 && // uppercase letter
      (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97),
    Ls = e => e.startsWith("onUpdate:"),
    ft = Object.assign,
    Ec = (e, t) => {
      const r = e.indexOf(t);
      r > -1 && e.splice(r, 1);
    },
    $_ = Object.prototype.hasOwnProperty,
    Fe = (e, t) => $_.call(e, t),
    he = Array.isArray,
    Vn = e => ha(e) === "[object Map]",
    Zh = e => ha(e) === "[object Set]",
    ye = e => typeof e == "function",
    ot = e => typeof e == "string",
    En = e => typeof e == "symbol",
    ze = e => e !== null && typeof e == "object",
    Oc = e => (ze(e) || ye(e)) && ye(e.then) && ye(e.catch),
    Qh = Object.prototype.toString,
    ha = e => Qh.call(e),
    Sc = e => ha(e).slice(8, -1),
    eg = e => ha(e) === "[object Object]",
    Ac = e =>
      ot(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e,
    fi = /* @__PURE__ */ xo(
      // the leading comma is intentional so empty string "" is also included
      ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
    ),
    b_ = /* @__PURE__ */ xo(
      "bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo"
    ),
    ga = e => {
      const t = /* @__PURE__ */ Object.create(null);
      return r => t[r] || (t[r] = e(r));
    },
    w_ = /-(\w)/g,
    Ct = ga(e => e.replace(w_, (t, r) => (r ? r.toUpperCase() : ""))),
    E_ = /\B([A-Z])/g,
    Vt = ga(e => e.replace(E_, "-$1").toLowerCase()),
    Kn = ga(e => e.charAt(0).toUpperCase() + e.slice(1)),
    Ir = ga(e => (e ? `on${Kn(e)}` : "")),
    yn = (e, t) => !Object.is(e, t),
    Jo = (e, ...t) => {
      for (let r = 0; r < e.length; r++) e[r](...t);
    },
    Vs = (e, t, r, n = !1) => {
      Object.defineProperty(e, t, {
        configurable: !0,
        enumerable: !1,
        writable: n,
        value: r,
      });
    },
    O_ = e => {
      const t = parseFloat(e);
      return isNaN(t) ? e : t;
    },
    Ff = e => {
      const t = ot(e) ? Number(e) : NaN;
      return isNaN(t) ? e : t;
    };
  let Lf;
  const Nc = () =>
    Lf ||
    (Lf =
      typeof globalThis < "u"
        ? globalThis
        : typeof self < "u"
          ? self
          : typeof window < "u"
            ? window
            : typeof global < "u"
              ? global
              : {});
  function Qn(e) {
    if (he(e)) {
      const t = {};
      for (let r = 0; r < e.length; r++) {
        const n = e[r],
          o = ot(n) ? P_(n) : Qn(n);
        if (o) for (const i in o) t[i] = o[i];
      }
      return t;
    } else if (ot(e) || ze(e)) return e;
  }
  const S_ = /;(?![^(]*\))/g,
    A_ = /:([^]+)/,
    N_ = /\/\*[^]*?\*\//g;
  function P_(e) {
    const t = {};
    return (
      e
        .replace(N_, "")
        .split(S_)
        .forEach(r => {
          if (r) {
            const n = r.split(A_);
            n.length > 1 && (t[n[0].trim()] = n[1].trim());
          }
        }),
      t
    );
  }
  function it(e) {
    let t = "";
    if (ot(e)) t = e;
    else if (he(e))
      for (let r = 0; r < e.length; r++) {
        const n = it(e[r]);
        n && (t += n + " ");
      }
    else if (ze(e)) for (const r in e) e[r] && (t += r + " ");
    return t.trim();
  }
  function Do(e) {
    if (!e) return null;
    let { class: t, style: r } = e;
    return t && !ot(t) && (e.class = it(t)), r && (e.style = Qn(r)), e;
  }
  const C_ =
      "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",
    T_ = /* @__PURE__ */ xo(C_);
  function tg(e) {
    return !!e || e === "";
  }
  const rg = e => !!(e && e.__v_isRef === !0),
    _n = e =>
      ot(e)
        ? e
        : e == null
          ? ""
          : he(e) || (ze(e) && (e.toString === Qh || !ye(e.toString)))
            ? rg(e)
              ? _n(e.value)
              : JSON.stringify(e, ng, 2)
            : String(e),
    ng = (e, t) =>
      rg(t)
        ? ng(e, t.value)
        : Vn(t)
          ? {
              [`Map(${t.size})`]: [...t.entries()].reduce(
                (r, [n, o], i) => ((r[rl(n, i) + " =>"] = o), r),
                {}
              ),
            }
          : Zh(t)
            ? {
                [`Set(${t.size})`]: [...t.values()].map(r => rl(r)),
              }
            : En(t)
              ? rl(t)
              : ze(t) && !he(t) && !eg(t)
                ? String(t)
                : t,
    rl = (e, t = "") => {
      var r;
      return (
        // Symbol.description in es2019+ so we need to cast here to pass
        // the lib: es2016 check
        En(e) ? `Symbol(${(r = e.description) != null ? r : t})` : e
      );
    };
  var dt = {};
  function Er(e, ...t) {
    console.warn(`[Vue warn] ${e}`, ...t);
  }
  let Ut;
  class og {
    constructor(t = !1) {
      (this.detached = t),
        (this._active = !0),
        (this.effects = []),
        (this.cleanups = []),
        (this.parent = Ut),
        !t &&
          Ut &&
          (this.index = (Ut.scopes || (Ut.scopes = [])).push(this) - 1);
    }
    get active() {
      return this._active;
    }
    run(t) {
      if (this._active) {
        const r = Ut;
        try {
          return (Ut = this), t();
        } finally {
          Ut = r;
        }
      } else
        dt.NODE_ENV !== "production" &&
          Er("cannot run an inactive effect scope.");
    }
    /**
     * This should only be called on non-detached scopes
     * @internal
     */
    on() {
      Ut = this;
    }
    /**
     * This should only be called on non-detached scopes
     * @internal
     */
    off() {
      Ut = this.parent;
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
  function ig(e) {
    return new og(e);
  }
  function x_(e, t = Ut) {
    t && t.active && t.effects.push(e);
  }
  function Pc() {
    return Ut;
  }
  function sg(e) {
    Ut
      ? Ut.cleanups.push(e)
      : dt.NODE_ENV !== "production" &&
        Er(
          "onScopeDispose() is called when there is no active effect scope to be associated with."
        );
  }
  let kn;
  class Cc {
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
        x_(this, o);
    }
    get dirty() {
      if (this._dirtyLevel === 2 || this._dirtyLevel === 3) {
        (this._dirtyLevel = 1), Gr();
        for (let t = 0; t < this._depsLength; t++) {
          const r = this.deps[t];
          if (r.computed && (D_(r.computed), this._dirtyLevel >= 4)) break;
        }
        this._dirtyLevel === 1 && (this._dirtyLevel = 0), qr();
      }
      return this._dirtyLevel >= 4;
    }
    set dirty(t) {
      this._dirtyLevel = t ? 4 : 0;
    }
    run() {
      if (((this._dirtyLevel = 0), !this.active)) return this.fn();
      let t = gn,
        r = kn;
      try {
        return (gn = !0), (kn = this), this._runnings++, Vf(this), this.fn();
      } finally {
        kf(this), this._runnings--, (kn = r), (gn = t);
      }
    }
    stop() {
      this.active &&
        (Vf(this), kf(this), this.onStop && this.onStop(), (this.active = !1));
    }
  }
  function D_(e) {
    return e.value;
  }
  function Vf(e) {
    e._trackId++, (e._depsLength = 0);
  }
  function kf(e) {
    if (e.deps.length > e._depsLength) {
      for (let t = e._depsLength; t < e.deps.length; t++) ag(e.deps[t], e);
      e.deps.length = e._depsLength;
    }
  }
  function ag(e, t) {
    const r = e.get(t);
    r !== void 0 &&
      t._trackId !== r &&
      (e.delete(t), e.size === 0 && e.cleanup());
  }
  let gn = !0,
    Fl = 0;
  const lg = [];
  function Gr() {
    lg.push(gn), (gn = !1);
  }
  function qr() {
    const e = lg.pop();
    gn = e === void 0 ? !0 : e;
  }
  function Tc() {
    Fl++;
  }
  function xc() {
    for (Fl--; !Fl && Ll.length; ) Ll.shift()();
  }
  function cg(e, t, r) {
    var n;
    if (t.get(e) !== e._trackId) {
      t.set(e, e._trackId);
      const o = e.deps[e._depsLength];
      o !== t
        ? (o && ag(o, e), (e.deps[e._depsLength++] = t))
        : e._depsLength++,
        dt.NODE_ENV !== "production" &&
          ((n = e.onTrack) == null || n.call(e, ft({ effect: e }, r)));
    }
  }
  const Ll = [];
  function ug(e, t, r) {
    var n;
    Tc();
    for (const o of e.keys()) {
      let i;
      o._dirtyLevel < t &&
        (i ?? (i = e.get(o) === o._trackId)) &&
        (o._shouldSchedule || (o._shouldSchedule = o._dirtyLevel === 0),
        (o._dirtyLevel = t)),
        o._shouldSchedule &&
          (i ?? (i = e.get(o) === o._trackId)) &&
          (dt.NODE_ENV !== "production" &&
            ((n = o.onTrigger) == null || n.call(o, ft({ effect: o }, r))),
          o.trigger(),
          (!o._runnings || o.allowRecurse) &&
            o._dirtyLevel !== 2 &&
            ((o._shouldSchedule = !1), o.scheduler && Ll.push(o.scheduler)));
    }
    xc();
  }
  const fg = (e, t) => {
      const r = /* @__PURE__ */ new Map();
      return (r.cleanup = e), (r.computed = t), r;
    },
    ks = /* @__PURE__ */ new WeakMap(),
    Bn = Symbol(dt.NODE_ENV !== "production" ? "iterate" : ""),
    Vl = Symbol(dt.NODE_ENV !== "production" ? "Map key iterate" : "");
  function Et(e, t, r) {
    if (gn && kn) {
      let n = ks.get(e);
      n || ks.set(e, (n = /* @__PURE__ */ new Map()));
      let o = n.get(r);
      o || n.set(r, (o = fg(() => n.delete(r)))),
        cg(
          kn,
          o,
          dt.NODE_ENV !== "production"
            ? {
                target: e,
                type: t,
                key: r,
              }
            : void 0
        );
    }
  }
  function wr(e, t, r, n, o, i) {
    const s = ks.get(e);
    if (!s) return;
    let a = [];
    if (t === "clear") a = [...s.values()];
    else if (r === "length" && he(e)) {
      const l = Number(n);
      s.forEach((c, u) => {
        (u === "length" || (!En(u) && u >= l)) && a.push(c);
      });
    } else
      switch ((r !== void 0 && a.push(s.get(r)), t)) {
        case "add":
          he(e)
            ? Ac(r) && a.push(s.get("length"))
            : (a.push(s.get(Bn)), Vn(e) && a.push(s.get(Vl)));
          break;
        case "delete":
          he(e) || (a.push(s.get(Bn)), Vn(e) && a.push(s.get(Vl)));
          break;
        case "set":
          Vn(e) && a.push(s.get(Bn));
          break;
      }
    Tc();
    for (const l of a)
      l &&
        ug(
          l,
          4,
          dt.NODE_ENV !== "production"
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
    xc();
  }
  function I_(e, t) {
    const r = ks.get(e);
    return r && r.get(t);
  }
  const R_ = /* @__PURE__ */ xo("__proto__,__v_isRef,__isVue"),
    dg = new Set(
      /* @__PURE__ */ Object.getOwnPropertyNames(Symbol)
        .filter(e => e !== "arguments" && e !== "caller")
        .map(e => Symbol[e])
        .filter(En)
    ),
    Bf = /* @__PURE__ */ M_();
  function M_() {
    const e = {};
    return (
      ["includes", "indexOf", "lastIndexOf"].forEach(t => {
        e[t] = function (...r) {
          const n = Te(this);
          for (let i = 0, s = this.length; i < s; i++) Et(n, "get", i + "");
          const o = n[t](...r);
          return o === -1 || o === !1 ? n[t](...r.map(Te)) : o;
        };
      }),
      ["push", "pop", "shift", "unshift", "splice"].forEach(t => {
        e[t] = function (...r) {
          Gr(), Tc();
          const n = Te(this)[t].apply(this, r);
          return xc(), qr(), n;
        };
      }),
      e
    );
  }
  function j_(e) {
    En(e) || (e = String(e));
    const t = Te(this);
    return Et(t, "has", e), t.hasOwnProperty(e);
  }
  class pg {
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
        return n === (o ? (i ? $g : _g) : i ? yg : vg).get(t) || // receiver is not the reactive proxy, but has the same prototype
          // this means the reciever is a user proxy of the reactive proxy
          Object.getPrototypeOf(t) === Object.getPrototypeOf(n)
          ? t
          : void 0;
      const s = he(t);
      if (!o) {
        if (s && Fe(Bf, r)) return Reflect.get(Bf, r, n);
        if (r === "hasOwnProperty") return j_;
      }
      const a = Reflect.get(t, r, n);
      return (En(r) ? dg.has(r) : R_(r)) || (o || Et(t, "get", r), i)
        ? a
        : $t(a)
          ? s && Ac(r)
            ? a
            : a.value
          : ze(a)
            ? o
              ? ya(a)
              : Ri(a)
            : a;
    }
  }
  class hg extends pg {
    constructor(t = !1) {
      super(!1, t);
    }
    set(t, r, n, o) {
      let i = t[r];
      if (!this._isShallow) {
        const l = Ur(i);
        if (
          (!Fr(n) && !Ur(n) && ((i = Te(i)), (n = Te(n))),
          !he(t) && $t(i) && !$t(n))
        )
          return l ? !1 : ((i.value = n), !0);
      }
      const s = he(t) && Ac(r) ? Number(r) < t.length : Fe(t, r),
        a = Reflect.set(t, r, n, o);
      return (
        t === Te(o) &&
          (s ? yn(n, i) && wr(t, "set", r, n, i) : wr(t, "add", r, n)),
        a
      );
    }
    deleteProperty(t, r) {
      const n = Fe(t, r),
        o = t[r],
        i = Reflect.deleteProperty(t, r);
      return i && n && wr(t, "delete", r, void 0, o), i;
    }
    has(t, r) {
      const n = Reflect.has(t, r);
      return (!En(r) || !dg.has(r)) && Et(t, "has", r), n;
    }
    ownKeys(t) {
      return Et(t, "iterate", he(t) ? "length" : Bn), Reflect.ownKeys(t);
    }
  }
  class gg extends pg {
    constructor(t = !1) {
      super(!0, t);
    }
    set(t, r) {
      return (
        dt.NODE_ENV !== "production" &&
          Er(
            `Set operation on key "${String(r)}" failed: target is readonly.`,
            t
          ),
        !0
      );
    }
    deleteProperty(t, r) {
      return (
        dt.NODE_ENV !== "production" &&
          Er(
            `Delete operation on key "${String(r)}" failed: target is readonly.`,
            t
          ),
        !0
      );
    }
  }
  const F_ = /* @__PURE__ */ new hg(),
    L_ = /* @__PURE__ */ new gg(),
    V_ = /* @__PURE__ */ new hg(!0),
    k_ = /* @__PURE__ */ new gg(!0),
    Dc = e => e,
    ma = e => Reflect.getPrototypeOf(e);
  function as(e, t, r = !1, n = !1) {
    e = e.__v_raw;
    const o = Te(e),
      i = Te(t);
    r || (yn(t, i) && Et(o, "get", t), Et(o, "get", i));
    const { has: s } = ma(o),
      a = n ? Dc : r ? Ic : Si;
    if (s.call(o, t)) return a(e.get(t));
    if (s.call(o, i)) return a(e.get(i));
    e !== o && e.get(t);
  }
  function ls(e, t = !1) {
    const r = this.__v_raw,
      n = Te(r),
      o = Te(e);
    return (
      t || (yn(e, o) && Et(n, "has", e), Et(n, "has", o)),
      e === o ? r.has(e) : r.has(e) || r.has(o)
    );
  }
  function cs(e, t = !1) {
    return (
      (e = e.__v_raw), !t && Et(Te(e), "iterate", Bn), Reflect.get(e, "size", e)
    );
  }
  function zf(e, t = !1) {
    !t && !Fr(e) && !Ur(e) && (e = Te(e));
    const r = Te(this);
    return ma(r).has.call(r, e) || (r.add(e), wr(r, "add", e, e)), this;
  }
  function Uf(e, t, r = !1) {
    !r && !Fr(t) && !Ur(t) && (t = Te(t));
    const n = Te(this),
      { has: o, get: i } = ma(n);
    let s = o.call(n, e);
    s
      ? dt.NODE_ENV !== "production" && mg(n, o, e)
      : ((e = Te(e)), (s = o.call(n, e)));
    const a = i.call(n, e);
    return (
      n.set(e, t),
      s ? yn(t, a) && wr(n, "set", e, t, a) : wr(n, "add", e, t),
      this
    );
  }
  function Wf(e) {
    const t = Te(this),
      { has: r, get: n } = ma(t);
    let o = r.call(t, e);
    o
      ? dt.NODE_ENV !== "production" && mg(t, r, e)
      : ((e = Te(e)), (o = r.call(t, e)));
    const i = n ? n.call(t, e) : void 0,
      s = t.delete(e);
    return o && wr(t, "delete", e, void 0, i), s;
  }
  function Hf() {
    const e = Te(this),
      t = e.size !== 0,
      r =
        dt.NODE_ENV !== "production"
          ? Vn(e)
            ? new Map(e)
            : new Set(e)
          : void 0,
      n = e.clear();
    return t && wr(e, "clear", void 0, void 0, r), n;
  }
  function us(e, t) {
    return function (n, o) {
      const i = this,
        s = i.__v_raw,
        a = Te(s),
        l = t ? Dc : e ? Ic : Si;
      return (
        !e && Et(a, "iterate", Bn),
        s.forEach((c, u) => n.call(o, l(c), l(u), i))
      );
    };
  }
  function fs(e, t, r) {
    return function (...n) {
      const o = this.__v_raw,
        i = Te(o),
        s = Vn(i),
        a = e === "entries" || (e === Symbol.iterator && s),
        l = e === "keys" && s,
        c = o[e](...n),
        u = r ? Dc : t ? Ic : Si;
      return (
        !t && Et(i, "iterate", l ? Vl : Bn),
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
  function nn(e) {
    return function (...t) {
      if (dt.NODE_ENV !== "production") {
        const r = t[0] ? `on key "${t[0]}" ` : "";
        Er(`${Kn(e)} operation ${r}failed: target is readonly.`, Te(this));
      }
      return e === "delete" ? !1 : e === "clear" ? void 0 : this;
    };
  }
  function B_() {
    const e = {
        get(i) {
          return as(this, i);
        },
        get size() {
          return cs(this);
        },
        has: ls,
        add: zf,
        set: Uf,
        delete: Wf,
        clear: Hf,
        forEach: us(!1, !1),
      },
      t = {
        get(i) {
          return as(this, i, !1, !0);
        },
        get size() {
          return cs(this);
        },
        has: ls,
        add(i) {
          return zf.call(this, i, !0);
        },
        set(i, s) {
          return Uf.call(this, i, s, !0);
        },
        delete: Wf,
        clear: Hf,
        forEach: us(!1, !0),
      },
      r = {
        get(i) {
          return as(this, i, !0);
        },
        get size() {
          return cs(this, !0);
        },
        has(i) {
          return ls.call(this, i, !0);
        },
        add: nn("add"),
        set: nn("set"),
        delete: nn("delete"),
        clear: nn("clear"),
        forEach: us(!0, !1),
      },
      n = {
        get(i) {
          return as(this, i, !0, !0);
        },
        get size() {
          return cs(this, !0);
        },
        has(i) {
          return ls.call(this, i, !0);
        },
        add: nn("add"),
        set: nn("set"),
        delete: nn("delete"),
        clear: nn("clear"),
        forEach: us(!0, !0),
      };
    return (
      ["keys", "values", "entries", Symbol.iterator].forEach(i => {
        (e[i] = fs(i, !1, !1)),
          (r[i] = fs(i, !0, !1)),
          (t[i] = fs(i, !1, !0)),
          (n[i] = fs(i, !0, !0));
      }),
      [e, r, t, n]
    );
  }
  const [z_, U_, W_, H_] = /* @__PURE__ */ B_();
  function va(e, t) {
    const r = t ? (e ? H_ : W_) : e ? U_ : z_;
    return (n, o, i) =>
      o === "__v_isReactive"
        ? !e
        : o === "__v_isReadonly"
          ? e
          : o === "__v_raw"
            ? n
            : Reflect.get(Fe(r, o) && o in n ? r : n, o, i);
  }
  const K_ = {
      get: /* @__PURE__ */ va(!1, !1),
    },
    G_ = {
      get: /* @__PURE__ */ va(!1, !0),
    },
    q_ = {
      get: /* @__PURE__ */ va(!0, !1),
    },
    Y_ = {
      get: /* @__PURE__ */ va(!0, !0),
    };
  function mg(e, t, r) {
    const n = Te(r);
    if (n !== r && t.call(e, n)) {
      const o = Sc(e);
      Er(
        `Reactive ${o} contains both the raw and reactive versions of the same object${o === "Map" ? " as keys" : ""}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
      );
    }
  }
  const vg = /* @__PURE__ */ new WeakMap(),
    yg = /* @__PURE__ */ new WeakMap(),
    _g = /* @__PURE__ */ new WeakMap(),
    $g = /* @__PURE__ */ new WeakMap();
  function J_(e) {
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
  function X_(e) {
    return e.__v_skip || !Object.isExtensible(e) ? 0 : J_(Sc(e));
  }
  function Ri(e) {
    return Ur(e) ? e : _a(e, !1, F_, K_, vg);
  }
  function Z_(e) {
    return _a(e, !1, V_, G_, yg);
  }
  function ya(e) {
    return _a(e, !0, L_, q_, _g);
  }
  function At(e) {
    return _a(e, !0, k_, Y_, $g);
  }
  function _a(e, t, r, n, o) {
    if (!ze(e))
      return (
        dt.NODE_ENV !== "production" &&
          Er(
            `value cannot be made ${t ? "readonly" : "reactive"}: ${String(e)}`
          ),
        e
      );
    if (e.__v_raw && !(t && e.__v_isReactive)) return e;
    const i = o.get(e);
    if (i) return i;
    const s = X_(e);
    if (s === 0) return e;
    const a = new Proxy(e, s === 2 ? n : r);
    return o.set(e, a), a;
  }
  function bo(e) {
    return Ur(e) ? bo(e.__v_raw) : !!(e && e.__v_isReactive);
  }
  function Ur(e) {
    return !!(e && e.__v_isReadonly);
  }
  function Fr(e) {
    return !!(e && e.__v_isShallow);
  }
  function Bs(e) {
    return e ? !!e.__v_raw : !1;
  }
  function Te(e) {
    const t = e && e.__v_raw;
    return t ? Te(t) : e;
  }
  function Q_(e) {
    return Object.isExtensible(e) && Vs(e, "__v_skip", !0), e;
  }
  const Si = e => (ze(e) ? Ri(e) : e),
    Ic = e => (ze(e) ? ya(e) : e),
    e$ =
      "Computed is still dirty after getter evaluation, likely because a computed is mutating its own dependency in its getter. State mutations in computed getters should be avoided.  Check the docs for more details: https://vuejs.org/guide/essentials/computed.html#getters-should-be-side-effect-free";
  class bg {
    constructor(t, r, n, o) {
      (this.getter = t),
        (this._setter = r),
        (this.dep = void 0),
        (this.__v_isRef = !0),
        (this.__v_isReadonly = !1),
        (this.effect = new Cc(
          () => t(this._value),
          () => di(this, this.effect._dirtyLevel === 2 ? 2 : 3)
        )),
        (this.effect.computed = this),
        (this.effect.active = this._cacheable = !o),
        (this.__v_isReadonly = n);
    }
    get value() {
      const t = Te(this);
      return (
        (!t._cacheable || t.effect.dirty) &&
          yn(t._value, (t._value = t.effect.run())) &&
          di(t, 4),
        Rc(t),
        t.effect._dirtyLevel >= 2 &&
          (dt.NODE_ENV !== "production" &&
            this._warnRecursive &&
            Er(
              e$,
              `

getter: `,
              this.getter
            ),
          di(t, 2)),
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
  function t$(e, t, r = !1) {
    let n, o;
    const i = ye(e);
    i
      ? ((n = e),
        (o =
          dt.NODE_ENV !== "production"
            ? () => {
                Er("Write operation failed: computed value is readonly");
              }
            : ut))
      : ((n = e.get), (o = e.set));
    const s = new bg(n, o, i || !o, r);
    return (
      dt.NODE_ENV !== "production" &&
        t &&
        !r &&
        ((s.effect.onTrack = t.onTrack), (s.effect.onTrigger = t.onTrigger)),
      s
    );
  }
  function Rc(e) {
    var t;
    gn &&
      kn &&
      ((e = Te(e)),
      cg(
        kn,
        (t = e.dep) != null
          ? t
          : (e.dep = fg(() => (e.dep = void 0), e instanceof bg ? e : void 0)),
        dt.NODE_ENV !== "production"
          ? {
              target: e,
              type: "get",
              key: "value",
            }
          : void 0
      ));
  }
  function di(e, t = 4, r, n) {
    e = Te(e);
    const o = e.dep;
    o &&
      ug(
        o,
        t,
        dt.NODE_ENV !== "production"
          ? {
              target: e,
              type: "set",
              key: "value",
              newValue: r,
              oldValue: n,
            }
          : void 0
      );
  }
  function $t(e) {
    return !!(e && e.__v_isRef === !0);
  }
  function Oe(e) {
    return Eg(e, !1);
  }
  function wg(e) {
    return Eg(e, !0);
  }
  function Eg(e, t) {
    return $t(e) ? e : new r$(e, t);
  }
  class r$ {
    constructor(t, r) {
      (this.__v_isShallow = r),
        (this.dep = void 0),
        (this.__v_isRef = !0),
        (this._rawValue = r ? t : Te(t)),
        (this._value = r ? t : Si(t));
    }
    get value() {
      return Rc(this), this._value;
    }
    set value(t) {
      const r = this.__v_isShallow || Fr(t) || Ur(t);
      if (((t = r ? t : Te(t)), yn(t, this._rawValue))) {
        const n = this._rawValue;
        (this._rawValue = t), (this._value = r ? t : Si(t)), di(this, 4, t, n);
      }
    }
  }
  function U(e) {
    return $t(e) ? e.value : e;
  }
  const n$ = {
    get: (e, t, r) => U(Reflect.get(e, t, r)),
    set: (e, t, r, n) => {
      const o = e[t];
      return $t(o) && !$t(r) ? ((o.value = r), !0) : Reflect.set(e, t, r, n);
    },
  };
  function Og(e) {
    return bo(e) ? e : new Proxy(e, n$);
  }
  class o$ {
    constructor(t) {
      (this.dep = void 0), (this.__v_isRef = !0);
      const { get: r, set: n } = t(
        () => Rc(this),
        () => di(this)
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
  function i$(e) {
    return new o$(e);
  }
  function Mt(e) {
    dt.NODE_ENV !== "production" &&
      !Bs(e) &&
      Er("toRefs() expects a reactive object but received a plain one.");
    const t = he(e) ? new Array(e.length) : {};
    for (const r in e) t[r] = Sg(e, r);
    return t;
  }
  class s$ {
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
      return I_(Te(this._object), this._key);
    }
  }
  class a$ {
    constructor(t) {
      (this._getter = t), (this.__v_isRef = !0), (this.__v_isReadonly = !0);
    }
    get value() {
      return this._getter();
    }
  }
  function l$(e, t, r) {
    return $t(e)
      ? e
      : ye(e)
        ? new a$(e)
        : ze(e) && arguments.length > 1
          ? Sg(e, t, r)
          : Oe(e);
  }
  function Sg(e, t, r) {
    const n = e[t];
    return $t(n) ? n : new s$(e, t, r);
  }
  var D = {};
  const zn = [];
  function As(e) {
    zn.push(e);
  }
  function Ns() {
    zn.pop();
  }
  let nl = !1;
  function Z(e, ...t) {
    if (nl) return;
    (nl = !0), Gr();
    const r = zn.length ? zn[zn.length - 1].component : null,
      n = r && r.appContext.config.warnHandler,
      o = c$();
    if (n)
      Lr(n, r, 11, [
        // eslint-disable-next-line no-restricted-syntax
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
        o.map(({ vnode: i }) => `at <${Sa(r, i.type)}>`).join(`
`),
        o,
      ]);
    else {
      const i = [`[Vue warn]: ${e}`, ...t];
      o.length &&
        i.push(
          `
`,
          ...u$(o)
        ),
        console.warn(...i);
    }
    qr(), (nl = !1);
  }
  function c$() {
    let e = zn[zn.length - 1];
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
  function u$(e) {
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
          ...f$(r)
        );
      }),
      t
    );
  }
  function f$({ vnode: e, recurseCount: t }) {
    const r = t > 0 ? `... (${t} recursive calls)` : "",
      n = e.component ? e.component.parent == null : !1,
      o = ` at <${Sa(e.component, e.type, n)}`,
      i = ">" + r;
    return e.props ? [o, ...d$(e.props), i] : [o + i];
  }
  function d$(e) {
    const t = [],
      r = Object.keys(e);
    return (
      r.slice(0, 3).forEach(n => {
        t.push(...Ag(n, e[n]));
      }),
      r.length > 3 && t.push(" ..."),
      t
    );
  }
  function Ag(e, t, r) {
    return ot(t)
      ? ((t = JSON.stringify(t)), r ? t : [`${e}=${t}`])
      : typeof t == "number" || typeof t == "boolean" || t == null
        ? r
          ? t
          : [`${e}=${t}`]
        : $t(t)
          ? ((t = Ag(e, Te(t.value), !0)), r ? t : [`${e}=Ref<`, t, ">"])
          : ye(t)
            ? [`${e}=fn${t.name ? `<${t.name}>` : ""}`]
            : ((t = Te(t)), r ? t : [`${e}=`, t]);
  }
  const Mc = {
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
    14: "scheduler flush",
    15: "component update",
  };
  function Lr(e, t, r, n) {
    try {
      return n ? e(...n) : e();
    } catch (o) {
      Mi(o, t, r);
    }
  }
  function sr(e, t, r, n) {
    if (ye(e)) {
      const o = Lr(e, t, r, n);
      return (
        o &&
          Oc(o) &&
          o.catch(i => {
            Mi(i, t, r);
          }),
        o
      );
    }
    if (he(e)) {
      const o = [];
      for (let i = 0; i < e.length; i++) o.push(sr(e[i], t, r, n));
      return o;
    } else
      D.NODE_ENV !== "production" &&
        Z(
          `Invalid value type passed to callWithAsyncErrorHandling(): ${typeof e}`
        );
  }
  function Mi(e, t, r, n = !0) {
    const o = t ? t.vnode : null;
    if (t) {
      let i = t.parent;
      const s = t.proxy,
        a =
          D.NODE_ENV !== "production"
            ? Mc[r]
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
        Gr(), Lr(l, null, 10, [e, s, a]), qr();
        return;
      }
    }
    p$(e, r, o, n);
  }
  function p$(e, t, r, n = !0) {
    if (D.NODE_ENV !== "production") {
      const o = Mc[t];
      if (
        (r && As(r),
        Z(`Unhandled error${o ? ` during execution of ${o}` : ""}`),
        r && Ns(),
        n)
      )
        throw e;
      console.error(e);
    } else console.error(e);
  }
  let Ai = !1,
    kl = !1;
  const Pt = [];
  let vr = 0;
  const wo = [];
  let un = null,
    Rn = 0;
  const Ng = /* @__PURE__ */ Promise.resolve();
  let jc = null;
  const h$ = 100;
  function On(e) {
    const t = jc || Ng;
    return e ? t.then(this ? e.bind(this) : e) : t;
  }
  function g$(e) {
    let t = vr + 1,
      r = Pt.length;
    for (; t < r; ) {
      const n = (t + r) >>> 1,
        o = Pt[n],
        i = Ni(o);
      i < e || (i === e && o.pre) ? (t = n + 1) : (r = n);
    }
    return t;
  }
  function $a(e) {
    (!Pt.length || !Pt.includes(e, Ai && e.allowRecurse ? vr + 1 : vr)) &&
      (e.id == null ? Pt.push(e) : Pt.splice(g$(e.id), 0, e), Pg());
  }
  function Pg() {
    !Ai && !kl && ((kl = !0), (jc = Ng.then(xg)));
  }
  function m$(e) {
    const t = Pt.indexOf(e);
    t > vr && Pt.splice(t, 1);
  }
  function Cg(e) {
    he(e)
      ? wo.push(...e)
      : (!un || !un.includes(e, e.allowRecurse ? Rn + 1 : Rn)) && wo.push(e),
      Pg();
  }
  function Kf(e, t, r = Ai ? vr + 1 : 0) {
    for (
      D.NODE_ENV !== "production" && (t = t || /* @__PURE__ */ new Map());
      r < Pt.length;
      r++
    ) {
      const n = Pt[r];
      if (n && n.pre) {
        if ((e && n.id !== e.uid) || (D.NODE_ENV !== "production" && Fc(t, n)))
          continue;
        Pt.splice(r, 1), r--, n();
      }
    }
  }
  function Tg(e) {
    if (wo.length) {
      const t = [...new Set(wo)].sort((r, n) => Ni(r) - Ni(n));
      if (((wo.length = 0), un)) {
        un.push(...t);
        return;
      }
      for (
        un = t,
          D.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map()),
          Rn = 0;
        Rn < un.length;
        Rn++
      ) {
        const r = un[Rn];
        (D.NODE_ENV !== "production" && Fc(e, r)) || (r.active !== !1 && r());
      }
      (un = null), (Rn = 0);
    }
  }
  const Ni = e => (e.id == null ? 1 / 0 : e.id),
    v$ = (e, t) => {
      const r = Ni(e) - Ni(t);
      if (r === 0) {
        if (e.pre && !t.pre) return -1;
        if (t.pre && !e.pre) return 1;
      }
      return r;
    };
  function xg(e) {
    (kl = !1),
      (Ai = !0),
      D.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map()),
      Pt.sort(v$);
    const t = D.NODE_ENV !== "production" ? r => Fc(e, r) : ut;
    try {
      for (vr = 0; vr < Pt.length; vr++) {
        const r = Pt[vr];
        if (r && r.active !== !1) {
          if (D.NODE_ENV !== "production" && t(r)) continue;
          Lr(r, r.i, r.i ? 15 : 14);
        }
      }
    } finally {
      (vr = 0),
        (Pt.length = 0),
        Tg(e),
        (Ai = !1),
        (jc = null),
        (Pt.length || wo.length) && xg(e);
    }
  }
  function Fc(e, t) {
    if (!e.has(t)) e.set(t, 1);
    else {
      const r = e.get(t);
      if (r > h$) {
        const n = t.i,
          o = n && Kc(n.type);
        return (
          Mi(
            `Maximum recursive updates exceeded${o ? ` in component <${o}>` : ""}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`,
            null,
            10
          ),
          !0
        );
      } else e.set(t, r + 1);
    }
  }
  let mn = !1;
  const Ps = /* @__PURE__ */ new Map();
  D.NODE_ENV !== "production" &&
    (Nc().__VUE_HMR_RUNTIME__ = {
      createRecord: ol(Dg),
      rerender: ol($$),
      reload: ol(b$),
    });
  const Gn = /* @__PURE__ */ new Map();
  function y$(e) {
    const t = e.type.__hmrId;
    let r = Gn.get(t);
    r || (Dg(t, e.type), (r = Gn.get(t))), r.instances.add(e);
  }
  function _$(e) {
    Gn.get(e.type.__hmrId).instances.delete(e);
  }
  function Dg(e, t) {
    return Gn.has(e)
      ? !1
      : (Gn.set(e, {
          initialDef: zs(t),
          instances: /* @__PURE__ */ new Set(),
        }),
        !0);
  }
  function zs(e) {
    return ym(e) ? e.__vccOpts : e;
  }
  function $$(e, t) {
    const r = Gn.get(e);
    r &&
      ((r.initialDef.render = t),
      [...r.instances].forEach(n => {
        t && ((n.render = t), (zs(n.type).render = t)),
          (n.renderCache = []),
          (mn = !0),
          (n.effect.dirty = !0),
          n.update(),
          (mn = !1);
      }));
  }
  function b$(e, t) {
    const r = Gn.get(e);
    if (!r) return;
    (t = zs(t)), Gf(r.initialDef, t);
    const n = [...r.instances];
    for (let o = 0; o < n.length; o++) {
      const i = n[o],
        s = zs(i.type);
      let a = Ps.get(s);
      a ||
        (s !== r.initialDef && Gf(s, t),
        Ps.set(s, (a = /* @__PURE__ */ new Set()))),
        a.add(i),
        i.appContext.propsCache.delete(i.type),
        i.appContext.emitsCache.delete(i.type),
        i.appContext.optionsCache.delete(i.type),
        i.ceReload
          ? (a.add(i), i.ceReload(t.styles), a.delete(i))
          : i.parent
            ? ((i.parent.effect.dirty = !0),
              $a(() => {
                i.parent.update(), a.delete(i);
              }))
            : i.appContext.reload
              ? i.appContext.reload()
              : typeof window < "u"
                ? window.location.reload()
                : console.warn(
                    "[HMR] Root or manually mounted instance modified. Full reload required."
                  );
    }
    Cg(() => {
      Ps.clear();
    });
  }
  function Gf(e, t) {
    ft(e, t);
    for (const r in e) r !== "__file" && !(r in t) && delete e[r];
  }
  function ol(e) {
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
  let yr,
    ai = [],
    Bl = !1;
  function ji(e, ...t) {
    yr ? yr.emit(e, ...t) : Bl || ai.push({ event: e, args: t });
  }
  function Ig(e, t) {
    var r, n;
    (yr = e),
      yr
        ? ((yr.enabled = !0),
          ai.forEach(({ event: o, args: i }) => yr.emit(o, ...i)),
          (ai = []))
        : /* handle late devtools injection - only do this if we are in an actual */ /* browser environment to avoid the timer handle stalling test runner exit */ /* (#4815) */ typeof window <
              "u" && // some envs mock window but not fully
            window.HTMLElement && // also exclude jsdom
            // eslint-disable-next-line no-restricted-syntax
            !(
              (n = (r = window.navigator) == null ? void 0 : r.userAgent) !=
                null && n.includes("jsdom")
            )
          ? ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ =
              t.__VUE_DEVTOOLS_HOOK_REPLAY__ || []).push(i => {
              Ig(i, t);
            }),
            setTimeout(() => {
              yr ||
                ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ = null), (Bl = !0), (ai = []));
            }, 3e3))
          : ((Bl = !0), (ai = []));
  }
  function w$(e, t) {
    ji("app:init", e, t, {
      Fragment: Nt,
      Text: Li,
      Comment: Rt,
      Static: Cs,
    });
  }
  function E$(e) {
    ji("app:unmount", e);
  }
  const O$ = /* @__PURE__ */ Lc(
      "component:added"
      /* COMPONENT_ADDED */
    ),
    Rg = /* @__PURE__ */ Lc(
      "component:updated"
      /* COMPONENT_UPDATED */
    ),
    S$ = /* @__PURE__ */ Lc(
      "component:removed"
      /* COMPONENT_REMOVED */
    ),
    A$ = e => {
      yr &&
        typeof yr.cleanupBuffer == "function" && // remove the component if it wasn't buffered
        !yr.cleanupBuffer(e) &&
        S$(e);
    };
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function Lc(e) {
    return t => {
      ji(e, t.appContext.app, t.uid, t.parent ? t.parent.uid : void 0, t);
    };
  }
  const N$ = /* @__PURE__ */ Mg(
      "perf:start"
      /* PERFORMANCE_START */
    ),
    P$ = /* @__PURE__ */ Mg(
      "perf:end"
      /* PERFORMANCE_END */
    );
  function Mg(e) {
    return (t, r, n) => {
      ji(e, t.appContext.app, t.uid, t, r, n);
    };
  }
  function C$(e, t, r) {
    ji("component:emit", e.appContext.app, e, t, r);
  }
  let ht = null,
    jg = null;
  function Us(e) {
    const t = ht;
    return (ht = e), (jg = (e && e.type.__scopeId) || null), t;
  }
  function se(e, t = ht, r) {
    if (!t || e._n) return e;
    const n = (...o) => {
      n._d && sd(-1);
      const i = Us(t);
      let s;
      try {
        s = e(...o);
      } finally {
        Us(i), n._d && sd(1);
      }
      return D.NODE_ENV !== "production" && Rg(t), s;
    };
    return (n._n = !0), (n._c = !0), (n._d = !0), n;
  }
  function Fg(e) {
    b_(e) &&
      Z("Do not use built-in directive ids as custom directive id: " + e);
  }
  function T$(e, t) {
    if (ht === null)
      return (
        D.NODE_ENV !== "production" &&
          Z("withDirectives can only be used inside render functions."),
        e
      );
    const r = Oa(ht),
      n = e.dirs || (e.dirs = []);
    for (let o = 0; o < t.length; o++) {
      let [i, s, a, l = We] = t[o];
      i &&
        (ye(i) &&
          (i = {
            mounted: i,
            updated: i,
          }),
        i.deep && pn(s),
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
  function Tn(e, t, r, n) {
    const o = e.dirs,
      i = t && t.dirs;
    for (let s = 0; s < o.length; s++) {
      const a = o[s];
      i && (a.oldValue = i[s].value);
      let l = a.dir[n];
      l && (Gr(), sr(l, r, 8, [e.el, a, e, t]), qr());
    }
  }
  function Lg(e, t) {
    e.shapeFlag & 6 && e.component
      ? Lg(e.component.subTree, t)
      : e.shapeFlag & 128
        ? ((e.ssContent.transition = t.clone(e.ssContent)),
          (e.ssFallback.transition = t.clone(e.ssFallback)))
        : (e.transition = t);
  }
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function me(e, t) {
    return ye(e)
      ? // #8326: extend call and options.name access are considered side-effects
        // by Rollup, so we have to wrap it in a pure-annotated IIFE.
        ft({ name: e.name }, t, { setup: e })
      : e;
  }
  const pi = e => !!e.type.__asyncLoader,
    Vc = e => e.type.__isKeepAlive;
  function x$(e, t) {
    Vg(e, "a", t);
  }
  function D$(e, t) {
    Vg(e, "da", t);
  }
  function Vg(e, t, r = yt) {
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
    if ((ba(t, n, r), r)) {
      let o = r.parent;
      for (; o && o.parent; )
        Vc(o.parent.vnode) && I$(n, t, r, o), (o = o.parent);
    }
  }
  function I$(e, t, r, n) {
    const o = ba(
      t,
      e,
      n,
      !0
      /* prepend */
    );
    Fi(() => {
      Ec(n[t], o);
    }, r);
  }
  function ba(e, t, r = yt, n = !1) {
    if (r) {
      const o = r[e] || (r[e] = []),
        i =
          t.__weh ||
          (t.__weh = (...s) => {
            Gr();
            const a = Vi(r),
              l = sr(t, r, e, s);
            return a(), qr(), l;
          });
      return n ? o.unshift(i) : o.push(i), i;
    } else if (D.NODE_ENV !== "production") {
      const o = Ir(Mc[e].replace(/ hook$/, ""));
      Z(
        `${o} is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.`
      );
    }
  }
  const Yr =
      e =>
      (t, r = yt) => {
        (!Ea || e === "sp") && ba(e, (...n) => t(...n), r);
      },
    R$ = Yr("bm"),
    Jr = Yr("m"),
    M$ = Yr("bu"),
    j$ = Yr("u"),
    kg = Yr("bum"),
    Fi = Yr("um"),
    F$ = Yr("sp"),
    L$ = Yr("rtg"),
    V$ = Yr("rtc");
  function k$(e, t = yt) {
    ba("ec", e, t);
  }
  const Bg = "components";
  function Qe(e, t) {
    return Ug(Bg, e, !0, t) || e;
  }
  const zg = Symbol.for("v-ndc");
  function B$(e) {
    return ot(e) ? Ug(Bg, e, !1) || e : e || zg;
  }
  function Ug(e, t, r = !0, n = !1) {
    const o = ht || yt;
    if (o) {
      const i = o.type;
      {
        const a = Kc(i, !1);
        if (a && (a === t || a === Ct(t) || a === Kn(Ct(t)))) return i;
      }
      const s =
        // local registration
        // check instance[type] first which is resolved for options API
        qf(o[e] || i[e], t) || // global registration
        qf(o.appContext[e], t);
      return !s && n
        ? i
        : (D.NODE_ENV !== "production" &&
            r &&
            !s &&
            Z(`Failed to resolve ${e.slice(0, -1)}: ${t}
If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement.`),
          s);
    } else
      D.NODE_ENV !== "production" &&
        Z(
          `resolve${Kn(e.slice(0, -1))} can only be used in render() or setup().`
        );
  }
  function qf(e, t) {
    return e && (e[t] || e[Ct(t)] || e[Kn(Ct(t))]);
  }
  function de(e, t, r = {}, n, o) {
    if (ht.isCE || (ht.parent && pi(ht.parent) && ht.parent.isCE))
      return t !== "default" && (r.name = t), Ve("slot", r, n && n());
    let i = e[t];
    D.NODE_ENV !== "production" &&
      i &&
      i.length > 1 &&
      (Z(
        "SSR-optimized slot function detected in a non-SSR-optimized render function. You need to mark this component with $dynamic-slots in the parent template."
      ),
      (i = () => [])),
      i && i._c && (i._d = !1),
      fe();
    const s = i && Wg(i(r)),
      a = $e(
        Nt,
        {
          key:
            (r.key || // slot content array of a dynamic conditional slot may have a branch
              // key attached in the `createSlots` helper, respect that
              (s && s.key) ||
              `_${t}`) + // #7256 force differentiate fallback content from actual content
            (!s && n ? "_fb" : ""),
        },
        s || (n ? n() : []),
        s && e._ === 1 ? 64 : -2
      );
    return (
      a.scopeId && (a.slotScopeIds = [a.scopeId + "-s"]),
      i && i._c && (i._d = !0),
      a
    );
  }
  function Wg(e) {
    return e.some(t =>
      So(t) ? !(t.type === Rt || (t.type === Nt && !Wg(t.children))) : !0
    )
      ? e
      : null;
  }
  function z$(e, t) {
    const r = {};
    if (D.NODE_ENV !== "production" && !ze(e))
      return Z("v-on with no argument expects an object value."), r;
    for (const n in e) r[Ir(n)] = e[n];
    return r;
  }
  const zl = e => (e ? (gm(e) ? Oa(e) : zl(e.parent)) : null),
    Un =
      // Move PURE marker to new line to workaround compiler discarding it
      // due to type annotation
      /* @__PURE__ */ ft(/* @__PURE__ */ Object.create(null), {
        $: e => e,
        $el: e => e.vnode.el,
        $data: e => e.data,
        $props: e => (D.NODE_ENV !== "production" ? At(e.props) : e.props),
        $attrs: e => (D.NODE_ENV !== "production" ? At(e.attrs) : e.attrs),
        $slots: e => (D.NODE_ENV !== "production" ? At(e.slots) : e.slots),
        $refs: e => (D.NODE_ENV !== "production" ? At(e.refs) : e.refs),
        $parent: e => zl(e.parent),
        $root: e => zl(e.root),
        $emit: e => e.emit,
        $options: e => Bc(e),
        $forceUpdate: e =>
          e.f ||
          (e.f = () => {
            (e.effect.dirty = !0), $a(e.update);
          }),
        $nextTick: e => e.n || (e.n = On.bind(e.proxy)),
        $watch: e => Nb.bind(e),
      }),
    kc = e => e === "_" || e === "$",
    il = (e, t) => e !== We && !e.__isScriptSetup && Fe(e, t),
    Hg = {
      get({ _: e }, t) {
        if (t === "__v_skip") return !0;
        const {
          ctx: r,
          setupState: n,
          data: o,
          props: i,
          accessCache: s,
          type: a,
          appContext: l,
        } = e;
        if (D.NODE_ENV !== "production" && t === "__isVue") return !0;
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
            if (il(n, t)) return (s[t] = 1), n[t];
            if (o !== We && Fe(o, t)) return (s[t] = 2), o[t];
            if (
              // only cache other properties when instance has declared (thus stable)
              // props
              (c = e.propsOptions[0]) &&
              Fe(c, t)
            )
              return (s[t] = 3), i[t];
            if (r !== We && Fe(r, t)) return (s[t] = 4), r[t];
            Wl && (s[t] = 0);
          }
        }
        const u = Un[t];
        let f, d;
        if (u)
          return (
            t === "$attrs"
              ? (Et(e.attrs, "get", ""), D.NODE_ENV !== "production" && Ks())
              : D.NODE_ENV !== "production" &&
                t === "$slots" &&
                Et(e, "get", t),
            u(e)
          );
        if (
          // css module (injected by vue-loader)
          (f = a.__cssModules) &&
          (f = f[t])
        )
          return f;
        if (r !== We && Fe(r, t)) return (s[t] = 4), r[t];
        if (
          // global properties
          ((d = l.config.globalProperties), Fe(d, t))
        )
          return d[t];
        D.NODE_ENV !== "production" &&
          ht &&
          (!ot(t) || // #1091 avoid internal isRef/isVNode checks on component instance leading
            // to infinite warning loop
            t.indexOf("__v") !== 0) &&
          (o !== We && kc(t[0]) && Fe(o, t)
            ? Z(
                `Property ${JSON.stringify(
                  t
                )} must be accessed via $data because it starts with a reserved character ("$" or "_") and is not proxied on the render context.`
              )
            : e === ht &&
              Z(
                `Property ${JSON.stringify(t)} was accessed during render but is not defined on instance.`
              ));
      },
      set({ _: e }, t, r) {
        const { data: n, setupState: o, ctx: i } = e;
        return il(o, t)
          ? ((o[t] = r), !0)
          : D.NODE_ENV !== "production" && o.__isScriptSetup && Fe(o, t)
            ? (Z(
                `Cannot mutate <script setup> binding "${t}" from Options API.`
              ),
              !1)
            : n !== We && Fe(n, t)
              ? ((n[t] = r), !0)
              : Fe(e.props, t)
                ? (D.NODE_ENV !== "production" &&
                    Z(`Attempting to mutate prop "${t}". Props are readonly.`),
                  !1)
                : t[0] === "$" && t.slice(1) in e
                  ? (D.NODE_ENV !== "production" &&
                      Z(
                        `Attempting to mutate public property "${t}". Properties starting with $ are reserved and readonly.`
                      ),
                    !1)
                  : (D.NODE_ENV !== "production" &&
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
          (e !== We && Fe(e, s)) ||
          il(t, s) ||
          ((a = i[0]) && Fe(a, s)) ||
          Fe(n, s) ||
          Fe(Un, s) ||
          Fe(o.config.globalProperties, s)
        );
      },
      defineProperty(e, t, r) {
        return (
          r.get != null
            ? (e._.accessCache[t] = 0)
            : Fe(r, "value") && this.set(e, t, r.value, null),
          Reflect.defineProperty(e, t, r)
        );
      },
    };
  D.NODE_ENV !== "production" &&
    (Hg.ownKeys = e => (
      Z(
        "Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead."
      ),
      Reflect.ownKeys(e)
    ));
  function U$(e) {
    const t = {};
    return (
      Object.defineProperty(t, "_", {
        configurable: !0,
        enumerable: !1,
        get: () => e,
      }),
      Object.keys(Un).forEach(r => {
        Object.defineProperty(t, r, {
          configurable: !0,
          enumerable: !1,
          get: () => Un[r](e),
          // intercepted by the proxy so no need for implementation,
          // but needed to prevent set errors
          set: ut,
        });
      }),
      t
    );
  }
  function W$(e) {
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
          set: ut,
        });
      });
  }
  function H$(e) {
    const { ctx: t, setupState: r } = e;
    Object.keys(Te(r)).forEach(n => {
      if (!r.__isScriptSetup) {
        if (kc(n[0])) {
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
          set: ut,
        });
      }
    });
  }
  function K$() {
    return G$().slots;
  }
  function G$() {
    const e = Xr();
    return (
      D.NODE_ENV !== "production" &&
        !e &&
        Z("useContext() called without active instance."),
      e.setupContext || (e.setupContext = vm(e))
    );
  }
  function Ul(e) {
    return he(e) ? e.reduce((t, r) => ((t[r] = null), t), {}) : e;
  }
  function q$(e, t) {
    const r = Ul(e);
    for (const n in t) {
      if (n.startsWith("__skip")) continue;
      let o = r[n];
      o
        ? he(o) || ye(o)
          ? (o = r[n] = { type: o, default: t[n] })
          : (o.default = t[n])
        : o === null
          ? (o = r[n] = { default: t[n] })
          : D.NODE_ENV !== "production" &&
            Z(`props default key "${n}" has no corresponding declaration.`),
        o && t[`__skip_${n}`] && (o.skipFactory = !0);
    }
    return r;
  }
  function Y$() {
    const e = /* @__PURE__ */ Object.create(null);
    return (t, r) => {
      e[r]
        ? Z(`${t} property "${r}" is already defined in ${e[r]}.`)
        : (e[r] = t);
    };
  }
  let Wl = !0;
  function J$(e) {
    const t = Bc(e),
      r = e.proxy,
      n = e.ctx;
    (Wl = !1), t.beforeCreate && Yf(t.beforeCreate, e, "bc");
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
        deactivated: y,
        beforeDestroy: g,
        beforeUnmount: _,
        destroyed: E,
        unmounted: S,
        render: I,
        renderTracked: A,
        renderTriggered: O,
        errorCaptured: L,
        serverPrefetch: z,
        // public API
        expose: H,
        inheritAttrs: ne,
        // assets
        components: G,
        directives: Ne,
        filters: ue,
      } = t,
      Pe = D.NODE_ENV !== "production" ? Y$() : null;
    if (D.NODE_ENV !== "production") {
      const [le] = e.propsOptions;
      if (le) for (const ve in le) Pe("Props", ve);
    }
    if ((c && X$(c, n, Pe), s))
      for (const le in s) {
        const ve = s[le];
        ye(ve)
          ? (D.NODE_ENV !== "production"
              ? Object.defineProperty(n, le, {
                  value: ve.bind(r),
                  configurable: !0,
                  enumerable: !0,
                  writable: !0,
                })
              : (n[le] = ve.bind(r)),
            D.NODE_ENV !== "production" && Pe("Methods", le))
          : D.NODE_ENV !== "production" &&
            Z(
              `Method "${le}" has type "${typeof ve}" in the component definition. Did you reference the function correctly?`
            );
      }
    if (o) {
      D.NODE_ENV !== "production" &&
        !ye(o) &&
        Z(
          "The data option must be a function. Plain object usage is no longer supported."
        );
      const le = o.call(r, r);
      if (
        (D.NODE_ENV !== "production" &&
          Oc(le) &&
          Z(
            "data() returned a Promise - note data() cannot be async; If you intend to perform data fetching before component renders, use async setup() + <Suspense>."
          ),
        !ze(le))
      )
        D.NODE_ENV !== "production" && Z("data() should return an object.");
      else if (((e.data = Ri(le)), D.NODE_ENV !== "production"))
        for (const ve in le)
          Pe("Data", ve),
            kc(ve[0]) ||
              Object.defineProperty(n, ve, {
                configurable: !0,
                enumerable: !0,
                get: () => le[ve],
                set: ut,
              });
    }
    if (((Wl = !0), i))
      for (const le in i) {
        const ve = i[le],
          Ue = ye(ve) ? ve.bind(r, r) : ye(ve.get) ? ve.get.bind(r, r) : ut;
        D.NODE_ENV !== "production" &&
          Ue === ut &&
          Z(`Computed property "${le}" has no getter.`);
        const ee =
            !ye(ve) && ye(ve.set)
              ? ve.set.bind(r)
              : D.NODE_ENV !== "production"
                ? () => {
                    Z(
                      `Write operation failed: computed property "${le}" is readonly.`
                    );
                  }
                : ut,
          R = Se({
            get: Ue,
            set: ee,
          });
        Object.defineProperty(n, le, {
          enumerable: !0,
          configurable: !0,
          get: () => R.value,
          set: M => (R.value = M),
        }),
          D.NODE_ENV !== "production" && Pe("Computed", le);
      }
    if (a) for (const le in a) Kg(a[le], n, r, le);
    if (l) {
      const le = ye(l) ? l.call(r) : l;
      Reflect.ownKeys(le).forEach(ve => {
        qg(ve, le[ve]);
      });
    }
    u && Yf(u, e, "c");
    function be(le, ve) {
      he(ve) ? ve.forEach(Ue => le(Ue.bind(r))) : ve && le(ve.bind(r));
    }
    if (
      (be(R$, f),
      be(Jr, d),
      be(M$, p),
      be(j$, h),
      be(x$, m),
      be(D$, y),
      be(k$, L),
      be(V$, A),
      be(L$, O),
      be(kg, _),
      be(Fi, S),
      be(F$, z),
      he(H))
    )
      if (H.length) {
        const le = e.exposed || (e.exposed = {});
        H.forEach(ve => {
          Object.defineProperty(le, ve, {
            get: () => r[ve],
            set: Ue => (r[ve] = Ue),
          });
        });
      } else e.exposed || (e.exposed = {});
    I && e.render === ut && (e.render = I),
      ne != null && (e.inheritAttrs = ne),
      G && (e.components = G),
      Ne && (e.directives = Ne);
  }
  function X$(e, t, r = ut) {
    he(e) && (e = Hl(e));
    for (const n in e) {
      const o = e[n];
      let i;
      ze(o)
        ? "default" in o
          ? (i = gi(o.from || n, o.default, !0))
          : (i = gi(o.from || n))
        : (i = gi(o)),
        $t(i)
          ? Object.defineProperty(t, n, {
              enumerable: !0,
              configurable: !0,
              get: () => i.value,
              set: s => (i.value = s),
            })
          : (t[n] = i),
        D.NODE_ENV !== "production" && r("Inject", n);
    }
  }
  function Yf(e, t, r) {
    sr(he(e) ? e.map(n => n.bind(t.proxy)) : e.bind(t.proxy), t, r);
  }
  function Kg(e, t, r, n) {
    const o = n.includes(".") ? lm(r, n) : () => r[n];
    if (ot(e)) {
      const i = t[e];
      ye(i)
        ? _t(o, i)
        : D.NODE_ENV !== "production" &&
          Z(`Invalid watch handler specified by key "${e}"`, i);
    } else if (ye(e)) _t(o, e.bind(r));
    else if (ze(e))
      if (he(e)) e.forEach(i => Kg(i, t, r, n));
      else {
        const i = ye(e.handler) ? e.handler.bind(r) : t[e.handler];
        ye(i)
          ? _t(o, i, e)
          : D.NODE_ENV !== "production" &&
            Z(`Invalid watch handler specified by key "${e.handler}"`, i);
      }
    else D.NODE_ENV !== "production" && Z(`Invalid watch option: "${n}"`, e);
  }
  function Bc(e) {
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
            o.length && o.forEach(c => Ws(l, c, s, !0)),
            Ws(l, t, s)),
      ze(t) && i.set(t, l),
      l
    );
  }
  function Ws(e, t, r, n = !1) {
    const { mixins: o, extends: i } = t;
    i && Ws(e, i, r, !0), o && o.forEach(s => Ws(e, s, r, !0));
    for (const s in t)
      if (n && s === "expose")
        D.NODE_ENV !== "production" &&
          Z(
            '"expose" option is ignored when declared in mixins or extends. It should only be declared in the base component itself.'
          );
      else {
        const a = Z$[s] || (r && r[s]);
        e[s] = a ? a(e[s], t[s]) : t[s];
      }
    return e;
  }
  const Z$ = {
    data: Jf,
    props: Xf,
    emits: Xf,
    // objects
    methods: li,
    computed: li,
    // lifecycle
    beforeCreate: Dt,
    created: Dt,
    beforeMount: Dt,
    mounted: Dt,
    beforeUpdate: Dt,
    updated: Dt,
    beforeDestroy: Dt,
    beforeUnmount: Dt,
    destroyed: Dt,
    unmounted: Dt,
    activated: Dt,
    deactivated: Dt,
    errorCaptured: Dt,
    serverPrefetch: Dt,
    // assets
    components: li,
    directives: li,
    // watch
    watch: eb,
    // provide / inject
    provide: Jf,
    inject: Q$,
  };
  function Jf(e, t) {
    return t
      ? e
        ? function () {
            return ft(
              ye(e) ? e.call(this, this) : e,
              ye(t) ? t.call(this, this) : t
            );
          }
        : t
      : e;
  }
  function Q$(e, t) {
    return li(Hl(e), Hl(t));
  }
  function Hl(e) {
    if (he(e)) {
      const t = {};
      for (let r = 0; r < e.length; r++) t[e[r]] = e[r];
      return t;
    }
    return e;
  }
  function Dt(e, t) {
    return e ? [...new Set([].concat(e, t))] : t;
  }
  function li(e, t) {
    return e ? ft(/* @__PURE__ */ Object.create(null), e, t) : t;
  }
  function Xf(e, t) {
    return e
      ? he(e) && he(t)
        ? [.../* @__PURE__ */ new Set([...e, ...t])]
        : ft(/* @__PURE__ */ Object.create(null), Ul(e), Ul(t ?? {}))
      : t;
  }
  function eb(e, t) {
    if (!e) return t;
    if (!t) return e;
    const r = ft(/* @__PURE__ */ Object.create(null), e);
    for (const n in t) r[n] = Dt(e[n], t[n]);
    return r;
  }
  function Gg() {
    return {
      app: null,
      config: {
        isNativeTag: __,
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
  let tb = 0;
  function rb(e, t) {
    return function (n, o = null) {
      ye(n) || (n = ft({}, n)),
        o != null &&
          !ze(o) &&
          (D.NODE_ENV !== "production" &&
            Z("root props passed to app.mount() must be an object."),
          (o = null));
      const i = Gg(),
        s = /* @__PURE__ */ new WeakSet();
      let a = !1;
      const l = (i.app = {
        _uid: tb++,
        _component: n,
        _props: o,
        _container: null,
        _context: i,
        _instance: null,
        version: ud,
        get config() {
          return i.config;
        },
        set config(c) {
          D.NODE_ENV !== "production" &&
            Z(
              "app.config cannot be replaced. Modify individual options instead."
            );
        },
        use(c, ...u) {
          return (
            s.has(c)
              ? D.NODE_ENV !== "production" &&
                Z("Plugin has already been applied to target app.")
              : c && ye(c.install)
                ? (s.add(c), c.install(l, ...u))
                : ye(c)
                  ? (s.add(c), c(l, ...u))
                  : D.NODE_ENV !== "production" &&
                    Z(
                      'A plugin must either be a function or an object with an "install" function.'
                    ),
            l
          );
        },
        mixin(c) {
          return (
            i.mixins.includes(c)
              ? D.NODE_ENV !== "production" &&
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
            D.NODE_ENV !== "production" && Zl(c, i.config),
            u
              ? (D.NODE_ENV !== "production" &&
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
            D.NODE_ENV !== "production" && Fg(c),
            u
              ? (D.NODE_ENV !== "production" &&
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
            D.NODE_ENV !== "production" &&
              Z(
                "App has already been mounted.\nIf you want to remount the same app, move your app creation logic into a factory function and create fresh app instances for each mount - e.g. `const createMyApp = () => createApp(App)`"
              );
          else {
            D.NODE_ENV !== "production" &&
              c.__vue_app__ &&
              Z(
                "There is already an app instance mounted on the host container.\n If you want to mount another app on the same host container, you need to unmount the previous app by calling `app.unmount()` first."
              );
            const d = Ve(n, o);
            return (
              (d.appContext = i),
              f === !0 ? (f = "svg") : f === !1 && (f = void 0),
              D.NODE_ENV !== "production" &&
                (i.reload = () => {
                  e(Wr(d), c, f);
                }),
              u && t ? t(d, c) : e(d, c, f),
              (a = !0),
              (l._container = c),
              (c.__vue_app__ = l),
              D.NODE_ENV !== "production" &&
                ((l._instance = d.component), w$(l, ud)),
              Oa(d.component)
            );
          }
        },
        unmount() {
          a
            ? (e(null, l._container),
              D.NODE_ENV !== "production" && ((l._instance = null), E$(l)),
              delete l._container.__vue_app__)
            : D.NODE_ENV !== "production" &&
              Z("Cannot unmount an app that is not mounted.");
        },
        provide(c, u) {
          return (
            D.NODE_ENV !== "production" &&
              c in i.provides &&
              Z(
                `App already provides property with key "${String(c)}". It will be overwritten with the new value.`
              ),
            (i.provides[c] = u),
            l
          );
        },
        runWithContext(c) {
          const u = hi;
          hi = l;
          try {
            return c();
          } finally {
            hi = u;
          }
        },
      });
      return l;
    };
  }
  let hi = null;
  function qg(e, t) {
    if (!yt)
      D.NODE_ENV !== "production" &&
        Z("provide() can only be used inside setup().");
    else {
      let r = yt.provides;
      const n = yt.parent && yt.parent.provides;
      n === r && (r = yt.provides = Object.create(n)), (r[e] = t);
    }
  }
  function gi(e, t, r = !1) {
    const n = yt || ht;
    if (n || hi) {
      const o = n
        ? n.parent == null
          ? n.vnode.appContext && n.vnode.appContext.provides
          : n.parent.provides
        : hi._context.provides;
      if (o && e in o) return o[e];
      if (arguments.length > 1) return r && ye(t) ? t.call(n && n.proxy) : t;
      D.NODE_ENV !== "production" && Z(`injection "${String(e)}" not found.`);
    } else
      D.NODE_ENV !== "production" &&
        Z("inject() can only be used inside setup() or functional components.");
  }
  const Yg = {},
    Jg = () => Object.create(Yg),
    Xg = e => Object.getPrototypeOf(e) === Yg;
  function nb(e, t, r, n = !1) {
    const o = {},
      i = Jg();
    (e.propsDefaults = /* @__PURE__ */ Object.create(null)), Zg(e, t, o, i);
    for (const s in e.propsOptions[0]) s in o || (o[s] = void 0);
    D.NODE_ENV !== "production" && em(t || {}, o, e),
      r
        ? (e.props = n ? o : Z_(o))
        : e.type.props
          ? (e.props = o)
          : (e.props = i),
      (e.attrs = i);
  }
  function ob(e) {
    for (; e; ) {
      if (e.type.__hmrId) return !0;
      e = e.parent;
    }
  }
  function ib(e, t, r, n) {
    const {
        props: o,
        attrs: i,
        vnode: { patchFlag: s },
      } = e,
      a = Te(o),
      [l] = e.propsOptions;
    let c = !1;
    if (
      // always force full diff in dev
      // - #1942 if hmr is enabled with sfc component
      // - vite#872 non-sfc component used by sfc component
      !(D.NODE_ENV !== "production" && ob(e)) &&
      (n || s > 0) &&
      !(s & 16)
    ) {
      if (s & 8) {
        const u = e.vnode.dynamicProps;
        for (let f = 0; f < u.length; f++) {
          let d = u[f];
          if (wa(e.emitsOptions, d)) continue;
          const p = t[d];
          if (l)
            if (Fe(i, d)) p !== i[d] && ((i[d] = p), (c = !0));
            else {
              const h = Ct(d);
              o[h] = Kl(l, a, h, p, e, !1);
            }
          else p !== i[d] && ((i[d] = p), (c = !0));
        }
      }
    } else {
      Zg(e, t, o, i) && (c = !0);
      let u;
      for (const f in a)
        (!t || // for camelCase
          (!Fe(t, f) && // it's possible the original props was passed in as kebab-case
            // and converted to camelCase (#955)
            ((u = Vt(f)) === f || !Fe(t, u)))) &&
          (l
            ? r && // for camelCase
              (r[f] !== void 0 || // for kebab-case
                r[u] !== void 0) &&
              (o[f] = Kl(l, a, f, void 0, e, !0))
            : delete o[f]);
      if (i !== a)
        for (const f in i) (!t || !Fe(t, f)) && (delete i[f], (c = !0));
    }
    c && wr(e.attrs, "set", ""),
      D.NODE_ENV !== "production" && em(t || {}, o, e);
  }
  function Zg(e, t, r, n) {
    const [o, i] = e.propsOptions;
    let s = !1,
      a;
    if (t)
      for (let l in t) {
        if (fi(l)) continue;
        const c = t[l];
        let u;
        o && Fe(o, (u = Ct(l)))
          ? !i || !i.includes(u)
            ? (r[u] = c)
            : ((a || (a = {}))[u] = c)
          : wa(e.emitsOptions, l) ||
            ((!(l in n) || c !== n[l]) && ((n[l] = c), (s = !0)));
      }
    if (i) {
      const l = Te(r),
        c = a || We;
      for (let u = 0; u < i.length; u++) {
        const f = i[u];
        r[f] = Kl(o, l, f, c[f], e, !Fe(c, f));
      }
    }
    return s;
  }
  function Kl(e, t, r, n, o, i) {
    const s = e[r];
    if (s != null) {
      const a = Fe(s, "default");
      if (a && n === void 0) {
        const l = s.default;
        if (s.type !== Function && !s.skipFactory && ye(l)) {
          const { propsDefaults: c } = o;
          if (r in c) n = c[r];
          else {
            const u = Vi(o);
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
            (n === "" || n === Vt(r)) &&
            (n = !0));
    }
    return n;
  }
  const sb = /* @__PURE__ */ new WeakMap();
  function Qg(e, t, r = !1) {
    const n = r ? sb : t.propsCache,
      o = n.get(e);
    if (o) return o;
    const i = e.props,
      s = {},
      a = [];
    let l = !1;
    if (!ye(e)) {
      const u = f => {
        l = !0;
        const [d, p] = Qg(f, t, !0);
        ft(s, d), p && a.push(...p);
      };
      !r && t.mixins.length && t.mixins.forEach(u),
        e.extends && u(e.extends),
        e.mixins && e.mixins.forEach(u);
    }
    if (!i && !l) return ze(e) && n.set(e, $o), $o;
    if (he(i))
      for (let u = 0; u < i.length; u++) {
        D.NODE_ENV !== "production" &&
          !ot(i[u]) &&
          Z("props must be strings when using array syntax.", i[u]);
        const f = Ct(i[u]);
        Zf(f) && (s[f] = We);
      }
    else if (i) {
      D.NODE_ENV !== "production" && !ze(i) && Z("invalid props options", i);
      for (const u in i) {
        const f = Ct(u);
        if (Zf(f)) {
          const d = i[u],
            p = (s[f] = he(d) || ye(d) ? { type: d } : ft({}, d)),
            h = p.type;
          let m = !1,
            y = !0;
          if (he(h))
            for (let g = 0; g < h.length; ++g) {
              const _ = h[g],
                E = ye(_) && _.name;
              if (E === "Boolean") {
                m = !0;
                break;
              } else E === "String" && (y = !1);
            }
          else m = ye(h) && h.name === "Boolean";
          (p[0] =
            /* shouldCast */
            m),
            (p[1] =
              /* shouldCastTrue */
              y),
            (m || Fe(p, "default")) && a.push(f);
        }
      }
    }
    const c = [s, a];
    return ze(e) && n.set(e, c), c;
  }
  function Zf(e) {
    return e[0] !== "$" && !fi(e)
      ? !0
      : (D.NODE_ENV !== "production" &&
          Z(`Invalid prop name: "${e}" is a reserved property.`),
        !1);
  }
  function ab(e) {
    return e === null
      ? "null"
      : typeof e == "function"
        ? e.name || ""
        : (typeof e == "object" && e.constructor && e.constructor.name) || "";
  }
  function em(e, t, r) {
    const n = Te(t),
      o = r.propsOptions[0];
    for (const i in o) {
      let s = o[i];
      s != null &&
        lb(
          i,
          n[i],
          s,
          D.NODE_ENV !== "production" ? At(n) : n,
          !Fe(e, i) && !Fe(e, Vt(i))
        );
    }
  }
  function lb(e, t, r, n, o) {
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
          const { valid: p, expectedType: h } = ub(t, u[d]);
          f.push(h || ""), (c = p);
        }
        if (!c) {
          Z(fb(e, t, f));
          return;
        }
      }
      a &&
        !a(t, n) &&
        Z('Invalid prop: custom validator check failed for prop "' + e + '".');
    }
  }
  const cb = /* @__PURE__ */ xo("String,Number,Boolean,Function,Symbol,BigInt");
  function ub(e, t) {
    let r;
    const n = ab(t);
    if (cb(n)) {
      const o = typeof e;
      (r = o === n.toLowerCase()), !r && o === "object" && (r = e instanceof t);
    } else
      n === "Object"
        ? (r = ze(e))
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
  function fb(e, t, r) {
    if (r.length === 0)
      return `Prop type [] for prop "${e}" won't match anything. Did you mean to use type Array instead?`;
    let n = `Invalid prop: type check failed for prop "${e}". Expected ${r.map(Kn).join(" | ")}`;
    const o = r[0],
      i = Sc(t),
      s = Qf(t, o),
      a = Qf(t, i);
    return (
      r.length === 1 && ed(o) && !db(o, i) && (n += ` with value ${s}`),
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
  function db(...e) {
    return e.some(t => t.toLowerCase() === "boolean");
  }
  const tm = e => e[0] === "_" || e === "$stable",
    zc = e => (he(e) ? e.map(or) : [or(e)]),
    pb = (e, t, r) => {
      if (t._n) return t;
      const n = se(
        (...o) => (
          D.NODE_ENV !== "production" &&
            yt &&
            (!r || r.root === yt.root) &&
            Z(
              `Slot "${e}" invoked outside of the render function: this will not track dependencies used in the slot. Invoke the slot function inside the render function instead.`
            ),
          zc(t(...o))
        ),
        r
      );
      return (n._c = !1), n;
    },
    rm = (e, t, r) => {
      const n = e._ctx;
      for (const o in e) {
        if (tm(o)) continue;
        const i = e[o];
        if (ye(i)) t[o] = pb(o, i, n);
        else if (i != null) {
          D.NODE_ENV !== "production" &&
            Z(
              `Non-function value encountered for slot "${o}". Prefer function slots for better performance.`
            );
          const s = zc(i);
          t[o] = () => s;
        }
      }
    },
    nm = (e, t) => {
      D.NODE_ENV !== "production" &&
        !Vc(e.vnode) &&
        Z(
          "Non-function value encountered for default slot. Prefer function slots for better performance."
        );
      const r = zc(t);
      e.slots.default = () => r;
    },
    Gl = (e, t, r) => {
      for (const n in t) (r || n !== "_") && (e[n] = t[n]);
    },
    hb = (e, t, r) => {
      const n = (e.slots = Jg());
      if (e.vnode.shapeFlag & 32) {
        const o = t._;
        o ? (Gl(n, t, r), r && Vs(n, "_", o, !0)) : rm(t, n);
      } else t && nm(e, t);
    },
    gb = (e, t, r) => {
      const { vnode: n, slots: o } = e;
      let i = !0,
        s = We;
      if (n.shapeFlag & 32) {
        const a = t._;
        a
          ? D.NODE_ENV !== "production" && mn
            ? (Gl(o, t, r), wr(e, "set", "$slots"))
            : r && a === 1
              ? (i = !1)
              : Gl(o, t, r)
          : ((i = !t.$stable), rm(t, o)),
          (s = t);
      } else t && (nm(e, t), (s = { default: 1 }));
      if (i) for (const a in o) !tm(a) && s[a] == null && delete o[a];
    };
  function ql(e, t, r, n, o = !1) {
    if (he(e)) {
      e.forEach((d, p) => ql(d, t && (he(t) ? t[p] : t), r, n, o));
      return;
    }
    if (pi(n) && !o) return;
    const i = n.shapeFlag & 4 ? Oa(n.component) : n.el,
      s = o ? null : i,
      { i: a, r: l } = e;
    if (D.NODE_ENV !== "production" && !a) {
      Z(
        "Missing ref owner context. ref cannot be used on hoisted vnodes. A vnode with ref must be created inside the render function."
      );
      return;
    }
    const c = t && t.r,
      u = a.refs === We ? (a.refs = {}) : a.refs,
      f = a.setupState;
    if (
      (c != null &&
        c !== l &&
        (ot(c)
          ? ((u[c] = null), Fe(f, c) && (f[c] = null))
          : $t(c) && (c.value = null)),
      ye(l))
    )
      Lr(l, a, 12, [s, u]);
    else {
      const d = ot(l),
        p = $t(l);
      if (d || p) {
        const h = () => {
          if (e.f) {
            const m = d ? (Fe(f, l) ? f[l] : u[l]) : l.value;
            o
              ? he(m) && Ec(m, i)
              : he(m)
                ? m.includes(i) || m.push(i)
                : d
                  ? ((u[l] = [i]), Fe(f, l) && (f[l] = u[l]))
                  : ((l.value = [i]), e.k && (u[e.k] = l.value));
          } else
            d
              ? ((u[l] = s), Fe(f, l) && (f[l] = s))
              : p
                ? ((l.value = s), e.k && (u[e.k] = s))
                : D.NODE_ENV !== "production" &&
                  Z("Invalid template ref type:", l, `(${typeof l})`);
        };
        s ? ((h.id = -1), Ft(h, r)) : h();
      } else
        D.NODE_ENV !== "production" &&
          Z("Invalid template ref type:", l, `(${typeof l})`);
    }
  }
  const om = Symbol("_vte"),
    mb = e => e.__isTeleport,
    Wn = e => e && (e.disabled || e.disabled === ""),
    td = e => typeof SVGElement < "u" && e instanceof SVGElement,
    rd = e => typeof MathMLElement == "function" && e instanceof MathMLElement,
    Yl = (e, t) => {
      const r = e && e.to;
      if (ot(r))
        if (t) {
          const n = t(r);
          return (
            D.NODE_ENV !== "production" &&
              !n &&
              !Wn(e) &&
              Z(
                `Failed to locate Teleport target with selector "${r}". Note the target element must exist before the component is mounted - i.e. the target cannot be rendered by the component itself, and ideally should be outside of the entire Vue component tree.`
              ),
            n
          );
        } else
          return (
            D.NODE_ENV !== "production" &&
              Z(
                "Current renderer does not support string target for Teleports. (missing querySelector renderer option)"
              ),
            null
          );
      else
        return (
          D.NODE_ENV !== "production" &&
            !r &&
            !Wn(e) &&
            Z(`Invalid Teleport target: ${r}`),
          r
        );
    },
    vb = {
      name: "Teleport",
      __isTeleport: !0,
      process(e, t, r, n, o, i, s, a, l, c) {
        const {
            mc: u,
            pc: f,
            pbc: d,
            o: { insert: p, querySelector: h, createText: m, createComment: y },
          } = c,
          g = Wn(t.props);
        let { shapeFlag: _, children: E, dynamicChildren: S } = t;
        if (
          (D.NODE_ENV !== "production" && mn && ((l = !1), (S = null)),
          e == null)
        ) {
          const I = (t.el =
              D.NODE_ENV !== "production" ? y("teleport start") : m("")),
            A = (t.anchor =
              D.NODE_ENV !== "production" ? y("teleport end") : m(""));
          p(I, r, n), p(A, r, n);
          const O = (t.target = Yl(t.props, h)),
            L = sm(O, t, m, p);
          O
            ? s === "svg" || td(O)
              ? (s = "svg")
              : (s === "mathml" || rd(O)) && (s = "mathml")
            : D.NODE_ENV !== "production" &&
              !g &&
              Z("Invalid Teleport target on mount:", O, `(${typeof O})`);
          const z = (H, ne) => {
            _ & 16 && u(E, H, ne, o, i, s, a, l);
          };
          g ? z(r, A) : O && z(O, L);
        } else {
          (t.el = e.el), (t.targetStart = e.targetStart);
          const I = (t.anchor = e.anchor),
            A = (t.target = e.target),
            O = (t.targetAnchor = e.targetAnchor),
            L = Wn(e.props),
            z = L ? r : A,
            H = L ? I : O;
          if (
            (s === "svg" || td(A)
              ? (s = "svg")
              : (s === "mathml" || rd(A)) && (s = "mathml"),
            S
              ? (d(e.dynamicChildren, S, z, o, i, s, a), mi(e, t, !0))
              : l || f(e, t, z, H, o, i, s, a, !1),
            g)
          )
            L
              ? t.props &&
                e.props &&
                t.props.to !== e.props.to &&
                (t.props.to = e.props.to)
              : ds(t, r, I, c, 1);
          else if ((t.props && t.props.to) !== (e.props && e.props.to)) {
            const ne = (t.target = Yl(t.props, h));
            ne
              ? ds(t, ne, null, c, 0)
              : D.NODE_ENV !== "production" &&
                Z("Invalid Teleport target on update:", A, `(${typeof A})`);
          } else L && ds(t, A, O, c, 1);
        }
        im(t);
      },
      remove(e, t, r, { um: n, o: { remove: o } }, i) {
        const {
          shapeFlag: s,
          children: a,
          anchor: l,
          targetStart: c,
          targetAnchor: u,
          target: f,
          props: d,
        } = e;
        if ((f && (o(c), o(u)), i && o(l), s & 16)) {
          const p = i || !Wn(d);
          for (let h = 0; h < a.length; h++) {
            const m = a[h];
            n(m, t, r, p, !!m.dynamicChildren);
          }
        }
      },
      move: ds,
      hydrate: yb,
    };
  function ds(e, t, r, { o: { insert: n }, m: o }, i = 2) {
    i === 0 && n(e.targetAnchor, t, r);
    const { el: s, anchor: a, shapeFlag: l, children: c, props: u } = e,
      f = i === 2;
    if ((f && n(s, t, r), (!f || Wn(u)) && l & 16))
      for (let d = 0; d < c.length; d++) o(c[d], t, r, 2);
    f && n(a, t, r);
  }
  function yb(
    e,
    t,
    r,
    n,
    o,
    i,
    {
      o: {
        nextSibling: s,
        parentNode: a,
        querySelector: l,
        insert: c,
        createText: u,
      },
    },
    f
  ) {
    const d = (t.target = Yl(t.props, l));
    if (d) {
      const p = d._lpa || d.firstChild;
      if (t.shapeFlag & 16)
        if (Wn(t.props))
          (t.anchor = f(s(e), t, a(e), r, n, o, i)),
            (t.targetStart = p),
            (t.targetAnchor = p && s(p));
        else {
          t.anchor = s(e);
          let h = p;
          for (; h; ) {
            if (h && h.nodeType === 8) {
              if (h.data === "teleport start anchor") t.targetStart = h;
              else if (h.data === "teleport anchor") {
                (t.targetAnchor = h),
                  (d._lpa = t.targetAnchor && s(t.targetAnchor));
                break;
              }
            }
            h = s(h);
          }
          t.targetAnchor || sm(d, t, u, c), f(p && s(p), t, d, r, n, o, i);
        }
      im(t);
    }
    return t.anchor && s(t.anchor);
  }
  const _b = vb;
  function im(e) {
    const t = e.ctx;
    if (t && t.ut) {
      let r = e.children[0].el;
      for (; r && r !== e.targetAnchor; )
        r.nodeType === 1 && r.setAttribute("data-v-owner", t.uid),
          (r = r.nextSibling);
      t.ut();
    }
  }
  function sm(e, t, r, n) {
    const o = (t.targetStart = r("")),
      i = (t.targetAnchor = r(""));
    return (o[om] = i), e && (n(o, e), n(i, e)), i;
  }
  let Xo, dn;
  function Tr(e, t) {
    e.appContext.config.performance && Hs() && dn.mark(`vue-${t}-${e.uid}`),
      D.NODE_ENV !== "production" && N$(e, t, Hs() ? dn.now() : Date.now());
  }
  function xr(e, t) {
    if (e.appContext.config.performance && Hs()) {
      const r = `vue-${t}-${e.uid}`,
        n = r + ":end";
      dn.mark(n),
        dn.measure(`<${Sa(e, e.type)}> ${t}`, r, n),
        dn.clearMarks(r),
        dn.clearMarks(n);
    }
    D.NODE_ENV !== "production" && P$(e, t, Hs() ? dn.now() : Date.now());
  }
  function Hs() {
    return (
      Xo !== void 0 ||
        (typeof window < "u" && window.performance
          ? ((Xo = !0), (dn = window.performance))
          : (Xo = !1)),
      Xo
    );
  }
  function $b() {
    const e = [];
    if (D.NODE_ENV !== "production" && e.length) {
      const t = e.length > 1;
      console.warn(
        `Feature flag${t ? "s" : ""} ${e.join(", ")} ${t ? "are" : "is"} not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.

For more details, see https://link.vuejs.org/feature-flags.`
      );
    }
  }
  const Ft = Mb;
  function bb(e) {
    return wb(e);
  }
  function wb(e, t) {
    $b();
    const r = Nc();
    (r.__VUE__ = !0),
      D.NODE_ENV !== "production" && Ig(r.__VUE_DEVTOOLS_GLOBAL_HOOK__, r);
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
        setScopeId: p = ut,
        insertStaticContent: h,
      } = e,
      m = (
        w,
        T,
        V,
        Y = null,
        K = null,
        J = null,
        te = void 0,
        Q = null,
        X = D.NODE_ENV !== "production" && mn ? !1 : !!T.dynamicChildren
      ) => {
        if (w === T) return;
        w && !Zo(w, T) && ((Y = F(w)), P(w, K, J, !0), (w = null)),
          T.patchFlag === -2 && ((X = !1), (T.dynamicChildren = null));
        const { type: W, ref: re, shapeFlag: ae } = T;
        switch (W) {
          case Li:
            y(w, T, V, Y);
            break;
          case Rt:
            g(w, T, V, Y);
            break;
          case Cs:
            w == null
              ? _(T, V, Y, te)
              : D.NODE_ENV !== "production" && E(w, T, V, te);
            break;
          case Nt:
            Ne(w, T, V, Y, K, J, te, Q, X);
            break;
          default:
            ae & 1
              ? A(w, T, V, Y, K, J, te, Q, X)
              : ae & 6
                ? ue(w, T, V, Y, K, J, te, Q, X)
                : ae & 64 || ae & 128
                  ? W.process(w, T, V, Y, K, J, te, Q, X, we)
                  : D.NODE_ENV !== "production" &&
                    Z("Invalid VNode type:", W, `(${typeof W})`);
        }
        re != null && K && ql(re, w && w.ref, J, T || w, !T);
      },
      y = (w, T, V, Y) => {
        if (w == null) n((T.el = a(T.children)), V, Y);
        else {
          const K = (T.el = w.el);
          T.children !== w.children && c(K, T.children);
        }
      },
      g = (w, T, V, Y) => {
        w == null ? n((T.el = l(T.children || "")), V, Y) : (T.el = w.el);
      },
      _ = (w, T, V, Y) => {
        [w.el, w.anchor] = h(w.children, T, V, Y, w.el, w.anchor);
      },
      E = (w, T, V, Y) => {
        if (T.children !== w.children) {
          const K = d(w.anchor);
          I(w), ([T.el, T.anchor] = h(T.children, V, K, Y));
        } else (T.el = w.el), (T.anchor = w.anchor);
      },
      S = ({ el: w, anchor: T }, V, Y) => {
        let K;
        for (; w && w !== T; ) (K = d(w)), n(w, V, Y), (w = K);
        n(T, V, Y);
      },
      I = ({ el: w, anchor: T }) => {
        let V;
        for (; w && w !== T; ) (V = d(w)), o(w), (w = V);
        o(T);
      },
      A = (w, T, V, Y, K, J, te, Q, X) => {
        T.type === "svg" ? (te = "svg") : T.type === "math" && (te = "mathml"),
          w == null ? O(T, V, Y, K, J, te, Q, X) : H(w, T, K, J, te, Q, X);
      },
      O = (w, T, V, Y, K, J, te, Q) => {
        let X, W;
        const { props: re, shapeFlag: ae, transition: ie, dirs: _e } = w;
        if (
          ((X = w.el = s(w.type, J, re && re.is, re)),
          ae & 8
            ? u(X, w.children)
            : ae & 16 && z(w.children, X, null, Y, K, sl(w, J), te, Q),
          _e && Tn(w, null, Y, "created"),
          L(X, w, w.scopeId, te, Y),
          re)
        ) {
          for (const Re in re)
            Re !== "value" && !fi(Re) && i(X, Re, null, re[Re], J, Y);
          "value" in re && i(X, "value", null, re.value, J),
            (W = re.onVnodeBeforeMount) && mr(W, Y, w);
        }
        D.NODE_ENV !== "production" &&
          (Vs(X, "__vnode", w, !0), Vs(X, "__vueParentComponent", Y, !0)),
          _e && Tn(w, null, Y, "beforeMount");
        const Ce = Eb(K, ie);
        Ce && ie.beforeEnter(X),
          n(X, T, V),
          ((W = re && re.onVnodeMounted) || Ce || _e) &&
            Ft(() => {
              W && mr(W, Y, w),
                Ce && ie.enter(X),
                _e && Tn(w, null, Y, "mounted");
            }, K);
      },
      L = (w, T, V, Y, K) => {
        if ((V && p(w, V), Y)) for (let J = 0; J < Y.length; J++) p(w, Y[J]);
        if (K) {
          let J = K.subTree;
          if (
            (D.NODE_ENV !== "production" &&
              J.patchFlag > 0 &&
              J.patchFlag & 2048 &&
              (J = Wc(J.children) || J),
            T === J)
          ) {
            const te = K.vnode;
            L(w, te, te.scopeId, te.slotScopeIds, K.parent);
          }
        }
      },
      z = (w, T, V, Y, K, J, te, Q, X = 0) => {
        for (let W = X; W < w.length; W++) {
          const re = (w[W] = Q ? fn(w[W]) : or(w[W]));
          m(null, re, T, V, Y, K, J, te, Q);
        }
      },
      H = (w, T, V, Y, K, J, te) => {
        const Q = (T.el = w.el);
        D.NODE_ENV !== "production" && (Q.__vnode = T);
        let { patchFlag: X, dynamicChildren: W, dirs: re } = T;
        X |= w.patchFlag & 16;
        const ae = w.props || We,
          ie = T.props || We;
        let _e;
        if (
          (V && xn(V, !1),
          (_e = ie.onVnodeBeforeUpdate) && mr(_e, V, T, w),
          re && Tn(T, w, V, "beforeUpdate"),
          V && xn(V, !0),
          D.NODE_ENV !== "production" && mn && ((X = 0), (te = !1), (W = null)),
          ((ae.innerHTML && ie.innerHTML == null) ||
            (ae.textContent && ie.textContent == null)) &&
            u(Q, ""),
          W
            ? (ne(w.dynamicChildren, W, Q, V, Y, sl(T, K), J),
              D.NODE_ENV !== "production" && mi(w, T))
            : te || Ue(w, T, Q, null, V, Y, sl(T, K), J, !1),
          X > 0)
        ) {
          if (X & 16) G(Q, ae, ie, V, K);
          else if (
            (X & 2 && ae.class !== ie.class && i(Q, "class", null, ie.class, K),
            X & 4 && i(Q, "style", ae.style, ie.style, K),
            X & 8)
          ) {
            const Ce = T.dynamicProps;
            for (let Re = 0; Re < Ce.length; Re++) {
              const Me = Ce[Re],
                st = ae[Me],
                jt = ie[Me];
              (jt !== st || Me === "value") && i(Q, Me, st, jt, K, V);
            }
          }
          X & 1 && w.children !== T.children && u(Q, T.children);
        } else !te && W == null && G(Q, ae, ie, V, K);
        ((_e = ie.onVnodeUpdated) || re) &&
          Ft(() => {
            _e && mr(_e, V, T, w), re && Tn(T, w, V, "updated");
          }, Y);
      },
      ne = (w, T, V, Y, K, J, te) => {
        for (let Q = 0; Q < T.length; Q++) {
          const X = w[Q],
            W = T[Q],
            re =
              // oldVNode may be an errored async setup() component inside Suspense
              // which will not have a mounted element
              X.el && // - In the case of a Fragment, we need to provide the actual parent
              // of the Fragment itself so it can move its children.
              (X.type === Nt || // - In the case of different nodes, there is going to be a replacement
                // which also requires the correct parent container
                !Zo(X, W) || // - In the case of a component, it could contain anything.
                X.shapeFlag & 70)
                ? f(X.el)
                : // In other cases, the parent container is not actually used so we
                  // just pass the block element here to avoid a DOM parentNode call.
                  V;
          m(X, W, re, null, Y, K, J, te, !0);
        }
      },
      G = (w, T, V, Y, K) => {
        if (T !== V) {
          if (T !== We)
            for (const J in T) !fi(J) && !(J in V) && i(w, J, T[J], null, K, Y);
          for (const J in V) {
            if (fi(J)) continue;
            const te = V[J],
              Q = T[J];
            te !== Q && J !== "value" && i(w, J, Q, te, K, Y);
          }
          "value" in V && i(w, "value", T.value, V.value, K);
        }
      },
      Ne = (w, T, V, Y, K, J, te, Q, X) => {
        const W = (T.el = w ? w.el : a("")),
          re = (T.anchor = w ? w.anchor : a(""));
        let { patchFlag: ae, dynamicChildren: ie, slotScopeIds: _e } = T;
        D.NODE_ENV !== "production" && // #5523 dev root fragment may inherit directives
          (mn || ae & 2048) &&
          ((ae = 0), (X = !1), (ie = null)),
          _e && (Q = Q ? Q.concat(_e) : _e),
          w == null
            ? (n(W, V, Y),
              n(re, V, Y),
              z(
                // #10007
                // such fragment like `<></>` will be compiled into
                // a fragment which doesn't have a children.
                // In this case fallback to an empty array
                T.children || [],
                V,
                re,
                K,
                J,
                te,
                Q,
                X
              ))
            : ae > 0 &&
                ae & 64 &&
                ie && // #2715 the previous fragment could've been a BAILed one as a result
                // of renderSlot() with no valid children
                w.dynamicChildren
              ? (ne(w.dynamicChildren, ie, V, K, J, te, Q),
                D.NODE_ENV !== "production"
                  ? mi(w, T)
                  : // #2080 if the stable fragment has a key, it's a <template v-for> that may
                    //  get moved around. Make sure all root level vnodes inherit el.
                    // #2134 or if it's a component root, it may also get moved around
                    // as the component is being moved.
                    (T.key != null || (K && T === K.subTree)) &&
                    mi(
                      w,
                      T,
                      !0
                      /* shallow */
                    ))
              : Ue(w, T, V, re, K, J, te, Q, X);
      },
      ue = (w, T, V, Y, K, J, te, Q, X) => {
        (T.slotScopeIds = Q),
          w == null
            ? T.shapeFlag & 512
              ? K.ctx.activate(T, V, Y, te, X)
              : Pe(T, V, Y, K, J, te, X)
            : be(w, T, X);
      },
      Pe = (w, T, V, Y, K, J, te) => {
        const Q = (w.component = kb(w, Y, K));
        if (
          (D.NODE_ENV !== "production" && Q.type.__hmrId && y$(Q),
          D.NODE_ENV !== "production" && (As(w), Tr(Q, "mount")),
          Vc(w) && (Q.ctx.renderer = we),
          D.NODE_ENV !== "production" && Tr(Q, "init"),
          zb(Q, !1, te),
          D.NODE_ENV !== "production" && xr(Q, "init"),
          Q.asyncDep)
        ) {
          if ((K && K.registerDep(Q, le, te), !w.el)) {
            const X = (Q.subTree = Ve(Rt));
            g(null, X, T, V);
          }
        } else le(Q, w, T, V, K, J, te);
        D.NODE_ENV !== "production" && (Ns(), xr(Q, "mount"));
      },
      be = (w, T, V) => {
        const Y = (T.component = w.component);
        if (Db(w, T, V))
          if (Y.asyncDep && !Y.asyncResolved) {
            D.NODE_ENV !== "production" && As(T),
              ve(Y, T, V),
              D.NODE_ENV !== "production" && Ns();
            return;
          } else (Y.next = T), m$(Y.update), (Y.effect.dirty = !0), Y.update();
        else (T.el = w.el), (Y.vnode = T);
      },
      le = (w, T, V, Y, K, J, te) => {
        const Q = () => {
            if (w.isMounted) {
              let { next: re, bu: ae, u: ie, parent: _e, vnode: Ce } = w;
              {
                const qt = am(w);
                if (qt) {
                  re && ((re.el = Ce.el), ve(w, re, te)),
                    qt.asyncDep.then(() => {
                      w.isUnmounted || Q();
                    });
                  return;
                }
              }
              let Re = re,
                Me;
              D.NODE_ENV !== "production" && As(re || w.vnode),
                xn(w, !1),
                re ? ((re.el = Ce.el), ve(w, re, te)) : (re = Ce),
                ae && Jo(ae),
                (Me = re.props && re.props.onVnodeBeforeUpdate) &&
                  mr(Me, _e, re, Ce),
                xn(w, !0),
                D.NODE_ENV !== "production" && Tr(w, "render");
              const st = al(w);
              D.NODE_ENV !== "production" && xr(w, "render");
              const jt = w.subTree;
              (w.subTree = st),
                D.NODE_ENV !== "production" && Tr(w, "patch"),
                m(
                  jt,
                  st,
                  // parent may have changed if it's in a teleport
                  f(jt.el),
                  // anchor may have changed if it's in a fragment
                  F(jt),
                  w,
                  K,
                  J
                ),
                D.NODE_ENV !== "production" && xr(w, "patch"),
                (re.el = st.el),
                Re === null && Ib(w, st.el),
                ie && Ft(ie, K),
                (Me = re.props && re.props.onVnodeUpdated) &&
                  Ft(() => mr(Me, _e, re, Ce), K),
                D.NODE_ENV !== "production" && Rg(w),
                D.NODE_ENV !== "production" && Ns();
            } else {
              let re;
              const { el: ae, props: ie } = T,
                { bm: _e, m: Ce, parent: Re } = w,
                Me = pi(T);
              if (
                (xn(w, !1),
                _e && Jo(_e),
                !Me && (re = ie && ie.onVnodeBeforeMount) && mr(re, Re, T),
                xn(w, !0),
                ae && tt)
              ) {
                const st = () => {
                  D.NODE_ENV !== "production" && Tr(w, "render"),
                    (w.subTree = al(w)),
                    D.NODE_ENV !== "production" && xr(w, "render"),
                    D.NODE_ENV !== "production" && Tr(w, "hydrate"),
                    tt(ae, w.subTree, w, K, null),
                    D.NODE_ENV !== "production" && xr(w, "hydrate");
                };
                Me
                  ? T.type.__asyncLoader().then(
                      // note: we are moving the render call into an async callback,
                      // which means it won't track dependencies - but it's ok because
                      // a server-rendered async wrapper is already in resolved state
                      // and it will never need to change.
                      () => !w.isUnmounted && st()
                    )
                  : st();
              } else {
                D.NODE_ENV !== "production" && Tr(w, "render");
                const st = (w.subTree = al(w));
                D.NODE_ENV !== "production" && xr(w, "render"),
                  D.NODE_ENV !== "production" && Tr(w, "patch"),
                  m(null, st, V, Y, w, K, J),
                  D.NODE_ENV !== "production" && xr(w, "patch"),
                  (T.el = st.el);
              }
              if ((Ce && Ft(Ce, K), !Me && (re = ie && ie.onVnodeMounted))) {
                const st = T;
                Ft(() => mr(re, Re, st), K);
              }
              (T.shapeFlag & 256 ||
                (Re && pi(Re.vnode) && Re.vnode.shapeFlag & 256)) &&
                w.a &&
                Ft(w.a, K),
                (w.isMounted = !0),
                D.NODE_ENV !== "production" && O$(w),
                (T = V = Y = null);
            }
          },
          X = (w.effect = new Cc(
            Q,
            ut,
            () => $a(W),
            w.scope
            // track it in component's effect scope
          )),
          W = (w.update = () => {
            X.dirty && X.run();
          });
        (W.i = w),
          (W.id = w.uid),
          xn(w, !0),
          D.NODE_ENV !== "production" &&
            ((X.onTrack = w.rtc ? re => Jo(w.rtc, re) : void 0),
            (X.onTrigger = w.rtg ? re => Jo(w.rtg, re) : void 0)),
          W();
      },
      ve = (w, T, V) => {
        T.component = w;
        const Y = w.vnode.props;
        (w.vnode = T),
          (w.next = null),
          ib(w, T.props, Y, V),
          gb(w, T.children, V),
          Gr(),
          Kf(w),
          qr();
      },
      Ue = (w, T, V, Y, K, J, te, Q, X = !1) => {
        const W = w && w.children,
          re = w ? w.shapeFlag : 0,
          ae = T.children,
          { patchFlag: ie, shapeFlag: _e } = T;
        if (ie > 0) {
          if (ie & 128) {
            R(W, ae, V, Y, K, J, te, Q, X);
            return;
          } else if (ie & 256) {
            ee(W, ae, V, Y, K, J, te, Q, X);
            return;
          }
        }
        _e & 8
          ? (re & 16 && j(W, K, J), ae !== W && u(V, ae))
          : re & 16
            ? _e & 16
              ? R(W, ae, V, Y, K, J, te, Q, X)
              : j(W, K, J, !0)
            : (re & 8 && u(V, ""), _e & 16 && z(ae, V, Y, K, J, te, Q, X));
      },
      ee = (w, T, V, Y, K, J, te, Q, X) => {
        (w = w || $o), (T = T || $o);
        const W = w.length,
          re = T.length,
          ae = Math.min(W, re);
        let ie;
        for (ie = 0; ie < ae; ie++) {
          const _e = (T[ie] = X ? fn(T[ie]) : or(T[ie]));
          m(w[ie], _e, V, null, K, J, te, Q, X);
        }
        W > re ? j(w, K, J, !0, !1, ae) : z(T, V, Y, K, J, te, Q, X, ae);
      },
      R = (w, T, V, Y, K, J, te, Q, X) => {
        let W = 0;
        const re = T.length;
        let ae = w.length - 1,
          ie = re - 1;
        for (; W <= ae && W <= ie; ) {
          const _e = w[W],
            Ce = (T[W] = X ? fn(T[W]) : or(T[W]));
          if (Zo(_e, Ce)) m(_e, Ce, V, null, K, J, te, Q, X);
          else break;
          W++;
        }
        for (; W <= ae && W <= ie; ) {
          const _e = w[ae],
            Ce = (T[ie] = X ? fn(T[ie]) : or(T[ie]));
          if (Zo(_e, Ce)) m(_e, Ce, V, null, K, J, te, Q, X);
          else break;
          ae--, ie--;
        }
        if (W > ae) {
          if (W <= ie) {
            const _e = ie + 1,
              Ce = _e < re ? T[_e].el : Y;
            for (; W <= ie; )
              m(null, (T[W] = X ? fn(T[W]) : or(T[W])), V, Ce, K, J, te, Q, X),
                W++;
          }
        } else if (W > ie) for (; W <= ae; ) P(w[W], K, J, !0), W++;
        else {
          const _e = W,
            Ce = W,
            Re = /* @__PURE__ */ new Map();
          for (W = Ce; W <= ie; W++) {
            const Ke = (T[W] = X ? fn(T[W]) : or(T[W]));
            Ke.key != null &&
              (D.NODE_ENV !== "production" &&
                Re.has(Ke.key) &&
                Z(
                  "Duplicate keys found during update:",
                  JSON.stringify(Ke.key),
                  "Make sure keys are unique."
                ),
              Re.set(Ke.key, W));
          }
          let Me,
            st = 0;
          const jt = ie - Ce + 1;
          let qt = !1,
            Ko = 0;
          const Nn = new Array(jt);
          for (W = 0; W < jt; W++) Nn[W] = 0;
          for (W = _e; W <= ae; W++) {
            const Ke = w[W];
            if (st >= jt) {
              P(Ke, K, J, !0);
              continue;
            }
            let Yt;
            if (Ke.key != null) Yt = Re.get(Ke.key);
            else
              for (Me = Ce; Me <= ie; Me++)
                if (Nn[Me - Ce] === 0 && Zo(Ke, T[Me])) {
                  Yt = Me;
                  break;
                }
            Yt === void 0
              ? P(Ke, K, J, !0)
              : ((Nn[Yt - Ce] = W + 1),
                Yt >= Ko ? (Ko = Yt) : (qt = !0),
                m(Ke, T[Yt], V, null, K, J, te, Q, X),
                st++);
          }
          const Go = qt ? Ob(Nn) : $o;
          for (Me = Go.length - 1, W = jt - 1; W >= 0; W--) {
            const Ke = Ce + W,
              Yt = T[Ke],
              ns = Ke + 1 < re ? T[Ke + 1].el : Y;
            Nn[W] === 0
              ? m(null, Yt, V, ns, K, J, te, Q, X)
              : qt && (Me < 0 || W !== Go[Me] ? M(Yt, V, ns, 2) : Me--);
          }
        }
      },
      M = (w, T, V, Y, K = null) => {
        const { el: J, type: te, transition: Q, children: X, shapeFlag: W } = w;
        if (W & 6) {
          M(w.component.subTree, T, V, Y);
          return;
        }
        if (W & 128) {
          w.suspense.move(T, V, Y);
          return;
        }
        if (W & 64) {
          te.move(w, T, V, we);
          return;
        }
        if (te === Nt) {
          n(J, T, V);
          for (let ae = 0; ae < X.length; ae++) M(X[ae], T, V, Y);
          n(w.anchor, T, V);
          return;
        }
        if (te === Cs) {
          S(w, T, V);
          return;
        }
        if (Y !== 2 && W & 1 && Q)
          if (Y === 0) Q.beforeEnter(J), n(J, T, V), Ft(() => Q.enter(J), K);
          else {
            const { leave: ae, delayLeave: ie, afterLeave: _e } = Q,
              Ce = () => n(J, T, V),
              Re = () => {
                ae(J, () => {
                  Ce(), _e && _e();
                });
              };
            ie ? ie(J, Ce, Re) : Re();
          }
        else n(J, T, V);
      },
      P = (w, T, V, Y = !1, K = !1) => {
        const {
          type: J,
          props: te,
          ref: Q,
          children: X,
          dynamicChildren: W,
          shapeFlag: re,
          patchFlag: ae,
          dirs: ie,
          cacheIndex: _e,
        } = w;
        if (
          (ae === -2 && (K = !1),
          Q != null && ql(Q, null, V, w, !0),
          _e != null && (T.renderCache[_e] = void 0),
          re & 256)
        ) {
          T.ctx.deactivate(w);
          return;
        }
        const Ce = re & 1 && ie,
          Re = !pi(w);
        let Me;
        if (
          (Re && (Me = te && te.onVnodeBeforeUnmount) && mr(Me, T, w), re & 6)
        )
          N(w.component, V, Y);
        else {
          if (re & 128) {
            w.suspense.unmount(V, Y);
            return;
          }
          Ce && Tn(w, null, T, "beforeUnmount"),
            re & 64
              ? w.type.remove(w, T, V, we, Y)
              : W && // #5154
                  // when v-once is used inside a block, setBlockTracking(-1) marks the
                  // parent block with hasOnce: true
                  // so that it doesn't take the fast path during unmount - otherwise
                  // components nested in v-once are never unmounted.
                  !W.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
                  (J !== Nt || (ae > 0 && ae & 64))
                ? j(W, T, V, !1, !0)
                : ((J === Nt && ae & 384) || (!K && re & 16)) && j(X, T, V),
            Y && v(w);
        }
        ((Re && (Me = te && te.onVnodeUnmounted)) || Ce) &&
          Ft(() => {
            Me && mr(Me, T, w), Ce && Tn(w, null, T, "unmounted");
          }, V);
      },
      v = w => {
        const { type: T, el: V, anchor: Y, transition: K } = w;
        if (T === Nt) {
          D.NODE_ENV !== "production" &&
          w.patchFlag > 0 &&
          w.patchFlag & 2048 &&
          K &&
          !K.persisted
            ? w.children.forEach(te => {
                te.type === Rt ? o(te.el) : v(te);
              })
            : $(V, Y);
          return;
        }
        if (T === Cs) {
          I(w);
          return;
        }
        const J = () => {
          o(V), K && !K.persisted && K.afterLeave && K.afterLeave();
        };
        if (w.shapeFlag & 1 && K && !K.persisted) {
          const { leave: te, delayLeave: Q } = K,
            X = () => te(V, J);
          Q ? Q(w.el, J, X) : X();
        } else J();
      },
      $ = (w, T) => {
        let V;
        for (; w !== T; ) (V = d(w)), o(w), (w = V);
        o(T);
      },
      N = (w, T, V) => {
        D.NODE_ENV !== "production" && w.type.__hmrId && _$(w);
        const {
          bum: Y,
          scope: K,
          update: J,
          subTree: te,
          um: Q,
          m: X,
          a: W,
        } = w;
        nd(X),
          nd(W),
          Y && Jo(Y),
          K.stop(),
          J && ((J.active = !1), P(te, w, T, V)),
          Q && Ft(Q, T),
          Ft(() => {
            w.isUnmounted = !0;
          }, T),
          T &&
            T.pendingBranch &&
            !T.isUnmounted &&
            w.asyncDep &&
            !w.asyncResolved &&
            w.suspenseId === T.pendingId &&
            (T.deps--, T.deps === 0 && T.resolve()),
          D.NODE_ENV !== "production" && A$(w);
      },
      j = (w, T, V, Y = !1, K = !1, J = 0) => {
        for (let te = J; te < w.length; te++) P(w[te], T, V, Y, K);
      },
      F = w => {
        if (w.shapeFlag & 6) return F(w.component.subTree);
        if (w.shapeFlag & 128) return w.suspense.next();
        const T = d(w.anchor || w.el),
          V = T && T[om];
        return V ? d(V) : T;
      };
    let q = !1;
    const oe = (w, T, V) => {
        w == null
          ? T._vnode && P(T._vnode, null, null, !0)
          : m(T._vnode || null, w, T, null, null, null, V),
          q || ((q = !0), Kf(), Tg(), (q = !1)),
          (T._vnode = w);
      },
      we = {
        p: m,
        um: P,
        m: M,
        r: v,
        mt: Pe,
        mc: z,
        pc: Ue,
        pbc: ne,
        n: F,
        o: e,
      };
    let Ie, tt;
    return {
      render: oe,
      hydrate: Ie,
      createApp: rb(oe, Ie),
    };
  }
  function sl({ type: e, props: t }, r) {
    return (r === "svg" && e === "foreignObject") ||
      (r === "mathml" &&
        e === "annotation-xml" &&
        t &&
        t.encoding &&
        t.encoding.includes("html"))
      ? void 0
      : r;
  }
  function xn({ effect: e, update: t }, r) {
    e.allowRecurse = t.allowRecurse = r;
  }
  function Eb(e, t) {
    return (!e || (e && !e.pendingBranch)) && t && !t.persisted;
  }
  function mi(e, t, r = !1) {
    const n = e.children,
      o = t.children;
    if (he(n) && he(o))
      for (let i = 0; i < n.length; i++) {
        const s = n[i];
        let a = o[i];
        a.shapeFlag & 1 &&
          !a.dynamicChildren &&
          ((a.patchFlag <= 0 || a.patchFlag === 32) &&
            ((a = o[i] = fn(o[i])), (a.el = s.el)),
          !r && a.patchFlag !== -2 && mi(s, a)),
          a.type === Li && (a.el = s.el),
          D.NODE_ENV !== "production" &&
            a.type === Rt &&
            !a.el &&
            (a.el = s.el);
      }
  }
  function Ob(e) {
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
  function am(e) {
    const t = e.subTree.component;
    if (t) return t.asyncDep && !t.asyncResolved ? t : am(t);
  }
  function nd(e) {
    if (e) for (let t = 0; t < e.length; t++) e[t].active = !1;
  }
  const Sb = Symbol.for("v-scx"),
    Ab = () => {
      {
        const e = gi(Sb);
        return (
          e ||
            (D.NODE_ENV !== "production" &&
              Z(
                "Server rendering context not provided. Make sure to only call useSSRContext() conditionally in the server build."
              )),
          e
        );
      }
    };
  function Qt(e, t) {
    return Uc(e, null, t);
  }
  const ps = {};
  function _t(e, t, r) {
    return (
      D.NODE_ENV !== "production" &&
        !ye(t) &&
        Z(
          "`watch(fn, options?)` signature has been moved to a separate API. Use `watchEffect(fn, options?)` instead. `watch` now only supports `watch(source, cb, options?) signature."
        ),
      Uc(e, t, r)
    );
  }
  function Uc(
    e,
    t,
    { immediate: r, deep: n, flush: o, once: i, onTrack: s, onTrigger: a } = We
  ) {
    if (t && i) {
      const O = t;
      t = (...L) => {
        O(...L), A();
      };
    }
    D.NODE_ENV !== "production" &&
      n !== void 0 &&
      typeof n == "number" &&
      Z(
        'watch() "deep" option with number value will be used as watch depth in future versions. Please use a boolean instead to avoid potential breakage.'
      ),
      D.NODE_ENV !== "production" &&
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
      c = yt,
      u = O =>
        n === !0
          ? O
          : // for deep: false, only traverse root-level properties
            pn(O, n === !1 ? 1 : void 0);
    let f,
      d = !1,
      p = !1;
    if (
      ($t(e)
        ? ((f = () => e.value), (d = Fr(e)))
        : bo(e)
          ? ((f = () => u(e)), (d = !0))
          : he(e)
            ? ((p = !0),
              (d = e.some(O => bo(O) || Fr(O))),
              (f = () =>
                e.map(O => {
                  if ($t(O)) return O.value;
                  if (bo(O)) return u(O);
                  if (ye(O)) return Lr(O, c, 2);
                  D.NODE_ENV !== "production" && l(O);
                })))
            : ye(e)
              ? t
                ? (f = () => Lr(e, c, 2))
                : (f = () => (h && h(), sr(e, c, 3, [m])))
              : ((f = ut), D.NODE_ENV !== "production" && l(e)),
      t && n)
    ) {
      const O = f;
      f = () => pn(O());
    }
    let h,
      m = O => {
        h = S.onStop = () => {
          Lr(O, c, 4), (h = S.onStop = void 0);
        };
      },
      y;
    if (Ea)
      if (
        ((m = ut),
        t ? r && sr(t, c, 3, [f(), p ? [] : void 0, m]) : f(),
        o === "sync")
      ) {
        const O = Ab();
        y = O.__watcherHandles || (O.__watcherHandles = []);
      } else return ut;
    let g = p ? new Array(e.length).fill(ps) : ps;
    const _ = () => {
      if (!(!S.active || !S.dirty))
        if (t) {
          const O = S.run();
          (n || d || (p ? O.some((L, z) => yn(L, g[z])) : yn(O, g))) &&
            (h && h(),
            sr(t, c, 3, [
              O,
              // pass undefined as the old value when it's changed for the first time
              g === ps ? void 0 : p && g[0] === ps ? [] : g,
              m,
            ]),
            (g = O));
        } else S.run();
    };
    _.allowRecurse = !!t;
    let E;
    o === "sync"
      ? (E = _)
      : o === "post"
        ? (E = () => Ft(_, c && c.suspense))
        : ((_.pre = !0), c && (_.id = c.uid), (E = () => $a(_)));
    const S = new Cc(f, ut, E),
      I = Pc(),
      A = () => {
        S.stop(), I && Ec(I.effects, S);
      };
    return (
      D.NODE_ENV !== "production" && ((S.onTrack = s), (S.onTrigger = a)),
      t
        ? r
          ? _()
          : (g = S.run())
        : o === "post"
          ? Ft(S.run.bind(S), c && c.suspense)
          : S.run(),
      y && y.push(A),
      A
    );
  }
  function Nb(e, t, r) {
    const n = this.proxy,
      o = ot(e) ? (e.includes(".") ? lm(n, e) : () => n[e]) : e.bind(n, n);
    let i;
    ye(t) ? (i = t) : ((i = t.handler), (r = t));
    const s = Vi(this),
      a = Uc(o, i.bind(n), r);
    return s(), a;
  }
  function lm(e, t) {
    const r = t.split(".");
    return () => {
      let n = e;
      for (let o = 0; o < r.length && n; o++) n = n[r[o]];
      return n;
    };
  }
  function pn(e, t = 1 / 0, r) {
    if (
      t <= 0 ||
      !ze(e) ||
      e.__v_skip ||
      ((r = r || /* @__PURE__ */ new Set()), r.has(e))
    )
      return e;
    if ((r.add(e), t--, $t(e))) pn(e.value, t, r);
    else if (he(e)) for (let n = 0; n < e.length; n++) pn(e[n], t, r);
    else if (Zh(e) || Vn(e))
      e.forEach(n => {
        pn(n, t, r);
      });
    else if (eg(e)) {
      for (const n in e) pn(e[n], t, r);
      for (const n of Object.getOwnPropertySymbols(e))
        Object.prototype.propertyIsEnumerable.call(e, n) && pn(e[n], t, r);
    }
    return e;
  }
  const Pb = (e, t) =>
    t === "modelValue" || t === "model-value"
      ? e.modelModifiers
      : e[`${t}Modifiers`] || e[`${Ct(t)}Modifiers`] || e[`${Vt(t)}Modifiers`];
  function Cb(e, t, ...r) {
    if (e.isUnmounted) return;
    const n = e.vnode.props || We;
    if (D.NODE_ENV !== "production") {
      const {
        emitsOptions: u,
        propsOptions: [f],
      } = e;
      if (u)
        if (!(t in u))
          (!f || !(Ir(t) in f)) &&
            Z(
              `Component emitted event "${t}" but it is neither declared in the emits option nor as an "${Ir(t)}" prop.`
            );
        else {
          const d = u[t];
          ye(d) &&
            (d(...r) ||
              Z(
                `Invalid event arguments: event validation failed for event "${t}".`
              ));
        }
    }
    let o = r;
    const i = t.startsWith("update:"),
      s = i && Pb(n, t.slice(7));
    if (
      (s &&
        (s.trim && (o = r.map(u => (ot(u) ? u.trim() : u))),
        s.number && (o = r.map(O_))),
      D.NODE_ENV !== "production" && C$(e, t, o),
      D.NODE_ENV !== "production")
    ) {
      const u = t.toLowerCase();
      u !== t &&
        n[Ir(u)] &&
        Z(
          `Event "${u}" is emitted in component ${Sa(
            e,
            e.type
          )} but the handler is registered for "${t}". Note that HTML attributes are case-insensitive and you cannot use v-on to listen to camelCase events when using in-DOM templates. You should probably use "${Vt(
            t
          )}" instead of "${t}".`
        );
    }
    let a,
      l =
        n[(a = Ir(t))] || // also try camelCase event handler (#2249)
        n[(a = Ir(Ct(t)))];
    !l && i && (l = n[(a = Ir(Vt(t)))]), l && sr(l, e, 6, o);
    const c = n[a + "Once"];
    if (c) {
      if (!e.emitted) e.emitted = {};
      else if (e.emitted[a]) return;
      (e.emitted[a] = !0), sr(c, e, 6, o);
    }
  }
  function cm(e, t, r = !1) {
    const n = t.emitsCache,
      o = n.get(e);
    if (o !== void 0) return o;
    const i = e.emits;
    let s = {},
      a = !1;
    if (!ye(e)) {
      const l = c => {
        const u = cm(c, t, !0);
        u && ((a = !0), ft(s, u));
      };
      !r && t.mixins.length && t.mixins.forEach(l),
        e.extends && l(e.extends),
        e.mixins && e.mixins.forEach(l);
    }
    return !i && !a
      ? (ze(e) && n.set(e, null), null)
      : (he(i) ? i.forEach(l => (s[l] = null)) : ft(s, i),
        ze(e) && n.set(e, s),
        s);
  }
  function wa(e, t) {
    return !e || !Ii(t)
      ? !1
      : ((t = t.slice(2).replace(/Once$/, "")),
        Fe(e, t[0].toLowerCase() + t.slice(1)) || Fe(e, Vt(t)) || Fe(e, t));
  }
  let Jl = !1;
  function Ks() {
    Jl = !0;
  }
  function al(e) {
    const {
        type: t,
        vnode: r,
        proxy: n,
        withProxy: o,
        propsOptions: [i],
        slots: s,
        attrs: a,
        emit: l,
        render: c,
        renderCache: u,
        props: f,
        data: d,
        setupState: p,
        ctx: h,
        inheritAttrs: m,
      } = e,
      y = Us(e);
    let g, _;
    D.NODE_ENV !== "production" && (Jl = !1);
    try {
      if (r.shapeFlag & 4) {
        const I = o || n,
          A =
            D.NODE_ENV !== "production" && p.__isScriptSetup
              ? new Proxy(I, {
                  get(O, L, z) {
                    return (
                      Z(
                        `Property '${String(
                          L
                        )}' was accessed via 'this'. Avoid using 'this' in templates.`
                      ),
                      Reflect.get(O, L, z)
                    );
                  },
                })
              : I;
        (g = or(
          c.call(A, I, u, D.NODE_ENV !== "production" ? At(f) : f, p, d, h)
        )),
          (_ = a);
      } else {
        const I = t;
        D.NODE_ENV !== "production" && a === f && Ks(),
          (g = or(
            I.length > 1
              ? I(
                  D.NODE_ENV !== "production" ? At(f) : f,
                  D.NODE_ENV !== "production"
                    ? {
                        get attrs() {
                          return Ks(), At(a);
                        },
                        slots: s,
                        emit: l,
                      }
                    : { attrs: a, slots: s, emit: l }
                )
              : I(D.NODE_ENV !== "production" ? At(f) : f, null)
          )),
          (_ = t.props ? a : Tb(a));
      }
    } catch (I) {
      (vi.length = 0), Mi(I, e, 1), (g = Ve(Rt));
    }
    let E = g,
      S;
    if (
      (D.NODE_ENV !== "production" &&
        g.patchFlag > 0 &&
        g.patchFlag & 2048 &&
        ([E, S] = um(g)),
      _ && m !== !1)
    ) {
      const I = Object.keys(_),
        { shapeFlag: A } = E;
      if (I.length) {
        if (A & 7) i && I.some(Ls) && (_ = xb(_, i)), (E = Wr(E, _, !1, !0));
        else if (D.NODE_ENV !== "production" && !Jl && E.type !== Rt) {
          const O = Object.keys(a),
            L = [],
            z = [];
          for (let H = 0, ne = O.length; H < ne; H++) {
            const G = O[H];
            Ii(G)
              ? Ls(G) || L.push(G[2].toLowerCase() + G.slice(3))
              : z.push(G);
          }
          z.length &&
            Z(
              `Extraneous non-props attributes (${z.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes.`
            ),
            L.length &&
              Z(
                `Extraneous non-emits event listeners (${L.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes. If the listener is intended to be a component custom event listener only, declare it using the "emits" option.`
              );
        }
      }
    }
    return (
      r.dirs &&
        (D.NODE_ENV !== "production" &&
          !od(E) &&
          Z(
            "Runtime directive used on component with non-element root node. The directives will not function as intended."
          ),
        (E = Wr(E, null, !1, !0)),
        (E.dirs = E.dirs ? E.dirs.concat(r.dirs) : r.dirs)),
      r.transition &&
        (D.NODE_ENV !== "production" &&
          !od(E) &&
          Z(
            "Component inside <Transition> renders non-element root node that cannot be animated."
          ),
        (E.transition = r.transition)),
      D.NODE_ENV !== "production" && S ? S(E) : (g = E),
      Us(y),
      g
    );
  }
  const um = e => {
    const t = e.children,
      r = e.dynamicChildren,
      n = Wc(t, !1);
    if (n) {
      if (D.NODE_ENV !== "production" && n.patchFlag > 0 && n.patchFlag & 2048)
        return um(n);
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
    return [or(n), s];
  };
  function Wc(e, t = !0) {
    let r;
    for (let n = 0; n < e.length; n++) {
      const o = e[n];
      if (So(o)) {
        if (o.type !== Rt || o.children === "v-if") {
          if (r) return;
          if (
            ((r = o),
            D.NODE_ENV !== "production" &&
              t &&
              r.patchFlag > 0 &&
              r.patchFlag & 2048)
          )
            return Wc(r.children);
        }
      } else return;
    }
    return r;
  }
  const Tb = e => {
      let t;
      for (const r in e)
        (r === "class" || r === "style" || Ii(r)) &&
          ((t || (t = {}))[r] = e[r]);
      return t;
    },
    xb = (e, t) => {
      const r = {};
      for (const n in e) (!Ls(n) || !(n.slice(9) in t)) && (r[n] = e[n]);
      return r;
    },
    od = e => e.shapeFlag & 7 || e.type === Rt;
  function Db(e, t, r) {
    const { props: n, children: o, component: i } = e,
      { props: s, children: a, patchFlag: l } = t,
      c = i.emitsOptions;
    if (
      (D.NODE_ENV !== "production" && (o || a) && mn) ||
      t.dirs ||
      t.transition
    )
      return !0;
    if (r && l >= 0) {
      if (l & 1024) return !0;
      if (l & 16) return n ? id(n, s, c) : !!s;
      if (l & 8) {
        const u = t.dynamicProps;
        for (let f = 0; f < u.length; f++) {
          const d = u[f];
          if (s[d] !== n[d] && !wa(c, d)) return !0;
        }
      }
    } else
      return (o || a) && (!a || !a.$stable)
        ? !0
        : n === s
          ? !1
          : n
            ? s
              ? id(n, s, c)
              : !0
            : !!s;
    return !1;
  }
  function id(e, t, r) {
    const n = Object.keys(t);
    if (n.length !== Object.keys(e).length) return !0;
    for (let o = 0; o < n.length; o++) {
      const i = n[o];
      if (t[i] !== e[i] && !wa(r, i)) return !0;
    }
    return !1;
  }
  function Ib({ vnode: e, parent: t }, r) {
    for (; t; ) {
      const n = t.subTree;
      if (
        (n.suspense && n.suspense.activeBranch === e && (n.el = e.el), n === e)
      )
        ((e = t.vnode).el = r), (t = t.parent);
      else break;
    }
  }
  const Rb = e => e.__isSuspense;
  function Mb(e, t) {
    t && t.pendingBranch
      ? he(e)
        ? t.effects.push(...e)
        : t.effects.push(e)
      : Cg(e);
  }
  const Nt = Symbol.for("v-fgt"),
    Li = Symbol.for("v-txt"),
    Rt = Symbol.for("v-cmt"),
    Cs = Symbol.for("v-stc"),
    vi = [];
  let Ht = null;
  function fe(e = !1) {
    vi.push((Ht = e ? null : []));
  }
  function jb() {
    vi.pop(), (Ht = vi[vi.length - 1] || null);
  }
  let Pi = 1;
  function sd(e) {
    (Pi += e), e < 0 && Ht && (Ht.hasOnce = !0);
  }
  function fm(e) {
    return (
      (e.dynamicChildren = Pi > 0 ? Ht || $o : null),
      jb(),
      Pi > 0 && Ht && Ht.push(e),
      e
    );
  }
  function Sn(e, t, r, n, o, i) {
    return fm(ar(e, t, r, n, o, i, !0));
  }
  function $e(e, t, r, n, o) {
    return fm(Ve(e, t, r, n, o, !0));
  }
  function So(e) {
    return e ? e.__v_isVNode === !0 : !1;
  }
  function Zo(e, t) {
    if (D.NODE_ENV !== "production" && t.shapeFlag & 6 && e.component) {
      const r = Ps.get(t.type);
      if (r && r.has(e.component))
        return (e.shapeFlag &= -257), (t.shapeFlag &= -513), !1;
    }
    return e.type === t.type && e.key === t.key;
  }
  const Fb = (...e) => pm(...e),
    dm = ({ key: e }) => e ?? null,
    Ts = ({ ref: e, ref_key: t, ref_for: r }) => (
      typeof e == "number" && (e = "" + e),
      e != null
        ? ot(e) || $t(e) || ye(e)
          ? { i: ht, r: e, k: t, f: !!r }
          : e
        : null
    );
  function ar(
    e,
    t = null,
    r = null,
    n = 0,
    o = null,
    i = e === Nt ? 0 : 1,
    s = !1,
    a = !1
  ) {
    const l = {
      __v_isVNode: !0,
      __v_skip: !0,
      type: e,
      props: t,
      key: t && dm(t),
      ref: t && Ts(t),
      scopeId: jg,
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
      targetStart: null,
      targetAnchor: null,
      staticCount: 0,
      shapeFlag: i,
      patchFlag: n,
      dynamicProps: o,
      dynamicChildren: null,
      appContext: null,
      ctx: ht,
    };
    return (
      a
        ? (Hc(l, r), i & 128 && e.normalize(l))
        : r && (l.shapeFlag |= ot(r) ? 8 : 16),
      D.NODE_ENV !== "production" &&
        l.key !== l.key &&
        Z("VNode created with invalid key (NaN). VNode type:", l.type),
      Pi > 0 && // avoid a block node from tracking itself
        !s && // has current parent block
        Ht && // presence of a patch flag indicates this node needs patching on updates.
        // component nodes also should always be patched, because even if the
        // component doesn't need to update, it needs to persist the instance on to
        // the next vnode so that it can be properly unmounted later.
        (l.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
        // vnode should not be considered dynamic due to handler caching.
        l.patchFlag !== 32 &&
        Ht.push(l),
      l
    );
  }
  const Ve = D.NODE_ENV !== "production" ? Fb : pm;
  function pm(e, t = null, r = null, n = 0, o = null, i = !1) {
    if (
      ((!e || e === zg) &&
        (D.NODE_ENV !== "production" &&
          !e &&
          Z(`Invalid vnode type when creating vnode: ${e}.`),
        (e = Rt)),
      So(e))
    ) {
      const a = Wr(
        e,
        t,
        !0
        /* mergeRef: true */
      );
      return (
        r && Hc(a, r),
        Pi > 0 &&
          !i &&
          Ht &&
          (a.shapeFlag & 6 ? (Ht[Ht.indexOf(e)] = a) : Ht.push(a)),
        (a.patchFlag = -2),
        a
      );
    }
    if ((ym(e) && (e = e.__vccOpts), t)) {
      t = eo(t);
      let { class: a, style: l } = t;
      a && !ot(a) && (t.class = it(a)),
        ze(l) && (Bs(l) && !he(l) && (l = ft({}, l)), (t.style = Qn(l)));
    }
    const s = ot(e) ? 1 : Rb(e) ? 128 : mb(e) ? 64 : ze(e) ? 4 : ye(e) ? 2 : 0;
    return (
      D.NODE_ENV !== "production" &&
        s & 4 &&
        Bs(e) &&
        ((e = Te(e)),
        Z(
          "Vue received a Component that was made a reactive object. This can lead to unnecessary performance overhead and should be avoided by marking the component with `markRaw` or using `shallowRef` instead of `ref`.",
          `
Component that was made reactive: `,
          e
        )),
      ar(e, t, r, n, o, s, i, !0)
    );
  }
  function eo(e) {
    return e ? (Bs(e) || Xg(e) ? ft({}, e) : e) : null;
  }
  function Wr(e, t, r = !1, n = !1) {
    const { props: o, ref: i, patchFlag: s, children: a, transition: l } = e,
      c = t ? gt(o || {}, t) : o,
      u = {
        __v_isVNode: !0,
        __v_skip: !0,
        type: e.type,
        props: c,
        key: c && dm(c),
        ref:
          t && t.ref
            ? // #2078 in the case of <component :is="vnode" ref="extra"/>
              // if the vnode itself already has a ref, cloneVNode will need to merge
              // the refs so the single vnode can be set on multiple refs
              r && i
              ? he(i)
                ? i.concat(Ts(t))
                : [i, Ts(t)]
              : Ts(t)
            : i,
        scopeId: e.scopeId,
        slotScopeIds: e.slotScopeIds,
        children:
          D.NODE_ENV !== "production" && s === -1 && he(a) ? a.map(hm) : a,
        target: e.target,
        targetStart: e.targetStart,
        targetAnchor: e.targetAnchor,
        staticCount: e.staticCount,
        shapeFlag: e.shapeFlag,
        // if the vnode is cloned with extra props, we can no longer assume its
        // existing patch flag to be reliable and need to add the FULL_PROPS flag.
        // note: preserve flag for fragments since they use the flag for children
        // fast paths only.
        patchFlag: t && e.type !== Nt ? (s === -1 ? 16 : s | 16) : s,
        dynamicProps: e.dynamicProps,
        dynamicChildren: e.dynamicChildren,
        appContext: e.appContext,
        dirs: e.dirs,
        transition: l,
        // These should technically only be non-null on mounted VNodes. However,
        // they *should* be copied for kept-alive vnodes. So we just always copy
        // them since them being non-null during a mount doesn't affect the logic as
        // they will simply be overwritten.
        component: e.component,
        suspense: e.suspense,
        ssContent: e.ssContent && Wr(e.ssContent),
        ssFallback: e.ssFallback && Wr(e.ssFallback),
        el: e.el,
        anchor: e.anchor,
        ctx: e.ctx,
        ce: e.ce,
      };
    return l && n && Lg(u, l.clone(u)), u;
  }
  function hm(e) {
    const t = Wr(e);
    return he(e.children) && (t.children = e.children.map(hm)), t;
  }
  function Ao(e = " ", t = 0) {
    return Ve(Li, null, e, t);
  }
  function $r(e = "", t = !1) {
    return t ? (fe(), $e(Rt, null, e)) : Ve(Rt, null, e);
  }
  function or(e) {
    return e == null || typeof e == "boolean"
      ? Ve(Rt)
      : he(e)
        ? Ve(
            Nt,
            null,
            // #3666, avoid reference pollution when reusing vnode
            e.slice()
          )
        : typeof e == "object"
          ? fn(e)
          : Ve(Li, null, String(e));
  }
  function fn(e) {
    return (e.el === null && e.patchFlag !== -1) || e.memo ? e : Wr(e);
  }
  function Hc(e, t) {
    let r = 0;
    const { shapeFlag: n } = e;
    if (t == null) t = null;
    else if (he(t)) r = 16;
    else if (typeof t == "object")
      if (n & 65) {
        const o = t.default;
        o && (o._c && (o._d = !1), Hc(e, o()), o._c && (o._d = !0));
        return;
      } else {
        r = 32;
        const o = t._;
        !o && !Xg(t)
          ? (t._ctx = ht)
          : o === 3 &&
            ht &&
            (ht.slots._ === 1 ? (t._ = 1) : ((t._ = 2), (e.patchFlag |= 1024)));
      }
    else
      ye(t)
        ? ((t = { default: t, _ctx: ht }), (r = 32))
        : ((t = String(t)), n & 64 ? ((r = 16), (t = [Ao(t)])) : (r = 8));
    (e.children = t), (e.shapeFlag |= r);
  }
  function gt(...e) {
    const t = {};
    for (let r = 0; r < e.length; r++) {
      const n = e[r];
      for (const o in n)
        if (o === "class")
          t.class !== n.class && (t.class = it([t.class, n.class]));
        else if (o === "style") t.style = Qn([t.style, n.style]);
        else if (Ii(o)) {
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
  function mr(e, t, r, n = null) {
    sr(e, t, 7, [r, n]);
  }
  const Lb = Gg();
  let Vb = 0;
  function kb(e, t, r) {
    const n = e.type,
      o = (t ? t.appContext : e.appContext) || Lb,
      i = {
        uid: Vb++,
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
        scope: new og(
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
        propsOptions: Qg(n, o),
        emitsOptions: cm(n, o),
        // emit
        emit: null,
        // to be set immediately
        emitted: null,
        // props default value
        propsDefaults: We,
        // inheritAttrs
        inheritAttrs: n.inheritAttrs,
        // state
        ctx: We,
        data: We,
        props: We,
        attrs: We,
        slots: We,
        refs: We,
        setupState: We,
        setupContext: null,
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
      D.NODE_ENV !== "production" ? (i.ctx = U$(i)) : (i.ctx = { _: i }),
      (i.root = t ? t.root : i),
      (i.emit = Cb.bind(null, i)),
      e.ce && e.ce(i),
      i
    );
  }
  let yt = null;
  const Xr = () => yt || ht;
  let Gs, Xl;
  {
    const e = Nc(),
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
    (Gs = t("__VUE_INSTANCE_SETTERS__", r => (yt = r))),
      (Xl = t("__VUE_SSR_SETTERS__", r => (Ea = r)));
  }
  const Vi = e => {
      const t = yt;
      return (
        Gs(e),
        e.scope.on(),
        () => {
          e.scope.off(), Gs(t);
        }
      );
    },
    ad = () => {
      yt && yt.scope.off(), Gs(null);
    },
    Bb = /* @__PURE__ */ xo("slot,component");
  function Zl(e, { isNativeTag: t }) {
    (Bb(e) || t(e)) &&
      Z("Do not use built-in or reserved HTML elements as component id: " + e);
  }
  function gm(e) {
    return e.vnode.shapeFlag & 4;
  }
  let Ea = !1;
  function zb(e, t = !1, r = !1) {
    t && Xl(t);
    const { props: n, children: o } = e.vnode,
      i = gm(e);
    nb(e, n, i, t), hb(e, o, r);
    const s = i ? Ub(e, t) : void 0;
    return t && Xl(!1), s;
  }
  function Ub(e, t) {
    var r;
    const n = e.type;
    if (D.NODE_ENV !== "production") {
      if ((n.name && Zl(n.name, e.appContext.config), n.components)) {
        const i = Object.keys(n.components);
        for (let s = 0; s < i.length; s++) Zl(i[s], e.appContext.config);
      }
      if (n.directives) {
        const i = Object.keys(n.directives);
        for (let s = 0; s < i.length; s++) Fg(i[s]);
      }
      n.compilerOptions &&
        Wb() &&
        Z(
          '"compilerOptions" is only supported when using a build of Vue that includes the runtime compiler. Since you are using a runtime-only build, the options should be passed via your build tool config instead.'
        );
    }
    (e.accessCache = /* @__PURE__ */ Object.create(null)),
      (e.proxy = new Proxy(e.ctx, Hg)),
      D.NODE_ENV !== "production" && W$(e);
    const { setup: o } = n;
    if (o) {
      const i = (e.setupContext = o.length > 1 ? vm(e) : null),
        s = Vi(e);
      Gr();
      const a = Lr(o, e, 0, [
        D.NODE_ENV !== "production" ? At(e.props) : e.props,
        i,
      ]);
      if ((qr(), s(), Oc(a))) {
        if ((a.then(ad, ad), t))
          return a
            .then(l => {
              ld(e, l, t);
            })
            .catch(l => {
              Mi(l, e, 0);
            });
        if (((e.asyncDep = a), D.NODE_ENV !== "production" && !e.suspense)) {
          const l = (r = n.name) != null ? r : "Anonymous";
          Z(
            `Component <${l}>: setup function returned a promise, but no <Suspense> boundary was found in the parent component tree. A component with async setup() must be nested in a <Suspense> in order to be rendered.`
          );
        }
      } else ld(e, a, t);
    } else mm(e, t);
  }
  function ld(e, t, r) {
    ye(t)
      ? e.type.__ssrInlineRender
        ? (e.ssrRender = t)
        : (e.render = t)
      : ze(t)
        ? (D.NODE_ENV !== "production" &&
            So(t) &&
            Z(
              "setup() should not return VNodes directly - return a render function instead."
            ),
          D.NODE_ENV !== "production" && (e.devtoolsRawSetupState = t),
          (e.setupState = Og(t)),
          D.NODE_ENV !== "production" && H$(e))
        : D.NODE_ENV !== "production" &&
          t !== void 0 &&
          Z(
            `setup() should return an object. Received: ${t === null ? "null" : typeof t}`
          ),
      mm(e, r);
  }
  let Ql;
  const Wb = () => !Ql;
  function mm(e, t, r) {
    const n = e.type;
    if (!e.render) {
      if (!t && Ql && !n.render) {
        const o = n.template || Bc(e).template;
        if (o) {
          D.NODE_ENV !== "production" && Tr(e, "compile");
          const { isCustomElement: i, compilerOptions: s } =
              e.appContext.config,
            { delimiters: a, compilerOptions: l } = n,
            c = ft(
              ft(
                {
                  isCustomElement: i,
                  delimiters: a,
                },
                s
              ),
              l
            );
          (n.render = Ql(o, c)),
            D.NODE_ENV !== "production" && xr(e, "compile");
        }
      }
      e.render = n.render || ut;
    }
    {
      const o = Vi(e);
      Gr();
      try {
        J$(e);
      } finally {
        qr(), o();
      }
    }
    D.NODE_ENV !== "production" &&
      !n.render &&
      e.render === ut &&
      !t &&
      (n.template
        ? Z(
            'Component provided template option but runtime compilation is not supported in this build of Vue. Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".'
          )
        : Z("Component is missing template or render function: ", n));
  }
  const cd =
    D.NODE_ENV !== "production"
      ? {
          get(e, t) {
            return Ks(), Et(e, "get", ""), e[t];
          },
          set() {
            return Z("setupContext.attrs is readonly."), !1;
          },
          deleteProperty() {
            return Z("setupContext.attrs is readonly."), !1;
          },
        }
      : {
          get(e, t) {
            return Et(e, "get", ""), e[t];
          },
        };
  function Hb(e) {
    return new Proxy(e.slots, {
      get(t, r) {
        return Et(e, "get", "$slots"), t[r];
      },
    });
  }
  function vm(e) {
    const t = r => {
      if (
        D.NODE_ENV !== "production" &&
        (e.exposed && Z("expose() should be called only once per setup()."),
        r != null)
      ) {
        let n = typeof r;
        n === "object" && (he(r) ? (n = "array") : $t(r) && (n = "ref")),
          n !== "object" &&
            Z(`expose() should be passed a plain object, received ${n}.`);
      }
      e.exposed = r || {};
    };
    if (D.NODE_ENV !== "production") {
      let r, n;
      return Object.freeze({
        get attrs() {
          return r || (r = new Proxy(e.attrs, cd));
        },
        get slots() {
          return n || (n = Hb(e));
        },
        get emit() {
          return (o, ...i) => e.emit(o, ...i);
        },
        expose: t,
      });
    } else
      return {
        attrs: new Proxy(e.attrs, cd),
        slots: e.slots,
        emit: e.emit,
        expose: t,
      };
  }
  function Oa(e) {
    return e.exposed
      ? e.exposeProxy ||
          (e.exposeProxy = new Proxy(Og(Q_(e.exposed)), {
            get(t, r) {
              if (r in t) return t[r];
              if (r in Un) return Un[r](e);
            },
            has(t, r) {
              return r in t || r in Un;
            },
          }))
      : e.proxy;
  }
  const Kb = /(?:^|[-_])(\w)/g,
    Gb = e => e.replace(Kb, t => t.toUpperCase()).replace(/[-_]/g, "");
  function Kc(e, t = !0) {
    return ye(e) ? e.displayName || e.name : e.name || (t && e.__name);
  }
  function Sa(e, t, r = !1) {
    let n = Kc(t);
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
    return n ? Gb(n) : r ? "App" : "Anonymous";
  }
  function ym(e) {
    return ye(e) && "__vccOpts" in e;
  }
  const Se = (e, t) => {
    const r = t$(e, t, Ea);
    if (D.NODE_ENV !== "production") {
      const n = Xr();
      n && n.appContext.config.warnRecursiveComputed && (r._warnRecursive = !0);
    }
    return r;
  };
  function xs(e, t, r) {
    const n = arguments.length;
    return n === 2
      ? ze(t) && !he(t)
        ? So(t)
          ? Ve(e, null, [t])
          : Ve(e, t)
        : Ve(e, null, t)
      : (n > 3
          ? (r = Array.prototype.slice.call(arguments, 2))
          : n === 3 && So(r) && (r = [r]),
        Ve(e, t, r));
  }
  function qb() {
    if (D.NODE_ENV === "production" || typeof window > "u") return;
    const e = { style: "color:#3ba776" },
      t = { style: "color:#1677ff" },
      r = { style: "color:#f5222d" },
      n = { style: "color:#eb2f96" },
      o = {
        __vue_custom_formatter: !0,
        header(f) {
          return ze(f)
            ? f.__isVue
              ? ["div", e, "VueInstance"]
              : $t(f)
                ? ["div", {}, ["span", e, u(f)], "<", a(f.value), ">"]
                : bo(f)
                  ? [
                      "div",
                      {},
                      ["span", e, Fr(f) ? "ShallowReactive" : "Reactive"],
                      "<",
                      a(f),
                      `>${Ur(f) ? " (readonly)" : ""}`,
                    ]
                  : Ur(f)
                    ? [
                        "div",
                        {},
                        ["span", e, Fr(f) ? "ShallowReadonly" : "Readonly"],
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
      f.type.props && f.props && d.push(s("props", Te(f.props))),
        f.setupState !== We && d.push(s("setup", f.setupState)),
        f.data !== We && d.push(s("data", Te(f.data)));
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
        (d = ft({}, d)),
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
            : ze(f)
              ? ["object", { object: d ? Te(f) : f }]
              : ["span", r, String(f)];
    }
    function l(f, d) {
      const p = f.type;
      if (ye(p)) return;
      const h = {};
      for (const m in f.ctx) c(p, m, d) && (h[m] = f.ctx[m]);
      return h;
    }
    function c(f, d, p) {
      const h = f[p];
      if (
        (he(h) && h.includes(d)) ||
        (ze(h) && d in h) ||
        (f.extends && c(f.extends, d, p)) ||
        (f.mixins && f.mixins.some(m => c(m, d, p)))
      )
        return !0;
    }
    function u(f) {
      return Fr(f) ? "ShallowRef" : f.effect ? "ComputedRef" : "Ref";
    }
    window.devtoolsFormatters
      ? window.devtoolsFormatters.push(o)
      : (window.devtoolsFormatters = [o]);
  }
  const ud = "3.4.35",
    Aa = D.NODE_ENV !== "production" ? Z : ut;
  var Vr = {};
  const Yb = "http://www.w3.org/2000/svg",
    Jb = "http://www.w3.org/1998/Math/MathML",
    Dr = typeof document < "u" ? document : null,
    fd = Dr && /* @__PURE__ */ Dr.createElement("template"),
    Xb = {
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
            ? Dr.createElementNS(Yb, e)
            : t === "mathml"
              ? Dr.createElementNS(Jb, e)
              : r
                ? Dr.createElement(e, { is: r })
                : Dr.createElement(e);
        return (
          e === "select" &&
            n &&
            n.multiple != null &&
            o.setAttribute("multiple", n.multiple),
          o
        );
      },
      createText: e => Dr.createTextNode(e),
      createComment: e => Dr.createComment(e),
      setText: (e, t) => {
        e.nodeValue = t;
      },
      setElementText: (e, t) => {
        e.textContent = t;
      },
      parentNode: e => e.parentNode,
      nextSibling: e => e.nextSibling,
      querySelector: e => Dr.querySelector(e),
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
          fd.innerHTML =
            n === "svg"
              ? `<svg>${e}</svg>`
              : n === "mathml"
                ? `<math>${e}</math>`
                : e;
          const a = fd.content;
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
    Zb = Symbol("_vtc");
  function Qb(e, t, r) {
    const n = e[Zb];
    n && (t = (t ? [t, ...n] : [...n]).join(" ")),
      t == null
        ? e.removeAttribute("class")
        : r
          ? e.setAttribute("class", t)
          : (e.className = t);
  }
  const qs = Symbol("_vod"),
    _m = Symbol("_vsh"),
    $m = {
      beforeMount(e, { value: t }, { transition: r }) {
        (e[qs] = e.style.display === "none" ? "" : e.style.display),
          r && t ? r.beforeEnter(e) : Qo(e, t);
      },
      mounted(e, { value: t }, { transition: r }) {
        r && t && r.enter(e);
      },
      updated(e, { value: t, oldValue: r }, { transition: n }) {
        !t != !r &&
          (n
            ? t
              ? (n.beforeEnter(e), Qo(e, !0), n.enter(e))
              : n.leave(e, () => {
                  Qo(e, !1);
                })
            : Qo(e, t));
      },
      beforeUnmount(e, { value: t }) {
        Qo(e, t);
      },
    };
  Vr.NODE_ENV !== "production" && ($m.name = "show");
  function Qo(e, t) {
    (e.style.display = t ? e[qs] : "none"), (e[_m] = !t);
  }
  const e0 = Symbol(Vr.NODE_ENV !== "production" ? "CSS_VAR_TEXT" : ""),
    t0 = /(^|;)\s*display\s*:/;
  function r0(e, t, r) {
    const n = e.style,
      o = ot(r);
    let i = !1;
    if (r && !o) {
      if (t)
        if (ot(t))
          for (const s of t.split(";")) {
            const a = s.slice(0, s.indexOf(":")).trim();
            r[a] == null && Ds(n, a, "");
          }
        else for (const s in t) r[s] == null && Ds(n, s, "");
      for (const s in r) s === "display" && (i = !0), Ds(n, s, r[s]);
    } else if (o) {
      if (t !== r) {
        const s = n[e0];
        s && (r += ";" + s), (n.cssText = r), (i = t0.test(r));
      }
    } else t && e.removeAttribute("style");
    qs in e && ((e[qs] = i ? n.display : ""), e[_m] && (n.display = "none"));
  }
  const n0 = /[^\\];\s*$/,
    dd = /\s*!important$/;
  function Ds(e, t, r) {
    if (he(r)) r.forEach(n => Ds(e, t, n));
    else if (
      (r == null && (r = ""),
      Vr.NODE_ENV !== "production" &&
        n0.test(r) &&
        Aa(`Unexpected semicolon at the end of '${t}' style value: '${r}'`),
      t.startsWith("--"))
    )
      e.setProperty(t, r);
    else {
      const n = o0(e, t);
      dd.test(r)
        ? e.setProperty(Vt(n), r.replace(dd, ""), "important")
        : (e[n] = r);
    }
  }
  const pd = ["Webkit", "Moz", "ms"],
    ll = {};
  function o0(e, t) {
    const r = ll[t];
    if (r) return r;
    let n = Ct(t);
    if (n !== "filter" && n in e) return (ll[t] = n);
    n = Kn(n);
    for (let o = 0; o < pd.length; o++) {
      const i = pd[o] + n;
      if (i in e) return (ll[t] = i);
    }
    return t;
  }
  const hd = "http://www.w3.org/1999/xlink";
  function gd(e, t, r, n, o, i = T_(t)) {
    n && t.startsWith("xlink:")
      ? r == null
        ? e.removeAttributeNS(hd, t.slice(6, t.length))
        : e.setAttributeNS(hd, t, r)
      : r == null || (i && !tg(r))
        ? e.removeAttribute(t)
        : e.setAttribute(t, i ? "" : En(r) ? String(r) : r);
  }
  function i0(e, t, r, n) {
    if (t === "innerHTML" || t === "textContent") {
      if (r == null) return;
      e[t] = r;
      return;
    }
    const o = e.tagName;
    if (
      t === "value" &&
      o !== "PROGRESS" && // custom elements may use _value internally
      !o.includes("-")
    ) {
      const s = o === "OPTION" ? e.getAttribute("value") || "" : e.value,
        a = r == null ? "" : String(r);
      (s !== a || !("_value" in e)) && (e.value = a),
        r == null && e.removeAttribute(t),
        (e._value = r);
      return;
    }
    let i = !1;
    if (r === "" || r == null) {
      const s = typeof e[t];
      s === "boolean"
        ? (r = tg(r))
        : r == null && s === "string"
          ? ((r = ""), (i = !0))
          : s === "number" && ((r = 0), (i = !0));
    }
    try {
      e[t] = r;
    } catch (s) {
      Vr.NODE_ENV !== "production" &&
        !i &&
        Aa(
          `Failed setting prop "${t}" on <${o.toLowerCase()}>: value ${r} is invalid.`,
          s
        );
    }
    i && e.removeAttribute(t);
  }
  function s0(e, t, r, n) {
    e.addEventListener(t, r, n);
  }
  function a0(e, t, r, n) {
    e.removeEventListener(t, r, n);
  }
  const md = Symbol("_vei");
  function l0(e, t, r, n, o = null) {
    const i = e[md] || (e[md] = {}),
      s = i[t];
    if (n && s) s.value = Vr.NODE_ENV !== "production" ? yd(n, t) : n;
    else {
      const [a, l] = c0(t);
      if (n) {
        const c = (i[t] = d0(Vr.NODE_ENV !== "production" ? yd(n, t) : n, o));
        s0(e, a, c, l);
      } else s && (a0(e, a, s, l), (i[t] = void 0));
    }
  }
  const vd = /(?:Once|Passive|Capture)$/;
  function c0(e) {
    let t;
    if (vd.test(e)) {
      t = {};
      let n;
      for (; (n = e.match(vd)); )
        (e = e.slice(0, e.length - n[0].length)), (t[n[0].toLowerCase()] = !0);
    }
    return [e[2] === ":" ? e.slice(3) : Vt(e.slice(2)), t];
  }
  let cl = 0;
  const u0 = /* @__PURE__ */ Promise.resolve(),
    f0 = () => cl || (u0.then(() => (cl = 0)), (cl = Date.now()));
  function d0(e, t) {
    const r = n => {
      if (!n._vts) n._vts = Date.now();
      else if (n._vts <= r.attached) return;
      sr(p0(n, r.value), t, 5, [n]);
    };
    return (r.value = e), (r.attached = f0()), r;
  }
  function yd(e, t) {
    return ye(e) || he(e)
      ? e
      : (Aa(
          `Wrong type passed as event handler to ${t} - did you forget @ or : in front of your prop?
Expected function or array of functions, received type ${typeof e}.`
        ),
        ut);
  }
  function p0(e, t) {
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
  const _d = e =>
      e.charCodeAt(0) === 111 &&
      e.charCodeAt(1) === 110 && // lowercase letter
      e.charCodeAt(2) > 96 &&
      e.charCodeAt(2) < 123,
    h0 = (e, t, r, n, o, i) => {
      const s = o === "svg";
      t === "class"
        ? Qb(e, n, s)
        : t === "style"
          ? r0(e, r, n)
          : Ii(t)
            ? Ls(t) || l0(e, t, r, n, i)
            : (
                  t[0] === "."
                    ? ((t = t.slice(1)), !0)
                    : t[0] === "^"
                      ? ((t = t.slice(1)), !1)
                      : g0(e, t, n, s)
                )
              ? (i0(e, t, n),
                !e.tagName.includes("-") &&
                  (t === "value" || t === "checked" || t === "selected") &&
                  gd(e, t, n, s, i, t !== "value"))
              : (t === "true-value"
                  ? (e._trueValue = n)
                  : t === "false-value" && (e._falseValue = n),
                gd(e, t, n, s));
    };
  function g0(e, t, r, n) {
    if (n)
      return !!(
        t === "innerHTML" ||
        t === "textContent" ||
        (t in e && _d(t) && ye(r))
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
    return _d(t) && ot(r) ? !1 : t in e;
  }
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function ki(e, t, r) {
    const n = /* @__PURE__ */ me(e, t);
    class o extends Gc {
      constructor(s) {
        super(n, s, r);
      }
    }
    return (o.def = n), o;
  }
  const m0 = typeof HTMLElement < "u" ? HTMLElement : class {};
  class Gc extends m0 {
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
          : (Vr.NODE_ENV !== "production" &&
              this.shadowRoot &&
              Aa(
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
        On(() => {
          this._connected ||
            (this._ob && (this._ob.disconnect(), (this._ob = null)),
            bd(null, this.shadowRoot),
            (this._instance = null));
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
                (l in this._props && (this._props[l] = Ff(this._props[l])),
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
      let r = this.hasAttribute(t) ? this.getAttribute(t) : void 0;
      const n = Ct(t);
      this._numberProps && this._numberProps[n] && (r = Ff(r)),
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
            ? this.setAttribute(Vt(t), "")
            : typeof r == "string" || typeof r == "number"
              ? this.setAttribute(Vt(t), r + "")
              : r || this.removeAttribute(Vt(t))));
    }
    _update() {
      bd(this._createVNode(), this.shadowRoot);
    }
    _createVNode() {
      const t = Ve(this._def, ft({}, this._props));
      return (
        this._instance ||
          (t.ce = r => {
            (this._instance = r),
              (r.isCE = !0),
              Vr.NODE_ENV !== "production" &&
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
              n(i, s), Vt(i) !== i && n(Vt(i), s);
            };
            let o = this;
            for (; (o = o && (o.parentNode || o.host)); )
              if (o instanceof Gc) {
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
            Vr.NODE_ENV !== "production" &&
              (this._styles || (this._styles = [])).push(n);
        });
    }
  }
  const v0 = ["ctrl", "shift", "alt", "meta"],
    y0 = {
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
      exact: (e, t) => v0.some(r => e[`${r}Key`] && !t.includes(r)),
    },
    _0 = (e, t) => {
      const r = e._withMods || (e._withMods = {}),
        n = t.join(".");
      return (
        r[n] ||
        (r[n] = (o, ...i) => {
          for (let s = 0; s < t.length; s++) {
            const a = y0[t[s]];
            if (a && a(o, t)) return;
          }
          return e(o, ...i);
        })
      );
    },
    $0 = /* @__PURE__ */ ft({ patchProp: h0 }, Xb);
  let $d;
  function b0() {
    return $d || ($d = bb($0));
  }
  const bd = (...e) => {
    b0().render(...e);
  };
  var w0 = {};
  function E0() {
    qb();
  }
  w0.NODE_ENV !== "production" && E0();
  const O0 = ["top", "right", "bottom", "left"],
    $n = Math.min,
    Wt = Math.max,
    Ys = Math.round,
    hs = Math.floor,
    bn = e => ({
      x: e,
      y: e,
    }),
    S0 = {
      left: "right",
      right: "left",
      bottom: "top",
      top: "bottom",
    },
    A0 = {
      start: "end",
      end: "start",
    };
  function ec(e, t, r) {
    return Wt(e, $n(t, r));
  }
  function Hr(e, t) {
    return typeof e == "function" ? e(t) : e;
  }
  function Kr(e) {
    return e.split("-")[0];
  }
  function Io(e) {
    return e.split("-")[1];
  }
  function qc(e) {
    return e === "x" ? "y" : "x";
  }
  function Yc(e) {
    return e === "y" ? "height" : "width";
  }
  function Ro(e) {
    return ["top", "bottom"].includes(Kr(e)) ? "y" : "x";
  }
  function Jc(e) {
    return qc(Ro(e));
  }
  function N0(e, t, r) {
    r === void 0 && (r = !1);
    const n = Io(e),
      o = Jc(e),
      i = Yc(o);
    let s =
      o === "x"
        ? n === (r ? "end" : "start")
          ? "right"
          : "left"
        : n === "start"
          ? "bottom"
          : "top";
    return t.reference[i] > t.floating[i] && (s = Js(s)), [s, Js(s)];
  }
  function P0(e) {
    const t = Js(e);
    return [tc(e), t, tc(t)];
  }
  function tc(e) {
    return e.replace(/start|end/g, t => A0[t]);
  }
  function C0(e, t, r) {
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
  function T0(e, t, r, n) {
    const o = Io(e);
    let i = C0(Kr(e), r === "start", n);
    return (
      o && ((i = i.map(s => s + "-" + o)), t && (i = i.concat(i.map(tc)))), i
    );
  }
  function Js(e) {
    return e.replace(/left|right|bottom|top/g, t => S0[t]);
  }
  function x0(e) {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...e,
    };
  }
  function bm(e) {
    return typeof e != "number"
      ? x0(e)
      : {
          top: e,
          right: e,
          bottom: e,
          left: e,
        };
  }
  function Xs(e) {
    const { x: t, y: r, width: n, height: o } = e;
    return {
      width: n,
      height: o,
      top: r,
      left: t,
      right: t + n,
      bottom: r + o,
      x: t,
      y: r,
    };
  }
  function wd(e, t, r) {
    let { reference: n, floating: o } = e;
    const i = Ro(t),
      s = Jc(t),
      a = Yc(s),
      l = Kr(t),
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
    switch (Io(t)) {
      case "start":
        p[s] -= d * (r && c ? -1 : 1);
        break;
      case "end":
        p[s] += d * (r && c ? -1 : 1);
        break;
    }
    return p;
  }
  const D0 = async (e, t, r) => {
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
      { x: u, y: f } = wd(c, n, l),
      d = n,
      p = {},
      h = 0;
    for (let m = 0; m < a.length; m++) {
      const { name: y, fn: g } = a[m],
        {
          x: _,
          y: E,
          data: S,
          reset: I,
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
          [y]: {
            ...p[y],
            ...S,
          },
        }),
        I &&
          h <= 50 &&
          (h++,
          typeof I == "object" &&
            (I.placement && (d = I.placement),
            I.rects &&
              (c =
                I.rects === !0
                  ? await s.getElementRects({
                      reference: e,
                      floating: t,
                      strategy: o,
                    })
                  : I.rects),
            ({ x: u, y: f } = wd(c, d, l))),
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
  async function Ci(e, t) {
    var r;
    t === void 0 && (t = {});
    const { x: n, y: o, platform: i, rects: s, elements: a, strategy: l } = e,
      {
        boundary: c = "clippingAncestors",
        rootBoundary: u = "viewport",
        elementContext: f = "floating",
        altBoundary: d = !1,
        padding: p = 0,
      } = Hr(t, e),
      h = bm(p),
      y = a[d ? (f === "floating" ? "reference" : "floating") : f],
      g = Xs(
        await i.getClippingRect({
          element:
            (r = await (i.isElement == null ? void 0 : i.isElement(y))) ==
              null || r
              ? y
              : y.contextElement ||
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
      S = (await (i.isElement == null ? void 0 : i.isElement(E)))
        ? (await (i.getScale == null ? void 0 : i.getScale(E))) || {
            x: 1,
            y: 1,
          }
        : {
            x: 1,
            y: 1,
          },
      I = Xs(
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
      top: (g.top - I.top + h.top) / S.y,
      bottom: (I.bottom - g.bottom + h.bottom) / S.y,
      left: (g.left - I.left + h.left) / S.x,
      right: (I.right - g.right + h.right) / S.x,
    };
  }
  const I0 = e => ({
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
          { element: c, padding: u = 0 } = Hr(e, t) || {};
        if (c == null) return {};
        const f = bm(u),
          d = {
            x: r,
            y: n,
          },
          p = Jc(o),
          h = Yc(p),
          m = await s.getDimensions(c),
          y = p === "y",
          g = y ? "top" : "left",
          _ = y ? "bottom" : "right",
          E = y ? "clientHeight" : "clientWidth",
          S = i.reference[h] + i.reference[p] - d[p] - i.floating[h],
          I = d[p] - i.reference[p],
          A = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(c));
        let O = A ? A[E] : 0;
        (!O || !(await (s.isElement == null ? void 0 : s.isElement(A)))) &&
          (O = a.floating[E] || i.floating[h]);
        const L = S / 2 - I / 2,
          z = O / 2 - m[h] / 2 - 1,
          H = $n(f[g], z),
          ne = $n(f[_], z),
          G = H,
          Ne = O - m[h] - ne,
          ue = O / 2 - m[h] / 2 + L,
          Pe = ec(G, ue, Ne),
          be =
            !l.arrow &&
            Io(o) != null &&
            ue !== Pe &&
            i.reference[h] / 2 - (ue < G ? H : ne) - m[h] / 2 < 0,
          le = be ? (ue < G ? ue - G : ue - Ne) : 0;
        return {
          [p]: d[p] + le,
          data: {
            [p]: Pe,
            centerOffset: ue - Pe - le,
            ...(be && {
              alignmentOffset: le,
            }),
          },
          reset: be,
        };
      },
    }),
    R0 = function (e) {
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
                ...y
              } = Hr(e, t);
            if ((r = i.arrow) != null && r.alignmentOffset) return {};
            const g = Kr(o),
              _ = Kr(a) === a,
              E = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)),
              S = d || (_ || !m ? [Js(a)] : P0(a));
            !d && h !== "none" && S.push(...T0(a, m, h, E));
            const I = [a, ...S],
              A = await Ci(t, y),
              O = [];
            let L = ((n = i.flip) == null ? void 0 : n.overflows) || [];
            if ((u && O.push(A[g]), f)) {
              const G = N0(o, s, E);
              O.push(A[G[0]], A[G[1]]);
            }
            if (
              ((L = [
                ...L,
                {
                  placement: o,
                  overflows: O,
                },
              ]),
              !O.every(G => G <= 0))
            ) {
              var z, H;
              const G = (((z = i.flip) == null ? void 0 : z.index) || 0) + 1,
                Ne = I[G];
              if (Ne)
                return {
                  data: {
                    index: G,
                    overflows: L,
                  },
                  reset: {
                    placement: Ne,
                  },
                };
              let ue =
                (H = L.filter(Pe => Pe.overflows[0] <= 0).sort(
                  (Pe, be) => Pe.overflows[1] - be.overflows[1]
                )[0]) == null
                  ? void 0
                  : H.placement;
              if (!ue)
                switch (p) {
                  case "bestFit": {
                    var ne;
                    const Pe =
                      (ne = L.map(be => [
                        be.placement,
                        be.overflows
                          .filter(le => le > 0)
                          .reduce((le, ve) => le + ve, 0),
                      ]).sort((be, le) => be[1] - le[1])[0]) == null
                        ? void 0
                        : ne[0];
                    Pe && (ue = Pe);
                    break;
                  }
                  case "initialPlacement":
                    ue = a;
                    break;
                }
              if (o !== ue)
                return {
                  reset: {
                    placement: ue,
                  },
                };
            }
            return {};
          },
        }
      );
    };
  function Ed(e, t) {
    return {
      top: e.top - t.height,
      right: e.right - t.width,
      bottom: e.bottom - t.height,
      left: e.left - t.width,
    };
  }
  function Od(e) {
    return O0.some(t => e[t] >= 0);
  }
  const M0 = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: "hide",
        options: e,
        async fn(t) {
          const { rects: r } = t,
            { strategy: n = "referenceHidden", ...o } = Hr(e, t);
          switch (n) {
            case "referenceHidden": {
              const i = await Ci(t, {
                  ...o,
                  elementContext: "reference",
                }),
                s = Ed(i, r.reference);
              return {
                data: {
                  referenceHiddenOffsets: s,
                  referenceHidden: Od(s),
                },
              };
            }
            case "escaped": {
              const i = await Ci(t, {
                  ...o,
                  altBoundary: !0,
                }),
                s = Ed(i, r.floating);
              return {
                data: {
                  escapedOffsets: s,
                  escaped: Od(s),
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
  async function j0(e, t) {
    const { placement: r, platform: n, elements: o } = e,
      i = await (n.isRTL == null ? void 0 : n.isRTL(o.floating)),
      s = Kr(r),
      a = Io(r),
      l = Ro(r) === "y",
      c = ["left", "top"].includes(s) ? -1 : 1,
      u = i && l ? -1 : 1,
      f = Hr(t, e);
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
  const F0 = function (e) {
      return (
        e === void 0 && (e = 0),
        {
          name: "offset",
          options: e,
          async fn(t) {
            var r, n;
            const { x: o, y: i, placement: s, middlewareData: a } = t,
              l = await j0(t, e);
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
    L0 = function (e) {
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
                  fn: y => {
                    let { x: g, y: _ } = y;
                    return {
                      x: g,
                      y: _,
                    };
                  },
                },
                ...l
              } = Hr(e, t),
              c = {
                x: r,
                y: n,
              },
              u = await Ci(t, l),
              f = Ro(Kr(o)),
              d = qc(f);
            let p = c[d],
              h = c[f];
            if (i) {
              const y = d === "y" ? "top" : "left",
                g = d === "y" ? "bottom" : "right",
                _ = p + u[y],
                E = p - u[g];
              p = ec(_, p, E);
            }
            if (s) {
              const y = f === "y" ? "top" : "left",
                g = f === "y" ? "bottom" : "right",
                _ = h + u[y],
                E = h - u[g];
              h = ec(_, h, E);
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
    V0 = function (e) {
      return (
        e === void 0 && (e = {}),
        {
          options: e,
          fn(t) {
            const { x: r, y: n, placement: o, rects: i, middlewareData: s } = t,
              { offset: a = 0, mainAxis: l = !0, crossAxis: c = !0 } = Hr(e, t),
              u = {
                x: r,
                y: n,
              },
              f = Ro(o),
              d = qc(f);
            let p = u[d],
              h = u[f];
            const m = Hr(a, t),
              y =
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
                S = i.reference[d] - i.floating[E] + y.mainAxis,
                I = i.reference[d] + i.reference[E] - y.mainAxis;
              p < S ? (p = S) : p > I && (p = I);
            }
            if (c) {
              var g, _;
              const E = d === "y" ? "width" : "height",
                S = ["top", "left"].includes(Kr(o)),
                I =
                  i.reference[f] -
                  i.floating[E] +
                  ((S && ((g = s.offset) == null ? void 0 : g[f])) || 0) +
                  (S ? 0 : y.crossAxis),
                A =
                  i.reference[f] +
                  i.reference[E] +
                  (S ? 0 : ((_ = s.offset) == null ? void 0 : _[f]) || 0) -
                  (S ? y.crossAxis : 0);
              h < I ? (h = I) : h > A && (h = A);
            }
            return {
              [d]: p,
              [f]: h,
            };
          },
        }
      );
    },
    k0 = function (e) {
      return (
        e === void 0 && (e = {}),
        {
          name: "size",
          options: e,
          async fn(t) {
            const { placement: r, rects: n, platform: o, elements: i } = t,
              { apply: s = () => {}, ...a } = Hr(e, t),
              l = await Ci(t, a),
              c = Kr(r),
              u = Io(r),
              f = Ro(r) === "y",
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
            const y = p - l[h],
              g = d - l[m],
              _ = !t.middlewareData.shift;
            let E = y,
              S = g;
            if (f) {
              const A = d - l.left - l.right;
              S = u || _ ? $n(g, A) : A;
            } else {
              const A = p - l.top - l.bottom;
              E = u || _ ? $n(y, A) : A;
            }
            if (_ && !u) {
              const A = Wt(l.left, 0),
                O = Wt(l.right, 0),
                L = Wt(l.top, 0),
                z = Wt(l.bottom, 0);
              f
                ? (S =
                    d - 2 * (A !== 0 || O !== 0 ? A + O : Wt(l.left, l.right)))
                : (E =
                    p - 2 * (L !== 0 || z !== 0 ? L + z : Wt(l.top, l.bottom)));
            }
            await s({
              ...t,
              availableWidth: S,
              availableHeight: E,
            });
            const I = await o.getDimensions(i.floating);
            return d !== I.width || p !== I.height
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
  function to(e) {
    return Xc(e) ? (e.nodeName || "").toLowerCase() : "#document";
  }
  function Kt(e) {
    var t;
    return (
      (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) ||
      window
    );
  }
  function Zr(e) {
    var t;
    return (t = (Xc(e) ? e.ownerDocument : e.document) || window.document) ==
      null
      ? void 0
      : t.documentElement;
  }
  function Xc(e) {
    return e instanceof Node || e instanceof Kt(e).Node;
  }
  function lr(e) {
    return e instanceof Element || e instanceof Kt(e).Element;
  }
  function Or(e) {
    return e instanceof HTMLElement || e instanceof Kt(e).HTMLElement;
  }
  function Sd(e) {
    return typeof ShadowRoot > "u"
      ? !1
      : e instanceof ShadowRoot || e instanceof Kt(e).ShadowRoot;
  }
  function Bi(e) {
    const { overflow: t, overflowX: r, overflowY: n, display: o } = cr(e);
    return (
      /auto|scroll|overlay|hidden|clip/.test(t + n + r) &&
      !["inline", "contents"].includes(o)
    );
  }
  function B0(e) {
    return ["table", "td", "th"].includes(to(e));
  }
  function Na(e) {
    return [":popover-open", ":modal"].some(t => {
      try {
        return e.matches(t);
      } catch {
        return !1;
      }
    });
  }
  function Zc(e) {
    const t = Qc(),
      r = lr(e) ? cr(e) : e;
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
  function z0(e) {
    let t = wn(e);
    for (; Or(t) && !No(t); ) {
      if (Zc(t)) return t;
      if (Na(t)) return null;
      t = wn(t);
    }
    return null;
  }
  function Qc() {
    return typeof CSS > "u" || !CSS.supports
      ? !1
      : CSS.supports("-webkit-backdrop-filter", "none");
  }
  function No(e) {
    return ["html", "body", "#document"].includes(to(e));
  }
  function cr(e) {
    return Kt(e).getComputedStyle(e);
  }
  function Pa(e) {
    return lr(e)
      ? {
          scrollLeft: e.scrollLeft,
          scrollTop: e.scrollTop,
        }
      : {
          scrollLeft: e.scrollX,
          scrollTop: e.scrollY,
        };
  }
  function wn(e) {
    if (to(e) === "html") return e;
    const t =
      // Step into the shadow DOM of the parent of a slotted node.
      e.assignedSlot || // DOM Element detected.
      e.parentNode || // ShadowRoot detected.
      (Sd(e) && e.host) || // Fallback.
      Zr(e);
    return Sd(t) ? t.host : t;
  }
  function wm(e) {
    const t = wn(e);
    return No(t)
      ? e.ownerDocument
        ? e.ownerDocument.body
        : e.body
      : Or(t) && Bi(t)
        ? t
        : wm(t);
  }
  function Ti(e, t, r) {
    var n;
    t === void 0 && (t = []), r === void 0 && (r = !0);
    const o = wm(e),
      i = o === ((n = e.ownerDocument) == null ? void 0 : n.body),
      s = Kt(o);
    return i
      ? t.concat(
          s,
          s.visualViewport || [],
          Bi(o) ? o : [],
          s.frameElement && r ? Ti(s.frameElement) : []
        )
      : t.concat(o, Ti(o, [], r));
  }
  function Em(e) {
    const t = cr(e);
    let r = parseFloat(t.width) || 0,
      n = parseFloat(t.height) || 0;
    const o = Or(e),
      i = o ? e.offsetWidth : r,
      s = o ? e.offsetHeight : n,
      a = Ys(r) !== i || Ys(n) !== s;
    return (
      a && ((r = i), (n = s)),
      {
        width: r,
        height: n,
        $: a,
      }
    );
  }
  function eu(e) {
    return lr(e) ? e : e.contextElement;
  }
  function Eo(e) {
    const t = eu(e);
    if (!Or(t)) return bn(1);
    const r = t.getBoundingClientRect(),
      { width: n, height: o, $: i } = Em(t);
    let s = (i ? Ys(r.width) : r.width) / n,
      a = (i ? Ys(r.height) : r.height) / o;
    return (
      (!s || !Number.isFinite(s)) && (s = 1),
      (!a || !Number.isFinite(a)) && (a = 1),
      {
        x: s,
        y: a,
      }
    );
  }
  const U0 = /* @__PURE__ */ bn(0);
  function Om(e) {
    const t = Kt(e);
    return !Qc() || !t.visualViewport
      ? U0
      : {
          x: t.visualViewport.offsetLeft,
          y: t.visualViewport.offsetTop,
        };
  }
  function W0(e, t, r) {
    return t === void 0 && (t = !1), !r || (t && r !== Kt(e)) ? !1 : t;
  }
  function qn(e, t, r, n) {
    t === void 0 && (t = !1), r === void 0 && (r = !1);
    const o = e.getBoundingClientRect(),
      i = eu(e);
    let s = bn(1);
    t && (n ? lr(n) && (s = Eo(n)) : (s = Eo(e)));
    const a = W0(i, r, n) ? Om(i) : bn(0);
    let l = (o.left + a.x) / s.x,
      c = (o.top + a.y) / s.y,
      u = o.width / s.x,
      f = o.height / s.y;
    if (i) {
      const d = Kt(i),
        p = n && lr(n) ? Kt(n) : n;
      let h = d,
        m = h.frameElement;
      for (; m && n && p !== h; ) {
        const y = Eo(m),
          g = m.getBoundingClientRect(),
          _ = cr(m),
          E = g.left + (m.clientLeft + parseFloat(_.paddingLeft)) * y.x,
          S = g.top + (m.clientTop + parseFloat(_.paddingTop)) * y.y;
        (l *= y.x),
          (c *= y.y),
          (u *= y.x),
          (f *= y.y),
          (l += E),
          (c += S),
          (h = Kt(m)),
          (m = h.frameElement);
      }
    }
    return Xs({
      width: u,
      height: f,
      x: l,
      y: c,
    });
  }
  function H0(e) {
    let { elements: t, rect: r, offsetParent: n, strategy: o } = e;
    const i = o === "fixed",
      s = Zr(n),
      a = t ? Na(t.floating) : !1;
    if (n === s || (a && i)) return r;
    let l = {
        scrollLeft: 0,
        scrollTop: 0,
      },
      c = bn(1);
    const u = bn(0),
      f = Or(n);
    if (
      (f || (!f && !i)) &&
      ((to(n) !== "body" || Bi(s)) && (l = Pa(n)), Or(n))
    ) {
      const d = qn(n);
      (c = Eo(n)), (u.x = d.x + n.clientLeft), (u.y = d.y + n.clientTop);
    }
    return {
      width: r.width * c.x,
      height: r.height * c.y,
      x: r.x * c.x - l.scrollLeft * c.x + u.x,
      y: r.y * c.y - l.scrollTop * c.y + u.y,
    };
  }
  function K0(e) {
    return Array.from(e.getClientRects());
  }
  function Sm(e) {
    return qn(Zr(e)).left + Pa(e).scrollLeft;
  }
  function G0(e) {
    const t = Zr(e),
      r = Pa(e),
      n = e.ownerDocument.body,
      o = Wt(t.scrollWidth, t.clientWidth, n.scrollWidth, n.clientWidth),
      i = Wt(t.scrollHeight, t.clientHeight, n.scrollHeight, n.clientHeight);
    let s = -r.scrollLeft + Sm(e);
    const a = -r.scrollTop;
    return (
      cr(n).direction === "rtl" && (s += Wt(t.clientWidth, n.clientWidth) - o),
      {
        width: o,
        height: i,
        x: s,
        y: a,
      }
    );
  }
  function q0(e, t) {
    const r = Kt(e),
      n = Zr(e),
      o = r.visualViewport;
    let i = n.clientWidth,
      s = n.clientHeight,
      a = 0,
      l = 0;
    if (o) {
      (i = o.width), (s = o.height);
      const c = Qc();
      (!c || (c && t === "fixed")) && ((a = o.offsetLeft), (l = o.offsetTop));
    }
    return {
      width: i,
      height: s,
      x: a,
      y: l,
    };
  }
  function Y0(e, t) {
    const r = qn(e, !0, t === "fixed"),
      n = r.top + e.clientTop,
      o = r.left + e.clientLeft,
      i = Or(e) ? Eo(e) : bn(1),
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
  function Ad(e, t, r) {
    let n;
    if (t === "viewport") n = q0(e, r);
    else if (t === "document") n = G0(Zr(e));
    else if (lr(t)) n = Y0(t, r);
    else {
      const o = Om(e);
      n = {
        ...t,
        x: t.x - o.x,
        y: t.y - o.y,
      };
    }
    return Xs(n);
  }
  function Am(e, t) {
    const r = wn(e);
    return r === t || !lr(r) || No(r)
      ? !1
      : cr(r).position === "fixed" || Am(r, t);
  }
  function J0(e, t) {
    const r = t.get(e);
    if (r) return r;
    let n = Ti(e, [], !1).filter(a => lr(a) && to(a) !== "body"),
      o = null;
    const i = cr(e).position === "fixed";
    let s = i ? wn(e) : e;
    for (; lr(s) && !No(s); ) {
      const a = cr(s),
        l = Zc(s);
      !l && a.position === "fixed" && (o = null),
        (
          i
            ? !l && !o
            : (!l &&
                a.position === "static" &&
                !!o &&
                ["absolute", "fixed"].includes(o.position)) ||
              (Bi(s) && !l && Am(e, s))
        )
          ? (n = n.filter(u => u !== s))
          : (o = a),
        (s = wn(s));
    }
    return t.set(e, n), n;
  }
  function X0(e) {
    let { element: t, boundary: r, rootBoundary: n, strategy: o } = e;
    const s = [
        ...(r === "clippingAncestors"
          ? Na(t)
            ? []
            : J0(t, this._c)
          : [].concat(r)),
        n,
      ],
      a = s[0],
      l = s.reduce(
        (c, u) => {
          const f = Ad(t, u, o);
          return (
            (c.top = Wt(f.top, c.top)),
            (c.right = $n(f.right, c.right)),
            (c.bottom = $n(f.bottom, c.bottom)),
            (c.left = Wt(f.left, c.left)),
            c
          );
        },
        Ad(t, a, o)
      );
    return {
      width: l.right - l.left,
      height: l.bottom - l.top,
      x: l.left,
      y: l.top,
    };
  }
  function Z0(e) {
    const { width: t, height: r } = Em(e);
    return {
      width: t,
      height: r,
    };
  }
  function Q0(e, t, r) {
    const n = Or(t),
      o = Zr(t),
      i = r === "fixed",
      s = qn(e, !0, i, t);
    let a = {
      scrollLeft: 0,
      scrollTop: 0,
    };
    const l = bn(0);
    if (n || (!n && !i))
      if (((to(t) !== "body" || Bi(o)) && (a = Pa(t)), n)) {
        const f = qn(t, !0, i, t);
        (l.x = f.x + t.clientLeft), (l.y = f.y + t.clientTop);
      } else o && (l.x = Sm(o));
    const c = s.left + a.scrollLeft - l.x,
      u = s.top + a.scrollTop - l.y;
    return {
      x: c,
      y: u,
      width: s.width,
      height: s.height,
    };
  }
  function ul(e) {
    return cr(e).position === "static";
  }
  function Nd(e, t) {
    return !Or(e) || cr(e).position === "fixed"
      ? null
      : t
        ? t(e)
        : e.offsetParent;
  }
  function Nm(e, t) {
    const r = Kt(e);
    if (Na(e)) return r;
    if (!Or(e)) {
      let o = wn(e);
      for (; o && !No(o); ) {
        if (lr(o) && !ul(o)) return o;
        o = wn(o);
      }
      return r;
    }
    let n = Nd(e, t);
    for (; n && B0(n) && ul(n); ) n = Nd(n, t);
    return n && No(n) && ul(n) && !Zc(n) ? r : n || z0(e) || r;
  }
  const ew = async function (e) {
    const t = this.getOffsetParent || Nm,
      r = this.getDimensions,
      n = await r(e.floating);
    return {
      reference: Q0(e.reference, await t(e.floating), e.strategy),
      floating: {
        x: 0,
        y: 0,
        width: n.width,
        height: n.height,
      },
    };
  };
  function tw(e) {
    return cr(e).direction === "rtl";
  }
  const rw = {
    convertOffsetParentRelativeRectToViewportRelativeRect: H0,
    getDocumentElement: Zr,
    getClippingRect: X0,
    getOffsetParent: Nm,
    getElementRects: ew,
    getClientRects: K0,
    getDimensions: Z0,
    getScale: Eo,
    isElement: lr,
    isRTL: tw,
  };
  function nw(e, t) {
    let r = null,
      n;
    const o = Zr(e);
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
      const p = hs(u),
        h = hs(o.clientWidth - (c + f)),
        m = hs(o.clientHeight - (u + d)),
        y = hs(c),
        _ = {
          rootMargin: -p + "px " + -h + "px " + -m + "px " + -y + "px",
          threshold: Wt(0, $n(1, l)) || 1,
        };
      let E = !0;
      function S(I) {
        const A = I[0].intersectionRatio;
        if (A !== l) {
          if (!E) return s();
          A
            ? s(!1, A)
            : (n = setTimeout(() => {
                s(!1, 1e-7);
              }, 1e3));
        }
        E = !1;
      }
      try {
        r = new IntersectionObserver(S, {
          ..._,
          // Handle <iframe>s
          root: o.ownerDocument,
        });
      } catch {
        r = new IntersectionObserver(S, _);
      }
      r.observe(e);
    }
    return s(!0), i;
  }
  function ow(e, t, r, n) {
    n === void 0 && (n = {});
    const {
        ancestorScroll: o = !0,
        ancestorResize: i = !0,
        elementResize: s = typeof ResizeObserver == "function",
        layoutShift: a = typeof IntersectionObserver == "function",
        animationFrame: l = !1,
      } = n,
      c = eu(e),
      u = o || i ? [...(c ? Ti(c) : []), ...Ti(t)] : [];
    u.forEach(g => {
      o &&
        g.addEventListener("scroll", r, {
          passive: !0,
        }),
        i && g.addEventListener("resize", r);
    });
    const f = c && a ? nw(c, r) : null;
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
      m = l ? qn(e) : null;
    l && y();
    function y() {
      const g = qn(e);
      m &&
        (g.x !== m.x ||
          g.y !== m.y ||
          g.width !== m.width ||
          g.height !== m.height) &&
        r(),
        (m = g),
        (h = requestAnimationFrame(y));
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
  const iw = F0,
    sw = L0,
    Pd = R0,
    aw = k0,
    lw = M0,
    cw = I0,
    uw = V0,
    fw = (e, t, r) => {
      const n = /* @__PURE__ */ new Map(),
        o = {
          platform: rw,
          ...r,
        },
        i = {
          ...o.platform,
          _c: n,
        };
      return D0(e, t, {
        ...o,
        platform: i,
      });
    };
  function dw(e) {
    return e != null && typeof e == "object" && "$el" in e;
  }
  function rc(e) {
    if (dw(e)) {
      const t = e.$el;
      return Xc(t) && to(t) === "#comment" ? null : t;
    }
    return e;
  }
  function vo(e) {
    return typeof e == "function" ? e() : U(e);
  }
  function pw(e) {
    return {
      name: "arrow",
      options: e,
      fn(t) {
        const r = rc(vo(e.element));
        return r == null
          ? {}
          : cw({
              element: r,
              padding: e.padding,
            }).fn(t);
      },
    };
  }
  function Pm(e) {
    return typeof window > "u"
      ? 1
      : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
  }
  function Cd(e, t) {
    const r = Pm(e);
    return Math.round(t * r) / r;
  }
  function hw(e, t, r) {
    r === void 0 && (r = {});
    const n = r.whileElementsMounted,
      o = Se(() => {
        var O;
        return (O = vo(r.open)) != null ? O : !0;
      }),
      i = Se(() => vo(r.middleware)),
      s = Se(() => {
        var O;
        return (O = vo(r.placement)) != null ? O : "bottom";
      }),
      a = Se(() => {
        var O;
        return (O = vo(r.strategy)) != null ? O : "absolute";
      }),
      l = Se(() => {
        var O;
        return (O = vo(r.transform)) != null ? O : !0;
      }),
      c = Se(() => rc(e.value)),
      u = Se(() => rc(t.value)),
      f = Oe(0),
      d = Oe(0),
      p = Oe(a.value),
      h = Oe(s.value),
      m = wg({}),
      y = Oe(!1),
      g = Se(() => {
        const O = {
          position: p.value,
          left: "0",
          top: "0",
        };
        if (!u.value) return O;
        const L = Cd(u.value, f.value),
          z = Cd(u.value, d.value);
        return l.value
          ? {
              ...O,
              transform: "translate(" + L + "px, " + z + "px)",
              ...(Pm(u.value) >= 1.5 && {
                willChange: "transform",
              }),
            }
          : {
              position: p.value,
              left: L + "px",
              top: z + "px",
            };
      });
    let _;
    function E() {
      c.value == null ||
        u.value == null ||
        fw(c.value, u.value, {
          middleware: i.value,
          placement: s.value,
          strategy: a.value,
        }).then(O => {
          (f.value = O.x),
            (d.value = O.y),
            (p.value = O.strategy),
            (h.value = O.placement),
            (m.value = O.middlewareData),
            (y.value = !0);
        });
    }
    function S() {
      typeof _ == "function" && (_(), (_ = void 0));
    }
    function I() {
      if ((S(), n === void 0)) {
        E();
        return;
      }
      if (c.value != null && u.value != null) {
        _ = n(c.value, u.value, E);
        return;
      }
    }
    function A() {
      o.value || (y.value = !1);
    }
    return (
      _t([i, s, a], E, {
        flush: "sync",
      }),
      _t([c, u], I, {
        flush: "sync",
      }),
      _t(o, A, {
        flush: "sync",
      }),
      Pc() && sg(S),
      {
        x: At(f),
        y: At(d),
        strategy: At(p),
        placement: At(h),
        middlewareData: At(m),
        isPositioned: At(y),
        floatingStyles: g,
        update: E,
      }
    );
  }
  var gw = {};
  function ro(e, t) {
    const r = typeof e == "string" && !t ? `${e}Context` : t,
      n = Symbol(r);
    return [
      o => {
        const i = gi(n, o);
        if (i || i === null) return i;
        throw new Error(
          `Injection \`${n.toString()}\` not found. Component must be used within ${
            Array.isArray(e)
              ? `one of the following components: ${e.join(", ")}`
              : `\`${e}\``
          }`
        );
      },
      o => (qg(n, o), o),
    ];
  }
  function Cm(e, t, r) {
    const n = r.originalEvent.target,
      o = new CustomEvent(e, {
        bubbles: !1,
        cancelable: !0,
        detail: r,
      });
    t && n.addEventListener(e, t, { once: !0 }), n.dispatchEvent(o);
  }
  function mw(e, t) {
    var r;
    const n = wg();
    return (
      Qt(
        () => {
          n.value = e();
        },
        {
          ...t,
          flush: (r = void 0) != null ? r : "sync",
        }
      ),
      ya(n)
    );
  }
  function zi(e) {
    return Pc() ? (sg(e), !0) : !1;
  }
  function vw() {
    const e = /* @__PURE__ */ new Set(),
      t = r => {
        e.delete(r);
      };
    return {
      on: r => {
        e.add(r);
        const n = () => t(r);
        return (
          zi(n),
          {
            off: n,
          }
        );
      },
      off: t,
      trigger: (...r) => Promise.all(Array.from(e).map(n => n(...r))),
    };
  }
  function yw(e) {
    let t = !1,
      r;
    const n = ig(!0);
    return (...o) => (t || ((r = n.run(() => e(...o))), (t = !0)), r);
  }
  function _w(e) {
    let t = 0,
      r,
      n;
    const o = () => {
      (t -= 1), n && t <= 0 && (n.stop(), (r = void 0), (n = void 0));
    };
    return (...i) => (
      (t += 1), r || ((n = ig(!0)), (r = n.run(() => e(...i)))), zi(o), r
    );
  }
  function Hn(e) {
    return typeof e == "function" ? e() : U(e);
  }
  const An = typeof window < "u" && typeof document < "u";
  typeof WorkerGlobalScope < "u" && globalThis instanceof WorkerGlobalScope;
  const $w = e => typeof e < "u",
    bw = Object.prototype.toString,
    ww = e => bw.call(e) === "[object Object]",
    Ew = () => {},
    Td = /* @__PURE__ */ Ow();
  function Ow() {
    var e, t;
    return (
      An &&
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
  function Sw(e) {
    return Xr();
  }
  function Aw(e, t = 1e4) {
    return i$((r, n) => {
      let o = Hn(e),
        i;
      const s = () =>
        setTimeout(() => {
          (o = Hn(e)), n();
        }, Hn(t));
      return (
        zi(() => {
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
  function Nw(e, t) {
    Sw() && kg(e, t);
  }
  function Tm(e, t, r = {}) {
    const { immediate: n = !0 } = r,
      o = Oe(!1);
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
        }, Hn(t)));
    }
    return (
      n && ((o.value = !0), An && l()),
      zi(a),
      {
        isPending: ya(o),
        start: l,
        stop: a,
      }
    );
  }
  function Ui(e) {
    var t;
    const r = Hn(e);
    return (t = r == null ? void 0 : r.$el) != null ? t : r;
  }
  const xm = An ? window : void 0;
  function Zs(...e) {
    let t, r, n, o;
    if (
      (typeof e[0] == "string" || Array.isArray(e[0])
        ? (([r, n, o] = e), (t = xm))
        : ([t, r, n, o] = e),
      !t)
    )
      return Ew;
    Array.isArray(r) || (r = [r]), Array.isArray(n) || (n = [n]);
    const i = [],
      s = () => {
        i.forEach(u => u()), (i.length = 0);
      },
      a = (u, f, d, p) => (
        u.addEventListener(f, d, p), () => u.removeEventListener(f, d, p)
      ),
      l = _t(
        () => [Ui(t), Hn(o)],
        ([u, f]) => {
          if ((s(), !u)) return;
          const d = ww(f) ? { ...f } : f;
          i.push(...r.flatMap(p => n.map(h => a(u, p, h, d))));
        },
        { immediate: !0, flush: "post" }
      ),
      c = () => {
        l(), s();
      };
    return zi(c), c;
  }
  function Pw(e) {
    return typeof e == "function"
      ? e
      : typeof e == "string"
        ? t => t.key === e
        : Array.isArray(e)
          ? t => e.includes(t.key)
          : () => !0;
  }
  function Cw(...e) {
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
        target: o = xm,
        eventName: i = "keydown",
        passive: s = !1,
        dedupe: a = !1,
      } = n,
      l = Pw(t);
    return Zs(
      o,
      i,
      c => {
        (c.repeat && Hn(a)) || (l(c) && r(c));
      },
      s
    );
  }
  function Tw() {
    const e = Oe(!1),
      t = Xr();
    return (
      t &&
        Jr(() => {
          e.value = !0;
        }, t),
      e
    );
  }
  function xw(e) {
    return JSON.parse(JSON.stringify(e));
  }
  function Dm(e, t, r, n = {}) {
    var o, i, s;
    const {
        clone: a = !1,
        passive: l = !1,
        eventName: c,
        deep: u = !1,
        defaultValue: f,
        shouldEmit: d,
      } = n,
      p = Xr(),
      h =
        r ||
        (p == null ? void 0 : p.emit) ||
        ((o = p == null ? void 0 : p.$emit) == null ? void 0 : o.bind(p)) ||
        ((s = (i = p == null ? void 0 : p.proxy) == null ? void 0 : i.$emit) ==
        null
          ? void 0
          : s.bind(p == null ? void 0 : p.proxy));
    let m = c;
    m = m || `update:${t.toString()}`;
    const y = E => (a ? (typeof a == "function" ? a(E) : xw(E)) : E),
      g = () => ($w(e[t]) ? y(e[t]) : f),
      _ = E => {
        d ? d(E) && h(m, E) : h(m, E);
      };
    if (l) {
      const E = g(),
        S = Oe(E);
      let I = !1;
      return (
        _t(
          () => e[t],
          A => {
            I || ((I = !0), (S.value = y(A)), On(() => (I = !1)));
          }
        ),
        _t(
          S,
          A => {
            !I && (A !== e[t] || u) && _(A);
          },
          { deep: u }
        ),
        S
      );
    } else
      return Se({
        get() {
          return g();
        },
        set(E) {
          _(E);
        },
      });
  }
  function tu(e) {
    return e ? e.flatMap(t => (t.type === Nt ? tu(t.children) : [t])) : [];
  }
  function fl(e) {
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
  function nc(e, t, r = ".", n) {
    if (!fl(t)) return nc(e, {}, r);
    const o = Object.assign({}, t);
    for (const i in e) {
      if (i === "__proto__" || i === "constructor") continue;
      const s = e[i];
      s != null &&
        (Array.isArray(s) && Array.isArray(o[i])
          ? (o[i] = [...s, ...o[i]])
          : fl(s) && fl(o[i])
            ? (o[i] = nc(s, o[i], (r ? `${r}.` : "") + i.toString()))
            : (o[i] = s));
    }
    return o;
  }
  function Dw(e) {
    return (...t) =>
      // eslint-disable-next-line unicorn/no-array-reduce
      t.reduce((r, n) => nc(r, n, ""), {});
  }
  const Iw = Dw(),
    [Im, $K] = ro("ConfigProvider");
  let Rw = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",
    Mw = (e = 21) => {
      let t = "",
        r = e;
      for (; r--; ) t += Rw[(Math.random() * 64) | 0];
      return t;
    };
  const jw = _w(() => {
    const e = Oe(/* @__PURE__ */ new Map()),
      t = Oe(),
      r = Se(() => {
        for (const s of e.value.values()) if (s) return !0;
        return !1;
      }),
      n = Im({
        scrollBody: Oe(!0),
      });
    let o = null;
    const i = () => {
      (document.body.style.paddingRight = ""),
        (document.body.style.marginRight = ""),
        (document.body.style.pointerEvents = ""),
        document.body.style.removeProperty("--scrollbar-width"),
        (document.body.style.overflow = t.value ?? ""),
        Td && (o == null || o()),
        (t.value = void 0);
    };
    return (
      _t(
        r,
        (s, a) => {
          var l;
          if (!An) return;
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
                  ? Iw(
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
            Td &&
              (o = Zs(
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
            On(() => {
              (document.body.style.pointerEvents = "none"),
                (document.body.style.overflow = "hidden");
            });
        },
        { immediate: !0, flush: "sync" }
      ),
      e
    );
  });
  function Fw(e) {
    const t = Mw(6),
      r = jw();
    r.value.set(t, e);
    const n = Se({
      get: () => r.value.get(t) ?? !1,
      set: o => r.value.set(t, o),
    });
    return (
      Nw(() => {
        r.value.delete(t);
      }),
      n
    );
  }
  function Ca(e) {
    const t = Xr(),
      r = t == null ? void 0 : t.type.emits,
      n = {};
    return (
      (r != null && r.length) ||
        console.warn(
          `No emitted event found. Please check component: ${t == null ? void 0 : t.type.__name}`
        ),
      r == null ||
        r.forEach(o => {
          n[Ir(Ct(o))] = (...i) => e(o, ...i);
        }),
      n
    );
  }
  function Rm(e) {
    const t = Xr(),
      r = Object.keys((t == null ? void 0 : t.type.props) ?? {}).reduce(
        (o, i) => {
          const s = (t == null ? void 0 : t.type.props[i]).default;
          return s !== void 0 && (o[i] = s), o;
        },
        {}
      ),
      n = l$(e);
    return Se(() => {
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
  function ru(e, t) {
    const r = Rm(e),
      n = t ? Ca(t) : {};
    return Se(() => ({
      ...r.value,
      ...n,
    }));
  }
  function He() {
    const e = Xr(),
      t = Oe(),
      r = Se(() => {
        var s, a;
        return ["#text", "#comment"].includes(
          (s = t.value) == null ? void 0 : s.$el.nodeName
        )
          ? (a = t.value) == null
            ? void 0
            : a.$el.nextElementSibling
          : Ui(t);
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
  function Lw(e, t) {
    const r = Aw(!1, 300),
      n = Oe(null),
      o = vw();
    function i() {
      (n.value = null), (r.value = !1);
    }
    function s(a, l) {
      const c = a.currentTarget,
        u = { x: a.clientX, y: a.clientY },
        f = Vw(u, c.getBoundingClientRect()),
        d = kw(u, f),
        p = Bw(l.getBoundingClientRect()),
        h = Uw([...d, ...p]);
      (n.value = h), (r.value = !0);
    }
    return (
      Qt(a => {
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
      Qt(a => {
        if (n.value) {
          const l = c => {
            var u, f;
            if (!n.value) return;
            const d = c.target,
              p = { x: c.clientX, y: c.clientY },
              h =
                ((u = e.value) == null ? void 0 : u.contains(d)) ||
                ((f = t.value) == null ? void 0 : f.contains(d)),
              m = !zw(p, n.value),
              y = d.hasAttribute("data-grace-area-trigger");
            h ? i() : (m || y) && (i(), o.trigger());
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
  function Vw(e, t) {
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
  function kw(e, t, r = 5) {
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
  function Bw(e) {
    const { top: t, right: r, bottom: n, left: o } = e;
    return [
      { x: o, y: t },
      { x: r, y: t },
      { x: r, y: n },
      { x: o, y: n },
    ];
  }
  function zw(e, t) {
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
  function Uw(e) {
    const t = e.slice();
    return (
      t.sort((r, n) =>
        r.x < n.x ? -1 : r.x > n.x ? 1 : r.y < n.y ? -1 : r.y > n.y ? 1 : 0
      ),
      Ww(t)
    );
  }
  function Ww(e) {
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
  var Hw = function (e) {
      if (typeof document > "u") return null;
      var t = Array.isArray(e) ? e[0] : e;
      return t.ownerDocument.body;
    },
    ho = /* @__PURE__ */ new WeakMap(),
    gs = /* @__PURE__ */ new WeakMap(),
    ms = {},
    dl = 0,
    Mm = function (e) {
      return e && (e.host || Mm(e.parentNode));
    },
    Kw = function (e, t) {
      return t
        .map(function (r) {
          if (e.contains(r)) return r;
          var n = Mm(r);
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
    Gw = function (e, t, r, n) {
      var o = Kw(t, Array.isArray(e) ? e : [e]);
      ms[r] || (ms[r] = /* @__PURE__ */ new WeakMap());
      var i = ms[r],
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
                  m = (ho.get(d) || 0) + 1,
                  y = (i.get(d) || 0) + 1;
                ho.set(d, m),
                  i.set(d, y),
                  s.push(d),
                  m === 1 && h && gs.set(d, !0),
                  y === 1 && d.setAttribute(r, "true"),
                  h || d.setAttribute(n, "true");
              } catch (g) {
                console.error("aria-hidden: cannot operate on ", d, g);
              }
          });
      };
      return (
        u(t),
        a.clear(),
        dl++,
        function () {
          s.forEach(function (f) {
            var d = ho.get(f) - 1,
              p = i.get(f) - 1;
            ho.set(f, d),
              i.set(f, p),
              d || (gs.has(f) || f.removeAttribute(n), gs.delete(f)),
              p || f.removeAttribute(r);
          }),
            dl--,
            dl ||
              ((ho = /* @__PURE__ */ new WeakMap()),
              (ho = /* @__PURE__ */ new WeakMap()),
              (gs = /* @__PURE__ */ new WeakMap()),
              (ms = {}));
        }
      );
    },
    qw = function (e, t, r) {
      r === void 0 && (r = "data-aria-hidden");
      var n = Array.from(Array.isArray(e) ? e : [e]),
        o = Hw(e);
      return o
        ? (n.push.apply(n, Array.from(o.querySelectorAll("[aria-live]"))),
          Gw(n, o, r, "aria-hidden"))
        : function () {
            return null;
          };
    };
  function Yw(e) {
    let t;
    _t(
      () => Ui(e),
      r => {
        r ? (t = qw(r)) : t && t();
      }
    ),
      Fi(() => {
        t && t();
      });
  }
  let Jw = 0;
  function Qs(e, t = "radix") {
    const { useId: r } = Im({ useId: void 0 });
    return r && typeof r == "function" ? `${t}-${r()}` : `${t}-${++Jw}`;
  }
  function Xw(e) {
    const t = Oe(),
      r = Se(() => {
        var o;
        return ((o = t.value) == null ? void 0 : o.width) ?? 0;
      }),
      n = Se(() => {
        var o;
        return ((o = t.value) == null ? void 0 : o.height) ?? 0;
      });
    return (
      Jr(() => {
        const o = Ui(e);
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
  function Zw(e, t) {
    const r = Oe(e);
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
  const Qw = /* @__PURE__ */ me({
      name: "PrimitiveSlot",
      inheritAttrs: !1,
      setup(e, { attrs: t, slots: r }) {
        return () => {
          var n, o;
          if (!r.default) return null;
          const i = tu(r.default()),
            s = i.findIndex(u => u.type !== Rt);
          if (s === -1) return i;
          const a = i[s];
          (n = a.props) == null || delete n.ref;
          const l = a.props ? gt(t, a.props) : t;
          t.class && (o = a.props) != null && o.class && delete a.props.class;
          const c = Wr(a, l);
          for (const u in l)
            u.startsWith("on") &&
              (c.props || (c.props = {}), (c.props[u] = l[u]));
          return i.length === 1 ? c : ((i[s] = c), i);
        };
      },
    }),
    xt = /* @__PURE__ */ me({
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
          ? () => xs(n, t)
          : n !== "template"
            ? () => xs(e.as, t, { default: r.default })
            : () => xs(Qw, t, { default: r.default });
      },
    });
  function eE(e, t) {
    const r = Oe({}),
      n = Oe("none"),
      o = e.value ? "mounted" : "unmounted",
      { state: i, dispatch: s } = Zw(o, {
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
        if (An) {
          const h = new CustomEvent(d, { bubbles: !1, cancelable: !1 });
          (p = t.value) == null || p.dispatchEvent(h);
        }
      };
    _t(
      e,
      async (d, p) => {
        var h;
        const m = p !== d;
        if ((await On(), m)) {
          const y = n.value,
            g = vs(t.value);
          d
            ? (s("MOUNT"), a("enter"), g === "none" && a("after-enter"))
            : g === "none" ||
                ((h = r.value) == null ? void 0 : h.display) === "none"
              ? (s("UNMOUNT"), a("leave"), a("after-leave"))
              : p && y !== g
                ? (s("ANIMATION_OUT"), a("leave"))
                : (s("UNMOUNT"), a("after-leave"));
        }
      },
      { immediate: !0 }
    );
    const l = d => {
        const p = vs(t.value),
          h = p.includes(d.animationName),
          m = i.value === "mounted" ? "enter" : "leave";
        d.target === t.value && h && (a(`after-${m}`), s("ANIMATION_END")),
          d.target === t.value && p === "none" && s("ANIMATION_END");
      },
      c = d => {
        d.target === t.value && (n.value = vs(t.value));
      },
      u = _t(
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
      f = _t(i, () => {
        const d = vs(t.value);
        n.value = i.value === "mounted" ? d : "none";
      });
    return (
      Fi(() => {
        u(), f();
      }),
      {
        isPresent: Se(() => ["mounted", "unmountSuspended"].includes(i.value)),
      }
    );
  }
  function vs(e) {
    return (e && getComputedStyle(e).animationName) || "none";
  }
  const nu = /* @__PURE__ */ me({
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
        const { present: o, forceMount: i } = Mt(e),
          s = Oe(),
          { isPresent: a } = eE(o, s);
        r({ present: a });
        let l = t.default({ present: a });
        l = tu(l || []);
        const c = Xr();
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
            ? xs(t.default({ present: a })[0], {
                ref: u => {
                  const f = Ui(u);
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
    [Ar, tE] = ro("DialogRoot"),
    rE = /* @__PURE__ */ me({
      __name: "DialogRoot",
      props: {
        open: { type: Boolean, default: void 0 },
        defaultOpen: { type: Boolean, default: !1 },
        modal: { type: Boolean, default: !0 },
      },
      emits: ["update:open"],
      setup(e, { emit: t }) {
        const r = e,
          n = Dm(r, "open", t, {
            defaultValue: r.defaultOpen,
            passive: r.open === void 0,
          }),
          o = Oe(),
          i = Oe(),
          { modal: s } = Mt(r);
        return (
          tE({
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
          (a, l) => de(a.$slots, "default", { open: U(n) })
        );
      },
    }),
    nE = /* @__PURE__ */ me({
      __name: "DialogTrigger",
      props: {
        asChild: { type: Boolean },
        as: { default: "button" },
      },
      setup(e) {
        const t = e,
          r = Ar(),
          { forwardRef: n, currentElement: o } = He();
        return (
          r.contentId || (r.contentId = Qs(void 0, "radix-vue-dialog-content")),
          Jr(() => {
            r.triggerElement.value = o.value;
          }),
          (i, s) => (
            fe(),
            $e(
              U(xt),
              gt(t, {
                ref: U(n),
                type: i.as === "button" ? "button" : void 0,
                "aria-haspopup": "dialog",
                "aria-expanded": U(r).open.value || !1,
                "aria-controls": U(r).open.value ? U(r).contentId : void 0,
                "data-state": U(r).open.value ? "open" : "closed",
                onClick: U(r).onOpenToggle,
              }),
              {
                default: se(() => [de(i.$slots, "default")]),
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
    jm = /* @__PURE__ */ me({
      __name: "Teleport",
      props: {
        to: { default: "body" },
        disabled: { type: Boolean },
        forceMount: { type: Boolean },
      },
      setup(e) {
        const t = Tw();
        return (r, n) =>
          U(t) || r.forceMount
            ? (fe(),
              $e(
                _b,
                {
                  key: 0,
                  to: r.to,
                  disabled: r.disabled,
                },
                [de(r.$slots, "default")],
                8,
                ["to", "disabled"]
              ))
            : $r("", !0);
      },
    }),
    oE = /* @__PURE__ */ me({
      __name: "DialogPortal",
      props: {
        to: {},
        disabled: { type: Boolean },
        forceMount: { type: Boolean },
      },
      setup(e) {
        const t = e;
        return (r, n) => (
          fe(),
          $e(
            U(jm),
            Do(eo(t)),
            {
              default: se(() => [de(r.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    iE = "dismissableLayer.pointerDownOutside",
    sE = "dismissableLayer.focusOutside";
  function Fm(e, t) {
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
  function aE(e, t) {
    var r;
    const n =
        ((r = t == null ? void 0 : t.value) == null
          ? void 0
          : r.ownerDocument) ??
        (globalThis == null ? void 0 : globalThis.document),
      o = Oe(!1),
      i = Oe(() => {});
    return (
      Qt(s => {
        if (!An) return;
        const a = async c => {
            const u = c.target;
            if (t != null && t.value) {
              if (Fm(t.value, u)) {
                o.value = !1;
                return;
              }
              if (c.target && !o.value) {
                let f = function () {
                  Cm(iE, e, d);
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
  function lE(e, t) {
    var r;
    const n =
        ((r = t == null ? void 0 : t.value) == null
          ? void 0
          : r.ownerDocument) ??
        (globalThis == null ? void 0 : globalThis.document),
      o = Oe(!1);
    return (
      Qt(i => {
        if (!An) return;
        const s = async a => {
          t != null &&
            t.value &&
            (await On(),
            !(!t.value || Fm(t.value, a.target)) &&
              a.target &&
              !o.value &&
              Cm(sE, e, { originalEvent: a }));
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
  const Pr = Ri({
      layersRoot: /* @__PURE__ */ new Set(),
      layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
      branches: /* @__PURE__ */ new Set(),
    }),
    Lm = /* @__PURE__ */ me({
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
          { forwardRef: o, currentElement: i } = He(),
          s = Se(() => {
            var h;
            return (
              ((h = i.value) == null ? void 0 : h.ownerDocument) ??
              globalThis.document
            );
          }),
          a = Se(() => Pr.layersRoot),
          l = Se(() => (i.value ? Array.from(a.value).indexOf(i.value) : -1)),
          c = Se(() => Pr.layersWithOutsidePointerEventsDisabled.size > 0),
          u = Se(() => {
            const h = Array.from(a.value),
              [m] = [...Pr.layersWithOutsidePointerEventsDisabled].slice(-1),
              y = h.indexOf(m);
            return l.value >= y;
          }),
          f = aE(async h => {
            const m = [...Pr.branches].some(y => y.contains(h.target));
            !u.value ||
              m ||
              (n("pointerDownOutside", h),
              n("interactOutside", h),
              await On(),
              h.defaultPrevented || n("dismiss"));
          }, i),
          d = lE(h => {
            [...Pr.branches].some(m => m.contains(h.target)) ||
              (n("focusOutside", h),
              n("interactOutside", h),
              h.defaultPrevented || n("dismiss"));
          }, i);
        Cw("Escape", h => {
          l.value === a.value.size - 1 &&
            (n("escapeKeyDown", h), h.defaultPrevented || n("dismiss"));
        });
        let p;
        return (
          Qt(h => {
            i.value &&
              (r.disableOutsidePointerEvents &&
                (Pr.layersWithOutsidePointerEventsDisabled.size === 0 &&
                  ((p = s.value.body.style.pointerEvents),
                  (s.value.body.style.pointerEvents = "none")),
                Pr.layersWithOutsidePointerEventsDisabled.add(i.value)),
              a.value.add(i.value),
              h(() => {
                r.disableOutsidePointerEvents &&
                  Pr.layersWithOutsidePointerEventsDisabled.size === 1 &&
                  (s.value.body.style.pointerEvents = p);
              }));
          }),
          Qt(h => {
            h(() => {
              i.value &&
                (a.value.delete(i.value),
                Pr.layersWithOutsidePointerEventsDisabled.delete(i.value));
            });
          }),
          (h, m) => (
            fe(),
            $e(
              U(xt),
              {
                ref: U(o),
                "as-child": h.asChild,
                as: h.as,
                "data-dismissable-layer": "",
                style: Qn({
                  pointerEvents: c.value ? (u.value ? "auto" : "none") : void 0,
                }),
                onFocusCapture: U(d).onFocusCapture,
                onBlurCapture: U(d).onBlurCapture,
                onPointerdownCapture: U(f).onPointerDownCapture,
              },
              {
                default: se(() => [de(h.$slots, "default")]),
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
    pl = "focusScope.autoFocusOnMount",
    hl = "focusScope.autoFocusOnUnmount",
    xd = { bubbles: !1, cancelable: !0 };
  function cE(e, { select: t = !1 } = {}) {
    const r = document.activeElement;
    for (const n of e)
      if ((cn(n, { select: t }), document.activeElement !== r)) return !0;
  }
  function uE(e) {
    const t = Vm(e),
      r = Dd(t, e),
      n = Dd(t.reverse(), e);
    return [r, n];
  }
  function Vm(e) {
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
  function Dd(e, t) {
    for (const r of e) if (!fE(r, { upTo: t })) return r;
  }
  function fE(e, { upTo: t }) {
    if (getComputedStyle(e).visibility === "hidden") return !0;
    for (; e; ) {
      if (t !== void 0 && e === t) return !1;
      if (getComputedStyle(e).display === "none") return !0;
      e = e.parentElement;
    }
    return !1;
  }
  function dE(e) {
    return e instanceof HTMLInputElement && "select" in e;
  }
  function cn(e, { select: t = !1 } = {}) {
    if (e && e.focus) {
      const r = document.activeElement;
      e.focus({ preventScroll: !0 }), e !== r && dE(e) && t && e.select();
    }
  }
  const pE = yw(() => Oe([]));
  function hE() {
    const e = pE();
    return {
      add(t) {
        const r = e.value[0];
        t !== r && (r == null || r.pause()),
          (e.value = Id(e.value, t)),
          e.value.unshift(t);
      },
      remove(t) {
        var r;
        (e.value = Id(e.value, t)), (r = e.value[0]) == null || r.resume();
      },
    };
  }
  function Id(e, t) {
    const r = [...e],
      n = r.indexOf(t);
    return n !== -1 && r.splice(n, 1), r;
  }
  function gE(e) {
    return e.filter(t => t.tagName !== "A");
  }
  const mE = /* @__PURE__ */ me({
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
        { currentRef: o, currentElement: i } = He(),
        s = Oe(null),
        a = hE(),
        l = Ri({
          paused: !1,
          pause() {
            this.paused = !0;
          },
          resume() {
            this.paused = !1;
          },
        });
      Qt(u => {
        if (!An) return;
        const f = i.value;
        if (!r.trapped) return;
        function d(y) {
          if (l.paused || !f) return;
          const g = y.target;
          f.contains(g) ? (s.value = g) : cn(s.value, { select: !0 });
        }
        function p(y) {
          if (l.paused || !f) return;
          const g = y.relatedTarget;
          g !== null && (f.contains(g) || cn(s.value, { select: !0 }));
        }
        function h(y) {
          f.contains(s.value) || cn(f);
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
        Qt(async u => {
          const f = i.value;
          if ((await On(), !f)) return;
          a.add(l);
          const d = document.activeElement;
          if (!f.contains(d)) {
            const p = new CustomEvent(pl, xd);
            f.addEventListener(pl, h => n("mountAutoFocus", h)),
              f.dispatchEvent(p),
              p.defaultPrevented ||
                (cE(gE(Vm(f)), {
                  select: !0,
                }),
                document.activeElement === d && cn(f));
          }
          u(() => {
            f.removeEventListener(pl, m => n("mountAutoFocus", m));
            const p = new CustomEvent(hl, xd),
              h = m => {
                n("unmountAutoFocus", m);
              };
            f.addEventListener(hl, h),
              f.dispatchEvent(p),
              setTimeout(() => {
                p.defaultPrevented || cn(d ?? document.body, { select: !0 }),
                  f.removeEventListener(hl, h),
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
            [h, m] = uE(p);
          h && m
            ? !u.shiftKey && d === m
              ? (u.preventDefault(), r.loop && cn(h, { select: !0 }))
              : u.shiftKey &&
                d === h &&
                (u.preventDefault(), r.loop && cn(m, { select: !0 }))
            : d === p && u.preventDefault();
        }
      }
      return (u, f) => (
        fe(),
        $e(
          U(xt),
          {
            ref_key: "currentRef",
            ref: o,
            tabindex: "-1",
            "as-child": u.asChild,
            as: u.as,
            onKeydown: c,
          },
          {
            default: se(() => [de(u.$slots, "default")]),
            _: 3,
          },
          8,
          ["as-child", "as"]
        )
      );
    },
  });
  function vE(e) {
    return e ? "open" : "closed";
  }
  const yE = "DialogTitle",
    _E = "DialogContent";
  function $E({
    titleName: e = yE,
    contentName: t = _E,
    componentLink: r = "dialog.html#title",
    titleId: n,
    descriptionId: o,
    contentElement: i,
  }) {
    const s = `Warning: \`${t}\` requires a \`${e}\` for the component to be accessible for screen reader users.

If you want to hide the \`${e}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://www.radix-vue.com/components/${r}`,
      a = `Warning: Missing \`Description\` or \`aria-describedby="undefined"\` for ${t}.`;
    Jr(() => {
      var l;
      document.getElementById(n) || console.warn(s);
      const c =
        (l = i.value) == null ? void 0 : l.getAttribute("aria-describedby");
      o && !c && (document.getElementById(o) || console.warn(a));
    });
  }
  const km = /* @__PURE__ */ me({
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
          o = Ar(),
          { forwardRef: i, currentElement: s } = He();
        return (
          o.titleId || (o.titleId = Qs(void 0, "radix-vue-dialog-title")),
          o.descriptionId ||
            (o.descriptionId = Qs(void 0, "radix-vue-dialog-description")),
          Jr(() => {
            (o.contentElement = s),
              document.activeElement !== document.body &&
                (o.triggerElement.value = document.activeElement);
          }),
          gw.NODE_ENV !== "production" &&
            $E({
              titleName: "DialogTitle",
              contentName: "DialogContent",
              componentLink: "dialog.html#title",
              titleId: o.titleId,
              descriptionId: o.descriptionId,
              contentElement: o.contentElement,
            }),
          (a, l) => (
            fe(),
            $e(
              U(mE),
              {
                "as-child": "",
                loop: "",
                trapped: r.trapFocus,
                onMountAutoFocus: l[5] || (l[5] = c => n("openAutoFocus", c)),
                onUnmountAutoFocus:
                  l[6] || (l[6] = c => n("closeAutoFocus", c)),
              },
              {
                default: se(() => [
                  Ve(
                    U(Lm),
                    gt(
                      {
                        id: U(o).contentId,
                        ref: U(i),
                        as: a.as,
                        "as-child": a.asChild,
                        "disable-outside-pointer-events":
                          a.disableOutsidePointerEvents,
                        role: "dialog",
                        "aria-describedby": U(o).descriptionId,
                        "aria-labelledby": U(o).titleId,
                        "data-state": U(vE)(U(o).open.value),
                      },
                      a.$attrs,
                      {
                        onDismiss: l[0] || (l[0] = c => U(o).onOpenChange(!1)),
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
                      default: se(() => [de(a.$slots, "default")]),
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
    bE = /* @__PURE__ */ me({
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
          o = Ar(),
          i = Ca(n),
          { forwardRef: s, currentElement: a } = He();
        return (
          Yw(a),
          (l, c) => (
            fe(),
            $e(
              km,
              gt(
                { ...r, ...U(i) },
                {
                  ref: U(s),
                  "trap-focus": U(o).open.value,
                  "disable-outside-pointer-events": !0,
                  onCloseAutoFocus:
                    c[0] ||
                    (c[0] = u => {
                      var f;
                      u.defaultPrevented ||
                        (u.preventDefault(),
                        (f = U(o).triggerElement.value) == null || f.focus());
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
                default: se(() => [de(l.$slots, "default")]),
                _: 3,
              },
              16,
              ["trap-focus"]
            )
          )
        );
      },
    }),
    wE = /* @__PURE__ */ me({
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
          n = Ca(t);
        He();
        const o = Ar(),
          i = Oe(!1),
          s = Oe(!1);
        return (a, l) => (
          fe(),
          $e(
            km,
            gt(
              { ...r, ...U(n) },
              {
                "trap-focus": !1,
                "disable-outside-pointer-events": !1,
                onCloseAutoFocus:
                  l[0] ||
                  (l[0] = c => {
                    var u;
                    c.defaultPrevented ||
                      (i.value ||
                        (u = U(o).triggerElement.value) == null ||
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
                    (u = U(o).triggerElement.value) != null &&
                      u.contains(f) &&
                      c.preventDefault(),
                      c.detail.originalEvent.type === "focusin" &&
                        s.value &&
                        c.preventDefault();
                  }),
              }
            ),
            {
              default: se(() => [de(a.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    EE = /* @__PURE__ */ me({
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
          o = Ar(),
          i = Ca(n),
          { forwardRef: s } = He();
        return (a, l) => (
          fe(),
          $e(
            U(nu),
            {
              present: a.forceMount || U(o).open.value,
            },
            {
              default: se(() => [
                U(o).modal.value
                  ? (fe(),
                    $e(
                      bE,
                      gt(
                        {
                          key: 0,
                          ref: U(s),
                        },
                        { ...r, ...U(i), ...a.$attrs }
                      ),
                      {
                        default: se(() => [de(a.$slots, "default")]),
                        _: 3,
                      },
                      16
                    ))
                  : (fe(),
                    $e(
                      wE,
                      gt(
                        {
                          key: 1,
                          ref: U(s),
                        },
                        { ...r, ...U(i), ...a.$attrs }
                      ),
                      {
                        default: se(() => [de(a.$slots, "default")]),
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
    OE = /* @__PURE__ */ me({
      __name: "DialogOverlayImpl",
      props: {
        asChild: { type: Boolean },
        as: {},
      },
      setup(e) {
        const t = Ar();
        return (
          Fw(!0),
          He(),
          (r, n) => (
            fe(),
            $e(
              U(xt),
              {
                as: r.as,
                "as-child": r.asChild,
                "data-state": U(t).open.value ? "open" : "closed",
                style: { "pointer-events": "auto" },
              },
              {
                default: se(() => [de(r.$slots, "default")]),
                _: 3,
              },
              8,
              ["as", "as-child", "data-state"]
            )
          )
        );
      },
    }),
    SE = /* @__PURE__ */ me({
      __name: "DialogOverlay",
      props: {
        forceMount: { type: Boolean },
        asChild: { type: Boolean },
        as: {},
      },
      setup(e) {
        const t = Ar(),
          { forwardRef: r } = He();
        return (n, o) => {
          var i;
          return (i = U(t)) != null && i.modal.value
            ? (fe(),
              $e(
                U(nu),
                {
                  key: 0,
                  present: n.forceMount || U(t).open.value,
                },
                {
                  default: se(() => [
                    Ve(
                      OE,
                      gt(n.$attrs, {
                        ref: U(r),
                        as: n.as,
                        "as-child": n.asChild,
                      }),
                      {
                        default: se(() => [de(n.$slots, "default")]),
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
            : $r("", !0);
        };
      },
    }),
    AE = /* @__PURE__ */ me({
      __name: "DialogClose",
      props: {
        asChild: { type: Boolean },
        as: { default: "button" },
      },
      setup(e) {
        const t = e;
        He();
        const r = Ar();
        return (n, o) => (
          fe(),
          $e(
            U(xt),
            gt(t, {
              type: n.as === "button" ? "button" : void 0,
              onClick: o[0] || (o[0] = i => U(r).onOpenChange(!1)),
            }),
            {
              default: se(() => [de(n.$slots, "default")]),
              _: 3,
            },
            16,
            ["type"]
          )
        );
      },
    }),
    NE = /* @__PURE__ */ me({
      __name: "DialogTitle",
      props: {
        asChild: { type: Boolean },
        as: { default: "h2" },
      },
      setup(e) {
        const t = e,
          r = Ar();
        return (
          He(),
          (n, o) => (
            fe(),
            $e(
              U(xt),
              gt(t, {
                id: U(r).titleId,
              }),
              {
                default: se(() => [de(n.$slots, "default")]),
                _: 3,
              },
              16,
              ["id"]
            )
          )
        );
      },
    }),
    PE = /* @__PURE__ */ me({
      __name: "DialogDescription",
      props: {
        asChild: { type: Boolean },
        as: { default: "p" },
      },
      setup(e) {
        const t = e;
        He();
        const r = Ar();
        return (n, o) => (
          fe(),
          $e(
            U(xt),
            gt(t, {
              id: U(r).descriptionId,
            }),
            {
              default: se(() => [de(n.$slots, "default")]),
              _: 3,
            },
            16,
            ["id"]
          )
        );
      },
    }),
    [Bm, CE] = ro("AvatarRoot"),
    TE = /* @__PURE__ */ me({
      __name: "AvatarRoot",
      props: {
        asChild: { type: Boolean },
        as: { default: "span" },
      },
      setup(e) {
        return (
          He(),
          CE({
            imageLoadingStatus: Oe("loading"),
          }),
          (t, r) => (
            fe(),
            $e(
              U(xt),
              {
                "as-child": t.asChild,
                as: t.as,
              },
              {
                default: se(() => [de(t.$slots, "default")]),
                _: 3,
              },
              8,
              ["as-child", "as"]
            )
          )
        );
      },
    });
  function xE(e) {
    const t = Oe("idle"),
      r = Oe(!1),
      n = o => () => {
        r.value && (t.value = o);
      };
    return (
      Jr(() => {
        (r.value = !0),
          _t(
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
      Fi(() => {
        r.value = !1;
      }),
      t
    );
  }
  const DE = /* @__PURE__ */ me({
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
          { src: o } = Mt(r);
        He();
        const i = Bm(),
          s = xE(o);
        return (
          _t(
            s,
            a => {
              n("loadingStatusChange", a),
                a !== "idle" && (i.imageLoadingStatus.value = a);
            },
            { immediate: !0 }
          ),
          (a, l) =>
            T$(
              (fe(),
              $e(
                U(xt),
                {
                  role: "img",
                  "as-child": a.asChild,
                  as: a.as,
                  src: U(o),
                },
                {
                  default: se(() => [de(a.$slots, "default")]),
                  _: 3,
                },
                8,
                ["as-child", "as", "src"]
              )),
              [[$m, U(s) === "loaded"]]
            )
        );
      },
    }),
    IE = /* @__PURE__ */ me({
      __name: "AvatarFallback",
      props: {
        delayMs: { default: 0 },
        asChild: { type: Boolean },
        as: { default: "span" },
      },
      setup(e) {
        const t = e,
          r = Bm();
        He();
        const n = Oe(!1);
        let o;
        return (
          _t(
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
            n.value && U(r).imageLoadingStatus.value !== "loaded"
              ? (fe(),
                $e(
                  U(xt),
                  {
                    key: 0,
                    "as-child": i.asChild,
                    as: i.as,
                  },
                  {
                    default: se(() => [de(i.$slots, "default")]),
                    _: 3,
                  },
                  8,
                  ["as-child", "as"]
                ))
              : $r("", !0)
        );
      },
    }),
    [zm, RE] = ro("PopperRoot"),
    ME = /* @__PURE__ */ me({
      __name: "PopperRoot",
      setup(e) {
        const t = Oe();
        return (
          RE({
            anchor: t,
            onAnchorChange: r => (t.value = r),
          }),
          (r, n) => de(r.$slots, "default")
        );
      },
    }),
    jE = /* @__PURE__ */ me({
      __name: "PopperAnchor",
      props: {
        element: {},
        asChild: { type: Boolean },
        as: {},
      },
      setup(e) {
        const t = e,
          { forwardRef: r, currentElement: n } = He(),
          o = zm();
        return (
          _t(n, () => {
            o.onAnchorChange(t.element ?? n.value);
          }),
          (i, s) => (
            fe(),
            $e(
              U(xt),
              {
                ref: U(r),
                as: i.as,
                "as-child": i.asChild,
              },
              {
                default: se(() => [de(i.$slots, "default")]),
                _: 3,
              },
              8,
              ["as", "as-child"]
            )
          )
        );
      },
    });
  function FE(e) {
    return e !== null;
  }
  function LE(e) {
    return {
      name: "transformOrigin",
      options: e,
      fn(t) {
        var r, n, o;
        const { placement: i, rects: s, middlewareData: a } = t,
          l = ((r = a.arrow) == null ? void 0 : r.centerOffset) !== 0,
          c = l ? 0 : e.arrowWidth,
          u = l ? 0 : e.arrowHeight,
          [f, d] = oc(i),
          p = { start: "0%", center: "50%", end: "100%" }[d],
          h = (((n = a.arrow) == null ? void 0 : n.x) ?? 0) + c / 2,
          m = (((o = a.arrow) == null ? void 0 : o.y) ?? 0) + u / 2;
        let y = "",
          g = "";
        return (
          f === "bottom"
            ? ((y = l ? p : `${h}px`), (g = `${-u}px`))
            : f === "top"
              ? ((y = l ? p : `${h}px`), (g = `${s.floating.height + u}px`))
              : f === "right"
                ? ((y = `${-u}px`), (g = l ? p : `${m}px`))
                : f === "left" &&
                  ((y = `${s.floating.width + u}px`), (g = l ? p : `${m}px`)),
          { data: { x: y, y: g } }
        );
      },
    };
  }
  function oc(e) {
    const [t, r = "center"] = e.split("-");
    return [t, r];
  }
  const VE = {
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
    [kE, BE] = ro("PopperContent"),
    zE = /* @__PURE__ */ me({
      inheritAttrs: !1,
      __name: "PopperContent",
      props: /* @__PURE__ */ q$(
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
          ...VE,
        }
      ),
      emits: ["placed"],
      setup(e, { emit: t }) {
        const r = e,
          n = t,
          o = zm(),
          { forwardRef: i, currentElement: s } = He(),
          a = Oe(),
          l = Oe(),
          { width: c, height: u } = Xw(l),
          f = Se(() => r.side + (r.align !== "center" ? `-${r.align}` : "")),
          d = Se(() =>
            typeof r.collisionPadding == "number"
              ? r.collisionPadding
              : { top: 0, right: 0, bottom: 0, left: 0, ...r.collisionPadding }
          ),
          p = Se(() =>
            Array.isArray(r.collisionBoundary)
              ? r.collisionBoundary
              : [r.collisionBoundary]
          ),
          h = Se(() => ({
            padding: d.value,
            boundary: p.value.filter(FE),
            // with `strategy: 'fixed'`, this is the only way to get it to respect boundaries
            altBoundary: p.value.length > 0,
          })),
          m = mw(() => [
            iw({
              mainAxis: r.sideOffset + u.value,
              alignmentAxis: r.alignOffset,
            }),
            r.prioritizePosition &&
              r.avoidCollisions &&
              Pd({
                ...h.value,
              }),
            r.avoidCollisions &&
              sw({
                mainAxis: !0,
                crossAxis: !!r.prioritizePosition,
                limiter: r.sticky === "partial" ? uw() : void 0,
                ...h.value,
              }),
            !r.prioritizePosition &&
              r.avoidCollisions &&
              Pd({
                ...h.value,
              }),
            aw({
              ...h.value,
              apply: ({
                elements: H,
                rects: ne,
                availableWidth: G,
                availableHeight: Ne,
              }) => {
                const { width: ue, height: Pe } = ne.reference,
                  be = H.floating.style;
                be.setProperty("--radix-popper-available-width", `${G}px`),
                  be.setProperty("--radix-popper-available-height", `${Ne}px`),
                  be.setProperty("--radix-popper-anchor-width", `${ue}px`),
                  be.setProperty("--radix-popper-anchor-height", `${Pe}px`);
              },
            }),
            l.value && pw({ element: l.value, padding: r.arrowPadding }),
            LE({
              arrowWidth: c.value,
              arrowHeight: u.value,
            }),
            r.hideWhenDetached &&
              lw({ strategy: "referenceHidden", ...h.value }),
          ]),
          {
            floatingStyles: y,
            placement: g,
            isPositioned: _,
            middlewareData: E,
          } = hw(o.anchor, a, {
            strategy: "fixed",
            placement: f,
            whileElementsMounted: (...H) =>
              ow(...H, {
                animationFrame: r.updatePositionStrategy === "always",
              }),
            middleware: m,
          }),
          S = Se(() => oc(g.value)[0]),
          I = Se(() => oc(g.value)[1]);
        Qt(() => {
          _.value && n("placed");
        });
        const A = Se(() => {
            var H;
            return (
              ((H = E.value.arrow) == null ? void 0 : H.centerOffset) !== 0
            );
          }),
          O = Oe("");
        Qt(() => {
          s.value && (O.value = window.getComputedStyle(s.value).zIndex);
        });
        const L = Se(() => {
            var H;
            return ((H = E.value.arrow) == null ? void 0 : H.x) ?? 0;
          }),
          z = Se(() => {
            var H;
            return ((H = E.value.arrow) == null ? void 0 : H.y) ?? 0;
          });
        return (
          BE({
            placedSide: S,
            onArrowChange: H => (l.value = H),
            arrowX: L,
            arrowY: z,
            shouldHideArrow: A,
          }),
          (H, ne) => {
            var G, Ne, ue;
            return (
              fe(),
              Sn(
                "div",
                {
                  ref_key: "floatingRef",
                  ref: a,
                  "data-radix-popper-content-wrapper": "",
                  style: Qn({
                    ...U(y),
                    transform: U(_) ? U(y).transform : "translate(0, -200%)",
                    // keep off the page when measuring
                    minWidth: "max-content",
                    zIndex: O.value,
                    "--radix-popper-transform-origin": [
                      (G = U(E).transformOrigin) == null ? void 0 : G.x,
                      (Ne = U(E).transformOrigin) == null ? void 0 : Ne.y,
                    ].join(" "),
                    // hide the content if using the hide middleware and should be hidden
                    // set visibility to hidden and disable pointer events so the UI behaves
                    // as if the PopperContent isn't there at all
                    ...(((ue = U(E).hide) == null
                      ? void 0
                      : ue.referenceHidden) && {
                      visibility: "hidden",
                      pointerEvents: "none",
                    }),
                  }),
                },
                [
                  Ve(
                    U(xt),
                    gt({ ref: U(i) }, H.$attrs, {
                      "as-child": r.asChild,
                      as: H.as,
                      "data-side": S.value,
                      "data-align": I.value,
                      style: {
                        // if the PopperContent hasn't been placed yet (not all measurements done)
                        // we prevent animations so that users's animation don't kick in too early referring wrong sides
                        animation: U(_) ? void 0 : "none",
                      },
                    }),
                    {
                      default: se(() => [de(H.$slots, "default")]),
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
    UE = /* @__PURE__ */ ar("polygon", { points: "0,0 30,0 15,10" }, null, -1),
    WE = /* @__PURE__ */ me({
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
          He(),
          (r, n) => (
            fe(),
            $e(
              U(xt),
              gt(t, {
                width: r.width,
                height: r.height,
                viewBox: r.asChild ? void 0 : "0 0 30 10",
                preserveAspectRatio: r.asChild ? void 0 : "none",
              }),
              {
                default: se(() => [de(r.$slots, "default", {}, () => [UE])]),
                _: 3,
              },
              16,
              ["width", "height", "viewBox", "preserveAspectRatio"]
            )
          )
        );
      },
    }),
    HE = {
      top: "bottom",
      right: "left",
      bottom: "top",
      left: "right",
    },
    KE = /* @__PURE__ */ me({
      inheritAttrs: !1,
      __name: "PopperArrow",
      props: {
        width: {},
        height: {},
        asChild: { type: Boolean },
        as: { default: "svg" },
      },
      setup(e) {
        const { forwardRef: t } = He(),
          r = kE(),
          n = Se(() => HE[r.placedSide.value]);
        return (o, i) => {
          var s, a, l, c;
          return (
            fe(),
            Sn(
              "span",
              {
                ref: u => {
                  U(r).onArrowChange(u);
                },
                style: Qn({
                  position: "absolute",
                  left:
                    (s = U(r).arrowX) != null && s.value
                      ? `${(a = U(r).arrowX) == null ? void 0 : a.value}px`
                      : void 0,
                  top:
                    (l = U(r).arrowY) != null && l.value
                      ? `${(c = U(r).arrowY) == null ? void 0 : c.value}px`
                      : void 0,
                  [n.value]: 0,
                  transformOrigin: {
                    top: "",
                    right: "0 0",
                    bottom: "center 0",
                    left: "100% 0",
                  }[U(r).placedSide.value],
                  transform: {
                    top: "translateY(100%)",
                    right: "translateY(50%) rotate(90deg) translateX(-50%)",
                    bottom: "rotate(180deg)",
                    left: "translateY(50%) rotate(-90deg) translateX(50%)",
                  }[U(r).placedSide.value],
                  visibility: U(r).shouldHideArrow.value ? "hidden" : void 0,
                }),
              },
              [
                Ve(
                  WE,
                  gt(o.$attrs, {
                    ref: U(t),
                    style: {
                      display: "block",
                    },
                    as: o.as,
                    "as-child": o.asChild,
                    width: o.width,
                    height: o.height,
                  }),
                  {
                    default: se(() => [de(o.$slots, "default")]),
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
    GE = /* @__PURE__ */ me({
      __name: "VisuallyHidden",
      props: {
        asChild: { type: Boolean },
        as: { default: "span" },
      },
      setup(e) {
        return (
          He(),
          (t, r) => (
            fe(),
            $e(
              U(xt),
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
                default: se(() => [de(t.$slots, "default")]),
                _: 3,
              },
              8,
              ["as", "as-child"]
            )
          )
        );
      },
    });
  function qE() {
    if (typeof matchMedia == "function")
      return matchMedia("(pointer:coarse)").matches ? "coarse" : "fine";
  }
  qE();
  const Um = "tooltip.open",
    [ou, YE] = ro("TooltipProvider"),
    JE = /* @__PURE__ */ me({
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
          } = Mt(t);
        He();
        const l = Oe(!0),
          c = Oe(!1),
          { start: u, stop: f } = Tm(
            () => {
              l.value = !0;
            },
            n,
            { immediate: !1 }
          );
        return (
          YE({
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
          (d, p) => de(d.$slots, "default")
        );
      },
    }),
    [Ta, XE] = ro("TooltipRoot"),
    ZE = /* @__PURE__ */ me({
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
        He();
        const o = ou(),
          i = Se(
            () => r.disableHoverableContent ?? o.disableHoverableContent.value
          ),
          s = Se(
            () => r.disableClosingTrigger ?? o.disableClosingTrigger.value
          ),
          a = Se(() => r.disabled ?? o.disabled.value),
          l = Se(() => r.delayDuration ?? o.delayDuration.value),
          c = Se(
            () => r.ignoreNonKeyboardFocus ?? o.ignoreNonKeyboardFocus.value
          ),
          u = Dm(r, "open", n, {
            defaultValue: r.defaultOpen,
            passive: r.open === void 0,
          });
        _t(u, E => {
          o.onClose &&
            (E
              ? (o.onOpen(), document.dispatchEvent(new CustomEvent(Um)))
              : o.onClose());
        });
        const f = Oe(!1),
          d = Oe(),
          p = Se(() =>
            u.value ? (f.value ? "delayed-open" : "instant-open") : "closed"
          ),
          { start: h, stop: m } = Tm(
            () => {
              (f.value = !0), (u.value = !0);
            },
            l,
            { immediate: !1 }
          );
        function y() {
          m(), (f.value = !1), (u.value = !0);
        }
        function g() {
          m(), (u.value = !1);
        }
        function _() {
          h();
        }
        return (
          XE({
            contentId: "",
            open: u,
            stateAttribute: p,
            trigger: d,
            onTriggerChange(E) {
              d.value = E;
            },
            onTriggerEnter() {
              o.isOpenDelayed.value ? _() : y();
            },
            onTriggerLeave() {
              i.value ? g() : m();
            },
            onOpen: y,
            onClose: g,
            disableHoverableContent: i,
            disableClosingTrigger: s,
            disabled: a,
            ignoreNonKeyboardFocus: c,
          }),
          (E, S) => (
            fe(),
            $e(U(ME), null, {
              default: se(() => [de(E.$slots, "default", { open: U(u) })]),
              _: 3,
            })
          )
        );
      },
    }),
    QE = /* @__PURE__ */ me({
      __name: "TooltipTrigger",
      props: {
        asChild: { type: Boolean },
        as: { default: "button" },
      },
      setup(e) {
        const t = e,
          r = Ta(),
          n = ou();
        r.contentId || (r.contentId = Qs(void 0, "radix-vue-tooltip-content"));
        const { forwardRef: o, currentElement: i } = He(),
          s = Oe(!1),
          a = Oe(!1),
          l = Se(() =>
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
        Jr(() => {
          r.onTriggerChange(i.value);
        });
        function c() {
          s.value = !1;
        }
        function u() {
          (s.value = !0),
            document.addEventListener("pointerup", c, { once: !0 });
        }
        function f(y) {
          y.pointerType !== "touch" &&
            !a.value &&
            !n.isPointerInTransitRef.value &&
            (r.onTriggerEnter(), (a.value = !0));
        }
        function d() {
          r.onTriggerLeave(), (a.value = !1);
        }
        function p(y) {
          var g, _;
          s.value ||
            (r.ignoreNonKeyboardFocus.value &&
              !(
                (_ = (g = y.target).matches) != null &&
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
        return (y, g) => (
          fe(),
          $e(
            U(jE),
            { "as-child": "" },
            {
              default: se(() => [
                Ve(
                  U(xt),
                  gt(
                    {
                      ref: U(o),
                      "aria-describedby": U(r).open.value
                        ? U(r).contentId
                        : void 0,
                      "data-state": U(r).stateAttribute.value,
                      as: y.as,
                      "as-child": t.asChild,
                      "data-grace-area-trigger": "",
                    },
                    z$(l.value)
                  ),
                  {
                    default: se(() => [de(y.$slots, "default")]),
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
    Wm = /* @__PURE__ */ me({
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
          o = Ta(),
          { forwardRef: i } = He(),
          s = K$(),
          a = Se(() => {
            var u;
            return (u = s.default) == null ? void 0 : u.call(s);
          }),
          l = Se(() => {
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
          c = Se(() => {
            const { ariaLabel: u, ...f } = r;
            return f;
          });
        return (
          Jr(() => {
            Zs(window, "scroll", u => {
              const f = u.target;
              f != null && f.contains(o.trigger.value) && o.onClose();
            }),
              Zs(window, Um, o.onClose);
          }),
          (u, f) => (
            fe(),
            $e(
              U(Lm),
              {
                "as-child": "",
                "disable-outside-pointer-events": !1,
                onEscapeKeyDown: f[0] || (f[0] = d => n("escapeKeyDown", d)),
                onPointerDownOutside:
                  f[1] ||
                  (f[1] = d => {
                    var p;
                    U(o).disableClosingTrigger.value &&
                      (p = U(o).trigger.value) != null &&
                      p.contains(d.target) &&
                      d.preventDefault(),
                      n("pointerDownOutside", d);
                  }),
                onFocusOutside: f[2] || (f[2] = _0(() => {}, ["prevent"])),
                onDismiss: f[3] || (f[3] = d => U(o).onClose()),
              },
              {
                default: se(() => [
                  Ve(
                    U(zE),
                    gt(
                      {
                        ref: U(i),
                        "data-state": U(o).stateAttribute.value,
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
                      default: se(() => [
                        de(u.$slots, "default"),
                        Ve(
                          U(GE),
                          {
                            id: U(o).contentId,
                            role: "tooltip",
                          },
                          {
                            default: se(() => [Ao(_n(l.value), 1)]),
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
    e1 = /* @__PURE__ */ me({
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
        const t = Rm(e),
          { forwardRef: r, currentElement: n } = He(),
          { trigger: o, onClose: i } = Ta(),
          s = ou(),
          { isPointerInTransit: a, onPointerExit: l } = Lw(o, n);
        return (
          (s.isPointerInTransitRef = a),
          l(() => {
            i();
          }),
          (c, u) => (
            fe(),
            $e(
              Wm,
              gt({ ref: U(r) }, U(t)),
              {
                default: se(() => [de(c.$slots, "default")]),
                _: 3,
              },
              16
            )
          )
        );
      },
    }),
    t1 = /* @__PURE__ */ me({
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
          o = Ta(),
          i = ru(r, n),
          { forwardRef: s } = He();
        return (a, l) => (
          fe(),
          $e(
            U(nu),
            {
              present: a.forceMount || U(o).open.value,
            },
            {
              default: se(() => [
                (fe(),
                $e(
                  B$(U(o).disableHoverableContent.value ? Wm : e1),
                  gt({ ref: U(s) }, U(i)),
                  {
                    default: se(() => [de(a.$slots, "default")]),
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
    r1 = /* @__PURE__ */ me({
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
          He(),
          (r, n) => (
            fe(),
            $e(
              U(KE),
              Do(eo(t)),
              {
                default: se(() => [de(r.$slots, "default")]),
                _: 3,
              },
              16
            )
          )
        );
      },
    }),
    n1 = /* @__PURE__ */ me({
      __name: "TooltipPortal",
      props: {
        to: {},
        disabled: { type: Boolean },
        forceMount: { type: Boolean },
      },
      setup(e) {
        const t = e;
        return (r, n) => (
          fe(),
          $e(
            U(jm),
            Do(eo(t)),
            {
              default: se(() => [de(r.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    iu = "/upwind.css",
    su = "-";
  function o1(e) {
    const t = s1(e),
      { conflictingClassGroups: r, conflictingClassGroupModifiers: n } = e;
    function o(s) {
      const a = s.split(su);
      return a[0] === "" && a.length !== 1 && a.shift(), Hm(a, t) || i1(s);
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
  function Hm(e, t) {
    var s;
    if (e.length === 0) return t.classGroupId;
    const r = e[0],
      n = t.nextPart.get(r),
      o = n ? Hm(e.slice(1), n) : void 0;
    if (o) return o;
    if (t.validators.length === 0) return;
    const i = e.join(su);
    return (s = t.validators.find(({ validator: a }) => a(i))) == null
      ? void 0
      : s.classGroupId;
  }
  const Rd = /^\[(.+)\]$/;
  function i1(e) {
    if (Rd.test(e)) {
      const t = Rd.exec(e)[1],
        r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
      if (r) return "arbitrary.." + r;
    }
  }
  function s1(e) {
    const { theme: t, prefix: r } = e,
      n = {
        nextPart: /* @__PURE__ */ new Map(),
        validators: [],
      };
    return (
      l1(Object.entries(e.classGroups), r).forEach(([i, s]) => {
        ic(s, n, i, t);
      }),
      n
    );
  }
  function ic(e, t, r, n) {
    e.forEach(o => {
      if (typeof o == "string") {
        const i = o === "" ? t : Md(t, o);
        i.classGroupId = r;
        return;
      }
      if (typeof o == "function") {
        if (a1(o)) {
          ic(o(n), t, r, n);
          return;
        }
        t.validators.push({
          validator: o,
          classGroupId: r,
        });
        return;
      }
      Object.entries(o).forEach(([i, s]) => {
        ic(s, Md(t, i), r, n);
      });
    });
  }
  function Md(e, t) {
    let r = e;
    return (
      t.split(su).forEach(n => {
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
  function a1(e) {
    return e.isThemeGetter;
  }
  function l1(e, t) {
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
  function c1(e) {
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
  const Km = "!";
  function u1(e) {
    const { separator: t, experimentalParseClassName: r } = e,
      n = t.length === 1,
      o = t[0],
      i = t.length;
    function s(a) {
      const l = [];
      let c = 0,
        u = 0,
        f;
      for (let y = 0; y < a.length; y++) {
        let g = a[y];
        if (c === 0) {
          if (g === o && (n || a.slice(y, y + i) === t)) {
            l.push(a.slice(u, y)), (u = y + i);
            continue;
          }
          if (g === "/") {
            f = y;
            continue;
          }
        }
        g === "[" ? c++ : g === "]" && c--;
      }
      const d = l.length === 0 ? a : a.substring(u),
        p = d.startsWith(Km),
        h = p ? d.substring(1) : d,
        m = f && f > u ? f - u : void 0;
      return {
        modifiers: l,
        hasImportantModifier: p,
        baseClassName: h,
        maybePostfixModifierPosition: m,
      };
    }
    return r
      ? function (l) {
          return r({
            className: l,
            parseClassName: s,
          });
        }
      : s;
  }
  function f1(e) {
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
  function d1(e) {
    return {
      cache: c1(e.cacheSize),
      parseClassName: u1(e),
      ...o1(e),
    };
  }
  const p1 = /\s+/;
  function h1(e, t) {
    const {
        parseClassName: r,
        getClassGroupId: n,
        getConflictingClassGroupIds: o,
      } = t,
      i = /* @__PURE__ */ new Set();
    return e
      .trim()
      .split(p1)
      .map(s => {
        const {
          modifiers: a,
          hasImportantModifier: l,
          baseClassName: c,
          maybePostfixModifierPosition: u,
        } = r(s);
        let f = !!u,
          d = n(f ? c.substring(0, u) : c);
        if (!d) {
          if (!f)
            return {
              isTailwindClass: !1,
              originalClassName: s,
            };
          if (((d = n(c)), !d))
            return {
              isTailwindClass: !1,
              originalClassName: s,
            };
          f = !1;
        }
        const p = f1(a).join(":");
        return {
          isTailwindClass: !0,
          modifierId: l ? p + Km : p,
          classGroupId: d,
          originalClassName: s,
          hasPostfixModifier: f,
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
  function g1() {
    let e = 0,
      t,
      r,
      n = "";
    for (; e < arguments.length; )
      (t = arguments[e++]) && (r = Gm(t)) && (n && (n += " "), (n += r));
    return n;
  }
  function Gm(e) {
    if (typeof e == "string") return e;
    let t,
      r = "";
    for (let n = 0; n < e.length; n++)
      e[n] && (t = Gm(e[n])) && (r && (r += " "), (r += t));
    return r;
  }
  function m1(e, ...t) {
    let r,
      n,
      o,
      i = s;
    function s(l) {
      const c = t.reduce((u, f) => f(u), e());
      return (r = d1(c)), (n = r.cache.get), (o = r.cache.set), (i = a), a(l);
    }
    function a(l) {
      const c = n(l);
      if (c) return c;
      const u = h1(l, r);
      return o(l, u), u;
    }
    return function () {
      return i(g1.apply(null, arguments));
    };
  }
  function Je(e) {
    const t = r => r[e] || [];
    return (t.isThemeGetter = !0), t;
  }
  const qm = /^\[(?:([a-z-]+):)?(.+)\]$/i,
    v1 = /^\d+\/\d+$/,
    y1 = /* @__PURE__ */ new Set(["px", "full", "screen"]),
    _1 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
    $1 =
      /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
    b1 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/,
    w1 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
    E1 =
      /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
  function Cr(e) {
    return Ln(e) || y1.has(e) || v1.test(e);
  }
  function on(e) {
    return Mo(e, "length", x1);
  }
  function Ln(e) {
    return !!e && !Number.isNaN(Number(e));
  }
  function ys(e) {
    return Mo(e, "number", Ln);
  }
  function ei(e) {
    return !!e && Number.isInteger(Number(e));
  }
  function O1(e) {
    return e.endsWith("%") && Ln(e.slice(0, -1));
  }
  function xe(e) {
    return qm.test(e);
  }
  function sn(e) {
    return _1.test(e);
  }
  const S1 = /* @__PURE__ */ new Set(["length", "size", "percentage"]);
  function A1(e) {
    return Mo(e, S1, Ym);
  }
  function N1(e) {
    return Mo(e, "position", Ym);
  }
  const P1 = /* @__PURE__ */ new Set(["image", "url"]);
  function C1(e) {
    return Mo(e, P1, I1);
  }
  function T1(e) {
    return Mo(e, "", D1);
  }
  function ti() {
    return !0;
  }
  function Mo(e, t, r) {
    const n = qm.exec(e);
    return n
      ? n[1]
        ? typeof t == "string"
          ? n[1] === t
          : t.has(n[1])
        : r(n[2])
      : !1;
  }
  function x1(e) {
    return $1.test(e) && !b1.test(e);
  }
  function Ym() {
    return !1;
  }
  function D1(e) {
    return w1.test(e);
  }
  function I1(e) {
    return E1.test(e);
  }
  function R1() {
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
      y = Je("margin"),
      g = Je("opacity"),
      _ = Je("padding"),
      E = Je("saturate"),
      S = Je("scale"),
      I = Je("sepia"),
      A = Je("skew"),
      O = Je("space"),
      L = Je("translate"),
      z = () => ["auto", "contain", "none"],
      H = () => ["auto", "hidden", "clip", "visible", "scroll"],
      ne = () => ["auto", xe, t],
      G = () => [xe, t],
      Ne = () => ["", Cr, on],
      ue = () => ["auto", Ln, xe],
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
      be = () => ["solid", "dashed", "dotted", "double", "none"],
      le = () => [
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
      ],
      ve = () => [
        "start",
        "end",
        "center",
        "between",
        "around",
        "evenly",
        "stretch",
      ],
      Ue = () => ["", "0", xe],
      ee = () => [
        "auto",
        "avoid",
        "all",
        "avoid-page",
        "page",
        "left",
        "right",
        "column",
      ],
      R = () => [Ln, ys],
      M = () => [Ln, xe];
    return {
      cacheSize: 500,
      separator: ":",
      theme: {
        colors: [ti],
        spacing: [Cr, on],
        blur: ["none", "", sn, xe],
        brightness: R(),
        borderColor: [e],
        borderRadius: ["none", "", "full", sn, xe],
        borderSpacing: G(),
        borderWidth: Ne(),
        contrast: R(),
        grayscale: Ue(),
        hueRotate: M(),
        invert: Ue(),
        gap: G(),
        gradientColorStops: [e],
        gradientColorStopPositions: [O1, on],
        inset: ne(),
        margin: ne(),
        opacity: R(),
        padding: G(),
        saturate: R(),
        scale: R(),
        sepia: Ue(),
        skew: M(),
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
            aspect: ["auto", "square", "video", xe],
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
            columns: [sn],
          },
        ],
        /**
         * Break After
         * @see https://tailwindcss.com/docs/break-after
         */
        "break-after": [
          {
            "break-after": ee(),
          },
        ],
        /**
         * Break Before
         * @see https://tailwindcss.com/docs/break-before
         */
        "break-before": [
          {
            "break-before": ee(),
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
            object: [...Pe(), xe],
          },
        ],
        /**
         * Overflow
         * @see https://tailwindcss.com/docs/overflow
         */
        overflow: [
          {
            overflow: H(),
          },
        ],
        /**
         * Overflow X
         * @see https://tailwindcss.com/docs/overflow
         */
        "overflow-x": [
          {
            "overflow-x": H(),
          },
        ],
        /**
         * Overflow Y
         * @see https://tailwindcss.com/docs/overflow
         */
        "overflow-y": [
          {
            "overflow-y": H(),
          },
        ],
        /**
         * Overscroll Behavior
         * @see https://tailwindcss.com/docs/overscroll-behavior
         */
        overscroll: [
          {
            overscroll: z(),
          },
        ],
        /**
         * Overscroll Behavior X
         * @see https://tailwindcss.com/docs/overscroll-behavior
         */
        "overscroll-x": [
          {
            "overscroll-x": z(),
          },
        ],
        /**
         * Overscroll Behavior Y
         * @see https://tailwindcss.com/docs/overscroll-behavior
         */
        "overscroll-y": [
          {
            "overscroll-y": z(),
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
            z: ["auto", ei, xe],
          },
        ],
        // Flexbox and Grid
        /**
         * Flex Basis
         * @see https://tailwindcss.com/docs/flex-basis
         */
        basis: [
          {
            basis: ne(),
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
            flex: ["1", "auto", "initial", "none", xe],
          },
        ],
        /**
         * Flex Grow
         * @see https://tailwindcss.com/docs/flex-grow
         */
        grow: [
          {
            grow: Ue(),
          },
        ],
        /**
         * Flex Shrink
         * @see https://tailwindcss.com/docs/flex-shrink
         */
        shrink: [
          {
            shrink: Ue(),
          },
        ],
        /**
         * Order
         * @see https://tailwindcss.com/docs/order
         */
        order: [
          {
            order: ["first", "last", "none", ei, xe],
          },
        ],
        /**
         * Grid Template Columns
         * @see https://tailwindcss.com/docs/grid-template-columns
         */
        "grid-cols": [
          {
            "grid-cols": [ti],
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
                span: ["full", ei, xe],
              },
              xe,
            ],
          },
        ],
        /**
         * Grid Column Start
         * @see https://tailwindcss.com/docs/grid-column
         */
        "col-start": [
          {
            "col-start": ue(),
          },
        ],
        /**
         * Grid Column End
         * @see https://tailwindcss.com/docs/grid-column
         */
        "col-end": [
          {
            "col-end": ue(),
          },
        ],
        /**
         * Grid Template Rows
         * @see https://tailwindcss.com/docs/grid-template-rows
         */
        "grid-rows": [
          {
            "grid-rows": [ti],
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
                span: [ei, xe],
              },
              xe,
            ],
          },
        ],
        /**
         * Grid Row Start
         * @see https://tailwindcss.com/docs/grid-row
         */
        "row-start": [
          {
            "row-start": ue(),
          },
        ],
        /**
         * Grid Row End
         * @see https://tailwindcss.com/docs/grid-row
         */
        "row-end": [
          {
            "row-end": ue(),
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
            "auto-cols": ["auto", "min", "max", "fr", xe],
          },
        ],
        /**
         * Grid Auto Rows
         * @see https://tailwindcss.com/docs/grid-auto-rows
         */
        "auto-rows": [
          {
            "auto-rows": ["auto", "min", "max", "fr", xe],
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
            justify: ["normal", ...ve()],
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
            content: ["normal", ...ve(), "baseline"],
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
            "place-content": [...ve(), "baseline"],
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
            m: [y],
          },
        ],
        /**
         * Margin X
         * @see https://tailwindcss.com/docs/margin
         */
        mx: [
          {
            mx: [y],
          },
        ],
        /**
         * Margin Y
         * @see https://tailwindcss.com/docs/margin
         */
        my: [
          {
            my: [y],
          },
        ],
        /**
         * Margin Start
         * @see https://tailwindcss.com/docs/margin
         */
        ms: [
          {
            ms: [y],
          },
        ],
        /**
         * Margin End
         * @see https://tailwindcss.com/docs/margin
         */
        me: [
          {
            me: [y],
          },
        ],
        /**
         * Margin Top
         * @see https://tailwindcss.com/docs/margin
         */
        mt: [
          {
            mt: [y],
          },
        ],
        /**
         * Margin Right
         * @see https://tailwindcss.com/docs/margin
         */
        mr: [
          {
            mr: [y],
          },
        ],
        /**
         * Margin Bottom
         * @see https://tailwindcss.com/docs/margin
         */
        mb: [
          {
            mb: [y],
          },
        ],
        /**
         * Margin Left
         * @see https://tailwindcss.com/docs/margin
         */
        ml: [
          {
            ml: [y],
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
            w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", xe, t],
          },
        ],
        /**
         * Min-Width
         * @see https://tailwindcss.com/docs/min-width
         */
        "min-w": [
          {
            "min-w": [xe, t, "min", "max", "fit"],
          },
        ],
        /**
         * Max-Width
         * @see https://tailwindcss.com/docs/max-width
         */
        "max-w": [
          {
            "max-w": [
              xe,
              t,
              "none",
              "full",
              "min",
              "max",
              "fit",
              "prose",
              {
                screen: [sn],
              },
              sn,
            ],
          },
        ],
        /**
         * Height
         * @see https://tailwindcss.com/docs/height
         */
        h: [
          {
            h: [xe, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"],
          },
        ],
        /**
         * Min-Height
         * @see https://tailwindcss.com/docs/min-height
         */
        "min-h": [
          {
            "min-h": [xe, t, "min", "max", "fit", "svh", "lvh", "dvh"],
          },
        ],
        /**
         * Max-Height
         * @see https://tailwindcss.com/docs/max-height
         */
        "max-h": [
          {
            "max-h": [xe, t, "min", "max", "fit", "svh", "lvh", "dvh"],
          },
        ],
        /**
         * Size
         * @see https://tailwindcss.com/docs/size
         */
        size: [
          {
            size: [xe, t, "auto", "min", "max", "fit"],
          },
        ],
        // Typography
        /**
         * Font Size
         * @see https://tailwindcss.com/docs/font-size
         */
        "font-size": [
          {
            text: ["base", sn, on],
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
              ys,
            ],
          },
        ],
        /**
         * Font Family
         * @see https://tailwindcss.com/docs/font-family
         */
        "font-family": [
          {
            font: [ti],
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
              xe,
            ],
          },
        ],
        /**
         * Line Clamp
         * @see https://tailwindcss.com/docs/line-clamp
         */
        "line-clamp": [
          {
            "line-clamp": ["none", Ln, ys],
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
              Cr,
              xe,
            ],
          },
        ],
        /**
         * List Style Image
         * @see https://tailwindcss.com/docs/list-style-image
         */
        "list-image": [
          {
            "list-image": ["none", xe],
          },
        ],
        /**
         * List Style Type
         * @see https://tailwindcss.com/docs/list-style-type
         */
        "list-style-type": [
          {
            list: ["none", "disc", "decimal", xe],
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
            decoration: [...be(), "wavy"],
          },
        ],
        /**
         * Text Decoration Thickness
         * @see https://tailwindcss.com/docs/text-decoration-thickness
         */
        "text-decoration-thickness": [
          {
            decoration: ["auto", "from-font", Cr, on],
          },
        ],
        /**
         * Text Underline Offset
         * @see https://tailwindcss.com/docs/text-underline-offset
         */
        "underline-offset": [
          {
            "underline-offset": ["auto", Cr, xe],
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
              xe,
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
            content: ["none", xe],
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
            bg: [...Pe(), N1],
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
            bg: ["auto", "cover", "contain", A1],
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
              C1,
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
            border: [...be(), "hidden"],
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
            divide: be(),
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
            outline: ["", ...be()],
          },
        ],
        /**
         * Outline Offset
         * @see https://tailwindcss.com/docs/outline-offset
         */
        "outline-offset": [
          {
            "outline-offset": [Cr, xe],
          },
        ],
        /**
         * Outline Width
         * @see https://tailwindcss.com/docs/outline-width
         */
        "outline-w": [
          {
            outline: [Cr, on],
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
            ring: Ne(),
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
            "ring-offset": [Cr, on],
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
            shadow: ["", "inner", "none", sn, T1],
          },
        ],
        /**
         * Box Shadow Color
         * @see https://tailwindcss.com/docs/box-shadow-color
         */
        "shadow-color": [
          {
            shadow: [ti],
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
            "mix-blend": [...le(), "plus-lighter", "plus-darker"],
          },
        ],
        /**
         * Background Blend Mode
         * @see https://tailwindcss.com/docs/background-blend-mode
         */
        "bg-blend": [
          {
            "bg-blend": le(),
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
            "drop-shadow": ["", "none", sn, xe],
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
            sepia: [I],
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
            "backdrop-sepia": [I],
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
              xe,
            ],
          },
        ],
        /**
         * Transition Duration
         * @see https://tailwindcss.com/docs/transition-duration
         */
        duration: [
          {
            duration: M(),
          },
        ],
        /**
         * Transition Timing Function
         * @see https://tailwindcss.com/docs/transition-timing-function
         */
        ease: [
          {
            ease: ["linear", "in", "out", "in-out", xe],
          },
        ],
        /**
         * Transition Delay
         * @see https://tailwindcss.com/docs/transition-delay
         */
        delay: [
          {
            delay: M(),
          },
        ],
        /**
         * Animation
         * @see https://tailwindcss.com/docs/animation
         */
        animate: [
          {
            animate: ["none", "spin", "ping", "pulse", "bounce", xe],
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
            scale: [S],
          },
        ],
        /**
         * Scale X
         * @see https://tailwindcss.com/docs/scale
         */
        "scale-x": [
          {
            "scale-x": [S],
          },
        ],
        /**
         * Scale Y
         * @see https://tailwindcss.com/docs/scale
         */
        "scale-y": [
          {
            "scale-y": [S],
          },
        ],
        /**
         * Rotate
         * @see https://tailwindcss.com/docs/rotate
         */
        rotate: [
          {
            rotate: [ei, xe],
          },
        ],
        /**
         * Translate X
         * @see https://tailwindcss.com/docs/translate
         */
        "translate-x": [
          {
            "translate-x": [L],
          },
        ],
        /**
         * Translate Y
         * @see https://tailwindcss.com/docs/translate
         */
        "translate-y": [
          {
            "translate-y": [L],
          },
        ],
        /**
         * Skew X
         * @see https://tailwindcss.com/docs/skew
         */
        "skew-x": [
          {
            "skew-x": [A],
          },
        ],
        /**
         * Skew Y
         * @see https://tailwindcss.com/docs/skew
         */
        "skew-y": [
          {
            "skew-y": [A],
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
              xe,
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
              xe,
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
            "will-change": ["auto", "scroll", "contents", "transform", xe],
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
            stroke: [Cr, on, ys],
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
  const M1 = /* @__PURE__ */ m1(R1);
  function Jm(e) {
    var t,
      r,
      n = "";
    if (typeof e == "string" || typeof e == "number") n += e;
    else if (typeof e == "object")
      if (Array.isArray(e)) {
        var o = e.length;
        for (t = 0; t < o; t++)
          e[t] && (r = Jm(e[t])) && (n && (n += " "), (n += r));
      } else for (r in e) e[r] && (n && (n += " "), (n += r));
    return n;
  }
  function j1() {
    for (var e, t, r = 0, n = "", o = arguments.length; r < o; r++)
      (e = arguments[r]) && (t = Jm(e)) && (n && (n += " "), (n += t));
    return n;
  }
  var Xm =
      typeof global == "object" && global && global.Object === Object && global,
    F1 = typeof self == "object" && self && self.Object === Object && self,
    Qr = Xm || F1 || Function("return this")(),
    Sr = Qr.Symbol,
    Zm = Object.prototype,
    L1 = Zm.hasOwnProperty,
    V1 = Zm.toString,
    ri = Sr ? Sr.toStringTag : void 0;
  function k1(e) {
    var t = L1.call(e, ri),
      r = e[ri];
    try {
      e[ri] = void 0;
      var n = !0;
    } catch {}
    var o = V1.call(e);
    return n && (t ? (e[ri] = r) : delete e[ri]), o;
  }
  var B1 = Object.prototype,
    z1 = B1.toString;
  function U1(e) {
    return z1.call(e);
  }
  var W1 = "[object Null]",
    H1 = "[object Undefined]",
    jd = Sr ? Sr.toStringTag : void 0;
  function no(e) {
    return e == null
      ? e === void 0
        ? H1
        : W1
      : jd && jd in Object(e)
        ? k1(e)
        : U1(e);
  }
  function Yn(e) {
    return e != null && typeof e == "object";
  }
  var K1 = "[object Symbol]";
  function xa(e) {
    return typeof e == "symbol" || (Yn(e) && no(e) == K1);
  }
  function Da(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length, o = Array(n); ++r < n; )
      o[r] = t(e[r], r, e);
    return o;
  }
  var Tt = Array.isArray,
    G1 = 1 / 0,
    Fd = Sr ? Sr.prototype : void 0,
    Ld = Fd ? Fd.toString : void 0;
  function Qm(e) {
    if (typeof e == "string") return e;
    if (Tt(e)) return Da(e, Qm) + "";
    if (xa(e)) return Ld ? Ld.call(e) : "";
    var t = e + "";
    return t == "0" && 1 / e == -G1 ? "-0" : t;
  }
  var q1 = /\s/;
  function Y1(e) {
    for (var t = e.length; t-- && q1.test(e.charAt(t)); );
    return t;
  }
  var J1 = /^\s+/;
  function X1(e) {
    return e && e.slice(0, Y1(e) + 1).replace(J1, "");
  }
  function ur(e) {
    var t = typeof e;
    return e != null && (t == "object" || t == "function");
  }
  var Vd = NaN,
    Z1 = /^[-+]0x[0-9a-f]+$/i,
    Q1 = /^0b[01]+$/i,
    eO = /^0o[0-7]+$/i,
    tO = parseInt;
  function rO(e) {
    if (typeof e == "number") return e;
    if (xa(e)) return Vd;
    if (ur(e)) {
      var t = typeof e.valueOf == "function" ? e.valueOf() : e;
      e = ur(t) ? t + "" : t;
    }
    if (typeof e != "string") return e === 0 ? e : +e;
    e = X1(e);
    var r = Q1.test(e);
    return r || eO.test(e) ? tO(e.slice(2), r ? 2 : 8) : Z1.test(e) ? Vd : +e;
  }
  var kd = 1 / 0,
    nO = 17976931348623157e292;
  function oO(e) {
    if (!e) return e === 0 ? e : 0;
    if (((e = rO(e)), e === kd || e === -kd)) {
      var t = e < 0 ? -1 : 1;
      return t * nO;
    }
    return e === e ? e : 0;
  }
  function ev(e) {
    var t = oO(e),
      r = t % 1;
    return t === t ? (r ? t - r : t) : 0;
  }
  function tv(e) {
    return e;
  }
  var iO = "[object AsyncFunction]",
    sO = "[object Function]",
    aO = "[object GeneratorFunction]",
    lO = "[object Proxy]";
  function au(e) {
    if (!ur(e)) return !1;
    var t = no(e);
    return t == sO || t == aO || t == iO || t == lO;
  }
  var gl = Qr["__core-js_shared__"],
    Bd = (function () {
      var e = /[^.]+$/.exec((gl && gl.keys && gl.keys.IE_PROTO) || "");
      return e ? "Symbol(src)_1." + e : "";
    })();
  function cO(e) {
    return !!Bd && Bd in e;
  }
  var uO = Function.prototype,
    fO = uO.toString;
  function oo(e) {
    if (e != null) {
      try {
        return fO.call(e);
      } catch {}
      try {
        return e + "";
      } catch {}
    }
    return "";
  }
  var dO = /[\\^$.*+?()[\]{}|]/g,
    pO = /^\[object .+?Constructor\]$/,
    hO = Function.prototype,
    gO = Object.prototype,
    mO = hO.toString,
    vO = gO.hasOwnProperty,
    yO = RegExp(
      "^" +
        mO
          .call(vO)
          .replace(dO, "\\$&")
          .replace(
            /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
            "$1.*?"
          ) +
        "$"
    );
  function _O(e) {
    if (!ur(e) || cO(e)) return !1;
    var t = au(e) ? yO : pO;
    return t.test(oo(e));
  }
  function $O(e, t) {
    return e == null ? void 0 : e[t];
  }
  function io(e, t) {
    var r = $O(e, t);
    return _O(r) ? r : void 0;
  }
  var sc = io(Qr, "WeakMap"),
    zd = (function () {
      try {
        var e = io(Object, "defineProperty");
        return e({}, "", {}), e;
      } catch {}
    })();
  function bO(e, t) {
    for (
      var r = -1, n = e == null ? 0 : e.length;
      ++r < n && t(e[r], r, e) !== !1;

    );
    return e;
  }
  function rv(e, t, r, n) {
    for (var o = e.length, i = r + -1; ++i < o; ) if (t(e[i], i, e)) return i;
    return -1;
  }
  function wO(e) {
    return e !== e;
  }
  function EO(e, t, r) {
    for (var n = r - 1, o = e.length; ++n < o; ) if (e[n] === t) return n;
    return -1;
  }
  function OO(e, t, r) {
    return t === t ? EO(e, t, r) : rv(e, wO, r);
  }
  var SO = 9007199254740991,
    AO = /^(?:0|[1-9]\d*)$/;
  function lu(e, t) {
    var r = typeof e;
    return (
      (t = t ?? SO),
      !!t &&
        (r == "number" || (r != "symbol" && AO.test(e))) &&
        e > -1 &&
        e % 1 == 0 &&
        e < t
    );
  }
  function nv(e, t, r) {
    t == "__proto__" && zd
      ? zd(e, t, {
          configurable: !0,
          enumerable: !0,
          value: r,
          writable: !0,
        })
      : (e[t] = r);
  }
  function cu(e, t) {
    return e === t || (e !== e && t !== t);
  }
  var NO = Object.prototype,
    PO = NO.hasOwnProperty;
  function CO(e, t, r) {
    var n = e[t];
    (!(PO.call(e, t) && cu(n, r)) || (r === void 0 && !(t in e))) &&
      nv(e, t, r);
  }
  var TO = 9007199254740991;
  function uu(e) {
    return typeof e == "number" && e > -1 && e % 1 == 0 && e <= TO;
  }
  function so(e) {
    return e != null && uu(e.length) && !au(e);
  }
  var xO = Object.prototype;
  function fu(e) {
    var t = e && e.constructor,
      r = (typeof t == "function" && t.prototype) || xO;
    return e === r;
  }
  function DO(e, t) {
    for (var r = -1, n = Array(e); ++r < e; ) n[r] = t(r);
    return n;
  }
  var IO = "[object Arguments]";
  function Ud(e) {
    return Yn(e) && no(e) == IO;
  }
  var ov = Object.prototype,
    RO = ov.hasOwnProperty,
    MO = ov.propertyIsEnumerable,
    Ia = Ud(
      /* @__PURE__ */ (function () {
        return arguments;
      })()
    )
      ? Ud
      : function (e) {
          return Yn(e) && RO.call(e, "callee") && !MO.call(e, "callee");
        };
  function jO() {
    return !1;
  }
  var iv = typeof Mr == "object" && Mr && !Mr.nodeType && Mr,
    Wd = iv && typeof jr == "object" && jr && !jr.nodeType && jr,
    FO = Wd && Wd.exports === iv,
    Hd = FO ? Qr.Buffer : void 0,
    LO = Hd ? Hd.isBuffer : void 0,
    ea = LO || jO,
    VO = "[object Arguments]",
    kO = "[object Array]",
    BO = "[object Boolean]",
    zO = "[object Date]",
    UO = "[object Error]",
    WO = "[object Function]",
    HO = "[object Map]",
    KO = "[object Number]",
    GO = "[object Object]",
    qO = "[object RegExp]",
    YO = "[object Set]",
    JO = "[object String]",
    XO = "[object WeakMap]",
    ZO = "[object ArrayBuffer]",
    QO = "[object DataView]",
    eS = "[object Float32Array]",
    tS = "[object Float64Array]",
    rS = "[object Int8Array]",
    nS = "[object Int16Array]",
    oS = "[object Int32Array]",
    iS = "[object Uint8Array]",
    sS = "[object Uint8ClampedArray]",
    aS = "[object Uint16Array]",
    lS = "[object Uint32Array]",
    Xe = {};
  Xe[eS] =
    Xe[tS] =
    Xe[rS] =
    Xe[nS] =
    Xe[oS] =
    Xe[iS] =
    Xe[sS] =
    Xe[aS] =
    Xe[lS] =
      !0;
  Xe[VO] =
    Xe[kO] =
    Xe[ZO] =
    Xe[BO] =
    Xe[QO] =
    Xe[zO] =
    Xe[UO] =
    Xe[WO] =
    Xe[HO] =
    Xe[KO] =
    Xe[GO] =
    Xe[qO] =
    Xe[YO] =
    Xe[JO] =
    Xe[XO] =
      !1;
  function cS(e) {
    return Yn(e) && uu(e.length) && !!Xe[no(e)];
  }
  function uS(e) {
    return function (t) {
      return e(t);
    };
  }
  var sv = typeof Mr == "object" && Mr && !Mr.nodeType && Mr,
    yi = sv && typeof jr == "object" && jr && !jr.nodeType && jr,
    fS = yi && yi.exports === sv,
    ml = fS && Xm.process,
    Kd = (function () {
      try {
        var e = yi && yi.require && yi.require("util").types;
        return e || (ml && ml.binding && ml.binding("util"));
      } catch {}
    })(),
    Gd = Kd && Kd.isTypedArray,
    du = Gd ? uS(Gd) : cS,
    dS = Object.prototype,
    pS = dS.hasOwnProperty;
  function av(e, t) {
    var r = Tt(e),
      n = !r && Ia(e),
      o = !r && !n && ea(e),
      i = !r && !n && !o && du(e),
      s = r || n || o || i,
      a = s ? DO(e.length, String) : [],
      l = a.length;
    for (var c in e)
      (t || pS.call(e, c)) &&
        !(
          s && // Safari 9 has enumerable `arguments.length` in strict mode.
          (c == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            (o && (c == "offset" || c == "parent")) || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            (i && (c == "buffer" || c == "byteLength" || c == "byteOffset")) || // Skip index properties.
            lu(c, l))
        ) &&
        a.push(c);
    return a;
  }
  function lv(e, t) {
    return function (r) {
      return e(t(r));
    };
  }
  var hS = lv(Object.keys, Object),
    gS = Object.prototype,
    mS = gS.hasOwnProperty;
  function cv(e) {
    if (!fu(e)) return hS(e);
    var t = [];
    for (var r in Object(e)) mS.call(e, r) && r != "constructor" && t.push(r);
    return t;
  }
  function Wi(e) {
    return so(e) ? av(e) : cv(e);
  }
  function vS(e) {
    var t = [];
    if (e != null) for (var r in Object(e)) t.push(r);
    return t;
  }
  var yS = Object.prototype,
    _S = yS.hasOwnProperty;
  function $S(e) {
    if (!ur(e)) return vS(e);
    var t = fu(e),
      r = [];
    for (var n in e) (n == "constructor" && (t || !_S.call(e, n))) || r.push(n);
    return r;
  }
  function bS(e) {
    return so(e) ? av(e, !0) : $S(e);
  }
  var wS = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    ES = /^\w*$/;
  function pu(e, t) {
    if (Tt(e)) return !1;
    var r = typeof e;
    return r == "number" ||
      r == "symbol" ||
      r == "boolean" ||
      e == null ||
      xa(e)
      ? !0
      : ES.test(e) || !wS.test(e) || (t != null && e in Object(t));
  }
  var xi = io(Object, "create");
  function OS() {
    (this.__data__ = xi ? xi(null) : {}), (this.size = 0);
  }
  function SS(e) {
    var t = this.has(e) && delete this.__data__[e];
    return (this.size -= t ? 1 : 0), t;
  }
  var AS = "__lodash_hash_undefined__",
    NS = Object.prototype,
    PS = NS.hasOwnProperty;
  function CS(e) {
    var t = this.__data__;
    if (xi) {
      var r = t[e];
      return r === AS ? void 0 : r;
    }
    return PS.call(t, e) ? t[e] : void 0;
  }
  var TS = Object.prototype,
    xS = TS.hasOwnProperty;
  function DS(e) {
    var t = this.__data__;
    return xi ? t[e] !== void 0 : xS.call(t, e);
  }
  var IS = "__lodash_hash_undefined__";
  function RS(e, t) {
    var r = this.__data__;
    return (
      (this.size += this.has(e) ? 0 : 1),
      (r[e] = xi && t === void 0 ? IS : t),
      this
    );
  }
  function Jn(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  Jn.prototype.clear = OS;
  Jn.prototype.delete = SS;
  Jn.prototype.get = CS;
  Jn.prototype.has = DS;
  Jn.prototype.set = RS;
  function MS() {
    (this.__data__ = []), (this.size = 0);
  }
  function Ra(e, t) {
    for (var r = e.length; r--; ) if (cu(e[r][0], t)) return r;
    return -1;
  }
  var jS = Array.prototype,
    FS = jS.splice;
  function LS(e) {
    var t = this.__data__,
      r = Ra(t, e);
    if (r < 0) return !1;
    var n = t.length - 1;
    return r == n ? t.pop() : FS.call(t, r, 1), --this.size, !0;
  }
  function VS(e) {
    var t = this.__data__,
      r = Ra(t, e);
    return r < 0 ? void 0 : t[r][1];
  }
  function kS(e) {
    return Ra(this.__data__, e) > -1;
  }
  function BS(e, t) {
    var r = this.__data__,
      n = Ra(r, e);
    return n < 0 ? (++this.size, r.push([e, t])) : (r[n][1] = t), this;
  }
  function en(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  en.prototype.clear = MS;
  en.prototype.delete = LS;
  en.prototype.get = VS;
  en.prototype.has = kS;
  en.prototype.set = BS;
  var Di = io(Qr, "Map");
  function zS() {
    (this.size = 0),
      (this.__data__ = {
        hash: new Jn(),
        map: new (Di || en)(),
        string: new Jn(),
      });
  }
  function US(e) {
    var t = typeof e;
    return t == "string" || t == "number" || t == "symbol" || t == "boolean"
      ? e !== "__proto__"
      : e === null;
  }
  function Ma(e, t) {
    var r = e.__data__;
    return US(t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
  }
  function WS(e) {
    var t = Ma(this, e).delete(e);
    return (this.size -= t ? 1 : 0), t;
  }
  function HS(e) {
    return Ma(this, e).get(e);
  }
  function KS(e) {
    return Ma(this, e).has(e);
  }
  function GS(e, t) {
    var r = Ma(this, e),
      n = r.size;
    return r.set(e, t), (this.size += r.size == n ? 0 : 1), this;
  }
  function tn(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  tn.prototype.clear = zS;
  tn.prototype.delete = WS;
  tn.prototype.get = HS;
  tn.prototype.has = KS;
  tn.prototype.set = GS;
  var qS = "Expected a function";
  function hu(e, t) {
    if (typeof e != "function" || (t != null && typeof t != "function"))
      throw new TypeError(qS);
    var r = function () {
      var n = arguments,
        o = t ? t.apply(this, n) : n[0],
        i = r.cache;
      if (i.has(o)) return i.get(o);
      var s = e.apply(this, n);
      return (r.cache = i.set(o, s) || i), s;
    };
    return (r.cache = new (hu.Cache || tn)()), r;
  }
  hu.Cache = tn;
  var YS = 500;
  function JS(e) {
    var t = hu(e, function (n) {
        return r.size === YS && r.clear(), n;
      }),
      r = t.cache;
    return t;
  }
  var XS =
      /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
    ZS = /\\(\\)?/g,
    QS = JS(function (e) {
      var t = [];
      return (
        e.charCodeAt(0) === 46 && t.push(""),
        e.replace(XS, function (r, n, o, i) {
          t.push(o ? i.replace(ZS, "$1") : n || r);
        }),
        t
      );
    });
  function eA(e) {
    return e == null ? "" : Qm(e);
  }
  function ja(e, t) {
    return Tt(e) ? e : pu(e, t) ? [e] : QS(eA(e));
  }
  var tA = 1 / 0;
  function Hi(e) {
    if (typeof e == "string" || xa(e)) return e;
    var t = e + "";
    return t == "0" && 1 / e == -tA ? "-0" : t;
  }
  function gu(e, t) {
    t = ja(t, e);
    for (var r = 0, n = t.length; e != null && r < n; ) e = e[Hi(t[r++])];
    return r && r == n ? e : void 0;
  }
  function mu(e, t, r) {
    var n = e == null ? void 0 : gu(e, t);
    return n === void 0 ? r : n;
  }
  function uv(e, t) {
    for (var r = -1, n = t.length, o = e.length; ++r < n; ) e[o + r] = t[r];
    return e;
  }
  var qd = Sr ? Sr.isConcatSpreadable : void 0;
  function rA(e) {
    return Tt(e) || Ia(e) || !!(qd && e && e[qd]);
  }
  function fv(e, t, r, n, o) {
    var i = -1,
      s = e.length;
    for (r || (r = rA), o || (o = []); ++i < s; ) {
      var a = e[i];
      r(a) ? fv(a, t - 1, r, n, o) : (o[o.length] = a);
    }
    return o;
  }
  var nA = lv(Object.getPrototypeOf, Object);
  function oA(e, t, r, n) {
    var o = -1,
      i = e == null ? 0 : e.length;
    for (n && i && (r = e[++o]); ++o < i; ) r = t(r, e[o], o, e);
    return r;
  }
  function iA() {
    (this.__data__ = new en()), (this.size = 0);
  }
  function sA(e) {
    var t = this.__data__,
      r = t.delete(e);
    return (this.size = t.size), r;
  }
  function aA(e) {
    return this.__data__.get(e);
  }
  function lA(e) {
    return this.__data__.has(e);
  }
  var cA = 200;
  function uA(e, t) {
    var r = this.__data__;
    if (r instanceof en) {
      var n = r.__data__;
      if (!Di || n.length < cA - 1)
        return n.push([e, t]), (this.size = ++r.size), this;
      r = this.__data__ = new tn(n);
    }
    return r.set(e, t), (this.size = r.size), this;
  }
  function kr(e) {
    var t = (this.__data__ = new en(e));
    this.size = t.size;
  }
  kr.prototype.clear = iA;
  kr.prototype.delete = sA;
  kr.prototype.get = aA;
  kr.prototype.has = lA;
  kr.prototype.set = uA;
  function fA(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length, o = 0, i = []; ++r < n; ) {
      var s = e[r];
      t(s, r, e) && (i[o++] = s);
    }
    return i;
  }
  function dv() {
    return [];
  }
  var dA = Object.prototype,
    pA = dA.propertyIsEnumerable,
    Yd = Object.getOwnPropertySymbols,
    pv = Yd
      ? function (e) {
          return e == null
            ? []
            : ((e = Object(e)),
              fA(Yd(e), function (t) {
                return pA.call(e, t);
              }));
        }
      : dv,
    hA = Object.getOwnPropertySymbols,
    gA = hA
      ? function (e) {
          for (var t = []; e; ) uv(t, pv(e)), (e = nA(e));
          return t;
        }
      : dv;
  function hv(e, t, r) {
    var n = t(e);
    return Tt(e) ? n : uv(n, r(e));
  }
  function Jd(e) {
    return hv(e, Wi, pv);
  }
  function mA(e) {
    return hv(e, bS, gA);
  }
  var ac = io(Qr, "DataView"),
    lc = io(Qr, "Promise"),
    cc = io(Qr, "Set"),
    Xd = "[object Map]",
    vA = "[object Object]",
    Zd = "[object Promise]",
    Qd = "[object Set]",
    ep = "[object WeakMap]",
    tp = "[object DataView]",
    yA = oo(ac),
    _A = oo(Di),
    $A = oo(lc),
    bA = oo(cc),
    wA = oo(sc),
    Rr = no;
  ((ac && Rr(new ac(new ArrayBuffer(1))) != tp) ||
    (Di && Rr(new Di()) != Xd) ||
    (lc && Rr(lc.resolve()) != Zd) ||
    (cc && Rr(new cc()) != Qd) ||
    (sc && Rr(new sc()) != ep)) &&
    (Rr = function (e) {
      var t = no(e),
        r = t == vA ? e.constructor : void 0,
        n = r ? oo(r) : "";
      if (n)
        switch (n) {
          case yA:
            return tp;
          case _A:
            return Xd;
          case $A:
            return Zd;
          case bA:
            return Qd;
          case wA:
            return ep;
        }
      return t;
    });
  var rp = Qr.Uint8Array,
    EA = "__lodash_hash_undefined__";
  function OA(e) {
    return this.__data__.set(e, EA), this;
  }
  function SA(e) {
    return this.__data__.has(e);
  }
  function ta(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.__data__ = new tn(); ++t < r; ) this.add(e[t]);
  }
  ta.prototype.add = ta.prototype.push = OA;
  ta.prototype.has = SA;
  function AA(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length; ++r < n; )
      if (t(e[r], r, e)) return !0;
    return !1;
  }
  function NA(e, t) {
    return e.has(t);
  }
  var PA = 1,
    CA = 2;
  function gv(e, t, r, n, o, i) {
    var s = r & PA,
      a = e.length,
      l = t.length;
    if (a != l && !(s && l > a)) return !1;
    var c = i.get(e),
      u = i.get(t);
    if (c && u) return c == t && u == e;
    var f = -1,
      d = !0,
      p = r & CA ? new ta() : void 0;
    for (i.set(e, t), i.set(t, e); ++f < a; ) {
      var h = e[f],
        m = t[f];
      if (n) var y = s ? n(m, h, f, t, e, i) : n(h, m, f, e, t, i);
      if (y !== void 0) {
        if (y) continue;
        d = !1;
        break;
      }
      if (p) {
        if (
          !AA(t, function (g, _) {
            if (!NA(p, _) && (h === g || o(h, g, r, n, i))) return p.push(_);
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
  function TA(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (n, o) {
        r[++t] = [o, n];
      }),
      r
    );
  }
  function xA(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (n) {
        r[++t] = n;
      }),
      r
    );
  }
  var DA = 1,
    IA = 2,
    RA = "[object Boolean]",
    MA = "[object Date]",
    jA = "[object Error]",
    FA = "[object Map]",
    LA = "[object Number]",
    VA = "[object RegExp]",
    kA = "[object Set]",
    BA = "[object String]",
    zA = "[object Symbol]",
    UA = "[object ArrayBuffer]",
    WA = "[object DataView]",
    np = Sr ? Sr.prototype : void 0,
    vl = np ? np.valueOf : void 0;
  function HA(e, t, r, n, o, i, s) {
    switch (r) {
      case WA:
        if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
          return !1;
        (e = e.buffer), (t = t.buffer);
      case UA:
        return !(e.byteLength != t.byteLength || !i(new rp(e), new rp(t)));
      case RA:
      case MA:
      case LA:
        return cu(+e, +t);
      case jA:
        return e.name == t.name && e.message == t.message;
      case VA:
      case BA:
        return e == t + "";
      case FA:
        var a = TA;
      case kA:
        var l = n & DA;
        if ((a || (a = xA), e.size != t.size && !l)) return !1;
        var c = s.get(e);
        if (c) return c == t;
        (n |= IA), s.set(e, t);
        var u = gv(a(e), a(t), n, o, i, s);
        return s.delete(e), u;
      case zA:
        if (vl) return vl.call(e) == vl.call(t);
    }
    return !1;
  }
  var KA = 1,
    GA = Object.prototype,
    qA = GA.hasOwnProperty;
  function YA(e, t, r, n, o, i) {
    var s = r & KA,
      a = Jd(e),
      l = a.length,
      c = Jd(t),
      u = c.length;
    if (l != u && !s) return !1;
    for (var f = l; f--; ) {
      var d = a[f];
      if (!(s ? d in t : qA.call(t, d))) return !1;
    }
    var p = i.get(e),
      h = i.get(t);
    if (p && h) return p == t && h == e;
    var m = !0;
    i.set(e, t), i.set(t, e);
    for (var y = s; ++f < l; ) {
      d = a[f];
      var g = e[d],
        _ = t[d];
      if (n) var E = s ? n(_, g, d, t, e, i) : n(g, _, d, e, t, i);
      if (!(E === void 0 ? g === _ || o(g, _, r, n, i) : E)) {
        m = !1;
        break;
      }
      y || (y = d == "constructor");
    }
    if (m && !y) {
      var S = e.constructor,
        I = t.constructor;
      S != I &&
        "constructor" in e &&
        "constructor" in t &&
        !(
          typeof S == "function" &&
          S instanceof S &&
          typeof I == "function" &&
          I instanceof I
        ) &&
        (m = !1);
    }
    return i.delete(e), i.delete(t), m;
  }
  var JA = 1,
    op = "[object Arguments]",
    ip = "[object Array]",
    _s = "[object Object]",
    XA = Object.prototype,
    sp = XA.hasOwnProperty;
  function ZA(e, t, r, n, o, i) {
    var s = Tt(e),
      a = Tt(t),
      l = s ? ip : Rr(e),
      c = a ? ip : Rr(t);
    (l = l == op ? _s : l), (c = c == op ? _s : c);
    var u = l == _s,
      f = c == _s,
      d = l == c;
    if (d && ea(e)) {
      if (!ea(t)) return !1;
      (s = !0), (u = !1);
    }
    if (d && !u)
      return (
        i || (i = new kr()),
        s || du(e) ? gv(e, t, r, n, o, i) : HA(e, t, l, r, n, o, i)
      );
    if (!(r & JA)) {
      var p = u && sp.call(e, "__wrapped__"),
        h = f && sp.call(t, "__wrapped__");
      if (p || h) {
        var m = p ? e.value() : e,
          y = h ? t.value() : t;
        return i || (i = new kr()), o(m, y, r, n, i);
      }
    }
    return d ? (i || (i = new kr()), YA(e, t, r, n, o, i)) : !1;
  }
  function vu(e, t, r, n, o) {
    return e === t
      ? !0
      : e == null || t == null || (!Yn(e) && !Yn(t))
        ? e !== e && t !== t
        : ZA(e, t, r, n, vu, o);
  }
  var QA = 1,
    eN = 2;
  function tN(e, t, r, n) {
    var o = r.length,
      i = o;
    if (e == null) return !i;
    for (e = Object(e); o--; ) {
      var s = r[o];
      if (s[2] ? s[1] !== e[s[0]] : !(s[0] in e)) return !1;
    }
    for (; ++o < i; ) {
      s = r[o];
      var a = s[0],
        l = e[a],
        c = s[1];
      if (s[2]) {
        if (l === void 0 && !(a in e)) return !1;
      } else {
        var u = new kr(),
          f;
        if (!(f === void 0 ? vu(c, l, QA | eN, n, u) : f)) return !1;
      }
    }
    return !0;
  }
  function mv(e) {
    return e === e && !ur(e);
  }
  function rN(e) {
    for (var t = Wi(e), r = t.length; r--; ) {
      var n = t[r],
        o = e[n];
      t[r] = [n, o, mv(o)];
    }
    return t;
  }
  function vv(e, t) {
    return function (r) {
      return r == null ? !1 : r[e] === t && (t !== void 0 || e in Object(r));
    };
  }
  function nN(e) {
    var t = rN(e);
    return t.length == 1 && t[0][2]
      ? vv(t[0][0], t[0][1])
      : function (r) {
          return r === e || tN(r, e, t);
        };
  }
  function oN(e, t) {
    return e != null && t in Object(e);
  }
  function iN(e, t, r) {
    t = ja(t, e);
    for (var n = -1, o = t.length, i = !1; ++n < o; ) {
      var s = Hi(t[n]);
      if (!(i = e != null && r(e, s))) break;
      e = e[s];
    }
    return i || ++n != o
      ? i
      : ((o = e == null ? 0 : e.length),
        !!o && uu(o) && lu(s, o) && (Tt(e) || Ia(e)));
  }
  function sN(e, t) {
    return e != null && iN(e, t, oN);
  }
  var aN = 1,
    lN = 2;
  function cN(e, t) {
    return pu(e) && mv(t)
      ? vv(Hi(e), t)
      : function (r) {
          var n = mu(r, e);
          return n === void 0 && n === t ? sN(r, e) : vu(t, n, aN | lN);
        };
  }
  function uN(e) {
    return function (t) {
      return t == null ? void 0 : t[e];
    };
  }
  function fN(e) {
    return function (t) {
      return gu(t, e);
    };
  }
  function dN(e) {
    return pu(e) ? uN(Hi(e)) : fN(e);
  }
  function ao(e) {
    return typeof e == "function"
      ? e
      : e == null
        ? tv
        : typeof e == "object"
          ? Tt(e)
            ? cN(e[0], e[1])
            : nN(e)
          : dN(e);
  }
  function pN(e) {
    return function (t, r, n) {
      for (var o = -1, i = Object(t), s = n(t), a = s.length; a--; ) {
        var l = s[++o];
        if (r(i[l], l, i) === !1) break;
      }
      return t;
    };
  }
  var hN = pN();
  function yv(e, t) {
    return e && hN(e, t, Wi);
  }
  function gN(e, t) {
    return function (r, n) {
      if (r == null) return r;
      if (!so(r)) return e(r, n);
      for (
        var o = r.length, i = -1, s = Object(r);
        ++i < o && n(s[i], i, s) !== !1;

      );
      return r;
    };
  }
  var yu = gN(yv);
  function mN(e) {
    return typeof e == "function" ? e : tv;
  }
  function vN(e, t) {
    var r = Tt(e) ? bO : yu;
    return r(e, mN(t));
  }
  function yN(e) {
    return function (t, r, n) {
      var o = Object(t);
      if (!so(t)) {
        var i = ao(r);
        (t = Wi(t)),
          (r = function (a) {
            return i(o[a], a, o);
          });
      }
      var s = e(t, r, n);
      return s > -1 ? o[i ? t[s] : s] : void 0;
    };
  }
  var _N = Math.max;
  function $N(e, t, r) {
    var n = e == null ? 0 : e.length;
    if (!n) return -1;
    var o = r == null ? 0 : ev(r);
    return o < 0 && (o = _N(n + o, 0)), rv(e, ao(t), o);
  }
  var bN = yN($N);
  function wN(e, t) {
    var r = -1,
      n = so(e) ? Array(e.length) : [];
    return (
      yu(e, function (o, i, s) {
        n[++r] = t(o, i, s);
      }),
      n
    );
  }
  function ap(e, t) {
    var r = Tt(e) ? Da : wN;
    return r(e, ao(t));
  }
  var EN = 1 / 0;
  function ON(e) {
    var t = e == null ? 0 : e.length;
    return t ? fv(e, EN) : [];
  }
  var SN = "[object String]";
  function _v(e) {
    return typeof e == "string" || (!Tt(e) && Yn(e) && no(e) == SN);
  }
  function AN(e, t) {
    return Da(t, function (r) {
      return e[r];
    });
  }
  function NN(e) {
    return e == null ? [] : AN(e, Wi(e));
  }
  var PN = Math.max;
  function CN(e, t, r, n) {
    (e = so(e) ? e : NN(e)), (r = r && !n ? ev(r) : 0);
    var o = e.length;
    return (
      r < 0 && (r = PN(o + r, 0)),
      _v(e) ? r <= o && e.indexOf(t, r) > -1 : !!o && OO(e, t, r) > -1
    );
  }
  var TN = "[object Map]",
    xN = "[object Set]",
    DN = Object.prototype,
    IN = DN.hasOwnProperty;
  function _i(e) {
    if (e == null) return !0;
    if (
      so(e) &&
      (Tt(e) ||
        typeof e == "string" ||
        typeof e.splice == "function" ||
        ea(e) ||
        du(e) ||
        Ia(e))
    )
      return !e.length;
    var t = Rr(e);
    if (t == TN || t == xN) return !e.size;
    if (fu(e)) return !cv(e).length;
    for (var r in e) if (IN.call(e, r)) return !1;
    return !0;
  }
  function RN(e) {
    return e == null;
  }
  function MN(e, t) {
    var r = {};
    return (
      (t = ao(t)),
      yv(e, function (n, o, i) {
        nv(r, o, t(n, o, i));
      }),
      r
    );
  }
  var jN = "Expected a function";
  function FN(e) {
    if (typeof e != "function") throw new TypeError(jN);
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
  function $v(e, t, r, n) {
    if (!ur(e)) return e;
    t = ja(t, e);
    for (var o = -1, i = t.length, s = i - 1, a = e; a != null && ++o < i; ) {
      var l = Hi(t[o]),
        c = r;
      if (l === "__proto__" || l === "constructor" || l === "prototype")
        return e;
      if (o != s) {
        var u = a[l];
        (c = void 0), c === void 0 && (c = ur(u) ? u : lu(t[o + 1]) ? [] : {});
      }
      CO(a, l, c), (a = a[l]);
    }
    return e;
  }
  function LN(e, t, r) {
    for (var n = -1, o = t.length, i = {}; ++n < o; ) {
      var s = t[n],
        a = gu(e, s);
      r(a, s) && $v(i, ja(s, e), a);
    }
    return i;
  }
  function VN(e, t) {
    if (e == null) return {};
    var r = Da(mA(e), function (n) {
      return [n];
    });
    return (
      (t = ao(t)),
      LN(e, r, function (n, o) {
        return t(n, o[0]);
      })
    );
  }
  function kN(e, t) {
    return VN(e, FN(ao(t)));
  }
  function BN(e, t, r, n, o) {
    return (
      o(e, function (i, s, a) {
        r = n ? ((n = !1), i) : t(r, i, s, a);
      }),
      r
    );
  }
  function bv(e, t, r) {
    var n = Tt(e) ? oA : BN,
      o = arguments.length < 3;
    return n(e, ao(t), r, o, yu);
  }
  function wv(e, t, r) {
    return e == null ? e : $v(e, t, r);
  }
  const zN = Oe(),
    UN = Oe({}),
    WN = Oe(),
    yl = {
      activeTheme: zN,
      config: UN,
      providedThemes: WN,
    };
  function HN(e, t = {}) {
    const r = e.map(Object.keys).flat();
    return bv(
      r,
      (n, o) => {
        const i = ap(e, a => mu(a, o, {})),
          s = ap(i, a => (au(a) ? a(t) : a));
        return wv(n, o, M1(j1(...s))), n;
      },
      {}
    );
  }
  function fr(e, t = {}, ...r) {
    return Se(() => {
      (e = Tt(e) ? e : [e]), (r = ON(r));
      const n = U(yl == null ? void 0 : yl.config);
      _i(n) || r.push(n);
      const o = kN(
          MN(U(t), s => U(s)),
          RN
        ),
        i = {};
      return (
        vN(e, s => {
          const a = bv(
            r,
            (l, c) => {
              c = Te(U(c));
              const u = mu(c, s);
              return ur(u) && !_i(u) && l.push(u), l;
            },
            []
          );
          wv(i, s, HN(a, o));
        }),
        i
      );
    });
  }
  var ci =
      typeof globalThis < "u"
        ? globalThis
        : typeof window < "u"
          ? window
          : typeof global < "u"
            ? global
            : typeof self < "u"
              ? self
              : {},
    KN = Object.prototype;
  function GN(e) {
    var t = e && e.constructor,
      r = (typeof t == "function" && t.prototype) || KN;
    return e === r;
  }
  var _u = GN;
  function qN(e, t) {
    return function (r) {
      return e(t(r));
    };
  }
  var Ev = qN,
    YN = Ev,
    JN = YN(Object.keys, Object),
    XN = JN,
    ZN = _u,
    QN = XN,
    eP = Object.prototype,
    tP = eP.hasOwnProperty;
  function rP(e) {
    if (!ZN(e)) return QN(e);
    var t = [];
    for (var r in Object(e)) tP.call(e, r) && r != "constructor" && t.push(r);
    return t;
  }
  var Ov = rP,
    nP = typeof ci == "object" && ci && ci.Object === Object && ci,
    Sv = nP,
    oP = Sv,
    iP = typeof self == "object" && self && self.Object === Object && self,
    sP = oP || iP || Function("return this")(),
    Bt = sP,
    aP = Bt,
    lP = aP.Symbol,
    jo = lP,
    lp = jo,
    Av = Object.prototype,
    cP = Av.hasOwnProperty,
    uP = Av.toString,
    ni = lp ? lp.toStringTag : void 0;
  function fP(e) {
    var t = cP.call(e, ni),
      r = e[ni];
    try {
      e[ni] = void 0;
      var n = !0;
    } catch {}
    var o = uP.call(e);
    return n && (t ? (e[ni] = r) : delete e[ni]), o;
  }
  var dP = fP,
    pP = Object.prototype,
    hP = pP.toString;
  function gP(e) {
    return hP.call(e);
  }
  var mP = gP,
    cp = jo,
    vP = dP,
    yP = mP,
    _P = "[object Null]",
    $P = "[object Undefined]",
    up = cp ? cp.toStringTag : void 0;
  function bP(e) {
    return e == null
      ? e === void 0
        ? $P
        : _P
      : up && up in Object(e)
        ? vP(e)
        : yP(e);
  }
  var lo = bP;
  function wP(e) {
    var t = typeof e;
    return e != null && (t == "object" || t == "function");
  }
  var er = wP,
    EP = lo,
    OP = er,
    SP = "[object AsyncFunction]",
    AP = "[object Function]",
    NP = "[object GeneratorFunction]",
    PP = "[object Proxy]";
  function CP(e) {
    if (!OP(e)) return !1;
    var t = EP(e);
    return t == AP || t == NP || t == SP || t == PP;
  }
  var Fa = CP,
    TP = Bt,
    xP = TP["__core-js_shared__"],
    DP = xP,
    _l = DP,
    fp = (function () {
      var e = /[^.]+$/.exec((_l && _l.keys && _l.keys.IE_PROTO) || "");
      return e ? "Symbol(src)_1." + e : "";
    })();
  function IP(e) {
    return !!fp && fp in e;
  }
  var RP = IP,
    MP = Function.prototype,
    jP = MP.toString;
  function FP(e) {
    if (e != null) {
      try {
        return jP.call(e);
      } catch {}
      try {
        return e + "";
      } catch {}
    }
    return "";
  }
  var Nv = FP,
    LP = Fa,
    VP = RP,
    kP = er,
    BP = Nv,
    zP = /[\\^$.*+?()[\]{}|]/g,
    UP = /^\[object .+?Constructor\]$/,
    WP = Function.prototype,
    HP = Object.prototype,
    KP = WP.toString,
    GP = HP.hasOwnProperty,
    qP = RegExp(
      "^" +
        KP.call(GP)
          .replace(zP, "\\$&")
          .replace(
            /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
            "$1.*?"
          ) +
        "$"
    );
  function YP(e) {
    if (!kP(e) || VP(e)) return !1;
    var t = LP(e) ? qP : UP;
    return t.test(BP(e));
  }
  var JP = YP;
  function XP(e, t) {
    return e == null ? void 0 : e[t];
  }
  var ZP = XP,
    QP = JP,
    eC = ZP;
  function tC(e, t) {
    var r = eC(e, t);
    return QP(r) ? r : void 0;
  }
  var co = tC,
    rC = co,
    nC = Bt,
    oC = rC(nC, "DataView"),
    iC = oC,
    sC = co,
    aC = Bt,
    lC = sC(aC, "Map"),
    $u = lC,
    cC = co,
    uC = Bt,
    fC = cC(uC, "Promise"),
    dC = fC,
    pC = co,
    hC = Bt,
    gC = pC(hC, "Set"),
    mC = gC,
    vC = co,
    yC = Bt,
    _C = vC(yC, "WeakMap"),
    Pv = _C,
    uc = iC,
    fc = $u,
    dc = dC,
    pc = mC,
    hc = Pv,
    Cv = lo,
    Fo = Nv,
    dp = "[object Map]",
    $C = "[object Object]",
    pp = "[object Promise]",
    hp = "[object Set]",
    gp = "[object WeakMap]",
    mp = "[object DataView]",
    bC = Fo(uc),
    wC = Fo(fc),
    EC = Fo(dc),
    OC = Fo(pc),
    SC = Fo(hc),
    In = Cv;
  ((uc && In(new uc(new ArrayBuffer(1))) != mp) ||
    (fc && In(new fc()) != dp) ||
    (dc && In(dc.resolve()) != pp) ||
    (pc && In(new pc()) != hp) ||
    (hc && In(new hc()) != gp)) &&
    (In = function (e) {
      var t = Cv(e),
        r = t == $C ? e.constructor : void 0,
        n = r ? Fo(r) : "";
      if (n)
        switch (n) {
          case bC:
            return mp;
          case wC:
            return dp;
          case EC:
            return pp;
          case OC:
            return hp;
          case SC:
            return gp;
        }
      return t;
    });
  var Ki = In;
  function AC(e) {
    return e != null && typeof e == "object";
  }
  var tr = AC,
    NC = lo,
    PC = tr,
    CC = "[object Arguments]";
  function TC(e) {
    return PC(e) && NC(e) == CC;
  }
  var xC = TC,
    vp = xC,
    DC = tr,
    Tv = Object.prototype,
    IC = Tv.hasOwnProperty,
    RC = Tv.propertyIsEnumerable,
    MC = vp(
      /* @__PURE__ */ (function () {
        return arguments;
      })()
    )
      ? vp
      : function (e) {
          return DC(e) && IC.call(e, "callee") && !RC.call(e, "callee");
        },
    La = MC,
    jC = Array.isArray,
    zt = jC,
    FC = 9007199254740991;
  function LC(e) {
    return typeof e == "number" && e > -1 && e % 1 == 0 && e <= FC;
  }
  var bu = LC,
    VC = Fa,
    kC = bu;
  function BC(e) {
    return e != null && kC(e.length) && !VC(e);
  }
  var Va = BC,
    ra = { exports: {} };
  function zC() {
    return !1;
  }
  var UC = zC;
  ra.exports;
  (function (e, t) {
    var r = Bt,
      n = UC,
      o = t && !t.nodeType && t,
      i = o && !0 && e && !e.nodeType && e,
      s = i && i.exports === o,
      a = s ? r.Buffer : void 0,
      l = a ? a.isBuffer : void 0,
      c = l || n;
    e.exports = c;
  })(ra, ra.exports);
  var ka = ra.exports,
    WC = lo,
    HC = bu,
    KC = tr,
    GC = "[object Arguments]",
    qC = "[object Array]",
    YC = "[object Boolean]",
    JC = "[object Date]",
    XC = "[object Error]",
    ZC = "[object Function]",
    QC = "[object Map]",
    eT = "[object Number]",
    tT = "[object Object]",
    rT = "[object RegExp]",
    nT = "[object Set]",
    oT = "[object String]",
    iT = "[object WeakMap]",
    sT = "[object ArrayBuffer]",
    aT = "[object DataView]",
    lT = "[object Float32Array]",
    cT = "[object Float64Array]",
    uT = "[object Int8Array]",
    fT = "[object Int16Array]",
    dT = "[object Int32Array]",
    pT = "[object Uint8Array]",
    hT = "[object Uint8ClampedArray]",
    gT = "[object Uint16Array]",
    mT = "[object Uint32Array]",
    Ze = {};
  Ze[lT] =
    Ze[cT] =
    Ze[uT] =
    Ze[fT] =
    Ze[dT] =
    Ze[pT] =
    Ze[hT] =
    Ze[gT] =
    Ze[mT] =
      !0;
  Ze[GC] =
    Ze[qC] =
    Ze[sT] =
    Ze[YC] =
    Ze[aT] =
    Ze[JC] =
    Ze[XC] =
    Ze[ZC] =
    Ze[QC] =
    Ze[eT] =
    Ze[tT] =
    Ze[rT] =
    Ze[nT] =
    Ze[oT] =
    Ze[iT] =
      !1;
  function vT(e) {
    return KC(e) && HC(e.length) && !!Ze[WC(e)];
  }
  var yT = vT;
  function _T(e) {
    return function (t) {
      return e(t);
    };
  }
  var wu = _T,
    na = { exports: {} };
  na.exports;
  (function (e, t) {
    var r = Sv,
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
  })(na, na.exports);
  var Eu = na.exports,
    $T = yT,
    bT = wu,
    yp = Eu,
    _p = yp && yp.isTypedArray,
    wT = _p ? bT(_p) : $T,
    Ou = wT;
  function ET(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length, o = Array(n); ++r < n; )
      o[r] = t(e[r], r, e);
    return o;
  }
  var xv = ET,
    OT = lo,
    ST = tr,
    AT = "[object Symbol]";
  function NT(e) {
    return typeof e == "symbol" || (ST(e) && OT(e) == AT);
  }
  var Gi = NT,
    $p = jo,
    PT = xv,
    CT = zt,
    TT = Gi,
    xT = 1 / 0,
    bp = $p ? $p.prototype : void 0,
    wp = bp ? bp.toString : void 0;
  function Dv(e) {
    if (typeof e == "string") return e;
    if (CT(e)) return PT(e, Dv) + "";
    if (TT(e)) return wp ? wp.call(e) : "";
    var t = e + "";
    return t == "0" && 1 / e == -xT ? "-0" : t;
  }
  var DT = Dv,
    IT = DT;
  function RT(e) {
    return e == null ? "" : IT(e);
  }
  var Iv = RT;
  function MT(e, t, r) {
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
  var jT = MT;
  function FT(e, t) {
    for (var r = -1, n = Array(e); ++r < e; ) n[r] = t(r);
    return n;
  }
  var LT = FT,
    VT = 9007199254740991,
    kT = /^(?:0|[1-9]\d*)$/;
  function BT(e, t) {
    var r = typeof e;
    return (
      (t = t ?? VT),
      !!t &&
        (r == "number" || (r != "symbol" && kT.test(e))) &&
        e > -1 &&
        e % 1 == 0 &&
        e < t
    );
  }
  var qi = BT,
    zT = LT,
    UT = La,
    WT = zt,
    HT = ka,
    KT = qi,
    GT = Ou,
    qT = Object.prototype,
    YT = qT.hasOwnProperty;
  function JT(e, t) {
    var r = WT(e),
      n = !r && UT(e),
      o = !r && !n && HT(e),
      i = !r && !n && !o && GT(e),
      s = r || n || o || i,
      a = s ? zT(e.length, String) : [],
      l = a.length;
    for (var c in e)
      (t || YT.call(e, c)) &&
        !(
          s && // Safari 9 has enumerable `arguments.length` in strict mode.
          (c == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            (o && (c == "offset" || c == "parent")) || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            (i && (c == "buffer" || c == "byteLength" || c == "byteOffset")) || // Skip index properties.
            KT(c, l))
        ) &&
        a.push(c);
    return a;
  }
  var Rv = JT,
    XT = Rv,
    ZT = Ov,
    QT = Va;
  function ex(e) {
    return QT(e) ? XT(e) : ZT(e);
  }
  var Ba = ex;
  function tx() {
    (this.__data__ = []), (this.size = 0);
  }
  var rx = tx;
  function nx(e, t) {
    return e === t || (e !== e && t !== t);
  }
  var Yi = nx,
    ox = Yi;
  function ix(e, t) {
    for (var r = e.length; r--; ) if (ox(e[r][0], t)) return r;
    return -1;
  }
  var za = ix,
    sx = za,
    ax = Array.prototype,
    lx = ax.splice;
  function cx(e) {
    var t = this.__data__,
      r = sx(t, e);
    if (r < 0) return !1;
    var n = t.length - 1;
    return r == n ? t.pop() : lx.call(t, r, 1), --this.size, !0;
  }
  var ux = cx,
    fx = za;
  function dx(e) {
    var t = this.__data__,
      r = fx(t, e);
    return r < 0 ? void 0 : t[r][1];
  }
  var px = dx,
    hx = za;
  function gx(e) {
    return hx(this.__data__, e) > -1;
  }
  var mx = gx,
    vx = za;
  function yx(e, t) {
    var r = this.__data__,
      n = vx(r, e);
    return n < 0 ? (++this.size, r.push([e, t])) : (r[n][1] = t), this;
  }
  var _x = yx,
    $x = rx,
    bx = ux,
    wx = px,
    Ex = mx,
    Ox = _x;
  function Lo(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  Lo.prototype.clear = $x;
  Lo.prototype.delete = bx;
  Lo.prototype.get = wx;
  Lo.prototype.has = Ex;
  Lo.prototype.set = Ox;
  var Ua = Lo,
    Sx = Ua;
  function Ax() {
    (this.__data__ = new Sx()), (this.size = 0);
  }
  var Nx = Ax;
  function Px(e) {
    var t = this.__data__,
      r = t.delete(e);
    return (this.size = t.size), r;
  }
  var Cx = Px;
  function Tx(e) {
    return this.__data__.get(e);
  }
  var xx = Tx;
  function Dx(e) {
    return this.__data__.has(e);
  }
  var Ix = Dx,
    Rx = co,
    Mx = Rx(Object, "create"),
    Wa = Mx,
    Ep = Wa;
  function jx() {
    (this.__data__ = Ep ? Ep(null) : {}), (this.size = 0);
  }
  var Fx = jx;
  function Lx(e) {
    var t = this.has(e) && delete this.__data__[e];
    return (this.size -= t ? 1 : 0), t;
  }
  var Vx = Lx,
    kx = Wa,
    Bx = "__lodash_hash_undefined__",
    zx = Object.prototype,
    Ux = zx.hasOwnProperty;
  function Wx(e) {
    var t = this.__data__;
    if (kx) {
      var r = t[e];
      return r === Bx ? void 0 : r;
    }
    return Ux.call(t, e) ? t[e] : void 0;
  }
  var Hx = Wx,
    Kx = Wa,
    Gx = Object.prototype,
    qx = Gx.hasOwnProperty;
  function Yx(e) {
    var t = this.__data__;
    return Kx ? t[e] !== void 0 : qx.call(t, e);
  }
  var Jx = Yx,
    Xx = Wa,
    Zx = "__lodash_hash_undefined__";
  function Qx(e, t) {
    var r = this.__data__;
    return (
      (this.size += this.has(e) ? 0 : 1),
      (r[e] = Xx && t === void 0 ? Zx : t),
      this
    );
  }
  var eD = Qx,
    tD = Fx,
    rD = Vx,
    nD = Hx,
    oD = Jx,
    iD = eD;
  function Vo(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  Vo.prototype.clear = tD;
  Vo.prototype.delete = rD;
  Vo.prototype.get = nD;
  Vo.prototype.has = oD;
  Vo.prototype.set = iD;
  var sD = Vo,
    Op = sD,
    aD = Ua,
    lD = $u;
  function cD() {
    (this.size = 0),
      (this.__data__ = {
        hash: new Op(),
        map: new (lD || aD)(),
        string: new Op(),
      });
  }
  var uD = cD;
  function fD(e) {
    var t = typeof e;
    return t == "string" || t == "number" || t == "symbol" || t == "boolean"
      ? e !== "__proto__"
      : e === null;
  }
  var dD = fD,
    pD = dD;
  function hD(e, t) {
    var r = e.__data__;
    return pD(t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
  }
  var Ha = hD,
    gD = Ha;
  function mD(e) {
    var t = gD(this, e).delete(e);
    return (this.size -= t ? 1 : 0), t;
  }
  var vD = mD,
    yD = Ha;
  function _D(e) {
    return yD(this, e).get(e);
  }
  var $D = _D,
    bD = Ha;
  function wD(e) {
    return bD(this, e).has(e);
  }
  var ED = wD,
    OD = Ha;
  function SD(e, t) {
    var r = OD(this, e),
      n = r.size;
    return r.set(e, t), (this.size += r.size == n ? 0 : 1), this;
  }
  var AD = SD,
    ND = uD,
    PD = vD,
    CD = $D,
    TD = ED,
    xD = AD;
  function ko(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var n = e[t];
      this.set(n[0], n[1]);
    }
  }
  ko.prototype.clear = ND;
  ko.prototype.delete = PD;
  ko.prototype.get = CD;
  ko.prototype.has = TD;
  ko.prototype.set = xD;
  var Su = ko,
    DD = Ua,
    ID = $u,
    RD = Su,
    MD = 200;
  function jD(e, t) {
    var r = this.__data__;
    if (r instanceof DD) {
      var n = r.__data__;
      if (!ID || n.length < MD - 1)
        return n.push([e, t]), (this.size = ++r.size), this;
      r = this.__data__ = new RD(n);
    }
    return r.set(e, t), (this.size = r.size), this;
  }
  var FD = jD,
    LD = Ua,
    VD = Nx,
    kD = Cx,
    BD = xx,
    zD = Ix,
    UD = FD;
  function Bo(e) {
    var t = (this.__data__ = new LD(e));
    this.size = t.size;
  }
  Bo.prototype.clear = VD;
  Bo.prototype.delete = kD;
  Bo.prototype.get = BD;
  Bo.prototype.has = zD;
  Bo.prototype.set = UD;
  var Ka = Bo,
    WD = co,
    HD = (function () {
      try {
        var e = WD(Object, "defineProperty");
        return e({}, "", {}), e;
      } catch {}
    })(),
    Mv = HD,
    Sp = Mv;
  function KD(e, t, r) {
    t == "__proto__" && Sp
      ? Sp(e, t, {
          configurable: !0,
          enumerable: !0,
          value: r,
          writable: !0,
        })
      : (e[t] = r);
  }
  var Au = KD,
    GD = Au,
    qD = Yi;
  function YD(e, t, r) {
    ((r !== void 0 && !qD(e[t], r)) || (r === void 0 && !(t in e))) &&
      GD(e, t, r);
  }
  var jv = YD;
  function JD(e) {
    return function (t, r, n) {
      for (var o = -1, i = Object(t), s = n(t), a = s.length; a--; ) {
        var l = s[e ? a : ++o];
        if (r(i[l], l, i) === !1) break;
      }
      return t;
    };
  }
  var XD = JD,
    ZD = XD,
    QD = ZD(),
    eI = QD,
    oa = { exports: {} };
  oa.exports;
  (function (e, t) {
    var r = Bt,
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
  })(oa, oa.exports);
  var Fv = oa.exports,
    tI = Bt,
    rI = tI.Uint8Array,
    Lv = rI,
    Ap = Lv;
  function nI(e) {
    var t = new e.constructor(e.byteLength);
    return new Ap(t).set(new Ap(e)), t;
  }
  var Nu = nI,
    oI = Nu;
  function iI(e, t) {
    var r = t ? oI(e.buffer) : e.buffer;
    return new e.constructor(r, e.byteOffset, e.length);
  }
  var Vv = iI;
  function sI(e, t) {
    var r = -1,
      n = e.length;
    for (t || (t = Array(n)); ++r < n; ) t[r] = e[r];
    return t;
  }
  var Ji = sI,
    aI = er,
    Np = Object.create,
    lI = /* @__PURE__ */ (function () {
      function e() {}
      return function (t) {
        if (!aI(t)) return {};
        if (Np) return Np(t);
        e.prototype = t;
        var r = new e();
        return (e.prototype = void 0), r;
      };
    })(),
    Ga = lI,
    cI = Ev,
    uI = cI(Object.getPrototypeOf, Object),
    Pu = uI,
    fI = Ga,
    dI = Pu,
    pI = _u;
  function hI(e) {
    return typeof e.constructor == "function" && !pI(e) ? fI(dI(e)) : {};
  }
  var kv = hI,
    gI = Va,
    mI = tr;
  function vI(e) {
    return mI(e) && gI(e);
  }
  var yI = vI,
    _I = lo,
    $I = Pu,
    bI = tr,
    wI = "[object Object]",
    EI = Function.prototype,
    OI = Object.prototype,
    Bv = EI.toString,
    SI = OI.hasOwnProperty,
    AI = Bv.call(Object);
  function NI(e) {
    if (!bI(e) || _I(e) != wI) return !1;
    var t = $I(e);
    if (t === null) return !0;
    var r = SI.call(t, "constructor") && t.constructor;
    return typeof r == "function" && r instanceof r && Bv.call(r) == AI;
  }
  var zv = NI;
  function PI(e, t) {
    if (!(t === "constructor" && typeof e[t] == "function") && t != "__proto__")
      return e[t];
  }
  var Uv = PI,
    CI = Au,
    TI = Yi,
    xI = Object.prototype,
    DI = xI.hasOwnProperty;
  function II(e, t, r) {
    var n = e[t];
    (!(DI.call(e, t) && TI(n, r)) || (r === void 0 && !(t in e))) &&
      CI(e, t, r);
  }
  var Cu = II,
    RI = Cu,
    MI = Au;
  function jI(e, t, r, n) {
    var o = !r;
    r || (r = {});
    for (var i = -1, s = t.length; ++i < s; ) {
      var a = t[i],
        l = n ? n(r[a], e[a], a, r, e) : void 0;
      l === void 0 && (l = e[a]), o ? MI(r, a, l) : RI(r, a, l);
    }
    return r;
  }
  var Xi = jI;
  function FI(e) {
    var t = [];
    if (e != null) for (var r in Object(e)) t.push(r);
    return t;
  }
  var LI = FI,
    VI = er,
    kI = _u,
    BI = LI,
    zI = Object.prototype,
    UI = zI.hasOwnProperty;
  function WI(e) {
    if (!VI(e)) return BI(e);
    var t = kI(e),
      r = [];
    for (var n in e) (n == "constructor" && (t || !UI.call(e, n))) || r.push(n);
    return r;
  }
  var HI = WI,
    KI = Rv,
    GI = HI,
    qI = Va;
  function YI(e) {
    return qI(e) ? KI(e, !0) : GI(e);
  }
  var Zi = YI,
    JI = Xi,
    XI = Zi;
  function ZI(e) {
    return JI(e, XI(e));
  }
  var QI = ZI,
    Pp = jv,
    eR = Fv,
    tR = Vv,
    rR = Ji,
    nR = kv,
    Cp = La,
    Tp = zt,
    oR = yI,
    iR = ka,
    sR = Fa,
    aR = er,
    lR = zv,
    cR = Ou,
    xp = Uv,
    uR = QI;
  function fR(e, t, r, n, o, i, s) {
    var a = xp(e, r),
      l = xp(t, r),
      c = s.get(l);
    if (c) {
      Pp(e, r, c);
      return;
    }
    var u = i ? i(a, l, r + "", e, t, s) : void 0,
      f = u === void 0;
    if (f) {
      var d = Tp(l),
        p = !d && iR(l),
        h = !d && !p && cR(l);
      (u = l),
        d || p || h
          ? Tp(a)
            ? (u = a)
            : oR(a)
              ? (u = rR(a))
              : p
                ? ((f = !1), (u = eR(l, !0)))
                : h
                  ? ((f = !1), (u = tR(l, !0)))
                  : (u = [])
          : lR(l) || Cp(l)
            ? ((u = a), Cp(a) ? (u = uR(a)) : (!aR(a) || sR(a)) && (u = nR(l)))
            : (f = !1);
    }
    f && (s.set(l, u), o(u, l, n, i, s), s.delete(l)), Pp(e, r, u);
  }
  var dR = fR,
    pR = Ka,
    hR = jv,
    gR = eI,
    mR = dR,
    vR = er,
    yR = Zi,
    _R = Uv;
  function Wv(e, t, r, n, o) {
    e !== t &&
      gR(
        t,
        function (i, s) {
          if ((o || (o = new pR()), vR(i))) mR(e, t, s, r, Wv, n, o);
          else {
            var a = n ? n(_R(e, s), i, s + "", e, t, o) : void 0;
            a === void 0 && (a = i), hR(e, s, a);
          }
        },
        yR
      );
  }
  var $R = Wv;
  function bR(e) {
    return e;
  }
  var qa = bR;
  function wR(e, t, r) {
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
  var Tu = wR,
    ER = Tu,
    Dp = Math.max;
  function OR(e, t, r) {
    return (
      (t = Dp(t === void 0 ? e.length - 1 : t, 0)),
      function () {
        for (
          var n = arguments, o = -1, i = Dp(n.length - t, 0), s = Array(i);
          ++o < i;

        )
          s[o] = n[t + o];
        o = -1;
        for (var a = Array(t + 1); ++o < t; ) a[o] = n[o];
        return (a[t] = r(s)), ER(e, this, a);
      }
    );
  }
  var Hv = OR;
  function SR(e) {
    return function () {
      return e;
    };
  }
  var AR = SR,
    NR = AR,
    Ip = Mv,
    PR = qa,
    CR = Ip
      ? function (e, t) {
          return Ip(e, "toString", {
            configurable: !0,
            enumerable: !1,
            value: NR(t),
            writable: !0,
          });
        }
      : PR,
    TR = CR,
    xR = 800,
    DR = 16,
    IR = Date.now;
  function RR(e) {
    var t = 0,
      r = 0;
    return function () {
      var n = IR(),
        o = DR - (n - r);
      if (((r = n), o > 0)) {
        if (++t >= xR) return arguments[0];
      } else t = 0;
      return e.apply(void 0, arguments);
    };
  }
  var Kv = RR,
    MR = TR,
    jR = Kv,
    FR = jR(MR),
    xu = FR,
    LR = qa,
    VR = Hv,
    kR = xu;
  function BR(e, t) {
    return kR(VR(e, t, LR), e + "");
  }
  var zR = BR,
    UR = Yi,
    WR = Va,
    HR = qi,
    KR = er;
  function GR(e, t, r) {
    if (!KR(r)) return !1;
    var n = typeof t;
    return (n == "number" ? WR(r) && HR(t, r.length) : n == "string" && t in r)
      ? UR(r[t], e)
      : !1;
  }
  var qR = GR,
    YR = zR,
    JR = qR;
  function XR(e) {
    return YR(function (t, r) {
      var n = -1,
        o = r.length,
        i = o > 1 ? r[o - 1] : void 0,
        s = o > 2 ? r[2] : void 0;
      for (
        i = e.length > 3 && typeof i == "function" ? (o--, i) : void 0,
          s && JR(r[0], r[1], s) && ((i = o < 3 ? void 0 : i), (o = 1)),
          t = Object(t);
        ++n < o;

      ) {
        var a = r[n];
        a && e(t, a, n, i);
      }
      return t;
    });
  }
  var ZR = XR,
    QR = $R,
    eM = ZR;
  eM(function (e, t, r) {
    QR(e, t, r);
  });
  function tM(e, t) {
    for (
      var r = -1, n = e == null ? 0 : e.length;
      ++r < n && t(e[r], r, e) !== !1;

    );
    return e;
  }
  var Du = tM,
    rM = Xi,
    nM = Ba;
  function oM(e, t) {
    return e && rM(t, nM(t), e);
  }
  var Gv = oM,
    iM = Xi,
    sM = Zi;
  function aM(e, t) {
    return e && iM(t, sM(t), e);
  }
  var lM = aM;
  function cM(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length, o = 0, i = []; ++r < n; ) {
      var s = e[r];
      t(s, r, e) && (i[o++] = s);
    }
    return i;
  }
  var uM = cM;
  function fM() {
    return [];
  }
  var qv = fM,
    dM = uM,
    pM = qv,
    hM = Object.prototype,
    gM = hM.propertyIsEnumerable,
    Rp = Object.getOwnPropertySymbols,
    mM = Rp
      ? function (e) {
          return e == null
            ? []
            : ((e = Object(e)),
              dM(Rp(e), function (t) {
                return gM.call(e, t);
              }));
        }
      : pM,
    Iu = mM,
    vM = Xi,
    yM = Iu;
  function _M(e, t) {
    return vM(e, yM(e), t);
  }
  var $M = _M;
  function bM(e, t) {
    for (var r = -1, n = t.length, o = e.length; ++r < n; ) e[o + r] = t[r];
    return e;
  }
  var Ru = bM,
    wM = Ru,
    EM = Pu,
    OM = Iu,
    SM = qv,
    AM = Object.getOwnPropertySymbols,
    NM = AM
      ? function (e) {
          for (var t = []; e; ) wM(t, OM(e)), (e = EM(e));
          return t;
        }
      : SM,
    Yv = NM,
    PM = Xi,
    CM = Yv;
  function TM(e, t) {
    return PM(e, CM(e), t);
  }
  var xM = TM,
    DM = Ru,
    IM = zt;
  function RM(e, t, r) {
    var n = t(e);
    return IM(e) ? n : DM(n, r(e));
  }
  var Jv = RM,
    MM = Jv,
    jM = Iu,
    FM = Ba;
  function LM(e) {
    return MM(e, FM, jM);
  }
  var Xv = LM,
    VM = Jv,
    kM = Yv,
    BM = Zi;
  function zM(e) {
    return VM(e, BM, kM);
  }
  var UM = zM,
    WM = Object.prototype,
    HM = WM.hasOwnProperty;
  function KM(e) {
    var t = e.length,
      r = new e.constructor(t);
    return (
      t &&
        typeof e[0] == "string" &&
        HM.call(e, "index") &&
        ((r.index = e.index), (r.input = e.input)),
      r
    );
  }
  var GM = KM,
    qM = Nu;
  function YM(e, t) {
    var r = t ? qM(e.buffer) : e.buffer;
    return new e.constructor(r, e.byteOffset, e.byteLength);
  }
  var JM = YM,
    XM = /\w*$/;
  function ZM(e) {
    var t = new e.constructor(e.source, XM.exec(e));
    return (t.lastIndex = e.lastIndex), t;
  }
  var QM = ZM,
    Mp = jo,
    jp = Mp ? Mp.prototype : void 0,
    Fp = jp ? jp.valueOf : void 0;
  function ej(e) {
    return Fp ? Object(Fp.call(e)) : {};
  }
  var tj = ej,
    rj = Nu,
    nj = JM,
    oj = QM,
    ij = tj,
    sj = Vv,
    aj = "[object Boolean]",
    lj = "[object Date]",
    cj = "[object Map]",
    uj = "[object Number]",
    fj = "[object RegExp]",
    dj = "[object Set]",
    pj = "[object String]",
    hj = "[object Symbol]",
    gj = "[object ArrayBuffer]",
    mj = "[object DataView]",
    vj = "[object Float32Array]",
    yj = "[object Float64Array]",
    _j = "[object Int8Array]",
    $j = "[object Int16Array]",
    bj = "[object Int32Array]",
    wj = "[object Uint8Array]",
    Ej = "[object Uint8ClampedArray]",
    Oj = "[object Uint16Array]",
    Sj = "[object Uint32Array]";
  function Aj(e, t, r) {
    var n = e.constructor;
    switch (t) {
      case gj:
        return rj(e);
      case aj:
      case lj:
        return new n(+e);
      case mj:
        return nj(e, r);
      case vj:
      case yj:
      case _j:
      case $j:
      case bj:
      case wj:
      case Ej:
      case Oj:
      case Sj:
        return sj(e, r);
      case cj:
        return new n();
      case uj:
      case pj:
        return new n(e);
      case fj:
        return oj(e);
      case dj:
        return new n();
      case hj:
        return ij(e);
    }
  }
  var Nj = Aj,
    Pj = Ki,
    Cj = tr,
    Tj = "[object Map]";
  function xj(e) {
    return Cj(e) && Pj(e) == Tj;
  }
  var Dj = xj,
    Ij = Dj,
    Rj = wu,
    Lp = Eu,
    Vp = Lp && Lp.isMap,
    Mj = Vp ? Rj(Vp) : Ij,
    jj = Mj,
    Fj = Ki,
    Lj = tr,
    Vj = "[object Set]";
  function kj(e) {
    return Lj(e) && Fj(e) == Vj;
  }
  var Bj = kj,
    zj = Bj,
    Uj = wu,
    kp = Eu,
    Bp = kp && kp.isSet,
    Wj = Bp ? Uj(Bp) : zj,
    Hj = Wj,
    Kj = Ka,
    Gj = Du,
    qj = Cu,
    Yj = Gv,
    Jj = lM,
    Xj = Fv,
    Zj = Ji,
    Qj = $M,
    eF = xM,
    tF = Xv,
    rF = UM,
    nF = Ki,
    oF = GM,
    iF = Nj,
    sF = kv,
    aF = zt,
    lF = ka,
    cF = jj,
    uF = er,
    fF = Hj,
    dF = Ba,
    pF = Zi,
    hF = 1,
    gF = 2,
    mF = 4,
    Zv = "[object Arguments]",
    vF = "[object Array]",
    yF = "[object Boolean]",
    _F = "[object Date]",
    $F = "[object Error]",
    Qv = "[object Function]",
    bF = "[object GeneratorFunction]",
    wF = "[object Map]",
    EF = "[object Number]",
    ey = "[object Object]",
    OF = "[object RegExp]",
    SF = "[object Set]",
    AF = "[object String]",
    NF = "[object Symbol]",
    PF = "[object WeakMap]",
    CF = "[object ArrayBuffer]",
    TF = "[object DataView]",
    xF = "[object Float32Array]",
    DF = "[object Float64Array]",
    IF = "[object Int8Array]",
    RF = "[object Int16Array]",
    MF = "[object Int32Array]",
    jF = "[object Uint8Array]",
    FF = "[object Uint8ClampedArray]",
    LF = "[object Uint16Array]",
    VF = "[object Uint32Array]",
    qe = {};
  qe[Zv] =
    qe[vF] =
    qe[CF] =
    qe[TF] =
    qe[yF] =
    qe[_F] =
    qe[xF] =
    qe[DF] =
    qe[IF] =
    qe[RF] =
    qe[MF] =
    qe[wF] =
    qe[EF] =
    qe[ey] =
    qe[OF] =
    qe[SF] =
    qe[AF] =
    qe[NF] =
    qe[jF] =
    qe[FF] =
    qe[LF] =
    qe[VF] =
      !0;
  qe[$F] = qe[Qv] = qe[PF] = !1;
  function Is(e, t, r, n, o, i) {
    var s,
      a = t & hF,
      l = t & gF,
      c = t & mF;
    if ((r && (s = o ? r(e, n, o, i) : r(e)), s !== void 0)) return s;
    if (!uF(e)) return e;
    var u = aF(e);
    if (u) {
      if (((s = oF(e)), !a)) return Zj(e, s);
    } else {
      var f = nF(e),
        d = f == Qv || f == bF;
      if (lF(e)) return Xj(e, a);
      if (f == ey || f == Zv || (d && !o)) {
        if (((s = l || d ? {} : sF(e)), !a))
          return l ? eF(e, Jj(s, e)) : Qj(e, Yj(s, e));
      } else {
        if (!qe[f]) return o ? e : {};
        s = iF(e, f, a);
      }
    }
    i || (i = new Kj());
    var p = i.get(e);
    if (p) return p;
    i.set(e, s),
      fF(e)
        ? e.forEach(function (y) {
            s.add(Is(y, t, r, y, e, i));
          })
        : cF(e) &&
          e.forEach(function (y, g) {
            s.set(g, Is(y, t, r, g, e, i));
          });
    var h = c ? (l ? rF : tF) : l ? pF : dF,
      m = u ? void 0 : h(e);
    return (
      Gj(m || e, function (y, g) {
        m && ((g = y), (y = e[g])), qj(s, g, Is(y, t, r, g, e, i));
      }),
      s
    );
  }
  var ty = Is,
    ry = {};
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
  })(ry);
  var $l, zp;
  function Mu() {
    return zp || ((zp = 1), ($l = {})), $l;
  }
  var mt = ry,
    kF = Mu(),
    Up = Array.prototype.push;
  function BF(e, t) {
    return t == 2
      ? function (r, n) {
          return e.apply(void 0, arguments);
        }
      : function (r) {
          return e.apply(void 0, arguments);
        };
  }
  function bl(e, t) {
    return t == 2
      ? function (r, n) {
          return e(r, n);
        }
      : function (r) {
          return e(r);
        };
  }
  function Wp(e) {
    for (var t = e ? e.length : 0, r = Array(t); t--; ) r[t] = e[t];
    return r;
  }
  function zF(e) {
    return function (t) {
      return e({}, t);
    };
  }
  function UF(e, t) {
    return function () {
      for (var r = arguments.length, n = r - 1, o = Array(r); r--; )
        o[r] = arguments[r];
      var i = o[t],
        s = o.slice(0, t);
      return (
        i && Up.apply(s, i),
        t != n && Up.apply(s, o.slice(t + 1)),
        e.apply(this, s)
      );
    };
  }
  function wl(e, t) {
    return function () {
      var r = arguments.length;
      if (r) {
        for (var n = Array(r); r--; ) n[r] = arguments[r];
        var o = (n[0] = t.apply(void 0, n));
        return e.apply(void 0, n), o;
      }
    };
  }
  function gc(e, t, r, n) {
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
      a = o ? r : kF,
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
      y = d.curry,
      g = d.forEach,
      _ = d.isArray,
      E = d.isError,
      S = d.isFunction,
      I = d.isWeakMap,
      A = d.keys,
      O = d.rearg,
      L = d.toInteger,
      z = d.toPath,
      H = A(mt.aryMethod),
      ne = {
        castArray: function ($) {
          return function () {
            var N = arguments[0];
            return _(N) ? $(Wp(N)) : $.apply(void 0, arguments);
          };
        },
        iteratee: function ($) {
          return function () {
            var N = arguments[0],
              j = arguments[1],
              F = $(N, j),
              q = F.length;
            return s.cap && typeof j == "number"
              ? ((j = j > 2 ? j - 2 : 1), q && q <= j ? F : bl(F, j))
              : F;
          };
        },
        mixin: function ($) {
          return function (N) {
            var j = this;
            if (!S(j)) return $(j, Object(N));
            var F = [];
            return (
              g(A(N), function (q) {
                S(N[q]) && F.push([q, j.prototype[q]]);
              }),
              $(j, Object(N)),
              g(F, function (q) {
                var oe = q[1];
                S(oe) ? (j.prototype[q[0]] = oe) : delete j.prototype[q[0]];
              }),
              j
            );
          };
        },
        nthArg: function ($) {
          return function (N) {
            var j = N < 0 ? 1 : L(N) + 1;
            return y($(N), j);
          };
        },
        rearg: function ($) {
          return function (N, j) {
            var F = j ? j.length : 0;
            return y($(N, j), F);
          };
        },
        runInContext: function ($) {
          return function (N) {
            return gc(e, $(N), n);
          };
        },
      };
    function G($, N) {
      if (s.cap) {
        var j = mt.iterateeRearg[$];
        if (j) return ee(N, j);
        var F = !o && mt.iterateeAry[$];
        if (F) return Ue(N, F);
      }
      return N;
    }
    function Ne($, N, j) {
      return l || (s.curry && j > 1) ? y(N, j) : N;
    }
    function ue($, N, j) {
      if (s.fixed && (c || !mt.skipFixed[$])) {
        var F = mt.methodSpread[$],
          q = F && F.start;
        return q === void 0 ? p(N, j) : UF(N, q);
      }
      return N;
    }
    function Pe($, N, j) {
      return s.rearg && j > 1 && (u || !mt.skipRearg[$])
        ? O(N, mt.methodRearg[$] || mt.aryRearg[j])
        : N;
    }
    function be($, N) {
      N = z(N);
      for (
        var j = -1, F = N.length, q = F - 1, oe = m(Object($)), we = oe;
        we != null && ++j < F;

      ) {
        var Ie = N[j],
          tt = we[Ie];
        tt != null &&
          !(S(tt) || E(tt) || I(tt)) &&
          (we[Ie] = m(j == q ? tt : Object(tt))),
          (we = we[Ie]);
      }
      return oe;
    }
    function le($) {
      return P.runInContext.convert($)(void 0);
    }
    function ve($, N) {
      var j = mt.aliasToReal[$] || $,
        F = mt.remap[j] || j,
        q = n;
      return function (oe) {
        var we = o ? f : d,
          Ie = o ? f[F] : N,
          tt = h(h({}, q), oe);
        return gc(we, j, Ie, tt);
      };
    }
    function Ue($, N) {
      return R($, function (j) {
        return typeof j == "function" ? bl(j, N) : j;
      });
    }
    function ee($, N) {
      return R($, function (j) {
        var F = N.length;
        return BF(O(bl(j, F), N), F);
      });
    }
    function R($, N) {
      return function () {
        var j = arguments.length;
        if (!j) return $();
        for (var F = Array(j); j--; ) F[j] = arguments[j];
        var q = s.rearg ? 0 : j - 1;
        return (F[q] = N(F[q])), $.apply(void 0, F);
      };
    }
    function M($, N, j) {
      var F,
        q = mt.aliasToReal[$] || $,
        oe = N,
        we = ne[q];
      return (
        we
          ? (oe = we(N))
          : s.immutable &&
            (mt.mutate.array[q]
              ? (oe = wl(N, Wp))
              : mt.mutate.object[q]
                ? (oe = wl(N, zF(N)))
                : mt.mutate.set[q] && (oe = wl(N, be))),
        g(H, function (Ie) {
          return (
            g(mt.aryMethod[Ie], function (tt) {
              if (q == tt) {
                var w = mt.methodSpread[q],
                  T = w && w.afterRearg;
                return (
                  (F = T ? ue(q, Pe(q, oe, Ie), Ie) : Pe(q, ue(q, oe, Ie), Ie)),
                  (F = G(q, F)),
                  (F = Ne(q, F, Ie)),
                  !1
                );
              }
            }),
            !F
          );
        }),
        F || (F = oe),
        F == N &&
          (F = l
            ? y(F, 1)
            : function () {
                return N.apply(this, arguments);
              }),
        (F.convert = ve(q, N)),
        (F.placeholder = N.placeholder = j),
        F
      );
    }
    if (!i) return M(t, r, a);
    var P = r,
      v = [];
    return (
      g(H, function ($) {
        g(mt.aryMethod[$], function (N) {
          var j = P[mt.remap[N] || N];
          j && v.push([N, M(N, j, P)]);
        });
      }),
      g(A(P), function ($) {
        var N = P[$];
        if (typeof N == "function") {
          for (var j = v.length; j--; ) if (v[j][0] == $) return;
          (N.convert = ve($, N)), v.push([$, N]);
        }
      }),
      g(v, function ($) {
        P[$[0]] = $[1];
      }),
      (P.convert = le),
      (P.placeholder = P),
      g(A(P), function ($) {
        g(mt.realToAlias[$] || [], function (N) {
          P[N] = P[$];
        });
      }),
      P
    );
  }
  var WF = gc,
    Hp = Pv,
    HF = Hp && new Hp(),
    ny = HF,
    KF = qa,
    Kp = ny,
    GF = Kp
      ? function (e, t) {
          return Kp.set(e, t), e;
        }
      : KF,
    oy = GF,
    qF = Ga,
    YF = er;
  function JF(e) {
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
      var r = qF(e.prototype),
        n = e.apply(r, t);
      return YF(n) ? n : r;
    };
  }
  var Ya = JF,
    XF = Ya,
    ZF = Bt,
    QF = 1;
  function eL(e, t, r) {
    var n = t & QF,
      o = XF(e);
    function i() {
      var s = this && this !== ZF && this instanceof i ? o : e;
      return s.apply(n ? r : this, arguments);
    }
    return i;
  }
  var tL = eL,
    rL = Math.max;
  function nL(e, t, r, n) {
    for (
      var o = -1,
        i = e.length,
        s = r.length,
        a = -1,
        l = t.length,
        c = rL(i - s, 0),
        u = Array(l + c),
        f = !n;
      ++a < l;

    )
      u[a] = t[a];
    for (; ++o < s; ) (f || o < i) && (u[r[o]] = e[o]);
    for (; c--; ) u[a++] = e[o++];
    return u;
  }
  var iy = nL,
    oL = Math.max;
  function iL(e, t, r, n) {
    for (
      var o = -1,
        i = e.length,
        s = -1,
        a = r.length,
        l = -1,
        c = t.length,
        u = oL(i - a, 0),
        f = Array(u + c),
        d = !n;
      ++o < u;

    )
      f[o] = e[o];
    for (var p = o; ++l < c; ) f[p + l] = t[l];
    for (; ++s < a; ) (d || o < i) && (f[p + r[s]] = e[o++]);
    return f;
  }
  var sy = iL;
  function sL(e, t) {
    for (var r = e.length, n = 0; r--; ) e[r] === t && ++n;
    return n;
  }
  var aL = sL;
  function lL() {}
  var ju = lL,
    cL = Ga,
    uL = ju,
    fL = 4294967295;
  function ia(e) {
    (this.__wrapped__ = e),
      (this.__actions__ = []),
      (this.__dir__ = 1),
      (this.__filtered__ = !1),
      (this.__iteratees__ = []),
      (this.__takeCount__ = fL),
      (this.__views__ = []);
  }
  ia.prototype = cL(uL.prototype);
  ia.prototype.constructor = ia;
  var Fu = ia;
  function dL() {}
  var pL = dL,
    Gp = ny,
    hL = pL,
    gL = Gp
      ? function (e) {
          return Gp.get(e);
        }
      : hL,
    ay = gL,
    mL = {},
    vL = mL,
    qp = vL,
    yL = Object.prototype,
    _L = yL.hasOwnProperty;
  function $L(e) {
    for (
      var t = e.name + "", r = qp[t], n = _L.call(qp, t) ? r.length : 0;
      n--;

    ) {
      var o = r[n],
        i = o.func;
      if (i == null || i == e) return o.name;
    }
    return t;
  }
  var bL = $L,
    wL = Ga,
    EL = ju;
  function sa(e, t) {
    (this.__wrapped__ = e),
      (this.__actions__ = []),
      (this.__chain__ = !!t),
      (this.__index__ = 0),
      (this.__values__ = void 0);
  }
  sa.prototype = wL(EL.prototype);
  sa.prototype.constructor = sa;
  var ly = sa,
    OL = Fu,
    SL = ly,
    AL = Ji;
  function NL(e) {
    if (e instanceof OL) return e.clone();
    var t = new SL(e.__wrapped__, e.__chain__);
    return (
      (t.__actions__ = AL(e.__actions__)),
      (t.__index__ = e.__index__),
      (t.__values__ = e.__values__),
      t
    );
  }
  var PL = NL,
    CL = Fu,
    Yp = ly,
    TL = ju,
    xL = zt,
    DL = tr,
    IL = PL,
    RL = Object.prototype,
    ML = RL.hasOwnProperty;
  function aa(e) {
    if (DL(e) && !xL(e) && !(e instanceof CL)) {
      if (e instanceof Yp) return e;
      if (ML.call(e, "__wrapped__")) return IL(e);
    }
    return new Yp(e);
  }
  aa.prototype = TL.prototype;
  aa.prototype.constructor = aa;
  var jL = aa,
    FL = Fu,
    LL = ay,
    VL = bL,
    kL = jL;
  function BL(e) {
    var t = VL(e),
      r = kL[t];
    if (typeof r != "function" || !(t in FL.prototype)) return !1;
    if (e === r) return !0;
    var n = LL(r);
    return !!n && e === n[0];
  }
  var zL = BL,
    UL = oy,
    WL = Kv,
    HL = WL(UL),
    cy = HL,
    KL = /\{\n\/\* \[wrapped with (.+)\] \*/,
    GL = /,? & /;
  function qL(e) {
    var t = e.match(KL);
    return t ? t[1].split(GL) : [];
  }
  var YL = qL,
    JL = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/;
  function XL(e, t) {
    var r = t.length;
    if (!r) return e;
    var n = r - 1;
    return (
      (t[n] = (r > 1 ? "& " : "") + t[n]),
      (t = t.join(r > 2 ? ", " : " ")),
      e.replace(
        JL,
        `{
/* [wrapped with ` +
          t +
          `] */
`
      )
    );
  }
  var ZL = XL;
  function QL(e, t, r, n) {
    for (var o = e.length, i = r + (n ? 1 : -1); n ? i-- : ++i < o; )
      if (t(e[i], i, e)) return i;
    return -1;
  }
  var eV = QL;
  function tV(e) {
    return e !== e;
  }
  var rV = tV;
  function nV(e, t, r) {
    for (var n = r - 1, o = e.length; ++n < o; ) if (e[n] === t) return n;
    return -1;
  }
  var oV = nV,
    iV = eV,
    sV = rV,
    aV = oV;
  function lV(e, t, r) {
    return t === t ? aV(e, t, r) : iV(e, sV, r);
  }
  var cV = lV,
    uV = cV;
  function fV(e, t) {
    var r = e == null ? 0 : e.length;
    return !!r && uV(e, t, 0) > -1;
  }
  var dV = fV,
    pV = Du,
    hV = dV,
    gV = 1,
    mV = 2,
    vV = 8,
    yV = 16,
    _V = 32,
    $V = 64,
    bV = 128,
    wV = 256,
    EV = 512,
    OV = [
      ["ary", bV],
      ["bind", gV],
      ["bindKey", mV],
      ["curry", vV],
      ["curryRight", yV],
      ["flip", EV],
      ["partial", _V],
      ["partialRight", $V],
      ["rearg", wV],
    ];
  function SV(e, t) {
    return (
      pV(OV, function (r) {
        var n = "_." + r[0];
        t & r[1] && !hV(e, n) && e.push(n);
      }),
      e.sort()
    );
  }
  var AV = SV,
    NV = YL,
    PV = ZL,
    CV = xu,
    TV = AV;
  function xV(e, t, r) {
    var n = t + "";
    return CV(e, PV(n, TV(NV(n), r)));
  }
  var uy = xV,
    DV = zL,
    IV = cy,
    RV = uy,
    MV = 1,
    jV = 2,
    FV = 4,
    LV = 8,
    Jp = 32,
    Xp = 64;
  function VV(e, t, r, n, o, i, s, a, l, c) {
    var u = t & LV,
      f = u ? s : void 0,
      d = u ? void 0 : s,
      p = u ? i : void 0,
      h = u ? void 0 : i;
    (t |= u ? Jp : Xp), (t &= ~(u ? Xp : Jp)), t & FV || (t &= ~(MV | jV));
    var m = [e, t, o, p, f, h, d, a, l, c],
      y = r.apply(void 0, m);
    return DV(e) && IV(y, m), (y.placeholder = n), RV(y, e, t);
  }
  var fy = VV;
  function kV(e) {
    var t = e;
    return t.placeholder;
  }
  var dy = kV,
    BV = Ji,
    zV = qi,
    UV = Math.min;
  function WV(e, t) {
    for (var r = e.length, n = UV(t.length, r), o = BV(e); n--; ) {
      var i = t[n];
      e[n] = zV(i, r) ? o[i] : void 0;
    }
    return e;
  }
  var HV = WV,
    Zp = "__lodash_placeholder__";
  function KV(e, t) {
    for (var r = -1, n = e.length, o = 0, i = []; ++r < n; ) {
      var s = e[r];
      (s === t || s === Zp) && ((e[r] = Zp), (i[o++] = r));
    }
    return i;
  }
  var Lu = KV,
    GV = iy,
    qV = sy,
    YV = aL,
    Qp = Ya,
    JV = fy,
    XV = dy,
    ZV = HV,
    QV = Lu,
    e2 = Bt,
    t2 = 1,
    r2 = 2,
    n2 = 8,
    o2 = 16,
    i2 = 128,
    s2 = 512;
  function py(e, t, r, n, o, i, s, a, l, c) {
    var u = t & i2,
      f = t & t2,
      d = t & r2,
      p = t & (n2 | o2),
      h = t & s2,
      m = d ? void 0 : Qp(e);
    function y() {
      for (var g = arguments.length, _ = Array(g), E = g; E--; )
        _[E] = arguments[E];
      if (p)
        var S = XV(y),
          I = YV(_, S);
      if (
        (n && (_ = GV(_, n, o, p)),
        i && (_ = qV(_, i, s, p)),
        (g -= I),
        p && g < c)
      ) {
        var A = QV(_, S);
        return JV(e, t, py, y.placeholder, r, _, A, a, l, c - g);
      }
      var O = f ? r : this,
        L = d ? O[e] : e;
      return (
        (g = _.length),
        a ? (_ = ZV(_, a)) : h && g > 1 && _.reverse(),
        u && l < g && (_.length = l),
        this && this !== e2 && this instanceof y && (L = m || Qp(L)),
        L.apply(O, _)
      );
    }
    return y;
  }
  var hy = py,
    a2 = Tu,
    l2 = Ya,
    c2 = hy,
    u2 = fy,
    f2 = dy,
    d2 = Lu,
    p2 = Bt;
  function h2(e, t, r) {
    var n = l2(e);
    function o() {
      for (var i = arguments.length, s = Array(i), a = i, l = f2(o); a--; )
        s[a] = arguments[a];
      var c = i < 3 && s[0] !== l && s[i - 1] !== l ? [] : d2(s, l);
      if (((i -= c.length), i < r))
        return u2(e, t, c2, o.placeholder, void 0, s, c, void 0, void 0, r - i);
      var u = this && this !== p2 && this instanceof o ? n : e;
      return a2(u, this, s);
    }
    return o;
  }
  var g2 = h2,
    m2 = Tu,
    v2 = Ya,
    y2 = Bt,
    _2 = 1;
  function $2(e, t, r, n) {
    var o = t & _2,
      i = v2(e);
    function s() {
      for (
        var a = -1,
          l = arguments.length,
          c = -1,
          u = n.length,
          f = Array(u + l),
          d = this && this !== y2 && this instanceof s ? i : e;
        ++c < u;

      )
        f[c] = n[c];
      for (; l--; ) f[c++] = arguments[++a];
      return m2(d, o ? r : this, f);
    }
    return s;
  }
  var b2 = $2,
    w2 = iy,
    E2 = sy,
    eh = Lu,
    th = "__lodash_placeholder__",
    El = 1,
    O2 = 2,
    S2 = 4,
    rh = 8,
    oi = 128,
    nh = 256,
    A2 = Math.min;
  function N2(e, t) {
    var r = e[1],
      n = t[1],
      o = r | n,
      i = o < (El | O2 | oi),
      s =
        (n == oi && r == rh) ||
        (n == oi && r == nh && e[7].length <= t[8]) ||
        (n == (oi | nh) && t[7].length <= t[8] && r == rh);
    if (!(i || s)) return e;
    n & El && ((e[2] = t[2]), (o |= r & El ? 0 : S2));
    var a = t[3];
    if (a) {
      var l = e[3];
      (e[3] = l ? w2(l, a, t[4]) : a), (e[4] = l ? eh(e[3], th) : t[4]);
    }
    return (
      (a = t[5]),
      a &&
        ((l = e[5]),
        (e[5] = l ? E2(l, a, t[6]) : a),
        (e[6] = l ? eh(e[5], th) : t[6])),
      (a = t[7]),
      a && (e[7] = a),
      n & oi && (e[8] = e[8] == null ? t[8] : A2(e[8], t[8])),
      e[9] == null && (e[9] = t[9]),
      (e[0] = t[0]),
      (e[1] = o),
      e
    );
  }
  var P2 = N2,
    C2 = /\s/;
  function T2(e) {
    for (var t = e.length; t-- && C2.test(e.charAt(t)); );
    return t;
  }
  var x2 = T2,
    D2 = x2,
    I2 = /^\s+/;
  function R2(e) {
    return e && e.slice(0, D2(e) + 1).replace(I2, "");
  }
  var M2 = R2,
    j2 = M2,
    oh = er,
    F2 = Gi,
    ih = NaN,
    L2 = /^[-+]0x[0-9a-f]+$/i,
    V2 = /^0b[01]+$/i,
    k2 = /^0o[0-7]+$/i,
    B2 = parseInt;
  function z2(e) {
    if (typeof e == "number") return e;
    if (F2(e)) return ih;
    if (oh(e)) {
      var t = typeof e.valueOf == "function" ? e.valueOf() : e;
      e = oh(t) ? t + "" : t;
    }
    if (typeof e != "string") return e === 0 ? e : +e;
    e = j2(e);
    var r = V2.test(e);
    return r || k2.test(e) ? B2(e.slice(2), r ? 2 : 8) : L2.test(e) ? ih : +e;
  }
  var U2 = z2,
    W2 = U2,
    sh = 1 / 0,
    H2 = 17976931348623157e292;
  function K2(e) {
    if (!e) return e === 0 ? e : 0;
    if (((e = W2(e)), e === sh || e === -sh)) {
      var t = e < 0 ? -1 : 1;
      return t * H2;
    }
    return e === e ? e : 0;
  }
  var G2 = K2,
    q2 = G2;
  function Y2(e) {
    var t = q2(e),
      r = t % 1;
    return t === t ? (r ? t - r : t) : 0;
  }
  var gy = Y2,
    J2 = oy,
    X2 = tL,
    Z2 = g2,
    Q2 = hy,
    ek = b2,
    tk = ay,
    rk = P2,
    nk = cy,
    ok = uy,
    ah = gy,
    ik = "Expected a function",
    lh = 1,
    sk = 2,
    Ol = 8,
    Sl = 16,
    Al = 32,
    ch = 64,
    uh = Math.max;
  function ak(e, t, r, n, o, i, s, a) {
    var l = t & sk;
    if (!l && typeof e != "function") throw new TypeError(ik);
    var c = n ? n.length : 0;
    if (
      (c || ((t &= ~(Al | ch)), (n = o = void 0)),
      (s = s === void 0 ? s : uh(ah(s), 0)),
      (a = a === void 0 ? a : ah(a)),
      (c -= o ? o.length : 0),
      t & ch)
    ) {
      var u = n,
        f = o;
      n = o = void 0;
    }
    var d = l ? void 0 : tk(e),
      p = [e, t, r, n, o, u, f, i, s, a];
    if (
      (d && rk(p, d),
      (e = p[0]),
      (t = p[1]),
      (r = p[2]),
      (n = p[3]),
      (o = p[4]),
      (a = p[9] = p[9] === void 0 ? (l ? 0 : e.length) : uh(p[9] - c, 0)),
      !a && t & (Ol | Sl) && (t &= ~(Ol | Sl)),
      !t || t == lh)
    )
      var h = X2(e, t, r);
    else
      t == Ol || t == Sl
        ? (h = Z2(e, t, a))
        : (t == Al || t == (lh | Al)) && !o.length
          ? (h = ek(e, t, r, n))
          : (h = Q2.apply(void 0, p));
    var m = d ? J2 : nk;
    return ok(m(h, p), e, t);
  }
  var Vu = ak,
    lk = Vu,
    ck = 128;
  function uk(e, t, r) {
    return (
      (t = r ? void 0 : t),
      (t = e && t == null ? e.length : t),
      lk(e, ck, void 0, void 0, void 0, void 0, t)
    );
  }
  var fk = uk,
    dk = ty,
    pk = 4;
  function hk(e) {
    return dk(e, pk);
  }
  var gk = hk,
    mk = Vu,
    vk = 8;
  function ku(e, t, r) {
    t = r ? void 0 : t;
    var n = mk(e, vk, void 0, void 0, void 0, void 0, void 0, t);
    return (n.placeholder = ku.placeholder), n;
  }
  ku.placeholder = {};
  var yk = ku,
    _k = lo,
    $k = tr,
    bk = zv,
    wk = "[object DOMException]",
    Ek = "[object Error]";
  function Ok(e) {
    if (!$k(e)) return !1;
    var t = _k(e);
    return (
      t == Ek ||
      t == wk ||
      (typeof e.message == "string" && typeof e.name == "string" && !bk(e))
    );
  }
  var Sk = Ok,
    Ak = Ki,
    Nk = tr,
    Pk = "[object WeakMap]";
  function Ck(e) {
    return Nk(e) && Ak(e) == Pk;
  }
  var Tk = Ck,
    xk = "__lodash_hash_undefined__";
  function Dk(e) {
    return this.__data__.set(e, xk), this;
  }
  var Ik = Dk;
  function Rk(e) {
    return this.__data__.has(e);
  }
  var Mk = Rk,
    jk = Su,
    Fk = Ik,
    Lk = Mk;
  function la(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.__data__ = new jk(); ++t < r; ) this.add(e[t]);
  }
  la.prototype.add = la.prototype.push = Fk;
  la.prototype.has = Lk;
  var Vk = la;
  function kk(e, t) {
    for (var r = -1, n = e == null ? 0 : e.length; ++r < n; )
      if (t(e[r], r, e)) return !0;
    return !1;
  }
  var Bk = kk;
  function zk(e, t) {
    return e.has(t);
  }
  var Uk = zk,
    Wk = Vk,
    Hk = Bk,
    Kk = Uk,
    Gk = 1,
    qk = 2;
  function Yk(e, t, r, n, o, i) {
    var s = r & Gk,
      a = e.length,
      l = t.length;
    if (a != l && !(s && l > a)) return !1;
    var c = i.get(e),
      u = i.get(t);
    if (c && u) return c == t && u == e;
    var f = -1,
      d = !0,
      p = r & qk ? new Wk() : void 0;
    for (i.set(e, t), i.set(t, e); ++f < a; ) {
      var h = e[f],
        m = t[f];
      if (n) var y = s ? n(m, h, f, t, e, i) : n(h, m, f, e, t, i);
      if (y !== void 0) {
        if (y) continue;
        d = !1;
        break;
      }
      if (p) {
        if (
          !Hk(t, function (g, _) {
            if (!Kk(p, _) && (h === g || o(h, g, r, n, i))) return p.push(_);
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
  var my = Yk;
  function Jk(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (n, o) {
        r[++t] = [o, n];
      }),
      r
    );
  }
  var Xk = Jk;
  function Zk(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (n) {
        r[++t] = n;
      }),
      r
    );
  }
  var Qk = Zk,
    fh = jo,
    dh = Lv,
    e3 = Yi,
    t3 = my,
    r3 = Xk,
    n3 = Qk,
    o3 = 1,
    i3 = 2,
    s3 = "[object Boolean]",
    a3 = "[object Date]",
    l3 = "[object Error]",
    c3 = "[object Map]",
    u3 = "[object Number]",
    f3 = "[object RegExp]",
    d3 = "[object Set]",
    p3 = "[object String]",
    h3 = "[object Symbol]",
    g3 = "[object ArrayBuffer]",
    m3 = "[object DataView]",
    ph = fh ? fh.prototype : void 0,
    Nl = ph ? ph.valueOf : void 0;
  function v3(e, t, r, n, o, i, s) {
    switch (r) {
      case m3:
        if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
          return !1;
        (e = e.buffer), (t = t.buffer);
      case g3:
        return !(e.byteLength != t.byteLength || !i(new dh(e), new dh(t)));
      case s3:
      case a3:
      case u3:
        return e3(+e, +t);
      case l3:
        return e.name == t.name && e.message == t.message;
      case f3:
      case p3:
        return e == t + "";
      case c3:
        var a = r3;
      case d3:
        var l = n & o3;
        if ((a || (a = n3), e.size != t.size && !l)) return !1;
        var c = s.get(e);
        if (c) return c == t;
        (n |= i3), s.set(e, t);
        var u = t3(a(e), a(t), n, o, i, s);
        return s.delete(e), u;
      case h3:
        if (Nl) return Nl.call(e) == Nl.call(t);
    }
    return !1;
  }
  var y3 = v3,
    hh = Xv,
    _3 = 1,
    $3 = Object.prototype,
    b3 = $3.hasOwnProperty;
  function w3(e, t, r, n, o, i) {
    var s = r & _3,
      a = hh(e),
      l = a.length,
      c = hh(t),
      u = c.length;
    if (l != u && !s) return !1;
    for (var f = l; f--; ) {
      var d = a[f];
      if (!(s ? d in t : b3.call(t, d))) return !1;
    }
    var p = i.get(e),
      h = i.get(t);
    if (p && h) return p == t && h == e;
    var m = !0;
    i.set(e, t), i.set(t, e);
    for (var y = s; ++f < l; ) {
      d = a[f];
      var g = e[d],
        _ = t[d];
      if (n) var E = s ? n(_, g, d, t, e, i) : n(g, _, d, e, t, i);
      if (!(E === void 0 ? g === _ || o(g, _, r, n, i) : E)) {
        m = !1;
        break;
      }
      y || (y = d == "constructor");
    }
    if (m && !y) {
      var S = e.constructor,
        I = t.constructor;
      S != I &&
        "constructor" in e &&
        "constructor" in t &&
        !(
          typeof S == "function" &&
          S instanceof S &&
          typeof I == "function" &&
          I instanceof I
        ) &&
        (m = !1);
    }
    return i.delete(e), i.delete(t), m;
  }
  var E3 = w3,
    Pl = Ka,
    O3 = my,
    S3 = y3,
    A3 = E3,
    gh = Ki,
    mh = zt,
    vh = ka,
    N3 = Ou,
    P3 = 1,
    yh = "[object Arguments]",
    _h = "[object Array]",
    $s = "[object Object]",
    C3 = Object.prototype,
    $h = C3.hasOwnProperty;
  function T3(e, t, r, n, o, i) {
    var s = mh(e),
      a = mh(t),
      l = s ? _h : gh(e),
      c = a ? _h : gh(t);
    (l = l == yh ? $s : l), (c = c == yh ? $s : c);
    var u = l == $s,
      f = c == $s,
      d = l == c;
    if (d && vh(e)) {
      if (!vh(t)) return !1;
      (s = !0), (u = !1);
    }
    if (d && !u)
      return (
        i || (i = new Pl()),
        s || N3(e) ? O3(e, t, r, n, o, i) : S3(e, t, l, r, n, o, i)
      );
    if (!(r & P3)) {
      var p = u && $h.call(e, "__wrapped__"),
        h = f && $h.call(t, "__wrapped__");
      if (p || h) {
        var m = p ? e.value() : e,
          y = h ? t.value() : t;
        return i || (i = new Pl()), o(m, y, r, n, i);
      }
    }
    return d ? (i || (i = new Pl()), A3(e, t, r, n, o, i)) : !1;
  }
  var x3 = T3,
    D3 = x3,
    bh = tr;
  function vy(e, t, r, n, o) {
    return e === t
      ? !0
      : e == null || t == null || (!bh(e) && !bh(t))
        ? e !== e && t !== t
        : D3(e, t, r, n, vy, o);
  }
  var yy = vy,
    I3 = Ka,
    R3 = yy,
    M3 = 1,
    j3 = 2;
  function F3(e, t, r, n) {
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
        var f = new I3();
        if (n) var d = n(c, u, l, e, t, f);
        if (!(d === void 0 ? R3(u, c, M3 | j3, n, f) : d)) return !1;
      }
    }
    return !0;
  }
  var L3 = F3,
    V3 = er;
  function k3(e) {
    return e === e && !V3(e);
  }
  var _y = k3,
    B3 = _y,
    z3 = Ba;
  function U3(e) {
    for (var t = z3(e), r = t.length; r--; ) {
      var n = t[r],
        o = e[n];
      t[r] = [n, o, B3(o)];
    }
    return t;
  }
  var W3 = U3;
  function H3(e, t) {
    return function (r) {
      return r == null ? !1 : r[e] === t && (t !== void 0 || e in Object(r));
    };
  }
  var $y = H3,
    K3 = L3,
    G3 = W3,
    q3 = $y;
  function Y3(e) {
    var t = G3(e);
    return t.length == 1 && t[0][2]
      ? q3(t[0][0], t[0][1])
      : function (r) {
          return r === e || K3(r, e, t);
        };
  }
  var J3 = Y3,
    X3 = zt,
    Z3 = Gi,
    Q3 = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    eB = /^\w*$/;
  function tB(e, t) {
    if (X3(e)) return !1;
    var r = typeof e;
    return r == "number" ||
      r == "symbol" ||
      r == "boolean" ||
      e == null ||
      Z3(e)
      ? !0
      : eB.test(e) || !Q3.test(e) || (t != null && e in Object(t));
  }
  var Bu = tB,
    by = Su,
    rB = "Expected a function";
  function zu(e, t) {
    if (typeof e != "function" || (t != null && typeof t != "function"))
      throw new TypeError(rB);
    var r = function () {
      var n = arguments,
        o = t ? t.apply(this, n) : n[0],
        i = r.cache;
      if (i.has(o)) return i.get(o);
      var s = e.apply(this, n);
      return (r.cache = i.set(o, s) || i), s;
    };
    return (r.cache = new (zu.Cache || by)()), r;
  }
  zu.Cache = by;
  var nB = zu,
    oB = nB,
    iB = 500;
  function sB(e) {
    var t = oB(e, function (n) {
        return r.size === iB && r.clear(), n;
      }),
      r = t.cache;
    return t;
  }
  var aB = sB,
    lB = aB,
    cB =
      /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
    uB = /\\(\\)?/g,
    fB = lB(function (e) {
      var t = [];
      return (
        e.charCodeAt(0) === 46 && t.push(""),
        e.replace(cB, function (r, n, o, i) {
          t.push(o ? i.replace(uB, "$1") : n || r);
        }),
        t
      );
    }),
    wy = fB,
    dB = zt,
    pB = Bu,
    hB = wy,
    gB = Iv;
  function mB(e, t) {
    return dB(e) ? e : pB(e, t) ? [e] : hB(gB(e));
  }
  var Ja = mB,
    vB = Gi,
    yB = 1 / 0;
  function _B(e) {
    if (typeof e == "string" || vB(e)) return e;
    var t = e + "";
    return t == "0" && 1 / e == -yB ? "-0" : t;
  }
  var uo = _B,
    $B = Ja,
    bB = uo;
  function wB(e, t) {
    t = $B(t, e);
    for (var r = 0, n = t.length; e != null && r < n; ) e = e[bB(t[r++])];
    return r && r == n ? e : void 0;
  }
  var Uu = wB,
    EB = Uu;
  function OB(e, t, r) {
    var n = e == null ? void 0 : EB(e, t);
    return n === void 0 ? r : n;
  }
  var SB = OB;
  function AB(e, t) {
    return e != null && t in Object(e);
  }
  var NB = AB,
    PB = Ja,
    CB = La,
    TB = zt,
    xB = qi,
    DB = bu,
    IB = uo;
  function RB(e, t, r) {
    t = PB(t, e);
    for (var n = -1, o = t.length, i = !1; ++n < o; ) {
      var s = IB(t[n]);
      if (!(i = e != null && r(e, s))) break;
      e = e[s];
    }
    return i || ++n != o
      ? i
      : ((o = e == null ? 0 : e.length),
        !!o && DB(o) && xB(s, o) && (TB(e) || CB(e)));
  }
  var MB = RB,
    jB = NB,
    FB = MB;
  function LB(e, t) {
    return e != null && FB(e, t, jB);
  }
  var VB = LB,
    kB = yy,
    BB = SB,
    zB = VB,
    UB = Bu,
    WB = _y,
    HB = $y,
    KB = uo,
    GB = 1,
    qB = 2;
  function YB(e, t) {
    return UB(e) && WB(t)
      ? HB(KB(e), t)
      : function (r) {
          var n = BB(r, e);
          return n === void 0 && n === t ? zB(r, e) : kB(t, n, GB | qB);
        };
  }
  var JB = YB;
  function XB(e) {
    return function (t) {
      return t == null ? void 0 : t[e];
    };
  }
  var ZB = XB,
    QB = Uu;
  function ez(e) {
    return function (t) {
      return QB(t, e);
    };
  }
  var tz = ez,
    rz = ZB,
    nz = tz,
    oz = Bu,
    iz = uo;
  function sz(e) {
    return oz(e) ? rz(iz(e)) : nz(e);
  }
  var az = sz,
    lz = J3,
    cz = JB,
    uz = qa,
    fz = zt,
    dz = az;
  function pz(e) {
    return typeof e == "function"
      ? e
      : e == null
        ? uz
        : typeof e == "object"
          ? fz(e)
            ? cz(e[0], e[1])
            : lz(e)
          : dz(e);
  }
  var hz = pz,
    gz = ty,
    mz = hz,
    vz = 1;
  function yz(e) {
    return mz(typeof e == "function" ? e : gz(e, vz));
  }
  var _z = yz,
    wh = jo,
    $z = La,
    bz = zt,
    Eh = wh ? wh.isConcatSpreadable : void 0;
  function wz(e) {
    return bz(e) || $z(e) || !!(Eh && e && e[Eh]);
  }
  var Ez = wz,
    Oz = Ru,
    Sz = Ez;
  function Ey(e, t, r, n, o) {
    var i = -1,
      s = e.length;
    for (r || (r = Sz), o || (o = []); ++i < s; ) {
      var a = e[i];
      t > 0 && r(a)
        ? t > 1
          ? Ey(a, t - 1, r, n, o)
          : Oz(o, a)
        : n || (o[o.length] = a);
    }
    return o;
  }
  var Az = Ey,
    Nz = Az;
  function Pz(e) {
    var t = e == null ? 0 : e.length;
    return t ? Nz(e, 1) : [];
  }
  var Cz = Pz,
    Tz = Cz,
    xz = Hv,
    Dz = xu;
  function Iz(e) {
    return Dz(xz(e, void 0, Tz), e + "");
  }
  var Rz = Iz,
    Mz = Vu,
    jz = Rz,
    Fz = 256,
    Lz = jz(function (e, t) {
      return Mz(e, Fz, void 0, void 0, void 0, t);
    }),
    Vz = Lz,
    kz = xv,
    Bz = Ji,
    zz = zt,
    Uz = Gi,
    Wz = wy,
    Hz = uo,
    Kz = Iv;
  function Gz(e) {
    return zz(e) ? kz(e, Hz) : Uz(e) ? [e] : Bz(Wz(Kz(e)));
  }
  var qz = Gz,
    Yz = {
      ary: fk,
      assign: Gv,
      clone: gk,
      curry: yk,
      forEach: Du,
      isArray: zt,
      isError: Sk,
      isFunction: Fa,
      isWeakMap: Tk,
      iteratee: _z,
      keys: Ov,
      rearg: Vz,
      toInteger: gy,
      toPath: qz,
    },
    Jz = WF,
    Xz = Yz;
  function Zz(e, t, r) {
    return Jz(Xz, e, t, r);
  }
  var Oy = Zz,
    Cl,
    Oh;
  function Qz() {
    if (Oh) return Cl;
    Oh = 1;
    var e = Cu,
      t = Ja,
      r = qi,
      n = er,
      o = uo;
    function i(s, a, l, c) {
      if (!n(s)) return s;
      a = t(a, s);
      for (var u = -1, f = a.length, d = f - 1, p = s; p != null && ++u < f; ) {
        var h = o(a[u]),
          m = l;
        if (h === "__proto__" || h === "constructor" || h === "prototype")
          return s;
        if (u != d) {
          var y = p[h];
          (m = c ? c(y, h, p) : void 0),
            m === void 0 && (m = n(y) ? y : r(a[u + 1]) ? [] : {});
        }
        e(p, h, m), (p = p[h]);
      }
      return s;
    }
    return (Cl = i), Cl;
  }
  var Tl, Sh;
  function e4() {
    if (Sh) return Tl;
    Sh = 1;
    var e = Qz();
    function t(r, n, o) {
      return r == null ? r : e(r, n, o);
    }
    return (Tl = t), Tl;
  }
  var t4 = Oy,
    r4 = t4("set", e4());
  r4.placeholder = Mu();
  function n4(e) {
    var t = e == null ? 0 : e.length;
    return t ? e[t - 1] : void 0;
  }
  var o4 = n4,
    i4 = Uu,
    s4 = jT;
  function a4(e, t) {
    return t.length < 2 ? e : i4(e, s4(t, 0, -1));
  }
  var l4 = a4,
    c4 = Ja,
    u4 = o4,
    f4 = l4,
    d4 = uo;
  function p4(e, t) {
    return (t = c4(t, e)), (e = f4(e, t)), e == null || delete e[d4(u4(t))];
  }
  var h4 = p4,
    xl,
    Ah;
  function g4() {
    if (Ah) return xl;
    Ah = 1;
    var e = h4;
    function t(r, n) {
      return r == null ? !0 : e(r, n);
    }
    return (xl = t), xl;
  }
  var m4 = Oy,
    v4 = m4("unset", g4());
  v4.placeholder = Mu();
  var mc = { exports: {} },
    Sy = {},
    Zt = {},
    Po = {},
    zo = {},
    De = {},
    Co = {};
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
          : (this._str = this._items.reduce((E, S) => `${E}${S}`, ""));
      }
      get names() {
        var _;
        return (_ = this._names) !== null && _ !== void 0
          ? _
          : (this._names = this._items.reduce(
              (E, S) => (S instanceof r && (E[S.str] = (E[S.str] || 0) + 1), E),
              {}
            ));
      }
    }
    (e._Code = n), (e.nil = new n(""));
    function o(g, ..._) {
      const E = [g[0]];
      let S = 0;
      for (; S < _.length; ) a(E, _[S]), E.push(g[++S]);
      return new n(E);
    }
    e._ = o;
    const i = new n("+");
    function s(g, ..._) {
      const E = [p(g[0])];
      let S = 0;
      for (; S < _.length; ) E.push(i), a(E, _[S]), E.push(i, p(g[++S]));
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
    function y(g) {
      return new n(g.toString());
    }
    e.regexpCode = y;
  })(Co);
  var vc = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.ValueScope =
        e.ValueScopeName =
        e.Scope =
        e.varKinds =
        e.UsedValueState =
          void 0);
    const t = Co;
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
        const y = this._scope[p] || (this._scope[p] = []),
          g = y.length;
        return (y[g] = u.ref), d.setValue(u, { property: p, itemIndex: g }), d;
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
          const y = (f[h] = f[h] || /* @__PURE__ */ new Map());
          m.forEach(g => {
            if (y.has(g)) return;
            y.set(g, n.Started);
            let _ = u(g);
            if (_) {
              const E = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
              p = (0, t._)`${p}${E} ${g} = ${_};${this.opts._n}`;
            } else if ((_ = d == null ? void 0 : d(g)))
              p = (0, t._)`${p}${_}${this.opts._n}`;
            else throw new r(g);
            y.set(g, n.Completed);
          });
        }
        return p;
      }
    }
    e.ValueScope = a;
  })(vc);
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
    const t = Co,
      r = vc;
    var n = Co;
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
    var o = vc;
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
      optimizeNames(v, $) {
        return this;
      }
    }
    class s extends i {
      constructor(v, $, N) {
        super(), (this.varKind = v), (this.name = $), (this.rhs = N);
      }
      render({ es5: v, _n: $ }) {
        const N = v ? r.varKinds.var : this.varKind,
          j = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${N} ${this.name}${j};` + $;
      }
      optimizeNames(v, $) {
        if (v[this.name.str])
          return this.rhs && (this.rhs = ue(this.rhs, v, $)), this;
      }
      get names() {
        return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
      }
    }
    class a extends i {
      constructor(v, $, N) {
        super(), (this.lhs = v), (this.rhs = $), (this.sideEffects = N);
      }
      render({ _n: v }) {
        return `${this.lhs} = ${this.rhs};` + v;
      }
      optimizeNames(v, $) {
        if (
          !(this.lhs instanceof t.Name && !v[this.lhs.str] && !this.sideEffects)
        )
          return (this.rhs = ue(this.rhs, v, $)), this;
      }
      get names() {
        const v = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
        return Ne(v, this.rhs);
      }
    }
    class l extends a {
      constructor(v, $, N, j) {
        super(v, N, j), (this.op = $);
      }
      render({ _n: v }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + v;
      }
    }
    class c extends i {
      constructor(v) {
        super(), (this.label = v), (this.names = {});
      }
      render({ _n: v }) {
        return `${this.label}:` + v;
      }
    }
    class u extends i {
      constructor(v) {
        super(), (this.label = v), (this.names = {});
      }
      render({ _n: v }) {
        return `break${this.label ? ` ${this.label}` : ""};` + v;
      }
    }
    class f extends i {
      constructor(v) {
        super(), (this.error = v);
      }
      render({ _n: v }) {
        return `throw ${this.error};` + v;
      }
      get names() {
        return this.error.names;
      }
    }
    class d extends i {
      constructor(v) {
        super(), (this.code = v);
      }
      render({ _n: v }) {
        return `${this.code};` + v;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(v, $) {
        return (this.code = ue(this.code, v, $)), this;
      }
      get names() {
        return this.code instanceof t._CodeOrName ? this.code.names : {};
      }
    }
    class p extends i {
      constructor(v = []) {
        super(), (this.nodes = v);
      }
      render(v) {
        return this.nodes.reduce(($, N) => $ + N.render(v), "");
      }
      optimizeNodes() {
        const { nodes: v } = this;
        let $ = v.length;
        for (; $--; ) {
          const N = v[$].optimizeNodes();
          Array.isArray(N)
            ? v.splice($, 1, ...N)
            : N
              ? (v[$] = N)
              : v.splice($, 1);
        }
        return v.length > 0 ? this : void 0;
      }
      optimizeNames(v, $) {
        const { nodes: N } = this;
        let j = N.length;
        for (; j--; ) {
          const F = N[j];
          F.optimizeNames(v, $) || (Pe(v, F.names), N.splice(j, 1));
        }
        return N.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((v, $) => G(v, $.names), {});
      }
    }
    class h extends p {
      render(v) {
        return "{" + v._n + super.render(v) + "}" + v._n;
      }
    }
    class m extends p {}
    class y extends h {}
    y.kind = "else";
    class g extends h {
      constructor(v, $) {
        super($), (this.condition = v);
      }
      render(v) {
        let $ = `if(${this.condition})` + super.render(v);
        return this.else && ($ += "else " + this.else.render(v)), $;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const v = this.condition;
        if (v === !0) return this.nodes;
        let $ = this.else;
        if ($) {
          const N = $.optimizeNodes();
          $ = this.else = Array.isArray(N) ? new y(N) : N;
        }
        if ($)
          return v === !1
            ? $ instanceof g
              ? $
              : $.nodes
            : this.nodes.length
              ? this
              : new g(be(v), $ instanceof g ? [$] : $.nodes);
        if (!(v === !1 || !this.nodes.length)) return this;
      }
      optimizeNames(v, $) {
        var N;
        if (
          ((this.else =
            (N = this.else) === null || N === void 0
              ? void 0
              : N.optimizeNames(v, $)),
          !!(super.optimizeNames(v, $) || this.else))
        )
          return (this.condition = ue(this.condition, v, $)), this;
      }
      get names() {
        const v = super.names;
        return Ne(v, this.condition), this.else && G(v, this.else.names), v;
      }
    }
    g.kind = "if";
    class _ extends h {}
    _.kind = "for";
    class E extends _ {
      constructor(v) {
        super(), (this.iteration = v);
      }
      render(v) {
        return `for(${this.iteration})` + super.render(v);
      }
      optimizeNames(v, $) {
        if (super.optimizeNames(v, $))
          return (this.iteration = ue(this.iteration, v, $)), this;
      }
      get names() {
        return G(super.names, this.iteration.names);
      }
    }
    class S extends _ {
      constructor(v, $, N, j) {
        super(),
          (this.varKind = v),
          (this.name = $),
          (this.from = N),
          (this.to = j);
      }
      render(v) {
        const $ = v.es5 ? r.varKinds.var : this.varKind,
          { name: N, from: j, to: F } = this;
        return `for(${$} ${N}=${j}; ${N}<${F}; ${N}++)` + super.render(v);
      }
      get names() {
        const v = Ne(super.names, this.from);
        return Ne(v, this.to);
      }
    }
    class I extends _ {
      constructor(v, $, N, j) {
        super(),
          (this.loop = v),
          (this.varKind = $),
          (this.name = N),
          (this.iterable = j);
      }
      render(v) {
        return (
          `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` +
          super.render(v)
        );
      }
      optimizeNames(v, $) {
        if (super.optimizeNames(v, $))
          return (this.iterable = ue(this.iterable, v, $)), this;
      }
      get names() {
        return G(super.names, this.iterable.names);
      }
    }
    class A extends h {
      constructor(v, $, N) {
        super(), (this.name = v), (this.args = $), (this.async = N);
      }
      render(v) {
        return (
          `${this.async ? "async " : ""}function ${this.name}(${this.args})` +
          super.render(v)
        );
      }
    }
    A.kind = "func";
    class O extends p {
      render(v) {
        return "return " + super.render(v);
      }
    }
    O.kind = "return";
    class L extends h {
      render(v) {
        let $ = "try" + super.render(v);
        return (
          this.catch && ($ += this.catch.render(v)),
          this.finally && ($ += this.finally.render(v)),
          $
        );
      }
      optimizeNodes() {
        var v, $;
        return (
          super.optimizeNodes(),
          (v = this.catch) === null || v === void 0 || v.optimizeNodes(),
          ($ = this.finally) === null || $ === void 0 || $.optimizeNodes(),
          this
        );
      }
      optimizeNames(v, $) {
        var N, j;
        return (
          super.optimizeNames(v, $),
          (N = this.catch) === null || N === void 0 || N.optimizeNames(v, $),
          (j = this.finally) === null || j === void 0 || j.optimizeNames(v, $),
          this
        );
      }
      get names() {
        const v = super.names;
        return (
          this.catch && G(v, this.catch.names),
          this.finally && G(v, this.finally.names),
          v
        );
      }
    }
    class z extends h {
      constructor(v) {
        super(), (this.error = v);
      }
      render(v) {
        return `catch(${this.error})` + super.render(v);
      }
    }
    z.kind = "catch";
    class H extends h {
      render(v) {
        return "finally" + super.render(v);
      }
    }
    H.kind = "finally";
    class ne {
      constructor(v, $ = {}) {
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
          (this._extScope = v),
          (this._scope = new r.Scope({ parent: v })),
          (this._nodes = [new m()]);
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(v) {
        return this._scope.name(v);
      }
      // reserves unique name in the external scope
      scopeName(v) {
        return this._extScope.name(v);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(v, $) {
        const N = this._extScope.value(v, $);
        return (
          (
            this._values[N.prefix] ||
            (this._values[N.prefix] = /* @__PURE__ */ new Set())
          ).add(N),
          N
        );
      }
      getScopeValue(v, $) {
        return this._extScope.getValue(v, $);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(v) {
        return this._extScope.scopeRefs(v, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(v, $, N, j) {
        const F = this._scope.toName($);
        return (
          N !== void 0 && j && (this._constants[F.str] = N),
          this._leafNode(new s(v, F, N)),
          F
        );
      }
      // `const` declaration (`var` in es5 mode)
      const(v, $, N) {
        return this._def(r.varKinds.const, v, $, N);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(v, $, N) {
        return this._def(r.varKinds.let, v, $, N);
      }
      // `var` declaration with optional assignment
      var(v, $, N) {
        return this._def(r.varKinds.var, v, $, N);
      }
      // assignment code
      assign(v, $, N) {
        return this._leafNode(new a(v, $, N));
      }
      // `+=` code
      add(v, $) {
        return this._leafNode(new l(v, e.operators.ADD, $));
      }
      // appends passed SafeExpr to code or executes Block
      code(v) {
        return (
          typeof v == "function"
            ? v()
            : v !== t.nil && this._leafNode(new d(v)),
          this
        );
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...v) {
        const $ = ["{"];
        for (const [N, j] of v)
          $.length > 1 && $.push(","),
            $.push(N),
            (N !== j || this.opts.es5) &&
              ($.push(":"), (0, t.addCodeArg)($, j));
        return $.push("}"), new t._Code($);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(v, $, N) {
        if ((this._blockNode(new g(v)), $ && N))
          this.code($).else().code(N).endIf();
        else if ($) this.code($).endIf();
        else if (N) throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(v) {
        return this._elseNode(new g(v));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new y());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(g, y);
      }
      _for(v, $) {
        return this._blockNode(v), $ && this.code($).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(v, $) {
        return this._for(new E(v), $);
      }
      // `for` statement for a range of values
      forRange(
        v,
        $,
        N,
        j,
        F = this.opts.es5 ? r.varKinds.var : r.varKinds.let
      ) {
        const q = this._scope.toName(v);
        return this._for(new S(F, q, $, N), () => j(q));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(v, $, N, j = r.varKinds.const) {
        const F = this._scope.toName(v);
        if (this.opts.es5) {
          const q = $ instanceof t.Name ? $ : this.var("_arr", $);
          return this.forRange("_i", 0, (0, t._)`${q}.length`, oe => {
            this.var(F, (0, t._)`${q}[${oe}]`), N(F);
          });
        }
        return this._for(new I("of", j, F, $), () => N(F));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(v, $, N, j = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(v, (0, t._)`Object.keys(${$})`, N);
        const F = this._scope.toName(v);
        return this._for(new I("in", j, F, $), () => N(F));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(_);
      }
      // `label` statement
      label(v) {
        return this._leafNode(new c(v));
      }
      // `break` statement
      break(v) {
        return this._leafNode(new u(v));
      }
      // `return` statement
      return(v) {
        const $ = new O();
        if ((this._blockNode($), this.code(v), $.nodes.length !== 1))
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(O);
      }
      // `try` statement
      try(v, $, N) {
        if (!$ && !N)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const j = new L();
        if ((this._blockNode(j), this.code(v), $)) {
          const F = this.name("e");
          (this._currNode = j.catch = new z(F)), $(F);
        }
        return (
          N && ((this._currNode = j.finally = new H()), this.code(N)),
          this._endBlockNode(z, H)
        );
      }
      // `throw` statement
      throw(v) {
        return this._leafNode(new f(v));
      }
      // start self-balancing block
      block(v, $) {
        return (
          this._blockStarts.push(this._nodes.length),
          v && this.code(v).endBlock($),
          this
        );
      }
      // end the current self-balancing block
      endBlock(v) {
        const $ = this._blockStarts.pop();
        if ($ === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const N = this._nodes.length - $;
        if (N < 0 || (v !== void 0 && N !== v))
          throw new Error(
            `CodeGen: wrong number of nodes: ${N} vs ${v} expected`
          );
        return (this._nodes.length = $), this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(v, $ = t.nil, N, j) {
        return (
          this._blockNode(new A(v, $, N)), j && this.code(j).endFunc(), this
        );
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(A);
      }
      optimize(v = 1) {
        for (; v-- > 0; )
          this._root.optimizeNodes(),
            this._root.optimizeNames(this._root.names, this._constants);
      }
      _leafNode(v) {
        return this._currNode.nodes.push(v), this;
      }
      _blockNode(v) {
        this._currNode.nodes.push(v), this._nodes.push(v);
      }
      _endBlockNode(v, $) {
        const N = this._currNode;
        if (N instanceof v || ($ && N instanceof $))
          return this._nodes.pop(), this;
        throw new Error(
          `CodeGen: not in block "${$ ? `${v.kind}/${$.kind}` : v.kind}"`
        );
      }
      _elseNode(v) {
        const $ = this._currNode;
        if (!($ instanceof g)) throw new Error('CodeGen: "else" without "if"');
        return (this._currNode = $.else = v), this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const v = this._nodes;
        return v[v.length - 1];
      }
      set _currNode(v) {
        const $ = this._nodes;
        $[$.length - 1] = v;
      }
    }
    e.CodeGen = ne;
    function G(P, v) {
      for (const $ in v) P[$] = (P[$] || 0) + (v[$] || 0);
      return P;
    }
    function Ne(P, v) {
      return v instanceof t._CodeOrName ? G(P, v.names) : P;
    }
    function ue(P, v, $) {
      if (P instanceof t.Name) return N(P);
      if (!j(P)) return P;
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
        return q === void 0 || v[F.str] !== 1 ? F : (delete v[F.str], q);
      }
      function j(F) {
        return (
          F instanceof t._Code &&
          F._items.some(
            q => q instanceof t.Name && v[q.str] === 1 && $[q.str] !== void 0
          )
        );
      }
    }
    function Pe(P, v) {
      for (const $ in v) P[$] = (P[$] || 0) - (v[$] || 0);
    }
    function be(P) {
      return typeof P == "boolean" || typeof P == "number" || P === null
        ? !P
        : (0, t._)`!${M(P)}`;
    }
    e.not = be;
    const le = R(e.operators.AND);
    function ve(...P) {
      return P.reduce(le);
    }
    e.and = ve;
    const Ue = R(e.operators.OR);
    function ee(...P) {
      return P.reduce(Ue);
    }
    e.or = ee;
    function R(P) {
      return (v, $) =>
        v === t.nil ? $ : $ === t.nil ? v : (0, t._)`${M(v)} ${P} ${M($)}`;
    }
    function M(P) {
      return P instanceof t.Name ? P : (0, t._)`(${P})`;
    }
  })(De);
  var Be = {};
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
    const t = De,
      r = Co;
    function n(A) {
      const O = {};
      for (const L of A) O[L] = !0;
      return O;
    }
    e.toHash = n;
    function o(A, O) {
      return typeof O == "boolean"
        ? O
        : Object.keys(O).length === 0
          ? !0
          : (i(A, O), !s(O, A.self.RULES.all));
    }
    e.alwaysValidSchema = o;
    function i(A, O = A.schema) {
      const { opts: L, self: z } = A;
      if (!L.strictSchema || typeof O == "boolean") return;
      const H = z.RULES.keywords;
      for (const ne in O) H[ne] || I(A, `unknown keyword: "${ne}"`);
    }
    e.checkUnknownRules = i;
    function s(A, O) {
      if (typeof A == "boolean") return !A;
      for (const L in A) if (O[L]) return !0;
      return !1;
    }
    e.schemaHasRules = s;
    function a(A, O) {
      if (typeof A == "boolean") return !A;
      for (const L in A) if (L !== "$ref" && O.all[L]) return !0;
      return !1;
    }
    e.schemaHasRulesButRef = a;
    function l({ topSchemaRef: A, schemaPath: O }, L, z, H) {
      if (!H) {
        if (typeof L == "number" || typeof L == "boolean") return L;
        if (typeof L == "string") return (0, t._)`${L}`;
      }
      return (0, t._)`${A}${O}${(0, t.getProperty)(z)}`;
    }
    e.schemaRefOrVal = l;
    function c(A) {
      return d(decodeURIComponent(A));
    }
    e.unescapeFragment = c;
    function u(A) {
      return encodeURIComponent(f(A));
    }
    e.escapeFragment = u;
    function f(A) {
      return typeof A == "number"
        ? `${A}`
        : A.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    e.escapeJsonPointer = f;
    function d(A) {
      return A.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    e.unescapeJsonPointer = d;
    function p(A, O) {
      if (Array.isArray(A)) for (const L of A) O(L);
      else O(A);
    }
    e.eachItem = p;
    function h({
      mergeNames: A,
      mergeToName: O,
      mergeValues: L,
      resultToName: z,
    }) {
      return (H, ne, G, Ne) => {
        const ue =
          G === void 0
            ? ne
            : G instanceof t.Name
              ? (ne instanceof t.Name ? A(H, ne, G) : O(H, ne, G), G)
              : ne instanceof t.Name
                ? (O(H, G, ne), ne)
                : L(ne, G);
        return Ne === t.Name && !(ue instanceof t.Name) ? z(H, ue) : ue;
      };
    }
    e.mergeEvaluated = {
      props: h({
        mergeNames: (A, O, L) =>
          A.if((0, t._)`${L} !== true && ${O} !== undefined`, () => {
            A.if(
              (0, t._)`${O} === true`,
              () => A.assign(L, !0),
              () =>
                A.assign(L, (0, t._)`${L} || {}`).code(
                  (0, t._)`Object.assign(${L}, ${O})`
                )
            );
          }),
        mergeToName: (A, O, L) =>
          A.if((0, t._)`${L} !== true`, () => {
            O === !0
              ? A.assign(L, !0)
              : (A.assign(L, (0, t._)`${L} || {}`), y(A, L, O));
          }),
        mergeValues: (A, O) => (A === !0 ? !0 : { ...A, ...O }),
        resultToName: m,
      }),
      items: h({
        mergeNames: (A, O, L) =>
          A.if((0, t._)`${L} !== true && ${O} !== undefined`, () =>
            A.assign(
              L,
              (0, t._)`${O} === true ? true : ${L} > ${O} ? ${L} : ${O}`
            )
          ),
        mergeToName: (A, O, L) =>
          A.if((0, t._)`${L} !== true`, () =>
            A.assign(L, O === !0 ? !0 : (0, t._)`${L} > ${O} ? ${L} : ${O}`)
          ),
        mergeValues: (A, O) => (A === !0 ? !0 : Math.max(A, O)),
        resultToName: (A, O) => A.var("items", O),
      }),
    };
    function m(A, O) {
      if (O === !0) return A.var("props", !0);
      const L = A.var("props", (0, t._)`{}`);
      return O !== void 0 && y(A, L, O), L;
    }
    e.evaluatedPropsToName = m;
    function y(A, O, L) {
      Object.keys(L).forEach(z =>
        A.assign((0, t._)`${O}${(0, t.getProperty)(z)}`, !0)
      );
    }
    e.setEvaluated = y;
    const g = {};
    function _(A, O) {
      return A.scopeValue("func", {
        ref: O,
        code: g[O.code] || (g[O.code] = new r._Code(O.code)),
      });
    }
    e.useFunc = _;
    var E;
    (function (A) {
      (A[(A.Num = 0)] = "Num"), (A[(A.Str = 1)] = "Str");
    })((E = e.Type || (e.Type = {})));
    function S(A, O, L) {
      if (A instanceof t.Name) {
        const z = O === E.Num;
        return L
          ? z
            ? (0, t._)`"[" + ${A} + "]"`
            : (0, t._)`"['" + ${A} + "']"`
          : z
            ? (0, t._)`"/" + ${A}`
            : (0, t._)`"/" + ${A}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
      }
      return L ? (0, t.getProperty)(A).toString() : "/" + f(A);
    }
    e.getErrorPath = S;
    function I(A, O, L = A.opts.strictSchema) {
      if (L) {
        if (((O = `strict mode: ${O}`), L === !0)) throw new Error(O);
        A.self.logger.warn(O);
      }
    }
    e.checkStrictMode = I;
  })(Be);
  var dr = {};
  Object.defineProperty(dr, "__esModule", { value: !0 });
  const Ot = De,
    y4 = {
      // validation function arguments
      data: new Ot.Name("data"),
      // args passed from referencing schema
      valCxt: new Ot.Name("valCxt"),
      instancePath: new Ot.Name("instancePath"),
      parentData: new Ot.Name("parentData"),
      parentDataProperty: new Ot.Name("parentDataProperty"),
      rootData: new Ot.Name("rootData"),
      dynamicAnchors: new Ot.Name("dynamicAnchors"),
      // function scoped variables
      vErrors: new Ot.Name("vErrors"),
      errors: new Ot.Name("errors"),
      this: new Ot.Name("this"),
      // "globals"
      self: new Ot.Name("self"),
      scope: new Ot.Name("scope"),
      // JTD serialize/parse name for JSON string and position
      json: new Ot.Name("json"),
      jsonPos: new Ot.Name("jsonPos"),
      jsonLen: new Ot.Name("jsonLen"),
      jsonPart: new Ot.Name("jsonPart"),
    };
  dr.default = y4;
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.extendErrors =
        e.resetErrorsCount =
        e.reportExtraError =
        e.reportError =
        e.keyword$DataError =
        e.keywordError =
          void 0);
    const t = De,
      r = Be,
      n = dr;
    (e.keywordError = {
      message: ({ keyword: y }) =>
        (0, t.str)`must pass "${y}" keyword validation`,
    }),
      (e.keyword$DataError = {
        message: ({ keyword: y, schemaType: g }) =>
          g
            ? (0, t.str)`"${y}" keyword must be ${g} ($data)`
            : (0, t.str)`"${y}" keyword is invalid ($data)`,
      });
    function o(y, g = e.keywordError, _, E) {
      const { it: S } = y,
        { gen: I, compositeRule: A, allErrors: O } = S,
        L = f(y, g, _);
      E ?? (A || O) ? l(I, L) : c(S, (0, t._)`[${L}]`);
    }
    e.reportError = o;
    function i(y, g = e.keywordError, _) {
      const { it: E } = y,
        { gen: S, compositeRule: I, allErrors: A } = E,
        O = f(y, g, _);
      l(S, O), I || A || c(E, n.default.vErrors);
    }
    e.reportExtraError = i;
    function s(y, g) {
      y.assign(n.default.errors, g),
        y.if((0, t._)`${n.default.vErrors} !== null`, () =>
          y.if(
            g,
            () => y.assign((0, t._)`${n.default.vErrors}.length`, g),
            () => y.assign(n.default.vErrors, null)
          )
        );
    }
    e.resetErrorsCount = s;
    function a({
      gen: y,
      keyword: g,
      schemaValue: _,
      data: E,
      errsCount: S,
      it: I,
    }) {
      if (S === void 0) throw new Error("ajv implementation error");
      const A = y.name("err");
      y.forRange("i", S, n.default.errors, O => {
        y.const(A, (0, t._)`${n.default.vErrors}[${O}]`),
          y.if((0, t._)`${A}.instancePath === undefined`, () =>
            y.assign(
              (0, t._)`${A}.instancePath`,
              (0, t.strConcat)(n.default.instancePath, I.errorPath)
            )
          ),
          y.assign(
            (0, t._)`${A}.schemaPath`,
            (0, t.str)`${I.errSchemaPath}/${g}`
          ),
          I.opts.verbose &&
            (y.assign((0, t._)`${A}.schema`, _),
            y.assign((0, t._)`${A}.data`, E));
      });
    }
    e.extendErrors = a;
    function l(y, g) {
      const _ = y.const("err", g);
      y.if(
        (0, t._)`${n.default.vErrors} === null`,
        () => y.assign(n.default.vErrors, (0, t._)`[${_}]`),
        (0, t._)`${n.default.vErrors}.push(${_})`
      ),
        y.code((0, t._)`${n.default.errors}++`);
    }
    function c(y, g) {
      const { gen: _, validateName: E, schemaEnv: S } = y;
      S.$async
        ? _.throw((0, t._)`new ${y.ValidationError}(${g})`)
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
    function f(y, g, _) {
      const { createErrors: E } = y.it;
      return E === !1 ? (0, t._)`{}` : d(y, g, _);
    }
    function d(y, g, _ = {}) {
      const { gen: E, it: S } = y,
        I = [p(S, _), h(y, _)];
      return m(y, g, I), E.object(...I);
    }
    function p({ errorPath: y }, { instancePath: g }) {
      const _ = g ? (0, t.str)`${y}${(0, r.getErrorPath)(g, r.Type.Str)}` : y;
      return [
        n.default.instancePath,
        (0, t.strConcat)(n.default.instancePath, _),
      ];
    }
    function h(
      { keyword: y, it: { errSchemaPath: g } },
      { schemaPath: _, parentSchema: E }
    ) {
      let S = E ? g : (0, t.str)`${g}/${y}`;
      return (
        _ && (S = (0, t.str)`${S}${(0, r.getErrorPath)(_, r.Type.Str)}`),
        [u.schemaPath, S]
      );
    }
    function m(y, { params: g, message: _ }, E) {
      const { keyword: S, data: I, schemaValue: A, it: O } = y,
        { opts: L, propertyName: z, topSchemaRef: H, schemaPath: ne } = O;
      E.push(
        [u.keyword, S],
        [u.params, typeof g == "function" ? g(y) : g || (0, t._)`{}`]
      ),
        L.messages && E.push([u.message, typeof _ == "function" ? _(y) : _]),
        L.verbose &&
          E.push(
            [u.schema, A],
            [u.parentSchema, (0, t._)`${H}${ne}`],
            [n.default.data, I]
          ),
        z && E.push([u.propertyName, z]);
    }
  })(zo);
  Object.defineProperty(Po, "__esModule", { value: !0 });
  Po.boolOrEmptySchema = Po.topBoolOrEmptySchema = void 0;
  const _4 = zo,
    $4 = De,
    b4 = dr,
    w4 = {
      message: "boolean schema is false",
    };
  function E4(e) {
    const { gen: t, schema: r, validateName: n } = e;
    r === !1
      ? Ay(e, !1)
      : typeof r == "object" && r.$async === !0
        ? t.return(b4.default.data)
        : (t.assign((0, $4._)`${n}.errors`, null), t.return(!0));
  }
  Po.topBoolOrEmptySchema = E4;
  function O4(e, t) {
    const { gen: r, schema: n } = e;
    n === !1 ? (r.var(t, !1), Ay(e)) : r.var(t, !0);
  }
  Po.boolOrEmptySchema = O4;
  function Ay(e, t) {
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
    (0, _4.reportError)(o, w4, void 0, t);
  }
  var Qi = {},
    Xn = {};
  Object.defineProperty(Xn, "__esModule", { value: !0 });
  Xn.getRules = Xn.isJSONType = void 0;
  const S4 = [
      "string",
      "number",
      "integer",
      "boolean",
      "null",
      "object",
      "array",
    ],
    A4 = new Set(S4);
  function N4(e) {
    return typeof e == "string" && A4.has(e);
  }
  Xn.isJSONType = N4;
  function P4() {
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
  Xn.getRules = P4;
  var Br = {};
  Object.defineProperty(Br, "__esModule", { value: !0 });
  Br.shouldUseRule = Br.shouldUseGroup = Br.schemaHasRulesForType = void 0;
  function C4({ schema: e, self: t }, r) {
    const n = t.RULES.types[r];
    return n && n !== !0 && Ny(e, n);
  }
  Br.schemaHasRulesForType = C4;
  function Ny(e, t) {
    return t.rules.some(r => Py(e, r));
  }
  Br.shouldUseGroup = Ny;
  function Py(e, t) {
    var r;
    return (
      e[t.keyword] !== void 0 ||
      ((r = t.definition.implements) === null || r === void 0
        ? void 0
        : r.some(n => e[n] !== void 0))
    );
  }
  Br.shouldUseRule = Py;
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
    const t = Xn,
      r = Br,
      n = zo,
      o = De,
      i = Be;
    var s;
    (function (E) {
      (E[(E.Correct = 0)] = "Correct"), (E[(E.Wrong = 1)] = "Wrong");
    })((s = e.DataType || (e.DataType = {})));
    function a(E) {
      const S = l(E.type);
      if (S.includes("null")) {
        if (E.nullable === !1)
          throw new Error("type: null contradicts nullable: false");
      } else {
        if (!S.length && E.nullable !== void 0)
          throw new Error('"nullable" cannot be used without "type"');
        E.nullable === !0 && S.push("null");
      }
      return S;
    }
    e.getSchemaTypes = a;
    function l(E) {
      const S = Array.isArray(E) ? E : E ? [E] : [];
      if (S.every(t.isJSONType)) return S;
      throw new Error("type must be JSONType or JSONType[]: " + S.join(","));
    }
    e.getJSONTypes = l;
    function c(E, S) {
      const { gen: I, data: A, opts: O } = E,
        L = f(S, O.coerceTypes),
        z =
          S.length > 0 &&
          !(
            L.length === 0 &&
            S.length === 1 &&
            (0, r.schemaHasRulesForType)(E, S[0])
          );
      if (z) {
        const H = m(S, A, O.strictNumbers, s.Wrong);
        I.if(H, () => {
          L.length ? d(E, S, L) : g(E);
        });
      }
      return z;
    }
    e.coerceAndCheckDataType = c;
    const u = /* @__PURE__ */ new Set([
      "string",
      "number",
      "integer",
      "boolean",
      "null",
    ]);
    function f(E, S) {
      return S
        ? E.filter(I => u.has(I) || (S === "array" && I === "array"))
        : [];
    }
    function d(E, S, I) {
      const { gen: A, data: O, opts: L } = E,
        z = A.let("dataType", (0, o._)`typeof ${O}`),
        H = A.let("coerced", (0, o._)`undefined`);
      L.coerceTypes === "array" &&
        A.if(
          (0, o._)`${z} == 'object' && Array.isArray(${O}) && ${O}.length == 1`,
          () =>
            A.assign(O, (0, o._)`${O}[0]`)
              .assign(z, (0, o._)`typeof ${O}`)
              .if(m(S, O, L.strictNumbers), () => A.assign(H, O))
        ),
        A.if((0, o._)`${H} !== undefined`);
      for (const G of I)
        (u.has(G) || (G === "array" && L.coerceTypes === "array")) && ne(G);
      A.else(),
        g(E),
        A.endIf(),
        A.if((0, o._)`${H} !== undefined`, () => {
          A.assign(O, H), p(E, H);
        });
      function ne(G) {
        switch (G) {
          case "string":
            A.elseIf((0, o._)`${z} == "number" || ${z} == "boolean"`)
              .assign(H, (0, o._)`"" + ${O}`)
              .elseIf((0, o._)`${O} === null`)
              .assign(H, (0, o._)`""`);
            return;
          case "number":
            A.elseIf(
              (0, o._)`${z} == "boolean" || ${O} === null
              || (${z} == "string" && ${O} && ${O} == +${O})`
            ).assign(H, (0, o._)`+${O}`);
            return;
          case "integer":
            A.elseIf(
              (0, o._)`${z} === "boolean" || ${O} === null
              || (${z} === "string" && ${O} && ${O} == +${O} && !(${O} % 1))`
            ).assign(H, (0, o._)`+${O}`);
            return;
          case "boolean":
            A.elseIf((0, o._)`${O} === "false" || ${O} === 0 || ${O} === null`)
              .assign(H, !1)
              .elseIf((0, o._)`${O} === "true" || ${O} === 1`)
              .assign(H, !0);
            return;
          case "null":
            A.elseIf((0, o._)`${O} === "" || ${O} === 0 || ${O} === false`),
              A.assign(H, null);
            return;
          case "array":
            A.elseIf(
              (0, o._)`${z} === "string" || ${z} === "number"
              || ${z} === "boolean" || ${O} === null`
            ).assign(H, (0, o._)`[${O}]`);
        }
      }
    }
    function p({ gen: E, parentData: S, parentDataProperty: I }, A) {
      E.if((0, o._)`${S} !== undefined`, () =>
        E.assign((0, o._)`${S}[${I}]`, A)
      );
    }
    function h(E, S, I, A = s.Correct) {
      const O = A === s.Correct ? o.operators.EQ : o.operators.NEQ;
      let L;
      switch (E) {
        case "null":
          return (0, o._)`${S} ${O} null`;
        case "array":
          L = (0, o._)`Array.isArray(${S})`;
          break;
        case "object":
          L = (0, o._)`${S} && typeof ${S} == "object" && !Array.isArray(${S})`;
          break;
        case "integer":
          L = z((0, o._)`!(${S} % 1) && !isNaN(${S})`);
          break;
        case "number":
          L = z();
          break;
        default:
          return (0, o._)`typeof ${S} ${O} ${E}`;
      }
      return A === s.Correct ? L : (0, o.not)(L);
      function z(H = o.nil) {
        return (0, o.and)(
          (0, o._)`typeof ${S} == "number"`,
          H,
          I ? (0, o._)`isFinite(${S})` : o.nil
        );
      }
    }
    e.checkDataType = h;
    function m(E, S, I, A) {
      if (E.length === 1) return h(E[0], S, I, A);
      let O;
      const L = (0, i.toHash)(E);
      if (L.array && L.object) {
        const z = (0, o._)`typeof ${S} != "object"`;
        (O = L.null ? z : (0, o._)`!${S} || ${z}`),
          delete L.null,
          delete L.array,
          delete L.object;
      } else O = o.nil;
      L.number && delete L.integer;
      for (const z in L) O = (0, o.and)(O, h(z, S, I, A));
      return O;
    }
    e.checkDataTypes = m;
    const y = {
      message: ({ schema: E }) => `must be ${E}`,
      params: ({ schema: E, schemaValue: S }) =>
        typeof E == "string" ? (0, o._)`{type: ${E}}` : (0, o._)`{type: ${S}}`,
    };
    function g(E) {
      const S = _(E);
      (0, n.reportError)(S, y);
    }
    e.reportTypeError = g;
    function _(E) {
      const { gen: S, data: I, schema: A } = E,
        O = (0, i.schemaRefOrVal)(E, A, "type");
      return {
        gen: S,
        keyword: "type",
        data: I,
        schema: A.type,
        schemaCode: O,
        schemaValue: O,
        parentSchema: A,
        params: {},
        it: E,
      };
    }
  })(Qi);
  var Xa = {};
  Object.defineProperty(Xa, "__esModule", { value: !0 });
  Xa.assignDefaults = void 0;
  const go = De,
    T4 = Be;
  function x4(e, t) {
    const { properties: r, items: n } = e.schema;
    if (t === "object" && r) for (const o in r) Nh(e, o, r[o].default);
    else
      t === "array" &&
        Array.isArray(n) &&
        n.forEach((o, i) => Nh(e, i, o.default));
  }
  Xa.assignDefaults = x4;
  function Nh(e, t, r) {
    const { gen: n, compositeRule: o, data: i, opts: s } = e;
    if (r === void 0) return;
    const a = (0, go._)`${i}${(0, go.getProperty)(t)}`;
    if (o) {
      (0, T4.checkStrictMode)(e, `default is ignored for: ${a}`);
      return;
    }
    let l = (0, go._)`${a} === undefined`;
    s.useDefaults === "empty" &&
      (l = (0, go._)`${l} || ${a} === null || ${a} === ""`),
      n.if(l, (0, go._)`${a} = ${(0, go.stringify)(r)}`);
  }
  var br = {},
    je = {};
  Object.defineProperty(je, "__esModule", { value: !0 });
  je.validateUnion =
    je.validateArray =
    je.usePattern =
    je.callValidateCode =
    je.schemaProperties =
    je.allSchemaProperties =
    je.noPropertyInData =
    je.propertyInData =
    je.isOwnProperty =
    je.hasPropFunc =
    je.reportMissingProp =
    je.checkMissingProp =
    je.checkReportMissingProp =
      void 0;
  const et = De,
    Wu = Be,
    an = dr,
    D4 = Be;
  function I4(e, t) {
    const { gen: r, data: n, it: o } = e;
    r.if(Ku(r, n, t, o.opts.ownProperties), () => {
      e.setParams({ missingProperty: (0, et._)`${t}` }, !0), e.error();
    });
  }
  je.checkReportMissingProp = I4;
  function R4({ gen: e, data: t, it: { opts: r } }, n, o) {
    return (0, et.or)(
      ...n.map(i =>
        (0, et.and)(Ku(e, t, i, r.ownProperties), (0, et._)`${o} = ${i}`)
      )
    );
  }
  je.checkMissingProp = R4;
  function M4(e, t) {
    e.setParams({ missingProperty: t }, !0), e.error();
  }
  je.reportMissingProp = M4;
  function Cy(e) {
    return e.scopeValue("func", {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref: Object.prototype.hasOwnProperty,
      code: (0, et._)`Object.prototype.hasOwnProperty`,
    });
  }
  je.hasPropFunc = Cy;
  function Hu(e, t, r) {
    return (0, et._)`${Cy(e)}.call(${t}, ${r})`;
  }
  je.isOwnProperty = Hu;
  function j4(e, t, r, n) {
    const o = (0, et._)`${t}${(0, et.getProperty)(r)} !== undefined`;
    return n ? (0, et._)`${o} && ${Hu(e, t, r)}` : o;
  }
  je.propertyInData = j4;
  function Ku(e, t, r, n) {
    const o = (0, et._)`${t}${(0, et.getProperty)(r)} === undefined`;
    return n ? (0, et.or)(o, (0, et.not)(Hu(e, t, r))) : o;
  }
  je.noPropertyInData = Ku;
  function Ty(e) {
    return e ? Object.keys(e).filter(t => t !== "__proto__") : [];
  }
  je.allSchemaProperties = Ty;
  function F4(e, t) {
    return Ty(t).filter(r => !(0, Wu.alwaysValidSchema)(e, t[r]));
  }
  je.schemaProperties = F4;
  function L4(
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
          an.default.instancePath,
          (0, et.strConcat)(an.default.instancePath, i),
        ],
        [an.default.parentData, s.parentData],
        [an.default.parentDataProperty, s.parentDataProperty],
        [an.default.rootData, an.default.rootData],
      ];
    s.opts.dynamicRef &&
      f.push([an.default.dynamicAnchors, an.default.dynamicAnchors]);
    const d = (0, et._)`${u}, ${r.object(...f)}`;
    return l !== et.nil
      ? (0, et._)`${a}.call(${l}, ${d})`
      : (0, et._)`${a}(${d})`;
  }
  je.callValidateCode = L4;
  const V4 = (0, et._)`new RegExp`;
  function k4({ gen: e, it: { opts: t } }, r) {
    const n = t.unicodeRegExp ? "u" : "",
      { regExp: o } = t.code,
      i = o(r, n);
    return e.scopeValue("pattern", {
      key: i.toString(),
      ref: i,
      code: (0,
      et._)`${o.code === "new RegExp" ? V4 : (0, D4.useFunc)(e, o)}(${r}, ${n})`,
    });
  }
  je.usePattern = k4;
  function B4(e) {
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
            dataPropType: Wu.Type.Num,
          },
          i
        ),
          t.if((0, et.not)(i), a);
      });
    }
  }
  je.validateArray = B4;
  function z4(e) {
    const { gen: t, schema: r, keyword: n, it: o } = e;
    if (!Array.isArray(r)) throw new Error("ajv implementation error");
    if (r.some(l => (0, Wu.alwaysValidSchema)(o, l)) && !o.opts.unevaluated)
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
  je.validateUnion = z4;
  Object.defineProperty(br, "__esModule", { value: !0 });
  br.validateKeywordUsage =
    br.validSchemaType =
    br.funcKeywordCode =
    br.macroKeywordCode =
      void 0;
  const It = De,
    Mn = dr,
    U4 = je,
    W4 = zo;
  function H4(e, t) {
    const { gen: r, keyword: n, schema: o, parentSchema: i, it: s } = e,
      a = t.macro.call(s.self, o, i, s),
      l = xy(r, n, a);
    s.opts.validateSchema !== !1 && s.self.validateSchema(a, !0);
    const c = r.name("valid");
    e.subschema(
      {
        schema: a,
        schemaPath: It.nil,
        errSchemaPath: `${s.errSchemaPath}/${n}`,
        topSchemaRef: l,
        compositeRule: !0,
      },
      c
    ),
      e.pass(c, () => e.error(!0));
  }
  br.macroKeywordCode = H4;
  function K4(e, t) {
    var r;
    const {
      gen: n,
      keyword: o,
      schema: i,
      parentSchema: s,
      $data: a,
      it: l,
    } = e;
    q4(l, t);
    const c = !a && t.compile ? t.compile.call(l.self, i, s, l) : t.validate,
      u = xy(n, o, c),
      f = n.let("valid");
    e.block$data(f, d), e.ok((r = t.valid) !== null && r !== void 0 ? r : f);
    function d() {
      if (t.errors === !1) m(), t.modifying && Ph(e), y(() => e.error());
      else {
        const g = t.async ? p() : h();
        t.modifying && Ph(e), y(() => G4(e, g));
      }
    }
    function p() {
      const g = n.let("ruleErrs", null);
      return (
        n.try(
          () => m((0, It._)`await `),
          _ =>
            n.assign(f, !1).if(
              (0, It._)`${_} instanceof ${l.ValidationError}`,
              () => n.assign(g, (0, It._)`${_}.errors`),
              () => n.throw(_)
            )
        ),
        g
      );
    }
    function h() {
      const g = (0, It._)`${u}.errors`;
      return n.assign(g, null), m(It.nil), g;
    }
    function m(g = t.async ? (0, It._)`await ` : It.nil) {
      const _ = l.opts.passContext ? Mn.default.this : Mn.default.self,
        E = !(("compile" in t && !a) || t.schema === !1);
      n.assign(
        f,
        (0, It._)`${g}${(0, U4.callValidateCode)(e, u, _, E)}`,
        t.modifying
      );
    }
    function y(g) {
      var _;
      n.if((0, It.not)((_ = t.valid) !== null && _ !== void 0 ? _ : f), g);
    }
  }
  br.funcKeywordCode = K4;
  function Ph(e) {
    const { gen: t, data: r, it: n } = e;
    t.if(n.parentData, () =>
      t.assign(r, (0, It._)`${n.parentData}[${n.parentDataProperty}]`)
    );
  }
  function G4(e, t) {
    const { gen: r } = e;
    r.if(
      (0, It._)`Array.isArray(${t})`,
      () => {
        r
          .assign(
            Mn.default.vErrors,
            (0,
            It._)`${Mn.default.vErrors} === null ? ${t} : ${Mn.default.vErrors}.concat(${t})`
          )
          .assign(Mn.default.errors, (0, It._)`${Mn.default.vErrors}.length`),
          (0, W4.extendErrors)(e);
      },
      () => e.error()
    );
  }
  function q4({ schemaEnv: e }, t) {
    if (t.async && !e.$async) throw new Error("async keyword in sync schema");
  }
  function xy(e, t, r) {
    if (r === void 0) throw new Error(`keyword "${t}" failed to compile`);
    return e.scopeValue(
      "keyword",
      typeof r == "function"
        ? { ref: r }
        : { ref: r, code: (0, It.stringify)(r) }
    );
  }
  function Y4(e, t, r = !1) {
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
  br.validSchemaType = Y4;
  function J4({ schema: e, opts: t, self: r, errSchemaPath: n }, o, i) {
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
  br.validateKeywordUsage = J4;
  var vn = {};
  Object.defineProperty(vn, "__esModule", { value: !0 });
  vn.extendSubschemaMode = vn.extendSubschemaData = vn.getSubschema = void 0;
  const _r = De,
    Dy = Be;
  function X4(
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
            schemaPath: (0, _r._)`${e.schemaPath}${(0, _r.getProperty)(t)}`,
            errSchemaPath: `${e.errSchemaPath}/${t}`,
          }
        : {
            schema: a[r],
            schemaPath: (0,
            _r._)`${e.schemaPath}${(0, _r.getProperty)(t)}${(0, _r.getProperty)(r)}`,
            errSchemaPath: `${e.errSchemaPath}/${t}/${(0, Dy.escapeFragment)(r)}`,
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
  vn.getSubschema = X4;
  function Z4(
    e,
    t,
    { dataProp: r, dataPropType: n, data: o, dataTypes: i, propertyName: s }
  ) {
    if (o !== void 0 && r !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: a } = t;
    if (r !== void 0) {
      const { errorPath: c, dataPathArr: u, opts: f } = t,
        d = a.let("data", (0, _r._)`${t.data}${(0, _r.getProperty)(r)}`, !0);
      l(d),
        (e.errorPath = (0,
        _r.str)`${c}${(0, Dy.getErrorPath)(r, n, f.jsPropertySyntax)}`),
        (e.parentDataProperty = (0, _r._)`${r}`),
        (e.dataPathArr = [...u, e.parentDataProperty]);
    }
    if (o !== void 0) {
      const c = o instanceof _r.Name ? o : a.let("data", o, !0);
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
  vn.extendSubschemaData = Z4;
  function Q4(
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
  vn.extendSubschemaMode = Q4;
  var wt = {},
    Iy = function e(t, r) {
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
    Ry = { exports: {} },
    hn = (Ry.exports = function (e, t, r) {
      typeof t == "function" && ((r = t), (t = {})), (r = t.cb || r);
      var n = typeof r == "function" ? r : r.pre || function () {},
        o = r.post || function () {};
      Rs(t, n, o, e, "", e);
    });
  hn.keywords = {
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
  hn.arrayKeywords = {
    items: !0,
    allOf: !0,
    anyOf: !0,
    oneOf: !0,
  };
  hn.propsKeywords = {
    $defs: !0,
    definitions: !0,
    properties: !0,
    patternProperties: !0,
    dependencies: !0,
  };
  hn.skipKeywords = {
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
  function Rs(e, t, r, n, o, i, s, a, l, c) {
    if (n && typeof n == "object" && !Array.isArray(n)) {
      t(n, o, i, s, a, l, c);
      for (var u in n) {
        var f = n[u];
        if (Array.isArray(f)) {
          if (u in hn.arrayKeywords)
            for (var d = 0; d < f.length; d++)
              Rs(e, t, r, f[d], o + "/" + u + "/" + d, i, o, u, n, d);
        } else if (u in hn.propsKeywords) {
          if (f && typeof f == "object")
            for (var p in f)
              Rs(e, t, r, f[p], o + "/" + u + "/" + eU(p), i, o, u, n, p);
        } else
          (u in hn.keywords || (e.allKeys && !(u in hn.skipKeywords))) &&
            Rs(e, t, r, f, o + "/" + u, i, o, u, n);
      }
      r(n, o, i, s, a, l, c);
    }
  }
  function eU(e) {
    return e.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  var tU = Ry.exports;
  Object.defineProperty(wt, "__esModule", { value: !0 });
  wt.getSchemaRefs =
    wt.resolveUrl =
    wt.normalizeId =
    wt._getFullPath =
    wt.getFullPath =
    wt.inlineRef =
      void 0;
  const rU = Be,
    nU = Iy,
    oU = tU,
    iU = /* @__PURE__ */ new Set([
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
  function sU(e, t = !0) {
    return typeof e == "boolean" ? !0 : t === !0 ? !yc(e) : t ? My(e) <= t : !1;
  }
  wt.inlineRef = sU;
  const aU = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor",
  ]);
  function yc(e) {
    for (const t in e) {
      if (aU.has(t)) return !0;
      const r = e[t];
      if ((Array.isArray(r) && r.some(yc)) || (typeof r == "object" && yc(r)))
        return !0;
    }
    return !1;
  }
  function My(e) {
    let t = 0;
    for (const r in e) {
      if (r === "$ref") return 1 / 0;
      if (
        (t++,
        !iU.has(r) &&
          (typeof e[r] == "object" && (0, rU.eachItem)(e[r], n => (t += My(n))),
          t === 1 / 0))
      )
        return 1 / 0;
    }
    return t;
  }
  function jy(e, t = "", r) {
    r !== !1 && (t = Oo(t));
    const n = e.parse(t);
    return Fy(e, n);
  }
  wt.getFullPath = jy;
  function Fy(e, t) {
    return e.serialize(t).split("#")[0] + "#";
  }
  wt._getFullPath = Fy;
  const lU = /#\/?$/;
  function Oo(e) {
    return e ? e.replace(lU, "") : "";
  }
  wt.normalizeId = Oo;
  function cU(e, t, r) {
    return (r = Oo(r)), e.resolve(t, r);
  }
  wt.resolveUrl = cU;
  const uU = /^[a-z_][-a-z0-9._]*$/i;
  function fU(e, t) {
    if (typeof e == "boolean") return {};
    const { schemaId: r, uriResolver: n } = this.opts,
      o = Oo(e[r] || t),
      i = { "": o },
      s = jy(n, o, !1),
      a = {},
      l = /* @__PURE__ */ new Set();
    return (
      oU(e, { allKeys: !0 }, (f, d, p, h) => {
        if (h === void 0) return;
        const m = s + d;
        let y = i[h];
        typeof f[r] == "string" && (y = g.call(this, f[r])),
          _.call(this, f.$anchor),
          _.call(this, f.$dynamicAnchor),
          (i[d] = y);
        function g(E) {
          const S = this.opts.uriResolver.resolve;
          if (((E = Oo(y ? S(y, E) : E)), l.has(E))) throw u(E);
          l.add(E);
          let I = this.refs[E];
          return (
            typeof I == "string" && (I = this.refs[I]),
            typeof I == "object"
              ? c(f, I.schema, E)
              : E !== Oo(m) &&
                (E[0] === "#"
                  ? (c(f, a[E], E), (a[E] = f))
                  : (this.refs[E] = m)),
            E
          );
        }
        function _(E) {
          if (typeof E == "string") {
            if (!uU.test(E)) throw new Error(`invalid anchor "${E}"`);
            g.call(this, `#${E}`);
          }
        }
      }),
      a
    );
    function c(f, d, p) {
      if (d !== void 0 && !nU(f, d)) throw u(p);
    }
    function u(f) {
      return new Error(`reference "${f}" resolves to more than one schema`);
    }
  }
  wt.getSchemaRefs = fU;
  Object.defineProperty(Zt, "__esModule", { value: !0 });
  Zt.getData = Zt.KeywordCxt = Zt.validateFunctionCode = void 0;
  const Ly = Po,
    Ch = Qi,
    Gu = Br,
    ca = Qi,
    dU = Xa,
    $i = br,
    Dl = vn,
    ce = De,
    Ee = dr,
    pU = wt,
    zr = Be,
    ii = zo;
  function hU(e) {
    if (By(e) && (zy(e), ky(e))) {
      vU(e);
      return;
    }
    Vy(e, () => (0, Ly.topBoolOrEmptySchema)(e));
  }
  Zt.validateFunctionCode = hU;
  function Vy(
    { gen: e, validateName: t, schema: r, schemaEnv: n, opts: o },
    i
  ) {
    o.code.es5
      ? e.func(
          t,
          (0, ce._)`${Ee.default.data}, ${Ee.default.valCxt}`,
          n.$async,
          () => {
            e.code((0, ce._)`"use strict"; ${Th(r, o)}`), mU(e, o), e.code(i);
          }
        )
      : e.func(t, (0, ce._)`${Ee.default.data}, ${gU(o)}`, n.$async, () =>
          e.code(Th(r, o)).code(i)
        );
  }
  function gU(e) {
    return (0,
    ce._)`{${Ee.default.instancePath}="", ${Ee.default.parentData}, ${Ee.default.parentDataProperty}, ${Ee.default.rootData}=${Ee.default.data}${e.dynamicRef ? (0, ce._)`, ${Ee.default.dynamicAnchors}={}` : ce.nil}}={}`;
  }
  function mU(e, t) {
    e.if(
      Ee.default.valCxt,
      () => {
        e.var(
          Ee.default.instancePath,
          (0, ce._)`${Ee.default.valCxt}.${Ee.default.instancePath}`
        ),
          e.var(
            Ee.default.parentData,
            (0, ce._)`${Ee.default.valCxt}.${Ee.default.parentData}`
          ),
          e.var(
            Ee.default.parentDataProperty,
            (0, ce._)`${Ee.default.valCxt}.${Ee.default.parentDataProperty}`
          ),
          e.var(
            Ee.default.rootData,
            (0, ce._)`${Ee.default.valCxt}.${Ee.default.rootData}`
          ),
          t.dynamicRef &&
            e.var(
              Ee.default.dynamicAnchors,
              (0, ce._)`${Ee.default.valCxt}.${Ee.default.dynamicAnchors}`
            );
      },
      () => {
        e.var(Ee.default.instancePath, (0, ce._)`""`),
          e.var(Ee.default.parentData, (0, ce._)`undefined`),
          e.var(Ee.default.parentDataProperty, (0, ce._)`undefined`),
          e.var(Ee.default.rootData, Ee.default.data),
          t.dynamicRef && e.var(Ee.default.dynamicAnchors, (0, ce._)`{}`);
      }
    );
  }
  function vU(e) {
    const { schema: t, opts: r, gen: n } = e;
    Vy(e, () => {
      r.$comment && t.$comment && Wy(e),
        wU(e),
        n.let(Ee.default.vErrors, null),
        n.let(Ee.default.errors, 0),
        r.unevaluated && yU(e),
        Uy(e),
        SU(e);
    });
  }
  function yU(e) {
    const { gen: t, validateName: r } = e;
    (e.evaluated = t.const("evaluated", (0, ce._)`${r}.evaluated`)),
      t.if((0, ce._)`${e.evaluated}.dynamicProps`, () =>
        t.assign((0, ce._)`${e.evaluated}.props`, (0, ce._)`undefined`)
      ),
      t.if((0, ce._)`${e.evaluated}.dynamicItems`, () =>
        t.assign((0, ce._)`${e.evaluated}.items`, (0, ce._)`undefined`)
      );
  }
  function Th(e, t) {
    const r = typeof e == "object" && e[t.schemaId];
    return r && (t.code.source || t.code.process)
      ? (0, ce._)`/*# sourceURL=${r} */`
      : ce.nil;
  }
  function _U(e, t) {
    if (By(e) && (zy(e), ky(e))) {
      $U(e, t);
      return;
    }
    (0, Ly.boolOrEmptySchema)(e, t);
  }
  function ky({ schema: e, self: t }) {
    if (typeof e == "boolean") return !e;
    for (const r in e) if (t.RULES.all[r]) return !0;
    return !1;
  }
  function By(e) {
    return typeof e.schema != "boolean";
  }
  function $U(e, t) {
    const { schema: r, gen: n, opts: o } = e;
    o.$comment && r.$comment && Wy(e), EU(e), OU(e);
    const i = n.const("_errs", Ee.default.errors);
    Uy(e, i), n.var(t, (0, ce._)`${i} === ${Ee.default.errors}`);
  }
  function zy(e) {
    (0, zr.checkUnknownRules)(e), bU(e);
  }
  function Uy(e, t) {
    if (e.opts.jtd) return xh(e, [], !1, t);
    const r = (0, Ch.getSchemaTypes)(e.schema),
      n = (0, Ch.coerceAndCheckDataType)(e, r);
    xh(e, r, !n, t);
  }
  function bU(e) {
    const { schema: t, errSchemaPath: r, opts: n, self: o } = e;
    t.$ref &&
      n.ignoreKeywordsWithRef &&
      (0, zr.schemaHasRulesButRef)(t, o.RULES) &&
      o.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
  }
  function wU(e) {
    const { schema: t, opts: r } = e;
    t.default !== void 0 &&
      r.useDefaults &&
      r.strictSchema &&
      (0, zr.checkStrictMode)(e, "default is ignored in the schema root");
  }
  function EU(e) {
    const t = e.schema[e.opts.schemaId];
    t && (e.baseId = (0, pU.resolveUrl)(e.opts.uriResolver, e.baseId, t));
  }
  function OU(e) {
    if (e.schema.$async && !e.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function Wy({ gen: e, schemaEnv: t, schema: r, errSchemaPath: n, opts: o }) {
    const i = r.$comment;
    if (o.$comment === !0)
      e.code((0, ce._)`${Ee.default.self}.logger.log(${i})`);
    else if (typeof o.$comment == "function") {
      const s = (0, ce.str)`${n}/$comment`,
        a = e.scopeValue("root", { ref: t.root });
      e.code(
        (0, ce._)`${Ee.default.self}.opts.$comment(${i}, ${s}, ${a}.schema)`
      );
    }
  }
  function SU(e) {
    const {
      gen: t,
      schemaEnv: r,
      validateName: n,
      ValidationError: o,
      opts: i,
    } = e;
    r.$async
      ? t.if(
          (0, ce._)`${Ee.default.errors} === 0`,
          () => t.return(Ee.default.data),
          () => t.throw((0, ce._)`new ${o}(${Ee.default.vErrors})`)
        )
      : (t.assign((0, ce._)`${n}.errors`, Ee.default.vErrors),
        i.unevaluated && AU(e),
        t.return((0, ce._)`${Ee.default.errors} === 0`));
  }
  function AU({ gen: e, evaluated: t, props: r, items: n }) {
    r instanceof ce.Name && e.assign((0, ce._)`${t}.props`, r),
      n instanceof ce.Name && e.assign((0, ce._)`${t}.items`, n);
  }
  function xh(e, t, r, n) {
    const { gen: o, schema: i, data: s, allErrors: a, opts: l, self: c } = e,
      { RULES: u } = c;
    if (
      i.$ref &&
      (l.ignoreKeywordsWithRef || !(0, zr.schemaHasRulesButRef)(i, u))
    ) {
      o.block(() => Gy(e, "$ref", u.all.$ref.definition));
      return;
    }
    l.jtd || NU(e, t),
      o.block(() => {
        for (const d of u.rules) f(d);
        f(u.post);
      });
    function f(d) {
      (0, Gu.shouldUseGroup)(i, d) &&
        (d.type
          ? (o.if((0, ca.checkDataType)(d.type, s, l.strictNumbers)),
            Dh(e, d),
            t.length === 1 &&
              t[0] === d.type &&
              r &&
              (o.else(), (0, ca.reportTypeError)(e)),
            o.endIf())
          : Dh(e, d),
        a || o.if((0, ce._)`${Ee.default.errors} === ${n || 0}`));
    }
  }
  function Dh(e, t) {
    const {
      gen: r,
      schema: n,
      opts: { useDefaults: o },
    } = e;
    o && (0, dU.assignDefaults)(e, t.type),
      r.block(() => {
        for (const i of t.rules)
          (0, Gu.shouldUseRule)(n, i) && Gy(e, i.keyword, i.definition, t.type);
      });
  }
  function NU(e, t) {
    e.schemaEnv.meta ||
      !e.opts.strictTypes ||
      (PU(e, t), e.opts.allowUnionTypes || CU(e, t), TU(e, e.dataTypes));
  }
  function PU(e, t) {
    if (t.length) {
      if (!e.dataTypes.length) {
        e.dataTypes = t;
        return;
      }
      t.forEach(r => {
        Hy(e.dataTypes, r) ||
          qu(
            e,
            `type "${r}" not allowed by context "${e.dataTypes.join(",")}"`
          );
      }),
        DU(e, t);
    }
  }
  function CU(e, t) {
    t.length > 1 &&
      !(t.length === 2 && t.includes("null")) &&
      qu(e, "use allowUnionTypes to allow union type keyword");
  }
  function TU(e, t) {
    const r = e.self.RULES.all;
    for (const n in r) {
      const o = r[n];
      if (typeof o == "object" && (0, Gu.shouldUseRule)(e.schema, o)) {
        const { type: i } = o.definition;
        i.length &&
          !i.some(s => xU(t, s)) &&
          qu(e, `missing type "${i.join(",")}" for keyword "${n}"`);
      }
    }
  }
  function xU(e, t) {
    return e.includes(t) || (t === "number" && e.includes("integer"));
  }
  function Hy(e, t) {
    return e.includes(t) || (t === "integer" && e.includes("number"));
  }
  function DU(e, t) {
    const r = [];
    for (const n of e.dataTypes)
      Hy(t, n)
        ? r.push(n)
        : t.includes("integer") && n === "number" && r.push("integer");
    e.dataTypes = r;
  }
  function qu(e, t) {
    const r = e.schemaEnv.baseId + e.errSchemaPath;
    (t += ` at "${r}" (strictTypes)`),
      (0, zr.checkStrictMode)(e, t, e.opts.strictTypes);
  }
  class Ky {
    constructor(t, r, n) {
      if (
        ((0, $i.validateKeywordUsage)(t, r, n),
        (this.gen = t.gen),
        (this.allErrors = t.allErrors),
        (this.keyword = n),
        (this.data = t.data),
        (this.schema = t.schema[n]),
        (this.$data =
          r.$data && t.opts.$data && this.schema && this.schema.$data),
        (this.schemaValue = (0, zr.schemaRefOrVal)(
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
        this.schemaCode = t.gen.const("vSchema", qy(this.$data, t));
      else if (
        ((this.schemaCode = this.schemaValue),
        !(0, $i.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      )
        throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
      ("code" in r ? r.trackErrors : r.errors !== !1) &&
        (this.errsCount = t.gen.const("_errs", Ee.default.errors));
    }
    result(t, r, n) {
      this.failResult((0, ce.not)(t), r, n);
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
      this.failResult((0, ce.not)(t), void 0, r);
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
        (0, ce._)`${r} !== undefined && (${(0, ce.or)(this.invalid$data(), t)})`
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
      (t ? ii.reportExtraError : ii.reportError)(this, this.def.error, r);
    }
    $dataError() {
      (0, ii.reportError)(this, this.def.$dataError || ii.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, ii.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(t) {
      this.allErrors || this.gen.if(t);
    }
    setParams(t, r) {
      r ? Object.assign(this.params, t) : (this.params = t);
    }
    block$data(t, r, n = ce.nil) {
      this.gen.block(() => {
        this.check$data(t, n), r();
      });
    }
    check$data(t = ce.nil, r = ce.nil) {
      if (!this.$data) return;
      const { gen: n, schemaCode: o, schemaType: i, def: s } = this;
      n.if((0, ce.or)((0, ce._)`${o} === undefined`, r)),
        t !== ce.nil && n.assign(t, !0),
        (i.length || s.validateSchema) &&
          (n.elseIf(this.invalid$data()),
          this.$dataError(),
          t !== ce.nil && n.assign(t, !1)),
        n.else();
    }
    invalid$data() {
      const { gen: t, schemaCode: r, schemaType: n, def: o, it: i } = this;
      return (0, ce.or)(s(), a());
      function s() {
        if (n.length) {
          if (!(r instanceof ce.Name))
            throw new Error("ajv implementation error");
          const l = Array.isArray(n) ? n : [n];
          return (0,
          ce._)`${(0, ca.checkDataTypes)(l, r, i.opts.strictNumbers, ca.DataType.Wrong)}`;
        }
        return ce.nil;
      }
      function a() {
        if (o.validateSchema) {
          const l = t.scopeValue("validate$data", { ref: o.validateSchema });
          return (0, ce._)`!${l}(${r})`;
        }
        return ce.nil;
      }
    }
    subschema(t, r) {
      const n = (0, Dl.getSubschema)(this.it, t);
      (0, Dl.extendSubschemaData)(n, this.it, t),
        (0, Dl.extendSubschemaMode)(n, t);
      const o = { ...this.it, ...n, items: void 0, props: void 0 };
      return _U(o, r), o;
    }
    mergeEvaluated(t, r) {
      const { it: n, gen: o } = this;
      n.opts.unevaluated &&
        (n.props !== !0 &&
          t.props !== void 0 &&
          (n.props = zr.mergeEvaluated.props(o, t.props, n.props, r)),
        n.items !== !0 &&
          t.items !== void 0 &&
          (n.items = zr.mergeEvaluated.items(o, t.items, n.items, r)));
    }
    mergeValidEvaluated(t, r) {
      const { it: n, gen: o } = this;
      if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
        return o.if(r, () => this.mergeEvaluated(t, ce.Name)), !0;
    }
  }
  Zt.KeywordCxt = Ky;
  function Gy(e, t, r, n) {
    const o = new Ky(e, r, t);
    "code" in r
      ? r.code(o, n)
      : o.$data && r.validate
        ? (0, $i.funcKeywordCode)(o, r)
        : "macro" in r
          ? (0, $i.macroKeywordCode)(o, r)
          : (r.compile || r.validate) && (0, $i.funcKeywordCode)(o, r);
  }
  const IU = /^\/(?:[^~]|~0|~1)*$/,
    RU = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function qy(e, { dataLevel: t, dataNames: r, dataPathArr: n }) {
    let o, i;
    if (e === "") return Ee.default.rootData;
    if (e[0] === "/") {
      if (!IU.test(e)) throw new Error(`Invalid JSON-pointer: ${e}`);
      (o = e), (i = Ee.default.rootData);
    } else {
      const c = RU.exec(e);
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
        ce._)`${i}${(0, ce.getProperty)((0, zr.unescapeJsonPointer)(c))}`),
        (s = (0, ce._)`${s} && ${i}`));
    return s;
    function l(c, u) {
      return `Cannot access ${c} ${u} levels up, current level is ${t}`;
    }
  }
  Zt.getData = qy;
  var es = {};
  Object.defineProperty(es, "__esModule", { value: !0 });
  class MU extends Error {
    constructor(t) {
      super("validation failed"),
        (this.errors = t),
        (this.ajv = this.validation = !0);
    }
  }
  es.default = MU;
  var ts = {};
  Object.defineProperty(ts, "__esModule", { value: !0 });
  const Il = wt;
  class jU extends Error {
    constructor(t, r, n, o) {
      super(o || `can't resolve reference ${n} from id ${r}`),
        (this.missingRef = (0, Il.resolveUrl)(t, r, n)),
        (this.missingSchema = (0, Il.normalizeId)(
          (0, Il.getFullPath)(t, this.missingRef)
        ));
    }
  }
  ts.default = jU;
  var kt = {};
  Object.defineProperty(kt, "__esModule", { value: !0 });
  kt.resolveSchema =
    kt.getCompilingSchema =
    kt.resolveRef =
    kt.compileSchema =
    kt.SchemaEnv =
      void 0;
  const rr = De,
    FU = es,
    Dn = dr,
    ir = wt,
    Ih = Be,
    LU = Zt;
  class Za {
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
            : (0, ir.normalizeId)(n == null ? void 0 : n[t.schemaId || "$id"])),
        (this.schemaPath = t.schemaPath),
        (this.localRefs = t.localRefs),
        (this.meta = t.meta),
        (this.$async = n == null ? void 0 : n.$async),
        (this.refs = {});
    }
  }
  kt.SchemaEnv = Za;
  function Yu(e) {
    const t = Yy.call(this, e);
    if (t) return t;
    const r = (0, ir.getFullPath)(this.opts.uriResolver, e.root.baseId),
      { es5: n, lines: o } = this.opts.code,
      { ownProperties: i } = this.opts,
      s = new rr.CodeGen(this.scope, { es5: n, lines: o, ownProperties: i });
    let a;
    e.$async &&
      (a = s.scopeValue("Error", {
        ref: FU.default,
        code: (0, rr._)`require("ajv/dist/runtime/validation_error").default`,
      }));
    const l = s.scopeName("validate");
    e.validateName = l;
    const c = {
      gen: s,
      allErrors: this.opts.allErrors,
      data: Dn.default.data,
      parentData: Dn.default.parentData,
      parentDataProperty: Dn.default.parentDataProperty,
      dataNames: [Dn.default.data],
      dataPathArr: [rr.nil],
      dataLevel: 0,
      dataTypes: [],
      definedProperties: /* @__PURE__ */ new Set(),
      topSchemaRef: s.scopeValue(
        "schema",
        this.opts.code.source === !0
          ? { ref: e.schema, code: (0, rr.stringify)(e.schema) }
          : { ref: e.schema }
      ),
      validateName: l,
      ValidationError: a,
      schema: e.schema,
      schemaEnv: e,
      rootId: r,
      baseId: e.baseId || r,
      schemaPath: rr.nil,
      errSchemaPath: e.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, rr._)`""`,
      opts: this.opts,
      self: this,
    };
    let u;
    try {
      this._compilations.add(e),
        (0, LU.validateFunctionCode)(c),
        s.optimize(this.opts.code.optimize);
      const f = s.toString();
      (u = `${s.scopeRefs(Dn.default.scope)}return ${f}`),
        this.opts.code.process && (u = this.opts.code.process(u, e));
      const p = new Function(`${Dn.default.self}`, `${Dn.default.scope}`, u)(
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
          props: h instanceof rr.Name ? void 0 : h,
          items: m instanceof rr.Name ? void 0 : m,
          dynamicProps: h instanceof rr.Name,
          dynamicItems: m instanceof rr.Name,
        }),
          p.source && (p.source.evaluated = (0, rr.stringify)(p.evaluated));
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
  kt.compileSchema = Yu;
  function VU(e, t, r) {
    var n;
    r = (0, ir.resolveUrl)(this.opts.uriResolver, t, r);
    const o = e.refs[r];
    if (o) return o;
    let i = zU.call(this, e, r);
    if (i === void 0) {
      const s = (n = e.localRefs) === null || n === void 0 ? void 0 : n[r],
        { schemaId: a } = this.opts;
      s && (i = new Za({ schema: s, schemaId: a, root: e, baseId: t }));
    }
    if (i !== void 0) return (e.refs[r] = kU.call(this, i));
  }
  kt.resolveRef = VU;
  function kU(e) {
    return (0, ir.inlineRef)(e.schema, this.opts.inlineRefs)
      ? e.schema
      : e.validate
        ? e
        : Yu.call(this, e);
  }
  function Yy(e) {
    for (const t of this._compilations) if (BU(t, e)) return t;
  }
  kt.getCompilingSchema = Yy;
  function BU(e, t) {
    return e.schema === t.schema && e.root === t.root && e.baseId === t.baseId;
  }
  function zU(e, t) {
    let r;
    for (; typeof (r = this.refs[t]) == "string"; ) t = r;
    return r || this.schemas[t] || Qa.call(this, e, t);
  }
  function Qa(e, t) {
    const r = this.opts.uriResolver.parse(t),
      n = (0, ir._getFullPath)(this.opts.uriResolver, r);
    let o = (0, ir.getFullPath)(this.opts.uriResolver, e.baseId, void 0);
    if (Object.keys(e.schema).length > 0 && n === o) return Rl.call(this, r, e);
    const i = (0, ir.normalizeId)(n),
      s = this.refs[i] || this.schemas[i];
    if (typeof s == "string") {
      const a = Qa.call(this, e, s);
      return typeof (a == null ? void 0 : a.schema) != "object"
        ? void 0
        : Rl.call(this, r, a);
    }
    if (typeof (s == null ? void 0 : s.schema) == "object") {
      if ((s.validate || Yu.call(this, s), i === (0, ir.normalizeId)(t))) {
        const { schema: a } = s,
          { schemaId: l } = this.opts,
          c = a[l];
        return (
          c && (o = (0, ir.resolveUrl)(this.opts.uriResolver, o, c)),
          new Za({ schema: a, schemaId: l, root: e, baseId: o })
        );
      }
      return Rl.call(this, r, s);
    }
  }
  kt.resolveSchema = Qa;
  const UU = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions",
  ]);
  function Rl(e, { baseId: t, schema: r, root: n }) {
    var o;
    if (((o = e.fragment) === null || o === void 0 ? void 0 : o[0]) !== "/")
      return;
    for (const a of e.fragment.slice(1).split("/")) {
      if (typeof r == "boolean") return;
      const l = r[(0, Ih.unescapeFragment)(a)];
      if (l === void 0) return;
      r = l;
      const c = typeof r == "object" && r[this.opts.schemaId];
      !UU.has(a) && c && (t = (0, ir.resolveUrl)(this.opts.uriResolver, t, c));
    }
    let i;
    if (
      typeof r != "boolean" &&
      r.$ref &&
      !(0, Ih.schemaHasRulesButRef)(r, this.RULES)
    ) {
      const a = (0, ir.resolveUrl)(this.opts.uriResolver, t, r.$ref);
      i = Qa.call(this, n, a);
    }
    const { schemaId: s } = this.opts;
    if (
      ((i = i || new Za({ schema: r, schemaId: s, root: n, baseId: t })),
      i.schema !== i.root.schema)
    )
      return i;
  }
  const WU =
      "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
    HU = "Meta-schema for $data reference (JSON AnySchema extension proposal)",
    KU = "object",
    GU = ["$data"],
    qU = {
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
    YU = !1,
    JU = {
      $id: WU,
      description: HU,
      type: KU,
      required: GU,
      properties: qU,
      additionalProperties: YU,
    };
  var Ju = {},
    _c = { exports: {} };
  /** @license URI.js v4.4.1 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */
  (function (e, t) {
    (function (r, n) {
      n(t);
    })(ci, function (r) {
      function n() {
        for (var C = arguments.length, b = Array(C), x = 0; x < C; x++)
          b[x] = arguments[x];
        if (b.length > 1) {
          b[0] = b[0].slice(0, -1);
          for (var B = b.length - 1, k = 1; k < B; ++k)
            b[k] = b[k].slice(1, -1);
          return (b[B] = b[B].slice(1)), b.join("");
        } else return b[0];
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
      function l(C, b) {
        var x = C;
        if (b) for (var B in b) x[B] = b[B];
        return x;
      }
      function c(C) {
        var b = "[A-Za-z]",
          x = "[0-9]",
          B = n(x, "[A-Fa-f]"),
          k = o(
            o("%[EFef]" + B + "%" + B + B + "%" + B + B) +
              "|" +
              o("%[89A-Fa-f]" + B + "%" + B + B) +
              "|" +
              o("%" + B + B)
          ),
          pe = "[\\:\\/\\?\\#\\[\\]\\@]",
          ge = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
          ke = n(pe, ge),
          Ye = C
            ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]"
            : "[]",
          at = C ? "[\\uE000-\\uF8FF]" : "[]",
          Le = n(b, x, "[\\-\\.\\_\\~]", Ye);
        o(b + n(b, x, "[\\+\\-\\.]") + "*"),
          o(o(k + "|" + n(Le, ge, "[\\:]")) + "*");
        var Ge = o(
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
          lt = o(Ge + "\\." + Ge + "\\." + Ge + "\\." + Ge),
          Ae = o(B + "{1,4}"),
          rt = o(o(Ae + "\\:" + Ae) + "|" + lt),
          pt = o(o(Ae + "\\:") + "{6}" + rt),
          nt = o("\\:\\:" + o(Ae + "\\:") + "{5}" + rt),
          rn = o(o(Ae) + "?\\:\\:" + o(Ae + "\\:") + "{4}" + rt),
          pr = o(
            o(o(Ae + "\\:") + "{0,1}" + Ae) +
              "?\\:\\:" +
              o(Ae + "\\:") +
              "{3}" +
              rt
          ),
          hr = o(
            o(o(Ae + "\\:") + "{0,2}" + Ae) +
              "?\\:\\:" +
              o(Ae + "\\:") +
              "{2}" +
              rt
          ),
          po = o(o(o(Ae + "\\:") + "{0,3}" + Ae) + "?\\:\\:" + Ae + "\\:" + rt),
          Pn = o(o(o(Ae + "\\:") + "{0,4}" + Ae) + "?\\:\\:" + rt),
          Jt = o(o(o(Ae + "\\:") + "{0,5}" + Ae) + "?\\:\\:" + Ae),
          gr = o(o(o(Ae + "\\:") + "{0,6}" + Ae) + "?\\:\\:"),
          Cn = o([pt, nt, rn, pr, hr, po, Pn, Jt, gr].join("|")),
          Nr = o(o(Le + "|" + k) + "+");
        o("[vV]" + B + "+\\." + n(Le, ge, "[\\:]") + "+"),
          o(o(k + "|" + n(Le, ge)) + "*");
        var qo = o(k + "|" + n(Le, ge, "[\\:\\@]"));
        return (
          o(o(k + "|" + n(Le, ge, "[\\@]")) + "+"),
          o(o(qo + "|" + n("[\\/\\?]", at)) + "*"),
          {
            NOT_SCHEME: new RegExp(n("[^]", b, x, "[\\+\\-\\.]"), "g"),
            NOT_USERINFO: new RegExp(n("[^\\%\\:]", Le, ge), "g"),
            NOT_HOST: new RegExp(n("[^\\%\\[\\]\\:]", Le, ge), "g"),
            NOT_PATH: new RegExp(n("[^\\%\\/\\:\\@]", Le, ge), "g"),
            NOT_PATH_NOSCHEME: new RegExp(n("[^\\%\\/\\@]", Le, ge), "g"),
            NOT_QUERY: new RegExp(
              n("[^\\%]", Le, ge, "[\\:\\@\\/\\?]", at),
              "g"
            ),
            NOT_FRAGMENT: new RegExp(
              n("[^\\%]", Le, ge, "[\\:\\@\\/\\?]"),
              "g"
            ),
            ESCAPE: new RegExp(n("[^]", Le, ge), "g"),
            UNRESERVED: new RegExp(Le, "g"),
            OTHER_CHARS: new RegExp(n("[^\\%]", Le, ke), "g"),
            PCT_ENCODED: new RegExp(k, "g"),
            IPV4ADDRESS: new RegExp("^(" + lt + ")$"),
            IPV6ADDRESS: new RegExp(
              "^\\[?(" +
                Cn +
                ")" +
                o(o("\\%25|\\%(?!" + B + "{2})") + "(" + Nr + ")") +
                "?\\]?$"
            ),
            //RFC 6874, with relaxed parsing rules
          }
        );
      }
      var u = c(!1),
        f = c(!0),
        d = /* @__PURE__ */ (function () {
          function C(b, x) {
            var B = [],
              k = !0,
              pe = !1,
              ge = void 0;
            try {
              for (
                var ke = b[Symbol.iterator](), Ye;
                !(k = (Ye = ke.next()).done) &&
                (B.push(Ye.value), !(x && B.length === x));
                k = !0
              );
            } catch (at) {
              (pe = !0), (ge = at);
            } finally {
              try {
                !k && ke.return && ke.return();
              } finally {
                if (pe) throw ge;
              }
            }
            return B;
          }
          return function (b, x) {
            if (Array.isArray(b)) return b;
            if (Symbol.iterator in Object(b)) return C(b, x);
            throw new TypeError(
              "Invalid attempt to destructure non-iterable instance"
            );
          };
        })(),
        p = function (C) {
          if (Array.isArray(C)) {
            for (var b = 0, x = Array(C.length); b < C.length; b++) x[b] = C[b];
            return x;
          } else return Array.from(C);
        },
        h = 2147483647,
        m = 36,
        y = 1,
        g = 26,
        _ = 38,
        E = 700,
        S = 72,
        I = 128,
        A = "-",
        O = /^xn--/,
        L = /[^\0-\x7E]/,
        z = /[\x2E\u3002\uFF0E\uFF61]/g,
        H = {
          overflow: "Overflow: input needs wider integers to process",
          "not-basic": "Illegal input >= 0x80 (not a basic code point)",
          "invalid-input": "Invalid input",
        },
        ne = m - y,
        G = Math.floor,
        Ne = String.fromCharCode;
      function ue(C) {
        throw new RangeError(H[C]);
      }
      function Pe(C, b) {
        for (var x = [], B = C.length; B--; ) x[B] = b(C[B]);
        return x;
      }
      function be(C, b) {
        var x = C.split("@"),
          B = "";
        x.length > 1 && ((B = x[0] + "@"), (C = x[1])), (C = C.replace(z, "."));
        var k = C.split("."),
          pe = Pe(k, b).join(".");
        return B + pe;
      }
      function le(C) {
        for (var b = [], x = 0, B = C.length; x < B; ) {
          var k = C.charCodeAt(x++);
          if (k >= 55296 && k <= 56319 && x < B) {
            var pe = C.charCodeAt(x++);
            (pe & 64512) == 56320
              ? b.push(((k & 1023) << 10) + (pe & 1023) + 65536)
              : (b.push(k), x--);
          } else b.push(k);
        }
        return b;
      }
      var ve = function (b) {
          return String.fromCodePoint.apply(String, p(b));
        },
        Ue = function (b) {
          return b - 48 < 10
            ? b - 22
            : b - 65 < 26
              ? b - 65
              : b - 97 < 26
                ? b - 97
                : m;
        },
        ee = function (b, x) {
          return b + 22 + 75 * (b < 26) - ((x != 0) << 5);
        },
        R = function (b, x, B) {
          var k = 0;
          for (
            b = B ? G(b / E) : b >> 1, b += G(b / x);
            /* no initialization */
            b > (ne * g) >> 1;
            k += m
          )
            b = G(b / ne);
          return G(k + ((ne + 1) * b) / (b + _));
        },
        M = function (b) {
          var x = [],
            B = b.length,
            k = 0,
            pe = I,
            ge = S,
            ke = b.lastIndexOf(A);
          ke < 0 && (ke = 0);
          for (var Ye = 0; Ye < ke; ++Ye)
            b.charCodeAt(Ye) >= 128 && ue("not-basic"),
              x.push(b.charCodeAt(Ye));
          for (var at = ke > 0 ? ke + 1 : 0; at < B; ) {
            for (
              var Le = k, Ge = 1, lt = m;
              ;
              /* no condition */
              lt += m
            ) {
              at >= B && ue("invalid-input");
              var Ae = Ue(b.charCodeAt(at++));
              (Ae >= m || Ae > G((h - k) / Ge)) && ue("overflow"),
                (k += Ae * Ge);
              var rt = lt <= ge ? y : lt >= ge + g ? g : lt - ge;
              if (Ae < rt) break;
              var pt = m - rt;
              Ge > G(h / pt) && ue("overflow"), (Ge *= pt);
            }
            var nt = x.length + 1;
            (ge = R(k - Le, nt, Le == 0)),
              G(k / nt) > h - pe && ue("overflow"),
              (pe += G(k / nt)),
              (k %= nt),
              x.splice(k++, 0, pe);
          }
          return String.fromCodePoint.apply(String, x);
        },
        P = function (b) {
          var x = [];
          b = le(b);
          var B = b.length,
            k = I,
            pe = 0,
            ge = S,
            ke = !0,
            Ye = !1,
            at = void 0;
          try {
            for (
              var Le = b[Symbol.iterator](), Ge;
              !(ke = (Ge = Le.next()).done);
              ke = !0
            ) {
              var lt = Ge.value;
              lt < 128 && x.push(Ne(lt));
            }
          } catch (Yo) {
            (Ye = !0), (at = Yo);
          } finally {
            try {
              !ke && Le.return && Le.return();
            } finally {
              if (Ye) throw at;
            }
          }
          var Ae = x.length,
            rt = Ae;
          for (Ae && x.push(A); rt < B; ) {
            var pt = h,
              nt = !0,
              rn = !1,
              pr = void 0;
            try {
              for (
                var hr = b[Symbol.iterator](), po;
                !(nt = (po = hr.next()).done);
                nt = !0
              ) {
                var Pn = po.value;
                Pn >= k && Pn < pt && (pt = Pn);
              }
            } catch (Yo) {
              (rn = !0), (pr = Yo);
            } finally {
              try {
                !nt && hr.return && hr.return();
              } finally {
                if (rn) throw pr;
              }
            }
            var Jt = rt + 1;
            pt - k > G((h - pe) / Jt) && ue("overflow"),
              (pe += (pt - k) * Jt),
              (k = pt);
            var gr = !0,
              Cn = !1,
              Nr = void 0;
            try {
              for (
                var qo = b[Symbol.iterator](), If;
                !(gr = (If = qo.next()).done);
                gr = !0
              ) {
                var Rf = If.value;
                if ((Rf < k && ++pe > h && ue("overflow"), Rf == k)) {
                  for (
                    var os = pe, is = m;
                    ;
                    /* no condition */
                    is += m
                  ) {
                    var ss = is <= ge ? y : is >= ge + g ? g : is - ge;
                    if (os < ss) break;
                    var Mf = os - ss,
                      jf = m - ss;
                    x.push(Ne(ee(ss + (Mf % jf), 0))), (os = G(Mf / jf));
                  }
                  x.push(Ne(ee(os, 0))),
                    (ge = R(pe, Jt, rt == Ae)),
                    (pe = 0),
                    ++rt;
                }
              }
            } catch (Yo) {
              (Cn = !0), (Nr = Yo);
            } finally {
              try {
                !gr && qo.return && qo.return();
              } finally {
                if (Cn) throw Nr;
              }
            }
            ++pe, ++k;
          }
          return x.join("");
        },
        v = function (b) {
          return be(b, function (x) {
            return O.test(x) ? M(x.slice(4).toLowerCase()) : x;
          });
        },
        $ = function (b) {
          return be(b, function (x) {
            return L.test(x) ? "xn--" + P(x) : x;
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
            decode: le,
            encode: ve,
          },
          decode: M,
          encode: P,
          toASCII: $,
          toUnicode: v,
        },
        j = {};
      function F(C) {
        var b = C.charCodeAt(0),
          x = void 0;
        return (
          b < 16
            ? (x = "%0" + b.toString(16).toUpperCase())
            : b < 128
              ? (x = "%" + b.toString(16).toUpperCase())
              : b < 2048
                ? (x =
                    "%" +
                    ((b >> 6) | 192).toString(16).toUpperCase() +
                    "%" +
                    ((b & 63) | 128).toString(16).toUpperCase())
                : (x =
                    "%" +
                    ((b >> 12) | 224).toString(16).toUpperCase() +
                    "%" +
                    (((b >> 6) & 63) | 128).toString(16).toUpperCase() +
                    "%" +
                    ((b & 63) | 128).toString(16).toUpperCase()),
          x
        );
      }
      function q(C) {
        for (var b = "", x = 0, B = C.length; x < B; ) {
          var k = parseInt(C.substr(x + 1, 2), 16);
          if (k < 128) (b += String.fromCharCode(k)), (x += 3);
          else if (k >= 194 && k < 224) {
            if (B - x >= 6) {
              var pe = parseInt(C.substr(x + 4, 2), 16);
              b += String.fromCharCode(((k & 31) << 6) | (pe & 63));
            } else b += C.substr(x, 6);
            x += 6;
          } else if (k >= 224) {
            if (B - x >= 9) {
              var ge = parseInt(C.substr(x + 4, 2), 16),
                ke = parseInt(C.substr(x + 7, 2), 16);
              b += String.fromCharCode(
                ((k & 15) << 12) | ((ge & 63) << 6) | (ke & 63)
              );
            } else b += C.substr(x, 9);
            x += 9;
          } else (b += C.substr(x, 3)), (x += 3);
        }
        return b;
      }
      function oe(C, b) {
        function x(B) {
          var k = q(B);
          return k.match(b.UNRESERVED) ? k : B;
        }
        return (
          C.scheme &&
            (C.scheme = String(C.scheme)
              .replace(b.PCT_ENCODED, x)
              .toLowerCase()
              .replace(b.NOT_SCHEME, "")),
          C.userinfo !== void 0 &&
            (C.userinfo = String(C.userinfo)
              .replace(b.PCT_ENCODED, x)
              .replace(b.NOT_USERINFO, F)
              .replace(b.PCT_ENCODED, s)),
          C.host !== void 0 &&
            (C.host = String(C.host)
              .replace(b.PCT_ENCODED, x)
              .toLowerCase()
              .replace(b.NOT_HOST, F)
              .replace(b.PCT_ENCODED, s)),
          C.path !== void 0 &&
            (C.path = String(C.path)
              .replace(b.PCT_ENCODED, x)
              .replace(C.scheme ? b.NOT_PATH : b.NOT_PATH_NOSCHEME, F)
              .replace(b.PCT_ENCODED, s)),
          C.query !== void 0 &&
            (C.query = String(C.query)
              .replace(b.PCT_ENCODED, x)
              .replace(b.NOT_QUERY, F)
              .replace(b.PCT_ENCODED, s)),
          C.fragment !== void 0 &&
            (C.fragment = String(C.fragment)
              .replace(b.PCT_ENCODED, x)
              .replace(b.NOT_FRAGMENT, F)
              .replace(b.PCT_ENCODED, s)),
          C
        );
      }
      function we(C) {
        return C.replace(/^0*(.*)/, "$1") || "0";
      }
      function Ie(C, b) {
        var x = C.match(b.IPV4ADDRESS) || [],
          B = d(x, 2),
          k = B[1];
        return k ? k.split(".").map(we).join(".") : C;
      }
      function tt(C, b) {
        var x = C.match(b.IPV6ADDRESS) || [],
          B = d(x, 3),
          k = B[1],
          pe = B[2];
        if (k) {
          for (
            var ge = k.toLowerCase().split("::").reverse(),
              ke = d(ge, 2),
              Ye = ke[0],
              at = ke[1],
              Le = at ? at.split(":").map(we) : [],
              Ge = Ye.split(":").map(we),
              lt = b.IPV4ADDRESS.test(Ge[Ge.length - 1]),
              Ae = lt ? 7 : 8,
              rt = Ge.length - Ae,
              pt = Array(Ae),
              nt = 0;
            nt < Ae;
            ++nt
          )
            pt[nt] = Le[nt] || Ge[rt + nt] || "";
          lt && (pt[Ae - 1] = Ie(pt[Ae - 1], b));
          var rn = pt.reduce(function (Jt, gr, Cn) {
              if (!gr || gr === "0") {
                var Nr = Jt[Jt.length - 1];
                Nr && Nr.index + Nr.length === Cn
                  ? Nr.length++
                  : Jt.push({ index: Cn, length: 1 });
              }
              return Jt;
            }, []),
            pr = rn.sort(function (Jt, gr) {
              return gr.length - Jt.length;
            })[0],
            hr = void 0;
          if (pr && pr.length > 1) {
            var po = pt.slice(0, pr.index),
              Pn = pt.slice(pr.index + pr.length);
            hr = po.join(":") + "::" + Pn.join(":");
          } else hr = pt.join(":");
          return pe && (hr += "%" + pe), hr;
        } else return C;
      }
      var w =
          /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i,
        T = "".match(/(){0}/)[1] === void 0;
      function V(C) {
        var b =
            arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
          x = {},
          B = b.iri !== !1 ? f : u;
        b.reference === "suffix" &&
          (C = (b.scheme ? b.scheme + ":" : "") + "//" + C);
        var k = C.match(w);
        if (k) {
          T
            ? ((x.scheme = k[1]),
              (x.userinfo = k[3]),
              (x.host = k[4]),
              (x.port = parseInt(k[5], 10)),
              (x.path = k[6] || ""),
              (x.query = k[7]),
              (x.fragment = k[8]),
              isNaN(x.port) && (x.port = k[5]))
            : ((x.scheme = k[1] || void 0),
              (x.userinfo = C.indexOf("@") !== -1 ? k[3] : void 0),
              (x.host = C.indexOf("//") !== -1 ? k[4] : void 0),
              (x.port = parseInt(k[5], 10)),
              (x.path = k[6] || ""),
              (x.query = C.indexOf("?") !== -1 ? k[7] : void 0),
              (x.fragment = C.indexOf("#") !== -1 ? k[8] : void 0),
              isNaN(x.port) &&
                (x.port = C.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/)
                  ? k[4]
                  : void 0)),
            x.host && (x.host = tt(Ie(x.host, B), B)),
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
            b.reference &&
              b.reference !== "suffix" &&
              b.reference !== x.reference &&
              (x.error =
                x.error || "URI is not a " + b.reference + " reference.");
          var pe = j[(b.scheme || x.scheme || "").toLowerCase()];
          if (!b.unicodeSupport && (!pe || !pe.unicodeSupport)) {
            if (x.host && (b.domainHost || (pe && pe.domainHost)))
              try {
                x.host = N.toASCII(
                  x.host.replace(B.PCT_ENCODED, q).toLowerCase()
                );
              } catch (ge) {
                x.error =
                  x.error ||
                  "Host's domain name can not be converted to ASCII via punycode: " +
                    ge;
              }
            oe(x, u);
          } else oe(x, B);
          pe && pe.parse && pe.parse(x, b);
        } else x.error = x.error || "URI can not be parsed.";
        return x;
      }
      function Y(C, b) {
        var x = b.iri !== !1 ? f : u,
          B = [];
        return (
          C.userinfo !== void 0 && (B.push(C.userinfo), B.push("@")),
          C.host !== void 0 &&
            B.push(
              tt(Ie(String(C.host), x), x).replace(
                x.IPV6ADDRESS,
                function (k, pe, ge) {
                  return "[" + pe + (ge ? "%25" + ge : "") + "]";
                }
              )
            ),
          (typeof C.port == "number" || typeof C.port == "string") &&
            (B.push(":"), B.push(String(C.port))),
          B.length ? B.join("") : void 0
        );
      }
      var K = /^\.\.?\//,
        J = /^\/\.(\/|$)/,
        te = /^\/\.\.(\/|$)/,
        Q = /^\/?(?:.|\n)*?(?=\/|$)/;
      function X(C) {
        for (var b = []; C.length; )
          if (C.match(K)) C = C.replace(K, "");
          else if (C.match(J)) C = C.replace(J, "/");
          else if (C.match(te)) (C = C.replace(te, "/")), b.pop();
          else if (C === "." || C === "..") C = "";
          else {
            var x = C.match(Q);
            if (x) {
              var B = x[0];
              (C = C.slice(B.length)), b.push(B);
            } else throw new Error("Unexpected dot segment condition");
          }
        return b.join("");
      }
      function W(C) {
        var b =
            arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
          x = b.iri ? f : u,
          B = [],
          k = j[(b.scheme || C.scheme || "").toLowerCase()];
        if (
          (k && k.serialize && k.serialize(C, b),
          C.host && !x.IPV6ADDRESS.test(C.host))
        ) {
          if (b.domainHost || (k && k.domainHost))
            try {
              C.host = b.iri
                ? N.toUnicode(C.host)
                : N.toASCII(C.host.replace(x.PCT_ENCODED, q).toLowerCase());
            } catch (ke) {
              C.error =
                C.error ||
                "Host's domain name can not be converted to " +
                  (b.iri ? "Unicode" : "ASCII") +
                  " via punycode: " +
                  ke;
            }
        }
        oe(C, x),
          b.reference !== "suffix" &&
            C.scheme &&
            (B.push(C.scheme), B.push(":"));
        var pe = Y(C, b);
        if (
          (pe !== void 0 &&
            (b.reference !== "suffix" && B.push("//"),
            B.push(pe),
            C.path && C.path.charAt(0) !== "/" && B.push("/")),
          C.path !== void 0)
        ) {
          var ge = C.path;
          !b.absolutePath && (!k || !k.absolutePath) && (ge = X(ge)),
            pe === void 0 && (ge = ge.replace(/^\/\//, "/%2F")),
            B.push(ge);
        }
        return (
          C.query !== void 0 && (B.push("?"), B.push(C.query)),
          C.fragment !== void 0 && (B.push("#"), B.push(C.fragment)),
          B.join("")
        );
      }
      function re(C, b) {
        var x =
            arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {},
          B = arguments[3],
          k = {};
        return (
          B || ((C = V(W(C, x), x)), (b = V(W(b, x), x))),
          (x = x || {}),
          !x.tolerant && b.scheme
            ? ((k.scheme = b.scheme),
              (k.userinfo = b.userinfo),
              (k.host = b.host),
              (k.port = b.port),
              (k.path = X(b.path || "")),
              (k.query = b.query))
            : (b.userinfo !== void 0 || b.host !== void 0 || b.port !== void 0
                ? ((k.userinfo = b.userinfo),
                  (k.host = b.host),
                  (k.port = b.port),
                  (k.path = X(b.path || "")),
                  (k.query = b.query))
                : (b.path
                    ? (b.path.charAt(0) === "/"
                        ? (k.path = X(b.path))
                        : ((C.userinfo !== void 0 ||
                            C.host !== void 0 ||
                            C.port !== void 0) &&
                          !C.path
                            ? (k.path = "/" + b.path)
                            : C.path
                              ? (k.path =
                                  C.path.slice(0, C.path.lastIndexOf("/") + 1) +
                                  b.path)
                              : (k.path = b.path),
                          (k.path = X(k.path))),
                      (k.query = b.query))
                    : ((k.path = C.path),
                      b.query !== void 0
                        ? (k.query = b.query)
                        : (k.query = C.query)),
                  (k.userinfo = C.userinfo),
                  (k.host = C.host),
                  (k.port = C.port)),
              (k.scheme = C.scheme)),
          (k.fragment = b.fragment),
          k
        );
      }
      function ae(C, b, x) {
        var B = l({ scheme: "null" }, x);
        return W(re(V(C, B), V(b, B), B, !0), B);
      }
      function ie(C, b) {
        return (
          typeof C == "string"
            ? (C = W(V(C, b), b))
            : i(C) === "object" && (C = V(W(C, b), b)),
          C
        );
      }
      function _e(C, b, x) {
        return (
          typeof C == "string"
            ? (C = W(V(C, x), x))
            : i(C) === "object" && (C = W(C, x)),
          typeof b == "string"
            ? (b = W(V(b, x), x))
            : i(b) === "object" && (b = W(b, x)),
          C === b
        );
      }
      function Ce(C, b) {
        return C && C.toString().replace(!b || !b.iri ? u.ESCAPE : f.ESCAPE, F);
      }
      function Re(C, b) {
        return (
          C &&
          C.toString().replace(!b || !b.iri ? u.PCT_ENCODED : f.PCT_ENCODED, q)
        );
      }
      var Me = {
          scheme: "http",
          domainHost: !0,
          parse: function (b, x) {
            return (
              b.host || (b.error = b.error || "HTTP URIs must have a host."), b
            );
          },
          serialize: function (b, x) {
            var B = String(b.scheme).toLowerCase() === "https";
            return (
              (b.port === (B ? 443 : 80) || b.port === "") && (b.port = void 0),
              b.path || (b.path = "/"),
              b
            );
          },
        },
        st = {
          scheme: "https",
          domainHost: Me.domainHost,
          parse: Me.parse,
          serialize: Me.serialize,
        };
      function jt(C) {
        return typeof C.secure == "boolean"
          ? C.secure
          : String(C.scheme).toLowerCase() === "wss";
      }
      var qt = {
          scheme: "ws",
          domainHost: !0,
          parse: function (b, x) {
            var B = b;
            return (
              (B.secure = jt(B)),
              (B.resourceName =
                (B.path || "/") + (B.query ? "?" + B.query : "")),
              (B.path = void 0),
              (B.query = void 0),
              B
            );
          },
          serialize: function (b, x) {
            if (
              ((b.port === (jt(b) ? 443 : 80) || b.port === "") &&
                (b.port = void 0),
              typeof b.secure == "boolean" &&
                ((b.scheme = b.secure ? "wss" : "ws"), (b.secure = void 0)),
              b.resourceName)
            ) {
              var B = b.resourceName.split("?"),
                k = d(B, 2),
                pe = k[0],
                ge = k[1];
              (b.path = pe && pe !== "/" ? pe : void 0),
                (b.query = ge),
                (b.resourceName = void 0);
            }
            return (b.fragment = void 0), b;
          },
        },
        Ko = {
          scheme: "wss",
          domainHost: qt.domainHost,
          parse: qt.parse,
          serialize: qt.serialize,
        },
        Nn = {},
        Go =
          "[A-Za-z0-9\\-\\.\\_\\~\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]",
        Ke = "[0-9A-Fa-f]",
        Yt = o(
          o("%[EFef]" + Ke + "%" + Ke + Ke + "%" + Ke + Ke) +
            "|" +
            o("%[89A-Fa-f]" + Ke + "%" + Ke + Ke) +
            "|" +
            o("%" + Ke + Ke)
        ),
        ns = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]",
        u_ = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]",
        f_ = n(u_, '[\\"\\\\]'),
        d_ = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]",
        p_ = new RegExp(Go, "g"),
        fo = new RegExp(Yt, "g"),
        h_ = new RegExp(n("[^]", ns, "[\\.]", '[\\"]', f_), "g"),
        Cf = new RegExp(n("[^]", Go, d_), "g"),
        g_ = Cf;
      function tl(C) {
        var b = q(C);
        return b.match(p_) ? b : C;
      }
      var Tf = {
          scheme: "mailto",
          parse: function (b, x) {
            var B = b,
              k = (B.to = B.path ? B.path.split(",") : []);
            if (((B.path = void 0), B.query)) {
              for (
                var pe = !1,
                  ge = {},
                  ke = B.query.split("&"),
                  Ye = 0,
                  at = ke.length;
                Ye < at;
                ++Ye
              ) {
                var Le = ke[Ye].split("=");
                switch (Le[0]) {
                  case "to":
                    for (
                      var Ge = Le[1].split(","), lt = 0, Ae = Ge.length;
                      lt < Ae;
                      ++lt
                    )
                      k.push(Ge[lt]);
                    break;
                  case "subject":
                    B.subject = Re(Le[1], x);
                    break;
                  case "body":
                    B.body = Re(Le[1], x);
                    break;
                  default:
                    (pe = !0), (ge[Re(Le[0], x)] = Re(Le[1], x));
                    break;
                }
              }
              pe && (B.headers = ge);
            }
            B.query = void 0;
            for (var rt = 0, pt = k.length; rt < pt; ++rt) {
              var nt = k[rt].split("@");
              if (((nt[0] = Re(nt[0])), x.unicodeSupport))
                nt[1] = Re(nt[1], x).toLowerCase();
              else
                try {
                  nt[1] = N.toASCII(Re(nt[1], x).toLowerCase());
                } catch (rn) {
                  B.error =
                    B.error ||
                    "Email address's domain name can not be converted to ASCII via punycode: " +
                      rn;
                }
              k[rt] = nt.join("@");
            }
            return B;
          },
          serialize: function (b, x) {
            var B = b,
              k = a(b.to);
            if (k) {
              for (var pe = 0, ge = k.length; pe < ge; ++pe) {
                var ke = String(k[pe]),
                  Ye = ke.lastIndexOf("@"),
                  at = ke
                    .slice(0, Ye)
                    .replace(fo, tl)
                    .replace(fo, s)
                    .replace(h_, F),
                  Le = ke.slice(Ye + 1);
                try {
                  Le = x.iri
                    ? N.toUnicode(Le)
                    : N.toASCII(Re(Le, x).toLowerCase());
                } catch (rt) {
                  B.error =
                    B.error ||
                    "Email address's domain name can not be converted to " +
                      (x.iri ? "Unicode" : "ASCII") +
                      " via punycode: " +
                      rt;
                }
                k[pe] = at + "@" + Le;
              }
              B.path = k.join(",");
            }
            var Ge = (b.headers = b.headers || {});
            b.subject && (Ge.subject = b.subject), b.body && (Ge.body = b.body);
            var lt = [];
            for (var Ae in Ge)
              Ge[Ae] !== Nn[Ae] &&
                lt.push(
                  Ae.replace(fo, tl).replace(fo, s).replace(Cf, F) +
                    "=" +
                    Ge[Ae].replace(fo, tl).replace(fo, s).replace(g_, F)
                );
            return lt.length && (B.query = lt.join("&")), B;
          },
        },
        m_ = /^([^\:]+)\:(.*)/,
        xf = {
          scheme: "urn",
          parse: function (b, x) {
            var B = b.path && b.path.match(m_),
              k = b;
            if (B) {
              var pe = x.scheme || k.scheme || "urn",
                ge = B[1].toLowerCase(),
                ke = B[2],
                Ye = pe + ":" + (x.nid || ge),
                at = j[Ye];
              (k.nid = ge),
                (k.nss = ke),
                (k.path = void 0),
                at && (k = at.parse(k, x));
            } else k.error = k.error || "URN can not be parsed.";
            return k;
          },
          serialize: function (b, x) {
            var B = x.scheme || b.scheme || "urn",
              k = b.nid,
              pe = B + ":" + (x.nid || k),
              ge = j[pe];
            ge && (b = ge.serialize(b, x));
            var ke = b,
              Ye = b.nss;
            return (ke.path = (k || x.nid) + ":" + Ye), ke;
          },
        },
        v_ = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/,
        Df = {
          scheme: "urn:uuid",
          parse: function (b, x) {
            var B = b;
            return (
              (B.uuid = B.nss),
              (B.nss = void 0),
              !x.tolerant &&
                (!B.uuid || !B.uuid.match(v_)) &&
                (B.error = B.error || "UUID is not valid."),
              B
            );
          },
          serialize: function (b, x) {
            var B = b;
            return (B.nss = (b.uuid || "").toLowerCase()), B;
          },
        };
      (j[Me.scheme] = Me),
        (j[st.scheme] = st),
        (j[qt.scheme] = qt),
        (j[Ko.scheme] = Ko),
        (j[Tf.scheme] = Tf),
        (j[xf.scheme] = xf),
        (j[Df.scheme] = Df),
        (r.SCHEMES = j),
        (r.pctEncChar = F),
        (r.pctDecChars = q),
        (r.parse = V),
        (r.removeDotSegments = X),
        (r.serialize = W),
        (r.resolveComponents = re),
        (r.resolve = ae),
        (r.normalize = ie),
        (r.equal = _e),
        (r.escapeComponent = Ce),
        (r.unescapeComponent = Re),
        Object.defineProperty(r, "__esModule", { value: !0 });
    });
  })(_c, _c.exports);
  var XU = _c.exports;
  Object.defineProperty(Ju, "__esModule", { value: !0 });
  const Jy = XU;
  Jy.code = 'require("ajv/dist/runtime/uri").default';
  Ju.default = Jy;
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
    var t = Zt;
    Object.defineProperty(e, "KeywordCxt", {
      enumerable: !0,
      get: function () {
        return t.KeywordCxt;
      },
    });
    var r = De;
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
    const n = es,
      o = ts,
      i = Xn,
      s = kt,
      a = De,
      l = wt,
      c = Qi,
      u = Be,
      f = JU,
      d = Ju,
      p = (ee, R) => new RegExp(ee, R);
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
      y = {
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
    function E(ee) {
      var R,
        M,
        P,
        v,
        $,
        N,
        j,
        F,
        q,
        oe,
        we,
        Ie,
        tt,
        w,
        T,
        V,
        Y,
        K,
        J,
        te,
        Q,
        X,
        W,
        re,
        ae;
      const ie = ee.strict,
        _e = (R = ee.code) === null || R === void 0 ? void 0 : R.optimize,
        Ce = _e === !0 || _e === void 0 ? 1 : _e || 0,
        Re =
          (P = (M = ee.code) === null || M === void 0 ? void 0 : M.regExp) !==
            null && P !== void 0
            ? P
            : p,
        Me = (v = ee.uriResolver) !== null && v !== void 0 ? v : d.default;
      return {
        strictSchema:
          (N = ($ = ee.strictSchema) !== null && $ !== void 0 ? $ : ie) !==
            null && N !== void 0
            ? N
            : !0,
        strictNumbers:
          (F = (j = ee.strictNumbers) !== null && j !== void 0 ? j : ie) !==
            null && F !== void 0
            ? F
            : !0,
        strictTypes:
          (oe = (q = ee.strictTypes) !== null && q !== void 0 ? q : ie) !==
            null && oe !== void 0
            ? oe
            : "log",
        strictTuples:
          (Ie = (we = ee.strictTuples) !== null && we !== void 0 ? we : ie) !==
            null && Ie !== void 0
            ? Ie
            : "log",
        strictRequired:
          (w = (tt = ee.strictRequired) !== null && tt !== void 0 ? tt : ie) !==
            null && w !== void 0
            ? w
            : !1,
        code: ee.code
          ? { ...ee.code, optimize: Ce, regExp: Re }
          : { optimize: Ce, regExp: Re },
        loopRequired: (T = ee.loopRequired) !== null && T !== void 0 ? T : _,
        loopEnum: (V = ee.loopEnum) !== null && V !== void 0 ? V : _,
        meta: (Y = ee.meta) !== null && Y !== void 0 ? Y : !0,
        messages: (K = ee.messages) !== null && K !== void 0 ? K : !0,
        inlineRefs: (J = ee.inlineRefs) !== null && J !== void 0 ? J : !0,
        schemaId: (te = ee.schemaId) !== null && te !== void 0 ? te : "$id",
        addUsedSchema: (Q = ee.addUsedSchema) !== null && Q !== void 0 ? Q : !0,
        validateSchema:
          (X = ee.validateSchema) !== null && X !== void 0 ? X : !0,
        validateFormats:
          (W = ee.validateFormats) !== null && W !== void 0 ? W : !0,
        unicodeRegExp:
          (re = ee.unicodeRegExp) !== null && re !== void 0 ? re : !0,
        int32range: (ae = ee.int32range) !== null && ae !== void 0 ? ae : !0,
        uriResolver: Me,
      };
    }
    class S {
      constructor(R = {}) {
        (this.schemas = {}),
          (this.refs = {}),
          (this.formats = {}),
          (this._compilations = /* @__PURE__ */ new Set()),
          (this._loading = {}),
          (this._cache = /* @__PURE__ */ new Map()),
          (R = this.opts = { ...R, ...E(R) });
        const { es5: M, lines: P } = this.opts.code;
        (this.scope = new a.ValueScope({
          scope: {},
          prefixes: m,
          es5: M,
          lines: P,
        })),
          (this.logger = G(R.logger));
        const v = R.validateFormats;
        (R.validateFormats = !1),
          (this.RULES = (0, i.getRules)()),
          I.call(this, y, R, "NOT SUPPORTED"),
          I.call(this, g, R, "DEPRECATED", "warn"),
          (this._metaOpts = H.call(this)),
          R.formats && L.call(this),
          this._addVocabularies(),
          this._addDefaultMetaSchema(),
          R.keywords && z.call(this, R.keywords),
          typeof R.meta == "object" && this.addMetaSchema(R.meta),
          O.call(this),
          (R.validateFormats = v);
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: R, meta: M, schemaId: P } = this.opts;
        let v = f;
        P === "id" && ((v = { ...f }), (v.id = v.$id), delete v.$id),
          M && R && this.addMetaSchema(v, v[P], !1);
      }
      defaultMeta() {
        const { meta: R, schemaId: M } = this.opts;
        return (this.opts.defaultMeta =
          typeof R == "object" ? R[M] || R : void 0);
      }
      validate(R, M) {
        let P;
        if (typeof R == "string") {
          if (((P = this.getSchema(R)), !P))
            throw new Error(`no schema with key or ref "${R}"`);
        } else P = this.compile(R);
        const v = P(M);
        return "$async" in P || (this.errors = P.errors), v;
      }
      compile(R, M) {
        const P = this._addSchema(R, M);
        return P.validate || this._compileSchemaEnv(P);
      }
      compileAsync(R, M) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: P } = this.opts;
        return v.call(this, R, M);
        async function v(oe, we) {
          await $.call(this, oe.$schema);
          const Ie = this._addSchema(oe, we);
          return Ie.validate || N.call(this, Ie);
        }
        async function $(oe) {
          oe && !this.getSchema(oe) && (await v.call(this, { $ref: oe }, !0));
        }
        async function N(oe) {
          try {
            return this._compileSchemaEnv(oe);
          } catch (we) {
            if (!(we instanceof o.default)) throw we;
            return (
              j.call(this, we),
              await F.call(this, we.missingSchema),
              N.call(this, oe)
            );
          }
        }
        function j({ missingSchema: oe, missingRef: we }) {
          if (this.refs[oe])
            throw new Error(
              `AnySchema ${oe} is loaded but ${we} cannot be resolved`
            );
        }
        async function F(oe) {
          const we = await q.call(this, oe);
          this.refs[oe] || (await $.call(this, we.$schema)),
            this.refs[oe] || this.addSchema(we, oe, M);
        }
        async function q(oe) {
          const we = this._loading[oe];
          if (we) return we;
          try {
            return await (this._loading[oe] = P(oe));
          } finally {
            delete this._loading[oe];
          }
        }
      }
      // Adds schema to the instance
      addSchema(R, M, P, v = this.opts.validateSchema) {
        if (Array.isArray(R)) {
          for (const N of R) this.addSchema(N, void 0, P, v);
          return this;
        }
        let $;
        if (typeof R == "object") {
          const { schemaId: N } = this.opts;
          if ((($ = R[N]), $ !== void 0 && typeof $ != "string"))
            throw new Error(`schema ${N} must be string`);
        }
        return (
          (M = (0, l.normalizeId)(M || $)),
          this._checkUnique(M),
          (this.schemas[M] = this._addSchema(R, P, M, v, !0)),
          this
        );
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(R, M, P = this.opts.validateSchema) {
        return this.addSchema(R, M, !0, P), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(R, M) {
        if (typeof R == "boolean") return !0;
        let P;
        if (((P = R.$schema), P !== void 0 && typeof P != "string"))
          throw new Error("$schema must be a string");
        if (((P = P || this.opts.defaultMeta || this.defaultMeta()), !P))
          return (
            this.logger.warn("meta-schema not available"),
            (this.errors = null),
            !0
          );
        const v = this.validate(P, R);
        if (!v && M) {
          const $ = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log") this.logger.error($);
          else throw new Error($);
        }
        return v;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(R) {
        let M;
        for (; typeof (M = A.call(this, R)) == "string"; ) R = M;
        if (M === void 0) {
          const { schemaId: P } = this.opts,
            v = new s.SchemaEnv({ schema: {}, schemaId: P });
          if (((M = s.resolveSchema.call(this, v, R)), !M)) return;
          this.refs[R] = M;
        }
        return M.validate || this._compileSchemaEnv(M);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(R) {
        if (R instanceof RegExp)
          return (
            this._removeAllSchemas(this.schemas, R),
            this._removeAllSchemas(this.refs, R),
            this
          );
        switch (typeof R) {
          case "undefined":
            return (
              this._removeAllSchemas(this.schemas),
              this._removeAllSchemas(this.refs),
              this._cache.clear(),
              this
            );
          case "string": {
            const M = A.call(this, R);
            return (
              typeof M == "object" && this._cache.delete(M.schema),
              delete this.schemas[R],
              delete this.refs[R],
              this
            );
          }
          case "object": {
            const M = R;
            this._cache.delete(M);
            let P = R[this.opts.schemaId];
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
      addVocabulary(R) {
        for (const M of R) this.addKeyword(M);
        return this;
      }
      addKeyword(R, M) {
        let P;
        if (typeof R == "string")
          (P = R),
            typeof M == "object" &&
              (this.logger.warn(
                "these parameters are deprecated, see docs for addKeyword"
              ),
              (M.keyword = P));
        else if (typeof R == "object" && M === void 0) {
          if (((M = R), (P = M.keyword), Array.isArray(P) && !P.length))
            throw new Error(
              "addKeywords: keyword must be string or non-empty array"
            );
        } else throw new Error("invalid addKeywords parameters");
        if ((ue.call(this, P, M), !M))
          return (0, u.eachItem)(P, $ => Pe.call(this, $)), this;
        le.call(this, M);
        const v = {
          ...M,
          type: (0, c.getJSONTypes)(M.type),
          schemaType: (0, c.getJSONTypes)(M.schemaType),
        };
        return (
          (0, u.eachItem)(
            P,
            v.type.length === 0
              ? $ => Pe.call(this, $, v)
              : $ => v.type.forEach(N => Pe.call(this, $, v, N))
          ),
          this
        );
      }
      getKeyword(R) {
        const M = this.RULES.all[R];
        return typeof M == "object" ? M.definition : !!M;
      }
      // Remove keyword
      removeKeyword(R) {
        const { RULES: M } = this;
        delete M.keywords[R], delete M.all[R];
        for (const P of M.rules) {
          const v = P.rules.findIndex($ => $.keyword === R);
          v >= 0 && P.rules.splice(v, 1);
        }
        return this;
      }
      // Add format
      addFormat(R, M) {
        return (
          typeof M == "string" && (M = new RegExp(M)),
          (this.formats[R] = M),
          this
        );
      }
      errorsText(
        R = this.errors,
        { separator: M = ", ", dataVar: P = "data" } = {}
      ) {
        return !R || R.length === 0
          ? "No errors"
          : R.map(v => `${P}${v.instancePath} ${v.message}`).reduce(
              (v, $) => v + M + $
            );
      }
      $dataMetaSchema(R, M) {
        const P = this.RULES.all;
        R = JSON.parse(JSON.stringify(R));
        for (const v of M) {
          const $ = v.split("/").slice(1);
          let N = R;
          for (const j of $) N = N[j];
          for (const j in P) {
            const F = P[j];
            if (typeof F != "object") continue;
            const { $data: q } = F.definition,
              oe = N[j];
            q && oe && (N[j] = Ue(oe));
          }
        }
        return R;
      }
      _removeAllSchemas(R, M) {
        for (const P in R) {
          const v = R[P];
          (!M || M.test(P)) &&
            (typeof v == "string"
              ? delete R[P]
              : v && !v.meta && (this._cache.delete(v.schema), delete R[P]));
        }
      }
      _addSchema(
        R,
        M,
        P,
        v = this.opts.validateSchema,
        $ = this.opts.addUsedSchema
      ) {
        let N;
        const { schemaId: j } = this.opts;
        if (typeof R == "object") N = R[j];
        else {
          if (this.opts.jtd) throw new Error("schema must be object");
          if (typeof R != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let F = this._cache.get(R);
        if (F !== void 0) return F;
        P = (0, l.normalizeId)(N || P);
        const q = l.getSchemaRefs.call(this, R, P);
        return (
          (F = new s.SchemaEnv({
            schema: R,
            schemaId: j,
            meta: M,
            baseId: P,
            localRefs: q,
          })),
          this._cache.set(F.schema, F),
          $ &&
            !P.startsWith("#") &&
            (P && this._checkUnique(P), (this.refs[P] = F)),
          v && this.validateSchema(R, !0),
          F
        );
      }
      _checkUnique(R) {
        if (this.schemas[R] || this.refs[R])
          throw new Error(`schema with key or id "${R}" already exists`);
      }
      _compileSchemaEnv(R) {
        if (
          (R.meta ? this._compileMetaSchema(R) : s.compileSchema.call(this, R),
          !R.validate)
        )
          throw new Error("ajv implementation error");
        return R.validate;
      }
      _compileMetaSchema(R) {
        const M = this.opts;
        this.opts = this._metaOpts;
        try {
          s.compileSchema.call(this, R);
        } finally {
          this.opts = M;
        }
      }
    }
    (e.default = S),
      (S.ValidationError = n.default),
      (S.MissingRefError = o.default);
    function I(ee, R, M, P = "error") {
      for (const v in ee) {
        const $ = v;
        $ in R && this.logger[P](`${M}: option ${v}. ${ee[$]}`);
      }
    }
    function A(ee) {
      return (ee = (0, l.normalizeId)(ee)), this.schemas[ee] || this.refs[ee];
    }
    function O() {
      const ee = this.opts.schemas;
      if (ee)
        if (Array.isArray(ee)) this.addSchema(ee);
        else for (const R in ee) this.addSchema(ee[R], R);
    }
    function L() {
      for (const ee in this.opts.formats) {
        const R = this.opts.formats[ee];
        R && this.addFormat(ee, R);
      }
    }
    function z(ee) {
      if (Array.isArray(ee)) {
        this.addVocabulary(ee);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const R in ee) {
        const M = ee[R];
        M.keyword || (M.keyword = R), this.addKeyword(M);
      }
    }
    function H() {
      const ee = { ...this.opts };
      for (const R of h) delete ee[R];
      return ee;
    }
    const ne = { log() {}, warn() {}, error() {} };
    function G(ee) {
      if (ee === !1) return ne;
      if (ee === void 0) return console;
      if (ee.log && ee.warn && ee.error) return ee;
      throw new Error("logger must implement log, warn and error methods");
    }
    const Ne = /^[a-z_$][a-z0-9_$:-]*$/i;
    function ue(ee, R) {
      const { RULES: M } = this;
      if (
        ((0, u.eachItem)(ee, P => {
          if (M.keywords[P]) throw new Error(`Keyword ${P} is already defined`);
          if (!Ne.test(P)) throw new Error(`Keyword ${P} has invalid name`);
        }),
        !!R && R.$data && !("code" in R || "validate" in R))
      )
        throw new Error(
          '$data keyword must have "code" or "validate" function'
        );
    }
    function Pe(ee, R, M) {
      var P;
      const v = R == null ? void 0 : R.post;
      if (M && v)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: $ } = this;
      let N = v ? $.post : $.rules.find(({ type: F }) => F === M);
      if (
        (N || ((N = { type: M, rules: [] }), $.rules.push(N)),
        ($.keywords[ee] = !0),
        !R)
      )
        return;
      const j = {
        keyword: ee,
        definition: {
          ...R,
          type: (0, c.getJSONTypes)(R.type),
          schemaType: (0, c.getJSONTypes)(R.schemaType),
        },
      };
      R.before ? be.call(this, N, j, R.before) : N.rules.push(j),
        ($.all[ee] = j),
        (P = R.implements) === null ||
          P === void 0 ||
          P.forEach(F => this.addKeyword(F));
    }
    function be(ee, R, M) {
      const P = ee.rules.findIndex(v => v.keyword === M);
      P >= 0
        ? ee.rules.splice(P, 0, R)
        : (ee.rules.push(R), this.logger.warn(`rule ${M} is not defined`));
    }
    function le(ee) {
      let { metaSchema: R } = ee;
      R !== void 0 &&
        (ee.$data && this.opts.$data && (R = Ue(R)),
        (ee.validateSchema = this.compile(R, !0)));
    }
    const ve = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
    };
    function Ue(ee) {
      return { anyOf: [ee, ve] };
    }
  })(Sy);
  var Xu = {},
    Zu = {},
    Qu = {};
  Object.defineProperty(Qu, "__esModule", { value: !0 });
  const ZU = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    },
  };
  Qu.default = ZU;
  var Zn = {};
  Object.defineProperty(Zn, "__esModule", { value: !0 });
  Zn.callRef = Zn.getValidate = void 0;
  const QU = ts,
    Rh = je,
    Lt = De,
    mo = dr,
    Mh = kt,
    bs = Be,
    eW = {
      keyword: "$ref",
      schemaType: "string",
      code(e) {
        const { gen: t, schema: r, it: n } = e,
          { baseId: o, schemaEnv: i, validateName: s, opts: a, self: l } = n,
          { root: c } = i;
        if ((r === "#" || r === "#/") && o === c.baseId) return f();
        const u = Mh.resolveRef.call(l, c, o, r);
        if (u === void 0) throw new QU.default(n.opts.uriResolver, o, r);
        if (u instanceof Mh.SchemaEnv) return d(u);
        return p(u);
        function f() {
          if (i === c) return Ms(e, s, i, i.$async);
          const h = t.scopeValue("root", { ref: c });
          return Ms(e, (0, Lt._)`${h}.validate`, c, c.$async);
        }
        function d(h) {
          const m = Xy(e, h);
          Ms(e, m, h, h.$async);
        }
        function p(h) {
          const m = t.scopeValue(
              "schema",
              a.code.source === !0
                ? { ref: h, code: (0, Lt.stringify)(h) }
                : { ref: h }
            ),
            y = t.name("valid"),
            g = e.subschema(
              {
                schema: h,
                dataTypes: [],
                schemaPath: Lt.nil,
                topSchemaRef: m,
                errSchemaPath: r,
              },
              y
            );
          e.mergeEvaluated(g), e.ok(y);
        }
      },
    };
  function Xy(e, t) {
    const { gen: r } = e;
    return t.validate
      ? r.scopeValue("validate", { ref: t.validate })
      : (0, Lt._)`${r.scopeValue("wrapper", { ref: t })}.validate`;
  }
  Zn.getValidate = Xy;
  function Ms(e, t, r, n) {
    const { gen: o, it: i } = e,
      { allErrors: s, schemaEnv: a, opts: l } = i,
      c = l.passContext ? mo.default.this : Lt.nil;
    n ? u() : f();
    function u() {
      if (!a.$async) throw new Error("async schema referenced by sync schema");
      const h = o.let("valid");
      o.try(
        () => {
          o.code((0, Lt._)`await ${(0, Rh.callValidateCode)(e, t, c)}`),
            p(t),
            s || o.assign(h, !0);
        },
        m => {
          o.if((0, Lt._)`!(${m} instanceof ${i.ValidationError})`, () =>
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
        (0, Rh.callValidateCode)(e, t, c),
        () => p(t),
        () => d(t)
      );
    }
    function d(h) {
      const m = (0, Lt._)`${h}.errors`;
      o.assign(
        mo.default.vErrors,
        (0,
        Lt._)`${mo.default.vErrors} === null ? ${m} : ${mo.default.vErrors}.concat(${m})`
      ),
        o.assign(mo.default.errors, (0, Lt._)`${mo.default.vErrors}.length`);
    }
    function p(h) {
      var m;
      if (!i.opts.unevaluated) return;
      const y =
        (m = r == null ? void 0 : r.validate) === null || m === void 0
          ? void 0
          : m.evaluated;
      if (i.props !== !0)
        if (y && !y.dynamicProps)
          y.props !== void 0 &&
            (i.props = bs.mergeEvaluated.props(o, y.props, i.props));
        else {
          const g = o.var("props", (0, Lt._)`${h}.evaluated.props`);
          i.props = bs.mergeEvaluated.props(o, g, i.props, Lt.Name);
        }
      if (i.items !== !0)
        if (y && !y.dynamicItems)
          y.items !== void 0 &&
            (i.items = bs.mergeEvaluated.items(o, y.items, i.items));
        else {
          const g = o.var("items", (0, Lt._)`${h}.evaluated.items`);
          i.items = bs.mergeEvaluated.items(o, g, i.items, Lt.Name);
        }
    }
  }
  Zn.callRef = Ms;
  Zn.default = eW;
  Object.defineProperty(Zu, "__esModule", { value: !0 });
  const tW = Qu,
    rW = Zn,
    nW = [
      "$schema",
      "$id",
      "$defs",
      "$vocabulary",
      { keyword: "$comment" },
      "definitions",
      tW.default,
      rW.default,
    ];
  Zu.default = nW;
  var ef = {},
    tf = {};
  Object.defineProperty(tf, "__esModule", { value: !0 });
  const ua = De,
    ln = ua.operators,
    fa = {
      maximum: { okStr: "<=", ok: ln.LTE, fail: ln.GT },
      minimum: { okStr: ">=", ok: ln.GTE, fail: ln.LT },
      exclusiveMaximum: { okStr: "<", ok: ln.LT, fail: ln.GTE },
      exclusiveMinimum: { okStr: ">", ok: ln.GT, fail: ln.LTE },
    },
    oW = {
      message: ({ keyword: e, schemaCode: t }) =>
        (0, ua.str)`must be ${fa[e].okStr} ${t}`,
      params: ({ keyword: e, schemaCode: t }) =>
        (0, ua._)`{comparison: ${fa[e].okStr}, limit: ${t}}`,
    },
    iW = {
      keyword: Object.keys(fa),
      type: "number",
      schemaType: "number",
      $data: !0,
      error: oW,
      code(e) {
        const { keyword: t, data: r, schemaCode: n } = e;
        e.fail$data((0, ua._)`${r} ${fa[t].fail} ${n} || isNaN(${r})`);
      },
    };
  tf.default = iW;
  var rf = {};
  Object.defineProperty(rf, "__esModule", { value: !0 });
  const bi = De,
    sW = {
      message: ({ schemaCode: e }) => (0, bi.str)`must be multiple of ${e}`,
      params: ({ schemaCode: e }) => (0, bi._)`{multipleOf: ${e}}`,
    },
    aW = {
      keyword: "multipleOf",
      type: "number",
      schemaType: "number",
      $data: !0,
      error: sW,
      code(e) {
        const { gen: t, data: r, schemaCode: n, it: o } = e,
          i = o.opts.multipleOfPrecision,
          s = t.let("res"),
          a = i
            ? (0, bi._)`Math.abs(Math.round(${s}) - ${s}) > 1e-${i}`
            : (0, bi._)`${s} !== parseInt(${s})`;
        e.fail$data((0, bi._)`(${n} === 0 || (${s} = ${r}/${n}, ${a}))`);
      },
    };
  rf.default = aW;
  var nf = {},
    of = {};
  Object.defineProperty(of, "__esModule", { value: !0 });
  function Zy(e) {
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
  of.default = Zy;
  Zy.code = 'require("ajv/dist/runtime/ucs2length").default';
  Object.defineProperty(nf, "__esModule", { value: !0 });
  const jn = De,
    lW = Be,
    cW = of,
    uW = {
      message({ keyword: e, schemaCode: t }) {
        const r = e === "maxLength" ? "more" : "fewer";
        return (0, jn.str)`must NOT have ${r} than ${t} characters`;
      },
      params: ({ schemaCode: e }) => (0, jn._)`{limit: ${e}}`,
    },
    fW = {
      keyword: ["maxLength", "minLength"],
      type: "string",
      schemaType: "number",
      $data: !0,
      error: uW,
      code(e) {
        const { keyword: t, data: r, schemaCode: n, it: o } = e,
          i = t === "maxLength" ? jn.operators.GT : jn.operators.LT,
          s =
            o.opts.unicode === !1
              ? (0, jn._)`${r}.length`
              : (0, jn._)`${(0, lW.useFunc)(e.gen, cW.default)}(${r})`;
        e.fail$data((0, jn._)`${s} ${i} ${n}`);
      },
    };
  nf.default = fW;
  var sf = {};
  Object.defineProperty(sf, "__esModule", { value: !0 });
  const dW = je,
    da = De,
    pW = {
      message: ({ schemaCode: e }) => (0, da.str)`must match pattern "${e}"`,
      params: ({ schemaCode: e }) => (0, da._)`{pattern: ${e}}`,
    },
    hW = {
      keyword: "pattern",
      type: "string",
      schemaType: "string",
      $data: !0,
      error: pW,
      code(e) {
        const { data: t, $data: r, schema: n, schemaCode: o, it: i } = e,
          s = i.opts.unicodeRegExp ? "u" : "",
          a = r
            ? (0, da._)`(new RegExp(${o}, ${s}))`
            : (0, dW.usePattern)(e, n);
        e.fail$data((0, da._)`!${a}.test(${t})`);
      },
    };
  sf.default = hW;
  var af = {};
  Object.defineProperty(af, "__esModule", { value: !0 });
  const wi = De,
    gW = {
      message({ keyword: e, schemaCode: t }) {
        const r = e === "maxProperties" ? "more" : "fewer";
        return (0, wi.str)`must NOT have ${r} than ${t} properties`;
      },
      params: ({ schemaCode: e }) => (0, wi._)`{limit: ${e}}`,
    },
    mW = {
      keyword: ["maxProperties", "minProperties"],
      type: "object",
      schemaType: "number",
      $data: !0,
      error: gW,
      code(e) {
        const { keyword: t, data: r, schemaCode: n } = e,
          o = t === "maxProperties" ? wi.operators.GT : wi.operators.LT;
        e.fail$data((0, wi._)`Object.keys(${r}).length ${o} ${n}`);
      },
    };
  af.default = mW;
  var lf = {};
  Object.defineProperty(lf, "__esModule", { value: !0 });
  const si = je,
    Ei = De,
    vW = Be,
    yW = {
      message: ({ params: { missingProperty: e } }) =>
        (0, Ei.str)`must have required property '${e}'`,
      params: ({ params: { missingProperty: e } }) =>
        (0, Ei._)`{missingProperty: ${e}}`,
    },
    _W = {
      keyword: "required",
      type: "object",
      schemaType: "array",
      $data: !0,
      error: yW,
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
              const y = s.schemaEnv.baseId + s.errSchemaPath,
                g = `required property "${m}" is not defined at "${y}" (strictRequired)`;
              (0, vW.checkStrictMode)(s, g, s.opts.strictRequired);
            }
        }
        function c() {
          if (l || i) e.block$data(Ei.nil, f);
          else for (const p of r) (0, si.checkReportMissingProp)(e, p);
        }
        function u() {
          const p = t.let("missing");
          if (l || i) {
            const h = t.let("valid", !0);
            e.block$data(h, () => d(p, h)), e.ok(h);
          } else
            t.if((0, si.checkMissingProp)(e, r, p)),
              (0, si.reportMissingProp)(e, p),
              t.else();
        }
        function f() {
          t.forOf("prop", n, p => {
            e.setParams({ missingProperty: p }),
              t.if((0, si.noPropertyInData)(t, o, p, a.ownProperties), () =>
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
                t.assign(h, (0, si.propertyInData)(t, o, p, a.ownProperties)),
                  t.if((0, Ei.not)(h), () => {
                    e.error(), t.break();
                  });
              },
              Ei.nil
            );
        }
      },
    };
  lf.default = _W;
  var cf = {};
  Object.defineProperty(cf, "__esModule", { value: !0 });
  const Oi = De,
    $W = {
      message({ keyword: e, schemaCode: t }) {
        const r = e === "maxItems" ? "more" : "fewer";
        return (0, Oi.str)`must NOT have ${r} than ${t} items`;
      },
      params: ({ schemaCode: e }) => (0, Oi._)`{limit: ${e}}`,
    },
    bW = {
      keyword: ["maxItems", "minItems"],
      type: "array",
      schemaType: "number",
      $data: !0,
      error: $W,
      code(e) {
        const { keyword: t, data: r, schemaCode: n } = e,
          o = t === "maxItems" ? Oi.operators.GT : Oi.operators.LT;
        e.fail$data((0, Oi._)`${r}.length ${o} ${n}`);
      },
    };
  cf.default = bW;
  var uf = {},
    rs = {};
  Object.defineProperty(rs, "__esModule", { value: !0 });
  const Qy = Iy;
  Qy.code = 'require("ajv/dist/runtime/equal").default';
  rs.default = Qy;
  Object.defineProperty(uf, "__esModule", { value: !0 });
  const Ml = Qi,
    bt = De,
    wW = Be,
    EW = rs,
    OW = {
      message: ({ params: { i: e, j: t } }) =>
        (0,
        bt.str)`must NOT have duplicate items (items ## ${t} and ${e} are identical)`,
      params: ({ params: { i: e, j: t } }) => (0, bt._)`{i: ${e}, j: ${t}}`,
    },
    SW = {
      keyword: "uniqueItems",
      type: "array",
      schemaType: "boolean",
      $data: !0,
      error: OW,
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
          c = i.items ? (0, Ml.getSchemaTypes)(i.items) : [];
        e.block$data(l, u, (0, bt._)`${s} === false`), e.ok(l);
        function u() {
          const h = t.let("i", (0, bt._)`${r}.length`),
            m = t.let("j");
          e.setParams({ i: h, j: m }),
            t.assign(l, !0),
            t.if((0, bt._)`${h} > 1`, () => (f() ? d : p)(h, m));
        }
        function f() {
          return c.length > 0 && !c.some(h => h === "object" || h === "array");
        }
        function d(h, m) {
          const y = t.name("item"),
            g = (0, Ml.checkDataTypes)(
              c,
              y,
              a.opts.strictNumbers,
              Ml.DataType.Wrong
            ),
            _ = t.const("indices", (0, bt._)`{}`);
          t.for((0, bt._)`;${h}--;`, () => {
            t.let(y, (0, bt._)`${r}[${h}]`),
              t.if(g, (0, bt._)`continue`),
              c.length > 1 &&
                t.if(
                  (0, bt._)`typeof ${y} == "string"`,
                  (0, bt._)`${y} += "_"`
                ),
              t
                .if((0, bt._)`typeof ${_}[${y}] == "number"`, () => {
                  t.assign(m, (0, bt._)`${_}[${y}]`),
                    e.error(),
                    t.assign(l, !1).break();
                })
                .code((0, bt._)`${_}[${y}] = ${h}`);
          });
        }
        function p(h, m) {
          const y = (0, wW.useFunc)(t, EW.default),
            g = t.name("outer");
          t.label(g).for((0, bt._)`;${h}--;`, () =>
            t.for((0, bt._)`${m} = ${h}; ${m}--;`, () =>
              t.if((0, bt._)`${y}(${r}[${h}], ${r}[${m}])`, () => {
                e.error(), t.assign(l, !1).break(g);
              })
            )
          );
        }
      },
    };
  uf.default = SW;
  var ff = {};
  Object.defineProperty(ff, "__esModule", { value: !0 });
  const $c = De,
    AW = Be,
    NW = rs,
    PW = {
      message: "must be equal to constant",
      params: ({ schemaCode: e }) => (0, $c._)`{allowedValue: ${e}}`,
    },
    CW = {
      keyword: "const",
      $data: !0,
      error: PW,
      code(e) {
        const { gen: t, data: r, $data: n, schemaCode: o, schema: i } = e;
        n || (i && typeof i == "object")
          ? e.fail$data(
              (0, $c._)`!${(0, AW.useFunc)(t, NW.default)}(${r}, ${o})`
            )
          : e.fail((0, $c._)`${i} !== ${r}`);
      },
    };
  ff.default = CW;
  var df = {};
  Object.defineProperty(df, "__esModule", { value: !0 });
  const ui = De,
    TW = Be,
    xW = rs,
    DW = {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: e }) => (0, ui._)`{allowedValues: ${e}}`,
    },
    IW = {
      keyword: "enum",
      schemaType: "array",
      $data: !0,
      error: DW,
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
        const c = () => l ?? (l = (0, TW.useFunc)(t, xW.default));
        let u;
        if (a || n) (u = t.let("valid")), e.block$data(u, f);
        else {
          if (!Array.isArray(o)) throw new Error("ajv implementation error");
          const p = t.const("vSchema", i);
          u = (0, ui.or)(...o.map((h, m) => d(p, m)));
        }
        e.pass(u);
        function f() {
          t.assign(u, !1),
            t.forOf("v", i, p =>
              t.if((0, ui._)`${c()}(${r}, ${p})`, () => t.assign(u, !0).break())
            );
        }
        function d(p, h) {
          const m = o[h];
          return typeof m == "object" && m !== null
            ? (0, ui._)`${c()}(${r}, ${p}[${h}])`
            : (0, ui._)`${r} === ${m}`;
        }
      },
    };
  df.default = IW;
  Object.defineProperty(ef, "__esModule", { value: !0 });
  const RW = tf,
    MW = rf,
    jW = nf,
    FW = sf,
    LW = af,
    VW = lf,
    kW = cf,
    BW = uf,
    zW = ff,
    UW = df,
    WW = [
      // number
      RW.default,
      MW.default,
      // string
      jW.default,
      FW.default,
      // object
      LW.default,
      VW.default,
      // array
      kW.default,
      BW.default,
      // any
      { keyword: "type", schemaType: ["string", "array"] },
      { keyword: "nullable", schemaType: "boolean" },
      zW.default,
      UW.default,
    ];
  ef.default = WW;
  var pf = {},
    Uo = {};
  Object.defineProperty(Uo, "__esModule", { value: !0 });
  Uo.validateAdditionalItems = void 0;
  const Fn = De,
    bc = Be,
    HW = {
      message: ({ params: { len: e } }) =>
        (0, Fn.str)`must NOT have more than ${e} items`,
      params: ({ params: { len: e } }) => (0, Fn._)`{limit: ${e}}`,
    },
    KW = {
      keyword: "additionalItems",
      type: "array",
      schemaType: ["boolean", "object"],
      before: "uniqueItems",
      error: HW,
      code(e) {
        const { parentSchema: t, it: r } = e,
          { items: n } = t;
        if (!Array.isArray(n)) {
          (0, bc.checkStrictMode)(
            r,
            '"additionalItems" is ignored when "items" is not an array of schemas'
          );
          return;
        }
        e_(e, n);
      },
    };
  function e_(e, t) {
    const { gen: r, schema: n, data: o, keyword: i, it: s } = e;
    s.items = !0;
    const a = r.const("len", (0, Fn._)`${o}.length`);
    if (n === !1)
      e.setParams({ len: t.length }), e.pass((0, Fn._)`${a} <= ${t.length}`);
    else if (typeof n == "object" && !(0, bc.alwaysValidSchema)(s, n)) {
      const c = r.var("valid", (0, Fn._)`${a} <= ${t.length}`);
      r.if((0, Fn.not)(c), () => l(c)), e.ok(c);
    }
    function l(c) {
      r.forRange("i", t.length, a, u => {
        e.subschema({ keyword: i, dataProp: u, dataPropType: bc.Type.Num }, c),
          s.allErrors || r.if((0, Fn.not)(c), () => r.break());
      });
    }
  }
  Uo.validateAdditionalItems = e_;
  Uo.default = KW;
  var hf = {},
    Wo = {};
  Object.defineProperty(Wo, "__esModule", { value: !0 });
  Wo.validateTuple = void 0;
  const jh = De,
    js = Be,
    GW = je,
    qW = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "array", "boolean"],
      before: "uniqueItems",
      code(e) {
        const { schema: t, it: r } = e;
        if (Array.isArray(t)) return t_(e, "additionalItems", t);
        (r.items = !0),
          !(0, js.alwaysValidSchema)(r, t) && e.ok((0, GW.validateArray)(e));
      },
    };
  function t_(e, t, r = e.schema) {
    const { gen: n, parentSchema: o, data: i, keyword: s, it: a } = e;
    u(o),
      a.opts.unevaluated &&
        r.length &&
        a.items !== !0 &&
        (a.items = js.mergeEvaluated.items(n, r.length, a.items));
    const l = n.name("valid"),
      c = n.const("len", (0, jh._)`${i}.length`);
    r.forEach((f, d) => {
      (0, js.alwaysValidSchema)(a, f) ||
        (n.if((0, jh._)`${c} > ${d}`, () =>
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
        const y = `"${s}" is ${h}-tuple, but minItems or maxItems/${t} are not specified or different at path "${p}"`;
        (0, js.checkStrictMode)(a, y, d.strictTuples);
      }
    }
  }
  Wo.validateTuple = t_;
  Wo.default = qW;
  Object.defineProperty(hf, "__esModule", { value: !0 });
  const YW = Wo,
    JW = {
      keyword: "prefixItems",
      type: "array",
      schemaType: ["array"],
      before: "uniqueItems",
      code: e => (0, YW.validateTuple)(e, "items"),
    };
  hf.default = JW;
  var gf = {};
  Object.defineProperty(gf, "__esModule", { value: !0 });
  const Fh = De,
    XW = Be,
    ZW = je,
    QW = Uo,
    e9 = {
      message: ({ params: { len: e } }) =>
        (0, Fh.str)`must NOT have more than ${e} items`,
      params: ({ params: { len: e } }) => (0, Fh._)`{limit: ${e}}`,
    },
    t9 = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      error: e9,
      code(e) {
        const { schema: t, parentSchema: r, it: n } = e,
          { prefixItems: o } = r;
        (n.items = !0),
          !(0, XW.alwaysValidSchema)(n, t) &&
            (o
              ? (0, QW.validateAdditionalItems)(e, o)
              : e.ok((0, ZW.validateArray)(e)));
      },
    };
  gf.default = t9;
  var mf = {};
  Object.defineProperty(mf, "__esModule", { value: !0 });
  const Xt = De,
    ws = Be,
    r9 = {
      message: ({ params: { min: e, max: t } }) =>
        t === void 0
          ? (0, Xt.str)`must contain at least ${e} valid item(s)`
          : (0,
            Xt.str)`must contain at least ${e} and no more than ${t} valid item(s)`,
      params: ({ params: { min: e, max: t } }) =>
        t === void 0
          ? (0, Xt._)`{minContains: ${e}}`
          : (0, Xt._)`{minContains: ${e}, maxContains: ${t}}`,
    },
    n9 = {
      keyword: "contains",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      trackErrors: !0,
      error: r9,
      code(e) {
        const { gen: t, schema: r, parentSchema: n, data: o, it: i } = e;
        let s, a;
        const { minContains: l, maxContains: c } = n;
        i.opts.next ? ((s = l === void 0 ? 1 : l), (a = c)) : (s = 1);
        const u = t.const("len", (0, Xt._)`${o}.length`);
        if ((e.setParams({ min: s, max: a }), a === void 0 && s === 0)) {
          (0, ws.checkStrictMode)(
            i,
            '"minContains" == 0 without "maxContains": "contains" keyword ignored'
          );
          return;
        }
        if (a !== void 0 && s > a) {
          (0, ws.checkStrictMode)(
            i,
            '"minContains" > "maxContains" is always invalid'
          ),
            e.fail();
          return;
        }
        if ((0, ws.alwaysValidSchema)(i, r)) {
          let m = (0, Xt._)`${u} >= ${s}`;
          a !== void 0 && (m = (0, Xt._)`${m} && ${u} <= ${a}`), e.pass(m);
          return;
        }
        i.items = !0;
        const f = t.name("valid");
        a === void 0 && s === 1
          ? p(f, () => t.if(f, () => t.break()))
          : s === 0
            ? (t.let(f, !0),
              a !== void 0 && t.if((0, Xt._)`${o}.length > 0`, d))
            : (t.let(f, !1), d()),
          e.result(f, () => e.reset());
        function d() {
          const m = t.name("_valid"),
            y = t.let("count", 0);
          p(m, () => t.if(m, () => h(y)));
        }
        function p(m, y) {
          t.forRange("i", 0, u, g => {
            e.subschema(
              {
                keyword: "contains",
                dataProp: g,
                dataPropType: ws.Type.Num,
                compositeRule: !0,
              },
              m
            ),
              y();
          });
        }
        function h(m) {
          t.code((0, Xt._)`${m}++`),
            a === void 0
              ? t.if((0, Xt._)`${m} >= ${s}`, () => t.assign(f, !0).break())
              : (t.if((0, Xt._)`${m} > ${a}`, () => t.assign(f, !1).break()),
                s === 1
                  ? t.assign(f, !0)
                  : t.if((0, Xt._)`${m} >= ${s}`, () => t.assign(f, !0)));
        }
      },
    };
  mf.default = n9;
  var r_ = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0);
    const t = De,
      r = Be,
      n = je;
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
        const y = (0, n.propertyInData)(u, f, h, d.opts.ownProperties);
        l.setParams({
          property: h,
          depsCount: m.length,
          deps: m.join(", "),
        }),
          d.allErrors
            ? u.if(y, () => {
                for (const g of m) (0, n.checkReportMissingProp)(l, g);
              })
            : (u.if((0, t._)`${y} && (${(0, n.checkMissingProp)(l, m, p)})`),
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
              const y = l.subschema({ keyword: d, schemaProp: m }, h);
              l.mergeValidEvaluated(y, h);
            },
            () => u.var(h, !0)
            // TODO var
          ),
          l.ok(h));
    }
    (e.validateSchemaDeps = a), (e.default = o);
  })(r_);
  var vf = {};
  Object.defineProperty(vf, "__esModule", { value: !0 });
  const n_ = De,
    o9 = Be,
    i9 = {
      message: "property name must be valid",
      params: ({ params: e }) => (0, n_._)`{propertyName: ${e.propertyName}}`,
    },
    s9 = {
      keyword: "propertyNames",
      type: "object",
      schemaType: ["object", "boolean"],
      error: i9,
      code(e) {
        const { gen: t, schema: r, data: n, it: o } = e;
        if ((0, o9.alwaysValidSchema)(o, r)) return;
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
            t.if((0, n_.not)(i), () => {
              e.error(!0), o.allErrors || t.break();
            });
        }),
          e.ok(i);
      },
    };
  vf.default = s9;
  var el = {};
  Object.defineProperty(el, "__esModule", { value: !0 });
  const Es = je,
    nr = De,
    a9 = dr,
    Os = Be,
    l9 = {
      message: "must NOT have additional properties",
      params: ({ params: e }) =>
        (0, nr._)`{additionalProperty: ${e.additionalProperty}}`,
    },
    c9 = {
      keyword: "additionalProperties",
      type: ["object"],
      schemaType: ["boolean", "object"],
      allowUndefined: !0,
      trackErrors: !0,
      error: l9,
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
          l.removeAdditional !== "all" && (0, Os.alwaysValidSchema)(s, r))
        )
          return;
        const c = (0, Es.allSchemaProperties)(n.properties),
          u = (0, Es.allSchemaProperties)(n.patternProperties);
        f(), e.ok((0, nr._)`${i} === ${a9.default.errors}`);
        function f() {
          t.forIn("key", o, y => {
            !c.length && !u.length ? h(y) : t.if(d(y), () => h(y));
          });
        }
        function d(y) {
          let g;
          if (c.length > 8) {
            const _ = (0, Os.schemaRefOrVal)(s, n.properties, "properties");
            g = (0, Es.isOwnProperty)(t, _, y);
          } else
            c.length
              ? (g = (0, nr.or)(...c.map(_ => (0, nr._)`${y} === ${_}`)))
              : (g = nr.nil);
          return (
            u.length &&
              (g = (0, nr.or)(
                g,
                ...u.map(_ => (0, nr._)`${(0, Es.usePattern)(e, _)}.test(${y})`)
              )),
            (0, nr.not)(g)
          );
        }
        function p(y) {
          t.code((0, nr._)`delete ${o}[${y}]`);
        }
        function h(y) {
          if (
            l.removeAdditional === "all" ||
            (l.removeAdditional && r === !1)
          ) {
            p(y);
            return;
          }
          if (r === !1) {
            e.setParams({ additionalProperty: y }), e.error(), a || t.break();
            return;
          }
          if (typeof r == "object" && !(0, Os.alwaysValidSchema)(s, r)) {
            const g = t.name("valid");
            l.removeAdditional === "failing"
              ? (m(y, g, !1),
                t.if((0, nr.not)(g), () => {
                  e.reset(), p(y);
                }))
              : (m(y, g), a || t.if((0, nr.not)(g), () => t.break()));
          }
        }
        function m(y, g, _) {
          const E = {
            keyword: "additionalProperties",
            dataProp: y,
            dataPropType: Os.Type.Str,
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
  el.default = c9;
  var yf = {};
  Object.defineProperty(yf, "__esModule", { value: !0 });
  const u9 = Zt,
    Lh = je,
    jl = Be,
    Vh = el,
    f9 = {
      keyword: "properties",
      type: "object",
      schemaType: "object",
      code(e) {
        const { gen: t, schema: r, parentSchema: n, data: o, it: i } = e;
        i.opts.removeAdditional === "all" &&
          n.additionalProperties === void 0 &&
          Vh.default.code(
            new u9.KeywordCxt(i, Vh.default, "additionalProperties")
          );
        const s = (0, Lh.allSchemaProperties)(r);
        for (const f of s) i.definedProperties.add(f);
        i.opts.unevaluated &&
          s.length &&
          i.props !== !0 &&
          (i.props = jl.mergeEvaluated.props(t, (0, jl.toHash)(s), i.props));
        const a = s.filter(f => !(0, jl.alwaysValidSchema)(i, r[f]));
        if (a.length === 0) return;
        const l = t.name("valid");
        for (const f of a)
          c(f)
            ? u(f)
            : (t.if((0, Lh.propertyInData)(t, o, f, i.opts.ownProperties)),
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
  yf.default = f9;
  var _f = {};
  Object.defineProperty(_f, "__esModule", { value: !0 });
  const kh = je,
    Ss = De,
    Bh = Be,
    zh = Be,
    d9 = {
      keyword: "patternProperties",
      type: "object",
      schemaType: "object",
      code(e) {
        const { gen: t, schema: r, data: n, parentSchema: o, it: i } = e,
          { opts: s } = i,
          a = (0, kh.allSchemaProperties)(r),
          l = a.filter(m => (0, Bh.alwaysValidSchema)(i, r[m]));
        if (
          a.length === 0 ||
          (l.length === a.length && (!i.opts.unevaluated || i.props === !0))
        )
          return;
        const c = s.strictSchema && !s.allowMatchingProperties && o.properties,
          u = t.name("valid");
        i.props !== !0 &&
          !(i.props instanceof Ss.Name) &&
          (i.props = (0, zh.evaluatedPropsToName)(t, i.props));
        const { props: f } = i;
        d();
        function d() {
          for (const m of a)
            c && p(m), i.allErrors ? h(m) : (t.var(u, !0), h(m), t.if(u));
        }
        function p(m) {
          for (const y in c)
            new RegExp(m).test(y) &&
              (0, Bh.checkStrictMode)(
                i,
                `property ${y} matches pattern ${m} (use allowMatchingProperties)`
              );
        }
        function h(m) {
          t.forIn("key", n, y => {
            t.if((0, Ss._)`${(0, kh.usePattern)(e, m)}.test(${y})`, () => {
              const g = l.includes(m);
              g ||
                e.subschema(
                  {
                    keyword: "patternProperties",
                    schemaProp: m,
                    dataProp: y,
                    dataPropType: zh.Type.Str,
                  },
                  u
                ),
                i.opts.unevaluated && f !== !0
                  ? t.assign((0, Ss._)`${f}[${y}]`, !0)
                  : !g && !i.allErrors && t.if((0, Ss.not)(u), () => t.break());
            });
          });
        }
      },
    };
  _f.default = d9;
  var $f = {};
  Object.defineProperty($f, "__esModule", { value: !0 });
  const p9 = Be,
    h9 = {
      keyword: "not",
      schemaType: ["object", "boolean"],
      trackErrors: !0,
      code(e) {
        const { gen: t, schema: r, it: n } = e;
        if ((0, p9.alwaysValidSchema)(n, r)) {
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
  $f.default = h9;
  var bf = {};
  Object.defineProperty(bf, "__esModule", { value: !0 });
  const g9 = je,
    m9 = {
      keyword: "anyOf",
      schemaType: "array",
      trackErrors: !0,
      code: g9.validateUnion,
      error: { message: "must match a schema in anyOf" },
    };
  bf.default = m9;
  var wf = {};
  Object.defineProperty(wf, "__esModule", { value: !0 });
  const Fs = De,
    v9 = Be,
    y9 = {
      message: "must match exactly one schema in oneOf",
      params: ({ params: e }) => (0, Fs._)`{passingSchemas: ${e.passing}}`,
    },
    _9 = {
      keyword: "oneOf",
      schemaType: "array",
      trackErrors: !0,
      error: y9,
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
            (0, v9.alwaysValidSchema)(o, u)
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
                  .if((0, Fs._)`${l} && ${s}`)
                  .assign(s, !1)
                  .assign(a, (0, Fs._)`[${a}, ${f}]`)
                  .else(),
              t.if(l, () => {
                t.assign(s, !0),
                  t.assign(a, f),
                  d && e.mergeEvaluated(d, Fs.Name);
              });
          });
        }
      },
    };
  wf.default = _9;
  var Ef = {};
  Object.defineProperty(Ef, "__esModule", { value: !0 });
  const $9 = Be,
    b9 = {
      keyword: "allOf",
      schemaType: "array",
      code(e) {
        const { gen: t, schema: r, it: n } = e;
        if (!Array.isArray(r)) throw new Error("ajv implementation error");
        const o = t.name("valid");
        r.forEach((i, s) => {
          if ((0, $9.alwaysValidSchema)(n, i)) return;
          const a = e.subschema({ keyword: "allOf", schemaProp: s }, o);
          e.ok(o), e.mergeEvaluated(a);
        });
      },
    };
  Ef.default = b9;
  var Of = {};
  Object.defineProperty(Of, "__esModule", { value: !0 });
  const pa = De,
    o_ = Be,
    w9 = {
      message: ({ params: e }) =>
        (0, pa.str)`must match "${e.ifClause}" schema`,
      params: ({ params: e }) => (0, pa._)`{failingKeyword: ${e.ifClause}}`,
    },
    E9 = {
      keyword: "if",
      schemaType: ["object", "boolean"],
      trackErrors: !0,
      error: w9,
      code(e) {
        const { gen: t, parentSchema: r, it: n } = e;
        r.then === void 0 &&
          r.else === void 0 &&
          (0, o_.checkStrictMode)(
            n,
            '"if" without "then" and "else" is ignored'
          );
        const o = Uh(n, "then"),
          i = Uh(n, "else");
        if (!o && !i) return;
        const s = t.let("valid", !0),
          a = t.name("_valid");
        if ((l(), e.reset(), o && i)) {
          const u = t.let("ifClause");
          e.setParams({ ifClause: u }), t.if(a, c("then", u), c("else", u));
        } else o ? t.if(a, c("then")) : t.if((0, pa.not)(a), c("else"));
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
              f ? t.assign(f, (0, pa._)`${u}`) : e.setParams({ ifClause: u });
          };
        }
      },
    };
  function Uh(e, t) {
    const r = e.schema[t];
    return r !== void 0 && !(0, o_.alwaysValidSchema)(e, r);
  }
  Of.default = E9;
  var Sf = {};
  Object.defineProperty(Sf, "__esModule", { value: !0 });
  const O9 = Be,
    S9 = {
      keyword: ["then", "else"],
      schemaType: ["object", "boolean"],
      code({ keyword: e, parentSchema: t, it: r }) {
        t.if === void 0 &&
          (0, O9.checkStrictMode)(r, `"${e}" without "if" is ignored`);
      },
    };
  Sf.default = S9;
  Object.defineProperty(pf, "__esModule", { value: !0 });
  const A9 = Uo,
    N9 = hf,
    P9 = Wo,
    C9 = gf,
    T9 = mf,
    x9 = r_,
    D9 = vf,
    I9 = el,
    R9 = yf,
    M9 = _f,
    j9 = $f,
    F9 = bf,
    L9 = wf,
    V9 = Ef,
    k9 = Of,
    B9 = Sf;
  function z9(e = !1) {
    const t = [
      // any
      j9.default,
      F9.default,
      L9.default,
      V9.default,
      k9.default,
      B9.default,
      // object
      D9.default,
      I9.default,
      x9.default,
      R9.default,
      M9.default,
    ];
    return (
      e ? t.push(N9.default, C9.default) : t.push(A9.default, P9.default),
      t.push(T9.default),
      t
    );
  }
  pf.default = z9;
  var Af = {},
    Nf = {};
  Object.defineProperty(Nf, "__esModule", { value: !0 });
  const ct = De,
    U9 = {
      message: ({ schemaCode: e }) => (0, ct.str)`must match format "${e}"`,
      params: ({ schemaCode: e }) => (0, ct._)`{format: ${e}}`,
    },
    W9 = {
      keyword: "format",
      type: ["number", "string"],
      schemaType: "string",
      $data: !0,
      error: U9,
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
            y = r.let("fType"),
            g = r.let("format");
          r.if(
            (0, ct._)`typeof ${m} == "object" && !(${m} instanceof RegExp)`,
            () =>
              r
                .assign(y, (0, ct._)`${m}.type || "string"`)
                .assign(g, (0, ct._)`${m}.validate`),
            () => r.assign(y, (0, ct._)`"string"`).assign(g, m)
          ),
            e.fail$data((0, ct.or)(_(), E()));
          function _() {
            return l.strictSchema === !1 ? ct.nil : (0, ct._)`${s} && !${g}`;
          }
          function E() {
            const S = u.$async
                ? (0, ct._)`(${m}.async ? await ${g}(${n}) : ${g}(${n}))`
                : (0, ct._)`${g}(${n})`,
              I = (0,
              ct._)`(typeof ${g} == "function" ? ${S} : ${g}.test(${n}))`;
            return (0, ct._)`${g} && ${g} !== true && ${y} === ${t} && !${I}`;
          }
        }
        function p() {
          const h = f.formats[i];
          if (!h) {
            _();
            return;
          }
          if (h === !0) return;
          const [m, y, g] = E(h);
          m === t && e.pass(S());
          function _() {
            if (l.strictSchema === !1) {
              f.logger.warn(I());
              return;
            }
            throw new Error(I());
            function I() {
              return `unknown format "${i}" ignored in schema at path "${c}"`;
            }
          }
          function E(I) {
            const A =
                I instanceof RegExp
                  ? (0, ct.regexpCode)(I)
                  : l.code.formats
                    ? (0, ct._)`${l.code.formats}${(0, ct.getProperty)(i)}`
                    : void 0,
              O = r.scopeValue("formats", { key: i, ref: I, code: A });
            return typeof I == "object" && !(I instanceof RegExp)
              ? [I.type || "string", I.validate, (0, ct._)`${O}.validate`]
              : ["string", I, O];
          }
          function S() {
            if (typeof h == "object" && !(h instanceof RegExp) && h.async) {
              if (!u.$async) throw new Error("async format in sync schema");
              return (0, ct._)`await ${g}(${n})`;
            }
            return typeof y == "function"
              ? (0, ct._)`${g}(${n})`
              : (0, ct._)`${g}.test(${n})`;
          }
        }
      },
    };
  Nf.default = W9;
  Object.defineProperty(Af, "__esModule", { value: !0 });
  const H9 = Nf,
    K9 = [H9.default];
  Af.default = K9;
  var To = {};
  Object.defineProperty(To, "__esModule", { value: !0 });
  To.contentVocabulary = To.metadataVocabulary = void 0;
  To.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples",
  ];
  To.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema",
  ];
  Object.defineProperty(Xu, "__esModule", { value: !0 });
  const G9 = Zu,
    q9 = ef,
    Y9 = pf,
    J9 = Af,
    Wh = To,
    X9 = [
      G9.default,
      q9.default,
      (0, Y9.default)(),
      J9.default,
      Wh.metadataVocabulary,
      Wh.contentVocabulary,
    ];
  Xu.default = X9;
  var Pf = {},
    i_ = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.DiscrError = void 0),
      (function (t) {
        (t.Tag = "tag"), (t.Mapping = "mapping");
      })(e.DiscrError || (e.DiscrError = {}));
  })(i_);
  Object.defineProperty(Pf, "__esModule", { value: !0 });
  const yo = De,
    wc = i_,
    Hh = kt,
    Z9 = Be,
    Q9 = {
      message: ({ params: { discrError: e, tagName: t } }) =>
        e === wc.DiscrError.Tag
          ? `tag "${t}" must be string`
          : `value of tag "${t}" must be in oneOf`,
      params: ({ params: { discrError: e, tag: t, tagName: r } }) =>
        (0, yo._)`{error: ${e}, tag: ${r}, tagValue: ${t}}`,
    },
    eH = {
      keyword: "discriminator",
      type: "object",
      schemaType: "object",
      error: Q9,
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
          c = t.const("tag", (0, yo._)`${r}${(0, yo.getProperty)(a)}`);
        t.if(
          (0, yo._)`typeof ${c} == "string"`,
          () => u(),
          () =>
            e.error(!1, { discrError: wc.DiscrError.Tag, tag: c, tagName: a })
        ),
          e.ok(l);
        function u() {
          const p = d();
          t.if(!1);
          for (const h in p)
            t.elseIf((0, yo._)`${c} === ${h}`), t.assign(l, f(p[h]));
          t.else(),
            e.error(!1, {
              discrError: wc.DiscrError.Mapping,
              tag: c,
              tagName: a,
            }),
            t.endIf();
        }
        function f(p) {
          const h = t.name("valid"),
            m = e.subschema({ keyword: "oneOf", schemaProp: p }, h);
          return e.mergeEvaluated(m, yo.Name), h;
        }
        function d() {
          var p;
          const h = {},
            m = g(o);
          let y = !0;
          for (let S = 0; S < s.length; S++) {
            let I = s[S];
            I != null &&
              I.$ref &&
              !(0, Z9.schemaHasRulesButRef)(I, i.self.RULES) &&
              ((I = Hh.resolveRef.call(
                i.self,
                i.schemaEnv.root,
                i.baseId,
                I == null ? void 0 : I.$ref
              )),
              I instanceof Hh.SchemaEnv && (I = I.schema));
            const A =
              (p = I == null ? void 0 : I.properties) === null || p === void 0
                ? void 0
                : p[a];
            if (typeof A != "object")
              throw new Error(
                `discriminator: oneOf subschemas (or referenced schemas) must have "properties/${a}"`
              );
            (y = y && (m || g(I))), _(A, S);
          }
          if (!y) throw new Error(`discriminator: "${a}" must be required`);
          return h;
          function g({ required: S }) {
            return Array.isArray(S) && S.includes(a);
          }
          function _(S, I) {
            if (S.const) E(S.const, I);
            else if (S.enum) for (const A of S.enum) E(A, I);
            else
              throw new Error(
                `discriminator: "properties/${a}" must have "const" or "enum"`
              );
          }
          function E(S, I) {
            if (typeof S != "string" || S in h)
              throw new Error(
                `discriminator: "${a}" values must be unique strings`
              );
            h[S] = I;
          }
        }
      },
    };
  Pf.default = eH;
  const tH = "http://json-schema.org/draft-07/schema#",
    rH = "http://json-schema.org/draft-07/schema#",
    nH = "Core schema meta-schema",
    oH = {
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
    iH = ["object", "boolean"],
    sH = {
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
    aH = {
      $schema: tH,
      $id: rH,
      title: nH,
      definitions: oH,
      type: iH,
      properties: sH,
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
    const r = Sy,
      n = Xu,
      o = Pf,
      i = aH,
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
    var c = Zt;
    Object.defineProperty(t, "KeywordCxt", {
      enumerable: !0,
      get: function () {
        return c.KeywordCxt;
      },
    });
    var u = De;
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
    var f = es;
    Object.defineProperty(t, "ValidationError", {
      enumerable: !0,
      get: function () {
        return f.default;
      },
    });
    var d = ts;
    Object.defineProperty(t, "MissingRefError", {
      enumerable: !0,
      get: function () {
        return d.default;
      },
    });
  })(mc, mc.exports);
  var s_ = mc.exports,
    Kh = { exports: {} },
    a_ = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.formatNames = e.fastFormats = e.fullFormats = void 0);
    function t(z, H) {
      return { validate: z, compare: H };
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
      regex: L,
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
      int32: { type: "number", validate: S },
      // signed 64 bit integer
      int64: { type: "number", validate: I },
      // C-type float
      float: { type: "number", validate: A },
      // C-type double
      double: { type: "number", validate: A },
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
    function r(z) {
      return z % 4 === 0 && (z % 100 !== 0 || z % 400 === 0);
    }
    const n = /^(\d\d\d\d)-(\d\d)-(\d\d)$/,
      o = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function i(z) {
      const H = n.exec(z);
      if (!H) return !1;
      const ne = +H[1],
        G = +H[2],
        Ne = +H[3];
      return (
        G >= 1 && G <= 12 && Ne >= 1 && Ne <= (G === 2 && r(ne) ? 29 : o[G])
      );
    }
    function s(z, H) {
      if (z && H) return z > H ? 1 : z < H ? -1 : 0;
    }
    const a = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
    function l(z, H) {
      const ne = a.exec(z);
      if (!ne) return !1;
      const G = +ne[1],
        Ne = +ne[2],
        ue = +ne[3],
        Pe = ne[5];
      return (
        ((G <= 23 && Ne <= 59 && ue <= 59) ||
          (G === 23 && Ne === 59 && ue === 60)) &&
        (!H || Pe !== "")
      );
    }
    function c(z, H) {
      if (!(z && H)) return;
      const ne = a.exec(z),
        G = a.exec(H);
      if (ne && G)
        return (
          (z = ne[1] + ne[2] + ne[3] + (ne[4] || "")),
          (H = G[1] + G[2] + G[3] + (G[4] || "")),
          z > H ? 1 : z < H ? -1 : 0
        );
    }
    const u = /t|\s/i;
    function f(z) {
      const H = z.split(u);
      return H.length === 2 && i(H[0]) && l(H[1], !0);
    }
    function d(z, H) {
      if (!(z && H)) return;
      const [ne, G] = z.split(u),
        [Ne, ue] = H.split(u),
        Pe = s(ne, Ne);
      if (Pe !== void 0) return Pe || c(G, ue);
    }
    const p = /\/|:/,
      h =
        /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function m(z) {
      return p.test(z) && h.test(z);
    }
    const y =
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function g(z) {
      return (y.lastIndex = 0), y.test(z);
    }
    const _ = -(2 ** 31),
      E = 2 ** 31 - 1;
    function S(z) {
      return Number.isInteger(z) && z <= E && z >= _;
    }
    function I(z) {
      return Number.isInteger(z);
    }
    function A() {
      return !0;
    }
    const O = /[^\\]\\Z/;
    function L(z) {
      if (O.test(z)) return !1;
      try {
        return new RegExp(z), !0;
      } catch {
        return !1;
      }
    }
  })(a_);
  var l_ = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.formatLimitDefinition = void 0);
    const t = s_,
      r = De,
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
        m.$data ? y() : g();
        function y() {
          const E = l.scopeValue("formats", {
              ref: h.formats,
              code: p.code.formats,
            }),
            S = l.const("fmt", r._`${E}[${m.schemaCode}]`);
          a.fail$data(
            r.or(
              r._`typeof ${S} != "object"`,
              r._`${S} instanceof RegExp`,
              r._`typeof ${S}.compare != "function"`,
              _(S)
            )
          );
        }
        function g() {
          const E = m.schema,
            S = h.formats[E];
          if (!S || S === !0) return;
          if (
            typeof S != "object" ||
            S instanceof RegExp ||
            typeof S.compare != "function"
          )
            throw new Error(
              `"${f}": format "${E}" does not define "compare" function`
            );
          const I = l.scopeValue("formats", {
            key: E,
            ref: S,
            code: p.code.formats
              ? r._`${p.code.formats}${r.getProperty(E)}`
              : void 0,
          });
          a.fail$data(_(I));
        }
        function _(E) {
          return r._`${E}.compare(${c}, ${u}) ${o[f].fail} 0`;
        }
      },
      dependencies: ["format"],
    };
    const s = a => (a.addKeyword(e.formatLimitDefinition), a);
    e.default = s;
  })(l_);
  (function (e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 });
    const r = a_,
      n = l_,
      o = De,
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
  })(Kh, Kh.exports);
  var Gh;
  (function (e) {
    (e.HIDE = "HIDE"),
      (e.SHOW = "SHOW"),
      (e.ENABLE = "ENABLE"),
      (e.DISABLE = "DISABLE");
  })(Gh || (Gh = {}));
  var St;
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
  })(St || (St = {}));
  St.addTooltip,
    St.addAriaLabel,
    St.removeTooltip,
    St.removeAriaLabel,
    St.upAriaLabel,
    St.up,
    St.down,
    St.downAriaLabel,
    St.noDataMessage,
    St.noSelection,
    St.deleteDialogTitle,
    St.deleteDialogMessage,
    St.deleteDialogAccept,
    St.deleteDialogDecline;
  var _o;
  (function (e) {
    (e.clearDialogTitle = "clearDialogTitle"),
      (e.clearDialogMessage = "clearDialogMessage"),
      (e.clearDialogAccept = "clearDialogAccept"),
      (e.clearDialogDecline = "clearDialogDecline");
  })(_o || (_o = {}));
  _o.clearDialogTitle,
    _o.clearDialogMessage,
    _o.clearDialogAccept,
    _o.clearDialogDecline;
  var qh = { exports: {} };
  (function (e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 });
    const r = s_,
      n = De,
      o = Co,
      i = Zt,
      s = zo,
      a = dr,
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
    function h(y) {
      return {
        keyword: l,
        schemaType: ["string", "object"],
        post: !0,
        code(g) {
          const { gen: _, data: E, schema: S, schemaValue: I, it: A } = g;
          if (A.createErrors === !1) return;
          const O = S,
            L = n.strConcat(a.default.instancePath, A.errorPath);
          _.if(r._`${a.default.errors} > 0`, () => {
            if (typeof O == "object") {
              const [P, v] = H(O);
              v && ne(v), P && G(P), Ne(z(O));
            }
            const M = typeof O == "string" ? O : O._;
            M && ue(M), y.keepErrors || Pe();
          });
          function z({ properties: M, items: P }) {
            const v = {};
            if (M) {
              v.props = {};
              for (const $ in M) v.props[$] = [];
            }
            if (P) {
              v.items = {};
              for (let $ = 0; $ < P.length; $++) v.items[$] = [];
            }
            return v;
          }
          function H(M) {
            let P, v;
            for (const $ in M) {
              if ($ === "properties" || $ === "items") continue;
              const N = M[$];
              if (typeof N == "object") {
                P || (P = {});
                const j = (P[$] = {});
                for (const F in N) j[F] = [];
              } else v || (v = {}), (v[$] = []);
            }
            return [P, v];
          }
          function ne(M) {
            const P = _.const("emErrors", r.stringify(M)),
              v = _.const("templates", Ue(M, S));
            _.forOf("err", a.default.vErrors, F =>
              _.if(be(F, P), () =>
                _.code(r._`${P}[${F}.keyword].push(${F})`).assign(
                  r._`${F}.${c}`,
                  !0
                )
              )
            );
            const { singleError: $ } = y;
            if ($) {
              const F = _.let("message", r._`""`),
                q = _.let("paramsErrors", r._`[]`);
              N(oe => {
                _.if(F, () =>
                  _.code(r._`${F} += ${typeof $ == "string" ? $ : ";"}`)
                ),
                  _.code(r._`${F} += ${j(oe)}`),
                  _.assign(q, r._`${q}.concat(${P}[${oe}])`);
              }),
                s.reportError(g, { message: F, params: r._`{errors: ${q}}` });
            } else
              N(F =>
                s.reportError(g, {
                  message: j(F),
                  params: r._`{errors: ${P}[${F}]}`,
                })
              );
            function N(F) {
              _.forIn("key", P, q => _.if(r._`${P}[${q}].length`, () => F(q)));
            }
            function j(F) {
              return r._`${F} in ${v} ? ${v}[${F}]() : ${I}[${F}]`;
            }
          }
          function G(M) {
            const P = _.const("emErrors", r.stringify(M)),
              v = [];
            for (const q in M) v.push([q, Ue(M[q], S[q])]);
            const $ = _.const("templates", _.object(...v)),
              N = _.scopeValue("obj", {
                ref: u,
                code: r.stringify(u),
              }),
              j = _.let("emPropParams"),
              F = _.let("emParamsErrors");
            _.forOf("err", a.default.vErrors, q =>
              _.if(be(q, P), () => {
                _.assign(j, r._`${N}[${q}.keyword]`),
                  _.assign(F, r._`${P}[${q}.keyword][${q}.params[${j}]]`),
                  _.if(F, () =>
                    _.code(r._`${F}.push(${q})`).assign(r._`${q}.${c}`, !0)
                  );
              })
            ),
              _.forIn("key", P, q =>
                _.forIn("keyProp", r._`${P}[${q}]`, oe => {
                  _.assign(F, r._`${P}[${q}][${oe}]`),
                    _.if(r._`${F}.length`, () => {
                      const we = _.const(
                        "tmpl",
                        r._`${$}[${q}] && ${$}[${q}][${oe}]`
                      );
                      s.reportError(g, {
                        message: r._`${we} ? ${we}() : ${I}[${q}][${oe}]`,
                        params: r._`{errors: ${F}}`,
                      });
                    });
                })
              );
          }
          function Ne(M) {
            const { props: P, items: v } = M;
            if (!P && !v) return;
            const $ = r._`typeof ${E} == "object"`,
              N = r._`Array.isArray(${E})`,
              j = _.let("emErrors");
            let F, q;
            const oe = _.let("templates");
            P && v
              ? ((F = _.let("emChildKwd")),
                _.if($),
                _.if(
                  N,
                  () => {
                    we(v, S.items), _.assign(F, r.str`items`);
                  },
                  () => {
                    we(P, S.properties), _.assign(F, r.str`properties`);
                  }
                ),
                (q = r._`[${F}]`))
              : v
                ? (_.if(N), we(v, S.items), (q = r._`.items`))
                : P &&
                  (_.if(n.and($, n.not(N))),
                  we(P, S.properties),
                  (q = r._`.properties`)),
              _.forOf("err", a.default.vErrors, Ie =>
                le(Ie, j, tt =>
                  _.code(r._`${j}[${tt}].push(${Ie})`).assign(
                    r._`${Ie}.${c}`,
                    !0
                  )
                )
              ),
              _.forIn("key", j, Ie =>
                _.if(r._`${j}[${Ie}].length`, () => {
                  s.reportError(g, {
                    message: r._`${Ie} in ${oe} ? ${oe}[${Ie}]() : ${I}${q}[${Ie}]`,
                    params: r._`{errors: ${j}[${Ie}]}`,
                  }),
                    _.assign(
                      r._`${a.default.vErrors}[${a.default.errors}-1].instancePath`,
                      r._`${L} + "/" + ${Ie}.replace(/~/g, "~0").replace(/\\//g, "~1")`
                    );
                })
              ),
              _.endIf();
            function we(Ie, tt) {
              _.assign(j, r.stringify(Ie)), _.assign(oe, Ue(Ie, tt));
            }
          }
          function ue(M) {
            const P = _.const("emErrs", r._`[]`);
            _.forOf("err", a.default.vErrors, v =>
              _.if(ve(v), () =>
                _.code(r._`${P}.push(${v})`).assign(r._`${v}.${c}`, !0)
              )
            ),
              _.if(r._`${P}.length`, () =>
                s.reportError(g, {
                  message: ee(M),
                  params: r._`{errors: ${P}}`,
                })
              );
          }
          function Pe() {
            const M = _.const("emErrs", r._`[]`);
            _.forOf("err", a.default.vErrors, P =>
              _.if(r._`!${P}.${c}`, () => _.code(r._`${M}.push(${P})`))
            ),
              _.assign(a.default.vErrors, M).assign(
                a.default.errors,
                r._`${M}.length`
              );
          }
          function be(M, P) {
            return n.and(
              r._`${M}.keyword !== ${l}`,
              r._`!${M}.${c}`,
              r._`${M}.instancePath === ${L}`,
              r._`${M}.keyword in ${P}`,
              // TODO match the end of the string?
              r._`${M}.schemaPath.indexOf(${A.errSchemaPath}) === 0`,
              r._`/^\\/[^\\/]*$/.test(${M}.schemaPath.slice(${A.errSchemaPath.length}))`
            );
          }
          function le(M, P, v) {
            _.if(
              n.and(
                r._`${M}.keyword !== ${l}`,
                r._`!${M}.${c}`,
                r._`${M}.instancePath.indexOf(${L}) === 0`
              ),
              () => {
                const $ = _.scopeValue("pattern", {
                    ref: /^\/([^/]*)(?:\/|$)/,
                    code: r._`new RegExp("^\\\/([^/]*)(?:\\\/|$)")`,
                  }),
                  N = _.const(
                    "emMatches",
                    r._`${$}.exec(${M}.instancePath.slice(${L}.length))`
                  ),
                  j = _.const(
                    "emChild",
                    r._`${N} && ${N}[1].replace(/~1/g, "/").replace(/~0/g, "~")`
                  );
                _.if(r._`${j} !== undefined && ${j} in ${P}`, () => v(j));
              }
            );
          }
          function ve(M) {
            return n.and(
              r._`${M}.keyword !== ${l}`,
              r._`!${M}.${c}`,
              n.or(
                r._`${M}.instancePath === ${L}`,
                n.and(
                  r._`${M}.instancePath.indexOf(${L}) === 0`,
                  r._`${M}.instancePath[${L}.length] === "/"`
                )
              ),
              r._`${M}.schemaPath.indexOf(${A.errSchemaPath}) === 0`,
              r._`${M}.schemaPath[${A.errSchemaPath}.length] === "/"`
            );
          }
          function Ue(M, P) {
            const v = [];
            for (const $ in M) {
              const N = P[$];
              f.test(N) && v.push([$, R(N)]);
            }
            return _.object(...v);
          }
          function ee(M) {
            return f.test(M)
              ? new o._Code(
                  o
                    .safeStringify(M)
                    .replace(
                      d,
                      (P, v) => `" + JSON.stringify(${i.getData(v, A)}) + "`
                    )
                    .replace(p, "")
                )
              : r.stringify(M);
          }
          function R(M) {
            return r._`function(){return ${ee(M)}}`;
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
    const m = (y, g = {}) => {
      if (!y.opts.allErrors)
        throw new Error("ajv-errors: Ajv option allErrors must be true");
      if (y.opts.jsPropertySyntax)
        throw new Error(
          "ajv-errors: ajv option jsPropertySyntax is not supported"
        );
      return y.addKeyword(h(g));
    };
    (t.default = m), (e.exports = m), (e.exports.default = m);
  })(qh, qh.exports);
  function c_(e) {
    var t,
      r,
      n = "";
    if (typeof e == "string" || typeof e == "number") n += e;
    else if (typeof e == "object")
      if (Array.isArray(e))
        for (t = 0; t < e.length; t++)
          e[t] && (r = c_(e[t])) && (n && (n += " "), (n += r));
      else for (t in e) e[t] && (n && (n += " "), (n += t));
    return n;
  }
  function lH() {
    for (var e, t, r = 0, n = ""; r < arguments.length; )
      (e = arguments[r++]) && (t = c_(e)) && (n && (n += " "), (n += t));
    return n;
  }
  const Yh = e => (typeof e == "boolean" ? "".concat(e) : e === 0 ? "0" : e),
    Jh = lH,
    vt = (e, t) => r => {
      var n;
      if ((t == null ? void 0 : t.variants) == null)
        return Jh(
          e,
          r == null ? void 0 : r.class,
          r == null ? void 0 : r.className
        );
      const { variants: o, defaultVariants: i } = t,
        s = Object.keys(o).map(c => {
          const u = r == null ? void 0 : r[c],
            f = i == null ? void 0 : i[c];
          if (u === null) return null;
          const d = Yh(u) || Yh(f);
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
                  let [m, y] = h;
                  return Array.isArray(y)
                    ? y.includes(
                        {
                          ...i,
                          ...a,
                        }[m]
                      )
                    : {
                        ...i,
                        ...a,
                      }[m] === y;
                })
                  ? [...c, f, d]
                  : c;
              }, []);
      return Jh(
        e,
        s,
        l,
        r == null ? void 0 : r.class,
        r == null ? void 0 : r.className
      );
    },
    cH = vt(
      "focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-md border text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:!opacity-50",
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
            base: "bg-base-foreground text-base-background",
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
            class: "bg-transparent text-base-foreground",
          },
          {
            color: "primary",
            variant: "link",
            class: "bg-transparent text-primary",
          },
          {
            color: "secondary",
            variant: "link",
            class: "bg-transparent text-secondary",
          },
          {
            color: "accent",
            variant: "link",
            class: "bg-transparent text-accent",
          },
          {
            color: "promotion",
            variant: "link",
            class: "bg-transparent text-promotion",
          },
          {
            color: "destructive",
            variant: "link",
            class: "bg-transparent text-error",
          },
          {
            color: "success",
            variant: "link",
            class: "bg-transparent text-success",
          },
          { color: "info", variant: "link", class: "bg-transparent text-info" },
          {
            color: "error",
            variant: "link",
            class: "bg-transparent text-error",
          },
          {
            color: "warning",
            variant: "link",
            class: "bg-transparent text-warning",
          },
        ],
        defaultVariants: {
          variant: "flat",
          color: "base",
          size: "md",
        },
      }
    ),
    uH = {
      button: {
        root: cH,
        label: vt(
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
    fH = /* @__PURE__ */ me({
      name: "UwButton",
      components: {
        Primitive: xt,
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
        return {
          styles: fr("button", Mt(e), uH, e.upwindConfig),
          globalStyles: iu,
        };
      },
    }),
    Gt = (e, t) => {
      const r = e.__vccOpts || e;
      for (const [n, o] of t) r[n] = o;
      return r;
    },
    dH = ["href"];
  function pH(e, t, r, n, o, i) {
    const s = Qe("primitive");
    return (
      fe(),
      Sn(
        Nt,
        null,
        [
          ar(
            "link",
            {
              rel: "stylesheet",
              href: e.globalStyles,
            },
            null,
            8,
            dH
          ),
          Ve(
            s,
            {
              as: e.as,
              "as-child": e.asChild,
              class: it(e.styles.button.root),
              disabled: e.disabled,
            },
            {
              default: se(() => [
                de(e.$slots, "prepend"),
                de(e.$slots, "default", {}, () => [
                  ar(
                    "span",
                    {
                      class: it(e.styles.button.label),
                    },
                    _n(e.label),
                    3
                  ),
                ]),
                de(e.$slots, "append"),
              ]),
              _: 3,
            },
            8,
            ["as", "as-child", "class", "disabled"]
          ),
        ],
        64
      )
    );
  }
  const hH = /* @__PURE__ */ Gt(fH, [["render", pH]]),
    gH = /* @__PURE__ */ ki(hH),
    mH = vt(
      "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden bg-base-200 font-normal text-base-foreground",
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
    vH = {
      avatar: {
        root: mH,
        icon: vt("m-1 h-full w-full object-cover"),
        caption: vt(
          "absolute bottom-0 left-0 right-0 top-0 z-0 inline-flex items-center justify-center text-center"
        ),
        image: vt("relative z-10 h-full w-full object-cover"),
      },
    },
    yH = /* @__PURE__ */ me({
      name: "UwAvatar",
      components: {
        AvatarFallback: IE,
        AvatarImage: DE,
        AvatarRoot: TE,
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
          styles: fr("avatar", Mt(e), vH, e.upwindConfig),
          globalStyles: iu,
        };
      },
      computed: {
        meta() {
          var e, t, r, n;
          return {
            isLoading: this.loading,
            hasIcon:
              _v(this.avatar) ||
              !_i((e = this.avatar) == null ? void 0 : e.name),
            hasImage: !_i((t = this.avatar) == null ? void 0 : t.src),
            hasCaption:
              ((r = this.avatar) == null ? void 0 : r.forceCaption) ||
              !_i((n = this.avatar) == null ? void 0 : n.caption),
          };
        },
      },
    }),
    _H = ["href"];
  function $H(e, t, r, n, o, i) {
    const s = Qe("avatar-image"),
      a = Qe("avatar-fallback"),
      l = Qe("avatar-root");
    return (
      fe(),
      Sn(
        Nt,
        null,
        [
          ar(
            "link",
            {
              rel: "stylesheet",
              href: e.globalStyles,
            },
            null,
            8,
            _H
          ),
          Ve(
            l,
            {
              class: it(e.styles.avatar.root),
            },
            {
              default: se(() => [
                de(e.$slots, "default", {}, () => [
                  e.meta.hasImage
                    ? (fe(),
                      $e(
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
                    : $r("", !0),
                  e.meta.hasCaption
                    ? (fe(),
                      $e(
                        a,
                        {
                          key: 1,
                          class: it(e.styles.avatar.caption),
                        },
                        {
                          default: se(() => [Ao(_n(e.avatar.caption), 1)]),
                          _: 1,
                        },
                        8,
                        ["class"]
                      ))
                    : $r("", !0),
                ]),
              ]),
              _: 3,
            },
            8,
            ["class"]
          ),
        ],
        64
      )
    );
  }
  const bH = /* @__PURE__ */ Gt(yH, [["render", $H]]),
    wH = /* @__PURE__ */ ki(bH),
    EH = vt(
      "focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
      {
        variants: {
          variant: {
            flat: "border border-transparent",
            outlined: "border bg-opacity-0",
            tonal: "border border-transparent",
          },
          color: {
            base: "bg-base-foreground text-base-background",
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
    OH = {
      badge: {
        root: EH,
        label: vt("font-normal"),
      },
    },
    SH = /* @__PURE__ */ me({
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
          styles: fr("badge", Mt(e), OH, e.upwindConfig),
          globalStyles: iu,
        };
      },
    }),
    AH = ["href"];
  function NH(e, t, r, n, o, i) {
    return (
      fe(),
      Sn(
        Nt,
        null,
        [
          ar(
            "link",
            {
              rel: "stylesheet",
              href: e.globalStyles,
            },
            null,
            8,
            AH
          ),
          ar(
            "span",
            {
              class: it(e.styles.badge.root),
            },
            [
              de(e.$slots, "prepend"),
              ar(
                "span",
                {
                  class: it(e.styles.badge.label),
                },
                [de(e.$slots, "default", {}, () => [Ao(_n(e.label), 1)])],
                2
              ),
              de(e.$slots, "append"),
            ],
            2
          ),
        ],
        64
      )
    );
  }
  const PH = /* @__PURE__ */ Gt(SH, [["render", NH]]),
    CH = /* @__PURE__ */ ki(PH),
    TH = /* @__PURE__ */ me({
      components: {
        DialogRoot: rE,
      },
      emits: ["update:open"],
    });
  function xH(e, t, r, n, o, i) {
    const s = Qe("dialog-root");
    return (
      fe(),
      $e(
        s,
        {
          "onUpdate:open": t[0] || (t[0] = a => e.$emit("update:open", a)),
        },
        {
          default: se(() => [de(e.$slots, "default")]),
          _: 3,
        }
      )
    );
  }
  const DH = /* @__PURE__ */ Gt(TH, [["render", xH]]),
    IH = /* @__PURE__ */ me({
      components: {
        DialogTrigger: nE,
      },
    });
  function RH(e, t, r, n, o, i) {
    const s = Qe("dialog-trigger", !0);
    return (
      fe(),
      $e(s, null, {
        default: se(() => [de(e.$slots, "default")]),
        _: 3,
      })
    );
  }
  const MH = /* @__PURE__ */ Gt(IH, [["render", RH]]),
    jH = vt(
      "border-border relative z-50 my-8 grid w-full gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full",
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
    Ho = {
      dialog: {
        content: jH,
        header: vt("flex flex-col gap-y-2 text-center sm:text-left"),
        title: vt("text-lg font-semibold leading-none tracking-tight"),
        description: vt("text-sm text-muted-foreground"),
        footer: vt(
          "flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-x-2"
        ),
        close: vt("absolute right-3 top-3 rounded-md p-0.5 transition-colors"),
        closeIcon: vt("h-3 w-3"),
        overlay: vt(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80"
        ),
      },
    },
    FH = /* @__PURE__ */ me({
      setup(e) {
        return {
          styles: fr("dialog", Mt(e), Ho),
        };
      },
    });
  function LH(e, t, r, n, o, i) {
    return (
      fe(),
      Sn(
        "div",
        {
          class: it(e.styles.dialog.header),
        },
        [de(e.$slots, "default")],
        2
      )
    );
  }
  const VH = /* @__PURE__ */ Gt(FH, [["render", LH]]),
    kH = /* @__PURE__ */ me({
      components: {
        DialogTitle: NE,
      },
      setup(e) {
        return {
          styles: fr("dialog", Mt(e), Ho),
        };
      },
    });
  function BH(e, t, r, n, o, i) {
    const s = Qe("dialog-title", !0);
    return (
      fe(),
      $e(
        s,
        {
          class: it(e.styles.dialog.title),
        },
        {
          default: se(() => [de(e.$slots, "default")]),
          _: 3,
        },
        8,
        ["class"]
      )
    );
  }
  const zH = /* @__PURE__ */ Gt(kH, [["render", BH]]),
    UH = /* @__PURE__ */ me({
      components: {
        DialogDescription: PE,
      },
      props: {
        asChild: Boolean,
      },
      setup(e) {
        return {
          styles: fr("dialog", Mt(e), Ho),
        };
      },
    });
  function WH(e, t, r, n, o, i) {
    const s = Qe("dialog-description", !0);
    return (
      fe(),
      $e(
        s,
        {
          class: it(e.styles.dialog.description),
          "as-child": e.asChild,
        },
        {
          default: se(() => [de(e.$slots, "default")]),
          _: 3,
        },
        8,
        ["class", "as-child"]
      )
    );
  }
  const HH = /* @__PURE__ */ Gt(UH, [["render", WH]]),
    KH = {
      icon: {
        root: vt(
          "inline-flex flex-shrink-0 align-middle [&>svg]:h-full [&>svg]:w-full",
          {
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
          }
        ),
      },
    },
    GH = /* @__PURE__ */ me({
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
        const t = fr("icon", Mt(e), KH, e.upwindConfig),
          r = /* @__PURE__ */ Object.assign({}),
          n = Oe();
        return (
          Qt(async () => {
            var a, l;
            const o = ur(e.icon)
                ? `${(a = e.icon) == null ? void 0 : a.path}/`
                : "",
              i = ur(e.icon)
                ? (l = e.icon) == null
                  ? void 0
                  : l.name
                : e.icon,
              s = bN(r, (c, u) => CN(u, `${o}${i}.svg`));
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
    qH = ["innerHTML", "aria-label"];
  function YH(e, t, r, n, o, i) {
    var s;
    return e.svg
      ? (fe(),
        Sn(
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
          qH
        ))
      : $r("", !0);
  }
  const JH = /* @__PURE__ */ Gt(GH, [["render", YH]]),
    XH = /* @__PURE__ */ me({
      components: {
        DialogClose: AE,
        DialogContent: EE,
        DialogOverlay: SE,
        DialogPortal: oE,
        UpwIcon: JH,
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
        const t = fr("dialog", Mt(e), Ho);
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
    ZH = /* @__PURE__ */ ar("span", { class: "sr-only" }, "Close", -1);
  function QH(e, t, r, n, o, i) {
    const s = Qe("upw-icon"),
      a = Qe("dialog-close"),
      l = Qe("dialog-content"),
      c = Qe("dialog-overlay"),
      u = Qe("dialog-portal");
    return (
      fe(),
      $e(u, null, {
        default: se(() => [
          Ve(
            c,
            {
              class: it(e.styles.dialog.overlay),
            },
            {
              default: se(() => [
                Ve(
                  l,
                  {
                    class: it(e.styles.dialog.content),
                    onPointerDownOutside: e.handlePointerDownOutside,
                  },
                  {
                    default: se(() => [
                      de(e.$slots, "default"),
                      Ve(
                        a,
                        {
                          class: it(e.styles.dialog.close),
                        },
                        {
                          default: se(() => [
                            Ve(
                              s,
                              {
                                icon: "close",
                                class: it(e.styles.dialog.closeIcon),
                              },
                              null,
                              8,
                              ["class"]
                            ),
                            ZH,
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
  const eK = /* @__PURE__ */ Gt(XH, [["render", QH]]),
    tK = /* @__PURE__ */ me({
      setup(e) {
        return {
          styles: fr("dialog", Mt(e), Ho),
        };
      },
    });
  function rK(e, t, r, n, o, i) {
    return (
      fe(),
      Sn(
        "div",
        {
          class: it(e.styles.dialog.footer),
        },
        [de(e.$slots, "default")],
        2
      )
    );
  }
  const nK = /* @__PURE__ */ Gt(tK, [["render", rK]]),
    oK = /* @__PURE__ */ me({
      components: {
        DialogRoot: DH,
        DialogScrollContent: eK,
        DialogDescription: HH,
        DialogFooter: nK,
        DialogHeader: VH,
        DialogTitle: zH,
        DialogTrigger: MH,
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
        const t = fr("dialog", Mt(e), Ho, e.upwindConfig);
        return {
          props: e,
          styles: t,
        };
      },
    });
  function iK(e, t, r, n, o, i) {
    const s = Qe("dialog-trigger"),
      a = Qe("dialog-title"),
      l = Qe("dialog-description"),
      c = Qe("dialog-header"),
      u = Qe("dialog-footer"),
      f = Qe("dialog-scroll-content"),
      d = Qe("dialog-root");
    return (
      fe(),
      $e(d, null, {
        default: se(() => [
          Ve(s, null, {
            default: se(() => [de(e.$slots, "trigger")]),
            _: 3,
          }),
          Ve(
            f,
            {
              size: e.size,
              overflow: e.overflow,
            },
            {
              default: se(() => [
                e.title || e.description
                  ? (fe(),
                    $e(
                      c,
                      { key: 0 },
                      {
                        default: se(() => [
                          e.title
                            ? (fe(),
                              $e(
                                a,
                                { key: 0 },
                                {
                                  default: se(() => [Ao(_n(e.title), 1)]),
                                  _: 1,
                                }
                              ))
                            : $r("", !0),
                          e.description
                            ? (fe(),
                              $e(
                                l,
                                { key: 1 },
                                {
                                  default: se(() => [Ao(_n(e.description), 1)]),
                                  _: 1,
                                }
                              ))
                            : $r("", !0),
                        ]),
                        _: 1,
                      }
                    ))
                  : $r("", !0),
                de(e.$slots, "content"),
                de(e.$slots, "default"),
                e.$slots.footer
                  ? (fe(),
                    $e(
                      u,
                      { key: 1 },
                      {
                        default: se(() => [de(e.$slots, "footer")]),
                        _: 3,
                      }
                    ))
                  : $r("", !0),
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
  const sK = /* @__PURE__ */ Gt(oK, [["render", iK]]),
    aK = /* @__PURE__ */ ki(sK),
    lK = /* @__PURE__ */ me({
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
        const o = ru(e, t);
        return (i, s) => (
          fe(),
          $e(
            U(ZE),
            Do(eo(U(o))),
            {
              default: se(() => [de(i.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    cK = /* @__PURE__ */ me({
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
          o = Se(() => {
            const { class: s, ...a } = r;
            return a;
          }),
          i = ru(o, n);
        return (s, a) => (
          fe(),
          $e(U(n1), null, {
            default: se(() => [
              Ve(
                U(t1),
                gt(
                  { ...U(i), ...s.$attrs },
                  {
                    class: r.class,
                  }
                ),
                {
                  default: se(() => [de(s.$slots, "default")]),
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
    uK = /* @__PURE__ */ me({
      __name: "TooltipTrigger",
      props: {
        asChild: { type: Boolean },
        as: {},
      },
      setup(e) {
        const t = e;
        return (r, n) => (
          fe(),
          $e(
            U(QE),
            Do(eo(t)),
            {
              default: se(() => [de(r.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    fK = /* @__PURE__ */ me({
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
          fe(),
          $e(
            U(JE),
            Do(eo(t)),
            {
              default: se(() => [de(r.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    dK = vt(
      "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded bg-base-800 px-3 py-1.5 text-sm text-white",
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
    pK = {
      tooltip: {
        content: dK,
        arrow: vt("text-base-800", {
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
    hK = /* @__PURE__ */ me({
      name: "UwTooltip",
      components: {
        Tooltip: lK,
        TooltipContent: cK,
        TooltipTrigger: uK,
        TooltipProvider: fK,
        TooltipArrow: r1,
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
          styles: fr("tooltip", Mt(e), pK, e.upwindConfig),
        };
      },
    });
  function gK(e, t, r, n, o, i) {
    const s = Qe("tooltip-trigger"),
      a = Qe("tooltip-arrow"),
      l = Qe("tooltip-content"),
      c = Qe("tooltip"),
      u = Qe("tooltip-provider");
    return (
      fe(),
      $e(
        u,
        { "delay-duration": e.delayDuration },
        {
          default: se(() => [
            Ve(
              c,
              { open: e.open },
              {
                default: se(() => [
                  Ve(s, null, {
                    default: se(() => [de(e.$slots, "default")]),
                    _: 3,
                  }),
                  Ve(
                    l,
                    {
                      side: e.direction,
                      sideOffset: e.sideOffset,
                      class: it(e.styles.tooltip.content),
                    },
                    {
                      default: se(() => [
                        de(e.$slots, "content", {}, () => [
                          ar("div", null, _n(e.label), 1),
                        ]),
                        Ve(
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
  const mK = /* @__PURE__ */ Gt(hK, [["render", gK]]),
    vK = /* @__PURE__ */ ki(mK);
  customElements.define("uw-avatar", wH);
  customElements.define("uw-badge", CH);
  customElements.define("uw-button", gH);
  customElements.define("uw-dialog", aK);
  customElements.define("uw-tooltip", vK);
});
export default yK();
