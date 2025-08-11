import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../../support/constants/urls";
import {
  getCurrentOrderId,
  addProductToOrder
} from "../../../support/utils/functions/basket";
import {
  getSessionToken,
  getClientToken
} from "../../../support/utils/functions/tokens";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import { Logins } from "../../../support/constants/logins";

let checkout: Checkout;

test.describe("Checkout with Offline Payment", () => {
  let token: string;
  let orderId: string | null;
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  test("Pay with Offline payment", async ({ page, context }) => {
    await getClientToken(
      page,
      Logins.offlinePayment.username,
      Logins.offlinePayment.password
    );
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    token = await getSessionToken(context, "client");
    orderId = await getCurrentOrderId(token);
    await addProductToOrder(
      `${token}`,
      `${orderId}`,
      "3de78642-de53-9714-76df-21208469530d",
      1,
      24,
      [],
      [],
      {
        domain: `${fakerEN_GB.string.alphanumeric({
          length: { min: 3, max: 15 }
        })}.com`
      },
      []
    );
    await page.reload();
    await page.goto(URLs.checkout);
    await page.waitForLoadState("domcontentloaded");
    await checkout.selectPaymentMethod("Offline Payment");
    await page.getByTestId("button-place-order").click();
    await expect(page.getByRole("dialog")).toContainText(
      "Converting your order"
    );
    await expect(page.getByRole("dialog")).toContainText("Order complete!");
  });
});
