import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test-contexts";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";
import { gateways } from "../../../support/constants/gateways";
import {
  getClientToken,
  getSessionToken,
  registerClient
} from "../../../support/api/index";
import { waitForSessionCookie } from "../../../support/helpers/session";

let checkout: Checkout;

test.describe("Checkout with Bank Transfer", () => {
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
  test("Pay with Bank Transfer", async ({ page, context }) => {
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
    await checkout.clickCompleteCheckout();
    await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();
  });
});
