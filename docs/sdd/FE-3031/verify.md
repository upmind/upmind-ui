# Verify — FE-3031 (invoices module conversion, M1 → M3)

**Verdict:** `PRESENT`

**Seat:** verifier · **Lifecycle:** factory (Verify stage, re-run after the prior `ABSENT`)
**Date:** 2026-09-08
**verifiedSha:** `785113dbfe56e940fc5cc4c4caa20849dea33602`
**worktreeFingerprint:** `7bcafdc01c4c6fff8dbd9bc652aaf2343e37fd842c9a9f460e878a872b836768`
(`git diff HEAD -- packages/headless docs/sdd/FE-3031 | shasum -a 256` — the `gitlab/develop`
merge is resolved and intentionally uncommitted; the verdict binds to commit + this fingerprint.)

> **Branch not pushed.** `git ls-remote gitlab feature/fe-3031-…` returns nothing. The base
> skill's "read the pushed branch HEAD" step could not be honoured; the verdict is bound to the
> local commit and the working-tree fingerprint above instead. Surfaced, not waived.

## Core deliverable

Convert `packages/headless/src/modules/invoices` from an unscoped single read over
`GET /invoices/{id}` into a full scoped, query-backed module that serves **every
invoice-resource read/write the billing briefs need — unpaid amount, list, assigned method,
consolidation fields, credit notes** — for `client×self` and `client×client`, with all request
state travelling through one declared `useQuerySchema()`.

## The two prior ABSENT findings — both repaired, both re-run

| Finding | Fixed | Evidence re-run by this seat |
| --- | --- | --- |
| **1. AC-10's assertion proved nothing** (bare substring match on `"count"`, satisfiable by `with_count=products`) | Yes | `invoices.criteria-presets.int.test.ts:113-161` now identifies the dedicated read by `limit=1` and asserts `not.toContain("with_count")`; `:163-211` / `:213-260` hold the row array constant across `total=50` and `total=0`. All three GREEN on my own run. |
| **2. R04's `Absorbed-by` was dishonest** | Yes | AC-2 now has a dedicated read: `useMeta().consolidatableCount` (`useInvoices.meta.ts:71-74`) over `loadConsolidatableCount` (`invoices.services.ts:296-323`, own key `:308`, own criteria `:303-307`, gate `:398-400`). `filterConsolidatable()` retained for the list case (`useInvoices.actions.ts:157-161`, filters only). `invoices.consolidatable-count.int.test.ts` GREEN; mutant `invoices.consolidatable-count-shares-list-query.must-fail.patch` flips it RED. R04 re-dispositioned `Renamed` with receipts — honest. |

## The measurement discrepancy — resolved

My own run in this worktree: **131 files / 943 tests (941 passed | 2 todo), exit 0.**
The prover's count is correct; the conductor's **121 / 901 is VOID** — it was measured in the
**wrong working directory**. Receipts:

- `find packages/headless/src -path '*__tests__*' -name '*.int.test.ts' | wc -l` → **131** in the worktree, **121** in `/Users/dom/Documents/upmind-monorepo` (branch `feature/client-notifications-scoped-conversion`).
- The main checkout carries **1** invoices integration spec (the pre-conversion `invoices.int.test.ts`); this worktree carries **11** new ones and deletes that one. Net **+10** — exactly the reported gap.
- **No file is silently skipped in this worktree.** The condition that loses files is running the suite outside the FE-3031 worktree, not a glob or reachability quirk.

## What was checked (behaviour, not addresses)

Every check below was **re-executed by this seat**; no filed log was accepted as proof.

| Check | Command | Result |
| --- | --- | --- |
| Integration, full | `npx vitest run --project integration` (worktree) | `131 passed (131)` · `941 passed \| 2 todo (943)` · exit 0 |
| Integration, invoices only | `npx vitest run --project integration invoices` | `11 passed (11)` · `48 passed (48)` |
| Unit, full | `npx vitest run --project unit` | `102 passed (102)` · `867 passed \| 1 todo (868)` |
| Traceability | `npx vitest run --project unit invoices.traceability` | `1 passed` — bidirectional, array-based (non-vacuous), 0 unproven |
| Feature | `grep` over `invoices.feature` | 27 scenarios · all 16 tags `@AC-1`…`@AC-16` |
| Build | `pnpm build` | `REAL_EXIT=0`, 6 packages Done (types, headless, client-vue, tokens, ui, cart), 0 errors |
| Query core untouched | `git diff --stat gitlab/develop -- packages/headless/src/modules/query/` | empty — byte-identical |
| `useValidation.ts` delta | `git diff gitlab/develop -- .../useValidation.ts` | exactly 2 lines (`set(result, [key], …)`) + its `@decision` carrying the operator sign-off "Authorise the core fix" (2026-09-02) |
| Test-mode divergence | `grep -rE 'useTestAttrs\|import.meta.env\|process.env\|VITEST' src/modules/invoices/*.ts` | none — module source has no test-mode branch at all |
| Negative controls | `git apply` + targeted spec + `git apply -R`, 11× | **11/11** RED on their OWN named assertion (1 failure each), all reverted; working-diff hash restored byte-identical |

### Oracle capability sweep (`vue-app/src/store/modules/data/invoices/index.ts`)

`list :227-238` → `loadList` · `get/getWithParams :239-278` → `loadOne` + the 25-relation
include set · `updatePaymentDetails :288-302` → `updatePaymentDetails` + `assignPaymentMethod`
· `hasUnpaid :553-573` → `loadUnpaidExistence` + `meta.hasUnpaid` · `getConsolidatableTotal
:574-592` → `loadConsolidatableCount` + `meta.consolidatableCount` ·
`getUnpaidConvertedAmount :621-633` → `loadUnpaidAmount` · `unifiableCount :37-43` → the count
query's `{ client }` key segment · `unpaidStatuses :67-73` → `InvoiceStatusGroups.UNPAID` ·
`hasPendingPayments :90-92` → `Payment.meta.isPending` + `useMeta().isPending` ·
`hasPendingPaymentInstructions :93-101` → `Payment.isAwaitingClient`
(`invoices.mappers.ts:197-199`, now carrying the `payment.pending &&` conjunct) ·
`isCreditNote :111-115` → `category.slug` typed to `InvoiceCategoryCode` ·
`belongsToChildOfClient :126-133` / `belongsToDelegate :134-137` → `mapAttribution`, child-first
· `getInvoiceCategoryName :172-179` → `category.label`, `is_consolidation` first. All present.

Oracle citations re-verified at source: `limit: "count"` is at **`:559` and `:581`**, `total > 0`
at `:572` — the planner's correction is right.

Out of scope and not graded: `apiPath().admin` writes `:279-542` (staff deprecation, signed
2026-09-01), the consolidate POST `:609-620`, the payment flow (PN-1).

### A7 — identity retargeting (`client×client`)

- **Request retarget asserted:** yes — `invoices.scope-identity.int.test.ts:61-63` asserts
  `filter[client_id|eq]=<TARGET>` on the decoded outbound URL.
- **Auth identity transport asserted:** yes — `assertClientIdentityTransport`
  (`invoices.int-helpers.ts:406-414`) asserts `authorization === "Bearer <reading client's own
  token>"` and `assertNoActingAsHeaders`. Payload is never the proof.
- **Negative control:** `invoices.scope.retarget-drop.must-fail.patch` (drops the declared
  `client_id` column) flips that exact assertion RED. Verified by this seat.
- **Reachable as documented:** yes. The wire retarget is `setCriteria({ filters: { client_id:
  { eq } } })` on the declared column — the door AC-12's read-back drives. `.for('client', id)`
  resolves the target through `resolveClientId` and drives the query-key partition and the
  attribution input; `loadList` does **not** auto-seed the filter from it, while
  `loadConsolidatableCount` **does** (`invoices.services.ts:306`). Both facts are stated in
  `parity.yaml` (cell note, R04 note (b)) — disclosed, not overclaimed.

### Count members — both directions

| Member | Positive total | Zero total | Wire request | Verdict |
| --- | --- | --- | --- | --- |
| `useMeta().hasUnpaid` | `total=50` → `true` | `total=0` → `false`, same non-empty row array | dedicated `GET /invoices`, `filter[status.code|in]` + `limit=1`, no `with_count` | PASS |
| `useMeta().consolidatableCount` | server total via own query | own key `["invoices","consolidatable_count",{client}]` | dedicated `GET /invoices` carrying the consolidatable filters + `limit=1`; list criteria unchanged after reading | PASS |

### The in-module `ListQuery.total` workaround

**Legitimate.** The `@decision` (`useInvoices.meta.ts:37-53`) is accurate, and I verified its
premise in the core: `total` is `computed(() => total.value ?? response?.data?.value?.total ??
0)` over `ref(0)` (`useQuery.ts:423`, `:564-566`) — `0` is not nullish, so a bare `.total` read
returns `0` forever; `total.value` is refreshed only as a side effect of the `pagination`
(`:581`) / `meta` (`:593`) getters, and this module does not enable `withSplitCount`. Its claim
that `isEmptyList` already reads the total this way is true (`useInvoices.meta.ts:24`). Reading
`.pagination.value.total` is an existing public member, not a query-core change — it honours the
operator ruling of 2026-09-08 ("do not chnage any query stuff"), and the rejected core fix is
named. **Fragility:** the dependency is on a side effect inside a computed getter — real
coupling, but bounded, because the two-directional AC-10 controls and the AC-2 coexistence
control all go RED if it breaks.

### Fixture provenance — re-captured live

`pnpm fixtures:generate invoices` against `https://api.staging.upmind.io` (env
`packages/headless/.env.recording`, creds `tests/fixtures/credentials.ts`): 7 generator tests
passed, `[lint] OK: 316 fixture(s) across 23 unit(s) clean.`, exit 0.

All **8** fixtures re-captured and compared **structurally** (recursive key-path → type
skeleton; volatile values excluded): identical path counts (593 / 1801 / 39 / 1801 / 36 / 1529 /
40 / 36), **0** shipped-only keys, **0** fresh-only keys, **0** nullability flips, identical `v3`
envelope. Enum/status spot-check identical: HTTP `200/404/401/422/200`, `status.code` sets
`["invoice_overdue","invoice_paid"]`, `category.slug` sets `["new_contract","recurrent"]`, list
`total` 1086 both sides. **Recorded, not fabricated, not drifted.**

Shipped fixtures restored byte-identical after comparison (SHA-256 diff clean) — the diff under
verification was not mutated.

**Constructed rows are labelled as constructed** in both docblock and test title — including the
repaired `mapPayments` scenario (`invoices.mappers.test.ts:26-34` and the title "carries no card
details for a **constructed** payment with no saved card"). The staging corpus carries no
consolidation, credit-note, large-bundle or delegated/child row
(`consolidation:false creditNote:false largeBundle:false delegatedOrChild:false paidRow:true`),
so AC-5 / AC-6 / AC-7's label precedence / AC-13 are proven on labelled constructed rows over
real recorded invoices. Disclosed, honest, not presented as capture.

### Parity table

All 4 `client|staff × self|client` cells dispositioned; `client×self` and `client×client` are
`Direct`; both `staff` cells and `R07` are `Dropped-with-issue-reference` carrying
`signoff: op:dom@upmind.com:2026-09-01`; `R08` likewise signed. **Unsigned drops: 0.** No
verdict-blocking irregularity.

## Surfaced gaps (none verdict-blocking)

1. **The conductor's integration claim is void** — 121/901 measured in the main checkout, not
   this worktree. Routes to the conductor: re-file with a `pwd`-stamped log.
2. **`ci/lint-plan-compliance.mjs` does not exist** anywhere in this repo (worktree or main;
   there is no `ci/` directory). The planner's "exit 0, 0 undispositioned cells" is
   unreproducible. I graded `parity.yaml` by hand instead — the substance holds.
3. **No `labs-nuxt` `useInvoices` scenario directory and no `invoices.steps.ts`** — eight sibling
   modules have both. `design.md:542` declares a Playground row, and
   `invoices.traceability.test.ts:8-16` records the missing step catalog itself. The factory
   goal's "driveable page" half is unevidenced; outside this seat's four named sub-gates, routed
   to the conductor's end-state grading.
4. **Stale docblock** — `invoices.criteria-presets.int.test.ts:10-48` still declares three
   "confirmed" defects and says the tests are "EXPECTED to fail"; all three pass. It
   under-claims (not cosplay), but a filed narrative contradicting a green run is a hazard.
   Routes to the prover.
5. **`docs/sdd/FE-3031/evidence/` holds no test logs** — only the prior Linear comment. Every
   numeric claim in this run had to be re-derived from scratch.
6. **R08's `tracker` field is a placeholder**, not a Linear issue id. The row is operator-signed,
   and the quantity IS served (`amountToCreditConverted` / `_Formatted` / `amountCredited`), so
   the drop is scoped out — but the Linear id is still owed by the operator.

## What's missing

Nothing load-bearing. No part of the core deliverable is absent, stubbed, or only cosmetically
present.
