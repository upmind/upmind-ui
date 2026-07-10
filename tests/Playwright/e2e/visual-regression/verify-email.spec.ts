import { expect, newUser } from "../support/fixtures/auth-context";

import { products } from "../support/constants/products";
import { Languages as languages } from "../support/constants/languages";
import { VerifyEmail } from "../support/page-objects/templates/verify-email";

import { goToCheckout } from "../support/flows/checkout";
import { interceptConfigValues } from "../support/mocks/brand";
import { setLocale } from "../support/helpers/locale";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Verify-email overlay visual-regression baseline (FE-2850).
 *
 * ## Job To Be Done
 * Capture the IDLE (un-entered) layout of the verify-email OTP overlay that
 * `guardCheckout` opens for an UNVERIFIED client when the brand requires a
 * verified email for orders (`security.orders.require_verified_email`). Proves
 * the overlay surface — OTP slots, resend control, interstitial copy, back link
 * — renders correctly across all 28 locales. Pure-layout companion to the
 * functional gate proven in
 * e2e-tests/login-registration/verify-email.spec.ts; no behaviour re-asserted.
 *
 * ## What Breaks If These Fail
 * - A per-locale layout regression (overflow, RTL, long-string wrapping) ships
 *   silently in the verify-email overlay copy
 *   (auth.verify_email_title / _msg / didnt_receive_code / resend_code).
 * - A CSS/template regression in the Auth interstitial or the OTP slot group
 *   goes uncaught.
 *
 * ## Determinism notes
 * - `newUser` mints a FRESH unverified client per test (the overlay only appears
 *   for an unverified client), so the suite stays fully parallel — no shared
 *   staging account, unlike login.spec.ts which must run serial.
 * - The gate is a P4-safe feature-flag mock (`interceptConfigValues`), NOT
 *   journey data; no verify/resend mocks are needed for the idle capture.
 * - Locale-safe gating: we wait on the static `input-otp-slot` testid, never the
 *   label-derived heading/back-link (FE-2840 trap).
 * - The animated 2fa avatar (lord-icon) is masked; animations/transitions are
 *   killed via the CSS-reset styleTag.
 */
// -----------------------------------------------------------------------------

for (const { language, locale } of languages) {
  newUser.describe(`Verify Email Visual Regression Tests - ${language}`, () => {
    newUser.beforeEach(async ({ page }) => {
      // Disable all CSS animations and transitions so the Auth interstitial
      // fade-in cannot flap the baseline.
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

    newUser.afterEach(async ({ page }) => {
      // Tear down the brand-config route registered by interceptConfigValues so
      // it cannot leak into a re-used worker context.
      await page.unrouteAll({ behavior: "wait" });
    });

    newUser(`Verify Email Overlay - ${language}`, async ({ page }) => {
      const verify = new VerifyEmail(page);

      // Mock the require-verified-email gate ON (a P4-safe settings mock) BEFORE
      // any navigation so guardCheckout opens the overlay. Pass null bearerToken
      // so cached reloads replay a full 200 instead of a 304 with null data
      // (FE-2785).
      await interceptConfigValues(page, { requireVerifiedEmail: true });

      // The newUser fixture has already registered + authenticated a fresh
      // unverified client. goToCheckout creates an order, adds the product via
      // the API, and lands on /order/checkout/ where guardCheckout redirects the
      // unverified client to /order/checkout/verify-email/.
      await goToCheckout(page, products.STARTER_HOSTING, null, null);

      // setLocale reloads, which re-renders the overlay in-locale and re-fires
      // the brand-values request the route above re-intercepts so the gate still
      // holds. Mirrors the registration guest-CTA spec ordering.
      await setLocale(page, locale);

      // Gate on the locale-SAFE static OTP slot testid (InputOTP.vue), NOT the
      // label-derived heading or back-to-basket link. Its visibility is the
      // single deterministic settle signal before screenshotting.
      await expect(verify.otpInput.first()).toBeVisible();
      const overlay = page.getByTestId("dialog-window");

      // Screenshot the overlay ELEMENT, not the page: the overlay is the
      // subject under test (see fileoverview) and the checkout page behind it
      // settles non-deterministically (summary fetches, scroll state), which
      // flakes full-page baselines.
      await expect(overlay).toHaveScreenshot(
        `${language}/verify-email-overlay`,
        {
          // Mask the avatar CONTAINER (static testid), not the lord-icon
          // inside it — the icon nondeterministically renders as a lottie
          // web component or a plain img fallback, so its element is not a
          // stable mask target. The container box always exists.
          mask: [overlay.getByTestId("interstitial-avatar")]
        }
      );
    });
  });
}
