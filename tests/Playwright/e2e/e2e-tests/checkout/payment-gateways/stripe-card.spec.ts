import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../../support/constants/urls";
import {
  getCurrentOrderId,
  addProductToOrder
} from "../../../support/utils/functions/basket";
import { getSessionToken } from "../../../support/utils/functions/tokens";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import { Registration } from "../../../support/page-objects/templates/Registration";
import { AcceptedCards } from "../../../support/constants/checkout/payment-cards/AcceptedCards";
import { DeclinedCards } from "../../../support/constants/checkout/payment-cards/DeclinedCards";
import { FraudCheckCards } from "../../../support/constants/checkout/payment-cards/FraudChecks";
import { ErrorCards } from "../../../support/constants/checkout/payment-cards/InvalidData";

let checkout: Checkout;
let registration: Registration;

test.describe("Checkout with Stripe", () => {
  let token: string;
  let orderId: string | null;
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    registration = new Registration(page, context);
    await page.goto(URLs.login);
  });
  test.describe("Valid Cards", async () => {
    for (const { name, cardNumber, expiryDate, cvcCode } of AcceptedCards) {
      test(`Accepted Stripe Cards - ${name}`, async ({ page, context }) => {
        await page.goto(URLs.basket);
        await page.waitForLoadState("networkidle");
        token = await getSessionToken(context, "guest");
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
        await page.goto(URLs.basket);
        await page.waitForLoadState("networkidle");
        await page.goto(URLs.checkout);
        await registration.inputRegistration();
        await checkout.manuallyInputAddress(
          `${fakerEN_GB.location.streetAddress()}`,
          `${fakerEN_GB.location.streetAddress()}`,
          `${fakerEN_GB.location.city()}`,
          "HU15 1EG",
          null
        );
        await checkout.selectPaymentMethod("Stripe Payment");
        await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
        await checkout.clickPlaceOrderButton();
        await checkout.dialogWindow.waitFor();
        await expect(checkout.dialogWindow).toContainText(
          "Converting your order"
        );
        await expect(checkout.dialogWindow).toContainText(
          "Processing your payment"
        );
        await expect(checkout.dialogWindow).toContainText("Order complete!");
      });
    }
  });
  test.describe("Declined Cards", async () => {
    for (const {
      name,
      cardNumber,
      expiryDate,
      cvcCode,
      dialogText
    } of DeclinedCards) {
      test(`Declined Stripe Cards - ${name}`, async ({ page, context }) => {
        await page.goto(URLs.basket);
        await page.waitForLoadState("networkidle");
        token = await getSessionToken(context, "guest");
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
        await page.goto(URLs.basket);
        await page.waitForLoadState("networkidle");
        await page.goto(URLs.checkout);
        await registration.inputRegistration();
        await checkout.manuallyInputAddress(
          `${fakerEN_GB.location.streetAddress()}`,
          `${fakerEN_GB.location.streetAddress()}`,
          `${fakerEN_GB.location.city()}`,
          "HU15 1EG",
          null
        );
        await checkout.selectPaymentMethod("Stripe Payment");
        await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
        await checkout.clickPlaceOrderButton();
        await expect(checkout.dialogWindow).toBeVisible();
        await expect(
          checkout.dialogWindow.locator(page.getByText(`${dialogText}`))
        ).toBeVisible();
      });
    }
  });
  test.describe("Fraud Checked Cards", async () => {
    for (const {
      name,
      cardNumber,
      expiryDate,
      cvcCode,
      dialogText
    } of FraudCheckCards) {
      test(`Fraud Checked Stripe Cards - ${name}`, async ({
        page,
        context
      }) => {
        await page.goto(URLs.basket);
        await page.waitForLoadState("networkidle");
        token = await getSessionToken(context, "guest");
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
        await page.goto(URLs.basket);
        await page.waitForLoadState("networkidle");
        await page.goto(URLs.checkout);
        await registration.inputRegistration();
        await checkout.manuallyInputAddress(
          `${fakerEN_GB.location.streetAddress()}`,
          `${fakerEN_GB.location.streetAddress()}`,
          `${fakerEN_GB.location.city()}`,
          "HU15 1EG",
          null
        );
        await checkout.selectPaymentMethod("Stripe Payment");
        await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
        await checkout.clickPlaceOrderButton();
        await expect(page.getByRole("dialog")).toContainText(
          "Converting your order"
        );
        await expect(page.getByRole("dialog")).toContainText(`${dialogText}`);
      });
    }
  });
  test.describe("Invalid Cards", async () => {
    for (const {
      name,
      cardNumber,
      expiryDate,
      cvcCode,
      dialogText
    } of ErrorCards) {
      test(`Stripe Cards - ${name}`, async ({ page, context }) => {
        await page.goto(URLs.basket);
        await page.waitForLoadState("networkidle");
        token = await getSessionToken(context, "guest");
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
        await page.goto(URLs.basket);
        await page.waitForLoadState("networkidle");
        await page.goto(URLs.checkout);
        await registration.inputRegistration();
        await checkout.manuallyInputAddress(
          `${fakerEN_GB.location.streetAddress()}`,
          `${fakerEN_GB.location.streetAddress()}`,
          `${fakerEN_GB.location.city()}`,
          "HU15 1EG",
          null
        );
        await checkout.selectPaymentMethod("Stripe Payment");
        await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
        const stripeFrame = await checkout.getStripeIframe();
        await expect(stripeFrame.getByRole("alert")).toContainText(
          `${dialogText}`
        );
      });
    }
  });
});
