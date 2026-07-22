> Companion to the upmind-agent skill /code-test-integration — Upmind-monorepo-specific bindings/overrides.

## Modules under test

- Integration tests drive `packages/headless` modules (and `client-vue` where a UI-adjacent
  boundary is exercised) — never a shadow client.
- "The same composables/modules production uses" (base Conventions + Shadow-Implementation
  sections) binds to the real headless composables: **`useBasket`, `useAuth`, `useDomain`**.
  The base's neutral `useOrders` worked example maps to `useBasket` here.

## Commands (base "Where Integration Tests Run" + "Fixture-Recording")

- The project's `:live` integration command = **`pnpm test:integration:live`** (nightly +
  on-demand real-staging drift detection; never in PR CI).
- App-driven recorder = **`pnpm dev:record`** — writes the **v2** schema via
  **`recording-proxy.mjs`**.
- Fixtures-generator path = a **`*.fixtures.ts`** file run under the **fixtures vitest
  project** — writes the **v1** schema via **`ApiFixtureGenerator`**.

## Paths (base "Fixture-Recording" + MSW wiring)

- Canonical shared recordings pool = **`tests/fixtures/recordings/`**.
- Handler-builder module = **`src/__tests__/msw-handlers.ts`** (builds MSW handlers at
  module load from the recordings pool; exports `server`).
- Test-setup module = **`src/__tests__/setup.integration.ts`** (`beforeAll` starts the
  server, `afterEach` resets handlers).
- Mode selector env var = **`FIXTURE_MODE`** (`replay` default/CI, `record`, `live`).
- Fixture helpers = **`getFixtureBody` / `getFixture`**, imported from the fixtures index
  **`tests/fixtures/index`** (from a deep module test the relative import is
  `../../../../../../tests/fixtures/index`).
- Gherkin scenarios (base Hard Rules) live at **`tests/Playwright/features/<flow>/*.feature`**;
  the integration-layer tag is **`@layer-integration`**.

## Governance + reference (base "governing decision record" + reference-doc pointer)

- The governing decision record on test integrity referenced generically in the base is
  **ADR-021** (tautological-self-validation ban, mechanical-enforcement open item, and the
  test-writer ≠ code-writer agentic constraint all home there).
- Full MSW wiring reference + canonical worked example = **`packages/headless/docs/integration-testing.md`**;
  the **brand pilot** is the canonical example (fixture key `get-brand-settings`, route
  `*/api/brand/settings` — the base's neutral `get-widget` / `*/api/widget` example maps to it).
