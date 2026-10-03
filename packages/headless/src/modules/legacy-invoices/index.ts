// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices
 * @description Public exports for the legacy-invoices module (FE-3230,
 * LI-1) — the COLLECTION (`useLegacyInvoices`) and the SINGLE READ
 * (`useLegacyInvoice`), each a separately exported, separately consumed
 * capability over one shared services factory. Client × self, read-only +
 * PDF: no write member exists. Curated named re-exports only — no
 * `export *` (Module Visibility Law).
 *
 * @decision
 * what: this barrel exports neither runtime matrix
 * (`LEGACY_INVOICES_SCOPE_MATRIX` / `LEGACY_INVOICE_SCOPE_MATRIX`, TYPES
 * only), no `LegacyInvoicesContextTypes`, and no generic
 * `LegacyInvoicesItem` / `LegacyInvoicesModel` (the query template's own
 * placeholder names).
 * why: both matrices are all-`never` (ruling OD1) — neither one names a
 * context a consumer could spell, exactly the case
 * `templates/SINGLE-READ.md` states a matrix VALUE (as opposed to its type)
 * is "not re-exported from the module barrel" for. The `invoices` exemplar's
 * own barrel exports `INVOICES_SCOPE_MATRIX` only because that COLLECTION's
 * matrix carries real retarget contexts (`.for('contract', id)`, etc.) a
 * consumer needs to spell; this module's collection has none (design.md
 * D-3). No context enum is minted at all, so there is no
 * `LegacyInvoicesContextTypes` to export. `LegacyInvoicesItem`/
 * `LegacyInvoicesModel` are superseded by `LegacyInvoice`/
 * `LegacyInvoiceQueryModel` — see the `@decision` in
 * `legacy-invoices.types.ts`.
 * rejected: exporting the runtime matrix values regardless — a consumer
 * could then read them as if `.for()` were reachable, which OD1 and
 * `templates/SINGLE-READ.md`'s all-`never` construction exist to prevent.
 */

// --- Composables
export { useLegacyInvoices } from "./useLegacyInvoices";
export type { UseLegacyInvoices } from "./useLegacyInvoices";
export { useLegacyInvoice } from "./useLegacyInvoice";
export type { UseLegacyInvoice } from "./useLegacyInvoice";

// --- Scope matrices — type-argument only; neither names a context a
// consumer could spell (ruling OD1).
export type {
  LegacyInvoicesScopeMatrix,
  LegacyInvoiceScopeMatrix
} from "./legacy-invoices.types";

// --- Public model types
export type {
  LegacyInvoice,
  LegacyInvoiceFilterModel,
  LegacyInvoiceQueryModel,
  LegacyInvoiceSortableField,
  LegacyInvoiceSortEntry,
  LegacyInvoiceSortModel
} from "./legacy-invoices.types";

// --- The typed download condition (OD2)
export { LegacyInvoiceDocumentNotReadyError } from "./legacy-invoices.types";

// --- Sub-composable type exports (collection)
export type { UseLegacyInvoicesActions } from "./useLegacyInvoices.actions";
export type { UseLegacyInvoicesContext } from "./useLegacyInvoices.context";
export type { UseLegacyInvoicesMeta } from "./useLegacyInvoices.meta";
export type { UseLegacyInvoicesInternals } from "./useLegacyInvoices.internals";

// --- Sub-composable type exports (single read)
export type { UseLegacyInvoiceActions } from "./useLegacyInvoice.actions";
export type { UseLegacyInvoiceContext } from "./useLegacyInvoice.context";
export type { UseLegacyInvoiceMeta } from "./useLegacyInvoice.meta";
export type { UseLegacyInvoiceInternals } from "./useLegacyInvoice.internals";
