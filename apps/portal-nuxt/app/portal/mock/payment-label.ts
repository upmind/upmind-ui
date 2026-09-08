// -----------------------------------------------------------------------------
/**
 * @module portal/mock/payment-label
 * @description How a stored card is named where a payment or a renewal cites
 * it — a leaf, so the wallet and invoice facades read it without a payment
 * facade behind them (client-vue's payment module owns the cards themselves).
 */

import type { MockPaymentMethod } from "./types";

/** The card as the gateway names it — the brand and its last four. */
export function cardName(method: MockPaymentMethod): string {
  return `${method.brand} ···· ${method.last4}`;
}

/**
 * The client's own name for the card where they gave it one. Absent (an
 * account with no stored card at all) reads as the balance itself.
 */
export function paymentMethodLabel(
  method: MockPaymentMethod | undefined
): string {
  if (method === undefined) return "Account credit";
  return method.displayName ?? cardName(method);
}
