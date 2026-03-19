import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test-contexts";
import { URLs } from "../../../support/constants/urls";
import { getClientToken } from "../../../support/api/auth";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { Logins } from "../../../support/constants/logins";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";

let checkout: Checkout;

test.describe("Checkout with Bank Transfer", () => {
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  test("Pay with Bank Transfer", async ({ page, context }) => {
    await getClientToken(
      page,
      Logins.bankTransfer.username,
      Logins.bankTransfer.password
    );
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await checkout.selectPaymentMethod("Direct Bank Transfer");
    await checkout.clickPlaceOrder();
    await expect(page.getByText("Order complete!")).toBeVisible();
  });
});
