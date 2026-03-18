import { BrowserContext, Page, Route, expect } from "@playwright/test";
import { URLs } from "../constants/urls";
import { getSessionToken } from "./functions/tokens";
import {
  createOrder,
  Order,
  addProductToOrder,
  addPromotionToOrder,
  setOrderCurrency
} from "./functions/basket";
import { fakerEN_GB } from "@faker-js/faker";

/**
 * Creates an order with a product and navigates to checkout.
 * Optionally registers a new client via the API, applies a promotion code,
 * and/or sets a specific currency.
 *
 * When `register` is true (default), a new client account is registered via
 * the API after creating the order — skipping the UI registration page entirely.
 * This is faster and avoids CDP hangs caused by the registration UI.
 *
 * @param page - Playwright page instance
 * @param context - Browser context (used to read the session token)
 * @param product - Product config with id, billingCycle, and type
 * @param promotion - Optional promotion code to apply to the order
 * @param currency - Optional currency code to set on the order
 * @param options - Additional options
 * @param options.register - Whether to register a new client via API (default: true)
 * @param options.registrationOptions - Overrides for the registration fields
 */
export async function goToCheckout(
  page: Page,
  context: BrowserContext,
  product: { id: string; billingCycle: number; type: string },
  promotion: string | null = null,
  currency: string | null = null,
  trialValue: boolean = false
) {
  await page.goto(URLs.basket);
  await expect
    .poll(
      async () => {
        const cookies = await context.cookies();
        return cookies.some(
          c => c.name === "upm_guest_session" || c.name === "upm_client_session"
        );
      },
      { timeout: 30000 }
    )
    .toBeTruthy();
  let token = await getSessionToken(context);
  let order: Order = await createOrder(token);
  let orderId = order.id;
  console.log("Order ID:", orderId);
  if (currency !== null) {
    await setOrderCurrency(token, orderId, currency);
  }
  const provisionFields =
    product.type === "domain" || product.type === "hosting"
      ? {
          domain: `${fakerEN_GB.string.alphanumeric({
            length: { min: 3, max: 15 }
          })}.com`
        }
      : {};
  await addProductToOrder(
    `${token}`,
    `${orderId}`,
    product.id,
    1,
    product.billingCycle,
    [],
    [],
    provisionFields,
    [],
    true,
    trialValue
  );
  if (promotion !== null) {
    await addPromotionToOrder(orderId, promotion, token);
  }
  await page.goto(URLs.checkout);
}

/**
 * Mocks CORS preflight (OPTIONS) requests for the staging API.
 * Only intercepts OPTIONS requests; all other methods pass through to the real API.
 */
export async function mockCorsPreflightRequests(page: Page) {
  await page.route("**/api.staging.upmind.io/**", async route => {
    const request = route.request();

    // Only intercept OPTIONS requests
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers()["origin"] || "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, content-type, accept, x-requested-with",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400"
        }
      });
    } else {
      // Let all other requests (GET, POST, etc.) pass through to the real API
      await route.continue();
    }
  });
}

/**
 * Intercepts requests to /api/orders/current and re-fulfills them.
 * Currently a passthrough — extend this to modify order data as needed.
 *
 * @param context - Browser context to register the route on
 */
// TODO: Make a generic order data getter and remove all the functions that point at this endpoint
export function currentOrderData(context: BrowserContext) {
  context.route("**/api/orders/current**", async (route: Route) => {
    const response = await route.fetch();
    const json = await response.json();
    await route.fulfill({
      status: response.status(),
      contentType: "application/json",
      headers: response.headers(),
      body: JSON.stringify(json)
    });
  });
}

/**
 * Fetches the current order and returns its address ID.
 *
 * @param token - Bearer token for authentication
 * @returns The address ID from the current order, or null if not set
 */
export async function getCurrentAddressId(
  token: string
): Promise<string | null> {
  const response = await fetch(
    `${URLs.apiUrl}api/orders/current?with=address%2Caddress.country%2Ccurrency%2Ccustom_fields.field%2Cpromotions%2Ctaxes%2Ctaxes.tax_tag_data%2Cproducts.product.image%2Cproducts.product.images%2Cproducts.product.prices%2Cproducts.product.products_attributes%2Cproducts.product.products_attributes.category%2Cproducts.product.products_options%2Cproducts.product.products_options.category%2Cproducts.product.products_options.prices%2Cproducts.product.provision_blueprint%2Cproducts.product.provision_field_values%2Cproducts.tags%2Cproducts.product.related%2Cproducts.product.category%2Cproducts.product.category.top_category.top_category.top_category.top_category&lang=en`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        Origin: URLs.apiOrigin
      }
    }
  );
  const body = await response.json();
  return body.data.address_id ?? null;
}

/**
 * Waits for a PUT request to the specified order endpoint.
 *
 * @param page - Playwright page instance
 * @param orderId - The order ID to listen for
 * @param timeout - How long to wait in milliseconds (default: 5000)
 * @returns true if the PUT request was detected, false if it timed out
 */
export async function orderUpdated(
  page: Page,
  orderId: string | null,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await page.waitForRequest(
      request =>
        request.url().includes(`/api/orders/${orderId}`) &&
        request.method() === "PUT",
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

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
 * mockBasketProductPromotions(context, "/api/basket/products/", {}, "all", "prices");
 * mockBasketProductPromotions(context, "/api/modules/web_hosting/domains/search", {}, 12, "prices");
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

/**
 * Mocks the wallet balance and cart/calculate API responses to simulate
 * a client with account credit at checkout. This allows tests to verify
 * the Account Credit UI without needing a real wallet balance.
 *
 * Intercepts:
 *  - GET /api/wallet/balance — returns a mocked IWalletBalance
 *  - POST /api/cart/calculate — returns a mocked total for the credit sum
 *
 * @param context - Browser context to register the routes on
 * @param options - Configurable credit amounts and currency
 * @param options.ownedAmount - The client's owned wallet funds (default: 5)
 * @param options.creditAmount - The client's negative allowance / credit line (default: 0)
 * @param options.currencyCode - Currency code to key the balance under (default: "GBP")
 * @param options.currencyId - Currency ID for the cart/calculate request (default: GBP UUID)
 */
export function mockWalletBalance(
  context: BrowserContext,
  options: {
    ownedAmount?: number;
    creditAmount?: number;
    currencyCode?: string;
    currencyId?: string;
  } = {}
) {
  const {
    ownedAmount = 5,
    creditAmount = 0,
    currencyCode = "GBP",
    currencyId = "3825d96e-763e-d091-3dc4-174825283406"
  } = options;

  const totalAmount = ownedAmount + creditAmount;

  // Helper to format amount as currency string
  const formatAmount = (amount: number, code: string): string => {
    const symbols: Record<string, string> = {
      GBP: "£",
      USD: "$",
      EUR: "€",
      AUD: "A$",
      INR: "₹"
    };
    const symbol = symbols[code] || code + " ";
    return `${symbol}${amount.toFixed(2)}`;
  };

  const makeCurrencyBalance = (amount: number) => ({
    amount: amount,
    amount_formatted: formatAmount(amount, currencyCode),
    amount_converted: amount,
    amount_converted_formatted: formatAmount(amount, currencyCode),
    currency: {
      id: currencyId,
      code: currencyCode
    }
  });

  // Mock GET /api/wallet/balance
  context.route("**/api/wallet/balance**", async (route: Route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers()["origin"] || "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, content-type, accept, x-requested-with",
          "Access-Control-Allow-Credentials": "true"
        }
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": request.headers()["origin"] || "*",
        "Access-Control-Allow-Credentials": "true"
      },
      body: JSON.stringify({
        status: "success",
        data: {
          total: {
            [currencyCode]: makeCurrencyBalance(ownedAmount)
          },
          negative_allowance: {
            [currencyCode]: makeCurrencyBalance(creditAmount)
          },
          online: {
            [currencyCode]: makeCurrencyBalance(ownedAmount)
          },
          offline: {
            [currencyCode]: makeCurrencyBalance(0)
          }
        }
      })
    });
  });

  // Mock POST /api/cart/calculate
  context.route("**/api/cart/calculate**", async (route: Route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers()["origin"] || "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, content-type, accept, x-requested-with",
          "Access-Control-Allow-Credentials": "true"
        }
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": request.headers()["origin"] || "*",
        "Access-Control-Allow-Credentials": "true"
      },
      body: JSON.stringify({
        status: "success",
        data: {
          total: totalAmount,
          total_formatted: formatAmount(totalAmount, currencyCode),
          currency_id: currencyId
        }
      })
    });
  });
}

/**
 * Intercepts product API responses and injects free trial fields.
 * Handles both single-product responses (product config page) and
 * multi-product responses (catalogue / recommendations).
 *
 * Follows the same pattern as `mockPromos` — intercepts the route,
 * modifies the JSON response, and re-fulfills.
 *
 * @param context - Browser context to register the route on
 * @param route - API path to intercept (e.g. "/api/basket/products/")
 * @param options - Trial configuration fields to inject
 * @param options.trialSupported - Whether the product supports a trial (default: true)
 * @param options.trialForce - Whether the trial is forced / cannot be opted out (default: false)
 * @param options.trialDuration - Trial duration in days (default: 7)
 * @param options.trialEndAction - What happens when the trial ends (default: "convert")
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

/**
 * Adds a hardcoded 10 Downing Street address to a client account via the API.
 *
 * @param token - Bearer token for the client session
 * @param clientId - The client UUID to add the address to
 * @returns The created address data from the API response
 */
export async function addAddressToClient(
  token: string,
  clientId: string
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${URLs.apiUrl}api/clients/${clientId}/addresses`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        origin: `${URLs.apiOrigin}`
      },
      body: JSON.stringify({
        name: "10 Downing Street",
        address_1: "10 Downing Street",
        address_2: "",
        country_id: "320e4357-95e7-8d18-484f-31643202d986",
        region_id: "de78642d-e539-7146-295f-21208469530d",
        city: "London",
        postcode: "SW1A 2AB",
        type: 1,
        default: false
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to add address to client ${clientId}: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const body = await response.json();
  return body.data;
}
