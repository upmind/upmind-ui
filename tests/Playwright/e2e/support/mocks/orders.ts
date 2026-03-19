import { BrowserContext, Page, Route } from "@playwright/test";

/**
 * Intercepts requests to /api/orders/current and re-fulfills them.
 * Currently a passthrough — extend this to modify order data as needed.
 *
 * @param context - Browser context to register the route on
 */
// TODO: Make a generic order data getter and remove all the functions that point at this endpoint
export function currentOrderData(context: BrowserContext) {
  context.route("**/api/orders/current**", async (route: Route) => {
    const response = await route.fetch();
    const json = await response.json();
    await route.fulfill({
      status: response.status(),
      contentType: "application/json",
      headers: response.headers(),
      body: JSON.stringify(json)
    });
  });
}

/**
 * Waits for a PUT request to the specified order endpoint.
 *
 * @param page - Playwright page instance
 * @param orderId - The order ID to listen for
 * @param timeout - How long to wait in milliseconds (default: 5000)
 * @returns true if the PUT request was detected, false if it timed out
 */
export async function orderUpdated(
  page: Page,
  orderId: string | null,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await page.waitForRequest(
      request =>
        request.url().includes(`/api/orders/${orderId}`) &&
        request.method() === "PUT",
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Intercepts requests to /api/orders/current and injects warning notes.
 */
export async function overrideWarningNotes(
  page: Page,
  newWarningNotes: string | null
) {
  await page.route("**/api/orders/current**", async route => {
    const response = await route.fetch();
    const text = await response.text();
    let body;

    try {
      body = text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn("Could not parse JSON body, returning as-is");
      return route.fulfill({ response, body: text });
    }

    if (!body.data) body.data = {};
    body.data.warning_notes = [
      {
        id: "3825d96e-763e-d091-3dc4-174825283406",
        message: newWarningNotes,
        translations: {
          code: {
            name: "WARNING"
          }
        },
        created_at: "2025-09-02 08:50:42",
        updated_at: "2025-09-02 08:50:42",
        is_hidden: false
      }
    ];

    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: JSON.stringify(body)
    });
  });
}
