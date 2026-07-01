/**
 * @fileoverview Confirmation / Thank-You Page Visual Regression
 *
 * ## Job To Be Done
 * Locks baseline screenshots for the four payment-OUTCOME layout states of the
 * order confirmation page — paid success, payment failure, free order, and
 * non-card (Pay Later) — across all 28 locales (including the RTL Urdu pass).
 * The functional behaviour is proven by
 * e2e-tests/confirmation/confirmation-display.spec.ts; these shots cover the
 * rendered surface (status alert/badge, hero, order-details list) that the
 * functional suite does not pixel-compare.
 *
 * ## What Breaks If These Fail
 * A CSS or template regression in the OrderFull/LTR/RTL/Enclosed confirmation
 * templates, the status banner, or the order-details list would ship silently —
 * e.g. a broken danger alert on failed payment, a collapsed free-order layout,
 * a misaligned pay-later "payment due" banner, or a per-locale overflow / RTL
 * mirroring regression in the confirmation copy.
 *
 * ## Determinism notes
 * - `newUser` mints a FRESH client per test, so the suite stays fully parallel —
 *   no shared staging account (unlike login.spec.ts which must run serial).
 * - `setLocale` reloads the confirmation page in-locale AFTER the payment
 *   outcome URL settles, so the per-locale render is captured without re-driving
 *   the checkout.
 * - Locale-safe gating: we wait on the static `description-list` testid
 *   (DescriptionList.ce.vue default), never label-derived copy.
 * - The dynamic order-details list (order id, prices, dates) and the payment
 *   announcement banner (carries a paid date) are MASKED rather than asserted,
 *   so the baseline is deterministic across runs and locales.
 */
import { newUser, expect } from "../support/fixtures/auth-context";
import { URLs } from "../support/constants/urls";
import { products } from "../support/constants/products";
import { gateways } from "../support/constants/gateways";
import { goToCheckout } from "../support/flows/checkout";
import { setLocale } from "../support/helpers/locale";
import { Languages as languages } from "../support/constants/languages";

for (const { language, locale } of languages) {
  newUser.describe(`Confirmation Page Visual Regression - ${language}`, () => {
    newUser.beforeEach(async ({ page }) => {
      // Disable all CSS animations and transitions (mirrors checkout.spec.ts:59-72)
      await page.goto(URLs.emptyBasket);
      await page.waitForLoadState("load");
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

    newUser(
      `Confirmation - Paid Order (Stripe 4242) - ${language}`,
      async ({ page, context, checkout }) => {
        await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await page.waitForURL(`/order/**/?payment_success=true`);
        await setLocale(page, locale);
        await expect(page.getByTestId("description-list")).toBeVisible({
          timeout: 30000
        });
        await expect(
          page.getByTestId("confirmation-payment-alert")
        ).toBeHidden();
        await expect(page).toHaveScreenshot(`${language}/confirmation-paid`, {
          fullPage: true,
          mask: [page.getByTestId("description-list"), page.getByRole("banner")]
        });
      }
    );

    newUser(
      `Confirmation - Failed Payment (Stripe 4000000000009995) - ${language}`,
      async ({ page, context, checkout }) => {
        await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4000000000009995", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await page.waitForURL(`/order/**/?payment_success=false`);
        await setLocale(page, locale);
        await expect(page.getByTestId("description-list")).toBeVisible({
          timeout: 30000
        });
        await expect(
          page.getByTestId("confirmation-payment-alert").first()
        ).toBeVisible();
        await expect(
          page.locator('[data-testid^="gateway-"]').first()
        ).toBeVisible({ timeout: 30000 });
        await expect(page).toHaveScreenshot(`${language}/confirmation-failed`, {
          fullPage: true,
          mask: [page.getByTestId("description-list"), page.getByRole("banner")]
        });
      }
    );

    newUser(
      `Confirmation - Free Order - ${language}`,
      async ({ page, context, checkout }) => {
        await goToCheckout(page, context, products.FREE_HOSTING, null, null);
        await checkout.completeCheckout.click();
        await page.waitForURL(`/order/**/?payment_success=true`);
        await setLocale(page, locale);
        await expect(page.getByTestId("description-list")).toBeVisible({
          timeout: 30000
        });
        await expect(
          page.getByTestId("confirmation-payment-alert")
        ).toBeHidden();
        await expect(page).toHaveScreenshot(`${language}/confirmation-free`, {
          fullPage: true,
          mask: [page.getByTestId("description-list"), page.getByRole("banner")]
        });
      }
    );

    newUser(
      `Confirmation - Pay Later (non-card) - ${language}`,
      async ({ page, context, checkout }) => {
        await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
        await checkout.selectPayLater();
        await checkout.clickCompleteCheckout();
        await page.waitForURL(`/order/**/?payment_success=true`);
        await setLocale(page, locale);
        await expect(page.getByTestId("description-list")).toBeVisible({
          timeout: 30000
        });
        await expect(
          page.getByTestId("confirmation-payment-alert").first()
        ).toBeVisible();
        await expect(
          page.locator('[data-testid^="gateway-"]').first()
        ).toBeVisible({ timeout: 30000 });
        await expect(page).toHaveScreenshot(
          `${language}/confirmation-pay-later`,
          {
            fullPage: true,
            mask: [
              page.getByTestId("description-list"),
              page.getByRole("banner")
            ]
          }
        );
      }
    );
  });
}
