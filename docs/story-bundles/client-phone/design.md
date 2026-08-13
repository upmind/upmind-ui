# client-phone — Design

**Companion to:** [`requirements.md`](./requirements.md) · [`parity.yaml`](./parity.yaml) · [`tasks.md`](./tasks.md)
**Reference conversion:** `packages/headless/src/modules/client-email/` — **read-only, never modified**
**Variant:** `hybrid` · **Cells:** `client × self` (ruling 1) · **Date:** 2026-08-08

---

## 0. Knowledge-graph scout (filed citation, U12)

Queried before any type below was minted — `graphify query "client phone"` against `graphify-out/` (BFS depth 2, 303 nodes), plus `graphify-out/GRAPH_REPORT.md` for community structure. What the graph established, and what each fact changed in this design:

| Graph fact (node → `src` → `community`) | Consequence here |
| --- | --- |
| `Phone` → `client-phone/client-phone.types.ts:66` → community **8**; `PhoneModel` → same file `:28` → **8**; `PhoneContext` → `:113` → **8**; `IPhoneData` → `:9` → **21** | The public model types already live in `client-phone.types.ts`. §3 **adds** matrices and context enums to that existing file rather than minting a new types module. `IPhoneData` sitting in community 21 (the account cluster) is why it stays exported — `account.types.ts:14` consumes it. |
| `useClientPhoneManager.ts` → community **2**, alongside `data-manager.types.ts` / `DataManagerContext` | Confirms the manager is machine-cluster, not query-cluster — the hybrid derivation, and why §2 gives it a `.machine.ts` and the collection none. |
| `useClientPhones.ts`, `client-phone.services.ts`, `client-phone.schemas.ts`, `mapper.ts`, `actions.ts` → community **8** | The query/data half is one cohesive unit; §5's single services factory does not cut across a community boundary. |
| `IPhone` → `packages/types/src/models/phones.ts:5` → community **7** (shared wire types) | The wire contract is owned outside this module. No new wire type is minted here; `client-phone.types.ts` declares only headless-side models. |
| `client-company.services.ts`, `basket-billing/unified/{services,schemas,types}.ts` → community **8** — same community as `client-phone` | The cross-module `ensure` seam (§6) is an intra-community edge, which is why ruling 3's narrow `.as()` lift is sufficient and no re-architecture is implied. |
| `UseActiveSession` → `session-store/useActiveSession.ts:56` → community **8**; `useQuery()` → `query/useQuery.ts:67` → community **18** | Identity (§4) and transport are separate communities; §4's rule that only `client-phone.services.ts` reads `activeUser` keeps that separation intact. |

New enums minted below (`ClientPhonesContextTypes`, `ClientPhoneContextTypes`) have **no** existing graph node — confirmed absent from the 303-node traversal — so they are genuinely new, not duplicates of an existing symbol. Their naming follows the reference's `ClientEmailsContextTypes` / `ClientEmailContextTypes` pair.

---

## 1. Shape of the conversion

`client-phone` today is a pre-scope module: two composables invoked bare (`useClientPhones()`, `useClientPhoneManager(id, opts)`), a services module exported from the barrel, `export *` twice, and every request URL built from `useActiveSession().useContext().activeUser`. The conversion makes both composables scoped per ADR-001 and moves the module onto the reference's uniform four-layer shape.

Two composables, one module name, two scope keys — exactly the reference's arrangement:

| | Collection | Manager |
| --- | --- | --- |
| composable | `useClientPhones` | `useClientPhoneManager` |
| engine | TanStack list query | shared `dataManagerMachine` |
| scope context | `client` — *whose* list | `phone` — *which* record |
| minted once per scope | the query + the actions factory | the interpreter + the actions factory |
| registry name | `"client-phone"` | `"client-phone"` |

Both return the identical four-layer handle `{ useActions, useContext, useInternals, useMeta }` (variance-law clause 1, enforced by `scope-based/complete-layer-set`).

## 2. Target file layout

```
packages/headless/src/modules/client-phone/
├── index.ts                              curated named re-exports ONLY — no `export *`
├── client-phone.types.ts                 two scope matrices + context enums + models + service interfaces
├── client-phone.services.ts              @internal — the ONE services factory both halves consume
├── client-phone.mappers.ts               @internal — renamed from mapper.ts
├── client-phone.schemas.ts               @internal — NOT exported from the barrel
├── useClientPhones.ts                    collection entry — createScopedComposable("client-phone", …)
├── useClientPhones.actions.ts
├── useClientPhones.context.ts
├── useClientPhones.meta.ts
├── useClientPhones.internals.ts
├── useClientPhoneManager.ts              manager entry — same module name, different scope key
├── useClientPhoneManager.actions.ts
├── useClientPhoneManager.context.ts
├── useClientPhoneManager.meta.ts
├── useClientPhoneManager.internals.ts
├── useClientPhoneManager.machine.ts      @internal — the ONE .withConfig() payload
├── __tests__/                            see §8
└── docs/                                 foundation · README · usage · architecture · gotchas · CHANGELOG
```

**Deleted:** `actions.ts` (absorbed into `useClientPhoneManager.machine.ts`), `mapper.ts` (renamed `client-phone.mappers.ts`), `client-phone.utils.ts` (a one-line `// --- keep` comment, no members — dead file).

**No `.machine.ts` for the collection**, and **no per-half services split**: one factory, one identity seam, one cache key, one arm-resolution switch. The reference's stated reason holds verbatim here.

## 3. The two scope matrices

```ts
// client-phone.types.ts  — added to the EXISTING types file (see §0)

/** Context types for the phone COLLECTION — whose list is being addressed. */
export enum ClientPhonesContextTypes {
  CLIENT = AccessRoleTypes.CLIENT
}

export const CLIENT_PHONES_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]:   null as never,
  [ScopeActorTypes.STAFF]:  null as never,   // ruling 1 — rows S1-S7 are recorded drops
  [ScopeActorTypes.CLIENT]: ClientPhonesContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]:  null as never
} as const;

/** Context types for the per-phone MANAGER — which record is being edited. */
export enum ClientPhoneContextTypes {
  PHONE = "phone"
}

export const CLIENT_PHONE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]:   null as never,
  [ScopeActorTypes.STAFF]:  null as never,
  [ScopeActorTypes.CLIENT]: ClientPhoneContextTypes.PHONE,
  [ScopeActorTypes.GUEST]:  null as never
} as const;
```

`STAFF: null as never` is what makes `.as('staff')` a **compile-time error** rather than an advertised-but-absent capability. That is the whole mechanical content of ruling 1 on the code side; the capability record is in `parity.yaml` rows S1–S7.

The manager's context names the **entity, not its owner** — a `.for('phone', id)`-scoped manager falls through to the session client via the same seam as everything else. Two matrices, not one: the halves scope on different things and cannot share.

## 4. The identity seam

ONE function, in `client-phone.services.ts`, is the only place a target client id is derived:

```ts
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();
  return computed(() =>
    scopeContext?.type === ClientPhonesContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );
}
```

It compares the **resolved context**, never the actor — so it is not a branch on `SELF` and does not trip `scope-based/no-self-branch`. Under ruling 1 the `client` branch is currently unreachable from any live matrix cell; it is kept because the seam's *shape* is what makes a future staff cell a matrix edit rather than a rewrite, and because `resolveClientId` is the single point every request gate reads.

`isAddressable(clientId)` is the module's ONE addressability predicate, exposed reactively as `service.isAvailable` so the flag the consumer renders and the gate the wire enforces cannot drift. `useClientPhones.meta.ts` hands it straight through — it does not re-derive the expression.

**Every function in `client-phone.services.ts` takes `scopeContext` and builds its URL from `resolveClientId(scopeContext)`.** No file outside this one reads `activeUser` for identity purposes (graph fact: `UseActiveSession` is community 8's session node — §0).

## 5. Services factory and cache key

```ts
export const createClientPhoneServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientPhoneServices => ({
  queryKey,                       // ["client", "phones"] — unchanged from today
  clientId,                       // the seam
  isAvailable,                    // computed(isAddressable(clientId.value))
  error,                          // captured mutation error, read never raised
  loadList, loadOne,
  add, update, ensure, remove, setDefault,
  loadLookups, parse, validate, refresh,
  ...scopedServices(scopeActor, scopeContext)   // armless — `default: return {}` only
});
```

- **Cache key stays `["client", "phones"]`**, with the resolved client id carried as a ref inside the query key (so a late-resolving id re-derives into a *different* cache entry rather than poisoning the unaddressable one). Keeping the key means an in-flight consumer's cache is not orphaned by the conversion.
- **`loadOne(id)` is new** — the manager's per-record read. Today's manager seeds its model by calling `useClientPhones().getOne(id)` from inside the manager, which couples the two halves' instances. The reference reads the record through the shared services instance instead; we follow it.
- **The `scopedServices` switch exists but has only a `default:` case.** Its shape is identical armed or armless, so nothing downstream changes the day an arm is earned. See §7.

## 6. Module Visibility — and how ruling 3 resolves jtbd_risk #7

**Confirmed: it resolves, and the lift stays narrow.** The reference already routes exactly this need this way, in exactly these files:

- `client-company.services.ts:303-305` — `const { ensure: ensureEmail } = useClientEmails().as(ScopeActorTypes.SELF).useActions();`
- `client-company.services.ts:88-91` — `const clientEmails = useClientEmails().as(ScopeActorTypes.SELF); const { isReady } = clientEmails.useActions(); const { default: defaultEmail, data: emails } = clientEmails.useContext();`
- `basket-billing/unified/services.ts:48-50` — the same three lines.

`useClientEmailServices` is exported from **no** barrel. So `client-phone.services.ts` becomes `@internal` with no new public surface anywhere, and the importer edit is the same edit the email conversion already made to the same two files.

Precise characterisation of the importer edit, so nobody widens it later:

1. add `.as(ScopeActorTypes.SELF)`;
2. move `isReady` to `.useActions()` and `default` / `data` to `.useContext()` — the four-layer return shape forces this, it is not a behaviour change;
3. re-route `ensure` from `useClientPhoneServices()` to `useClientPhones().as(SELF).useActions().ensure` — **authorised explicitly by ruling 3**.

Nothing else in those files is touched. Steps 1–2 are mechanical; step 3 is the one substantive line, and it is the line the ruling names.

`@internal` head markers go on `client-phone.services.ts`, `client-phone.mappers.ts`, `client-phone.schemas.ts`, `useClientPhoneManager.machine.ts` — required by `scope-based/complete-layer-set` (`missingInternal`).

**The barrel loses three exports:** `useClientPhoneServices`, `usePhoneSchema`, `usePhoneUischema`. The schema pair travels to consumers through `useClientPhoneManager().useContext().schema` / `.uischema` — a form rendered from a schema the machine has not adopted validates against a different contract than the one that saves. `basket-billing/unified/schemas.ts:76,129` currently imports the bare pair; see D-4 and task T-6 for the one place this is genuinely awkward and how it is resolved without widening the lift.

## 7. Arms determination (variance-law clause 3)

Derived mechanically from the landed parity table, per layer, not asserted.

**The derivation.** An arm earns its place only when some actor gets a member **exclusive to it**, or a member **overriding** the shared factory with a genuine A-vs-A+B divergence. Both tests are *relational* — they compare one actor's members against another's.

Under ruling 1 this module has **exactly one resolving actor**: `CLIENT`. `SELF` is resolved to a concrete actor by the scope builder before any factory runs (clause 4); `STAFF` and `GUEST` are `null as never` in both matrices. With a single resolving actor there is no second actor to be exclusive *against* and no shared-versus-actor pair to override, so no member of any layer can satisfy either test. Independently, `scope-based/arm-in-matrix` makes an arm for an undeclared actor an **orphan** (lint failure by construction), and `scope-based/no-cosplay-arm` makes an arm carrying nothing exclusive an **empty scaffold**.

Row-level check: the rows that *could* have earned an arm are S1–S7 (the staff endpoint family, the four capability gates, the acting-as-client branch, the staff copy). Every one is a `Dropped-with-Linear-issue` row. A dropped capability has no code path, and a layer cannot vary over behaviour that is not implemented.

| Layer | Arms | Earning rows |
| --- | --- | --- |
| `services` | **none** | — (`scopedServices` carries `default:` only) |
| `actions` | **none** | — |
| `context` | **none** | — |
| `meta` | **none** | — (no capability read-state exists in this module) |
| `schemas` | **none** | — |

Recorded machine-readably in `parity.yaml` → `arms:`. The developer seat re-derives this independently at Code; a mismatch is a gate failure.

## 8. Test topology

Mirrors the reference exactly (ADR-021 testing trophy; ADR-020 — `.feature` is spec-only and non-executable).

```
__tests__/
├── client-phone.feature                     AUTHORED BY THE PROVER — not this seat
├── client-phone.traceability.test.ts        two-way @AC ↔ test link; second path per §9
├── client-phone.surface.test.ts             barrel surface + "no export *" — the amputation guard
├── client-phone.mappers.test.ts             unit — mapPhone / mapIPhone
├── client-phone.schemas.test.ts             unit — schema shape + the phone_country_code keyword
├── client-phone.collection.int.test.ts
├── client-phone.manager.int.test.ts
├── client-phone.mutations.int.test.ts
├── client-phone.guard.int.test.ts
├── client-phone.module.int.test.ts          both halves through one cache key
├── client-phone.int-helpers.ts
├── client-phone.fixtures.ts                 the RECORDING GENERATOR (mode (a), direct-API)
├── setup.integration.ts
├── fixtures/*.json                          RECORDED — never hand-authored
└── *.must-fail.patch                        negative controls, §8.1
```

### 8.1 Negative controls

Authored by the **developer** (it knows the line it mutated), applied blind and verified RED by the **prover** — `agent-seat-separation.companion.md`, incident 2026-07-31.

| Patch | Mutates | Must flip RED |
| --- | --- | --- |
| `client-phone.manager-amputation.must-fail.patch` | deletes the manager export block from `index.ts` | `surface.test.ts` (AC-16) |
| `client-phone.client-id-limb.must-fail.patch` | `isAddressable`: `isAuthenticated && !!clientId` → `isAuthenticated` | `guard.int.test.ts` (AC-15) |
| `client-phone.scope-derived-id.must-fail.patch` | `resolveClientId` returns `activeUser.id` unconditionally | `collection.int.test.ts` URL read-back (AC-1) |
| `client-phone.feedback.must-fail.patch` | drops the `onSuccess` feedback from `remove` | `mutations.int.test.ts` (AC-7) |
| `client-phone.parse-fallback.must-fail.patch` | removes the `\|\| safeModel.phone.nationalNumber` fallback in `parse` | `manager.int.test.ts` (AC-20) |
| `client-phone.default-body.must-fail.patch` | `setDefault` body `{ default: true }` → `{}` | `mutations.int.test.ts` (AC-8) |

### 8.2 Fixture capture

`pnpm fixtures:generate client-phone` runs `__tests__/client-phone.fixtures.ts` headlessly against real staging (mode (a), direct-API), then auto-runs `lint:fixtures` for PII masking. Credentials load from `packages/headless/.env.recording`, **which exists in-tree (350 bytes)**. Naming follows the reference: `get-clients-id-phones.json`, `get-clients-id-phones-case-page-1.json`, `post-clients-id-phones.json`, `put-clients-id-phones-id.json`, `put-clients-id-phones-id-case-set-default.json`, `delete-clients-id-phones-id.json`, `get-countries.json`.

Hand-authoring one and presenting it as recorded is cosplay, with a named receipt (`verify-cosplay.companion.md`, 2026-08-05). `scope-based/no-hand-rolled-int-fixture` is the gate.

## 9. Artefact-path redirect

`docs/sdd` is a symlink to `/Users/domdacosta/Dev/Upmind/agent-runner/docs/sdd` — another machine's path, dangling and unwritable in this worktree and on `develop`. **This bundle lives at `docs/story-bundles/client-phone/`.**

Downstream consequence the prover and documenter inherit: the reference's `client-email.traceability.test.ts` resolves a second feature path at `../../../../../../docs/sdd/client-email/client-email.feature`. `client-phone.traceability.test.ts` must resolve **`../../../../../../docs/story-bundles/client-phone/client-phone.feature`** instead. Do not reproduce the `docs/sdd` path; it will not resolve.

---

## 10. Recorded decisions

Each block is a full `@decision` (what / why / rejected) per `scope-based/require-decision`. Each carries its parity row.

### D-1 — The `type` field · parity row `W4`

- **what:** The conversion **carries `type` on the read model only**. `Phone.type` stays exposed (it already is, mapped straight from `IPhone.type`); `mapIPhone` continues to emit **no** `type` on write; the form schema does not gain a `type` control. Legacy's required `PhoneTypes` select is recorded as `Dropped-with-Linear-issue` (row `L1`).
- **why:** "Parity with legacy" and "parity with current headless" genuinely conflict here and the JTBD names both. The tie is broken on the read-back: legacy's `type` is a *form* field on a Buefy modal the headless module has no equivalent of, and the current headless module has shipped without it long enough that every live consumer (`TabPersonal.vue`, `TabBusiness.vue`, `BillingForm.vue`, both cart funnel engines) creates phones with no `type` — the API accepts it. Adding a required `type` to the schema would make every one of those consumers' saves fail validation on day one: that is a capability *regression* dressed as parity. Carrying it read-only preserves the display capability legacy has while breaking nothing.
- **rejected:** (a) *Add `type` as a required schema property and emit it on write* — breaks all five live consumers immediately, and no consumer has a UI to collect it; the JTBD is about not losing capability, and this loses more than it gains. (b) *Strip `type` from the read model too* — a real drop of a field both oracles expose, for no benefit. (c) *Add `type` as an optional write field defaulting to `1`* — invents a wire behaviour neither oracle exhibits; a fabricated contract is the data-provenance failure one altitude up.

### D-2 — The latent `||` guard bug · parity row `W5`

- **what:** **Fixed, not reproduced.** `remove` and `setDefault` today read `if (isAuthenticated.value || !client.value?.id) resolve(true)`. The conversion replaces both hand-rolled guards with the module's ONE addressability predicate, `service.isAvailable` / `isAddressable(clientId)` — i.e. `isAuthenticated && !!clientId`. AC-15 and the `client-id-limb.must-fail.patch` pin it.
- **why:** The `||` is an obvious typo against the `&&` every other guard in the same file uses (`loadList`, `add`, `update` all use `&&`), and it makes the guard *resolve true* for an unauthenticated session with no client id — the exact hole the reference wrote a dedicated negative control for. This is not a behaviour any consumer can depend on: it does not enable a capability, it removes a safety check, and the request it lets through targets `clients/undefined/phones`. Reproducing it would mean writing a read-back that asserts an unauthenticated delete reaches the wire — an assertion no reviewer could sign.
- **rejected:** (a) *Reproduce it verbatim for byte-parity* — parity is a capability discipline, not a bug-compatibility discipline; there is no capability here to preserve. (b) *Fix it silently as a drive-by cleanup* — forbidden; a behaviour change must be a recorded decision with a parity row, which is what this block is.

### D-3 — Services barrel visibility and the `ensure` seam · parity row `X1`

- **what:** `useClientPhoneServices` is **removed from the public barrel**; `client-phone.services.ts` becomes `@internal`. Cross-module `ensure` is taken off `useClientPhones().as(SELF).useActions().ensure`.
- **why:** Module Visibility Law + `scope-based/complete-layer-set` require it, and the reference proves the route works in the exact two files that need it (`client-company.services.ts`, `basket-billing/unified/services.ts`), where the email half already reads this way. It keeps the importer edit inside ruling 3's lift.
- **rejected:** (a) *Keep the services barrel export* — leaves a data-layer file cross-module-importable, fails `complete-layer-set`'s `missingInternal`, and diverges from the reference for no reason. (b) *Widen the lift and refactor the consumers properly* — explicitly out of bounds; the ruling says narrow, and narrow suffices.

### D-4 — Schema exports leave the barrel · parity row `X2`

- **what:** `usePhoneSchema` / `usePhoneUischema` are **removed from the barrel**. The pair reaches consumers through `useClientPhoneManager().useContext().schema` / `.uischema`.
- **why:** The reference's stated reason applies unchanged: a form rendered from a schema the machine has not adopted validates against a different contract than the one that saves.
- **rejected:** *Keep the bare pair exported for `basket-billing/unified/schemas.ts`* — that file composes the phone schema into a **larger** unified schema at module scope, where no manager instance exists. Resolving this by keeping the export would re-open the exact hazard the reference closed. Resolution instead: `unified/schemas.ts` imports the schema builder by its **deep internal path** with an `@internal` acknowledgement comment — a one-line import change, ruling-3 shaped, adding no public surface. **If the developer finds that path also unacceptable to the lint rules, STOP and escalate — do not re-export the pair.** Flagged in `tasks.md` T-6 as the single design risk carrying a real chance of escalation.

### D-5 — Legacy-only client-surface behaviours

Each is listed in `parity.yaml` rows `L1`–`L10` with an explicit disposition. Summary of the rulings:

| Legacy behaviour | Disposition | One-line why |
| --- | --- | --- |
| required `PhoneTypes` select | `Dropped-with-Linear-issue` | see D-1 |
| `with_staged_imports: 1` list param | `Dropped-with-Linear-issue` | staged imports are an admin-import concept; no client-surface consumer reads `staged_import`, and the param is absent from current headless |
| sort `created_at` ASC / `-created_at` | `Dropped-with-Linear-issue` | current headless sends no sort; adding one changes every live consumer's row order — a behaviour change dressed as parity. Recorded, not silently skipped |
| `isStaged` disabling | `NOT-A-HEADLESS-CAPABILITY-with-reason` | a UI disabled-state driven by an admin-context prop; the data it needs (`staged_import`) is on the read model and remains available |
| `can_delete` tooltip | `Absorbed-by` | the *capability* is `meta.canDelete`, already on the read model (row `C2`); the tooltip is presentation |
| delete-confirmation modal | `NOT-A-HEADLESS-CAPABILITY-with-reason` | a confirm dialog is a consumer concern; `remove()` is the capability |
| inline "+ add new" from the selector | `Absorbed-by` | composition of `useClientPhones` + `useClientPhoneManager().fresh()`; both capabilities ship |
| brand-country default | `Absorbed-by` | `loadLookups` seeds the base model's country from `useSystem().getCountry` (row `M2`); the *source* differs (system vs brand) but the capability — a sensible default dial country — survives |
| add / update success toasts | `Dropped-with-Linear-issue` | the reference raises **no** feedback from the manager half (a save rejects for the caller); reproducing legacy's toasts here would diverge from the reference and double-report with the consumer's own handling |
| phone verification | `NOT-SUPPORTED-IN-LEGACY-with-reason` | no verification flow exists in either oracle |

---

## 11. What this design does NOT change

- `packages/headless/src/modules/{query,data-manager,scope}/**` — untouched. The `dataManagerMachine` is protected core; a disagreeing test presumes the test wrong (`code-xstate.companion.md`). If genuine machine evidence surfaces, stop and ask the operator.
- `client-email/`, `client-email-history/`, `client-address/`, `client-company/` — banned except the ruling-3 `.as()` lift.
- The cache key `["client", "phones"]`, the endpoint paths, and the wire bodies (except `type`, D-1 — which is unchanged from current headless anyway).
