import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test";
import { URLs } from "../../../support/constants/urls";
import { getClientToken } from "../../../support/utils/functions/tokens";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import { Logins } from "../../../support/constants/logins";
import { goToCheckout } from "../../../support/utils/apiHelper";

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
    await goToCheckout(page, context, null, null);
    await checkout.selectPaymentMethod("Visa Ending 4242");
    await checkout.clickPlaceOrderAndPay();
    await checkout.dialogWindow.waitFor();
    await expect(checkout.dialogWindow).toContainText("Converting your order");
    await expect(checkout.dialogWindow).toContainText(
      "Processing your payment"
    );
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText("Order complete!");
  });
});
