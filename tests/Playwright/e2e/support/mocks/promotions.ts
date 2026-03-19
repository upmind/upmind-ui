import { BrowserContext, Route } from "@playwright/test";

/**
 * Intercepts API requests matching the given route and injects promotion data
 * into price objects in the response. Also sets discount fields so the frontend
 * displays promo badges. Handles both single-product responses (data is an object)
 * and multi-product responses (data is an array, e.g. domain search).
 *
 * @param context - Browser context to register the route on
 * @param route - API path to intercept (e.g. "/api/basket/products/")
 * @param overrides - Promotion fields to inject
 * @param billingCycleMonths - "all" to apply to every billing cycle, or a number to target a specific one
 * @param targetArray - Which array to modify: "prices", "products_options", or "products_attributes"
 *
 * @example
 * mockPromos(context, "/api/basket/products/", {}, "all", "prices");
 * mockPromos(context, "/api/modules/web_hosting/domains/search", {}, 12, "prices");
 */
type PromoOverrides = Record<
  string,
  string | boolean | number | undefined | null | Array<string>
>;

type TargetArray = "prices" | "products_options" | "products_attributes";

export function mockPromos(
  context: BrowserContext,
  route: string,
  overrides: PromoOverrides,
  billingCycleMonths: "all" | number,
  targetArray: TargetArray
) {
  context.route(`**${route}**`, async (route: Route) => {
    // Let CORS preflight requests pass through without modification
    if (route.request().method() === "OPTIONS") {
      await route.fallback();
      return;
    }

    const response = await route.fetch();
    const json = await response.json();

    const applyPromo = (obj: Record<string, unknown>) => {
      if (
        "promotions" in obj &&
        (billingCycleMonths === "all" ||
          obj["billing_cycle_months"] === billingCycleMonths)
      ) {
        obj["promotions"] = [overrides];
        obj["price_discounted"] = 1;
        obj["price_discounted_formatted"] = "£1.00";
        obj["monthly_price_from_discounted"] = 1;
        obj["monthly_price_from_discounted_formatted"] = "£1.00";
      }
    };

    // Apply promos to a single product's target array (and nested prices)
    const processProduct = (product: Record<string, unknown>) => {
      const items = product[targetArray];
      if (Array.isArray(items)) {
        for (const item of items) {
          applyPromo(item);
          if (Array.isArray(item.prices)) {
            for (const price of item.prices) {
              applyPromo(price);
            }
          }
        }
      }

      // Also apply promos to nested products_options and products_attributes prices
      for (const nested of ["products_options", "products_attributes"]) {
        const nestedItems = product[nested];
        if (Array.isArray(nestedItems)) {
          for (const nestedItem of nestedItems) {
            if (Array.isArray(nestedItem.prices)) {
              for (const price of nestedItem.prices) {
                applyPromo(price);
              }
            }
          }
        }
      }
    };

    const data = json?.data;
    if (Array.isArray(data)) {
      // Domain search: data is an array of products
      for (const product of data) {
        processProduct(product);
      }
    } else if (data && typeof data === "object") {
      // Product config: data is a single product object
      processProduct(data);
    }

    await route.fulfill({
      status: response.status(),
      contentType: "application/json",
      headers: response.headers(),
      body: JSON.stringify(json)
    });
  });
}
