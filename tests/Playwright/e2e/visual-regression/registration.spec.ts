import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { seedGuestBasket } from "../support/flows/guest-checkout";
import { setLocale } from "../support/helpers/locale";
import { interceptConfigValues } from "../support/mocks/brand";
import { GuestCheckout } from "../support/page-objects/templates/guest-checkout";
import {
  Registration,
  STRONG_PASSWORD
} from "../support/page-objects/templates/registration";
import { Languages as languages } from "../support/constants/languages";
import { waitForSessionCookie } from "../support/helpers";

for (const { language, locale } of languages) {
  test.describe(`Registration Page Visual Regression Tests - ${language}`, () => {
    test.beforeEach(async ({ page }) => {
      // Disable all CSS animations and transitions
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
      // Tear down the brand-config route registered by interceptConfigValues so
      // it cannot leak into a re-used worker context.
      await page.unrouteAll({ behavior: "wait" });
    });
    test("Registration Page", async ({ page }) => {
      await page.goto(URLs.register);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(page.getByTestId("register-form")).toBeVisible({
        timeout: 15000
      });
      await expect(page).toHaveScreenshot(`${language}/registration`);
    });
    test("Registration Page with guest checkout CTA", async ({
      page,
      context
    }) => {
      const guest = new GuestCheckout(page);

      // Mock the guest-checkout gate ON (a P4-safe settings mock) BEFORE any
      // navigation so the brand-gated CTA renders. interceptConfigValues
      // replays the request's own auth and strips cache-validation headers so
      // cached reloads return a full 200 instead of a 304 with null data
      // (FE-2785).
      await interceptConfigValues(page, { guestCheckoutEnabled: true });

      // A guest visitor with a non-recurring product (HAT) in their basket.
      // Non-recurring so the guest-checkout CTA renders
      // (Register.vue:64 !hasRecurringProducts).
      await seedGuestBasket(page);

      // Navigate then set locale (the passing Checkout - Guest test uses this
      // order; setLocale-before-goto leaves section-register unrendered in some
      // locales). Gate the screenshot on the locale-stable guest CTA testid.
      await page.goto(URLs.register);
      await setLocale(page, locale);
      await expect(guest.cta).toBeVisible();

      await expect(page).toHaveScreenshot(
        `${language}/registration-guest-checkout`
      );
    });
    test("Registration Page password strength meter", async ({
      page,
      context
    }) => {
      const registration = new Registration(page, context);

      await page.goto(URLs.register);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(registration.registrationForm).toBeVisible({
        timeout: 15000
      });

      // Typing a strong password renders the strength meter (password-strength
      // only mounts when max > 0, i.e. once a value produces a score).
      await registration.password.fill(STRONG_PASSWORD);
      await registration.password.blur();
      await expect(
        registration.passwordItem.getByTestId("password-strength")
      ).toBeVisible();

      await expect(page).toHaveScreenshot(
        `${language}/registration-password-strength`
      );
    });
    test("Registration Page email validation error", async ({
      page,
      context
    }) => {
      const registration = new Registration(page, context);

      await page.goto(URLs.register);
      await setLocale(page, locale);
      await waitForSessionCookie(page.context());
      await expect(registration.registrationForm).toBeVisible({
        timeout: 15000
      });

      // A malformed email that blurs surfaces the username field's validation
      // message (form-item-message-username). Gate on its presence, never its
      // translated copy.
      await registration.email.fill("not-an-email");
      await registration.email.blur();
      await expect(registration.getValidationError("username")).toBeVisible();

      await expect(page).toHaveScreenshot(
        `${language}/registration-email-error`
      );
    });
  });
}
