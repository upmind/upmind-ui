---
paths:
  - '**/e2e/**/*.spec.ts'
  - '**/e2e/**/support/**/*.ts'
  - '**/*.feature'
---
> Companion to `code-tests-e2e.md` — Upmind-monorepo bindings.

## Governing ADRs (the policy that wins over the base rule)

- **ADR-020** — Gherkin test planning: `.feature` files are spec-only and declarative, authored before the `.spec.ts`. No `@cucumber/cucumber`; features stay non-executable.
- **ADR-021** — Testing Trophy: most coverage at unit/integration; the P1 runtime ceiling is a hard CI ceiling; two flakes → quarantine, 30 days → delete.
- **ADR-022** — UI testing: stories are the canonical UI-test artefact; no new visual coverage until the tool decision lands.

Paths: `docs/adr/020-gherkin-test-planning.md`, `docs/adr/021-testing-pyramid-and-agentic-workflow.md`, `docs/adr/022-ui-testing-strategy.md`.

## Field guide and paths

- Field guide with per-principle anchors `#p1`…`#p9`: `tests/Playwright/docs/12-pseudo-nathan.md`.
- Support tree: `tests/Playwright/e2e/support/`. Specs: `tests/Playwright/e2e/e2e-tests/**`. Features: `tests/Playwright/features/**`.
- Failure screenshots: `test-output/test-results/**/test-failed-1.png`.

## Real modules

"The app's real modules" are the `headless` and `client-vue` packages. API-driven setup is legitimate only when it drives them; hand-rolled HTTP that replicates their logic is the shadow implementation.

## Test-id contract (`data-test-key` / `data-test-value` / `dataAttrs`) — the one home

- The explicit test-id attribute is `data-test-key`, never generic `data-testid`.
- Every explicit test id is exposed through the component's `dataAttrs` prop (`Record<\`data-${string}\`, string | number | boolean>`), v-bound onto the rendered element. Add a `dataAttrs` passthrough to a primitive that lacks one rather than wrappers or slots.
- One value read → one `data-test-value`.
- Two object `v-bind`s on one element crash `vite-plugin-vue-inspector` and are invisible to `tsc` — banned.
- Dynamic test ids go through `kebabCase()` from `tests/Playwright/e2e/support/helpers/strings.ts`, composed from stable data only. Full standard: `.agent/audits/testid-standard.md`.

## Sanctioned test-mode divergence

`useTestAttrs` (FE-2865) is the single sanctioned PROD-path divergence, enforced by `ci/lint-scope-purity.mjs`.

## Canonical route-cleanup example

`tests/Playwright/e2e/e2e-tests/errors/error-handling.spec.ts:22-25`.
