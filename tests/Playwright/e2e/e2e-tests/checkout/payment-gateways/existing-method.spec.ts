import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test-contexts";
import { URLs } from "../../../support/constants/urls";
import { getClientToken } from "../../../support/api/auth";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { Logins } from "../../../support/constants/logins";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";

test.describe("Checkout with Existing Payment Method", () => {
  let checkout: Checkout;

  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  test("Pay with Existing Payment Method", async ({ page, context }) => {
    await getClientToken(
      page,
      Logins.existingMethodUser.username,
      Logins.existingMethodUser.password
    );
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await checkout.selectPaymentMethod("Visa Ending 4242");
    await checkout.clickPlaceOrderAndPay();
    await checkout.dialogWindow.waitFor();
    await expect(page.getByText("Thank you for your order.")).toBeVisible();
  });
});
