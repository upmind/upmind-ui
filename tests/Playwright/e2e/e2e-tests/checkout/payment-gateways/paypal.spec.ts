import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test-contexts";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { payPalDetails } from "../../../support/secrets/paypal";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";
import { gateways } from "../../../support/constants/gateways";
import { registerClientViaHeadless } from "../../../support/flows/auth-setup";

let checkout: Checkout;

test.describe("Checkout with PayPal", () => {
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto("/");
    await registerClientViaHeadless(page);
  });
  // Quarantined: Drives the real PayPal sandbox login UI (sandbox.paypal.com).
  // PayPal periodically reshuffles their login flow (placeholders, captchas,
  // device-trust interstitials), causing this test to fail with "Target page
  // closed" before our app even gets a chance to handle the return URL. The
  // value of this test is the *return-trip handling*, not the third-party UI —
  // when revisiting, mock the PayPal callback rather than logging in for real.
  // See ADR 021 §Flakiness policy.
  // @quarantine(FE-XXXX-PAYPAL, 2026-06-25)
  test.skip("Pay with PayPal Express", async ({ page }) => {
    await goToCheckout(page, products.STARTER_HOSTING, null, null);
    await checkout.selectGatewayByType(gateways.PAYPAL_EXPRESS);
    await checkout.clickCompleteCheckout();
    await page.waitForURL(
      "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&useraction=commit**"
    );
    await page
      .getByPlaceholder("Email address or mobile number")
      .fill(payPalDetails.user);
    await page.getByPlaceholder("Password").fill(payPalDetails.password);
    await page.click("#btnLogin");
    await page.getByTestId("submit-button-initial").click();
    await page.waitForURL(`http://qa-automation.local:5173/order/**`);
    await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();
  });
});
