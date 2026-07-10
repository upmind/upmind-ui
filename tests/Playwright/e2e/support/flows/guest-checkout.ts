import { Page, expect } from "@playwright/test";
import { URLs } from "../constants/urls";
import { products } from "../constants/products";
import { waitForUpmindBridge } from "./headless-bridge";
import { addProductViaHeadless } from "./basket-setup";

/**
 * Reaches the guest-checkout Background state — "a guest visitor with a product
 * in their basket" — by DRIVING REAL MODULES, not by mocking journey data or
 * hand-rolling a guest session. Hitting the basket page boots the live headless
 * system as an anonymous visitor; we assert the active session is a GUEST actor
 * (the module-level equivalent of the old guest-cookie check) and then seed a
 * product through the same basket composable the app uses. No registration, no
 * token override — exactly the path a real anonymous visitor takes.
 *
 * Defaults to a ONE-TIME product (HAT): guest checkout is hidden for baskets
 * containing recurring products (`basketMeta.hasRecurringProducts`), so the
 * guest journey is only reachable with one-time products. Pass a recurring
 * product (e.g. STARTER_HOSTING) to exercise the hidden-CTA rule.
 *
 * @param page - Playwright page instance (the live system lives on its window)
 * @param product - Product to seed (defaults to the one-time HAT, which is
 *   non-recurring so the guest-checkout CTA renders —
 *   Register.vue:64 `!basketMeta.hasRecurringProducts`)
 */
export async function seedGuestBasket(
  page: Page,
  product: { id: string; billingCycle: number } = products.HAT
): Promise<void> {
  await page.goto(URLs.basket);
  await waitForUpmindBridge(page);
  const actor = await page.evaluate(async () => {
    const session = window.Upmind!.useActiveSession();
    await session.useActions().isReady();
    return session.useContext().actor.value;
  });
  expect(actor).toBe("guest");
  await addProductViaHeadless(page, {
    productId: product.id,
    billingCycleMonths: product.billingCycle
  });
}
