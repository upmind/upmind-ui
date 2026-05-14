import { BrowserContext, Route } from "@playwright/test";

/**
 * Mocks for the split-endpoint DAC flow gated by
 * `provisioning.domain_names.search_method = "smart-suggest"`.
 *
 *  - mockDomainSuggestions       → /modules/web_hosting/domains/suggestions
 *  - mockDomainSuggestionsTlds   → /modules/web_hosting/domains/suggestions/tlds
 *  - mockDomainAvailability      → /modules/web_hosting/domains/availability/{domain}
 *
 * All three are fully synthetic — they fulfil the route without hitting upstream
 * so tests can control row content, paging and resolution order deterministically.
 * `latencyMs` lets a test slow one call down to assert the progressive-render
 * contract (suggestions arrive first, cards render with price skeletons, tlds
 * arrive and prices fill in).
 */

// -----------------------------------------------------------------------------
// Shared types

export interface DomainSuggestionRow {
  domain: string;
  sld: string;
  tld: string;
  can_register: boolean;
  can_transfer: boolean;
  product_id: string;
}

export interface DomainSuggestionProduct {
  /** Product id — must match a `product_id` on the suggestion rows. */
  id: string;
  sub_product_id?: string;
  setup_function_sub_ids?: { register?: string[]; transfer?: string[] };
  prices: Array<{
    billing_cycle_months: number;
    price_formatted: string;
    price_discounted_formatted?: string | null;
    price?: number;
    price_discounted?: number | null;
    promotions?: unknown[];
  }>;
  /** Only required if the test exercises required-option auto-fill. */
  products_options?: Array<Record<string, unknown>>;
  products_attributes?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface DomainAvailabilityResponse {
  can_register: boolean;
  can_transfer: boolean;
  is_premium?: boolean;
  product_id?: string;
  /** Set when the test wants the exact-match card to render full pricing. */
  product?: DomainSuggestionProduct;
}

interface MockOptions {
  /** Artificial response delay (ms). Used to control resolution order. */
  latencyMs?: number;
}

interface PageParams {
  query: string;
  page: number;
  limit: number;
}

// -----------------------------------------------------------------------------
// Shared handler primitives

const OPTIONS_PASSTHROUGH = async (route: Route): Promise<boolean> => {
  if (route.request().method() === "OPTIONS") {
    await route.fallback();
    return true;
  }
  return false;
};

const delay = (latencyMs: number | undefined) =>
  latencyMs ? new Promise(r => setTimeout(r, latencyMs)) : Promise.resolve();

const fulfillError = (route: Route, status: number) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({
      status: "error",
      data: null,
      error: { code: status, message: "mock error" }
    })
  });

const parsePageParams = (route: Route): PageParams => {
  const url = new URL(route.request().url());
  return {
    query: url.searchParams.get("query") ?? "",
    page: Number(url.searchParams.get("tlds_page") ?? "1"),
    limit: Number(url.searchParams.get("limit") ?? "20")
  };
};

// -----------------------------------------------------------------------------
// /suggestions

export interface MockDomainSuggestionsOptions extends MockOptions {
  /** Static rows. Use `builder` when rows must vary per page or query. */
  rows?: DomainSuggestionRow[];
  /** Returned as `meta.total_pages`. Defaults to 1. */
  totalPages?: number;
  /**
   * Per-page row limit returned in `meta.limit`. The real backend only
   * paginates when the total result set exceeds this limit, so tests that
   * assert on Load more behaviour need to set this so `total_pages × limit`
   * matches the row count they're returning.
   *
   * Defaults to 20 (the frontend's hardcoded request limit).
   */
  limit?: number;
  builder?: (params: PageParams) => {
    rows: DomainSuggestionRow[];
    totalPages?: number;
  };
}

/**
 * Mocks `/modules/web_hosting/domains/suggestions` (lightweight rows).
 *
 * @example
 * mockDomainSuggestions(context, {
 *   rows: [{ domain: "mydomain.com", sld: "mydomain", tld: ".com",
 *            can_register: true, can_transfer: false, product_id: "p-com" }],
 *   totalPages: 1,
 *   limit: 20
 * });
 */
export function mockDomainSuggestions(
  context: BrowserContext,
  options: MockDomainSuggestionsOptions = {}
) {
  const { latencyMs, rows = [], totalPages = 1, limit = 20, builder } = options;

  context.route(
    "**/modules/web_hosting/domains/suggestions?**",
    async (route: Route) => {
      if (await OPTIONS_PASSTHROUGH(route)) return;

      const built = builder?.(parsePageParams(route));
      const responseRows = built?.rows ?? rows;
      const responseTotalPages = built?.totalPages ?? totalPages;

      await delay(latencyMs);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          data: responseRows,
          meta: { total_pages: responseTotalPages, limit },
          related: null,
          total: responseRows.length,
          error: null,
          messages: []
        })
      });
    }
  );
}

// -----------------------------------------------------------------------------
// /suggestions/tlds

export interface MockDomainSuggestionsTldsOptions extends MockOptions {
  /** Products keyed by `product_id`. Use `builder` when products vary per page. */
  products?: Record<string, DomainSuggestionProduct>;
  builder?: (params: PageParams) => {
    products: Record<string, DomainSuggestionProduct>;
  };
  /** Force a non-200 response — useful for graceful-degradation tests. */
  errorStatus?: number;
}

/**
 * Mocks `/modules/web_hosting/domains/suggestions/tlds` — full IProduct
 * entries used to fill prices on the cards.
 */
export function mockDomainSuggestionsTlds(
  context: BrowserContext,
  options: MockDomainSuggestionsTldsOptions = {}
) {
  const { latencyMs, products = {}, builder, errorStatus } = options;

  context.route(
    "**/modules/web_hosting/domains/suggestions/tlds?**",
    async (route: Route) => {
      if (await OPTIONS_PASSTHROUGH(route)) return;

      await delay(latencyMs);

      if (errorStatus) {
        await fulfillError(route, errorStatus);
        return;
      }

      const built = builder?.(parsePageParams(route));
      const productsForPage = built?.products ?? products;
      const data = Object.values(productsForPage);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          data,
          related: { products: productsForPage },
          meta: null,
          total: data.length,
          error: null,
          messages: []
        })
      });
    }
  );
}

// -----------------------------------------------------------------------------
// /availability/{domain}

export interface MockDomainAvailabilityOptions extends MockOptions {
  /** Per-domain response. Key is the full domain string (e.g. `"mydomain.com"`). */
  byDomain?: Record<string, DomainAvailabilityResponse>;
  /** Fallback when no `byDomain` entry matches. */
  default?: DomainAvailabilityResponse;
  errorStatus?: number;
}

const FALLBACK_AVAILABILITY: DomainAvailabilityResponse = {
  can_register: true,
  can_transfer: false,
  is_premium: false
};

/**
 * Mocks `/modules/web_hosting/domains/availability/{domain}`. Fired by the
 * smart-suggest flow only when the search query contains a TLD, and by the
 * transfer flow for any domain.
 */
export function mockDomainAvailability(
  context: BrowserContext,
  options: MockDomainAvailabilityOptions = {}
) {
  const {
    latencyMs,
    byDomain = {},
    default: defaultResponse,
    errorStatus
  } = options;

  context.route(
    "**/modules/web_hosting/domains/availability/**",
    async (route: Route) => {
      if (await OPTIONS_PASSTHROUGH(route)) return;

      await delay(latencyMs);

      if (errorStatus) {
        await fulfillError(route, errorStatus);
        return;
      }

      const path = route.request().url().split("?")[0];
      const domain = decodeURIComponent(path.split("/").pop() ?? "");
      const response =
        byDomain[domain] ?? defaultResponse ?? FALLBACK_AVAILABILITY;

      // Mirror the live API: when `product` is set, also expose it under
      // related.products so the parser's product_id → product fallback works.
      const related =
        response.product && response.product_id
          ? { products: { [response.product_id]: response.product } }
          : null;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          data: response,
          related,
          meta: null,
          total: null,
          error: null,
          messages: []
        })
      });
    }
  );
}
