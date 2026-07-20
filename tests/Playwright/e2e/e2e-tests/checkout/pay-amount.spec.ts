import { test, expect } from "@playwright/test";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Registration } from "../../support/page-objects/templates/registration";
import { goToCheckout } from "../../support/flows/checkout";
import { products } from "../../support/constants/products";
import { registerClientViaHeadless } from "../../support/flows";
import { expectedPayAmount, waitForSessionCookie } from "../../support/helpers";

let checkout: Checkout;
let register: Registration;

test.describe("Checkout - Pay Amount", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    register = new Registration(page, context);
    await page.goto("/");
    await registerClientViaHeadless(page);
  });
  test.describe("Pay Amount on Checkout", async () => {
    test("Value on initial load", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      const expected = await expectedPayAmount(page);
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        expected
      );
    });
    test("Value with promo applied", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, "genericpromo", null);
      const expected = await expectedPayAmount(page);
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        expected
      );
    });
    test("Value in alternate currency", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, "INR");
      const expected = await expectedPayAmount(page);
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        expected
      );
    });
  });
  test.describe("Changing Pay Amount value", async () => {
    test("Manually update Pay Amount", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("10");
      await checkout.clickConfirmAmount();
      // UI-only by design: confirming the amount dispatches the local
      // SET_PARTIAL_PAYMENT machine event (headless usePaymentDetail.setAmount)
      // — no request fires here. The typed amount only reaches the wire at
      // placement, where partial-payments.spec.ts asserts the POST /api/payments
      // body carries it (FE-2985 mutation-chain guard); this widget test stays
      // scoped to the on-screen value.
      // £10.00 is the user's typed input — literal is correct here
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        "£10.00"
      );
    });
    test("Applying a promotion which changes Pay Amount", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      // Capture the baseline pre-promo total from the API
      const baseline = await expectedPayAmount(page);
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        baseline
      );
      // Apply promo via UI
      await checkout.addVoucherButton.click();
      await checkout.addVoucherInput.fill("genericpromo");
      await checkout.applyVoucherButton.click();
      // Promo discounted the total — verify it changed, then check API truth
      await expect(checkout.payAmount).not.toHaveAttribute(
        "data-test-value",
        baseline
      );
      const postPromo = await expectedPayAmount(page);
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        postPromo
      );
    });
    test("Changing currency of Pay Amount", async ({ page }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await expect(checkout.billingDetails).toBeVisible();
      await page.getByTestId("currency-selector-trigger").click();
      // Wait for dropdown to be stable then click the option
      const audOption = page.getByRole("option", { name: /AUD/i });
      await expect(audOption).toBeVisible();
      await audOption.click({ force: true });
      // Wait for the currency change to take effect (API call)
      await waitForSessionCookie(page.context());
      const expected = await expectedPayAmount(page);
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        expected
      );
    });
  });
});
