# Module: scope

> Portable, rebuild-grade specification of the scoped-composable **pattern**. Where a
> domain module's foundation doc describes a data contract behind HTTP endpoints, this
> module has none — it is pure client-side infrastructure. This doc specifies the
> mechanism precisely enough to re-implement in another reactive framework.

## What it is

Scope is the mechanism that lets one running page hold many independent instances of
the same composable — many baskets, many clients, many editable records — while still
guaranteeing that two requests for _the same_ thing share _one_ instance. It does this
with a **keyed singleton registry**: every call is reduced to a deterministic **scope
key**, and the key indexes a global map of live instances. A first call for a key
builds the instance; every later call for that key returns the cached one.

Layered on top of the registry is a **fluent builder** that expresses two orthogonal
facts about a call — _who_ is acting (the **actor**) and _what_ they act upon (the
**context**) — and folds them, plus an optional brand filter and an optional
"force-new" flag, into the scope key. The builder also resolves the placeholder actor
`self` to a concrete actor before the key is built, so a module instance is only ever
keyed and constructed against a real actor.

Instances are built inside a **detached reactive-effect scope**, so any observers or
derived values the instance sets up survive the lifecycle of whatever component
triggered the first call. Tearing an instance down is therefore an explicit act, not a
side effect of unmounting.

## Core concepts

- **Actor** — who performs the action: `guest`, `client`, `staff`, or the placeholder
  `self`. `self` is resolved at call time to the current session's actor (falling back
  to `guest` when there is no session). Concrete actors are the only ones that reach the
  registry.
- **Context** — what an actor is scoped to: a `{ type }` pair, with an id present only
  when that type's declared pattern calls for one. A context is optional and is only
  meaningful for an actor the module's matrix permits.
- **Context pattern** — each context type a matrix declares is one of two mutually
  exclusive shapes: a **retarget** pattern, where the type names an entity and an id
  identifying that specific entity is required (e.g. `{ type: "client", id: "123" }`);
  or a **selector** pattern, where the type itself is the complete answer and an id
  would be meaningless (e.g. "which catalogue" — there is no further entity to name). A
  given type is always declared as one pattern or the other, never both, and the two
  shapes are mutually exclusive at compile time: supplying an id for a selector, or
  omitting one for a retarget, is rejected before the call ever runs.
- **Record id** — the identifier of the ONE record a single-record read opens. It is
  distinct from a context: a context names an entity the actor acts _upon_, while a
  record id names the record being read _itself_, and carries no matrix constraint —
  every actor may set it, including the placeholder `self`. Setting it before naming
  any actor is valid; the actor then resolves to `self` rather than requiring one.
- **Matrix** — a per-module, compile-time map from each actor to the context type(s)
  that actor may name (or "none"): zero, one, or several declarations, each carrying its
  own retarget-or-selector pattern. The matrix is the contract that decides which
  builder methods each actor is offered — including which of the two context call
  shapes is legal for each declared type — and is carried on the composable as a value
  so a consumer can read which actors a module serves.
- **Scope key** — the deterministic string fingerprint of a call
  (`name:actor[:contextType:contextId][:brand:brandId][:fresh:N]`). Equal fingerprints
  address the same instance.
- **Registry** — the global map from scope key to a live instance plus its detached
  effect scope. Get-or-create is atomic per key.
- **Fresh instance** — an opt-in, deliberately non-cacheable instance that starts a new
  session. It is keyed with a unique per-call suffix so it can never be served from the
  cache.

## Operations

The module exposes a small, function-shaped surface. There is no request/response
lifecycle — every operation is synchronous and in-process.

| #   | Capability                                | Inputs                                                                                                      | Outputs                                                                                  |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1   | **Wrap a factory as a scoped composable** | a module name, a factory `(config, key) → instance`, the actor→context matrix                                | a callable that returns a fluent builder                                                  |
| 2   | **Name the acting actor**                 | an actor (`self` / `guest` / `client` / `staff`)                                                              | a builder narrowed to that actor's permitted next steps                                   |
| 3   | **Name the acted-upon context**           | a context type (matrix-constrained); an id where the type's declared pattern requires one, refused where it does not | the finalised instance (or a builder still open to a brand filter)                |
| 4   | **Name the single record being read**     | a record id                                                                                                    | a builder keyed to that record, still open to naming an actor, a brand filter, or fresh |
| 5   | **Filter to a brand (staff)**             | a brand id                                                                                                     | the finalised instance (or a builder still open to a context)                           |
| 6   | **Force a fresh instance / new session**  | —                                                                                                               | a finalised instance under a unique, uncacheable key                                    |
| 7   | **Resolve `self` to a concrete actor**    | an actor that may be `self`                                                                                    | the current session's actor, or `guest` when none                                       |
| 8   | **Compute a scope key**                   | a module name and a resolved config                                                                            | the deterministic key string                                                            |
| 9   | **Get-or-create an instance for a key**   | a key and a factory                                                           | the cached-or-new instance, built in a detached scope                                   |
| 10  | **Evict an instance**                     | a key                                                                         | the entry removed and its effect scope stopped                                          |
| 11  | **Clear the whole registry**              | —                                                                             | every entry removed and every scope stopped (test/debug)                                |
| 12  | **Expose the registry to DevTools**       | the app handle and the registry                                               | a "Scope Registry" inspector registered                                                 |

## Data shape

The mechanism is defined by a handful of value shapes, not by any wire payload.

```ts
// The host framework's disposable reactive-effect scope — any framework with
// the same stop-once contract can stand in.
type DisposableEffectScope = { stop: () => void };

// Who acts, and (optionally) on what.
type ScopeConfig = {
  actor: "self" | "guest" | "client" | "staff"; // resolved to a concrete actor pre-key
  context?: { type: string; id?: string }; // matrix-constrained; `id` only on a RETARGET member
  id?: string; // the ONE record being read; no matrix constraint, any actor may set it
  brandId?: string; // a filter, not a context
  newSession?: boolean; // set by "force fresh"; spawns a new instance
};

// One context declaration a matrix member may carry: a bare type string is a
// RETARGET member (id required at call time); the marker form is a SELECTOR
// member (id forbidden at call time).
type ContextDeclaration = string | { pattern: "selector"; type: string };

// The compile-time contract: each actor → zero, one, or several context
// declarations it may name. A cell holding several means that actor has
// several independent context members — e.g. one entity-scoped and one
// catalogue-scoped — each admitting its own declared call shape.
type ActorContextMatrix = Partial<
  Record<
    "self" | "guest" | "client" | "staff",
    ContextDeclaration | readonly ContextDeclaration[]
  >
>;

// The deterministic fingerprint. Examples:
//   "auth:client"
//   "auth:staff:client:123"
//   "auth:staff:client:123:brand:abc"
//   "client-email-history:self:id:42"   ← set via "name the single record" (id: '42')
//   "client-email:self:email:42:fresh:7"
//   "custom-fields:client:invoice"      ← a SELECTOR context: one unprefixed
//                                          segment, and never an id
type ScopeKey = string;

// One live entry in the registry.
type RegistryEntry<T = unknown> = {
  instance: T;
  scope: DisposableEffectScope; // stopping it tears down all reactive effects the instance created
};
```

The builder's return **type** narrows by actor and matrix, which is the pattern's
compile-time safety net: `staff` is always offered a brand filter, and is offered a
context only when the matrix defines one for staff; any other actor is offered a context
only when the matrix defines one for it; `self` is offered neither (it resolves at
runtime, so no compile-time context is knowable). Where a context is offered, the
matrix's declared pattern narrows further: an id is required for a retarget declaration
and refused for a selector declaration, and supplying the wrong shape is a compile-time
error, not a runtime one.

## Dependants

Every actor-aware composable in the headless package is built with this module. The
fan-in is broad and grows with each new scoped module.

| Dependant | Weight | How it uses scope |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `client-notifications` | 13 | Actor-only notification-preference reads and edits; its matrix declares no context member for any actor (every request is session-implicit). |
| `client-email` | 11 | Staff-acting-for-client email collections and drafts; a heavy user of both a retarget context and force-fresh instances. |
| `auth` | 10 | Actor-aware login/registration; the canonical worked example. |
| `account` | 6 | Actor-aware account standing. |
| `client-billing-settings` | 6 | Per-client billing-settings read/edit, retargeted by a client context; also calls the key generator directly for a derived instance. |
| `client-custom-fields` | 6 | Per-record custom-field collections; calls the key generator directly to derive nested instance keys. |
| `client-personal-details` | 6 | Per-client personal-details read/edit, retargeted by a client context; also calls the key generator directly for a derived instance. |
| `client-email-history` | 5 | Staff-acting-for-client received-email history; single-record reads keyed by the record id. |
| `client-company` | 4 | Per-client company-record collections, retargeted by a client context. |
| `client-address` | 3 | Per-client address collections, retargeted by a client context. |
| `client-notes` | 3 | Two independently-scoped composables — a client's note collection retargeted by a client context, and a per-note manager that calls the key generator directly for its own instance key. |
| `client-phone` | 3 | Per-client phone-number collections, retargeted by a client context. |
| `basket-billing` | 1 | Reads only the actor enum, to call the acting-actor step on the other scoped composables it composes — no matrix of its own. |
| App bootstrap (playground/host) | — | Registers the DevTools inspector once at startup. |

Weight counts the module's own (non-test) source files that import from this one; it is
not a measure of correctness, only of fan-in breadth.

Scope depends, in turn, only on the platform's reactive-effect primitive, its DevTools
API, a collection-utility library, the shared actor enum, and the session module (to
resolve `self`). It owns no domain data and calls no backend.

## Lessons

- **Actor resolution belongs to the builder, never to a module.** A module factory is
  handed an already-resolved concrete actor. The moment a module branches on `self`
  itself, two code paths can disagree about who the active actor is. Keeping resolution
  in one place is why the pattern can promise a module only ever sees a real actor.
- **A cached singleton and a detached effect scope are two halves of one decision.** If
  instances are cached and reused, their reactive effects cannot be tied to a component
  that unmounts — so effects are detached, and teardown must be explicit. Caching without
  detachment leaks stale effects; detachment without explicit teardown leaks memory.
- **"Force a fresh instance" is a correctness feature, not a convenience.** A remounting
  consumer that reused a cached instance could adopt one that a previous mount had already
  advanced (already authenticated, already mid-edit) and is about to destroy. Fresh keys
  are made unique per call precisely so that can never happen.
- **The contract must be a value, not only a type.** Encoding which actors a module
  serves purely in the type system means nothing holding the composable at runtime can
  read it. Carrying the matrix as a value alongside the type keeps the declared shape and
  the runtime shape from drifting apart.
- **A per-actor context mapping outgrows a single declaration once an actor is scoped
  more than one way.** A flat "actor → one type" contract holds only while every actor
  has at most one thing to be scoped to. The moment an actor legitimately offers two
  independent context members — say, one naming an entity and one naming a category with
  no entity at all — the mapping needs to carry a list of declarations, and each
  declaration needs to say which of the two call shapes it is, not just what its type is.
- **A key reader that infers meaning from fixed position breaks the day a segment stops
  always being present.** Once one context shape stopped always contributing an id, any
  code that read the fingerprint by counting positions from the left silently
  mis-attributed a later, unrelated segment — a brand filter, a record id — as the
  missing one, with nothing to surface the mistake. Positional reading and an optional
  segment are incompatible; only a reader keyed on each reserved segment's own marker
  survives a shape it does not always contribute.
