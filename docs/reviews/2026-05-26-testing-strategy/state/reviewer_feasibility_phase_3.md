# Phase 3 Review — Feasibility Analyst
**Score:** 7/10
**Mode:** Exhaustive
**Recommendation:** APPROVE_WITH_CHANGES

## Summary
Working backward from the desired outcome — "a PR ships with confidence in <10 min CI, authored by a dev plus an agent, with no single-tester bottleneck" — ADR 021 and its skill graph mostly hang together. The pyramid is right, the agentic split (code-writer ≠ assertion-writer) is sound, and bundling the migration into the `@next` cadence is the only realistic way this lands without a parallel programme. However, several feasibility gaps will bite if not tightened: the integration layer's "real staging API + recorded fixtures + <5min on every PR push" target is internally tense; ADR 022 depends on an unscheduled UI-package split; the agent-driven test pairing rule is declared but not yet present in `sdd-tasks.md`; and current state (8 unit-test files across 26 headless modules, no Storybook beyond a playground, `dev:record` only wired in `apps/cart`) is further from the target than the ADRs imply.

## Strengths
- The pyramid layer table (ADR 021) names tools, speed targets, and scope per layer — concrete enough to act on.
- The shadow-implementation anti-pattern is named, with the `seedInvalidProduct` cautionary tale embedded in `code-test-integration.md` and `code-test-e2e.md`. The principle is enforceable in review because the canonical bad example is referenced.
- "Tests as exit criterion, coupled to `@next` migration" (Step 7) is the right logistical choice — it avoids a parallel testing programme starving for attention.
- Granular skills over umbrella `/test` — matches the ADR 020 reasoning for rejecting `@cucumber/cucumber`. Consistent posture.
- The agentic constraint (code-writer ≠ assertion-writer) is repeated across `code-test-unit`, `code-test-integration`, `code-test-e2e` — coherent.
- Gherkin-before-code (ADR 020 → `sdd-bdd` → `code-test-e2e`) gives the agent a constrained spec to work from, which is exactly the form that AI test authoring degrades least on.
- Flakiness policy has a forcing function (30-day deletion). Most policies of this kind die without one.
- ADR 022 is correctly marked **Proposed** with explicit promotion criteria; it doesn't pretend its dependencies are resolved.

## Findings

### F1 — P1 PLAN_RISK — Integration layer's three targets are mutually pressurised
**Where:** ADR 021 §Layers table + §CI strategy + Assumption block; `code-test-integration.md` §CI Expectations
**Issue:** The ADR simultaneously says (a) integration tests run against the **real staging API** in CI, (b) use **recorded fixtures** (deterministic, no live API in CI — per `code-test-integration.md` line "Live API in CI is banned"), and (c) finish in **<5 min on every PR push** with **zero flake budget**. (a) and (b) directly contradict — the ADR's "Assumption" paragraph says staging API, the skill says fixtures-only. Even charitably reading "fixtures recorded against staging" as the intended bridge, the <5min ceiling on every PR push is aggressive once integration coverage expands to "every API client function × happy + 4xx + 5xx + 401" across ~26 headless modules.
**Why it matters:** Devs hit the ceiling, then either (a) start tagging tests `@slow` to skip them on PR push (silent erosion), (b) shadow-mock to get under the ceiling (the exact anti-pattern this ADR exists to kill), or (c) the fixture-vs-staging contradiction surfaces during the audit and the team has to re-decide mid-rollout.
**Recommendation:** In ADR 021, replace the "Assumption" block with: "Integration tests run against recorded fixtures captured from staging via `pnpm dev:record`. E2E (only) runs live against staging." Then state explicitly: the <5min ceiling is a budget on the **PR-push subset**; a nightly integration sweep can run longer. Reconcile the wording with `code-test-integration.md` so they agree.
**Confidence:** High
**Falsification test:** A reading of ADR 021 §Assumption + `code-test-integration.md` §"Live API in CI is banned" that reconciles the two without re-reading them as "fixtures recorded from staging" — i.e. they actually do mean what they say in isolation.
**Verification command (optional):** `grep -n "staging\|live API\|fixture" docs/adr/021-testing-pyramid-and-agentic-workflow.md .agent/workflows/code-test-integration.md`

### F2 — P1 PLAN_RISK — `dev:record` infrastructure is wired in one app, but integration tests assume it works everywhere
**Where:** `code-test-integration.md` §Fixture-Recording Requirement; `code-test-unit.md` §Recording Fixtures
**Issue:** Both skills tell the dev/agent to "Run `pnpm dev:record`" as the canonical setup step. That script is only defined in `apps/cart/package.json` and uses a proxy targeted at `https://api.staging.upmind.io`. There is no root-level `pnpm dev:record`, no per-app variant for `apps/velia` or `apps/hosting`, no documented flow for capturing fixtures for headless modules not exercised by the cart funnel (admin, account, etc.), and no fixture sanitisation tooling beyond the policy line "Sanitize."
**Why it matters:** An agent following the skill verbatim runs `pnpm dev:record` from the monorepo root and gets a "script not found" error, or runs it in `apps/cart` and can't reach a fixture for an admin-only API. The integration layer can't scale until the recording surface generalises.
**Recommendation:** Add a sequencing step to ADR 021 §Implementation sequencing: "Step 1.5 — generalise `dev:record` to a root-level script or per-app variants; document the fixture-capture playbook in `tests/__fixtures__/README.md`." Reference that playbook from the two skills.
**Confidence:** High
**Falsification test:** Show me `pnpm dev:record` working from monorepo root and capturing a fixture for a `useDomain` admin call.
**Verification command (optional):** `grep -rn '"dev:record"' apps/*/package.json package.json`

### F3 — P1 PLAN_RISK — Pairing rule is declared in two ADRs but does not yet exist in `sdd-tasks.md`
**Where:** ADR 021 §Agentic test workflow ("The pairing rule lives in `sdd-tasks.md`, not inside the skills"); `code-test-integration.md` §"Pairing With `code-generate`"; `code-test-e2e.md` §"Pairing With `/sdd-tasks`"
**Issue:** Three documents point at a pairing rule whose home is `sdd-tasks.md`. I have not been pointed at the rule's text; the ADRs name it as load-bearing for "agentic enforcement". If the rule is not yet written, the agentic pipeline has a gap exactly where it needs the most precision — at the handoff from "task" to "what tests must accompany this task".
**Why it matters:** Without the explicit pairing rule, `code-generate` ships and the test-layer skills are invoked in an ad-hoc way — which is exactly the "tests as follow-up ticket" mode this ADR rejects.
**Recommendation:** Either (a) add a §Pairing matrix to `sdd-tasks.md` that maps task tags (`@layer-unit`, `@layer-integration`, `@layer-e2e`, `@touches-api`, `@touches-journey`) to required test-skill invocations, or (b) cite the existing section if I missed it. Cross-link from the three documents above.
**Confidence:** Medium (high if the section genuinely does not exist; lower if it's present and I didn't surface it in this pass)
**Falsification test:** Open `sdd-tasks.md` and find the matrix.
**Verification command (optional):** `grep -nE 'pairing|@layer|test-skill' .agent/workflows/sdd-tasks.md`

### F4 — P1 PLAN_RISK — ADR 022 depends on a UI-package split that has no committed timeline
**Where:** ADR 022 §Context point 3, §Per-package Storybook architecture, §Promotion criteria
**Issue:** ADR 022 explicitly assumes the monolithic UI lib gets split into per-domain packages, and uses that split as the routing principle for stories, CI, and meta-Storybook orchestration. The split is described as "a separate strategic decision underway" — but there is no ADR for it, no Linear initiative cited, no date. ADR 022's promotion criteria includes "team agreed the UI package split direction" — meaning the entire UI testing strategy is gated on a decision that lives outside this ADR's control.
**Why it matters:** The "Proposed" status is honest, but the dependency creates a stall risk: UI testing waits on the split, the split waits on someone else, and meanwhile the deferred row from ADR 021 stays unowned. There's also a single-Storybook fallback (the existing `playgrounds/storybook/`) that the ADR doesn't acknowledge.
**Recommendation:** Add a §"Interim posture" to ADR 022: even before the split lands, pilot `addon-vitest` + `axe` against the existing `playgrounds/storybook/` for ONE organism. That proves the stack works regardless of the package architecture. Promote-to-Accepted criterion remains; pilot doesn't.
**Confidence:** High
**Falsification test:** Point me at the ADR or Linear initiative committing to the UI lib split with a date.
**Verification command (optional):** `ls docs/adr/ | grep -i "ui\|package\|split"`

### F5 — P2 PLAN_RISK — Coverage policy row "Every API client function" is large and unscoped
**Where:** ADR 021 §Coverage policy table, row 3
**Issue:** "Every API client function: integration test for happy path + 4xx + 5xx + 401" applied across the headless module set (~26 modules visible under `packages/headless/src/modules/`) is a large suite even before counting per-function multiplicity. Combined with the <5min ceiling (F1) and per-fixture recording cost (F2), this is the most expensive single row. The categorical-not-percentage stance is correct in spirit; "every function × 4 cases" is still a quantitative budget by another name.
**Why it matters:** Either the suite hits the ceiling fast and the policy quietly weakens, or coverage is partial and the policy quietly weakens. Forcing functions help; an unenforced ceiling does not.
**Recommendation:** Tier the rule. "Every API client function on the critical path: 200 + 401 + one error class (4xx or 5xx). Full matrix only for auth-sensitive endpoints (login, refresh, payment, order-create)." Tie to the audit (Step 2) so the critical-path list is concrete.
**Confidence:** Medium
**Falsification test:** A back-of-envelope count of (API client functions × 4 test cases × fixture-record time) lands under the 5min ceiling for a typical PR-push run.

### F6 — P2 PLAN_RISK — Audit (Step 2) is described as "intel, not action" — risks becoming a permanent artefact
**Where:** ADR 021 §Implementation sequencing, Step 2
**Issue:** Step 2 produces a per-test verdict (`delete`, `move-down-to-{unit,integration}`, or `keep-at-e2e`) explicitly labelled "Intel, not action". Step 3 turns verdicts into Gherkin. Steps 4–7 ride the migration. There's no explicit step where the verdicts get executed — i.e. when does the e2e test marked `move-down-to-unit` actually get deleted? The retirement rule ("retire when the layer beneath covers it") is right but applies to shortcut **helpers**, not whole tests; whole-test retirement is unstated.
**Why it matters:** Audits that don't bind to action become wallpaper. The "ice-cream cone" persists if e2e tests with lower-layer verdicts never get removed.
**Recommendation:** Add Step 7a: "When a module's `@next` migration PR merges, any e2e tests for that module with `move-down-to-*` verdicts whose replacement coverage exists at the lower layer are deleted in the same PR." Same retirement rule as for shortcut helpers, applied to whole tests.
**Confidence:** High
**Falsification test:** A merged migration PR where the lower-layer test exists, the e2e verdict was `move-down`, and the e2e test still runs in CI.

### F7 — P2 PLAN_RISK — Pilot module (`auth` or `session`) feasibility undefended
**Where:** ADR 021 §Implementation sequencing, Step 5
**Issue:** Step 5 commits to piloting on `auth` or `session` — "both already started." The ADR doesn't say what "started" means in measurable terms (number of unit tests, integration tests, e2e coverage), nor what the pilot's exit criterion is (other than producing the playbook in Step 6).
**Why it matters:** Pilots without exit criteria stall and become "we'll generalise once it's perfect" forever. The deferred-tester role makes this worse — there's no QA voice external to the pilot lead.
**Recommendation:** Add to Step 5: "Exit criterion — the pilot is complete when the module ships a `@next` PR that includes (a) unit coverage of XState transitions/guards/context, (b) integration tests for API clients incl. 401, (c) at most one e2e scenario, (d) all three suites passing in CI within their per-layer budgets, AND the playbook (Step 6) is reviewed by a non-pilot dev."
**Confidence:** High
**Falsification test:** A pilot that "completes" without producing a generaliseable playbook — i.e. the second module's migration is just as hard as the first.

### F8 — P2 PLAN_RISK — Skills give the agent enough structure, but no example test scaffold for XState machines
**Where:** `code-test-unit.md` §Example: Good vs Bad
**Issue:** ADR 021 names XState machines as "the primary unit-test target" and the coverage policy explicitly requires "Unit tests for transitions, guards, and data flow into context" per machine. But `code-test-unit.md`'s examples are session-flavoured (`isExpired`, `activeSessionId`) — there is no template for testing a transition, asserting on a guard, or driving context data flow. Agents are likely to produce shape-checking tests against `machine.config` rather than behaviour-driven actor tests.
**Why it matters:** The single most-important unit-test target lacks a worked example. Agents fall back to shallow patterns. Result: green unit suite that doesn't catch transition bugs.
**Recommendation:** Add an "XState pattern" section to `code-test-unit.md` with one canonical worked example: `createActor(machine).send(...)`, assert resulting state value, assert resulting context. Cite the test rule file `code-tests.md` if it already contains this.
**Confidence:** High
**Falsification test:** An agent invocation of `/code-test-unit` against an XState machine produces transition-driven tests on the first try, without the user needing to nudge it.
**Verification command (optional):** `cat .agent/rules/code-tests.md | head -100`

### F9 — P2 PLAN_RISK — "30-minute aggregate ceiling" for full e2e is undefended given today's suite shape
**Where:** ADR 021 §CI strategy ("Aggregate ceiling: the full e2e suite must complete in under 30 minutes")
**Issue:** Current full suite is 52 specs (from `tests/Playwright/e2e/e2e-tests`). The FE-1365 run showed 97 failures, suggesting at least that many test executions including parametrisation/retries. 30 minutes for the full suite on chrome only is plausible; on `all-browsers` it almost certainly isn't. ADR 021 doesn't disambiguate the ceiling per project.
**Why it matters:** Ceilings that aren't measured against today's baseline become aspirational. Devs will quietly accept 45min and the policy decays.
**Recommendation:** State the ceiling as "30 minutes on chrome at current parallelism" and add an explicit acceptance of longer durations on `all-browsers` for nightly. Baseline today's chrome suite duration in the audit (Step 2).
**Confidence:** Medium
**Falsification test:** Today's chrome-only full run finishes in under 30 minutes already.

### F10 — P3 PLAN_RISK — Visual regression sits in two ADRs with subtly different status
**Where:** ADR 021 §Layers table ("proposed per ADR 022"); ADR 022 §Visual regression — explicitly open
**Issue:** ADR 021 treats the row as "defined by ADR 022 when drafted"; ADR 022 explicitly **defers** the visual regression decision and recommends keeping Playwright snapshots interim. Net: the visual layer has no owner in either accepted ADR. Existing Playwright visual tests run on a separate config (`pnpm visreg:chrome`, per `test-regression.md`) but neither ADR enforces anything about them.
**Why it matters:** Low blast radius today, but the "explicitly open" state on a layer that already produces noisy snapshot diffs invites silent skipping during the migration.
**Recommendation:** Add one sentence to ADR 022's interim posture: "Existing Playwright visual tests remain authoritative and gating until the visual-regression decision lands. Failures must be triaged, not ignored." Trivial change, removes ambiguity.
**Confidence:** Medium

### F11 — P2 PLAN_RISK — "Test-writer ≠ code-writer" is a strong principle without a tooling enforcement story
**Where:** ADR 021 Core principle #4; repeated in three skill docs
**Issue:** The principle is correct — self-validation is tautology. But the practical enforcement is "a separate skill invocation" — in practice that means the human operator remembers to run `/code-test-unit` from a fresh context after `/code-generate`. Without a hook, settings rule, or `sdd-tasks` automation that makes the split mechanical, agents will end up writing both in one turn the moment a story is in a rush.
**Why it matters:** The principle's whole value is preventing tautology. The mechanism to enforce it is currently social, in a workflow designed to scale away from social enforcement.
**Recommendation:** Either (a) `sdd-tasks` emits two task types per implementation step (one tagged `code`, one tagged `test`) and the agent-run loop refuses to combine them, or (b) `code-generate` outputs include a sentinel that `code-test-*` checks against the git diff: if the same agent run produced both, fail loudly. Pick one; commit to it.
**Confidence:** High
**Falsification test:** A `/code-generate` invocation that also writes a passing test file goes unflagged by any tooling.

## Open Questions
- Where is the pairing matrix in `sdd-tasks.md`? (F3)
- What does "started" mean for the `auth`/`session` pilot today — how many unit tests, integration tests exist? (F7)
- Does `.agent/rules/code-tests.md` contain XState patterns the unit-test skill can defer to? (F8)
- Is there an ADR or Linear initiative for the UI lib package split that ADR 022 depends on? (F4)
- What's today's chrome-only full e2e duration vs the 30min ceiling? (F9)
- For ADR 020's escalation gate — has the "10 stories shipped through the new flow" counter started, and where is it tracked?

## Verdict
Coherent direction, right principles, realistic migration vehicle (ride `@next`) — but the integration layer's stated targets contradict, the agentic-enforcement story is principle-without-mechanism, and ADR 022 is honestly Proposed but its dependency chain has no committed timeline; tighten F1, F3, F11, and F4 before adoption.
