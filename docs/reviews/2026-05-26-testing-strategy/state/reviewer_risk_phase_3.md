# Phase 3 Review — Risk Assessor
**Score:** 6/10
**Mode:** Exhaustive
**Recommendation:** APPROVE_WITH_CHANGES

## Summary
The proposal is intellectually coherent and the diagnosis (shadow implementations, FE-1365 lessons, ice-cream-cone shape) is sharp. But the load-bearing enforcement mechanisms — "test-writer ≠ code-writer", "agent that wrote the code MUST NOT write the assertions", `@next`-migration coupling, fixture-recording discipline, and 30-day flake deletion — are all unenforced human/process gates layered on top of an agentic pipeline that has no automation guarding them. The three ADRs also leave several real seams (integration-vs-unit boundary for composables, fixture rot under staging-API drift, "module-driven setup" carve-out that swallows the shadow-implementation rule, Gherkin `@layer-unit` as a phantom artefact). In six months the most likely failure mode is *coverage theatre with extra steps*: green unit suites of tautological mock-against-mock tests, an unchanged e2e cone, and a graveyard of half-quarantined flakes.

## Strengths (be honest, even as a skeptic)
- Naming the shadow-implementation anti-pattern with a real receipt (FE-1365 / `seedInvalidProduct`) — this is the single best part of the proposal.
- Categorical (not %-of-lines) coverage policy. Correctly identifies line coverage as theatre.
- Coupling testing migration to `@next` migration (ADR 021 Step 7) is the only enforcement with teeth the proposal offers.
- Test-writer ≠ code-writer principle is the right instinct for agentic workflows; even if unenforced, naming it is half the battle.
- ADR 020's escalation gate (10 stories, three measurable conditions) is unusually disciplined for a BDD adoption.
- ADR 022 honest about being Proposed, not Accepted; lists open questions instead of pretending.
- 30-min full-e2e ceiling and < 60s unit gate are concrete, falsifiable.

## Findings

### F1 — P0 PLAN_RISK — "Test-writer ≠ code-writer" has no enforcement mechanism
**Where:** ADR 021 §Core principles #4; `code-test-integration.md` §The Agentic Rule; `code-test-e2e.md` HARD RULES.
**Risk:** The rule is stated four times across three docs and never enforced once. There is no hook, no PR-bot, no skill orchestration step that records "agent A wrote code, therefore agent B must write tests". `sdd-tasks.md` is named as the pairing point but the pairing rule says nothing about *which agent instance* runs the test skill. In practice a single Claude session will run `code-generate` then `code-test-unit` in the same context, with full memory of the implementation it just wrote, and produce assertions that mirror the implementation. That is exactly the tautology the principle exists to prevent.
**Likelihood × impact:** High × High. This is the central agentic-testing failure mode and it is unguarded.
**Why it matters:** If this principle silently degrades, the entire pyramid becomes coverage theatre. Tests will pass because the same agent that wrote the bug also wrote the assertion that ignores it.
**Mitigation:** Either (a) require a fresh subagent invocation for every `code-test-*` skill call, with the implementation diff but *not* the implementation reasoning passed in, OR (b) require Gherkin/AC to be the literal source of every assertion with an automated trace-back check in CI, OR (c) admit the principle is aspirational and weaken it to "tests must trace to a prior artefact (Gherkin, AC, fixture diff)". Pick one and write it down.
**Confidence:** High
**Falsification test:** In 3 months, audit 20 unit tests produced via the agentic flow. If > 30% of assertions restate the implementation rather than the spec/Gherkin, the principle has failed.

### F2 — P0 PLAN_RISK — Module-driven setup carve-out swallows the shadow-implementation rule
**Where:** ADR 021 §Core principles #2; `code-test-integration.md` §Shadow-Implementation Anti-Pattern; `code-test-e2e.md` §Fixtures and Seeding.
**Risk:** ADR 021 says "Seeding state via those modules (driving `useBasket` programmatically, calling `useOrders.create()`, etc.) is legitimate." This is a giant carve-out. Today's `seedInvalidProduct` could be rewritten as `await useBasket().addInvalidProduct()` and pass the rule while remaining a shadow implementation in spirit — a test-only helper that establishes a state production cannot establish via the UI. The e2e skill even contradicts itself: "`headless` clients are a last resort … only with a comment explaining why" vs ADR 021's "module-driven setup cannot drift." Both can't be true.
**Likelihood × impact:** High × High. Devs/agents will read the permissive line, not the restrictive one.
**Why it matters:** The proposal's headline diagnosis is shadow implementations. If the cure permits "shadow setup via real modules in unreachable states", the FE-1365 class of bug recurs in a different shape.
**Mitigation:** Add a third clause: "Module-driven setup is only legitimate if it reaches a state a real user can reach via the UI in production." This is the actual line — not "uses real modules" vs "doesn't use real modules". Reconcile the contradiction between ADR 021 and `code-test-e2e.md` explicitly.
**Confidence:** High
**Falsification test:** Find one example in the existing suite where module-driven setup reaches a state the UI cannot reach. If it exists, the carve-out is already being abused.

### F3 — P1 PLAN_RISK — Integration tests run against the real staging API in CI
**Where:** ADR 021 §Decision (Assumption block) and §CI strategy per layer; `code-test-integration.md` §CI Expectations + §Fixture-Recording Requirement.
**Risk:** ADR 021 says "all e2e tests and integration tests in CI run against the real staging API". `code-test-integration.md` says "Live API in CI is banned. … Recorded fixtures are deterministic." These contradict directly. If integration runs hit live staging on every PR push with a < 5min target and zero flake budget, that target is fiction — staging will go down, the suite will go red, and the team will retry/ignore. If they run on recorded fixtures, the "real staging API" assumption is false and the ADR is misleading about what the integration layer protects against (it protects against drift *from the last recording*, not live drift).
**Likelihood × impact:** High × Medium-High.
**Why it matters:** Whichever the team picks, the other doc lies. Documents that contradict each other on a load-bearing question erode trust in the whole policy.
**Mitigation:** Pick one. The fixture path is correct (deterministic, fast, < 5min defensible). Rewrite the ADR 021 assumption block to: "Integration tests use recorded fixtures of real staging responses. The fixture diff is the contract-drift signal." Reserve "real staging API" for e2e only.
**Confidence:** High
**Falsification test:** Read `playwright.config.ts` and any Vitest integration project config. Whichever wins is the truth; the other doc is wrong.

### F4 — P1 PLAN_RISK — `@layer-unit` Gherkin scenarios are a phantom artefact
**Where:** ADR 020; `sdd-bdd.md` Step 6 + Integration table.
**Risk:** A `.feature` file with a `@layer-unit` scenario is "documentation only" — the real test is a Vitest file elsewhere. Nothing keeps them in sync. The Gherkin can change without the Vitest test changing, and vice versa. Worse: product reviewers will read the `.feature` file as the contract, but the `.feature` file is not executed. Drift here is silent.
**Likelihood × impact:** Medium-High × Medium.
**Why it matters:** This is the BDD-as-documentation-theatre failure mode wearing a fresh hat. The whole point of ADR 020 (escalation gate to executable Gherkin) is undermined by introducing scenarios that *can never* be executed.
**Mitigation:** Either (a) `@layer-unit` scenarios live in a separate `.spec-anchor.md` artefact, not `.feature` files — keep `.feature` files exclusively for `@layer-e2e` and `@layer-integration` so the executable promise is unambiguous; OR (b) require an automated linter that fails CI if a `@layer-unit` Gherkin scenario doesn't have a Vitest test referencing its tag. Without one of these, `@layer-unit` is decorative.
**Confidence:** High
**Falsification test:** In 3 months, count `@layer-unit` scenarios vs Vitest tests that reference them by tag/name. Any divergence > 10% confirms drift.

### F5 — P1 PLAN_RISK — Fixture recording is the single point of failure
**Where:** `code-test-unit.md` §Test Data; `code-test-integration.md` §Fixture-Recording Requirement.
**Risk:** Fixtures recorded via `pnpm dev:record` are the foundation of both unit and integration testing. The proposal handles "missing fixture → throw" well, but doesn't address: (a) fixture rot (a fixture recorded today drifts from staging next quarter — silent), (b) who owns re-recording, (c) what happens when staging itself has a bug that gets baked into the fixture, (d) sanitisation as a manual step (PII leakage risk on every recording), (e) fixture cardinality explosion (every 4xx/5xx/401 path × every endpoint × every actor type).
**Likelihood × impact:** High × Medium.
**Why it matters:** Six months in, you have hundreds of fixtures, no one remembers which are current, and a third of them are baking in a bug staging fixed last quarter. The tests pass; production is wrong.
**Mitigation:** Add to ADR 021: (1) a fixture-staleness policy (e.g. re-record on every minor release, or assert `recorded_at` < N days), (2) an automated sanitiser, not a manual step, (3) a fixture-ownership column in the coverage policy table.
**Confidence:** Medium-High
**Falsification test:** Grep existing fixtures for `recorded_at` timestamps. If they don't exist, fixture rot is already invisible.

### F6 — P1 PLAN_RISK — 30-day flake deletion will not survive its first test
**Where:** ADR 021 §Flakiness policy.
**Risk:** The policy reads cleanly: flake once → investigate, flake twice → quarantine, > 30 days → delete. In practice, the test that flakes is usually the one nobody owns and nobody has time to root-cause. At day 30 the choice is: delete a test that maybe-protects a real journey, or extend the deadline. The deadline will be extended. Once. Then again. The policy says "the deadline itself cannot be removed" but says nothing about who enforces it or what happens when it's quietly missed.
**Likelihood × impact:** High × Medium.
**Why it matters:** Flake policies that rely on willpower fail. The ADR even acknowledges the rule lived in one person's head before — replacing that with "discipline burden on PR reviewers" (Consequences §Negative #3) is the same model with more people.
**Mitigation:** Automate: a CI job that lists quarantined-tests-by-age and (a) auto-deletes at 30 days with a `git revert`-friendly commit, or (b) auto-files a Linear issue at day 25 with the deadline. Make the forcing function mechanical, not human.
**Confidence:** High
**Falsification test:** Look at the current quarantine list (if any). If any test has been `.skip`ped for > 30 days, the policy already failed pre-adoption.

### F7 — P1 PLAN_RISK — `test-triage` skill is a flake amnesia engine
**Where:** `test-triage.md`.
**Risk:** The triage skill's job is to analyse a failed regression run and group failures by cluster + suspect merge. Nowhere does it flag: "this test has flaked before; check the quarantine list first." The risk is that triage cycles spend effort re-discovering known-flake patterns, and the triage report's "test brittleness" classification quietly becomes the escape hatch — failures get labelled "test brittleness, not code" and the test stays in the suite, flaking, forever.
**Likelihood × impact:** Medium-High × Medium.
**Why it matters:** The flake policy (F6) and the triage skill don't talk to each other. Triage is the entry point where flake-vs-real determination happens; if triage doesn't enforce the flake policy, the policy is bypassed by design.
**Mitigation:** Add a mandatory section to the triage report template: "Quarantine candidates" — every cluster classified as test-brittleness MUST be auto-flagged for quarantine, not just described. The skill writes the quarantine PR, not a paragraph about the failure.
**Confidence:** Medium-High
**Falsification test:** In 3 months, audit triage reports vs quarantine PRs. Any cluster labelled "test brittleness" that is still in the suite is a policy bypass.

### F8 — P1 PLAN_RISK — `test-regression` skill does not pin behaviour, it just re-runs
**Where:** `test-regression.md`.
**Risk:** The skill runs the full regression suite and surfaces the Allure dashboard. It does *not* (a) compare against the last green run, (b) detect new failures vs persistent failures, (c) pin a known-good baseline. So every regression run is treated as a standalone snapshot. The "before merging a feature branch" use-case will surface the same 12 pre-existing failures every time and the dev will tune them out.
**Likelihood × impact:** Medium × Medium.
**Why it matters:** Regression as a concept requires a baseline. The skill doesn't establish one. Without it, "regression" means "ran the tests, some failed, same as last week" — which is the failure mode the FE-1365 run already demonstrated.
**Mitigation:** Add a baseline-comparison step: pull the last green develop run, diff failures, surface only the deltas. The skill becomes useful instead of decorative.
**Confidence:** Medium
**Falsification test:** After three uses of `/test-regression`, ask the user "what changed since last run?" If the skill can't tell them, this risk is realised.

### F9 — P2 PLAN_RISK — Unit-vs-integration boundary is undefined for composables
**Where:** ADR 021 §Layers (Unit row + Integration row); `code-test-unit.md`; `code-test-integration.md`.
**Risk:** ADR 021 puts "composables (including scope-based composables)" at the unit layer and "API clients, contract drift, auth flows" at integration. But most non-trivial composables (`useBasket`, `useAuth`, `useDomain`) *are* API clients wrapping XState. Where does `useBasket.addProduct` get tested? Unit (mock the API) or integration (recorded fixture)? Both skills claim it. Devs will pick whichever is faster, agents will pick whichever skill is invoked, and coverage will skew accidentally.
**Likelihood × impact:** Medium-High × Medium.
**Why it matters:** Ambiguity at layer boundaries produces duplication ("tested at unit AND integration") or gaps ("each layer assumed the other did it"). ADR 021 §Core principles #5 says "no duplication across layers" but provides no rule for resolving cases that legitimately fit both.
**Mitigation:** Add a decision rule: "If the composable's primary behaviour is reactive state derivation, test at unit. If it crosses an HTTP boundary as part of the behaviour under test, test at integration." Then commit to one canonical example per layer (e.g. `useBasket` at integration, `useScopedTheme` at unit).
**Confidence:** High
**Falsification test:** Audit existing `__tests__` in `packages/headless/src/modules`. Count modules with both a unit and an integration test for the same function. Any count > 0 confirms the duplication risk.

### F10 — P2 PLAN_RISK — ADR 020 declarative-style rule is human-enforced and will drift
**Where:** ADR 020 §Decision #4 + §Negative #1; `sdd-bdd.md` §5 hard rules.
**Risk:** ADR 020 explicitly names imperative drift as the dominant failure mode and explicitly says "Convention enforcement is human. No automated linter today." This is honest and also the proposal's biggest weakness — the ADR is saying "the thing most likely to kill this has no automated guard." `sdd-bdd.md` Step 8 offers a `grep` one-liner; that is not a linter, it's a suggestion.
**Likelihood × impact:** Medium-High × Medium.
**Why it matters:** Every Cucumber adoption that fails, fails here. The proposal knows this and ships anyway without the guard.
**Mitigation:** Either commit to building a `.feature` linter (banned-word list, single-When check, tag-presence check) as a pre-promotion item in the 10-story escalation gate, or accept that the escalation gate will likely fail on condition 2 (declarative discipline) and pre-write the "revert to AC-only" plan.
**Confidence:** Medium
**Falsification test:** After 5 stories, grep `.feature` files for `click|navigate|data-testid|button|input`. Any match confirms drift has begun.

### F11 — P2 PLAN_RISK — UI testing ADR depends on a UI package split that isn't decided
**Where:** ADR 022 §Context #3 + §Proposed decision + §Open Questions #3.
**Risk:** ADR 022 explicitly assumes "the split happens". It also says the split is "a separate strategic decision". If the split stalls or takes a different shape (e.g. micro-frontend vs package split), most of ADR 022 — per-package CI, meta-Storybook, "released to a consumer package" coverage gate — collapses. Building the agentic skill (`code-test-component`) against an undecided architecture is a recipe for rework.
**Likelihood × impact:** Medium × Medium.
**Why it matters:** ADR 022 is rightly Proposed, but its promotion criteria don't require the split to be decided first — only "agreed direction". That's soft.
**Mitigation:** Tighten ADR 022 promotion condition 3 from "agreed direction" to "split ADR Accepted, with package boundaries named." Don't ship `code-test-component` until then.
**Confidence:** Medium
**Falsification test:** N/A — this is a sequencing risk, not an observable defect.

### F12 — P2 PLAN_RISK — Visual regression baseline rot is acknowledged then ignored
**Where:** ADR 022 §Visual regression — explicitly open; §Neutral #1.
**Risk:** ADR 022 says "keep existing Playwright visual tests running as today" and defers the visual tool decision. Meanwhile screenshot baselines rot continuously: every fonts/CSS/Tailwind/icon update produces drift that has to be triaged. The proposal has no policy on baseline ownership during the deferral period. The current visual-regression layer will become the dumping ground for "ignore this diff" decisions.
**Likelihood × impact:** Medium × Medium.
**Why it matters:** "Decide later" on visual regression while keeping the existing layer running is the worst of both worlds — the old layer accretes noise that the new layer (if adopted) will inherit.
**Mitigation:** Add a deferral-period policy: "During the visual-tool deferral, no new Playwright visual snapshots are added (already stated). Additionally, any existing snapshot that fails three times within 30 days is deleted." Forces curation, not accretion.
**Confidence:** Medium
**Falsification test:** Count current Playwright snapshot baselines. In 3 months, count again. If the number has grown despite the no-new-snapshot policy, the gap is real.

### F13 — P2 PLAN_RISK — ADR 013 deprecation leaves orphan configs and helpers
**Where:** ADR 021 §Status (Supersedes 013); existing `tests/Playwright/e2e/support/` (api/, flows/, page-objects/).
**Risk:** ADR 021 supersedes 013 but doesn't enumerate what is *retired* from 013. The existing `tests/Playwright/e2e/support/api/` (auth.ts, basket.ts, client.ts) and `support/flows/` (checkout.ts, product-setup.ts) are the shadow-implementation layer the new ADR names. The audit (Step 2) is supposed to verdict them but is sequenced *after* the ADR lands. In the meantime, the policy says "shadow implementations are forbidden" while the suite is entirely built on them. Mixed signals to devs/agents reading the policy today.
**Likelihood × impact:** High × Low-Medium.
**Why it matters:** Devs writing new tests during the audit period will reasonably assume the existing helpers are acceptable patterns to extend. By the time the audit lands, the debt has grown.
**Mitigation:** Freeze the existing support helpers: "no new `seed*` / API-direct helpers may be added until the audit completes." State this in ADR 021 Step 2.
**Confidence:** High
**Falsification test:** `git log --since="ADR 021 land" -- tests/Playwright/e2e/support/`. Any new helper added before the audit confirms the gap.

### F14 — P2 PLAN_RISK — `sdd-bdd` is on the critical path; bottleneck risk
**Where:** ADR 021 §Agentic test workflow §Plan; `sdd-bdd.md` (Prerequisites — requires design.md approved by stakeholder).
**Risk:** `sdd-bdd` requires approved requirements + approved design before it can run. `code-test-e2e` STOPs if no `.feature` file exists. So every e2e test gets blocked behind the SDD flow. This is fine in steady state. It is fatal for bug fixes (`sdd-bdd` says skip BDD for bug fixes, but `code-test-e2e` says STOP if no scenario exists). The contradiction means agentic bug-fix flows are blocked at the e2e regression-test stage.
**Likelihood × impact:** Medium × Medium.
**Why it matters:** "Every bug fix: a regression test at the lowest layer that would have caught it" (ADR 021 coverage policy) clashes with "code-test-e2e STOPs without Gherkin". Bug fixes that need e2e regression coverage have no defined path.
**Mitigation:** Either allow `code-test-e2e` to accept a "regression scenario" anchor (a single Gherkin scenario authored ad-hoc for the bug, not via the full `sdd-bdd` flow), or explicitly state that bug-fix e2e regression tests are exempt from the Gherkin gate. The current docs leave this undefined.
**Confidence:** Medium-High
**Falsification test:** Try to write a bug-fix regression test via the agentic flow today. The flow will deadlock at the `code-test-e2e` STOP gate.

### F15 — P3 PLAN_RISK — "Ownership: Dom owns e2e" is the single point of failure the ADR was written to avoid
**Where:** ADR 021 §Ownership model.
**Risk:** ADR 021's headline context is "the judgment lived in one head; he left". The new ownership model is "Dom owns e2e suite + test framework". This is the same model. If Dom leaves, the judgment leaves again. Distributing unit + integration to devs is good; concentrating e2e + framework in one person is the unaddressed half.
**Likelihood × impact:** Low (today) × High (when realised).
**Why it matters:** The ADR's own context says "concentration of judgment is the structural problem". The fix only addresses two of three layers.
**Mitigation:** Add a bus-factor mitigation: e2e suite ownership documented in `tests/Playwright/docs/`, framework decisions in ADRs (already doing this — extend it), and at least one rotation point per quarter where another engineer authors an e2e from scratch via the agentic flow as a check on the flow's coherence without Dom's tacit knowledge.
**Confidence:** Medium
**Falsification test:** If Dom is unavailable for two weeks, can another engineer (or agent + reviewer) keep the suite green? If no, the risk is realised.

## Risk Heatmap

| Risk | Likelihood | Impact |
|------|------------|--------|
| F1 Test-writer ≠ code-writer unenforced | High | High |
| F2 Module-driven setup carve-out | High | High |
| F3 Staging-API vs fixtures contradiction | High | Medium-High |
| F4 `@layer-unit` Gherkin phantom artefact | Medium-High | Medium |
| F5 Fixture rot | High | Medium |
| F6 30-day flake deletion unenforced | High | Medium |
| F7 Triage skill bypasses flake policy | Medium-High | Medium |
| F8 Regression skill has no baseline | Medium | Medium |
| F9 Unit-vs-integration boundary undefined | Medium-High | Medium |
| F10 Declarative-style human-enforced | Medium-High | Medium |
| F11 ADR 022 depends on undecided split | Medium | Medium |
| F12 Visual baseline rot during deferral | Medium | Medium |
| F13 ADR 013 deprecation leaves orphans | High | Low-Medium |
| F14 sdd-bdd gate blocks bug-fix flow | Medium | Medium |
| F15 e2e ownership concentration | Low | High |

## Open Questions

1. Does the agentic pipeline enforce a fresh subagent invocation between `code-generate` and `code-test-*`, or is "test-writer ≠ code-writer" purely aspirational? (F1)
2. Do integration tests run against live staging or recorded fixtures in CI? The two docs disagree. (F3)
3. What is the canonical example of `useBasket.addProduct` test coverage — unit or integration? Both skills can claim it. (F9)
4. What is the bug-fix e2e regression test path when `sdd-bdd` skip rules and `code-test-e2e` STOP gate collide? (F14)
5. Who re-records fixtures, on what cadence, and what triggers re-recording? (F5)
6. Who enforces 30-day flake deletion mechanically? (F6)
7. Will a `.feature` linter ship before the 10-story escalation gate review, or after? (F10)
8. Will ADR 022 be promoted before the UI package split decision lands, or held? (F11)

## Verdict
Sharp diagnosis, coherent target shape, but the agentic enforcement layer is mostly aspirational — approve with the changes in F1, F2, F3, F4, F14 treated as pre-merge fixes and F5, F6, F9 as pre-pilot fixes.
