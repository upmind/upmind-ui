# Design: FE-3031

## Overview

`packages/headless/src/modules/invoices/` is converted from an unscoped single-read
module (M1) to a scoped, query-backed module (M3) with a collection, a single
read, one criteria schema owning all request state, and one mutation.

Variant is **`query`** — no machine. The query handle IS the state
(`code-composables.md` Part B, "State Machine vs TanStack Query"). Cells are
`client×self` and `client×client`; the two differ only in which client id the
criteria carry and how each row is attributed, which is a context seam inside the
shared services factory, not a second implementation.

The structural model is `packages/headless/src/modules/client-email-history/` —
the only live module shipping a scoped collection **plus** a scoped single read on
one services factory, with criteria wired. Cite it for facts; the file set below
is derived from `.claude/skills/factory/composable/templates/query/`, which is
the contract.

---

## Existing Architecture

### Docs consulted

- `packages/headless/src/modules/invoices/docs/foundation.md` (740 lines — the module's ONLY doc; no README, architecture, usage, gotchas, or CHANGELOG exists). Sections read: What-it-is, Core-concepts (`:18-31`), State-model (`:33-55`), Operations (`:57-72`), Data-shape (`:75-449`), Dependencies (`:450-471`), API-endpoints (`:473-592`), Flows (`:593-693`), Lessons (`:694-740`).

**Two doc statements are WRONG and must not be built from. The Code stage trusts
`packages/types` and the operator ruling, never these lines:**

| Doc line | What it says | Why it is wrong |
| --- | --- | --- |
| `docs/foundation.md:465` | "a client can only see their own invoices; the bearer is the authorisation" | Contradicts operator ruling 2026-09-01 (`client×client` IN) and the oracle's own co-mingled list + `belongsToChildOfClient` / `belongsToDelegate` (`oracle:137-142`, `:143-146`). |
| `docs/foundation.md:28` | `category.slug` is one of `new_contract, renewal, upgrade, downgrade, addon, cancellation_request`, and "The slug is informational" | The enum is `packages/types/src/models/invoices.ts:129-138`: `new_contract, additional_service, one_time_service, migration_pro_rata, recurrent, credit_note, credit_note_for_refund, consolidation`. The doc invents four slugs, omits the four this story depends on, and the slug is the entire credit-note mechanic (AC7), not informational. |

Both are recorded for the Docs stage. Two further doc-vs-code drifts, same
disposition: `foundation.md:460` claims "No other headless module reads from
invoices" — refuted by `orders/order.machine.ts:4`,`:175`; and `foundation.md:64`
assigns refresh-after-payment to invoices while the code puts it in `orders`.

### What exists

| File | What it is | Lines |
| --- | --- | --- |
| `invoices/index.ts` | 3-line barrel: `useInvoice`, types, `mapInvoice` | `:1-3` |
| `invoices/invoices.service.ts` | ONE `query<IInvoice, Invoice>` over `useUrl(\`/invoices/${invoiceId}\`)`; 16-relation `with=` set; client from `activeUser` only | `:19-20`, `:22-38`, `:16`/`:44`/`:55` |
| `invoices/invoices.mappers.ts` | `mapInvoice(raw)` + private `mapPayments`; file-level `/** @internal */` | `:1`, `:14-41`, `:43-62` |
| `invoices/invoices.types.ts` | `Invoice`, `Payment`, and a dead `PAYMENT_STATE` enum | `:22-47`, `:49-59`, `:8-16` |
| `invoices/useInvoice.ts` | Flat composable: positional `invoiceId`, one fused `meta` computed, uncapped 100 ms readiness poll | `:16`, `:24-44`, `:46-59`, `:67-112` |
| `invoices/docs/foundation.md` | The module doc | 740 lines |

**No machine, no actors.** The single query is the state. There is no
`.machine.ts` anywhere in the tree and the query variant carries none by design
(`templates/NOT-APPLICABLE.md`).

### Data flow today

`useInvoice(id)` → `service.loadInvoice({ invoiceId })` → TanStack `query` at
`GET api/invoices/{id}` (`useUrl` prepends the `"api"` context —
`packages/headless/src/utils/useUrl.ts:20-26`) → `select: mapInvoice` → flat
props returned. No list path exists. No `scopeContext` reaches the service, so a
client cannot address another client.

### What can be reused

- `mapInvoice`'s summary/date/payment shaping (`invoices.mappers.ts:14-62`) — extended, not replaced.
- `InvoiceStatusGroups.UNPAID` (`packages/types/src/data/enums/invoice.ts:13-18`) — already identical to the oracle's `unpaidStatuses` (`oracle:67-73`). **Reuse it; do not re-declare the triple.**
- `InvoiceCategoryCode` (`packages/types/src/models/invoices.ts:129-138`) and `CreditNoteStatus` (`packages/types/src/data/enums/invoice.ts:19-22`) as criteria enum values.
- `parseTaxes` / `parseBasketProduct` / `mapClient` / `mapAddress` / `mapCurrency` (already imported at `invoices.mappers.ts:2-6`).
- The `query` platform's `list()` + criteria channel, and `useCollection` for `findOne`/`getOne`.

### What needs to be created

The full four-layer scoped shape for two composables, a schemas family, a list
mapper, the mutation, and the mapped fields AC5/AC6/AC8/AC9/AC11/AC13 need.
Nothing here duplicates an existing abstraction.

---

## Capability Parity Table (actor × context)

> One row per actor × context cell in the requirements' Parity Scope
> cross-product. Machine-readable twin: `docs/sdd/FE-3031/parity.yaml`.

| Actor | Context | Legacy source | Disposition | Notes |
|-------|---------|---------------|-------------|-------|
| client | self | `oracle:25-33` (`contextual` → `api/invoices`), `:227-238` (`list`), `:239-249` (`get`), `:250-276` (`getWithParams`), `:288-301`, `:553-573`, `:574-592`, `:621-632` | Direct | The reading client's own id resolves from `activeUser` through the shared context seam. |
| client | client | `oracle:561-563` (conditional `filter[client_id]`, `hasUnpaid`) + `:585` (unconditional, `getConsolidatableTotal`), both on `contextual` (`:25-33`), `:137-142` (`belongsToChildOfClient`), `:143-146` (`belongsToDelegate`) | Direct | Retarget is a **declared `client_id` filter column**, never a path change and never a hand-appended param. **Three reads declare this cell** and `trackClientIdFilter` (`invoices.services.ts:137-152`) seeds all three: list (`:258`), unpaid-existence (`:394`), consolidatable-count (`:443`). On the **list** read the column is also **durable**: `loadList` returns `withDurableClientId(handle, clientId)` (`:260`, helper `:195-215`), which re-asserts `client_id` on every `filters`-branch write that omits it and leaves an explicitly declared one to win. Row attribution is the second half of this cell — see `R02`. Blocker **H1 closed** 2026-09-08 (`review-notes.md`); read-back `invoices.scope-identity.int.test.ts:261-382`, green. |
| staff | self | `oracle:25-33` (`admin` → `api/admin/invoices`), `:277-540` (admin-only writes) | Dropped-with-issue-reference | **Deprecated by operator ruling 2026-09-01** — "this is client only, staff is being deprecated". A retiring platform capability owes no tracker issue; the `reason:` carries the ruling and the `signoff:` carries the operator token. No Linear issue. |
| staff | client | `oracle:25-33`, `docs/adr/001-scope-based-composables.md:255` (`useInvoices().as('staff').for('client', clientId)`) | Dropped-with-issue-reference | Same ruling. Note the corpus drift this creates: ADR-001 `:249-255` and `docs/reference/service-splitting-examples.md:36-64`,`:187` both still declare the staff arm — a Docs-stage correction, not a code obligation. |

Dispositions: **Direct / Renamed / Absorbed-by / Dropped-with-issue-reference /
NOT-SUPPORTED-IN-LEGACY-with-reason**. The last two require a `reason:` and an
operator `signoff:` token in `parity.yaml`.

### The twelve carried capability rows

Full dispositions with receipts live in `parity.yaml` under `rows:`. R11 and R12
were split out of R05 on 2026-09-08 (Review found four unrequested relations
listed inside R05's `Direct` capability). Summary:

| Row | Capability | Disposition |
| --- | --- | --- |
| R01 | `hasUnpaid` unpaid-existence count (`oracle:553-573`, target client at `:561-563`) | Direct → **AC10** |
| R02 | Co-mingled attribution `belongsToChildOfClient` (`oracle:137-142`) + `belongsToDelegate` (`oracle:143-146`) | Direct → **AC13** |
| R03 | `hasPendingPaymentInstructions` AWAITING_CLIENT (`oracle:93-100`) | Direct → **AC8** |
| R04 | `unifiableCount(clientId)` (`oracle:37-43`) + `getConsolidatableTotal` (`oracle:574-592`) | **Renamed** → **AC2** `useMeta().consolidatableCount`, over its own dedicated count query (was `Absorbed-by`; re-dispositioned 2026-09-08 — `parity.yaml` `R04`) |
| R05 | `getWithParams` richer include set — the **eight** of its twelve relations this story serves (`oracle:250-276`, array `:255-268`) | Direct → the `loadOne` include set below |
| R06 | `isCreditNote` (`oracle:111-115`) + `is_consolidation`-first label precedence (`oracle:175-180`) | Direct → **AC7** |
| R07 | Staff actor (`oracle:25-33`, `:277-540`) | Dropped — operator deprecation ruling |
| R08 | `partial_amount_to_credit` (bare) | Dropped-with-issue-reference — `packages/types` is a submodule outside the write lane |
| R09 | `balance` post-consolidation divergence (`foundation.md:27`) | Direct → **AC11** |
| R10 | `category` relation + `category.slug` semantics | Direct → **AC7**, trusting the enum not the doc |
| R11 | `original_invoice` + `duplicate_invoice` (`oracle:266-267`) — render the admin duplicate flow (`oracle:516-540`) | Dropped-with-issue-reference — the 2026-09-01 staff/admin ruling; inference stated so it can be rejected |
| R12 | `data` + `account.user` (`oracle:256-257`) — reach no VM field; `getWithParams`' only consumers are the PN-1 payment modals | Dropped-with-issue-reference — operator ruling 2026-09-08, *"Sign the drop — covered by PN-1"*; `signoff: op:dom@upmind.com:2026-09-08`, no tracker issue owed. H2 closed in `review-notes.md`; the inference is stated in `parity.yaml` so it can be rejected |

### Arms determination

Derived mechanically from the table above per clause 3 of the variance law
(`.claude/rules/code-composables.companion.md:60-62`): an `.{actor}.ts` arm
exists only where an actor has members **exclusive to it** or **overriding the
shared implementation**, measured against the shared factory.

**Derivation:** after the staff deprecation the parity table has exactly **one
non-dropped actor — `client`**. Clause 3 measures an arm against the shared
factory; with one resolving actor there is no second implementation to diverge
from and no member any actor holds exclusively. The `client×self` /
`client×client` difference is a **context** axis, not an actor axis, and contexts
are resolved inside the shared services factory by the `resolveClientId`
seam — clause 4 (`.as('self')` resolution owned by the scope builder). Live
receipt for exactly this shape:
`client-email-history.services.ts:205-207` — "`_scopeActor` is unused today —
with a single resolving actor (`client`) in both matrices (D6), there is no
per-actor member to select."

**Result: `arms: none` on all five layers** (services, actions, context, meta,
schemas). Each layer keeps the `scopeActor` parameter in its signature so a
future arm needs no call-site change, and each `scopedX()` switch ships with only
its `default:` case. Per clause 2 (fresh modules start armless) no `.{actor}.ts`
file is scaffolded. Machine-readable in `parity.yaml` under `arms:`.

---

## Reused vs New

| Concern | Reused (existing) | New (this story) |
|---------|-------------------|------------------|
| Status vocabulary | `InvoiceStatusGroups.UNPAID`, `InvoiceStatus`, `CreditNoteStatus`, `InvoiceCategoryCode` (`packages/types`) | — |
| Line-item / tax / client / currency shaping | `parseBasketProduct`, `parseTaxes`, `mapClient`, `mapAddress`, `mapCurrency` | — |
| Single-invoice mapping | `mapInvoice` core (`invoices.mappers.ts:14-41`) | extended with consolidation, attribution, balance, next-charge, bundle fields |
| Payment mapping | `mapPayments` (`:43-62`) | extended with attempt age + AWAITING_CLIENT signal |
| Transport + criteria | `query` module's `list()` / `query()` / `useUrl` / criteria channel | — |
| Collection lookups | `useCollection` (`packages/headless/src/utils`) | — |
| Scope | `createScopedComposable`, `ScopeActorTypes`, scope registry `remove` | the module's two scope matrices |
| Composable surface | — | `useInvoices`, `useInvoice` (rewritten scoped), 8 layer files |
| Schemas | — | `invoices.schemas.ts` (query pair + no form pair — see below) |
| Services | — | `invoices.services.ts` (renamed from `invoices.service.ts`) |

---

## Data Model

### New types (`invoices/invoices.types.ts`)

| Type | Fields | Notes |
|------|--------|-------|
| `InvoicesContextTypes` | `CLIENT = AccessRoleTypes.CLIENT` | The collection's only context member. Model: `client-email-history.types.ts:65-68`. |
| `INVOICES_SCOPE_MATRIX` / `InvoicesScopeMatrix` | `SELF: never`, `STAFF: never`, `CLIENT: InvoicesContextTypes.CLIENT`, `GUEST: never` | `STAFF: never` **states the deprecation in code**. `SELF: never` withdraws `.for()` only — `.as('self')` still resolves and falls through to the reading client's own id, which IS the `client×self` cell. Model: `client-email-history.types.ts:91-96` + its ruling docblock `:71-88`. |
| `INVOICE_SCOPE_MATRIX` / `InvoiceScopeMatrix` | all four `null as never` | The single read's all-`never` matrix. Its TYPE is passed as `createScopedComposable`'s `TMatrix`; the VALUE is not passed as a runtime argument; not re-exported from the barrel. Model: `client-email-history.types.ts:117-122`; law: `templates/SINGLE-READ.md`. |
| `Invoice` (extended) | adds `category`, `consolidation`, `attribution`, `bundle`, `nextChargeDate`; `summary` adds `balance`, `balanceFormatted` | See the field map below. |
| `Invoice["consolidation"]` | `isConsolidation`, `consolidationInvoiceId`, `consolidationStatus`, `creditInvoiceId`, `amountToCreditConverted`, `amountToCreditFormatted`, `amountCredited`, `toBeCredited` | AC5. The bare `partial_amount_to_credit` is absent from `packages/types` — R08. |
| `Invoice["attribution"]` | `isOwn`, `isChildOfClient`, `isDelegated`, `isSettleable` | AC13. `isDelegated` is false whenever the invoice's client has **any** parent (`oracle:144`) — the oracle's `belongsToDelegate` gate, not a reader comparison. Child-first mutual exclusion follows from it: a child row has a parent. *(Corrected 2026-09-08, Review blocker B4 — the module had required `parent === reader`, so a third party's sub-account row read as delegated and lost `isSettleable`.)* `isSettleable` is false for a delegated row (`invoiceStatusMsg.vue:118-124`). |
| `Invoice["bundle"]` | `productCount`, `isLarge`, `groups: InvoiceBundleGroup[]` | AC5 + AC6. |
| `InvoiceBundleGroup` | `contractId`, `contractsProductId`, `label`, `products: BasketProduct[]` | AC5's "grouped by originating subscription" — grouped on `contracts_product_id` (`packages/types/src/models/baskets.ts:157`), falling back to `contract_id` (`:155`), with un-linked lines in one trailing `null`-keyed group. |
| `Payment` (extended) | adds `attemptAgeMs`, `isAwaitingClient` | AC8. |
| `InvoiceUnpaidAmount` | `amount`, `amountConverted`, `amountFormatted`, `currencyId` | AC1's response shape for the standalone re-read. |
| `InvoicePaymentDetailsModel` | `payment_details_id: string \| null` | AC4. **Nullable on purpose** — see the AC4 decision. |
| `InvoiceQueryModel` | `filters`, `sort`, `pagination` | The criteria model type the query schema governs. |
| `InvoicesServices` | `queryKey`, `clientId`, `isAvailable`, `error`, `loadList`, `loadOne`, `loadUnpaidAmount`, `loadUnpaidExistence`, `updatePaymentDetails` | Hand-declared (the `scopedServices()` switch needs one type to unify on). Model: `templates/query/{module}.types.ts:164-223`. |
| `InvoicesSchemas` | `useQuerySchema`, `useQueryUischema`, `useSortUischema` | No form pair — see the schemas note. |
| `InvoicesListQuery` / `InvoiceItemQuery` | aliases of the platform's `ListQuery` / `SimpleQuery` | **Never** derived with `ReturnType<typeof localServiceFn>` (`query.types.ts`'s own ban). |

### Field map — wire → VM (the Code stage's checklist)

| VM field | Wire receipt | AC |
|---|---|---|
| `summary.balance`, `summary.balanceFormatted` | `balance` / `balance_formatted` on `IBasket`; divergence documented `foundation.md:27` | AC11 |
| `consolidation.isConsolidation` | `packages/types/src/models/invoices.ts:67` | AC5 |
| `consolidation.consolidationInvoiceId` | `packages/types/src/models/baskets.ts:37` | AC5 |
| `consolidation.consolidationStatus` | `packages/types/src/models/baskets.ts:38` (numeric — **not** a boolean) | AC5 |
| `consolidation.creditInvoiceId` | `packages/types/src/models/baskets.ts:43` | AC5, AC7 |
| `consolidation.amountToCreditConverted` / `…Formatted` | `packages/types/src/models/invoices.ts:75` / `:76` | AC5 (R08) |
| `consolidation.amountCredited` | `packages/types/src/models/invoices.ts:72` | AC5 |
| `consolidation.toBeCredited` | `packages/types/src/models/invoices.ts:95` | AC5 |
| `bundle.productCount` | `packages/types/src/models/invoices.ts:90` (`products_count`, requires `with_count=products`) | AC6 |
| `bundle.isLarge` | derived: `productCount > 5` | AC6 |
| `bundle.groups` | grouped on `baskets.ts:157` / `:155` | AC5 |
| `nextChargeDate` | `packages/types/src/models/invoices.ts:70` (typed non-nullable; `foundation.md:175` says nullable — **tolerate absent/null**) | AC9 |
| `attribution.isChildOfClient` | `clients.ts:74` → `:179` (`client.parent_client_config.parent_client_id`) vs the reading client's id | AC13 |
| `attribution.isDelegated` | `invoices.ts:63` (`delegate_related`), gated child-first | AC13 |
| `category.slug`, `category.label` | `baskets.ts:31-32`; enum `invoices.ts:129-138`; label precedence `oracle:175-180` | AC7 |
| `payments[].attemptAgeMs` | derived from `payment.created_at` (`invoices.mappers.ts:57`) | AC8 |
| `payments[].isAwaitingClient` | `payment.gateway.type === GatewayTypes.AWAITING_CLIENT` (`oracle:93-101`) | AC8 |
| `meta.paymentState` | `PAYMENT_STATE` (`invoices.types.ts:8-16`) — the dead enum, now wired | — |

---

## Service Layer

### Reused services

| Function | Source | How used |
|----------|--------|----------|
| `list` / `query` / `post` / `patch` / `useUrl` | `packages/headless/src/modules/query` | The whole transport. `useUrl` prepends the `"api"` context (`utils/useUrl.ts:20-26`) — so `useUrl("invoices")` is `api/invoices`. |
| `useActiveSession().useContext().activeUser` | `session-store/useSession.context.ts:21` | The self fall-through inside `resolveClientId`. |

### New services (`invoices/invoices.services.ts`)

One factory, `createInvoicesServices(scopeActor, scopeContext)`, serving **both**
composables — the model is `client-email-history.services.ts:195-212`, whose own
docblock (`:28-33`) states why: "one identity seam, one cache key, one
arm-resolution switch, so the two composables can never disagree about whose
history is being read."

```
export const queryKey: QueryKey = ["invoices"];        // unchanged from today

function resolveClientId(scopeContext?: ScopeContext) {  // THE one seam
  const { activeUser } = useActiveSession().useContext();
  return computed(() =>
    scopeContext?.type === InvoicesContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );
}
const isAddressable = (clientId?: string) => isAuthenticated.value && !!clientId;
```

`resolveClientId` compares the **context**, never the actor — variance-law
clause 4. Model: `client-email-history.services.ts:59-67` and its note `:55-57`.

| Function | Verb + URL | Notes |
|----------|-----------|-------|
| `loadList(params?)` | `GET api/invoices` via `list({ criteria: { schema: useQuerySchema() } })` | AC2 / AC12. The **only** request-state channel. `queryKey: [...queryKey, { client: clientId }]`. `placeholderData: keepPreviousData`. **Applies the resolved target as the declared `client_id` filter column** via `trackClientIdFilter` (`invoices.services.ts:137-152`, called at `:258`), reactively and with `{ immediate: true }`, so the retarget and the `select: raw => mapInvoices(raw, clientId.value)` attribution input (`:253`) cannot disagree. It then returns `withDurableClientId(handle, clientId)` (`:260`, helper `:195-215`) — the one handle every published verb shares — which makes that column **durable**: `criteria.set` merges at branch level (`query/useQueryCriteria.ts:100-101`), so a `filters`-branch write omitting `client_id` would drop it; the wrapper re-asserts it inside the caller's own `filters` object, unless the caller declared `client_id` itself (`:203`), which keeps `setCriteria`'s manual-retarget door open. Closes blocker H1 — see `review-notes.md`. |
| `loadOne(invoiceId?)` | `GET api/invoices/{invoiceId}` via `query()` | Replaces `loadInvoice`. `queryKey: [...queryKey, "invoice", invoiceId, { client: clientId }]`. An **absent id issues NO request** (`templates/query/{module}.services.ts:108-111`). |
| `loadUnpaidAmount(invoiceId?, currencyId?)` | `GET api/invoices/unpaid_amount/{invoiceId}` | AC1. `oracle:621-633`. Currency rides as a declared service argument → query param, not criteria (a single read has no criteria channel). `staleTime: 0` so a currency change re-reads. |
| `loadUnpaidExistence()` | `GET api/invoices` with `criteria` carrying the unpaid status filter, **the target `client_id` filter** + `pagination.limit: 1` | AC10 / AC12. `oracle:553-573`. Its **own** query key `[...queryKey, "unpaid_existence", { client }]`, its own criteria object, no relations. **`client_id` is applied through `trackClientIdFilter` (`invoices.services.ts:394`)** — the oracle's own conditional seeding at `oracle:561-563` reproduced. Corrected 2026-09-08: this row previously described the read with no `client_id` at all while the cell claimed `Direct` against that exact range, which is how Review blocker B1 (the read answered for the *reading* client, with no caller remedy) went undisclosed. Was never exposed to H1 — its criteria object is private to the factory, so no published verb can replace its `filters` branch. Returns the server total (via `.pagination.value.total`); the composable derives the boolean. `limit: 1`, not the oracle's `limit: "count"` (`oracle:559`) — see the sentinel note below and `requirements.md` AC10's "Oracle divergence". |
| `loadConsolidatableCount()` | `GET api/invoices` with `criteria` carrying the consolidatable filters (including the target `client_id`) + `pagination.limit: 1` | AC2 / AC12 / `R04`. `oracle:37-43` + `:574-592`, whose `filter[client_id]` is unconditional at `oracle:585`. Its **own** query key `[...queryKey, "consolidatable_count", { client }]` and its own criteria object, so reading the notice count can never mutate the list `filterConsolidatable()` narrows — the two coexist. `client_id` is seeded at mint by `consolidatableCountCriteria(clientId.value)` (`invoices.services.ts:425`) **and** kept in step by `trackClientIdFilter` (`:443`), so a self-scope whose id resolves after construction is covered too. Was never exposed to H1, same reason as above. Same `limit: 1` divergence. |
| `updatePaymentDetails(invoiceId, model)` | `PATCH api/invoices/{invoiceId}/payment_details` | AC4. `oracle:288-301`. Body is `InvoicePaymentDetailsModel` — see the AC4 decision. |

`scopedServices(scopeActor, scopeContext)` ships with only its `default: return {}`
case (arms: none).

### The include sets — named exactly, and they may not shrink

**`loadOne` `with=` — the existing 16 relations (`invoices.service.ts:22-37` on
`develop`; the array spans `:21-38`) are the floor. Nothing on that list may be
dropped.** All 16 are present, in the same order, at
`invoices.services.ts:58-73`. *(Count corrected 2026-09-08: this said 17. The
floor claim itself held — only the count was wrong.)* Added:

```
brand, taxes, client, status, contract, payments, payments.payment_details,
products, promotions, client.tags, products.tags, taxes.tax_tag_data,
custom_fields.field, affiliate_commissions, products.product.image,
account.affiliate_referral.affiliate_account.account.client,
+ address, address.country          <- FIXES A LIVE BUG (see below)
+ category                          <- AC7 (category.slug + label precedence)
+ payments.gateway                  <- AC8 (AWAITING_CLIENT discrimination)
+ payments.payment_type             <- oracle:265 parity (R05)
+ payment_details                   <- AC4 (read back the assigned method)
+ gateway                           <- oracle:261 parity (R05)
+ client.parent_client_config        <- AC13 (sub-account attribution)
+ last_payment_log                  <- AC8 (pending_payment_method is gated on it,
                                        invoices.ts:80-86)
```
`loadOne` `with_count=`: `products` — AC6.

**Live bug fixed in passing:** `mapInvoice` maps `raw.address`
(`invoices.mappers.ts:64`; `develop`'s `invoices.mappers.ts:21`), but
`address` is absent from today's `with=` set — so the mapped address is always
`undefined`. `orders/order.services.ts:34-35` requests it; invoices never did.
Adding `address,address.country` makes an already-declared VM field real. Not a
new capability; a mapping that never had its data.

**`loadList` `with=`** — the oracle's list is deliberately leaner than its detail
read (`oracle:47-64` `withParam`):

```
client, client.image, client.parent_client_config, brand, status, category,
products, last_payment_log
```
`loadList` `with_count=`: `products` — AC6 on list rows.

`loadUnpaidExistence` requests no relations (count only).

---

## Component Architecture

### File layout (per `templates/query/README.md:69-90`)

```text
invoices/
├── invoices.types.ts
├── invoices.services.ts        # renamed from invoices.service.ts
├── invoices.mappers.ts         # extended; @internal marker restructured
├── invoices.schemas.ts         # NEW
├── useInvoices.ts              # NEW — the collection
├── useInvoices.actions.ts      # NEW
├── useInvoices.context.ts      # NEW
├── useInvoices.meta.ts         # NEW
├── useInvoices.internals.ts    # NEW
├── useInvoice.ts               # REWRITTEN — the scoped single read
├── useInvoice.actions.ts       # NEW
├── useInvoice.context.ts       # NEW
├── useInvoice.meta.ts          # NEW
├── useInvoice.internals.ts     # NEW
├── index.ts                    # rewritten barrel
├── README.md                   # NEW (module-root, internal-facing)
└── docs/foundation.md          # existing; corrections owned by the Docs stage
```

No `.{actor}.ts` file (arms: none). No `invoices.machine.ts` (query variant).
No `__tests__/` — prover seat.

### `useInvoices` (collection)

```ts
function createInvoicesForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;
  const service = createInvoicesServices(actorScope, config.context);
  const query = service.loadList();          // minted ONCE per scope
  return {
    useActions: () => createInvoicesActions(actorScope, service, query, scopeKey),
    useContext: () => createInvoicesContext(actorScope, query, service),
    useInternals: () => createInvoicesInternals(actorScope, query),
    useMeta: () => createInvoicesMeta(actorScope, query, service)
  };
}
export const useInvoices = createScopedComposable<
  ReturnType<typeof createInvoicesForScope>, InvoicesScopeMatrix
>("invoices", createInvoicesForScope);
```

Consumer surface: `useInvoices().as('self')` (AC1-AC11) ·
`useInvoices().as('client').for('client', id)` (AC12-AC13).

### `useInvoice` (single read)

Same four layers over `service.loadOne(config.id)`. **Two type arguments, no
third runtime argument** — dropping `InvoiceScopeMatrix` falls back to the wide
`ActorContextMatrix` and re-opens `.for("anything", id)`
(`templates/SINGLE-READ.md`, "The all-`never` matrix"). Consumer surface:
`useInvoice().withId(id)` · `useInvoice().as('client').for('client', c).withId(r)`.

**Breaking change, declared:** `useInvoice(invoiceId)` becomes
`useInvoice().withId(invoiceId)`. Grep confirms **zero consumers** outside the
module (`grep -rn "useInvoice\b"` across `packages`, `apps`, `playgrounds` returns
only the module itself and the barrel). Nothing to migrate.

### The four layers — exact members

**`useInvoices.actions.ts`** — `destroy()` (registry `remove(scopeKey)`) ·
`isReady()` (the session-gated readiness; `enabled:` disables the query until
authenticated so a bare `refetch()` would report ready over an empty list —
`templates/query/use{Module}.actions.ts:70-89`) · `refresh()` ·
`invalidate()` · `setCriteria` (`query.setCriteria` — **the single write verb**
for filters/sort/pagination) · `sortBy(field, dir)` ·
`assignPaymentMethod(invoiceId, paymentDetailsId | null)` (AC4; invalidates the
list and the item key) · `refreshAfterPayment()` (AC3 — the list-side refetch).

**`useInvoices.context.ts`** — `data` (always an array) · `error`
(`query.criteriaError.value ?? query.error.value`) · `findOne` · `getOne` ·
`pagination` (`query.pagination`) · `query` (`query.criteria`, **read-only
republished, never copied** — `client-email-history/useClientReceivedEmails.context.ts:73`) ·
`total` (**this scope's own list row total** for the published list criteria — `computed(() => query.pagination.value.total)`, `useInvoices.context.ts:92`, `@decision` `:79-91`. It is **NOT** the consolidation-notice count; that is `useMeta().consolidatableCount` over its own dedicated query. *Corrected 2026-09-08: this line conflated the two, and the member published the handle's bare `query.total`, which is a `ref(0)` refreshed only as a side effect of reading `.pagination`/`.meta` — Review blocker B3, permanently `0`.*) ·
`schemas: { query: { schema, uischema, sortUischema } }` (plain JSON, the
renderer's only door — `client-email-history/useClientReceivedEmails.context.ts:76-86`).

**`useInvoices.meta.ts`** — `hasError` · `isEmpty` · `isLoading` ·
`isFiltered` · `hasUnpaid` (AC10, from `loadUnpaidExistence`'s own query,
`useInvoices.meta.ts:63-66`) ·
`consolidatableCount` (AC2 / `R04`, from `loadConsolidatableCount`'s own
query — **never** the list query, so the notice count and the visible list
coexist; `useInvoices.meta.ts:80-83`) · `isAvailable` (`service.isAvailable`). Reading either count flips
that count query's request gate, so a scope nobody asks issues no count
request. **Both counts, and the context `total` above, read
`.pagination.value.total` and never the handle's bare `total.value`** — the
`@decision` at `useInvoices.meta.ts:46-61` carries the argument. A bare
`.total` read is pinned at `0` forever (`ListQuery.total` is a `ref(0)`
refreshed only as a side effect of reading `.pagination`/`.meta`). Not a query-
module change (operator ruling 2026-09-08, "do not chnage any query stuff"):
both fields already exist on every `ListQuery`.

**`useInvoices.internals.ts`** — `actorScope` · `query` · `clientId`
(diagnostics: which client this scope resolved to — the `client×client` receipt) ·
`translateQuery(query.schema, query.criteria.value)` (the wire the live criteria
BUILDS, requested by nothing — `client-email/useClientEmails.internals.ts:26-28`).

**`useInvoice.*`** mirrors the collection's shape over the item query, adding
`unpaidAmount` + `refreshUnpaidAmount()` (AC1) to actions/context, and
`paymentState` (the wired `PAYMENT_STATE`), `isPaid`/`isFree`/`isPartiallyPaid`/
`isPending`/`isLocked`/`isSettleable` to meta.

---

## The criteria surface (the page is derived from THIS section)

**Criteria-subversion law.** `invoices.schemas.ts`'s `useQuerySchema()` owns ALL
request state — filters, sort, pagination, limit — and it reaches the wire only
through `list({ criteria: { schema: useQuerySchema() } })`. No raw `filter[...]`
string, no raw sort string, no raw limit/page literal is written anywhere in this
module. `additionalProperties: false` at every level makes an undeclared column
or operator unspellable.

### The four banned oracle shapes → their declared equivalents

| Oracle shape | Receipt | Declared equivalent |
|---|---|---|
| `"filter[status.code]": getters["unpaidStatuses"].join()` | `oracle:558-563`, `:581-587` | `filters["status.code"].in` — values from `InvoiceStatusGroups.UNPAID` |
| `"filter[client_id]": payload.clientId` | `oracle:558-563`, `:581-587` | `filters.client_id.eq` — **the `client×client` retarget column** |
| `limit: "count"` | `oracle:559`, `:581` | `pagination.limit` **declares** the `"count"` sentinel, but no preset spells it and it cannot reach the wire — the delivered count reads send `limit: 1`. See the note below. |
| Consumer-side `"filter[category.slug]": [...]` | `creditNotesTable.vue:207-212`, `:225-230` | `filters["category.slug"].in` + `filters.credit_invoice_id.eq` |
| Split filter/sorter files in `src/data/` | `filters/invoice.ts:21-118`, `sorters/invoices.ts:5-33`, `filters/creditNotes.ts:6-41`, `sorters/creditNotes.ts:4-21` | ONE schema: the filter columns and the sort enum below. No parallel list. |

**The `"count"` sentinel — declared, dormant, and NOT what ships.**
`limit: "count"` is how the oracle asks for the total with no rows
(`oracle:559`, `:581`), and the BE understands it. Hand-appending it would
subvert the criteria law, so it is **declared** in the schema:
`limit: { oneOf: [{ type: "integer", minimum: 0 }, { const: "count" }] }`
(`invoices.schemas.ts:207-212`). `minimum: 0` — not 1 — keeps `limit: 0` legal
for one unpaged page (`templates/query/{module}.schemas.ts:250-252`).

**It cannot reach the wire, so the delivered count reads send `limit: 1`
instead.** `withPageWindow` (`packages/headless/src/modules/query/query.utils.ts:603-627`)
merges a hard-coded `limit: { type: "integer", minimum: 0, default: PAGINATION.limit }`
(`:614-618`) beneath every module's declared pagination schema, and
`useValidation`'s `safeValue` dispatches on that merged `type` alone, never
consulting `oneOf` (`packages/headless/src/utils/useValidation.ts:539-542`) — so
`"count"` is non-finite, is discarded, and `PAGINATION.limit` = `10`
(`query.utils.ts:72`) is substituted before the model reaches the wire. The
sentinel is therefore unspellable through `list()`'s validated criteria channel
for **any** module. Fixing that is a query-core change the operator withdrew on
2026-09-08, verbatim: **"do not chnage any query stuff"** —
`packages/headless/src/modules/query/**` and `useValidation.ts` are off limits
for this story. Both count presets below send `pagination.limit: 1`, the
smallest normal page that leaves the oracle's own `response.total > 0` contract
(`oracle:572`) intact. The declaration stays (deleting it would lose the oracle
shape from the schema, and it costs nothing dormant), carrying the `@decision`
at `invoices.schemas.ts:304-328`. Capability argument and full receipt:
`requirements.md` AC10's "Oracle divergence" note; `parity.yaml` `R01`, `R04`.

### Filter columns — one entry per column, only the operators the API serves

| Column | Operators | Oracle receipt | Drawn in the bar? |
|---|---|---|---|
| `id` | `eq` | `filters/invoice.ts:22-27` | no (URL-only) |
| `number` | `eq` | `filters/invoice.ts:41-46`; `filters/creditNotes.ts:7-12` | yes — search-shaped control |
| `status.code` | `in` | `filters/invoice.ts:91-118`; widened to admit `CreditNoteStatus.{ALLOCATED,UNALLOCATED}` (`data/enums/invoice.ts:19-22`) for AC7 | yes — multi-select |
| `client_id` | `eq` | `oracle:559-562`, `:585` | no (set by the scope context, AC12) |
| `is_consolidation` | `eq` (tri-state `[true,false,null]`) | `oracle:583` | yes — button group |
| `category.slug` | `in` | `oracle:584`; `creditNotesTable.vue:207-212`; enum `invoices.ts:129-138` | yes — multi-select (AC7 preset) |
| `credit_invoice_id` | `eq` | `creditNotesTable.vue:225-230` | no (set when scoping to one invoice) |
| `paid_amount` | `eq` | `oracle:586` | no (used by the consolidatable preset) |
| `total_amount` | `eq` | `filters/invoice.ts:47-52`; `filters/creditNotes.ts:13-18` | yes |
| `net_amount` | `eq` | `filters/invoice.ts:54-59` | yes |
| `total_discount_amount` | `eq` | `filters/invoice.ts:61-66` | no (URL-only) |
| `create_datetime` | `eq`, `gte`, `lte` | `filters/invoice.ts:78-83`; `filters/creditNotes.ts:34-39`; the `created_at|after` relative param `oracle-side filters/invoice.ts:18-20` | yes — date range |
| `due_date` | `eq`, `gte`, `lte` | `filters/invoice.ts:85-90` | yes — date range |
| `proforma` | `eq` (tri-state) | `filters/invoice.ts:29-39` | no (URL-only) |
| `fraud_status` | `in` | `filters/invoice.ts:68-76` | **no** — declared for parity, deliberately undrawn for a client bar (a declared-but-undrawn column is filterable by URL and absent from the bar, `templates/query/{module}.schemas.ts:303-306`) |
| `contracts.id` | `eq` | `creditNotesTable.vue:219-222` | no (set when scoping to a contract) |
| `products.contracts_product_id` | `eq` | `creditNotesTable.vue:223-226` | no (set when scoping to a product) |

Every column's `title` is an i18n key — the only label channel the sort control
has (`templates/query/{module}.schemas.ts:176-177`).

### Sort enum — the WHOLE vocabulary of sortable columns

`field: { enum: ["create_datetime", "number", "total_amount", "net_amount", "status", "paid_datetime", "due_date", "cancellation_datetime"] }`
· `dir: { enum: [SortDirection.ASC, SortDirection.DESC] }`

Receipts: `sorters/invoices.ts:5-33` (`total_amount`, `status`,
`create_datetime`, `paid_datetime`, `due_date`, `cancellation_datetime`) +
`sorters/creditNotes.ts:4-21` (`number`, `total_amount`, `status`,
`create_datetime`). Boot default: `[{ field: "create_datetime", dir: DESC }]`,
`minItems: 1`, `uniqueItems: true`.

### Pagination

`limit` (see the sentinel note) · `offset` (`integer`, `minimum: 0`).

### The four criteria presets the ACs need

Presets are **criteria models**, not new endpoints — each is spelled entirely in
declared columns. Two of them seed a **dedicated count query's own** criteria
object (never `setCriteria` on the list); the other two are `setCriteria`
payloads that narrow the visible list:

| Preset | Model | Applied to | AC |
|---|---|---|---|
| Unpaid existence | `{ filters: { "status.code": { in: InvoiceStatusGroups.UNPAID } }, pagination: { limit: 1 } }` | `loadUnpaidExistence()`'s own query | AC10 |
| Consolidatable **count** | the row below's filters, `+ pagination: { limit: 1 }` | `loadConsolidatableCount()`'s own query | AC2 / `R04` |
| Consolidatable **list filter** | `{ filters: { "status.code": { in: UNPAID }, is_consolidation: { eq: false }, "category.slug": { in: [RECURRENT] }, client_id: { eq: <resolved> }, paid_amount: { eq: 0 } } }` — filters only, no pagination override | `setCriteria` on the list, via `filterConsolidatable()` | AC2 |
| Credit notes | `{ filters: { "category.slug": { in: [CREDIT_NOTE, CREDIT_NOTE_FOR_REFUND] } } }`, plus `credit_invoice_id: { eq: <id> }` when scoped to one invoice | `setCriteria` on the list, via `filterCreditNotes()` | AC7 |

**Why the consolidatable capability is two presets, not one.** The oracle serves
the count from a dedicated per-client scope (`oracle:37-43`, `:574-592`) *without
disturbing the list the client is reading*. One preset over the one list query
cannot do both at once — `generateScopeKey` keys the collection on
`(module, actor, context)` alone, so two `.as(CLIENT)` calls return the same
registry instance and the same list query. Splitting the count onto its own query
(its own key, its own criteria object) is what makes the notice count and the
client's own list coexist. Receipt for the failure this closes:
`verify.md:157-172`; disposition: `parity.yaml` `R04` (`Renamed`).

Both `limit: 1` values are the sentinel divergence recorded above — not
`limit: "count"`.

### No FORM schema pair

`invoices.schemas.ts` ships `useQuerySchema` / `useQueryUischema` /
`useSortUischema` and **no** `useSchema` / `useUischema` / model parser. Reason:
the module has no edit form. AC4's write is a single nullable id — see the
decision below. `client-address/client-address.schemas.ts`'s query-only minimum
is the precedent for a schemas file that declares only what its surface needs.

---

## Flow Design

No `flow.md` and no machine: the query variant has no state machine, so there is
no transition table to draft (`templates/NOT-APPLICABLE.md`, `query/` row;
`code-composables.md` Part B "State Machine vs TanStack Query"). The state is the
query handle. The one non-trivial round trip:

1. A consumer calls `useInvoices().as('self')` (or `.as('client').for('client', id)`).
2. The scope builder resolves the actor, folds the context into the scope key, and calls the factory ONCE. `service.loadList()` mints ONE query for that scope key.
3. `resolveClientId(scopeContext)` returns a `computed`: the context's id when the context is CLIENT, else `activeUser.id`. This value is the cache-key partition and the `client_id` filter's value — **not** a path segment.
4. `list()` parses the criteria model against `useQuerySchema()`, validates it, builds the wire query string, and publishes the accepted criteria back on the handle. A consumer reads `context.query`; it never holds its own copy.
5. `setCriteria({ filters })` merges one branch into the model; the query key changes; TanStack refetches with `keepPreviousData` so the table does not blank.
6. `select: mapInvoices` maps in the **services** layer, never in the context layer.
7. Ownership: this module OWNS the invoice reads, the criteria model, the assigned-method write, and the mapped VM. It DELEGATES the session/identity to `session-store`, the transport and criteria translation to `query`, the charge attempt to `payment`, and the method picker to `payment-details`. It OBSERVES payment outcomes and refetches.

---

## Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| `session-store` | `activeUser` for the self fall-through; `isReady()` for the auth gate | `useSession.context.ts:21`. **No dependency on FE-3036** — the target client id arrives on `.for('client', id)` and the attribution inputs are on the invoice payload. FE-3036's `isDelegated(record)` helper is the generic form of AC13's derivation; this module derives invoice-locally so the edge stays at zero and FE-3036 can absorb it later without a contract change. |
| `query` | `list`/`query`/`patch`/`useUrl`, the criteria channel, `translateQuery` for diagnostics | The only transport. |
| `orders` | `order.machine.ts:4`,`:175` imports `mapInvoice` | Stays green — see the barrel decision. |
| `payment` / `payment-details` | Out of scope (PN-1); this module exposes the refetch AC3 needs | `foundation.md:466-469`. |
| Playground (`labs-nuxt`) | The scenario lane derives `useInvoices/` from the criteria surface above | The target client id for AC12/AC13 arrives as a scope-suffix route parameter (`playgrounds/labs-nuxt/modules/scenarios/index.ts:79`), so no delegate picker — and no FE-3036 — is needed to drive the page. |
| `packages/types` | Read-only. It is a git **submodule** and outside this run's write lane | R08's bare-field gap is therefore deferred, not fixed. |

---

## Edge Cases

| Case | Handling |
|------|----------|
| No target client and no session client | `isAddressable` false → `enabled` false and `guard` rejects with `NotAuthenticatedError`. No request. |
| `.withId()` never called on the single read | Absent id issues **no** request — the un-addressed state, not a fetch of `.../undefined`. |
| Criteria model fails schema validation | `query.criteriaError` populated; the context's `error` reports it ahead of the transport error; **no request goes out**. |
| An undeclared filter column or operator | Unspellable — `additionalProperties: false`. A compile/validation failure, not a silent pass-through. |
| Empty list vs filtered-empty list | `meta.isEmpty` plus `meta.isFiltered` (read through from the published criteria) so a consumer can distinguish "you have none" from "none match". |
| Consolidated invoice where `balance ≠ unpaid_amount` | Both mapped and exposed distinctly (AC11). The consumer chooses; the module never silently picks one. |
| `next_charge_date` absent on a non-recurring invoice | Mapped to absent. The type says non-nullable (`invoices.ts:70`), the doc says nullable (`foundation.md:175`) — the mapper tolerates missing/null and never produces an epoch date. |
| `products` truncated while `products_count` present | `bundle.isLarge` derives from `products_count` only (AC6). `bundle.groups` groups whatever rows arrived and is not used for the count. |
| Both attribution inputs present on one row | Child wins; `isDelegated` false — the ANY-parent gate at `oracle:144` already excludes it (`invoices.mappers.ts:142`). |
| A delegated row | `attribution.isSettleable` false (`invoiceStatusMsg.vue:118-124`). |
| Currency changed on the unpaid-amount re-read | `staleTime: 0` + the currency in the query key → a second request, never a cache hit (AC1). |
| Clearing the assigned method | `payment_details_id: null` is a **present** key in the PATCH body (AC4). |
| Readiness poll | Inherit the template's shape but **cap it** — the uncapped 100 ms poll at `useInvoice.ts:46-59` is a known stall pattern; the actions layer's `isReady()` carries a bounded attempt count and resolves false on exhaustion. |

---

## Key Decisions

### D1 — AC4 stays `query`: fire-and-forget PATCH, nullable model

**Decision:** implement AC4 as one services mutation
(`updatePaymentDetails(invoiceId, model)`) wrapped by one actions member, with
`InvoicePaymentDetailsModel = { payment_details_id: string | null }`. Variant
stays `query`.

**Why:** the oracle's `updatePaymentDetails` (`oracle:288-302`) is a bare
`data/callApi` with `Methods.PATCH` and `requestConfig: { data }` — no schema, no
model parser, no validation flow, no optimistic state, no multi-field form. Every
schema-driven editor in the oracle is `apiPath().admin`-bound (`oracle:277-540`)
and falls away with the staff deprecation. `'None selected'` as a first-class
state is a **request-model** concern: an explicit `null` makes clearing the method
distinguishable from "don't touch it", and that distinction is provable as an
outbound request-contract assertion rather than as UI state.

**Rejected:** the `hybrid` manager (`dataManagerMachine`-backed per-entity
editor). Rejected because the oracle exposes no client-context form editor for
this write, and minting one would claim a capability the oracle does not have.

**Overturn condition (a HALT, not a stretch):** if the brief requires a validated
multi-field method editor with dirty-state and cancel semantics, the variant
becomes `hybrid` and that is an operator halt with both determinations shown.
Never stretch the query template to fake a manager.

### D2 — The barrel leak: fix the marker, not the export

**Decision:** keep `mapInvoice` as a curated named re-export from `index.ts`, add
`mapInvoices` beside it, and **restructure the `@internal` marker**: drop the
blanket `/** @internal */` at `invoices.mappers.ts:1` and mark the genuinely
private helpers (`mapPayments`, the grouping helper) individually. `orders`
changes **not at all** and stays green.

**Why:** the Module Visibility Law bans cross-module import of the mappers
*file* and wholesale barrel re-export; it explicitly permits "curated named
re-exports only" (`templates/query/index.ts:14-27`). The violation today is a
marker/reality mismatch — a file declared `@internal` whose member is
curated-re-exported and consumed by `orders/order.machine.ts:4`,`:175`. Fixing the
marker makes the public surface honest and serves the consumer properly, which is
what the barrel is for.

**Rejected:** (a) leaving the blanket marker — keeps shipping a false `@internal`;
(b) rewriting `orders` to consume `useInvoice().withId(id)` — `orders` holds a raw
`IInvoice` from its own request and has no query to hand it; rewriting it also
touches a protected-core machine for no capability gain.

### D3 — `PAYMENT_STATE` is wired, not deleted

**Decision:** wire it. `useInvoice.meta.ts` exposes `paymentState:
Ref<PaymentState>` derived from `paid_amount` / `unpaid_amount` / `payments[]`,
alongside the existing booleans.

**Why:** the enum's five members (`complete`/`free`/`partial`/`failed`/`pending`,
`invoices.types.ts:8-16`) are exactly the capability the module's own doc declares
at `foundation.md:59-63` (Operations row 3, "Derive payment state"), and
`useInvoice.ts:24-44` already computes those same five states as four booleans
that can disagree with each other. One discriminated value removes that
possibility and removes dead code without dropping anything.

**Rejected:** deletion — it would drop a typed vocabulary the oracle's own
Operations row names, on tidiness grounds.

### D4 — AC7 restated: credit notes are a criteria preset, not a resource

**Decision:** AC7 is delivered as `category.slug` + `credit_invoice_id` declared
filter columns on the ONE `useQuerySchema()`, `status.code` widened to admit
`CreditNoteStatus`, the `category` relation added to both include sets, and the
`is_consolidation`-first label precedence mapped onto the VM. **No
`credit-notes` module, no `useCreditNotes`, no new endpoint.**

**Why (the parity oracle is authoritative over the AC text —
`rules/verify-parity-oracle.md`):**

1. No credit-notes data module exists — `ls vue-app/src/store/modules/data/` returns 65 entries and none is credit-notes; `grep -rl "credit_notes\|creditNotes" src/store/modules/data/` matches only `invoices/index.ts`.
2. No credit-note endpoint exists — `grep -rn "api/[a-z_/]*credit" src/` across the whole oracle app returns zero.
3. The credit-notes table reads the invoices list — `creditNotesTable.vue:207-212` filters `category.slug ∈ [credit_note, credit_note_for_refund]`; `:214-230` adds the client / contract / product / credit-partner filters.
4. Credit-note-ness is a derivation over an `IInvoice` — `oracle:111-115`.
5. The knowledge graph has **no `CreditNote` node** — 778-node traversal, zero hits.
6. The one genuinely credit-note-specific thing is the status vocabulary: `CreditNoteStatus` (`data/enums/invoice.ts:19-22`) differs from `InvoiceStatus` (`:1-11`), and the oracle filters credit notes on `status.code` with `ALLOCATED`/`UNALLOCATED` (`filters/creditNotes.ts:22-31`) — a query-schema concern, not a resource concern.

**Rejected:** building AC7 literally. A new resource with no oracle behind it is a
claimed capability — the `templates/SINGLE-READ.md` closing law and
`verify-cosplay.md` failure mode. Aggravating factor: `foundation.md:28` calls
`category.slug` "informational" and lists four slugs that do not exist, so a seat
trusting the module doc would build the wrong thing.

### D5 — R08: the bare `partial_amount_to_credit` is deferred, AC5 is still met

**Decision:** map `partial_amount_to_credit_converted`
(`packages/types/src/models/invoices.ts:75`),
`partial_amount_to_credit_formatted` (`:76`) and `partial_amount_credited`
(`:72`) onto `Invoice["consolidation"]`. Record the missing bare numeric field as
parity row R08, `Dropped-with-issue-reference`, with a Linear issue for the
types-package change.

**Why:** `packages/types` is a git **submodule** outside this run's write lane, so
adding the field is not available to this run. **AC5 is still met** — its
capability is "a client can see how much is queued for credit", and the
`_converted` (display-currency numeric) plus `_formatted` (locale string)
variants deliver exactly that; the bare field is the same quantity in the
invoice's own currency. **This is not a silent narrowing:** the AC's read-back
asserts the queued-credit amount is exposed, which the variants satisfy. **No
HALT** — a HALT would be warranted only if no served variant carried the
quantity, which is not the case.

### D6 — The staff deprecation is stated in code, not omitted

`INVOICES_SCOPE_MATRIX` carries `[ScopeActorTypes.STAFF]: null as never` with a
docblock recording the operator ruling, its date, and the oracle capability it
withdraws — the shape of `client-email-history.types.ts:71-88`. A matrix cell
states what the shipped code does, never what the wire can do. Omitting the actor
entirely would leave the deprecation invisible at the one place a reader looks.

---

## The capability list the module feature is derived from

The prover seat authors
`packages/headless/src/modules/invoices/__tests__/invoices.feature` from **this
list** (one scenario per capability). This plan does not author it.

| # | Capability | AC |
|---|---|---|
| C01 | Read the invoice collection with declared filters, sort and pagination | AC2 |
| C02 | Read one invoice in full by id | AC2/AC5 |
| C03 | Re-read the live unpaid amount for one invoice, and again on currency change | AC1 |
| C04 | Determine whether anything is unpaid at all, by count | AC10 |
| C05 | Count the consolidatable invoices for the notice / CTA | AC2 |
| C06 | Read credit notes as a category-filtered view of the same collection | AC7 |
| C07 | Tie a credit note back to the invoice it credits | AC7 |
| C08 | Label a consolidation credit note as a consolidation, not a refund | AC7 |
| C09 | Assign a payment method to one invoice | AC4 |
| C10 | Clear the assigned method to "none selected" | AC4 |
| C11 | Read the consolidation identity and credit fields | AC5 |
| C12 | Read bundled line items grouped by originating subscription | AC5 |
| C13 | Know a bundle is large without counting a truncated array | AC6 |
| C14 | Read the outstanding balance distinctly from the raw unpaid amount | AC11 |
| C15 | Read the next charge date when the invoice carries one | AC9 |
| C16 | Detect a prior pending payment and how long it has been pending | AC8 |
| C17 | Distinguish "awaiting the client" from "awaiting the gateway" | AC8 |
| C18 | Refetch the list after a payment outcome | AC3 |
| C19 | Retarget the collection at an entitled client | AC12 |
| C20 | Attribute each row as own / sub-account / delegated | AC13 |
| C21 | Mark a delegated invoice as not settleable by the reader | AC13 |
| C22 | Refuse the read when no client is addressable | edge case |
| C23 | Refuse an undeclared filter column or operator | criteria law |

---

## Open Questions

None blocking. Two items are recorded for other stages rather than resolved here:

1. **Docs stage:** correct `foundation.md:465` (denies `client×client`), `:28` (wrong `category.slug` list + "informational"), `:460` (false "no other module reads from invoices"), `:64` (assigns refresh-after-payment to invoices); regenerate §Operations (5 capabilities → 23) and §API-endpoints (1 endpoint → 4).
2. **Corpus drift from the staff deprecation:** `docs/adr/001-scope-based-composables.md:249-255` and `docs/reference/service-splitting-examples.md:36-64`,`:187` both still declare the staff arm. Also glossary: `docs/corpus/glossary.yaml:174-184` points `invoice` at `useInvoice`/`Invoice` only, and there is no term for credit-note / consolidation / delegate / unpaid-amount.
