# ADR 022: UI Testing Strategy (Storybook, Component Tests & Accessibility)

**Date:** May 2026
**Status:** Proposed
**Authors:** Dominic da Costa
**Related:**

- [ADR 021: Testing Pyramid & Agentic Workflow](./021-testing-pyramid-and-agentic-workflow.md) — parent ADR; this extends its "Component / Visual / a11y" row.
- [ADR 020: Gherkin Test Planning](./020-gherkin-test-planning.md) — the contract-as-artefact pattern this ADR mirrors for the UI layer.
- [ADR 007: Headless Architecture](./007-headless-architecture.md) — the module boundary that keeps UI tests focused on UI.
- [ADR 011: Composable Coding Standards](./011-composable-coding-standards.md) — the composable shape that backs UI organisms.
- [ADR 012: Multi-Theme Architecture](./012-multi-theme-architecture.md) — the theming surface every story must render under.
- [ADR 003: Shared Icons Package](./003-shared-icons-package.md) — precedent for the per-domain UI package split.

---

## Context

ADR 021 set the testing pyramid and deferred the "Component / Visual / a11y" row to a follow-up ADR. This is that ADR. It does not relitigate ADR 021's principles — it extends one row.

Four forces shape the proposal:

1. **The deferred row is overdue.** ADR 021 ships with an unowned layer. Component coverage, accessibility coverage, and visual regression each sit between the unit layer (logic) and the e2e layer (journeys) with no policy.
2. **Current state is patchy.** Storybook coverage is limited and uneven. Visual regression runs via Playwright screenshots (per the superseded ADR 013). Accessibility is not tested. Component testing is informal where it exists at all.
3. **A UI lib package split is being planned independently.** The direction — splitting today's monolithic UI lib into smaller per-domain packages (e.g. `ui-cart`, `ui-checkout`) consumed dynamically by apps — is strategic and underway as a separate decision. A UI testing strategy that assumes the monolith will not survive that split. This ADR assumes the split happens.
4. **The author has prior experience with a proven stack.** A Storybook + Vitest + axe stack used on a previous repo produced fast component feedback and zero-cost a11y coverage. That experience is the seed for this proposal — captured now so the direction is documented before tooling work begins.

This ADR is published as **Proposed**, not Accepted. The author plans to refine it closer to actioning. Several decisions (visual regression tool, exact package boundaries, skill scope) are explicitly open.

---

## Proposed decision

Adopt a **three-pronged UI testing stack**, with stories as the canonical artefact, organised per-package, fed into a meta-Storybook explorer.

| Concern | Tool | Trigger |
| --- | --- | --- |
| **Component testing** (renders + interactions) | Vitest + `@storybook/addon-vitest` — runs each story's `play()` in headless Chromium | Every PR push |
| **Accessibility testing** | `@storybook/test-runner` + `axe-playwright` | Every PR push |
| **Visual regression** | TBD — see Open Questions | TBD |

And: split the UI lib into smaller per-domain packages, each owning its own stories. A meta-Storybook app (`apps/storybook/`) consumes stories from all packages as the unified explorer and test surface.

The package split is a separate strategic decision. This ADR aligns the testing strategy to that direction; it does not commit to specific package boundaries.

---

## Architectural principle (proposed) — stories as the contract

Every UI organism has at least one story. Stories serve four jobs at once:

1. **Documentation** — the canonical example of what the organism looks like and how it behaves.
2. **Manual reference** — what designers, PMs, and engineers open when they need to see a component in isolation.
3. **Component test** — the story's `play()` function asserts render and interaction behaviour.
4. **Accessibility test** — axe scans the rendered story for WCAG violations.

**Stories are the canonical UI test artefact.** No separate component spec files. This is the UI equivalent of "Gherkin is the e2e contract" from ADR 020 — one artefact, multiple jobs, one place to review.

---

## Per-package Storybook architecture (proposed)

Each domain UI package owns its stories beside the source:

```
packages/ui-cart/src/**/*.stories.ts
packages/ui-checkout/src/**/*.stories.ts
```

`apps/storybook/` is the meta-Storybook: it glob-imports stories from every UI package and presents them as a single explorer.

| Surface | Runs |
| --- | --- |
| Per-package CI | Only that package's component + a11y tests. Fast feedback for the package owner. |
| Meta-Storybook CI | Full suite across all packages. Catches cross-package regressions and orchestration drift. |

This mirrors the per-package boundary that ADR 003 established for shared icons and that the upcoming UI lib split will generalise.

---

## What component tests ARE for

| Concern | Example |
| --- | --- |
| Renders without throwing | Story mounts with default args |
| Props produce expected DOM | `<Badge variant="success">` renders the success state |
| Interactions fire expected behaviour | `play()` clicks the close button; modal calls `onClose` |
| Conditional render branches | Empty state vs populated state vs error state |
| Component-level edge cases | Long text truncation, missing optional props, RTL rendering |

---

## What component tests are NOT for

| Out of scope | Belongs at |
| --- | --- |
| Business logic without UI | Unit layer (ADR 021) |
| API contracts and response shapes | Integration layer (ADR 021) |
| Full user journeys | E2E layer (ADR 020 / 021) |
| Pixel-level visual diffs | Visual regression (see below) |
| Type checking | TypeScript / `tsc` |

A test that needs a mocked API, a router, or a multi-page flow is not a component test. Push it down (unit) or up (integration / e2e).

---

## What accessibility tests cover

axe-detected, automatable concerns. Not a replacement for manual a11y review.

| Covered | Not covered |
| --- | --- |
| WCAG violations axe can detect (contrast, missing labels, role misuse) | Keyboard-only journeys across multiple pages |
| Tab order and focus, where addressable inside a story's `play()` | Screen-reader narrative quality |
| ARIA attribute correctness on rendered DOM | Cognitive load and content clarity |

Manual a11y review remains required for shipped flows. Automated a11y is the floor, not the ceiling.

---

## Visual regression — explicitly open

The current visual regression layer is Playwright screenshots, carried over from the superseded ADR 013. It is not load-bearing for this ADR.

| Option | Notes |
| --- | --- |
| Keep Playwright snapshots | Already wired; couples visual coverage to e2e cadence; not story-aligned. |
| Adopt Chromatic | Story-aligned; managed service; pricing model needs assessment. |
| Adopt Percy | Story-aligned; managed service; alternative to Chromatic. |

**Recommendation: decide later.** Visual regression tooling is a separate decision once the UI package split is closer and the meta-Storybook is wired. Until then:

- Keep existing Playwright visual tests running as today.
- Do not add new Playwright visual tests unless they cover a regression risk that stories + component tests + a11y will not catch.

---

## Proposed coverage policy

Mirroring ADR 021's categorical style — no percentage-of-lines theatre.

| Code surface | Required coverage |
| --- | --- |
| Every shipped UI organism | At least one story |
| Every story with interactive behaviour | A `play()` function asserting that behaviour |
| Every story | An axe a11y scan in CI by default |
| Every UI organism released to a consumer package | Stories + a11y passing |
| Visual regression coverage | Opt-in per organism, until the visual tool is chosen |

**A UI organism is not released to a consumer package until its stories and a11y pass.** This is the load-bearing rule, and it is the UI equivalent of ADR 021's "not migrated to `@next` until layer-appropriate tests exist."

---

## Proposed CI strategy

| Suite | When it runs | Target |
| --- | --- | --- |
| Component (Vitest + addon-vitest) | Every PR push | < 3 min |
| A11y (test-runner + axe) | Every PR push | < 5 min |
| Visual regression | TBD per Open Questions | TBD |

Targets are aspirational on proposal; tune after the pilot (Step 4 below).

---

## The agentic constraint

ADR 021's third core principle applies here without modification: **the agent that writes the component must not author its own assertions.** Stories — including `play()` — are the contract. They either:

- Exist before implementation (produced in plan, per the SDD flow), or
- Come from a separate skill invocation distinct from the one that wrote the component.

Self-validation is tautology. A component "passing its own play()" written in the same turn is not coverage; it is the agent grading its own homework.

---

## Naming conventions

Continuing the `code-test-*` skill family from ADR 021:

| Skill | Owns |
| --- | --- |
| `code-test-unit` | Unit tests (existing) |
| `code-test-integration` | Integration tests (existing) |
| `code-test-e2e` | Playwright `.spec.ts` from Gherkin (existing) |
| **`code-test-component`** (future) | Stories + `play()` + a11y wiring |

`code-test-component` is a follow-up, **out of scope for this ADR's initial rollout**. It is named here so the skill graph stays predictable when it lands.

---

## Interim posture

While the package-split decision is pending, pilot the proposed Storybook + addon-vitest + axe stack against the **existing `playgrounds/storybook/`** (or whatever single Storybook host exists today) for ONE organism. This decouples the stack proof from the architecture decision. If the package split lands later, the pilot pattern carries forward unchanged. The two-runner pattern (addon-vitest for component, test-runner + axe-playwright for a11y) is verified against Dom's prior-repo `test-runner.ts` config which has both an active `preVisit` (injecting axe) and `postVisit` (running checkA11y) — the automatic-walk benefit is doing real work, so the two-runner pattern is justified.

---

## Implementation sequencing (proposed)

| Step | Action |
| --- | --- |
| 1 | Land this ADR as **Proposed**. |
| 2 | Audit existing `apps/storybook/` (if it exists) and `package.json` scripts. Confirm what is wired today vs assumed. |
| 3 | Stand up `@storybook/addon-vitest` and `@storybook/test-runner` + `axe-playwright` in a single package. |
| 4 | Pilot the pattern on ONE organism (e.g. `basket-summary`). Stories + `play()` + a11y, all wired and passing in CI. |
| 5 | Document the playbook (`.agent/workflows/component-testing-playbook.md` or similar). |
| 6 | Roll forward organism-by-organism, paired with the UI lib package split. |
| 7 | Decide visual regression tooling in a separate ADR once the package split is close. |
| 8 | Promote this ADR from **Proposed → Accepted** once Steps 2–4 confirm the approach. |

Step 6 is the load-bearing logistical choice, and it mirrors ADR 021's Step 7: testing migration rides on a programme already underway (the package split), not as a parallel initiative competing for attention.

---

## Alternatives considered

### A. Stick with Playwright-snapshot-only visual regression

Rejected (proposed). No component coverage, no a11y coverage, and the model does not scale to a per-package architecture. Snapshot diffs at the e2e layer also catch regressions late and noisily.

### B. Custom component test framework

Rejected (proposed). Reinvents Storybook + addon-vitest with no upside. The same `play()` pattern is available off the shelf.

### C. Cypress component testing

Rejected (proposed). Adds a runner not used elsewhere in the monorepo. Vitest is already wired for unit and integration; using it for component too keeps the runner count down.

### D. One monolithic Storybook + monolithic UI lib (no package split)

Rejected (proposed). Couples release cadence across unrelated domains, blocks consumer apps from importing only the UI they need, and forces every consumer to take every change. The package split is independently strategic; this ADR aligns with it rather than fighting it.

---

## Consequences (if adopted)

### Positive

1. **Component coverage at story-time.** No separate spec files; the story is the test.
2. **Accessibility is not bolted on.** Every story runs axe by default.
3. **Per-package release cadence.** Each UI package ships when its own tests pass, independently.
4. **Single source of truth.** Docs, manual reference, component test, a11y test — one artefact.
5. **Aligned with the agentic pipeline.** `code-test-component` slots into the existing skill family without restructuring it.

### Negative

1. **Tooling sprawl.** Vitest config + test-runner config + (eventually) a visual tool. Three configurations, three failure modes.
2. **Per-package Storybook orchestration plumbing.** The meta-Storybook glob-import has to work; story IDs have to stay unique; theming has to resolve across packages.
3. **Team must learn `play()` patterns.** Storybook interactions are not Playwright; the API and idioms differ.

### Neutral

1. **Existing visual regression untouched until the separate decision.** No coverage lost; no coverage gained either.
2. **No ADR 021 changes required other than linking this one.** The pyramid is unchanged.

---

## Open questions

Central to the **Proposed** status. These resolve before promotion to **Accepted**.

> **Verified:** prior-repo `test-runner.ts` has active preVisit+postVisit running axe across all stories — two-runner pattern justified by automatic-walk benefit.

1. **Visual regression tool.** Chromatic vs Percy vs Playwright snapshots vs other. Separate decision, separate ADR.
2. **What is wired today.** Whether `apps/storybook/` already exists, what scripts are in `package.json`, and what the existing coverage looks like. Audit on landing (Step 2).
3. **Exact UI package boundaries.** Independent strategic decision underway elsewhere. This ADR assumes the split happens; the lines on the map are not this ADR's call.
4. **Skill scope and timing.** Whether `code-test-component` enters the SDD flow in the initial rollout or after the pilot proves the pattern.
5. **Vitest workspace compatibility.** Confirm a Storybook project can sit alongside the existing unit and integration Vitest projects without configuration conflicts.
6. **Theming compatibility.** Confirm the `play()` pattern works under the multi-theme architecture (ADR 012) — stories must render and assert under every theme that ships.

---

## Promotion criteria

Mirroring ADR 020's escalation gate. This ADR's status promotes from **Proposed → Accepted** when **all three** hold:

| Condition | What it proves |
| --- | --- |
| The pilot organism (Step 4) ships with stories + `play()` + a11y passing in CI | The stack works end-to-end on real code |
| At least one open question is resolved or formally deferred (ideally the visual regression decision) | The proposal has converged on a real shape |
| A UI lib package-split ADR has been **Accepted**, with package boundaries explicitly named | The architecture this ADR depends on is no longer hypothetical |

If any condition stalls, the ADR stays Proposed. Tighten, retry, or revert — no sunk-cost promotion.

---

## Amendments

Append-only. The Proposed decision, the three-pronged stack, and the "visual regression tool is explicitly open" position above are **unchanged**. This amendment sets the discipline for the *interim* Playwright visual-regression suite that §"Visual regression — explicitly open" says to "keep running as today" — until a story-aligned tool (Chromatic/Percy) is chosen.

### Amendment 1 — Interim Playwright vis-reg: shared-helpers-only (FE-2839, July 2026)

**Context.** The 2026-06-12 chrome regression run failed 324/853 (+69 flaky), and 5 of 7 failure clusters were **drift**, not real UI regressions: visual-regression specs had hand-rolled their own navigation, locators, and mocks that diverged from the shared `support/flows` / page objects the *functional* e2e specs already used correctly. Confirmed clusters: a serial-only login helper run under `fullyParallel`; a locator targeting a component that had been replaced; an error mock pointed at the wrong endpoint; staging-data dependence via non-retrying URL asserts; a stale testid; and a locale-derived `kebabCase(label)` testid that broke non-English login. Full triage: [`docs/testing/regression-findings-2026-06-12.md`](../testing/regression-findings-2026-06-12.md).

**Rule.** A Playwright visual-regression spec MUST NOT contain journey logic that already exists in [`tests/Playwright/e2e/support/flows`](../../tests/Playwright/e2e/support/flows/) or a page object. Each vis-reg spec reduces to: **shared journey/setup → gate on a stable, non-translated testid → freeze animations → `toHaveScreenshot`**. Setup goes through the same flows/page objects/fixtures the functional suite drives (`goToCheckout`, `addProductViaHeadless`, `loginViaHeadless`, the `Checkout`/`ProductConfig`/`Dac`/… page objects, the `newUser`/`checkout` fixtures). If a page object lacks a step, add it to the page object and consume it — never inline the sequence in the spec. Settings/flag mocks stay allowed (P4); journey data does not (ADR 021 §"Mock settings, not data" and §"shadow implementations").

**Enforcement.** Pseudo-Nathan review-checklist item (`tests/Playwright/docs/12-pseudo-nathan.md`), documented alongside the working conventions in `tests/Playwright/docs/06-visual-regression.md`. This does not change the "keep Playwright snapshots for now, decide the tool later" posture — it stops the interim suite drifting from the functional specs in the meantime. When the visual tool decision lands (Open Question 1), this amendment retires with the Playwright snapshot suite.

---

## Related Documents

- [ADR 021: Testing Pyramid & Agentic Workflow](./021-testing-pyramid-and-agentic-workflow.md) — parent ADR.
- [ADR 020: Gherkin Test Planning](./020-gherkin-test-planning.md) — the contract-as-artefact pattern.
- [ADR 007: Headless Architecture](./007-headless-architecture.md) — the headless boundary that keeps UI tests UI-only.
- [ADR 011: Composable Coding Standards](./011-composable-coding-standards.md) — composable shape behind UI organisms.
- [ADR 012: Multi-Theme Architecture](./012-multi-theme-architecture.md) — theming surface every story must respect.
- [ADR 003: Shared Icons Package](./003-shared-icons-package.md) — per-package precedent.
- [`.agent/rules/code-tests.md`](../../.agent/rules/code-tests.md) — workspace test rules.
