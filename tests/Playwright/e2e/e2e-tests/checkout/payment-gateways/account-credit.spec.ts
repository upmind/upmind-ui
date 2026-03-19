import { test, expect, Page } from "@playwright/test";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { Registration } from "../../../support/page-objects/templates/registration";
import { goToCheckout } from "../../../support/flows/checkout";
import { mockWalletBalance } from "../../../support/mocks/wallet";
import { products } from "../../../support/constants/products";

let checkout: Checkout;
let registration: Registration;

test.describe("Account Credit at Checkout", () => {
  test.beforeEach(({ page, context }) => {
    checkout = new Checkout(page);
    registration = new Registration(page, context);
  });
  //TODO: Add tests for mixed payment types e.g. account credit + stripe
  test.describe("Account Credit displayed at Checkout", () => {
    test("Account credit section is visible when client has wallet balance", async ({
      page,
      context
    }) => {
      mockWalletBalance(context, { ownedAmount: 5 });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await registration.inputRegistration();
      await expect(checkout.accountCreditCheckbox).toBeVisible();
      await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
    });

    test("Account credit section is NOT visible when wallet balance is zero", async ({
      page,
      context
    }) => {
      mockWalletBalance(context, { ownedAmount: 0, creditAmount: 0 });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await registration.inputRegistration();
      await expect(checkout.accountCreditCheckbox).toBeHidden();
      await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
    });

    test("Account credit section displays with owned + credit amounts", async ({
      page,
      context
    }) => {
      mockWalletBalance(context, { ownedAmount: 10, creditAmount: 5 });
      await goToCheckout(page, context, products.STARTER_HOSTING);
      await registration.inputRegistration();
      await expect(checkout.accountCreditCheckbox).toBeVisible();
      await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
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
      await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
      await checkout.accountCreditCheckbox.click();
      await expect(checkout.accountCreditCheckbox).toHaveAttribute(
        "data-state",
        "off"
      );
      await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
      await checkout.accountCreditCheckbox.click();
      await expect(checkout.accountCreditCheckbox).toHaveAttribute(
        "data-state",
        "on"
      );
      await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
    });
  });
});
