import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test-contexts";
import { URLs } from "../../../support/constants/urls";
import { getClientToken } from "../../../support/api/auth";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { Logins } from "../../../support/constants/logins";
import { payPalDetails } from "../../../support/secrets/paypal";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";

let checkout: Checkout;

test.describe("Checkout with PayPal", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  test("Pay with PayPal Express", async ({ page, context }) => {
    await getClientToken(
      page,
      Logins.checkoutUser.username,
      Logins.checkoutUser.password
    );
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await checkout.selectPaymentMethod("Pay-Pal Express");
    await checkout.clickPlaceOrderAndPay();
    await page.waitForURL(
      "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&useraction=commit**"
    );
    await page
      .getByPlaceholder("Email address or mobile number")
      .fill(payPalDetails.user);
    await page.getByPlaceholder("Password").fill(payPalDetails.password);
    await page.click("#btnLogin");
    await page.getByTestId("submit-button-initial").click();
    await page.waitForURL(`http://qa-automation.local:5173/order/**`);
    await expect(page.getByText("Thank you for your order.")).toBeVisible();
  });
});
