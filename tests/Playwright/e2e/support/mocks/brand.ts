import {
  Page,
  BrowserContext,
  APIRequestContext,
  Route,
  Request
} from "@playwright/test";

interface ConfigOverrides {
  requireAddressForOrders?: boolean;
  requireCompanyForOrders?: boolean;
  requireRegionInAddress?: boolean;
  requirePhoneForOrders?: boolean;
  displayPriceType?: string;
  /**
   * Selects which domain search flow `useDac` uses.
   *   - `"legacy-lookup"` → single `/modules/web_hosting/domains/search` call
   *   - `"smart-suggest"` → split `/suggestions` + `/suggestions/tlds` (+ `/availability` for exact match)
   *
   * Maps to brand config key `provisioning.domain_names.search_method`.
   */
  domainSearchMethod?: "legacy-lookup" | "smart-suggest";
  basketFunnelling?: "none" | "next_step";
  /**
   * Toggles the guest-checkout gate. Maps to brand config key
   * `invoices.guest_checkout.enabled` (`BrandConfigKeys.GUEST_CHECKOUT_ENABLED`).
   * Mock OFF to assert the guest CTAs are hidden; do NOT mock ON while staging
   * rejects guest registration (the journey would fail mid-flight) — read the
   * real value with `captureBrandSettings` and `test.skip` instead.
   */
  guestCheckoutEnabled?: boolean;
  /**
   * Toggles the require-verified-email checkout gate. Maps to brand config key
   * `security.orders.require_verified_email`. A feature-flag/settings mock
   * (P4-safe): mock ON to assert `guardCheckout` opens the verify-email overlay
   * for an unverified client; mock OFF for the normal checkout path.
   */
  requireVerifiedEmail?: boolean;
}

/**
 * Flexible cart meta overrides - accepts any flat key-value pairs.
 * Keys should be in the format:
 *   - "@context.{context}.{property}" for UI settings (e.g. "@context.*.template", "@context.checkout.basketItems")
 *   - "@data.{context}.{property}" for data settings (e.g. "@data.*.storeUrl", "@data.configure.productsToBundle")
 *
 * Common contexts: *, catalogue, configure, recommendations, basket, auth, billingdetails, checkout, confirmation
 *
 * @example
 * // Global template override
 * interceptUISchema(context, { "@context.*.template": "two-column-ltr" });
 *
 * // Context-specific overrides
 * interceptUISchema(context, {
 *   "@context.checkout.template": "full",
 *   "@context.checkout.basketItems": "visible",
 *   "@context.configure.optionSelector": "radio-grid"
 * });
 *
 * // Data overrides
 * interceptUISchema(context, {
 *   "@data.*.storeUrl": "https://example.com",
 *   "@data.recommendations.productsToRecommend": "[...]"
 * });
 */
type CartOverrides = Record<string, string | boolean | number | undefined>;

const BRAND_CONFIG_VALUES = /\/api\/config\/brand\/values$/;

/**
 * Waits for the app's own GET on `config/brand/values` and resolves with the
 * parsed `data` map (flat brand-config key → value). Lets a test read the REAL
 * brand settings — e.g. `BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS` — and gate
 * its flow on them with `test.skip(...)` instead of mocking. A read, so it
 * sidesteps the TanStack cache-drift that mocking the config introduces.
 *
 * `REQUIRE_ADDRESS_FOR_ORDERS` is in the default brand-config key set, so the
 * first (page-load) response already carries it.
 *
 * Attach BEFORE the navigation that triggers the request (mirrors
 * `captureProduct`).
 */
export const captureBrandSettings = (page: Page) =>
  page
    .waitForResponse(
      r =>
        BRAND_CONFIG_VALUES.test(new URL(r.url()).pathname) &&
        r.request().method() === "GET" &&
        r.ok()
    )
    .then(async r => {
      const body = await r.json();
      return (body?.data ?? {}) as Record<string, unknown>;
    });

export async function interceptConfigValues(
  page: Page,
  bearerToken: string | null,
  overrides: ConfigOverrides
) {
  await page.route(
    "**/api/config/brand/values?**",
    async (route: Route, request: Request) => {
      // When a bearerToken is provided, force it (legacy behaviour). When it's
      // null/false, replay with the request's own auth and strip cache-validation
      // headers, so cached (TanStack) reloads return a full 200 body instead of a
      // 304 with null data. See FE-2785.
      let headers = request.headers();
      if (bearerToken) {
        headers = { ...headers, authorization: `Bearer ${bearerToken}` };
      } else {
        const {
          "if-none-match": _ifNoneMatch,
          "if-modified-since": _ifModifiedSince,
          ...rest
        } = headers;
        headers = rest;
      }
      const response = await page.request.fetch(request, { headers });
      const json = await response.json();
      // Only override keys the caller actually passed — leave the rest at their
      // real brand values. Unconditionally writing `undefined` (e.g. for
      // display_price_type when not overridden) corrupts the config and breaks
      // flows that depend on it, like registration. Mirrors interceptUISchema.
      if (overrides.requireAddressForOrders !== undefined) {
        json.data["invoices.common.require_address_for_orders"] =
          overrides.requireAddressForOrders;
      }
      if (overrides.requireCompanyForOrders !== undefined) {
        json.data["invoices.common.require_company_for_orders"] =
          overrides.requireCompanyForOrders;
      }
      if (overrides.requireRegionInAddress !== undefined) {
        json.data["invoices.common.required_region_in_address"] =
          overrides.requireRegionInAddress;
      }
      if (overrides.requirePhoneForOrders !== undefined) {
        json.data["invoices.common.require_phone_for_orders"] =
          overrides.requirePhoneForOrders;
      }
      if (overrides.displayPriceType !== undefined) {
        json.data["invoices.common.display_price_type"] =
          overrides.displayPriceType;
      }
      if (overrides.domainSearchMethod !== undefined) {
        json.data["provisioning.domain_names.search_method"] =
          overrides.domainSearchMethod;
      }
      if (overrides.basketFunnelling !== undefined) {
        json.data["ui.basket.add_to_basket_funnelling"] =
          overrides.basketFunnelling;
      }
      if (overrides.guestCheckoutEnabled !== undefined) {
        json.data["invoices.guest_checkout.enabled"] =
          overrides.guestCheckoutEnabled;
      }
      if (overrides.requireVerifiedEmail !== undefined) {
        json.data["security.orders.require_verified_email"] =
          overrides.requireVerifiedEmail;
      }
      const updatedResponseBody = {
        ...json
      };
      route.fulfill({
        status: response.status(),
        contentType: "application/json",
        headers: response.headers(),
        body: JSON.stringify(updatedResponseBody)
      });
    }
  );
}

export async function interceptTermsAndConditions(
  page: Page,
  bearerToken: string,
  id: string | null,
  name: string | null,
  url: string | null,
  terms: string | null
) {
  await page.route(
    "**/api/terms_and_conditions/current?lang**",
    async (route: Route, request: Request) => {
      const originalHeaders = request.headers();
      const modifiedHeaders = {
        ...originalHeaders,
        authorization: `Bearer ${bearerToken}`
      };
      const response = await page.request.fetch(request, {
        headers: modifiedHeaders
      });
      const json = await response.json();
      json.data.terms["id"] = id;
      json.data.terms["name"] = name;
      json.data.terms["url"] = url;
      json.data.terms["terms"] = terms;
      json.data.terms["name_translated"] = name;
      json.data.terms["url_translated"] = url;
      json.data.terms["terms_translated"] = terms;
      const updatedResponseBody = {
        ...json
      };
      route.fulfill({
        status: response.status(),
        contentType: "application/json",
        headers: response.headers(),
        body: JSON.stringify(updatedResponseBody)
      });
    }
  );
}

/**
 * Intercept brand settings API and apply cart meta overrides.
 *
 * @param context - Playwright BrowserContext
 * @param overrides - Flat key-value pairs to merge into meta.cart
 *
 * @example
 * // Set checkout template
 * interceptUISchema(context, { "@context.checkout.template": "full" });
 *
 * // Set multiple settings
 * interceptUISchema(context, {
 *   "@context.*.template": "two-column-ltr",
 *   "@context.*.productImageRatio": "1:1",
 *   "@context.checkout.basketItems": "hidden",
 *   "@data.*.clickwrapDisclaimer": "By clicking..."
 * });
 */
export function interceptUISchema(
  context: BrowserContext,
  overrides: CartOverrides
) {
  context.route("**/api/brand/settings**", async (route: Route) => {
    const response = await route.fetch();
    const json = await response.json();

    // Initialize meta.cart if not present
    if (!json.data.meta) json.data.meta = {};
    if (!json.data.meta.cart) json.data.meta.cart = {};

    // Apply all overrides directly to cart
    for (const [key, value] of Object.entries(overrides)) {
      if (value !== undefined) {
        json.data.meta.cart[key] = value;
      }
    }

    await route.fulfill({
      status: response.status(),
      contentType: "application/json",
      headers: response.headers(),
      body: JSON.stringify(json)
    });
  });
}

export async function interceptSlots(page: Page, slot: string) {
  page.route(`**/api/templates/client_area/slots/${slot}/render**`, route =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        data: {
          type: "template",
          title: "",
          body: `<div style="padding: 16px; background: #f0f9ff; border: 2px solid #0284c7; border-radius: 8px;">\n  <h3>🧪 Template: ${slot}<\/h3>\n  <p>This content is injected via the <strong>Playwright Test Runner<\/strong><\/p>\n<\/div>`,
          meta: null
        },
        related: null,
        total: null,
        error: null,
        messages: []
      })
    })
  );
}
