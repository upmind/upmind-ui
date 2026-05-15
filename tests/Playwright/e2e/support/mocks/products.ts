import { BrowserContext, Page, Route, request } from "@playwright/test";
import { URLs } from "../constants/urls";
import { getSessionToken } from "../api/auth";
import { getTimestamp } from "../helpers/dates";

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

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

/**
 * Shape of a single recommendation injected onto a basket product. Mirrors
 * the items the backend places in `meta["@data.productsToRecommend"]` /
 * `related[]`, so callers can override any field by passing it directly.
 *
 * `config.sub_pids` is typed as `string | string[]` because the backend
 * returns it in three formats (array, single string, CSV); the frontend
 * normalises all three before applying.
 */
export interface RecommendationConfig {
  /** The product ID being recommended. */
  object_id: string;
  /** Defaults to `"product"`. */
  object_type?: string;
  /** Defaults to `true`. */
  active?: boolean;
  /** Backend match-level marker (e.g. `"product_config"`). */
  matchLevel?: string;
  /** Sort order; defaults to the array index. */
  order?: number;
  /** Display label (e.g. CTA text). */
  label?: string;
  /** Name override — falls back to the fetched product's name. */
  name?: string;
  /** Description override. */
  description?: string;
  /**Translated description override */
  description_translated?: string;
  /** Short description override. */
  short_description?: string | null;
  /** Image URL override. */
  image_url?: string;
  /** Badge to render with the card. */
  badge?: string | { label: string; icon?: string };
  /** Benefits list. */
  benefits?: Array<string | { label: string; icon?: string }>;
  /**
   * Configuration applied when the recommendation is added to basket —
   * mirrors `ProductRecommendConfigOptions`.
   */
  config?: {
    sub_pids?: string | string[];
    bcm?: number;
    qty?: number;
    pfields?: Record<string, any> | any[];
    coupons?: string[];
  };
  /**
   * Conditional visibility rules (FE-2263). Evaluated against basket
   * state by `checkConditionVisibility`; when the rules resolve to
   * `"hidden"` the recommendation is filtered out before the carousel
   * renders. Reuses the FE-2655 `ConditionalValue<T>` shape so authors
   * can target `basket.*` or `basketProduct.*` keys.
   */
  conditions?: ConditionalValue<"visible" | "hidden">;
  /**
   * Conditional in-basket detection (FE-2263). Drives `meta.added`
   * via `isRecommendationInBasket` — evaluation is auto-scoped to
   * basket products whose `product_id` matches `object_id`, so rules
   * never reference "self". Omit for the legacy loose product_id match.
   */
  inBasketConditions?: ConditionalValue<boolean>;
}

/**
 * Mirrors the FE-2655 `ConditionalValue<T>` shape consumed by
 * `evaluateRules`. Kept as a structural type here (rather than imported
 * from headless) so the test mocks have no runtime dependency on the
 * package's internals — if the production type drifts, the mock will
 * still compile and the test failure will surface at the assertion
 * level instead of the import boundary.
 */
export interface ConditionalValue<T> {
  default: T;
  rules: Array<{
    when?: Record<string, any>;
    then: T;
  }>;
}

/**
 * Fetches a product from the basket products endpoint with all the
 * `with=` relations the basket includes for `products.product.related`.
 * Used to populate the `product` field on injected recommendation entries
 * so the engine has the option/attribute data it needs to resolve
 * `sub_pids` into structured `options`/`attributes`.
 */
async function fetchProductData(
  token: string,
  productId: string
): Promise<Record<string, any> | null> {
  const apiContext = await request.newContext({
    baseURL: URLs.apiUrl,
    extraHTTPHeaders: {
      accept: "*/*",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: URLs.apiOrigin
    }
  });

  const withRelations = [
    "image",
    "images",
    "prices",
    "products_attributes",
    "products_attributes.category",
    "products_options",
    "products_options.category",
    "products_options.prices",
    "category"
  ].join(",");

  try {
    const response = await apiContext.get(
      `/api/basket/products/${productId}?with=${withRelations}&lang=en`
    );
    if (!response.ok()) return null;
    const body = await response.json();
    return body?.data ?? null;
  } finally {
    await apiContext.dispose();
  }
}

interface RecommendationsMockState {
  productsToRecommend: RecommendationConfig[] | null;
  related: RecommendationConfig[] | null;
  productCache: Map<string, Promise<Record<string, any> | null>>;
  tokenPromise: Promise<string> | null;
}

const recommendationsState = new WeakMap<
  BrowserContext,
  RecommendationsMockState
>();

function buildRecommendationEntry(
  rec: RecommendationConfig,
  index: number,
  parentProductId: string,
  product: Record<string, any> | null
): Record<string, any> {
  const entry: Record<string, any> = {
    id: `${index}`,
    object_id: rec.object_id,
    object_type: rec.object_type ?? "product",
    active: rec.active ?? true,
    order: rec.order ?? index,
    product_id: parentProductId,
    related_object: product,
    product,
    translations: [],
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
    deleted_at: null,
    label: rec.label ?? null,
    label_translated: rec.label ?? null,
    name: rec.name ?? product?.name ?? null,
    name_translated:
      rec.name ?? product?.name_translated ?? product?.name ?? "",
    description: rec.description ?? null,
    description_translated: rec.description_translated ?? null
  };
  if (rec.matchLevel !== undefined) entry.matchLevel = rec.matchLevel;
  if (rec.short_description !== undefined)
    entry.short_description = rec.short_description;
  if (rec.image_url !== undefined) entry.image_url = rec.image_url;
  if (rec.badge !== undefined) entry.badge = rec.badge;
  if (rec.benefits !== undefined) entry.benefits = rec.benefits;
  if (rec.config !== undefined) entry.config = rec.config;
  if (rec.conditions !== undefined) entry.conditions = rec.conditions;
  if (rec.inBasketConditions !== undefined)
    entry.inBasketConditions = rec.inBasketConditions;
  return entry;
}

function ensureRouteRegistered(
  context: BrowserContext
): RecommendationsMockState {
  let state = recommendationsState.get(context);
  if (state) return state;

  state = {
    productsToRecommend: null,
    related: null,
    productCache: new Map(),
    tokenPromise: null
  };
  recommendationsState.set(context, state);

  const getProduct = (productId: string) => {
    let cached = state!.productCache.get(productId);
    if (!cached) {
      state!.tokenPromise ??= getSessionToken(context);
      cached = state!.tokenPromise.then(token =>
        fetchProductData(token, productId)
      );
      state!.productCache.set(productId, cached);
    }
    return cached;
  };

  context.route("**/api/orders/current**", async (route: Route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fallback();
      return;
    }

    const { productsToRecommend, related } = state!;
    if (!productsToRecommend && !related) {
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

    const basketProducts = body?.data?.products;
    if (!Array.isArray(basketProducts) || basketProducts.length === 0) {
      await route.fulfill({ response });
      return;
    }

    const parent = basketProducts[0];
    if (!parent?.product) {
      await route.fulfill({ response });
      return;
    }

    const buildEntries = async (recs: RecommendationConfig[]) =>
      Promise.all(
        recs.map(async (rec, index) => {
          const product = await getProduct(rec.object_id);
          return buildRecommendationEntry(
            rec,
            index,
            parent.product_id,
            product
          );
        })
      );

    if (productsToRecommend) {
      const entries = await buildEntries(productsToRecommend);
      if (
        !parent.product.meta ||
        typeof parent.product.meta !== "object" ||
        Array.isArray(parent.product.meta)
      ) {
        parent.product.meta = {};
      }
      parent.product.meta["@data.productsToRecommend"] = entries;
    }

    if (related) {
      parent.product.related = await buildEntries(related);
    }

    await route.fulfill({
      status: response.status(),
      contentType: "application/json",
      headers: response.headers(),
      body: JSON.stringify(body)
    });
  });

  return state;
}

/**
 * Intercepts `/api/orders/current` and replaces the first basket product's
 * `meta["@data.productsToRecommend"]` array — the config-based recommendation
 * source — with a controlled set of entries.
 *
 * Composes with `interceptRelatedProducts`: calling both in the same test
 * mocks each source independently within a single route handler.
 *
 * @example
 * interceptProductsToRecommend(context, [
 *   {
 *     object_id: products.STARTER_HOSTING.id,
 *     config: { sub_pids: ["tokyo-id", "mailbox-id"] }
 *   }
 * ]);
 */
export function interceptProductsToRecommend(
  context: BrowserContext,
  recommendations: RecommendationConfig[]
): void {
  const state = ensureRouteRegistered(context);
  state.productsToRecommend = recommendations;
}

/**
 * Intercepts `/api/orders/current` and replaces the first basket product's
 * `related[]` array — the native recommendation source — with a controlled
 * set of entries.
 *
 * Composes with `interceptProductsToRecommend`: calling both in the same
 * test mocks each source independently within a single route handler.
 *
 * @example
 * interceptRelatedProducts(context, [
 *   {
 *     object_id: products.STARTER_HOSTING.id,
 *     config: { sub_pids: "tokyo-id,mailbox-id" }
 *   }
 * ]);
 */
export function interceptRelatedProducts(
  context: BrowserContext,
  recommendations: RecommendationConfig[]
): void {
  const state = ensureRouteRegistered(context);
  state.related = recommendations;
}
