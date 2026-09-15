# Scope Gotchas

Edge cases and traps in the scoped-composable mechanism. Most bite the **authors** of
scoped modules, a few bite consumers.

> **🧪 For Testers:** The 🧪-marked items are the behaviours most worth a dedicated test.

---

## Never branch on `SELF` inside a module 🧪

`self` is a placeholder. The builder resolves it to a concrete actor
(`resolveSelfActor`) **before** it calls your factory, so your factory only ever sees
`guest` / `client` / `staff`. Branching on `SELF` inside a module means the module is
re-deciding who the actor is — the exact thing the architecture centralises.

```ts
import { ScopeActorTypes, type ScopeConfig } from "@upmind-automation/headless";

declare const config: ScopeConfig;

// ❌ Wrong — a SELF branch inside a module factory or services file
if (config.actor === ScopeActorTypes.SELF) {
  /* ... */
}

// ✅ Correct — you already have a concrete actor
const actor = config.actor; // "guest" | "client" | "user" (staff)
```

The `scope-based/no-self-branch` ESLint rule reports SELF branch positions. A consumer's
`.as('self')` call and an `as const` matrix key are the documented API, not a branch — the
rule ignores those.

**Test scenario:** Call the composable `.as('self')` with a logged-in client session;
assert the factory receives `client`. Repeat with no session; assert it receives `guest`.

---

## Factory watchers live in a detached scope — tear them down 🧪

`ensure` runs your factory inside `effectScope(true)` — **detached**. Watchers and
computeds you create there are _not_ disposed when the component that first called the
composable unmounts. That is deliberate (it lets one instance be shared and survive
remounts), but it means teardown is your job.

```ts
import { onUnmounted } from "vue";
import { useClientEmailManager } from "@upmind-automation/headless";

// ❌ Wrong — non-singleton instance, no teardown → orphaned watchers, memory leak
const draft = useClientEmailManager().fresh();
// ...component unmounts, watchers keep running forever...

// ✅ Correct — evict on unmount for non-singletons
onUnmounted(() => draft.useActions().destroy()); // destroy() calls remove(scopeKey)
```

Long-lived singletons (`brand`, `basket`, `session-store`) intentionally live for the
app's lifetime and are **not** destroyed. Flow/wizard composables (`auth`, checkout) and
per-record managers/drafts **must** be destroyed.

**Test scenario:** Create a non-singleton instance, mount and unmount its component, then
assert `size()` drops back and no watcher fires afterward.

---

## `.fresh()` is unique per call — do not expect it to be cacheable 🧪

`.fresh()` sets `newSession`, and `generateScopeKey` appends a monotonically increasing
`fresh:N` suffix, so **every** fresh call produces a different key and a different
instance.

```ts
import { useClientEmailManager } from "@upmind-automation/headless";

// Two fresh calls are TWO instances, never the same one
const a = useClientEmailManager().fresh(); // key ...:fresh:1
const b = useClientEmailManager().fresh(); // key ...:fresh:2  (a !== b)
```

This exists so a **remounting** consumer cannot adopt a previous mount's fresh instance
(which may already be authenticated / mid-edit) immediately before that mount destroys it. If
you need to _reference the same_ fresh instance across reads, capture it once and reuse
the reference — do not call `.fresh()` again.

**Test scenario:** Call `.fresh()` twice; assert the two instances differ and both appear
in the registry under distinct keys.

---

## `.withId(id)` keys the instance per RECORD — it is the opposite of `.fresh()` 🧪

`.withId(id)` marks the ONE record a single-record read opens. `generateScopeKey` folds it
into the key as `id:<value>`, so — unlike `.fresh()` — the SAME id always resolves to the
SAME cached instance.

```ts
import { useClientEmailManager } from "@upmind-automation/headless";

// Same id, same instance — one cached read of record '42'
const a = useClientEmailManager().withId("42");
const b = useClientEmailManager().withId("42");
// a === b

// Different id, different instance
const c = useClientEmailManager().withId("43");
// c !== a

// .fresh() still means "never cacheable" — that guarantee is unrelated to .withId()
const d = useClientEmailManager().fresh();
const e = useClientEmailManager().fresh();
// d !== e, even though neither names an id
```

`.withId()` is offered at every builder position — before `.as()`, or after it — and a
caller that never calls `.as()` resolves to `self`, not to an error. This is a deliberate
deviation from this module's general "always require `.as()`" convention, scoped to the
single-record case; see ADR-001 §8's amendment note and the `@decision` on `finalize` in
`scope.builder.ts`.

**Test scenario:** Call `.withId(id)` twice with the same id; assert one shared instance.
Call it with two different ids; assert two distinct instances, each keyed under its own
`id:<value>` segment.

---

## The instance is created lazily, on first property read 🧪

The builder is a `Proxy`. `.as()` / `.for()` / `.inBrand()` / `.fresh()` / `.withId()` only
mutate a pending config and reset the memoised instance to `null`. **Any other** property
access triggers `finalize()` — which resolves the actor, computes the key, and
builds/looks-up the instance.

```ts
import {
  AuthContextTypes,
  ScopeActorTypes,
  useAuth,
  useClientEmailManager
} from "@upmind-automation/headless";

declare const id: string;
declare const recordId: string;

// ❌ Wrong — reads before the chain is complete; finalises on the partial config
const b = useAuth().as(ScopeActorTypes.STAFF);
b.for(AuthContextTypes.CLIENT, id); // too late: reading b.something above would
// already have finalised

// ✅ Correct — complete the chain in one expression, THEN read
const auth = useAuth()
  .as(ScopeActorTypes.STAFF)
  .for(AuthContextTypes.CLIENT, id);
const { model } = auth.useContext(); // first read finalises here

// ✅ .withId() defers finalisation the same way, at any builder position
const single = useClientEmailManager().withId(recordId); // no .as() — self later
const { model: record } = single.useContext(); // first read finalises here
```

**Test scenario:** Spy on the factory; assert it is not called until the first instance
property is read.

---

## Load order: import `createScopedComposable` so it is defined at module scope

Scoped modules call `createScopedComposable(...)` at **module top level**, while the
module graph is still initialising. `createScopedComposable` is a **hoisted function
declaration**, so importing it directly is safe even inside an import cycle. Pulling it
through an aggregator barrel can place the binding in its temporal dead zone and crash at
load with `X is not a function`.

<!-- corpus-example: skip — the contrast IS two in-package relative specifiers for the same binding; both are unresolvable outside packages/headless/src/modules, and no pair of importable specifiers reproduces "module file vs aggregator barrel" -->

```ts
// ✅ Safe — direct import of the hoisted declaration
import { createScopedComposable } from "../scope/scope.builder";

// ⚠️ Risky at module scope — aggregator-barrel re-exports can be in TDZ during cycles
import { createScopedComposable } from "../scope";
```

> **For Internal Devs:** This is the same failure class as the `useTime is not a function`
> aggregator-barrel cycle recorded in `code-quality.companion.md` (the Module Visibility
> Law). Intra-module imports pointing at the module's own barrel create import-time
> cycles.

---

## The matrix must be `as const`, and is passed twice

The compile-time builder types are derived from the matrix **value's** literal type, so
the matrix object must end in `as const`. It is passed to `createScopedComposable` as both
the type parameter (`TMatrix`) and the third argument (the value carried onto
`.scopeMatrix`). Drop `as const` and the context types widen to `string`, collapsing the
per-actor `.for()` gating.

```ts
import {
  createScopedComposable,
  ScopeActorTypes
} from "@upmind-automation/headless";

enum MyContextTypes {
  CLIENT = "client"
}

type UseMyModule = { useMeta: () => { isReady: boolean } };

const MY_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: MyContextTypes.CLIENT,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const; // ✅ literal types preserved

createScopedComposable<UseMyModule, typeof MY_MATRIX>(
  "my-module",
  () => ({ useMeta: () => ({ isReady: true }) }),
  MY_MATRIX // type AND value
);
```

---

## Common Mistakes

### Hardwiring the session id and dropping `.for()`

The builder resolves the **actor**, not the request **target**. A services file that reads
the session's active id for every call ignores a `.for('client', id)` context and silently
drops staff-acting-for-client retargeting. This is the FE-2824 receipt in
`code-composables.companion.md`: scope-context id wins when a `.for()` context is present;
the session's active id supplies only the self case.

### Adding a `.meta`/`.context`/`.services` arm that carries nothing exclusive

A per-actor arm exists only when that actor has members exclusive to it or overriding the
shared factory. An empty scaffold is a variance-law violation (clause 3). Fresh modules
start armless.

### Reading a scope key by fixed position 🧪

A retarget context contributes two segments (`type`, `id`); a selector context
contributes one; no context contributes zero. Any code that infers a key's fields by
counting positions from the left — rather than recognising the reserved `id:` / `brand:`
/ `fresh:` markers by name — will misreport a differently-shaped key: a brand filter
read as the context id, or a selector's type read as if it had an entity. `scope.devtools.ts`
hit exactly this and now walks the key from the right, peeling off marker/value pairs,
rather than matching a fixed offset. Anything else that parses a scope key (custom
logging, an ad-hoc debug panel) needs the same discipline.

**Test scenario:** Inspect a selector-context instance and a retarget-context instance
side by side; assert the selector's reported context carries no id field at all, and the
retarget's id is never confused with a brand or fresh marker.

---

## Edge Cases

| Scenario                                                     | Expected Behaviour                | Notes                                                     |
| ------------------------------------------------------------ | --------------------------------- | --------------------------------------------------------- |
| `.as('self')` with no session                                | Resolves to `guest`               | `resolveSelfActor` falls back to `AccessRoleTypes.GUEST`. |
| Same actor + context called twice                            | One shared instance               | Same scope key → registry hit.                            |
| `.as('staff').for('ticket', id)` when matrix has no `ticket` | Compile-time type error           | Never reaches runtime.                                    |
| `.for(type, id)` on a SELECTOR member                        | Compile-time type error           | The member declares no entity; the id belongs in `.withId(id)`. |
| `.for(type)` on a RETARGET member                            | Compile-time type error           | The member names an entity, so the id is required.        |
| A labs URL `/for/<type>` with no id, on a RETARGET member     | Boots a differently-keyed instance | Nothing rejects it: the builder never consults the matrix at runtime. Known gap, recorded in FE-3239's design §9. |
| `.inBrand()` on a non-staff actor                            | Not offered (type error)          | Brand filter is staff-only.                               |
| `clearAll()` mid-session                                     | All instances stopped and evicted | Test-only; will orphan any live consumers.                |

---

## Lifecycle Considerations

### Destroy non-singleton instances when done

```ts
import { onUnmounted } from "vue";
import { useClientEmailManager } from "@upmind-automation/headless";

const instance = useClientEmailManager().fresh();

onUnmounted(() => instance.useActions().destroy()); // → remove(scopeKey), stops it
```

### DevTools is bootstrap-only

`setupScopeDevtools(app, getRegistry())` runs **once** at app startup. `refreshDevtools()`
is internal — `ensure` / `remove` / `clearAll` already call it on every registry change.
