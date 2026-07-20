# 🎭 Playwright Testing Guide

## What this suite covers

Everything under `tests/Playwright/` tests the **Upmind Cart** app (`apps/cart` — the Vue SPA customers use to configure products, log in/register, manage the basket and check out). The suite has two kinds of tests:

- **End-to-end** (`tests/Playwright/e2e/e2e-tests/`) — behavioural tests that click through the app and hit the staging API.
- **Visual regression** (`tests/Playwright/e2e/visual-regression/`) — screenshot tests that capture the cart across all 28 supported locales.

There is also a small `tests/Playwright/specs/` directory used only as a seed area for Playwright's AI test-generator agents — see section 2.

**Gherkin specs:** [`tests/Playwright/features/`](../features/) holds declarative `.feature` files — the spec-only planning artefact between a Linear story's AC and the `.spec.ts` test. Per [ADR 020: Gherkin as Test Planning Spec](../../../docs/adr/020-gherkin-test-planning.md) (Phase B), they are never executed; the `.spec.ts` remains the test that runs. See [`features/README.md`](../features/README.md) and section 10 for the declarative convention, and `pnpm lint:features` for the imperative-drift guard.

**Co-located journey units:** [`tests/journeys/<surface>/<flow>/<slug>/`](../../journeys/) holds the cross-module journey units ([ADR 025](../../../docs/adr/025-colocated-journey-units.md)). Each slug folder is a self-contained, deletable unit: its `.feature`, its Playwright `.spec.ts` slices (globbed by this same suite), its **Vitest integration test** (`*.int.test.ts`, run via `pnpm test:journeys`, **not** Playwright), its alias map, its MSW replay wiring, and its own co-located `fixtures/`. The integration test drives the REAL headless machines (`useBasket` → settled `shopping`, `useProductCatalogue`, `useBasketCurrency`) through recorded fixtures via the shared **boot harness** ([`tests/journeys/support/basket-boot.ts`](../../journeys/support/basket-boot.ts), FE-2992) — the breadth of a journey lives at this integration layer, with the `.spec.ts` slices kept thin (ADR 025 §"e2e stays sliced"). The pilot template is [`storefront-guest-oneoff-checkout-stripe`](../../journeys/storefront/oneoff-checkout/storefront-guest-oneoff-checkout-stripe/); copy it (and reuse the boot harness) to add a new journey.

**Generating fixtures:** a unit's co-located `fixtures/` are never hand-written — they are real captures generated headlessly (ADR 025 §A1.3 / FE-2937) via `pnpm fixtures:generate <unit>`, which runs the unit's `<unit>.fixtures.ts` against real staging and auto-lints the output. Two flavours share that entrypoint: direct-API (`Generator`) and **headless Playwright** (a real chromium session driving a real staging flow while [`playwright-recorder.mjs`](../../fixtures/playwright-recorder.mjs) captures the browser's traffic through the real pipeline). See [`tests/fixtures/README.md`](../../fixtures/README.md#generating-fixtures-requires-staging-credentials) for the full recipe and PII rules.

## Key facts worth memorising

- **Playwright config:** [playwright.config.ts](../../playwright.config.ts) at the monorepo root (not inside `tests/Playwright/`).
- **Base URL:** `http://qa-automation.local:5173/` — resolves to the local Vite dev server that Playwright boots automatically via the `webServer` config.
- **API target:** `https://api.staging.upmind.io` — tests **hit real staging**, they are not sandboxed. Be mindful that API calls create and update actual records on staging, so you will need to think about this when designing tests unless you want to implement a local test env.
- **Browser projects:** `chrome`, `firefox`, `safari` - See [playwright.config.ts:72-108](../../playwright.config.ts#L72-L108).
- **Retries:** `1` by default. The single retry exists to absorb the occasional staging API hiccup — flaky tests should still be fixed at the root rather than masked by it.
- **Parallelism:** `fullyParallel: true` is the global default — Playwright parallelises across files AND within a single file. Tests that depend on a shared staging login (any user from `Logins`) must opt into serial mode; see [04 — A note on test isolation](04-writing-tests.md#a-note-on-test-isolation).
- **Viewport:** 1920×1080 everywhere, animations disabled via a launch arg (`--disable-animations`) and explicit CSS injection in visual regression tests.

## Quick orientation cheatsheet

When you just need to run the tests right now:

1. Make sure whatever staging env you are using to run the tests is in your hosts file (it should already be if you've worked on the cart app before or followed all the steps in the Setting up a local client section of the env setup doc (https://www.notion.so/upmind-app/Development-Development-environment-13e782386d4180e480c7f6f4a291c300)).
2. From the monorepo root: `pnpm install` then `pnpm exec playwright install` (first time only).
3. `pnpm test:chrome` runs all e2e tests in Chromium (variants for other browsers exist - check out `package.json`).
4. `pnpm test:ui` opens the Playwright UI runner for interactive debugging.
5. HTML report lands in `tests/Playwright/e2e/reports/html/` — open `index.html`.

## Sections

1. [Getting Started](01-getting-started.md) — one-time setup and first run.
2. [Project Structure & Conventions](02-project-structure.md) — directory layout, naming, spec anatomy.
3. [Running Tests](03-running-tests.md) — all the pnpm scripts, filtering, debugging, reports.
4. [Writing a New Test](04-writing-tests.md) — step-by-step, with all the patterns.
5. [Support Library Reference](05-support-library.md) — every file under `support/` explained.
6. [Visual Regression Testing](06-visual-regression.md) — screenshots, locales, and snapshot management.
7. [Special Test Setups & Gotchas](07-special-setups.md) — 2FA/OTP, PayPal sandbox, Stripe cards, session cookies, and other tribal knowledge.
8. [QA Handover — Nathan → Dom](08-qa-handover.md) — captured principles, mocking philosophy, AI-assisted generation flow, and open follow-ups from Nathan's pre-departure handover (2026-05-21).
9. [Cucumber/Gherkin Evaluation](09-cucumber-evaluation.md) — research artefact backing the decision on whether to adopt Gherkin as a planning/spec language for tests.
10. [Writing `.feature` Files — Style Guide](10-feature-style.md) — the declarative-style rules for Gherkin specs. The load-bearing convention behind our Option-B adoption. Specs live in [`../features/`](../features/) (see [ADR 020](../../../docs/adr/020-gherkin-test-planning.md)); `pnpm lint:features` enforces the style.
11. [Authoring Tests for a Story](11-authoring-tests.md) — end-to-end guide for devs: Linear AC → `.feature` spec → Playwright test → PR. The new workflow shape.
12. [Allure Dashboard](../../allure/docs/08-allure-dashboard.md) — shared test-results dashboard on GCS, trends, publishing local runs, comparing branches.
13. [pseudo-Nathan Field Guide](12-pseudo-nathan.md) — reverse-engineered field guide to Nathan's tacit knowledge of the suite: principles (P1–P8), conventions (C1–C20), anti-patterns, and ADR tensions. Cited by the pseudo-Nathan subagent and the `code-tests-e2e` rule.
14. [Schema-driven form filling](13-schema-driven-form-filling.md) — the `applySchemaDefaults` rail: how buying-journey tests configure a product's required options from its captured schema instead of hand-coded field knowledge, and when to hand-code instead.
15. [Flake-Quarantine Tooling](../../quarantine/docs/14-quarantine-tooling.md) — mechanical enforcement of [ADR 021's flakiness policy](../../../docs/adr/021-testing-pyramid-and-agentic-workflow.md#flakiness-policy): the `@quarantine` tag, the `lint:quarantine` PR gate, `test:quarantined --age`, the Allure flake-history query, and the 30-day-deadline CI cron. Backs the `/test-quarantine` skill.
16. [Behaviour-first URL assertions](15-url-assertions.md) — the [FE-2782](../../../docs/adr/021-testing-pyramid-and-agentic-workflow.md) convention: assert the behaviour a URL stood for, not the URL shape. The three categories (delete tautological post-`goto` checks; assert content after action-nav; document the unavoidable Category-3 cases) so a router rename never cascades across specs.
