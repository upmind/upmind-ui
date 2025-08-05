import { expect } from "@playwright/test";
import { test } from "../../support/fixtures/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import {
  getCurrentOrderId,
  addProductToOrder
} from "../../support/utils/functions/basket";
import {
  getSessionToken,
  getClientToken
} from "../../support/utils/functions/tokens";
import { Checkout } from "../../support/page-objects/templates/Checkout";
import { Logins } from "../../support/constants/logins";
import { payPalDetails } from "../../support/secrets/paypal";

let checkout: Checkout;

test.describe("Checkout with PayPal", () => {
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  test("Pay with PayPal Express", async ({ page, context }) => {
    await getClientToken(
      page,
      Logins.checkoutUser.username,
      Logins.checkoutUser.password
    );
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    const token = await getSessionToken(context, "client");
    const orderId = await getCurrentOrderId(token);
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
    await page.goto(URLs.checkout);
    await page.waitForLoadState("networkidle");
    await checkout.selectPaymentMethod("PayPal Express");
    await checkout.clickPlaceOrderButton();
    await page.waitForURL(
      "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&useraction=commit**"
    );
    await page
      .getByPlaceholder("Email address or mobile number")
      .fill(payPalDetails.user);
    await page.getByPlaceholder("Password").fill(payPalDetails.password);
    await page.click("#btnLogin");
    await page.getByTestId("submit-button-initial").click();
    await page.waitForURL(
      `http://qa-automation.local:5173/order/${orderId}?payment_success=true`
    );
    await expect(page.getByRole("dialog")).toContainText("Order complete!");
  });
});
