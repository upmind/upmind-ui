import { Page } from "@playwright/test";

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
