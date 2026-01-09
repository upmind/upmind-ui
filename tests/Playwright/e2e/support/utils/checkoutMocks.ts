import { Page } from "@playwright/test";

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
