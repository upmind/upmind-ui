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
    // The stored-payment-method radio is keyed off a dynamic `payment_details_id`
    // (no stable, hard-codeable testid), so select the first saved card in the
    // stored-methods group structurally — the fixture user has exactly one. The
    // RadioCardItem root is a <Label>; clicking it drives the Radix radio.
    await checkout.selectFirstStoredPaymentMethod();
    await checkout.clickCompleteCheckout();
    await checkout.dialogWindow.waitFor();
    await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();
  });
});
