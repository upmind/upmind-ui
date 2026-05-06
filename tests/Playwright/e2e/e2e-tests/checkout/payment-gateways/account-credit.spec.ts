import { newUser, expect } from "../../../support/fixtures/auth-context";
import { goToCheckout } from "../../../support/flows/checkout";
import { mockWalletBalance } from "../../../support/mocks/wallet";
import { products } from "../../../support/constants/products";

newUser.describe("Account Credit at Checkout", () => {
  //TODO: Add tests for mixed payment types e.g. account credit + stripe
  newUser.describe("Account Credit displayed at Checkout", () => {
    newUser(
      "Account credit section is visible when client has wallet balance",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, { ownedAmount: 5 });
        await goToCheckout(page, context, products.STARTER_HOSTING);
        await expect(checkout.accountCredit).toBeVisible();
        await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
      }
    );

    newUser(
      "Account credit section is NOT visible when wallet balance is zero",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, { ownedAmount: 0, creditAmount: 0 });
        await goToCheckout(page, context, products.STARTER_HOSTING);
        await expect(checkout.accountCredit).toBeHidden();
        await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
      }
    );

    newUser(
      "Account credit section displays with owned + credit amounts",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, { ownedAmount: 10, creditAmount: 5 });
        await goToCheckout(page, context, products.STARTER_HOSTING);
        await expect(checkout.accountCredit).toBeVisible();
        await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
      }
    );
  });

  newUser.describe("Account Credit interaction", () => {
    newUser(
      "Account credit checkbox can be toggled",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, { ownedAmount: 5 });
        await goToCheckout(page, context, products.STARTER_HOSTING);
        await expect(checkout.accountCredit).toHaveAttribute(
          "data-state",
          "on"
        );
        await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
        await checkout.accountCredit.click();
        await expect(checkout.accountCredit).toHaveAttribute(
          "data-state",
          "off"
        );
        await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
        await checkout.accountCredit.click();
        await expect(checkout.accountCredit).toHaveAttribute(
          "data-state",
          "on"
        );
        await expect(page.getByTestId("form-item-gateway-id")).toBeVisible();
      }
    );
  });
});
