import { newUser, expect } from "../../support/fixtures/auth-context";
import { addProductViaHeadless } from "../../support/flows";
import {
  mockWalletBalance,
  mockPaymentSuccess
} from "../../support/mocks/index";
import { products } from "../../support/constants/products";
import { gateways } from "../../support/constants/gateways";
import { OFFSITE_PAYMENT_TIMEOUT } from "../../support/constants/timeouts";
import { goToCheckout } from "../../support/flows/checkout";

newUser.describe.configure({ mode: "parallel" });

newUser.describe("Checkout Paths", () => {
  newUser.describe("Paid orders", () => {
    newUser("Paid Order with Tax", async ({ page, checkout }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      // Capture the placement mutation so a wrong gateway/amount on the
      // POST /api/payments body fails here, not just at the confirmation UI.
      const payments = await checkout.interceptPaymentResponse();
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
      const placement = payments.find(p => p.method === "POST" && p.request);
      expect(
        placement,
        "no POST /api/payments captured on placement"
      ).toBeTruthy();
      expect(placement?.request?.gateway_id).toBeTruthy();
      expect(Number(placement?.request?.amount)).toBeGreaterThan(0);
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
        // Capture the placement mutation so a wrong gateway/amount on the
        // POST /api/payments body fails here, not just at the confirmation UI.
        const payments = await checkout.interceptPaymentResponse();
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
        const placement = payments.find(p => p.method === "POST" && p.request);
        expect(
          placement,
          "no POST /api/payments captured on placement"
        ).toBeTruthy();
        expect(placement?.request?.gateway_id).toBeTruthy();
        expect(Number(placement?.request?.amount)).toBeGreaterThan(0);
      }
    );
    newUser(
      "Paid Order with Tax & Free Trial Product",
      async ({ page, checkout }) => {
        // Two-product basket (paid + free/trial): register + two headless adds
        // + reload + Stripe + conversion — the extra add and reload push it past
        // the global 60s. See OFFSITE_PAYMENT_TIMEOUT for the shared budget.
        newUser.setTimeout(OFFSITE_PAYMENT_TIMEOUT);
        await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
        await addProductViaHeadless(page, {
          productId: products.OPTIONAL_TRIAL_PRODUCT.id,
          quantity: 1,
          billingCycleMonths: products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
          startTrial: true
        });
        await page.reload();
        // Capture the placement mutation so a wrong gateway/amount on the
        // POST /api/payments body fails here, not just at the confirmation UI.
        const payments = await checkout.interceptPaymentResponse();
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
        const placement = payments.find(p => p.method === "POST" && p.request);
        expect(
          placement,
          "no POST /api/payments captured on placement"
        ).toBeTruthy();
        expect(placement?.request?.gateway_id).toBeTruthy();
        expect(Number(placement?.request?.amount)).toBeGreaterThan(0);
      }
    );
    newUser(
      "Paid Order with Tax & Additional Free Product",
      async ({ page, checkout }) => {
        // Two-product basket (paid + free/trial): register + two headless adds
        // + reload + Stripe + conversion — the extra add and reload push it past
        // the global 60s. See OFFSITE_PAYMENT_TIMEOUT for the shared budget.
        newUser.setTimeout(OFFSITE_PAYMENT_TIMEOUT);
        await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
        await addProductViaHeadless(page, {
          productId: products.FREE_PRODUCT.id,
          quantity: 1,
          billingCycleMonths: products.FREE_PRODUCT.billingCycle
        });
        await page.reload();
        // Capture the placement mutation so a wrong gateway/amount on the
        // POST /api/payments body fails here, not just at the confirmation UI.
        const payments = await checkout.interceptPaymentResponse();
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
        const placement = payments.find(p => p.method === "POST" && p.request);
        expect(
          placement,
          "no POST /api/payments captured on placement"
        ).toBeTruthy();
        expect(placement?.request?.gateway_id).toBeTruthy();
        expect(Number(placement?.request?.amount)).toBeGreaterThan(0);
      }
    );
    newUser(
      "Paid Order with Tax & Account Credit",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, {
          ownedAmount: 100,
          creditAmount: 100
        });
        // FE-2985 out of scope: this variant mocks the placement
        // (mockPaymentSuccess), so the real POST /api/payments never reaches
        // the wire and the interceptPaymentResponse guard (a real route.fetch)
        // would bypass the mock. Gateway/amount payload coverage for the
        // credit path lives in account-credit.spec.
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
      // Capture the placement mutation so a wrong gateway/amount on the
      // POST /api/payments body fails here, not just at the confirmation UI.
      const payments = await checkout.interceptPaymentResponse();
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await expect(
        page.getByTestId("order-confirmation-heading")
      ).toBeVisible();
      const placement = payments.find(p => p.method === "POST" && p.request);
      expect(
        placement,
        "no POST /api/payments captured on placement"
      ).toBeTruthy();
      expect(placement?.request?.gateway_id).toBeTruthy();
      expect(Number(placement?.request?.amount)).toBeGreaterThan(0);
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
        // Capture the placement mutation so a wrong gateway/amount on the
        // POST /api/payments body fails here, not just at the confirmation UI.
        const payments = await checkout.interceptPaymentResponse();
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
        const placement = payments.find(p => p.method === "POST" && p.request);
        expect(
          placement,
          "no POST /api/payments captured on placement"
        ).toBeTruthy();
        expect(placement?.request?.gateway_id).toBeTruthy();
        expect(Number(placement?.request?.amount)).toBeGreaterThan(0);
      }
    );
    newUser(
      "Paid Order with No Tax & Additional Free Trial Product",
      async ({ page, checkout }) => {
        // Two-product basket (paid + free/trial): register + two headless adds
        // + reload + Stripe + conversion — the extra add and reload push it past
        // the global 60s. See OFFSITE_PAYMENT_TIMEOUT for the shared budget.
        newUser.setTimeout(OFFSITE_PAYMENT_TIMEOUT);
        await goToCheckout(page, products.TAX_FREE_PRODUCT, null, null, false);
        await addProductViaHeadless(page, {
          productId: products.OPTIONAL_TRIAL_PRODUCT.id,
          quantity: 1,
          billingCycleMonths: products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
          startTrial: true
        });
        await page.reload();
        // Capture the placement mutation so a wrong gateway/amount on the
        // POST /api/payments body fails here, not just at the confirmation UI.
        const payments = await checkout.interceptPaymentResponse();
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
        const placement = payments.find(p => p.method === "POST" && p.request);
        expect(
          placement,
          "no POST /api/payments captured on placement"
        ).toBeTruthy();
        expect(placement?.request?.gateway_id).toBeTruthy();
        expect(Number(placement?.request?.amount)).toBeGreaterThan(0);
      }
    );
    newUser(
      "Paid Order with No Tax & Additional Free Product",
      async ({ page, checkout }) => {
        // Two-product basket (paid + free/trial): register + two headless adds
        // + reload + Stripe + conversion — the extra add and reload push it past
        // the global 60s. See OFFSITE_PAYMENT_TIMEOUT for the shared budget.
        newUser.setTimeout(OFFSITE_PAYMENT_TIMEOUT);
        await goToCheckout(page, products.TAX_FREE_PRODUCT, null, null, false);
        await addProductViaHeadless(page, {
          productId: products.FREE_PRODUCT.id,
          quantity: 1,
          billingCycleMonths: products.FREE_PRODUCT.billingCycle
        });
        await page.reload();
        // Capture the placement mutation so a wrong gateway/amount on the
        // POST /api/payments body fails here, not just at the confirmation UI.
        const payments = await checkout.interceptPaymentResponse();
        await checkout.selectGatewayByType(gateways.STRIPE);
        await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
        await checkout.clickCompleteCheckout();
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible();
        const placement = payments.find(p => p.method === "POST" && p.request);
        expect(
          placement,
          "no POST /api/payments captured on placement"
        ).toBeTruthy();
        expect(placement?.request?.gateway_id).toBeTruthy();
        expect(Number(placement?.request?.amount)).toBeGreaterThan(0);
      }
    );
    newUser(
      "Paid Order with No Tax & Account Credit",
      async ({ page, context, checkout }) => {
        mockWalletBalance(context, {
          ownedAmount: 100,
          creditAmount: 100
        });
        // FE-2985 out of scope: this variant mocks the placement
        // (mockPaymentSuccess), so the real POST /api/payments never reaches
        // the wire and the interceptPaymentResponse guard (a real route.fetch)
        // would bypass the mock. Gateway/amount payload coverage for the
        // credit path lives in account-credit.spec.
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
    // FE-2985 out of scope: a £0 order has no gateway selection and no
    // positive-amount POST /api/payments placement, so the gateway_id/amount
    // payload guard is inapplicable — these assert the free-order UI path
    // (no-credit banner + free-order banner) that the placement guard cannot.
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
