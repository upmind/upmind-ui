import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test-contexts";
import { URLs } from "../../../support/constants/urls";
import { loginViaHeadless } from "../../../support/flows";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { Logins } from "../../../support/constants/logins";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";

test.describe("Checkout with Existing Payment Method", () => {
  let checkout: Checkout;

  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  test("Pay with Existing Payment Method", async ({ page }) => {
    await loginViaHeadless(
      page,
      Logins.existingMethodUser.username,
      Logins.existingMethodUser.password
    );
    await goToCheckout(page, products.STARTER_HOSTING, null, null);
    // Capture the placement mutation so a wrong payment method / amount on the
    // POST /api/payments body fails here, not just at the confirmation UI.
    // A stored method places by payment_details_id, NOT a gateway: headless
    // unsets gateway_id and mapStoredPaymentDetailData returns
    // { payment_details_id }, so the body is
    // { invoice_id, payment_details_id, amount, ... } — assert those.
    const payments = await checkout.interceptPaymentResponse();
    // The stored-payment-method radio is keyed off a dynamic `payment_details_id`
    // (no stable, hard-codeable testid), so select the first saved card in the
    // stored-methods group structurally — the fixture user has exactly one. The
    // RadioCardItem root is a <Label>; clicking it drives the Radix radio.
    await checkout.selectFirstStoredPaymentMethod();
    await checkout.clickCompleteCheckout();
    await checkout.dialogWindow.waitFor();
    await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();
    const placement = payments.find(p => p.method === "POST" && p.request);
    expect(
      placement,
      "no POST /api/payments captured on placement"
    ).toBeTruthy();
    expect(placement?.request?.payment_details_id).toBeTruthy();
    expect(Number(placement?.request?.amount)).toBeGreaterThan(0);
  });
});
