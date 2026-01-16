import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test";
import { URLs } from "../../../support/constants/urls";
import { getClientToken } from "../../../support/utils/functions/tokens";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import { Logins } from "../../../support/constants/logins";
import { goToCheckout } from "../../../support/utils/apiHelper";

let checkout: Checkout;

test.describe("Checkout with Offline Payment", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  test("Pay with Offline payment", async ({ page, context }) => {
    await getClientToken(
      page,
      Logins.offlinePayment.username,
      Logins.offlinePayment.password
    );
    await goToCheckout(page, context, null, null);
    await page.waitForLoadState("domcontentloaded");
    await checkout.selectPaymentMethod("Offline Payment");
    await checkout.clickPlaceOrder();
    await expect(page.getByRole("dialog")).toContainText(
      "Converting your order"
    );
    await expect(page.getByRole("dialog")).toContainText("Order complete!");
  });
});
