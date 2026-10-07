/** @internal */
import { InvoiceStatus } from "@upmind-automation/types";
import { castArray, get, map } from "lodash-es";
import type { LegacyInvoice } from "./legacy-invoices.types";
import type { ILegacyInvoice } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/legacy-invoices.mappers
 * @description Wire -> VM mapping for the legacy-invoices module. Keeps the
 * wire's own top-level field names, and keeps the preserved bill (`content`)
 * WHOLE — no flattened projection is minted (D-16, ruling PROJ-1). The
 * seventeen preserved-bill paths a consumer reads, and the five published
 * conditions, are enumerated in `design.md` 8.13; both are read directly off
 * `content` by the manager's meta layer, never re-shaped here.
 *
 * @decision
 * what: this file exports `mapLegacyInvoices` / `mapLegacyInvoice`, never
 * the query template's own worked-example names `mapLegacyInvoicesItems` /
 * `mapLegacyInvoicesItem` / `mapClientLegacyInvoicesItems` /
 * `mapClientLegacyInvoicesItem`.
 * why: the collection/single-read naming pair follows
 * `templates/SINGLE-READ.md`'s own variation point (this module's singular
 * is `LegacyInvoice`, so the plural collection mapper is
 * `mapLegacyInvoices` and the singular is `mapLegacyInvoice` — matching
 * `invoices.mappers.ts`'s `mapInvoices`/`mapInvoice`, never an `Item`
 * suffix). The `Client*` pair is the template's ARM worked example
 * (`ARMS.md`): arms=none for this module (ruling OD1 leaves one
 * non-dropped actor, `client`, so no second actor exists for a mapper to
 * diverge from), so no per-actor mapper is minted.
 * rejected: shipping the template's generic names as unused dead exports —
 * clause 2 of `ARMS.md` bans an empty/unearned arm scaffold outright, and an
 * arm-shaped mapper with nothing to diverge over is exactly that.
 */
// -----------------------------------------------------------------------------

/** Maps one or many raw records to the VM. */
export function mapLegacyInvoices(
  raw: ILegacyInvoice | ILegacyInvoice[]
): LegacyInvoice[] {
  return map(castArray(raw), mapLegacyInvoice);
}

/**
 * Maps one raw record to the VM, keeping its top level and preserved bill together.
 * The preserved bill (`content`) is passed WHOLE, exactly as the oracle hands it
 * to the row and reads its paths downstream, never re-shaped here (ruling PROJ-1).
 * (`oracle: legacyInvoicesListing.vue:55` — `:invoice="invoice.content"` passes
 * the whole bag; `legacyInvoiceProvider.vue:80-134` read its paths;
 * `legacyInvoiceProvider.vue:212` reads the top-level `number`.)
 */
export function mapLegacyInvoice(raw: ILegacyInvoice): LegacyInvoice {
  const statusCode = get(raw.content, "status.code");

  return {
    id: raw.id,
    number: raw.number,
    total_amount: raw.total_amount,
    total_amount_formatted: raw.total_amount_formatted,
    create_datetime: raw.create_datetime,
    staged_import: !!raw.staged_import,
    content: raw.content,
    meta: {
      isPaid: statusCode === InvoiceStatus.PAID,
      isUnpaid: statusCode === InvoiceStatus.UNPAID,
      isOverdue: statusCode === InvoiceStatus.OVERDUE,
      isStaged: !!raw.staged_import
    }
  };
}
