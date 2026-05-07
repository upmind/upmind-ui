import { Page } from "@playwright/test";

/**
 * Mocks a Stripe card decline response for testing payment error flows.
 */
export async function mockStripeCardDecline(page: Page) {
  await page.route("https://api.stripe.com/v1/payment_methods", async route => {
    const mockedError = {
      error: {
        code: "card_declined",
        decline_code: "live_mode_test_card",
        doc_url: "https://stripe.com/docs/error-codes/card-declined",
        message:
          "Your card was declined. Your request was in live mode, but used a known test card.",
        param: "",
        request_log_url:
          "https://dashboard.stripe.com/logs/req_fGY1SLS4nXDO87?t=1762263317",
        type: "card_error"
      }
    };

    await route.fulfill({
      status: 402, // Payment Required (Stripe uses this for card declines)
      contentType: "application/json",
      body: JSON.stringify(mockedError)
    });
  });
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

export async function mockPaymentSuccess(page: Page) {
  await page.route("**/api/payments**", async route => {
    const request = route.request();

    if (route.request().method() === "OPTIONS") {
      await route.fallback();
      return;
    }

    if (request.method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": request.headers()["origin"] || "*",
          "Access-Control-Allow-Credentials": "true"
        },
        body: JSON.stringify({
          data: {
            transaction_status: "OK",
            transaction_type: 1,
            approval_url: null,
            transaction_id: "ch_MOCKED"
          },
          related: null,
          total: null,
          error: null,
          messages: [],
          meta: null
        })
      });
      return;
    }

    await route.continue();
  });
}
