import { expect, test } from "@playwright/test";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { goToCheckout } from "../../support/flows/checkout";
import { products } from "../../support/constants/products";
import {
  getClientToken,
  getSessionToken,
  registerClient
} from "../../support/api/index";

let checkout: Checkout;

test.describe("Checkout with Pay Later", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    await page.goto("/");
    await expect
      .poll(
        async () => {
          const cookies = await context.cookies();
          return cookies.some(
            c =>
              c.name === "upm_guest_session" || c.name === "upm_client_session"
          );
        },
        { timeout: 30000 }
      )
      .toBeTruthy();
    let guestToken = await getSessionToken(context);
    let user = await registerClient(guestToken);
    let username = user.email;
    let password = user.password;
    await getClientToken(page, username, password);
  });
  test("Pay with Offline payment", async ({ page, context }) => {
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await page.waitForLoadState("domcontentloaded");
    await checkout.selectPaymentMethod("Pay Later");
    await checkout.clickPlaceOrder();
    await expect(page.getByRole("dialog")).toContainText(
      "Converting your order"
    );
    await expect(page.getByRole("dialog")).toContainText(
      "Thank you for your order."
    );
  });
});
