// -----------------------------------------------------------------------------
/**
 * @module invoices
 * @description Public exports for the invoices module — the COLLECTION
 * (`useInvoices`) and the SINGLE READ (`useInvoice`), each a separately
 * exported, separately consumed capability over one shared services factory.
 * Curated named re-exports only — no `export *` (Module Visibility Law).
 *
 * `mapInvoice` / `mapInvoices` are curated re-exports consumed by
 * `orders/order.machine.ts` (design D2) — no cross-module import of
 * `invoices.mappers.ts` itself.
 */

// --- Composables
export { useInvoices } from "./useInvoices";
export type { UseInvoices } from "./useInvoices";
export { useInvoice } from "./useInvoice";
export type { UseInvoice } from "./useInvoice";

// --- Scope matrix — the COLLECTION's only. The single read's matrix refuses
// every actor, so it names no context a consumer could spell and stays
// internal; it marks its record with the builder's `.withId(id)`, not with a
// context.
export {
  INVOICES_SCOPE_MATRIX,
  InvoicesContextTypes,
  PAYMENT_STATE
} from "./invoices.types";
export type { InvoicesScopeMatrix, PaymentState } from "./invoices.types";

// --- Public model types
export type {
  Invoice,
  InvoiceBundleGroup,
  InvoiceFilterModel,
  InvoicePaymentDetailsModel,
  InvoiceQueryModel,
  InvoiceSortableField,
  InvoiceSortEntry,
  InvoiceSortModel,
  InvoiceUnpaidAmount,
  Payment
} from "./invoices.types";

// --- Curated mapper re-exports (design D2)
export { mapInvoice, mapInvoices } from "./invoices.mappers";

// --- Sub-composable type exports (collection)
export type { UseInvoicesActions } from "./useInvoices.actions";
export type { UseInvoicesContext } from "./useInvoices.context";
export type { UseInvoicesMeta } from "./useInvoices.meta";
export type { UseInvoicesInternals } from "./useInvoices.internals";

// --- Sub-composable type exports (single read)
export type { UseInvoiceActions } from "./useInvoice.actions";
export type { UseInvoiceContext } from "./useInvoice.context";
export type { UseInvoiceMeta } from "./useInvoice.meta";
export type { UseInvoiceInternals } from "./useInvoice.internals";
