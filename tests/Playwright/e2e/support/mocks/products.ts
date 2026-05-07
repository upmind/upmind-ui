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

type Benefit = string | { label: string; icon?: string };

export interface UpsellMetaOverride {
  /** Layer 3 per-option gate (`@data.*.optionUpsellEnabled`). */
  optionUpsellEnabled?: boolean;
  /** Benefit list rendered beneath the toggle (`@data.*.optionBenefits`). */
  optionBenefits?: Benefit[];
}

export interface UpsellMetaFilter {
  /** Restrict overrides to a single option-value id. */
  valueId?: string;
  /** Restrict overrides to all values within a single option-category id. */
  categoryId?: string;
}

const META_KEY_UPSELL_ENABLED = "@data.*.optionUpsellEnabled";
const META_KEY_BENEFITS = "@data.*.optionBenefits";

const UPSELL_ROUTES = [
  "**/api/orders/current**",
  "**/api/basket/products/**",
  "**/api/basket/*/products/**"
];

function applyUpsellMeta(
  productOption: Record<string, any>,
  overrides: UpsellMetaOverride,
  filter?: UpsellMetaFilter
): boolean {
  if (filter?.valueId && productOption.id !== filter.valueId) return false;
  if (filter?.categoryId && productOption.category_id !== filter.categoryId)
    return false;

  if (!productOption.meta || typeof productOption.meta !== "object") {
    productOption.meta = {};
  }
  let mutated = false;
  if (overrides.optionUpsellEnabled !== undefined) {
    productOption.meta[META_KEY_UPSELL_ENABLED] = overrides.optionUpsellEnabled;
    mutated = true;
  }
  if (overrides.optionBenefits !== undefined) {
    productOption.meta[META_KEY_BENEFITS] = overrides.optionBenefits;
    mutated = true;
  }
  return mutated;
}

function patchProductsOptions(
  product: Record<string, any> | undefined,
  overrides: UpsellMetaOverride,
  filter?: UpsellMetaFilter
): boolean {
  const options = product?.products_options;
  if (!Array.isArray(options)) return false;
  let mutated = false;
  for (const option of options) {
    if (applyUpsellMeta(option, overrides, filter)) mutated = true;
  }
  return mutated;
}

/**
 * Intercepts the basket order and single-product endpoints to inject upsell
 * meta onto each product option. Drives the per-option upsell gate
 * (`@data.*.optionUpsellEnabled`) and the benefits list (`@data.*.optionBenefits`)
 * without changing the live product catalog.
 *
 * Patches:
 *  - `/api/orders/current` — `data.products[i].product.products_options[j].meta`
 *  - `/api/basket/products/{id}` — `data.products_options[j].meta`
 *  - `/api/basket/{basketId}/products/{bpid}` — same shape as above
 *
 * @example
 * interceptBasketUpsells(context, { optionUpsellEnabled: true });
 *
 * @example
 * interceptBasketUpsells(
 *   context,
 *   { optionUpsellEnabled: true, optionBenefits: ["Faster speeds"] },
 *   { categoryId: "abc-123" }
 * );
 */
export function interceptBasketUpsells(
  context: BrowserContext,
  overrides: UpsellMetaOverride,
  filter?: UpsellMetaFilter
) {
  const handle = async (route: Route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fallback();
      return;
    }

    const response = await route.fetch();
    let body: any;
    try {
      body = await response.json();
    } catch {
      await route.fulfill({ response });
      return;
    }

    const data = body?.data;
    let mutated = false;
    if (Array.isArray(data?.products)) {
      for (const basketProduct of data.products) {
        if (patchProductsOptions(basketProduct?.product, overrides, filter)) {
          mutated = true;
        }
      }
    } else if (data && typeof data === "object") {
      mutated = patchProductsOptions(data, overrides, filter);
    }

    if (!mutated) {
      await route.fulfill({ response });
      return;
    }

    await route.fulfill({
      status: response.status(),
      contentType: "application/json",
      headers: response.headers(),
      body: JSON.stringify(body)
    });
  };

  for (const pattern of UPSELL_ROUTES) {
    context.route(pattern, handle);
  }
}
