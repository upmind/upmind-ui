# client-phone — Requirements

**Story bundle:** `docs/story-bundles/client-phone/`
**Run:** `/scoped-composable-factory`, mode `conversion`, target `packages/headless/src/modules/client-phone/`
**Variant:** `hybrid` (derived at Research — collection is TanStack-query-backed, manager is `dataManagerMachine`-backed; both ship, both are consumed)
**Cells:** `client × self` — ONE cell (operator ruling 1, 2026-08-08)
**Date:** 2026-08-08

---

## 1. The Job To Be Done

> **Let a consumer manage a client's phone numbers at full parity with legacy vue-app + current headless.**

As amended by operator ruling 1 (2026-08-08), "full parity" means:

- **full parity on the `client × self` surface** — every capability the oracle exposes for a client acting on their own phone collection survives the conversion, including the whole `useClientPhoneManager` (form) half; and
- **every staff capability the legacy oracle reveals is recorded** as a signed `Dropped-with-Linear-issue` row in `parity.yaml`, never silently omitted.

A green gate set that still amputates client-self capability is the failure mode, not a pass. The named receipt: on 2026-08-05 a `client-email` run took `variant=query` against an oracle that shipped `useClientEmailManager`, amputated the entire manager surface, and every gate stayed green.

## 2. The oracle

Per `.claude/rules/verify-parity-oracle.companion.md`, the oracle here is **legacy application + recorded acceptance**, consulted in three parts:

1. **Current headless** — `packages/headless/src/modules/client-phone/` (9 files, 1,195 LOC, **zero tests**).
2. **Legacy vue-app** — `/Users/dom/Documents/Upmind/vue-app`: `src/store/modules/data/clients/phones.ts`, `src/components/app/global/client/{clientPhonesComp,clientPhonesList,clientPhoneRow,addEditClientPhoneModal}.vue`, `src/components/app/global/fields/{clientPhoneSelect,phoneNumberField}.vue`, `src/components/app/global/baskets/basket/basketClientPhoneSelector.vue`, `src/views/{client/account,admin/clients/client}/profile/index.vue`, `src/data/status.ts:384` (`PhoneTypes`).
3. **Recorded acceptance** — none exists for phone *management*. No e2e spec asserts it; the only in-repo test touching the module (`basket-billing/unified/__tests__/unified.int.test.ts:50-54`) **mocks it**. This is why AC-30 (fixture capture) is load-bearing rather than optional.

**The new module's own tests are NOT the oracle and must not be used as one.**

## 3. Scope

### In scope

- Convert `packages/headless/src/modules/client-phone/` to the scope-based architecture (ADR-001) following `packages/headless/src/modules/client-email/` as the reference conversion.
- Both halves: `useClientPhones` (collection) and `useClientPhoneManager` (per-phone form editor).
- Two scope matrices, one services factory, one cache key, one identity seam.
- The 14 importer call sites, updated **only** to satisfy the mandatory `.as(...)` (operator ruling 3).
- A recorded-fixture corpus and the full colocated test set.
- The module docs set and a `phone` glossary term.

### Out of scope (dispositioned, not omitted)

- Every staff / admin capability — recorded as `Dropped-with-Linear-issue` rows S1–S7 in `parity.yaml` under operator sign-off 2026-08-08.
- Any edit to `client-email/`, `client-email-history/`, `client-address/`, `client-company/` beyond the narrow `.as()` lift of ruling 3.
- The `.feature` file — authored by the prover's BDD route, not by this seat.

## 4. Read-back discipline

Per `.claude/rules/verify-reality-check.companion.md`, every AC below names a literal, executable behavioural read-back. A read-back that asserts only a returned shape, a label, or the test's own setup does not count. Read-backs run within the standing 30-minute ceiling, EN / targeted specs, per ADR-021.

Because this module's only live cell is `client × self`, the identity read-back is **not** a `.for('client', id)` retarget. It is the narrower, still-mandatory pair:

> **the outbound request URL carried the session-resolved client id**, and **the request went out on the client session token**.

A read-back that asserts the response payload alone proves nothing about which client was addressed.

---

## 5. Acceptance criteria

### 5.1 The collection — `useClientPhones`

**AC-1 — List a client's own phone numbers.**
`useClientPhones().as('self').useContext().data` exposes the reactive, mapped list.
*Read-back:* the replay server records exactly one outbound `GET /clients/{sessionClientId}/phones`, carrying the client session token in `Authorization`; the recorded fixture's rows appear in `data.value` mapped through `mapPhone`.

**AC-2 — Each row carries its status and display fields.**
Every row exposes `id`, `title`, `description`, the parsed `phone` object (`number`, `nationalNumber`, `countryCallingCode`, `country`), `type`, and `meta.{isDefault, canDelete, isVerified}`.
*Read-back:* against a recorded fixture containing one default, one non-deletable and one unverified record, assert each of the three rows' `meta` triple independently — not a snapshot of the whole array.

**AC-3 — Know whether the list is loading, empty, errored, or addressable.**
`useMeta()` exposes flat `isLoading`, `isEmpty`, `hasError`, `isAvailable`.
*Read-back:* `isLoading` is true before the first fetch settles and false after; `isAvailable` is false for a session with no resolved client and true once `/self` lands; `hasError` flips on a recorded 500 fixture.

**AC-4 — Wait for the collection to be ready.**
`useActions().isReady()` resolves `true` once the first fetch settles and `false` when the session settles without an addressable client — it never hangs.
*Read-back:* a guest-floor session resolves `isReady()` to `false` within the spec timeout, with **no** outbound request recorded.

**AC-5 — Read the default phone.**
`useContext().default()` returns the row whose `meta.isDefault` is true, else `undefined`.
*Read-back:* against a fixture whose second row is the default, `default()?.id` equals that row's id; against an all-non-default fixture it is `undefined`.

**AC-6 — Look a phone up by id, and by partial mapping.**
`useContext().getOne(id)` and `.findOne(mapping)`.
*Read-back:* `getOne` returns the matching row and `undefined` for an absent id; `findOne({ phone: { number } })` resolves the row by its parsed number, with no outbound request fired.

**AC-7 — Delete a phone.**
`useActions().remove(id)`.
*Read-back:* one outbound `DELETE /clients/{sessionClientId}/phones/{id}` on the client token; a success feedback carrying `confirm.phone_removed` is raised; the module cache key is invalidated non-exact.

**AC-8 — Promote a phone to default.**
`useActions().setDefault(id)`.
*Read-back:* one outbound `PUT /clients/{sessionClientId}/phones/{id}` whose **body is exactly `{ default: true }`**; success feedback `confirm.phone_set_default`; cache invalidated.

**AC-9 — Surface a failed row mutation as state.**
A rejected `remove` / `setDefault` lands in `useContext().error` and flips `useMeta().hasError`; the layer never raises it itself.
*Read-back:* on a recorded 422 fixture, `error.value` is populated with the mapped headless error AND an error feedback carrying `error.client_phone_delete_failed` is raised — both, not one.

**AC-10 — Re-read and invalidate.**
`useActions().refresh()` forces a server re-read and **rejects** with `NotAuthenticatedError` when the scope cannot address a client; `useActions().invalidate()` marks the shared key stale.
*Read-back:* `refresh()` on an unaddressable scope rejects and fires **no** request; on an addressable scope it fires exactly one `GET`.

**AC-11 — Page through the collection.**
Paging lives at the **services** layer: `createClientPhoneServices(CLIENT).loadList({ pagination: { limit: n } })` returns a paged query whose `fetchNextPage()` / `fetchPreviousPage()` walk the offsets, with `pagination` as the reactive descriptor (carried through to `useContext().pagination`). The **collection composable is deliberately unpaginated** — `useClientPhones` opens its list with `limit: 0`, so a consumer of `useContext().data` receives their entire phone collection in one read and never needs a second page (parity row `C14`, `Absorbed-by: C1`).
*Read-back:* two recorded page fixtures against the services-layer query; the first `GET` carries `limit=2&offset=0`, `fetchNextPage()` produces `limit=2&offset=2`, and `pagination.value.total` matches the recorded envelope total.
*Recorded defect (2026-08-10, reviewer finding W4 — no code change):* `useActions()` still advertises `nextPage` / `prevPage` bound to the `limit: 0` query, so through the public surface both **always throw** `text.page_next_not_available`. No user-facing capability is lost (the consumer already holds every row), but those two members are unreachable and have no passing read-back. The merged, accepted `client-email` reference does the identical thing, so this is a property of the ratified conversion pattern, not a client-phone regression — see `parity.yaml` row `C14` `follow-up:` for the R1-vs-C14 tension this raises against the pattern.

**AC-12 — Filter the collection by free text.**
`useActions().filters.query(value)` re-issues the list request with the filter applied.
*Read-back:* the second outbound `GET` carries the filter in its query string; the pre-filter request is not re-fired.

**AC-13 — Find-or-create a phone (`ensure`).**
`useActions().ensure(model)` resolves an existing row when one matches, else creates one — the cross-module seam `client-company` and `basket-billing/unified` depend on.
*Read-back:* with a matching row already in the recorded list, `ensure` fires **no** `POST`; with no match it fires exactly one `POST /clients/{id}/phones` and resolves the mapped created row.

**AC-14 — Destroy the scoped instance.**
`useActions().destroy()` removes the registry entry so the next `.as()` mints a fresh collection.
*Read-back:* the scope registry size decreases by one, and the handle obtained after `destroy()` is not reference-equal to the one before.

**AC-15 — Unauthenticated access never reaches the wire.**
Every request-issuing member is gated on the module's ONE addressability predicate.
*Read-back:* with no session, the list query never fires and each mutation rejects with `NotAuthenticatedError`; the replay server records zero requests.

### 5.2 The manager — `useClientPhoneManager`

**AC-16 — The manager exists on the public surface.**
The barrel exports `useClientPhoneManager` and `UseClientPhoneManager` alongside the collection.
*Read-back:* the runtime surface test enumerates the barrel's value exports and the `manager-amputation.must-fail.patch` (which deletes the manager export block) lands **RED**. This is the direct guard against the 2026-08-05 receipt.

**AC-17 — Open an editor on an existing phone; open a fresh draft.**
`useClientPhoneManager().as('self').for('phone', id)` edits one record; `.as('self').fresh()` mints an isolated draft.
*Read-back:* two concurrent `.fresh()` handles hold **different** scope keys and different interpreters; typing into one leaves the other's `model` untouched.

**AC-18 — Lookups resolve the country before the form is usable.**
The machine's `loadLookups` awaits `useSystem().ensureCountries()`, resolves the model's country via `getCountry`, and seeds the base model's `phone.country` from it.
*Read-back:* on a recorded countries fixture, the freshly-opened draft's `model.phone.country` equals the resolved country code and `meta.isDirty` reads **false** before a keystroke.

**AC-19 — The form's schema and uischema reach the consumer through machine context.**
`useContext().schema` / `.uischema`. The barrel exports no bare `usePhoneSchema` / `usePhoneUischema` pair.
*Read-back:* `schema.value.properties.phone.required` equals `["number","nationalNumber","countryCallingCode","country"]` and the custom AJV keyword `phone_country_code` equals the resolved country code; the surface test asserts the bare pair is absent from the barrel.

**AC-20 — Input is parsed with libphonenumber-js against the resolved country.**
`useActions().input(model)` resolves the parsed model; the parse fills `number`, `nationalNumber`, `countryCallingCode`, `country` with the oracle's fallback chain (parsed → prior model value → event country → context country).
*Read-back:* inputting a bare national number with a `GB` context yields `phone.number === "+44…"` and `phone.countryCallingCode === "44"`; inputting a number whose country differs from context re-resolves `country` to the new one.

**AC-21 — Invalid input is reported as field-level state, not an exception.**
A model failing the schema lands the machine in `available.invalid`, populating `useContext().validationErrors` (AJV `ErrorObject[]`) and `useMeta().isValid === false`.
*Read-back:* an unparseable number yields a non-empty `validationErrors` array whose first entry's `instancePath` names the `phone` subtree, and **no** outbound request is fired.

**AC-22 — Save a new phone.**
`useActions().update()` on a fresh draft creates via find-or-create.
*Read-back:* exactly one outbound `POST /clients/{sessionClientId}/phones` whose body is `mapIPhone(model)` — literally `{ phone: <nationalNumber>, phone_code: "+<cc>", phone_country_code: "<ISO2>" }` — on the client token.

**AC-23 — Save an edit to an existing phone.**
`useActions().update(value?)` on a `.for('phone', id)`-scoped manager updates that record; a pending debounced `input` is flushed first so the save never reads the pre-edit model.
*Read-back:* type via `input()` and call `update()` inside the debounce window; the single outbound `PUT /clients/{id}/phones/{phoneId}` body carries the **typed** value, not the pre-edit one.

**AC-24 — A settled save refreshes the collection.**
After a save settles, the manager invalidates the shared cache key through its own scoped services instance.
*Read-back:* a collection handle open across the save re-fetches exactly once after the mutation, and its `data` reflects the saved record.

**AC-25 — The manager reports its own progress.**
`useMeta()` exposes flat `isAvailable`, `isLoading`, `hasErrors`, `isValid`, `isNew`, `isDirty`, `isProcessing`, `isComplete`.
*Read-back:* each flag is asserted at the state transition that owns it — `isNew` true for `.fresh()` and false for `.for('phone', id)`; `isDirty` false on open, true after `input`, false again after `clear()`.

**AC-26 — Read the model, ids, display strings and errors.**
`useContext()` exposes `context`, `model`, `id`, `title`, `description`, `errors`, `validationErrors`, `schema`, `uischema`.
*Read-back:* `title` equals the model's `phone.number` and `description` equals the resolved country name, both read through the `useContext` state utility rather than `state.value.context`.

**AC-27 — Clear, stop, destroy, and await completion.**
`useActions().clear()`, `.stop()`, `.destroy()`, `.onDone()`.
*Read-back:* `clear()` returns the model to the base model byte-for-byte; `destroy()` both stops the interpreter and removes the registry entry (the collection's `destroy()` only does the latter).

**AC-28 — The manager waits for an addressable client instead of firing unaddressed.**
The `hasSubscription` guard holds the machine in `subscribing` until a client id exists; the late top-up watches the ONE identity seam and never clobbers an already-resolved value.
*Read-back:* constructed before `/self` lands, the machine sits in `subscribing` with zero outbound requests, then advances once the id resolves.

### 5.3 Surface, scope and visibility

**AC-29 — The barrel is the module's only public surface.**
Curated named re-exports only; no `export *`. `client-phone.services.ts`, `client-phone.mappers.ts`, `client-phone.schemas.ts` and `useClientPhoneManager.machine.ts` each carry a line-1 `@internal` marker and are imported by no other module.
*Read-back:* the surface test enumerates the barrel's runtime exports against an explicit allow-list and greps the barrel source for `export *`; `no-cross-module-imports` and `complete-layer-set` lint clean.

**AC-30 — Every integration read-back replays a genuinely recorded fixture.**
Fixtures under `__tests__/fixtures/*.json` are captured by `pnpm fixtures:generate client-phone` against real staging and PII-masked by the shared linter.
*Read-back:* `pnpm lint:fixtures` passes and `scope-based/no-hand-rolled-int-fixture` reports no `handRolled` or `vestigialReplay` finding. **Staging credentials exist at `packages/headless/.env.recording` (350 bytes, present in-tree) — "no credentials" is not available as a reason.** Fabricated-data-presented-as-recorded is cosplay (`verify-cosplay.companion.md`, 2026-08-05 receipt).

**AC-31 — Both scope matrices are declared, and non-live actors are compile-time errors.**
`CLIENT_PHONES_SCOPE_MATRIX` and `CLIENT_PHONE_SCOPE_MATRIX` set `SELF`, `STAFF` and `GUEST` to `null as never`.
*Read-back:* the surface test asserts both matrices' runtime shape; `pnpm type-check` fails on a `.as('staff')` call added to a type-check fixture.

**AC-32 — The advertised-but-absent `clientId` option is gone.**
`useClientPhoneManager` accepts no `clientId` option in any form (operator ruling 2).
*Read-back:* the surface test asserts the manager's construction signature takes no options object carrying `clientId`; a grep of the module returns no `clientId` reaching a request URL other than through `service.clientId`.

**AC-33 — Every importer compiles and behaves unchanged.**
The 14 call sites are updated only to satisfy the mandatory `.as(...)` and the four-layer destructure it forces.
*Read-back:* `pnpm type-check` passes across the workspace, and `basket-billing/unified/__tests__/unified.int.test.ts` (which mocks this module) passes unmodified in intent — its `vi.mock` factory updated only to the new seam.

**AC-34 — Every negative control lands red before it lands green.**
Each `*.must-fail.patch` this story adds is applied blind by the prover, confirmed RED against its named assertion, and reverted.
*Read-back:* a green run of the negative-control lane for every new control, per `verify-negative-controls.companion.md`; no Needs Review without it.

---

## 6. Non-goals

- No phone **verification** flow. Neither oracle has one: `IPhone.verified` is display-only, and a grep of the legacy phone store and components for `verify` returns nothing. Recorded as `NOT-SUPPORTED-IN-LEGACY-with-reason` (row L10).
- No change to `packages/headless/src/modules/query/**`, `data-manager/**`, or `scope/**`. The shared `dataManagerMachine` is protected core; a test disagreeing with it presumes the **test** wrong (`code-xstate.companion.md`).
- No new staff capability. Ruling 1.

## 7. Artefact-path redirect

`docs/sdd` in this repo is a symlink to `/Users/domdacosta/Dev/Upmind/agent-runner/docs/sdd` — another machine's path, unwritable here. This bundle therefore lives at **`docs/story-bundles/client-phone/`**, matching the live in-repo precedent `docs/story-bundles/client-email-history/`. Anything downstream that would have read `docs/sdd/client-phone/**` — including the traceability test's second path — reads `docs/story-bundles/client-phone/`. Restated in `design.md` §9 so the prover and documenter inherit it.

## 8. Traceability

Every AC above maps to at least one row in `parity.yaml`, and every capability row in `parity.yaml` maps to at least one AC. The prover's `.feature` (not authored here) carries one `@AC-n`-tagged scenario per AC, and `client-phone.traceability.test.ts` enforces the link both ways.
