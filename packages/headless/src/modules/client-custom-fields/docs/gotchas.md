# client-custom-fields — Gotchas

The sharp edges of the definitions collection and the per-field image editor. For anyone consuming `useClientCustomFields` / `useClientCustomFieldImage`, or writing tests against them.

> **🧪 For Testers:** Every section below carries a 🧪 expected-behaviour statement. Fixture names point at the recorded request/response pairs in `__tests__/fixtures/`.

## 1. Image upload progress is binary (0/100), not incremental

`useClientCustomFieldImage().useMeta().progress` reports `100` once the upload has completed and `0` at every other time — it never advances through an intermediate value. This is an honest signal, not a rough approximation of a real one: **no intermediate value is ever produced**, by design.

```vue
<script setup lang="ts">
import {
  useClientCustomFieldImage,
  ScopeActorTypes,
  ClientCustomFieldContextTypes
} from "@upmind-automation/headless";

const fieldId = "0c9ff2c1-6d29-4f6d-9a54-1a9d5f0b3b21";
const image = useClientCustomFieldImage()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldContextTypes.FIELD, fieldId);

// isUploading tells you "in flight or not"; progress tells you "done or not"
const { isUploading, progress } = image.useMeta();
</script>

<template>
  <!-- ⚠️ Wrong: a progress bar expecting intermediate values. It type-checks and
       it renders — it just never shows anything between 0% and 100%. -->
  <progress :value="progress" max="100" />

  <!-- ✅ Right: treat the pair as boolean-shaped signals -->
  <span v-if="isUploading">Uploading…</span>
  <span v-else>{{ progress === 100 ? "Uploaded" : "No image yet" }}</span>
</template>
```

This is not a temporary rough edge to be tightened later by this module alone — three separate things would all have to change outside this module's own code before byte-level progress could ever be reported: the transport the upload goes through has no upload-progress hook at all, the upload machine's own progress event is never dispatched by anything in the tree, and the upload composable's own return value does not expose a progress field even if it were. **Do not describe incremental progress as delivered anywhere this module is documented, tested, or reviewed** — the binary signal is the honest maximum until all three of those change.

> **🧪 For Testers:** Drive an upload to completion and assert exactly two observed values in sequence — `0` then `100` — never anything in between. A test asserting an intermediate value is asserting behaviour this module cannot produce.

## 2. `.as()` and the image editor's `.for()` take enum members, never string literals

Both composables type `.as()` against the actual enum, not against the string a member happens to resolve to; the image editor's `.for()` does the same for its own context type. Passing a plain string that happens to equal a member's value is a type error, not a working shortcut — TypeScript enums are not structurally interchangeable with their own literal values.

```ts
import {
  useClientCustomFields,
  useClientCustomFieldImage,
  ScopeActorTypes,
  ClientCustomFieldContextTypes
} from "@upmind-automation/headless";

const clientId = "825d96e7-63ed-0913-46c4-174825283406";
const fieldId = "0c9ff2c1-6d29-4f6d-9a54-1a9d5f0b3b21";

// ❌ Wrong — TS2345 on the actor: a bare string is not the enum member
// @ts-expect-error
useClientCustomFields().as("client");

// ❌ Wrong — TS2345 on the context type, for the same reason
useClientCustomFieldImage()
  .as(ScopeActorTypes.CLIENT)
  // @ts-expect-error
  .for("field", fieldId);

// ✅ Right — the collection takes a plain string id via .withId(), no enum involved
const fields = useClientCustomFields().as(ScopeActorTypes.CLIENT).withId(clientId);

// ✅ Right — the image editor's context type is an enum member
const image = useClientCustomFieldImage()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldContextTypes.FIELD, fieldId);
```

Each `@ts-expect-error` above is the proof, not a workaround: delete a directive and the block stops compiling, because the error underneath it is real. The collection has no context type left to get wrong this way — `.withId(id)` takes a plain string, not an enum member, because it names a record, not a context (see gotcha 6 below).

**This bites hardest in specs and playground files**, because `__tests__/**` and the labs playground both sit outside this package's own build type-check (`tsconfig.build.json`). A string-literal call can sit in a spec or a playground page for a long time, looking like it works, because nothing in the normal build path ever type-checks it — it only surfaces under a standalone `tsc` run against those directories, or if the file is ever pulled into the checked build set. Seeing the string-literal form anywhere — including in another module's own example code — is not evidence that it typechecks; it may simply never have been checked.

> **🧪 For Testers:** If a spec or playground file uses `.as("client")` or `.for("...")` with a bare string, that is a latent type error, not a precedent to copy. Runtime behaviour is unaffected either way (the string and the enum member are the same value at runtime) — this is purely a compile-time gap in coverage, not a functional bug.

## 3. `.as(ScopeActorTypes.SELF)` compiles and works, but the result carries no `.for()`/`.withId()`/`.fresh()`

`.as(ScopeActorTypes.SELF)` resolves to the calling client — the actor-scoping builder resolves `self` to a concrete actor, and returns the plain, unscoped instance directly, before either composable's matrix is even consulted. **No further chaining is available on the result** — not `.for()`, not `.withId()`, not `.fresh()` — on either composable in this module. This is a distinct issue from gotcha 2 above: the code here typechecks fine, it just doesn't have the method you might reach for next.

```ts
import {
  useClientCustomFields,
  ScopeActorTypes
} from "@upmind-automation/headless";

const clientId = "825d96e7-63ed-0913-46c4-174825283406";

// ✅ Right: .as(ScopeActorTypes.SELF) alone
const selfScoped = useClientCustomFields().as(ScopeActorTypes.SELF);

// ❌ Wrong: chaining .withId() off SELF does not typecheck on this module
useClientCustomFields()
  .as(ScopeActorTypes.SELF)
  // @ts-expect-error — no .withId() on the SELF branch's type
  .withId(clientId);

// ✅ Right: name a concrete actor (any of them — .withId() is not actor-gated,
// see gotcha 6) when you need to chain further
const fields = useClientCustomFields().as(ScopeActorTypes.CLIENT).withId(clientId);
```

This is unrelated to whether the _runtime_ actor resolution behaves correctly — it resolves fine either way. It is purely that `.as(self)` returns the bare instance type with no further chaining at all, regardless of which composable in the tree you're looking at. Every scoped composable in this codebase has the identical shape for `self` — it is not specific to this module's matrix.

> **🧪 For Testers:** This is a compile-time gotcha, not a runtime one. A reader who hits gotcha 2 (a bare string rejected) and "fixes" it by switching from `.as(ScopeActorTypes.CLIENT).withId(...)` to `.as(ScopeActorTypes.SELF)` alone has changed the wrong thing — that swap only happens to compile because it drops the `.withId()` call entirely, not because it addressed the string-literal problem.

## 4. Both composables register lazily — this is load-bearing, not a style choice

Most scoped composables in this codebase register with the scope system **eagerly**, at module top level, the moment the file is imported. Both composables in this module register **lazily** instead — on first call, not at import time.

```ts
import {
  createScopedComposable,
  ScopeActorTypes,
  type ScopeBuilder,
  type ScopeConfig,
  type ScopeKey
} from "@upmind-automation/headless";

// All-`never` — this module's real shape. It names no context for any actor;
// the collection's own client is marked with `.withId(id)` instead (gotcha 6).
const SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Stand-in for this module's real per-scope factory. */
function factory(config: ScopeConfig, scopeKey: ScopeKey) {
  return {
    useActions: () => ({ scopeKey }),
    useContext: () => ({ actor: config.actor }),
    useInternals: () => ({}),
    useMeta: () => ({})
  };
}

type Instance = ReturnType<typeof factory>;
type Matrix = typeof SCOPE_MATRIX;

// ⚠️ The eager pattern used elsewhere in this codebase — NOT used here
export const useSomeOtherModule = createScopedComposable<Instance, Matrix>(
  "some-other-module",
  factory,
  SCOPE_MATRIX
);

// ✅ What this module does instead — register on FIRST CALL, not at import time
let registered: (() => ScopeBuilder<Instance, Matrix>) | undefined;

export function useClientCustomFields(): ScopeBuilder<Instance, Matrix> {
  if (!registered) {
    registered = createScopedComposable<Instance, Matrix>(
      "client-custom-fields",
      factory,
      SCOPE_MATRIX
    );
  }
  return registered();
}
```

This is not a preference — the eager pattern is provably fatal for this module. The scope system's own dependency chain loops back through the request layer into the basket domain and from there into a sibling client module, which in turn imports this module's own barrel — all while the scope system's own module is still mid-evaluation. An eager top-level registration call in this module re-enters that still-initialising chain and throws before the app can even start. Deferring registration to first use — well after the whole module graph has settled, since a real consumer only ever calls this during a component's own setup or inside a test body — means nothing ever dereferences the still-initialising chain. The cycle stays in the import graph; it just stops being fatal.

**The causal root, so the next converter recognises the class rather than just the symptom:** a generic request layer this module (and every sibling client module) depends on reaches into the basket domain, and it is that one edge — a general-purpose layer importing a specific domain — that lets the import graph loop back through sibling client modules in the first place. Any module sitting downstream of that edge is a candidate for the identical crash; whether it actually crashes depends only on which module happens to be the first one to import-time-evaluate along a path that closes the loop.

**This is the single most reusable fact in this module for the next converter to know.** At least one other already-converted client module in this codebase still registers eagerly and is exposed to the identical crash — it simply hasn't been the "first unmocked entrant" to trigger it yet. This module's own sibling profile module also registers eagerly and is currently safe, but only circumstantially — see that module's own [gotchas.md](../../client-personal-details/docs/gotchas.md) for why. If you are converting another module in this family and it composes — or is composed by — a sibling client module, check whether it registers eagerly before assuming the eager pattern is safe just because another reference module uses it.

> **🧪 For Testers:** There is no assertion that directly proves "this module registers lazily" from the outside — the observable behaviour is simply that importing this module's barrel alongside its siblings never throws `TypeError: createScopedComposable is not a function`, regardless of import order.

## 5. The numeric type is the only safe discriminator — the string label can silently fall through

Every definition carries both a numeric type and a string label describing the same type. Value coercion, schema generation, and form-definition generation all branch on the **numeric** one. The numeric enum specifies all eight _types_; it says nothing about their string labels. Two of the eight possible string labels have been directly observed against real captured data; the rest are inferred from naming convention and have not been confirmed against a real definition of that type.

```ts
import type { CustomField } from "@upmind-automation/headless";
import { CustomFieldsTypes } from "@upmind-automation/types";

declare const field: CustomField;

// ⚠️ Wrong: branching on the display label
if (field.type === "date") {
  /* … */
} // unconfirmed against real data for this brand

// ✅ Right: branch on the numeric discriminator
if (field.typeId === CustomFieldsTypes.DATE) {
  /* … */
}
```

`CustomFieldsTypes` is a `@upmind-automation/types` export, not one of this module's own — the headless barrel does not re-export it.

The risk is not in this module's own code — it branches correctly — but in the **shared** schema/form-generation helpers this module re-exports, which key their own switches on the string label rather than the numeric one. A field whose real string label doesn't match what was assumed for it falls silently to that helper's generic default, losing whatever special handling that type was supposed to get, with no error raised anywhere.

> **🧪 For Testers:** If you're testing a DATE or PASSWORD-typed field's schema or form-definition output and it doesn't look date-shaped or password-shaped, check whether the fixture's `type_code` string actually matches what the shared helper expects — this module's own coercion will still be correct even when the shared helper's output isn't.

## 6. `.withId()` carries no per-actor gate — unlike this module's former `.for(VALUES, id)` shape

This module used to name a single-member context (`ClientCustomFieldsContextTypes.VALUES`) purely to carry the owning client's id through `.for(VALUES, id)` — spellable only for the `client` actor, since that context lived only on the matrix's `client` row. Per ADR-001's 2026-09-15 amendment (`.for()` carries the context, `.withId()` carries the id), that context is gone: the collection's matrix now maps **every** actor to `null as never`, and the client is named with `.withId(id)` instead.

The trap: `.withId(id)` is a platform-wide seam offered to every actor at every builder position, with **no matrix gate at all** (ADR-001's 2026-08-19 amendment) — the matrix constrains `.for()` contexts, never record ids. So where `.as(ScopeActorTypes.STAFF).for(ClientCustomFieldsContextTypes.VALUES, id)` used to be a compile-time error, `.as(ScopeActorTypes.STAFF).withId(id)` **compiles**, on this module as on any other. And this module's own client-resolution seam (`resolveClientId`) reads whichever id `.withId()` supplies with no check against the calling actor — it resolves the named id for `staff` and `guest` exactly as it does for `client`.

```ts
import {
  useClientCustomFields,
  ScopeActorTypes
} from "@upmind-automation/headless";

const otherClientId = "825d96e7-63ed-0913-46c4-174825283406";

// Before this module dropped ClientCustomFieldsContextTypes:
// only `client` could spell a retarget — `.as(STAFF).for(...)` was TS2345.

// Today: every actor can spell one, because .withId() isn't matrix-gated.
const asStaff = useClientCustomFields().as(ScopeActorTypes.STAFF).withId(otherClientId);
const asClient = useClientCustomFields().as(ScopeActorTypes.CLIENT).withId(otherClientId);
// Both compile, and both resolve this module's own addressability check the
// same way — nothing in this module's own code distinguishes them by actor.
```

> **🧪 For Testers:** No test in this module's own suite currently exercises `.as(ScopeActorTypes.STAFF).withId(id)` or `.as(ScopeActorTypes.GUEST).withId(id)` end-to-end. This module's own code compiles the call and forwards the named id with no local actor check — whether a real staff-issued request of this shape is honoured is a server-side authorization question this module neither settles nor advertises an answer to.

## 7. The definitions read targets the CLIENT's brand, never the session's own

The brand used to scope the definitions request is the **target client's** brand, resolved through the same identity seam every other request in this module uses — never the calling session's own brand from the ambient brand context.

In a multi-brand organisation, the calling session's own brand and a targeted entity's brand can legitimately differ; this module always resolves the latter, off the same client id every other request in this module uses — never off the ambient session brand.

> **🧪 For Testers:** Seed a target client whose brand differs from the ambient session brand and assert the outbound definitions request carries the **client's** brand id, not the session's.

## 8. This module's own brand-id read and the profile module's read are two cache entries, not one

Both this module and the client's own profile module read the identical underlying client record. Each is built to key against it as closely to the other as its own transport allows, but a small asymmetry in how each side forms its own key leaves them as two separate cache entries rather than one shared one — and that gap is left alone deliberately, not fixed by force, because forcing a shared entry risks one side's selected shape silently overwriting the other's.

**Do not quote a specific per-boot request count anywhere downstream of this doc.** See the profile module's own [gotchas.md](../../client-personal-details/docs/gotchas.md#3-two-independently-keyed-reads-of-the-same-profile-resource) for the full account.

## 9. `pnpm lint` and `pnpm install` are unsafe to run casually against this module's changes

`pnpm lint` at the repo root aborts inside the `packages/types` submodule before it ever reaches this module, and its `--fix` flag mutates that submodule as a side effect. `pnpm install` at the repo root is unsafe in a sparse worktree that is missing one or more app-level `package.json` files — it silently drops those apps' entries from the shared lockfile. Neither is a safe verification step for a change scoped to this module; use the module's own targeted test commands instead.

## Common Mistakes

### Assuming a client id resolved into `.withId(...)` is validated against the caller — or against the actor

The id `.withId(...)` takes is a plain caller-supplied value. Nothing in this contract checks locally that it matches the calling session's own client — `.as(ScopeActorTypes.CLIENT).withId(someOtherId)` compiles and addresses that other id's resource, on the caller's own session bearer. Whether the platform actually honours the request is a server-side authorization decision, not something this contract enforces or advertises. Unlike this module's former `.for(VALUES, id)` shape, that is no longer narrower than an on-behalf-of capability — see gotcha 6 above: `.withId()` carries no per-actor gate, so `.as(ScopeActorTypes.STAFF).withId(someOtherId)` compiles and resolves the named id too, with only the id itself caller-controlled, not which actor named it.

### Serialising a value set before the aggregate image flush has run

A value set that still carries a raw, pending file for an IMAGE field will serialise that file object, not a hash. Always resolve `flushImages()` (or the per-field `flush()`) before anything downstream treats the value set as ready to persist.

## Lifecycle Considerations

### Destroy the instance when done

```ts
import { onUnmounted } from "vue";
import {
  useClientCustomFields,
  useClientCustomFieldImage,
  ScopeActorTypes,
  ClientCustomFieldContextTypes
} from "@upmind-automation/headless";

const clientId = "825d96e7-63ed-0913-46c4-174825283406";
const fieldId = "0c9ff2c1-6d29-4f6d-9a54-1a9d5f0b3b21";

const fields = useClientCustomFields().as(ScopeActorTypes.CLIENT).withId(clientId);
const image = useClientCustomFieldImage()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldContextTypes.FIELD, fieldId);

onUnmounted(() => {
  fields.useActions().destroy();
  image.useActions().destroy(); // also stops the underlying upload interpreter
});
```

### Wait for readiness before reading

```ts
import {
  useClientCustomFields,
  useClientCustomFieldImage,
  ScopeActorTypes,
  ClientCustomFieldContextTypes
} from "@upmind-automation/headless";

const fields = useClientCustomFields()
  .as(ScopeActorTypes.CLIENT)
  .withId("825d96e7-63ed-0913-46c4-174825283406");
const image = useClientCustomFieldImage()
  .as(ScopeActorTypes.CLIENT)
  .for(
    ClientCustomFieldContextTypes.FIELD,
    "0c9ff2c1-6d29-4f6d-9a54-1a9d5f0b3b21"
  );

await fields.useActions().isReady();
await image.useActions().isReady();
```
