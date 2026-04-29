import { test, expect } from "@playwright/test";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { Registration } from "../../../support/page-objects/templates/registration";
import { payPalDetails } from "../../../support/secrets/paypal";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";
import {
  getClientToken,
  getSessionToken,
  registerClient
} from "../../../support/api/index";
import { waitForSessionCookie } from "../../../support/helpers/session";

let checkout: Checkout;
let register: Registration;

test.describe("Partial payment at Checkout", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    register = new Registration(page, context);
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
      await page.waitForLoadState("load");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      await expect(checkout.payAmount).toHaveText("Pay £20.00");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Thank you for your order!")).toBeVisible();
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
      await expect(checkout.payAmount).toHaveText("Pay A$100.00");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Thank you for your order!")).toBeVisible();
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
      await expect(checkout.payAmount).toHaveText("Pay £57.60");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      await expect(checkout.payAmount).toHaveText("Pay £20.00");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Thank you for your order!")).toBeVisible();
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
      await expect(checkout.payAmount).toHaveText("Pay A$131.71");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("100");
      await checkout.clickConfirmAmount();
      await expect(checkout.payAmount).toHaveText("Pay A$100.00");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Thank you for your order!")).toBeVisible();
    });
  });
  test.describe("Partial Payments with PayPal", () => {
    test("Partial Payment in base Currency (GBP)", async ({
      page,
      context
    }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await waitForSessionCookie(page.context());
      await expect(checkout.payAmount).toHaveText("Pay £72.00");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      await expect(checkout.payAmount).toHaveText("Pay £20.00");
      await checkout.selectPaymentMethod("Pay-Pal Express");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(
        "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&useraction=commit**"
      );
      await page
        .getByPlaceholder("Email address or mobile number")
        .fill(payPalDetails.user);
      await page.getByPlaceholder("Password").fill(payPalDetails.password);
      await page.click("#btnLogin");
      await page.getByTestId("submit-button-initial").click();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Thank you for your order!")).toBeVisible();
    });
    test("Partial Payment in foreign currency (AUD)", async ({
      page,
      context
    }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "AUD");
      await waitForSessionCookie(page.context());
      await expect(checkout.payAmount).toHaveText("Pay A$164.64");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      await expect(checkout.payAmount).toHaveText("Pay A$20.00");
      await checkout.selectPaymentMethod("Pay-Pal Express");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(
        "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&useraction=commit**"
      );
      await page
        .getByPlaceholder("Email address or mobile number")
        .fill(payPalDetails.user);
      await page.getByPlaceholder("Password").fill(payPalDetails.password);
      await page.click("#btnLogin");
      await page.getByTestId("submit-button-initial").click();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Thank you for your order!")).toBeVisible();
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
      await expect(checkout.payAmount).toHaveText("Pay £57.60");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      await expect(checkout.payAmount).toHaveText("Pay £20.00");
      await checkout.selectPaymentMethod("Pay-Pal Express");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(
        "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&useraction=commit**"
      );
      await page
        .getByPlaceholder("Email address or mobile number")
        .fill(payPalDetails.user);
      await page.getByPlaceholder("Password").fill(payPalDetails.password);
      await page.click("#btnLogin");
      await page.getByTestId("submit-button-initial").click();
      await page.waitForURL(`order/**`);
      await expect(page.getByText("Thank you for your order!")).toBeVisible();
    });
  });
  test.describe.skip("Partial payment using Account Credit", () => {
    // TODO: Need a way to mock the credit limit and successfully check out (real credit data would be useless after one test)
    test.skip("Partial Payment in base Currency (GBP)", async ({ page }) => {});
    test.skip("Partial Payment in foreign currency (INR)", async ({
      page
    }) => {});
    test.skip("Partial payment with promo (GBP)", async ({ page }) => {});
  });
});
