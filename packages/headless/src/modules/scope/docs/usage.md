# Scope Usage & API

Two audiences use this module: **consumers** who call a scoped composable, and
**authors** who build one. Both are covered below, followed by the registry, key, and
DevTools helpers.

## Consuming a scoped composable

Call the composable, name the actor, optionally name a context / brand / fresh, then
read from the returned instance.

```typescript
// Actor only
useAuth().as("self"); // actor resolved from the active session
useAuth().as("guest");
useAuth().as("client");
useAuth().as("staff");

// Actor + context (only when the module's matrix allows it)
useAuth().as("staff").for("client", clientId); // staff acting on a client
useClientEmails().as("staff").for("client", id); // staff's view of a client's emails

// Staff brand filter (staff only; order-independent with .for)
useAuth().as("staff").inBrand(brandId);
useAuth().as("staff").inBrand(brandId).for("client", clientId);
useAuth().as("staff").for("client", clientId).inBrand(brandId); // same instance

// Force a brand-new instance + new session
useClientEmailManager().as("self").fresh();

// Single-record read — mark the ONE record by id, not by a synthesised context.
// Available with no .as() at all; the actor defaults to self.
useClientReceivedEmail().withId(emailId);
useClientReceivedEmail().as("staff").withId(emailId); // an explicit actor still works
```

The chain returns the composable instance. Read its sub-composables as usual:

```typescript
const account = useAccount().as("self");
const { model } = account.useContext();
const { isLoading } = account.useMeta();
const { resolve } = account.useActions();
```

> **Lazy finalisation.** The instance is created on the **first property read**, not when
> you call `.as(...)`. Complete the chain before reading. Re-calling `.as()` / `.for()` /
> `.inBrand()` / `.fresh()` re-opens the config until that first read.

### Which methods are available?

| Actor    |          `.for(type, id)`          | `.inBrand(id)` | `.fresh()` | `.withId(id)` |
| -------- | :--------------------------------: | :------------: | :--------: | :-----------: |
| `self`   |                 —                  |       —        |     ✅     |      ✅       |
| `guest`  | if matrix defines a guest context  |       —        |     ✅     |      ✅       |
| `client` | if matrix defines a client context |       —        |     ✅     |      ✅       |
| `staff`  | if matrix defines a staff context  |  ✅ (always)   |     ✅     |      ✅       |

Availability is enforced at **compile time**. Calling `.for('ticket', id)` when the
matrix does not map that actor to `ticket` is a type error, not a runtime failure.
`.withId(id)` carries no matrix constraint — every actor gets it, and it is offered
before `.as()` too: a caller that never names an actor resolves to `self`.

## Authoring a scoped composable

### 1. Declare the matrix (in `<module>.types.ts`)

The enum and matrix below already exist in [`../../auth/auth.types.ts`](../../auth/auth.types.ts);
they are shown (without their `export` keywords) as the shape to copy:

```typescript
import { ScopeActorTypes } from "../scope/scope.types";

// The context types THIS module understands.
enum AuthContextTypes {
  CLIENT = "client"
}

// actor → the one context type it may name, or `null as never` for none.
const AUTH_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: AuthContextTypes.CLIENT,
  [ScopeActorTypes.CLIENT]: AuthContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const; // `as const` is required — it is the source of the compile-time types

type AuthScopeMatrix = typeof AUTH_SCOPE_MATRIX;
```

### 2. Wrap the factory (in `use<Module>.ts`)

```typescript
// Import createScopedComposable directly (hoisted declaration — safe at module scope).
import { createScopedComposable } from "../scope/scope.builder";
import { AUTH_SCOPE_MATRIX } from "./auth.types";

// The factory receives an ALREADY-RESOLVED, concrete actor and the scope key.
function createAuthForScope(config: ScopeConfig, scopeKey: ScopeKey): UseAuth {
  const actor = config.actor; // never "self" here — resolution already happened
  // ...build the four sub-composables (useMeta/useContext/useActions/useInternals)...
  return authInstance;
}

const useAuth = createScopedComposable<UseAuth, AuthScopeMatrix>(
  "auth", // module name — the first key segment
  createAuthForScope, // (config, key) => instance
  AUTH_SCOPE_MATRIX // matrix value, carried onto useAuth.scopeMatrix
);
```

**Rules for the factory** (see [Gotchas](./gotchas.md) and ADR-001):

- Never branch on `ScopeActorTypes.SELF` — you receive a concrete actor.
- The **actor** is resolved for you; you own resolving the request **target id**
  (scope-context id when a `.for()` context is present, else the session's active id) —
  see `code-composables.companion.md` (the FE-2824 receipt).
- Watchers you create run in a detached scope; expose a `destroy()` that calls
  `remove(scopeKey)` for non-singleton instances.
- For a single-record read, the record id arrives as `config.id` (set via the
  caller's `.withId(id)`) — read it directly. Do not mint a context type to carry a
  leaf record; a context names an entity the actor acts upon, not the record itself.

### Reading which actors a module serves

```typescript
useAuth.scopeMatrix; // the AUTH_SCOPE_MATRIX value, for runtime introspection
```

## Registry API

Low-level singleton map. Most code never touches this directly — the builder calls
`ensure` for you — but managers that derive nested instances do.

```typescript
import {
  ensure,
  remove,
  clearAll,
  size,
  getRegistry
} from "../scope/scope.registry";

// Get-or-create the singleton for a key. Runs `factory` in a detached effect scope.
const instance = ensure(key, () => buildThing());

// Evict one instance and stop its effect scope.
remove(key);

// Evict everything and stop all scopes (test teardown).
clearAll();

// Current entry count (tests / debugging).
size();

// The raw Map — for DevTools wiring only.
getRegistry();
```

| Function      | Signature                            | Notes                                                   |
| ------------- | ------------------------------------ | ------------------------------------------------------- |
| `ensure`      | `<T>(key, factory) => T`             | Singleton per key; builds in `effectScope(true)`.       |
| `remove`      | `(key) => void`                      | Stops the scope, deletes the entry, refreshes DevTools. |
| `clearAll`    | `() => void`                         | Stops every scope; primarily for tests.                 |
| `size`        | `() => number`                       | Registry entry count.                                   |
| `getRegistry` | `() => Map<ScopeKey, RegistryEntry>` | For the DevTools plugin.                                |

## Key generation

```typescript
import { generateScopeKey, resolveSelfActor } from "../scope/scope.utils";

generateScopeKey("basket", {
  actor: "staff",
  context: { type: "client", id: "123" }
});
// → "basket:staff:client:123"

generateScopeKey("client-email", { actor: "client", newSession: true });
// → "client-email:client:fresh:1"  (counter increments each call)

generateScopeKey("client-email-history", { actor: "self", id: "42" });
// → "client-email-history:self:id:42"  (set via the builder's .withId('42'))

resolveSelfActor("self"); // → the active session actor, or "guest"
resolveSelfActor("client"); // → "client" (pass-through)
```

## DevTools setup

Call once at app bootstrap to register the "Scope Registry" inspector in Vue DevTools.

```typescript
import { setupScopeDevtools, getRegistry } from "@upmind-automation/headless";

// e.g. in a Nuxt client plugin
setupScopeDevtools(nuxtApp.vueApp, getRegistry());
```

`refreshDevtools()` is called internally by `ensure` / `remove` / `clearAll`; you do not
call it yourself.

## Public surface (barrel)

`index.ts` re-exports everything from the five files:

- **builder** — `createScopedComposable`; the `Scope*` builder/result types, `ScopedFactory`, `ScopedComposable`.
- **types** — `ScopeActorTypes`, `ConcreteActorTypes`, `ScopeActor`, `ScopeContext`, `ScopeConfig`, `ScopeKey`, `ActorContextMatrix`, `ContextsForActor`, `AllContextsFromMatrix`, `HasContexts`, `MatrixHasAnyContexts`.
- **registry** — `ensure`, `remove`, `clearAll`, `size`, `getRegistry`, `RegistryEntry`.
- **utils** — `generateScopeKey`, `resolveSelfActor`.
- **devtools** — `setupScopeDevtools`, `refreshDevtools`.
