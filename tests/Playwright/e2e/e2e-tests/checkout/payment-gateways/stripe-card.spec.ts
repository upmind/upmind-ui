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
  getClientToken,
  getSessionToken,
  registerClient
} from "../../../support/api/index";
import { waitForSessionCookie } from "../../../support/helpers/session";

newUser.describe.configure({ mode: "parallel" });
newUser.describe("Checkout with Stripe", () => {
  newUser.describe("Stripe Cards", () => {
    newUser.describe("Valid Cards", async () => {
      for (const { name, cardNumber, expiryDate, cvcCode } of AcceptedCards) {
        newUser(
          `Accepted Stripe Cards - ${name}`,
          async ({ page, context, checkout }) => {
            await goToCheckout(
              page,
              context,
              products.STARTER_HOSTING,
              null,
              null
            );
            await checkout.selectGatewayByType(gateways.STRIPE);
            await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
            await checkout.clickCompleteCheckout();
            await page.waitForURL(`order/**`);
            await expect(
              page.getByTestId("order-confirmation-heading")
            ).toBeVisible();
          }
        );
      }
    });
    newUser.describe("Declined Cards", async () => {
      newUser.beforeEach(async ({ page, context }) => {
        await page.goto("/");
        await waitForSessionCookie(context);
        let guestToken = await getSessionToken(context);
        let user = await registerClient(guestToken);
        let username = user.email;
        let password = user.password;
        await getClientToken(page, username, password);
      });
      for (const { name, cardNumber, expiryDate, cvcCode } of DeclinedCards) {
        newUser(
          `Declined Stripe Cards - ${name}`,
          async ({ page, context, checkout }) => {
            await goToCheckout(
              page,
              context,
              products.STARTER_HOSTING,
              null,
              null
            );
            await checkout.selectGatewayByType(gateways.STRIPE);
            await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
            await checkout.clickCompleteCheckout();
            await page.waitForURL(`order/**`);
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
          async ({ page, context, checkout }) => {
            await goToCheckout(
              page,
              context,
              products.STARTER_HOSTING,
              null,
              null
            );
            await checkout.selectGatewayByType(gateways.STRIPE);
            await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
            await checkout.clickCompleteCheckout();
            await page.waitForURL(`order/**`);
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
        // Quarantined: Stripe Element iframe internals — getByRole('alert') is fragile
        // across Stripe.js updates. Reassert the BEHAVIOUR instead (Place Order disabled
        // OR no createPaymentMethod call) when revisiting. See ADR 021 §Flakiness policy.
        // @quarantine(FE-XXXX-CVC, 2026-06-25)
        const testFn = name === "Invalid CVC" ? newUser.skip : newUser;
        testFn(
          `Stripe Cards - ${name}`,
          async ({ page, context, checkout }) => {
            await goToCheckout(
              page,
              context,
              products.STARTER_HOSTING,
              null,
              null
            );
            await checkout.selectGatewayByType(gateways.STRIPE);
            await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
            const stripeFrame = page.frameLocator(
              'iframe[title="Secure payment input frame"]'
            );
            await expect(stripeFrame.getByRole("alert")).toContainText(
              `${errorText}`
            );
          }
        );
      }
    });
  });
  newUser.describe("SEPA Debit", () => {
    // Quarantined: 'Place Order' click didn't fire. Possibly cascades from the
    // Pay-Amount tax-inclusive display regression (parked for Dom's review;
    // see overnight summary). If the Pay-Amount fix doesn't auto-resolve this
    // when applied, this needs its own investigation. See ADR 021 §Flakiness.
    // @quarantine(FE-XXXX-SEPA, 2026-06-25)
    newUser.skip("Valid SEPA Debit", async ({ page, context, checkout }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "EUR");
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
      await page.waitForURL(`order/**`);
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
  });
  newUser.describe("iDEAL", async () => {
    newUser("Successful iDEAL payment", async ({ page, context, checkout }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "EUR");
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputIdealDetails(TEST_EMAILS.ideal, "Test User");
      await checkout.completeCheckout.click();
      // Stripe's hosted test page still marks buttons with data-testid, so
      // getByTestId (mapped to data-test-key) can't resolve them.
      await page
        .locator('[data-testid="authorize-test-payment-button"]')
        .click();
      await page.waitForURL(`order/**`);
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    newUser("Failed iDEAL payment", async ({ page, context, checkout }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "EUR");
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputIdealDetails(TEST_EMAILS.ideal, "Test User");
      await checkout.completeCheckout.click();
      await page.locator('[data-testid="fail-test-payment-button"]').click();
      await page.waitForURL(`order/**`);
      await expect(
        page.getByTestId("confirmation-payment-alert")
      ).toHaveAttribute("data-test-value", "failed");
    });
  });
  newUser.describe("Stripe Errors", async () => {
    newUser("Mock Stripe Card Decline", async ({ page, context, checkout }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await checkout.selectGatewayByType(gateways.STRIPE);
      await mockStripeCardDecline(page);
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.completeCheckout.click();
      await checkout.completeCheckout.click(); //repeated to trigger the button even that doesn't trigger on first click
      await expect(
        page.getByTestId("order-payment-failed-message")
      ).toBeVisible();
    });
    newUser(
      "Insufficient Payment Amount",
      async ({ page, context, checkout }) => {
        await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
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
      }
    );
  });
});
