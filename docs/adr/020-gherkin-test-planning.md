# ADR 020: Gherkin as Test Planning Spec, with Escalation Path to `playwright-bdd`

**Date:** May 2026
**Status:** Accepted
**Authors:** Dominic da Costa
**Related:**

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

The well-known failure mode of Cucumber adoption is *imperative drift* — `.feature` files starting declarative ("apply a promo code") and decaying into UI scripts ("click the button with data-testid X"). Aslak Hellesøy (Cucumber's creator) has himself noted the tool is widely misused.

---

## Decision

Adopt **Gherkin as a planning/spec format**. Do **not** adopt the Cucumber runner. Set a defined escalation gate to upgrade to `playwright-bdd` if (and only if) the planning-layer adoption earns it.

### Decision details

1. **`.feature` files are the planning artefact between Linear AC and Playwright tests.** They describe behaviour in domain language and live under `tests/Playwright/features/<flow>/`, mirroring the per-flow grouping of `tests/Playwright/e2e/e2e-tests/`.
2. **`.feature` files are spec-only, not executable.** Playwright `.spec.ts` files remain the tests that actually run. The `.feature` file is co-located with the generated test as documentation.
3. **The product team are the primary reviewers** of `.feature` files, not just engineering. This sets the readability bar — any selector, URL, or UI mechanic in a `.feature` file is a defect.
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
