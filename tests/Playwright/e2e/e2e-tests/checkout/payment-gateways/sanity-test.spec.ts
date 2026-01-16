import { test, expect } from "@playwright/test";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import { goToCheckout } from "../../../support/utils/apiHelper";
import { mockStripeCardDecline } from "../../../support/utils/checkoutMocks";
import { Registration } from "../../../support/page-objects/templates/Registration";
import { AcceptedCards } from "../../../support/constants/checkout/payment-cards/AcceptedCards";
import { DeclinedCards } from "../../../support/constants/checkout/payment-cards/DeclinedCards";
import { FraudCheckCards } from "../../../support/constants/checkout/payment-cards/FraudChecks";
import { ErrorCards } from "../../../support/constants/checkout/payment-cards/InvalidData";

import { URLs } from "../../../support/constants/urls";
import { getSessionToken } from "../../../support/utils/functions/tokens";
import {
  createOrder,
  addProductToOrder,
  setOrderCurrency
} from "../../../support/utils/functions/basket";
import { products } from "../../../support/constants/products";
import { fakerEN_GB } from "@faker-js/faker";

let checkout: Checkout;
let registration: Registration;

test.describe("Valid Cards", async () => {
  test(`Accepted Stripe Cards`, async ({ page, context }) => {
    checkout = new Checkout(page);
    registration = new Registration(page, context);

    // Use the existing goToCheckout helper which handles the full flow
    await goToCheckout(page, context, null, null);
    await registration.inputRegistration();
    await checkout.selectPaymentMethod("Stripe");
    await checkout.inputStripeDetails("4242424242424242", "01/30", "123");
    await checkout.clickPlaceOrderAndPay();
    await checkout.dialogWindow.waitFor();
    await expect(checkout.dialogWindow).toContainText("Converting your order");
    await expect(checkout.dialogWindow).toContainText("Order complete!");
  });
});
