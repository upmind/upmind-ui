# 📸 6. Visual Regression Testing

The visual regression suite lives at [tests/Playwright/e2e/visual-regression/](../e2e/visual-regression/). It produces screenshot baselines for the major surfaces of the cart app across every supported locale.

## What's covered today

One file per surface, each covering:

| Spec | Surface | Per-locale variants |
| --- | --- | --- |
| [login.spec.ts](../e2e/visual-regression/login.spec.ts) | login page, 2FA entry, forgotten-password page, login/2FA errors | yes, 28 locales |
| [registration.spec.ts](../e2e/visual-regression/registration.spec.ts) | registration page, guest-checkout CTA, password-strength meter, email-validation error | yes |
| [basket.spec.ts](../e2e/visual-regression/basket.spec.ts) | empty basket, basket with 1 item, basket with 2 items, basket with promotions | yes |
| [catalogue.spec.ts](../e2e/visual-regression/catalogue.spec.ts) | catalogue root/category pages, domain-search entry + DAC result states | yes |
| [checkout.spec.ts](../e2e/visual-regression/checkout.spec.ts) | guest + registered-user checkout, gateway-selected states, account-credit, voucher/change-amount/currency surfaces | yes |
| [billing.spec.ts](../e2e/visual-regression/billing.spec.ts) | checkout billing summary (empty/populated), validation alert, standalone billing page | yes |
| [confirmation.spec.ts](../e2e/visual-regression/confirmation.spec.ts) | paid / failed / free / pay-later confirmation outcomes | yes |
| [errors.spec.ts](../e2e/visual-regression/errors.spec.ts) | 503 dialog, 404 not-found, 500 toast error surfaces | yes |
| [guest-account.spec.ts](../e2e/visual-regression/guest-account.spec.ts) | guest account menu, guest upgrade form | yes |
| [verify-email.spec.ts](../e2e/visual-regression/verify-email.spec.ts) | verify-email OTP overlay | yes |
| [product-config.spec.ts](../e2e/visual-regression/product-config.spec.ts) | hosting/domain product config, domain drawer, config drawer | yes |
| [product-setup.spec.ts](../e2e/visual-regression/product-setup.spec.ts) | products-setup single/multi/deferred/error states | yes |
| [template-matrix.spec.ts](../e2e/visual-regression/template-matrix.spec.ts) | page × brand-template layout matrix | no (English-only, by design) |
| [display-price-type.spec.ts](../e2e/visual-regression/display-price-type.spec.ts) | different brand price-display types | partial |

Every locale-looped test follows the same shape — set up the journey with the **shared flows / page objects** (see [Shared helpers only](#shared-helpers-only--no-drift-from-the-functional-suite) below), gate on a **locale-stable testid**, then screenshot:

```ts
for (const { language, locale } of languages) {
  test.describe(`Login Page Visual Regression Tests - ${language}`, () => {
    test.beforeEach(async ({ page }) => {
      login = new Login(page);
      // Disable all CSS animations and transitions
      await page.addStyleTag({ content: `*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }` });
    });
    test("Login Page", async ({ page }) => {
      await page.goto(URLs.login);
      await setLocale(page, locale);
      // Gate on a stable testid, never `networkidle` (a late CORS preflight can
      // resolve after the shot; the testid is the deterministic settle signal).
      await expect(page.getByTestId("section").and(page.locator('[data-test-value="log-in"]'))).toBeVisible({ timeout: 15000 });
      await expect(page).toHaveScreenshot(`${language}/login`);
    });
  });
}
```

## Shared helpers only — no drift from the functional suite

**Rule (FE-2839): a visual-regression spec MUST NOT hand-roll journey logic that already lives in [`support/flows`](../e2e/support/flows/) or a page object.** A vis-reg spec reduces to: *shared journey/setup → gate on a stable testid → freeze animations → `toHaveScreenshot`*. It captures pixels; it does not re-implement navigation.

Why: the 2026-06-12 chrome run failed 324/853 (+69 flaky), and 5 of 7 failure clusters were **drift** — vis-reg specs had hand-rolled their own navigation, locators, and mocks that diverged from the shared helpers the functional specs already used correctly (a serial-only login helper run under `fullyParallel`, a locator for a component that had been replaced, an error mock pointed at the wrong endpoint, a locale-fragile `kebabCase(label)` testid). The functional suite never saw these because it drove the shared flows. See the full triage in [`docs/testing/regression-findings-2026-06-12.md`](../../../docs/testing/regression-findings-2026-06-12.md).

### Do

- Seed baskets/products/promotions with [`addProductViaHeadless`](../e2e/support/flows/basket-setup.ts) / [`goToCheckout`](../e2e/support/flows/checkout.ts) / [`seedGuestBasket`](../e2e/support/flows/guest-checkout.ts) — the same flows the functional specs use.
- Authenticate with [`loginViaHeadless`](../e2e/support/flows/auth-setup.ts) / [`registerClientViaHeadless`](../e2e/support/flows/auth-setup.ts), or the `newUser` / `checkout` fixtures.
- Drive UI steps through the page object for the surface (`Checkout`, `ProductConfig`, `GuestCheckout`, `Dac`, `BillingPage`, …). If the page object lacks a method you need, add it there and consume it — don't inline the sequence in the spec.
- Gate on stable, non-translated testids (`getByTestId(...)` + a `data-test-value`), never a `kebabCase(label)`-derived testid or a translated string.

### Don't

- Re-implement a journey the shared flows/page objects already cover (e.g. `page.locator("#register").click()` + `page.keyboard.type(...)` when `ProductConfig.enterDomainRadio("register", …)` exists).
- Hand-roll raw-HTTP seeding, hardcoded order UUIDs, or a pinned auth token (ADR 021 §"shadow implementations").
- Mock journey data. Settings/flag mocks (brand config, feature toggles) are fine (P4); journey data comes from the real modules + staging.

**Enforcement:** this is pseudo-Nathan review principle P9 — see [12-pseudo-nathan.md](./12-pseudo-nathan.md). The rule is also recorded as an amendment to [ADR 022](../../docs/adr/022-ui-testing-strategy.md#amendments) (the ADR that owns the interim Playwright visual layer).

## Snapshot paths

Baselines are committed under `tests/Playwright/e2e/snapshots/` with this template (set in [playwright.config.ts:20-21](../../playwright.config.ts#L20-L21)):

```
{testFilePath}/{projectName}/{arg}.png
```

So the English login snapshot for the Chrome project lives at:

```
tests/Playwright/e2e/snapshots/visual-regression/login.spec.ts/chrome/English/login-1.png
```

Because the `{projectName}` is part of the path, snapshots for `chrome`, `firefox` and `safari` are independent — running the visual-regression suite against a new project will produce a fresh set of baselines.

## Running the suite

```bash
pnpm visreg:chrome
```

This runs only the files under `tests/Playwright/e2e/visual-regression/` against the `chrome` project. There are no equivalent `visreg:firefox` / `visreg:safari` scripts by default — if you want them, run:

```bash
pnpm playwright test tests/Playwright/e2e/visual-regression --project=firefox
```

## Updating baselines

After a legitimate UI change:

```bash
pnpm playwright test tests/Playwright/e2e/visual-regression --project=chrome --update-snapshots
```

Scope it as tightly as you can. You usually want one of:

- Single file: add the path, e.g. `tests/Playwright/e2e/visual-regression/login.spec.ts`.
- Single test: add `-g "English"` or `-g "Login Page"`.

Commit the regenerated PNGs together with the UI change. The review diff on GitLab shows the PNG side-by-side so reviewers can verify the change is intentional.

## Tolerances

Globally set in [playwright.config.ts:10-13](../../playwright.config.ts#L10-L13):

```ts
expect: {
  timeout: 30000,
  toHaveScreenshot: { maxDiffPixels: 2000 }
}
```

So up to 2000 pixel differences per screenshot are tolerated. That generous budget exists because the staging API occasionally injects slightly different order IDs or dates that are hard to mask — it's not a licence to regress the UI.

If you need a tighter or looser threshold for a single test, pass it inline:

```ts
await expect(page).toHaveScreenshot(`${language}/basket`, { maxDiffPixels: 500 });
```

## The animation-disable pattern

Every visual-regression spec injects a style tag in `beforeEach` that disables all transitions, animations, and the text caret. Without this, the emulated browser can race the rendering pipeline and produce flaky diffs on focused form fields, cycling spinners, or fading toasts.

```ts
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      transition: none !important;
      animation: none !important;
      caret-color: transparent !important;
    }
  `
});
```

There's also a global `launchOptions: { args: ["--disable-animations"] }` in the Chromium config — the two are belt-and-braces and help to minimise flakiness.

## Masking regions that will always differ

For places where the UI shows a timestamp, order number, or other non-deterministic text, pass a `mask` array:

```ts
await expect(page.locator("body")).toHaveScreenshot(
  "checkout-full.png",
  { mask: [page.locator("dt")] }
);
```

Masks render as solid rectangles in both baseline and actual, so the diff is always zero in that region.

## Locale coverage

Locales come from [support/constants/languages.ts](../e2e/support/constants/languages.ts). 28 entries, covering everything the cart currently supports including RTL (Urdu) and CJK (Traditional Chinese) scripts. When a new locale is added to the app, add it here — the visual-regression loops pick it up automatically.

For registered-user scenarios (e.g. `checkout.spec.ts`), per-locale users exist in [logins.ts](../e2e/support/constants/logins.ts) under the "Locale Testing" block. If you add a locale you'll need a corresponding staging user and to add the entry to `Logins`.

## Gotchas specific to visual regression

- **First run on a fresh machine:** Playwright creates baselines on first run for any missing snapshots and fails the test. Re-run and it passes. If you see missing-baseline failures on CI that used to pass, someone probably moved a spec file without moving its snapshot directory.
- **Font rendering differences:** In practice Chromium renders fonts consistently on macOS and Linux, but if you ever run locally on Windows the diff will be substantial. Don't update baselines from a different OS than the intended baseline OS.
- **`networkidle`:** Used liberally in these tests. It's less of a problem in visual regression than in e2e because there's no polling on a cold page — the risk is mostly that a late CORS preflight resolves after the screenshot.
- **The dialog mask on checkout:** The checkout template and some others mask `<dt>` elements (the label side of description lists) because those labels include order numbers/dates that change every run. Watch out for new unmasked dynamic content if you add to those pages.
