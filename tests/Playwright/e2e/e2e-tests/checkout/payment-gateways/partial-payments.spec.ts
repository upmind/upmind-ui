import { test, expect } from "@playwright/test";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";
import {
  getClientToken,
  getSessionToken,
  registerClient
} from "../../../support/api/index";
import {
  expectedPayAmount,
  waitForSessionCookie
} from "../../../support/helpers";
import { gateways } from "../../../support/constants/gateways";
import { mockPaymentSuccess } from "../../../support/mocks/checkout";

let checkout: Checkout;

test.describe("Partial payment at Checkout", () => {
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
  test.describe("Partial Payments with Stripe", () => {
    test("Partial Payment in base Currency (GBP)", async ({
      page,
      context
    }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await waitForSessionCookie(page.context());
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      // £20.00 is the user's typed partial amount — literal is correct here
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        "£20.00"
      );
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`order/**`);
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    test("Partial Payment in foreign currency (AUD)", async ({
      page,
      context
    }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "AUD");
      await waitForSessionCookie(page.context());
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("100");
      await checkout.clickConfirmAmount();
      // A$100.00 is the user's typed partial amount — literal is correct here
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        "A$100.00"
      );
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`order/**`);
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    test("Partial payment with promo (GBP)", async ({ page, context }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        "genericpromo",
        null
      );
      await waitForSessionCookie(page.context());
      const preTotal = await expectedPayAmount(context);
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        preTotal
      );
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      // £20.00 is the user's typed partial amount — literal is correct here
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        "£20.00"
      );
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`order/**`);
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    test("Partial payment with promo (AUD)", async ({ page, context }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        "genericpromo",
        "AUD"
      );
      await waitForSessionCookie(page.context());
      const preTotal = await expectedPayAmount(context);
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        preTotal
      );
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("100");
      await checkout.clickConfirmAmount();
      // A$100.00 is the user's typed partial amount — literal is correct here
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        "A$100.00"
      );
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`order/**`);
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
  });
  test.describe("Partial Payments with PayPal", () => {
    // PayPal uses offsite redirect - mock the payment response per P6
    test("Partial Payment in base Currency (GBP)", async ({
      page,
      context
    }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await waitForSessionCookie(page.context());
      const preTotal = await expectedPayAmount(context);
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        preTotal
      );
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      // £20.00 is the user's typed partial amount — literal is correct here
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        "£20.00"
      );
      await checkout.selectGatewayByType(gateways.PAYPAL_EXPRESS);
      await mockPaymentSuccess(page);
      await checkout.clickCompleteCheckout();
      await page.waitForURL(/\/order\/[a-f0-9-]+/);
    });
    test("Partial Payment in foreign currency (AUD)", async ({
      page,
      context
    }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "AUD");
      await waitForSessionCookie(page.context());
      const preTotal = await expectedPayAmount(context);
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        preTotal
      );
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      // A$20.00 is the user's typed partial amount — literal is correct here
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        "A$20.00"
      );
      await checkout.selectGatewayByType(gateways.PAYPAL_EXPRESS);
      await mockPaymentSuccess(page);
      await checkout.clickCompleteCheckout();
      await page.waitForURL(/\/order\/[a-f0-9-]+/);
    });
    test("Partial payment with promo (GBP)", async ({ page, context }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        "genericpromo",
        null
      );
      await waitForSessionCookie(page.context());
      const preTotal = await expectedPayAmount(context);
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        preTotal
      );
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      // £20.00 is the user's typed partial amount — literal is correct here
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        "£20.00"
      );
      await checkout.selectGatewayByType(gateways.PAYPAL_EXPRESS);
      await mockPaymentSuccess(page);
      await checkout.clickCompleteCheckout();
      await page.waitForURL(/\/order\/[a-f0-9-]+/);
    });
  });
  // TODO: when credit-limit mocking is available, add coverage for:
  //   - Partial payment in base currency (GBP)
  //   - Partial payment in foreign currency (INR)
  //   - Partial payment with promo (GBP)
  // Real credit data is unusable in tests — it's consumed after one checkout.
});
