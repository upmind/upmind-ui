# Scope Usage & API

Two audiences use this module: **consumers** who call a scoped composable, and
**authors** who build one. Both are covered below, followed by the registry, key, and
DevTools helpers.

## Consuming a scoped composable

Call the composable, name the actor, optionally name a context / brand / fresh, then
read from the returned instance.

```ts
import {
  AccountContextTypes,
  AuthContextTypes,
  ScopeActorTypes,
  useAccount,
  useAuth,
  useClientEmailManager,
  useClientReceivedEmail
} from "@upmind-automation/headless";

declare const clientId: string;
declare const brandId: string;
declare const emailId: string;

// Actor only. The actor is the enum member, never a bare string — the matrix
// types are keyed on ScopeActorTypes.
useAuth().as(ScopeActorTypes.SELF); // actor resolved from the active session
useAuth().as(ScopeActorTypes.GUEST);
useAuth().as(ScopeActorTypes.CLIENT);
useAuth().as(ScopeActorTypes.STAFF);

// Actor + context (only when the module's matrix allows it). The context type
// is the module's OWN enum member, so a context it never declared is unspellable.
useAuth().as(ScopeActorTypes.STAFF).for(AuthContextTypes.CLIENT, clientId);
useAccount()
  .as(ScopeActorTypes.STAFF)
  .for(AccountContextTypes.CLIENT, clientId);

// Staff brand filter (staff only; order-independent with .for)
useAuth().as(ScopeActorTypes.STAFF).inBrand(brandId);
useAuth()
  .as(ScopeActorTypes.STAFF)
  .inBrand(brandId)
  .for(AuthContextTypes.CLIENT, clientId);
useAuth()
  .as(ScopeActorTypes.STAFF)
  .for(AuthContextTypes.CLIENT, clientId)
  .inBrand(brandId); // same instance

// Force a brand-new instance + new session. Offered at the root, and on every
// actor regardless of whether the matrix gives that actor a context.
useClientEmailManager().fresh();

// Single-record read — mark the ONE record by id, not by a synthesised context.
// Available with no .as() at all; the actor defaults to self.
useClientReceivedEmail().withId(emailId);
useClientReceivedEmail().as(ScopeActorTypes.STAFF).withId(emailId); // explicit actor
```

The chain returns the composable instance. Read its sub-composables as usual:

```ts
import { ScopeActorTypes, useAccount } from "@upmind-automation/headless";

const account = useAccount().as(ScopeActorTypes.SELF);
const { model } = account.useContext();
const { isProcessing } = account.useMeta();
const { resolve } = account.useActions();
```

> **Lazy finalisation.** The instance is created on the **first property read**, not when
> you call `.as(...)`. Complete the chain before reading. Re-calling `.as()` / `.for()` /
> `.inBrand()` / `.fresh()` re-opens the config until that first read.

### Which methods are available?

| Actor    |            `.for(…)`             | `.inBrand(id)` |  `.fresh()`  | `.withId(id)` |
| -------- | :------------------------------: | :------------: | :----------: | :-----------: |
| `self`   |                —                 |       —        | ✅ (always)  |      ✅       |
| `guest`  | if matrix defines a guest context |       —        | ✅ (always)  |      ✅       |
| `client` | if matrix defines a client context |       —        | ✅ (always)  |      ✅       |
| `staff`  | if matrix defines a staff context |  ✅ (always)   | ✅ (always)  |      ✅       |

### `.for()` has two shapes, and a context member declares which one it is

A context answers *what the actor is scoped to*. Sometimes that answer names an
entity, and sometimes the type IS the whole answer:

| Pattern      | Call shape        | The id means                        | Example                              |
| ------------ | ----------------- | ----------------------------------- | ------------------------------------ |
| **Retarget** | `.for(type, id)`  | the entity the actor acts upon      | `.as(STAFF).for(CLIENT, clientId)`   |
| **Selector** | `.for(type)`      | *nothing — there is no entity*      | `.as(CLIENT).for(CANCEL_REQUEST)`    |

The two are **mutually exclusive per member**, declared in the matrix and enforced
at compile time. Passing an id to a selector is a type error; omitting one on a
retarget is a type error. A bare string cell stays a retarget, so every matrix
written before this existed keeps its meaning unchanged.

The id is never the channel for "which record this instance reads" — that is
`.withId(id)`, and an id has no business riding in `.for()` (ADR-001 amendment,
2026-09-15).

Availability is enforced at **compile time**. Calling `.for()` with a context type
the matrix does not map to that actor is a type error, not a runtime failure — and
because the matrix carries the module's own enum members, a context the module never
declared cannot even be named. `.fresh()` carries no matrix constraint of its own — it
is offered to every actor, with or without a context, and at the root before any
`.as()` too, which is how `useClientEmailManager().fresh()` reads.
`.withId(id)` carries no matrix constraint either — every actor gets it, and it is
offered before `.as()` too: a caller that never names an actor resolves to `self`.

## Authoring a scoped composable

### 1. Declare the matrix (in `<module>.types.ts`)

The enum and matrix below already exist in [`../../auth/auth.types.ts`](../../auth/auth.types.ts);
they are shown (without their `export` keywords) as the shape to copy:

```ts
import { ScopeActorTypes } from "@upmind-automation/headless";

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

```ts
import { computed, type ComputedRef } from "vue";
// Inside the package this is `import { createScopedComposable } from
// "../scope/scope.builder"` — the hoisted declaration, never an aggregator barrel.
import {
  createScopedComposable,
  ScopeActorTypes,
  type ScopeConfig,
  type ScopeKey
} from "@upmind-automation/headless";

enum AuthContextTypes {
  CLIENT = "client"
}

const AUTH_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: AuthContextTypes.CLIENT,
  [ScopeActorTypes.CLIENT]: AuthContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

type AuthScopeMatrix = typeof AUTH_SCOPE_MATRIX;

type UseAuth = {
  useMeta: () => { isLoading: ComputedRef<boolean> };
};

// The factory receives an ALREADY-RESOLVED, concrete actor and the scope key.
function createAuthForScope(config: ScopeConfig, scopeKey: ScopeKey): UseAuth {
  const actor = config.actor; // never "self" here — resolution already happened
  // ...build the four sub-composables (useMeta/useContext/useActions/useInternals)...
  return {
    useMeta: () => ({ isLoading: computed(() => !actor || !scopeKey) })
  };
}

const useAuth = createScopedComposable<UseAuth, AuthScopeMatrix>(
  "auth", // module name — the first key segment
  createAuthForScope, // (config, key) => instance
  AUTH_SCOPE_MATRIX // matrix value, carried onto useAuth.scopeMatrix
);

useAuth().as(ScopeActorTypes.STAFF).for(AuthContextTypes.CLIENT, "client-id");
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

### 3. Declaring a selector context (when the type IS the answer)

Most matrix cells are retarget-only and need no wrapper — a bare string stays a
retarget declaration, unchanged. A cell that needs the *other* pattern — no entity to
name, the type is the whole answer — wraps the type in `selector()`. A cell can also
hold **several** declarations for one actor, as a `readonly` array; each member keeps
its own pattern independently:

```ts
import {
  selector,
  ScopeActorTypes,
  type ScopedComposable
} from "@upmind-automation/headless";

enum CustomFieldsContextTypes {
  VALUES = "values",
  INVOICE = "invoice",
  CANCEL_REQUEST = "cancel_request"
}

// One retarget member (an id is required) and two selector members (an id is
// forbidden) offered to the SAME actor. Illustrative — no shipped module wires
// this matrix today; the mixed-cell shape is exercised by this module's own
// test suite.
const CUSTOM_FIELDS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: [
    CustomFieldsContextTypes.VALUES, // retarget: .for(VALUES, id)
    selector(CustomFieldsContextTypes.INVOICE), // selector: .for(INVOICE)
    selector(CustomFieldsContextTypes.CANCEL_REQUEST) // selector: .for(CANCEL_REQUEST)
  ],
  [ScopeActorTypes.GUEST]: null as never
} as const;

declare const useCustomFields: ScopedComposable<
  { useMeta: () => object },
  typeof CUSTOM_FIELDS_SCOPE_MATRIX
>;

// Two independent selector reads of the SAME module — different keys, different
// instances, neither one taking an id:
useCustomFields().as(ScopeActorTypes.CLIENT).for(CustomFieldsContextTypes.INVOICE);
useCustomFields()
  .as(ScopeActorTypes.CLIENT)
  .for(CustomFieldsContextTypes.CANCEL_REQUEST);
```

`selector()` only marks the declaration in the matrix; nothing about calling, reading,
or authoring a scoped composable otherwise changes. The `.for()` overload the caller
sees is derived from the matrix, per member, exactly as it is for a retarget-only cell.

### Reading which actors a module serves

```ts
import { useAuth } from "@upmind-automation/headless";

useAuth.scopeMatrix; // the AUTH_SCOPE_MATRIX value, for runtime introspection
```

## Registry API

Low-level singleton map. Most code never touches this directly — the builder calls
`ensure` for you — but managers that derive nested instances do.

```ts
import {
  ensure,
  remove,
  clearAll,
  size,
  getRegistry,
  type ScopeKey
} from "@upmind-automation/headless";

declare const key: ScopeKey;
declare function buildThing(): { id: string };

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

```ts
import {
  generateScopeKey,
  resolveSelfActor,
  ScopeActorTypes
} from "@upmind-automation/headless";

// STAFF's wire value is "user" (AccessRoleTypes.STAFF), so it is the enum member
// that belongs in a config — never the word "staff".
generateScopeKey("basket", {
  actor: ScopeActorTypes.STAFF,
  context: { type: "client", id: "123" }
});
// → "basket:user:client:123"

generateScopeKey("client-email", {
  actor: ScopeActorTypes.CLIENT,
  newSession: true
});
// → "client-email:client:fresh:1"  (counter increments each call)

generateScopeKey("client-email-history", {
  actor: ScopeActorTypes.SELF,
  id: "42"
});
// → "client-email-history:self:id:42"  (set via the builder's .withId('42'))

generateScopeKey("custom-fields", {
  actor: ScopeActorTypes.CLIENT,
  context: { type: "invoice" } // no `id` — a SELECTOR context
});
// → "custom-fields:client:invoice"  (one unprefixed segment, never an id)

resolveSelfActor(ScopeActorTypes.SELF); // → the active session actor, or "guest"
resolveSelfActor(ScopeActorTypes.CLIENT); // → "client" (pass-through)
```

## DevTools setup

Call once at app bootstrap to register the "Scope Registry" inspector in Vue DevTools.

```ts
import { setupScopeDevtools, getRegistry } from "@upmind-automation/headless";

// e.g. in a Nuxt client plugin
declare const nuxtApp: { vueApp: Parameters<typeof setupScopeDevtools>[0] };

setupScopeDevtools(nuxtApp.vueApp, getRegistry());
```

`refreshDevtools()` is called internally by `ensure` / `remove` / `clearAll`; you do not
call it yourself.

## Public surface (barrel)

`index.ts` re-exports everything from the five files:

- **builder** — `createScopedComposable`; the `Scope*` builder/result types (including `ScopeForStep`, the overloaded `.for()` step type), `ScopedFactory`, `ScopedComposable`.
- **types** — `ScopeActorTypes`, `ConcreteActorTypes`, `ScopeActor`, `ScopeContext`, `ScopeConfig`, `ScopeKey`, `ActorContextMatrix`, `ScopeContextPatterns`, `SelectorContext`, `ScopeContextDeclaration`, `DeclarationsInCell`, `ContextsForActor`, `IdContextsForActor`, `BareContextsForActor`, `AllContextsFromMatrix`, `HasContexts`, `MatrixHasAnyContexts`.
- **registry** — `ensure`, `remove`, `clearAll`, `size`, `getRegistry`, `RegistryEntry`.
- **utils** — `generateScopeKey`, `selector`, `resolveContextDeclarations`, `resolveContextDeclaration` (pure; safe to call from a matrix at module load).
- **builder** — `createScopedComposable`, `resolveSelfActor` (the one scope function that reads the session store).
- **devtools** — `setupScopeDevtools`, `refreshDevtools`.
