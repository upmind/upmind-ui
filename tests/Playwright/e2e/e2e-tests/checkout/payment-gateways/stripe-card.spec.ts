import { test, expect } from "@playwright/test";
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
import { URLs } from "../../../support/constants/index";

let checkout: Checkout;
let register: Registration;

test.describe("Checkout with Stripe", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    register = new Registration(page, context);
  });
  test.describe("Stripe Cards", () => {
    test.describe("Valid Cards", async () => {
      test.beforeEach(async ({ page, context }) => {
        await page.goto("/");
        await expect
          .poll(
            async () => {
              const cookies = await context.cookies();
              return cookies.some(
                c =>
                  c.name === "upm_guest_session" ||
                  c.name === "upm_client_session"
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
      for (const { name, cardNumber, expiryDate, cvcCode } of AcceptedCards) {
        test(`Accepted Stripe Cards - ${name}`, async ({ page, context }) => {
          await goToCheckout(
            page,
            context,
            products.STARTER_HOSTING,
            null,
            null
          );
          await checkout.selectPaymentMethod("Stripe");
          await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
          await checkout.clickPlaceOrderAndPay();
          await page.waitForURL(`order/**`);
          await expect(
            page.getByText("Thank you for your order.")
          ).toBeVisible();
        });
      }
    });
    test.describe("Declined Cards", async () => {
      test.beforeEach(async ({ page, context }) => {
        await page.goto("/");
        await expect
          .poll(
            async () => {
              const cookies = await context.cookies();
              return cookies.some(
                c =>
                  c.name === "upm_guest_session" ||
                  c.name === "upm_client_session"
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
      for (const { name, cardNumber, expiryDate, cvcCode } of DeclinedCards) {
        test(`Declined Stripe Cards - ${name}`, async ({ page, context }) => {
          await goToCheckout(
            page,
            context,
            products.STARTER_HOSTING,
            null,
            null
          );
          await checkout.selectPaymentMethod("Stripe");
          await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
          await checkout.clickPlaceOrderAndPay();
          await page.waitForURL(`order/**`);
          await expect(
            page.getByText(
              "Your payment attempt was unsuccessful - please try again."
            )
          ).toBeVisible();
        });
      }
    });
    test.describe("Fraud Checked Cards", async () => {
      test.beforeEach(async ({ page, context }) => {
        await page.goto("/");
        await expect
          .poll(
            async () => {
              const cookies = await context.cookies();
              return cookies.some(
                c =>
                  c.name === "upm_guest_session" ||
                  c.name === "upm_client_session"
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
      for (const { name, cardNumber, expiryDate, cvcCode } of FraudCheckCards) {
        test(`Fraud Checked Stripe Cards - ${name}`, async ({
          page,
          context
        }) => {
          await goToCheckout(
            page,
            context,
            products.STARTER_HOSTING,
            null,
            null
          );
          await checkout.selectPaymentMethod("Stripe");
          await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
          await checkout.clickPlaceOrderAndPay();
          await page.waitForURL(`order/**`);
          await expect(
            page.getByText(
              "Your payment attempt was unsuccessful - please try again."
            )
          ).toBeVisible();
        });
      }
    });
    test.describe("Invalid Cards", async () => {
      test.beforeEach(async ({ page, context }) => {
        await page.goto("/");
        await expect
          .poll(
            async () => {
              const cookies = await context.cookies();
              return cookies.some(
                c =>
                  c.name === "upm_guest_session" ||
                  c.name === "upm_client_session"
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
      for (const {
        name,
        cardNumber,
        expiryDate,
        cvcCode,
        errorText
      } of ErrorCards) {
        test(`Stripe Cards - ${name}`, async ({ page, context }) => {
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
        });
      }
    });
  });
  test.describe("SEPA Debit", () => {
    test.beforeEach(async ({ page, context }) => {
      await page.goto("/");
      await expect
        .poll(
          async () => {
            const cookies = await context.cookies();
            return cookies.some(
              c =>
                c.name === "upm_guest_session" ||
                c.name === "upm_client_session"
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
    test("Valid SEPA Debit", async ({ page, context }) => {
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
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Order confirmed")).toBeVisible();
    });
  });
  test.describe("iDEAL", async () => {
    test.beforeEach(async ({ page, context }) => {
      await page.goto("/");
      await expect
        .poll(
          async () => {
            const cookies = await context.cookies();
            return cookies.some(
              c =>
                c.name === "upm_guest_session" ||
                c.name === "upm_client_session"
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
    test("Successful iDEAL payment", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "EUR");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputIdealDetails(
        "nathan.robinson+ideal@upmind.com",
        "Test User"
      );
      await checkout.clickPlaceOrderAndPay();
      await page.getByTestId("authorize-test-payment-button").click();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Thank you for your order.")).toBeVisible();
    });
    test("Failed iDEAL payment", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "EUR");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputIdealDetails(
        "nathan.robinson+ideal@upmind.com",
        "Test User"
      );
      await checkout.clickPlaceOrderAndPay();
      await page.getByTestId("fail-test-payment-button").click();
      await page.waitForURL(`order/**`);
      await expect(
        page.getByText(
          "Your payment attempt was unsuccessful - please try again."
        )
      ).toBeVisible();
    });
  });
  test.describe("Stripe Errors", async () => {
    test.beforeEach(async ({ page, context }) => {
      await page.goto("/");
      await expect
        .poll(
          async () => {
            const cookies = await context.cookies();
            return cookies.some(
              c =>
                c.name === "upm_guest_session" ||
                c.name === "upm_client_session"
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
    test("Mock Stripe Card Decline", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await checkout.selectPaymentMethod("Stripe");
      await mockStripeCardDecline(page);
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForLoadState("load");
      await expect(page.getByRole("alert")).toContainText(
        "Your card was declined. Your request was in live mode, but used a known test card."
      );
    });
    test("Insufficient Payment Amount", async ({ page, context }) => {
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
    });
  });
});
