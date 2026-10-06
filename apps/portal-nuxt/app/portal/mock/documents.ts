// -----------------------------------------------------------------------------
/**
 * @module portal/mock/documents
 * @description The sums a BILLING DOCUMENT is made of — the tax split under a
 * total, what has landed against what is still owed, and the token its public
 * link carries. The mock layer stands in for the server, so this is where
 * those figures are worked out (plan R6); the seeds author from here and the
 * facades write from here, and nothing downstream ever recomputes one.
 *
 * A leaf, like `money.ts` beneath it: the seed modules and the facades both
 * reach for it, so it may reach for neither.
 */

import { InvoiceStatusGroups } from "@upmind-automation/types";
import { mockMoney } from "./money";
import { includes } from "lodash-es";
import type { MockMoney, MockTaxLine } from "./types";
import type { InvoiceStatus } from "@upmind-automation/types";
// -----------------------------------------------------------------------------

/** The rate the brand charges tax at — one band, the locale's own (plan R14: one locale). */
export const DOCUMENT_TAX_RATE = 20;

/** Money is kept to the currency's own smallest unit; a third of a penny is not a figure. */
function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Nothing at all, in a document's own currency. */
export function zeroOf(currency: string): MockMoney {
  return mockMoney(0, currency);
}

/**
 * A GROSS total, split into the net it charges for and the tax on it.
 * Splitting rather than adding keeps an authored total exactly what it was —
 * the total is the fact, the breakdown is the explanation.
 */
export function grossBreakdown(
  total: MockMoney,
  rate = DOCUMENT_TAX_RATE
): { subtotal: MockMoney; taxes: MockTaxLine[] } {
  const net = toSmallestUnit(total.amount / (1 + rate / 100));
  const tax = toSmallestUnit(total.amount - net);
  return {
    subtotal: mockMoney(net, total.currency),
    taxes: [{ label: "VAT", rate, amount: mockMoney(tax, total.currency) }]
  };
}

/** How much of a total has landed, given where the document stands. */
export function settlement(
  total: MockMoney,
  status: InvoiceStatus
): { paidAmount: MockMoney; unpaidAmount: MockMoney } {
  if (includes(InvoiceStatusGroups.UNPAID, status)) {
    return { paidAmount: zeroOf(total.currency), unpaidAmount: total };
  }
  return { paidAmount: total, unpaidAmount: zeroOf(total.currency) };
}

/** The public share link's own token — derived from the document id, so it is stable per seed. */
export function shareTokenFor(documentId: string): string {
  return `shr-${documentId}`;
}

/**
 * The public link a document is shared by. The TOKEN is the dataset's; the
 * origin is this browser's, which is why the link is built out here rather
 * than inside a facade.
 */
export function shareLinkFor(token: string): string {
  if (!import.meta.client) return `/invoice/${token}`;
  return `${location.origin}/invoice/${token}`;
}
