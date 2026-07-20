# 🥒 `.feature` files — Gherkin specs (spec-only)

This directory holds **declarative Gherkin `.feature` files**: the planning
artefact that sits between a Linear story's acceptance criteria and the
Playwright `.spec.ts` test that actually runs.

They describe **what** a user is trying to achieve, in domain language a product
reviewer can read — never **how** the UI is driven. A `.feature` file is the
spec; the `.spec.ts` file is the implementation.

## Spec-only — not executable (yet)

Per [ADR 020: Gherkin as Test Planning Spec](../../docs/adr/020-gherkin-test-planning.md)
we are in **Phase B**: `.feature` files are **spec-only**. There is no
`playwright-bdd` runtime and `.feature` files are never executed. The matching
`.spec.ts` under `tests/Playwright/e2e/e2e-tests/<flow>/` is the executable test.

Whether we ever make `.feature` files executable is gated on an **escalation
review after ~10 stories** have shipped through this flow. Promotion to the
executable runtime (`playwright-bdd`) happens only if all three gate conditions
hold: product reviewers actually comment on `.feature` files, the files stay
declarative, and the generated specs stay faithful to their spec. See the
[Escalation gate in ADR 020](../../docs/adr/020-gherkin-test-planning.md#escalation-gate--when-wed-consider-option-a-full-playwright-bdd-adoption).
Until that gate is met, treat everything here as documentation the team reviews.

## The one rule: declarative, never imperative

**A `.feature` file describes behaviour in domain language. It never describes
mechanics.** The moment a scenario mentions a selector, a URL, or a
click/type/fill/press, it has stopped being a spec and become a UI script in
English clothing — "imperative drift", the single largest failure mode of
Gherkin adoption.

The full, load-bearing convention is
[`./10-feature-style.md`](./10-feature-style.md). Read it before
authoring. The canonical good/bad pair and the PR review checklist live there.

See [`_example/apply-promo-code.feature`](./_example/apply-promo-code.feature)
for the reference declarative style. It is documentation-only — no matching
spec, never run.

## Directory layout

Subdirectories mirror the per-flow grouping of
[`../Playwright/e2e/e2e-tests/`](../Playwright/e2e/e2e-tests/) — `basket/`, `checkout/`,
`login-registration/`, etc. — **per-flow, not per-component**. Empty flow
directories carry a `.gitkeep` placeholder; drop the first `.feature` for that
flow in and delete the placeholder. One `Feature:` per file, kebab-case file
name matching the feature (`apply-promo-code.feature`).

```
tests/features/
├── _example/                     ← reference style, documentation-only
│   └── apply-promo-code.feature
├── basket/
├── checkout/
│   └── guest-buys-paid-product.feature
├── login-registration/
│   └── two-factor-login.feature
└── …one dir per e2e-tests/ flow
```

> **Cross-module journeys are the exception.** Per
> [ADR 020 Amendment 1](../../docs/adr/020-gherkin-test-planning.md#amendments)
> and [ADR 025](../../docs/adr/025-colocated-journey-units.md), a cross-module
> journey's `.feature` lives **co-located in its journey folder** at
> `tests/<surface>/<flow>/<slug>/`, not here. This directory is for
> single-surface flow specs.

## Lint — imperative-drift guard

[`./lint-feature-files.sh`](./lint-feature-files.sh)
mechanically fails any `.feature` file that contains a selector, a URL, or an
imperative verb. It is a dumb, fast grep (no AST parsing) and runs in three
places: the `lint:features` CI job, the pre-commit hook (via `lint-staged`), and
on demand:

```sh
pnpm lint:features              # lint every .feature file
```

Banned patterns (matched on non-comment lines; Gherkin `#` comments are skipped):

| Category | Examples caught |
| --- | --- |
| Playwright / testid selectors | `getByTestId`, `data-testid`, `data-test-key` |
| CSS selectors | `#promo-input`, `.radio-card`, `[role="…"]` |
| Hard-coded URLs | `http://…`, `https://…`, `/order/…` |
| Imperative verbs (as imperatives) | `click`, `fill`, `press`, `type` |

The verb check encodes "as imperatives": `click`/`fill`/`press` match as whole
words (so `fulfill`, `WordPress`, `express` are safe), and `type` only trips in
verb position (so the domain noun "product type" is left alone).

## Further reading

- [ADR 020 — Gherkin as Test Planning Spec](../../docs/adr/020-gherkin-test-planning.md)
- [10 — Writing `.feature` Files (style guide)](./10-feature-style.md)
- [11 — Authoring Tests for a Story](../Playwright/docs/11-authoring-tests.md)
- [`/sdd-bdd`](../../docs/adr/020-gherkin-test-planning.md) — the skill that emits `.feature` files
- [`/code-test-e2e`](../Playwright/docs/00-index.md) — the skill that turns a `@layer-e2e` scenario into a `.spec.ts`
