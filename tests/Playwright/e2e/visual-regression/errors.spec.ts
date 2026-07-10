import { test, expect } from "@playwright/test";

import { ErrorCodes } from "../support/constants/error-codes";
import { URLs } from "../support/constants/urls";
import { Languages as languages } from "../support/constants/languages";

import { returnError } from "../support/mocks/errors";
import { setLocale } from "../support/helpers/locale";
import { waitForSessionCookie } from "../support/helpers";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Error-surface visual-regression baselines (FE-2862).
 *
 * ## Job To Be Done
 * Capture the three cart error surfaces a guest hits when a product-page API
 * call fails, across all 28 locales:
 *  - 503 planned-maintenance INTERSTITIAL DIALOG (product fetch → 503).
 *  - 403/404 product NOT-FOUND page (product fetch → 404; same modal
 *    interstitial surface the app routes to for a missing product).
 *  - 500 error TOAST (orders/current → 500; product page still renders).
 * Pure-layout companion to the functional gate proven in
 * e2e-tests/errors/error-handling.spec.ts; no behaviour re-asserted.
 *
 * ## What Breaks If These Fail
 * - A per-locale layout regression (overflow, RTL, long-string wrapping) ships
 *   silently in the interstitial dialog copy, the not-found interstitial, or the
 *   sonner error toast.
 * - A CSS/template regression in the shared Interstitial / Dialog / Sonner
 *   primitives goes uncaught.
 *
 * ## Determinism notes
 * - Errors are injected with the suite's `returnError` route mock (the same
 *   `ErrorCodes` entries the functional suite drives), registered BEFORE any
 *   navigation. `page.route` persists across the `setLocale` reload, so the
 *   error still fires in-locale.
 * - Locale-safe gating: we wait on the static `dialog-window` /
 *   `interstitial-action-0` / `sonner-toast` testids, never the label-derived
 *   heading, action label, or toast copy.
 * - The animated interstitial avatar (lord-icon) is masked; animations and
 *   transitions are killed via the CSS-reset styleTag.
 * - 401 (incorrect-credentials modal) is intentionally NOT captured here — it is
 *   quarantined for the functional suite pending FE-2798 and re-authenticates
 *   transiently on this flow with no stable action surface to gate on.
 */
// -----------------------------------------------------------------------------

for (const { language, locale } of languages) {
  test.describe(`Error Surfaces Visual Regression Tests - ${language}`, () => {
    // Route mocks are registered per test; tear them down so they cannot leak
    // into a re-used worker context.
    test.beforeEach(async ({ page }) => {
      await page.addStyleTag({
        content: `
              *,
              *::before,
              *::after {
                  transition: none !important;
                  animation: none !important;
                  caret-color: transparent !important;
              }
              `
      });
    });

    test.afterEach(async ({ page }) => {
      await page.unrouteAll({ behavior: "wait" });
    });

    test(`503 Service Unavailable Dialog - ${language}`, async ({ page }) => {
      const { route, url, errorCode, responseError } =
        ErrorCodes.plannedMaintenance;

      await returnError(page, route, errorCode, responseError);

      await page.goto(url);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());

      const dialog = page.getByTestId("dialog-window").first();
      await expect(dialog).toBeVisible({ timeout: 15000 });
      await expect(page).toHaveScreenshot(`${language}/error-503-dialog`, {
        // Mask the avatar CONTAINER (static testid) — the icon inside
        // nondeterministically renders as a lottie web component or an img
        // fallback, so lord-icon is not a stable mask target.
        mask: [dialog.getByTestId("interstitial-avatar")]
      });
    });

    test(`404 Product Not Found - ${language}`, async ({ page }) => {
      const { route, url, errorCode, responseError } =
        ErrorCodes.productNotFound;

      await returnError(page, route, errorCode, responseError);

      await page.goto(url);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());

      const notFound = page.getByTestId("dialog-window").first();
      await expect(notFound).toBeVisible({ timeout: 15000 });
      await expect(
        notFound
          .getByTestId("interstitial-action")
          .and(notFound.locator('[data-test-value="0"]'))
      ).toBeVisible();
      await expect(page).toHaveScreenshot(`${language}/error-not-found`, {
        // Mask the avatar CONTAINER (static testid) — see 503 note above.
        mask: [notFound.getByTestId("interstitial-avatar")]
      });
    });

    test(`500 Error Toast - ${language}`, async ({ page }) => {
      const { route, url, errorCode, responseError } = ErrorCodes.generic500;

      await returnError(page, route, errorCode, responseError);

      await page.goto(url);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());

      const toast = page.getByTestId("sonner-toast").locator("li");
      await expect(toast.first()).toBeVisible({ timeout: 15000 });

      await expect(page).toHaveScreenshot(`${language}/error-500-toast`, {
        mask: [page.locator("lord-icon")]
      });
    });

    // @quarantine(FE-2798) 401 incorrect-credentials modal: on this product-page
    // flow a 401 on orders/current segues to transient re-auth with no stable
    // action surface to gate a deterministic screenshot on. Captured once the
    // functional 401 case is unquarantined.
    test.skip(`401 Not Authorized Dialog - ${language}`, async () => {});
  });
}
