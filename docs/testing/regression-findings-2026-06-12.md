# Visual-regression triage findings — chrome run, 2026-06-12

**Date:** 2026-06-12
**Scope:** Playwright visual-regression suite (`tests/Playwright/e2e/visual-regression/`), `chrome` project.
**Run:** `pnpm visreg:chrome`.
**Result:** **324 / 853 failed, +69 flaky.**
**Verdict:** confirmed **drift**, not real UI regressions. **5 of 7 failure clusters** trace to visual-regression specs hand-rolling their own navigation, locators, and mocks that had diverged from the shared `support/flows` / page objects the *functional* e2e suite already drives correctly. The remaining 2 clusters are vis-reg-internal bugs (a worker-token cascade and a locale-derived testid) that the functional suite never sees because it drives the shared helpers.

This report is the evidence base for **FE-2839** (vis-reg suite: consume shared flows/page-objects — stop drift from functional specs) and is referenced from [ADR 022 Amendment 1](../adr/022-ui-testing-strategy.md#amendments), [`tests/Playwright/docs/06-visual-regression.md`](../../tests/Playwright/docs/06-visual-regression.md#shared-helpers-only--no-drift-from-the-functional-suite), and pseudo-Nathan principle P9 ([`tests/Playwright/docs/12-pseudo-nathan.md`](../../tests/Playwright/docs/12-pseudo-nathan.md)).

> **Note on location.** The FE-2839 issue body pointed at `tests/Playwright/e2e/reports/regression-findings-2026-06-12.md`, but that directory is git-ignored (it holds ephemeral Allure/HTML output). This permanent evidence doc lives under `docs/testing/` alongside the other dated findings reports (e.g. `auth-account-session-store-findings-2026-07-02.md`), and the three citing docs point here.

## Why "drift", not "regression"

A visual-regression spec should reduce to: **shared journey/setup → gate on a stable, non-translated testid → freeze animations → `toHaveScreenshot`**. When a vis-reg spec instead re-implements the journey (its own locators, its own mocks, its own auth), it acquires a second, unmaintained copy of behaviour that the functional suite keeps current. The functional specs stayed green through the same period because they drove `goToCheckout` / `addProductViaHeadless` / `loginViaHeadless` and the shared page objects; the vis-reg copies rotted independently. None of the 324 failures corresponded to an actual pixel regression in the app.

## Failure clusters

| # | Cluster | Fails | Flaky | Type |
| --- | --- | --- | --- | --- |
| 1 | Shared-account parallelism (`product-setup.spec.ts`) | ≈85 | 65 | drift |
| 2 | Dead error-mock since birth (wrong endpoint) | 24 | 4 | drift |
| 3 | Locator targets a removed component | 28 | — | drift |
| 4 | Staging-data dependence (non-retrying URL assert) | 28 | — | drift |
| 5 | Stale testid | 3 | — | drift |
| 6 | First-in-worker undefined token → 401 cascade | (bulk) | — | vis-reg-internal |
| 7 | Locale-derived button testid breaks French login | (locale) | — | vis-reg-internal |

Clusters 1–2 account for the entire +69 flaky total (65 + 4). Clusters 1–5 account for ~168 hard fails; clusters 6–7 account for the remaining bulk (a token cascade fails most of a worker's tests; the locale-testid bug fails the non-English login variants).

### Cluster 1 — shared-account parallelism (drift) · ≈85 fails, 65 flaky

- **Spec:** `visual-regression/product-setup.spec.ts`.
- **Symptom:** the spec logged in via the serial-only shared-account helper `loginAsIncompleteCustomer` while the suite runs under `fullyParallel`. Multiple workers mutated the *same* staging basket concurrently, so setup collided nondeterministically — the dominant source of both hard fails and flakes.
- **Shared-helper fix:** register a **fresh** client per test via the `newUser` fixture (drives the real auth composable, auto-logins) and mark the describe `mode: "parallel"`. No shared staging basket, no cross-worker collision. The error-state variant seeds via `seedInvalidProduct` and drives the `ProductSetup` / `ProductConfig` page objects + `fillRegistrantDetails` flow rather than hand-rolled steps.
- **Status:** RESOLVED (FE-2784 / FE-2865 re-homing; verified in the current spec header comment and `newUser.describe.configure({ mode: "parallel" })`).

### Cluster 2 — dead error-mock since birth (drift) · 24 fails, 4 flaky

- **Symptom:** the products-setup error state was forced with a `failApply` helper that intercepted the **wrong endpoint** — it never matched the request the app actually makes, so the error state never rendered and the snapshot captured the wrong surface. Broken since the spec was written.
- **Shared-helper fix:** force the error on the endpoint the functional suite uses — the order-root `PUT /api/orders/{id}` (regex `/\/api\/orders\/[a-f0-9-]+(\?|$)/`) via the shared `returnError` mock — matching `e2e-tests/products/product-setup.spec.ts`, so the alert deterministically shows instead of depending on staging organically rejecting the data.
- **Status:** RESOLVED (verified in `product-setup.spec.ts` — `ORDER_PUT` regex + `returnError`, comment lines documenting the endpoint parity).

### Cluster 3 — locator targets a removed component (drift) · 28 fails

- **Spec:** `visual-regression/product-config.spec.ts` ("Domain Drawer").
- **Symptom:** the spec drove `page.locator("#register")` + a `page.keyboard` sequence to reach the domain-registration drawer. That accordion/`accordion-item-register` markup had been replaced by `SmartDomainField`; the raw locator matched nothing, and a stale in-spec comment claimed the page object was "English-only".
- **Shared-helper fix:** drive the shared `ProductConfig` page object — `enterDomainRadio("register", …)` clicks the register radio by its stable `DomainTypes` value (`[role="radio"][value="register"]`) and fills `#domain-register-search`, both locale-independent, then submits via the same page-object input locator. This is the last hand-rolled journey closed by FE-2839 itself.
- **Status:** RESOLVED (FE-2839 — `product-config.spec.ts:51-53`).

### Cluster 4 — staging-data dependence via non-retrying URL assert (drift) · 28 fails

- **Symptom:** specs asserted navigation with a bare `expect(page.url()).toBe(...)` / `expect(page.url())` — a one-shot, non-retrying read that races the SPA route transition and is coupled to a literal URL. Under load it read the pre-navigation URL and failed.
- **Shared-helper fix:** reach the destination through the shared flow (`goToCheckout`, etc.), then settle on the retrying auto-waiting `page.waitForURL("**/order/checkout/**")` and gate the screenshot on a **stable testid** (`checkout.paymentDetails`, `checkout.billingDetails`) rather than a URL literal. (URL-literal *assertions* in the functional `e2e-tests/**` tree are separately swept by FE-2782; the vis-reg fix here is to stop *depending* on the non-retrying read for its settle signal.)
- **Status:** RESOLVED (no `expect(page.url())` remain in `visual-regression/**`; settle-waits + testid gates throughout `checkout.spec.ts` / `billing.spec.ts`).

### Cluster 5 — stale testid (drift) · 3 fails

- **Symptom:** a locator targeted `form-item-terms` where the rendered testid is the singular `form-item-term`. The extra `s` matched nothing.
- **Shared-helper fix:** gate on the page-object accessor for the surface instead of an inline literal, so a testid rename is caught once in the page object rather than silently in every spec.
- **Status:** RESOLVED (no `form-item-terms` remain in `visual-regression/**`).

### Cluster 6 — first-in-worker undefined token → 401 cascade (vis-reg-internal)

- **Symptom:** the first test to run in each Playwright worker started before a session token was established; its requests went out with an undefined `Authorization` and returned 401, and the failure cascaded to subsequent tests in that worker. A vis-reg-only setup-ordering bug — the functional suite never hit it because its fixtures establish the session first.
- **Fix:** gate every spec on the session signal before proceeding — `waitForSessionCookie(page.context())` / poll for `upm_client_session` — and let the shared auth flows/fixtures (`loginViaHeadless`, `registerClientViaHeadless`, `newUser`) own token establishment rather than assuming a warm session. Route mocks are torn down in `afterEach` (`page.unrouteAll` / `context.unrouteAll`) so a leaked route can't poison the next test.
- **Status:** RESOLVED (session gating present across `basket.spec.ts`, `checkout.spec.ts`, `product-config.spec.ts`; no hand-rolled tokens in `visual-regression/**`).

### Cluster 7 — locale-derived button testid breaks French login (vis-reg-internal)

- **Symptom:** a button testid was derived from the translated label via `kebabCase(label)` (the `button.ce.vue` pattern), so the locator that matched the English label missed the French one — the French login variant failed. This is the locale trap FE-2865's holistic `data-testid` system fixes at the root (stable `id → value → label` cascade, never label-first).
- **Fix:** select by the stable, non-translated attribute — `getByTestId(...)` + a `data-test-value` (e.g. gateway by provider code `selectGatewayByType(gateways.STRIPE)`, currency by `[data-test-value="AUD"]`, pay-later by `value="pay-later"`) — never a `kebabCase(label)`-derived testid. FE-2865 (pre-landed) removes the label-first derivation at source; the vis-reg specs consume the stable values.
- **Status:** RESOLVED (FE-2865 root fix + vis-reg specs use value-based locators; only a documentary comment referencing the label-derived pitfall remains in `checkout.spec.ts`).

## Resolution summary

- Clusters 1–2 and 4–7 were re-homed onto the shared helpers by the pre-landed FE-2784 (test-bridge/session) and FE-2865 (`data-testid`) work.
- Cluster 3 — the last hand-rolled journey — was closed by **FE-2839** (`product-config.spec.ts` → `ProductConfig.enterDomainRadio`).
- The rule that prevents recurrence is documented in [ADR 022 Amendment 1](../adr/022-ui-testing-strategy.md#amendments), [`tests/Playwright/docs/06-visual-regression.md`](../../tests/Playwright/docs/06-visual-regression.md#shared-helpers-only--no-drift-from-the-functional-suite), and pseudo-Nathan **P9**.
- **Re-baseline** of the chrome snapshots must run against a staging-connected environment after these fixes land; that step is environment-gated and is tracked as FE-2839 AC-2.
