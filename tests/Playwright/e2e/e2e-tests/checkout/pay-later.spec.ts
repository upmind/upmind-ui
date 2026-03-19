import { expect, test } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { getClientToken } from "../../support/api/auth";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Logins } from "../../support/constants/logins";
import { goToCheckout } from "../../support/flows/checkout";
import { products } from "../../support/constants/products";

let checkout: Checkout;

test.describe("Checkout with Pay Later", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  test("Pay with Offline payment", async ({ page, context }) => {
    await getClientToken(
      page,
      Logins.payLater.username,
      Logins.payLater.password
    );
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await page.waitForLoadState("domcontentloaded");
    await checkout.selectPaymentMethod("Pay Later");
    await checkout.clickPlaceOrder();
    await expect(page.getByRole("dialog")).toContainText(
      "Converting your order"
    );
    await expect(page.getByRole("dialog")).toContainText("Order complete!");
  });
});
