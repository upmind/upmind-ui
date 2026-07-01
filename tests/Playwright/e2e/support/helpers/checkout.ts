import { BrowserContext, Page } from "@playwright/test";
import { getSessionToken } from "../api/auth";
import { getCurrentOrder } from "../api/basket";

/**
 * Returns a promise that resolves when the basket billing update PUT completes.
 * This is the call that sets address_id on the order — the slow call with route guards.
 * Call BEFORE clicking save, then await AFTER clicking.
 *
 * @param page - Playwright Page
 */
export function waitForBillingUpdate(page: Page) {
  return page.waitForResponse(
    resp =>
      resp.request().method() === "PUT" &&
      /\/api\/orders\/[^/]+(\?|$)/.test(resp.url())
  );
}

/**
 * Reads the current basket's formatted total from the API and returns the
 * expected pay-amount text the UI should render (e.g. "Pay £72.00").
 *
 * Reading from the API keeps assertions truthful against the real staging
 * price/promo/FX state — see `.agent/rules/code-tests-e2e.md` and
 * `tests/Playwright/docs/12-pseudo-nathan.md` (brittle assertions).
 */
export async function expectedPayAmountText(
  context: BrowserContext
): Promise<string> {
  return `Pay ${await expectedPayAmount(context)}`;
}

/**
 * Reads the current basket's formatted total from the API and returns the bare
 * formatted amount (e.g. "£72.00") — the value the pay-amount element carries
 * on its `data-test-value` attribute (set in `PaymentDetails.vue` from
 * `amountsFormatted.amount`). Assert against `pay-amount-value`'s
 * `data-test-value` rather than the translated "Pay {amount}" copy, which is
 * locale-unstable. Reading from the API keeps the expectation truthful against
 * the real staging price/promo/FX state.
 */
export async function expectedPayAmount(
  context: BrowserContext
): Promise<string> {
  const token = await getSessionToken(context);
  const order = await getCurrentOrder(token);
  const total = order?.total_amount_formatted;
  if (!total) {
    throw new Error(
      `Could not read total_amount_formatted from current order. Got: ${JSON.stringify(
        order
      )}`
    );
  }
  return total;
}
