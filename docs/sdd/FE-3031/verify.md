# Verify — FE-3031 (invoices module conversion, M1 → M3)

**Verdict:** `PRESENT`

**Seat:** verifier · **Lifecycle:** factory (Verify stage, 3rd run — re-graded after the 2nd run's `PRESENT`, because Review's four blockers + the planner's three landed since)
**Date:** 2026-09-08
**verifiedSha:** `bdfc02ef5b29803756a1072cd06f85639a51bb15`
**worktree:** `/Users/dom/Documents/upmind-monorepo/.claude/worktrees/fe-3031-invoices` (every command below was `pwd`-stamped in this path)
**worktreeFingerprint:** `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
(`git diff HEAD -- packages/headless docs/sdd/FE-3031 | shasum -a 256` — the SHA-256 of the EMPTY
string: both trees are fully committed at `bdfc02ef5`, so the verdict binds to the commit alone.)
Measured BEFORE this artefact was written. `docs/sdd/FE-3031/verify.md` — this file — is now the
ONLY uncommitted change under either tree; it is left uncommitted deliberately so `verifiedSha`
above stays the commit that was actually inspected. Committing it is the conductor's call.

> **Branch still not pushed.** `git ls-remote gitlab feature/fe-3031-pn-3-invoices-module-augment-unpaid-amount-list-assigned`
> returns nothing. The base skill's "read the pushed branch HEAD" step could not be honoured; the
> verdict binds to the local commit `bdfc02ef5` (9 commits ahead of `gitlab/develop`, one of them
> the `develop` merge). Surfaced, not waived — unchanged from the prior run.

## Core deliverable

Convert `packages/headless/src/modules/invoices` from an unscoped single read over
`GET /invoices/{id}` into a full scoped, query-backed module that serves **every
invoice-resource read/write the billing briefs need — unpaid amount, list, assigned method,
consolidation fields, credit notes** — for `client×self` and `client×client`, with all request
state travelling through one declared `useQuerySchema()`.

## The seven findings raised since the prior PRESENT — all re-graded

Every row below was re-executed by this seat. No filed log was accepted as proof.

| # | Finding | Fixed? | Evidence I re-ran | Verdict |
| --- | --- | --- | --- | --- |
| **B1** | `loadUnpaidExistence` never applied `client_id`, so `.for('client', X).useMeta().hasUnpaid` answered for the *reading* client | **Yes** | `invoices.services.ts:394` calls `trackClientIdFilter(handle, clientId)` (helper `:137-152`), reproducing `oracle:561-563`. Read-back `-t "hasUnpaid answers for the"` → **1 failed** under mutant `invoices.unpaid-existence-retarget-drop.must-fail.patch`, **2 passed** clean. The dedicated request's decoded URL is asserted to carry `filter[client_id|eq]=<TARGET>` (`invoices.scope-identity.int.test.ts:227-229`) plus `assertClientIdentityTransport`. | **CLOSED** |
| **B2** | `loadList` applied no `client_id` filter but passed the retargeted id into `select: raw => mapInvoices(raw, clientId.value)` — reader's rows attributed against the target, corrupting `isSettleable` | **Yes** | `loadList` (`invoices.services.ts:232-261`) now calls `trackClientIdFilter` at `:258`. `invoices.scope-identity.int.test.ts:114-174` asserts the request **and** the row attribution *together* on the same call. Mutant `invoices.list-retarget-drop.must-fail.patch` → **1 failed**, reverted green. | **CLOSED** |
| **B3** | `useInvoices.context.ts` published `total: query.total`, the read pinned at `0` | **Yes** | `useInvoices.context.ts:92` now reads `computed(() => query.pagination.value.total)` with its `@decision` at `:79-91`; `useInvoices.meta.ts:63-66` (`hasUnpaid`) and `:80-83` (`consolidatableCount`) do the same. `invoices.collection.int.test.ts:95` asserts `useContext().total.value === recorded.list().total` (**non-zero**, 1086) — the pinned-at-zero detector. GREEN on my run. | **CLOSED** |
| **B4** | `isDelegated` required `parent_client_id === readingClientId`; the oracle gates on the presence of **any** parent (`oracle:143-146`) | **Yes** | `invoices.mappers.ts:142`: `const isDelegated = !parentClientId && !!raw.delegate_related`. I re-read `oracle:143-146` at source — `belongsToDelegate` early-returns `false` when **any** `parent_client_id` is present, then returns `!!delegate_related`. Exact match. Proof: `invoices.attribution.int.test.ts:111` — "parent is SOME OTHER client, not the reader, AND `delegate_related` toggled". Mutant `invoices.attribution-child-first.must-fail.patch` reddens its own assertion only. | **CLOSED** |
| **H1** | `criteria.set` replaces the whole `filters` branch, so `filterCreditNotes()` and the published `setCriteria` silently dropped the retarget — B2 again, through the public surface | **Yes** | `withDurableClientId` (`invoices.services.ts:195-215`, wired at `:260`) re-asserts `client_id` inside the **caller's own** `filters` object unless the caller declared it (`:203`), keeping the manual door open. Read-back `-t "the retarget survives every published criteria write"` → **5 passed / 1 file**, exit 0. Mutant `invoices.retarget-not-durable.must-fail.patch` → **2 failed / 3 passed**: exactly the two doors it removes (`filterCreditNotes()`, bare `setCriteria({ filters })`). Sound control. | **CLOSED** |
| **H3** | `invoices.feature` declared 16 ACs, `requirements.md` declared 13 | **Yes** | `grep -c` over `invoices.feature` → **27** scenarios; `@AC-1`…`@AC-16` all present, none missing. `requirements.md` now declares AC1–AC16 with AC14/15/16 promoted under the conductor ruling and **file-scoped** read-backs. Traceability gate (`invoices.traceability.test.ts`) is bidirectional and array-based (non-vacuous), GREEN, **0 unproven**. | **CLOSED** |
| **H4** | 13/15 read-backs and 17/19 Reality Checks named test titles that do not exist — a non-matching `-t` selects zero tests and **exits 0** | **Yes** | Full inventory taken with the runner's own `list` command (**951** tests / **131** files), then every live pattern in `requirements.md` + `tasks.md` matched against it, and **7 executed verbatim**. All resolve to ≥1 test in **exactly 1 file**. See the table below. | **CLOSED** |

## H4 — do the read-backs now resolve?

Inventory: the runner's `list --project integration` in `packages/headless` → 951 tests across 131 files.
Rows marked **executed** were run as a real `pnpm --filter @upmind-automation/headless test:integration -t "<pattern>"`, not matched offline.

| Pattern I sampled | Tests selected | Files | Verdict |
| --- | --- | --- | --- |
| `the retarget survives every published criteria write` | **5** (executed, 5 passed) | 1 | RESOLVES |
| `find out whether I owe anything at all` | **3** (executed, 3 passed) | 1 | RESOLVES |
| `retarget my reading at an entitled client` | **3** (executed, 3 passed) | 1 | RESOLVES |
| `consolidatableCount coexists` | **3** (executed, 3 passed) | 1 | RESOLVES |
| `read my credit notes as a filtered view` | **1** (executed, 1 passed) | 1 | RESOLVES |
| `attribute each invoice in a co-mingled list` | **5** (executed, 5 passed) | 1 | RESOLVES |
| `the include set may not shrink below its floor` | **1** (executed, 1 passed) | 1 | RESOLVES |
| `the live unpaid-amount re-read` | 3 | 1 | RESOLVES |
| `refetches after a payment outcome` | 1 | 1 | RESOLVES |
| `assign a payment method to an invoice` | 1 | 1 | RESOLVES |
| `consolidation identity and credit fields` | 2 | 1 | RESOLVES |
| `the large-bundle flag` | 2 | 1 | RESOLVES |
| `awaiting-client` | 2 | 1 | RESOLVES |
| `the next charge date` | 2 | 1 | RESOLVES |
| `balance diverges from the raw unpaid amount` | 1 | 1 | RESOLVES |
| `AC-14` / `AC-15` / `AC-16` (bare) | 17 / 25 / 19 | 9 / 11 / 9 | over-broad — which is exactly why the three landed read-backs are **file-scoped**; `requirements.md:139-149` states these same measured numbers, and I reproduced all six |
| `client retargets every read at another client` | **0** | 0 | not a read-back — `requirements.md:100` quotes it as the *historical broken pattern*, in prose. Verified in context. |

**UNRESOLVABLE PATTERNS FOUND: 0**

## Capability table (oracle × landed)

Oracle re-read at source: `/Users/dom/Documents/Upmind/vue-app/src/store/modules/data/invoices/index.ts` (655 lines).
Every citation below was line-verified by this seat this pass.

| Oracle capability | Receipt | Landed as | Driveable? | Verdict |
| --- | --- | --- | --- | --- |
| `apiPath().contextual` → `api/invoices` | `:25-33` (verified) | `useUrl("invoices")` on every read | yes — every request assertion decodes a real outbound URL | PRESENT |
| `list` | `:227-238` | `loadList` (`invoices.services.ts:232-261`) → `useInvoices` collection | yes — `invoices.collection.int.test.ts` (9 tests: includes, sort default, `sortBy`, pagination, dotted status filter) | PRESENT |
| `get` | `:239-249` | `loadOne` (`:267-293`) → `useInvoice().withId(id)` | yes — `collection:176`, `single-read-lifecycle` (refresh, invalidate) | PRESENT |
| `getWithParams` + its 12-relation `with=` array | `:250-276`, array `:255-268` (verified) | `LOAD_ONE_INCLUDES` (`:57-83`, 25 relations; the pre-conversion 16 are the floor and all present in order) | yes — `invoices.include-set.int.test.ts` reads the real `with` param and checks **every** floor relation | PRESENT (8 of 12 requested; the other 4 are R11/R12, both signed drops) |
| `updatePaymentDetails`, incl. clearing to none | `:288-301` | `updatePaymentDetails` (`:453-465`) → `useActions().assignPaymentMethod` | yes — `invoices.payment-method.int.test.ts`: assign body carries the id; clear sends `payment_details_id: null` as a **present** key | PRESENT |
| `getUnpaidConvertedAmount` | `:621-632` (verified) | `loadUnpaidAmount` (`:301-350`) → `useActions().refreshUnpaidAmount` | yes — `invoices.unpaid-amount.int.test.ts` (3): URL + bearer + `currency_id` on the query string, and a currency change issues a **second** request | PRESENT |
| `hasUnpaid` — `limit:"count"` `:559`, `total>0` `:572` | `:553-573` (all three verified) | `loadUnpaidExistence` (`:369-397`), own key `:378`, preset `invoices.schemas.ts:329-332` → `useMeta().hasUnpaid` (`useInvoices.meta.ts:63-66`) | yes — `criteria-presets:110/164/216`, `scope-identity:181/236` | PRESENT (mechanism divergence `limit:1` vs `"count"`, disclosed at `requirements.md:82` + R01, capability intact) |
| `getConsolidatableTotal` — `filter[client_id]` `:585` | `:574-592` (verified) | `loadConsolidatableCount` (`:415-446`), own key `:427`, preset `invoices.schemas.ts:364-371` → `useMeta().consolidatableCount` (`:80-83`) | yes — `invoices.consolidatable-count.int.test.ts` (3), incl. coexistence with the visible list | PRESENT (Renamed, R04) |
| `unifiableCount` per-client scope key | `:37-43` | the `{ client: clientId }` segment of the count query key (`:427`) | yes — same file | PRESENT |
| `belongsToChildOfClient` | `:137-142` (verified) | `mapAttribution` (`invoices.mappers.ts:132-145`), `isChildOfClient` at `:140-141` | yes — `invoices.attribution.int.test.ts` (7) | PRESENT |
| `belongsToDelegate` — ANY-parent gate at `:144` | `:143-146` (verified) | `invoices.mappers.ts:142`, `isSettleable = !isDelegated` at `:148` | yes — incl. the third-party-parent row (`attribution:111`) | PRESENT |
| `getInvoiceCategoryName` — `is_consolidation` first at `:178` | `:175-180` (verified) | `invoices.mappers.ts:68-72` | yes — `invoices.mappers.test.ts` "labels a consolidation credit note as a consolidation" | PRESENT |
| `isCreditNote` | `:111-115` | `category.slug` + `credit_invoice_id` declared filter columns; `creditNotesCriteria` (`invoices.schemas.ts:378-390`) | yes — `criteria-presets:91` (`-t "read my credit notes as a filtered view"`, 1 passed) | PRESENT |
| `hasPendingPaymentInstructions` (AWAITING_CLIENT) | `:93-101` | `Payment.isAwaitingClient`, needs `payments.gateway` in the include set | yes — `invoices.mapping.int.test.ts:73/88` | PRESENT |
| `balance` post-consolidation divergence | module `foundation.md:27` | `summary.balance` + `summary.balanceFormatted`, distinct from `summary.unpaidAmount` | yes — `mapping:211` | PRESENT |
| `next_charge_date` | invoice payload | mapped read-only | yes — `mapping:101/109` (present, and absent → undefined, not epoch) | PRESENT |
| large-bundle flag from server count | `with_count=products` | `mapBundle` (`invoices.mappers.ts:147-156`), `productCount` from `products_count` | yes — `mapping:187/201` (both directions of the threshold) | PRESENT |
| **Out of scope, signed — not graded** | | | | |
| every admin write | `:277-540` (both bounds verified) | `INVOICES_SCOPE_MATRIX[STAFF] = null as never` | n/a | scoped out, `op:dom@upmind.com:2026-09-01` |
| consolidate POST | `:609-620` | not built (CO-1/CO-2) | n/a | declared Out of Scope |
| payment flow | PN-1 | not built | n/a | declared Out of Scope |
| `data` + `account.user` | `:256-257` | not requested, no VM field | n/a | R12, `op:dom@upmind.com:2026-09-08` |
| `original_invoice` + `duplicate_invoice` | `:266-267` | not requested, no VM field | n/a | R11, `op:dom@upmind.com:2026-09-01` |

## JTBD nouns

> "serve every invoice-resource read/write the billing briefs need — unpaid amount, list, assigned method, consolidation fields, credit notes"

| Noun | Served by | Proven where | Verdict |
| --- | --- | --- | --- |
| **unpaid amount** | `useInvoice().useActions().refreshUnpaidAmount()` (live re-read, `GET /invoices/unpaid_amount/{id}`) + `summary.unpaidAmount` + `summary.balance` + `useMeta().hasUnpaid` (dedicated existence count) | `invoices.unpaid-amount.int.test.ts` (3) · `mapping:211` · `criteria-presets:110/164/216` | SERVED |
| **list** | `useInvoices()` collection over one declared `useQuerySchema()` — filters, sort enum, pagination, all through `list({ criteria: { schema } })` | `invoices.collection.int.test.ts` (9) · `invoices.criteria-presets.int.test.ts` (3) | SERVED |
| **assigned method** | `useActions().assignPaymentMethod(invoiceId, id \| null)` → `PATCH /invoices/{id}/payment_details` | `invoices.payment-method.int.test.ts` (2 — assign **and** clear-as-present-null) | SERVED |
| **consolidation fields** | `Invoice['consolidation']` (merged-into id, credit partner, amount queued/credited), bundled line-item grouping, large-bundle flag, `useMeta().consolidatableCount` | `mapping:118/143/187/201` · `invoices.consolidatable-count.int.test.ts` (3) | SERVED |
| **credit notes** | `useActions().filterCreditNotes()` over `creditNotesCriteria`, plus the `is_consolidation`-first label precedence | `criteria-presets:91` (executed, 1 passed) · `invoices.mappers.test.ts` label-precedence pair | SERVED |

## `client×client` on all three reads

| Read | Wire retarget | Survives a `filters` write | Receipt |
| --- | --- | --- | --- |
| **list** | yes — `filter[client_id|eq]=<TARGET>` on the decoded outbound URL, on the **first** request of a `.for()` scope with no manual `setCriteria`, and the returned row's `attribution` asserted on the same call | **yes** — `filterCreditNotes()`, bare `setCriteria({ filters })`, `sortBy()`, `filterConsolidatable()` all still carry it; an explicitly declared `client_id` still wins | `invoices.scope-identity.int.test.ts:114-174` + `:261-382` (11/11 green) |
| **unpaid-existence count** | yes — the `limit=1` dedicated request carries `filter[client_id|eq]=<TARGET>` | **n/a by construction** — its criteria object is private to the factory; no published verb can replace its `filters` branch | `invoices.scope-identity.int.test.ts:177-258` |
| **consolidatable count** | yes — the `limit=1` + `is_consolidation` dedicated request carries `filter[client_id|eq]=<TARGET>` | **n/a by construction** — same private-criteria argument | `invoices.consolidatable-count.int.test.ts:132-181` |

Each read also has a no-target twin asserting the **reading** client's own id and that the other
id appears on **no** request this scope issues.

## Count members — both directions

| Member | Positive → | Zero → | Verdict |
| --- | --- | --- | --- |
| `useMeta().hasUnpaid` | `total=50` → `true` (`criteria-presets:164/213`); `total=3` on a retargeted scope → `true` (`scope-identity:233`) | `total=0` → `false`, with the **same non-empty row array** as the true case (`criteria-presets:216/264`) | **PASS** |
| `useMeta().consolidatableCount` | `total=7` → `7` (`consolidatable-count:129`); `total=2` → `2` (`:181`) — two **distinct** positive values from two distinct responses | no separate zero-direction assertion | **PASS** — a member pinned at `0` (the B3 defect) fails **both** positive assertions, and two distinct positives also exclude a hardcoded constant. The absent zero case is the weakest possible assertion here (`0` is the member's own initial value), so it cannot hide a capability defect. Named as a proof-coverage note, not a gap. |
| `useContext().total` | `1086` (the recorded fixture's real total, above the page window) (`collection:95`) | n/a | **PASS** — this is the assertion that detects the pinned-at-`0` read |

## Evidence I re-ran

Every command below ran with `cd /Users/dom/Documents/upmind-monorepo/.claude/worktrees/fe-3031-invoices`
and a `pwd` stamp in its log. No filed log was accepted.

| Check | Command (pwd-stamped in the worktree) | Result (verbatim) |
| --- | --- | --- |
| Integration, full | `pnpm --filter @upmind-automation/headless test:integration --reporter=dot` | `Test Files  131 passed (131)` · `Tests  951 passed \| 2 todo (953)` · `REAL_EXIT=0` |
| Unit, full | `pnpm --filter @upmind-automation/headless test:unit --reporter=dot` | `Test Files  102 passed (102)` · `Tests  867 passed \| 1 todo (868)` · `REAL_EXIT=0` |
| Integration, invoices only | `pnpm --filter @upmind-automation/headless test:integration src/modules/invoices/` | `Test Files  11 passed (11)` · `Tests  58 passed (58)` · `REAL_EXIT=0` |
| Unit, invoices only | `pnpm --filter @upmind-automation/headless test:unit src/modules/invoices/` | `Test Files  2 passed (2)` · `Tests  20 passed (20)` · `REAL_EXIT=0` |
| Test inventory (H4 basis) | the runner's `list --project integration` | `951` test entries across `131` files, `REAL_EXIT=0` |
| Build | `pnpm build` | `REAL_EXIT=0`; 6 packages (`packages/types`, `packages/headless`, `packages/client-vue`, `design-system/packages/tokens`, `design-system/packages/ui`, `apps/cart`); **0** error lines |
| Feature | `grep -c` scenarios + tag sweep over `invoices.feature` | `27` scenarios · `@AC-1`…`@AC-16`, all 16 present |
| Traceability | rode the unit suite (`invoices.traceability.test.ts`) | GREEN, bidirectional, array-based (non-vacuous), **0 unproven** |
| Query core untouched | `git diff --stat gitlab/develop...HEAD -- packages/headless/src/modules/query/` | **only** `packages/headless/src/modules/query/docs/README.md` (+6/-5). **Zero** `.ts` change — every source file under `modules/query/**` is byte-identical to `develop`. (The claim's word "byte-identical" holds for source; one doc file did change.) |
| `useValidation.ts` delta | `git diff gitlab/develop...HEAD -- packages/headless/src/utils/useValidation.ts` | exactly **2** changed lines (`set(result, subKey, …)` → `set(result, [subKey], …)` at `:526`, and the top-level twin at `:551`) + a 16-line `@decision` carrying the operator sign-off "Authorise the core fix" (2026-09-02). Claim confirmed. |
| Test-mode purity | `grep -rE 'useTestAttrs\|import.meta.env\|process.env\|NODE_ENV' --include='*.ts'` over the 15 module source files | **none.** The exercised path IS the PROD path; even the sanctioned FE-2865 `useTestAttrs` carve-out is unused. |
| Negative controls | `git apply --check` ×15, then apply + targeted spec + `git apply -R` ×15 | `15/15` apply-check clean; `15/15` RED on their own assertion; tree restored clean after every revert |
| Fixture re-capture | `pnpm fixtures:generate invoices` | `REAL_EXIT=0`, 7 generator tests passed against `https://api.staging.upmind.io`, `[lint] OK: 316 fixture(s) across 23 unit(s) clean.` |
| Branch pushed? | `git ls-remote gitlab feature/fe-3031-…` | **empty** — not pushed. Surfaced as a GAP. |

## Fixture provenance

**RE-CAPTURE:** `cd <worktree> && pnpm fixtures:generate invoices`

```
[fixtures:generate] Capturing "invoices" against https://api.staging.upmind.io
[fixtures:generate invoices] real-corpus coverage — consolidation:false creditNote:false largeBundle:false delegatedOrChild:false paidRow:true
 Test Files  1 passed (1)
      Tests  7 passed (7)
[fixtures:generate] Linting captured fixtures...
[lint] OK: 316 fixture(s) across 23 unit(s) clean.
REAL_EXIT=0
```

Env `packages/headless/.env.recording` (`VITE_API_URL=https://api.staging.upmind.io`,
`RECORDING_BRAND_ORIGIN`), credentials `tests/fixtures/credentials.ts`. The shipped fixtures were
copied to a scratch path **before** the capture; all **8** files were genuinely rewritten by the
live run (`git status` showed all 8 modified, mtimes all `18:33:41`), then restored with
`git checkout --` and re-verified clean, so the diff under verification was not mutated.

**STRUCTURAL COMPARISON** (recursive key-path → JS-type skeleton, plus enum values for
`status`/`code`/`slug`/`type`/`state`/`category` leaves; volatile values excluded):

| Fixture | Key paths | shipped-only | fresh-only | Verdict |
| --- | --- | --- | --- | --- |
| `get-invoices-case-default.json` | 571 | 0 | 0 | IDENTICAL |
| `get-invoices-id-case-first.json` | 1824 | 0 | 0 | IDENTICAL |
| `get-invoices-id-case-not-found.json` | 43 | 0 | 0 | IDENTICAL |
| `get-invoices-id-case-paid.json` | 1824 | 0 | 0 | IDENTICAL |
| `get-invoices-id-case-signed-out.json` | 40 | 0 | 0 | IDENTICAL |
| `get-invoices-id-case-unpaid.json` | 1552 | 0 | 0 | IDENTICAL |
| `get-invoices-unpaid-amount-id-case-missing-currency.json` | 44 | 0 | 0 | IDENTICAL |
| `get-invoices-unpaid-amount-id-currency-id.json` | 38 | 0 | 0 | IDENTICAL |

`FILES_COMPARED=8 STRUCTURAL_DIFFS=0`. **Recorded, not fabricated, not drifted.** The three stale
unconsumed fixtures the brief flagged as refreshed are among the 8 and match.

**CONSTRUCTED ROWS LABELLED:** **true**, in both docblock and test title.
Docblocks: `## Provenance` sections in `invoices.attribution.int.test.ts:15-20`,
`invoices.mapping.int.test.ts:12-27`, `invoices.payment-state.int.test.ts:15-17`,
`invoices.consolidatable-count.int.test.ts:16-19`. Titles: every constructed case carries
`(constructed — <the exact toggle>)`, e.g. `"AC-13 (constructed — parent is SOME OTHER client,
not the reader, AND delegate_related toggled) …"` and `"AC-16 (constructed — payments present,
unpaid_amount zeroed) …"`. The generator itself logs the real-corpus gaps
(`consolidation:false creditNote:false largeBundle:false delegatedOrChild:false`), so AC-5/6/7/13/16
are honestly proven on labelled single-field toggles over **real captured rows** — never a
hand-built body, never presented as capture.

**VERDICT: PASS**

## Identity retargeting (A7)

`verify-reality-check.companion.md`: for this module the retarget is a **declared `client_id`
filter column**, never a path segment — the client lane has no `api/clients/{id}/invoices` route.

| Read | Request retarget asserted | Auth transport asserted | Durable |
| --- | --- | --- | --- |
| list (`loadList`) | yes — `expect(decodeURIComponent(request.url)).toContain('filter[client_id|eq]=<TARGET>')` on the first request of a `.for()` scope (`scope-identity:159-162`) | yes — `assertClientIdentityTransport` (`invoices.int-helpers.ts:406-414`): `authorization === 'Bearer <reading client's own token>'` **and** `assertNoActingAsHeaders` | yes — 5 assertions at `:261-382` across `filterCreditNotes()`, bare `setCriteria({ filters })`, `sortBy()`, `filterConsolidatable()`, plus the explicit-declaration manual door |
| unpaid-existence count | yes — `:227-229` on the `limit=1` request | yes — `:230` | n/a (private criteria object) |
| consolidatable count | yes — on the `limit=1` + `is_consolidation` request | yes — `assertClientIdentityTransport` | n/a (private criteria object) |

Payload is never the proof: the B2 test asserts the request **and** the mapped attribution on the
same call, precisely because those two could previously disagree. Negative controls:
`invoices.scope.retarget-drop`, `invoices.list-retarget-drop`,
`invoices.unpaid-existence-retarget-drop`, `invoices.retarget-not-durable` — all four flip their
own assertion RED. Verified by this seat.

**VERDICT: PASS**

## Negative controls

`git apply --check` clean on **15/15**. Each then applied, its paired assertion run, and reverted;
the tree was verified clean after every revert.

| Mutant | Applied? | RED for own assertion only? | Reverted green? |
| --- | --- | --- | --- |
| `invoices.attribution-child-first` | yes | yes — `× resolves isDelegated FALSE whenever isChildOfClient is true…` | yes |
| `invoices.balance-aliased` | yes | yes — `Tests 1 failed \| 952 skipped` | yes |
| `invoices.bundle-count-from-array` | yes | yes — `1 failed` | yes |
| `invoices.category-label-precedence` | yes | yes — `× labels a consolidation credit note as a consolidation…` (1 failed / 867 skipped) | yes |
| `invoices.clear-method-omitted` | yes | yes — `× AC-4 sends payment_details_id: null as a PRESENT key…` | yes |
| `invoices.consolidatable-count-shares-list-query` | yes | yes — `1 failed` | yes |
| `invoices.has-unpaid-no-request` | yes | yes — `1 failed` | yes |
| `invoices.include-set-shrunk` | yes | yes — `1 failed` | yes |
| `invoices.list-retarget-drop` | yes | yes — `1 failed` | yes |
| `invoices.meta-throws-on-failed-load` | yes | yes — `1 failed` | yes |
| `invoices.payment-card-details` | yes | yes — `1 failed \| 867 skipped` (unit) | yes |
| `invoices.retarget-not-durable` | yes | yes — `2 failed \| 3 passed`: `filterCreditNotes()` + bare `setCriteria({ filters })`, the two doors it removes. `sortBy()` / `filterConsolidatable()` / the manual door stay green because their own presets carry `client_id`. Graded on flipping its OWN assertions, not on breadth. | yes |
| `invoices.scope.retarget-drop` | yes | yes — `1 failed` | yes |
| `invoices.unpaid-existence-retarget-drop` | yes | yes — `1 failed \| 1 passed` (its no-target twin correctly stays green) | yes |
| `useValidation.dotted-key-path-split` | yes | yes — `× AC-2 (contract vs implementation) a status filter through setCriteria MUST carry filter[status.code\|…]` | yes |

**MUTANTS I VERIFIED MYSELF: 15/15**

Note: `invoices.meta-throws-on-failed-load.must-fail.patch` is the only one of the 15 with **no
`# must-fail:` header** declaring its paired assertion. I derived its pair from the mutation
(`useInvoice.meta.ts` `paymentState`, FAILED → PENDING on an absent invoice) and confirmed RED
against `invoices.payment-state.int.test.ts` "a failed load reports no guessed payment state".
The control is sound; the missing header is a documentation gap, routed to the developer seat.

## Parity table

All 4 `client|staff × self|client` cells carry a disposition. `client×self` and `client×client`
are `Direct`; **no cell carries `blocked_by:`** (the one that did — `client×client`, blocker H1 —
was cleared against the landed fix and its green read-back, which I re-ran).

All 12 capability rows R01–R12 carry a disposition. Every `Dropped-*` row is operator-signed:
`staff×self`, `staff×client`, `R07`, `R08`, `R11` → `op:dom@upmind.com:2026-09-01`;
`R12` → `op:dom@upmind.com:2026-09-08`.

**UNSIGNED DROPS: 0. UNDISPOSITIONED CELLS: 0. UNDISPOSITIONED ROWS: 0.**
No verdict-blocking irregularity (A9). Row *correctness* was audited by re-reading the oracle at
source — see the capability table above; every citation the rows lean on was line-verified.

## Honest gaps (none verdict-blocking)

| Gap | Disposition claimed | Is it honest? |
| --- | --- | --- |
| **1. Branch not pushed.** `git ls-remote gitlab <branch>` is empty, so the base skill's "read the pushed branch HEAD" step could not be honoured. | — | **Honest, and mine to surface.** The verdict binds to local `bdfc02ef5` with an empty-diff fingerprint (both trees fully committed), so nothing unreviewed is hiding in the working tree. Routes to the conductor: push before the MR. |
| **2. `ci/lint-plan-compliance.mjs` does not exist** in this repo (no `ci/` directory, worktree or main). `parity.yaml:19-22` says so itself and states the hand grade is load-bearing. | Hand-graded | **Honest.** I re-graded `parity.yaml` by hand this pass; the substance holds. The gate's absence is disclosed in the artefact, not hidden behind a claimed exit 0. |
| **3. No `labs-nuxt` invoices playground page / `invoices.steps.ts`.** I confirmed the baseline claim at source: `playgrounds/labs-nuxt/playwright.config.ts:6-7` imports `./tests/e2e/browser-world` and `./tests/e2e/catalogs`, and `playgrounds/labs-nuxt/tests/` neither exists nor is git-tracked. | Baseline defect on `develop`, recorded in `bdd.md` + `requirements.md:59` + `invoices.traceability.test.ts:8-16` | **Honest.** No AC, no parity row and no JTBD noun requires it; driveability is proven at the request-contract level instead. The factory goal's "driveable page" half stays unevidenced — outside this seat's gate, routed to the conductor's end-state grading. |
| **4. Stale docblock, `invoices.criteria-presets.int.test.ts:10-24`** still says `filterConsolidatable()` / `filterCreditNotes()` "issue NO request", that "AC-7's entire credit-notes mechanic is unreachable", and that the first two tests "are EXPECTED to fail". All three pass; the `useValidation` dotted-key fix closed both defects. | — | **Under-claims, so not cosplay** — but a filed narrative contradicting a green run is a hazard of exactly the kind this gate exists to catch, in the opposite direction. Carried from my prior run, still open. Routes to the prover. |
| **5. Stale docblock, `invoices.consolidatable-count.int.test.ts:23-36`** declares `consolidatableCount` "never resolves to the dedicated request's positive total … stays `0` regardless of the response served". It now resolves — `7` and `2` on two distinct responses, both green. | — | **Same class as #4.** Superseded by the B3 repair; the prose was not updated with the code. Routes to the prover. |
| **6. `consolidatableCount` has no zero-direction assertion.** | — | **Honest note, not a gap.** Two distinct positive values (`7`, `2`) exclude both the pinned-at-`0` defect and a hardcoded constant; `0` is the member's own initial value, so the zero case is the weakest assertion available here. Suggested, not required. |
| **7. `invoices.mappers.ts:70` comment still cites `oracle:172-179`** for the label precedence; the real anchor is `oracle:175-180` (`:172-174` is the tail of `mappedPromotions`). | `parity.yaml` R06 discloses it as the developer's lane | **Honest** — disclosed, behaviour verified correct at source, comment-only. |
| **8. `R08`'s `tracker` field is a placeholder**, not a Linear issue id. | Operator-signed, quantity served via `_converted`/`_formatted`/`amountCredited` | **Honest.** The drop is scoped out by signature; the Linear id is still owed by the operator. |
| **9. `invoices.meta-throws-on-failed-load.must-fail.patch` carries no `# must-fail:` header.** | — | **Honest note.** I derived and verified its pair myself; the control is sound. Routes to the developer seat. |
| **10. Two runs of mine were SIGKILLed (`REAL_EXIT=137`)** mid-suite under memory pressure. | — | **Reported, never as green.** Each was re-run to completion afterwards; every figure in this artefact comes from a run that reached its own summary line with a `REAL_EXIT` I captured. The shared serial guard was honoured throughout — it denied one of my commands and I waited it out rather than working around it. |

## Correction to my own prior artefact

`verify.md:88-93` of the previous run said `loadList` does **not** auto-seed the `client_id`
filter while `loadConsolidatableCount` does. **That is no longer true and this pass corrects it:**
all three reads now seed it (`loadList` at `invoices.services.ts:258`, `loadUnpaidExistence` at
`:394`, `loadConsolidatableCount` at `:425` **and** `:443`), and `loadList`'s column is
additionally **durable** across every published `filters`-branch write via `withDurableClientId`
(`:195-215`, wired at `:260`). The prior artefact also under-counted the negative controls (11,
now 15) and reported 943 integration tests against today's 953. All superseded by this document.

## What's missing

Nothing load-bearing. Every capability the parity oracle exposes within this story's declared
scope is present, driveable from the public composable surface, and proven by a read-back that
resolves to a real test. No load-bearing part of the core deliverable is absent, stubbed, or only
cosmetically present, and no drop is unsigned.

## Post-cutoff re-derivation (same pass, same seat)

This dispatch was interrupted by a network error mid-pass. Every sub-gate above was then
**re-executed a second time, first-hand, in this worktree** (`pwd`-stamped, `19:17`–`19:50`):

- integration `131 passed (131)` · `951 passed | 2 todo (953)` · `REAL_EXIT=0` (251.42s)
- unit `102 passed (102)` · `867 passed | 1 todo (868)` · `REAL_EXIT=0` (29.09s)
- `pnpm build` `REAL_EXIT=0`, six projects each ending `Done`
  (`packages/{types,headless,client-vue}`, `design-system/packages/{tokens,ui}`, `apps/cart`).
  Honest note: `vite-plugin-dts` prints **35 non-fatal `error TS…` lines** during
  `packages/client-vue`'s declaration emit — all from `design-system/**` sources (its own,
  uninstalled pnpm workspace) and a few `client-vue` `.vue` implicit-`any`s. `vue-tsc
  --noEmit` itself emitted none, the plugin's lines are post-type-check, and **zero** name
  `headless` or `invoices`. Pre-existing, not this story's, and not a false green: the exit
  code and the six `Done` lines are what I measured.
- negative controls: `git apply --check` clean **15/15**, then all **15** applied → RED on
  their own named assertion → `git apply -R` → `TREE_CLEAN`, verified individually
- fixture re-capture repeated live: 7/7 generator tests against `https://api.staging.upmind.io`,
  `[lint] OK: 316 fixture(s) across 23 unit(s) clean`, all 8 fixtures rewritten then restored
  (pre- and post-restore digest of the 8 files identical:
  `eaae125b628e65b394a4f1f618060d5c2bb6614dd39432a229fa1c2071b745a1`), fresh-vs-shipped
  `FILES_COMPARED=8 STRUCTURAL_DIFFS=0`
- H4: the full integration inventory re-listed (951 entries / 131 files, exit 0) and **six**
  read-back patterns re-run with real `-t` filtering — selected counts matched the inventory
  exactly (3, 5, 5, 3, 3, 2 tests; 1 file each; all passing)

No figure in this artefact rests on a log I did not produce.

---

# Verify — /factory scenario lane (playground page), 2026-09-09

**Seat:** verifier · **verifiedSha:** `3a550b3e5a8ae37db1abe9313fa78305ec6a9d7d` (local HEAD; branch unpushed)
**Worktree:** `/Users/dom/Documents/upmind-monorepo/.claude/worktrees/fe-3031-invoices`

## VERDICT: ABSENT

The page boots and draws, its sort control works off the module's own channels,
and its six action controls all name live members. But **two of the three
criteria surfaces the lane requires are not driveable by a hand**, and both were
reported as working.

### 1. The filter bar draws 6 of its 8 declared elements — both multi-selects are absent

`invoices.schemas.ts:264-318` declares 8 elements. Mounted through the real
renderer registry (`filter.harness.ts`'s `mountFilters`, the same harness
`filter-renderer.test.ts` uses), the bar renders **6** `form-item` fields:

    RENDERED data-test-values: ["filters-number-eq","filters-is-consolidation-eq",
      "filters-total-amount-eq","filters-net-amount-eq","filters-create-datetime",
      "filters-due-date"]
    expected 6 to be 8

Missing: `status.code` and `category.slug` — **the two multi-selects**.
`options.format: "multi-select"` (`invoices.schemas.ts:278`, `:284`) matches no
tester in the registry; the registered filter formats are `search`,
`button-group`, `toggle-group`, `range` and `radio`
(`FilterSearchRenderer.vue:85`, `FilterButtonGroupRenderer.vue:84`,
`FilterToggleGroupRenderer.vue:100`, `FilterRangeRenderer.vue:161`,
`EnumRadioCollapsibleRenderer.vue:92`). `"multi-select"` appears nowhere in
`packages/client-vue`. The leaf is `type: ["array","null"]` with the vocabulary
on `items.oneOf`, so JSONForms' `isEnumControl` / `isOneOfControl` (the two
`rank: 2` testers) both miss it.

Control run, same harness, client-email bar: **3 declared / 3 rendered, green**.

The late 🔴 this run believed closed is **not** closed. The `{const,title}`
vocabularies did land on the schema (11 status options, 8 category options,
both derived from `Object.values(...)`), but neither control reaches the DOM,
so neither can be populated from anything.

### 2. The pager draws and throws

`useInvoices().useActions()` returns exactly ten members
(`useInvoices.actions.ts:201-234`): `assignPaymentMethod`, `destroy`,
`filterConsolidatable`, `filterCreditNotes`, `invalidate`, `isReady`,
`refresh`, `refreshAfterPayment`, `setCriteria`, `sortBy`. It has **no**
`filterBy`, `nextPage` or `prevPage` — the three members
`TableChannelCell.useActions()` requires (`useTableChannel.types.ts`) and that
the sibling precedent publishes (`useClientEmails.actions.ts:153`, `:168`,
`:173`).

`ownsQueryState` (`useModulePort.ts:42-45`) tests only `context.query` and
`context.schemas.query` — the context half — then `:147-149` builds the channel
behind `cell as unknown as TableChannelCell`, which hides the missing actions
from the compiler. So `hasPagination` (`ListSurface.vue:1320`, `!!props.table`)
is **true**, the pager region renders (`:306-325`), and `onPaginate`
(`:885-891`) emits PAGINATE into `useTableChannel.emit`, which calls
`actions.nextPage()` / `actions.prevPage()` (`useTableChannel.ts:159-160`).

Executed against the module's real member set:

    PAGINATE -> TypeError: actions.nextPage is not a function
    FILTER   -> TypeError: actions.filterBy is not a function
    SORT     -> no throw

FILTER is never emitted by the page (the bar writes through
`criteria.set` → `useInternals().query.setCriteria`), so only PAGINATE is
live-reachable — but it is the page's only page-change path.

### 3. Two RED gates this story caused, filed as "pre-existing and unrelated"

- `icon-resolution.spec.ts` — 6 unresolved icons, **4 of them this story's**:
  `invoices.scenario.ts:49 receipt-01`, `invoices.presentation.ts:342
  layers-two-01`, `:351 file-minus-02`, `:369 credit-card-refresh`. Each renders
  the fallback glyph.
- `forced-surface-coverage.spec.ts` — now names `invoices` alongside the
  pre-existing `client-notes`: "these scenarios route a page whose forced states
  nothing arms".
- `negative-controls.spec.ts` (27 entries) is genuinely pre-existing — no
  invoices entry.

The prover's claim that all three module-project failures are "pre-existing and
unrelated, identical before and after this story" is false for two of them.

## What was re-executed (all from the worktree; pwd stamped in every run)

| Check | Result |
| --- | --- |
| `packages/headless` `pnpm vitest run` | 233 files / 1820 passed / 3 todo, exit 0 — claim confirmed |
| `labs-nuxt` `--project unit` | 19 files / 358 passed, exit 0 — claim confirmed |
| `labs-nuxt` `--project module` | 3 failed / 157 passed — counts confirmed, characterisation false |
| `labs-nuxt --project module invoices-declaration` | 21 passed |
| `headless --project unit invoices.traceability` | 2 passed |
| 16 `*.must-fail.patch` `git apply --check` | 16/16 clean |
| D8 mutant `invoices.page-control-name-drift` | applied → RED on its own assertion + 2 same-file collateral; reverted → 21 passed |
| Invoices filter bar mounted through the real registry | **6 rendered / 8 declared** |
| `useTableChannel.emit` over the module's real member set | **PAGINATE and FILTER throw** |

## Not re-run (surfaced gap)

- `pnpm build` (claim: exit 0, six packages) — not re-executed; outside the
  capability question and above the test ceiling for this pass.
- Linear mirror — no Linear tool is available to this seat's invocation; this
  verdict is filed here only and needs mirroring by the conductor.

## Routes back to

**developer** — (a) a registered renderer for the two multi-select filter
columns, or a re-declaration against a format the registry serves; (b)
`nextPage` / `prevPage` (and `filterBy`) on `useInvoices().useActions()`, or an
honest `hasPagination` that does not draw a pager the module cannot serve; (c)
four icon names the resolver can serve.

## Core deliverable (skill §1 distillation)

A client can read their own and an entitled client's invoices — list, filter,
sort, page; one invoice in full with its live unpaid amount, consolidation
relations, payment state and credit notes; assign or clear a payment method —
with the `client × client` read addressed to the target client and no other.
**For this lane specifically:** a playground page through which a hand can
actually drive that surface.

Parity grid: 4 cells, 12 capability rows. Six `Dropped-with-issue-reference`
rows, **all six operator-signed** (`parity.yaml:42, 50, 346, 354, 389, 429`,
`op:dom@upmind.com`). **No unsigned drop — no §1/A9 laundering irregularity.**
Those six rows are scoped out of the deliverable and were not required.

## Step 4 — A7 mock-boundary (scope work: `.for('client', id)`)

Both halves the repo companion requires are asserted, and I confirmed the
assertions are live rather than dead helpers:

- **URL retarget** — `invoices.scope-identity.int.test.ts` asserts the outbound
  query string carries the TARGET client id and, at `:111` and `:257`,
  `expect(request.url).not.toContain(OTHER_CLIENT_ID)`. The retarget for this
  module is a declared `client_id` filter column, not a path segment, so the
  assertion is correctly made against the query string.
- **Auth identity transport** — `invoices.int-helpers.ts:406-414`
  `assertClientIdentityTransport` pins
  `headers.authorization === 'Bearer <scope-resolved session token>'` and
  `assertNoActingAsHeaders` (`:389-394`: `x-acting-as`, `x-impersonate`,
  `impersonation`). **Live** — called at `invoices.collection.int.test.ts:73`
  and `invoices.unpaid-amount.int.test.ts:47`.
- No response-payload-only proof. The cosplay shape (target id mirrored into the
  response while the request is unchanged) is excluded.

**A7: satisfied.** Confirmed green inside the 233-file / 1820-test headless run.

## Step 4b — Recorded-fixture re-capture (the diff ships 8 fixtures)

The diff ships 8 recorded fixtures under
`packages/headless/src/modules/invoices/__tests__/fixtures/`. Stored provenance
was NOT accepted. All four links of the repo capture chain
(`code-test-integration.companion.md` "Capture path") were present in-repo —
generator `invoices.fixtures.ts`, command `pnpm fixtures:generate invoices`,
env `packages/headless/.env.recording`, credentials
`tests/fixtures/credentials.ts` — so the 2026-08-05 "no staging credentials"
excuse was unavailable. **I re-captured live:**

    [fixtures:generate] Capturing "invoices" against https://api.staging.upmind.io
    Test Files  1 passed (1)   Tests  7 passed (7)
    [lint] OK: 316 fixture(s) across 23 unit(s) clean.

Structural comparison (key paths, shapes, types, status codes; volatile ids and
timestamps excluded) of the 8 shipped fixtures against the fresh capture:

    MATCH  get-invoices-case-default.json                          onlyShipped=0 onlyFresh=0
    MATCH  get-invoices-id-case-first.json                         onlyShipped=0 onlyFresh=0
    MATCH  get-invoices-id-case-not-found.json                     onlyShipped=0 onlyFresh=0
    MATCH  get-invoices-id-case-paid.json                          onlyShipped=0 onlyFresh=0
    MATCH  get-invoices-id-case-signed-out.json                    onlyShipped=0 onlyFresh=0
    MATCH  get-invoices-id-case-unpaid.json                        onlyShipped=0 onlyFresh=0
    MATCH  get-invoices-unpaid-amount-id-case-missing-currency.json onlyShipped=0 onlyFresh=0
    MATCH  get-invoices-unpaid-amount-id-currency-id.json           onlyShipped=0 onlyFresh=0
    STRUCTURAL RESULT: all fixtures match

**Neither fabricated nor drifted — genuinely recorded.** The shipped fixtures
were backed up to scratch before the run and restored byte-for-byte after;
`git status` on the fixtures directory is clean.

## Step 5 — Fail-closed guard

No uncertainty was resolved upward. The two ABSENT findings are executed
failures, not inferences: `6 rendered / 8 declared` from a real mount, and
`TypeError: actions.nextPage is not a function` from a real emit. The verdict
would be ABSENT on the fail-closed rule alone even had they been merely
suspected.

---

# Verify — /factory scenario lane, RE-GRADE, 2026-09-09

**verifiedSha:** `6dba1c875acf9d9f1aaf8a261bdf83d32cd087e6` (local HEAD; branch unpushed)

## VERDICT: ABSENT

Three of the four findings are genuinely closed. The headline one is not: the
two facets now **render and populate** but **cannot write the criteria model**.

### CLOSED — the pager, `filterBy`, sort

`useInvoices().useActions()` now publishes 13 members including `filterBy`
(`useInvoices.actions.ts:145`, exposed `:216`), `nextPage: query.fetchNextPage`
(`:231`) and `prevPage: query.fetchPreviousPage` (`:234`). Driven over the real
member set through the runtime channel:

    PAGINATE(3 from 2) -> nextPage([])
    PAGINATE(1 from 2) -> prevPage([])
    FILTER             -> filterBy([{}])
    SORT               -> sortBy([[{"field":"number","dir":"asc"}]])
    Tests 4 passed (4)

`hasPagination` went the "module owns a pager" way — coherent: the arrows draw
and now reach real members.

`filterBy` writes the filters branch, which is the H1 defect class. It is safe
**by construction**: `useInvoices.ts:41` takes the handle from
`service.loadList()`, which returns `withDurableClientId(handle, clientId)`
(`invoices.services.ts:260`); that wrapper returns `{ ...handle, setCriteria }`
(`:226`) and re-asserts `client_id` on any filters-bearing write without a
truthy `client_id.eq` (`:206-224`). **No test drives `filterBy` / `nextPage` /
`prevPage`** — surfaced gap, below.

### CLOSED — the four icons

`icon-resolution.spec.ts` now names only the two pre-existing `client-notes`
icons. All four invoices icons resolve (`tag-02`, `box`, `file-attachment-01`,
`refresh-cw-01`).

### STILL ABSENT — the two facets render, populate, and cannot write

Both now mount, with their full vocabularies:

    DECLARED: 8  RENDERED: 8
    ["filters-number-eq","filters-status-code-in","filters-category-slug-in",
     "filters-is-consolidation-eq","filters-total-amount-eq",
     "filters-net-amount-eq","filters-create-datetime","filters-due-date"]
    OPTIONS filters-status-code-in: 11
    OPTIONS filters-category-slug-in: 8
    PER-FIELD control counts: [2,0,0,3,3,3,2,2]

The two facets carry **zero** `input`/`button`/`select` elements; their options
are `DIV[role=checkbox] tabindex=-1`. Driving them writes nothing — proven
gesture-independently by emitting the component's OWN contract event, with an
in-bar control:

    OptionTileGroup instances found: 2
    MODEL after direct emit: {"sort":[{"field":"create_datetime","dir":"desc"}]}
    WROTE status.code.in = undefined
    CONTROL model after typing in the search box:
      {"sort":[...],"filters":{"number":{"eq":"INV-9"}}}   <- passes

Root cause, quoted — `StringsRenderer.vue:36-40`:

    const { control, appliedOptions, formFieldProps, onInput } =
      useUpmindUIRenderer({
        ...useJsonFormsMultiEnumControl(props),
        handleChange: () => {} // Provide a default handleChange function
      });

The no-op is spread LAST, overriding JSONForms' real `handleChange`, and
`utils.ts:211-213`'s `onInput` writes through exactly that function. Every
write from this renderer is swallowed.

`StringsRenderer.vue` is NOT in this story's diff — the defect is pre-existing
in `packages/client-vue`. But the fix **routed the two facets onto it**, so the
capability is unchanged from the last pass: **the page cannot filter by status
or category.** Before: nothing rendered. Now: it renders and does nothing. The
failure moved one layer down; it did not close.

### The coverage hole is still open

`filter-renderer.test.ts:53-56` still mounts only client-email and
client-email-history; nothing in `packages/client-vue` or `labs-nuxt` mounts the
invoices bar. `client-vue` is untouched by this commit. The class that shipped
6-of-8 green can ship again — and did, in a new form.

## What's missing

1. **A working write path for the two facets** — remove the no-op
   `handleChange` override in `StringsRenderer.vue` so `onInput` reaches the
   model, or route the two columns onto a renderer that writes. Owner:
   **developer**, in `packages/client-vue` (outside this story's original write
   lane — needs an operator ruling on scope, or a tracked issue).
2. **A gate that mounts the invoices bar and drives a facet to a model write** —
   asserting a criteria write, not merely that a field appeared. Owner:
   **prover**.
3. **An A7 read-back for `filterBy`** (and a paging read-back for
   `nextPage`/`prevPage`). Owner: **prover**.
4. **A rendered-preset spec for the `invoices` scenario** — the one remaining
   module-project failure that is this story's. Owner: **prover**.
5. **`LIVE_CAPABILITIES` drift** — the D8 gate's hand-typed set is 10 members
   against the module's 13, missing exactly `filterBy`, `nextPage`, `prevPage`.
   No false red today; the transcription risk named last pass materialised in
   one commit. Owner: **prover**.

## Evidence re-run at this SHA

| Check | Result |
| --- | --- |
| headless `pnpm vitest run` | 233 files / 1820 passed / 3 todo, exit 0 |
| labs-nuxt all four projects | 16 failed / 965 passed / 4 skipped (985) |
| labs-nuxt `--project module` | 3 failed / 157 passed — 1 of 3 now ours |
| `invoices-declaration.spec.ts` | 21 passed |
| `invoices.scope-identity.int.test.ts` | 12 passed |
| 16 must-fail patches `git apply --check` | 16/16 clean |
| D8 mutant (re-rolled) | RED on own assertion → reverted 21 passed |
| scope retarget-drop mutant (re-rolled) | RED on 9 A7 assertions → reverted 12 passed |
| fixtures unchanged since `3a550b3e5` | yes — the live re-capture carries forward |
| invoices bar mount | 8/8 fields, 11 + 8 options, **both facets inert** |
| channel emit over real member set | all four intents reach real members |

Attribution: our branch touches exactly three labs-nuxt files
(`useInvoices/invoices.scenario.ts`, `useInvoices/invoices.presentation.ts`,
`__tests__/invoices-declaration.spec.ts`). The 13 component-project failures
touch none of them and are the declared `gitlab/develop` drift.

---

# Verify — /factory scenario lane, RE-GRADE 2, 2026-09-09

**verifiedSha:** `3752377b9f1992edf6294ce7bca3a8a8eab041a4` (local HEAD; branch unpushed)

## VERDICT: ABSENT

The fix is real work on the right mechanism and it changed real behaviour — the
facet write now leaves the renderer. It lands at the **wrong path**, and the
selection never reaches the wire.

### The measurement

Driving the STATUS and CATEGORY facets through the real registry now puts a
value in the form model — my previous accessor read the wrong key and I have
corrected it:

    FORM MODEL: {"status":{"code":{"in":["invoice_unpaid","invoice_overdue"]}},
                 "category":{"slug":{"in":["recurrent"]}}}

The declared columns are the **literal dot-bearing property names**
`"status.code"` and `"category.slug"`. The write landed **nested** —
`filters.status.code` — because JSONForms' `handleChange(path, value)` /
`addItem(path, item)` compose a dotted STRING path and the model writer splits
on every dot. Translating each shape through the module's own wire builder:

    WIRE from the FORM's model:   "filter[status.code|in]": ""                              <- EMPTY
                                  "filter[category.slug|in]": ""                            <- EMPTY
    WIRE from the DOTTED model:   "filter[status.code|in]": "invoice_unpaid,invoice_overdue" <- the real filter
                                  "filter[category.slug|in]": "recurrent"

The list is never narrowed. Selecting a status or a category still does nothing
to what the user sees.

### The repo already carries the receipt for this exact failure

`invoices.services.ts:210-212`, the developer's own comment:

    // Array path, not a dotted string: this module's filter keys ("status.code",
    // "contracts.id") are literal, dot-bearing property names, and lodash's
    // string form reads a dot as a nested-path separator.

And `useValidation.dotted-key-path-split.must-fail.patch`, already committed:

    # a schema property declared with a literal "." (eg "status.code") is
    # exploded into a nested object (`{ status: { code: … } }`) instead of
    # written as one flat key. The dotted filter column is silently dropped
    # from the wire

`useModelParser` was fixed for this on the criteria side. The renderer side was
not, and the fix walked into the same trap one layer up. Only the two facets are
affected — every other drawn column (`number`, `is_consolidation`,
`total_amount`, `net_amount`, `create_datetime`, `due_date`) has no dot, so
nested and flat coincide.

### Why every gate stayed green

The developer's proof asserted "the model carries the driven values". The model
*does* — at the wrong path. The new mutant attacks that same assertion, so it
also passes over the defect. The assertion that decides the capability is the
**wire** (or the literal dotted leaf), which nothing asserts.

### Blast radius — independently re-derived, claim CORRECT

`StringsRenderer`'s tester needs `array` + `uniqueItems` + `items.oneOf` /
`items.enum`. Every other `uniqueItems` in the repo is either a **sort** branch
with `items: { type: "object" }` (client-address, client-company,
client-custom-fields, client-email, client-email-history, client-notes,
client-phone, invoices:214, product-catalogue:60 — the `enum` at the harness
sites sits on `items.properties.field`, one level deeper than the tester reads)
or a bare `items: { type: "string" }` with no vocabulary (brand:45,
product-catalogue:42, which declares no uischema at all). **Exactly two live
consumers — the two invoices facets.** No other consumer ever reached this
renderer, so none could have grown a workaround, and none changes behaviour.

## What's missing

1. **The facet write must reach the wire as the literal dotted key.** Owner:
   **developer** — `StringsRenderer.vue` must write the column as one literal
   key (the array-path form the services layer already uses), not a dotted
   string JSONForms will split.
2. **A gate asserting the WIRE, not the model.** Owner: **prover**. Still none.
3. **A7 read-back for `filterBy`; paging read-back for `nextPage`/`prevPage`.**
   Owner: **prover**. Still zero.
4. **A rendered-preset spec for `invoices`.** Owner: **prover**. Still open.
5. **`LIVE_CAPABILITIES` 10 vs 13.** Owner: **prover**. Still drifted.
6. **The new mutant is parked in `.factory/fe-3031-mutants/`**, which no
   committed runner walks, and its proof was an uncommitted ephemeral script.
   Its header says so plainly — creditable honesty — but it is not yet a
   control. Owner: **prover**, when the permanent gate lands.
7. **`Proven RED <YYYY-MM-DD>` still unfilled** on
   `invoices.page-control-name-drift.must-fail.patch:31`.

## Evidence re-run at this SHA

| Check | Result |
| --- | --- |
| client-vue suite | 13 files / 124 passed — claim confirmed exactly |
| headless | 233 files / 1820 passed / 3 todo, exit 0 |
| labs `--project module` | 3 failed / 157 passed |
| `invoices-declaration.spec.ts` | 21 passed |
| icon-resolution | only 2 pre-existing client-notes icons — invoices icons stay fixed |
| our client-vue scope (per-commit) | exactly `StringsRenderer.vue` — matches the operator's authorisation |
| facet drive → form model | writes land, nested at `filters.status.code` |
| facet model → `translateQuery` | `filter[status.code\|in]: ""` — **empty wire** |
| new mutant, driven by me | applied → filters branch `null`; reverted → write lands |
| fixtures unchanged since `3a550b3e5` | yes — live re-capture carries forward |

### Fairness control — one model, one mount, dotted vs non-dotted

Because I misread the key once, I drove a NON-dotted column alongside the two
dotted facets in the same mount and translated the single resulting model:

    ONE FORM MODEL: {"number":{"eq":"INV-42"},
                     "status":{"code":{"in":["invoice_unpaid"]}},
                     "category":{"slug":{"in":["recurrent"]}}}
    filter[number|eq]        = "INV-42"      <- non-dotted reaches the wire
    filter[status.code|in]   = ""            <- dotted, empty
    filter[category.slug|in] = ""            <- dotted, empty

The non-dotted column reaches the wire from the same model that leaves both
dotted columns empty. It is the dotted-key split, not a broken probe.

---

# Verify — /factory scenario lane, RE-GRADE 3, 2026-09-09

**verifiedSha:** `4392ab6363cd18ecf810b7400c76f6f65edd6252` (local HEAD; branch unpushed)

## VERDICT: ABSENT (fail-closed — skill §5)

All three prior stages are genuinely closed and I proved each myself. One new
defect is measured but NOT isolated, and the probe that would settle it could
not be run. Uncertainty on the core capability resolves to ABSENT.

### CLOSED — the dotted key now reaches the wire

    MODEL: {"status.code":{"in":["invoice_unpaid","invoice_overdue"]},
            "category.slug":{"in":["recurrent"]},"number":{"eq":"INV-42"}}
    filter[number|eq]        = "INV-42"
    filter[status.code|in]   = "invoice_unpaid,invoice_overdue"
    filter[category.slug|in] = "recurrent"

The literal dotted key is written as one segment. A single selection on either
facet filters correctly; the non-dotted control is unaffected.

### The gate, graded per stage — it closes all three

| Stage | Failure | Caught by the new gate? |
| --- | --- | --- |
| 1 | nothing rendered | YES — `:67` render count 8, `:74-78` option counts 11/8 |
| 2 | rendered, write swallowed | YES — `:113` post-`translateQuery` would read `""` |
| 3 | write landed nested, wire empty | YES — `:113` is post-`translateQuery`; proven by its own mutant |
| 4 (new) | second click duplicates; de-select never removes | NO — the gate drives one click per facet (`:95`, `:106`) |

The gate is not cosmetic: `invoicesQuery()` reads
`useInvoices().as("self").useContext().schemas.query` (never transcribed) and
`:135-141` asserts that identity. My anti-overfit objection is closed.

### NEW, MEASURED, NOT ISOLATED — the multi-select cannot be changed

Three sequential DOM clicks on status tiles, through the repo's own
`mountFilters` harness — the same harness the new gate uses:

    click A       -> wire "invoice_adjusted"
    click B       -> wire "invoice_adjusted,invoice_adjusted,invoice_cancelled"
    click A again -> wire "invoice_adjusted,invoice_adjusted,invoice_cancelled,invoice_cancelled"

Consistent with the handler's `current` (`multiEnumControl.control.value.data`)
reading stale: `difference(next, current)` re-adds what is already selected and
`difference(current, next)` computes no removals. The array also violates the
module's own `uniqueItems: true` declaration on that leaf.

**What I could not isolate.** `mountFilters` captures `modelValue` ONCE at
setup (`filter.harness.ts:339-347`) and never re-feeds the form, whereas the
real `FilterBar.vue:42-46` passes a reactive computed. I wrote a probe mounting
`UpmForm` with a reactive re-fed model to separate harness artefact from
capability. **The shared serial test guard denied it on five consecutive
attempts** (verbatim: `DENIED: a run is already in progress (4 process(es))`),
so it never executed. A blocked run is not reported as green.

Either branch owes work:

- **If the defect is real** — half-landed: a filter that can be set once and
  never narrowed, widened or cleared is not "filterable" (AC-2), and the
  request carries duplicates.
- **If it is a harness artefact** — the project's own wire gate runs in a
  harness that cannot represent multi-click behaviour, so nothing gates the
  multi-ness of a multi-select, on the exact capability that has failed four
  times.

### The undescribed i18n finding, located and graded

Disclosed only in `4392ab636`'s commit body, nowhere in the SDD bundle.
`forced-surface.invoices.spec.ts` is committed RED (armed empty, armed
loading): the witness finds `['recurrent','invoice_paid',…(3)]` on screen from
the always-rendered filter-bar chrome.

The disclosure calls it a catalogue gap. My measurement says the composed key
is **malformed**:

    Not found 'invoices.filter_bar.status.invoices.filter_option.status.invoice_adjusted'

That is the element's `i18n` prefix concatenated with the option's `title`,
which is itself already a complete i18n key. No catalogue entry can resolve it.
So it is NOT covered by the standing "raw i18n keys render until the external
catalogue carries them" disposition — that covers MISSING keys, not
unresolvable ones. It is a key-composition defect in the label path, the same
family as the dotted-key join.

Not verdict-blocking alone (labels, not the filter value), but it is a code
defect mis-filed as a docs-stage gap, and it leaves a committed spec red.

### forced-surface-coverage — attribution confirmed

    these scenarios route a page whose forced states nothing arms: client-notes

`invoices` is gone. All three remaining module-project failures are
pre-existing / out of scope. Zero module-project failures are this story's.

### The re-homed mutant — verified blind, and precise

Beside the gate (`…/renderers/__tests__/`, with 8 pre-existing siblings).
Header now reads `PROVING ASSERTION EXISTS YET: YES` and names the permanent
test. Applied blind:

    x wires status.code|in and category.slug|in  -> expected '' to be 'invoice_unpaid'
    + FAIRNESS CONTROL — a non-dotted column reaches the wire the same way
    + renders 8 of 8 · 11 and 8 options · schema identity
    1 failed | 4 passed (5)     -> reverted: 5 passed

RED on exactly its target assertion, fairness control green. No runner walks
client-vue patches (only `design-system/packages/ui` has one) — a pre-existing
repo condition shared with its 8 siblings, not this story's defect.

## What's missing

1. **Settle the multi-click behaviour on the wire** — one test that clicks two
   options then de-selects one, asserting `filter[status.code|in]`. Owner:
   **prover** (the gate), and **developer** if it confirms the defect. This is
   the single check that closes the verdict.
2. **The malformed composed option key** — `<element.i18n>.<title>` where
   `title` is already a full key. Owner: **developer**.
3. **`forced-surface.invoices.spec.ts` is committed red.** Owner: operator
   disposition, or the item-2 fix.

## Evidence re-run at this SHA

| Check | Result |
| --- | --- |
| client-vue suite | 14 files / 136 passed (was 13/124) |
| headless | 234 files / 1825 passed / 3 todo (was 233/1820) |
| labs `--project module` | 3 failed / 157 passed — none of them ours |
| `invoices-filter-wire.test.ts` | 5 passed; mounts the live published schema |
| re-homed mutant, blind | RED on its own assertion only; reverted green |
| `LIVE_CAPABILITIES` | `new Set(keys(useInvoices().as("self").useActions()))` — derived |
| `filterby-paging.int.test.ts` | A7 both halves on `filterBy`; offset moves 0→2→0 |
| `Proven RED` placeholders | both filled, 2026-09-09 |
| my wire probe, 1 click | wire carries the driven values |
| my wire probe, 3 clicks | duplicates; nothing removed |
| reactive-re-feed probe | BLOCKED by the serial guard, 5 attempts — surfaced GAP |
| fixtures unchanged since `3a550b3e5` | yes — live re-capture carries forward |

### RESOLVED — the isolating probe ran, and the defect is REAL

The blocked probe executed on a later retry. Mounting `UpmForm` with a
**reactive** `modelValue` re-fed on every write — exactly what
`FilterBar.vue:42-46` passes — reproduces the corruption identically:

    tiles: 11
    click A       -> wire "invoice_adjusted"
    click B       -> wire "invoice_adjusted,invoice_adjusted,invoice_cancelled"
    click A again -> wire "invoice_adjusted,invoice_adjusted,invoice_cancelled,invoice_cancelled"
    AssertionError: de-select must leave ONE value: expected 4 to be 1

The shared harness's non-reactive `modelValue` was NOT the cause. The
duplication is present in the `next` model the renderer itself emits, before
any merge strategy is applied, so it is independent of how the consumer merges.

**The verdict is therefore ABSENT on a CONFIRMED defect, not on uncertainty.**
On the real page's own prop wiring, the two facets can be set once and then
never narrowed, widened or cleared; every further click appends a duplicate and
no de-selection ever removes. The array also violates the module's own
`uniqueItems: true` declaration on that leaf, so the page emits criteria the
module declares illegal.

`filter[status.code|in]` grows monotonically with every click. AC-2's
"filterable" is not delivered.

---

# Verify — /factory scenario lane, RE-GRADE 4, 2026-09-09

**verifiedSha:** `ccc735601ba9e1fd77c8adbbddc956f5b203931d` (local HEAD; branch unpushed)

## VERDICT: PRESENT

The core deliverable is realised. I drove the capability myself, end to end, at
the wire, on both facets, through the full change sequence.

### Stage 4 closed — my own sequence probe, both facets

    STATUS   click A -> "invoice_adjusted"
             click B -> "invoice_adjusted,invoice_cancelled"
         de-select A -> "invoice_cancelled"
         de-select B -> ""            | key present: true
    CATEGORY click A -> "new_contract"
             click B -> "new_contract,additional_service"
         de-select A -> "additional_service"
         de-select B -> ""            | key present: true
    independence -> number: "INV-77"  status: ""  category: "new_contract"
    Tests  3 passed (3)

No duplicates at any step; de-selection removes exactly the right value;
clearing yields an EMPTY VALUE with the key PRESENT — the ambiguity flagged in
RE-GRADE 2, resolved the right way; the facets are independent and the
non-dotted control is unaffected.

### The gate now catches 4 of 4 stages

| Stage | Failure | Caught? | Assertion |
| --- | --- | --- | --- |
| 1 | nothing rendered | YES | `:81` render count 8; `:89`/`:92` option counts 11/8 |
| 2 | rendered, write swallowed | YES | `:127`/`:128` post-`translateQuery` |
| 3 | write nested, wire empty | YES | same, post-`translateQuery` |
| 4 | duplicates / no removal | **YES** | `:223`/`:232`/`:238` `uniq(x)===x`; `:236`/`:239` de-select; `:243` clear; `:253` key present + `:254` value `""` |

Plus `:280-293` both leaves declare `uniqueItems: true`, and `:297-301` the
published-schema identity. The gate hole I named is closed.

### The label key resolves to something a catalogue can carry

    STATUS tile texts: ["invoices.filter_option.status.invoice_adjusted", …]
    DOUBLE-PREFIXED tiles: 0

The unresolvable `invoices.filter_bar.status.invoices.filter_option.status.*`
composition is gone. What remains is the standing raw-key-pre-catalogue
condition.

### The two harness fixes are GENUINE, not loosened

- `rows()`: `tbody tr` → `tbody tr[data-slot="table-row"]`. Both slot names
  are real (`TableRow.vue:3`, `TableEmpty.vue:2` `<tr data-slot="table-empty">`
  inside tbody). This makes the counter MORE discriminating: previously a table
  showing nothing reported 1 row, so "armed empty → fewer rows" was
  unsatisfiable by correct behaviour.
- `witness()`: prunes `[data-test-key="filters"]` from a CLONE before reading
  text. Records render in the table/list, never inside FilterBar's form, so the
  exclusion cannot hide a record.

**The anti-loosening proof is the siblings' POSITIVE baseline.** All seven
sibling specs pass (6+6+6+6+6+5+4 = 39 tests), and each asserts
`expect(live.rows).toBeGreaterThan(0)` — "draws no record on Live". A blinded
counter or witness would have failed those too. Loosening never reds; these
still detect records positively. The fixes turned a FALSE GREEN into an HONEST
RED.

### The remaining red is a playground-corpus matter, not the page

`forced-surface.invoices.spec.ts` fails on `Live draws this module's own
recorded records` → `live.rows === 0`, so `armed.rows() < live.rows` is
`0 < 0`, unsatisfiable.

I isolated it independently of the prover's account: **the same page runtime
and the same harness draw records for seven sibling modules; only invoices does
not.** This story touched neither `ListSurface.vue` nor the table. The module IS
wired into the replay seam (`invoices.feature` exists → `publishedFeatures`;
`recordedBodies` globs `modules/*/__tests__/fixtures/*.json`, so the eight
invoices fixtures are in the pool) and the recorded list HAS rows (my own live
re-capture logged `paidRow:true`). So the variable is corpus/replay ROUTING
(`runtime/force/handlers.ts`, `corpus.ts`) — shared playground infrastructure,
outside this story's write lane. It is named in no AC (AC-1–AC-16) and has no
parity row.

**Disposition: does not block this gate — surfaced, not waived.** It needs the
operator's hand: quarantine with a tracked issue, or route the corpus
re-recording to the developer. The prover's refusal to fabricate an issue id
was correct, and its dated disclosure block is exemplary.

## The one honest limit on this PRESENT

I have **not** observed the page render real invoice rows end-to-end in the labs
replay environment — that is precisely what `live.rows === 0` reports. My
confidence that the page draws rows rests on three indirect legs: the same
unmodified `ListSurface`/table runtime drawing rows for seven sibling scenarios
in the identical harness; the module returning mapped rows from recorded
fixtures across the headless integration suite; and the declaration's ten
columns asserted green. That is a sound isolation, not a direct observation, and
it is the reason the corpus question must be dispositioned rather than dropped.

## Evidence re-run at this SHA

| Check | Result |
| --- | --- |
| my sequence probe, both facets | 3 passed — full sequence correct at every step |
| my label probe | 0 double-prefixed tiles |
| client-vue suite | 139 passed (was 136) |
| headless | 234 files / 1825 passed / 3 todo |
| labs `--project module` | 3 failed / 157 passed — none ours |
| 7 sibling forced-surface specs | 39 passed — positive baselines intact |
| re-pointed mutant, blind | RED on exactly the two sequence tests; single-click, fairness, counts, uniqueItems, schema identity all green; reverted 8/8 |
| A7 | both halves on all reads incl. `filterBy`; paging offset 0→2→0 |
| fixtures unchanged since `3a550b3e5` | yes — live staging re-capture carries forward |
| parity `Dropped` rows | six, all operator-signed |

## What is owed (none of it blocking)

1. **Operator disposition on `forced-surface.invoices.spec.ts`** — quarantine
   with a tracked issue, or route the labs invoices corpus/routing to the
   developer.
2. i18n catalogue entries for `invoices.filter_option.*` /
   `invoices.filter_bar.*` — standing known-and-owned condition.
3. `pnpm build` and scoped `lint` not re-derived by this seat (outside the
   capability question) — surfaced, not waived.

### The honest limit, narrowed as far as it goes

The data half is directly proven, not inferred:
`invoices.collection.int.test.ts:75-76` —

    const rows = invoices.useContext().data.value;
    expect(rows).toHaveLength(fixture.data.length);

The module returns exactly as many mapped rows as the recorded fixture
carries, against the fixtures I re-captured live from staging myself (that
capture logged `paidRow:true`, so the recorded list has rows). Green inside
the 234-file headless run.

The render half is proven by seven sibling scenarios drawing records through
the same unmodified `ListSurface`/table in the identical harness.

So the composition is evidenced from both ends, and the `live.rows === 0`
failure is isolated to the labs replay corpus/routing between them — not to
the module, and not to the page.
