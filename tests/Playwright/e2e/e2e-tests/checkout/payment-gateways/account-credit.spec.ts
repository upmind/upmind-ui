import { newUser, expect } from "../../../support/fixtures/auth-context";
import { goToCheckout } from "../../../support/flows/checkout";
import { mockWalletBalance } from "../../../support/mocks/wallet";
import { products } from "../../../support/constants/products";
import { waitForCalculateResponse } from "../../../support/helpers/checkout";

newUser.describe("Account Credit at Checkout", () => {
  //TODO: Add tests for mixed payment types e.g. account credit + stripe
  newUser.describe("Account Credit displayed at Checkout", () => {
    newUser(
      "Account credit section is visible when client has wallet balance",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, { ownedAmount: 5 });
        await goToCheckout(page, products.STARTER_HOSTING);
        await expect(checkout.accountCredit).toBeVisible();
        await expect(
          page
            .getByTestId("form-item")
            .and(page.locator(`[data-test-value="gateway-id"]`))
        ).toBeVisible();
      }
    );

    newUser(
      "Account credit section is NOT visible when wallet balance is zero",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, { ownedAmount: 0, creditAmount: 0 });
        await goToCheckout(page, products.STARTER_HOSTING);
        await expect(checkout.accountCredit).toBeHidden();
        await expect(
          page
            .getByTestId("form-item")
            .and(page.locator(`[data-test-value="gateway-id"]`))
        ).toBeVisible();
      }
    );

    newUser(
      "Account credit section displays with owned + credit amounts",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, { ownedAmount: 10, creditAmount: 5 });
        await goToCheckout(page, products.STARTER_HOSTING);
        await expect(checkout.accountCredit).toBeVisible();
        await expect(
          page
            .getByTestId("form-item")
            .and(page.locator(`[data-test-value="gateway-id"]`))
        ).toBeVisible();
      }
    );
  });

  // FE-2791: real-data slice. Unlike the presence/zero cases above (which only
  // need the balance mocked to reach the UI), this proves the credit total is
  // formatted end-to-end WITHOUT the retired `cart/calculate` mock — it hits
  // staging through the real `useCalculate`, and the asserted amount is read
  // back from that live response, never a hardcoded currency literal.
  newUser.describe(
    "Account credit total via real cart/calculate @FE-2791",
    () => {
      newUser(
        "Credit total is formatted from the live cart/calculate response",
        async ({ page, context, checkout }) => {
          const ownedAmount = 7;
          const creditAmount = 3;

          // Only the balance is a settings mock; cart/calculate reaches staging.
          mockWalletBalance(context, { ownedAmount, creditAmount });

          // payment-details.services formats the credit via
          // `calculate(currencyId, [owned, credit])` (sum-mode), so the credit
          // calc is the POST whose request payload `prices` are exactly the owned
          // and credit amounts. Keying on that INPUT (which the test controls) —
          // rather than on the response `total` — survives staging returning
          // minor units, applying currency conversion, or changing the sum
          // contract, any of which would silently break a response-keyed match.
          const calcResponse = waitForCalculateResponse(
            page,
            prices =>
              Array.isArray(prices) &&
              prices.length === 2 &&
              prices.includes(ownedAmount) &&
              prices.includes(creditAmount),
            { timeout: 45000 }
          );

          await goToCheckout(page, products.STARTER_HOSTING);
          await expect(checkout.accountCredit).toBeVisible();

          const body = await (await calcResponse).json();
          const formattedTotal: string = body?.data?.total_formatted ?? "";

          // The endpoint really answered (no mock short-circuit) and the section
          // renders the total it returned — derived from the API, not a literal.
          expect(formattedTotal).toBeTruthy();
          await expect(checkout.accountCredit).toContainText(formattedTotal);
        }
      );
    }
  );

  newUser.describe("Account Credit interaction", () => {
    newUser(
      "Account credit checkbox can be toggled",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, { ownedAmount: 5 });
        await goToCheckout(page, products.STARTER_HOSTING);
        await expect(checkout.accountCredit).toHaveAttribute(
          "data-state",
          "on"
        );
        await expect(
          page
            .getByTestId("form-item")
            .and(page.locator(`[data-test-value="gateway-id"]`))
        ).toBeVisible();
        await checkout.accountCredit.click();
        await expect(checkout.accountCredit).toHaveAttribute(
          "data-state",
          "off"
        );
        await expect(
          page
            .getByTestId("form-item")
            .and(page.locator(`[data-test-value="gateway-id"]`))
        ).toBeVisible();
        await checkout.accountCredit.click();
        await expect(checkout.accountCredit).toHaveAttribute(
          "data-state",
          "on"
        );
        await expect(
          page
            .getByTestId("form-item")
            .and(page.locator(`[data-test-value="gateway-id"]`))
        ).toBeVisible();
      }
    );
  });
});
