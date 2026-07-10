import { newUser, expect } from "../../support/fixtures/auth-context";
import { addProductViaHeadless } from "../../support/flows";
import {
  mockWalletBalance,
  mockPaymentSuccess
} from "../../support/mocks/index";
import { products } from "../../support/constants/products";
import { gateways } from "../../support/constants/gateways";
import { goToCheckout } from "../../support/flows/checkout";

newUser.describe.configure({ mode: "parallel" });

newUser.describe("Checkout Paths", () => {
  newUser.describe("Paid orders", () => {
    newUser("Paid Order with Tax", async ({ page, checkout }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    newUser(
      "Paid Order with Tax & Partial Discount",
      async ({ page, checkout }) => {
        await goToCheckout(
          page,
          products.STARTER_HOSTING,
          "genericpromo",
          null,
          false
        );
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
      }
    );
    newUser(
      "Paid Order with Tax & Free Trial Product",
      async ({ page, checkout }) => {
        // Two-product basket (paid + free/trial): register + two headless adds
        // + reload + Stripe + conversion measurably completes (~14s idle) but
        // can exceed the global 60s under full-suite parallel load. Realistic
        // budget, not a workaround — the flow is verified end-to-end.
        newUser.setTimeout(120000);
        await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
        await addProductViaHeadless(page, {
          productId: products.OPTIONAL_TRIAL_PRODUCT.id,
          quantity: 1,
          billingCycleMonths: products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
          startTrial: true
        });
        await page.reload();
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
      }
    );
    newUser(
      "Paid Order with Tax & Additional Free Product",
      async ({ page, checkout }) => {
        // Two-product basket (paid + free/trial): register + two headless adds
        // + reload + Stripe + conversion measurably completes (~14s idle) but
        // can exceed the global 60s under full-suite parallel load. Realistic
        // budget, not a workaround — the flow is verified end-to-end.
        newUser.setTimeout(120000);
        await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
        await addProductViaHeadless(page, {
          productId: products.FREE_PRODUCT.id,
          quantity: 1,
          billingCycleMonths: products.FREE_PRODUCT.billingCycle
        });
        await page.reload();
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
      }
    );
    newUser(
      "Paid Order with Tax & Account Credit",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, {
          ownedAmount: 100,
          creditAmount: 100
        });
        mockPaymentSuccess(page);
        await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
      }
    );
    newUser("Paid Order with No Tax", async ({ page, checkout }) => {
      await goToCheckout(page, products.TAX_FREE_PRODUCT, null, null);
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    newUser(
      "Paid Order with No Tax & Partial Discount",
      async ({ page, checkout }) => {
        await goToCheckout(
          page,
          products.TAX_FREE_PRODUCT,
          "genericpromo",
          null,
          false
        );
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
      }
    );
    newUser(
      "Paid Order with No Tax & Additional Free Trial Product",
      async ({ page, checkout }) => {
        // Two-product basket (paid + free/trial): register + two headless adds
        // + reload + Stripe + conversion measurably completes (~14s idle) but
        // can exceed the global 60s under full-suite parallel load. Realistic
        // budget, not a workaround — the flow is verified end-to-end.
        newUser.setTimeout(120000);
        await goToCheckout(page, products.TAX_FREE_PRODUCT, null, null, false);
        await addProductViaHeadless(page, {
          productId: products.OPTIONAL_TRIAL_PRODUCT.id,
          quantity: 1,
          billingCycleMonths: products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
          startTrial: true
        });
        await page.reload();
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
      }
    );
    newUser(
      "Paid Order with No Tax & Additional Free Product",
      async ({ page, checkout }) => {
        // Two-product basket (paid + free/trial): register + two headless adds
        // + reload + Stripe + conversion measurably completes (~14s idle) but
        // can exceed the global 60s under full-suite parallel load. Realistic
        // budget, not a workaround — the flow is verified end-to-end.
        newUser.setTimeout(120000);
        await goToCheckout(page, products.TAX_FREE_PRODUCT, null, null, false);
        await addProductViaHeadless(page, {
          productId: products.FREE_PRODUCT.id,
          quantity: 1,
          billingCycleMonths: products.FREE_PRODUCT.billingCycle
        });
        await page.reload();
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
      }
    );
    newUser(
      "Paid Order with No Tax & Account Credit",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, {
          ownedAmount: 100,
          creditAmount: 100
        });
        mockPaymentSuccess(page);
        await goToCheckout(page, products.TAX_FREE_PRODUCT, null, null, false);
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
      }
    );
  });
  newUser.describe("Free orders", () => {
    newUser("100% Promotion Applied", async ({ page, context, checkout }) => {
      mockWalletBalance(context, {
        ownedAmount: 10,
        creditAmount: 10
      });
      await goToCheckout(
        page,
        products.STARTER_HOSTING,
        "allfree",
        null,
        false
      );
      await expect(checkout.accountCredit).toBeHidden();
      await expect(page.getByTestId("free-order-banner")).toBeVisible();
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    newUser("Free Trial Product", async ({ page, context, checkout }) => {
      mockWalletBalance(context, {
        ownedAmount: 10,
        creditAmount: 10
      });
      await goToCheckout(
        page,
        products.OPTIONAL_TRIAL_PRODUCT,
        null,
        null,
        true
      );
      await expect(checkout.accountCredit).toBeHidden();
      await expect(page.getByTestId("free-order-banner")).toBeVisible();
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
    });
    newUser(
      "Free Trial Product & Free Promotion Product",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, {
          ownedAmount: 10,
          creditAmount: 10
        });
        await goToCheckout(
          page,
          products.STARTER_HOSTING,
          "allfree",
          null,
          false
        );
        await addProductViaHeadless(page, {
          productId: products.OPTIONAL_TRIAL_PRODUCT.id,
          quantity: 1,
          billingCycleMonths: products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
          startTrial: true
        });
        await page.reload();
        await expect(checkout.accountCredit).toBeHidden();
        await expect(page.getByTestId("free-order-banner")).toBeVisible();
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
      }
    );
  });
});
