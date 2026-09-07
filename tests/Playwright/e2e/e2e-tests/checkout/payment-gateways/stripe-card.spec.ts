import { newUser, expect } from "../../../support/fixtures/auth-context";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { goToCheckout } from "../../../support/flows/checkout";
import { mockStripeCardDecline } from "../../../support/mocks/checkout";
import { Registration } from "../../../support/page-objects/templates/registration";
import { AcceptedCards } from "../../../support/constants/checkout/payment-cards/AcceptedCards";
import { DeclinedCards } from "../../../support/constants/checkout/payment-cards/DeclinedCards";
import { FraudCheckCards } from "../../../support/constants/checkout/payment-cards/FraudChecks";
import { ErrorCards } from "../../../support/constants/checkout/payment-cards/InvalidData";
import { products } from "../../../support/constants/products";
import { gateways } from "../../../support/constants/gateways";
import { TEST_EMAILS } from "../../../support/constants/test-data";
import {
  CARD_PAYMENT_TIMEOUT,
  OFFSITE_PAYMENT_TIMEOUT
} from "../../../support/constants/timeouts";

newUser.describe.configure({ mode: "parallel" });

// Every test in this file is a real staging card journey: 83 API calls and
// 42-53s of round-trips, against a 60s global ceiling that leaves under 7s of
// headroom. Six-way parallel load tipped the slowest past it, and Playwright
// grades a timeout as a failure. Serial mode is not the answer — it aborts the
// whole describe on the first slow test, so one timeout skipped 17 others.
// The budget is what is wrong, so the budget is what this fixes.
newUser.setTimeout(CARD_PAYMENT_TIMEOUT);
newUser.describe("Checkout with Stripe", () => {
  newUser.describe("Stripe Cards", () => {
    newUser.describe("Valid Cards", async () => {
      for (const { name, cardNumber, expiryDate, cvcCode } of AcceptedCards) {
        newUser(
          `Accepted Stripe Cards - ${name}`,
          async ({ page, checkout }) => {
            await goToCheckout(page, products.STARTER_HOSTING, null, null);
            // Capture the placement mutation: a card success must POST
            // /api/payments carrying the Stripe gateway_id and a positive
            // amount — not just land on the confirmation page.
            const payments = await checkout.interceptPaymentResponse();
            await checkout.selectGatewayByType(gateways.STRIPE);
            await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
            await checkout.clickCompleteCheckout();
            await expect(
              page.getByTestId("order-confirmation-heading")
            ).toBeVisible();
            const placement = payments.find(
              p => p.method === "POST" && p.request
            );
            expect(
              placement,
              "no POST /api/payments captured on placement"
            ).toBeTruthy();
            expect(placement?.request?.gateway_id).toBeTruthy();
            expect(Number(placement?.request?.amount)).toBeGreaterThan(0);
          }
        );
      }
    });
    newUser.describe("Declined Cards", async () => {
      for (const { name, cardNumber, expiryDate, cvcCode } of DeclinedCards) {
        newUser(
          `Declined Stripe Cards - ${name}`,
          async ({ page, checkout }) => {
            await goToCheckout(page, products.STARTER_HOSTING, null, null);
            await checkout.selectGatewayByType(gateways.STRIPE);
            await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
            await checkout.clickCompleteCheckout();
            await expect(
              page.getByTestId("confirmation-payment-alert")
            ).toHaveAttribute("data-test-value", "failed");
          }
        );
      }
    });
    newUser.describe("Fraud Checked Cards", async () => {
      for (const { name, cardNumber, expiryDate, cvcCode } of FraudCheckCards) {
        newUser(
          `Fraud Checked Stripe Cards - ${name}`,
          async ({ page, checkout }) => {
            await goToCheckout(page, products.STARTER_HOSTING, null, null);
            await checkout.selectGatewayByType(gateways.STRIPE);
            await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
            await checkout.clickCompleteCheckout();
            await expect(
              page.getByTestId("confirmation-payment-alert")
            ).toHaveAttribute("data-test-value", "failed");
          }
        );
      }
    });
    newUser.describe("Invalid Cards", async () => {
      for (const {
        name,
        cardNumber,
        expiryDate,
        cvcCode,
        errorText
      } of ErrorCards) {
        newUser(`Stripe Cards - ${name}`, async ({ page, checkout }) => {
          await goToCheckout(page, products.STARTER_HOSTING, null, null);
          await checkout.selectGatewayByType(gateways.STRIPE);
          await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
          // The behaviour under test: an invalid or incomplete element never
          // takes the gateway to `available.valid`, so Place Order stays
          // disabled (PaymentDetails.vue `:disabled="hasSelectedGateway &&
          // !isValid"`) and no payment is ever attempted.
          await expect(checkout.completeCheckout).toBeDisabled();
          // Stripe's own inline message, where the element shows one on input.
          if (errorText) {
            const stripeFrame = page.frameLocator(
              'iframe[title="Secure payment input frame"]'
            );
            await expect(stripeFrame.getByRole("alert")).toContainText(
              errorText
            );
          }
        });
      }
    });
  });
  newUser.describe("SEPA Debit", () => {
    newUser("Valid SEPA Debit", async ({ page, checkout }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, "EUR");
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputSepaDetails(
        "GB82WEST12345698765432",
        TEST_EMAILS.sepa,
        "Test User",
        "10 Downing Street",
        "London",
        "SW1A 2AA"
      );
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
  });
  newUser.describe("iDEAL", async () => {
    newUser("Successful iDEAL payment", async ({ page, checkout }) => {
      // Offsite iDEAL round-trip through Stripe's hosted authorize page.
      newUser.setTimeout(OFFSITE_PAYMENT_TIMEOUT);
      await goToCheckout(page, products.STARTER_HOSTING, null, "EUR");
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.completeIdealCheckout(TEST_EMAILS.ideal, "Test User");
      // Stripe's hosted test page still marks buttons with data-testid, so
      // getByTestId (mapped to data-test-key) can't resolve them.
      await page
        .locator('[data-testid="authorize-test-payment-button"]')
        .click();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    newUser("Failed iDEAL payment", async ({ page, checkout }) => {
      // Offsite iDEAL round-trip through Stripe's hosted authorize page
      // (failure path).
      newUser.setTimeout(OFFSITE_PAYMENT_TIMEOUT);
      await goToCheckout(page, products.STARTER_HOSTING, null, "EUR");
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.completeIdealCheckout(TEST_EMAILS.ideal, "Test User");
      await page.locator('[data-testid="fail-test-payment-button"]').click();
      await expect(
        page.getByTestId("confirmation-payment-alert")
      ).toHaveAttribute("data-test-value", "failed");
    });
  });
  newUser.describe("Stripe Errors", async () => {
    newUser("Mock Stripe Card Decline", async ({ page, checkout }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await checkout.selectGatewayByType(gateways.STRIPE);
      await mockStripeCardDecline(page);
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      // A mocked decline stays on the checkout route with an inline message, so
      // that message is the terminal state — not a route change.
      const failed = page.getByTestId("order-payment-failed-message");
      await checkout.clickCompleteCheckout(() => failed.isVisible());
      await expect(failed).toBeVisible();
    });
    newUser("Insufficient Payment Amount", async ({ page, checkout }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("0.20");
      await checkout.confirmAmountButton.click();
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        "£0.20"
      );
      await checkout.selectGatewayByType(gateways.STRIPE);
      // Below the gateway minimum the gateway reports itself unavailable
      // (not a payment failure), surfacing the unavailable alert and
      // disabling Place Order rather than the payment-failed message.
      await expect(
        page.getByTestId("payment-gateway-unavailable-message")
      ).toBeVisible();
      await expect(checkout.completeCheckout).toBeDisabled();
    });
  });
});
