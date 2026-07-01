import { BrowserContext, Page, expect } from "@playwright/test";
import { URLs } from "../constants/urls";
import { getSessionToken } from "../api/auth";
import {
  createOrder,
  Order,
  addProductToOrder,
  addPromotionToOrder,
  getCurrentOrder,
  setOrderCurrency
} from "../api/basket";
import { waitForSessionCookie } from "../helpers/session";
import { some } from "lodash-es";

/**
 * Creates an order with a product and navigates to checkout.
 * Optionally registers a new client via the API, applies a promotion code,
 * and/or sets a specific currency.
 *
 * When `register` is true (default), a new client account is registered via
 * the API after creating the order — skipping the UI registration page entirely.
 * This is faster and avoids CDP hangs caused by the registration UI.
 *
 * @param page - Playwright page instance
 * @param context - Browser context (used to read the session token)
 * @param product - Product config with id, billingCycle, and type
 * @param promotion - Optional promotion code to apply to the order
 * @param currency - Optional currency code to set on the order
 * @param trialValue - Whether to start a trial
 */
export async function goToCheckout(
  page: Page,
  context: BrowserContext,
  product: { id: string; billingCycle: number; type: string },
  promotion: string | null = null,
  currency: string | null = null,
  trialValue: boolean = false
) {
  await page.goto(URLs.basket);
  await waitForSessionCookie(context);
  let token = await getSessionToken(context);
  let order: Order = await createOrder(token);
  let orderId = order.id;
  if (currency !== null) {
    await setOrderCurrency(token, orderId, currency);
  }

  await addProductToOrder(
    `${token}`,
    `${orderId}`,
    product.id,
    1,
    product.billingCycle,
    [],
    [],
    {},
    [],
    true,
    trialValue
  );
  if (promotion !== null) {
    await addPromotionToOrder(orderId, promotion, token);
  }

  // Confirm the seeded product is on the session's CURRENT order before loading
  // checkout. On shared staging accounts under parallel load, a sibling test's
  // createOrder can become "current" and the checkout page reads an empty
  // basket (the BasketUnavailable dialog), so poll the API until our product is
  // the current order's product, then navigate.
  await expect
    .poll(
      async () => {
        const current = await getCurrentOrder(token);
        const items = (current?.products ?? []) as { product_id?: string }[];
        return some(items, { product_id: product.id });
      },
      { timeout: 30000 }
    )
    .toBeTruthy();

  await page.goto(URLs.checkout);
}
