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
}

interface UIOverrides {
  registerTemplate?: string;
  loginTemplate?: string;
  checkoutTemplate?: string;
  basketTemplate?: string;
  basketProductTemplate?: string;
  productConfigTemplate?: string;
  basketProductsOnCheckout?: boolean;
  basketFieldsOnCheckout?: boolean;
  basketBillingOnCheckout?: boolean;
}

export async function interceptConfigValues(
  page: Page,
  bearerToken: string,
  overrides: ConfigOverrides
) {
  await page.route(
    "**/api/config/brand/values?**",
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
      json.data["invoices.common.require_address_for_orders"] =
        overrides.requireAddressForOrders;
      json.data["invoices.common.require_company_for_orders"] =
        overrides.requireCompanyForOrders;
      json.data["invoices.common.required_region_in_address"] =
        overrides.requireRegionInAddress;
      json.data["invoices.common.require_phone_for_orders"] =
        overrides.requirePhoneForOrders;
      json.data["invoices.common.display_price_type"] =
        overrides.displayPriceType;
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

export function interceptUISchema(
  context: BrowserContext,
  overrides: UIOverrides
) {
  context.route("**/api/brand/settings**", async (route: Route) => {
    const response = await route.fetch();
    const json = await response.json();

    json.data.meta.uischema["@display.checkout.basketBilling"] =
      overrides.basketBillingOnCheckout;
    json.data.meta.uischema["@display.checkout.basketFields"] =
      overrides.basketFieldsOnCheckout;
    json.data.meta.uischema["@display.checkout.basketProducts"] =
      overrides.basketProductsOnCheckout;
    json.data.meta.uischema["@route.checkout.template"] =
      overrides.checkoutTemplate;
    json.data.meta.uischema["@route.basket.template"] =
      overrides.basketTemplate;
    json.data.meta.uischema["@route['basket-product-edit'].template"] =
      overrides.basketProductTemplate;
    json.data.meta.uischema["@route['product-configure'].template"] =
      overrides.productConfigTemplate;
    json.data.meta.uischema["@route['session-register'].template"] =
      overrides.registerTemplate;
    json.data.meta.uischema["@route['session-login'].template"] =
      overrides.loginTemplate;

    console.log("Schema Intercepted", json.data.meta.uischema);

    await route.fulfill({
      status: response.status(),
      contentType: "application/json",
      headers: response.headers(),
      body: JSON.stringify(json)
    });
  });
}

// export function interceptUISchema(
//   context: BrowserContext,
//   request: APIRequestContext,
//   overrides: UIOverrides
// ) {
//   context.route("**/api/brand/settings**", async route => {
//     const response = await route.fetch();
//     const json = await response.json();

//     applyOverrides(json, overrides);

//     await route.fulfill({
//       status: response.status(),
//       contentType: "application/json",
//       headers: response.headers(),
//       body: JSON.stringify(json),
//     });
//   });

//   const originalFetch = request.fetch.bind(request);

//   request.fetch = async (url: any, options?: any) => {
//     if (url.toString().includes("/api/brand/settings")) {
//       const response = await originalFetch(url, options);
//       const json = await response.json();

//       applyOverrides(json, overrides);

//       return { ...response, json: async () => json } as any;
//     }

//     return originalFetch(url, options);
//   };

//   return () => {
//     request.fetch = originalFetch;
//   };
// }

// function applyOverrides(json: any, overrides: UIOverrides) {
//   const schema = json.data.meta.uischema;

//   if (overrides.basketBillingOnCheckout !== undefined)
//     schema["@display.checkout.basketBilling"] =
//       overrides.basketBillingOnCheckout;

//   if (overrides.basketFieldsOnCheckout !== undefined)
//     schema["@display.checkout.basketFields"] =
//       overrides.basketFieldsOnCheckout;

//   if (overrides.basketProductsOnCheckout !== undefined)
//     schema["@display.checkout.basketProducts"] =
//       overrides.basketProductsOnCheckout;

//   if (overrides.checkoutTemplate !== undefined)
//     schema["@route.checkout.template"] =
//       overrides.checkoutTemplate;

//   if (overrides.basketTemplate !== undefined)
//     schema["@route.basket.template"] =
//       overrides.basketTemplate;

//   if (overrides.basketProductTemplate !== undefined)
//     schema["@route.['basket-product-edit'].template"] =
//       overrides.basketProductTemplate;

//   if (overrides.productConfigTemplate !== undefined)
//     schema["@route.['product-configure'].template"] =
//       overrides.productConfigTemplate;

//   if (overrides.registerTemplate !== undefined)
//     schema["@route.['session-register'].template"] =
//       overrides.registerTemplate;

//   if (overrides.loginTemplate !== undefined)
//     schema["@route.['session-login'].template"] =
//       overrides.loginTemplate;
// }
