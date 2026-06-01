# Phase 3 Review — Devil's Advocate
**Score:** 5/10
**Mode:** Exhaustive
**Recommendation:** REVISE

## Summary

The proposal is competent, internally consistent, and well-written — and that is precisely the danger. It bundles three trendy ideas (BDD/Gherkin, classic pyramid, agent-authored tests) into a four-ADR, six-skill apparatus before a single pilot has earned any of them. Two of the three pillars — Gherkin and the pyramid shape — are imported from team configurations Upmind does not have (a product/QA reviewer pool; a backend-heavy logic base). The result is a plan that will plausibly produce green CI, growing artefact counts, and the smug feeling of "doing testing properly," while the actual bug-catching signal does not improve. The thing to cut first is Gherkin; the thing to test next is the shape, not the volume.

## Counter-Proposal (top of file — pitch it)

**Ship one page, one pilot, then decide.** Replace ADRs 020/021/022 with a single `TESTING.md` of ~300 lines: three principles (write a test that names the bug it prevents; mock at the network boundary; zero flake tolerance), one shape commitment (Testing Trophy, not pyramid — integration-heavy for a Vue SPA whose value lives in composables wiring API → UI), and one coverage rule (a module is not "@next" until its trophy slice exists). Defer Gherkin entirely until you can name three production bugs a `.feature` file would have caught that a well-named `it()` would not. Defer the `code-test-component` / `sdd-bdd` / `code-test-integration` skill explosion until a human has done the workflow by hand on two modules and can describe the bottleneck the skill removes.

Bullet plan:

- Collapse ADRs 020/021/022 into one `docs/TESTING.md`. Keep ADR 013 as historical record.
- Adopt the **Testing Trophy** (Kent C. Dodds), not the pyramid: static → unit (small) → **integration (largest)** → e2e (smallest). This matches what a Vue 3 + headless-composables + staging-API codebase actually breaks on.
- Drop Gherkin until you have evidence the product team will read `.feature` files in PRs. Use plain `describe`/`it` titles written as user-facing sentences. They are read by the same humans, render in the same CI output, and never drift imperatively.
- Replace six new/changed skills with **one** skill: `/test` — given a diff, propose tests at the right layer, ask for human confirmation, then write them. The granularity ADR 021 defends is theoretical; granularity earns its keep when humans hit a real coupling pain, not pre-emptively.
- Keep ADR 021's good bits as principles: no shadow implementations, mock settings not data, retire helpers as layers cover them, 30-day quarantine deadline. These are the load-bearing claims; everything else is scaffolding.
- Pilot **before** generalising. One module, end-to-end, written by a human pairing with the agent. Document what hurt. *Then* write the workflow files.

## Findings (premise challenges)

### F1 — [P0] [PLAN_RISK] — The pyramid is the wrong shape for this codebase
**Challenge:** ADR 021 commits to "classic pyramid" as the health metric ("unit grows, integration grows moderately, e2e stays flat"). For a Vue 3 SPA whose value is overwhelmingly *wiring* — composables orchestrating API calls, XState machines reacting to network responses, UI reflecting reactive state — the bug surface lives at integration, not unit. Pure-logic units are a minority of the code.
**Analogous failure:** Backend teams (Java/Spring, Go services) adopt the pyramid because their logic-to-wiring ratio is inverted. Frontend teams that copy the shape end up with hundreds of unit tests asserting `ref(0).value === 0` while integration bugs (auth refresh races, basket-state desync, contract drift) keep shipping. Kent C. Dodds named this years ago and proposed the **Testing Trophy**; Spotify documented similar with the **Honeycomb** (integration-heavy, e2e + unit thin).
**Why this proposal repeats it:** ADR 021 explicitly names "ice-cream cone bad → pyramid good" without considering the third option. The unit row is described as "largest suite, hundreds of tests"; the integration row as "mid-size, critical paths." For a Vue SPA over a REST API, that ratio should likely be inverted.
**Alternative:** Adopt the Trophy. Integration is the largest layer. Unit covers genuinely tricky logic (XState guards, validation, parsers). E2E stays at ~20 critical journeys. This also better matches the stated belief that "tests run against real staging API" — that's an integration-first stance, not a pyramid one.
**Confidence:** High
**Falsification test:** Survey the last 20 production bugs. Classify each by the lowest layer that could have caught it. If >50% land at integration, the pyramid is mis-shaped.

### F2 — [P0] [PLAN_RISK] — Gherkin without product readers is cargo culting
**Challenge:** ADR 020 stakes Gherkin's value on "the product team are the primary reviewers of `.feature` files." That is the load-bearing assumption — and it is asserted, not evidenced. The ADR also notes that the tester who proposed it is the one leaving, and the escalation gate measures "are product-team reviewers actually leaving comments on `.feature` files in PRs." If they aren't, the entire artefact collapses to engineers writing both `.feature` and `.spec.ts` — strictly more work for strictly less signal than well-named `it()` blocks.
**Analogous failure:** The Cucumber graveyard is the canonical industry example. Aslak Hellesøy (Cucumber's author) has publicly said most teams misuse it. Every team that adopts Gherkin "for the product team" without product actually reviewing ends up with two artefacts, imperative drift, and a step-definition library nobody wants to own. ThoughtWorks Tech Radar moved Cucumber to "Hold" partly for this reason.
**Why this proposal repeats it:** It asserts product engagement as a precondition without naming a single product person who has agreed to review `.feature` files. It even pre-builds the escalation path to `playwright-bdd` — anchoring on Option A as the destination, which is exactly how cargo culting locks in.
**Alternative:** Write Playwright tests with sentence-shaped names: `test('a customer with an expired card sees the card-update prompt before checkout', ...)`. That sentence is reviewable by anyone. No second artefact. No drift risk. Revisit Gherkin only if/when a real product reviewer asks for it.
**Confidence:** High
**Falsification test:** Show the proposal to two product people. Ask "would you actively review `.feature` files in PRs?" If the answer is "sure, in principle" without specifics, treat that as a no.

### F3 — [P0] [PLAN_RISK] — Agent-authored tests will scale low-signal volume
**Challenge:** The skill graph adds `sdd-bdd`, `code-test-unit`, `code-test-integration`, `code-test-e2e`, `code-test-component` (planned). An agent told "write unit tests" will write unit tests — tautological ones, snapshot ones, ones that re-assert framework behaviour. Pass rate goes up, coverage goes up, bugs caught stays flat. The "agent does not write its own assertions" rule (Principle 4) is a fig leaf: the agent that *wrote* the Gherkin is the same agent that will write the `.spec.ts`, executed in the same session by the same model.
**Analogous failure:** Every team that has shipped Copilot/Cursor with "write tests for this" gets a flood of `expect(result).toBeDefined()` and `expect(spy).toHaveBeenCalled()`. GitHub's own data on auto-generated tests shows high pass rate, low mutation-kill rate. The "AI-generated tautology test" is the 2025-era equivalent of the snapshot-as-test anti-pattern.
**Why this proposal repeats it:** No assertion quality bar. No mutation testing. No "test must name the bug it prevents" linter (even though Principle 1 says it). Volume incentives (coverage policy: "every composable" / "every API client") will mostly be met with low-value tests because that's the cheapest path for an agent.
**Alternative:** (a) Add mutation testing (Stryker) on critical modules as the *real* coverage metric. (b) Require every PR's test addition to cite a Linear bug ID or design risk. (c) Use the agent to *propose* tests, not author them, until a track record exists. (d) Measure escaped-defect rate per quarter; if it doesn't move, the test growth is theatre.
**Confidence:** High
**Falsification test:** Take the last 30 agent-written test files in the repo. Mutate one production function each. Count how many tests fail. If <70%, the tests are decorative.

### F4 — [P1] [PLAN_RISK] — Four ADRs and six skills is process before practice
**Challenge:** The proposal lands 4 ADRs (013 superseded, 020/021/022 new) and 6 workflow files (`code-test-unit`, `code-test-integration`, `code-test-e2e`, `sdd-bdd`, `test-regression`, `test-triage`) for a team that has not yet completed *one* module end-to-end in the new style. ADR 021 even calls this out ("pilot the full vertical on ONE module") but only at Step 5 — after the ADRs and skills exist.
**Analogous failure:** Process-first adoption is a known anti-pattern in agile/devops literature. The teams that succeed with new testing strategies almost always do the work first, then codify; the teams that fail write the doctrine first and discover it doesn't fit.
**Why this proposal repeats it:** ADR-driven culture incentivises writing the ADR before doing the work. The result is a clean tree of policy with no operational evidence under it.
**Alternative:** Land **one** doc (`TESTING.md`) with principles only. Do the pilot. Write the workflow files *from the pilot's actual friction*, not from imagined friction. Promote to ADR status only the rules the pilot proved load-bearing.
**Confidence:** High
**Falsification test:** Ask: which line in ADR 021 was rewritten because of pilot evidence? If the answer is "none, it was written first," the ADR is theory.

### F5 — [P1] — "Real staging API for integration tests" is a flake factory
**Challenge:** ADR 021 commits to real staging API for both integration and e2e CI. This is defensible (it catches contract drift) but it makes the "zero flake tolerance" rule incompatible with reality. Staging APIs *will* hiccup. The single retry papers over this. The quarantine deadline (30 days → delete) will then delete tests that were failing because staging was down, not because the test was bad.
**Analogous failure:** Every team that has tried "real environment in CI" ends up either (a) loosening flake policy, (b) building a sandbox eventually anyway, or (c) deleting their most valuable contract tests because they're "flaky." The "test the contract, not the deploy" school (Pact, contract testing) exists precisely to escape this.
**Why this proposal repeats it:** It commits to both real-staging and zero-flake without acknowledging the tension. The "single retry" is described as "absorbs hiccups, not flake tolerance" — a distinction with no enforceable difference.
**Alternative:** Adopt **consumer-driven contract testing** (Pact) for the integration layer. Unit + contract + e2e is a more honest split than unit + integration-against-real-staging + e2e. Or accept the trade-off and define "staging unavailability" as a separate failure class with separate handling.
**Confidence:** Medium
**Falsification test:** Look at the last 10 CI failures classified as "flake." How many were the test's fault vs the environment's fault? If >40% were environmental, the policy is misaligned.

### F6 — [P1] — ADR 022 ships as "Proposed" while ADR 021 depends on its row existing
**Challenge:** ADR 021 includes a "Component / Visual / a11y" row in its pyramid table but defers all detail to ADR 022, which is **Proposed, not Accepted**, with six open questions including "what is wired today" and "vitest workspace compatibility." This is forward-referencing a hypothesis as a foundation.
**Analogous failure:** ADRs that depend on un-accepted ADRs are how policy stacks become wobbly. The dependency direction should reverse: accept the concrete thing, then layer the abstract framework over it.
**Why this proposal repeats it:** ADR 021 wants to look complete (four layers, full pyramid) so it includes a row that doesn't yet exist.
**Alternative:** Remove the Component/Visual/a11y row from ADR 021 entirely. Let ADR 022 land it independently when it's actually accepted. ADR 021 is stronger if it commits to the three layers that have working pilots.
**Confidence:** High
**Falsification test:** Read ADR 021 with the fourth row deleted. Does anything else in it break? (No.)

### F7 — [P2] — `sdd-bdd` invents an SDD step that didn't need to exist
**Challenge:** Adding `sdd-bdd` between `sdd-design` and `sdd-tasks` adds a fourth step to a planning flow whose value is its compactness. Gherkin-from-design can be a *part* of `sdd-tasks` or `sdd-requirements` — there is no architectural reason it needs its own skill except that the proposal is committed to Gherkin as a first-class artefact (see F2).
**Analogous failure:** Skill proliferation in agentic systems mirrors microservice proliferation: every new "step" is internally justifiable, the cumulative cognitive cost is invisible until a new contributor tries to learn the graph.
**Why this proposal repeats it:** The author explicitly rejects an umbrella `/test` skill (Alternative C in ADR 021) on the grounds that "granular primitives compose." But the inverse — that granular primitives proliferate — is not addressed.
**Alternative:** Fold Gherkin authoring (if retained at all) into `sdd-requirements`. Acceptance criteria *are* Given/When/Then. The "BDD step" is invented work.
**Confidence:** Medium
**Falsification test:** Try writing one spec without `sdd-bdd`, merging its outputs into `sdd-requirements`. If the result is shorter and clearer, the step is overhead.

### F8 — [P2] — "No dedicated tester role going forward" is an unexamined consequence, not a feature
**Challenge:** The ownership table notes "no dedicated tester role going forward" as policy. ADR 021 then assigns Dom the entire e2e suite + framework + reviewer-of-coverage role. This is a single point of failure recreated under a different name. It also burdens PR reviewers (acknowledged as "discipline burden") without a structural mitigation.
**Analogous failure:** Every "everyone owns quality" rollout ends up with quality owned by whoever cares most, which is usually one person, until they burn out or leave. The previous tester left; the proposal's response is to distribute his job to everyone — i.e. effectively to Dom.
**Why this proposal repeats it:** It treats the org change as fixed and engineers around it. It might be the right trade-off, but it is not interrogated.
**Alternative:** Name the failure mode explicitly: if PR reviewers don't enforce layer-appropriate coverage within N weeks, the policy is dead. Build a check (lightweight: a CI annotation that flags PRs touching `headless/` without a test diff) instead of relying on human discipline.
**Confidence:** Medium
**Falsification test:** Six months in, count PRs that merged with no test diff in headless. If >20%, the structural fix didn't take.

### F9 — [P2] — "Categorical coverage, not percentage" is right in principle, untenable in agentic enforcement
**Challenge:** "Every composable has unit tests covering reactive state, methods, scope resolution, derived values" is a *checklist*, not a metric. Agents will pattern-match to it and produce tests that tick each box trivially. Percentage coverage is theatre, agreed — but a categorical policy enforced by a model is *worse* theatre, because it looks rigorous.
**Analogous failure:** "Definition of Done" inflation in scrum teams. Every box gets ticked; nothing improves.
**Why this proposal repeats it:** The policy assumes a thinking reviewer enforcing categorical rules. In an agentic flow where the agent both writes and self-reports, the categories collapse into checkboxes.
**Alternative:** Pair the categorical rule with a quality signal: mutation score on critical modules, or a periodic audit of last-month's tests to spot tautologies.
**Confidence:** Medium
**Falsification test:** Audit 10 randomly chosen agent-written unit tests. Count how many would survive mutation of the function they test. If <70%, categorical coverage is being ticked, not earned.

### F10 — [P3] — "Stories as the contract" (ADR 022) re-imports the Gherkin assumption at the UI layer
**Challenge:** ADR 022's "stories are the contract — docs, manual reference, component test, a11y test, one artefact" is the same one-artefact-many-jobs claim as Gherkin. It will have the same failure mode: stories optimised for one job (usually visual docs) decay as test contracts.
**Analogous failure:** Storybook-as-test in many teams becomes Storybook-as-docs-only because the test pressure is weaker than the design pressure. The `play()` function is the part that rots.
**Why this proposal repeats it:** Same "one artefact wins" mental model. Aesthetically clean, operationally optimistic.
**Alternative:** Decouple. Stories for docs/manual ref. Component tests in `*.test.ts` alongside. Yes, two files. The decoupling is the insurance.
**Confidence:** Low (Storybook stack is genuinely better than Gherkin's for this use; the analogy is partial.)
**Falsification test:** Six months in, count stories with a `play()` function vs without. If <50% have one, the contract isn't holding.

## What Would You Delete?

1. **ADR 020 (Gherkin).** Until a product reviewer commits to reading `.feature` files, this is overhead. Replace with sentence-shaped `test()` names.
2. **`sdd-bdd` skill.** Inventory of one. Fold into `sdd-requirements`.
3. **ADR 022 in its current form.** Re-publish later as a single page once the UI package split is real and the pilot has run. The six open questions make it unmergable as guidance.
4. **`code-test-integration` as a separate skill.** Merge with `code-test-unit` into a single `code-test` skill that picks layer based on file location. Two skills, not three.
5. **The "Component / Visual / a11y" row of ADR 021's pyramid.** Forward-references unaccepted policy.
6. **The "no dedicated tester" line in the ownership table.** Replace with an honest statement: "until the structural enforcement is proven, this is a known risk."

That cuts ~40% of the apparatus while losing none of the load-bearing claims (no shadow implementations; mock settings not data; quarantine deadline; tied to `@next` migration).

## Verdict

A handsome proposal that mistakes process for practice — adopt half of it, pilot before generalising, and delete Gherkin until product actually reads it.
