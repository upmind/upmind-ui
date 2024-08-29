(function(Uo){typeof define=="function"&&define.amd?define(Uo):Uo()})(function(){"use strict";var Uo={};/**
* @vue/shared v3.4.35
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**//*! #__NO_SIDE_EFFECTS__ */function co(e,t){const n=new Set(e.split(","));return o=>n.has(o)}const Ue=Uo.NODE_ENV!=="production"?Object.freeze({}):{},fo=Uo.NODE_ENV!=="production"?Object.freeze([]):[],st=()=>{},a6=()=>!1,Wo=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&(e.charCodeAt(2)>122||e.charCodeAt(2)<97),ni=e=>e.startsWith("onUpdate:"),lt=Object.assign,el=(e,t)=>{const n=e.indexOf(t);n>-1&&e.splice(n,1)},c6=Object.prototype.hasOwnProperty,ke=(e,t)=>c6.call(e,t),pe=Array.isArray,Or=e=>ri(e)==="[object Map]",Ec=e=>ri(e)==="[object Set]",ye=e=>typeof e=="function",tt=e=>typeof e=="string",tr=e=>typeof e=="symbol",Ve=e=>e!==null&&typeof e=="object",tl=e=>(Ve(e)||ye(e))&&ye(e.then)&&ye(e.catch),Pc=Object.prototype.toString,ri=e=>Pc.call(e),nl=e=>ri(e).slice(8,-1),Cc=e=>ri(e)==="[object Object]",rl=e=>tt(e)&&e!=="NaN"&&e[0]!=="-"&&""+parseInt(e,10)===e,Go=co(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),f6=co("bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo"),oi=e=>{const t=Object.create(null);return n=>t[n]||(t[n]=e(n))},u6=/-(\w)/g,xt=oi(e=>e.replace(u6,(t,n)=>n?n.toUpperCase():"")),d6=/\B([A-Z])/g,Nt=oi(e=>e.replace(d6,"-$1").toLowerCase()),Sr=oi(e=>e.charAt(0).toUpperCase()+e.slice(1)),Pn=oi(e=>e?`on${Sr(e)}`:""),nr=(e,t)=>!Object.is(e,t),Ko=(e,...t)=>{for(let n=0;n<e.length;n++)e[n](...t)},ii=(e,t,n,o=!1)=>{Object.defineProperty(e,t,{configurable:!0,enumerable:!1,writable:o,value:n})},h6=e=>{const t=parseFloat(e);return isNaN(t)?e:t},Mc=e=>{const t=tt(e)?Number(e):NaN;return isNaN(t)?e:t};let Dc;const ol=()=>Dc||(Dc=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{});function Er(e){if(pe(e)){const t={};for(let n=0;n<e.length;n++){const o=e[n],r=tt(o)?m6(o):Er(o);if(r)for(const i in r)t[i]=r[i]}return t}else if(tt(e)||Ve(e))return e}const p6=/;(?![^(]*\))/g,g6=/:([^]+)/,v6=/\/\*[^]*?\*\//g;function m6(e){const t={};return e.replace(v6,"").split(p6).forEach(n=>{if(n){const o=n.split(g6);o.length>1&&(t[o[0].trim()]=o[1].trim())}}),t}function it(e){let t="";if(tt(e))t=e;else if(pe(e))for(let n=0;n<e.length;n++){const o=it(e[n]);o&&(t+=o+" ")}else if(Ve(e))for(const n in e)e[n]&&(t+=n+" ");return t.trim()}function uo(e){if(!e)return null;let{class:t,style:n}=e;return t&&!tt(t)&&(e.class=it(t)),n&&(e.style=Er(n)),e}const y6=co("itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly");function Ac(e){return!!e||e===""}const Tc=e=>!!(e&&e.__v_isRef===!0),rr=e=>tt(e)?e:e==null?"":pe(e)||Ve(e)&&(e.toString===Pc||!ye(e.toString))?Tc(e)?rr(e.value):JSON.stringify(e,jc,2):String(e),jc=(e,t)=>Tc(t)?jc(e,t.value):Or(t)?{[`Map(${t.size})`]:[...t.entries()].reduce((n,[o,r],i)=>(n[il(o,i)+" =>"]=r,n),{})}:Ec(t)?{[`Set(${t.size})`]:[...t.values()].map(n=>il(n))}:tr(t)?il(t):Ve(t)&&!pe(t)&&!Cc(t)?String(t):t,il=(e,t="")=>{var n;return tr(e)?`Symbol(${(n=e.description)!=null?n:t})`:e};var at={};function pn(e,...t){console.warn(`[Vue warn] ${e}`,...t)}let Ht;class zc{constructor(t=!1){this.detached=t,this._active=!0,this.effects=[],this.cleanups=[],this.parent=Ht,!t&&Ht&&(this.index=(Ht.scopes||(Ht.scopes=[])).push(this)-1)}get active(){return this._active}run(t){if(this._active){const n=Ht;try{return Ht=this,t()}finally{Ht=n}}else at.NODE_ENV!=="production"&&pn("cannot run an inactive effect scope.")}on(){Ht=this}off(){Ht=this.parent}stop(t){if(this._active){let n,o;for(n=0,o=this.effects.length;n<o;n++)this.effects[n].stop();for(n=0,o=this.cleanups.length;n<o;n++)this.cleanups[n]();if(this.scopes)for(n=0,o=this.scopes.length;n<o;n++)this.scopes[n].stop(!0);if(!this.detached&&this.parent&&!t){const r=this.parent.scopes.pop();r&&r!==this&&(this.parent.scopes[this.index]=r,r.index=this.index)}this.parent=void 0,this._active=!1}}}function Nc(e){return new zc(e)}function w6(e,t=Ht){t&&t.active&&t.effects.push(e)}function sl(){return Ht}function kc(e){Ht?Ht.cleanups.push(e):at.NODE_ENV!=="production"&&pn("onScopeDispose() is called when there is no active effect scope to be associated with.")}let Pr;class ll{constructor(t,n,o,r){this.fn=t,this.trigger=n,this.scheduler=o,this.active=!0,this.deps=[],this._dirtyLevel=4,this._trackId=0,this._runnings=0,this._shouldSchedule=!1,this._depsLength=0,w6(this,r)}get dirty(){if(this._dirtyLevel===2||this._dirtyLevel===3){this._dirtyLevel=1,Cn();for(let t=0;t<this._depsLength;t++){const n=this.deps[t];if(n.computed&&(_6(n.computed),this._dirtyLevel>=4))break}this._dirtyLevel===1&&(this._dirtyLevel=0),Mn()}return this._dirtyLevel>=4}set dirty(t){this._dirtyLevel=t?4:0}run(){if(this._dirtyLevel=0,!this.active)return this.fn();let t=or,n=Pr;try{return or=!0,Pr=this,this._runnings++,Ic(this),this.fn()}finally{Bc(this),this._runnings--,Pr=n,or=t}}stop(){this.active&&(Ic(this),Bc(this),this.onStop&&this.onStop(),this.active=!1)}}function _6(e){return e.value}function Ic(e){e._trackId++,e._depsLength=0}function Bc(e){if(e.deps.length>e._depsLength){for(let t=e._depsLength;t<e.deps.length;t++)Lc(e.deps[t],e);e.deps.length=e._depsLength}}function Lc(e,t){const n=e.get(t);n!==void 0&&t._trackId!==n&&(e.delete(t),e.size===0&&e.cleanup())}let or=!0,al=0;const Rc=[];function Cn(){Rc.push(or),or=!1}function Mn(){const e=Rc.pop();or=e===void 0?!0:e}function cl(){al++}function fl(){for(al--;!al&&ul.length;)ul.shift()()}function Vc(e,t,n){var o;if(t.get(e)!==e._trackId){t.set(e,e._trackId);const r=e.deps[e._depsLength];r!==t?(r&&Lc(r,e),e.deps[e._depsLength++]=t):e._depsLength++,at.NODE_ENV!=="production"&&((o=e.onTrack)==null||o.call(e,lt({effect:e},n)))}}const ul=[];function Hc(e,t,n){var o;cl();for(const r of e.keys()){let i;r._dirtyLevel<t&&(i??(i=e.get(r)===r._trackId))&&(r._shouldSchedule||(r._shouldSchedule=r._dirtyLevel===0),r._dirtyLevel=t),r._shouldSchedule&&(i??(i=e.get(r)===r._trackId))&&(at.NODE_ENV!=="production"&&((o=r.onTrigger)==null||o.call(r,lt({effect:r},n))),r.trigger(),(!r._runnings||r.allowRecurse)&&r._dirtyLevel!==2&&(r._shouldSchedule=!1,r.scheduler&&ul.push(r.scheduler)))}fl()}const Uc=(e,t)=>{const n=new Map;return n.cleanup=e,n.computed=t,n},si=new WeakMap,Cr=Symbol(at.NODE_ENV!=="production"?"iterate":""),dl=Symbol(at.NODE_ENV!=="production"?"Map key iterate":"");function bt(e,t,n){if(or&&Pr){let o=si.get(e);o||si.set(e,o=new Map);let r=o.get(n);r||o.set(n,r=Uc(()=>o.delete(n))),Vc(Pr,r,at.NODE_ENV!=="production"?{target:e,type:t,key:n}:void 0)}}function gn(e,t,n,o,r,i){const s=si.get(e);if(!s)return;let l=[];if(t==="clear")l=[...s.values()];else if(n==="length"&&pe(e)){const a=Number(o);s.forEach((c,f)=>{(f==="length"||!tr(f)&&f>=a)&&l.push(c)})}else switch(n!==void 0&&l.push(s.get(n)),t){case"add":pe(e)?rl(n)&&l.push(s.get("length")):(l.push(s.get(Cr)),Or(e)&&l.push(s.get(dl)));break;case"delete":pe(e)||(l.push(s.get(Cr)),Or(e)&&l.push(s.get(dl)));break;case"set":Or(e)&&l.push(s.get(Cr));break}cl();for(const a of l)a&&Hc(a,4,at.NODE_ENV!=="production"?{target:e,type:t,key:n,newValue:o,oldValue:r,oldTarget:i}:void 0);fl()}function b6(e,t){const n=si.get(e);return n&&n.get(t)}const F6=co("__proto__,__v_isRef,__isVue"),Wc=new Set(Object.getOwnPropertyNames(Symbol).filter(e=>e!=="arguments"&&e!=="caller").map(e=>Symbol[e]).filter(tr)),Gc=$6();function $6(){const e={};return["includes","indexOf","lastIndexOf"].forEach(t=>{e[t]=function(...n){const o=Pe(this);for(let i=0,s=this.length;i<s;i++)bt(o,"get",i+"");const r=o[t](...n);return r===-1||r===!1?o[t](...n.map(Pe)):r}}),["push","pop","shift","unshift","splice"].forEach(t=>{e[t]=function(...n){Cn(),cl();const o=Pe(this)[t].apply(this,n);return fl(),Mn(),o}}),e}function x6(e){tr(e)||(e=String(e));const t=Pe(this);return bt(t,"has",e),t.hasOwnProperty(e)}class Kc{constructor(t=!1,n=!1){this._isReadonly=t,this._isShallow=n}get(t,n,o){const r=this._isReadonly,i=this._isShallow;if(n==="__v_isReactive")return!r;if(n==="__v_isReadonly")return r;if(n==="__v_isShallow")return i;if(n==="__v_raw")return o===(r?i?o3:r3:i?n3:t3).get(t)||Object.getPrototypeOf(t)===Object.getPrototypeOf(o)?t:void 0;const s=pe(t);if(!r){if(s&&ke(Gc,n))return Reflect.get(Gc,n,o);if(n==="hasOwnProperty")return x6}const l=Reflect.get(t,n,o);return(tr(n)?Wc.has(n):F6(n))||(r||bt(t,"get",n),i)?l:vt(l)?s&&rl(n)?l:l.value:Ve(l)?r?pi(l):qo(l):l}}class qc extends Kc{constructor(t=!1){super(!1,t)}set(t,n,o,r){let i=t[n];if(!this._isShallow){const a=Dn(i);if(!An(o)&&!Dn(o)&&(i=Pe(i),o=Pe(o)),!pe(t)&&vt(i)&&!vt(o))return a?!1:(i.value=o,!0)}const s=pe(t)&&rl(n)?Number(n)<t.length:ke(t,n),l=Reflect.set(t,n,o,r);return t===Pe(r)&&(s?nr(o,i)&&gn(t,"set",n,o,i):gn(t,"add",n,o)),l}deleteProperty(t,n){const o=ke(t,n),r=t[n],i=Reflect.deleteProperty(t,n);return i&&o&&gn(t,"delete",n,void 0,r),i}has(t,n){const o=Reflect.has(t,n);return(!tr(n)||!Wc.has(n))&&bt(t,"has",n),o}ownKeys(t){return bt(t,"iterate",pe(t)?"length":Cr),Reflect.ownKeys(t)}}class Yc extends Kc{constructor(t=!1){super(!0,t)}set(t,n){return at.NODE_ENV!=="production"&&pn(`Set operation on key "${String(n)}" failed: target is readonly.`,t),!0}deleteProperty(t,n){return at.NODE_ENV!=="production"&&pn(`Delete operation on key "${String(n)}" failed: target is readonly.`,t),!0}}const O6=new qc,S6=new Yc,E6=new qc(!0),P6=new Yc(!0),hl=e=>e,li=e=>Reflect.getPrototypeOf(e);function ai(e,t,n=!1,o=!1){e=e.__v_raw;const r=Pe(e),i=Pe(t);n||(nr(t,i)&&bt(r,"get",t),bt(r,"get",i));const{has:s}=li(r),l=o?hl:n?pl:Yo;if(s.call(r,t))return l(e.get(t));if(s.call(r,i))return l(e.get(i));e!==r&&e.get(t)}function ci(e,t=!1){const n=this.__v_raw,o=Pe(n),r=Pe(e);return t||(nr(e,r)&&bt(o,"has",e),bt(o,"has",r)),e===r?n.has(e):n.has(e)||n.has(r)}function fi(e,t=!1){return e=e.__v_raw,!t&&bt(Pe(e),"iterate",Cr),Reflect.get(e,"size",e)}function Zc(e,t=!1){!t&&!An(e)&&!Dn(e)&&(e=Pe(e));const n=Pe(this);return li(n).has.call(n,e)||(n.add(e),gn(n,"add",e,e)),this}function Jc(e,t,n=!1){!n&&!An(t)&&!Dn(t)&&(t=Pe(t));const o=Pe(this),{has:r,get:i}=li(o);let s=r.call(o,e);s?at.NODE_ENV!=="production"&&e3(o,r,e):(e=Pe(e),s=r.call(o,e));const l=i.call(o,e);return o.set(e,t),s?nr(t,l)&&gn(o,"set",e,t,l):gn(o,"add",e,t),this}function Xc(e){const t=Pe(this),{has:n,get:o}=li(t);let r=n.call(t,e);r?at.NODE_ENV!=="production"&&e3(t,n,e):(e=Pe(e),r=n.call(t,e));const i=o?o.call(t,e):void 0,s=t.delete(e);return r&&gn(t,"delete",e,void 0,i),s}function Qc(){const e=Pe(this),t=e.size!==0,n=at.NODE_ENV!=="production"?Or(e)?new Map(e):new Set(e):void 0,o=e.clear();return t&&gn(e,"clear",void 0,void 0,n),o}function ui(e,t){return function(o,r){const i=this,s=i.__v_raw,l=Pe(s),a=t?hl:e?pl:Yo;return!e&&bt(l,"iterate",Cr),s.forEach((c,f)=>o.call(r,a(c),a(f),i))}}function di(e,t,n){return function(...o){const r=this.__v_raw,i=Pe(r),s=Or(i),l=e==="entries"||e===Symbol.iterator&&s,a=e==="keys"&&s,c=r[e](...o),f=n?hl:t?pl:Yo;return!t&&bt(i,"iterate",a?dl:Cr),{next(){const{value:u,done:d}=c.next();return d?{value:u,done:d}:{value:l?[f(u[0]),f(u[1])]:f(u),done:d}},[Symbol.iterator](){return this}}}}function ir(e){return function(...t){if(at.NODE_ENV!=="production"){const n=t[0]?`on key "${t[0]}" `:"";pn(`${Sr(e)} operation ${n}failed: target is readonly.`,Pe(this))}return e==="delete"?!1:e==="clear"?void 0:this}}function C6(){const e={get(i){return ai(this,i)},get size(){return fi(this)},has:ci,add:Zc,set:Jc,delete:Xc,clear:Qc,forEach:ui(!1,!1)},t={get(i){return ai(this,i,!1,!0)},get size(){return fi(this)},has:ci,add(i){return Zc.call(this,i,!0)},set(i,s){return Jc.call(this,i,s,!0)},delete:Xc,clear:Qc,forEach:ui(!1,!0)},n={get(i){return ai(this,i,!0)},get size(){return fi(this,!0)},has(i){return ci.call(this,i,!0)},add:ir("add"),set:ir("set"),delete:ir("delete"),clear:ir("clear"),forEach:ui(!0,!1)},o={get(i){return ai(this,i,!0,!0)},get size(){return fi(this,!0)},has(i){return ci.call(this,i,!0)},add:ir("add"),set:ir("set"),delete:ir("delete"),clear:ir("clear"),forEach:ui(!0,!0)};return["keys","values","entries",Symbol.iterator].forEach(i=>{e[i]=di(i,!1,!1),n[i]=di(i,!0,!1),t[i]=di(i,!1,!0),o[i]=di(i,!0,!0)}),[e,n,t,o]}const[M6,D6,A6,T6]=C6();function hi(e,t){const n=t?e?T6:A6:e?D6:M6;return(o,r,i)=>r==="__v_isReactive"?!e:r==="__v_isReadonly"?e:r==="__v_raw"?o:Reflect.get(ke(n,r)&&r in o?n:o,r,i)}const j6={get:hi(!1,!1)},z6={get:hi(!1,!0)},N6={get:hi(!0,!1)},k6={get:hi(!0,!0)};function e3(e,t,n){const o=Pe(n);if(o!==n&&t.call(e,o)){const r=nl(e);pn(`Reactive ${r} contains both the raw and reactive versions of the same object${r==="Map"?" as keys":""}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`)}}const t3=new WeakMap,n3=new WeakMap,r3=new WeakMap,o3=new WeakMap;function I6(e){switch(e){case"Object":case"Array":return 1;case"Map":case"Set":case"WeakMap":case"WeakSet":return 2;default:return 0}}function B6(e){return e.__v_skip||!Object.isExtensible(e)?0:I6(nl(e))}function qo(e){return Dn(e)?e:gi(e,!1,O6,j6,t3)}function L6(e){return gi(e,!1,E6,z6,n3)}function pi(e){return gi(e,!0,S6,N6,r3)}function Ot(e){return gi(e,!0,P6,k6,o3)}function gi(e,t,n,o,r){if(!Ve(e))return at.NODE_ENV!=="production"&&pn(`value cannot be made ${t?"readonly":"reactive"}: ${String(e)}`),e;if(e.__v_raw&&!(t&&e.__v_isReactive))return e;const i=r.get(e);if(i)return i;const s=B6(e);if(s===0)return e;const l=new Proxy(e,s===2?o:n);return r.set(e,l),l}function ho(e){return Dn(e)?ho(e.__v_raw):!!(e&&e.__v_isReactive)}function Dn(e){return!!(e&&e.__v_isReadonly)}function An(e){return!!(e&&e.__v_isShallow)}function vi(e){return e?!!e.__v_raw:!1}function Pe(e){const t=e&&e.__v_raw;return t?Pe(t):e}function R6(e){return Object.isExtensible(e)&&ii(e,"__v_skip",!0),e}const Yo=e=>Ve(e)?qo(e):e,pl=e=>Ve(e)?pi(e):e,V6="Computed is still dirty after getter evaluation, likely because a computed is mutating its own dependency in its getter. State mutations in computed getters should be avoided.  Check the docs for more details: https://vuejs.org/guide/essentials/computed.html#getters-should-be-side-effect-free";class i3{constructor(t,n,o,r){this.getter=t,this._setter=n,this.dep=void 0,this.__v_isRef=!0,this.__v_isReadonly=!1,this.effect=new ll(()=>t(this._value),()=>Zo(this,this.effect._dirtyLevel===2?2:3)),this.effect.computed=this,this.effect.active=this._cacheable=!r,this.__v_isReadonly=o}get value(){const t=Pe(this);return(!t._cacheable||t.effect.dirty)&&nr(t._value,t._value=t.effect.run())&&Zo(t,4),gl(t),t.effect._dirtyLevel>=2&&(at.NODE_ENV!=="production"&&this._warnRecursive&&pn(V6,`

getter: `,this.getter),Zo(t,2)),t._value}set value(t){this._setter(t)}get _dirty(){return this.effect.dirty}set _dirty(t){this.effect.dirty=t}}function H6(e,t,n=!1){let o,r;const i=ye(e);i?(o=e,r=at.NODE_ENV!=="production"?()=>{pn("Write operation failed: computed value is readonly")}:st):(o=e.get,r=e.set);const s=new i3(o,r,i||!r,n);return at.NODE_ENV!=="production"&&t&&!n&&(s.effect.onTrack=t.onTrack,s.effect.onTrigger=t.onTrigger),s}function gl(e){var t;or&&Pr&&(e=Pe(e),Vc(Pr,(t=e.dep)!=null?t:e.dep=Uc(()=>e.dep=void 0,e instanceof i3?e:void 0),at.NODE_ENV!=="production"?{target:e,type:"get",key:"value"}:void 0))}function Zo(e,t=4,n,o){e=Pe(e);const r=e.dep;r&&Hc(r,t,at.NODE_ENV!=="production"?{target:e,type:"set",key:"value",newValue:n,oldValue:o}:void 0)}function vt(e){return!!(e&&e.__v_isRef===!0)}function $e(e){return l3(e,!1)}function s3(e){return l3(e,!0)}function l3(e,t){return vt(e)?e:new U6(e,t)}class U6{constructor(t,n){this.__v_isShallow=n,this.dep=void 0,this.__v_isRef=!0,this._rawValue=n?t:Pe(t),this._value=n?t:Yo(t)}get value(){return gl(this),this._value}set value(t){const n=this.__v_isShallow||An(t)||Dn(t);if(t=n?t:Pe(t),nr(t,this._rawValue)){const o=this._rawValue;this._rawValue=t,this._value=n?t:Yo(t),Zo(this,4,t,o)}}}function H(e){return vt(e)?e.value:e}const W6={get:(e,t,n)=>H(Reflect.get(e,t,n)),set:(e,t,n,o)=>{const r=e[t];return vt(r)&&!vt(n)?(r.value=n,!0):Reflect.set(e,t,n,o)}};function a3(e){return ho(e)?e:new Proxy(e,W6)}class G6{constructor(t){this.dep=void 0,this.__v_isRef=!0;const{get:n,set:o}=t(()=>gl(this),()=>Zo(this));this._get=n,this._set=o}get value(){return this._get()}set value(t){this._set(t)}}function K6(e){return new G6(e)}function At(e){at.NODE_ENV!=="production"&&!vi(e)&&pn("toRefs() expects a reactive object but received a plain one.");const t=pe(e)?new Array(e.length):{};for(const n in e)t[n]=c3(e,n);return t}class q6{constructor(t,n,o){this._object=t,this._key=n,this._defaultValue=o,this.__v_isRef=!0}get value(){const t=this._object[this._key];return t===void 0?this._defaultValue:t}set value(t){this._object[this._key]=t}get dep(){return b6(Pe(this._object),this._key)}}class Y6{constructor(t){this._getter=t,this.__v_isRef=!0,this.__v_isReadonly=!0}get value(){return this._getter()}}function Z6(e,t,n){return vt(e)?e:ye(e)?new Y6(e):Ve(e)&&arguments.length>1?c3(e,t,n):$e(e)}function c3(e,t,n){const o=e[t];return vt(o)?o:new q6(e,t,n)}var A={};const Mr=[];function mi(e){Mr.push(e)}function yi(){Mr.pop()}let vl=!1;function X(e,...t){if(vl)return;vl=!0,Cn();const n=Mr.length?Mr[Mr.length-1].component:null,o=n&&n.appContext.config.warnHandler,r=J6();if(o)Tn(o,n,11,[e+t.map(i=>{var s,l;return(l=(s=i.toString)==null?void 0:s.call(i))!=null?l:JSON.stringify(i)}).join(""),n&&n.proxy,r.map(({vnode:i})=>`at <${zi(n,i.type)}>`).join(`
`),r]);else{const i=[`[Vue warn]: ${e}`,...t];r.length&&i.push(`
`,...X6(r)),console.warn(...i)}Mn(),vl=!1}function J6(){let e=Mr[Mr.length-1];if(!e)return[];const t=[];for(;e;){const n=t[0];n&&n.vnode===e?n.recurseCount++:t.push({vnode:e,recurseCount:0});const o=e.component&&e.component.parent;e=o&&o.vnode}return t}function X6(e){const t=[];return e.forEach((n,o)=>{t.push(...o===0?[]:[`
`],...Q6(n))}),t}function Q6({vnode:e,recurseCount:t}){const n=t>0?`... (${t} recursive calls)`:"",o=e.component?e.component.parent==null:!1,r=` at <${zi(e.component,e.type,o)}`,i=">"+n;return e.props?[r,...eh(e.props),i]:[r+i]}function eh(e){const t=[],n=Object.keys(e);return n.slice(0,3).forEach(o=>{t.push(...f3(o,e[o]))}),n.length>3&&t.push(" ..."),t}function f3(e,t,n){return tt(t)?(t=JSON.stringify(t),n?t:[`${e}=${t}`]):typeof t=="number"||typeof t=="boolean"||t==null?n?t:[`${e}=${t}`]:vt(t)?(t=f3(e,Pe(t.value),!0),n?t:[`${e}=Ref<`,t,">"]):ye(t)?[`${e}=fn${t.name?`<${t.name}>`:""}`]:(t=Pe(t),n?t:[`${e}=`,t])}const ml={sp:"serverPrefetch hook",bc:"beforeCreate hook",c:"created hook",bm:"beforeMount hook",m:"mounted hook",bu:"beforeUpdate hook",u:"updated",bum:"beforeUnmount hook",um:"unmounted hook",a:"activated hook",da:"deactivated hook",ec:"errorCaptured hook",rtc:"renderTracked hook",rtg:"renderTriggered hook",0:"setup function",1:"render function",2:"watcher getter",3:"watcher callback",4:"watcher cleanup function",5:"native event handler",6:"component event handler",7:"vnode hook",8:"directive hook",9:"transition hook",10:"app errorHandler",11:"app warnHandler",12:"ref function",13:"async component loader",14:"scheduler flush",15:"component update"};function Tn(e,t,n,o){try{return o?e(...o):e()}catch(r){Jo(r,t,n)}}function nn(e,t,n,o){if(ye(e)){const r=Tn(e,t,n,o);return r&&tl(r)&&r.catch(i=>{Jo(i,t,n)}),r}if(pe(e)){const r=[];for(let i=0;i<e.length;i++)r.push(nn(e[i],t,n,o));return r}else A.NODE_ENV!=="production"&&X(`Invalid value type passed to callWithAsyncErrorHandling(): ${typeof e}`)}function Jo(e,t,n,o=!0){const r=t?t.vnode:null;if(t){let i=t.parent;const s=t.proxy,l=A.NODE_ENV!=="production"?ml[n]:`https://vuejs.org/error-reference/#runtime-${n}`;for(;i;){const c=i.ec;if(c){for(let f=0;f<c.length;f++)if(c[f](e,s,l)===!1)return}i=i.parent}const a=t.appContext.config.errorHandler;if(a){Cn(),Tn(a,null,10,[e,s,l]),Mn();return}}th(e,n,r,o)}function th(e,t,n,o=!0){if(A.NODE_ENV!=="production"){const r=ml[t];if(n&&mi(n),X(`Unhandled error${r?` during execution of ${r}`:""}`),n&&yi(),o)throw e;console.error(e)}else console.error(e)}let Xo=!1,yl=!1;const St=[];let vn=0;const po=[];let sr=null,Dr=0;const u3=Promise.resolve();let wl=null;const nh=100;function lr(e){const t=wl||u3;return e?t.then(this?e.bind(this):e):t}function rh(e){let t=vn+1,n=St.length;for(;t<n;){const o=t+n>>>1,r=St[o],i=Qo(r);i<e||i===e&&r.pre?t=o+1:n=o}return t}function wi(e){(!St.length||!St.includes(e,Xo&&e.allowRecurse?vn+1:vn))&&(e.id==null?St.push(e):St.splice(rh(e.id),0,e),d3())}function d3(){!Xo&&!yl&&(yl=!0,wl=u3.then(v3))}function oh(e){const t=St.indexOf(e);t>vn&&St.splice(t,1)}function h3(e){pe(e)?po.push(...e):(!sr||!sr.includes(e,e.allowRecurse?Dr+1:Dr))&&po.push(e),d3()}function p3(e,t,n=Xo?vn+1:0){for(A.NODE_ENV!=="production"&&(t=t||new Map);n<St.length;n++){const o=St[n];if(o&&o.pre){if(e&&o.id!==e.uid||A.NODE_ENV!=="production"&&_l(t,o))continue;St.splice(n,1),n--,o()}}}function g3(e){if(po.length){const t=[...new Set(po)].sort((n,o)=>Qo(n)-Qo(o));if(po.length=0,sr){sr.push(...t);return}for(sr=t,A.NODE_ENV!=="production"&&(e=e||new Map),Dr=0;Dr<sr.length;Dr++){const n=sr[Dr];A.NODE_ENV!=="production"&&_l(e,n)||n.active!==!1&&n()}sr=null,Dr=0}}const Qo=e=>e.id==null?1/0:e.id,ih=(e,t)=>{const n=Qo(e)-Qo(t);if(n===0){if(e.pre&&!t.pre)return-1;if(t.pre&&!e.pre)return 1}return n};function v3(e){yl=!1,Xo=!0,A.NODE_ENV!=="production"&&(e=e||new Map),St.sort(ih);const t=A.NODE_ENV!=="production"?n=>_l(e,n):st;try{for(vn=0;vn<St.length;vn++){const n=St[vn];if(n&&n.active!==!1){if(A.NODE_ENV!=="production"&&t(n))continue;Tn(n,n.i,n.i?15:14)}}}finally{vn=0,St.length=0,g3(e),Xo=!1,wl=null,(St.length||po.length)&&v3(e)}}function _l(e,t){if(!e.has(t))e.set(t,1);else{const n=e.get(t);if(n>nh){const o=t.i,r=o&&Gl(o.type);return Jo(`Maximum recursive updates exceeded${r?` in component <${r}>`:""}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`,null,10),!0}else e.set(t,n+1)}}let ar=!1;const _i=new Map;A.NODE_ENV!=="production"&&(ol().__VUE_HMR_RUNTIME__={createRecord:bl(m3),rerender:bl(ah),reload:bl(ch)});const Ar=new Map;function sh(e){const t=e.type.__hmrId;let n=Ar.get(t);n||(m3(t,e.type),n=Ar.get(t)),n.instances.add(e)}function lh(e){Ar.get(e.type.__hmrId).instances.delete(e)}function m3(e,t){return Ar.has(e)?!1:(Ar.set(e,{initialDef:bi(t),instances:new Set}),!0)}function bi(e){return _0(e)?e.__vccOpts:e}function ah(e,t){const n=Ar.get(e);n&&(n.initialDef.render=t,[...n.instances].forEach(o=>{t&&(o.render=t,bi(o.type).render=t),o.renderCache=[],ar=!0,o.effect.dirty=!0,o.update(),ar=!1}))}function ch(e,t){const n=Ar.get(e);if(!n)return;t=bi(t),y3(n.initialDef,t);const o=[...n.instances];for(let r=0;r<o.length;r++){const i=o[r],s=bi(i.type);let l=_i.get(s);l||(s!==n.initialDef&&y3(s,t),_i.set(s,l=new Set)),l.add(i),i.appContext.propsCache.delete(i.type),i.appContext.emitsCache.delete(i.type),i.appContext.optionsCache.delete(i.type),i.ceReload?(l.add(i),i.ceReload(t.styles),l.delete(i)):i.parent?(i.parent.effect.dirty=!0,wi(()=>{i.parent.update(),l.delete(i)})):i.appContext.reload?i.appContext.reload():typeof window<"u"?window.location.reload():console.warn("[HMR] Root or manually mounted instance modified. Full reload required.")}h3(()=>{_i.clear()})}function y3(e,t){lt(e,t);for(const n in e)n!=="__file"&&!(n in t)&&delete e[n]}function bl(e){return(t,n)=>{try{return e(t,n)}catch(o){console.error(o),console.warn("[HMR] Something went wrong during Vue component hot-reload. Full reload required.")}}}let mn,e1=[],Fl=!1;function t1(e,...t){mn?mn.emit(e,...t):Fl||e1.push({event:e,args:t})}function w3(e,t){var n,o;mn=e,mn?(mn.enabled=!0,e1.forEach(({event:r,args:i})=>mn.emit(r,...i)),e1=[]):typeof window<"u"&&window.HTMLElement&&!((o=(n=window.navigator)==null?void 0:n.userAgent)!=null&&o.includes("jsdom"))?((t.__VUE_DEVTOOLS_HOOK_REPLAY__=t.__VUE_DEVTOOLS_HOOK_REPLAY__||[]).push(i=>{w3(i,t)}),setTimeout(()=>{mn||(t.__VUE_DEVTOOLS_HOOK_REPLAY__=null,Fl=!0,e1=[])},3e3)):(Fl=!0,e1=[])}function fh(e,t){t1("app:init",e,t,{Fragment:Et,Text:c1,Comment:jt,Static:Mi})}function uh(e){t1("app:unmount",e)}const dh=$l("component:added"),_3=$l("component:updated"),hh=$l("component:removed"),ph=e=>{mn&&typeof mn.cleanupBuffer=="function"&&!mn.cleanupBuffer(e)&&hh(e)};/*! #__NO_SIDE_EFFECTS__ */function $l(e){return t=>{t1(e,t.appContext.app,t.uid,t.parent?t.parent.uid:void 0,t)}}const gh=b3("perf:start"),vh=b3("perf:end");function b3(e){return(t,n,o)=>{t1(e,t.appContext.app,t.uid,t,n,o)}}function mh(e,t,n){t1("component:emit",e.appContext.app,e,t,n)}let ht=null,F3=null;function Fi(e){const t=ht;return ht=e,F3=e&&e.type.__scopeId||null,t}function se(e,t=ht,n){if(!t||e._n)return e;const o=(...r)=>{o._d&&c0(-1);const i=Fi(t);let s;try{s=e(...r)}finally{Fi(i),o._d&&c0(1)}return A.NODE_ENV!=="production"&&_3(t),s};return o._n=!0,o._c=!0,o._d=!0,o}function $3(e){f6(e)&&X("Do not use built-in directive ids as custom directive id: "+e)}function yh(e,t){if(ht===null)return A.NODE_ENV!=="production"&&X("withDirectives can only be used inside render functions."),e;const n=ji(ht),o=e.dirs||(e.dirs=[]);for(let r=0;r<t.length;r++){let[i,s,l,a=Ue]=t[r];i&&(ye(i)&&(i={mounted:i,updated:i}),i.deep&&fr(s),o.push({dir:i,instance:n,value:s,oldValue:void 0,arg:l,modifiers:a}))}return e}function Tr(e,t,n,o){const r=e.dirs,i=t&&t.dirs;for(let s=0;s<r.length;s++){const l=r[s];i&&(l.oldValue=i[s].value);let a=l.dir[o];a&&(Cn(),nn(a,n,8,[e.el,l,e,t]),Mn())}}function x3(e,t){e.shapeFlag&6&&e.component?x3(e.component.subTree,t):e.shapeFlag&128?(e.ssContent.transition=t.clone(e.ssContent),e.ssFallback.transition=t.clone(e.ssFallback)):e.transition=t}/*! #__NO_SIDE_EFFECTS__ */function ve(e,t){return ye(e)?lt({name:e.name},t,{setup:e}):e}const n1=e=>!!e.type.__asyncLoader,xl=e=>e.type.__isKeepAlive;function wh(e,t){O3(e,"a",t)}function _h(e,t){O3(e,"da",t)}function O3(e,t,n=yt){const o=e.__wdc||(e.__wdc=()=>{let r=n;for(;r;){if(r.isDeactivated)return;r=r.parent}return e()});if($i(t,o,n),n){let r=n.parent;for(;r&&r.parent;)xl(r.parent.vnode)&&bh(o,t,n,r),r=r.parent}}function bh(e,t,n,o){const r=$i(t,e,o,!0);r1(()=>{el(o[t],r)},n)}function $i(e,t,n=yt,o=!1){if(n){const r=n[e]||(n[e]=[]),i=t.__weh||(t.__weh=(...s)=>{Cn();const l=h1(n),a=nn(t,n,e,s);return l(),Mn(),a});return o?r.unshift(i):r.push(i),i}else if(A.NODE_ENV!=="production"){const r=Pn(ml[e].replace(/ hook$/,""));X(`${r} is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.`)}}const jn=e=>(t,n=yt)=>{(!Ti||e==="sp")&&$i(e,(...o)=>t(...o),n)},Fh=jn("bm"),zn=jn("m"),$h=jn("bu"),xh=jn("u"),S3=jn("bum"),r1=jn("um"),Oh=jn("sp"),Sh=jn("rtg"),Eh=jn("rtc");function Ph(e,t=yt){$i("ec",e,t)}const E3="components";function Ge(e,t){return C3(E3,e,!0,t)||e}const P3=Symbol.for("v-ndc");function Ch(e){return tt(e)?C3(E3,e,!1)||e:e||P3}function C3(e,t,n=!0,o=!1){const r=ht||yt;if(r){const i=r.type;{const l=Gl(i,!1);if(l&&(l===t||l===xt(t)||l===Sr(xt(t))))return i}const s=M3(r[e]||i[e],t)||M3(r.appContext[e],t);return!s&&o?i:(A.NODE_ENV!=="production"&&n&&!s&&X(`Failed to resolve ${e.slice(0,-1)}: ${t}
If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement.`),s)}else A.NODE_ENV!=="production"&&X(`resolve${Sr(e.slice(0,-1))} can only be used in render() or setup().`)}function M3(e,t){return e&&(e[t]||e[xt(t)]||e[Sr(xt(t))])}function ue(e,t,n={},o,r){if(ht.isCE||ht.parent&&n1(ht.parent)&&ht.parent.isCE)return t!=="default"&&(n.name=t),Be("slot",n,o&&o());let i=e[t];A.NODE_ENV!=="production"&&i&&i.length>1&&(X("SSR-optimized slot function detected in a non-SSR-optimized render function. You need to mark this component with $dynamic-slots in the parent template."),i=()=>[]),i&&i._c&&(i._d=!1),ae();const s=i&&D3(i(n)),l=we(Et,{key:(n.key||s&&s.key||`_${t}`)+(!s&&o?"_fb":"")},s||(o?o():[]),s&&e._===1?64:-2);return l.scopeId&&(l.slotScopeIds=[l.scopeId+"-s"]),i&&i._c&&(i._d=!0),l}function D3(e){return e.some(t=>go(t)?!(t.type===jt||t.type===Et&&!D3(t.children)):!0)?e:null}function Mh(e,t){const n={};if(A.NODE_ENV!=="production"&&!Ve(e))return X("v-on with no argument expects an object value."),n;for(const o in e)n[Pn(o)]=e[o];return n}const Ol=e=>e?g0(e)?ji(e):Ol(e.parent):null,jr=lt(Object.create(null),{$:e=>e,$el:e=>e.vnode.el,$data:e=>e.data,$props:e=>A.NODE_ENV!=="production"?Ot(e.props):e.props,$attrs:e=>A.NODE_ENV!=="production"?Ot(e.attrs):e.attrs,$slots:e=>A.NODE_ENV!=="production"?Ot(e.slots):e.slots,$refs:e=>A.NODE_ENV!=="production"?Ot(e.refs):e.refs,$parent:e=>Ol(e.parent),$root:e=>Ol(e.root),$emit:e=>e.emit,$options:e=>Ml(e),$forceUpdate:e=>e.f||(e.f=()=>{e.effect.dirty=!0,wi(e.update)}),$nextTick:e=>e.n||(e.n=lr.bind(e.proxy)),$watch:e=>gp.bind(e)}),Sl=e=>e==="_"||e==="$",El=(e,t)=>e!==Ue&&!e.__isScriptSetup&&ke(e,t),A3={get({_:e},t){if(t==="__v_skip")return!0;const{ctx:n,setupState:o,data:r,props:i,accessCache:s,type:l,appContext:a}=e;if(A.NODE_ENV!=="production"&&t==="__isVue")return!0;let c;if(t[0]!=="$"){const h=s[t];if(h!==void 0)switch(h){case 1:return o[t];case 2:return r[t];case 4:return n[t];case 3:return i[t]}else{if(El(o,t))return s[t]=1,o[t];if(r!==Ue&&ke(r,t))return s[t]=2,r[t];if((c=e.propsOptions[0])&&ke(c,t))return s[t]=3,i[t];if(n!==Ue&&ke(n,t))return s[t]=4,n[t];Cl&&(s[t]=0)}}const f=jr[t];let u,d;if(f)return t==="$attrs"?(bt(e.attrs,"get",""),A.NODE_ENV!=="production"&&Ci()):A.NODE_ENV!=="production"&&t==="$slots"&&bt(e,"get",t),f(e);if((u=l.__cssModules)&&(u=u[t]))return u;if(n!==Ue&&ke(n,t))return s[t]=4,n[t];if(d=a.config.globalProperties,ke(d,t))return d[t];A.NODE_ENV!=="production"&&ht&&(!tt(t)||t.indexOf("__v")!==0)&&(r!==Ue&&Sl(t[0])&&ke(r,t)?X(`Property ${JSON.stringify(t)} must be accessed via $data because it starts with a reserved character ("$" or "_") and is not proxied on the render context.`):e===ht&&X(`Property ${JSON.stringify(t)} was accessed during render but is not defined on instance.`))},set({_:e},t,n){const{data:o,setupState:r,ctx:i}=e;return El(r,t)?(r[t]=n,!0):A.NODE_ENV!=="production"&&r.__isScriptSetup&&ke(r,t)?(X(`Cannot mutate <script setup> binding "${t}" from Options API.`),!1):o!==Ue&&ke(o,t)?(o[t]=n,!0):ke(e.props,t)?(A.NODE_ENV!=="production"&&X(`Attempting to mutate prop "${t}". Props are readonly.`),!1):t[0]==="$"&&t.slice(1)in e?(A.NODE_ENV!=="production"&&X(`Attempting to mutate public property "${t}". Properties starting with $ are reserved and readonly.`),!1):(A.NODE_ENV!=="production"&&t in e.appContext.config.globalProperties?Object.defineProperty(i,t,{enumerable:!0,configurable:!0,value:n}):i[t]=n,!0)},has({_:{data:e,setupState:t,accessCache:n,ctx:o,appContext:r,propsOptions:i}},s){let l;return!!n[s]||e!==Ue&&ke(e,s)||El(t,s)||(l=i[0])&&ke(l,s)||ke(o,s)||ke(jr,s)||ke(r.config.globalProperties,s)},defineProperty(e,t,n){return n.get!=null?e._.accessCache[t]=0:ke(n,"value")&&this.set(e,t,n.value,null),Reflect.defineProperty(e,t,n)}};A.NODE_ENV!=="production"&&(A3.ownKeys=e=>(X("Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead."),Reflect.ownKeys(e)));function Dh(e){const t={};return Object.defineProperty(t,"_",{configurable:!0,enumerable:!1,get:()=>e}),Object.keys(jr).forEach(n=>{Object.defineProperty(t,n,{configurable:!0,enumerable:!1,get:()=>jr[n](e),set:st})}),t}function Ah(e){const{ctx:t,propsOptions:[n]}=e;n&&Object.keys(n).forEach(o=>{Object.defineProperty(t,o,{enumerable:!0,configurable:!0,get:()=>e.props[o],set:st})})}function Th(e){const{ctx:t,setupState:n}=e;Object.keys(Pe(n)).forEach(o=>{if(!n.__isScriptSetup){if(Sl(o[0])){X(`setup() return property ${JSON.stringify(o)} should not start with "$" or "_" which are reserved prefixes for Vue internals.`);return}Object.defineProperty(t,o,{enumerable:!0,configurable:!0,get:()=>n[o],set:st})}})}function jh(){return zh().slots}function zh(){const e=Bn();return A.NODE_ENV!=="production"&&!e&&X("useContext() called without active instance."),e.setupContext||(e.setupContext=w0(e))}function Pl(e){return pe(e)?e.reduce((t,n)=>(t[n]=null,t),{}):e}function Nh(e,t){const n=Pl(e);for(const o in t){if(o.startsWith("__skip"))continue;let r=n[o];r?pe(r)||ye(r)?r=n[o]={type:r,default:t[o]}:r.default=t[o]:r===null?r=n[o]={default:t[o]}:A.NODE_ENV!=="production"&&X(`props default key "${o}" has no corresponding declaration.`),r&&t[`__skip_${o}`]&&(r.skipFactory=!0)}return n}function kh(){const e=Object.create(null);return(t,n)=>{e[n]?X(`${t} property "${n}" is already defined in ${e[n]}.`):e[n]=t}}let Cl=!0;function Ih(e){const t=Ml(e),n=e.proxy,o=e.ctx;Cl=!1,t.beforeCreate&&T3(t.beforeCreate,e,"bc");const{data:r,computed:i,methods:s,watch:l,provide:a,inject:c,created:f,beforeMount:u,mounted:d,beforeUpdate:h,updated:p,activated:v,deactivated:y,beforeDestroy:g,beforeUnmount:w,destroyed:$,unmounted:O,render:T,renderTracked:S,renderTriggered:x,errorCaptured:I,serverPrefetch:V,expose:W,inheritAttrs:re,components:K,directives:Ee,filters:de}=t,Ce=A.NODE_ENV!=="production"?kh():null;if(A.NODE_ENV!=="production"){const[fe]=e.propsOptions;if(fe)for(const me in fe)Ce("Props",me)}if(c&&Bh(c,o,Ce),s)for(const fe in s){const me=s[fe];ye(me)?(A.NODE_ENV!=="production"?Object.defineProperty(o,fe,{value:me.bind(n),configurable:!0,enumerable:!0,writable:!0}):o[fe]=me.bind(n),A.NODE_ENV!=="production"&&Ce("Methods",fe)):A.NODE_ENV!=="production"&&X(`Method "${fe}" has type "${typeof me}" in the component definition. Did you reference the function correctly?`)}if(r){A.NODE_ENV!=="production"&&!ye(r)&&X("The data option must be a function. Plain object usage is no longer supported.");const fe=r.call(n,n);if(A.NODE_ENV!=="production"&&tl(fe)&&X("data() returned a Promise - note data() cannot be async; If you intend to perform data fetching before component renders, use async setup() + <Suspense>."),!Ve(fe))A.NODE_ENV!=="production"&&X("data() should return an object.");else if(e.data=qo(fe),A.NODE_ENV!=="production")for(const me in fe)Ce("Data",me),Sl(me[0])||Object.defineProperty(o,me,{configurable:!0,enumerable:!0,get:()=>fe[me],set:st})}if(Cl=!0,i)for(const fe in i){const me=i[fe],He=ye(me)?me.bind(n,n):ye(me.get)?me.get.bind(n,n):st;A.NODE_ENV!=="production"&&He===st&&X(`Computed property "${fe}" has no getter.`);const ee=!ye(me)&&ye(me.set)?me.set.bind(n):A.NODE_ENV!=="production"?()=>{X(`Write operation failed: computed property "${fe}" is readonly.`)}:st,j=Oe({get:He,set:ee});Object.defineProperty(o,fe,{enumerable:!0,configurable:!0,get:()=>j.value,set:z=>j.value=z}),A.NODE_ENV!=="production"&&Ce("Computed",fe)}if(l)for(const fe in l)j3(l[fe],o,n,fe);if(a){const fe=ye(a)?a.call(n):a;Reflect.ownKeys(fe).forEach(me=>{I3(me,fe[me])})}f&&T3(f,e,"c");function be(fe,me){pe(me)?me.forEach(He=>fe(He.bind(n))):me&&fe(me.bind(n))}if(be(Fh,u),be(zn,d),be($h,h),be(xh,p),be(wh,v),be(_h,y),be(Ph,I),be(Eh,S),be(Sh,x),be(S3,w),be(r1,O),be(Oh,V),pe(W))if(W.length){const fe=e.exposed||(e.exposed={});W.forEach(me=>{Object.defineProperty(fe,me,{get:()=>n[me],set:He=>n[me]=He})})}else e.exposed||(e.exposed={});T&&e.render===st&&(e.render=T),re!=null&&(e.inheritAttrs=re),K&&(e.components=K),Ee&&(e.directives=Ee)}function Bh(e,t,n=st){pe(e)&&(e=Dl(e));for(const o in e){const r=e[o];let i;Ve(r)?"default"in r?i=s1(r.from||o,r.default,!0):i=s1(r.from||o):i=s1(r),vt(i)?Object.defineProperty(t,o,{enumerable:!0,configurable:!0,get:()=>i.value,set:s=>i.value=s}):t[o]=i,A.NODE_ENV!=="production"&&n("Inject",o)}}function T3(e,t,n){nn(pe(e)?e.map(o=>o.bind(t.proxy)):e.bind(t.proxy),t,n)}function j3(e,t,n,o){const r=o.includes(".")?o0(n,o):()=>n[o];if(tt(e)){const i=t[e];ye(i)?mt(r,i):A.NODE_ENV!=="production"&&X(`Invalid watch handler specified by key "${e}"`,i)}else if(ye(e))mt(r,e.bind(n));else if(Ve(e))if(pe(e))e.forEach(i=>j3(i,t,n,o));else{const i=ye(e.handler)?e.handler.bind(n):t[e.handler];ye(i)?mt(r,i,e):A.NODE_ENV!=="production"&&X(`Invalid watch handler specified by key "${e.handler}"`,i)}else A.NODE_ENV!=="production"&&X(`Invalid watch option: "${o}"`,e)}function Ml(e){const t=e.type,{mixins:n,extends:o}=t,{mixins:r,optionsCache:i,config:{optionMergeStrategies:s}}=e.appContext,l=i.get(t);let a;return l?a=l:!r.length&&!n&&!o?a=t:(a={},r.length&&r.forEach(c=>xi(a,c,s,!0)),xi(a,t,s)),Ve(t)&&i.set(t,a),a}function xi(e,t,n,o=!1){const{mixins:r,extends:i}=t;i&&xi(e,i,n,!0),r&&r.forEach(s=>xi(e,s,n,!0));for(const s in t)if(o&&s==="expose")A.NODE_ENV!=="production"&&X('"expose" option is ignored when declared in mixins or extends. It should only be declared in the base component itself.');else{const l=Lh[s]||n&&n[s];e[s]=l?l(e[s],t[s]):t[s]}return e}const Lh={data:z3,props:N3,emits:N3,methods:o1,computed:o1,beforeCreate:Tt,created:Tt,beforeMount:Tt,mounted:Tt,beforeUpdate:Tt,updated:Tt,beforeDestroy:Tt,beforeUnmount:Tt,destroyed:Tt,unmounted:Tt,activated:Tt,deactivated:Tt,errorCaptured:Tt,serverPrefetch:Tt,components:o1,directives:o1,watch:Vh,provide:z3,inject:Rh};function z3(e,t){return t?e?function(){return lt(ye(e)?e.call(this,this):e,ye(t)?t.call(this,this):t)}:t:e}function Rh(e,t){return o1(Dl(e),Dl(t))}function Dl(e){if(pe(e)){const t={};for(let n=0;n<e.length;n++)t[e[n]]=e[n];return t}return e}function Tt(e,t){return e?[...new Set([].concat(e,t))]:t}function o1(e,t){return e?lt(Object.create(null),e,t):t}function N3(e,t){return e?pe(e)&&pe(t)?[...new Set([...e,...t])]:lt(Object.create(null),Pl(e),Pl(t??{})):t}function Vh(e,t){if(!e)return t;if(!t)return e;const n=lt(Object.create(null),e);for(const o in t)n[o]=Tt(e[o],t[o]);return n}function k3(){return{app:null,config:{isNativeTag:a6,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}let Hh=0;function Uh(e,t){return function(o,r=null){ye(o)||(o=lt({},o)),r!=null&&!Ve(r)&&(A.NODE_ENV!=="production"&&X("root props passed to app.mount() must be an object."),r=null);const i=k3(),s=new WeakSet;let l=!1;const a=i.app={_uid:Hh++,_component:o,_props:r,_container:null,_context:i,_instance:null,version:b0,get config(){return i.config},set config(c){A.NODE_ENV!=="production"&&X("app.config cannot be replaced. Modify individual options instead.")},use(c,...f){return s.has(c)?A.NODE_ENV!=="production"&&X("Plugin has already been applied to target app."):c&&ye(c.install)?(s.add(c),c.install(a,...f)):ye(c)?(s.add(c),c(a,...f)):A.NODE_ENV!=="production"&&X('A plugin must either be a function or an object with an "install" function.'),a},mixin(c){return i.mixins.includes(c)?A.NODE_ENV!=="production"&&X("Mixin has already been applied to target app"+(c.name?`: ${c.name}`:"")):i.mixins.push(c),a},component(c,f){return A.NODE_ENV!=="production"&&Ul(c,i.config),f?(A.NODE_ENV!=="production"&&i.components[c]&&X(`Component "${c}" has already been registered in target app.`),i.components[c]=f,a):i.components[c]},directive(c,f){return A.NODE_ENV!=="production"&&$3(c),f?(A.NODE_ENV!=="production"&&i.directives[c]&&X(`Directive "${c}" has already been registered in target app.`),i.directives[c]=f,a):i.directives[c]},mount(c,f,u){if(l)A.NODE_ENV!=="production"&&X("App has already been mounted.\nIf you want to remount the same app, move your app creation logic into a factory function and create fresh app instances for each mount - e.g. `const createMyApp = () => createApp(App)`");else{A.NODE_ENV!=="production"&&c.__vue_app__&&X("There is already an app instance mounted on the host container.\n If you want to mount another app on the same host container, you need to unmount the previous app by calling `app.unmount()` first.");const d=Be(o,r);return d.appContext=i,u===!0?u="svg":u===!1&&(u=void 0),A.NODE_ENV!=="production"&&(i.reload=()=>{e(In(d),c,u)}),f&&t?t(d,c):e(d,c,u),l=!0,a._container=c,c.__vue_app__=a,A.NODE_ENV!=="production"&&(a._instance=d.component,fh(a,b0)),ji(d.component)}},unmount(){l?(e(null,a._container),A.NODE_ENV!=="production"&&(a._instance=null,uh(a)),delete a._container.__vue_app__):A.NODE_ENV!=="production"&&X("Cannot unmount an app that is not mounted.")},provide(c,f){return A.NODE_ENV!=="production"&&c in i.provides&&X(`App already provides property with key "${String(c)}". It will be overwritten with the new value.`),i.provides[c]=f,a},runWithContext(c){const f=i1;i1=a;try{return c()}finally{i1=f}}};return a}}let i1=null;function I3(e,t){if(!yt)A.NODE_ENV!=="production"&&X("provide() can only be used inside setup().");else{let n=yt.provides;const o=yt.parent&&yt.parent.provides;o===n&&(n=yt.provides=Object.create(o)),n[e]=t}}function s1(e,t,n=!1){const o=yt||ht;if(o||i1){const r=o?o.parent==null?o.vnode.appContext&&o.vnode.appContext.provides:o.parent.provides:i1._context.provides;if(r&&e in r)return r[e];if(arguments.length>1)return n&&ye(t)?t.call(o&&o.proxy):t;A.NODE_ENV!=="production"&&X(`injection "${String(e)}" not found.`)}else A.NODE_ENV!=="production"&&X("inject() can only be used inside setup() or functional components.")}const B3={},L3=()=>Object.create(B3),R3=e=>Object.getPrototypeOf(e)===B3;function Wh(e,t,n,o=!1){const r={},i=L3();e.propsDefaults=Object.create(null),V3(e,t,r,i);for(const s in e.propsOptions[0])s in r||(r[s]=void 0);A.NODE_ENV!=="production"&&W3(t||{},r,e),n?e.props=o?r:L6(r):e.type.props?e.props=r:e.props=i,e.attrs=i}function Gh(e){for(;e;){if(e.type.__hmrId)return!0;e=e.parent}}function Kh(e,t,n,o){const{props:r,attrs:i,vnode:{patchFlag:s}}=e,l=Pe(r),[a]=e.propsOptions;let c=!1;if(!(A.NODE_ENV!=="production"&&Gh(e))&&(o||s>0)&&!(s&16)){if(s&8){const f=e.vnode.dynamicProps;for(let u=0;u<f.length;u++){let d=f[u];if(Pi(e.emitsOptions,d))continue;const h=t[d];if(a)if(ke(i,d))h!==i[d]&&(i[d]=h,c=!0);else{const p=xt(d);r[p]=Al(a,l,p,h,e,!1)}else h!==i[d]&&(i[d]=h,c=!0)}}}else{V3(e,t,r,i)&&(c=!0);let f;for(const u in l)(!t||!ke(t,u)&&((f=Nt(u))===u||!ke(t,f)))&&(a?n&&(n[u]!==void 0||n[f]!==void 0)&&(r[u]=Al(a,l,u,void 0,e,!0)):delete r[u]);if(i!==l)for(const u in i)(!t||!ke(t,u))&&(delete i[u],c=!0)}c&&gn(e.attrs,"set",""),A.NODE_ENV!=="production"&&W3(t||{},r,e)}function V3(e,t,n,o){const[r,i]=e.propsOptions;let s=!1,l;if(t)for(let a in t){if(Go(a))continue;const c=t[a];let f;r&&ke(r,f=xt(a))?!i||!i.includes(f)?n[f]=c:(l||(l={}))[f]=c:Pi(e.emitsOptions,a)||(!(a in o)||c!==o[a])&&(o[a]=c,s=!0)}if(i){const a=Pe(n),c=l||Ue;for(let f=0;f<i.length;f++){const u=i[f];n[u]=Al(r,a,u,c[u],e,!ke(c,u))}}return s}function Al(e,t,n,o,r,i){const s=e[n];if(s!=null){const l=ke(s,"default");if(l&&o===void 0){const a=s.default;if(s.type!==Function&&!s.skipFactory&&ye(a)){const{propsDefaults:c}=r;if(n in c)o=c[n];else{const f=h1(r);o=c[n]=a.call(null,t),f()}}else o=a}s[0]&&(i&&!l?o=!1:s[1]&&(o===""||o===Nt(n))&&(o=!0))}return o}const qh=new WeakMap;function H3(e,t,n=!1){const o=n?qh:t.propsCache,r=o.get(e);if(r)return r;const i=e.props,s={},l=[];let a=!1;if(!ye(e)){const f=u=>{a=!0;const[d,h]=H3(u,t,!0);lt(s,d),h&&l.push(...h)};!n&&t.mixins.length&&t.mixins.forEach(f),e.extends&&f(e.extends),e.mixins&&e.mixins.forEach(f)}if(!i&&!a)return Ve(e)&&o.set(e,fo),fo;if(pe(i))for(let f=0;f<i.length;f++){A.NODE_ENV!=="production"&&!tt(i[f])&&X("props must be strings when using array syntax.",i[f]);const u=xt(i[f]);U3(u)&&(s[u]=Ue)}else if(i){A.NODE_ENV!=="production"&&!Ve(i)&&X("invalid props options",i);for(const f in i){const u=xt(f);if(U3(u)){const d=i[f],h=s[u]=pe(d)||ye(d)?{type:d}:lt({},d),p=h.type;let v=!1,y=!0;if(pe(p))for(let g=0;g<p.length;++g){const w=p[g],$=ye(w)&&w.name;if($==="Boolean"){v=!0;break}else $==="String"&&(y=!1)}else v=ye(p)&&p.name==="Boolean";h[0]=v,h[1]=y,(v||ke(h,"default"))&&l.push(u)}}}const c=[s,l];return Ve(e)&&o.set(e,c),c}function U3(e){return e[0]!=="$"&&!Go(e)?!0:(A.NODE_ENV!=="production"&&X(`Invalid prop name: "${e}" is a reserved property.`),!1)}function Yh(e){return e===null?"null":typeof e=="function"?e.name||"":typeof e=="object"&&e.constructor&&e.constructor.name||""}function W3(e,t,n){const o=Pe(t),r=n.propsOptions[0];for(const i in r){let s=r[i];s!=null&&Zh(i,o[i],s,A.NODE_ENV!=="production"?Ot(o):o,!ke(e,i)&&!ke(e,Nt(i)))}}function Zh(e,t,n,o,r){const{type:i,required:s,validator:l,skipCheck:a}=n;if(s&&r){X('Missing required prop: "'+e+'"');return}if(!(t==null&&!s)){if(i!=null&&i!==!0&&!a){let c=!1;const f=pe(i)?i:[i],u=[];for(let d=0;d<f.length&&!c;d++){const{valid:h,expectedType:p}=Xh(t,f[d]);u.push(p||""),c=h}if(!c){X(Qh(e,t,u));return}}l&&!l(t,o)&&X('Invalid prop: custom validator check failed for prop "'+e+'".')}}const Jh=co("String,Number,Boolean,Function,Symbol,BigInt");function Xh(e,t){let n;const o=Yh(t);if(Jh(o)){const r=typeof e;n=r===o.toLowerCase(),!n&&r==="object"&&(n=e instanceof t)}else o==="Object"?n=Ve(e):o==="Array"?n=pe(e):o==="null"?n=e===null:n=e instanceof t;return{valid:n,expectedType:o}}function Qh(e,t,n){if(n.length===0)return`Prop type [] for prop "${e}" won't match anything. Did you mean to use type Array instead?`;let o=`Invalid prop: type check failed for prop "${e}". Expected ${n.map(Sr).join(" | ")}`;const r=n[0],i=nl(t),s=G3(t,r),l=G3(t,i);return n.length===1&&K3(r)&&!ep(r,i)&&(o+=` with value ${s}`),o+=`, got ${i} `,K3(i)&&(o+=`with value ${l}.`),o}function G3(e,t){return t==="String"?`"${e}"`:t==="Number"?`${Number(e)}`:`${e}`}function K3(e){return["string","number","boolean"].some(n=>e.toLowerCase()===n)}function ep(...e){return e.some(t=>t.toLowerCase()==="boolean")}const q3=e=>e[0]==="_"||e==="$stable",Tl=e=>pe(e)?e.map(on):[on(e)],tp=(e,t,n)=>{if(t._n)return t;const o=se((...r)=>(A.NODE_ENV!=="production"&&yt&&(!n||n.root===yt.root)&&X(`Slot "${e}" invoked outside of the render function: this will not track dependencies used in the slot. Invoke the slot function inside the render function instead.`),Tl(t(...r))),n);return o._c=!1,o},Y3=(e,t,n)=>{const o=e._ctx;for(const r in e){if(q3(r))continue;const i=e[r];if(ye(i))t[r]=tp(r,i,o);else if(i!=null){A.NODE_ENV!=="production"&&X(`Non-function value encountered for slot "${r}". Prefer function slots for better performance.`);const s=Tl(i);t[r]=()=>s}}},Z3=(e,t)=>{A.NODE_ENV!=="production"&&!xl(e.vnode)&&X("Non-function value encountered for default slot. Prefer function slots for better performance.");const n=Tl(t);e.slots.default=()=>n},jl=(e,t,n)=>{for(const o in t)(n||o!=="_")&&(e[o]=t[o])},np=(e,t,n)=>{const o=e.slots=L3();if(e.vnode.shapeFlag&32){const r=t._;r?(jl(o,t,n),n&&ii(o,"_",r,!0)):Y3(t,o)}else t&&Z3(e,t)},rp=(e,t,n)=>{const{vnode:o,slots:r}=e;let i=!0,s=Ue;if(o.shapeFlag&32){const l=t._;l?A.NODE_ENV!=="production"&&ar?(jl(r,t,n),gn(e,"set","$slots")):n&&l===1?i=!1:jl(r,t,n):(i=!t.$stable,Y3(t,r)),s=t}else t&&(Z3(e,t),s={default:1});if(i)for(const l in r)!q3(l)&&s[l]==null&&delete r[l]};function zl(e,t,n,o,r=!1){if(pe(e)){e.forEach((d,h)=>zl(d,t&&(pe(t)?t[h]:t),n,o,r));return}if(n1(o)&&!r)return;const i=o.shapeFlag&4?ji(o.component):o.el,s=r?null:i,{i:l,r:a}=e;if(A.NODE_ENV!=="production"&&!l){X("Missing ref owner context. ref cannot be used on hoisted vnodes. A vnode with ref must be created inside the render function.");return}const c=t&&t.r,f=l.refs===Ue?l.refs={}:l.refs,u=l.setupState;if(c!=null&&c!==a&&(tt(c)?(f[c]=null,ke(u,c)&&(u[c]=null)):vt(c)&&(c.value=null)),ye(a))Tn(a,l,12,[s,f]);else{const d=tt(a),h=vt(a);if(d||h){const p=()=>{if(e.f){const v=d?ke(u,a)?u[a]:f[a]:a.value;r?pe(v)&&el(v,i):pe(v)?v.includes(i)||v.push(i):d?(f[a]=[i],ke(u,a)&&(u[a]=f[a])):(a.value=[i],e.k&&(f[e.k]=a.value))}else d?(f[a]=s,ke(u,a)&&(u[a]=s)):h?(a.value=s,e.k&&(f[e.k]=s)):A.NODE_ENV!=="production"&&X("Invalid template ref type:",a,`(${typeof a})`)};s?(p.id=-1,kt(p,n)):p()}else A.NODE_ENV!=="production"&&X("Invalid template ref type:",a,`(${typeof a})`)}}const J3=Symbol("_vte"),op=e=>e.__isTeleport,zr=e=>e&&(e.disabled||e.disabled===""),X3=e=>typeof SVGElement<"u"&&e instanceof SVGElement,Q3=e=>typeof MathMLElement=="function"&&e instanceof MathMLElement,Nl=(e,t)=>{const n=e&&e.to;if(tt(n))if(t){const o=t(n);return A.NODE_ENV!=="production"&&!o&&!zr(e)&&X(`Failed to locate Teleport target with selector "${n}". Note the target element must exist before the component is mounted - i.e. the target cannot be rendered by the component itself, and ideally should be outside of the entire Vue component tree.`),o}else return A.NODE_ENV!=="production"&&X("Current renderer does not support string target for Teleports. (missing querySelector renderer option)"),null;else return A.NODE_ENV!=="production"&&!n&&!zr(e)&&X(`Invalid Teleport target: ${n}`),n},ip={name:"Teleport",__isTeleport:!0,process(e,t,n,o,r,i,s,l,a,c){const{mc:f,pc:u,pbc:d,o:{insert:h,querySelector:p,createText:v,createComment:y}}=c,g=zr(t.props);let{shapeFlag:w,children:$,dynamicChildren:O}=t;if(A.NODE_ENV!=="production"&&ar&&(a=!1,O=null),e==null){const T=t.el=A.NODE_ENV!=="production"?y("teleport start"):v(""),S=t.anchor=A.NODE_ENV!=="production"?y("teleport end"):v("");h(T,n,o),h(S,n,o);const x=t.target=Nl(t.props,p),I=t0(x,t,v,h);x?s==="svg"||X3(x)?s="svg":(s==="mathml"||Q3(x))&&(s="mathml"):A.NODE_ENV!=="production"&&!g&&X("Invalid Teleport target on mount:",x,`(${typeof x})`);const V=(W,re)=>{w&16&&f($,W,re,r,i,s,l,a)};g?V(n,S):x&&V(x,I)}else{t.el=e.el,t.targetStart=e.targetStart;const T=t.anchor=e.anchor,S=t.target=e.target,x=t.targetAnchor=e.targetAnchor,I=zr(e.props),V=I?n:S,W=I?T:x;if(s==="svg"||X3(S)?s="svg":(s==="mathml"||Q3(S))&&(s="mathml"),O?(d(e.dynamicChildren,O,V,r,i,s,l),a1(e,t,!0)):a||u(e,t,V,W,r,i,s,l,!1),g)I?t.props&&e.props&&t.props.to!==e.props.to&&(t.props.to=e.props.to):Oi(t,n,T,c,1);else if((t.props&&t.props.to)!==(e.props&&e.props.to)){const re=t.target=Nl(t.props,p);re?Oi(t,re,null,c,0):A.NODE_ENV!=="production"&&X("Invalid Teleport target on update:",S,`(${typeof S})`)}else I&&Oi(t,S,x,c,1)}e0(t)},remove(e,t,n,{um:o,o:{remove:r}},i){const{shapeFlag:s,children:l,anchor:a,targetStart:c,targetAnchor:f,target:u,props:d}=e;if(u&&(r(c),r(f)),i&&r(a),s&16){const h=i||!zr(d);for(let p=0;p<l.length;p++){const v=l[p];o(v,t,n,h,!!v.dynamicChildren)}}},move:Oi,hydrate:sp};function Oi(e,t,n,{o:{insert:o},m:r},i=2){i===0&&o(e.targetAnchor,t,n);const{el:s,anchor:l,shapeFlag:a,children:c,props:f}=e,u=i===2;if(u&&o(s,t,n),(!u||zr(f))&&a&16)for(let d=0;d<c.length;d++)r(c[d],t,n,2);u&&o(l,t,n)}function sp(e,t,n,o,r,i,{o:{nextSibling:s,parentNode:l,querySelector:a,insert:c,createText:f}},u){const d=t.target=Nl(t.props,a);if(d){const h=d._lpa||d.firstChild;if(t.shapeFlag&16)if(zr(t.props))t.anchor=u(s(e),t,l(e),n,o,r,i),t.targetStart=h,t.targetAnchor=h&&s(h);else{t.anchor=s(e);let p=h;for(;p;){if(p&&p.nodeType===8){if(p.data==="teleport start anchor")t.targetStart=p;else if(p.data==="teleport anchor"){t.targetAnchor=p,d._lpa=t.targetAnchor&&s(t.targetAnchor);break}}p=s(p)}t.targetAnchor||t0(d,t,f,c),u(h&&s(h),t,d,n,o,r,i)}e0(t)}return t.anchor&&s(t.anchor)}const lp=ip;function e0(e){const t=e.ctx;if(t&&t.ut){let n=e.children[0].el;for(;n&&n!==e.targetAnchor;)n.nodeType===1&&n.setAttribute("data-v-owner",t.uid),n=n.nextSibling;t.ut()}}function t0(e,t,n,o){const r=t.targetStart=n(""),i=t.targetAnchor=n("");return r[J3]=i,e&&(o(r,e),o(i,e)),i}let l1,cr;function Nn(e,t){e.appContext.config.performance&&Si()&&cr.mark(`vue-${t}-${e.uid}`),A.NODE_ENV!=="production"&&gh(e,t,Si()?cr.now():Date.now())}function kn(e,t){if(e.appContext.config.performance&&Si()){const n=`vue-${t}-${e.uid}`,o=n+":end";cr.mark(o),cr.measure(`<${zi(e,e.type)}> ${t}`,n,o),cr.clearMarks(n),cr.clearMarks(o)}A.NODE_ENV!=="production"&&vh(e,t,Si()?cr.now():Date.now())}function Si(){return l1!==void 0||(typeof window<"u"&&window.performance?(l1=!0,cr=window.performance):l1=!1),l1}function ap(){const e=[];if(A.NODE_ENV!=="production"&&e.length){const t=e.length>1;console.warn(`Feature flag${t?"s":""} ${e.join(", ")} ${t?"are":"is"} not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.

For more details, see https://link.vuejs.org/feature-flags.`)}}const kt=$p;function cp(e){return fp(e)}function fp(e,t){ap();const n=ol();n.__VUE__=!0,A.NODE_ENV!=="production"&&w3(n.__VUE_DEVTOOLS_GLOBAL_HOOK__,n);const{insert:o,remove:r,patchProp:i,createElement:s,createText:l,createComment:a,setText:c,setElementText:f,parentNode:u,nextSibling:d,setScopeId:h=st,insertStaticContent:p}=e,v=(F,M,B,Y=null,G=null,Z=null,te=void 0,Q=null,J=A.NODE_ENV!=="production"&&ar?!1:!!M.dynamicChildren)=>{if(F===M)return;F&&!d1(F,M)&&(Y=k(F),P(F,G,Z,!0),F=null),M.patchFlag===-2&&(J=!1,M.dynamicChildren=null);const{type:U,ref:ne,shapeFlag:le}=M;switch(U){case c1:y(F,M,B,Y);break;case jt:g(F,M,B,Y);break;case Mi:F==null?w(M,B,Y,te):A.NODE_ENV!=="production"&&$(F,M,B,te);break;case Et:Ee(F,M,B,Y,G,Z,te,Q,J);break;default:le&1?S(F,M,B,Y,G,Z,te,Q,J):le&6?de(F,M,B,Y,G,Z,te,Q,J):le&64||le&128?U.process(F,M,B,Y,G,Z,te,Q,J,Fe):A.NODE_ENV!=="production"&&X("Invalid VNode type:",U,`(${typeof U})`)}ne!=null&&G&&zl(ne,F&&F.ref,Z,M||F,!M)},y=(F,M,B,Y)=>{if(F==null)o(M.el=l(M.children),B,Y);else{const G=M.el=F.el;M.children!==F.children&&c(G,M.children)}},g=(F,M,B,Y)=>{F==null?o(M.el=a(M.children||""),B,Y):M.el=F.el},w=(F,M,B,Y)=>{[F.el,F.anchor]=p(F.children,M,B,Y,F.el,F.anchor)},$=(F,M,B,Y)=>{if(M.children!==F.children){const G=d(F.anchor);T(F),[M.el,M.anchor]=p(M.children,B,G,Y)}else M.el=F.el,M.anchor=F.anchor},O=({el:F,anchor:M},B,Y)=>{let G;for(;F&&F!==M;)G=d(F),o(F,B,Y),F=G;o(M,B,Y)},T=({el:F,anchor:M})=>{let B;for(;F&&F!==M;)B=d(F),r(F),F=B;r(M)},S=(F,M,B,Y,G,Z,te,Q,J)=>{M.type==="svg"?te="svg":M.type==="math"&&(te="mathml"),F==null?x(M,B,Y,G,Z,te,Q,J):W(F,M,G,Z,te,Q,J)},x=(F,M,B,Y,G,Z,te,Q)=>{let J,U;const{props:ne,shapeFlag:le,transition:ie,dirs:_e}=F;if(J=F.el=s(F.type,Z,ne&&ne.is,ne),le&8?f(J,F.children):le&16&&V(F.children,J,null,Y,G,kl(F,Z),te,Q),_e&&Tr(F,null,Y,"created"),I(J,F,F.scopeId,te,Y),ne){for(const je in ne)je!=="value"&&!Go(je)&&i(J,je,null,ne[je],Z,Y);"value"in ne&&i(J,"value",null,ne.value,Z),(U=ne.onVnodeBeforeMount)&&wn(U,Y,F)}A.NODE_ENV!=="production"&&(ii(J,"__vnode",F,!0),ii(J,"__vueParentComponent",Y,!0)),_e&&Tr(F,null,Y,"beforeMount");const Me=up(G,ie);Me&&ie.beforeEnter(J),o(J,M,B),((U=ne&&ne.onVnodeMounted)||Me||_e)&&kt(()=>{U&&wn(U,Y,F),Me&&ie.enter(J),_e&&Tr(F,null,Y,"mounted")},G)},I=(F,M,B,Y,G)=>{if(B&&h(F,B),Y)for(let Z=0;Z<Y.length;Z++)h(F,Y[Z]);if(G){let Z=G.subTree;if(A.NODE_ENV!=="production"&&Z.patchFlag>0&&Z.patchFlag&2048&&(Z=Rl(Z.children)||Z),M===Z){const te=G.vnode;I(F,te,te.scopeId,te.slotScopeIds,G.parent)}}},V=(F,M,B,Y,G,Z,te,Q,J=0)=>{for(let U=J;U<F.length;U++){const ne=F[U]=Q?dr(F[U]):on(F[U]);v(null,ne,M,B,Y,G,Z,te,Q)}},W=(F,M,B,Y,G,Z,te)=>{const Q=M.el=F.el;A.NODE_ENV!=="production"&&(Q.__vnode=M);let{patchFlag:J,dynamicChildren:U,dirs:ne}=M;J|=F.patchFlag&16;const le=F.props||Ue,ie=M.props||Ue;let _e;if(B&&Nr(B,!1),(_e=ie.onVnodeBeforeUpdate)&&wn(_e,B,M,F),ne&&Tr(M,F,B,"beforeUpdate"),B&&Nr(B,!0),A.NODE_ENV!=="production"&&ar&&(J=0,te=!1,U=null),(le.innerHTML&&ie.innerHTML==null||le.textContent&&ie.textContent==null)&&f(Q,""),U?(re(F.dynamicChildren,U,Q,B,Y,kl(M,G),Z),A.NODE_ENV!=="production"&&a1(F,M)):te||He(F,M,Q,null,B,Y,kl(M,G),Z,!1),J>0){if(J&16)K(Q,le,ie,B,G);else if(J&2&&le.class!==ie.class&&i(Q,"class",null,ie.class,G),J&4&&i(Q,"style",le.style,ie.style,G),J&8){const Me=M.dynamicProps;for(let je=0;je<Me.length;je++){const Ne=Me[je],ft=le[Ne],Vt=ie[Ne];(Vt!==ft||Ne==="value")&&i(Q,Ne,ft,Vt,G,B)}}J&1&&F.children!==M.children&&f(Q,M.children)}else!te&&U==null&&K(Q,le,ie,B,G);((_e=ie.onVnodeUpdated)||ne)&&kt(()=>{_e&&wn(_e,B,M,F),ne&&Tr(M,F,B,"updated")},Y)},re=(F,M,B,Y,G,Z,te)=>{for(let Q=0;Q<M.length;Q++){const J=F[Q],U=M[Q],ne=J.el&&(J.type===Et||!d1(J,U)||J.shapeFlag&70)?u(J.el):B;v(J,U,ne,null,Y,G,Z,te,!0)}},K=(F,M,B,Y,G)=>{if(M!==B){if(M!==Ue)for(const Z in M)!Go(Z)&&!(Z in B)&&i(F,Z,M[Z],null,G,Y);for(const Z in B){if(Go(Z))continue;const te=B[Z],Q=M[Z];te!==Q&&Z!=="value"&&i(F,Z,Q,te,G,Y)}"value"in B&&i(F,"value",M.value,B.value,G)}},Ee=(F,M,B,Y,G,Z,te,Q,J)=>{const U=M.el=F?F.el:l(""),ne=M.anchor=F?F.anchor:l("");let{patchFlag:le,dynamicChildren:ie,slotScopeIds:_e}=M;A.NODE_ENV!=="production"&&(ar||le&2048)&&(le=0,J=!1,ie=null),_e&&(Q=Q?Q.concat(_e):_e),F==null?(o(U,B,Y),o(ne,B,Y),V(M.children||[],B,ne,G,Z,te,Q,J)):le>0&&le&64&&ie&&F.dynamicChildren?(re(F.dynamicChildren,ie,B,G,Z,te,Q),A.NODE_ENV!=="production"?a1(F,M):(M.key!=null||G&&M===G.subTree)&&a1(F,M,!0)):He(F,M,B,ne,G,Z,te,Q,J)},de=(F,M,B,Y,G,Z,te,Q,J)=>{M.slotScopeIds=Q,F==null?M.shapeFlag&512?G.ctx.activate(M,B,Y,te,J):Ce(M,B,Y,G,Z,te,J):be(F,M,J)},Ce=(F,M,B,Y,G,Z,te)=>{const Q=F.component=Pp(F,Y,G);if(A.NODE_ENV!=="production"&&Q.type.__hmrId&&sh(Q),A.NODE_ENV!=="production"&&(mi(F),Nn(Q,"mount")),xl(F)&&(Q.ctx.renderer=Fe),A.NODE_ENV!=="production"&&Nn(Q,"init"),Mp(Q,!1,te),A.NODE_ENV!=="production"&&kn(Q,"init"),Q.asyncDep){if(G&&G.registerDep(Q,fe,te),!F.el){const J=Q.subTree=Be(jt);g(null,J,M,B)}}else fe(Q,F,M,B,G,Z,te);A.NODE_ENV!=="production"&&(yi(),kn(Q,"mount"))},be=(F,M,B)=>{const Y=M.component=F.component;if(_p(F,M,B))if(Y.asyncDep&&!Y.asyncResolved){A.NODE_ENV!=="production"&&mi(M),me(Y,M,B),A.NODE_ENV!=="production"&&yi();return}else Y.next=M,oh(Y.update),Y.effect.dirty=!0,Y.update();else M.el=F.el,Y.vnode=M},fe=(F,M,B,Y,G,Z,te)=>{const Q=()=>{if(F.isMounted){let{next:ne,bu:le,u:ie,parent:_e,vnode:Me}=F;{const Qt=n0(F);if(Qt){ne&&(ne.el=Me.el,me(F,ne,te)),Qt.asyncDep.then(()=>{F.isUnmounted||Q()});return}}let je=ne,Ne;A.NODE_ENV!=="production"&&mi(ne||F.vnode),Nr(F,!1),ne?(ne.el=Me.el,me(F,ne,te)):ne=Me,le&&Ko(le),(Ne=ne.props&&ne.props.onVnodeBeforeUpdate)&&wn(Ne,_e,ne,Me),Nr(F,!0),A.NODE_ENV!=="production"&&Nn(F,"render");const ft=Ll(F);A.NODE_ENV!=="production"&&kn(F,"render");const Vt=F.subTree;F.subTree=ft,A.NODE_ENV!=="production"&&Nn(F,"patch"),v(Vt,ft,u(Vt.el),k(Vt),F,G,Z),A.NODE_ENV!=="production"&&kn(F,"patch"),ne.el=ft.el,je===null&&bp(F,ft.el),ie&&kt(ie,G),(Ne=ne.props&&ne.props.onVnodeUpdated)&&kt(()=>wn(Ne,_e,ne,Me),G),A.NODE_ENV!=="production"&&_3(F),A.NODE_ENV!=="production"&&yi()}else{let ne;const{el:le,props:ie}=M,{bm:_e,m:Me,parent:je}=F,Ne=n1(M);if(Nr(F,!1),_e&&Ko(_e),!Ne&&(ne=ie&&ie.onVnodeBeforeMount)&&wn(ne,je,M),Nr(F,!0),le&&nt){const ft=()=>{A.NODE_ENV!=="production"&&Nn(F,"render"),F.subTree=Ll(F),A.NODE_ENV!=="production"&&kn(F,"render"),A.NODE_ENV!=="production"&&Nn(F,"hydrate"),nt(le,F.subTree,F,G,null),A.NODE_ENV!=="production"&&kn(F,"hydrate")};Ne?M.type.__asyncLoader().then(()=>!F.isUnmounted&&ft()):ft()}else{A.NODE_ENV!=="production"&&Nn(F,"render");const ft=F.subTree=Ll(F);A.NODE_ENV!=="production"&&kn(F,"render"),A.NODE_ENV!=="production"&&Nn(F,"patch"),v(null,ft,B,Y,F,G,Z),A.NODE_ENV!=="production"&&kn(F,"patch"),M.el=ft.el}if(Me&&kt(Me,G),!Ne&&(ne=ie&&ie.onVnodeMounted)){const ft=M;kt(()=>wn(ne,je,ft),G)}(M.shapeFlag&256||je&&n1(je.vnode)&&je.vnode.shapeFlag&256)&&F.a&&kt(F.a,G),F.isMounted=!0,A.NODE_ENV!=="production"&&dh(F),M=B=Y=null}},J=F.effect=new ll(Q,st,()=>wi(U),F.scope),U=F.update=()=>{J.dirty&&J.run()};U.i=F,U.id=F.uid,Nr(F,!0),A.NODE_ENV!=="production"&&(J.onTrack=F.rtc?ne=>Ko(F.rtc,ne):void 0,J.onTrigger=F.rtg?ne=>Ko(F.rtg,ne):void 0),U()},me=(F,M,B)=>{M.component=F;const Y=F.vnode.props;F.vnode=M,F.next=null,Kh(F,M.props,Y,B),rp(F,M.children,B),Cn(),p3(F),Mn()},He=(F,M,B,Y,G,Z,te,Q,J=!1)=>{const U=F&&F.children,ne=F?F.shapeFlag:0,le=M.children,{patchFlag:ie,shapeFlag:_e}=M;if(ie>0){if(ie&128){j(U,le,B,Y,G,Z,te,Q,J);return}else if(ie&256){ee(U,le,B,Y,G,Z,te,Q,J);return}}_e&8?(ne&16&&N(U,G,Z),le!==U&&f(B,le)):ne&16?_e&16?j(U,le,B,Y,G,Z,te,Q,J):N(U,G,Z,!0):(ne&8&&f(B,""),_e&16&&V(le,B,Y,G,Z,te,Q,J))},ee=(F,M,B,Y,G,Z,te,Q,J)=>{F=F||fo,M=M||fo;const U=F.length,ne=M.length,le=Math.min(U,ne);let ie;for(ie=0;ie<le;ie++){const _e=M[ie]=J?dr(M[ie]):on(M[ie]);v(F[ie],_e,B,null,G,Z,te,Q,J)}U>ne?N(F,G,Z,!0,!1,le):V(M,B,Y,G,Z,te,Q,J,le)},j=(F,M,B,Y,G,Z,te,Q,J)=>{let U=0;const ne=M.length;let le=F.length-1,ie=ne-1;for(;U<=le&&U<=ie;){const _e=F[U],Me=M[U]=J?dr(M[U]):on(M[U]);if(d1(_e,Me))v(_e,Me,B,null,G,Z,te,Q,J);else break;U++}for(;U<=le&&U<=ie;){const _e=F[le],Me=M[ie]=J?dr(M[ie]):on(M[ie]);if(d1(_e,Me))v(_e,Me,B,null,G,Z,te,Q,J);else break;le--,ie--}if(U>le){if(U<=ie){const _e=ie+1,Me=_e<ne?M[_e].el:Y;for(;U<=ie;)v(null,M[U]=J?dr(M[U]):on(M[U]),B,Me,G,Z,te,Q,J),U++}}else if(U>ie)for(;U<=le;)P(F[U],G,Z,!0),U++;else{const _e=U,Me=U,je=new Map;for(U=Me;U<=ie;U++){const qe=M[U]=J?dr(M[U]):on(M[U]);qe.key!=null&&(A.NODE_ENV!=="production"&&je.has(qe.key)&&X("Duplicate keys found during update:",JSON.stringify(qe.key),"Make sure keys are unique."),je.set(qe.key,U))}let Ne,ft=0;const Vt=ie-Me+1;let Qt=!1,X1=0;const so=new Array(Vt);for(U=0;U<Vt;U++)so[U]=0;for(U=_e;U<=le;U++){const qe=F[U];if(ft>=Vt){P(qe,G,Z,!0);continue}let en;if(qe.key!=null)en=je.get(qe.key);else for(Ne=Me;Ne<=ie;Ne++)if(so[Ne-Me]===0&&d1(qe,M[Ne])){en=Ne;break}en===void 0?P(qe,G,Z,!0):(so[en-Me]=U+1,en>=X1?X1=en:Qt=!0,v(qe,M[en],B,null,G,Z,te,Q,J),ft++)}const Q1=Qt?dp(so):fo;for(Ne=Q1.length-1,U=Vt-1;U>=0;U--){const qe=Me+U,en=M[qe],Zs=qe+1<ne?M[qe+1].el:Y;so[U]===0?v(null,en,B,Zs,G,Z,te,Q,J):Qt&&(Ne<0||U!==Q1[Ne]?z(en,B,Zs,2):Ne--)}}},z=(F,M,B,Y,G=null)=>{const{el:Z,type:te,transition:Q,children:J,shapeFlag:U}=F;if(U&6){z(F.component.subTree,M,B,Y);return}if(U&128){F.suspense.move(M,B,Y);return}if(U&64){te.move(F,M,B,Fe);return}if(te===Et){o(Z,M,B);for(let le=0;le<J.length;le++)z(J[le],M,B,Y);o(F.anchor,M,B);return}if(te===Mi){O(F,M,B);return}if(Y!==2&&U&1&&Q)if(Y===0)Q.beforeEnter(Z),o(Z,M,B),kt(()=>Q.enter(Z),G);else{const{leave:le,delayLeave:ie,afterLeave:_e}=Q,Me=()=>o(Z,M,B),je=()=>{le(Z,()=>{Me(),_e&&_e()})};ie?ie(Z,Me,je):je()}else o(Z,M,B)},P=(F,M,B,Y=!1,G=!1)=>{const{type:Z,props:te,ref:Q,children:J,dynamicChildren:U,shapeFlag:ne,patchFlag:le,dirs:ie,cacheIndex:_e}=F;if(le===-2&&(G=!1),Q!=null&&zl(Q,null,B,F,!0),_e!=null&&(M.renderCache[_e]=void 0),ne&256){M.ctx.deactivate(F);return}const Me=ne&1&&ie,je=!n1(F);let Ne;if(je&&(Ne=te&&te.onVnodeBeforeUnmount)&&wn(Ne,M,F),ne&6)E(F.component,B,Y);else{if(ne&128){F.suspense.unmount(B,Y);return}Me&&Tr(F,null,M,"beforeUnmount"),ne&64?F.type.remove(F,M,B,Fe,Y):U&&!U.hasOnce&&(Z!==Et||le>0&&le&64)?N(U,M,B,!1,!0):(Z===Et&&le&384||!G&&ne&16)&&N(J,M,B),Y&&m(F)}(je&&(Ne=te&&te.onVnodeUnmounted)||Me)&&kt(()=>{Ne&&wn(Ne,M,F),Me&&Tr(F,null,M,"unmounted")},B)},m=F=>{const{type:M,el:B,anchor:Y,transition:G}=F;if(M===Et){A.NODE_ENV!=="production"&&F.patchFlag>0&&F.patchFlag&2048&&G&&!G.persisted?F.children.forEach(te=>{te.type===jt?r(te.el):m(te)}):_(B,Y);return}if(M===Mi){T(F);return}const Z=()=>{r(B),G&&!G.persisted&&G.afterLeave&&G.afterLeave()};if(F.shapeFlag&1&&G&&!G.persisted){const{leave:te,delayLeave:Q}=G,J=()=>te(B,Z);Q?Q(F.el,Z,J):J()}else Z()},_=(F,M)=>{let B;for(;F!==M;)B=d(F),r(F),F=B;r(M)},E=(F,M,B)=>{A.NODE_ENV!=="production"&&F.type.__hmrId&&lh(F);const{bum:Y,scope:G,update:Z,subTree:te,um:Q,m:J,a:U}=F;r0(J),r0(U),Y&&Ko(Y),G.stop(),Z&&(Z.active=!1,P(te,F,M,B)),Q&&kt(Q,M),kt(()=>{F.isUnmounted=!0},M),M&&M.pendingBranch&&!M.isUnmounted&&F.asyncDep&&!F.asyncResolved&&F.suspenseId===M.pendingId&&(M.deps--,M.deps===0&&M.resolve()),A.NODE_ENV!=="production"&&ph(F)},N=(F,M,B,Y=!1,G=!1,Z=0)=>{for(let te=Z;te<F.length;te++)P(F[te],M,B,Y,G)},k=F=>{if(F.shapeFlag&6)return k(F.component.subTree);if(F.shapeFlag&128)return F.suspense.next();const M=d(F.anchor||F.el),B=M&&M[J3];return B?d(B):M};let q=!1;const oe=(F,M,B)=>{F==null?M._vnode&&P(M._vnode,null,null,!0):v(M._vnode||null,F,M,null,null,null,B),q||(q=!0,p3(),g3(),q=!1),M._vnode=F},Fe={p:v,um:P,m:z,r:m,mt:Ce,mc:V,pc:He,pbc:re,n:k,o:e};let Te,nt;return{render:oe,hydrate:Te,createApp:Uh(oe,Te)}}function kl({type:e,props:t},n){return n==="svg"&&e==="foreignObject"||n==="mathml"&&e==="annotation-xml"&&t&&t.encoding&&t.encoding.includes("html")?void 0:n}function Nr({effect:e,update:t},n){e.allowRecurse=t.allowRecurse=n}function up(e,t){return(!e||e&&!e.pendingBranch)&&t&&!t.persisted}function a1(e,t,n=!1){const o=e.children,r=t.children;if(pe(o)&&pe(r))for(let i=0;i<o.length;i++){const s=o[i];let l=r[i];l.shapeFlag&1&&!l.dynamicChildren&&((l.patchFlag<=0||l.patchFlag===32)&&(l=r[i]=dr(r[i]),l.el=s.el),!n&&l.patchFlag!==-2&&a1(s,l)),l.type===c1&&(l.el=s.el),A.NODE_ENV!=="production"&&l.type===jt&&!l.el&&(l.el=s.el)}}function dp(e){const t=e.slice(),n=[0];let o,r,i,s,l;const a=e.length;for(o=0;o<a;o++){const c=e[o];if(c!==0){if(r=n[n.length-1],e[r]<c){t[o]=r,n.push(o);continue}for(i=0,s=n.length-1;i<s;)l=i+s>>1,e[n[l]]<c?i=l+1:s=l;c<e[n[i]]&&(i>0&&(t[o]=n[i-1]),n[i]=o)}}for(i=n.length,s=n[i-1];i-- >0;)n[i]=s,s=t[s];return n}function n0(e){const t=e.subTree.component;if(t)return t.asyncDep&&!t.asyncResolved?t:n0(t)}function r0(e){if(e)for(let t=0;t<e.length;t++)e[t].active=!1}const hp=Symbol.for("v-scx"),pp=()=>{{const e=s1(hp);return e||A.NODE_ENV!=="production"&&X("Server rendering context not provided. Make sure to only call useSSRContext() conditionally in the server build."),e}};function qt(e,t){return Il(e,null,t)}const Ei={};function mt(e,t,n){return A.NODE_ENV!=="production"&&!ye(t)&&X("`watch(fn, options?)` signature has been moved to a separate API. Use `watchEffect(fn, options?)` instead. `watch` now only supports `watch(source, cb, options?) signature."),Il(e,t,n)}function Il(e,t,{immediate:n,deep:o,flush:r,once:i,onTrack:s,onTrigger:l}=Ue){if(t&&i){const x=t;t=(...I)=>{x(...I),S()}}A.NODE_ENV!=="production"&&o!==void 0&&typeof o=="number"&&X('watch() "deep" option with number value will be used as watch depth in future versions. Please use a boolean instead to avoid potential breakage.'),A.NODE_ENV!=="production"&&!t&&(n!==void 0&&X('watch() "immediate" option is only respected when using the watch(source, callback, options?) signature.'),o!==void 0&&X('watch() "deep" option is only respected when using the watch(source, callback, options?) signature.'),i!==void 0&&X('watch() "once" option is only respected when using the watch(source, callback, options?) signature.'));const a=x=>{X("Invalid watch source: ",x,"A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types.")},c=yt,f=x=>o===!0?x:fr(x,o===!1?1:void 0);let u,d=!1,h=!1;if(vt(e)?(u=()=>e.value,d=An(e)):ho(e)?(u=()=>f(e),d=!0):pe(e)?(h=!0,d=e.some(x=>ho(x)||An(x)),u=()=>e.map(x=>{if(vt(x))return x.value;if(ho(x))return f(x);if(ye(x))return Tn(x,c,2);A.NODE_ENV!=="production"&&a(x)})):ye(e)?t?u=()=>Tn(e,c,2):u=()=>(p&&p(),nn(e,c,3,[v])):(u=st,A.NODE_ENV!=="production"&&a(e)),t&&o){const x=u;u=()=>fr(x())}let p,v=x=>{p=O.onStop=()=>{Tn(x,c,4),p=O.onStop=void 0}},y;if(Ti)if(v=st,t?n&&nn(t,c,3,[u(),h?[]:void 0,v]):u(),r==="sync"){const x=pp();y=x.__watcherHandles||(x.__watcherHandles=[])}else return st;let g=h?new Array(e.length).fill(Ei):Ei;const w=()=>{if(!(!O.active||!O.dirty))if(t){const x=O.run();(o||d||(h?x.some((I,V)=>nr(I,g[V])):nr(x,g)))&&(p&&p(),nn(t,c,3,[x,g===Ei?void 0:h&&g[0]===Ei?[]:g,v]),g=x)}else O.run()};w.allowRecurse=!!t;let $;r==="sync"?$=w:r==="post"?$=()=>kt(w,c&&c.suspense):(w.pre=!0,c&&(w.id=c.uid),$=()=>wi(w));const O=new ll(u,st,$),T=sl(),S=()=>{O.stop(),T&&el(T.effects,O)};return A.NODE_ENV!=="production"&&(O.onTrack=s,O.onTrigger=l),t?n?w():g=O.run():r==="post"?kt(O.run.bind(O),c&&c.suspense):O.run(),y&&y.push(S),S}function gp(e,t,n){const o=this.proxy,r=tt(e)?e.includes(".")?o0(o,e):()=>o[e]:e.bind(o,o);let i;ye(t)?i=t:(i=t.handler,n=t);const s=h1(this),l=Il(r,i.bind(o),n);return s(),l}function o0(e,t){const n=t.split(".");return()=>{let o=e;for(let r=0;r<n.length&&o;r++)o=o[n[r]];return o}}function fr(e,t=1/0,n){if(t<=0||!Ve(e)||e.__v_skip||(n=n||new Set,n.has(e)))return e;if(n.add(e),t--,vt(e))fr(e.value,t,n);else if(pe(e))for(let o=0;o<e.length;o++)fr(e[o],t,n);else if(Ec(e)||Or(e))e.forEach(o=>{fr(o,t,n)});else if(Cc(e)){for(const o in e)fr(e[o],t,n);for(const o of Object.getOwnPropertySymbols(e))Object.prototype.propertyIsEnumerable.call(e,o)&&fr(e[o],t,n)}return e}const vp=(e,t)=>t==="modelValue"||t==="model-value"?e.modelModifiers:e[`${t}Modifiers`]||e[`${xt(t)}Modifiers`]||e[`${Nt(t)}Modifiers`];function mp(e,t,...n){if(e.isUnmounted)return;const o=e.vnode.props||Ue;if(A.NODE_ENV!=="production"){const{emitsOptions:f,propsOptions:[u]}=e;if(f)if(!(t in f))(!u||!(Pn(t)in u))&&X(`Component emitted event "${t}" but it is neither declared in the emits option nor as an "${Pn(t)}" prop.`);else{const d=f[t];ye(d)&&(d(...n)||X(`Invalid event arguments: event validation failed for event "${t}".`))}}let r=n;const i=t.startsWith("update:"),s=i&&vp(o,t.slice(7));if(s&&(s.trim&&(r=n.map(f=>tt(f)?f.trim():f)),s.number&&(r=n.map(h6))),A.NODE_ENV!=="production"&&mh(e,t,r),A.NODE_ENV!=="production"){const f=t.toLowerCase();f!==t&&o[Pn(f)]&&X(`Event "${f}" is emitted in component ${zi(e,e.type)} but the handler is registered for "${t}". Note that HTML attributes are case-insensitive and you cannot use v-on to listen to camelCase events when using in-DOM templates. You should probably use "${Nt(t)}" instead of "${t}".`)}let l,a=o[l=Pn(t)]||o[l=Pn(xt(t))];!a&&i&&(a=o[l=Pn(Nt(t))]),a&&nn(a,e,6,r);const c=o[l+"Once"];if(c){if(!e.emitted)e.emitted={};else if(e.emitted[l])return;e.emitted[l]=!0,nn(c,e,6,r)}}function i0(e,t,n=!1){const o=t.emitsCache,r=o.get(e);if(r!==void 0)return r;const i=e.emits;let s={},l=!1;if(!ye(e)){const a=c=>{const f=i0(c,t,!0);f&&(l=!0,lt(s,f))};!n&&t.mixins.length&&t.mixins.forEach(a),e.extends&&a(e.extends),e.mixins&&e.mixins.forEach(a)}return!i&&!l?(Ve(e)&&o.set(e,null),null):(pe(i)?i.forEach(a=>s[a]=null):lt(s,i),Ve(e)&&o.set(e,s),s)}function Pi(e,t){return!e||!Wo(t)?!1:(t=t.slice(2).replace(/Once$/,""),ke(e,t[0].toLowerCase()+t.slice(1))||ke(e,Nt(t))||ke(e,t))}let Bl=!1;function Ci(){Bl=!0}function Ll(e){const{type:t,vnode:n,proxy:o,withProxy:r,propsOptions:[i],slots:s,attrs:l,emit:a,render:c,renderCache:f,props:u,data:d,setupState:h,ctx:p,inheritAttrs:v}=e,y=Fi(e);let g,w;A.NODE_ENV!=="production"&&(Bl=!1);try{if(n.shapeFlag&4){const T=r||o,S=A.NODE_ENV!=="production"&&h.__isScriptSetup?new Proxy(T,{get(x,I,V){return X(`Property '${String(I)}' was accessed via 'this'. Avoid using 'this' in templates.`),Reflect.get(x,I,V)}}):T;g=on(c.call(S,T,f,A.NODE_ENV!=="production"?Ot(u):u,h,d,p)),w=l}else{const T=t;A.NODE_ENV!=="production"&&l===u&&Ci(),g=on(T.length>1?T(A.NODE_ENV!=="production"?Ot(u):u,A.NODE_ENV!=="production"?{get attrs(){return Ci(),Ot(l)},slots:s,emit:a}:{attrs:l,slots:s,emit:a}):T(A.NODE_ENV!=="production"?Ot(u):u,null)),w=t.props?l:yp(l)}}catch(T){f1.length=0,Jo(T,e,1),g=Be(jt)}let $=g,O;if(A.NODE_ENV!=="production"&&g.patchFlag>0&&g.patchFlag&2048&&([$,O]=s0(g)),w&&v!==!1){const T=Object.keys(w),{shapeFlag:S}=$;if(T.length){if(S&7)i&&T.some(ni)&&(w=wp(w,i)),$=In($,w,!1,!0);else if(A.NODE_ENV!=="production"&&!Bl&&$.type!==jt){const x=Object.keys(l),I=[],V=[];for(let W=0,re=x.length;W<re;W++){const K=x[W];Wo(K)?ni(K)||I.push(K[2].toLowerCase()+K.slice(3)):V.push(K)}V.length&&X(`Extraneous non-props attributes (${V.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes.`),I.length&&X(`Extraneous non-emits event listeners (${I.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes. If the listener is intended to be a component custom event listener only, declare it using the "emits" option.`)}}}return n.dirs&&(A.NODE_ENV!=="production"&&!l0($)&&X("Runtime directive used on component with non-element root node. The directives will not function as intended."),$=In($,null,!1,!0),$.dirs=$.dirs?$.dirs.concat(n.dirs):n.dirs),n.transition&&(A.NODE_ENV!=="production"&&!l0($)&&X("Component inside <Transition> renders non-element root node that cannot be animated."),$.transition=n.transition),A.NODE_ENV!=="production"&&O?O($):g=$,Fi(y),g}const s0=e=>{const t=e.children,n=e.dynamicChildren,o=Rl(t,!1);if(o){if(A.NODE_ENV!=="production"&&o.patchFlag>0&&o.patchFlag&2048)return s0(o)}else return[e,void 0];const r=t.indexOf(o),i=n?n.indexOf(o):-1,s=l=>{t[r]=l,n&&(i>-1?n[i]=l:l.patchFlag>0&&(e.dynamicChildren=[...n,l]))};return[on(o),s]};function Rl(e,t=!0){let n;for(let o=0;o<e.length;o++){const r=e[o];if(go(r)){if(r.type!==jt||r.children==="v-if"){if(n)return;if(n=r,A.NODE_ENV!=="production"&&t&&n.patchFlag>0&&n.patchFlag&2048)return Rl(n.children)}}else return}return n}const yp=e=>{let t;for(const n in e)(n==="class"||n==="style"||Wo(n))&&((t||(t={}))[n]=e[n]);return t},wp=(e,t)=>{const n={};for(const o in e)(!ni(o)||!(o.slice(9)in t))&&(n[o]=e[o]);return n},l0=e=>e.shapeFlag&7||e.type===jt;function _p(e,t,n){const{props:o,children:r,component:i}=e,{props:s,children:l,patchFlag:a}=t,c=i.emitsOptions;if(A.NODE_ENV!=="production"&&(r||l)&&ar||t.dirs||t.transition)return!0;if(n&&a>=0){if(a&1024)return!0;if(a&16)return o?a0(o,s,c):!!s;if(a&8){const f=t.dynamicProps;for(let u=0;u<f.length;u++){const d=f[u];if(s[d]!==o[d]&&!Pi(c,d))return!0}}}else return(r||l)&&(!l||!l.$stable)?!0:o===s?!1:o?s?a0(o,s,c):!0:!!s;return!1}function a0(e,t,n){const o=Object.keys(t);if(o.length!==Object.keys(e).length)return!0;for(let r=0;r<o.length;r++){const i=o[r];if(t[i]!==e[i]&&!Pi(n,i))return!0}return!1}function bp({vnode:e,parent:t},n){for(;t;){const o=t.subTree;if(o.suspense&&o.suspense.activeBranch===e&&(o.el=e.el),o===e)(e=t.vnode).el=n,t=t.parent;else break}}const Fp=e=>e.__isSuspense;function $p(e,t){t&&t.pendingBranch?pe(e)?t.effects.push(...e):t.effects.push(e):h3(e)}const Et=Symbol.for("v-fgt"),c1=Symbol.for("v-txt"),jt=Symbol.for("v-cmt"),Mi=Symbol.for("v-stc"),f1=[];let Ut=null;function ae(e=!1){f1.push(Ut=e?null:[])}function xp(){f1.pop(),Ut=f1[f1.length-1]||null}let u1=1;function c0(e){u1+=e,e<0&&Ut&&(Ut.hasOnce=!0)}function f0(e){return e.dynamicChildren=u1>0?Ut||fo:null,xp(),u1>0&&Ut&&Ut.push(e),e}function ur(e,t,n,o,r,i){return f0(rn(e,t,n,o,r,i,!0))}function we(e,t,n,o,r){return f0(Be(e,t,n,o,r,!0))}function go(e){return e?e.__v_isVNode===!0:!1}function d1(e,t){if(A.NODE_ENV!=="production"&&t.shapeFlag&6&&e.component){const n=_i.get(t.type);if(n&&n.has(e.component))return e.shapeFlag&=-257,t.shapeFlag&=-513,!1}return e.type===t.type&&e.key===t.key}const Op=(...e)=>d0(...e),u0=({key:e})=>e??null,Di=({ref:e,ref_key:t,ref_for:n})=>(typeof e=="number"&&(e=""+e),e!=null?tt(e)||vt(e)||ye(e)?{i:ht,r:e,k:t,f:!!n}:e:null);function rn(e,t=null,n=null,o=0,r=null,i=e===Et?0:1,s=!1,l=!1){const a={__v_isVNode:!0,__v_skip:!0,type:e,props:t,key:t&&u0(t),ref:t&&Di(t),scopeId:F3,slotScopeIds:null,children:n,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetStart:null,targetAnchor:null,staticCount:0,shapeFlag:i,patchFlag:o,dynamicProps:r,dynamicChildren:null,appContext:null,ctx:ht};return l?(Vl(a,n),i&128&&e.normalize(a)):n&&(a.shapeFlag|=tt(n)?8:16),A.NODE_ENV!=="production"&&a.key!==a.key&&X("VNode created with invalid key (NaN). VNode type:",a.type),u1>0&&!s&&Ut&&(a.patchFlag>0||i&6)&&a.patchFlag!==32&&Ut.push(a),a}const Be=A.NODE_ENV!=="production"?Op:d0;function d0(e,t=null,n=null,o=0,r=null,i=!1){if((!e||e===P3)&&(A.NODE_ENV!=="production"&&!e&&X(`Invalid vnode type when creating vnode: ${e}.`),e=jt),go(e)){const l=In(e,t,!0);return n&&Vl(l,n),u1>0&&!i&&Ut&&(l.shapeFlag&6?Ut[Ut.indexOf(e)]=l:Ut.push(l)),l.patchFlag=-2,l}if(_0(e)&&(e=e.__vccOpts),t){t=kr(t);let{class:l,style:a}=t;l&&!tt(l)&&(t.class=it(l)),Ve(a)&&(vi(a)&&!pe(a)&&(a=lt({},a)),t.style=Er(a))}const s=tt(e)?1:Fp(e)?128:op(e)?64:Ve(e)?4:ye(e)?2:0;return A.NODE_ENV!=="production"&&s&4&&vi(e)&&(e=Pe(e),X("Vue received a Component that was made a reactive object. This can lead to unnecessary performance overhead and should be avoided by marking the component with `markRaw` or using `shallowRef` instead of `ref`.",`
Component that was made reactive: `,e)),rn(e,t,n,o,r,s,i,!0)}function kr(e){return e?vi(e)||R3(e)?lt({},e):e:null}function In(e,t,n=!1,o=!1){const{props:r,ref:i,patchFlag:s,children:l,transition:a}=e,c=t?pt(r||{},t):r,f={__v_isVNode:!0,__v_skip:!0,type:e.type,props:c,key:c&&u0(c),ref:t&&t.ref?n&&i?pe(i)?i.concat(Di(t)):[i,Di(t)]:Di(t):i,scopeId:e.scopeId,slotScopeIds:e.slotScopeIds,children:A.NODE_ENV!=="production"&&s===-1&&pe(l)?l.map(h0):l,target:e.target,targetStart:e.targetStart,targetAnchor:e.targetAnchor,staticCount:e.staticCount,shapeFlag:e.shapeFlag,patchFlag:t&&e.type!==Et?s===-1?16:s|16:s,dynamicProps:e.dynamicProps,dynamicChildren:e.dynamicChildren,appContext:e.appContext,dirs:e.dirs,transition:a,component:e.component,suspense:e.suspense,ssContent:e.ssContent&&In(e.ssContent),ssFallback:e.ssFallback&&In(e.ssFallback),el:e.el,anchor:e.anchor,ctx:e.ctx,ce:e.ce};return a&&o&&x3(f,a.clone(f)),f}function h0(e){const t=In(e);return pe(e.children)&&(t.children=e.children.map(h0)),t}function vo(e=" ",t=0){return Be(c1,null,e,t)}function yn(e="",t=!1){return t?(ae(),we(jt,null,e)):Be(jt,null,e)}function on(e){return e==null||typeof e=="boolean"?Be(jt):pe(e)?Be(Et,null,e.slice()):typeof e=="object"?dr(e):Be(c1,null,String(e))}function dr(e){return e.el===null&&e.patchFlag!==-1||e.memo?e:In(e)}function Vl(e,t){let n=0;const{shapeFlag:o}=e;if(t==null)t=null;else if(pe(t))n=16;else if(typeof t=="object")if(o&65){const r=t.default;r&&(r._c&&(r._d=!1),Vl(e,r()),r._c&&(r._d=!0));return}else{n=32;const r=t._;!r&&!R3(t)?t._ctx=ht:r===3&&ht&&(ht.slots._===1?t._=1:(t._=2,e.patchFlag|=1024))}else ye(t)?(t={default:t,_ctx:ht},n=32):(t=String(t),o&64?(n=16,t=[vo(t)]):n=8);e.children=t,e.shapeFlag|=n}function pt(...e){const t={};for(let n=0;n<e.length;n++){const o=e[n];for(const r in o)if(r==="class")t.class!==o.class&&(t.class=it([t.class,o.class]));else if(r==="style")t.style=Er([t.style,o.style]);else if(Wo(r)){const i=t[r],s=o[r];s&&i!==s&&!(pe(i)&&i.includes(s))&&(t[r]=i?[].concat(i,s):s)}else r!==""&&(t[r]=o[r])}return t}function wn(e,t,n,o=null){nn(e,t,7,[n,o])}const Sp=k3();let Ep=0;function Pp(e,t,n){const o=e.type,r=(t?t.appContext:e.appContext)||Sp,i={uid:Ep++,vnode:e,type:o,parent:t,appContext:r,root:null,next:null,subTree:null,effect:null,update:null,scope:new zc(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:t?t.provides:Object.create(r.provides),accessCache:null,renderCache:[],components:null,directives:null,propsOptions:H3(o,r),emitsOptions:i0(o,r),emit:null,emitted:null,propsDefaults:Ue,inheritAttrs:o.inheritAttrs,ctx:Ue,data:Ue,props:Ue,attrs:Ue,slots:Ue,refs:Ue,setupState:Ue,setupContext:null,suspense:n,suspenseId:n?n.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return A.NODE_ENV!=="production"?i.ctx=Dh(i):i.ctx={_:i},i.root=t?t.root:i,i.emit=mp.bind(null,i),e.ce&&e.ce(i),i}let yt=null;const Bn=()=>yt||ht;let Ai,Hl;{const e=ol(),t=(n,o)=>{let r;return(r=e[n])||(r=e[n]=[]),r.push(o),i=>{r.length>1?r.forEach(s=>s(i)):r[0](i)}};Ai=t("__VUE_INSTANCE_SETTERS__",n=>yt=n),Hl=t("__VUE_SSR_SETTERS__",n=>Ti=n)}const h1=e=>{const t=yt;return Ai(e),e.scope.on(),()=>{e.scope.off(),Ai(t)}},p0=()=>{yt&&yt.scope.off(),Ai(null)},Cp=co("slot,component");function Ul(e,{isNativeTag:t}){(Cp(e)||t(e))&&X("Do not use built-in or reserved HTML elements as component id: "+e)}function g0(e){return e.vnode.shapeFlag&4}let Ti=!1;function Mp(e,t=!1,n=!1){t&&Hl(t);const{props:o,children:r}=e.vnode,i=g0(e);Wh(e,o,i,t),np(e,r,n);const s=i?Dp(e,t):void 0;return t&&Hl(!1),s}function Dp(e,t){var n;const o=e.type;if(A.NODE_ENV!=="production"){if(o.name&&Ul(o.name,e.appContext.config),o.components){const i=Object.keys(o.components);for(let s=0;s<i.length;s++)Ul(i[s],e.appContext.config)}if(o.directives){const i=Object.keys(o.directives);for(let s=0;s<i.length;s++)$3(i[s])}o.compilerOptions&&Ap()&&X('"compilerOptions" is only supported when using a build of Vue that includes the runtime compiler. Since you are using a runtime-only build, the options should be passed via your build tool config instead.')}e.accessCache=Object.create(null),e.proxy=new Proxy(e.ctx,A3),A.NODE_ENV!=="production"&&Ah(e);const{setup:r}=o;if(r){const i=e.setupContext=r.length>1?w0(e):null,s=h1(e);Cn();const l=Tn(r,e,0,[A.NODE_ENV!=="production"?Ot(e.props):e.props,i]);if(Mn(),s(),tl(l)){if(l.then(p0,p0),t)return l.then(a=>{v0(e,a,t)}).catch(a=>{Jo(a,e,0)});if(e.asyncDep=l,A.NODE_ENV!=="production"&&!e.suspense){const a=(n=o.name)!=null?n:"Anonymous";X(`Component <${a}>: setup function returned a promise, but no <Suspense> boundary was found in the parent component tree. A component with async setup() must be nested in a <Suspense> in order to be rendered.`)}}else v0(e,l,t)}else m0(e,t)}function v0(e,t,n){ye(t)?e.type.__ssrInlineRender?e.ssrRender=t:e.render=t:Ve(t)?(A.NODE_ENV!=="production"&&go(t)&&X("setup() should not return VNodes directly - return a render function instead."),A.NODE_ENV!=="production"&&(e.devtoolsRawSetupState=t),e.setupState=a3(t),A.NODE_ENV!=="production"&&Th(e)):A.NODE_ENV!=="production"&&t!==void 0&&X(`setup() should return an object. Received: ${t===null?"null":typeof t}`),m0(e,n)}let Wl;const Ap=()=>!Wl;function m0(e,t,n){const o=e.type;if(!e.render){if(!t&&Wl&&!o.render){const r=o.template||Ml(e).template;if(r){A.NODE_ENV!=="production"&&Nn(e,"compile");const{isCustomElement:i,compilerOptions:s}=e.appContext.config,{delimiters:l,compilerOptions:a}=o,c=lt(lt({isCustomElement:i,delimiters:l},s),a);o.render=Wl(r,c),A.NODE_ENV!=="production"&&kn(e,"compile")}}e.render=o.render||st}{const r=h1(e);Cn();try{Ih(e)}finally{Mn(),r()}}A.NODE_ENV!=="production"&&!o.render&&e.render===st&&!t&&(o.template?X('Component provided template option but runtime compilation is not supported in this build of Vue. Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".'):X("Component is missing template or render function: ",o))}const y0=A.NODE_ENV!=="production"?{get(e,t){return Ci(),bt(e,"get",""),e[t]},set(){return X("setupContext.attrs is readonly."),!1},deleteProperty(){return X("setupContext.attrs is readonly."),!1}}:{get(e,t){return bt(e,"get",""),e[t]}};function Tp(e){return new Proxy(e.slots,{get(t,n){return bt(e,"get","$slots"),t[n]}})}function w0(e){const t=n=>{if(A.NODE_ENV!=="production"&&(e.exposed&&X("expose() should be called only once per setup()."),n!=null)){let o=typeof n;o==="object"&&(pe(n)?o="array":vt(n)&&(o="ref")),o!=="object"&&X(`expose() should be passed a plain object, received ${o}.`)}e.exposed=n||{}};if(A.NODE_ENV!=="production"){let n,o;return Object.freeze({get attrs(){return n||(n=new Proxy(e.attrs,y0))},get slots(){return o||(o=Tp(e))},get emit(){return(r,...i)=>e.emit(r,...i)},expose:t})}else return{attrs:new Proxy(e.attrs,y0),slots:e.slots,emit:e.emit,expose:t}}function ji(e){return e.exposed?e.exposeProxy||(e.exposeProxy=new Proxy(a3(R6(e.exposed)),{get(t,n){if(n in t)return t[n];if(n in jr)return jr[n](e)},has(t,n){return n in t||n in jr}})):e.proxy}const jp=/(?:^|[-_])(\w)/g,zp=e=>e.replace(jp,t=>t.toUpperCase()).replace(/[-_]/g,"");function Gl(e,t=!0){return ye(e)?e.displayName||e.name:e.name||t&&e.__name}function zi(e,t,n=!1){let o=Gl(t);if(!o&&t.__file){const r=t.__file.match(/([^/\\]+)\.\w+$/);r&&(o=r[1])}if(!o&&e&&e.parent){const r=i=>{for(const s in i)if(i[s]===t)return s};o=r(e.components||e.parent.type.components)||r(e.appContext.components)}return o?zp(o):n?"App":"Anonymous"}function _0(e){return ye(e)&&"__vccOpts"in e}const Oe=(e,t)=>{const n=H6(e,t,Ti);if(A.NODE_ENV!=="production"){const o=Bn();o&&o.appContext.config.warnRecursiveComputed&&(n._warnRecursive=!0)}return n};function Ni(e,t,n){const o=arguments.length;return o===2?Ve(t)&&!pe(t)?go(t)?Be(e,null,[t]):Be(e,t):Be(e,null,t):(o>3?n=Array.prototype.slice.call(arguments,2):o===3&&go(n)&&(n=[n]),Be(e,t,n))}function Np(){if(A.NODE_ENV==="production"||typeof window>"u")return;const e={style:"color:#3ba776"},t={style:"color:#1677ff"},n={style:"color:#f5222d"},o={style:"color:#eb2f96"},r={__vue_custom_formatter:!0,header(u){return Ve(u)?u.__isVue?["div",e,"VueInstance"]:vt(u)?["div",{},["span",e,f(u)],"<",l(u.value),">"]:ho(u)?["div",{},["span",e,An(u)?"ShallowReactive":"Reactive"],"<",l(u),`>${Dn(u)?" (readonly)":""}`]:Dn(u)?["div",{},["span",e,An(u)?"ShallowReadonly":"Readonly"],"<",l(u),">"]:null:null},hasBody(u){return u&&u.__isVue},body(u){if(u&&u.__isVue)return["div",{},...i(u.$)]}};function i(u){const d=[];u.type.props&&u.props&&d.push(s("props",Pe(u.props))),u.setupState!==Ue&&d.push(s("setup",u.setupState)),u.data!==Ue&&d.push(s("data",Pe(u.data)));const h=a(u,"computed");h&&d.push(s("computed",h));const p=a(u,"inject");return p&&d.push(s("injected",p)),d.push(["div",{},["span",{style:o.style+";opacity:0.66"},"$ (internal): "],["object",{object:u}]]),d}function s(u,d){return d=lt({},d),Object.keys(d).length?["div",{style:"line-height:1.25em;margin-bottom:0.6em"},["div",{style:"color:#476582"},u],["div",{style:"padding-left:1.25em"},...Object.keys(d).map(h=>["div",{},["span",o,h+": "],l(d[h],!1)])]]:["span",{}]}function l(u,d=!0){return typeof u=="number"?["span",t,u]:typeof u=="string"?["span",n,JSON.stringify(u)]:typeof u=="boolean"?["span",o,u]:Ve(u)?["object",{object:d?Pe(u):u}]:["span",n,String(u)]}function a(u,d){const h=u.type;if(ye(h))return;const p={};for(const v in u.ctx)c(h,v,d)&&(p[v]=u.ctx[v]);return p}function c(u,d,h){const p=u[h];if(pe(p)&&p.includes(d)||Ve(p)&&d in p||u.extends&&c(u.extends,d,h)||u.mixins&&u.mixins.some(v=>c(v,d,h)))return!0}function f(u){return An(u)?"ShallowRef":u.effect?"ComputedRef":"Ref"}window.devtoolsFormatters?window.devtoolsFormatters.push(r):window.devtoolsFormatters=[r]}const b0="3.4.35",ki=A.NODE_ENV!=="production"?X:st;var Ln={};const kp="http://www.w3.org/2000/svg",Ip="http://www.w3.org/1998/Math/MathML",Rn=typeof document<"u"?document:null,F0=Rn&&Rn.createElement("template"),Bp={insert:(e,t,n)=>{t.insertBefore(e,n||null)},remove:e=>{const t=e.parentNode;t&&t.removeChild(e)},createElement:(e,t,n,o)=>{const r=t==="svg"?Rn.createElementNS(kp,e):t==="mathml"?Rn.createElementNS(Ip,e):n?Rn.createElement(e,{is:n}):Rn.createElement(e);return e==="select"&&o&&o.multiple!=null&&r.setAttribute("multiple",o.multiple),r},createText:e=>Rn.createTextNode(e),createComment:e=>Rn.createComment(e),setText:(e,t)=>{e.nodeValue=t},setElementText:(e,t)=>{e.textContent=t},parentNode:e=>e.parentNode,nextSibling:e=>e.nextSibling,querySelector:e=>Rn.querySelector(e),setScopeId(e,t){e.setAttribute(t,"")},insertStaticContent(e,t,n,o,r,i){const s=n?n.previousSibling:t.lastChild;if(r&&(r===i||r.nextSibling))for(;t.insertBefore(r.cloneNode(!0),n),!(r===i||!(r=r.nextSibling)););else{F0.innerHTML=o==="svg"?`<svg>${e}</svg>`:o==="mathml"?`<math>${e}</math>`:e;const l=F0.content;if(o==="svg"||o==="mathml"){const a=l.firstChild;for(;a.firstChild;)l.appendChild(a.firstChild);l.removeChild(a)}t.insertBefore(l,n)}return[s?s.nextSibling:t.firstChild,n?n.previousSibling:t.lastChild]}},Lp=Symbol("_vtc");function Rp(e,t,n){const o=e[Lp];o&&(t=(t?[t,...o]:[...o]).join(" ")),t==null?e.removeAttribute("class"):n?e.setAttribute("class",t):e.className=t}const Ii=Symbol("_vod"),$0=Symbol("_vsh"),x0={beforeMount(e,{value:t},{transition:n}){e[Ii]=e.style.display==="none"?"":e.style.display,n&&t?n.beforeEnter(e):p1(e,t)},mounted(e,{value:t},{transition:n}){n&&t&&n.enter(e)},updated(e,{value:t,oldValue:n},{transition:o}){!t!=!n&&(o?t?(o.beforeEnter(e),p1(e,!0),o.enter(e)):o.leave(e,()=>{p1(e,!1)}):p1(e,t))},beforeUnmount(e,{value:t}){p1(e,t)}};Ln.NODE_ENV!=="production"&&(x0.name="show");function p1(e,t){e.style.display=t?e[Ii]:"none",e[$0]=!t}const Vp=Symbol(Ln.NODE_ENV!=="production"?"CSS_VAR_TEXT":""),Hp=/(^|;)\s*display\s*:/;function Up(e,t,n){const o=e.style,r=tt(n);let i=!1;if(n&&!r){if(t)if(tt(t))for(const s of t.split(";")){const l=s.slice(0,s.indexOf(":")).trim();n[l]==null&&Bi(o,l,"")}else for(const s in t)n[s]==null&&Bi(o,s,"");for(const s in n)s==="display"&&(i=!0),Bi(o,s,n[s])}else if(r){if(t!==n){const s=o[Vp];s&&(n+=";"+s),o.cssText=n,i=Hp.test(n)}}else t&&e.removeAttribute("style");Ii in e&&(e[Ii]=i?o.display:"",e[$0]&&(o.display="none"))}const Wp=/[^\\];\s*$/,O0=/\s*!important$/;function Bi(e,t,n){if(pe(n))n.forEach(o=>Bi(e,t,o));else if(n==null&&(n=""),Ln.NODE_ENV!=="production"&&Wp.test(n)&&ki(`Unexpected semicolon at the end of '${t}' style value: '${n}'`),t.startsWith("--"))e.setProperty(t,n);else{const o=Gp(e,t);O0.test(n)?e.setProperty(Nt(o),n.replace(O0,""),"important"):e[o]=n}}const S0=["Webkit","Moz","ms"],Kl={};function Gp(e,t){const n=Kl[t];if(n)return n;let o=xt(t);if(o!=="filter"&&o in e)return Kl[t]=o;o=Sr(o);for(let r=0;r<S0.length;r++){const i=S0[r]+o;if(i in e)return Kl[t]=i}return t}const E0="http://www.w3.org/1999/xlink";function P0(e,t,n,o,r,i=y6(t)){o&&t.startsWith("xlink:")?n==null?e.removeAttributeNS(E0,t.slice(6,t.length)):e.setAttributeNS(E0,t,n):n==null||i&&!Ac(n)?e.removeAttribute(t):e.setAttribute(t,i?"":tr(n)?String(n):n)}function Kp(e,t,n,o){if(t==="innerHTML"||t==="textContent"){if(n==null)return;e[t]=n;return}const r=e.tagName;if(t==="value"&&r!=="PROGRESS"&&!r.includes("-")){const s=r==="OPTION"?e.getAttribute("value")||"":e.value,l=n==null?"":String(n);(s!==l||!("_value"in e))&&(e.value=l),n==null&&e.removeAttribute(t),e._value=n;return}let i=!1;if(n===""||n==null){const s=typeof e[t];s==="boolean"?n=Ac(n):n==null&&s==="string"?(n="",i=!0):s==="number"&&(n=0,i=!0)}try{e[t]=n}catch(s){Ln.NODE_ENV!=="production"&&!i&&ki(`Failed setting prop "${t}" on <${r.toLowerCase()}>: value ${n} is invalid.`,s)}i&&e.removeAttribute(t)}function qp(e,t,n,o){e.addEventListener(t,n,o)}function Yp(e,t,n,o){e.removeEventListener(t,n,o)}const C0=Symbol("_vei");function Zp(e,t,n,o,r=null){const i=e[C0]||(e[C0]={}),s=i[t];if(o&&s)s.value=Ln.NODE_ENV!=="production"?D0(o,t):o;else{const[l,a]=Jp(t);if(o){const c=i[t]=e8(Ln.NODE_ENV!=="production"?D0(o,t):o,r);qp(e,l,c,a)}else s&&(Yp(e,l,s,a),i[t]=void 0)}}const M0=/(?:Once|Passive|Capture)$/;function Jp(e){let t;if(M0.test(e)){t={};let o;for(;o=e.match(M0);)e=e.slice(0,e.length-o[0].length),t[o[0].toLowerCase()]=!0}return[e[2]===":"?e.slice(3):Nt(e.slice(2)),t]}let ql=0;const Xp=Promise.resolve(),Qp=()=>ql||(Xp.then(()=>ql=0),ql=Date.now());function e8(e,t){const n=o=>{if(!o._vts)o._vts=Date.now();else if(o._vts<=n.attached)return;nn(t8(o,n.value),t,5,[o])};return n.value=e,n.attached=Qp(),n}function D0(e,t){return ye(e)||pe(e)?e:(ki(`Wrong type passed as event handler to ${t} - did you forget @ or : in front of your prop?
Expected function or array of functions, received type ${typeof e}.`),st)}function t8(e,t){if(pe(t)){const n=e.stopImmediatePropagation;return e.stopImmediatePropagation=()=>{n.call(e),e._stopped=!0},t.map(o=>r=>!r._stopped&&o&&o(r))}else return t}const A0=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&e.charCodeAt(2)>96&&e.charCodeAt(2)<123,n8=(e,t,n,o,r,i)=>{const s=r==="svg";t==="class"?Rp(e,o,s):t==="style"?Up(e,n,o):Wo(t)?ni(t)||Zp(e,t,n,o,i):(t[0]==="."?(t=t.slice(1),!0):t[0]==="^"?(t=t.slice(1),!1):r8(e,t,o,s))?(Kp(e,t,o),!e.tagName.includes("-")&&(t==="value"||t==="checked"||t==="selected")&&P0(e,t,o,s,i,t!=="value")):(t==="true-value"?e._trueValue=o:t==="false-value"&&(e._falseValue=o),P0(e,t,o,s))};function r8(e,t,n,o){if(o)return!!(t==="innerHTML"||t==="textContent"||t in e&&A0(t)&&ye(n));if(t==="spellcheck"||t==="draggable"||t==="translate"||t==="form"||t==="list"&&e.tagName==="INPUT"||t==="type"&&e.tagName==="TEXTAREA")return!1;if(t==="width"||t==="height"){const r=e.tagName;if(r==="IMG"||r==="VIDEO"||r==="CANVAS"||r==="SOURCE")return!1}return A0(t)&&tt(n)?!1:t in e}/*! #__NO_SIDE_EFFECTS__ */function g1(e,t,n){const o=ve(e,t);class r extends Yl{constructor(s){super(o,s,n)}}return r.def=o,r}const o8=typeof HTMLElement<"u"?HTMLElement:class{};class Yl extends o8{constructor(t,n={},o){super(),this._def=t,this._props=n,this._instance=null,this._connected=!1,this._resolved=!1,this._numberProps=null,this._ob=null,this.shadowRoot&&o?o(this._createVNode(),this.shadowRoot):(Ln.NODE_ENV!=="production"&&this.shadowRoot&&ki("Custom element has pre-rendered declarative shadow root but is not defined as hydratable. Use `defineSSRCustomElement`."),this.attachShadow({mode:"open"}),this._def.__asyncLoader||this._resolveProps(this._def))}connectedCallback(){this._connected=!0,this._instance||(this._resolved?this._update():this._resolveDef())}disconnectedCallback(){this._connected=!1,lr(()=>{this._connected||(this._ob&&(this._ob.disconnect(),this._ob=null),j0(null,this.shadowRoot),this._instance=null)})}_resolveDef(){this._resolved=!0;for(let o=0;o<this.attributes.length;o++)this._setAttr(this.attributes[o].name);this._ob=new MutationObserver(o=>{for(const r of o)this._setAttr(r.attributeName)}),this._ob.observe(this,{attributes:!0});const t=(o,r=!1)=>{const{props:i,styles:s}=o;let l;if(i&&!pe(i))for(const a in i){const c=i[a];(c===Number||c&&c.type===Number)&&(a in this._props&&(this._props[a]=Mc(this._props[a])),(l||(l=Object.create(null)))[xt(a)]=!0)}this._numberProps=l,r&&this._resolveProps(o),this._applyStyles(s),this._update()},n=this._def.__asyncLoader;n?n().then(o=>t(o,!0)):t(this._def)}_resolveProps(t){const{props:n}=t,o=pe(n)?n:Object.keys(n||{});for(const r of Object.keys(this))r[0]!=="_"&&o.includes(r)&&this._setProp(r,this[r],!0,!1);for(const r of o.map(xt))Object.defineProperty(this,r,{get(){return this._getProp(r)},set(i){this._setProp(r,i)}})}_setAttr(t){let n=this.hasAttribute(t)?this.getAttribute(t):void 0;const o=xt(t);this._numberProps&&this._numberProps[o]&&(n=Mc(n)),this._setProp(o,n,!1)}_getProp(t){return this._props[t]}_setProp(t,n,o=!0,r=!0){n!==this._props[t]&&(this._props[t]=n,r&&this._instance&&this._update(),o&&(n===!0?this.setAttribute(Nt(t),""):typeof n=="string"||typeof n=="number"?this.setAttribute(Nt(t),n+""):n||this.removeAttribute(Nt(t))))}_update(){j0(this._createVNode(),this.shadowRoot)}_createVNode(){const t=Be(this._def,lt({},this._props));return this._instance||(t.ce=n=>{this._instance=n,n.isCE=!0,Ln.NODE_ENV!=="production"&&(n.ceReload=i=>{this._styles&&(this._styles.forEach(s=>this.shadowRoot.removeChild(s)),this._styles.length=0),this._applyStyles(i),this._instance=null,this._update()});const o=(i,s)=>{this.dispatchEvent(new CustomEvent(i,{detail:s}))};n.emit=(i,...s)=>{o(i,s),Nt(i)!==i&&o(Nt(i),s)};let r=this;for(;r=r&&(r.parentNode||r.host);)if(r instanceof Yl){n.parent=r._instance,n.provides=r._instance.provides;break}}),t}_applyStyles(t){t&&t.forEach(n=>{const o=document.createElement("style");o.textContent=n,this.shadowRoot.appendChild(o),Ln.NODE_ENV!=="production"&&(this._styles||(this._styles=[])).push(o)})}}const i8=["ctrl","shift","alt","meta"],s8={stop:e=>e.stopPropagation(),prevent:e=>e.preventDefault(),self:e=>e.target!==e.currentTarget,ctrl:e=>!e.ctrlKey,shift:e=>!e.shiftKey,alt:e=>!e.altKey,meta:e=>!e.metaKey,left:e=>"button"in e&&e.button!==0,middle:e=>"button"in e&&e.button!==1,right:e=>"button"in e&&e.button!==2,exact:(e,t)=>i8.some(n=>e[`${n}Key`]&&!t.includes(n))},l8=(e,t)=>{const n=e._withMods||(e._withMods={}),o=t.join(".");return n[o]||(n[o]=(r,...i)=>{for(let s=0;s<t.length;s++){const l=s8[t[s]];if(l&&l(r,t))return}return e(r,...i)})},a8=lt({patchProp:n8},Bp);let T0;function c8(){return T0||(T0=cp(a8))}const j0=(...e)=>{c8().render(...e)};var f8={};function u8(){Np()}f8.NODE_ENV!=="production"&&u8();const d8=["top","right","bottom","left"],hr=Math.min,Wt=Math.max,Li=Math.round,Ri=Math.floor,pr=e=>({x:e,y:e}),h8={left:"right",right:"left",bottom:"top",top:"bottom"},p8={start:"end",end:"start"};function Zl(e,t,n){return Wt(e,hr(t,n))}function Vn(e,t){return typeof e=="function"?e(t):e}function Hn(e){return e.split("-")[0]}function mo(e){return e.split("-")[1]}function Jl(e){return e==="x"?"y":"x"}function Xl(e){return e==="y"?"height":"width"}function yo(e){return["top","bottom"].includes(Hn(e))?"y":"x"}function Ql(e){return Jl(yo(e))}function g8(e,t,n){n===void 0&&(n=!1);const o=mo(e),r=Ql(e),i=Xl(r);let s=r==="x"?o===(n?"end":"start")?"right":"left":o==="start"?"bottom":"top";return t.reference[i]>t.floating[i]&&(s=Vi(s)),[s,Vi(s)]}function v8(e){const t=Vi(e);return[ea(e),t,ea(t)]}function ea(e){return e.replace(/start|end/g,t=>p8[t])}function m8(e,t,n){const o=["left","right"],r=["right","left"],i=["top","bottom"],s=["bottom","top"];switch(e){case"top":case"bottom":return n?t?r:o:t?o:r;case"left":case"right":return t?i:s;default:return[]}}function y8(e,t,n,o){const r=mo(e);let i=m8(Hn(e),n==="start",o);return r&&(i=i.map(s=>s+"-"+r),t&&(i=i.concat(i.map(ea)))),i}function Vi(e){return e.replace(/left|right|bottom|top/g,t=>h8[t])}function w8(e){return{top:0,right:0,bottom:0,left:0,...e}}function z0(e){return typeof e!="number"?w8(e):{top:e,right:e,bottom:e,left:e}}function Hi(e){const{x:t,y:n,width:o,height:r}=e;return{width:o,height:r,top:n,left:t,right:t+o,bottom:n+r,x:t,y:n}}function N0(e,t,n){let{reference:o,floating:r}=e;const i=yo(t),s=Ql(t),l=Xl(s),a=Hn(t),c=i==="y",f=o.x+o.width/2-r.width/2,u=o.y+o.height/2-r.height/2,d=o[l]/2-r[l]/2;let h;switch(a){case"top":h={x:f,y:o.y-r.height};break;case"bottom":h={x:f,y:o.y+o.height};break;case"right":h={x:o.x+o.width,y:u};break;case"left":h={x:o.x-r.width,y:u};break;default:h={x:o.x,y:o.y}}switch(mo(t)){case"start":h[s]-=d*(n&&c?-1:1);break;case"end":h[s]+=d*(n&&c?-1:1);break}return h}const _8=async(e,t,n)=>{const{placement:o="bottom",strategy:r="absolute",middleware:i=[],platform:s}=n,l=i.filter(Boolean),a=await(s.isRTL==null?void 0:s.isRTL(t));let c=await s.getElementRects({reference:e,floating:t,strategy:r}),{x:f,y:u}=N0(c,o,a),d=o,h={},p=0;for(let v=0;v<l.length;v++){const{name:y,fn:g}=l[v],{x:w,y:$,data:O,reset:T}=await g({x:f,y:u,initialPlacement:o,placement:d,strategy:r,middlewareData:h,rects:c,platform:s,elements:{reference:e,floating:t}});f=w??f,u=$??u,h={...h,[y]:{...h[y],...O}},T&&p<=50&&(p++,typeof T=="object"&&(T.placement&&(d=T.placement),T.rects&&(c=T.rects===!0?await s.getElementRects({reference:e,floating:t,strategy:r}):T.rects),{x:f,y:u}=N0(c,d,a)),v=-1)}return{x:f,y:u,placement:d,strategy:r,middlewareData:h}};async function v1(e,t){var n;t===void 0&&(t={});const{x:o,y:r,platform:i,rects:s,elements:l,strategy:a}=e,{boundary:c="clippingAncestors",rootBoundary:f="viewport",elementContext:u="floating",altBoundary:d=!1,padding:h=0}=Vn(t,e),p=z0(h),y=l[d?u==="floating"?"reference":"floating":u],g=Hi(await i.getClippingRect({element:(n=await(i.isElement==null?void 0:i.isElement(y)))==null||n?y:y.contextElement||await(i.getDocumentElement==null?void 0:i.getDocumentElement(l.floating)),boundary:c,rootBoundary:f,strategy:a})),w=u==="floating"?{...s.floating,x:o,y:r}:s.reference,$=await(i.getOffsetParent==null?void 0:i.getOffsetParent(l.floating)),O=await(i.isElement==null?void 0:i.isElement($))?await(i.getScale==null?void 0:i.getScale($))||{x:1,y:1}:{x:1,y:1},T=Hi(i.convertOffsetParentRelativeRectToViewportRelativeRect?await i.convertOffsetParentRelativeRectToViewportRelativeRect({elements:l,rect:w,offsetParent:$,strategy:a}):w);return{top:(g.top-T.top+p.top)/O.y,bottom:(T.bottom-g.bottom+p.bottom)/O.y,left:(g.left-T.left+p.left)/O.x,right:(T.right-g.right+p.right)/O.x}}const b8=e=>({name:"arrow",options:e,async fn(t){const{x:n,y:o,placement:r,rects:i,platform:s,elements:l,middlewareData:a}=t,{element:c,padding:f=0}=Vn(e,t)||{};if(c==null)return{};const u=z0(f),d={x:n,y:o},h=Ql(r),p=Xl(h),v=await s.getDimensions(c),y=h==="y",g=y?"top":"left",w=y?"bottom":"right",$=y?"clientHeight":"clientWidth",O=i.reference[p]+i.reference[h]-d[h]-i.floating[p],T=d[h]-i.reference[h],S=await(s.getOffsetParent==null?void 0:s.getOffsetParent(c));let x=S?S[$]:0;(!x||!await(s.isElement==null?void 0:s.isElement(S)))&&(x=l.floating[$]||i.floating[p]);const I=O/2-T/2,V=x/2-v[p]/2-1,W=hr(u[g],V),re=hr(u[w],V),K=W,Ee=x-v[p]-re,de=x/2-v[p]/2+I,Ce=Zl(K,de,Ee),be=!a.arrow&&mo(r)!=null&&de!==Ce&&i.reference[p]/2-(de<K?W:re)-v[p]/2<0,fe=be?de<K?de-K:de-Ee:0;return{[h]:d[h]+fe,data:{[h]:Ce,centerOffset:de-Ce-fe,...be&&{alignmentOffset:fe}},reset:be}}}),F8=function(e){return e===void 0&&(e={}),{name:"flip",options:e,async fn(t){var n,o;const{placement:r,middlewareData:i,rects:s,initialPlacement:l,platform:a,elements:c}=t,{mainAxis:f=!0,crossAxis:u=!0,fallbackPlacements:d,fallbackStrategy:h="bestFit",fallbackAxisSideDirection:p="none",flipAlignment:v=!0,...y}=Vn(e,t);if((n=i.arrow)!=null&&n.alignmentOffset)return{};const g=Hn(r),w=Hn(l)===l,$=await(a.isRTL==null?void 0:a.isRTL(c.floating)),O=d||(w||!v?[Vi(l)]:v8(l));!d&&p!=="none"&&O.push(...y8(l,v,p,$));const T=[l,...O],S=await v1(t,y),x=[];let I=((o=i.flip)==null?void 0:o.overflows)||[];if(f&&x.push(S[g]),u){const K=g8(r,s,$);x.push(S[K[0]],S[K[1]])}if(I=[...I,{placement:r,overflows:x}],!x.every(K=>K<=0)){var V,W;const K=(((V=i.flip)==null?void 0:V.index)||0)+1,Ee=T[K];if(Ee)return{data:{index:K,overflows:I},reset:{placement:Ee}};let de=(W=I.filter(Ce=>Ce.overflows[0]<=0).sort((Ce,be)=>Ce.overflows[1]-be.overflows[1])[0])==null?void 0:W.placement;if(!de)switch(h){case"bestFit":{var re;const Ce=(re=I.map(be=>[be.placement,be.overflows.filter(fe=>fe>0).reduce((fe,me)=>fe+me,0)]).sort((be,fe)=>be[1]-fe[1])[0])==null?void 0:re[0];Ce&&(de=Ce);break}case"initialPlacement":de=l;break}if(r!==de)return{reset:{placement:de}}}return{}}}};function k0(e,t){return{top:e.top-t.height,right:e.right-t.width,bottom:e.bottom-t.height,left:e.left-t.width}}function I0(e){return d8.some(t=>e[t]>=0)}const $8=function(e){return e===void 0&&(e={}),{name:"hide",options:e,async fn(t){const{rects:n}=t,{strategy:o="referenceHidden",...r}=Vn(e,t);switch(o){case"referenceHidden":{const i=await v1(t,{...r,elementContext:"reference"}),s=k0(i,n.reference);return{data:{referenceHiddenOffsets:s,referenceHidden:I0(s)}}}case"escaped":{const i=await v1(t,{...r,altBoundary:!0}),s=k0(i,n.floating);return{data:{escapedOffsets:s,escaped:I0(s)}}}default:return{}}}}};async function x8(e,t){const{placement:n,platform:o,elements:r}=e,i=await(o.isRTL==null?void 0:o.isRTL(r.floating)),s=Hn(n),l=mo(n),a=yo(n)==="y",c=["left","top"].includes(s)?-1:1,f=i&&a?-1:1,u=Vn(t,e);let{mainAxis:d,crossAxis:h,alignmentAxis:p}=typeof u=="number"?{mainAxis:u,crossAxis:0,alignmentAxis:null}:{mainAxis:0,crossAxis:0,alignmentAxis:null,...u};return l&&typeof p=="number"&&(h=l==="end"?p*-1:p),a?{x:h*f,y:d*c}:{x:d*c,y:h*f}}const O8=function(e){return e===void 0&&(e=0),{name:"offset",options:e,async fn(t){var n,o;const{x:r,y:i,placement:s,middlewareData:l}=t,a=await x8(t,e);return s===((n=l.offset)==null?void 0:n.placement)&&(o=l.arrow)!=null&&o.alignmentOffset?{}:{x:r+a.x,y:i+a.y,data:{...a,placement:s}}}}},S8=function(e){return e===void 0&&(e={}),{name:"shift",options:e,async fn(t){const{x:n,y:o,placement:r}=t,{mainAxis:i=!0,crossAxis:s=!1,limiter:l={fn:y=>{let{x:g,y:w}=y;return{x:g,y:w}}},...a}=Vn(e,t),c={x:n,y:o},f=await v1(t,a),u=yo(Hn(r)),d=Jl(u);let h=c[d],p=c[u];if(i){const y=d==="y"?"top":"left",g=d==="y"?"bottom":"right",w=h+f[y],$=h-f[g];h=Zl(w,h,$)}if(s){const y=u==="y"?"top":"left",g=u==="y"?"bottom":"right",w=p+f[y],$=p-f[g];p=Zl(w,p,$)}const v=l.fn({...t,[d]:h,[u]:p});return{...v,data:{x:v.x-n,y:v.y-o}}}}},E8=function(e){return e===void 0&&(e={}),{options:e,fn(t){const{x:n,y:o,placement:r,rects:i,middlewareData:s}=t,{offset:l=0,mainAxis:a=!0,crossAxis:c=!0}=Vn(e,t),f={x:n,y:o},u=yo(r),d=Jl(u);let h=f[d],p=f[u];const v=Vn(l,t),y=typeof v=="number"?{mainAxis:v,crossAxis:0}:{mainAxis:0,crossAxis:0,...v};if(a){const $=d==="y"?"height":"width",O=i.reference[d]-i.floating[$]+y.mainAxis,T=i.reference[d]+i.reference[$]-y.mainAxis;h<O?h=O:h>T&&(h=T)}if(c){var g,w;const $=d==="y"?"width":"height",O=["top","left"].includes(Hn(r)),T=i.reference[u]-i.floating[$]+(O&&((g=s.offset)==null?void 0:g[u])||0)+(O?0:y.crossAxis),S=i.reference[u]+i.reference[$]+(O?0:((w=s.offset)==null?void 0:w[u])||0)-(O?y.crossAxis:0);p<T?p=T:p>S&&(p=S)}return{[d]:h,[u]:p}}}},P8=function(e){return e===void 0&&(e={}),{name:"size",options:e,async fn(t){const{placement:n,rects:o,platform:r,elements:i}=t,{apply:s=()=>{},...l}=Vn(e,t),a=await v1(t,l),c=Hn(n),f=mo(n),u=yo(n)==="y",{width:d,height:h}=o.floating;let p,v;c==="top"||c==="bottom"?(p=c,v=f===(await(r.isRTL==null?void 0:r.isRTL(i.floating))?"start":"end")?"left":"right"):(v=c,p=f==="end"?"top":"bottom");const y=h-a[p],g=d-a[v],w=!t.middlewareData.shift;let $=y,O=g;if(u){const S=d-a.left-a.right;O=f||w?hr(g,S):S}else{const S=h-a.top-a.bottom;$=f||w?hr(y,S):S}if(w&&!f){const S=Wt(a.left,0),x=Wt(a.right,0),I=Wt(a.top,0),V=Wt(a.bottom,0);u?O=d-2*(S!==0||x!==0?S+x:Wt(a.left,a.right)):$=h-2*(I!==0||V!==0?I+V:Wt(a.top,a.bottom))}await s({...t,availableWidth:O,availableHeight:$});const T=await r.getDimensions(i.floating);return d!==T.width||h!==T.height?{reset:{rects:!0}}:{}}}};function Ir(e){return ta(e)?(e.nodeName||"").toLowerCase():"#document"}function Gt(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function Un(e){var t;return(t=(ta(e)?e.ownerDocument:e.document)||window.document)==null?void 0:t.documentElement}function ta(e){return e instanceof Node||e instanceof Gt(e).Node}function sn(e){return e instanceof Element||e instanceof Gt(e).Element}function _n(e){return e instanceof HTMLElement||e instanceof Gt(e).HTMLElement}function B0(e){return typeof ShadowRoot>"u"?!1:e instanceof ShadowRoot||e instanceof Gt(e).ShadowRoot}function m1(e){const{overflow:t,overflowX:n,overflowY:o,display:r}=ln(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+n)&&!["inline","contents"].includes(r)}function C8(e){return["table","td","th"].includes(Ir(e))}function Ui(e){return[":popover-open",":modal"].some(t=>{try{return e.matches(t)}catch{return!1}})}function na(e){const t=ra(),n=sn(e)?ln(e):e;return n.transform!=="none"||n.perspective!=="none"||(n.containerType?n.containerType!=="normal":!1)||!t&&(n.backdropFilter?n.backdropFilter!=="none":!1)||!t&&(n.filter?n.filter!=="none":!1)||["transform","perspective","filter"].some(o=>(n.willChange||"").includes(o))||["paint","layout","strict","content"].some(o=>(n.contain||"").includes(o))}function M8(e){let t=gr(e);for(;_n(t)&&!wo(t);){if(na(t))return t;if(Ui(t))return null;t=gr(t)}return null}function ra(){return typeof CSS>"u"||!CSS.supports?!1:CSS.supports("-webkit-backdrop-filter","none")}function wo(e){return["html","body","#document"].includes(Ir(e))}function ln(e){return Gt(e).getComputedStyle(e)}function Wi(e){return sn(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function gr(e){if(Ir(e)==="html")return e;const t=e.assignedSlot||e.parentNode||B0(e)&&e.host||Un(e);return B0(t)?t.host:t}function L0(e){const t=gr(e);return wo(t)?e.ownerDocument?e.ownerDocument.body:e.body:_n(t)&&m1(t)?t:L0(t)}function y1(e,t,n){var o;t===void 0&&(t=[]),n===void 0&&(n=!0);const r=L0(e),i=r===((o=e.ownerDocument)==null?void 0:o.body),s=Gt(r);return i?t.concat(s,s.visualViewport||[],m1(r)?r:[],s.frameElement&&n?y1(s.frameElement):[]):t.concat(r,y1(r,[],n))}function R0(e){const t=ln(e);let n=parseFloat(t.width)||0,o=parseFloat(t.height)||0;const r=_n(e),i=r?e.offsetWidth:n,s=r?e.offsetHeight:o,l=Li(n)!==i||Li(o)!==s;return l&&(n=i,o=s),{width:n,height:o,$:l}}function oa(e){return sn(e)?e:e.contextElement}function _o(e){const t=oa(e);if(!_n(t))return pr(1);const n=t.getBoundingClientRect(),{width:o,height:r,$:i}=R0(t);let s=(i?Li(n.width):n.width)/o,l=(i?Li(n.height):n.height)/r;return(!s||!Number.isFinite(s))&&(s=1),(!l||!Number.isFinite(l))&&(l=1),{x:s,y:l}}const D8=pr(0);function V0(e){const t=Gt(e);return!ra()||!t.visualViewport?D8:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function A8(e,t,n){return t===void 0&&(t=!1),!n||t&&n!==Gt(e)?!1:t}function Br(e,t,n,o){t===void 0&&(t=!1),n===void 0&&(n=!1);const r=e.getBoundingClientRect(),i=oa(e);let s=pr(1);t&&(o?sn(o)&&(s=_o(o)):s=_o(e));const l=A8(i,n,o)?V0(i):pr(0);let a=(r.left+l.x)/s.x,c=(r.top+l.y)/s.y,f=r.width/s.x,u=r.height/s.y;if(i){const d=Gt(i),h=o&&sn(o)?Gt(o):o;let p=d,v=p.frameElement;for(;v&&o&&h!==p;){const y=_o(v),g=v.getBoundingClientRect(),w=ln(v),$=g.left+(v.clientLeft+parseFloat(w.paddingLeft))*y.x,O=g.top+(v.clientTop+parseFloat(w.paddingTop))*y.y;a*=y.x,c*=y.y,f*=y.x,u*=y.y,a+=$,c+=O,p=Gt(v),v=p.frameElement}}return Hi({width:f,height:u,x:a,y:c})}function T8(e){let{elements:t,rect:n,offsetParent:o,strategy:r}=e;const i=r==="fixed",s=Un(o),l=t?Ui(t.floating):!1;if(o===s||l&&i)return n;let a={scrollLeft:0,scrollTop:0},c=pr(1);const f=pr(0),u=_n(o);if((u||!u&&!i)&&((Ir(o)!=="body"||m1(s))&&(a=Wi(o)),_n(o))){const d=Br(o);c=_o(o),f.x=d.x+o.clientLeft,f.y=d.y+o.clientTop}return{width:n.width*c.x,height:n.height*c.y,x:n.x*c.x-a.scrollLeft*c.x+f.x,y:n.y*c.y-a.scrollTop*c.y+f.y}}function j8(e){return Array.from(e.getClientRects())}function H0(e){return Br(Un(e)).left+Wi(e).scrollLeft}function z8(e){const t=Un(e),n=Wi(e),o=e.ownerDocument.body,r=Wt(t.scrollWidth,t.clientWidth,o.scrollWidth,o.clientWidth),i=Wt(t.scrollHeight,t.clientHeight,o.scrollHeight,o.clientHeight);let s=-n.scrollLeft+H0(e);const l=-n.scrollTop;return ln(o).direction==="rtl"&&(s+=Wt(t.clientWidth,o.clientWidth)-r),{width:r,height:i,x:s,y:l}}function N8(e,t){const n=Gt(e),o=Un(e),r=n.visualViewport;let i=o.clientWidth,s=o.clientHeight,l=0,a=0;if(r){i=r.width,s=r.height;const c=ra();(!c||c&&t==="fixed")&&(l=r.offsetLeft,a=r.offsetTop)}return{width:i,height:s,x:l,y:a}}function k8(e,t){const n=Br(e,!0,t==="fixed"),o=n.top+e.clientTop,r=n.left+e.clientLeft,i=_n(e)?_o(e):pr(1),s=e.clientWidth*i.x,l=e.clientHeight*i.y,a=r*i.x,c=o*i.y;return{width:s,height:l,x:a,y:c}}function U0(e,t,n){let o;if(t==="viewport")o=N8(e,n);else if(t==="document")o=z8(Un(e));else if(sn(t))o=k8(t,n);else{const r=V0(e);o={...t,x:t.x-r.x,y:t.y-r.y}}return Hi(o)}function W0(e,t){const n=gr(e);return n===t||!sn(n)||wo(n)?!1:ln(n).position==="fixed"||W0(n,t)}function I8(e,t){const n=t.get(e);if(n)return n;let o=y1(e,[],!1).filter(l=>sn(l)&&Ir(l)!=="body"),r=null;const i=ln(e).position==="fixed";let s=i?gr(e):e;for(;sn(s)&&!wo(s);){const l=ln(s),a=na(s);!a&&l.position==="fixed"&&(r=null),(i?!a&&!r:!a&&l.position==="static"&&!!r&&["absolute","fixed"].includes(r.position)||m1(s)&&!a&&W0(e,s))?o=o.filter(f=>f!==s):r=l,s=gr(s)}return t.set(e,o),o}function B8(e){let{element:t,boundary:n,rootBoundary:o,strategy:r}=e;const s=[...n==="clippingAncestors"?Ui(t)?[]:I8(t,this._c):[].concat(n),o],l=s[0],a=s.reduce((c,f)=>{const u=U0(t,f,r);return c.top=Wt(u.top,c.top),c.right=hr(u.right,c.right),c.bottom=hr(u.bottom,c.bottom),c.left=Wt(u.left,c.left),c},U0(t,l,r));return{width:a.right-a.left,height:a.bottom-a.top,x:a.left,y:a.top}}function L8(e){const{width:t,height:n}=R0(e);return{width:t,height:n}}function R8(e,t,n){const o=_n(t),r=Un(t),i=n==="fixed",s=Br(e,!0,i,t);let l={scrollLeft:0,scrollTop:0};const a=pr(0);if(o||!o&&!i)if((Ir(t)!=="body"||m1(r))&&(l=Wi(t)),o){const u=Br(t,!0,i,t);a.x=u.x+t.clientLeft,a.y=u.y+t.clientTop}else r&&(a.x=H0(r));const c=s.left+l.scrollLeft-a.x,f=s.top+l.scrollTop-a.y;return{x:c,y:f,width:s.width,height:s.height}}function ia(e){return ln(e).position==="static"}function G0(e,t){return!_n(e)||ln(e).position==="fixed"?null:t?t(e):e.offsetParent}function K0(e,t){const n=Gt(e);if(Ui(e))return n;if(!_n(e)){let r=gr(e);for(;r&&!wo(r);){if(sn(r)&&!ia(r))return r;r=gr(r)}return n}let o=G0(e,t);for(;o&&C8(o)&&ia(o);)o=G0(o,t);return o&&wo(o)&&ia(o)&&!na(o)?n:o||M8(e)||n}const V8=async function(e){const t=this.getOffsetParent||K0,n=this.getDimensions,o=await n(e.floating);return{reference:R8(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}};function H8(e){return ln(e).direction==="rtl"}const U8={convertOffsetParentRelativeRectToViewportRelativeRect:T8,getDocumentElement:Un,getClippingRect:B8,getOffsetParent:K0,getElementRects:V8,getClientRects:j8,getDimensions:L8,getScale:_o,isElement:sn,isRTL:H8};function W8(e,t){let n=null,o;const r=Un(e);function i(){var l;clearTimeout(o),(l=n)==null||l.disconnect(),n=null}function s(l,a){l===void 0&&(l=!1),a===void 0&&(a=1),i();const{left:c,top:f,width:u,height:d}=e.getBoundingClientRect();if(l||t(),!u||!d)return;const h=Ri(f),p=Ri(r.clientWidth-(c+u)),v=Ri(r.clientHeight-(f+d)),y=Ri(c),w={rootMargin:-h+"px "+-p+"px "+-v+"px "+-y+"px",threshold:Wt(0,hr(1,a))||1};let $=!0;function O(T){const S=T[0].intersectionRatio;if(S!==a){if(!$)return s();S?s(!1,S):o=setTimeout(()=>{s(!1,1e-7)},1e3)}$=!1}try{n=new IntersectionObserver(O,{...w,root:r.ownerDocument})}catch{n=new IntersectionObserver(O,w)}n.observe(e)}return s(!0),i}function G8(e,t,n,o){o===void 0&&(o={});const{ancestorScroll:r=!0,ancestorResize:i=!0,elementResize:s=typeof ResizeObserver=="function",layoutShift:l=typeof IntersectionObserver=="function",animationFrame:a=!1}=o,c=oa(e),f=r||i?[...c?y1(c):[],...y1(t)]:[];f.forEach(g=>{r&&g.addEventListener("scroll",n,{passive:!0}),i&&g.addEventListener("resize",n)});const u=c&&l?W8(c,n):null;let d=-1,h=null;s&&(h=new ResizeObserver(g=>{let[w]=g;w&&w.target===c&&h&&(h.unobserve(t),cancelAnimationFrame(d),d=requestAnimationFrame(()=>{var $;($=h)==null||$.observe(t)})),n()}),c&&!a&&h.observe(c),h.observe(t));let p,v=a?Br(e):null;a&&y();function y(){const g=Br(e);v&&(g.x!==v.x||g.y!==v.y||g.width!==v.width||g.height!==v.height)&&n(),v=g,p=requestAnimationFrame(y)}return n(),()=>{var g;f.forEach(w=>{r&&w.removeEventListener("scroll",n),i&&w.removeEventListener("resize",n)}),u==null||u(),(g=h)==null||g.disconnect(),h=null,a&&cancelAnimationFrame(p)}}const K8=O8,q8=S8,q0=F8,Y8=P8,Z8=$8,J8=b8,X8=E8,Q8=(e,t,n)=>{const o=new Map,r={platform:U8,...n},i={...r.platform,_c:o};return _8(e,t,{...r,platform:i})};function eg(e){return e!=null&&typeof e=="object"&&"$el"in e}function sa(e){if(eg(e)){const t=e.$el;return ta(t)&&Ir(t)==="#comment"?null:t}return e}function bo(e){return typeof e=="function"?e():H(e)}function tg(e){return{name:"arrow",options:e,fn(t){const n=sa(bo(e.element));return n==null?{}:J8({element:n,padding:e.padding}).fn(t)}}}function Y0(e){return typeof window>"u"?1:(e.ownerDocument.defaultView||window).devicePixelRatio||1}function Z0(e,t){const n=Y0(e);return Math.round(t*n)/n}function ng(e,t,n){n===void 0&&(n={});const o=n.whileElementsMounted,r=Oe(()=>{var x;return(x=bo(n.open))!=null?x:!0}),i=Oe(()=>bo(n.middleware)),s=Oe(()=>{var x;return(x=bo(n.placement))!=null?x:"bottom"}),l=Oe(()=>{var x;return(x=bo(n.strategy))!=null?x:"absolute"}),a=Oe(()=>{var x;return(x=bo(n.transform))!=null?x:!0}),c=Oe(()=>sa(e.value)),f=Oe(()=>sa(t.value)),u=$e(0),d=$e(0),h=$e(l.value),p=$e(s.value),v=s3({}),y=$e(!1),g=Oe(()=>{const x={position:h.value,left:"0",top:"0"};if(!f.value)return x;const I=Z0(f.value,u.value),V=Z0(f.value,d.value);return a.value?{...x,transform:"translate("+I+"px, "+V+"px)",...Y0(f.value)>=1.5&&{willChange:"transform"}}:{position:h.value,left:I+"px",top:V+"px"}});let w;function $(){c.value==null||f.value==null||Q8(c.value,f.value,{middleware:i.value,placement:s.value,strategy:l.value}).then(x=>{u.value=x.x,d.value=x.y,h.value=x.strategy,p.value=x.placement,v.value=x.middlewareData,y.value=!0})}function O(){typeof w=="function"&&(w(),w=void 0)}function T(){if(O(),o===void 0){$();return}if(c.value!=null&&f.value!=null){w=o(c.value,f.value,$);return}}function S(){r.value||(y.value=!1)}return mt([i,s,l],$,{flush:"sync"}),mt([c,f],T,{flush:"sync"}),mt(r,S,{flush:"sync"}),sl()&&kc(O),{x:Ot(u),y:Ot(d),strategy:Ot(h),placement:Ot(p),middlewareData:Ot(v),isPositioned:Ot(y),floatingStyles:g,update:$}}var rg={};function Lr(e,t){const n=typeof e=="string"&&!t?`${e}Context`:t,o=Symbol(n);return[r=>{const i=s1(o,r);if(i||i===null)return i;throw new Error(`Injection \`${o.toString()}\` not found. Component must be used within ${Array.isArray(e)?`one of the following components: ${e.join(", ")}`:`\`${e}\``}`)},r=>(I3(o,r),r)]}function J0(e,t,n){const o=n.originalEvent.target,r=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:n});t&&o.addEventListener(e,t,{once:!0}),o.dispatchEvent(r)}function og(e,t){var n;const o=s3();return qt(()=>{o.value=e()},{...t,flush:(n=void 0)!=null?n:"sync"}),pi(o)}function w1(e){return sl()?(kc(e),!0):!1}function ig(){const e=new Set,t=n=>{e.delete(n)};return{on:n=>{e.add(n);const o=()=>t(n);return w1(o),{off:o}},off:t,trigger:(...n)=>Promise.all(Array.from(e).map(o=>o(...n)))}}function sg(e){let t=!1,n;const o=Nc(!0);return(...r)=>(t||(n=o.run(()=>e(...r)),t=!0),n)}function lg(e){let t=0,n,o;const r=()=>{t-=1,o&&t<=0&&(o.stop(),n=void 0,o=void 0)};return(...i)=>(t+=1,n||(o=Nc(!0),n=o.run(()=>e(...i))),w1(r),n)}function Rr(e){return typeof e=="function"?e():H(e)}const vr=typeof window<"u"&&typeof document<"u";typeof WorkerGlobalScope<"u"&&globalThis instanceof WorkerGlobalScope;const ag=e=>typeof e<"u",cg=Object.prototype.toString,fg=e=>cg.call(e)==="[object Object]",ug=()=>{},X0=dg();function dg(){var e,t;return vr&&((e=window==null?void 0:window.navigator)==null?void 0:e.userAgent)&&(/iP(?:ad|hone|od)/.test(window.navigator.userAgent)||((t=window==null?void 0:window.navigator)==null?void 0:t.maxTouchPoints)>2&&/iPad|Macintosh/.test(window==null?void 0:window.navigator.userAgent))}function hg(e){return Bn()}function pg(e,t=1e4){return K6((n,o)=>{let r=Rr(e),i;const s=()=>setTimeout(()=>{r=Rr(e),o()},Rr(t));return w1(()=>{clearTimeout(i)}),{get(){return n(),r},set(l){r=l,o(),clearTimeout(i),i=s()}}})}function gg(e,t){hg()&&S3(e,t)}function Q0(e,t,n={}){const{immediate:o=!0}=n,r=$e(!1);let i=null;function s(){i&&(clearTimeout(i),i=null)}function l(){r.value=!1,s()}function a(...c){s(),r.value=!0,i=setTimeout(()=>{r.value=!1,i=null,e(...c)},Rr(t))}return o&&(r.value=!0,vr&&a()),w1(l),{isPending:pi(r),start:a,stop:l}}function _1(e){var t;const n=Rr(e);return(t=n==null?void 0:n.$el)!=null?t:n}const ef=vr?window:void 0;function Gi(...e){let t,n,o,r;if(typeof e[0]=="string"||Array.isArray(e[0])?([n,o,r]=e,t=ef):[t,n,o,r]=e,!t)return ug;Array.isArray(n)||(n=[n]),Array.isArray(o)||(o=[o]);const i=[],s=()=>{i.forEach(f=>f()),i.length=0},l=(f,u,d,h)=>(f.addEventListener(u,d,h),()=>f.removeEventListener(u,d,h)),a=mt(()=>[_1(t),Rr(r)],([f,u])=>{if(s(),!f)return;const d=fg(u)?{...u}:u;i.push(...n.flatMap(h=>o.map(p=>l(f,h,p,d))))},{immediate:!0,flush:"post"}),c=()=>{a(),s()};return w1(c),c}function vg(e){return typeof e=="function"?e:typeof e=="string"?t=>t.key===e:Array.isArray(e)?t=>e.includes(t.key):()=>!0}function mg(...e){let t,n,o={};e.length===3?(t=e[0],n=e[1],o=e[2]):e.length===2?typeof e[1]=="object"?(t=!0,n=e[0],o=e[1]):(t=e[0],n=e[1]):(t=!0,n=e[0]);const{target:r=ef,eventName:i="keydown",passive:s=!1,dedupe:l=!1}=o,a=vg(t);return Gi(r,i,c=>{c.repeat&&Rr(l)||a(c)&&n(c)},s)}function yg(){const e=$e(!1),t=Bn();return t&&zn(()=>{e.value=!0},t),e}function wg(e){return JSON.parse(JSON.stringify(e))}function tf(e,t,n,o={}){var r,i,s;const{clone:l=!1,passive:a=!1,eventName:c,deep:f=!1,defaultValue:u,shouldEmit:d}=o,h=Bn(),p=n||(h==null?void 0:h.emit)||((r=h==null?void 0:h.$emit)==null?void 0:r.bind(h))||((s=(i=h==null?void 0:h.proxy)==null?void 0:i.$emit)==null?void 0:s.bind(h==null?void 0:h.proxy));let v=c;v=v||`update:${t.toString()}`;const y=$=>l?typeof l=="function"?l($):wg($):$,g=()=>ag(e[t])?y(e[t]):u,w=$=>{d?d($)&&p(v,$):p(v,$)};if(a){const $=g(),O=$e($);let T=!1;return mt(()=>e[t],S=>{T||(T=!0,O.value=y(S),lr(()=>T=!1))}),mt(O,S=>{!T&&(S!==e[t]||f)&&w(S)},{deep:f}),O}else return Oe({get(){return g()},set($){w($)}})}function la(e){return e?e.flatMap(t=>t.type===Et?la(t.children):[t]):[]}function aa(e){if(e===null||typeof e!="object")return!1;const t=Object.getPrototypeOf(e);return t!==null&&t!==Object.prototype&&Object.getPrototypeOf(t)!==null||Symbol.iterator in e?!1:Symbol.toStringTag in e?Object.prototype.toString.call(e)==="[object Module]":!0}function ca(e,t,n=".",o){if(!aa(t))return ca(e,{},n);const r=Object.assign({},t);for(const i in e){if(i==="__proto__"||i==="constructor")continue;const s=e[i];s!=null&&(Array.isArray(s)&&Array.isArray(r[i])?r[i]=[...s,...r[i]]:aa(s)&&aa(r[i])?r[i]=ca(s,r[i],(n?`${n}.`:"")+i.toString()):r[i]=s)}return r}function _g(e){return(...t)=>t.reduce((n,o)=>ca(n,o,""),{})}const bg=_g(),[nf,YG]=Lr("ConfigProvider");let Fg="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict",$g=(e=21)=>{let t="",n=e;for(;n--;)t+=Fg[Math.random()*64|0];return t};const xg=lg(()=>{const e=$e(new Map),t=$e(),n=Oe(()=>{for(const s of e.value.values())if(s)return!0;return!1}),o=nf({scrollBody:$e(!0)});let r=null;const i=()=>{document.body.style.paddingRight="",document.body.style.marginRight="",document.body.style.pointerEvents="",document.body.style.removeProperty("--scrollbar-width"),document.body.style.overflow=t.value??"",X0&&(r==null||r()),t.value=void 0};return mt(n,(s,l)=>{var a;if(!vr)return;if(!s){l&&i();return}t.value===void 0&&(t.value=document.body.style.overflow);const c=window.innerWidth-document.documentElement.clientWidth,f={padding:c,margin:0},u=(a=o.scrollBody)!=null&&a.value?typeof o.scrollBody.value=="object"?bg({padding:o.scrollBody.value.padding===!0?c:o.scrollBody.value.padding,margin:o.scrollBody.value.margin===!0?c:o.scrollBody.value.margin},f):f:{padding:0,margin:0};c>0&&(document.body.style.paddingRight=`${u.padding}px`,document.body.style.marginRight=`${u.margin}px`,document.body.style.setProperty("--scrollbar-width",`${c}px`),document.body.style.overflow="hidden"),X0&&(r=Gi(document,"touchmove",d=>{var h;d.target===document.documentElement&&(d.touches.length>1||(h=d.preventDefault)==null||h.call(d))},{passive:!1})),lr(()=>{document.body.style.pointerEvents="none",document.body.style.overflow="hidden"})},{immediate:!0,flush:"sync"}),e});function Og(e){const t=$g(6),n=xg();n.value.set(t,e);const o=Oe({get:()=>n.value.get(t)??!1,set:r=>n.value.set(t,r)});return gg(()=>{n.value.delete(t)}),o}function Ki(e){const t=Bn(),n=t==null?void 0:t.type.emits,o={};return n!=null&&n.length||console.warn(`No emitted event found. Please check component: ${t==null?void 0:t.type.__name}`),n==null||n.forEach(r=>{o[Pn(xt(r))]=(...i)=>e(r,...i)}),o}function rf(e){const t=Bn(),n=Object.keys((t==null?void 0:t.type.props)??{}).reduce((r,i)=>{const s=(t==null?void 0:t.type.props[i]).default;return s!==void 0&&(r[i]=s),r},{}),o=Z6(e);return Oe(()=>{const r={},i=(t==null?void 0:t.vnode.props)??{};return Object.keys(i).forEach(s=>{r[xt(s)]=i[s]}),Object.keys({...n,...r}).reduce((s,l)=>(o.value[l]!==void 0&&(s[l]=o.value[l]),s),{})})}function fa(e,t){const n=rf(e),o=t?Ki(t):{};return Oe(()=>({...n.value,...o}))}function We(){const e=Bn(),t=$e(),n=Oe(()=>{var s,l;return["#text","#comment"].includes((s=t.value)==null?void 0:s.$el.nodeName)?(l=t.value)==null?void 0:l.$el.nextElementSibling:_1(t)}),o=Object.assign({},e.exposed),r={};for(const s in e.props)Object.defineProperty(r,s,{enumerable:!0,configurable:!0,get:()=>e.props[s]});if(Object.keys(o).length>0)for(const s in o)Object.defineProperty(r,s,{enumerable:!0,configurable:!0,get:()=>o[s]});Object.defineProperty(r,"$el",{enumerable:!0,configurable:!0,get:()=>e.vnode.el}),e.exposed=r;function i(s){t.value=s,!(s instanceof Element||!s)&&(Object.defineProperty(r,"$el",{enumerable:!0,configurable:!0,get:()=>s.$el}),e.exposed=r)}return{forwardRef:i,currentRef:t,currentElement:n}}function Sg(e,t){const n=pg(!1,300),o=$e(null),r=ig();function i(){o.value=null,n.value=!1}function s(l,a){const c=l.currentTarget,f={x:l.clientX,y:l.clientY},u=Eg(f,c.getBoundingClientRect()),d=Pg(f,u),h=Cg(a.getBoundingClientRect()),p=Dg([...d,...h]);o.value=p,n.value=!0}return qt(l=>{if(e.value&&t.value){const a=f=>s(f,t.value),c=f=>s(f,e.value);e.value.addEventListener("pointerleave",a),t.value.addEventListener("pointerleave",c),l(()=>{var f,u;(f=e.value)==null||f.removeEventListener("pointerleave",a),(u=t.value)==null||u.removeEventListener("pointerleave",c)})}}),qt(l=>{if(o.value){const a=c=>{var f,u;if(!o.value)return;const d=c.target,h={x:c.clientX,y:c.clientY},p=((f=e.value)==null?void 0:f.contains(d))||((u=t.value)==null?void 0:u.contains(d)),v=!Mg(h,o.value),y=d.hasAttribute("data-grace-area-trigger");p?i():(v||y)&&(i(),r.trigger())};document.addEventListener("pointermove",a),l(()=>document.removeEventListener("pointermove",a))}}),{isPointerInTransit:n,onPointerExit:r.on}}function Eg(e,t){const n=Math.abs(t.top-e.y),o=Math.abs(t.bottom-e.y),r=Math.abs(t.right-e.x),i=Math.abs(t.left-e.x);switch(Math.min(n,o,r,i)){case i:return"left";case r:return"right";case n:return"top";case o:return"bottom";default:throw new Error("unreachable")}}function Pg(e,t,n=5){const o=[];switch(t){case"top":o.push({x:e.x-n,y:e.y+n},{x:e.x+n,y:e.y+n});break;case"bottom":o.push({x:e.x-n,y:e.y-n},{x:e.x+n,y:e.y-n});break;case"left":o.push({x:e.x+n,y:e.y-n},{x:e.x+n,y:e.y+n});break;case"right":o.push({x:e.x-n,y:e.y-n},{x:e.x-n,y:e.y+n});break}return o}function Cg(e){const{top:t,right:n,bottom:o,left:r}=e;return[{x:r,y:t},{x:n,y:t},{x:n,y:o},{x:r,y:o}]}function Mg(e,t){const{x:n,y:o}=e;let r=!1;for(let i=0,s=t.length-1;i<t.length;s=i++){const l=t[i].x,a=t[i].y,c=t[s].x,f=t[s].y;a>o!=f>o&&n<(c-l)*(o-a)/(f-a)+l&&(r=!r)}return r}function Dg(e){const t=e.slice();return t.sort((n,o)=>n.x<o.x?-1:n.x>o.x?1:n.y<o.y?-1:n.y>o.y?1:0),Ag(t)}function Ag(e){if(e.length<=1)return e.slice();const t=[];for(let o=0;o<e.length;o++){const r=e[o];for(;t.length>=2;){const i=t[t.length-1],s=t[t.length-2];if((i.x-s.x)*(r.y-s.y)>=(i.y-s.y)*(r.x-s.x))t.pop();else break}t.push(r)}t.pop();const n=[];for(let o=e.length-1;o>=0;o--){const r=e[o];for(;n.length>=2;){const i=n[n.length-1],s=n[n.length-2];if((i.x-s.x)*(r.y-s.y)>=(i.y-s.y)*(r.x-s.x))n.pop();else break}n.push(r)}return n.pop(),t.length===1&&n.length===1&&t[0].x===n[0].x&&t[0].y===n[0].y?t:t.concat(n)}var Tg=function(e){if(typeof document>"u")return null;var t=Array.isArray(e)?e[0]:e;return t.ownerDocument.body},Fo=new WeakMap,qi=new WeakMap,Yi={},ua=0,of=function(e){return e&&(e.host||of(e.parentNode))},jg=function(e,t){return t.map(function(n){if(e.contains(n))return n;var o=of(n);return o&&e.contains(o)?o:(console.error("aria-hidden",n,"in not contained inside",e,". Doing nothing"),null)}).filter(function(n){return!!n})},zg=function(e,t,n,o){var r=jg(t,Array.isArray(e)?e:[e]);Yi[n]||(Yi[n]=new WeakMap);var i=Yi[n],s=[],l=new Set,a=new Set(r),c=function(u){!u||l.has(u)||(l.add(u),c(u.parentNode))};r.forEach(c);var f=function(u){!u||a.has(u)||Array.prototype.forEach.call(u.children,function(d){if(l.has(d))f(d);else try{var h=d.getAttribute(o),p=h!==null&&h!=="false",v=(Fo.get(d)||0)+1,y=(i.get(d)||0)+1;Fo.set(d,v),i.set(d,y),s.push(d),v===1&&p&&qi.set(d,!0),y===1&&d.setAttribute(n,"true"),p||d.setAttribute(o,"true")}catch(g){console.error("aria-hidden: cannot operate on ",d,g)}})};return f(t),l.clear(),ua++,function(){s.forEach(function(u){var d=Fo.get(u)-1,h=i.get(u)-1;Fo.set(u,d),i.set(u,h),d||(qi.has(u)||u.removeAttribute(o),qi.delete(u)),h||u.removeAttribute(n)}),ua--,ua||(Fo=new WeakMap,Fo=new WeakMap,qi=new WeakMap,Yi={})}},Ng=function(e,t,n){n===void 0&&(n="data-aria-hidden");var o=Array.from(Array.isArray(e)?e:[e]),r=Tg(e);return r?(o.push.apply(o,Array.from(r.querySelectorAll("[aria-live]"))),zg(o,r,n,"aria-hidden")):function(){return null}};function kg(e){let t;mt(()=>_1(e),n=>{n?t=Ng(n):t&&t()}),r1(()=>{t&&t()})}let Ig=0;function Zi(e,t="radix"){const{useId:n}=nf({useId:void 0});return n&&typeof n=="function"?`${t}-${n()}`:`${t}-${++Ig}`}function Bg(e){const t=$e(),n=Oe(()=>{var r;return((r=t.value)==null?void 0:r.width)??0}),o=Oe(()=>{var r;return((r=t.value)==null?void 0:r.height)??0});return zn(()=>{const r=_1(e);if(r){t.value={width:r.offsetWidth,height:r.offsetHeight};const i=new ResizeObserver(s=>{if(!Array.isArray(s)||!s.length)return;const l=s[0];let a,c;if("borderBoxSize"in l){const f=l.borderBoxSize,u=Array.isArray(f)?f[0]:f;a=u.inlineSize,c=u.blockSize}else a=r.offsetWidth,c=r.offsetHeight;t.value={width:a,height:c}});return i.observe(r,{box:"border-box"}),()=>i.unobserve(r)}else t.value=void 0}),{width:n,height:o}}function Lg(e,t){const n=$e(e);function o(r){return t[n.value][r]??n.value}return{state:n,dispatch:r=>{n.value=o(r)}}}const Rg=ve({name:"PrimitiveSlot",inheritAttrs:!1,setup(e,{attrs:t,slots:n}){return()=>{var o,r;if(!n.default)return null;const i=la(n.default()),s=i.findIndex(f=>f.type!==jt);if(s===-1)return i;const l=i[s];(o=l.props)==null||delete o.ref;const a=l.props?pt(t,l.props):t;t.class&&(r=l.props)!=null&&r.class&&delete l.props.class;const c=In(l,a);for(const f in a)f.startsWith("on")&&(c.props||(c.props={}),c.props[f]=a[f]);return i.length===1?c:(i[s]=c,i)}}}),Pt=ve({name:"Primitive",inheritAttrs:!1,props:{asChild:{type:Boolean,default:!1},as:{type:[String,Object],default:"div"}},setup(e,{attrs:t,slots:n}){const o=e.asChild?"template":e.as;return typeof o=="string"&&["area","img","input"].includes(o)?()=>Ni(o,t):o!=="template"?()=>Ni(e.as,t,{default:n.default}):()=>Ni(Rg,t,{default:n.default})}});function Vg(e,t){const n=$e({}),o=$e("none"),r=e.value?"mounted":"unmounted",{state:i,dispatch:s}=Lg(r,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}}),l=d=>{var h;if(vr){const p=new CustomEvent(d,{bubbles:!1,cancelable:!1});(h=t.value)==null||h.dispatchEvent(p)}};mt(e,async(d,h)=>{var p;const v=h!==d;if(await lr(),v){const y=o.value,g=Ji(t.value);d?(s("MOUNT"),l("enter"),g==="none"&&l("after-enter")):g==="none"||((p=n.value)==null?void 0:p.display)==="none"?(s("UNMOUNT"),l("leave"),l("after-leave")):h&&y!==g?(s("ANIMATION_OUT"),l("leave")):(s("UNMOUNT"),l("after-leave"))}},{immediate:!0});const a=d=>{const h=Ji(t.value),p=h.includes(d.animationName),v=i.value==="mounted"?"enter":"leave";d.target===t.value&&p&&(l(`after-${v}`),s("ANIMATION_END")),d.target===t.value&&h==="none"&&s("ANIMATION_END")},c=d=>{d.target===t.value&&(o.value=Ji(t.value))},f=mt(t,(d,h)=>{d?(n.value=getComputedStyle(d),d.addEventListener("animationstart",c),d.addEventListener("animationcancel",a),d.addEventListener("animationend",a)):(s("ANIMATION_END"),h==null||h.removeEventListener("animationstart",c),h==null||h.removeEventListener("animationcancel",a),h==null||h.removeEventListener("animationend",a))},{immediate:!0}),u=mt(i,()=>{const d=Ji(t.value);o.value=i.value==="mounted"?d:"none"});return r1(()=>{f(),u()}),{isPresent:Oe(()=>["mounted","unmountSuspended"].includes(i.value))}}function Ji(e){return e&&getComputedStyle(e).animationName||"none"}const da=ve({name:"Presence",props:{present:{type:Boolean,required:!0},forceMount:{type:Boolean}},slots:{},setup(e,{slots:t,expose:n}){var o;const{present:r,forceMount:i}=At(e),s=$e(),{isPresent:l}=Vg(r,s);n({present:l});let a=t.default({present:l});a=la(a||[]);const c=Bn();if(a&&(a==null?void 0:a.length)>1){const f=(o=c==null?void 0:c.parent)!=null&&o.type.name?`<${c.parent.type.name} />`:"component";throw new Error([`Detected an invalid children for \`${f}\` for  \`Presence\` component.`,"","Note: Presence works similarly to `v-if` directly, but it waits for animation/transition to finished before unmounting. So it expect only one direct child of valid VNode type.","You can apply a few solutions:",["Provide a single child element so that `presence` directive attach correctly.","Ensure the first child is an actual element instead of a raw text node or comment node."].map(u=>`  - ${u}`).join(`
`)].join(`
`))}return()=>i.value||r.value||l.value?Ni(t.default({present:l})[0],{ref:f=>{const u=_1(f);return typeof(u==null?void 0:u.hasAttribute)>"u"||(u!=null&&u.hasAttribute("data-radix-popper-content-wrapper")?s.value=u.firstElementChild:s.value=u),u}}):null}}),[bn,Hg]=Lr("DialogRoot"),Ug=ve({__name:"DialogRoot",props:{open:{type:Boolean,default:void 0},defaultOpen:{type:Boolean,default:!1},modal:{type:Boolean,default:!0}},emits:["update:open"],setup(e,{emit:t}){const n=e,o=tf(n,"open",t,{defaultValue:n.defaultOpen,passive:n.open===void 0}),r=$e(),i=$e(),{modal:s}=At(n);return Hg({open:o,modal:s,openModal:()=>{o.value=!0},onOpenChange:l=>{o.value=l},onOpenToggle:()=>{o.value=!o.value},contentId:"",titleId:"",descriptionId:"",triggerElement:r,contentElement:i}),(l,a)=>ue(l.$slots,"default",{open:H(o)})}}),Wg=ve({__name:"DialogTrigger",props:{asChild:{type:Boolean},as:{default:"button"}},setup(e){const t=e,n=bn(),{forwardRef:o,currentElement:r}=We();return n.contentId||(n.contentId=Zi(void 0,"radix-vue-dialog-content")),zn(()=>{n.triggerElement.value=r.value}),(i,s)=>(ae(),we(H(Pt),pt(t,{ref:H(o),type:i.as==="button"?"button":void 0,"aria-haspopup":"dialog","aria-expanded":H(n).open.value||!1,"aria-controls":H(n).open.value?H(n).contentId:void 0,"data-state":H(n).open.value?"open":"closed",onClick:H(n).onOpenToggle}),{default:se(()=>[ue(i.$slots,"default")]),_:3},16,["type","aria-expanded","aria-controls","data-state","onClick"]))}}),sf=ve({__name:"Teleport",props:{to:{default:"body"},disabled:{type:Boolean},forceMount:{type:Boolean}},setup(e){const t=yg();return(n,o)=>H(t)||n.forceMount?(ae(),we(lp,{key:0,to:n.to,disabled:n.disabled},[ue(n.$slots,"default")],8,["to","disabled"])):yn("",!0)}}),Gg=ve({__name:"DialogPortal",props:{to:{},disabled:{type:Boolean},forceMount:{type:Boolean}},setup(e){const t=e;return(n,o)=>(ae(),we(H(sf),uo(kr(t)),{default:se(()=>[ue(n.$slots,"default")]),_:3},16))}}),Kg="dismissableLayer.pointerDownOutside",qg="dismissableLayer.focusOutside";function lf(e,t){const n=t.closest("[data-dismissable-layer]"),o=e.dataset.dismissableLayer===""?e:e.querySelector("[data-dismissable-layer]"),r=Array.from(e.ownerDocument.querySelectorAll("[data-dismissable-layer]"));return!!(n&&o===n||r.indexOf(o)<r.indexOf(n))}function Yg(e,t){var n;const o=((n=t==null?void 0:t.value)==null?void 0:n.ownerDocument)??(globalThis==null?void 0:globalThis.document),r=$e(!1),i=$e(()=>{});return qt(s=>{if(!vr)return;const l=async c=>{const f=c.target;if(t!=null&&t.value){if(lf(t.value,f)){r.value=!1;return}if(c.target&&!r.value){let u=function(){J0(Kg,e,d)};const d={originalEvent:c};c.pointerType==="touch"?(o.removeEventListener("click",i.value),i.value=u,o.addEventListener("click",i.value,{once:!0})):u()}else o.removeEventListener("click",i.value);r.value=!1}},a=window.setTimeout(()=>{o.addEventListener("pointerdown",l)},0);s(()=>{window.clearTimeout(a),o.removeEventListener("pointerdown",l),o.removeEventListener("click",i.value)})}),{onPointerDownCapture:()=>r.value=!0}}function Zg(e,t){var n;const o=((n=t==null?void 0:t.value)==null?void 0:n.ownerDocument)??(globalThis==null?void 0:globalThis.document),r=$e(!1);return qt(i=>{if(!vr)return;const s=async l=>{t!=null&&t.value&&(await lr(),!(!t.value||lf(t.value,l.target))&&l.target&&!r.value&&J0(qg,e,{originalEvent:l}))};o.addEventListener("focusin",s),i(()=>o.removeEventListener("focusin",s))}),{onFocusCapture:()=>r.value=!0,onBlurCapture:()=>r.value=!1}}const Wn=qo({layersRoot:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),af=ve({__name:"DismissableLayer",props:{disableOutsidePointerEvents:{type:Boolean,default:!1},asChild:{type:Boolean},as:{}},emits:["escapeKeyDown","pointerDownOutside","focusOutside","interactOutside","dismiss"],setup(e,{emit:t}){const n=e,o=t,{forwardRef:r,currentElement:i}=We(),s=Oe(()=>{var p;return((p=i.value)==null?void 0:p.ownerDocument)??globalThis.document}),l=Oe(()=>Wn.layersRoot),a=Oe(()=>i.value?Array.from(l.value).indexOf(i.value):-1),c=Oe(()=>Wn.layersWithOutsidePointerEventsDisabled.size>0),f=Oe(()=>{const p=Array.from(l.value),[v]=[...Wn.layersWithOutsidePointerEventsDisabled].slice(-1),y=p.indexOf(v);return a.value>=y}),u=Yg(async p=>{const v=[...Wn.branches].some(y=>y.contains(p.target));!f.value||v||(o("pointerDownOutside",p),o("interactOutside",p),await lr(),p.defaultPrevented||o("dismiss"))},i),d=Zg(p=>{[...Wn.branches].some(v=>v.contains(p.target))||(o("focusOutside",p),o("interactOutside",p),p.defaultPrevented||o("dismiss"))},i);mg("Escape",p=>{a.value===l.value.size-1&&(o("escapeKeyDown",p),p.defaultPrevented||o("dismiss"))});let h;return qt(p=>{i.value&&(n.disableOutsidePointerEvents&&(Wn.layersWithOutsidePointerEventsDisabled.size===0&&(h=s.value.body.style.pointerEvents,s.value.body.style.pointerEvents="none"),Wn.layersWithOutsidePointerEventsDisabled.add(i.value)),l.value.add(i.value),p(()=>{n.disableOutsidePointerEvents&&Wn.layersWithOutsidePointerEventsDisabled.size===1&&(s.value.body.style.pointerEvents=h)}))}),qt(p=>{p(()=>{i.value&&(l.value.delete(i.value),Wn.layersWithOutsidePointerEventsDisabled.delete(i.value))})}),(p,v)=>(ae(),we(H(Pt),{ref:H(r),"as-child":p.asChild,as:p.as,"data-dismissable-layer":"",style:Er({pointerEvents:c.value?f.value?"auto":"none":void 0}),onFocusCapture:H(d).onFocusCapture,onBlurCapture:H(d).onBlurCapture,onPointerdownCapture:H(u).onPointerDownCapture},{default:se(()=>[ue(p.$slots,"default")]),_:3},8,["as-child","as","style","onFocusCapture","onBlurCapture","onPointerdownCapture"]))}}),ha="focusScope.autoFocusOnMount",pa="focusScope.autoFocusOnUnmount",cf={bubbles:!1,cancelable:!0};function Jg(e,{select:t=!1}={}){const n=document.activeElement;for(const o of e)if(mr(o,{select:t}),document.activeElement!==n)return!0}function Xg(e){const t=ff(e),n=uf(t,e),o=uf(t.reverse(),e);return[n,o]}function ff(e){const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:o=>{const r=o.tagName==="INPUT"&&o.type==="hidden";return o.disabled||o.hidden||r?NodeFilter.FILTER_SKIP:o.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t}function uf(e,t){for(const n of e)if(!Qg(n,{upTo:t}))return n}function Qg(e,{upTo:t}){if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t!==void 0&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1}function e7(e){return e instanceof HTMLInputElement&&"select"in e}function mr(e,{select:t=!1}={}){if(e&&e.focus){const n=document.activeElement;e.focus({preventScroll:!0}),e!==n&&e7(e)&&t&&e.select()}}const t7=sg(()=>$e([]));function n7(){const e=t7();return{add(t){const n=e.value[0];t!==n&&(n==null||n.pause()),e.value=df(e.value,t),e.value.unshift(t)},remove(t){var n;e.value=df(e.value,t),(n=e.value[0])==null||n.resume()}}}function df(e,t){const n=[...e],o=n.indexOf(t);return o!==-1&&n.splice(o,1),n}function r7(e){return e.filter(t=>t.tagName!=="A")}const o7=ve({__name:"FocusScope",props:{loop:{type:Boolean,default:!1},trapped:{type:Boolean,default:!1},asChild:{type:Boolean},as:{}},emits:["mountAutoFocus","unmountAutoFocus"],setup(e,{emit:t}){const n=e,o=t,{currentRef:r,currentElement:i}=We(),s=$e(null),l=n7(),a=qo({paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}});qt(f=>{if(!vr)return;const u=i.value;if(!n.trapped)return;function d(y){if(a.paused||!u)return;const g=y.target;u.contains(g)?s.value=g:mr(s.value,{select:!0})}function h(y){if(a.paused||!u)return;const g=y.relatedTarget;g!==null&&(u.contains(g)||mr(s.value,{select:!0}))}function p(y){u.contains(s.value)||mr(u)}document.addEventListener("focusin",d),document.addEventListener("focusout",h);const v=new MutationObserver(p);u&&v.observe(u,{childList:!0,subtree:!0}),f(()=>{document.removeEventListener("focusin",d),document.removeEventListener("focusout",h),v.disconnect()})}),qt(async f=>{const u=i.value;if(await lr(),!u)return;l.add(a);const d=document.activeElement;if(!u.contains(d)){const h=new CustomEvent(ha,cf);u.addEventListener(ha,p=>o("mountAutoFocus",p)),u.dispatchEvent(h),h.defaultPrevented||(Jg(r7(ff(u)),{select:!0}),document.activeElement===d&&mr(u))}f(()=>{u.removeEventListener(ha,v=>o("mountAutoFocus",v));const h=new CustomEvent(pa,cf),p=v=>{o("unmountAutoFocus",v)};u.addEventListener(pa,p),u.dispatchEvent(h),setTimeout(()=>{h.defaultPrevented||mr(d??document.body,{select:!0}),u.removeEventListener(pa,p),l.remove(a)},0)})});function c(f){if(!n.loop&&!n.trapped||a.paused)return;const u=f.key==="Tab"&&!f.altKey&&!f.ctrlKey&&!f.metaKey,d=document.activeElement;if(u&&d){const h=f.currentTarget,[p,v]=Xg(h);p&&v?!f.shiftKey&&d===v?(f.preventDefault(),n.loop&&mr(p,{select:!0})):f.shiftKey&&d===p&&(f.preventDefault(),n.loop&&mr(v,{select:!0})):d===h&&f.preventDefault()}}return(f,u)=>(ae(),we(H(Pt),{ref_key:"currentRef",ref:r,tabindex:"-1","as-child":f.asChild,as:f.as,onKeydown:c},{default:se(()=>[ue(f.$slots,"default")]),_:3},8,["as-child","as"]))}});function i7(e){return e?"open":"closed"}const s7="DialogTitle",l7="DialogContent";function a7({titleName:e=s7,contentName:t=l7,componentLink:n="dialog.html#title",titleId:o,descriptionId:r,contentElement:i}){const s=`Warning: \`${t}\` requires a \`${e}\` for the component to be accessible for screen reader users.

If you want to hide the \`${e}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://www.radix-vue.com/components/${n}`,l=`Warning: Missing \`Description\` or \`aria-describedby="undefined"\` for ${t}.`;zn(()=>{var a;document.getElementById(o)||console.warn(s);const c=(a=i.value)==null?void 0:a.getAttribute("aria-describedby");r&&!c&&(document.getElementById(r)||console.warn(l))})}const hf=ve({__name:"DialogContentImpl",props:{forceMount:{type:Boolean},trapFocus:{type:Boolean},disableOutsidePointerEvents:{type:Boolean},asChild:{type:Boolean},as:{}},emits:["escapeKeyDown","pointerDownOutside","focusOutside","interactOutside","openAutoFocus","closeAutoFocus"],setup(e,{emit:t}){const n=e,o=t,r=bn(),{forwardRef:i,currentElement:s}=We();return r.titleId||(r.titleId=Zi(void 0,"radix-vue-dialog-title")),r.descriptionId||(r.descriptionId=Zi(void 0,"radix-vue-dialog-description")),zn(()=>{r.contentElement=s,document.activeElement!==document.body&&(r.triggerElement.value=document.activeElement)}),rg.NODE_ENV!=="production"&&a7({titleName:"DialogTitle",contentName:"DialogContent",componentLink:"dialog.html#title",titleId:r.titleId,descriptionId:r.descriptionId,contentElement:r.contentElement}),(l,a)=>(ae(),we(H(o7),{"as-child":"",loop:"",trapped:n.trapFocus,onMountAutoFocus:a[5]||(a[5]=c=>o("openAutoFocus",c)),onUnmountAutoFocus:a[6]||(a[6]=c=>o("closeAutoFocus",c))},{default:se(()=>[Be(H(af),pt({id:H(r).contentId,ref:H(i),as:l.as,"as-child":l.asChild,"disable-outside-pointer-events":l.disableOutsidePointerEvents,role:"dialog","aria-describedby":H(r).descriptionId,"aria-labelledby":H(r).titleId,"data-state":H(i7)(H(r).open.value)},l.$attrs,{onDismiss:a[0]||(a[0]=c=>H(r).onOpenChange(!1)),onEscapeKeyDown:a[1]||(a[1]=c=>o("escapeKeyDown",c)),onFocusOutside:a[2]||(a[2]=c=>o("focusOutside",c)),onInteractOutside:a[3]||(a[3]=c=>o("interactOutside",c)),onPointerDownOutside:a[4]||(a[4]=c=>o("pointerDownOutside",c))}),{default:se(()=>[ue(l.$slots,"default")]),_:3},16,["id","as","as-child","disable-outside-pointer-events","aria-describedby","aria-labelledby","data-state"])]),_:3},8,["trapped"]))}}),c7=ve({__name:"DialogContentModal",props:{forceMount:{type:Boolean},trapFocus:{type:Boolean},disableOutsidePointerEvents:{type:Boolean},asChild:{type:Boolean},as:{}},emits:["escapeKeyDown","pointerDownOutside","focusOutside","interactOutside","openAutoFocus","closeAutoFocus"],setup(e,{emit:t}){const n=e,o=t,r=bn(),i=Ki(o),{forwardRef:s,currentElement:l}=We();return kg(l),(a,c)=>(ae(),we(hf,pt({...n,...H(i)},{ref:H(s),"trap-focus":H(r).open.value,"disable-outside-pointer-events":!0,onCloseAutoFocus:c[0]||(c[0]=f=>{var u;f.defaultPrevented||(f.preventDefault(),(u=H(r).triggerElement.value)==null||u.focus())}),onPointerDownOutside:c[1]||(c[1]=f=>{const u=f.detail.originalEvent,d=u.button===0&&u.ctrlKey===!0;(u.button===2||d)&&f.preventDefault()}),onFocusOutside:c[2]||(c[2]=f=>{f.preventDefault()})}),{default:se(()=>[ue(a.$slots,"default")]),_:3},16,["trap-focus"]))}}),f7=ve({__name:"DialogContentNonModal",props:{forceMount:{type:Boolean},trapFocus:{type:Boolean},disableOutsidePointerEvents:{type:Boolean},asChild:{type:Boolean},as:{}},emits:["escapeKeyDown","pointerDownOutside","focusOutside","interactOutside","openAutoFocus","closeAutoFocus"],setup(e,{emit:t}){const n=e,o=Ki(t);We();const r=bn(),i=$e(!1),s=$e(!1);return(l,a)=>(ae(),we(hf,pt({...n,...H(o)},{"trap-focus":!1,"disable-outside-pointer-events":!1,onCloseAutoFocus:a[0]||(a[0]=c=>{var f;c.defaultPrevented||(i.value||(f=H(r).triggerElement.value)==null||f.focus(),c.preventDefault()),i.value=!1,s.value=!1}),onInteractOutside:a[1]||(a[1]=c=>{var f;c.defaultPrevented||(i.value=!0,c.detail.originalEvent.type==="pointerdown"&&(s.value=!0));const u=c.target;(f=H(r).triggerElement.value)!=null&&f.contains(u)&&c.preventDefault(),c.detail.originalEvent.type==="focusin"&&s.value&&c.preventDefault()})}),{default:se(()=>[ue(l.$slots,"default")]),_:3},16))}}),u7=ve({__name:"DialogContent",props:{forceMount:{type:Boolean},trapFocus:{type:Boolean},disableOutsidePointerEvents:{type:Boolean},asChild:{type:Boolean},as:{}},emits:["escapeKeyDown","pointerDownOutside","focusOutside","interactOutside","openAutoFocus","closeAutoFocus"],setup(e,{emit:t}){const n=e,o=t,r=bn(),i=Ki(o),{forwardRef:s}=We();return(l,a)=>(ae(),we(H(da),{present:l.forceMount||H(r).open.value},{default:se(()=>[H(r).modal.value?(ae(),we(c7,pt({key:0,ref:H(s)},{...n,...H(i),...l.$attrs}),{default:se(()=>[ue(l.$slots,"default")]),_:3},16)):(ae(),we(f7,pt({key:1,ref:H(s)},{...n,...H(i),...l.$attrs}),{default:se(()=>[ue(l.$slots,"default")]),_:3},16))]),_:3},8,["present"]))}}),d7=ve({__name:"DialogOverlayImpl",props:{asChild:{type:Boolean},as:{}},setup(e){const t=bn();return Og(!0),We(),(n,o)=>(ae(),we(H(Pt),{as:n.as,"as-child":n.asChild,"data-state":H(t).open.value?"open":"closed",style:{"pointer-events":"auto"}},{default:se(()=>[ue(n.$slots,"default")]),_:3},8,["as","as-child","data-state"]))}}),h7=ve({__name:"DialogOverlay",props:{forceMount:{type:Boolean},asChild:{type:Boolean},as:{}},setup(e){const t=bn(),{forwardRef:n}=We();return(o,r)=>{var i;return(i=H(t))!=null&&i.modal.value?(ae(),we(H(da),{key:0,present:o.forceMount||H(t).open.value},{default:se(()=>[Be(d7,pt(o.$attrs,{ref:H(n),as:o.as,"as-child":o.asChild}),{default:se(()=>[ue(o.$slots,"default")]),_:3},16,["as","as-child"])]),_:3},8,["present"])):yn("",!0)}}}),p7=ve({__name:"DialogClose",props:{asChild:{type:Boolean},as:{default:"button"}},setup(e){const t=e;We();const n=bn();return(o,r)=>(ae(),we(H(Pt),pt(t,{type:o.as==="button"?"button":void 0,onClick:r[0]||(r[0]=i=>H(n).onOpenChange(!1))}),{default:se(()=>[ue(o.$slots,"default")]),_:3},16,["type"]))}}),g7=ve({__name:"DialogTitle",props:{asChild:{type:Boolean},as:{default:"h2"}},setup(e){const t=e,n=bn();return We(),(o,r)=>(ae(),we(H(Pt),pt(t,{id:H(n).titleId}),{default:se(()=>[ue(o.$slots,"default")]),_:3},16,["id"]))}}),v7=ve({__name:"DialogDescription",props:{asChild:{type:Boolean},as:{default:"p"}},setup(e){const t=e;We();const n=bn();return(o,r)=>(ae(),we(H(Pt),pt(t,{id:H(n).descriptionId}),{default:se(()=>[ue(o.$slots,"default")]),_:3},16,["id"]))}}),[pf,m7]=Lr("AvatarRoot"),y7=ve({__name:"AvatarRoot",props:{asChild:{type:Boolean},as:{default:"span"}},setup(e){return We(),m7({imageLoadingStatus:$e("loading")}),(t,n)=>(ae(),we(H(Pt),{"as-child":t.asChild,as:t.as},{default:se(()=>[ue(t.$slots,"default")]),_:3},8,["as-child","as"]))}});function w7(e){const t=$e("idle"),n=$e(!1),o=r=>()=>{n.value&&(t.value=r)};return zn(()=>{n.value=!0,mt(e,r=>{if(!r)t.value="error";else{const i=new window.Image;t.value="loading",i.onload=o("loaded"),i.onerror=o("error"),i.src=r}},{immediate:!0})}),r1(()=>{n.value=!1}),t}const _7=ve({__name:"AvatarImage",props:{src:{},asChild:{type:Boolean},as:{default:"img"}},emits:["loadingStatusChange"],setup(e,{emit:t}){const n=e,o=t,{src:r}=At(n);We();const i=pf(),s=w7(r);return mt(s,l=>{o("loadingStatusChange",l),l!=="idle"&&(i.imageLoadingStatus.value=l)},{immediate:!0}),(l,a)=>yh((ae(),we(H(Pt),{role:"img","as-child":l.asChild,as:l.as,src:H(r)},{default:se(()=>[ue(l.$slots,"default")]),_:3},8,["as-child","as","src"])),[[x0,H(s)==="loaded"]])}}),b7=ve({__name:"AvatarFallback",props:{delayMs:{default:0},asChild:{type:Boolean},as:{default:"span"}},setup(e){const t=e,n=pf();We();const o=$e(!1);let r;return mt(n.imageLoadingStatus,i=>{i==="loading"&&(o.value=!1,t.delayMs?r=setTimeout(()=>{o.value=!0,clearTimeout(r)},t.delayMs):o.value=!0)},{immediate:!0}),(i,s)=>o.value&&H(n).imageLoadingStatus.value!=="loaded"?(ae(),we(H(Pt),{key:0,"as-child":i.asChild,as:i.as},{default:se(()=>[ue(i.$slots,"default")]),_:3},8,["as-child","as"])):yn("",!0)}}),[gf,F7]=Lr("PopperRoot"),$7=ve({__name:"PopperRoot",setup(e){const t=$e();return F7({anchor:t,onAnchorChange:n=>t.value=n}),(n,o)=>ue(n.$slots,"default")}}),x7=ve({__name:"PopperAnchor",props:{element:{},asChild:{type:Boolean},as:{}},setup(e){const t=e,{forwardRef:n,currentElement:o}=We(),r=gf();return mt(o,()=>{r.onAnchorChange(t.element??o.value)}),(i,s)=>(ae(),we(H(Pt),{ref:H(n),as:i.as,"as-child":i.asChild},{default:se(()=>[ue(i.$slots,"default")]),_:3},8,["as","as-child"]))}});function O7(e){return e!==null}function S7(e){return{name:"transformOrigin",options:e,fn(t){var n,o,r;const{placement:i,rects:s,middlewareData:l}=t,a=((n=l.arrow)==null?void 0:n.centerOffset)!==0,c=a?0:e.arrowWidth,f=a?0:e.arrowHeight,[u,d]=ga(i),h={start:"0%",center:"50%",end:"100%"}[d],p=(((o=l.arrow)==null?void 0:o.x)??0)+c/2,v=(((r=l.arrow)==null?void 0:r.y)??0)+f/2;let y="",g="";return u==="bottom"?(y=a?h:`${p}px`,g=`${-f}px`):u==="top"?(y=a?h:`${p}px`,g=`${s.floating.height+f}px`):u==="right"?(y=`${-f}px`,g=a?h:`${v}px`):u==="left"&&(y=`${s.floating.width+f}px`,g=a?h:`${v}px`),{data:{x:y,y:g}}}}}function ga(e){const[t,n="center"]=e.split("-");return[t,n]}const E7={side:"bottom",sideOffset:0,align:"center",alignOffset:0,arrowPadding:0,avoidCollisions:!0,collisionBoundary:()=>[],collisionPadding:0,sticky:"partial",hideWhenDetached:!1,updatePositionStrategy:"optimized",prioritizePosition:!1},[P7,C7]=Lr("PopperContent"),M7=ve({inheritAttrs:!1,__name:"PopperContent",props:Nh({side:{},sideOffset:{},align:{},alignOffset:{},avoidCollisions:{type:Boolean},collisionBoundary:{},collisionPadding:{},arrowPadding:{},sticky:{},hideWhenDetached:{type:Boolean},updatePositionStrategy:{},prioritizePosition:{type:Boolean},asChild:{type:Boolean},as:{}},{...E7}),emits:["placed"],setup(e,{emit:t}){const n=e,o=t,r=gf(),{forwardRef:i,currentElement:s}=We(),l=$e(),a=$e(),{width:c,height:f}=Bg(a),u=Oe(()=>n.side+(n.align!=="center"?`-${n.align}`:"")),d=Oe(()=>typeof n.collisionPadding=="number"?n.collisionPadding:{top:0,right:0,bottom:0,left:0,...n.collisionPadding}),h=Oe(()=>Array.isArray(n.collisionBoundary)?n.collisionBoundary:[n.collisionBoundary]),p=Oe(()=>({padding:d.value,boundary:h.value.filter(O7),altBoundary:h.value.length>0})),v=og(()=>[K8({mainAxis:n.sideOffset+f.value,alignmentAxis:n.alignOffset}),n.prioritizePosition&&n.avoidCollisions&&q0({...p.value}),n.avoidCollisions&&q8({mainAxis:!0,crossAxis:!!n.prioritizePosition,limiter:n.sticky==="partial"?X8():void 0,...p.value}),!n.prioritizePosition&&n.avoidCollisions&&q0({...p.value}),Y8({...p.value,apply:({elements:W,rects:re,availableWidth:K,availableHeight:Ee})=>{const{width:de,height:Ce}=re.reference,be=W.floating.style;be.setProperty("--radix-popper-available-width",`${K}px`),be.setProperty("--radix-popper-available-height",`${Ee}px`),be.setProperty("--radix-popper-anchor-width",`${de}px`),be.setProperty("--radix-popper-anchor-height",`${Ce}px`)}}),a.value&&tg({element:a.value,padding:n.arrowPadding}),S7({arrowWidth:c.value,arrowHeight:f.value}),n.hideWhenDetached&&Z8({strategy:"referenceHidden",...p.value})]),{floatingStyles:y,placement:g,isPositioned:w,middlewareData:$}=ng(r.anchor,l,{strategy:"fixed",placement:u,whileElementsMounted:(...W)=>G8(...W,{animationFrame:n.updatePositionStrategy==="always"}),middleware:v}),O=Oe(()=>ga(g.value)[0]),T=Oe(()=>ga(g.value)[1]);qt(()=>{w.value&&o("placed")});const S=Oe(()=>{var W;return((W=$.value.arrow)==null?void 0:W.centerOffset)!==0}),x=$e("");qt(()=>{s.value&&(x.value=window.getComputedStyle(s.value).zIndex)});const I=Oe(()=>{var W;return((W=$.value.arrow)==null?void 0:W.x)??0}),V=Oe(()=>{var W;return((W=$.value.arrow)==null?void 0:W.y)??0});return C7({placedSide:O,onArrowChange:W=>a.value=W,arrowX:I,arrowY:V,shouldHideArrow:S}),(W,re)=>{var K,Ee,de;return ae(),ur("div",{ref_key:"floatingRef",ref:l,"data-radix-popper-content-wrapper":"",style:Er({...H(y),transform:H(w)?H(y).transform:"translate(0, -200%)",minWidth:"max-content",zIndex:x.value,"--radix-popper-transform-origin":[(K=H($).transformOrigin)==null?void 0:K.x,(Ee=H($).transformOrigin)==null?void 0:Ee.y].join(" "),...((de=H($).hide)==null?void 0:de.referenceHidden)&&{visibility:"hidden",pointerEvents:"none"}})},[Be(H(Pt),pt({ref:H(i)},W.$attrs,{"as-child":n.asChild,as:W.as,"data-side":O.value,"data-align":T.value,style:{animation:H(w)?void 0:"none"}}),{default:se(()=>[ue(W.$slots,"default")]),_:3},16,["as-child","as","data-side","data-align","style"])],4)}}}),D7=rn("polygon",{points:"0,0 30,0 15,10"},null,-1),A7=ve({__name:"Arrow",props:{width:{default:10},height:{default:5},asChild:{type:Boolean},as:{default:"svg"}},setup(e){const t=e;return We(),(n,o)=>(ae(),we(H(Pt),pt(t,{width:n.width,height:n.height,viewBox:n.asChild?void 0:"0 0 30 10",preserveAspectRatio:n.asChild?void 0:"none"}),{default:se(()=>[ue(n.$slots,"default",{},()=>[D7])]),_:3},16,["width","height","viewBox","preserveAspectRatio"]))}}),T7={top:"bottom",right:"left",bottom:"top",left:"right"},j7=ve({inheritAttrs:!1,__name:"PopperArrow",props:{width:{},height:{},asChild:{type:Boolean},as:{default:"svg"}},setup(e){const{forwardRef:t}=We(),n=P7(),o=Oe(()=>T7[n.placedSide.value]);return(r,i)=>{var s,l,a,c;return ae(),ur("span",{ref:f=>{H(n).onArrowChange(f)},style:Er({position:"absolute",left:(s=H(n).arrowX)!=null&&s.value?`${(l=H(n).arrowX)==null?void 0:l.value}px`:void 0,top:(a=H(n).arrowY)!=null&&a.value?`${(c=H(n).arrowY)==null?void 0:c.value}px`:void 0,[o.value]:0,transformOrigin:{top:"",right:"0 0",bottom:"center 0",left:"100% 0"}[H(n).placedSide.value],transform:{top:"translateY(100%)",right:"translateY(50%) rotate(90deg) translateX(-50%)",bottom:"rotate(180deg)",left:"translateY(50%) rotate(-90deg) translateX(50%)"}[H(n).placedSide.value],visibility:H(n).shouldHideArrow.value?"hidden":void 0})},[Be(A7,pt(r.$attrs,{ref:H(t),style:{display:"block"},as:r.as,"as-child":r.asChild,width:r.width,height:r.height}),{default:se(()=>[ue(r.$slots,"default")]),_:3},16,["as","as-child","width","height"])],4)}}}),z7=ve({__name:"VisuallyHidden",props:{asChild:{type:Boolean},as:{default:"span"}},setup(e){return We(),(t,n)=>(ae(),we(H(Pt),{as:t.as,"as-child":t.asChild,style:{position:"absolute",border:0,width:"1px",display:"inline-block",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",wordWrap:"normal"}},{default:se(()=>[ue(t.$slots,"default")]),_:3},8,["as","as-child"]))}});function N7(){if(typeof matchMedia=="function")return matchMedia("(pointer:coarse)").matches?"coarse":"fine"}N7();const vf="tooltip.open",[va,k7]=Lr("TooltipProvider"),I7=ve({__name:"TooltipProvider",props:{delayDuration:{default:700},skipDelayDuration:{default:300},disableHoverableContent:{type:Boolean,default:!1},disableClosingTrigger:{type:Boolean},disabled:{type:Boolean},ignoreNonKeyboardFocus:{type:Boolean,default:!1}},setup(e){const t=e,{delayDuration:n,skipDelayDuration:o,disableHoverableContent:r,disableClosingTrigger:i,ignoreNonKeyboardFocus:s,disabled:l}=At(t);We();const a=$e(!0),c=$e(!1),{start:f,stop:u}=Q0(()=>{a.value=!0},o,{immediate:!1});return k7({isOpenDelayed:a,delayDuration:n,onOpen(){u(),a.value=!1},onClose(){f()},isPointerInTransitRef:c,disableHoverableContent:r,disableClosingTrigger:i,disabled:l,ignoreNonKeyboardFocus:s}),(d,h)=>ue(d.$slots,"default")}}),[Xi,B7]=Lr("TooltipRoot"),L7=ve({__name:"TooltipRoot",props:{defaultOpen:{type:Boolean,default:!1},open:{type:Boolean,default:void 0},delayDuration:{default:void 0},disableHoverableContent:{type:Boolean,default:void 0},disableClosingTrigger:{type:Boolean,default:void 0},disabled:{type:Boolean,default:void 0},ignoreNonKeyboardFocus:{type:Boolean,default:void 0}},emits:["update:open"],setup(e,{emit:t}){const n=e,o=t;We();const r=va(),i=Oe(()=>n.disableHoverableContent??r.disableHoverableContent.value),s=Oe(()=>n.disableClosingTrigger??r.disableClosingTrigger.value),l=Oe(()=>n.disabled??r.disabled.value),a=Oe(()=>n.delayDuration??r.delayDuration.value),c=Oe(()=>n.ignoreNonKeyboardFocus??r.ignoreNonKeyboardFocus.value),f=tf(n,"open",o,{defaultValue:n.defaultOpen,passive:n.open===void 0});mt(f,$=>{r.onClose&&($?(r.onOpen(),document.dispatchEvent(new CustomEvent(vf))):r.onClose())});const u=$e(!1),d=$e(),h=Oe(()=>f.value?u.value?"delayed-open":"instant-open":"closed"),{start:p,stop:v}=Q0(()=>{u.value=!0,f.value=!0},a,{immediate:!1});function y(){v(),u.value=!1,f.value=!0}function g(){v(),f.value=!1}function w(){p()}return B7({contentId:"",open:f,stateAttribute:h,trigger:d,onTriggerChange($){d.value=$},onTriggerEnter(){r.isOpenDelayed.value?w():y()},onTriggerLeave(){i.value?g():v()},onOpen:y,onClose:g,disableHoverableContent:i,disableClosingTrigger:s,disabled:l,ignoreNonKeyboardFocus:c}),($,O)=>(ae(),we(H($7),null,{default:se(()=>[ue($.$slots,"default",{open:H(f)})]),_:3}))}}),R7=ve({__name:"TooltipTrigger",props:{asChild:{type:Boolean},as:{default:"button"}},setup(e){const t=e,n=Xi(),o=va();n.contentId||(n.contentId=Zi(void 0,"radix-vue-tooltip-content"));const{forwardRef:r,currentElement:i}=We(),s=$e(!1),l=$e(!1),a=Oe(()=>n.disabled.value?{}:{click:v,focus:h,pointermove:u,pointerleave:d,pointerdown:f,blur:p});zn(()=>{n.onTriggerChange(i.value)});function c(){s.value=!1}function f(){s.value=!0,document.addEventListener("pointerup",c,{once:!0})}function u(y){y.pointerType!=="touch"&&!l.value&&!o.isPointerInTransitRef.value&&(n.onTriggerEnter(),l.value=!0)}function d(){n.onTriggerLeave(),l.value=!1}function h(y){var g,w;s.value||n.ignoreNonKeyboardFocus.value&&!((w=(g=y.target).matches)!=null&&w.call(g,":focus-visible"))||n.onOpen()}function p(){n.onClose()}function v(){n.disableClosingTrigger.value||n.onClose()}return(y,g)=>(ae(),we(H(x7),{"as-child":""},{default:se(()=>[Be(H(Pt),pt({ref:H(r),"aria-describedby":H(n).open.value?H(n).contentId:void 0,"data-state":H(n).stateAttribute.value,as:y.as,"as-child":t.asChild,"data-grace-area-trigger":""},Mh(a.value)),{default:se(()=>[ue(y.$slots,"default")]),_:3},16,["aria-describedby","data-state","as","as-child"])]),_:3}))}}),mf=ve({__name:"TooltipContentImpl",props:{ariaLabel:{},asChild:{type:Boolean},as:{},side:{default:"top"},sideOffset:{default:0},align:{default:"center"},alignOffset:{},avoidCollisions:{type:Boolean,default:!0},collisionBoundary:{default:()=>[]},collisionPadding:{default:0},arrowPadding:{default:0},sticky:{default:"partial"},hideWhenDetached:{type:Boolean,default:!1}},emits:["escapeKeyDown","pointerDownOutside"],setup(e,{emit:t}){const n=e,o=t,r=Xi(),{forwardRef:i}=We(),s=jh(),l=Oe(()=>{var f;return(f=s.default)==null?void 0:f.call(s)}),a=Oe(()=>{var f;if(n.ariaLabel)return n.ariaLabel;let u="";function d(h){typeof h.children=="string"?u+=h.children:Array.isArray(h.children)&&h.children.forEach(p=>d(p))}return(f=l.value)==null||f.forEach(h=>d(h)),u}),c=Oe(()=>{const{ariaLabel:f,...u}=n;return u});return zn(()=>{Gi(window,"scroll",f=>{const u=f.target;u!=null&&u.contains(r.trigger.value)&&r.onClose()}),Gi(window,vf,r.onClose)}),(f,u)=>(ae(),we(H(af),{"as-child":"","disable-outside-pointer-events":!1,onEscapeKeyDown:u[0]||(u[0]=d=>o("escapeKeyDown",d)),onPointerDownOutside:u[1]||(u[1]=d=>{var h;H(r).disableClosingTrigger.value&&(h=H(r).trigger.value)!=null&&h.contains(d.target)&&d.preventDefault(),o("pointerDownOutside",d)}),onFocusOutside:u[2]||(u[2]=l8(()=>{},["prevent"])),onDismiss:u[3]||(u[3]=d=>H(r).onClose())},{default:se(()=>[Be(H(M7),pt({ref:H(i),"data-state":H(r).stateAttribute.value},{...f.$attrs,...c.value},{style:{"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"}}),{default:se(()=>[ue(f.$slots,"default"),Be(H(z7),{id:H(r).contentId,role:"tooltip"},{default:se(()=>[vo(rr(a.value),1)]),_:1},8,["id"])]),_:3},16,["data-state"])]),_:3}))}}),V7=ve({__name:"TooltipContentHoverable",props:{ariaLabel:{},asChild:{type:Boolean},as:{},side:{},sideOffset:{},align:{},alignOffset:{},avoidCollisions:{type:Boolean},collisionBoundary:{},collisionPadding:{},arrowPadding:{},sticky:{},hideWhenDetached:{type:Boolean}},setup(e){const t=rf(e),{forwardRef:n,currentElement:o}=We(),{trigger:r,onClose:i}=Xi(),s=va(),{isPointerInTransit:l,onPointerExit:a}=Sg(r,o);return s.isPointerInTransitRef=l,a(()=>{i()}),(c,f)=>(ae(),we(mf,pt({ref:H(n)},H(t)),{default:se(()=>[ue(c.$slots,"default")]),_:3},16))}}),H7=ve({__name:"TooltipContent",props:{forceMount:{type:Boolean},ariaLabel:{},asChild:{type:Boolean},as:{},side:{default:"top"},sideOffset:{},align:{},alignOffset:{},avoidCollisions:{type:Boolean},collisionBoundary:{},collisionPadding:{},arrowPadding:{},sticky:{},hideWhenDetached:{type:Boolean}},emits:["escapeKeyDown","pointerDownOutside"],setup(e,{emit:t}){const n=e,o=t,r=Xi(),i=fa(n,o),{forwardRef:s}=We();return(l,a)=>(ae(),we(H(da),{present:l.forceMount||H(r).open.value},{default:se(()=>[(ae(),we(Ch(H(r).disableHoverableContent.value?mf:V7),pt({ref:H(s)},H(i)),{default:se(()=>[ue(l.$slots,"default")]),_:3},16))]),_:3},8,["present"]))}}),U7=ve({__name:"TooltipArrow",props:{width:{default:10},height:{default:5},asChild:{type:Boolean},as:{default:"svg"}},setup(e){const t=e;return We(),(n,o)=>(ae(),we(H(j7),uo(kr(t)),{default:se(()=>[ue(n.$slots,"default")]),_:3},16))}}),W7=ve({__name:"TooltipPortal",props:{to:{},disabled:{type:Boolean},forceMount:{type:Boolean}},setup(e){const t=e;return(n,o)=>(ae(),we(H(sf),uo(kr(t)),{default:se(()=>[ue(n.$slots,"default")]),_:3},16))}}),ma="/upwind.css",ya="-";function G7(e){const t=q7(e),{conflictingClassGroups:n,conflictingClassGroupModifiers:o}=e;function r(s){const l=s.split(ya);return l[0]===""&&l.length!==1&&l.shift(),yf(l,t)||K7(s)}function i(s,l){const a=n[s]||[];return l&&o[s]?[...a,...o[s]]:a}return{getClassGroupId:r,getConflictingClassGroupIds:i}}function yf(e,t){var s;if(e.length===0)return t.classGroupId;const n=e[0],o=t.nextPart.get(n),r=o?yf(e.slice(1),o):void 0;if(r)return r;if(t.validators.length===0)return;const i=e.join(ya);return(s=t.validators.find(({validator:l})=>l(i)))==null?void 0:s.classGroupId}const wf=/^\[(.+)\]$/;function K7(e){if(wf.test(e)){const t=wf.exec(e)[1],n=t==null?void 0:t.substring(0,t.indexOf(":"));if(n)return"arbitrary.."+n}}function q7(e){const{theme:t,prefix:n}=e,o={nextPart:new Map,validators:[]};return Z7(Object.entries(e.classGroups),n).forEach(([i,s])=>{wa(s,o,i,t)}),o}function wa(e,t,n,o){e.forEach(r=>{if(typeof r=="string"){const i=r===""?t:_f(t,r);i.classGroupId=n;return}if(typeof r=="function"){if(Y7(r)){wa(r(o),t,n,o);return}t.validators.push({validator:r,classGroupId:n});return}Object.entries(r).forEach(([i,s])=>{wa(s,_f(t,i),n,o)})})}function _f(e,t){let n=e;return t.split(ya).forEach(o=>{n.nextPart.has(o)||n.nextPart.set(o,{nextPart:new Map,validators:[]}),n=n.nextPart.get(o)}),n}function Y7(e){return e.isThemeGetter}function Z7(e,t){return t?e.map(([n,o])=>{const r=o.map(i=>typeof i=="string"?t+i:typeof i=="object"?Object.fromEntries(Object.entries(i).map(([s,l])=>[t+s,l])):i);return[n,r]}):e}function J7(e){if(e<1)return{get:()=>{},set:()=>{}};let t=0,n=new Map,o=new Map;function r(i,s){n.set(i,s),t++,t>e&&(t=0,o=n,n=new Map)}return{get(i){let s=n.get(i);if(s!==void 0)return s;if((s=o.get(i))!==void 0)return r(i,s),s},set(i,s){n.has(i)?n.set(i,s):r(i,s)}}}const bf="!";function X7(e){const{separator:t,experimentalParseClassName:n}=e,o=t.length===1,r=t[0],i=t.length;function s(l){const a=[];let c=0,f=0,u;for(let y=0;y<l.length;y++){let g=l[y];if(c===0){if(g===r&&(o||l.slice(y,y+i)===t)){a.push(l.slice(f,y)),f=y+i;continue}if(g==="/"){u=y;continue}}g==="["?c++:g==="]"&&c--}const d=a.length===0?l:l.substring(f),h=d.startsWith(bf),p=h?d.substring(1):d,v=u&&u>f?u-f:void 0;return{modifiers:a,hasImportantModifier:h,baseClassName:p,maybePostfixModifierPosition:v}}return n?function(a){return n({className:a,parseClassName:s})}:s}function Q7(e){if(e.length<=1)return e;const t=[];let n=[];return e.forEach(o=>{o[0]==="["?(t.push(...n.sort(),o),n=[]):n.push(o)}),t.push(...n.sort()),t}function e9(e){return{cache:J7(e.cacheSize),parseClassName:X7(e),...G7(e)}}const t9=/\s+/;function n9(e,t){const{parseClassName:n,getClassGroupId:o,getConflictingClassGroupIds:r}=t,i=new Set;return e.trim().split(t9).map(s=>{const{modifiers:l,hasImportantModifier:a,baseClassName:c,maybePostfixModifierPosition:f}=n(s);let u=!!f,d=o(u?c.substring(0,f):c);if(!d){if(!u)return{isTailwindClass:!1,originalClassName:s};if(d=o(c),!d)return{isTailwindClass:!1,originalClassName:s};u=!1}const h=Q7(l).join(":");return{isTailwindClass:!0,modifierId:a?h+bf:h,classGroupId:d,originalClassName:s,hasPostfixModifier:u}}).reverse().filter(s=>{if(!s.isTailwindClass)return!0;const{modifierId:l,classGroupId:a,hasPostfixModifier:c}=s,f=l+a;return i.has(f)?!1:(i.add(f),r(a,c).forEach(u=>i.add(l+u)),!0)}).reverse().map(s=>s.originalClassName).join(" ")}function r9(){let e=0,t,n,o="";for(;e<arguments.length;)(t=arguments[e++])&&(n=Ff(t))&&(o&&(o+=" "),o+=n);return o}function Ff(e){if(typeof e=="string")return e;let t,n="";for(let o=0;o<e.length;o++)e[o]&&(t=Ff(e[o]))&&(n&&(n+=" "),n+=t);return n}function o9(e,...t){let n,o,r,i=s;function s(a){const c=t.reduce((f,u)=>u(f),e());return n=e9(c),o=n.cache.get,r=n.cache.set,i=l,l(a)}function l(a){const c=o(a);if(c)return c;const f=n9(a,n);return r(a,f),f}return function(){return i(r9.apply(null,arguments))}}function Ze(e){const t=n=>n[e]||[];return t.isThemeGetter=!0,t}const $f=/^\[(?:([a-z-]+):)?(.+)\]$/i,i9=/^\d+\/\d+$/,s9=new Set(["px","full","screen"]),l9=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,a9=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,c9=/^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/,f9=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,u9=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;function Gn(e){return Vr(e)||s9.has(e)||i9.test(e)}function yr(e){return $o(e,"length",w9)}function Vr(e){return!!e&&!Number.isNaN(Number(e))}function Qi(e){return $o(e,"number",Vr)}function b1(e){return!!e&&Number.isInteger(Number(e))}function d9(e){return e.endsWith("%")&&Vr(e.slice(0,-1))}function De(e){return $f.test(e)}function wr(e){return l9.test(e)}const h9=new Set(["length","size","percentage"]);function p9(e){return $o(e,h9,xf)}function g9(e){return $o(e,"position",xf)}const v9=new Set(["image","url"]);function m9(e){return $o(e,v9,b9)}function y9(e){return $o(e,"",_9)}function F1(){return!0}function $o(e,t,n){const o=$f.exec(e);return o?o[1]?typeof t=="string"?o[1]===t:t.has(o[1]):n(o[2]):!1}function w9(e){return a9.test(e)&&!c9.test(e)}function xf(){return!1}function _9(e){return f9.test(e)}function b9(e){return u9.test(e)}function F9(){const e=Ze("colors"),t=Ze("spacing"),n=Ze("blur"),o=Ze("brightness"),r=Ze("borderColor"),i=Ze("borderRadius"),s=Ze("borderSpacing"),l=Ze("borderWidth"),a=Ze("contrast"),c=Ze("grayscale"),f=Ze("hueRotate"),u=Ze("invert"),d=Ze("gap"),h=Ze("gradientColorStops"),p=Ze("gradientColorStopPositions"),v=Ze("inset"),y=Ze("margin"),g=Ze("opacity"),w=Ze("padding"),$=Ze("saturate"),O=Ze("scale"),T=Ze("sepia"),S=Ze("skew"),x=Ze("space"),I=Ze("translate"),V=()=>["auto","contain","none"],W=()=>["auto","hidden","clip","visible","scroll"],re=()=>["auto",De,t],K=()=>[De,t],Ee=()=>["",Gn,yr],de=()=>["auto",Vr,De],Ce=()=>["bottom","center","left","left-bottom","left-top","right","right-bottom","right-top","top"],be=()=>["solid","dashed","dotted","double","none"],fe=()=>["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"],me=()=>["start","end","center","between","around","evenly","stretch"],He=()=>["","0",De],ee=()=>["auto","avoid","all","avoid-page","page","left","right","column"],j=()=>[Vr,Qi],z=()=>[Vr,De];return{cacheSize:500,separator:":",theme:{colors:[F1],spacing:[Gn,yr],blur:["none","",wr,De],brightness:j(),borderColor:[e],borderRadius:["none","","full",wr,De],borderSpacing:K(),borderWidth:Ee(),contrast:j(),grayscale:He(),hueRotate:z(),invert:He(),gap:K(),gradientColorStops:[e],gradientColorStopPositions:[d9,yr],inset:re(),margin:re(),opacity:j(),padding:K(),saturate:j(),scale:j(),sepia:He(),skew:z(),space:K(),translate:K()},classGroups:{aspect:[{aspect:["auto","square","video",De]}],container:["container"],columns:[{columns:[wr]}],"break-after":[{"break-after":ee()}],"break-before":[{"break-before":ee()}],"break-inside":[{"break-inside":["auto","avoid","avoid-page","avoid-column"]}],"box-decoration":[{"box-decoration":["slice","clone"]}],box:[{box:["border","content"]}],display:["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cell","table-column","table-column-group","table-footer-group","table-header-group","table-row-group","table-row","flow-root","grid","inline-grid","contents","list-item","hidden"],float:[{float:["right","left","none","start","end"]}],clear:[{clear:["left","right","both","none","start","end"]}],isolation:["isolate","isolation-auto"],"object-fit":[{object:["contain","cover","fill","none","scale-down"]}],"object-position":[{object:[...Ce(),De]}],overflow:[{overflow:W()}],"overflow-x":[{"overflow-x":W()}],"overflow-y":[{"overflow-y":W()}],overscroll:[{overscroll:V()}],"overscroll-x":[{"overscroll-x":V()}],"overscroll-y":[{"overscroll-y":V()}],position:["static","fixed","absolute","relative","sticky"],inset:[{inset:[v]}],"inset-x":[{"inset-x":[v]}],"inset-y":[{"inset-y":[v]}],start:[{start:[v]}],end:[{end:[v]}],top:[{top:[v]}],right:[{right:[v]}],bottom:[{bottom:[v]}],left:[{left:[v]}],visibility:["visible","invisible","collapse"],z:[{z:["auto",b1,De]}],basis:[{basis:re()}],"flex-direction":[{flex:["row","row-reverse","col","col-reverse"]}],"flex-wrap":[{flex:["wrap","wrap-reverse","nowrap"]}],flex:[{flex:["1","auto","initial","none",De]}],grow:[{grow:He()}],shrink:[{shrink:He()}],order:[{order:["first","last","none",b1,De]}],"grid-cols":[{"grid-cols":[F1]}],"col-start-end":[{col:["auto",{span:["full",b1,De]},De]}],"col-start":[{"col-start":de()}],"col-end":[{"col-end":de()}],"grid-rows":[{"grid-rows":[F1]}],"row-start-end":[{row:["auto",{span:[b1,De]},De]}],"row-start":[{"row-start":de()}],"row-end":[{"row-end":de()}],"grid-flow":[{"grid-flow":["row","col","dense","row-dense","col-dense"]}],"auto-cols":[{"auto-cols":["auto","min","max","fr",De]}],"auto-rows":[{"auto-rows":["auto","min","max","fr",De]}],gap:[{gap:[d]}],"gap-x":[{"gap-x":[d]}],"gap-y":[{"gap-y":[d]}],"justify-content":[{justify:["normal",...me()]}],"justify-items":[{"justify-items":["start","end","center","stretch"]}],"justify-self":[{"justify-self":["auto","start","end","center","stretch"]}],"align-content":[{content:["normal",...me(),"baseline"]}],"align-items":[{items:["start","end","center","baseline","stretch"]}],"align-self":[{self:["auto","start","end","center","stretch","baseline"]}],"place-content":[{"place-content":[...me(),"baseline"]}],"place-items":[{"place-items":["start","end","center","baseline","stretch"]}],"place-self":[{"place-self":["auto","start","end","center","stretch"]}],p:[{p:[w]}],px:[{px:[w]}],py:[{py:[w]}],ps:[{ps:[w]}],pe:[{pe:[w]}],pt:[{pt:[w]}],pr:[{pr:[w]}],pb:[{pb:[w]}],pl:[{pl:[w]}],m:[{m:[y]}],mx:[{mx:[y]}],my:[{my:[y]}],ms:[{ms:[y]}],me:[{me:[y]}],mt:[{mt:[y]}],mr:[{mr:[y]}],mb:[{mb:[y]}],ml:[{ml:[y]}],"space-x":[{"space-x":[x]}],"space-x-reverse":["space-x-reverse"],"space-y":[{"space-y":[x]}],"space-y-reverse":["space-y-reverse"],w:[{w:["auto","min","max","fit","svw","lvw","dvw",De,t]}],"min-w":[{"min-w":[De,t,"min","max","fit"]}],"max-w":[{"max-w":[De,t,"none","full","min","max","fit","prose",{screen:[wr]},wr]}],h:[{h:[De,t,"auto","min","max","fit","svh","lvh","dvh"]}],"min-h":[{"min-h":[De,t,"min","max","fit","svh","lvh","dvh"]}],"max-h":[{"max-h":[De,t,"min","max","fit","svh","lvh","dvh"]}],size:[{size:[De,t,"auto","min","max","fit"]}],"font-size":[{text:["base",wr,yr]}],"font-smoothing":["antialiased","subpixel-antialiased"],"font-style":["italic","not-italic"],"font-weight":[{font:["thin","extralight","light","normal","medium","semibold","bold","extrabold","black",Qi]}],"font-family":[{font:[F1]}],"fvn-normal":["normal-nums"],"fvn-ordinal":["ordinal"],"fvn-slashed-zero":["slashed-zero"],"fvn-figure":["lining-nums","oldstyle-nums"],"fvn-spacing":["proportional-nums","tabular-nums"],"fvn-fraction":["diagonal-fractions","stacked-fractons"],tracking:[{tracking:["tighter","tight","normal","wide","wider","widest",De]}],"line-clamp":[{"line-clamp":["none",Vr,Qi]}],leading:[{leading:["none","tight","snug","normal","relaxed","loose",Gn,De]}],"list-image":[{"list-image":["none",De]}],"list-style-type":[{list:["none","disc","decimal",De]}],"list-style-position":[{list:["inside","outside"]}],"placeholder-color":[{placeholder:[e]}],"placeholder-opacity":[{"placeholder-opacity":[g]}],"text-alignment":[{text:["left","center","right","justify","start","end"]}],"text-color":[{text:[e]}],"text-opacity":[{"text-opacity":[g]}],"text-decoration":["underline","overline","line-through","no-underline"],"text-decoration-style":[{decoration:[...be(),"wavy"]}],"text-decoration-thickness":[{decoration:["auto","from-font",Gn,yr]}],"underline-offset":[{"underline-offset":["auto",Gn,De]}],"text-decoration-color":[{decoration:[e]}],"text-transform":["uppercase","lowercase","capitalize","normal-case"],"text-overflow":["truncate","text-ellipsis","text-clip"],"text-wrap":[{text:["wrap","nowrap","balance","pretty"]}],indent:[{indent:K()}],"vertical-align":[{align:["baseline","top","middle","bottom","text-top","text-bottom","sub","super",De]}],whitespace:[{whitespace:["normal","nowrap","pre","pre-line","pre-wrap","break-spaces"]}],break:[{break:["normal","words","all","keep"]}],hyphens:[{hyphens:["none","manual","auto"]}],content:[{content:["none",De]}],"bg-attachment":[{bg:["fixed","local","scroll"]}],"bg-clip":[{"bg-clip":["border","padding","content","text"]}],"bg-opacity":[{"bg-opacity":[g]}],"bg-origin":[{"bg-origin":["border","padding","content"]}],"bg-position":[{bg:[...Ce(),g9]}],"bg-repeat":[{bg:["no-repeat",{repeat:["","x","y","round","space"]}]}],"bg-size":[{bg:["auto","cover","contain",p9]}],"bg-image":[{bg:["none",{"gradient-to":["t","tr","r","br","b","bl","l","tl"]},m9]}],"bg-color":[{bg:[e]}],"gradient-from-pos":[{from:[p]}],"gradient-via-pos":[{via:[p]}],"gradient-to-pos":[{to:[p]}],"gradient-from":[{from:[h]}],"gradient-via":[{via:[h]}],"gradient-to":[{to:[h]}],rounded:[{rounded:[i]}],"rounded-s":[{"rounded-s":[i]}],"rounded-e":[{"rounded-e":[i]}],"rounded-t":[{"rounded-t":[i]}],"rounded-r":[{"rounded-r":[i]}],"rounded-b":[{"rounded-b":[i]}],"rounded-l":[{"rounded-l":[i]}],"rounded-ss":[{"rounded-ss":[i]}],"rounded-se":[{"rounded-se":[i]}],"rounded-ee":[{"rounded-ee":[i]}],"rounded-es":[{"rounded-es":[i]}],"rounded-tl":[{"rounded-tl":[i]}],"rounded-tr":[{"rounded-tr":[i]}],"rounded-br":[{"rounded-br":[i]}],"rounded-bl":[{"rounded-bl":[i]}],"border-w":[{border:[l]}],"border-w-x":[{"border-x":[l]}],"border-w-y":[{"border-y":[l]}],"border-w-s":[{"border-s":[l]}],"border-w-e":[{"border-e":[l]}],"border-w-t":[{"border-t":[l]}],"border-w-r":[{"border-r":[l]}],"border-w-b":[{"border-b":[l]}],"border-w-l":[{"border-l":[l]}],"border-opacity":[{"border-opacity":[g]}],"border-style":[{border:[...be(),"hidden"]}],"divide-x":[{"divide-x":[l]}],"divide-x-reverse":["divide-x-reverse"],"divide-y":[{"divide-y":[l]}],"divide-y-reverse":["divide-y-reverse"],"divide-opacity":[{"divide-opacity":[g]}],"divide-style":[{divide:be()}],"border-color":[{border:[r]}],"border-color-x":[{"border-x":[r]}],"border-color-y":[{"border-y":[r]}],"border-color-t":[{"border-t":[r]}],"border-color-r":[{"border-r":[r]}],"border-color-b":[{"border-b":[r]}],"border-color-l":[{"border-l":[r]}],"divide-color":[{divide:[r]}],"outline-style":[{outline:["",...be()]}],"outline-offset":[{"outline-offset":[Gn,De]}],"outline-w":[{outline:[Gn,yr]}],"outline-color":[{outline:[e]}],"ring-w":[{ring:Ee()}],"ring-w-inset":["ring-inset"],"ring-color":[{ring:[e]}],"ring-opacity":[{"ring-opacity":[g]}],"ring-offset-w":[{"ring-offset":[Gn,yr]}],"ring-offset-color":[{"ring-offset":[e]}],shadow:[{shadow:["","inner","none",wr,y9]}],"shadow-color":[{shadow:[F1]}],opacity:[{opacity:[g]}],"mix-blend":[{"mix-blend":[...fe(),"plus-lighter","plus-darker"]}],"bg-blend":[{"bg-blend":fe()}],filter:[{filter:["","none"]}],blur:[{blur:[n]}],brightness:[{brightness:[o]}],contrast:[{contrast:[a]}],"drop-shadow":[{"drop-shadow":["","none",wr,De]}],grayscale:[{grayscale:[c]}],"hue-rotate":[{"hue-rotate":[f]}],invert:[{invert:[u]}],saturate:[{saturate:[$]}],sepia:[{sepia:[T]}],"backdrop-filter":[{"backdrop-filter":["","none"]}],"backdrop-blur":[{"backdrop-blur":[n]}],"backdrop-brightness":[{"backdrop-brightness":[o]}],"backdrop-contrast":[{"backdrop-contrast":[a]}],"backdrop-grayscale":[{"backdrop-grayscale":[c]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[f]}],"backdrop-invert":[{"backdrop-invert":[u]}],"backdrop-opacity":[{"backdrop-opacity":[g]}],"backdrop-saturate":[{"backdrop-saturate":[$]}],"backdrop-sepia":[{"backdrop-sepia":[T]}],"border-collapse":[{border:["collapse","separate"]}],"border-spacing":[{"border-spacing":[s]}],"border-spacing-x":[{"border-spacing-x":[s]}],"border-spacing-y":[{"border-spacing-y":[s]}],"table-layout":[{table:["auto","fixed"]}],caption:[{caption:["top","bottom"]}],transition:[{transition:["none","all","","colors","opacity","shadow","transform",De]}],duration:[{duration:z()}],ease:[{ease:["linear","in","out","in-out",De]}],delay:[{delay:z()}],animate:[{animate:["none","spin","ping","pulse","bounce",De]}],transform:[{transform:["","gpu","none"]}],scale:[{scale:[O]}],"scale-x":[{"scale-x":[O]}],"scale-y":[{"scale-y":[O]}],rotate:[{rotate:[b1,De]}],"translate-x":[{"translate-x":[I]}],"translate-y":[{"translate-y":[I]}],"skew-x":[{"skew-x":[S]}],"skew-y":[{"skew-y":[S]}],"transform-origin":[{origin:["center","top","top-right","right","bottom-right","bottom","bottom-left","left","top-left",De]}],accent:[{accent:["auto",e]}],appearance:[{appearance:["none","auto"]}],cursor:[{cursor:["auto","default","pointer","wait","text","move","help","not-allowed","none","context-menu","progress","cell","crosshair","vertical-text","alias","copy","no-drop","grab","grabbing","all-scroll","col-resize","row-resize","n-resize","e-resize","s-resize","w-resize","ne-resize","nw-resize","se-resize","sw-resize","ew-resize","ns-resize","nesw-resize","nwse-resize","zoom-in","zoom-out",De]}],"caret-color":[{caret:[e]}],"pointer-events":[{"pointer-events":["none","auto"]}],resize:[{resize:["none","y","x",""]}],"scroll-behavior":[{scroll:["auto","smooth"]}],"scroll-m":[{"scroll-m":K()}],"scroll-mx":[{"scroll-mx":K()}],"scroll-my":[{"scroll-my":K()}],"scroll-ms":[{"scroll-ms":K()}],"scroll-me":[{"scroll-me":K()}],"scroll-mt":[{"scroll-mt":K()}],"scroll-mr":[{"scroll-mr":K()}],"scroll-mb":[{"scroll-mb":K()}],"scroll-ml":[{"scroll-ml":K()}],"scroll-p":[{"scroll-p":K()}],"scroll-px":[{"scroll-px":K()}],"scroll-py":[{"scroll-py":K()}],"scroll-ps":[{"scroll-ps":K()}],"scroll-pe":[{"scroll-pe":K()}],"scroll-pt":[{"scroll-pt":K()}],"scroll-pr":[{"scroll-pr":K()}],"scroll-pb":[{"scroll-pb":K()}],"scroll-pl":[{"scroll-pl":K()}],"snap-align":[{snap:["start","end","center","align-none"]}],"snap-stop":[{snap:["normal","always"]}],"snap-type":[{snap:["none","x","y","both"]}],"snap-strictness":[{snap:["mandatory","proximity"]}],touch:[{touch:["auto","none","manipulation"]}],"touch-x":[{"touch-pan":["x","left","right"]}],"touch-y":[{"touch-pan":["y","up","down"]}],"touch-pz":["touch-pinch-zoom"],select:[{select:["none","text","all","auto"]}],"will-change":[{"will-change":["auto","scroll","contents","transform",De]}],fill:[{fill:[e,"none"]}],"stroke-w":[{stroke:[Gn,yr,Qi]}],stroke:[{stroke:[e,"none"]}],sr:["sr-only","not-sr-only"],"forced-color-adjust":[{"forced-color-adjust":["auto","none"]}]},conflictingClassGroups:{overflow:["overflow-x","overflow-y"],overscroll:["overscroll-x","overscroll-y"],inset:["inset-x","inset-y","start","end","top","right","bottom","left"],"inset-x":["right","left"],"inset-y":["top","bottom"],flex:["basis","grow","shrink"],gap:["gap-x","gap-y"],p:["px","py","ps","pe","pt","pr","pb","pl"],px:["pr","pl"],py:["pt","pb"],m:["mx","my","ms","me","mt","mr","mb","ml"],mx:["mr","ml"],my:["mt","mb"],size:["w","h"],"font-size":["leading"],"fvn-normal":["fvn-ordinal","fvn-slashed-zero","fvn-figure","fvn-spacing","fvn-fraction"],"fvn-ordinal":["fvn-normal"],"fvn-slashed-zero":["fvn-normal"],"fvn-figure":["fvn-normal"],"fvn-spacing":["fvn-normal"],"fvn-fraction":["fvn-normal"],"line-clamp":["display","overflow"],rounded:["rounded-s","rounded-e","rounded-t","rounded-r","rounded-b","rounded-l","rounded-ss","rounded-se","rounded-ee","rounded-es","rounded-tl","rounded-tr","rounded-br","rounded-bl"],"rounded-s":["rounded-ss","rounded-es"],"rounded-e":["rounded-se","rounded-ee"],"rounded-t":["rounded-tl","rounded-tr"],"rounded-r":["rounded-tr","rounded-br"],"rounded-b":["rounded-br","rounded-bl"],"rounded-l":["rounded-tl","rounded-bl"],"border-spacing":["border-spacing-x","border-spacing-y"],"border-w":["border-w-s","border-w-e","border-w-t","border-w-r","border-w-b","border-w-l"],"border-w-x":["border-w-r","border-w-l"],"border-w-y":["border-w-t","border-w-b"],"border-color":["border-color-t","border-color-r","border-color-b","border-color-l"],"border-color-x":["border-color-r","border-color-l"],"border-color-y":["border-color-t","border-color-b"],"scroll-m":["scroll-mx","scroll-my","scroll-ms","scroll-me","scroll-mt","scroll-mr","scroll-mb","scroll-ml"],"scroll-mx":["scroll-mr","scroll-ml"],"scroll-my":["scroll-mt","scroll-mb"],"scroll-p":["scroll-px","scroll-py","scroll-ps","scroll-pe","scroll-pt","scroll-pr","scroll-pb","scroll-pl"],"scroll-px":["scroll-pr","scroll-pl"],"scroll-py":["scroll-pt","scroll-pb"],touch:["touch-x","touch-y","touch-pz"],"touch-x":["touch"],"touch-y":["touch"],"touch-pz":["touch"]},conflictingClassGroupModifiers:{"font-size":["leading"]}}}const $9=o9(F9);function Of(e){var t,n,o="";if(typeof e=="string"||typeof e=="number")o+=e;else if(typeof e=="object")if(Array.isArray(e)){var r=e.length;for(t=0;t<r;t++)e[t]&&(n=Of(e[t]))&&(o&&(o+=" "),o+=n)}else for(n in e)e[n]&&(o&&(o+=" "),o+=n);return o}function x9(){for(var e,t,n=0,o="",r=arguments.length;n<r;n++)(e=arguments[n])&&(t=Of(e))&&(o&&(o+=" "),o+=t);return o}var Sf=typeof global=="object"&&global&&global.Object===Object&&global,O9=typeof self=="object"&&self&&self.Object===Object&&self,Kn=Sf||O9||Function("return this")(),Fn=Kn.Symbol,Ef=Object.prototype,S9=Ef.hasOwnProperty,E9=Ef.toString,$1=Fn?Fn.toStringTag:void 0;function P9(e){var t=S9.call(e,$1),n=e[$1];try{e[$1]=void 0;var o=!0}catch{}var r=E9.call(e);return o&&(t?e[$1]=n:delete e[$1]),r}var C9=Object.prototype,M9=C9.toString;function D9(e){return M9.call(e)}var A9="[object Null]",T9="[object Undefined]",Pf=Fn?Fn.toStringTag:void 0;function Hr(e){return e==null?e===void 0?T9:A9:Pf&&Pf in Object(e)?P9(e):D9(e)}function Ur(e){return e!=null&&typeof e=="object"}var j9="[object Symbol]";function es(e){return typeof e=="symbol"||Ur(e)&&Hr(e)==j9}function ts(e,t){for(var n=-1,o=e==null?0:e.length,r=Array(o);++n<o;)r[n]=t(e[n],n,e);return r}var Ct=Array.isArray,z9=1/0,Cf=Fn?Fn.prototype:void 0,Mf=Cf?Cf.toString:void 0;function Df(e){if(typeof e=="string")return e;if(Ct(e))return ts(e,Df)+"";if(es(e))return Mf?Mf.call(e):"";var t=e+"";return t=="0"&&1/e==-z9?"-0":t}var N9=/\s/;function k9(e){for(var t=e.length;t--&&N9.test(e.charAt(t)););return t}var I9=/^\s+/;function B9(e){return e&&e.slice(0,k9(e)+1).replace(I9,"")}function an(e){var t=typeof e;return e!=null&&(t=="object"||t=="function")}var Af=NaN,L9=/^[-+]0x[0-9a-f]+$/i,R9=/^0b[01]+$/i,V9=/^0o[0-7]+$/i,H9=parseInt;function U9(e){if(typeof e=="number")return e;if(es(e))return Af;if(an(e)){var t=typeof e.valueOf=="function"?e.valueOf():e;e=an(t)?t+"":t}if(typeof e!="string")return e===0?e:+e;e=B9(e);var n=R9.test(e);return n||V9.test(e)?H9(e.slice(2),n?2:8):L9.test(e)?Af:+e}var Tf=1/0,W9=17976931348623157e292;function G9(e){if(!e)return e===0?e:0;if(e=U9(e),e===Tf||e===-Tf){var t=e<0?-1:1;return t*W9}return e===e?e:0}function jf(e){var t=G9(e),n=t%1;return t===t?n?t-n:t:0}function zf(e){return e}var K9="[object AsyncFunction]",q9="[object Function]",Y9="[object GeneratorFunction]",Z9="[object Proxy]";function _a(e){if(!an(e))return!1;var t=Hr(e);return t==q9||t==Y9||t==K9||t==Z9}var ba=Kn["__core-js_shared__"],Nf=function(){var e=/[^.]+$/.exec(ba&&ba.keys&&ba.keys.IE_PROTO||"");return e?"Symbol(src)_1."+e:""}();function J9(e){return!!Nf&&Nf in e}var X9=Function.prototype,Q9=X9.toString;function Wr(e){if(e!=null){try{return Q9.call(e)}catch{}try{return e+""}catch{}}return""}var ev=/[\\^$.*+?()[\]{}|]/g,tv=/^\[object .+?Constructor\]$/,nv=Function.prototype,rv=Object.prototype,ov=nv.toString,iv=rv.hasOwnProperty,sv=RegExp("^"+ov.call(iv).replace(ev,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");function lv(e){if(!an(e)||J9(e))return!1;var t=_a(e)?sv:tv;return t.test(Wr(e))}function av(e,t){return e==null?void 0:e[t]}function Gr(e,t){var n=av(e,t);return lv(n)?n:void 0}var Fa=Gr(Kn,"WeakMap"),kf=function(){try{var e=Gr(Object,"defineProperty");return e({},"",{}),e}catch{}}();function cv(e,t){for(var n=-1,o=e==null?0:e.length;++n<o&&t(e[n],n,e)!==!1;);return e}function If(e,t,n,o){for(var r=e.length,i=n+-1;++i<r;)if(t(e[i],i,e))return i;return-1}function fv(e){return e!==e}function uv(e,t,n){for(var o=n-1,r=e.length;++o<r;)if(e[o]===t)return o;return-1}function dv(e,t,n){return t===t?uv(e,t,n):If(e,fv,n)}var hv=9007199254740991,pv=/^(?:0|[1-9]\d*)$/;function $a(e,t){var n=typeof e;return t=t??hv,!!t&&(n=="number"||n!="symbol"&&pv.test(e))&&e>-1&&e%1==0&&e<t}function Bf(e,t,n){t=="__proto__"&&kf?kf(e,t,{configurable:!0,enumerable:!0,value:n,writable:!0}):e[t]=n}function xa(e,t){return e===t||e!==e&&t!==t}var gv=Object.prototype,vv=gv.hasOwnProperty;function mv(e,t,n){var o=e[t];(!(vv.call(e,t)&&xa(o,n))||n===void 0&&!(t in e))&&Bf(e,t,n)}var yv=9007199254740991;function Oa(e){return typeof e=="number"&&e>-1&&e%1==0&&e<=yv}function Kr(e){return e!=null&&Oa(e.length)&&!_a(e)}var wv=Object.prototype;function Sa(e){var t=e&&e.constructor,n=typeof t=="function"&&t.prototype||wv;return e===n}function _v(e,t){for(var n=-1,o=Array(e);++n<e;)o[n]=t(n);return o}var bv="[object Arguments]";function Lf(e){return Ur(e)&&Hr(e)==bv}var Rf=Object.prototype,Fv=Rf.hasOwnProperty,$v=Rf.propertyIsEnumerable,ns=Lf(function(){return arguments}())?Lf:function(e){return Ur(e)&&Fv.call(e,"callee")&&!$v.call(e,"callee")};function xv(){return!1}var Vf=typeof exports=="object"&&exports&&!exports.nodeType&&exports,Hf=Vf&&typeof module=="object"&&module&&!module.nodeType&&module,Ov=Hf&&Hf.exports===Vf,Uf=Ov?Kn.Buffer:void 0,Sv=Uf?Uf.isBuffer:void 0,rs=Sv||xv,Ev="[object Arguments]",Pv="[object Array]",Cv="[object Boolean]",Mv="[object Date]",Dv="[object Error]",Av="[object Function]",Tv="[object Map]",jv="[object Number]",zv="[object Object]",Nv="[object RegExp]",kv="[object Set]",Iv="[object String]",Bv="[object WeakMap]",Lv="[object ArrayBuffer]",Rv="[object DataView]",Vv="[object Float32Array]",Hv="[object Float64Array]",Uv="[object Int8Array]",Wv="[object Int16Array]",Gv="[object Int32Array]",Kv="[object Uint8Array]",qv="[object Uint8ClampedArray]",Yv="[object Uint16Array]",Zv="[object Uint32Array]",Je={};Je[Vv]=Je[Hv]=Je[Uv]=Je[Wv]=Je[Gv]=Je[Kv]=Je[qv]=Je[Yv]=Je[Zv]=!0,Je[Ev]=Je[Pv]=Je[Lv]=Je[Cv]=Je[Rv]=Je[Mv]=Je[Dv]=Je[Av]=Je[Tv]=Je[jv]=Je[zv]=Je[Nv]=Je[kv]=Je[Iv]=Je[Bv]=!1;function Jv(e){return Ur(e)&&Oa(e.length)&&!!Je[Hr(e)]}function Xv(e){return function(t){return e(t)}}var Wf=typeof exports=="object"&&exports&&!exports.nodeType&&exports,x1=Wf&&typeof module=="object"&&module&&!module.nodeType&&module,Qv=x1&&x1.exports===Wf,Ea=Qv&&Sf.process,Gf=function(){try{var e=x1&&x1.require&&x1.require("util").types;return e||Ea&&Ea.binding&&Ea.binding("util")}catch{}}(),Kf=Gf&&Gf.isTypedArray,Pa=Kf?Xv(Kf):Jv,em=Object.prototype,tm=em.hasOwnProperty;function qf(e,t){var n=Ct(e),o=!n&&ns(e),r=!n&&!o&&rs(e),i=!n&&!o&&!r&&Pa(e),s=n||o||r||i,l=s?_v(e.length,String):[],a=l.length;for(var c in e)(t||tm.call(e,c))&&!(s&&(c=="length"||r&&(c=="offset"||c=="parent")||i&&(c=="buffer"||c=="byteLength"||c=="byteOffset")||$a(c,a)))&&l.push(c);return l}function Yf(e,t){return function(n){return e(t(n))}}var nm=Yf(Object.keys,Object),rm=Object.prototype,om=rm.hasOwnProperty;function Zf(e){if(!Sa(e))return nm(e);var t=[];for(var n in Object(e))om.call(e,n)&&n!="constructor"&&t.push(n);return t}function O1(e){return Kr(e)?qf(e):Zf(e)}function im(e){var t=[];if(e!=null)for(var n in Object(e))t.push(n);return t}var sm=Object.prototype,lm=sm.hasOwnProperty;function am(e){if(!an(e))return im(e);var t=Sa(e),n=[];for(var o in e)o=="constructor"&&(t||!lm.call(e,o))||n.push(o);return n}function cm(e){return Kr(e)?qf(e,!0):am(e)}var fm=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,um=/^\w*$/;function Ca(e,t){if(Ct(e))return!1;var n=typeof e;return n=="number"||n=="symbol"||n=="boolean"||e==null||es(e)?!0:um.test(e)||!fm.test(e)||t!=null&&e in Object(t)}var S1=Gr(Object,"create");function dm(){this.__data__=S1?S1(null):{},this.size=0}function hm(e){var t=this.has(e)&&delete this.__data__[e];return this.size-=t?1:0,t}var pm="__lodash_hash_undefined__",gm=Object.prototype,vm=gm.hasOwnProperty;function mm(e){var t=this.__data__;if(S1){var n=t[e];return n===pm?void 0:n}return vm.call(t,e)?t[e]:void 0}var ym=Object.prototype,wm=ym.hasOwnProperty;function _m(e){var t=this.__data__;return S1?t[e]!==void 0:wm.call(t,e)}var bm="__lodash_hash_undefined__";function Fm(e,t){var n=this.__data__;return this.size+=this.has(e)?0:1,n[e]=S1&&t===void 0?bm:t,this}function qr(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var o=e[t];this.set(o[0],o[1])}}qr.prototype.clear=dm,qr.prototype.delete=hm,qr.prototype.get=mm,qr.prototype.has=_m,qr.prototype.set=Fm;function $m(){this.__data__=[],this.size=0}function os(e,t){for(var n=e.length;n--;)if(xa(e[n][0],t))return n;return-1}var xm=Array.prototype,Om=xm.splice;function Sm(e){var t=this.__data__,n=os(t,e);if(n<0)return!1;var o=t.length-1;return n==o?t.pop():Om.call(t,n,1),--this.size,!0}function Em(e){var t=this.__data__,n=os(t,e);return n<0?void 0:t[n][1]}function Pm(e){return os(this.__data__,e)>-1}function Cm(e,t){var n=this.__data__,o=os(n,e);return o<0?(++this.size,n.push([e,t])):n[o][1]=t,this}function qn(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var o=e[t];this.set(o[0],o[1])}}qn.prototype.clear=$m,qn.prototype.delete=Sm,qn.prototype.get=Em,qn.prototype.has=Pm,qn.prototype.set=Cm;var E1=Gr(Kn,"Map");function Mm(){this.size=0,this.__data__={hash:new qr,map:new(E1||qn),string:new qr}}function Dm(e){var t=typeof e;return t=="string"||t=="number"||t=="symbol"||t=="boolean"?e!=="__proto__":e===null}function is(e,t){var n=e.__data__;return Dm(t)?n[typeof t=="string"?"string":"hash"]:n.map}function Am(e){var t=is(this,e).delete(e);return this.size-=t?1:0,t}function Tm(e){return is(this,e).get(e)}function jm(e){return is(this,e).has(e)}function zm(e,t){var n=is(this,e),o=n.size;return n.set(e,t),this.size+=n.size==o?0:1,this}function Yn(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var o=e[t];this.set(o[0],o[1])}}Yn.prototype.clear=Mm,Yn.prototype.delete=Am,Yn.prototype.get=Tm,Yn.prototype.has=jm,Yn.prototype.set=zm;var Nm="Expected a function";function Ma(e,t){if(typeof e!="function"||t!=null&&typeof t!="function")throw new TypeError(Nm);var n=function(){var o=arguments,r=t?t.apply(this,o):o[0],i=n.cache;if(i.has(r))return i.get(r);var s=e.apply(this,o);return n.cache=i.set(r,s)||i,s};return n.cache=new(Ma.Cache||Yn),n}Ma.Cache=Yn;var km=500;function Im(e){var t=Ma(e,function(o){return n.size===km&&n.clear(),o}),n=t.cache;return t}var Bm=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,Lm=/\\(\\)?/g,Rm=Im(function(e){var t=[];return e.charCodeAt(0)===46&&t.push(""),e.replace(Bm,function(n,o,r,i){t.push(r?i.replace(Lm,"$1"):o||n)}),t});function Vm(e){return e==null?"":Df(e)}function ss(e,t){return Ct(e)?e:Ca(e,t)?[e]:Rm(Vm(e))}var Hm=1/0;function P1(e){if(typeof e=="string"||es(e))return e;var t=e+"";return t=="0"&&1/e==-Hm?"-0":t}function Da(e,t){t=ss(t,e);for(var n=0,o=t.length;e!=null&&n<o;)e=e[P1(t[n++])];return n&&n==o?e:void 0}function Aa(e,t,n){var o=e==null?void 0:Da(e,t);return o===void 0?n:o}function Jf(e,t){for(var n=-1,o=t.length,r=e.length;++n<o;)e[r+n]=t[n];return e}var Xf=Fn?Fn.isConcatSpreadable:void 0;function Um(e){return Ct(e)||ns(e)||!!(Xf&&e&&e[Xf])}function Qf(e,t,n,o,r){var i=-1,s=e.length;for(n||(n=Um),r||(r=[]);++i<s;){var l=e[i];n(l)?Qf(l,t-1,n,o,r):r[r.length]=l}return r}var Wm=Yf(Object.getPrototypeOf,Object);function Gm(e,t,n,o){var r=-1,i=e==null?0:e.length;for(o&&i&&(n=e[++r]);++r<i;)n=t(n,e[r],r,e);return n}function Km(){this.__data__=new qn,this.size=0}function qm(e){var t=this.__data__,n=t.delete(e);return this.size=t.size,n}function Ym(e){return this.__data__.get(e)}function Zm(e){return this.__data__.has(e)}var Jm=200;function Xm(e,t){var n=this.__data__;if(n instanceof qn){var o=n.__data__;if(!E1||o.length<Jm-1)return o.push([e,t]),this.size=++n.size,this;n=this.__data__=new Yn(o)}return n.set(e,t),this.size=n.size,this}function Zn(e){var t=this.__data__=new qn(e);this.size=t.size}Zn.prototype.clear=Km,Zn.prototype.delete=qm,Zn.prototype.get=Ym,Zn.prototype.has=Zm,Zn.prototype.set=Xm;function Qm(e,t){for(var n=-1,o=e==null?0:e.length,r=0,i=[];++n<o;){var s=e[n];t(s,n,e)&&(i[r++]=s)}return i}function eu(){return[]}var ey=Object.prototype,ty=ey.propertyIsEnumerable,tu=Object.getOwnPropertySymbols,nu=tu?function(e){return e==null?[]:(e=Object(e),Qm(tu(e),function(t){return ty.call(e,t)}))}:eu,ny=Object.getOwnPropertySymbols,ry=ny?function(e){for(var t=[];e;)Jf(t,nu(e)),e=Wm(e);return t}:eu;function ru(e,t,n){var o=t(e);return Ct(e)?o:Jf(o,n(e))}function ou(e){return ru(e,O1,nu)}function oy(e){return ru(e,cm,ry)}var Ta=Gr(Kn,"DataView"),ja=Gr(Kn,"Promise"),za=Gr(Kn,"Set"),iu="[object Map]",iy="[object Object]",su="[object Promise]",lu="[object Set]",au="[object WeakMap]",cu="[object DataView]",sy=Wr(Ta),ly=Wr(E1),ay=Wr(ja),cy=Wr(za),fy=Wr(Fa),Jn=Hr;(Ta&&Jn(new Ta(new ArrayBuffer(1)))!=cu||E1&&Jn(new E1)!=iu||ja&&Jn(ja.resolve())!=su||za&&Jn(new za)!=lu||Fa&&Jn(new Fa)!=au)&&(Jn=function(e){var t=Hr(e),n=t==iy?e.constructor:void 0,o=n?Wr(n):"";if(o)switch(o){case sy:return cu;case ly:return iu;case ay:return su;case cy:return lu;case fy:return au}return t});var fu=Kn.Uint8Array,uy="__lodash_hash_undefined__";function dy(e){return this.__data__.set(e,uy),this}function hy(e){return this.__data__.has(e)}function ls(e){var t=-1,n=e==null?0:e.length;for(this.__data__=new Yn;++t<n;)this.add(e[t])}ls.prototype.add=ls.prototype.push=dy,ls.prototype.has=hy;function py(e,t){for(var n=-1,o=e==null?0:e.length;++n<o;)if(t(e[n],n,e))return!0;return!1}function gy(e,t){return e.has(t)}var vy=1,my=2;function uu(e,t,n,o,r,i){var s=n&vy,l=e.length,a=t.length;if(l!=a&&!(s&&a>l))return!1;var c=i.get(e),f=i.get(t);if(c&&f)return c==t&&f==e;var u=-1,d=!0,h=n&my?new ls:void 0;for(i.set(e,t),i.set(t,e);++u<l;){var p=e[u],v=t[u];if(o)var y=s?o(v,p,u,t,e,i):o(p,v,u,e,t,i);if(y!==void 0){if(y)continue;d=!1;break}if(h){if(!py(t,function(g,w){if(!gy(h,w)&&(p===g||r(p,g,n,o,i)))return h.push(w)})){d=!1;break}}else if(!(p===v||r(p,v,n,o,i))){d=!1;break}}return i.delete(e),i.delete(t),d}function yy(e){var t=-1,n=Array(e.size);return e.forEach(function(o,r){n[++t]=[r,o]}),n}function wy(e){var t=-1,n=Array(e.size);return e.forEach(function(o){n[++t]=o}),n}var _y=1,by=2,Fy="[object Boolean]",$y="[object Date]",xy="[object Error]",Oy="[object Map]",Sy="[object Number]",Ey="[object RegExp]",Py="[object Set]",Cy="[object String]",My="[object Symbol]",Dy="[object ArrayBuffer]",Ay="[object DataView]",du=Fn?Fn.prototype:void 0,Na=du?du.valueOf:void 0;function Ty(e,t,n,o,r,i,s){switch(n){case Ay:if(e.byteLength!=t.byteLength||e.byteOffset!=t.byteOffset)return!1;e=e.buffer,t=t.buffer;case Dy:return!(e.byteLength!=t.byteLength||!i(new fu(e),new fu(t)));case Fy:case $y:case Sy:return xa(+e,+t);case xy:return e.name==t.name&&e.message==t.message;case Ey:case Cy:return e==t+"";case Oy:var l=yy;case Py:var a=o&_y;if(l||(l=wy),e.size!=t.size&&!a)return!1;var c=s.get(e);if(c)return c==t;o|=by,s.set(e,t);var f=uu(l(e),l(t),o,r,i,s);return s.delete(e),f;case My:if(Na)return Na.call(e)==Na.call(t)}return!1}var jy=1,zy=Object.prototype,Ny=zy.hasOwnProperty;function ky(e,t,n,o,r,i){var s=n&jy,l=ou(e),a=l.length,c=ou(t),f=c.length;if(a!=f&&!s)return!1;for(var u=a;u--;){var d=l[u];if(!(s?d in t:Ny.call(t,d)))return!1}var h=i.get(e),p=i.get(t);if(h&&p)return h==t&&p==e;var v=!0;i.set(e,t),i.set(t,e);for(var y=s;++u<a;){d=l[u];var g=e[d],w=t[d];if(o)var $=s?o(w,g,d,t,e,i):o(g,w,d,e,t,i);if(!($===void 0?g===w||r(g,w,n,o,i):$)){v=!1;break}y||(y=d=="constructor")}if(v&&!y){var O=e.constructor,T=t.constructor;O!=T&&"constructor"in e&&"constructor"in t&&!(typeof O=="function"&&O instanceof O&&typeof T=="function"&&T instanceof T)&&(v=!1)}return i.delete(e),i.delete(t),v}var Iy=1,hu="[object Arguments]",pu="[object Array]",as="[object Object]",By=Object.prototype,gu=By.hasOwnProperty;function Ly(e,t,n,o,r,i){var s=Ct(e),l=Ct(t),a=s?pu:Jn(e),c=l?pu:Jn(t);a=a==hu?as:a,c=c==hu?as:c;var f=a==as,u=c==as,d=a==c;if(d&&rs(e)){if(!rs(t))return!1;s=!0,f=!1}if(d&&!f)return i||(i=new Zn),s||Pa(e)?uu(e,t,n,o,r,i):Ty(e,t,a,n,o,r,i);if(!(n&Iy)){var h=f&&gu.call(e,"__wrapped__"),p=u&&gu.call(t,"__wrapped__");if(h||p){var v=h?e.value():e,y=p?t.value():t;return i||(i=new Zn),r(v,y,n,o,i)}}return d?(i||(i=new Zn),ky(e,t,n,o,r,i)):!1}function ka(e,t,n,o,r){return e===t?!0:e==null||t==null||!Ur(e)&&!Ur(t)?e!==e&&t!==t:Ly(e,t,n,o,ka,r)}var Ry=1,Vy=2;function Hy(e,t,n,o){var r=n.length,i=r;if(e==null)return!i;for(e=Object(e);r--;){var s=n[r];if(s[2]?s[1]!==e[s[0]]:!(s[0]in e))return!1}for(;++r<i;){s=n[r];var l=s[0],a=e[l],c=s[1];if(s[2]){if(a===void 0&&!(l in e))return!1}else{var f=new Zn,u;if(!(u===void 0?ka(c,a,Ry|Vy,o,f):u))return!1}}return!0}function vu(e){return e===e&&!an(e)}function Uy(e){for(var t=O1(e),n=t.length;n--;){var o=t[n],r=e[o];t[n]=[o,r,vu(r)]}return t}function mu(e,t){return function(n){return n==null?!1:n[e]===t&&(t!==void 0||e in Object(n))}}function Wy(e){var t=Uy(e);return t.length==1&&t[0][2]?mu(t[0][0],t[0][1]):function(n){return n===e||Hy(n,e,t)}}function Gy(e,t){return e!=null&&t in Object(e)}function Ky(e,t,n){t=ss(t,e);for(var o=-1,r=t.length,i=!1;++o<r;){var s=P1(t[o]);if(!(i=e!=null&&n(e,s)))break;e=e[s]}return i||++o!=r?i:(r=e==null?0:e.length,!!r&&Oa(r)&&$a(s,r)&&(Ct(e)||ns(e)))}function qy(e,t){return e!=null&&Ky(e,t,Gy)}var Yy=1,Zy=2;function Jy(e,t){return Ca(e)&&vu(t)?mu(P1(e),t):function(n){var o=Aa(n,e);return o===void 0&&o===t?qy(n,e):ka(t,o,Yy|Zy)}}function Xy(e){return function(t){return t==null?void 0:t[e]}}function Qy(e){return function(t){return Da(t,e)}}function ew(e){return Ca(e)?Xy(P1(e)):Qy(e)}function Yr(e){return typeof e=="function"?e:e==null?zf:typeof e=="object"?Ct(e)?Jy(e[0],e[1]):Wy(e):ew(e)}function tw(e){return function(t,n,o){for(var r=-1,i=Object(t),s=o(t),l=s.length;l--;){var a=s[++r];if(n(i[a],a,i)===!1)break}return t}}var nw=tw();function yu(e,t){return e&&nw(e,t,O1)}function rw(e,t){return function(n,o){if(n==null)return n;if(!Kr(n))return e(n,o);for(var r=n.length,i=-1,s=Object(n);++i<r&&o(s[i],i,s)!==!1;);return n}}var Ia=rw(yu);function ow(e){return typeof e=="function"?e:zf}function iw(e,t){var n=Ct(e)?cv:Ia;return n(e,ow(t))}function sw(e){return function(t,n,o){var r=Object(t);if(!Kr(t)){var i=Yr(n);t=O1(t),n=function(l){return i(r[l],l,r)}}var s=e(t,n,o);return s>-1?r[i?t[s]:s]:void 0}}var lw=Math.max;function aw(e,t,n){var o=e==null?0:e.length;if(!o)return-1;var r=n==null?0:jf(n);return r<0&&(r=lw(o+r,0)),If(e,Yr(t),r)}var cw=sw(aw);function fw(e,t){var n=-1,o=Kr(e)?Array(e.length):[];return Ia(e,function(r,i,s){o[++n]=t(r,i,s)}),o}function wu(e,t){var n=Ct(e)?ts:fw;return n(e,Yr(t))}var uw=1/0;function dw(e){var t=e==null?0:e.length;return t?Qf(e,uw):[]}var hw="[object String]";function pw(e){return typeof e=="string"||!Ct(e)&&Ur(e)&&Hr(e)==hw}function gw(e,t){return ts(t,function(n){return e[n]})}function vw(e){return e==null?[]:gw(e,O1(e))}var mw=Math.max;function yw(e,t,n,o){e=Kr(e)?e:vw(e),n=n&&!o?jf(n):0;var r=e.length;return n<0&&(n=mw(r+n,0)),pw(e)?n<=r&&e.indexOf(t,n)>-1:!!r&&dv(e,t,n)>-1}var ww="[object Map]",_w="[object Set]",bw=Object.prototype,Fw=bw.hasOwnProperty;function C1(e){if(e==null)return!0;if(Kr(e)&&(Ct(e)||typeof e=="string"||typeof e.splice=="function"||rs(e)||Pa(e)||ns(e)))return!e.length;var t=Jn(e);if(t==ww||t==_w)return!e.size;if(Sa(e))return!Zf(e).length;for(var n in e)if(Fw.call(e,n))return!1;return!0}function $w(e){return e==null}function xw(e,t){var n={};return t=Yr(t),yu(e,function(o,r,i){Bf(n,r,t(o,r,i))}),n}var Ow="Expected a function";function Sw(e){if(typeof e!="function")throw new TypeError(Ow);return function(){var t=arguments;switch(t.length){case 0:return!e.call(this);case 1:return!e.call(this,t[0]);case 2:return!e.call(this,t[0],t[1]);case 3:return!e.call(this,t[0],t[1],t[2])}return!e.apply(this,t)}}function _u(e,t,n,o){if(!an(e))return e;t=ss(t,e);for(var r=-1,i=t.length,s=i-1,l=e;l!=null&&++r<i;){var a=P1(t[r]),c=n;if(a==="__proto__"||a==="constructor"||a==="prototype")return e;if(r!=s){var f=l[a];c=void 0,c===void 0&&(c=an(f)?f:$a(t[r+1])?[]:{})}mv(l,a,c),l=l[a]}return e}function Ew(e,t,n){for(var o=-1,r=t.length,i={};++o<r;){var s=t[o],l=Da(e,s);n(l,s)&&_u(i,ss(s,e),l)}return i}function Pw(e,t){if(e==null)return{};var n=ts(oy(e),function(o){return[o]});return t=Yr(t),Ew(e,n,function(o,r){return t(o,r[0])})}function Cw(e,t){return Pw(e,Sw(Yr(t)))}function Mw(e,t,n,o,r){return r(e,function(i,s,l){n=o?(o=!1,i):t(n,i,s,l)}),n}function bu(e,t,n){var o=Ct(e)?Gm:Mw,r=arguments.length<3;return o(e,Yr(t),n,r,Ia)}function Fu(e,t,n){return e==null?e:_u(e,t,n)}const Dw=$e(),Aw=$e({}),Tw=$e(),Ba={activeTheme:Dw,config:Aw,providedThemes:Tw};function jw(e,t={}){const n=e.map(Object.keys).flat();return bu(n,(o,r)=>{const i=wu(e,l=>Aa(l,r,{})),s=wu(i,l=>_a(l)?l(t):l);return Fu(o,r,$9(x9(...s))),o},{})}function cn(e,t={},...n){return Oe(()=>{e=Ct(e)?e:[e],n=dw(n);const o=H(Ba==null?void 0:Ba.config);C1(o)||n.push(o);const r=Cw(xw(H(t),s=>H(s)),$w),i={};return iw(e,s=>{const l=bu(n,(a,c)=>{c=Pe(H(c));const f=Aa(c,s);return an(f)&&!C1(f)&&a.push(f),a},[]);Fu(i,s,jw(l,r))}),i})}var M1=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},zw=Object.prototype;function Nw(e){var t=e&&e.constructor,n=typeof t=="function"&&t.prototype||zw;return e===n}var La=Nw;function kw(e,t){return function(n){return e(t(n))}}var $u=kw,Iw=$u,Bw=Iw(Object.keys,Object),Lw=Bw,Rw=La,Vw=Lw,Hw=Object.prototype,Uw=Hw.hasOwnProperty;function Ww(e){if(!Rw(e))return Vw(e);var t=[];for(var n in Object(e))Uw.call(e,n)&&n!="constructor"&&t.push(n);return t}var xu=Ww,Gw=typeof M1=="object"&&M1&&M1.Object===Object&&M1,Ou=Gw,Kw=Ou,qw=typeof self=="object"&&self&&self.Object===Object&&self,Yw=Kw||qw||Function("return this")(),It=Yw,Zw=It,Jw=Zw.Symbol,xo=Jw,Su=xo,Eu=Object.prototype,Xw=Eu.hasOwnProperty,Qw=Eu.toString,D1=Su?Su.toStringTag:void 0;function e_(e){var t=Xw.call(e,D1),n=e[D1];try{e[D1]=void 0;var o=!0}catch{}var r=Qw.call(e);return o&&(t?e[D1]=n:delete e[D1]),r}var t_=e_,n_=Object.prototype,r_=n_.toString;function o_(e){return r_.call(e)}var i_=o_,Pu=xo,s_=t_,l_=i_,a_="[object Null]",c_="[object Undefined]",Cu=Pu?Pu.toStringTag:void 0;function f_(e){return e==null?e===void 0?c_:a_:Cu&&Cu in Object(e)?s_(e):l_(e)}var Zr=f_;function u_(e){var t=typeof e;return e!=null&&(t=="object"||t=="function")}var Yt=u_,d_=Zr,h_=Yt,p_="[object AsyncFunction]",g_="[object Function]",v_="[object GeneratorFunction]",m_="[object Proxy]";function y_(e){if(!h_(e))return!1;var t=d_(e);return t==g_||t==v_||t==p_||t==m_}var cs=y_,w_=It,__=w_["__core-js_shared__"],b_=__,Ra=b_,Mu=function(){var e=/[^.]+$/.exec(Ra&&Ra.keys&&Ra.keys.IE_PROTO||"");return e?"Symbol(src)_1."+e:""}();function F_(e){return!!Mu&&Mu in e}var $_=F_,x_=Function.prototype,O_=x_.toString;function S_(e){if(e!=null){try{return O_.call(e)}catch{}try{return e+""}catch{}}return""}var Du=S_,E_=cs,P_=$_,C_=Yt,M_=Du,D_=/[\\^$.*+?()[\]{}|]/g,A_=/^\[object .+?Constructor\]$/,T_=Function.prototype,j_=Object.prototype,z_=T_.toString,N_=j_.hasOwnProperty,k_=RegExp("^"+z_.call(N_).replace(D_,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");function I_(e){if(!C_(e)||P_(e))return!1;var t=E_(e)?k_:A_;return t.test(M_(e))}var B_=I_;function L_(e,t){return e==null?void 0:e[t]}var R_=L_,V_=B_,H_=R_;function U_(e,t){var n=H_(e,t);return V_(n)?n:void 0}var Jr=U_,W_=Jr,G_=It,K_=W_(G_,"DataView"),q_=K_,Y_=Jr,Z_=It,J_=Y_(Z_,"Map"),Va=J_,X_=Jr,Q_=It,eb=X_(Q_,"Promise"),tb=eb,nb=Jr,rb=It,ob=nb(rb,"Set"),ib=ob,sb=Jr,lb=It,ab=sb(lb,"WeakMap"),Au=ab,Ha=q_,Ua=Va,Wa=tb,Ga=ib,Ka=Au,Tu=Zr,Oo=Du,ju="[object Map]",cb="[object Object]",zu="[object Promise]",Nu="[object Set]",ku="[object WeakMap]",Iu="[object DataView]",fb=Oo(Ha),ub=Oo(Ua),db=Oo(Wa),hb=Oo(Ga),pb=Oo(Ka),Xr=Tu;(Ha&&Xr(new Ha(new ArrayBuffer(1)))!=Iu||Ua&&Xr(new Ua)!=ju||Wa&&Xr(Wa.resolve())!=zu||Ga&&Xr(new Ga)!=Nu||Ka&&Xr(new Ka)!=ku)&&(Xr=function(e){var t=Tu(e),n=t==cb?e.constructor:void 0,o=n?Oo(n):"";if(o)switch(o){case fb:return Iu;case ub:return ju;case db:return zu;case hb:return Nu;case pb:return ku}return t});var A1=Xr;function gb(e){return e!=null&&typeof e=="object"}var Zt=gb,vb=Zr,mb=Zt,yb="[object Arguments]";function wb(e){return mb(e)&&vb(e)==yb}var _b=wb,Bu=_b,bb=Zt,Lu=Object.prototype,Fb=Lu.hasOwnProperty,$b=Lu.propertyIsEnumerable,xb=Bu(function(){return arguments}())?Bu:function(e){return bb(e)&&Fb.call(e,"callee")&&!$b.call(e,"callee")},fs=xb,Ob=Array.isArray,Bt=Ob,Sb=9007199254740991;function Eb(e){return typeof e=="number"&&e>-1&&e%1==0&&e<=Sb}var qa=Eb,Pb=cs,Cb=qa;function Mb(e){return e!=null&&Cb(e.length)&&!Pb(e)}var us=Mb,ds={exports:{}};function Db(){return!1}var Ab=Db;ds.exports,function(e,t){var n=It,o=Ab,r=t&&!t.nodeType&&t,i=r&&!0&&e&&!e.nodeType&&e,s=i&&i.exports===r,l=s?n.Buffer:void 0,a=l?l.isBuffer:void 0,c=a||o;e.exports=c}(ds,ds.exports);var hs=ds.exports,Tb=Zr,jb=qa,zb=Zt,Nb="[object Arguments]",kb="[object Array]",Ib="[object Boolean]",Bb="[object Date]",Lb="[object Error]",Rb="[object Function]",Vb="[object Map]",Hb="[object Number]",Ub="[object Object]",Wb="[object RegExp]",Gb="[object Set]",Kb="[object String]",qb="[object WeakMap]",Yb="[object ArrayBuffer]",Zb="[object DataView]",Jb="[object Float32Array]",Xb="[object Float64Array]",Qb="[object Int8Array]",eF="[object Int16Array]",tF="[object Int32Array]",nF="[object Uint8Array]",rF="[object Uint8ClampedArray]",oF="[object Uint16Array]",iF="[object Uint32Array]",Xe={};Xe[Jb]=Xe[Xb]=Xe[Qb]=Xe[eF]=Xe[tF]=Xe[nF]=Xe[rF]=Xe[oF]=Xe[iF]=!0,Xe[Nb]=Xe[kb]=Xe[Yb]=Xe[Ib]=Xe[Zb]=Xe[Bb]=Xe[Lb]=Xe[Rb]=Xe[Vb]=Xe[Hb]=Xe[Ub]=Xe[Wb]=Xe[Gb]=Xe[Kb]=Xe[qb]=!1;function sF(e){return zb(e)&&jb(e.length)&&!!Xe[Tb(e)]}var lF=sF;function aF(e){return function(t){return e(t)}}var Ya=aF,ps={exports:{}};ps.exports,function(e,t){var n=Ou,o=t&&!t.nodeType&&t,r=o&&!0&&e&&!e.nodeType&&e,i=r&&r.exports===o,s=i&&n.process,l=function(){try{var a=r&&r.require&&r.require("util").types;return a||s&&s.binding&&s.binding("util")}catch{}}();e.exports=l}(ps,ps.exports);var Za=ps.exports,cF=lF,fF=Ya,Ru=Za,Vu=Ru&&Ru.isTypedArray,uF=Vu?fF(Vu):cF,Ja=uF;function dF(e,t){for(var n=-1,o=e==null?0:e.length,r=Array(o);++n<o;)r[n]=t(e[n],n,e);return r}var Hu=dF,hF=Zr,pF=Zt,gF="[object Symbol]";function vF(e){return typeof e=="symbol"||pF(e)&&hF(e)==gF}var T1=vF,Uu=xo,mF=Hu,yF=Bt,wF=T1,_F=1/0,Wu=Uu?Uu.prototype:void 0,Gu=Wu?Wu.toString:void 0;function Ku(e){if(typeof e=="string")return e;if(yF(e))return mF(e,Ku)+"";if(wF(e))return Gu?Gu.call(e):"";var t=e+"";return t=="0"&&1/e==-_F?"-0":t}var bF=Ku,FF=bF;function $F(e){return e==null?"":FF(e)}var qu=$F;function xF(e,t,n){var o=-1,r=e.length;t<0&&(t=-t>r?0:r+t),n=n>r?r:n,n<0&&(n+=r),r=t>n?0:n-t>>>0,t>>>=0;for(var i=Array(r);++o<r;)i[o]=e[o+t];return i}var OF=xF;function SF(e,t){for(var n=-1,o=Array(e);++n<e;)o[n]=t(n);return o}var EF=SF,PF=9007199254740991,CF=/^(?:0|[1-9]\d*)$/;function MF(e,t){var n=typeof e;return t=t??PF,!!t&&(n=="number"||n!="symbol"&&CF.test(e))&&e>-1&&e%1==0&&e<t}var j1=MF,DF=EF,AF=fs,TF=Bt,jF=hs,zF=j1,NF=Ja,kF=Object.prototype,IF=kF.hasOwnProperty;function BF(e,t){var n=TF(e),o=!n&&AF(e),r=!n&&!o&&jF(e),i=!n&&!o&&!r&&NF(e),s=n||o||r||i,l=s?DF(e.length,String):[],a=l.length;for(var c in e)(t||IF.call(e,c))&&!(s&&(c=="length"||r&&(c=="offset"||c=="parent")||i&&(c=="buffer"||c=="byteLength"||c=="byteOffset")||zF(c,a)))&&l.push(c);return l}var Yu=BF,LF=Yu,RF=xu,VF=us;function HF(e){return VF(e)?LF(e):RF(e)}var gs=HF;function UF(){this.__data__=[],this.size=0}var WF=UF;function GF(e,t){return e===t||e!==e&&t!==t}var z1=GF,KF=z1;function qF(e,t){for(var n=e.length;n--;)if(KF(e[n][0],t))return n;return-1}var vs=qF,YF=vs,ZF=Array.prototype,JF=ZF.splice;function XF(e){var t=this.__data__,n=YF(t,e);if(n<0)return!1;var o=t.length-1;return n==o?t.pop():JF.call(t,n,1),--this.size,!0}var QF=XF,e$=vs;function t$(e){var t=this.__data__,n=e$(t,e);return n<0?void 0:t[n][1]}var n$=t$,r$=vs;function o$(e){return r$(this.__data__,e)>-1}var i$=o$,s$=vs;function l$(e,t){var n=this.__data__,o=s$(n,e);return o<0?(++this.size,n.push([e,t])):n[o][1]=t,this}var a$=l$,c$=WF,f$=QF,u$=n$,d$=i$,h$=a$;function So(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var o=e[t];this.set(o[0],o[1])}}So.prototype.clear=c$,So.prototype.delete=f$,So.prototype.get=u$,So.prototype.has=d$,So.prototype.set=h$;var ms=So,p$=ms;function g$(){this.__data__=new p$,this.size=0}var v$=g$;function m$(e){var t=this.__data__,n=t.delete(e);return this.size=t.size,n}var y$=m$;function w$(e){return this.__data__.get(e)}var _$=w$;function b$(e){return this.__data__.has(e)}var F$=b$,$$=Jr,x$=$$(Object,"create"),ys=x$,Zu=ys;function O$(){this.__data__=Zu?Zu(null):{},this.size=0}var S$=O$;function E$(e){var t=this.has(e)&&delete this.__data__[e];return this.size-=t?1:0,t}var P$=E$,C$=ys,M$="__lodash_hash_undefined__",D$=Object.prototype,A$=D$.hasOwnProperty;function T$(e){var t=this.__data__;if(C$){var n=t[e];return n===M$?void 0:n}return A$.call(t,e)?t[e]:void 0}var j$=T$,z$=ys,N$=Object.prototype,k$=N$.hasOwnProperty;function I$(e){var t=this.__data__;return z$?t[e]!==void 0:k$.call(t,e)}var B$=I$,L$=ys,R$="__lodash_hash_undefined__";function V$(e,t){var n=this.__data__;return this.size+=this.has(e)?0:1,n[e]=L$&&t===void 0?R$:t,this}var H$=V$,U$=S$,W$=P$,G$=j$,K$=B$,q$=H$;function Eo(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var o=e[t];this.set(o[0],o[1])}}Eo.prototype.clear=U$,Eo.prototype.delete=W$,Eo.prototype.get=G$,Eo.prototype.has=K$,Eo.prototype.set=q$;var Y$=Eo,Ju=Y$,Z$=ms,J$=Va;function X$(){this.size=0,this.__data__={hash:new Ju,map:new(J$||Z$),string:new Ju}}var Q$=X$;function ex(e){var t=typeof e;return t=="string"||t=="number"||t=="symbol"||t=="boolean"?e!=="__proto__":e===null}var tx=ex,nx=tx;function rx(e,t){var n=e.__data__;return nx(t)?n[typeof t=="string"?"string":"hash"]:n.map}var ws=rx,ox=ws;function ix(e){var t=ox(this,e).delete(e);return this.size-=t?1:0,t}var sx=ix,lx=ws;function ax(e){return lx(this,e).get(e)}var cx=ax,fx=ws;function ux(e){return fx(this,e).has(e)}var dx=ux,hx=ws;function px(e,t){var n=hx(this,e),o=n.size;return n.set(e,t),this.size+=n.size==o?0:1,this}var gx=px,vx=Q$,mx=sx,yx=cx,wx=dx,_x=gx;function Po(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var o=e[t];this.set(o[0],o[1])}}Po.prototype.clear=vx,Po.prototype.delete=mx,Po.prototype.get=yx,Po.prototype.has=wx,Po.prototype.set=_x;var Xa=Po,bx=ms,Fx=Va,$x=Xa,xx=200;function Ox(e,t){var n=this.__data__;if(n instanceof bx){var o=n.__data__;if(!Fx||o.length<xx-1)return o.push([e,t]),this.size=++n.size,this;n=this.__data__=new $x(o)}return n.set(e,t),this.size=n.size,this}var Sx=Ox,Ex=ms,Px=v$,Cx=y$,Mx=_$,Dx=F$,Ax=Sx;function Co(e){var t=this.__data__=new Ex(e);this.size=t.size}Co.prototype.clear=Px,Co.prototype.delete=Cx,Co.prototype.get=Mx,Co.prototype.has=Dx,Co.prototype.set=Ax;var _s=Co,Tx=Jr,jx=function(){try{var e=Tx(Object,"defineProperty");return e({},"",{}),e}catch{}}(),Xu=jx,Qu=Xu;function zx(e,t,n){t=="__proto__"&&Qu?Qu(e,t,{configurable:!0,enumerable:!0,value:n,writable:!0}):e[t]=n}var Qa=zx,Nx=Qa,kx=z1;function Ix(e,t,n){(n!==void 0&&!kx(e[t],n)||n===void 0&&!(t in e))&&Nx(e,t,n)}var ed=Ix;function Bx(e){return function(t,n,o){for(var r=-1,i=Object(t),s=o(t),l=s.length;l--;){var a=s[e?l:++r];if(n(i[a],a,i)===!1)break}return t}}var Lx=Bx,Rx=Lx,Vx=Rx(),Hx=Vx,bs={exports:{}};bs.exports,function(e,t){var n=It,o=t&&!t.nodeType&&t,r=o&&!0&&e&&!e.nodeType&&e,i=r&&r.exports===o,s=i?n.Buffer:void 0,l=s?s.allocUnsafe:void 0;function a(c,f){if(f)return c.slice();var u=c.length,d=l?l(u):new c.constructor(u);return c.copy(d),d}e.exports=a}(bs,bs.exports);var td=bs.exports,Ux=It,Wx=Ux.Uint8Array,nd=Wx,rd=nd;function Gx(e){var t=new e.constructor(e.byteLength);return new rd(t).set(new rd(e)),t}var e2=Gx,Kx=e2;function qx(e,t){var n=t?Kx(e.buffer):e.buffer;return new e.constructor(n,e.byteOffset,e.length)}var od=qx;function Yx(e,t){var n=-1,o=e.length;for(t||(t=Array(o));++n<o;)t[n]=e[n];return t}var N1=Yx,Zx=Yt,id=Object.create,Jx=function(){function e(){}return function(t){if(!Zx(t))return{};if(id)return id(t);e.prototype=t;var n=new e;return e.prototype=void 0,n}}(),Fs=Jx,Xx=$u,Qx=Xx(Object.getPrototypeOf,Object),t2=Qx,eO=Fs,tO=t2,nO=La;function rO(e){return typeof e.constructor=="function"&&!nO(e)?eO(tO(e)):{}}var sd=rO,oO=us,iO=Zt;function sO(e){return iO(e)&&oO(e)}var lO=sO,aO=Zr,cO=t2,fO=Zt,uO="[object Object]",dO=Function.prototype,hO=Object.prototype,ld=dO.toString,pO=hO.hasOwnProperty,gO=ld.call(Object);function vO(e){if(!fO(e)||aO(e)!=uO)return!1;var t=cO(e);if(t===null)return!0;var n=pO.call(t,"constructor")&&t.constructor;return typeof n=="function"&&n instanceof n&&ld.call(n)==gO}var ad=vO;function mO(e,t){if(!(t==="constructor"&&typeof e[t]=="function")&&t!="__proto__")return e[t]}var cd=mO,yO=Qa,wO=z1,_O=Object.prototype,bO=_O.hasOwnProperty;function FO(e,t,n){var o=e[t];(!(bO.call(e,t)&&wO(o,n))||n===void 0&&!(t in e))&&yO(e,t,n)}var n2=FO,$O=n2,xO=Qa;function OO(e,t,n,o){var r=!n;n||(n={});for(var i=-1,s=t.length;++i<s;){var l=t[i],a=o?o(n[l],e[l],l,n,e):void 0;a===void 0&&(a=e[l]),r?xO(n,l,a):$O(n,l,a)}return n}var k1=OO;function SO(e){var t=[];if(e!=null)for(var n in Object(e))t.push(n);return t}var EO=SO,PO=Yt,CO=La,MO=EO,DO=Object.prototype,AO=DO.hasOwnProperty;function TO(e){if(!PO(e))return MO(e);var t=CO(e),n=[];for(var o in e)o=="constructor"&&(t||!AO.call(e,o))||n.push(o);return n}var jO=TO,zO=Yu,NO=jO,kO=us;function IO(e){return kO(e)?zO(e,!0):NO(e)}var I1=IO,BO=k1,LO=I1;function RO(e){return BO(e,LO(e))}var VO=RO,fd=ed,HO=td,UO=od,WO=N1,GO=sd,ud=fs,dd=Bt,KO=lO,qO=hs,YO=cs,ZO=Yt,JO=ad,XO=Ja,hd=cd,QO=VO;function eS(e,t,n,o,r,i,s){var l=hd(e,n),a=hd(t,n),c=s.get(a);if(c){fd(e,n,c);return}var f=i?i(l,a,n+"",e,t,s):void 0,u=f===void 0;if(u){var d=dd(a),h=!d&&qO(a),p=!d&&!h&&XO(a);f=a,d||h||p?dd(l)?f=l:KO(l)?f=WO(l):h?(u=!1,f=HO(a,!0)):p?(u=!1,f=UO(a,!0)):f=[]:JO(a)||ud(a)?(f=l,ud(l)?f=QO(l):(!ZO(l)||YO(l))&&(f=GO(a))):u=!1}u&&(s.set(a,f),r(f,a,o,i,s),s.delete(a)),fd(e,n,f)}var tS=eS,nS=_s,rS=ed,oS=Hx,iS=tS,sS=Yt,lS=I1,aS=cd;function pd(e,t,n,o,r){e!==t&&oS(t,function(i,s){if(r||(r=new nS),sS(i))iS(e,t,s,n,pd,o,r);else{var l=o?o(aS(e,s),i,s+"",e,t,r):void 0;l===void 0&&(l=i),rS(e,s,l)}},lS)}var cS=pd;function fS(e){return e}var $s=fS;function uS(e,t,n){switch(n.length){case 0:return e.call(t);case 1:return e.call(t,n[0]);case 2:return e.call(t,n[0],n[1]);case 3:return e.call(t,n[0],n[1],n[2])}return e.apply(t,n)}var r2=uS,dS=r2,gd=Math.max;function hS(e,t,n){return t=gd(t===void 0?e.length-1:t,0),function(){for(var o=arguments,r=-1,i=gd(o.length-t,0),s=Array(i);++r<i;)s[r]=o[t+r];r=-1;for(var l=Array(t+1);++r<t;)l[r]=o[r];return l[t]=n(s),dS(e,this,l)}}var vd=hS;function pS(e){return function(){return e}}var gS=pS,vS=gS,md=Xu,mS=$s,yS=md?function(e,t){return md(e,"toString",{configurable:!0,enumerable:!1,value:vS(t),writable:!0})}:mS,wS=yS,_S=800,bS=16,FS=Date.now;function $S(e){var t=0,n=0;return function(){var o=FS(),r=bS-(o-n);if(n=o,r>0){if(++t>=_S)return arguments[0]}else t=0;return e.apply(void 0,arguments)}}var yd=$S,xS=wS,OS=yd,SS=OS(xS),o2=SS,ES=$s,PS=vd,CS=o2;function MS(e,t){return CS(PS(e,t,ES),e+"")}var DS=MS,AS=z1,TS=us,jS=j1,zS=Yt;function NS(e,t,n){if(!zS(n))return!1;var o=typeof t;return(o=="number"?TS(n)&&jS(t,n.length):o=="string"&&t in n)?AS(n[t],e):!1}var kS=NS,IS=DS,BS=kS;function LS(e){return IS(function(t,n){var o=-1,r=n.length,i=r>1?n[r-1]:void 0,s=r>2?n[2]:void 0;for(i=e.length>3&&typeof i=="function"?(r--,i):void 0,s&&BS(n[0],n[1],s)&&(i=r<3?void 0:i,r=1),t=Object(t);++o<r;){var l=n[o];l&&e(t,l,o,i)}return t})}var RS=LS,VS=cS,HS=RS;HS(function(e,t,n){VS(e,t,n)});function US(e,t){for(var n=-1,o=e==null?0:e.length;++n<o&&t(e[n],n,e)!==!1;);return e}var i2=US,WS=k1,GS=gs;function KS(e,t){return e&&WS(t,GS(t),e)}var wd=KS,qS=k1,YS=I1;function ZS(e,t){return e&&qS(t,YS(t),e)}var JS=ZS;function XS(e,t){for(var n=-1,o=e==null?0:e.length,r=0,i=[];++n<o;){var s=e[n];t(s,n,e)&&(i[r++]=s)}return i}var QS=XS;function eE(){return[]}var _d=eE,tE=QS,nE=_d,rE=Object.prototype,oE=rE.propertyIsEnumerable,bd=Object.getOwnPropertySymbols,iE=bd?function(e){return e==null?[]:(e=Object(e),tE(bd(e),function(t){return oE.call(e,t)}))}:nE,s2=iE,sE=k1,lE=s2;function aE(e,t){return sE(e,lE(e),t)}var cE=aE;function fE(e,t){for(var n=-1,o=t.length,r=e.length;++n<o;)e[r+n]=t[n];return e}var l2=fE,uE=l2,dE=t2,hE=s2,pE=_d,gE=Object.getOwnPropertySymbols,vE=gE?function(e){for(var t=[];e;)uE(t,hE(e)),e=dE(e);return t}:pE,Fd=vE,mE=k1,yE=Fd;function wE(e,t){return mE(e,yE(e),t)}var _E=wE,bE=l2,FE=Bt;function $E(e,t,n){var o=t(e);return FE(e)?o:bE(o,n(e))}var $d=$E,xE=$d,OE=s2,SE=gs;function EE(e){return xE(e,SE,OE)}var xd=EE,PE=$d,CE=Fd,ME=I1;function DE(e){return PE(e,ME,CE)}var AE=DE,TE=Object.prototype,jE=TE.hasOwnProperty;function zE(e){var t=e.length,n=new e.constructor(t);return t&&typeof e[0]=="string"&&jE.call(e,"index")&&(n.index=e.index,n.input=e.input),n}var NE=zE,kE=e2;function IE(e,t){var n=t?kE(e.buffer):e.buffer;return new e.constructor(n,e.byteOffset,e.byteLength)}var BE=IE,LE=/\w*$/;function RE(e){var t=new e.constructor(e.source,LE.exec(e));return t.lastIndex=e.lastIndex,t}var VE=RE,Od=xo,Sd=Od?Od.prototype:void 0,Ed=Sd?Sd.valueOf:void 0;function HE(e){return Ed?Object(Ed.call(e)):{}}var UE=HE,WE=e2,GE=BE,KE=VE,qE=UE,YE=od,ZE="[object Boolean]",JE="[object Date]",XE="[object Map]",QE="[object Number]",eP="[object RegExp]",tP="[object Set]",nP="[object String]",rP="[object Symbol]",oP="[object ArrayBuffer]",iP="[object DataView]",sP="[object Float32Array]",lP="[object Float64Array]",aP="[object Int8Array]",cP="[object Int16Array]",fP="[object Int32Array]",uP="[object Uint8Array]",dP="[object Uint8ClampedArray]",hP="[object Uint16Array]",pP="[object Uint32Array]";function gP(e,t,n){var o=e.constructor;switch(t){case oP:return WE(e);case ZE:case JE:return new o(+e);case iP:return GE(e,n);case sP:case lP:case aP:case cP:case fP:case uP:case dP:case hP:case pP:return YE(e,n);case XE:return new o;case QE:case nP:return new o(e);case eP:return KE(e);case tP:return new o;case rP:return qE(e)}}var vP=gP,mP=A1,yP=Zt,wP="[object Map]";function _P(e){return yP(e)&&mP(e)==wP}var bP=_P,FP=bP,$P=Ya,Pd=Za,Cd=Pd&&Pd.isMap,xP=Cd?$P(Cd):FP,OP=xP,SP=A1,EP=Zt,PP="[object Set]";function CP(e){return EP(e)&&SP(e)==PP}var MP=CP,DP=MP,AP=Ya,Md=Za,Dd=Md&&Md.isSet,TP=Dd?AP(Dd):DP,jP=TP,zP=_s,NP=i2,kP=n2,IP=wd,BP=JS,LP=td,RP=N1,VP=cE,HP=_E,UP=xd,WP=AE,GP=A1,KP=NE,qP=vP,YP=sd,ZP=Bt,JP=hs,XP=OP,QP=Yt,eC=jP,tC=gs,nC=I1,rC=1,oC=2,iC=4,Ad="[object Arguments]",sC="[object Array]",lC="[object Boolean]",aC="[object Date]",cC="[object Error]",Td="[object Function]",fC="[object GeneratorFunction]",uC="[object Map]",dC="[object Number]",jd="[object Object]",hC="[object RegExp]",pC="[object Set]",gC="[object String]",vC="[object Symbol]",mC="[object WeakMap]",yC="[object ArrayBuffer]",wC="[object DataView]",_C="[object Float32Array]",bC="[object Float64Array]",FC="[object Int8Array]",$C="[object Int16Array]",xC="[object Int32Array]",OC="[object Uint8Array]",SC="[object Uint8ClampedArray]",EC="[object Uint16Array]",PC="[object Uint32Array]",Ke={};Ke[Ad]=Ke[sC]=Ke[yC]=Ke[wC]=Ke[lC]=Ke[aC]=Ke[_C]=Ke[bC]=Ke[FC]=Ke[$C]=Ke[xC]=Ke[uC]=Ke[dC]=Ke[jd]=Ke[hC]=Ke[pC]=Ke[gC]=Ke[vC]=Ke[OC]=Ke[SC]=Ke[EC]=Ke[PC]=!0,Ke[cC]=Ke[Td]=Ke[mC]=!1;function xs(e,t,n,o,r,i){var s,l=t&rC,a=t&oC,c=t&iC;if(n&&(s=r?n(e,o,r,i):n(e)),s!==void 0)return s;if(!QP(e))return e;var f=ZP(e);if(f){if(s=KP(e),!l)return RP(e,s)}else{var u=GP(e),d=u==Td||u==fC;if(JP(e))return LP(e,l);if(u==jd||u==Ad||d&&!r){if(s=a||d?{}:YP(e),!l)return a?HP(e,BP(s,e)):VP(e,IP(s,e))}else{if(!Ke[u])return r?e:{};s=qP(e,u,l)}}i||(i=new zP);var h=i.get(e);if(h)return h;i.set(e,s),eC(e)?e.forEach(function(y){s.add(xs(y,t,n,y,e,i))}):XP(e)&&e.forEach(function(y,g){s.set(g,xs(y,t,n,g,e,i))});var p=c?a?WP:UP:a?nC:tC,v=f?void 0:p(e);return NP(v||e,function(y,g){v&&(g=y,y=e[g]),kP(s,g,xs(y,t,n,g,e,i))}),s}var zd=xs,Nd={};(function(e){e.aliasToReal={each:"forEach",eachRight:"forEachRight",entries:"toPairs",entriesIn:"toPairsIn",extend:"assignIn",extendAll:"assignInAll",extendAllWith:"assignInAllWith",extendWith:"assignInWith",first:"head",conforms:"conformsTo",matches:"isMatch",property:"get",__:"placeholder",F:"stubFalse",T:"stubTrue",all:"every",allPass:"overEvery",always:"constant",any:"some",anyPass:"overSome",apply:"spread",assoc:"set",assocPath:"set",complement:"negate",compose:"flowRight",contains:"includes",dissoc:"unset",dissocPath:"unset",dropLast:"dropRight",dropLastWhile:"dropRightWhile",equals:"isEqual",identical:"eq",indexBy:"keyBy",init:"initial",invertObj:"invert",juxt:"over",omitAll:"omit",nAry:"ary",path:"get",pathEq:"matchesProperty",pathOr:"getOr",paths:"at",pickAll:"pick",pipe:"flow",pluck:"map",prop:"get",propEq:"matchesProperty",propOr:"getOr",props:"at",symmetricDifference:"xor",symmetricDifferenceBy:"xorBy",symmetricDifferenceWith:"xorWith",takeLast:"takeRight",takeLastWhile:"takeRightWhile",unapply:"rest",unnest:"flatten",useWith:"overArgs",where:"conformsTo",whereEq:"isMatch",zipObj:"zipObject"},e.aryMethod={1:["assignAll","assignInAll","attempt","castArray","ceil","create","curry","curryRight","defaultsAll","defaultsDeepAll","floor","flow","flowRight","fromPairs","invert","iteratee","memoize","method","mergeAll","methodOf","mixin","nthArg","over","overEvery","overSome","rest","reverse","round","runInContext","spread","template","trim","trimEnd","trimStart","uniqueId","words","zipAll"],2:["add","after","ary","assign","assignAllWith","assignIn","assignInAllWith","at","before","bind","bindAll","bindKey","chunk","cloneDeepWith","cloneWith","concat","conformsTo","countBy","curryN","curryRightN","debounce","defaults","defaultsDeep","defaultTo","delay","difference","divide","drop","dropRight","dropRightWhile","dropWhile","endsWith","eq","every","filter","find","findIndex","findKey","findLast","findLastIndex","findLastKey","flatMap","flatMapDeep","flattenDepth","forEach","forEachRight","forIn","forInRight","forOwn","forOwnRight","get","groupBy","gt","gte","has","hasIn","includes","indexOf","intersection","invertBy","invoke","invokeMap","isEqual","isMatch","join","keyBy","lastIndexOf","lt","lte","map","mapKeys","mapValues","matchesProperty","maxBy","meanBy","merge","mergeAllWith","minBy","multiply","nth","omit","omitBy","overArgs","pad","padEnd","padStart","parseInt","partial","partialRight","partition","pick","pickBy","propertyOf","pull","pullAll","pullAt","random","range","rangeRight","rearg","reject","remove","repeat","restFrom","result","sampleSize","some","sortBy","sortedIndex","sortedIndexOf","sortedLastIndex","sortedLastIndexOf","sortedUniqBy","split","spreadFrom","startsWith","subtract","sumBy","take","takeRight","takeRightWhile","takeWhile","tap","throttle","thru","times","trimChars","trimCharsEnd","trimCharsStart","truncate","union","uniqBy","uniqWith","unset","unzipWith","without","wrap","xor","zip","zipObject","zipObjectDeep"],3:["assignInWith","assignWith","clamp","differenceBy","differenceWith","findFrom","findIndexFrom","findLastFrom","findLastIndexFrom","getOr","includesFrom","indexOfFrom","inRange","intersectionBy","intersectionWith","invokeArgs","invokeArgsMap","isEqualWith","isMatchWith","flatMapDepth","lastIndexOfFrom","mergeWith","orderBy","padChars","padCharsEnd","padCharsStart","pullAllBy","pullAllWith","rangeStep","rangeStepRight","reduce","reduceRight","replace","set","slice","sortedIndexBy","sortedLastIndexBy","transform","unionBy","unionWith","update","xorBy","xorWith","zipWith"],4:["fill","setWith","updateWith"]},e.aryRearg={2:[1,0],3:[2,0,1],4:[3,2,0,1]},e.iterateeAry={dropRightWhile:1,dropWhile:1,every:1,filter:1,find:1,findFrom:1,findIndex:1,findIndexFrom:1,findKey:1,findLast:1,findLastFrom:1,findLastIndex:1,findLastIndexFrom:1,findLastKey:1,flatMap:1,flatMapDeep:1,flatMapDepth:1,forEach:1,forEachRight:1,forIn:1,forInRight:1,forOwn:1,forOwnRight:1,map:1,mapKeys:1,mapValues:1,partition:1,reduce:2,reduceRight:2,reject:1,remove:1,some:1,takeRightWhile:1,takeWhile:1,times:1,transform:2},e.iterateeRearg={mapKeys:[1],reduceRight:[1,0]},e.methodRearg={assignInAllWith:[1,0],assignInWith:[1,2,0],assignAllWith:[1,0],assignWith:[1,2,0],differenceBy:[1,2,0],differenceWith:[1,2,0],getOr:[2,1,0],intersectionBy:[1,2,0],intersectionWith:[1,2,0],isEqualWith:[1,2,0],isMatchWith:[2,1,0],mergeAllWith:[1,0],mergeWith:[1,2,0],padChars:[2,1,0],padCharsEnd:[2,1,0],padCharsStart:[2,1,0],pullAllBy:[2,1,0],pullAllWith:[2,1,0],rangeStep:[1,2,0],rangeStepRight:[1,2,0],setWith:[3,1,2,0],sortedIndexBy:[2,1,0],sortedLastIndexBy:[2,1,0],unionBy:[1,2,0],unionWith:[1,2,0],updateWith:[3,1,2,0],xorBy:[1,2,0],xorWith:[1,2,0],zipWith:[1,2,0]},e.methodSpread={assignAll:{start:0},assignAllWith:{start:0},assignInAll:{start:0},assignInAllWith:{start:0},defaultsAll:{start:0},defaultsDeepAll:{start:0},invokeArgs:{start:2},invokeArgsMap:{start:2},mergeAll:{start:0},mergeAllWith:{start:0},partial:{start:1},partialRight:{start:1},without:{start:1},zipAll:{start:0}},e.mutate={array:{fill:!0,pull:!0,pullAll:!0,pullAllBy:!0,pullAllWith:!0,pullAt:!0,remove:!0,reverse:!0},object:{assign:!0,assignAll:!0,assignAllWith:!0,assignIn:!0,assignInAll:!0,assignInAllWith:!0,assignInWith:!0,assignWith:!0,defaults:!0,defaultsAll:!0,defaultsDeep:!0,defaultsDeepAll:!0,merge:!0,mergeAll:!0,mergeAllWith:!0,mergeWith:!0},set:{set:!0,setWith:!0,unset:!0,update:!0,updateWith:!0}},e.realToAlias=function(){var t=Object.prototype.hasOwnProperty,n=e.aliasToReal,o={};for(var r in n){var i=n[r];t.call(o,i)?o[i].push(r):o[i]=[r]}return o}(),e.remap={assignAll:"assign",assignAllWith:"assignWith",assignInAll:"assignIn",assignInAllWith:"assignInWith",curryN:"curry",curryRightN:"curryRight",defaultsAll:"defaults",defaultsDeepAll:"defaultsDeep",findFrom:"find",findIndexFrom:"findIndex",findLastFrom:"findLast",findLastIndexFrom:"findLastIndex",getOr:"get",includesFrom:"includes",indexOfFrom:"indexOf",invokeArgs:"invoke",invokeArgsMap:"invokeMap",lastIndexOfFrom:"lastIndexOf",mergeAll:"merge",mergeAllWith:"mergeWith",padChars:"pad",padCharsEnd:"padEnd",padCharsStart:"padStart",propertyOf:"get",rangeStep:"range",rangeStepRight:"rangeRight",restFrom:"rest",spreadFrom:"spread",trimChars:"trim",trimCharsEnd:"trimEnd",trimCharsStart:"trimStart",zipAll:"zip"},e.skipFixed={castArray:!0,flow:!0,flowRight:!0,iteratee:!0,mixin:!0,rearg:!0,runInContext:!0},e.skipRearg={add:!0,assign:!0,assignIn:!0,bind:!0,bindKey:!0,concat:!0,difference:!0,divide:!0,eq:!0,gt:!0,gte:!0,isEqual:!0,lt:!0,lte:!0,matchesProperty:!0,merge:!0,multiply:!0,overArgs:!0,partial:!0,partialRight:!0,propertyOf:!0,random:!0,range:!0,rangeRight:!0,subtract:!0,zip:!0,zipObject:!0,zipObjectDeep:!0}})(Nd);var a2,kd;function c2(){return kd||(kd=1,a2={}),a2}var wt=Nd,CC=c2(),Id=Array.prototype.push;function MC(e,t){return t==2?function(n,o){return e.apply(void 0,arguments)}:function(n){return e.apply(void 0,arguments)}}function f2(e,t){return t==2?function(n,o){return e(n,o)}:function(n){return e(n)}}function Bd(e){for(var t=e?e.length:0,n=Array(t);t--;)n[t]=e[t];return n}function DC(e){return function(t){return e({},t)}}function AC(e,t){return function(){for(var n=arguments.length,o=n-1,r=Array(n);n--;)r[n]=arguments[n];var i=r[t],s=r.slice(0,t);return i&&Id.apply(s,i),t!=o&&Id.apply(s,r.slice(t+1)),e.apply(this,s)}}function u2(e,t){return function(){var n=arguments.length;if(n){for(var o=Array(n);n--;)o[n]=arguments[n];var r=o[0]=t.apply(void 0,o);return e.apply(void 0,o),r}}}function d2(e,t,n,o){var r=typeof t=="function",i=t===Object(t);if(i&&(o=n,n=t,t=void 0),n==null)throw new TypeError;o||(o={});var s={cap:"cap"in o?o.cap:!0,curry:"curry"in o?o.curry:!0,fixed:"fixed"in o?o.fixed:!0,immutable:"immutable"in o?o.immutable:!0,rearg:"rearg"in o?o.rearg:!0},l=r?n:CC,a="curry"in o&&o.curry,c="fixed"in o&&o.fixed,f="rearg"in o&&o.rearg,u=r?n.runInContext():void 0,d=r?n:{ary:e.ary,assign:e.assign,clone:e.clone,curry:e.curry,forEach:e.forEach,isArray:e.isArray,isError:e.isError,isFunction:e.isFunction,isWeakMap:e.isWeakMap,iteratee:e.iteratee,keys:e.keys,rearg:e.rearg,toInteger:e.toInteger,toPath:e.toPath},h=d.ary,p=d.assign,v=d.clone,y=d.curry,g=d.forEach,w=d.isArray,$=d.isError,O=d.isFunction,T=d.isWeakMap,S=d.keys,x=d.rearg,I=d.toInteger,V=d.toPath,W=S(wt.aryMethod),re={castArray:function(_){return function(){var E=arguments[0];return w(E)?_(Bd(E)):_.apply(void 0,arguments)}},iteratee:function(_){return function(){var E=arguments[0],N=arguments[1],k=_(E,N),q=k.length;return s.cap&&typeof N=="number"?(N=N>2?N-2:1,q&&q<=N?k:f2(k,N)):k}},mixin:function(_){return function(E){var N=this;if(!O(N))return _(N,Object(E));var k=[];return g(S(E),function(q){O(E[q])&&k.push([q,N.prototype[q]])}),_(N,Object(E)),g(k,function(q){var oe=q[1];O(oe)?N.prototype[q[0]]=oe:delete N.prototype[q[0]]}),N}},nthArg:function(_){return function(E){var N=E<0?1:I(E)+1;return y(_(E),N)}},rearg:function(_){return function(E,N){var k=N?N.length:0;return y(_(E,N),k)}},runInContext:function(_){return function(E){return d2(e,_(E),o)}}};function K(_,E){if(s.cap){var N=wt.iterateeRearg[_];if(N)return ee(E,N);var k=!r&&wt.iterateeAry[_];if(k)return He(E,k)}return E}function Ee(_,E,N){return a||s.curry&&N>1?y(E,N):E}function de(_,E,N){if(s.fixed&&(c||!wt.skipFixed[_])){var k=wt.methodSpread[_],q=k&&k.start;return q===void 0?h(E,N):AC(E,q)}return E}function Ce(_,E,N){return s.rearg&&N>1&&(f||!wt.skipRearg[_])?x(E,wt.methodRearg[_]||wt.aryRearg[N]):E}function be(_,E){E=V(E);for(var N=-1,k=E.length,q=k-1,oe=v(Object(_)),Fe=oe;Fe!=null&&++N<k;){var Te=E[N],nt=Fe[Te];nt!=null&&!(O(nt)||$(nt)||T(nt))&&(Fe[Te]=v(N==q?nt:Object(nt))),Fe=Fe[Te]}return oe}function fe(_){return P.runInContext.convert(_)(void 0)}function me(_,E){var N=wt.aliasToReal[_]||_,k=wt.remap[N]||N,q=o;return function(oe){var Fe=r?u:d,Te=r?u[k]:E,nt=p(p({},q),oe);return d2(Fe,N,Te,nt)}}function He(_,E){return j(_,function(N){return typeof N=="function"?f2(N,E):N})}function ee(_,E){return j(_,function(N){var k=E.length;return MC(x(f2(N,k),E),k)})}function j(_,E){return function(){var N=arguments.length;if(!N)return _();for(var k=Array(N);N--;)k[N]=arguments[N];var q=s.rearg?0:N-1;return k[q]=E(k[q]),_.apply(void 0,k)}}function z(_,E,N){var k,q=wt.aliasToReal[_]||_,oe=E,Fe=re[q];return Fe?oe=Fe(E):s.immutable&&(wt.mutate.array[q]?oe=u2(E,Bd):wt.mutate.object[q]?oe=u2(E,DC(E)):wt.mutate.set[q]&&(oe=u2(E,be))),g(W,function(Te){return g(wt.aryMethod[Te],function(nt){if(q==nt){var F=wt.methodSpread[q],M=F&&F.afterRearg;return k=M?de(q,Ce(q,oe,Te),Te):Ce(q,de(q,oe,Te),Te),k=K(q,k),k=Ee(q,k,Te),!1}}),!k}),k||(k=oe),k==E&&(k=a?y(k,1):function(){return E.apply(this,arguments)}),k.convert=me(q,E),k.placeholder=E.placeholder=N,k}if(!i)return z(t,n,l);var P=n,m=[];return g(W,function(_){g(wt.aryMethod[_],function(E){var N=P[wt.remap[E]||E];N&&m.push([E,z(E,N,P)])})}),g(S(P),function(_){var E=P[_];if(typeof E=="function"){for(var N=m.length;N--;)if(m[N][0]==_)return;E.convert=me(_,E),m.push([_,E])}}),g(m,function(_){P[_[0]]=_[1]}),P.convert=fe,P.placeholder=P,g(S(P),function(_){g(wt.realToAlias[_]||[],function(E){P[E]=P[_]})}),P}var TC=d2,Ld=Au,jC=Ld&&new Ld,Rd=jC,zC=$s,Vd=Rd,NC=Vd?function(e,t){return Vd.set(e,t),e}:zC,Hd=NC,kC=Fs,IC=Yt;function BC(e){return function(){var t=arguments;switch(t.length){case 0:return new e;case 1:return new e(t[0]);case 2:return new e(t[0],t[1]);case 3:return new e(t[0],t[1],t[2]);case 4:return new e(t[0],t[1],t[2],t[3]);case 5:return new e(t[0],t[1],t[2],t[3],t[4]);case 6:return new e(t[0],t[1],t[2],t[3],t[4],t[5]);case 7:return new e(t[0],t[1],t[2],t[3],t[4],t[5],t[6])}var n=kC(e.prototype),o=e.apply(n,t);return IC(o)?o:n}}var Os=BC,LC=Os,RC=It,VC=1;function HC(e,t,n){var o=t&VC,r=LC(e);function i(){var s=this&&this!==RC&&this instanceof i?r:e;return s.apply(o?n:this,arguments)}return i}var UC=HC,WC=Math.max;function GC(e,t,n,o){for(var r=-1,i=e.length,s=n.length,l=-1,a=t.length,c=WC(i-s,0),f=Array(a+c),u=!o;++l<a;)f[l]=t[l];for(;++r<s;)(u||r<i)&&(f[n[r]]=e[r]);for(;c--;)f[l++]=e[r++];return f}var Ud=GC,KC=Math.max;function qC(e,t,n,o){for(var r=-1,i=e.length,s=-1,l=n.length,a=-1,c=t.length,f=KC(i-l,0),u=Array(f+c),d=!o;++r<f;)u[r]=e[r];for(var h=r;++a<c;)u[h+a]=t[a];for(;++s<l;)(d||r<i)&&(u[h+n[s]]=e[r++]);return u}var Wd=qC;function YC(e,t){for(var n=e.length,o=0;n--;)e[n]===t&&++o;return o}var ZC=YC;function JC(){}var h2=JC,XC=Fs,QC=h2,eM=4294967295;function Ss(e){this.__wrapped__=e,this.__actions__=[],this.__dir__=1,this.__filtered__=!1,this.__iteratees__=[],this.__takeCount__=eM,this.__views__=[]}Ss.prototype=XC(QC.prototype),Ss.prototype.constructor=Ss;var p2=Ss;function tM(){}var nM=tM,Gd=Rd,rM=nM,oM=Gd?function(e){return Gd.get(e)}:rM,Kd=oM,iM={},sM=iM,qd=sM,lM=Object.prototype,aM=lM.hasOwnProperty;function cM(e){for(var t=e.name+"",n=qd[t],o=aM.call(qd,t)?n.length:0;o--;){var r=n[o],i=r.func;if(i==null||i==e)return r.name}return t}var fM=cM,uM=Fs,dM=h2;function Es(e,t){this.__wrapped__=e,this.__actions__=[],this.__chain__=!!t,this.__index__=0,this.__values__=void 0}Es.prototype=uM(dM.prototype),Es.prototype.constructor=Es;var Yd=Es,hM=p2,pM=Yd,gM=N1;function vM(e){if(e instanceof hM)return e.clone();var t=new pM(e.__wrapped__,e.__chain__);return t.__actions__=gM(e.__actions__),t.__index__=e.__index__,t.__values__=e.__values__,t}var mM=vM,yM=p2,Zd=Yd,wM=h2,_M=Bt,bM=Zt,FM=mM,$M=Object.prototype,xM=$M.hasOwnProperty;function Ps(e){if(bM(e)&&!_M(e)&&!(e instanceof yM)){if(e instanceof Zd)return e;if(xM.call(e,"__wrapped__"))return FM(e)}return new Zd(e)}Ps.prototype=wM.prototype,Ps.prototype.constructor=Ps;var OM=Ps,SM=p2,EM=Kd,PM=fM,CM=OM;function MM(e){var t=PM(e),n=CM[t];if(typeof n!="function"||!(t in SM.prototype))return!1;if(e===n)return!0;var o=EM(n);return!!o&&e===o[0]}var DM=MM,AM=Hd,TM=yd,jM=TM(AM),Jd=jM,zM=/\{\n\/\* \[wrapped with (.+)\] \*/,NM=/,? & /;function kM(e){var t=e.match(zM);return t?t[1].split(NM):[]}var IM=kM,BM=/\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/;function LM(e,t){var n=t.length;if(!n)return e;var o=n-1;return t[o]=(n>1?"& ":"")+t[o],t=t.join(n>2?", ":" "),e.replace(BM,`{
/* [wrapped with `+t+`] */
`)}var RM=LM;function VM(e,t,n,o){for(var r=e.length,i=n+(o?1:-1);o?i--:++i<r;)if(t(e[i],i,e))return i;return-1}var HM=VM;function UM(e){return e!==e}var WM=UM;function GM(e,t,n){for(var o=n-1,r=e.length;++o<r;)if(e[o]===t)return o;return-1}var KM=GM,qM=HM,YM=WM,ZM=KM;function JM(e,t,n){return t===t?ZM(e,t,n):qM(e,YM,n)}var XM=JM,QM=XM;function eD(e,t){var n=e==null?0:e.length;return!!n&&QM(e,t,0)>-1}var tD=eD,nD=i2,rD=tD,oD=1,iD=2,sD=8,lD=16,aD=32,cD=64,fD=128,uD=256,dD=512,hD=[["ary",fD],["bind",oD],["bindKey",iD],["curry",sD],["curryRight",lD],["flip",dD],["partial",aD],["partialRight",cD],["rearg",uD]];function pD(e,t){return nD(hD,function(n){var o="_."+n[0];t&n[1]&&!rD(e,o)&&e.push(o)}),e.sort()}var gD=pD,vD=IM,mD=RM,yD=o2,wD=gD;function _D(e,t,n){var o=t+"";return yD(e,mD(o,wD(vD(o),n)))}var Xd=_D,bD=DM,FD=Jd,$D=Xd,xD=1,OD=2,SD=4,ED=8,Qd=32,e4=64;function PD(e,t,n,o,r,i,s,l,a,c){var f=t&ED,u=f?s:void 0,d=f?void 0:s,h=f?i:void 0,p=f?void 0:i;t|=f?Qd:e4,t&=~(f?e4:Qd),t&SD||(t&=~(xD|OD));var v=[e,t,r,h,u,p,d,l,a,c],y=n.apply(void 0,v);return bD(e)&&FD(y,v),y.placeholder=o,$D(y,e,t)}var t4=PD;function CD(e){var t=e;return t.placeholder}var n4=CD,MD=N1,DD=j1,AD=Math.min;function TD(e,t){for(var n=e.length,o=AD(t.length,n),r=MD(e);o--;){var i=t[o];e[o]=DD(i,n)?r[i]:void 0}return e}var jD=TD,r4="__lodash_placeholder__";function zD(e,t){for(var n=-1,o=e.length,r=0,i=[];++n<o;){var s=e[n];(s===t||s===r4)&&(e[n]=r4,i[r++]=n)}return i}var g2=zD,ND=Ud,kD=Wd,ID=ZC,o4=Os,BD=t4,LD=n4,RD=jD,VD=g2,HD=It,UD=1,WD=2,GD=8,KD=16,qD=128,YD=512;function i4(e,t,n,o,r,i,s,l,a,c){var f=t&qD,u=t&UD,d=t&WD,h=t&(GD|KD),p=t&YD,v=d?void 0:o4(e);function y(){for(var g=arguments.length,w=Array(g),$=g;$--;)w[$]=arguments[$];if(h)var O=LD(y),T=ID(w,O);if(o&&(w=ND(w,o,r,h)),i&&(w=kD(w,i,s,h)),g-=T,h&&g<c){var S=VD(w,O);return BD(e,t,i4,y.placeholder,n,w,S,l,a,c-g)}var x=u?n:this,I=d?x[e]:e;return g=w.length,l?w=RD(w,l):p&&g>1&&w.reverse(),f&&a<g&&(w.length=a),this&&this!==HD&&this instanceof y&&(I=v||o4(I)),I.apply(x,w)}return y}var s4=i4,ZD=r2,JD=Os,XD=s4,QD=t4,eA=n4,tA=g2,nA=It;function rA(e,t,n){var o=JD(e);function r(){for(var i=arguments.length,s=Array(i),l=i,a=eA(r);l--;)s[l]=arguments[l];var c=i<3&&s[0]!==a&&s[i-1]!==a?[]:tA(s,a);if(i-=c.length,i<n)return QD(e,t,XD,r.placeholder,void 0,s,c,void 0,void 0,n-i);var f=this&&this!==nA&&this instanceof r?o:e;return ZD(f,this,s)}return r}var oA=rA,iA=r2,sA=Os,lA=It,aA=1;function cA(e,t,n,o){var r=t&aA,i=sA(e);function s(){for(var l=-1,a=arguments.length,c=-1,f=o.length,u=Array(f+a),d=this&&this!==lA&&this instanceof s?i:e;++c<f;)u[c]=o[c];for(;a--;)u[c++]=arguments[++l];return iA(d,r?n:this,u)}return s}var fA=cA,uA=Ud,dA=Wd,l4=g2,a4="__lodash_placeholder__",v2=1,hA=2,pA=4,c4=8,B1=128,f4=256,gA=Math.min;function vA(e,t){var n=e[1],o=t[1],r=n|o,i=r<(v2|hA|B1),s=o==B1&&n==c4||o==B1&&n==f4&&e[7].length<=t[8]||o==(B1|f4)&&t[7].length<=t[8]&&n==c4;if(!(i||s))return e;o&v2&&(e[2]=t[2],r|=n&v2?0:pA);var l=t[3];if(l){var a=e[3];e[3]=a?uA(a,l,t[4]):l,e[4]=a?l4(e[3],a4):t[4]}return l=t[5],l&&(a=e[5],e[5]=a?dA(a,l,t[6]):l,e[6]=a?l4(e[5],a4):t[6]),l=t[7],l&&(e[7]=l),o&B1&&(e[8]=e[8]==null?t[8]:gA(e[8],t[8])),e[9]==null&&(e[9]=t[9]),e[0]=t[0],e[1]=r,e}var mA=vA,yA=/\s/;function wA(e){for(var t=e.length;t--&&yA.test(e.charAt(t)););return t}var _A=wA,bA=_A,FA=/^\s+/;function $A(e){return e&&e.slice(0,bA(e)+1).replace(FA,"")}var xA=$A,OA=xA,u4=Yt,SA=T1,d4=NaN,EA=/^[-+]0x[0-9a-f]+$/i,PA=/^0b[01]+$/i,CA=/^0o[0-7]+$/i,MA=parseInt;function DA(e){if(typeof e=="number")return e;if(SA(e))return d4;if(u4(e)){var t=typeof e.valueOf=="function"?e.valueOf():e;e=u4(t)?t+"":t}if(typeof e!="string")return e===0?e:+e;e=OA(e);var n=PA.test(e);return n||CA.test(e)?MA(e.slice(2),n?2:8):EA.test(e)?d4:+e}var AA=DA,TA=AA,h4=1/0,jA=17976931348623157e292;function zA(e){if(!e)return e===0?e:0;if(e=TA(e),e===h4||e===-h4){var t=e<0?-1:1;return t*jA}return e===e?e:0}var NA=zA,kA=NA;function IA(e){var t=kA(e),n=t%1;return t===t?n?t-n:t:0}var p4=IA,BA=Hd,LA=UC,RA=oA,VA=s4,HA=fA,UA=Kd,WA=mA,GA=Jd,KA=Xd,g4=p4,qA="Expected a function",v4=1,YA=2,m2=8,y2=16,w2=32,m4=64,y4=Math.max;function ZA(e,t,n,o,r,i,s,l){var a=t&YA;if(!a&&typeof e!="function")throw new TypeError(qA);var c=o?o.length:0;if(c||(t&=~(w2|m4),o=r=void 0),s=s===void 0?s:y4(g4(s),0),l=l===void 0?l:g4(l),c-=r?r.length:0,t&m4){var f=o,u=r;o=r=void 0}var d=a?void 0:UA(e),h=[e,t,n,o,r,f,u,i,s,l];if(d&&WA(h,d),e=h[0],t=h[1],n=h[2],o=h[3],r=h[4],l=h[9]=h[9]===void 0?a?0:e.length:y4(h[9]-c,0),!l&&t&(m2|y2)&&(t&=~(m2|y2)),!t||t==v4)var p=LA(e,t,n);else t==m2||t==y2?p=RA(e,t,l):(t==w2||t==(v4|w2))&&!r.length?p=HA(e,t,n,o):p=VA.apply(void 0,h);var v=d?BA:GA;return KA(v(p,h),e,t)}var _2=ZA,JA=_2,XA=128;function QA(e,t,n){return t=n?void 0:t,t=e&&t==null?e.length:t,JA(e,XA,void 0,void 0,void 0,void 0,t)}var eT=QA,tT=zd,nT=4;function rT(e){return tT(e,nT)}var oT=rT,iT=_2,sT=8;function b2(e,t,n){t=n?void 0:t;var o=iT(e,sT,void 0,void 0,void 0,void 0,void 0,t);return o.placeholder=b2.placeholder,o}b2.placeholder={};var lT=b2,aT=Zr,cT=Zt,fT=ad,uT="[object DOMException]",dT="[object Error]";function hT(e){if(!cT(e))return!1;var t=aT(e);return t==dT||t==uT||typeof e.message=="string"&&typeof e.name=="string"&&!fT(e)}var pT=hT,gT=A1,vT=Zt,mT="[object WeakMap]";function yT(e){return vT(e)&&gT(e)==mT}var wT=yT,_T="__lodash_hash_undefined__";function bT(e){return this.__data__.set(e,_T),this}var FT=bT;function $T(e){return this.__data__.has(e)}var xT=$T,OT=Xa,ST=FT,ET=xT;function Cs(e){var t=-1,n=e==null?0:e.length;for(this.__data__=new OT;++t<n;)this.add(e[t])}Cs.prototype.add=Cs.prototype.push=ST,Cs.prototype.has=ET;var PT=Cs;function CT(e,t){for(var n=-1,o=e==null?0:e.length;++n<o;)if(t(e[n],n,e))return!0;return!1}var MT=CT;function DT(e,t){return e.has(t)}var AT=DT,TT=PT,jT=MT,zT=AT,NT=1,kT=2;function IT(e,t,n,o,r,i){var s=n&NT,l=e.length,a=t.length;if(l!=a&&!(s&&a>l))return!1;var c=i.get(e),f=i.get(t);if(c&&f)return c==t&&f==e;var u=-1,d=!0,h=n&kT?new TT:void 0;for(i.set(e,t),i.set(t,e);++u<l;){var p=e[u],v=t[u];if(o)var y=s?o(v,p,u,t,e,i):o(p,v,u,e,t,i);if(y!==void 0){if(y)continue;d=!1;break}if(h){if(!jT(t,function(g,w){if(!zT(h,w)&&(p===g||r(p,g,n,o,i)))return h.push(w)})){d=!1;break}}else if(!(p===v||r(p,v,n,o,i))){d=!1;break}}return i.delete(e),i.delete(t),d}var w4=IT;function BT(e){var t=-1,n=Array(e.size);return e.forEach(function(o,r){n[++t]=[r,o]}),n}var LT=BT;function RT(e){var t=-1,n=Array(e.size);return e.forEach(function(o){n[++t]=o}),n}var VT=RT,_4=xo,b4=nd,HT=z1,UT=w4,WT=LT,GT=VT,KT=1,qT=2,YT="[object Boolean]",ZT="[object Date]",JT="[object Error]",XT="[object Map]",QT="[object Number]",ej="[object RegExp]",tj="[object Set]",nj="[object String]",rj="[object Symbol]",oj="[object ArrayBuffer]",ij="[object DataView]",F4=_4?_4.prototype:void 0,F2=F4?F4.valueOf:void 0;function sj(e,t,n,o,r,i,s){switch(n){case ij:if(e.byteLength!=t.byteLength||e.byteOffset!=t.byteOffset)return!1;e=e.buffer,t=t.buffer;case oj:return!(e.byteLength!=t.byteLength||!i(new b4(e),new b4(t)));case YT:case ZT:case QT:return HT(+e,+t);case JT:return e.name==t.name&&e.message==t.message;case ej:case nj:return e==t+"";case XT:var l=WT;case tj:var a=o&KT;if(l||(l=GT),e.size!=t.size&&!a)return!1;var c=s.get(e);if(c)return c==t;o|=qT,s.set(e,t);var f=UT(l(e),l(t),o,r,i,s);return s.delete(e),f;case rj:if(F2)return F2.call(e)==F2.call(t)}return!1}var lj=sj,$4=xd,aj=1,cj=Object.prototype,fj=cj.hasOwnProperty;function uj(e,t,n,o,r,i){var s=n&aj,l=$4(e),a=l.length,c=$4(t),f=c.length;if(a!=f&&!s)return!1;for(var u=a;u--;){var d=l[u];if(!(s?d in t:fj.call(t,d)))return!1}var h=i.get(e),p=i.get(t);if(h&&p)return h==t&&p==e;var v=!0;i.set(e,t),i.set(t,e);for(var y=s;++u<a;){d=l[u];var g=e[d],w=t[d];if(o)var $=s?o(w,g,d,t,e,i):o(g,w,d,e,t,i);if(!($===void 0?g===w||r(g,w,n,o,i):$)){v=!1;break}y||(y=d=="constructor")}if(v&&!y){var O=e.constructor,T=t.constructor;O!=T&&"constructor"in e&&"constructor"in t&&!(typeof O=="function"&&O instanceof O&&typeof T=="function"&&T instanceof T)&&(v=!1)}return i.delete(e),i.delete(t),v}var dj=uj,$2=_s,hj=w4,pj=lj,gj=dj,x4=A1,O4=Bt,S4=hs,vj=Ja,mj=1,E4="[object Arguments]",P4="[object Array]",Ms="[object Object]",yj=Object.prototype,C4=yj.hasOwnProperty;function wj(e,t,n,o,r,i){var s=O4(e),l=O4(t),a=s?P4:x4(e),c=l?P4:x4(t);a=a==E4?Ms:a,c=c==E4?Ms:c;var f=a==Ms,u=c==Ms,d=a==c;if(d&&S4(e)){if(!S4(t))return!1;s=!0,f=!1}if(d&&!f)return i||(i=new $2),s||vj(e)?hj(e,t,n,o,r,i):pj(e,t,a,n,o,r,i);if(!(n&mj)){var h=f&&C4.call(e,"__wrapped__"),p=u&&C4.call(t,"__wrapped__");if(h||p){var v=h?e.value():e,y=p?t.value():t;return i||(i=new $2),r(v,y,n,o,i)}}return d?(i||(i=new $2),gj(e,t,n,o,r,i)):!1}var _j=wj,bj=_j,M4=Zt;function D4(e,t,n,o,r){return e===t?!0:e==null||t==null||!M4(e)&&!M4(t)?e!==e&&t!==t:bj(e,t,n,o,D4,r)}var A4=D4,Fj=_s,$j=A4,xj=1,Oj=2;function Sj(e,t,n,o){var r=n.length,i=r,s=!o;if(e==null)return!i;for(e=Object(e);r--;){var l=n[r];if(s&&l[2]?l[1]!==e[l[0]]:!(l[0]in e))return!1}for(;++r<i;){l=n[r];var a=l[0],c=e[a],f=l[1];if(s&&l[2]){if(c===void 0&&!(a in e))return!1}else{var u=new Fj;if(o)var d=o(c,f,a,e,t,u);if(!(d===void 0?$j(f,c,xj|Oj,o,u):d))return!1}}return!0}var Ej=Sj,Pj=Yt;function Cj(e){return e===e&&!Pj(e)}var T4=Cj,Mj=T4,Dj=gs;function Aj(e){for(var t=Dj(e),n=t.length;n--;){var o=t[n],r=e[o];t[n]=[o,r,Mj(r)]}return t}var Tj=Aj;function jj(e,t){return function(n){return n==null?!1:n[e]===t&&(t!==void 0||e in Object(n))}}var j4=jj,zj=Ej,Nj=Tj,kj=j4;function Ij(e){var t=Nj(e);return t.length==1&&t[0][2]?kj(t[0][0],t[0][1]):function(n){return n===e||zj(n,e,t)}}var Bj=Ij,Lj=Bt,Rj=T1,Vj=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,Hj=/^\w*$/;function Uj(e,t){if(Lj(e))return!1;var n=typeof e;return n=="number"||n=="symbol"||n=="boolean"||e==null||Rj(e)?!0:Hj.test(e)||!Vj.test(e)||t!=null&&e in Object(t)}var x2=Uj,z4=Xa,Wj="Expected a function";function O2(e,t){if(typeof e!="function"||t!=null&&typeof t!="function")throw new TypeError(Wj);var n=function(){var o=arguments,r=t?t.apply(this,o):o[0],i=n.cache;if(i.has(r))return i.get(r);var s=e.apply(this,o);return n.cache=i.set(r,s)||i,s};return n.cache=new(O2.Cache||z4),n}O2.Cache=z4;var Gj=O2,Kj=Gj,qj=500;function Yj(e){var t=Kj(e,function(o){return n.size===qj&&n.clear(),o}),n=t.cache;return t}var Zj=Yj,Jj=Zj,Xj=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,Qj=/\\(\\)?/g,ez=Jj(function(e){var t=[];return e.charCodeAt(0)===46&&t.push(""),e.replace(Xj,function(n,o,r,i){t.push(r?i.replace(Qj,"$1"):o||n)}),t}),N4=ez,tz=Bt,nz=x2,rz=N4,oz=qu;function iz(e,t){return tz(e)?e:nz(e,t)?[e]:rz(oz(e))}var Ds=iz,sz=T1,lz=1/0;function az(e){if(typeof e=="string"||sz(e))return e;var t=e+"";return t=="0"&&1/e==-lz?"-0":t}var Qr=az,cz=Ds,fz=Qr;function uz(e,t){t=cz(t,e);for(var n=0,o=t.length;e!=null&&n<o;)e=e[fz(t[n++])];return n&&n==o?e:void 0}var S2=uz,dz=S2;function hz(e,t,n){var o=e==null?void 0:dz(e,t);return o===void 0?n:o}var pz=hz;function gz(e,t){return e!=null&&t in Object(e)}var vz=gz,mz=Ds,yz=fs,wz=Bt,_z=j1,bz=qa,Fz=Qr;function $z(e,t,n){t=mz(t,e);for(var o=-1,r=t.length,i=!1;++o<r;){var s=Fz(t[o]);if(!(i=e!=null&&n(e,s)))break;e=e[s]}return i||++o!=r?i:(r=e==null?0:e.length,!!r&&bz(r)&&_z(s,r)&&(wz(e)||yz(e)))}var xz=$z,Oz=vz,Sz=xz;function Ez(e,t){return e!=null&&Sz(e,t,Oz)}var Pz=Ez,Cz=A4,Mz=pz,Dz=Pz,Az=x2,Tz=T4,jz=j4,zz=Qr,Nz=1,kz=2;function Iz(e,t){return Az(e)&&Tz(t)?jz(zz(e),t):function(n){var o=Mz(n,e);return o===void 0&&o===t?Dz(n,e):Cz(t,o,Nz|kz)}}var Bz=Iz;function Lz(e){return function(t){return t==null?void 0:t[e]}}var Rz=Lz,Vz=S2;function Hz(e){return function(t){return Vz(t,e)}}var Uz=Hz,Wz=Rz,Gz=Uz,Kz=x2,qz=Qr;function Yz(e){return Kz(e)?Wz(qz(e)):Gz(e)}var Zz=Yz,Jz=Bj,Xz=Bz,Qz=$s,eN=Bt,tN=Zz;function nN(e){return typeof e=="function"?e:e==null?Qz:typeof e=="object"?eN(e)?Xz(e[0],e[1]):Jz(e):tN(e)}var rN=nN,oN=zd,iN=rN,sN=1;function lN(e){return iN(typeof e=="function"?e:oN(e,sN))}var aN=lN,k4=xo,cN=fs,fN=Bt,I4=k4?k4.isConcatSpreadable:void 0;function uN(e){return fN(e)||cN(e)||!!(I4&&e&&e[I4])}var dN=uN,hN=l2,pN=dN;function B4(e,t,n,o,r){var i=-1,s=e.length;for(n||(n=pN),r||(r=[]);++i<s;){var l=e[i];t>0&&n(l)?t>1?B4(l,t-1,n,o,r):hN(r,l):o||(r[r.length]=l)}return r}var gN=B4,vN=gN;function mN(e){var t=e==null?0:e.length;return t?vN(e,1):[]}var yN=mN,wN=yN,_N=vd,bN=o2;function FN(e){return bN(_N(e,void 0,wN),e+"")}var $N=FN,xN=_2,ON=$N,SN=256,EN=ON(function(e,t){return xN(e,SN,void 0,void 0,void 0,t)}),PN=EN,CN=Hu,MN=N1,DN=Bt,AN=T1,TN=N4,jN=Qr,zN=qu;function NN(e){return DN(e)?CN(e,jN):AN(e)?[e]:MN(TN(zN(e)))}var kN=NN,IN={ary:eT,assign:wd,clone:oT,curry:lT,forEach:i2,isArray:Bt,isError:pT,isFunction:cs,isWeakMap:wT,iteratee:aN,keys:xu,rearg:PN,toInteger:p4,toPath:kN},BN=TC,LN=IN;function RN(e,t,n){return BN(LN,e,t,n)}var L4=RN,E2,R4;function VN(){if(R4)return E2;R4=1;var e=n2,t=Ds,n=j1,o=Yt,r=Qr;function i(s,l,a,c){if(!o(s))return s;l=t(l,s);for(var f=-1,u=l.length,d=u-1,h=s;h!=null&&++f<u;){var p=r(l[f]),v=a;if(p==="__proto__"||p==="constructor"||p==="prototype")return s;if(f!=d){var y=h[p];v=c?c(y,p,h):void 0,v===void 0&&(v=o(y)?y:n(l[f+1])?[]:{})}e(h,p,v),h=h[p]}return s}return E2=i,E2}var P2,V4;function HN(){if(V4)return P2;V4=1;var e=VN();function t(n,o,r){return n==null?n:e(n,o,r)}return P2=t,P2}var UN=L4,WN=UN("set",HN());WN.placeholder=c2();function GN(e){var t=e==null?0:e.length;return t?e[t-1]:void 0}var KN=GN,qN=S2,YN=OF;function ZN(e,t){return t.length<2?e:qN(e,YN(t,0,-1))}var JN=ZN,XN=Ds,QN=KN,ek=JN,tk=Qr;function nk(e,t){return t=XN(t,e),e=ek(e,t),e==null||delete e[tk(QN(t))]}var rk=nk,C2,H4;function ok(){if(H4)return C2;H4=1;var e=rk;function t(n,o){return n==null?!0:e(n,o)}return C2=t,C2}var ik=L4,sk=ik("unset",ok());sk.placeholder=c2();var M2={exports:{}},U4={},Jt={},Mo={},Do={},Ae={},Ao={};(function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.regexpCode=e.getEsmExportName=e.getProperty=e.safeStringify=e.stringify=e.strConcat=e.addCodeArg=e.str=e._=e.nil=e._Code=e.Name=e.IDENTIFIER=e._CodeOrName=void 0;class t{}e._CodeOrName=t,e.IDENTIFIER=/^[a-z$_][a-z$_0-9]*$/i;class n extends t{constructor(w){if(super(),!e.IDENTIFIER.test(w))throw new Error("CodeGen: name must be a valid identifier");this.str=w}toString(){return this.str}emptyStr(){return!1}get names(){return{[this.str]:1}}}e.Name=n;class o extends t{constructor(w){super(),this._items=typeof w=="string"?[w]:w}toString(){return this.str}emptyStr(){if(this._items.length>1)return!1;const w=this._items[0];return w===""||w==='""'}get str(){var w;return(w=this._str)!==null&&w!==void 0?w:this._str=this._items.reduce(($,O)=>`${$}${O}`,"")}get names(){var w;return(w=this._names)!==null&&w!==void 0?w:this._names=this._items.reduce(($,O)=>(O instanceof n&&($[O.str]=($[O.str]||0)+1),$),{})}}e._Code=o,e.nil=new o("");function r(g,...w){const $=[g[0]];let O=0;for(;O<w.length;)l($,w[O]),$.push(g[++O]);return new o($)}e._=r;const i=new o("+");function s(g,...w){const $=[h(g[0])];let O=0;for(;O<w.length;)$.push(i),l($,w[O]),$.push(i,h(g[++O]));return a($),new o($)}e.str=s;function l(g,w){w instanceof o?g.push(...w._items):w instanceof n?g.push(w):g.push(u(w))}e.addCodeArg=l;function a(g){let w=1;for(;w<g.length-1;){if(g[w]===i){const $=c(g[w-1],g[w+1]);if($!==void 0){g.splice(w-1,3,$);continue}g[w++]="+"}w++}}function c(g,w){if(w==='""')return g;if(g==='""')return w;if(typeof g=="string")return w instanceof n||g[g.length-1]!=='"'?void 0:typeof w!="string"?`${g.slice(0,-1)}${w}"`:w[0]==='"'?g.slice(0,-1)+w.slice(1):void 0;if(typeof w=="string"&&w[0]==='"'&&!(g instanceof n))return`"${g}${w.slice(1)}`}function f(g,w){return w.emptyStr()?g:g.emptyStr()?w:s`${g}${w}`}e.strConcat=f;function u(g){return typeof g=="number"||typeof g=="boolean"||g===null?g:h(Array.isArray(g)?g.join(","):g)}function d(g){return new o(h(g))}e.stringify=d;function h(g){return JSON.stringify(g).replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029")}e.safeStringify=h;function p(g){return typeof g=="string"&&e.IDENTIFIER.test(g)?new o(`.${g}`):r`[${g}]`}e.getProperty=p;function v(g){if(typeof g=="string"&&e.IDENTIFIER.test(g))return new o(`${g}`);throw new Error(`CodeGen: invalid export name: ${g}, use explicit $id name mapping`)}e.getEsmExportName=v;function y(g){return new o(g.toString())}e.regexpCode=y})(Ao);var D2={};(function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.ValueScope=e.ValueScopeName=e.Scope=e.varKinds=e.UsedValueState=void 0;const t=Ao;class n extends Error{constructor(c){super(`CodeGen: "code" for ${c} not defined`),this.value=c.value}}var o;(function(a){a[a.Started=0]="Started",a[a.Completed=1]="Completed"})(o=e.UsedValueState||(e.UsedValueState={})),e.varKinds={const:new t.Name("const"),let:new t.Name("let"),var:new t.Name("var")};class r{constructor({prefixes:c,parent:f}={}){this._names={},this._prefixes=c,this._parent=f}toName(c){return c instanceof t.Name?c:this.name(c)}name(c){return new t.Name(this._newName(c))}_newName(c){const f=this._names[c]||this._nameGroup(c);return`${c}${f.index++}`}_nameGroup(c){var f,u;if(!((u=(f=this._parent)===null||f===void 0?void 0:f._prefixes)===null||u===void 0)&&u.has(c)||this._prefixes&&!this._prefixes.has(c))throw new Error(`CodeGen: prefix "${c}" is not allowed in this scope`);return this._names[c]={prefix:c,index:0}}}e.Scope=r;class i extends t.Name{constructor(c,f){super(f),this.prefix=c}setValue(c,{property:f,itemIndex:u}){this.value=c,this.scopePath=(0,t._)`.${new t.Name(f)}[${u}]`}}e.ValueScopeName=i;const s=(0,t._)`\n`;class l extends r{constructor(c){super(c),this._values={},this._scope=c.scope,this.opts={...c,_n:c.lines?s:t.nil}}get(){return this._scope}name(c){return new i(c,this._newName(c))}value(c,f){var u;if(f.ref===void 0)throw new Error("CodeGen: ref must be passed in value");const d=this.toName(c),{prefix:h}=d,p=(u=f.key)!==null&&u!==void 0?u:f.ref;let v=this._values[h];if(v){const w=v.get(p);if(w)return w}else v=this._values[h]=new Map;v.set(p,d);const y=this._scope[h]||(this._scope[h]=[]),g=y.length;return y[g]=f.ref,d.setValue(f,{property:h,itemIndex:g}),d}getValue(c,f){const u=this._values[c];if(u)return u.get(f)}scopeRefs(c,f=this._values){return this._reduceValues(f,u=>{if(u.scopePath===void 0)throw new Error(`CodeGen: name "${u}" has no value`);return(0,t._)`${c}${u.scopePath}`})}scopeCode(c=this._values,f,u){return this._reduceValues(c,d=>{if(d.value===void 0)throw new Error(`CodeGen: name "${d}" has no value`);return d.value.code},f,u)}_reduceValues(c,f,u={},d){let h=t.nil;for(const p in c){const v=c[p];if(!v)continue;const y=u[p]=u[p]||new Map;v.forEach(g=>{if(y.has(g))return;y.set(g,o.Started);let w=f(g);if(w){const $=this.opts.es5?e.varKinds.var:e.varKinds.const;h=(0,t._)`${h}${$} ${g} = ${w};${this.opts._n}`}else if(w=d==null?void 0:d(g))h=(0,t._)`${h}${w}${this.opts._n}`;else throw new n(g);y.set(g,o.Completed)})}return h}}e.ValueScope=l})(D2),function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.or=e.and=e.not=e.CodeGen=e.operators=e.varKinds=e.ValueScopeName=e.ValueScope=e.Scope=e.Name=e.regexpCode=e.stringify=e.getProperty=e.nil=e.strConcat=e.str=e._=void 0;const t=Ao,n=D2;var o=Ao;Object.defineProperty(e,"_",{enumerable:!0,get:function(){return o._}}),Object.defineProperty(e,"str",{enumerable:!0,get:function(){return o.str}}),Object.defineProperty(e,"strConcat",{enumerable:!0,get:function(){return o.strConcat}}),Object.defineProperty(e,"nil",{enumerable:!0,get:function(){return o.nil}}),Object.defineProperty(e,"getProperty",{enumerable:!0,get:function(){return o.getProperty}}),Object.defineProperty(e,"stringify",{enumerable:!0,get:function(){return o.stringify}}),Object.defineProperty(e,"regexpCode",{enumerable:!0,get:function(){return o.regexpCode}}),Object.defineProperty(e,"Name",{enumerable:!0,get:function(){return o.Name}});var r=D2;Object.defineProperty(e,"Scope",{enumerable:!0,get:function(){return r.Scope}}),Object.defineProperty(e,"ValueScope",{enumerable:!0,get:function(){return r.ValueScope}}),Object.defineProperty(e,"ValueScopeName",{enumerable:!0,get:function(){return r.ValueScopeName}}),Object.defineProperty(e,"varKinds",{enumerable:!0,get:function(){return r.varKinds}}),e.operators={GT:new t._Code(">"),GTE:new t._Code(">="),LT:new t._Code("<"),LTE:new t._Code("<="),EQ:new t._Code("==="),NEQ:new t._Code("!=="),NOT:new t._Code("!"),OR:new t._Code("||"),AND:new t._Code("&&"),ADD:new t._Code("+")};class i{optimizeNodes(){return this}optimizeNames(m,_){return this}}class s extends i{constructor(m,_,E){super(),this.varKind=m,this.name=_,this.rhs=E}render({es5:m,_n:_}){const E=m?n.varKinds.var:this.varKind,N=this.rhs===void 0?"":` = ${this.rhs}`;return`${E} ${this.name}${N};`+_}optimizeNames(m,_){if(m[this.name.str])return this.rhs&&(this.rhs=de(this.rhs,m,_)),this}get names(){return this.rhs instanceof t._CodeOrName?this.rhs.names:{}}}class l extends i{constructor(m,_,E){super(),this.lhs=m,this.rhs=_,this.sideEffects=E}render({_n:m}){return`${this.lhs} = ${this.rhs};`+m}optimizeNames(m,_){if(!(this.lhs instanceof t.Name&&!m[this.lhs.str]&&!this.sideEffects))return this.rhs=de(this.rhs,m,_),this}get names(){const m=this.lhs instanceof t.Name?{}:{...this.lhs.names};return Ee(m,this.rhs)}}class a extends l{constructor(m,_,E,N){super(m,E,N),this.op=_}render({_n:m}){return`${this.lhs} ${this.op}= ${this.rhs};`+m}}class c extends i{constructor(m){super(),this.label=m,this.names={}}render({_n:m}){return`${this.label}:`+m}}class f extends i{constructor(m){super(),this.label=m,this.names={}}render({_n:m}){return`break${this.label?` ${this.label}`:""};`+m}}class u extends i{constructor(m){super(),this.error=m}render({_n:m}){return`throw ${this.error};`+m}get names(){return this.error.names}}class d extends i{constructor(m){super(),this.code=m}render({_n:m}){return`${this.code};`+m}optimizeNodes(){return`${this.code}`?this:void 0}optimizeNames(m,_){return this.code=de(this.code,m,_),this}get names(){return this.code instanceof t._CodeOrName?this.code.names:{}}}class h extends i{constructor(m=[]){super(),this.nodes=m}render(m){return this.nodes.reduce((_,E)=>_+E.render(m),"")}optimizeNodes(){const{nodes:m}=this;let _=m.length;for(;_--;){const E=m[_].optimizeNodes();Array.isArray(E)?m.splice(_,1,...E):E?m[_]=E:m.splice(_,1)}return m.length>0?this:void 0}optimizeNames(m,_){const{nodes:E}=this;let N=E.length;for(;N--;){const k=E[N];k.optimizeNames(m,_)||(Ce(m,k.names),E.splice(N,1))}return E.length>0?this:void 0}get names(){return this.nodes.reduce((m,_)=>K(m,_.names),{})}}class p extends h{render(m){return"{"+m._n+super.render(m)+"}"+m._n}}class v extends h{}class y extends p{}y.kind="else";class g extends p{constructor(m,_){super(_),this.condition=m}render(m){let _=`if(${this.condition})`+super.render(m);return this.else&&(_+="else "+this.else.render(m)),_}optimizeNodes(){super.optimizeNodes();const m=this.condition;if(m===!0)return this.nodes;let _=this.else;if(_){const E=_.optimizeNodes();_=this.else=Array.isArray(E)?new y(E):E}if(_)return m===!1?_ instanceof g?_:_.nodes:this.nodes.length?this:new g(be(m),_ instanceof g?[_]:_.nodes);if(!(m===!1||!this.nodes.length))return this}optimizeNames(m,_){var E;if(this.else=(E=this.else)===null||E===void 0?void 0:E.optimizeNames(m,_),!!(super.optimizeNames(m,_)||this.else))return this.condition=de(this.condition,m,_),this}get names(){const m=super.names;return Ee(m,this.condition),this.else&&K(m,this.else.names),m}}g.kind="if";class w extends p{}w.kind="for";class $ extends w{constructor(m){super(),this.iteration=m}render(m){return`for(${this.iteration})`+super.render(m)}optimizeNames(m,_){if(super.optimizeNames(m,_))return this.iteration=de(this.iteration,m,_),this}get names(){return K(super.names,this.iteration.names)}}class O extends w{constructor(m,_,E,N){super(),this.varKind=m,this.name=_,this.from=E,this.to=N}render(m){const _=m.es5?n.varKinds.var:this.varKind,{name:E,from:N,to:k}=this;return`for(${_} ${E}=${N}; ${E}<${k}; ${E}++)`+super.render(m)}get names(){const m=Ee(super.names,this.from);return Ee(m,this.to)}}class T extends w{constructor(m,_,E,N){super(),this.loop=m,this.varKind=_,this.name=E,this.iterable=N}render(m){return`for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})`+super.render(m)}optimizeNames(m,_){if(super.optimizeNames(m,_))return this.iterable=de(this.iterable,m,_),this}get names(){return K(super.names,this.iterable.names)}}class S extends p{constructor(m,_,E){super(),this.name=m,this.args=_,this.async=E}render(m){return`${this.async?"async ":""}function ${this.name}(${this.args})`+super.render(m)}}S.kind="func";class x extends h{render(m){return"return "+super.render(m)}}x.kind="return";class I extends p{render(m){let _="try"+super.render(m);return this.catch&&(_+=this.catch.render(m)),this.finally&&(_+=this.finally.render(m)),_}optimizeNodes(){var m,_;return super.optimizeNodes(),(m=this.catch)===null||m===void 0||m.optimizeNodes(),(_=this.finally)===null||_===void 0||_.optimizeNodes(),this}optimizeNames(m,_){var E,N;return super.optimizeNames(m,_),(E=this.catch)===null||E===void 0||E.optimizeNames(m,_),(N=this.finally)===null||N===void 0||N.optimizeNames(m,_),this}get names(){const m=super.names;return this.catch&&K(m,this.catch.names),this.finally&&K(m,this.finally.names),m}}class V extends p{constructor(m){super(),this.error=m}render(m){return`catch(${this.error})`+super.render(m)}}V.kind="catch";class W extends p{render(m){return"finally"+super.render(m)}}W.kind="finally";class re{constructor(m,_={}){this._values={},this._blockStarts=[],this._constants={},this.opts={..._,_n:_.lines?`
`:""},this._extScope=m,this._scope=new n.Scope({parent:m}),this._nodes=[new v]}toString(){return this._root.render(this.opts)}name(m){return this._scope.name(m)}scopeName(m){return this._extScope.name(m)}scopeValue(m,_){const E=this._extScope.value(m,_);return(this._values[E.prefix]||(this._values[E.prefix]=new Set)).add(E),E}getScopeValue(m,_){return this._extScope.getValue(m,_)}scopeRefs(m){return this._extScope.scopeRefs(m,this._values)}scopeCode(){return this._extScope.scopeCode(this._values)}_def(m,_,E,N){const k=this._scope.toName(_);return E!==void 0&&N&&(this._constants[k.str]=E),this._leafNode(new s(m,k,E)),k}const(m,_,E){return this._def(n.varKinds.const,m,_,E)}let(m,_,E){return this._def(n.varKinds.let,m,_,E)}var(m,_,E){return this._def(n.varKinds.var,m,_,E)}assign(m,_,E){return this._leafNode(new l(m,_,E))}add(m,_){return this._leafNode(new a(m,e.operators.ADD,_))}code(m){return typeof m=="function"?m():m!==t.nil&&this._leafNode(new d(m)),this}object(...m){const _=["{"];for(const[E,N]of m)_.length>1&&_.push(","),_.push(E),(E!==N||this.opts.es5)&&(_.push(":"),(0,t.addCodeArg)(_,N));return _.push("}"),new t._Code(_)}if(m,_,E){if(this._blockNode(new g(m)),_&&E)this.code(_).else().code(E).endIf();else if(_)this.code(_).endIf();else if(E)throw new Error('CodeGen: "else" body without "then" body');return this}elseIf(m){return this._elseNode(new g(m))}else(){return this._elseNode(new y)}endIf(){return this._endBlockNode(g,y)}_for(m,_){return this._blockNode(m),_&&this.code(_).endFor(),this}for(m,_){return this._for(new $(m),_)}forRange(m,_,E,N,k=this.opts.es5?n.varKinds.var:n.varKinds.let){const q=this._scope.toName(m);return this._for(new O(k,q,_,E),()=>N(q))}forOf(m,_,E,N=n.varKinds.const){const k=this._scope.toName(m);if(this.opts.es5){const q=_ instanceof t.Name?_:this.var("_arr",_);return this.forRange("_i",0,(0,t._)`${q}.length`,oe=>{this.var(k,(0,t._)`${q}[${oe}]`),E(k)})}return this._for(new T("of",N,k,_),()=>E(k))}forIn(m,_,E,N=this.opts.es5?n.varKinds.var:n.varKinds.const){if(this.opts.ownProperties)return this.forOf(m,(0,t._)`Object.keys(${_})`,E);const k=this._scope.toName(m);return this._for(new T("in",N,k,_),()=>E(k))}endFor(){return this._endBlockNode(w)}label(m){return this._leafNode(new c(m))}break(m){return this._leafNode(new f(m))}return(m){const _=new x;if(this._blockNode(_),this.code(m),_.nodes.length!==1)throw new Error('CodeGen: "return" should have one node');return this._endBlockNode(x)}try(m,_,E){if(!_&&!E)throw new Error('CodeGen: "try" without "catch" and "finally"');const N=new I;if(this._blockNode(N),this.code(m),_){const k=this.name("e");this._currNode=N.catch=new V(k),_(k)}return E&&(this._currNode=N.finally=new W,this.code(E)),this._endBlockNode(V,W)}throw(m){return this._leafNode(new u(m))}block(m,_){return this._blockStarts.push(this._nodes.length),m&&this.code(m).endBlock(_),this}endBlock(m){const _=this._blockStarts.pop();if(_===void 0)throw new Error("CodeGen: not in self-balancing block");const E=this._nodes.length-_;if(E<0||m!==void 0&&E!==m)throw new Error(`CodeGen: wrong number of nodes: ${E} vs ${m} expected`);return this._nodes.length=_,this}func(m,_=t.nil,E,N){return this._blockNode(new S(m,_,E)),N&&this.code(N).endFunc(),this}endFunc(){return this._endBlockNode(S)}optimize(m=1){for(;m-- >0;)this._root.optimizeNodes(),this._root.optimizeNames(this._root.names,this._constants)}_leafNode(m){return this._currNode.nodes.push(m),this}_blockNode(m){this._currNode.nodes.push(m),this._nodes.push(m)}_endBlockNode(m,_){const E=this._currNode;if(E instanceof m||_&&E instanceof _)return this._nodes.pop(),this;throw new Error(`CodeGen: not in block "${_?`${m.kind}/${_.kind}`:m.kind}"`)}_elseNode(m){const _=this._currNode;if(!(_ instanceof g))throw new Error('CodeGen: "else" without "if"');return this._currNode=_.else=m,this}get _root(){return this._nodes[0]}get _currNode(){const m=this._nodes;return m[m.length-1]}set _currNode(m){const _=this._nodes;_[_.length-1]=m}}e.CodeGen=re;function K(P,m){for(const _ in m)P[_]=(P[_]||0)+(m[_]||0);return P}function Ee(P,m){return m instanceof t._CodeOrName?K(P,m.names):P}function de(P,m,_){if(P instanceof t.Name)return E(P);if(!N(P))return P;return new t._Code(P._items.reduce((k,q)=>(q instanceof t.Name&&(q=E(q)),q instanceof t._Code?k.push(...q._items):k.push(q),k),[]));function E(k){const q=_[k.str];return q===void 0||m[k.str]!==1?k:(delete m[k.str],q)}function N(k){return k instanceof t._Code&&k._items.some(q=>q instanceof t.Name&&m[q.str]===1&&_[q.str]!==void 0)}}function Ce(P,m){for(const _ in m)P[_]=(P[_]||0)-(m[_]||0)}function be(P){return typeof P=="boolean"||typeof P=="number"||P===null?!P:(0,t._)`!${z(P)}`}e.not=be;const fe=j(e.operators.AND);function me(...P){return P.reduce(fe)}e.and=me;const He=j(e.operators.OR);function ee(...P){return P.reduce(He)}e.or=ee;function j(P){return(m,_)=>m===t.nil?_:_===t.nil?m:(0,t._)`${z(m)} ${P} ${z(_)}`}function z(P){return P instanceof t.Name?P:(0,t._)`(${P})`}}(Ae);var Re={};(function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.checkStrictMode=e.getErrorPath=e.Type=e.useFunc=e.setEvaluated=e.evaluatedPropsToName=e.mergeEvaluated=e.eachItem=e.unescapeJsonPointer=e.escapeJsonPointer=e.escapeFragment=e.unescapeFragment=e.schemaRefOrVal=e.schemaHasRulesButRef=e.schemaHasRules=e.checkUnknownRules=e.alwaysValidSchema=e.toHash=void 0;const t=Ae,n=Ao;function o(S){const x={};for(const I of S)x[I]=!0;return x}e.toHash=o;function r(S,x){return typeof x=="boolean"?x:Object.keys(x).length===0?!0:(i(S,x),!s(x,S.self.RULES.all))}e.alwaysValidSchema=r;function i(S,x=S.schema){const{opts:I,self:V}=S;if(!I.strictSchema||typeof x=="boolean")return;const W=V.RULES.keywords;for(const re in x)W[re]||T(S,`unknown keyword: "${re}"`)}e.checkUnknownRules=i;function s(S,x){if(typeof S=="boolean")return!S;for(const I in S)if(x[I])return!0;return!1}e.schemaHasRules=s;function l(S,x){if(typeof S=="boolean")return!S;for(const I in S)if(I!=="$ref"&&x.all[I])return!0;return!1}e.schemaHasRulesButRef=l;function a({topSchemaRef:S,schemaPath:x},I,V,W){if(!W){if(typeof I=="number"||typeof I=="boolean")return I;if(typeof I=="string")return(0,t._)`${I}`}return(0,t._)`${S}${x}${(0,t.getProperty)(V)}`}e.schemaRefOrVal=a;function c(S){return d(decodeURIComponent(S))}e.unescapeFragment=c;function f(S){return encodeURIComponent(u(S))}e.escapeFragment=f;function u(S){return typeof S=="number"?`${S}`:S.replace(/~/g,"~0").replace(/\//g,"~1")}e.escapeJsonPointer=u;function d(S){return S.replace(/~1/g,"/").replace(/~0/g,"~")}e.unescapeJsonPointer=d;function h(S,x){if(Array.isArray(S))for(const I of S)x(I);else x(S)}e.eachItem=h;function p({mergeNames:S,mergeToName:x,mergeValues:I,resultToName:V}){return(W,re,K,Ee)=>{const de=K===void 0?re:K instanceof t.Name?(re instanceof t.Name?S(W,re,K):x(W,re,K),K):re instanceof t.Name?(x(W,K,re),re):I(re,K);return Ee===t.Name&&!(de instanceof t.Name)?V(W,de):de}}e.mergeEvaluated={props:p({mergeNames:(S,x,I)=>S.if((0,t._)`${I} !== true && ${x} !== undefined`,()=>{S.if((0,t._)`${x} === true`,()=>S.assign(I,!0),()=>S.assign(I,(0,t._)`${I} || {}`).code((0,t._)`Object.assign(${I}, ${x})`))}),mergeToName:(S,x,I)=>S.if((0,t._)`${I} !== true`,()=>{x===!0?S.assign(I,!0):(S.assign(I,(0,t._)`${I} || {}`),y(S,I,x))}),mergeValues:(S,x)=>S===!0?!0:{...S,...x},resultToName:v}),items:p({mergeNames:(S,x,I)=>S.if((0,t._)`${I} !== true && ${x} !== undefined`,()=>S.assign(I,(0,t._)`${x} === true ? true : ${I} > ${x} ? ${I} : ${x}`)),mergeToName:(S,x,I)=>S.if((0,t._)`${I} !== true`,()=>S.assign(I,x===!0?!0:(0,t._)`${I} > ${x} ? ${I} : ${x}`)),mergeValues:(S,x)=>S===!0?!0:Math.max(S,x),resultToName:(S,x)=>S.var("items",x)})};function v(S,x){if(x===!0)return S.var("props",!0);const I=S.var("props",(0,t._)`{}`);return x!==void 0&&y(S,I,x),I}e.evaluatedPropsToName=v;function y(S,x,I){Object.keys(I).forEach(V=>S.assign((0,t._)`${x}${(0,t.getProperty)(V)}`,!0))}e.setEvaluated=y;const g={};function w(S,x){return S.scopeValue("func",{ref:x,code:g[x.code]||(g[x.code]=new n._Code(x.code))})}e.useFunc=w;var $;(function(S){S[S.Num=0]="Num",S[S.Str=1]="Str"})($=e.Type||(e.Type={}));function O(S,x,I){if(S instanceof t.Name){const V=x===$.Num;return I?V?(0,t._)`"[" + ${S} + "]"`:(0,t._)`"['" + ${S} + "']"`:V?(0,t._)`"/" + ${S}`:(0,t._)`"/" + ${S}.replace(/~/g, "~0").replace(/\\//g, "~1")`}return I?(0,t.getProperty)(S).toString():"/"+u(S)}e.getErrorPath=O;function T(S,x,I=S.opts.strictSchema){if(I){if(x=`strict mode: ${x}`,I===!0)throw new Error(x);S.self.logger.warn(x)}}e.checkStrictMode=T})(Re);var fn={};Object.defineProperty(fn,"__esModule",{value:!0});const Mt=Ae,lk={data:new Mt.Name("data"),valCxt:new Mt.Name("valCxt"),instancePath:new Mt.Name("instancePath"),parentData:new Mt.Name("parentData"),parentDataProperty:new Mt.Name("parentDataProperty"),rootData:new Mt.Name("rootData"),dynamicAnchors:new Mt.Name("dynamicAnchors"),vErrors:new Mt.Name("vErrors"),errors:new Mt.Name("errors"),this:new Mt.Name("this"),self:new Mt.Name("self"),scope:new Mt.Name("scope"),json:new Mt.Name("json"),jsonPos:new Mt.Name("jsonPos"),jsonLen:new Mt.Name("jsonLen"),jsonPart:new Mt.Name("jsonPart")};fn.default=lk,function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.extendErrors=e.resetErrorsCount=e.reportExtraError=e.reportError=e.keyword$DataError=e.keywordError=void 0;const t=Ae,n=Re,o=fn;e.keywordError={message:({keyword:y})=>(0,t.str)`must pass "${y}" keyword validation`},e.keyword$DataError={message:({keyword:y,schemaType:g})=>g?(0,t.str)`"${y}" keyword must be ${g} ($data)`:(0,t.str)`"${y}" keyword is invalid ($data)`};function r(y,g=e.keywordError,w,$){const{it:O}=y,{gen:T,compositeRule:S,allErrors:x}=O,I=u(y,g,w);$??(S||x)?a(T,I):c(O,(0,t._)`[${I}]`)}e.reportError=r;function i(y,g=e.keywordError,w){const{it:$}=y,{gen:O,compositeRule:T,allErrors:S}=$,x=u(y,g,w);a(O,x),T||S||c($,o.default.vErrors)}e.reportExtraError=i;function s(y,g){y.assign(o.default.errors,g),y.if((0,t._)`${o.default.vErrors} !== null`,()=>y.if(g,()=>y.assign((0,t._)`${o.default.vErrors}.length`,g),()=>y.assign(o.default.vErrors,null)))}e.resetErrorsCount=s;function l({gen:y,keyword:g,schemaValue:w,data:$,errsCount:O,it:T}){if(O===void 0)throw new Error("ajv implementation error");const S=y.name("err");y.forRange("i",O,o.default.errors,x=>{y.const(S,(0,t._)`${o.default.vErrors}[${x}]`),y.if((0,t._)`${S}.instancePath === undefined`,()=>y.assign((0,t._)`${S}.instancePath`,(0,t.strConcat)(o.default.instancePath,T.errorPath))),y.assign((0,t._)`${S}.schemaPath`,(0,t.str)`${T.errSchemaPath}/${g}`),T.opts.verbose&&(y.assign((0,t._)`${S}.schema`,w),y.assign((0,t._)`${S}.data`,$))})}e.extendErrors=l;function a(y,g){const w=y.const("err",g);y.if((0,t._)`${o.default.vErrors} === null`,()=>y.assign(o.default.vErrors,(0,t._)`[${w}]`),(0,t._)`${o.default.vErrors}.push(${w})`),y.code((0,t._)`${o.default.errors}++`)}function c(y,g){const{gen:w,validateName:$,schemaEnv:O}=y;O.$async?w.throw((0,t._)`new ${y.ValidationError}(${g})`):(w.assign((0,t._)`${$}.errors`,g),w.return(!1))}const f={keyword:new t.Name("keyword"),schemaPath:new t.Name("schemaPath"),params:new t.Name("params"),propertyName:new t.Name("propertyName"),message:new t.Name("message"),schema:new t.Name("schema"),parentSchema:new t.Name("parentSchema")};function u(y,g,w){const{createErrors:$}=y.it;return $===!1?(0,t._)`{}`:d(y,g,w)}function d(y,g,w={}){const{gen:$,it:O}=y,T=[h(O,w),p(y,w)];return v(y,g,T),$.object(...T)}function h({errorPath:y},{instancePath:g}){const w=g?(0,t.str)`${y}${(0,n.getErrorPath)(g,n.Type.Str)}`:y;return[o.default.instancePath,(0,t.strConcat)(o.default.instancePath,w)]}function p({keyword:y,it:{errSchemaPath:g}},{schemaPath:w,parentSchema:$}){let O=$?g:(0,t.str)`${g}/${y}`;return w&&(O=(0,t.str)`${O}${(0,n.getErrorPath)(w,n.Type.Str)}`),[f.schemaPath,O]}function v(y,{params:g,message:w},$){const{keyword:O,data:T,schemaValue:S,it:x}=y,{opts:I,propertyName:V,topSchemaRef:W,schemaPath:re}=x;$.push([f.keyword,O],[f.params,typeof g=="function"?g(y):g||(0,t._)`{}`]),I.messages&&$.push([f.message,typeof w=="function"?w(y):w]),I.verbose&&$.push([f.schema,S],[f.parentSchema,(0,t._)`${W}${re}`],[o.default.data,T]),V&&$.push([f.propertyName,V])}}(Do),Object.defineProperty(Mo,"__esModule",{value:!0}),Mo.boolOrEmptySchema=Mo.topBoolOrEmptySchema=void 0;const ak=Do,ck=Ae,fk=fn,uk={message:"boolean schema is false"};function dk(e){const{gen:t,schema:n,validateName:o}=e;n===!1?W4(e,!1):typeof n=="object"&&n.$async===!0?t.return(fk.default.data):(t.assign((0,ck._)`${o}.errors`,null),t.return(!0))}Mo.topBoolOrEmptySchema=dk;function hk(e,t){const{gen:n,schema:o}=e;o===!1?(n.var(t,!1),W4(e)):n.var(t,!0)}Mo.boolOrEmptySchema=hk;function W4(e,t){const{gen:n,data:o}=e,r={gen:n,keyword:"false schema",data:o,schema:!1,schemaCode:!1,schemaValue:!1,params:{},it:e};(0,ak.reportError)(r,uk,void 0,t)}var L1={},eo={};Object.defineProperty(eo,"__esModule",{value:!0}),eo.getRules=eo.isJSONType=void 0;const pk=["string","number","integer","boolean","null","object","array"],gk=new Set(pk);function vk(e){return typeof e=="string"&&gk.has(e)}eo.isJSONType=vk;function mk(){const e={number:{type:"number",rules:[]},string:{type:"string",rules:[]},array:{type:"array",rules:[]},object:{type:"object",rules:[]}};return{types:{...e,integer:!0,boolean:!0,null:!0},rules:[{rules:[]},e.number,e.string,e.array,e.object],post:{rules:[]},all:{},keywords:{}}}eo.getRules=mk;var Xn={};Object.defineProperty(Xn,"__esModule",{value:!0}),Xn.shouldUseRule=Xn.shouldUseGroup=Xn.schemaHasRulesForType=void 0;function yk({schema:e,self:t},n){const o=t.RULES.types[n];return o&&o!==!0&&G4(e,o)}Xn.schemaHasRulesForType=yk;function G4(e,t){return t.rules.some(n=>K4(e,n))}Xn.shouldUseGroup=G4;function K4(e,t){var n;return e[t.keyword]!==void 0||((n=t.definition.implements)===null||n===void 0?void 0:n.some(o=>e[o]!==void 0))}Xn.shouldUseRule=K4,function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.reportTypeError=e.checkDataTypes=e.checkDataType=e.coerceAndCheckDataType=e.getJSONTypes=e.getSchemaTypes=e.DataType=void 0;const t=eo,n=Xn,o=Do,r=Ae,i=Re;var s;(function($){$[$.Correct=0]="Correct",$[$.Wrong=1]="Wrong"})(s=e.DataType||(e.DataType={}));function l($){const O=a($.type);if(O.includes("null")){if($.nullable===!1)throw new Error("type: null contradicts nullable: false")}else{if(!O.length&&$.nullable!==void 0)throw new Error('"nullable" cannot be used without "type"');$.nullable===!0&&O.push("null")}return O}e.getSchemaTypes=l;function a($){const O=Array.isArray($)?$:$?[$]:[];if(O.every(t.isJSONType))return O;throw new Error("type must be JSONType or JSONType[]: "+O.join(","))}e.getJSONTypes=a;function c($,O){const{gen:T,data:S,opts:x}=$,I=u(O,x.coerceTypes),V=O.length>0&&!(I.length===0&&O.length===1&&(0,n.schemaHasRulesForType)($,O[0]));if(V){const W=v(O,S,x.strictNumbers,s.Wrong);T.if(W,()=>{I.length?d($,O,I):g($)})}return V}e.coerceAndCheckDataType=c;const f=new Set(["string","number","integer","boolean","null"]);function u($,O){return O?$.filter(T=>f.has(T)||O==="array"&&T==="array"):[]}function d($,O,T){const{gen:S,data:x,opts:I}=$,V=S.let("dataType",(0,r._)`typeof ${x}`),W=S.let("coerced",(0,r._)`undefined`);I.coerceTypes==="array"&&S.if((0,r._)`${V} == 'object' && Array.isArray(${x}) && ${x}.length == 1`,()=>S.assign(x,(0,r._)`${x}[0]`).assign(V,(0,r._)`typeof ${x}`).if(v(O,x,I.strictNumbers),()=>S.assign(W,x))),S.if((0,r._)`${W} !== undefined`);for(const K of T)(f.has(K)||K==="array"&&I.coerceTypes==="array")&&re(K);S.else(),g($),S.endIf(),S.if((0,r._)`${W} !== undefined`,()=>{S.assign(x,W),h($,W)});function re(K){switch(K){case"string":S.elseIf((0,r._)`${V} == "number" || ${V} == "boolean"`).assign(W,(0,r._)`"" + ${x}`).elseIf((0,r._)`${x} === null`).assign(W,(0,r._)`""`);return;case"number":S.elseIf((0,r._)`${V} == "boolean" || ${x} === null
              || (${V} == "string" && ${x} && ${x} == +${x})`).assign(W,(0,r._)`+${x}`);return;case"integer":S.elseIf((0,r._)`${V} === "boolean" || ${x} === null
              || (${V} === "string" && ${x} && ${x} == +${x} && !(${x} % 1))`).assign(W,(0,r._)`+${x}`);return;case"boolean":S.elseIf((0,r._)`${x} === "false" || ${x} === 0 || ${x} === null`).assign(W,!1).elseIf((0,r._)`${x} === "true" || ${x} === 1`).assign(W,!0);return;case"null":S.elseIf((0,r._)`${x} === "" || ${x} === 0 || ${x} === false`),S.assign(W,null);return;case"array":S.elseIf((0,r._)`${V} === "string" || ${V} === "number"
              || ${V} === "boolean" || ${x} === null`).assign(W,(0,r._)`[${x}]`)}}}function h({gen:$,parentData:O,parentDataProperty:T},S){$.if((0,r._)`${O} !== undefined`,()=>$.assign((0,r._)`${O}[${T}]`,S))}function p($,O,T,S=s.Correct){const x=S===s.Correct?r.operators.EQ:r.operators.NEQ;let I;switch($){case"null":return(0,r._)`${O} ${x} null`;case"array":I=(0,r._)`Array.isArray(${O})`;break;case"object":I=(0,r._)`${O} && typeof ${O} == "object" && !Array.isArray(${O})`;break;case"integer":I=V((0,r._)`!(${O} % 1) && !isNaN(${O})`);break;case"number":I=V();break;default:return(0,r._)`typeof ${O} ${x} ${$}`}return S===s.Correct?I:(0,r.not)(I);function V(W=r.nil){return(0,r.and)((0,r._)`typeof ${O} == "number"`,W,T?(0,r._)`isFinite(${O})`:r.nil)}}e.checkDataType=p;function v($,O,T,S){if($.length===1)return p($[0],O,T,S);let x;const I=(0,i.toHash)($);if(I.array&&I.object){const V=(0,r._)`typeof ${O} != "object"`;x=I.null?V:(0,r._)`!${O} || ${V}`,delete I.null,delete I.array,delete I.object}else x=r.nil;I.number&&delete I.integer;for(const V in I)x=(0,r.and)(x,p(V,O,T,S));return x}e.checkDataTypes=v;const y={message:({schema:$})=>`must be ${$}`,params:({schema:$,schemaValue:O})=>typeof $=="string"?(0,r._)`{type: ${$}}`:(0,r._)`{type: ${O}}`};function g($){const O=w($);(0,o.reportError)(O,y)}e.reportTypeError=g;function w($){const{gen:O,data:T,schema:S}=$,x=(0,i.schemaRefOrVal)($,S,"type");return{gen:O,keyword:"type",data:T,schema:S.type,schemaCode:x,schemaValue:x,parentSchema:S,params:{},it:$}}}(L1);var As={};Object.defineProperty(As,"__esModule",{value:!0}),As.assignDefaults=void 0;const To=Ae,wk=Re;function _k(e,t){const{properties:n,items:o}=e.schema;if(t==="object"&&n)for(const r in n)q4(e,r,n[r].default);else t==="array"&&Array.isArray(o)&&o.forEach((r,i)=>q4(e,i,r.default))}As.assignDefaults=_k;function q4(e,t,n){const{gen:o,compositeRule:r,data:i,opts:s}=e;if(n===void 0)return;const l=(0,To._)`${i}${(0,To.getProperty)(t)}`;if(r){(0,wk.checkStrictMode)(e,`default is ignored for: ${l}`);return}let a=(0,To._)`${l} === undefined`;s.useDefaults==="empty"&&(a=(0,To._)`${a} || ${l} === null || ${l} === ""`),o.if(a,(0,To._)`${l} = ${(0,To.stringify)(n)}`)}var $n={},ze={};Object.defineProperty(ze,"__esModule",{value:!0}),ze.validateUnion=ze.validateArray=ze.usePattern=ze.callValidateCode=ze.schemaProperties=ze.allSchemaProperties=ze.noPropertyInData=ze.propertyInData=ze.isOwnProperty=ze.hasPropFunc=ze.reportMissingProp=ze.checkMissingProp=ze.checkReportMissingProp=void 0;const Qe=Ae,A2=Re,_r=fn,bk=Re;function Fk(e,t){const{gen:n,data:o,it:r}=e;n.if(j2(n,o,t,r.opts.ownProperties),()=>{e.setParams({missingProperty:(0,Qe._)`${t}`},!0),e.error()})}ze.checkReportMissingProp=Fk;function $k({gen:e,data:t,it:{opts:n}},o,r){return(0,Qe.or)(...o.map(i=>(0,Qe.and)(j2(e,t,i,n.ownProperties),(0,Qe._)`${r} = ${i}`)))}ze.checkMissingProp=$k;function xk(e,t){e.setParams({missingProperty:t},!0),e.error()}ze.reportMissingProp=xk;function Y4(e){return e.scopeValue("func",{ref:Object.prototype.hasOwnProperty,code:(0,Qe._)`Object.prototype.hasOwnProperty`})}ze.hasPropFunc=Y4;function T2(e,t,n){return(0,Qe._)`${Y4(e)}.call(${t}, ${n})`}ze.isOwnProperty=T2;function Ok(e,t,n,o){const r=(0,Qe._)`${t}${(0,Qe.getProperty)(n)} !== undefined`;return o?(0,Qe._)`${r} && ${T2(e,t,n)}`:r}ze.propertyInData=Ok;function j2(e,t,n,o){const r=(0,Qe._)`${t}${(0,Qe.getProperty)(n)} === undefined`;return o?(0,Qe.or)(r,(0,Qe.not)(T2(e,t,n))):r}ze.noPropertyInData=j2;function Z4(e){return e?Object.keys(e).filter(t=>t!=="__proto__"):[]}ze.allSchemaProperties=Z4;function Sk(e,t){return Z4(t).filter(n=>!(0,A2.alwaysValidSchema)(e,t[n]))}ze.schemaProperties=Sk;function Ek({schemaCode:e,data:t,it:{gen:n,topSchemaRef:o,schemaPath:r,errorPath:i},it:s},l,a,c){const f=c?(0,Qe._)`${e}, ${t}, ${o}${r}`:t,u=[[_r.default.instancePath,(0,Qe.strConcat)(_r.default.instancePath,i)],[_r.default.parentData,s.parentData],[_r.default.parentDataProperty,s.parentDataProperty],[_r.default.rootData,_r.default.rootData]];s.opts.dynamicRef&&u.push([_r.default.dynamicAnchors,_r.default.dynamicAnchors]);const d=(0,Qe._)`${f}, ${n.object(...u)}`;return a!==Qe.nil?(0,Qe._)`${l}.call(${a}, ${d})`:(0,Qe._)`${l}(${d})`}ze.callValidateCode=Ek;const Pk=(0,Qe._)`new RegExp`;function Ck({gen:e,it:{opts:t}},n){const o=t.unicodeRegExp?"u":"",{regExp:r}=t.code,i=r(n,o);return e.scopeValue("pattern",{key:i.toString(),ref:i,code:(0,Qe._)`${r.code==="new RegExp"?Pk:(0,bk.useFunc)(e,r)}(${n}, ${o})`})}ze.usePattern=Ck;function Mk(e){const{gen:t,data:n,keyword:o,it:r}=e,i=t.name("valid");if(r.allErrors){const l=t.let("valid",!0);return s(()=>t.assign(l,!1)),l}return t.var(i,!0),s(()=>t.break()),i;function s(l){const a=t.const("len",(0,Qe._)`${n}.length`);t.forRange("i",0,a,c=>{e.subschema({keyword:o,dataProp:c,dataPropType:A2.Type.Num},i),t.if((0,Qe.not)(i),l)})}}ze.validateArray=Mk;function Dk(e){const{gen:t,schema:n,keyword:o,it:r}=e;if(!Array.isArray(n))throw new Error("ajv implementation error");if(n.some(a=>(0,A2.alwaysValidSchema)(r,a))&&!r.opts.unevaluated)return;const s=t.let("valid",!1),l=t.name("_valid");t.block(()=>n.forEach((a,c)=>{const f=e.subschema({keyword:o,schemaProp:c,compositeRule:!0},l);t.assign(s,(0,Qe._)`${s} || ${l}`),e.mergeValidEvaluated(f,l)||t.if((0,Qe.not)(s))})),e.result(s,()=>e.reset(),()=>e.error(!0))}ze.validateUnion=Dk,Object.defineProperty($n,"__esModule",{value:!0}),$n.validateKeywordUsage=$n.validSchemaType=$n.funcKeywordCode=$n.macroKeywordCode=void 0;const zt=Ae,to=fn,Ak=ze,Tk=Do;function jk(e,t){const{gen:n,keyword:o,schema:r,parentSchema:i,it:s}=e,l=t.macro.call(s.self,r,i,s),a=X4(n,o,l);s.opts.validateSchema!==!1&&s.self.validateSchema(l,!0);const c=n.name("valid");e.subschema({schema:l,schemaPath:zt.nil,errSchemaPath:`${s.errSchemaPath}/${o}`,topSchemaRef:a,compositeRule:!0},c),e.pass(c,()=>e.error(!0))}$n.macroKeywordCode=jk;function zk(e,t){var n;const{gen:o,keyword:r,schema:i,parentSchema:s,$data:l,it:a}=e;kk(a,t);const c=!l&&t.compile?t.compile.call(a.self,i,s,a):t.validate,f=X4(o,r,c),u=o.let("valid");e.block$data(u,d),e.ok((n=t.valid)!==null&&n!==void 0?n:u);function d(){if(t.errors===!1)v(),t.modifying&&J4(e),y(()=>e.error());else{const g=t.async?h():p();t.modifying&&J4(e),y(()=>Nk(e,g))}}function h(){const g=o.let("ruleErrs",null);return o.try(()=>v((0,zt._)`await `),w=>o.assign(u,!1).if((0,zt._)`${w} instanceof ${a.ValidationError}`,()=>o.assign(g,(0,zt._)`${w}.errors`),()=>o.throw(w))),g}function p(){const g=(0,zt._)`${f}.errors`;return o.assign(g,null),v(zt.nil),g}function v(g=t.async?(0,zt._)`await `:zt.nil){const w=a.opts.passContext?to.default.this:to.default.self,$=!("compile"in t&&!l||t.schema===!1);o.assign(u,(0,zt._)`${g}${(0,Ak.callValidateCode)(e,f,w,$)}`,t.modifying)}function y(g){var w;o.if((0,zt.not)((w=t.valid)!==null&&w!==void 0?w:u),g)}}$n.funcKeywordCode=zk;function J4(e){const{gen:t,data:n,it:o}=e;t.if(o.parentData,()=>t.assign(n,(0,zt._)`${o.parentData}[${o.parentDataProperty}]`))}function Nk(e,t){const{gen:n}=e;n.if((0,zt._)`Array.isArray(${t})`,()=>{n.assign(to.default.vErrors,(0,zt._)`${to.default.vErrors} === null ? ${t} : ${to.default.vErrors}.concat(${t})`).assign(to.default.errors,(0,zt._)`${to.default.vErrors}.length`),(0,Tk.extendErrors)(e)},()=>e.error())}function kk({schemaEnv:e},t){if(t.async&&!e.$async)throw new Error("async keyword in sync schema")}function X4(e,t,n){if(n===void 0)throw new Error(`keyword "${t}" failed to compile`);return e.scopeValue("keyword",typeof n=="function"?{ref:n}:{ref:n,code:(0,zt.stringify)(n)})}function Ik(e,t,n=!1){return!t.length||t.some(o=>o==="array"?Array.isArray(e):o==="object"?e&&typeof e=="object"&&!Array.isArray(e):typeof e==o||n&&typeof e>"u")}$n.validSchemaType=Ik;function Bk({schema:e,opts:t,self:n,errSchemaPath:o},r,i){if(Array.isArray(r.keyword)?!r.keyword.includes(i):r.keyword!==i)throw new Error("ajv implementation error");const s=r.dependencies;if(s!=null&&s.some(l=>!Object.prototype.hasOwnProperty.call(e,l)))throw new Error(`parent schema must have dependencies of ${i}: ${s.join(",")}`);if(r.validateSchema&&!r.validateSchema(e[i])){const a=`keyword "${i}" value is invalid at path "${o}": `+n.errorsText(r.validateSchema.errors);if(t.validateSchema==="log")n.logger.error(a);else throw new Error(a)}}$n.validateKeywordUsage=Bk;var br={};Object.defineProperty(br,"__esModule",{value:!0}),br.extendSubschemaMode=br.extendSubschemaData=br.getSubschema=void 0;const xn=Ae,Q4=Re;function Lk(e,{keyword:t,schemaProp:n,schema:o,schemaPath:r,errSchemaPath:i,topSchemaRef:s}){if(t!==void 0&&o!==void 0)throw new Error('both "keyword" and "schema" passed, only one allowed');if(t!==void 0){const l=e.schema[t];return n===void 0?{schema:l,schemaPath:(0,xn._)`${e.schemaPath}${(0,xn.getProperty)(t)}`,errSchemaPath:`${e.errSchemaPath}/${t}`}:{schema:l[n],schemaPath:(0,xn._)`${e.schemaPath}${(0,xn.getProperty)(t)}${(0,xn.getProperty)(n)}`,errSchemaPath:`${e.errSchemaPath}/${t}/${(0,Q4.escapeFragment)(n)}`}}if(o!==void 0){if(r===void 0||i===void 0||s===void 0)throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');return{schema:o,schemaPath:r,topSchemaRef:s,errSchemaPath:i}}throw new Error('either "keyword" or "schema" must be passed')}br.getSubschema=Lk;function Rk(e,t,{dataProp:n,dataPropType:o,data:r,dataTypes:i,propertyName:s}){if(r!==void 0&&n!==void 0)throw new Error('both "data" and "dataProp" passed, only one allowed');const{gen:l}=t;if(n!==void 0){const{errorPath:c,dataPathArr:f,opts:u}=t,d=l.let("data",(0,xn._)`${t.data}${(0,xn.getProperty)(n)}`,!0);a(d),e.errorPath=(0,xn.str)`${c}${(0,Q4.getErrorPath)(n,o,u.jsPropertySyntax)}`,e.parentDataProperty=(0,xn._)`${n}`,e.dataPathArr=[...f,e.parentDataProperty]}if(r!==void 0){const c=r instanceof xn.Name?r:l.let("data",r,!0);a(c),s!==void 0&&(e.propertyName=s)}i&&(e.dataTypes=i);function a(c){e.data=c,e.dataLevel=t.dataLevel+1,e.dataTypes=[],t.definedProperties=new Set,e.parentData=t.data,e.dataNames=[...t.dataNames,c]}}br.extendSubschemaData=Rk;function Vk(e,{jtdDiscriminator:t,jtdMetadata:n,compositeRule:o,createErrors:r,allErrors:i}){o!==void 0&&(e.compositeRule=o),r!==void 0&&(e.createErrors=r),i!==void 0&&(e.allErrors=i),e.jtdDiscriminator=t,e.jtdMetadata=n}br.extendSubschemaMode=Vk;var Ft={},e5=function e(t,n){if(t===n)return!0;if(t&&n&&typeof t=="object"&&typeof n=="object"){if(t.constructor!==n.constructor)return!1;var o,r,i;if(Array.isArray(t)){if(o=t.length,o!=n.length)return!1;for(r=o;r--!==0;)if(!e(t[r],n[r]))return!1;return!0}if(t.constructor===RegExp)return t.source===n.source&&t.flags===n.flags;if(t.valueOf!==Object.prototype.valueOf)return t.valueOf()===n.valueOf();if(t.toString!==Object.prototype.toString)return t.toString()===n.toString();if(i=Object.keys(t),o=i.length,o!==Object.keys(n).length)return!1;for(r=o;r--!==0;)if(!Object.prototype.hasOwnProperty.call(n,i[r]))return!1;for(r=o;r--!==0;){var s=i[r];if(!e(t[s],n[s]))return!1}return!0}return t!==t&&n!==n},t5={exports:{}},Fr=t5.exports=function(e,t,n){typeof t=="function"&&(n=t,t={}),n=t.cb||n;var o=typeof n=="function"?n:n.pre||function(){},r=n.post||function(){};Ts(t,o,r,e,"",e)};Fr.keywords={additionalItems:!0,items:!0,contains:!0,additionalProperties:!0,propertyNames:!0,not:!0,if:!0,then:!0,else:!0},Fr.arrayKeywords={items:!0,allOf:!0,anyOf:!0,oneOf:!0},Fr.propsKeywords={$defs:!0,definitions:!0,properties:!0,patternProperties:!0,dependencies:!0},Fr.skipKeywords={default:!0,enum:!0,const:!0,required:!0,maximum:!0,minimum:!0,exclusiveMaximum:!0,exclusiveMinimum:!0,multipleOf:!0,maxLength:!0,minLength:!0,pattern:!0,format:!0,maxItems:!0,minItems:!0,uniqueItems:!0,maxProperties:!0,minProperties:!0};function Ts(e,t,n,o,r,i,s,l,a,c){if(o&&typeof o=="object"&&!Array.isArray(o)){t(o,r,i,s,l,a,c);for(var f in o){var u=o[f];if(Array.isArray(u)){if(f in Fr.arrayKeywords)for(var d=0;d<u.length;d++)Ts(e,t,n,u[d],r+"/"+f+"/"+d,i,r,f,o,d)}else if(f in Fr.propsKeywords){if(u&&typeof u=="object")for(var h in u)Ts(e,t,n,u[h],r+"/"+f+"/"+Hk(h),i,r,f,o,h)}else(f in Fr.keywords||e.allKeys&&!(f in Fr.skipKeywords))&&Ts(e,t,n,u,r+"/"+f,i,r,f,o)}n(o,r,i,s,l,a,c)}}function Hk(e){return e.replace(/~/g,"~0").replace(/\//g,"~1")}var Uk=t5.exports;Object.defineProperty(Ft,"__esModule",{value:!0}),Ft.getSchemaRefs=Ft.resolveUrl=Ft.normalizeId=Ft._getFullPath=Ft.getFullPath=Ft.inlineRef=void 0;const Wk=Re,Gk=e5,Kk=Uk,qk=new Set(["type","format","pattern","maxLength","minLength","maxProperties","minProperties","maxItems","minItems","maximum","minimum","uniqueItems","multipleOf","required","enum","const"]);function Yk(e,t=!0){return typeof e=="boolean"?!0:t===!0?!z2(e):t?n5(e)<=t:!1}Ft.inlineRef=Yk;const Zk=new Set(["$ref","$recursiveRef","$recursiveAnchor","$dynamicRef","$dynamicAnchor"]);function z2(e){for(const t in e){if(Zk.has(t))return!0;const n=e[t];if(Array.isArray(n)&&n.some(z2)||typeof n=="object"&&z2(n))return!0}return!1}function n5(e){let t=0;for(const n in e){if(n==="$ref")return 1/0;if(t++,!qk.has(n)&&(typeof e[n]=="object"&&(0,Wk.eachItem)(e[n],o=>t+=n5(o)),t===1/0))return 1/0}return t}function r5(e,t="",n){n!==!1&&(t=jo(t));const o=e.parse(t);return o5(e,o)}Ft.getFullPath=r5;function o5(e,t){return e.serialize(t).split("#")[0]+"#"}Ft._getFullPath=o5;const Jk=/#\/?$/;function jo(e){return e?e.replace(Jk,""):""}Ft.normalizeId=jo;function Xk(e,t,n){return n=jo(n),e.resolve(t,n)}Ft.resolveUrl=Xk;const Qk=/^[a-z_][-a-z0-9._]*$/i;function eI(e,t){if(typeof e=="boolean")return{};const{schemaId:n,uriResolver:o}=this.opts,r=jo(e[n]||t),i={"":r},s=r5(o,r,!1),l={},a=new Set;return Kk(e,{allKeys:!0},(u,d,h,p)=>{if(p===void 0)return;const v=s+d;let y=i[p];typeof u[n]=="string"&&(y=g.call(this,u[n])),w.call(this,u.$anchor),w.call(this,u.$dynamicAnchor),i[d]=y;function g($){const O=this.opts.uriResolver.resolve;if($=jo(y?O(y,$):$),a.has($))throw f($);a.add($);let T=this.refs[$];return typeof T=="string"&&(T=this.refs[T]),typeof T=="object"?c(u,T.schema,$):$!==jo(v)&&($[0]==="#"?(c(u,l[$],$),l[$]=u):this.refs[$]=v),$}function w($){if(typeof $=="string"){if(!Qk.test($))throw new Error(`invalid anchor "${$}"`);g.call(this,`#${$}`)}}}),l;function c(u,d,h){if(d!==void 0&&!Gk(u,d))throw f(h)}function f(u){return new Error(`reference "${u}" resolves to more than one schema`)}}Ft.getSchemaRefs=eI,Object.defineProperty(Jt,"__esModule",{value:!0}),Jt.getData=Jt.KeywordCxt=Jt.validateFunctionCode=void 0;const i5=Mo,s5=L1,N2=Xn,js=L1,tI=As,R1=$n,k2=br,ce=Ae,xe=fn,nI=Ft,Qn=Re,V1=Do;function rI(e){if(f5(e)&&(u5(e),c5(e))){sI(e);return}l5(e,()=>(0,i5.topBoolOrEmptySchema)(e))}Jt.validateFunctionCode=rI;function l5({gen:e,validateName:t,schema:n,schemaEnv:o,opts:r},i){r.code.es5?e.func(t,(0,ce._)`${xe.default.data}, ${xe.default.valCxt}`,o.$async,()=>{e.code((0,ce._)`"use strict"; ${a5(n,r)}`),iI(e,r),e.code(i)}):e.func(t,(0,ce._)`${xe.default.data}, ${oI(r)}`,o.$async,()=>e.code(a5(n,r)).code(i))}function oI(e){return(0,ce._)`{${xe.default.instancePath}="", ${xe.default.parentData}, ${xe.default.parentDataProperty}, ${xe.default.rootData}=${xe.default.data}${e.dynamicRef?(0,ce._)`, ${xe.default.dynamicAnchors}={}`:ce.nil}}={}`}function iI(e,t){e.if(xe.default.valCxt,()=>{e.var(xe.default.instancePath,(0,ce._)`${xe.default.valCxt}.${xe.default.instancePath}`),e.var(xe.default.parentData,(0,ce._)`${xe.default.valCxt}.${xe.default.parentData}`),e.var(xe.default.parentDataProperty,(0,ce._)`${xe.default.valCxt}.${xe.default.parentDataProperty}`),e.var(xe.default.rootData,(0,ce._)`${xe.default.valCxt}.${xe.default.rootData}`),t.dynamicRef&&e.var(xe.default.dynamicAnchors,(0,ce._)`${xe.default.valCxt}.${xe.default.dynamicAnchors}`)},()=>{e.var(xe.default.instancePath,(0,ce._)`""`),e.var(xe.default.parentData,(0,ce._)`undefined`),e.var(xe.default.parentDataProperty,(0,ce._)`undefined`),e.var(xe.default.rootData,xe.default.data),t.dynamicRef&&e.var(xe.default.dynamicAnchors,(0,ce._)`{}`)})}function sI(e){const{schema:t,opts:n,gen:o}=e;l5(e,()=>{n.$comment&&t.$comment&&h5(e),uI(e),o.let(xe.default.vErrors,null),o.let(xe.default.errors,0),n.unevaluated&&lI(e),d5(e),pI(e)})}function lI(e){const{gen:t,validateName:n}=e;e.evaluated=t.const("evaluated",(0,ce._)`${n}.evaluated`),t.if((0,ce._)`${e.evaluated}.dynamicProps`,()=>t.assign((0,ce._)`${e.evaluated}.props`,(0,ce._)`undefined`)),t.if((0,ce._)`${e.evaluated}.dynamicItems`,()=>t.assign((0,ce._)`${e.evaluated}.items`,(0,ce._)`undefined`))}function a5(e,t){const n=typeof e=="object"&&e[t.schemaId];return n&&(t.code.source||t.code.process)?(0,ce._)`/*# sourceURL=${n} */`:ce.nil}function aI(e,t){if(f5(e)&&(u5(e),c5(e))){cI(e,t);return}(0,i5.boolOrEmptySchema)(e,t)}function c5({schema:e,self:t}){if(typeof e=="boolean")return!e;for(const n in e)if(t.RULES.all[n])return!0;return!1}function f5(e){return typeof e.schema!="boolean"}function cI(e,t){const{schema:n,gen:o,opts:r}=e;r.$comment&&n.$comment&&h5(e),dI(e),hI(e);const i=o.const("_errs",xe.default.errors);d5(e,i),o.var(t,(0,ce._)`${i} === ${xe.default.errors}`)}function u5(e){(0,Qn.checkUnknownRules)(e),fI(e)}function d5(e,t){if(e.opts.jtd)return p5(e,[],!1,t);const n=(0,s5.getSchemaTypes)(e.schema),o=(0,s5.coerceAndCheckDataType)(e,n);p5(e,n,!o,t)}function fI(e){const{schema:t,errSchemaPath:n,opts:o,self:r}=e;t.$ref&&o.ignoreKeywordsWithRef&&(0,Qn.schemaHasRulesButRef)(t,r.RULES)&&r.logger.warn(`$ref: keywords ignored in schema at path "${n}"`)}function uI(e){const{schema:t,opts:n}=e;t.default!==void 0&&n.useDefaults&&n.strictSchema&&(0,Qn.checkStrictMode)(e,"default is ignored in the schema root")}function dI(e){const t=e.schema[e.opts.schemaId];t&&(e.baseId=(0,nI.resolveUrl)(e.opts.uriResolver,e.baseId,t))}function hI(e){if(e.schema.$async&&!e.schemaEnv.$async)throw new Error("async schema in sync schema")}function h5({gen:e,schemaEnv:t,schema:n,errSchemaPath:o,opts:r}){const i=n.$comment;if(r.$comment===!0)e.code((0,ce._)`${xe.default.self}.logger.log(${i})`);else if(typeof r.$comment=="function"){const s=(0,ce.str)`${o}/$comment`,l=e.scopeValue("root",{ref:t.root});e.code((0,ce._)`${xe.default.self}.opts.$comment(${i}, ${s}, ${l}.schema)`)}}function pI(e){const{gen:t,schemaEnv:n,validateName:o,ValidationError:r,opts:i}=e;n.$async?t.if((0,ce._)`${xe.default.errors} === 0`,()=>t.return(xe.default.data),()=>t.throw((0,ce._)`new ${r}(${xe.default.vErrors})`)):(t.assign((0,ce._)`${o}.errors`,xe.default.vErrors),i.unevaluated&&gI(e),t.return((0,ce._)`${xe.default.errors} === 0`))}function gI({gen:e,evaluated:t,props:n,items:o}){n instanceof ce.Name&&e.assign((0,ce._)`${t}.props`,n),o instanceof ce.Name&&e.assign((0,ce._)`${t}.items`,o)}function p5(e,t,n,o){const{gen:r,schema:i,data:s,allErrors:l,opts:a,self:c}=e,{RULES:f}=c;if(i.$ref&&(a.ignoreKeywordsWithRef||!(0,Qn.schemaHasRulesButRef)(i,f))){r.block(()=>y5(e,"$ref",f.all.$ref.definition));return}a.jtd||vI(e,t),r.block(()=>{for(const d of f.rules)u(d);u(f.post)});function u(d){(0,N2.shouldUseGroup)(i,d)&&(d.type?(r.if((0,js.checkDataType)(d.type,s,a.strictNumbers)),g5(e,d),t.length===1&&t[0]===d.type&&n&&(r.else(),(0,js.reportTypeError)(e)),r.endIf()):g5(e,d),l||r.if((0,ce._)`${xe.default.errors} === ${o||0}`))}}function g5(e,t){const{gen:n,schema:o,opts:{useDefaults:r}}=e;r&&(0,tI.assignDefaults)(e,t.type),n.block(()=>{for(const i of t.rules)(0,N2.shouldUseRule)(o,i)&&y5(e,i.keyword,i.definition,t.type)})}function vI(e,t){e.schemaEnv.meta||!e.opts.strictTypes||(mI(e,t),e.opts.allowUnionTypes||yI(e,t),wI(e,e.dataTypes))}function mI(e,t){if(t.length){if(!e.dataTypes.length){e.dataTypes=t;return}t.forEach(n=>{v5(e.dataTypes,n)||I2(e,`type "${n}" not allowed by context "${e.dataTypes.join(",")}"`)}),bI(e,t)}}function yI(e,t){t.length>1&&!(t.length===2&&t.includes("null"))&&I2(e,"use allowUnionTypes to allow union type keyword")}function wI(e,t){const n=e.self.RULES.all;for(const o in n){const r=n[o];if(typeof r=="object"&&(0,N2.shouldUseRule)(e.schema,r)){const{type:i}=r.definition;i.length&&!i.some(s=>_I(t,s))&&I2(e,`missing type "${i.join(",")}" for keyword "${o}"`)}}}function _I(e,t){return e.includes(t)||t==="number"&&e.includes("integer")}function v5(e,t){return e.includes(t)||t==="integer"&&e.includes("number")}function bI(e,t){const n=[];for(const o of e.dataTypes)v5(t,o)?n.push(o):t.includes("integer")&&o==="number"&&n.push("integer");e.dataTypes=n}function I2(e,t){const n=e.schemaEnv.baseId+e.errSchemaPath;t+=` at "${n}" (strictTypes)`,(0,Qn.checkStrictMode)(e,t,e.opts.strictTypes)}class m5{constructor(t,n,o){if((0,R1.validateKeywordUsage)(t,n,o),this.gen=t.gen,this.allErrors=t.allErrors,this.keyword=o,this.data=t.data,this.schema=t.schema[o],this.$data=n.$data&&t.opts.$data&&this.schema&&this.schema.$data,this.schemaValue=(0,Qn.schemaRefOrVal)(t,this.schema,o,this.$data),this.schemaType=n.schemaType,this.parentSchema=t.schema,this.params={},this.it=t,this.def=n,this.$data)this.schemaCode=t.gen.const("vSchema",w5(this.$data,t));else if(this.schemaCode=this.schemaValue,!(0,R1.validSchemaType)(this.schema,n.schemaType,n.allowUndefined))throw new Error(`${o} value must be ${JSON.stringify(n.schemaType)}`);("code"in n?n.trackErrors:n.errors!==!1)&&(this.errsCount=t.gen.const("_errs",xe.default.errors))}result(t,n,o){this.failResult((0,ce.not)(t),n,o)}failResult(t,n,o){this.gen.if(t),o?o():this.error(),n?(this.gen.else(),n(),this.allErrors&&this.gen.endIf()):this.allErrors?this.gen.endIf():this.gen.else()}pass(t,n){this.failResult((0,ce.not)(t),void 0,n)}fail(t){if(t===void 0){this.error(),this.allErrors||this.gen.if(!1);return}this.gen.if(t),this.error(),this.allErrors?this.gen.endIf():this.gen.else()}fail$data(t){if(!this.$data)return this.fail(t);const{schemaCode:n}=this;this.fail((0,ce._)`${n} !== undefined && (${(0,ce.or)(this.invalid$data(),t)})`)}error(t,n,o){if(n){this.setParams(n),this._error(t,o),this.setParams({});return}this._error(t,o)}_error(t,n){(t?V1.reportExtraError:V1.reportError)(this,this.def.error,n)}$dataError(){(0,V1.reportError)(this,this.def.$dataError||V1.keyword$DataError)}reset(){if(this.errsCount===void 0)throw new Error('add "trackErrors" to keyword definition');(0,V1.resetErrorsCount)(this.gen,this.errsCount)}ok(t){this.allErrors||this.gen.if(t)}setParams(t,n){n?Object.assign(this.params,t):this.params=t}block$data(t,n,o=ce.nil){this.gen.block(()=>{this.check$data(t,o),n()})}check$data(t=ce.nil,n=ce.nil){if(!this.$data)return;const{gen:o,schemaCode:r,schemaType:i,def:s}=this;o.if((0,ce.or)((0,ce._)`${r} === undefined`,n)),t!==ce.nil&&o.assign(t,!0),(i.length||s.validateSchema)&&(o.elseIf(this.invalid$data()),this.$dataError(),t!==ce.nil&&o.assign(t,!1)),o.else()}invalid$data(){const{gen:t,schemaCode:n,schemaType:o,def:r,it:i}=this;return(0,ce.or)(s(),l());function s(){if(o.length){if(!(n instanceof ce.Name))throw new Error("ajv implementation error");const a=Array.isArray(o)?o:[o];return(0,ce._)`${(0,js.checkDataTypes)(a,n,i.opts.strictNumbers,js.DataType.Wrong)}`}return ce.nil}function l(){if(r.validateSchema){const a=t.scopeValue("validate$data",{ref:r.validateSchema});return(0,ce._)`!${a}(${n})`}return ce.nil}}subschema(t,n){const o=(0,k2.getSubschema)(this.it,t);(0,k2.extendSubschemaData)(o,this.it,t),(0,k2.extendSubschemaMode)(o,t);const r={...this.it,...o,items:void 0,props:void 0};return aI(r,n),r}mergeEvaluated(t,n){const{it:o,gen:r}=this;o.opts.unevaluated&&(o.props!==!0&&t.props!==void 0&&(o.props=Qn.mergeEvaluated.props(r,t.props,o.props,n)),o.items!==!0&&t.items!==void 0&&(o.items=Qn.mergeEvaluated.items(r,t.items,o.items,n)))}mergeValidEvaluated(t,n){const{it:o,gen:r}=this;if(o.opts.unevaluated&&(o.props!==!0||o.items!==!0))return r.if(n,()=>this.mergeEvaluated(t,ce.Name)),!0}}Jt.KeywordCxt=m5;function y5(e,t,n,o){const r=new m5(e,n,t);"code"in n?n.code(r,o):r.$data&&n.validate?(0,R1.funcKeywordCode)(r,n):"macro"in n?(0,R1.macroKeywordCode)(r,n):(n.compile||n.validate)&&(0,R1.funcKeywordCode)(r,n)}const FI=/^\/(?:[^~]|~0|~1)*$/,$I=/^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;function w5(e,{dataLevel:t,dataNames:n,dataPathArr:o}){let r,i;if(e==="")return xe.default.rootData;if(e[0]==="/"){if(!FI.test(e))throw new Error(`Invalid JSON-pointer: ${e}`);r=e,i=xe.default.rootData}else{const c=$I.exec(e);if(!c)throw new Error(`Invalid JSON-pointer: ${e}`);const f=+c[1];if(r=c[2],r==="#"){if(f>=t)throw new Error(a("property/index",f));return o[t-f]}if(f>t)throw new Error(a("data",f));if(i=n[t-f],!r)return i}let s=i;const l=r.split("/");for(const c of l)c&&(i=(0,ce._)`${i}${(0,ce.getProperty)((0,Qn.unescapeJsonPointer)(c))}`,s=(0,ce._)`${s} && ${i}`);return s;function a(c,f){return`Cannot access ${c} ${f} levels up, current level is ${t}`}}Jt.getData=w5;var H1={};Object.defineProperty(H1,"__esModule",{value:!0});class xI extends Error{constructor(t){super("validation failed"),this.errors=t,this.ajv=this.validation=!0}}H1.default=xI;var U1={};Object.defineProperty(U1,"__esModule",{value:!0});const B2=Ft;class OI extends Error{constructor(t,n,o,r){super(r||`can't resolve reference ${o} from id ${n}`),this.missingRef=(0,B2.resolveUrl)(t,n,o),this.missingSchema=(0,B2.normalizeId)((0,B2.getFullPath)(t,this.missingRef))}}U1.default=OI;var Lt={};Object.defineProperty(Lt,"__esModule",{value:!0}),Lt.resolveSchema=Lt.getCompilingSchema=Lt.resolveRef=Lt.compileSchema=Lt.SchemaEnv=void 0;const un=Ae,SI=H1,no=fn,dn=Ft,_5=Re,EI=Jt;class zs{constructor(t){var n;this.refs={},this.dynamicAnchors={};let o;typeof t.schema=="object"&&(o=t.schema),this.schema=t.schema,this.schemaId=t.schemaId,this.root=t.root||this,this.baseId=(n=t.baseId)!==null&&n!==void 0?n:(0,dn.normalizeId)(o==null?void 0:o[t.schemaId||"$id"]),this.schemaPath=t.schemaPath,this.localRefs=t.localRefs,this.meta=t.meta,this.$async=o==null?void 0:o.$async,this.refs={}}}Lt.SchemaEnv=zs;function L2(e){const t=b5.call(this,e);if(t)return t;const n=(0,dn.getFullPath)(this.opts.uriResolver,e.root.baseId),{es5:o,lines:r}=this.opts.code,{ownProperties:i}=this.opts,s=new un.CodeGen(this.scope,{es5:o,lines:r,ownProperties:i});let l;e.$async&&(l=s.scopeValue("Error",{ref:SI.default,code:(0,un._)`require("ajv/dist/runtime/validation_error").default`}));const a=s.scopeName("validate");e.validateName=a;const c={gen:s,allErrors:this.opts.allErrors,data:no.default.data,parentData:no.default.parentData,parentDataProperty:no.default.parentDataProperty,dataNames:[no.default.data],dataPathArr:[un.nil],dataLevel:0,dataTypes:[],definedProperties:new Set,topSchemaRef:s.scopeValue("schema",this.opts.code.source===!0?{ref:e.schema,code:(0,un.stringify)(e.schema)}:{ref:e.schema}),validateName:a,ValidationError:l,schema:e.schema,schemaEnv:e,rootId:n,baseId:e.baseId||n,schemaPath:un.nil,errSchemaPath:e.schemaPath||(this.opts.jtd?"":"#"),errorPath:(0,un._)`""`,opts:this.opts,self:this};let f;try{this._compilations.add(e),(0,EI.validateFunctionCode)(c),s.optimize(this.opts.code.optimize);const u=s.toString();f=`${s.scopeRefs(no.default.scope)}return ${u}`,this.opts.code.process&&(f=this.opts.code.process(f,e));const h=new Function(`${no.default.self}`,`${no.default.scope}`,f)(this,this.scope.get());if(this.scope.value(a,{ref:h}),h.errors=null,h.schema=e.schema,h.schemaEnv=e,e.$async&&(h.$async=!0),this.opts.code.source===!0&&(h.source={validateName:a,validateCode:u,scopeValues:s._values}),this.opts.unevaluated){const{props:p,items:v}=c;h.evaluated={props:p instanceof un.Name?void 0:p,items:v instanceof un.Name?void 0:v,dynamicProps:p instanceof un.Name,dynamicItems:v instanceof un.Name},h.source&&(h.source.evaluated=(0,un.stringify)(h.evaluated))}return e.validate=h,e}catch(u){throw delete e.validate,delete e.validateName,f&&this.logger.error("Error compiling schema, function code:",f),u}finally{this._compilations.delete(e)}}Lt.compileSchema=L2;function PI(e,t,n){var o;n=(0,dn.resolveUrl)(this.opts.uriResolver,t,n);const r=e.refs[n];if(r)return r;let i=DI.call(this,e,n);if(i===void 0){const s=(o=e.localRefs)===null||o===void 0?void 0:o[n],{schemaId:l}=this.opts;s&&(i=new zs({schema:s,schemaId:l,root:e,baseId:t}))}if(i!==void 0)return e.refs[n]=CI.call(this,i)}Lt.resolveRef=PI;function CI(e){return(0,dn.inlineRef)(e.schema,this.opts.inlineRefs)?e.schema:e.validate?e:L2.call(this,e)}function b5(e){for(const t of this._compilations)if(MI(t,e))return t}Lt.getCompilingSchema=b5;function MI(e,t){return e.schema===t.schema&&e.root===t.root&&e.baseId===t.baseId}function DI(e,t){let n;for(;typeof(n=this.refs[t])=="string";)t=n;return n||this.schemas[t]||Ns.call(this,e,t)}function Ns(e,t){const n=this.opts.uriResolver.parse(t),o=(0,dn._getFullPath)(this.opts.uriResolver,n);let r=(0,dn.getFullPath)(this.opts.uriResolver,e.baseId,void 0);if(Object.keys(e.schema).length>0&&o===r)return R2.call(this,n,e);const i=(0,dn.normalizeId)(o),s=this.refs[i]||this.schemas[i];if(typeof s=="string"){const l=Ns.call(this,e,s);return typeof(l==null?void 0:l.schema)!="object"?void 0:R2.call(this,n,l)}if(typeof(s==null?void 0:s.schema)=="object"){if(s.validate||L2.call(this,s),i===(0,dn.normalizeId)(t)){const{schema:l}=s,{schemaId:a}=this.opts,c=l[a];return c&&(r=(0,dn.resolveUrl)(this.opts.uriResolver,r,c)),new zs({schema:l,schemaId:a,root:e,baseId:r})}return R2.call(this,n,s)}}Lt.resolveSchema=Ns;const AI=new Set(["properties","patternProperties","enum","dependencies","definitions"]);function R2(e,{baseId:t,schema:n,root:o}){var r;if(((r=e.fragment)===null||r===void 0?void 0:r[0])!=="/")return;for(const l of e.fragment.slice(1).split("/")){if(typeof n=="boolean")return;const a=n[(0,_5.unescapeFragment)(l)];if(a===void 0)return;n=a;const c=typeof n=="object"&&n[this.opts.schemaId];!AI.has(l)&&c&&(t=(0,dn.resolveUrl)(this.opts.uriResolver,t,c))}let i;if(typeof n!="boolean"&&n.$ref&&!(0,_5.schemaHasRulesButRef)(n,this.RULES)){const l=(0,dn.resolveUrl)(this.opts.uriResolver,t,n.$ref);i=Ns.call(this,o,l)}const{schemaId:s}=this.opts;if(i=i||new zs({schema:n,schemaId:s,root:o,baseId:t}),i.schema!==i.root.schema)return i}const TI={$id:"https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",description:"Meta-schema for $data reference (JSON AnySchema extension proposal)",type:"object",required:["$data"],properties:{$data:{type:"string",anyOf:[{format:"relative-json-pointer"},{format:"json-pointer"}]}},additionalProperties:!1};var V2={},H2={exports:{}};/** @license URI.js v4.4.1 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */(function(e,t){(function(n,o){o(t)})(M1,function(n){function o(){for(var C=arguments.length,b=Array(C),D=0;D<C;D++)b[D]=arguments[D];if(b.length>1){b[0]=b[0].slice(0,-1);for(var R=b.length-1,L=1;L<R;++L)b[L]=b[L].slice(1,-1);return b[R]=b[R].slice(1),b.join("")}else return b[0]}function r(C){return"(?:"+C+")"}function i(C){return C===void 0?"undefined":C===null?"null":Object.prototype.toString.call(C).split(" ").pop().split("]").shift().toLowerCase()}function s(C){return C.toUpperCase()}function l(C){return C!=null?C instanceof Array?C:typeof C.length!="number"||C.split||C.setInterval||C.call?[C]:Array.prototype.slice.call(C):[]}function a(C,b){var D=C;if(b)for(var R in b)D[R]=b[R];return D}function c(C){var b="[A-Za-z]",D="[0-9]",R=o(D,"[A-Fa-f]"),L=r(r("%[EFef]"+R+"%"+R+R+"%"+R+R)+"|"+r("%[89A-Fa-f]"+R+"%"+R+R)+"|"+r("%"+R+R)),he="[\\:\\/\\?\\#\\[\\]\\@]",ge="[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",Le=o(he,ge),et=C?"[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]":"[]",ut=C?"[\\uE000-\\uF8FF]":"[]",Ie=o(b,D,"[\\-\\.\\_\\~]",et);r(b+o(b,D,"[\\+\\-\\.]")+"*"),r(r(L+"|"+o(Ie,ge,"[\\:]"))+"*");var Ye=r(r("25[0-5]")+"|"+r("2[0-4]"+D)+"|"+r("1"+D+D)+"|"+r("0?[1-9]"+D)+"|0?0?"+D),dt=r(Ye+"\\."+Ye+"\\."+Ye+"\\."+Ye),Se=r(R+"{1,4}"),rt=r(r(Se+"\\:"+Se)+"|"+dt),gt=r(r(Se+"\\:")+"{6}"+rt),ot=r("\\:\\:"+r(Se+"\\:")+"{5}"+rt),xr=r(r(Se)+"?\\:\\:"+r(Se+"\\:")+"{4}"+rt),On=r(r(r(Se+"\\:")+"{0,1}"+Se)+"?\\:\\:"+r(Se+"\\:")+"{3}"+rt),Sn=r(r(r(Se+"\\:")+"{0,2}"+Se)+"?\\:\\:"+r(Se+"\\:")+"{2}"+rt),Ho=r(r(r(Se+"\\:")+"{0,3}"+Se)+"?\\:\\:"+Se+"\\:"+rt),lo=r(r(r(Se+"\\:")+"{0,4}"+Se)+"?\\:\\:"+rt),tn=r(r(r(Se+"\\:")+"{0,5}"+Se)+"?\\:\\:"+Se),En=r(r(r(Se+"\\:")+"{0,6}"+Se)+"?\\:\\:"),ao=r([gt,ot,xr,On,Sn,Ho,lo,tn,En].join("|")),er=r(r(Ie+"|"+L)+"+");r("[vV]"+R+"+\\."+o(Ie,ge,"[\\:]")+"+"),r(r(L+"|"+o(Ie,ge))+"*");var ei=r(L+"|"+o(Ie,ge,"[\\:\\@]"));return r(r(L+"|"+o(Ie,ge,"[\\@]"))+"+"),r(r(ei+"|"+o("[\\/\\?]",ut))+"*"),{NOT_SCHEME:new RegExp(o("[^]",b,D,"[\\+\\-\\.]"),"g"),NOT_USERINFO:new RegExp(o("[^\\%\\:]",Ie,ge),"g"),NOT_HOST:new RegExp(o("[^\\%\\[\\]\\:]",Ie,ge),"g"),NOT_PATH:new RegExp(o("[^\\%\\/\\:\\@]",Ie,ge),"g"),NOT_PATH_NOSCHEME:new RegExp(o("[^\\%\\/\\@]",Ie,ge),"g"),NOT_QUERY:new RegExp(o("[^\\%]",Ie,ge,"[\\:\\@\\/\\?]",ut),"g"),NOT_FRAGMENT:new RegExp(o("[^\\%]",Ie,ge,"[\\:\\@\\/\\?]"),"g"),ESCAPE:new RegExp(o("[^]",Ie,ge),"g"),UNRESERVED:new RegExp(Ie,"g"),OTHER_CHARS:new RegExp(o("[^\\%]",Ie,Le),"g"),PCT_ENCODED:new RegExp(L,"g"),IPV4ADDRESS:new RegExp("^("+dt+")$"),IPV6ADDRESS:new RegExp("^\\[?("+ao+")"+r(r("\\%25|\\%(?!"+R+"{2})")+"("+er+")")+"?\\]?$")}}var f=c(!1),u=c(!0),d=function(){function C(b,D){var R=[],L=!0,he=!1,ge=void 0;try{for(var Le=b[Symbol.iterator](),et;!(L=(et=Le.next()).done)&&(R.push(et.value),!(D&&R.length===D));L=!0);}catch(ut){he=!0,ge=ut}finally{try{!L&&Le.return&&Le.return()}finally{if(he)throw ge}}return R}return function(b,D){if(Array.isArray(b))return b;if(Symbol.iterator in Object(b))return C(b,D);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),h=function(C){if(Array.isArray(C)){for(var b=0,D=Array(C.length);b<C.length;b++)D[b]=C[b];return D}else return Array.from(C)},p=2147483647,v=36,y=1,g=26,w=38,$=700,O=72,T=128,S="-",x=/^xn--/,I=/[^\0-\x7E]/,V=/[\x2E\u3002\uFF0E\uFF61]/g,W={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},re=v-y,K=Math.floor,Ee=String.fromCharCode;function de(C){throw new RangeError(W[C])}function Ce(C,b){for(var D=[],R=C.length;R--;)D[R]=b(C[R]);return D}function be(C,b){var D=C.split("@"),R="";D.length>1&&(R=D[0]+"@",C=D[1]),C=C.replace(V,".");var L=C.split("."),he=Ce(L,b).join(".");return R+he}function fe(C){for(var b=[],D=0,R=C.length;D<R;){var L=C.charCodeAt(D++);if(L>=55296&&L<=56319&&D<R){var he=C.charCodeAt(D++);(he&64512)==56320?b.push(((L&1023)<<10)+(he&1023)+65536):(b.push(L),D--)}else b.push(L)}return b}var me=function(b){return String.fromCodePoint.apply(String,h(b))},He=function(b){return b-48<10?b-22:b-65<26?b-65:b-97<26?b-97:v},ee=function(b,D){return b+22+75*(b<26)-((D!=0)<<5)},j=function(b,D,R){var L=0;for(b=R?K(b/$):b>>1,b+=K(b/D);b>re*g>>1;L+=v)b=K(b/re);return K(L+(re+1)*b/(b+w))},z=function(b){var D=[],R=b.length,L=0,he=T,ge=O,Le=b.lastIndexOf(S);Le<0&&(Le=0);for(var et=0;et<Le;++et)b.charCodeAt(et)>=128&&de("not-basic"),D.push(b.charCodeAt(et));for(var ut=Le>0?Le+1:0;ut<R;){for(var Ie=L,Ye=1,dt=v;;dt+=v){ut>=R&&de("invalid-input");var Se=He(b.charCodeAt(ut++));(Se>=v||Se>K((p-L)/Ye))&&de("overflow"),L+=Se*Ye;var rt=dt<=ge?y:dt>=ge+g?g:dt-ge;if(Se<rt)break;var gt=v-rt;Ye>K(p/gt)&&de("overflow"),Ye*=gt}var ot=D.length+1;ge=j(L-Ie,ot,Ie==0),K(L/ot)>p-he&&de("overflow"),he+=K(L/ot),L%=ot,D.splice(L++,0,he)}return String.fromCodePoint.apply(String,D)},P=function(b){var D=[];b=fe(b);var R=b.length,L=T,he=0,ge=O,Le=!0,et=!1,ut=void 0;try{for(var Ie=b[Symbol.iterator](),Ye;!(Le=(Ye=Ie.next()).done);Le=!0){var dt=Ye.value;dt<128&&D.push(Ee(dt))}}catch(ti){et=!0,ut=ti}finally{try{!Le&&Ie.return&&Ie.return()}finally{if(et)throw ut}}var Se=D.length,rt=Se;for(Se&&D.push(S);rt<R;){var gt=p,ot=!0,xr=!1,On=void 0;try{for(var Sn=b[Symbol.iterator](),Ho;!(ot=(Ho=Sn.next()).done);ot=!0){var lo=Ho.value;lo>=L&&lo<gt&&(gt=lo)}}catch(ti){xr=!0,On=ti}finally{try{!ot&&Sn.return&&Sn.return()}finally{if(xr)throw On}}var tn=rt+1;gt-L>K((p-he)/tn)&&de("overflow"),he+=(gt-L)*tn,L=gt;var En=!0,ao=!1,er=void 0;try{for(var ei=b[Symbol.iterator](),o6;!(En=(o6=ei.next()).done);En=!0){var i6=o6.value;if(i6<L&&++he>p&&de("overflow"),i6==L){for(var Js=he,Xs=v;;Xs+=v){var Qs=Xs<=ge?y:Xs>=ge+g?g:Xs-ge;if(Js<Qs)break;var s6=Js-Qs,l6=v-Qs;D.push(Ee(ee(Qs+s6%l6,0))),Js=K(s6/l6)}D.push(Ee(ee(Js,0))),ge=j(he,tn,rt==Se),he=0,++rt}}}catch(ti){ao=!0,er=ti}finally{try{!En&&ei.return&&ei.return()}finally{if(ao)throw er}}++he,++L}return D.join("")},m=function(b){return be(b,function(D){return x.test(D)?z(D.slice(4).toLowerCase()):D})},_=function(b){return be(b,function(D){return I.test(D)?"xn--"+P(D):D})},E={version:"2.1.0",ucs2:{decode:fe,encode:me},decode:z,encode:P,toASCII:_,toUnicode:m},N={};function k(C){var b=C.charCodeAt(0),D=void 0;return b<16?D="%0"+b.toString(16).toUpperCase():b<128?D="%"+b.toString(16).toUpperCase():b<2048?D="%"+(b>>6|192).toString(16).toUpperCase()+"%"+(b&63|128).toString(16).toUpperCase():D="%"+(b>>12|224).toString(16).toUpperCase()+"%"+(b>>6&63|128).toString(16).toUpperCase()+"%"+(b&63|128).toString(16).toUpperCase(),D}function q(C){for(var b="",D=0,R=C.length;D<R;){var L=parseInt(C.substr(D+1,2),16);if(L<128)b+=String.fromCharCode(L),D+=3;else if(L>=194&&L<224){if(R-D>=6){var he=parseInt(C.substr(D+4,2),16);b+=String.fromCharCode((L&31)<<6|he&63)}else b+=C.substr(D,6);D+=6}else if(L>=224){if(R-D>=9){var ge=parseInt(C.substr(D+4,2),16),Le=parseInt(C.substr(D+7,2),16);b+=String.fromCharCode((L&15)<<12|(ge&63)<<6|Le&63)}else b+=C.substr(D,9);D+=9}else b+=C.substr(D,3),D+=3}return b}function oe(C,b){function D(R){var L=q(R);return L.match(b.UNRESERVED)?L:R}return C.scheme&&(C.scheme=String(C.scheme).replace(b.PCT_ENCODED,D).toLowerCase().replace(b.NOT_SCHEME,"")),C.userinfo!==void 0&&(C.userinfo=String(C.userinfo).replace(b.PCT_ENCODED,D).replace(b.NOT_USERINFO,k).replace(b.PCT_ENCODED,s)),C.host!==void 0&&(C.host=String(C.host).replace(b.PCT_ENCODED,D).toLowerCase().replace(b.NOT_HOST,k).replace(b.PCT_ENCODED,s)),C.path!==void 0&&(C.path=String(C.path).replace(b.PCT_ENCODED,D).replace(C.scheme?b.NOT_PATH:b.NOT_PATH_NOSCHEME,k).replace(b.PCT_ENCODED,s)),C.query!==void 0&&(C.query=String(C.query).replace(b.PCT_ENCODED,D).replace(b.NOT_QUERY,k).replace(b.PCT_ENCODED,s)),C.fragment!==void 0&&(C.fragment=String(C.fragment).replace(b.PCT_ENCODED,D).replace(b.NOT_FRAGMENT,k).replace(b.PCT_ENCODED,s)),C}function Fe(C){return C.replace(/^0*(.*)/,"$1")||"0"}function Te(C,b){var D=C.match(b.IPV4ADDRESS)||[],R=d(D,2),L=R[1];return L?L.split(".").map(Fe).join("."):C}function nt(C,b){var D=C.match(b.IPV6ADDRESS)||[],R=d(D,3),L=R[1],he=R[2];if(L){for(var ge=L.toLowerCase().split("::").reverse(),Le=d(ge,2),et=Le[0],ut=Le[1],Ie=ut?ut.split(":").map(Fe):[],Ye=et.split(":").map(Fe),dt=b.IPV4ADDRESS.test(Ye[Ye.length-1]),Se=dt?7:8,rt=Ye.length-Se,gt=Array(Se),ot=0;ot<Se;++ot)gt[ot]=Ie[ot]||Ye[rt+ot]||"";dt&&(gt[Se-1]=Te(gt[Se-1],b));var xr=gt.reduce(function(tn,En,ao){if(!En||En==="0"){var er=tn[tn.length-1];er&&er.index+er.length===ao?er.length++:tn.push({index:ao,length:1})}return tn},[]),On=xr.sort(function(tn,En){return En.length-tn.length})[0],Sn=void 0;if(On&&On.length>1){var Ho=gt.slice(0,On.index),lo=gt.slice(On.index+On.length);Sn=Ho.join(":")+"::"+lo.join(":")}else Sn=gt.join(":");return he&&(Sn+="%"+he),Sn}else return C}var F=/^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i,M="".match(/(){0}/)[1]===void 0;function B(C){var b=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},D={},R=b.iri!==!1?u:f;b.reference==="suffix"&&(C=(b.scheme?b.scheme+":":"")+"//"+C);var L=C.match(F);if(L){M?(D.scheme=L[1],D.userinfo=L[3],D.host=L[4],D.port=parseInt(L[5],10),D.path=L[6]||"",D.query=L[7],D.fragment=L[8],isNaN(D.port)&&(D.port=L[5])):(D.scheme=L[1]||void 0,D.userinfo=C.indexOf("@")!==-1?L[3]:void 0,D.host=C.indexOf("//")!==-1?L[4]:void 0,D.port=parseInt(L[5],10),D.path=L[6]||"",D.query=C.indexOf("?")!==-1?L[7]:void 0,D.fragment=C.indexOf("#")!==-1?L[8]:void 0,isNaN(D.port)&&(D.port=C.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/)?L[4]:void 0)),D.host&&(D.host=nt(Te(D.host,R),R)),D.scheme===void 0&&D.userinfo===void 0&&D.host===void 0&&D.port===void 0&&!D.path&&D.query===void 0?D.reference="same-document":D.scheme===void 0?D.reference="relative":D.fragment===void 0?D.reference="absolute":D.reference="uri",b.reference&&b.reference!=="suffix"&&b.reference!==D.reference&&(D.error=D.error||"URI is not a "+b.reference+" reference.");var he=N[(b.scheme||D.scheme||"").toLowerCase()];if(!b.unicodeSupport&&(!he||!he.unicodeSupport)){if(D.host&&(b.domainHost||he&&he.domainHost))try{D.host=E.toASCII(D.host.replace(R.PCT_ENCODED,q).toLowerCase())}catch(ge){D.error=D.error||"Host's domain name can not be converted to ASCII via punycode: "+ge}oe(D,f)}else oe(D,R);he&&he.parse&&he.parse(D,b)}else D.error=D.error||"URI can not be parsed.";return D}function Y(C,b){var D=b.iri!==!1?u:f,R=[];return C.userinfo!==void 0&&(R.push(C.userinfo),R.push("@")),C.host!==void 0&&R.push(nt(Te(String(C.host),D),D).replace(D.IPV6ADDRESS,function(L,he,ge){return"["+he+(ge?"%25"+ge:"")+"]"})),(typeof C.port=="number"||typeof C.port=="string")&&(R.push(":"),R.push(String(C.port))),R.length?R.join(""):void 0}var G=/^\.\.?\//,Z=/^\/\.(\/|$)/,te=/^\/\.\.(\/|$)/,Q=/^\/?(?:.|\n)*?(?=\/|$)/;function J(C){for(var b=[];C.length;)if(C.match(G))C=C.replace(G,"");else if(C.match(Z))C=C.replace(Z,"/");else if(C.match(te))C=C.replace(te,"/"),b.pop();else if(C==="."||C==="..")C="";else{var D=C.match(Q);if(D){var R=D[0];C=C.slice(R.length),b.push(R)}else throw new Error("Unexpected dot segment condition")}return b.join("")}function U(C){var b=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},D=b.iri?u:f,R=[],L=N[(b.scheme||C.scheme||"").toLowerCase()];if(L&&L.serialize&&L.serialize(C,b),C.host&&!D.IPV6ADDRESS.test(C.host)){if(b.domainHost||L&&L.domainHost)try{C.host=b.iri?E.toUnicode(C.host):E.toASCII(C.host.replace(D.PCT_ENCODED,q).toLowerCase())}catch(Le){C.error=C.error||"Host's domain name can not be converted to "+(b.iri?"Unicode":"ASCII")+" via punycode: "+Le}}oe(C,D),b.reference!=="suffix"&&C.scheme&&(R.push(C.scheme),R.push(":"));var he=Y(C,b);if(he!==void 0&&(b.reference!=="suffix"&&R.push("//"),R.push(he),C.path&&C.path.charAt(0)!=="/"&&R.push("/")),C.path!==void 0){var ge=C.path;!b.absolutePath&&(!L||!L.absolutePath)&&(ge=J(ge)),he===void 0&&(ge=ge.replace(/^\/\//,"/%2F")),R.push(ge)}return C.query!==void 0&&(R.push("?"),R.push(C.query)),C.fragment!==void 0&&(R.push("#"),R.push(C.fragment)),R.join("")}function ne(C,b){var D=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{},R=arguments[3],L={};return R||(C=B(U(C,D),D),b=B(U(b,D),D)),D=D||{},!D.tolerant&&b.scheme?(L.scheme=b.scheme,L.userinfo=b.userinfo,L.host=b.host,L.port=b.port,L.path=J(b.path||""),L.query=b.query):(b.userinfo!==void 0||b.host!==void 0||b.port!==void 0?(L.userinfo=b.userinfo,L.host=b.host,L.port=b.port,L.path=J(b.path||""),L.query=b.query):(b.path?(b.path.charAt(0)==="/"?L.path=J(b.path):((C.userinfo!==void 0||C.host!==void 0||C.port!==void 0)&&!C.path?L.path="/"+b.path:C.path?L.path=C.path.slice(0,C.path.lastIndexOf("/")+1)+b.path:L.path=b.path,L.path=J(L.path)),L.query=b.query):(L.path=C.path,b.query!==void 0?L.query=b.query:L.query=C.query),L.userinfo=C.userinfo,L.host=C.host,L.port=C.port),L.scheme=C.scheme),L.fragment=b.fragment,L}function le(C,b,D){var R=a({scheme:"null"},D);return U(ne(B(C,R),B(b,R),R,!0),R)}function ie(C,b){return typeof C=="string"?C=U(B(C,b),b):i(C)==="object"&&(C=B(U(C,b),b)),C}function _e(C,b,D){return typeof C=="string"?C=U(B(C,D),D):i(C)==="object"&&(C=U(C,D)),typeof b=="string"?b=U(B(b,D),D):i(b)==="object"&&(b=U(b,D)),C===b}function Me(C,b){return C&&C.toString().replace(!b||!b.iri?f.ESCAPE:u.ESCAPE,k)}function je(C,b){return C&&C.toString().replace(!b||!b.iri?f.PCT_ENCODED:u.PCT_ENCODED,q)}var Ne={scheme:"http",domainHost:!0,parse:function(b,D){return b.host||(b.error=b.error||"HTTP URIs must have a host."),b},serialize:function(b,D){var R=String(b.scheme).toLowerCase()==="https";return(b.port===(R?443:80)||b.port==="")&&(b.port=void 0),b.path||(b.path="/"),b}},ft={scheme:"https",domainHost:Ne.domainHost,parse:Ne.parse,serialize:Ne.serialize};function Vt(C){return typeof C.secure=="boolean"?C.secure:String(C.scheme).toLowerCase()==="wss"}var Qt={scheme:"ws",domainHost:!0,parse:function(b,D){var R=b;return R.secure=Vt(R),R.resourceName=(R.path||"/")+(R.query?"?"+R.query:""),R.path=void 0,R.query=void 0,R},serialize:function(b,D){if((b.port===(Vt(b)?443:80)||b.port==="")&&(b.port=void 0),typeof b.secure=="boolean"&&(b.scheme=b.secure?"wss":"ws",b.secure=void 0),b.resourceName){var R=b.resourceName.split("?"),L=d(R,2),he=L[0],ge=L[1];b.path=he&&he!=="/"?he:void 0,b.query=ge,b.resourceName=void 0}return b.fragment=void 0,b}},X1={scheme:"wss",domainHost:Qt.domainHost,parse:Qt.parse,serialize:Qt.serialize},so={},Q1="[A-Za-z0-9\\-\\.\\_\\~\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]",qe="[0-9A-Fa-f]",en=r(r("%[EFef]"+qe+"%"+qe+qe+"%"+qe+qe)+"|"+r("%[89A-Fa-f]"+qe+"%"+qe+qe)+"|"+r("%"+qe+qe)),Zs="[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]",LG="[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]",RG=o(LG,'[\\"\\\\]'),VG="[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]",HG=new RegExp(Q1,"g"),Vo=new RegExp(en,"g"),UG=new RegExp(o("[^]",Zs,"[\\.]",'[\\"]',RG),"g"),e6=new RegExp(o("[^]",Q1,VG),"g"),WG=e6;function Sc(C){var b=q(C);return b.match(HG)?b:C}var t6={scheme:"mailto",parse:function(b,D){var R=b,L=R.to=R.path?R.path.split(","):[];if(R.path=void 0,R.query){for(var he=!1,ge={},Le=R.query.split("&"),et=0,ut=Le.length;et<ut;++et){var Ie=Le[et].split("=");switch(Ie[0]){case"to":for(var Ye=Ie[1].split(","),dt=0,Se=Ye.length;dt<Se;++dt)L.push(Ye[dt]);break;case"subject":R.subject=je(Ie[1],D);break;case"body":R.body=je(Ie[1],D);break;default:he=!0,ge[je(Ie[0],D)]=je(Ie[1],D);break}}he&&(R.headers=ge)}R.query=void 0;for(var rt=0,gt=L.length;rt<gt;++rt){var ot=L[rt].split("@");if(ot[0]=je(ot[0]),D.unicodeSupport)ot[1]=je(ot[1],D).toLowerCase();else try{ot[1]=E.toASCII(je(ot[1],D).toLowerCase())}catch(xr){R.error=R.error||"Email address's domain name can not be converted to ASCII via punycode: "+xr}L[rt]=ot.join("@")}return R},serialize:function(b,D){var R=b,L=l(b.to);if(L){for(var he=0,ge=L.length;he<ge;++he){var Le=String(L[he]),et=Le.lastIndexOf("@"),ut=Le.slice(0,et).replace(Vo,Sc).replace(Vo,s).replace(UG,k),Ie=Le.slice(et+1);try{Ie=D.iri?E.toUnicode(Ie):E.toASCII(je(Ie,D).toLowerCase())}catch(rt){R.error=R.error||"Email address's domain name can not be converted to "+(D.iri?"Unicode":"ASCII")+" via punycode: "+rt}L[he]=ut+"@"+Ie}R.path=L.join(",")}var Ye=b.headers=b.headers||{};b.subject&&(Ye.subject=b.subject),b.body&&(Ye.body=b.body);var dt=[];for(var Se in Ye)Ye[Se]!==so[Se]&&dt.push(Se.replace(Vo,Sc).replace(Vo,s).replace(e6,k)+"="+Ye[Se].replace(Vo,Sc).replace(Vo,s).replace(WG,k));return dt.length&&(R.query=dt.join("&")),R}},GG=/^([^\:]+)\:(.*)/,n6={scheme:"urn",parse:function(b,D){var R=b.path&&b.path.match(GG),L=b;if(R){var he=D.scheme||L.scheme||"urn",ge=R[1].toLowerCase(),Le=R[2],et=he+":"+(D.nid||ge),ut=N[et];L.nid=ge,L.nss=Le,L.path=void 0,ut&&(L=ut.parse(L,D))}else L.error=L.error||"URN can not be parsed.";return L},serialize:function(b,D){var R=D.scheme||b.scheme||"urn",L=b.nid,he=R+":"+(D.nid||L),ge=N[he];ge&&(b=ge.serialize(b,D));var Le=b,et=b.nss;return Le.path=(L||D.nid)+":"+et,Le}},KG=/^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/,r6={scheme:"urn:uuid",parse:function(b,D){var R=b;return R.uuid=R.nss,R.nss=void 0,!D.tolerant&&(!R.uuid||!R.uuid.match(KG))&&(R.error=R.error||"UUID is not valid."),R},serialize:function(b,D){var R=b;return R.nss=(b.uuid||"").toLowerCase(),R}};N[Ne.scheme]=Ne,N[ft.scheme]=ft,N[Qt.scheme]=Qt,N[X1.scheme]=X1,N[t6.scheme]=t6,N[n6.scheme]=n6,N[r6.scheme]=r6,n.SCHEMES=N,n.pctEncChar=k,n.pctDecChars=q,n.parse=B,n.removeDotSegments=J,n.serialize=U,n.resolveComponents=ne,n.resolve=le,n.normalize=ie,n.equal=_e,n.escapeComponent=Me,n.unescapeComponent=je,Object.defineProperty(n,"__esModule",{value:!0})})})(H2,H2.exports);var jI=H2.exports;Object.defineProperty(V2,"__esModule",{value:!0});const F5=jI;F5.code='require("ajv/dist/runtime/uri").default',V2.default=F5,function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.CodeGen=e.Name=e.nil=e.stringify=e.str=e._=e.KeywordCxt=void 0;var t=Jt;Object.defineProperty(e,"KeywordCxt",{enumerable:!0,get:function(){return t.KeywordCxt}});var n=Ae;Object.defineProperty(e,"_",{enumerable:!0,get:function(){return n._}}),Object.defineProperty(e,"str",{enumerable:!0,get:function(){return n.str}}),Object.defineProperty(e,"stringify",{enumerable:!0,get:function(){return n.stringify}}),Object.defineProperty(e,"nil",{enumerable:!0,get:function(){return n.nil}}),Object.defineProperty(e,"Name",{enumerable:!0,get:function(){return n.Name}}),Object.defineProperty(e,"CodeGen",{enumerable:!0,get:function(){return n.CodeGen}});const o=H1,r=U1,i=eo,s=Lt,l=Ae,a=Ft,c=L1,f=Re,u=TI,d=V2,h=(ee,j)=>new RegExp(ee,j);h.code="new RegExp";const p=["removeAdditional","useDefaults","coerceTypes"],v=new Set(["validate","serialize","parse","wrapper","root","schema","keyword","pattern","formats","validate$data","func","obj","Error"]),y={errorDataPath:"",format:"`validateFormats: false` can be used instead.",nullable:'"nullable" keyword is supported by default.',jsonPointers:"Deprecated jsPropertySyntax can be used instead.",extendRefs:"Deprecated ignoreKeywordsWithRef can be used instead.",missingRefs:"Pass empty schema with $id that should be ignored to ajv.addSchema.",processCode:"Use option `code: {process: (code, schemaEnv: object) => string}`",sourceCode:"Use option `code: {source: true}`",strictDefaults:"It is default now, see option `strict`.",strictKeywords:"It is default now, see option `strict`.",uniqueItems:'"uniqueItems" keyword is always validated.',unknownFormats:"Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",cache:"Map is used as cache, schema object as key.",serialize:"Map is used as cache, schema object as key.",ajvErrors:"It is default now."},g={ignoreKeywordsWithRef:"",jsPropertySyntax:"",unicode:'"minLength"/"maxLength" account for unicode characters by default.'},w=200;function $(ee){var j,z,P,m,_,E,N,k,q,oe,Fe,Te,nt,F,M,B,Y,G,Z,te,Q,J,U,ne,le;const ie=ee.strict,_e=(j=ee.code)===null||j===void 0?void 0:j.optimize,Me=_e===!0||_e===void 0?1:_e||0,je=(P=(z=ee.code)===null||z===void 0?void 0:z.regExp)!==null&&P!==void 0?P:h,Ne=(m=ee.uriResolver)!==null&&m!==void 0?m:d.default;return{strictSchema:(E=(_=ee.strictSchema)!==null&&_!==void 0?_:ie)!==null&&E!==void 0?E:!0,strictNumbers:(k=(N=ee.strictNumbers)!==null&&N!==void 0?N:ie)!==null&&k!==void 0?k:!0,strictTypes:(oe=(q=ee.strictTypes)!==null&&q!==void 0?q:ie)!==null&&oe!==void 0?oe:"log",strictTuples:(Te=(Fe=ee.strictTuples)!==null&&Fe!==void 0?Fe:ie)!==null&&Te!==void 0?Te:"log",strictRequired:(F=(nt=ee.strictRequired)!==null&&nt!==void 0?nt:ie)!==null&&F!==void 0?F:!1,code:ee.code?{...ee.code,optimize:Me,regExp:je}:{optimize:Me,regExp:je},loopRequired:(M=ee.loopRequired)!==null&&M!==void 0?M:w,loopEnum:(B=ee.loopEnum)!==null&&B!==void 0?B:w,meta:(Y=ee.meta)!==null&&Y!==void 0?Y:!0,messages:(G=ee.messages)!==null&&G!==void 0?G:!0,inlineRefs:(Z=ee.inlineRefs)!==null&&Z!==void 0?Z:!0,schemaId:(te=ee.schemaId)!==null&&te!==void 0?te:"$id",addUsedSchema:(Q=ee.addUsedSchema)!==null&&Q!==void 0?Q:!0,validateSchema:(J=ee.validateSchema)!==null&&J!==void 0?J:!0,validateFormats:(U=ee.validateFormats)!==null&&U!==void 0?U:!0,unicodeRegExp:(ne=ee.unicodeRegExp)!==null&&ne!==void 0?ne:!0,int32range:(le=ee.int32range)!==null&&le!==void 0?le:!0,uriResolver:Ne}}class O{constructor(j={}){this.schemas={},this.refs={},this.formats={},this._compilations=new Set,this._loading={},this._cache=new Map,j=this.opts={...j,...$(j)};const{es5:z,lines:P}=this.opts.code;this.scope=new l.ValueScope({scope:{},prefixes:v,es5:z,lines:P}),this.logger=K(j.logger);const m=j.validateFormats;j.validateFormats=!1,this.RULES=(0,i.getRules)(),T.call(this,y,j,"NOT SUPPORTED"),T.call(this,g,j,"DEPRECATED","warn"),this._metaOpts=W.call(this),j.formats&&I.call(this),this._addVocabularies(),this._addDefaultMetaSchema(),j.keywords&&V.call(this,j.keywords),typeof j.meta=="object"&&this.addMetaSchema(j.meta),x.call(this),j.validateFormats=m}_addVocabularies(){this.addKeyword("$async")}_addDefaultMetaSchema(){const{$data:j,meta:z,schemaId:P}=this.opts;let m=u;P==="id"&&(m={...u},m.id=m.$id,delete m.$id),z&&j&&this.addMetaSchema(m,m[P],!1)}defaultMeta(){const{meta:j,schemaId:z}=this.opts;return this.opts.defaultMeta=typeof j=="object"?j[z]||j:void 0}validate(j,z){let P;if(typeof j=="string"){if(P=this.getSchema(j),!P)throw new Error(`no schema with key or ref "${j}"`)}else P=this.compile(j);const m=P(z);return"$async"in P||(this.errors=P.errors),m}compile(j,z){const P=this._addSchema(j,z);return P.validate||this._compileSchemaEnv(P)}compileAsync(j,z){if(typeof this.opts.loadSchema!="function")throw new Error("options.loadSchema should be a function");const{loadSchema:P}=this.opts;return m.call(this,j,z);async function m(oe,Fe){await _.call(this,oe.$schema);const Te=this._addSchema(oe,Fe);return Te.validate||E.call(this,Te)}async function _(oe){oe&&!this.getSchema(oe)&&await m.call(this,{$ref:oe},!0)}async function E(oe){try{return this._compileSchemaEnv(oe)}catch(Fe){if(!(Fe instanceof r.default))throw Fe;return N.call(this,Fe),await k.call(this,Fe.missingSchema),E.call(this,oe)}}function N({missingSchema:oe,missingRef:Fe}){if(this.refs[oe])throw new Error(`AnySchema ${oe} is loaded but ${Fe} cannot be resolved`)}async function k(oe){const Fe=await q.call(this,oe);this.refs[oe]||await _.call(this,Fe.$schema),this.refs[oe]||this.addSchema(Fe,oe,z)}async function q(oe){const Fe=this._loading[oe];if(Fe)return Fe;try{return await(this._loading[oe]=P(oe))}finally{delete this._loading[oe]}}}addSchema(j,z,P,m=this.opts.validateSchema){if(Array.isArray(j)){for(const E of j)this.addSchema(E,void 0,P,m);return this}let _;if(typeof j=="object"){const{schemaId:E}=this.opts;if(_=j[E],_!==void 0&&typeof _!="string")throw new Error(`schema ${E} must be string`)}return z=(0,a.normalizeId)(z||_),this._checkUnique(z),this.schemas[z]=this._addSchema(j,P,z,m,!0),this}addMetaSchema(j,z,P=this.opts.validateSchema){return this.addSchema(j,z,!0,P),this}validateSchema(j,z){if(typeof j=="boolean")return!0;let P;if(P=j.$schema,P!==void 0&&typeof P!="string")throw new Error("$schema must be a string");if(P=P||this.opts.defaultMeta||this.defaultMeta(),!P)return this.logger.warn("meta-schema not available"),this.errors=null,!0;const m=this.validate(P,j);if(!m&&z){const _="schema is invalid: "+this.errorsText();if(this.opts.validateSchema==="log")this.logger.error(_);else throw new Error(_)}return m}getSchema(j){let z;for(;typeof(z=S.call(this,j))=="string";)j=z;if(z===void 0){const{schemaId:P}=this.opts,m=new s.SchemaEnv({schema:{},schemaId:P});if(z=s.resolveSchema.call(this,m,j),!z)return;this.refs[j]=z}return z.validate||this._compileSchemaEnv(z)}removeSchema(j){if(j instanceof RegExp)return this._removeAllSchemas(this.schemas,j),this._removeAllSchemas(this.refs,j),this;switch(typeof j){case"undefined":return this._removeAllSchemas(this.schemas),this._removeAllSchemas(this.refs),this._cache.clear(),this;case"string":{const z=S.call(this,j);return typeof z=="object"&&this._cache.delete(z.schema),delete this.schemas[j],delete this.refs[j],this}case"object":{const z=j;this._cache.delete(z);let P=j[this.opts.schemaId];return P&&(P=(0,a.normalizeId)(P),delete this.schemas[P],delete this.refs[P]),this}default:throw new Error("ajv.removeSchema: invalid parameter")}}addVocabulary(j){for(const z of j)this.addKeyword(z);return this}addKeyword(j,z){let P;if(typeof j=="string")P=j,typeof z=="object"&&(this.logger.warn("these parameters are deprecated, see docs for addKeyword"),z.keyword=P);else if(typeof j=="object"&&z===void 0){if(z=j,P=z.keyword,Array.isArray(P)&&!P.length)throw new Error("addKeywords: keyword must be string or non-empty array")}else throw new Error("invalid addKeywords parameters");if(de.call(this,P,z),!z)return(0,f.eachItem)(P,_=>Ce.call(this,_)),this;fe.call(this,z);const m={...z,type:(0,c.getJSONTypes)(z.type),schemaType:(0,c.getJSONTypes)(z.schemaType)};return(0,f.eachItem)(P,m.type.length===0?_=>Ce.call(this,_,m):_=>m.type.forEach(E=>Ce.call(this,_,m,E))),this}getKeyword(j){const z=this.RULES.all[j];return typeof z=="object"?z.definition:!!z}removeKeyword(j){const{RULES:z}=this;delete z.keywords[j],delete z.all[j];for(const P of z.rules){const m=P.rules.findIndex(_=>_.keyword===j);m>=0&&P.rules.splice(m,1)}return this}addFormat(j,z){return typeof z=="string"&&(z=new RegExp(z)),this.formats[j]=z,this}errorsText(j=this.errors,{separator:z=", ",dataVar:P="data"}={}){return!j||j.length===0?"No errors":j.map(m=>`${P}${m.instancePath} ${m.message}`).reduce((m,_)=>m+z+_)}$dataMetaSchema(j,z){const P=this.RULES.all;j=JSON.parse(JSON.stringify(j));for(const m of z){const _=m.split("/").slice(1);let E=j;for(const N of _)E=E[N];for(const N in P){const k=P[N];if(typeof k!="object")continue;const{$data:q}=k.definition,oe=E[N];q&&oe&&(E[N]=He(oe))}}return j}_removeAllSchemas(j,z){for(const P in j){const m=j[P];(!z||z.test(P))&&(typeof m=="string"?delete j[P]:m&&!m.meta&&(this._cache.delete(m.schema),delete j[P]))}}_addSchema(j,z,P,m=this.opts.validateSchema,_=this.opts.addUsedSchema){let E;const{schemaId:N}=this.opts;if(typeof j=="object")E=j[N];else{if(this.opts.jtd)throw new Error("schema must be object");if(typeof j!="boolean")throw new Error("schema must be object or boolean")}let k=this._cache.get(j);if(k!==void 0)return k;P=(0,a.normalizeId)(E||P);const q=a.getSchemaRefs.call(this,j,P);return k=new s.SchemaEnv({schema:j,schemaId:N,meta:z,baseId:P,localRefs:q}),this._cache.set(k.schema,k),_&&!P.startsWith("#")&&(P&&this._checkUnique(P),this.refs[P]=k),m&&this.validateSchema(j,!0),k}_checkUnique(j){if(this.schemas[j]||this.refs[j])throw new Error(`schema with key or id "${j}" already exists`)}_compileSchemaEnv(j){if(j.meta?this._compileMetaSchema(j):s.compileSchema.call(this,j),!j.validate)throw new Error("ajv implementation error");return j.validate}_compileMetaSchema(j){const z=this.opts;this.opts=this._metaOpts;try{s.compileSchema.call(this,j)}finally{this.opts=z}}}e.default=O,O.ValidationError=o.default,O.MissingRefError=r.default;function T(ee,j,z,P="error"){for(const m in ee){const _=m;_ in j&&this.logger[P](`${z}: option ${m}. ${ee[_]}`)}}function S(ee){return ee=(0,a.normalizeId)(ee),this.schemas[ee]||this.refs[ee]}function x(){const ee=this.opts.schemas;if(ee)if(Array.isArray(ee))this.addSchema(ee);else for(const j in ee)this.addSchema(ee[j],j)}function I(){for(const ee in this.opts.formats){const j=this.opts.formats[ee];j&&this.addFormat(ee,j)}}function V(ee){if(Array.isArray(ee)){this.addVocabulary(ee);return}this.logger.warn("keywords option as map is deprecated, pass array");for(const j in ee){const z=ee[j];z.keyword||(z.keyword=j),this.addKeyword(z)}}function W(){const ee={...this.opts};for(const j of p)delete ee[j];return ee}const re={log(){},warn(){},error(){}};function K(ee){if(ee===!1)return re;if(ee===void 0)return console;if(ee.log&&ee.warn&&ee.error)return ee;throw new Error("logger must implement log, warn and error methods")}const Ee=/^[a-z_$][a-z0-9_$:-]*$/i;function de(ee,j){const{RULES:z}=this;if((0,f.eachItem)(ee,P=>{if(z.keywords[P])throw new Error(`Keyword ${P} is already defined`);if(!Ee.test(P))throw new Error(`Keyword ${P} has invalid name`)}),!!j&&j.$data&&!("code"in j||"validate"in j))throw new Error('$data keyword must have "code" or "validate" function')}function Ce(ee,j,z){var P;const m=j==null?void 0:j.post;if(z&&m)throw new Error('keyword with "post" flag cannot have "type"');const{RULES:_}=this;let E=m?_.post:_.rules.find(({type:k})=>k===z);if(E||(E={type:z,rules:[]},_.rules.push(E)),_.keywords[ee]=!0,!j)return;const N={keyword:ee,definition:{...j,type:(0,c.getJSONTypes)(j.type),schemaType:(0,c.getJSONTypes)(j.schemaType)}};j.before?be.call(this,E,N,j.before):E.rules.push(N),_.all[ee]=N,(P=j.implements)===null||P===void 0||P.forEach(k=>this.addKeyword(k))}function be(ee,j,z){const P=ee.rules.findIndex(m=>m.keyword===z);P>=0?ee.rules.splice(P,0,j):(ee.rules.push(j),this.logger.warn(`rule ${z} is not defined`))}function fe(ee){let{metaSchema:j}=ee;j!==void 0&&(ee.$data&&this.opts.$data&&(j=He(j)),ee.validateSchema=this.compile(j,!0))}const me={$ref:"https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"};function He(ee){return{anyOf:[ee,me]}}}(U4);var U2={},W2={},G2={};Object.defineProperty(G2,"__esModule",{value:!0});const zI={keyword:"id",code(){throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID')}};G2.default=zI;var ro={};Object.defineProperty(ro,"__esModule",{value:!0}),ro.callRef=ro.getValidate=void 0;const NI=U1,$5=ze,Rt=Ae,zo=fn,x5=Lt,ks=Re,kI={keyword:"$ref",schemaType:"string",code(e){const{gen:t,schema:n,it:o}=e,{baseId:r,schemaEnv:i,validateName:s,opts:l,self:a}=o,{root:c}=i;if((n==="#"||n==="#/")&&r===c.baseId)return u();const f=x5.resolveRef.call(a,c,r,n);if(f===void 0)throw new NI.default(o.opts.uriResolver,r,n);if(f instanceof x5.SchemaEnv)return d(f);return h(f);function u(){if(i===c)return Is(e,s,i,i.$async);const p=t.scopeValue("root",{ref:c});return Is(e,(0,Rt._)`${p}.validate`,c,c.$async)}function d(p){const v=O5(e,p);Is(e,v,p,p.$async)}function h(p){const v=t.scopeValue("schema",l.code.source===!0?{ref:p,code:(0,Rt.stringify)(p)}:{ref:p}),y=t.name("valid"),g=e.subschema({schema:p,dataTypes:[],schemaPath:Rt.nil,topSchemaRef:v,errSchemaPath:n},y);e.mergeEvaluated(g),e.ok(y)}}};function O5(e,t){const{gen:n}=e;return t.validate?n.scopeValue("validate",{ref:t.validate}):(0,Rt._)`${n.scopeValue("wrapper",{ref:t})}.validate`}ro.getValidate=O5;function Is(e,t,n,o){const{gen:r,it:i}=e,{allErrors:s,schemaEnv:l,opts:a}=i,c=a.passContext?zo.default.this:Rt.nil;o?f():u();function f(){if(!l.$async)throw new Error("async schema referenced by sync schema");const p=r.let("valid");r.try(()=>{r.code((0,Rt._)`await ${(0,$5.callValidateCode)(e,t,c)}`),h(t),s||r.assign(p,!0)},v=>{r.if((0,Rt._)`!(${v} instanceof ${i.ValidationError})`,()=>r.throw(v)),d(v),s||r.assign(p,!1)}),e.ok(p)}function u(){e.result((0,$5.callValidateCode)(e,t,c),()=>h(t),()=>d(t))}function d(p){const v=(0,Rt._)`${p}.errors`;r.assign(zo.default.vErrors,(0,Rt._)`${zo.default.vErrors} === null ? ${v} : ${zo.default.vErrors}.concat(${v})`),r.assign(zo.default.errors,(0,Rt._)`${zo.default.vErrors}.length`)}function h(p){var v;if(!i.opts.unevaluated)return;const y=(v=n==null?void 0:n.validate)===null||v===void 0?void 0:v.evaluated;if(i.props!==!0)if(y&&!y.dynamicProps)y.props!==void 0&&(i.props=ks.mergeEvaluated.props(r,y.props,i.props));else{const g=r.var("props",(0,Rt._)`${p}.evaluated.props`);i.props=ks.mergeEvaluated.props(r,g,i.props,Rt.Name)}if(i.items!==!0)if(y&&!y.dynamicItems)y.items!==void 0&&(i.items=ks.mergeEvaluated.items(r,y.items,i.items));else{const g=r.var("items",(0,Rt._)`${p}.evaluated.items`);i.items=ks.mergeEvaluated.items(r,g,i.items,Rt.Name)}}}ro.callRef=Is,ro.default=kI,Object.defineProperty(W2,"__esModule",{value:!0});const II=G2,BI=ro,LI=["$schema","$id","$defs","$vocabulary",{keyword:"$comment"},"definitions",II.default,BI.default];W2.default=LI;var K2={},q2={};Object.defineProperty(q2,"__esModule",{value:!0});const Bs=Ae,$r=Bs.operators,Ls={maximum:{okStr:"<=",ok:$r.LTE,fail:$r.GT},minimum:{okStr:">=",ok:$r.GTE,fail:$r.LT},exclusiveMaximum:{okStr:"<",ok:$r.LT,fail:$r.GTE},exclusiveMinimum:{okStr:">",ok:$r.GT,fail:$r.LTE}},RI={message:({keyword:e,schemaCode:t})=>(0,Bs.str)`must be ${Ls[e].okStr} ${t}`,params:({keyword:e,schemaCode:t})=>(0,Bs._)`{comparison: ${Ls[e].okStr}, limit: ${t}}`},VI={keyword:Object.keys(Ls),type:"number",schemaType:"number",$data:!0,error:RI,code(e){const{keyword:t,data:n,schemaCode:o}=e;e.fail$data((0,Bs._)`${n} ${Ls[t].fail} ${o} || isNaN(${n})`)}};q2.default=VI;var Y2={};Object.defineProperty(Y2,"__esModule",{value:!0});const W1=Ae,HI={keyword:"multipleOf",type:"number",schemaType:"number",$data:!0,error:{message:({schemaCode:e})=>(0,W1.str)`must be multiple of ${e}`,params:({schemaCode:e})=>(0,W1._)`{multipleOf: ${e}}`},code(e){const{gen:t,data:n,schemaCode:o,it:r}=e,i=r.opts.multipleOfPrecision,s=t.let("res"),l=i?(0,W1._)`Math.abs(Math.round(${s}) - ${s}) > 1e-${i}`:(0,W1._)`${s} !== parseInt(${s})`;e.fail$data((0,W1._)`(${o} === 0 || (${s} = ${n}/${o}, ${l}))`)}};Y2.default=HI;var Z2={},J2={};Object.defineProperty(J2,"__esModule",{value:!0});function S5(e){const t=e.length;let n=0,o=0,r;for(;o<t;)n++,r=e.charCodeAt(o++),r>=55296&&r<=56319&&o<t&&(r=e.charCodeAt(o),(r&64512)===56320&&o++);return n}J2.default=S5,S5.code='require("ajv/dist/runtime/ucs2length").default',Object.defineProperty(Z2,"__esModule",{value:!0});const oo=Ae,UI=Re,WI=J2,GI={keyword:["maxLength","minLength"],type:"string",schemaType:"number",$data:!0,error:{message({keyword:e,schemaCode:t}){const n=e==="maxLength"?"more":"fewer";return(0,oo.str)`must NOT have ${n} than ${t} characters`},params:({schemaCode:e})=>(0,oo._)`{limit: ${e}}`},code(e){const{keyword:t,data:n,schemaCode:o,it:r}=e,i=t==="maxLength"?oo.operators.GT:oo.operators.LT,s=r.opts.unicode===!1?(0,oo._)`${n}.length`:(0,oo._)`${(0,UI.useFunc)(e.gen,WI.default)}(${n})`;e.fail$data((0,oo._)`${s} ${i} ${o}`)}};Z2.default=GI;var X2={};Object.defineProperty(X2,"__esModule",{value:!0});const KI=ze,Rs=Ae,qI={keyword:"pattern",type:"string",schemaType:"string",$data:!0,error:{message:({schemaCode:e})=>(0,Rs.str)`must match pattern "${e}"`,params:({schemaCode:e})=>(0,Rs._)`{pattern: ${e}}`},code(e){const{data:t,$data:n,schema:o,schemaCode:r,it:i}=e,s=i.opts.unicodeRegExp?"u":"",l=n?(0,Rs._)`(new RegExp(${r}, ${s}))`:(0,KI.usePattern)(e,o);e.fail$data((0,Rs._)`!${l}.test(${t})`)}};X2.default=qI;var Q2={};Object.defineProperty(Q2,"__esModule",{value:!0});const G1=Ae,YI={keyword:["maxProperties","minProperties"],type:"object",schemaType:"number",$data:!0,error:{message({keyword:e,schemaCode:t}){const n=e==="maxProperties"?"more":"fewer";return(0,G1.str)`must NOT have ${n} than ${t} properties`},params:({schemaCode:e})=>(0,G1._)`{limit: ${e}}`},code(e){const{keyword:t,data:n,schemaCode:o}=e,r=t==="maxProperties"?G1.operators.GT:G1.operators.LT;e.fail$data((0,G1._)`Object.keys(${n}).length ${r} ${o}`)}};Q2.default=YI;var ec={};Object.defineProperty(ec,"__esModule",{value:!0});const K1=ze,q1=Ae,ZI=Re,JI={keyword:"required",type:"object",schemaType:"array",$data:!0,error:{message:({params:{missingProperty:e}})=>(0,q1.str)`must have required property '${e}'`,params:({params:{missingProperty:e}})=>(0,q1._)`{missingProperty: ${e}}`},code(e){const{gen:t,schema:n,schemaCode:o,data:r,$data:i,it:s}=e,{opts:l}=s;if(!i&&n.length===0)return;const a=n.length>=l.loopRequired;if(s.allErrors?c():f(),l.strictRequired){const h=e.parentSchema.properties,{definedProperties:p}=e.it;for(const v of n)if((h==null?void 0:h[v])===void 0&&!p.has(v)){const y=s.schemaEnv.baseId+s.errSchemaPath,g=`required property "${v}" is not defined at "${y}" (strictRequired)`;(0,ZI.checkStrictMode)(s,g,s.opts.strictRequired)}}function c(){if(a||i)e.block$data(q1.nil,u);else for(const h of n)(0,K1.checkReportMissingProp)(e,h)}function f(){const h=t.let("missing");if(a||i){const p=t.let("valid",!0);e.block$data(p,()=>d(h,p)),e.ok(p)}else t.if((0,K1.checkMissingProp)(e,n,h)),(0,K1.reportMissingProp)(e,h),t.else()}function u(){t.forOf("prop",o,h=>{e.setParams({missingProperty:h}),t.if((0,K1.noPropertyInData)(t,r,h,l.ownProperties),()=>e.error())})}function d(h,p){e.setParams({missingProperty:h}),t.forOf(h,o,()=>{t.assign(p,(0,K1.propertyInData)(t,r,h,l.ownProperties)),t.if((0,q1.not)(p),()=>{e.error(),t.break()})},q1.nil)}}};ec.default=JI;var tc={};Object.defineProperty(tc,"__esModule",{value:!0});const Y1=Ae,XI={keyword:["maxItems","minItems"],type:"array",schemaType:"number",$data:!0,error:{message({keyword:e,schemaCode:t}){const n=e==="maxItems"?"more":"fewer";return(0,Y1.str)`must NOT have ${n} than ${t} items`},params:({schemaCode:e})=>(0,Y1._)`{limit: ${e}}`},code(e){const{keyword:t,data:n,schemaCode:o}=e,r=t==="maxItems"?Y1.operators.GT:Y1.operators.LT;e.fail$data((0,Y1._)`${n}.length ${r} ${o}`)}};tc.default=XI;var nc={},Z1={};Object.defineProperty(Z1,"__esModule",{value:!0});const E5=e5;E5.code='require("ajv/dist/runtime/equal").default',Z1.default=E5,Object.defineProperty(nc,"__esModule",{value:!0});const rc=L1,$t=Ae,QI=Re,eB=Z1,tB={keyword:"uniqueItems",type:"array",schemaType:"boolean",$data:!0,error:{message:({params:{i:e,j:t}})=>(0,$t.str)`must NOT have duplicate items (items ## ${t} and ${e} are identical)`,params:({params:{i:e,j:t}})=>(0,$t._)`{i: ${e}, j: ${t}}`},code(e){const{gen:t,data:n,$data:o,schema:r,parentSchema:i,schemaCode:s,it:l}=e;if(!o&&!r)return;const a=t.let("valid"),c=i.items?(0,rc.getSchemaTypes)(i.items):[];e.block$data(a,f,(0,$t._)`${s} === false`),e.ok(a);function f(){const p=t.let("i",(0,$t._)`${n}.length`),v=t.let("j");e.setParams({i:p,j:v}),t.assign(a,!0),t.if((0,$t._)`${p} > 1`,()=>(u()?d:h)(p,v))}function u(){return c.length>0&&!c.some(p=>p==="object"||p==="array")}function d(p,v){const y=t.name("item"),g=(0,rc.checkDataTypes)(c,y,l.opts.strictNumbers,rc.DataType.Wrong),w=t.const("indices",(0,$t._)`{}`);t.for((0,$t._)`;${p}--;`,()=>{t.let(y,(0,$t._)`${n}[${p}]`),t.if(g,(0,$t._)`continue`),c.length>1&&t.if((0,$t._)`typeof ${y} == "string"`,(0,$t._)`${y} += "_"`),t.if((0,$t._)`typeof ${w}[${y}] == "number"`,()=>{t.assign(v,(0,$t._)`${w}[${y}]`),e.error(),t.assign(a,!1).break()}).code((0,$t._)`${w}[${y}] = ${p}`)})}function h(p,v){const y=(0,QI.useFunc)(t,eB.default),g=t.name("outer");t.label(g).for((0,$t._)`;${p}--;`,()=>t.for((0,$t._)`${v} = ${p}; ${v}--;`,()=>t.if((0,$t._)`${y}(${n}[${p}], ${n}[${v}])`,()=>{e.error(),t.assign(a,!1).break(g)})))}}};nc.default=tB;var oc={};Object.defineProperty(oc,"__esModule",{value:!0});const ic=Ae,nB=Re,rB=Z1,oB={keyword:"const",$data:!0,error:{message:"must be equal to constant",params:({schemaCode:e})=>(0,ic._)`{allowedValue: ${e}}`},code(e){const{gen:t,data:n,$data:o,schemaCode:r,schema:i}=e;o||i&&typeof i=="object"?e.fail$data((0,ic._)`!${(0,nB.useFunc)(t,rB.default)}(${n}, ${r})`):e.fail((0,ic._)`${i} !== ${n}`)}};oc.default=oB;var sc={};Object.defineProperty(sc,"__esModule",{value:!0});const J1=Ae,iB=Re,sB=Z1,lB={keyword:"enum",schemaType:"array",$data:!0,error:{message:"must be equal to one of the allowed values",params:({schemaCode:e})=>(0,J1._)`{allowedValues: ${e}}`},code(e){const{gen:t,data:n,$data:o,schema:r,schemaCode:i,it:s}=e;if(!o&&r.length===0)throw new Error("enum must have non-empty array");const l=r.length>=s.opts.loopEnum;let a;const c=()=>a??(a=(0,iB.useFunc)(t,sB.default));let f;if(l||o)f=t.let("valid"),e.block$data(f,u);else{if(!Array.isArray(r))throw new Error("ajv implementation error");const h=t.const("vSchema",i);f=(0,J1.or)(...r.map((p,v)=>d(h,v)))}e.pass(f);function u(){t.assign(f,!1),t.forOf("v",i,h=>t.if((0,J1._)`${c()}(${n}, ${h})`,()=>t.assign(f,!0).break()))}function d(h,p){const v=r[p];return typeof v=="object"&&v!==null?(0,J1._)`${c()}(${n}, ${h}[${p}])`:(0,J1._)`${n} === ${v}`}}};sc.default=lB,Object.defineProperty(K2,"__esModule",{value:!0});const aB=q2,cB=Y2,fB=Z2,uB=X2,dB=Q2,hB=ec,pB=tc,gB=nc,vB=oc,mB=sc,yB=[aB.default,cB.default,fB.default,uB.default,dB.default,hB.default,pB.default,gB.default,{keyword:"type",schemaType:["string","array"]},{keyword:"nullable",schemaType:"boolean"},vB.default,mB.default];K2.default=yB;var lc={},No={};Object.defineProperty(No,"__esModule",{value:!0}),No.validateAdditionalItems=void 0;const io=Ae,ac=Re,wB={keyword:"additionalItems",type:"array",schemaType:["boolean","object"],before:"uniqueItems",error:{message:({params:{len:e}})=>(0,io.str)`must NOT have more than ${e} items`,params:({params:{len:e}})=>(0,io._)`{limit: ${e}}`},code(e){const{parentSchema:t,it:n}=e,{items:o}=t;if(!Array.isArray(o)){(0,ac.checkStrictMode)(n,'"additionalItems" is ignored when "items" is not an array of schemas');return}P5(e,o)}};function P5(e,t){const{gen:n,schema:o,data:r,keyword:i,it:s}=e;s.items=!0;const l=n.const("len",(0,io._)`${r}.length`);if(o===!1)e.setParams({len:t.length}),e.pass((0,io._)`${l} <= ${t.length}`);else if(typeof o=="object"&&!(0,ac.alwaysValidSchema)(s,o)){const c=n.var("valid",(0,io._)`${l} <= ${t.length}`);n.if((0,io.not)(c),()=>a(c)),e.ok(c)}function a(c){n.forRange("i",t.length,l,f=>{e.subschema({keyword:i,dataProp:f,dataPropType:ac.Type.Num},c),s.allErrors||n.if((0,io.not)(c),()=>n.break())})}}No.validateAdditionalItems=P5,No.default=wB;var cc={},ko={};Object.defineProperty(ko,"__esModule",{value:!0}),ko.validateTuple=void 0;const C5=Ae,Vs=Re,_B=ze,bB={keyword:"items",type:"array",schemaType:["object","array","boolean"],before:"uniqueItems",code(e){const{schema:t,it:n}=e;if(Array.isArray(t))return M5(e,"additionalItems",t);n.items=!0,!(0,Vs.alwaysValidSchema)(n,t)&&e.ok((0,_B.validateArray)(e))}};function M5(e,t,n=e.schema){const{gen:o,parentSchema:r,data:i,keyword:s,it:l}=e;f(r),l.opts.unevaluated&&n.length&&l.items!==!0&&(l.items=Vs.mergeEvaluated.items(o,n.length,l.items));const a=o.name("valid"),c=o.const("len",(0,C5._)`${i}.length`);n.forEach((u,d)=>{(0,Vs.alwaysValidSchema)(l,u)||(o.if((0,C5._)`${c} > ${d}`,()=>e.subschema({keyword:s,schemaProp:d,dataProp:d},a)),e.ok(a))});function f(u){const{opts:d,errSchemaPath:h}=l,p=n.length,v=p===u.minItems&&(p===u.maxItems||u[t]===!1);if(d.strictTuples&&!v){const y=`"${s}" is ${p}-tuple, but minItems or maxItems/${t} are not specified or different at path "${h}"`;(0,Vs.checkStrictMode)(l,y,d.strictTuples)}}}ko.validateTuple=M5,ko.default=bB,Object.defineProperty(cc,"__esModule",{value:!0});const FB=ko,$B={keyword:"prefixItems",type:"array",schemaType:["array"],before:"uniqueItems",code:e=>(0,FB.validateTuple)(e,"items")};cc.default=$B;var fc={};Object.defineProperty(fc,"__esModule",{value:!0});const D5=Ae,xB=Re,OB=ze,SB=No,EB={keyword:"items",type:"array",schemaType:["object","boolean"],before:"uniqueItems",error:{message:({params:{len:e}})=>(0,D5.str)`must NOT have more than ${e} items`,params:({params:{len:e}})=>(0,D5._)`{limit: ${e}}`},code(e){const{schema:t,parentSchema:n,it:o}=e,{prefixItems:r}=n;o.items=!0,!(0,xB.alwaysValidSchema)(o,t)&&(r?(0,SB.validateAdditionalItems)(e,r):e.ok((0,OB.validateArray)(e)))}};fc.default=EB;var uc={};Object.defineProperty(uc,"__esModule",{value:!0});const Xt=Ae,Hs=Re,PB={keyword:"contains",type:"array",schemaType:["object","boolean"],before:"uniqueItems",trackErrors:!0,error:{message:({params:{min:e,max:t}})=>t===void 0?(0,Xt.str)`must contain at least ${e} valid item(s)`:(0,Xt.str)`must contain at least ${e} and no more than ${t} valid item(s)`,params:({params:{min:e,max:t}})=>t===void 0?(0,Xt._)`{minContains: ${e}}`:(0,Xt._)`{minContains: ${e}, maxContains: ${t}}`},code(e){const{gen:t,schema:n,parentSchema:o,data:r,it:i}=e;let s,l;const{minContains:a,maxContains:c}=o;i.opts.next?(s=a===void 0?1:a,l=c):s=1;const f=t.const("len",(0,Xt._)`${r}.length`);if(e.setParams({min:s,max:l}),l===void 0&&s===0){(0,Hs.checkStrictMode)(i,'"minContains" == 0 without "maxContains": "contains" keyword ignored');return}if(l!==void 0&&s>l){(0,Hs.checkStrictMode)(i,'"minContains" > "maxContains" is always invalid'),e.fail();return}if((0,Hs.alwaysValidSchema)(i,n)){let v=(0,Xt._)`${f} >= ${s}`;l!==void 0&&(v=(0,Xt._)`${v} && ${f} <= ${l}`),e.pass(v);return}i.items=!0;const u=t.name("valid");l===void 0&&s===1?h(u,()=>t.if(u,()=>t.break())):s===0?(t.let(u,!0),l!==void 0&&t.if((0,Xt._)`${r}.length > 0`,d)):(t.let(u,!1),d()),e.result(u,()=>e.reset());function d(){const v=t.name("_valid"),y=t.let("count",0);h(v,()=>t.if(v,()=>p(y)))}function h(v,y){t.forRange("i",0,f,g=>{e.subschema({keyword:"contains",dataProp:g,dataPropType:Hs.Type.Num,compositeRule:!0},v),y()})}function p(v){t.code((0,Xt._)`${v}++`),l===void 0?t.if((0,Xt._)`${v} >= ${s}`,()=>t.assign(u,!0).break()):(t.if((0,Xt._)`${v} > ${l}`,()=>t.assign(u,!1).break()),s===1?t.assign(u,!0):t.if((0,Xt._)`${v} >= ${s}`,()=>t.assign(u,!0)))}}};uc.default=PB;var A5={};(function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.validateSchemaDeps=e.validatePropertyDeps=e.error=void 0;const t=Ae,n=Re,o=ze;e.error={message:({params:{property:a,depsCount:c,deps:f}})=>{const u=c===1?"property":"properties";return(0,t.str)`must have ${u} ${f} when property ${a} is present`},params:({params:{property:a,depsCount:c,deps:f,missingProperty:u}})=>(0,t._)`{property: ${a},
    missingProperty: ${u},
    depsCount: ${c},
    deps: ${f}}`};const r={keyword:"dependencies",type:"object",schemaType:"object",error:e.error,code(a){const[c,f]=i(a);s(a,c),l(a,f)}};function i({schema:a}){const c={},f={};for(const u in a){if(u==="__proto__")continue;const d=Array.isArray(a[u])?c:f;d[u]=a[u]}return[c,f]}function s(a,c=a.schema){const{gen:f,data:u,it:d}=a;if(Object.keys(c).length===0)return;const h=f.let("missing");for(const p in c){const v=c[p];if(v.length===0)continue;const y=(0,o.propertyInData)(f,u,p,d.opts.ownProperties);a.setParams({property:p,depsCount:v.length,deps:v.join(", ")}),d.allErrors?f.if(y,()=>{for(const g of v)(0,o.checkReportMissingProp)(a,g)}):(f.if((0,t._)`${y} && (${(0,o.checkMissingProp)(a,v,h)})`),(0,o.reportMissingProp)(a,h),f.else())}}e.validatePropertyDeps=s;function l(a,c=a.schema){const{gen:f,data:u,keyword:d,it:h}=a,p=f.name("valid");for(const v in c)(0,n.alwaysValidSchema)(h,c[v])||(f.if((0,o.propertyInData)(f,u,v,h.opts.ownProperties),()=>{const y=a.subschema({keyword:d,schemaProp:v},p);a.mergeValidEvaluated(y,p)},()=>f.var(p,!0)),a.ok(p))}e.validateSchemaDeps=l,e.default=r})(A5);var dc={};Object.defineProperty(dc,"__esModule",{value:!0});const T5=Ae,CB=Re,MB={keyword:"propertyNames",type:"object",schemaType:["object","boolean"],error:{message:"property name must be valid",params:({params:e})=>(0,T5._)`{propertyName: ${e.propertyName}}`},code(e){const{gen:t,schema:n,data:o,it:r}=e;if((0,CB.alwaysValidSchema)(r,n))return;const i=t.name("valid");t.forIn("key",o,s=>{e.setParams({propertyName:s}),e.subschema({keyword:"propertyNames",data:s,dataTypes:["string"],propertyName:s,compositeRule:!0},i),t.if((0,T5.not)(i),()=>{e.error(!0),r.allErrors||t.break()})}),e.ok(i)}};dc.default=MB;var Us={};Object.defineProperty(Us,"__esModule",{value:!0});const Ws=ze,hn=Ae,DB=fn,Gs=Re,AB={keyword:"additionalProperties",type:["object"],schemaType:["boolean","object"],allowUndefined:!0,trackErrors:!0,error:{message:"must NOT have additional properties",params:({params:e})=>(0,hn._)`{additionalProperty: ${e.additionalProperty}}`},code(e){const{gen:t,schema:n,parentSchema:o,data:r,errsCount:i,it:s}=e;if(!i)throw new Error("ajv implementation error");const{allErrors:l,opts:a}=s;if(s.props=!0,a.removeAdditional!=="all"&&(0,Gs.alwaysValidSchema)(s,n))return;const c=(0,Ws.allSchemaProperties)(o.properties),f=(0,Ws.allSchemaProperties)(o.patternProperties);u(),e.ok((0,hn._)`${i} === ${DB.default.errors}`);function u(){t.forIn("key",r,y=>{!c.length&&!f.length?p(y):t.if(d(y),()=>p(y))})}function d(y){let g;if(c.length>8){const w=(0,Gs.schemaRefOrVal)(s,o.properties,"properties");g=(0,Ws.isOwnProperty)(t,w,y)}else c.length?g=(0,hn.or)(...c.map(w=>(0,hn._)`${y} === ${w}`)):g=hn.nil;return f.length&&(g=(0,hn.or)(g,...f.map(w=>(0,hn._)`${(0,Ws.usePattern)(e,w)}.test(${y})`))),(0,hn.not)(g)}function h(y){t.code((0,hn._)`delete ${r}[${y}]`)}function p(y){if(a.removeAdditional==="all"||a.removeAdditional&&n===!1){h(y);return}if(n===!1){e.setParams({additionalProperty:y}),e.error(),l||t.break();return}if(typeof n=="object"&&!(0,Gs.alwaysValidSchema)(s,n)){const g=t.name("valid");a.removeAdditional==="failing"?(v(y,g,!1),t.if((0,hn.not)(g),()=>{e.reset(),h(y)})):(v(y,g),l||t.if((0,hn.not)(g),()=>t.break()))}}function v(y,g,w){const $={keyword:"additionalProperties",dataProp:y,dataPropType:Gs.Type.Str};w===!1&&Object.assign($,{compositeRule:!0,createErrors:!1,allErrors:!1}),e.subschema($,g)}}};Us.default=AB;var hc={};Object.defineProperty(hc,"__esModule",{value:!0});const TB=Jt,j5=ze,pc=Re,z5=Us,jB={keyword:"properties",type:"object",schemaType:"object",code(e){const{gen:t,schema:n,parentSchema:o,data:r,it:i}=e;i.opts.removeAdditional==="all"&&o.additionalProperties===void 0&&z5.default.code(new TB.KeywordCxt(i,z5.default,"additionalProperties"));const s=(0,j5.allSchemaProperties)(n);for(const u of s)i.definedProperties.add(u);i.opts.unevaluated&&s.length&&i.props!==!0&&(i.props=pc.mergeEvaluated.props(t,(0,pc.toHash)(s),i.props));const l=s.filter(u=>!(0,pc.alwaysValidSchema)(i,n[u]));if(l.length===0)return;const a=t.name("valid");for(const u of l)c(u)?f(u):(t.if((0,j5.propertyInData)(t,r,u,i.opts.ownProperties)),f(u),i.allErrors||t.else().var(a,!0),t.endIf()),e.it.definedProperties.add(u),e.ok(a);function c(u){return i.opts.useDefaults&&!i.compositeRule&&n[u].default!==void 0}function f(u){e.subschema({keyword:"properties",schemaProp:u,dataProp:u},a)}}};hc.default=jB;var gc={};Object.defineProperty(gc,"__esModule",{value:!0});const N5=ze,Ks=Ae,k5=Re,I5=Re,zB={keyword:"patternProperties",type:"object",schemaType:"object",code(e){const{gen:t,schema:n,data:o,parentSchema:r,it:i}=e,{opts:s}=i,l=(0,N5.allSchemaProperties)(n),a=l.filter(v=>(0,k5.alwaysValidSchema)(i,n[v]));if(l.length===0||a.length===l.length&&(!i.opts.unevaluated||i.props===!0))return;const c=s.strictSchema&&!s.allowMatchingProperties&&r.properties,f=t.name("valid");i.props!==!0&&!(i.props instanceof Ks.Name)&&(i.props=(0,I5.evaluatedPropsToName)(t,i.props));const{props:u}=i;d();function d(){for(const v of l)c&&h(v),i.allErrors?p(v):(t.var(f,!0),p(v),t.if(f))}function h(v){for(const y in c)new RegExp(v).test(y)&&(0,k5.checkStrictMode)(i,`property ${y} matches pattern ${v} (use allowMatchingProperties)`)}function p(v){t.forIn("key",o,y=>{t.if((0,Ks._)`${(0,N5.usePattern)(e,v)}.test(${y})`,()=>{const g=a.includes(v);g||e.subschema({keyword:"patternProperties",schemaProp:v,dataProp:y,dataPropType:I5.Type.Str},f),i.opts.unevaluated&&u!==!0?t.assign((0,Ks._)`${u}[${y}]`,!0):!g&&!i.allErrors&&t.if((0,Ks.not)(f),()=>t.break())})})}}};gc.default=zB;var vc={};Object.defineProperty(vc,"__esModule",{value:!0});const NB=Re,kB={keyword:"not",schemaType:["object","boolean"],trackErrors:!0,code(e){const{gen:t,schema:n,it:o}=e;if((0,NB.alwaysValidSchema)(o,n)){e.fail();return}const r=t.name("valid");e.subschema({keyword:"not",compositeRule:!0,createErrors:!1,allErrors:!1},r),e.failResult(r,()=>e.reset(),()=>e.error())},error:{message:"must NOT be valid"}};vc.default=kB;var mc={};Object.defineProperty(mc,"__esModule",{value:!0});const IB={keyword:"anyOf",schemaType:"array",trackErrors:!0,code:ze.validateUnion,error:{message:"must match a schema in anyOf"}};mc.default=IB;var yc={};Object.defineProperty(yc,"__esModule",{value:!0});const qs=Ae,BB=Re,LB={keyword:"oneOf",schemaType:"array",trackErrors:!0,error:{message:"must match exactly one schema in oneOf",params:({params:e})=>(0,qs._)`{passingSchemas: ${e.passing}}`},code(e){const{gen:t,schema:n,parentSchema:o,it:r}=e;if(!Array.isArray(n))throw new Error("ajv implementation error");if(r.opts.discriminator&&o.discriminator)return;const i=n,s=t.let("valid",!1),l=t.let("passing",null),a=t.name("_valid");e.setParams({passing:l}),t.block(c),e.result(s,()=>e.reset(),()=>e.error(!0));function c(){i.forEach((f,u)=>{let d;(0,BB.alwaysValidSchema)(r,f)?t.var(a,!0):d=e.subschema({keyword:"oneOf",schemaProp:u,compositeRule:!0},a),u>0&&t.if((0,qs._)`${a} && ${s}`).assign(s,!1).assign(l,(0,qs._)`[${l}, ${u}]`).else(),t.if(a,()=>{t.assign(s,!0),t.assign(l,u),d&&e.mergeEvaluated(d,qs.Name)})})}}};yc.default=LB;var wc={};Object.defineProperty(wc,"__esModule",{value:!0});const RB=Re,VB={keyword:"allOf",schemaType:"array",code(e){const{gen:t,schema:n,it:o}=e;if(!Array.isArray(n))throw new Error("ajv implementation error");const r=t.name("valid");n.forEach((i,s)=>{if((0,RB.alwaysValidSchema)(o,i))return;const l=e.subschema({keyword:"allOf",schemaProp:s},r);e.ok(r),e.mergeEvaluated(l)})}};wc.default=VB;var _c={};Object.defineProperty(_c,"__esModule",{value:!0});const Ys=Ae,B5=Re,HB={keyword:"if",schemaType:["object","boolean"],trackErrors:!0,error:{message:({params:e})=>(0,Ys.str)`must match "${e.ifClause}" schema`,params:({params:e})=>(0,Ys._)`{failingKeyword: ${e.ifClause}}`},code(e){const{gen:t,parentSchema:n,it:o}=e;n.then===void 0&&n.else===void 0&&(0,B5.checkStrictMode)(o,'"if" without "then" and "else" is ignored');const r=L5(o,"then"),i=L5(o,"else");if(!r&&!i)return;const s=t.let("valid",!0),l=t.name("_valid");if(a(),e.reset(),r&&i){const f=t.let("ifClause");e.setParams({ifClause:f}),t.if(l,c("then",f),c("else",f))}else r?t.if(l,c("then")):t.if((0,Ys.not)(l),c("else"));e.pass(s,()=>e.error(!0));function a(){const f=e.subschema({keyword:"if",compositeRule:!0,createErrors:!1,allErrors:!1},l);e.mergeEvaluated(f)}function c(f,u){return()=>{const d=e.subschema({keyword:f},l);t.assign(s,l),e.mergeValidEvaluated(d,s),u?t.assign(u,(0,Ys._)`${f}`):e.setParams({ifClause:f})}}}};function L5(e,t){const n=e.schema[t];return n!==void 0&&!(0,B5.alwaysValidSchema)(e,n)}_c.default=HB;var bc={};Object.defineProperty(bc,"__esModule",{value:!0});const UB=Re,WB={keyword:["then","else"],schemaType:["object","boolean"],code({keyword:e,parentSchema:t,it:n}){t.if===void 0&&(0,UB.checkStrictMode)(n,`"${e}" without "if" is ignored`)}};bc.default=WB,Object.defineProperty(lc,"__esModule",{value:!0});const GB=No,KB=cc,qB=ko,YB=fc,ZB=uc,JB=A5,XB=dc,QB=Us,eL=hc,tL=gc,nL=vc,rL=mc,oL=yc,iL=wc,sL=_c,lL=bc;function aL(e=!1){const t=[nL.default,rL.default,oL.default,iL.default,sL.default,lL.default,XB.default,QB.default,JB.default,eL.default,tL.default];return e?t.push(KB.default,YB.default):t.push(GB.default,qB.default),t.push(ZB.default),t}lc.default=aL;var Fc={},$c={};Object.defineProperty($c,"__esModule",{value:!0});const ct=Ae,cL={keyword:"format",type:["number","string"],schemaType:"string",$data:!0,error:{message:({schemaCode:e})=>(0,ct.str)`must match format "${e}"`,params:({schemaCode:e})=>(0,ct._)`{format: ${e}}`},code(e,t){const{gen:n,data:o,$data:r,schema:i,schemaCode:s,it:l}=e,{opts:a,errSchemaPath:c,schemaEnv:f,self:u}=l;if(!a.validateFormats)return;r?d():h();function d(){const p=n.scopeValue("formats",{ref:u.formats,code:a.code.formats}),v=n.const("fDef",(0,ct._)`${p}[${s}]`),y=n.let("fType"),g=n.let("format");n.if((0,ct._)`typeof ${v} == "object" && !(${v} instanceof RegExp)`,()=>n.assign(y,(0,ct._)`${v}.type || "string"`).assign(g,(0,ct._)`${v}.validate`),()=>n.assign(y,(0,ct._)`"string"`).assign(g,v)),e.fail$data((0,ct.or)(w(),$()));function w(){return a.strictSchema===!1?ct.nil:(0,ct._)`${s} && !${g}`}function $(){const O=f.$async?(0,ct._)`(${v}.async ? await ${g}(${o}) : ${g}(${o}))`:(0,ct._)`${g}(${o})`,T=(0,ct._)`(typeof ${g} == "function" ? ${O} : ${g}.test(${o}))`;return(0,ct._)`${g} && ${g} !== true && ${y} === ${t} && !${T}`}}function h(){const p=u.formats[i];if(!p){w();return}if(p===!0)return;const[v,y,g]=$(p);v===t&&e.pass(O());function w(){if(a.strictSchema===!1){u.logger.warn(T());return}throw new Error(T());function T(){return`unknown format "${i}" ignored in schema at path "${c}"`}}function $(T){const S=T instanceof RegExp?(0,ct.regexpCode)(T):a.code.formats?(0,ct._)`${a.code.formats}${(0,ct.getProperty)(i)}`:void 0,x=n.scopeValue("formats",{key:i,ref:T,code:S});return typeof T=="object"&&!(T instanceof RegExp)?[T.type||"string",T.validate,(0,ct._)`${x}.validate`]:["string",T,x]}function O(){if(typeof p=="object"&&!(p instanceof RegExp)&&p.async){if(!f.$async)throw new Error("async format in sync schema");return(0,ct._)`await ${g}(${o})`}return typeof y=="function"?(0,ct._)`${g}(${o})`:(0,ct._)`${g}.test(${o})`}}}};$c.default=cL,Object.defineProperty(Fc,"__esModule",{value:!0});const fL=[$c.default];Fc.default=fL;var Io={};Object.defineProperty(Io,"__esModule",{value:!0}),Io.contentVocabulary=Io.metadataVocabulary=void 0,Io.metadataVocabulary=["title","description","default","deprecated","readOnly","writeOnly","examples"],Io.contentVocabulary=["contentMediaType","contentEncoding","contentSchema"],Object.defineProperty(U2,"__esModule",{value:!0});const uL=W2,dL=K2,hL=lc,pL=Fc,R5=Io,gL=[uL.default,dL.default,(0,hL.default)(),pL.default,R5.metadataVocabulary,R5.contentVocabulary];U2.default=gL;var xc={},V5={};(function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.DiscrError=void 0,function(t){t.Tag="tag",t.Mapping="mapping"}(e.DiscrError||(e.DiscrError={}))})(V5),Object.defineProperty(xc,"__esModule",{value:!0});const Bo=Ae,Oc=V5,H5=Lt,vL=Re,mL={keyword:"discriminator",type:"object",schemaType:"object",error:{message:({params:{discrError:e,tagName:t}})=>e===Oc.DiscrError.Tag?`tag "${t}" must be string`:`value of tag "${t}" must be in oneOf`,params:({params:{discrError:e,tag:t,tagName:n}})=>(0,Bo._)`{error: ${e}, tag: ${n}, tagValue: ${t}}`},code(e){const{gen:t,data:n,schema:o,parentSchema:r,it:i}=e,{oneOf:s}=r;if(!i.opts.discriminator)throw new Error("discriminator: requires discriminator option");const l=o.propertyName;if(typeof l!="string")throw new Error("discriminator: requires propertyName");if(o.mapping)throw new Error("discriminator: mapping is not supported");if(!s)throw new Error("discriminator: requires oneOf keyword");const a=t.let("valid",!1),c=t.const("tag",(0,Bo._)`${n}${(0,Bo.getProperty)(l)}`);t.if((0,Bo._)`typeof ${c} == "string"`,()=>f(),()=>e.error(!1,{discrError:Oc.DiscrError.Tag,tag:c,tagName:l})),e.ok(a);function f(){const h=d();t.if(!1);for(const p in h)t.elseIf((0,Bo._)`${c} === ${p}`),t.assign(a,u(h[p]));t.else(),e.error(!1,{discrError:Oc.DiscrError.Mapping,tag:c,tagName:l}),t.endIf()}function u(h){const p=t.name("valid"),v=e.subschema({keyword:"oneOf",schemaProp:h},p);return e.mergeEvaluated(v,Bo.Name),p}function d(){var h;const p={},v=g(r);let y=!0;for(let O=0;O<s.length;O++){let T=s[O];T!=null&&T.$ref&&!(0,vL.schemaHasRulesButRef)(T,i.self.RULES)&&(T=H5.resolveRef.call(i.self,i.schemaEnv.root,i.baseId,T==null?void 0:T.$ref),T instanceof H5.SchemaEnv&&(T=T.schema));const S=(h=T==null?void 0:T.properties)===null||h===void 0?void 0:h[l];if(typeof S!="object")throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${l}"`);y=y&&(v||g(T)),w(S,O)}if(!y)throw new Error(`discriminator: "${l}" must be required`);return p;function g({required:O}){return Array.isArray(O)&&O.includes(l)}function w(O,T){if(O.const)$(O.const,T);else if(O.enum)for(const S of O.enum)$(S,T);else throw new Error(`discriminator: "properties/${l}" must have "const" or "enum"`)}function $(O,T){if(typeof O!="string"||O in p)throw new Error(`discriminator: "${l}" values must be unique strings`);p[O]=T}}}};xc.default=mL;const yL={$schema:"http://json-schema.org/draft-07/schema#",$id:"http://json-schema.org/draft-07/schema#",title:"Core schema meta-schema",definitions:{schemaArray:{type:"array",minItems:1,items:{$ref:"#"}},nonNegativeInteger:{type:"integer",minimum:0},nonNegativeIntegerDefault0:{allOf:[{$ref:"#/definitions/nonNegativeInteger"},{default:0}]},simpleTypes:{enum:["array","boolean","integer","null","number","object","string"]},stringArray:{type:"array",items:{type:"string"},uniqueItems:!0,default:[]}},type:["object","boolean"],properties:{$id:{type:"string",format:"uri-reference"},$schema:{type:"string",format:"uri"},$ref:{type:"string",format:"uri-reference"},$comment:{type:"string"},title:{type:"string"},description:{type:"string"},default:!0,readOnly:{type:"boolean",default:!1},examples:{type:"array",items:!0},multipleOf:{type:"number",exclusiveMinimum:0},maximum:{type:"number"},exclusiveMaximum:{type:"number"},minimum:{type:"number"},exclusiveMinimum:{type:"number"},maxLength:{$ref:"#/definitions/nonNegativeInteger"},minLength:{$ref:"#/definitions/nonNegativeIntegerDefault0"},pattern:{type:"string",format:"regex"},additionalItems:{$ref:"#"},items:{anyOf:[{$ref:"#"},{$ref:"#/definitions/schemaArray"}],default:!0},maxItems:{$ref:"#/definitions/nonNegativeInteger"},minItems:{$ref:"#/definitions/nonNegativeIntegerDefault0"},uniqueItems:{type:"boolean",default:!1},contains:{$ref:"#"},maxProperties:{$ref:"#/definitions/nonNegativeInteger"},minProperties:{$ref:"#/definitions/nonNegativeIntegerDefault0"},required:{$ref:"#/definitions/stringArray"},additionalProperties:{$ref:"#"},definitions:{type:"object",additionalProperties:{$ref:"#"},default:{}},properties:{type:"object",additionalProperties:{$ref:"#"},default:{}},patternProperties:{type:"object",additionalProperties:{$ref:"#"},propertyNames:{format:"regex"},default:{}},dependencies:{type:"object",additionalProperties:{anyOf:[{$ref:"#"},{$ref:"#/definitions/stringArray"}]}},propertyNames:{$ref:"#"},const:!0,enum:{type:"array",items:!0,minItems:1,uniqueItems:!0},type:{anyOf:[{$ref:"#/definitions/simpleTypes"},{type:"array",items:{$ref:"#/definitions/simpleTypes"},minItems:1,uniqueItems:!0}]},format:{type:"string"},contentMediaType:{type:"string"},contentEncoding:{type:"string"},if:{$ref:"#"},then:{$ref:"#"},else:{$ref:"#"},allOf:{$ref:"#/definitions/schemaArray"},anyOf:{$ref:"#/definitions/schemaArray"},oneOf:{$ref:"#/definitions/schemaArray"},not:{$ref:"#"}},default:!0};(function(e,t){Object.defineProperty(t,"__esModule",{value:!0}),t.MissingRefError=t.ValidationError=t.CodeGen=t.Name=t.nil=t.stringify=t.str=t._=t.KeywordCxt=void 0;const n=U4,o=U2,r=xc,i=yL,s=["/properties"],l="http://json-schema.org/draft-07/schema";class a extends n.default{_addVocabularies(){super._addVocabularies(),o.default.forEach(p=>this.addVocabulary(p)),this.opts.discriminator&&this.addKeyword(r.default)}_addDefaultMetaSchema(){if(super._addDefaultMetaSchema(),!this.opts.meta)return;const p=this.opts.$data?this.$dataMetaSchema(i,s):i;this.addMetaSchema(p,l,!1),this.refs["http://json-schema.org/schema"]=l}defaultMeta(){return this.opts.defaultMeta=super.defaultMeta()||(this.getSchema(l)?l:void 0)}}e.exports=t=a,Object.defineProperty(t,"__esModule",{value:!0}),t.default=a;var c=Jt;Object.defineProperty(t,"KeywordCxt",{enumerable:!0,get:function(){return c.KeywordCxt}});var f=Ae;Object.defineProperty(t,"_",{enumerable:!0,get:function(){return f._}}),Object.defineProperty(t,"str",{enumerable:!0,get:function(){return f.str}}),Object.defineProperty(t,"stringify",{enumerable:!0,get:function(){return f.stringify}}),Object.defineProperty(t,"nil",{enumerable:!0,get:function(){return f.nil}}),Object.defineProperty(t,"Name",{enumerable:!0,get:function(){return f.Name}}),Object.defineProperty(t,"CodeGen",{enumerable:!0,get:function(){return f.CodeGen}});var u=H1;Object.defineProperty(t,"ValidationError",{enumerable:!0,get:function(){return u.default}});var d=U1;Object.defineProperty(t,"MissingRefError",{enumerable:!0,get:function(){return d.default}})})(M2,M2.exports);var U5=M2.exports,W5={exports:{}},G5={};(function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.formatNames=e.fastFormats=e.fullFormats=void 0;function t(V,W){return{validate:V,compare:W}}e.fullFormats={date:t(i,s),time:t(a,c),"date-time":t(u,d),duration:/^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,uri:v,"uri-reference":/^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,"uri-template":/^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,url:/^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,email:/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,hostname:/^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,ipv4:/^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,ipv6:/^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,regex:I,uuid:/^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,"json-pointer":/^(?:\/(?:[^~/]|~0|~1)*)*$/,"json-pointer-uri-fragment":/^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,"relative-json-pointer":/^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,byte:g,int32:{type:"number",validate:O},int64:{type:"number",validate:T},float:{type:"number",validate:S},double:{type:"number",validate:S},password:!0,binary:!0},e.fastFormats={...e.fullFormats,date:t(/^\d\d\d\d-[0-1]\d-[0-3]\d$/,s),time:t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,c),"date-time":t(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,d),uri:/^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,"uri-reference":/^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,email:/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i},e.formatNames=Object.keys(e.fullFormats);function n(V){return V%4===0&&(V%100!==0||V%400===0)}const o=/^(\d\d\d\d)-(\d\d)-(\d\d)$/,r=[0,31,28,31,30,31,30,31,31,30,31,30,31];function i(V){const W=o.exec(V);if(!W)return!1;const re=+W[1],K=+W[2],Ee=+W[3];return K>=1&&K<=12&&Ee>=1&&Ee<=(K===2&&n(re)?29:r[K])}function s(V,W){if(V&&W)return V>W?1:V<W?-1:0}const l=/^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;function a(V,W){const re=l.exec(V);if(!re)return!1;const K=+re[1],Ee=+re[2],de=+re[3],Ce=re[5];return(K<=23&&Ee<=59&&de<=59||K===23&&Ee===59&&de===60)&&(!W||Ce!=="")}function c(V,W){if(!(V&&W))return;const re=l.exec(V),K=l.exec(W);if(re&&K)return V=re[1]+re[2]+re[3]+(re[4]||""),W=K[1]+K[2]+K[3]+(K[4]||""),V>W?1:V<W?-1:0}const f=/t|\s/i;function u(V){const W=V.split(f);return W.length===2&&i(W[0])&&a(W[1],!0)}function d(V,W){if(!(V&&W))return;const[re,K]=V.split(f),[Ee,de]=W.split(f),Ce=s(re,Ee);if(Ce!==void 0)return Ce||c(K,de)}const h=/\/|:/,p=/^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;function v(V){return h.test(V)&&p.test(V)}const y=/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;function g(V){return y.lastIndex=0,y.test(V)}const w=-(2**31),$=2**31-1;function O(V){return Number.isInteger(V)&&V<=$&&V>=w}function T(V){return Number.isInteger(V)}function S(){return!0}const x=/[^\\]\\Z/;function I(V){if(x.test(V))return!1;try{return new RegExp(V),!0}catch{return!1}}})(G5);var K5={};(function(e){Object.defineProperty(e,"__esModule",{value:!0}),e.formatLimitDefinition=void 0;const t=U5,n=Ae,o=n.operators,r={formatMaximum:{okStr:"<=",ok:o.LTE,fail:o.GT},formatMinimum:{okStr:">=",ok:o.GTE,fail:o.LT},formatExclusiveMaximum:{okStr:"<",ok:o.LT,fail:o.GTE},formatExclusiveMinimum:{okStr:">",ok:o.GT,fail:o.LTE}},i={message:({keyword:l,schemaCode:a})=>n.str`should be ${r[l].okStr} ${a}`,params:({keyword:l,schemaCode:a})=>n._`{comparison: ${r[l].okStr}, limit: ${a}}`};e.formatLimitDefinition={keyword:Object.keys(r),type:"string",schemaType:"string",$data:!0,error:i,code(l){const{gen:a,data:c,schemaCode:f,keyword:u,it:d}=l,{opts:h,self:p}=d;if(!h.validateFormats)return;const v=new t.KeywordCxt(d,p.RULES.all.format.definition,"format");v.$data?y():g();function y(){const $=a.scopeValue("formats",{ref:p.formats,code:h.code.formats}),O=a.const("fmt",n._`${$}[${v.schemaCode}]`);l.fail$data(n.or(n._`typeof ${O} != "object"`,n._`${O} instanceof RegExp`,n._`typeof ${O}.compare != "function"`,w(O)))}function g(){const $=v.schema,O=p.formats[$];if(!O||O===!0)return;if(typeof O!="object"||O instanceof RegExp||typeof O.compare!="function")throw new Error(`"${u}": format "${$}" does not define "compare" function`);const T=a.scopeValue("formats",{key:$,ref:O,code:h.code.formats?n._`${h.code.formats}${n.getProperty($)}`:void 0});l.fail$data(w(T))}function w($){return n._`${$}.compare(${c}, ${f}) ${r[u].fail} 0`}},dependencies:["format"]};const s=l=>(l.addKeyword(e.formatLimitDefinition),l);e.default=s})(K5),function(e,t){Object.defineProperty(t,"__esModule",{value:!0});const n=G5,o=K5,r=Ae,i=new r.Name("fullFormats"),s=new r.Name("fastFormats"),l=(c,f={keywords:!0})=>{if(Array.isArray(f))return a(c,f,n.fullFormats,i),c;const[u,d]=f.mode==="fast"?[n.fastFormats,s]:[n.fullFormats,i],h=f.formats||n.formatNames;return a(c,h,u,d),f.keywords&&o.default(c),c};l.get=(c,f="full")=>{const d=(f==="fast"?n.fastFormats:n.fullFormats)[c];if(!d)throw new Error(`Unknown format "${c}"`);return d};function a(c,f,u,d){var h,p;(h=(p=c.opts.code).formats)!==null&&h!==void 0||(p.formats=r._`require("ajv-formats/dist/formats").${d}`);for(const v of f)c.addFormat(v,u[v])}e.exports=t=l,Object.defineProperty(t,"__esModule",{value:!0}),t.default=l}(W5,W5.exports);var q5;(function(e){e.HIDE="HIDE",e.SHOW="SHOW",e.ENABLE="ENABLE",e.DISABLE="DISABLE"})(q5||(q5={}));var Dt;(function(e){e.addTooltip="addTooltip",e.addAriaLabel="addAriaLabel",e.removeTooltip="removeTooltip",e.upAriaLabel="upAriaLabel",e.downAriaLabel="downAriaLabel",e.noSelection="noSelection",e.removeAriaLabel="removeAriaLabel",e.noDataMessage="noDataMessage",e.deleteDialogTitle="deleteDialogTitle",e.deleteDialogMessage="deleteDialogMessage",e.deleteDialogAccept="deleteDialogAccept",e.deleteDialogDecline="deleteDialogDecline",e.up="up",e.down="down"})(Dt||(Dt={})),Dt.addTooltip,Dt.addAriaLabel,Dt.removeTooltip,Dt.removeAriaLabel,Dt.upAriaLabel,Dt.up,Dt.down,Dt.downAriaLabel,Dt.noDataMessage,Dt.noSelection,Dt.deleteDialogTitle,Dt.deleteDialogMessage,Dt.deleteDialogAccept,Dt.deleteDialogDecline;var Lo;(function(e){e.clearDialogTitle="clearDialogTitle",e.clearDialogMessage="clearDialogMessage",e.clearDialogAccept="clearDialogAccept",e.clearDialogDecline="clearDialogDecline"})(Lo||(Lo={})),Lo.clearDialogTitle,Lo.clearDialogMessage,Lo.clearDialogAccept,Lo.clearDialogDecline;var Y5={exports:{}};(function(e,t){Object.defineProperty(t,"__esModule",{value:!0});const n=U5,o=Ae,r=Ao,i=Jt,s=Do,l=fn,a="errorMessage",c=new n.Name("emUsed"),f={required:"missingProperty",dependencies:"property",dependentRequired:"property"},u=/\$\{[^}]+\}/,d=/\$\{([^}]+)\}/g,h=/^""\s*\+\s*|\s*\+\s*""$/g;function p(y){return{keyword:a,schemaType:["string","object"],post:!0,code(g){const{gen:w,data:$,schema:O,schemaValue:T,it:S}=g;if(S.createErrors===!1)return;const x=O,I=o.strConcat(l.default.instancePath,S.errorPath);w.if(n._`${l.default.errors} > 0`,()=>{if(typeof x=="object"){const[P,m]=W(x);m&&re(m),P&&K(P),Ee(V(x))}const z=typeof x=="string"?x:x._;z&&de(z),y.keepErrors||Ce()});function V({properties:z,items:P}){const m={};if(z){m.props={};for(const _ in z)m.props[_]=[]}if(P){m.items={};for(let _=0;_<P.length;_++)m.items[_]=[]}return m}function W(z){let P,m;for(const _ in z){if(_==="properties"||_==="items")continue;const E=z[_];if(typeof E=="object"){P||(P={});const N=P[_]={};for(const k in E)N[k]=[]}else m||(m={}),m[_]=[]}return[P,m]}function re(z){const P=w.const("emErrors",n.stringify(z)),m=w.const("templates",He(z,O));w.forOf("err",l.default.vErrors,k=>w.if(be(k,P),()=>w.code(n._`${P}[${k}.keyword].push(${k})`).assign(n._`${k}.${c}`,!0)));const{singleError:_}=y;if(_){const k=w.let("message",n._`""`),q=w.let("paramsErrors",n._`[]`);E(oe=>{w.if(k,()=>w.code(n._`${k} += ${typeof _=="string"?_:";"}`)),w.code(n._`${k} += ${N(oe)}`),w.assign(q,n._`${q}.concat(${P}[${oe}])`)}),s.reportError(g,{message:k,params:n._`{errors: ${q}}`})}else E(k=>s.reportError(g,{message:N(k),params:n._`{errors: ${P}[${k}]}`}));function E(k){w.forIn("key",P,q=>w.if(n._`${P}[${q}].length`,()=>k(q)))}function N(k){return n._`${k} in ${m} ? ${m}[${k}]() : ${T}[${k}]`}}function K(z){const P=w.const("emErrors",n.stringify(z)),m=[];for(const q in z)m.push([q,He(z[q],O[q])]);const _=w.const("templates",w.object(...m)),E=w.scopeValue("obj",{ref:f,code:n.stringify(f)}),N=w.let("emPropParams"),k=w.let("emParamsErrors");w.forOf("err",l.default.vErrors,q=>w.if(be(q,P),()=>{w.assign(N,n._`${E}[${q}.keyword]`),w.assign(k,n._`${P}[${q}.keyword][${q}.params[${N}]]`),w.if(k,()=>w.code(n._`${k}.push(${q})`).assign(n._`${q}.${c}`,!0))})),w.forIn("key",P,q=>w.forIn("keyProp",n._`${P}[${q}]`,oe=>{w.assign(k,n._`${P}[${q}][${oe}]`),w.if(n._`${k}.length`,()=>{const Fe=w.const("tmpl",n._`${_}[${q}] && ${_}[${q}][${oe}]`);s.reportError(g,{message:n._`${Fe} ? ${Fe}() : ${T}[${q}][${oe}]`,params:n._`{errors: ${k}}`})})}))}function Ee(z){const{props:P,items:m}=z;if(!P&&!m)return;const _=n._`typeof ${$} == "object"`,E=n._`Array.isArray(${$})`,N=w.let("emErrors");let k,q;const oe=w.let("templates");P&&m?(k=w.let("emChildKwd"),w.if(_),w.if(E,()=>{Fe(m,O.items),w.assign(k,n.str`items`)},()=>{Fe(P,O.properties),w.assign(k,n.str`properties`)}),q=n._`[${k}]`):m?(w.if(E),Fe(m,O.items),q=n._`.items`):P&&(w.if(o.and(_,o.not(E))),Fe(P,O.properties),q=n._`.properties`),w.forOf("err",l.default.vErrors,Te=>fe(Te,N,nt=>w.code(n._`${N}[${nt}].push(${Te})`).assign(n._`${Te}.${c}`,!0))),w.forIn("key",N,Te=>w.if(n._`${N}[${Te}].length`,()=>{s.reportError(g,{message:n._`${Te} in ${oe} ? ${oe}[${Te}]() : ${T}${q}[${Te}]`,params:n._`{errors: ${N}[${Te}]}`}),w.assign(n._`${l.default.vErrors}[${l.default.errors}-1].instancePath`,n._`${I} + "/" + ${Te}.replace(/~/g, "~0").replace(/\\//g, "~1")`)})),w.endIf();function Fe(Te,nt){w.assign(N,n.stringify(Te)),w.assign(oe,He(Te,nt))}}function de(z){const P=w.const("emErrs",n._`[]`);w.forOf("err",l.default.vErrors,m=>w.if(me(m),()=>w.code(n._`${P}.push(${m})`).assign(n._`${m}.${c}`,!0))),w.if(n._`${P}.length`,()=>s.reportError(g,{message:ee(z),params:n._`{errors: ${P}}`}))}function Ce(){const z=w.const("emErrs",n._`[]`);w.forOf("err",l.default.vErrors,P=>w.if(n._`!${P}.${c}`,()=>w.code(n._`${z}.push(${P})`))),w.assign(l.default.vErrors,z).assign(l.default.errors,n._`${z}.length`)}function be(z,P){return o.and(n._`${z}.keyword !== ${a}`,n._`!${z}.${c}`,n._`${z}.instancePath === ${I}`,n._`${z}.keyword in ${P}`,n._`${z}.schemaPath.indexOf(${S.errSchemaPath}) === 0`,n._`/^\\/[^\\/]*$/.test(${z}.schemaPath.slice(${S.errSchemaPath.length}))`)}function fe(z,P,m){w.if(o.and(n._`${z}.keyword !== ${a}`,n._`!${z}.${c}`,n._`${z}.instancePath.indexOf(${I}) === 0`),()=>{const _=w.scopeValue("pattern",{ref:/^\/([^/]*)(?:\/|$)/,code:n._`new RegExp("^\\\/([^/]*)(?:\\\/|$)")`}),E=w.const("emMatches",n._`${_}.exec(${z}.instancePath.slice(${I}.length))`),N=w.const("emChild",n._`${E} && ${E}[1].replace(/~1/g, "/").replace(/~0/g, "~")`);w.if(n._`${N} !== undefined && ${N} in ${P}`,()=>m(N))})}function me(z){return o.and(n._`${z}.keyword !== ${a}`,n._`!${z}.${c}`,o.or(n._`${z}.instancePath === ${I}`,o.and(n._`${z}.instancePath.indexOf(${I}) === 0`,n._`${z}.instancePath[${I}.length] === "/"`)),n._`${z}.schemaPath.indexOf(${S.errSchemaPath}) === 0`,n._`${z}.schemaPath[${S.errSchemaPath}.length] === "/"`)}function He(z,P){const m=[];for(const _ in z){const E=P[_];u.test(E)&&m.push([_,j(E)])}return w.object(...m)}function ee(z){return u.test(z)?new r._Code(r.safeStringify(z).replace(d,(P,m)=>`" + JSON.stringify(${i.getData(m,S)}) + "`).replace(h,"")):n.stringify(z)}function j(z){return n._`function(){return ${ee(z)}}`}},metaSchema:{anyOf:[{type:"string"},{type:"object",properties:{properties:{$ref:"#/$defs/stringMap"},items:{$ref:"#/$defs/stringList"},required:{$ref:"#/$defs/stringOrMap"},dependencies:{$ref:"#/$defs/stringOrMap"}},additionalProperties:{type:"string"}}],$defs:{stringMap:{type:"object",additionalProperties:{type:"string"}},stringOrMap:{anyOf:[{type:"string"},{$ref:"#/$defs/stringMap"}]},stringList:{type:"array",items:{type:"string"}}}}}}const v=(y,g={})=>{if(!y.opts.allErrors)throw new Error("ajv-errors: Ajv option allErrors must be true");if(y.opts.jsPropertySyntax)throw new Error("ajv-errors: ajv option jsPropertySyntax is not supported");return y.addKeyword(p(g))};t.default=v,e.exports=v,e.exports.default=v})(Y5,Y5.exports);function Z5(e){var t,n,o="";if(typeof e=="string"||typeof e=="number")o+=e;else if(typeof e=="object")if(Array.isArray(e))for(t=0;t<e.length;t++)e[t]&&(n=Z5(e[t]))&&(o&&(o+=" "),o+=n);else for(t in e)e[t]&&(o&&(o+=" "),o+=t);return o}function wL(){for(var e,t,n=0,o="";n<arguments.length;)(e=arguments[n++])&&(t=Z5(e))&&(o&&(o+=" "),o+=t);return o}const J5=e=>typeof e=="boolean"?"".concat(e):e===0?"0":e,X5=wL,_t=(e,t)=>n=>{var o;if((t==null?void 0:t.variants)==null)return X5(e,n==null?void 0:n.class,n==null?void 0:n.className);const{variants:r,defaultVariants:i}=t,s=Object.keys(r).map(c=>{const f=n==null?void 0:n[c],u=i==null?void 0:i[c];if(f===null)return null;const d=J5(f)||J5(u);return r[c][d]}),l=n&&Object.entries(n).reduce((c,f)=>{let[u,d]=f;return d===void 0||(c[u]=d),c},{}),a=t==null||(o=t.compoundVariants)===null||o===void 0?void 0:o.reduce((c,f)=>{let{class:u,className:d,...h}=f;return Object.entries(h).every(p=>{let[v,y]=p;return Array.isArray(y)?y.includes({...i,...l}[v]):{...i,...l}[v]===y})?[...c,u,d]:c},[]);return X5(e,s,a,n==null?void 0:n.class,n==null?void 0:n.className)},_L={button:{root:_t("focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-md border text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:!opacity-50",{variants:{variant:{flat:"border-transparent hover:bg-opacity-90",outline:"bg-opacity-0 hover:border-opacity-80 hover:text-opacity-80",ghost:"border-transparent bg-opacity-0 hover:bg-opacity-90",link:"border-transparent bg-transparent underline-offset-4 hover:underline",tonal:"border border-transparent"},color:{base:"bg-base-foreground text-base-background",primary:"bg-primary text-primary-foreground",secondary:"bg-secondary text-secondary-foreground",accent:"bg-accent text-accent-foreground",promotion:"bg-promotion text-promotion-foreground",destructive:"bg-error text-error-foreground",success:"bg-success text-success-foreground",info:"bg-info text-info-foreground",error:"bg-error text-error-foreground",warning:"bg-warning text-warning-foreground"},size:{md:"h-10 gap-x-2 px-4 py-1",xs:"h-7 gap-x-1 px-2 py-1",sm:"h-9 gap-x-2 px-3 py-1",lg:"h-11 gap-x-2 px-8 py-1",icon:"h-10 w-10 gap-x-2 px-2 py-1 "},block:{true:"w-full basis-full"}},compoundVariants:[{color:"base",variant:"outline",class:"border-base-foreground text-base-foreground"},{color:"primary",variant:"outline",class:"border-primary text-primary"},{color:"secondary",variant:"outline",class:"border-secondary text-secondary"},{color:"accent",variant:"outline",class:"border-accent text-accent"},{color:"promotion",variant:"outline",class:"border-promotion text-promotion"},{color:"destructive",variant:"outline",class:"border-error text-error"},{color:"success",variant:"outline",class:"border-success text-success"},{color:"info",variant:"outline",class:"border-info text-info"},{color:"error",variant:"outline",class:"border-error text-error"},{color:"warning",variant:"outline",class:"border-warning text-warning"},{color:"base",variant:"tonal",class:"bg-base-200 text-base-foreground hover:bg-base-300"},{color:"primary",variant:"tonal",class:"bg-primary-50 text-primary hover:bg-primary-100"},{color:"secondary",variant:"tonal",class:"bg-secondary-50 text-secondary hover:bg-secondary-100"},{color:"accent",variant:"tonal",class:"bg-accent-50 text-accent hover:bg-accent-100"},{color:"promotion",variant:"tonal",class:"bg-promotion-50 text-promotion hover:bg-promotion-100"},{color:"destructive",variant:"tonal",class:"bg-error-50 text-error hover:bg-error-100"},{color:"success",variant:"tonal",class:"bg-success-50 text-success hover:bg-success-100"},{color:"info",variant:"tonal",class:"bg-info-50 text-info hover:bg-info-100"},{color:"error",variant:"tonal",class:"bg-error-50 text-error hover:bg-error-100"},{color:"warning",variant:"tonal",class:"bg-warning-50 text-warning hover:bg-warning-100"},{color:"base",variant:"ghost",class:"bg-base-200 text-base-foreground"},{color:"primary",variant:"ghost",class:"bg-primary-50 text-primary"},{color:"secondary",variant:"ghost",class:"bg-secondary-50 text-secondary"},{color:"accent",variant:"ghost",class:"bg-accent-50 text-accent"},{color:"promotion",variant:"ghost",class:"bg-promotion-50 text-promotion"},{color:"destructive",variant:"ghost",class:"bg-error-50 text-error"},{color:"success",variant:"ghost",class:"bg-success-50 text-success"},{color:"info",variant:"ghost",class:"bg-info-50 text-info"},{color:"error",variant:"ghost",class:"bg-error-50 text-error"},{color:"warning",variant:"ghost",class:"bg-warning-50 text-warning"},{color:"base",variant:"link",class:"bg-transparent text-base-foreground"},{color:"primary",variant:"link",class:"bg-transparent text-primary"},{color:"secondary",variant:"link",class:"bg-transparent text-secondary"},{color:"accent",variant:"link",class:"bg-transparent text-accent"},{color:"promotion",variant:"link",class:"bg-transparent text-promotion"},{color:"destructive",variant:"link",class:"bg-transparent text-error"},{color:"success",variant:"link",class:"bg-transparent text-success"},{color:"info",variant:"link",class:"bg-transparent text-info"},{color:"error",variant:"link",class:"bg-transparent text-error"},{color:"warning",variant:"link",class:"bg-transparent text-warning"}],defaultVariants:{variant:"flat",color:"base",size:"md"}}),label:_t("truncate")}},bL=ve({name:"UwButton",components:{Primitive:Pt},props:{as:{type:String,default:"button"},asChild:{type:Boolean},label:{type:String},color:{type:String},variant:{type:String},size:{type:String},upwindConfig:{type:Object},block:{type:Boolean},disabled:{type:Boolean},loading:{type:Boolean}},setup(e){return{styles:cn("button",At(e),_L,e.upwindConfig),globalStyles:ma}}}),Kt=(e,t)=>{const n=e.__vccOpts||e;for(const[o,r]of t)n[o]=r;return n},FL=["href"];function $L(e,t,n,o,r,i){const s=Ge("primitive");return ae(),ur(Et,null,[rn("link",{rel:"stylesheet",href:e.globalStyles},null,8,FL),Be(s,{as:e.as,"as-child":e.asChild,class:it(e.styles.button.root),disabled:e.disabled},{default:se(()=>[ue(e.$slots,"prepend"),ue(e.$slots,"default",{},()=>[rn("span",{class:it(e.styles.button.label)},rr(e.label),3)]),ue(e.$slots,"append")]),_:3},8,["as","as-child","class","disabled"])],64)}const xL=g1(Kt(bL,[["render",$L]])),OL={icon:{root:_t("inline-flex flex-shrink-0 align-middle [&>svg]:h-full [&>svg]:w-full",{variants:{size:{xs:"size-6",sm:"size-8",md:"size-10",lg:"size-12",xl:"size-14","2xl":"size-16"}},defaultVariants:{size:"none"}})}},SL=ve({name:"UpwIcon",props:{size:{type:String,default:"auto",validator:e=>["auto","xs","sm","md","lg","xl","2xl"].includes(e)},icon:{type:[String,Object],required:!0},upwindConfig:{type:Object,default:null}},setup(e){const t=cn("icon",At(e),OL,e.upwindConfig),n=Object.assign({"/src/assets/icons/alert-circle.svg":()=>Promise.resolve().then(()=>mR).then(r=>r.default),"/src/assets/icons/alert-triangle.svg":()=>Promise.resolve().then(()=>yR).then(r=>r.default),"/src/assets/icons/arrow-down.svg":()=>Promise.resolve().then(()=>wR).then(r=>r.default),"/src/assets/icons/arrow-left.svg":()=>Promise.resolve().then(()=>_R).then(r=>r.default),"/src/assets/icons/arrow-right.svg":()=>Promise.resolve().then(()=>bR).then(r=>r.default),"/src/assets/icons/arrow-up-down.svg":()=>Promise.resolve().then(()=>FR).then(r=>r.default),"/src/assets/icons/arrow-up.svg":()=>Promise.resolve().then(()=>$R).then(r=>r.default),"/src/assets/icons/available.svg":()=>Promise.resolve().then(()=>xR).then(r=>r.default),"/src/assets/icons/check-circle-solid.svg":()=>Promise.resolve().then(()=>OR).then(r=>r.default),"/src/assets/icons/check-circle.svg":()=>Promise.resolve().then(()=>SR).then(r=>r.default),"/src/assets/icons/check-square.svg":()=>Promise.resolve().then(()=>ER).then(r=>r.default),"/src/assets/icons/check.svg":()=>Promise.resolve().then(()=>PR).then(r=>r.default),"/src/assets/icons/close-circle.svg":()=>Promise.resolve().then(()=>CR).then(r=>r.default),"/src/assets/icons/close.svg":()=>Promise.resolve().then(()=>MR).then(r=>r.default),"/src/assets/icons/code.svg":()=>Promise.resolve().then(()=>DR).then(r=>r.default),"/src/assets/icons/dot.svg":()=>Promise.resolve().then(()=>AR).then(r=>r.default),"/src/assets/icons/edit.svg":()=>Promise.resolve().then(()=>TR).then(r=>r.default),"/src/assets/icons/email-check.svg":()=>Promise.resolve().then(()=>jR).then(r=>r.default),"/src/assets/icons/email-warning.svg":()=>Promise.resolve().then(()=>zR).then(r=>r.default),"/src/assets/icons/email.svg":()=>Promise.resolve().then(()=>NR).then(r=>r.default),"/src/assets/icons/flags/GE-AB.svg":()=>Promise.resolve().then(()=>kR).then(r=>r.default),"/src/assets/icons/flags/GE-OS.svg":()=>Promise.resolve().then(()=>IR).then(r=>r.default),"/src/assets/icons/flags/IC.svg":()=>Promise.resolve().then(()=>BR).then(r=>r.default),"/src/assets/icons/flags/TA.svg":()=>Promise.resolve().then(()=>LR).then(r=>r.default),"/src/assets/icons/flags/ac.svg":()=>Promise.resolve().then(()=>RR).then(r=>r.default),"/src/assets/icons/flags/ad.svg":()=>Promise.resolve().then(()=>VR).then(r=>r.default),"/src/assets/icons/flags/ae.svg":()=>Promise.resolve().then(()=>HR).then(r=>r.default),"/src/assets/icons/flags/af.svg":()=>Promise.resolve().then(()=>UR).then(r=>r.default),"/src/assets/icons/flags/ag.svg":()=>Promise.resolve().then(()=>WR).then(r=>r.default),"/src/assets/icons/flags/ai.svg":()=>Promise.resolve().then(()=>GR).then(r=>r.default),"/src/assets/icons/flags/al.svg":()=>Promise.resolve().then(()=>KR).then(r=>r.default),"/src/assets/icons/flags/am.svg":()=>Promise.resolve().then(()=>qR).then(r=>r.default),"/src/assets/icons/flags/ao.svg":()=>Promise.resolve().then(()=>YR).then(r=>r.default),"/src/assets/icons/flags/aq.svg":()=>Promise.resolve().then(()=>ZR).then(r=>r.default),"/src/assets/icons/flags/ar.svg":()=>Promise.resolve().then(()=>JR).then(r=>r.default),"/src/assets/icons/flags/as.svg":()=>Promise.resolve().then(()=>XR).then(r=>r.default),"/src/assets/icons/flags/at.svg":()=>Promise.resolve().then(()=>QR).then(r=>r.default),"/src/assets/icons/flags/au.svg":()=>Promise.resolve().then(()=>eV).then(r=>r.default),"/src/assets/icons/flags/aw.svg":()=>Promise.resolve().then(()=>tV).then(r=>r.default),"/src/assets/icons/flags/ax.svg":()=>Promise.resolve().then(()=>nV).then(r=>r.default),"/src/assets/icons/flags/az.svg":()=>Promise.resolve().then(()=>rV).then(r=>r.default),"/src/assets/icons/flags/ba.svg":()=>Promise.resolve().then(()=>oV).then(r=>r.default),"/src/assets/icons/flags/bb.svg":()=>Promise.resolve().then(()=>iV).then(r=>r.default),"/src/assets/icons/flags/bd.svg":()=>Promise.resolve().then(()=>sV).then(r=>r.default),"/src/assets/icons/flags/be.svg":()=>Promise.resolve().then(()=>lV).then(r=>r.default),"/src/assets/icons/flags/bf.svg":()=>Promise.resolve().then(()=>aV).then(r=>r.default),"/src/assets/icons/flags/bg.svg":()=>Promise.resolve().then(()=>cV).then(r=>r.default),"/src/assets/icons/flags/bh.svg":()=>Promise.resolve().then(()=>fV).then(r=>r.default),"/src/assets/icons/flags/bi.svg":()=>Promise.resolve().then(()=>uV).then(r=>r.default),"/src/assets/icons/flags/bj.svg":()=>Promise.resolve().then(()=>dV).then(r=>r.default),"/src/assets/icons/flags/bl.svg":()=>Promise.resolve().then(()=>hV).then(r=>r.default),"/src/assets/icons/flags/bm.svg":()=>Promise.resolve().then(()=>pV).then(r=>r.default),"/src/assets/icons/flags/bn.svg":()=>Promise.resolve().then(()=>gV).then(r=>r.default),"/src/assets/icons/flags/bo.svg":()=>Promise.resolve().then(()=>vV).then(r=>r.default),"/src/assets/icons/flags/bq.svg":()=>Promise.resolve().then(()=>mV).then(r=>r.default),"/src/assets/icons/flags/br.svg":()=>Promise.resolve().then(()=>yV).then(r=>r.default),"/src/assets/icons/flags/bs.svg":()=>Promise.resolve().then(()=>wV).then(r=>r.default),"/src/assets/icons/flags/bt.svg":()=>Promise.resolve().then(()=>_V).then(r=>r.default),"/src/assets/icons/flags/bv.svg":()=>Promise.resolve().then(()=>bV).then(r=>r.default),"/src/assets/icons/flags/bw.svg":()=>Promise.resolve().then(()=>FV).then(r=>r.default),"/src/assets/icons/flags/by.svg":()=>Promise.resolve().then(()=>$V).then(r=>r.default),"/src/assets/icons/flags/bz.svg":()=>Promise.resolve().then(()=>xV).then(r=>r.default),"/src/assets/icons/flags/ca.svg":()=>Promise.resolve().then(()=>OV).then(r=>r.default),"/src/assets/icons/flags/cc.svg":()=>Promise.resolve().then(()=>SV).then(r=>r.default),"/src/assets/icons/flags/cd.svg":()=>Promise.resolve().then(()=>EV).then(r=>r.default),"/src/assets/icons/flags/cf.svg":()=>Promise.resolve().then(()=>PV).then(r=>r.default),"/src/assets/icons/flags/cg.svg":()=>Promise.resolve().then(()=>CV).then(r=>r.default),"/src/assets/icons/flags/ch.svg":()=>Promise.resolve().then(()=>MV).then(r=>r.default),"/src/assets/icons/flags/ci.svg":()=>Promise.resolve().then(()=>DV).then(r=>r.default),"/src/assets/icons/flags/ck.svg":()=>Promise.resolve().then(()=>AV).then(r=>r.default),"/src/assets/icons/flags/cl.svg":()=>Promise.resolve().then(()=>TV).then(r=>r.default),"/src/assets/icons/flags/cm.svg":()=>Promise.resolve().then(()=>jV).then(r=>r.default),"/src/assets/icons/flags/cn.svg":()=>Promise.resolve().then(()=>zV).then(r=>r.default),"/src/assets/icons/flags/co.svg":()=>Promise.resolve().then(()=>NV).then(r=>r.default),"/src/assets/icons/flags/cr.svg":()=>Promise.resolve().then(()=>kV).then(r=>r.default),"/src/assets/icons/flags/cu.svg":()=>Promise.resolve().then(()=>IV).then(r=>r.default),"/src/assets/icons/flags/cv.svg":()=>Promise.resolve().then(()=>BV).then(r=>r.default),"/src/assets/icons/flags/cw.svg":()=>Promise.resolve().then(()=>LV).then(r=>r.default),"/src/assets/icons/flags/cx.svg":()=>Promise.resolve().then(()=>RV).then(r=>r.default),"/src/assets/icons/flags/cy.svg":()=>Promise.resolve().then(()=>VV).then(r=>r.default),"/src/assets/icons/flags/cz.svg":()=>Promise.resolve().then(()=>HV).then(r=>r.default),"/src/assets/icons/flags/de.svg":()=>Promise.resolve().then(()=>UV).then(r=>r.default),"/src/assets/icons/flags/dj.svg":()=>Promise.resolve().then(()=>WV).then(r=>r.default),"/src/assets/icons/flags/dk.svg":()=>Promise.resolve().then(()=>GV).then(r=>r.default),"/src/assets/icons/flags/dm.svg":()=>Promise.resolve().then(()=>KV).then(r=>r.default),"/src/assets/icons/flags/do.svg":()=>Promise.resolve().then(()=>qV).then(r=>r.default),"/src/assets/icons/flags/dz.svg":()=>Promise.resolve().then(()=>YV).then(r=>r.default),"/src/assets/icons/flags/ec.svg":()=>Promise.resolve().then(()=>ZV).then(r=>r.default),"/src/assets/icons/flags/ee.svg":()=>Promise.resolve().then(()=>JV).then(r=>r.default),"/src/assets/icons/flags/eg.svg":()=>Promise.resolve().then(()=>XV).then(r=>r.default),"/src/assets/icons/flags/eh.svg":()=>Promise.resolve().then(()=>QV).then(r=>r.default),"/src/assets/icons/flags/en.svg":()=>Promise.resolve().then(()=>eH).then(r=>r.default),"/src/assets/icons/flags/er.svg":()=>Promise.resolve().then(()=>tH).then(r=>r.default),"/src/assets/icons/flags/es.svg":()=>Promise.resolve().then(()=>nH).then(r=>r.default),"/src/assets/icons/flags/et.svg":()=>Promise.resolve().then(()=>rH).then(r=>r.default),"/src/assets/icons/flags/eu.svg":()=>Promise.resolve().then(()=>oH).then(r=>r.default),"/src/assets/icons/flags/fi.svg":()=>Promise.resolve().then(()=>iH).then(r=>r.default),"/src/assets/icons/flags/fj.svg":()=>Promise.resolve().then(()=>sH).then(r=>r.default),"/src/assets/icons/flags/fk.svg":()=>Promise.resolve().then(()=>lH).then(r=>r.default),"/src/assets/icons/flags/fm.svg":()=>Promise.resolve().then(()=>aH).then(r=>r.default),"/src/assets/icons/flags/fo.svg":()=>Promise.resolve().then(()=>cH).then(r=>r.default),"/src/assets/icons/flags/fr.svg":()=>Promise.resolve().then(()=>fH).then(r=>r.default),"/src/assets/icons/flags/ga.svg":()=>Promise.resolve().then(()=>uH).then(r=>r.default),"/src/assets/icons/flags/gb.svg":()=>Promise.resolve().then(()=>dH).then(r=>r.default),"/src/assets/icons/flags/gd.svg":()=>Promise.resolve().then(()=>hH).then(r=>r.default),"/src/assets/icons/flags/ge.svg":()=>Promise.resolve().then(()=>pH).then(r=>r.default),"/src/assets/icons/flags/gf.svg":()=>Promise.resolve().then(()=>gH).then(r=>r.default),"/src/assets/icons/flags/gg.svg":()=>Promise.resolve().then(()=>vH).then(r=>r.default),"/src/assets/icons/flags/gh.svg":()=>Promise.resolve().then(()=>mH).then(r=>r.default),"/src/assets/icons/flags/gi.svg":()=>Promise.resolve().then(()=>yH).then(r=>r.default),"/src/assets/icons/flags/gl.svg":()=>Promise.resolve().then(()=>wH).then(r=>r.default),"/src/assets/icons/flags/gm.svg":()=>Promise.resolve().then(()=>_H).then(r=>r.default),"/src/assets/icons/flags/gn.svg":()=>Promise.resolve().then(()=>bH).then(r=>r.default),"/src/assets/icons/flags/gp.svg":()=>Promise.resolve().then(()=>FH).then(r=>r.default),"/src/assets/icons/flags/gq.svg":()=>Promise.resolve().then(()=>$H).then(r=>r.default),"/src/assets/icons/flags/gr.svg":()=>Promise.resolve().then(()=>xH).then(r=>r.default),"/src/assets/icons/flags/gs.svg":()=>Promise.resolve().then(()=>OH).then(r=>r.default),"/src/assets/icons/flags/gt.svg":()=>Promise.resolve().then(()=>SH).then(r=>r.default),"/src/assets/icons/flags/gu.svg":()=>Promise.resolve().then(()=>EH).then(r=>r.default),"/src/assets/icons/flags/gw.svg":()=>Promise.resolve().then(()=>PH).then(r=>r.default),"/src/assets/icons/flags/gy.svg":()=>Promise.resolve().then(()=>CH).then(r=>r.default),"/src/assets/icons/flags/hk.svg":()=>Promise.resolve().then(()=>MH).then(r=>r.default),"/src/assets/icons/flags/hm.svg":()=>Promise.resolve().then(()=>DH).then(r=>r.default),"/src/assets/icons/flags/hn.svg":()=>Promise.resolve().then(()=>AH).then(r=>r.default),"/src/assets/icons/flags/hr.svg":()=>Promise.resolve().then(()=>TH).then(r=>r.default),"/src/assets/icons/flags/ht.svg":()=>Promise.resolve().then(()=>jH).then(r=>r.default),"/src/assets/icons/flags/hu.svg":()=>Promise.resolve().then(()=>zH).then(r=>r.default),"/src/assets/icons/flags/id.svg":()=>Promise.resolve().then(()=>NH).then(r=>r.default),"/src/assets/icons/flags/ie.svg":()=>Promise.resolve().then(()=>kH).then(r=>r.default),"/src/assets/icons/flags/il.svg":()=>Promise.resolve().then(()=>IH).then(r=>r.default),"/src/assets/icons/flags/im.svg":()=>Promise.resolve().then(()=>BH).then(r=>r.default),"/src/assets/icons/flags/in.svg":()=>Promise.resolve().then(()=>LH).then(r=>r.default),"/src/assets/icons/flags/io.svg":()=>Promise.resolve().then(()=>RH).then(r=>r.default),"/src/assets/icons/flags/iq.svg":()=>Promise.resolve().then(()=>VH).then(r=>r.default),"/src/assets/icons/flags/ir.svg":()=>Promise.resolve().then(()=>HH).then(r=>r.default),"/src/assets/icons/flags/is.svg":()=>Promise.resolve().then(()=>UH).then(r=>r.default),"/src/assets/icons/flags/it.svg":()=>Promise.resolve().then(()=>WH).then(r=>r.default),"/src/assets/icons/flags/je.svg":()=>Promise.resolve().then(()=>GH).then(r=>r.default),"/src/assets/icons/flags/jm.svg":()=>Promise.resolve().then(()=>KH).then(r=>r.default),"/src/assets/icons/flags/jo.svg":()=>Promise.resolve().then(()=>qH).then(r=>r.default),"/src/assets/icons/flags/jp.svg":()=>Promise.resolve().then(()=>YH).then(r=>r.default),"/src/assets/icons/flags/ke.svg":()=>Promise.resolve().then(()=>ZH).then(r=>r.default),"/src/assets/icons/flags/kg.svg":()=>Promise.resolve().then(()=>JH).then(r=>r.default),"/src/assets/icons/flags/kh.svg":()=>Promise.resolve().then(()=>XH).then(r=>r.default),"/src/assets/icons/flags/ki.svg":()=>Promise.resolve().then(()=>QH).then(r=>r.default),"/src/assets/icons/flags/km.svg":()=>Promise.resolve().then(()=>eU).then(r=>r.default),"/src/assets/icons/flags/kn.svg":()=>Promise.resolve().then(()=>tU).then(r=>r.default),"/src/assets/icons/flags/kp.svg":()=>Promise.resolve().then(()=>nU).then(r=>r.default),"/src/assets/icons/flags/kr.svg":()=>Promise.resolve().then(()=>rU).then(r=>r.default),"/src/assets/icons/flags/kw.svg":()=>Promise.resolve().then(()=>oU).then(r=>r.default),"/src/assets/icons/flags/ky.svg":()=>Promise.resolve().then(()=>iU).then(r=>r.default),"/src/assets/icons/flags/kz.svg":()=>Promise.resolve().then(()=>sU).then(r=>r.default),"/src/assets/icons/flags/la.svg":()=>Promise.resolve().then(()=>lU).then(r=>r.default),"/src/assets/icons/flags/lb.svg":()=>Promise.resolve().then(()=>aU).then(r=>r.default),"/src/assets/icons/flags/lc.svg":()=>Promise.resolve().then(()=>cU).then(r=>r.default),"/src/assets/icons/flags/li.svg":()=>Promise.resolve().then(()=>fU).then(r=>r.default),"/src/assets/icons/flags/lk.svg":()=>Promise.resolve().then(()=>uU).then(r=>r.default),"/src/assets/icons/flags/lr.svg":()=>Promise.resolve().then(()=>dU).then(r=>r.default),"/src/assets/icons/flags/ls.svg":()=>Promise.resolve().then(()=>hU).then(r=>r.default),"/src/assets/icons/flags/lt.svg":()=>Promise.resolve().then(()=>pU).then(r=>r.default),"/src/assets/icons/flags/lu.svg":()=>Promise.resolve().then(()=>gU).then(r=>r.default),"/src/assets/icons/flags/lv.svg":()=>Promise.resolve().then(()=>vU).then(r=>r.default),"/src/assets/icons/flags/ly.svg":()=>Promise.resolve().then(()=>mU).then(r=>r.default),"/src/assets/icons/flags/ma.svg":()=>Promise.resolve().then(()=>yU).then(r=>r.default),"/src/assets/icons/flags/mc.svg":()=>Promise.resolve().then(()=>wU).then(r=>r.default),"/src/assets/icons/flags/md.svg":()=>Promise.resolve().then(()=>_U).then(r=>r.default),"/src/assets/icons/flags/me.svg":()=>Promise.resolve().then(()=>bU).then(r=>r.default),"/src/assets/icons/flags/mf.svg":()=>Promise.resolve().then(()=>FU).then(r=>r.default),"/src/assets/icons/flags/mg.svg":()=>Promise.resolve().then(()=>$U).then(r=>r.default),"/src/assets/icons/flags/mh.svg":()=>Promise.resolve().then(()=>xU).then(r=>r.default),"/src/assets/icons/flags/mk.svg":()=>Promise.resolve().then(()=>OU).then(r=>r.default),"/src/assets/icons/flags/ml.svg":()=>Promise.resolve().then(()=>SU).then(r=>r.default),"/src/assets/icons/flags/mm.svg":()=>Promise.resolve().then(()=>EU).then(r=>r.default),"/src/assets/icons/flags/mn.svg":()=>Promise.resolve().then(()=>PU).then(r=>r.default),"/src/assets/icons/flags/mo.svg":()=>Promise.resolve().then(()=>CU).then(r=>r.default),"/src/assets/icons/flags/mp.svg":()=>Promise.resolve().then(()=>MU).then(r=>r.default),"/src/assets/icons/flags/mq.svg":()=>Promise.resolve().then(()=>DU).then(r=>r.default),"/src/assets/icons/flags/mr.svg":()=>Promise.resolve().then(()=>AU).then(r=>r.default),"/src/assets/icons/flags/ms.svg":()=>Promise.resolve().then(()=>TU).then(r=>r.default),"/src/assets/icons/flags/mt.svg":()=>Promise.resolve().then(()=>jU).then(r=>r.default),"/src/assets/icons/flags/mu.svg":()=>Promise.resolve().then(()=>zU).then(r=>r.default),"/src/assets/icons/flags/mv.svg":()=>Promise.resolve().then(()=>NU).then(r=>r.default),"/src/assets/icons/flags/mw.svg":()=>Promise.resolve().then(()=>kU).then(r=>r.default),"/src/assets/icons/flags/mx.svg":()=>Promise.resolve().then(()=>IU).then(r=>r.default),"/src/assets/icons/flags/my.svg":()=>Promise.resolve().then(()=>BU).then(r=>r.default),"/src/assets/icons/flags/mz.svg":()=>Promise.resolve().then(()=>LU).then(r=>r.default),"/src/assets/icons/flags/na.svg":()=>Promise.resolve().then(()=>RU).then(r=>r.default),"/src/assets/icons/flags/nc.svg":()=>Promise.resolve().then(()=>VU).then(r=>r.default),"/src/assets/icons/flags/ne.svg":()=>Promise.resolve().then(()=>HU).then(r=>r.default),"/src/assets/icons/flags/nf.svg":()=>Promise.resolve().then(()=>UU).then(r=>r.default),"/src/assets/icons/flags/ng.svg":()=>Promise.resolve().then(()=>WU).then(r=>r.default),"/src/assets/icons/flags/ni.svg":()=>Promise.resolve().then(()=>GU).then(r=>r.default),"/src/assets/icons/flags/nl.svg":()=>Promise.resolve().then(()=>KU).then(r=>r.default),"/src/assets/icons/flags/no.svg":()=>Promise.resolve().then(()=>qU).then(r=>r.default),"/src/assets/icons/flags/np.svg":()=>Promise.resolve().then(()=>YU).then(r=>r.default),"/src/assets/icons/flags/nr.svg":()=>Promise.resolve().then(()=>ZU).then(r=>r.default),"/src/assets/icons/flags/nu.svg":()=>Promise.resolve().then(()=>JU).then(r=>r.default),"/src/assets/icons/flags/nz.svg":()=>Promise.resolve().then(()=>XU).then(r=>r.default),"/src/assets/icons/flags/om.svg":()=>Promise.resolve().then(()=>QU).then(r=>r.default),"/src/assets/icons/flags/pa.svg":()=>Promise.resolve().then(()=>eW).then(r=>r.default),"/src/assets/icons/flags/pe.svg":()=>Promise.resolve().then(()=>tW).then(r=>r.default),"/src/assets/icons/flags/pf.svg":()=>Promise.resolve().then(()=>nW).then(r=>r.default),"/src/assets/icons/flags/pg.svg":()=>Promise.resolve().then(()=>rW).then(r=>r.default),"/src/assets/icons/flags/ph.svg":()=>Promise.resolve().then(()=>oW).then(r=>r.default),"/src/assets/icons/flags/pk.svg":()=>Promise.resolve().then(()=>iW).then(r=>r.default),"/src/assets/icons/flags/pl.svg":()=>Promise.resolve().then(()=>sW).then(r=>r.default),"/src/assets/icons/flags/pm.svg":()=>Promise.resolve().then(()=>lW).then(r=>r.default),"/src/assets/icons/flags/pn.svg":()=>Promise.resolve().then(()=>aW).then(r=>r.default),"/src/assets/icons/flags/pr.svg":()=>Promise.resolve().then(()=>cW).then(r=>r.default),"/src/assets/icons/flags/ps.svg":()=>Promise.resolve().then(()=>fW).then(r=>r.default),"/src/assets/icons/flags/pt.svg":()=>Promise.resolve().then(()=>uW).then(r=>r.default),"/src/assets/icons/flags/pw.svg":()=>Promise.resolve().then(()=>dW).then(r=>r.default),"/src/assets/icons/flags/py.svg":()=>Promise.resolve().then(()=>hW).then(r=>r.default),"/src/assets/icons/flags/qa.svg":()=>Promise.resolve().then(()=>pW).then(r=>r.default),"/src/assets/icons/flags/re.svg":()=>Promise.resolve().then(()=>gW).then(r=>r.default),"/src/assets/icons/flags/ro.svg":()=>Promise.resolve().then(()=>vW).then(r=>r.default),"/src/assets/icons/flags/rs.svg":()=>Promise.resolve().then(()=>mW).then(r=>r.default),"/src/assets/icons/flags/ru.svg":()=>Promise.resolve().then(()=>yW).then(r=>r.default),"/src/assets/icons/flags/rw.svg":()=>Promise.resolve().then(()=>wW).then(r=>r.default),"/src/assets/icons/flags/sa.svg":()=>Promise.resolve().then(()=>_W).then(r=>r.default),"/src/assets/icons/flags/sb.svg":()=>Promise.resolve().then(()=>bW).then(r=>r.default),"/src/assets/icons/flags/sc.svg":()=>Promise.resolve().then(()=>FW).then(r=>r.default),"/src/assets/icons/flags/sd.svg":()=>Promise.resolve().then(()=>$W).then(r=>r.default),"/src/assets/icons/flags/se.svg":()=>Promise.resolve().then(()=>xW).then(r=>r.default),"/src/assets/icons/flags/sg.svg":()=>Promise.resolve().then(()=>OW).then(r=>r.default),"/src/assets/icons/flags/sh.svg":()=>Promise.resolve().then(()=>SW).then(r=>r.default),"/src/assets/icons/flags/si.svg":()=>Promise.resolve().then(()=>EW).then(r=>r.default),"/src/assets/icons/flags/sj.svg":()=>Promise.resolve().then(()=>PW).then(r=>r.default),"/src/assets/icons/flags/sk.svg":()=>Promise.resolve().then(()=>CW).then(r=>r.default),"/src/assets/icons/flags/sl.svg":()=>Promise.resolve().then(()=>MW).then(r=>r.default),"/src/assets/icons/flags/sm.svg":()=>Promise.resolve().then(()=>DW).then(r=>r.default),"/src/assets/icons/flags/sn.svg":()=>Promise.resolve().then(()=>AW).then(r=>r.default),"/src/assets/icons/flags/so.svg":()=>Promise.resolve().then(()=>TW).then(r=>r.default),"/src/assets/icons/flags/sr.svg":()=>Promise.resolve().then(()=>jW).then(r=>r.default),"/src/assets/icons/flags/ss.svg":()=>Promise.resolve().then(()=>zW).then(r=>r.default),"/src/assets/icons/flags/st.svg":()=>Promise.resolve().then(()=>NW).then(r=>r.default),"/src/assets/icons/flags/sv.svg":()=>Promise.resolve().then(()=>kW).then(r=>r.default),"/src/assets/icons/flags/sx.svg":()=>Promise.resolve().then(()=>IW).then(r=>r.default),"/src/assets/icons/flags/sy.svg":()=>Promise.resolve().then(()=>BW).then(r=>r.default),"/src/assets/icons/flags/sz.svg":()=>Promise.resolve().then(()=>LW).then(r=>r.default),"/src/assets/icons/flags/tc.svg":()=>Promise.resolve().then(()=>RW).then(r=>r.default),"/src/assets/icons/flags/td.svg":()=>Promise.resolve().then(()=>VW).then(r=>r.default),"/src/assets/icons/flags/tf.svg":()=>Promise.resolve().then(()=>HW).then(r=>r.default),"/src/assets/icons/flags/tg.svg":()=>Promise.resolve().then(()=>UW).then(r=>r.default),"/src/assets/icons/flags/th.svg":()=>Promise.resolve().then(()=>WW).then(r=>r.default),"/src/assets/icons/flags/tj.svg":()=>Promise.resolve().then(()=>GW).then(r=>r.default),"/src/assets/icons/flags/tk.svg":()=>Promise.resolve().then(()=>KW).then(r=>r.default),"/src/assets/icons/flags/tl.svg":()=>Promise.resolve().then(()=>qW).then(r=>r.default),"/src/assets/icons/flags/tm.svg":()=>Promise.resolve().then(()=>YW).then(r=>r.default),"/src/assets/icons/flags/tn.svg":()=>Promise.resolve().then(()=>ZW).then(r=>r.default),"/src/assets/icons/flags/to.svg":()=>Promise.resolve().then(()=>JW).then(r=>r.default),"/src/assets/icons/flags/tr.svg":()=>Promise.resolve().then(()=>XW).then(r=>r.default),"/src/assets/icons/flags/tt.svg":()=>Promise.resolve().then(()=>QW).then(r=>r.default),"/src/assets/icons/flags/tv.svg":()=>Promise.resolve().then(()=>eG).then(r=>r.default),"/src/assets/icons/flags/tw.svg":()=>Promise.resolve().then(()=>tG).then(r=>r.default),"/src/assets/icons/flags/tz.svg":()=>Promise.resolve().then(()=>nG).then(r=>r.default),"/src/assets/icons/flags/ua.svg":()=>Promise.resolve().then(()=>rG).then(r=>r.default),"/src/assets/icons/flags/ug.svg":()=>Promise.resolve().then(()=>oG).then(r=>r.default),"/src/assets/icons/flags/um.svg":()=>Promise.resolve().then(()=>iG).then(r=>r.default),"/src/assets/icons/flags/us.svg":()=>Promise.resolve().then(()=>sG).then(r=>r.default),"/src/assets/icons/flags/uy.svg":()=>Promise.resolve().then(()=>lG).then(r=>r.default),"/src/assets/icons/flags/uz.svg":()=>Promise.resolve().then(()=>aG).then(r=>r.default),"/src/assets/icons/flags/va.svg":()=>Promise.resolve().then(()=>cG).then(r=>r.default),"/src/assets/icons/flags/vc.svg":()=>Promise.resolve().then(()=>fG).then(r=>r.default),"/src/assets/icons/flags/ve.svg":()=>Promise.resolve().then(()=>uG).then(r=>r.default),"/src/assets/icons/flags/vg.svg":()=>Promise.resolve().then(()=>dG).then(r=>r.default),"/src/assets/icons/flags/vi.svg":()=>Promise.resolve().then(()=>hG).then(r=>r.default),"/src/assets/icons/flags/vn.svg":()=>Promise.resolve().then(()=>pG).then(r=>r.default),"/src/assets/icons/flags/vu.svg":()=>Promise.resolve().then(()=>gG).then(r=>r.default),"/src/assets/icons/flags/wf.svg":()=>Promise.resolve().then(()=>vG).then(r=>r.default),"/src/assets/icons/flags/ws.svg":()=>Promise.resolve().then(()=>mG).then(r=>r.default),"/src/assets/icons/flags/xf.svg":()=>Promise.resolve().then(()=>yG).then(r=>r.default),"/src/assets/icons/flags/xk.svg":()=>Promise.resolve().then(()=>wG).then(r=>r.default),"/src/assets/icons/flags/ye.svg":()=>Promise.resolve().then(()=>_G).then(r=>r.default),"/src/assets/icons/flags/yt.svg":()=>Promise.resolve().then(()=>bG).then(r=>r.default),"/src/assets/icons/flags/za.svg":()=>Promise.resolve().then(()=>FG).then(r=>r.default),"/src/assets/icons/flags/zm.svg":()=>Promise.resolve().then(()=>$G).then(r=>r.default),"/src/assets/icons/flags/zw.svg":()=>Promise.resolve().then(()=>xG).then(r=>r.default),"/src/assets/icons/history.svg":()=>Promise.resolve().then(()=>OG).then(r=>r.default),"/src/assets/icons/house.svg":()=>Promise.resolve().then(()=>SG).then(r=>r.default),"/src/assets/icons/information-circle-alt.svg":()=>Promise.resolve().then(()=>EG).then(r=>r.default),"/src/assets/icons/information-circle.svg":()=>Promise.resolve().then(()=>PG).then(r=>r.default),"/src/assets/icons/lock.svg":()=>Promise.resolve().then(()=>CG).then(r=>r.default),"/src/assets/icons/minus.svg":()=>Promise.resolve().then(()=>MG).then(r=>r.default),"/src/assets/icons/navigation-menu-horizontal.svg":()=>Promise.resolve().then(()=>DG).then(r=>r.default),"/src/assets/icons/navigation-menu-vertical.svg":()=>Promise.resolve().then(()=>AG).then(r=>r.default),"/src/assets/icons/navigation-menu.svg":()=>Promise.resolve().then(()=>TG).then(r=>r.default),"/src/assets/icons/plus-circle.svg":()=>Promise.resolve().then(()=>jG).then(r=>r.default),"/src/assets/icons/plus.svg":()=>Promise.resolve().then(()=>zG).then(r=>r.default),"/src/assets/icons/remove.svg":()=>Promise.resolve().then(()=>NG).then(r=>r.default),"/src/assets/icons/search.svg":()=>Promise.resolve().then(()=>kG).then(r=>r.default),"/src/assets/icons/shield-check.svg":()=>Promise.resolve().then(()=>IG).then(r=>r.default),"/src/assets/icons/shield-exclamation.svg":()=>Promise.resolve().then(()=>BG).then(r=>r.default)}),o=$e();return qt(async()=>{var l,a;const r=an(e.icon)?`${(l=e.icon)==null?void 0:l.path}/`:"",i=an(e.icon)?(a=e.icon)==null?void 0:a.name:e.icon,s=cw(n,(c,f)=>yw(f,`${r}${i}.svg`));if(!s){console.warn("icon","import not found",{icon:e.icon,icons:n}),o.value=null;return}o.value=await s().catch(c=>(console.error("icon","import error",{icon:e.icon,error:c,icons:n}),null))}),{styles:t,svg:o}}}),EL=["innerHTML","aria-label"];function PL(e,t,n,o,r,i){var s;return e.svg?(ae(),ur("i",{key:0,class:it(["icon",e.styles.icon.root]),innerHTML:e.svg,role:"img","aria-label":`${((s=e.icon)==null?void 0:s.name)||e.icon} icon`},null,10,EL)):yn("",!0)}const Q5=Kt(SL,[["render",PL]]),CL={avatar:{root:_t("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden bg-base-200 font-normal text-base-foreground",{variants:{size:{sm:"h-10 w-10 text-xs",md:"h-16 w-16 text-2xl",lg:"h-32 w-32 text-5xl"},shape:{circle:"rounded-full",square:"rounded-md"}},defaultVariants:{size:"md",shape:"circle"}}),icon:_t("m-1 h-full w-full object-cover"),caption:_t("absolute bottom-0 left-0 right-0 top-0 z-0 inline-flex items-center justify-center text-center"),image:_t("relative z-10 h-full w-full object-cover")}},ML=ve({name:"UwAvatar",components:{AvatarFallback:b7,AvatarImage:_7,AvatarRoot:y7,UpwIcon:Q5},props:{shape:{type:String,default:"circle"},size:{type:String,default:"md"},icon:{type:[String,Object],required:!0},src:{type:String},caption:{type:String},upwindConfig:{type:Object,default:()=>({})}},setup(e){return{styles:cn("avatar",At(e),CL,e.upwindConfig),globalStyles:ma}},computed:{meta(){return{hasIcon:!C1(this.icon),hasImage:!C1(this.src),hasCaption:!C1(this.caption)}}}}),DL=["href"];function AL(e,t,n,o,r,i){const s=Ge("upw-icon"),l=Ge("avatar-image"),a=Ge("avatar-fallback"),c=Ge("avatar-root");return ae(),ur(Et,null,[rn("link",{rel:"stylesheet",href:e.globalStyles},null,8,DL),Be(c,{class:it(e.styles.avatar.root)},{default:se(()=>[ue(e.$slots,"default",{},()=>[e.meta.hasIcon?(ae(),we(s,{key:0,icon:e.icon,class:it(e.styles.avatar.image)},null,8,["icon","class"])):e.meta.hasImage?(ae(),we(l,{key:1,src:e.src,alt:"avatar",class:it(e.styles.avatar.image)},null,8,["src","class"])):yn("",!0),e.meta.hasCaption?(ae(),we(a,{key:2,class:it(e.styles.avatar.caption)},{default:se(()=>[vo(rr(e.caption),1)]),_:1},8,["class"])):yn("",!0)])]),_:3},8,["class"])],64)}const TL=g1(Kt(ML,[["render",AL]])),jL={badge:{root:_t("focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",{variants:{variant:{flat:"border border-transparent",outline:"border bg-opacity-0",tonal:"border border-transparent"},color:{base:"bg-base-foreground text-base-background",primary:"bg-primary text-primary-foreground",secondary:"bg-secondary text-secondary-foreground",accent:"bg-accent text-accent-foreground",promotion:"bg-promotion text-promotion-foreground",destructive:"bg-destructive text-destructive-foreground",success:"bg-success text-success-foreground",info:"bg-info text-info-foreground",error:"bg-error text-error-foreground",warning:"bg-warning text-warning-foreground"}},compoundVariants:[{color:"base",variant:"outline",class:"border-base-foreground text-base-foreground"},{color:"primary",variant:"outline",class:"border-primary text-primary"},{color:"secondary",variant:"outline",class:"border-secondary text-secondary"},{color:"accent",variant:"outline",class:"border-accent text-accent"},{color:"promotion",variant:"outline",class:"border-promotion text-promotion"},{color:"destructive",variant:"outline",class:"border-destructive text-destructive"},{color:"success",variant:"outline",class:"border-success text-success"},{color:"info",variant:"outline",class:"border-info text-info"},{color:"error",variant:"outline",class:"border-error text-error"},{color:"warning",variant:"outline",class:"border-warning text-warning"},{color:"base",variant:"tonal",class:"bg-base-200 text-base-foreground"},{color:"primary",variant:"tonal",class:"bg-primary-50 text-primary"},{color:"secondary",variant:"tonal",class:"bg-secondary-50 text-secondary"},{color:"accent",variant:"tonal",class:"bg-accent-50 text-accent"},{color:"promotion",variant:"tonal",class:"bg-promotion-50 text-promotion"},{color:"destructive",variant:"tonal",class:"bg-destructive-50 text-destructive"},{color:"success",variant:"tonal",class:"bg-success-50 text-success"},{color:"info",variant:"tonal",class:"bg-info-50 text-info"},{color:"error",variant:"tonal",class:"bg-error-50 text-error"},{color:"warning",variant:"tonal",class:"bg-warning-50 text-warning"}],defaultVariants:{variant:"flat",color:"base"}}),label:_t("font-normal")}},zL=ve({name:"UwBadge",props:{variant:{type:String},color:{type:String,default:"base"},label:{type:String},upwindConfig:{type:Object,default:()=>({})}},setup(e){return{styles:cn("badge",At(e),jL,e.upwindConfig),globalStyles:ma}}}),NL=["href"];function kL(e,t,n,o,r,i){return ae(),ur(Et,null,[rn("link",{rel:"stylesheet",href:e.globalStyles},null,8,NL),rn("span",{class:it(e.styles.badge.root)},[ue(e.$slots,"prepend"),rn("span",{class:it(e.styles.badge.label)},[ue(e.$slots,"default",{},()=>[vo(rr(e.label),1)])],2),ue(e.$slots,"append")],2)],64)}const IL=g1(Kt(zL,[["render",kL]])),BL=ve({components:{DialogRoot:Ug},emits:["update:open"]});function LL(e,t,n,o,r,i){const s=Ge("dialog-root");return ae(),we(s,{"onUpdate:open":t[0]||(t[0]=l=>e.$emit("update:open",l))},{default:se(()=>[ue(e.$slots,"default")]),_:3})}const RL=Kt(BL,[["render",LL]]),VL=ve({components:{DialogTrigger:Wg}});function HL(e,t,n,o,r,i){const s=Ge("dialog-trigger",!0);return ae(),we(s,null,{default:se(()=>[ue(e.$slots,"default")]),_:3})}const UL=Kt(VL,[["render",HL]]),Ro={dialog:{content:_t("border-border relative z-50 my-8 grid w-full gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full",{variants:{size:{sm:"max-w-sm",md:"max-w-md",lg:"max-w-lg",xl:"max-w-xl","2xl":"max-w-2xl","3xl":"max-w-3xl","4xl":"max-w-4xl",full:"max-w-full"},overflow:{auto:"overflow-auto",hidden:"overflow-hidden",visible:"overflow-visible",scroll:"overflow-scroll"}},defaultVariants:{size:"lg",overflow:"visible"}}),header:_t("flex flex-col gap-y-2 text-center sm:text-left"),title:_t("text-lg font-semibold leading-none tracking-tight"),description:_t("text-sm text-muted-foreground"),footer:_t("flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-x-2"),close:_t("absolute right-3 top-3 rounded-md p-0.5 transition-colors"),closeIcon:_t("h-3 w-3"),overlay:_t("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80")}},WL=ve({setup(e){return{styles:cn("dialog",At(e),Ro)}}});function GL(e,t,n,o,r,i){return ae(),ur("div",{class:it(e.styles.dialog.header)},[ue(e.$slots,"default")],2)}const KL=Kt(WL,[["render",GL]]),qL=ve({components:{DialogTitle:g7},setup(e){return{styles:cn("dialog",At(e),Ro)}}});function YL(e,t,n,o,r,i){const s=Ge("dialog-title",!0);return ae(),we(s,{class:it(e.styles.dialog.title)},{default:se(()=>[ue(e.$slots,"default")]),_:3},8,["class"])}const ZL=Kt(qL,[["render",YL]]),JL=ve({components:{DialogDescription:v7},props:{asChild:Boolean},setup(e){return{styles:cn("dialog",At(e),Ro)}}});function XL(e,t,n,o,r,i){const s=Ge("dialog-description",!0);return ae(),we(s,{class:it(e.styles.dialog.description),"as-child":e.asChild},{default:se(()=>[ue(e.$slots,"default")]),_:3},8,["class","as-child"])}const QL=Kt(JL,[["render",XL]]),eR=ve({components:{DialogClose:p7,DialogContent:u7,DialogOverlay:h7,DialogPortal:Gg,UpwIcon:Q5},props:{size:{type:String,default:"lg"},overflow:{type:String,default:"visible"}},emits:["update:open","openChange","escapeKeyDown","pointerDownOutside","interactOutside","close"],setup(e){const t=cn("dialog",At(e),Ro);return{handlePointerDownOutside:o=>{const r=o,i=r.detail.originalEvent.target;(r.detail.originalEvent.offsetX>i.clientWidth||r.detail.originalEvent.offsetY>i.clientHeight)&&o.preventDefault()},styles:t}}}),tR=rn("span",{class:"sr-only"},"Close",-1);function nR(e,t,n,o,r,i){const s=Ge("upw-icon"),l=Ge("dialog-close"),a=Ge("dialog-content"),c=Ge("dialog-overlay"),f=Ge("dialog-portal");return ae(),we(f,null,{default:se(()=>[Be(c,{class:it(e.styles.dialog.overlay)},{default:se(()=>[Be(a,{class:it(e.styles.dialog.content),onPointerDownOutside:e.handlePointerDownOutside},{default:se(()=>[ue(e.$slots,"default"),Be(l,{class:it(e.styles.dialog.close)},{default:se(()=>[Be(s,{icon:"close",class:it(e.styles.dialog.closeIcon)},null,8,["class"]),tR]),_:1},8,["class"])]),_:3},8,["class","onPointerDownOutside"])]),_:3},8,["class"])]),_:3})}const rR=Kt(eR,[["render",nR]]),oR=ve({setup(e){return{styles:cn("dialog",At(e),Ro)}}});function iR(e,t,n,o,r,i){return ae(),ur("div",{class:it(e.styles.dialog.footer)},[ue(e.$slots,"default")],2)}const sR=ve({components:{DialogRoot:RL,DialogScrollContent:rR,DialogDescription:QL,DialogFooter:Kt(oR,[["render",iR]]),DialogHeader:KL,DialogTitle:ZL,DialogTrigger:UL},props:{title:{type:String},description:{type:String},size:{type:String,default:"lg"},overflow:{type:String,default:"visible"},upwindConfig:{type:Object,default:()=>({})}},setup(e){const t=cn("dialog",At(e),Ro,e.upwindConfig);return{props:e,styles:t}}});function lR(e,t,n,o,r,i){const s=Ge("dialog-trigger"),l=Ge("dialog-title"),a=Ge("dialog-description"),c=Ge("dialog-header"),f=Ge("dialog-footer"),u=Ge("dialog-scroll-content"),d=Ge("dialog-root");return ae(),we(d,null,{default:se(()=>[Be(s,null,{default:se(()=>[ue(e.$slots,"trigger")]),_:3}),Be(u,{size:e.size,overflow:e.overflow},{default:se(()=>[e.title||e.description?(ae(),we(c,{key:0},{default:se(()=>[e.title?(ae(),we(l,{key:0},{default:se(()=>[vo(rr(e.title),1)]),_:1})):yn("",!0),e.description?(ae(),we(a,{key:1},{default:se(()=>[vo(rr(e.description),1)]),_:1})):yn("",!0)]),_:1})):yn("",!0),ue(e.$slots,"content"),ue(e.$slots,"default"),e.$slots.footer?(ae(),we(f,{key:1},{default:se(()=>[ue(e.$slots,"footer")]),_:3})):yn("",!0)]),_:3},8,["size","overflow"])]),_:3})}const aR=g1(Kt(sR,[["render",lR]])),cR=ve({__name:"Tooltip",props:{defaultOpen:{type:Boolean},open:{type:Boolean},delayDuration:{},disableHoverableContent:{type:Boolean},disableClosingTrigger:{type:Boolean},disabled:{type:Boolean},ignoreNonKeyboardFocus:{type:Boolean}},emits:["update:open"],setup(e,{emit:t}){const r=fa(e,t);return(i,s)=>(ae(),we(H(L7),uo(kr(H(r))),{default:se(()=>[ue(i.$slots,"default")]),_:3},16))}}),fR=ve({inheritAttrs:!1,__name:"TooltipContent",props:{forceMount:{type:Boolean},ariaLabel:{},asChild:{type:Boolean},as:{},side:{},sideOffset:{default:4},align:{},alignOffset:{},avoidCollisions:{type:Boolean},collisionBoundary:{},collisionPadding:{},arrowPadding:{},sticky:{},hideWhenDetached:{type:Boolean},class:{}},emits:["escapeKeyDown","pointerDownOutside"],setup(e,{emit:t}){const n=e,o=t,r=Oe(()=>{const{class:s,...l}=n;return l}),i=fa(r,o);return(s,l)=>(ae(),we(H(W7),null,{default:se(()=>[Be(H(H7),pt({...H(i),...s.$attrs},{class:n.class}),{default:se(()=>[ue(s.$slots,"default")]),_:3},16,["class"])]),_:3}))}}),uR=ve({__name:"TooltipTrigger",props:{asChild:{type:Boolean},as:{}},setup(e){const t=e;return(n,o)=>(ae(),we(H(R7),uo(kr(t)),{default:se(()=>[ue(n.$slots,"default")]),_:3},16))}}),dR=ve({__name:"TooltipProvider",props:{delayDuration:{},skipDelayDuration:{},disableHoverableContent:{type:Boolean},disableClosingTrigger:{type:Boolean},disabled:{type:Boolean},ignoreNonKeyboardFocus:{type:Boolean}},setup(e){const t=e;return(n,o)=>(ae(),we(H(I7),uo(kr(t)),{default:se(()=>[ue(n.$slots,"default")]),_:3},16))}}),hR={tooltip:{content:_t("animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded bg-base-800 px-3 py-1.5 text-sm text-white",{variants:{color:{base:"bg-base-800 text-base-50",primary:"bg-primary text-primary-foreground",secondary:"bg-secondary text-secondary-foreground",accent:"bg-accent text-accent-foreground",success:"bg-success text-success-foreground",error:"bg-error text-error-foreground",warning:"bg-warning text-warning-foreground",info:"bg-info text-info-foreground",promotion:"bg-promotion text-promotion-foreground"}}}),arrow:_t("text-base-800",{variants:{color:{base:"text-base-800",primary:"text-primary",secondary:"text-secondary",accent:"text-accent",success:"text-success",error:"text-error",warning:"text-warning",info:"text-info",promotion:"text-promotion"}}})}},pR=ve({name:"UwTooltip",components:{Tooltip:cR,TooltipContent:fR,TooltipTrigger:uR,TooltipProvider:dR,TooltipArrow:U7},props:{label:{type:String},open:{type:Boolean},direction:{type:String,default:"bottom"},color:String,delayDuration:{type:Number,default:300},sideOffset:{type:Number,default:7},upwindConfig:{type:Object,default:()=>({})}},setup(e){return{styles:cn("tooltip",At(e),hR,e.upwindConfig)}}});function gR(e,t,n,o,r,i){const s=Ge("tooltip-trigger"),l=Ge("tooltip-arrow"),a=Ge("tooltip-content"),c=Ge("tooltip"),f=Ge("tooltip-provider");return ae(),we(f,{"delay-duration":e.delayDuration},{default:se(()=>[Be(c,{open:e.open},{default:se(()=>[Be(s,null,{default:se(()=>[ue(e.$slots,"default")]),_:3}),Be(a,{side:e.direction,sideOffset:e.sideOffset,class:it(e.styles.tooltip.content)},{default:se(()=>[ue(e.$slots,"content",{},()=>[rn("div",null,rr(e.label),1)]),Be(l,{fill:"currentColor",class:it(e.styles.tooltip.arrow)},null,8,["class"])]),_:3},8,["side","sideOffset","class"])]),_:3},8,["open"])]),_:3},8,["delay-duration"])}const vR=g1(Kt(pR,[["render",gR]]));customElements.define("uw-avatar",TL),customElements.define("uw-badge",IL),customElements.define("uw-button",xL),customElements.define("uw-dialog",aR),customElements.define("uw-tooltip",vR);const mR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 21V21C7.029 21 3 16.971 3 12V12C3 7.029 7.029 3 12 3V3C16.971 3 21 7.029 21 12V12C21 16.971 16.971 21 12 21Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 12.75L12 7.75" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.001 16.75C12.139 16.75 12.251 16.638 12.25 16.5C12.25 16.362 12.138 16.25 12 16.25C11.862 16.25 11.75 16.362 11.75 16.5C11.75 16.638 11.862 16.75 12.001 16.75" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),yR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M10.2299 4.95775L2.79692 17.1217C1.98192 18.4547 2.94092 20.1647 4.50292 20.1647L19.3709 20.1647C20.9329 20.1647 21.8919 18.4547 21.0779 17.1217L13.6439 4.95775C12.8639 3.68075 11.0099 3.68075 10.2299 4.95775Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 12.75L12 7.75" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.001 16.75C12.139 16.75 12.251 16.638 12.25 16.5C12.25 16.362 12.138 16.25 12 16.25C11.862 16.25 11.75 16.362 11.75 16.5C11.75 16.638 11.862 16.75 12.001 16.75" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),wR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M8 10L12 14L16 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),_R=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M14 8L10 12L14 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),bR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M10 16L14 12L10 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),FR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M15 10L12 7L9 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9 14L12 17L15 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),$R=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M16 14L12 10L8 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),xR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 32 32" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="31" height="31" rx="15.5" fill="transparent"/>
  <rect x="0.5" y="0.5" width="31" height="31" rx="15.5" stroke="currentColor"/>
  <path d="M10.2549 16.4642L13.7907 20L13.7679 19.9772L21.7451 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),OR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 20 20" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <rect width="20" height="20" rx="10" fill="currentColor"/>
  <path d="M6.40918 10.2901L8.61905 12.5L8.60477 12.4857L13.5905 7.5" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),SR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9.00375" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8.4425 12.3392L10.6104 14.5071L10.5964 14.4931L15.4874 9.60205" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),ER=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M15.2056 10.1121L11.2016 14.1137L8.79437 11.7137" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="2.99622" y="2.99622" width="18.0075" height="18.0075" rx="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),PR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <g id="Group">
    <g id="Group_2">
      <path id="Path" d="M20 6.5L9 17.5L4 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),CR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M14.83 9.16992L9.17004 14.8299" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14.83 14.8299L9.17004 9.16992" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 21V21C7.029 21 3 16.971 3 12V12C3 7.029 7.029 3 12 3V3C16.971 3 21 7.029 21 12V12C21 16.971 16.971 21 12 21Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),MR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M8 8L16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 8L8 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),DR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M13.78 4L10.22 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18 8L22 12L18 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 16L2 12L6 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),AR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 16 16" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M4 8C4 5.79086 5.79086 4 8 4C10.2091 4 12 5.79086 12 8C12 10.2091 10.2091 12 8 12C5.79086 12 4 10.2091 4 8Z" fill="currentColor"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),TR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.52159 20.0033H3.9967V15.4784C3.9967 15.0146 4.18087 14.5698 4.50892 14.2419L15.2414 3.50942C15.5692 3.18093 16.0143 2.99634 16.4784 2.99634C16.9425 2.99634 17.3876 3.18093 17.7154 3.50942L20.4906 6.28458C20.8191 6.61244 21.0037 7.05749 21.0037 7.52159C21.0037 7.9857 20.8191 8.43075 20.4906 8.75861L9.7581 19.4911C9.42998 19.8188 8.98531 20.003 8.52159 20.0033Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13.0004 5.99756L18.0024 10.9996" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8.99878 15.0013L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),jR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg width="25" height="25" viewBox="0 0 25 25" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M15.374 12.718L19.88 9.663C20.581 9.189 21 8.398 21 7.552V7.552C21 6.142 19.858 5 18.449 5H5.56601C4.15701 5 3.01501 6.142 3.01501 7.551V7.551C3.01501 8.397 3.43401 9.188 4.13501 9.663L8.64101 12.718C10.674 14.096 13.341 14.096 15.374 12.718V12.718Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M3.75 7.55103C3.75 7.13681 3.41421 6.80103 3 6.80103C2.58579 6.80103 2.25 7.13681 2.25 7.55103V17C2.25 19.0712 3.92879 20.75 6 20.75H12.7396C12.6058 20.2701 12.5258 19.7678 12.5064 19.25H6C4.75721 19.25 3.75 18.2428 3.75 17V7.55103ZM20.25 12.6214C20.7754 12.7235 21.2781 12.8889 21.75 13.1093V7.55203C21.75 7.13781 21.4142 6.80203 21 6.80203C20.5858 6.80203 20.25 7.13781 20.25 7.55203V12.6214Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M19.0016 23.5017C16.5165 23.5017 14.5016 21.4868 14.5016 19.0017C14.5016 16.5166 16.5165 14.5017 19.0016 14.5017C21.4879 14.5017 23.5016 16.5166 23.5016 19.0017C23.5016 21.4868 21.4879 23.5017 19.0016 23.5017" fill="white"/>
  <path d="M19.0016 23.5017C16.5165 23.5017 14.5016 21.4868 14.5016 19.0017C14.5016 16.5166 16.5165 14.5017 19.0016 14.5017C21.4879 14.5017 23.5016 16.5166 23.5016 19.0017C23.5016 21.4868 21.4879 23.5017 19.0016 23.5017" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20.501 18.5L18.9387 20.0624L18 19.1245" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),zR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg width="25" height="25" viewBox="0 0 25 25" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M15.374 12.718L19.88 9.663C20.581 9.189 21 8.398 21 7.552V7.552C21 6.142 19.858 5 18.449 5H5.56601C4.15701 5 3.01501 6.142 3.01501 7.551V7.551C3.01501 8.397 3.43401 9.188 4.13501 9.663L8.64101 12.718C10.674 14.096 13.341 14.096 15.374 12.718V12.718Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M3.75 7.55103C3.75 7.13681 3.41421 6.80103 3 6.80103C2.58579 6.80103 2.25 7.13681 2.25 7.55103V17C2.25 19.0712 3.92879 20.75 6 20.75H12.7396C12.6058 20.2701 12.5258 19.7678 12.5064 19.25H6C4.75721 19.25 3.75 18.2428 3.75 17V7.55103ZM20.25 12.6214C20.7754 12.7235 21.2781 12.8889 21.75 13.1093V7.55203C21.75 7.13781 21.4142 6.80203 21 6.80203C20.5858 6.80203 20.25 7.13781 20.25 7.55203V12.6214Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M19.0016 23.5017C16.5165 23.5017 14.5016 21.4868 14.5016 19.0017C14.5016 16.5166 16.5165 14.5017 19.0016 14.5017C21.4879 14.5017 23.5016 16.5166 23.5016 19.0017C23.5016 21.4868 21.4879 23.5017 19.0016 23.5017" fill="white"/>
  <path d="M19.0016 23.5017C16.5165 23.5017 14.5016 21.4868 14.5016 19.0017C14.5016 16.5166 16.5165 14.5017 19.0016 14.5017C21.4879 14.5017 23.5016 16.5166 23.5016 19.0017C23.5016 21.4868 21.4879 23.5017 19.0016 23.5017" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.0005 18.754V17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18.9995 20.6879C18.9515 20.6879 18.9125 20.7269 18.9135 20.7749C18.9135 20.8229 18.9525 20.8619 19.0005 20.8619C19.0485 20.8619 19.0865 20.8229 19.0865 20.7749C19.0865 20.7269 19.0475 20.6879 18.9995 20.6879" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),NR=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M15.374 12.718L19.88 9.663C20.581 9.189 21 8.398 21 7.552V7.552C21 6.142 19.858 5 18.449 5H5.56601C4.15701 5 3.01501 6.142 3.01501 7.551V7.551C3.01501 8.397 3.43401 9.188 4.13501 9.663L8.64101 12.718C10.674 14.096 13.341 14.096 15.374 12.718V12.718Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3 7.55103V17C3 18.657 4.343 20 6 20H18C19.657 20 21 18.657 21 17V7.55203" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),kR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g>
	<rect y="0" fill="#6DA544" width="513" height="48.8"/>
	<rect y="97.5" fill="#6DA544" width="513" height="48.8"/>
	<rect y="195" fill="#6DA544" width="513" height="48.8"/>
	<rect y="292.6" fill="#6DA544" width="513" height="48.8"/>
</g>
<rect y="0" fill="#D80027" width="256.5" height="146.3"/>
<polygon fill="#FFFFFF" points="116.9,114.4 109.4,99.6 109.4,69.9 128,59 146.6,69.9 146.6,92.2 154,84.8 158.2,87.8 154,99.6
	139.1,114.4 "/>
<circle fill="#FFFFFF" cx="82" cy="82.8" r="5.4"/>
<circle fill="#FFFFFF" cx="90.8" cy="61.7" r="5.4"/>
<circle fill="#FFFFFF" cx="106.6" cy="46.2" r="5.4"/>
<circle fill="#FFFFFF" cx="128" cy="40.8" r="5.4"/>
<circle fill="#FFFFFF" cx="149.4" cy="46.2" r="5.4"/>
<circle fill="#FFFFFF" cx="165.2" cy="61.7" r="5.4"/>
<circle fill="#FFFFFF" cx="174" cy="82.8" r="5.4"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),IR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="75 0 300 300">
<rect width="450" height="300" fill="#FFFFFF"/>
<rect width="450" height="200" y="100" fill="#FF0000"/>
<rect width="450" height="100" y="200" fill="#FFDF00"/>
</svg>`},Symbol.toStringTag,{value:"Module"})),BR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 0 200 200">
<rect width="300" height="200" fill="#fc0"/>
<rect width="200" height="200" fill="#0768a9"/>
<rect width="100" height="200" fill="#fff"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),LR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="100.713 0 341.3 341.3">
<rect fill="#0052B4" width="512" height="341.3"/>
<polygon fill="#FFFFFF" points="256,0 256,117.4 209.9,117.4 256,148.1 256,170.7 233.4,170.7 160,121.8 160,170.7 96,170.7 96,121.8
	22.6,170.7 0,170.7 0,148.1 46.1,117.4 0,117.4 0,53.4 46.1,53.4 0,22.7 0,0 22.6,0 96,48.9 96,0 160,0 160,48.9 233.4,0 "/>
<g>
	<polygon fill="#D80027" points="144,0 112,0 112,69.4 0,69.4 0,101.4 112,101.4 112,170.7 144,170.7 144,101.4 256,101.4 256,69.4
		144,69.4 	"/>
	<polygon fill="#D80027" points="0,0 0,15.1 57.4,53.4 80,53.4 	"/>
	<polygon fill="#D80027" points="256,0 256,15.1 198.6,53.4 176,53.4 	"/>
</g>
<polygon fill="#2E52B2" points="256,22.7 256,53.4 209.9,53.4 "/>
<g>
	<polygon fill="#D80027" points="0,0 0,15.1 57.4,53.4 80,53.4 	"/>
	<polygon fill="#D80027" points="256,0 256,15.1 198.6,53.4 176,53.4 	"/>
</g>
<polygon fill="#2E52B2" points="256,22.7 256,53.4 209.9,53.4 "/>
<g>
	<polygon fill="#D80027" points="0,170.7 0,155.6 57.4,117.4 80,117.4 	"/>
	<polygon fill="#D80027" points="256,170.7 256,155.6 198.6,117.4 176,117.4 	"/>
</g>
<g>
	<path fill="#29DBFF" d="M448.9,169.5c0,9.6-0.3,29.6-1.4,39.2c-4.1,34.9-23.5,68.8-62.1,85.9c-45.3-17.9-60.8-51-64.9-85.9
		c-1.1-9.6-1.5-19.4-1.5-29l0.3-47.1h129.2L448.9,169.5z"/>
</g>
<g>
	<path fill="#FFFFFF" d="M447.5,208.7c-0.2,1.6-0.4,3.3-0.6,4.9c-4.8,33.1-22.9,65.4-61.5,81c-43.2-17-59.4-47.9-64.2-81
		c-0.2-1.6-0.4-3.2-0.6-4.9"/>
</g>
<polygon fill="#29DBFF" points="385.4,251.7 362.5,208.7 408.3,208.7 "/>
<polygon fill="#FFFFFF" points="385.4,165.8 362.5,208.7 408.3,208.7 "/>
<ellipse fill="#FFBE57" cx="474.8" cy="236.8" rx="16.8" ry="43.3"/>
<ellipse fill="#FFBE57" cx="295.3" cy="236.8" rx="16.8" ry="43.3"/>
<polygon fill="#FFFFFF" points="385.4,31.5 352,75.5 420.5,75.5 "/>
<path fill="#FFFFFF" d="M315.5,280c0,0,33.8,29.5,69.9,29.5s67.1-29.5,67.1-29.5l8.5,14.6c0,0-21.8,31.4-75.6,31.4S307,294.6,307,294.6
	L315.5,280z"/>
<ellipse fill="#A5A5A5" cx="386.3" cy="104.3" rx="34.3" ry="23.3"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),RR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#0052B4" width="513" height="342"/>
<g>
	<path fill="#FFFFFF" d="M440.1,181.1c-0.1,39.2-6.4,81.4-57.4,101.5c-51.1-20.1-57.3-62.3-57.4-101.5L440.1,181.1L440.1,181.1z"/>
	<path fill="#29DBFF" d="M439.6,197.7c-2.8,34.9-12.4,67.4-57,85c-44.4-17.6-54.5-51.2-56.9-84.9"/>
	<path fill="#FFFFFF" d="M437.8,214.1c-3.2,24.3-16.7,53.5-55.1,68.6c-38.4-15.1-50.5-42.5-55.1-68.4"/>
	<path fill="#29DBFF" d="M434.2,230.3c-5.7,17.7-19.3,39.4-51.3,52.8c-32-12.6-45.2-33.8-51.4-53"/>
	<path fill="#FFFFFF" d="M426.7,246.9c-6.5,11.3-17.7,25.4-44,35.9c-27.5-11.5-37.4-25.3-44-36.1"/>
	<path fill="#29DBFF" d="M412.4,265.1c-8.1,7.2-12,11.2-29.6,17.9c-20.1-7.9-22.6-11.6-29.2-17.5"/>
	<path fill="#5CC85C" d="M383.3,231.6c-0.2-0.2-27.9,35.7-27.9,35.7c-1.8-1.3-10-9.5-13.3-15l41.3-50.1l40.2,49.7
		c-3.9,6.5-11.4,13.6-13.2,15"/>
</g>
<polygon fill="#5CC85C" points="382.6,85.3 356.1,130.3 409.1,130.3 409.1,130.3 "/>
<ellipse transform="matrix(0.134 -0.991 0.991 0.134 28.7247 484.2523)" fill="#F7A226" cx="291.4" cy="225.7" rx="48.7" ry="15.7"/>
<ellipse transform="matrix(0.373 -0.9278 0.9278 0.373 37.247 384.4472)" fill="#DDC7AB" cx="303.1" cy="164.7" rx="11.7" ry="7.2"/>
<ellipse transform="matrix(0.1437 -0.9896 0.9896 0.1437 -19.091 521.3171)" fill="#DDC7AB" cx="291.7" cy="271.7" rx="11.4" ry="3.3"/>
<ellipse transform="matrix(0.9986 -5.352928e-02 5.352928e-02 0.9986 -13.9925 16.4237)" fill="#DDC7AB" cx="299.6" cy="269.4" rx="3.3" ry="11"/>
<ellipse transform="matrix(0.9303 -0.3668 0.3668 0.9303 -51.8254 129.3871)" fill="#DDC7AB" cx="314.5" cy="201.1" rx="4.1" ry="13.7"/>
<ellipse transform="matrix(0.9303 -0.3668 0.3668 0.9303 -43.1881 128.875)" fill="#DDC7AB" cx="317.5" cy="178.1" rx="13.7" ry="4.1"/>
<ellipse transform="matrix(0.991 -0.134 0.134 0.991 -26.0008 65.5194)" fill="#F7A226" cx="473.6" cy="225.9" rx="15.7" ry="48.7"/>
<ellipse transform="matrix(0.9278 -0.373 0.373 0.9278 -28.1478 184.2457)" fill="#DDC7AB" cx="462" cy="164.9" rx="7.2" ry="11.7"/>
<ellipse transform="matrix(0.9896 -0.1437 0.1437 0.9896 -34.1512 70.8368)" fill="#DDC7AB" cx="473.4" cy="271.9" rx="3.3" ry="11.4"/>
<ellipse transform="matrix(5.352928e-02 -0.9986 0.9986 5.352928e-02 171.3404 719.9983)" fill="#DDC7AB" cx="465.5" cy="269.6" rx="11" ry="3.3"/>
<ellipse transform="matrix(0.3668 -0.9303 0.9303 0.3668 98.0689 546.5782)" fill="#DDC7AB" cx="450.6" cy="201.2" rx="13.7" ry="4.1"/>
<ellipse transform="matrix(0.3668 -0.9303 0.9303 0.3668 117.5679 529.2617)" fill="#DDC7AB" cx="447.6" cy="178.3" rx="4.1" ry="13.7"/>
<polygon fill="#B0C6CC" points="373.3,130.3 356.1,155 373.9,181.1 396,181.1 400.7,155.7 395.3,130.3 "/>
<polygon fill="#FFFFFF" points="256,0 256,117.4 209.9,117.4 256,148.1 256,170.7 233.4,170.7 160,121.8 160,170.7 96,170.7 96,121.8
	22.6,170.7 0,170.7 0,148.1 46.1,117.4 0,117.4 0,53.4 46.1,53.4 0,22.7 0,0 22.6,0 96,48.9 96,0 160,0 160,48.9 233.4,0 "/>
<polygon fill="#D80027" points="144,0 112,0 112,69.4 0,69.4 0,101.4 112,101.4 112,170.7 144,170.7 144,101.4 256,101.4 256,69.4
	144,69.4 "/>
<polygon fill="#2E52B2" points="256,22.7 256,53.4 209.9,53.4 "/>
<g>
	<polygon fill="#D80027" points="0,170.7 0,159.7 62.5,117.4 85.1,117.4 7.3,170.7 	"/>
</g>
<polygon fill="#D80027" points="7.3,0.1 85.1,53.3 62.5,53.3 0,11.1 0,0.1 "/>
<polygon fill="#D80027" points="256,0.1 256,11.1 193.5,53.4 170.9,53.4 248.7,0.1 "/>
<polygon fill="#D80027" points="248.7,170.7 170.9,117.4 193.5,117.4 256,159.7 256,170.7 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),VR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#FFDA44" width="513" height="342"/>
<rect fill="#0052B4" width="171" height="342"/>
<rect x="342" fill="#D80027" width="171" height="342"/>
<rect x="198.9" y="113.6" fill="#D80027" width="57.1" height="64.8"/>
<g stroke="#D80027" stroke-width="7">
  <line x1="267.6" y1="113.6" x2="267.6" y2="178.3"/>
  <line x1="284.2" y1="113.6" x2="284.2" y2="178.3"/>
  <line x1="300.8" y1="113.6" x2="300.8" y2="178.3"/>
</g>
<g stroke="#D80027" stroke-width="5">
  <line x1="247.4" y1="178.4" x2="247.4" y2="243.1"/>
  <line x1="234.1" y1="178.4" x2="234.1" y2="243.1"/>
  <line x1="220.8" y1="178.5" x2="220.8" y2="232.4"/>
  <line x1="207.1" y1="178.5" x2="207.1" y2="225.6"/>
</g>
<polygon fill="#FFDA44" points="199.9,146 227.5,113.6 256,145.9 227.9,178.3 "/>
<path fill="#BC8B00" d="M182.2,95.9v92.2c0,34.3,27.3,54.2,48.6,64.5c-0.8,1.4,25.1,8.3,25.1,8.3s25.9-6.9,25.1-8.3
	c21.4-10.3,48.6-30.1,48.6-64.5V95.9H182.2z M312.1,188.1c0,16.9-10,29.4-32.8,43.9c-8.6,5.5-17.5,9-23.3,11
	c-5.8-2-14.7-5.5-23.3-11c-22.8-14.5-32.8-28-32.8-43.9v-74.5h112.2L312.1,188.1z"/>
<rect x="264.4" y="188.9" fill="#D80027" width="29.5" height="8.6"/>
<rect x="264.4" y="206.5" fill="#D80027" width="29.5" height="8.6"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),HR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="51.3 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#009e49" width="513" height="114"/>
<rect y="228" fill="#000" width="513" height="114"/>
<rect y="0" fill="#ce1126" width="171" height="342"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),UR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#DB3E00" width="513" height="342"/>
<rect x="331" y="0" fill="#479900" width="182" height="342"/>
<rect y="0" fill="#000" width="181.8" height="342"/>
<path fill="#FFFFFF" d="M256,126.7c-19.4,0-35.2,15.8-35.2,35.2v52.8h70.4v-52.8C291.2,142.4,275.4,126.7,256,126.7z"/>
<path fill="#FFFFFF" d="M256,84.3c-47.7,0-86.4,38.7-86.4,86.4S208.3,257,256,257c47.7,0,86.4-38.7,86.4-86.4S303.7,84.3,256,84.3z
	 M256,242c-39.4,0-71.4-32-71.4-71.4c0-39.4,32-71.4,71.4-71.4c39.4,0,71.4,32,71.4,71.4C327.4,210.1,295.4,242,256,242z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),WR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#000" y="0" width="513" height="342"/>
<path fill="#0072c6" d="M88.8,136.5c-2.2,12.9-3.4,26.2-3.4,39.8c0,13.6,1.2,27,3.4,39.8L256,228.3l167.2-12.1
	c2.2-12.9,3.4-26.2,3.4-39.8s-1.2-27-3.4-39.8"/>
<path fill="#FFFFFF" d="M423.2,219H88.8c15.8,69.8,84.7,122.3,167.2,122.3S407.4,288.8,423.2,219z"/>
<polygon fill="#FFDA44" points="365.9,136.5 146.1,136.5 191,115.4 167.1,71.9 215.9,81.3 222,32 256,68.2 290,32 296.1,81.3
	344.9,71.9 321,115.4 "/>
<g fill="#ce1126">
	<polygon points="256.5,342 0,0 0,342 	"/>
	<polygon points="513,342 513,0 256,342 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),GR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#00318b" width="513" height="342"/>
<path fill="#FFFFFF" d="M454.8,265.38c7.94-10.93,13.24-24.27,13.24-40.42V104.89c-10.04,7.54-22.5,12.01-36.02,12.01
	c-19.64,0-37.07-9.43-48.03-24.01c-10.95,14.58-28.39,24.01-48.03,24.01c-13.52,0-25.99-4.47-36.02-12v120.06
	c0,16.16,5.3,29.5,13.24,40.42L454.8,265.38L454.8,265.38z"/>
<path fill="#8DCCFF" d="M310.23,260.98C332.65,296.96,384,309,384,309s51.35-12.04,73.77-48.02H310.23L310.23,260.98z"/>
<path fill="#D87B00" d="M396.66,172.21c0.32,1.42,8.72,10.17,17.56,20.15c1.39,1.57-8.74,12.63-6.91,12.59
	c4.75-0.12,19.27-17.26,19.34,6.65c0.05,15.94-30,27.51-30,27.51h17.47l0.65,14.96c0,0,4.97-13.34,7.59-16.57
	c8.1-9.97,20.18-30.07,34.59-27.1c14.41,2.97-13.66-13.92-13.66-13.92s-5.2-15.19-16.63-16.97c-10.06-1.57-14.29-2.51-26.64-7.3
	C398.34,171.56,396.14,169.89,396.66,172.21z"/>
<path fill="#D87B00" d="M359.69,198.69c1.07-0.99,4.46-12.63,8.69-25.28c0.67-1.99,15.31,1.27,14.35-0.3
	c-2.47-4.06-24.58-8.08-3.9-20.08c13.79-8,38.82,12.27,38.82,12.27l-8.72-15.14l12.64-8.03c0,0-14.05,2.35-18.14,1.69
	c-12.68-2.04-36.13-2.48-40.75-16.45c-4.62-13.97-5.25,18.79-5.25,18.79s-10.56,12.08-6.4,22.88c3.66,9.5,4.96,13.64,6.97,26.73
	C358.29,197.56,357.94,200.3,359.69,198.69z"/>
<path fill="#D87B00" d="M395.67,219.87c-1.39-0.43-13.16,2.49-26.22,5.18c-2.06,0.42-6.59-13.88-7.47-12.26
	c-2.27,4.17,5.36,25.31-15.41,13.45c-13.84-7.91-8.89-39.73-8.89-39.73l-8.71,15.14l-13.29-6.9c0,0,9.09,10.96,10.57,14.84
	c4.6,11.99,16,32.49,6.24,43.49c-9.76,11.01,18.88-4.9,18.88-4.9s15.76,3.07,23-5.96c6.38-7.94,9.3-11.14,19.61-19.45
	C395.41,221.65,397.95,220.58,395.67,219.87z"/>
<g>
	<polygon fill="#FFFFFF" points="256.5,0 233.4,0 160,48.9 160,0 96,0 96,48.9 22.6,0 0,0 0,22.7 46.1,53.4 0,53.4 0,117.4 46.1,117.4
		0,148.1 0,171 22.6,171 96,121.8 96,171 160,171 160,121.8 233.4,171 256.5,171 256.5,148.1 209.9,117.4 256.5,117.4
		256.5,53.4 209.9,53.4 256.5,22.7 	"/>
	<polygon fill="#D80027" points="144,0 112,0 112,69.4 0,69.4 0,101.4 112,101.4 112,171 144,171 144,101.4 256.5,101.4 256.5,69.4
		144,69.4 	"/>
	<polygon fill="#D80027" points="0,171 0,159.7 62.5,117.4 85.1,117.4 7.3,171 	"/>
	<polygon fill="#D80027" points="7.3,0.1 85.1,53.3 62.5,53.3 0,11.1 0,0.1 	"/>
	<polygon fill="#D80027" points="256.5,0.1 256.5,11.1 193.5,53.4 170.9,53.4 248.7,0.1 	"/>
	<polygon fill="#D80027" points="248.7,171 170.9,117.4 193.5,117.4 256.5,159.7 256.5,171 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),KR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="15 0 60 60">
<rect x="0" fill="#ED2024" width="90" height="60"/>
<polygon fill="#212121" points="32.5,12.2 32.5,28.2 39.6,30.7 34.6,35.6 37,38.6 42.3,33.1 43.5,35.4 40.5,40.3 44.1,45.9 42.3,48.5
	45.1,52.1 47.8,48.4 46.3,45.8 49.3,40 46.6,35.4 47.8,33.1 53,38.6 55.5,35.7 50.3,30.6 57.5,28 57.5,12.2 52.3,14.1 52.2,17.9
	48.9,18.2 48.9,15.6 50.6,13.3 56.2,11.1 53.9,10.7 55.3,9.5 56.2,9.9 55.4,8.5 54,9 53,7.9 47.5,9 48.9,10.1 45.1,15 41.3,10.2
	42.6,9.1 37.6,7.9 36.2,9 34.7,8.6 33.9,10 34.8,9.4 36.4,10.5 34.1,11 39.6,13 41.2,15.3 41.2,18.2 37.9,17.9 37.9,14.3 "/>
<g>
	<rect x="26.2" y="25" fill="#212121" width="6.4" height="2.5"/>
	<rect x="26.2" y="20.9" fill="#212121" width="6.4" height="2.7"/>
	<rect x="26.2" y="16.7" fill="#212121" width="6.4" height="2.6"/>
	<rect x="26.2" y="12.7" fill="#212121" width="6.4" height="2.5"/>
</g>
<g>
	<rect x="57.4" y="25" fill="#212121" width="6.4" height="2.5"/>
	<rect x="57.4" y="20.9" fill="#212121" width="6.4" height="2.7"/>
	<rect x="57.4" y="16.7" fill="#212121" width="6.4" height="2.6"/>
	<rect x="57.4" y="12.7" fill="#212121" width="6.4" height="2.5"/>
</g>
<rect x="53.4" y="36.1" fill="#212121" width="6.4" height="1.9"/>
<rect x="30.2" y="36.1" fill="#212121" width="6.4" height="1.9"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),qR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#0052B4" width="513" height="342"/>
<rect y="0" fill="#D80027" width="513" height="114"/>
<rect y="228" fill="#FF9811" width="513" height="114"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),YR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="100.89 0 342 342">
<rect fill="#000000" y="171" width="513" height="171"/>
<rect fill="#D80027" width="513" height="171"/>
<g fill="#FFDA44">
  <polygon points="332.7,135.6 350.2,127 342.8,108 324.1,114.2 "/>
  <polygon points="287.1,79.6 292.6,60.8 273.5,53.6 265.5,71.6 "/>
  <polygon points="316.5,102.8 328.7,87.5 313.8,73.6 299.6,87.2 "/>
  <polygon points="335.9,171.7 355.4,170.9 355.4,149.6 332.5,149.8 "/>
  <polygon points="323.3,209.8 342.1,215.3 349.4,196.3 331.4,188.3 "/>
  <polygon points="294.3,242.2 309.2,254.9 323.6,240.5 310.5,225.8 "/>
  <polygon points="247.3,94.5 257.1,114.4 279,117.7 263.1,133.2 266.7,155.1 247.1,144.7 227.4,154.9 231.2,133
  	215.4,117.5 237.4,114.4 "/>
  <path d="M250.8,61.3l-2.7,18.3c43.1,3.2,77,39.2,77,83.1c0,46-37.3,82.9-83.4,83.4c-29.2,0.3-51.3-14.8-67-33.7
  	l-13.9,12.3c15,19,40.8,39.9,80.9,39.9c56.3,0,101.9-45.6,101.9-101.9C343.7,109.5,302.9,65.8,250.8,61.3z"/>
  <path fill="#000000" d="M291.9,223.4l-11.8,14c0,0,51.9,38.9,53.6,40.4c1.7,1.5,5.2,2,9.1-2.7c3.7-4.5,2.8-8.1,0.9-9.7
  C341.7,263.9,291.9,223.4,291.9,223.4z"/>
  <path d="M206.1,157.2c-7.7,10.3-7.5,23.1,2.8,30.9c0,0,135.2,101.5,136.9,103c1.7,1.5,5.2,2,9.1-2.7
  	c3.7-4.5,2.8-8.1,0.9-9.7C353.9,277.2,206.1,157.2,206.1,157.2z"/>
  <polygon points="253.8,256.3 261.1,274.5 280.6,268.5 275.8,249.4 "/>
  <polygon points="213.4,252.6 211.4,272.1 231.5,275.7 236,256.6 "/>
  <polygon points="177.7,231.4 167.4,248 183.8,260.1 196.3,244.9 "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),ZR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="124 0 496 496">
	<path fill="#3A7DCE" d="M0,0h744v496H0V0z"/>
	<polygon fill="#ffffff" points="120,125 210,188 264,174 287,93 348,57 440,71 545,126 551,216 585,228 585,320 520,435 442,459
		370,442 388,412 380,380 370,389 208,364 159,279 179,233 130,171 "/>
</svg>`},Symbol.toStringTag,{value:"Module"})),JR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="512" height="342"/>
<rect y="0" fill="#338AF3" width="512" height="114"/>
<rect y="228" fill="#338AF3" width="512" height="114"/>
<circle fill="#FFDA44" stroke="#d6ab00" stroke-width="5" cx="256.5" cy="171" r="40"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),XR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="171 0 342 342">
<rect fill="#10338c" width="513" height="342"/>
<polygon fill="#D80027" points="513,33 95.3,171 513,310.76 513,342 0,171 513,0 "/>
<polyline fill="#FFFFFF" points="513,287.18 513,311.76 81.72,171 513,30 513,54.16 "/>
<path fill="#A2001D" d="M476.98,140.21l-21.89,10.68l-3.18-15.32l31.19-29.77c0,0-9.42-40.65-13.75-44.98l-112.32,55.82l-6.84,36.76
	l-31.9,28.59l-0.4,34.2l34.29-22.76l67.23-2.66l-1.51,38.11h22.23l11.9-44.64l31.55-24.61L476.98,140.21z"/>
<polygon fill="#EFC100" stroke="#231F20" stroke-miterlimit="10" points="317.89,238.41 295.65,227.3 317.89,216.19 462.35,216.19 462.35,238.41 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),QR=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="114" fill="#FFFFFF" width="513" height="114"/>
<rect y="0" fill="#D80027" width="513" height="114"/>
<rect y="228" fill="#D80027" width="513" height="114"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),eV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#10338c" width="513" height="342"/>
<g fill="#FFFFFF">
	<path d="M222.2,170.7c0.3-0.3,0.5-0.6,0.8-0.9C222.8,170.1,222.5,170.4,222.2,170.7L222.2,170.7z"/>
	<polygon points="188,212.6 199,235.5 223.7,229.8 212.7,252.6 232.6,268.4 207.8,274 207.9,299.4 188,283.5
		168.2,299.4 168.3,274 143.5,268.4 163.4,252.6 152.3,229.8 177.1,235.5 	"/>
	<polygon points="385.9,241.1 391.1,252 402.9,249.3 397.6,260.2 407.1,267.7 395.3,270.3 395.3,282.5 385.9,274.9
		376.4,282.5 376.5,270.3 364.7,267.7 374.2,260.2 368.9,249.3 380.7,252 	"/>
	<polygon points="337.3,125.1 342.5,136 354.3,133.3 349,144.2 358.5,151.7 346.7,154.4 346.7,166.5 337.3,158.9
		327.8,166.5 327.9,154.4 316,151.7 325.5,144.2 320.2,133.3 332,136 	"/>
	<polygon points="385.9,58.9 391.1,69.8 402.9,67.1 397.6,78 407.1,85.5 395.3,88.2 395.3,100.3 385.9,92.7
		376.4,100.3 376.5,88.2 364.7,85.5 374.2,78 368.9,67.1 380.7,69.8 	"/>
	<polygon points="428.4,108.6 433.6,119.5 445.4,116.8 440.1,127.7 449.6,135.2 437.8,137.8 437.8,150 428.4,142.4
		418.9,150 418.9,137.8 407.1,135.2 416.6,127.7 411.3,116.8 423.1,119.5 	"/>
	<polygon points="398,166.5 402.1,179.2 415.4,179.2 404.6,187 408.8,199.7 398,191.8 387.2,199.7 391.3,187
		380.6,179.2 393.9,179.2 	"/>
	<polygon points="254.8,0 254.8,30.6 209.7,55.7 254.8,55.7 254.8,115 195.7,115 254.8,147.8 254.8,170.7 228.1,170.7
		154.6,129.8 154.6,170.7 99,170.7 99,122.1 11.6,170.7 -1.2,170.7 -1.2,140.1 44,115 -1.2,115 -1.2,55.7 57.9,55.7 -1.2,22.8
		-1.2,0 25.5,0 99,40.8 99,0 154.6,0 154.6,48.6 242.1,0 	"/>
</g>
<polygon fill="#D80027" points="142.8,0 110.8,0 110.8,69.3 -1.2,69.3 -1.2,101.3 110.8,101.3 110.8,170.7 142.8,170.7 142.8,101.3
	254.8,101.3 254.8,69.3 142.8,69.3 "/>
<polygon fill="#0052B4" points="154.6,115 254.8,170.7 254.8,154.9 183,115 "/>
<polygon fill="#FFFFFF" points="154.6,115 254.8,170.7 254.8,154.9 183,115 "/>
<g fill="#D80027">
	<polygon points="154.6,115 254.8,170.7 254.8,154.9 183,115 	"/>
	<polygon points="70.7,115 -1.2,154.9 -1.2,170.7 -1.2,170.7 99,115 	"/>
</g>
<polygon fill="#0052B4" points="99,55.7 -1.2,0 -1.2,15.7 70.7,55.7 "/>
<polygon fill="#FFFFFF" points="99,55.7 -1.2,0 -1.2,15.7 70.7,55.7 "/>
<g fill="#D80027">
	<polygon points="99,55.7 -1.2,0 -1.2,15.7 70.7,55.7 	"/>
	<polygon points="183,55.7 254.8,15.7 254.8,0 254.8,0 154.6,55.7 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),tV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 242 242">
<rect fill="#338AF3" width="363" height="242"/>
<g>
	<polygon fill="#FFFFFF" points="57,96.9 14.7,78.2 57,59.6 75.6,17.4 94.2,59.6 136.5,78.2 94.2,96.9 75.6,139.1 	"/>
	<polygon fill="#f30028" points="75.6,40.6 87.1,66.7 113.2,78.2 87.1,89.7 75.6,115.8 64.1,89.7 38,78.2 64.1,66.7 	"/>
</g>
<g fill="#FFDA44">
	<rect y="152.2" width="363" height="15.7"/>
	<rect y="183.6" width="363" height="15.7"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),nV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="39.33 0 342 342">
<rect fill="#0052B4" width="513" height="342"/>
<polygon fill="#FFDA44" points="513,210.9 202.2,210.9 202.2,342 122.4,342 122.4,210.9 0,210.9 0,192.3 0,149.7 0,131.1 122.4,131.1
	122.4,0 202.2,0 202.2,131.1 513,131.1 513,149.7 513,192.3 "/>
<polygon fill="#D80027" points="513,149.7 513,192.3 183.7,192.3 183.7,342 141,342 141,192.3 0,192.3 0,149.7 141,149.7 141,0
	183.7,0 183.7,149.7 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),rV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#ef3340" width="513" height="342"/>
<rect fill="#00b5e2" width="513" height="114"/>
<rect y="228" fill="#509e2f" width="513" height="114"/>
<g fill="#FFFFFF">
	<path d="M265.6,212.6c-23,0-41.6-18.6-41.6-41.6s18.6-41.6,41.6-41.6c7.2,0,13.9,1.8,19.8,5
		c-9.2-9-21.9-14.6-35.8-14.6c-28.3,0-51.2,22.9-51.2,51.2s22.9,51.2,51.2,51.2c13.9,0,26.6-5.6,35.8-14.6
		C279.5,210.8,272.8,212.6,265.6,212.6z"/>
	<polygon points="297.6,142.2 303.1,157.7 318,150.6 310.9,165.5 326.4,171 310.9,176.5 318,191.4 303.1,184.3
		297.6,199.8 292.1,184.3 277.2,191.4 284.3,176.5 268.8,171 284.3,165.5 277.2,150.6 292.1,157.7 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),oV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="85.5 0 342 342">
<rect fill="#10338C" width="513.1" height="342"/>
<polyline fill="#F6C500" points="99.9,0 441.9,0 441.9,342 "/>
<g>
	<polygon fill="#FFFFFF" points="19.9,21.1 40.3,6.2 60.9,21 54,0 26.7,0 	"/>
	<polygon fill="#FFFFFF" points="92.3,25.5 84.4,1.3 76.6,25.5 51.3,25.5 71.8,40.3 64,64.3 84.4,49.5 105,64.3 97.1,40.3 117.6,25.4
		"/>
	<polygon fill="#FFFFFF" points="136.3,69.2 128.5,45.2 120.7,69.2 95.5,69.2 115.9,84.1 108.1,108.1 128.5,93.3 149.1,108.1
		141.3,84.1 161.7,69.2 	"/>
	<polygon fill="#FFFFFF" points="179.4,112.3 171.6,88.2 163.8,112.3 138.5,112.3 159,127.2 151.2,151.2 171.6,136.4 192.2,151.2
		184.3,127.2 204.8,112.2 	"/>
	<polygon fill="#FFFFFF" points="222.5,155.3 214.7,131.3 206.9,155.3 181.5,155.3 202.1,170.3 194.3,194.3 214.7,179.4 235.1,194.3
		227.3,170.3 247.9,155.3 	"/>
	<polygon fill="#FFFFFF" points="265.6,198.4 257.8,174.4 250,198.4 224.6,198.4 245.2,213.3 237.4,237.4 257.8,222.5 278.2,237.4
		270.4,213.2 290.9,198.4 	"/>
	<polygon fill="#FFFFFF" points="308.7,241.5 300.8,217.5 293,241.5 267.7,241.5 288.2,256.3 280.3,280.5 300.9,265.6 321.3,280.4
		313.5,256.3 334,241.5 	"/>
	<polygon fill="#FFFFFF" points="351.7,284.6 343.9,260.4 336.1,284.6 310.8,284.6 331.2,299.4 323.4,323.5 343.9,308.6 364.4,323.5
		356.6,299.4 377,284.6 	"/>
	<polygon fill="#FFFFFF" points="387,303.5 379.1,327.6 353.8,327.7 373.6,342 400.2,342 420.1,327.6 394.8,327.6 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),iV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#ffc726" width="513" height="342"/>
<g fill="#00267f">
	<rect y="0" width="171" height="342"/>
	<rect x="342" y="0" width="171" height="342"/>
</g>
<path fill="#000" d="M325.74,101.02l-31.97,12.4c-0.68,1.35-5.79,7.54-8.18,53.06h-17.05v-60.42l-12.54-27.38l-12.54,27v60.8H226.4
	c-2.39-45.53-7.8-52.48-8.47-53.84l-31.68-11.63c0.15,0.31,15.4,31.34,15.4,78.01v12.54h41.81v71.07h25.08v-71.07h41.81v-12.54
	c0-24.13,4.17-44.02,7.68-56.46c3.82-13.57,7.7-21.49,7.74-21.57L325.74,101.02z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),sV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="49.59 85.333 342 342">
<rect y="85.331" fill="#2d6e41" width="513" height="342"/>
<circle fill="#F40B32" cx="218.902" cy="256.5" r="115"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),lV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#fdda25" width="513" height="342"/>
<rect y="0" fill="#000" width="171" height="342"/>
<rect x="342" y="0" fill="#ef3340" width="171" height="342"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),aV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#3d944f" width="513" height="342"/>
<rect y="0" fill="#ef2b2d" width="513" height="171"/>
<polygon fill="#FFDA44" points="256,102.6 272.9,154.6 327.6,154.6 283.4,186.8 300.2,238.8 256,206.7 211.8,238.8 228.6,186.8
  184.4,154.6 239.1,154.6 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),cV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
	<rect y="0" fill="#00966e" width="513" height="342"/>
	<rect y="0" fill="#FFFFFF" width="513" height="114"/>
	<rect y="228" fill="#d62612" width="513" height="114"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),fV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="61.56 0 342 342">
	<polygon fill="#D80027" points="0,0 513,0 513,342 0,342 "/>
	<polygon fill="#FFFFFF" points="222.8,34.3 137.6,68.5 222.8,102.6 137.6,136.7 222.8,170.8 137.6,204.9 222.8,239 137.6,273.1
		222.8,307.2 137.6,342 0,342 0,0 137.6,0 "/>
</svg>


`},Symbol.toStringTag,{value:"Module"})),uV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#D80027" width="513" height="342"/>
<g fill="#47a644">
	<polygon points="215.9,170.7 0,314.6 0,26.8 	"/>
	<polygon points="513,26.8 513,314.6 297.1,170.7 	"/>
</g>
<polygon fill="#0052B4" points="513,26.8 296.1,170.7 513,314.6 513,342 471.9,342 256,197.4 40.1,342 0,342 0,314.6
	215.9,170.7 0,26.8 0,0 40.1,0 256,143.9 471.9,0 513,0 "/>
<polygon fill="#FFFFFF" points="513,26.8 297.1,170.7 513,314.6 513,342 473,342 256,197.4 39,342 0,342 0,314.6 215.9,170.7 0,26.8
		0,0 40.1,0 256,143.9 471.9,0 513,0 	"/>
<circle fill="#FFFFFF" cx="251.6" cy="170.7" r="100.2"/>
<g fill="#D80027" stroke="#47a644" stroke-width="3">
	<polygon points="251.4,103.6 258.8,116.5 273.6,116.5 266.2,129.3 273.6,142.1 258.8,142.1 251.4,155 244,142.1
		229.2,142.1 236.6,129.3 229.2,116.5 244,116.5 	"/>
	<polygon points="290.2,170.3 297.6,183.2 312.4,183.2 305,196 312.4,208.8 297.6,208.8 290.2,221.7 282.8,208.8
		267.9,208.8 275.3,196 267.9,183.2 282.8,183.2 	"/>
	<polygon points="213,170.3 220.4,183.2 235.3,183.2 227.9,196 235.3,208.8 220.4,208.8 213,221.7 205.6,208.8
		190.8,208.8 198.2,196 190.8,183.2 205.6,183.2 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),dV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="58.14 85.333 342 342">
<rect y="85.333" fill="#008751" width="513" height="342"/>
<rect x="196.666" y="85.333" fill="#fcd116" width="316.334" height="171"/>
<rect x="196.666" y="256" fill="#e8112d" width="316.334" height="171"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),hV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#FFFFFF" width="513" height="342"/>
<path fill="#FFFFFF" d="M0-75.85"/>
<path fill="#E6BC00" d="M157.31,199.76c0,0-9.04,43.93-19.31,40.39c-10.62-3.54-17.53-18.76-17.53-18.76l-14.52,21.24
		c0,0,38.18,8.48,41.01,5.47c1.22-1.14,8.21-15.1,10.34-26.05V199.76z M101.18,260.33c0,0-2.48,20.18-1.06,22.66
		c1.24,2.3,39.48,11.33,39.48,11.33s-24.96,16.46-29.74,20.54L91.8,284.94l-0.71-24.61L101.18,260.33L101.18,260.33z"/>
<path fill="#E6BC00" d="M0-75.85"/>
<path fill="#E6BC00" d="M112.51,94.64c0,0,39.65,41.6,40.36,45.5c0.71,3.72-4.25,3.19-4.25,3.19s-44.79-37.53-49.92-41.07
	C93.39,98.71,112.51,94.64,112.51,94.64L112.51,94.64z"/>
<path fill="#ADADAD" d="M99.41,104.73c0,0,16.99-0.71,16.64-11.51C115.7,82.6,104.9,78.35,96.93,80.83
	c-7.97,2.3-23.01,13.45-13.63,35.05c9.38,21.42,23.37,29.39,26.2,47.8c0,0-5.46,9.86-19.12,0.35c-16.9-11.77-6.2-38.24-10.44-44.96
	c-4.25-7.08-40.95-38.92-40.95-38.92s-30.24,39.37-18,74.92c16.95,49.21,51.74,31.98,64.61,36.76c0,0-42.13,61.96-49.57,67.09
	c0,0,24.08,8.32,47.8-18.76c0,0,5.84,9.74,7.08,20.18h10.27c4.78-26.2,51.51-64.26,49.92-82.32
	C149.33,156.77,101.89,128.63,99.41,104.73z"/>
<path fill="#E6BC00" d="M359.17,201.27c0,0,8.96,42.43,19.23,38.89c10.62-3.54,17.53-18.76,17.53-18.76l14.52,21.24
	c0,0-37,8.48-39.83,5.47c-1.21-1.14-9.32-13.79-11.52-24.66L359.17,201.27z M415.22,260.33c0,0,2.48,20.18,1.06,22.66
	c-1.24,2.3-39.48,11.33-39.48,11.33s24.96,16.46,29.74,20.54l18.06-29.92l0.71-24.61H415.22z"/>
<path fill="#E6BC00" d="M403.89,94.64c0,0-39.65,41.6-40.36,45.5c-0.71,3.72,4.25,3.19,4.25,3.19s44.79-37.53,49.92-41.07
	C422.84,98.71,403.89,94.64,403.89,94.64L403.89,94.64z"/>
<g transform="translate(6.5 5)">
	<g>
		<path id="b_1_" fill="#125ECC" d="M150.81,82.06h201.79v145.46c0,16.06-9.69,21.39-21.91,31.85l-45.92,39.41
			c-18.25,15.62-47.91,15.57-66.07,0l-46.01-39.43c-12.08-10.35-21.88-15.71-21.88-31.82V82.06z"/>
	</g>
	<path fill="#FFE600" d="M194.05,142.71c-7.96,0-14.41-6.45-14.41-14.41s6.45-14.41,14.41-14.41s14.41,6.45,14.41,14.41
		S202.01,142.71,194.05,142.71z M251.7,139.71c-7.96,0-14.41-6.45-14.41-14.41c0-7.96,6.45-14.41,14.41-14.41
		s14.41,6.45,14.41,14.41C266.11,133.26,259.66,139.71,251.7,139.71z M309.35,142.71c-7.96,0-14.41-6.45-14.41-14.41
		s6.45-14.41,14.41-14.41s14.41,6.45,14.41,14.41S317.31,142.71,309.35,142.71z M208.46,269.43c-7.96,0-14.41-6.45-14.41-14.41
		c0-7.96,6.45-14.41,14.41-14.41s14.41,6.45,14.41,14.41C222.88,262.98,216.42,269.43,208.46,269.43z M251.7,283.85
		c-7.96,0-14.41-6.45-14.41-14.41c0-7.96,6.45-14.41,14.41-14.41s14.41,6.45,14.41,14.41C266.11,277.39,259.66,283.85,251.7,283.85z
		 M294.94,269.43c-7.96,0-14.41-6.45-14.41-14.41c0-7.96,6.45-14.41,14.41-14.41c7.96,0,14.41,6.45,14.41,14.41
		C309.35,262.98,302.9,269.43,294.94,269.43z"/>
	<path fill="#D60537" d="M150.81,170.36h201.79v57.65H150.81V170.36z"/>
</g>
<path fill="#EACE00" d="M142.9,43.82c0,0,57.65-14.41,115.31-14.41s115.31,14.41,115.31,14.41l-14.41,57.65
	c0,0-50.45-14.41-100.89-14.41s-100.89,14.41-100.89,14.41L142.9,43.82z"/>
<path fill="#7A6920" d="M258.2,72.65c-7.96,0-14.41-6.45-14.41-14.41s6.45-14.41,14.41-14.41c7.96,0,14.41,6.45,14.41,14.41
	S266.16,72.65,258.2,72.65z M315.85,77.65c-7.96,0-14.41-6.45-14.41-14.41s6.45-14.41,14.41-14.41s14.41,6.45,14.41,14.41
	S323.81,77.65,315.85,77.65z M200.55,77.65c-7.96,0-14.41-6.45-14.41-14.41s6.45-14.41,14.41-14.41s14.41,6.45,14.41,14.41
	S208.51,77.65,200.55,77.65z"/>
<path fill="#ADADAD" d="M365.08,178.02c-1.59,18.06,45.14,56.12,49.92,82.32h10.27c1.24-10.44,7.08-20.18,7.08-20.18
	c23.72,27.09,47.8,18.76,47.8,18.76c-7.44-5.13-49.57-67.09-49.57-67.09c12.88-4.78,47.67,12.45,64.61-36.76
	c12.24-35.55-18-74.92-18-74.92s-36.7,31.84-40.95,38.92c-4.25,6.73,6.46,33.2-10.44,44.96c-13.66,9.51-19.12-0.35-19.12-0.35
	c2.83-18.41,16.82-26.38,26.2-47.8c9.38-21.6-5.66-32.75-13.63-35.05c-7.97-2.48-18.76,1.77-19.12,12.39
	c-0.35,10.8,16.64,11.51,16.64,11.51C414.29,128.63,366.85,156.77,365.08,178.02z"/>
<circle fill="#FFFFFF" cx="258.2" cy="204.19" r="16.93"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),pV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="116.28 0 342 342">
<rect y="0" fill="#c8102e" width="513" height="342"/>
<g>
	<rect y="0.1" fill="#012169" width="256.5" height="171"/>
	<polygon fill="#FFFFFF" points="256,0 233.4,0 160,48.9 160,0 96,0 96,48.9 22.6,0 0,0 0,22.7 46.1,53.4 0,53.4 0,117.4 46.1,117.4
		0,148.1 0,170.7 22.6,170.7 96,121.8 96,170.7 160,170.7 160,121.8 233.4,170.7 256,170.7 256,148.1 209.9,117.4 256,117.4
		256,53.4 209.9,53.4 256,22.7 	"/>
	<polygon fill="#c8102e" points="144,0 112,0 112,69.4 0,69.4 0,101.4 112,101.4 112,170.7 144,170.7 144,101.4 256,101.4 256,69.4
		144,69.4 	"/>
	<polygon fill="#c8102e" points="0,170.7 0,159.7 62.5,117.4 85.1,117.4 7.3,170.7 	"/>
	<polygon fill="#c8102e" points="7.3,0.1 85.1,53.3 62.5,53.3 0,11.1 0,0.1 	"/>
	<polygon fill="#c8102e" points="256,0.1 256,11.1 193.5,53.4 170.9,53.4 248.7,0.1 	"/>
	<polygon fill="#c8102e" points="248.7,170.7 170.9,117.4 193.5,117.4 256,159.7 256,170.7 	"/>
</g>
<g transform="translate(13 5)">
	<path fill="#ffffff" d="M303.9,94.94v99.69c0,59.81,79.75,99.69,79.75,99.69s79.75-39.88,79.75-99.69V94.94H303.9z"/>
	<path fill="#2F8F22" d="M436.37,254.44H330.93c23.13,25.08,52.72,39.88,52.72,39.88S413.24,279.52,436.37,254.44z"/>
	<circle fill="#65B5D2" cx="383.65" cy="214.56" r="39.88"/>
	<circle fill="#c8102e" cx="343.77" cy="194.63" r="19.94"/>
	<circle fill="#c8102e" cx="423.52" cy="194.63" r="19.94"/>
	<circle fill="#c8102e" cx="383.65" cy="154.75" r="19.94"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),gV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="94.05 0 342 342">
<rect y="0" fill="#FFDA44" width="513" height="342"/>
<polygon fill="#000000" points="0,193.74 513,320.93 513,214.26 0,97.08 "/>
<polyline fill="#FFFFFF" points="513,234.26 513,147.59 0,20.41 0,107.08 "/>
<g>
	<path fill="#D80027" stroke="#231F20" stroke-width="3" stroke-miterlimit="10" d="M306.4,134.01c3.87,7.14,6.07,15.33,6.07,24.02c0,21.55-13.51,39.94-32.52,47.19v-59.51
		c5.7-1.19,10-6.37,10-12.59c6.9,0,12.5-5.75,12.5-12.85h-0.42c6.9,0,12.91-5.75,12.91-12.85h-34.99V76.58l-14.99-27.71l-15,27.71
		v30.84h-34.99c0,7.1,6.01,12.85,12.91,12.85h-0.42c0,7.1,5.6,12.85,12.5,12.85c0,6.22,4.29,11.4,9.99,12.59v61.37
		c-22.09-5.39-38.48-25.3-38.48-49.05c0-8.7,2.2-16.88,6.07-24.02c-10.96,11.21-17.72,26.53-17.72,43.44
		c0,34.32,27.82,62.15,62.15,62.15s62.15-27.83,62.15-62.15C324.12,160.54,317.35,145.21,306.4,134.01z"/>
	<path fill="#D80027" stroke="#231F20" stroke-width="3" stroke-miterlimit="10" d="M198.46,226.81c0,0,20.69,27.71,66.5,27.71s66.5-27.71,66.5-27.71l13.47,28.37c0,0-21.03,27.71-79.97,27.71
		s-79.97-27.71-79.97-27.71L198.46,226.81z"/>
	<polygon fill="#D80027" stroke="#231F20" stroke-width="3" stroke-miterlimit="10" points="129.24,133.18 150.12,133.18 175.05,160.44 175.05,233.89 148.77,233.89 148.77,165.52 	"/>
	<polygon fill="#D80027" stroke="#231F20" stroke-width="3" stroke-miterlimit="10" points="400,133.18 379.12,133.18 354.19,160.44 354.19,233.89 380.46,233.89 380.46,165.52 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),vV=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342"><path fill="#d52b1e" d="M0 0h513v114H0z"/><path fill="#f9e300" d="M0 114h513v114H0z"/><path fill="#007934" d="M0 228h513v114H0z"/></svg>
`},Symbol.toStringTag,{value:"Module"})),mV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="15.39 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<polygon fill="#012a87" points="0,342 513,342 513,0 513,0 "/>
<polygon fill="#f9d90f" points="250.4,0 0,0 0,0 0,166.9 "/>
<polygon fill="#dc171d" points="140.4,118.3 152.6,139.5 177.1,139.5 164.8,160.6 177.1,181.8 152.6,181.8 140.4,203 128.2,181.8
	103.7,181.8 116,160.6 103.7,139.5 128.2,139.5 "/>
<circle fill="none" stroke="#000000" stroke-width="9" stroke-miterlimit="10" cx="140.4" cy="160.6" r="57.7"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),yV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#009b3a" width="513" height="342"/>
<polygon fill="#fedf00" points="256.5,19.3 461.4,170.7 256.5,322 50.6,170.7   "/>
<circle fill="#FFFFFF" cx="256.5" cy="171" r="80.4"/>
<path fill="#002776" d="M215.9,165.7c-13.9,0-27.4,2.1-40.1,6c0.6,43.9,36.3,79.3,80.3,79.3c27.2,0,51.3-13.6,65.8-34.3
  C297,185.7,258.7,165.7,215.9,165.7z"/>
<path fill="#002776" d="M334.9,186c0.9-5,1.5-10.1,1.5-15.4c0-44.4-36-80.4-80.4-80.4c-33.1,0-61.5,20.1-73.9,48.6
  c10.9-2.2,22.1-3.4,33.6-3.4C262.5,135.5,304.7,154.9,334.9,186z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),wV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#ffc72c" width="513" height="342"/>
<g>
	<rect y="0" fill="#00778b" width="513" height="114"/>
	<rect y="228" fill="#00778b" width="513" height="114"/>
</g>
<polygon fill="#000" points="256,171 0,342 0,0 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),_V=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#FF7415" width="513" height="342"/>
<polyline fill="#FFDA44" points="513,0 0,0 0,342 "/>
<path fill="none" stroke="#FFFFFF" stroke-width="42" stroke-miterlimit="10" d="M128.7,255.5c0,0,35,54,67.3,32.4c56.9-37.9-68.9-108.6-2.9-152.6c58.3-38.8,76.6,103.5,137.6,62.8
	c59-39.3-64.7-111.4-9.2-148.4c33.4-22.2,67.1,32.6,67.1,32.6"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),bV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="121 33.333 733.333 733.333">
<rect width="1100" height="800" fill="#ef2b2d"/>
<rect width="200" height="800" x="300" fill="#ffffff"/>
<rect width="1100" height="200" y="300" fill="#ffffff"/>
<rect width="100" height="800" x="350" fill="#002868"/>
<rect width="1100" height="100" y="350" fill="#002868"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),FV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g fill="#6da9d2">
	<rect y="238" width="513" height="104"/>
	<rect y="0" width="513" height="104"/>
</g>
<rect fill="#000" y="125.5" width="513" height="89.656"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),$V=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 24.1.3, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="3.42 0 342 342">
<rect fill="#007C30" width="513" height="342"/>
<polyline fill="#CE1720" points="0,230 513,230 513,0 513,0 0,0 0,0 "/>
<polygon fill="#FFFFFF" points="100,230 100,215.1 100,0 0,0 0,342 513,342 513,342 100,342 "/>
<g fill="#CE1720">
<polygon points="28,159.6 8.6,128.2 28,97.4 47.3,128.2 "/>
<polygon points="72.6,159.6 53.3,128.2 72.6,97.4 92,128.2 "/>
<polygon points="28,241.2 8.6,209.8 28,179 47.3,209.8 "/>
<polygon points="72.6,241.2 53.3,209.8 72.6,179 92,209.8 "/>
</g>
<g fill="none" stroke="#CE1720" stroke-width="7">
<polygon points="28,73.8 11.9,47.8 28,22.2 44,47.8 "/>
<polygon points="72.6,73.8 56.6,47.8 72.6,22.2 88.7,47.8 "/>
<polygon points="28,318 11.9,291.9 28,266.3 44,291.9 "/>
<polygon points="72.6,318 56.6,291.9 72.6,266.3 88.7,291.9 "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),xV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="94.05 0 342 342">
<rect y="0" fill="#003e87" width="513" height="342"/>
<g>
	<circle fill="#FFFFFF" cx="260.9" cy="170.9" r="118.9"/>
	<circle fill="none" stroke="#6DA544" stroke-width="18" stroke-miterlimit="10" cx="261.9" cy="173.1" r="94.5"/>
</g>
<g stroke="#000000" stroke-width="1">
	<path fill="#003e87" d="M261.9,151.5l-50.6,23.4v20c0,11.8,6.1,22.8,16.2,28.9l34.5,15.2l34.5-15.2c10-6.2,16.2-17.1,16.2-28.9v-20
		L261.9,151.5z"/>
	<rect x="211.3" y="128.1" fill="#FFDA44" width="101.3" height="46.7"/>
</g>
<g fill="#ce1127">
	<rect y="0" width="513" height="35"/>
	<rect y="306" width="513" height="35"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),OV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g fill="#ff0000">
	<rect y="0" width="142" height="342"/>
	<rect x="371" y="0" width="142" height="342"/>
	<polygon points="306.5,206 356.9,180.8 331.7,168.2 331.7,143 281.3,168.2 306.5,117.8 281.3,117.8 256.1,80
		230.9,117.8 205.7,117.8 230.9,168.2 180.5,143 180.5,168.2 155.3,180.8 205.7,206 193.1,231.2 243.5,231.2 243.5,269 268.7,269
		268.7,231.2 319.1,231.2 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),SV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="152.19 0 342 342">
<rect y="0" fill="#008000" width="513" height="342"/>
<g fill="#FFDA44">
	<polygon points="422.7,252.4 428.9,265.2 442.7,262 436.5,274.8 447.7,283.6 433.8,286.8 433.8,301 422.7,292.1
		411.6,301 411.6,286.8 397.8,283.6 408.9,274.8 402.7,262 416.6,265.2 	"/>
	<polygon points="376.1,116.1 382.3,129 396.1,125.8 389.9,138.6 401.1,147.4 387.2,150.5 387.2,164.8 376.1,155.9
		365,164.8 365.1,150.5 351.2,147.4 362.3,138.6 356.1,125.8 370,129 	"/>
	<polygon points="413.1,38.3 419.3,51.1 433.1,47.9 426.9,60.7 438.1,69.6 424.2,72.7 424.2,86.9 413.1,78 402,86.9
		402.1,72.7 388.2,69.6 399.3,60.7 393.1,47.9 407,51.1 	"/>
	<polygon points="464.9,96.7 471.1,109.5 485,106.3 478.7,119.1 489.9,128 476,131.1 476.1,145.3 464.9,136.4
		453.8,145.3 453.9,131.1 440,128 451.2,119.1 444.9,106.3 458.8,109.5 	"/>
	<polygon points="436.9,164.8 441.8,179.6 457.4,179.6 444.8,188.8 449.6,203.7 436.9,194.5 424.3,203.7 429.1,188.8
		416.5,179.6 432.1,179.6 	"/>
</g>
<path fill="#FFDA44" d="M306.8,254.7c-49.2,0-89.1-39.9-89.1-89.1s39.9-89.1,89.1-89.1c15.3,0,29.8,3.9,42.4,10.7
	C329.4,67.9,302.3,56,272.5,56c-60.5,0-109.6,49.1-109.6,109.6S212,275.3,272.5,275.3c29.8,0,56.9-11.9,76.6-31.3
	C336.5,250.8,322.1,254.7,306.8,254.7z"/>
<g>
	<path fill="#FFDA44" d="M140.4,59.5C129.7,41,109.7,28.6,86.8,28.6S44,41,33.3,59.5H140.4z"/>
	<path fill="#FFDA44" d="M140.6,59.9l-53.8,53.8L33.1,59.9c-5.1,9-8.1,19.4-8.1,30.6c0,34.2,27.7,61.9,61.9,61.9s61.9-27.7,61.9-61.9
		C148.7,79.3,145.7,68.9,140.6,59.9z"/>
	<path fill="#A2001D" d="M71.4,98.2v52.2c4.9,1.3,10.1,1.9,15.5,1.9s10.5-0.7,15.5-1.9V98.2H71.4z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),EV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 342 342">
<rect y="0" fill="#338AF3" width="513" height="342"/>
<polygon fill="#FFDA44" points="513,66.9 513,0 411.7,0 0,274.4 0,342 100.3,342 "/>
<polygon fill="#D80027" points="513,0 513,40.1 60.2,342 0,342 0,301.2 451.8,0 "/>
<polygon fill="#FFDA44" points="93.6,31.2 109.9,81.6 163,81.6 120.1,112.8 136.5,163.3 93.6,132.1 50.6,163.3 67,112.8 24.1,81.6
	77.2,81.6 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),PV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="17.1 0 342 342">
<rect fill="#d21034" width="513" height="342"/>
<g fill="#3a9927">
	<rect y="171" width="211.5" height="85.3"/>
	<rect x="300.5" y="171" width="211.5" height="85.3"/>
</g>
<polygon fill="#003082" points="0,0 0,0 0,85.3 211.5,85.3 211.5,0 300.5,0 300.5,85.3 513,85.3 513,0 513,0 "/>
<g fill="#FFFFFF">
	<rect x="300.5" y="85.3" width="211.5" height="85.3"/>
	<rect y="85.3" width="211.5" height="85.3"/>
</g>
<g fill="#ffce00">
	<polygon points="300.5,342 211.5,342 211.5,256 0,256 0,342 0,342 513,342 513,342 513,256 300.5,256 	"/>
	<polygon points="105.7,8.6 114.3,34.8 141.8,34.8 119.5,51 128.1,77.2 105.7,61 83.4,77.2 91.9,51 69.6,34.8
		97.2,34.8 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),CV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 85.333 342 342">
<rect y="85.331" fill="#da1a35" width="513" height="342"/>
<polygon fill="#009543" points="443.726,85.331 102.4,426.657 0,426.657 0,85.331 "/>
<polygon fill="#fbde4a" points="500.124,85.331 158.798,426.657 11.876,426.657 353.202,85.331 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),MV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 85.333 342 342">
<rect y="85.337" fill="#ff0000" width="513" height="342"/>
<polygon fill="#FFFFFF" points="356.174,222.609 289.391,222.609 289.391,155.826 222.609,155.826 222.609,222.609   155.826,222.609 155.826,289.391 222.609,289.391 222.609,356.174 289.391,356.174 289.391,289.391 356.174,289.391 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),DV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
	<rect y="0" fill="#FFFFFF" width="513" height="342"/>
	<rect x="342" y="0" fill="#009e60" width="171" height="342"/>
	<rect y="0" fill="#f77f00" width="171" height="342"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),AV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 85.333 342 342">
<rect y="85.332" fill="#01237a" width="513" height="342"/>
<g>
	<polygon fill="#FFFFFF" points="384,156.705 389.283,172.959 406.372,172.959 392.546,183.004 397.827,199.258 384,189.211    370.175,199.258 375.455,183.004 361.63,172.959 378.719,172.959  "/>
	<polygon fill="#FFFFFF" points="313.791,185.786 329.019,193.544 341.103,181.461 338.43,198.34 353.657,206.099    336.778,208.772 334.104,225.652 326.344,210.425 309.466,213.098 321.552,201.014  "/>
	<polygon fill="#FFFFFF" points="284.71,255.995 300.964,250.714 300.965,233.625 311.009,247.45 327.263,242.168    317.217,255.995 327.263,269.821 311.009,264.541 300.965,278.366 300.965,261.276  "/>
	<polygon fill="#FFFFFF" points="313.791,326.204 321.55,310.975 309.466,298.891 326.347,301.565 334.104,286.338    336.778,303.217 353.657,305.889 338.43,313.648 341.103,330.53 329.019,318.443  "/>
	<polygon fill="#FFFFFF" points="384,355.284 378.719,339.031 361.628,339.031 375.455,328.986 370.175,312.732 384,322.776    397.827,312.732 392.546,328.986 406.372,339.031 389.283,339.031  "/>
	<polygon fill="#FFFFFF" points="454.209,326.204 438.98,318.446 426.897,330.53 429.57,313.648 414.343,305.892    431.222,303.217 433.897,286.338 441.653,301.565 458.534,298.891 446.448,310.976  "/>
	<polygon fill="#FFFFFF" points="483.29,255.995 467.036,261.276 467.036,278.366 456.991,264.54 440.737,269.821    450.783,255.995 440.737,242.168 456.991,247.45 467.036,233.625 467.036,250.714  "/>
	<polygon fill="#FFFFFF" points="454.209,185.788 446.452,201.014 458.534,213.098 441.653,210.425 433.897,225.652    431.222,208.772 414.343,206.097 429.57,198.34 426.897,181.462 438.981,193.544  "/>
	<path fill="#FFFFFF" d="M0,186.665v16h46.069L0,233.377v7.539l57.377-38.252H80L0,255.998h112v-69.334H0z M96,255.996   H22.628L96,207.083V255.996z"/>
	<path fill="#FFFFFF" d="M176,138.665l80-53.334H144v69.334h112v-16h-46.069L256,107.951v-7.539l-57.377,38.251H176V138.665z    M160,85.333h73.372L160,134.246V85.333z"/>
	<path fill="#FFFFFF" d="M144,255.998h112l-80-53.334h22.623L256,240.917v-7.539l-46.069-30.713H256v-16H144V255.998z    M160,207.083l73.372,48.913H160V207.083z"/>
	<path fill="#FFFFFF" d="M112,85.331H0l80,53.334H57.377L0,100.413v7.539l46.069,30.712H0v16h112V85.331z M96,134.246   L22.628,85.333H96V134.246z"/>
</g>
<g>
	<polygon fill="#D80027" points="144,85.331 112,85.331 112,154.665 0,154.665 0,186.665 112,186.665 112,255.998    144,255.998 144,186.665 256,186.665 256,154.665 144,154.665  "/>
	<polygon fill="#D80027" points="80,138.665 0,85.331 0,100.413 57.377,138.665  "/>
	<polygon fill="#D80027" points="176,138.665 198.623,138.665 256,100.413 256,85.331  "/>
	<polygon fill="#D80027" points="57.377,202.665 0,240.917 0,255.998 80,202.665  "/>
	<polygon fill="#D80027" points="176,202.665 256,255.998 256,240.917 198.623,202.665  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),TV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#D80027" width="513" height="342"/>
<rect x="196" y="0" fill="#FFFFFF" width="317" height="171"/>
<rect y="0" fill="#0037A1" width="196" height="171"/>
<polygon fill="#FFFFFF" points="98,24.5 113.1,71 162,71 122.4,99.7 137.6,146.2 98,117.5 58.4,146.2 73.6,99.7 34,71 82.9,71 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),jV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#ce1126" width="513" height="342"/>
<rect y="0" fill="#007a5e" width="171" height="342"/>
<g fill="#fcd116">
	<rect x="342" y="0" width="171" height="342"/>
	<polygon points="256,102.2 273.2,155.2 329,155.2 283.9,188 301.1,241 256,208.3 210.9,241 228.1,188 183,155.2
		238.8,155.2 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),zV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="75.24 0 342 342">
<rect fill="#D80027" width="513" height="342"/>
<g fill="#FFDA44">
	<polygon points="226.8,239.2 217.1,223.6 199.2,228 211.1,213.9 201.4,198.3 218.5,205.2 230.3,191.1 229,209.5
		246.1,216.4 228.2,220.8 	"/>
	<polygon points="290.6,82 280.5,97.4 292.1,111.7 274.4,106.9 264.3,122.4 263.3,104 245.6,99.2 262.8,92.6
		261.8,74.2 273.4,88.5 	"/>
	<polygon points="236.2,25.4 234.2,43.7 251,51.3 233,55.1 231,73.4 221.8,57.4 203.9,61.2 216.2,47.5 207,31.6
		223.8,39.1 	"/>
	<polygon points="292.8,161.8 277.9,172.7 283.7,190.2 268.8,179.4 253.9,190.4 259.5,172.8 244.6,162.1 263,162
		268.6,144.4 274.4,161.9 	"/>
  <polygon points="115,46.3 132.3,99.8 188.5,99.8 143.1,132.7 160.4,186.2 115,153.2 69.5,186.2 86.9,132.7 41.4,99.8
	97.7,99.8 "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),NV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
	<rect y="0" fill="#FFDA44" width="513" height="342"/>
	<rect y="256.5" fill="#D80027" width="513" height="85.5"/>
	<rect y="171" fill="#0052B4" width="513" height="85.5"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),kV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
	<rect y="0" fill="#FFFFFF" width="513" height="342"/>
	<rect y="114" fill="#D80027" width="513" height="114"/>
	<rect y="285" fill="#0052B4" width="513" height="57"/>
	<rect y="0" fill="#0052B4" width="513" height="57"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),IV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 342 342">
<polygon fill="#FF9811" points="0,-40.8 0,-40.8 0,382.1 0,382.1 0,170.7 "/>
<rect fill="#FFFFFF" width="513" height="342"/>
<g>
  <rect fill="#0052B4" width="513" height="68.3"/>
  <rect y="136.5" fill="#0052B4" width="513" height="68.3"/>
  <rect y="273.1" fill="#0052B4" width="513" height="68.3"/>
</g>
<polygon fill="#D80027" points="256,170.7 0,342 0,0 "/>
<polygon fill="#FFFFFF" points="86.5,111.4 99.2,150.6 140.5,150.6 107.1,174.8 119.9,214.1 86.5,189.9 53.1,214.1 65.9,174.8
  32.5,150.6 73.7,150.6 "/>
</svg>

`},Symbol.toStringTag,{value:"Module"})),BV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="17.1 0 342 342">
<rect y="0" fill="#003893" width="513" height="342"/>
<g>
	<rect y="182.2" fill="#cf2027" width="513" height="41.4"/>
	<rect y="140.8" fill="#FFFFFF" width="513" height="41.4"/>
	<rect y="223.6" fill="#FFFFFF" width="513" height="41.4"/>
</g>
<g fill="#f7d116" stroke="#000000">
	<polygon points="150.4,70 157.3,91.1 179.5,91.1 161.5,104.2 168.4,125.3 150.4,112.2 132.5,125.3 139.3,104.2
		121.4,91.1 143.6,91.1 	"/>
	<polygon points="150.4,279.7 157.3,300.8 179.5,300.8 161.5,313.8 168.4,335 150.4,321.9 132.5,335 139.3,313.8
		121.4,300.8 143.6,300.8 	"/>
	<polygon points="52.8,208.8 59.7,229.9 81.9,229.9 63.9,242.9 70.8,264.1 52.8,251 34.9,264.1 41.7,242.9 23.8,229.9
		46,229.9 	"/>
	<polygon points="90.1,91 97,112.1 119.2,112.1 101.2,125.1 108.1,146.3 90.1,133.2 72.2,146.3 79,125.1 61,112.1
		83.3,112.1 	"/>
	<polygon points="23.8,162 46,162 52.8,140.9 59.7,162 81.9,162 63.9,175.1 70.8,196.2 52.8,183.2 34.9,196.2
		41.7,175.1 	"/>
	<polygon points="72.2,310.9 79,289.8 61,276.8 83.3,276.8 90.1,255.6 97,276.8 119.2,276.8 101.2,289.8 108.1,310.9
		90.1,297.9 	"/>
	<polygon points="248,208.8 241.1,229.9 218.9,229.9 236.9,242.9 230,264.1 248,251 266,264.1 259.1,242.9 277.1,229.9
		254.9,229.9 	"/>
	<polygon points="210.7,91 203.9,112.1 181.7,112.1 199.6,125.1 192.8,146.3 210.7,133.2 228.7,146.3 221.8,125.1
		239.8,112.1 217.6,112.1 	"/>
	<polygon points="277.1,162 254.9,162 248,140.9 241.1,162 218.9,162 236.9,175.1 230,196.2 248,183.2 266,196.2
		259.1,175.1 	"/>
	<polygon points="228.7,310.9 221.8,289.8 239.8,276.8 217.6,276.8 210.7,255.6 203.9,276.8 181.7,276.8 199.6,289.8
		192.8,310.9 210.7,297.9 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),LV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="11.97 0 342 342">
<rect y="0" fill="#002b7f" width="513" height="342"/>
<rect y="233.5" fill="#f9e814" width="513" height="51"/>
<g fill="#FFFFFF">
	<polygon points="168.7,86.5 181.6,126.3 223.4,126.3 189.6,150.8 202.5,190.5 168.7,166 134.9,190.5 147.8,150.8
		114,126.3 155.8,126.3 	"/>
	<polygon points="85.4,32.5 93.2,56.4 118.2,56.4 97.9,71.1 105.7,94.9 85.4,80.2 65.1,94.9 72.9,71.1 52.6,56.4
		77.7,56.4 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),RV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="99.18 0 342 342">
<rect fill="#0021ad" width="513" height="342"/>
<polyline fill="#1c8a42" points="0,0 513,0 513,342 "/>
<g fill="#FFFFFF">
	<polygon points="77.6,272 83.3,283.9 96.1,280.9 90.4,292.8 100.7,300.9 87.9,303.8 87.9,317 77.6,308.7 67.4,317
		67.4,303.8 54.6,300.9 64.9,292.8 59.1,280.9 72,283.9 	"/>
	<polygon points="40.5,173.1 46.2,185 59,182 53.3,193.8 63.6,202 50.7,204.9 50.8,218.1 40.5,209.8 30.2,218.1
		30.3,204.9 17.4,202 27.8,193.8 22,182 34.8,185 	"/>
	<polygon points="77.6,92.2 83.3,104 96.1,101.1 90.4,112.9 100.7,121.1 87.9,124 87.9,137.1 77.6,128.9 67.4,137.1
		67.4,124 54.6,121.1 64.9,112.9 59.1,101.1 72,104 	"/>
	<polygon points="123.7,155.1 129.4,167 142.2,164 136.5,175.9 146.8,184 134,186.9 134,200.1 123.7,191.9 113.5,200.1
		113.5,186.9 100.7,184 111,175.9 105.3,164 118.1,167 	"/>
	<polygon points="90.8,209.1 95.2,222.8 109.7,222.8 98,231.3 102.5,245 90.8,236.6 79.1,245 83.6,231.3 71.9,222.8
		86.3,222.8 	"/>
</g>
<g>
	<circle fill="#ffc639" cx="267.1" cy="170.7" r="74.5"/>
	<path fill="#1c8a42" d="M267.1,220.3h24.8c0,0,10.8-19,0-37.2l24.8-24.8l-12.4-24.8h-12.4c0,0-6.2,18.6-31,18.6s-31-18.6-31-18.6
		h-12.4l12.4,24.8l-12.4,24.8l12.4,12.4c0,0,12.4-24.8,37.2-12.4C267.1,183.1,277.6,198.6,267.1,220.3z"/>
</g>
<path fill="#ffc639" d="M464.4,92.2c0.6-2.9-0.2-17.6-0.2-20.7c0-21.3-13.9-39.4-33.2-45.7c5.9,12,9.2,25.4,9.2,39.7
	c0,4.8-0.4,9.5-1.1,14.1c-2.9-4.7-6.6-8.9-11.2-12.6c-17.1-13.6-40.6-14-57.9-2.5c13.4,2.9,26.3,8.9,37.7,18
	c9,7.1,16.2,16.8,21.7,26.1c0,0-17.8,10.9-31,15.1s-42.3,7.9-42.3,7.9c72,12,132-36,132-36C481.6,82.2,472.3,91.6,464.4,92.2z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),VV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#FFFFFF" width="513" height="342"/>
<path fill="#DB7D00" d="M141.7,154.7c0,0,0.2,67.1,74.7,65.3l4.5,13.9h8.9c0,0-7.4-41.1,60.1-41.5c0,0,0-27.6,27.6-27.6s41.5,0,41.5,0
	s-66-51.8,58.9-118l1.8-13.1c0,0-129.9,71-198.9,57.2c0,0,10.7,42.5-10.8,42.5c-10.8,0-9.7-8.1-32.3-8.1
	c-18.7,0-17.3,19.7-26.3,19.5c-8.9-0.2-18.8-12.3-19.6-10.2C131.1,136.7,141.7,154.7,141.7,154.7z"/>
<g fill="#006651">
	<path d="M237.2,308.1c6.9-5,13-6.6,22.4-8.3s19.4-4.4,24.6-5.8s-17.7,6.6-23.5,8.3
		C254.9,303.9,237.2,308.1,237.2,308.1z"/>
	<path d="M275.1,293.4c-1.9-11.9,2.8-24.3,13.5-29.3C291.1,272.7,283.4,287.3,275.1,293.4z"/>
	<path d="M293.3,287.2c-5.8-9.8,4-22.6,11.1-28.8C307.7,264.4,301.9,282.1,293.3,287.2z"/>
	<path d="M310.2,279.6c-6.2-8.4,1.1-23.2,8.8-29C322.1,258.8,319.1,273.8,310.2,279.6z"/>
	<path d="M327.1,269c-5.6-8-1.7-20.4,6.3-28.4C339.2,247.2,334.3,261.6,327.1,269z"/>
	<path d="M340.6,258.3c-4.7-7.5,1.1-25.4,8.6-30.4C352.5,234.5,350,253.3,340.6,258.3z"/>
	<path d="M351.4,255.5c-1.4-10.8,17.4-22.7,25.2-22.4C375.7,242,367.7,251.7,351.4,255.5z"/>
	<path d="M340.9,267.7c8.8-9.1,26-9.1,32.1-7.2C371.3,265.8,351.1,277.4,340.9,267.7z"/>
	<path d="M328.7,276.8c12.4-3.3,20.5-6.1,27.9,1.7C351.4,285.1,331.2,283.2,328.7,276.8z"/>
	<path d="M311,284.8c11.9-6.4,26.3,3,28.5,8.6C326.2,298.9,310.8,286.2,311,284.8z"/>
	<path d="M294.7,294c10.8-4.1,23.2,1.4,28.2,7.5C317.1,304.2,301.9,307.2,294.7,294z"/>
	<path d="M279.8,298.7c12.4-1.4,24.4,8,27,13.4C290.9,313.6,284.8,308.9,279.8,298.7z"/>
	<path d="M275.8,308.1c-6.9-5-13-6.6-22.4-8.3c-9.4-1.7-19.4-4.4-24.6-5.8c-5.3-1.4,17.7,6.6,23.5,8.3
		C258.1,303.9,275.8,308.1,275.8,308.1z"/>
	<path d="M237.9,293.4c1.9-11.9-2.8-24.3-13.5-29.3C221.9,272.7,229.6,287.3,237.9,293.4z"/>
	<path d="M219.7,287.2c5.8-9.8-4-22.6-11.1-28.8C205.3,264.4,211.1,282.1,219.7,287.2z"/>
	<path d="M202.8,279.6c6.2-8.4-1.1-23.2-8.8-29C190.9,258.8,193.9,273.8,202.8,279.6z"/>
	<path d="M185.9,269c5.6-8,1.7-20.4-6.3-28.4C173.8,247.2,178.7,261.6,185.9,269z"/>
	<path d="M172.4,258.3c4.7-7.5-1.1-25.4-8.6-30.4C160.5,234.5,163,253.3,172.4,258.3z"/>
	<path d="M161.6,255.5c1.4-10.8-17.4-22.7-25.2-22.4C137.3,242,145.3,251.7,161.6,255.5z"/>
	<path d="M172.1,267.7c-8.8-9.1-26-9.1-32.1-7.2C141.7,265.8,161.9,277.4,172.1,267.7z"/>
	<path d="M184.3,276.8c-12.4-3.3-20.5-6.1-27.9,1.7C161.6,285.1,181.8,283.2,184.3,276.8z"/>
	<path d="M202,284.8c-11.9-6.4-26.3,3-28.5,8.6C186.8,298.9,202.2,286.2,202,284.8z"/>
	<path d="M218.3,294c-10.8-4.1-23.2,1.4-28.2,7.5C195.9,304.2,211.1,307.2,218.3,294z"/>
	<path d="M233.2,298.7c-12.4-1.4-24.4,8-27,13.4C222.1,313.6,228.2,308.9,233.2,298.7z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),HV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="5.13 0 342 342">
	<rect y="0" fill="#11457e" width="513" height="342"/>
	<polygon fill="#d7141a" points="513,171 513,342 0,342 215,171 "/>
	<polygon fill="#FFFFFF" points="513,0 513,171 215.185,171 0,0 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),UV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
	<rect y="0" fill="#D80027" width="513" height="342"/>
	<rect y="0" fill="#000" width="513" height="114"/>
	<rect y="228" fill="#FFDA44" width="513" height="114"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),WV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="13.68 0 342 342">
	<rect y="0" fill="#12ad2b" width="513" height="342"/>
	<polygon fill="#6ab2e7" points="513,0 513,166.7 0,170.8 0,0 "/>
	<polygon fill="#FFFFFF" points="256,170.7 0,342 0,0 "/>
	<polygon fill="#d7141a" points="89.8,92.5 106.8,144.9 162,144.9 117.4,177.4 134.4,229.8 89.8,197.4 45.2,229.8 62.2,177.4
		17.6,144.9 72.8,144.9 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),GV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="23.94 0 342 342">
<rect fill="#c60c30" width="513" height="342"/>
<polygon fill="#FFFFFF" points="190,0 130,0 130,140 0,140 0,200 130,200 130,342 190,342 190,200 513,200 513,140
	190,140 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),KV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#496E2D" width="513" height="342"/>
<polygon fill="#000" points="0,110.7 0,150.7 0,190.7 0,230.7 513,230.7 513,190.7 513,150.7 513,110.7 "/>
<rect y="110.7" fill="#FFDA44" width="513" height="40"/>
<rect y="190.7" fill="#FFFFFF" width="513" height="40"/>
<rect x="196" y="0" fill="#000" width="120" height="342"/>
<rect x="196" y="0" fill="#FFDA44" width="40" height="342"/>
<rect x="274.7" y="0" fill="#FFFFFF" width="40" height="342"/>
<g>
	<circle fill="#D80027" cx="256" cy="170.7" r="123.1"/>
	<g fill="#496E2D">
		<polygon points="256,58.6 260.6,72.8 275.6,72.8 263.5,81.7 268.1,95.9 256,87.1 243.9,95.9 248.5,81.7 236.4,72.8
			251.4,72.8 		"/>
		<polygon points="190.1,80 202.3,88.8 214.4,80 209.8,94.3 221.9,103.1 206.9,103.1 202.3,117.3 197.6,103.1
			182.6,103.1 194.7,94.3 		"/>
		<polygon points="149.4,136 164.4,136 169,121.8 173.7,136 188.7,136 176.5,144.8 181.2,159.1 169,150.3 156.9,159.1
			161.5,144.8 		"/>
		<polygon points="149.4,205.3 161.5,196.5 156.9,182.2 169,191 181.2,182.2 176.5,196.5 188.7,205.3 173.7,205.3
			169,219.6 164.4,205.3 		"/>
		<polygon points="190.1,261.4 194.7,247.1 182.6,238.3 197.6,238.3 202.3,224 206.9,238.3 221.9,238.3 209.8,247.1
			214.4,261.4 202.3,252.5 		"/>
		<polygon points="256,282.8 251.4,268.5 236.4,268.5 248.5,259.7 243.9,245.4 256,254.2 268.1,245.4 263.5,259.7
			275.6,268.5 260.6,268.5 		"/>
		<polygon points="321.9,261.4 309.7,252.5 297.6,261.4 302.2,247.1 290.1,238.3 305.1,238.3 309.7,224 314.4,238.3
			329.4,238.3 317.3,247.1 		"/>
		<polygon points="362.6,205.3 347.6,205.3 343,219.6 338.3,205.3 323.3,205.3 335.5,196.5 330.8,182.2 343,191
			355.1,182.2 350.5,196.5 		"/>
		<polygon points="362.6,136 350.5,144.8 355.1,159.1 343,150.3 330.8,159.1 335.5,144.8 323.3,136 338.3,136
			343,121.8 347.6,136 		"/>
		<polygon points="321.9,80 317.3,94.3 329.4,103.1 314.4,103.1 309.7,117.3 305.1,103.1 290.1,103.1 302.2,94.3
			297.6,80 309.7,88.8 		"/>
	</g>
	<path fill="#496E2D" d="M279.3,168.7c-11-21.1-14.5-25.1-14.5-25.1s0.4-9.7,0.4-15.6c0-8.8-7.4-15.8-16.5-15.8
		c-8.6,0-15.7,2.9-16.5,11c-4.2,0.9-8.6,4.1-8.6,10.7c0,4.8,1,7.3,5.2,9.3c2.1-4.6,4.3-4.8,9.3-6.4c0.8,0.6,1.7,3,2.6,3.4l0.3,1
		c0,0-13.3,6.6-13.3,30.9c0,29.5,22,45.4,22,45.4l-1.8,0.3l-1.9,7.1h22v-7.2l11,17.5C279.3,234.9,289.2,187.6,279.3,168.7z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),qV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="215.2" fill="#D80027" width="211.5" height="126.1"/>
<rect y="0" fill="#0052B4" width="211.5" height="126.2"/>
<rect x="300.5" y="0" fill="#D80027" width="211.5" height="126.2"/>
<rect x="300.5" y="215.2" fill="#0052B4" width="211.5" height="126.1"/>
<g stroke="#FFFFFF" stroke-width="5" stroke-miterlimit="10">
	<path fill="#0052B4" d="M256,130h-49.9v49.4c0,0,19.5,6,49.9,6V130z"/>
	<path fill="#D80027" d="M206.1,179.4v6c0,27.5,22.3,49.9,49.9,49.9v-49.9C225.6,185.4,206.1,179.4,206.1,179.4z"/>
	<path fill="#0052B4" d="M256,235.3c27.5,0,49.9-22.3,49.9-49.9v-6c0,0-19.5,6-49.9,6V235.3z"/>
	<path fill="#D80027" d="M256,130v55.4c30.4,0,49.9-6,49.9-6V130H256z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),YV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="88.92 0 342 342">
<rect y="0" fill="#41662E" width="513" height="342"/>
<rect x="256.5" y="0" fill="#FFFFFF" width="256.5" height="342"/>
<g>
	<polygon fill="#D80027" points="341.5,105.3 312.1,145.7 264.6,130.3 294,170.7 264.6,211.1 312.1,195.7 341.5,236.1 341.5,186.1
		389,170.6 341.5,155.2 	"/>
	<path fill="#D80027" d="M309.9,276.7c-58.5,0-106-47.5-106-106s47.5-106,106-106c18.3,0,35.4,4.6,50.4,12.7
		c-23.5-23-55.7-37.2-91.2-37.2c-72,0-130.4,58.4-130.4,130.4s58.4,130.4,130.4,130.4c35.5,0,67.7-14.2,91.2-37.2
		C345.4,272,328.2,276.7,309.9,276.7z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),ZV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFDA44" width="513" height="342"/>
<rect y="170.7" fill="#0052B4" width="513" height="85.3"/>
<rect y="256" fill="#D80027" width="513" height="85.3"/>
<circle fill="#FFDA44" cx="256" cy="171" r="60"/>
<path fill="#4C1F00" d="M369.2,79.9c0,0-27.2-13.8-33.9-16c-6.7-2.2-49.1-13.2-49.1-7c0,10.3-13.5,12-15.5,12s-2-5.3-14.8-5.3
	s-13.7,4.8-15.8,4.8c-2.2,0-14.5-1-14.5-11.5c0-5.2-42.9,4-49.1,7c-6.1,3.1-33.9,16-33.9,16s45.8,2.7,53.9,6.2s43.8,16.5,43.8,16.5
	l-2.8,13.3h37.8l-3.8-13.3c0,0,35.1-12.7,43.8-16.5S369.2,79.9,369.2,79.9z"/>
<path fill="#57BA17" d="M217.7,171.7c0,21.1,17.2,38.3,38.3,38.3c21.1,0,38.3-17.2,38.3-38.3v-11.5h-76.5V171.7z"/>
<path fill="#338AF3" d="M256,110.5c-21.1,0-38.3,17.2-38.3,38.3v11.5h76.5v-11.5C294.3,127.7,277.1,110.5,256,110.5z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),JV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
	<rect y="0" fill="#111111" width="513" height="342"/>
	<rect y="0" fill="#368FD8" width="513" height="114"/>
	<rect y="228" fill="#FFFFFF" width="513" height="114"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),XV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#D80027" width="513" height="114"/>
<rect y="228" fill="#000" width="513" height="114"/>
<path fill="#C09300" d="M220.3,204.4c0,0,0-58.4,4.5-64.7c3.1-4.3,16.8,5.2,22.7,4.5c0,0,4.2-7.5,4.5-12c0.3-4.6-1.1-7.6-4.9-6.2
	c0,0-1.2-2.1,0.5-3.3c1.6-1.2,5.6,0.1,5.6,0.1s-0.5-1,1.6-0.9c2.9,0.2,7.2,1.4,7.4,5.6c0.2,3.1,0.3,7.7,0.4,8.7
	c0.7,6.8,2.7,8.7,2.7,8.7s18.4-9.2,22-5.2c3.3,3.8,4.5,64.7,4.5,64.7l-18.1-16.8l12.1,29.5c0,0-14.4,2.4-28.9,2.4
	c-14.5,0-31.1-4.2-31.1-4.2l13.8-28.2L220.3,204.4z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),QV=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#000" width="513" height="114"/>
<rect y="228" fill="#428823" width="513" height="114"/>
<g>
	<polygon fill="#D80027" points="256,171 0,342 0,0 	"/>
	<path fill="#D80027" d="M309.1,171c0-22.9,13.1-42.1,34.6-46.8c-3.3-0.7-6.7-1.1-10.3-1.1c-26.4,0-47.9,21.4-47.9,47.9
		s21.4,47.9,47.9,47.9c3.5,0,7-0.4,10.3-1.1C322.2,212.7,309.1,193.6,309.1,171z"/>
	<polygon fill="#D80027" points="365,129.2 375.3,160.9 408.6,160.9 381.6,180.5 391.9,212.2 365,192.6 338,212.2 348.3,180.5
		321.3,160.9 354.7,160.9 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),eH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="85.5 0 342 342">
	<g fill="#FFFFFF">
		<path d="M0,0h513v341.3H0V0z"/>
		<path d="M311.7,230L513,341.3v-31.5L369.3,230L311.7,230z"/>
		<path d="M200.3,111.3L0,0v31.5l143.7,79.8H200.3z"/>
	</g>
	<g fill="#0052B4">
		<path d="M393.8,230L513,295.7V230H393.8z M311.7,230L513,341.3v-31.5L369.3,230L311.7,230z M458.6,341.3l-147-81.7
				v81.7H458.6z"/>
		<path d="M90.3,230L0,280.2V230H90.3z M200.3,244.2v97.2H25.5L200.3,244.2z"/>
		<path d="M118.2,111.3L0,45.6v65.7H118.2z M200.3,111.3L0,0v31.5l143.7,79.8H200.3z M53.4,0l147,81.7V0H53.4z"/>
		<path d="M421.7,111.3L513,61.1v50.2H421.7z M311.7,97.1V0h174.9L311.7,97.1z"/>
	</g>
	<g fill="#D80027">
		<path d="M288,0h-64v138.7H0v64h224v138.7h64V202.7h224v-64H288V0z"/>
		<path d="M311.7,230L513,341.3v-31.5L369.3,230L311.7,230z"/>
		<path d="M143.7,230L0,309.9v31.5L200.3,230L143.7,230z"/>
		<path d="M200.3,111.3L0,0v31.5l143.7,79.8H200.3z"/>
		<path d="M368.3,111.3L513,31.5V0L311.7,111.3H368.3z"/>
	</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),tH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="22.23 0 342 342">
<rect y="0" fill="#338AF3" width="513" height="342"/>
<rect y="0" fill="#56AF35" width="513" height="171"/>
<path fill="#D80027" d="M0,342c0,0,513-171,513-171L0,0V342z"/>
<g fill="#ffc945">
	<path d="M134.7,231.5c33.6,0,60.8-27.2,60.8-60.8s-27.2-60.8-60.8-60.8s-60.8,27.2-60.8,60.8S101.1,231.5,134.7,231.5z
		 M134.7,255.8c-47,0-85.2-38.1-85.2-85.2s38.1-85.2,85.2-85.2s85.2,38.1,85.2,85.2S181.7,255.8,134.7,255.8z"/>
	<circle cx="119.5" cy="148.3" r="17.5"/>
	<circle cx="148.9" cy="158.5" r="17.5"/>
	<circle cx="134.7" cy="135.2" r="17.5"/>
	<circle cx="119.5" cy="172.7" r="17.5"/>
	<circle cx="149.9" cy="182.8" r="17.5"/>
	<circle cx="122.5" cy="198" r="17.5"/>
	<circle cx="145.9" cy="205.2" r="17.5"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),nH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 25.4.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="3.75 0 15 15">
	<path fill="#FFFFFF" d="M0,0h22.5v15H0V0z"/>
	<path fill="#D03433" d="M0,0h22.5v4H0V0z M0,11h22.5v4H0V11z"/>
	<path fill="#FBCA46" d="M0,4h22.5v7H0V4z"/>
	<path fill="#FFFFFF" d="M7.8,7h1v0.5h-1V7z"/>
	<path fill="#A41517" d="M7.2,8.5C7.2,8.8,7.5,9,7.8,9c0.3,0,0.6-0.2,0.6-0.5L8.5,7H7.1C7.1,7,7.2,8.5,7.2,8.5z M6.6,7
		c0-0.3,0.2-0.5,0.4-0.5c0,0,0,0,0,0h1.5C8.8,6.5,9,6.7,9,6.9C9,7,9,7,9,7L8.9,8.5c-0.1,0.6-0.5,1-1.1,1c-0.6,0-1-0.4-1.1-1L6.6,7
		L6.6,7z"/>
	<path fill="#A41517" d="M6.8,7.5h2V8H8.3L7.8,9L7.3,8H6.8V7.5z M5.3,6h1v3.5h-1V6z M9.3,6h1v3.5h-1V6z M6.8,5.5C6.8,5.2,7,5,7.3,5h1
		c0.3,0,0.5,0.2,0.5,0.5v0.2C8.8,5.9,8.7,6,8.5,6c0,0,0,0,0,0H7C6.9,6,6.8,5.9,6.8,5.8c0,0,0,0,0,0V5.5z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),rH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="3.75 0 15 15">
<path fill="#20AA46" d="M0,0h22.5v5H0V0z"/>
<path fill="#E92F3B" d="M0,10h22.5v5H0V10z"/>
<path fill="#FADF50" d="M0,5h22.5v5H0V5z"/>
<circle fill="#205CCA" cx="11.3" cy="7.5" r="5.2"/>
<g stroke="#FFDB3D" fill="none">
  <g stroke-width="0.5">
    <path d="M11.3,8.8l-2.1,1.5L10,7.9L8,6.4h2.5l0.8-2.3l0.8,2.3l2.6,0l-2.1,1.5l0.8,2.4L11.3,8.8z"/>
    <line x1="10.3" y1="6.4" x2="12.2" y2="6.4"/>
    <line x1="9.9" y1="7.8" x2="11.2" y2="8.8"/>
    <line x1="12" y1="6.2" x2="12.7" y2="8"/>
    <line x1="10" y1="7.9" x2="10.6" y2="6.1"/>
    <line x1="11" y1="9" x2="12.6" y2="7.9"/>
  </g>
  <g stroke-width="0.25">
    <line x1="8.7" y1="3.9" x2="9.8" y2="5.5"/>
    <line x1="13.8" y1="3.8" x2="12.8" y2="5.4"/>
    <line x1="11.3" y1="10.1" x2="11.3" y2="12"/>
    <line x1="8.9" y1="8.3" x2="7.1" y2="9"/>
    <line x1="15.5" y1="9" x2="13.7" y2="8.3"/>
  </g>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),oH=Object.freeze(Object.defineProperty({__proto__:null,default:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 408 408"><path fill="#039" d="M0 0h408v408H0V0z"/><path fill="#FC0" d="m203.963 45.231 5.089 15.653h16.542l-13.322 9.68 5.015 15.67-13.323-9.68-13.323 9.68 5.089-15.662-13.322-9.68h16.468l5.087-15.661zM135.963 63.365l5.089 15.653h16.542l-13.323 9.68 5.016 15.67-13.324-9.68-13.323 9.68 5.089-15.662-13.323-9.681h16.468l5.089-15.66zM86.096 113.231l5.089 15.653h16.542l-13.323 9.68 5.016 15.67-13.324-9.68-13.323 9.68 5.089-15.662-13.323-9.68h16.468l5.089-15.661zM67.963 181.23l5.089 15.654h16.542l-13.323 9.682 5.016 15.67-13.324-9.682-13.323 9.682 5.089-15.664-13.323-9.679h16.468l5.089-15.663zM86.096 249.231l5.089 15.654h16.542l-13.323 9.68 5.016 15.67-13.324-9.68-13.323 9.68 5.089-15.662-13.323-9.68h16.468l5.089-15.662zM135.963 299.098l5.089 15.654h16.542l-13.323 9.68 5.016 15.67-13.324-9.679-13.323 9.679 5.089-15.661-13.323-9.681h16.468l5.089-15.662zM271.963 63.365l5.089 15.653h16.542l-13.322 9.68 5.015 15.67-13.323-9.68-13.324 9.68 5.09-15.662-13.322-9.681h16.468l5.087-15.66zM321.83 113.231l5.088 15.653h16.543l-13.323 9.68 5.015 15.67-13.322-9.68-13.324 9.68 5.09-15.662-13.323-9.68h16.468l5.088-15.661zM339.963 181.231l5.089 15.653h16.542l-13.322 9.682 5.015 15.67-13.323-9.682-13.323 9.682 5.089-15.664-13.322-9.679h16.468l5.087-15.662zM321.83 249.231l5.088 15.654h16.543l-13.323 9.68 5.016 15.67-13.323-9.68-13.324 9.68 5.09-15.662-13.323-9.68h16.469l5.087-15.662zM203.963 317.231l5.089 15.654h16.542l-13.322 9.68 5.015 15.67-13.323-9.68-13.323 9.68 5.089-15.662-13.322-9.68h16.468l5.087-15.662zM271.963 299.098l5.089 15.654h16.542l-13.322 9.68 5.016 15.67-13.324-9.68-13.322 9.68 5.088-15.662-13.322-9.68h16.469l5.086-15.662z"/></svg>'},Symbol.toStringTag,{value:"Module"})),iH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="37.62 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<polygon fill="#2E52B2" points="513,129.3 513,212 203.7,212 203.7,342 121,342 121,212 0,212 0,129.3 121,129.3 121,0 203.7,0
	203.7,129.3 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),sH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#62b5e5" width="513" height="342"/>
<rect y="0" fill="#2E52B2" width="256" height="170"/>
<polygon fill="#FFFFFF" points="256,0 256,22.6 209.9,53.3 256,53.3 256,117.3 209.9,117.3 256,148 256,170.7 233.4,170.7 160,121.7
	160,170.7 96,170.7 96,121.7 22.6,170.7 0,170.7 0,148 46.1,117.3 0,117.3 0,53.3 46.1,53.3 0,22.6 0,0 22.6,0 96,48.9 96,0 160,0
	160,48.9 233.4,0 "/>
<g>
	<polygon fill="#D80027" points="144,0 112,0 112,69.3 0,69.3 0,101.3 112,101.3 112,170.7 144,170.7 144,101.3 256,101.3 256,69.3
		144,69.3 	"/>
	<polygon fill="#D80027" points="0,0 0,15.1 57.4,53.3 80,53.3 	"/>
	<polygon fill="#D80027" points="256,0 256,15.1 198.6,53.3 176,53.3 	"/>
	<polygon fill="#D80027" points="0,0 0,15.1 57.4,53.3 80,53.3 	"/>
	<polygon fill="#D80027" points="256,0 256,15.1 198.6,53.3 176,53.3 	"/>
	<polygon fill="#D80027" points="0,170.7 0,155.6 57.4,117.3 80,117.3 	"/>
	<polygon fill="#D80027" points="256,170.7 256,155.6 198.6,117.3 176,117.3 	"/>
</g>
<g>
	<path fill="#F3F3F3" d="M307.1,127.1v92c0,61.6,80.5,80.5,80.5,80.5S468,280.6,468,219v-92l-80.5-23L307.1,127.1z"/>
	<path fill="#D80027" d="M468,132.8V98.3H307.1v34.5h69v69h-69v23v0h69V296c6.9,2.5,11.5,3.5,11.5,3.5s4.6-1.1,11.5-3.5v-71.2h69v0v-23
		h-69v-69H468z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),lH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#0052B4" width="513" height="342"/>
<polygon fill="#FFFFFF" points="256,0 256,30.6 210.8,55.7 256,55.7 256,115 196.9,115 256,147.8 256,170.7 229.3,170.7 155.8,129.8
	155.8,170.7 100.2,170.7 100.2,122.1 12.7,170.7 0,170.7 0,140.1 45.2,115 0,115 0,55.7 59.1,55.7 0,22.8 0,0 26.7,0 100.2,40.8
	100.2,0 155.8,0 155.8,48.6 243.3,0 "/>
<polygon fill="#D80027" points="144,0 112,0 112,69.3 0,69.3 0,101.3 112,101.3 112,170.7 144,170.7 144,101.3 256,101.3 256,69.3
	144,69.3 "/>
<polygon fill="#0052B4" points="155.8,115 256,170.7 256,154.9 184.2,115 "/>
<polygon fill="#FFFFFF" points="155.8,115 256,170.7 256,154.9 184.2,115 "/>
<g>
	<polygon fill="#D80027" points="155.8,115 256,170.7 256,154.9 184.2,115 	"/>
	<polygon fill="#D80027" points="71.8,115 0,154.9 0,170.7 0,170.7 100.2,115 	"/>
</g>
<polygon fill="#0052B4" points="100.2,55.6 0,0 0,15.7 71.8,55.6 "/>
<polygon fill="#FFFFFF" points="100.2,55.6 0,0 0,15.7 71.8,55.6 "/>
<g>
	<polygon fill="#D80027" points="100.2,55.6 0,0 0,15.7 71.8,55.6 	"/>
	<polygon fill="#D80027" points="184.2,55.6 256,15.7 256,0 256,0 155.8,55.6 	"/>
</g>
<g transform="translate(13 4)">
	<path fill="#1F8BDE" d="M299.2,190.2v-90c0-8.5,6.5-15.3,15-15.3h120.5c8.3,0,15,6.8,15,15.3v90
			c0,75.2-75.2,105.3-75.2,105.3S299.2,265.4,299.2,190.2z"/>
	<path fill="#FFFFFF" d="M299.2,190.2v-90c0-8.5,6.5-15.3,15-15.3h120.5c8.3,0,15,6.8,15,15.3v90c0,75.2-75.2,105.3-75.2,105.3
		S299.2,265.4,299.2,190.2z M378.8,276.5c7.9-4.5,15.9-10,23.2-16.7c20.5-18.5,32.6-41.4,32.6-69.7v-90c0-0.3-120.4-0.3-120.4-0.3
		l0,90.3c0,28.3,12.1,51.2,32.6,69.7c8.3,7.5,17.6,13.9,27.6,19C375.8,278.2,377.2,277.4,378.8,276.5z"/>
	<path fill="#187536" d="M334.1,189.4c-2.6-7.9,1.7-14.3,10.1-14.3h60.5c8.2,0,12.8,6.3,10.1,14.3l-5.5,16.5c-2.6,7.9-8.9,9.2-15.8,4
		c0,0,2.6-4.8-19.1-4.8c-21.7,0-19.1,4.8-19.1,4.8c-6.1,5.7-13.1,4-15.8-4C339.6,206,334.1,189.4,334.1,189.4z"/>

	<path fill="#FFFFFF" d="M344.4,175.1c8.1,1.6,17.8-15,30.1-15c13.1,0,21.8,17.1,30.1,15c7.4-1.8,15-22.2,15-30.1
		c0-16.6-20.2-30.1-45.1-30.1c-24.9,0-45.1,13.5-45.1,30.1C329.3,153.5,336,173.5,344.4,175.1z"/>

	<path fill="#FFFFFF" d="M343,266.7c6.2,0.4,12.5-1.8,17.2-6.5l9-9c2.9-2.9,7.5-2.9,10.4,0c0,0,0,0,0,0l9,9c4.7,4.7,11,6.9,17.1,6.5
		c5.3-0.3,32.5-33.5,25.7-32.6c-4.6,0.6-9.1,2.8-12.7,6.3c0,0,0,0-0.1,0.1l-9,9c-2.9,2.9-7.5,2.9-10.4,0c0,0,0,0,0,0l-9-9
		c-8.7-8.8-22.9-8.8-31.7-0.1c0,0,0,0-0.1,0.1l-9,9c-2.9,2.9-7.5,2.9-10.4,0c0,0,0,0,0,0l-9-9c-3.5-3.5-7.8-5.6-12.3-6.3
		C311,233.1,337.8,266.4,343,266.7z M309.1,206c2.9-2.9,7.5-2.9,10.4,0c0,0,0,0,0,0l9,9c8.8,8.7,22.9,8.7,31.7,0l9-9
		c2.9-2.9,7.5-2.9,10.4,0c0,0,0,0,0,0l9,9c8.8,8.7,22.9,8.7,31.7,0l9-9c2.9-2.9,7.5-2.9,10.4,0c0,0,0,0,0,0c0,0,5.5-14.8,2.5-15.9
		c-7.9-2.9-17.2-1.2-23.5,5.2c0,0,0,0-0.1,0.1l-9,9c-2.9,2.9-7.5,2.9-10.4,0c0,0,0,0,0,0l-9-9c-8.7-8.8-22.9-8.8-31.7-0.1
		c0,0,0,0-0.1,0.1l-9,9c-2.9,2.9-7.5,2.9-10.4,0c0,0,0,0,0,0l-9-9c-6.2-6.2-15.1-8-22.8-5.5C304.1,191,309.1,206,309.1,206z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),aH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#338AF3" width="513" height="342"/>
<g>
	<polygon fill="#FFFFFF" points="256,37.9 266.1,69.1 299,69.1 272.4,88.4 282.6,119.6 256,100.3 229.4,119.6 239.6,88.4 213,69.1
		245.9,69.1 	"/>
	<polygon fill="#FFFFFF" points="123.2,170.7 154.4,160.5 154.4,127.7 173.7,154.3 204.9,144.1 185.6,170.7 204.9,197.2 173.7,187.1
		154.4,213.6 154.4,180.8 	"/>
	<polygon fill="#FFFFFF" points="256,303.5 245.9,272.3 213,272.3 239.6,253 229.4,221.7 256,241 282.6,221.7 272.4,253 299,272.3
		266.1,272.3 	"/>
	<polygon fill="#FFFFFF" points="388.8,170.7 357.6,180.8 357.6,213.6 338.3,187.1 307.1,197.2 326.4,170.7 307.1,144.1 338.3,154.3
		357.6,127.7 357.6,160.5 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),cH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="37.62 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<polygon fill="#0F61A5" points="513,214.5 206.2,214.5 206.2,342 183.7,342 141,342 118.4,342 118.4,214.5 0,214.5 0,192
	0,149.3 0,126.8 118.4,126.8 118.4,0 141,0 183.7,0 206.2,0 206.2,126.8 513,126.8 513,149.3 513,192 "/>
<polygon fill="#E50E3D" points="513,149.3 513,192 183.7,192 183.7,342 141,342 141,192 0,192 0,149.3 141,149.3 141,0 183.7,0
	183.7,149.3 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),fH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#0052B4" width="171" height="342"/>
<rect x="342" y="0" fill="#D80027" width="171" height="342"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),uH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFDA44" width="513" height="342"/>
<rect y="0" fill="#6DA544" width="513" height="114"/>
<rect y="228" fill="#0052B4" width="513" height="114"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),dH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="85.5 0 342 342">
	<g fill="#FFFFFF">
		<path d="M0,0h513v341.3H0V0z"/>
		<path d="M311.7,230L513,341.3v-31.5L369.3,230L311.7,230z"/>
		<path d="M200.3,111.3L0,0v31.5l143.7,79.8H200.3z"/>
	</g>
	<g fill="#0052B4">
		<path d="M393.8,230L513,295.7V230H393.8z M311.7,230L513,341.3v-31.5L369.3,230L311.7,230z M458.6,341.3l-147-81.7
				v81.7H458.6z"/>
		<path d="M90.3,230L0,280.2V230H90.3z M200.3,244.2v97.2H25.5L200.3,244.2z"/>
		<path d="M118.2,111.3L0,45.6v65.7H118.2z M200.3,111.3L0,0v31.5l143.7,79.8H200.3z M53.4,0l147,81.7V0H53.4z"/>
		<path d="M421.7,111.3L513,61.1v50.2H421.7z M311.7,97.1V0h174.9L311.7,97.1z"/>
	</g>
	<g fill="#D80027">
		<path d="M288,0h-64v138.7H0v64h224v138.7h64V202.7h224v-64H288V0z"/>
		<path d="M311.7,230L513,341.3v-31.5L369.3,230L311.7,230z"/>
		<path d="M143.7,230L0,309.9v31.5L200.3,230L143.7,230z"/>
		<path d="M200.3,111.3L0,0v31.5l143.7,79.8H200.3z"/>
		<path d="M368.3,111.3L513,31.5V0L311.7,111.3H368.3z"/>
	</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),hH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="75.24 0 342 342">
<rect y="0" fill="#c60a0a" width="513" height="342"/>
<polygon fill="#3E8446" points="256.5,170.7 44.5,296.8 44.5,44.5 "/>
<g>
	<polygon fill="#FFDA44" points="256.5,170.7 467.5,296.8 44.5,296.8 	"/>
	<polygon fill="#FFDA44" points="467.5,44.5 256.5,170.7 44.5,44.5 	"/>
</g>
<polygon fill="#3E8446" points="467.5,44.5 467.5,296.8 256.5,170.7 "/>
<g fill="#FFDA44">
	<polygon points="256.5,10.4 259.3,20.6 270,20.6 261.4,26.9 264.7,37.1 256.5,30.8 247.3,37.1 250.6,26.9 242,20.6
		252.7,20.6 	"/>
	<polygon points="170.1,10.4 173.4,20.6 184.1,20.6 175.5,26.9 178.8,37.1 170.1,30.8 161.4,37.1 164.7,26.9
		156.1,20.6 166.8,20.6 	"/>
	<polygon points="341.9,10.4 345.2,20.6 356,20.6 347.3,26.9 350.6,37.1 341.9,30.8 333.2,37.1 336.5,26.9 327.9,20.6
		338.6,20.6 	"/>
	<polygon points="256.5,304.2 259.3,314.4 270,314.4 261.4,320.7 264.7,330.9 256.5,324.6 247.3,330.9 250.6,320.7
		242,314.4 252.7,314.4 	"/>
	<polygon points="170.1,304.2 173.4,314.4 184.1,314.4 175.5,320.7 178.8,330.9 170.1,324.6 161.4,330.9 164.7,320.7
		156.1,314.4 166.8,314.4 	"/>
	<polygon points="341.9,304.2 345.2,314.4 356,314.4 347.3,320.7 350.6,330.9 341.9,324.6 333.2,330.9 336.5,320.7
		327.9,314.4 338.6,314.4 	"/>
</g>
<g>
	<circle fill="#c60a0a" cx="244.5" cy="170.7" r="76.2"/>
	<polygon fill="#FFDA44" points="244.5,110.1 258.1,151.9 302.1,151.9 266.5,177.7 280.1,219.5 244.5,193.7 209,219.5 222.6,177.7
		187,151.9 231,151.9 	"/>
</g>
<path fill="#FFDA44" d="M107.7,167.8c4.4,6.9,2.3,16.1-4.6,20.5s-16.1,2.3-20.5-4.6c-7.9-12.5-3.3-33-3.3-33S99.7,155.3,107.7,167.8z"
	/>
<circle fill="#A2001D" cx="99.1" cy="182.1" r="7.4"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),pH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="3.975 0 15 15">
	<path fill="#FFFFFF" d="M0.8,0h21v15h-21V0z"/>
	<path fill="#eb000e" d="M9.8,6H0v3h9.8v6h3V9h9.8V6h-9.8V0h-3V6z"/>
	<path fill="#eb000e" d="M17.3,2.7l-0.2-1.2h1l-0.2,1.2l1.2-0.2v1l-1.2-0.2l0.2,1.2h-1l0.2-1.2l-1.2,0.2v-1L17.3,2.7z M4.6,2.7L4.4,1.5
		h1L5.2,2.7l1.2-0.2v1L5.2,3.3l0.2,1.2h-1l0.2-1.2L3.4,3.5v-1C3.4,2.5,4.6,2.7,4.6,2.7z M4.6,11.7l-0.2-1.2h1l-0.2,1.2l1.2-0.2v1
		l-1.2-0.2l0.2,1.2h-1l0.2-1.2l-1.2,0.2v-1C3.4,11.5,4.6,11.7,4.6,11.7z M17.3,11.7l-0.2-1.2h1l-0.2,1.2l1.2-0.2v1l-1.2-0.2l0.2,1.2
		h-1l0.2-1.2l-1.2,0.2v-1L17.3,11.7z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),gH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="15 0 60 60">
<polygon fill="#FDEB01" points="0,0 90,60 0,60 "/>
<polygon fill="#58A846" points="90,0 90,60 0,0 "/>
<polygon fill="#ED3D24" points="50.7,33.3 60,26.6 48.5,26.6 45,15.7 41.5,26.6 30,26.6 39.3,33.3 35.7,44.3 45,37.6 54.3,44.3 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),vH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#FFFFFF" width="513" height="342"/>
<polygon fill="#D80027" points="308,0 204,0 204,118.7 0,118.7 0,222.7 204,222.7 204,342 308,342 308,222.7 513,222.7 513,118.7 308,118.7 "/>
<polygon fill="#FFDA44" points="368.6,188 394.6,205.3 394.6,136 368.6,153.3 273.3,153.3 273.3,58.1 290.6,32.1 221.4,32.1 238.7,58.1 238.7,153.3 143.4,153.3 117.4,136 117.4,205.3 143.4,188 238.7,188 238.7,283.2 221.4,309.2 290.6,309.2 273.3,283.2 273.3,188 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),mH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
	<rect y="0" fill="#FFDA44" width="513" height="342"/>
	<rect y="0" fill="#D80027" width="513" height="114"/>
	<rect y="228" fill="#496E2D" width="513" height="114"/>
	<polygon fill="#000" points="255.9,113.8 270,157.2 310.4,160.4 273.4,187.3 292.9,227.6 255.9,200.7 218.9,227.6 233,184.1 196.1,157.2
		241.8,157.2 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),yH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="230" fill="#D80027" width="513" height="112"/>
<polygon fill="#D80027" stroke="#000000" stroke-miterlimit="10" points="363.1,131.8 363.1,99.1 374,99.1 374,77.3 352.1,77.3 352.1,88.2 330.3,88.2 330.3,77.3 308.5,77.3
	308.5,99.1 319.4,99.1 319.4,131.8 297.6,131.8 297.6,55.5 308.5,55.5 308.5,33.7 286.7,33.7 286.7,44.6 275.8,44.6 275.8,33.7
	254,33.7 254,44.6 243.1,44.6 243.1,33.7 221.3,33.7 221.3,55.5 232.2,55.5 232.2,131.8 210.4,131.8 210.4,99.1 221.3,99.1
	221.3,77.3 199.5,77.3 199.5,88.2 177.7,88.2 177.7,77.3 155.9,77.3 155.9,99.1 166.8,99.1 166.8,131.8 145,131.8 145,219
	384.9,219 384.9,131.8 "/>
<path fill="#FFDA44" stroke="#000000" stroke-miterlimit="10" d="M264.9,235.5l-24.2,18.2l19.1,14.3v31.3h-23.2v9l23,0l0,7.9l-23,0v9.3H270V268l19.1-14.3L264.9,235.5z
	 M264.9,260.8l-10.1-7.1l10.1-7.1l10.1,7.1L264.9,260.8z"/>
<path fill="#000" d="M239.6,209.7v-27.9c0,0,0.1-22.3,25-22.3c24.8,0,25.7,22,25.7,22v28.2H239.6z"/>
<path fill="#000" d="M170.5,209.7v-24.3c0,0,0.1-18.7,19.6-18.7s20.2,18.4,20.2,18.4v24.5H170.5z"/>
<path fill="#000" d="M169.1,209.7v-24.3c0,0,0.1-18.7,19.6-18.7s20.2,18.4,20.2,18.4v24.5H169.1z"/>
<path fill="#000" d="M320.9,209.7v-24.3c0,0,0.1-18.7,19.6-18.7c19.5,0,20.2,18.4,20.2,18.4v24.5H320.9z"/>
<path fill="#000" d="M329.3,132v-15.7c0,0,0.1-12.1,11.3-12.1c11.3,0,11.7,11.9,11.7,11.9V132H329.3z"/>
<path fill="#000" d="M250.5,132v-23.7c0,0,0.1-18.3,14.3-18.3c14.2,0,14.7,18,14.7,18v24H250.5z"/>
<path fill="#000" d="M177.5,132v-15.7c0,0,0.1-12.1,11.3-12.1s11.7,11.9,11.7,11.9V132H177.5z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),wH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="90.63 0 342 342">
<rect fill="#D80027" width="513" height="342"/>
<polygon fill="#FFFFFF" points="513,0 513,171 0,171 0,0 "/>
<circle fill="#FFFFFF" cx="185.8" cy="171.2" r="117.8"/>
<path fill="#D80027" d="M68,171c0-65.1,52.8-117.8,117.8-117.8c65.1,0,117.8,52.8,117.8,117.8"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),_H=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#cf0d19" width="513" height="100"/>
<rect y="121" fill="#0052B4" width="513" height="100"/>
<rect y="242" fill="#1a7e25" width="513" height="100"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),bH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#FFDA44" width="512" height="342"/>
<rect x="342" fill="#6DA544" width="171" height="342"/>
<rect fill="#D80027" width="171" height="342"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),FH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#0052B4" width="171" height="342"/>
<rect x="342" y="0" fill="#D80027" width="171" height="342"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),$H=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="34.2 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#6DA544" width="513" height="113.8"/>
<rect y="227.6" fill="#D80027" width="513" height="114.4"/>
<polygon fill="#0070C8" points="126,171 0,342 0,0 "/>
<path fill="none" stroke="#000000" stroke-miterlimit="10" d="M233.8,139.4v40.4c0,35.6,35.6,35.6,35.6,35.6s35.6,0,35.6-35.6v-40.4H233.8z"/>
<polygon fill="#786145" points="264.5,179.8 274.3,179.8 278.3,205.6 260.5,205.6 "/>
<path fill="#6DA544" d="M287.2,162c0-9.8-8-14.8-17.8-14.8s-17.8,5-17.8,14.8c-4.9,0-8.9,4-8.9,8.9s4,8.9,8.9,8.9c2.9,0,32.6,0,35.6,0
	c4.9,0,8.9-4,8.9-8.9S292.1,162,287.2,162z"/>
<g fill="#FFDA00" stroke="#000000" stroke-miterlimit="10">
	<polygon points="230.7,120 232.6,123.3 236.4,123.3 234.5,126.6 236.4,129.8 232.6,129.8 230.7,133.1 228.8,129.8
		225,129.8 226.9,126.6 225,123.3 228.8,123.3 	"/>
	<polygon points="246,120 247.9,123.3 251.6,123.3 249.7,126.6 251.6,129.8 247.9,129.8 246,133.1 244.1,129.8
		240.3,129.8 242.2,126.6 240.3,123.3 244.1,123.3 	"/>
	<polygon points="261.3,120 263.2,123.3 266.9,123.3 265,126.6 266.9,129.8 263.2,129.8 261.3,133.1 259.4,129.8
		255.6,129.8 257.5,126.6 255.6,123.3 259.4,123.3 	"/>
	<polygon points="277.1,120 279,123.3 282.8,123.3 280.9,126.6 282.8,129.8 279,129.8 277.1,133.1 275.2,129.8
		271.5,129.8 273.3,126.6 271.5,123.3 275.2,123.3 	"/>
	<polygon points="293.1,120 295,123.3 298.8,123.3 296.9,126.6 298.8,129.8 295,129.8 293.1,133.1 291.2,129.8
		287.5,129.8 289.3,126.6 287.5,123.3 291.2,123.3 	"/>
	<polygon points="308.1,120 310,123.3 313.7,123.3 311.8,126.6 313.7,129.8 310,129.8 308.1,133.1 306.2,129.8
		302.4,129.8 304.3,126.6 302.4,123.3 306.2,123.3 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),xH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="3.42 0 342 342">
	<rect fill="#FFFFFF" width="513" height="342"/>
	<g fill="#0d5eaf">
		<rect y="0" width="513" height="38"/>
		<rect y="76" width="513" height="38"/>
		<rect y="152" width="513" height="38"/>
		<rect y="228" width="513" height="38"/>
		<rect y="304" width="513" height="38"/>
		<rect width="190" height="190"/>
	</g>
	<g>
		<rect y="76" fill="#FFFFFF" width="190" height="38"/>
		<rect x="76" fill="#FFFFFF" width="38" height="190"/>
	</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),OH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#0052B4" width="513" height="342"/>
<g>
	<polygon fill="#FFFFFF" points="256,0 256,117.4 209.9,117.4 256,148.1 256,170.7 233.4,170.7 160,121.8 160,170.7 96,170.7 96,121.8
		22.6,170.7 0,170.7 0,148.1 46.1,117.4 0,117.4 0,53.4 46.1,53.4 0,22.7 0,0 22.6,0 96,48.9 96,0 160,0 160,48.9 233.4,0 	"/>
	<polygon fill="#D80027" points="144,0 112,0 112,69.4 0,69.4 0,101.4 112,101.4 112,170.7 144,170.7 144,101.4 256,101.4 256,69.4
		144,69.4 	"/>
	<polygon fill="#2E52B2" points="256,22.7 256,53.4 209.9,53.4 	"/>
	<g>
		<polygon fill="#D80027" points="0,170.7 0,159.7 62.5,117.4 85.1,117.4 7.3,170.7 		"/>
	</g>
	<polygon fill="#D80027" points="7.3,0.1 85.1,53.3 62.5,53.3 0,11.1 0,0.1 	"/>
	<polygon fill="#D80027" points="256,0.1 256,11.1 193.5,53.4 170.9,53.4 248.7,0.1 	"/>
	<polygon fill="#D80027" points="248.7,170.7 170.9,117.4 193.5,117.4 256,159.7 256,170.7 	"/>
</g>
<g>
	<ellipse fill="#FFFFFF" cx="443.4" cy="233.6" rx="29" ry="43.5"/>
	<ellipse fill="#FFCE00" cx="406.9" cy="317.7" rx="22" ry="9.3"/>
	<ellipse fill="#FFCE00" cx="364" cy="317.7" rx="22" ry="9.3"/>
	<polygon fill="#39B200" points="342,190.1 385.4,277 428.9,190.1 	"/>
	<ellipse fill="#9B9B9B" cx="327.5" cy="233.6" rx="29" ry="43.5"/>
	<path fill="#757575" d="M371,175.6l-14.5,14.5h57.9l-14.5-14.5l14.5-43.5c0,0-13-29-29-29s-29,29-29,29L371,175.6z"/>
	<circle fill="#C6B56F" cx="385.4" cy="67" r="29"/>
	<circle fill="#A54A00" cx="386" cy="88.7" r="29"/>
	<circle fill="#FFFFFF" cx="443.4" cy="117.7" r="29"/>
	<circle fill="#0049FF" cx="342.2" cy="146.7" r="29"/>
	<circle fill="#0041F9" cx="429.8" cy="146.7" r="29"/>
	<circle fill="#F7D71E" cx="386" cy="233.6" r="29"/>
	<circle fill="#CEC851" cx="457.9" cy="190.1" r="29"/>
	<circle fill="#FFFFFF" cx="385.4" cy="289.5" r="29"/>
	<path fill="#7C0B29" d="M371,135.7l14.5-3.5l14.5,3.5c0,7.5-14.5,11-14.5,11S371,143.2,371,135.7z"/>
	<circle fill="#FFFFFF" cx="327.5" cy="117.4" r="29"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),SH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g>
	<rect y="0" fill="#338AF3" width="171" height="342"/>
	<rect x="342" y="0" fill="#338AF3" width="171" height="342"/>
</g>
<circle fill="#DCC26D" cx="256" cy="155.8" r="25.5"/>
<path fill="#628A40" d="M194.2,155.9c0,22.1,11.8,42.5,30.8,53.5c5.9,3.4,13.5,1.4,16.9-4.5c3.4-5.9,1.4-13.5-4.5-16.9
	c-11.5-6.6-18.5-18.9-18.5-32.1c0-6.8-5.5-12.4-12.4-12.4S194.2,149,194.2,155.9z M289.3,208c17.8-11.4,28.6-31,28.5-52.1
	c0-6.8-5.5-12.4-12.4-12.4c-6.8,0-12.4,5.5-12.4,12.4c0,12.7-6.5,24.5-17.1,31.3c-5.8,3.6-7.7,11.2-4.1,17c3.6,5.8,11.2,7.7,17,4.1
	C289,208.2,289.1,208.1,289.3,208z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),EH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#D80027" width="513" height="342"/>
<rect x="11.1" y="11.1" fill="#0052B4" width="489.7" height="319.1"/>
<path fill="#7DBEF1" d="M256,285.3c0,0,76.4-51.3,76.4-114.6S256,56,256,56s-76.4,51.3-76.4,114.6S256,285.3,256,285.3z"/>
<polygon fill="#1C8AE6" points="179.8,180.7 332.4,180.7 303.1,245.6 207.9,245.6 "/>
<path fill="#FFF042" d="M192.3,205.9c0,0,40.5,38.2,51,38.2c12.4,0,12.6-18.4,25.5-25.5c20.2-11.1,51-12.7,51-12.7l-22.8,42.8l-41,36.6
	l-46.8-39.7L192.3,205.9z"/>
<path fill="#259C7B" d="M256,157.5l-22.5,15.6l7.9-26.2l-21.8-16.5l27.4-0.5l9-25.9l9,25.9l27.4,0.5L270.6,147l7.9,26.2L256,157.5z"/>
<path fill="#8E5715" d="M249.7,144.6c-0.9,9.2-1.5,18.4-1.7,27.6c-0.3,11.9,0.3,20.7,2,26c2.2,6.6,7.2,12.9,14.2,18.9
	c5.3,4.6,10.6,8.1,14.2,10.1c3.1,1.7,7,0.6,8.7-2.4c1.7-3.1,0.6-7-2.4-8.7l0,0c-4.3-2.5-8.4-5.4-12.2-8.7
	c-5.4-4.6-9.1-9.2-10.4-13.3c-1.1-3.4-1.6-11.3-1.4-21.7c0.2-8.9,0.8-17.8,1.7-26.6c0.4-3.5-2.2-6.6-5.7-7
	C253.1,138.5,250,141.1,249.7,144.6z"/>
<path fill="#FFFFFF" d="M217.8,170.7l25.5,38.2h-25.5V170.7z"/>
<path fill="none" stroke="#D80027" stroke-width="12" stroke-miterlimit="10" d="M256,285.3c0,0,76.4-51.3,76.4-114.6S256,56,256,56s-76.4,51.3-76.4,114.6S256,285.3,256,285.3z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),PH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="18.81 0 342 342">
<rect y="0" fill="#6DA544" width="512" height="342"/>
<rect y="0" fill="#FFDA44" width="512" height="171"/>
<rect y="0" fill="#D80027" width="182" height="342"/>
<polygon fill="#000" points="98.3,109.8 113.4,156.3 162.3,156.3 122.8,185 137.9,231.5 98.3,202.8 58.8,231.5 73.9,185 34.3,156.3 83.2,156.3
	"/>
</svg>

`},Symbol.toStringTag,{value:"Module"})),CH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="27 0 600 600">
<path fill="#009E49" d="M0,0h900v600H0V0z"/>
<path fill="#FFFFFF" d="M0,0l947,300L0,600V0z"/>
<path fill="#FFD00D" d="M0,26.1L870,300L0,573.9V26.1z"/>
<path fill="#2D2D2D" d="M0,0l450,300L0,600V0z"/>
<path fill="#D3132F" d="M0,35l397.5,265L0,565V35z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),MH=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="3.5 0.5 14 14" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path fill="#FFFFFF" d="M0 0h21v15H0z"/><path fill="#ee1c25" d="M0 0h21v15H0z"/><path d="M12 7.19c-.798-.5-1 .409-1 0 0-.828.895-1.5 2-1.5s2 .672 2 1.5c-.949 0-1.044.5-1.5.5-.56 0-.702 0-1.5-.5zM13.25 7a.25.25 0 1 0 0-.5.25.25 0 0 0 0 .5zm-1.81 1.962c.228-.913-.698-.824-.31-.95.788-.257 1.703.387 2.045 1.438.341 1.05-.021 2.11-.809 2.366-.293-.903-.798-.838-.939-1.272-.173-.533-.217-.668.012-1.582zm.566 1.13a.25.25 0 1 0 .476-.154.25.25 0 0 0-.476.154zM9.58 8.977c.94-.065.57-.919.81-.588.486.67.157 1.74-.737 2.389-.894.65-2.013.632-2.5-.038.768-.558.55-1.018.92-1.286.453-.33.568-.413 1.507-.477zm-.899.888a.25.25 0 1 0 .294.405.25.25 0 0 0-.294-.405zm.312-2.652c.351.874 1.049.258.809.588-.487.67-1.606.687-2.5.038-.894-.65-1.223-1.719-.736-2.39.767.559 1.138.21 1.507.478.453.33.568.413.92 1.286zm-1.124-.58a.25.25 0 1 0-.293.404.25.25 0 0 0 .293-.404zm2.619-.524c-.722.605.08 1.078-.309.951-.788-.256-1.15-1.315-.809-2.365.342-1.05 1.257-1.695 2.045-1.439-.293.903.153 1.147.012 1.581-.173.533-.217.668-.939 1.272zm.205-1.247a.25.25 0 1 0-.475-.155.25.25 0 0 0 .475.155z" fill="#FFFFFF"/></g></svg>
`},Symbol.toStringTag,{value:"Module"})),DH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#0052B4" width="513" height="342"/>

<g fill="#FFFFFF">
	<path d="M223.4,170.7c0.3-0.3,0.5-0.6,0.8-0.9C223.9,170.1,223.7,170.4,223.4,170.7L223.4,170.7z"/>
	<polygon points="189.2,212.6 200.2,235.5 224.9,229.8 213.8,252.6 233.7,268.4 209,274 209,299.4 189.2,283.5
		169.4,299.4 169.5,274 144.7,268.4 164.6,252.6 153.5,229.8 178.3,235.5 	"/>
	<polygon points="387.1,241.1 392.3,252 404.1,249.3 398.8,260.2 408.3,267.7 396.5,270.3 396.5,282.5 387.1,274.9
		377.6,282.5 377.7,270.3 365.8,267.7 375.3,260.2 370,249.3 381.9,252 	"/>
	<polygon points="338.5,125.1 343.7,136 355.5,133.3 350.2,144.2 359.7,151.7 347.9,154.4 347.9,166.5 338.5,158.9
		329,166.5 329,154.4 317.2,151.7 326.7,144.2 321.4,133.3 333.2,136 	"/>
	<polygon points="387.1,58.9 392.3,69.8 404.1,67.1 398.8,78 408.3,85.5 396.5,88.2 396.5,100.3 387.1,92.7
		377.6,100.3 377.7,88.2 365.8,85.5 375.3,78 370,67.1 381.9,69.8 	"/>
	<polygon points="429.5,108.6 434.8,119.5 446.6,116.8 441.3,127.7 450.8,135.2 439,137.8 439,150 429.5,142.4
		420.1,150 420.1,137.8 408.3,135.2 417.8,127.7 412.5,116.8 424.3,119.5 	"/>
	<polygon points="399.2,166.5 403.3,179.2 416.6,179.2 405.8,187 409.9,199.6 399.2,191.8 388.4,199.6 392.5,187
		381.8,179.2 395.1,179.2 	"/>
	<polygon points="256,0 256,30.6 210.8,55.7 256,55.7 256,115 196.9,115 256,147.8 256,170.7 229.3,170.7 155.8,129.8
		155.8,170.7 100.2,170.7 100.2,122.1 12.7,170.7 0,170.7 0,140.1 45.2,115 0,115 0,55.7 59.1,55.7 0,22.8 0,0 26.7,0 100.2,40.8
		100.2,0 155.8,0 155.8,48.6 243.3,0 	"/>
</g>
<polygon fill="#D80027" points="144,0 112,0 112,69.3 0,69.3 0,101.3 112,101.3 112,170.7 144,170.7 144,101.3 256,101.3 256,69.3
	144,69.3 "/>
<polygon fill="#0052B4" points="155.8,115 256,170.7 256,154.9 184.2,115 "/>
<polygon fill="#FFFFFF" points="155.8,115 256,170.7 256,154.9 184.2,115 "/>
<g fill="#D80027">
	<polygon points="155.8,115 256,170.7 256,154.9 184.2,115 	"/>
	<polygon points="71.8,115 0,154.9 0,170.7 0,170.7 100.2,115 	"/>
</g>
<polygon fill="#0052B4" points="100.2,55.6 0,0 0,15.7 71.8,55.6 "/>
<polygon fill="#FFFFFF" points="100.2,55.6 0,0 0,15.7 71.8,55.6 "/>
<g fill="#D80027">
	<polygon points="100.2,55.6 0,0 0,15.7 71.8,55.6 	"/>
	<polygon points="184.2,55.6 256,15.7 256,0 256,0 155.8,55.6 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),AH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g fill="#338AF3">
	<rect y="0" width="513" height="114"/>
	<rect y="228" width="513" height="114"/>
	<polygon points="203.5,117.9 210.2,134.5 227.8,135.5 213.8,146.4 218.5,164.1 203.5,154.2 188.5,164.1 193.2,146.4
		179.2,135.5 196.8,134.5 	"/>
	<polygon points="308.5,117.9 315.2,134.5 332.8,135.5 318.8,146.4 323.5,164.1 308.5,154.2 293.5,164.1 298.2,146.4
		284.2,135.5 301.8,134.5 	"/>
	<polygon points="256,147.6 262.7,164.2 280.3,165.2 266.3,176.1 271,193.8 256,183.9 241,193.8 245.7,176.1
		231.7,165.2 249.3,164.2 	"/>
	<polygon points="203.5,177.3 210.2,193.9 227.8,194.9 213.8,205.8 218.5,223.4 203.5,213.5 188.5,223.4 193.2,205.8
		179.2,194.9 196.8,193.9 	"/>
	<polygon points="308.5,177.3 315.2,193.9 332.8,194.9 318.8,205.8 323.5,223.4 308.5,213.5 293.5,223.4 298.2,205.8
		284.2,194.9 301.8,193.9 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),TH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#FFFFFF" width="513" height="342"/>
<rect fill="#D80027" width="513" height="114"/>
<rect y="228" fill="#0052B4" width="513" height="114"/>
<g fill="#338AF3">
	<polygon points="309.3,113.2 309.3,69.2 326.8,54.8 344.5,69.2 344.5,113.2 	"/>
	<polygon points="203.7,113.2 203.7,69.2 186.4,54.8 168.5,69.2 168.5,113.2 	"/>
	<polygon points="238.9,113.2 238.9,69.2 256.5,54.8 274.1,69.2 274.1,113.2 	"/>
</g>
<g fill="#0052B4">
	<polygon points="309.3,113.2 274.1,113.2 274.1,69.2 291.6,54.8 309.3,69.2 "/>
	<polygon points="238.9,113.2 203.7,113.2 203.7,69.2 221.2,54.8 238.9,69.2 "/>
</g>
<path stroke="#D80027" stroke-width="1" fill="#FFFFFF" d="M168.5,113.2v101.9c0,24.3,14.4,46.2,35.4,59.4c21.3,13.4,42.1,14.7,52.6,14.7c10.5,0,31.4-1.7,52.6-14.8
	c21-13,35.4-35.1,35.4-59.3V113.2L168.5,113.2z"/>
<g fill="#D80027">
	<rect x="168.5" y="113.2" width="35.2" height="35.2"/>
	<rect x="238.9" y="113.2" width="35.2" height="35.2"/>
	<rect x="309.3" y="113.2" width="35.2" height="35.2"/>
	<rect x="203.7" y="148.4" width="35.2" height="35.2"/>
	<rect x="274.1" y="148.4" width="35.2" height="35.2"/>
	<rect x="168.5" y="183.6" width="35.2" height="35.2"/>
	<rect x="203.7" y="218.8" width="35.2" height="35.2"/>
	<rect x="238.9" y="183.6" width="35.2" height="35.2"/>
	<rect x="309.3" y="183.6" width="35.2" height="35.2"/>
	<rect x="274.1" y="218.8" width="35.2" height="35.2"/>
	<path d="M309.3,274.3c8.6-5.4,16.2-12.3,22-20.3h-22V274.3z"/>
	<path d="M181.7,254c5.8,8,13.3,14.9,22,20.4V254H181.7z"/>
	<path d="M238.9,254v33.7c7.2,1.2,13.3,1.5,17.6,1.5c4.3,0,10.4-0.3,17.6-1.6V254H238.9z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),jH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#A2001D" width="513" height="172"/>
<rect y="172" fill="#0052B4" width="513" height="172"/>
<polygon fill="#FFFFFF" points="381.4,251.5 270.7,237.7 159.9,251.5 159.9,85.4 381.4,85.4 	"/>
<circle fill="#0052B4" cx="270.7" cy="182.3" r="55.4"/>
<circle fill="#A2001D" cx="270.7" cy="182.3" r="27.7"/>
<polygon fill="#6DA544" points="229.1,113.1 312.2,113.1 270.7,154.6 	"/>
<rect x="256.8" y="140.8" fill="#FFDA44" width="27.7" height="83"/>
<polygon fill="#6DA544" points="314.9,215.5 226.4,215.5 159.9,251.5 381.4,251.5 	"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),zH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#D80027" width="513" height="114"/>
<rect y="228" fill="#6DA544" width="513" height="114"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),NH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#EE0000" width="513" height="171"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),kH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#6DA544" width="171" height="342"/>
<rect x="342" y="0" fill="#FF9811" width="171" height="342"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),IH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g fill="#2E52B2">
	<path d="M340.6,122.4h-56.1l-28-48.6l-28,48.6h-56.1l28,48.6l-28,48.6h56.1l28,48.6l28-48.6h56.1l-28-48.6L340.6,122.4
		z M293.2,171l-17.2,33.2h-38.9L219.8,171l17.2-33.2h38.9L293.2,171z M256.5,99.2l11.9,23.3h-23.9L256.5,99.2z M198.2,137.8h23.9
		l-10.8,21L198.2,137.8z M198.2,204.2l13-22.1l11.9,22.1H198.2z M256.5,241.7l-11.9-22.1h23.9L256.5,241.7z M315.9,204.2h-25
		l11.9-22.1L315.9,204.2z M289.8,137.8h26.1l-13,22.1L289.8,137.8z"/>
	<rect y="21.3" width="512" height="42.7"/>
	<rect y="277.3" width="512" height="42.7"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),BH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#E52D42" width="513" height="342"/>
<path fill="#FFFFFF" d="M393.3,68.2h-45.8l-33.8,80.2l-34.4-22.9c0,0-24.7-59.1-34.4-68.2c-9.7-9.7-18.7-0.6-48.9,7.8
	c-29.6,8.4-30.8,18.7-42.2,18.7c-4.8,0-19.9-17.5-27.7-22.3c-12.1-7.8-16.9-4.2-13.9,7.2c1.2,4.8,10.9,10.9,16.9,19.9
	c7.8,11.5,12.7,25.9,12.7,25.9s10.9-10.3,16.9-12.1c9-2.4,19.3,1.8,31.4,0c15.1-2.4,31.4-10.9,31.4-10.9l4.2,43.4
	c0,0-54.3,50.7-49.5,70.6s56.1,44.6,68.2,62.7c12.1,17.5-7.2,24.1-7.2,32.6s-1.8,19.9,7.2,16.3c9-3.6,10.3-18.1,18.7-31.4
	c6-9,10.3-13.9,11.5-17.5c1.8-9-23.5-32-37.4-48.9c-6.6-7.8-19.9-18.7-19.9-18.7l39.2-29.6c0,0,67.6,27.7,82.6,18.7
	c15.1-9,19.3-98.3,19.3-98.3l47-11.5L393.3,68.2z"/>
<path fill="#F8DD4E" d="M279.3,262.4c-6,0-11.5-4.8-11.5-11.5s4.8-11.5,11.5-11.5c6,0,11.5,4.8,11.5,11.5S285.3,262.4,279.3,262.4z
	 M325.1,79.6c-6,0-11.5-4.8-11.5-11.5s4.8-11.5,11.5-11.5c6,0,11.5,4.8,11.5,11.5S331.1,79.6,325.1,79.6z M325.1,170.7
	c-6,0-11.5-4.8-11.5-11.5c0-6,4.8-11.5,11.5-11.5c6,0,11.5,4.8,11.5,11.5C336,165.9,331.1,170.7,325.1,170.7z M188.2,216.5
	c-6,0-11.5-4.8-11.5-11.5c0-6,4.8-11.5,11.5-11.5c6.6,0,11.5,4.8,11.5,11.5C199.7,211.7,194.2,216.5,188.2,216.5z M233.4,79.6
	c-6,0-11.5-4.8-11.5-11.5s4.8-11.5,11.5-11.5c6,0,11.5,4.8,11.5,11.5S240.1,79.6,233.4,79.6z M256.3,170.7c-6,0-11.5-10.3-11.5-22.9
	s4.8-22.9,11.5-22.9c6,0,11.5,10.3,11.5,22.9S263,170.7,256.3,170.7z M142.3,125.5c-6,0-11.5-4.8-11.5-11.5
	c0-6.6,4.8-11.5,11.5-11.5c6.6,0,11.5,4.8,11.5,11.5C153.8,120.6,149,125.5,142.3,125.5z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),LH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
	<path fill="#181A93" d="M17.3,0h478.4v342H17.3V0z"/>
	<path fill="#FFA44A" d="M0,0h513v114H0V0z"/>
	<path fill="#1A9F0B" d="M0,228h513v114H0V228z"/>
	<path fill="#FFFFFF" d="M0,114h513v114H0V114z"/>
	<ellipse fill="#FFFFFF" cx="256.5" cy="171" rx="34.2" ry="34.2"/>
	<path fill="#181A93" d="M256.5,216.6c-25.1,0-45.6-20.5-45.6-45.6s20.5-45.6,45.6-45.6s45.6,20.5,45.6,45.6S281.6,216.6,256.5,216.6z M256.5,205.2
		c18.2,0,34.2-16,34.2-34.2s-15.9-34.2-34.2-34.2s-34.2,16-34.2,34.2S238.3,205.2,256.5,205.2z"/>
	<ellipse fill="#181A93" cx="256.5" cy="171" rx="22.8" ry="22.8"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),RH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<path fill="#FFFFFF" d="M0-0.3h513V342H0V-0.3z"/>
<path fill="#0052B4" d="M462.9,198.1c-4,0-14-5-21-9c-11-6-21-12-31.1-12s-20,6-31.1,12c-7,4-16,9-20,9s-14-5-20-9c-11-6-22-12-32.1-12
	c-9,0-20,6-31.1,12c-7,4-16,9-20,9s-13-5-20-9c-11-6-22-12-31.1-12c-10,0-21,6-32.1,12c-6,4-16,9-20,9s-13-5-20-9
	c-11-6-21-12-31.1-12s-20,6-31.1,12c-7,4-17,9-21,9s-13-5-20-9c-10-6-20-12-30.1-12v22l19,10c11,6,21,12,31.1,12s21-6,32.1-12
	c6-4,16-10,20-10s13,6,20,10c11,6,21,12,31.1,12s20-6,31.1-12c7-4,17-10,21-10s13,6,20,10c11,6,21,12,31.1,12s20-6,31.1-12
	c7-4,16-10,20-10s14,6,21,10c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-10,20-10s14,6,20,10c11,6,22,12,32.1,12s20-6,31.1-12l19-10
	v-22c-10,0-20,6-30.1,12C475.9,193.1,466.9,198.1,462.9,198.1z M0,31.7l19,10c11,6,21,12,31.1,12s21-6,32.1-12c6-4,16-10,20-10
	s13,6,20,10c11,6,21,12,31.1,12s20-6,31.1-12c7-4,17-10,21-10s13,6,20,10c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-10,20-10
	s14,6,21,10c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-10,20-10s14,6,20,10c11,6,22,12,32.1,12s20-6,31.1-12l19-10v-22
	c-10,1-20,6-30.1,12c-7,4-16,9-20,9s-14-5-21-9c-11-6-21-12-31.1-12s-20,6-31.1,12c-7,4-16,9-20,9s-14-5-20-9c-11-6-22-12-32.1-12
	s-20,6-31.1,12c-7,4-16,9-20,9s-13-5-20-9c-11-6-22-12-31.1-12s-21,6-32.1,12c-6,4-16,9-20,9s-13-5-20-9c-11-6-21-12-31.1-12
	s-20,6-31.1,12c-7,4-17,9-21,9s-13-5-20-9c-10-6-20-11-30.1-12V31.7z M462.9,86.9c-4,0-14-5-21-9c-11-6-21-12-31.1-12s-20,6-31.1,12
	c-7,4-16,9-20,9s-14-5-20-9c-11-6-22-12-32.1-12c-9,0-20,6-31.1,12c-7,4-16,9-20,9s-13-5-20-9c-11-6-22-12-31.1-12
	c-10,0-21,6-32.1,12c-6,4-16,9-20,9s-13-5-20-9c-11-6-21-12-31.1-12s-20,6-31.1,12c-7,4-17,9-21,9s-13-5-20-9c-10-6-20-12-30.1-12
	v22l19,9c11,6,21,12,31.1,12s21-6,32.1-12c6-4,16-9,20-9s13,5,20,9c11,6,21,12,31.1,12s20-6,31.1-12c7-4,17-9,21-9s13,5,20,9
	c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-9,20-9s14,5,21,9c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-9,20-9s14,5,20,9
	c11,6,22,12,32.1,12s20-6,31.1-12l19-9v-22c-10,0-20,6-30.1,12C475.9,81.8,466.9,86.9,462.9,86.9z M513,120.9c-10,1-20,6-30.1,12
	c-7,4-16,10-20,10s-14-6-21-10c-11-6-21-12-31.1-12s-20,6-31.1,12c-7,4-16,10-20,10s-14-6-20-10c-11-6-22-12-32.1-12s-20,6-31.1,12
	c-7,4-16,10-20,10s-13-6-20-10c-11-6-22-12-31.1-12s-21,6-32.1,12c-6,4-16,10-20,10s-13-6-20-10c-11-6-21-12-31.1-12s-20,6-31.1,12
	c-7,4-17,10-21,10s-13-6-20-10c-10-6-20-11-30.1-12v23c4,1,13,5,19,9c11,6,21,12,31.1,12s21-6,32.1-12c6-4,16-9,20-9s13,5,20,9
	c11,6,21,12,31.1,12s20-6,31.1-12c7-4,17-9,21-9s13,5,20,9c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-9,20-9s14,5,21,9
	c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-9,20-9s14,5,20,9c11,6,22,12,32.1,12s20-6,31.1-12c6-4,15-8,19-9V120.9z M462.9,254.2
	c-4,0-14-5-21-9c-11-6-21-12-31.1-12s-20,6-31.1,12c-7,4-16,9-20,9s-14-5-20-9c-11-6-22-12-32.1-12c-9,0-20,6-31.1,12
	c-7,4-16,9-20,9s-13-5-20-9c-11-6-22-12-31.1-12c-10,0-21,6-32.1,12c-6,4-16,9-20,9s-13-5-20-9c-11-6-21-12-31.1-12s-20,6-31.1,12
	c-7,4-17,9-21,9s-13-5-20-9c-10-6-20-12-30.1-12v22l19,9c11,6,21,12,31.1,12s21-6,32.1-12c6-4,16-9,20-9s13,5,20,9
	c11,6,21,12,31.1,12s20-6,31.1-12c7-4,17-9,21-9s13,5,20,9c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-9,20-9s14,5,21,9
	c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-9,20-9s14,5,20,9c11,6,22,12,32.1,12s20-6,31.1-12l19-9v-22c-10,0-20,6-30.1,12
	C475.9,249.2,466.9,254.2,462.9,254.2z M513,288.2c-10,1-20,6-30.1,12c-7,4-16,10-20,10s-14-6-21-10c-11-6-21-12-31.1-12
	s-20,6-31.1,12c-7,4-16,10-20,10s-14-6-20-10c-11-6-22-12-32.1-12s-20,6-31.1,12c-7,4-16,10-20,10s-13-6-20-10c-11-6-22-12-31.1-12
	s-21,6-32.1,12c-6,4-16,10-20,10s-13-6-20-10c-11-6-21-12-31.1-12s-20,6-31.1,12c-7,4-17,10-21,10s-13-6-20-10c-10-6-20-11-30.1-12
	v23c4,0,13,5,19,9c11,6,21,12,31.1,12s21-6,32.1-12c6-4,16-9,20-9s13,5,20,9c11,6,21,12,31.1,12s20-6,31.1-12c7-4,17-9,21-9
	s13,5,20,9c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-9,20-9s14,5,21,9c11,6,21,12,31.1,12s20-6,31.1-12c7-4,16-9,20-9s14,5,20,9
	c11,6,22,12,32.1,12s20-6,31.1-12c6-4,15-9,19-9V288.2z"/>
<path fill="#FFFFFF" d="M0-0.3h256v171H0V-0.3z"/>
<path fill="#496E2D" d="M278,170.7"/>
<g fill="#A2001D">
<path d="M389.8,119.9H408v78.8h-18.3L389.8,119.9L389.8,119.9z M389.8,237.7H408v75.1h-18.3L389.8,237.7L389.8,237.7z"
	/>
<path d="M0-85.3"/>
<path d="M0-85.3"/>
</g>
<g fill="#D80027">
	<path d="M144-0.3h-32v70H0v32h112v69h32v-69h112v-32H144V-0.3z"/>
	<path d="M0-0.3v15l57,39h23L0-0.3z"/>
	<path d="M256-0.3v15l-57,39h-23L256-0.3z"/>
	<path d="M0-0.3v15l57,39h23L0-0.3z"/>
	<path d="M256-0.3v15l-57,39h-23L256-0.3z"/>
	<path d="M0,170.7v-15l57-38h23L0,170.7z"/>
	<path d="M256,170.7v-15l-57-38h-23L256,170.7z"/>
</g>
<g fill="#2E52B2">
	<path d="M0,22.7v31h46L0,22.7z M96-0.3v49l-73-49C23-0.3,96-0.3,96-0.3z"/>
	<path d="M256,22.7v31h-46L256,22.7z M160-0.3v49l73-49C233-0.3,160-0.3,160-0.3z"/>
	<path d="M0,22.7v31h46L0,22.7z M96-0.3v49l-73-49C23-0.3,96-0.3,96-0.3z"/>
	<path d="M256,22.7v31h-46L256,22.7z M160-0.3v49l73-49C233-0.3,160-0.3,160-0.3z"/>
	<path d="M0,147.7v-30h46L0,147.7z M96,170.7v-49l-73,49H96z"/>
	<path d="M256,147.7v-30h-46L256,147.7z M160,170.7v-49l73,49H160z"/>
</g>
<path fill="#5DA51E" stroke="#45602C" stroke-width="4" stroke-miterlimit="10" d="M462.8,91.5h-29.1l25.7-25.7c4.5-4.4,4.5-11.4,0-15.8l-3.4-3.4c-4.4-4.4-11.4-4.4-15.8,0l-25.9,25.9V37.4
	c0-6.2-5.1-11.3-11.3-11.3h-4.7c-6.2,0-11.3,5.1-11.3,11.3v31.7l-23.5-23.8c-4.7-4.7-12.2-4.7-16.9,0l-3.6,3.6
	c-4.7,4.7-4.7,12.4,0,17.2l25,25.4h-30.6c-6,0-10.9,4.9-10.9,10.9v4.6c0,6,4.9,10.9,10.9,10.9H369l-20.7,20.7
	c-4.4,4.4-4.4,11.4,0,15.8l3.4,3.4c4.4,4.4,11.4,4.4,15.8,0l19.6-19.6V167c0,6.1,5.1,11.1,11.3,11.3h4.7c6.2,0,11.3-5.1,11.3-11.3
	v-28.3l22.2,22.6c4.7,4.7,12.4,4.7,17.1,0l3.6-3.6c4.7-4.7,4.7-12.4,0-17.2L435.2,118h27.6c5.9,0,10.7-4.9,10.9-10.9v-4.6
	C473.7,96.4,468.8,91.5,462.8,91.5z"/>
<path fill="#5DA51E" d="M0,0"/>
<path fill="#E2DD24" stroke="#525625" stroke-width="4" stroke-miterlimit="10" d="M439.2,249.1h-79.8c0,0-0.9-13.4-6-21.8c-6.2-10.4-13.9-28.1-1.4-36.7c15.9-10.9,33.7,0.8,48.2,0.8
	c11.8,0.1,26.9-14,45-0.8c12.2,8.9,3.9,28.2-1.3,36.7C436.9,238.8,439.2,249.1,439.2,249.1z"/>
</svg>`},Symbol.toStringTag,{value:"Module"})),VH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#CE1126" width="513" height="114"/>
<rect y="228" fill="#000" width="513" height="114"/>
<g fill="#547C31">
	<path d="M219.2,160.7c-0.1,0-0.2,0-0.2,0l0,0h-29.1c1.5-5.7,6.6-9.9,12.8-9.9v-19.9c-18.3,0-33.1,14.9-33.1,33.1v16.2
		v0.3H219c0.1,0,0.2,0,0.2,0c1.8,0,3.3,1.5,3.3,3.3v6.6h-66.2v19.9h86.1v-26.5C242.4,171.1,232,160.7,219.2,160.7z"/>
	<polygon points="268.8,190.5 268.8,130.9 249,130.9 249,210.4 282.1,210.4 282.1,190.5 	"/>
	<polygon points="335,190.5 335,130.9 315.2,130.9 315.2,190.5 308.6,190.5 308.6,170.7 288.7,170.7 288.7,210.4
		348.3,210.4 348.3,190.5 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),HH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="512" height="342"/>
<rect y="0" fill="#6DA544" width="513" height="114"/>
<g fill="#D80027">
	<rect y="227.9" width="513" height="114"/>
	<path d="M278.8,134.8c0.1,2,8.7,26.2,4.4,39.4c-6.6,20.3-15.8,21.8-19.8,24.5v-64.7l-6.9-4.2l-6.9,4.2v64.7
		c-4-2.7-12.4-2.4-19.8-24.5c-4.3-12.7,5.7-37.3,5.8-39.2c0,0-9.5,8.1-15.8,24c-5.9,14.8,1.9,49.6,29.5,54.8
		c2.3,0.4,4.7,5.6,7.2,5.6c2.1,0,4.1-5.2,6-5.5c28.4-4.6,35-41.7,29.9-55.6C287,143.7,278.8,134.8,278.8,134.8z"/>
</g>
<g fill="#FFFFFF" opacity="0.5">
	<rect x="44.6" y="98.9" width="22.3" height="24.4"/>
	<rect y="98.9" width="22.3" height="24.4"/>
	<rect x="89.2" y="98.9" width="22.3" height="24.4"/>
	<rect x="133.8" y="98.9" width="22.3" height="24.4"/>
	<rect x="178.4" y="98.9" width="22.3" height="24.4"/>
	<rect x="223" y="98.9" width="22.3" height="24.4"/>
	<rect x="267.7" y="98.9" width="22.3" height="24.4"/>
	<rect x="312.3" y="98.9" width="22.3" height="24.4"/>
	<rect x="356.9" y="98.9" width="22.3" height="24.4"/>
	<rect x="401.5" y="98.9" width="22.3" height="24.4"/>
	<rect x="446.1" y="98.9" width="22.3" height="24.4"/>
	<rect x="490.7" y="98.9" width="22.3" height="24.4"/>
	<rect x="44.6" y="216.9" width="22.3" height="25.5"/>
	<rect y="216.9" width="22.3" height="25.5"/>
	<rect x="89.2" y="216.9" width="22.3" height="25.5"/>
	<rect x="133.8" y="216.9" width="22.3" height="25.5"/>
	<rect x="178.4" y="216.9" width="22.3" height="25.5"/>
	<rect x="223" y="216.9" width="22.3" height="25.5"/>
	<rect x="267.7" y="216.9" width="22.3" height="25.5"/>
	<rect x="312.3" y="216.9" width="22.3" height="25.5"/>
	<rect x="356.9" y="216.9" width="22.3" height="25.5"/>
	<rect x="401.5" y="216.9" width="22.3" height="25.5"/>
	<rect x="446.1" y="216.9" width="22.3" height="25.5"/>
	<rect x="490.7" y="216.9" width="22.3" height="25.5"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),UH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="32.49 0 342 342">
<rect y="0" fill="#0052B4" width="513" height="342"/>

<polygon fill="#FFFFFF" points="513,210.6 202.2,210.6 202.2,341.3 183.7,341.3 141,341.3 122.4,341.3 122.4,210.6 0,210.6 0,192
	0,149.3 0,130.8 122.4,130.8 122.4,0 141,0 183.7,0 202.2,0 202.2,130.8 513,130.8 513,149.3 512,192 "/>
<polygon fill="#D80027" points="513,149.3 513,192 183.7,192 183.7,341.3 141,341.3 141,192 0,192 0,149.3 141,149.3 141,0 183.7,0
	183.7,149.3 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),WH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<polygon fill="#FFFFFF" points="342,0 170.7,0 0,0 0,341.3 170.7,341.3 342,341.3 512,341.3 512,0 "/>
<rect y="0" fill="#6DA544" width="171" height="342"/>
<rect x="342" y="0" fill="#D80027" width="171" height="342"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),GH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<polygon fill="#D80027" points="301.8,171 513,30.2 513,0 467.7,0 256.5,140.8 45.3,0 0,0 0,30.2 211.2,171 0,311.8 0,342 45.3,342
	256.5,201.2 467.7,342 513,342 513,311.8 "/>
<polygon fill="#FFDA44" points="233.7,44.6 256,50.2 278.3,44.6 282.3,23.7 267.4,30.2 256,14.8 244.6,30.2 229.7,23.7 "/>
<path fill="#D80027" d="M233.7,44.6c0,0-4,12.9-4,29.9c0,27.9,26.3,41.3,26.3,41.3s26.3-15.5,26.3-41.3c0-15.4-4-29.9-4-29.9
	s-8.1-5-22.3-5S233.7,44.6,233.7,44.6z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),KH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#6DA544" width="513" height="342"/>
<polygon fill="#000" points="215.9,171 0,314.6 0,26.8 "/>
<polygon fill="#000" points="513,26.8 513,314.6 296.1,171 "/>
<polygon fill="#0052B4" points="513,26.8 296.1,171 513,314.6 513,342 471.9,342 256,197.4 40.1,342 0,342 0,314.6
	215.9,171 0,26.8 0,0 40.1,0 256,143.9 471.9,0 513,0 "/>
<polygon fill="#FFDA44" points="513,26.8 296.1,171 513,314.6 513,342 471.9,342 256,197.4 40.1,342 0,342 0,314.6
	215.9,171 0,26.8 0,0 40.1,0 256,143.9 471.9,0 513,0 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),qH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#000" width="513" height="114"/>
<rect y="228" fill="#6DA544" width="513" height="114"/>
<polygon fill="#D80027" points="256.5,170.7 0,341.3 0,0 "/>
<polygon fill="#FFFFFF" points="77.9,139.5 85.8,155.9 103.6,151.8 95.6,168.3 109.9,179.6 92.1,183.6 92.2,201.9 77.9,190.4
	63.7,201.9 63.7,183.6 45.9,179.6 60.2,168.3 52.3,151.8 70,155.9 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),YH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="512" height="342"/>
<circle fill="#D80027" cx="256.5" cy="171" r="96"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),ZH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#000" width="512" height="90.579"/>
<rect y="251" fill="#496E2D" width="513" height="91"/>
<rect y="114" fill="#A2001D" width="513" height="114"/>
<g fill="#FFFFFF">
	<polygon points="323.3,54.5 297.7,42.7 256,137 214.3,42.7 188.7,54.5 240.5,170.7 188.7,286.9 214.3,298.7 256,204.3
		297.7,298.7 323.3,286.9 271.5,170.7 	"/>
	<path d="M273.4,65.6c-9.9-10.8-17.4-17-17.4-17s-7.5,6.2-17.4,17v210.1c9.9,10.8,17.4,17,17.4,17s7.5-6.2,17.4-17V65.6
		z"/>
</g>
<g fill="#A2001D">
	<path d="M209,105.9v129.5c10.5,18.5,23.3,33.7,32.9,43.8V62.1C232.3,72.2,219.5,87.4,209,105.9z"/>
	<path d="M303,105.9c-10.5-18.5-23.3-33.7-32.9-43.8v217.2c9.6-10.1,22.4-25.3,32.9-43.8V105.9z"/>
</g>
<path fill="#000" d="M303,105.9v129.5c10.6-18.8,18.8-41,18.8-64.8S313.6,124.7,303,105.9z"/>
<path fill="#000" d="M209,105.9v129.5c-10.6-18.8-18.8-41-18.8-64.8S198.4,124.7,209,105.9z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),JH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85 0 342 342">
<g fill="#D80027">
	<rect y="0" width="513" height="342"/>
	<circle cx="256" cy="170.7" r="170.7"/>
</g>
<polygon fill="#FFDA44" points="382.4,170.7 330.8,195 358.3,245 302.2,234.3 295.1,290.9 256,249.2 216.9,290.9 209.8,234.3
	153.7,245 181.2,195 129.6,170.7 181.2,146.4 153.7,96.3 209.8,107.1 216.9,50.4 256,92.1 295.1,50.4 302.2,107.1 358.3,96.3
	330.8,146.4 "/>
<circle fill="#D80027" cx="257.4" cy="170.7" r="71.6"/>
<g fill="#FFDA44">
	<path d="M214.2,170.7c-2.1,0-4.1,0.1-6.2,0.3c0.1,12,4.4,22.9,11.6,31.5c3.8-10.3,9.5-19.6,16.7-27.7
		C229.4,172.1,222,170.7,214.2,170.7z"/>
	<path d="M240.8,217.2c5.2,1.9,10.8,2.9,16.6,2.9c5.8,0,11.4-1,16.6-2.9c-2.8-11.1-8.7-21-16.6-28.8
		C249.5,196.2,243.6,206.1,240.8,217.2z"/>
	<path d="M300.2,146c-8.5-14.8-24.5-24.7-42.8-24.7c-18.3,0-34.2,9.9-42.8,24.7c15.6,0.1,30.2,4.3,42.8,11.6
		C270,150.3,284.6,146,300.2,146z"/>
	<path d="M278.5,174.8c7.2,8,12.9,17.4,16.7,27.7c7.2-8.5,11.5-19.5,11.6-31.5c-2-0.2-4.1-0.3-6.2-0.3
		C292.9,170.7,285.4,172.1,278.5,174.8z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),XH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#D80027" width="513" height="342"/>
<g>
	<rect y="0" fill="#0052B4" width="513" height="114"/>
	<rect y="228" fill="#0052B4" width="513" height="114"/>
</g>
<polygon fill="#FFFFFF" points="303.5,196.6 303.5,178.8 291.6,178.8 291.6,155.1 279.7,143.2 267.9,155.1 267.9,131.3 256,119.5
	244.1,131.3 244.1,155.1 232.3,143.2 220.4,155.1 220.4,178.8 208.5,178.8 208.5,196.6 196.6,196.6 196.6,214.4 315.4,214.4
	315.4,196.6 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),QH=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="75 0 300 300">
<path fill="#CE1126" d="M0,0h450v300H0V0z"/>
<g fill="#FCD116">
	<circle cx="227.6" cy="161.2" r="56.2"/>
	<polygon points="254.1,73.4 230.4,99.4 259,105.9 	"/>
	<polygon points="202.6,73.6 197.8,106.7 226.3,98.7 	"/>
	<polygon points="296.9,100.3 262.2,108.8 282.3,132.5 	"/>
	<polygon points="158.6,98.5 174.1,131.2 194.3,108.5 	"/>
	<polygon points="317.6,143.8 283.2,133.9 288.8,163.4 	"/>
	<polygon points="135.6,141.2 167.5,161 172.7,133.3 	"/>
</g>
<path fill="#003F87" d="M0,175h450v125H0V175z"/>
<path fill="#FFFFFF" d="M0,267c15,0,30,13,45,13s30-13,45-13s30,13,45,13s30-13,45-13s30,13,45,13s30-13,45-13s30,13,45,13s30-13,45-13
	s30,13,45,13s30-13,45-13v-21c-15,0-30,13-45,13s-30-13-45-13s-30,13-45,13s-30-13-45-13s-30,13-45,13s-30-13-45-13s-30,13-45,13
	s-30-13-45-13s-30,13-45,13s-30-13-45-13V267z M0,224c15,0,30,13,45,13s30-13,45-13s30,13,45,13s30-13,45-13s30,13,45,13
	s30-13,45-13s30,13,45,13s30-13,45-13s30,13,45,13s30-13,45-13v-21c-15,0-30,13-45,13s-30-13-45-13s-30,13-45,13s-30-13-45-13
	s-30,13-45,13s-30-13-45-13s-30,13-45,13s-30-13-45-13s-30,13-45,13s-30-13-45-13V224z M0,181c15,0,30,13,45,13s30-13,45-13
	s30,13,45,13s30-13,45-13s30,13,45,13s30-13,45-13s30,13,45,13s30-13,45-13s30,13,45,13s30-13,45-13v-21c-15,0-30,13-45,13
	s-30-13-45-13s-30,13-45,13s-30-13-45-13s-30,13-45,13s-30-13-45-13s-30,13-45,13s-30-13-45-13s-30,13-45,13s-30-13-45-13V181z"/>
<path fill-rule="evenodd" clip-rule="evenodd" fill="#FCD116" d="M183.2,48.3l-1.1-5.3l22.4-3.7c0,0-30.1-7.1-40-10.7c-14.3-5.1-16.3-12.1-16.3-12.1s44.7,11,64.8,11
	c4.3,0,12.8,10.7,12.8,10.7s14.8-14.9,21.9-15.4c32.1-2.3,66.6-6.4,66.6-6.4s-10,6.7-16,8.5c-16.2,4.9-50.6,11.7-50.6,11.7l-4.8,7.5
	H277l-14.4,4.3l7.4,6.9c0,0-7.8-4.1-18.1-2.1c-7.1,1.3-15.4,6-22.9,8c-18.7,4.8-29.9-12.8-29.9-12.8S183.2,48.3,183.2,48.3z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),eU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="5.13 0 342 342">
<rect y="0" fill="#0052B4" width="513" height="342"/>
<rect y="0" fill="#FFDA44" width="513" height="85.5"/>
<rect y="85.5" fill="#FFFFFF" width="513" height="85.5"/>
<rect y="171" fill="#D80027" width="513" height="85.5"/>
<polygon fill="#6DA544" points="256.5,171 0,342 0,0 "/>
<g fill="#FFFFFF">
	<path d="M68.6,170.7c0-24.9,17.5-45.6,40.8-50.7c-3.6-0.8-7.3-1.2-11.1-1.2c-28.7,0-51.9,23.3-51.9,51.9
		s23.3,51.9,51.9,51.9c3.8,0,7.5-0.4,11.1-1.2C86.1,216.3,68.6,195.5,68.6,170.7z"/>
	<polygon points="108.9,126.1 111.6,134.6 120.6,134.6 113.3,139.9 116.1,148.4 108.9,143.2 101.6,148.4 104.4,139.9
		97.2,134.6 106.1,134.6 	"/>
	<polygon points="108.9,148.4 111.6,156.9 120.6,156.9 113.3,162.2 116.1,170.7 108.9,165.4 101.6,170.7 104.4,162.2
		97.2,156.9 106.1,156.9 	"/>
	<polygon points="108.9,170.7 111.6,179.2 120.6,179.2 113.3,184.4 116.1,192.9 108.9,187.7 101.6,192.9 104.4,184.4
		97.2,179.2 106.1,179.2 	"/>
	<polygon points="108.9,192.9 111.6,201.4 120.6,201.4 113.3,206.7 116.1,215.2 108.9,209.9 101.6,215.2 104.4,206.7
		97.2,201.4 106.1,201.4 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),tU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#D80027" width="513" height="342"/>
<polyline fill="#6DA544" points="512,0 0,0 0,342 "/>
<polygon fill="#FFDA44" points="307.7,0 0,194.5 0,342 206.9,342 513,148.5 513,0 "/>
<polygon fill="#000000" points="513,0 385.2,0 0,249.4 0,341 126.2,342 513,91.6 "/>
<g fill="#FFFFFF">
	<polygon points="141.1,187 172.3,211 204.6,188.8 191.5,225.8 222.6,249.7 183.4,248.6 170.2,285.6 159.1,248
		119.9,246.9 152.2,224.7 	"/>
	<polygon points="310.6,70.8 341.8,94.7 374.1,72.5 361,109.5 392.1,133.4 352.9,132.3 339.7,169.3 328.6,131.7
		289.4,130.6 321.8,108.4 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),nU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="71.82 0 342 342">
<rect y="0" fill="#91DC5A" width="513" height="342"/>
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g fill="#0052B4">
	<rect y="0" width="513" height="57.188"/>
	<rect y="284.1" width="513" height="57.177"/>
</g>
<rect y="79.9" fill="#D80027" width="513" height="181.582"/>
<circle fill="#FFFFFF" cx="190.33" cy="171" r="65.668"/>
<polygon fill="#D80027" points="190.3,105 205.1,150.3 252.8,150.3 214.2,178.4 229,223.9 190.3,195.7 151.7,223.8 166.5,178.4
	127.9,150.3 175.6,150.3 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),rU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 342 342">
<rect x="0" fill="#FFFFFF" width="342" height="342"/>
<g fill="#000000">
	<rect x="238.7" y="215.2" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -84.344 242.3636)" width="23.4" height="15.6"/>
	<rect x="211.2" y="242.7" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -111.8675 231.0089)" width="23.4" height="15.6"/>
	<rect x="271.8" y="248.2" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -98.0097 275.4712)" width="23.4" height="15.6"/>
	<rect x="244.2" y="275.8" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -125.5836 264.0074)" width="23.4" height="15.6"/>
	<rect x="255.2" y="231.7" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -91.1976 258.867)" width="23.4" height="15.6"/>
	<rect x="227.7" y="259.3" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -118.7256 247.5085)" width="23.4" height="15.6"/>
	<rect x="245.4" y="56.9" transform="matrix(0.7071 -0.7071 0.7071 0.7071 11.9322 204.8196)" width="15.6" height="62.3"/>
	<rect x="215.1" y="79.1" transform="matrix(0.7071 -0.7071 0.7071 0.7071 1.1122 184.1938)" width="15.6" height="23.4"/>
	<rect x="242.6" y="106.6" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -10.3145 211.6879)" width="15.6" height="23.4"/>
	<rect x="248.1" y="46" transform="matrix(0.7071 -0.7071 0.7071 0.7071 34.1495 197.8311)" width="15.6" height="23.4"/>
	<rect x="275.6" y="73.6" transform="matrix(0.7071 -0.7071 0.7071 0.7071 22.6842 225.4057)" width="15.6" height="23.4"/>
	<rect x="63.5" y="238.7" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -169.9343 129.4781)" width="15.6" height="62.3"/>
	<rect x="93.8" y="255.4" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -159.1095 150.0916)" width="15.6" height="23.4"/>
	<rect x="66.3" y="227.8" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -147.6547 122.5258)" width="15.6" height="23.4"/>
	<rect x="96.6" y="205.6" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -136.8372 143.1472)" width="15.6" height="62.3"/>
	<rect x="40.2" y="63.7" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -29.6489 71.3957)" width="62.3" height="15.6"/>
	<rect x="56.7" y="80.2" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -36.5029 87.8853)" width="62.3" height="15.6"/>
	<rect x="73.2" y="96.8" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -43.3906 104.4559)" width="62.3" height="15.6"/>
</g>
<circle fill="#D80027" cx="170.3" cy="170.7" r="62.3"/>
<path fill="#0052B4" d="M232.2,178.3c-9.6-25.4-44.3-25-61.8,1.3c-17.6,26.3-43.8,16.9-61.6,0.7c4.6,29.9,30.4,52.7,61.6,52.7
	C202.2,233,228.4,209.1,232.2,178.3z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),oU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#6DA544" width="513" height="114"/>
<rect y="228" fill="#D80027" width="513" height="114"/>
<polygon fill="#000" points="167,227.6 0,341.3 0,0 167,113.8 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),iU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="117.99 0 342 342">

<rect y="0" fill="#0052B4" width="513" height="342"/>
<circle fill="#6DA544" cx="384" cy="96.5" r="29.7"/>
<rect x="332.1" y="89" fill="#D80027" width="103.9" height="44.5"/>
<path fill="#496E2D" d="M435.9,170.7L435.9,170.7L435.9,170.7z"/>
<path fill="#FFDA44" d="M332.1,200.3V230h15.6c9.4,9.2,22.2,14.8,36.3,14.8c14.1,0,27-5.7,36.3-14.8h0.8h14.8v-29.7H332.1z"/>
<path fill="#338AF3" d="M332.1,126.1v44.5c0,39.8,51.9,51.9,51.9,51.9s51.9-12.2,51.9-51.9v-44.5L332.1,126.1L332.1,126.1z"/>

<g fill="#F3F3F3">
	<path d="M384,149.9c-13,0-13,11.9-26,11.9s-13-11.9-26-11.9v20.8c13,0,13,11.9,26,11.9s13-11.9,26-11.9
		c13,0,13,11.9,26,11.9c13,0,13-11.9,26-11.9v-20.8c-13,0-13,11.9-26,11.9C397,161.8,397,149.9,384,149.9z"/>
	<path d="M384,108.3c-13,0-13,11.9-26,11.9s-13-11.9-26-11.9v20.8c13,0,13,11.9,26,11.9s13-11.9,26-11.9
		c13,0,13,11.9,26,11.9c13,0,13-11.9,26-11.9v-20.8c-13,0-13,11.9-26,11.9C397,120.2,397,108.3,384,108.3z"/>
</g>
<polygon fill="#FFFFFF" points="256,0 256,22.6 209.9,53.3 256,53.3 256,117.3 209.9,117.3 256,148 256,170.7 233.4,170.7 160,121.7
	160,170.7 96,170.7 96,121.7 22.6,170.7 0,170.7 0,148 46.1,117.3 0,117.3 0,53.3 46.1,53.3 0,22.6 0,0 22.6,0 96,48.9 96,0 160,0
	160,48.9 233.4,0 "/>
<g fill="#D80027">
	<polygon points="144,0 112,0 112,69.3 0,69.3 0,101.3 112,101.3 112,170.7 144,170.7 144,101.3 256,101.3 256,69.3
		144,69.3 	"/>
	<polygon points="0,0 0,15.1 57.4,53.3 80,53.3 	"/>
	<polygon points="256,0 256,15.1 198.6,53.3 176,53.3 	"/>
	<polygon points="0,0 0,15.1 57.4,53.3 80,53.3 	"/>
	<polygon points="256,0 256,15.1 198.6,53.3 176,53.3 	"/>
	<polygon points="0,170.7 0,155.6 57.4,117.3 80,117.3 	"/>
	<polygon points="256,170.7 256,155.6 198.6,117.3 176,117.3 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),sU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
	<path fill="#36B6CC" d="M0,0h513v342H0V0z"/>
	<circle fill="#FFD400" cx="256.5" cy="170.9" r="68.4"/>
	<path fill="#FFD400" d="M256.5,251.5l-27.9,41.7l-7.1-49.7L178.3,269l15.2-47.8l-50,4.2l34.4-36.5L131,170.9l46.8-18l-34.4-36.5
		l50,4.2l-15.2-47.8l43.2,25.4l7.1-49.7l27.9,41.7l27.9-41.7l7.1,49.7l43.2-25.4l-15.2,47.8l50-4.2L335.1,153l46.8,17.9l-46.8,18
		l34.4,36.5l-50-4.2l15.2,47.8l-43.2-25.4l-7.1,49.7C284.4,293.2,256.5,251.5,256.5,251.5z M256.5,250.7c44.1,0,79.9-35.8,79.9-79.9
		S300.6,91,256.5,91s-79.9,35.8-79.9,79.9S212.4,250.7,256.5,250.7z M22.8,28.3c0-3.2,2.4-5.7,5.7-5.7h11.3c3.2,0,5.7,2.4,5.7,5.7
		v11.3c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H28.5c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1C22.8,39.7,22.8,28.3,22.8,28.3z
		 M22.8,74c0-3.2,2.4-5.7,5.7-5.7h11.3c3.2,0,5.7,2.4,5.7,5.7v11.3c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H28.5
		c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1V74z M22.8,119.6c0-3.2,2.4-5.7,5.7-5.7h11.3c3.2,0,5.7,2.4,5.7,5.7v11.3
		c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H28.5c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1C22.8,130.9,22.8,119.6,22.8,119.6z
		 M22.8,165.2c0-3.2,2.4-5.7,5.7-5.7h11.3c3.2,0,5.7,2.4,5.7,5.7v11.3c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H28.5
		c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1C22.8,176.5,22.8,165.2,22.8,165.2z M22.8,210.9c0-3.2,2.4-5.7,5.7-5.7h11.3
		c3.2,0,5.7,2.4,5.7,5.7v11.3c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H28.5c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1V210.9z
		 M22.8,256.5c0-3.2,2.4-5.7,5.7-5.7h11.3c3.2,0,5.7,2.4,5.7,5.7v11.3c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H28.5
		c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1V256.5z M22.8,302.1c0-3.2,2.4-5.7,5.7-5.7h11.3c3.2,0,5.7,2.4,5.7,5.7v11.3
		c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H28.5c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1V302.1z M45.6,279.3
		c0-3.2,2.4-5.7,5.7-5.7h11.3c3.2,0,5.7,2.4,5.7,5.7v11.3c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H51.3c-3.1,0-5.7-2.5-5.7-5.6
		c0,0,0-0.1,0-0.1V279.3z M45.6,233.7c0-3.2,2.4-5.7,5.7-5.7h11.3c3.2,0,5.7,2.4,5.7,5.7V245c0.1,3.1-2.4,5.7-5.6,5.7
		c-0.1,0-0.1,0-0.2,0H51.3c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1V233.7z M45.6,188c0-3.2,2.4-5.7,5.7-5.7h11.3
		c3.2,0,5.7,2.4,5.7,5.7v11.3c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H51.3c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1V188z
		 M45.6,142.4c0-3.2,2.4-5.7,5.7-5.7h11.3c3.2,0,5.7,2.4,5.7,5.7v11.3c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H51.3
		c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1C45.6,153.7,45.6,142.4,45.6,142.4z M45.6,96.8c0-3.2,2.4-5.7,5.7-5.7h11.3
		c3.2,0,5.7,2.4,5.7,5.7v11.3c0.1,3.1-2.4,5.7-5.6,5.7c-0.1,0-0.1,0-0.2,0H51.3c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1
		C45.6,108.1,45.6,96.8,45.6,96.8z M45.6,51.2c0-3.2,2.4-5.7,5.7-5.7h11.3c3.2,0,5.7,2.4,5.7,5.7v11.3c0.1,3.1-2.4,5.7-5.6,5.7
		c-0.1,0-0.1,0-0.2,0H51.3c-3.1,0-5.7-2.5-5.7-5.6c0,0,0-0.1,0-0.1V51.2z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),lU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#0052B4" width="513" height="342"/>
<g fill="#D80027">
	<rect y="0.1" width="513" height="90.7"/>
	<rect x="0" y="251.3" width="513" height="90.7"/>
</g>
<circle fill="#FFFFFF" cx="256.5" cy="171" r="65.9"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),aU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g fill="#D80027">
	<rect y="0.2" width="513" height="90.7"/>
	<rect x="0.5" y="251.3" width="512.5" height="90.7"/>
</g>
<polygon fill="#6DA544" points="290.3,193.5 256,130.7 221.7,193.5 247.4,193.5 247.4,210.7 264.6,210.7 264.6,193.5 "/>
	<path fill="#14AF5A" d="M241.3,213.1c4.4-4.4,4.4-11.6-0.1-16c0,0,0,0,0,0l4.7,4.7c-5.2-4.7-12.2-6.6-19.1-5.3l-23.5,5.9
		c-6.1,1.5-6.8-0.4-1.8-4.2l27.1-20.3c5.1-3.8,4.2-6.9-2.3-6.9h-11c-6.4,0-7-2.3-1.5-5.1l25.3-12.7c5.6-2.8,5.1-5.1-1.5-5.1h-11
		c-6.4,0-7.4-3.1-2.3-6.9l27.1-20.3c5.6-3.8,12.9-3.8,18.5,0l27.1,20.3c5.1,3.8,4.2,6.9-2.3,6.9h-11c-6.4,0-7,2.3-1.5,5.1l25.3,12.7
		c5.6,2.8,5.1,5.1-1.5,5.1h-11c-6.4,0-7.4,3.1-2.3,6.9l27.1,20.3c5.1,3.8,4.4,5.7-1.8,4.2l-23.5-5.9c-6.8-1.3-13.9,0.6-19.1,5.3
		l4.7-4.7c-4.4,4.4-4.5,11.5-0.1,16c0,0,0,0,0,0l6.8,6.8c4.4,4.4,3.1,8-3.3,8h-45.8c-6.2,0-7.7-3.6-3.3-8
		C234.5,220,241.3,213.1,241.3,213.1z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),cU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#55B2FF" width="513" height="342"/>
<polygon fill="#F3F3F3" points="148.5,298.1 364.5,298.1 256.5,43.9 "/>
<polygon fill="#333333" points="186,272.7 256.5,112.4 327,272.7 "/>
<polygon fill="#FFDA44" points="148.5,298.1 364.5,298.1 256.5,196.4 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),fU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="51.3 0 342 342">
<rect y="0" fill="#D80027" width="513" height="342"/>
<rect y="0" fill="#0052B4" width="513" height="171"/>
<path fill="#FFDA44" d="M149.3,98.1c0-14-11.3-25.3-25.3-25.3c-6.5,0-12.4,2.4-16.9,6.4V64.4h8.4V47.5h-8.4v-8.4H90.3v8.4h-8.4v16.9
	h8.4v14.9c-4.5-4-10.4-6.4-16.9-6.4c-14,0-25.3,11.3-25.3,25.3c0,7.5,3.3,14.2,8.4,18.8v14.9h84.3v-14.9
	C146.1,112.3,149.3,105.5,149.3,98.1z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),uU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="42.75 0 342 342">
<rect x="0" y="0" fill="#FFDA44" width="513" height="342"/>
<rect x="222.6" y="22.3" fill="#A2001D" width="267.1" height="296.8"/>
<rect x="22.3" y="22.3" fill="#D80027" width="200.3" height="296.8"/>
<rect x="200.3" y="0" fill="#FFDA44" width="22.3" height="342"/>
<rect x="22.3" y="22.3" fill="#6DA544" width="89" height="296.8"/>
<rect x="111.3" y="22.3" fill="#FF9811" width="89" height="296.8"/>
<g>
	<path fill="#FFDA44" d="M368.2,156.8c-1.4-2,0-37.9,0-37.9c0.9-7.4,0.1-8.4,1-11.4c0.9-2.9,5.4-11.6,5.4-11.6s-6-2.3-10.3-0.6
		c-4.3,1.7-24.7-7.5-31.2,3.4c-4.4,7-23.6,16.2-24.6,14c-1-2.2-5.9-5-6.9-2.9s-0.7,13.9,0,16c0.8,2.6,9.8,2,12.3,3.1
		c3.7,1.8,12.2,8.2,11.9,10.7c-0.3,2.5-22.5-6-24.2-4.5c-1.4,1.2-1.9,13.2-0.4,15c1.8,2.1,23.4,5.6,25,7.5c1.6,1.9-13.1,7.4-12.3,25
		c0.7,14.7,8,17.4,8,17.4s-2.4,3.6-7.8,3.1c-6.2-0.6-27.4-17.7-27.4-17.7S283.2,76.4,290.3,64c4.9-8.5-22.7,10.1-22.7,50.8v36.2
		c0,6.6-1.4,22.4,2.6,34c0,0-0.4,46.9,1.5,49.6s12.7,2.2,14.8,0s0-30,0-30c7.7,0.2,18.3,17.5,32.5,16.4c20.6-1.6,28.7-9.9,34.3-5
		c8.1,7.1,5.5,23.2,0.4,31.5c-2.2,3.5-14.3,4.7-15.7,7.6c-1.4,2.9,0.5,5.4,0.5,5.4h29.7c0,0,1.4-20.5,2.7-26.1
		c1.3-5.7-0.6-10.7,5.9-10.4c23.5,1.1,39.8-15.3,45.5-8c3.2,4.1,5.6,29.9,3.3,33.3c-2.2,3.4-13.8,2.8-15.2,6.7
		c-1.4,4,0.8,4.4,0.8,4.4h29.7c0,0-0.4-21.2,2.5-27.7c2.9-6.5,4.9-10.4,9.3-17.2c4.4-6.8,11.3-15.7,11.3-36.2
		c0-14.2-8.1-22.8-8.1-22.8h-38.9C402.9,156.7,369.6,158.8,368.2,156.8z"/>
	<path fill="#FFDA44" d="M232.2,32.3c10.7-10.6,20.2-2.7,22.2,2.1c1.9,4.8,2.1,8.2,2.8,13.6c0.9,6.9,4.9,14,4.9,14s-7.1-3.8-14.7-4.2
		c-4.7-0.3-9-0.6-13.6-2.5C228.1,53,222.1,42.4,232.2,32.3z"/>
	<path fill="#FFDA44" d="M480.6,32.2c10.7,10.6,2.8,20.2-2,22.2c-4.8,2-8.2,2.1-13.6,2.8c-6.9,0.9-14,5-14,5s3.7-7.1,4.2-14.7
		c0.3-4.7,0.6-9.1,2.4-13.6C459.8,28.2,470.4,22.1,480.6,32.2z"/>
	<path fill="#FFDA44" d="M480.7,309.1c-10.7,10.6-20.2,2.6-22.2-2.2c-1.9-4.8-2.1-8.2-2.7-13.6c-0.8-6.9-4.9-14.1-4.9-14.1
		s7,3.8,14.7,4.3c4.7,0.3,9,0.6,13.6,2.5C484.9,288.4,490.9,299.1,480.7,309.1z"/>
	<path fill="#FFDA44" d="M232.5,309c-10.6-10.7-2.7-20.2,2.1-22.2c4.8-1.9,8.2-2.1,13.6-2.8c6.9-0.9,14-4.9,14-4.9s-3.8,7.1-4.2,14.7
		c-0.3,4.7-0.6,9-2.5,13.6C253.2,313.1,242.6,319.2,232.5,309z"/>
	<path fill="none" stroke="#FFDA44" stroke-width="6" stroke-miterlimit="10" d="M446.9,162.4c0,0,7.5-2.6,8.4-16.1c0.6-8.6-19.8-16-39-11.5c-19.7,4.6-34-3.1-34-14.6
		c0-22.9,29.7-16.2,38.9-11.3c9.1,4.9,29.7,23.5,35.1,9.4"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),dU=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="5.13 0 342 342" >
	<rect fill="#FFFFFF" x="0" y="0" width="513" height="342"/>
	<g fill="#bf0a30">
		<rect x="0" y="0" width="513" height="31.1"/>
		<rect x="0" y="62.2" width="513" height="31.1"/>
		<rect x="0" y="124.5" width="513" height="31.1"/>
		<rect x="0" y="186.8" width="513" height="31.1"/>
		<rect x="0" y="249.3" width="513" height="31.1"/>
		<rect x="0" y="310.9" width="513" height="31.1"/>
	</g>
	<rect fill="#002868" width="155.6" height="155.6"/>
	<polygon fill="#FFFFFF" points="77.8,30.2 88.5,63.1 123.1,63.1 95.1,83.5 105.8,116.4 77.8,96.1 49.8,116.4 60.5,83.5 32.5,63.1
	  67.1,63.1 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),hU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#0052B4" width="513" height="114"/>
<rect y="227.6" fill="#6DA544" width="513" height="114"/>
<path fill="#000000" d="M245.2,171l7.7-23.1c2-5.9,5.1-6,7.1,0l7.7,23.1l19.4,29.1c1.7,2.6,1.3,6.3-1.2,8c0,0-6.9,8-29.5,8
	s-29.5-8-29.5-8c-2.4-2-2.9-5.4-1.2-8L245.2,171z"/>
<path fill="#000000" d="M256.5,171c-12.5,0-22.6-10.1-22.6-22.6c0-12.5,10.1-22.6,22.6-22.6s22.6,10.1,22.6,22.6C279.1,160.9,268.9,171,256.5,171z
	 M256.5,171c6.2,0,11.3-16.3,11.3-22.6c0-6.2-5.1-11.3-11.3-11.3c-6.2,0-11.3,5.1-11.3,11.3C245.2,154.7,250.2,171,256.5,171z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),pU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#6DA544" width="513" height="342"/>
<rect y="0" fill="#FFDA44" width="513" height="114"/>
<rect y="228" fill="#D80027" width="513" height="114"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),gU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect y="0" fill="#D80027" width="513" height="114"/>
<rect y="228" fill="#338AF3" width="513" height="114"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),vU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g fill="#A2001D">
	<rect y="0" class="st1" width="513" height="127.6"/>
	<rect x="0" y="214.4" class="st1" width="513" height="127.6"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),mU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#000" width="513" height="342"/>
<rect y="0" fill="#D80027" width="513" height="114"/>
<rect y="228" fill="#496E2D" width="513" height="114"/>
<g fill="#FFFFFF">
	<polygon points="281.4,150.7 290.4,163 304.9,158.3 295.9,170.7 304.9,183 290.4,178.3 281.4,190.6 281.4,175.4
		266.9,170.7 281.4,166 	"/>
	<path d="M257,201.5c-17,0-30.9-13.8-30.9-30.9s13.8-30.9,30.9-30.9c5.3,0,10.3,1.3,14.7,3.7
		c-6.9-6.7-16.2-10.8-26.6-10.8c-21,0-38,17-38,38s17,38,38,38c10.3,0,19.7-4.1,26.6-10.8C267.3,200.2,262.3,201.5,257,201.5z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),yU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<polygon fill="#D80027" points="0,0.3 0,171.2 0,342 513,342 513,171.2 513,0.3 "/>
<path fill="#20661B" d="M359.8,148.9h-73.3l-22.7-69.7l-22.7,69.7h-73.3l59.3,43.1l-22.7,69.7l59.3-43.1l59.3,43.1L300.5,192
	L359.8,148.9z M243.7,186.6l7.7-23.6h24.8l7.7,23.6l0,0v0l-20.1,14.6L243.7,186.6L243.7,186.6L243.7,186.6z M271.6,148.9H256l7.8-24
	L271.6,148.9z M295.9,177.9l-4.8-14.9h25.3L295.9,177.9z M236.6,163l-4.8,14.9L211.3,163H236.6z M231.3,224.8l7.8-24l12.6,9.2
	L231.3,224.8z M275.8,209.9l12.6-9.2l7.8,24L275.8,209.9z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),wU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.333" fill="#FFFFFF" width="512" height="341.333"/>
<rect y="85.333" fill="#c70000" width="512" height="170.667"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),_U=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFDA44" width="513" height="342"/>
<rect x="342" y="0" fill="#D80027" width="171" height="342"/>
<rect y="0" fill="#0052B4" width="171" height="342"/>
<path fill="#AF7F59" d="M206.2,129.1h33.2L256,79.3l16.6,49.8h33.2v99.6L256,262l-49.8-33.2V129.1z M239.4,162.4v49.8h33.2v-49.8H239.4
	z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),bU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#E6BE53" width="513" height="342"/>
<rect x="20" y="20" fill="#E01D24" width="473" height="302"/>
	<path fill="#E6BE53" d="M248.5,112.9c4.4,4.4,11.6,4.4,16,0l-4.7,4.7l22.7-22.7c4.9-4.5,12.1-5.6,18.2-2.8l2.1,1
		c5.7,2.9,6.7,8.7,2.3,13.1l4.7-4.7L287,124.3c-4.5,4.9-5.6,12.1-2.8,18.2l1,2.1c2.9,5.7,5.1,15.4,5.1,21.6v-11.3
		c0,6.2,4.4,9.1,10.2,6.2l2.1-1c5.7-2.9,6.7-8.7,2.3-13.1l4.7,4.7c-4.4-4.4-4.4-11.6,0-16c0,0,0,0,0,0l-4.7,4.7
		c5.2-5.5,9.6-11.6,13.1-18.2l1-2.1c2.9-5.7,6.3-15.1,7.9-21.2l5.8-23.3c1.5-6,5.9-6.8,9.6-1.8l20.2,26.9c3.8,5.1,6.9,14,6.9,20.6
		v22.4c0,6.3-2.2,15.8-5.1,21.7l-1,2.1c-3.5,6.6-7.9,12.7-13.1,18.2l-6.8,6.8c-5.4,5.2-11.5,9.6-18.2,13.1l-2.1,1
		c-5.7,2.9-15.5,5.1-21.6,5.1c-6.2,0-6.9,2.2-1.1,5.1l2.1,1c5.7,2.9,13.8,8.7,18.2,13.1l-4.7-4.7c4.4,4.4,11.6,4.4,16,0l-4.7,4.7
		c4.4-4.4,11.6-4.4,16,0c0,0,0,0,0,0L339,226c4.6,4.9,5.7,12.1,2.9,18.2l-1,2.1c-2.9,5.7-10.4,10.2-16.4,10.2
		c-7.5-0.3-14.8-2-21.6-5.1l-2.1-1c-6.5-3.6-11.8-8.9-15.4-15.4l-1-2.1c-2.9-5.7-8.7-6.7-13.1-2.3l4.7-4.7
		c-4.4,4.7-5.2,11.8-1.8,17.3l10.3,15.4c3.4,5.1,2,12.1-3.1,15.5l-15.4,10.3c-5.7,3.4-12.8,3.4-18.6,0l-15.4-10.3
		c-5.1-3.4-6.5-10.3-3.1-15.5l10.3-15.4c3.4-5.5,2.6-12.6-1.8-17.3l4.7,4.7c-4.4-4.4-10.2-3.6-13.1,2.3l-1,2.1
		c-2.9,5.7-9.5,12.4-15.4,15.4l-2.1,1c-5.7,2.9-15.5,5.1-21.6,5.1c-6.9-0.3-13.1-4.2-16.4-10.2l-1-2.1c-2.8-6.1-1.6-13.3,2.9-18.2
		l-4.7,4.7c4.4-4.4,11.6-4.4,16,0c0,0,0,0,0,0l-4.7-4.7c4.4,4.4,11.6,4.4,16,0l-4.7,4.7c5.5-5.2,11.6-9.6,18.2-13.1l2.1-1
		c5.7-2.9,5-5.1-1.1-5.1c-7.5-0.3-14.8-2-21.6-5.1l-2.1-1c-6.6-3.5-12.7-7.9-18.2-13.1l-6.8-6.8c-5.2-5.4-9.6-11.5-13.1-18.2l-1-2.1
		c-3.1-6.8-4.9-14.2-5.1-21.7V121c0-6.3,3.1-15.6,6.9-20.6l20.2-26.9c3.8-5.1,8.1-4.3,9.6,1.8l5.8,23.3c2,7.3,4.6,14.4,7.9,21.2
		l1,2.1c2.9,5.7,8.7,13.8,13.1,18.2l-4.7-4.7c4.4,4.4,4.4,11.6,0,16c0,0,0,0,0,0l4.7-4.7c-4.4,4.4-3.6,10.2,2.3,13.1l2.1,1
		c5.7,2.9,10.2,0,10.2-6.2v11.3c0-6.2,2.2-15.7,5.1-21.6l1-2.1c2.8-6.1,1.7-13.2-2.8-18.2l-22.7-22.7l4.7,4.7
		c-4.4-4.4-3.6-10.2,2.3-13.1l2.1-1c6.1-2.8,13.2-1.7,18.2,2.8l22.7,22.7L248.5,112.9z M230.5,72.2c-4.4-4.4-3.2-9.5,2.8-11.5
		l12.4-4.2c6-2,15.5-2,21.5,0l12.4,4.2c6,2,7.2,7.1,2.8,11.5l-6.8,6.8c-5.3,4.7-12.1,7.5-19.2,7.9c-6.2,0-14.8-3.5-19.2-7.9
		C237.3,79,230.5,72.2,230.5,72.2z"/>
	<path fill="#215F90" d="M233.9,200.2c0,6.2,1.7,6.4,4.2,0.5c0,0,7.1-23.2,18.4-23.2c11.3,0,18.6,23.6,18.6,23.6c2.2,5.7,4,5.3,4-1.1
		v-11.2c0-18.7-10.1-33.9-22.6-33.9c-12.5,0-22.6,15.2-22.6,33.9V200.2z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),FU=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 0 72 72">
<path d="M0,0H108V72H0z" fill="#003787"/>
<path d="M0,0H108L60,48V72H48V48z" fill="#fff"/>
<circle cx="54" cy="30" r="8" fill="#f9d90f"/>
<path d="M44,30H64L54,48z" fill="#fff"/>
<path d="M54,48 38,33H70z" fill="#cf142b"/>
</svg>`},Symbol.toStringTag,{value:"Module"})),$U=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="64.853 85.333 341.333 341.333">
<path fill="#6DA544" d="M512,426.666V85.329c-238.65,0-512,0-512,0v341.337L512,426.666L512,426.666z"/>
<path fill="#D80027" d="M512,85.331H0v170.666c0,0,273.35,0,512,0V85.331z"/>
<rect y="85.334" fill="#FFFFFF" width="181.793" height="341.337"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),xU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#1E509C" width="513" height="342"/>
<path fill="#FFFFFF" d="M513,176.1V81.3L0,342L513,176.1z"/>
<path fill="#F18D36" d="M513,0v81.3L0,342L513,0z"/>
<polygon fill="#FFFFFF" points="126.7,99.3 118.9,45.2 111.2,99.3 90.4,75.6 101.1,107.2 69.6,96.5 93.2,117.3 39.1,125 93.2,132.7
	69.6,153.5 101.1,142.8 90.4,174.4 111.2,150.7 118.9,204.8 126.7,150.7 147.4,174.4 136.8,142.8 168.3,153.5 144.7,132.7
	198.7,125 144.7,117.3 168.3,96.5 136.8,107.2 147.4,75.6 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),OU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.333" fill="#FFDA44" width="512" height="341.337"/>
<g>
	<polygon fill="#D80027" points="383.875,426.662 256,252.286 282.827,426.662  "/>
	<polygon fill="#D80027" points="133.565,85.33 256,252.286 230.314,85.33  "/>
	<polygon fill="#D80027" points="229.171,426.662 256,252.286 128.124,426.662  "/>
	<polygon fill="#D80027" points="0,85.33 0,212.9 256,252.286 28.333,85.33  "/>
	<polygon fill="#D80027" points="0,426.662 18.212,426.662 256,252.286 0,291.67  "/>
	<polygon fill="#D80027" points="256,252.286 512,212.9 512,85.33 483.669,85.33  "/>
	<polygon fill="#D80027" points="281.686,85.33 256,252.286 378.434,85.33  "/>
	<polygon fill="#D80027" points="512,426.662 512,291.671 256,252.286 493.787,426.662  "/>
	<circle fill="#D80027" cx="256" cy="252.29" r="59.359"/>
</g>
<circle fill="#FFDA44" cx="256" cy="252.29" r="44.522"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),SU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#FFDA44" width="512" height="341.337"/>
<rect y="85.331" fill="#6DA544" width="170.663" height="341.337"/>
<rect x="341.337" y="85.331" fill="#D80027" width="170.663" height="341.337"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),EU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#6DA544" width="512" height="341.326"/>
<rect y="85.337" fill="#FFDA44" width="512" height="113.775"/>
<rect y="312.888" fill="#D80027" width="512" height="113.775"/>
<path fill="#FFFFFF" d="M384,227.261h-97.783L256,134.265l-30.217,92.997H128l79.108,57.475l-30.217,92.998L256,320.925  l79.108,56.81l-30.217-92.998L384,227.261z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),PU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="22.23 0 342 342">
<rect y="0" fill="#095FAD" width="513" height="342"/>
<g>
	<rect x="342" y="0" fill="#BE1229" width="171" height="342"/>
	<rect y="0" fill="#BE1229" width="171" height="342"/>
</g>
<g fill="#FFDA44">
	<rect x="108.3" y="166.3" width="14.8" height="74.2"/>
	<rect x="48.9" y="166.3" width="14.8" height="74.2"/>
	<circle cx="86" cy="203.4" r="14.8"/>
	<rect x="71.2" y="225.7" width="29.7" height="14.8"/>
	<rect x="71.2" y="166.3" width="29.7" height="14.8"/>
	<circle cx="86" cy="144" r="14.8"/>
	<polygon points="76.3,123.9 95.8,123.9 86,108.3 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),CU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#00745a" width="512" height="341.337"/>
<path fill="#FFFFFF" d="M285.682,248.878c-4.19,0-8.166,0.836-11.861,2.164c2.023-4.509,3.379-9.527,3.379-14.885  c0-21.201-21.201-37.101-21.201-37.101s-21.201,15.901-21.201,37.101c0,5.357,1.356,10.375,3.379,14.885  c-3.693-1.328-7.671-2.164-11.861-2.164c-21.201,0-37.101,21.201-37.101,21.201s15.901,21.201,37.101,21.201  c12.429,0,23.031-7.286,29.682-13.315c6.65,6.03,17.251,13.315,29.682,13.315c21.201,0,37.101-21.201,37.101-21.201  S306.882,248.878,285.682,248.878z"/>
<g>
	<polygon fill="#FFDA44" points="256,152.111 260.38,165.587 274.551,165.587 263.087,173.919 267.463,187.395 256,179.065    244.537,187.395 248.913,173.919 237.449,165.587 251.62,165.587  "/>
	<polygon fill="#FFDA44" points="202.112,175.683 210.537,183.268 220.355,177.601 215.745,187.956 224.168,195.544    212.894,194.359 208.283,204.714 205.925,193.626 194.65,192.441 204.468,186.772  "/>
	<polygon fill="#FFDA44" points="162.662,215.132 173.752,217.49 179.42,207.672 180.606,218.946 191.695,221.304    181.338,225.914 182.524,237.188 174.937,228.765 164.58,233.375 170.249,223.557  "/>
	<polygon fill="#FFDA44" points="309.889,175.683 301.464,183.268 291.646,177.601 296.257,187.956 287.832,195.544    299.107,194.359 303.717,204.714 306.076,193.626 317.351,192.441 307.533,186.772  "/>
	<polygon fill="#FFDA44" points="349.338,215.132 338.249,217.49 332.58,207.672 331.394,218.946 320.306,221.304    330.663,225.914 329.478,237.188 337.064,228.765 347.421,233.375 341.752,223.557  "/>
</g>
<g>
	<path fill="#FFFFFF" d="M256,350.642c16.84,0,32.363-5.619,44.816-15.073h-89.63   C223.637,345.023,239.16,350.642,256,350.642z"/>
	<path fill="#FFFFFF" d="M187.977,306.12c2.355,5.39,5.341,10.44,8.85,15.073h118.345c3.508-4.632,6.495-9.682,8.85-15.073   H187.977z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),MU=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="125 0 500 500">
	<path fill="#0071BC" d="M0 0h750v500H0V0z"/>
	<g fill="#FFF" stroke="#000" stroke-width="1.9">
		<circle cx="375" cy="245" r="225" stroke="#000000" fill="#ffffff"/>
		<circle cx="375" cy="245" r="165" stroke="#000000" fill="#0071BC"/>
	</g>
	<g stroke="#000">
		<path fill="#8C8A8C" stroke-width="1.9" d="M444.7,450c0.7,11-7.8,20-18.8,20H323.6c-11,0-19.5-9-19-20L321.3,125c0.6-11,10-20,21-20h61.4
			c11,0,20.5,9,21.2,20L444.7,450z"/>
		<path fill="#FFF" stroke-width="2" stroke-linejoin="round" d="M373 114l30 93h97l-78 56 29 92-78-56-78 57 30-93-79-57h97l30-92z"/>
	</g>
</svg>`},Symbol.toStringTag,{value:"Module"})),DU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#0052B4" width="513" height="342"/>
<g fill="#ffffff">
<polygon points="512,148.4 512,192.9 278.3,192.9 278.3,341.3 233.7,341.3 233.7,192.9 0,192.9 0,148.4 233.7,148.4
	233.7,0 278.3,0 278.3,148.4 "/>
<path d="M101,36.1c4.2-0.2,8.3-0.1,12.5,0.2c5.5,0.4,9.4,1.6,9.1,0.5c-0.5-1.8-0.1-2.2-0.8-1.8c-1.3,1,0.7-0.2-7.4,4.4
	c-11.8,6.7-16.9,11.8-14.3,21c2.3,8.1,8.2,10.3,22.3,12.5l1.9,0.3c5.6,0.9,8.1,1.4,9.8,2.2c0.4,0.2-0.3-1-0.1-1.7
	c-0.2,0.6-3.9,2.1-13.3,3.9l-4.7,0.9c-18.1,3.7-27.1,8.5-28.5,21c-1.5,13.7,12.7,23.3,30.6,25.6c18.2,2.4,34.1-3.6,35.7-18.4
	c1-9.4-5.5-15-15.9-17.1c-7-1.4-16.3-1.4-27.4-0.3c-12.4,1.3-24.7,3.4-36.9,6.3c-3.6,0.7-5.9,4.2-5.2,7.8c0.7,3.6,4.2,5.9,7.8,5.2
	c0.2,0,0.3-0.1,0.5-0.1c11.6-2.7,23.3-4.7,35.1-5.9c9.9-1,18-1,23.4,0.1c4.4,0.9,5.3,1.7,5.2,2.6c-0.5,5.1-8.9,8.2-20.7,6.7
	c-11.6-1.5-19.5-6.8-19.1-11c0.5-4.3,5.3-6.8,17.9-9.4l4.6-0.9c15.5-3,21.1-5.3,23.5-13.2c1.9-6.5-1.3-11.6-7.2-14.2
	c-3.2-1.4-6.3-2.1-13.2-3.1l-1.8-0.3c-8-1.3-11.4-2.6-11.5-3c-0.1-0.4,1.8-2.3,8.1-5.9l4.4-2.5c1.5-0.8,2.9-1.8,4.3-2.7
	c4.6-3.4,7.2-7.1,5.8-12.3c-1.9-7.3-9-9.5-20.9-10.4c-4.7-0.3-9.3-0.4-14-0.3l-2,0.1c-3.7,0.2-6.5,3.4-6.3,7c0.2,3.7,3.4,6.5,7,6.3
	L101,36.1L101,36.1z"/>
<path d="M385,36.1c4.2-0.2,8.3-0.1,12.5,0.2c5.5,0.4,9.4,1.6,9.1,0.5c-0.5-1.8-0.1-2.2-0.8-1.8c-1.3,1,0.7-0.2-7.4,4.4
	c-11.8,6.7-16.9,11.8-14.3,21c2.3,8.1,8.2,10.3,22.3,12.5l1.9,0.3c5.6,0.9,8.1,1.4,9.8,2.2c0.4,0.2-0.3-1-0.1-1.7
	c-0.2,0.6-3.9,2.1-13.3,3.9l-4.7,0.9c-18.1,3.7-27.1,8.5-28.5,21c-1.5,13.7,12.7,23.3,30.6,25.6c18.2,2.4,34.1-3.6,35.7-18.4
	c1-9.4-5.5-15-15.9-17.1c-7-1.4-16.3-1.4-27.4-0.3c-12.4,1.3-24.7,3.4-36.9,6.3c-3.6,0.7-5.9,4.2-5.2,7.8c0.7,3.6,4.2,5.9,7.8,5.2
	c0.2,0,0.3-0.1,0.5-0.1c11.6-2.7,23.3-4.7,35.1-5.9c9.9-1,18-1,23.4,0.1c4.4,0.9,5.3,1.7,5.2,2.6c-0.5,5.1-8.9,8.2-20.7,6.7
	c-11.6-1.5-19.5-6.8-19.1-11c0.5-4.3,5.3-6.8,17.9-9.4l4.6-0.9c15.5-3,21.1-5.3,23.5-13.2c1.9-6.5-1.3-11.6-7.2-14.2
	c-3.2-1.4-6.3-2.1-13.2-3.1l-1.8-0.3c-8-1.3-11.4-2.6-11.5-3c-0.1-0.4,1.8-2.3,8.1-5.9l4.4-2.5c1.5-0.8,2.9-1.8,4.3-2.7
	c4.6-3.4,7.2-7.1,5.8-12.3c-1.9-7.3-9-9.5-20.9-10.4c-4.7-0.3-9.3-0.4-14-0.3l-2,0.1c-3.7,0.2-6.5,3.4-6.3,7c0.2,3.7,3.4,6.5,7,6.3
	L385,36.1L385,36.1z"/>
<path d="M379.6,235.1c4.2-0.2,8.3-0.1,12.5,0.2c5.5,0.4,9.4,1.6,9.1,0.5c-0.5-1.8-0.1-2.2-0.8-1.8
	c-1.3,1,0.7-0.2-7.4,4.4c-11.8,6.7-16.9,11.8-14.3,21c2.3,8.1,8.2,10.3,22.3,12.5l1.9,0.3c5.6,0.9,8.1,1.4,9.8,2.2
	c0.4,0.2-0.3-1-0.1-1.7c-0.2,0.6-3.9,2.1-13.3,3.9l-4.7,0.9c-18.1,3.7-27.1,8.5-28.5,21c-1.5,13.7,12.7,23.3,30.6,25.6
	c18.2,2.4,34.1-3.6,35.7-18.4c1-9.4-5.5-15-15.9-17.1c-7-1.4-16.3-1.4-27.4-0.3c-12.4,1.3-24.7,3.4-36.9,6.3
	c-3.6,0.7-5.9,4.2-5.2,7.8c0.7,3.6,4.2,5.9,7.8,5.2c0.2,0,0.3-0.1,0.5-0.1c11.6-2.7,23.3-4.7,35.1-5.9c9.9-1,18-1,23.4,0.1
	c4.4,0.9,5.3,1.7,5.2,2.6c-0.5,5.1-8.9,8.2-20.7,6.7c-11.6-1.5-19.5-6.8-19.1-11c0.5-4.3,5.3-6.8,17.9-9.4l4.6-0.9
	c15.5-3,21.1-5.3,23.5-13.2c1.9-6.5-1.3-11.6-7.2-14.2c-3.2-1.4-6.3-2.1-13.2-3.1l-1.8-0.3c-8-1.3-11.4-2.6-11.5-3
	c-0.1-0.4,1.8-2.3,8.1-5.9l4.4-2.5c1.5-0.8,2.9-1.8,4.3-2.7c4.6-3.4,7.2-7.1,5.8-12.3c-1.9-7.3-9-9.5-20.9-10.4
	c-4.7-0.3-9.3-0.4-14-0.3l-2,0.1c-3.7,0.2-6.5,3.4-6.3,7s3.4,6.5,7,6.3L379.6,235.1L379.6,235.1z"/>
<path d="M101,235.1c4.2-0.2,8.3-0.1,12.5,0.2c5.5,0.4,9.4,1.6,9.1,0.5c-0.5-1.8-0.1-2.2-0.8-1.8c-1.3,1,0.7-0.2-7.4,4.4
	c-11.8,6.7-16.9,11.8-14.3,21c2.3,8.1,8.2,10.3,22.3,12.5l1.9,0.3c5.6,0.9,8.1,1.4,9.8,2.2c0.4,0.2-0.3-1-0.1-1.7
	c-0.2,0.6-3.9,2.1-13.3,3.9l-4.7,0.9c-18.1,3.7-27.1,8.5-28.5,21c-1.5,13.7,12.7,23.3,30.6,25.6c18.2,2.4,34.1-3.6,35.7-18.4
	c1-9.4-5.5-15-15.9-17.1c-7-1.4-16.3-1.4-27.4-0.3c-12.4,1.3-24.7,3.4-36.9,6.3c-3.6,0.7-5.9,4.2-5.2,7.8s4.2,5.9,7.8,5.2
	c0.2,0,0.3-0.1,0.5-0.1c11.6-2.7,23.3-4.7,35.1-5.9c9.9-1,18-1,23.4,0.1c4.4,0.9,5.3,1.7,5.2,2.6c-0.5,5.1-8.9,8.2-20.7,6.7
	c-11.6-1.5-19.5-6.8-19.1-11c0.5-4.3,5.3-6.8,17.9-9.4l4.6-0.9c15.5-3,21.1-5.3,23.5-13.2c1.9-6.5-1.3-11.6-7.2-14.2
	c-3.2-1.4-6.3-2.1-13.2-3.1l-1.8-0.3c-8-1.3-11.4-2.6-11.5-3c-0.1-0.4,1.8-2.3,8.1-5.9l4.4-2.5c1.5-0.8,2.9-1.8,4.3-2.7
	c4.6-3.4,7.2-7.1,5.8-12.3c-1.9-7.3-9-9.5-20.9-10.4c-4.7-0.3-9.3-0.4-14-0.3l-2,0.1c-3.7,0.2-6.5,3.4-6.3,7c0.2,3.7,3.4,6.5,7,6.3
	L101,235.1L101,235.1z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),AU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 100 342 342">
	<rect y="100" fill="#006233" width="513" height="342"/>
	<rect y="100" fill="#cd2a3e" width="513" height="46"/>
	<rect y="396" fill="#cd2a3e" width="513" height="46"/>
	<path fill="#ffc400" d="M256,298.851c-45.956,0-84.348-32.298-93.767-75.429c-1.448,6.63-2.233,13.507-2.233,20.572   c0,53.02,42.979,96,96,96s96-42.98,96-96c0-7.066-0.785-13.942-2.233-20.572C340.348,266.553,301.956,298.851,256,298.851z"/>
	<polygon fill="#ffc400" points="255.999,171.994 264.934,199.496 293.852,199.496 270.458,216.492 279.394,243.995    255.999,226.997 232.605,243.995 241.542,216.492 218.148,199.496 247.063,199.496  "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),TU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="121.41 0 342 342">
<rect y="0" fill="#1B4991" width="513" height="342"/>
<path fill="#00A2B8" stroke="#FFFFFF" stroke-width="3" d="M318.2,106.7v106.5c0,51.9,67.8,67.8,67.8,67.8s67.8-15.9,67.8-67.8V106.7H318.2z"/>
<path fill="#A35023" d="M319.7,212.7c0,50.8,66.3,66.3,66.3,66.3s66.3-15.6,66.3-66.3H319.7L319.7,212.7z"/>
<polygon fill="#000" points="415.1,155.1 395.7,155.1 395.7,135.7 376.3,135.7 376.3,155.1 357,155.1 357,174.5 376.3,174.5 376.3,232.6
	395.7,232.6 395.7,174.5 415.1,174.5 "/>
<polygon fill="#FFFFFF" points="256,0 256,30.6 210.8,55.7 256,55.7 256,115 196.9,115 256,147.8 256,170.7 229.3,170.7 155.8,129.8
	155.8,170.7 100.2,170.7 100.2,122.1 12.7,170.7 0,170.7 0,140.1 45.2,115 0,115 0,55.7 59.1,55.7 0,22.8 0,0 26.7,0 100.2,40.8
	100.2,0 155.8,0 155.8,48.6 243.3,0 "/>
<polygon fill="#D80027" points="144,0 112,0 112,69.3 0,69.3 0,101.3 112,101.3 112,170.7 144,170.7 144,101.3 256,101.3 256,69.3
	144,69.3 "/>
<polygon fill="#0052B4" points="155.8,115 256,170.7 256,154.9 184.2,115 "/>
<polygon fill="#FFFFFF" points="155.8,115 256,170.7 256,154.9 184.2,115 "/>
<polygon fill="#D80027" points="155.8,115 256,170.7 256,154.9 184.2,115 	"/>
<polygon fill="#D80027" points="71.8,115 0,154.9 0,170.7 0,170.7 100.2,115 	"/>
<polygon fill="#0052B4" points="100.2,55.6 0,0 0,15.7 71.8,55.6 "/>
<polygon fill="#FFFFFF" points="100.2,55.6 0,0 0,15.7 71.8,55.6 "/>
<polygon fill="#D80027" points="100.2,55.6 0,0 0,15.7 71.8,55.6 	"/>
<polygon fill="#D80027" points="184.2,55.6 256,15.7 256,0 256,0 155.8,55.6 	"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),jU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<rect x="256" y="0" fill="#C31B28" width="256.5" height="342"/>
<polygon fill="#ACABB1" stroke="#C31B28" stroke-width="2" points="101.2,68.2 101.2,33 66,33 66,68.2 30.8,68.2 30.8,103.4 66,103.4 66,138.6 101.2,138.6 101.2,103.4
	136.4,103.4 136.4,68.2 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),zU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#f7ce00" width="512" height="341.326"/>
<rect y="85.331" fill="#e32737" width="512" height="85.337"/>
<rect y="170.657" fill="#191f6a" width="512" height="85.337"/>
<rect y="341.331" fill="#00a04e" width="512" height="85.337"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),NU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#d01920" width="512" height="341.333"/>
<rect x="144.696" y="174.375" fill="#017c3b" width="222.609" height="163.25"/>
<path fill="#FFFFFF" d="M283.484,304.226c-26.637,0-48.232-21.594-48.232-48.232s21.594-48.232,48.232-48.232  c8.306,0,16.12,2.1,22.943,5.797c-10.703-10.467-25.341-16.927-41.494-16.927c-32.784,0-59.362,26.577-59.362,59.362  s26.578,59.362,59.362,59.362c16.154,0,30.791-6.461,41.494-16.927C299.605,302.127,291.791,304.226,283.484,304.226z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),kU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85 0 342 342">
<rect y="0" fill="#272727" width="512" height="114"/>
<rect y="114" fill="#e40112" width="512" height="114"/>
<rect y="228" fill="#07893f" width="512" height="114"/>
<circle fill="#e40112" cx="256" cy="125" r="95"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),IU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<polygon fill="#dc2339" points="342,0 171,0 0,0 0,341.3 171,341.3 342,341.3 513,341.3 513,0 "/>
<rect y="0" fill="#11865d" width="171" height="342"/>
<rect x="171" y="0" fill="#FFFFFF" width="171" height="342"/>
<path fill="#8C9157" d="M195.8,171.2c0,21.6,11.5,41.7,30.3,52.5c5.8,3.4,13.2,1.4,16.6-4.4c3.4-5.8,1.4-13.2-4.4-16.6
	c-11.3-6.5-18.2-18.5-18.2-31.5c0-6.7-5.4-12.1-12.1-12.1C201.3,159.1,195.8,164.5,195.8,171.2z M289.2,222.3
	c17.5-11.1,28-30.4,28-51.1c0-6.7-5.4-12.1-12.1-12.1s-12.1,5.4-12.1,12.1c0,12.4-6.3,24-16.8,30.7c-5.7,3.5-7.5,10.9-4.1,16.7
	s10.9,7.5,16.7,4.1C288.8,222.5,289,222.4,289.2,222.3z"/>
<ellipse fill="#C59262" cx="256.5" cy="159.1" rx="24.3" ry="36.4"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),BU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g fill="#cc0000">
  <rect y="0" width="513" height="24.4"/>
  <rect y="48.9" width="513" height="24.4"/>
  <rect y="97.7" width="513" height="24.4"/>
  <rect y="146.6" width="513" height="24.4"/>
  <rect y="195.4" width="513" height="24.4"/>
  <rect y="244.3" width="513" height="24.4"/>
  <rect y="293.1" width="513" height="24.4"/>
</g>
<rect y="0" fill="#000066" width="256.5" height="195.4"/>
<g fill="#ffcc00">
  <path d="M153.3,42.1C122.6,30.7,88.5,46.3,77.1,77s4.2,64.8,34.9,76.2c13.3,5,28,5,41.4,0
    c-30.7,24.5-75.4,19.6-100-11.1s-19.6-75.4,11.1-100C90.5,21.4,127.4,21.4,153.3,42.1z M180,117.1l-20.6,23.3l5.4-30.6l-31-1.6
    l27.3-14.9l-18.1-25.3l28.6,12l8.4-29.9l8.4,29.9l28.6-12L199,93.4l27.3,14.9l-31,1.6l5.4,30.6L180,117.1z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),LU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 85.333 342 342">
<rect y="85.333" fill="#FFFFFF" width="513" height="342"/>
<rect y="323.333" fill="#f4d900" width="513" height="104"/>
<rect y="85.333" fill="#006d66" width="513" height="104"/>
<rect y="204.333" fill="#000000" width="513" height="104"/>
<polygon fill="#cb0f31" points="256,256.006 0,426.668 0,85.331 "/>
<polygon fill="#f4d900" points="83.477,195.132 98.584,241.63 147.478,241.63 107.924,270.369 123.031,316.868   83.477,288.13 43.922,316.868 59.032,270.369 19.478,241.63 68.37,241.63 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),RU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="32.427 85.333 341.333 341.333">
<rect y="85.337" fill="#496E2D" width="512" height="341.326"/>
<polyline fill="#0052B4" points="0,426.663 0,85.337 512,85.337 "/>
<polygon fill="#FFFFFF" points="512,152.222 512,85.337 411.67,85.337 0,359.778 0,426.663 100.33,426.663 "/>
<polygon fill="#A2001D" points="512,85.337 512,125.462 60.193,426.663 0,426.663 0,386.538 451.807,85.337 "/>
<polygon fill="#FFDA44" points="187.737,189.212 164.996,199.908 177.106,221.932 152.413,217.208 149.284,242.153   132.085,223.806 114.885,242.153 111.756,217.208 87.063,221.931 99.172,199.908 76.433,189.212 99.173,178.515 87.063,156.493   111.756,161.215 114.886,136.271 132.085,154.618 149.285,136.271 152.413,161.215 177.106,156.493 164.998,178.517 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),VU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 22.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="25.596 0 426.7 426.7">
<path fill="#009543" d="M0,293h640v133.7H0V293z"/>
<path fill="#ED4135" d="M0,132h640v161.3H0V132z"/>
<path fill="#0035AD" d="M0,0h640v133.3H0V0z"/>
<circle fill="#FAE600" stroke="#000000" stroke-width="5.3" cx="240" cy="213.3" r="157.3"/>
<path fill="#000" d="M307.9,354.5l-31.8,12l-36.1,4.2l-37.8-2.4l-35.9-15.5c0,0,28.6-29.3,40.7-33.5c8.6-3,22.4-3.7,22.4-3.7V122l-0.3-66H246
	l-0.5,67.5v191.7c0,0,15.3,1.2,22.1,4.1C278.9,324.2,307.9,354.5,307.9,354.5z"/>
<rect fill="#000" x="213" y="91" transform="matrix(0.8949 -0.4462 0.4462 0.8949 -18.4912 115.9796)" width="48" height="12.5"/>
<ellipse fill="#000" cx="237.8" cy="280.5" rx="16.8" ry="26.5"/>
<circle fill="#000" cx="237.4" cy="143.4" r="20.9"/>
<ellipse fill="#000" cx="238.4" cy="211.1" rx="19.9" ry="12.1"/>
<rect fill="#000" x="213.8" y="177" width="47" height="10"/>
<rect fill="#000" x="213.8" y="234" width="47" height="10"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),HU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="85.337" fill="#e05206" width="512" height="113.775"/>
<rect y="312.888" fill="#0db02b" width="512" height="113.775"/>
<circle fill="#e05206" cx="256" cy="256" r="32"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),UU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 85.5 342 342">
<rect y="85.5" fill="#FFFFFF" width="513" height="342"/>
<g fill="#007b23">
	<rect y="85.5" width="171" height="342"/>
	<rect x="342" y="85.5" width="171" height="342"/>
	<polygon points="304,311.995 256,159.994 208,311.995 244,311.995 244,351.994 268,351.994 268,311.995  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),WU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 85.5 342 342">
<rect y="85.5" fill="#FFFFFF" width="513" height="342"/>
<g fill="#007b23">
	<rect y="85.5" width="171" height="342"/>
	<rect x="342" y="85.5" width="171" height="342"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),GU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<g>
	<rect y="85.337" fill="#338AF3" width="512" height="113.775"/>
	<rect y="312.888" fill="#338AF3" width="512" height="113.775"/>
</g>
<path fill="#FFDA44" d="M256,214.447c-22.949,0-41.553,18.603-41.553,41.553S233.05,297.553,256,297.553  c22.949,0,41.553-18.603,41.553-41.553S278.949,214.447,256,214.447z M256,279.745c-13.114,0-23.745-10.631-23.745-23.745  s10.631-23.745,23.745-23.745c13.114,0,23.745,10.631,23.745,23.745C279.745,269.114,269.114,279.745,256,279.745z"/>
<polygon fill="#0052B4" points="276.563,261.936 256,256 235.437,261.936 228.582,273.809 283.418,273.809 "/>
<polygon fill="#338AF3" points="256,226.32 242.291,250.064 256,256 269.709,250.064 "/>
<polygon fill="#6DA544" points="235.437,261.936 276.563,261.936 269.709,250.064 242.291,250.064 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),KU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="114" fill="#FFFFFF" width="513" height="114"/>
<rect y="0" fill="#cd1f2a" width="513" height="114"/>
<rect y="228" fill="#1d4185" width="513" height="114"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),qU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="37.547 85.333 341.333 341.333">
<rect y="85.334" fill="#D80027" width="512" height="341.337"/>
<polygon fill="#FFFFFF" points="512,295.883 202.195,295.883 202.195,426.666 183.652,426.666 140.978,426.666   122.435,426.666 122.435,295.883 0,295.883 0,277.329 0,234.666 0,216.111 122.435,216.111 122.435,85.329 140.978,85.329   183.652,85.329 202.195,85.329 202.195,216.111 512,216.111 512,234.666 512,277.329 "/>
<polygon fill="#2E52B2" points="512,234.666 512,277.329 183.652,277.329 183.652,426.666 140.978,426.666 140.978,277.329   0,277.329 0,234.666 140.978,234.666 140.978,85.329 183.652,85.329 183.652,234.666 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),YU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<polygon fill="#0052B4" points="0,426.663 0,85.337 280.419,260.087 87.61,260.087 271.186,426.663 "/>
<polygon fill="#D80027" points="244.769,249.888 10.199,103.71 10.199,249.888 10.199,416.464 244.769,416.464   61.193,249.888 "/>
<g>
	<polygon fill="#FFFFFF" points="98.003,324.433 83.414,317.57 91.184,303.44 75.34,306.47 73.332,290.465 62.297,302.237    51.261,290.465 49.253,306.47 33.41,303.439 41.18,317.57 26.589,324.433 41.18,331.295 33.41,345.425 49.254,342.396    51.261,358.4 62.297,346.628 73.332,358.4 75.34,342.396 91.183,345.426 83.414,331.296  "/>
	<polygon fill="#FFFFFF" points="88.268,191.662 77.656,186.671 83.307,176.393 71.784,178.598 70.323,166.957    62.297,175.518 54.271,166.957 52.811,178.598 41.286,176.393 46.938,186.671 36.325,191.662 62.297,196.856  "/>
	<path fill="#FFFFFF" d="M93.462,191.662c0,17.212-13.953,31.165-31.165,31.165s-31.165-13.953-31.165-31.165"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),ZU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="44.373 85.333 341.333 341.333">
<rect y="85.337" fill="#0052B4" width="512" height="341.326"/>
<rect y="239.994" fill="#FFDA44" width="512" height="32"/>
<polygon fill="#FFFFFF" points="174.802,341.329 155.678,350.325 165.862,368.846 145.095,364.873 142.464,385.851   128,370.422 113.535,385.851 110.905,364.873 90.138,368.846 100.321,350.325 81.198,341.329 100.322,332.334 90.138,313.814   110.904,317.785 113.536,296.807 128,312.236 142.465,296.807 145.095,317.785 165.862,313.814 155.679,332.335 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),JU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 85.333 341.333 341.333">
<rect y="85.334" fill="#FFDA44" width="512" height="341.337"/>
<rect y="85.334" fill="#FFFFFF" width="256" height="170.663"/>
<g>
	<polygon fill="#D80027" points="144,85.33 112,85.33 112,154.663 0,154.663 0,186.663 112,186.663 112,255.997 144,255.997    144,186.663 256,186.663 256,154.663 144,154.663  "/>
	<polygon fill="#D80027" points="0,85.329 0,100.412 57.377,138.663 80,138.663  "/>
</g>
<g>
	<polygon fill="#2E52B2" points="0,107.951 0,138.663 46.069,138.663  "/>
	<polygon fill="#2E52B2" points="96,85.331 96,134.244 22.628,85.331  "/>
</g>
<polygon fill="#D80027" points="256,85.329 256,100.412 198.623,138.663 176,138.663 "/>
<g>
	<polygon fill="#2E52B2" points="256,107.951 256,138.663 209.931,138.663  "/>
	<polygon fill="#2E52B2" points="160,85.331 160,134.244 233.372,85.331  "/>
</g>
<polygon fill="#D80027" points="0,85.329 0,100.412 57.377,138.663 80,138.663 "/>
<g>
	<polygon fill="#2E52B2" points="0,107.951 0,138.663 46.069,138.663  "/>
	<polygon fill="#2E52B2" points="96,85.331 96,134.244 22.628,85.331  "/>
</g>
<polygon fill="#D80027" points="256,85.329 256,100.412 198.623,138.663 176,138.663 "/>
<g>
	<polygon fill="#2E52B2" points="256,107.951 256,138.663 209.931,138.663  "/>
	<polygon fill="#2E52B2" points="160,85.331 160,134.244 233.372,85.331  "/>
</g>
<polygon fill="#D80027" points="0,255.997 0,240.915 57.377,202.663 80,202.663 "/>
<g>
	<polygon fill="#2E52B2" points="0,233.376 0,202.663 46.069,202.663  "/>
	<polygon fill="#2E52B2" points="96,255.994 96,207.082 22.628,255.994  "/>
</g>
<polygon fill="#D80027" points="256,255.997 256,240.915 198.623,202.663 176,202.663 "/>
<g>
	<polygon fill="#2E52B2" points="256,233.376 256,202.663 209.931,202.663  "/>
	<polygon fill="#2E52B2" points="160,255.994 160,207.082 233.372,255.994  "/>
	<circle fill="#2E52B2" cx="128" cy="170.66" r="22.627"/>
</g>
<g>
	<polygon fill="#FFDA44" points="128,154.663 131.97,166.885 144.824,166.885 134.426,174.441 138.397,186.663 128,179.109    117.602,186.663 121.574,174.441 111.176,166.885 124.029,166.885  "/>
	<polygon fill="#FFDA44" points="128,219.803 130.364,227.081 138.017,227.081 131.827,231.579 134.191,238.857 128,234.359    121.809,238.857 124.173,231.579 117.983,227.081 125.635,227.081  "/>
	<polygon fill="#FFDA44" points="128,102.469 130.364,109.747 138.017,109.747 131.827,114.245 134.191,121.523 128,117.025    121.809,121.523 124.173,114.245 117.983,109.747 125.635,109.747  "/>
	<polygon fill="#FFDA44" points="197.931,161.136 200.296,168.413 207.949,168.413 201.757,172.912 204.122,180.191    197.931,175.693 191.74,180.191 194.105,172.912 187.914,168.413 195.566,168.413  "/>
	<polygon fill="#FFDA44" points="58.069,161.136 60.433,168.413 68.086,168.413 61.895,172.912 64.259,180.191    58.069,175.693 51.878,180.191 54.243,172.912 48.051,168.413 55.704,168.413  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),XU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="114.347 85.333 341.333 341.333">
<rect y="85.334" fill="#0052B4" width="512" height="341.337"/>
<g>
	<polygon fill="#D80027" points="425.301,233.745 428.689,244.173 439.652,244.173 430.782,250.617 434.17,261.044    425.301,254.6 416.43,261.044 419.818,250.617 410.948,244.173 421.911,244.173  "/>
	<polygon fill="#D80027" points="386.107,308.817 391.19,324.459 407.635,324.459 394.33,334.126 399.412,349.766    386.107,340.099 372.802,349.766 377.885,334.126 364.58,324.459 381.025,324.459  "/>
	<polygon fill="#D80027" points="387.588,185.971 391.824,199.007 405.528,199.007 394.44,207.061 398.675,220.095    387.588,212.039 376.5,220.095 380.735,207.061 369.648,199.007 383.352,199.007  "/>
	<polygon fill="#D80027" points="349.876,233.291 354.958,248.932 371.404,248.932 358.098,258.598 363.182,274.239    349.876,264.573 336.571,274.239 341.653,258.598 328.348,248.932 344.793,248.932  "/>
</g>
<polygon fill="#FFFFFF" points="256.003,85.329 256.003,115.893 210.825,140.981 256.003,140.981 256.003,200.34   196.89,200.34 256.003,233.186 256.003,255.992 229.313,255.992 155.829,215.166 155.829,255.992 100.177,255.992 100.177,207.419   12.748,255.992 0.003,255.992 0.003,225.439 45.171,200.34 0.003,200.34 0.003,140.981 59.106,140.981 0.003,108.147 0.003,85.329   26.683,85.329 100.177,126.167 100.177,85.329 155.829,85.329 155.829,133.902 243.259,85.329 "/>
<polygon fill="#D80027" points="144,85.33 112,85.33 112,154.664 0,154.664 0,186.664 112,186.664 112,255.998 144,255.998   144,186.664 256,186.664 256,154.664 144,154.664 "/>
<polygon fill="#0052B4" points="155.826,200.344 256,255.998 256,240.259 184.153,200.344 "/>
<polygon fill="#FFFFFF" points="155.826,200.344 256,255.998 256,240.259 184.153,200.344 "/>
<g>
	<polygon fill="#D80027" points="155.826,200.344 256,255.998 256,240.259 184.153,200.344  "/>
	<polygon fill="#D80027" points="71.846,200.344 0,240.259 0,255.998 0,255.998 100.174,200.344  "/>
</g>
<polygon fill="#0052B4" points="100.174,140.983 0,85.33 0,101.068 71.847,140.983 "/>
<polygon fill="#FFFFFF" points="100.174,140.983 0,85.33 0,101.068 71.847,140.983 "/>
<g>
	<polygon fill="#D80027" points="100.174,140.983 0,85.33 0,101.068 71.847,140.983  "/>
	<polygon fill="#D80027" points="184.154,140.983 256,101.068 256,85.33 256,85.33 155.826,140.983  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),QU=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="44.46 0 342 342">
<rect fill="#D80027" y="0" width="513" height="342"/>
<rect x="138" y="0" fill="#FFFFFF" width="377" height="114"/>
<rect x="138" y="230" fill="#4A7C3A" width="377" height="114"/>
<g fill="none" stroke="#FFFFFF" stroke-width="10" stroke-miterlimit="2">
	<path d="M40.3,35.2c0,0,37.1,48,50.8,54.5c13.7,6.5,17.1,5.7,17.1,5.7"/>
	<path d="M100,35.2c0,0-37.1,45.4-46.7,52.4c-9.6,7-18.7,7.8-18.7,7.8"/>
	<line x1="51.7" y1="65.3" x2="89.6" y2="65.3"/>
	<line x1="70.7" y1="35.2" x2="70.7" y2="65.3"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),eW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<path fill="#0052B4" d="M256,256c0,0,0,85.304,0,170.663H0V256h85.337C166.934,256,256,256,256,256z"/>
<path fill="#D80027" d="M512,85.337V256h-85.337C336.184,256,256,256,256,256s0-90.323,0-170.663H512z"/>
<polygon fill="#0052B4" points="128,123.034 139.824,159.423 178.087,159.423 147.132,181.914 158.955,218.303 128,195.813   97.045,218.303 108.868,181.914 77.913,159.423 116.176,159.423 "/>
<polygon fill="#D80027" points="384,293.697 395.824,330.086 434.087,330.086 403.132,352.577 414.955,388.966 384,366.476   353.045,388.966 364.868,352.577 333.913,330.086 372.176,330.086 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),tW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#FFFFFF" width="512" height="341.326"/>
<g>
	<rect y="85.331" fill="#D80027" width="170.663" height="341.337"/>
	<rect x="341.337" y="85.331" fill="#D80027" width="170.663" height="341.337"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),nW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<g>
	<rect y="85.337" fill="#D80027" width="512" height="113.775"/>
	<rect y="312.888" fill="#D80027" width="512" height="113.775"/>
</g>
<path fill="#FFDA44" d="M293.991,256c0,20.982-17.01,33.243-37.992,33.243S218.008,276.982,218.008,256  s17.01-37.992,37.992-37.992S293.991,235.018,293.991,256z"/>
<path fill="#0052B4" d="M293.991,256c0,20.982-17.01,37.992-37.992,37.992s-37.992-17.01-37.992-37.992"/>
<g>
	<rect x="232.259" y="246.506" fill="#D80027" width="9.498" height="19"/>
	<rect x="270.247" y="246.506" fill="#D80027" width="9.498" height="19"/>
	<rect x="251.247" y="232.259" fill="#D80027" width="9.498" height="33.243"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),rW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect fill="#000" y="85.333" width="512" height="341.337"/>
<polyline fill="#A2001D" points="0,85.33 512,85.33 512,426.662 "/>
<g>
	<polygon fill="#FFFFFF" points="204.631,326.488 207.393,334.992 216.334,334.992 209.101,340.247 211.864,348.749    204.631,343.495 197.398,348.749 200.16,340.247 192.927,334.992 201.867,334.992  "/>
	<polygon fill="#FFFFFF" points="181.797,244.866 186.402,259.038 201.303,259.038 189.247,267.795 193.852,281.967    181.797,273.208 169.742,281.967 174.348,267.795 162.292,259.038 177.193,259.038  "/>
	<polygon fill="#FFFFFF" points="181.797,348.749 186.401,362.922 201.303,362.922 189.246,371.679 193.852,385.852    181.797,377.093 169.742,385.852 174.346,371.679 162.292,362.922 177.191,362.922  "/>
	<polygon fill="#FFFFFF" points="225.363,281.967 229.969,296.139 244.87,296.139 232.814,304.897 237.419,319.069    225.363,310.31 213.309,319.069 217.915,304.897 205.859,296.139 220.76,296.139  "/>
	<polygon fill="#FFFFFF" points="138.23,281.967 142.836,296.139 157.735,296.139 145.681,304.897 150.284,319.069    138.23,310.31 126.175,319.069 130.78,304.897 118.725,296.139 133.625,296.139  "/>
</g>
<path fill="#FFDA44" d="M376.526,204.163c-7.628-7.628-17.538-12.133-28.189-12.908l31.88-24.795  c-12.698-12.698-29.714-18.431-46.319-17.218c-1.988-7.145-5.778-13.892-11.396-19.511l-12.593,25.186  c-0.826-1.506-1.872-2.923-3.148-4.197c-7.245-7.245-18.991-7.244-26.234,0s-7.245,18.99,0,26.234  c1.276,1.276,2.692,2.322,4.197,3.148l-25.186,12.593c5.62,5.62,12.371,9.412,19.519,11.399  c-1.217,16.606,4.511,33.619,17.209,46.317l27.854-35.811c2.096-2.064,4.862-3.202,7.807-3.202c2.973,0,5.768,1.158,7.87,3.26  c2.103,2.103,3.26,4.897,3.26,7.87c0,2.974-1.158,5.768-3.26,7.87l10.494,10.494c4.905-4.905,7.607-11.428,7.607-18.364  c0-5.675-1.81-11.071-5.153-15.534c4.871,1.3,9.474,3.849,13.288,7.662c11.573,11.572,11.573,30.403,0,41.975l10.494,10.494  c8.409-8.409,13.039-19.59,13.039-31.481C389.565,223.752,384.934,212.572,376.526,204.163z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),oW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 85.333 341.333 341.333">
<g>
	<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
</g>
<polygon fill="#0052B4" points="512,85.337 512,256 256,256 0,85.337 "/>
<polygon fill="#D80027" points="512,256 512,426.663 0,426.663 256,256 "/>
<g>
	<polygon fill="#FFDA44" points="161.908,256 134.62,243.165 149.152,216.737 119.52,222.405 115.765,192.472    95.125,214.487 74.486,192.472 70.731,222.405 41.1,216.736 55.631,243.164 28.343,256 55.631,268.835 41.1,295.263    70.733,289.595 74.486,319.528 95.125,297.513 115.765,319.528 119.52,289.595 149.151,295.264 134.619,268.837  "/>
	<polygon fill="#FFDA44" points="21.789,117.607 30.87,130.303 45.749,125.589 36.481,138.149 45.562,150.843    30.753,145.911 21.485,158.47 21.602,142.862 6.793,137.928 21.673,133.216  "/>
	<polygon fill="#FFDA44" points="21.789,353.53 30.87,366.226 45.749,361.512 36.481,374.072 45.562,386.767 30.753,381.834    21.485,394.392 21.602,378.785 6.793,373.851 21.673,369.139  "/>
	<polygon fill="#FFDA44" points="210.395,235.569 201.314,248.264 186.435,243.551 195.703,256.11 186.622,268.806    201.431,263.873 210.699,276.431 210.582,260.824 225.391,255.89 210.511,251.177  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),iW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="136.534 85.333 341.333 341.333">
<g>
	<polygon fill="#FFFFFF" points="393.508,170.516 411.02,189.391 434.383,178.57 421.842,201.057 439.355,219.933    414.092,214.955 401.553,237.443 398.48,211.879 373.217,206.901 396.58,196.081  "/>
	<rect y="85.343" fill="#FFFFFF" width="512" height="341.326"/>
</g>
<rect x="128" y="85.331" fill="#01411c" width="384" height="341.337"/>
<g>
	<path fill="#FFFFFF" d="M361.909,298.793c-31.037,22.426-74.378,15.446-96.804-15.592   c-22.427-31.038-15.446-74.379,15.593-96.804c9.677-6.992,20.55-11.125,31.613-12.563c-21.283-3.183-43.777,1.613-62.598,15.211   c-38.2,27.602-46.792,80.944-19.191,119.145c27.601,38.199,80.944,46.792,119.145,19.189c18.82-13.598,30.436-33.448,34.096-54.655   C378.924,282.774,371.587,291.8,361.909,298.793z"/>
	<polygon fill="#FFFFFF" points="360.58,172.889 378.064,191.731 401.386,180.929 388.867,203.376 406.35,222.22    381.131,217.252 368.612,239.702 365.545,214.181 340.325,209.212 363.648,198.41  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),sW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<g>
	<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
	<rect y="85.337" fill="#FFFFFF" width="512" height="170.663"/>
</g>
<rect y="256" fill="#D80027" width="512" height="170.663"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),lW=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="106.667 26.666 426.666 426.666">
  <g fill-rule="evenodd" stroke-width="1pt">
    <path fill="#fff" d="M0 0h640v480H0z"/>
    <path fill="#00267f" d="M0 0h213.3v480H0z"/>
    <path fill="#f31830" d="M426.7 0H640v480H426.7z"/>
  </g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),aW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="114.347 85.333 341.333 341.333">
<rect y="85.333" fill="#0052B4" width="512" height="341.337"/>
<polygon fill="#ACABB1" points="400.696,219.822 384,225.387 367.304,219.822 361.739,205.909 367.304,191.996   400.696,191.996 395.13,205.909 "/>
<path fill="#338AF3" d="M345.043,219.822v61.217c0,29.821,38.957,38.957,38.957,38.957s38.957-9.137,38.957-38.957v-61.217  H345.043z"/>
<path fill="#6DA544" d="M348.555,295.541C358.131,313.927,384,319.996,384,319.996s25.869-6.069,35.445-24.455L384,236.518  L348.555,295.541z"/>
<path fill="#FFDA44" d="M422.957,280.421L384,219.822l-38.957,60.599v0.618c0,5.518,1.337,10.328,3.512,14.503L384,240.405  l35.445,55.137c2.175-4.175,3.512-8.983,3.512-14.503V280.421z"/>
<polygon fill="#FFFFFF" points="256,85.333 256,115.886 210.833,140.985 256,140.985 256,200.344 196.897,200.344   256,233.179 256,255.996 229.32,255.996 155.826,215.17 155.826,255.996 100.174,255.996 100.174,207.423 12.744,255.996 0,255.996   0,225.442 45.167,200.344 0,200.344 0,140.985 59.103,140.985 0,108.139 0,85.333 26.68,85.333 100.174,126.158 100.174,85.333   155.826,85.333 155.826,133.905 243.256,85.333 "/>
<polygon fill="#D80027" points="144,85.33 112,85.33 112,154.662 0,154.662 0,186.662 112,186.662 112,255.996 144,255.996   144,186.662 256,186.662 256,154.662 144,154.662 "/>
<polygon fill="#0052B4" points="155.826,200.344 256,255.996 256,240.259 184.153,200.344 "/>
<polygon fill="#FFFFFF" points="155.826,200.344 256,255.996 256,240.259 184.153,200.344 "/>
<g>
	<polygon fill="#D80027" points="155.826,200.344 256,255.996 256,240.259 184.153,200.344  "/>
	<polygon fill="#D80027" points="71.846,200.344 0,240.259 0,255.996 0,255.996 100.174,200.344  "/>
</g>
<polygon fill="#0052B4" points="100.174,140.982 0,85.33 0,101.067 71.847,140.982 "/>
<polygon fill="#FFFFFF" points="100.174,140.982 0,85.33 0,101.067 71.847,140.982 "/>
<g>
	<polygon fill="#D80027" points="100.174,140.982 0,85.33 0,101.067 71.847,140.982  "/>
	<polygon fill="#D80027" points="184.154,140.982 256,101.067 256,85.33 256,85.33 155.826,140.982  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),cW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="5.12 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<g>
	<rect y="85.337" fill="#D80027" width="512" height="68.263"/>
	<rect y="221.863" fill="#D80027" width="512" height="68.263"/>
	<rect y="358.4" fill="#D80027" width="512" height="68.263"/>
</g>
<polygon fill="#0052B4" points="256,256.006 0,426.668 0,85.331 "/>
<polygon fill="#FFFFFF" points="83.477,195.132 98.584,241.63 147.478,241.63 107.924,270.369 123.031,316.868   83.477,288.13 43.922,316.868 59.032,270.369 19.478,241.63 68.37,241.63 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),fW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="5.12 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="85.337" fill="#000" width="512" height="113.775"/>
<rect y="312.888" fill="#268024" width="512" height="113.775"/>
<polygon fill="#e4312b" points="256,256.006 0,426.668 0,85.331 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),uW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="30.72 85.333 341.333 341.333">
<rect y="85.337" fill="#D80027" width="512" height="341.326"/>
<polygon fill="#6DA544" points="196.641,85.337 196.641,261.565 196.641,426.663 0,426.663 0,85.337 "/>
<circle fill="#FFDA44" cx="196.641" cy="256" r="64"/>
<path fill="#D80027" d="M160.638,224v40.001c0,19.882,16.118,36,36,36s36-16.118,36-36V224H160.638z"/>
<path fill="#FFFFFF" d="M196.638,276c-6.617,0-12-5.383-12-12v-16h24.001v16C208.638,270.616,203.254,276,196.638,276z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),dW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="49.493 85.333 341.333 341.333">
<rect y="85.331" fill="#338AF3" width="512" height="341.337"/>
<circle fill="#FFDA44" cx="218.902" cy="255.994" r="74.207"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),hW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="85.337" fill="#D80027" width="512" height="113.775"/>
<rect y="312.888" fill="#0052B4" width="512" height="113.775"/>
<path fill="#6DA544" d="M289.579,216.738l-12.592,12.592c5.37,5.372,8.693,12.792,8.693,20.988  c0,16.392-13.289,29.68-29.68,29.68c-16.392,0-29.68-13.289-29.68-29.68c0-8.195,3.322-15.616,8.693-20.988l-12.592-12.592  c-8.594,8.594-13.91,20.466-13.91,33.579c0,26.228,21.261,47.489,47.489,47.489s47.489-21.261,47.489-47.489  C303.489,237.205,298.173,225.332,289.579,216.738z"/>
<polygon fill="#FFDA44" points="256,232.51 260.421,246.115 274.725,246.115 263.152,254.523 267.573,268.127 256,259.719   244.427,268.127 248.848,254.523 237.275,246.115 251.579,246.115 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),pW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect fill="#751A46" width="512" height="342"/>
<polygon fill="#FFFFFF" points="0,0 0,342 150.3,342 188,322.4 150.3,303.5 188,284.5 150.3,265.6 188,246.6 150.3,227.6
	188,208.7 150.3,189.7 188,170.7 150.3,151.8 188,132.8 188,132.8 188,132.8 150.3,113.9 188,94.9 150.3,75.9 188,57 150.3,38
	188,19.1 150.3,0 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),gW=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="106.667 26.666 426.666 426.666">
  <g fill-rule="evenodd" stroke-width="1pt">
    <path fill="#fff" d="M0 0h640v480H0z"/>
    <path fill="#00267f" d="M0 0h213.3v480H0z"/>
    <path fill="#f31830" d="M426.7 0H640v480H426.7z"/>
  </g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),vW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#FFDA44" width="512" height="341.326"/>
<rect y="85.331" fill="#0052B4" width="170.663" height="341.337"/>
<rect x="341.337" y="85.331" fill="#D80027" width="170.663" height="341.337"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),mW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="61.44 85.333 341.333 341.333">
<rect y="85.331" fill="#0052B4" width="512" height="341.337"/>
<rect y="85.331" fill="#D80027" width="512" height="113.775"/>
<rect y="312.882" fill="#FFFFFF" width="512" height="113.775"/>
<path fill="#D80027" d="M129.468,181.793v85.136c0,48.429,63.267,63.267,63.267,63.267S256,315.356,256,266.929v-85.136  H129.468z"/>
<g>
	<polygon fill="#FFDA44" points="155.634,196.634 229.835,196.634 229.835,166.953 214.994,174.373 192.733,152.113    170.474,174.373 155.634,166.953  "/>
	<polygon fill="#FFDA44" points="241.16,278.782 192.929,230.551 144.698,278.782 160.439,294.522 192.929,262.032    225.419,294.522  "/>
</g>
<path fill="#FFFFFF" d="M241.16,233.734h-22.504c1.266-2.184,2.001-4.713,2.001-7.418c0-8.196-6.645-14.84-14.84-14.84  c-5.663,0-10.581,3.172-13.083,7.836c-2.502-4.663-7.421-7.836-13.083-7.836c-8.195,0-14.84,6.644-14.84,14.84  c0,2.706,0.736,5.235,2.001,7.418h-22.114c0,8.196,7.139,14.84,15.334,14.84h-0.494c0,8.196,6.644,14.84,14.84,14.84  c0,7.257,5.211,13.286,12.094,14.576l-11.694,26.401c5.603,2.278,11.727,3.544,18.149,3.544c6.422,0,12.545-1.266,18.149-3.544  l-11.694-26.401c6.883-1.29,12.094-7.319,12.094-14.576c8.196,0,14.84-6.644,14.84-14.84h-0.494  C234.021,248.574,241.16,241.93,241.16,233.734z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),yW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<polygon fill="#FFFFFF" points="0,85.33 0,199.107 0,312.885 0,426.662 512,426.662 512,312.885 512,199.107 512,85.33 "/>
<rect y="85.333" fill="#0052B4" width="512" height="341.337"/>
<rect y="85.333" fill="#FFFFFF" width="512" height="113.775"/>
<rect y="312.884" fill="#D80027" width="512" height="113.775"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),wW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#338AF3" width="512" height="341.337"/>
<rect y="255.994" fill="#FFDA44" width="512" height="81.619"/>
<rect y="337.614" fill="#496E2D" width="512" height="89.043"/>
<polygon fill="#FFDA44" points="278.261,185.209 299.105,195.013 288.006,215.199 310.638,210.869 313.506,233.734   329.271,216.918 345.037,233.734 347.904,210.869 370.537,215.199 359.438,195.013 380.281,185.209 359.437,175.404   370.537,155.219 347.904,159.548 345.036,136.684 329.271,153.5 313.505,136.684 310.638,159.548 288.004,155.219 299.104,175.406   "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),_W=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.333" fill="#055e1c" width="512" height="341.333"/>
<g fill="#FFFFFF">
	<path d="M183.548,289.386c0,12.295,9.731,22.261,21.736,22.261h65.208c0,10.244,8.11,18.551,18.114,18.551   h21.736c10.004,0,18.114-8.306,18.114-18.551v-22.261H183.548z"/>
	<path d="M330.264,181.791v51.942c0,8.183-6.5,14.84-14.491,14.84v22.261   c19.976,0,36.226-16.643,36.226-37.101v-51.942L330.264,181.791L330.264,181.791z"/>
	<path d="M174.491,233.734c0,8.183-6.5,14.84-14.491,14.84v22.261c19.976,0,36.226-16.643,36.226-37.101   v-51.942h-21.736V233.734z"/>
	<rect x="297.661" y="181.788" width="21.736" height="51.942"/>
	<path d="M265.057,211.473c0,2.046-1.625,3.71-3.623,3.71c-1.998,0-3.623-1.664-3.623-3.71v-29.682h-21.736   v29.682c0,2.046-1.625,3.71-3.623,3.71s-3.623-1.664-3.623-3.71v-29.682h-21.736v29.682c0,14.32,11.376,25.971,25.358,25.971   c5.385,0,10.38-1.733,14.491-4.677c4.11,2.944,9.106,4.677,14.491,4.677c1.084,0,2.15-0.078,3.2-0.215   c-1.54,6.499-7.255,11.345-14.068,11.345v22.261c19.976,0,36.226-16.643,36.226-37.101v-22.261v-29.682h-21.736L265.057,211.473   L265.057,211.473z"/>
	<rect x="207.093" y="248.57" width="32.601" height="22.261"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),bW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="27.307 85.333 341.333 341.333">
<rect y="85.334" fill="#496E2D" width="512" height="341.337"/>
<polyline fill="#0052B4" points="0,426.663 0,85.329 512,85.329 "/>
<polygon fill="#FFDA44" points="0,396.494 0,426.663 45.255,426.663 512,115.499 512,85.329 466.745,85.329 "/>
<g>
	<polygon fill="#FFFFFF" points="85.688,108.787 90.808,124.543 107.374,124.543 93.971,134.28 99.091,150.037    85.688,140.299 72.283,150.037 77.403,134.28 64,124.543 80.567,124.543  "/>
	<polygon fill="#FFFFFF" points="170.312,108.787 175.433,124.543 192,124.543 178.597,134.28 183.717,150.037    170.312,140.299 156.909,150.037 162.029,134.28 148.626,124.543 165.192,124.543  "/>
	<polygon fill="#FFFFFF" points="85.688,191.289 90.808,207.045 107.374,207.045 93.971,216.783 99.091,232.54    85.688,222.801 72.283,232.54 77.403,216.783 64,207.045 80.567,207.045  "/>
	<polygon fill="#FFFFFF" points="170.312,191.289 175.433,207.045 192,207.045 178.597,216.783 183.717,232.54    170.312,222.801 156.909,232.54 162.029,216.783 148.626,207.045 165.192,207.045  "/>
	<polygon fill="#FFFFFF" points="128,150.037 133.12,165.793 149.688,165.793 136.283,175.531 141.403,191.289 128,181.55    114.597,191.289 119.717,175.531 106.312,165.793 122.88,165.793  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),FW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="87.04 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<polygon fill="#FFDA44" points="235.454,85.337 0,426.663 427.345,85.337 "/>
<polygon fill="#6DA544" points="512,329.393 0,426.663 512,426.663 "/>
<polygon fill="#D80027" points="512,85.337 427.345,85.337 0,426.663 512,222.151 "/>
<polygon fill="#0052B4" points="0,85.337 0,426.663 235.454,85.337 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),$W=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="3.413 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="85.337" fill="#D80027" width="512" height="113.775"/>
<rect y="312.888" fill="#000" width="512" height="113.775"/>
<polygon fill="#496E2D" points="0,426.668 0,85.331 256,256.006 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),xW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="30.72 85.333 341.333 341.333">
<rect y="85.333" fill="#0052B4" width="512" height="341.337"/>
<polygon fill="#FFDA44" points="192,85.33 128,85.33 128,223.996 0,223.996 0,287.996 128,287.996 128,426.662 192,426.662   192,287.996 512,287.996 512,223.996 192,223.996 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),OW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="85.337" fill="#D80027" width="512" height="170.663"/>
<g>
	<path fill="#FFFFFF" d="M83.478,170.666c0-24.865,17.476-45.637,40.812-50.734c-3.587-0.784-7.308-1.208-11.13-1.208   c-28.688,0-51.942,23.254-51.942,51.941s23.255,51.942,51.942,51.942c3.822,0,7.543-0.425,11.13-1.208   C100.954,216.304,83.478,195.532,83.478,170.666z"/>
	<polygon fill="#FFFFFF" points="150.261,122.435 153.945,133.772 165.866,133.772 156.221,140.779 159.905,152.116    150.261,145.11 140.616,152.116 144.301,140.779 134.656,133.772 146.577,133.772  "/>
	<polygon fill="#FFFFFF" points="121.344,144.696 125.027,156.033 136.948,156.033 127.303,163.04 130.987,174.377    121.344,167.371 111.699,174.377 115.384,163.04 105.739,156.033 117.66,156.033  "/>
	<polygon fill="#FFFFFF" points="179.178,144.696 182.862,156.033 194.783,156.033 185.138,163.04 188.822,174.377    179.178,167.371 169.534,174.377 173.219,163.04 163.574,156.033 175.495,156.033  "/>
	<polygon fill="#FFFFFF" points="168.047,178.087 171.731,189.424 183.652,189.424 174.008,196.431 177.692,207.768    168.047,200.762 158.404,207.768 162.088,196.431 152.444,189.424 164.364,189.424  "/>
	<polygon fill="#FFFFFF" points="132.474,178.087 136.157,189.424 148.078,189.424 138.434,196.431 142.118,207.768    132.474,200.762 122.83,207.768 126.514,196.431 116.87,189.424 128.79,189.424  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),SW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
	 viewBox="112.662 0 341.3 341.3">
<rect y="0" fill="#0052B4" width="512" height="341.3"/>
<polygon fill="#FFFFFF" points="256,0 256,117.4 209.9,117.4 256,148.1 256,170.7 233.4,170.7 160,121.8 160,170.7 96,170.7 96,121.8
	22.6,170.7 0,170.7 0,148.1 46.1,117.4 0,117.4 0,53.4 46.1,53.4 0,22.7 0,0 22.6,0 96,48.9 96,0 160,0 160,48.9 233.4,0 "/>
<g>
	<polygon fill="#D80027" points="144,0 112,0 112,69.4 0,69.4 0,101.4 112,101.4 112,170.7 144,170.7 144,101.4 256,101.4 256,69.4
		144,69.4 	"/>
	<polygon fill="#D80027" points="0,0 0,15.1 57.4,53.4 80,53.4 	"/>
	<polygon fill="#D80027" points="256,0 256,15.1 198.6,53.4 176,53.4 	"/>
</g>
<polygon fill="#2E52B2" points="256,22.7 256,53.4 209.9,53.4 "/>
<g>
	<polygon fill="#D80027" points="0,0 0,15.1 57.4,53.4 80,53.4 	"/>
	<polygon fill="#D80027" points="256,0 256,15.1 198.6,53.4 176,53.4 	"/>
</g>
<polygon fill="#2E52B2" points="256,22.7 256,53.4 209.9,53.4 "/>
<g>
	<polygon fill="#D80027" points="0,170.7 0,155.6 57.4,117.4 80,117.4 	"/>
	<polygon fill="#D80027" points="256,170.7 256,155.6 198.6,117.4 176,117.4 	"/>
</g>
<g>
	<path fill="#29DBFF" d="M449,139.7c-0.1,44.4-7.2,92.1-65,114.9c-57.8-22.8-64.9-70.5-65-114.9L449,139.7L449,139.7z"/>
	<path fill="#ffda44" d="M449,139.7c0-16.7-0.9-32.9-0.5-47.1C426.9,83,398.4,81,383.9,81s-42.9,2-64.6,11.6
		c0.4,14.2-0.5,30.4-0.5,47.1H449z"/>
	<path fill="#BF521B" d="M369.5,204.5l0.3,10.3L357,215l4.9,13.2l-17.3,0c-18-20.2-23.4-42.4-24.9-68.1l9.1-9.7l8.3,14.3l10.8-12.8
		l7,7.8l0.8,15.7L369.5,204.5z"/>
</g>
<polygon fill="#474747" points="436.6,192.5 428,210.8 381,210.8 351.8,191.3 377.5,201.8 402.6,201.8 406.3,195.3 413.5,195.5
	415.5,192.5 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),EW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="199.112" fill="#0052B4" width="512" height="113.775"/>
<rect y="312.888" fill="#D80027" width="512" height="113.775"/>
<path fill="#FFFFFF" d="M233.606,196.639v14.837c0,34.081-44.522,44.522-44.522,44.522s-44.522-10.44-44.522-44.522v-14.837  l-0.145-44.188l89.043-0.266L233.606,196.639z"/>
<path fill="#0052B4" d="M233.606,196.639v14.837c0,34.081-44.522,44.522-44.522,44.522s-44.522-10.44-44.522-44.522v-14.837  l-0.145-44.188l89.043-0.266L233.606,196.639z"/>
<path fill="#FFFFFF" d="M233.606,196.639v14.837c0,34.081-44.522,44.522-44.522,44.522s-44.522-10.44-44.522-44.522v-14.837  l14.848,14.837l29.674-22.261l29.685,22.261L233.606,196.639z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),PW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="40.96 85.333 341.333 341.333">
<rect y="85.334" fill="#D80027" width="512" height="341.337"/>
<polygon fill="#FFFFFF" points="512,295.883 202.195,295.883 202.195,426.666 183.652,426.666 140.978,426.666   122.435,426.666 122.435,295.883 0,295.883 0,277.329 0,234.666 0,216.111 122.435,216.111 122.435,85.329 140.978,85.329   183.652,85.329 202.195,85.329 202.195,216.111 512,216.111 512,234.666 512,277.329 "/>
<polygon fill="#2E52B2" points="512,234.666 512,277.329 183.652,277.329 183.652,426.666 140.978,426.666 140.978,277.329   0,277.329 0,234.666 140.978,234.666 140.978,85.329 183.652,85.329 183.652,234.666 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),CW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="66.56 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="196.641" fill="#0052B4" width="512" height="118.717"/>
<rect y="315.359" fill="#D80027" width="512" height="111.304"/>
<path fill="#FFFFFF" d="M129.468,181.799v85.136c0,48.429,63.267,63.267,63.267,63.267S256,315.362,256,266.935v-85.136  H129.468z"/>
<path fill="#D80027" d="M146.126,184.294v81.941c0,5.472,1.215,10.64,3.623,15.485c23.89,0,59.599,0,85.97,0  c2.408-4.844,3.623-10.012,3.623-15.485v-81.941H146.126z"/>
<polygon fill="#FFFFFF" points="221.301,241.427 199.876,241.427 199.876,227.144 214.16,227.144 214.16,212.861   199.876,212.861 199.876,198.577 185.593,198.577 185.593,212.861 171.311,212.861 171.311,227.144 185.593,227.144   185.593,241.427 164.167,241.427 164.167,255.711 185.593,255.711 185.593,269.994 199.876,269.994 199.876,255.711   221.301,255.711 "/>
<path fill="#0052B4" d="M169.232,301.658c9.204,5.783,18.66,9.143,23.502,10.636c4.842-1.494,14.298-4.852,23.502-10.636  c9.282-5.833,15.79-12.506,19.484-19.939c-4.075-2.883-9.047-4.583-14.418-4.583c-1.956,0-3.856,0.232-5.682,0.657  c-3.871-8.796-12.658-14.94-22.884-14.94c-10.227,0-19.013,6.144-22.884,14.94c-1.827-0.425-3.728-0.657-5.682-0.657  c-5.372,0-10.344,1.701-14.418,4.583C153.443,289.152,159.95,295.825,169.232,301.658z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),MW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="85.337" fill="#6DA544" width="512" height="113.775"/>
<rect y="312.888" fill="#338AF3" width="512" height="113.775"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),DW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.34" fill="#338AF3" width="512" height="341.326"/>
<polygon fill="#FFFFFF" points="512,85.334 512,252.024 0,256.175 0,85.334 "/>
<path fill="#6DA544" d="M323.744,203.099L256,270.843l-67.744-67.744c-8.76,13.005-13.879,28.658-13.879,45.483v22.261  c0,35.744,23.097,66.193,55.148,77.213c-4.277,8.385-3.556,18.848,2.712,26.671c8.326-6.673,16.945-13.58,24.258-19.439  c7.313,5.859,15.932,12.767,24.258,19.439c6.342-7.915,7.011-18.534,2.564-26.968c31.614-11.261,54.308-41.485,54.308-76.916  v-22.261C337.623,231.756,332.504,216.105,323.744,203.099z"/>
<path fill="#FFDA44" d="M256,330.206c-32.732,0-59.362-26.63-59.362-59.362v-22.261c0-32.733,26.63-59.363,59.362-59.363  s59.362,26.63,59.362,59.362v22.261C315.362,303.576,288.732,330.206,256,330.206z"/>
<path fill="#338AF3" d="M293.101,270.843v-22.261c0-20.458-16.643-37.101-37.101-37.101s-37.101,16.643-37.101,37.101v22.261  L256,278.264L293.101,270.843z"/>
<path fill="#6DA544" d="M218.899,270.843L218.899,270.843c0,20.458,16.643,37.101,37.101,37.101  c20.458,0,37.101-16.643,37.101-37.101l0,0H218.899L218.899,270.843z"/>
<path fill="#FFDA44" d="M300.522,189.22c0-12.295-9.966-22.261-22.261-22.261c-5.703,0-10.901,2.146-14.84,5.672v-13.093  h7.421v-14.84h-7.421v-7.421h-14.84v7.421h-7.421v14.84h7.421v13.093c-3.94-3.526-9.138-5.672-14.841-5.672  c-12.295,0-22.261,9.966-22.261,22.261c0,6.591,2.867,12.512,7.421,16.589v13.093h74.203v-13.093  C297.655,201.732,300.522,195.812,300.522,189.22z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),AW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#FFDA44" width="512" height="341.326"/>
<rect x="330.207" y="85.331" fill="#D80027" width="181.793" height="341.337"/>
<g>
	<rect y="85.331" fill="#496E2D" width="181.793" height="341.337"/>
	<polygon fill="#496E2D" points="255.999,196.632 270.732,241.979 318.417,241.979 279.841,270.008 294.575,315.356    255.999,287.33 217.422,315.356 232.159,270.008 193.583,241.979 241.264,241.979  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),TW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#338AF3" width="512" height="341.337"/>
<polygon fill="#FFFFFF" points="256,157.273 278.663,227.021 352,227.021 292.668,270.127 315.332,339.876 256,296.769   196.668,339.876 219.332,270.127 160,227.021 233.337,227.021 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),jW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#FFFFFF" width="512" height="341.337"/>
<rect y="196.636" fill="#A2001D" width="512" height="118.728"/>
<g>
	<rect y="352.462" fill="#6DA544" width="512" height="74.207"/>
	<rect y="85.331" fill="#6DA544" width="512" height="74.207"/>
</g>
<polygon fill="#FFDA44" points="256.742,218.003 266.172,247.024 296.69,247.024 272,264.963 281.431,293.986   256.742,276.049 232.053,293.986 241.484,264.963 216.794,247.024 247.312,247.024 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),zW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="5.12 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="322.783" fill="#496E2D" width="512" height="103.88"/>
<rect y="85.337" fill="#000" width="512" height="104.515"/>
<rect y="210.877" fill="#A2001D" width="512" height="89.656"/>
<polygon fill="#0052B4" points="256,256.006 0,426.668 0,85.331 "/>
<polygon fill="#FFDA44" points="73.178,209.188 94.009,238.255 128.093,227.425 106.886,256.22 127.716,285.289   93.777,274.018 72.569,302.812 72.803,267.05 38.863,255.777 72.946,244.947 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),NW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFDA44" width="512" height="341.326"/>
<g>
	<rect y="85.337" fill="#6DA544" width="512" height="113.775"/>
	<rect y="312.888" fill="#6DA544" width="512" height="113.775"/>
</g>
<polygon fill="#D80027" points="256,256.006 0,426.668 0,85.331 "/>
<polygon fill="#000" points="302.049,226.318 309.417,248.992 333.259,248.992 313.971,263.008 321.337,285.682 302.049,271.667   282.762,285.682 290.128,263.008 270.84,248.992 294.682,248.992 "/>
<polygon fill="#000" points="376.252,226.318 383.619,248.992 407.461,248.992 388.173,263.008 395.54,285.682 376.252,271.667 356.964,285.682   364.331,263.008 345.043,248.992 368.885,248.992 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),kW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<g>
	<rect y="85.337" fill="#0052B4" width="512" height="113.775"/>
	<rect y="312.888" fill="#0052B4" width="512" height="113.775"/>
</g>
<polygon fill="#FFDA44" points="228.582,261.936 256,214.447 283.418,261.936 "/>
<polygon fill="#6DA544" points="291.616,277.616 256,295.425 220.384,277.616 220.384,253.872 291.616,253.872 "/>
<path fill="#FFDA44" d="M289.579,216.485l-12.592,12.592c5.37,5.372,8.693,12.791,8.693,20.988  c0,16.392-13.289,29.68-29.68,29.68c-16.392,0-29.68-13.289-29.68-29.68c0-8.195,3.322-15.616,8.693-20.988l-12.592-12.592  c-8.594,8.594-13.91,20.466-13.91,33.579c0,26.228,21.261,47.489,47.489,47.489s47.489-21.261,47.489-47.489  C303.489,236.95,298.173,225.077,289.579,216.485z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),IW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="3.413 85.333 341.333 341.333">
<rect y="85.337" fill="#0052B4" width="512" height="341.326"/>
<polygon fill="#D80027" points="512,85.331 512,252.021 0,256.173 0,85.331 "/>
<polygon fill="#FFFFFF" points="256,256.006 0,426.668 0,85.331 "/>
<g>
	<path fill="#FFDA44" d="M59.621,256c-0.116,1.509-0.193,3.031-0.193,4.57c0,32.821,26.607,59.429,59.429,59.429   s59.429-26.607,59.429-59.429c0-1.539-0.078-3.061-0.193-4.57L59.621,256L59.621,256z"/>
	<circle fill="#FFDA44" cx="118.862" cy="210.287" r="18.286"/>
</g>
<path fill="#D80027" d="M77.715,205.714v59.429c0,31.494,41.144,41.143,41.144,41.143s41.144-9.649,41.144-41.143v-59.429  H77.715z"/>
<path fill="#338AF3" d="M118.877,287.148c-7.632-2.746-22.876-9.767-22.876-22.006v-41.144h45.715v41.144  C141.715,277.422,126.472,284.425,118.877,287.148z"/>
<polygon fill="#F3F3F3" points="128.001,246.856 128.001,237.714 118.857,233.143 109.715,237.714 109.715,246.856   105.144,251.429 105.144,269.714 132.572,269.714 132.572,251.429 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),BW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#FFFFFF" width="512" height="341.337"/>
<rect y="85.331" fill="#D80027" width="512" height="113.775"/>
<rect y="312.882" fill="#000" width="512" height="113.775"/>
<g>
	<polygon fill="#6DA544" points="187.31,215.184 196.518,243.525 226.32,243.525 202.21,261.043 211.419,289.385    187.31,271.869 163.2,289.385 172.409,261.043 148.3,243.525 178.101,243.525  "/>
	<polygon fill="#6DA544" points="324.69,215.184 333.899,243.525 363.7,243.525 339.591,261.043 348.8,289.385    324.69,271.869 300.581,289.385 309.79,261.043 285.68,243.525 315.482,243.525  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),LW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="150 0 600 600">
<path fill="#2B5DEA" d="M0,0h900v600H0V0z"/>
<path fill="#FFDF29" d="M0,100h900v400H0V100z"/>
<path fill="#D70000" d="M0,150h900v300H0V150z"/>
<path fill="#FFFFFF" d="M450,171.4v257.2c114.3,0,171.4-85.7,214.3-128.6C621.4,257.1,564.3,171.4,450,171.4z"/>
<path fill="#000" d="M450,171.4c-100,0-171.4,85.7-214.3,128.6C278.6,342.9,350,428.6,450,428.6V171.4z"/>
<rect x="346.3" y="254.3" fill="#FFFFFF" width="21" height="91.3"/>
<rect x="398.2" y="254.3" fill="#FFFFFF" width="21" height="91.3"/>
<rect x="477.8" y="254.3" fill="#000" width="21" height="91.3"/>
<rect x="529.7" y="254.3" fill="#000" width="21" height="91.3"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),RW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="114.347 85.333 341.333 341.333">
<rect y="85.333" fill="#0052B4" width="512" height="341.337"/>
<path fill="#FFDA44" d="M332.058,191.996v78.221c0,38.103,51.942,49.779,51.942,49.779s51.942-11.675,51.942-49.779v-78.221  H332.058z"/>
<path fill="#FF9811" d="M376.579,220.44c0,7.855-6.644,28.445-14.84,28.445s-14.84-20.589-14.84-28.445  c0-7.856,14.84-14.222,14.84-14.222S376.579,212.585,376.579,220.44z"/>
<path fill="#A2001D" d="M415.961,235.93c2.394-5.6,4.257-13.785,4.257-17.86c0-6.546-8.904-11.852-8.904-11.852  s-8.904,5.306-8.904,11.852c0,4.075,1.862,12.26,4.257,17.86l-5.141,11.123c3.022,1.178,6.324,1.831,9.788,1.831  c3.463,0,6.766-0.654,9.788-1.831L415.961,235.93z"/>
<path fill="#6DA544" d="M372.87,270.217c0,0-7.421,14.222-7.421,28.445c0,0,22.261,0,37.101,0  c0-14.222-7.421-28.445-7.421-28.445l-11.13-7.111L372.87,270.217z"/>
<path fill="#D80027" d="M395.13,270.217v-3.555c0-5.891-4.983-10.666-11.13-10.666c-6.147,0-11.13,4.776-11.13,10.666v3.555  H395.13L395.13,270.217z"/>
<polygon fill="#FFFFFF" points="256,85.333 256,115.886 210.833,140.985 256,140.985 256,200.344 196.897,200.344   256,233.179 256,255.996 229.32,255.996 155.826,215.17 155.826,255.996 100.174,255.996 100.174,207.423 12.744,255.996 0,255.996   0,225.442 45.167,200.344 0,200.344 0,140.985 59.103,140.985 0,108.139 0,85.333 26.68,85.333 100.174,126.158 100.174,85.333   155.826,85.333 155.826,133.905 243.256,85.333 "/>
<polygon fill="#D80027" points="144,85.33 112,85.33 112,154.662 0,154.662 0,186.662 112,186.662 112,255.996 144,255.996   144,186.662 256,186.662 256,154.662 144,154.662 "/>
<polygon fill="#0052B4" points="155.826,200.344 256,255.996 256,240.259 184.153,200.344 "/>
<polygon fill="#FFFFFF" points="155.826,200.344 256,255.996 256,240.259 184.153,200.344 "/>
<g>
	<polygon fill="#D80027" points="155.826,200.344 256,255.996 256,240.259 184.153,200.344  "/>
	<polygon fill="#D80027" points="71.846,200.344 0,240.259 0,255.996 0,255.996 100.174,200.344  "/>
</g>
<polygon fill="#0052B4" points="100.174,140.982 0,85.33 0,101.067 71.847,140.982 "/>
<polygon fill="#FFFFFF" points="100.174,140.982 0,85.33 0,101.067 71.847,140.982 "/>
<g>
	<polygon fill="#D80027" points="100.174,140.982 0,85.33 0,101.067 71.847,140.982  "/>
	<polygon fill="#D80027" points="184.154,140.982 256,101.067 256,85.33 256,85.33 155.826,140.982  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),VW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#FFDA44" width="512" height="341.337"/>
<rect y="85.331" fill="#0052B4" width="170.663" height="341.337"/>
<rect x="341.337" y="85.331" fill="#D80027" width="170.663" height="341.337"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),HW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="3.75 0 15 15">
	<path fill="#FFFFFF" d="M0,0h21v15H0V0z"/>
	<path fill="#073AB6" d="M0,0h22.5v15H0V0z"/>
	<path fill="#FFFFFF" d="M0,0h11.3v7.5H0V0z"/>
	<path fill="#F44653" d="M7.1,0h3.6v7H7.1V0z"/>
	<path fill="#1035BB" d="M0,0h3.6v7H0V0z"/>
	<path fill="#FFFFFF" d="M3.6,0h3.6v7H3.6V0z"/>
	<path fill="#FFFFFF" d="M14.5,6h5L19,7h-1.5v0.5h1l-0.5,1h-0.5V10h-1V7H15L14.5,6z M18.5,8.5l1,1.5h-2L18.5,8.5z M15.5,8.5l1,1.5h-2
		L15.5,8.5z M17,11.5L16,10h2L17,11.5z M20,8c-0.3,0-0.5-0.2-0.5-0.5S19.7,7,20,7s0.5,0.2,0.5,0.5S20.3,8,20,8z M14,8
		c-0.3,0-0.5-0.2-0.5-0.5S13.7,7,14,7s0.5,0.2,0.5,0.5S14.3,8,14,8z M15,12c-0.3,0-0.5-0.2-0.5-0.5S14.7,11,15,11s0.5,0.2,0.5,0.5
		S15.3,12,15,12z M19,12c-0.3,0-0.5-0.2-0.5-0.5S18.7,11,19,11s0.5,0.2,0.5,0.5S19.3,12,19,12z M17,13c-0.3,0-0.5-0.2-0.5-0.5
		S16.7,12,17,12s0.5,0.2,0.5,0.5S17.3,13,17,13z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),UW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 85.333 341.333 341.333">
<rect y="85.337" fill="#FFDA44" width="512" height="341.326"/>
<g>
	<rect y="85.337" fill="#496E2D" width="512" height="68.263"/>
	<rect y="358.4" fill="#496E2D" width="512" height="68.263"/>
	<rect y="221.863" fill="#496E2D" width="512" height="68.263"/>
</g>
<rect y="85.337" fill="#D80027" width="204.054" height="204.054"/>
<polygon fill="#FFFFFF" points="102.026,133.938 115.286,174.75 158.202,174.75 123.484,199.976 136.744,240.79   102.026,215.566 67.307,240.79 80.57,199.976 45.852,174.75 88.765,174.75 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),WW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.334" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="194.056" fill="#0052B4" width="512" height="123.882"/>
<g>
	<rect y="85.334" fill="#D80027" width="512" height="54.522"/>
	<rect y="372.143" fill="#D80027" width="512" height="54.522"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),GW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="85.337" fill="#D80027" width="512" height="113.775"/>
<rect y="312.888" fill="#6DA544" width="512" height="113.775"/>
<g>
	<polygon fill="#FFDA44" points="226.318,300.522 285.682,300.522 285.682,275.292 273.809,281.229 256,263.421    238.191,281.229 226.318,275.292  "/>
	<polygon fill="#FFDA44" points="192.355,270.84 195.118,279.344 204.058,279.344 196.825,284.599 199.588,293.101    192.355,287.846 185.121,293.101 187.884,284.599 180.651,279.344 189.591,279.344  "/>
	<polygon fill="#FFDA44" points="200.921,241.16 203.684,249.662 212.624,249.662 205.391,254.917 208.154,263.421    200.921,258.165 193.687,263.421 196.45,254.917 189.217,249.662 198.157,249.662  "/>
	<polygon fill="#FFDA44" points="225.409,218.899 228.172,227.401 237.112,227.401 229.879,232.656 232.642,241.16    225.409,235.904 218.175,241.16 220.938,232.656 213.705,227.401 222.645,227.401  "/>
	<polygon fill="#FFDA44" points="319.645,270.84 316.882,279.344 307.942,279.344 315.175,284.599 312.412,293.101    319.645,287.846 326.879,293.101 324.116,284.599 331.349,279.344 322.409,279.344  "/>
	<polygon fill="#FFDA44" points="311.079,241.16 308.316,249.662 299.376,249.662 306.609,254.917 303.846,263.421    311.079,258.165 318.313,263.421 315.55,254.917 322.783,249.662 313.843,249.662  "/>
	<polygon fill="#FFDA44" points="286.591,218.899 283.828,227.401 274.888,227.401 282.121,232.656 279.358,241.16    286.591,235.904 293.825,241.16 291.062,232.656 298.295,227.401 289.355,227.401  "/>
	<polygon fill="#FFDA44" points="256,207.767 258.763,216.27 267.704,216.27 260.47,221.526 263.233,230.028 256,224.774    248.767,230.028 251.53,221.526 244.296,216.27 253.237,216.27  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),KW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="18.773 85.333 341.333 341.333">
<rect y="85.337" fill="#0052B4" width="512" height="341.326"/>
<g>
	<polygon fill="#FFFFFF" points="210.715,174.377 214.399,185.715 226.318,185.715 216.675,192.721 220.359,204.058    210.715,197.051 201.071,204.058 204.755,192.721 195.11,185.715 207.031,185.715  "/>
	<polygon fill="#FFFFFF" points="116.816,281.971 121.421,296.143 136.321,296.143 124.266,304.9 128.872,319.073    116.816,310.313 104.761,319.073 109.365,304.9 97.311,296.143 112.21,296.143  "/>
	<polygon fill="#FFFFFF" points="144.696,119.679 149.3,133.851 164.201,133.851 152.145,142.609 156.751,156.78    144.696,148.021 132.64,156.78 137.246,142.609 125.191,133.851 140.091,133.851  "/>
	<polygon fill="#FFFFFF" points="69.539,175.331 74.143,189.503 89.043,189.503 76.988,198.261 81.594,212.432    69.539,203.674 57.483,212.432 62.089,198.261 50.034,189.503 64.934,189.503  "/>
</g>
<g>
	<path fill="#FFDA44" d="M483.386,354.503H117.801c0,0,109.234-88.562,310.593-220.938   C428.395,133.565,339.951,262.5,483.386,354.503z"/>
	<path fill="#FFDA44" d="M117.801,366.089c-11.177,0-11.195,17.37,0,17.37h365.585c11.177,0,11.195-17.37,0-17.37H117.801z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),qW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 85.333 341.333 341.333">
<rect y="85.337" fill="#D80027" width="512" height="341.326"/>
<polygon fill="#FFDA44" points="256,256 0,90.691 0,134.933 155.826,256 0,377.067 0,421.309 "/>
<polygon fill="#000" points="0,90.691 0,421.309 189.217,256 "/>
<polygon fill="#FFFFFF" points="44.184,213.36 69.096,236.937 99.217,220.527 84.494,251.507 109.405,275.082   75.393,270.652 60.67,301.63 54.374,267.914 20.362,263.484 50.481,247.076 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),YW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="81.92 85.333 341.333 341.333">
<rect y="85.337" fill="#496E2D" width="512" height="341.326"/>
<g>
	<path fill="#FFFFFF" d="M357.208,183.679c8.397-23.404-1.036-48.858-21.281-61.536c3.641,0.474,7.287,1.331,10.884,2.621   c27.002,9.688,41.038,39.428,31.35,66.431s-39.428,41.038-66.431,31.35c-3.597-1.291-6.957-2.947-10.069-4.895   C325.347,220.734,348.811,207.084,357.208,183.679z"/>
	<polygon fill="#FFFFFF" points="310.637,115.729 303.34,125.156 292.12,121.13 298.832,130.982 291.536,140.409    302.979,137.071 309.691,146.923 310.052,135.009 321.496,131.67 310.275,127.645  "/>
	<polygon fill="#FFFFFF" points="330.338,146.448 323.042,155.875 311.821,151.849 318.533,161.701 311.237,171.128    322.68,167.789 329.392,177.642 329.752,165.727 341.197,162.387 329.976,158.363  "/>
	<polygon fill="#FFFFFF" points="275.9,126.916 268.604,136.343 257.385,132.319 264.096,142.17 256.8,151.596    268.243,148.258 274.955,158.11 275.316,146.195 286.76,142.858 275.539,138.831  "/>
	<polygon fill="#FFFFFF" points="275.101,162.105 267.805,171.532 256.584,167.506 263.296,177.358 256,186.785    267.444,183.447 274.155,193.299 274.517,181.384 285.96,178.046 274.74,174.02  "/>
	<polygon fill="#FFFFFF" points="308.585,174.118 301.289,183.545 290.069,179.519 296.781,189.372 289.484,198.798    300.928,195.46 307.64,205.312 308,193.397 319.443,190.059 308.224,186.034  "/>
</g>
<rect x="83.478" y="85.337" fill="#D80027" width="89.043" height="341.326"/>
<polygon fill="#FFFFFF" points="117.458,175.191 102.55,164.086 102.55,148.381 117.458,137.276 138.542,137.276   153.45,148.381 153.45,164.086 138.542,175.191 "/>
<g>
	<polygon fill="#FF9811" points="128,137.276 117.458,137.276 102.55,148.381 102.55,156.059 128,156.059  "/>
	<polygon fill="#FF9811" points="128,175.191 138.542,175.191 153.45,164.086 153.45,156.074 128,156.074  "/>
</g>
<polygon fill="#FFFFFF" points="117.458,374.725 102.55,363.619 102.55,347.915 117.458,336.81 138.542,336.81   153.45,347.915 153.45,363.619 138.542,374.725 "/>
<g>
	<polygon fill="#FF9811" points="128,336.81 117.458,336.81 102.55,347.915 102.55,355.593 128,355.593  "/>
	<polygon fill="#FF9811" points="128,374.725 138.542,374.725 153.45,363.619 153.45,355.608 128,355.608  "/>
</g>
<g>
	<polygon fill="#496E2D" points="117.458,274.957 102.55,263.852 102.55,248.149 117.458,237.043 138.542,237.043    153.45,248.149 153.45,263.852 138.542,274.957  "/>
	<polygon fill="#496E2D" points="153.971,299.391 147.478,299.391 147.478,292.898 136.067,292.898 127.999,284.83    119.932,292.898 108.522,292.898 108.522,299.391 102.029,299.391 102.029,312.377 108.522,312.377 108.522,318.869    119.932,318.869 128,326.938 136.068,318.869 147.478,318.869 147.478,312.377 153.971,312.377  "/>
	<polygon fill="#496E2D" points="153.971,199.623 147.478,199.623 147.478,193.131 136.067,193.131 127.999,185.062    119.932,193.131 108.522,193.131 108.522,199.623 102.029,199.623 102.029,212.609 108.522,212.609 108.522,219.101    119.932,219.101 128,227.171 136.068,219.101 147.478,219.101 147.478,212.609 153.971,212.609  "/>
</g>
<g>
	<rect x="120.576" y="248.576" fill="#D80027" width="14.84" height="14.84"/>
	<circle fill="#D80027" cx="128" cy="206.113" r="7.421"/>
	<circle fill="#D80027" cx="128" cy="305.887" r="7.421"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),ZW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#D80027" width="512" height="341.337"/>
<circle fill="#FFFFFF" cx="256" cy="255.994" r="96"/>
<g>
	<polygon fill="#D80027" points="267.826,219.291 284.296,241.986 310.969,233.337 294.473,256.013 310.941,278.708    284.277,270.027 267.782,292.703 267.799,264.663 241.135,255.981 267.809,247.333  "/>
	<path fill="#D80027" d="M277.818,312.724c-31.33,0-56.727-25.397-56.727-56.727s25.397-56.727,56.727-56.727   c9.769,0,18.96,2.47,26.985,6.819c-12.589-12.31-29.804-19.909-48.803-19.909c-38.558,0-69.818,31.259-69.818,69.818   s31.26,69.818,69.818,69.818c18.999,0,36.215-7.599,48.803-19.909C296.777,310.254,287.587,312.724,277.818,312.724z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),JW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="11.947 85.333 341.333 341.333">
<rect y="85.331" fill="#D80027" width="512" height="341.337"/>
<rect y="85.331" fill="#FFFFFF" width="256" height="170.663"/>
<polygon fill="#D80027" points="141.357,157.303 141.357,130.59 114.643,130.59 114.643,157.303 87.93,157.303   87.93,184.016 114.643,184.016 114.643,210.729 141.357,210.729 141.357,184.016 168.07,184.016 168.07,157.303 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),XW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="76.95 0 342 342">
<rect fill="#E30A17" width="513" height="342"/>
<path fill="#FFFFFF" d="M259.7,118.6c-13.1-9.5-29-14.6-45.3-14.5c-40.8,0-73.8,30.8-73.8,68.9s33.1,68.9,73.8,68.9
	c17.1,0,32.9-5.4,45.3-14.5c-30,38.6-85.7,45.6-124.3,15.5s-45.6-85.7-15.5-124.3s85.7-45.6,124.3-15.5
	C250,107.6,255.2,112.9,259.7,118.6z M299.6,184.4l-18.1,21.9l1.2-28.4l-26.4-10.4l27.3-7.6l1.8-28.3l15.6,23.7l27.5-7.1L311,170.2
	l15.3,23.9L299.6,184.4L299.6,184.4z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),QW=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#D80027" width="512" height="341.326"/>
<polygon fill="#FFFFFF" points="6.066,85.337 214.027,297.973 345.611,426.663 505.934,426.663 297.973,214.027   166.389,85.337 "/>
<polygon fill="#000" points="43.364,85.337 384.69,426.663 468.636,426.663 127.31,85.337 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),eG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="150 0 600 600">
<rect fill="#0052B4" width="900" height="600"/>
<path fill="#00B2EE" d="M0,300h450V0h450v600H0V300z"/>
<path fill="#FFDA44" d="M345.3,480.9l29.4,90.6l-77.1-56H393l-77.1,56L345.3,480.9z"/>
<path fill="#FFDA44" d="M706.4,340l29.4,90.6l-77.1-56h95.3l-77.1,56L706.4,340z"/>
<path fill="#FFDA44" d="M812.8,261.5l29.4,90.6l-77.1-56h95.3l-77.1,56L812.8,261.5z"/>
<path fill="#FFDA44" d="M812.8,37.4l29.4,90.6l-77.1-56h95.3l-77.1,56L812.8,37.4z"/>
<polygon fill="#FFFFFF" points="449.9,0 449.9,206.3 368.9,206.3 449.9,260.3 449.9,300 410.2,300 281.2,214.1 281.2,300 168.7,300 168.7,214.1 39.7,300 0,300 0,260.3 81,206.3 0,206.3 0,93.8 81,93.8 0,39.9 0,0 39.7,0 168.7,85.9 168.7,0 281.2,0 281.2,85.9 410.2,0 "/>
<polygon fill="#D80027" points="253.1,0 196.8,0 196.8,122 0,122 0,178.2 196.8,178.2 196.8,300 253.1,300 253.1,178.2 449.9,178.2 449.9,122 253.1,122 	"/>
<polygon fill="#2E52B2" points="449.9,39.9 449.9,93.8 368.9,93.8 "/>
<polygon fill="#D80027" points="0,300 0,280.7 109.9,206.3 149.6,206.3 12.8,300 	"/>
<polygon fill="#D80027" points="12.8,0.1 149.6,93.8 109.9,93.8 0,19.4 0,0.1 "/>
<polygon fill="#D80027" points="449.9,0.2 449.9,19.5 340,93.8 300.3,93.8 437.1,0.2 "/>
<polygon fill="#D80027" points="437.1,300 300.3,206.3 340,206.3 449.9,280.7 449.9,300 "/>
<path fill="#FFDA44" d="M719.9,131.6l29.4,90.6l-77.1-56h95.3l-77.1,56L719.9,131.6z"/>
<path fill="#FFDA44" d="M584,187.7l29.4,90.6l-77.1-56h95.3l-77.1,56L584,187.7z"/>
<path fill="#FFDA44" d="M614,430.6l29.4,90.6l-77.1-56h95.3l-77.1,56L614,430.6z"/>
<path fill="#FFDA44" d="M488,332l29.4,90.6l-77.1-56h95.3l-77.1,56L488,332z"/>
<path fill="#FFDA44" d="M488,464l29.4,90.6l-77.1-56h95.3l-77.1,56L488,464z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),tG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="6.827 85.333 341.333 341.333">
<rect y="85.337" fill="#D80027" width="512" height="341.326"/>
<rect y="85.337" fill="#0052B4" width="256" height="170.663"/>
<polygon fill="#FFFFFF" points="186.435,170.669 162.558,181.9 175.272,205.025 149.345,200.064 146.059,226.256   128,206.993 109.94,226.256 106.655,200.064 80.728,205.024 93.442,181.899 69.565,170.669 93.442,159.438 80.728,136.313   106.655,141.273 109.941,115.081 128,134.344 146.06,115.081 149.345,141.273 175.273,136.313 162.558,159.438 "/>
<circle fill="#0052B4" cx="128" cy="170.674" r="29.006"/>
<path fill="#FFFFFF" d="M128,190.06c-10.692,0-19.391-8.7-19.391-19.391c0-10.692,8.7-19.391,19.391-19.391  c10.692,0,19.391,8.7,19.391,19.391C147.391,181.36,138.692,190.06,128,190.06z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),nG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#338AF3" width="512" height="341.326"/>
<polyline fill="#6DA544" points="0,426.663 0,85.337 512,85.337 "/>
<polygon fill="#FFDA44" points="512,152.222 512,85.337 411.67,85.337 0,359.778 0,426.663 100.33,426.663 "/>
<polygon fill="#000" points="512,85.337 512,125.462 60.193,426.663 0,426.663 0,386.538 451.807,85.337 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),rG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFDA44" width="512" height="341.326"/>
<rect y="85.337" fill="#338AF3" width="512" height="170.663"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),oG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.35 0 341.3 341.3">
<rect y="0" fill="#232323" width="512" height="341.3"/>
<rect y="56.9" fill="#FFDA44" width="512" height="56.9"/>
<rect y="113.8" fill="#D32300" width="512" height="56.9"/>
<rect y="227.6" fill="#FFDA44" width="512" height="56.9"/>
<rect y="284.4" fill="#D32300" width="512" height="56.9"/>
<circle fill="#FFFFFF" cx="256" cy="170.7" r="80.7"/>
<path fill="#000000" d="M234.5,127.5c0.9-1.4-19.6-2-19.6-2c1.7-2.5,18.4-10.5,18.4-10.5s-0.9-6,2.7-9.8l-4.5-9.8c0,0,7-3.4,18.4-3.4
	s19.9,7,21,13.1l-6.4,3.4c-0.1,4.7,1.7,11.6-4.3,17.3c-5.9,5.7-8.3,6.9-8.5,18.8c0,3.9,2.3,8.2,8.8,11.7
	c17.4,9.3,38.6,28.2,44.6,33.9c6.1,5.7,5.1,19.2,2.6,25.2s-12.1,14.3-14.3,13.6c-2.2-0.6,1.2-9.2-3.5-11.6c0,0-8.9-7.6-16.8,0.6
	s-0.2,25.2,3.9,28c4.1,2.8,1.7,5-1.9,5h-28.1c-3.8,0-5.4-2.3-1.9-5c7.6-3.8,12.4-15.3,7.4-20.3c-4.9-4.9-18.3,1.5-21.5,6.3
	c-2.8,2.8-8.8,3.6-12.9-1.4s-4.1-10.4-1.1-12.5c7-4.8,0,0,0.1-0.1c0,0,11.9-8.6,29.9-9c3.9,0,4.8-2.2,2.2-4.8
	c0,0-30.9-27.4-28.1-44.2C224.1,141.7,241.1,133.7,234.5,127.5C233.2,125.7,234.5,127.5,234.5,127.5z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),iG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.5 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g fill="#D80027">
	<rect y="0" width="513" height="26.3"/>
	<rect y="52.6" width="513" height="26.3"/>
	<rect y="105.2" width="513" height="26.3"/>
	<rect y="157.8" width="513" height="26.3"/>
	<rect y="210.5" width="513" height="26.3"/>
	<rect y="263.1" width="513" height="26.3"/>
	<rect y="315.7" width="513" height="26.3"/>
</g>
<rect fill="#2E52B2" width="256.5" height="184.1"/>
<g fill="#FFFFFF">
	<polygon points="47.8,138.9 43.8,126.1 39.4,138.9 26.2,138.9 36.9,146.6 32.9,159.4 43.8,151.5 54.4,159.4
		50.3,146.6 61.2,138.9 	"/>
	<polygon points="104.1,138.9 100,126.1 95.8,138.9 82.6,138.9 93.3,146.6 89.3,159.4 100,151.5 110.8,159.4
		106.8,146.6 117.5,138.9 	"/>
	<polygon points="160.6,138.9 156.3,126.1 152.3,138.9 138.8,138.9 149.8,146.6 145.6,159.4 156.3,151.5 167.3,159.4
		163.1,146.6 173.8,138.9 	"/>
	<polygon points="216.8,138.9 212.8,126.1 208.6,138.9 195.3,138.9 206.1,146.6 202.1,159.4 212.8,151.5 223.6,159.4
		219.3,146.6 230.3,138.9 	"/>
	<polygon points="100,75.3 95.8,88.1 82.6,88.1 93.3,96 89.3,108.6 100,100.8 110.8,108.6 106.8,96 117.5,88.1
		104.1,88.1 	"/>
	<polygon points="43.8,75.3 39.4,88.1 26.2,88.1 36.9,96 32.9,108.6 43.8,100.8 54.4,108.6 50.3,96 61.2,88.1
		47.8,88.1 	"/>
	<polygon points="156.3,75.3 152.3,88.1 138.8,88.1 149.8,96 145.6,108.6 156.3,100.8 167.3,108.6 163.1,96 173.8,88.1
		160.6,88.1 	"/>
	<polygon points="212.8,75.3 208.6,88.1 195.3,88.1 206.1,96 202.1,108.6 212.8,100.8 223.6,108.6 219.3,96 230.3,88.1
		216.8,88.1 	"/>
	<polygon points="43.8,24.7 39.4,37.3 26.2,37.3 36.9,45.2 32.9,57.9 43.8,50 54.4,57.9 50.3,45.2 61.2,37.3 47.8,37.3
			"/>
	<polygon points="100,24.7 95.8,37.3 82.6,37.3 93.3,45.2 89.3,57.9 100,50 110.8,57.9 106.8,45.2 117.5,37.3
		104.1,37.3 	"/>
	<polygon points="156.3,24.7 152.3,37.3 138.8,37.3 149.8,45.2 145.6,57.9 156.3,50 167.3,57.9 163.1,45.2 173.8,37.3
		160.6,37.3 	"/>
	<polygon points="212.8,24.7 208.6,37.3 195.3,37.3 206.1,45.2 202.1,57.9 212.8,50 223.6,57.9 219.3,45.2 230.3,37.3
		216.8,37.3 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),sG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="59.85 0 342 342">
<rect y="0" fill="#FFFFFF" width="513" height="342"/>
<g fill="#D80027">
	<rect y="0" width="513" height="26.3"/>
	<rect y="52.6" width="513" height="26.3"/>
	<rect y="105.2" width="513" height="26.3"/>
	<rect y="157.8" width="513" height="26.3"/>
	<rect y="210.5" width="513" height="26.3"/>
	<rect y="263.1" width="513" height="26.3"/>
	<rect y="315.7" width="513" height="26.3"/>
</g>
<rect fill="#2E52B2" width="256.5" height="184.1"/>
<g fill="#FFFFFF">
	<polygon points="47.8,138.9 43.8,126.1 39.4,138.9 26.2,138.9 36.9,146.6 32.9,159.4 43.8,151.5 54.4,159.4
		50.3,146.6 61.2,138.9 	"/>
	<polygon points="104.1,138.9 100,126.1 95.8,138.9 82.6,138.9 93.3,146.6 89.3,159.4 100,151.5 110.8,159.4
		106.8,146.6 117.5,138.9 	"/>
	<polygon points="160.6,138.9 156.3,126.1 152.3,138.9 138.8,138.9 149.8,146.6 145.6,159.4 156.3,151.5 167.3,159.4
		163.1,146.6 173.8,138.9 	"/>
	<polygon points="216.8,138.9 212.8,126.1 208.6,138.9 195.3,138.9 206.1,146.6 202.1,159.4 212.8,151.5 223.6,159.4
		219.3,146.6 230.3,138.9 	"/>
	<polygon points="100,75.3 95.8,88.1 82.6,88.1 93.3,96 89.3,108.6 100,100.8 110.8,108.6 106.8,96 117.5,88.1
		104.1,88.1 	"/>
	<polygon points="43.8,75.3 39.4,88.1 26.2,88.1 36.9,96 32.9,108.6 43.8,100.8 54.4,108.6 50.3,96 61.2,88.1
		47.8,88.1 	"/>
	<polygon points="156.3,75.3 152.3,88.1 138.8,88.1 149.8,96 145.6,108.6 156.3,100.8 167.3,108.6 163.1,96 173.8,88.1
		160.6,88.1 	"/>
	<polygon points="212.8,75.3 208.6,88.1 195.3,88.1 206.1,96 202.1,108.6 212.8,100.8 223.6,108.6 219.3,96 230.3,88.1
		216.8,88.1 	"/>
	<polygon points="43.8,24.7 39.4,37.3 26.2,37.3 36.9,45.2 32.9,57.9 43.8,50 54.4,57.9 50.3,45.2 61.2,37.3 47.8,37.3
			"/>
	<polygon points="100,24.7 95.8,37.3 82.6,37.3 93.3,45.2 89.3,57.9 100,50 110.8,57.9 106.8,45.2 117.5,37.3
		104.1,37.3 	"/>
	<polygon points="156.3,24.7 152.3,37.3 138.8,37.3 149.8,45.2 145.6,57.9 156.3,50 167.3,57.9 163.1,45.2 173.8,37.3
		160.6,37.3 	"/>
	<polygon points="212.8,24.7 208.6,37.3 195.3,37.3 206.1,45.2 202.1,57.9 212.8,50 223.6,57.9 219.3,45.2 230.3,37.3
		216.8,37.3 	"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),lG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="10.26 0 342 342">

<rect fill="#FFFFFF" width="513" height="342"/>
<g fill="#0038a8">
	<rect y="38" width="513" height="38"/>
	<rect y="114" width="513" height="38"/>
	<rect y="190" width="513" height="38"/>
	<rect y="266" width="513" height="38"/>
</g>
<rect fill="#FFFFFF" width="256.5" height="190"/>
<path fill="#FED443" d="M128.3,138.7l-15.1,22.6l-3.8-26.9l-23.4,13.8l8.2-25.9L67,124.5l18.6-19.8L60.3,95l25.4-9.7L67,65.5l27.1,2.3
	l-8.2-25.9l23.4,13.8l3.9-26.9l15.1,22.6l15.1-22.6l3.8,26.9l23.4-13.8l-8.2,25.9l27.1-2.2l-18.6,19.8l25.4,9.7l-25.4,9.7l18.6,19.8
	l-27.1-2.2l8.2,25.9l-23.4-13.8l-3.9,26.9L128.3,138.7z M128.3,138.2c23.9,0.9,44-17.6,44.9-41.5c0.9-23.9-17.6-44-41.5-44.9
	c-1.1,0-2.3,0-3.4,0c-23.9,0.8-42.6,20.8-41.8,44.6C87.1,119.2,105.5,137.5,128.3,138.2L128.3,138.2z M128.3,127.6
	c-18.8,0-34-15.2-34-34s15.2-34,34-34s34,15.2,34,34S147,127.6,128.3,127.6z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),aG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#D80027" width="512" height="341.326"/>
<rect y="322.783" fill="#6DA544" width="512" height="103.88"/>
<rect id="SVGCleanerId_0" y="85.337" fill="#338AF3" width="512" height="104.515"/>
<rect y="210.877" fill="#FFFFFF" width="512" height="89.656"/>
<g>
	<rect id="SVGCleanerId_0_1_" y="85.337" fill="#338AF3" width="512" height="104.515"/>
</g>
<g>
	<path fill="#FFFFFF" d="M188.688,137.589c0-15.984,11.234-29.339,26.236-32.614c-2.306-0.503-4.698-0.777-7.155-0.777   c-18.442,0-33.391,14.949-33.391,33.391s14.949,33.391,33.391,33.391c2.458,0,4.85-0.273,7.155-0.777   C199.922,166.928,188.688,153.573,188.688,137.589z"/>
	<polygon fill="#FFFFFF" points="234.658,152.766 236.919,159.723 244.234,159.723 238.316,164.024 240.577,170.98    234.658,166.68 228.74,170.98 231.001,164.024 225.083,159.723 232.398,159.723  "/>
	<polygon fill="#FFFFFF" points="258.006,152.766 260.266,159.723 267.581,159.723 261.663,164.024 263.924,170.98    258.006,166.68 252.088,170.98 254.348,164.024 248.431,159.723 255.745,159.723  "/>
	<polygon fill="#FFFFFF" points="281.353,152.766 283.613,159.723 290.928,159.723 285.011,164.024 287.271,170.98    281.353,166.68 275.435,170.98 277.695,164.024 271.777,159.723 279.092,159.723  "/>
	<polygon fill="#FFFFFF" points="304.7,152.766 306.962,159.723 314.277,159.723 308.358,164.024 310.619,170.98    304.7,166.68 298.782,170.98 301.044,164.024 295.125,159.723 302.439,159.723  "/>
	<polygon fill="#FFFFFF" points="328.048,152.766 330.308,159.723 337.623,159.723 331.705,164.024 333.966,170.98    328.048,166.68 322.13,170.98 324.39,164.024 318.473,159.723 325.787,159.723  "/>
	<polygon fill="#FFFFFF" points="258.006,128.482 260.266,135.438 267.581,135.438 261.663,139.738 263.924,146.695    258.006,142.396 252.088,146.695 254.348,139.738 248.431,135.438 255.745,135.438  "/>
	<polygon fill="#FFFFFF" points="281.353,128.482 283.613,135.438 290.928,135.438 285.011,139.738 287.271,146.695    281.353,142.396 275.435,146.695 277.695,139.738 271.777,135.438 279.092,135.438  "/>
	<polygon fill="#FFFFFF" points="304.7,128.482 306.962,135.438 314.277,135.438 308.358,139.738 310.619,146.695    304.7,142.396 298.782,146.695 301.044,139.738 295.125,135.438 302.439,135.438  "/>
	<polygon fill="#FFFFFF" points="328.048,128.482 330.308,135.438 337.623,135.438 331.705,139.738 333.966,146.695    328.048,142.396 322.13,146.695 324.39,139.738 318.473,135.438 325.787,135.438  "/>
	<polygon fill="#FFFFFF" points="281.353,104.198 283.613,111.154 290.928,111.154 285.011,115.454 287.271,122.411    281.353,118.111 275.435,122.411 277.695,115.454 271.777,111.154 279.092,111.154  "/>
	<polygon fill="#FFFFFF" points="304.7,104.198 306.962,111.154 314.277,111.154 308.358,115.454 310.619,122.411    304.7,118.111 298.782,122.411 301.044,115.454 295.125,111.154 302.439,111.154  "/>
	<polygon fill="#FFFFFF" points="328.048,104.198 330.308,111.154 337.623,111.154 331.705,115.454 333.966,122.411    328.048,118.111 322.13,122.411 324.39,115.454 318.473,111.154 325.787,111.154  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),cG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#FFDA44" width="512" height="341.326"/>
<rect x="256" y="85.331" fill="#FFFFFF" width="256" height="341.337"/>
<path fill="#ACABB1" d="M321.353,233.837l32.073,42.43c-5.053,7.651-5.026,17.961,0.817,25.692  c7.414,9.807,21.374,11.748,31.182,4.335c9.807-7.414,11.748-21.374,4.334-31.182c-5.843-7.731-15.756-10.568-24.495-7.795  l-49.988-66.129l-11.838,8.949l-17.759,13.424l17.899,23.677L321.353,233.837z M367.528,282.617  c3.27-2.472,7.923-1.824,10.395,1.445c2.471,3.269,1.824,7.923-1.445,10.395c-3.269,2.47-7.923,1.824-10.394-1.446  C363.613,289.743,364.259,285.088,367.528,282.617z"/>
<path fill="#FFDA44" d="M376.367,247.24l17.899-23.677l-17.759-13.424l-11.838-8.949l-49.988,66.129  c-8.74-2.775-18.651,0.063-24.495,7.795c-7.414,9.808-5.473,23.768,4.334,31.182c9.808,7.414,23.768,5.473,31.182-4.335  c5.845-7.731,5.871-18.041,0.817-25.692l32.073-42.43L376.367,247.24z M313.863,293.011c-2.471,3.27-7.125,3.916-10.394,1.446  c-3.27-2.472-3.916-7.126-1.445-10.395c2.471-3.268,7.125-3.916,10.395-1.445C315.687,285.088,316.334,289.743,313.863,293.011z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),fG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.331" fill="#FFDA44" width="512" height="341.337"/>
<rect y="85.331" fill="#338AF3" width="170.663" height="341.337"/>
<g>
	<rect x="341.337" y="85.331" fill="#6DA544" width="170.663" height="341.337"/>
	<polygon fill="#6DA544" points="214.261,283.82 180.868,233.734 214.26,183.647 247.652,233.734  "/>
	<polygon fill="#6DA544" points="297.739,283.82 264.348,233.734 297.739,183.647 331.132,233.734  "/>
	<polygon fill="#6DA544" points="256,350.603 222.609,300.516 256,250.429 289.391,300.516  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),uG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="3.75 0 15 15">
<rect fill="#FFCE00" width="22.5" height="5"/>
<rect y="5" fill="#203899" width="22.5" height="5"/>
<rect y="10" fill="#D82B2B" width="22.5" height="5"/>
<polygon fill="#FFFFFF" points="12.13,5.38 12.27,5.84 12.72,5.98 12.33,6.25 12.34,6.73 11.96,6.44 11.51,6.59 11.66,6.15 11.38,5.77
	11.85,5.77 "/>
<polygon fill="#FFFFFF" points="10.36,5.38 10.63,5.77 11.1,5.77 10.82,6.15 10.97,6.6 10.52,6.44 10.14,6.72 10.15,6.25 9.76,5.97
	10.21,5.84 "/>
<polygon fill="#FFFFFF" points="13.8,5.94 13.79,6.42 14.18,6.69 13.72,6.83 13.58,7.28 13.31,6.9 12.83,6.9 13.12,6.52 12.97,6.07
	13.42,6.23 "/>
<polygon fill="#FFFFFF" points="8.69,5.96 9.09,6.23 9.53,6.05 9.4,6.51 9.7,6.87 9.23,6.89 8.97,7.29 8.81,6.85 8.35,6.73 8.72,6.43
	"/>
<polygon fill="#FFFFFF" points="15.24,7.13 15.04,7.57 15.29,7.97 14.82,7.92 14.51,8.28 14.41,7.82 13.98,7.64 14.39,7.4 14.42,6.93
	14.77,7.24 "/>
<polygon fill="#FFFFFF" points="15.43,8.25 15.64,8.68 16.11,8.75 15.77,9.08 15.85,9.54 15.43,9.32 15.01,9.54 15.09,9.08 14.75,8.75
	15.22,8.68 "/>
<polygon fill="#FFFFFF" points="7,8.2 7.21,8.63 7.68,8.69 7.34,9.02 7.42,9.49 7,9.27 6.58,9.49 6.66,9.02 6.32,8.69 6.79,8.63 "/>
<polygon fill="#FFFFFF" points="7.31,7.05 7.76,7.19 8.14,6.9 8.14,7.38 8.53,7.64 8.08,7.79 7.95,8.25 7.67,7.87 7.2,7.88 7.47,7.5
	"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),dG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="112.64 85.333 341.333 341.333">
<rect y="85.334" fill="#0052B4" width="512" height="341.337"/>
<polygon fill="#FFFFFF" points="256,85.334 256,202.66 209.931,202.66 256,233.38 256,255.997 233.372,255.997 160,207.078   160,255.997 96,255.997 96,207.078 22.628,255.997 0,255.997 0,233.38 46.069,202.66 0,202.66 0,138.66 46.069,138.66 0,107.951   0,85.334 22.628,85.334 96,134.241 96,85.334 160,85.334 160,134.241 233.372,85.334 "/>
<g>
	<polygon fill="#D80027" points="144,85.33 112,85.33 112,154.663 0,154.663 0,186.663 112,186.663 112,255.997 144,255.997    144,186.663 256,186.663 256,154.663 144,154.663  "/>
	<polygon fill="#D80027" points="0,85.329 0,100.412 57.377,138.663 80,138.663  "/>
	<polygon fill="#D80027" points="256,85.329 256,100.412 198.623,138.663 176,138.663  "/>
</g>
<polygon fill="#2E52B2" points="256,107.951 256,138.663 209.931,138.663 "/>
<g>
	<polygon fill="#D80027" points="0,85.329 0,100.412 57.377,138.663 80,138.663  "/>
	<polygon fill="#D80027" points="256,85.329 256,100.412 198.623,138.663 176,138.663  "/>
</g>
<polygon fill="#2E52B2" points="256,107.951 256,138.663 209.931,138.663 "/>
<g>
	<polygon fill="#D80027" points="0,255.997 0,240.915 57.377,202.663 80,202.663  "/>
	<polygon fill="#D80027" points="256,255.997 256,240.915 198.623,202.663 176,202.663  "/>
</g>
<path fill="#FFDA44" d="M384,259.706l-46.129,46.129c8.645,16.675,26.051,28.074,46.129,28.074  c20.078,0,37.484-11.4,46.129-28.074L384,259.706z"/>
<path fill="#6DA544" d="M332.058,178.084v81.623v0.001l0,0C332.059,299.467,384,311.649,384,311.649  s51.941-12.182,51.942-51.942l0,0v-0.001v-81.622H332.058z"/>
<rect x="372.87" y="215.181" fill="#FFFFFF" width="22.261" height="59.359"/>
<circle fill="#A2001D" cx="384" cy="215.181" r="11.13"/>
<g>
	<rect x="346.902" y="192.92" fill="#FFDA44" width="14.84" height="14.84"/>
	<rect x="346.902" y="226.312" fill="#FFDA44" width="14.84" height="14.84"/>
	<rect x="346.902" y="259.703" fill="#FFDA44" width="14.84" height="14.84"/>
	<rect x="406.261" y="192.92" fill="#FFDA44" width="14.84" height="14.84"/>
	<rect x="406.261" y="226.312" fill="#FFDA44" width="14.84" height="14.84"/>
	<rect x="406.261" y="259.703" fill="#FFDA44" width="14.84" height="14.84"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),hG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg"  viewBox="85.35 0 341.3 341.3">
<rect y="0" fill="#FFFFFF" width="512" height="341.3"/>
<path fill="#1583C4" d="M397.7,166.3L346.7,264c-1.1,2-0.3,4.5,1.8,5.6c2,1.1,4.5,0.3,5.6-1.8l51-97.7c1-2.1,0.1-4.6-2-5.5
	C401.1,163.7,398.8,164.4,397.7,166.3L397.7,166.3z"/>
<path fill="#1583C4" d="M404.9,188l-57.8,75.4c-1.3,1.9-0.8,4.5,1.1,5.8c1.7,1.2,4.1,0.9,5.5-0.7l57.8-75.4c1.4-1.8,1.1-4.4-0.8-5.8
	C408.9,185.8,406.3,186.2,404.9,188L404.9,188z"/>
<path fill="#1583C4" d="M379,181.3l-32.5,83.1c-0.8,2.1,0.2,4.6,2.4,5.4c2.1,0.8,4.6-0.2,5.4-2.4l32.5-83.1c0.7-2.2-0.4-4.5-2.6-5.3
	C382.1,178.4,379.9,179.4,379,181.3z"/>
<path fill="#409347" d="M122.1,171.9c0.4,1.7,1.2,4.7,2.2,8.5c1.7,6.4,3.6,12.8,5.6,18.7c2.3,6.9,14.7,31.4,20.2,39.1
	c6.9,9.7,14.1,19.3,21.5,28.6c1.6,1.9,4.5,2.1,6.4,0.5c1.8-1.6,2.1-4.3,0.7-6.2c-7.3-9.2-14.4-18.6-21.2-28.2
	c-4.2-5.8-17.2-31.1-19-36.7c-2.9-8.7-5.4-17.6-7.6-26.5c-0.5-2.4-2.9-4-5.3-3.5c-2.4,0.5-4,2.9-3.5,5.3
	C122,171.7,122.1,171.8,122.1,171.9L122.1,171.9z"/>
<g>
	<path fill="#FFD836" stroke="#231F20" stroke-miterlimit="10" d="M297.1,114.9c0,0-17.6-72.1-36.1-72.1c-6.9,0-11.9-0.6-15.4,6.4c-0.9,1.7-20.7-1.6-19.1,20.8
		c0.5,6.9,1.1-9.8,14.9-3.4c6.3,3-16.4,48.2-16.4,48.2H297.1z"/>
	<path fill="#FFD836" stroke="#231F20" stroke-miterlimit="10" d="M466.1,48.4l-90.9,22c-75.3,18.3-42.1,44.4-42.1,44.4l-72.1,12l-72.1-12c0,0,33.2-26.1-42.1-44.4l-90.9-22
		C43.1,45.3,38.1,51.8,45.3,63c0,0,106.6,104,126.8,112c20.2,8.1,40.8,0,40.8,0s-14.9,8.7-24,24c-9.2,15.3-4.6,34.7-38.9,40.2
		c-5.5,6.6-5,14,2.9,19.9c7.9,5.8,72.1-48.1,72.1-48.1s-24,24.4-24,36.1c0,5.1,44.1,53.8,60.1,53.8s60.1-48.7,60.1-53.8
		c0-11.7-24-36.1-24-36.1s64.2,53.9,72.1,48.1s11.4-19.3,2.8-19.9c-28-1.8-29.7-24.9-38.9-40.2c-9.2-15.3-24-24-24-24
		s20.6,8.1,40.8,0S476.7,63,476.7,63C483.9,51.8,479,45.3,466.1,48.4z"/>
</g>
<path fill="#FFFFFF" stroke="#231F20" stroke-miterlimit="10" d="M201.3,111.8v80.3c0,45.7,59.7,59.7,59.7,59.7s59.7-14,59.7-59.7v-80.3H201.3L201.3,111.8z"/>
<g>
	<path fill="#D80027" d="M225.2,137.7v97.3c8.2,6,17,10.2,23.9,12.9V137.7H225.2L225.2,137.7z"/>
	<path fill="#D80027" d="M296.8,137.7v97.3c-8.2,6-17,10.2-23.9,12.9V137.7H296.8L296.8,137.7z"/>
</g>
<rect x="201.3" y="111.8" fill="#0052B4" width="119.4" height="37.9"/>
<polygon fill="#1583C4" points="60.1,210.5 38.2,152.4 15.7,152.4 47.5,233.2 72.7,233.2 104.2,152.4 81.7,152.4 "/>
<rect x="451.5" y="151.9" fill="#1583C4" width="18.9" height="81.7"/>
</svg>`},Symbol.toStringTag,{value:"Module"})),pG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<polygon fill="#D80027" points="196.641,85.337 0,85.337 0,426.663 196.641,426.663 512,426.663 512,85.337 "/>
<polygon fill="#FFDA44" points="256,157.279 278.663,227.026 352,227.026 292.668,270.132 315.332,339.881 256,296.774   196.668,339.881 219.332,270.132 160,227.026 233.337,227.026 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),gG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 85.333 341.333 341.333">
<rect fill="#000" y="85.337" width="512" height="341.326"/>
<polygon fill="#6DA544" points="512,256 512,426.663 0,426.663 215.185,256 "/>
<polygon fill="#D80027" points="512,85.337 512,256 215.185,256 0,85.337 "/>
<polygon fill="#000" points="221.001,239.304 26.868,85.337 8.956,85.337 217.124,250.435 512,250.435 512,239.304 "/>
<polygon fill="#000" points="8.956,426.663 26.868,426.663 221.001,272.696 512,272.696 512,261.565 217.124,261.565 "/>
<polygon fill="#000" points="0,92.44 0,106.646 188.317,256 0,405.354 0,419.559 206.229,256 "/>
<g>
	<polygon fill="#FFDA44" points="8.956,85.337 0,85.337 0,92.44 206.229,256 0,419.559 0,426.663 8.956,426.663    217.124,261.565 512,261.565 512,250.435 217.124,250.435  "/>
	<path fill="#FFDA44" d="M63.718,292.382v-14.295c14.265,0,25.87-11.606,25.87-25.869c0-10.092-8.211-18.303-18.304-18.303   c-6.875,0-12.469,5.593-12.469,12.469c0,4.397,3.577,7.974,7.974,7.974c2.485,0,4.508-2.023,4.508-4.508h14.295   c0,10.368-8.435,18.804-18.802,18.804c-12.279-0.002-22.269-9.993-22.269-22.271c0-14.758,12.006-26.764,26.764-26.764   c17.975,0,32.599,14.623,32.599,32.599C103.884,274.363,85.866,292.382,63.718,292.382z"/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),vG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="9 0 100 100">
<rect fill="#ED2939" width="150" height="100"/>
<rect fill="#002395" width="20" height="44.33"/>
<rect x="20" fill="#FFFFFF" width="20" height="44.33"/>
<path fill="none" stroke="#FFFFFF" stroke-width="3" d="M0,44.33h62.75V0"/>
<path fill="#FFFFFF" d="M108.08,43.29L87.96,23.17h40.25L108.08,43.29z M101.38,50L81.25,29.88v40.25L101.38,50z M108.08,56.71
	L87.96,76.83h40.25L108.08,56.71z M114.79,50l20.13-20.13v40.25L114.79,50z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),mG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="15.36 85.333 341.333 341.333">
<rect y="85.331" fill="#D80027" width="512" height="341.337"/>
<rect y="85.331" fill="#0052B4" width="256" height="170.663"/>
<g>
	<polygon fill="#FFFFFF" points="165.483,181.79 168.247,190.294 177.186,190.294 169.954,195.548 172.717,204.051    165.483,198.796 158.25,204.051 161.013,195.548 153.78,190.294 162.72,190.294  "/>
	<polygon fill="#FFFFFF" points="120.579,115.007 125.185,129.18 140.085,129.18 128.03,137.937 132.635,152.108    120.579,143.35 108.525,152.108 113.13,137.937 101.074,129.18 115.975,129.18  "/>
	<polygon fill="#FFFFFF" points="165.101,129.848 169.707,144.02 184.607,144.02 172.552,152.777 177.156,166.95    165.101,158.19 153.047,166.95 157.651,152.777 145.596,144.02 160.496,144.02  "/>
	<polygon fill="#FFFFFF" points="129.909,189.211 134.515,203.383 149.415,203.383 137.36,212.141 141.964,226.312    129.909,217.553 117.855,226.312 122.459,212.141 110.404,203.383 125.304,203.383  "/>
	<polygon fill="#FFFFFF" points="90.899,152.108 95.504,166.281 110.404,166.281 98.349,175.038 102.953,189.211    90.899,180.451 78.844,189.211 83.448,175.038 71.393,166.281 86.293,166.281  "/>
</g>
</svg>
`},Symbol.toStringTag,{value:"Module"})),yG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 40 40" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" fill="white"/>
  <circle cx="20" cy="20" r="8" fill="#3481CE"/>
  <path d="M20 12C15.5817 12 12 15.5817 12 20H28C28 15.5817 24.4183 12 20 12Z" fill="#D9B539"/>
  <path d="M12 28C7.58172 28 4 24.4183 4 20C4 15.5817 7.58172 12 12 12" stroke="#4DB252" stroke-width="2"/>
  <path d="M28 28C32.4183 28 36 24.4183 36 20C36 15.5817 32.4183 12 28 12" stroke="#4649B4" stroke-width="2"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),wG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="85.335 0 341.33 341.33">
<rect y="0" fill="#0052B4" width="512" height="341.34"/>
<g>
	<polygon fill="#FFFFFF" points="220.72,42.63 228.67,58.74 246.44,61.32 233.58,73.86 236.62,91.56 220.72,83.2 204.82,91.56
		207.85,73.86 194.99,61.32 212.77,58.74 	"/>
	<polygon fill="#FFFFFF" points="291.28,42.57 299.23,58.67 317.01,61.26 304.15,73.79 307.18,91.5 291.28,83.14 275.38,91.5
		278.42,73.79 265.56,61.26 283.33,58.67 	"/>
	<polygon fill="#FFFFFF" points="353.36,53.93 361.31,70.04 379.08,72.62 366.22,85.16 369.26,102.86 353.36,94.51 337.46,102.86
		340.5,85.16 327.63,72.62 345.41,70.04 	"/>
	<polygon fill="#FFFFFF" points="416.37,72.23 424.32,88.34 442.09,90.93 429.23,103.46 432.27,121.17 416.37,112.81 400.47,121.17
		403.5,103.46 390.64,90.93 408.42,88.34 	"/>
	<polygon fill="#FFFFFF" points="158.64,53.93 166.59,70.04 184.37,72.62 171.5,85.16 174.54,102.86 158.64,94.51 142.74,102.86
		145.78,85.16 132.92,72.62 150.69,70.04 	"/>
	<polygon fill="#FFFFFF" points="95.63,72.23 103.58,88.34 121.36,90.93 108.5,103.46 111.53,121.17 95.63,112.81 79.73,121.17
		82.77,103.46 69.91,90.93 87.68,88.34 	"/>
</g>
<path fill="#FFDA44" d="M217.53,259.33l-27.22-13.61l-27.22-54.43h27.22l27.22-27.22l13.61-27.22l27.22-13.61l13.61,13.61l27.22,13.61
	v13.61l13.61,13.61l40.83,27.22L340,245.73l-40.83,40.83l-13.61-27.22l-40.83,27.22v27.22l-13.61-13.61L217.53,259.33z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),_G=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="85.333 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<rect y="85.337" fill="#D80027" width="512" height="113.775"/>
<rect y="312.888" fill="#000" width="512" height="113.775"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),bG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="15 0 60 60">
<rect fill="#FFFFFF" width="90" height="60"/>
<path stroke="#7f7f7f" stroke-width="0.25" fill="#ABABAB" d="M75.6,39.6c-1.1,0.7,0,1.8-0.6,1.9c-0.6,0.1-1.5-1.4-0.2-2.5c1.6-1.5,5.8,0,5.9,4.3c0,2.2-0.9,6.8-7.2,6.8
	c-7.6,0-11.4-5.7-11.4-11.4c0-4.8,3.7-13.5,6.5-14.6c3.1-1.2,6.7-3.5,6.8-5c0-0.5-1.4-0.1-3.3,0.9c-3.1,1.7-6.6,2.5-6.6,1.4
	s2.9-3.1,4-4.6c1.2-1.6,0.9-5.5,3-5.5c7.6,0,9.9,7.7,7,11.7c-1.9,2.6,4.3,1,4.3,1s0,5.3-3.2,7.3c-3,1.8-4.8,3.9-4.8,3.9
	s0.2-4.6-0.5-3.9c-0.6,0.7-11.1,4.5-10.3,12c0.3,3,4.5,5.4,8.5,5.2s5.7-2.4,5.8-4.9C79.4,39.7,76.3,39.2,75.6,39.6z"/>
<path stroke="#7f7f7f" stroke-width="0.25" fill="#ABABAB" d="M10.7,43.6c0.1,2.5,1.8,4.7,5.8,4.9s8.2-2.2,8.5-5.2c0.8-7.5-9.7-11.3-10.3-12c-0.7-0.7-0.5,3.9-0.5,3.9
	s-1.8-2.1-4.8-3.9c-3.2-2-3.2-7.3-3.2-7.3s6.2,1.6,4.3-1c-2.9-4-0.6-11.7,7-11.7c2.1,0,1.8,3.9,3,5.5c1.1,1.5,4,3.5,4,4.6
	S21,21.7,17.9,20c-1.9-1-3.3-1.4-3.3-0.9c0.1,1.5,3.7,3.8,6.8,5c2.8,1.1,6.5,9.8,6.5,14.6c0,5.7-3.8,11.4-11.4,11.4
	c-6.3,0-7.2-4.6-7.2-6.8c0.1-4.3,4.3-5.8,5.9-4.3c1.2,1.1,0.4,2.7-0.2,2.5c-0.6-0.1,0.6-1.2-0.6-1.9C13.8,39.2,10.7,39.7,10.7,43.6z
	"/>
<g>
	<path fill="#DE393A" d="M31,28.8c0,0,0,12.1,0,14s2.1,1.6,2.1,1.6s8.2,0,9.3,0c1.2,0,2.6,2.3,2.6,2.3s1.4-2.3,2.5-2.3s9.6,0,9.6,0
		s2,0.2,2-1.8s0-13.9,0-13.9H31z"/>
	<rect x="31" y="13.1" fill="#3951A3" width="28" height="15.7"/>
</g>
<path fill="#FFFFFF" d="M50.1,16.5c-0.4,2.4-2.5,4.2-5.1,4.2c-2.5,0-4.6-1.8-5.1-4.2c-0.5,0.9-0.8,1.9-0.8,3c0,3.3,2.6,5.9,5.9,5.9
	c3.3,0,5.9-2.6,5.9-5.9C50.9,18.4,50.6,17.4,50.1,16.5z"/>
<circle fill="#FEE05F" cx="39.1" cy="36.5" r="3"/>
<circle fill="#FEE05F" cx="50.9" cy="36.5" r="3"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),FG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="35.84 85.333 341.333 341.333">
<rect y="85.337" fill="#FFFFFF" width="512" height="341.326"/>
<polygon fill="#000" points="114.024,256.001 0,141.926 0,370.096 "/>
<polygon fill="#ffb915" points="161.192,256 0,94.7 0,141.926 114.024,256.001 0,370.096 0,417.234 "/>
<path fill="#007847" d="M509.833,289.391L509.833,289.391c0.058-0.44,0.804-0.878,2.167-1.318V256v-33.391h-2.167H222.602  L85.33,85.337H0V94.7L161.192,256L0,417.234v9.429h85.33l137.272-137.272H509.833z"/>
<polygon fill="#000c8a" points="503.181,322.783 236.433,322.783 132.552,426.663 512,426.663 512,322.783 "/>
<polygon fill="#e1392d" points="503.181,189.217 512,189.217 512,85.337 132.552,85.337 236.433,189.217 "/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),$G=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="170.667 85.333 341.333 341.333">
<rect y="85.331" fill="#496E2D" width="512" height="341.337"/>
<path fill="#FF9811" d="M490.668,195.476h-48c0-8.836-7.164-16-16-16s-16,7.164-16,16h-48c0,8.836,7.697,16,16.533,16h-0.533  c0,8.836,7.162,16,16,16c0,8.836,7.162,16,16,16h32c8.836,0,16-7.164,16-16c8.836,0,16-7.164,16-16h-0.533  C482.972,211.476,490.668,204.312,490.668,195.476z"/>
<rect x="341.337" y="255.994" fill="#D80027" width="56.888" height="170.663"/>
<rect x="455.112" y="255.994" fill="#FF9811" width="56.888" height="170.663"/>
<rect x="398.225" y="255.994" fill="#000" width="56.888" height="170.663"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),xG=Object.freeze(Object.defineProperty({__proto__:null,default:`<?xml version="1.0" encoding="UTF-8"?>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="13.653 85.333 341.333 341.333">
<rect fill="#000" y="85.333" width="512" height="341.337"/>
<g>
	<rect y="134.196" fill="#FFDA44" width="512" height="48.868"/>
	<rect y="329.668" fill="#FFDA44" width="512" height="48.868"/>
</g>
<rect y="85.333" fill="#057f44" width="512" height="48.868"/>
<g>
	<rect y="183.069" fill="#D80027" width="512" height="48.868"/>
	<rect y="280.806" fill="#D80027" width="512" height="48.868"/>
</g>
<rect y="378.542" fill="#057f44" width="512" height="48.128"/>
<polygon fill="#FFFFFF" points="276.992,255.996 106.329,426.659 0,426.659 0,85.333 106.329,85.333 "/>
<polygon fill="#000" points="256,255.996 85.334,426.662 106.321,426.662 276.988,255.996 106.321,85.33 85.334,85.33 "/>
<polygon fill="#D80027" points="102.465,202.57 115.724,243.382 158.641,243.382 123.923,268.608 137.183,309.422   102.465,284.198 67.745,309.422 81.007,268.608 46.289,243.382 89.204,243.382 "/>
<path fill="#FFDA44" d="M138.94,259.335l-34.559-12.243c0,0-2.553-23.955-2.708-24.766  c-1.173-6.18-6.603-10.851-13.123-10.851c-7.376,0-13.357,5.98-13.357,13.357c0,1.223,0.178,2.402,0.486,3.528l-9.689,9.755  c0,0,11.509,0,17.229,0c0,17.882-13.344,17.882-13.344,35.691l7.402,17.809h44.522l7.422-17.809h-0.004  c0.744-1.709,1.194-3.47,1.381-5.231C136.995,265.986,138.94,259.335,138.94,259.335z"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),OG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M3.51941 8.99869C4.85949 5.22384 8.53406 2.78984 12.5326 3.02842C16.5311 3.267 19.8902 6.12067 20.7719 10.0281C21.6536 13.9355 19.8455 17.9551 16.3369 19.8877C12.8283 21.8203 8.46457 21.2002 5.63329 18.3666" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8.99878 15.0011L12 11.9999V6.9978" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6.99788 8.99874H2.99622V4.99707" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),SG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M4 8.6001V21.0001H20V8.6001" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 10L12 3L22 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15 21V15C15 13.895 14.105 13 13 13H11C9.895 13 9 13.895 9 15V21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),EG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 21V21C7.029 21 3 16.971 3 12V12C3 7.029 7.029 3 12 3V3C16.971 3 21 7.029 21 12V12C21 16.971 16.971 21 12 21Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 12V17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11.999 8C11.861 8 11.749 8.112 11.75 8.25C11.75 8.388 11.862 8.5 12 8.5C12.138 8.5 12.25 8.388 12.25 8.25C12.25 8.112 12.138 8 11.999 8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),PG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M11.999 8C11.861 8 11.749 8.112 11.75 8.25C11.75 8.388 11.862 8.5 12 8.5C12.138 8.5 12.25 8.388 12.25 8.25C12.25 8.112 12.138 8 11.999 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 21V21C7.029 21 3 16.971 3 12V12C3 7.029 7.029 3 12 3V3C16.971 3 21 7.029 21 12V12C21 16.971 16.971 21 12 21Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 12V17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),CG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M17 21H7C5.895 21 5 20.105 5 19V11C5 9.895 5.895 9 7 9H17C18.105 9 19 9.895 19 11V19C19 20.105 18.105 21 17 21Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 17.09V14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.5303 13.2197C12.8232 13.5126 12.8232 13.9874 12.5303 14.2803C12.2374 14.5732 11.7626 14.5732 11.4697 14.2803C11.1768 13.9874 11.1768 13.5126 11.4697 13.2197C11.7626 12.9268 12.2374 12.9268 12.5303 13.2197" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 9V7V7C8 4.791 9.791 3 12 3V3C14.209 3 16 4.791 16 7V7V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),MG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M16 12H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),DG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M18.5027 12C18.5027 12.2762 18.2787 12.5002 18.0025 12.5002C17.7262 12.5002 17.5023 12.2762 17.5023 12C17.5023 11.7237 17.7262 11.4998 18.0025 11.4998C18.2787 11.4998 18.5027 11.7237 18.5027 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.5002 12C12.5002 12.2762 12.2762 12.5002 12 12.5002C11.7237 12.5002 11.4998 12.2762 11.4998 12C11.4998 11.7237 11.7237 11.4998 12 11.4998C12.2762 11.4998 12.5002 11.7237 12.5002 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6.49773 12C6.49773 12.2762 6.27378 12.5002 5.99752 12.5002C5.72127 12.5002 5.49731 12.2762 5.49731 12C5.49731 11.7237 5.72127 11.4998 5.99752 11.4998C6.27378 11.4998 6.49773 11.7237 6.49773 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),AG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M11.997 17.5022C11.7219 17.5022 11.4968 17.7273 11.4998 18.0024C11.4998 18.2775 11.7249 18.5026 12 18.5026C12.2751 18.5026 12.5002 18.2775 12.5002 18.0024C12.5002 17.7273 12.2751 17.5022 11.997 17.5022" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11.997 11.4998C11.7219 11.4998 11.4968 11.7248 11.4998 12C11.4998 12.2751 11.7249 12.5002 12 12.5002C12.2751 12.5002 12.5002 12.2751 12.5002 12C12.5002 11.7248 12.2751 11.4998 11.997 11.4998" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11.997 5.49731C11.7219 5.49731 11.4968 5.72241 11.4998 5.99752C11.4998 6.27264 11.7249 6.49773 12 6.49773C12.2751 6.49773 12.5002 6.27264 12.5002 5.99752C12.5002 5.72241 12.2751 5.49731 11.997 5.49731" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),TG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M2.99622 5.99752H21.0037" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M17.002 12H2.99622" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2.99622 18.0024H13.0004" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),jG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 17 18" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M8.5 5.66667V12.3333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11.8333 9H5.16667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.5 16.5V16.5C4.3575 16.5 1 13.1425 1 9V9C1 4.8575 4.3575 1.5 8.5 1.5V1.5C12.6425 1.5 16 4.8575 16 9V9C16 13.1425 12.6425 16.5 8.5 16.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),zG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M12 8V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 12H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),NG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M6.74745 8.99872C6.74745 8.58451 6.41166 8.24872 5.99745 8.24872C5.58324 8.24872 5.24745 8.58451 5.24745 8.99872H6.74745ZM18.7525 8.99872C18.7525 8.58451 18.4167 8.24872 18.0025 8.24872C17.5882 8.24872 17.2525 8.58451 17.2525 8.99872H18.7525ZM14.7508 9.99914C14.7508 9.58492 14.415 9.24914 14.0008 9.24914C13.5866 9.24914 13.2508 9.58492 13.2508 9.99914H14.7508ZM13.2508 17.0021C13.2508 17.4163 13.5866 17.7521 14.0008 17.7521C14.415 17.7521 14.7508 17.4163 14.7508 17.0021H13.2508ZM10.7491 9.99914C10.7491 9.58492 10.4133 9.24914 9.99912 9.24914C9.5849 9.24914 9.24912 9.58492 9.24912 9.99914H10.7491ZM9.24912 17.0021C9.24912 17.4163 9.5849 17.7521 9.99912 17.7521C10.4133 17.7521 10.7491 17.4163 10.7491 17.0021H9.24912ZM4.49683 5.24747C4.08261 5.24747 3.74683 5.58326 3.74683 5.99747C3.74683 6.41168 4.08261 6.74747 4.49683 6.74747V5.24747ZM19.5031 6.74747C19.9173 6.74747 20.2531 6.41168 20.2531 5.99747C20.2531 5.58326 19.9173 5.24747 19.5031 5.24747V6.74747ZM7.28677 5.7603C7.15579 6.15325 7.36816 6.57799 7.76111 6.70898C8.15407 6.83997 8.57881 6.6276 8.7098 6.23464L7.28677 5.7603ZM8.54251 4.36479L9.25402 4.60196L9.25408 4.60179L8.54251 4.36479ZM10.4413 2.99622L10.4411 3.74622H10.4413V2.99622ZM13.5586 2.99622L13.5586 3.74622L13.5595 3.74622L13.5586 2.99622ZM15.4594 4.36479L16.1712 4.1284L16.171 4.12779L15.4594 4.36479ZM15.2898 6.23385C15.4204 6.62695 15.8449 6.83979 16.238 6.70924C16.6311 6.57869 16.8439 6.15418 16.7134 5.76108L15.2898 6.23385ZM5.24745 8.99872V19.0029H6.74745V8.99872H5.24745ZM5.24745 19.0029C5.24745 20.5221 6.47904 21.7537 7.99828 21.7537V20.2537C7.30747 20.2537 6.74745 19.6937 6.74745 19.0029H5.24745ZM7.99828 21.7537H16.0016V20.2537H7.99828V21.7537ZM16.0016 21.7537C17.5209 21.7537 18.7525 20.5221 18.7525 19.0029H17.2525C17.2525 19.6937 16.6924 20.2537 16.0016 20.2537V21.7537ZM18.7525 19.0029V8.99872H17.2525V19.0029H18.7525ZM13.2508 9.99914V17.0021H14.7508V9.99914H13.2508ZM9.24912 9.99914V17.0021H10.7491V9.99914H9.24912ZM4.49683 6.74747H19.5031V5.24747H4.49683V6.74747ZM8.7098 6.23464L9.25402 4.60196L7.831 4.12762L7.28677 5.7603L8.7098 6.23464ZM9.25408 4.60179C9.42428 4.09077 9.9025 3.74609 10.4411 3.74622L10.4415 2.24622C9.25695 2.24593 8.20525 3.00396 7.83094 4.12779L9.25408 4.60179ZM10.4413 3.74622H13.5586V2.24622H10.4413V3.74622ZM13.5595 3.74622C14.0986 3.74555 14.5775 4.09033 14.7478 4.60179L16.171 4.12779C15.7963 3.00299 14.7432 2.24475 13.5577 2.24622L13.5595 3.74622ZM14.7476 4.60117L15.2898 6.23385L16.7134 5.76108L16.1712 4.1284L14.7476 4.60117Z" fill="currentColor"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),kG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <circle id="Oval" cx="11.0586" cy="11.0588" r="7.06194" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path id="Path" d="M20.0033 20.0034L16.0517 16.0518" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),IG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path d="M10 12L11.5 13.5L14.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 10.767C3.5 15.1925 6.2472 19.1532 10.3923 20.7036L10.4223 20.7148C11.4399 21.0954 12.5607 21.095 13.578 20.7138L13.6024 20.7047C17.7512 19.1499 20.5 15.1842 20.5 10.7536V7.03023C20.5 6.15536 19.9314 5.38202 19.0963 5.12118L12.5963 3.09095C12.208 2.96968 11.792 2.96968 11.4037 3.09095L4.90374 5.12112C4.06864 5.38195 3.5 6.15529 3.5 7.03017V10.767Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"})),BG=Object.freeze(Object.defineProperty({__proto__:null,default:`<svg viewBox="0 0 24 24" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M3.99664 11.1376V6.87287C3.99664 5.99772 4.56537 5.22411 5.40068 4.96308L11.4032 3.08729C11.7918 2.96586 12.2082 2.96586 12.5968 3.08729L18.5993 4.96308C19.4346 5.22411 20.0033 5.99772 20.0033 6.87287V11.1376C20.0033 15.3078 17.4165 19.0406 13.5118 20.5048L12.3512 20.94C12.1248 21.0249 11.8752 21.0249 11.6487 20.94L10.4881 20.5048C6.58345 19.0406 3.99664 15.3078 3.99664 11.1376Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 7.97217V12.0001" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.125 15.1262C12.125 15.1952 12.069 15.2512 12 15.2512C11.9309 15.2512 11.8749 15.1952 11.8749 15.1262C11.8749 15.0571 11.9309 15.0011 12 15.0011" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 15.0012C12.0691 15.0012 12.1251 15.0571 12.1251 15.1262" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`},Symbol.toStringTag,{value:"Module"}))});
