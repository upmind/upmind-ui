import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../../support/constants/urls";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { Registration } from "../../../support/page-objects/templates/registration";
import { ThreeDSecureCards } from "../../../support/constants/checkout/payment-cards/3dSecureCards";
import {
  getClientToken,
  getSessionToken,
  registerClient
} from "../../../support/api/index";
import { createOrder, addProductToOrder } from "../../../support/api/basket";

let checkout: Checkout;
let registration: Registration;

test.describe("3D Secure Authentication", async () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    registration = new Registration(page, context);
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
  for (const { name, cardNumber, expiryDate, cvcCode } of ThreeDSecureCards) {
    test(`Stripe Cards - ${name}`, async ({ page, context }) => {
      await page.goto(URLs.basket);
      await page.waitForLoadState("networkidle");
      let token = await getSessionToken(context);
      let order = await createOrder(token);
      let orderId = order.id;
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
        [],
        true,
        false
      );
      await page.goto(URLs.checkout);
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
      await checkout.clickPlaceOrderAndPay();
      page.on("framenavigated", async frame => {
        const url = frame.url();
        if (url.startsWith("https://hooks.stripe.com/3d_secure_2/hosted")) {
          let returnUrl = `http://qa-automation.local:5173/order/${orderId}/?payment_success=true`;
          await page.goto(returnUrl);
          await expect(page).toHaveURL(/payment_success=true/);
          await expect(
            page.getByText("Thank you for your order.")
          ).toBeVisible();
        } else {
          let returnUrl = `http://qa-automation.local:5173/order/${orderId}/?payment_success=false`;
          await page.goto(returnUrl);
          await expect(page).toHaveURL(/payment_success=false/);
          await expect(
            page.getByText(
              "Your payment attempt was unsuccessful - please try again."
            )
          ).toBeVisible();
        }
      });
    });
  }
});
