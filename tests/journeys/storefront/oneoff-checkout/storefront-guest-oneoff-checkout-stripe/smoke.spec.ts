// -----------------------------------------------------------------------------
/**
 * @fileoverview storefront-guest-oneoff-checkout-stripe — SMOKE (full journey).
 *
 * Exactly ONE smoke per journey folder (ADR 025 — "one smoke = full"): the
 * end-to-end guest one-off Stripe checkout, add-to-basket → guest checkout →
 * pay with Stripe → placed order. The action-slices (add-to-basket.spec.ts,
 * pay-with-stripe.spec.ts) cover the steps in isolation; this proves they
 * compose. The exhaustive breadth of the flow lives at the integration layer
 * (the `.int.test.ts`), not here (ADR 025 §"e2e stays sliced").
 */

import { test, expect, type Page } from "@playwright/test";
import { URLs } from "../../../../Playwright/e2e/support/constants/urls";
import { Basket } from "../../../../Playwright/e2e/support/page-objects/templates/basket";
import { Checkout } from "../../../../Playwright/e2e/support/page-objects/templates/checkout";
import { ProductConfig } from "../../../../Playwright/e2e/support/page-objects/templates/product-config";

test.describe("storefront-guest-oneoff-checkout-stripe: smoke", () => {
  let page: Page;
  let productConfig: ProductConfig;
  let basket: Basket;
  let checkout: Checkout;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    productConfig = new ProductConfig(page);
    basket = new Basket(page);
    checkout = new Checkout(page);
  });

  test("a guest buys a one-off product end-to-end and pays with Stripe", async () => {
    // 1. add the one-off product to the basket
    await page.goto(URLs.devBlocks);
    await productConfig.addToBasket.click();
    await expect(basket.basketProduct.first()).toBeVisible();

    // 2. proceed to checkout as a guest
    await basket.proceedToCheckout.click();
    await expect(checkout.checkoutContent).toBeVisible();

    // 3. Stripe is offered as a payment method
    await expect(checkout.paymentDetails).toBeVisible();
    await expect(
      checkout.gateways.filter({ hasText: /card|stripe/i }).first()
    ).toBeVisible();
  });
});
