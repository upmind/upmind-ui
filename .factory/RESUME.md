# FE-3031 — /factory run checkpoint

Halted 2026-09-08 on the account session rate limit (resets 12:40 Europe/London),
mid-repair of the Review stage's 4 blockers. No partial writes: HEAD is dff68438d
and the tree is clean apart from submodule gitlinks and this directory.

## Where the run stands

| Stage | Result |
| --- | --- |
| Stage-0 audit | M1 unscoped / P0 absent — route: composable lane (conversion) then scenario lane (authors) |
| Research | PASS — 8 generic + 43 oracle citations |
| Plan | PASS — 13 ACs, 0 undispositioned cells, arms all five layers `none` |
| BDD | 27 scenarios, @AC-1..@AC-16, traceability green |
| Code | 15 module files + 2 signed-off core lines |
| Tests | unit 867/0 exit 0 · integration 131 files / 941 passed / 2 todo exit 0 · 11/11 mutants |
| Verify | **PRESENT** (2nd pass; 1st was ABSENT on 2 findings, both closed) |
| Review | **4 BLOCKERS — HALT.** This is what was being repaired. |
| Docs | not started |
| Scenario lane | not started — no `playgrounds/labs-nuxt/modules/scenarios/useInvoices/` yet |

Commits: 785113dbf (conversion) · f15995e7e (develop merge) · dff68438d (ABSENT repair).

## Operator rulings binding this run

- 2026-09-01: staff actor **deprecated** — a deprecation, not a tracked drop; no issue owed.
- 2026-09-01: `client×client` **in scope** ("In — run both client cells").
- 2026-09-02: **core fix authorised** for `packages/headless/src/utils/useValidation.ts` only (the two `set(result, [key], …)` lines).
- 2026-09-08: **"do not chnage any query stuff"** — `packages/headless/src/modules/query/**` is out of bounds and is byte-identical to develop.

## To resume: re-dispatch the two killed seats

**developer** — Review's 4 blockers, all evidenced:
- B1 `loadUnpaidExistence` (invoices.services.ts:259-283) never applies `client_id`; `.for('client',X).useMeta().hasUnpaid` answers for the reader, no caller remedy. Oracle takes the target at oracle:561-563.
- B2 `loadList` (:137-157) applies no `client_id` filter but passes the retargeted id to `mapInvoices` (:154) — reader's rows attributed against X, corrupting `isSettleable`. A wrong answer, not a gap.
- B3 `useInvoices.context.ts:74` publishes `total: query.total`, the read its own @decision documents as permanently 0. Use `.pagination.value.total`.
- B4 `isDelegated` (invoices.mappers.ts:130-141) diverges from oracle `belongsToDelegate` (oracle:143-146) — oracle gates on ANY parent, module requires parent === reader.
Plus warnings W1 (hasError ignores the auxiliary queries' errors), W2 (mint-time criteria snapshot), W3 docblock, W4, W5 (restore `@internal` at mappers.ts:1), W6, W9, S1. Two new controls owed:
`invoices.unpaid-existence-retarget-drop` and `invoices.list-retarget-drop`.

**planner** — parity/SDD corrections: R02 citations (oracle:137-142 / :143-146, not :126-137) and its Direct honesty after B4 lands; R01 + the client×client cell note, which must be true of all THREE reads or say which it is not; R04's mechanism (`.pagination.value.total`, ref :71-74); R05's relation count (16 not 17), the omitted `payments.payment_details`, and four unrequested relations listed as Direct; the label-precedence anchor (oracle:175-180) and the staff admin range (oracle:277-540).

**prover** (after the developer lands) — a `.for('client', X)` wire read-back per read in the shape invoices.scope-identity.int.test.ts:44-65 already models; move and verify the two new mutants blind; fix the 12 auto-fixable lint findings in its own test files (`lint:fix`); correct the stale docblock at invoices.criteria-presets.int.test.ts:10-48 that claims its tests are EXPECTED to fail (they pass); re-anchor invoices.attribution.int.test.ts's oracle:135 citation.

Then: re-Review (blocker count 0), Docs, the ordering gate (Docs green + conformance drift 0), then the scenario lane.

## Standing hazards

- **Always `cd` to the absolute worktree path in every command and stamp `pwd`.** A run measured in the primary checkout returned a green integration suite having executed none of this story's specs.
- A shared **vitest serial guard** is active; other sessions run suites on this machine. Wait and retry; never work around it.
- `ci/lint-plan-compliance.mjs` does not exist in this repo — only in the plugin cache. Grade parity by hand as well.
- Open items owned elsewhere: parity R08's `tracker:` is a placeholder, not a Linear id (operator); `docs/sdd/FE-3031/evidence/` holds no test logs; the branch is unpushed.
