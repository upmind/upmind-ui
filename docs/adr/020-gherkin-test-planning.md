# ADR 020: Gherkin as Test Planning Spec, with Escalation Path to `playwright-bdd`

**Date:** May 2026
**Status:** Accepted (Amended June 2026 — see [Amendments](#amendments))
**Authors:** Dominic da Costa
**Related:**

- [ADR 025: Co-located Cross-Module Journey Units](./025-colocated-journey-units.md) — moves the `.feature` for a cross-module journey into its journey folder (Amendment 1 below).
- [ADR 013: Testing Strategy](./013-testing-strategy.md) — extends the layered testing strategy with a planning artefact.
- [tests/Playwright/docs/08-qa-handover.md](../../tests/Playwright/docs/08-qa-handover.md) — captured QA principles (the *why* this is needed).
- [tests/Playwright/docs/09-cucumber-evaluation.md](../../tests/Playwright/docs/09-cucumber-evaluation.md) — research artefact backing this decision (short-lived).
- [tests/Playwright/docs/10-feature-style.md](../../tests/Playwright/docs/10-feature-style.md) — the declarative-style convention this ADR depends on.

---

## Context

The team's tester is leaving at the end of the week. The Playwright test suite he built is solid, but the *judgment* behind it — what to test, how to mock, slice-not-journey discipline — was tacit knowledge that walked out the door with him. That handover knowledge is now captured in [08-qa-handover.md](../../tests/Playwright/docs/08-qa-handover.md), but the practical problem remains:

1. **Test review is bottlenecked on engineering.** Dom (engineering lead, code-literate but not a tester) and the product team cannot meaningfully review Playwright test code. Test intent is invisible to anyone who can't read TypeScript and Playwright APIs.
2. **AC quality varies.** Linear stories sometimes ship Given/When/Then acceptance criteria, sometimes don't. There is no canonical intermediate artefact between AC and test code.
3. **AI-assisted test generation needs an intermediate representation.** The proposed `/qa-plan → /qa-test` flow (see [08-qa-handover.md](../../tests/Playwright/docs/08-qa-handover.md)) is more reliable when the agent works from a constrained, human-readable spec than from free-form prose AC.
4. **Cucumber-style BDD was proposed by the outgoing tester** as the bridge. A short research pass was run ([09-cucumber-evaluation.md](../../tests/Playwright/docs/09-cucumber-evaluation.md)) before committing.

The well-known failure mode of Cucumber adoption is *imperative drift* — `.feature` files starting declarative ("apply a promo code") and decaying into UI scripts ("click the button with data-test-key X"). Aslak Hellesøy (Cucumber's creator) has himself noted the tool is widely misused.

---

## Decision

Adopt **Gherkin as a planning/spec format**. Do **not** adopt the Cucumber runner. Set a defined escalation gate to upgrade to `playwright-bdd` if (and only if) the planning-layer adoption earns it.

### Decision details

1. **`.feature` files are the planning artefact between Linear AC and Playwright tests.** They describe behaviour in domain language and live under `tests/Playwright/features/<flow>/`, mirroring the per-flow grouping of `tests/Playwright/e2e/e2e-tests/`.
   > ⚠️ **SUPERSEDED by [Amendment 1](#amendments) (June 2026)** for cross-module journeys: the `.feature` lives co-located at `tests/<surface>/<flow>/<slug>/`, NOT under `tests/Playwright/features/<flow>/`. Single-surface legacy features stay put and migrate lazily. See [ADR 025](./025-colocated-journey-units.md).
2. **`.feature` files are spec-only, not executable.** Playwright `.spec.ts` files remain the tests that actually run. The `.feature` file is co-located with the generated test as documentation.
3. **The intended reviewers are product team members and engineering leads. Chris and Sara have been informally identified as product/UX review candidates; Dom (engineering lead) is also a primary reviewer.** Product engagement is **not a hard gate** — `.feature` reviews proceed without product comment when product isn't available, but the escalation gate (§Escalation gate, condition 1) measures whether product uptake materialises in practice over ~10 stories. If uptake is low, the workflow demotes or stays at phase B; if uptake is strong, ADR 020 promotes to phase A.
4. **Declarative-style convention is non-negotiable.** Codified in [10-feature-style.md](../../tests/Playwright/docs/10-feature-style.md). PR reviewers enforce it. Imperative drift is the single largest risk of this adoption.
5. **`playwright-bdd` is the predetermined upgrade path** — not `@cucumber/cucumber`. If we ever execute `.feature` files directly, we do so via `playwright-bdd` because it preserves Playwright's native runner, fixtures, trace viewer, parallel workers, and VS Code integration.
6. **No migration of existing tests.** Nathan's existing `.spec.ts` files stay as they are. Gherkin is for new coverage only.
7. **AI workflow updates** to `/qa-plan` and `/qa-test` are sequenced after the convention doc and dev guides land. `/qa-plan` will emit `.feature` files; `/qa-test` will consume them as input.

### Escalation gate — when we'd consider Option A (full `playwright-bdd` adoption)

Re-evaluate after approximately **10 stories** have shipped through the new flow. Promote to Option A only if **all three** conditions hold:

| Condition | What we're measuring |
| --- | --- |
| **Review uptake** | Are product-team reviewers actually leaving comments on `.feature` files in PRs? (Tracked via PR review-comment counts on `.feature` files vs. `.spec.ts` files.) |
| **Declarative discipline** | Are `.feature` files staying declarative? (Tracked via PR rejection rate against the [10-feature-style.md](../../tests/Playwright/docs/10-feature-style.md) checklist.) |
| **Spec→test fidelity** | Are generated `.spec.ts` files faithful to their `.feature` spec? (Tracked via diff audits — surprise behaviours hiding in the test that aren't in the spec are red flags.) |

If yes to all three: install `playwright-bdd`, retire the parallel `.spec.ts` files for new tests, let `.feature` files become executable.

If no to any: tighten the convention, retry, or revert to AC-only planning. No sunk cost in a runner that wasn't earning its keep.

---

## Alternatives considered

### A. Full adoption now (`playwright-bdd` + Gherkin + step library on day one)

Rejected for first iteration. Reasons:

- Imperative drift is the dominant failure mode; introducing the runtime layer before the convention has earned trust front-loads risk.
- Tooling-first / conventions-never is the textbook Cucumber failure.
- Reversing it would mean undoing a step-definition library, which is expensive.
- We can promote to A from B; we can't easily demote from A.

Held in reserve as the explicit escalation target.

### C. Don't adopt — continue with AC + Playwright only

Rejected. Reasons:

- Test review is *currently* bottlenecked on engineering; status quo means it remains so after Nathan leaves.
- The AI test-generation flow benefits materially from a constrained intermediate format. Free-form AC → test code is a noisier translation.
- Costs of adoption are small if we stop at B: one convention doc, light changes to `/qa-plan` and `/qa-test`, a PR-review habit. No new dependency.

### Other BDD frameworks (`@cucumber/cucumber`, behave, etc.)

Rejected. `@cucumber/cucumber` loses Playwright's native runner (parallelism, trace viewer, fixtures, UI mode, VS Code extension). Non-JS frameworks are non-starters in a TypeScript monorepo. `playwright-bdd` is the only sensible runtime path; everything else is a downgrade.

---

## Consequences

### Positive

1. **Product-team-readable test specs.** Closes the review-bottleneck created by Nathan's departure.
2. **Better Linear AC ↔ test alignment.** If AC ships in Given/When/Then, the `.feature` file is near-copy-paste. Pushes upstream pressure on AC quality.
3. **AI test-gen reliability.** Constrained, structured input (Gherkin) produces more reliable Playwright output than free-form prose.
4. **Reversible decision.** Spec-only Gherkin can be abandoned at any time with no runtime impact — the `.spec.ts` files keep running.
5. **Clear promotion criteria.** The escalation gate prevents the "we'll just keep going as-is forever" inertia that kills most reversible decisions.

### Negative

1. **Imperative drift risk.** Permanent vigilance required from PR reviewers. If discipline slips, the artefact becomes net negative (a slower way to write Playwright code).
2. **Two artefacts per behaviour** (during the spec-only phase). `.feature` + `.spec.ts`. Co-location and shared review mitigate, but it's still a maintenance pair.
3. **Step-definition library deferred.** Without runtime execution, we don't build the reusable step-definition library that pays Gherkin's biggest dividend. Promotion to A would unlock this.
4. **Convention enforcement is human.** No automated linter today. PR review is the only guard against drift.

### Neutral

1. **No CI/CD changes during phase B.** `.feature` files aren't executed, so test runtime is unchanged. CI integration is part of the Option-A promotion scope.
2. **Existing tests untouched.** No risk to current coverage; no benefit either.

---

## Implementation notes (sequencing)

This ADR's adoption work, in order:

1. ✅ Convention doc — [10-feature-style.md](../../tests/Playwright/docs/10-feature-style.md)
2. ⏳ Dev guides — authoring `.feature` files, reviewing them in PRs
3. ⏳ `/qa-plan` skill update — emit `.feature` files alongside the existing Linear plan comment
4. ⏳ `/qa-test` skill update — consume `.feature` files as input
5. ⏳ First Gherkin-flow story end-to-end as a proof of the workflow
6. 🕒 After ~10 stories — escalation review against the gate conditions above

---

## Related Documents

- [ADR 013: Testing Strategy](./013-testing-strategy.md) — the layered strategy this extends.
- [tests/Playwright/docs/08-qa-handover.md](../../tests/Playwright/docs/08-qa-handover.md) — the principles this decision serves.
- [tests/Playwright/docs/09-cucumber-evaluation.md](../../tests/Playwright/docs/09-cucumber-evaluation.md) — research artefact (short-lived; delete after dev guides land).
- [tests/Playwright/docs/10-feature-style.md](../../tests/Playwright/docs/10-feature-style.md) — the load-bearing convention.
- [playwright-bdd on GitHub](https://github.com/vitalets/playwright-bdd) — the predetermined Option-A runtime.
- [Cucumber docs — Writing better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/) — declarative-style canonical source.

---

## Amendments

Append-only. The Decision above is unchanged except where an amendment supersedes a specific clause; the inline `⚠️ SUPERSEDED` markers point here.

### Amendment 1 — `.feature` co-located in the journey folder; journeys live outside `headless` (June 2026)

> **Supersedes:** §Decision item 1, the clause «…live under `tests/Playwright/features/<flow>/`…» — **for cross-module journeys only**.
> **Reinforces:** §Decision item 2 (co-location was always the intent).
> **Home:** [ADR 025: Co-located Cross-Module Journey Units](./025-colocated-journey-units.md).

A cross-module journey is a **self-contained unit OUTSIDE the package-under-test**, at `tests/<surface>/<flow>/<slug>/`. Its `.feature` is **co-located** there alongside the `.int.test.ts`, the sliced `.spec.ts` files, `journey.ts`, `setup.ts`, and (Phase 2) `recordings/`. Surface ∈ {storefront, client-portal, admin}; slug is surface-first `<surface>-<who>-<product>-<action>[-<extras>][-<payment>]`; the Feature name **is** the slug. Deleting the folder has zero side effects.

This **sharpens where "co-located" resolves** (the journey folder, not a parallel `features/` mirror) — a clarification of item 2, not a reversal. `.feature` files remain **spec-only, not executable** (item 2 unchanged), and the declarative-style convention (item 4) is unchanged. Legacy single-surface `features/` files **stay put and migrate lazily** (consistent with §Decision item 6 "no migration"). Forward-compatible with a future `playwright-bdd` promotion: its `features` glob can point at the journey tree; the escalation gate is untouched.

### Amendment 2 — escalation-gate tracking source (June 2026)

> **Supersedes:** §Escalation gate, condition 1 parenthetical «Tracked via PR review-comment counts on `.feature` files…» — the *location* counts are gathered from.

Review-uptake counts are now gathered **per journey folder** `tests/<surface>/<flow>/<slug>/`, not per `tests/Playwright/features/<flow>/`. The three gate conditions and the ~10-story trigger are **UNCHANGED** (not reset). A generated `tests/JOURNEYS.md` index links every journey's `.feature` so discoverability for non-engineer reviewers is no worse than the flat tree — low uptake must be attributed to genuine disengagement, not folder depth, before failing the gate.

### Amendment 3 — single-surface `.feature` specs relocate to `tests/features/` (July 2026)

> **Supersedes:** §Decision item 1 and Amendment 1's «Single-surface legacy features stay put … under `tests/Playwright/features/<flow>/`» — the *staging* location for specs whose journey is not yet built.

The Playwright e2e suite is being deprecated and replaced piece-by-piece by the unit / integration / journey layers (ADR 021, ADR 025); the whole `tests/Playwright/` tree will be removed. `.feature` files are framework-agnostic planning specs, **not** Playwright artefacts, so they must not die with it. Single-surface `.feature` specs (those whose journey has not yet been built as a co-located unit) now live at **`tests/features/<flow>/`** — a neutral house alongside their linter (`lint-feature-files.sh`) and style guide (`10-feature-style.md`), no longer under the deprecating Playwright tree. The end state is **unchanged**: when a spec's journey is built, its `.feature` graduates into that journey's co-located folder (Amendment 1 / ADR 025). `tests/features/` is the staging home until then.

### Amendment 4 — `playwright-bdd` adopted for the factory-module BDD lane (July 2026)

> **Exercises:** §Decision item 5 — the predetermined `playwright-bdd` upgrade path — for one narrowly scoped lane, ahead of the Escalation gate's ~10-story review.
> **Home:** the FE-2976 review-notes (planning workspace; mirrored as a comment on Linear FE-2976), ruling 3.

`playwright-bdd` now runs `.feature` files natively for the composable-generation core's factory-module BDD lane: a module's `.feature` and its colocated `<module>.steps.ts` pair, executed through a shared `world` contract instead of a hand-written `.spec.ts`. This lane runs ahead of, and does not resolve, the Escalation gate's ~10-story review — that review is **untouched** and continues to govern the rest of the suite. Item 4's declarative-style convention is unchanged, and the existing co-location homes (Amendment 1's cross-module journey folder; Amendment 3's `tests/features/` staging home) are untouched: this lane adds a **third**, package-source-colocated home for single-module specs, living beside the module's own code rather than in either existing tree. `lint-feature-files.sh` keeps its semantics unchanged; only its default scan widens to include these package-colocated `.feature` files. The human `.feature` stays spec-only in intent — the executable surface is the paired `steps.ts`, which imports nothing engine-specific and speaks only through `world`.
