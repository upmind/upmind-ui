import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../support/constants/Urls";
import {
  getCurrentOrderId,
  addProductToOrder,
} from "../support/utils/functions/basket";
import {
  getSessionToken,
  getClientToken,
} from "../support/utils/functions/tokens";
import { Checkout } from "../support/page-objects/templates/Checkout";
import { Logins } from "../support/constants/Logins";
import { AcceptedCards } from "../support/constants/checkout/payment-cards/AcceptedCards";
import { DeclinedCards } from "../support/constants/checkout/payment-cards/DeclinedCards";
import { FraudCheckCards } from "../support/constants/checkout/payment-cards/FraudChecks";
import { ErrorCards } from "../support/constants/checkout/payment-cards/InvalidData";

let checkout: Checkout;

test.describe("Checkout - Happy paths", async () => {
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  test("Pay with Existing Method (Stripe Card)", async ({ page, context }) => {
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
          length: { min: 3, max: 15 },
        })}.com`,
      },
      []
    );
    await page.goto(URLs.checkout);
    await page.waitForLoadState("domcontentloaded");
    await checkout.payWithExistingMethod(page);
    await expect(page.getByRole("dialog")).toContainText(
      "Converting your order"
    );
    await expect(page.getByRole("dialog")).toContainText(
      "Processing your payment"
    );
    await expect(page.getByRole("dialog")).toContainText("Order complete!");
  });
  for (const { name, cardNumber, expiryDate, cvcCode } of AcceptedCards) {
    test(`Stripe Cards - ${name}`, async ({ page, context }) => {
      await getClientToken(
        page,
        Logins.stripeCard.username,
        Logins.stripeCard.password
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
            length: { min: 3, max: 15 },
          })}.com`,
        },
        []
      );
      await page.goto(URLs.basket);
      await page.waitForTimeout(5000);
      await page.goto(URLs.checkout);
      await checkout.payWithStripeCard(page, cardNumber, expiryDate, cvcCode);
      await expect(page.getByRole("dialog")).toContainText(
        "Converting your order"
      );
      await expect(page.getByRole("dialog")).toContainText(
        "Processing your payment"
      );
      await expect(page.getByRole("dialog")).toContainText("Order complete!");
    });
  }
  test("Pay with Offline payment", async ({ page, context }) => {
    await getClientToken(
      page,
      Logins.offlinePayment.username,
      Logins.offlinePayment.password
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
          length: { min: 3, max: 15 },
        })}.com`,
      },
      []
    );
    await page.reload();
    await page.goto(URLs.checkout);
    await page.waitForLoadState("domcontentloaded");
    await checkout.payWithOfflinePayment(page);
    await expect(page.getByRole("dialog")).toContainText(
      "Converting your order"
    );
    await expect(page.getByRole("dialog")).toContainText("Order complete!");
  });
  test("Pay with Bank Transfer", async ({ page, context }) => {
    await getClientToken(
      page,
      Logins.bankTransfer.username,
      Logins.bankTransfer.password
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
          length: { min: 3, max: 15 },
        })}.com`,
      },
      []
    );
    await page.reload();
    await page.goto(URLs.checkout);
    await page.waitForLoadState("domcontentloaded");
    await checkout.payWithBankTransfer(page);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText("Order complete!");
  });
});

test.describe("Checkout - Declined Payments", async () => {
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  for (const {
    name,
    cardNumber,
    expiryDate,
    cvcCode,
    dialogText,
  } of DeclinedCards) {
    test(`Stripe Cards - ${name}`, async ({ page, context }) => {
      await getClientToken(
        page,
        Logins.stripeCard.username,
        Logins.stripeCard.password
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
            length: { min: 3, max: 15 },
          })}.com`,
        },
        []
      );
      await page.goto(URLs.basket);
      await page.waitForTimeout(5000);
      await page.goto(URLs.checkout);
      await checkout.payWithStripeCard(page, cardNumber, expiryDate, cvcCode);
      await expect(page.getByRole("dialog")).toContainText(
        "Converting your order"
      );
      await expect(page.getByRole("dialog")).toContainText(
        "Unable to process payment"
      );
      await expect(page.getByRole("dialog")).toContainText(`${dialogText}`);
    });
  }
});
test.describe("Checkout - Fraud Checks", async () => {
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  for (const {
    name,
    cardNumber,
    expiryDate,
    cvcCode,
    dialogText,
  } of FraudCheckCards) {
    test(`Stripe Cards - ${name}`, async ({ page, context }) => {
      await getClientToken(
        page,
        Logins.stripeCard.username,
        Logins.stripeCard.password
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
            length: { min: 3, max: 15 },
          })}.com`,
        },
        []
      );
      await page.goto(URLs.basket);
      await page.waitForTimeout(5000);
      await page.goto(URLs.checkout);
      await checkout.payWithStripeCard(page, cardNumber, expiryDate, cvcCode);
      await expect(page.getByRole("dialog")).toContainText(
        "Converting your order"
      );
      await expect(page.getByRole("dialog")).toContainText(`${dialogText}`);
    });
  }
});
test.describe("Checkout - Invalid Data", async () => {
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.login);
  });
  for (const {
    name,
    cardNumber,
    expiryDate,
    cvcCode,
    dialogText,
  } of ErrorCards) {
    test(`Stripe Cards - ${name}`, async ({ page, context }) => {
      await getClientToken(
        page,
        Logins.stripeCard.username,
        Logins.stripeCard.password
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
            length: { min: 3, max: 15 },
          })}.com`,
        },
        []
      );
      await page.goto(URLs.basket);
      await page.waitForTimeout(5000);
      await page.goto(URLs.checkout);
      await checkout.inputStripeDetails(page, cardNumber, expiryDate, cvcCode);
      const stripeFrame = await checkout.getStripeIframe(page);
      await expect(stripeFrame.getByRole("alert")).toContainText(
        `${dialogText}`
      );
    });
  }
});
