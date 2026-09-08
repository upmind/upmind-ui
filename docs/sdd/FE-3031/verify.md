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
