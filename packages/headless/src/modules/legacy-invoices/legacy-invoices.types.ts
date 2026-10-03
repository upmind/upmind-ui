import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import { useI18n } from "../system-localisation";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import type { ResponseError } from "../../utils";
import type { ListQuery, SimpleQuery } from "../query";
import type { QueryKey } from "@tanstack/vue-query";
import type { IClient, ILegacyInvoice } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/legacy-invoices.types
 * @description Types for the legacy-invoices module (FE-3230, LI-1): the
 * query-backed collection (`useLegacyInvoices`) and the query-backed single
 * read (`useLegacyInvoice`). NEITHER composable owns a context enum — the
 * archive hangs off no parent entity (ruling OD1) — so BOTH matrices are
 * all-`never`, passed only as `createScopedComposable`'s `TMatrix` type
 * argument, never as a runtime third argument (`templates/SINGLE-READ.md`).
 * The module copies `invoices/invoices.types.ts` member for member (ruling
 * B6/D-2), narrowed to three filter columns, two order fields, and no
 * payment/write members. The mapped record keeps the wire's own top-level
 * field names and the preserved bill WHOLE under `content` (D-16) — the bill
 * is loosely typed on the wire [w3], so no compiler guards a field name
 * there; section 8.13 of `design.md` enumerates every path a consumer reads.
 *
 * @decision
 * what: this file names no `LegacyInvoicesContextTypes`, no
 * `LEGACY_INVOICES_ITEM_SCOPE_MATRIX` / `LegacyInvoicesItemScopeMatrix`, no
 * `LegacyInvoicesItem` / `LegacyInvoicesWireItem` /
 * `ClientLegacyInvoicesWireItem` / `ClientLegacyInvoicesItem`, and no
 * generically-named `LegacyInvoicesModel` / `LegacyInvoicesSchemas` /
 * `QueryModel` / `FilterModel` / `SortEntry` / `SortModel` / `DEFAULT_SORT` —
 * the query template's own worked-example placeholder names. This module
 * instead ships `LegacyInvoiceScopeMatrix` (singular, per the single-read's
 * own composable name), `LegacyInvoice`, and the `LegacyInvoice`-prefixed
 * model names (`LegacyInvoiceQueryModel`, `LegacyInvoiceFilterModel`,
 * `LegacyInvoiceSortEntry`, `LegacyInvoiceSortModel`,
 * `LEGACY_INVOICE_DEFAULT_SORT`), matching the `invoices` exemplar's own
 * convention (`InvoiceQueryModel`, never bare `QueryModel`).
 * why: `templates/SINGLE-READ.md` "The intake question" settles that the
 * oracle names no entity this actor acts on behalf of for this capability,
 * so NO context enum is minted (ruling OD1) — the template's
 * `LegacyInvoicesContextTypes` placeholder is exactly the invented concept
 * that file warns against. The single read's naming ("Item" suffix) is
 * `SINGLE-READ.md`'s own variation point ("rename `Item` to the module's own
 * singular"); this module's singular is `LegacyInvoice` (the manager
 * composable is `useLegacyInvoice`, matching `useInvoice` beside
 * `useInvoices`), never `LegacyInvoicesItem`. There is no per-client wire
 * arm (`ClientLegacyInvoicesWireItem`/`ClientLegacyInvoicesItem`): arms=none
 * (ruling OD1's all-`never` matrix leaves one non-dropped actor, `client`,
 * so there is no second actor for a member to diverge from — the same
 * reasoning `invoices.services.ts`'s own `scopedServices` comment states).
 * rejected: keeping the template's generic names as unused dead exports —
 * that would ship an invented capability (a context enum with no oracle
 * behind it) that the module does not have, the `verify-cosplay.md` failure
 * `templates/SINGLE-READ.md` names by name.
 */
// -----------------------------------------------------------------------------
// SCOPE — two all-`never` matrices, no context enum (ruling OD1)
// -----------------------------------------------------------------------------

/**
 * Scope matrix for `useLegacyInvoices` — every actor cell is `null as never`,
 * so `.for(entity, id)` is a compile-time error for all four. The archive
 * hangs off no parent entity: unlike `useInvoices`' `CLIENT` cell (four
 * retargets), the oracle gives no actor a path to act on behalf of another
 * client for this resource (`parity.yaml`, ruling OD1). `STAFF: null as
 * never` also withdraws the administrator path family, which FE-3230 places
 * Out of Scope.
 */
export const LEGACY_INVOICES_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useLegacyInvoices` (derived from the runtime const). */
export type LegacyInvoicesScopeMatrix = typeof LEGACY_INVOICES_SCOPE_MATRIX;

/**
 * Scope matrix for `useLegacyInvoice` — the SINGLE read. The record read is a
 * RECORD ID (`.withId(id)`), never a scope context (`templates/SINGLE-READ.md`),
 * so this matrix is the same all-`never` shape as the collection's, kept as a
 * separate declaration beside it (never re-exported from the module barrel —
 * it names no context a consumer could spell).
 */
export const LEGACY_INVOICE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useLegacyInvoice` (derived from the runtime const). */
export type LegacyInvoiceScopeMatrix = typeof LEGACY_INVOICE_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** The whole vocabulary of sortable columns (design.md 8.3) — nothing else is offered. */
export type LegacyInvoiceSortableField = "create_datetime" | "total_amount";

/** One sort entry — the MODEL's ordered form; precedence is position. */
export type LegacyInvoiceSortEntry = {
  field: LegacyInvoiceSortableField;
  dir: SortDirection;
};

/** The BOOT order — issue date, newest first (design.md 8.3) (`oracle: legacyInvoicesProvider.vue:66-69`). */
export const LEGACY_INVOICE_DEFAULT_SORT: LegacyInvoiceSortEntry[] = [
  { field: "create_datetime", dir: SortDirection.DESC }
];

// -----------------------------------------------------------------------------
// QUERY MODEL — the whole request state, owned by ONE schema
// -----------------------------------------------------------------------------

/** The `number` column's declared operator branch (ruling OD4). `like` is CONTAINS only (ruling OD5). */
export type LegacyInvoiceNumberFilter = {
  eq?: string | null;
  neq?: string | null;
  like?: string | null;
};

/** The `total_amount` column's declared operator branch (ruling OD4). */
export type LegacyInvoiceAmountFilter = {
  eq?: number | null;
  neq?: number | null;
  gt?: number | null;
  gte?: number | null;
  lt?: number | null;
  lte?: number | null;
};

/** The `create_datetime` column's declared operator branch (ruling OD4). */
export type LegacyInvoiceDateFilter = {
  eq?: string | null;
  gt?: string | null;
  gte?: string | null;
  lt?: string | null;
  lte?: string | null;
  before?: string | null;
  after?: string | null;
};

/**
 * The whole request state as one model — `filters`, `sort` (ordered,
 * precedence = position) and `pagination`. The instance is validated against
 * `useQuerySchema()`; `list()`'s translator maps it to the wire triple. Every
 * column here is named in `design.md` 8.3 with its declared operator branch —
 * no column or operator here is invented.
 */
export type LegacyInvoiceQueryModel = {
  filters?: {
    number?: LegacyInvoiceNumberFilter;
    total_amount?: LegacyInvoiceAmountFilter;
    create_datetime?: LegacyInvoiceDateFilter;
  };
  sort?: LegacyInvoiceSortEntry[];
  /** The module declares BOTH page-window defaults itself (D-24). */
  pagination?:
    | { limit?: number; offset?: never }
    | { limit: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link LegacyInvoiceQueryModel}. */
export type LegacyInvoiceFilterModel = NonNullable<
  LegacyInvoiceQueryModel["filters"]
>;

/** The ordered sort model — the `sort` branch of {@link LegacyInvoiceQueryModel}. */
export type LegacyInvoiceSortModel = NonNullable<
  LegacyInvoiceQueryModel["sort"]
>;

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * The mapped record. Keeps the wire's own top-level field names, and the
 * preserved bill WHOLE under `content` (D-16, ruling PROJ-1) — no flattened
 * projection is minted; `design.md` 8.13 enumerates every path a consumer
 * reads off `content`, and FE-1902 owns projecting it for render. `content`
 * is loosely typed on the wire [w3] and is kept that way here on purpose: a
 * typed shape would claim a guarantee the wire does not carry.
 */
export type LegacyInvoice = {
  id: string;
  /** The record's OWN number. The saved PDF's stem source (design.md 8.1). */
  number: string;
  total_amount: number | null;
  total_amount_formatted: string | null;
  create_datetime: string | null;
  /** The staged condition reads THIS, never a path on `content` (design.md 8.13). */
  staged_import: boolean;
  /** The preserved bill, whole and loosely typed. See this file's head doc. */
  content: Record<string, unknown>;
  /** The row's own conditions, one flag each, so a list can draw them. */
  meta: LegacyInvoiceRowMeta;
};

/**
 * Per-row conditions, read off the same fields the single read's `useMeta()`
 * reads: `content.status.code` for the payment state, and the record's own
 * `staged_import`.
 */
export type LegacyInvoiceRowMeta = {
  isPaid: boolean;
  isUnpaid: boolean;
  isOverdue: boolean;
  isStaged: boolean;
};

// -----------------------------------------------------------------------------
// SERVICE-LAYER SHAPES
// -----------------------------------------------------------------------------

/** The reactive list query, minted ONCE per scope in `useLegacyInvoices.ts`. */
export type LegacyInvoicesListQuery = ListQuery<
  ILegacyInvoice[],
  LegacyInvoice[],
  LegacyInvoiceQueryModel
>;

/** The reactive single-item query, minted ONCE per scope in `useLegacyInvoice.ts`. */
export type LegacyInvoiceItemQuery = SimpleQuery<ILegacyInvoice, LegacyInvoice>;

/**
 * The reactive availability read, minted ONCE per collection scope. Reads the
 * signed-in client with the `legacy_invoices` relation requested, selected to
 * the `has_legacy_invoices` flag the API computes only when that relation is
 * asked for (`oracle: clients/index.ts:158`). The relation payload itself is
 * unused — the flag is the whole product.
 */
export type LegacyInvoiceAvailabilityQuery = SimpleQuery<IClient, boolean>;

/**
 * The contract `createLegacyInvoicesServices` resolves to — consumed by BOTH
 * composables, so the collection and the single read address the same
 * client through the same seam.
 */
export type LegacyInvoicesServices = {
  queryKey: QueryKey;
  /** True while this scope can address a client — authenticated, with a resolved client id. */
  isAvailable: ComputedRef<boolean>;
  /** Present for four-layer shape uniformity with the `invoices` exemplar (D-2); always `undefined` today. */
  error: ComputedRef<ResponseError | undefined>;
  /** Takes NOTHING: the request state is the declared query schema. */
  loadList: () => LegacyInvoicesListQuery;
  /**
   * AC5 — the module's OWN availability read. Reads the signed-in client with
   * the `legacy_invoices` relation requested, so the API computes
   * `has_legacy_invoices`; the session `/self` include does not request it, so
   * `activeUser` cannot answer this (`oracle: clients/index.ts:158`).
   */
  loadAvailability: () => LegacyInvoiceAvailabilityQuery;
  loadOne: (recordId?: LegacyInvoice["id"]) => LegacyInvoiceItemQuery;
  /**
   * AC8 — downloads the record's raw PDF blob. LI-1 owns this call (ruling
   * B5): the `invoices` exemplar's `downloadPdf` hard-codes a different
   * path and cannot serve `import_invoice_data/{id}/download_pdf`.
   */
  downloadPdf: (recordId: LegacyInvoice["id"]) => Promise<Blob>;
};

// -----------------------------------------------------------------------------
// ERRORS
// -----------------------------------------------------------------------------

/**
 * OD2's typed condition — thrown by `downloadPdf` on a 404, so a page can
 * render the oracle's "file generating" meaning without a toast layer, which
 * headless owns none of. Distinguished from the ordinary download failure by
 * type (`instanceof`), never by message string (design.md 8.10, AC12).
 */
export class LegacyInvoiceDocumentNotReadyError extends DetailedError {
  constructor() {
    super(
      useI18n().t("error.legacy_invoices_document_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Upmind
    );
  }
}
