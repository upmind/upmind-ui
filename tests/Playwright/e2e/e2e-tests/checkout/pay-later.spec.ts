import { expect, test } from "@playwright/test";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { goToCheckout } from "../../support/flows/checkout";
import { products } from "../../support/constants/products";
import { registerClientViaHeadless } from "../../support/flows";

let checkout: Checkout;

test.describe("Checkout with Pay Later", () => {
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto("/");
    await registerClientViaHeadless(page);
  });
  test("Pay with Offline payment", async ({ page }) => {
    await goToCheckout(page, products.STARTER_HOSTING, null, null);
    await checkout.selectPayLater();
    await checkout.completeCheckout.click();
    await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();
  });
});
