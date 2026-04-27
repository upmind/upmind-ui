import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test-contexts";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { payPalDetails } from "../../../support/secrets/paypal";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";
import {
  getClientToken,
  getSessionToken,
  registerClient
} from "../../../support/api/index";
import { waitForSessionCookie } from "../../../support/helpers/session";

let checkout: Checkout;

test.describe("Checkout with PayPal", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    await page.goto("/");
    await waitForSessionCookie(context);
    let guestToken = await getSessionToken(context);
    let user = await registerClient(guestToken);
    let username = user.email;
    let password = user.password;
    await getClientToken(page, username, password);
  });
  test("Pay with PayPal Express", async ({ page, context }) => {
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
