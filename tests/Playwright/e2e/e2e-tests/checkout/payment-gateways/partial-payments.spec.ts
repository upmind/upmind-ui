import { test, expect } from "@playwright/test";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import { Registration } from "../../../support/page-objects/templates/Registration";
import { payPalDetails } from "../../../support/secrets/paypal";

let checkout: Checkout;
let registration: Registration;

test.describe("Partial payment at Checkout", () => {
  test.beforeEach(({ page, context }) => {
    checkout = new Checkout(page);
    registration = new Registration(page, context);
  });
  test.describe("Partial Payments with Stripe", () => {
    test("Partial Payment in base Currency (GBP)", async ({ page }) => {
      await checkout.goToCheckout(null, null);
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await page.waitForLoadState("load");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.confirmAmountButton.click();
      await expect(checkout.payAmount).toHaveText("Pay £20.00");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickPlaceOrderAndPay();
      await checkout.dialogWindow.waitFor();
      await expect(checkout.dialogWindow).toContainText("Order complete!");
    });
    test("Partial Payment in foreign currency (AUD)", async ({ page }) => {
      await checkout.goToCheckout(null, "AUD");
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await page.waitForLoadState("load");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("100");
      await checkout.confirmAmountButton.click();
      await expect(checkout.payAmount).toHaveText("Pay A$100.00");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickPlaceOrderAndPay();
      await checkout.dialogWindow.waitFor();
      await expect(checkout.dialogWindow).toContainText("Order complete!");
    });
    test("Partial payment with promo (GBP)", async ({ page }) => {
      await checkout.goToCheckout("genericpromo", null);
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await page.waitForLoadState("load");
      await expect(checkout.payAmount).toHaveText("Pay £57.60");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.confirmAmountButton.click();
      await expect(checkout.payAmount).toHaveText("Pay £20.00");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickPlaceOrderAndPay();
      await checkout.dialogWindow.waitFor();
      await expect(checkout.dialogWindow).toContainText("Order complete!");
    });
    test("Partial payment with promo (AUD)", async ({ page }) => {
      await checkout.goToCheckout("genericpromo", "AUD");
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await page.waitForLoadState("load");
      await expect(checkout.payAmount).toHaveText("Pay A$138.24");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("100");
      await checkout.confirmAmountButton.click();
      await expect(checkout.payAmount).toHaveText("Pay A$100.00");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/34", "123");
      await checkout.clickPlaceOrderAndPay();
      await checkout.dialogWindow.waitFor();
      await expect(checkout.dialogWindow).toContainText("Order complete!");
    });
  });
  test.describe("Partial Payments with PayPal", () => {
    test("Partial Payment in base Currency (GBP)", async ({ page }) => {
      await checkout.goToCheckout(null, null);
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await page.waitForLoadState("load");
      await expect(checkout.payAmount).toHaveText("Pay £72.00");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.confirmAmountButton.click();
      await expect(checkout.payAmount).toHaveText("Pay £20.00");
      await checkout.selectPaymentMethod("Pay-Pal Express");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL(
        "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&useraction=commit**"
      );
      await page
        .getByPlaceholder("Email address or mobile number")
        .fill(payPalDetails.user);
      await page.getByPlaceholder("Password").fill(payPalDetails.password);
      await page.click("#btnLogin");
      await page.getByTestId("submit-button-initial").click();
      await page.waitForURL(`http://qa-automation.local:5173/order/**`);
      await checkout.dialogWindow.waitFor();
      await expect(checkout.dialogWindow).toContainText("Order complete!");
    });
    test("Partial Payment in foreign currency (AUD)", async ({ page }) => {
      await checkout.goToCheckout(null, "AUD");
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await page.waitForLoadState("load");
      await expect(checkout.payAmount).toHaveText("Pay A$172.80");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.confirmAmountButton.click();
      await expect(checkout.payAmount).toHaveText("Pay A$20.00");
      await checkout.selectPaymentMethod("Pay-Pal Express");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL(
        "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&useraction=commit**"
      );
      await page
        .getByPlaceholder("Email address or mobile number")
        .fill(payPalDetails.user);
      await page.getByPlaceholder("Password").fill(payPalDetails.password);
      await page.click("#btnLogin");
      await page.getByTestId("submit-button-initial").click();
      await page.waitForURL(`http://qa-automation.local:5173/order/**`);
      await checkout.dialogWindow.waitFor();
      await expect(checkout.dialogWindow).toContainText("Order complete!");
    });
    test("Partial payment with promo (GBP)", async ({ page }) => {
      await checkout.goToCheckout("genericpromo", null);
      await registration.inputRegistration();
      await page.waitForLoadState("load");
      await expect(checkout.payAmount).toHaveText("Pay £57.60");
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.confirmAmountButton.click();
      await expect(checkout.payAmount).toHaveText("Pay £20.00");
      await checkout.selectPaymentMethod("Pay-Pal Express");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL(
        "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&useraction=commit**"
      );
      await page
        .getByPlaceholder("Email address or mobile number")
        .fill(payPalDetails.user);
      await page.getByPlaceholder("Password").fill(payPalDetails.password);
      await page.click("#btnLogin");
      await page.getByTestId("submit-button-initial").click();
      await page.waitForURL(`http://qa-automation.local:5173/order/**`);
      await checkout.dialogWindow.waitFor();
      await expect(checkout.dialogWindow).toContainText("Order complete!");
    });
  });
  test.describe("Partial payment using Account Credit", () => {
    // Going to take some brainpower to solve this one - need to find
    test("Partial Payment in base Currency (GBP)", async ({ page }) => {}); // a way to get around credit limit being used up in every test
    test("Partial Payment in foreign currency (INR)", async ({ page }) => {}); // (making a fresh user every time will require limit setting every time)
    test("Partial payment with promo (GBP)", async ({ page }) => {});
  });
});
