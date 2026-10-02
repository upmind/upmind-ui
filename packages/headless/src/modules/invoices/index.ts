// -----------------------------------------------------------------------------
/**
 * @module invoices
 * @description Public exports for the invoices module — the COLLECTION
 * (`useInvoices`, scoped) and the SINGLE INVOICE (`useInvoice`, flat: reads one
 * invoice, pays it, downloads its PDF, assigns its payment method). Curated
 * named re-exports only — no `export *` (Module Visibility Law).
 */

// --- Composables
export { useInvoices } from "./useInvoices";
export type { UseInvoices } from "./useInvoices";
export { useInvoice } from "./useInvoice";
export type { UseInvoice } from "./useInvoice";

// --- Scope matrix — the COLLECTION's only.
export {
  INVOICES_SCOPE_MATRIX,
  InvoicesContextTypes,
  ORDER_PAY_RETURN_KEY,
  PAYMENT_STATE
} from "./invoices.types";
export type { InvoicesScopeMatrix, PaymentState } from "./invoices.types";

// --- Public model types
export type {
  Invoice,
  InvoiceLineItem,
  InvoiceBundleGroup,
  InvoiceFilterModel,
  InvoicePaymentChallenge,
  InvoicePaymentDetailsModel,
  InvoiceQueryModel,
  InvoiceSortableField,
  InvoiceSortEntry,
  InvoiceSortModel,
  Payment
} from "./invoices.types";

// --- Curated mapper re-exports (design D2)
export { mapInvoice, mapInvoices } from "./invoices.mappers";

// --- Sub-composable type exports (collection)
export type { UseInvoicesActions } from "./useInvoices.actions";
export type { UseInvoicesContext } from "./useInvoices.context";
export type { UseInvoicesMeta } from "./useInvoices.meta";
export type { UseInvoicesInternals } from "./useInvoices.internals";

// --- Sub-composable type exports (single invoice)
export type { UseInvoiceActions } from "./useInvoice.actions";
export type { UseInvoiceContext } from "./useInvoice.context";
export type { UseInvoiceMeta } from "./useInvoice.meta";
export type { UseInvoiceInternals } from "./useInvoice.internals";
