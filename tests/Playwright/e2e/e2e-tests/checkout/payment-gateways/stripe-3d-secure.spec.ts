import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../../support/constants/urls";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { Registration } from "../../../support/page-objects/templates/registration";
import { ThreeDSecureCards } from "../../../support/constants/checkout/payment-cards/3dSecureCards";
import { registerClientViaHeadless } from "../../../support/flows/auth-setup";
import { addProductViaHeadless } from "../../../support/flows/basket-setup";
import { gateways } from "../../../support/constants/gateways";

let checkout: Checkout;
let registration: Registration;

test.describe("3D Secure Authentication", async () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    registration = new Registration(page, context);
    await page.goto("/");
    await registerClientViaHeadless(page);
  });
  for (const { name, cardNumber, expiryDate, cvcCode } of ThreeDSecureCards) {
    test(`Stripe Cards - ${name}`, async ({ page }) => {
      await page.goto(URLs.basket);
      const { basketId: orderId } = await addProductViaHeadless(page, {
        productId: "3de78642-de53-9714-76df-21208469530d",
        billingCycleMonths: 24,
        provisionFields: {
          domain: `${fakerEN_GB.string.alphanumeric({
            length: { min: 3, max: 15 }
          })}.com`
        }
      });
      await page.goto(URLs.checkout);
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
      await checkout.clickCompleteCheckout();
      page.on("framenavigated", async frame => {
        const url = frame.url();
        if (url.startsWith("https://hooks.stripe.com/3d_secure_2/hosted")) {
          let returnUrl = `http://qa-automation.local:5173/order/${orderId}/?payment_success=true`;
          await page.goto(returnUrl);
          await expect(page).toHaveURL(/payment_success=true/);
          await expect(
            page.getByTestId("order-confirmation-heading")
          ).toBeVisible();
        } else {
          let returnUrl = `http://qa-automation.local:5173/order/${orderId}/?payment_success=false`;
          await page.goto(returnUrl);
          await expect(page).toHaveURL(/payment_success=false/);
          await expect(
            page.getByTestId("confirmation-payment-alert")
          ).toHaveAttribute("data-test-value", "failed");
        }
      });
    });
  }
});
