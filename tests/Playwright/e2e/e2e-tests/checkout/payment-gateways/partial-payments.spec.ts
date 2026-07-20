import { test, expect } from "@playwright/test";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";
import { registerClientViaHeadless } from "../../../support/flows/auth-setup";
import { expectedPayAmount } from "../../../support/helpers";
import { gateways } from "../../../support/constants/gateways";
import { mockPaymentSuccess } from "../../../support/mocks/checkout";

let checkout: Checkout;

test.describe("Partial payment at Checkout", () => {
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto("/");
    await registerClientViaHeadless(page);
  });
  test.describe("Partial Payments with Stripe", () => {
    test("Partial Payment in base Currency (GBP)", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      // The typed pay-amount is held in the payment machine (SET_PARTIAL_PAYMENT
      // is a local event — no request fires on confirm), so it only reaches the
      // wire at placement. Capture that POST /api/payments to prove the £20 the
      // user typed is exactly what is charged, not just what the widget shows.
      const payments = await checkout.interceptPaymentResponse();
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
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
      const placement = payments.find(p => p.method === "POST" && p.request);
      expect(placement, "no POST /api/payments captured").toBeTruthy();
      expect(Number(placement?.request?.amount)).toBe(20);
      expect(placement?.request?.gateway_id).toBeTruthy();
    });
    test("Partial Payment in foreign currency (AUD)", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, "AUD");
      // Prove the foreign-currency partial reaches the wire as typed: the
      // placement POST must charge A$100 (the amount is carried in the invoice
      // currency, so 100 here, not a base-currency conversion).
      const payments = await checkout.interceptPaymentResponse();
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
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
      const placement = payments.find(p => p.method === "POST" && p.request);
      expect(placement, "no POST /api/payments captured").toBeTruthy();
      expect(Number(placement?.request?.amount)).toBe(100);
      expect(placement?.request?.gateway_id).toBeTruthy();
    });
    test("Partial payment with promo (GBP)", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, "genericpromo", null);
      const preTotal = await expectedPayAmount(page);
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
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    test("Partial payment with promo (AUD)", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, "genericpromo", "AUD");
      const preTotal = await expectedPayAmount(page);
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
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
  });
  test.describe("Partial Payments with PayPal", () => {
    // PayPal uses offsite redirect - mock the payment response per P6
    test("Partial Payment in base Currency (GBP)", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      const preTotal = await expectedPayAmount(page);
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
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    test("Partial Payment in foreign currency (AUD)", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, "AUD");
      const preTotal = await expectedPayAmount(page);
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
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    test("Partial payment with promo (GBP)", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, "genericpromo", null);
      const preTotal = await expectedPayAmount(page);
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
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
  });
  // TODO: when credit-limit mocking is available, add coverage for:
  //   - Partial payment in base currency (GBP)
  //   - Partial payment in foreign currency (INR)
  //   - Partial payment with promo (GBP)
  // Real credit data is unusable in tests — it's consumed after one checkout.
});
