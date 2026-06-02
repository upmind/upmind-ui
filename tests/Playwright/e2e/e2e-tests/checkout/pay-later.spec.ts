import { expect, test } from "@playwright/test";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { goToCheckout } from "../../support/flows/checkout";
import { products } from "../../support/constants/products";
import {
  getClientToken,
  getSessionToken,
  registerClient
} from "../../support/api/index";
import { waitForSessionCookie } from "../../support/helpers/session";

let checkout: Checkout;

test.describe("Checkout with Pay Later", () => {
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
  test("Pay with Offline payment", async ({ page, context }) => {
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await checkout.selectPaymentMethod("Pay Later");
    await checkout.completeCheckout.click();
    await expect(page.getByText("Order confirmed")).toBeVisible();
  });
});
