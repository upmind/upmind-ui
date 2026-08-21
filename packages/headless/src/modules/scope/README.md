<!--
@internal
Internal-facing module README. This is the infrastructure module that implements
the Scope-Based Composable Architecture (ADR-001). It is NOT a domain composable
(no useActions/useMeta/useContext, no state machine, no BE endpoints).
-->

# Scope Module

The engine behind every actor-aware composable in `packages/headless`. It turns a
plain factory function into a **scoped composable**: a fluent, actor-aware builder
whose instances are cached as keyed singletons and whose reactive effects live in
detached scopes. This is the mechanism defined by
[ADR-001: Scope-Based Composable Architecture](../../../../../docs/adr/001-scope-based-composables.md).

> This is infrastructure. If you are documenting or building a **domain** module
> (basket, client, invoices…), you _consume_ this module — you do not copy its shape.

## What Is This? (ELI5)

One page can show many baskets, many clients, many phone numbers at once. Each of
those needs its own isolated composable instance, yet the same client opened twice
should reuse one instance, not spawn two. Scope is the keyed registry that decides
"same thing → same instance, different thing → new instance", and it lets a single
call say **who** is acting and **what** they act on.

- **`.as(actor)`** = who is acting — `self`, `guest`, `client`, or `staff`.
- **`.for(type, id)`** = what they act on — e.g. staff acting `for('client', '123')`.
- **`.withId(id)`** = which single record this instance reads — e.g. one email opened
  by id. Not a context: a context names an entity the actor acts upon, `.withId()`
  names the one record itself. Available with no `.as()` at all — the actor defaults
  to `self`.
- **`.inBrand(brandId)`** = staff narrowing to one brand.
- **`.fresh()`** = force a brand-new instance and a new session, never a cached one.
- **the scope key** = the fingerprint (`auth:staff:client:123`) that identifies an instance.

> **🧪 For Testers:** The two behaviours most worth breaking are **singleton reuse**
> (two identical calls must return the same instance) and **`.fresh()` isolation** (a
> fresh call must never adopt a cached instance). See [Gotchas](./docs/gotchas.md).

> **👩‍💻 For Developers:** A module factory receives an **already-resolved, concrete
> actor** and a scope key. It must never branch on `SELF` — resolution is the builder's
> job (ADR-001). Watchers you create in the factory run in a **detached effect scope**,
> so they outlive components and must be torn down with `remove(key)` / `destroy()`.

## Quick Start

Author a scoped composable (the producer side):

```typescript
// scope-key argument is unused here; kept to show the factory signature
import { createScopedComposable } from "../scope/scope.builder";
import { AUTH_SCOPE_MATRIX } from "./auth.types";

export const useAuth = createScopedComposable<UseAuth, AuthScopeMatrix>(
  "auth", // module name — first segment of every scope key
  createAuthForScope, // (config, scopeKey) => the composable instance
  AUTH_SCOPE_MATRIX // the actor→context matrix, carried onto the composable
);
```

Call a scoped composable (the consumer side):

```typescript
useAuth().as("self"); // resolve actor from the session
useAuth().as("client"); // act as the logged-in client
useAuth().as("staff").for("client", clientId); // staff acting on a client
useAuth().as("staff").inBrand(brandId); // staff scoped to one brand
useClientEmailManager().as("self").fresh(); // a brand-new draft instance
useClientReceivedEmail().withId(emailId); // one record by id; actor defaults to self
```

See [Usage & API](./docs/usage.md) for the full builder surface.

## Features

| Feature                                               | Status | Notes                                                                          |
| ----------------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Fluent actor-aware builder (`createScopedComposable`) | ✅     | `.as()` / `.for()` / `.withId()` / `.inBrand()` / `.fresh()`                   |
| Single-record keying (`.withId(id)`)                  | ✅     | keys an instance per record id; self by default, offered at any chain position |
| Compile-time matrix enforcement                       | ✅     | matrix decides which chain methods each actor is offered                       |
| Keyed singleton registry                              | ✅     | one instance per scope key; get-or-create via `ensure`                         |
| Detached effect scopes                                | ✅     | factory watchers persist beyond component lifecycles                           |
| `SELF` → concrete-actor resolution                    | ✅     | reads the active session actor                                                 |
| `.fresh()` new-session isolation                      | ✅     | unique key per call; never served from cache                                   |
| Vue DevTools inspector                                | ✅     | "Scope Registry" panel via `setupScopeDevtools`                                |

## Key Concepts

### Actor and context

An **actor** is who acts: `self`, `guest`, `client`, `staff` (`ScopeActorTypes`).
`self` is a placeholder resolved at call time to the active session actor. A
**context** is the entity an actor acts upon — `{ type, id }`, e.g.
`{ type: "client", id: "123" }`. Not every actor may name a context; the module's
**matrix** decides.

### The matrix

Each module declares an `ActorContextMatrix` — a compile-time map from actor to the
context type it may name (or `never`). It is passed to `createScopedComposable` both
as the type parameter (which gates the builder methods) and as an `as const` value
(carried onto `composable.scopeMatrix` so a consumer can read which actors it serves).

```typescript
export const AUTH_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: AuthContextTypes.CLIENT, // staff may .for('client', id)
  [ScopeActorTypes.CLIENT]: AuthContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never // guest gets no .for()
} as const;
```

### Naming a single record

`.withId(id)` marks the ONE record this instance reads — e.g. one email opened by
id. It is not a context: a context names an entity the actor acts upon and is
constrained by the module's matrix, while `.withId()` names the record itself and
has no matrix constraint. It is offered at every builder position, including with no
`.as()` at all, in which case the actor defaults to `self` rather than requiring one.
Same id → same cached instance; a different id → a new one.

### The scope key

`generateScopeKey(name, config)` fingerprints a call:
`auth:staff:client:123:brand:abc`. A record id folds in as its own segment:
`client-email-history:self:id:42`. Same fingerprint → same cached instance.
`.fresh()` appends a unique counter so a fresh call can never collide with a cached
instance.

### The registry and detached scopes

A global `Map<ScopeKey, { instance, scope }>` holds one entry per key. `ensure`
runs the factory inside `effectScope(true)` — a **detached** reactive scope — so
watchers created there are not torn down when the calling component unmounts.
`remove(key)` stops that scope and evicts the entry.

## Documentation

| Doc                                    | Audience                | Content                                         |
| -------------------------------------- | ----------------------- | ----------------------------------------------- |
| **This README**                        | Everyone                | Overview, concepts, quick start                 |
| [Foundation](./docs/foundation.md)     | Portable / architects   | Framework-neutral spec of the pattern           |
| [Usage](./docs/usage.md)               | All devs                | Builder API, matrix, registry, DevTools         |
| [Architecture](./docs/architecture.md) | Internal / contributors | How builder, registry, keys, resolution fit     |
| [Gotchas](./docs/gotchas.md)           | All                     | Load-order, detached scopes, `.fresh()`, `SELF` |

## Related

- [ADR-001: Scope-Based Composable Architecture](../../../../../docs/adr/001-scope-based-composables.md) — the decision this module implements.
- `.claude/rules/code-composables.companion.md` — the variance law scoped modules are reviewed against. `useAuth` (`../auth/`) is the canonical worked example.
