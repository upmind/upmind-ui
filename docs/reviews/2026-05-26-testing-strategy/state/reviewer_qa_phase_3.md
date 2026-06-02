# Phase 3 Review — QA/Test Strategy Specialist
**Score:** 6.5/10
**Mode:** Exhaustive
**Recommendation:** APPROVE_WITH_CHANGES

## Summary

ADR 021 is the strongest piece on the table: it correctly names the ice-cream-cone, kills `seedInvalidProduct`-style shadow implementations, refuses line-coverage theatre, and binds test work to the `@next` migration (the only enforcement mechanism with real teeth in this org). The principles are sound and the writing is unusually disciplined. However the package has material gaps: contract testing is conflated with "integration", the agentic anti-tautology rule is asserted but unenforceable as written, the flake policy contradicts the live `playwright.config.ts`, ADR 022 mixes two incompatible Storybook runners, and Gherkin `@layer-unit` introduces a routing hazard that will produce orphaned scenarios. The skills are well-shaped but `test-triage` is the only one that meaningfully roots in code; `test-regression` is a runner, not a strategy, and there is no `test-quarantine` skill despite a quarantine policy. Approve with the P0/P1 changes below before promoting ADR 022.

## Strengths

- **Named anti-pattern + retirement rule** ("shortcut debt", ADR 021 §Shortcut debt) is the best thing in this package — most testing ADRs name patterns but never delete them. Coupling retirement to lower-layer coverage is correct.
- **Categorical coverage policy** rejects percentage theatre — Goodhart-aware. Concrete required-coverage rows (every machine, every API client function happy + 4xx + 5xx + **401**) are auditable.
- **Tying coverage to `@next` migration** (Step 7) is the load-bearing logistical choice and the only enforcement that survives contact with reality. Calling that out explicitly is mature.
- **"Test-writer ≠ code-writer"** correctly identifies self-validation as the dominant agentic failure mode.
- **Gherkin-first + declarative-only** (ADR 020) is the right call, and rejecting `@cucumber/cucumber` for `playwright-bdd` preserves Playwright's runner. The escalation gate is properly defined.
- **`code-test-e2e` HARD RULES** including "every `expect` traces to a `Then`" and "one Scenario → one test" are crisp and enforceable.
- **`test-triage`** correctly distinguishes "runs tests" from "analyses tests", forces behavioural clustering, demands file:line evidence, mandates confidence ratings. This is the strongest skill in the set.

## Findings

### F1 — P0 PLAN_RISK — Flake policy contradicts live Playwright config
**Where:** `docs/adr/021-testing-pyramid-and-agentic-workflow.md` §Flakiness policy vs `playwright.config.ts:52`
**Issue:** ADR claims `retries: 1` is for "occasional staging-API hiccups… not a flake-tolerance mechanism" and that any test needing the retry to pass consistently is flaky by definition. But Playwright surfaces flakiness as "passed on retry" — and `allure-playwright` reports those as `flaky`, not failures. The ADR's definition would mark ~every staging-API-touching test as flaky on a bad-network day. There is no detection mechanism that distinguishes "needed retry consistently" from "needed retry once". The ADR is enforcing a property it cannot observe.
**Why it matters:** A policy you cannot measure cannot be enforced; it becomes folklore. The 30-day quarantine timer also has no trigger — who watches a test for "flake twice"? No skill, no automation, no human owner is named.
**Recommendation:** Either (a) flip to `retries: 0` in CI to make the policy honest (tests must pass first time or fail), with a separate "rerun on staging-API 503" hook outside the retry mechanism; or (b) add a `test-flake-watch` skill that parses Allure history, tags tests that report `flaky` in N of last M runs, and opens the Linear quarantine ticket automatically. As-is, this is aspiration, not policy.
**Confidence:** High
**Falsification test:** Show me the dashboard query that distinguishes "needed retry once" from "needed retry consistently across the last 10 runs". If it doesn't exist, the policy isn't real.

### F2 — P0 PLAN_RISK — "Integration" layer conflates two distinct concerns
**Where:** ADR 021 §Layers, `code-test-integration.md`
**Issue:** ADR 021 says integration tests run "against the real staging API". `code-test-integration.md` says integration tests run "against recorded fixtures of real API responses" with "Live API in CI is banned." These are contradictory. The first is **contract testing against a live dependency**; the second is **module-level integration with fixture replay**. They catch different bug classes and have different flake profiles. Folding them together hides the strategic question: do you want consumer-driven contract tests (Pact / Postman / OpenAPI diff) running against staging on a separate cadence, or do you want fast module-level integration only?
**Why it matters:** The whole point of integration (per the skill) is "catch contract drift". Fixture replay cannot catch contract drift — the fixture is stale by definition. Real contract drift detection requires either (a) the live API in CI (which the skill bans) or (b) explicit schema/OpenAPI-diff tooling (which is not mentioned anywhere). Without one of those, the layer's stated job is undone.
**Recommendation:** Split into two layers explicitly. **Integration** = headless module + fixture (deterministic, fast, PR-blocking). **Contract** = OpenAPI/schema diff or live staging probe, runs nightly on a separate cadence, not on PR push. Name the tool (Pact, Dredd, openapi-diff, or hand-rolled "record fixture diff = contract diff" with explicit policy on whose responsibility it is to re-record).
**Confidence:** High
**Falsification test:** Name one bug from FE-1365 where a fixture-replay test would have caught a staging API shape change. If the fixture was recorded *before* the change, it cannot.

### F3 — P1 PLAN_RISK — Agentic "test-writer ≠ code-writer" rule is unenforceable as stated
**Where:** ADR 021 §Core principles #4, `code-test-integration.md` §The Agentic Rule
**Issue:** The rule says "a different agent run authors the `expect(...)` lines, given the fixture and the JTBD". In practice both the code agent and the test agent run in the same conversation, share the same context window, and the test agent reads the implementation file before writing assertions. The separation is theatre unless the test agent is denied access to the implementation source. Nothing in the skill graph enforces this — `code-test-unit.md` doesn't say "do not read the file under test".
**Why it matters:** Self-validation is the named risk and the package nominally addresses it, but the mitigation doesn't work. The agent writing tests against code it can read will reproduce the code's assumptions, not the spec's. This is the "green therefore correct" trap that the ADR claims to avoid.
**Recommendation:** Make the assertion source structurally explicit. For unit/integration tests where Gherkin doesn't exist, require the test skill to take its assertion set from `docs/sdd/<story-id>/design.md` §Expected Behaviour or a checklist authored before code. The agent reads the spec, never the implementation, for assertion authoring. Then add a `code-test-review` skill whose job is to flag tests whose assertions describe what the code does rather than what it should do (e.g. "asserts return shape that matches current impl exactly, no boundary cases").
**Confidence:** High
**Falsification test:** Run `code-generate` and `code-test-unit` back-to-back on a deliberately-buggy task spec. If `code-test-unit` produces tests that pass against the buggy implementation, the rule is theatre.

### F4 — P1 PLAN_RISK — ADR 022 wires two incompatible Storybook runners
**Where:** `docs/adr/022-ui-testing-strategy.md` §Proposed decision
**Issue:** The table picks `@storybook/addon-vitest` for component testing AND `@storybook/test-runner` + `axe-playwright` for a11y. These are different runners with different Storybook backends — addon-vitest uses the Vitest reactor, test-runner is a Playwright-based runner. Running both means two Storybook builds, two CI jobs, two flake surfaces, and two sets of `play()` semantics (subtly different on hover/wait/timing). The "tooling sprawl" Consequence acknowledges this in one line, but the architectural impact is not addressed.
**Why it matters:** Per-story `play()` written for one runner will not necessarily behave identically in the other. You will either be re-implementing a11y in addon-vitest (which `@storybook/addon-a11y` does — and is the obvious pick) or running every story twice, doubling the < 5 min CI budget you've set.
**Recommendation:** Use `@storybook/addon-vitest` + `@storybook/addon-a11y` together. The a11y addon runs axe inside the same `play()` execution. Drop `test-runner` from the design until you have a reason it cannot solve. If you keep `test-runner`, justify why.
**Confidence:** High (a11y-addon is the documented Storybook 8/9 path)
**Falsification test:** Wire one organism in the pilot (Step 4) with addon-vitest + addon-a11y and prove axe runs as part of the same `play()`. If it does, `test-runner` is dead weight.

### F5 — P1 PLAN_RISK — `@layer-unit` Gherkin scenarios are a routing hazard
**Where:** `sdd-bdd.md` §Step 6, ADR 020
**Issue:** Putting `@layer-unit` scenarios in `tests/Playwright/features/<flow>/*.feature` creates a class of Gherkin scenarios that the e2e suite never executes and that have no automated link to the Vitest file that should implement them. The skill says "the actual executable test lives in the headless module's `__tests__/` directory" but nothing checks the Vitest test exists, or that its `describe`/`it` strings match the Gherkin Scenario name, or that the Gherkin scenario is still current.
**Why it matters:** This is the classic "orphan spec" pattern. Product reviews the Gherkin, devs forget the Vitest, the Gherkin rots, and worse — the Gherkin promises behaviour that the unit test never exercises, while the only people who would notice (product/PM) cannot read Vitest output. The promise asymmetry is a credibility trap.
**Recommendation:** Either (a) keep Gherkin **e2e-only** as a hard rule — non-e2e scenarios live in `docs/sdd/<id>/bdd.md` as a checklist, not in `.feature` files — or (b) add a CI check that asserts every `@layer-unit` scenario has a matching `it("<Scenario name>", …)` in some `__tests__/` file, and fail the build if not. As-is, `@layer-unit` Gherkin is a documentation IOU.
**Confidence:** High
**Falsification test:** Search the codebase right now for any `@layer-unit` scenario. Does a matching Vitest `it()` block exist with the same name? If not, the pattern has already rotted at Day 0.

### F6 — P1 EXISTING_DEFECT — Current e2e suite already violates ADR 021's hard rules
**Where:** `tests/Playwright/e2e/e2e-tests/basket/basket-display.spec.ts`, `tests/Playwright/e2e/support/api/basket.ts`
**Issue:** Sampled spec uses `createOrder(token)` and `addProductToOrder(token, orderId, "3de78642-de53-9714-76df-21208469530d", 1, 24, [], [], { domain }, [], true, false)` — direct API seeding with a hard-coded `product_id` UUID, magic numbers (`24`, `1`), and ten positional args. This is exactly the `seedInvalidProduct` shadow-implementation pattern ADR 021 §Shortcut debt names as debt. It is also currently the *only* sampled way the test reaches state — there is no UI seeding path. The "drive the real client" recommendation has no concrete migration story for this specific helper.
**Why it matters:** ADR 021 declares the helper retirement rule but the audit (Step 2) is unscheduled and the @next migration (Step 7) is not the same surface as the e2e test harness. The two programmes can drift. Meanwhile every new e2e test will reach for `addProductToOrder` because it's what's there.
**Recommendation:** Before promoting ADR 021's coverage rules, freeze new uses of `tests/Playwright/e2e/support/api/*` helpers via a lint rule or PR-bot check, and add the audit (Step 2) to the Linear initiative with a real owner and a target date. Otherwise the policy ships and the practice doesn't move.
**Confidence:** High (direct file read)
**Falsification test:** Grep `tests/Playwright/e2e/e2e-tests/` for imports from `support/api/`. Today's count is the baseline. If the count doesn't shrink in 90 days, the policy isn't binding.

### F7 — P1 PLAN_RISK — `test-regression` is a runner, not a strategy
**Where:** `.agent/workflows/test-regression.md`
**Issue:** This skill runs `pnpm test:chrome`, generates Allure, opens dashboard. It is a wrapper. It is not regression *strategy* — it does not pin any specific behaviour, does not maintain a regression set distinct from the full suite, does not assert any test is "the test for FE-1365". Compare to ADR 021's "every bug fix → a regression test at the lowest layer that would have caught it" — there is no skill that creates that test or proves it would have caught the bug.
**Why it matters:** The name implies more than the skill delivers. A real regression skill takes a specific bug, identifies the lowest layer it could be caught at, and produces a failing test against the pre-fix code (or, post-fix, a test that fails when the fix is reverted via `git stash`).
**Recommendation:** Either rename to `test-run-suite` (honest) or rebuild as a real regression skill that takes a bug-id + a fix commit, reverts the fix in a worktree, runs the proposed test, asserts it fails, restores the fix, asserts it passes. That's a regression pin.
**Confidence:** High
**Falsification test:** Find one PR in the last 90 days where `test-regression` produced a new test that pins a specific historical bug. The current skill cannot do that.

### F8 — P2 PLAN_RISK — No quarantine mechanism despite quarantine policy
**Where:** ADR 021 §Flakiness policy
**Issue:** Policy says "Quarantined > 30 days → Deleted". No mechanism: no `@quarantine` tag convention, no `test.skip` macro with a Linear-link requirement, no CI job that lists quarantined tests with quarantine age, no skill that processes them. The 30-day forcing function has no trigger.
**Why it matters:** The most important rule (the deletion deadline) is the one with zero implementation.
**Recommendation:** Add a `@quarantine(FE-XXXX, YYYY-MM-DD)` tag convention enforced by a lint rule, a `pnpm test:quarantined --age` report, and a weekly cron skill that fails on quarantines > 30 days.
**Confidence:** High
**Falsification test:** How does a developer quarantine a test today? Walk me through it. If the answer is "I don't know", the policy is paper.

### F9 — P2 PLAN_RISK — Coverage policy has no mutation testing or PR gate
**Where:** ADR 021 §Coverage policy
**Issue:** Categorical coverage is good as far as it goes — but "unit test for every transition/guard" can be vacuous (a test that calls every transition with `expect(state.matches('next')).toBe(true)` is checkbox-grade). Mutation testing (Stryker) is the standard signal for "do the assertions actually distinguish a buggy mutation from the real impl". The ADR doesn't mention it. PR gating is also implicit — what fails the PR if the categorical coverage rule isn't met? Code review alone, with no automation.
**Why it matters:** The categorical rule is enforced by human review of the diff, against a per-module checklist that doesn't exist yet. Slippage is guaranteed.
**Recommendation:** (a) Pilot Stryker on one headless module (`auth` or `session`) — calibrate the pyramid pilot (Step 5) to also produce a mutation score. (b) Add a `coverage-check` lint that asserts every machine has a `__tests__/<machine>.test.ts` and every composable has one. Mechanical, not judgemental.
**Confidence:** Medium (mutation testing has cost; not asserting it should be default — just that the ADR should *consider* it)
**Falsification test:** Pick the highest-rated module's unit suite, mutate one guard to always return `true`. If no test fails, the coverage is theatre.

### F10 — P2 PLAN_RISK — `code-test-e2e` HARD RULE "every `expect` traces to a `Then`" is too strict in practice
**Where:** `code-test-e2e.md` §HARD RULES
**Issue:** Real Playwright tests need defensive waits (`await page.waitForLoadState('networkidle')`, `await expect(page).toHaveURL(...)` to confirm navigation completed before the next step). These are not assertions of the Gherkin contract; they are control-flow guards. The rule as written forbids them. Either the rule is wrong, or every spec must paper over reality with comments.
**Why it matters:** Rules that are routinely violated train reviewers to ignore the rule. A more honest formulation distinguishes **contract assertions** (must trace to Gherkin) from **control-flow guards** (allowed, not assertions).
**Recommendation:** Reword: "Every `Then` in the Gherkin has a matching contract assertion in the spec. Control-flow waits (`waitForLoadState`, navigation confirmation) are allowed but must not double as contract assertions."
**Confidence:** High
**Falsification test:** Open any existing spec passing Phase B. Count its `expect` calls. Compare to the matching feature's `Then` count. If spec count > Then count by 2x+, the rule is already not held.

### F11 — P2 PLAN_RISK — Visual regression budget is conflated with e2e budget
**Where:** ADR 021 §CI strategy, ADR 022 §Visual regression
**Issue:** ADR 021's "full e2e < 30 min" ceiling includes or excludes visual regression? Today `pnpm visreg:chrome` runs as a separate script and `playwright.config.ts` snapshots are under `tests/Playwright/e2e/snapshots/`. ADR 022 defers the visual tool decision but ADR 021's budget is set before that decision. Visual regression flake (font rendering, anti-alias, animation timing) is structurally different from logic flake — `toHaveScreenshot: { maxDiffPixels: 2000 }` is a chosen tolerance, not policy.
**Why it matters:** Visual diffs are the largest source of "false positive" flake in Playwright suites. Without a separate budget and a separate retry policy, they will eat into the 30-min ceiling and force tests to be deleted to make room.
**Recommendation:** Carve visual regression out of the e2e ceiling. State the tolerance policy (`maxDiffPixels`, masked regions) explicitly. Defer to ADR 022's separate decision but in the meantime tag visual specs `@visual` and exclude them from the critical-journey gate.
**Confidence:** Medium
**Falsification test:** What runs in `pnpm test:chrome` today — does it include snapshots? If yes, the 30-min ceiling already includes them. If no, the cadence is split and the ADR doesn't say so.

### F12 — P3 PLAN_RISK — Per-package Storybook orchestration underspecified
**Where:** ADR 022 §Per-package Storybook architecture
**Issue:** "Meta-Storybook glob-imports stories from every UI package" — there is no concrete mechanism named (composition? refs? a vite plugin that walks packages?). Story IDs must be unique across packages but the ID scheme is not stated. Theming under multi-theme architecture (ADR 012) must resolve per-story but how is not stated.
**Why it matters:** The proposal is Proposed not Accepted, which is right — but the open questions in §Open Questions don't cover any of this. The promotion criteria don't require any of it. It's possible to promote without ever proving the orchestration works.
**Recommendation:** Add to §Open Questions: "Glob mechanism (composition vs custom Vite plugin)"; "Story-ID uniqueness scheme (e.g. package-prefixed titles)". Make at least one of these a promotion criterion.
**Confidence:** Medium

## Pyramid Coherence Check

| Layer | ADR 021 defines as | Skill produces | Aligned? |
|---|---|---|---|
| Unit | "Business logic, XState transitions/guards/context, composables, utilities" | `code-test-unit` Vitest tests with JSDoc header, fixture-driven | Yes |
| Integration | "API clients, contract drift, auth flows, response shapes" — against real staging API (ADR), against recorded fixtures (skill) | `code-test-integration` Vitest + fixtures, real `useBasket` etc. | **No — internal contradiction (F2)** |
| E2E | "Real user journeys through the browser", Gherkin-anchored, page-object mandatory | `code-test-e2e` Playwright spec, one Scenario → one test | Yes structurally; current suite violates (F6) |
| Component / Visual / a11y | ADR 022 proposes Storybook + addon-vitest + test-runner + axe | No skill yet (`code-test-component` named as future) | **N/A — Proposed**; F4 conflates runners |
| Contract (between headless and apps) | Not defined | Not produced | **Missing entirely** |
| Performance | Not defined | Not produced | **Missing entirely** |

The pyramid as defined is sound for layers it covers. The "Integration" row is internally contradictory and the contract-between-headless-and-apps layer is unaddressed (this is the boundary `apps/**` go through `@upmind-automation/client-vue` — a critical contract surface for the monorepo).

## Gaps (things missing entirely)

- **Contract testing between `packages/headless` and `apps/**`.** This is the most consequential consumer-producer boundary in the repo (per workspace rule "apps never import headless directly"). No tests pin that contract.
- **MSW (Mock Service Worker) is not mentioned** despite being the canonical Vue/Vite approach for unit/integration tests that need request interception. The fixture pattern is described abstractly with `getFixtureBody` but the interception layer is silent.
- **Mutation testing.** No mention. Without it, "categorical coverage" risks reducing to "a test exists" rather than "a test discriminates".
- **Accessibility beyond axe.** Manual a11y is mentioned as "remains required" but is not in any skill or workflow. Who runs it, when, against what checklist?
- **Performance budgets.** Not in scope per the ADR, fine — but should be acknowledged. Vite bundle size, render perf, INP.
- **Test data lifecycle on staging.** Tests create orders on the real staging API (per `basket-display.spec.ts`). Who cleans them up? `globalTeardown` exists in config but its responsibility is not described.
- **PR-gating mechanics.** The categorical coverage rule needs to fail a PR mechanically. No CI rule is named.
- **A `test-quarantine` skill** (see F8).
- **A `test-pin-regression` skill** that actually pins a historical bug (see F7).
- **The `code-tests.md` rule file** referenced by ADR 021 is the load-bearing detail but is not in scope of this review package (it's referenced but its quality is assumed). Worth a separate audit.
- **Vue component test layer** (Vitest + `@vue/test-utils`) — explicitly out per ADR 022 routing to Storybook, but until Storybook is in place there is a gap for component-level testing of apps' Vue components.

## Open Questions

1. **F1**: Is the retry policy real or aspirational? If real, what query proves a test "needs retry consistently"?
2. **F2**: Is "integration" fixture-replay or live-staging? Pick one and split the other.
3. **F3**: Does the test-writer agent get to read the implementation file? If yes, the separation is theatre.
4. **F4**: Storybook addon-vitest + test-runner — why both?
5. **F5**: How are `@layer-unit` Gherkin scenarios kept in sync with their Vitest implementations?
6. **F6**: When does the e2e audit (Step 2) start and who owns it?
7. **F11**: Is visual regression inside or outside the 30-min e2e ceiling?
8. **Headless ↔ app contract**: where does that get pinned? (gap)
9. **Staging test-data cleanup**: who owns it? (gap)

## Verdict

Approve with changes — strong direction, but ship the policy with the enforcement primitives it implies, not just the principles.
