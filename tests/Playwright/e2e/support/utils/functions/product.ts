import { Page, Route } from "@playwright/test";

export async function interceptProductMeta(page: Page, newMeta: {}) {
  await page.route("**/api/basket/products/**", async (route: Route) => {
    const response = await route.fetch();
    let body = await response.json();

    body.data.meta = newMeta;
    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: JSON.stringify(body)
    });
  });
}
