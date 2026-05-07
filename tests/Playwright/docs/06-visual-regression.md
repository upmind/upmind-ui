# 📸 6. Visual Regression Testing

The visual regression suite lives at [tests/Playwright/e2e/visual-regression/](../e2e/visual-regression/). It produces screenshot baselines for the major surfaces of the cart app across every supported locale.

## What's covered today

One file per surface, each covering:

| Spec | Surface | Per-locale variants |
| --- | --- | --- |
| [login.spec.ts](../e2e/visual-regression/login.spec.ts) | login page, 2FA entry, forgotten-password page | yes, 28 locales |
| [registration.spec.ts](../e2e/visual-regression/registration.spec.ts) | registration page | yes |
| [basket.spec.ts](../e2e/visual-regression/basket.spec.ts) | empty basket, basket with 1 item, basket with 2 items, basket with promotions | yes |
| [catalogue.spec.ts](../e2e/visual-regression/catalogue.spec.ts) | catalogue pages | yes |
| [checkout.spec.ts](../e2e/visual-regression/checkout.spec.ts) | guest checkout (currently skipped) + registered-user checkout | yes |
| [product-config.spec.ts](../e2e/visual-regression/product-config.spec.ts) | product configuration page | yes |
| [display-price-type.spec.ts](../e2e/visual-regression/display-price-type.spec.ts) | different brand price-display types | partial |

Every locale-looped test follows the same shape:

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
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${language}/login`);
    });
  });
}
```

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

Globally set in [playwright.config.ts:11-14](../../playwright.config.ts#L11-L14):

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
