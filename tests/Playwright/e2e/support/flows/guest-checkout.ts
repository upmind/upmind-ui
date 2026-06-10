import { BrowserContext, Page } from "@playwright/test";
import { URLs } from "../constants/urls";
import { products } from "../constants/products";
import { getSessionToken } from "../api/auth";
import { createOrder, addProductToOrder } from "../api/basket";
import { waitForSessionCookie } from "../helpers/session";

/**
 * Reaches the guest-checkout Background state — "a guest visitor with a product
 * in their basket" — by DRIVING REAL MODULES, not by mocking journey data or
 * hand-rolling a guest session. Hitting the basket page establishes the
 * anonymous `upm_guest_session`; the guest token then creates an order and adds
 * a product via the same module-backed API helpers `goToCheckout` uses. No
 * registration, no token override — exactly the path a real anonymous visitor
 * takes.
 *
 * @param page - Playwright page instance
 * @param context - Browser context (used to read the guest session token)
 */
export async function seedGuestBasket(
  page: Page,
  context: BrowserContext
): Promise<void> {
  await page.goto(URLs.basket);
  await waitForSessionCookie(context, { guestOnly: true });
  const token = await getSessionToken(context);
  const order = await createOrder(token);
  await addProductToOrder(
    token,
    order.id,
    products.STARTER_HOSTING.id,
    1,
    products.STARTER_HOSTING.billingCycle,
    [],
    [],
    {},
    [],
    true,
    false
  );
}
