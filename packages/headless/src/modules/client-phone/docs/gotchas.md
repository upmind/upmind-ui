# client-phone — Gotchas

The sharp edges of the client's own phone-number collection and its per-phone editor. For anyone consuming `useClientPhones` / `useClientPhoneManager`, or writing tests against them. Several of these cost real debugging time to find — read this before you rediscover them.

> **🧪 For Testers:** Every section below carries a 🧪 expected-behaviour statement. Fixture names point at the recorded request/response pairs in `__tests__/fixtures/`.

## 1. `input()` is debounced — never `await` it expecting the parsed model

The editor's `input()` is debounced. Calling it does not synchronously parse — rapid keystrokes collapse into one parse — so an `await input(model)` written to immediately read back the parsed result can resolve before the real parse has run.

```ts
// ⚠️ Wrong: assuming the resolved value is always the freshly-parsed model
const parsed = await manager.useActions().input(typedValue);
// may not reflect the debounced parse that is still pending

// ✅ Right: poll state, or let update() do the flushing for you
manager.useActions().input(typedValue);
// ... later, when you actually need the settled value:
if (manager.useMeta().isValid.value) {
  await manager.useActions().update();
}
```

`update()` is the one action that reliably sees the latest typed value — it flushes the pending debounce before saving, so a save fired immediately after a keystroke persists what was actually typed. This imprecise contract is shared with this module's sibling client-address-book conversion; it is not unique to phones.

> **🧪 For Testers:** `input()` resolves the _parsed_ model, not the raw one you passed, once the debounce settles. An invalid number does not reject — it resolves and flips `useMeta().isValid` to `false`, with the field reason in `useContext().validationErrors`.

## 2. `nextPage()` / `prevPage()` always throw — the collection already holds everything

`useClientPhones().useActions()` advertises `nextPage` and `prevPage`, and both **always throw** `text.page_next_not_available` when called through this public surface.

The reason: the collection opens its list read with no page size (`limit: 0`), so it already returns the client's entire phone collection in one request. There is never a second page for `nextPage()` to move to.

```ts
// ⚠️ Wrong: assuming a large collection needs paging through the collection
await phones.useActions().nextPage(); // throws — always, on this surface

// ✅ Right: the collection already holds every row
const { data } = phones.useContext(); // the whole list, already loaded
```

Paging genuinely works — one layer down, at the services factory, not through `useClientPhones()`. A consumer that needs a real paged read builds its own query directly off the services layer with an explicit page size, rather than going through the collection composable. This is a property of the conversion pattern this module shares with its sibling `client-email` conversion, not a defect unique to phones — both ship the same always-throwing pair on the collection surface for the same reason.

> **🧪 For Testers:** Do not write a read-back that expects `nextPage()` / `prevPage()` to succeed through `useClientPhones()`. They cannot, by construction, while the collection opens unpaginated.

Fixtures: `__tests__/fixtures/get-clients-id-phones-case-page-1.json` / `-page-2.json` demonstrate the services-layer paged read the collection itself does not use.

## 3. Never re-add `useSystem().isReady()` to the editor's lookup loading

If you find yourself adding a readiness check like `await useSystem().isReady()` before the editor resolves its country, **stop** — this was tried, and it caused a real, measured stall.

The editor's `loadLookups` step calls `useSystem().ensureCountries()`, which already internally awaits both brand readiness and the countries query's own settled promise. Gating that call on a _separate_ `isReady()` check is redundant — and dangerous — because `isReady()` polls **every** active system-module query in the session on an uncapped interval, including ones this lookup has nothing to do with (for example, billing-cycle data another part of the app fetched earlier in the same session). In a real single-session lifecycle — one boot, several forms opened one after another — this manifested as a deterministic **~7 second stall** on the second editor opened in a session, reproduced twice within 30 milliseconds of each other in one measured run (cycle timings `[119, 208, 205, 7072, 204, 204]` — milliseconds per open).

```ts
// ⚠️ Wrong — reintroduces the stall
async function loadLookups(context) {
  await useSystem().isReady(); // uncapped poll across ALL system queries
  const countries = await ensureCountries();
  // ...
}

// ✅ Right — ensureCountries() already awaits what matters
async function loadLookups(context) {
  const countries = await ensureCountries();
  // ...
}
```

`client-phone.services.ts` carries a standing comment recording exactly this, at the `loadLookups` call site. `client-phone.session.int.test.ts` is the live regression tripwire: it drives one booted session through six open/edit/save/close cycles and asserts every one stays well under a bound — if `isReady()` (or an equivalent uncapped poll) is ever reintroduced ahead of lookup loading, that suite goes red before a real client hits a stalled form.

> **🧪 For Testers:** A test that only opens the editor once will never see this — the stall is specific to a _second_ (or later) editor opened within the same session. Test sustained single-session use, not just a cold single open, if you are validating this path.

## 4. `isReady()` and `onDone()` are bounded at 60 seconds

Both the editor's `isReady()` and `onDone()` reject or resolve `false` after 60 seconds rather than waiting forever.

```ts
// isReady() rejects with a timeout error past 60s
await manager.useActions().isReady(); // throws after 60s if never available

// onDone() resolves false, it does not hang, past 60s
const completed = await manager.useActions().onDone(); // false after 60s if unsettled
```

This is a deliberate bound, not an oversight: `loadLookups` awaits cross-module, network-backed calls that this module does not own the timing of, and an unbounded wait turns any stall upstream into a silent hang with no error surface for the caller to react to. The bound converts that into a reportable timeout instead.

> **🧪 For Testers:** Do not write a read-back that waits indefinitely for either of these to settle — treat 60 seconds as the outer bound and assert the rejection / `false` outcome deliberately if you are testing an unaddressable or stalled scope.

## 5. Release an editor with `destroy()`, not `stop()`

The editor exposes both `stop()` and `destroy()`, and they are not interchangeable:

| Call        | Stops the machine | Removes the registry entry |
| ----------- | ----------------- | -------------------------- |
| `stop()`    | yes               | **no**                     |
| `destroy()` | yes               | yes                        |

```ts
// ⚠️ Wrong: leaves a registry entry behind for every form open, for the SPA session's life
onUnmounted(() => manager.useActions().stop());

// ✅ Right
onUnmounted(() => manager.useActions().destroy());
```

Calling `stop()` where `destroy()` was needed was a real bug in this codebase's own form adapters. Because the registry entry survives `stop()`, every form a consumer opens and closes this way leaks one entry — for the lifetime of the single-page-app session, not just the component.

> **🧪 For Testers:** After `stop()`, the instance is still registered but no longer working — reopening the same scope key resolves the STOPPED instance, not a fresh one. After `destroy()`, reopening mints a genuinely new editor.

## 6. `findOne` matches nested partials; the shared `useCollection` helper does not

`useClientPhones().useContext().findOne(mapping)` accepts a **nested partial mapping** — `findOne({ phone: { number } })` matches a row on its parsed number alone, without supplying the rest of the `phone` object.

```ts
// This matches, even though the row's `phone` object has more keys than this
phones.useContext().findOne({ phone: { number: "+447911123456" } });
```

This module's `findOne` is deliberately **not** the shared `useCollection().findOne` helper used elsewhere in this codebase — that shared helper compares each mapped key with strict equality, so a nested partial like the one above never matches the full mapped `phone` object. This module's own `findOne` deep-partial-matches nested plain objects instead. This is a real, filed-not-fixed gap in the shared helper, and it affects six modules beyond this one.

**The important asymmetry:** `ensure()` — the find-or-create seam — still goes through the **shared** helper internally, not this module's own `findOne`. That is safe today because `ensure()` always matches on the model's full non-empty shape, which is the degenerate case a strict-equality match handles correctly. But it means **passing `ensure()` a nested partial mapping would silently miss an existing match and create a duplicate**, rather than finding the record `findOne()` would have found.

```ts
// ✅ Safe: ensure() with a full model
await phones.useActions().ensure({
  phone: {
    number: "+447911123456",
    nationalNumber: "7911123456",
    countryCallingCode: "44",
    country: "GB"
  }
});

// ⚠️ Risky: a partial mapping through ensure() can silently create a duplicate
await phones.useActions().ensure({ phone: { number: "+447911123456" } } as any);
```

> **🧪 For Testers:** A read-back that asserts `findOne` matches a nested partial does NOT tell you anything about `ensure`'s matching behaviour — they use different comparison logic. Test them separately.

## 7. A larger, module-scope-composed form reaches this module's schema by a deep internal path

One consumer elsewhere in this codebase — the unified billing-details schema that composes several modules' form fields into one larger form — imports this module's phone schema into a larger, multi-field form schema at **module scope**, before any editor instance exists. The documented route to the schema pair (`useClientPhoneManager().useContext().schema` / `.uischema`) does not fit that consumer, because there is no manager instance to read it from at the point the composition happens.

That one consumer imports the schema builder by its internal file path directly (`client-phone.schemas.ts`, marked internal in its own header), with an explicit acknowledgement comment marking it as a deliberate, internal-only exception — not a precedent for other consumers to follow. Every other consumer of this module's form definition uses the documented editor-context route in [usage.md](./usage.md#the-form-definition--paste-ready).

> **🧪 For Testers:** Do not treat the deep-import route as a second supported way to obtain the schema. It exists for exactly one consumer with a structural reason the documented route cannot serve.

## 8. `remove()` and `setDefault()` raise feedback — nothing else does

This module is asymmetric on user-visible feedback, and it is easy to assume the whole module is silent (many sibling modules in this codebase are) or that everything announces itself (some others do).

| Action                                                               | Raises a message on your behalf? |
| -------------------------------------------------------------------- | -------------------------------- |
| `useClientPhones().useActions().remove()`                            | **Yes** — success and failure    |
| `useClientPhones().useActions().setDefault()`                        | **Yes** — success and failure    |
| Everything else (`ensure`, `refresh`, the whole editor's `update()`) | No — read the state              |

```ts
// remove() and setDefault(): a message appears without you doing anything
await phones.useActions().remove(id); // raises success/failure feedback itself

// update() on the editor: nothing is announced — you render the outcome
await manager
  .useActions()
  .update(model)
  .catch(() => undefined);
if (manager.useMeta().hasErrors.value) renderYourOwnError();
```

This is a deliberate, kept divergence: the platform capability this module was converted from already confirms exactly these two row mutations with a message, and dropping that on conversion would have been a silent loss of a real, user-visible behaviour. It is not carried to the editor half, which — like every save path in this codebase's newer modules — raises nothing and expects the caller to render its own feedback from state.

> **🧪 For Testers:** A consumer that shows nothing after a failed editor save has not lost the error — it has not rendered `useContext().errors`. A consumer that shows nothing after a failed `remove()` or `setDefault()`, by contrast, has a real bug: this module raised the message and something ate it.

## 9. `type` (category) is read-only — no consumer can set it

Every phone record carries a numeric `type` (1 mobile, 2 home, 3 office, 4 personal), and it is exposed for display on every row. **Nothing in this module lets a consumer set or change it** — the create/update request body never carries it, and the editor's form has no control for it.

```ts
phones.useContext().data.value[0].type; // readable — e.g. 1

// ⚠️ There is no way to change this through the module
await manager.useActions().update({
  /* ... no field accepts a category */
});
```

This is a deliberate choice, not an oversight: every live consumer of this module creates and edits phone numbers with no category collected, and introducing a required category control would fail every one of those saves on day one. If your integration needs to distinguish a mobile number from a home one, that distinction is not available through this module.

## 10. Acting for a client other than yourself is not available — and is tracked, not silently gone

`useClientPhones().as('staff')` and `useClientPhoneManager().as('staff')` are **compile-time errors**. Only the calling client's own `self` scope resolves.

```ts
// ⚠️ Does not compile — 'staff' is `null as never` in this module's scope matrix
useClientPhones().as("staff");
```

This module's identity resolution function is written to accept a context branch for "a client other than the session's own", and that branch is currently unreachable from either scope matrix — kept deliberately so a future restoration is a matrix edit, not a rewrite. The wider platform genuinely has a staff-facing surface for managing a client's phone numbers on their behalf — a distinct set of endpoints, several capability gates, and an "acting as this client" mode — none of which is delivered here. It is recorded as an intentional, signed gap awaiting a tracked follow-up, not something silently dropped along the way.

> **🧪 For Testers:** A `.as('staff')` call is a TypeScript compile failure, not a runtime rejection — write a type-level check for it, not a runtime assertion.

## 11. `.as(SELF).for(...)` does not typecheck without a cast

Chaining `.for(...)` or `.fresh()` directly off a scope builder call that was itself built with `.as(SELF)` does not typecheck as written — the scope builder keys its available contexts off the literal actor type, not the one TypeScript has resolved by that point in the chain.

```ts
// ⚠️ Does not typecheck as written
useClientPhoneManager().as(ScopeActorTypes.SELF).for("phone", id);
```

Consumers that need `.for()` / `.fresh()` after an explicit `.as(...)` use an exported cast type to bridge the gap. This is a known, filed-not-fixed typing gap in the shared scope builder, not specific to this module — it affects every scoped-composable conversion that needs the same chain.

## 12. No phone verification exists — in this module, or in what it was converted from

`meta.isVerified` is exposed on every phone record, purely for display. There is **no action anywhere in this module** that submits a verification code, requests a verification message, or otherwise moves a number from unverified to verified.

This is worth stating explicitly because a sibling collection in this codebase — the client's email-address book — **does** ship a verification-request action. A reader familiar with that module might reasonably expect an equivalent `verify()` here. There isn't one, and it is not a capability that was dropped during this module's conversion to its current architecture: no version of this module's data source, at any point in its recorded history, has had a verification flow to carry forward. The read side — `meta.isVerified` — is real and current; the write side has never existed.

> **🧪 For Testers:** Do not write a read-back asserting a `verify()` member exists on either composable. Its absence is not a bug to file.

## 13. Staff phone management is not delivered here — it's tracked, not forgotten

Beyond the compile-time scope restriction in #10 above: twelve real capabilities the wider platform demonstrably supports for this kind of collection — the whole staff-facing surface (a distinct admin endpoint family, four capability gates, an "acting as this client" mode, staff-specific guidance copy), one advertised-but-never-wired editor option that has been removed outright, and a handful of legacy-only client-facing behaviours (a required category selector, a staged-imports list flag, a deterministic sort order, and success toasts on add/edit) — are recorded as **signed, deliberate drops awaiting a tracked follow-up issue**, not silently omitted and not yet linked to a tracked issue at the time of writing. If you are picking up work on this module and wondering why a capability you can see in an older reference implementation isn't here, it is very likely one of these — check the module's own change history before re-implementing it from scratch, since the omission may already be scoped and awaiting only the tracking reference.

> **🧪 For Testers:** None of these twelve are regressions to chase — they are known, and the decision to omit them for now was made deliberately and on the record.

## 14. Working in this codebase's development checkout: watch the lockfile

Not a module behaviour, but worth knowing if you are developing against this module in this particular checkout: an unrelated, uninitialised git submodule elsewhere in this monorepo causes **any** invocation of this repo's primary package manager to rewrite the lockfile, dropping several hundred lines. If you hit an unexpectedly large lockfile diff after running a routine command, that is almost certainly the cause — prefer a direct package-runner invocation, or revert the lockfile, rather than committing the rewrite.
