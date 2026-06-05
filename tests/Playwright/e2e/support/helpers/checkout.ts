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
  return `Pay ${total}`;
}
