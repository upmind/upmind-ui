// -----------------------------------------------------------------------------
/**
 * @fileoverview storefront-guest-oneoff-checkout-stripe — SLICE: add to basket.
 *
 * One action-slice of the journey (ADR 025 — e2e stays sliced; the full journey
 * is the sibling smoke.spec.ts). A guest adds the one-off product to their
 * basket from its storefront product page and sees it reflected in the basket.
 *
 * Slices reuse the shared page-objects/flows the legacy suite uses — no
 * hand-rolled navigation (ADR 025 / FE-2839).
 */

import { test, expect, type Page } from "@playwright/test";
import { URLs } from "../../../../Playwright/e2e/support/constants/urls";
import { Basket } from "../../../../Playwright/e2e/support/page-objects/templates/basket";
import { ProductConfig } from "../../../../Playwright/e2e/support/page-objects/templates/product-config";

test.describe("storefront-guest-oneoff-checkout-stripe: add to basket", () => {
  let page: Page;
  let productConfig: ProductConfig;
  let basket: Basket;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    productConfig = new ProductConfig(page);
    basket = new Basket(page);
  });

  test("a guest adds the one-off product to their basket", async () => {
    await page.goto(URLs.devBlocks);
    await productConfig.addToBasket.click();

    // Behavioural: the basket now holds a product line and a subtotal — not a
    // URL assertion (FE-2782).
    await expect(basket.basketProduct.first()).toBeVisible();
    await expect(basket.subtotalSummary).toBeVisible();
  });
});
