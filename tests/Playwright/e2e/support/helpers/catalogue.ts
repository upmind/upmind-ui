import { expect, Locator, Page } from "@playwright/test";

/**
 * Intercept GET requests to `/api/basket/products` and rewrite the `limit`
 * query parameter so the catalogue returns more products in a single page.
 *
 * Useful for in-situ catalogue specs that need multiple specific products
 * visible on the same shop view without paginating.
 *
 * @param page  - Playwright Page
 * @param limit - Replacement value for the `limit` query param (default 100)
 */
export async function overrideBasketProductsLimit(page: Page, limit = 100) {
  await page.route(/\/api\/basket\/products\?/, async route => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    const url = new URL(route.request().url());
    url.searchParams.set("limit", String(limit));
    await route.continue({ url: url.toString() });
  });
}

/**
 * Returns a promise that resolves when a basket-add POST response is received.
 * Call BEFORE clicking the CTA, then await AFTER clicking.
 *
 * @param page         - Playwright Page
 * @param hasBasket    - True if basket already exists (determines which endpoint to watch)
 */
export function waitForBasketAddRequest(page: Page, hasBasket = false) {
  // First add creates the order: POST /orders with product in body
  // Subsequent adds: POST /orders/{id}/products
  const pattern = hasBasket
    ? /\/orders\/[^/]+\/products(\?|$)/
    : /\/orders(\?|$)/;

  return page.waitForResponse(
    resp => resp.request().method() === "POST" && pattern.test(resp.url())
  );
}

/**
 * Click a CTA and wait for the basket add POST to complete, then verify
 * the basket count increased and the CTA shows aria-pressed="true".
 *
 * @param page - Playwright Page
 * @param cta  - The product card CTA locator to click
 */
export async function clickAndAwaitBasketAdd(page: Page, cta: Locator) {
  const basketCount = page.getByTestId("basket-action-count");
  const initialCount = (await basketCount.count())
    ? Number(await basketCount.innerText())
    : 0;

  const basketAddRequest = waitForBasketAddRequest(page, initialCount > 0);

  await cta.click();
  await basketAddRequest;

  await expect(cta).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () => Number(await basketCount.innerText()))
    .toBeGreaterThan(initialCount);
}
