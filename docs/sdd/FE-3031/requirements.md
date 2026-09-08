# Requirements: FE-3031

## Overview

Convert `packages/headless/src/modules/invoices/` from its current unscoped single-read
shape (M1) to a full scoped, query-backed module (M3) that serves **every
invoice-resource read/write the billing briefs need** — unpaid amount, list,
assigned method, consolidation fields, credit notes.

The module today ships one flat composable over `GET /invoices/{id}` and nothing
else: no collection, no criteria surface, no scope builder, no schemas, no
mutation. Eight of the nine original acceptance criteria land on surfaces that do
not exist. This story builds them, and restores four capabilities the parity
oracle exposes that the original AC set did not name.

**Module:** `packages/headless/src/modules/invoices`

**Mode:** `conversion` (M1 → M3). **Variant:** `query`.

**Parity oracle:** `/Users/dom/Documents/Upmind/vue-app/src/store/modules/data/invoices/index.ts`
(the legacy Vuex data module). Cited below as `oracle:<line>`.

## Parity Scope

<!-- ADR-001 actor × context. parity.yaml carries one cell per pair in the
     cross-product; ci/lint-plan-compliance.mjs enforces coverage. `staff` is
     declared so its operator-ruled deprecation is recorded as an explicit
     dispositioned row rather than a silent omission. -->

- Actors: [client, staff]
- Contexts: [self, client]

Resolved cell set for this run: **`client×self` + `client×client`** (both IN).
`staff×self` and `staff×client` are dispositioned as deprecated per the operator
ruling of 2026-09-01 — see `parity.yaml`.

## User Stories

### Client reading their own invoices (`client×self`)

**As a** client in the billing area,
**I want** to read my invoices — the list, one invoice in full, what I still owe,
which payment method is assigned, and how consolidation and credit notes affect
the document,
**so that** I can understand and settle my bill without leaving the panel.

#### Acceptance Criteria

- [ ] **AC1** A client can re-read the live unpaid amount for one invoice, on demand and after a currency change, without re-reading the whole invoice.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "the live unpaid-amount re-read"` → asserts one outbound `GET /api/invoices/unpaid_amount/{invoiceId}` carrying the client session's bearer token, that the declared currency param reaches the query string, and that a currency change issues a second request rather than serving the first response from cache.

- [ ] **AC2** A client can read a paginated, filterable, sortable list of their invoices, and can read the count of invoices they could consolidate **at the same time as** that list — reading the notice's count never changes what the list is showing them.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration src/modules/invoices/__tests__/invoices.collection.int.test.ts src/modules/invoices/__tests__/invoices.criteria-presets.int.test.ts src/modules/invoices/__tests__/invoices.consolidatable-count.int.test.ts` → asserts one outbound `GET /api/invoices` whose query string carries the filters, sort and pagination the criteria model declares, and that the mapped collection exposes the server's total as a **non-zero number** on a recorded fixture whose total exceeds the page window — the assertion that detects a total pinned at `0`.
  - Read-back (the coexistence half, R04): `pnpm --filter @upmind-automation/headless test:integration -t "consolidatableCount coexists"` → asserts that reading the consolidatable count issues a **second, separately-keyed** outbound `GET /api/invoices` carrying the consolidatable filters (`filter[status.code|in]`, `filter[is_consolidation|eq]=false`, `filter[category.slug|in]=recurrent`, `filter[paid_amount|eq]=0`) and `limit=1`; that the count reads the server's total and reports it as a **non-zero number** on a recorded fixture with a positive total — the assertion that detects a count pinned at `0`; that its query string also carries the target client's id when the scope was retargeted; and that after reading it the list request's own criteria and returned rows are **unchanged** — the count and the client's own list coexist.
  - Read-back strengthened 2026-09-08 (Review blocker B3): both halves asserted that a total was *read*, never that it *resolved*. `ListQuery.total` is a `ref(0)` refreshed only as a side effect of reading `.pagination`/`.meta`, so a member reading the bare `.total` reports `0` forever and passed the earlier read-back. The landed code reads `.pagination.value.total` in all three places — `useInvoices.meta.ts:63-66` and `:80-83`, and the collection context's own `total` at `useInvoices.context.ts:92`. The capability sentence above is unchanged.

- [ ] **AC3** After a payment settles or fails, a client sees the new payment row without a manual reload — the module refetches on the payment outcome rather than waiting to be re-mounted.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "refetches after a payment outcome"` → asserts a **second** outbound `GET /api/invoices` is issued after the payment-outcome signal (assert request count, not just payload), and that the refetched page carries the new payment row from the recorded post-payment fixture while the composable instance is never re-created.
  - Why not e2e: the `labs-nuxt` e2e lane is **broken on `develop`** — `playgrounds/labs-nuxt/playwright.config.ts:6-7` imports `./tests/e2e/browser-world` and `./tests/e2e/catalogs`, and `playgrounds/labs-nuxt/tests/` is neither present nor git-tracked (verified in the worktree and in the main checkout). Its `missingSteps: "skip-scenario"` (`playwright.config.ts:44`) would also let a step-less scenario **skip and report green**, which is not a read-back. Baseline defect, not this run's — recorded in `bdd.md`. The refetch is the half of this journey the module owns; the payment that triggers it is PN-1, out of scope.

- [ ] **AC4** A client can assign a payment method to one invoice, and can clear the assignment back to "none selected".
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "assign a payment method to an invoice"` → asserts one outbound `PATCH /api/invoices/{id}/payment_details` whose body carries the chosen id, and a second call whose body carries `payment_details_id: null` as a **present** key (clearing is a sent value, not an omitted one).

- [ ] **AC5** A client reading a consolidation invoice can see which document it merged into, which credit note partners it, how much is queued for credit, and its line items grouped by the subscription each came from.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "consolidation identity and credit fields"` → asserts the mapped invoice exposes the consolidation identity and credit fields from a recorded consolidation-invoice fixture, and that its line items group under one entry per originating subscription.

- [ ] **AC6** A client reading a large consolidated bundle sees that it is large, without the module counting a truncated line-item array.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "the large-bundle flag"` → asserts the outbound list/item request carries `with_count=products` and that the flag derives from the server's own product count, going true above the threshold and false at or below it on recorded fixtures.

- [ ] **AC7** A client can read their credit notes as a filtered view of the invoices resource, and a consolidation credit note is labelled as a consolidation rather than as a refund.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "read my credit notes as a filtered view"` → asserts the outbound `GET /api/invoices` query string carries the credit-note category values and, when scoped to one invoice, the credit-partner filter; and that a recorded consolidation credit note resolves to the consolidation label, not the credit-note label.

- [ ] **AC8** A client with a payment already in flight sees that it is pending, how long it has been pending, and whether the platform is waiting on them rather than on the gateway.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "awaiting-client"` → asserts the outbound request carries the gateway relation, and that recorded fixtures resolve to a pending flag, an attempt age derived from the payment timestamp, and a distinct "awaiting the client" signal only when the gateway type says so.

- [ ] **AC9** A client reading an invoice on a recurring product can see when the next charge falls due.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "the next charge date"` → asserts the mapped invoice exposes the next-charge date from a recorded fixture that carries it, and resolves to absent — not to a thrown error or an epoch date — on a fixture that omits it.

- [ ] **AC10** A client can find out whether they owe anything at all, without loading the whole list — the answer comes from a read dedicated to that question, never from counting whatever rows the visible list happens to be holding.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "find out whether I owe anything at all"` → asserts a **dedicated** outbound `GET /api/invoices`, distinct from the list request and keyed separately, whose query string declares the unpaid status filter (`filter[status.code|in]`) and a one-row page window (`limit=1`); **that the same query string carries the TARGET client's id as the declared client filter when the scope was retargeted, and the reading client's own id when it was not**; and that the boolean derives from the **server's reported total** rather than from the returned row array — so it stays correct when the total exceeds the page.
  - Read-back strengthened 2026-09-08 (Review blocker B1): the earlier read-back named the status filter and the page window but **not the client filter**, so a read that answered for the *reading* client on a `.for('client', X)` scope passed it. That is exactly what shipped. The AC's capability sentence above is unchanged — only the proof was too weak to detect the wrong answer.
  - Oracle divergence (mechanism only — the capability above is unchanged): the oracle asks for the same total with no rows, `limit: "count"` (`oracle:559`, and again for the consolidatable count at `:581`), then answers `response.total > 0` (`oracle:572`). This module sends `limit: 1` and applies the oracle's own `total > 0` semantics to that response. **Why the sentinel cannot be sent:** `withPageWindow` (`packages/headless/src/modules/query/query.utils.ts:603-627`) merges a hard-coded `limit: { type: "integer", minimum: 0, default: PAGINATION.limit }` (`:614-618`) beneath every module's declared pagination schema, and `useValidation`'s `safeValue` dispatches on that merged `type` alone without ever consulting `oneOf` (`packages/headless/src/utils/useValidation.ts:539-542`) — so `"count"` is not finite, is discarded, and `PAGINATION.limit` = `10` (`query.utils.ts:72`) is substituted before the model reaches the wire. `"count"` is therefore unspellable through `list()`'s validated criteria channel for **any** module, and fixing that is a query-core change the operator withdrew on 2026-09-08, verbatim: **"do not chnage any query stuff"**. `limit: 1` is the smallest normal page window that leaves the oracle's `total > 0` contract intact. The schema still *declares* the sentinel (`invoices.schemas.ts:207-212`) — dormant, spellable, silently discarded — and no preset spells it; see the `@decision` at `invoices.schemas.ts:304-328` and `parity.yaml` rows `R01` and `R04`.

- [ ] **AC11** A client reading a consolidated invoice sees the correct outstanding remainder, which is not the same number as the raw unpaid amount once credit notes have offset it.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "balance diverges from the raw unpaid amount"` → asserts that on a recorded consolidated fixture the mapped balance and the mapped unpaid amount are different values, and that both are exposed distinctly on the summary.

### Client reading a sub-account's or delegator's invoices (`client×client`)

**As a** parent-account or delegated client,
**I want** to read the invoices of a client I am entitled to act for, and to tell
those rows apart from my own,
**so that** I act on the right account and am never offered an action on a
document that is not mine to settle.

#### Acceptance Criteria

- [ ] **AC12** A client can read a specific entitled client's invoices, and the outbound request is addressed to that client rather than to the reading client.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration src/modules/invoices/__tests__/invoices.scope-identity.int.test.ts src/modules/invoices/__tests__/invoices.consolidatable-count.int.test.ts` → asserts, for **each of the three reads this cell declares** — the list, the unpaid-existence count, and the consolidatable count — that its outbound `GET /api/invoices` query string carries the target client's id as the declared client filter; that the reading client's own session bearer token is the credential sent on every one of them (no impersonation header, no token swap); and that the same three calls without a target resolve to the reading client's own id.
  - Read-back (the durability half): `pnpm --filter @upmind-automation/headless test:integration -t "the retarget survives every published criteria write"` → asserts that after `useActions().sortBy(...)`, `useActions().filterConsolidatable()`, `useActions().filterCreditNotes()` and a bare `useActions().setCriteria({ filters: { ... } })`, the **next** outbound list request still carries the target client's id — the retarget survives every published criteria write, not just the first fetch.
  - Read-back commands re-anchored 2026-09-08 (3rd correction): the retarget half previously named `-t "client retargets every read at another client"`, which matched **no** landed `describe`/`it` name and so could never have run; both halves now name literals that resolve, and the third read of the cell (the consolidatable count) is proven in `invoices.consolidatable-count.int.test.ts:132`. Read-back strengthened 2026-09-08 (Review blockers B1 + B2). The earlier read-back named only the list request, so it could pass while the other two reads of the same cell answered for the reading client (B1). It also asserted nothing about the row attribution the same call feeds, so a list that fetched the reader's rows and attributed them against the target passed too (B2). The capability sentence above is unchanged; the proof now covers every read the cell declares. The durability half was the executable form of blocker H1 (`review-notes.md`) and was stated as a required read-back **while it was RED**, rather than removed — weakening the proof to match the code is how B1 and B2 shipped. It is now **GREEN**: `withDurableClientId` (`invoices.services.ts:195-215`, wired at `:260`) landed in `a46d8a6d7`, and the proof landed at `invoices.scope-identity.int.test.ts:261-382` (five request-contract assertions: `filterCreditNotes()`, a bare `setCriteria({ filters })`, an explicitly declared `client_id` that must still win, `sortBy()`, `filterConsolidatable()`). Verified green 2026-09-08 — 11/11 in that file. H1 is closed.

- [ ] **AC13** A client reading a co-mingled list can tell, per row, whether an invoice is their own, a sub-account's, or a delegator's — and a delegated invoice is marked as not theirs to settle.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "attribute each invoice in a co-mingled list"` → asserts that on a recorded mixed-list fixture each mapped row resolves to exactly one of own / sub-account / delegated, that a sub-account row wins over the delegated marking when both inputs are present, that a delegated row reports itself as not settleable by the reading client, **and that a row whose client has a parent who is NOT the reading client resolves as neither sub-account nor delegated and stays settleable** — matching the oracle, which gates the delegate test on the presence of *any* parent (`oracle:143-146`), not on that parent matching the reader.
  - Read-back strengthened 2026-09-08 (Review blocker B4): the earlier read-back did not exercise the third-party-parent row, so a module predicate that required `parent === reader` passed it while withholding "pay" on a row the oracle offers it on. The capability sentence above is unchanged.

### Whole-module guarantees and whole-invoice payment state

<!-- AC14-AC16 PROMOTED 2026-09-08 by conductor ruling - see review-notes.md
     H3. All three behaviours were already built, green and
     traceability-gated, and
     packages/headless/src/modules/invoices/__tests__/invoices.feature
     declares them deliberately (@AC-14, @AC-15, @AC-16) with a stated
     precedent (client-email-history.feature's AC-18..21). Recording them here
     is bookkeeping, NOT scope expansion: this section authorises no new
     capability and no new work. AC14 and AC15 hold across every declared cell
     - the guard and the criteria law both precede scope resolution. AC16 is
     `client×self`. -->

**As a** client using the invoices surface,
**I want** the module to refuse a read it cannot address and a filter it has
not declared, and to tell me what state an invoice's payment is in,
**so that** I am never left with a hung read, a filter that silently vanished
or silently applied, or a guessed payment state.

#### Acceptance Criteria

- [ ] **AC14** When neither the reading client nor a target client can be resolved to an id, no invoice read is attempted at all, and the module reports the read as unavailable rather than hanging or silently returning nothing. *(Feature tag `@AC-14`; holds on every declared cell.)*
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration src/modules/invoices/__tests__/invoices.collection.int.test.ts -t "AC-14"` → asserts that with no addressable client **zero** outbound requests are observed (an assertion on request *count*, not on a payload), and that the collection reports itself unavailable rather than staying in a loading state. Verified 2026-09-08 by the planner seat: the pattern selects **1 test in 1 file**, and passes.
  - Source: feature scenario "Refuse to read when no client is addressable"; landed test `invoices.collection.int.test.ts:234-247` — "AC-14 issues NO request at all and reports the collection unavailable when signed out".

- [ ] **AC15** A filter the module has not declared is refused rather than silently ignored or silently applied, and no filter reaches the platform outside what the declared criteria produced. *(Feature tag `@AC-15`; holds on every declared cell.)*
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration src/modules/invoices/__tests__/invoices.scope-identity.int.test.ts -t "AC-15"` → asserts an undeclared filter column never survives into the published criteria (`useContext().query.filters`), and that **no** outbound request the scope issues carries that column or its value — the request-contract half that catches a silent pass-through. Verified 2026-09-08 by the planner seat: the pattern selects **1 test in 1 file**, and passes.
  - Source: feature scenario "Refuse an undeclared filter, and never let one bypass the declared criteria"; landed test `invoices.scope-identity.int.test.ts:384-414` — "AC-15 an undeclared filter column is refused — a validation error, never a silent pass-through".

- [ ] **AC16** A client reading one invoice is told its overall payment state — paid, free, partially paid, or pending — and a load that failed reports the failure rather than a guessed state. *(Feature tag `@AC-16`; cell `client×self`.)*
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration src/modules/invoices/__tests__/invoices.payment-state.int.test.ts` → asserts, on recorded invoice rows with one explicitly labelled field toggled per case, that the mapped state resolves to paid / free / partial / pending; and that on a failed load (a 500, and the **recorded** 404 capture) all four state flags are false while the state resolves to the defined FAILED value with the error signal set — the assertion that detects a guessed state standing in for a failure. Verified 2026-09-08 by the planner seat: the pattern selects **6 tests in 1 file**, 6/6 pass.
  - Source: feature scenarios "Read an invoice's overall payment state" (outline: paid / free / partial / pending) and "A failed invoice load reports no guessed payment state"; landed tests `invoices.payment-state.int.test.ts:65-158` — the `describe` "invoices single read — overall payment state (AC-16)" and its six `AC-16 …` cases, including "AC-16 a failed load reports no guessed payment state" and "AC-16 a real 404 (unknown invoice) reports the same failed-load guarantee as any other failed load".

**Read-back scoping note (the H4 discipline, applied 2026-09-08).** All three
patterns above are **file-scoped on purpose**. A bare `-t "AC-14"` /
`-t "AC-15"` / `-t "AC-16"` does execute, but it does not *scope* the proof:
measured with `vitest list --project integration` on 2026-09-08 they select
**17 tests across 9 files**, **25 across 11 files** and **19 across 9 files**
respectively, because other modules mint the same AC ids. Scoping by a longer
title substring was tried and is not sufficient either — `"reports the
collection unavailable"` appears in **7** other modules' integration files. The
file path is what makes each pattern name exactly one target. Same failure
class as H4 in `review-notes.md`, at the opposite end: an unresolvable pattern
selects zero tests and exits 0; an over-broad one runs someone else's.

## Scope

### In Scope

- The scoped collection composable `useInvoices` (`client×self` + `client×client`) with the full criteria surface: declared filter columns, the sort enum, pagination.
- The scoped single read `useInvoice().withId(id)` on the same services factory.
- One `useQuerySchema()` / `useQueryUischema()` pair owning **all** request state.
- The per-invoice unpaid-amount live re-read.
- The per-invoice assigned-method writer (`PATCH .../payment_details`), including clearing to "none selected".
- The unpaid-existence count read and the consolidatable count read.
- Credit notes as a criteria preset on the invoices list, with the consolidation-first label precedence.
- Consolidation identity/credit fields, the bundled line-item grouping, and the large-bundle flag.
- Co-mingled row attribution (own / sub-account / delegated) and the not-settleable signal.
- `balance` and its post-consolidation divergence from `unpaid_amount`.
- `next_charge_date` mapped read-only.
- Keeping the existing `orders` consumer green through a proper public surface.

### Out of Scope

- **The consolidate POST** and the preference/eligibility derivations (CO-1 / CO-2). This module serves the reads the consolidation surface needs and the refetch target the POST invalidates; it does not trigger consolidation. Oracle equivalent `oracle:609-620`.
- **The payment flow itself** (PN-1). `POST /payments`, the gateway decision tree, and inline challenge handling stay in `payment` / `payment-details`. This module reads, observes and refreshes.
- **Every admin-only write** — invoice update, create, cancel, credit-product, credit-amount, regenerate, recalculate (`oracle:277-540`). All are `apiPath().admin`-bound and fall away with the staff deprecation.
- **A `credit-notes` module or resource.** The oracle has none (no data module, no endpoint); minting one would claim a capability with no oracle behind it. See the AC7 restatement decision in `design.md`.
- **A `packages/types` change.** That package is a git submodule outside this run's write lane, so the missing bare `partial_amount_to_credit` field is mapped through the variants that do exist and the type gap is deferred with a tracked issue — see `parity.yaml` row `R08`.
- **The `staff` actor.** Deprecated by operator ruling 2026-09-01.
- **The module feature file** `packages/headless/src/modules/invoices/__tests__/invoices.feature` — authored by the prover seat, not by this plan.

## Success Criteria

- [ ] Every AC above — **AC1–AC16** — executes its named read-back green against recorded fixtures or the live playground. *(AC count corrected 2026-09-08: this read "Every AC above" against an AC1–AC13 set while `invoices.feature` declared sixteen. AC14–AC16 were promoted into this document by conductor ruling — see `review-notes.md` H3 — so both documents now declare **sixteen** ACs. No AC was added to the build: all three behaviours were already landed and green.)*
- [ ] `parity.yaml` carries a disposition for all four declared actor×context cells and for all **twelve** carried parity rows (R01–R12), with no undispositioned entry and no `blocked_by:` left standing. *(Row count corrected 2026-09-08: this said ten, from before R11 and R12 were split out of R05.)*
- [ ] The baseline build stays green: `pnpm build` `REAL_EXIT=0` across `packages/{types,headless,client-vue}`, `design-system/packages/{tokens,ui}`, `apps/cart`.
- [ ] `orders/order.machine.ts` still compiles and its invoice mapping still works, without importing an `@internal` symbol.
- [ ] No raw `filter[...]` string, raw sort string, or raw limit/page literal reaches the wire from this module — all request state travels through `list({ criteria: { schema } })`.
- [ ] A hand can filter, sort, page and act on everything the oracle offers, from the surface `design.md` specifies.

## Questions

None blocking. Two decisions were settled in `design.md` rather than escalated
(AC4 variant pressure; the AC7 restatement) — both carry their reason and their
overturn condition there. Two module-doc corrections are recorded for the Docs
stage rather than resolved here (`docs/foundation.md:465` denies the
`client×client` cell; `:28` misdescribes `category.slug`).
