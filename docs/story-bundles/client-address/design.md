# client-address — Design

> **`@graphify-citation`** — re-run at Plan (revision 2), 2026-08-14.
> `graphify query "client address scoped composable dataManagerMachine"` (BFS depth 2, **273 nodes**) returns `Address` (`client-address.types.ts:82`), `AddressModel` (`:33`), `client-address.{types,services,mappers}.ts`, `useClientAddresses.ts`, `useClientAddressManager.ts` — all in community `useModelParser` — **together with** `client-company.types.ts`, `basket-billing/unified/types.ts` and `invoices.types.ts`, which is the graph independently surfacing the cross-module coupling this design must resolve (R4, R6, R7). It also returns `.claude/skills/scoped-composable-factory/templates/hybrid/{module}.schemas.ts` and `scopedSchemas()`, i.e. the canonical hybrid template this conversion targets.
> `graphify query "ClientAddressContextTypes ClientAddressesContextTypes CLIENT_ADDRESS_SCOPE_MATRIX verifiedLevel"` → **"No matching nodes found."** The four new symbols this design mints and the one new field (`Address.verifiedLevel`, D-7) have **no existing graph node** — confirmed absent — so minting them is warranted, not a duplicate. See `graphify-out/GRAPH_REPORT.md`.

**Companion to** `requirements.md` (JTBD, rulings R1…R8, AC-1…AC-40) and `parity.yaml` (dispositions, cells, arms).
**Date:** 2026-08-14 (revision 2) · **Seat:** planner · **Branch:** `feature/client-address-scoped-conversion` @ base `bff994868`

> **Revision 2 change:** revision 1's **§9 merge-conflict note** is **deleted in full**. `feature/client-company-scoped-conversion` is merged into this base; there is no conflict to plan for, no take-theirs resolution, and no "do not pre-empt" instruction. Every design consequence drawn from it is withdrawn. Two decisions are **added** — **D-13** (the `Manage` renderer adapters) and **D-14** (feedback ownership) — both forced by facts measured on this base that revision 1 could not see.
>
> **Operator ruling R10 (2026-08-14), applied:** **D-14 is OVERTURNED — feedback stays in the module.** The relocation to the consumer is withdrawn in full; rows `F1`/`F2` revert to `Direct`/`existing`, row `C18` becomes untouched-by-necessity, task **T-23 is deleted**, and **AC-14** and **AC-40** are corrected to the module-raised behaviour. See D-14 below for the full record and its two applied knock-ons.

---

## 0. Shape

`hybrid` — two scoped composables in one module, registered under the same module name; the composable name and the scope key carry the differentiation. The target layout is the canonical hybrid template (`.claude/skills/scoped-composable-factory/templates/hybrid/`), landed identically by all three merged references.

```
packages/headless/src/modules/client-address/
├── index.ts                                  ← the ONLY public surface
├── client-address.types.ts                   ← models + BOTH scope matrices + services contract
├── client-address.services.ts                ← @internal — one factory, one identity seam
├── client-address.mappers.ts                 ← @internal (one curated barrel export: mapAddress — R6/D-5)
├── client-address.schemas.ts                 ← @public @schema-fragment (R7/D-6)
│
├── useClientAddresses.ts                     ← collection scope entry
├── useClientAddresses.actions.ts             ← minted ONCE per scope (filters live here)
├── useClientAddresses.context.ts
├── useClientAddresses.internals.ts
├── useClientAddresses.meta.ts
│
├── useClientAddressManager.ts                ← manager scope entry
├── useClientAddressManager.machine.ts        ← @internal — the TYPED config factory
├── useClientAddressManager.actions.ts        ← minted ONCE per scope (the debouncer)
├── useClientAddressManager.context.ts
├── useClientAddressManager.internals.ts
├── useClientAddressManager.meta.ts
│
├── docs/                                     ← six artifacts (Docs stage, not this one):
│                                                foundation · README · usage · architecture · gotchas · CHANGELOG
└── __tests__/
    ├── client-address.feature                ← CO-LOCATED copy; the traceability oracle
    ├── client-address.traceability.test.ts
    ├── client-address.surface.test.ts
    ├── client-address.mappers.test.ts
    ├── client-address.collection.int.test.ts
    ├── client-address.manager.int.test.ts
    ├── client-address.mutations.int.test.ts
    ├── client-address.auth-guard.int.test.ts
    ├── client-address.scope-identity.int.test.ts
    ├── client-address.lookups.int.test.ts    ← countries/regions/brand-config (Δ3; no reference precedent)
    ├── client-address.filters.int.test.ts
    ├── client-address.int-helpers.ts · client-address.fixtures.ts · setup.integration.ts
    ├── fixtures/                             ← RECORDED: {method}-{path}[-case-{case}].json
    └── *.must-fail.patch                     ← §7
```

**No `.{actor}.ts` arm files.** Armless by construction (clause 2), and the derivation in **D-8** shows nothing earns one. `client-company/__tests__` (22 files) and `client-company/docs` (6 files) are the measured shape this mirrors.

**Deleted, not ported:** `actions.ts` (its four assigners move into the typed machine-config factory) and `client-address.utils.ts` (a 1-line `// --- keep` stub). The module's top-level `README.md` is replaced by `docs/README.md`.

---

## 1. Scope matrices

Two matrices, one per composable — the composables scope on different things and cannot share one.

```ts
export enum ClientAddressesContextTypes { CLIENT = AccessRoleTypes.CLIENT }   // whose LIST
export enum ClientAddressContextTypes   { ADDRESS = "address" }               // which ROW

export const CLIENT_ADDRESSES_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]:   null as never,
  [ScopeActorTypes.STAFF]:  null as never,   // R2 — rows D1–D8
  [ScopeActorTypes.CLIENT]: ClientAddressesContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]:  null as never    // N1 — proven absent
} as const;

export const CLIENT_ADDRESS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]:   null as never,
  [ScopeActorTypes.STAFF]:  null as never,
  [ScopeActorTypes.CLIENT]: ClientAddressContextTypes.ADDRESS,
  [ScopeActorTypes.GUEST]:  null as never
} as const;
```

Identical in shape to `client-company.types.ts:57–62, 81–86` on this base. `.as('staff')` and `.as('guest')` are **compile-time errors** (AC-33, AC-34) — the honest encoding of an out-of-cell drop, not a silently-missing branch.

**Call shapes:**

```ts
useClientAddresses().as(ScopeActorTypes.CLIENT)                                                   // collection
useClientAddressManager().as(ScopeActorTypes.CLIENT).for(ClientAddressContextTypes.ADDRESS, id)   // edit
useClientAddressManager().as(ScopeActorTypes.CLIENT).fresh()                                      // create
```

---

## 2. Decisions

### D-1 — variant is `hybrid`; BOTH surfaces ship

Derived from the oracle's composable-shape inventory (`requirements.md` §2), re-confirmed at Plan against this base. A `variant=query` override from any source is a **halt**, not a narrowing: it would amputate the entire manager surface, which is the 2026-08-05 client-email failure verbatim. No `@decision` on a file — this is the run's premise.

### D-2 — the actor token is `ScopeActorTypes.CLIENT` *(R1)*

> **`@decision`** — *What:* consumers of both composables call `.as(ScopeActorTypes.CLIENT)`, not `.as(ScopeActorTypes.SELF)`.
> *Why:* `CLIENT` is a concrete actor; `SELF` is resolved at runtime before the scope factory runs (`scope.types.ts:11–16`). `client-company` — the newest merged conversion and the declared primary reference — uses `CLIENT` at its call sites.
> *Rejected:* `SELF`, as `client-email` and `client-phone` use. It works for a bare `.as(SELF)` on a collection, but `ContextsForActor` keys off the **literal** actor passed to `.as()`, and `SELF`'s matrix row is `null as never` — so `.as(SELF).for(ADDRESS, id)` is not statically exposed. That is hazard **Z3**, and the manager is per-entity and genuinely needs `.for()`.
> *Consequence:* Z3 **dissolves**. No cast, no `ScopeBuilderActorWithContexts` reconstruction, no edit to `scope.builder.ts` (protected core, NFR-4). Measured proof on this base: `TabPersonal.vue:100–117` carries the hand-rolled reconstruction + cast **because phones use `SELF`**, while `TabBusiness.vue:204–207` writes `.as(ScopeActorTypes.CLIENT).for(ClientCompanyContextTypes.COMPANY, id)` **with no cast at all**. The prior run's standing Z3 workaround is therefore unnecessary and is **not** implemented.
> *Divergence from the exemplar:* `client-email`'s own JSDoc documents `.as('self').for('email', id)` — a pattern that does not compile. Ours documents the form that does. The exemplar is one worked example of the rules, not a match target.

### D-3 — the identity seam

One `resolveClientId(scopeContext)` in `client-address.services.ts`, comparing the **resolved scope context**, session-self as fallback (pattern: `client-email.services.ts:63–80`). Every request-issuing function goes through it. The manager seeds its machine context **from that seam**, never from `activeUser`, with a one-shot late top-up whose `refreshContext` keeps an already-resolved value.

This is precisely what the module lacks today. `useClientAddressManager.ts:44–61` accepts a `clientId` and threads it into machine context, while `loadList` (`services.ts:43,49`), `add` (`:134,141`), `update` (`:150,159`), `remove` (`:196,200`) and `setDefault` (`:229,233`) each independently re-read the session. **The caller-supplied `clientId` never reaches a URL.** That is FE-2824 live in the module being converted. Proven by AC-30 and AC-2, whose read-backs assert the request URL **and** the auth identity transport — never a response payload.

The cosmetic `clientId` parameter is **removed** from the manager's signature (prior ruling PR-2, carried forward unchanged): a parameter that claims retargeting and does not retarget is cosplay; the honest surface is no parameter, plus the drop rows saying the capability is owed (`D1`).

### D-4 — `default()` returns the ID *(R5)*

> **`@decision`** — *What:* `useClientAddresses().as(CLIENT).useContext().default` returns `Address["id"] | undefined`, not `Address | undefined`. Implemented exactly as `client-company` does (`useClientCompanies.context.ts:40–41, 69`):
> ```ts
> function getDefaultId() { return getDefault()?.id; }
> // ...
> default: getDefaultId,
> ```
> *Why:* operator ruling R5, on the merged `client-company` precedent, where callers use the value directly as `setDefault`/lookup input and the migrated app code reads `getCompany(defaultCompany())` (`apps/cart/src/router/funnels/engine/services.ts:152`).
> *Rejected:* `default: getDefault` (the row), as **both other** merged references do — `client-phone/useClientPhones.context.ts:90` and `client-email/useClientEmails.context.ts:51`. Rejected because the ruling binds; recorded because the tranche is now internally inconsistent — two merged modules return the row, this one and `client-company` return the id.
> *Consequence — the single highest-risk item in the story.* Ten in-scope expressions read `defaultAddress()?.id` (`requirements.md` R5 table). After this change `defaultAddress()` **is** the id and `?.id` yields `undefined`. **This still type-checks at every site** — `string | undefined` flows into an `addressId` field exactly as `Address | undefined ?. id` did. A green `type-check` is **necessary but not sufficient**; every consumer task carries its own behavioural Reality Check (AC-37).
> *Not a JTBD contradiction:* an id is losslessly convertible to the row via `getOne`. No capability is lost. Raised to the operator as a cross-module inconsistency, not as a blocker.

### D-5 — `mapAddress` stays on the barrel *(R6)*

> **`@decision`** — *What:* `client-address.mappers.ts` takes the line-1 `/** @internal */` marker; `index.ts` keeps **one** curated named export, `mapAddress`. `invoices/` is not edited.
> *Why:* cross-module mapper exports are the live in-tree pattern — `currency/index.ts:2`, `client-custom-fields/index.ts:3`, `invoices/index.ts:3`, and `client/index.ts` re-exports `mapClient`. Decisively, `invoices/invoices.mappers.ts:5` imports `mapAddress` from the barrel alongside `mapClient` and `mapCurrency`; singling out one of three would invent a rule the repo does not have.
> *Rejected:* (a) a new `@public @model-mapper` carve-out class — invents a second convention for a case the repo already covers; (b) a `@deprecated` re-export — "deprecated" implies a sunset path and there is none, since an invoice's *embedded* address is never fetched by this module and has no composable seam to route through; (c) duplicating the transform into `invoices` — two divergent copies of the address shape.
> *Note:* the exemplar exports no mapper because nothing outside consumed one. That is an absence of need, not a prohibition; reading it as a ban was the prior run's error (closed by PR-5, re-affirmed by R6).

### D-6 — the schema fragments stay on the barrel *(R7)*

> **`@decision`** — *What:* `client-address.schemas.ts` swaps its line-1 `/** @internal */` (present today) for `@public @schema-fragment`, and `index.ts` keeps exporting `useSchemaDefinitions` and `useUischemaDefinitions`. The **parsers** `useSchema` / `useUischema` stay module-private and reach consumers only through `useClientAddressManager().useContext().schema` / `.uischema`.
> *Why:* four cross-module call sites compose the address **definitions** into a LARGER schema at module scope, where no `useClientAddressManager` instance exists to read from machine context — `client-company.schemas.ts:134, 247` and `basket-billing/unified/schemas.ts:42, 68, 106`. The barrel's usual "schema reaches consumers via `useContext()`" route does not fit them. This is exactly the definitions/parser split `templates/ARMS.md` describes: definitions live in `useSchemaDefinitions()` / `useUischemaDefinitions()` and the parsers `$ref` them (`client-address.schemas.ts:88, 108, 240`).
> *Rejected:* following the exemplar's "NO SCHEMA EXPORTS HERE" (`client-email/index.ts:14–16`). It forces both consumers onto deep-path imports with an `eslint-disable`. **That hazard is already live in this tree for client-phone** — `basket-billing/unified/schemas.ts:7–18` carries exactly that comment and disable. Reproducing it for a second module would be adopting a workaround as a convention.
> *Precedent:* `client-company` established and merged this shape (`client-company.schemas.ts:1–28` header, `client-company/index.ts:52–58` export). Schema fragments are **pure functions of their arguments** — no scope, no session, no request, no reactive state — and must never acquire one.
> *Divergence from the exemplar is explicit and authorised.* It is not a precedent for a module without such a consumer.

**Signature note (non-breaking).** D-12's `lockCountry` needs `config` inside `useUischemaDefinitions`. All four cross-module callers pass an object literal into a `Partial<AddressContext> = {}` destructure (`{ countries, regions }`, `{ regions, countries }`), so adding an optional `config` key is **additive** and leaves every caller compiling unchanged. Verified at Plan; asserted by T-13.

### D-7 — `verified` is carried, not reshaped *(R8h)*

> **`@decision`** — *What:* `Address.meta.isVerified` **keeps** its `boolean` shape, and `Address.verifiedLevel: IAddress["verified"]` (`number | null`) is added alongside, carrying the raw datum unchanged.
> *Why:* the ruling required an explicit decision, either way, with no silent reshape. `IAddress.verified` is `number | null` (`packages/types/src/models/addresses.ts:25`); `mapAddress` coerces `!!raw.verified` (`client-address.mappers.ts:47`), which destroys the level. Every in-tree consumer reads the flag and none reads a level, so removing or narrowing the boolean would break consumers to fix a loss nobody is currently feeling.
> *Rejected:* (a) changing `meta.isVerified` to `number | null` — a breaking change to every consumer, for no consumer's benefit; (b) leaving the coercion alone — the ruling forbids carrying a known loss without recording a decision, and this *is* the recording plus the fix; (c) exposing only the level — same breakage as (a).
> *Guard against NFR-1:* `verifiedLevel` is not an advertised-but-absent member — the field exists on `IAddress`, arrives on every recorded fixture, and AC-32 reads it back at two values.

### D-8 — the arms derivation *(clause 3 of the variance law)*

Derived mechanically from the parity table. **Not** assumed from the previous run's answer, and re-derived at revision 2.

The test (`templates/ARMS.md`, "When to arm"): a layer earns an actor-specific arm when at least one actor has a member **exclusive to it** or **overriding** the shared factory. Applied per layer:

| Layer | Actors with non-empty rows | Rows examined | Verdict |
| --- | --- | --- | --- |
| `services` | `client` only | `W1`–`W12` — every wire row resolves one client through one seam, one endpoint family (`clients/{id}/addresses`) | **`none`** |
| `actions` | `client` only | `A8`–`A15`, `M11`–`M18` | **`none`** |
| `context` | `client` only | `A1`–`A7`, `M1`–`M10` | **`none`** |
| `meta` | `client` only | `A2`, `M14`–`M17` | **`none`** |
| `schemas` | `client` only | `X1`–`X8`, `L4`, `L5` | **`none`** |

All five are armless **because the derivation yields nothing** — there is exactly one live actor, so nothing can vary *by actor*. It is not "armless because the module is new", and not "armless because no exemplar exists" (`ARMS.md` explicitly forbids that reason).

**Independently corroborated by the legacy oracle.** The one plausible source of in-cell actor variation would be permission gating — and legacy's `can()` returns `true` unconditionally outside admin context (`src/store/modules/user/index.ts:23–47`, R2). In `client × self` every address permission is always true. There is no permission-shaped variation for any layer to arm on.

**The `meta` trap is checked, not assumed.** `ARMS.md` records the 2026-07-31 incident where `meta` was wrongly derived `none` because a capability flag "only gated actions". Checked here: this module has **no** per-actor capability flag at all in-cell (the four legacy gates are staff-only, rows `D3`–`D6`), so there is no gating boolean to surface as read-state. `meta: none` survives that check.

**Recorded for a future run:** if `D1` (staff acting for a named client) is ever restored, the layers that arm **first** are `services` (a second endpoint family, `api/admin/clients/{id}/addresses`, plus the acting-as identity transport) and `meta` (the four capability gates become real read-state, and `ARMS.md` requires arming `actions` **and** `meta` from one computed source). `context` and `schemas` would still not arm — the row shape and the form are identical for both actors. Filed so a future run has it rather than re-deriving it.

The developer seat re-derives this independently. **A mismatch halts the run.**

### D-9 — the typed machine-config factory

`useClientAddressManager.machine.ts` exports one `createClientAddressMachineConfig(service): Parameters<typeof dataManagerMachine.withConfig>[0]`. It replaces today's three untyped hooks cast `as any` at the `interpret(...)` call site (`useClientAddressManager.ts:56–58`) and absorbs `actions.ts`. This is what retires the 11 grandfathered `no-explicit-any` suppressions (`eslint-suppressions.json:477–486`) — they are **removed**, not re-ledgered.

**Δ from the reference (genuine — no worked example exists).** `client-email`'s `setSchemas` is static: its `useSchema()` / `useUischema()` take no arguments. This module's schemas are **context-derived** — `useSchema(context)` / `useUischema(context)` consume `countries`, `regions`, `config` and `id` (`client-address.schemas.ts:77–83, 233–237`). The typed factory must keep them context-dependent. **Expect design, not transcription.**

### D-10 — bounded readiness *(R8f)*

Two unbounded waits are replaced with the merged bounded pattern. The current best form on this base is `client-company/useClientCompanies.actions.ts:92–96`:

```ts
async function isReady(): Promise<boolean> {
  if (!(await whenSessionSettles())) return false;
  return whenListFetched();
}
```

| Today | Replacement |
| --- | --- |
| `useClientAddresses.ts:42–51` — hand-rolled `setInterval(…, 100)`, no cap, no `clearInterval` on the never-fetched path, no rejection path | `whenSessionSettles()` → `whenListFetched()` (AC-4) |
| `useClientAddressManager.ts:90–93` — `waitFor(…, { timeout: Infinity })` | a bounded `waitFor` whose expiry is a catchable `DetailedError` (AC-26) |

**Divergence from the exemplar, surfaced:** `client-email` still uses `timeout: Infinity`. This module bounds it because — unlike client-email — it awaits `useSystem` / `useBrand` readiness in `loadLookups` (Δ3), which is hazard **Z2**'s exact pairing: both of those `isReady()`s poll uncapped intervals gated on leaked query singletons. Copying the exemplar here would import a defect it is not exposed to. The **shared** `useSystem` / `useBrand` polls are protected-adjacent and are **not** touched (NFR-4) — this run contains the hazard at its own boundary, exactly as `client-phone` did.

### D-11 — `findOne` is contained locally *(hazard Z1)*

`useCollection().findOne` compares each mapped top-level key with a strict `isEqual`, so a nested partial never matches — and `AddressModel.address` is a nested object. `findOne({ address: { city } })` returns `undefined`, always, today, while the public JSDoc claims it matches "against the title and description" (`useClientAddresses.ts:143–145`) — which is also false.

**Contained locally**, mirroring `client-phone/useClientPhones.context.ts:49–68`: deep-partial-match nested plain-object values in the module's own `findOne` wrapper. The shared helper is used by six modules and is **outside this run's blast radius**; a source fix needs its own authorisation. AC-7 reads it back and is a **pre-change RED**.

### D-12 — the parity fixes, as design *(R8a–R8e)*

**The guard fix is a request-ABSENCE assertion.** `client-address.services.ts:203` and `:236`:

```ts
if (isAuthenticated.value || !clientId.value) { resolve(true); } else { reject(new NotAuthenticatedError()); }
```

An unauthenticated session with **no** client id satisfies the right-hand limb, the guard resolves `true`, and the request goes out at `clients/undefined/addresses/{id}`. The correct form is `&&` with a positive `!!clientId`, as the three correct siblings already do (`:54`, `:137`, `:153`). **The read-back must assert the request was never issued** (AC-11, AC-13). Asserting that a rejection surfaced does not discriminate: today's inverted guard resolves and the call fails *downstream*, so a rejection-shaped assertion passes both before and after the fix. That is the difference between grading structure and grading capability.

**`description` is a field-set-and-order fix, not a formatting one.** Today: `address_2, street, city, postcode, region.name, country.name` (`client-address.mappers.ts:20–29`), where `street` is not on `IAddress` at all. Target, from `UAddress.vue:88–98`: `address_1, address_2, city, state, postcode, region.name, country.name`. The join separator stays the headless `", "` — legacy's `",\n"` is presentation of the legacy card and is **not** the parity claim (AC-31 says so explicitly, so a later reader cannot read the difference as an oversight).

**Diff-only update is a request-body shape.** Legacy computes `omitBy(form, (v, k) => formClone[k] === v)` (`addEditClientAddressModal.vue:220–224`) against a clone taken at open. The manager must hold the same clone and send only the delta (AC-23). The `default: true` write path (`setDefault`) is already single-key and is unaffected.

**`lockCountry` moves as a PAIR.** `ARMS.md`'s standing law: "the schemas layer moves as a PAIR". Implementing `lockCountry` touches only the **uischema** side (the country control at `client-address.schemas.ts:149–155` gains a disabled/read-only rule when `id && config[CLIENT_ALLOW_ADDRESS_UPDATE] === false`); the schema side is deliberately **unchanged**, because a locked field is still a required, valid field — the pair law forbids adding a schema field with no control, not adding a control rule with no schema change. Stated so a reviewer does not read the one-sided edit as a pair violation. `loadLookups` (`client-address.services.ts:92–95`) gains `CLIENT_ALLOW_ADDRESS_UPDATE` to its `ensureConfig` key list.

**Address `type` DOES move as a pair.** Restoring it (AC-22) requires **both**: un-commenting the schema property (`client-address.schemas.ts:110–121`) **and** adding a matching `Control` to the uischema, **and** removing the `type: 1` hardcode from `mapIAddressData` (`client-address.mappers.ts:62`). Schema without control ships a required-but-invisible input; control without the mapper change ships a select whose value is discarded on the wire. All three, or none.

### D-13 — the `Manage` renderer adapters *(new at revision 2)*

> **`@decision`** — *What:* each of the four `useList: useClientAddresses, useMutate: useClientAddressManager` value-pass sites gains a **local adapter pair** that resolves `.as(ScopeActorTypes.CLIENT)` and flattens the four-layer return into the flat `MinimalListComposable` / `MinimalMutateComposable` shape. The shared renderer (`packages/client-vue/src/components/manage/**`) is **not** changed.
> *Why:* `Manage.vue:106` calls `props.manage.useList()` **bare**, and `:155`/`:161` call `.remove` / `.setDefault` on its return. A scope builder has none of those members. The four sites are `TabPersonal.vue:24–25`, `client-company.schemas.ts:256–257`, `playgrounds/labs/src/pages/client/Addresses.vue:8–9` and `playgrounds/labs/…/ClientBillingAddresses.vue:14–15`.
> *Rejected:* (a) teaching `Manage.vue` to accept a scope builder — that changes a shared renderer consumed by companies, emails and phones, for one module's convenience; (b) keeping a flat compatibility export on the barrel — a second public surface, which is exactly what R4 retires.
> *Precedent, measured and merged:* `client-company` wrote `useCompanyList`/`useCompanyMutate` (`TabBusiness.vue:172–248`), `client-phone` wrote `usePhoneListForManage`/`usePhoneManagerForManage` (`TabPersonal.vue:163–200`), `client-email` wrote `useEmailListForManage`/`useEmailManagerForManage` (`labs/…/ClientEmails.vue:104–150`). Three merged conversions, one shape.
> *Two obligations the adapter carries, both otherwise silent:*
> 1. **`default` re-hydrates.** `Select.vue:97` reads `defaultItem()?.id`. Under D-4 the module's `default()` is the **id**, so the adapter returns `default: () => getAddress(defaultAddressId())` — the **row** — keeping the renderer contract intact. Addresses currently render via `List.vue`, which destructures `default: _defaultItem` and never calls it (`:103`), so this is latent today and live the moment any site sets `as="select"`. Fixed at the adapter regardless.
> 2. **`stop` maps to `destroy`.** `Form.vue` calls `stop()` on close and `onUnmounted`; without the mapping every opened address leaves a permanent registry entry holding a live TanStack observer, exactly as `TabBusiness.vue:242–246` documents for companies.
>
> *The compiler cannot help here.* `MinimalListComposable = (...args: any) => …` (`manage/types.ts:15`), and all four value-pass sites sit inside objects cast `as any`. Handing the renderer an unadapted scope builder **compiles cleanly and fails at runtime**. AC-39 is therefore a rendered read-back, never a type-check.

### D-14 — feedback STAYS IN THE MODULE *(revision 2's decision OVERTURNED by operator ruling R10)*

> **Status: OVERTURNED.** Revision 2 decided to strip `useFeedback` from `client-address.services.ts` and hand each consumer the obligation, following the merged `client-company` precedent, and flagged it as the decision most worth an operator overturn. **Operator ruling R10 (2026-08-14) overturned it.** The relocation is withdrawn in full — not softened, not partially applied.

> **`@decision`** — *What:* `client-address.services.ts` **keeps** its `useFeedback` import and all four raises, unchanged: `onError → addError({ title: t("error.client_address_update_failed"), … })` at `:210` and `onSuccess → addSuccess(t("confirm.address_removed"))` at `:220` on `remove`; `onError → addError({ title: t("error.client_address_set_default_failed"), … })` at `:244` and `onSuccess → addSuccess(t("confirm.address_set_default"))` at `:254` on `setDefault`. **No consumer acquires a feedback obligation.** No i18n key moves, is added, or is deleted.
>
> *Why (operator ruling R10, its three reasons in priority order):*
> 1. **Parity is the JTBD.** Both oracles raise this feedback. Headless raises it today; legacy raises it too — `store/modules/data/clients/addresses.ts:134–186` (`confirmDelete` → `$toast.open({ message: i18n.t("_sentence.confirm.removal") })`) and `:187–216` (`makeDefault` → `$toast.open({ message: i18n.t("_.default_address_updated") })`), with `ToastProgrammatic` imported for exactly that. Moving the raise is a behaviour change measured against **both** oracles, and "full parity with legacy vue-app + current headless" does not license it.
> 2. **It is a silent-regression shape.** If any one of the eight consumer files failed to add toast handling, the user-visible feedback would simply disappear — **no type error, no failing test** — and it would land across eight files at once. That is the advertised-but-absent defect class inverted, and this story exists to close that class, not to open it.
> 3. **`client-phone` — equally merged — still raises its own** (`client-phone.services.ts:303–350`). The tranche is split on this, and the parity-preserving side is also the side that costs nothing.
>
> *Rejected:* relocating the raise to the consumer, as `client-company` did (`docs/CHANGELOG.md:91–93`, `gotchas.md:410`, discharged at `TabBusiness.vue:170–199`). The argument for it — that a data module reaching into a UI notification store couples the exercised path to a surface it does not own — is real but is outweighed by (1) and (2).
>
> *This is a deliberate divergence from the `client-company` primary reference, and the rationale is general:* **a placement choice does not inherit from a reference when the reference's own placement is itself a behaviour change against the oracle.** "Primary reference" settles shape, naming and layering; it does not settle a question the oracle already answers. Where the reference diverges from the oracle, the oracle wins — that is what `verify-parity-oracle.md` means by grading against an external source rather than against the newest sibling.
>
> *Consequence — nothing moves.* Rows `F1` / `F2` are dispositioned **`Direct` / `existing`**, not `Absorbed-by`. Row `C18` becomes **`Not-supported-with-reason` / untouched-by-necessity**: measured at Plan, all four keys the module cites already exist in **all 28 locales** (`confirm.address_removed`, `confirm.address_set_default`, `error.client_address_update_failed`, `error.client_address_set_default_failed`), so there is no i18n work at all. **Task T-23 is deleted** (tombstoned in `tasks.md`, numbering left stable). AC-40 now reads the message back **at the module**, which is a stronger and cheaper read-back than the consumer-side one it replaces.
>
> *Knock-on to D-13, applied:* the `Manage` adapters wrap `remove` / `setDefault` **without** adding toasts — the module already raises them, and a consumer-side raise on top would double every message. The adapters' remaining obligations are unchanged: `default` re-hydrates to a row, and `stop` maps to `destroy`.
>
> *Knock-on to AC-14, applied:* revision 2's AC-14 asserted the failure lands in `useContext().error`. **Measured at Plan, that is not this module's contract** — `useClientAddresses.ts:60` exposes `query.error`, the **list** query's error, while `remove` / `setDefault` failures are reported through the feedback raise at `:210` / `:244`. AC-14 is corrected to assert the real, oracle-matching behaviour rather than a contract the module does not have and R10 did not ask for.

---

## 3. Public surface (the barrel)

```ts
// Composables
export { useClientAddresses, type UseClientAddresses } from "./useClientAddresses";
export { useClientAddressManager, type UseClientAddressManager } from "./useClientAddressManager";

// Scope matrices — one per composable, both public
export { CLIENT_ADDRESSES_SCOPE_MATRIX, ClientAddressesContextTypes,
         CLIENT_ADDRESS_SCOPE_MATRIX,   ClientAddressContextTypes,
         AddressTypes, ADDRESS_TYPE_KEYS } from "./client-address.types";
export type { ClientAddressesScopeMatrix, ClientAddressScopeMatrix } from "./client-address.types";

// Public model types
export type { Address, AddressModel, AddressContext } from "./client-address.types";

// Curated mapper export (R6 / D-5)
export { mapAddress } from "./client-address.mappers";

// Schema-FRAGMENT surface (R7 / D-6) — the ONE deviation from the exemplar's no-schema-exports law.
// The PARSERS (useSchema / useUischema) stay internal — reached via useContext().schema/.uischema.
export { useSchemaDefinitions, useUischemaDefinitions } from "./client-address.schemas";

// Sub-composable types — collection
export type { UseClientAddressesActions } from "./useClientAddresses.actions";
export type { UseClientAddressesContext } from "./useClientAddresses.context";
export type { UseClientAddressesMeta } from "./useClientAddresses.meta";
export type { UseClientAddressesInternals } from "./useClientAddresses.internals";
// Sub-composable types — manager
export type { UseClientAddressManagerActions } from "./useClientAddressManager.actions";
export type { UseClientAddressManagerContext } from "./useClientAddressManager.context";
export type { UseClientAddressManagerMeta } from "./useClientAddressManager.meta";
export type { UseClientAddressManagerInternals } from "./useClientAddressManager.internals";
```

**No `export *`** — today's barrel is three `export *` lines (`index.ts:1–3`); all three go.
**Gone from the barrel:** `useClientAddressServices` (R4 — retired, not deprecated; supersedes PR-1).
`AddressTypes` / `ADDRESS_TYPE_KEYS` stay **only because** the `type` control becomes live (R8e / AC-22) — otherwise they would be exactly the advertised-but-absent members NFR-1 forbids.
AC-35 pins the export set exactly; AC-36 pins reachability.

**Type-only consumers that keep working, verified at Plan (row `C19`):** `modules/index.ts:12`, `system-places.types.ts:1`, `unified/types.ts:1`, `client-company.types.ts:30`, `invoices.types.ts:4` (a pre-existing **deep** import of `client-address.types` — left alone, not widened).

---

## 4. Data flow

**Collection.** `useClientAddresses().as(CLIENT)` → `createClientAddressesForScope(config, scopeKey)` → one `createClientAddressServices(actor, config.context)` instance → **one** `service.loadList({ pagination: { limit: 0 } })` minted at construction (never inside a layer factory — that mints a second query with its own refs, key and effect scope) → four lazy layers over that one query and that one service.

**Manager.** `useClientAddressManager().as(CLIENT).for(ADDRESS, id)` → one services instance from the same seam → `interpret(dataManagerMachine.withConfig(createClientAddressMachineConfig(service)).withContext({ id, model, allowMultipleEdits: true }))`, keyed by **scope key**, not entity id → four lazy layers.

**Save → list.** A manager save invalidates `service.queryKey`; the collection's query refetches; `data` updates without a consumer-side refresh (AC-15).

**Lookups (Δ3 — no reference precedent).** `loadLookups` awaits `useSystem().isReady()` → `ensureCountries()` → `getCountry(model.address.countryId)` → `fetchRegions(...)` → `useBrand().ensureConfig([REQUIRE_REGION_IN_ADDRESS, CLIENT_ALLOW_ADDRESS_UPDATE])` (the second key is new — R8d), then seeds the base model and parses it against the schema.

**Dependent fields (Δ4).** `parse` implements the country → region rule: fall back to the default country when unset/invalid; refetch regions when the country changed; **null `regionId` when it is not in the new country's list**. It survives as a named, read-backable behaviour (AC-19), not an implementation detail.

**Consumer edge (D-13).** `Manage.vue` → adapter → `.as(CLIENT)` → the same registry instance the surrounding component already resolved (scoped composables are singletons per scope key, so no adapter mints a second collection).

---

## 5. Endpoints

| Operation | Request | Rows |
| --- | --- | --- |
| list | `GET clients/{resolvedClientId}/addresses?with=region,country` | `W1` |
| create | `POST clients/{resolvedClientId}/addresses` | `W4` |
| update | `PUT clients/{resolvedClientId}/addresses/{id}` — **diff-only body** (R8c) | `W5`, `L3` |
| set default | `PUT clients/{resolvedClientId}/addresses/{id}` body `{ default: true }` | `W6` |
| remove | `DELETE clients/{resolvedClientId}/addresses/{id}` | `W7` |
| lookups | countries / regions / brand-config (`REQUIRE_REGION_IN_ADDRESS`, `CLIENT_ALLOW_ADDRESS_UPDATE`) | `W9`–`W11` |

`{resolvedClientId}` comes from **D-3's seam** — never from a call-site read of the session. **No `with_staged_imports` param** (R8g, row `N2`).

---

## 6. Hazards — position taken on each

| # | Hazard | Position |
| --- | --- | --- |
| Z1 | `useCollection().findOne` cannot match a nested partial | **Contain locally** (D-11). Shared helper untouched. |
| Z2 | Uncapped readiness polling stalls dataManager editors | **Bound at this module's boundary** (D-10). Shared `useSystem`/`useBrand` polls untouched. |
| Z3 | `.as(SELF).for(...)` does not typecheck | **Dissolved by R1 / D-2.** No workaround implemented. Measured proof: `TabPersonal.vue:100–117` (cast, `SELF`) vs `TabBusiness.vue:204–207` (no cast, `CLIENT`). |
| Z4 | `client-address.utils.ts` is a dead 1-line stub | **Delete, don't port.** |
| Z5 | A prior conversion left a stale consumer (`labs/.../ClientEmails.vue:41`) | **A precedent of record, not to copy.** R3 migrates every in-scope site; §6.2 enumerates the derived ones. |
| Z6 | `IAddress` has no `staged_import` field | **Nothing is built.** Row `N2`, R8g. Inventing `meta.isStaged` would be the NFR-1 defect verbatim. |
| **Z7** | **`as any` at the `Manage` value-pass sites hides a runtime break** | **New at revision 2.** Adapters (D-13) + a **rendered** read-back (AC-39). A type-check proves nothing here. |
| **Z8** | **A prior conversion left `useClientPhones` / `useClientPhoneManager` passed raw into `Manage` at `client-company.schemas.ts:286–287`, inside an `as any`** | **Observed and recorded, NOT fixed here.** It is a client-phone/client-company defect of the same class as Z7, outside this story's scope. Filed to `review-notes.md` §5 so it is not lost; fixing it needs its own authorisation. |

---

## 7. Negative controls

One `*.must-fail.patch` per predicate limb — a unified diff mutating **production** source that must flip a named colocated assertion RED.

| Patch | Mutates | Must flip RED |
| --- | --- | --- |
| `client-address.auth-guard.must-fail.patch` | restores the inverted `\|\|` at the remove guard | AC-11 |
| `client-address.default-guard.must-fail.patch` | restores the inverted `\|\|` at the setDefault guard | AC-13 |
| `client-address.client-id-limb.must-fail.patch` | drops the `!!clientId` limb from the list guard | AC-3 |
| `client-address.scope-identity.must-fail.patch` | makes a request re-read the session instead of the seam | AC-30, AC-2 |
| `client-address.manager-amputation.must-fail.patch` | removes the manager's `update` path | AC-23, AC-24 |
| `client-address.default-id.must-fail.patch` | reverts `getDefaultId` to `getDefault` | AC-5 |
| `client-address.diff-payload.must-fail.patch` | sends the full model on update | AC-23 |
| `client-address.description-order.must-fail.patch` | drops `state` from the description join | AC-31 |
| `client-address.lock-country.must-fail.patch` | ignores `CLIENT_ALLOW_ADDRESS_UPDATE` | AC-21 |
| `client-address.address-type.must-fail.patch` | restores the `type: 1` hardcode in `mapIAddressData` | AC-22 |
| `client-address.readiness-bound.must-fail.patch` | restores `timeout: Infinity` | AC-26 |
| `client-address.feedback.must-fail.patch` | drops the `onSuccess` feedback raise from `remove` **(added by R10)** | AC-40 |
| `client-address.find-one.must-fail.patch` | delegates `findOne` straight to the shared helper | AC-7 |

**Per `agent-seat-separation.companion.md`: the developer authors every patch** (it knows the line it changed; a code mutation neither self-certifies nor grades anything); **the prover applies it blind**, confirms the intended assertion goes RED, then reverts. A prover that reads module src to hand-author one has breached diff-blindness — route it to the developer instead. Every control runs green in the `quarantine:enforce` lane before the story reaches **Needs Review** (NFR-7).

---

## 8. Test layers (ADR-021)

- **Unit** — `mappers.test.ts` (AC-31, AC-32), `surface.test.ts` (AC-33…AC-36), `traceability.test.ts`.
- **Integration** (the bulk) — collection / manager / mutations / auth-guard / scope-identity / lookups / filters, over **recorded** fixtures captured with `pnpm --filter @upmind-automation/headless test:integration:record` (NFR-3; `scope-based/no-hand-rolled-int-fixture` is `error`).
- **Component-level read-back** — AC-39 is a **rendered** read-back through the shared `Manage` renderer; it is not satisfiable by a type-check (Z7).
- **AC-40 is an integration read-back at the module**, not a consumer one (D-14 under R10): a forced success and a forced 422 on `remove` / `setDefault` each land exactly one entry of the expected kind in the feedback store, raised by `client-address.services.ts` itself.
- **E2E** — the existing specs seeded by `address-setup.ts` (AC-38); no new spec.

The co-located `__tests__/client-address.feature` is the single source of truth `client-address.traceability.test.ts` reads and enforces **both ways**: a non-`@todo` scenario with no proving test fails, and a test naming an AC the feature does not tag fails. Nothing in the suite reads a planning artefact — SDD material is not a deliverable, is not in the change request, and is absent from a fresh clone and from CI.
