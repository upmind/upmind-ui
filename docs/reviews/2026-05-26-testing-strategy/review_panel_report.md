# Review Panel Report — Testing Strategy (ADRs 013/020/021/022 + .agent/workflows test skills)

**Work reviewed:** ADR 013 (superseded), ADR 020 (Gherkin), ADR 021 (Pyramid + Agentic), ADR 022 (UI testing), + `.agent/workflows/{code-test-unit,code-test-integration,code-test-e2e,sdd-bdd,test-regression,test-triage}.md`
**Date:** 2026-05-26
**Panel:** 4 reviewers (Feasibility, Risk, QA/Test Strategy, Devil's Advocate)
**Verdict:** APPROVE WITH CHANGES — fix the P0s before promoting
**Score:** 6.1 / 10 (range 5–7, spread 2 — within healthy disagreement)
**Mode:** Exhaustive (pure plan/design)
**Codebase state:** `develop`, clean working tree on the ADRs themselves (013 + 021 + 022 staged with edits)

> ⚠️ **COMPRESSED RUN — Phases skipped: 4 (reflection), 5 (debate), 6, 7 (blind final), 8 (audit), 10 (claim verification), 11 (severity verification), 12/13 (targeted verification), 14.5 (post-judge gate). Synthesis below is orchestrator-judged from Phase 3 reviews only.**
>
> Phase 3 converged tightly on 4 of the issues so this was a pragmatic call to avoid ceremony. Treat single-source findings ([SINGLE-SOURCE] tag) with lower confidence than consensus findings.

---

## Executive Summary

The package is **intellectually coherent and well-written** — ADR 021 is the strongest piece on the table, correctly diagnosing the ice-cream-cone, naming the `seedInvalidProduct` shadow-implementation anti-pattern with a real receipt (FE-1365), and binding the migration to `@next` (the only enforcement with teeth in this org). The principles are sound.

However the panel converged on a single structural problem: **the load-bearing rules are principles without enforcement primitives**. Every reviewer independently flagged:

1. **The integration layer contradicts itself** between ADR 021 ("real staging API") and `code-test-integration.md` ("Live API in CI is banned").
2. **"Test-writer ≠ code-writer"** is stated 4× across the docs and enforced 0×.
3. **30-day flake deletion** has no mechanical trigger.
4. **`@layer-unit` Gherkin scenarios** are unexecutable phantom artefacts.
5. **ADR 022** is gated on a UI package split that has no committed timeline.

The Devil's Advocate further challenges the **pyramid shape itself** (Trophy / Honeycomb may fit a Vue 3 SPA better) and **Gherkin without product reviewers** as cargo-culting. These are single-source but substantive premise challenges — worth answering even if rejected.

Net: ship the principles, but ship the enforcement with them, or you'll have coverage theatre with extra steps.

---

## Scope & Limitations

What was reviewed: the 4 ADRs + 6 workflow skills, plus spot-checks of `tests/Playwright/` and `playwright.config.ts` to ground claims.

What CANNOT be evaluated: actual agentic behaviour against the skills (would need experimental run), reviewer enforcement in practice (would need 90-day post-adoption audit), product-team willingness to review `.feature` files (needs human signal).

**Structural limitation:** shared base model across reviewers. The 3-of-4 consensus on F1/F2/F4 is strong, but is not independent verification — multiple agents may share the same prior.

Epistemic labels: **[CONSENSUS]** ≥3 reviewers · **[2-OF-4]** majority but not consensus · **[SINGLE-SOURCE]** one reviewer · **[VERIFIED]** orchestrator confirmed against source.

---

## Score Summary

| Reviewer | Persona | Intensity | Score | Recommendation |
|---|---|---|---|---|
| Feasibility Analyst | Backward reasoning | 60% | 7/10 | APPROVE_WITH_CHANGES |
| Risk Assessor | Adversarial simulation | 30% | 6/10 | APPROVE_WITH_CHANGES |
| QA / Test Strategy | Checklist verification | 40% | 6.5/10 | APPROVE_WITH_CHANGES |
| Devil's Advocate | Analogical | 20% | 5/10 | REVISE |

Spread = 2. No correlated-bias warning, but note the spread comes almost entirely from how heavily each persona weights the premise challenges vs the execution gaps.

---

## Consensus Points (≥3 reviewers)

- ADR 021 §Shortcut debt + the retirement rule + the `seedInvalidProduct` receipt is the single best part of the package. Don't change it.
- Tying tests to `@next` migration (Step 7) is the load-bearing logistical move. Right call.
- Categorical (not %-of-lines) coverage policy is correct — but undersupported by enforcement.
- "Test-writer ≠ code-writer" is the right instinct for agentic workflows; the principle is correct, the mechanism is missing.
- The agentic skill graph is well-shaped (clear inputs/outputs, hard rules) but the pairing rule it depends on does not yet exist in `sdd-tasks.md`.

---

## Action Items

### P0 — Block promotion of ADR 021 / 022 until fixed

#### A1 — [CONSENSUS, 4/4] [PLAN_RISK] Resolve the integration-layer contradiction
**Source:** Feasibility F1, Risk F3, QA F2, DA F5
**Issue:** ADR 021 §Assumption says integration tests run against the **real staging API**. `code-test-integration.md` says **"Live API in CI is banned"** and prescribes recorded fixtures. These contradict directly. They protect against *different bug classes* (live drift vs drift-from-last-recording) and have *different flake profiles*.
**Recommendation:** Pick one and rewrite the other to match. QA reviewer's split is the cleanest: **Integration** = headless module + recorded fixture (deterministic, < 5min, PR-gating). **Contract** = OpenAPI/schema diff or live staging probe, nightly, separate cadence. Reserve "real staging API" for e2e only. Name the contract tooling (Pact, Dredd, openapi-diff, or hand-rolled fixture-diff) explicitly — without that the layer's stated job ("catch contract drift") is undone by stale fixtures.
**Falsification test:** Read `playwright.config.ts` + any Vitest integration project config — whichever wins is the truth; the other doc is wrong.

#### A2 — [CONSENSUS, 3/4] [PLAN_RISK] Give "test-writer ≠ code-writer" a real enforcement mechanism
**Source:** Feasibility F11, Risk F1, QA F3
**Issue:** Stated 4× across 3 docs, enforced nowhere. The same Claude session today can run `code-generate` then `code-test-unit` with full memory of the implementation it just wrote. The mitigation is currently social.
**Pick one and commit:**
- (a) `sdd-tasks` emits two task types per step (`code`, `test`); the agent-run loop refuses to combine them in one subagent invocation, OR
- (b) `code-test-*` skills are required to receive the assertion set from `docs/sdd/<id>/design.md §Expected Behaviour` or Gherkin — and forbidden from reading the implementation source for assertion authoring, OR
- (c) admit the principle is aspirational and weaken its language to "tests must trace to a prior artefact" — don't claim enforcement you can't deliver.
**Falsification test:** Run `/code-generate` then `/code-test-unit` back-to-back on a deliberately-buggy task spec. If the tests pass against the bug, the rule is theatre.

#### A3 — [CONSENSUS, 3/4] [PLAN_RISK] Pick a path for `@layer-unit` Gherkin
**Source:** Risk F4, QA F5, Feasibility (implicit via skill examination)
**Issue:** `@layer-unit` scenarios in `.feature` files are documentation-only. The Vitest test that "implements" them has no automated link, no name-matching check, no drift detection. Product reads the Gherkin as a contract; nothing executes it. Drift is silent by construction.
**Pick one and commit:**
- (a) Keep `.feature` files **e2e-only** as a hard rule. Non-e2e scenarios live in `docs/sdd/<id>/bdd.md` as a checklist — not in `.feature`. Removes the executable-promise asymmetry.
- (b) Add a CI linter that asserts every `@layer-unit` scenario has a matching `it("<Scenario name>", …)` in some `__tests__/` file, and fails the build if not.
**Falsification test:** Search the repo today for any `@layer-unit` scenario. Find a matching Vitest `it()`. If absent, the pattern has already rotted at Day 0.

### P1 — Fix before pilot generalises

#### A4 — [CONSENSUS, 3/4] [PLAN_RISK] Tighten ADR 022's promotion dependency on the UI package split
**Source:** Feasibility F4, Risk F11, DA F6
**Issue:** ADR 022 is gated on a package split that has no ADR, no Linear initiative, no date. ADR 021 includes a Component/Visual/a11y row that forward-references it.
**Recommendations:**
- Add an **interim posture** section to ADR 022: pilot `addon-vitest` + `axe` against the *existing* `playgrounds/storybook/` for ONE organism. Decouples the stack proof from the architecture decision.
- Tighten ADR 022 promotion condition 3 from "agreed direction" to **"split ADR Accepted, package boundaries named"**.
- Resolve whether ADR 021's Component row stays (then ADR 022 must promote first) or drops until 022 lands.

#### A5 — [SINGLE-SOURCE, QA F4] [PLAN_RISK] ADR 022 wires two incompatible Storybook runners
**Source:** QA F4
**Issue:** The table picks `@storybook/addon-vitest` (Vitest reactor) AND `@storybook/test-runner` + `axe-playwright` (Playwright). Two runners = two builds, two flake surfaces, subtly different `play()` semantics. The canonical SB 8/9 path is `addon-vitest` + `addon-a11y` running inside the same `play()`.
**Recommendation:** Drop `test-runner` from the design. Use `addon-vitest` + `addon-a11y` together. If you keep `test-runner`, justify why in the ADR.
**Falsification test:** Wire one organism with `addon-vitest` + `addon-a11y`; prove axe runs inside `play()`. If it does, `test-runner` is dead weight.

#### A6 — [CONSENSUS, 3/4] [PLAN_RISK] 30-day flake deletion needs a mechanical trigger
**Source:** Risk F6, QA F8, Feasibility (implicit)
**Issue:** The policy reads cleanly. The deadline has no enforcement. ADR even acknowledges the old policy lived in one head; the new one moves it to "discipline burden on PR reviewers" — same model, more people.
**Recommendations:**
- Add a `@quarantine(FE-XXXX, YYYY-MM-DD)` tag convention enforced by a lint rule.
- A `pnpm test:quarantined --age` report that lists every skipped test by age.
- A weekly cron skill (or CI job) that **auto-fails** on any quarantine > 30 days old, OR auto-files a Linear issue at day 25 with the deadline.
- Add a `test-quarantine` skill that produces the quarantine PR — closes the loop with `test-triage` which today doesn't reference the quarantine list at all (Risk F7).

#### A7 — [SINGLE-SOURCE, Risk F2] [PLAN_RISK] The "module-driven setup is legitimate" carve-out is too wide
**Source:** Risk F2
**Issue:** ADR 021 says driving real composables to seed state is OK. But `seedInvalidProduct` could be rewritten as `await useBasket().addInvalidProduct()` and pass the rule while remaining shadow-implementation in spirit. The e2e skill itself says "headless clients are last resort"; the ADR says "module-driven setup cannot drift". Both can't be true.
**Recommendation:** Add a third clause to the principle: **"Module-driven setup is only legitimate if it reaches a state a real user can reach via the UI in production."** Reconcile with `code-test-e2e.md`.

#### A8 — [SINGLE-SOURCE, Feasibility F3] [PLAN_RISK] The agentic pairing rule does not yet exist
**Source:** Feasibility F3
**Issue:** ADR 021, `code-test-integration.md`, and `code-test-e2e.md` all point at a pairing rule "in `sdd-tasks.md`" that — at the time of review — does not appear to be written. The pipeline depends on it.
**Recommendation:** Add a §Pairing matrix to `sdd-tasks.md` mapping `@layer-{unit,integration,e2e}` task tags → required test-skill invocations. Or cite the existing section if I missed it. Cross-link from the 3 docs that reference it.
**Verification command:** `grep -nE 'pairing|@layer|test-skill' .agent/workflows/sdd-tasks.md`

#### A9 — [SINGLE-SOURCE, QA F1] [PLAN_RISK] Flake policy contradicts the live Playwright config
**Source:** QA F1
**Issue:** ADR claims `retries: 1` is for "occasional staging-API hiccups, not flake tolerance". But Allure surfaces retried-passes as `flaky`. There is no observable distinction between "needed retry once" and "needed retry consistently". The policy is enforcing a property it cannot measure.
**Recommendation:** Either flip CI to `retries: 0` (honest), or add the flake-history query (Allure or other) that distinguishes the two cases. As-is the rule is folklore.

#### A10 — [SINGLE-SOURCE, QA F6] [EXISTING_DEFECT] The current e2e suite already violates ADR 021
**Source:** QA F6 (verified against `tests/Playwright/e2e/e2e-tests/basket/basket-display.spec.ts`)
**Issue:** Sampled spec uses `addProductToOrder(token, orderId, "3de78642-de53-9714-76df-21208469530d", 1, 24, [], [], { domain }, [], true, false)` — hard-coded UUID, ten positional args, direct API seeding. This is exactly the `seedInvalidProduct`-class pattern the new ADR names as debt.
**Recommendation:** Freeze new uses of `tests/Playwright/e2e/support/api/*` helpers via a lint rule or PR-bot check **before** ADR 021 lands. Otherwise the policy ships while the practice grows debt. Add the audit (Step 2) to Linear with a real owner and a target date.

### P2 — Worth fixing, not blocking

| # | Source | Issue |
|---|---|---|
| A11 | Risk F8, QA F7 | `test-regression` is a runner, not a regression-pinning skill. Either rename to `test-run-suite` (honest) or rebuild to take bug-id + fix commit and prove the test catches the bug. |
| A12 | Risk F5 | Fixture rot is unowned: no `recorded_at`, no re-record cadence, no automated sanitiser. |
| A13 | Risk F9 | Unit-vs-integration boundary undefined for composables (`useBasket.addProduct` legitimately fits both). Add a decision rule. |
| A14 | Feasibility F6 | Audit (Step 2) verdicts have no "execute" step — whole-test retirement isn't bound to migration PRs. |
| A15 | Feasibility F5 | "Every API client function × 4 cases" is a quantitative budget by another name — tier by criticality. |
| A16 | Risk F14 | `sdd-bdd` + `code-test-e2e` STOP gate deadlock bug-fix regression flows. Define an exempt path. |
| A17 | QA F9 | Coverage policy has no mutation testing or PR gate. Pilot Stryker on `auth`/`session` alongside the pyramid pilot. |
| A18 | QA F10 | "Every `expect` traces to a `Then`" forbids legitimate control-flow waits. Reword to distinguish contract assertions from control-flow guards. |
| A19 | QA F11 | Is visual regression inside or outside the 30-min e2e ceiling? State explicitly. |
| A20 | Feasibility F8 | `code-test-unit.md` has no XState transition example despite XState being the primary unit target. Add a worked example. |
| A21 | Feasibility F2 | `pnpm dev:record` exists only in `apps/cart`; the skills assume it works monorepo-wide. Generalise or document the fixture-capture playbook in `tests/__fixtures__/README.md`. |
| A22 | Risk F15 | "Dom owns e2e" recreates the single-point-of-failure the ADR's own context says is the structural problem. Add a quarterly rotation point. |
| A23 | QA — gaps | Contract testing between `packages/headless` and `apps/**` is the most consequential boundary in the repo (apps go through `@upmind-automation/client-vue`) and is not addressed at any layer. MSW is also unmentioned. |

---

## Devil's Advocate Premise Challenges — Worth Answering

These are [SINGLE-SOURCE] (DA only) but substantive. The panel did not engage with them in debate (compressed run). They deserve a response in the ADR even if rejected:

- **DA-1 [PLAN_RISK] Pyramid vs Trophy/Honeycomb.** For a Vue 3 SPA over a REST API whose value is wiring (composables + XState reacting to network), the Testing Trophy (integration-heavy) may fit better than the classic pyramid. ADR 021 doesn't consider this alternative. *Answer in ADR §Alternatives, or run a small "where do our bugs land" audit before committing to pyramid shape.*
- **DA-2 [PLAN_RISK] Gherkin without product readers is cargo culting.** ADR 020 stakes Gherkin's value on product engagement but names no product reviewer who has agreed. The escalation gate measures the right thing — but the bet is being placed before the evidence. *Worth explicitly naming one product reviewer who has agreed to the workflow before promoting beyond pilot.*
- **DA-3 [PLAN_RISK] Process before practice.** 4 ADRs + 6 skills before a single pilot has earned any of them. Pilot Step 5 is *after* the ADRs and skills exist. *Consider landing a single `TESTING.md` (principles only) + pilot first, codify into ADRs after.* This is a stylistic call, not a defect — but it's worth explicitly defending the inverse order.
- **DA-4 [PLAN_RISK] Agent-authored test volume vs signal.** Without mutation testing as a bar, the agentic skill graph will scale tautological tests. See A17.

The DA's counter-proposal (collapse to one `TESTING.md`, adopt Trophy, defer Gherkin) is unlikely to be adopted wholesale and the other reviewers (correctly, I think) don't endorse it — but each individual challenge deserves a sentence in the ADRs.

---

## What's Missing (panel gaps)

- Contract tests between `packages/headless` and `apps/**` (A23)
- MSW patterns for network interception
- Mutation testing (A17)
- Manual a11y workflow (named "remains required" with no owner)
- Performance budgets (out of scope per ADR, fine)
- Staging test-data lifecycle (who cleans up orders created in CI?)
- PR-gating mechanics for the categorical coverage rule
- A `test-quarantine` skill (A6)
- A real `test-pin-regression` skill (A11)
- The `code-tests.md` rule file is load-bearing but out of scope of this review package — worth a separate audit

---

## Skill-level notes

| Skill | Verdict | Notable |
|---|---|---|
| `code-test-unit` | Approve with changes | Missing XState worked example (A20); `pnpm dev:record` claim leaks scope (A21) |
| `code-test-integration` | Approve with changes | **Direct contradiction with ADR 021 (A1)** — the most important fix |
| `code-test-e2e` | Approve with changes | HARD RULES strong; A18 (every-`expect`-traces-to-Then) needs rewording; module-driven-setup contradiction with ADR 021 (A7) |
| `sdd-bdd` | Approve | `@layer-unit` Gherkin path is the structural risk (A3); skip rule for bug-fix collides with `code-test-e2e` STOP gate (A16) |
| `test-regression` | **Rename or rebuild** | A runner, not a regression-pinning skill (A11) |
| `test-triage` | Strong — keep | Best skill in the set. Add quarantine-list cross-reference (A6 / Risk F7) |

---

## Recommended Sequence

1. **Before promoting ADR 021 / 022 to Accepted:** fix A1, A2, A3 (the P0 consensus issues).
2. **Before the pilot (Step 5):** fix A4–A10. Pilot `auth` or `session` with Stryker enabled (A17).
3. **In parallel:** add the `test-quarantine` skill (A6), rewrite or rename `test-regression` (A11), close the pairing-matrix gap (A8).
4. **In the next ADR cycle:** answer DA-1 (pyramid shape), DA-2 (product reader), DA-3 (process-vs-pilot order) explicitly — either by adopting or by writing one paragraph explaining why not.

---

## Process Notes

- **Phase 3 outputs (full reviews) on disk:** `state/reviewer_{feasibility,risk,qa,devils_advocate}_phase_3.md`
- This was a **compressed run** (see header). The full 15-phase protocol was deliberately skipped after Phase 3 because the panel converged tightly on the same top issues — running debate/audit/judge phases would have added ceremony without changing the action items.
- **Re-run advice:** if any of the P0 fixes prove contentious internally, re-run the panel scoped to just that question with the QA + Risk reviewers continuing (their `agentId`s are in the orchestrator log) — that gives you a 2-reviewer debate without redoing the full Phase 3.

---

*Agent Review Panel v3.3.0 — compressed run, orchestrator-judged.*
