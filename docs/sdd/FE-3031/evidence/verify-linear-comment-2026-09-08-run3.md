> **Verifier seat — Linear mirror, ready to post verbatim.** The Linear MCP connector was NOT
> available to the verifier dispatch that produced this (no Linear tool in the seat's tool set, and
> no `linear` CLI in the repo). `docs/sdd/FE-3031/verify.md` IS filed; this is its issue-tracker
> mirror, owed and un-posted. Conductor: post the body below to FE-3031 as-is.

---

**Verify (factory) — verdict: PRESENT** · 3rd run · `verifiedSha` `bdfc02ef5b29803756a1072cd06f85639a51bb15`

Re-graded from scratch after Review's four blockers (B1–B4) and the planner's three (H1, H3, H4) landed. Full artefact: `docs/sdd/FE-3031/verify.md`.

**The seven findings — all CLOSED, all re-executed by this seat**

- **B1** `loadUnpaidExistence` now seeds `client_id` (`invoices.services.ts:394`), reproducing `oracle:561-563`. Wire-asserted, bearer-asserted.
- **B2** `loadList` seeds it at `:258`; the request and the row attribution are asserted **on the same call** (`invoices.scope-identity.int.test.ts:114-174`).
- **B3** `useInvoices.context.ts:92` and `useInvoices.meta.ts:63-66`/`:80-83` all read `pagination.value.total`. The non-zero total (1086) is asserted — the pinned-at-`0` detector.
- **B4** `invoices.mappers.ts:142` carries the oracle's ANY-parent gate; the third-party-parent row is proven at `invoices.attribution.int.test.ts:111`.
- **H1** `withDurableClientId` (`invoices.services.ts:195-215`, wired `:260`). Read-back → 5 passed / 1 file. Its mutant reddens exactly the two doors it removes.
- **H3** `invoices.feature` 27 scenarios, `@AC-1`…`@AC-16`; `requirements.md` now declares 16. Traceability gate green, **0 unproven**.
- **H4** Inventory taken (951 tests / 131 files), every live `-t` pattern matched, **7 executed verbatim**. All resolve to ≥1 test in exactly 1 file. **UNRESOLVABLE PATTERNS: 0.**

**Sub-gates**

- **Fixture provenance: PASS.** Live re-capture against `https://api.staging.upmind.io` (`pnpm fixtures:generate invoices`, exit 0). All **8** fixtures rewritten by the live run, compared structurally against a scratch backup: `FILES_COMPARED=8 STRUCTURAL_DIFFS=0` (up to 1824 key paths each). Recorded, not fabricated, not drifted. Shipped fixtures restored; the diff under verification was not mutated. Constructed rows labelled in **both** docblock and test title.
- **Identity retargeting (A7): PASS.** All three `client×client` reads assert the target's `filter[client_id|eq]` on the decoded outbound URL **and** the reading client's own bearer with `assertNoActingAsHeaders`. The list's retarget survives `filterCreditNotes()`, a bare `setCriteria({ filters })`, `sortBy()` and `filterConsolidatable()`; an explicit caller-declared `client_id` still wins. Payload is never the proof.
- **Count members: PASS.** `hasUnpaid` true on a positive total and **false on zero with the same non-empty row array**. `consolidatableCount` reads two distinct positive totals (7, 2) from two distinct responses.
- **Negative controls: 15/15 verified myself.** `git apply --check` clean ×15; each applied, RED on its own assertion, reverted, tree clean.

**Claims re-derived in the worktree (pwd-stamped, not accepted from a log)**

- integration `131 passed (131)` · `951 passed | 2 todo (953)` · `REAL_EXIT=0`
- unit `102 passed (102)` · `867 passed | 1 todo (868)` · `REAL_EXIT=0`
- build `REAL_EXIT=0`, 6 packages, 0 error lines
- `modules/query/**` — zero `.ts` change vs `develop` (one doc file, `query/docs/README.md`, +6/-5)
- `useValidation.ts` — exactly 2 lines + its `@decision` with the 2026-09-02 operator sign-off
- module source carries **no** test-mode branch at all — not even the sanctioned `useTestAttrs` carve-out
- parity: **0** unsigned drops, **0** undispositioned cells, **0** undispositioned rows; no `blocked_by:` standing

**Gaps surfaced, none verdict-blocking**

1. **Branch not pushed** — `git ls-remote` empty; the verdict binds to local `bdfc02ef5` with an empty-diff fingerprint. Push before the MR.
2. `ci/lint-plan-compliance.mjs` does not exist in this repo; `parity.yaml` says so and I hand-graded it.
3. No `labs-nuxt` invoices playground page / `invoices.steps.ts` — the e2e lane is broken on `develop` (`playwright.config.ts:6-7` imports a `tests/` dir that is neither present nor tracked; confirmed at source). No AC, parity row or JTBD noun requires it. The factory goal's "driveable page" half stays unevidenced → conductor's end-state grading.
4. **Stale docblock** `invoices.criteria-presets.int.test.ts:10-24` still says `filterCreditNotes()` issues no request and AC-7 is "unreachable". It passes. → prover.
5. **Stale docblock** `invoices.consolidatable-count.int.test.ts:23-36` still says `consolidatableCount` "stays 0 regardless of the response". It resolves 7 and 2. → prover.
6. `consolidatableCount` has no zero-direction assertion — a note, not a gap (two distinct positives are the stronger control).
7. `invoices.mappers.ts:70` still cites `oracle:172-179`; the real anchor is `:175-180`. Comment-only, disclosed in R06. → developer.
8. `R08`'s `tracker` is a placeholder, not a Linear id — owed by the operator.
9. `invoices.meta-throws-on-failed-load.must-fail.patch` carries no `# must-fail:` header; I derived and verified its pair. → developer.
10. Two of my runs were SIGKILLed (`REAL_EXIT=137`) under memory pressure and were re-run to completion. Nothing blocked is reported as green. The shared serial guard denied one command and I waited it out.

**My own prior artefact corrected:** `verify.md:88-93` said `loadList` does not auto-seed `client_id`. All three reads seed it now, and `loadList`'s column is durable. Refreshed in place.

**What's missing:** nothing load-bearing.

---

**Addendum — the dispatch was cut off by a network error and every sub-gate was re-executed a second time.**
Re-derived first-hand in the worktree, `pwd`-stamped: integration `131/131 files`, `951 passed | 2 todo`, exit 0 · unit `102/102 files`, `867 passed | 1 todo`, exit 0 · `pnpm build` exit 0 with six projects each ending `Done` · negative controls `git apply --check` **15/15** clean, all 15 applied → RED on their own assertion → reverted → tree clean · fixture re-capture repeated live against `https://api.staging.upmind.io` (7/7, `lint:fixtures` clean), all 8 fixtures rewritten then restored to an identical digest, fresh-vs-shipped `FILES_COMPARED=8 STRUCTURAL_DIFFS=0` · H4 re-listed (951 entries / 131 files) with **six** patterns re-run under real `-t` filtering, selecting 3/5/5/3/3/2 tests in exactly one file each, all passing.
One honest addition: `vite-plugin-dts` prints **35 non-fatal `error TS…` lines** during `packages/client-vue`'s declaration emit — all from the uninstalled `design-system` workspace plus a few `client-vue` `.vue` implicit-`any`s, **none** naming `headless` or `invoices`, and none from `vue-tsc --noEmit` itself. Pre-existing, disclosed rather than reported as clean.
