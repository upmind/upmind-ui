import { BrowserContext, Page, expect } from "@playwright/test";
import { URLs } from "../constants/urls";
import { getSessionToken } from "../api/auth";
import {
  createOrder,
  Order,
  addProductToOrder,
  addPromotionToOrder,
  setOrderCurrency
} from "../api/basket";
import { fakerEN_GB } from "@faker-js/faker";

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
  await expect
    .poll(
      async () => {
        const cookies = await context.cookies();
        return cookies.some(
          c => c.name === "upm_guest_session" || c.name === "upm_client_session"
        );
      },
      { timeout: 30000 }
    )
    .toBeTruthy();
  let token = await getSessionToken(context);
  let order: Order = await createOrder(token);
  let orderId = order.id;
  console.log("Order ID:", orderId);
  if (currency !== null) {
    await setOrderCurrency(token, orderId, currency);
  }
  const provisionFields =
    product.type === "domain" || product.type === "hosting"
      ? {
          domain: `${fakerEN_GB.string.alphanumeric({
            length: { min: 3, max: 15 }
          })}.com`
        }
      : {};

  await addProductToOrder(
    `${token}`,
    `${orderId}`,
    product.id,
    1,
    product.billingCycle,
    [],
    [],
    provisionFields,
    [],
    true,
    trialValue
  );
  if (promotion !== null) {
    await addPromotionToOrder(orderId, promotion, token);
  }
  await page.goto(URLs.checkout);
}
