import { Page, expect } from "@playwright/test";
import { URLs } from "../constants/urls";
import {
  addProductViaHeadless,
  addPromotionViaHeadless,
  setBasketCurrencyViaHeadless
} from "./basket-setup";

/**
 * Seeds a product and navigates to checkout by DRIVING THE REAL basket
 * composables in-page (the shared `window.Upmind` system), optionally applying
 * a promotion code and/or setting a currency first.
 *
 * Driving the live composables means the seeded product lands in the same
 * basket singleton the app renders from — no separate API order, no session
 * cookie scrape, no stale cache. That also removes the old shared-staging
 * hazard where a sibling test's separately-created order could become
 * "current" and the checkout page would read an empty basket (the
 * BasketUnavailable dialog). We now confirm the seeded product is present in
 * `useBasket().products.value` (the live basket) before loading checkout.
 *
 * @param page - Playwright page instance (the live system lives on its window)
 * @param product - Product config with id, billingCycle, and type
 * @param promotion - Optional promotion code to apply to the basket
 * @param currency - Optional currency code to set on the basket
 * @param trialValue - Whether to start a trial
 */
export async function goToCheckout(
  page: Page,
  product: { id: string; billingCycle: number; type: string },
  promotion: string | null = null,
  currency: string | null = null,
  trialValue: boolean = false
): Promise<void> {
  if (currency !== null) {
    await setBasketCurrencyViaHeadless(page, currency);
  }

  await addProductViaHeadless(page, {
    productId: product.id,
    billingCycleMonths: product.billingCycle,
    startTrial: trialValue
  });
  if (promotion !== null) {
    await addPromotionViaHeadless(page, promotion);
  }

  await expect
    .poll(
      () =>
        page.evaluate(
          productId =>
            (window.Upmind?.useBasket().products.value ?? []).some(
              item => item.configuration?.productId === productId
            ),
          product.id
        ),
      { timeout: 30000 }
    )
    .toBeTruthy();

  await page.goto(URLs.checkout);
}
