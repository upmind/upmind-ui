import { test, expect } from "@playwright/test";
import { newUser } from "../../support/fixtures/auth-context";
import { goToCheckout } from "../../support/flows/checkout";
import { interceptConfigValues } from "../../support/mocks/brand";
import {
  mockVerifyCode,
  mockResendVerification
} from "../../support/mocks/verify-email";
import { products } from "../../support/constants/products";
import { URLs } from "../../support/constants/urls";
import { VerifyEmail } from "../../support/page-objects/templates/verify-email";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Email-verification gate (FE-1329) e2e coverage.
 *
 * ## Job To Be Done
 * Prove that when a brand requires a verified email for orders
 * (`security.orders.require_verified_email`), an unverified client is stopped at
 * checkout and routed into the verify-email overlay against the real
 * headless/client-vue modules; that a valid code clears the overlay and lets
 * them through; that an invalid code is rejected inline; that resending issues a
 * fresh code; and that the overlay route honours its guard when hit directly.
 *
 * ## ⚠️ Documented P4 exception
 * The verify-code and resend *outcomes* are mocked (`mocks/verify-email.ts`).
 * Normally we never mock journey data (P4), but there is no test-inbox and codes
 * are random/server-issued, so the success path can't be driven with real data.
 * Email verification is an uncommon, easy-to-miss feature — these mocks are the
 * only way to give it a regression safety net. The gate (brand flag), routing,
 * and guard behaviour are all exercised against real settings/modules; only the
 * verify/resend responses are stubbed.
 *
 * ## What Breaks If These Fail
 * - An unverified client reaches checkout/payment without verifying.
 * - A valid code no longer clears the overlay / advances the journey (the
 *   FE-1329 regression we fixed: the overlay used to sit there on success).
 * - An invalid code is silently accepted, or its error never surfaces.
 * - Resending stops issuing a code or stops confirming/erroring inline.
 * - The verify-email overlay is reachable while logged out (or flashes).
 */
// -----------------------------------------------------------------------------

newUser.describe("Email verification gate", () => {
  newUser.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  newUser(
    "An unverified client is routed to the verify-email overlay at checkout",
    async ({ page }) => {
      const verify = new VerifyEmail(page);

      await interceptConfigValues(page, { requireVerifiedEmail: true });
      await goToCheckout(page, products.STARTER_HOSTING, null, null);

      await expect(page).toHaveURL(/\/order\/checkout\/verify-email\//);
      await expect(verify.otpInput.first()).toBeVisible();
      await expect(verify.title).toBeVisible();
    }
  );

  newUser(
    "Back to basket from the verify overlay returns to the basket",
    async ({ page }) => {
      const verify = new VerifyEmail(page);

      await interceptConfigValues(page, { requireVerifiedEmail: true });
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await expect(verify.backToBasket).toBeVisible();

      // The cancel action routes back to the basket — Auth's `cancelRoute` is
      // ROUTE.BASKET — rather than advancing into checkout.
      await verify.backToBasket.click();
      await expect(page).toHaveURL(/\/order\/basket\//);
    }
  );

  newUser(
    "A valid code clears the overlay and lets the client through",
    async ({ page }) => {
      const verify = new VerifyEmail(page);

      await interceptConfigValues(page, { requireVerifiedEmail: true });
      await mockVerifyCode(page, "success");
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await expect(verify.otpInput.first()).toBeVisible();

      // Entering a (well-formed) code auto-submits; the mocked success verifies
      await verify.enterCode("123456");

      // The overlay closes and the client is no longer gated
      await expect(page).not.toHaveURL(/verify-email/);
      await expect(verify.otpInput).toHaveCount(0);
    }
  );

  newUser(
    "An invalid code is rejected inline and keeps the overlay open",
    async ({ page }) => {
      const verify = new VerifyEmail(page);

      await interceptConfigValues(page, { requireVerifiedEmail: true });
      await mockVerifyCode(page, "failure");
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await expect(verify.otpInput.first()).toBeVisible();

      await verify.enterCode("123456");

      // The rejection surfaces on the code field and the overlay stays put
      await expect(verify.codeFieldError).toBeVisible();
      await expect(page).toHaveURL(/verify-email/);
    }
  );

  newUser(
    "Resending issues a new code and confirms it inline",
    async ({ page }) => {
      const verify = new VerifyEmail(page);

      await interceptConfigValues(page, { requireVerifiedEmail: true });
      await mockResendVerification(page, "success");
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await expect(verify.resendLink).toBeVisible();

      await verify.resendLink.click();

      await expect(verify.resentMessage).toBeVisible();
    }
  );

  newUser(
    "A failed resend surfaces the error in the alert",
    async ({ page }) => {
      const verify = new VerifyEmail(page);

      await interceptConfigValues(page, { requireVerifiedEmail: true });
      await mockResendVerification(page, "failure");
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await expect(verify.resendLink).toBeVisible();

      await verify.resendLink.click();

      await expect(verify.alert).toBeVisible();
    }
  );
});

test.describe("Verify-email overlay route guard", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  test("A logged-out visitor is redirected away from the verify-email overlay without it flashing", async ({
    page
  }) => {
    const verify = new VerifyEmail(page);

    await page.goto(`${URLs.checkout}verify-email/`);

    await expect(page).not.toHaveURL(/verify-email/);
    await expect(verify.otpInput).toHaveCount(0);
  });
});
