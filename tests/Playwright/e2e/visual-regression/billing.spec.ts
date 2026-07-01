import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/urls";
import { Checkout } from "../support/page-objects/templates/checkout";
import { BillingPage } from "../support/page-objects/templates/billing-page";
import { products } from "../support/constants/products";
import { gateways } from "../support/constants/gateways";
import { goToCheckout } from "../support/flows/checkout";
import { getSessionToken, getClientToken } from "../support/api/auth";
import { registerClient, addAddressToClient } from "../support/api/client";
import { getCurrentOrder, setOrderAddress } from "../support/api/basket";
import { waitForSessionCookie } from "../support/helpers/session";
import { setLocale } from "../support/helpers/locale";
import {
  interceptUISchema,
  interceptConfigValues
} from "../support/mocks/brand";
import { Languages as languages } from "../support/constants/languages";
import type { Page, BrowserContext } from "@playwright/test";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Billing Details Visual Regression Tests
 *
 * ## Job To Be Done
 * Protect the billing-details surfaces across the 28-locale i18n matrix for the
 * states a registered shopper actually sees: the checkout billing-summary card
 * (empty and populated), the billing-requirements validation alert raised when a
 * required field is missing at complete-checkout, and the standalone billing page
 * (empty and with a saved address). Each baseline catches per-locale layout
 * breakage — overflowing labels, RTL (Urdu), long German strings, clipped tab
 * headers — that a functional spec cannot see.
 *
 * ## What Breaks If These Fail
 * - A CSS/template regression silently ships a broken billing summary or
 *   standalone billing form in one or more locales.
 * - The billing-requirements alert renders misaligned or truncated, hiding the
 *   "you must add X" prompt a shopper needs to complete checkout.
 *
 * ## Determinism & locale strategy
 * Each iteration registers a FRESH client (registerClient + getClientToken) so
 * the empty states are genuinely empty and no sibling parallel test's saved
 * address bleeds in. goToCheckout drives the REAL basket/checkout modules — no
 * hand-rolled session, no hardcoded order UUIDs; the standalone URL's orderId is
 * read from the live current order. billingDetailsDisabled=false is mocked on so
 * the summary card / standalone page render (rather than the inline form). The
 * require* toggles for the validation-alert state are mocked via
 * interceptConfigValues with a null token so the setLocale reload replays a full
 * 200 (FE-2785). setLocale reloads the page, so it is called after navigation and
 * the testid gate is re-asserted before every screenshot.
 */

let checkout: Checkout;
let billingPage: BillingPage;

async function registerAndLogin(page: Page, context: BrowserContext) {
  await page.goto("/");
  await waitForSessionCookie(context);
  const guestToken = await getSessionToken(context);
  const user = await registerClient(guestToken);
  await getClientToken(page, user.email, user.password);
}

for (const { language, locale } of languages) {
  test.describe(`Billing Visual Regression Tests - ${language}`, () => {
    test.beforeEach(async ({ page }) => {
      checkout = new Checkout(page);
      billingPage = new BillingPage(page);
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

    test.afterEach(async ({ page, context }) => {
      await page.unrouteAll({ behavior: "wait" });
      await context.unrouteAll({ behavior: "wait" });
    });

    test("Billing - Summary Empty", async ({ page, context }) => {
      await registerAndLogin(page, context);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await page.waitForURL("**/order/checkout/**");
      await setLocale(page, locale);
      await expect(checkout.billingDetails).toBeVisible({ timeout: 30000 });
      await expect(checkout.addNewAddress).toBeVisible();
      await expect(checkout.gateways.first()).toBeVisible({ timeout: 30000 });

      await expect(page).toHaveScreenshot(`${language}/billing-summary-empty`, {
        fullPage: true,
        mask: [checkout.basketSummary, page.locator("lord-icon")]
      });
    });

    test("Billing - Summary Populated", async ({ page, context }) => {
      await registerAndLogin(page, context);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await page.waitForURL("**/order/checkout/**");

      const token = await getSessionToken(context);
      const order = await getCurrentOrder(token);
      const orderId = order?.id as string;
      const clientId = order?.client_id as string;
      const address = await addAddressToClient(token, clientId);
      await setOrderAddress(token, orderId, address?.id as string);

      await setLocale(page, locale);
      await expect(checkout.billingDetails).toBeVisible({ timeout: 30000 });
      // The saved address title is carried in billing-summary-address's
      // data-test-value — gate on it so the populated row has rendered before
      // the shot rather than racing the empty summary.
      await expect(checkout.billingSummaryAddress).toBeVisible();
      await expect(checkout.billingSummaryAddress).toHaveAttribute(
        "data-test-value",
        "10 Downing Street"
      );
      await expect(checkout.gateways.first()).toBeVisible({ timeout: 30000 });

      await expect(page).toHaveScreenshot(
        `${language}/billing-summary-populated`,
        {
          fullPage: true,
          mask: [checkout.basketSummary, page.locator("lord-icon")]
        }
      );
    });

    test("Billing - Validation Alert", async ({ page, context }) => {
      await registerAndLogin(page, context);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await page.waitForURL("**/order/checkout/**");

      // Force address required so complete-checkout raises the billing
      // requirements alert. null token → setLocale's reload replays a full 200
      // (FE-2785) rather than a 304 that would drop the override.
      await interceptConfigValues(page, null, {
        requireAddressForOrders: true,
        requireCompanyForOrders: false,
        requireRegionInAddress: false,
        requirePhoneForOrders: false
      });
      await setLocale(page, locale);

      await expect(checkout.billingDetails).toBeVisible({ timeout: 30000 });
      await checkout.selectGatewayByType(gateways.OFFLINE);
      // Two clicks: the requirements guard surfaces the alert on the second
      // complete-checkout attempt (mirrors billing-details-requirements.spec).
      await checkout.completeCheckout.click();
      await checkout.completeCheckout.click();
      await expect(checkout.billingNeedsInputAlert).toBeVisible({
        timeout: 30000
      });

      await expect(page).toHaveScreenshot(
        `${language}/billing-validation-alert`,
        {
          fullPage: true,
          mask: [checkout.basketSummary, page.locator("lord-icon")]
        }
      );
    });

    test("Billing - Standalone Empty", async ({ page, context }) => {
      await registerAndLogin(page, context);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await page.waitForURL("**/order/checkout/**");

      const token = await getSessionToken(context);
      const order = await getCurrentOrder(token);
      const orderId = order?.id as string;

      await page.goto(`${URLs.baseUrl}order/basket/${orderId}/billing/`);
      await setLocale(page, locale);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 30000 });
      await expect(billingPage.addressManualEntry).toBeVisible({
        timeout: 30000
      });

      await expect(page).toHaveScreenshot(
        `${language}/billing-standalone-empty`,
        {
          fullPage: true,
          mask: [checkout.basketSummary, page.locator("lord-icon")]
        }
      );
    });

    test("Billing - Standalone With Address", async ({ page, context }) => {
      await registerAndLogin(page, context);
      interceptUISchema(context, {
        "@data.billing_details.billingDetailsDisabled": false
      });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await page.waitForURL("**/order/checkout/**");

      const token = await getSessionToken(context);
      const order = await getCurrentOrder(token);
      const orderId = order?.id as string;
      const clientId = order?.client_id as string;
      const address = await addAddressToClient(token, clientId);
      await setOrderAddress(token, orderId, address?.id as string);

      await page.goto(`${URLs.baseUrl}order/basket/${orderId}/billing/`);
      await setLocale(page, locale);
      await expect(billingPage.billingSection).toBeVisible({ timeout: 30000 });
      await expect(billingPage.continue).toBeVisible({ timeout: 30000 });

      await expect(page).toHaveScreenshot(
        `${language}/billing-standalone-with-address`,
        {
          fullPage: true,
          mask: [checkout.basketSummary, page.locator("lord-icon")]
        }
      );
    });
  });
}
