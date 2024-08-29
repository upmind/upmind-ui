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
  function Ts(e, t) {
    const r = new Set(e.split(","));
    return s => r.has(s);
  }
  const We = Xh.NODE_ENV !== "production" ? Object.freeze({}) : {},
    _s = Xh.NODE_ENV !== "production" ? Object.freeze([]) : [],
    ut = () => {},
    __ = () => !1,
    Io = e =>
      e.charCodeAt(0) === 111 &&
      e.charCodeAt(1) === 110 && // uppercase letter
      (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97),
    Li = e => e.startsWith("onUpdate:"),
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
    st = e => typeof e == "string",
    En = e => typeof e == "symbol",
    ze = e => e !== null && typeof e == "object",
    Oc = e => (ze(e) || ye(e)) && ye(e.then) && ye(e.catch),
    Qh = Object.prototype.toString,
    ha = e => Qh.call(e),
    Sc = e => ha(e).slice(8, -1),
    eg = e => ha(e) === "[object Object]",
    Ac = e =>
      st(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e,
    uo = /* @__PURE__ */ Ts(
      // the leading comma is intentional so empty string "" is also included
      ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
    ),
    b_ = /* @__PURE__ */ Ts(
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
    Ys = (e, ...t) => {
      for (let r = 0; r < e.length; r++) e[r](...t);
    },
    Vi = (e, t, r, s = !1) => {
      Object.defineProperty(e, t, {
        configurable: !0,
        enumerable: !1,
        writable: s,
        value: r,
      });
    },
    O_ = e => {
      const t = parseFloat(e);
      return isNaN(t) ? e : t;
    },
    Ff = e => {
      const t = st(e) ? Number(e) : NaN;
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
        const s = e[r],
          n = st(s) ? P_(s) : Qn(s);
        if (n) for (const o in n) t[o] = n[o];
      }
      return t;
    } else if (st(e) || ze(e)) return e;
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
            const s = r.split(A_);
            s.length > 1 && (t[s[0].trim()] = s[1].trim());
          }
        }),
      t
    );
  }
  function ot(e) {
    let t = "";
    if (st(e)) t = e;
    else if (he(e))
      for (let r = 0; r < e.length; r++) {
        const s = ot(e[r]);
        s && (t += s + " ");
      }
    else if (ze(e)) for (const r in e) e[r] && (t += r + " ");
    return t.trim();
  }
  function xs(e) {
    if (!e) return null;
    let { class: t, style: r } = e;
    return t && !st(t) && (e.class = ot(t)), r && (e.style = Qn(r)), e;
  }
  const C_ =
      "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",
    T_ = /* @__PURE__ */ Ts(C_);
  function tg(e) {
    return !!e || e === "";
  }
  const rg = e => !!(e && e.__v_isRef === !0),
    _n = e =>
      st(e)
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
                (r, [s, n], o) => ((r[rl(s, o) + " =>"] = n), r),
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
  class sg {
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
        let r, s;
        for (r = 0, s = this.effects.length; r < s; r++) this.effects[r].stop();
        for (r = 0, s = this.cleanups.length; r < s; r++) this.cleanups[r]();
        if (this.scopes)
          for (r = 0, s = this.scopes.length; r < s; r++)
            this.scopes[r].stop(!0);
        if (!this.detached && this.parent && !t) {
          const n = this.parent.scopes.pop();
          n &&
            n !== this &&
            ((this.parent.scopes[this.index] = n), (n.index = this.index));
        }
        (this.parent = void 0), (this._active = !1);
      }
    }
  }
  function og(e) {
    return new sg(e);
  }
  function x_(e, t = Ut) {
    t && t.active && t.effects.push(e);
  }
  function Pc() {
    return Ut;
  }
  function ig(e) {
    Ut
      ? Ut.cleanups.push(e)
      : dt.NODE_ENV !== "production" &&
        Er(
          "onScopeDispose() is called when there is no active effect scope to be associated with."
        );
  }
  let kn;
  class Cc {
    constructor(t, r, s, n) {
      (this.fn = t),
        (this.trigger = r),
        (this.scheduler = s),
        (this.active = !0),
        (this.deps = []),
        (this._dirtyLevel = 4),
        (this._trackId = 0),
        (this._runnings = 0),
        (this._shouldSchedule = !1),
        (this._depsLength = 0),
        x_(this, n);
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
    var s;
    if (t.get(e) !== e._trackId) {
      t.set(e, e._trackId);
      const n = e.deps[e._depsLength];
      n !== t
        ? (n && ag(n, e), (e.deps[e._depsLength++] = t))
        : e._depsLength++,
        dt.NODE_ENV !== "production" &&
          ((s = e.onTrack) == null || s.call(e, ft({ effect: e }, r)));
    }
  }
  const Ll = [];
  function ug(e, t, r) {
    var s;
    Tc();
    for (const n of e.keys()) {
      let o;
      n._dirtyLevel < t &&
        (o ?? (o = e.get(n) === n._trackId)) &&
        (n._shouldSchedule || (n._shouldSchedule = n._dirtyLevel === 0),
        (n._dirtyLevel = t)),
        n._shouldSchedule &&
          (o ?? (o = e.get(n) === n._trackId)) &&
          (dt.NODE_ENV !== "production" &&
            ((s = n.onTrigger) == null || s.call(n, ft({ effect: n }, r))),
          n.trigger(),
          (!n._runnings || n.allowRecurse) &&
            n._dirtyLevel !== 2 &&
            ((n._shouldSchedule = !1), n.scheduler && Ll.push(n.scheduler)));
    }
    xc();
  }
  const fg = (e, t) => {
      const r = /* @__PURE__ */ new Map();
      return (r.cleanup = e), (r.computed = t), r;
    },
    ki = /* @__PURE__ */ new WeakMap(),
    Bn = Symbol(dt.NODE_ENV !== "production" ? "iterate" : ""),
    Vl = Symbol(dt.NODE_ENV !== "production" ? "Map key iterate" : "");
  function Et(e, t, r) {
    if (gn && kn) {
      let s = ki.get(e);
      s || ki.set(e, (s = /* @__PURE__ */ new Map()));
      let n = s.get(r);
      n || s.set(r, (n = fg(() => s.delete(r)))),
        cg(
          kn,
          n,
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
  function wr(e, t, r, s, n, o) {
    const i = ki.get(e);
    if (!i) return;
    let a = [];
    if (t === "clear") a = [...i.values()];
    else if (r === "length" && he(e)) {
      const l = Number(s);
      i.forEach((c, u) => {
        (u === "length" || (!En(u) && u >= l)) && a.push(c);
      });
    } else
      switch ((r !== void 0 && a.push(i.get(r)), t)) {
        case "add":
          he(e)
            ? Ac(r) && a.push(i.get("length"))
            : (a.push(i.get(Bn)), Vn(e) && a.push(i.get(Vl)));
          break;
        case "delete":
          he(e) || (a.push(i.get(Bn)), Vn(e) && a.push(i.get(Vl)));
          break;
        case "set":
          Vn(e) && a.push(i.get(Bn));
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
                newValue: s,
                oldValue: n,
                oldTarget: o,
              }
            : void 0
        );
    xc();
  }
  function I_(e, t) {
    const r = ki.get(e);
    return r && r.get(t);
  }
  const R_ = /* @__PURE__ */ Ts("__proto__,__v_isRef,__isVue"),
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
          const s = Te(this);
          for (let o = 0, i = this.length; o < i; o++) Et(s, "get", o + "");
          const n = s[t](...r);
          return n === -1 || n === !1 ? s[t](...r.map(Te)) : n;
        };
      }),
      ["push", "pop", "shift", "unshift", "splice"].forEach(t => {
        e[t] = function (...r) {
          Gr(), Tc();
          const s = Te(this)[t].apply(this, r);
          return xc(), qr(), s;
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
    get(t, r, s) {
      const n = this._isReadonly,
        o = this._isShallow;
      if (r === "__v_isReactive") return !n;
      if (r === "__v_isReadonly") return n;
      if (r === "__v_isShallow") return o;
      if (r === "__v_raw")
        return s === (n ? (o ? $g : _g) : o ? yg : vg).get(t) || // receiver is not the reactive proxy, but has the same prototype
          // this means the reciever is a user proxy of the reactive proxy
          Object.getPrototypeOf(t) === Object.getPrototypeOf(s)
          ? t
          : void 0;
      const i = he(t);
      if (!n) {
        if (i && Fe(Bf, r)) return Reflect.get(Bf, r, s);
        if (r === "hasOwnProperty") return j_;
      }
      const a = Reflect.get(t, r, s);
      return (En(r) ? dg.has(r) : R_(r)) || (n || Et(t, "get", r), o)
        ? a
        : $t(a)
          ? i && Ac(r)
            ? a
            : a.value
          : ze(a)
            ? n
              ? ya(a)
              : Ro(a)
            : a;
    }
  }
  class hg extends pg {
    constructor(t = !1) {
      super(!1, t);
    }
    set(t, r, s, n) {
      let o = t[r];
      if (!this._isShallow) {
        const l = Ur(o);
        if (
          (!Fr(s) && !Ur(s) && ((o = Te(o)), (s = Te(s))),
          !he(t) && $t(o) && !$t(s))
        )
          return l ? !1 : ((o.value = s), !0);
      }
      const i = he(t) && Ac(r) ? Number(r) < t.length : Fe(t, r),
        a = Reflect.set(t, r, s, n);
      return (
        t === Te(n) &&
          (i ? yn(s, o) && wr(t, "set", r, s, o) : wr(t, "add", r, s)),
        a
      );
    }
    deleteProperty(t, r) {
      const s = Fe(t, r),
        n = t[r],
        o = Reflect.deleteProperty(t, r);
      return o && s && wr(t, "delete", r, void 0, n), o;
    }
    has(t, r) {
      const s = Reflect.has(t, r);
      return (!En(r) || !dg.has(r)) && Et(t, "has", r), s;
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
  function ai(e, t, r = !1, s = !1) {
    e = e.__v_raw;
    const n = Te(e),
      o = Te(t);
    r || (yn(t, o) && Et(n, "get", t), Et(n, "get", o));
    const { has: i } = ma(n),
      a = s ? Dc : r ? Ic : So;
    if (i.call(n, t)) return a(e.get(t));
    if (i.call(n, o)) return a(e.get(o));
    e !== n && e.get(t);
  }
  function li(e, t = !1) {
    const r = this.__v_raw,
      s = Te(r),
      n = Te(e);
    return (
      t || (yn(e, n) && Et(s, "has", e), Et(s, "has", n)),
      e === n ? r.has(e) : r.has(e) || r.has(n)
    );
  }
  function ci(e, t = !1) {
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
    const s = Te(this),
      { has: n, get: o } = ma(s);
    let i = n.call(s, e);
    i
      ? dt.NODE_ENV !== "production" && mg(s, n, e)
      : ((e = Te(e)), (i = n.call(s, e)));
    const a = o.call(s, e);
    return (
      s.set(e, t),
      i ? yn(t, a) && wr(s, "set", e, t, a) : wr(s, "add", e, t),
      this
    );
  }
  function Wf(e) {
    const t = Te(this),
      { has: r, get: s } = ma(t);
    let n = r.call(t, e);
    n
      ? dt.NODE_ENV !== "production" && mg(t, r, e)
      : ((e = Te(e)), (n = r.call(t, e)));
    const o = s ? s.call(t, e) : void 0,
      i = t.delete(e);
    return n && wr(t, "delete", e, void 0, o), i;
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
      s = e.clear();
    return t && wr(e, "clear", void 0, void 0, r), s;
  }
  function ui(e, t) {
    return function (s, n) {
      const o = this,
        i = o.__v_raw,
        a = Te(i),
        l = t ? Dc : e ? Ic : So;
      return (
        !e && Et(a, "iterate", Bn),
        i.forEach((c, u) => s.call(n, l(c), l(u), o))
      );
    };
  }
  function fi(e, t, r) {
    return function (...s) {
      const n = this.__v_raw,
        o = Te(n),
        i = Vn(o),
        a = e === "entries" || (e === Symbol.iterator && i),
        l = e === "keys" && i,
        c = n[e](...s),
        u = r ? Dc : t ? Ic : So;
      return (
        !t && Et(o, "iterate", l ? Vl : Bn),
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
        get(o) {
          return ai(this, o);
        },
        get size() {
          return ci(this);
        },
        has: li,
        add: zf,
        set: Uf,
        delete: Wf,
        clear: Hf,
        forEach: ui(!1, !1),
      },
      t = {
        get(o) {
          return ai(this, o, !1, !0);
        },
        get size() {
          return ci(this);
        },
        has: li,
        add(o) {
          return zf.call(this, o, !0);
        },
        set(o, i) {
          return Uf.call(this, o, i, !0);
        },
        delete: Wf,
        clear: Hf,
        forEach: ui(!1, !0),
      },
      r = {
        get(o) {
          return ai(this, o, !0);
        },
        get size() {
          return ci(this, !0);
        },
        has(o) {
          return li.call(this, o, !0);
        },
        add: nn("add"),
        set: nn("set"),
        delete: nn("delete"),
        clear: nn("clear"),
        forEach: ui(!0, !1),
      },
      s = {
        get(o) {
          return ai(this, o, !0, !0);
        },
        get size() {
          return ci(this, !0);
        },
        has(o) {
          return li.call(this, o, !0);
        },
        add: nn("add"),
        set: nn("set"),
        delete: nn("delete"),
        clear: nn("clear"),
        forEach: ui(!0, !0),
      };
    return (
      ["keys", "values", "entries", Symbol.iterator].forEach(o => {
        (e[o] = fi(o, !1, !1)),
          (r[o] = fi(o, !0, !1)),
          (t[o] = fi(o, !1, !0)),
          (s[o] = fi(o, !0, !0));
      }),
      [e, r, t, s]
    );
  }
  const [z_, U_, W_, H_] = /* @__PURE__ */ B_();
  function va(e, t) {
    const r = t ? (e ? H_ : W_) : e ? U_ : z_;
    return (s, n, o) =>
      n === "__v_isReactive"
        ? !e
        : n === "__v_isReadonly"
          ? e
          : n === "__v_raw"
            ? s
            : Reflect.get(Fe(r, n) && n in s ? r : s, n, o);
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
    const s = Te(r);
    if (s !== r && t.call(e, s)) {
      const n = Sc(e);
      Er(
        `Reactive ${n} contains both the raw and reactive versions of the same object${n === "Map" ? " as keys" : ""}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
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
  function Ro(e) {
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
  function _a(e, t, r, s, n) {
    if (!ze(e))
      return (
        dt.NODE_ENV !== "production" &&
          Er(
            `value cannot be made ${t ? "readonly" : "reactive"}: ${String(e)}`
          ),
        e
      );
    if (e.__v_raw && !(t && e.__v_isReactive)) return e;
    const o = n.get(e);
    if (o) return o;
    const i = X_(e);
    if (i === 0) return e;
    const a = new Proxy(e, i === 2 ? s : r);
    return n.set(e, a), a;
  }
  function $s(e) {
    return Ur(e) ? $s(e.__v_raw) : !!(e && e.__v_isReactive);
  }
  function Ur(e) {
    return !!(e && e.__v_isReadonly);
  }
  function Fr(e) {
    return !!(e && e.__v_isShallow);
  }
  function Bi(e) {
    return e ? !!e.__v_raw : !1;
  }
  function Te(e) {
    const t = e && e.__v_raw;
    return t ? Te(t) : e;
  }
  function Q_(e) {
    return Object.isExtensible(e) && Vi(e, "__v_skip", !0), e;
  }
  const So = e => (ze(e) ? Ro(e) : e),
    Ic = e => (ze(e) ? ya(e) : e),
    e$ =
      "Computed is still dirty after getter evaluation, likely because a computed is mutating its own dependency in its getter. State mutations in computed getters should be avoided.  Check the docs for more details: https://vuejs.org/guide/essentials/computed.html#getters-should-be-side-effect-free";
  class bg {
    constructor(t, r, s, n) {
      (this.getter = t),
        (this._setter = r),
        (this.dep = void 0),
        (this.__v_isRef = !0),
        (this.__v_isReadonly = !1),
        (this.effect = new Cc(
          () => t(this._value),
          () => fo(this, this.effect._dirtyLevel === 2 ? 2 : 3)
        )),
        (this.effect.computed = this),
        (this.effect.active = this._cacheable = !n),
        (this.__v_isReadonly = s);
    }
    get value() {
      const t = Te(this);
      return (
        (!t._cacheable || t.effect.dirty) &&
          yn(t._value, (t._value = t.effect.run())) &&
          fo(t, 4),
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
          fo(t, 2)),
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
    let s, n;
    const o = ye(e);
    o
      ? ((s = e),
        (n =
          dt.NODE_ENV !== "production"
            ? () => {
                Er("Write operation failed: computed value is readonly");
              }
            : ut))
      : ((s = e.get), (n = e.set));
    const i = new bg(s, n, o || !n, r);
    return (
      dt.NODE_ENV !== "production" &&
        t &&
        !r &&
        ((i.effect.onTrack = t.onTrack), (i.effect.onTrigger = t.onTrigger)),
      i
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
  function fo(e, t = 4, r, s) {
    e = Te(e);
    const n = e.dep;
    n &&
      ug(
        n,
        t,
        dt.NODE_ENV !== "production"
          ? {
              target: e,
              type: "set",
              key: "value",
              newValue: r,
              oldValue: s,
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
        (this._value = r ? t : So(t));
    }
    get value() {
      return Rc(this), this._value;
    }
    set value(t) {
      const r = this.__v_isShallow || Fr(t) || Ur(t);
      if (((t = r ? t : Te(t)), yn(t, this._rawValue))) {
        const s = this._rawValue;
        (this._rawValue = t), (this._value = r ? t : So(t)), fo(this, 4, t, s);
      }
    }
  }
  function U(e) {
    return $t(e) ? e.value : e;
  }
  const n$ = {
    get: (e, t, r) => U(Reflect.get(e, t, r)),
    set: (e, t, r, s) => {
      const n = e[t];
      return $t(n) && !$t(r) ? ((n.value = r), !0) : Reflect.set(e, t, r, s);
    },
  };
  function Og(e) {
    return $s(e) ? e : new Proxy(e, n$);
  }
  class s$ {
    constructor(t) {
      (this.dep = void 0), (this.__v_isRef = !0);
      const { get: r, set: s } = t(
        () => Rc(this),
        () => fo(this)
      );
      (this._get = r), (this._set = s);
    }
    get value() {
      return this._get();
    }
    set value(t) {
      this._set(t);
    }
  }
  function o$(e) {
    return new s$(e);
  }
  function Mt(e) {
    dt.NODE_ENV !== "production" &&
      !Bi(e) &&
      Er("toRefs() expects a reactive object but received a plain one.");
    const t = he(e) ? new Array(e.length) : {};
    for (const r in e) t[r] = Sg(e, r);
    return t;
  }
  class i$ {
    constructor(t, r, s) {
      (this._object = t),
        (this._key = r),
        (this._defaultValue = s),
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
    const s = e[t];
    return $t(s) ? s : new i$(e, t, r);
  }
  var D = {};
  const zn = [];
  function Ai(e) {
    zn.push(e);
  }
  function Ni() {
    zn.pop();
  }
  let nl = !1;
  function Z(e, ...t) {
    if (nl) return;
    (nl = !0), Gr();
    const r = zn.length ? zn[zn.length - 1].component : null,
      s = r && r.appContext.config.warnHandler,
      n = c$();
    if (s)
      Lr(s, r, 11, [
        // eslint-disable-next-line no-restricted-syntax
        e +
          t
            .map(o => {
              var i, a;
              return (a = (i = o.toString) == null ? void 0 : i.call(o)) != null
                ? a
                : JSON.stringify(o);
            })
            .join(""),
        r && r.proxy,
        n.map(({ vnode: o }) => `at <${Sa(r, o.type)}>`).join(`
`),
        n,
      ]);
    else {
      const o = [`[Vue warn]: ${e}`, ...t];
      n.length &&
        o.push(
          `
`,
          ...u$(n)
        ),
        console.warn(...o);
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
      const s = e.component && e.component.parent;
      e = s && s.vnode;
    }
    return t;
  }
  function u$(e) {
    const t = [];
    return (
      e.forEach((r, s) => {
        t.push(
          ...(s === 0
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
      s = e.component ? e.component.parent == null : !1,
      n = ` at <${Sa(e.component, e.type, s)}`,
      o = ">" + r;
    return e.props ? [n, ...d$(e.props), o] : [n + o];
  }
  function d$(e) {
    const t = [],
      r = Object.keys(e);
    return (
      r.slice(0, 3).forEach(s => {
        t.push(...Ag(s, e[s]));
      }),
      r.length > 3 && t.push(" ..."),
      t
    );
  }
  function Ag(e, t, r) {
    return st(t)
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
  function Lr(e, t, r, s) {
    try {
      return s ? e(...s) : e();
    } catch (n) {
      Mo(n, t, r);
    }
  }
  function ir(e, t, r, s) {
    if (ye(e)) {
      const n = Lr(e, t, r, s);
      return (
        n &&
          Oc(n) &&
          n.catch(o => {
            Mo(o, t, r);
          }),
        n
      );
    }
    if (he(e)) {
      const n = [];
      for (let o = 0; o < e.length; o++) n.push(ir(e[o], t, r, s));
      return n;
    } else
      D.NODE_ENV !== "production" &&
        Z(
          `Invalid value type passed to callWithAsyncErrorHandling(): ${typeof e}`
        );
  }
  function Mo(e, t, r, s = !0) {
    const n = t ? t.vnode : null;
    if (t) {
      let o = t.parent;
      const i = t.proxy,
        a =
          D.NODE_ENV !== "production"
            ? Mc[r]
            : `https://vuejs.org/error-reference/#runtime-${r}`;
      for (; o; ) {
        const c = o.ec;
        if (c) {
          for (let u = 0; u < c.length; u++) if (c[u](e, i, a) === !1) return;
        }
        o = o.parent;
      }
      const l = t.appContext.config.errorHandler;
      if (l) {
        Gr(), Lr(l, null, 10, [e, i, a]), qr();
        return;
      }
    }
    p$(e, r, n, s);
  }
  function p$(e, t, r, s = !0) {
    if (D.NODE_ENV !== "production") {
      const n = Mc[t];
      if (
        (r && Ai(r),
        Z(`Unhandled error${n ? ` during execution of ${n}` : ""}`),
        r && Ni(),
        s)
      )
        throw e;
      console.error(e);
    } else console.error(e);
  }
  let Ao = !1,
    kl = !1;
  const Pt = [];
  let vr = 0;
  const bs = [];
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
      const s = (t + r) >>> 1,
        n = Pt[s],
        o = No(n);
      o < e || (o === e && n.pre) ? (t = s + 1) : (r = s);
    }
    return t;
  }
  function $a(e) {
    (!Pt.length || !Pt.includes(e, Ao && e.allowRecurse ? vr + 1 : vr)) &&
      (e.id == null ? Pt.push(e) : Pt.splice(g$(e.id), 0, e), Pg());
  }
  function Pg() {
    !Ao && !kl && ((kl = !0), (jc = Ng.then(xg)));
  }
  function m$(e) {
    const t = Pt.indexOf(e);
    t > vr && Pt.splice(t, 1);
  }
  function Cg(e) {
    he(e)
      ? bs.push(...e)
      : (!un || !un.includes(e, e.allowRecurse ? Rn + 1 : Rn)) && bs.push(e),
      Pg();
  }
  function Kf(e, t, r = Ao ? vr + 1 : 0) {
    for (
      D.NODE_ENV !== "production" && (t = t || /* @__PURE__ */ new Map());
      r < Pt.length;
      r++
    ) {
      const s = Pt[r];
      if (s && s.pre) {
        if ((e && s.id !== e.uid) || (D.NODE_ENV !== "production" && Fc(t, s)))
          continue;
        Pt.splice(r, 1), r--, s();
      }
    }
  }
  function Tg(e) {
    if (bs.length) {
      const t = [...new Set(bs)].sort((r, s) => No(r) - No(s));
      if (((bs.length = 0), un)) {
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
  const No = e => (e.id == null ? 1 / 0 : e.id),
    v$ = (e, t) => {
      const r = No(e) - No(t);
      if (r === 0) {
        if (e.pre && !t.pre) return -1;
        if (t.pre && !e.pre) return 1;
      }
      return r;
    };
  function xg(e) {
    (kl = !1),
      (Ao = !0),
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
        (Ao = !1),
        (jc = null),
        (Pt.length || bs.length) && xg(e);
    }
  }
  function Fc(e, t) {
    if (!e.has(t)) e.set(t, 1);
    else {
      const r = e.get(t);
      if (r > h$) {
        const s = t.i,
          n = s && Kc(s.type);
        return (
          Mo(
            `Maximum recursive updates exceeded${n ? ` in component <${n}>` : ""}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`,
            null,
            10
          ),
          !0
        );
      } else e.set(t, r + 1);
    }
  }
  let mn = !1;
  const Pi = /* @__PURE__ */ new Map();
  D.NODE_ENV !== "production" &&
    (Nc().__VUE_HMR_RUNTIME__ = {
      createRecord: sl(Dg),
      rerender: sl($$),
      reload: sl(b$),
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
          initialDef: zi(t),
          instances: /* @__PURE__ */ new Set(),
        }),
        !0);
  }
  function zi(e) {
    return ym(e) ? e.__vccOpts : e;
  }
  function $$(e, t) {
    const r = Gn.get(e);
    r &&
      ((r.initialDef.render = t),
      [...r.instances].forEach(s => {
        t && ((s.render = t), (zi(s.type).render = t)),
          (s.renderCache = []),
          (mn = !0),
          (s.effect.dirty = !0),
          s.update(),
          (mn = !1);
      }));
  }
  function b$(e, t) {
    const r = Gn.get(e);
    if (!r) return;
    (t = zi(t)), Gf(r.initialDef, t);
    const s = [...r.instances];
    for (let n = 0; n < s.length; n++) {
      const o = s[n],
        i = zi(o.type);
      let a = Pi.get(i);
      a ||
        (i !== r.initialDef && Gf(i, t),
        Pi.set(i, (a = /* @__PURE__ */ new Set()))),
        a.add(o),
        o.appContext.propsCache.delete(o.type),
        o.appContext.emitsCache.delete(o.type),
        o.appContext.optionsCache.delete(o.type),
        o.ceReload
          ? (a.add(o), o.ceReload(t.styles), a.delete(o))
          : o.parent
            ? ((o.parent.effect.dirty = !0),
              $a(() => {
                o.parent.update(), a.delete(o);
              }))
            : o.appContext.reload
              ? o.appContext.reload()
              : typeof window < "u"
                ? window.location.reload()
                : console.warn(
                    "[HMR] Root or manually mounted instance modified. Full reload required."
                  );
    }
    Cg(() => {
      Pi.clear();
    });
  }
  function Gf(e, t) {
    ft(e, t);
    for (const r in e) r !== "__file" && !(r in t) && delete e[r];
  }
  function sl(e) {
    return (t, r) => {
      try {
        return e(t, r);
      } catch (s) {
        console.error(s),
          console.warn(
            "[HMR] Something went wrong during Vue component hot-reload. Full reload required."
          );
      }
    };
  }
  let yr,
    io = [],
    Bl = !1;
  function jo(e, ...t) {
    yr ? yr.emit(e, ...t) : Bl || io.push({ event: e, args: t });
  }
  function Ig(e, t) {
    var r, s;
    (yr = e),
      yr
        ? ((yr.enabled = !0),
          io.forEach(({ event: n, args: o }) => yr.emit(n, ...o)),
          (io = []))
        : /* handle late devtools injection - only do this if we are in an actual */ /* browser environment to avoid the timer handle stalling test runner exit */ /* (#4815) */ typeof window <
              "u" && // some envs mock window but not fully
            window.HTMLElement && // also exclude jsdom
            // eslint-disable-next-line no-restricted-syntax
            !(
              (s = (r = window.navigator) == null ? void 0 : r.userAgent) !=
                null && s.includes("jsdom")
            )
          ? ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ =
              t.__VUE_DEVTOOLS_HOOK_REPLAY__ || []).push(o => {
              Ig(o, t);
            }),
            setTimeout(() => {
              yr ||
                ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ = null), (Bl = !0), (io = []));
            }, 3e3))
          : ((Bl = !0), (io = []));
  }
  function w$(e, t) {
    jo("app:init", e, t, {
      Fragment: Nt,
      Text: Lo,
      Comment: Rt,
      Static: Ci,
    });
  }
  function E$(e) {
    jo("app:unmount", e);
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
      jo(e, t.appContext.app, t.uid, t.parent ? t.parent.uid : void 0, t);
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
    return (t, r, s) => {
      jo(e, t.appContext.app, t.uid, t, r, s);
    };
  }
  function C$(e, t, r) {
    jo("component:emit", e.appContext.app, e, t, r);
  }
  let ht = null,
    jg = null;
  function Ui(e) {
    const t = ht;
    return (ht = e), (jg = (e && e.type.__scopeId) || null), t;
  }
  function ie(e, t = ht, r) {
    if (!t || e._n) return e;
    const s = (...n) => {
      s._d && id(-1);
      const o = Ui(t);
      let i;
      try {
        i = e(...n);
      } finally {
        Ui(o), s._d && id(1);
      }
      return D.NODE_ENV !== "production" && Rg(t), i;
    };
    return (s._n = !0), (s._c = !0), (s._d = !0), s;
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
      s = e.dirs || (e.dirs = []);
    for (let n = 0; n < t.length; n++) {
      let [o, i, a, l = We] = t[n];
      o &&
        (ye(o) &&
          (o = {
            mounted: o,
            updated: o,
          }),
        o.deep && pn(i),
        s.push({
          dir: o,
          instance: r,
          value: i,
          oldValue: void 0,
          arg: a,
          modifiers: l,
        }));
    }
    return e;
  }
  function Tn(e, t, r, s) {
    const n = e.dirs,
      o = t && t.dirs;
    for (let i = 0; i < n.length; i++) {
      const a = n[i];
      o && (a.oldValue = o[i].value);
      let l = a.dir[s];
      l && (Gr(), ir(l, r, 8, [e.el, a, e, t]), qr());
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
  const po = e => !!e.type.__asyncLoader,
    Vc = e => e.type.__isKeepAlive;
  function x$(e, t) {
    Vg(e, "a", t);
  }
  function D$(e, t) {
    Vg(e, "da", t);
  }
  function Vg(e, t, r = yt) {
    const s =
      e.__wdc ||
      (e.__wdc = () => {
        let n = r;
        for (; n; ) {
          if (n.isDeactivated) return;
          n = n.parent;
        }
        return e();
      });
    if ((ba(t, s, r), r)) {
      let n = r.parent;
      for (; n && n.parent; )
        Vc(n.parent.vnode) && I$(s, t, r, n), (n = n.parent);
    }
  }
  function I$(e, t, r, s) {
    const n = ba(
      t,
      e,
      s,
      !0
      /* prepend */
    );
    Fo(() => {
      Ec(s[t], n);
    }, r);
  }
  function ba(e, t, r = yt, s = !1) {
    if (r) {
      const n = r[e] || (r[e] = []),
        o =
          t.__weh ||
          (t.__weh = (...i) => {
            Gr();
            const a = Vo(r),
              l = ir(t, r, e, i);
            return a(), qr(), l;
          });
      return s ? n.unshift(o) : n.push(o), o;
    } else if (D.NODE_ENV !== "production") {
      const n = Ir(Mc[e].replace(/ hook$/, ""));
      Z(
        `${n} is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.`
      );
    }
  }
  const Yr =
      e =>
      (t, r = yt) => {
        (!Ea || e === "sp") && ba(e, (...s) => t(...s), r);
      },
    R$ = Yr("bm"),
    Jr = Yr("m"),
    M$ = Yr("bu"),
    j$ = Yr("u"),
    kg = Yr("bum"),
    Fo = Yr("um"),
    F$ = Yr("sp"),
    L$ = Yr("rtg"),
    V$ = Yr("rtc");
  function k$(e, t = yt) {
    ba("ec", e, t);
  }
  const Bg = "components";
  function Ye(e, t) {
    return Ug(Bg, e, !0, t) || e;
  }
  const zg = Symbol.for("v-ndc");
  function B$(e) {
    return st(e) ? Ug(Bg, e, !1) || e : e || zg;
  }
  function Ug(e, t, r = !0, s = !1) {
    const n = ht || yt;
    if (n) {
      const o = n.type;
      {
        const a = Kc(o, !1);
        if (a && (a === t || a === Ct(t) || a === Kn(Ct(t)))) return o;
      }
      const i =
        // local registration
        // check instance[type] first which is resolved for options API
        qf(n[e] || o[e], t) || // global registration
        qf(n.appContext[e], t);
      return !i && s
        ? o
        : (D.NODE_ENV !== "production" &&
            r &&
            !i &&
            Z(`Failed to resolve ${e.slice(0, -1)}: ${t}
If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement.`),
          i);
    } else
      D.NODE_ENV !== "production" &&
        Z(
          `resolve${Kn(e.slice(0, -1))} can only be used in render() or setup().`
        );
  }
  function qf(e, t) {
    return e && (e[t] || e[Ct(t)] || e[Kn(Ct(t))]);
  }
  function de(e, t, r = {}, s, n) {
    if (ht.isCE || (ht.parent && po(ht.parent) && ht.parent.isCE))
      return t !== "default" && (r.name = t), Ve("slot", r, s && s());
    let o = e[t];
    D.NODE_ENV !== "production" &&
      o &&
      o.length > 1 &&
      (Z(
        "SSR-optimized slot function detected in a non-SSR-optimized render function. You need to mark this component with $dynamic-slots in the parent template."
      ),
      (o = () => [])),
      o && o._c && (o._d = !1),
      ue();
    const i = o && Wg(o(r)),
      a = _e(
        Nt,
        {
          key:
            (r.key || // slot content array of a dynamic conditional slot may have a branch
              // key attached in the `createSlots` helper, respect that
              (i && i.key) ||
              `_${t}`) + // #7256 force differentiate fallback content from actual content
            (!i && s ? "_fb" : ""),
        },
        i || (s ? s() : []),
        i && e._ === 1 ? 64 : -2
      );
    return (
      a.scopeId && (a.slotScopeIds = [a.scopeId + "-s"]),
      o && o._c && (o._d = !0),
      a
    );
  }
  function Wg(e) {
    return e.some(t =>
      Os(t) ? !(t.type === Rt || (t.type === Nt && !Wg(t.children))) : !0
    )
      ? e
      : null;
  }
  function z$(e, t) {
    const r = {};
    if (D.NODE_ENV !== "production" && !ze(e))
      return Z("v-on with no argument expects an object value."), r;
    for (const s in e) r[Ir(s)] = e[s];
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
    ol = (e, t) => e !== We && !e.__isScriptSetup && Fe(e, t),
    Hg = {
      get({ _: e }, t) {
        if (t === "__v_skip") return !0;
        const {
          ctx: r,
          setupState: s,
          data: n,
          props: o,
          accessCache: i,
          type: a,
          appContext: l,
        } = e;
        if (D.NODE_ENV !== "production" && t === "__isVue") return !0;
        let c;
        if (t[0] !== "$") {
          const p = i[t];
          if (p !== void 0)
            switch (p) {
              case 1:
                return s[t];
              case 2:
                return n[t];
              case 4:
                return r[t];
              case 3:
                return o[t];
            }
          else {
            if (ol(s, t)) return (i[t] = 1), s[t];
            if (n !== We && Fe(n, t)) return (i[t] = 2), n[t];
            if (
              // only cache other properties when instance has declared (thus stable)
              // props
              (c = e.propsOptions[0]) &&
              Fe(c, t)
            )
              return (i[t] = 3), o[t];
            if (r !== We && Fe(r, t)) return (i[t] = 4), r[t];
            Wl && (i[t] = 0);
          }
        }
        const u = Un[t];
        let f, d;
        if (u)
          return (
            t === "$attrs"
              ? (Et(e.attrs, "get", ""), D.NODE_ENV !== "production" && Ki())
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
        if (r !== We && Fe(r, t)) return (i[t] = 4), r[t];
        if (
          // global properties
          ((d = l.config.globalProperties), Fe(d, t))
        )
          return d[t];
        D.NODE_ENV !== "production" &&
          ht &&
          (!st(t) || // #1091 avoid internal isRef/isVNode checks on component instance leading
            // to infinite warning loop
            t.indexOf("__v") !== 0) &&
          (n !== We && kc(t[0]) && Fe(n, t)
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
        const { data: s, setupState: n, ctx: o } = e;
        return ol(n, t)
          ? ((n[t] = r), !0)
          : D.NODE_ENV !== "production" && n.__isScriptSetup && Fe(n, t)
            ? (Z(
                `Cannot mutate <script setup> binding "${t}" from Options API.`
              ),
              !1)
            : s !== We && Fe(s, t)
              ? ((s[t] = r), !0)
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
                      ? Object.defineProperty(o, t, {
                          enumerable: !0,
                          configurable: !0,
                          value: r,
                        })
                      : (o[t] = r),
                    !0);
      },
      has(
        {
          _: {
            data: e,
            setupState: t,
            accessCache: r,
            ctx: s,
            appContext: n,
            propsOptions: o,
          },
        },
        i
      ) {
        let a;
        return (
          !!r[i] ||
          (e !== We && Fe(e, i)) ||
          ol(t, i) ||
          ((a = o[0]) && Fe(a, i)) ||
          Fe(s, i) ||
          Fe(Un, i) ||
          Fe(n.config.globalProperties, i)
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
      Object.keys(r).forEach(s => {
        Object.defineProperty(t, s, {
          enumerable: !0,
          configurable: !0,
          get: () => e.props[s],
          set: ut,
        });
      });
  }
  function H$(e) {
    const { ctx: t, setupState: r } = e;
    Object.keys(Te(r)).forEach(s => {
      if (!r.__isScriptSetup) {
        if (kc(s[0])) {
          Z(
            `setup() return property ${JSON.stringify(
              s
            )} should not start with "$" or "_" which are reserved prefixes for Vue internals.`
          );
          return;
        }
        Object.defineProperty(t, s, {
          enumerable: !0,
          configurable: !0,
          get: () => r[s],
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
    for (const s in t) {
      if (s.startsWith("__skip")) continue;
      let n = r[s];
      n
        ? he(n) || ye(n)
          ? (n = r[s] = { type: n, default: t[s] })
          : (n.default = t[s])
        : n === null
          ? (n = r[s] = { default: t[s] })
          : D.NODE_ENV !== "production" &&
            Z(`props default key "${s}" has no corresponding declaration.`),
        n && t[`__skip_${s}`] && (n.skipFactory = !0);
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
      s = e.ctx;
    (Wl = !1), t.beforeCreate && Yf(t.beforeCreate, e, "bc");
    const {
        // state
        data: n,
        computed: o,
        methods: i,
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
        filters: fe,
      } = t,
      Pe = D.NODE_ENV !== "production" ? Y$() : null;
    if (D.NODE_ENV !== "production") {
      const [le] = e.propsOptions;
      if (le) for (const ve in le) Pe("Props", ve);
    }
    if ((c && X$(c, s, Pe), i))
      for (const le in i) {
        const ve = i[le];
        ye(ve)
          ? (D.NODE_ENV !== "production"
              ? Object.defineProperty(s, le, {
                  value: ve.bind(r),
                  configurable: !0,
                  enumerable: !0,
                  writable: !0,
                })
              : (s[le] = ve.bind(r)),
            D.NODE_ENV !== "production" && Pe("Methods", le))
          : D.NODE_ENV !== "production" &&
            Z(
              `Method "${le}" has type "${typeof ve}" in the component definition. Did you reference the function correctly?`
            );
      }
    if (n) {
      D.NODE_ENV !== "production" &&
        !ye(n) &&
        Z(
          "The data option must be a function. Plain object usage is no longer supported."
        );
      const le = n.call(r, r);
      if (
        (D.NODE_ENV !== "production" &&
          Oc(le) &&
          Z(
            "data() returned a Promise - note data() cannot be async; If you intend to perform data fetching before component renders, use async setup() + <Suspense>."
          ),
        !ze(le))
      )
        D.NODE_ENV !== "production" && Z("data() should return an object.");
      else if (((e.data = Ro(le)), D.NODE_ENV !== "production"))
        for (const ve in le)
          Pe("Data", ve),
            kc(ve[0]) ||
              Object.defineProperty(s, ve, {
                configurable: !0,
                enumerable: !0,
                get: () => le[ve],
                set: ut,
              });
    }
    if (((Wl = !0), o))
      for (const le in o) {
        const ve = o[le],
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
        Object.defineProperty(s, le, {
          enumerable: !0,
          configurable: !0,
          get: () => R.value,
          set: M => (R.value = M),
        }),
          D.NODE_ENV !== "production" && Pe("Computed", le);
      }
    if (a) for (const le in a) Kg(a[le], s, r, le);
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
      be(Fo, S),
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
    for (const s in e) {
      const n = e[s];
      let o;
      ze(n)
        ? "default" in n
          ? (o = go(n.from || s, n.default, !0))
          : (o = go(n.from || s))
        : (o = go(n)),
        $t(o)
          ? Object.defineProperty(t, s, {
              enumerable: !0,
              configurable: !0,
              get: () => o.value,
              set: i => (o.value = i),
            })
          : (t[s] = o),
        D.NODE_ENV !== "production" && r("Inject", s);
    }
  }
  function Yf(e, t, r) {
    ir(he(e) ? e.map(s => s.bind(t.proxy)) : e.bind(t.proxy), t, r);
  }
  function Kg(e, t, r, s) {
    const n = s.includes(".") ? lm(r, s) : () => r[s];
    if (st(e)) {
      const o = t[e];
      ye(o)
        ? _t(n, o)
        : D.NODE_ENV !== "production" &&
          Z(`Invalid watch handler specified by key "${e}"`, o);
    } else if (ye(e)) _t(n, e.bind(r));
    else if (ze(e))
      if (he(e)) e.forEach(o => Kg(o, t, r, s));
      else {
        const o = ye(e.handler) ? e.handler.bind(r) : t[e.handler];
        ye(o)
          ? _t(n, o, e)
          : D.NODE_ENV !== "production" &&
            Z(`Invalid watch handler specified by key "${e.handler}"`, o);
      }
    else D.NODE_ENV !== "production" && Z(`Invalid watch option: "${s}"`, e);
  }
  function Bc(e) {
    const t = e.type,
      { mixins: r, extends: s } = t,
      {
        mixins: n,
        optionsCache: o,
        config: { optionMergeStrategies: i },
      } = e.appContext,
      a = o.get(t);
    let l;
    return (
      a
        ? (l = a)
        : !n.length && !r && !s
          ? (l = t)
          : ((l = {}),
            n.length && n.forEach(c => Wi(l, c, i, !0)),
            Wi(l, t, i)),
      ze(t) && o.set(t, l),
      l
    );
  }
  function Wi(e, t, r, s = !1) {
    const { mixins: n, extends: o } = t;
    o && Wi(e, o, r, !0), n && n.forEach(i => Wi(e, i, r, !0));
    for (const i in t)
      if (s && i === "expose")
        D.NODE_ENV !== "production" &&
          Z(
            '"expose" option is ignored when declared in mixins or extends. It should only be declared in the base component itself.'
          );
      else {
        const a = Z$[i] || (r && r[i]);
        e[i] = a ? a(e[i], t[i]) : t[i];
      }
    return e;
  }
  const Z$ = {
    data: Jf,
    props: Xf,
    emits: Xf,
    // objects
    methods: ao,
    computed: ao,
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
    components: ao,
    directives: ao,
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
    return ao(Hl(e), Hl(t));
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
  function ao(e, t) {
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
    for (const s in t) r[s] = Dt(e[s], t[s]);
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
    return function (s, n = null) {
      ye(s) || (s = ft({}, s)),
        n != null &&
          !ze(n) &&
          (D.NODE_ENV !== "production" &&
            Z("root props passed to app.mount() must be an object."),
          (n = null));
      const o = Gg(),
        i = /* @__PURE__ */ new WeakSet();
      let a = !1;
      const l = (o.app = {
        _uid: tb++,
        _component: s,
        _props: n,
        _container: null,
        _context: o,
        _instance: null,
        version: ud,
        get config() {
          return o.config;
        },
        set config(c) {
          D.NODE_ENV !== "production" &&
            Z(
              "app.config cannot be replaced. Modify individual options instead."
            );
        },
        use(c, ...u) {
          return (
            i.has(c)
              ? D.NODE_ENV !== "production" &&
                Z("Plugin has already been applied to target app.")
              : c && ye(c.install)
                ? (i.add(c), c.install(l, ...u))
                : ye(c)
                  ? (i.add(c), c(l, ...u))
                  : D.NODE_ENV !== "production" &&
                    Z(
                      'A plugin must either be a function or an object with an "install" function.'
                    ),
            l
          );
        },
        mixin(c) {
          return (
            o.mixins.includes(c)
              ? D.NODE_ENV !== "production" &&
                Z(
                  "Mixin has already been applied to target app" +
                    (c.name ? `: ${c.name}` : "")
                )
              : o.mixins.push(c),
            l
          );
        },
        component(c, u) {
          return (
            D.NODE_ENV !== "production" && Zl(c, o.config),
            u
              ? (D.NODE_ENV !== "production" &&
                  o.components[c] &&
                  Z(
                    `Component "${c}" has already been registered in target app.`
                  ),
                (o.components[c] = u),
                l)
              : o.components[c]
          );
        },
        directive(c, u) {
          return (
            D.NODE_ENV !== "production" && Fg(c),
            u
              ? (D.NODE_ENV !== "production" &&
                  o.directives[c] &&
                  Z(
                    `Directive "${c}" has already been registered in target app.`
                  ),
                (o.directives[c] = u),
                l)
              : o.directives[c]
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
            const d = Ve(s, n);
            return (
              (d.appContext = o),
              f === !0 ? (f = "svg") : f === !1 && (f = void 0),
              D.NODE_ENV !== "production" &&
                (o.reload = () => {
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
              c in o.provides &&
              Z(
                `App already provides property with key "${String(c)}". It will be overwritten with the new value.`
              ),
            (o.provides[c] = u),
            l
          );
        },
        runWithContext(c) {
          const u = ho;
          ho = l;
          try {
            return c();
          } finally {
            ho = u;
          }
        },
      });
      return l;
    };
  }
  let ho = null;
  function qg(e, t) {
    if (!yt)
      D.NODE_ENV !== "production" &&
        Z("provide() can only be used inside setup().");
    else {
      let r = yt.provides;
      const s = yt.parent && yt.parent.provides;
      s === r && (r = yt.provides = Object.create(s)), (r[e] = t);
    }
  }
  function go(e, t, r = !1) {
    const s = yt || ht;
    if (s || ho) {
      const n = s
        ? s.parent == null
          ? s.vnode.appContext && s.vnode.appContext.provides
          : s.parent.provides
        : ho._context.provides;
      if (n && e in n) return n[e];
      if (arguments.length > 1) return r && ye(t) ? t.call(s && s.proxy) : t;
      D.NODE_ENV !== "production" && Z(`injection "${String(e)}" not found.`);
    } else
      D.NODE_ENV !== "production" &&
        Z("inject() can only be used inside setup() or functional components.");
  }
  const Yg = {},
    Jg = () => Object.create(Yg),
    Xg = e => Object.getPrototypeOf(e) === Yg;
  function nb(e, t, r, s = !1) {
    const n = {},
      o = Jg();
    (e.propsDefaults = /* @__PURE__ */ Object.create(null)), Zg(e, t, n, o);
    for (const i in e.propsOptions[0]) i in n || (n[i] = void 0);
    D.NODE_ENV !== "production" && em(t || {}, n, e),
      r
        ? (e.props = s ? n : Z_(n))
        : e.type.props
          ? (e.props = n)
          : (e.props = o),
      (e.attrs = o);
  }
  function sb(e) {
    for (; e; ) {
      if (e.type.__hmrId) return !0;
      e = e.parent;
    }
  }
  function ob(e, t, r, s) {
    const {
        props: n,
        attrs: o,
        vnode: { patchFlag: i },
      } = e,
      a = Te(n),
      [l] = e.propsOptions;
    let c = !1;
    if (
      // always force full diff in dev
      // - #1942 if hmr is enabled with sfc component
      // - vite#872 non-sfc component used by sfc component
      !(D.NODE_ENV !== "production" && sb(e)) &&
      (s || i > 0) &&
      !(i & 16)
    ) {
      if (i & 8) {
        const u = e.vnode.dynamicProps;
        for (let f = 0; f < u.length; f++) {
          let d = u[f];
          if (wa(e.emitsOptions, d)) continue;
          const p = t[d];
          if (l)
            if (Fe(o, d)) p !== o[d] && ((o[d] = p), (c = !0));
            else {
              const h = Ct(d);
              n[h] = Kl(l, a, h, p, e, !1);
            }
          else p !== o[d] && ((o[d] = p), (c = !0));
        }
      }
    } else {
      Zg(e, t, n, o) && (c = !0);
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
              (n[f] = Kl(l, a, f, void 0, e, !0))
            : delete n[f]);
      if (o !== a)
        for (const f in o) (!t || !Fe(t, f)) && (delete o[f], (c = !0));
    }
    c && wr(e.attrs, "set", ""),
      D.NODE_ENV !== "production" && em(t || {}, n, e);
  }
  function Zg(e, t, r, s) {
    const [n, o] = e.propsOptions;
    let i = !1,
      a;
    if (t)
      for (let l in t) {
        if (uo(l)) continue;
        const c = t[l];
        let u;
        n && Fe(n, (u = Ct(l)))
          ? !o || !o.includes(u)
            ? (r[u] = c)
            : ((a || (a = {}))[u] = c)
          : wa(e.emitsOptions, l) ||
            ((!(l in s) || c !== s[l]) && ((s[l] = c), (i = !0)));
      }
    if (o) {
      const l = Te(r),
        c = a || We;
      for (let u = 0; u < o.length; u++) {
        const f = o[u];
        r[f] = Kl(n, l, f, c[f], e, !Fe(c, f));
      }
    }
    return i;
  }
  function Kl(e, t, r, s, n, o) {
    const i = e[r];
    if (i != null) {
      const a = Fe(i, "default");
      if (a && s === void 0) {
        const l = i.default;
        if (i.type !== Function && !i.skipFactory && ye(l)) {
          const { propsDefaults: c } = n;
          if (r in c) s = c[r];
          else {
            const u = Vo(n);
            (s = c[r] = l.call(null, t)), u();
          }
        } else s = l;
      }
      i[0] &&
        /* shouldCast */
        (o && !a
          ? (s = !1)
          : i[1] &&
            /* shouldCastTrue */
            (s === "" || s === Vt(r)) &&
            (s = !0));
    }
    return s;
  }
  const ib = /* @__PURE__ */ new WeakMap();
  function Qg(e, t, r = !1) {
    const s = r ? ib : t.propsCache,
      n = s.get(e);
    if (n) return n;
    const o = e.props,
      i = {},
      a = [];
    let l = !1;
    if (!ye(e)) {
      const u = f => {
        l = !0;
        const [d, p] = Qg(f, t, !0);
        ft(i, d), p && a.push(...p);
      };
      !r && t.mixins.length && t.mixins.forEach(u),
        e.extends && u(e.extends),
        e.mixins && e.mixins.forEach(u);
    }
    if (!o && !l) return ze(e) && s.set(e, _s), _s;
    if (he(o))
      for (let u = 0; u < o.length; u++) {
        D.NODE_ENV !== "production" &&
          !st(o[u]) &&
          Z("props must be strings when using array syntax.", o[u]);
        const f = Ct(o[u]);
        Zf(f) && (i[f] = We);
      }
    else if (o) {
      D.NODE_ENV !== "production" && !ze(o) && Z("invalid props options", o);
      for (const u in o) {
        const f = Ct(u);
        if (Zf(f)) {
          const d = o[u],
            p = (i[f] = he(d) || ye(d) ? { type: d } : ft({}, d)),
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
    const c = [i, a];
    return ze(e) && s.set(e, c), c;
  }
  function Zf(e) {
    return e[0] !== "$" && !uo(e)
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
    const s = Te(t),
      n = r.propsOptions[0];
    for (const o in n) {
      let i = n[o];
      i != null &&
        lb(
          o,
          s[o],
          i,
          D.NODE_ENV !== "production" ? At(s) : s,
          !Fe(e, o) && !Fe(e, Vt(o))
        );
    }
  }
  function lb(e, t, r, s, n) {
    const { type: o, required: i, validator: a, skipCheck: l } = r;
    if (i && n) {
      Z('Missing required prop: "' + e + '"');
      return;
    }
    if (!(t == null && !i)) {
      if (o != null && o !== !0 && !l) {
        let c = !1;
        const u = he(o) ? o : [o],
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
        !a(t, s) &&
        Z('Invalid prop: custom validator check failed for prop "' + e + '".');
    }
  }
  const cb = /* @__PURE__ */ Ts("String,Number,Boolean,Function,Symbol,BigInt");
  function ub(e, t) {
    let r;
    const s = ab(t);
    if (cb(s)) {
      const n = typeof e;
      (r = n === s.toLowerCase()), !r && n === "object" && (r = e instanceof t);
    } else
      s === "Object"
        ? (r = ze(e))
        : s === "Array"
          ? (r = he(e))
          : s === "null"
            ? (r = e === null)
            : (r = e instanceof t);
    return {
      valid: r,
      expectedType: s,
    };
  }
  function fb(e, t, r) {
    if (r.length === 0)
      return `Prop type [] for prop "${e}" won't match anything. Did you mean to use type Array instead?`;
    let s = `Invalid prop: type check failed for prop "${e}". Expected ${r.map(Kn).join(" | ")}`;
    const n = r[0],
      o = Sc(t),
      i = Qf(t, n),
      a = Qf(t, o);
    return (
      r.length === 1 && ed(n) && !db(n, o) && (s += ` with value ${i}`),
      (s += `, got ${o} `),
      ed(o) && (s += `with value ${a}.`),
      s
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
    zc = e => (he(e) ? e.map(sr) : [sr(e)]),
    pb = (e, t, r) => {
      if (t._n) return t;
      const s = ie(
        (...n) => (
          D.NODE_ENV !== "production" &&
            yt &&
            (!r || r.root === yt.root) &&
            Z(
              `Slot "${e}" invoked outside of the render function: this will not track dependencies used in the slot. Invoke the slot function inside the render function instead.`
            ),
          zc(t(...n))
        ),
        r
      );
      return (s._c = !1), s;
    },
    rm = (e, t, r) => {
      const s = e._ctx;
      for (const n in e) {
        if (tm(n)) continue;
        const o = e[n];
        if (ye(o)) t[n] = pb(n, o, s);
        else if (o != null) {
          D.NODE_ENV !== "production" &&
            Z(
              `Non-function value encountered for slot "${n}". Prefer function slots for better performance.`
            );
          const i = zc(o);
          t[n] = () => i;
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
      for (const s in t) (r || s !== "_") && (e[s] = t[s]);
    },
    hb = (e, t, r) => {
      const s = (e.slots = Jg());
      if (e.vnode.shapeFlag & 32) {
        const n = t._;
        n ? (Gl(s, t, r), r && Vi(s, "_", n, !0)) : rm(t, s);
      } else t && nm(e, t);
    },
    gb = (e, t, r) => {
      const { vnode: s, slots: n } = e;
      let o = !0,
        i = We;
      if (s.shapeFlag & 32) {
        const a = t._;
        a
          ? D.NODE_ENV !== "production" && mn
            ? (Gl(n, t, r), wr(e, "set", "$slots"))
            : r && a === 1
              ? (o = !1)
              : Gl(n, t, r)
          : ((o = !t.$stable), rm(t, n)),
          (i = t);
      } else t && (nm(e, t), (i = { default: 1 }));
      if (o) for (const a in n) !tm(a) && i[a] == null && delete n[a];
    };
  function ql(e, t, r, s, n = !1) {
    if (he(e)) {
      e.forEach((d, p) => ql(d, t && (he(t) ? t[p] : t), r, s, n));
      return;
    }
    if (po(s) && !n) return;
    const o = s.shapeFlag & 4 ? Oa(s.component) : s.el,
      i = n ? null : o,
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
        (st(c)
          ? ((u[c] = null), Fe(f, c) && (f[c] = null))
          : $t(c) && (c.value = null)),
      ye(l))
    )
      Lr(l, a, 12, [i, u]);
    else {
      const d = st(l),
        p = $t(l);
      if (d || p) {
        const h = () => {
          if (e.f) {
            const m = d ? (Fe(f, l) ? f[l] : u[l]) : l.value;
            n
              ? he(m) && Ec(m, o)
              : he(m)
                ? m.includes(o) || m.push(o)
                : d
                  ? ((u[l] = [o]), Fe(f, l) && (f[l] = u[l]))
                  : ((l.value = [o]), e.k && (u[e.k] = l.value));
          } else
            d
              ? ((u[l] = i), Fe(f, l) && (f[l] = i))
              : p
                ? ((l.value = i), e.k && (u[e.k] = i))
                : D.NODE_ENV !== "production" &&
                  Z("Invalid template ref type:", l, `(${typeof l})`);
        };
        i ? ((h.id = -1), Ft(h, r)) : h();
      } else
        D.NODE_ENV !== "production" &&
          Z("Invalid template ref type:", l, `(${typeof l})`);
    }
  }
  const sm = Symbol("_vte"),
    mb = e => e.__isTeleport,
    Wn = e => e && (e.disabled || e.disabled === ""),
    td = e => typeof SVGElement < "u" && e instanceof SVGElement,
    rd = e => typeof MathMLElement == "function" && e instanceof MathMLElement,
    Yl = (e, t) => {
      const r = e && e.to;
      if (st(r))
        if (t) {
          const s = t(r);
          return (
            D.NODE_ENV !== "production" &&
              !s &&
              !Wn(e) &&
              Z(
                `Failed to locate Teleport target with selector "${r}". Note the target element must exist before the component is mounted - i.e. the target cannot be rendered by the component itself, and ideally should be outside of the entire Vue component tree.`
              ),
            s
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
      process(e, t, r, s, n, o, i, a, l, c) {
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
          p(I, r, s), p(A, r, s);
          const O = (t.target = Yl(t.props, h)),
            L = im(O, t, m, p);
          O
            ? i === "svg" || td(O)
              ? (i = "svg")
              : (i === "mathml" || rd(O)) && (i = "mathml")
            : D.NODE_ENV !== "production" &&
              !g &&
              Z("Invalid Teleport target on mount:", O, `(${typeof O})`);
          const z = (H, ne) => {
            _ & 16 && u(E, H, ne, n, o, i, a, l);
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
            (i === "svg" || td(A)
              ? (i = "svg")
              : (i === "mathml" || rd(A)) && (i = "mathml"),
            S
              ? (d(e.dynamicChildren, S, z, n, o, i, a), mo(e, t, !0))
              : l || f(e, t, z, H, n, o, i, a, !1),
            g)
          )
            L
              ? t.props &&
                e.props &&
                t.props.to !== e.props.to &&
                (t.props.to = e.props.to)
              : di(t, r, I, c, 1);
          else if ((t.props && t.props.to) !== (e.props && e.props.to)) {
            const ne = (t.target = Yl(t.props, h));
            ne
              ? di(t, ne, null, c, 0)
              : D.NODE_ENV !== "production" &&
                Z("Invalid Teleport target on update:", A, `(${typeof A})`);
          } else L && di(t, A, O, c, 1);
        }
        om(t);
      },
      remove(e, t, r, { um: s, o: { remove: n } }, o) {
        const {
          shapeFlag: i,
          children: a,
          anchor: l,
          targetStart: c,
          targetAnchor: u,
          target: f,
          props: d,
        } = e;
        if ((f && (n(c), n(u)), o && n(l), i & 16)) {
          const p = o || !Wn(d);
          for (let h = 0; h < a.length; h++) {
            const m = a[h];
            s(m, t, r, p, !!m.dynamicChildren);
          }
        }
      },
      move: di,
      hydrate: yb,
    };
  function di(e, t, r, { o: { insert: s }, m: n }, o = 2) {
    o === 0 && s(e.targetAnchor, t, r);
    const { el: i, anchor: a, shapeFlag: l, children: c, props: u } = e,
      f = o === 2;
    if ((f && s(i, t, r), (!f || Wn(u)) && l & 16))
      for (let d = 0; d < c.length; d++) n(c[d], t, r, 2);
    f && s(a, t, r);
  }
  function yb(
    e,
    t,
    r,
    s,
    n,
    o,
    {
      o: {
        nextSibling: i,
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
          (t.anchor = f(i(e), t, a(e), r, s, n, o)),
            (t.targetStart = p),
            (t.targetAnchor = p && i(p));
        else {
          t.anchor = i(e);
          let h = p;
          for (; h; ) {
            if (h && h.nodeType === 8) {
              if (h.data === "teleport start anchor") t.targetStart = h;
              else if (h.data === "teleport anchor") {
                (t.targetAnchor = h),
                  (d._lpa = t.targetAnchor && i(t.targetAnchor));
                break;
              }
            }
            h = i(h);
          }
          t.targetAnchor || im(d, t, u, c), f(p && i(p), t, d, r, s, n, o);
        }
      om(t);
    }
    return t.anchor && i(t.anchor);
  }
  const _b = vb;
  function om(e) {
    const t = e.ctx;
    if (t && t.ut) {
      let r = e.children[0].el;
      for (; r && r !== e.targetAnchor; )
        r.nodeType === 1 && r.setAttribute("data-v-owner", t.uid),
          (r = r.nextSibling);
      t.ut();
    }
  }
  function im(e, t, r, s) {
    const n = (t.targetStart = r("")),
      o = (t.targetAnchor = r(""));
    return (n[sm] = o), e && (s(n, e), s(o, e)), o;
  }
  let Js, dn;
  function Tr(e, t) {
    e.appContext.config.performance && Hi() && dn.mark(`vue-${t}-${e.uid}`),
      D.NODE_ENV !== "production" && N$(e, t, Hi() ? dn.now() : Date.now());
  }
  function xr(e, t) {
    if (e.appContext.config.performance && Hi()) {
      const r = `vue-${t}-${e.uid}`,
        s = r + ":end";
      dn.mark(s),
        dn.measure(`<${Sa(e, e.type)}> ${t}`, r, s),
        dn.clearMarks(r),
        dn.clearMarks(s);
    }
    D.NODE_ENV !== "production" && P$(e, t, Hi() ? dn.now() : Date.now());
  }
  function Hi() {
    return (
      Js !== void 0 ||
        (typeof window < "u" && window.performance
          ? ((Js = !0), (dn = window.performance))
          : (Js = !1)),
      Js
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
        insert: s,
        remove: n,
        patchProp: o,
        createElement: i,
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
        w && !Xs(w, T) && ((Y = F(w)), P(w, K, J, !0), (w = null)),
          T.patchFlag === -2 && ((X = !1), (T.dynamicChildren = null));
        const { type: W, ref: re, shapeFlag: ae } = T;
        switch (W) {
          case Lo:
            y(w, T, V, Y);
            break;
          case Rt:
            g(w, T, V, Y);
            break;
          case Ci:
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
                ? fe(w, T, V, Y, K, J, te, Q, X)
                : ae & 64 || ae & 128
                  ? W.process(w, T, V, Y, K, J, te, Q, X, we)
                  : D.NODE_ENV !== "production" &&
                    Z("Invalid VNode type:", W, `(${typeof W})`);
        }
        re != null && K && ql(re, w && w.ref, J, T || w, !T);
      },
      y = (w, T, V, Y) => {
        if (w == null) s((T.el = a(T.children)), V, Y);
        else {
          const K = (T.el = w.el);
          T.children !== w.children && c(K, T.children);
        }
      },
      g = (w, T, V, Y) => {
        w == null ? s((T.el = l(T.children || "")), V, Y) : (T.el = w.el);
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
        for (; w && w !== T; ) (K = d(w)), s(w, V, Y), (w = K);
        s(T, V, Y);
      },
      I = ({ el: w, anchor: T }) => {
        let V;
        for (; w && w !== T; ) (V = d(w)), n(w), (w = V);
        n(T);
      },
      A = (w, T, V, Y, K, J, te, Q, X) => {
        T.type === "svg" ? (te = "svg") : T.type === "math" && (te = "mathml"),
          w == null ? O(T, V, Y, K, J, te, Q, X) : H(w, T, K, J, te, Q, X);
      },
      O = (w, T, V, Y, K, J, te, Q) => {
        let X, W;
        const { props: re, shapeFlag: ae, transition: oe, dirs: $e } = w;
        if (
          ((X = w.el = i(w.type, J, re && re.is, re)),
          ae & 8
            ? u(X, w.children)
            : ae & 16 && z(w.children, X, null, Y, K, il(w, J), te, Q),
          $e && Tn(w, null, Y, "created"),
          L(X, w, w.scopeId, te, Y),
          re)
        ) {
          for (const Re in re)
            Re !== "value" && !uo(Re) && o(X, Re, null, re[Re], J, Y);
          "value" in re && o(X, "value", null, re.value, J),
            (W = re.onVnodeBeforeMount) && mr(W, Y, w);
        }
        D.NODE_ENV !== "production" &&
          (Vi(X, "__vnode", w, !0), Vi(X, "__vueParentComponent", Y, !0)),
          $e && Tn(w, null, Y, "beforeMount");
        const Ce = Eb(K, oe);
        Ce && oe.beforeEnter(X),
          s(X, T, V),
          ((W = re && re.onVnodeMounted) || Ce || $e) &&
            Ft(() => {
              W && mr(W, Y, w),
                Ce && oe.enter(X),
                $e && Tn(w, null, Y, "mounted");
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
          const re = (w[W] = Q ? fn(w[W]) : sr(w[W]));
          m(null, re, T, V, Y, K, J, te, Q);
        }
      },
      H = (w, T, V, Y, K, J, te) => {
        const Q = (T.el = w.el);
        D.NODE_ENV !== "production" && (Q.__vnode = T);
        let { patchFlag: X, dynamicChildren: W, dirs: re } = T;
        X |= w.patchFlag & 16;
        const ae = w.props || We,
          oe = T.props || We;
        let $e;
        if (
          (V && xn(V, !1),
          ($e = oe.onVnodeBeforeUpdate) && mr($e, V, T, w),
          re && Tn(T, w, V, "beforeUpdate"),
          V && xn(V, !0),
          D.NODE_ENV !== "production" && mn && ((X = 0), (te = !1), (W = null)),
          ((ae.innerHTML && oe.innerHTML == null) ||
            (ae.textContent && oe.textContent == null)) &&
            u(Q, ""),
          W
            ? (ne(w.dynamicChildren, W, Q, V, Y, il(T, K), J),
              D.NODE_ENV !== "production" && mo(w, T))
            : te || Ue(w, T, Q, null, V, Y, il(T, K), J, !1),
          X > 0)
        ) {
          if (X & 16) G(Q, ae, oe, V, K);
          else if (
            (X & 2 && ae.class !== oe.class && o(Q, "class", null, oe.class, K),
            X & 4 && o(Q, "style", ae.style, oe.style, K),
            X & 8)
          ) {
            const Ce = T.dynamicProps;
            for (let Re = 0; Re < Ce.length; Re++) {
              const Me = Ce[Re],
                it = ae[Me],
                jt = oe[Me];
              (jt !== it || Me === "value") && o(Q, Me, it, jt, K, V);
            }
          }
          X & 1 && w.children !== T.children && u(Q, T.children);
        } else !te && W == null && G(Q, ae, oe, V, K);
        (($e = oe.onVnodeUpdated) || re) &&
          Ft(() => {
            $e && mr($e, V, T, w), re && Tn(T, w, V, "updated");
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
                !Xs(X, W) || // - In the case of a component, it could contain anything.
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
            for (const J in T) !uo(J) && !(J in V) && o(w, J, T[J], null, K, Y);
          for (const J in V) {
            if (uo(J)) continue;
            const te = V[J],
              Q = T[J];
            te !== Q && J !== "value" && o(w, J, Q, te, K, Y);
          }
          "value" in V && o(w, "value", T.value, V.value, K);
        }
      },
      Ne = (w, T, V, Y, K, J, te, Q, X) => {
        const W = (T.el = w ? w.el : a("")),
          re = (T.anchor = w ? w.anchor : a(""));
        let { patchFlag: ae, dynamicChildren: oe, slotScopeIds: $e } = T;
        D.NODE_ENV !== "production" && // #5523 dev root fragment may inherit directives
          (mn || ae & 2048) &&
          ((ae = 0), (X = !1), (oe = null)),
          $e && (Q = Q ? Q.concat($e) : $e),
          w == null
            ? (s(W, V, Y),
              s(re, V, Y),
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
                oe && // #2715 the previous fragment could've been a BAILed one as a result
                // of renderSlot() with no valid children
                w.dynamicChildren
              ? (ne(w.dynamicChildren, oe, V, K, J, te, Q),
                D.NODE_ENV !== "production"
                  ? mo(w, T)
                  : // #2080 if the stable fragment has a key, it's a <template v-for> that may
                    //  get moved around. Make sure all root level vnodes inherit el.
                    // #2134 or if it's a component root, it may also get moved around
                    // as the component is being moved.
                    (T.key != null || (K && T === K.subTree)) &&
                    mo(
                      w,
                      T,
                      !0
                      /* shallow */
                    ))
              : Ue(w, T, V, re, K, J, te, Q, X);
      },
      fe = (w, T, V, Y, K, J, te, Q, X) => {
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
          D.NODE_ENV !== "production" && (Ai(w), Tr(Q, "mount")),
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
        D.NODE_ENV !== "production" && (Ni(), xr(Q, "mount"));
      },
      be = (w, T, V) => {
        const Y = (T.component = w.component);
        if (Db(w, T, V))
          if (Y.asyncDep && !Y.asyncResolved) {
            D.NODE_ENV !== "production" && Ai(T),
              ve(Y, T, V),
              D.NODE_ENV !== "production" && Ni();
            return;
          } else (Y.next = T), m$(Y.update), (Y.effect.dirty = !0), Y.update();
        else (T.el = w.el), (Y.vnode = T);
      },
      le = (w, T, V, Y, K, J, te) => {
        const Q = () => {
            if (w.isMounted) {
              let { next: re, bu: ae, u: oe, parent: $e, vnode: Ce } = w;
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
              D.NODE_ENV !== "production" && Ai(re || w.vnode),
                xn(w, !1),
                re ? ((re.el = Ce.el), ve(w, re, te)) : (re = Ce),
                ae && Ys(ae),
                (Me = re.props && re.props.onVnodeBeforeUpdate) &&
                  mr(Me, $e, re, Ce),
                xn(w, !0),
                D.NODE_ENV !== "production" && Tr(w, "render");
              const it = al(w);
              D.NODE_ENV !== "production" && xr(w, "render");
              const jt = w.subTree;
              (w.subTree = it),
                D.NODE_ENV !== "production" && Tr(w, "patch"),
                m(
                  jt,
                  it,
                  // parent may have changed if it's in a teleport
                  f(jt.el),
                  // anchor may have changed if it's in a fragment
                  F(jt),
                  w,
                  K,
                  J
                ),
                D.NODE_ENV !== "production" && xr(w, "patch"),
                (re.el = it.el),
                Re === null && Ib(w, it.el),
                oe && Ft(oe, K),
                (Me = re.props && re.props.onVnodeUpdated) &&
                  Ft(() => mr(Me, $e, re, Ce), K),
                D.NODE_ENV !== "production" && Rg(w),
                D.NODE_ENV !== "production" && Ni();
            } else {
              let re;
              const { el: ae, props: oe } = T,
                { bm: $e, m: Ce, parent: Re } = w,
                Me = po(T);
              if (
                (xn(w, !1),
                $e && Ys($e),
                !Me && (re = oe && oe.onVnodeBeforeMount) && mr(re, Re, T),
                xn(w, !0),
                ae && tt)
              ) {
                const it = () => {
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
                      () => !w.isUnmounted && it()
                    )
                  : it();
              } else {
                D.NODE_ENV !== "production" && Tr(w, "render");
                const it = (w.subTree = al(w));
                D.NODE_ENV !== "production" && xr(w, "render"),
                  D.NODE_ENV !== "production" && Tr(w, "patch"),
                  m(null, it, V, Y, w, K, J),
                  D.NODE_ENV !== "production" && xr(w, "patch"),
                  (T.el = it.el);
              }
              if ((Ce && Ft(Ce, K), !Me && (re = oe && oe.onVnodeMounted))) {
                const it = T;
                Ft(() => mr(re, Re, it), K);
              }
              (T.shapeFlag & 256 ||
                (Re && po(Re.vnode) && Re.vnode.shapeFlag & 256)) &&
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
            ((X.onTrack = w.rtc ? re => Ys(w.rtc, re) : void 0),
            (X.onTrigger = w.rtg ? re => Ys(w.rtg, re) : void 0)),
          W();
      },
      ve = (w, T, V) => {
        T.component = w;
        const Y = w.vnode.props;
        (w.vnode = T),
          (w.next = null),
          ob(w, T.props, Y, V),
          gb(w, T.children, V),
          Gr(),
          Kf(w),
          qr();
      },
      Ue = (w, T, V, Y, K, J, te, Q, X = !1) => {
        const W = w && w.children,
          re = w ? w.shapeFlag : 0,
          ae = T.children,
          { patchFlag: oe, shapeFlag: $e } = T;
        if (oe > 0) {
          if (oe & 128) {
            R(W, ae, V, Y, K, J, te, Q, X);
            return;
          } else if (oe & 256) {
            ee(W, ae, V, Y, K, J, te, Q, X);
            return;
          }
        }
        $e & 8
          ? (re & 16 && j(W, K, J), ae !== W && u(V, ae))
          : re & 16
            ? $e & 16
              ? R(W, ae, V, Y, K, J, te, Q, X)
              : j(W, K, J, !0)
            : (re & 8 && u(V, ""), $e & 16 && z(ae, V, Y, K, J, te, Q, X));
      },
      ee = (w, T, V, Y, K, J, te, Q, X) => {
        (w = w || _s), (T = T || _s);
        const W = w.length,
          re = T.length,
          ae = Math.min(W, re);
        let oe;
        for (oe = 0; oe < ae; oe++) {
          const $e = (T[oe] = X ? fn(T[oe]) : sr(T[oe]));
          m(w[oe], $e, V, null, K, J, te, Q, X);
        }
        W > re ? j(w, K, J, !0, !1, ae) : z(T, V, Y, K, J, te, Q, X, ae);
      },
      R = (w, T, V, Y, K, J, te, Q, X) => {
        let W = 0;
        const re = T.length;
        let ae = w.length - 1,
          oe = re - 1;
        for (; W <= ae && W <= oe; ) {
          const $e = w[W],
            Ce = (T[W] = X ? fn(T[W]) : sr(T[W]));
          if (Xs($e, Ce)) m($e, Ce, V, null, K, J, te, Q, X);
          else break;
          W++;
        }
        for (; W <= ae && W <= oe; ) {
          const $e = w[ae],
            Ce = (T[oe] = X ? fn(T[oe]) : sr(T[oe]));
          if (Xs($e, Ce)) m($e, Ce, V, null, K, J, te, Q, X);
          else break;
          ae--, oe--;
        }
        if (W > ae) {
          if (W <= oe) {
            const $e = oe + 1,
              Ce = $e < re ? T[$e].el : Y;
            for (; W <= oe; )
              m(null, (T[W] = X ? fn(T[W]) : sr(T[W])), V, Ce, K, J, te, Q, X),
                W++;
          }
        } else if (W > oe) for (; W <= ae; ) P(w[W], K, J, !0), W++;
        else {
          const $e = W,
            Ce = W,
            Re = /* @__PURE__ */ new Map();
          for (W = Ce; W <= oe; W++) {
            const Ke = (T[W] = X ? fn(T[W]) : sr(T[W]));
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
            it = 0;
          const jt = oe - Ce + 1;
          let qt = !1,
            Hs = 0;
          const Nn = new Array(jt);
          for (W = 0; W < jt; W++) Nn[W] = 0;
          for (W = $e; W <= ae; W++) {
            const Ke = w[W];
            if (it >= jt) {
              P(Ke, K, J, !0);
              continue;
            }
            let Yt;
            if (Ke.key != null) Yt = Re.get(Ke.key);
            else
              for (Me = Ce; Me <= oe; Me++)
                if (Nn[Me - Ce] === 0 && Xs(Ke, T[Me])) {
                  Yt = Me;
                  break;
                }
            Yt === void 0
              ? P(Ke, K, J, !0)
              : ((Nn[Yt - Ce] = W + 1),
                Yt >= Hs ? (Hs = Yt) : (qt = !0),
                m(Ke, T[Yt], V, null, K, J, te, Q, X),
                it++);
          }
          const Ks = qt ? Ob(Nn) : _s;
          for (Me = Ks.length - 1, W = jt - 1; W >= 0; W--) {
            const Ke = Ce + W,
              Yt = T[Ke],
              ni = Ke + 1 < re ? T[Ke + 1].el : Y;
            Nn[W] === 0
              ? m(null, Yt, V, ni, K, J, te, Q, X)
              : qt && (Me < 0 || W !== Ks[Me] ? M(Yt, V, ni, 2) : Me--);
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
          s(J, T, V);
          for (let ae = 0; ae < X.length; ae++) M(X[ae], T, V, Y);
          s(w.anchor, T, V);
          return;
        }
        if (te === Ci) {
          S(w, T, V);
          return;
        }
        if (Y !== 2 && W & 1 && Q)
          if (Y === 0) Q.beforeEnter(J), s(J, T, V), Ft(() => Q.enter(J), K);
          else {
            const { leave: ae, delayLeave: oe, afterLeave: $e } = Q,
              Ce = () => s(J, T, V),
              Re = () => {
                ae(J, () => {
                  Ce(), $e && $e();
                });
              };
            oe ? oe(J, Ce, Re) : Re();
          }
        else s(J, T, V);
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
          dirs: oe,
          cacheIndex: $e,
        } = w;
        if (
          (ae === -2 && (K = !1),
          Q != null && ql(Q, null, V, w, !0),
          $e != null && (T.renderCache[$e] = void 0),
          re & 256)
        ) {
          T.ctx.deactivate(w);
          return;
        }
        const Ce = re & 1 && oe,
          Re = !po(w);
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
                te.type === Rt ? n(te.el) : v(te);
              })
            : $(V, Y);
          return;
        }
        if (T === Ci) {
          I(w);
          return;
        }
        const J = () => {
          n(V), K && !K.persisted && K.afterLeave && K.afterLeave();
        };
        if (w.shapeFlag & 1 && K && !K.persisted) {
          const { leave: te, delayLeave: Q } = K,
            X = () => te(V, J);
          Q ? Q(w.el, J, X) : X();
        } else J();
      },
      $ = (w, T) => {
        let V;
        for (; w !== T; ) (V = d(w)), n(w), (w = V);
        n(T);
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
          Y && Ys(Y),
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
          V = T && T[sm];
        return V ? d(V) : T;
      };
    let q = !1;
    const se = (w, T, V) => {
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
      render: se,
      hydrate: Ie,
      createApp: rb(se, Ie),
    };
  }
  function il({ type: e, props: t }, r) {
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
  function mo(e, t, r = !1) {
    const s = e.children,
      n = t.children;
    if (he(s) && he(n))
      for (let o = 0; o < s.length; o++) {
        const i = s[o];
        let a = n[o];
        a.shapeFlag & 1 &&
          !a.dynamicChildren &&
          ((a.patchFlag <= 0 || a.patchFlag === 32) &&
            ((a = n[o] = fn(n[o])), (a.el = i.el)),
          !r && a.patchFlag !== -2 && mo(i, a)),
          a.type === Lo && (a.el = i.el),
          D.NODE_ENV !== "production" &&
            a.type === Rt &&
            !a.el &&
            (a.el = i.el);
      }
  }
  function Ob(e) {
    const t = e.slice(),
      r = [0];
    let s, n, o, i, a;
    const l = e.length;
    for (s = 0; s < l; s++) {
      const c = e[s];
      if (c !== 0) {
        if (((n = r[r.length - 1]), e[n] < c)) {
          (t[s] = n), r.push(s);
          continue;
        }
        for (o = 0, i = r.length - 1; o < i; )
          (a = (o + i) >> 1), e[r[a]] < c ? (o = a + 1) : (i = a);
        c < e[r[o]] && (o > 0 && (t[s] = r[o - 1]), (r[o] = s));
      }
    }
    for (o = r.length, i = r[o - 1]; o-- > 0; ) (r[o] = i), (i = t[i]);
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
        const e = go(Sb);
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
  const pi = {};
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
    { immediate: r, deep: s, flush: n, once: o, onTrack: i, onTrigger: a } = We
  ) {
    if (t && o) {
      const O = t;
      t = (...L) => {
        O(...L), A();
      };
    }
    D.NODE_ENV !== "production" &&
      s !== void 0 &&
      typeof s == "number" &&
      Z(
        'watch() "deep" option with number value will be used as watch depth in future versions. Please use a boolean instead to avoid potential breakage.'
      ),
      D.NODE_ENV !== "production" &&
        !t &&
        (r !== void 0 &&
          Z(
            'watch() "immediate" option is only respected when using the watch(source, callback, options?) signature.'
          ),
        s !== void 0 &&
          Z(
            'watch() "deep" option is only respected when using the watch(source, callback, options?) signature.'
          ),
        o !== void 0 &&
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
        s === !0
          ? O
          : // for deep: false, only traverse root-level properties
            pn(O, s === !1 ? 1 : void 0);
    let f,
      d = !1,
      p = !1;
    if (
      ($t(e)
        ? ((f = () => e.value), (d = Fr(e)))
        : $s(e)
          ? ((f = () => u(e)), (d = !0))
          : he(e)
            ? ((p = !0),
              (d = e.some(O => $s(O) || Fr(O))),
              (f = () =>
                e.map(O => {
                  if ($t(O)) return O.value;
                  if ($s(O)) return u(O);
                  if (ye(O)) return Lr(O, c, 2);
                  D.NODE_ENV !== "production" && l(O);
                })))
            : ye(e)
              ? t
                ? (f = () => Lr(e, c, 2))
                : (f = () => (h && h(), ir(e, c, 3, [m])))
              : ((f = ut), D.NODE_ENV !== "production" && l(e)),
      t && s)
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
        t ? r && ir(t, c, 3, [f(), p ? [] : void 0, m]) : f(),
        n === "sync")
      ) {
        const O = Ab();
        y = O.__watcherHandles || (O.__watcherHandles = []);
      } else return ut;
    let g = p ? new Array(e.length).fill(pi) : pi;
    const _ = () => {
      if (!(!S.active || !S.dirty))
        if (t) {
          const O = S.run();
          (s || d || (p ? O.some((L, z) => yn(L, g[z])) : yn(O, g))) &&
            (h && h(),
            ir(t, c, 3, [
              O,
              // pass undefined as the old value when it's changed for the first time
              g === pi ? void 0 : p && g[0] === pi ? [] : g,
              m,
            ]),
            (g = O));
        } else S.run();
    };
    _.allowRecurse = !!t;
    let E;
    n === "sync"
      ? (E = _)
      : n === "post"
        ? (E = () => Ft(_, c && c.suspense))
        : ((_.pre = !0), c && (_.id = c.uid), (E = () => $a(_)));
    const S = new Cc(f, ut, E),
      I = Pc(),
      A = () => {
        S.stop(), I && Ec(I.effects, S);
      };
    return (
      D.NODE_ENV !== "production" && ((S.onTrack = i), (S.onTrigger = a)),
      t
        ? r
          ? _()
          : (g = S.run())
        : n === "post"
          ? Ft(S.run.bind(S), c && c.suspense)
          : S.run(),
      y && y.push(A),
      A
    );
  }
  function Nb(e, t, r) {
    const s = this.proxy,
      n = st(e) ? (e.includes(".") ? lm(s, e) : () => s[e]) : e.bind(s, s);
    let o;
    ye(t) ? (o = t) : ((o = t.handler), (r = t));
    const i = Vo(this),
      a = Uc(n, o.bind(s), r);
    return i(), a;
  }
  function lm(e, t) {
    const r = t.split(".");
    return () => {
      let s = e;
      for (let n = 0; n < r.length && s; n++) s = s[r[n]];
      return s;
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
    else if (he(e)) for (let s = 0; s < e.length; s++) pn(e[s], t, r);
    else if (Zh(e) || Vn(e))
      e.forEach(s => {
        pn(s, t, r);
      });
    else if (eg(e)) {
      for (const s in e) pn(e[s], t, r);
      for (const s of Object.getOwnPropertySymbols(e))
        Object.prototype.propertyIsEnumerable.call(e, s) && pn(e[s], t, r);
    }
    return e;
  }
  const Pb = (e, t) =>
    t === "modelValue" || t === "model-value"
      ? e.modelModifiers
      : e[`${t}Modifiers`] || e[`${Ct(t)}Modifiers`] || e[`${Vt(t)}Modifiers`];
  function Cb(e, t, ...r) {
    if (e.isUnmounted) return;
    const s = e.vnode.props || We;
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
    let n = r;
    const o = t.startsWith("update:"),
      i = o && Pb(s, t.slice(7));
    if (
      (i &&
        (i.trim && (n = r.map(u => (st(u) ? u.trim() : u))),
        i.number && (n = r.map(O_))),
      D.NODE_ENV !== "production" && C$(e, t, n),
      D.NODE_ENV !== "production")
    ) {
      const u = t.toLowerCase();
      u !== t &&
        s[Ir(u)] &&
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
        s[(a = Ir(t))] || // also try camelCase event handler (#2249)
        s[(a = Ir(Ct(t)))];
    !l && o && (l = s[(a = Ir(Vt(t)))]), l && ir(l, e, 6, n);
    const c = s[a + "Once"];
    if (c) {
      if (!e.emitted) e.emitted = {};
      else if (e.emitted[a]) return;
      (e.emitted[a] = !0), ir(c, e, 6, n);
    }
  }
  function cm(e, t, r = !1) {
    const s = t.emitsCache,
      n = s.get(e);
    if (n !== void 0) return n;
    const o = e.emits;
    let i = {},
      a = !1;
    if (!ye(e)) {
      const l = c => {
        const u = cm(c, t, !0);
        u && ((a = !0), ft(i, u));
      };
      !r && t.mixins.length && t.mixins.forEach(l),
        e.extends && l(e.extends),
        e.mixins && e.mixins.forEach(l);
    }
    return !o && !a
      ? (ze(e) && s.set(e, null), null)
      : (he(o) ? o.forEach(l => (i[l] = null)) : ft(i, o),
        ze(e) && s.set(e, i),
        i);
  }
  function wa(e, t) {
    return !e || !Io(t)
      ? !1
      : ((t = t.slice(2).replace(/Once$/, "")),
        Fe(e, t[0].toLowerCase() + t.slice(1)) || Fe(e, Vt(t)) || Fe(e, t));
  }
  let Jl = !1;
  function Ki() {
    Jl = !0;
  }
  function al(e) {
    const {
        type: t,
        vnode: r,
        proxy: s,
        withProxy: n,
        propsOptions: [o],
        slots: i,
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
      y = Ui(e);
    let g, _;
    D.NODE_ENV !== "production" && (Jl = !1);
    try {
      if (r.shapeFlag & 4) {
        const I = n || s,
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
        (g = sr(
          c.call(A, I, u, D.NODE_ENV !== "production" ? At(f) : f, p, d, h)
        )),
          (_ = a);
      } else {
        const I = t;
        D.NODE_ENV !== "production" && a === f && Ki(),
          (g = sr(
            I.length > 1
              ? I(
                  D.NODE_ENV !== "production" ? At(f) : f,
                  D.NODE_ENV !== "production"
                    ? {
                        get attrs() {
                          return Ki(), At(a);
                        },
                        slots: i,
                        emit: l,
                      }
                    : { attrs: a, slots: i, emit: l }
                )
              : I(D.NODE_ENV !== "production" ? At(f) : f, null)
          )),
          (_ = t.props ? a : Tb(a));
      }
    } catch (I) {
      (vo.length = 0), Mo(I, e, 1), (g = Ve(Rt));
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
        if (A & 7) o && I.some(Li) && (_ = xb(_, o)), (E = Wr(E, _, !1, !0));
        else if (D.NODE_ENV !== "production" && !Jl && E.type !== Rt) {
          const O = Object.keys(a),
            L = [],
            z = [];
          for (let H = 0, ne = O.length; H < ne; H++) {
            const G = O[H];
            Io(G)
              ? Li(G) || L.push(G[2].toLowerCase() + G.slice(3))
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
          !sd(E) &&
          Z(
            "Runtime directive used on component with non-element root node. The directives will not function as intended."
          ),
        (E = Wr(E, null, !1, !0)),
        (E.dirs = E.dirs ? E.dirs.concat(r.dirs) : r.dirs)),
      r.transition &&
        (D.NODE_ENV !== "production" &&
          !sd(E) &&
          Z(
            "Component inside <Transition> renders non-element root node that cannot be animated."
          ),
        (E.transition = r.transition)),
      D.NODE_ENV !== "production" && S ? S(E) : (g = E),
      Ui(y),
      g
    );
  }
  const um = e => {
    const t = e.children,
      r = e.dynamicChildren,
      s = Wc(t, !1);
    if (s) {
      if (D.NODE_ENV !== "production" && s.patchFlag > 0 && s.patchFlag & 2048)
        return um(s);
    } else return [e, void 0];
    const n = t.indexOf(s),
      o = r ? r.indexOf(s) : -1,
      i = a => {
        (t[n] = a),
          r &&
            (o > -1
              ? (r[o] = a)
              : a.patchFlag > 0 && (e.dynamicChildren = [...r, a]));
      };
    return [sr(s), i];
  };
  function Wc(e, t = !0) {
    let r;
    for (let s = 0; s < e.length; s++) {
      const n = e[s];
      if (Os(n)) {
        if (n.type !== Rt || n.children === "v-if") {
          if (r) return;
          if (
            ((r = n),
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
        (r === "class" || r === "style" || Io(r)) &&
          ((t || (t = {}))[r] = e[r]);
      return t;
    },
    xb = (e, t) => {
      const r = {};
      for (const s in e) (!Li(s) || !(s.slice(9) in t)) && (r[s] = e[s]);
      return r;
    },
    sd = e => e.shapeFlag & 7 || e.type === Rt;
  function Db(e, t, r) {
    const { props: s, children: n, component: o } = e,
      { props: i, children: a, patchFlag: l } = t,
      c = o.emitsOptions;
    if (
      (D.NODE_ENV !== "production" && (n || a) && mn) ||
      t.dirs ||
      t.transition
    )
      return !0;
    if (r && l >= 0) {
      if (l & 1024) return !0;
      if (l & 16) return s ? od(s, i, c) : !!i;
      if (l & 8) {
        const u = t.dynamicProps;
        for (let f = 0; f < u.length; f++) {
          const d = u[f];
          if (i[d] !== s[d] && !wa(c, d)) return !0;
        }
      }
    } else
      return (n || a) && (!a || !a.$stable)
        ? !0
        : s === i
          ? !1
          : s
            ? i
              ? od(s, i, c)
              : !0
            : !!i;
    return !1;
  }
  function od(e, t, r) {
    const s = Object.keys(t);
    if (s.length !== Object.keys(e).length) return !0;
    for (let n = 0; n < s.length; n++) {
      const o = s[n];
      if (t[o] !== e[o] && !wa(r, o)) return !0;
    }
    return !1;
  }
  function Ib({ vnode: e, parent: t }, r) {
    for (; t; ) {
      const s = t.subTree;
      if (
        (s.suspense && s.suspense.activeBranch === e && (s.el = e.el), s === e)
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
    Lo = Symbol.for("v-txt"),
    Rt = Symbol.for("v-cmt"),
    Ci = Symbol.for("v-stc"),
    vo = [];
  let Ht = null;
  function ue(e = !1) {
    vo.push((Ht = e ? null : []));
  }
  function jb() {
    vo.pop(), (Ht = vo[vo.length - 1] || null);
  }
  let Po = 1;
  function id(e) {
    (Po += e), e < 0 && Ht && (Ht.hasOnce = !0);
  }
  function fm(e) {
    return (
      (e.dynamicChildren = Po > 0 ? Ht || _s : null),
      jb(),
      Po > 0 && Ht && Ht.push(e),
      e
    );
  }
  function Sn(e, t, r, s, n, o) {
    return fm(ar(e, t, r, s, n, o, !0));
  }
  function _e(e, t, r, s, n) {
    return fm(Ve(e, t, r, s, n, !0));
  }
  function Os(e) {
    return e ? e.__v_isVNode === !0 : !1;
  }
  function Xs(e, t) {
    if (D.NODE_ENV !== "production" && t.shapeFlag & 6 && e.component) {
      const r = Pi.get(t.type);
      if (r && r.has(e.component))
        return (e.shapeFlag &= -257), (t.shapeFlag &= -513), !1;
    }
    return e.type === t.type && e.key === t.key;
  }
  const Fb = (...e) => pm(...e),
    dm = ({ key: e }) => e ?? null,
    Ti = ({ ref: e, ref_key: t, ref_for: r }) => (
      typeof e == "number" && (e = "" + e),
      e != null
        ? st(e) || $t(e) || ye(e)
          ? { i: ht, r: e, k: t, f: !!r }
          : e
        : null
    );
  function ar(
    e,
    t = null,
    r = null,
    s = 0,
    n = null,
    o = e === Nt ? 0 : 1,
    i = !1,
    a = !1
  ) {
    const l = {
      __v_isVNode: !0,
      __v_skip: !0,
      type: e,
      props: t,
      key: t && dm(t),
      ref: t && Ti(t),
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
      shapeFlag: o,
      patchFlag: s,
      dynamicProps: n,
      dynamicChildren: null,
      appContext: null,
      ctx: ht,
    };
    return (
      a
        ? (Hc(l, r), o & 128 && e.normalize(l))
        : r && (l.shapeFlag |= st(r) ? 8 : 16),
      D.NODE_ENV !== "production" &&
        l.key !== l.key &&
        Z("VNode created with invalid key (NaN). VNode type:", l.type),
      Po > 0 && // avoid a block node from tracking itself
        !i && // has current parent block
        Ht && // presence of a patch flag indicates this node needs patching on updates.
        // component nodes also should always be patched, because even if the
        // component doesn't need to update, it needs to persist the instance on to
        // the next vnode so that it can be properly unmounted later.
        (l.patchFlag > 0 || o & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
        // vnode should not be considered dynamic due to handler caching.
        l.patchFlag !== 32 &&
        Ht.push(l),
      l
    );
  }
  const Ve = D.NODE_ENV !== "production" ? Fb : pm;
  function pm(e, t = null, r = null, s = 0, n = null, o = !1) {
    if (
      ((!e || e === zg) &&
        (D.NODE_ENV !== "production" &&
          !e &&
          Z(`Invalid vnode type when creating vnode: ${e}.`),
        (e = Rt)),
      Os(e))
    ) {
      const a = Wr(
        e,
        t,
        !0
        /* mergeRef: true */
      );
      return (
        r && Hc(a, r),
        Po > 0 &&
          !o &&
          Ht &&
          (a.shapeFlag & 6 ? (Ht[Ht.indexOf(e)] = a) : Ht.push(a)),
        (a.patchFlag = -2),
        a
      );
    }
    if ((ym(e) && (e = e.__vccOpts), t)) {
      t = es(t);
      let { class: a, style: l } = t;
      a && !st(a) && (t.class = ot(a)),
        ze(l) && (Bi(l) && !he(l) && (l = ft({}, l)), (t.style = Qn(l)));
    }
    const i = st(e) ? 1 : Rb(e) ? 128 : mb(e) ? 64 : ze(e) ? 4 : ye(e) ? 2 : 0;
    return (
      D.NODE_ENV !== "production" &&
        i & 4 &&
        Bi(e) &&
        ((e = Te(e)),
        Z(
          "Vue received a Component that was made a reactive object. This can lead to unnecessary performance overhead and should be avoided by marking the component with `markRaw` or using `shallowRef` instead of `ref`.",
          `
Component that was made reactive: `,
          e
        )),
      ar(e, t, r, s, n, i, o, !0)
    );
  }
  function es(e) {
    return e ? (Bi(e) || Xg(e) ? ft({}, e) : e) : null;
  }
  function Wr(e, t, r = !1, s = !1) {
    const { props: n, ref: o, patchFlag: i, children: a, transition: l } = e,
      c = t ? gt(n || {}, t) : n,
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
              r && o
              ? he(o)
                ? o.concat(Ti(t))
                : [o, Ti(t)]
              : Ti(t)
            : o,
        scopeId: e.scopeId,
        slotScopeIds: e.slotScopeIds,
        children:
          D.NODE_ENV !== "production" && i === -1 && he(a) ? a.map(hm) : a,
        target: e.target,
        targetStart: e.targetStart,
        targetAnchor: e.targetAnchor,
        staticCount: e.staticCount,
        shapeFlag: e.shapeFlag,
        // if the vnode is cloned with extra props, we can no longer assume its
        // existing patch flag to be reliable and need to add the FULL_PROPS flag.
        // note: preserve flag for fragments since they use the flag for children
        // fast paths only.
        patchFlag: t && e.type !== Nt ? (i === -1 ? 16 : i | 16) : i,
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
    return l && s && Lg(u, l.clone(u)), u;
  }
  function hm(e) {
    const t = Wr(e);
    return he(e.children) && (t.children = e.children.map(hm)), t;
  }
  function Ss(e = " ", t = 0) {
    return Ve(Lo, null, e, t);
  }
  function $r(e = "", t = !1) {
    return t ? (ue(), _e(Rt, null, e)) : Ve(Rt, null, e);
  }
  function sr(e) {
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
          : Ve(Lo, null, String(e));
  }
  function fn(e) {
    return (e.el === null && e.patchFlag !== -1) || e.memo ? e : Wr(e);
  }
  function Hc(e, t) {
    let r = 0;
    const { shapeFlag: s } = e;
    if (t == null) t = null;
    else if (he(t)) r = 16;
    else if (typeof t == "object")
      if (s & 65) {
        const n = t.default;
        n && (n._c && (n._d = !1), Hc(e, n()), n._c && (n._d = !0));
        return;
      } else {
        r = 32;
        const n = t._;
        !n && !Xg(t)
          ? (t._ctx = ht)
          : n === 3 &&
            ht &&
            (ht.slots._ === 1 ? (t._ = 1) : ((t._ = 2), (e.patchFlag |= 1024)));
      }
    else
      ye(t)
        ? ((t = { default: t, _ctx: ht }), (r = 32))
        : ((t = String(t)), s & 64 ? ((r = 16), (t = [Ss(t)])) : (r = 8));
    (e.children = t), (e.shapeFlag |= r);
  }
  function gt(...e) {
    const t = {};
    for (let r = 0; r < e.length; r++) {
      const s = e[r];
      for (const n in s)
        if (n === "class")
          t.class !== s.class && (t.class = ot([t.class, s.class]));
        else if (n === "style") t.style = Qn([t.style, s.style]);
        else if (Io(n)) {
          const o = t[n],
            i = s[n];
          i &&
            o !== i &&
            !(he(o) && o.includes(i)) &&
            (t[n] = o ? [].concat(o, i) : i);
        } else n !== "" && (t[n] = s[n]);
    }
    return t;
  }
  function mr(e, t, r, s = null) {
    ir(e, t, 7, [r, s]);
  }
  const Lb = Gg();
  let Vb = 0;
  function kb(e, t, r) {
    const s = e.type,
      n = (t ? t.appContext : e.appContext) || Lb,
      o = {
        uid: Vb++,
        vnode: e,
        type: s,
        parent: t,
        appContext: n,
        root: null,
        // to be immediately set
        next: null,
        subTree: null,
        // will be set synchronously right after creation
        effect: null,
        update: null,
        // will be set synchronously right after creation
        scope: new sg(
          !0
          /* detached */
        ),
        render: null,
        proxy: null,
        exposed: null,
        exposeProxy: null,
        withProxy: null,
        provides: t ? t.provides : Object.create(n.provides),
        accessCache: null,
        renderCache: [],
        // local resolved assets
        components: null,
        directives: null,
        // resolved props and emits options
        propsOptions: Qg(s, n),
        emitsOptions: cm(s, n),
        // emit
        emit: null,
        // to be set immediately
        emitted: null,
        // props default value
        propsDefaults: We,
        // inheritAttrs
        inheritAttrs: s.inheritAttrs,
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
      D.NODE_ENV !== "production" ? (o.ctx = U$(o)) : (o.ctx = { _: o }),
      (o.root = t ? t.root : o),
      (o.emit = Cb.bind(null, o)),
      e.ce && e.ce(o),
      o
    );
  }
  let yt = null;
  const Xr = () => yt || ht;
  let Gi, Xl;
  {
    const e = Nc(),
      t = (r, s) => {
        let n;
        return (
          (n = e[r]) || (n = e[r] = []),
          n.push(s),
          o => {
            n.length > 1 ? n.forEach(i => i(o)) : n[0](o);
          }
        );
      };
    (Gi = t("__VUE_INSTANCE_SETTERS__", r => (yt = r))),
      (Xl = t("__VUE_SSR_SETTERS__", r => (Ea = r)));
  }
  const Vo = e => {
      const t = yt;
      return (
        Gi(e),
        e.scope.on(),
        () => {
          e.scope.off(), Gi(t);
        }
      );
    },
    ad = () => {
      yt && yt.scope.off(), Gi(null);
    },
    Bb = /* @__PURE__ */ Ts("slot,component");
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
    const { props: s, children: n } = e.vnode,
      o = gm(e);
    nb(e, s, o, t), hb(e, n, r);
    const i = o ? Ub(e, t) : void 0;
    return t && Xl(!1), i;
  }
  function Ub(e, t) {
    var r;
    const s = e.type;
    if (D.NODE_ENV !== "production") {
      if ((s.name && Zl(s.name, e.appContext.config), s.components)) {
        const o = Object.keys(s.components);
        for (let i = 0; i < o.length; i++) Zl(o[i], e.appContext.config);
      }
      if (s.directives) {
        const o = Object.keys(s.directives);
        for (let i = 0; i < o.length; i++) Fg(o[i]);
      }
      s.compilerOptions &&
        Wb() &&
        Z(
          '"compilerOptions" is only supported when using a build of Vue that includes the runtime compiler. Since you are using a runtime-only build, the options should be passed via your build tool config instead.'
        );
    }
    (e.accessCache = /* @__PURE__ */ Object.create(null)),
      (e.proxy = new Proxy(e.ctx, Hg)),
      D.NODE_ENV !== "production" && W$(e);
    const { setup: n } = s;
    if (n) {
      const o = (e.setupContext = n.length > 1 ? vm(e) : null),
        i = Vo(e);
      Gr();
      const a = Lr(n, e, 0, [
        D.NODE_ENV !== "production" ? At(e.props) : e.props,
        o,
      ]);
      if ((qr(), i(), Oc(a))) {
        if ((a.then(ad, ad), t))
          return a
            .then(l => {
              ld(e, l, t);
            })
            .catch(l => {
              Mo(l, e, 0);
            });
        if (((e.asyncDep = a), D.NODE_ENV !== "production" && !e.suspense)) {
          const l = (r = s.name) != null ? r : "Anonymous";
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
            Os(t) &&
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
    const s = e.type;
    if (!e.render) {
      if (!t && Ql && !s.render) {
        const n = s.template || Bc(e).template;
        if (n) {
          D.NODE_ENV !== "production" && Tr(e, "compile");
          const { isCustomElement: o, compilerOptions: i } =
              e.appContext.config,
            { delimiters: a, compilerOptions: l } = s,
            c = ft(
              ft(
                {
                  isCustomElement: o,
                  delimiters: a,
                },
                i
              ),
              l
            );
          (s.render = Ql(n, c)),
            D.NODE_ENV !== "production" && xr(e, "compile");
        }
      }
      e.render = s.render || ut;
    }
    {
      const n = Vo(e);
      Gr();
      try {
        J$(e);
      } finally {
        qr(), n();
      }
    }
    D.NODE_ENV !== "production" &&
      !s.render &&
      e.render === ut &&
      !t &&
      (s.template
        ? Z(
            'Component provided template option but runtime compilation is not supported in this build of Vue. Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".'
          )
        : Z("Component is missing template or render function: ", s));
  }
  const cd =
    D.NODE_ENV !== "production"
      ? {
          get(e, t) {
            return Ki(), Et(e, "get", ""), e[t];
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
        let s = typeof r;
        s === "object" && (he(r) ? (s = "array") : $t(r) && (s = "ref")),
          s !== "object" &&
            Z(`expose() should be passed a plain object, received ${s}.`);
      }
      e.exposed = r || {};
    };
    if (D.NODE_ENV !== "production") {
      let r, s;
      return Object.freeze({
        get attrs() {
          return r || (r = new Proxy(e.attrs, cd));
        },
        get slots() {
          return s || (s = Hb(e));
        },
        get emit() {
          return (n, ...o) => e.emit(n, ...o);
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
    let s = Kc(t);
    if (!s && t.__file) {
      const n = t.__file.match(/([^/\\]+)\.\w+$/);
      n && (s = n[1]);
    }
    if (!s && e && e.parent) {
      const n = o => {
        for (const i in o) if (o[i] === t) return i;
      };
      s =
        n(e.components || e.parent.type.components) ||
        n(e.appContext.components);
    }
    return s ? Gb(s) : r ? "App" : "Anonymous";
  }
  function ym(e) {
    return ye(e) && "__vccOpts" in e;
  }
  const Se = (e, t) => {
    const r = t$(e, t, Ea);
    if (D.NODE_ENV !== "production") {
      const s = Xr();
      s && s.appContext.config.warnRecursiveComputed && (r._warnRecursive = !0);
    }
    return r;
  };
  function xi(e, t, r) {
    const s = arguments.length;
    return s === 2
      ? ze(t) && !he(t)
        ? Os(t)
          ? Ve(e, null, [t])
          : Ve(e, t)
        : Ve(e, null, t)
      : (s > 3
          ? (r = Array.prototype.slice.call(arguments, 2))
          : s === 3 && Os(r) && (r = [r]),
        Ve(e, t, r));
  }
  function qb() {
    if (D.NODE_ENV === "production" || typeof window > "u") return;
    const e = { style: "color:#3ba776" },
      t = { style: "color:#1677ff" },
      r = { style: "color:#f5222d" },
      s = { style: "color:#eb2f96" },
      n = {
        __vue_custom_formatter: !0,
        header(f) {
          return ze(f)
            ? f.__isVue
              ? ["div", e, "VueInstance"]
              : $t(f)
                ? ["div", {}, ["span", e, u(f)], "<", a(f.value), ">"]
                : $s(f)
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
          if (f && f.__isVue) return ["div", {}, ...o(f.$)];
        },
      };
    function o(f) {
      const d = [];
      f.type.props && f.props && d.push(i("props", Te(f.props))),
        f.setupState !== We && d.push(i("setup", f.setupState)),
        f.data !== We && d.push(i("data", Te(f.data)));
      const p = l(f, "computed");
      p && d.push(i("computed", p));
      const h = l(f, "inject");
      return (
        h && d.push(i("injected", h)),
        d.push([
          "div",
          {},
          [
            "span",
            {
              style: s.style + ";opacity:0.66",
            },
            "$ (internal): ",
          ],
          ["object", { object: f }],
        ]),
        d
      );
    }
    function i(f, d) {
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
                  ["span", s, p + ": "],
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
            ? ["span", s, f]
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
      ? window.devtoolsFormatters.push(n)
      : (window.devtoolsFormatters = [n]);
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
      createElement: (e, t, r, s) => {
        const n =
          t === "svg"
            ? Dr.createElementNS(Yb, e)
            : t === "mathml"
              ? Dr.createElementNS(Jb, e)
              : r
                ? Dr.createElement(e, { is: r })
                : Dr.createElement(e);
        return (
          e === "select" &&
            s &&
            s.multiple != null &&
            n.setAttribute("multiple", s.multiple),
          n
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
      insertStaticContent(e, t, r, s, n, o) {
        const i = r ? r.previousSibling : t.lastChild;
        if (n && (n === o || n.nextSibling))
          for (
            ;
            t.insertBefore(n.cloneNode(!0), r),
              !(n === o || !(n = n.nextSibling));

          );
        else {
          fd.innerHTML =
            s === "svg"
              ? `<svg>${e}</svg>`
              : s === "mathml"
                ? `<math>${e}</math>`
                : e;
          const a = fd.content;
          if (s === "svg" || s === "mathml") {
            const l = a.firstChild;
            for (; l.firstChild; ) a.appendChild(l.firstChild);
            a.removeChild(l);
          }
          t.insertBefore(a, r);
        }
        return [
          // first
          i ? i.nextSibling : t.firstChild,
          // last
          r ? r.previousSibling : t.lastChild,
        ];
      },
    },
    Zb = Symbol("_vtc");
  function Qb(e, t, r) {
    const s = e[Zb];
    s && (t = (t ? [t, ...s] : [...s]).join(" ")),
      t == null
        ? e.removeAttribute("class")
        : r
          ? e.setAttribute("class", t)
          : (e.className = t);
  }
  const qi = Symbol("_vod"),
    _m = Symbol("_vsh"),
    $m = {
      beforeMount(e, { value: t }, { transition: r }) {
        (e[qi] = e.style.display === "none" ? "" : e.style.display),
          r && t ? r.beforeEnter(e) : Zs(e, t);
      },
      mounted(e, { value: t }, { transition: r }) {
        r && t && r.enter(e);
      },
      updated(e, { value: t, oldValue: r }, { transition: s }) {
        !t != !r &&
          (s
            ? t
              ? (s.beforeEnter(e), Zs(e, !0), s.enter(e))
              : s.leave(e, () => {
                  Zs(e, !1);
                })
            : Zs(e, t));
      },
      beforeUnmount(e, { value: t }) {
        Zs(e, t);
      },
    };
  Vr.NODE_ENV !== "production" && ($m.name = "show");
  function Zs(e, t) {
    (e.style.display = t ? e[qi] : "none"), (e[_m] = !t);
  }
  const e0 = Symbol(Vr.NODE_ENV !== "production" ? "CSS_VAR_TEXT" : ""),
    t0 = /(^|;)\s*display\s*:/;
  function r0(e, t, r) {
    const s = e.style,
      n = st(r);
    let o = !1;
    if (r && !n) {
      if (t)
        if (st(t))
          for (const i of t.split(";")) {
            const a = i.slice(0, i.indexOf(":")).trim();
            r[a] == null && Di(s, a, "");
          }
        else for (const i in t) r[i] == null && Di(s, i, "");
      for (const i in r) i === "display" && (o = !0), Di(s, i, r[i]);
    } else if (n) {
      if (t !== r) {
        const i = s[e0];
        i && (r += ";" + i), (s.cssText = r), (o = t0.test(r));
      }
    } else t && e.removeAttribute("style");
    qi in e && ((e[qi] = o ? s.display : ""), e[_m] && (s.display = "none"));
  }
  const n0 = /[^\\];\s*$/,
    dd = /\s*!important$/;
  function Di(e, t, r) {
    if (he(r)) r.forEach(s => Di(e, t, s));
    else if (
      (r == null && (r = ""),
      Vr.NODE_ENV !== "production" &&
        n0.test(r) &&
        Aa(`Unexpected semicolon at the end of '${t}' style value: '${r}'`),
      t.startsWith("--"))
    )
      e.setProperty(t, r);
    else {
      const s = s0(e, t);
      dd.test(r)
        ? e.setProperty(Vt(s), r.replace(dd, ""), "important")
        : (e[s] = r);
    }
  }
  const pd = ["Webkit", "Moz", "ms"],
    ll = {};
  function s0(e, t) {
    const r = ll[t];
    if (r) return r;
    let s = Ct(t);
    if (s !== "filter" && s in e) return (ll[t] = s);
    s = Kn(s);
    for (let n = 0; n < pd.length; n++) {
      const o = pd[n] + s;
      if (o in e) return (ll[t] = o);
    }
    return t;
  }
  const hd = "http://www.w3.org/1999/xlink";
  function gd(e, t, r, s, n, o = T_(t)) {
    s && t.startsWith("xlink:")
      ? r == null
        ? e.removeAttributeNS(hd, t.slice(6, t.length))
        : e.setAttributeNS(hd, t, r)
      : r == null || (o && !tg(r))
        ? e.removeAttribute(t)
        : e.setAttribute(t, o ? "" : En(r) ? String(r) : r);
  }
  function o0(e, t, r, s) {
    if (t === "innerHTML" || t === "textContent") {
      if (r == null) return;
      e[t] = r;
      return;
    }
    const n = e.tagName;
    if (
      t === "value" &&
      n !== "PROGRESS" && // custom elements may use _value internally
      !n.includes("-")
    ) {
      const i = n === "OPTION" ? e.getAttribute("value") || "" : e.value,
        a = r == null ? "" : String(r);
      (i !== a || !("_value" in e)) && (e.value = a),
        r == null && e.removeAttribute(t),
        (e._value = r);
      return;
    }
    let o = !1;
    if (r === "" || r == null) {
      const i = typeof e[t];
      i === "boolean"
        ? (r = tg(r))
        : r == null && i === "string"
          ? ((r = ""), (o = !0))
          : i === "number" && ((r = 0), (o = !0));
    }
    try {
      e[t] = r;
    } catch (i) {
      Vr.NODE_ENV !== "production" &&
        !o &&
        Aa(
          `Failed setting prop "${t}" on <${n.toLowerCase()}>: value ${r} is invalid.`,
          i
        );
    }
    o && e.removeAttribute(t);
  }
  function i0(e, t, r, s) {
    e.addEventListener(t, r, s);
  }
  function a0(e, t, r, s) {
    e.removeEventListener(t, r, s);
  }
  const md = Symbol("_vei");
  function l0(e, t, r, s, n = null) {
    const o = e[md] || (e[md] = {}),
      i = o[t];
    if (s && i) i.value = Vr.NODE_ENV !== "production" ? yd(s, t) : s;
    else {
      const [a, l] = c0(t);
      if (s) {
        const c = (o[t] = d0(Vr.NODE_ENV !== "production" ? yd(s, t) : s, n));
        i0(e, a, c, l);
      } else i && (a0(e, a, i, l), (o[t] = void 0));
    }
  }
  const vd = /(?:Once|Passive|Capture)$/;
  function c0(e) {
    let t;
    if (vd.test(e)) {
      t = {};
      let s;
      for (; (s = e.match(vd)); )
        (e = e.slice(0, e.length - s[0].length)), (t[s[0].toLowerCase()] = !0);
    }
    return [e[2] === ":" ? e.slice(3) : Vt(e.slice(2)), t];
  }
  let cl = 0;
  const u0 = /* @__PURE__ */ Promise.resolve(),
    f0 = () => cl || (u0.then(() => (cl = 0)), (cl = Date.now()));
  function d0(e, t) {
    const r = s => {
      if (!s._vts) s._vts = Date.now();
      else if (s._vts <= r.attached) return;
      ir(p0(s, r.value), t, 5, [s]);
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
        t.map(s => n => !n._stopped && s && s(n))
      );
    } else return t;
  }
  const _d = e =>
      e.charCodeAt(0) === 111 &&
      e.charCodeAt(1) === 110 && // lowercase letter
      e.charCodeAt(2) > 96 &&
      e.charCodeAt(2) < 123,
    h0 = (e, t, r, s, n, o) => {
      const i = n === "svg";
      t === "class"
        ? Qb(e, s, i)
        : t === "style"
          ? r0(e, r, s)
          : Io(t)
            ? Li(t) || l0(e, t, r, s, o)
            : (
                  t[0] === "."
                    ? ((t = t.slice(1)), !0)
                    : t[0] === "^"
                      ? ((t = t.slice(1)), !1)
                      : g0(e, t, s, i)
                )
              ? (o0(e, t, s),
                !e.tagName.includes("-") &&
                  (t === "value" || t === "checked" || t === "selected") &&
                  gd(e, t, s, i, o, t !== "value"))
              : (t === "true-value"
                  ? (e._trueValue = s)
                  : t === "false-value" && (e._falseValue = s),
                gd(e, t, s, i));
    };
  function g0(e, t, r, s) {
    if (s)
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
      const n = e.tagName;
      if (n === "IMG" || n === "VIDEO" || n === "CANVAS" || n === "SOURCE")
        return !1;
    }
    return _d(t) && st(r) ? !1 : t in e;
  }
  /*! #__NO_SIDE_EFFECTS__ */
  // @__NO_SIDE_EFFECTS__
  function ko(e, t, r) {
    const s = /* @__PURE__ */ me(e, t);
    class n extends Gc {
      constructor(i) {
        super(s, i, r);
      }
    }
    return (n.def = s), n;
  }
  const m0 = typeof HTMLElement < "u" ? HTMLElement : class {};
  class Gc extends m0 {
    constructor(t, r = {}, s) {
      super(),
        (this._def = t),
        (this._props = r),
        (this._instance = null),
        (this._connected = !1),
        (this._resolved = !1),
        (this._numberProps = null),
        (this._ob = null),
        this.shadowRoot && s
          ? s(this._createVNode(), this.shadowRoot)
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
      for (let s = 0; s < this.attributes.length; s++)
        this._setAttr(this.attributes[s].name);
      (this._ob = new MutationObserver(s => {
        for (const n of s) this._setAttr(n.attributeName);
      })),
        this._ob.observe(this, { attributes: !0 });
      const t = (s, n = !1) => {
          const { props: o, styles: i } = s;
          let a;
          if (o && !he(o))
            for (const l in o) {
              const c = o[l];
              (c === Number || (c && c.type === Number)) &&
                (l in this._props && (this._props[l] = Ff(this._props[l])),
                ((a || (a = /* @__PURE__ */ Object.create(null)))[Ct(l)] = !0));
            }
          (this._numberProps = a),
            n && this._resolveProps(s),
            this._applyStyles(i),
            this._update();
        },
        r = this._def.__asyncLoader;
      r ? r().then(s => t(s, !0)) : t(this._def);
    }
    _resolveProps(t) {
      const { props: r } = t,
        s = he(r) ? r : Object.keys(r || {});
      for (const n of Object.keys(this))
        n[0] !== "_" && s.includes(n) && this._setProp(n, this[n], !0, !1);
      for (const n of s.map(Ct))
        Object.defineProperty(this, n, {
          get() {
            return this._getProp(n);
          },
          set(o) {
            this._setProp(n, o);
          },
        });
    }
    _setAttr(t) {
      let r = this.hasAttribute(t) ? this.getAttribute(t) : void 0;
      const s = Ct(t);
      this._numberProps && this._numberProps[s] && (r = Ff(r)),
        this._setProp(s, r, !1);
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
    _setProp(t, r, s = !0, n = !0) {
      r !== this._props[t] &&
        ((this._props[t] = r),
        n && this._instance && this._update(),
        s &&
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
                (r.ceReload = o => {
                  this._styles &&
                    (this._styles.forEach(i => this.shadowRoot.removeChild(i)),
                    (this._styles.length = 0)),
                    this._applyStyles(o),
                    (this._instance = null),
                    this._update();
                });
            const s = (o, i) => {
              this.dispatchEvent(
                new CustomEvent(o, {
                  detail: i,
                })
              );
            };
            r.emit = (o, ...i) => {
              s(o, i), Vt(o) !== o && s(Vt(o), i);
            };
            let n = this;
            for (; (n = n && (n.parentNode || n.host)); )
              if (n instanceof Gc) {
                (r.parent = n._instance), (r.provides = n._instance.provides);
                break;
              }
          }),
        t
      );
    }
    _applyStyles(t) {
      t &&
        t.forEach(r => {
          const s = document.createElement("style");
          (s.textContent = r),
            this.shadowRoot.appendChild(s),
            Vr.NODE_ENV !== "production" &&
              (this._styles || (this._styles = [])).push(s);
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
        s = t.join(".");
      return (
        r[s] ||
        (r[s] = (n, ...o) => {
          for (let i = 0; i < t.length; i++) {
            const a = y0[t[i]];
            if (a && a(n, t)) return;
          }
          return e(n, ...o);
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
    Yi = Math.round,
    hi = Math.floor,
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
  function Ds(e) {
    return e.split("-")[1];
  }
  function qc(e) {
    return e === "x" ? "y" : "x";
  }
  function Yc(e) {
    return e === "y" ? "height" : "width";
  }
  function Is(e) {
    return ["top", "bottom"].includes(Kr(e)) ? "y" : "x";
  }
  function Jc(e) {
    return qc(Is(e));
  }
  function N0(e, t, r) {
    r === void 0 && (r = !1);
    const s = Ds(e),
      n = Jc(e),
      o = Yc(n);
    let i =
      n === "x"
        ? s === (r ? "end" : "start")
          ? "right"
          : "left"
        : s === "start"
          ? "bottom"
          : "top";
    return t.reference[o] > t.floating[o] && (i = Ji(i)), [i, Ji(i)];
  }
  function P0(e) {
    const t = Ji(e);
    return [tc(e), t, tc(t)];
  }
  function tc(e) {
    return e.replace(/start|end/g, t => A0[t]);
  }
  function C0(e, t, r) {
    const s = ["left", "right"],
      n = ["right", "left"],
      o = ["top", "bottom"],
      i = ["bottom", "top"];
    switch (e) {
      case "top":
      case "bottom":
        return r ? (t ? n : s) : t ? s : n;
      case "left":
      case "right":
        return t ? o : i;
      default:
        return [];
    }
  }
  function T0(e, t, r, s) {
    const n = Ds(e);
    let o = C0(Kr(e), r === "start", s);
    return (
      n && ((o = o.map(i => i + "-" + n)), t && (o = o.concat(o.map(tc)))), o
    );
  }
  function Ji(e) {
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
  function Xi(e) {
    const { x: t, y: r, width: s, height: n } = e;
    return {
      width: s,
      height: n,
      top: r,
      left: t,
      right: t + s,
      bottom: r + n,
      x: t,
      y: r,
    };
  }
  function wd(e, t, r) {
    let { reference: s, floating: n } = e;
    const o = Is(t),
      i = Jc(t),
      a = Yc(i),
      l = Kr(t),
      c = o === "y",
      u = s.x + s.width / 2 - n.width / 2,
      f = s.y + s.height / 2 - n.height / 2,
      d = s[a] / 2 - n[a] / 2;
    let p;
    switch (l) {
      case "top":
        p = {
          x: u,
          y: s.y - n.height,
        };
        break;
      case "bottom":
        p = {
          x: u,
          y: s.y + s.height,
        };
        break;
      case "right":
        p = {
          x: s.x + s.width,
          y: f,
        };
        break;
      case "left":
        p = {
          x: s.x - n.width,
          y: f,
        };
        break;
      default:
        p = {
          x: s.x,
          y: s.y,
        };
    }
    switch (Ds(t)) {
      case "start":
        p[i] -= d * (r && c ? -1 : 1);
        break;
      case "end":
        p[i] += d * (r && c ? -1 : 1);
        break;
    }
    return p;
  }
  const D0 = async (e, t, r) => {
    const {
        placement: s = "bottom",
        strategy: n = "absolute",
        middleware: o = [],
        platform: i,
      } = r,
      a = o.filter(Boolean),
      l = await (i.isRTL == null ? void 0 : i.isRTL(t));
    let c = await i.getElementRects({
        reference: e,
        floating: t,
        strategy: n,
      }),
      { x: u, y: f } = wd(c, s, l),
      d = s,
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
          initialPlacement: s,
          placement: d,
          strategy: n,
          middlewareData: p,
          rects: c,
          platform: i,
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
                  ? await i.getElementRects({
                      reference: e,
                      floating: t,
                      strategy: n,
                    })
                  : I.rects),
            ({ x: u, y: f } = wd(c, d, l))),
          (m = -1));
    }
    return {
      x: u,
      y: f,
      placement: d,
      strategy: n,
      middlewareData: p,
    };
  };
  async function Co(e, t) {
    var r;
    t === void 0 && (t = {});
    const { x: s, y: n, platform: o, rects: i, elements: a, strategy: l } = e,
      {
        boundary: c = "clippingAncestors",
        rootBoundary: u = "viewport",
        elementContext: f = "floating",
        altBoundary: d = !1,
        padding: p = 0,
      } = Hr(t, e),
      h = bm(p),
      y = a[d ? (f === "floating" ? "reference" : "floating") : f],
      g = Xi(
        await o.getClippingRect({
          element:
            (r = await (o.isElement == null ? void 0 : o.isElement(y))) ==
              null || r
              ? y
              : y.contextElement ||
                (await (o.getDocumentElement == null
                  ? void 0
                  : o.getDocumentElement(a.floating))),
          boundary: c,
          rootBoundary: u,
          strategy: l,
        })
      ),
      _ =
        f === "floating"
          ? {
              ...i.floating,
              x: s,
              y: n,
            }
          : i.reference,
      E = await (o.getOffsetParent == null
        ? void 0
        : o.getOffsetParent(a.floating)),
      S = (await (o.isElement == null ? void 0 : o.isElement(E)))
        ? (await (o.getScale == null ? void 0 : o.getScale(E))) || {
            x: 1,
            y: 1,
          }
        : {
            x: 1,
            y: 1,
          },
      I = Xi(
        o.convertOffsetParentRelativeRectToViewportRelativeRect
          ? await o.convertOffsetParentRelativeRectToViewportRelativeRect({
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
            y: s,
            placement: n,
            rects: o,
            platform: i,
            elements: a,
            middlewareData: l,
          } = t,
          { element: c, padding: u = 0 } = Hr(e, t) || {};
        if (c == null) return {};
        const f = bm(u),
          d = {
            x: r,
            y: s,
          },
          p = Jc(n),
          h = Yc(p),
          m = await i.getDimensions(c),
          y = p === "y",
          g = y ? "top" : "left",
          _ = y ? "bottom" : "right",
          E = y ? "clientHeight" : "clientWidth",
          S = o.reference[h] + o.reference[p] - d[p] - o.floating[h],
          I = d[p] - o.reference[p],
          A = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(c));
        let O = A ? A[E] : 0;
        (!O || !(await (i.isElement == null ? void 0 : i.isElement(A)))) &&
          (O = a.floating[E] || o.floating[h]);
        const L = S / 2 - I / 2,
          z = O / 2 - m[h] / 2 - 1,
          H = $n(f[g], z),
          ne = $n(f[_], z),
          G = H,
          Ne = O - m[h] - ne,
          fe = O / 2 - m[h] / 2 + L,
          Pe = ec(G, fe, Ne),
          be =
            !l.arrow &&
            Ds(n) != null &&
            fe !== Pe &&
            o.reference[h] / 2 - (fe < G ? H : ne) - m[h] / 2 < 0,
          le = be ? (fe < G ? fe - G : fe - Ne) : 0;
        return {
          [p]: d[p] + le,
          data: {
            [p]: Pe,
            centerOffset: fe - Pe - le,
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
            var r, s;
            const {
                placement: n,
                middlewareData: o,
                rects: i,
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
            if ((r = o.arrow) != null && r.alignmentOffset) return {};
            const g = Kr(n),
              _ = Kr(a) === a,
              E = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)),
              S = d || (_ || !m ? [Ji(a)] : P0(a));
            !d && h !== "none" && S.push(...T0(a, m, h, E));
            const I = [a, ...S],
              A = await Co(t, y),
              O = [];
            let L = ((s = o.flip) == null ? void 0 : s.overflows) || [];
            if ((u && O.push(A[g]), f)) {
              const G = N0(n, i, E);
              O.push(A[G[0]], A[G[1]]);
            }
            if (
              ((L = [
                ...L,
                {
                  placement: n,
                  overflows: O,
                },
              ]),
              !O.every(G => G <= 0))
            ) {
              var z, H;
              const G = (((z = o.flip) == null ? void 0 : z.index) || 0) + 1,
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
              let fe =
                (H = L.filter(Pe => Pe.overflows[0] <= 0).sort(
                  (Pe, be) => Pe.overflows[1] - be.overflows[1]
                )[0]) == null
                  ? void 0
                  : H.placement;
              if (!fe)
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
                    Pe && (fe = Pe);
                    break;
                  }
                  case "initialPlacement":
                    fe = a;
                    break;
                }
              if (n !== fe)
                return {
                  reset: {
                    placement: fe,
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
            { strategy: s = "referenceHidden", ...n } = Hr(e, t);
          switch (s) {
            case "referenceHidden": {
              const o = await Co(t, {
                  ...n,
                  elementContext: "reference",
                }),
                i = Ed(o, r.reference);
              return {
                data: {
                  referenceHiddenOffsets: i,
                  referenceHidden: Od(i),
                },
              };
            }
            case "escaped": {
              const o = await Co(t, {
                  ...n,
                  altBoundary: !0,
                }),
                i = Ed(o, r.floating);
              return {
                data: {
                  escapedOffsets: i,
                  escaped: Od(i),
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
    const { placement: r, platform: s, elements: n } = e,
      o = await (s.isRTL == null ? void 0 : s.isRTL(n.floating)),
      i = Kr(r),
      a = Ds(r),
      l = Is(r) === "y",
      c = ["left", "top"].includes(i) ? -1 : 1,
      u = o && l ? -1 : 1,
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
            var r, s;
            const { x: n, y: o, placement: i, middlewareData: a } = t,
              l = await j0(t, e);
            return i === ((r = a.offset) == null ? void 0 : r.placement) &&
              (s = a.arrow) != null &&
              s.alignmentOffset
              ? {}
              : {
                  x: n + l.x,
                  y: o + l.y,
                  data: {
                    ...l,
                    placement: i,
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
            const { x: r, y: s, placement: n } = t,
              {
                mainAxis: o = !0,
                crossAxis: i = !1,
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
                y: s,
              },
              u = await Co(t, l),
              f = Is(Kr(n)),
              d = qc(f);
            let p = c[d],
              h = c[f];
            if (o) {
              const y = d === "y" ? "top" : "left",
                g = d === "y" ? "bottom" : "right",
                _ = p + u[y],
                E = p - u[g];
              p = ec(_, p, E);
            }
            if (i) {
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
                y: m.y - s,
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
            const { x: r, y: s, placement: n, rects: o, middlewareData: i } = t,
              { offset: a = 0, mainAxis: l = !0, crossAxis: c = !0 } = Hr(e, t),
              u = {
                x: r,
                y: s,
              },
              f = Is(n),
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
                S = o.reference[d] - o.floating[E] + y.mainAxis,
                I = o.reference[d] + o.reference[E] - y.mainAxis;
              p < S ? (p = S) : p > I && (p = I);
            }
            if (c) {
              var g, _;
              const E = d === "y" ? "width" : "height",
                S = ["top", "left"].includes(Kr(n)),
                I =
                  o.reference[f] -
                  o.floating[E] +
                  ((S && ((g = i.offset) == null ? void 0 : g[f])) || 0) +
                  (S ? 0 : y.crossAxis),
                A =
                  o.reference[f] +
                  o.reference[E] +
                  (S ? 0 : ((_ = i.offset) == null ? void 0 : _[f]) || 0) -
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
            const { placement: r, rects: s, platform: n, elements: o } = t,
              { apply: i = () => {}, ...a } = Hr(e, t),
              l = await Co(t, a),
              c = Kr(r),
              u = Ds(r),
              f = Is(r) === "y",
              { width: d, height: p } = s.floating;
            let h, m;
            c === "top" || c === "bottom"
              ? ((h = c),
                (m =
                  u ===
                  ((await (n.isRTL == null ? void 0 : n.isRTL(o.floating)))
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
            await i({
              ...t,
              availableWidth: S,
              availableHeight: E,
            });
            const I = await n.getDimensions(o.floating);
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
  function ts(e) {
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
  function Bo(e) {
    const { overflow: t, overflowX: r, overflowY: s, display: n } = cr(e);
    return (
      /auto|scroll|overlay|hidden|clip/.test(t + s + r) &&
      !["inline", "contents"].includes(n)
    );
  }
  function B0(e) {
    return ["table", "td", "th"].includes(ts(e));
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
      ["transform", "perspective", "filter"].some(s =>
        (r.willChange || "").includes(s)
      ) ||
      ["paint", "layout", "strict", "content"].some(s =>
        (r.contain || "").includes(s)
      )
    );
  }
  function z0(e) {
    let t = wn(e);
    for (; Or(t) && !As(t); ) {
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
  function As(e) {
    return ["html", "body", "#document"].includes(ts(e));
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
    if (ts(e) === "html") return e;
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
    return As(t)
      ? e.ownerDocument
        ? e.ownerDocument.body
        : e.body
      : Or(t) && Bo(t)
        ? t
        : wm(t);
  }
  function To(e, t, r) {
    var s;
    t === void 0 && (t = []), r === void 0 && (r = !0);
    const n = wm(e),
      o = n === ((s = e.ownerDocument) == null ? void 0 : s.body),
      i = Kt(n);
    return o
      ? t.concat(
          i,
          i.visualViewport || [],
          Bo(n) ? n : [],
          i.frameElement && r ? To(i.frameElement) : []
        )
      : t.concat(n, To(n, [], r));
  }
  function Em(e) {
    const t = cr(e);
    let r = parseFloat(t.width) || 0,
      s = parseFloat(t.height) || 0;
    const n = Or(e),
      o = n ? e.offsetWidth : r,
      i = n ? e.offsetHeight : s,
      a = Yi(r) !== o || Yi(s) !== i;
    return (
      a && ((r = o), (s = i)),
      {
        width: r,
        height: s,
        $: a,
      }
    );
  }
  function eu(e) {
    return lr(e) ? e : e.contextElement;
  }
  function ws(e) {
    const t = eu(e);
    if (!Or(t)) return bn(1);
    const r = t.getBoundingClientRect(),
      { width: s, height: n, $: o } = Em(t);
    let i = (o ? Yi(r.width) : r.width) / s,
      a = (o ? Yi(r.height) : r.height) / n;
    return (
      (!i || !Number.isFinite(i)) && (i = 1),
      (!a || !Number.isFinite(a)) && (a = 1),
      {
        x: i,
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
  function qn(e, t, r, s) {
    t === void 0 && (t = !1), r === void 0 && (r = !1);
    const n = e.getBoundingClientRect(),
      o = eu(e);
    let i = bn(1);
    t && (s ? lr(s) && (i = ws(s)) : (i = ws(e)));
    const a = W0(o, r, s) ? Om(o) : bn(0);
    let l = (n.left + a.x) / i.x,
      c = (n.top + a.y) / i.y,
      u = n.width / i.x,
      f = n.height / i.y;
    if (o) {
      const d = Kt(o),
        p = s && lr(s) ? Kt(s) : s;
      let h = d,
        m = h.frameElement;
      for (; m && s && p !== h; ) {
        const y = ws(m),
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
    return Xi({
      width: u,
      height: f,
      x: l,
      y: c,
    });
  }
  function H0(e) {
    let { elements: t, rect: r, offsetParent: s, strategy: n } = e;
    const o = n === "fixed",
      i = Zr(s),
      a = t ? Na(t.floating) : !1;
    if (s === i || (a && o)) return r;
    let l = {
        scrollLeft: 0,
        scrollTop: 0,
      },
      c = bn(1);
    const u = bn(0),
      f = Or(s);
    if (
      (f || (!f && !o)) &&
      ((ts(s) !== "body" || Bo(i)) && (l = Pa(s)), Or(s))
    ) {
      const d = qn(s);
      (c = ws(s)), (u.x = d.x + s.clientLeft), (u.y = d.y + s.clientTop);
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
      s = e.ownerDocument.body,
      n = Wt(t.scrollWidth, t.clientWidth, s.scrollWidth, s.clientWidth),
      o = Wt(t.scrollHeight, t.clientHeight, s.scrollHeight, s.clientHeight);
    let i = -r.scrollLeft + Sm(e);
    const a = -r.scrollTop;
    return (
      cr(s).direction === "rtl" && (i += Wt(t.clientWidth, s.clientWidth) - n),
      {
        width: n,
        height: o,
        x: i,
        y: a,
      }
    );
  }
  function q0(e, t) {
    const r = Kt(e),
      s = Zr(e),
      n = r.visualViewport;
    let o = s.clientWidth,
      i = s.clientHeight,
      a = 0,
      l = 0;
    if (n) {
      (o = n.width), (i = n.height);
      const c = Qc();
      (!c || (c && t === "fixed")) && ((a = n.offsetLeft), (l = n.offsetTop));
    }
    return {
      width: o,
      height: i,
      x: a,
      y: l,
    };
  }
  function Y0(e, t) {
    const r = qn(e, !0, t === "fixed"),
      s = r.top + e.clientTop,
      n = r.left + e.clientLeft,
      o = Or(e) ? ws(e) : bn(1),
      i = e.clientWidth * o.x,
      a = e.clientHeight * o.y,
      l = n * o.x,
      c = s * o.y;
    return {
      width: i,
      height: a,
      x: l,
      y: c,
    };
  }
  function Ad(e, t, r) {
    let s;
    if (t === "viewport") s = q0(e, r);
    else if (t === "document") s = G0(Zr(e));
    else if (lr(t)) s = Y0(t, r);
    else {
      const n = Om(e);
      s = {
        ...t,
        x: t.x - n.x,
        y: t.y - n.y,
      };
    }
    return Xi(s);
  }
  function Am(e, t) {
    const r = wn(e);
    return r === t || !lr(r) || As(r)
      ? !1
      : cr(r).position === "fixed" || Am(r, t);
  }
  function J0(e, t) {
    const r = t.get(e);
    if (r) return r;
    let s = To(e, [], !1).filter(a => lr(a) && ts(a) !== "body"),
      n = null;
    const o = cr(e).position === "fixed";
    let i = o ? wn(e) : e;
    for (; lr(i) && !As(i); ) {
      const a = cr(i),
        l = Zc(i);
      !l && a.position === "fixed" && (n = null),
        (
          o
            ? !l && !n
            : (!l &&
                a.position === "static" &&
                !!n &&
                ["absolute", "fixed"].includes(n.position)) ||
              (Bo(i) && !l && Am(e, i))
        )
          ? (s = s.filter(u => u !== i))
          : (n = a),
        (i = wn(i));
    }
    return t.set(e, s), s;
  }
  function X0(e) {
    let { element: t, boundary: r, rootBoundary: s, strategy: n } = e;
    const i = [
        ...(r === "clippingAncestors"
          ? Na(t)
            ? []
            : J0(t, this._c)
          : [].concat(r)),
        s,
      ],
      a = i[0],
      l = i.reduce(
        (c, u) => {
          const f = Ad(t, u, n);
          return (
            (c.top = Wt(f.top, c.top)),
            (c.right = $n(f.right, c.right)),
            (c.bottom = $n(f.bottom, c.bottom)),
            (c.left = Wt(f.left, c.left)),
            c
          );
        },
        Ad(t, a, n)
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
    const s = Or(t),
      n = Zr(t),
      o = r === "fixed",
      i = qn(e, !0, o, t);
    let a = {
      scrollLeft: 0,
      scrollTop: 0,
    };
    const l = bn(0);
    if (s || (!s && !o))
      if (((ts(t) !== "body" || Bo(n)) && (a = Pa(t)), s)) {
        const f = qn(t, !0, o, t);
        (l.x = f.x + t.clientLeft), (l.y = f.y + t.clientTop);
      } else n && (l.x = Sm(n));
    const c = i.left + a.scrollLeft - l.x,
      u = i.top + a.scrollTop - l.y;
    return {
      x: c,
      y: u,
      width: i.width,
      height: i.height,
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
      let n = wn(e);
      for (; n && !As(n); ) {
        if (lr(n) && !ul(n)) return n;
        n = wn(n);
      }
      return r;
    }
    let s = Nd(e, t);
    for (; s && B0(s) && ul(s); ) s = Nd(s, t);
    return s && As(s) && ul(s) && !Zc(s) ? r : s || z0(e) || r;
  }
  const ew = async function (e) {
    const t = this.getOffsetParent || Nm,
      r = this.getDimensions,
      s = await r(e.floating);
    return {
      reference: Q0(e.reference, await t(e.floating), e.strategy),
      floating: {
        x: 0,
        y: 0,
        width: s.width,
        height: s.height,
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
    getScale: ws,
    isElement: lr,
    isRTL: tw,
  };
  function nw(e, t) {
    let r = null,
      s;
    const n = Zr(e);
    function o() {
      var a;
      clearTimeout(s), (a = r) == null || a.disconnect(), (r = null);
    }
    function i(a, l) {
      a === void 0 && (a = !1), l === void 0 && (l = 1), o();
      const {
        left: c,
        top: u,
        width: f,
        height: d,
      } = e.getBoundingClientRect();
      if ((a || t(), !f || !d)) return;
      const p = hi(u),
        h = hi(n.clientWidth - (c + f)),
        m = hi(n.clientHeight - (u + d)),
        y = hi(c),
        _ = {
          rootMargin: -p + "px " + -h + "px " + -m + "px " + -y + "px",
          threshold: Wt(0, $n(1, l)) || 1,
        };
      let E = !0;
      function S(I) {
        const A = I[0].intersectionRatio;
        if (A !== l) {
          if (!E) return i();
          A
            ? i(!1, A)
            : (s = setTimeout(() => {
                i(!1, 1e-7);
              }, 1e3));
        }
        E = !1;
      }
      try {
        r = new IntersectionObserver(S, {
          ..._,
          // Handle <iframe>s
          root: n.ownerDocument,
        });
      } catch {
        r = new IntersectionObserver(S, _);
      }
      r.observe(e);
    }
    return i(!0), o;
  }
  function sw(e, t, r, s) {
    s === void 0 && (s = {});
    const {
        ancestorScroll: n = !0,
        ancestorResize: o = !0,
        elementResize: i = typeof ResizeObserver == "function",
        layoutShift: a = typeof IntersectionObserver == "function",
        animationFrame: l = !1,
      } = s,
      c = eu(e),
      u = n || o ? [...(c ? To(c) : []), ...To(t)] : [];
    u.forEach(g => {
      n &&
        g.addEventListener("scroll", r, {
          passive: !0,
        }),
        o && g.addEventListener("resize", r);
    });
    const f = c && a ? nw(c, r) : null;
    let d = -1,
      p = null;
    i &&
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
          n && _.removeEventListener("scroll", r),
            o && _.removeEventListener("resize", r);
        }),
          f == null || f(),
          (g = p) == null || g.disconnect(),
          (p = null),
          l && cancelAnimationFrame(h);
      }
    );
  }
  const ow = F0,
    iw = L0,
    Pd = R0,
    aw = k0,
    lw = M0,
    cw = I0,
    uw = V0,
    fw = (e, t, r) => {
      const s = /* @__PURE__ */ new Map(),
        n = {
          platform: rw,
          ...r,
        },
        o = {
          ...n.platform,
          _c: s,
        };
      return D0(e, t, {
        ...n,
        platform: o,
      });
    };
  function dw(e) {
    return e != null && typeof e == "object" && "$el" in e;
  }
  function rc(e) {
    if (dw(e)) {
      const t = e.$el;
      return Xc(t) && ts(t) === "#comment" ? null : t;
    }
    return e;
  }
  function ms(e) {
    return typeof e == "function" ? e() : U(e);
  }
  function pw(e) {
    return {
      name: "arrow",
      options: e,
      fn(t) {
        const r = rc(ms(e.element));
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
    const s = r.whileElementsMounted,
      n = Se(() => {
        var O;
        return (O = ms(r.open)) != null ? O : !0;
      }),
      o = Se(() => ms(r.middleware)),
      i = Se(() => {
        var O;
        return (O = ms(r.placement)) != null ? O : "bottom";
      }),
      a = Se(() => {
        var O;
        return (O = ms(r.strategy)) != null ? O : "absolute";
      }),
      l = Se(() => {
        var O;
        return (O = ms(r.transform)) != null ? O : !0;
      }),
      c = Se(() => rc(e.value)),
      u = Se(() => rc(t.value)),
      f = Oe(0),
      d = Oe(0),
      p = Oe(a.value),
      h = Oe(i.value),
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
          middleware: o.value,
          placement: i.value,
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
      if ((S(), s === void 0)) {
        E();
        return;
      }
      if (c.value != null && u.value != null) {
        _ = s(c.value, u.value, E);
        return;
      }
    }
    function A() {
      n.value || (y.value = !1);
    }
    return (
      _t([o, i, a], E, {
        flush: "sync",
      }),
      _t([c, u], I, {
        flush: "sync",
      }),
      _t(n, A, {
        flush: "sync",
      }),
      Pc() && ig(S),
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
  function rs(e, t) {
    const r = typeof e == "string" && !t ? `${e}Context` : t,
      s = Symbol(r);
    return [
      n => {
        const o = go(s, n);
        if (o || o === null) return o;
        throw new Error(
          `Injection \`${s.toString()}\` not found. Component must be used within ${
            Array.isArray(e)
              ? `one of the following components: ${e.join(", ")}`
              : `\`${e}\``
          }`
        );
      },
      n => (qg(s, n), n),
    ];
  }
  function Cm(e, t, r) {
    const s = r.originalEvent.target,
      n = new CustomEvent(e, {
        bubbles: !1,
        cancelable: !0,
        detail: r,
      });
    t && s.addEventListener(e, t, { once: !0 }), s.dispatchEvent(n);
  }
  function mw(e, t) {
    var r;
    const s = wg();
    return (
      Qt(
        () => {
          s.value = e();
        },
        {
          ...t,
          flush: (r = void 0) != null ? r : "sync",
        }
      ),
      ya(s)
    );
  }
  function zo(e) {
    return Pc() ? (ig(e), !0) : !1;
  }
  function vw() {
    const e = /* @__PURE__ */ new Set(),
      t = r => {
        e.delete(r);
      };
    return {
      on: r => {
        e.add(r);
        const s = () => t(r);
        return (
          zo(s),
          {
            off: s,
          }
        );
      },
      off: t,
      trigger: (...r) => Promise.all(Array.from(e).map(s => s(...r))),
    };
  }
  function yw(e) {
    let t = !1,
      r;
    const s = og(!0);
    return (...n) => (t || ((r = s.run(() => e(...n))), (t = !0)), r);
  }
  function _w(e) {
    let t = 0,
      r,
      s;
    const n = () => {
      (t -= 1), s && t <= 0 && (s.stop(), (r = void 0), (s = void 0));
    };
    return (...o) => (
      (t += 1), r || ((s = og(!0)), (r = s.run(() => e(...o)))), zo(n), r
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
    return o$((r, s) => {
      let n = Hn(e),
        o;
      const i = () =>
        setTimeout(() => {
          (n = Hn(e)), s();
        }, Hn(t));
      return (
        zo(() => {
          clearTimeout(o);
        }),
        {
          get() {
            return r(), n;
          },
          set(a) {
            (n = a), s(), clearTimeout(o), (o = i());
          },
        }
      );
    });
  }
  function Nw(e, t) {
    Sw() && kg(e, t);
  }
  function Tm(e, t, r = {}) {
    const { immediate: s = !0 } = r,
      n = Oe(!1);
    let o = null;
    function i() {
      o && (clearTimeout(o), (o = null));
    }
    function a() {
      (n.value = !1), i();
    }
    function l(...c) {
      i(),
        (n.value = !0),
        (o = setTimeout(() => {
          (n.value = !1), (o = null), e(...c);
        }, Hn(t)));
    }
    return (
      s && ((n.value = !0), An && l()),
      zo(a),
      {
        isPending: ya(n),
        start: l,
        stop: a,
      }
    );
  }
  function Uo(e) {
    var t;
    const r = Hn(e);
    return (t = r == null ? void 0 : r.$el) != null ? t : r;
  }
  const xm = An ? window : void 0;
  function Zi(...e) {
    let t, r, s, n;
    if (
      (typeof e[0] == "string" || Array.isArray(e[0])
        ? (([r, s, n] = e), (t = xm))
        : ([t, r, s, n] = e),
      !t)
    )
      return Ew;
    Array.isArray(r) || (r = [r]), Array.isArray(s) || (s = [s]);
    const o = [],
      i = () => {
        o.forEach(u => u()), (o.length = 0);
      },
      a = (u, f, d, p) => (
        u.addEventListener(f, d, p), () => u.removeEventListener(f, d, p)
      ),
      l = _t(
        () => [Uo(t), Hn(n)],
        ([u, f]) => {
          if ((i(), !u)) return;
          const d = ww(f) ? { ...f } : f;
          o.push(...r.flatMap(p => s.map(h => a(u, p, h, d))));
        },
        { immediate: !0, flush: "post" }
      ),
      c = () => {
        l(), i();
      };
    return zo(c), c;
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
      s = {};
    e.length === 3
      ? ((t = e[0]), (r = e[1]), (s = e[2]))
      : e.length === 2
        ? typeof e[1] == "object"
          ? ((t = !0), (r = e[0]), (s = e[1]))
          : ((t = e[0]), (r = e[1]))
        : ((t = !0), (r = e[0]));
    const {
        target: n = xm,
        eventName: o = "keydown",
        passive: i = !1,
        dedupe: a = !1,
      } = s,
      l = Pw(t);
    return Zi(
      n,
      o,
      c => {
        (c.repeat && Hn(a)) || (l(c) && r(c));
      },
      i
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
  function Dm(e, t, r, s = {}) {
    var n, o, i;
    const {
        clone: a = !1,
        passive: l = !1,
        eventName: c,
        deep: u = !1,
        defaultValue: f,
        shouldEmit: d,
      } = s,
      p = Xr(),
      h =
        r ||
        (p == null ? void 0 : p.emit) ||
        ((n = p == null ? void 0 : p.$emit) == null ? void 0 : n.bind(p)) ||
        ((i = (o = p == null ? void 0 : p.proxy) == null ? void 0 : o.$emit) ==
        null
          ? void 0
          : i.bind(p == null ? void 0 : p.proxy));
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
  function nc(e, t, r = ".", s) {
    if (!fl(t)) return nc(e, {}, r);
    const n = Object.assign({}, t);
    for (const o in e) {
      if (o === "__proto__" || o === "constructor") continue;
      const i = e[o];
      i != null &&
        (Array.isArray(i) && Array.isArray(n[o])
          ? (n[o] = [...i, ...n[o]])
          : fl(i) && fl(n[o])
            ? (n[o] = nc(i, n[o], (r ? `${r}.` : "") + o.toString()))
            : (n[o] = i));
    }
    return n;
  }
  function Dw(e) {
    return (...t) =>
      // eslint-disable-next-line unicorn/no-array-reduce
      t.reduce((r, s) => nc(r, s, ""), {});
  }
  const Iw = Dw(),
    [Im, $K] = rs("ConfigProvider");
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
        for (const i of e.value.values()) if (i) return !0;
        return !1;
      }),
      s = Im({
        scrollBody: Oe(!0),
      });
    let n = null;
    const o = () => {
      (document.body.style.paddingRight = ""),
        (document.body.style.marginRight = ""),
        (document.body.style.pointerEvents = ""),
        document.body.style.removeProperty("--scrollbar-width"),
        (document.body.style.overflow = t.value ?? ""),
        Td && (n == null || n()),
        (t.value = void 0);
    };
    return (
      _t(
        r,
        (i, a) => {
          var l;
          if (!An) return;
          if (!i) {
            a && o();
            return;
          }
          t.value === void 0 && (t.value = document.body.style.overflow);
          const c = window.innerWidth - document.documentElement.clientWidth,
            u = { padding: c, margin: 0 },
            f =
              (l = s.scrollBody) != null && l.value
                ? typeof s.scrollBody.value == "object"
                  ? Iw(
                      {
                        padding:
                          s.scrollBody.value.padding === !0
                            ? c
                            : s.scrollBody.value.padding,
                        margin:
                          s.scrollBody.value.margin === !0
                            ? c
                            : s.scrollBody.value.margin,
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
              (n = Zi(
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
    const s = Se({
      get: () => r.value.get(t) ?? !1,
      set: n => r.value.set(t, n),
    });
    return (
      Nw(() => {
        r.value.delete(t);
      }),
      s
    );
  }
  function Ca(e) {
    const t = Xr(),
      r = t == null ? void 0 : t.type.emits,
      s = {};
    return (
      (r != null && r.length) ||
        console.warn(
          `No emitted event found. Please check component: ${t == null ? void 0 : t.type.__name}`
        ),
      r == null ||
        r.forEach(n => {
          s[Ir(Ct(n))] = (...o) => e(n, ...o);
        }),
      s
    );
  }
  function Rm(e) {
    const t = Xr(),
      r = Object.keys((t == null ? void 0 : t.type.props) ?? {}).reduce(
        (n, o) => {
          const i = (t == null ? void 0 : t.type.props[o]).default;
          return i !== void 0 && (n[o] = i), n;
        },
        {}
      ),
      s = l$(e);
    return Se(() => {
      const n = {},
        o = (t == null ? void 0 : t.vnode.props) ?? {};
      return (
        Object.keys(o).forEach(i => {
          n[Ct(i)] = o[i];
        }),
        Object.keys({ ...r, ...n }).reduce(
          (i, a) => (s.value[a] !== void 0 && (i[a] = s.value[a]), i),
          {}
        )
      );
    });
  }
  function ru(e, t) {
    const r = Rm(e),
      s = t ? Ca(t) : {};
    return Se(() => ({
      ...r.value,
      ...s,
    }));
  }
  function He() {
    const e = Xr(),
      t = Oe(),
      r = Se(() => {
        var i, a;
        return ["#text", "#comment"].includes(
          (i = t.value) == null ? void 0 : i.$el.nodeName
        )
          ? (a = t.value) == null
            ? void 0
            : a.$el.nextElementSibling
          : Uo(t);
      }),
      s = Object.assign({}, e.exposed),
      n = {};
    for (const i in e.props)
      Object.defineProperty(n, i, {
        enumerable: !0,
        configurable: !0,
        get: () => e.props[i],
      });
    if (Object.keys(s).length > 0)
      for (const i in s)
        Object.defineProperty(n, i, {
          enumerable: !0,
          configurable: !0,
          get: () => s[i],
        });
    Object.defineProperty(n, "$el", {
      enumerable: !0,
      configurable: !0,
      get: () => e.vnode.el,
    }),
      (e.exposed = n);
    function o(i) {
      (t.value = i),
        !(i instanceof Element || !i) &&
          (Object.defineProperty(n, "$el", {
            enumerable: !0,
            configurable: !0,
            get: () => i.$el,
          }),
          (e.exposed = n));
    }
    return { forwardRef: o, currentRef: t, currentElement: r };
  }
  function Lw(e, t) {
    const r = Aw(!1, 300),
      s = Oe(null),
      n = vw();
    function o() {
      (s.value = null), (r.value = !1);
    }
    function i(a, l) {
      const c = a.currentTarget,
        u = { x: a.clientX, y: a.clientY },
        f = Vw(u, c.getBoundingClientRect()),
        d = kw(u, f),
        p = Bw(l.getBoundingClientRect()),
        h = Uw([...d, ...p]);
      (s.value = h), (r.value = !0);
    }
    return (
      Qt(a => {
        if (e.value && t.value) {
          const l = u => i(u, t.value),
            c = u => i(u, e.value);
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
        if (s.value) {
          const l = c => {
            var u, f;
            if (!s.value) return;
            const d = c.target,
              p = { x: c.clientX, y: c.clientY },
              h =
                ((u = e.value) == null ? void 0 : u.contains(d)) ||
                ((f = t.value) == null ? void 0 : f.contains(d)),
              m = !zw(p, s.value),
              y = d.hasAttribute("data-grace-area-trigger");
            h ? o() : (m || y) && (o(), n.trigger());
          };
          document.addEventListener("pointermove", l),
            a(() => document.removeEventListener("pointermove", l));
        }
      }),
      {
        isPointerInTransit: r,
        onPointerExit: n.on,
      }
    );
  }
  function Vw(e, t) {
    const r = Math.abs(t.top - e.y),
      s = Math.abs(t.bottom - e.y),
      n = Math.abs(t.right - e.x),
      o = Math.abs(t.left - e.x);
    switch (Math.min(r, s, n, o)) {
      case o:
        return "left";
      case n:
        return "right";
      case r:
        return "top";
      case s:
        return "bottom";
      default:
        throw new Error("unreachable");
    }
  }
  function kw(e, t, r = 5) {
    const s = [];
    switch (t) {
      case "top":
        s.push({ x: e.x - r, y: e.y + r }, { x: e.x + r, y: e.y + r });
        break;
      case "bottom":
        s.push({ x: e.x - r, y: e.y - r }, { x: e.x + r, y: e.y - r });
        break;
      case "left":
        s.push({ x: e.x + r, y: e.y - r }, { x: e.x + r, y: e.y + r });
        break;
      case "right":
        s.push({ x: e.x - r, y: e.y - r }, { x: e.x - r, y: e.y + r });
        break;
    }
    return s;
  }
  function Bw(e) {
    const { top: t, right: r, bottom: s, left: n } = e;
    return [
      { x: n, y: t },
      { x: r, y: t },
      { x: r, y: s },
      { x: n, y: s },
    ];
  }
  function zw(e, t) {
    const { x: r, y: s } = e;
    let n = !1;
    for (let o = 0, i = t.length - 1; o < t.length; i = o++) {
      const a = t[o].x,
        l = t[o].y,
        c = t[i].x,
        u = t[i].y;
      l > s != u > s && r < ((c - a) * (s - l)) / (u - l) + a && (n = !n);
    }
    return n;
  }
  function Uw(e) {
    const t = e.slice();
    return (
      t.sort((r, s) =>
        r.x < s.x ? -1 : r.x > s.x ? 1 : r.y < s.y ? -1 : r.y > s.y ? 1 : 0
      ),
      Ww(t)
    );
  }
  function Ww(e) {
    if (e.length <= 1) return e.slice();
    const t = [];
    for (let s = 0; s < e.length; s++) {
      const n = e[s];
      for (; t.length >= 2; ) {
        const o = t[t.length - 1],
          i = t[t.length - 2];
        if ((o.x - i.x) * (n.y - i.y) >= (o.y - i.y) * (n.x - i.x)) t.pop();
        else break;
      }
      t.push(n);
    }
    t.pop();
    const r = [];
    for (let s = e.length - 1; s >= 0; s--) {
      const n = e[s];
      for (; r.length >= 2; ) {
        const o = r[r.length - 1],
          i = r[r.length - 2];
        if ((o.x - i.x) * (n.y - i.y) >= (o.y - i.y) * (n.x - i.x)) r.pop();
        else break;
      }
      r.push(n);
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
    ps = /* @__PURE__ */ new WeakMap(),
    gi = /* @__PURE__ */ new WeakMap(),
    mi = {},
    dl = 0,
    Mm = function (e) {
      return e && (e.host || Mm(e.parentNode));
    },
    Kw = function (e, t) {
      return t
        .map(function (r) {
          if (e.contains(r)) return r;
          var s = Mm(r);
          return s && e.contains(s)
            ? s
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
    Gw = function (e, t, r, s) {
      var n = Kw(t, Array.isArray(e) ? e : [e]);
      mi[r] || (mi[r] = /* @__PURE__ */ new WeakMap());
      var o = mi[r],
        i = [],
        a = /* @__PURE__ */ new Set(),
        l = new Set(n),
        c = function (f) {
          !f || a.has(f) || (a.add(f), c(f.parentNode));
        };
      n.forEach(c);
      var u = function (f) {
        !f ||
          l.has(f) ||
          Array.prototype.forEach.call(f.children, function (d) {
            if (a.has(d)) u(d);
            else
              try {
                var p = d.getAttribute(s),
                  h = p !== null && p !== "false",
                  m = (ps.get(d) || 0) + 1,
                  y = (o.get(d) || 0) + 1;
                ps.set(d, m),
                  o.set(d, y),
                  i.push(d),
                  m === 1 && h && gi.set(d, !0),
                  y === 1 && d.setAttribute(r, "true"),
                  h || d.setAttribute(s, "true");
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
          i.forEach(function (f) {
            var d = ps.get(f) - 1,
              p = o.get(f) - 1;
            ps.set(f, d),
              o.set(f, p),
              d || (gi.has(f) || f.removeAttribute(s), gi.delete(f)),
              p || f.removeAttribute(r);
          }),
            dl--,
            dl ||
              ((ps = /* @__PURE__ */ new WeakMap()),
              (ps = /* @__PURE__ */ new WeakMap()),
              (gi = /* @__PURE__ */ new WeakMap()),
              (mi = {}));
        }
      );
    },
    qw = function (e, t, r) {
      r === void 0 && (r = "data-aria-hidden");
      var s = Array.from(Array.isArray(e) ? e : [e]),
        n = Hw(e);
      return n
        ? (s.push.apply(s, Array.from(n.querySelectorAll("[aria-live]"))),
          Gw(s, n, r, "aria-hidden"))
        : function () {
            return null;
          };
    };
  function Yw(e) {
    let t;
    _t(
      () => Uo(e),
      r => {
        r ? (t = qw(r)) : t && t();
      }
    ),
      Fo(() => {
        t && t();
      });
  }
  let Jw = 0;
  function Qi(e, t = "radix") {
    const { useId: r } = Im({ useId: void 0 });
    return r && typeof r == "function" ? `${t}-${r()}` : `${t}-${++Jw}`;
  }
  function Xw(e) {
    const t = Oe(),
      r = Se(() => {
        var n;
        return ((n = t.value) == null ? void 0 : n.width) ?? 0;
      }),
      s = Se(() => {
        var n;
        return ((n = t.value) == null ? void 0 : n.height) ?? 0;
      });
    return (
      Jr(() => {
        const n = Uo(e);
        if (n) {
          t.value = { width: n.offsetWidth, height: n.offsetHeight };
          const o = new ResizeObserver(i => {
            if (!Array.isArray(i) || !i.length) return;
            const a = i[0];
            let l, c;
            if ("borderBoxSize" in a) {
              const u = a.borderBoxSize,
                f = Array.isArray(u) ? u[0] : u;
              (l = f.inlineSize), (c = f.blockSize);
            } else (l = n.offsetWidth), (c = n.offsetHeight);
            t.value = { width: l, height: c };
          });
          return o.observe(n, { box: "border-box" }), () => o.unobserve(n);
        } else t.value = void 0;
      }),
      {
        width: r,
        height: s,
      }
    );
  }
  function Zw(e, t) {
    const r = Oe(e);
    function s(n) {
      return t[r.value][n] ?? r.value;
    }
    return {
      state: r,
      dispatch: n => {
        r.value = s(n);
      },
    };
  }
  const Qw = /* @__PURE__ */ me({
      name: "PrimitiveSlot",
      inheritAttrs: !1,
      setup(e, { attrs: t, slots: r }) {
        return () => {
          var s, n;
          if (!r.default) return null;
          const o = tu(r.default()),
            i = o.findIndex(u => u.type !== Rt);
          if (i === -1) return o;
          const a = o[i];
          (s = a.props) == null || delete s.ref;
          const l = a.props ? gt(t, a.props) : t;
          t.class && (n = a.props) != null && n.class && delete a.props.class;
          const c = Wr(a, l);
          for (const u in l)
            u.startsWith("on") &&
              (c.props || (c.props = {}), (c.props[u] = l[u]));
          return o.length === 1 ? c : ((o[i] = c), o);
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
        const s = e.asChild ? "template" : e.as;
        return typeof s == "string" && ["area", "img", "input"].includes(s)
          ? () => xi(s, t)
          : s !== "template"
            ? () => xi(e.as, t, { default: r.default })
            : () => xi(Qw, t, { default: r.default });
      },
    });
  function eE(e, t) {
    const r = Oe({}),
      s = Oe("none"),
      n = e.value ? "mounted" : "unmounted",
      { state: o, dispatch: i } = Zw(n, {
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
          const y = s.value,
            g = vi(t.value);
          d
            ? (i("MOUNT"), a("enter"), g === "none" && a("after-enter"))
            : g === "none" ||
                ((h = r.value) == null ? void 0 : h.display) === "none"
              ? (i("UNMOUNT"), a("leave"), a("after-leave"))
              : p && y !== g
                ? (i("ANIMATION_OUT"), a("leave"))
                : (i("UNMOUNT"), a("after-leave"));
        }
      },
      { immediate: !0 }
    );
    const l = d => {
        const p = vi(t.value),
          h = p.includes(d.animationName),
          m = o.value === "mounted" ? "enter" : "leave";
        d.target === t.value && h && (a(`after-${m}`), i("ANIMATION_END")),
          d.target === t.value && p === "none" && i("ANIMATION_END");
      },
      c = d => {
        d.target === t.value && (s.value = vi(t.value));
      },
      u = _t(
        t,
        (d, p) => {
          d
            ? ((r.value = getComputedStyle(d)),
              d.addEventListener("animationstart", c),
              d.addEventListener("animationcancel", l),
              d.addEventListener("animationend", l))
            : (i("ANIMATION_END"),
              p == null || p.removeEventListener("animationstart", c),
              p == null || p.removeEventListener("animationcancel", l),
              p == null || p.removeEventListener("animationend", l));
        },
        { immediate: !0 }
      ),
      f = _t(o, () => {
        const d = vi(t.value);
        s.value = o.value === "mounted" ? d : "none";
      });
    return (
      Fo(() => {
        u(), f();
      }),
      {
        isPresent: Se(() => ["mounted", "unmountSuspended"].includes(o.value)),
      }
    );
  }
  function vi(e) {
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
        var s;
        const { present: n, forceMount: o } = Mt(e),
          i = Oe(),
          { isPresent: a } = eE(n, i);
        r({ present: a });
        let l = t.default({ present: a });
        l = tu(l || []);
        const c = Xr();
        if (l && (l == null ? void 0 : l.length) > 1) {
          const u =
            (s = c == null ? void 0 : c.parent) != null && s.type.name
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
          o.value || n.value || a.value
            ? xi(t.default({ present: a })[0], {
                ref: u => {
                  const f = Uo(u);
                  return (
                    typeof (f == null ? void 0 : f.hasAttribute) > "u" ||
                      (f != null &&
                      f.hasAttribute("data-radix-popper-content-wrapper")
                        ? (i.value = f.firstElementChild)
                        : (i.value = f)),
                    f
                  );
                },
              })
            : null;
      },
    }),
    [Ar, tE] = rs("DialogRoot"),
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
          s = Dm(r, "open", t, {
            defaultValue: r.defaultOpen,
            passive: r.open === void 0,
          }),
          n = Oe(),
          o = Oe(),
          { modal: i } = Mt(r);
        return (
          tE({
            open: s,
            modal: i,
            openModal: () => {
              s.value = !0;
            },
            onOpenChange: a => {
              s.value = a;
            },
            onOpenToggle: () => {
              s.value = !s.value;
            },
            contentId: "",
            titleId: "",
            descriptionId: "",
            triggerElement: n,
            contentElement: o,
          }),
          (a, l) => de(a.$slots, "default", { open: U(s) })
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
          { forwardRef: s, currentElement: n } = He();
        return (
          r.contentId || (r.contentId = Qi(void 0, "radix-vue-dialog-content")),
          Jr(() => {
            r.triggerElement.value = n.value;
          }),
          (o, i) => (
            ue(),
            _e(
              U(xt),
              gt(t, {
                ref: U(s),
                type: o.as === "button" ? "button" : void 0,
                "aria-haspopup": "dialog",
                "aria-expanded": U(r).open.value || !1,
                "aria-controls": U(r).open.value ? U(r).contentId : void 0,
                "data-state": U(r).open.value ? "open" : "closed",
                onClick: U(r).onOpenToggle,
              }),
              {
                default: ie(() => [de(o.$slots, "default")]),
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
        return (r, s) =>
          U(t) || r.forceMount
            ? (ue(),
              _e(
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
    sE = /* @__PURE__ */ me({
      __name: "DialogPortal",
      props: {
        to: {},
        disabled: { type: Boolean },
        forceMount: { type: Boolean },
      },
      setup(e) {
        const t = e;
        return (r, s) => (
          ue(),
          _e(
            U(jm),
            xs(es(t)),
            {
              default: ie(() => [de(r.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    oE = "dismissableLayer.pointerDownOutside",
    iE = "dismissableLayer.focusOutside";
  function Fm(e, t) {
    const r = t.closest("[data-dismissable-layer]"),
      s =
        e.dataset.dismissableLayer === ""
          ? e
          : e.querySelector("[data-dismissable-layer]"),
      n = Array.from(
        e.ownerDocument.querySelectorAll("[data-dismissable-layer]")
      );
    return !!((r && s === r) || n.indexOf(s) < n.indexOf(r));
  }
  function aE(e, t) {
    var r;
    const s =
        ((r = t == null ? void 0 : t.value) == null
          ? void 0
          : r.ownerDocument) ??
        (globalThis == null ? void 0 : globalThis.document),
      n = Oe(!1),
      o = Oe(() => {});
    return (
      Qt(i => {
        if (!An) return;
        const a = async c => {
            const u = c.target;
            if (t != null && t.value) {
              if (Fm(t.value, u)) {
                n.value = !1;
                return;
              }
              if (c.target && !n.value) {
                let f = function () {
                  Cm(oE, e, d);
                };
                const d = { originalEvent: c };
                c.pointerType === "touch"
                  ? (s.removeEventListener("click", o.value),
                    (o.value = f),
                    s.addEventListener("click", o.value, {
                      once: !0,
                    }))
                  : f();
              } else s.removeEventListener("click", o.value);
              n.value = !1;
            }
          },
          l = window.setTimeout(() => {
            s.addEventListener("pointerdown", a);
          }, 0);
        i(() => {
          window.clearTimeout(l),
            s.removeEventListener("pointerdown", a),
            s.removeEventListener("click", o.value);
        });
      }),
      {
        onPointerDownCapture: () => (n.value = !0),
      }
    );
  }
  function lE(e, t) {
    var r;
    const s =
        ((r = t == null ? void 0 : t.value) == null
          ? void 0
          : r.ownerDocument) ??
        (globalThis == null ? void 0 : globalThis.document),
      n = Oe(!1);
    return (
      Qt(o => {
        if (!An) return;
        const i = async a => {
          t != null &&
            t.value &&
            (await On(),
            !(!t.value || Fm(t.value, a.target)) &&
              a.target &&
              !n.value &&
              Cm(iE, e, { originalEvent: a }));
        };
        s.addEventListener("focusin", i),
          o(() => s.removeEventListener("focusin", i));
      }),
      {
        onFocusCapture: () => (n.value = !0),
        onBlurCapture: () => (n.value = !1),
      }
    );
  }
  const Pr = Ro({
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
          s = t,
          { forwardRef: n, currentElement: o } = He(),
          i = Se(() => {
            var h;
            return (
              ((h = o.value) == null ? void 0 : h.ownerDocument) ??
              globalThis.document
            );
          }),
          a = Se(() => Pr.layersRoot),
          l = Se(() => (o.value ? Array.from(a.value).indexOf(o.value) : -1)),
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
              (s("pointerDownOutside", h),
              s("interactOutside", h),
              await On(),
              h.defaultPrevented || s("dismiss"));
          }, o),
          d = lE(h => {
            [...Pr.branches].some(m => m.contains(h.target)) ||
              (s("focusOutside", h),
              s("interactOutside", h),
              h.defaultPrevented || s("dismiss"));
          }, o);
        Cw("Escape", h => {
          l.value === a.value.size - 1 &&
            (s("escapeKeyDown", h), h.defaultPrevented || s("dismiss"));
        });
        let p;
        return (
          Qt(h => {
            o.value &&
              (r.disableOutsidePointerEvents &&
                (Pr.layersWithOutsidePointerEventsDisabled.size === 0 &&
                  ((p = i.value.body.style.pointerEvents),
                  (i.value.body.style.pointerEvents = "none")),
                Pr.layersWithOutsidePointerEventsDisabled.add(o.value)),
              a.value.add(o.value),
              h(() => {
                r.disableOutsidePointerEvents &&
                  Pr.layersWithOutsidePointerEventsDisabled.size === 1 &&
                  (i.value.body.style.pointerEvents = p);
              }));
          }),
          Qt(h => {
            h(() => {
              o.value &&
                (a.value.delete(o.value),
                Pr.layersWithOutsidePointerEventsDisabled.delete(o.value));
            });
          }),
          (h, m) => (
            ue(),
            _e(
              U(xt),
              {
                ref: U(n),
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
                default: ie(() => [de(h.$slots, "default")]),
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
    for (const s of e)
      if ((cn(s, { select: t }), document.activeElement !== r)) return !0;
  }
  function uE(e) {
    const t = Vm(e),
      r = Dd(t, e),
      s = Dd(t.reverse(), e);
    return [r, s];
  }
  function Vm(e) {
    const t = [],
      r = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
        acceptNode: s => {
          const n = s.tagName === "INPUT" && s.type === "hidden";
          return s.disabled || s.hidden || n
            ? NodeFilter.FILTER_SKIP
            : s.tabIndex >= 0
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
      s = r.indexOf(t);
    return s !== -1 && r.splice(s, 1), r;
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
        s = t,
        { currentRef: n, currentElement: o } = He(),
        i = Oe(null),
        a = hE(),
        l = Ro({
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
        const f = o.value;
        if (!r.trapped) return;
        function d(y) {
          if (l.paused || !f) return;
          const g = y.target;
          f.contains(g) ? (i.value = g) : cn(i.value, { select: !0 });
        }
        function p(y) {
          if (l.paused || !f) return;
          const g = y.relatedTarget;
          g !== null && (f.contains(g) || cn(i.value, { select: !0 }));
        }
        function h(y) {
          f.contains(i.value) || cn(f);
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
          const f = o.value;
          if ((await On(), !f)) return;
          a.add(l);
          const d = document.activeElement;
          if (!f.contains(d)) {
            const p = new CustomEvent(pl, xd);
            f.addEventListener(pl, h => s("mountAutoFocus", h)),
              f.dispatchEvent(p),
              p.defaultPrevented ||
                (cE(gE(Vm(f)), {
                  select: !0,
                }),
                document.activeElement === d && cn(f));
          }
          u(() => {
            f.removeEventListener(pl, m => s("mountAutoFocus", m));
            const p = new CustomEvent(hl, xd),
              h = m => {
                s("unmountAutoFocus", m);
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
        ue(),
        _e(
          U(xt),
          {
            ref_key: "currentRef",
            ref: n,
            tabindex: "-1",
            "as-child": u.asChild,
            as: u.as,
            onKeydown: c,
          },
          {
            default: ie(() => [de(u.$slots, "default")]),
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
    titleId: s,
    descriptionId: n,
    contentElement: o,
  }) {
    const i = `Warning: \`${t}\` requires a \`${e}\` for the component to be accessible for screen reader users.

If you want to hide the \`${e}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://www.radix-vue.com/components/${r}`,
      a = `Warning: Missing \`Description\` or \`aria-describedby="undefined"\` for ${t}.`;
    Jr(() => {
      var l;
      document.getElementById(s) || console.warn(i);
      const c =
        (l = o.value) == null ? void 0 : l.getAttribute("aria-describedby");
      n && !c && (document.getElementById(n) || console.warn(a));
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
          s = t,
          n = Ar(),
          { forwardRef: o, currentElement: i } = He();
        return (
          n.titleId || (n.titleId = Qi(void 0, "radix-vue-dialog-title")),
          n.descriptionId ||
            (n.descriptionId = Qi(void 0, "radix-vue-dialog-description")),
          Jr(() => {
            (n.contentElement = i),
              document.activeElement !== document.body &&
                (n.triggerElement.value = document.activeElement);
          }),
          gw.NODE_ENV !== "production" &&
            $E({
              titleName: "DialogTitle",
              contentName: "DialogContent",
              componentLink: "dialog.html#title",
              titleId: n.titleId,
              descriptionId: n.descriptionId,
              contentElement: n.contentElement,
            }),
          (a, l) => (
            ue(),
            _e(
              U(mE),
              {
                "as-child": "",
                loop: "",
                trapped: r.trapFocus,
                onMountAutoFocus: l[5] || (l[5] = c => s("openAutoFocus", c)),
                onUnmountAutoFocus:
                  l[6] || (l[6] = c => s("closeAutoFocus", c)),
              },
              {
                default: ie(() => [
                  Ve(
                    U(Lm),
                    gt(
                      {
                        id: U(n).contentId,
                        ref: U(o),
                        as: a.as,
                        "as-child": a.asChild,
                        "disable-outside-pointer-events":
                          a.disableOutsidePointerEvents,
                        role: "dialog",
                        "aria-describedby": U(n).descriptionId,
                        "aria-labelledby": U(n).titleId,
                        "data-state": U(vE)(U(n).open.value),
                      },
                      a.$attrs,
                      {
                        onDismiss: l[0] || (l[0] = c => U(n).onOpenChange(!1)),
                        onEscapeKeyDown:
                          l[1] || (l[1] = c => s("escapeKeyDown", c)),
                        onFocusOutside:
                          l[2] || (l[2] = c => s("focusOutside", c)),
                        onInteractOutside:
                          l[3] || (l[3] = c => s("interactOutside", c)),
                        onPointerDownOutside:
                          l[4] || (l[4] = c => s("pointerDownOutside", c)),
                      }
                    ),
                    {
                      default: ie(() => [de(a.$slots, "default")]),
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
          s = t,
          n = Ar(),
          o = Ca(s),
          { forwardRef: i, currentElement: a } = He();
        return (
          Yw(a),
          (l, c) => (
            ue(),
            _e(
              km,
              gt(
                { ...r, ...U(o) },
                {
                  ref: U(i),
                  "trap-focus": U(n).open.value,
                  "disable-outside-pointer-events": !0,
                  onCloseAutoFocus:
                    c[0] ||
                    (c[0] = u => {
                      var f;
                      u.defaultPrevented ||
                        (u.preventDefault(),
                        (f = U(n).triggerElement.value) == null || f.focus());
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
                default: ie(() => [de(l.$slots, "default")]),
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
          s = Ca(t);
        He();
        const n = Ar(),
          o = Oe(!1),
          i = Oe(!1);
        return (a, l) => (
          ue(),
          _e(
            km,
            gt(
              { ...r, ...U(s) },
              {
                "trap-focus": !1,
                "disable-outside-pointer-events": !1,
                onCloseAutoFocus:
                  l[0] ||
                  (l[0] = c => {
                    var u;
                    c.defaultPrevented ||
                      (o.value ||
                        (u = U(n).triggerElement.value) == null ||
                        u.focus(),
                      c.preventDefault()),
                      (o.value = !1),
                      (i.value = !1);
                  }),
                onInteractOutside:
                  l[1] ||
                  (l[1] = c => {
                    var u;
                    c.defaultPrevented ||
                      ((o.value = !0),
                      c.detail.originalEvent.type === "pointerdown" &&
                        (i.value = !0));
                    const f = c.target;
                    (u = U(n).triggerElement.value) != null &&
                      u.contains(f) &&
                      c.preventDefault(),
                      c.detail.originalEvent.type === "focusin" &&
                        i.value &&
                        c.preventDefault();
                  }),
              }
            ),
            {
              default: ie(() => [de(a.$slots, "default")]),
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
          s = t,
          n = Ar(),
          o = Ca(s),
          { forwardRef: i } = He();
        return (a, l) => (
          ue(),
          _e(
            U(nu),
            {
              present: a.forceMount || U(n).open.value,
            },
            {
              default: ie(() => [
                U(n).modal.value
                  ? (ue(),
                    _e(
                      bE,
                      gt(
                        {
                          key: 0,
                          ref: U(i),
                        },
                        { ...r, ...U(o), ...a.$attrs }
                      ),
                      {
                        default: ie(() => [de(a.$slots, "default")]),
                        _: 3,
                      },
                      16
                    ))
                  : (ue(),
                    _e(
                      wE,
                      gt(
                        {
                          key: 1,
                          ref: U(i),
                        },
                        { ...r, ...U(o), ...a.$attrs }
                      ),
                      {
                        default: ie(() => [de(a.$slots, "default")]),
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
          (r, s) => (
            ue(),
            _e(
              U(xt),
              {
                as: r.as,
                "as-child": r.asChild,
                "data-state": U(t).open.value ? "open" : "closed",
                style: { "pointer-events": "auto" },
              },
              {
                default: ie(() => [de(r.$slots, "default")]),
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
        return (s, n) => {
          var o;
          return (o = U(t)) != null && o.modal.value
            ? (ue(),
              _e(
                U(nu),
                {
                  key: 0,
                  present: s.forceMount || U(t).open.value,
                },
                {
                  default: ie(() => [
                    Ve(
                      OE,
                      gt(s.$attrs, {
                        ref: U(r),
                        as: s.as,
                        "as-child": s.asChild,
                      }),
                      {
                        default: ie(() => [de(s.$slots, "default")]),
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
        return (s, n) => (
          ue(),
          _e(
            U(xt),
            gt(t, {
              type: s.as === "button" ? "button" : void 0,
              onClick: n[0] || (n[0] = o => U(r).onOpenChange(!1)),
            }),
            {
              default: ie(() => [de(s.$slots, "default")]),
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
          (s, n) => (
            ue(),
            _e(
              U(xt),
              gt(t, {
                id: U(r).titleId,
              }),
              {
                default: ie(() => [de(s.$slots, "default")]),
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
        return (s, n) => (
          ue(),
          _e(
            U(xt),
            gt(t, {
              id: U(r).descriptionId,
            }),
            {
              default: ie(() => [de(s.$slots, "default")]),
              _: 3,
            },
            16,
            ["id"]
          )
        );
      },
    }),
    [Bm, CE] = rs("AvatarRoot"),
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
            ue(),
            _e(
              U(xt),
              {
                "as-child": t.asChild,
                as: t.as,
              },
              {
                default: ie(() => [de(t.$slots, "default")]),
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
      s = n => () => {
        r.value && (t.value = n);
      };
    return (
      Jr(() => {
        (r.value = !0),
          _t(
            e,
            n => {
              if (!n) t.value = "error";
              else {
                const o = new window.Image();
                (t.value = "loading"),
                  (o.onload = s("loaded")),
                  (o.onerror = s("error")),
                  (o.src = n);
              }
            },
            { immediate: !0 }
          );
      }),
      Fo(() => {
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
          s = t,
          { src: n } = Mt(r);
        He();
        const o = Bm(),
          i = xE(n);
        return (
          _t(
            i,
            a => {
              s("loadingStatusChange", a),
                a !== "idle" && (o.imageLoadingStatus.value = a);
            },
            { immediate: !0 }
          ),
          (a, l) =>
            T$(
              (ue(),
              _e(
                U(xt),
                {
                  role: "img",
                  "as-child": a.asChild,
                  as: a.as,
                  src: U(n),
                },
                {
                  default: ie(() => [de(a.$slots, "default")]),
                  _: 3,
                },
                8,
                ["as-child", "as", "src"]
              )),
              [[$m, U(i) === "loaded"]]
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
        const s = Oe(!1);
        let n;
        return (
          _t(
            r.imageLoadingStatus,
            o => {
              o === "loading" &&
                ((s.value = !1),
                t.delayMs
                  ? (n = setTimeout(() => {
                      (s.value = !0), clearTimeout(n);
                    }, t.delayMs))
                  : (s.value = !0));
            },
            { immediate: !0 }
          ),
          (o, i) =>
            s.value && U(r).imageLoadingStatus.value !== "loaded"
              ? (ue(),
                _e(
                  U(xt),
                  {
                    key: 0,
                    "as-child": o.asChild,
                    as: o.as,
                  },
                  {
                    default: ie(() => [de(o.$slots, "default")]),
                    _: 3,
                  },
                  8,
                  ["as-child", "as"]
                ))
              : $r("", !0)
        );
      },
    }),
    [zm, RE] = rs("PopperRoot"),
    ME = /* @__PURE__ */ me({
      __name: "PopperRoot",
      setup(e) {
        const t = Oe();
        return (
          RE({
            anchor: t,
            onAnchorChange: r => (t.value = r),
          }),
          (r, s) => de(r.$slots, "default")
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
          { forwardRef: r, currentElement: s } = He(),
          n = zm();
        return (
          _t(s, () => {
            n.onAnchorChange(t.element ?? s.value);
          }),
          (o, i) => (
            ue(),
            _e(
              U(xt),
              {
                ref: U(r),
                as: o.as,
                "as-child": o.asChild,
              },
              {
                default: ie(() => [de(o.$slots, "default")]),
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
        var r, s, n;
        const { placement: o, rects: i, middlewareData: a } = t,
          l = ((r = a.arrow) == null ? void 0 : r.centerOffset) !== 0,
          c = l ? 0 : e.arrowWidth,
          u = l ? 0 : e.arrowHeight,
          [f, d] = sc(o),
          p = { start: "0%", center: "50%", end: "100%" }[d],
          h = (((s = a.arrow) == null ? void 0 : s.x) ?? 0) + c / 2,
          m = (((n = a.arrow) == null ? void 0 : n.y) ?? 0) + u / 2;
        let y = "",
          g = "";
        return (
          f === "bottom"
            ? ((y = l ? p : `${h}px`), (g = `${-u}px`))
            : f === "top"
              ? ((y = l ? p : `${h}px`), (g = `${i.floating.height + u}px`))
              : f === "right"
                ? ((y = `${-u}px`), (g = l ? p : `${m}px`))
                : f === "left" &&
                  ((y = `${i.floating.width + u}px`), (g = l ? p : `${m}px`)),
          { data: { x: y, y: g } }
        );
      },
    };
  }
  function sc(e) {
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
    [kE, BE] = rs("PopperContent"),
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
          s = t,
          n = zm(),
          { forwardRef: o, currentElement: i } = He(),
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
            ow({
              mainAxis: r.sideOffset + u.value,
              alignmentAxis: r.alignOffset,
            }),
            r.prioritizePosition &&
              r.avoidCollisions &&
              Pd({
                ...h.value,
              }),
            r.avoidCollisions &&
              iw({
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
                const { width: fe, height: Pe } = ne.reference,
                  be = H.floating.style;
                be.setProperty("--radix-popper-available-width", `${G}px`),
                  be.setProperty("--radix-popper-available-height", `${Ne}px`),
                  be.setProperty("--radix-popper-anchor-width", `${fe}px`),
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
          } = hw(n.anchor, a, {
            strategy: "fixed",
            placement: f,
            whileElementsMounted: (...H) =>
              sw(...H, {
                animationFrame: r.updatePositionStrategy === "always",
              }),
            middleware: m,
          }),
          S = Se(() => sc(g.value)[0]),
          I = Se(() => sc(g.value)[1]);
        Qt(() => {
          _.value && s("placed");
        });
        const A = Se(() => {
            var H;
            return (
              ((H = E.value.arrow) == null ? void 0 : H.centerOffset) !== 0
            );
          }),
          O = Oe("");
        Qt(() => {
          i.value && (O.value = window.getComputedStyle(i.value).zIndex);
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
            var G, Ne, fe;
            return (
              ue(),
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
                    ...(((fe = U(E).hide) == null
                      ? void 0
                      : fe.referenceHidden) && {
                      visibility: "hidden",
                      pointerEvents: "none",
                    }),
                  }),
                },
                [
                  Ve(
                    U(xt),
                    gt({ ref: U(o) }, H.$attrs, {
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
                      default: ie(() => [de(H.$slots, "default")]),
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
          (r, s) => (
            ue(),
            _e(
              U(xt),
              gt(t, {
                width: r.width,
                height: r.height,
                viewBox: r.asChild ? void 0 : "0 0 30 10",
                preserveAspectRatio: r.asChild ? void 0 : "none",
              }),
              {
                default: ie(() => [de(r.$slots, "default", {}, () => [UE])]),
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
          s = Se(() => HE[r.placedSide.value]);
        return (n, o) => {
          var i, a, l, c;
          return (
            ue(),
            Sn(
              "span",
              {
                ref: u => {
                  U(r).onArrowChange(u);
                },
                style: Qn({
                  position: "absolute",
                  left:
                    (i = U(r).arrowX) != null && i.value
                      ? `${(a = U(r).arrowX) == null ? void 0 : a.value}px`
                      : void 0,
                  top:
                    (l = U(r).arrowY) != null && l.value
                      ? `${(c = U(r).arrowY) == null ? void 0 : c.value}px`
                      : void 0,
                  [s.value]: 0,
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
                  gt(n.$attrs, {
                    ref: U(t),
                    style: {
                      display: "block",
                    },
                    as: n.as,
                    "as-child": n.asChild,
                    width: n.width,
                    height: n.height,
                  }),
                  {
                    default: ie(() => [de(n.$slots, "default")]),
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
            ue(),
            _e(
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
                default: ie(() => [de(t.$slots, "default")]),
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
    [su, YE] = rs("TooltipProvider"),
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
            skipDelayDuration: s,
            disableHoverableContent: n,
            disableClosingTrigger: o,
            ignoreNonKeyboardFocus: i,
            disabled: a,
          } = Mt(t);
        He();
        const l = Oe(!0),
          c = Oe(!1),
          { start: u, stop: f } = Tm(
            () => {
              l.value = !0;
            },
            s,
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
            disableHoverableContent: n,
            disableClosingTrigger: o,
            disabled: a,
            ignoreNonKeyboardFocus: i,
          }),
          (d, p) => de(d.$slots, "default")
        );
      },
    }),
    [Ta, XE] = rs("TooltipRoot"),
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
          s = t;
        He();
        const n = su(),
          o = Se(
            () => r.disableHoverableContent ?? n.disableHoverableContent.value
          ),
          i = Se(
            () => r.disableClosingTrigger ?? n.disableClosingTrigger.value
          ),
          a = Se(() => r.disabled ?? n.disabled.value),
          l = Se(() => r.delayDuration ?? n.delayDuration.value),
          c = Se(
            () => r.ignoreNonKeyboardFocus ?? n.ignoreNonKeyboardFocus.value
          ),
          u = Dm(r, "open", s, {
            defaultValue: r.defaultOpen,
            passive: r.open === void 0,
          });
        _t(u, E => {
          n.onClose &&
            (E
              ? (n.onOpen(), document.dispatchEvent(new CustomEvent(Um)))
              : n.onClose());
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
              n.isOpenDelayed.value ? _() : y();
            },
            onTriggerLeave() {
              o.value ? g() : m();
            },
            onOpen: y,
            onClose: g,
            disableHoverableContent: o,
            disableClosingTrigger: i,
            disabled: a,
            ignoreNonKeyboardFocus: c,
          }),
          (E, S) => (
            ue(),
            _e(U(ME), null, {
              default: ie(() => [de(E.$slots, "default", { open: U(u) })]),
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
          s = su();
        r.contentId || (r.contentId = Qi(void 0, "radix-vue-tooltip-content"));
        const { forwardRef: n, currentElement: o } = He(),
          i = Oe(!1),
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
          r.onTriggerChange(o.value);
        });
        function c() {
          i.value = !1;
        }
        function u() {
          (i.value = !0),
            document.addEventListener("pointerup", c, { once: !0 });
        }
        function f(y) {
          y.pointerType !== "touch" &&
            !a.value &&
            !s.isPointerInTransitRef.value &&
            (r.onTriggerEnter(), (a.value = !0));
        }
        function d() {
          r.onTriggerLeave(), (a.value = !1);
        }
        function p(y) {
          var g, _;
          i.value ||
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
          ue(),
          _e(
            U(jE),
            { "as-child": "" },
            {
              default: ie(() => [
                Ve(
                  U(xt),
                  gt(
                    {
                      ref: U(n),
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
                    default: ie(() => [de(y.$slots, "default")]),
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
          s = t,
          n = Ta(),
          { forwardRef: o } = He(),
          i = K$(),
          a = Se(() => {
            var u;
            return (u = i.default) == null ? void 0 : u.call(i);
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
            Zi(window, "scroll", u => {
              const f = u.target;
              f != null && f.contains(n.trigger.value) && n.onClose();
            }),
              Zi(window, Um, n.onClose);
          }),
          (u, f) => (
            ue(),
            _e(
              U(Lm),
              {
                "as-child": "",
                "disable-outside-pointer-events": !1,
                onEscapeKeyDown: f[0] || (f[0] = d => s("escapeKeyDown", d)),
                onPointerDownOutside:
                  f[1] ||
                  (f[1] = d => {
                    var p;
                    U(n).disableClosingTrigger.value &&
                      (p = U(n).trigger.value) != null &&
                      p.contains(d.target) &&
                      d.preventDefault(),
                      s("pointerDownOutside", d);
                  }),
                onFocusOutside: f[2] || (f[2] = _0(() => {}, ["prevent"])),
                onDismiss: f[3] || (f[3] = d => U(n).onClose()),
              },
              {
                default: ie(() => [
                  Ve(
                    U(zE),
                    gt(
                      {
                        ref: U(o),
                        "data-state": U(n).stateAttribute.value,
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
                      default: ie(() => [
                        de(u.$slots, "default"),
                        Ve(
                          U(GE),
                          {
                            id: U(n).contentId,
                            role: "tooltip",
                          },
                          {
                            default: ie(() => [Ss(_n(l.value), 1)]),
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
          { forwardRef: r, currentElement: s } = He(),
          { trigger: n, onClose: o } = Ta(),
          i = su(),
          { isPointerInTransit: a, onPointerExit: l } = Lw(n, s);
        return (
          (i.isPointerInTransitRef = a),
          l(() => {
            o();
          }),
          (c, u) => (
            ue(),
            _e(
              Wm,
              gt({ ref: U(r) }, U(t)),
              {
                default: ie(() => [de(c.$slots, "default")]),
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
          s = t,
          n = Ta(),
          o = ru(r, s),
          { forwardRef: i } = He();
        return (a, l) => (
          ue(),
          _e(
            U(nu),
            {
              present: a.forceMount || U(n).open.value,
            },
            {
              default: ie(() => [
                (ue(),
                _e(
                  B$(U(n).disableHoverableContent.value ? Wm : e1),
                  gt({ ref: U(i) }, U(o)),
                  {
                    default: ie(() => [de(a.$slots, "default")]),
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
          (r, s) => (
            ue(),
            _e(
              U(KE),
              xs(es(t)),
              {
                default: ie(() => [de(r.$slots, "default")]),
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
        return (r, s) => (
          ue(),
          _e(
            U(jm),
            xs(es(t)),
            {
              default: ie(() => [de(r.$slots, "default")]),
              _: 3,
            },
            16
          )
        );
      },
    }),
    ou = "/upwind.css",
    iu = "-";
  function s1(e) {
    const t = i1(e),
      { conflictingClassGroups: r, conflictingClassGroupModifiers: s } = e;
    function n(i) {
      const a = i.split(iu);
      return a[0] === "" && a.length !== 1 && a.shift(), Hm(a, t) || o1(i);
    }
    function o(i, a) {
      const l = r[i] || [];
      return a && s[i] ? [...l, ...s[i]] : l;
    }
    return {
      getClassGroupId: n,
      getConflictingClassGroupIds: o,
    };
  }
  function Hm(e, t) {
    var i;
    if (e.length === 0) return t.classGroupId;
    const r = e[0],
      s = t.nextPart.get(r),
      n = s ? Hm(e.slice(1), s) : void 0;
    if (n) return n;
    if (t.validators.length === 0) return;
    const o = e.join(iu);
    return (i = t.validators.find(({ validator: a }) => a(o))) == null
      ? void 0
      : i.classGroupId;
  }
  const Rd = /^\[(.+)\]$/;
  function o1(e) {
    if (Rd.test(e)) {
      const t = Rd.exec(e)[1],
        r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
      if (r) return "arbitrary.." + r;
    }
  }
  function i1(e) {
    const { theme: t, prefix: r } = e,
      s = {
        nextPart: /* @__PURE__ */ new Map(),
        validators: [],
      };
    return (
      l1(Object.entries(e.classGroups), r).forEach(([o, i]) => {
        oc(i, s, o, t);
      }),
      s
    );
  }
  function oc(e, t, r, s) {
    e.forEach(n => {
      if (typeof n == "string") {
        const o = n === "" ? t : Md(t, n);
        o.classGroupId = r;
        return;
      }
      if (typeof n == "function") {
        if (a1(n)) {
          oc(n(s), t, r, s);
          return;
        }
        t.validators.push({
          validator: n,
          classGroupId: r,
        });
        return;
      }
      Object.entries(n).forEach(([o, i]) => {
        oc(i, Md(t, o), r, s);
      });
    });
  }
  function Md(e, t) {
    let r = e;
    return (
      t.split(iu).forEach(s => {
        r.nextPart.has(s) ||
          r.nextPart.set(s, {
            nextPart: /* @__PURE__ */ new Map(),
            validators: [],
          }),
          (r = r.nextPart.get(s));
      }),
      r
    );
  }
  function a1(e) {
    return e.isThemeGetter;
  }
  function l1(e, t) {
    return t
      ? e.map(([r, s]) => {
          const n = s.map(o =>
            typeof o == "string"
              ? t + o
              : typeof o == "object"
                ? Object.fromEntries(
                    Object.entries(o).map(([i, a]) => [t + i, a])
                  )
                : o
          );
          return [r, n];
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
      s = /* @__PURE__ */ new Map();
    function n(o, i) {
      r.set(o, i),
        t++,
        t > e && ((t = 0), (s = r), (r = /* @__PURE__ */ new Map()));
    }
    return {
      get(o) {
        let i = r.get(o);
        if (i !== void 0) return i;
        if ((i = s.get(o)) !== void 0) return n(o, i), i;
      },
      set(o, i) {
        r.has(o) ? r.set(o, i) : n(o, i);
      },
    };
  }
  const Km = "!";
  function u1(e) {
    const { separator: t, experimentalParseClassName: r } = e,
      s = t.length === 1,
      n = t[0],
      o = t.length;
    function i(a) {
      const l = [];
      let c = 0,
        u = 0,
        f;
      for (let y = 0; y < a.length; y++) {
        let g = a[y];
        if (c === 0) {
          if (g === n && (s || a.slice(y, y + o) === t)) {
            l.push(a.slice(u, y)), (u = y + o);
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
            parseClassName: i,
          });
        }
      : i;
  }
  function f1(e) {
    if (e.length <= 1) return e;
    const t = [];
    let r = [];
    return (
      e.forEach(s => {
        s[0] === "[" ? (t.push(...r.sort(), s), (r = [])) : r.push(s);
      }),
      t.push(...r.sort()),
      t
    );
  }
  function d1(e) {
    return {
      cache: c1(e.cacheSize),
      parseClassName: u1(e),
      ...s1(e),
    };
  }
  const p1 = /\s+/;
  function h1(e, t) {
    const {
        parseClassName: r,
        getClassGroupId: s,
        getConflictingClassGroupIds: n,
      } = t,
      o = /* @__PURE__ */ new Set();
    return e
      .trim()
      .split(p1)
      .map(i => {
        const {
          modifiers: a,
          hasImportantModifier: l,
          baseClassName: c,
          maybePostfixModifierPosition: u,
        } = r(i);
        let f = !!u,
          d = s(f ? c.substring(0, u) : c);
        if (!d) {
          if (!f)
            return {
              isTailwindClass: !1,
              originalClassName: i,
            };
          if (((d = s(c)), !d))
            return {
              isTailwindClass: !1,
              originalClassName: i,
            };
          f = !1;
        }
        const p = f1(a).join(":");
        return {
          isTailwindClass: !0,
          modifierId: l ? p + Km : p,
          classGroupId: d,
          originalClassName: i,
          hasPostfixModifier: f,
        };
      })
      .reverse()
      .filter(i => {
        if (!i.isTailwindClass) return !0;
        const { modifierId: a, classGroupId: l, hasPostfixModifier: c } = i,
          u = a + l;
        return o.has(u)
          ? !1
          : (o.add(u), n(l, c).forEach(f => o.add(a + f)), !0);
      })
      .reverse()
      .map(i => i.originalClassName)
      .join(" ");
  }
  function g1() {
    let e = 0,
      t,
      r,
      s = "";
    for (; e < arguments.length; )
      (t = arguments[e++]) && (r = Gm(t)) && (s && (s += " "), (s += r));
    return s;
  }
  function Gm(e) {
    if (typeof e == "string") return e;
    let t,
      r = "";
    for (let s = 0; s < e.length; s++)
      e[s] && (t = Gm(e[s])) && (r && (r += " "), (r += t));
    return r;
  }
  function m1(e, ...t) {
    let r,
      s,
      n,
      o = i;
    function i(l) {
      const c = t.reduce((u, f) => f(u), e());
      return (r = d1(c)), (s = r.cache.get), (n = r.cache.set), (o = a), a(l);
    }
    function a(l) {
      const c = s(l);
      if (c) return c;
      const u = h1(l, r);
      return n(l, u), u;
    }
    return function () {
      return o(g1.apply(null, arguments));
    };
  }
  function Xe(e) {
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
  function sn(e) {
    return Rs(e, "length", x1);
  }
  function Ln(e) {
    return !!e && !Number.isNaN(Number(e));
  }
  function yi(e) {
    return Rs(e, "number", Ln);
  }
  function Qs(e) {
    return !!e && Number.isInteger(Number(e));
  }
  function O1(e) {
    return e.endsWith("%") && Ln(e.slice(0, -1));
  }
  function xe(e) {
    return qm.test(e);
  }
  function on(e) {
    return _1.test(e);
  }
  const S1 = /* @__PURE__ */ new Set(["length", "size", "percentage"]);
  function A1(e) {
    return Rs(e, S1, Ym);
  }
  function N1(e) {
    return Rs(e, "position", Ym);
  }
  const P1 = /* @__PURE__ */ new Set(["image", "url"]);
  function C1(e) {
    return Rs(e, P1, I1);
  }
  function T1(e) {
    return Rs(e, "", D1);
  }
  function eo() {
    return !0;
  }
  function Rs(e, t, r) {
    const s = qm.exec(e);
    return s
      ? s[1]
        ? typeof t == "string"
          ? s[1] === t
          : t.has(s[1])
        : r(s[2])
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
    const e = Xe("colors"),
      t = Xe("spacing"),
      r = Xe("blur"),
      s = Xe("brightness"),
      n = Xe("borderColor"),
      o = Xe("borderRadius"),
      i = Xe("borderSpacing"),
      a = Xe("borderWidth"),
      l = Xe("contrast"),
      c = Xe("grayscale"),
      u = Xe("hueRotate"),
      f = Xe("invert"),
      d = Xe("gap"),
      p = Xe("gradientColorStops"),
      h = Xe("gradientColorStopPositions"),
      m = Xe("inset"),
      y = Xe("margin"),
      g = Xe("opacity"),
      _ = Xe("padding"),
      E = Xe("saturate"),
      S = Xe("scale"),
      I = Xe("sepia"),
      A = Xe("skew"),
      O = Xe("space"),
      L = Xe("translate"),
      z = () => ["auto", "contain", "none"],
      H = () => ["auto", "hidden", "clip", "visible", "scroll"],
      ne = () => ["auto", xe, t],
      G = () => [xe, t],
      Ne = () => ["", Cr, sn],
      fe = () => ["auto", Ln, xe],
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
      R = () => [Ln, yi],
      M = () => [Ln, xe];
    return {
      cacheSize: 500,
      separator: ":",
      theme: {
        colors: [eo],
        spacing: [Cr, sn],
        blur: ["none", "", on, xe],
        brightness: R(),
        borderColor: [e],
        borderRadius: ["none", "", "full", on, xe],
        borderSpacing: G(),
        borderWidth: Ne(),
        contrast: R(),
        grayscale: Ue(),
        hueRotate: M(),
        invert: Ue(),
        gap: G(),
        gradientColorStops: [e],
        gradientColorStopPositions: [O1, sn],
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
            columns: [on],
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
            z: ["auto", Qs, xe],
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
            order: ["first", "last", "none", Qs, xe],
          },
        ],
        /**
         * Grid Template Columns
         * @see https://tailwindcss.com/docs/grid-template-columns
         */
        "grid-cols": [
          {
            "grid-cols": [eo],
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
                span: ["full", Qs, xe],
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
            "col-start": fe(),
          },
        ],
        /**
         * Grid Column End
         * @see https://tailwindcss.com/docs/grid-column
         */
        "col-end": [
          {
            "col-end": fe(),
          },
        ],
        /**
         * Grid Template Rows
         * @see https://tailwindcss.com/docs/grid-template-rows
         */
        "grid-rows": [
          {
            "grid-rows": [eo],
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
                span: [Qs, xe],
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
            "row-start": fe(),
          },
        ],
        /**
         * Grid Row End
         * @see https://tailwindcss.com/docs/grid-row
         */
        "row-end": [
          {
            "row-end": fe(),
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
                screen: [on],
              },
              on,
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
            text: ["base", on, sn],
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
              yi,
            ],
          },
        ],
        /**
         * Font Family
         * @see https://tailwindcss.com/docs/font-family
         */
        "font-family": [
          {
            font: [eo],
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
            "line-clamp": ["none", Ln, yi],
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
            decoration: ["auto", "from-font", Cr, sn],
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
            rounded: [o],
          },
        ],
        /**
         * Border Radius Start
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-s": [
          {
            "rounded-s": [o],
          },
        ],
        /**
         * Border Radius End
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-e": [
          {
            "rounded-e": [o],
          },
        ],
        /**
         * Border Radius Top
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-t": [
          {
            "rounded-t": [o],
          },
        ],
        /**
         * Border Radius Right
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-r": [
          {
            "rounded-r": [o],
          },
        ],
        /**
         * Border Radius Bottom
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-b": [
          {
            "rounded-b": [o],
          },
        ],
        /**
         * Border Radius Left
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-l": [
          {
            "rounded-l": [o],
          },
        ],
        /**
         * Border Radius Start Start
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-ss": [
          {
            "rounded-ss": [o],
          },
        ],
        /**
         * Border Radius Start End
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-se": [
          {
            "rounded-se": [o],
          },
        ],
        /**
         * Border Radius End End
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-ee": [
          {
            "rounded-ee": [o],
          },
        ],
        /**
         * Border Radius End Start
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-es": [
          {
            "rounded-es": [o],
          },
        ],
        /**
         * Border Radius Top Left
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-tl": [
          {
            "rounded-tl": [o],
          },
        ],
        /**
         * Border Radius Top Right
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-tr": [
          {
            "rounded-tr": [o],
          },
        ],
        /**
         * Border Radius Bottom Right
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-br": [
          {
            "rounded-br": [o],
          },
        ],
        /**
         * Border Radius Bottom Left
         * @see https://tailwindcss.com/docs/border-radius
         */
        "rounded-bl": [
          {
            "rounded-bl": [o],
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
            border: [n],
          },
        ],
        /**
         * Border Color X
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-x": [
          {
            "border-x": [n],
          },
        ],
        /**
         * Border Color Y
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-y": [
          {
            "border-y": [n],
          },
        ],
        /**
         * Border Color Top
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-t": [
          {
            "border-t": [n],
          },
        ],
        /**
         * Border Color Right
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-r": [
          {
            "border-r": [n],
          },
        ],
        /**
         * Border Color Bottom
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-b": [
          {
            "border-b": [n],
          },
        ],
        /**
         * Border Color Left
         * @see https://tailwindcss.com/docs/border-color
         */
        "border-color-l": [
          {
            "border-l": [n],
          },
        ],
        /**
         * Divide Color
         * @see https://tailwindcss.com/docs/divide-color
         */
        "divide-color": [
          {
            divide: [n],
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
            outline: [Cr, sn],
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
            "ring-offset": [Cr, sn],
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
            shadow: ["", "inner", "none", on, T1],
          },
        ],
        /**
         * Box Shadow Color
         * @see https://tailwindcss.com/docs/box-shadow-color
         */
        "shadow-color": [
          {
            shadow: [eo],
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
            brightness: [s],
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
            "drop-shadow": ["", "none", on, xe],
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
            "backdrop-brightness": [s],
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
            "border-spacing": [i],
          },
        ],
        /**
         * Border Spacing X
         * @see https://tailwindcss.com/docs/border-spacing
         */
        "border-spacing-x": [
          {
            "border-spacing-x": [i],
          },
        ],
        /**
         * Border Spacing Y
         * @see https://tailwindcss.com/docs/border-spacing
         */
        "border-spacing-y": [
          {
            "border-spacing-y": [i],
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
            rotate: [Qs, xe],
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
            stroke: [Cr, sn, yi],
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
      s = "";
    if (typeof e == "string" || typeof e == "number") s += e;
    else if (typeof e == "object")
      if (Array.isArray(e)) {
        var n = e.length;
        for (t = 0; t < n; t++)
          e[t] && (r = Jm(e[t])) && (s && (s += " "), (s += r));
      } else for (r in e) e[r] && (s && (s += " "), (s += r));
    return s;
  }
  function j1() {
    for (var e, t, r = 0, s = "", n = arguments.length; r < n; r++)
      (e = arguments[r]) && (t = Jm(e)) && (s && (s += " "), (s += t));
    return s;
  }
  var Xm =
      typeof global == "object" && global && global.Object === Object && global,
    F1 = typeof self == "object" && self && self.Object === Object && self,
    Qr = Xm || F1 || Function("return this")(),
    Sr = Qr.Symbol,
    Zm = Object.prototype,
    L1 = Zm.hasOwnProperty,
    V1 = Zm.toString,
    to = Sr ? Sr.toStringTag : void 0;
  function k1(e) {
    var t = L1.call(e, to),
      r = e[to];
    try {
      e[to] = void 0;
      var s = !0;
    } catch {}
    var n = V1.call(e);
    return s && (t ? (e[to] = r) : delete e[to]), n;
  }
  var B1 = Object.prototype,
    z1 = B1.toString;
  function U1(e) {
    return z1.call(e);
  }
  var W1 = "[object Null]",
    H1 = "[object Undefined]",
    jd = Sr ? Sr.toStringTag : void 0;
  function ns(e) {
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
    return typeof e == "symbol" || (Yn(e) && ns(e) == K1);
  }
  function Da(e, t) {
    for (var r = -1, s = e == null ? 0 : e.length, n = Array(s); ++r < s; )
      n[r] = t(e[r], r, e);
    return n;
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
  function sO(e) {
    if (!e) return e === 0 ? e : 0;
    if (((e = rO(e)), e === kd || e === -kd)) {
      var t = e < 0 ? -1 : 1;
      return t * nO;
    }
    return e === e ? e : 0;
  }
  function ev(e) {
    var t = sO(e),
      r = t % 1;
    return t === t ? (r ? t - r : t) : 0;
  }
  function tv(e) {
    return e;
  }
  var oO = "[object AsyncFunction]",
    iO = "[object Function]",
    aO = "[object GeneratorFunction]",
    lO = "[object Proxy]";
  function au(e) {
    if (!ur(e)) return !1;
    var t = ns(e);
    return t == iO || t == aO || t == oO || t == lO;
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
  function ss(e) {
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
    return t.test(ss(e));
  }
  function $O(e, t) {
    return e == null ? void 0 : e[t];
  }
  function os(e, t) {
    var r = $O(e, t);
    return _O(r) ? r : void 0;
  }
  var ic = os(Qr, "WeakMap"),
    zd = (function () {
      try {
        var e = os(Object, "defineProperty");
        return e({}, "", {}), e;
      } catch {}
    })();
  function bO(e, t) {
    for (
      var r = -1, s = e == null ? 0 : e.length;
      ++r < s && t(e[r], r, e) !== !1;

    );
    return e;
  }
  function rv(e, t, r, s) {
    for (var n = e.length, o = r + -1; ++o < n; ) if (t(e[o], o, e)) return o;
    return -1;
  }
  function wO(e) {
    return e !== e;
  }
  function EO(e, t, r) {
    for (var s = r - 1, n = e.length; ++s < n; ) if (e[s] === t) return s;
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
    var s = e[t];
    (!(PO.call(e, t) && cu(s, r)) || (r === void 0 && !(t in e))) &&
      nv(e, t, r);
  }
  var TO = 9007199254740991;
  function uu(e) {
    return typeof e == "number" && e > -1 && e % 1 == 0 && e <= TO;
  }
  function is(e) {
    return e != null && uu(e.length) && !au(e);
  }
  var xO = Object.prototype;
  function fu(e) {
    var t = e && e.constructor,
      r = (typeof t == "function" && t.prototype) || xO;
    return e === r;
  }
  function DO(e, t) {
    for (var r = -1, s = Array(e); ++r < e; ) s[r] = t(r);
    return s;
  }
  var IO = "[object Arguments]";
  function Ud(e) {
    return Yn(e) && ns(e) == IO;
  }
  var sv = Object.prototype,
    RO = sv.hasOwnProperty,
    MO = sv.propertyIsEnumerable,
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
  var ov = typeof Mr == "object" && Mr && !Mr.nodeType && Mr,
    Wd = ov && typeof jr == "object" && jr && !jr.nodeType && jr,
    FO = Wd && Wd.exports === ov,
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
    sS = "[object Int32Array]",
    oS = "[object Uint8Array]",
    iS = "[object Uint8ClampedArray]",
    aS = "[object Uint16Array]",
    lS = "[object Uint32Array]",
    Ze = {};
  Ze[eS] =
    Ze[tS] =
    Ze[rS] =
    Ze[nS] =
    Ze[sS] =
    Ze[oS] =
    Ze[iS] =
    Ze[aS] =
    Ze[lS] =
      !0;
  Ze[VO] =
    Ze[kO] =
    Ze[ZO] =
    Ze[BO] =
    Ze[QO] =
    Ze[zO] =
    Ze[UO] =
    Ze[WO] =
    Ze[HO] =
    Ze[KO] =
    Ze[GO] =
    Ze[qO] =
    Ze[YO] =
    Ze[JO] =
    Ze[XO] =
      !1;
  function cS(e) {
    return Yn(e) && uu(e.length) && !!Ze[ns(e)];
  }
  function uS(e) {
    return function (t) {
      return e(t);
    };
  }
  var iv = typeof Mr == "object" && Mr && !Mr.nodeType && Mr,
    yo = iv && typeof jr == "object" && jr && !jr.nodeType && jr,
    fS = yo && yo.exports === iv,
    ml = fS && Xm.process,
    Kd = (function () {
      try {
        var e = yo && yo.require && yo.require("util").types;
        return e || (ml && ml.binding && ml.binding("util"));
      } catch {}
    })(),
    Gd = Kd && Kd.isTypedArray,
    du = Gd ? uS(Gd) : cS,
    dS = Object.prototype,
    pS = dS.hasOwnProperty;
  function av(e, t) {
    var r = Tt(e),
      s = !r && Ia(e),
      n = !r && !s && ea(e),
      o = !r && !s && !n && du(e),
      i = r || s || n || o,
      a = i ? DO(e.length, String) : [],
      l = a.length;
    for (var c in e)
      (t || pS.call(e, c)) &&
        !(
          i && // Safari 9 has enumerable `arguments.length` in strict mode.
          (c == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            (n && (c == "offset" || c == "parent")) || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            (o && (c == "buffer" || c == "byteLength" || c == "byteOffset")) || // Skip index properties.
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
  function Wo(e) {
    return is(e) ? av(e) : cv(e);
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
    for (var s in e) (s == "constructor" && (t || !_S.call(e, s))) || r.push(s);
    return r;
  }
  function bS(e) {
    return is(e) ? av(e, !0) : $S(e);
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
  var xo = os(Object, "create");
  function OS() {
    (this.__data__ = xo ? xo(null) : {}), (this.size = 0);
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
    if (xo) {
      var r = t[e];
      return r === AS ? void 0 : r;
    }
    return PS.call(t, e) ? t[e] : void 0;
  }
  var TS = Object.prototype,
    xS = TS.hasOwnProperty;
  function DS(e) {
    var t = this.__data__;
    return xo ? t[e] !== void 0 : xS.call(t, e);
  }
  var IS = "__lodash_hash_undefined__";
  function RS(e, t) {
    var r = this.__data__;
    return (
      (this.size += this.has(e) ? 0 : 1),
      (r[e] = xo && t === void 0 ? IS : t),
      this
    );
  }
  function Jn(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var s = e[t];
      this.set(s[0], s[1]);
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
    var s = t.length - 1;
    return r == s ? t.pop() : FS.call(t, r, 1), --this.size, !0;
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
      s = Ra(r, e);
    return s < 0 ? (++this.size, r.push([e, t])) : (r[s][1] = t), this;
  }
  function en(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var s = e[t];
      this.set(s[0], s[1]);
    }
  }
  en.prototype.clear = MS;
  en.prototype.delete = LS;
  en.prototype.get = VS;
  en.prototype.has = kS;
  en.prototype.set = BS;
  var Do = os(Qr, "Map");
  function zS() {
    (this.size = 0),
      (this.__data__ = {
        hash: new Jn(),
        map: new (Do || en)(),
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
      s = r.size;
    return r.set(e, t), (this.size += r.size == s ? 0 : 1), this;
  }
  function tn(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var s = e[t];
      this.set(s[0], s[1]);
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
      var s = arguments,
        n = t ? t.apply(this, s) : s[0],
        o = r.cache;
      if (o.has(n)) return o.get(n);
      var i = e.apply(this, s);
      return (r.cache = o.set(n, i) || o), i;
    };
    return (r.cache = new (hu.Cache || tn)()), r;
  }
  hu.Cache = tn;
  var YS = 500;
  function JS(e) {
    var t = hu(e, function (s) {
        return r.size === YS && r.clear(), s;
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
        e.replace(XS, function (r, s, n, o) {
          t.push(n ? o.replace(ZS, "$1") : s || r);
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
  function Ho(e) {
    if (typeof e == "string" || xa(e)) return e;
    var t = e + "";
    return t == "0" && 1 / e == -tA ? "-0" : t;
  }
  function gu(e, t) {
    t = ja(t, e);
    for (var r = 0, s = t.length; e != null && r < s; ) e = e[Ho(t[r++])];
    return r && r == s ? e : void 0;
  }
  function mu(e, t, r) {
    var s = e == null ? void 0 : gu(e, t);
    return s === void 0 ? r : s;
  }
  function uv(e, t) {
    for (var r = -1, s = t.length, n = e.length; ++r < s; ) e[n + r] = t[r];
    return e;
  }
  var qd = Sr ? Sr.isConcatSpreadable : void 0;
  function rA(e) {
    return Tt(e) || Ia(e) || !!(qd && e && e[qd]);
  }
  function fv(e, t, r, s, n) {
    var o = -1,
      i = e.length;
    for (r || (r = rA), n || (n = []); ++o < i; ) {
      var a = e[o];
      r(a) ? fv(a, t - 1, r, s, n) : (n[n.length] = a);
    }
    return n;
  }
  var nA = lv(Object.getPrototypeOf, Object);
  function sA(e, t, r, s) {
    var n = -1,
      o = e == null ? 0 : e.length;
    for (s && o && (r = e[++n]); ++n < o; ) r = t(r, e[n], n, e);
    return r;
  }
  function oA() {
    (this.__data__ = new en()), (this.size = 0);
  }
  function iA(e) {
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
      var s = r.__data__;
      if (!Do || s.length < cA - 1)
        return s.push([e, t]), (this.size = ++r.size), this;
      r = this.__data__ = new tn(s);
    }
    return r.set(e, t), (this.size = r.size), this;
  }
  function kr(e) {
    var t = (this.__data__ = new en(e));
    this.size = t.size;
  }
  kr.prototype.clear = oA;
  kr.prototype.delete = iA;
  kr.prototype.get = aA;
  kr.prototype.has = lA;
  kr.prototype.set = uA;
  function fA(e, t) {
    for (var r = -1, s = e == null ? 0 : e.length, n = 0, o = []; ++r < s; ) {
      var i = e[r];
      t(i, r, e) && (o[n++] = i);
    }
    return o;
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
    var s = t(e);
    return Tt(e) ? s : uv(s, r(e));
  }
  function Jd(e) {
    return hv(e, Wo, pv);
  }
  function mA(e) {
    return hv(e, bS, gA);
  }
  var ac = os(Qr, "DataView"),
    lc = os(Qr, "Promise"),
    cc = os(Qr, "Set"),
    Xd = "[object Map]",
    vA = "[object Object]",
    Zd = "[object Promise]",
    Qd = "[object Set]",
    ep = "[object WeakMap]",
    tp = "[object DataView]",
    yA = ss(ac),
    _A = ss(Do),
    $A = ss(lc),
    bA = ss(cc),
    wA = ss(ic),
    Rr = ns;
  ((ac && Rr(new ac(new ArrayBuffer(1))) != tp) ||
    (Do && Rr(new Do()) != Xd) ||
    (lc && Rr(lc.resolve()) != Zd) ||
    (cc && Rr(new cc()) != Qd) ||
    (ic && Rr(new ic()) != ep)) &&
    (Rr = function (e) {
      var t = ns(e),
        r = t == vA ? e.constructor : void 0,
        s = r ? ss(r) : "";
      if (s)
        switch (s) {
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
    for (var r = -1, s = e == null ? 0 : e.length; ++r < s; )
      if (t(e[r], r, e)) return !0;
    return !1;
  }
  function NA(e, t) {
    return e.has(t);
  }
  var PA = 1,
    CA = 2;
  function gv(e, t, r, s, n, o) {
    var i = r & PA,
      a = e.length,
      l = t.length;
    if (a != l && !(i && l > a)) return !1;
    var c = o.get(e),
      u = o.get(t);
    if (c && u) return c == t && u == e;
    var f = -1,
      d = !0,
      p = r & CA ? new ta() : void 0;
    for (o.set(e, t), o.set(t, e); ++f < a; ) {
      var h = e[f],
        m = t[f];
      if (s) var y = i ? s(m, h, f, t, e, o) : s(h, m, f, e, t, o);
      if (y !== void 0) {
        if (y) continue;
        d = !1;
        break;
      }
      if (p) {
        if (
          !AA(t, function (g, _) {
            if (!NA(p, _) && (h === g || n(h, g, r, s, o))) return p.push(_);
          })
        ) {
          d = !1;
          break;
        }
      } else if (!(h === m || n(h, m, r, s, o))) {
        d = !1;
        break;
      }
    }
    return o.delete(e), o.delete(t), d;
  }
  function TA(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (s, n) {
        r[++t] = [n, s];
      }),
      r
    );
  }
  function xA(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (s) {
        r[++t] = s;
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
  function HA(e, t, r, s, n, o, i) {
    switch (r) {
      case WA:
        if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
          return !1;
        (e = e.buffer), (t = t.buffer);
      case UA:
        return !(e.byteLength != t.byteLength || !o(new rp(e), new rp(t)));
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
        var l = s & DA;
        if ((a || (a = xA), e.size != t.size && !l)) return !1;
        var c = i.get(e);
        if (c) return c == t;
        (s |= IA), i.set(e, t);
        var u = gv(a(e), a(t), s, n, o, i);
        return i.delete(e), u;
      case zA:
        if (vl) return vl.call(e) == vl.call(t);
    }
    return !1;
  }
  var KA = 1,
    GA = Object.prototype,
    qA = GA.hasOwnProperty;
  function YA(e, t, r, s, n, o) {
    var i = r & KA,
      a = Jd(e),
      l = a.length,
      c = Jd(t),
      u = c.length;
    if (l != u && !i) return !1;
    for (var f = l; f--; ) {
      var d = a[f];
      if (!(i ? d in t : qA.call(t, d))) return !1;
    }
    var p = o.get(e),
      h = o.get(t);
    if (p && h) return p == t && h == e;
    var m = !0;
    o.set(e, t), o.set(t, e);
    for (var y = i; ++f < l; ) {
      d = a[f];
      var g = e[d],
        _ = t[d];
      if (s) var E = i ? s(_, g, d, t, e, o) : s(g, _, d, e, t, o);
      if (!(E === void 0 ? g === _ || n(g, _, r, s, o) : E)) {
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
    return o.delete(e), o.delete(t), m;
  }
  var JA = 1,
    sp = "[object Arguments]",
    op = "[object Array]",
    _i = "[object Object]",
    XA = Object.prototype,
    ip = XA.hasOwnProperty;
  function ZA(e, t, r, s, n, o) {
    var i = Tt(e),
      a = Tt(t),
      l = i ? op : Rr(e),
      c = a ? op : Rr(t);
    (l = l == sp ? _i : l), (c = c == sp ? _i : c);
    var u = l == _i,
      f = c == _i,
      d = l == c;
    if (d && ea(e)) {
      if (!ea(t)) return !1;
      (i = !0), (u = !1);
    }
    if (d && !u)
      return (
        o || (o = new kr()),
        i || du(e) ? gv(e, t, r, s, n, o) : HA(e, t, l, r, s, n, o)
      );
    if (!(r & JA)) {
      var p = u && ip.call(e, "__wrapped__"),
        h = f && ip.call(t, "__wrapped__");
      if (p || h) {
        var m = p ? e.value() : e,
          y = h ? t.value() : t;
        return o || (o = new kr()), n(m, y, r, s, o);
      }
    }
    return d ? (o || (o = new kr()), YA(e, t, r, s, n, o)) : !1;
  }
  function vu(e, t, r, s, n) {
    return e === t
      ? !0
      : e == null || t == null || (!Yn(e) && !Yn(t))
        ? e !== e && t !== t
        : ZA(e, t, r, s, vu, n);
  }
  var QA = 1,
    eN = 2;
  function tN(e, t, r, s) {
    var n = r.length,
      o = n;
    if (e == null) return !o;
    for (e = Object(e); n--; ) {
      var i = r[n];
      if (i[2] ? i[1] !== e[i[0]] : !(i[0] in e)) return !1;
    }
    for (; ++n < o; ) {
      i = r[n];
      var a = i[0],
        l = e[a],
        c = i[1];
      if (i[2]) {
        if (l === void 0 && !(a in e)) return !1;
      } else {
        var u = new kr(),
          f;
        if (!(f === void 0 ? vu(c, l, QA | eN, s, u) : f)) return !1;
      }
    }
    return !0;
  }
  function mv(e) {
    return e === e && !ur(e);
  }
  function rN(e) {
    for (var t = Wo(e), r = t.length; r--; ) {
      var s = t[r],
        n = e[s];
      t[r] = [s, n, mv(n)];
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
  function sN(e, t) {
    return e != null && t in Object(e);
  }
  function oN(e, t, r) {
    t = ja(t, e);
    for (var s = -1, n = t.length, o = !1; ++s < n; ) {
      var i = Ho(t[s]);
      if (!(o = e != null && r(e, i))) break;
      e = e[i];
    }
    return o || ++s != n
      ? o
      : ((n = e == null ? 0 : e.length),
        !!n && uu(n) && lu(i, n) && (Tt(e) || Ia(e)));
  }
  function iN(e, t) {
    return e != null && oN(e, t, sN);
  }
  var aN = 1,
    lN = 2;
  function cN(e, t) {
    return pu(e) && mv(t)
      ? vv(Ho(e), t)
      : function (r) {
          var s = mu(r, e);
          return s === void 0 && s === t ? iN(r, e) : vu(t, s, aN | lN);
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
    return pu(e) ? uN(Ho(e)) : fN(e);
  }
  function as(e) {
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
    return function (t, r, s) {
      for (var n = -1, o = Object(t), i = s(t), a = i.length; a--; ) {
        var l = i[++n];
        if (r(o[l], l, o) === !1) break;
      }
      return t;
    };
  }
  var hN = pN();
  function yv(e, t) {
    return e && hN(e, t, Wo);
  }
  function gN(e, t) {
    return function (r, s) {
      if (r == null) return r;
      if (!is(r)) return e(r, s);
      for (
        var n = r.length, o = -1, i = Object(r);
        ++o < n && s(i[o], o, i) !== !1;

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
    return function (t, r, s) {
      var n = Object(t);
      if (!is(t)) {
        var o = as(r);
        (t = Wo(t)),
          (r = function (a) {
            return o(n[a], a, n);
          });
      }
      var i = e(t, r, s);
      return i > -1 ? n[o ? t[i] : i] : void 0;
    };
  }
  var _N = Math.max;
  function $N(e, t, r) {
    var s = e == null ? 0 : e.length;
    if (!s) return -1;
    var n = r == null ? 0 : ev(r);
    return n < 0 && (n = _N(s + n, 0)), rv(e, as(t), n);
  }
  var bN = yN($N);
  function wN(e, t) {
    var r = -1,
      s = is(e) ? Array(e.length) : [];
    return (
      yu(e, function (n, o, i) {
        s[++r] = t(n, o, i);
      }),
      s
    );
  }
  function ap(e, t) {
    var r = Tt(e) ? Da : wN;
    return r(e, as(t));
  }
  var EN = 1 / 0;
  function ON(e) {
    var t = e == null ? 0 : e.length;
    return t ? fv(e, EN) : [];
  }
  var SN = "[object String]";
  function AN(e) {
    return typeof e == "string" || (!Tt(e) && Yn(e) && ns(e) == SN);
  }
  function NN(e, t) {
    return Da(t, function (r) {
      return e[r];
    });
  }
  function PN(e) {
    return e == null ? [] : NN(e, Wo(e));
  }
  var CN = Math.max;
  function TN(e, t, r, s) {
    (e = is(e) ? e : PN(e)), (r = r && !s ? ev(r) : 0);
    var n = e.length;
    return (
      r < 0 && (r = CN(n + r, 0)),
      AN(e) ? r <= n && e.indexOf(t, r) > -1 : !!n && OO(e, t, r) > -1
    );
  }
  var xN = "[object Map]",
    DN = "[object Set]",
    IN = Object.prototype,
    RN = IN.hasOwnProperty;
  function _o(e) {
    if (e == null) return !0;
    if (
      is(e) &&
      (Tt(e) ||
        typeof e == "string" ||
        typeof e.splice == "function" ||
        ea(e) ||
        du(e) ||
        Ia(e))
    )
      return !e.length;
    var t = Rr(e);
    if (t == xN || t == DN) return !e.size;
    if (fu(e)) return !cv(e).length;
    for (var r in e) if (RN.call(e, r)) return !1;
    return !0;
  }
  function MN(e) {
    return e == null;
  }
  function jN(e, t) {
    var r = {};
    return (
      (t = as(t)),
      yv(e, function (s, n, o) {
        nv(r, n, t(s, n, o));
      }),
      r
    );
  }
  var FN = "Expected a function";
  function LN(e) {
    if (typeof e != "function") throw new TypeError(FN);
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
  function _v(e, t, r, s) {
    if (!ur(e)) return e;
    t = ja(t, e);
    for (var n = -1, o = t.length, i = o - 1, a = e; a != null && ++n < o; ) {
      var l = Ho(t[n]),
        c = r;
      if (l === "__proto__" || l === "constructor" || l === "prototype")
        return e;
      if (n != i) {
        var u = a[l];
        (c = void 0), c === void 0 && (c = ur(u) ? u : lu(t[n + 1]) ? [] : {});
      }
      CO(a, l, c), (a = a[l]);
    }
    return e;
  }
  function VN(e, t, r) {
    for (var s = -1, n = t.length, o = {}; ++s < n; ) {
      var i = t[s],
        a = gu(e, i);
      r(a, i) && _v(o, ja(i, e), a);
    }
    return o;
  }
  function kN(e, t) {
    if (e == null) return {};
    var r = Da(mA(e), function (s) {
      return [s];
    });
    return (
      (t = as(t)),
      VN(e, r, function (s, n) {
        return t(s, n[0]);
      })
    );
  }
  function BN(e, t) {
    return kN(e, LN(as(t)));
  }
  function zN(e, t, r, s, n) {
    return (
      n(e, function (o, i, a) {
        r = s ? ((s = !1), o) : t(r, o, i, a);
      }),
      r
    );
  }
  function $v(e, t, r) {
    var s = Tt(e) ? sA : zN,
      n = arguments.length < 3;
    return s(e, as(t), r, n, yu);
  }
  function bv(e, t, r) {
    return e == null ? e : _v(e, t, r);
  }
  const UN = Oe(),
    WN = Oe({}),
    HN = Oe(),
    yl = {
      activeTheme: UN,
      config: WN,
      providedThemes: HN,
    };
  function KN(e, t = {}) {
    const r = e.map(Object.keys).flat();
    return $v(
      r,
      (s, n) => {
        const o = ap(e, a => mu(a, n, {})),
          i = ap(o, a => (au(a) ? a(t) : a));
        return bv(s, n, M1(j1(...i))), s;
      },
      {}
    );
  }
  function fr(e, t = {}, ...r) {
    return Se(() => {
      (e = Tt(e) ? e : [e]), (r = ON(r));
      const s = U(yl == null ? void 0 : yl.config);
      _o(s) || r.push(s);
      const n = BN(
          jN(U(t), i => U(i)),
          MN
        ),
        o = {};
      return (
        vN(e, i => {
          const a = $v(
            r,
            (l, c) => {
              c = Te(U(c));
              const u = mu(c, i);
              return ur(u) && !_o(u) && l.push(u), l;
            },
            []
          );
          bv(o, i, KN(a, n));
        }),
        o
      );
    });
  }
  var lo =
      typeof globalThis < "u"
        ? globalThis
        : typeof window < "u"
          ? window
          : typeof global < "u"
            ? global
            : typeof self < "u"
              ? self
              : {},
    GN = Object.prototype;
  function qN(e) {
    var t = e && e.constructor,
      r = (typeof t == "function" && t.prototype) || GN;
    return e === r;
  }
  var _u = qN;
  function YN(e, t) {
    return function (r) {
      return e(t(r));
    };
  }
  var wv = YN,
    JN = wv,
    XN = JN(Object.keys, Object),
    ZN = XN,
    QN = _u,
    eP = ZN,
    tP = Object.prototype,
    rP = tP.hasOwnProperty;
  function nP(e) {
    if (!QN(e)) return eP(e);
    var t = [];
    for (var r in Object(e)) rP.call(e, r) && r != "constructor" && t.push(r);
    return t;
  }
  var Ev = nP,
    sP = typeof lo == "object" && lo && lo.Object === Object && lo,
    Ov = sP,
    oP = Ov,
    iP = typeof self == "object" && self && self.Object === Object && self,
    aP = oP || iP || Function("return this")(),
    Bt = aP,
    lP = Bt,
    cP = lP.Symbol,
    Ms = cP,
    lp = Ms,
    Sv = Object.prototype,
    uP = Sv.hasOwnProperty,
    fP = Sv.toString,
    ro = lp ? lp.toStringTag : void 0;
  function dP(e) {
    var t = uP.call(e, ro),
      r = e[ro];
    try {
      e[ro] = void 0;
      var s = !0;
    } catch {}
    var n = fP.call(e);
    return s && (t ? (e[ro] = r) : delete e[ro]), n;
  }
  var pP = dP,
    hP = Object.prototype,
    gP = hP.toString;
  function mP(e) {
    return gP.call(e);
  }
  var vP = mP,
    cp = Ms,
    yP = pP,
    _P = vP,
    $P = "[object Null]",
    bP = "[object Undefined]",
    up = cp ? cp.toStringTag : void 0;
  function wP(e) {
    return e == null
      ? e === void 0
        ? bP
        : $P
      : up && up in Object(e)
        ? yP(e)
        : _P(e);
  }
  var ls = wP;
  function EP(e) {
    var t = typeof e;
    return e != null && (t == "object" || t == "function");
  }
  var er = EP,
    OP = ls,
    SP = er,
    AP = "[object AsyncFunction]",
    NP = "[object Function]",
    PP = "[object GeneratorFunction]",
    CP = "[object Proxy]";
  function TP(e) {
    if (!SP(e)) return !1;
    var t = OP(e);
    return t == NP || t == PP || t == AP || t == CP;
  }
  var Fa = TP,
    xP = Bt,
    DP = xP["__core-js_shared__"],
    IP = DP,
    _l = IP,
    fp = (function () {
      var e = /[^.]+$/.exec((_l && _l.keys && _l.keys.IE_PROTO) || "");
      return e ? "Symbol(src)_1." + e : "";
    })();
  function RP(e) {
    return !!fp && fp in e;
  }
  var MP = RP,
    jP = Function.prototype,
    FP = jP.toString;
  function LP(e) {
    if (e != null) {
      try {
        return FP.call(e);
      } catch {}
      try {
        return e + "";
      } catch {}
    }
    return "";
  }
  var Av = LP,
    VP = Fa,
    kP = MP,
    BP = er,
    zP = Av,
    UP = /[\\^$.*+?()[\]{}|]/g,
    WP = /^\[object .+?Constructor\]$/,
    HP = Function.prototype,
    KP = Object.prototype,
    GP = HP.toString,
    qP = KP.hasOwnProperty,
    YP = RegExp(
      "^" +
        GP.call(qP)
          .replace(UP, "\\$&")
          .replace(
            /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
            "$1.*?"
          ) +
        "$"
    );
  function JP(e) {
    if (!BP(e) || kP(e)) return !1;
    var t = VP(e) ? YP : WP;
    return t.test(zP(e));
  }
  var XP = JP;
  function ZP(e, t) {
    return e == null ? void 0 : e[t];
  }
  var QP = ZP,
    eC = XP,
    tC = QP;
  function rC(e, t) {
    var r = tC(e, t);
    return eC(r) ? r : void 0;
  }
  var cs = rC,
    nC = cs,
    sC = Bt,
    oC = nC(sC, "DataView"),
    iC = oC,
    aC = cs,
    lC = Bt,
    cC = aC(lC, "Map"),
    $u = cC,
    uC = cs,
    fC = Bt,
    dC = uC(fC, "Promise"),
    pC = dC,
    hC = cs,
    gC = Bt,
    mC = hC(gC, "Set"),
    vC = mC,
    yC = cs,
    _C = Bt,
    $C = yC(_C, "WeakMap"),
    Nv = $C,
    uc = iC,
    fc = $u,
    dc = pC,
    pc = vC,
    hc = Nv,
    Pv = ls,
    js = Av,
    dp = "[object Map]",
    bC = "[object Object]",
    pp = "[object Promise]",
    hp = "[object Set]",
    gp = "[object WeakMap]",
    mp = "[object DataView]",
    wC = js(uc),
    EC = js(fc),
    OC = js(dc),
    SC = js(pc),
    AC = js(hc),
    In = Pv;
  ((uc && In(new uc(new ArrayBuffer(1))) != mp) ||
    (fc && In(new fc()) != dp) ||
    (dc && In(dc.resolve()) != pp) ||
    (pc && In(new pc()) != hp) ||
    (hc && In(new hc()) != gp)) &&
    (In = function (e) {
      var t = Pv(e),
        r = t == bC ? e.constructor : void 0,
        s = r ? js(r) : "";
      if (s)
        switch (s) {
          case wC:
            return mp;
          case EC:
            return dp;
          case OC:
            return pp;
          case SC:
            return hp;
          case AC:
            return gp;
        }
      return t;
    });
  var Ko = In;
  function NC(e) {
    return e != null && typeof e == "object";
  }
  var tr = NC,
    PC = ls,
    CC = tr,
    TC = "[object Arguments]";
  function xC(e) {
    return CC(e) && PC(e) == TC;
  }
  var DC = xC,
    vp = DC,
    IC = tr,
    Cv = Object.prototype,
    RC = Cv.hasOwnProperty,
    MC = Cv.propertyIsEnumerable,
    jC = vp(
      /* @__PURE__ */ (function () {
        return arguments;
      })()
    )
      ? vp
      : function (e) {
          return IC(e) && RC.call(e, "callee") && !MC.call(e, "callee");
        },
    La = jC,
    FC = Array.isArray,
    zt = FC,
    LC = 9007199254740991;
  function VC(e) {
    return typeof e == "number" && e > -1 && e % 1 == 0 && e <= LC;
  }
  var bu = VC,
    kC = Fa,
    BC = bu;
  function zC(e) {
    return e != null && BC(e.length) && !kC(e);
  }
  var Va = zC,
    ra = { exports: {} };
  function UC() {
    return !1;
  }
  var WC = UC;
  ra.exports;
  (function (e, t) {
    var r = Bt,
      s = WC,
      n = t && !t.nodeType && t,
      o = n && !0 && e && !e.nodeType && e,
      i = o && o.exports === n,
      a = i ? r.Buffer : void 0,
      l = a ? a.isBuffer : void 0,
      c = l || s;
    e.exports = c;
  })(ra, ra.exports);
  var ka = ra.exports,
    HC = ls,
    KC = bu,
    GC = tr,
    qC = "[object Arguments]",
    YC = "[object Array]",
    JC = "[object Boolean]",
    XC = "[object Date]",
    ZC = "[object Error]",
    QC = "[object Function]",
    eT = "[object Map]",
    tT = "[object Number]",
    rT = "[object Object]",
    nT = "[object RegExp]",
    sT = "[object Set]",
    oT = "[object String]",
    iT = "[object WeakMap]",
    aT = "[object ArrayBuffer]",
    lT = "[object DataView]",
    cT = "[object Float32Array]",
    uT = "[object Float64Array]",
    fT = "[object Int8Array]",
    dT = "[object Int16Array]",
    pT = "[object Int32Array]",
    hT = "[object Uint8Array]",
    gT = "[object Uint8ClampedArray]",
    mT = "[object Uint16Array]",
    vT = "[object Uint32Array]",
    Qe = {};
  Qe[cT] =
    Qe[uT] =
    Qe[fT] =
    Qe[dT] =
    Qe[pT] =
    Qe[hT] =
    Qe[gT] =
    Qe[mT] =
    Qe[vT] =
      !0;
  Qe[qC] =
    Qe[YC] =
    Qe[aT] =
    Qe[JC] =
    Qe[lT] =
    Qe[XC] =
    Qe[ZC] =
    Qe[QC] =
    Qe[eT] =
    Qe[tT] =
    Qe[rT] =
    Qe[nT] =
    Qe[sT] =
    Qe[oT] =
    Qe[iT] =
      !1;
  function yT(e) {
    return GC(e) && KC(e.length) && !!Qe[HC(e)];
  }
  var _T = yT;
  function $T(e) {
    return function (t) {
      return e(t);
    };
  }
  var wu = $T,
    na = { exports: {} };
  na.exports;
  (function (e, t) {
    var r = Ov,
      s = t && !t.nodeType && t,
      n = s && !0 && e && !e.nodeType && e,
      o = n && n.exports === s,
      i = o && r.process,
      a = (function () {
        try {
          var l = n && n.require && n.require("util").types;
          return l || (i && i.binding && i.binding("util"));
        } catch {}
      })();
    e.exports = a;
  })(na, na.exports);
  var Eu = na.exports,
    bT = _T,
    wT = wu,
    yp = Eu,
    _p = yp && yp.isTypedArray,
    ET = _p ? wT(_p) : bT,
    Ou = ET;
  function OT(e, t) {
    for (var r = -1, s = e == null ? 0 : e.length, n = Array(s); ++r < s; )
      n[r] = t(e[r], r, e);
    return n;
  }
  var Tv = OT,
    ST = ls,
    AT = tr,
    NT = "[object Symbol]";
  function PT(e) {
    return typeof e == "symbol" || (AT(e) && ST(e) == NT);
  }
  var Go = PT,
    $p = Ms,
    CT = Tv,
    TT = zt,
    xT = Go,
    DT = 1 / 0,
    bp = $p ? $p.prototype : void 0,
    wp = bp ? bp.toString : void 0;
  function xv(e) {
    if (typeof e == "string") return e;
    if (TT(e)) return CT(e, xv) + "";
    if (xT(e)) return wp ? wp.call(e) : "";
    var t = e + "";
    return t == "0" && 1 / e == -DT ? "-0" : t;
  }
  var IT = xv,
    RT = IT;
  function MT(e) {
    return e == null ? "" : RT(e);
  }
  var Dv = MT;
  function jT(e, t, r) {
    var s = -1,
      n = e.length;
    t < 0 && (t = -t > n ? 0 : n + t),
      (r = r > n ? n : r),
      r < 0 && (r += n),
      (n = t > r ? 0 : (r - t) >>> 0),
      (t >>>= 0);
    for (var o = Array(n); ++s < n; ) o[s] = e[s + t];
    return o;
  }
  var FT = jT;
  function LT(e, t) {
    for (var r = -1, s = Array(e); ++r < e; ) s[r] = t(r);
    return s;
  }
  var VT = LT,
    kT = 9007199254740991,
    BT = /^(?:0|[1-9]\d*)$/;
  function zT(e, t) {
    var r = typeof e;
    return (
      (t = t ?? kT),
      !!t &&
        (r == "number" || (r != "symbol" && BT.test(e))) &&
        e > -1 &&
        e % 1 == 0 &&
        e < t
    );
  }
  var qo = zT,
    UT = VT,
    WT = La,
    HT = zt,
    KT = ka,
    GT = qo,
    qT = Ou,
    YT = Object.prototype,
    JT = YT.hasOwnProperty;
  function XT(e, t) {
    var r = HT(e),
      s = !r && WT(e),
      n = !r && !s && KT(e),
      o = !r && !s && !n && qT(e),
      i = r || s || n || o,
      a = i ? UT(e.length, String) : [],
      l = a.length;
    for (var c in e)
      (t || JT.call(e, c)) &&
        !(
          i && // Safari 9 has enumerable `arguments.length` in strict mode.
          (c == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            (n && (c == "offset" || c == "parent")) || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            (o && (c == "buffer" || c == "byteLength" || c == "byteOffset")) || // Skip index properties.
            GT(c, l))
        ) &&
        a.push(c);
    return a;
  }
  var Iv = XT,
    ZT = Iv,
    QT = Ev,
    ex = Va;
  function tx(e) {
    return ex(e) ? ZT(e) : QT(e);
  }
  var Ba = tx;
  function rx() {
    (this.__data__ = []), (this.size = 0);
  }
  var nx = rx;
  function sx(e, t) {
    return e === t || (e !== e && t !== t);
  }
  var Yo = sx,
    ox = Yo;
  function ix(e, t) {
    for (var r = e.length; r--; ) if (ox(e[r][0], t)) return r;
    return -1;
  }
  var za = ix,
    ax = za,
    lx = Array.prototype,
    cx = lx.splice;
  function ux(e) {
    var t = this.__data__,
      r = ax(t, e);
    if (r < 0) return !1;
    var s = t.length - 1;
    return r == s ? t.pop() : cx.call(t, r, 1), --this.size, !0;
  }
  var fx = ux,
    dx = za;
  function px(e) {
    var t = this.__data__,
      r = dx(t, e);
    return r < 0 ? void 0 : t[r][1];
  }
  var hx = px,
    gx = za;
  function mx(e) {
    return gx(this.__data__, e) > -1;
  }
  var vx = mx,
    yx = za;
  function _x(e, t) {
    var r = this.__data__,
      s = yx(r, e);
    return s < 0 ? (++this.size, r.push([e, t])) : (r[s][1] = t), this;
  }
  var $x = _x,
    bx = nx,
    wx = fx,
    Ex = hx,
    Ox = vx,
    Sx = $x;
  function Fs(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var s = e[t];
      this.set(s[0], s[1]);
    }
  }
  Fs.prototype.clear = bx;
  Fs.prototype.delete = wx;
  Fs.prototype.get = Ex;
  Fs.prototype.has = Ox;
  Fs.prototype.set = Sx;
  var Ua = Fs,
    Ax = Ua;
  function Nx() {
    (this.__data__ = new Ax()), (this.size = 0);
  }
  var Px = Nx;
  function Cx(e) {
    var t = this.__data__,
      r = t.delete(e);
    return (this.size = t.size), r;
  }
  var Tx = Cx;
  function xx(e) {
    return this.__data__.get(e);
  }
  var Dx = xx;
  function Ix(e) {
    return this.__data__.has(e);
  }
  var Rx = Ix,
    Mx = cs,
    jx = Mx(Object, "create"),
    Wa = jx,
    Ep = Wa;
  function Fx() {
    (this.__data__ = Ep ? Ep(null) : {}), (this.size = 0);
  }
  var Lx = Fx;
  function Vx(e) {
    var t = this.has(e) && delete this.__data__[e];
    return (this.size -= t ? 1 : 0), t;
  }
  var kx = Vx,
    Bx = Wa,
    zx = "__lodash_hash_undefined__",
    Ux = Object.prototype,
    Wx = Ux.hasOwnProperty;
  function Hx(e) {
    var t = this.__data__;
    if (Bx) {
      var r = t[e];
      return r === zx ? void 0 : r;
    }
    return Wx.call(t, e) ? t[e] : void 0;
  }
  var Kx = Hx,
    Gx = Wa,
    qx = Object.prototype,
    Yx = qx.hasOwnProperty;
  function Jx(e) {
    var t = this.__data__;
    return Gx ? t[e] !== void 0 : Yx.call(t, e);
  }
  var Xx = Jx,
    Zx = Wa,
    Qx = "__lodash_hash_undefined__";
  function eD(e, t) {
    var r = this.__data__;
    return (
      (this.size += this.has(e) ? 0 : 1),
      (r[e] = Zx && t === void 0 ? Qx : t),
      this
    );
  }
  var tD = eD,
    rD = Lx,
    nD = kx,
    sD = Kx,
    oD = Xx,
    iD = tD;
  function Ls(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var s = e[t];
      this.set(s[0], s[1]);
    }
  }
  Ls.prototype.clear = rD;
  Ls.prototype.delete = nD;
  Ls.prototype.get = sD;
  Ls.prototype.has = oD;
  Ls.prototype.set = iD;
  var aD = Ls,
    Op = aD,
    lD = Ua,
    cD = $u;
  function uD() {
    (this.size = 0),
      (this.__data__ = {
        hash: new Op(),
        map: new (cD || lD)(),
        string: new Op(),
      });
  }
  var fD = uD;
  function dD(e) {
    var t = typeof e;
    return t == "string" || t == "number" || t == "symbol" || t == "boolean"
      ? e !== "__proto__"
      : e === null;
  }
  var pD = dD,
    hD = pD;
  function gD(e, t) {
    var r = e.__data__;
    return hD(t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
  }
  var Ha = gD,
    mD = Ha;
  function vD(e) {
    var t = mD(this, e).delete(e);
    return (this.size -= t ? 1 : 0), t;
  }
  var yD = vD,
    _D = Ha;
  function $D(e) {
    return _D(this, e).get(e);
  }
  var bD = $D,
    wD = Ha;
  function ED(e) {
    return wD(this, e).has(e);
  }
  var OD = ED,
    SD = Ha;
  function AD(e, t) {
    var r = SD(this, e),
      s = r.size;
    return r.set(e, t), (this.size += r.size == s ? 0 : 1), this;
  }
  var ND = AD,
    PD = fD,
    CD = yD,
    TD = bD,
    xD = OD,
    DD = ND;
  function Vs(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.clear(); ++t < r; ) {
      var s = e[t];
      this.set(s[0], s[1]);
    }
  }
  Vs.prototype.clear = PD;
  Vs.prototype.delete = CD;
  Vs.prototype.get = TD;
  Vs.prototype.has = xD;
  Vs.prototype.set = DD;
  var Su = Vs,
    ID = Ua,
    RD = $u,
    MD = Su,
    jD = 200;
  function FD(e, t) {
    var r = this.__data__;
    if (r instanceof ID) {
      var s = r.__data__;
      if (!RD || s.length < jD - 1)
        return s.push([e, t]), (this.size = ++r.size), this;
      r = this.__data__ = new MD(s);
    }
    return r.set(e, t), (this.size = r.size), this;
  }
  var LD = FD,
    VD = Ua,
    kD = Px,
    BD = Tx,
    zD = Dx,
    UD = Rx,
    WD = LD;
  function ks(e) {
    var t = (this.__data__ = new VD(e));
    this.size = t.size;
  }
  ks.prototype.clear = kD;
  ks.prototype.delete = BD;
  ks.prototype.get = zD;
  ks.prototype.has = UD;
  ks.prototype.set = WD;
  var Ka = ks,
    HD = cs,
    KD = (function () {
      try {
        var e = HD(Object, "defineProperty");
        return e({}, "", {}), e;
      } catch {}
    })(),
    Rv = KD,
    Sp = Rv;
  function GD(e, t, r) {
    t == "__proto__" && Sp
      ? Sp(e, t, {
          configurable: !0,
          enumerable: !0,
          value: r,
          writable: !0,
        })
      : (e[t] = r);
  }
  var Au = GD,
    qD = Au,
    YD = Yo;
  function JD(e, t, r) {
    ((r !== void 0 && !YD(e[t], r)) || (r === void 0 && !(t in e))) &&
      qD(e, t, r);
  }
  var Mv = JD;
  function XD(e) {
    return function (t, r, s) {
      for (var n = -1, o = Object(t), i = s(t), a = i.length; a--; ) {
        var l = i[e ? a : ++n];
        if (r(o[l], l, o) === !1) break;
      }
      return t;
    };
  }
  var ZD = XD,
    QD = ZD,
    eI = QD(),
    tI = eI,
    sa = { exports: {} };
  sa.exports;
  (function (e, t) {
    var r = Bt,
      s = t && !t.nodeType && t,
      n = s && !0 && e && !e.nodeType && e,
      o = n && n.exports === s,
      i = o ? r.Buffer : void 0,
      a = i ? i.allocUnsafe : void 0;
    function l(c, u) {
      if (u) return c.slice();
      var f = c.length,
        d = a ? a(f) : new c.constructor(f);
      return c.copy(d), d;
    }
    e.exports = l;
  })(sa, sa.exports);
  var jv = sa.exports,
    rI = Bt,
    nI = rI.Uint8Array,
    Fv = nI,
    Ap = Fv;
  function sI(e) {
    var t = new e.constructor(e.byteLength);
    return new Ap(t).set(new Ap(e)), t;
  }
  var Nu = sI,
    oI = Nu;
  function iI(e, t) {
    var r = t ? oI(e.buffer) : e.buffer;
    return new e.constructor(r, e.byteOffset, e.length);
  }
  var Lv = iI;
  function aI(e, t) {
    var r = -1,
      s = e.length;
    for (t || (t = Array(s)); ++r < s; ) t[r] = e[r];
    return t;
  }
  var Jo = aI,
    lI = er,
    Np = Object.create,
    cI = /* @__PURE__ */ (function () {
      function e() {}
      return function (t) {
        if (!lI(t)) return {};
        if (Np) return Np(t);
        e.prototype = t;
        var r = new e();
        return (e.prototype = void 0), r;
      };
    })(),
    Ga = cI,
    uI = wv,
    fI = uI(Object.getPrototypeOf, Object),
    Pu = fI,
    dI = Ga,
    pI = Pu,
    hI = _u;
  function gI(e) {
    return typeof e.constructor == "function" && !hI(e) ? dI(pI(e)) : {};
  }
  var Vv = gI,
    mI = Va,
    vI = tr;
  function yI(e) {
    return vI(e) && mI(e);
  }
  var _I = yI,
    $I = ls,
    bI = Pu,
    wI = tr,
    EI = "[object Object]",
    OI = Function.prototype,
    SI = Object.prototype,
    kv = OI.toString,
    AI = SI.hasOwnProperty,
    NI = kv.call(Object);
  function PI(e) {
    if (!wI(e) || $I(e) != EI) return !1;
    var t = bI(e);
    if (t === null) return !0;
    var r = AI.call(t, "constructor") && t.constructor;
    return typeof r == "function" && r instanceof r && kv.call(r) == NI;
  }
  var Bv = PI;
  function CI(e, t) {
    if (!(t === "constructor" && typeof e[t] == "function") && t != "__proto__")
      return e[t];
  }
  var zv = CI,
    TI = Au,
    xI = Yo,
    DI = Object.prototype,
    II = DI.hasOwnProperty;
  function RI(e, t, r) {
    var s = e[t];
    (!(II.call(e, t) && xI(s, r)) || (r === void 0 && !(t in e))) &&
      TI(e, t, r);
  }
  var Cu = RI,
    MI = Cu,
    jI = Au;
  function FI(e, t, r, s) {
    var n = !r;
    r || (r = {});
    for (var o = -1, i = t.length; ++o < i; ) {
      var a = t[o],
        l = s ? s(r[a], e[a], a, r, e) : void 0;
      l === void 0 && (l = e[a]), n ? jI(r, a, l) : MI(r, a, l);
    }
    return r;
  }
  var Xo = FI;
  function LI(e) {
    var t = [];
    if (e != null) for (var r in Object(e)) t.push(r);
    return t;
  }
  var VI = LI,
    kI = er,
    BI = _u,
    zI = VI,
    UI = Object.prototype,
    WI = UI.hasOwnProperty;
  function HI(e) {
    if (!kI(e)) return zI(e);
    var t = BI(e),
      r = [];
    for (var s in e) (s == "constructor" && (t || !WI.call(e, s))) || r.push(s);
    return r;
  }
  var KI = HI,
    GI = Iv,
    qI = KI,
    YI = Va;
  function JI(e) {
    return YI(e) ? GI(e, !0) : qI(e);
  }
  var Zo = JI,
    XI = Xo,
    ZI = Zo;
  function QI(e) {
    return XI(e, ZI(e));
  }
  var eR = QI,
    Pp = Mv,
    tR = jv,
    rR = Lv,
    nR = Jo,
    sR = Vv,
    Cp = La,
    Tp = zt,
    oR = _I,
    iR = ka,
    aR = Fa,
    lR = er,
    cR = Bv,
    uR = Ou,
    xp = zv,
    fR = eR;
  function dR(e, t, r, s, n, o, i) {
    var a = xp(e, r),
      l = xp(t, r),
      c = i.get(l);
    if (c) {
      Pp(e, r, c);
      return;
    }
    var u = o ? o(a, l, r + "", e, t, i) : void 0,
      f = u === void 0;
    if (f) {
      var d = Tp(l),
        p = !d && iR(l),
        h = !d && !p && uR(l);
      (u = l),
        d || p || h
          ? Tp(a)
            ? (u = a)
            : oR(a)
              ? (u = nR(a))
              : p
                ? ((f = !1), (u = tR(l, !0)))
                : h
                  ? ((f = !1), (u = rR(l, !0)))
                  : (u = [])
          : cR(l) || Cp(l)
            ? ((u = a), Cp(a) ? (u = fR(a)) : (!lR(a) || aR(a)) && (u = sR(l)))
            : (f = !1);
    }
    f && (i.set(l, u), n(u, l, s, o, i), i.delete(l)), Pp(e, r, u);
  }
  var pR = dR,
    hR = Ka,
    gR = Mv,
    mR = tI,
    vR = pR,
    yR = er,
    _R = Zo,
    $R = zv;
  function Uv(e, t, r, s, n) {
    e !== t &&
      mR(
        t,
        function (o, i) {
          if ((n || (n = new hR()), yR(o))) vR(e, t, i, r, Uv, s, n);
          else {
            var a = s ? s($R(e, i), o, i + "", e, t, n) : void 0;
            a === void 0 && (a = o), gR(e, i, a);
          }
        },
        _R
      );
  }
  var bR = Uv;
  function wR(e) {
    return e;
  }
  var qa = wR;
  function ER(e, t, r) {
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
  var Tu = ER,
    OR = Tu,
    Dp = Math.max;
  function SR(e, t, r) {
    return (
      (t = Dp(t === void 0 ? e.length - 1 : t, 0)),
      function () {
        for (
          var s = arguments, n = -1, o = Dp(s.length - t, 0), i = Array(o);
          ++n < o;

        )
          i[n] = s[t + n];
        n = -1;
        for (var a = Array(t + 1); ++n < t; ) a[n] = s[n];
        return (a[t] = r(i)), OR(e, this, a);
      }
    );
  }
  var Wv = SR;
  function AR(e) {
    return function () {
      return e;
    };
  }
  var NR = AR,
    PR = NR,
    Ip = Rv,
    CR = qa,
    TR = Ip
      ? function (e, t) {
          return Ip(e, "toString", {
            configurable: !0,
            enumerable: !1,
            value: PR(t),
            writable: !0,
          });
        }
      : CR,
    xR = TR,
    DR = 800,
    IR = 16,
    RR = Date.now;
  function MR(e) {
    var t = 0,
      r = 0;
    return function () {
      var s = RR(),
        n = IR - (s - r);
      if (((r = s), n > 0)) {
        if (++t >= DR) return arguments[0];
      } else t = 0;
      return e.apply(void 0, arguments);
    };
  }
  var Hv = MR,
    jR = xR,
    FR = Hv,
    LR = FR(jR),
    xu = LR,
    VR = qa,
    kR = Wv,
    BR = xu;
  function zR(e, t) {
    return BR(kR(e, t, VR), e + "");
  }
  var UR = zR,
    WR = Yo,
    HR = Va,
    KR = qo,
    GR = er;
  function qR(e, t, r) {
    if (!GR(r)) return !1;
    var s = typeof t;
    return (s == "number" ? HR(r) && KR(t, r.length) : s == "string" && t in r)
      ? WR(r[t], e)
      : !1;
  }
  var YR = qR,
    JR = UR,
    XR = YR;
  function ZR(e) {
    return JR(function (t, r) {
      var s = -1,
        n = r.length,
        o = n > 1 ? r[n - 1] : void 0,
        i = n > 2 ? r[2] : void 0;
      for (
        o = e.length > 3 && typeof o == "function" ? (n--, o) : void 0,
          i && XR(r[0], r[1], i) && ((o = n < 3 ? void 0 : o), (n = 1)),
          t = Object(t);
        ++s < n;

      ) {
        var a = r[s];
        a && e(t, a, s, o);
      }
      return t;
    });
  }
  var QR = ZR,
    eM = bR,
    tM = QR;
  tM(function (e, t, r) {
    eM(e, t, r);
  });
  function rM(e, t) {
    for (
      var r = -1, s = e == null ? 0 : e.length;
      ++r < s && t(e[r], r, e) !== !1;

    );
    return e;
  }
  var Du = rM,
    nM = Xo,
    sM = Ba;
  function oM(e, t) {
    return e && nM(t, sM(t), e);
  }
  var Kv = oM,
    iM = Xo,
    aM = Zo;
  function lM(e, t) {
    return e && iM(t, aM(t), e);
  }
  var cM = lM;
  function uM(e, t) {
    for (var r = -1, s = e == null ? 0 : e.length, n = 0, o = []; ++r < s; ) {
      var i = e[r];
      t(i, r, e) && (o[n++] = i);
    }
    return o;
  }
  var fM = uM;
  function dM() {
    return [];
  }
  var Gv = dM,
    pM = fM,
    hM = Gv,
    gM = Object.prototype,
    mM = gM.propertyIsEnumerable,
    Rp = Object.getOwnPropertySymbols,
    vM = Rp
      ? function (e) {
          return e == null
            ? []
            : ((e = Object(e)),
              pM(Rp(e), function (t) {
                return mM.call(e, t);
              }));
        }
      : hM,
    Iu = vM,
    yM = Xo,
    _M = Iu;
  function $M(e, t) {
    return yM(e, _M(e), t);
  }
  var bM = $M;
  function wM(e, t) {
    for (var r = -1, s = t.length, n = e.length; ++r < s; ) e[n + r] = t[r];
    return e;
  }
  var Ru = wM,
    EM = Ru,
    OM = Pu,
    SM = Iu,
    AM = Gv,
    NM = Object.getOwnPropertySymbols,
    PM = NM
      ? function (e) {
          for (var t = []; e; ) EM(t, SM(e)), (e = OM(e));
          return t;
        }
      : AM,
    qv = PM,
    CM = Xo,
    TM = qv;
  function xM(e, t) {
    return CM(e, TM(e), t);
  }
  var DM = xM,
    IM = Ru,
    RM = zt;
  function MM(e, t, r) {
    var s = t(e);
    return RM(e) ? s : IM(s, r(e));
  }
  var Yv = MM,
    jM = Yv,
    FM = Iu,
    LM = Ba;
  function VM(e) {
    return jM(e, LM, FM);
  }
  var Jv = VM,
    kM = Yv,
    BM = qv,
    zM = Zo;
  function UM(e) {
    return kM(e, zM, BM);
  }
  var WM = UM,
    HM = Object.prototype,
    KM = HM.hasOwnProperty;
  function GM(e) {
    var t = e.length,
      r = new e.constructor(t);
    return (
      t &&
        typeof e[0] == "string" &&
        KM.call(e, "index") &&
        ((r.index = e.index), (r.input = e.input)),
      r
    );
  }
  var qM = GM,
    YM = Nu;
  function JM(e, t) {
    var r = t ? YM(e.buffer) : e.buffer;
    return new e.constructor(r, e.byteOffset, e.byteLength);
  }
  var XM = JM,
    ZM = /\w*$/;
  function QM(e) {
    var t = new e.constructor(e.source, ZM.exec(e));
    return (t.lastIndex = e.lastIndex), t;
  }
  var ej = QM,
    Mp = Ms,
    jp = Mp ? Mp.prototype : void 0,
    Fp = jp ? jp.valueOf : void 0;
  function tj(e) {
    return Fp ? Object(Fp.call(e)) : {};
  }
  var rj = tj,
    nj = Nu,
    sj = XM,
    oj = ej,
    ij = rj,
    aj = Lv,
    lj = "[object Boolean]",
    cj = "[object Date]",
    uj = "[object Map]",
    fj = "[object Number]",
    dj = "[object RegExp]",
    pj = "[object Set]",
    hj = "[object String]",
    gj = "[object Symbol]",
    mj = "[object ArrayBuffer]",
    vj = "[object DataView]",
    yj = "[object Float32Array]",
    _j = "[object Float64Array]",
    $j = "[object Int8Array]",
    bj = "[object Int16Array]",
    wj = "[object Int32Array]",
    Ej = "[object Uint8Array]",
    Oj = "[object Uint8ClampedArray]",
    Sj = "[object Uint16Array]",
    Aj = "[object Uint32Array]";
  function Nj(e, t, r) {
    var s = e.constructor;
    switch (t) {
      case mj:
        return nj(e);
      case lj:
      case cj:
        return new s(+e);
      case vj:
        return sj(e, r);
      case yj:
      case _j:
      case $j:
      case bj:
      case wj:
      case Ej:
      case Oj:
      case Sj:
      case Aj:
        return aj(e, r);
      case uj:
        return new s();
      case fj:
      case hj:
        return new s(e);
      case dj:
        return oj(e);
      case pj:
        return new s();
      case gj:
        return ij(e);
    }
  }
  var Pj = Nj,
    Cj = Ko,
    Tj = tr,
    xj = "[object Map]";
  function Dj(e) {
    return Tj(e) && Cj(e) == xj;
  }
  var Ij = Dj,
    Rj = Ij,
    Mj = wu,
    Lp = Eu,
    Vp = Lp && Lp.isMap,
    jj = Vp ? Mj(Vp) : Rj,
    Fj = jj,
    Lj = Ko,
    Vj = tr,
    kj = "[object Set]";
  function Bj(e) {
    return Vj(e) && Lj(e) == kj;
  }
  var zj = Bj,
    Uj = zj,
    Wj = wu,
    kp = Eu,
    Bp = kp && kp.isSet,
    Hj = Bp ? Wj(Bp) : Uj,
    Kj = Hj,
    Gj = Ka,
    qj = Du,
    Yj = Cu,
    Jj = Kv,
    Xj = cM,
    Zj = jv,
    Qj = Jo,
    eF = bM,
    tF = DM,
    rF = Jv,
    nF = WM,
    sF = Ko,
    oF = qM,
    iF = Pj,
    aF = Vv,
    lF = zt,
    cF = ka,
    uF = Fj,
    fF = er,
    dF = Kj,
    pF = Ba,
    hF = Zo,
    gF = 1,
    mF = 2,
    vF = 4,
    Xv = "[object Arguments]",
    yF = "[object Array]",
    _F = "[object Boolean]",
    $F = "[object Date]",
    bF = "[object Error]",
    Zv = "[object Function]",
    wF = "[object GeneratorFunction]",
    EF = "[object Map]",
    OF = "[object Number]",
    Qv = "[object Object]",
    SF = "[object RegExp]",
    AF = "[object Set]",
    NF = "[object String]",
    PF = "[object Symbol]",
    CF = "[object WeakMap]",
    TF = "[object ArrayBuffer]",
    xF = "[object DataView]",
    DF = "[object Float32Array]",
    IF = "[object Float64Array]",
    RF = "[object Int8Array]",
    MF = "[object Int16Array]",
    jF = "[object Int32Array]",
    FF = "[object Uint8Array]",
    LF = "[object Uint8ClampedArray]",
    VF = "[object Uint16Array]",
    kF = "[object Uint32Array]",
    qe = {};
  qe[Xv] =
    qe[yF] =
    qe[TF] =
    qe[xF] =
    qe[_F] =
    qe[$F] =
    qe[DF] =
    qe[IF] =
    qe[RF] =
    qe[MF] =
    qe[jF] =
    qe[EF] =
    qe[OF] =
    qe[Qv] =
    qe[SF] =
    qe[AF] =
    qe[NF] =
    qe[PF] =
    qe[FF] =
    qe[LF] =
    qe[VF] =
    qe[kF] =
      !0;
  qe[bF] = qe[Zv] = qe[CF] = !1;
  function Ii(e, t, r, s, n, o) {
    var i,
      a = t & gF,
      l = t & mF,
      c = t & vF;
    if ((r && (i = n ? r(e, s, n, o) : r(e)), i !== void 0)) return i;
    if (!fF(e)) return e;
    var u = lF(e);
    if (u) {
      if (((i = oF(e)), !a)) return Qj(e, i);
    } else {
      var f = sF(e),
        d = f == Zv || f == wF;
      if (cF(e)) return Zj(e, a);
      if (f == Qv || f == Xv || (d && !n)) {
        if (((i = l || d ? {} : aF(e)), !a))
          return l ? tF(e, Xj(i, e)) : eF(e, Jj(i, e));
      } else {
        if (!qe[f]) return n ? e : {};
        i = iF(e, f, a);
      }
    }
    o || (o = new Gj());
    var p = o.get(e);
    if (p) return p;
    o.set(e, i),
      dF(e)
        ? e.forEach(function (y) {
            i.add(Ii(y, t, r, y, e, o));
          })
        : uF(e) &&
          e.forEach(function (y, g) {
            i.set(g, Ii(y, t, r, g, e, o));
          });
    var h = c ? (l ? nF : rF) : l ? hF : pF,
      m = u ? void 0 : h(e);
    return (
      qj(m || e, function (y, g) {
        m && ((g = y), (y = e[g])), Yj(i, g, Ii(y, t, r, g, e, o));
      }),
      i
    );
  }
  var ey = Ii,
    ty = {};
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
          s = {};
        for (var n in r) {
          var o = r[n];
          t.call(s, o) ? s[o].push(n) : (s[o] = [n]);
        }
        return s;
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
  })(ty);
  var $l, zp;
  function Mu() {
    return zp || ((zp = 1), ($l = {})), $l;
  }
  var mt = ty,
    BF = Mu(),
    Up = Array.prototype.push;
  function zF(e, t) {
    return t == 2
      ? function (r, s) {
          return e.apply(void 0, arguments);
        }
      : function (r) {
          return e.apply(void 0, arguments);
        };
  }
  function bl(e, t) {
    return t == 2
      ? function (r, s) {
          return e(r, s);
        }
      : function (r) {
          return e(r);
        };
  }
  function Wp(e) {
    for (var t = e ? e.length : 0, r = Array(t); t--; ) r[t] = e[t];
    return r;
  }
  function UF(e) {
    return function (t) {
      return e({}, t);
    };
  }
  function WF(e, t) {
    return function () {
      for (var r = arguments.length, s = r - 1, n = Array(r); r--; )
        n[r] = arguments[r];
      var o = n[t],
        i = n.slice(0, t);
      return (
        o && Up.apply(i, o),
        t != s && Up.apply(i, n.slice(t + 1)),
        e.apply(this, i)
      );
    };
  }
  function wl(e, t) {
    return function () {
      var r = arguments.length;
      if (r) {
        for (var s = Array(r); r--; ) s[r] = arguments[r];
        var n = (s[0] = t.apply(void 0, s));
        return e.apply(void 0, s), n;
      }
    };
  }
  function gc(e, t, r, s) {
    var n = typeof t == "function",
      o = t === Object(t);
    if ((o && ((s = r), (r = t), (t = void 0)), r == null))
      throw new TypeError();
    s || (s = {});
    var i = {
        cap: "cap" in s ? s.cap : !0,
        curry: "curry" in s ? s.curry : !0,
        fixed: "fixed" in s ? s.fixed : !0,
        immutable: "immutable" in s ? s.immutable : !0,
        rearg: "rearg" in s ? s.rearg : !0,
      },
      a = n ? r : BF,
      l = "curry" in s && s.curry,
      c = "fixed" in s && s.fixed,
      u = "rearg" in s && s.rearg,
      f = n ? r.runInContext() : void 0,
      d = n
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
            return i.cap && typeof j == "number"
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
                var se = q[1];
                S(se) ? (j.prototype[q[0]] = se) : delete j.prototype[q[0]];
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
            return gc(e, $(N), s);
          };
        },
      };
    function G($, N) {
      if (i.cap) {
        var j = mt.iterateeRearg[$];
        if (j) return ee(N, j);
        var F = !n && mt.iterateeAry[$];
        if (F) return Ue(N, F);
      }
      return N;
    }
    function Ne($, N, j) {
      return l || (i.curry && j > 1) ? y(N, j) : N;
    }
    function fe($, N, j) {
      if (i.fixed && (c || !mt.skipFixed[$])) {
        var F = mt.methodSpread[$],
          q = F && F.start;
        return q === void 0 ? p(N, j) : WF(N, q);
      }
      return N;
    }
    function Pe($, N, j) {
      return i.rearg && j > 1 && (u || !mt.skipRearg[$])
        ? O(N, mt.methodRearg[$] || mt.aryRearg[j])
        : N;
    }
    function be($, N) {
      N = z(N);
      for (
        var j = -1, F = N.length, q = F - 1, se = m(Object($)), we = se;
        we != null && ++j < F;

      ) {
        var Ie = N[j],
          tt = we[Ie];
        tt != null &&
          !(S(tt) || E(tt) || I(tt)) &&
          (we[Ie] = m(j == q ? tt : Object(tt))),
          (we = we[Ie]);
      }
      return se;
    }
    function le($) {
      return P.runInContext.convert($)(void 0);
    }
    function ve($, N) {
      var j = mt.aliasToReal[$] || $,
        F = mt.remap[j] || j,
        q = s;
      return function (se) {
        var we = n ? f : d,
          Ie = n ? f[F] : N,
          tt = h(h({}, q), se);
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
        return zF(O(bl(j, F), N), F);
      });
    }
    function R($, N) {
      return function () {
        var j = arguments.length;
        if (!j) return $();
        for (var F = Array(j); j--; ) F[j] = arguments[j];
        var q = i.rearg ? 0 : j - 1;
        return (F[q] = N(F[q])), $.apply(void 0, F);
      };
    }
    function M($, N, j) {
      var F,
        q = mt.aliasToReal[$] || $,
        se = N,
        we = ne[q];
      return (
        we
          ? (se = we(N))
          : i.immutable &&
            (mt.mutate.array[q]
              ? (se = wl(N, Wp))
              : mt.mutate.object[q]
                ? (se = wl(N, UF(N)))
                : mt.mutate.set[q] && (se = wl(N, be))),
        g(H, function (Ie) {
          return (
            g(mt.aryMethod[Ie], function (tt) {
              if (q == tt) {
                var w = mt.methodSpread[q],
                  T = w && w.afterRearg;
                return (
                  (F = T ? fe(q, Pe(q, se, Ie), Ie) : Pe(q, fe(q, se, Ie), Ie)),
                  (F = G(q, F)),
                  (F = Ne(q, F, Ie)),
                  !1
                );
              }
            }),
            !F
          );
        }),
        F || (F = se),
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
    if (!o) return M(t, r, a);
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
  var HF = gc,
    Hp = Nv,
    KF = Hp && new Hp(),
    ry = KF,
    GF = qa,
    Kp = ry,
    qF = Kp
      ? function (e, t) {
          return Kp.set(e, t), e;
        }
      : GF,
    ny = qF,
    YF = Ga,
    JF = er;
  function XF(e) {
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
      var r = YF(e.prototype),
        s = e.apply(r, t);
      return JF(s) ? s : r;
    };
  }
  var Ya = XF,
    ZF = Ya,
    QF = Bt,
    eL = 1;
  function tL(e, t, r) {
    var s = t & eL,
      n = ZF(e);
    function o() {
      var i = this && this !== QF && this instanceof o ? n : e;
      return i.apply(s ? r : this, arguments);
    }
    return o;
  }
  var rL = tL,
    nL = Math.max;
  function sL(e, t, r, s) {
    for (
      var n = -1,
        o = e.length,
        i = r.length,
        a = -1,
        l = t.length,
        c = nL(o - i, 0),
        u = Array(l + c),
        f = !s;
      ++a < l;

    )
      u[a] = t[a];
    for (; ++n < i; ) (f || n < o) && (u[r[n]] = e[n]);
    for (; c--; ) u[a++] = e[n++];
    return u;
  }
  var sy = sL,
    oL = Math.max;
  function iL(e, t, r, s) {
    for (
      var n = -1,
        o = e.length,
        i = -1,
        a = r.length,
        l = -1,
        c = t.length,
        u = oL(o - a, 0),
        f = Array(u + c),
        d = !s;
      ++n < u;

    )
      f[n] = e[n];
    for (var p = n; ++l < c; ) f[p + l] = t[l];
    for (; ++i < a; ) (d || n < o) && (f[p + r[i]] = e[n++]);
    return f;
  }
  var oy = iL;
  function aL(e, t) {
    for (var r = e.length, s = 0; r--; ) e[r] === t && ++s;
    return s;
  }
  var lL = aL;
  function cL() {}
  var ju = cL,
    uL = Ga,
    fL = ju,
    dL = 4294967295;
  function oa(e) {
    (this.__wrapped__ = e),
      (this.__actions__ = []),
      (this.__dir__ = 1),
      (this.__filtered__ = !1),
      (this.__iteratees__ = []),
      (this.__takeCount__ = dL),
      (this.__views__ = []);
  }
  oa.prototype = uL(fL.prototype);
  oa.prototype.constructor = oa;
  var Fu = oa;
  function pL() {}
  var hL = pL,
    Gp = ry,
    gL = hL,
    mL = Gp
      ? function (e) {
          return Gp.get(e);
        }
      : gL,
    iy = mL,
    vL = {},
    yL = vL,
    qp = yL,
    _L = Object.prototype,
    $L = _L.hasOwnProperty;
  function bL(e) {
    for (
      var t = e.name + "", r = qp[t], s = $L.call(qp, t) ? r.length : 0;
      s--;

    ) {
      var n = r[s],
        o = n.func;
      if (o == null || o == e) return n.name;
    }
    return t;
  }
  var wL = bL,
    EL = Ga,
    OL = ju;
  function ia(e, t) {
    (this.__wrapped__ = e),
      (this.__actions__ = []),
      (this.__chain__ = !!t),
      (this.__index__ = 0),
      (this.__values__ = void 0);
  }
  ia.prototype = EL(OL.prototype);
  ia.prototype.constructor = ia;
  var ay = ia,
    SL = Fu,
    AL = ay,
    NL = Jo;
  function PL(e) {
    if (e instanceof SL) return e.clone();
    var t = new AL(e.__wrapped__, e.__chain__);
    return (
      (t.__actions__ = NL(e.__actions__)),
      (t.__index__ = e.__index__),
      (t.__values__ = e.__values__),
      t
    );
  }
  var CL = PL,
    TL = Fu,
    Yp = ay,
    xL = ju,
    DL = zt,
    IL = tr,
    RL = CL,
    ML = Object.prototype,
    jL = ML.hasOwnProperty;
  function aa(e) {
    if (IL(e) && !DL(e) && !(e instanceof TL)) {
      if (e instanceof Yp) return e;
      if (jL.call(e, "__wrapped__")) return RL(e);
    }
    return new Yp(e);
  }
  aa.prototype = xL.prototype;
  aa.prototype.constructor = aa;
  var FL = aa,
    LL = Fu,
    VL = iy,
    kL = wL,
    BL = FL;
  function zL(e) {
    var t = kL(e),
      r = BL[t];
    if (typeof r != "function" || !(t in LL.prototype)) return !1;
    if (e === r) return !0;
    var s = VL(r);
    return !!s && e === s[0];
  }
  var UL = zL,
    WL = ny,
    HL = Hv,
    KL = HL(WL),
    ly = KL,
    GL = /\{\n\/\* \[wrapped with (.+)\] \*/,
    qL = /,? & /;
  function YL(e) {
    var t = e.match(GL);
    return t ? t[1].split(qL) : [];
  }
  var JL = YL,
    XL = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/;
  function ZL(e, t) {
    var r = t.length;
    if (!r) return e;
    var s = r - 1;
    return (
      (t[s] = (r > 1 ? "& " : "") + t[s]),
      (t = t.join(r > 2 ? ", " : " ")),
      e.replace(
        XL,
        `{
/* [wrapped with ` +
          t +
          `] */
`
      )
    );
  }
  var QL = ZL;
  function eV(e, t, r, s) {
    for (var n = e.length, o = r + (s ? 1 : -1); s ? o-- : ++o < n; )
      if (t(e[o], o, e)) return o;
    return -1;
  }
  var tV = eV;
  function rV(e) {
    return e !== e;
  }
  var nV = rV;
  function sV(e, t, r) {
    for (var s = r - 1, n = e.length; ++s < n; ) if (e[s] === t) return s;
    return -1;
  }
  var oV = sV,
    iV = tV,
    aV = nV,
    lV = oV;
  function cV(e, t, r) {
    return t === t ? lV(e, t, r) : iV(e, aV, r);
  }
  var uV = cV,
    fV = uV;
  function dV(e, t) {
    var r = e == null ? 0 : e.length;
    return !!r && fV(e, t, 0) > -1;
  }
  var pV = dV,
    hV = Du,
    gV = pV,
    mV = 1,
    vV = 2,
    yV = 8,
    _V = 16,
    $V = 32,
    bV = 64,
    wV = 128,
    EV = 256,
    OV = 512,
    SV = [
      ["ary", wV],
      ["bind", mV],
      ["bindKey", vV],
      ["curry", yV],
      ["curryRight", _V],
      ["flip", OV],
      ["partial", $V],
      ["partialRight", bV],
      ["rearg", EV],
    ];
  function AV(e, t) {
    return (
      hV(SV, function (r) {
        var s = "_." + r[0];
        t & r[1] && !gV(e, s) && e.push(s);
      }),
      e.sort()
    );
  }
  var NV = AV,
    PV = JL,
    CV = QL,
    TV = xu,
    xV = NV;
  function DV(e, t, r) {
    var s = t + "";
    return TV(e, CV(s, xV(PV(s), r)));
  }
  var cy = DV,
    IV = UL,
    RV = ly,
    MV = cy,
    jV = 1,
    FV = 2,
    LV = 4,
    VV = 8,
    Jp = 32,
    Xp = 64;
  function kV(e, t, r, s, n, o, i, a, l, c) {
    var u = t & VV,
      f = u ? i : void 0,
      d = u ? void 0 : i,
      p = u ? o : void 0,
      h = u ? void 0 : o;
    (t |= u ? Jp : Xp), (t &= ~(u ? Xp : Jp)), t & LV || (t &= ~(jV | FV));
    var m = [e, t, n, p, f, h, d, a, l, c],
      y = r.apply(void 0, m);
    return IV(e) && RV(y, m), (y.placeholder = s), MV(y, e, t);
  }
  var uy = kV;
  function BV(e) {
    var t = e;
    return t.placeholder;
  }
  var fy = BV,
    zV = Jo,
    UV = qo,
    WV = Math.min;
  function HV(e, t) {
    for (var r = e.length, s = WV(t.length, r), n = zV(e); s--; ) {
      var o = t[s];
      e[s] = UV(o, r) ? n[o] : void 0;
    }
    return e;
  }
  var KV = HV,
    Zp = "__lodash_placeholder__";
  function GV(e, t) {
    for (var r = -1, s = e.length, n = 0, o = []; ++r < s; ) {
      var i = e[r];
      (i === t || i === Zp) && ((e[r] = Zp), (o[n++] = r));
    }
    return o;
  }
  var Lu = GV,
    qV = sy,
    YV = oy,
    JV = lL,
    Qp = Ya,
    XV = uy,
    ZV = fy,
    QV = KV,
    e2 = Lu,
    t2 = Bt,
    r2 = 1,
    n2 = 2,
    s2 = 8,
    o2 = 16,
    i2 = 128,
    a2 = 512;
  function dy(e, t, r, s, n, o, i, a, l, c) {
    var u = t & i2,
      f = t & r2,
      d = t & n2,
      p = t & (s2 | o2),
      h = t & a2,
      m = d ? void 0 : Qp(e);
    function y() {
      for (var g = arguments.length, _ = Array(g), E = g; E--; )
        _[E] = arguments[E];
      if (p)
        var S = ZV(y),
          I = JV(_, S);
      if (
        (s && (_ = qV(_, s, n, p)),
        o && (_ = YV(_, o, i, p)),
        (g -= I),
        p && g < c)
      ) {
        var A = e2(_, S);
        return XV(e, t, dy, y.placeholder, r, _, A, a, l, c - g);
      }
      var O = f ? r : this,
        L = d ? O[e] : e;
      return (
        (g = _.length),
        a ? (_ = QV(_, a)) : h && g > 1 && _.reverse(),
        u && l < g && (_.length = l),
        this && this !== t2 && this instanceof y && (L = m || Qp(L)),
        L.apply(O, _)
      );
    }
    return y;
  }
  var py = dy,
    l2 = Tu,
    c2 = Ya,
    u2 = py,
    f2 = uy,
    d2 = fy,
    p2 = Lu,
    h2 = Bt;
  function g2(e, t, r) {
    var s = c2(e);
    function n() {
      for (var o = arguments.length, i = Array(o), a = o, l = d2(n); a--; )
        i[a] = arguments[a];
      var c = o < 3 && i[0] !== l && i[o - 1] !== l ? [] : p2(i, l);
      if (((o -= c.length), o < r))
        return f2(e, t, u2, n.placeholder, void 0, i, c, void 0, void 0, r - o);
      var u = this && this !== h2 && this instanceof n ? s : e;
      return l2(u, this, i);
    }
    return n;
  }
  var m2 = g2,
    v2 = Tu,
    y2 = Ya,
    _2 = Bt,
    $2 = 1;
  function b2(e, t, r, s) {
    var n = t & $2,
      o = y2(e);
    function i() {
      for (
        var a = -1,
          l = arguments.length,
          c = -1,
          u = s.length,
          f = Array(u + l),
          d = this && this !== _2 && this instanceof i ? o : e;
        ++c < u;

      )
        f[c] = s[c];
      for (; l--; ) f[c++] = arguments[++a];
      return v2(d, n ? r : this, f);
    }
    return i;
  }
  var w2 = b2,
    E2 = sy,
    O2 = oy,
    eh = Lu,
    th = "__lodash_placeholder__",
    El = 1,
    S2 = 2,
    A2 = 4,
    rh = 8,
    no = 128,
    nh = 256,
    N2 = Math.min;
  function P2(e, t) {
    var r = e[1],
      s = t[1],
      n = r | s,
      o = n < (El | S2 | no),
      i =
        (s == no && r == rh) ||
        (s == no && r == nh && e[7].length <= t[8]) ||
        (s == (no | nh) && t[7].length <= t[8] && r == rh);
    if (!(o || i)) return e;
    s & El && ((e[2] = t[2]), (n |= r & El ? 0 : A2));
    var a = t[3];
    if (a) {
      var l = e[3];
      (e[3] = l ? E2(l, a, t[4]) : a), (e[4] = l ? eh(e[3], th) : t[4]);
    }
    return (
      (a = t[5]),
      a &&
        ((l = e[5]),
        (e[5] = l ? O2(l, a, t[6]) : a),
        (e[6] = l ? eh(e[5], th) : t[6])),
      (a = t[7]),
      a && (e[7] = a),
      s & no && (e[8] = e[8] == null ? t[8] : N2(e[8], t[8])),
      e[9] == null && (e[9] = t[9]),
      (e[0] = t[0]),
      (e[1] = n),
      e
    );
  }
  var C2 = P2,
    T2 = /\s/;
  function x2(e) {
    for (var t = e.length; t-- && T2.test(e.charAt(t)); );
    return t;
  }
  var D2 = x2,
    I2 = D2,
    R2 = /^\s+/;
  function M2(e) {
    return e && e.slice(0, I2(e) + 1).replace(R2, "");
  }
  var j2 = M2,
    F2 = j2,
    sh = er,
    L2 = Go,
    oh = NaN,
    V2 = /^[-+]0x[0-9a-f]+$/i,
    k2 = /^0b[01]+$/i,
    B2 = /^0o[0-7]+$/i,
    z2 = parseInt;
  function U2(e) {
    if (typeof e == "number") return e;
    if (L2(e)) return oh;
    if (sh(e)) {
      var t = typeof e.valueOf == "function" ? e.valueOf() : e;
      e = sh(t) ? t + "" : t;
    }
    if (typeof e != "string") return e === 0 ? e : +e;
    e = F2(e);
    var r = k2.test(e);
    return r || B2.test(e) ? z2(e.slice(2), r ? 2 : 8) : V2.test(e) ? oh : +e;
  }
  var W2 = U2,
    H2 = W2,
    ih = 1 / 0,
    K2 = 17976931348623157e292;
  function G2(e) {
    if (!e) return e === 0 ? e : 0;
    if (((e = H2(e)), e === ih || e === -ih)) {
      var t = e < 0 ? -1 : 1;
      return t * K2;
    }
    return e === e ? e : 0;
  }
  var q2 = G2,
    Y2 = q2;
  function J2(e) {
    var t = Y2(e),
      r = t % 1;
    return t === t ? (r ? t - r : t) : 0;
  }
  var hy = J2,
    X2 = ny,
    Z2 = rL,
    Q2 = m2,
    ek = py,
    tk = w2,
    rk = iy,
    nk = C2,
    sk = ly,
    ok = cy,
    ah = hy,
    ik = "Expected a function",
    lh = 1,
    ak = 2,
    Ol = 8,
    Sl = 16,
    Al = 32,
    ch = 64,
    uh = Math.max;
  function lk(e, t, r, s, n, o, i, a) {
    var l = t & ak;
    if (!l && typeof e != "function") throw new TypeError(ik);
    var c = s ? s.length : 0;
    if (
      (c || ((t &= ~(Al | ch)), (s = n = void 0)),
      (i = i === void 0 ? i : uh(ah(i), 0)),
      (a = a === void 0 ? a : ah(a)),
      (c -= n ? n.length : 0),
      t & ch)
    ) {
      var u = s,
        f = n;
      s = n = void 0;
    }
    var d = l ? void 0 : rk(e),
      p = [e, t, r, s, n, u, f, o, i, a];
    if (
      (d && nk(p, d),
      (e = p[0]),
      (t = p[1]),
      (r = p[2]),
      (s = p[3]),
      (n = p[4]),
      (a = p[9] = p[9] === void 0 ? (l ? 0 : e.length) : uh(p[9] - c, 0)),
      !a && t & (Ol | Sl) && (t &= ~(Ol | Sl)),
      !t || t == lh)
    )
      var h = Z2(e, t, r);
    else
      t == Ol || t == Sl
        ? (h = Q2(e, t, a))
        : (t == Al || t == (lh | Al)) && !n.length
          ? (h = tk(e, t, r, s))
          : (h = ek.apply(void 0, p));
    var m = d ? X2 : sk;
    return ok(m(h, p), e, t);
  }
  var Vu = lk,
    ck = Vu,
    uk = 128;
  function fk(e, t, r) {
    return (
      (t = r ? void 0 : t),
      (t = e && t == null ? e.length : t),
      ck(e, uk, void 0, void 0, void 0, void 0, t)
    );
  }
  var dk = fk,
    pk = ey,
    hk = 4;
  function gk(e) {
    return pk(e, hk);
  }
  var mk = gk,
    vk = Vu,
    yk = 8;
  function ku(e, t, r) {
    t = r ? void 0 : t;
    var s = vk(e, yk, void 0, void 0, void 0, void 0, void 0, t);
    return (s.placeholder = ku.placeholder), s;
  }
  ku.placeholder = {};
  var _k = ku,
    $k = ls,
    bk = tr,
    wk = Bv,
    Ek = "[object DOMException]",
    Ok = "[object Error]";
  function Sk(e) {
    if (!bk(e)) return !1;
    var t = $k(e);
    return (
      t == Ok ||
      t == Ek ||
      (typeof e.message == "string" && typeof e.name == "string" && !wk(e))
    );
  }
  var Ak = Sk,
    Nk = Ko,
    Pk = tr,
    Ck = "[object WeakMap]";
  function Tk(e) {
    return Pk(e) && Nk(e) == Ck;
  }
  var xk = Tk,
    Dk = "__lodash_hash_undefined__";
  function Ik(e) {
    return this.__data__.set(e, Dk), this;
  }
  var Rk = Ik;
  function Mk(e) {
    return this.__data__.has(e);
  }
  var jk = Mk,
    Fk = Su,
    Lk = Rk,
    Vk = jk;
  function la(e) {
    var t = -1,
      r = e == null ? 0 : e.length;
    for (this.__data__ = new Fk(); ++t < r; ) this.add(e[t]);
  }
  la.prototype.add = la.prototype.push = Lk;
  la.prototype.has = Vk;
  var kk = la;
  function Bk(e, t) {
    for (var r = -1, s = e == null ? 0 : e.length; ++r < s; )
      if (t(e[r], r, e)) return !0;
    return !1;
  }
  var zk = Bk;
  function Uk(e, t) {
    return e.has(t);
  }
  var Wk = Uk,
    Hk = kk,
    Kk = zk,
    Gk = Wk,
    qk = 1,
    Yk = 2;
  function Jk(e, t, r, s, n, o) {
    var i = r & qk,
      a = e.length,
      l = t.length;
    if (a != l && !(i && l > a)) return !1;
    var c = o.get(e),
      u = o.get(t);
    if (c && u) return c == t && u == e;
    var f = -1,
      d = !0,
      p = r & Yk ? new Hk() : void 0;
    for (o.set(e, t), o.set(t, e); ++f < a; ) {
      var h = e[f],
        m = t[f];
      if (s) var y = i ? s(m, h, f, t, e, o) : s(h, m, f, e, t, o);
      if (y !== void 0) {
        if (y) continue;
        d = !1;
        break;
      }
      if (p) {
        if (
          !Kk(t, function (g, _) {
            if (!Gk(p, _) && (h === g || n(h, g, r, s, o))) return p.push(_);
          })
        ) {
          d = !1;
          break;
        }
      } else if (!(h === m || n(h, m, r, s, o))) {
        d = !1;
        break;
      }
    }
    return o.delete(e), o.delete(t), d;
  }
  var gy = Jk;
  function Xk(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (s, n) {
        r[++t] = [n, s];
      }),
      r
    );
  }
  var Zk = Xk;
  function Qk(e) {
    var t = -1,
      r = Array(e.size);
    return (
      e.forEach(function (s) {
        r[++t] = s;
      }),
      r
    );
  }
  var e3 = Qk,
    fh = Ms,
    dh = Fv,
    t3 = Yo,
    r3 = gy,
    n3 = Zk,
    s3 = e3,
    o3 = 1,
    i3 = 2,
    a3 = "[object Boolean]",
    l3 = "[object Date]",
    c3 = "[object Error]",
    u3 = "[object Map]",
    f3 = "[object Number]",
    d3 = "[object RegExp]",
    p3 = "[object Set]",
    h3 = "[object String]",
    g3 = "[object Symbol]",
    m3 = "[object ArrayBuffer]",
    v3 = "[object DataView]",
    ph = fh ? fh.prototype : void 0,
    Nl = ph ? ph.valueOf : void 0;
  function y3(e, t, r, s, n, o, i) {
    switch (r) {
      case v3:
        if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
          return !1;
        (e = e.buffer), (t = t.buffer);
      case m3:
        return !(e.byteLength != t.byteLength || !o(new dh(e), new dh(t)));
      case a3:
      case l3:
      case f3:
        return t3(+e, +t);
      case c3:
        return e.name == t.name && e.message == t.message;
      case d3:
      case h3:
        return e == t + "";
      case u3:
        var a = n3;
      case p3:
        var l = s & o3;
        if ((a || (a = s3), e.size != t.size && !l)) return !1;
        var c = i.get(e);
        if (c) return c == t;
        (s |= i3), i.set(e, t);
        var u = r3(a(e), a(t), s, n, o, i);
        return i.delete(e), u;
      case g3:
        if (Nl) return Nl.call(e) == Nl.call(t);
    }
    return !1;
  }
  var _3 = y3,
    hh = Jv,
    $3 = 1,
    b3 = Object.prototype,
    w3 = b3.hasOwnProperty;
  function E3(e, t, r, s, n, o) {
    var i = r & $3,
      a = hh(e),
      l = a.length,
      c = hh(t),
      u = c.length;
    if (l != u && !i) return !1;
    for (var f = l; f--; ) {
      var d = a[f];
      if (!(i ? d in t : w3.call(t, d))) return !1;
    }
    var p = o.get(e),
      h = o.get(t);
    if (p && h) return p == t && h == e;
    var m = !0;
    o.set(e, t), o.set(t, e);
    for (var y = i; ++f < l; ) {
      d = a[f];
      var g = e[d],
        _ = t[d];
      if (s) var E = i ? s(_, g, d, t, e, o) : s(g, _, d, e, t, o);
      if (!(E === void 0 ? g === _ || n(g, _, r, s, o) : E)) {
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
    return o.delete(e), o.delete(t), m;
  }
  var O3 = E3,
    Pl = Ka,
    S3 = gy,
    A3 = _3,
    N3 = O3,
    gh = Ko,
    mh = zt,
    vh = ka,
    P3 = Ou,
    C3 = 1,
    yh = "[object Arguments]",
    _h = "[object Array]",
    $i = "[object Object]",
    T3 = Object.prototype,
    $h = T3.hasOwnProperty;
  function x3(e, t, r, s, n, o) {
    var i = mh(e),
      a = mh(t),
      l = i ? _h : gh(e),
      c = a ? _h : gh(t);
    (l = l == yh ? $i : l), (c = c == yh ? $i : c);
    var u = l == $i,
      f = c == $i,
      d = l == c;
    if (d && vh(e)) {
      if (!vh(t)) return !1;
      (i = !0), (u = !1);
    }
    if (d && !u)
      return (
        o || (o = new Pl()),
        i || P3(e) ? S3(e, t, r, s, n, o) : A3(e, t, l, r, s, n, o)
      );
    if (!(r & C3)) {
      var p = u && $h.call(e, "__wrapped__"),
        h = f && $h.call(t, "__wrapped__");
      if (p || h) {
        var m = p ? e.value() : e,
          y = h ? t.value() : t;
        return o || (o = new Pl()), n(m, y, r, s, o);
      }
    }
    return d ? (o || (o = new Pl()), N3(e, t, r, s, n, o)) : !1;
  }
  var D3 = x3,
    I3 = D3,
    bh = tr;
  function my(e, t, r, s, n) {
    return e === t
      ? !0
      : e == null || t == null || (!bh(e) && !bh(t))
        ? e !== e && t !== t
        : I3(e, t, r, s, my, n);
  }
  var vy = my,
    R3 = Ka,
    M3 = vy,
    j3 = 1,
    F3 = 2;
  function L3(e, t, r, s) {
    var n = r.length,
      o = n,
      i = !s;
    if (e == null) return !o;
    for (e = Object(e); n--; ) {
      var a = r[n];
      if (i && a[2] ? a[1] !== e[a[0]] : !(a[0] in e)) return !1;
    }
    for (; ++n < o; ) {
      a = r[n];
      var l = a[0],
        c = e[l],
        u = a[1];
      if (i && a[2]) {
        if (c === void 0 && !(l in e)) return !1;
      } else {
        var f = new R3();
        if (s) var d = s(c, u, l, e, t, f);
        if (!(d === void 0 ? M3(u, c, j3 | F3, s, f) : d)) return !1;
      }
    }
    return !0;
  }
  var V3 = L3,
    k3 = er;
  function B3(e) {
    return e === e && !k3(e);
  }
  var yy = B3,
    z3 = yy,
    U3 = Ba;
  function W3(e) {
    for (var t = U3(e), r = t.length; r--; ) {
      var s = t[r],
        n = e[s];
      t[r] = [s, n, z3(n)];
    }
    return t;
  }
  var H3 = W3;
  function K3(e, t) {
    return function (r) {
      return r == null ? !1 : r[e] === t && (t !== void 0 || e in Object(r));
    };
  }
  var _y = K3,
    G3 = V3,
    q3 = H3,
    Y3 = _y;
  function J3(e) {
    var t = q3(e);
    return t.length == 1 && t[0][2]
      ? Y3(t[0][0], t[0][1])
      : function (r) {
          return r === e || G3(r, e, t);
        };
  }
  var X3 = J3,
    Z3 = zt,
    Q3 = Go,
    eB = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    tB = /^\w*$/;
  function rB(e, t) {
    if (Z3(e)) return !1;
    var r = typeof e;
    return r == "number" ||
      r == "symbol" ||
      r == "boolean" ||
      e == null ||
      Q3(e)
      ? !0
      : tB.test(e) || !eB.test(e) || (t != null && e in Object(t));
  }
  var Bu = rB,
    $y = Su,
    nB = "Expected a function";
  function zu(e, t) {
    if (typeof e != "function" || (t != null && typeof t != "function"))
      throw new TypeError(nB);
    var r = function () {
      var s = arguments,
        n = t ? t.apply(this, s) : s[0],
        o = r.cache;
      if (o.has(n)) return o.get(n);
      var i = e.apply(this, s);
      return (r.cache = o.set(n, i) || o), i;
    };
    return (r.cache = new (zu.Cache || $y)()), r;
  }
  zu.Cache = $y;
  var sB = zu,
    oB = sB,
    iB = 500;
  function aB(e) {
    var t = oB(e, function (s) {
        return r.size === iB && r.clear(), s;
      }),
      r = t.cache;
    return t;
  }
  var lB = aB,
    cB = lB,
    uB =
      /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
    fB = /\\(\\)?/g,
    dB = cB(function (e) {
      var t = [];
      return (
        e.charCodeAt(0) === 46 && t.push(""),
        e.replace(uB, function (r, s, n, o) {
          t.push(n ? o.replace(fB, "$1") : s || r);
        }),
        t
      );
    }),
    by = dB,
    pB = zt,
    hB = Bu,
    gB = by,
    mB = Dv;
  function vB(e, t) {
    return pB(e) ? e : hB(e, t) ? [e] : gB(mB(e));
  }
  var Ja = vB,
    yB = Go,
    _B = 1 / 0;
  function $B(e) {
    if (typeof e == "string" || yB(e)) return e;
    var t = e + "";
    return t == "0" && 1 / e == -_B ? "-0" : t;
  }
  var us = $B,
    bB = Ja,
    wB = us;
  function EB(e, t) {
    t = bB(t, e);
    for (var r = 0, s = t.length; e != null && r < s; ) e = e[wB(t[r++])];
    return r && r == s ? e : void 0;
  }
  var Uu = EB,
    OB = Uu;
  function SB(e, t, r) {
    var s = e == null ? void 0 : OB(e, t);
    return s === void 0 ? r : s;
  }
  var AB = SB;
  function NB(e, t) {
    return e != null && t in Object(e);
  }
  var PB = NB,
    CB = Ja,
    TB = La,
    xB = zt,
    DB = qo,
    IB = bu,
    RB = us;
  function MB(e, t, r) {
    t = CB(t, e);
    for (var s = -1, n = t.length, o = !1; ++s < n; ) {
      var i = RB(t[s]);
      if (!(o = e != null && r(e, i))) break;
      e = e[i];
    }
    return o || ++s != n
      ? o
      : ((n = e == null ? 0 : e.length),
        !!n && IB(n) && DB(i, n) && (xB(e) || TB(e)));
  }
  var jB = MB,
    FB = PB,
    LB = jB;
  function VB(e, t) {
    return e != null && LB(e, t, FB);
  }
  var kB = VB,
    BB = vy,
    zB = AB,
    UB = kB,
    WB = Bu,
    HB = yy,
    KB = _y,
    GB = us,
    qB = 1,
    YB = 2;
  function JB(e, t) {
    return WB(e) && HB(t)
      ? KB(GB(e), t)
      : function (r) {
          var s = zB(r, e);
          return s === void 0 && s === t ? UB(r, e) : BB(t, s, qB | YB);
        };
  }
  var XB = JB;
  function ZB(e) {
    return function (t) {
      return t == null ? void 0 : t[e];
    };
  }
  var QB = ZB,
    ez = Uu;
  function tz(e) {
    return function (t) {
      return ez(t, e);
    };
  }
  var rz = tz,
    nz = QB,
    sz = rz,
    oz = Bu,
    iz = us;
  function az(e) {
    return oz(e) ? nz(iz(e)) : sz(e);
  }
  var lz = az,
    cz = X3,
    uz = XB,
    fz = qa,
    dz = zt,
    pz = lz;
  function hz(e) {
    return typeof e == "function"
      ? e
      : e == null
        ? fz
        : typeof e == "object"
          ? dz(e)
            ? uz(e[0], e[1])
            : cz(e)
          : pz(e);
  }
  var gz = hz,
    mz = ey,
    vz = gz,
    yz = 1;
  function _z(e) {
    return vz(typeof e == "function" ? e : mz(e, yz));
  }
  var $z = _z,
    wh = Ms,
    bz = La,
    wz = zt,
    Eh = wh ? wh.isConcatSpreadable : void 0;
  function Ez(e) {
    return wz(e) || bz(e) || !!(Eh && e && e[Eh]);
  }
  var Oz = Ez,
    Sz = Ru,
    Az = Oz;
  function wy(e, t, r, s, n) {
    var o = -1,
      i = e.length;
    for (r || (r = Az), n || (n = []); ++o < i; ) {
      var a = e[o];
      t > 0 && r(a)
        ? t > 1
          ? wy(a, t - 1, r, s, n)
          : Sz(n, a)
        : s || (n[n.length] = a);
    }
    return n;
  }
  var Nz = wy,
    Pz = Nz;
  function Cz(e) {
    var t = e == null ? 0 : e.length;
    return t ? Pz(e, 1) : [];
  }
  var Tz = Cz,
    xz = Tz,
    Dz = Wv,
    Iz = xu;
  function Rz(e) {
    return Iz(Dz(e, void 0, xz), e + "");
  }
  var Mz = Rz,
    jz = Vu,
    Fz = Mz,
    Lz = 256,
    Vz = Fz(function (e, t) {
      return jz(e, Lz, void 0, void 0, void 0, t);
    }),
    kz = Vz,
    Bz = Tv,
    zz = Jo,
    Uz = zt,
    Wz = Go,
    Hz = by,
    Kz = us,
    Gz = Dv;
  function qz(e) {
    return Uz(e) ? Bz(e, Kz) : Wz(e) ? [e] : zz(Hz(Gz(e)));
  }
  var Yz = qz,
    Jz = {
      ary: dk,
      assign: Kv,
      clone: mk,
      curry: _k,
      forEach: Du,
      isArray: zt,
      isError: Ak,
      isFunction: Fa,
      isWeakMap: xk,
      iteratee: $z,
      keys: Ev,
      rearg: kz,
      toInteger: hy,
      toPath: Yz,
    },
    Xz = HF,
    Zz = Jz;
  function Qz(e, t, r) {
    return Xz(Zz, e, t, r);
  }
  var Ey = Qz,
    Cl,
    Oh;
  function e4() {
    if (Oh) return Cl;
    Oh = 1;
    var e = Cu,
      t = Ja,
      r = qo,
      s = er,
      n = us;
    function o(i, a, l, c) {
      if (!s(i)) return i;
      a = t(a, i);
      for (var u = -1, f = a.length, d = f - 1, p = i; p != null && ++u < f; ) {
        var h = n(a[u]),
          m = l;
        if (h === "__proto__" || h === "constructor" || h === "prototype")
          return i;
        if (u != d) {
          var y = p[h];
          (m = c ? c(y, h, p) : void 0),
            m === void 0 && (m = s(y) ? y : r(a[u + 1]) ? [] : {});
        }
        e(p, h, m), (p = p[h]);
      }
      return i;
    }
    return (Cl = o), Cl;
  }
  var Tl, Sh;
  function t4() {
    if (Sh) return Tl;
    Sh = 1;
    var e = e4();
    function t(r, s, n) {
      return r == null ? r : e(r, s, n);
    }
    return (Tl = t), Tl;
  }
  var r4 = Ey,
    n4 = r4("set", t4());
  n4.placeholder = Mu();
  function s4(e) {
    var t = e == null ? 0 : e.length;
    return t ? e[t - 1] : void 0;
  }
  var o4 = s4,
    i4 = Uu,
    a4 = FT;
  function l4(e, t) {
    return t.length < 2 ? e : i4(e, a4(t, 0, -1));
  }
  var c4 = l4,
    u4 = Ja,
    f4 = o4,
    d4 = c4,
    p4 = us;
  function h4(e, t) {
    return (t = u4(t, e)), (e = d4(e, t)), e == null || delete e[p4(f4(t))];
  }
  var g4 = h4,
    xl,
    Ah;
  function m4() {
    if (Ah) return xl;
    Ah = 1;
    var e = g4;
    function t(r, s) {
      return r == null ? !0 : e(r, s);
    }
    return (xl = t), xl;
  }
  var v4 = Ey,
    y4 = v4("unset", m4());
  y4.placeholder = Mu();
  var mc = { exports: {} },
    Oy = {},
    Zt = {},
    Ns = {},
    Bs = {},
    De = {},
    Ps = {};
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
    class s extends t {
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
    (e._Code = s), (e.nil = new s(""));
    function n(g, ..._) {
      const E = [g[0]];
      let S = 0;
      for (; S < _.length; ) a(E, _[S]), E.push(g[++S]);
      return new s(E);
    }
    e._ = n;
    const o = new s("+");
    function i(g, ..._) {
      const E = [p(g[0])];
      let S = 0;
      for (; S < _.length; ) E.push(o), a(E, _[S]), E.push(o, p(g[++S]));
      return l(E), new s(E);
    }
    e.str = i;
    function a(g, _) {
      _ instanceof s
        ? g.push(..._._items)
        : _ instanceof r
          ? g.push(_)
          : g.push(f(_));
    }
    e.addCodeArg = a;
    function l(g) {
      let _ = 1;
      for (; _ < g.length - 1; ) {
        if (g[_] === o) {
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
      return _.emptyStr() ? g : g.emptyStr() ? _ : i`${g}${_}`;
    }
    e.strConcat = u;
    function f(g) {
      return typeof g == "number" || typeof g == "boolean" || g === null
        ? g
        : p(Array.isArray(g) ? g.join(",") : g);
    }
    function d(g) {
      return new s(p(g));
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
        ? new s(`.${g}`)
        : n`[${g}]`;
    }
    e.getProperty = h;
    function m(g) {
      if (typeof g == "string" && e.IDENTIFIER.test(g)) return new s(`${g}`);
      throw new Error(
        `CodeGen: invalid export name: ${g}, use explicit $id name mapping`
      );
    }
    e.getEsmExportName = m;
    function y(g) {
      return new s(g.toString());
    }
    e.regexpCode = y;
  })(Ps);
  var vc = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.ValueScope =
        e.ValueScopeName =
        e.Scope =
        e.varKinds =
        e.UsedValueState =
          void 0);
    const t = Ps;
    class r extends Error {
      constructor(c) {
        super(`CodeGen: "code" for ${c} not defined`), (this.value = c.value);
      }
    }
    var s;
    (function (l) {
      (l[(l.Started = 0)] = "Started"), (l[(l.Completed = 1)] = "Completed");
    })((s = e.UsedValueState || (e.UsedValueState = {}))),
      (e.varKinds = {
        const: new t.Name("const"),
        let: new t.Name("let"),
        var: new t.Name("var"),
      });
    class n {
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
    e.Scope = n;
    class o extends t.Name {
      constructor(c, u) {
        super(u), (this.prefix = c);
      }
      setValue(c, { property: u, itemIndex: f }) {
        (this.value = c), (this.scopePath = (0, t._)`.${new t.Name(u)}[${f}]`);
      }
    }
    e.ValueScopeName = o;
    const i = (0, t._)`\n`;
    class a extends n {
      constructor(c) {
        super(c),
          (this._values = {}),
          (this._scope = c.scope),
          (this.opts = { ...c, _n: c.lines ? i : t.nil });
      }
      get() {
        return this._scope;
      }
      name(c) {
        return new o(c, this._newName(c));
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
            y.set(g, s.Started);
            let _ = u(g);
            if (_) {
              const E = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
              p = (0, t._)`${p}${E} ${g} = ${_};${this.opts._n}`;
            } else if ((_ = d == null ? void 0 : d(g)))
              p = (0, t._)`${p}${_}${this.opts._n}`;
            else throw new r(g);
            y.set(g, s.Completed);
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
    const t = Ps,
      r = vc;
    var s = Ps;
    Object.defineProperty(e, "_", {
      enumerable: !0,
      get: function () {
        return s._;
      },
    }),
      Object.defineProperty(e, "str", {
        enumerable: !0,
        get: function () {
          return s.str;
        },
      }),
      Object.defineProperty(e, "strConcat", {
        enumerable: !0,
        get: function () {
          return s.strConcat;
        },
      }),
      Object.defineProperty(e, "nil", {
        enumerable: !0,
        get: function () {
          return s.nil;
        },
      }),
      Object.defineProperty(e, "getProperty", {
        enumerable: !0,
        get: function () {
          return s.getProperty;
        },
      }),
      Object.defineProperty(e, "stringify", {
        enumerable: !0,
        get: function () {
          return s.stringify;
        },
      }),
      Object.defineProperty(e, "regexpCode", {
        enumerable: !0,
        get: function () {
          return s.regexpCode;
        },
      }),
      Object.defineProperty(e, "Name", {
        enumerable: !0,
        get: function () {
          return s.Name;
        },
      });
    var n = vc;
    Object.defineProperty(e, "Scope", {
      enumerable: !0,
      get: function () {
        return n.Scope;
      },
    }),
      Object.defineProperty(e, "ValueScope", {
        enumerable: !0,
        get: function () {
          return n.ValueScope;
        },
      }),
      Object.defineProperty(e, "ValueScopeName", {
        enumerable: !0,
        get: function () {
          return n.ValueScopeName;
        },
      }),
      Object.defineProperty(e, "varKinds", {
        enumerable: !0,
        get: function () {
          return n.varKinds;
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
    class o {
      optimizeNodes() {
        return this;
      }
      optimizeNames(v, $) {
        return this;
      }
    }
    class i extends o {
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
          return this.rhs && (this.rhs = fe(this.rhs, v, $)), this;
      }
      get names() {
        return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
      }
    }
    class a extends o {
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
          return (this.rhs = fe(this.rhs, v, $)), this;
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
    class c extends o {
      constructor(v) {
        super(), (this.label = v), (this.names = {});
      }
      render({ _n: v }) {
        return `${this.label}:` + v;
      }
    }
    class u extends o {
      constructor(v) {
        super(), (this.label = v), (this.names = {});
      }
      render({ _n: v }) {
        return `break${this.label ? ` ${this.label}` : ""};` + v;
      }
    }
    class f extends o {
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
    class d extends o {
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
        return (this.code = fe(this.code, v, $)), this;
      }
      get names() {
        return this.code instanceof t._CodeOrName ? this.code.names : {};
      }
    }
    class p extends o {
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
          return (this.condition = fe(this.condition, v, $)), this;
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
          return (this.iteration = fe(this.iteration, v, $)), this;
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
          return (this.iterable = fe(this.iterable, v, $)), this;
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
          this._leafNode(new i(v, F, N)),
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
          return this.forRange("_i", 0, (0, t._)`${q}.length`, se => {
            this.var(F, (0, t._)`${q}[${se}]`), N(F);
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
    function fe(P, v, $) {
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
      r = Ps;
    function s(A) {
      const O = {};
      for (const L of A) O[L] = !0;
      return O;
    }
    e.toHash = s;
    function n(A, O) {
      return typeof O == "boolean"
        ? O
        : Object.keys(O).length === 0
          ? !0
          : (o(A, O), !i(O, A.self.RULES.all));
    }
    e.alwaysValidSchema = n;
    function o(A, O = A.schema) {
      const { opts: L, self: z } = A;
      if (!L.strictSchema || typeof O == "boolean") return;
      const H = z.RULES.keywords;
      for (const ne in O) H[ne] || I(A, `unknown keyword: "${ne}"`);
    }
    e.checkUnknownRules = o;
    function i(A, O) {
      if (typeof A == "boolean") return !A;
      for (const L in A) if (O[L]) return !0;
      return !1;
    }
    e.schemaHasRules = i;
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
        const fe =
          G === void 0
            ? ne
            : G instanceof t.Name
              ? (ne instanceof t.Name ? A(H, ne, G) : O(H, ne, G), G)
              : ne instanceof t.Name
                ? (O(H, G, ne), ne)
                : L(ne, G);
        return Ne === t.Name && !(fe instanceof t.Name) ? z(H, fe) : fe;
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
    _4 = {
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
  dr.default = _4;
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
      s = dr;
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
    function n(y, g = e.keywordError, _, E) {
      const { it: S } = y,
        { gen: I, compositeRule: A, allErrors: O } = S,
        L = f(y, g, _);
      E ?? (A || O) ? l(I, L) : c(S, (0, t._)`[${L}]`);
    }
    e.reportError = n;
    function o(y, g = e.keywordError, _) {
      const { it: E } = y,
        { gen: S, compositeRule: I, allErrors: A } = E,
        O = f(y, g, _);
      l(S, O), I || A || c(E, s.default.vErrors);
    }
    e.reportExtraError = o;
    function i(y, g) {
      y.assign(s.default.errors, g),
        y.if((0, t._)`${s.default.vErrors} !== null`, () =>
          y.if(
            g,
            () => y.assign((0, t._)`${s.default.vErrors}.length`, g),
            () => y.assign(s.default.vErrors, null)
          )
        );
    }
    e.resetErrorsCount = i;
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
      y.forRange("i", S, s.default.errors, O => {
        y.const(A, (0, t._)`${s.default.vErrors}[${O}]`),
          y.if((0, t._)`${A}.instancePath === undefined`, () =>
            y.assign(
              (0, t._)`${A}.instancePath`,
              (0, t.strConcat)(s.default.instancePath, I.errorPath)
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
        (0, t._)`${s.default.vErrors} === null`,
        () => y.assign(s.default.vErrors, (0, t._)`[${_}]`),
        (0, t._)`${s.default.vErrors}.push(${_})`
      ),
        y.code((0, t._)`${s.default.errors}++`);
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
        s.default.instancePath,
        (0, t.strConcat)(s.default.instancePath, _),
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
            [s.default.data, I]
          ),
        z && E.push([u.propertyName, z]);
    }
  })(Bs);
  Object.defineProperty(Ns, "__esModule", { value: !0 });
  Ns.boolOrEmptySchema = Ns.topBoolOrEmptySchema = void 0;
  const $4 = Bs,
    b4 = De,
    w4 = dr,
    E4 = {
      message: "boolean schema is false",
    };
  function O4(e) {
    const { gen: t, schema: r, validateName: s } = e;
    r === !1
      ? Sy(e, !1)
      : typeof r == "object" && r.$async === !0
        ? t.return(w4.default.data)
        : (t.assign((0, b4._)`${s}.errors`, null), t.return(!0));
  }
  Ns.topBoolOrEmptySchema = O4;
  function S4(e, t) {
    const { gen: r, schema: s } = e;
    s === !1 ? (r.var(t, !1), Sy(e)) : r.var(t, !0);
  }
  Ns.boolOrEmptySchema = S4;
  function Sy(e, t) {
    const { gen: r, data: s } = e,
      n = {
        gen: r,
        keyword: "false schema",
        data: s,
        schema: !1,
        schemaCode: !1,
        schemaValue: !1,
        params: {},
        it: e,
      };
    (0, $4.reportError)(n, E4, void 0, t);
  }
  var Qo = {},
    Xn = {};
  Object.defineProperty(Xn, "__esModule", { value: !0 });
  Xn.getRules = Xn.isJSONType = void 0;
  const A4 = [
      "string",
      "number",
      "integer",
      "boolean",
      "null",
      "object",
      "array",
    ],
    N4 = new Set(A4);
  function P4(e) {
    return typeof e == "string" && N4.has(e);
  }
  Xn.isJSONType = P4;
  function C4() {
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
  Xn.getRules = C4;
  var Br = {};
  Object.defineProperty(Br, "__esModule", { value: !0 });
  Br.shouldUseRule = Br.shouldUseGroup = Br.schemaHasRulesForType = void 0;
  function T4({ schema: e, self: t }, r) {
    const s = t.RULES.types[r];
    return s && s !== !0 && Ay(e, s);
  }
  Br.schemaHasRulesForType = T4;
  function Ay(e, t) {
    return t.rules.some(r => Ny(e, r));
  }
  Br.shouldUseGroup = Ay;
  function Ny(e, t) {
    var r;
    return (
      e[t.keyword] !== void 0 ||
      ((r = t.definition.implements) === null || r === void 0
        ? void 0
        : r.some(s => e[s] !== void 0))
    );
  }
  Br.shouldUseRule = Ny;
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
      s = Bs,
      n = De,
      o = Be;
    var i;
    (function (E) {
      (E[(E.Correct = 0)] = "Correct"), (E[(E.Wrong = 1)] = "Wrong");
    })((i = e.DataType || (e.DataType = {})));
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
        const H = m(S, A, O.strictNumbers, i.Wrong);
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
        z = A.let("dataType", (0, n._)`typeof ${O}`),
        H = A.let("coerced", (0, n._)`undefined`);
      L.coerceTypes === "array" &&
        A.if(
          (0, n._)`${z} == 'object' && Array.isArray(${O}) && ${O}.length == 1`,
          () =>
            A.assign(O, (0, n._)`${O}[0]`)
              .assign(z, (0, n._)`typeof ${O}`)
              .if(m(S, O, L.strictNumbers), () => A.assign(H, O))
        ),
        A.if((0, n._)`${H} !== undefined`);
      for (const G of I)
        (u.has(G) || (G === "array" && L.coerceTypes === "array")) && ne(G);
      A.else(),
        g(E),
        A.endIf(),
        A.if((0, n._)`${H} !== undefined`, () => {
          A.assign(O, H), p(E, H);
        });
      function ne(G) {
        switch (G) {
          case "string":
            A.elseIf((0, n._)`${z} == "number" || ${z} == "boolean"`)
              .assign(H, (0, n._)`"" + ${O}`)
              .elseIf((0, n._)`${O} === null`)
              .assign(H, (0, n._)`""`);
            return;
          case "number":
            A.elseIf(
              (0, n._)`${z} == "boolean" || ${O} === null
              || (${z} == "string" && ${O} && ${O} == +${O})`
            ).assign(H, (0, n._)`+${O}`);
            return;
          case "integer":
            A.elseIf(
              (0, n._)`${z} === "boolean" || ${O} === null
              || (${z} === "string" && ${O} && ${O} == +${O} && !(${O} % 1))`
            ).assign(H, (0, n._)`+${O}`);
            return;
          case "boolean":
            A.elseIf((0, n._)`${O} === "false" || ${O} === 0 || ${O} === null`)
              .assign(H, !1)
              .elseIf((0, n._)`${O} === "true" || ${O} === 1`)
              .assign(H, !0);
            return;
          case "null":
            A.elseIf((0, n._)`${O} === "" || ${O} === 0 || ${O} === false`),
              A.assign(H, null);
            return;
          case "array":
            A.elseIf(
              (0, n._)`${z} === "string" || ${z} === "number"
              || ${z} === "boolean" || ${O} === null`
            ).assign(H, (0, n._)`[${O}]`);
        }
      }
    }
    function p({ gen: E, parentData: S, parentDataProperty: I }, A) {
      E.if((0, n._)`${S} !== undefined`, () =>
        E.assign((0, n._)`${S}[${I}]`, A)
      );
    }
    function h(E, S, I, A = i.Correct) {
      const O = A === i.Correct ? n.operators.EQ : n.operators.NEQ;
      let L;
      switch (E) {
        case "null":
          return (0, n._)`${S} ${O} null`;
        case "array":
          L = (0, n._)`Array.isArray(${S})`;
          break;
        case "object":
          L = (0, n._)`${S} && typeof ${S} == "object" && !Array.isArray(${S})`;
          break;
        case "integer":
          L = z((0, n._)`!(${S} % 1) && !isNaN(${S})`);
          break;
        case "number":
          L = z();
          break;
        default:
          return (0, n._)`typeof ${S} ${O} ${E}`;
      }
      return A === i.Correct ? L : (0, n.not)(L);
      function z(H = n.nil) {
        return (0, n.and)(
          (0, n._)`typeof ${S} == "number"`,
          H,
          I ? (0, n._)`isFinite(${S})` : n.nil
        );
      }
    }
    e.checkDataType = h;
    function m(E, S, I, A) {
      if (E.length === 1) return h(E[0], S, I, A);
      let O;
      const L = (0, o.toHash)(E);
      if (L.array && L.object) {
        const z = (0, n._)`typeof ${S} != "object"`;
        (O = L.null ? z : (0, n._)`!${S} || ${z}`),
          delete L.null,
          delete L.array,
          delete L.object;
      } else O = n.nil;
      L.number && delete L.integer;
      for (const z in L) O = (0, n.and)(O, h(z, S, I, A));
      return O;
    }
    e.checkDataTypes = m;
    const y = {
      message: ({ schema: E }) => `must be ${E}`,
      params: ({ schema: E, schemaValue: S }) =>
        typeof E == "string" ? (0, n._)`{type: ${E}}` : (0, n._)`{type: ${S}}`,
    };
    function g(E) {
      const S = _(E);
      (0, s.reportError)(S, y);
    }
    e.reportTypeError = g;
    function _(E) {
      const { gen: S, data: I, schema: A } = E,
        O = (0, o.schemaRefOrVal)(E, A, "type");
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
  })(Qo);
  var Xa = {};
  Object.defineProperty(Xa, "__esModule", { value: !0 });
  Xa.assignDefaults = void 0;
  const hs = De,
    x4 = Be;
  function D4(e, t) {
    const { properties: r, items: s } = e.schema;
    if (t === "object" && r) for (const n in r) Nh(e, n, r[n].default);
    else
      t === "array" &&
        Array.isArray(s) &&
        s.forEach((n, o) => Nh(e, o, n.default));
  }
  Xa.assignDefaults = D4;
  function Nh(e, t, r) {
    const { gen: s, compositeRule: n, data: o, opts: i } = e;
    if (r === void 0) return;
    const a = (0, hs._)`${o}${(0, hs.getProperty)(t)}`;
    if (n) {
      (0, x4.checkStrictMode)(e, `default is ignored for: ${a}`);
      return;
    }
    let l = (0, hs._)`${a} === undefined`;
    i.useDefaults === "empty" &&
      (l = (0, hs._)`${l} || ${a} === null || ${a} === ""`),
      s.if(l, (0, hs._)`${a} = ${(0, hs.stringify)(r)}`);
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
    I4 = Be;
  function R4(e, t) {
    const { gen: r, data: s, it: n } = e;
    r.if(Ku(r, s, t, n.opts.ownProperties), () => {
      e.setParams({ missingProperty: (0, et._)`${t}` }, !0), e.error();
    });
  }
  je.checkReportMissingProp = R4;
  function M4({ gen: e, data: t, it: { opts: r } }, s, n) {
    return (0, et.or)(
      ...s.map(o =>
        (0, et.and)(Ku(e, t, o, r.ownProperties), (0, et._)`${n} = ${o}`)
      )
    );
  }
  je.checkMissingProp = M4;
  function j4(e, t) {
    e.setParams({ missingProperty: t }, !0), e.error();
  }
  je.reportMissingProp = j4;
  function Py(e) {
    return e.scopeValue("func", {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref: Object.prototype.hasOwnProperty,
      code: (0, et._)`Object.prototype.hasOwnProperty`,
    });
  }
  je.hasPropFunc = Py;
  function Hu(e, t, r) {
    return (0, et._)`${Py(e)}.call(${t}, ${r})`;
  }
  je.isOwnProperty = Hu;
  function F4(e, t, r, s) {
    const n = (0, et._)`${t}${(0, et.getProperty)(r)} !== undefined`;
    return s ? (0, et._)`${n} && ${Hu(e, t, r)}` : n;
  }
  je.propertyInData = F4;
  function Ku(e, t, r, s) {
    const n = (0, et._)`${t}${(0, et.getProperty)(r)} === undefined`;
    return s ? (0, et.or)(n, (0, et.not)(Hu(e, t, r))) : n;
  }
  je.noPropertyInData = Ku;
  function Cy(e) {
    return e ? Object.keys(e).filter(t => t !== "__proto__") : [];
  }
  je.allSchemaProperties = Cy;
  function L4(e, t) {
    return Cy(t).filter(r => !(0, Wu.alwaysValidSchema)(e, t[r]));
  }
  je.schemaProperties = L4;
  function V4(
    {
      schemaCode: e,
      data: t,
      it: { gen: r, topSchemaRef: s, schemaPath: n, errorPath: o },
      it: i,
    },
    a,
    l,
    c
  ) {
    const u = c ? (0, et._)`${e}, ${t}, ${s}${n}` : t,
      f = [
        [
          an.default.instancePath,
          (0, et.strConcat)(an.default.instancePath, o),
        ],
        [an.default.parentData, i.parentData],
        [an.default.parentDataProperty, i.parentDataProperty],
        [an.default.rootData, an.default.rootData],
      ];
    i.opts.dynamicRef &&
      f.push([an.default.dynamicAnchors, an.default.dynamicAnchors]);
    const d = (0, et._)`${u}, ${r.object(...f)}`;
    return l !== et.nil
      ? (0, et._)`${a}.call(${l}, ${d})`
      : (0, et._)`${a}(${d})`;
  }
  je.callValidateCode = V4;
  const k4 = (0, et._)`new RegExp`;
  function B4({ gen: e, it: { opts: t } }, r) {
    const s = t.unicodeRegExp ? "u" : "",
      { regExp: n } = t.code,
      o = n(r, s);
    return e.scopeValue("pattern", {
      key: o.toString(),
      ref: o,
      code: (0,
      et._)`${n.code === "new RegExp" ? k4 : (0, I4.useFunc)(e, n)}(${r}, ${s})`,
    });
  }
  je.usePattern = B4;
  function z4(e) {
    const { gen: t, data: r, keyword: s, it: n } = e,
      o = t.name("valid");
    if (n.allErrors) {
      const a = t.let("valid", !0);
      return i(() => t.assign(a, !1)), a;
    }
    return t.var(o, !0), i(() => t.break()), o;
    function i(a) {
      const l = t.const("len", (0, et._)`${r}.length`);
      t.forRange("i", 0, l, c => {
        e.subschema(
          {
            keyword: s,
            dataProp: c,
            dataPropType: Wu.Type.Num,
          },
          o
        ),
          t.if((0, et.not)(o), a);
      });
    }
  }
  je.validateArray = z4;
  function U4(e) {
    const { gen: t, schema: r, keyword: s, it: n } = e;
    if (!Array.isArray(r)) throw new Error("ajv implementation error");
    if (r.some(l => (0, Wu.alwaysValidSchema)(n, l)) && !n.opts.unevaluated)
      return;
    const i = t.let("valid", !1),
      a = t.name("_valid");
    t.block(() =>
      r.forEach((l, c) => {
        const u = e.subschema(
          {
            keyword: s,
            schemaProp: c,
            compositeRule: !0,
          },
          a
        );
        t.assign(i, (0, et._)`${i} || ${a}`),
          e.mergeValidEvaluated(u, a) || t.if((0, et.not)(i));
      })
    ),
      e.result(
        i,
        () => e.reset(),
        () => e.error(!0)
      );
  }
  je.validateUnion = U4;
  Object.defineProperty(br, "__esModule", { value: !0 });
  br.validateKeywordUsage =
    br.validSchemaType =
    br.funcKeywordCode =
    br.macroKeywordCode =
      void 0;
  const It = De,
    Mn = dr,
    W4 = je,
    H4 = Bs;
  function K4(e, t) {
    const { gen: r, keyword: s, schema: n, parentSchema: o, it: i } = e,
      a = t.macro.call(i.self, n, o, i),
      l = Ty(r, s, a);
    i.opts.validateSchema !== !1 && i.self.validateSchema(a, !0);
    const c = r.name("valid");
    e.subschema(
      {
        schema: a,
        schemaPath: It.nil,
        errSchemaPath: `${i.errSchemaPath}/${s}`,
        topSchemaRef: l,
        compositeRule: !0,
      },
      c
    ),
      e.pass(c, () => e.error(!0));
  }
  br.macroKeywordCode = K4;
  function G4(e, t) {
    var r;
    const {
      gen: s,
      keyword: n,
      schema: o,
      parentSchema: i,
      $data: a,
      it: l,
    } = e;
    Y4(l, t);
    const c = !a && t.compile ? t.compile.call(l.self, o, i, l) : t.validate,
      u = Ty(s, n, c),
      f = s.let("valid");
    e.block$data(f, d), e.ok((r = t.valid) !== null && r !== void 0 ? r : f);
    function d() {
      if (t.errors === !1) m(), t.modifying && Ph(e), y(() => e.error());
      else {
        const g = t.async ? p() : h();
        t.modifying && Ph(e), y(() => q4(e, g));
      }
    }
    function p() {
      const g = s.let("ruleErrs", null);
      return (
        s.try(
          () => m((0, It._)`await `),
          _ =>
            s.assign(f, !1).if(
              (0, It._)`${_} instanceof ${l.ValidationError}`,
              () => s.assign(g, (0, It._)`${_}.errors`),
              () => s.throw(_)
            )
        ),
        g
      );
    }
    function h() {
      const g = (0, It._)`${u}.errors`;
      return s.assign(g, null), m(It.nil), g;
    }
    function m(g = t.async ? (0, It._)`await ` : It.nil) {
      const _ = l.opts.passContext ? Mn.default.this : Mn.default.self,
        E = !(("compile" in t && !a) || t.schema === !1);
      s.assign(
        f,
        (0, It._)`${g}${(0, W4.callValidateCode)(e, u, _, E)}`,
        t.modifying
      );
    }
    function y(g) {
      var _;
      s.if((0, It.not)((_ = t.valid) !== null && _ !== void 0 ? _ : f), g);
    }
  }
  br.funcKeywordCode = G4;
  function Ph(e) {
    const { gen: t, data: r, it: s } = e;
    t.if(s.parentData, () =>
      t.assign(r, (0, It._)`${s.parentData}[${s.parentDataProperty}]`)
    );
  }
  function q4(e, t) {
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
          (0, H4.extendErrors)(e);
      },
      () => e.error()
    );
  }
  function Y4({ schemaEnv: e }, t) {
    if (t.async && !e.$async) throw new Error("async keyword in sync schema");
  }
  function Ty(e, t, r) {
    if (r === void 0) throw new Error(`keyword "${t}" failed to compile`);
    return e.scopeValue(
      "keyword",
      typeof r == "function"
        ? { ref: r }
        : { ref: r, code: (0, It.stringify)(r) }
    );
  }
  function J4(e, t, r = !1) {
    return (
      !t.length ||
      t.some(s =>
        s === "array"
          ? Array.isArray(e)
          : s === "object"
            ? e && typeof e == "object" && !Array.isArray(e)
            : typeof e == s || (r && typeof e > "u")
      )
    );
  }
  br.validSchemaType = J4;
  function X4({ schema: e, opts: t, self: r, errSchemaPath: s }, n, o) {
    if (Array.isArray(n.keyword) ? !n.keyword.includes(o) : n.keyword !== o)
      throw new Error("ajv implementation error");
    const i = n.dependencies;
    if (i != null && i.some(a => !Object.prototype.hasOwnProperty.call(e, a)))
      throw new Error(
        `parent schema must have dependencies of ${o}: ${i.join(",")}`
      );
    if (n.validateSchema && !n.validateSchema(e[o])) {
      const l =
        `keyword "${o}" value is invalid at path "${s}": ` +
        r.errorsText(n.validateSchema.errors);
      if (t.validateSchema === "log") r.logger.error(l);
      else throw new Error(l);
    }
  }
  br.validateKeywordUsage = X4;
  var vn = {};
  Object.defineProperty(vn, "__esModule", { value: !0 });
  vn.extendSubschemaMode = vn.extendSubschemaData = vn.getSubschema = void 0;
  const _r = De,
    xy = Be;
  function Z4(
    e,
    {
      keyword: t,
      schemaProp: r,
      schema: s,
      schemaPath: n,
      errSchemaPath: o,
      topSchemaRef: i,
    }
  ) {
    if (t !== void 0 && s !== void 0)
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
            errSchemaPath: `${e.errSchemaPath}/${t}/${(0, xy.escapeFragment)(r)}`,
          };
    }
    if (s !== void 0) {
      if (n === void 0 || o === void 0 || i === void 0)
        throw new Error(
          '"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"'
        );
      return {
        schema: s,
        schemaPath: n,
        topSchemaRef: i,
        errSchemaPath: o,
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  vn.getSubschema = Z4;
  function Q4(
    e,
    t,
    { dataProp: r, dataPropType: s, data: n, dataTypes: o, propertyName: i }
  ) {
    if (n !== void 0 && r !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: a } = t;
    if (r !== void 0) {
      const { errorPath: c, dataPathArr: u, opts: f } = t,
        d = a.let("data", (0, _r._)`${t.data}${(0, _r.getProperty)(r)}`, !0);
      l(d),
        (e.errorPath = (0,
        _r.str)`${c}${(0, xy.getErrorPath)(r, s, f.jsPropertySyntax)}`),
        (e.parentDataProperty = (0, _r._)`${r}`),
        (e.dataPathArr = [...u, e.parentDataProperty]);
    }
    if (n !== void 0) {
      const c = n instanceof _r.Name ? n : a.let("data", n, !0);
      l(c), i !== void 0 && (e.propertyName = i);
    }
    o && (e.dataTypes = o);
    function l(c) {
      (e.data = c),
        (e.dataLevel = t.dataLevel + 1),
        (e.dataTypes = []),
        (t.definedProperties = /* @__PURE__ */ new Set()),
        (e.parentData = t.data),
        (e.dataNames = [...t.dataNames, c]);
    }
  }
  vn.extendSubschemaData = Q4;
  function eU(
    e,
    {
      jtdDiscriminator: t,
      jtdMetadata: r,
      compositeRule: s,
      createErrors: n,
      allErrors: o,
    }
  ) {
    s !== void 0 && (e.compositeRule = s),
      n !== void 0 && (e.createErrors = n),
      o !== void 0 && (e.allErrors = o),
      (e.jtdDiscriminator = t),
      (e.jtdMetadata = r);
  }
  vn.extendSubschemaMode = eU;
  var wt = {},
    Dy = function e(t, r) {
      if (t === r) return !0;
      if (t && r && typeof t == "object" && typeof r == "object") {
        if (t.constructor !== r.constructor) return !1;
        var s, n, o;
        if (Array.isArray(t)) {
          if (((s = t.length), s != r.length)) return !1;
          for (n = s; n-- !== 0; ) if (!e(t[n], r[n])) return !1;
          return !0;
        }
        if (t.constructor === RegExp)
          return t.source === r.source && t.flags === r.flags;
        if (t.valueOf !== Object.prototype.valueOf)
          return t.valueOf() === r.valueOf();
        if (t.toString !== Object.prototype.toString)
          return t.toString() === r.toString();
        if (((o = Object.keys(t)), (s = o.length), s !== Object.keys(r).length))
          return !1;
        for (n = s; n-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(r, o[n])) return !1;
        for (n = s; n-- !== 0; ) {
          var i = o[n];
          if (!e(t[i], r[i])) return !1;
        }
        return !0;
      }
      return t !== t && r !== r;
    },
    Iy = { exports: {} },
    hn = (Iy.exports = function (e, t, r) {
      typeof t == "function" && ((r = t), (t = {})), (r = t.cb || r);
      var s = typeof r == "function" ? r : r.pre || function () {},
        n = r.post || function () {};
      Ri(t, s, n, e, "", e);
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
  function Ri(e, t, r, s, n, o, i, a, l, c) {
    if (s && typeof s == "object" && !Array.isArray(s)) {
      t(s, n, o, i, a, l, c);
      for (var u in s) {
        var f = s[u];
        if (Array.isArray(f)) {
          if (u in hn.arrayKeywords)
            for (var d = 0; d < f.length; d++)
              Ri(e, t, r, f[d], n + "/" + u + "/" + d, o, n, u, s, d);
        } else if (u in hn.propsKeywords) {
          if (f && typeof f == "object")
            for (var p in f)
              Ri(e, t, r, f[p], n + "/" + u + "/" + tU(p), o, n, u, s, p);
        } else
          (u in hn.keywords || (e.allKeys && !(u in hn.skipKeywords))) &&
            Ri(e, t, r, f, n + "/" + u, o, n, u, s);
      }
      r(s, n, o, i, a, l, c);
    }
  }
  function tU(e) {
    return e.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  var rU = Iy.exports;
  Object.defineProperty(wt, "__esModule", { value: !0 });
  wt.getSchemaRefs =
    wt.resolveUrl =
    wt.normalizeId =
    wt._getFullPath =
    wt.getFullPath =
    wt.inlineRef =
      void 0;
  const nU = Be,
    sU = Dy,
    oU = rU,
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
  function aU(e, t = !0) {
    return typeof e == "boolean" ? !0 : t === !0 ? !yc(e) : t ? Ry(e) <= t : !1;
  }
  wt.inlineRef = aU;
  const lU = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor",
  ]);
  function yc(e) {
    for (const t in e) {
      if (lU.has(t)) return !0;
      const r = e[t];
      if ((Array.isArray(r) && r.some(yc)) || (typeof r == "object" && yc(r)))
        return !0;
    }
    return !1;
  }
  function Ry(e) {
    let t = 0;
    for (const r in e) {
      if (r === "$ref") return 1 / 0;
      if (
        (t++,
        !iU.has(r) &&
          (typeof e[r] == "object" && (0, nU.eachItem)(e[r], s => (t += Ry(s))),
          t === 1 / 0))
      )
        return 1 / 0;
    }
    return t;
  }
  function My(e, t = "", r) {
    r !== !1 && (t = Es(t));
    const s = e.parse(t);
    return jy(e, s);
  }
  wt.getFullPath = My;
  function jy(e, t) {
    return e.serialize(t).split("#")[0] + "#";
  }
  wt._getFullPath = jy;
  const cU = /#\/?$/;
  function Es(e) {
    return e ? e.replace(cU, "") : "";
  }
  wt.normalizeId = Es;
  function uU(e, t, r) {
    return (r = Es(r)), e.resolve(t, r);
  }
  wt.resolveUrl = uU;
  const fU = /^[a-z_][-a-z0-9._]*$/i;
  function dU(e, t) {
    if (typeof e == "boolean") return {};
    const { schemaId: r, uriResolver: s } = this.opts,
      n = Es(e[r] || t),
      o = { "": n },
      i = My(s, n, !1),
      a = {},
      l = /* @__PURE__ */ new Set();
    return (
      oU(e, { allKeys: !0 }, (f, d, p, h) => {
        if (h === void 0) return;
        const m = i + d;
        let y = o[h];
        typeof f[r] == "string" && (y = g.call(this, f[r])),
          _.call(this, f.$anchor),
          _.call(this, f.$dynamicAnchor),
          (o[d] = y);
        function g(E) {
          const S = this.opts.uriResolver.resolve;
          if (((E = Es(y ? S(y, E) : E)), l.has(E))) throw u(E);
          l.add(E);
          let I = this.refs[E];
          return (
            typeof I == "string" && (I = this.refs[I]),
            typeof I == "object"
              ? c(f, I.schema, E)
              : E !== Es(m) &&
                (E[0] === "#"
                  ? (c(f, a[E], E), (a[E] = f))
                  : (this.refs[E] = m)),
            E
          );
        }
        function _(E) {
          if (typeof E == "string") {
            if (!fU.test(E)) throw new Error(`invalid anchor "${E}"`);
            g.call(this, `#${E}`);
          }
        }
      }),
      a
    );
    function c(f, d, p) {
      if (d !== void 0 && !sU(f, d)) throw u(p);
    }
    function u(f) {
      return new Error(`reference "${f}" resolves to more than one schema`);
    }
  }
  wt.getSchemaRefs = dU;
  Object.defineProperty(Zt, "__esModule", { value: !0 });
  Zt.getData = Zt.KeywordCxt = Zt.validateFunctionCode = void 0;
  const Fy = Ns,
    Ch = Qo,
    Gu = Br,
    ca = Qo,
    pU = Xa,
    $o = br,
    Dl = vn,
    ce = De,
    Ee = dr,
    hU = wt,
    zr = Be,
    so = Bs;
  function gU(e) {
    if (ky(e) && (By(e), Vy(e))) {
      yU(e);
      return;
    }
    Ly(e, () => (0, Fy.topBoolOrEmptySchema)(e));
  }
  Zt.validateFunctionCode = gU;
  function Ly(
    { gen: e, validateName: t, schema: r, schemaEnv: s, opts: n },
    o
  ) {
    n.code.es5
      ? e.func(
          t,
          (0, ce._)`${Ee.default.data}, ${Ee.default.valCxt}`,
          s.$async,
          () => {
            e.code((0, ce._)`"use strict"; ${Th(r, n)}`), vU(e, n), e.code(o);
          }
        )
      : e.func(t, (0, ce._)`${Ee.default.data}, ${mU(n)}`, s.$async, () =>
          e.code(Th(r, n)).code(o)
        );
  }
  function mU(e) {
    return (0,
    ce._)`{${Ee.default.instancePath}="", ${Ee.default.parentData}, ${Ee.default.parentDataProperty}, ${Ee.default.rootData}=${Ee.default.data}${e.dynamicRef ? (0, ce._)`, ${Ee.default.dynamicAnchors}={}` : ce.nil}}={}`;
  }
  function vU(e, t) {
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
  function yU(e) {
    const { schema: t, opts: r, gen: s } = e;
    Ly(e, () => {
      r.$comment && t.$comment && Uy(e),
        EU(e),
        s.let(Ee.default.vErrors, null),
        s.let(Ee.default.errors, 0),
        r.unevaluated && _U(e),
        zy(e),
        AU(e);
    });
  }
  function _U(e) {
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
  function $U(e, t) {
    if (ky(e) && (By(e), Vy(e))) {
      bU(e, t);
      return;
    }
    (0, Fy.boolOrEmptySchema)(e, t);
  }
  function Vy({ schema: e, self: t }) {
    if (typeof e == "boolean") return !e;
    for (const r in e) if (t.RULES.all[r]) return !0;
    return !1;
  }
  function ky(e) {
    return typeof e.schema != "boolean";
  }
  function bU(e, t) {
    const { schema: r, gen: s, opts: n } = e;
    n.$comment && r.$comment && Uy(e), OU(e), SU(e);
    const o = s.const("_errs", Ee.default.errors);
    zy(e, o), s.var(t, (0, ce._)`${o} === ${Ee.default.errors}`);
  }
  function By(e) {
    (0, zr.checkUnknownRules)(e), wU(e);
  }
  function zy(e, t) {
    if (e.opts.jtd) return xh(e, [], !1, t);
    const r = (0, Ch.getSchemaTypes)(e.schema),
      s = (0, Ch.coerceAndCheckDataType)(e, r);
    xh(e, r, !s, t);
  }
  function wU(e) {
    const { schema: t, errSchemaPath: r, opts: s, self: n } = e;
    t.$ref &&
      s.ignoreKeywordsWithRef &&
      (0, zr.schemaHasRulesButRef)(t, n.RULES) &&
      n.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
  }
  function EU(e) {
    const { schema: t, opts: r } = e;
    t.default !== void 0 &&
      r.useDefaults &&
      r.strictSchema &&
      (0, zr.checkStrictMode)(e, "default is ignored in the schema root");
  }
  function OU(e) {
    const t = e.schema[e.opts.schemaId];
    t && (e.baseId = (0, hU.resolveUrl)(e.opts.uriResolver, e.baseId, t));
  }
  function SU(e) {
    if (e.schema.$async && !e.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function Uy({ gen: e, schemaEnv: t, schema: r, errSchemaPath: s, opts: n }) {
    const o = r.$comment;
    if (n.$comment === !0)
      e.code((0, ce._)`${Ee.default.self}.logger.log(${o})`);
    else if (typeof n.$comment == "function") {
      const i = (0, ce.str)`${s}/$comment`,
        a = e.scopeValue("root", { ref: t.root });
      e.code(
        (0, ce._)`${Ee.default.self}.opts.$comment(${o}, ${i}, ${a}.schema)`
      );
    }
  }
  function AU(e) {
    const {
      gen: t,
      schemaEnv: r,
      validateName: s,
      ValidationError: n,
      opts: o,
    } = e;
    r.$async
      ? t.if(
          (0, ce._)`${Ee.default.errors} === 0`,
          () => t.return(Ee.default.data),
          () => t.throw((0, ce._)`new ${n}(${Ee.default.vErrors})`)
        )
      : (t.assign((0, ce._)`${s}.errors`, Ee.default.vErrors),
        o.unevaluated && NU(e),
        t.return((0, ce._)`${Ee.default.errors} === 0`));
  }
  function NU({ gen: e, evaluated: t, props: r, items: s }) {
    r instanceof ce.Name && e.assign((0, ce._)`${t}.props`, r),
      s instanceof ce.Name && e.assign((0, ce._)`${t}.items`, s);
  }
  function xh(e, t, r, s) {
    const { gen: n, schema: o, data: i, allErrors: a, opts: l, self: c } = e,
      { RULES: u } = c;
    if (
      o.$ref &&
      (l.ignoreKeywordsWithRef || !(0, zr.schemaHasRulesButRef)(o, u))
    ) {
      n.block(() => Ky(e, "$ref", u.all.$ref.definition));
      return;
    }
    l.jtd || PU(e, t),
      n.block(() => {
        for (const d of u.rules) f(d);
        f(u.post);
      });
    function f(d) {
      (0, Gu.shouldUseGroup)(o, d) &&
        (d.type
          ? (n.if((0, ca.checkDataType)(d.type, i, l.strictNumbers)),
            Dh(e, d),
            t.length === 1 &&
              t[0] === d.type &&
              r &&
              (n.else(), (0, ca.reportTypeError)(e)),
            n.endIf())
          : Dh(e, d),
        a || n.if((0, ce._)`${Ee.default.errors} === ${s || 0}`));
    }
  }
  function Dh(e, t) {
    const {
      gen: r,
      schema: s,
      opts: { useDefaults: n },
    } = e;
    n && (0, pU.assignDefaults)(e, t.type),
      r.block(() => {
        for (const o of t.rules)
          (0, Gu.shouldUseRule)(s, o) && Ky(e, o.keyword, o.definition, t.type);
      });
  }
  function PU(e, t) {
    e.schemaEnv.meta ||
      !e.opts.strictTypes ||
      (CU(e, t), e.opts.allowUnionTypes || TU(e, t), xU(e, e.dataTypes));
  }
  function CU(e, t) {
    if (t.length) {
      if (!e.dataTypes.length) {
        e.dataTypes = t;
        return;
      }
      t.forEach(r => {
        Wy(e.dataTypes, r) ||
          qu(
            e,
            `type "${r}" not allowed by context "${e.dataTypes.join(",")}"`
          );
      }),
        IU(e, t);
    }
  }
  function TU(e, t) {
    t.length > 1 &&
      !(t.length === 2 && t.includes("null")) &&
      qu(e, "use allowUnionTypes to allow union type keyword");
  }
  function xU(e, t) {
    const r = e.self.RULES.all;
    for (const s in r) {
      const n = r[s];
      if (typeof n == "object" && (0, Gu.shouldUseRule)(e.schema, n)) {
        const { type: o } = n.definition;
        o.length &&
          !o.some(i => DU(t, i)) &&
          qu(e, `missing type "${o.join(",")}" for keyword "${s}"`);
      }
    }
  }
  function DU(e, t) {
    return e.includes(t) || (t === "number" && e.includes("integer"));
  }
  function Wy(e, t) {
    return e.includes(t) || (t === "integer" && e.includes("number"));
  }
  function IU(e, t) {
    const r = [];
    for (const s of e.dataTypes)
      Wy(t, s)
        ? r.push(s)
        : t.includes("integer") && s === "number" && r.push("integer");
    e.dataTypes = r;
  }
  function qu(e, t) {
    const r = e.schemaEnv.baseId + e.errSchemaPath;
    (t += ` at "${r}" (strictTypes)`),
      (0, zr.checkStrictMode)(e, t, e.opts.strictTypes);
  }
  class Hy {
    constructor(t, r, s) {
      if (
        ((0, $o.validateKeywordUsage)(t, r, s),
        (this.gen = t.gen),
        (this.allErrors = t.allErrors),
        (this.keyword = s),
        (this.data = t.data),
        (this.schema = t.schema[s]),
        (this.$data =
          r.$data && t.opts.$data && this.schema && this.schema.$data),
        (this.schemaValue = (0, zr.schemaRefOrVal)(
          t,
          this.schema,
          s,
          this.$data
        )),
        (this.schemaType = r.schemaType),
        (this.parentSchema = t.schema),
        (this.params = {}),
        (this.it = t),
        (this.def = r),
        this.$data)
      )
        this.schemaCode = t.gen.const("vSchema", Gy(this.$data, t));
      else if (
        ((this.schemaCode = this.schemaValue),
        !(0, $o.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      )
        throw new Error(`${s} value must be ${JSON.stringify(r.schemaType)}`);
      ("code" in r ? r.trackErrors : r.errors !== !1) &&
        (this.errsCount = t.gen.const("_errs", Ee.default.errors));
    }
    result(t, r, s) {
      this.failResult((0, ce.not)(t), r, s);
    }
    failResult(t, r, s) {
      this.gen.if(t),
        s ? s() : this.error(),
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
    error(t, r, s) {
      if (r) {
        this.setParams(r), this._error(t, s), this.setParams({});
        return;
      }
      this._error(t, s);
    }
    _error(t, r) {
      (t ? so.reportExtraError : so.reportError)(this, this.def.error, r);
    }
    $dataError() {
      (0, so.reportError)(this, this.def.$dataError || so.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, so.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(t) {
      this.allErrors || this.gen.if(t);
    }
    setParams(t, r) {
      r ? Object.assign(this.params, t) : (this.params = t);
    }
    block$data(t, r, s = ce.nil) {
      this.gen.block(() => {
        this.check$data(t, s), r();
      });
    }
    check$data(t = ce.nil, r = ce.nil) {
      if (!this.$data) return;
      const { gen: s, schemaCode: n, schemaType: o, def: i } = this;
      s.if((0, ce.or)((0, ce._)`${n} === undefined`, r)),
        t !== ce.nil && s.assign(t, !0),
        (o.length || i.validateSchema) &&
          (s.elseIf(this.invalid$data()),
          this.$dataError(),
          t !== ce.nil && s.assign(t, !1)),
        s.else();
    }
    invalid$data() {
      const { gen: t, schemaCode: r, schemaType: s, def: n, it: o } = this;
      return (0, ce.or)(i(), a());
      function i() {
        if (s.length) {
          if (!(r instanceof ce.Name))
            throw new Error("ajv implementation error");
          const l = Array.isArray(s) ? s : [s];
          return (0,
          ce._)`${(0, ca.checkDataTypes)(l, r, o.opts.strictNumbers, ca.DataType.Wrong)}`;
        }
        return ce.nil;
      }
      function a() {
        if (n.validateSchema) {
          const l = t.scopeValue("validate$data", { ref: n.validateSchema });
          return (0, ce._)`!${l}(${r})`;
        }
        return ce.nil;
      }
    }
    subschema(t, r) {
      const s = (0, Dl.getSubschema)(this.it, t);
      (0, Dl.extendSubschemaData)(s, this.it, t),
        (0, Dl.extendSubschemaMode)(s, t);
      const n = { ...this.it, ...s, items: void 0, props: void 0 };
      return $U(n, r), n;
    }
    mergeEvaluated(t, r) {
      const { it: s, gen: n } = this;
      s.opts.unevaluated &&
        (s.props !== !0 &&
          t.props !== void 0 &&
          (s.props = zr.mergeEvaluated.props(n, t.props, s.props, r)),
        s.items !== !0 &&
          t.items !== void 0 &&
          (s.items = zr.mergeEvaluated.items(n, t.items, s.items, r)));
    }
    mergeValidEvaluated(t, r) {
      const { it: s, gen: n } = this;
      if (s.opts.unevaluated && (s.props !== !0 || s.items !== !0))
        return n.if(r, () => this.mergeEvaluated(t, ce.Name)), !0;
    }
  }
  Zt.KeywordCxt = Hy;
  function Ky(e, t, r, s) {
    const n = new Hy(e, r, t);
    "code" in r
      ? r.code(n, s)
      : n.$data && r.validate
        ? (0, $o.funcKeywordCode)(n, r)
        : "macro" in r
          ? (0, $o.macroKeywordCode)(n, r)
          : (r.compile || r.validate) && (0, $o.funcKeywordCode)(n, r);
  }
  const RU = /^\/(?:[^~]|~0|~1)*$/,
    MU = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function Gy(e, { dataLevel: t, dataNames: r, dataPathArr: s }) {
    let n, o;
    if (e === "") return Ee.default.rootData;
    if (e[0] === "/") {
      if (!RU.test(e)) throw new Error(`Invalid JSON-pointer: ${e}`);
      (n = e), (o = Ee.default.rootData);
    } else {
      const c = MU.exec(e);
      if (!c) throw new Error(`Invalid JSON-pointer: ${e}`);
      const u = +c[1];
      if (((n = c[2]), n === "#")) {
        if (u >= t) throw new Error(l("property/index", u));
        return s[t - u];
      }
      if (u > t) throw new Error(l("data", u));
      if (((o = r[t - u]), !n)) return o;
    }
    let i = o;
    const a = n.split("/");
    for (const c of a)
      c &&
        ((o = (0,
        ce._)`${o}${(0, ce.getProperty)((0, zr.unescapeJsonPointer)(c))}`),
        (i = (0, ce._)`${i} && ${o}`));
    return i;
    function l(c, u) {
      return `Cannot access ${c} ${u} levels up, current level is ${t}`;
    }
  }
  Zt.getData = Gy;
  var ei = {};
  Object.defineProperty(ei, "__esModule", { value: !0 });
  class jU extends Error {
    constructor(t) {
      super("validation failed"),
        (this.errors = t),
        (this.ajv = this.validation = !0);
    }
  }
  ei.default = jU;
  var ti = {};
  Object.defineProperty(ti, "__esModule", { value: !0 });
  const Il = wt;
  class FU extends Error {
    constructor(t, r, s, n) {
      super(n || `can't resolve reference ${s} from id ${r}`),
        (this.missingRef = (0, Il.resolveUrl)(t, r, s)),
        (this.missingSchema = (0, Il.normalizeId)(
          (0, Il.getFullPath)(t, this.missingRef)
        ));
    }
  }
  ti.default = FU;
  var kt = {};
  Object.defineProperty(kt, "__esModule", { value: !0 });
  kt.resolveSchema =
    kt.getCompilingSchema =
    kt.resolveRef =
    kt.compileSchema =
    kt.SchemaEnv =
      void 0;
  const rr = De,
    LU = ei,
    Dn = dr,
    or = wt,
    Ih = Be,
    VU = Zt;
  class Za {
    constructor(t) {
      var r;
      (this.refs = {}), (this.dynamicAnchors = {});
      let s;
      typeof t.schema == "object" && (s = t.schema),
        (this.schema = t.schema),
        (this.schemaId = t.schemaId),
        (this.root = t.root || this),
        (this.baseId =
          (r = t.baseId) !== null && r !== void 0
            ? r
            : (0, or.normalizeId)(s == null ? void 0 : s[t.schemaId || "$id"])),
        (this.schemaPath = t.schemaPath),
        (this.localRefs = t.localRefs),
        (this.meta = t.meta),
        (this.$async = s == null ? void 0 : s.$async),
        (this.refs = {});
    }
  }
  kt.SchemaEnv = Za;
  function Yu(e) {
    const t = qy.call(this, e);
    if (t) return t;
    const r = (0, or.getFullPath)(this.opts.uriResolver, e.root.baseId),
      { es5: s, lines: n } = this.opts.code,
      { ownProperties: o } = this.opts,
      i = new rr.CodeGen(this.scope, { es5: s, lines: n, ownProperties: o });
    let a;
    e.$async &&
      (a = i.scopeValue("Error", {
        ref: LU.default,
        code: (0, rr._)`require("ajv/dist/runtime/validation_error").default`,
      }));
    const l = i.scopeName("validate");
    e.validateName = l;
    const c = {
      gen: i,
      allErrors: this.opts.allErrors,
      data: Dn.default.data,
      parentData: Dn.default.parentData,
      parentDataProperty: Dn.default.parentDataProperty,
      dataNames: [Dn.default.data],
      dataPathArr: [rr.nil],
      dataLevel: 0,
      dataTypes: [],
      definedProperties: /* @__PURE__ */ new Set(),
      topSchemaRef: i.scopeValue(
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
        (0, VU.validateFunctionCode)(c),
        i.optimize(this.opts.code.optimize);
      const f = i.toString();
      (u = `${i.scopeRefs(Dn.default.scope)}return ${f}`),
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
            scopeValues: i._values,
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
  function kU(e, t, r) {
    var s;
    r = (0, or.resolveUrl)(this.opts.uriResolver, t, r);
    const n = e.refs[r];
    if (n) return n;
    let o = UU.call(this, e, r);
    if (o === void 0) {
      const i = (s = e.localRefs) === null || s === void 0 ? void 0 : s[r],
        { schemaId: a } = this.opts;
      i && (o = new Za({ schema: i, schemaId: a, root: e, baseId: t }));
    }
    if (o !== void 0) return (e.refs[r] = BU.call(this, o));
  }
  kt.resolveRef = kU;
  function BU(e) {
    return (0, or.inlineRef)(e.schema, this.opts.inlineRefs)
      ? e.schema
      : e.validate
        ? e
        : Yu.call(this, e);
  }
  function qy(e) {
    for (const t of this._compilations) if (zU(t, e)) return t;
  }
  kt.getCompilingSchema = qy;
  function zU(e, t) {
    return e.schema === t.schema && e.root === t.root && e.baseId === t.baseId;
  }
  function UU(e, t) {
    let r;
    for (; typeof (r = this.refs[t]) == "string"; ) t = r;
    return r || this.schemas[t] || Qa.call(this, e, t);
  }
  function Qa(e, t) {
    const r = this.opts.uriResolver.parse(t),
      s = (0, or._getFullPath)(this.opts.uriResolver, r);
    let n = (0, or.getFullPath)(this.opts.uriResolver, e.baseId, void 0);
    if (Object.keys(e.schema).length > 0 && s === n) return Rl.call(this, r, e);
    const o = (0, or.normalizeId)(s),
      i = this.refs[o] || this.schemas[o];
    if (typeof i == "string") {
      const a = Qa.call(this, e, i);
      return typeof (a == null ? void 0 : a.schema) != "object"
        ? void 0
        : Rl.call(this, r, a);
    }
    if (typeof (i == null ? void 0 : i.schema) == "object") {
      if ((i.validate || Yu.call(this, i), o === (0, or.normalizeId)(t))) {
        const { schema: a } = i,
          { schemaId: l } = this.opts,
          c = a[l];
        return (
          c && (n = (0, or.resolveUrl)(this.opts.uriResolver, n, c)),
          new Za({ schema: a, schemaId: l, root: e, baseId: n })
        );
      }
      return Rl.call(this, r, i);
    }
  }
  kt.resolveSchema = Qa;
  const WU = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions",
  ]);
  function Rl(e, { baseId: t, schema: r, root: s }) {
    var n;
    if (((n = e.fragment) === null || n === void 0 ? void 0 : n[0]) !== "/")
      return;
    for (const a of e.fragment.slice(1).split("/")) {
      if (typeof r == "boolean") return;
      const l = r[(0, Ih.unescapeFragment)(a)];
      if (l === void 0) return;
      r = l;
      const c = typeof r == "object" && r[this.opts.schemaId];
      !WU.has(a) && c && (t = (0, or.resolveUrl)(this.opts.uriResolver, t, c));
    }
    let o;
    if (
      typeof r != "boolean" &&
      r.$ref &&
      !(0, Ih.schemaHasRulesButRef)(r, this.RULES)
    ) {
      const a = (0, or.resolveUrl)(this.opts.uriResolver, t, r.$ref);
      o = Qa.call(this, s, a);
    }
    const { schemaId: i } = this.opts;
    if (
      ((o = o || new Za({ schema: r, schemaId: i, root: s, baseId: t })),
      o.schema !== o.root.schema)
    )
      return o;
  }
  const HU =
      "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
    KU = "Meta-schema for $data reference (JSON AnySchema extension proposal)",
    GU = "object",
    qU = ["$data"],
    YU = {
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
    JU = !1,
    XU = {
      $id: HU,
      description: KU,
      type: GU,
      required: qU,
      properties: YU,
      additionalProperties: JU,
    };
  var Ju = {},
    _c = { exports: {} };
  /** @license URI.js v4.4.1 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */
  (function (e, t) {
    (function (r, s) {
      s(t);
    })(lo, function (r) {
      function s() {
        for (var C = arguments.length, b = Array(C), x = 0; x < C; x++)
          b[x] = arguments[x];
        if (b.length > 1) {
          b[0] = b[0].slice(0, -1);
          for (var B = b.length - 1, k = 1; k < B; ++k)
            b[k] = b[k].slice(1, -1);
          return (b[B] = b[B].slice(1)), b.join("");
        } else return b[0];
      }
      function n(C) {
        return "(?:" + C + ")";
      }
      function o(C) {
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
      function i(C) {
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
          B = s(x, "[A-Fa-f]"),
          k = n(
            n("%[EFef]" + B + "%" + B + B + "%" + B + B) +
              "|" +
              n("%[89A-Fa-f]" + B + "%" + B + B) +
              "|" +
              n("%" + B + B)
          ),
          pe = "[\\:\\/\\?\\#\\[\\]\\@]",
          ge = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
          ke = s(pe, ge),
          Je = C
            ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]"
            : "[]",
          at = C ? "[\\uE000-\\uF8FF]" : "[]",
          Le = s(b, x, "[\\-\\.\\_\\~]", Je);
        n(b + s(b, x, "[\\+\\-\\.]") + "*"),
          n(n(k + "|" + s(Le, ge, "[\\:]")) + "*");
        var Ge = n(
            n("25[0-5]") +
              "|" +
              n("2[0-4]" + x) +
              "|" +
              n("1" + x + x) +
              "|" +
              n("0?[1-9]" + x) +
              "|0?0?" +
              x
          ),
          lt = n(Ge + "\\." + Ge + "\\." + Ge + "\\." + Ge),
          Ae = n(B + "{1,4}"),
          rt = n(n(Ae + "\\:" + Ae) + "|" + lt),
          pt = n(n(Ae + "\\:") + "{6}" + rt),
          nt = n("\\:\\:" + n(Ae + "\\:") + "{5}" + rt),
          rn = n(n(Ae) + "?\\:\\:" + n(Ae + "\\:") + "{4}" + rt),
          pr = n(
            n(n(Ae + "\\:") + "{0,1}" + Ae) +
              "?\\:\\:" +
              n(Ae + "\\:") +
              "{3}" +
              rt
          ),
          hr = n(
            n(n(Ae + "\\:") + "{0,2}" + Ae) +
              "?\\:\\:" +
              n(Ae + "\\:") +
              "{2}" +
              rt
          ),
          ds = n(n(n(Ae + "\\:") + "{0,3}" + Ae) + "?\\:\\:" + Ae + "\\:" + rt),
          Pn = n(n(n(Ae + "\\:") + "{0,4}" + Ae) + "?\\:\\:" + rt),
          Jt = n(n(n(Ae + "\\:") + "{0,5}" + Ae) + "?\\:\\:" + Ae),
          gr = n(n(n(Ae + "\\:") + "{0,6}" + Ae) + "?\\:\\:"),
          Cn = n([pt, nt, rn, pr, hr, ds, Pn, Jt, gr].join("|")),
          Nr = n(n(Le + "|" + k) + "+");
        n("[vV]" + B + "+\\." + s(Le, ge, "[\\:]") + "+"),
          n(n(k + "|" + s(Le, ge)) + "*");
        var Gs = n(k + "|" + s(Le, ge, "[\\:\\@]"));
        return (
          n(n(k + "|" + s(Le, ge, "[\\@]")) + "+"),
          n(n(Gs + "|" + s("[\\/\\?]", at)) + "*"),
          {
            NOT_SCHEME: new RegExp(s("[^]", b, x, "[\\+\\-\\.]"), "g"),
            NOT_USERINFO: new RegExp(s("[^\\%\\:]", Le, ge), "g"),
            NOT_HOST: new RegExp(s("[^\\%\\[\\]\\:]", Le, ge), "g"),
            NOT_PATH: new RegExp(s("[^\\%\\/\\:\\@]", Le, ge), "g"),
            NOT_PATH_NOSCHEME: new RegExp(s("[^\\%\\/\\@]", Le, ge), "g"),
            NOT_QUERY: new RegExp(
              s("[^\\%]", Le, ge, "[\\:\\@\\/\\?]", at),
              "g"
            ),
            NOT_FRAGMENT: new RegExp(
              s("[^\\%]", Le, ge, "[\\:\\@\\/\\?]"),
              "g"
            ),
            ESCAPE: new RegExp(s("[^]", Le, ge), "g"),
            UNRESERVED: new RegExp(Le, "g"),
            OTHER_CHARS: new RegExp(s("[^\\%]", Le, ke), "g"),
            PCT_ENCODED: new RegExp(k, "g"),
            IPV4ADDRESS: new RegExp("^(" + lt + ")$"),
            IPV6ADDRESS: new RegExp(
              "^\\[?(" +
                Cn +
                ")" +
                n(n("\\%25|\\%(?!" + B + "{2})") + "(" + Nr + ")") +
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
                var ke = b[Symbol.iterator](), Je;
                !(k = (Je = ke.next()).done) &&
                (B.push(Je.value), !(x && B.length === x));
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
      function fe(C) {
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
          for (var Je = 0; Je < ke; ++Je)
            b.charCodeAt(Je) >= 128 && fe("not-basic"),
              x.push(b.charCodeAt(Je));
          for (var at = ke > 0 ? ke + 1 : 0; at < B; ) {
            for (
              var Le = k, Ge = 1, lt = m;
              ;
              /* no condition */
              lt += m
            ) {
              at >= B && fe("invalid-input");
              var Ae = Ue(b.charCodeAt(at++));
              (Ae >= m || Ae > G((h - k) / Ge)) && fe("overflow"),
                (k += Ae * Ge);
              var rt = lt <= ge ? y : lt >= ge + g ? g : lt - ge;
              if (Ae < rt) break;
              var pt = m - rt;
              Ge > G(h / pt) && fe("overflow"), (Ge *= pt);
            }
            var nt = x.length + 1;
            (ge = R(k - Le, nt, Le == 0)),
              G(k / nt) > h - pe && fe("overflow"),
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
            Je = !1,
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
          } catch (qs) {
            (Je = !0), (at = qs);
          } finally {
            try {
              !ke && Le.return && Le.return();
            } finally {
              if (Je) throw at;
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
                var hr = b[Symbol.iterator](), ds;
                !(nt = (ds = hr.next()).done);
                nt = !0
              ) {
                var Pn = ds.value;
                Pn >= k && Pn < pt && (pt = Pn);
              }
            } catch (qs) {
              (rn = !0), (pr = qs);
            } finally {
              try {
                !nt && hr.return && hr.return();
              } finally {
                if (rn) throw pr;
              }
            }
            var Jt = rt + 1;
            pt - k > G((h - pe) / Jt) && fe("overflow"),
              (pe += (pt - k) * Jt),
              (k = pt);
            var gr = !0,
              Cn = !1,
              Nr = void 0;
            try {
              for (
                var Gs = b[Symbol.iterator](), If;
                !(gr = (If = Gs.next()).done);
                gr = !0
              ) {
                var Rf = If.value;
                if ((Rf < k && ++pe > h && fe("overflow"), Rf == k)) {
                  for (
                    var si = pe, oi = m;
                    ;
                    /* no condition */
                    oi += m
                  ) {
                    var ii = oi <= ge ? y : oi >= ge + g ? g : oi - ge;
                    if (si < ii) break;
                    var Mf = si - ii,
                      jf = m - ii;
                    x.push(Ne(ee(ii + (Mf % jf), 0))), (si = G(Mf / jf));
                  }
                  x.push(Ne(ee(si, 0))),
                    (ge = R(pe, Jt, rt == Ae)),
                    (pe = 0),
                    ++rt;
                }
              }
            } catch (qs) {
              (Cn = !0), (Nr = qs);
            } finally {
              try {
                !gr && Gs.return && Gs.return();
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
      function se(C, b) {
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
              .replace(b.PCT_ENCODED, i)),
          C.host !== void 0 &&
            (C.host = String(C.host)
              .replace(b.PCT_ENCODED, x)
              .toLowerCase()
              .replace(b.NOT_HOST, F)
              .replace(b.PCT_ENCODED, i)),
          C.path !== void 0 &&
            (C.path = String(C.path)
              .replace(b.PCT_ENCODED, x)
              .replace(C.scheme ? b.NOT_PATH : b.NOT_PATH_NOSCHEME, F)
              .replace(b.PCT_ENCODED, i)),
          C.query !== void 0 &&
            (C.query = String(C.query)
              .replace(b.PCT_ENCODED, x)
              .replace(b.NOT_QUERY, F)
              .replace(b.PCT_ENCODED, i)),
          C.fragment !== void 0 &&
            (C.fragment = String(C.fragment)
              .replace(b.PCT_ENCODED, x)
              .replace(b.NOT_FRAGMENT, F)
              .replace(b.PCT_ENCODED, i)),
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
              Je = ke[0],
              at = ke[1],
              Le = at ? at.split(":").map(we) : [],
              Ge = Je.split(":").map(we),
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
            var ds = pt.slice(0, pr.index),
              Pn = pt.slice(pr.index + pr.length);
            hr = ds.join(":") + "::" + Pn.join(":");
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
            se(x, u);
          } else se(x, B);
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
        se(C, x),
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
      function oe(C, b) {
        return (
          typeof C == "string"
            ? (C = W(V(C, b), b))
            : o(C) === "object" && (C = V(W(C, b), b)),
          C
        );
      }
      function $e(C, b, x) {
        return (
          typeof C == "string"
            ? (C = W(V(C, x), x))
            : o(C) === "object" && (C = W(C, x)),
          typeof b == "string"
            ? (b = W(V(b, x), x))
            : o(b) === "object" && (b = W(b, x)),
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
        it = {
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
        Hs = {
          scheme: "wss",
          domainHost: qt.domainHost,
          parse: qt.parse,
          serialize: qt.serialize,
        },
        Nn = {},
        Ks =
          "[A-Za-z0-9\\-\\.\\_\\~\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]",
        Ke = "[0-9A-Fa-f]",
        Yt = n(
          n("%[EFef]" + Ke + "%" + Ke + Ke + "%" + Ke + Ke) +
            "|" +
            n("%[89A-Fa-f]" + Ke + "%" + Ke + Ke) +
            "|" +
            n("%" + Ke + Ke)
        ),
        ni = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]",
        u_ = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]",
        f_ = s(u_, '[\\"\\\\]'),
        d_ = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]",
        p_ = new RegExp(Ks, "g"),
        fs = new RegExp(Yt, "g"),
        h_ = new RegExp(s("[^]", ni, "[\\.]", '[\\"]', f_), "g"),
        Cf = new RegExp(s("[^]", Ks, d_), "g"),
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
                  Je = 0,
                  at = ke.length;
                Je < at;
                ++Je
              ) {
                var Le = ke[Je].split("=");
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
                  Je = ke.lastIndexOf("@"),
                  at = ke
                    .slice(0, Je)
                    .replace(fs, tl)
                    .replace(fs, i)
                    .replace(h_, F),
                  Le = ke.slice(Je + 1);
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
                  Ae.replace(fs, tl).replace(fs, i).replace(Cf, F) +
                    "=" +
                    Ge[Ae].replace(fs, tl).replace(fs, i).replace(g_, F)
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
                Je = pe + ":" + (x.nid || ge),
                at = j[Je];
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
              Je = b.nss;
            return (ke.path = (k || x.nid) + ":" + Je), ke;
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
        (j[it.scheme] = it),
        (j[qt.scheme] = qt),
        (j[Hs.scheme] = Hs),
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
        (r.normalize = oe),
        (r.equal = $e),
        (r.escapeComponent = Ce),
        (r.unescapeComponent = Re),
        Object.defineProperty(r, "__esModule", { value: !0 });
    });
  })(_c, _c.exports);
  var ZU = _c.exports;
  Object.defineProperty(Ju, "__esModule", { value: !0 });
  const Yy = ZU;
  Yy.code = 'require("ajv/dist/runtime/uri").default';
  Ju.default = Yy;
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
    const s = ei,
      n = ti,
      o = Xn,
      i = kt,
      a = De,
      l = wt,
      c = Qo,
      u = Be,
      f = XU,
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
        se,
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
      const oe = ee.strict,
        $e = (R = ee.code) === null || R === void 0 ? void 0 : R.optimize,
        Ce = $e === !0 || $e === void 0 ? 1 : $e || 0,
        Re =
          (P = (M = ee.code) === null || M === void 0 ? void 0 : M.regExp) !==
            null && P !== void 0
            ? P
            : p,
        Me = (v = ee.uriResolver) !== null && v !== void 0 ? v : d.default;
      return {
        strictSchema:
          (N = ($ = ee.strictSchema) !== null && $ !== void 0 ? $ : oe) !==
            null && N !== void 0
            ? N
            : !0,
        strictNumbers:
          (F = (j = ee.strictNumbers) !== null && j !== void 0 ? j : oe) !==
            null && F !== void 0
            ? F
            : !0,
        strictTypes:
          (se = (q = ee.strictTypes) !== null && q !== void 0 ? q : oe) !==
            null && se !== void 0
            ? se
            : "log",
        strictTuples:
          (Ie = (we = ee.strictTuples) !== null && we !== void 0 ? we : oe) !==
            null && Ie !== void 0
            ? Ie
            : "log",
        strictRequired:
          (w = (tt = ee.strictRequired) !== null && tt !== void 0 ? tt : oe) !==
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
          (this.RULES = (0, o.getRules)()),
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
        async function v(se, we) {
          await $.call(this, se.$schema);
          const Ie = this._addSchema(se, we);
          return Ie.validate || N.call(this, Ie);
        }
        async function $(se) {
          se && !this.getSchema(se) && (await v.call(this, { $ref: se }, !0));
        }
        async function N(se) {
          try {
            return this._compileSchemaEnv(se);
          } catch (we) {
            if (!(we instanceof n.default)) throw we;
            return (
              j.call(this, we),
              await F.call(this, we.missingSchema),
              N.call(this, se)
            );
          }
        }
        function j({ missingSchema: se, missingRef: we }) {
          if (this.refs[se])
            throw new Error(
              `AnySchema ${se} is loaded but ${we} cannot be resolved`
            );
        }
        async function F(se) {
          const we = await q.call(this, se);
          this.refs[se] || (await $.call(this, we.$schema)),
            this.refs[se] || this.addSchema(we, se, M);
        }
        async function q(se) {
          const we = this._loading[se];
          if (we) return we;
          try {
            return await (this._loading[se] = P(se));
          } finally {
            delete this._loading[se];
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
            v = new i.SchemaEnv({ schema: {}, schemaId: P });
          if (((M = i.resolveSchema.call(this, v, R)), !M)) return;
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
        if ((fe.call(this, P, M), !M))
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
              se = N[j];
            q && se && (N[j] = Ue(se));
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
          (F = new i.SchemaEnv({
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
          (R.meta ? this._compileMetaSchema(R) : i.compileSchema.call(this, R),
          !R.validate)
        )
          throw new Error("ajv implementation error");
        return R.validate;
      }
      _compileMetaSchema(R) {
        const M = this.opts;
        this.opts = this._metaOpts;
        try {
          i.compileSchema.call(this, R);
        } finally {
          this.opts = M;
        }
      }
    }
    (e.default = S),
      (S.ValidationError = s.default),
      (S.MissingRefError = n.default);
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
    function fe(ee, R) {
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
  })(Oy);
  var Xu = {},
    Zu = {},
    Qu = {};
  Object.defineProperty(Qu, "__esModule", { value: !0 });
  const QU = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    },
  };
  Qu.default = QU;
  var Zn = {};
  Object.defineProperty(Zn, "__esModule", { value: !0 });
  Zn.callRef = Zn.getValidate = void 0;
  const eW = ti,
    Rh = je,
    Lt = De,
    gs = dr,
    Mh = kt,
    bi = Be,
    tW = {
      keyword: "$ref",
      schemaType: "string",
      code(e) {
        const { gen: t, schema: r, it: s } = e,
          { baseId: n, schemaEnv: o, validateName: i, opts: a, self: l } = s,
          { root: c } = o;
        if ((r === "#" || r === "#/") && n === c.baseId) return f();
        const u = Mh.resolveRef.call(l, c, n, r);
        if (u === void 0) throw new eW.default(s.opts.uriResolver, n, r);
        if (u instanceof Mh.SchemaEnv) return d(u);
        return p(u);
        function f() {
          if (o === c) return Mi(e, i, o, o.$async);
          const h = t.scopeValue("root", { ref: c });
          return Mi(e, (0, Lt._)`${h}.validate`, c, c.$async);
        }
        function d(h) {
          const m = Jy(e, h);
          Mi(e, m, h, h.$async);
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
  function Jy(e, t) {
    const { gen: r } = e;
    return t.validate
      ? r.scopeValue("validate", { ref: t.validate })
      : (0, Lt._)`${r.scopeValue("wrapper", { ref: t })}.validate`;
  }
  Zn.getValidate = Jy;
  function Mi(e, t, r, s) {
    const { gen: n, it: o } = e,
      { allErrors: i, schemaEnv: a, opts: l } = o,
      c = l.passContext ? gs.default.this : Lt.nil;
    s ? u() : f();
    function u() {
      if (!a.$async) throw new Error("async schema referenced by sync schema");
      const h = n.let("valid");
      n.try(
        () => {
          n.code((0, Lt._)`await ${(0, Rh.callValidateCode)(e, t, c)}`),
            p(t),
            i || n.assign(h, !0);
        },
        m => {
          n.if((0, Lt._)`!(${m} instanceof ${o.ValidationError})`, () =>
            n.throw(m)
          ),
            d(m),
            i || n.assign(h, !1);
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
      n.assign(
        gs.default.vErrors,
        (0,
        Lt._)`${gs.default.vErrors} === null ? ${m} : ${gs.default.vErrors}.concat(${m})`
      ),
        n.assign(gs.default.errors, (0, Lt._)`${gs.default.vErrors}.length`);
    }
    function p(h) {
      var m;
      if (!o.opts.unevaluated) return;
      const y =
        (m = r == null ? void 0 : r.validate) === null || m === void 0
          ? void 0
          : m.evaluated;
      if (o.props !== !0)
        if (y && !y.dynamicProps)
          y.props !== void 0 &&
            (o.props = bi.mergeEvaluated.props(n, y.props, o.props));
        else {
          const g = n.var("props", (0, Lt._)`${h}.evaluated.props`);
          o.props = bi.mergeEvaluated.props(n, g, o.props, Lt.Name);
        }
      if (o.items !== !0)
        if (y && !y.dynamicItems)
          y.items !== void 0 &&
            (o.items = bi.mergeEvaluated.items(n, y.items, o.items));
        else {
          const g = n.var("items", (0, Lt._)`${h}.evaluated.items`);
          o.items = bi.mergeEvaluated.items(n, g, o.items, Lt.Name);
        }
    }
  }
  Zn.callRef = Mi;
  Zn.default = tW;
  Object.defineProperty(Zu, "__esModule", { value: !0 });
  const rW = Qu,
    nW = Zn,
    sW = [
      "$schema",
      "$id",
      "$defs",
      "$vocabulary",
      { keyword: "$comment" },
      "definitions",
      rW.default,
      nW.default,
    ];
  Zu.default = sW;
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
        const { keyword: t, data: r, schemaCode: s } = e;
        e.fail$data((0, ua._)`${r} ${fa[t].fail} ${s} || isNaN(${r})`);
      },
    };
  tf.default = iW;
  var rf = {};
  Object.defineProperty(rf, "__esModule", { value: !0 });
  const bo = De,
    aW = {
      message: ({ schemaCode: e }) => (0, bo.str)`must be multiple of ${e}`,
      params: ({ schemaCode: e }) => (0, bo._)`{multipleOf: ${e}}`,
    },
    lW = {
      keyword: "multipleOf",
      type: "number",
      schemaType: "number",
      $data: !0,
      error: aW,
      code(e) {
        const { gen: t, data: r, schemaCode: s, it: n } = e,
          o = n.opts.multipleOfPrecision,
          i = t.let("res"),
          a = o
            ? (0, bo._)`Math.abs(Math.round(${i}) - ${i}) > 1e-${o}`
            : (0, bo._)`${i} !== parseInt(${i})`;
        e.fail$data((0, bo._)`(${s} === 0 || (${i} = ${r}/${s}, ${a}))`);
      },
    };
  rf.default = lW;
  var nf = {},
    sf = {};
  Object.defineProperty(sf, "__esModule", { value: !0 });
  function Xy(e) {
    const t = e.length;
    let r = 0,
      s = 0,
      n;
    for (; s < t; )
      r++,
        (n = e.charCodeAt(s++)),
        n >= 55296 &&
          n <= 56319 &&
          s < t &&
          ((n = e.charCodeAt(s)), (n & 64512) === 56320 && s++);
    return r;
  }
  sf.default = Xy;
  Xy.code = 'require("ajv/dist/runtime/ucs2length").default';
  Object.defineProperty(nf, "__esModule", { value: !0 });
  const jn = De,
    cW = Be,
    uW = sf,
    fW = {
      message({ keyword: e, schemaCode: t }) {
        const r = e === "maxLength" ? "more" : "fewer";
        return (0, jn.str)`must NOT have ${r} than ${t} characters`;
      },
      params: ({ schemaCode: e }) => (0, jn._)`{limit: ${e}}`,
    },
    dW = {
      keyword: ["maxLength", "minLength"],
      type: "string",
      schemaType: "number",
      $data: !0,
      error: fW,
      code(e) {
        const { keyword: t, data: r, schemaCode: s, it: n } = e,
          o = t === "maxLength" ? jn.operators.GT : jn.operators.LT,
          i =
            n.opts.unicode === !1
              ? (0, jn._)`${r}.length`
              : (0, jn._)`${(0, cW.useFunc)(e.gen, uW.default)}(${r})`;
        e.fail$data((0, jn._)`${i} ${o} ${s}`);
      },
    };
  nf.default = dW;
  var of = {};
  Object.defineProperty(of, "__esModule", { value: !0 });
  const pW = je,
    da = De,
    hW = {
      message: ({ schemaCode: e }) => (0, da.str)`must match pattern "${e}"`,
      params: ({ schemaCode: e }) => (0, da._)`{pattern: ${e}}`,
    },
    gW = {
      keyword: "pattern",
      type: "string",
      schemaType: "string",
      $data: !0,
      error: hW,
      code(e) {
        const { data: t, $data: r, schema: s, schemaCode: n, it: o } = e,
          i = o.opts.unicodeRegExp ? "u" : "",
          a = r
            ? (0, da._)`(new RegExp(${n}, ${i}))`
            : (0, pW.usePattern)(e, s);
        e.fail$data((0, da._)`!${a}.test(${t})`);
      },
    };
  of.default = gW;
  var af = {};
  Object.defineProperty(af, "__esModule", { value: !0 });
  const wo = De,
    mW = {
      message({ keyword: e, schemaCode: t }) {
        const r = e === "maxProperties" ? "more" : "fewer";
        return (0, wo.str)`must NOT have ${r} than ${t} properties`;
      },
      params: ({ schemaCode: e }) => (0, wo._)`{limit: ${e}}`,
    },
    vW = {
      keyword: ["maxProperties", "minProperties"],
      type: "object",
      schemaType: "number",
      $data: !0,
      error: mW,
      code(e) {
        const { keyword: t, data: r, schemaCode: s } = e,
          n = t === "maxProperties" ? wo.operators.GT : wo.operators.LT;
        e.fail$data((0, wo._)`Object.keys(${r}).length ${n} ${s}`);
      },
    };
  af.default = vW;
  var lf = {};
  Object.defineProperty(lf, "__esModule", { value: !0 });
  const oo = je,
    Eo = De,
    yW = Be,
    _W = {
      message: ({ params: { missingProperty: e } }) =>
        (0, Eo.str)`must have required property '${e}'`,
      params: ({ params: { missingProperty: e } }) =>
        (0, Eo._)`{missingProperty: ${e}}`,
    },
    $W = {
      keyword: "required",
      type: "object",
      schemaType: "array",
      $data: !0,
      error: _W,
      code(e) {
        const {
            gen: t,
            schema: r,
            schemaCode: s,
            data: n,
            $data: o,
            it: i,
          } = e,
          { opts: a } = i;
        if (!o && r.length === 0) return;
        const l = r.length >= a.loopRequired;
        if ((i.allErrors ? c() : u(), a.strictRequired)) {
          const p = e.parentSchema.properties,
            { definedProperties: h } = e.it;
          for (const m of r)
            if ((p == null ? void 0 : p[m]) === void 0 && !h.has(m)) {
              const y = i.schemaEnv.baseId + i.errSchemaPath,
                g = `required property "${m}" is not defined at "${y}" (strictRequired)`;
              (0, yW.checkStrictMode)(i, g, i.opts.strictRequired);
            }
        }
        function c() {
          if (l || o) e.block$data(Eo.nil, f);
          else for (const p of r) (0, oo.checkReportMissingProp)(e, p);
        }
        function u() {
          const p = t.let("missing");
          if (l || o) {
            const h = t.let("valid", !0);
            e.block$data(h, () => d(p, h)), e.ok(h);
          } else
            t.if((0, oo.checkMissingProp)(e, r, p)),
              (0, oo.reportMissingProp)(e, p),
              t.else();
        }
        function f() {
          t.forOf("prop", s, p => {
            e.setParams({ missingProperty: p }),
              t.if((0, oo.noPropertyInData)(t, n, p, a.ownProperties), () =>
                e.error()
              );
          });
        }
        function d(p, h) {
          e.setParams({ missingProperty: p }),
            t.forOf(
              p,
              s,
              () => {
                t.assign(h, (0, oo.propertyInData)(t, n, p, a.ownProperties)),
                  t.if((0, Eo.not)(h), () => {
                    e.error(), t.break();
                  });
              },
              Eo.nil
            );
        }
      },
    };
  lf.default = $W;
  var cf = {};
  Object.defineProperty(cf, "__esModule", { value: !0 });
  const Oo = De,
    bW = {
      message({ keyword: e, schemaCode: t }) {
        const r = e === "maxItems" ? "more" : "fewer";
        return (0, Oo.str)`must NOT have ${r} than ${t} items`;
      },
      params: ({ schemaCode: e }) => (0, Oo._)`{limit: ${e}}`,
    },
    wW = {
      keyword: ["maxItems", "minItems"],
      type: "array",
      schemaType: "number",
      $data: !0,
      error: bW,
      code(e) {
        const { keyword: t, data: r, schemaCode: s } = e,
          n = t === "maxItems" ? Oo.operators.GT : Oo.operators.LT;
        e.fail$data((0, Oo._)`${r}.length ${n} ${s}`);
      },
    };
  cf.default = wW;
  var uf = {},
    ri = {};
  Object.defineProperty(ri, "__esModule", { value: !0 });
  const Zy = Dy;
  Zy.code = 'require("ajv/dist/runtime/equal").default';
  ri.default = Zy;
  Object.defineProperty(uf, "__esModule", { value: !0 });
  const Ml = Qo,
    bt = De,
    EW = Be,
    OW = ri,
    SW = {
      message: ({ params: { i: e, j: t } }) =>
        (0,
        bt.str)`must NOT have duplicate items (items ## ${t} and ${e} are identical)`,
      params: ({ params: { i: e, j: t } }) => (0, bt._)`{i: ${e}, j: ${t}}`,
    },
    AW = {
      keyword: "uniqueItems",
      type: "array",
      schemaType: "boolean",
      $data: !0,
      error: SW,
      code(e) {
        const {
          gen: t,
          data: r,
          $data: s,
          schema: n,
          parentSchema: o,
          schemaCode: i,
          it: a,
        } = e;
        if (!s && !n) return;
        const l = t.let("valid"),
          c = o.items ? (0, Ml.getSchemaTypes)(o.items) : [];
        e.block$data(l, u, (0, bt._)`${i} === false`), e.ok(l);
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
          const y = (0, EW.useFunc)(t, OW.default),
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
  uf.default = AW;
  var ff = {};
  Object.defineProperty(ff, "__esModule", { value: !0 });
  const $c = De,
    NW = Be,
    PW = ri,
    CW = {
      message: "must be equal to constant",
      params: ({ schemaCode: e }) => (0, $c._)`{allowedValue: ${e}}`,
    },
    TW = {
      keyword: "const",
      $data: !0,
      error: CW,
      code(e) {
        const { gen: t, data: r, $data: s, schemaCode: n, schema: o } = e;
        s || (o && typeof o == "object")
          ? e.fail$data(
              (0, $c._)`!${(0, NW.useFunc)(t, PW.default)}(${r}, ${n})`
            )
          : e.fail((0, $c._)`${o} !== ${r}`);
      },
    };
  ff.default = TW;
  var df = {};
  Object.defineProperty(df, "__esModule", { value: !0 });
  const co = De,
    xW = Be,
    DW = ri,
    IW = {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: e }) => (0, co._)`{allowedValues: ${e}}`,
    },
    RW = {
      keyword: "enum",
      schemaType: "array",
      $data: !0,
      error: IW,
      code(e) {
        const {
          gen: t,
          data: r,
          $data: s,
          schema: n,
          schemaCode: o,
          it: i,
        } = e;
        if (!s && n.length === 0)
          throw new Error("enum must have non-empty array");
        const a = n.length >= i.opts.loopEnum;
        let l;
        const c = () => l ?? (l = (0, xW.useFunc)(t, DW.default));
        let u;
        if (a || s) (u = t.let("valid")), e.block$data(u, f);
        else {
          if (!Array.isArray(n)) throw new Error("ajv implementation error");
          const p = t.const("vSchema", o);
          u = (0, co.or)(...n.map((h, m) => d(p, m)));
        }
        e.pass(u);
        function f() {
          t.assign(u, !1),
            t.forOf("v", o, p =>
              t.if((0, co._)`${c()}(${r}, ${p})`, () => t.assign(u, !0).break())
            );
        }
        function d(p, h) {
          const m = n[h];
          return typeof m == "object" && m !== null
            ? (0, co._)`${c()}(${r}, ${p}[${h}])`
            : (0, co._)`${r} === ${m}`;
        }
      },
    };
  df.default = RW;
  Object.defineProperty(ef, "__esModule", { value: !0 });
  const MW = tf,
    jW = rf,
    FW = nf,
    LW = of,
    VW = af,
    kW = lf,
    BW = cf,
    zW = uf,
    UW = ff,
    WW = df,
    HW = [
      // number
      MW.default,
      jW.default,
      // string
      FW.default,
      LW.default,
      // object
      VW.default,
      kW.default,
      // array
      BW.default,
      zW.default,
      // any
      { keyword: "type", schemaType: ["string", "array"] },
      { keyword: "nullable", schemaType: "boolean" },
      UW.default,
      WW.default,
    ];
  ef.default = HW;
  var pf = {},
    zs = {};
  Object.defineProperty(zs, "__esModule", { value: !0 });
  zs.validateAdditionalItems = void 0;
  const Fn = De,
    bc = Be,
    KW = {
      message: ({ params: { len: e } }) =>
        (0, Fn.str)`must NOT have more than ${e} items`,
      params: ({ params: { len: e } }) => (0, Fn._)`{limit: ${e}}`,
    },
    GW = {
      keyword: "additionalItems",
      type: "array",
      schemaType: ["boolean", "object"],
      before: "uniqueItems",
      error: KW,
      code(e) {
        const { parentSchema: t, it: r } = e,
          { items: s } = t;
        if (!Array.isArray(s)) {
          (0, bc.checkStrictMode)(
            r,
            '"additionalItems" is ignored when "items" is not an array of schemas'
          );
          return;
        }
        Qy(e, s);
      },
    };
  function Qy(e, t) {
    const { gen: r, schema: s, data: n, keyword: o, it: i } = e;
    i.items = !0;
    const a = r.const("len", (0, Fn._)`${n}.length`);
    if (s === !1)
      e.setParams({ len: t.length }), e.pass((0, Fn._)`${a} <= ${t.length}`);
    else if (typeof s == "object" && !(0, bc.alwaysValidSchema)(i, s)) {
      const c = r.var("valid", (0, Fn._)`${a} <= ${t.length}`);
      r.if((0, Fn.not)(c), () => l(c)), e.ok(c);
    }
    function l(c) {
      r.forRange("i", t.length, a, u => {
        e.subschema({ keyword: o, dataProp: u, dataPropType: bc.Type.Num }, c),
          i.allErrors || r.if((0, Fn.not)(c), () => r.break());
      });
    }
  }
  zs.validateAdditionalItems = Qy;
  zs.default = GW;
  var hf = {},
    Us = {};
  Object.defineProperty(Us, "__esModule", { value: !0 });
  Us.validateTuple = void 0;
  const jh = De,
    ji = Be,
    qW = je,
    YW = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "array", "boolean"],
      before: "uniqueItems",
      code(e) {
        const { schema: t, it: r } = e;
        if (Array.isArray(t)) return e_(e, "additionalItems", t);
        (r.items = !0),
          !(0, ji.alwaysValidSchema)(r, t) && e.ok((0, qW.validateArray)(e));
      },
    };
  function e_(e, t, r = e.schema) {
    const { gen: s, parentSchema: n, data: o, keyword: i, it: a } = e;
    u(n),
      a.opts.unevaluated &&
        r.length &&
        a.items !== !0 &&
        (a.items = ji.mergeEvaluated.items(s, r.length, a.items));
    const l = s.name("valid"),
      c = s.const("len", (0, jh._)`${o}.length`);
    r.forEach((f, d) => {
      (0, ji.alwaysValidSchema)(a, f) ||
        (s.if((0, jh._)`${c} > ${d}`, () =>
          e.subschema(
            {
              keyword: i,
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
        const y = `"${i}" is ${h}-tuple, but minItems or maxItems/${t} are not specified or different at path "${p}"`;
        (0, ji.checkStrictMode)(a, y, d.strictTuples);
      }
    }
  }
  Us.validateTuple = e_;
  Us.default = YW;
  Object.defineProperty(hf, "__esModule", { value: !0 });
  const JW = Us,
    XW = {
      keyword: "prefixItems",
      type: "array",
      schemaType: ["array"],
      before: "uniqueItems",
      code: e => (0, JW.validateTuple)(e, "items"),
    };
  hf.default = XW;
  var gf = {};
  Object.defineProperty(gf, "__esModule", { value: !0 });
  const Fh = De,
    ZW = Be,
    QW = je,
    e9 = zs,
    t9 = {
      message: ({ params: { len: e } }) =>
        (0, Fh.str)`must NOT have more than ${e} items`,
      params: ({ params: { len: e } }) => (0, Fh._)`{limit: ${e}}`,
    },
    r9 = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      error: t9,
      code(e) {
        const { schema: t, parentSchema: r, it: s } = e,
          { prefixItems: n } = r;
        (s.items = !0),
          !(0, ZW.alwaysValidSchema)(s, t) &&
            (n
              ? (0, e9.validateAdditionalItems)(e, n)
              : e.ok((0, QW.validateArray)(e)));
      },
    };
  gf.default = r9;
  var mf = {};
  Object.defineProperty(mf, "__esModule", { value: !0 });
  const Xt = De,
    wi = Be,
    n9 = {
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
    s9 = {
      keyword: "contains",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      trackErrors: !0,
      error: n9,
      code(e) {
        const { gen: t, schema: r, parentSchema: s, data: n, it: o } = e;
        let i, a;
        const { minContains: l, maxContains: c } = s;
        o.opts.next ? ((i = l === void 0 ? 1 : l), (a = c)) : (i = 1);
        const u = t.const("len", (0, Xt._)`${n}.length`);
        if ((e.setParams({ min: i, max: a }), a === void 0 && i === 0)) {
          (0, wi.checkStrictMode)(
            o,
            '"minContains" == 0 without "maxContains": "contains" keyword ignored'
          );
          return;
        }
        if (a !== void 0 && i > a) {
          (0, wi.checkStrictMode)(
            o,
            '"minContains" > "maxContains" is always invalid'
          ),
            e.fail();
          return;
        }
        if ((0, wi.alwaysValidSchema)(o, r)) {
          let m = (0, Xt._)`${u} >= ${i}`;
          a !== void 0 && (m = (0, Xt._)`${m} && ${u} <= ${a}`), e.pass(m);
          return;
        }
        o.items = !0;
        const f = t.name("valid");
        a === void 0 && i === 1
          ? p(f, () => t.if(f, () => t.break()))
          : i === 0
            ? (t.let(f, !0),
              a !== void 0 && t.if((0, Xt._)`${n}.length > 0`, d))
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
                dataPropType: wi.Type.Num,
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
              ? t.if((0, Xt._)`${m} >= ${i}`, () => t.assign(f, !0).break())
              : (t.if((0, Xt._)`${m} > ${a}`, () => t.assign(f, !1).break()),
                i === 1
                  ? t.assign(f, !0)
                  : t.if((0, Xt._)`${m} >= ${i}`, () => t.assign(f, !0)));
        }
      },
    };
  mf.default = s9;
  var t_ = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0);
    const t = De,
      r = Be,
      s = je;
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
    const n = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: e.error,
      code(l) {
        const [c, u] = o(l);
        i(l, c), a(l, u);
      },
    };
    function o({ schema: l }) {
      const c = {},
        u = {};
      for (const f in l) {
        if (f === "__proto__") continue;
        const d = Array.isArray(l[f]) ? c : u;
        d[f] = l[f];
      }
      return [c, u];
    }
    function i(l, c = l.schema) {
      const { gen: u, data: f, it: d } = l;
      if (Object.keys(c).length === 0) return;
      const p = u.let("missing");
      for (const h in c) {
        const m = c[h];
        if (m.length === 0) continue;
        const y = (0, s.propertyInData)(u, f, h, d.opts.ownProperties);
        l.setParams({
          property: h,
          depsCount: m.length,
          deps: m.join(", "),
        }),
          d.allErrors
            ? u.if(y, () => {
                for (const g of m) (0, s.checkReportMissingProp)(l, g);
              })
            : (u.if((0, t._)`${y} && (${(0, s.checkMissingProp)(l, m, p)})`),
              (0, s.reportMissingProp)(l, p),
              u.else());
      }
    }
    e.validatePropertyDeps = i;
    function a(l, c = l.schema) {
      const { gen: u, data: f, keyword: d, it: p } = l,
        h = u.name("valid");
      for (const m in c)
        (0, r.alwaysValidSchema)(p, c[m]) ||
          (u.if(
            (0, s.propertyInData)(u, f, m, p.opts.ownProperties),
            () => {
              const y = l.subschema({ keyword: d, schemaProp: m }, h);
              l.mergeValidEvaluated(y, h);
            },
            () => u.var(h, !0)
            // TODO var
          ),
          l.ok(h));
    }
    (e.validateSchemaDeps = a), (e.default = n);
  })(t_);
  var vf = {};
  Object.defineProperty(vf, "__esModule", { value: !0 });
  const r_ = De,
    o9 = Be,
    i9 = {
      message: "property name must be valid",
      params: ({ params: e }) => (0, r_._)`{propertyName: ${e.propertyName}}`,
    },
    a9 = {
      keyword: "propertyNames",
      type: "object",
      schemaType: ["object", "boolean"],
      error: i9,
      code(e) {
        const { gen: t, schema: r, data: s, it: n } = e;
        if ((0, o9.alwaysValidSchema)(n, r)) return;
        const o = t.name("valid");
        t.forIn("key", s, i => {
          e.setParams({ propertyName: i }),
            e.subschema(
              {
                keyword: "propertyNames",
                data: i,
                dataTypes: ["string"],
                propertyName: i,
                compositeRule: !0,
              },
              o
            ),
            t.if((0, r_.not)(o), () => {
              e.error(!0), n.allErrors || t.break();
            });
        }),
          e.ok(o);
      },
    };
  vf.default = a9;
  var el = {};
  Object.defineProperty(el, "__esModule", { value: !0 });
  const Ei = je,
    nr = De,
    l9 = dr,
    Oi = Be,
    c9 = {
      message: "must NOT have additional properties",
      params: ({ params: e }) =>
        (0, nr._)`{additionalProperty: ${e.additionalProperty}}`,
    },
    u9 = {
      keyword: "additionalProperties",
      type: ["object"],
      schemaType: ["boolean", "object"],
      allowUndefined: !0,
      trackErrors: !0,
      error: c9,
      code(e) {
        const {
          gen: t,
          schema: r,
          parentSchema: s,
          data: n,
          errsCount: o,
          it: i,
        } = e;
        if (!o) throw new Error("ajv implementation error");
        const { allErrors: a, opts: l } = i;
        if (
          ((i.props = !0),
          l.removeAdditional !== "all" && (0, Oi.alwaysValidSchema)(i, r))
        )
          return;
        const c = (0, Ei.allSchemaProperties)(s.properties),
          u = (0, Ei.allSchemaProperties)(s.patternProperties);
        f(), e.ok((0, nr._)`${o} === ${l9.default.errors}`);
        function f() {
          t.forIn("key", n, y => {
            !c.length && !u.length ? h(y) : t.if(d(y), () => h(y));
          });
        }
        function d(y) {
          let g;
          if (c.length > 8) {
            const _ = (0, Oi.schemaRefOrVal)(i, s.properties, "properties");
            g = (0, Ei.isOwnProperty)(t, _, y);
          } else
            c.length
              ? (g = (0, nr.or)(...c.map(_ => (0, nr._)`${y} === ${_}`)))
              : (g = nr.nil);
          return (
            u.length &&
              (g = (0, nr.or)(
                g,
                ...u.map(_ => (0, nr._)`${(0, Ei.usePattern)(e, _)}.test(${y})`)
              )),
            (0, nr.not)(g)
          );
        }
        function p(y) {
          t.code((0, nr._)`delete ${n}[${y}]`);
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
          if (typeof r == "object" && !(0, Oi.alwaysValidSchema)(i, r)) {
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
            dataPropType: Oi.Type.Str,
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
  el.default = u9;
  var yf = {};
  Object.defineProperty(yf, "__esModule", { value: !0 });
  const f9 = Zt,
    Lh = je,
    jl = Be,
    Vh = el,
    d9 = {
      keyword: "properties",
      type: "object",
      schemaType: "object",
      code(e) {
        const { gen: t, schema: r, parentSchema: s, data: n, it: o } = e;
        o.opts.removeAdditional === "all" &&
          s.additionalProperties === void 0 &&
          Vh.default.code(
            new f9.KeywordCxt(o, Vh.default, "additionalProperties")
          );
        const i = (0, Lh.allSchemaProperties)(r);
        for (const f of i) o.definedProperties.add(f);
        o.opts.unevaluated &&
          i.length &&
          o.props !== !0 &&
          (o.props = jl.mergeEvaluated.props(t, (0, jl.toHash)(i), o.props));
        const a = i.filter(f => !(0, jl.alwaysValidSchema)(o, r[f]));
        if (a.length === 0) return;
        const l = t.name("valid");
        for (const f of a)
          c(f)
            ? u(f)
            : (t.if((0, Lh.propertyInData)(t, n, f, o.opts.ownProperties)),
              u(f),
              o.allErrors || t.else().var(l, !0),
              t.endIf()),
            e.it.definedProperties.add(f),
            e.ok(l);
        function c(f) {
          return (
            o.opts.useDefaults && !o.compositeRule && r[f].default !== void 0
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
  yf.default = d9;
  var _f = {};
  Object.defineProperty(_f, "__esModule", { value: !0 });
  const kh = je,
    Si = De,
    Bh = Be,
    zh = Be,
    p9 = {
      keyword: "patternProperties",
      type: "object",
      schemaType: "object",
      code(e) {
        const { gen: t, schema: r, data: s, parentSchema: n, it: o } = e,
          { opts: i } = o,
          a = (0, kh.allSchemaProperties)(r),
          l = a.filter(m => (0, Bh.alwaysValidSchema)(o, r[m]));
        if (
          a.length === 0 ||
          (l.length === a.length && (!o.opts.unevaluated || o.props === !0))
        )
          return;
        const c = i.strictSchema && !i.allowMatchingProperties && n.properties,
          u = t.name("valid");
        o.props !== !0 &&
          !(o.props instanceof Si.Name) &&
          (o.props = (0, zh.evaluatedPropsToName)(t, o.props));
        const { props: f } = o;
        d();
        function d() {
          for (const m of a)
            c && p(m), o.allErrors ? h(m) : (t.var(u, !0), h(m), t.if(u));
        }
        function p(m) {
          for (const y in c)
            new RegExp(m).test(y) &&
              (0, Bh.checkStrictMode)(
                o,
                `property ${y} matches pattern ${m} (use allowMatchingProperties)`
              );
        }
        function h(m) {
          t.forIn("key", s, y => {
            t.if((0, Si._)`${(0, kh.usePattern)(e, m)}.test(${y})`, () => {
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
                o.opts.unevaluated && f !== !0
                  ? t.assign((0, Si._)`${f}[${y}]`, !0)
                  : !g && !o.allErrors && t.if((0, Si.not)(u), () => t.break());
            });
          });
        }
      },
    };
  _f.default = p9;
  var $f = {};
  Object.defineProperty($f, "__esModule", { value: !0 });
  const h9 = Be,
    g9 = {
      keyword: "not",
      schemaType: ["object", "boolean"],
      trackErrors: !0,
      code(e) {
        const { gen: t, schema: r, it: s } = e;
        if ((0, h9.alwaysValidSchema)(s, r)) {
          e.fail();
          return;
        }
        const n = t.name("valid");
        e.subschema(
          {
            keyword: "not",
            compositeRule: !0,
            createErrors: !1,
            allErrors: !1,
          },
          n
        ),
          e.failResult(
            n,
            () => e.reset(),
            () => e.error()
          );
      },
      error: { message: "must NOT be valid" },
    };
  $f.default = g9;
  var bf = {};
  Object.defineProperty(bf, "__esModule", { value: !0 });
  const m9 = je,
    v9 = {
      keyword: "anyOf",
      schemaType: "array",
      trackErrors: !0,
      code: m9.validateUnion,
      error: { message: "must match a schema in anyOf" },
    };
  bf.default = v9;
  var wf = {};
  Object.defineProperty(wf, "__esModule", { value: !0 });
  const Fi = De,
    y9 = Be,
    _9 = {
      message: "must match exactly one schema in oneOf",
      params: ({ params: e }) => (0, Fi._)`{passingSchemas: ${e.passing}}`,
    },
    $9 = {
      keyword: "oneOf",
      schemaType: "array",
      trackErrors: !0,
      error: _9,
      code(e) {
        const { gen: t, schema: r, parentSchema: s, it: n } = e;
        if (!Array.isArray(r)) throw new Error("ajv implementation error");
        if (n.opts.discriminator && s.discriminator) return;
        const o = r,
          i = t.let("valid", !1),
          a = t.let("passing", null),
          l = t.name("_valid");
        e.setParams({ passing: a }),
          t.block(c),
          e.result(
            i,
            () => e.reset(),
            () => e.error(!0)
          );
        function c() {
          o.forEach((u, f) => {
            let d;
            (0, y9.alwaysValidSchema)(n, u)
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
                  .if((0, Fi._)`${l} && ${i}`)
                  .assign(i, !1)
                  .assign(a, (0, Fi._)`[${a}, ${f}]`)
                  .else(),
              t.if(l, () => {
                t.assign(i, !0),
                  t.assign(a, f),
                  d && e.mergeEvaluated(d, Fi.Name);
              });
          });
        }
      },
    };
  wf.default = $9;
  var Ef = {};
  Object.defineProperty(Ef, "__esModule", { value: !0 });
  const b9 = Be,
    w9 = {
      keyword: "allOf",
      schemaType: "array",
      code(e) {
        const { gen: t, schema: r, it: s } = e;
        if (!Array.isArray(r)) throw new Error("ajv implementation error");
        const n = t.name("valid");
        r.forEach((o, i) => {
          if ((0, b9.alwaysValidSchema)(s, o)) return;
          const a = e.subschema({ keyword: "allOf", schemaProp: i }, n);
          e.ok(n), e.mergeEvaluated(a);
        });
      },
    };
  Ef.default = w9;
  var Of = {};
  Object.defineProperty(Of, "__esModule", { value: !0 });
  const pa = De,
    n_ = Be,
    E9 = {
      message: ({ params: e }) =>
        (0, pa.str)`must match "${e.ifClause}" schema`,
      params: ({ params: e }) => (0, pa._)`{failingKeyword: ${e.ifClause}}`,
    },
    O9 = {
      keyword: "if",
      schemaType: ["object", "boolean"],
      trackErrors: !0,
      error: E9,
      code(e) {
        const { gen: t, parentSchema: r, it: s } = e;
        r.then === void 0 &&
          r.else === void 0 &&
          (0, n_.checkStrictMode)(
            s,
            '"if" without "then" and "else" is ignored'
          );
        const n = Uh(s, "then"),
          o = Uh(s, "else");
        if (!n && !o) return;
        const i = t.let("valid", !0),
          a = t.name("_valid");
        if ((l(), e.reset(), n && o)) {
          const u = t.let("ifClause");
          e.setParams({ ifClause: u }), t.if(a, c("then", u), c("else", u));
        } else n ? t.if(a, c("then")) : t.if((0, pa.not)(a), c("else"));
        e.pass(i, () => e.error(!0));
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
            t.assign(i, a),
              e.mergeValidEvaluated(d, i),
              f ? t.assign(f, (0, pa._)`${u}`) : e.setParams({ ifClause: u });
          };
        }
      },
    };
  function Uh(e, t) {
    const r = e.schema[t];
    return r !== void 0 && !(0, n_.alwaysValidSchema)(e, r);
  }
  Of.default = O9;
  var Sf = {};
  Object.defineProperty(Sf, "__esModule", { value: !0 });
  const S9 = Be,
    A9 = {
      keyword: ["then", "else"],
      schemaType: ["object", "boolean"],
      code({ keyword: e, parentSchema: t, it: r }) {
        t.if === void 0 &&
          (0, S9.checkStrictMode)(r, `"${e}" without "if" is ignored`);
      },
    };
  Sf.default = A9;
  Object.defineProperty(pf, "__esModule", { value: !0 });
  const N9 = zs,
    P9 = hf,
    C9 = Us,
    T9 = gf,
    x9 = mf,
    D9 = t_,
    I9 = vf,
    R9 = el,
    M9 = yf,
    j9 = _f,
    F9 = $f,
    L9 = bf,
    V9 = wf,
    k9 = Ef,
    B9 = Of,
    z9 = Sf;
  function U9(e = !1) {
    const t = [
      // any
      F9.default,
      L9.default,
      V9.default,
      k9.default,
      B9.default,
      z9.default,
      // object
      I9.default,
      R9.default,
      D9.default,
      M9.default,
      j9.default,
    ];
    return (
      e ? t.push(P9.default, T9.default) : t.push(N9.default, C9.default),
      t.push(x9.default),
      t
    );
  }
  pf.default = U9;
  var Af = {},
    Nf = {};
  Object.defineProperty(Nf, "__esModule", { value: !0 });
  const ct = De,
    W9 = {
      message: ({ schemaCode: e }) => (0, ct.str)`must match format "${e}"`,
      params: ({ schemaCode: e }) => (0, ct._)`{format: ${e}}`,
    },
    H9 = {
      keyword: "format",
      type: ["number", "string"],
      schemaType: "string",
      $data: !0,
      error: W9,
      code(e, t) {
        const {
            gen: r,
            data: s,
            $data: n,
            schema: o,
            schemaCode: i,
            it: a,
          } = e,
          { opts: l, errSchemaPath: c, schemaEnv: u, self: f } = a;
        if (!l.validateFormats) return;
        n ? d() : p();
        function d() {
          const h = r.scopeValue("formats", {
              ref: f.formats,
              code: l.code.formats,
            }),
            m = r.const("fDef", (0, ct._)`${h}[${i}]`),
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
            return l.strictSchema === !1 ? ct.nil : (0, ct._)`${i} && !${g}`;
          }
          function E() {
            const S = u.$async
                ? (0, ct._)`(${m}.async ? await ${g}(${s}) : ${g}(${s}))`
                : (0, ct._)`${g}(${s})`,
              I = (0,
              ct._)`(typeof ${g} == "function" ? ${S} : ${g}.test(${s}))`;
            return (0, ct._)`${g} && ${g} !== true && ${y} === ${t} && !${I}`;
          }
        }
        function p() {
          const h = f.formats[o];
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
              return `unknown format "${o}" ignored in schema at path "${c}"`;
            }
          }
          function E(I) {
            const A =
                I instanceof RegExp
                  ? (0, ct.regexpCode)(I)
                  : l.code.formats
                    ? (0, ct._)`${l.code.formats}${(0, ct.getProperty)(o)}`
                    : void 0,
              O = r.scopeValue("formats", { key: o, ref: I, code: A });
            return typeof I == "object" && !(I instanceof RegExp)
              ? [I.type || "string", I.validate, (0, ct._)`${O}.validate`]
              : ["string", I, O];
          }
          function S() {
            if (typeof h == "object" && !(h instanceof RegExp) && h.async) {
              if (!u.$async) throw new Error("async format in sync schema");
              return (0, ct._)`await ${g}(${s})`;
            }
            return typeof y == "function"
              ? (0, ct._)`${g}(${s})`
              : (0, ct._)`${g}.test(${s})`;
          }
        }
      },
    };
  Nf.default = H9;
  Object.defineProperty(Af, "__esModule", { value: !0 });
  const K9 = Nf,
    G9 = [K9.default];
  Af.default = G9;
  var Cs = {};
  Object.defineProperty(Cs, "__esModule", { value: !0 });
  Cs.contentVocabulary = Cs.metadataVocabulary = void 0;
  Cs.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples",
  ];
  Cs.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema",
  ];
  Object.defineProperty(Xu, "__esModule", { value: !0 });
  const q9 = Zu,
    Y9 = ef,
    J9 = pf,
    X9 = Af,
    Wh = Cs,
    Z9 = [
      q9.default,
      Y9.default,
      (0, J9.default)(),
      X9.default,
      Wh.metadataVocabulary,
      Wh.contentVocabulary,
    ];
  Xu.default = Z9;
  var Pf = {},
    s_ = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.DiscrError = void 0),
      (function (t) {
        (t.Tag = "tag"), (t.Mapping = "mapping");
      })(e.DiscrError || (e.DiscrError = {}));
  })(s_);
  Object.defineProperty(Pf, "__esModule", { value: !0 });
  const vs = De,
    wc = s_,
    Hh = kt,
    Q9 = Be,
    eH = {
      message: ({ params: { discrError: e, tagName: t } }) =>
        e === wc.DiscrError.Tag
          ? `tag "${t}" must be string`
          : `value of tag "${t}" must be in oneOf`,
      params: ({ params: { discrError: e, tag: t, tagName: r } }) =>
        (0, vs._)`{error: ${e}, tag: ${r}, tagValue: ${t}}`,
    },
    tH = {
      keyword: "discriminator",
      type: "object",
      schemaType: "object",
      error: eH,
      code(e) {
        const { gen: t, data: r, schema: s, parentSchema: n, it: o } = e,
          { oneOf: i } = n;
        if (!o.opts.discriminator)
          throw new Error("discriminator: requires discriminator option");
        const a = s.propertyName;
        if (typeof a != "string")
          throw new Error("discriminator: requires propertyName");
        if (s.mapping)
          throw new Error("discriminator: mapping is not supported");
        if (!i) throw new Error("discriminator: requires oneOf keyword");
        const l = t.let("valid", !1),
          c = t.const("tag", (0, vs._)`${r}${(0, vs.getProperty)(a)}`);
        t.if(
          (0, vs._)`typeof ${c} == "string"`,
          () => u(),
          () =>
            e.error(!1, { discrError: wc.DiscrError.Tag, tag: c, tagName: a })
        ),
          e.ok(l);
        function u() {
          const p = d();
          t.if(!1);
          for (const h in p)
            t.elseIf((0, vs._)`${c} === ${h}`), t.assign(l, f(p[h]));
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
          return e.mergeEvaluated(m, vs.Name), h;
        }
        function d() {
          var p;
          const h = {},
            m = g(n);
          let y = !0;
          for (let S = 0; S < i.length; S++) {
            let I = i[S];
            I != null &&
              I.$ref &&
              !(0, Q9.schemaHasRulesButRef)(I, o.self.RULES) &&
              ((I = Hh.resolveRef.call(
                o.self,
                o.schemaEnv.root,
                o.baseId,
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
  Pf.default = tH;
  const rH = "http://json-schema.org/draft-07/schema#",
    nH = "http://json-schema.org/draft-07/schema#",
    sH = "Core schema meta-schema",
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
    aH = {
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
    lH = {
      $schema: rH,
      $id: nH,
      title: sH,
      definitions: oH,
      type: iH,
      properties: aH,
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
    const r = Oy,
      s = Xu,
      n = Pf,
      o = lH,
      i = ["/properties"],
      a = "http://json-schema.org/draft-07/schema";
    class l extends r.default {
      _addVocabularies() {
        super._addVocabularies(),
          s.default.forEach(h => this.addVocabulary(h)),
          this.opts.discriminator && this.addKeyword(n.default);
      }
      _addDefaultMetaSchema() {
        if ((super._addDefaultMetaSchema(), !this.opts.meta)) return;
        const h = this.opts.$data ? this.$dataMetaSchema(o, i) : o;
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
    var f = ei;
    Object.defineProperty(t, "ValidationError", {
      enumerable: !0,
      get: function () {
        return f.default;
      },
    });
    var d = ti;
    Object.defineProperty(t, "MissingRefError", {
      enumerable: !0,
      get: function () {
        return d.default;
      },
    });
  })(mc, mc.exports);
  var o_ = mc.exports,
    Kh = { exports: {} },
    i_ = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.formatNames = e.fastFormats = e.fullFormats = void 0);
    function t(z, H) {
      return { validate: z, compare: H };
    }
    (e.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: t(o, i),
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
        date: t(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, i),
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
    const s = /^(\d\d\d\d)-(\d\d)-(\d\d)$/,
      n = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function o(z) {
      const H = s.exec(z);
      if (!H) return !1;
      const ne = +H[1],
        G = +H[2],
        Ne = +H[3];
      return (
        G >= 1 && G <= 12 && Ne >= 1 && Ne <= (G === 2 && r(ne) ? 29 : n[G])
      );
    }
    function i(z, H) {
      if (z && H) return z > H ? 1 : z < H ? -1 : 0;
    }
    const a = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
    function l(z, H) {
      const ne = a.exec(z);
      if (!ne) return !1;
      const G = +ne[1],
        Ne = +ne[2],
        fe = +ne[3],
        Pe = ne[5];
      return (
        ((G <= 23 && Ne <= 59 && fe <= 59) ||
          (G === 23 && Ne === 59 && fe === 60)) &&
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
      return H.length === 2 && o(H[0]) && l(H[1], !0);
    }
    function d(z, H) {
      if (!(z && H)) return;
      const [ne, G] = z.split(u),
        [Ne, fe] = H.split(u),
        Pe = i(ne, Ne);
      if (Pe !== void 0) return Pe || c(G, fe);
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
  })(i_);
  var a_ = {};
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.formatLimitDefinition = void 0);
    const t = o_,
      r = De,
      s = r.operators,
      n = {
        formatMaximum: { okStr: "<=", ok: s.LTE, fail: s.GT },
        formatMinimum: { okStr: ">=", ok: s.GTE, fail: s.LT },
        formatExclusiveMaximum: { okStr: "<", ok: s.LT, fail: s.GTE },
        formatExclusiveMinimum: { okStr: ">", ok: s.GT, fail: s.LTE },
      },
      o = {
        message: ({ keyword: a, schemaCode: l }) =>
          r.str`should be ${n[a].okStr} ${l}`,
        params: ({ keyword: a, schemaCode: l }) =>
          r._`{comparison: ${n[a].okStr}, limit: ${l}}`,
      };
    e.formatLimitDefinition = {
      keyword: Object.keys(n),
      type: "string",
      schemaType: "string",
      $data: !0,
      error: o,
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
          return r._`${E}.compare(${c}, ${u}) ${n[f].fail} 0`;
        }
      },
      dependencies: ["format"],
    };
    const i = a => (a.addKeyword(e.formatLimitDefinition), a);
    e.default = i;
  })(a_);
  (function (e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 });
    const r = i_,
      s = a_,
      n = De,
      o = new n.Name("fullFormats"),
      i = new n.Name("fastFormats"),
      a = (c, u = { keywords: !0 }) => {
        if (Array.isArray(u)) return l(c, u, r.fullFormats, o), c;
        const [f, d] =
            u.mode === "fast" ? [r.fastFormats, i] : [r.fullFormats, o],
          p = u.formats || r.formatNames;
        return l(c, p, f, d), u.keywords && s.default(c), c;
      };
    a.get = (c, u = "full") => {
      const d = (u === "fast" ? r.fastFormats : r.fullFormats)[c];
      if (!d) throw new Error(`Unknown format "${c}"`);
      return d;
    };
    function l(c, u, f, d) {
      var p, h;
      ((p = (h = c.opts.code).formats) !== null && p !== void 0) ||
        (h.formats = n._`require("ajv-formats/dist/formats").${d}`);
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
  var ys;
  (function (e) {
    (e.clearDialogTitle = "clearDialogTitle"),
      (e.clearDialogMessage = "clearDialogMessage"),
      (e.clearDialogAccept = "clearDialogAccept"),
      (e.clearDialogDecline = "clearDialogDecline");
  })(ys || (ys = {}));
  ys.clearDialogTitle,
    ys.clearDialogMessage,
    ys.clearDialogAccept,
    ys.clearDialogDecline;
  var qh = { exports: {} };
  (function (e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 });
    const r = o_,
      s = De,
      n = Ps,
      o = Zt,
      i = Bs,
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
            L = s.strConcat(a.default.instancePath, A.errorPath);
          _.if(r._`${a.default.errors} > 0`, () => {
            if (typeof O == "object") {
              const [P, v] = H(O);
              v && ne(v), P && G(P), Ne(z(O));
            }
            const M = typeof O == "string" ? O : O._;
            M && fe(M), y.keepErrors || Pe();
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
              N(se => {
                _.if(F, () =>
                  _.code(r._`${F} += ${typeof $ == "string" ? $ : ";"}`)
                ),
                  _.code(r._`${F} += ${j(se)}`),
                  _.assign(q, r._`${q}.concat(${P}[${se}])`);
              }),
                i.reportError(g, { message: F, params: r._`{errors: ${q}}` });
            } else
              N(F =>
                i.reportError(g, {
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
                _.forIn("keyProp", r._`${P}[${q}]`, se => {
                  _.assign(F, r._`${P}[${q}][${se}]`),
                    _.if(r._`${F}.length`, () => {
                      const we = _.const(
                        "tmpl",
                        r._`${$}[${q}] && ${$}[${q}][${se}]`
                      );
                      i.reportError(g, {
                        message: r._`${we} ? ${we}() : ${I}[${q}][${se}]`,
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
            const se = _.let("templates");
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
                  (_.if(s.and($, s.not(N))),
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
                  i.reportError(g, {
                    message: r._`${Ie} in ${se} ? ${se}[${Ie}]() : ${I}${q}[${Ie}]`,
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
              _.assign(j, r.stringify(Ie)), _.assign(se, Ue(Ie, tt));
            }
          }
          function fe(M) {
            const P = _.const("emErrs", r._`[]`);
            _.forOf("err", a.default.vErrors, v =>
              _.if(ve(v), () =>
                _.code(r._`${P}.push(${v})`).assign(r._`${v}.${c}`, !0)
              )
            ),
              _.if(r._`${P}.length`, () =>
                i.reportError(g, {
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
            return s.and(
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
              s.and(
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
            return s.and(
              r._`${M}.keyword !== ${l}`,
              r._`!${M}.${c}`,
              s.or(
                r._`${M}.instancePath === ${L}`,
                s.and(
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
              ? new n._Code(
                  n
                    .safeStringify(M)
                    .replace(
                      d,
                      (P, v) => `" + JSON.stringify(${o.getData(v, A)}) + "`
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
  function l_(e) {
    var t,
      r,
      s = "";
    if (typeof e == "string" || typeof e == "number") s += e;
    else if (typeof e == "object")
      if (Array.isArray(e))
        for (t = 0; t < e.length; t++)
          e[t] && (r = l_(e[t])) && (s && (s += " "), (s += r));
      else for (t in e) e[t] && (s && (s += " "), (s += t));
    return s;
  }
  function cH() {
    for (var e, t, r = 0, s = ""; r < arguments.length; )
      (e = arguments[r++]) && (t = l_(e)) && (s && (s += " "), (s += t));
    return s;
  }
  const Yh = e => (typeof e == "boolean" ? "".concat(e) : e === 0 ? "0" : e),
    Jh = cH,
    vt = (e, t) => r => {
      var s;
      if ((t == null ? void 0 : t.variants) == null)
        return Jh(
          e,
          r == null ? void 0 : r.class,
          r == null ? void 0 : r.className
        );
      const { variants: n, defaultVariants: o } = t,
        i = Object.keys(n).map(c => {
          const u = r == null ? void 0 : r[c],
            f = o == null ? void 0 : o[c];
          if (u === null) return null;
          const d = Yh(u) || Yh(f);
          return n[c][d];
        }),
        a =
          r &&
          Object.entries(r).reduce((c, u) => {
            let [f, d] = u;
            return d === void 0 || (c[f] = d), c;
          }, {}),
        l =
          t == null || (s = t.compoundVariants) === null || s === void 0
            ? void 0
            : s.reduce((c, u) => {
                let { class: f, className: d, ...p } = u;
                return Object.entries(p).every(h => {
                  let [m, y] = h;
                  return Array.isArray(y)
                    ? y.includes(
                        {
                          ...o,
                          ...a,
                        }[m]
                      )
                    : {
                        ...o,
                        ...a,
                      }[m] === y;
                })
                  ? [...c, f, d]
                  : c;
              }, []);
      return Jh(
        e,
        i,
        l,
        r == null ? void 0 : r.class,
        r == null ? void 0 : r.className
      );
    },
    uH = vt(
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
    fH = {
      button: {
        root: uH,
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
    dH = /* @__PURE__ */ me({
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
          styles: fr("button", Mt(e), fH, e.upwindConfig),
          globalStyles: ou,
        };
      },
    }),
    Gt = (e, t) => {
      const r = e.__vccOpts || e;
      for (const [s, n] of t) r[s] = n;
      return r;
    },
    pH = ["href"];
  function hH(e, t, r, s, n, o) {
    const i = Ye("primitive");
    return (
      ue(),
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
            pH
          ),
          Ve(
            i,
            {
              as: e.as,
              "as-child": e.asChild,
              class: ot(e.styles.button.root),
              disabled: e.disabled,
            },
            {
              default: ie(() => [
                de(e.$slots, "prepend"),
                de(e.$slots, "default", {}, () => [
                  ar(
                    "span",
                    {
                      class: ot(e.styles.button.label),
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
  const gH = /* @__PURE__ */ Gt(dH, [["render", hH]]),
    mH = /* @__PURE__ */ ko(gH),
    vH = {
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
    yH = /* @__PURE__ */ me({
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
        const t = fr("icon", Mt(e), vH, e.upwindConfig),
          r = /* @__PURE__ */ Object.assign({
            "/src/assets/icons/alert-circle.svg": () =>
              import("./alert-circle-C3ZrsG7D.js").then(n => n.default),
            "/src/assets/icons/alert-triangle.svg": () =>
              import("./alert-triangle-CDW3qS56.js").then(n => n.default),
            "/src/assets/icons/arrow-down.svg": () =>
              import("./arrow-down-Cl7dO9kR.js").then(n => n.default),
            "/src/assets/icons/arrow-left.svg": () =>
              import("./arrow-left-CUFy9M0J.js").then(n => n.default),
            "/src/assets/icons/arrow-right.svg": () =>
              import("./arrow-right-DmHcpSr9.js").then(n => n.default),
            "/src/assets/icons/arrow-up-down.svg": () =>
              import("./arrow-up-down-Cni9-OGo.js").then(n => n.default),
            "/src/assets/icons/arrow-up.svg": () =>
              import("./arrow-up-CUKJYvHU.js").then(n => n.default),
            "/src/assets/icons/available.svg": () =>
              import("./available-BtsgZKOl.js").then(n => n.default),
            "/src/assets/icons/check-circle-solid.svg": () =>
              import("./check-circle-solid-CX5JqJkH.js").then(n => n.default),
            "/src/assets/icons/check-circle.svg": () =>
              import("./check-circle-BVWbJSar.js").then(n => n.default),
            "/src/assets/icons/check-square.svg": () =>
              import("./check-square-DgcBGaSH.js").then(n => n.default),
            "/src/assets/icons/check.svg": () =>
              import("./check-CXN25hD9.js").then(n => n.default),
            "/src/assets/icons/close-circle.svg": () =>
              import("./close-circle-DQQPLZRo.js").then(n => n.default),
            "/src/assets/icons/close.svg": () =>
              import("./close-tyq8W1Ci.js").then(n => n.default),
            "/src/assets/icons/code.svg": () =>
              import("./code-0dCqGB0Q.js").then(n => n.default),
            "/src/assets/icons/dot.svg": () =>
              import("./dot-BLqCemaV.js").then(n => n.default),
            "/src/assets/icons/edit.svg": () =>
              import("./edit-DLpiZ7cf.js").then(n => n.default),
            "/src/assets/icons/email-check.svg": () =>
              import("./email-check-DJaXZl5Q.js").then(n => n.default),
            "/src/assets/icons/email-warning.svg": () =>
              import("./email-warning-Do6ukdsB.js").then(n => n.default),
            "/src/assets/icons/email.svg": () =>
              import("./email-hfMwWSKg.js").then(n => n.default),
            "/src/assets/icons/flags/GE-AB.svg": () =>
              import("./GE-AB-QhnVrpD3.js").then(n => n.default),
            "/src/assets/icons/flags/GE-OS.svg": () =>
              import("./GE-OS-CZalGGb6.js").then(n => n.default),
            "/src/assets/icons/flags/IC.svg": () =>
              import("./IC-GavPiyiE.js").then(n => n.default),
            "/src/assets/icons/flags/TA.svg": () =>
              import("./TA-C8tfa6Kr.js").then(n => n.default),
            "/src/assets/icons/flags/ac.svg": () =>
              import("./ac-Dzo5V4YH.js").then(n => n.default),
            "/src/assets/icons/flags/ad.svg": () =>
              import("./ad-BPUb4ksB.js").then(n => n.default),
            "/src/assets/icons/flags/ae.svg": () =>
              import("./ae-CwxbE7AE.js").then(n => n.default),
            "/src/assets/icons/flags/af.svg": () =>
              import("./af-Xs9eCrad.js").then(n => n.default),
            "/src/assets/icons/flags/ag.svg": () =>
              import("./ag-BzIrpDop.js").then(n => n.default),
            "/src/assets/icons/flags/ai.svg": () =>
              import("./ai-CoGYYZZY.js").then(n => n.default),
            "/src/assets/icons/flags/al.svg": () =>
              import("./al-DAYWrbnt.js").then(n => n.default),
            "/src/assets/icons/flags/am.svg": () =>
              import("./am-NPE85CC4.js").then(n => n.default),
            "/src/assets/icons/flags/ao.svg": () =>
              import("./ao-DikhDMPW.js").then(n => n.default),
            "/src/assets/icons/flags/aq.svg": () =>
              import("./aq-DJ9wJKw4.js").then(n => n.default),
            "/src/assets/icons/flags/ar.svg": () =>
              import("./ar-Bb0Je40L.js").then(n => n.default),
            "/src/assets/icons/flags/as.svg": () =>
              import("./as-C8jx2chm.js").then(n => n.default),
            "/src/assets/icons/flags/at.svg": () =>
              import("./at-BRD_RNnt.js").then(n => n.default),
            "/src/assets/icons/flags/au.svg": () =>
              import("./au-95eg6jgH.js").then(n => n.default),
            "/src/assets/icons/flags/aw.svg": () =>
              import("./aw-BjAPHKPj.js").then(n => n.default),
            "/src/assets/icons/flags/ax.svg": () =>
              import("./ax-DxCsYmq9.js").then(n => n.default),
            "/src/assets/icons/flags/az.svg": () =>
              import("./az-CvV01_gd.js").then(n => n.default),
            "/src/assets/icons/flags/ba.svg": () =>
              import("./ba-fZ0BUAZs.js").then(n => n.default),
            "/src/assets/icons/flags/bb.svg": () =>
              import("./bb-BpBICY8d.js").then(n => n.default),
            "/src/assets/icons/flags/bd.svg": () =>
              import("./bd-RIxQamId.js").then(n => n.default),
            "/src/assets/icons/flags/be.svg": () =>
              import("./be-CBA2Jygw.js").then(n => n.default),
            "/src/assets/icons/flags/bf.svg": () =>
              import("./bf-BGIhc4Sd.js").then(n => n.default),
            "/src/assets/icons/flags/bg.svg": () =>
              import("./bg-DzxFZS4q.js").then(n => n.default),
            "/src/assets/icons/flags/bh.svg": () =>
              import("./bh-D89H0OPm.js").then(n => n.default),
            "/src/assets/icons/flags/bi.svg": () =>
              import("./bi-jBTb1WrH.js").then(n => n.default),
            "/src/assets/icons/flags/bj.svg": () =>
              import("./bj-CfocLDoj.js").then(n => n.default),
            "/src/assets/icons/flags/bl.svg": () =>
              import("./bl-XMk1ICoX.js").then(n => n.default),
            "/src/assets/icons/flags/bm.svg": () =>
              import("./bm-N_s4mpVs.js").then(n => n.default),
            "/src/assets/icons/flags/bn.svg": () =>
              import("./bn-DUJ7Z77u.js").then(n => n.default),
            "/src/assets/icons/flags/bo.svg": () =>
              import("./bo-C5VVE6hs.js").then(n => n.default),
            "/src/assets/icons/flags/bq.svg": () =>
              import("./bq-BTEaBpUM.js").then(n => n.default),
            "/src/assets/icons/flags/br.svg": () =>
              import("./br-DsNXPVYK.js").then(n => n.default),
            "/src/assets/icons/flags/bs.svg": () =>
              import("./bs-BahIU2K6.js").then(n => n.default),
            "/src/assets/icons/flags/bt.svg": () =>
              import("./bt-C8bXNN6y.js").then(n => n.default),
            "/src/assets/icons/flags/bv.svg": () =>
              import("./bv-BTcQfycd.js").then(n => n.default),
            "/src/assets/icons/flags/bw.svg": () =>
              import("./bw-wyeGtET_.js").then(n => n.default),
            "/src/assets/icons/flags/by.svg": () =>
              import("./by-BopwN-v7.js").then(n => n.default),
            "/src/assets/icons/flags/bz.svg": () =>
              import("./bz-B5Nc99G0.js").then(n => n.default),
            "/src/assets/icons/flags/ca.svg": () =>
              import("./ca-CVrmGEEA.js").then(n => n.default),
            "/src/assets/icons/flags/cc.svg": () =>
              import("./cc-CwaCDA1Z.js").then(n => n.default),
            "/src/assets/icons/flags/cd.svg": () =>
              import("./cd-CGeFaS9X.js").then(n => n.default),
            "/src/assets/icons/flags/cf.svg": () =>
              import("./cf-Bk1PotRV.js").then(n => n.default),
            "/src/assets/icons/flags/cg.svg": () =>
              import("./cg-BJIMAI9U.js").then(n => n.default),
            "/src/assets/icons/flags/ch.svg": () =>
              import("./ch-DNzgZFWO.js").then(n => n.default),
            "/src/assets/icons/flags/ci.svg": () =>
              import("./ci-B4cVGlkT.js").then(n => n.default),
            "/src/assets/icons/flags/ck.svg": () =>
              import("./ck-CJZ0IaJC.js").then(n => n.default),
            "/src/assets/icons/flags/cl.svg": () =>
              import("./cl-CJo2GxIq.js").then(n => n.default),
            "/src/assets/icons/flags/cm.svg": () =>
              import("./cm-DhGhqyY7.js").then(n => n.default),
            "/src/assets/icons/flags/cn.svg": () =>
              import("./cn-CC3KvXpv.js").then(n => n.default),
            "/src/assets/icons/flags/co.svg": () =>
              import("./co-Xil_Fz9R.js").then(n => n.default),
            "/src/assets/icons/flags/cr.svg": () =>
              import("./cr-CuDXCqQX.js").then(n => n.default),
            "/src/assets/icons/flags/cu.svg": () =>
              import("./cu-TTzjkyUR.js").then(n => n.default),
            "/src/assets/icons/flags/cv.svg": () =>
              import("./cv-CxBWd-vQ.js").then(n => n.default),
            "/src/assets/icons/flags/cw.svg": () =>
              import("./cw-D8pZ_kIO.js").then(n => n.default),
            "/src/assets/icons/flags/cx.svg": () =>
              import("./cx-B0ZBIZlp.js").then(n => n.default),
            "/src/assets/icons/flags/cy.svg": () =>
              import("./cy-COfDSz2I.js").then(n => n.default),
            "/src/assets/icons/flags/cz.svg": () =>
              import("./cz-utS1zSwF.js").then(n => n.default),
            "/src/assets/icons/flags/de.svg": () =>
              import("./de-BF973WTl.js").then(n => n.default),
            "/src/assets/icons/flags/dj.svg": () =>
              import("./dj-DA6IPKwN.js").then(n => n.default),
            "/src/assets/icons/flags/dk.svg": () =>
              import("./dk-Bw7_27EJ.js").then(n => n.default),
            "/src/assets/icons/flags/dm.svg": () =>
              import("./dm-ijf3wzT1.js").then(n => n.default),
            "/src/assets/icons/flags/do.svg": () =>
              import("./do-GW7uN5qJ.js").then(n => n.default),
            "/src/assets/icons/flags/dz.svg": () =>
              import("./dz-1epKCUxN.js").then(n => n.default),
            "/src/assets/icons/flags/ec.svg": () =>
              import("./ec-CPsO0ygV.js").then(n => n.default),
            "/src/assets/icons/flags/ee.svg": () =>
              import("./ee-DpY7hcup.js").then(n => n.default),
            "/src/assets/icons/flags/eg.svg": () =>
              import("./eg-BMZYiNNj.js").then(n => n.default),
            "/src/assets/icons/flags/eh.svg": () =>
              import("./eh-D6bOwQt-.js").then(n => n.default),
            "/src/assets/icons/flags/en.svg": () =>
              import("./en-B8_ZWlgr.js").then(n => n.default),
            "/src/assets/icons/flags/er.svg": () =>
              import("./er-DFOkj-Cy.js").then(n => n.default),
            "/src/assets/icons/flags/es.svg": () =>
              import("./es-DVE8_hCL.js").then(n => n.default),
            "/src/assets/icons/flags/et.svg": () =>
              import("./et-BDngkS6G.js").then(n => n.default),
            "/src/assets/icons/flags/eu.svg": () =>
              import("./eu-HvxkikXV.js").then(n => n.default),
            "/src/assets/icons/flags/fi.svg": () =>
              import("./fi-D5w2F9lx.js").then(n => n.default),
            "/src/assets/icons/flags/fj.svg": () =>
              import("./fj-Dr9xO4GI.js").then(n => n.default),
            "/src/assets/icons/flags/fk.svg": () =>
              import("./fk-h8_84Rnx.js").then(n => n.default),
            "/src/assets/icons/flags/fm.svg": () =>
              import("./fm-PHZsYHhx.js").then(n => n.default),
            "/src/assets/icons/flags/fo.svg": () =>
              import("./fo-Db2oiKjf.js").then(n => n.default),
            "/src/assets/icons/flags/fr.svg": () =>
              import("./fr-uaEeP7Cj.js").then(n => n.default),
            "/src/assets/icons/flags/ga.svg": () =>
              import("./ga-DAD_CJFI.js").then(n => n.default),
            "/src/assets/icons/flags/gb.svg": () =>
              import("./gb-B8_ZWlgr.js").then(n => n.default),
            "/src/assets/icons/flags/gd.svg": () =>
              import("./gd-MjtstG03.js").then(n => n.default),
            "/src/assets/icons/flags/ge.svg": () =>
              import("./ge-C0XOibkm.js").then(n => n.default),
            "/src/assets/icons/flags/gf.svg": () =>
              import("./gf-B5rW9o9G.js").then(n => n.default),
            "/src/assets/icons/flags/gg.svg": () =>
              import("./gg-BpBl37YP.js").then(n => n.default),
            "/src/assets/icons/flags/gh.svg": () =>
              import("./gh-7nFynKhM.js").then(n => n.default),
            "/src/assets/icons/flags/gi.svg": () =>
              import("./gi-Bnf6f7oq.js").then(n => n.default),
            "/src/assets/icons/flags/gl.svg": () =>
              import("./gl-C_0KzxW0.js").then(n => n.default),
            "/src/assets/icons/flags/gm.svg": () =>
              import("./gm-Ci5wiEwL.js").then(n => n.default),
            "/src/assets/icons/flags/gn.svg": () =>
              import("./gn-BuCXGFwk.js").then(n => n.default),
            "/src/assets/icons/flags/gp.svg": () =>
              import("./gp-uaEeP7Cj.js").then(n => n.default),
            "/src/assets/icons/flags/gq.svg": () =>
              import("./gq-9k_-Nvm8.js").then(n => n.default),
            "/src/assets/icons/flags/gr.svg": () =>
              import("./gr-BAbFUf9g.js").then(n => n.default),
            "/src/assets/icons/flags/gs.svg": () =>
              import("./gs-DvzY_gBR.js").then(n => n.default),
            "/src/assets/icons/flags/gt.svg": () =>
              import("./gt-CrMrfrip.js").then(n => n.default),
            "/src/assets/icons/flags/gu.svg": () =>
              import("./gu-C_ycFXzS.js").then(n => n.default),
            "/src/assets/icons/flags/gw.svg": () =>
              import("./gw-gxCcXif7.js").then(n => n.default),
            "/src/assets/icons/flags/gy.svg": () =>
              import("./gy-tRfcDG6y.js").then(n => n.default),
            "/src/assets/icons/flags/hk.svg": () =>
              import("./hk-QNt1tgG8.js").then(n => n.default),
            "/src/assets/icons/flags/hm.svg": () =>
              import("./hm-DAFoHX7Q.js").then(n => n.default),
            "/src/assets/icons/flags/hn.svg": () =>
              import("./hn-bpCh1dhn.js").then(n => n.default),
            "/src/assets/icons/flags/hr.svg": () =>
              import("./hr-BSvYL_wn.js").then(n => n.default),
            "/src/assets/icons/flags/ht.svg": () =>
              import("./ht-DIF4a1k5.js").then(n => n.default),
            "/src/assets/icons/flags/hu.svg": () =>
              import("./hu-CV2IQ2Xe.js").then(n => n.default),
            "/src/assets/icons/flags/id.svg": () =>
              import("./id-DPIytBYf.js").then(n => n.default),
            "/src/assets/icons/flags/ie.svg": () =>
              import("./ie-RoOpUgKg.js").then(n => n.default),
            "/src/assets/icons/flags/il.svg": () =>
              import("./il-4H3rH-Ru.js").then(n => n.default),
            "/src/assets/icons/flags/im.svg": () =>
              import("./im-CefaBgEs.js").then(n => n.default),
            "/src/assets/icons/flags/in.svg": () =>
              import("./in-DZjDDhnC.js").then(n => n.default),
            "/src/assets/icons/flags/io.svg": () =>
              import("./io-C1wUQ_GM.js").then(n => n.default),
            "/src/assets/icons/flags/iq.svg": () =>
              import("./iq-BNS_o1VM.js").then(n => n.default),
            "/src/assets/icons/flags/ir.svg": () =>
              import("./ir-CRfiZlFy.js").then(n => n.default),
            "/src/assets/icons/flags/is.svg": () =>
              import("./is-HKRCj2yZ.js").then(n => n.default),
            "/src/assets/icons/flags/it.svg": () =>
              import("./it-Do8aw5_F.js").then(n => n.default),
            "/src/assets/icons/flags/je.svg": () =>
              import("./je-CL_ZPQfJ.js").then(n => n.default),
            "/src/assets/icons/flags/jm.svg": () =>
              import("./jm-D319XlCa.js").then(n => n.default),
            "/src/assets/icons/flags/jo.svg": () =>
              import("./jo-DQJlfa-y.js").then(n => n.default),
            "/src/assets/icons/flags/jp.svg": () =>
              import("./jp-DCRdyFi3.js").then(n => n.default),
            "/src/assets/icons/flags/ke.svg": () =>
              import("./ke-DWwI_gFu.js").then(n => n.default),
            "/src/assets/icons/flags/kg.svg": () =>
              import("./kg-DvsQPwnf.js").then(n => n.default),
            "/src/assets/icons/flags/kh.svg": () =>
              import("./kh-Crt_uajY.js").then(n => n.default),
            "/src/assets/icons/flags/ki.svg": () =>
              import("./ki-D9hZx4Eb.js").then(n => n.default),
            "/src/assets/icons/flags/km.svg": () =>
              import("./km-qoNMwRY0.js").then(n => n.default),
            "/src/assets/icons/flags/kn.svg": () =>
              import("./kn-D5B-aFQD.js").then(n => n.default),
            "/src/assets/icons/flags/kp.svg": () =>
              import("./kp-ATA8DEFb.js").then(n => n.default),
            "/src/assets/icons/flags/kr.svg": () =>
              import("./kr-BP0yaVRJ.js").then(n => n.default),
            "/src/assets/icons/flags/kw.svg": () =>
              import("./kw-DHtY6ojD.js").then(n => n.default),
            "/src/assets/icons/flags/ky.svg": () =>
              import("./ky-WGmC6P-t.js").then(n => n.default),
            "/src/assets/icons/flags/kz.svg": () =>
              import("./kz-assBqRlt.js").then(n => n.default),
            "/src/assets/icons/flags/la.svg": () =>
              import("./la-BraRzmvA.js").then(n => n.default),
            "/src/assets/icons/flags/lb.svg": () =>
              import("./lb-B3DIaiS7.js").then(n => n.default),
            "/src/assets/icons/flags/lc.svg": () =>
              import("./lc-Zrzr-8yV.js").then(n => n.default),
            "/src/assets/icons/flags/li.svg": () =>
              import("./li-DKsZ6IsE.js").then(n => n.default),
            "/src/assets/icons/flags/lk.svg": () =>
              import("./lk-D924qy5W.js").then(n => n.default),
            "/src/assets/icons/flags/lr.svg": () =>
              import("./lr-D9r-AOpM.js").then(n => n.default),
            "/src/assets/icons/flags/ls.svg": () =>
              import("./ls-dHjXyjeH.js").then(n => n.default),
            "/src/assets/icons/flags/lt.svg": () =>
              import("./lt-q-4hDMf1.js").then(n => n.default),
            "/src/assets/icons/flags/lu.svg": () =>
              import("./lu-DdaN-ZV3.js").then(n => n.default),
            "/src/assets/icons/flags/lv.svg": () =>
              import("./lv-CcZI4F54.js").then(n => n.default),
            "/src/assets/icons/flags/ly.svg": () =>
              import("./ly-B8fI2ofQ.js").then(n => n.default),
            "/src/assets/icons/flags/ma.svg": () =>
              import("./ma-BU6kG5M3.js").then(n => n.default),
            "/src/assets/icons/flags/mc.svg": () =>
              import("./mc-C6eGrljV.js").then(n => n.default),
            "/src/assets/icons/flags/md.svg": () =>
              import("./md-DjGyK3gC.js").then(n => n.default),
            "/src/assets/icons/flags/me.svg": () =>
              import("./me-NicNbuA3.js").then(n => n.default),
            "/src/assets/icons/flags/mf.svg": () =>
              import("./mf-ISawyHYf.js").then(n => n.default),
            "/src/assets/icons/flags/mg.svg": () =>
              import("./mg-Dnh2AjbI.js").then(n => n.default),
            "/src/assets/icons/flags/mh.svg": () =>
              import("./mh-BntBBujR.js").then(n => n.default),
            "/src/assets/icons/flags/mk.svg": () =>
              import("./mk-CKQvU-4r.js").then(n => n.default),
            "/src/assets/icons/flags/ml.svg": () =>
              import("./ml-DB6Q109N.js").then(n => n.default),
            "/src/assets/icons/flags/mm.svg": () =>
              import("./mm-C4Dr_wDy.js").then(n => n.default),
            "/src/assets/icons/flags/mn.svg": () =>
              import("./mn-C8JrBKF_.js").then(n => n.default),
            "/src/assets/icons/flags/mo.svg": () =>
              import("./mo-DuqJ6SQ1.js").then(n => n.default),
            "/src/assets/icons/flags/mp.svg": () =>
              import("./mp-BhGRsUJn.js").then(n => n.default),
            "/src/assets/icons/flags/mq.svg": () =>
              import("./mq-DqSoYMKt.js").then(n => n.default),
            "/src/assets/icons/flags/mr.svg": () =>
              import("./mr-BaqUgpwf.js").then(n => n.default),
            "/src/assets/icons/flags/ms.svg": () =>
              import("./ms-DZI1NWvO.js").then(n => n.default),
            "/src/assets/icons/flags/mt.svg": () =>
              import("./mt-COd7JE9C.js").then(n => n.default),
            "/src/assets/icons/flags/mu.svg": () =>
              import("./mu-DaymYH0V.js").then(n => n.default),
            "/src/assets/icons/flags/mv.svg": () =>
              import("./mv-DrNVGHIG.js").then(n => n.default),
            "/src/assets/icons/flags/mw.svg": () =>
              import("./mw-BvIfJ-k9.js").then(n => n.default),
            "/src/assets/icons/flags/mx.svg": () =>
              import("./mx-P00lErxG.js").then(n => n.default),
            "/src/assets/icons/flags/my.svg": () =>
              import("./my-PSfxgEgX.js").then(n => n.default),
            "/src/assets/icons/flags/mz.svg": () =>
              import("./mz-5QxAt0kN.js").then(n => n.default),
            "/src/assets/icons/flags/na.svg": () =>
              import("./na-wsrldyLN.js").then(n => n.default),
            "/src/assets/icons/flags/nc.svg": () =>
              import("./nc-BudRu_ml.js").then(n => n.default),
            "/src/assets/icons/flags/ne.svg": () =>
              import("./ne-oWGIFX1W.js").then(n => n.default),
            "/src/assets/icons/flags/nf.svg": () =>
              import("./nf-BLRrhzTp.js").then(n => n.default),
            "/src/assets/icons/flags/ng.svg": () =>
              import("./ng-CGavyZfu.js").then(n => n.default),
            "/src/assets/icons/flags/ni.svg": () =>
              import("./ni-B0uXZAux.js").then(n => n.default),
            "/src/assets/icons/flags/nl.svg": () =>
              import("./nl-C6uJCyaD.js").then(n => n.default),
            "/src/assets/icons/flags/no.svg": () =>
              import("./no-Zy9CNTCU.js").then(n => n.default),
            "/src/assets/icons/flags/np.svg": () =>
              import("./np-DY_2teoa.js").then(n => n.default),
            "/src/assets/icons/flags/nr.svg": () =>
              import("./nr-CpKWTiCB.js").then(n => n.default),
            "/src/assets/icons/flags/nu.svg": () =>
              import("./nu-CWvNOL_7.js").then(n => n.default),
            "/src/assets/icons/flags/nz.svg": () =>
              import("./nz-Dq_PYc6j.js").then(n => n.default),
            "/src/assets/icons/flags/om.svg": () =>
              import("./om-DzWMfRes.js").then(n => n.default),
            "/src/assets/icons/flags/pa.svg": () =>
              import("./pa-CvuKhfDa.js").then(n => n.default),
            "/src/assets/icons/flags/pe.svg": () =>
              import("./pe-Omr_7Oi2.js").then(n => n.default),
            "/src/assets/icons/flags/pf.svg": () =>
              import("./pf-B4RSiZ6X.js").then(n => n.default),
            "/src/assets/icons/flags/pg.svg": () =>
              import("./pg-BxfCGSpN.js").then(n => n.default),
            "/src/assets/icons/flags/ph.svg": () =>
              import("./ph-_pX5iP_9.js").then(n => n.default),
            "/src/assets/icons/flags/pk.svg": () =>
              import("./pk-DzbkmxRZ.js").then(n => n.default),
            "/src/assets/icons/flags/pl.svg": () =>
              import("./pl-Cx8_skX6.js").then(n => n.default),
            "/src/assets/icons/flags/pm.svg": () =>
              import("./pm-DfsdYsVe.js").then(n => n.default),
            "/src/assets/icons/flags/pn.svg": () =>
              import("./pn-B80HAVUD.js").then(n => n.default),
            "/src/assets/icons/flags/pr.svg": () =>
              import("./pr-kk8S3mHV.js").then(n => n.default),
            "/src/assets/icons/flags/ps.svg": () =>
              import("./ps-Zy7Wlzj4.js").then(n => n.default),
            "/src/assets/icons/flags/pt.svg": () =>
              import("./pt-Ckc_V94e.js").then(n => n.default),
            "/src/assets/icons/flags/pw.svg": () =>
              import("./pw-DErOhHM2.js").then(n => n.default),
            "/src/assets/icons/flags/py.svg": () =>
              import("./py-x2YowU2p.js").then(n => n.default),
            "/src/assets/icons/flags/qa.svg": () =>
              import("./qa-OOcPc_Dh.js").then(n => n.default),
            "/src/assets/icons/flags/re.svg": () =>
              import("./re-DfsdYsVe.js").then(n => n.default),
            "/src/assets/icons/flags/ro.svg": () =>
              import("./ro-C0ypUaqX.js").then(n => n.default),
            "/src/assets/icons/flags/rs.svg": () =>
              import("./rs-CLUlAqPU.js").then(n => n.default),
            "/src/assets/icons/flags/ru.svg": () =>
              import("./ru-DSCu2l55.js").then(n => n.default),
            "/src/assets/icons/flags/rw.svg": () =>
              import("./rw-BI0cbxZf.js").then(n => n.default),
            "/src/assets/icons/flags/sa.svg": () =>
              import("./sa-DmdSXZe0.js").then(n => n.default),
            "/src/assets/icons/flags/sb.svg": () =>
              import("./sb-CgTuIUpy.js").then(n => n.default),
            "/src/assets/icons/flags/sc.svg": () =>
              import("./sc-BIfiH1rF.js").then(n => n.default),
            "/src/assets/icons/flags/sd.svg": () =>
              import("./sd-ypa1rlwv.js").then(n => n.default),
            "/src/assets/icons/flags/se.svg": () =>
              import("./se-Cf4s5uOS.js").then(n => n.default),
            "/src/assets/icons/flags/sg.svg": () =>
              import("./sg-V85EVmMS.js").then(n => n.default),
            "/src/assets/icons/flags/sh.svg": () =>
              import("./sh-D3QISg6I.js").then(n => n.default),
            "/src/assets/icons/flags/si.svg": () =>
              import("./si-AKGPWZb-.js").then(n => n.default),
            "/src/assets/icons/flags/sj.svg": () =>
              import("./sj-NpmyG9Ew.js").then(n => n.default),
            "/src/assets/icons/flags/sk.svg": () =>
              import("./sk-Ly2GyVsp.js").then(n => n.default),
            "/src/assets/icons/flags/sl.svg": () =>
              import("./sl-D6nSjkKU.js").then(n => n.default),
            "/src/assets/icons/flags/sm.svg": () =>
              import("./sm-jyrG324v.js").then(n => n.default),
            "/src/assets/icons/flags/sn.svg": () =>
              import("./sn-C4MjzsuV.js").then(n => n.default),
            "/src/assets/icons/flags/so.svg": () =>
              import("./so-DXeHYy0h.js").then(n => n.default),
            "/src/assets/icons/flags/sr.svg": () =>
              import("./sr-98vrxFvn.js").then(n => n.default),
            "/src/assets/icons/flags/ss.svg": () =>
              import("./ss-CiT_Rl3D.js").then(n => n.default),
            "/src/assets/icons/flags/st.svg": () =>
              import("./st-ZZgkFHUy.js").then(n => n.default),
            "/src/assets/icons/flags/sv.svg": () =>
              import("./sv-BmX9hVpC.js").then(n => n.default),
            "/src/assets/icons/flags/sx.svg": () =>
              import("./sx-qNGz_Thm.js").then(n => n.default),
            "/src/assets/icons/flags/sy.svg": () =>
              import("./sy-DhygCjp5.js").then(n => n.default),
            "/src/assets/icons/flags/sz.svg": () =>
              import("./sz-2P3caq3H.js").then(n => n.default),
            "/src/assets/icons/flags/tc.svg": () =>
              import("./tc-D1nqOOsu.js").then(n => n.default),
            "/src/assets/icons/flags/td.svg": () =>
              import("./td-DgAxkWpy.js").then(n => n.default),
            "/src/assets/icons/flags/tf.svg": () =>
              import("./tf-C2o9WhbF.js").then(n => n.default),
            "/src/assets/icons/flags/tg.svg": () =>
              import("./tg-B83KIZr6.js").then(n => n.default),
            "/src/assets/icons/flags/th.svg": () =>
              import("./th-lys4_EuN.js").then(n => n.default),
            "/src/assets/icons/flags/tj.svg": () =>
              import("./tj-CQpo5b3_.js").then(n => n.default),
            "/src/assets/icons/flags/tk.svg": () =>
              import("./tk-CDAzs2Ja.js").then(n => n.default),
            "/src/assets/icons/flags/tl.svg": () =>
              import("./tl-Dnk1w6z7.js").then(n => n.default),
            "/src/assets/icons/flags/tm.svg": () =>
              import("./tm-BTD74hRP.js").then(n => n.default),
            "/src/assets/icons/flags/tn.svg": () =>
              import("./tn-CnPwk2Yo.js").then(n => n.default),
            "/src/assets/icons/flags/to.svg": () =>
              import("./to-Dcny4MI1.js").then(n => n.default),
            "/src/assets/icons/flags/tr.svg": () =>
              import("./tr-CM3OE9DJ.js").then(n => n.default),
            "/src/assets/icons/flags/tt.svg": () =>
              import("./tt-CCvL0mk9.js").then(n => n.default),
            "/src/assets/icons/flags/tv.svg": () =>
              import("./tv-CgevjwQa.js").then(n => n.default),
            "/src/assets/icons/flags/tw.svg": () =>
              import("./tw-DTmfSylp.js").then(n => n.default),
            "/src/assets/icons/flags/tz.svg": () =>
              import("./tz-CKK4ls6f.js").then(n => n.default),
            "/src/assets/icons/flags/ua.svg": () =>
              import("./ua-B-LpkhnU.js").then(n => n.default),
            "/src/assets/icons/flags/ug.svg": () =>
              import("./ug-BthCSCen.js").then(n => n.default),
            "/src/assets/icons/flags/um.svg": () =>
              import("./um-DzpyK5Q2.js").then(n => n.default),
            "/src/assets/icons/flags/us.svg": () =>
              import("./us-B61nPEqg.js").then(n => n.default),
            "/src/assets/icons/flags/uy.svg": () =>
              import("./uy-D2t8tAix.js").then(n => n.default),
            "/src/assets/icons/flags/uz.svg": () =>
              import("./uz-Cr_JUGL-.js").then(n => n.default),
            "/src/assets/icons/flags/va.svg": () =>
              import("./va-CpgBzHKB.js").then(n => n.default),
            "/src/assets/icons/flags/vc.svg": () =>
              import("./vc-BHtJ0gpc.js").then(n => n.default),
            "/src/assets/icons/flags/ve.svg": () =>
              import("./ve-BpvYOuZW.js").then(n => n.default),
            "/src/assets/icons/flags/vg.svg": () =>
              import("./vg-D2zNWWG5.js").then(n => n.default),
            "/src/assets/icons/flags/vi.svg": () =>
              import("./vi-CgFHxzuM.js").then(n => n.default),
            "/src/assets/icons/flags/vn.svg": () =>
              import("./vn-CHbKgcjT.js").then(n => n.default),
            "/src/assets/icons/flags/vu.svg": () =>
              import("./vu-BrpO6qXb.js").then(n => n.default),
            "/src/assets/icons/flags/wf.svg": () =>
              import("./wf-zbB-SJ39.js").then(n => n.default),
            "/src/assets/icons/flags/ws.svg": () =>
              import("./ws-CK-XfYqX.js").then(n => n.default),
            "/src/assets/icons/flags/xf.svg": () =>
              import("./xf-C72mQC46.js").then(n => n.default),
            "/src/assets/icons/flags/xk.svg": () =>
              import("./xk-ufqKfbNn.js").then(n => n.default),
            "/src/assets/icons/flags/ye.svg": () =>
              import("./ye-CV4DRrvY.js").then(n => n.default),
            "/src/assets/icons/flags/yt.svg": () =>
              import("./yt-d3_9UBQa.js").then(n => n.default),
            "/src/assets/icons/flags/za.svg": () =>
              import("./za-D5twSbj_.js").then(n => n.default),
            "/src/assets/icons/flags/zm.svg": () =>
              import("./zm-BqiSrWsj.js").then(n => n.default),
            "/src/assets/icons/flags/zw.svg": () =>
              import("./zw-vnoUWZ39.js").then(n => n.default),
            "/src/assets/icons/history.svg": () =>
              import("./history-CZPqbkxp.js").then(n => n.default),
            "/src/assets/icons/house.svg": () =>
              import("./house-8tOwLR_B.js").then(n => n.default),
            "/src/assets/icons/information-circle-alt.svg": () =>
              import("./information-circle-alt-MYjN-MfD.js").then(
                n => n.default
              ),
            "/src/assets/icons/information-circle.svg": () =>
              import("./information-circle-DwhYpLLA.js").then(n => n.default),
            "/src/assets/icons/lock.svg": () =>
              import("./lock-D91zAj0D.js").then(n => n.default),
            "/src/assets/icons/minus.svg": () =>
              import("./minus-DsKF1dtY.js").then(n => n.default),
            "/src/assets/icons/navigation-menu-horizontal.svg": () =>
              import("./navigation-menu-horizontal-CiAb7dnj.js").then(
                n => n.default
              ),
            "/src/assets/icons/navigation-menu-vertical.svg": () =>
              import("./navigation-menu-vertical-coSiAtyI.js").then(
                n => n.default
              ),
            "/src/assets/icons/navigation-menu.svg": () =>
              import("./navigation-menu-Baaek3N9.js").then(n => n.default),
            "/src/assets/icons/plus-circle.svg": () =>
              import("./plus-circle-k9mTAd-6.js").then(n => n.default),
            "/src/assets/icons/plus.svg": () =>
              import("./plus-BMvdGu9_.js").then(n => n.default),
            "/src/assets/icons/remove.svg": () =>
              import("./remove-DFX3iziq.js").then(n => n.default),
            "/src/assets/icons/search.svg": () =>
              import("./search-Bfe9I0Uq.js").then(n => n.default),
            "/src/assets/icons/shield-check.svg": () =>
              import("./shield-check-CbzkB2dE.js").then(n => n.default),
            "/src/assets/icons/shield-exclamation.svg": () =>
              import("./shield-exclamation-CQ7NReb8.js").then(n => n.default),
          }),
          s = Oe();
        return (
          Qt(async () => {
            var a, l;
            const n = ur(e.icon)
                ? `${(a = e.icon) == null ? void 0 : a.path}/`
                : "",
              o = ur(e.icon)
                ? (l = e.icon) == null
                  ? void 0
                  : l.name
                : e.icon,
              i = bN(r, (c, u) => TN(u, `${n}${o}.svg`));
            if (!i) {
              console.warn("icon", "import not found", {
                icon: e.icon,
                icons: r,
              }),
                (s.value = null);
              return;
            }
            s.value = await i().catch(
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
            svg: s,
          }
        );
      },
    }),
    _H = ["innerHTML", "aria-label"];
  function $H(e, t, r, s, n, o) {
    var i;
    return e.svg
      ? (ue(),
        Sn(
          "i",
          {
            key: 0,
            class: ot(["icon", e.styles.icon.root]),
            innerHTML: e.svg,
            role: "img",
            "aria-label": `${((i = e.icon) == null ? void 0 : i.name) || e.icon} icon`,
          },
          null,
          10,
          _H
        ))
      : $r("", !0);
  }
  const c_ = /* @__PURE__ */ Gt(yH, [["render", $H]]),
    bH = vt(
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
    wH = {
      avatar: {
        root: bH,
        icon: vt("m-1 h-full w-full object-cover"),
        caption: vt(
          "absolute bottom-0 left-0 right-0 top-0 z-0 inline-flex items-center justify-center text-center"
        ),
        image: vt("relative z-10 h-full w-full object-cover"),
      },
    },
    EH = /* @__PURE__ */ me({
      name: "UwAvatar",
      components: {
        AvatarFallback: IE,
        AvatarImage: DE,
        AvatarRoot: TE,
        UpwIcon: c_,
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
        icon: {
          type: [String, Object],
          required: !0,
        },
        src: { type: String },
        caption: { type: String },
        upwindConfig: { type: Object, default: () => ({}) },
      },
      setup(e) {
        return {
          styles: fr("avatar", Mt(e), wH, e.upwindConfig),
          globalStyles: ou,
        };
      },
      computed: {
        meta() {
          return {
            hasIcon: !_o(this.icon),
            hasImage: !_o(this.src),
            hasCaption: !_o(this.caption),
          };
        },
      },
    }),
    OH = ["href"];
  function SH(e, t, r, s, n, o) {
    const i = Ye("upw-icon"),
      a = Ye("avatar-image"),
      l = Ye("avatar-fallback"),
      c = Ye("avatar-root");
    return (
      ue(),
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
            OH
          ),
          Ve(
            c,
            {
              class: ot(e.styles.avatar.root),
            },
            {
              default: ie(() => [
                de(e.$slots, "default", {}, () => [
                  e.meta.hasIcon
                    ? (ue(),
                      _e(
                        i,
                        {
                          key: 0,
                          icon: e.icon,
                          class: ot(e.styles.avatar.image),
                        },
                        null,
                        8,
                        ["icon", "class"]
                      ))
                    : e.meta.hasImage
                      ? (ue(),
                        _e(
                          a,
                          {
                            key: 1,
                            src: e.src,
                            alt: "avatar",
                            class: ot(e.styles.avatar.image),
                          },
                          null,
                          8,
                          ["src", "class"]
                        ))
                      : $r("", !0),
                  e.meta.hasCaption
                    ? (ue(),
                      _e(
                        l,
                        {
                          key: 2,
                          class: ot(e.styles.avatar.caption),
                        },
                        {
                          default: ie(() => [Ss(_n(e.caption), 1)]),
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
  const AH = /* @__PURE__ */ Gt(EH, [["render", SH]]),
    NH = /* @__PURE__ */ ko(AH),
    PH = vt(
      "focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
      {
        variants: {
          variant: {
            flat: "border border-transparent",
            outline: "border bg-opacity-0",
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
            class: "border-destructive text-destructive",
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
    CH = {
      badge: {
        root: PH,
        label: vt("font-normal"),
      },
    },
    TH = /* @__PURE__ */ me({
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
          styles: fr("badge", Mt(e), CH, e.upwindConfig),
          globalStyles: ou,
        };
      },
    }),
    xH = ["href"];
  function DH(e, t, r, s, n, o) {
    return (
      ue(),
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
            xH
          ),
          ar(
            "span",
            {
              class: ot(e.styles.badge.root),
            },
            [
              de(e.$slots, "prepend"),
              ar(
                "span",
                {
                  class: ot(e.styles.badge.label),
                },
                [de(e.$slots, "default", {}, () => [Ss(_n(e.label), 1)])],
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
  const IH = /* @__PURE__ */ Gt(TH, [["render", DH]]),
    RH = /* @__PURE__ */ ko(IH),
    MH = /* @__PURE__ */ me({
      components: {
        DialogRoot: rE,
      },
      emits: ["update:open"],
    });
  function jH(e, t, r, s, n, o) {
    const i = Ye("dialog-root");
    return (
      ue(),
      _e(
        i,
        {
          "onUpdate:open": t[0] || (t[0] = a => e.$emit("update:open", a)),
        },
        {
          default: ie(() => [de(e.$slots, "default")]),
          _: 3,
        }
      )
    );
  }
  const FH = /* @__PURE__ */ Gt(MH, [["render", jH]]),
    LH = /* @__PURE__ */ me({
      components: {
        DialogTrigger: nE,
      },
    });
  function VH(e, t, r, s, n, o) {
    const i = Ye("dialog-trigger", !0);
    return (
      ue(),
      _e(i, null, {
        default: ie(() => [de(e.$slots, "default")]),
        _: 3,
      })
    );
  }
  const kH = /* @__PURE__ */ Gt(LH, [["render", VH]]),
    BH = vt(
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
    Ws = {
      dialog: {
        content: BH,
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
    zH = /* @__PURE__ */ me({
      setup(e) {
        return {
          styles: fr("dialog", Mt(e), Ws),
        };
      },
    });
  function UH(e, t, r, s, n, o) {
    return (
      ue(),
      Sn(
        "div",
        {
          class: ot(e.styles.dialog.header),
        },
        [de(e.$slots, "default")],
        2
      )
    );
  }
  const WH = /* @__PURE__ */ Gt(zH, [["render", UH]]),
    HH = /* @__PURE__ */ me({
      components: {
        DialogTitle: NE,
      },
      setup(e) {
        return {
          styles: fr("dialog", Mt(e), Ws),
        };
      },
    });
  function KH(e, t, r, s, n, o) {
    const i = Ye("dialog-title", !0);
    return (
      ue(),
      _e(
        i,
        {
          class: ot(e.styles.dialog.title),
        },
        {
          default: ie(() => [de(e.$slots, "default")]),
          _: 3,
        },
        8,
        ["class"]
      )
    );
  }
  const GH = /* @__PURE__ */ Gt(HH, [["render", KH]]),
    qH = /* @__PURE__ */ me({
      components: {
        DialogDescription: PE,
      },
      props: {
        asChild: Boolean,
      },
      setup(e) {
        return {
          styles: fr("dialog", Mt(e), Ws),
        };
      },
    });
  function YH(e, t, r, s, n, o) {
    const i = Ye("dialog-description", !0);
    return (
      ue(),
      _e(
        i,
        {
          class: ot(e.styles.dialog.description),
          "as-child": e.asChild,
        },
        {
          default: ie(() => [de(e.$slots, "default")]),
          _: 3,
        },
        8,
        ["class", "as-child"]
      )
    );
  }
  const JH = /* @__PURE__ */ Gt(qH, [["render", YH]]),
    XH = /* @__PURE__ */ me({
      components: {
        DialogClose: AE,
        DialogContent: EE,
        DialogOverlay: SE,
        DialogPortal: sE,
        UpwIcon: c_,
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
        const t = fr("dialog", Mt(e), Ws);
        return {
          handlePointerDownOutside: s => {
            const n = s,
              o = n.detail.originalEvent.target;
            (n.detail.originalEvent.offsetX > o.clientWidth ||
              n.detail.originalEvent.offsetY > o.clientHeight) &&
              s.preventDefault();
          },
          styles: t,
        };
      },
    }),
    ZH = /* @__PURE__ */ ar("span", { class: "sr-only" }, "Close", -1);
  function QH(e, t, r, s, n, o) {
    const i = Ye("upw-icon"),
      a = Ye("dialog-close"),
      l = Ye("dialog-content"),
      c = Ye("dialog-overlay"),
      u = Ye("dialog-portal");
    return (
      ue(),
      _e(u, null, {
        default: ie(() => [
          Ve(
            c,
            {
              class: ot(e.styles.dialog.overlay),
            },
            {
              default: ie(() => [
                Ve(
                  l,
                  {
                    class: ot(e.styles.dialog.content),
                    onPointerDownOutside: e.handlePointerDownOutside,
                  },
                  {
                    default: ie(() => [
                      de(e.$slots, "default"),
                      Ve(
                        a,
                        {
                          class: ot(e.styles.dialog.close),
                        },
                        {
                          default: ie(() => [
                            Ve(
                              i,
                              {
                                icon: "close",
                                class: ot(e.styles.dialog.closeIcon),
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
          styles: fr("dialog", Mt(e), Ws),
        };
      },
    });
  function rK(e, t, r, s, n, o) {
    return (
      ue(),
      Sn(
        "div",
        {
          class: ot(e.styles.dialog.footer),
        },
        [de(e.$slots, "default")],
        2
      )
    );
  }
  const nK = /* @__PURE__ */ Gt(tK, [["render", rK]]),
    sK = /* @__PURE__ */ me({
      components: {
        DialogRoot: FH,
        DialogScrollContent: eK,
        DialogDescription: JH,
        DialogFooter: nK,
        DialogHeader: WH,
        DialogTitle: GH,
        DialogTrigger: kH,
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
        const t = fr("dialog", Mt(e), Ws, e.upwindConfig);
        return {
          props: e,
          styles: t,
        };
      },
    });
  function oK(e, t, r, s, n, o) {
    const i = Ye("dialog-trigger"),
      a = Ye("dialog-title"),
      l = Ye("dialog-description"),
      c = Ye("dialog-header"),
      u = Ye("dialog-footer"),
      f = Ye("dialog-scroll-content"),
      d = Ye("dialog-root");
    return (
      ue(),
      _e(d, null, {
        default: ie(() => [
          Ve(i, null, {
            default: ie(() => [de(e.$slots, "trigger")]),
            _: 3,
          }),
          Ve(
            f,
            {
              size: e.size,
              overflow: e.overflow,
            },
            {
              default: ie(() => [
                e.title || e.description
                  ? (ue(),
                    _e(
                      c,
                      { key: 0 },
                      {
                        default: ie(() => [
                          e.title
                            ? (ue(),
                              _e(
                                a,
                                { key: 0 },
                                {
                                  default: ie(() => [Ss(_n(e.title), 1)]),
                                  _: 1,
                                }
                              ))
                            : $r("", !0),
                          e.description
                            ? (ue(),
                              _e(
                                l,
                                { key: 1 },
                                {
                                  default: ie(() => [Ss(_n(e.description), 1)]),
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
                  ? (ue(),
                    _e(
                      u,
                      { key: 1 },
                      {
                        default: ie(() => [de(e.$slots, "footer")]),
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
  const iK = /* @__PURE__ */ Gt(sK, [["render", oK]]),
    aK = /* @__PURE__ */ ko(iK),
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
        const n = ru(e, t);
        return (o, i) => (
          ue(),
          _e(
            U(ZE),
            xs(es(U(n))),
            {
              default: ie(() => [de(o.$slots, "default")]),
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
          s = t,
          n = Se(() => {
            const { class: i, ...a } = r;
            return a;
          }),
          o = ru(n, s);
        return (i, a) => (
          ue(),
          _e(U(n1), null, {
            default: ie(() => [
              Ve(
                U(t1),
                gt(
                  { ...U(o), ...i.$attrs },
                  {
                    class: r.class,
                  }
                ),
                {
                  default: ie(() => [de(i.$slots, "default")]),
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
        return (r, s) => (
          ue(),
          _e(
            U(QE),
            xs(es(t)),
            {
              default: ie(() => [de(r.$slots, "default")]),
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
        return (r, s) => (
          ue(),
          _e(
            U(JE),
            xs(es(t)),
            {
              default: ie(() => [de(r.$slots, "default")]),
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
  function gK(e, t, r, s, n, o) {
    const i = Ye("tooltip-trigger"),
      a = Ye("tooltip-arrow"),
      l = Ye("tooltip-content"),
      c = Ye("tooltip"),
      u = Ye("tooltip-provider");
    return (
      ue(),
      _e(
        u,
        { "delay-duration": e.delayDuration },
        {
          default: ie(() => [
            Ve(
              c,
              { open: e.open },
              {
                default: ie(() => [
                  Ve(i, null, {
                    default: ie(() => [de(e.$slots, "default")]),
                    _: 3,
                  }),
                  Ve(
                    l,
                    {
                      side: e.direction,
                      sideOffset: e.sideOffset,
                      class: ot(e.styles.tooltip.content),
                    },
                    {
                      default: ie(() => [
                        de(e.$slots, "content", {}, () => [
                          ar("div", null, _n(e.label), 1),
                        ]),
                        Ve(
                          a,
                          {
                            fill: "currentColor",
                            class: ot(e.styles.tooltip.arrow),
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
    vK = /* @__PURE__ */ ko(mK);
  customElements.define("uw-avatar", NH);
  customElements.define("uw-badge", RH);
  customElements.define("uw-button", mH);
  customElements.define("uw-dialog", aK);
  customElements.define("uw-tooltip", vK);
});
export default yK();
