import { Page, Route, Request } from "@playwright/test";

interface ConfigOverrides {
  requireAddressForOrders: boolean;
  requireCompanyForOrders: boolean;
  requireRegionInAddress: boolean;
  requirePhoneForOrders: boolean;
}

export async function interceptConfigValues(
  page: Page,
  bearerToken: string,
  overrides: ConfigOverrides
) {
  await page.route(
    "**/api/config/brand/values**",
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
      console.log("Original Config:", JSON.stringify(json, null, 2));
      json.data["invoices.common.require_address_for_orders"] =
        overrides.requireAddressForOrders;
      json.data["invoices.common.require_company_for_orders"] =
        overrides.requireCompanyForOrders;
      json.data["invoices.common.required_region_in_address"] =
        overrides.requireRegionInAddress;
      json.data["invoices.common.require_phone_for_orders"] =
        overrides.requirePhoneForOrders;
      const updatedResponseBody = {
        ...json
      };
      console.log(
        "Updated Config:",
        JSON.stringify(updatedResponseBody, null, 2)
      );
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
      console.log("Original Config:", JSON.stringify(json, null, 2));
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
      console.log(
        "Updated Terms:",
        JSON.stringify(updatedResponseBody, null, 2)
      );
      route.fulfill({
        status: response.status(),
        contentType: "application/json",
        headers: response.headers(),
        body: JSON.stringify(updatedResponseBody)
      });
    }
  );
}
