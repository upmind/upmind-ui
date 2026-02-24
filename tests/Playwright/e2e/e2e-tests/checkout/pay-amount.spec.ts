import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { Checkout } from "../../support/page-objects/templates/Checkout";
import { Registration } from "../../support/page-objects/templates/Registration";
import { goToCheckout } from "../../support/utils/apiHelper";
import { products } from "../../support/constants/products";

let checkout: Checkout;
let registration: Registration;

test.describe("Checkout - Pay Amount", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    registration = new Registration(page, context);
    await page.goto(URLs.login);
  });
  test.describe("Pay Amount on Checkout", async () => {
    test("Value on initial load", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await expect(checkout.payAmount).toHaveText("Pay £72.00");
    });
    test("Value with promo applied", async ({ page, context }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        "genericpromo",
        null
      );
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await expect(checkout.payAmount).toHaveText("Pay £57.60");
    });
    test("Value in alternate currency", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, "INR");
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await expect(checkout.payAmount).toHaveText("Pay ₹24,000.00");
    });
  });
  test.describe("Changing Pay Amount value", async () => {
    test("Manually update Pay Amount", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("10");
      await checkout.clickConfirmAmount();
      await expect(checkout.payAmount).toHaveText("Pay £10.00");
    });
    test("Applying a promotion which changes Pay Amount", async ({
      page,
      context
    }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await checkout.addVoucherButton.click();
      await checkout.addVoucherInput.fill("genericpromo");
      await checkout.applyVoucherButton.click();
      await expect(checkout.payAmount).toHaveText("Pay £57.60");
    });
    test("Changing currency of Pay Amount", async ({ page, context }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      await page.waitForLoadState("networkidle");
      await registration.inputRegistration();
      await expect(checkout.billingDetails).toBeVisible();
      await page
        .getByTestId("currency-selector")
        .getByTestId("button-default")
        .click();
      // Wait for dropdown to be stable then click the option
      const audOption = page.getByRole("option", { name: /AUD/i });
      await expect(audOption).toBeVisible();
      await audOption.click({ force: true });
      // Wait for the currency change to take effect (API call)
      await page.waitForLoadState("networkidle");
      // Verify the amount changed to AUD
      await expect(checkout.payAmount).toHaveText("Pay A$172.80");
    });
  });
});
