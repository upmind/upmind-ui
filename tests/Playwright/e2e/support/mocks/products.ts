import { BrowserContext, Page, Route } from "@playwright/test";

/**
 * Intercepts product API responses and injects free trial fields.
 * Handles both single-product responses (product config page) and
 * multi-product responses (catalogue / recommendations).
 *
 * @param context - Browser context to register the route on
 * @param route - API path to intercept (e.g. "/api/basket/products/")
 * @param options - Trial configuration fields to inject
 */
export function mockTrialProduct(
  context: BrowserContext,
  route: string,
  options: {
    trialSupported?: boolean;
    trialForce?: boolean;
    trialDuration?: number;
    trialEndAction?: string;
  } = {}
) {
  const {
    trialSupported = true,
    trialForce = false,
    trialDuration = 7,
    trialEndAction = "convert"
  } = options;

  context.route(`**${route}**`, async (route: Route) => {
    // Let CORS preflight requests pass through without modification
    if (route.request().method() === "OPTIONS") {
      await route.fallback();
      return;
    }

    const response = await route.fetch();
    const json = await response.json();

    const injectTrialFields = (product: Record<string, unknown>) => {
      product["trial_supported"] = trialSupported;
      product["trial_force"] = trialForce;
      product["trial_duration"] = trialDuration;
      product["trial_end_action"] = trialEndAction;
    };

    const data = json?.data;
    if (Array.isArray(data)) {
      // Catalogue / recommendations: data is an array of products
      for (const product of data) {
        injectTrialFields(product);
      }
    } else if (data && typeof data === "object") {
      // Product config page: data is a single product object
      injectTrialFields(data);
    }

    await route.fulfill({
      status: response.status(),
      contentType: "application/json",
      headers: response.headers(),
      body: JSON.stringify(json)
    });
  });
}

/**
 * Intercepts product API responses and overrides the meta field.
 */
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
