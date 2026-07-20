import { Page, Response } from "@playwright/test";
import { getBasketViaHeadless } from "../flows/basket-setup";

/**
 * Waits for a POST `/api/cart/calculate` response whose request payload
 * `prices` satisfy `matchPrices`, and returns that Response. The URL + POST +
 * `prices`-extraction (with its non-JSON guard) is the shared matcher every
 * pricing spec repeats; the per-spec predicate on the extracted prices stays
 * caller-side. Arm this BEFORE the action that triggers the calc, then await it.
 *
 * @param page - Playwright Page
 * @param matchPrices - predicate on the request payload's `prices` (unknown, the
 *   caller narrows); return true to accept that calc response
 * @param options - optional `{ timeout }` forwarded to `page.waitForResponse`
 */
export function waitForCalculateResponse(
  page: Page,
  matchPrices: (prices: unknown) => boolean,
  options?: { timeout?: number }
): Promise<Response> {
  return page.waitForResponse(response => {
    if (!/\/api\/cart\/calculate(\?|$)/.test(response.url())) return false;
    if (response.request().method() !== "POST") return false;
    let prices: unknown = null;
    try {
      prices = response.request().postDataJSON()?.prices ?? null;
    } catch {
      prices = null;
    }
    return matchPrices(prices);
  }, options);
}

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
export async function expectedPayAmountText(page: Page): Promise<string> {
  return `Pay ${await expectedPayAmount(page)}`;
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
export async function expectedPayAmount(page: Page): Promise<string> {
  const order = await getBasketViaHeadless(page);
  const total = order?.total_amount_formatted as string | undefined;
  if (!total) {
    throw new Error(
      `Could not read total_amount_formatted from current order. Got: ${JSON.stringify(
        order
      )}`
    );
  }
  return total;
}
