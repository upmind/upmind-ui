# client-personal-details — Gotchas

The sharp edges of the profile read view and its editor. For anyone consuming `usePersonalDetails` / `usePersonalDetailsManager`, or writing tests against them.

> **🧪 For Testers:** Every section below carries a 🧪 expected-behaviour statement. Fixture names point at the recorded request/response pairs in `__tests__/fixtures/`.

## 1. Clearing a native field and clearing a custom field send different wire values — never assume one covers both

A cleared native field (first name, last name, public name) reaches the wire as an empty string `""`. A cleared custom field value reaches the wire as JSON `null`. Both are **present** in the update body — neither is ever silently omitted — but they are not the same value.

```ts
import {
  usePersonalDetailsManager,
  ScopeActorTypes
} from "@upmind-automation/headless";

const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);

// Native field, cleared
await manager.useActions().update({ publicName: "" });
// → PUT body: { "public_name": "" }

// Custom field, cleared
await manager.useActions().update({ customFields: { age: "" } });
// → PUT body: { "custom_fields": { "age": null } }
```

> **🧪 For Testers:** Assert the exact value for the exact field kind you're clearing — `""` for a native field, `null` for a custom field. A test that accepts "either `""` or `null`" for a native field's clear is not a stronger assertion, it is a weaker one: it would still pass if the code sent the wrong value, which defeats the point of asserting it at all.

Fixtures: `put-clients-id-case-native-falsy.json` (native, `{"public_name":""}`), `put-clients-id-case-clear-custom-field.json` (custom field, `{"custom_fields":{"age":null}}`).

## 2. The read view and the editor are registered under two DIFFERENT internal names — do not assume they share a scope key

Some other scoped modules in this codebase register a query-backed collection and a machine-backed editor under one shared internal name, relying on the editor always supplying its own `.for()` or `.fresh()` to keep the two composables' scope keys apart. **This module cannot use that pattern**, because a client has exactly one profile — the editor's normal, everyday call (`.as(ScopeActorTypes.SELF)`, no further argument) would produce the _identical_ scope key the read view's own normal call produces, under a shared name. So this module's two composables are registered under two distinct internal names instead; they still share one scope matrix and one identity-resolution function underneath.

```ts
import {
  usePersonalDetails,
  usePersonalDetailsManager,
  ScopeActorTypes
} from "@upmind-automation/headless";

// Both of these resolve the SAME target client, through the SAME seam —
// but they are two SEPARATE registry entries, not one shared instance.
const profile = usePersonalDetails().as(ScopeActorTypes.SELF);
const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);
```

> **🧪 For Testers:** Do not expect destroying one composable's instance to affect the other's — they are independent registry entries even though they act on the same client.

## 3. Two independently-keyed reads of the same profile resource

This module and the sibling custom-fields module both read the same underlying client record — this module for the profile itself, the sibling for the target client's own brand id. Both are built to key against it as closely to each other as each side's own transport allows, but a small asymmetry in how each one forms its own cache key means they end up as **two separate entries today, not one shared one**. That gap is left alone rather than closed by force: the underlying request platform bakes its own field-selection logic inside the cached fetch function itself, so a genuinely shared entry would be populated by whichever side's request happened to resolve first, silently corrupting the other side's read with the wrong shape.

**Do not quote a specific number of requests per page load anywhere downstream of this doc.** The _mechanism_ (two distinct keys, so the two reads cannot dedupe today) is settled from source. The _count_ a real page load actually issues has been measured differently at different layers and is not settled — see [architecture.md](./architecture.md#two-independently-keyed-reads-of-the-same-profile-resource--and-why-they-stay-two).

> **🧪 For Testers:** If you're asserting a request count for a page that mounts both this module and the sibling module together, scope your assertion to **this module's own cache key** specifically, not to every matching request observed on the wire — a sibling module's own independent read is not this module's request, and counting it against this module makes a deliberate, safe non-fix look like a regression.

## 4. Cross-namespace test cleanup — evicting this module's own registry entries is not enough

This module's editor **composes** the sibling custom-fields module's own collection internally (to build its validation schema). A test suite that resets only this module's own two registry namespaces between tests will still see a stale, previously-cached instance of the sibling module's collection carried over from an earlier test in the same file — which matters whenever a test mutates a custom field definition's fixture (flipping `required`, for instance) and expects the _next_ test's editor to see the mutated definition.

```ts
import { getRegistry, queryClient, remove } from "@upmind-automation/headless";

/** This module's own two registry namespaces — both composables register under them. */
const SCOPE_NAMESPACES = [
  "client-personal-details",
  "client-personal-details-manager"
];

/** The sibling collection's namespace this module's editor composes. */
const CONSUMED_NAMESPACES = ["client-custom-fields"];

const liveKeysIn = (namespaces: string[]): string[] =>
  [...getRegistry().keys()].filter(key =>
    namespaces.some(namespace => key.startsWith(`${namespace}:`))
  );

// ⚠️ Wrong: only evicting this module's own namespaces
for (const key of liveKeysIn(SCOPE_NAMESPACES)) remove(key);

// ✅ Right: also evict the sibling module's namespace this module composes
for (const key of [
  ...liveKeysIn(SCOPE_NAMESPACES),
  ...liveKeysIn(CONSUMED_NAMESPACES)
]) {
  remove(key);
}
queryClient.clear(); // the registry entry and the query cache are separate lifetimes — both need clearing
```

This module's own integration test scaffolding does exactly this — evicting its own two namespaces (`client-personal-details`, `client-personal-details-manager`) **and** the sibling namespace (`client-custom-fields`) together, plus the shared query cache — before every test.

> **🧪 For Testers:** If a test that mutates a shared fixture (a custom field's `required` flag, say) seems to have "no effect" on a later test in the same file, check whether the earlier test's sibling-module instance was actually evicted, not just this module's own.

## 5. This module registers EAGERLY — safe today, but only circumstantially

Unlike the sibling custom-fields module (which defers its scope-registry registration to first call, precisely to dodge a real crash), both composables here register **eagerly**, at module top level, the moment the file is imported — the pattern most scoped composables in this codebase use.

```ts
import {
  createScopedComposable,
  ScopeActorTypes,
  type PersonalDetailsScopeMatrix,
  type ScopeConfig,
  type ScopeKey
} from "@upmind-automation/headless";

// This module's real shape. `client` is the only actor granted the context —
// the profile's owning client is named via `.for(CLIENT, id)` (gotcha 8);
// `self`, `staff` and `guest` are `null as never`.

/** Stand-in for this module's real per-scope factory. */
function createPersonalDetailsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  return {
    useActions: () => ({ scopeKey }),
    useContext: () => ({ actor: config.actor }),
    useInternals: () => ({}),
    useMeta: () => ({})
  };
}

// This module's OWN pattern — eager, at module top level, unlike the sibling
// custom-fields module's deferred registration.
export const usePersonalDetails = createScopedComposable<
  ReturnType<typeof createPersonalDetailsForScope>,
  PersonalDetailsScopeMatrix
>("client-personal-details", createPersonalDetailsForScope);
```

**Why this is safe today.** The crash the sibling module dodges happens when a module's own eager registration call re-enters the scope system while it is still mid-evaluation, because a generic layer that module depends on loops back through a sibling client module's barrel before the scope system has finished initialising. This module does not sit on that loop: nothing on the path that closes it imports this module's barrel, so this module is never the "entrant" that would trigger the crash — it simply hasn't been asked to be.

**What would change that.** This safety is a property of the _current_ import graph, not of anything this module's own code does to prevent it. If anything on the causal loop's path ever comes to import this module (directly or transitively), or if this module's own registration is moved earlier in some future refactor, the identical crash becomes reachable here too — with no local signal that it happened, since the failure surfaces at whichever module's import graph closes the loop, not necessarily this one's own tests. See the sibling module's own [gotchas.md](../../client-custom-fields/docs/gotchas.md#4-both-composables-register-lazily--this-is-load-bearing-not-a-style-choice) for the full account of the crash this module is currently, but not permanently, exempt from.

> **🧪 For Testers:** There is no test that can prove this module will _stay_ safe — only that it is safe on the _current_ import graph. Treat "this module registers eagerly and nothing has crashed" as a fact about today's dependency graph, not a guarantee.

## 6. `.as()` and `.for()` take enum members, never string literals

Both scoping methods on both composables are typed against the actual enum, not against the string a member happens to resolve to. Passing a plain string that happens to equal a member's value is a type error, not a working shortcut.

```ts
import {
  usePersonalDetailsManager,
  ScopeActorTypes,
  ClientPersonalDetailsContextTypes
} from "@upmind-automation/headless";

const clientId = "825d96e7-63ed-0913-46c4-174825283406";

// ❌ Wrong — TS2345 on the actor: a bare string is not the enum member
// @ts-expect-error
usePersonalDetailsManager().as("client");

// ❌ Wrong — TS2345 on the context type, for the same reason
// @ts-expect-error
usePersonalDetailsManager().as(ScopeActorTypes.CLIENT).for("client", clientId);

// ✅ Right — both arguments are enum members
const manager = usePersonalDetailsManager()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientPersonalDetailsContextTypes.CLIENT, clientId);
```

Each `@ts-expect-error` above is the proof, not a workaround: delete a directive and the block stops compiling, because the error underneath it is real.

**This bites hardest in specs and playground files**, because `__tests__/**` and the labs playground both sit outside this package's own build type-check. A string-literal call can sit in either for a long time looking like it works, because nothing in the normal build path ever type-checks it. Runtime behaviour is unaffected either way (the string and the enum member are the same value at runtime) — this is a compile-time coverage gap, not a functional bug. See the sibling module's own [gotchas.md](../../client-custom-fields/docs/gotchas.md#2-as-and-for-take-enum-members-never-string-literals) for the fuller account — the same rule applies here.

## 7. `.as(ScopeActorTypes.SELF)` compiles and works, but the result carries no `.for()`/`.fresh()`

Both composables in this module share one scope matrix, which maps `self` to `null as never` (the same shape the sibling custom-fields module uses). `.as(ScopeActorTypes.SELF)` alone works and resolves to the calling client, but the type it produces cannot chain a further `.for()` or `.fresh()` — this is a distinct issue from gotcha 6 above: the code here typechecks fine, it just doesn't have the method you might reach for next.

```ts
import {
  usePersonalDetailsManager,
  ScopeActorTypes
} from "@upmind-automation/headless";

// ✅ Right: .as(ScopeActorTypes.SELF) alone
const selfScoped = usePersonalDetailsManager().as(ScopeActorTypes.SELF);

// ❌ Wrong: chaining .fresh() off SELF does not typecheck
// @ts-expect-error — no .fresh() on the SELF branch's type
usePersonalDetailsManager().as(ScopeActorTypes.SELF).fresh();

// ✅ Right: name the concrete actor when you need .for()/.fresh()
const manager = usePersonalDetailsManager().as(ScopeActorTypes.CLIENT).fresh();
```

This module's own composables don't strictly need `.for()`/`.fresh()` for the everyday case — a client's profile has only one context to address — but the real playground consumer still names `.as(ScopeActorTypes.CLIENT)` rather than `SELF`, specifically to reach `.fresh()` (minting an independent editor instance per mount). See the sibling module's own [gotchas.md](../../client-custom-fields/docs/gotchas.md#3-asscopeactortypesself-compiles-and-works-but-the-result-carries-no-forfresh) for the full explanation — the same rule applies here.

> **🧪 For Testers:** A reader who hits gotcha 6 (a bare string rejected) and "fixes" it by dropping the `.for()`/`.fresh()` call entirely has changed the wrong thing — that only compiles because the chained call is gone, not because the string-literal problem was addressed.

## 8. The trap was the context's NAME, not `.for()` itself — a resource-named member carrying the client's own id

This module used to name its shared context `ClientPersonalDetailsContextTypes.PROFILE` — the context member named the RESOURCE being edited (the profile) while the id it actually carried was the CLIENT's own id. The type and the id it carried disagreed about which entity was named. A short-lived correction (since reversed) misdiagnosed that as `.for()` itself being wrong and dropped the context entirely in favour of a bare `.withId(id)` — which erased the compile-time gate: `resolveClientId` fell back to `id ?? activeUser.value?.id` with no actor check at all, so `staff`/`guest` could name any client id too.

The actual fix (ADR-001 amendment 2026-09-15) is a rename, not a removal: the member is now `ClientPersonalDetailsContextTypes.CLIENT = AccessRoleTypes.CLIENT`, matching every sibling client module (`ClientPhonesContextTypes.CLIENT`, `ClientNotesContextTypes.CLIENT`). The matrix gate is real again — `.for(CLIENT, id)` is spellable **only** for the `client` actor; `self`, `staff` and `guest` are `null as never`, so `.as(ScopeActorTypes.STAFF).for(...)` is a compile-time error exactly as it was before the context was ever dropped.

```ts
import {
  usePersonalDetails,
  ScopeActorTypes,
  ClientPersonalDetailsContextTypes
} from "@upmind-automation/headless";

const otherClientId = "825d96e7-63ed-0913-46c4-174825283406";

// ✅ Right — only `client` may spell a retarget
const asClient = usePersonalDetails()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientPersonalDetailsContextTypes.CLIENT, otherClientId);

// ⚠️ Does not compile — the matrix pins `staff` to `null as never`
usePersonalDetails()
  .as(ScopeActorTypes.STAFF)
  // @ts-expect-error — staff resolves no context in this module's matrix
  .for(ClientPersonalDetailsContextTypes.CLIENT, otherClientId);
```

> **🧪 For Testers:** `.for(ClientPersonalDetailsContextTypes.CLIENT, id)` is a compile-time refusal for `staff` and `guest`, not a runtime one — write a type-level check (an `@ts-expect-error`), not a runtime assertion. See [dropped-capabilities.md](./dropped-capabilities.md) for the staff-facing profile-editing surface that remains unbuilt regardless of this context's name.

## 9. `pnpm lint` and `pnpm install` are unsafe to run casually against this module's changes

`pnpm lint` at the repo root aborts inside a shared types submodule before it ever reaches this module, and its `--fix` flag mutates that submodule as a side effect. `pnpm install` at the repo root is unsafe in a sparse worktree missing one or more app-level `package.json` files — it silently drops those apps' entries from the shared lockfile. Neither is a safe verification step for a change scoped to this module; use the module's own targeted test commands instead.

## Common Mistakes

### Assuming a client id resolved into `.for(...)` is validated against the caller

The context id this module's `.for(...)` takes is a plain caller-supplied value. Nothing in this contract checks locally that it matches the calling session's own client — `.as(ScopeActorTypes.CLIENT).for(ClientPersonalDetailsContextTypes.CLIENT, someOtherId)` compiles and addresses that other id's profile, on the caller's own session bearer. Whether the platform actually honours the request is a server-side authorization decision, not something this contract enforces or advertises. This is narrower than a staff or on-behalf-of capability: there is no way to act _as_ a different party here. Be precise about where that boundary is enforced, because it splits in two. A **bare** `.as(ScopeActorTypes.STAFF)` or `.as(ScopeActorTypes.GUEST)` **type-checks** on both composables — the shared matrix's `null as never` row removes `.for(...)` and nothing else — and is refused at **runtime** instead: with no context naming a target, every request resolves its client id from the active session itself and is gated by this module's own addressability check. It is `.as(ScopeActorTypes.STAFF).for(...)` that is the compile-time error. Only the entity id being named is caller-controlled, not the identity making the call.

### Assuming the editor needs a `.for()` argument

It doesn't — `usePersonalDetailsManager().as(ScopeActorTypes.SELF)` alone constructs and settles. A client has exactly one profile; there is nothing to select between.

### Building an update body by hand instead of through `input()` / `update()`

A hand-built body has to apply the correct clear value for each field kind itself (`""` for native, `null` for custom). Going through the editor's own `input()` / `update()` path gets this right automatically.

### Reading a custom field's value off the display projection when you need its raw wire value

`useContext().data`'s custom-field rows are the coerced, display-ready projection. `useContext().customFields` (on the read view) is the raw, embedded-definition-carrying value — use that when you need the value exactly as the client record holds it.

## Lifecycle Considerations

### Destroy the instance when done

```ts
import { onUnmounted } from "vue";
import {
  usePersonalDetails,
  usePersonalDetailsManager,
  ScopeActorTypes
} from "@upmind-automation/headless";

const profile = usePersonalDetails().as(ScopeActorTypes.SELF);
const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);

onUnmounted(() => {
  profile.useActions().destroy();
  manager.useActions().destroy(); // also stops the underlying machine
});
```

### Wait for readiness before reading or editing

```ts
import {
  usePersonalDetails,
  usePersonalDetailsManager,
  ScopeActorTypes
} from "@upmind-automation/headless";

const profile = usePersonalDetails().as(ScopeActorTypes.SELF);
const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);

await profile.useActions().isReady();
await manager.useActions().isReady(); // bounded — resolves false rather than hanging
```
