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
            await checkout.selectPaymentMethod("Stripe");
            await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
            await checkout.clickCompleteCheckout();
            await page.waitForURL(`order/**`);
            await expect(
              page.getByText("Thank you for your order.")
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
            await checkout.selectPaymentMethod("Stripe");
            await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
            await checkout.clickCompleteCheckout();
            await page.waitForURL(`order/**`);
            await expect(
              page.getByText(
                "Your payment attempt was unsuccessful - please try again."
              )
            ).toBeVisible();
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
            await checkout.selectPaymentMethod("Stripe");
            await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
            await checkout.clickCompleteCheckout();
            await page.waitForURL(`order/**`);
            await expect(
              page.getByText(
                "Your payment attempt was unsuccessful - please try again."
              )
            ).toBeVisible();
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
        newUser(
          `Stripe Cards - ${name}`,
          async ({ page, context, checkout }) => {
            await goToCheckout(
              page,
              context,
              products.STARTER_HOSTING,
              null,
              null
            );
            await checkout.selectPaymentMethod("Stripe");
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
    newUser("Valid SEPA Debit", async ({ page, context, checkout }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "EUR");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputSepaDetails(
        "GB82WEST12345698765432",
        "nathan.robinson+sepa@upmind.com",
        "Test User",
        "10 Downing Street",
        "London",
        "SW1A 2AA"
      );
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
  });
  newUser.describe("iDEAL", async () => {
    newUser("Successful iDEAL payment", async ({ page, context, checkout }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "EUR");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputIdealDetails(
        "nathan.robinson+ideal@upmind.com",
        "Test User"
      );
      await checkout.completeCheckout.click();
      await page.getByTestId("authorize-test-payment-button").click();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Thank you for your order.")).toBeVisible();
    });
    newUser("Failed iDEAL payment", async ({ page, context, checkout }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "EUR");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputIdealDetails(
        "nathan.robinson+ideal@upmind.com",
        "Test User"
      );
      await checkout.completeCheckout.click();
      await page.getByTestId("fail-test-payment-button").click();
      await page.waitForURL(`order/**`);
      await expect(
        page.getByText(
          "Your payment attempt was unsuccessful - please try again."
        )
      ).toBeVisible();
    });
  });
  newUser.describe("Stripe Errors", async () => {
    newUser("Mock Stripe Card Decline", async ({ page, context, checkout }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await checkout.selectPaymentMethod("Stripe");
      await mockStripeCardDecline(page);
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.completeCheckout.click();
      await checkout.completeCheckout.click(); //repeated to trigger the button even that doesn't trigger on first click
      await page.waitForLoadState("load");
      await expect(page.getByRole("alert")).toContainText(
        /Payment failed*Payment details validation failed/s
      );
    });
    newUser(
      "Insufficient Payment Amount",
      async ({ page, context, checkout }) => {
        await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
        await page.waitForLoadState("load");
        await checkout.changeAmountButton.click();
        await checkout.changeAmountInput.fill("0.20");
        await checkout.confirmAmountButton.click();
        await expect(checkout.payAmount).toHaveText("Pay £0.20");
        await checkout.selectPaymentMethod("Stripe");
        await expect(page.getByRole("alert")).toContainText(
          "Amount must be at least £0.30 gbp"
        );
      }
    );
  });
});
