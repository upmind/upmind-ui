import { BrowserContext } from "@playwright/test";
import { getSessionToken } from "../api/auth";
import { getCurrentOrder } from "../api/basket";

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
