# client-address — Requirements

**Run:** `/scoped-composable-factory` conversion of `packages/headless/src/modules/client-address/`
**Seat:** planner · **Stage:** Plan (full-depth SDD) · **Date:** 2026-08-14 (revision 2)
**Worktree:** `/Users/dom/Documents/upmind-worktrees/client-address` · **Branch:** `feature/client-address-scoped-conversion`
**Base:** `bff994868` — latest `gitlab/develop`, 0 ahead / 0 behind. **This base already contains the merged `client-phone`, `client-company` and `client-email` scoped conversions.**
**Bundle home:** `docs/story-bundles/client-address/` — `docs/sdd` is a symlink to a path off this machine and is **never** written.

> **Revision 2 supersedes revision 1** (written against base `39521e4a5`). Two things changed and are reconciled here, not silently absorbed:
> 1. Revision 1's ruling **OR-9 (merge-conflict planning against `feature/client-company-scoped-conversion`)** is **deleted in full**. That branch is merged into this base. There is no conflict, no take-theirs, no pre-emption note. Every consequence drawn from it in revision 1 is withdrawn.
> 2. Revision 1's consumer list was a **prediction**. It is now **measured** against this base (§6). The predicted count was 13 in-scope sites; the measured, ruled scope is **13 invocation sites in 8 files**, with `apps/velia` and `apps/hosting` moved **out** of scope by operator ruling, plus **7 derived fan-out targets** the same edit forces (§6.2). Every delta is named.
>
> Ruling numbering also changes: revision 1's `OR-1…OR-8` are re-issued as **`R1…R8`**, matching the operator's own numbering. The mapping is recorded in `review-notes.md` §1.
>
> **Operator ruling R10 (2026-08-14) landed after the bundle's first commit and is applied here.** It **overturns** revision 2's design decision D-14: **feedback stays in the module.** Rows `F1`/`F2` revert to `Direct`/`existing`, row `C18` becomes untouched-by-necessity, **task T-23 is deleted**, and **AC-14** and **AC-40** are corrected to the module-raised behaviour. Full record at §4 R10 and `design.md` D-14. *(There is no R9 — the operator's numbering skips it; no ruling has been invented to fill the gap.)*

---

## 1. JTBD

> **"Let a consumer manage a client's postal addresses at full parity with legacy vue-app + current headless."**

This is the run's definition of done. Every gate field is **evidence toward it**, never the goal. A green gate with an amputated manager is the FE-2824 / 2026-08-05 client-email failure this run exists to avoid.

**Scope:** cells `client × self` only. **Mode:** conversion. **Variant:** `hybrid` (derived at Research, re-confirmed at Plan — §2).

### 1.1 The JTBD's honest boundary

The legacy vue-app surface carries capability outside `client × self`: a distinct admin endpoint family, an acting-as-client (mock-client) branch, four staff permission gates, a per-client admin cache scope and a staff-only copy affordance. Those are **not** deliverable within the declared cell and are recorded as signed drops (ruling **R2**, rows `D1`–`D8`).

Inside the cell, "full parity with legacy vue-app" is taken literally: ten `client × self` behaviours the legacy client portal or the current headless module owes and does not deliver are **built** (rows `L1`–`L10`), not dispositioned. **Effort is not a disposition.**

---

## 2. Variant — hybrid, re-confirmed at Plan

Research derived `hybrid`. Plan re-confirms it against this tree rather than inheriting it:

| Question | Answer | Evidence (this base) |
| --- | --- | --- |
| Query-backed **collection** composable? | **YES** | `useClientAddresses.ts:30` — `const query = service.loadList(initial)`, surfaced as `data`/`error`/`pagination`/`refresh`/`nextPage`/`prevPage`/`invalidate`/`filters` (`:84–204`); backed by `useQuery().list<IAddress[], Address[]>` (`client-address.services.ts:46–66`). |
| `dataManagerMachine`-backed **per-entity manager**? | **YES** | `useClientAddressManager.ts:53–70` — `interpret(dataManagerMachine.withConfig({actions,guards,services}).withContext({clientId,id,model,allowMultipleEdits}))`; the whole form surface (`model`/`schema`/`uischema`/`input`/`update`/`validationErrors`) hangs off it. |
| Bespoke machine? | **NO** | No `createMachine` in the module — it configures the shared one. |

**`variant = hybrid`. BOTH surfaces are planned.**

The derivation is corroborated three ways on this base: `client-phone`, `client-company` and `client-email` all landed the **same 16-file layout** — `use{X}s.{actions,context,meta,internals}.ts` + `use{X}Manager.{actions,context,meta,internals,machine}.ts` + shared `mappers`/`schemas`/`services`/`types`/`index`, each with 6 docs and 18–22 test artefacts (measured: `client-company/__tests__` holds 22 files, `client-company/docs` holds 6).

A `variant=query` override arriving from **any** source is a **halt**, not a narrowing. Amputating the manager is the failure this run exists to avoid.

---

## 3. Reality Check — pre-change baseline

Recorded before any file in this bundle was written, as the run's zero point.

| Check | Command | Result |
| --- | --- | --- |
| **Headless type-check baseline** | `pnpm --filter @upmind-automation/headless type-check` (`vue-tsc -p tsconfig.build.json --noEmit`) | **exit 0** — clean, 2026-08-14, worktree `client-address`, branch `feature/client-address-scoped-conversion` @ `bff994868` |
| **Environment** | submodules initialised · `pnpm install` clean · `packages/types` built | ready |

Every task in `tasks.md` restates this check as a post-condition. **A task that turns it red is not done.** Per **R5**, a green type-check is **necessary but not sufficient** for any consumer task — see AC-37.

---

## 4. §rulings — binding operator rulings (tier-1)

**R1…R8 and R10 (2026-08-14) are current and tier-1.** Prior-pass rulings `PR-1…PR-6` (2026-08-10) are recorded in `review-notes.md`; they stand **except** where an R ruling contradicts them, and every contradiction is named. A prior explicit NO is never silently overridden.

**R10 also overrides this bundle's own earlier design decision D-14.** An operator ruling outranks a planner decision; the overturn is recorded at §4 R10 with the decision it replaced left visible in `design.md` D-14, not deleted.

### R1 — the actor token is `ScopeActorTypes.CLIENT`, not `SELF`

**Rationale.** Both tokens exist in the enum (`scope/scope.types.ts:11–16`). `SELF` resolves to a concrete actor at runtime *before* the scope factory runs; `CLIENT` is already concrete. `client-company` — the newest merged conversion and the declared primary reference — has its consumers call `.as(ScopeActorTypes.CLIENT)`; `client-email` and `client-phone` call `.as(ScopeActorTypes.SELF)`. We follow `client-company`.

**Verified at Plan, on this base.** All three merged modules ship the *same* matrix shape (`SELF: null as never`, `CLIENT: <ContextType>`, `STAFF`/`GUEST` `null as never`) — `client-company.types.ts:57–62, 81–86`. The divergence is at the **call-site token**, not in the matrix. R1 changes what consumers write, not what the module declares.

**Second-order benefit — load-bearing, and now measured rather than predicted.** Hazard **Z3** (`.as(SELF).for(...)` does not typecheck — `ContextsForActor` keys off the *literal* actor, and `SELF` maps to `never`) **dissolves** under R1. The proof is in the tree:

- `TabPersonal.vue:100–117` reconstructs `ScopeBuilderActorWithContexts<PhoneManagerInstance, ClientPhoneContextTypes>` by hand and casts, with a 15-line comment explaining why — that is the Z3 workaround, live, because phones use `SELF`.
- `TabBusiness.vue:204–207` writes `useClientCompanyManager().as(ScopeActorTypes.CLIENT).for(ClientCompanyContextTypes.COMPANY, id)` with **no cast and no reconstruction** — because companies use `CLIENT`.

Under R1 the address manager's real call shape is `.as(ScopeActorTypes.CLIENT).for(ClientAddressContextTypes.ADDRESS, id)`, whose matrix row is concrete. **No cast, no workaround, no edit to `scope.builder.ts` (protected core).** See `design.md` **D-2**.

**`@decision` owed** where this diverges from the `client-email` exemplar — `design.md` **D-2**.

### R2 — staff cells are DROPPED, recorded, not built

**Rationale.** Legacy supports staff acting on a client's addresses. Verified at Plan against the oracle clone (`repos/vue-app` @ `47fdeb0c`):

- **Dual API path.** `src/store/modules/data/clients/addresses.ts:14–22` — `admin = api/admin/clients/${clientId}/addresses`, `client = api/clients/${clientId}/addresses`, `contextual = isAdminContext && !isMockClientContext() ? admin : client`. Every list/create/update/remove action uses `.contextual`.
- **Four staff permission gates.** `src/components/app/global/client/billableEntitiesProvider.vue:96–104` — `canCreateAddress` / `canUpdateAddress` / `canDeleteAddress` via `$userCan("create_client_address" | "update_client_address" | "delete_client_address")`, plus `list_client_addresses` on the provider guard. Re-asserted per-row on the card: `UAddress.vue:22,27` disable make-default and edit on `!$userCan('update_client_address')`.
- **Per-client admin cache scope.** `addresses.ts:22–27` — `clientScope: id => "$client_" + id`, `selectorScope: id => "$client_" + id + "_selector"`.
- **Staff-only affordance.** `UAddress.vue:13–17` — copy-to-clipboard, gated `v-if="isAdmin"`.

**Ruling.** Scope stays `client × self`. Mirror the reference exactly:

- Both scope matrices carry `[ScopeActorTypes.STAFF]: null as never` (pattern `client-email/client-email.types.ts:53,77`; live equivalent `client-company/client-company.types.ts:59,83`), so `.as('staff')` is a **compile-time error** rather than an advertised-but-absent capability.
- Every dropped staff capability gets its **own** `Dropped-with-Linear-issue` parity row — pattern: `client-email` rows R27–R33. Rows `D1`–`D8`.
- **No Linear issue reference was supplied.** Every row files the reference as **`OWED — unfiled`**, visibly. **No ID is invented.** `review-notes.md` §3 carries the operator handoff to file them.

**Correction to revision 1, surfaced not silently absorbed.** Revision 1 asserted a ninth drop, "a staff member's own Upmind-side profile addresses" (staff × self). Plan searched the oracle for it and **found no such surface** — `grep` over `src/views/admin` and `src/store/modules/data` returns no staff-own-address route. That row is **withdrawn**; its number is reused by the verified copy-to-clipboard affordance. Nine drops became **eight**, and the withdrawal is recorded rather than the row quietly re-labelled.

**Supporting fact, recorded because it independently corroborates the armless derivation.** `src/store/modules/user/index.ts:23–47` — `can()` initialises `let userCan = true` and only ever mutates it inside `if (rootState.context === Contexts.ADMIN)`. Outside admin context it returns `true` unconditionally. **In `client × self`, every address permission is always true.** The permission surface is a staff-cell concern only: there is no in-cell permission behaviour to model and no permission-shaped variation for any layer to arm on. See `parity.yaml` `arms:` and `design.md` **D-8**.

### R3 — in-tree consumers migrate in THIS branch; submodules do NOT

**Rationale.** Settled by the merged `client-company` precedent: its conversion migrated every in-tree consumer on its own branch, including `basket-billing/unified/__tests__/unified.int.test.ts`, a Playwright flow, an i18n key and 13 retired lines of `eslint-suppressions.json`.

**Ruling, part 1 — IN SCOPE (8 files, 13 invocation sites).** Each gets its **own** task with its **own** Reality Check (`tasks.md` T-14…T-26, rows `C1`–`C13`). Measured at Plan on this base:

| File | Sites |
| --- | --- |
| `packages/client-vue/src/modules/billing/components/BillingForm.vue` | `:179`, `:203` |
| `packages/client-vue/src/modules/billing/components/BillingSummary.vue` | `:191`, `:198` |
| `packages/client-vue/src/modules/billing/components/TabPersonal.vue` | `:144` |
| `packages/headless/src/modules/basket-billing/unified/services.ts` | `:52`, `:136`, `:311` |
| `packages/headless/src/modules/client-company/client-company.services.ts` | `:222`, `:510` |
| `apps/cart/src/router/funnels/engine/services.ts` | `:135` |
| `apps/cart-nuxt/app/funnels/engine/services.ts` | `:135` |
| `playgrounds/labs/src/pages/billing/components/ClientBillingAddresses.vue` | `:95` |

**Ruling, part 2 — OUT OF SCOPE, operator ruling, do not edit.** `apps/velia/src/router/funnels/engine/services.ts:135` and `apps/hosting/src/router/funnels/engine/services.ts:135`. Both are **git submodules with their own remotes** — confirmed at Plan in `.gitmodules` (`apps/velia` → `velia-checkout.git`, `apps/hosting` → `hosting.com-checkout.git`). The operator handles them in a follow-up commit; precedent is monorepo commit `39521e4a5`, *"point hosting/velia at their scoped client-phone consumers"*.

> ### ⚠ HANDOFF — READ THIS BEFORE MERGING
>
> **After this branch merges, `apps/velia` and `apps/hosting` will not type-check until the operator's follow-up submodule commit lands.**
>
> Both funnel engines call the flat `useClientAddresses()` at `:135` and read `defaultAddress()?.id`. This branch retires the flat surface (R1/R4) and changes `default()` to return an id (R5). Those two call sites therefore break in **two** ways at once — a signature break the compiler will catch, and an id-vs-row break it will **not** (see R5). This is stated without softening, in `tasks.md` (T-27) and `review-notes.md` §3, exactly as it is stated here.

**Ruling, part 3 — fan-out completeness.** Follow the `client-company` precedent: check each equivalent for addresses and task it if it applies. Measured results in §6.2 — 7 derived targets, all in-tree, all forced by the same edit. **T-1 records the Playwright flow's current outbound requests as an oracle BEFORE any task edits it** (`tasks.md` T-1 precedes T-25 and every module task).

### R4 — `useClientAddressServices` is RETIRED, not deprecated

**Rationale.** The merged `client-company` conversion deleted `useClientCompanyServices` from its barrel and migrated its callers. Verified at Plan: `client-company/index.ts` on this base exports no `useClientCompanyServices`, and `basket-billing/unified/services.ts:142–144` reads `const { ensure: ensureCompany } = useClientCompanies().as(ScopeActorTypes.CLIENT).useActions()`.

**Ruling.** Delete `useClientAddressServices` from the barrel (`client-address/index.ts:5`) and from every caller. Migrate to `.as(ScopeActorTypes.CLIENT).useActions().ensure`:

| Caller | This base | Migration |
| --- | --- | --- |
| `basket-billing/unified/services.ts:5` import, `:136` call | `const { ensure: ensureAddress } = useClientAddressServices();` | `useClientAddresses().as(CLIENT).useActions()` |
| `client-company/client-company.services.ts:7` import, `:222` call | identical shape | identical |
| `basket-billing/unified/__tests__/unified.int.test.ts:83` | mocks `useClientAddressServices` **by name** | breaks the instant R4 lands — re-point at the scoped surface |

**This SUPERSEDES prior ruling PR-1's `@deprecated` re-export carve-out** (`review-notes.md` §1). Recorded, not silently applied. The carve-out already collapsed once under a type-check; a sunset re-export with no sunset is a second public surface, not a bridge.

### R5 — `default()` returns an ID, not the row

**Rationale.** Confirmed on this base, `client-company/useClientCompanies.context.ts:30, 40–41, 69`:

```ts
const { findOne, getOne, getDefault } = useCollection<Company>(query.data);
function getDefaultId() {
  return getDefault()?.id;
}
// ...
default: getDefaultId,
```

which is why the migrated app code reads `getCompany(defaultCompany())` (`apps/cart/src/router/funnels/engine/services.ts:152`).

**Ruling.** `useClientAddresses().as(CLIENT).useContext().default` returns the default address's **id**.

**Every in-tree address consumer currently uses `defaultAddress()` as if it returns the row.** Measured, all ten sites:

| Site | Expression today | After R5 |
| --- | --- | --- |
| `TabPersonal.vue:224` | `modelValue.value?.addressId ?? defaultAddress()?.id ?? undefined` | `?? defaultAddress() ?? undefined` |
| `TabPersonal.vue:227` | `find(addresses.value, ["id", val]) ?? defaultAddress()` | `?? getAddress(defaultAddress())` — today this returns a **row-or-id union**; after R5, unmigrated, it returns row-or-**string** |
| `TabPersonal.vue:257` | `value?.addressId ?? defaultAddress()?.id ?? undefined` | `?? defaultAddress() ?? undefined` |
| `TabPersonal.vue:269` | `modelValue.value?.addressId ?? defaultAddress()?.id` | `?? defaultAddress()` |
| `client-company.services.ts:559` | `seed?.addressId ?? defaultAddress()?.id` | `?? defaultAddress()` |
| `client-company.services.ts:561` | `!seed?.addressId && !defaultAddress()?.id` | `&& !defaultAddress()` |
| `basket-billing/unified/services.ts:97` | `addressId: defaultAddress()?.id` | `addressId: defaultAddress()` |
| `apps/cart/.../engine/services.ts:155` | `company?.addressId ?? defaultAddress()?.id` | `?? defaultAddress()` |
| `apps/cart-nuxt/.../engine/services.ts:155` | identical | identical |
| `playgrounds/labs/.../ClientBillingAddresses.vue:99` | `ref(defaultAddress()?.id)` | `ref(defaultAddress())` |
| *(out of scope)* `apps/velia`, `apps/hosting` `:155` | identical | **operator follow-up** |

**This is the story's highest-risk item.** `?.id` on a `string` is `undefined` at runtime, and `string \| undefined` flows into an `addressId` field exactly as `Address \| undefined ?. id` did — so **a wrong migration type-checks**. One task per site, each with its **own** behavioural Reality Check. A green `pnpm --filter @upmind-automation/headless type-check` is necessary but **not sufficient** (AC-37).

**Divergence surfaced, not resolved silently.** `client-phone/useClientPhones.context.ts:90` and `client-email/useClientEmails.context.ts:51` both expose `default: getDefault` — the **row**. `client-company` exposes the **id**. Two merged references say row; the declared primary reference says id. R5 binds this module to the id shape; the tranche is therefore internally inconsistent, and that inconsistency is a **fact about the tranche**, not a defect this story introduces. Recorded as `design.md` **D-4** and raised in the Return. It is **not** a JTBD contradiction: an id is losslessly convertible to the row via `getOne`, so no capability is lost.

**Newly measured consequence — the shared renderer contract.** `packages/client-vue/src/components/manage/Select.vue:97` reads `defaultValue: defaultItem()?.id` from whatever `useList()` returns, and `MinimalListComposable.default` is typed `() => any | undefined` (`manage/types.ts:20`) — **`any`, so the compiler cannot see the break at all**. Addresses render through `List.vue`, which destructures `default: _defaultItem` and never calls it (`List.vue:103`), so addresses are not exposed **today** — but any future `as="select"` address `Manage` would be. The adapters this story writes (D-13) therefore re-hydrate: `default: () => getAddress(defaultAddressId())`, keeping the renderer contract on the **row** while the module's own contract is the **id**. Row `C14`, AC-39.

### R6 — `mapAddress` STAYS on the barrel; `invoices/` needs no edit

**Rationale.** Cross-module mapper exports are the live in-tree pattern: `currency/index.ts:2`, `client-custom-fields/index.ts:3`, `invoices/index.ts:3`; `client/index.ts` re-exports `mapClient` via `export *`. Decisively, `invoices/invoices.mappers.ts` imports `mapClient`, `mapAddress` and `mapCurrency` on adjacent lines (`:5`); singling out the middle one would invent a rule the repo does not have.

**Ruling.** `client-address.mappers.ts` takes the line-1 `@internal` marker; `index.ts` keeps **one** curated named export, `mapAddress`. `invoices/` is **`untouched-by-necessity`** — its existing import stays valid. `@decision` in `design.md` **D-5**. Consistent with prior ruling **PR-5**, carried forward unchanged.

### R7 — schema-definition barrel exports STAY

**Rationale.** The exemplar states "NO SCHEMA EXPORTS HERE" (`client-email/index.ts:14–16`). This module cannot follow it: dropping `useSchemaDefinitions` / `useUischemaDefinitions` forces `client-company/client-company.schemas.ts:31–35` and `basket-billing/unified/schemas.ts:2–5` onto deep-path imports with eslint disables. **That hazard is already live in this tree for client-phone** — `basket-billing/unified/schemas.ts:7–18`, verbatim:

```ts
// eslint-disable-next-line @internal/no-cross-module-imports -- see comment above (row X2 / T-6a)
import {
  useSchema as usePhoneSchema,
  useUischema as usePhoneUischema
} from "../../client-phone/client-phone.schemas";
```

**Ruling.** The barrel keeps `useSchemaDefinitions` and `useUischemaDefinitions`. They are **schema fragments** — pure functions of their arguments for composing the address form into a PARENT schema — and take the `@public @schema-fragment` header, the convention `client-company` established and merged (`client-company.schemas.ts:1–28`, `client-company/index.ts:52–58`). A consumer rendering the address form ITSELF must still read `useClientAddressManager().useContext().schema` / `.uischema`. `@decision` in `design.md` **D-6**, citing the exemplar divergence explicitly. Consistent with prior ruling **PR-1**'s first bullet, carried forward.

### R8 — parity fixes that LAND

Each carries a Gherkin scenario and a **wire-level** read-back. Every citation below was re-verified at Plan against this base and the oracle clone.

| # | Fix | Verified evidence | Row | Scenario |
| --- | --- | --- | --- | --- |
| 8a | **Inverted guards.** `client-address.services.ts:203` and `:236` read `if (isAuthenticated.value \|\| !clientId.value) resolve(true)`. An unauthenticated session with **no** client id satisfies the right-hand limb, the guard resolves `true`, and the request fires at `clients/undefined/addresses/{id}`. Correct form is `&&` with positive `!!clientId` — the correct siblings are `:54` (`isAuthenticated.value && !!clientId.value`), `:137` and `:153` (`!isAuthenticated.value \|\| !clientId.value → throw`). | this base, grep-verified | `L1` | `@AC-11`, `@AC-13` |
| 8b | **`mapAddress.description`.** `client-address.mappers.ts:20–29` composes `address_2, street, city, postcode, region.name, country.name` — `street` is **not a field on `IAddress`** (a dead `get()`), and **`address_1` and `state` are absent**. Legacy composes `address_1, address_2, city, state, postcode, region.name, country.name` (`UAddress.vue:88–98`, verified verbatim). | both | `L2` | `@AC-31` |
| 8c | **Diff-only update.** Legacy sends only changed fields — `addEditClientAddressModal.vue:220–224`, `getNewValues() { return omitBy(this.form, (v,k) => this.formClone[k] === v) }`. Headless PUTs the full mapped model (`client-address.services.ts:157–162`). Under `CLIENT_ALLOW_ADDRESS_UPDATE === false` a full-payload PUT re-sends an unchanged `country_id` and can be rejected where legacy succeeded. | both | `L3` | `@AC-23` |
| 8d | **`lockCountry`.** `CLIENT_ALLOW_ADDRESS_UPDATE` is consulted **nowhere** in headless; `loadLookups` fetches only `REQUIRE_REGION_IN_ADDRESS` (`client-address.services.ts:92–95`). Legacy locks the country field on edit under it — `addEditClientAddressModal.vue:129–137`, with the comment *"When the `allow_address_update` brand org setting is disabled, the API rejects a country change on existing addresses, so we lock the field."* | both | `L4` | `@AC-21` |
| 8e | **Address `type`.** Legacy exposes the 4-value select on edit (`addEditAddressForm.vue:19–37`, `v-if="formType === actionType.UPDATE"`, `v-model="formData.type"` over `addressTypes`). Headless comments the control out of the schema (`client-address.schemas.ts:110–121`, `// --- DEPRECATED`) and **hardcodes `type: 1` on every write** (`client-address.mappers.ts:62`, comment *"We are forcing type to always be 1 for simplicity"*) while still exporting unreachable `AddressTypes` / `ADDRESS_TYPE_KEYS`. | both | `L5` | `@AC-22` |
| 8f | **Readiness.** Replace the uncapped `setInterval(…, 100)` poll (`useClientAddresses.ts:42–51` — no cap, no `clearInterval` on the never-fetched path, no rejection path) and `timeout: Infinity` (`useClientAddressManager.ts:90–93`) with the merged bounded pattern. Current best form on this base is `client-company/useClientCompanies.actions.ts:92–96` — `if (!(await whenSessionSettles())) return false; return whenListFetched();`. | this base | `L6` | `@AC-4`, `@AC-26` |
| 8g | **Do NOT add `with_staged_imports`; plan no `Address.meta.isStaged`.** `IAddress` has **no** `staged_import` field — verified field-by-field at `packages/types/src/models/addresses.ts:5–26`. Legacy's `UAddress` `isStaged` is a **prop defaulting false** that no address caller passes (it only disables dropdown items at `:22,27`). Building it would be the advertised-but-absent defect this story closes. | both | `N2` | — (proven absence) |
| 8h | **`verified`.** `IAddress.verified` is `number \| null` (`addresses.ts:25`); `mapAddress` coerces `!!raw.verified` into a boolean `meta.isVerified` (`client-address.mappers.ts:47`) — lossy. **Decide explicitly; do not silently reshape.** | this base | `L7` | `@AC-32` |

**8g SUPERSEDES prior ruling PR-3 item #7** (`review-notes.md` §1: "staged lock + `with_staged_imports:1`"), which planned exactly what 8g forbids. Recorded, not silently applied.

### R10 — feedback STAYS IN THE MODULE *(2026-08-14 — overturns revision 2's design decision D-14)*

**What is ruled.** `client-address.services.ts` **keeps** its `useFeedback` import and all four raises, unchanged. Revision 2's plan to strip them and hand each consumer the obligation — following the merged `client-company` precedent — is **withdrawn in full**. No consumer acquires a feedback obligation; no i18n key moves, is added, or is deleted.

**Rationale, in the operator's priority order.**

1. **Parity is the JTBD.** Both oracles raise this feedback. Headless raises it today — `client-address.services.ts:210` (`onError → addError({ title: t("error.client_address_update_failed"), … })`), `:220` (`onSuccess → addSuccess(t("confirm.address_removed"))`), `:244` and `:254` for `setDefault`. Legacy raises it too, verified at Plan: `store/modules/data/clients/addresses.ts:134–186` — `confirmDelete`'s `onSuccess` is `$toast.open({ message: i18n.t("_sentence.confirm.removal") })` — and `:187–216` — `makeDefault`'s `onSuccess` is `$toast.open({ message: i18n.t("_.default_address_updated") })`, with `ToastProgrammatic` imported for exactly that. Relocating the raise is a behaviour change measured against **both** oracles, and "full parity with legacy vue-app + current headless" does not license it.
2. **It is a silent-regression shape.** If any one of the eight consumer files failed to add toast handling, the user-visible feedback would simply disappear — **no type error, no failing test** — across eight files at once. That is the advertised-but-absent defect class inverted, and this story exists to close that class, not to open it.
3. **`client-phone` — equally merged — still raises its own** (`client-phone.services.ts:303–350`). The tranche is split, and the parity-preserving side is also the side that costs nothing.

**Deliberate divergence from the primary reference, with its rationale stated generally.** `client-company` is the declared primary reference and it moved feedback to the consumer (`docs/CHANGELOG.md:91–93`, `gotchas.md:410`, discharged at `TabBusiness.vue:170–199`). We diverge, because **a placement choice does not inherit from a reference when the reference's own placement is itself a behaviour change against the oracle.** "Primary reference" settles shape, naming and layering; it does not settle a question the oracle already answers. Where the reference and the oracle disagree, the oracle wins — that is what `verify-parity-oracle.md` means by grading against an external source rather than against the newest sibling.

**Applied consequences.** Rows `F1`/`F2` revert from `Absorbed-by` to **`Direct` / `existing`** — behaviour preserved, access path unchanged. Row `C18` becomes **untouched-by-necessity**: measured at Plan, all four keys the module cites already exist in **all 28 locales**, so there is no i18n work at all. **Task T-23 is deleted** (tombstoned; numbering left stable). **AC-14 and AC-40 are corrected** to the module-raised behaviour — see §5. `design.md` **D-14** carries the full `@decision` and both knock-ons.

**Decision on 8h, taken and recorded rather than deferred (`design.md` D-7).** `meta.isVerified` **keeps its boolean shape** — every in-tree consumer reads it as a flag and none reads a level — **and** `Address.verifiedLevel: IAddress["verified"]` is added alongside, carrying the raw `number | null` unchanged. Neither a parity loss nor a silent reshape: the boolean stays for the consumers that have it, the datum stops being destroyed. Row `L7`, `@AC-32`.

---

## 5. Acceptance criteria

Every AC names a **literal, executable behavioural read-back**. Structure is never the criterion. Per `verify-reality-check.companion.md`, an identity claim is proven only by the **request URL retarget** plus the **auth identity transport** (which session token, which acting-as headers) — never a response payload. Read-backs run inside the standing 30-minute ceiling, EN / targeted specs, per **ADR-021**.

### Collection — `useClientAddresses` (`client × CLIENT`)

**AC-1 — a client reads their own saved addresses.**
*Read-back:* recorded fixture; assert exactly one outbound `GET` whose URL is `clients/<sessionClientId>/addresses` carrying `with=region,country`, and that `useContext().data.value` has one entry per fixture row with `title`/`description` mapped.

**AC-2 — the collection addresses the scope's client, not the session's by accident.**
*Read-back:* assert the captured request URL's `{clientId}` segment **equals the scope-resolved client id**, and that the `Authorization` header carries the **client session token** (`withAccessToken: true`) with **no acting-as header**. A test that only asserts the response body does not discriminate and is rejected.

**AC-3 — an unauthenticated session issues no list request at all.**
*Read-back:* with no authenticated session, assert the request-capture log is **empty** (zero outbound calls) and `useMeta().isAvailable` is `false`. Asserting that an error surfaced does not discriminate.

**AC-4 — readiness resolves within a bound.** *(fix 8f)*
*Read-back:* with a list request that never settles, assert `useActions().isReady()` **resolves `false` within the bound**, and that no `setInterval` remains scheduled after it settles (fake timers; assert the timer count returns to its pre-call value). **Pre-change RED expected** — `useClientAddresses.ts:42–51` hangs forever.

**AC-5 — `default()` yields the default address's ID.** *(R5)*
*Read-back:* over a fixture whose second row has `default: true`, assert `useContext().default()` `===` that row's `id` **string** and `typeof … === "string"`. Asserting truthiness does not discriminate between the id and the row.

**AC-6 — `getOne(id)` returns the mapped row.**
*Read-back:* `getOne(<fixture id>)` deep-equals the mapped `Address` for that row; `getOne(undefined)` is `undefined`.

**AC-7 — `findOne` matches a nested partial.**
*Read-back:* `findOne({ address: { city: "<fixture city>" } })` returns the matching row. **Pre-change RED expected** — `useCollection`'s strict `isEqual` over the whole mapped `address` object never matches a partial (hazard Z1). Contained locally, mirroring `client-phone/useClientPhones.context.ts:49–68`; the shared helper is **not** edited.

**AC-8 — free-text filtering re-issues the list request.**
*Read-back:* call `useActions().filters.query("foo")`; assert a **second** outbound `GET` whose query string carries the filter, and that the first request is not replayed.

**AC-9 — pagination moves through pages.**
*Read-back:* `nextPage()` then `prevPage()`; assert the captured `offset`/`limit` query params on each outbound request match the expected page window, and that a forced `nextPage()` past the end **settles as a rejection** rather than throwing synchronously (`client-company/useClientCompanies.actions.ts:156–165` documents that platform behaviour).

**AC-10 — a client removes one of their addresses.**
*Read-back:* assert one outbound `DELETE clients/<clientId>/addresses/<id>` with the client token, and that the list query key is invalidated afterwards (a refetch is issued).

**AC-11 — remove issues NO request for an unauthenticated session with no client id.** *(fix 8a)*
*Read-back:* with `isAuthenticated === false` **and** `clientId === undefined`, call `remove(id)` and assert the request-capture log is **empty**. **The read-back MUST assert the request was never issued** — asserting that a rejection surfaced does not discriminate, because today's inverted `||` guard resolves `true` and the call fails *downstream*. **Pre-change RED expected**: today the request fires at `clients/undefined/addresses/<id>`.

**AC-12 — a client sets an address as default.**
*Read-back:* assert one outbound `PUT clients/<clientId>/addresses/<id>` with body **exactly** `{ default: true }`, then an invalidation of the list key.

**AC-13 — setDefault issues NO request for an unauthenticated session with no client id.** *(fix 8a)*
*Read-back:* as AC-11, against `setDefault`. Empty capture log. **Pre-change RED expected.**

**AC-14 — a failed row mutation is reported to the user, never thrown at the consumer.** *(corrected under R10)*
*Read-back:* force a 422 on `remove`; assert (a) the feedback store received **exactly one** error entry whose title is `error.client_address_update_failed`, raised by the module itself (`client-address.services.ts:210`), and (b) the call **did not reject** the consumer's promise chain.
*Correction recorded, not silently swapped:* revision 2 asserted `useContext().error.value` is populated. **Measured at Plan, that is not this module's contract** — `useClientAddresses.ts:60` exposes `query.error`, the **list** query's error, while `remove`/`setDefault` failures are reported through the feedback raise. AC-14 now asserts the real, oracle-matching behaviour rather than a contract the module does not have and R10 did not ask for.

**AC-15 — a save made through the manager reaches the collection.**
*Read-back:* save via the manager, then assert — **without** an explicit consumer-side refresh — that a refetch of the collection's list key was issued and `data.value` contains the new row.

### Manager — `useClientAddressManager` (`client × ADDRESS`)

**AC-16 — a client opens a blank new-address form.**
*Read-back:* `.as(CLIENT).fresh()`; assert `useMeta().isNew === true`, `useContext().model` equals the seeded base model (`address.countryId` = the brand's default country, other fields null), and **no** `GET …/addresses/<id>` was issued.

**AC-17 — a client edits an existing address.**
*Read-back:* `.as(CLIENT).for(ADDRESS, "<id>")`; assert `useContext().model` deep-equals the mapped fixture row and `useMeta().isNew === false`.

**AC-18 — the form's countries and regions load before it is usable.**
*Read-back:* assert `useMeta().isAvailable` is `false` until the country and region lookups settle, then `true`; assert `useContext().countries` and `.regions` are populated from the **captured lookup responses**.

**AC-19 — changing country reloads regions and clears an out-of-country region.**
*Read-back:* seed a model with country A and a region of A; `input({ address: { countryId: B } })`; assert a regions request for **B** was issued and `model.address.regionId` is `undefined` afterwards.

**AC-20 — region is required when the brand demands it.**
*Read-back:* with `REQUIRE_REGION_IN_ADDRESS === true`, assert the context schema's `address.required` **contains** `"regionId"`; with it false, assert it does not. Assert the brand-config request was issued for that key.

**AC-21 — the country field is locked on edit when the brand forbids address updates.** *(fix 8d)*
*Read-back:* with `CLIENT_ALLOW_ADDRESS_UPDATE === false` and an **existing** address id, assert the brand-config request included `CLIENT_ALLOW_ADDRESS_UPDATE`, and that `useContext().uischema`'s country control carries the disabled/read-only rule. With no id (create), assert it does not. **Pre-change RED expected** — the key is consulted nowhere today.

**AC-22 — a client picks an address type when editing.** *(fix 8e)*
*Read-back:* on an existing address, assert the context schema exposes `type` with the four options (Home / Office / Holiday / Company); set `type: 3` and assert the captured `PUT` body carries `type: 3`. **Pre-change RED expected** — the control is commented out and `mapIAddressData` hardcodes `type: 1`.

**AC-23 — saving an edit sends only the changed fields.** *(fix 8c)*
*Read-back:* load an existing address, change **only** `city`, save; assert the captured `PUT` body has **exactly** the changed key(s) and **does not contain** `country_id`. Asserting the request succeeded does not discriminate. **Pre-change RED expected.**

**AC-24 — saving a new address creates it.**
*Read-back:* assert one outbound `POST clients/<clientId>/addresses` whose body carries the mapped model, and that the response's id becomes `useContext().id`.

**AC-25 — invalid input surfaces field errors and issues no request.**
*Read-back:* submit a model missing `postcode`; assert `useContext().validationErrors` names `postcode`, `useMeta().isValid === false`, and the request-capture log is **empty**.

**AC-26 — the editor's readiness is bounded.** *(fix 8f)*
*Read-back:* with the lookup chain stalled, assert `isReady()` settles within the bound with a catchable failure. **Pre-change RED expected** — `timeout: Infinity` at `useClientAddressManager.ts:90–93` hangs silently.

**AC-27 — schema and uischema reach the consumer through context.**
*Read-back:* assert `useContext().schema` and `.uischema` are populated and are the same objects the machine validates against — validate a known-bad model through the machine and through the exposed schema; both reject identically.

**AC-28 — clearing the editor resets the draft.**
*Read-back:* dirty the model, `clear()`, assert `model` equals the base model and `useMeta().isDirty === false`.

**AC-29 — two editors edit two addresses independently.**
*Read-back:* mint `.for(ADDRESS, "a")` and `.for(ADDRESS, "b")`; edit `a`; assert `b`'s `model` is unchanged and its scope key differs.

**AC-30 — the editor resolves its client from the scope, not from the session.**
*Read-back:* assert every request the manager issues carries the **scope-resolved** client id in its URL, and that removing the session's `activeUser` mid-flight does not change the URL. This is the seam whose absence is the module's live FE-2824: `useClientAddressManager.ts:44–61` accepts a `clientId`, threads it into machine context, and **it never reaches a URL** — `loadList` (`services.ts:43,49`), `add` (`:134,141`), `update` (`:150,159`), `remove` (`:196,200`) and `setDefault` (`:229,233`) each independently re-read the session.

**AC-31 — an address reads like the legacy portal's.** *(fix 8b)*
*Read-back:* over a fixture with `address_1`, `address_2`, `city`, `state`, `postcode`, `region.name`, `country.name` all populated, assert `description` contains **all seven, in that order**, with `address_1` first and `state` between `city` and `postcode`, and that no `street` lookup remains. **Pre-change RED expected.** *(The join separator stays the headless convention `", "`; legacy's `",\n"` is a presentation detail of the legacy card and is **not** the parity claim — the field set and order are.)*

**AC-32 — `verified` is carried without loss.** *(fix 8h)*
*Read-back:* over a fixture row with `verified: 2`, assert `meta.isVerified === true` **and** `verifiedLevel === 2`; over `verified: null`, assert `meta.isVerified === false` and `verifiedLevel === null`.

### Surface

**AC-33 — acting as staff is a compile-time error.**
*Read-back:* a type-level assertion (`@ts-expect-error` on `.as(ScopeActorTypes.STAFF)`) in the surface spec; the suite fails if the error disappears.

**AC-34 — acting as a guest is a compile-time error.**
*Read-back:* as AC-33, against `ScopeActorTypes.GUEST`.

**AC-35 — the barrel is the module's only public surface.**
*Read-back:* the surface spec enumerates the barrel's exports and asserts the set **exactly** equals the declared list (`design.md` §3) — which includes asserting `useClientAddressServices` is **absent** (R4) and that no `export *` remains. `services`, `mappers` and the machine carry the line-1 `@internal` marker, and a tree grep finds **no** cross-module import of them.

**AC-36 — no advertised-but-absent member remains.**
*Read-back:* assert every member the barrel exports is reachable and does something — specifically that `AddressTypes` / `ADDRESS_TYPE_KEYS` are consumed by the live `type` control (AC-22), and that no exported symbol is unreferenced by any test or consumer. The `clientId` parameter on the old manager signature is **gone** (prior ruling PR-2, carried forward).

### Consumers

**AC-37 — every in-scope consumer reads the default address through the ID contract.** *(R5)*
*Read-back:* **per site**, a targeted spec or rendered assertion showing the migrated expression resolves to a **real address** — e.g. that the billing model's `addressId` equals the fixture's default row id, not `undefined`. **`pnpm --filter @upmind-automation/headless type-check` exit 0 is necessary but NOT sufficient**: `string | undefined` flows into `addressId` exactly as `Address | undefined ?. id` did, so a wrong migration type-checks. Each site's task names its own behavioural check. Ten in-scope expressions (R5 table).

**AC-38 — the e2e seeding flow seeds through the scoped manager.**
*Read-back:* `tests/Playwright/e2e/support/flows/address-setup.ts` seeds via the scoped surface and its dependants (`order-billing-setup.ts`, `flows/index.ts`) still pass; the requests it issues are **diffed against the pre-migration recording taken in T-1**, and any divergence is explained on a parity row before the task is done.

**AC-39 — the billing tab still lists and edits my addresses.** *(D-13)*
*Read-back:* render `TabPersonal.vue` against a recorded fixture; assert the address `Manage` renders one item per fixture row, that `doEdit` opens the editor with that row's model, and that `doRemove` issues the `DELETE`. The adapter's `default()` returns a **row** (`getAddress(defaultAddressId())`), asserted by `typeof … === "object"`. **This AC cannot be proven by type-check**: `ManageRendererProps` bottoms out in `MinimalListComposable = (...args: any) => …` and the four value-pass call sites are cast `as any`, so handing the renderer an unadapted scope builder compiles cleanly and fails only at runtime.

**AC-40 — removing an address, or changing my default, still tells me it worked.** *(R10 / D-14)*
*Read-back:* an integration read-back **at the module**. Over recorded fixtures: `remove(id)` on success lands exactly one **success** entry carrying `confirm.address_removed`, and on a forced 422 exactly one **error** entry carrying `error.client_address_update_failed`; `setDefault(id)` likewise lands `confirm.address_set_default` / `error.client_address_set_default_failed`. Assert the entries are raised by `client-address.services.ts` itself (`:210, :220, :244, :254`), with **no consumer subscribed** — proving the feedback survives the conversion rather than depending on a consumer remembering to add it.
*Why at the module, not the consumer:* R10. Both oracles raise this feedback in the data layer; a consumer-side read-back would prove only that one of eight consumers was wired, and would leave the other seven able to regress silently.

---

## 6. Consumer inventory — measured on this base

### 6.1 Ruled in-scope invocation sites (R3 part 1) — 13 sites, 8 files

| Row | Site | What it uses | Migration | Task |
| --- | --- | --- | --- | --- |
| `C1` | `packages/client-vue/src/modules/billing/components/BillingForm.vue:179` | `useClientAddresses().isReady()` | `.as(CLIENT).useActions().isReady()` | T-14 |
| `C2` | `…/BillingForm.vue:198–203` | `getOne: getAddress`, `meta: addressMeta`, `default: _defaultAddress` (**unused**) | `.as(CLIENT)` + layer split; the unused binding is **removed**, not carried | T-14 |
| `C3` | `…/BillingSummary.vue:191` | `useClientAddresses().isReady()` | `.as(CLIENT).useActions().isReady()` | T-15 |
| `C4` | `…/BillingSummary.vue:198` | `getOne: getAddress` | `.as(CLIENT).useContext().getOne` | T-15 |
| `C5` | `…/TabPersonal.vue:139–144` | `data`, `meta`, `default`, `isReady` — flat destructure feeding **four** `defaultAddress()` sites (`:224`, `:227`, `:257`, `:269`) | `.as(CLIENT)` + layer split; **R5 ×4**; `:227`'s `find(addresses, ["id", val]) ?? defaultAddress()` must become `?? getAddress(defaultAddress())` | T-16 |
| `C6` | `packages/headless/src/modules/basket-billing/unified/services.ts:48–52` | `isReady`, `default`, `data` | `.as(CLIENT)` + layer split; **R5** at `:97` | T-17 |
| `C7` | `…/unified/services.ts:136` | `useClientAddressServices().ensure` | **R4** → `.as(CLIENT).useActions().ensure` | T-17 |
| `C8` | `…/unified/services.ts:311` | `useClientAddresses().invalidate` | `.as(CLIENT).useActions().invalidate` | T-17 |
| `C9` | `packages/headless/src/modules/client-company/client-company.services.ts:506–510` | `isReady`, `default`, `data` | `.as(CLIENT)` + layer split; **R5 ×2** (`:559`, `:561`) | T-18 |
| `C10` | `…/client-company.services.ts:222` | `useClientAddressServices().ensure` | **R4** → `.as(CLIENT).useActions().ensure` | T-18 |
| `C11` | `apps/cart/src/router/funnels/engine/services.ts:134–135` | `default`, `isReady` | `.as(CLIENT)` + layer split; **R5** at `:155` | T-19 |
| `C12` | `apps/cart-nuxt/app/funnels/engine/services.ts:134–135` | identical | identical | T-20 |
| `C13` | `playgrounds/labs/src/pages/billing/components/ClientBillingAddresses.vue:94–95` | `isReady`, `default` | `.as(CLIENT)` + layer split; **R5** at `:99` | T-21 |

### 6.2 Derived fan-out targets (R3 part 3) — forced by the same edit

Each is a real consequence of the module edit, measured on this base — not scope creep. Checked one-for-one against the `client-company` conversion's own fan-out.

| Row | Site | Why the same edit forces it | Task |
| --- | --- | --- | --- |
| `C14` | `packages/client-vue/…/TabPersonal.vue:24–25` · `client-company/client-company.schemas.ts:256–257` · `playgrounds/labs/src/pages/client/Addresses.vue:8–9, 24–25` · `playgrounds/labs/…/ClientBillingAddresses.vue:14–15` | Four `useList: useClientAddresses, useMutate: useClientAddressManager` **value-passes**. `Manage.vue:106` calls `props.manage.useList()` **bare** and `:155`/`:161` call `.remove` / `.setDefault` on it; the renderer expects the flat `MinimalListComposable` / `MinimalMutateComposable` shape (`manage/types.ts:15–50`). Handing it a scope builder breaks at **runtime**, and every one of the four sites is cast `as any`, so **the compiler cannot see it**. Adapters, exactly as `client-company` wrote `useCompanyList`/`useCompanyMutate` (`TabBusiness.vue:172–248`) and as `client-phone` wrote `usePhoneListForManage` (`TabPersonal.vue:163–200`) — but raising **no** feedback of their own, since under **R10** the module still raises it. | T-22, T-24 |
| `C15` | `packages/headless/src/modules/basket-billing/unified/__tests__/unified.int.test.ts:83` | Mocks `useClientAddressServices` **by name**; breaks the instant R4 lands. `client-company` updated the equivalent. | T-17 |
| `C16` | `tests/Playwright/e2e/support/flows/address-setup.ts:42, 59` | Calls `window.Upmind.useClientAddressManager(undefined, { clientId })` — the exact signature R4/PR-2 removes. Consumed by `order-billing-setup.ts:3` and `flows/index.ts:1`. **Recorded first (T-1), migrated second (T-25).** It is recorded acceptance as well as a consumer. | T-1, T-25 |
| `C17` | `eslint-suppressions.json:477–486` | 11 grandfathered `@typescript-eslint/no-explicit-any` entries — 6 on `client-address.services.ts`, 5 on `useClientAddressManager.ts`. The typed machine-config factory (D-9) removes the casts. `client-company` retired 13 equivalent lines. These are **removed**, not re-ledgered. | T-26 |
| `C18` | `packages/i18n/public/locales/*/{confirm,error}.json` | **NO EDIT — R10.** Feedback stays in the module, so no key moves and none is added. Measured at Plan: all four keys the module cites already exist in **all 28 locales** — `confirm.address_removed`, `confirm.address_set_default`, `error.client_address_update_failed`, `error.client_address_set_default_failed`. Verify-only, recorded so the absence of an i18n edit is not read later as an oversight. | — (verify-only, T-13) |
| `C19` | `packages/headless/src/modules/index.ts:12` (`export * from "./client-address"`) · `system-places/system-places.types.ts:1` · `basket-billing/unified/types.ts:1` · `client-company/client-company.types.ts:30` · `invoices/invoices.types.ts:4` | **Type-only** imports of `Address` / `AddressModel`. All stay valid under the design's barrel (§3 of `design.md`) — verified, `untouched-by-necessity`. `invoices/invoices.types.ts:4` reaches the **deep path** `../client-address/client-address.types`; that is a pre-existing deep import this story leaves alone rather than widening its blast radius. Recorded so a later reader does not read the absence of an edit as an oversight. | — (verify-only, T-13) |
| `C20` | `packages/headless/src/modules/basket-billing/unified/schemas.ts:2–5` | Imports `useSchemaDefinitions` / `useUischemaDefinitions` from the **barrel**. **R7 keeps them there** — this site needs no edit and is the reason R7 exists. Verify-only. | — (verify-only, T-13) |

### 6.3 Out of scope — operator ruling, do not edit

| Site | Status |
| --- | --- |
| `apps/velia/src/router/funnels/engine/services.ts:135` (+ `:18`, `:155`) | **git submodule** (`velia-checkout.git`) — operator follow-up commit |
| `apps/hosting/src/router/funnels/engine/services.ts:135` (+ `:18`, `:155`) | **git submodule** (`hosting.com-checkout.git`) — operator follow-up commit |

**Both will fail to type-check after this branch merges, until that commit lands.** See the R3 handoff box, `tasks.md` T-27 and `review-notes.md` §3.

---

## 7. Non-functional requirements

- **NFR-1 — no advertised-but-absent member.** Every exported symbol is reachable and does something. This is the defect class the story closes (`AddressTypes` today; the `clientId` parameter today; a `meta.isStaged` that 8g forbids inventing).
- **NFR-2 — the exercised path is the PROD path.** The only sanctioned divergence is the FE-2865 `useTestAttrs` carve-out (`ci/lint-scope-purity.mjs`). No other.
- **NFR-3 — fixtures are recorded, never hand-authored.** `scope-based/no-hand-rolled-int-fixture` is `error` on `**/*.int.test.ts`. Capture with `pnpm --filter @upmind-automation/headless test:integration:record`. The 2026-08-05 fabricated-fixture receipt is why: fabricated-data-presented-as-recorded IS cosplay.
- **NFR-4 — protected core untouched.** `scope/scope.builder.ts`, `data-manager/**` and every `*.machine.ts` are read-only for this run. A test disagreeing with a headless machine presumes the **test** wrong; genuine machine evidence **stops and asks the operator**. R1 removes the only reason this run had to reach for the builder (Z3).
- **NFR-5 — seat separation.** The **developer** authors each `*.must-fail.patch`; the **prover** applies it blind, confirms RED, reverts. A prover that reads module src to construct one has breached diff-blindness.
- **NFR-6 — the type-check baseline (§3) holds at every task boundary.**
- **NFR-7 — every negative control the story adds runs green in the `quarantine:enforce` lane** before the story reaches **Needs Review**.
- **NFR-8 — the three read-only reference modules** (`client-company`, `client-email`, `client-phone`) **are never modified.** `client-company.services.ts` and `client-company.schemas.ts` are edited **only** at their address call sites (C10, C14) — the module's own conversion is not revisited.

---

## 8. Out of scope

- Any staff cell (**R2**) — recorded as `D1`–`D8`, `Dropped-with-Linear-issue`, reference **OWED**.
- Guest support — `N1`, proven absent in both oracles.
- `apps/velia` and `apps/hosting` (**R3 part 2**) — submodules, operator follow-up.
- Editing `client-email/`, `client-email-history/`, `client-phone/`, or `client-company/` beyond its address call sites — references only (NFR-8).
- Editing the shared `useCollection` helper (hazard Z1) — contained locally per `client-phone`'s precedent; a source fix needs its own authorisation.
- Editing the shared `useSystem` / `useBrand` readiness polls (hazard Z2) — bounded at this module's boundary only.
- Editing `scope.builder.ts` or any machine (NFR-4).
- Editing `packages/client-vue/src/components/manage/**` — the renderer contract is consumed, not changed (D-13).
- `invoices/` (**R6**, `untouched-by-necessity`).
- Google Places script loading, session tokens and prediction UI — browser-bound, stays with the consumer (`N3`). The **region-resolution** half is headless and is carried at `L9`.
