// -----------------------------------------------------------------------------
/**
 * @module portal/mock/money
 * @description The ONE money formatter of the mock layer (plan R6): amounts
 * are data, and every `MockMoney.formatted` in a seed or a store mutation
 * comes from here. Selectors and components read `.formatted`; nothing
 * downstream computes a figure (no client money math).
 *
 * A leaf on purpose. Seeds format at build time, so a formatter living in
 * `store.ts` would close the cycle store → hostgrid → hostgrid.filler → store
 * and strand `store.ts`'s seed registry in the seed module's TDZ.
 */

import type { MockMoney } from "./types";
// -----------------------------------------------------------------------------

/** The mock brand trades in one locale — the portal has no i18n yet (plan R14). */
const MONEY_LOCALE = "en-GB";

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(MONEY_LOCALE, {
    style: "currency",
    currency
  }).format(amount);
}

/** An amount, its currency and its display string — the shape every money field carries. */
export function mockMoney(amount: number, currency: string): MockMoney {
  return { amount, currency, formatted: formatMoney(amount, currency) };
}
