import { test, expect, Page } from "@playwright/test";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import { Registration } from "../../../support/page-objects/templates/Registration";
import {
  goToCheckout,
  mockWalletBalance
} from "../../../support/utils/apiHelper";
import { products } from "../../../support/constants/products";

let checkout: Checkout;
let registration: Registration;

async function validCheckoutState(page: Page) {
  await expect(await checkout.getPaymentMethod("Stripe")).toHaveAttribute(
    "data-state",
    "checked"
  );
  await expect(
    page.locator('iframe[title="Secure payment input frame"]')
  ).toBeVisible();
  await expect(checkout.placeOrderAndPay).toBeVisible();
  return true;
}

test.describe("Account Credit at Checkout", () => {
  test.beforeEach(({ page, context }) => {
    checkout = new Checkout(page);
    registration = new Registration(page, context);
  });

  test.describe("Account Credit displayed at Checkout", () => {
    test("Account credit section is visible when client has wallet balance", async ({
      page,
      context
    }) => {
      mockWalletBalance(context, { ownedAmount: 5 });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await registration.inputRegistration();
      await expect(checkout.accountCreditCheckbox).toBeVisible();
      await expect(await validCheckoutState(page)).toBe(true);
    });

    test("Account credit section is NOT visible when wallet balance is zero", async ({
      page,
      context
    }) => {
      mockWalletBalance(context, { ownedAmount: 0, creditAmount: 0 });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await registration.inputRegistration();
      await expect(checkout.accountCreditCheckbox).toBeHidden();
      await expect(await validCheckoutState(page)).toBe(true);
    });

    test("Account credit section displays with owned + credit amounts", async ({
      page,
      context
    }) => {
      mockWalletBalance(context, { ownedAmount: 10, creditAmount: 5 });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await registration.inputRegistration();
      await expect(checkout.accountCreditCheckbox).toBeVisible();
      await expect(await validCheckoutState(page)).toBe(true);
    });
  });

  test.describe("Account Credit interaction", () => {
    test("Account credit checkbox can be toggled", async ({
      page,
      context
    }) => {
      mockWalletBalance(context, { ownedAmount: 5 });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await registration.inputRegistration();
      await expect(checkout.accountCreditCheckbox).toHaveAttribute(
        "data-state",
        "on"
      );
      await checkout.accountCreditCheckbox.click();
      await expect(checkout.accountCreditCheckbox).toHaveAttribute(
        "data-state",
        "off"
      );
      await expect(await validCheckoutState(page)).toBe(true);
      await checkout.accountCreditCheckbox.click();
      await expect(checkout.accountCreditCheckbox).toHaveAttribute(
        "data-state",
        "on"
      );
      await expect(await validCheckoutState(page)).toBe(true);
    });
  });
});
