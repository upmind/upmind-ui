# client-address — Gotchas

The sharp edges of the client's own address collection and its per-address editor. For anyone consuming `useClientAddresses` / `useClientAddressManager`, or writing tests against them. Several of these cost real debugging time to find — read this before you rediscover them.

> **🧪 For Testers:** Every section below carries a 🧪 expected-behaviour statement. Fixture names point at the recorded request/response pairs in `__tests__/fixtures/`.

## 1. `default()` returns an **id**, not the row

`useClientAddresses().useContext().default()` resolves the default address's `id` — or `undefined` if none is flagged default — **never the address object itself**. This is the single easiest thing to get wrong reaching for this module, because nothing about the type signature stops you from treating it as the row.

```ts
// ⚠️ Wrong — default() is a string, not an address
const defaultAddress = addresses.useContext().default();
console.log(defaultAddress.city); // runtime error, or `undefined` under loose typing

// ✅ Right — chain getOne() to get the row
const { default: defaultId, getOne } = addresses.useContext();
const defaultAddress = getOne(defaultId());
```

Every in-tree consumer of this collection threads the id through `getOne()` (or an equivalent lookup) rather than treating `default()` as the record — that is the pattern to copy.

> **🧪 For Testers:** Against a fixture with exactly one `default: true` row, `default()` resolves to that row's `id`; against a fixture with none, `undefined`. A read-back asserting `default()` resolves an object with an `address` key is asserting the wrong contract.

## 2. A partial `update()` can silently discard a prior edit

Both `input()` and `update()` accept a **partial** model — you do not have to pass the whole `address` object back. Every key a partial payload omits is refilled from the form's **opening** snapshot, not from whatever the model currently holds. That is safe the first time, on an untouched form. It is not safe the second time.

```ts
// One prior edit, then one partial call — the FIRST edit is silently lost.
await manager.useActions().input({ address: { city: "London" } });
await manager.useActions().update({ address: { postcode: "SW1A 1AA" } });
// The PUT body carries only { postcode: "SW1A 1AA" } — "city" reverted to
// whatever the form opened on, and the save still resolves as SUCCESS.
```

```ts
// ✅ Right — pass the whole model back, or fold your partial into what
// input() last resolved.
const current = await manager.useActions().input({ address: { city: "London" } });
await manager.useActions().update({
  ...current,
  address: { ...current.address, postcode: "SW1A 1AA" }
});
```

The JSON-form renderer this editor was built for is never exposed to this: it always submits the whole model on every change, so the fill-from-snapshot rule never has an omitted key to misfire on. A caller driving the editor directly with hand-built partial payloads — a script, a test, an alternative UI — is the one exposed to it, and the failure is silent: no error, no rejected promise, just a save that resolves and quietly did less than asked.

> **🧪 For Testers:** A read-back that edits one field, then saves a partial payload for a different field, and asserts BOTH edits landed will fail — only the second one does. This is documented, current behaviour, not a bug to file; the fix is in the calling code, not this module.

## 3. `isDirty` reads `true` even right after a clean save

The editor's `isDirty` flag compares the live model against its persisted baseline (`isEqual(model, baseModel)`). Immediately after a successful save, the live model can carry a handful of extra display-only fields the machine folds in on save (the address's title and description among them) — fields the baseline was never given. The two no longer compare equal, so `isDirty` reads `true` even though nothing the client can edit has actually changed.

```ts
await manager.useActions().update(); // succeeds
manager.useMeta().isDirty.value; // true — even though nothing is pending
```

No consumer in this codebase currently reads `isDirty` to gate a Save button, so this is inert today. A future consumer that does would see a button that never goes quiet after a save.

> **🧪 For Testers:** Do not write a read-back asserting `isDirty` returns to `false` immediately after `update()` resolves. It does not.

## 4. `nextPage()` / `prevPage()` cannot move through this surface

`useClientAddresses().useActions()` advertises `nextPage` and `prevPage`. Both **settle as a rejection** when called through this public surface, rather than resolving.

The reason: the collection opens its list read with no page size (`limit: 0`), so it already returns the client's entire address collection in one request. There is never a second page for `nextPage()` to move to.

```ts
// ⚠️ Wrong: assuming a large collection needs paging through the collection
await addresses.useActions().nextPage(); // settles rejected — always, on this surface

// ✅ Right: the collection already holds every row
const { data } = addresses.useContext(); // the whole list, already loaded
```

Paging genuinely works — one layer down, at the services factory, not through `useClientAddresses()`. A consumer that needs a real paged read builds its own query directly off the services layer with an explicit page size, rather than going through the collection composable.

> **🧪 For Testers:** Do not write a read-back that expects `nextPage()` / `prevPage()` to succeed through `useClientAddresses()`. They settle as a rejection, not a synchronous throw — a `try { await … } catch {}` around the call, expecting the `catch` block to run, is testing the wrong half of a promise.

Fixtures: `__tests__/fixtures/get-clients-id-addresses-case-page-1.json` / `-page-2.json` demonstrate the services-layer paged read the collection itself does not use.

## 5. `isReady()`, `onDone()` and `nextPage()` / `prevPage()` are all bounded

The editor's `isReady()` rejects with a catchable timeout error, and `onDone()` resolves `false`, if the underlying wait runs past its bound rather than hanging forever. The collection's own `isReady()` resolves `false` at its own bound if the list never arrives.

```ts
// isReady() rejects past the bound
await manager.useActions().isReady(); // throws if never available in time

// onDone() resolves false, it does not hang, past the bound
const completed = await manager.useActions().onDone(); // false if unsettled
```

This is deliberate: the editor's lookup chain awaits cross-module, network-backed calls this module does not own the timing of, and an unbounded wait turns any stall upstream into a silent hang with no error surface for the caller to react to. The bound converts that into a reportable timeout instead.

> **🧪 For Testers:** Do not write a read-back that waits indefinitely for any of these to settle — treat the bound as the outer limit and assert the rejection / `false` outcome deliberately if you are testing an unaddressable or stalled scope.

## 6. `remove()` and `setDefault()` raise feedback — nothing else does

This module is asymmetric on user-visible feedback, and it is easy to assume the whole module is silent or that everything announces itself.

| Action                                                                | Raises a message on your behalf? |
| ------------------------------------------------------------------------ | ----------------------------------- |
| `useClientAddresses().useActions().remove()`                          | **Yes** — success and failure       |
| `useClientAddresses().useActions().setDefault()`                      | **Yes** — success and failure       |
| Everything else (`ensure`, `refresh`, the whole editor's `update()`)   | No — read the state                 |

```ts
// remove() and setDefault(): a message appears without you doing anything
await addresses.useActions().remove(id); // raises success/failure feedback itself

// update() on the editor: nothing is announced — you render the outcome
await manager
  .useActions()
  .update(model)
  .catch(() => undefined);
if (manager.useMeta().hasErrors.value) renderYourOwnError();
```

This is a deliberate, kept divergence: the data layer this module was converted from already confirms exactly these two row mutations with a message, and dropping that on conversion would have been a silent loss of a real, user-visible behaviour. It is not carried to the editor half, which raises nothing and expects the caller to render its own feedback from state.

> **🧪 For Testers:** A consumer that shows nothing after a failed editor save has not lost the error — it has not rendered `useContext().errors`. A consumer that shows nothing after a failed `remove()` or `setDefault()`, by contrast, has a real bug: this module raised the message and something ate it.

## 7. `ensure()` matches by `id` only — never by address value

Find-or-create on this collection (and the editor's own create path, which calls the same function under the hood) checks **only** whether the model carries an `id` already present in the loaded collection. It does **not** compare address lines, city, postcode or country against existing rows.

```ts
// ⚠️ This ALWAYS creates a new row, even if an identical address already exists —
// there is no id to match on.
await addresses.useActions().ensure({
  address: {
    address1: "1 Prover Street",
    city: "Guildford",
    postcode: "GU4 8PH",
    countryId: "…"
  }
});

// ✅ This resolves the EXISTING row, because the id matches one already loaded.
await addresses.useActions().ensure({ id: existingAddressId, address: { /* … */ } });
```

A brand-new draft opened through `.fresh()` never carries an id, which is exactly why a `.fresh()` save always creates rather than ever silently resolving to an existing address.

> **🧪 For Testers:** A read-back asserting `ensure()` de-duplicates two calls with the same address lines but no `id` will fail — both calls create. This module's find-or-create is an id lookup, not a value-based duplicate check; do not port a value-matching assumption from a different collection onto this one without checking its own `ensure` first.

## 8. A country change clears the region differently depending on whether the address is new

Picking a country whose region list does not contain the currently-selected region clears the region in the model. How that clearance reaches the wire depends on which save path it takes:

| Path                                         | Wire shape                                    |
| ---------------------------------------------- | ------------------------------------------------ |
| **Edit** of an address that previously had a region | `region_id: null` — an explicit clearance         |
| **Create** of a brand-new address with no region chosen | No `region_id` key at all — never sent            |

```ts
// Editing an address that HAD a region, then changing the country:
// PUT body includes "region_id": null

// Creating a fresh address with no region ever picked:
// POST body has no "region_id" key
```

The reason for the asymmetry: an edit's body is a **diff** against the form-open snapshot — if `region_id` were simply omitted rather than sent as `null`, the server would keep whatever region was there before, silently mismatched against the new country. A create has no prior state to diff against, so there is nothing to clear.

> **🧪 For Testers:** Do not write a read-back that expects the same wire shape for "region cleared by a country change on an existing address" and "no region ever picked on a new one" — one is an explicit `null`, the other is an absent key. Conflating them will make a passing test look like it is asserting the wrong one is broken.

## 9. The address type can be changed on an existing address — but not chosen on create

The `type` field (Home / Office / Holiday / Company) has a form control **only when editing an existing address**. A brand-new address always saves as Home (`type: 1`); there is no control on the create form to choose anything else, and the field is not required on create.

```ts
// Creating a fresh address: `type` is not part of the visible form,
// and the saved record is always Home.
const draft = useClientAddressManager().as("client").fresh();
await draft.useActions().update({ address: { /* … */ } }); // type: 1, always

// Editing an EXISTING address: the type control appears, and a chosen
// value is sent on the wire.
const manager = useClientAddressManager().as("client").for("address", id);
await manager.useActions().update({ type: 2 /* Office */ });
```

If your integration needs to pick a category on the address a client is creating for the first time, this module does not offer a control for that — it has to be a follow-up edit.

## 10. Staff address management is not delivered here — it's tracked, not forgotten

`useClientAddresses().as('staff')` and `useClientAddressManager().as('staff')` are **compile-time errors**. Only the calling client's own `client` scope resolves.

```ts
// ⚠️ Does not compile — 'staff' is `null as never` in this module's scope matrix
useClientAddresses().as("staff");
```

The wider platform genuinely has a staff-facing surface for managing a client's addresses on their behalf: a distinct admin endpoint family, three capability gates (creating, updating, deleting a client's address on their behalf), an "acting as this client" impersonation mode, a per-client admin cache scope, and a staff-only copy-address-to-clipboard affordance. None of this is delivered here. It is recorded as an intentional, signed gap awaiting a tracked follow-up, not something silently dropped along the way.

> **🧪 For Testers:** A `.as('staff')` call is a TypeScript compile failure, not a runtime rejection — write a type-level check for it, not a runtime assertion.

## 11. `.as(SELF).for(...)` does not typecheck without a cast

Chaining `.for(...)` or `.fresh()` directly off a scope builder call that was itself built with `.as(SELF)` does not typecheck as written — the scope builder keys its available contexts off the literal actor type, not the one TypeScript has resolved by that point in the chain. This does not come up for `client-address` in normal use, because `client` — not `self` — is the actor that resolves here, but it is worth knowing if you are porting a call pattern from a sibling module that scopes on `self`.

```ts
// ⚠️ Does not typecheck as written, and is also the wrong actor for this module
useClientAddressManager().as(ScopeActorTypes.SELF).for("address", id);

// ✅ Right — this module resolves on CLIENT
useClientAddressManager().as(ScopeActorTypes.CLIENT).for("address", id);
```

This is a known, filed-not-fixed typing gap in the shared scope builder, not specific to this module — it affects every scoped-composable conversion that needs the same chain.

## 12. The brand-config request behind the country lock and region requirement may never be independently observable

The editor fetches two brand settings before it becomes usable: whether a region is required for the address's country, and whether an existing address's country can be changed at all. Both are read through a shared, cross-module brand-configuration cache. On a session where some *other* part of the app has already asked for exactly these two keys, the cache serves this module's ask with no new request — and because the cache never re-validates once it has an answer for a given key set, there is no way to force a fresh request for them either.

The capability those settings gate — the country field locking on an existing address, the region requirement being enforced — works correctly either way, because it reads whatever the cache holds. What cannot always be independently demonstrated is the dedicated wire-level request for these two keys.

```ts
// This works regardless of whether the request for these two keys is
// independently observable this session:
manager.useContext().config.value; // { "clients.settings.allow_address_update": true, … }
```

> **🧪 For Testers:** Do not write a read-back that asserts a `config/brand/values` request naming exactly this module's two keys fires on every editor open — on a session where the cache already holds them, it will not, and that is expected, not a regression.

## 13. `useClientAddressServices` is retired, not deprecated

There is no bare services import for this module's data on the public surface, and there never will be again under that name. Every consumer that used to reach for it now goes through the scoped collection instead:

```ts
// ⚠️ Gone — not deprecated, retired
import { useClientAddressServices } from "@upmind-automation/headless";
await useClientAddressServices().ensure({ address: { /* … */ } });

// ✅ Current
import { useClientAddresses, ScopeActorTypes } from "@upmind-automation/headless";
await useClientAddresses().as(ScopeActorTypes.CLIENT).useActions().ensure({
  address: { /* … */ }
});
```

Note the shape of the argument to `ensure()` — it is the model **directly**, not wrapped in a `{ model }` object.

## 14. The schema fragment functions are for composing this form into another one — not for rendering it

`useSchemaDefinitions()` and `useUischemaDefinitions()` are on the barrel, and it is tempting to reach for them to render the address form standalone. They exist for a narrower job: two other modules compose the address fields into a *larger* schema (a company form, a unified billing form) at module scope, before any editor instance exists to read from. A consumer rendering the address form on its own always reads `useClientAddressManager().useContext().schema` / `.uischema` instead — those are the schemas the editor's machine actually validates against, and the only ones a save is checked against.

```ts
// ⚠️ Wrong for a standalone address form — this is a bare fragment, not the
// schema the editor validates against
const schema = useSchemaDefinitions({ countries, regions, config });

// ✅ Right — read the editor's own context
const { schema, uischema } = manager.useContext();
```

The two fragment functions are pure — no scope, no session, no request, no reactive state — and are not, and must never become, a second route to this module's own data.

## 15. Working in this codebase's development checkout: watch the lockfile

Not a module behaviour, but worth knowing if you are developing against this module in this particular checkout: an unrelated, uninitialised git submodule elsewhere in this monorepo causes **any** invocation of this repo's primary package manager to rewrite the lockfile, dropping several hundred lines. If you hit an unexpectedly large lockfile diff after running a routine command, that is almost certainly the cause — prefer a direct package-runner invocation, or revert the lockfile, rather than committing the rewrite.
