import { Page, Route, Request } from "@playwright/test";

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

export function interceptUISchema(page: Page, overrides: UIOverrides) {
  page.route(
    "**/api/brand/settings?**",
    async (route: Route, request: Request) => {
      const response = await page.request.fetch(request);
      const json = await response.json();
      json.data.meta.uischema["@display.checkout.basketFields"] =
        overrides.basketBillingOnCheckout;
      json.data.meta.uischema["@display.checkout.basketFields"] =
        overrides.basketFieldsOnCheckout;
      json.data.meta.uischema["@display.checkout.basketProducts"] =
        overrides.basketProductsOnCheckout;
      json.data.meta.uischema["@route.checkout.template"] =
        overrides.checkoutTemplate;
      json.data.meta.uischema['@route["session.register"].template'] =
        overrides.registerTemplate;
      json.data.meta.uischema['@route["session.login"].template'] =
        overrides.loginTemplate;
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
