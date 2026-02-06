import { BrowserContext, Page, expect } from "@playwright/test";
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
