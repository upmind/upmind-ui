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
import {
  registerAndLogin,
  RegisterClientOptions
} from "./functions/registration";
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
  options: {
    register?: boolean;
    registrationOptions?: RegisterClientOptions;
  } = {}
) {
  const { register = true, registrationOptions = {} } = options;

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
    true
  );
  if (promotion !== null) {
    await addPromotionToOrder(orderId, promotion, token);
  }

  if (register) {
    // Register a new client via the API — skips the registration UI entirely.
    // Pass currency context so the registration uses the same currency as the order.
    const regOptions: RegisterClientOptions = { ...registrationOptions };
    if (currency !== null && !regOptions.currencyId) {
      // Map currency code to known IDs, fallback to default GBP
      const currencyMap: Record<string, string> = {
        GBP: "3825d96e-763e-d091-3dc4-174825283406",
        EUR: "4825d96e-763e-d091-3dc4-174825283406",
        USD: "5825d96e-763e-d091-3dc4-174825283406"
      };
      regOptions.currencyId = currencyMap[currency] ?? undefined;
    }
    await registerAndLogin(page, context, regOptions);
    await page.goto(URLs.checkout);
  } else {
    await page.goto(URLs.checkout);
    // Ensure we land on the registration page after checkout navigation
    if (!page.url().includes("/order/auth/register/")) {
      await page.goto(URLs.register);
    }
  }
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
