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
- Fixtures-generator path = **`pnpm fixtures:generate <unit>`** (repo root) → runs the
  module-colocated **`<unit>.fixtures.ts`** under the fixtures vitest project
  (`vitest.fixtures.config.ts`), writing **v3, PII-masked** fixtures into the module's own
  `__tests__/fixtures/` and auto-running `lint:fixtures` (ADR 025 §A1.3 / FE-2937).
  (Supersedes the earlier v1/`ApiFixtureGenerator` note.)

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
- The e2e journey feature (base Hard Rules) lives at **`tests/features/<flow>/*.feature`**.
- **Module business-logic feature — bindings for the base *Anchor every test to the feature (TDD)* rule.** Feature location: co-located at **`packages/headless/src/modules/<name>/__tests__/<name>.feature`** or in the SDD dir (**`docs/sdd/<story>/*.feature`**). Scenario-id scheme: **`@AC-<cell><n>`** (the `design.md` §6 ids). Enforcement: the co-located **`<name>.traceability.test.ts`** (Vitest, rides the module suite). NOTE: the `/code-test-bdd` skill that authored this feature was retired in the skill-doors restructure with no direct replacement door — its home post-restructure is an open operator decision (see `sdd-bdd.companion.md`).

## Capture path (base "Step One — Record, Then Write")

The plugin law is cited, not restated: recording is step one, and fabricated fixture JSON is never a fallback. This repo's ONE capture chain — the seat runs it verbatim, no link re-derived:

1. **Generator**: colocated `<module>/__tests__/<unit>.fixtures.ts`, recording into the module's own `__tests__/fixtures/*.json` (v3, PII-masked — ADR 025 §A1.3).
2. **Command**: `pnpm fixtures:generate <unit>` (repo root; auto-runs `lint:fixtures`).
3. **Recording env**: `packages/headless/.env.recording` (`VITE_API_URL`, `RECORDING_BRAND_ORIGIN`).
4. **Credentials**: `tests/fixtures/credentials.ts` (`API_CREDENTIALS`, imported as `@upmind-automation/test-fixtures/credentials`).

A failure of ANY link (network, creds, env) **escalates with the failed command's verbatim output**; hand-authored fixture JSON is never a fallback, and a disclosed placeholder is still a violation (receipt: 2026-08-05 client-email — see `verify-cosplay.companion.md`).

## Governance + reference (base "governing decision record" + reference-doc pointer)

- The governing decision record on test integrity referenced generically in the base is
  **ADR-021** (tautological-self-validation ban, mechanical-enforcement open item, and the
  test-writer ≠ code-writer agentic constraint all home there).
- Full MSW wiring reference + canonical worked example = **`packages/headless/docs/integration-testing.md`**;
  the **brand pilot** is the canonical example (fixture key `get-brand-settings`, route
  `*/api/brand/settings` — the base's neutral `get-widget` / `*/api/widget` example maps to it).
