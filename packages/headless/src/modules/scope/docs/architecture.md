# Scope Architecture

## Overview

The scope module has four cooperating parts and no state machine. A **builder**
([scope.builder.ts](../scope.builder.ts)) collects a call's actor/context/brand/fresh
facts through a fluent chain and, on first real property access, resolves the actor and
finalises an instance. A **utils** layer ([scope.utils.ts](../scope.utils.ts)) turns the
finalised config into a deterministic **scope key** and resolves the `self` placeholder
to a concrete actor. A **registry** ([scope.registry.ts](../scope.registry.ts)) maps
each key to a live instance held inside a detached Vue effect scope. A **devtools** layer
([scope.devtools.ts](../scope.devtools.ts)) surfaces the registry in Vue DevTools. Types
([scope.types.ts](../scope.types.ts)) carry the actor enum and the matrix machinery that
makes the builder type-safe.

This is the concrete implementation of [ADR-001: Scope-Based Composable
Architecture](../../../../../../docs/adr/001-scope-based-composables.md).

## The pieces

| File | Role |
| --- | --- |
| [scope.builder.ts](../scope.builder.ts) | `createScopedComposable` — the fluent builder factory and all builder result types. |
| [scope.utils.ts](../scope.utils.ts) | `generateScopeKey`, `resolveSelfActor`. |
| [scope.registry.ts](../scope.registry.ts) | `ensure`, `remove`, `clearAll`, `size`, `getRegistry` — the singleton map + effect-scope lifecycle. |
| [scope.devtools.ts](../scope.devtools.ts) | `setupScopeDevtools`, `refreshDevtools` — Vue DevTools inspector. |
| [scope.types.ts](../scope.types.ts) | `ScopeActorTypes`, `ScopeConfig`, `ScopeKey`, `ActorContextMatrix`, and the conditional types that gate the builder. |

## Call-to-instance flow

```mermaid
sequenceDiagram
    participant C as Consumer
    participant B as Builder (Proxy)
    participant U as scope.utils
    participant R as scope.registry
    participant F as Module factory

    C->>B: useX()
    B-->>C: builder proxy (config = {})
    C->>B: .as('self')
    Note over B: config.actor = 'self'; instance = null
    C->>B: .for('client', '123')
    Note over B: config.context = { type, id }; instance = null
    C->>B: read any instance property
    B->>B: finalize()
    B->>U: resolveSelfActor('self')
    U-->>B: 'client' (from active session)
    B->>U: generateScopeKey('x', resolvedConfig)
    U-->>B: 'x:client:client:123'
    B->>R: ensure(key, factory)
    alt key already present
        R-->>B: cached instance
    else first call for key
        R->>R: effectScope(true).run(factory)
        R->>R: registry.set(key, { instance, scope })
        R-->>B: new instance
    end
    B-->>C: the requested property off the instance
```

The critical detail: the builder is a **`Proxy`**. Chain methods (`as` / `for` /
`inBrand` / `fresh`) mutate the pending `config` and reset the memoised `instance` to
`null`. *Any other* property access falls through to `finalize()`, which resolves the
actor, computes the key, and calls `ensure`. So the instance is created **lazily, on
first read**, not when you call `.as(...)`. See
[scope.builder.ts](../scope.builder.ts) — `finalize` and the `Proxy` `get`/`has` traps.

## Actor resolution (`self` → concrete)

```text
.as('self')  ──finalize()──▶ resolveSelfActor('self')
                                   │
                                   ├─ actor !== 'self' ? return actor
                                   └─ else read useSessionStore().useContext().activeActor
                                          └─ activeActor ?? GUEST
```

Resolution lives entirely in the builder ([scope.builder.ts](../scope.builder.ts),
`finalize`) calling [scope.utils.ts](../scope.utils.ts) `resolveSelfActor`. **A module
factory receives an already-resolved, concrete actor and must never branch on `self`.**
That is ADR-001 clause 4 and the variance law in
`.claude/rules/code-composables.companion.md`; the `scope-based/no-self-branch` ESLint
rule enforces it.

## Scope-key composition

`generateScopeKey(name, config)` joins parts with `:`:

```text
name                                    → "auth"
+ actor                                 → "auth:client"
+ context.type ":" context.id (if any)  → "auth:staff:client:123"
+ "brand:" brandId (if any)             → "auth:staff:client:123:brand:abc"
+ "fresh:" <monotonic counter> (if set) → "client-email:self:email:42:fresh:7"
```

The fresh counter is a module-level `let` that increments on every fresh call, so a
`.fresh()` key is unique per invocation and can never be served from cache. See
[scope.utils.ts](../scope.utils.ts).

## Registry lifecycle & detached effect scopes

```text
ensure(key, factory)
  ├─ hit  → return registry.get(key).instance
  └─ miss → scope = effectScope(true)          // DETACHED: not tied to any component
            scope.run(() => instance = factory())
            registry.set(key, { instance, scope })
            refreshDevtools()
            return instance

remove(key)  → registry.get(key)?.scope.stop() ; registry.delete(key) ; refreshDevtools()
clearAll()   → every entry.scope.stop() ; registry.clear() ; refreshDevtools()   // tests
```

`effectScope(true)` is **detached** on purpose: watchers and computeds the factory
creates are *not* collected when the component that triggered the first call unmounts.
That is what lets one instance be shared across many components and survive remounts —
and it is why teardown is explicit (`remove` / a module's `destroy()` action). See
[scope.registry.ts](../scope.registry.ts).

## The matrix and compile-time gating

The builder's return **type** — not its runtime code — decides which chain methods an
actor is offered. [scope.types.ts](../scope.types.ts) derives, from the module's
`ActorContextMatrix`:

| Actor | Offered | Condition |
| --- | --- | --- |
| `staff` | `.inBrand()` always; `.for()` too | `.for()` only if matrix maps staff → a context type |
| `client` / `guest` | `.for()` | only if matrix maps that actor → a context type |
| `self` | neither | resolves at runtime; no compile-time context is knowable |

The matrix is passed to `createScopedComposable` **twice**: as the type parameter
`TMatrix` (which drives the table above) and as an `as const` value, which is stored on
`composable.scopeMatrix` so runtime consumers can read which actors a module serves. Type
and value cannot drift because the value is type-checked against `TMatrix`.

## Dependencies

### Scope depends on

| Dependency | Usage |
| --- | --- |
| `vue` | `effectScope` / `EffectScope` — the detached reactive scope per instance. |
| `@vue/devtools-api` | `setupDevToolsPlugin` — the DevTools inspector. |
| `lodash-es` | `map` / `keys` / `isObject` in the DevTools tree/state builders. |
| `@upmind-automation/types` | `AccessRoleTypes` — the source of the concrete actor values. |
| `../session-store` | `useSessionStore` — read the active actor to resolve `self`. |

### Modules that depend on scope

Every scoped composable: `auth`, `account`, `client-address`, `client-company`,
`client-custom-fields`, `client-email`, `client-email-history`,
`client-personal-details`, `client-phone`. `auth` is the canonical worked example — read
`../auth/` before writing or reviewing any scoped module. Some managers
(`client-custom-fields`, `client-personal-details`) also call `generateScopeKey`
directly to derive keys for nested instances.

## Integration points

| System | Integration |
| --- | --- |
| **Vue reactivity** | Each instance owns a detached `effectScope`; stopping it disposes the instance's effects. |
| **Vue DevTools** | `setupScopeDevtools(app, getRegistry())` at app bootstrap registers the "Scope Registry" inspector; `refreshDevtools()` fires on every registry mutation. |
| **Session** | `resolveSelfActor` reads `useSessionStore().useContext().activeActor` to turn `self` into a concrete actor. |
