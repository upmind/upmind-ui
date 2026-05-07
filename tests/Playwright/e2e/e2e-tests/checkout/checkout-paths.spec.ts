import { newUser, expect } from "../../support/fixtures/auth-context";
import { addProductToOrder, getCurrentOrder } from "../../support/api/index";
import {
  mockWalletBalance,
  mockPaymentSuccess
} from "../../support/mocks/index";
import { products } from "../../support/constants/products";
import { goToCheckout } from "../../support/flows/checkout";

newUser.describe.configure({ mode: "parallel" });

newUser.describe("Checkout Paths", () => {
  newUser.describe("Paid orders", () => {
    newUser("1.1 Paid Order with Tax", async ({ page, context, checkout }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await expect(page.getByText("Thank you for your order.")).toBeVisible();
    });
    newUser(
      "1.2 Paid Order with Tax & Partial Discount",
      async ({ page, context, checkout }) => {
        await goToCheckout(
          page,
          context,
          products.STARTER_HOSTING,
          "genericpromo",
          null,
          false
        );
        await checkout.selectPaymentMethod("Stripe");
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Thank you for your order.")).toBeVisible();
      }
    );
    newUser(
      "1.3 Paid Order with Tax & Free Trial Product",
      async ({ page, context, checkout, token }) => {
        await goToCheckout(
          page,
          context,
          products.STARTER_HOSTING,
          null,
          null,
          false
        );
        let order = await getCurrentOrder(token);
        let orderId = order?.id as string;
        await addProductToOrder(
          token,
          orderId,
          products.OPTIONAL_TRIAL_PRODUCT.id,
          1,
          products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
          [],
          [],
          {},
          [],
          true,
          true
        );
        await page.reload();
        await checkout.selectPaymentMethod("Stripe");
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Thank you for your order.")).toBeVisible();
      }
    );
    newUser(
      "1.4 Paid Order with Tax & Additional Free Product",
      async ({ page, context, checkout, token }) => {
        await goToCheckout(
          page,
          context,
          products.STARTER_HOSTING,
          null,
          null,
          false
        );
        let order = await getCurrentOrder(token);
        let orderId = order?.id as string;
        await addProductToOrder(
          token,
          orderId,
          products.FREE_PRODUCT.id,
          1,
          products.FREE_PRODUCT.billingCycle,
          [],
          [],
          {},
          [],
          true,
          false
        );
        await page.reload();
        await checkout.selectPaymentMethod("Stripe");
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Thank you for your order.")).toBeVisible();
      }
    );
    newUser(
      "1.5 Paid Order with Tax & Account Credit",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, {
          ownedAmount: 100,
          creditAmount: 100
        });
        mockPaymentSuccess(page);
        await goToCheckout(
          page,
          context,
          products.STARTER_HOSTING,
          null,
          null,
          false
        );
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Order confirmed")).toBeVisible();
      }
    );
    newUser(
      "1.6 Paid Order with No Tax",
      async ({ page, context, checkout }) => {
        await goToCheckout(
          page,
          context,
          products.TAX_FREE_PRODUCT,
          null,
          null
        );
        await checkout.selectPaymentMethod("Stripe");
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Thank you for your order.")).toBeVisible();
      }
    );
    newUser(
      "1.7 Paid Order with No Tax & Partial Discount",
      async ({ page, context, checkout }) => {
        await goToCheckout(
          page,
          context,
          products.TAX_FREE_PRODUCT,
          "genericpromo",
          null,
          false
        );
        await checkout.selectPaymentMethod("Stripe");
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Thank you for your order.")).toBeVisible();
      }
    );
    newUser(
      "1.8 Paid Order with No Tax & Additional Free Trial Product",
      async ({ page, context, checkout, token }) => {
        await goToCheckout(
          page,
          context,
          products.TAX_FREE_PRODUCT,
          null,
          null,
          false
        );
        let order = await getCurrentOrder(token);
        let orderId = order?.id as string;
        await addProductToOrder(
          token,
          orderId,
          products.OPTIONAL_TRIAL_PRODUCT.id,
          1,
          products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
          [],
          [],
          {},
          [],
          true,
          true
        );
        await page.reload();
        await checkout.selectPaymentMethod("Stripe");
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Thank you for your order.")).toBeVisible();
      }
    );
    newUser(
      "1.9 Paid Order with No Tax & Additional Free Product",
      async ({ page, context, checkout, token }) => {
        await goToCheckout(
          page,
          context,
          products.TAX_FREE_PRODUCT,
          null,
          null,
          false
        );
        let order = await getCurrentOrder(token);
        let orderId = order?.id as string;
        await addProductToOrder(
          token,
          orderId,
          products.FREE_PRODUCT.id,
          1,
          products.FREE_PRODUCT.billingCycle,
          [],
          [],
          {},
          [],
          true,
          false
        );
        await page.reload();
        await checkout.selectPaymentMethod("Stripe");
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Thank you for your order.")).toBeVisible();
      }
    );
    newUser(
      "1.10 Paid Order with No Tax & Account Credit",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, {
          ownedAmount: 100,
          creditAmount: 100
        });
        mockPaymentSuccess(page);
        await goToCheckout(
          page,
          context,
          products.TAX_FREE_PRODUCT,
          null,
          null,
          false
        );
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Order confirmed")).toBeVisible();
      }
    );
  });
  newUser.describe("Free orders", () => {
    newUser(
      "2.1 100% Promotion Applied",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, {
          ownedAmount: 10,
          creditAmount: 10
        });
        await goToCheckout(
          page,
          context,
          products.STARTER_HOSTING,
          "allfree",
          null,
          false
        );
        await expect(checkout.accountCredit).toBeHidden();
        await expect(
          page.getByText("Great news – there's nothing to pay!")
        ).toBeVisible();
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Thank you for your order.")).toBeVisible();
      }
    );
    newUser("2.2 Free Trial Product", async ({ page, context, checkout }) => {
      mockWalletBalance(context, {
        ownedAmount: 10,
        creditAmount: 10
      });
      await goToCheckout(
        page,
        context,
        products.OPTIONAL_TRIAL_PRODUCT,
        null,
        null,
        true
      );
      await expect(checkout.accountCredit).toBeHidden();
      await expect(
        page.getByText("Great news – there's nothing to pay!")
      ).toBeVisible();
      await checkout.clickCompleteCheckout();
      await expect(page.getByText("Thank you for your order.")).toBeVisible();
    });
    newUser(
      "2.3 Free Trial Product & Free Promotion Product",
      async ({ page, context, checkout, token }) => {
        mockWalletBalance(context, {
          ownedAmount: 10,
          creditAmount: 10
        });
        await goToCheckout(
          page,
          context,
          products.STARTER_HOSTING,
          "allfree",
          null,
          false
        );
        let order = await getCurrentOrder(token);
        let orderId = order?.id as string;
        await addProductToOrder(
          token,
          orderId,
          products.OPTIONAL_TRIAL_PRODUCT.id,
          1,
          products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
          [],
          [],
          {},
          [],
          true,
          true
        );
        await page.reload();
        await expect(checkout.accountCredit).toBeHidden();
        await expect(
          page.getByText("Great news – there's nothing to pay!")
        ).toBeVisible();
        await checkout.clickCompleteCheckout();
        await expect(page.getByText("Thank you for your order.")).toBeVisible();
      }
    );
  });
});
