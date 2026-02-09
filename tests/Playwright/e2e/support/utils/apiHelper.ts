import { BrowserContext, Page, Route, expect } from "@playwright/test";
import { URLs } from "../constants/urls";
import { getSessionToken } from "./functions/tokens";
import {
  createOrder,
  addProductToOrder,
  addPromotionToOrder,
  setOrderCurrency
} from "./functions/basket";
import { fakerEN_GB } from "@faker-js/faker";
import { products } from "../constants/products";

export async function goToCheckout(
  page: Page,
  context: BrowserContext,
  promotion: string | null = null,
  currency: string | null = null
) {
  await page.goto(URLs.basket);
  await expect
    .poll(
      async () => {
        const cookies = await context.cookies();
        return cookies.some(c => c.name === "upm_guest_session");
      },
      { timeout: 30000 }
    )
    .toBeTruthy();
  let token = await getSessionToken(context);
  let orderId = await createOrder(token);
  await addProductToOrder(
    `${token}`,
    `${orderId}`,
    products.DOMAIN_REGISTRATION,
    1,
    24,
    [],
    [],
    {
      domain: `${fakerEN_GB.string.alphanumeric({
        length: { min: 3, max: 15 }
      })}.com`
    },
    [],
    true
  );
  if (promotion != null) {
    await addPromotionToOrder(orderId, promotion, token);
  }
  if (currency != null) {
    await setOrderCurrency(token, orderId, currency);
  }
  await page.goto(URLs.basket);
  await page.getByTestId("button-proceed-to-checkout").click();
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

//TODO: Just make a generic order data getter and remove all the functions that point at this endpoint
export async function getCurrentAddressId(token: string) {
  const response = await fetch(
    `${URLs.apiUrl}api/orders/current?with=address%2Caddress.country%2Ccurrency%2Ccustom_fields.field%2Cpromotions%2Ctaxes%2Ctaxes.tax_tag_data%2Cproducts.product.image%2Cproducts.product.images%2Cproducts.product.prices%2Cproducts.product.products_attributes%2Cproducts.product.products_attributes.category%2Cproducts.product.products_options%2Cproducts.product.products_options.category%2Cproducts.product.products_options.prices%2Cproducts.product.provision_blueprint%2Cproducts.product.provision_field_values%2Cproducts.tags%2Cproducts.product.related%2Cproducts.product.category%2Cproducts.product.category.top_category.top_category.top_category.top_category&lang=en`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        Origin: `${URLs.apiOrigin}`
      }
    }
  );
  const body = await response.json();
  console.log(`Current Address ID: ${JSON.stringify(body.data.address_id)}`);
  return body.data.address_id ?? null;
}

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
  } catch (e) {
    return false;
  }
}
