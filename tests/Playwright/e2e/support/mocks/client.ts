import { BrowserContext, Route } from "@playwright/test";

/**
 * Intercepts GET requests to /api/clients/{id}/addresses and overrides
 * billing-address fields in the first object of the response `data` array.
 * All other fields and subsequent addresses are left unchanged.
 *
 * The route uses a wildcard for the client ID so it works regardless of
 * which client is authenticated during the test run.
 *
 * @param context - Browser context to register the route on
 */
export function mockClientAddresses(context: BrowserContext) {
  context.route("**/api/clients/*/addresses**", async (route: Route) => {
    // Let CORS preflight requests pass through without modification
    if (route.request().method() === "OPTIONS") {
      await route.fallback();
      return;
    }

    const response = await route.fetch();
    const json = await response.json();

    const data = json?.data;
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];

      // Override address fields
      first["name"] = "10 Downing Street";
      first["address_1"] = "10 Downing Street";
      first["address_2"] = "";
      first["region_id"] = "none";
      first["country_id"] = "320e4357-95e7-8d18-484f-31643202d986";
      first["city"] = "London";
      first["county"] = null;
      first["postcode"] = "SW1A 2AA";

      // Inject country relation
      first["country"] = {
        id: "320e4357-95e7-8d18-484f-31643202d986",
        name: "United Kingdom",
        code: "GB",
        code3: "",
        created_at: "2017-10-18 14:16:22",
        updated_at: "2026-03-04 12:44:08",
        vat: "20.00",
        eea: 1,
        phone_code: "+44",
        post_code_regex: "/^[a-zA-Z]{1,2}[0-9][a-zA-Z0-9]? ?[0-9][a-zA-Z]{2}$/"
      };
    }

    await route.fulfill({
      status: response.status(),
      contentType: "application/json",
      headers: response.headers(),
      body: JSON.stringify(json)
    });
  });
}
