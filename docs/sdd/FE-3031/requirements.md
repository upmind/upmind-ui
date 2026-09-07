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
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "unpaid amount live re-read"` → asserts one outbound `GET /api/invoices/unpaid_amount/{invoiceId}` carrying the client session's bearer token, that the declared currency param reaches the query string, and that a currency change issues a second request rather than serving the first response from cache.

- [ ] **AC2** A client can read a paginated, filterable, sortable list of their invoices, with the total count available for the consolidation notice.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "invoices collection reads the list"` → asserts one outbound `GET /api/invoices` whose query string carries the filters, sort and pagination the criteria model declares, and that the mapped collection exposes the server's total.

- [ ] **AC3** After a payment settles or fails, a client sees the new payment row without a manual reload — the module refetches on the payment outcome rather than waiting to be re-mounted.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "list refetches after a payment outcome"` → asserts a **second** outbound `GET /api/invoices` is issued after the payment-outcome signal (assert request count, not just payload), and that the refetched page carries the new payment row from the recorded post-payment fixture while the composable instance is never re-created.
  - Why not e2e: the `labs-nuxt` e2e lane is **broken on `develop`** — `playgrounds/labs-nuxt/playwright.config.ts:6-7` imports `./tests/e2e/browser-world` and `./tests/e2e/catalogs`, and `playgrounds/labs-nuxt/tests/` is neither present nor git-tracked (verified in the worktree and in the main checkout). Its `missingSteps: "skip-scenario"` (`playwright.config.ts:44`) would also let a step-less scenario **skip and report green**, which is not a read-back. Baseline defect, not this run's — recorded in `bdd.md`. The refetch is the half of this journey the module owns; the payment that triggers it is PN-1, out of scope.

- [ ] **AC4** A client can assign a payment method to one invoice, and can clear the assignment back to "none selected".
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "assigned payment method writer"` → asserts one outbound `PATCH /api/invoices/{id}/payment_details` whose body carries the chosen id, and a second call whose body carries `payment_details_id: null` as a **present** key (clearing is a sent value, not an omitted one).

- [ ] **AC5** A client reading a consolidation invoice can see which document it merged into, which credit note partners it, how much is queued for credit, and its line items grouped by the subscription each came from.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "consolidation surface on the invoice"` → asserts the mapped invoice exposes the consolidation identity and credit fields from a recorded consolidation-invoice fixture, and that its line items group under one entry per originating subscription.

- [ ] **AC6** A client reading a large consolidated bundle sees that it is large, without the module counting a truncated line-item array.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "large bundle flag"` → asserts the outbound list/item request carries `with_count=products` and that the flag derives from the server's own product count, going true above the threshold and false at or below it on recorded fixtures.

- [ ] **AC7** A client can read their credit notes as a filtered view of the invoices resource, and a consolidation credit note is labelled as a consolidation rather than as a refund.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "credit notes criteria preset"` → asserts the outbound `GET /api/invoices` query string carries the credit-note category values and, when scoped to one invoice, the credit-partner filter; and that a recorded consolidation credit note resolves to the consolidation label, not the credit-note label.

- [ ] **AC8** A client with a payment already in flight sees that it is pending, how long it has been pending, and whether the platform is waiting on them rather than on the gateway.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "pending payment detection"` → asserts the outbound request carries the gateway relation, and that recorded fixtures resolve to a pending flag, an attempt age derived from the payment timestamp, and a distinct "awaiting the client" signal only when the gateway type says so.

- [ ] **AC9** A client reading an invoice on a recurring product can see when the next charge falls due.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "next charge date on the invoice"` → asserts the mapped invoice exposes the next-charge date from a recorded fixture that carries it, and resolves to absent — not to a thrown error or an epoch date — on a fixture that omits it.

- [ ] **AC10** A client can find out whether they owe anything at all, without loading the whole list.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "unpaid existence count"` → asserts one outbound `GET /api/invoices` whose query string carries the count limit and the unpaid status filter, and that the result is a boolean derived from the server's total rather than from the row array.

- [ ] **AC11** A client reading a consolidated invoice sees the correct outstanding remainder, which is not the same number as the raw unpaid amount once credit notes have offset it.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "balance diverges from unpaid amount after consolidation"` → asserts that on a recorded consolidated fixture the mapped balance and the mapped unpaid amount are different values, and that both are exposed distinctly on the summary.

### Client reading a sub-account's or delegator's invoices (`client×client`)

**As a** parent-account or delegated client,
**I want** to read the invoices of a client I am entitled to act for, and to tell
those rows apart from my own,
**so that** I act on the right account and am never offered an action on a
document that is not mine to settle.

#### Acceptance Criteria

- [ ] **AC12** A client can read a specific entitled client's invoices, and the outbound request is addressed to that client rather than to the reading client.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "client retargets the list at another client"` → asserts the outbound `GET /api/invoices` query string carries the target client's id as the declared client filter, that the reading client's own session bearer token is the credential sent (no impersonation header, no token swap), and that the same call without a target resolves to the reading client's own id.

- [ ] **AC13** A client reading a co-mingled list can tell, per row, whether an invoice is their own, a sub-account's, or a delegator's — and a delegated invoice is marked as not theirs to settle.
  - Read-back: `pnpm --filter @upmind-automation/headless test:integration -t "co-mingled row attribution"` → asserts that on a recorded mixed-list fixture each mapped row resolves to exactly one of own / sub-account / delegated, that a sub-account row wins over the delegated marking when both inputs are present, and that a delegated row reports itself as not settleable by the reading client.

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
- **Every admin-only write** — invoice update, create, cancel, credit-product, credit-amount, regenerate, recalculate (`oracle:279-542`). All are `apiPath().admin`-bound and fall away with the staff deprecation.
- **A `credit-notes` module or resource.** The oracle has none (no data module, no endpoint); minting one would claim a capability with no oracle behind it. See the AC7 restatement decision in `design.md`.
- **A `packages/types` change.** That package is a git submodule outside this run's write lane, so the missing bare `partial_amount_to_credit` field is mapped through the variants that do exist and the type gap is deferred with a tracked issue — see `parity.yaml` row `R08`.
- **The `staff` actor.** Deprecated by operator ruling 2026-09-01.
- **The module feature file** `packages/headless/src/modules/invoices/__tests__/invoices.feature` — authored by the prover seat, not by this plan.

## Success Criteria

- [ ] Every AC above executes its named read-back green against recorded fixtures or the live playground.
- [ ] `parity.yaml` carries a disposition for all four declared actor×context cells and for all ten carried parity rows, with no undispositioned entry.
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
