// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-invoices
 * @description Four-layer contract for the `client-invoices` module headless
 * does not have yet (plan §3): the paged invoice collection
 * (`useClientInvoices`) and the per-invoice manager (`useClientInvoice`). The
 * mock facade implements it today; `/scoped-composable-factory` consumes it
 * unchanged (plan R2). Rows are the headless `Invoice` / `Payment` models —
 * `useInvoice` already maps them, so nothing is minted here.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the invoices
 * listing and its filter set (`src/data/filters/invoice.ts`, `*Listing.vue`),
 * the invoice document (`invoiceItems.vue`), `downloadInvoiceCta.vue`;
 * gap-doc rows "3. Billing → Invoices", X1, X4, X8.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  Invoice,
  PaginationInfo,
  Payment,
  PaymentDetail,
  RequestSortDirection,
  ResponseError,
  useCollection
} from "@upmind-automation/headless";
import type {
  ICurrency,
  IContractProduct,
  IInvoice,
  InvoiceStatus
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * What the pay form writes — legacy's `invoicePaymentModal` payload, narrowed
 * to the two questions its client half asked: how much of the balance, and
 * how much of that off the account's credit.
 */
export type InvoicePaymentModel = {
  /** How much to settle; absent settles the whole balance. */
  amount?: number;
  /** Whether to draw on the account's credit at all — legacy's own tick box. */
  useCredit?: boolean;
  /** How much of the payment comes off that credit. */
  creditAmount?: number;
};

/**
 * What the change-method schema is handed — the stored cards this account
 * holds, and the one the document is settled with today.
 */
export type InvoicePaymentMethodContext = {
  /** Every card on file, in the words the client knows them by. */
  readonly methods: readonly { readonly id: string; readonly label: string }[];
  /** The card this document names, or the one that would be charged until it names any. */
  readonly paymentDetailId?: string;
};

/**
 * What the pay schema is handed. Every figure arrives already worked out
 * (plan R6): the balance in the currency being handed over, the credit the
 * account holds in it, and whether the brand takes part of a balance at all.
 */
export type InvoicePaymentContext = {
  /** The document being settled, for the form to name. */
  readonly number: IInvoice["number"];
  /** What is still owed, in the currency the client chose to pay in. */
  readonly owed: number;
  /** That currency's code — every figure on the form is denominated in it. */
  readonly currencyCode: string;
  /** The same balance as the client reads it. */
  readonly owedFormatted: string;
  /** The credit this account holds in that currency; absent means none. */
  readonly credit?: number;
  /** The same credit as the client reads it. */
  readonly creditFormatted?: string;
  /** The most of that credit this payment can absorb — `min(credit, owed)`. */
  readonly creditCap?: number;
  /**
   * What the credit line SAYS — legacy's own three sentences, chosen by which
   * of the balance and the limit the account actually has
   * (`selectPaymentMethodComp.vue:238-251`).
   */
  readonly creditSummary?: string;
  /** Whether the amount is the client's to change — `PARTIAL_PAYMENTS_ENABLED`. */
  readonly canChangeAmount: boolean;
};

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the invoice COLLECTION — whose invoices are read. */
export const ClientInvoicesContextTypes = {
  /** Reading a client's own invoice collection. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientInvoicesContextTypes =
  (typeof ClientInvoicesContextTypes)[keyof typeof ClientInvoicesContextTypes];

/**
 * Scope matrix for `useClientInvoices`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_INVOICES_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientInvoicesContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientInvoices` (derived from the runtime const). */
export type ClientInvoicesScopeMatrix = typeof CLIENT_INVOICES_SCOPE_MATRIX;

/** Context types for the per-invoice MANAGER — which invoice is addressed. */
export const ClientInvoiceContextTypes = {
  /** Acting on one existing invoice by id. */
  INVOICE: "invoice"
} as const;

export type ClientInvoiceContextTypes =
  (typeof ClientInvoiceContextTypes)[keyof typeof ClientInvoiceContextTypes];

/**
 * Scope matrix for `useClientInvoice`. Separate from the collection's — the
 * two composables scope on different things and cannot share one.
 */
export const CLIENT_INVOICE_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientInvoiceContextTypes.INVOICE,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientInvoice` (derived from the runtime const). */
export type ClientInvoiceScopeMatrix = typeof CLIENT_INVOICE_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the invoice list can be sorted by (legacy list + Credited tab). */
export const ClientInvoicesSortableProperties = {
  DEFAULT: "created_at",
  DATE_CANCELLED: "cancellation_datetime",
  DATE_CREATED: "created_at",
  DATE_DUE: "due_date",
  DATE_PAID: "paid_datetime",
  STATUS: "status_id",
  TOTAL: "total_amount"
} as const;

export type ClientInvoicesSortableProperties =
  (typeof ClientInvoicesSortableProperties)[keyof typeof ClientInvoicesSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/**
 * The collection's named filters, one call per legacy filter control. Each
 * composes onto the applied criteria; an absent value clears that key.
 */
export type ClientInvoicesFilters = {
  /** Free-text narrowing — the listing's quick search. */
  query: (value?: string) => void;
  /** Narrows to one delivery status; the status tabs ride this. */
  status: (value?: InvoiceStatus) => void;
  /** Narrows by invoice number. */
  number: (value?: IInvoice["number"]) => void;
  /** Narrows by creation date. */
  dateCreated: (value?: IInvoice["created_at"]) => void;
  /** Narrows by due date. */
  dateDue: (value?: IInvoice["due_date"]) => void;
  /** Narrows by total amount. */
  total: (value?: IInvoice["total_amount"]) => void;
  /** Narrows by what the lines came to before tax — legacy's "Subtotal" filter. */
  netAmount: (value?: IInvoice["net_amount"]) => void;
  /** Narrows by what was taken off — legacy's "Discount" filter. */
  discountAmount: (value?: IInvoice["total_discount_amount"]) => void;
  /** Narrows to proforma invoices. */
  isProforma: (value?: IInvoice["proforma"]) => void;
  /** Narrows to one product's invoices — the product billing tab's discriminator. */
  contractProductId: (value?: IContractProduct["id"]) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientInvoices (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of invoices and its lookups. */
export type UseClientInvoicesContext = {
  /** The reactive current page of this scope's invoices (always an array). */
  data: ComputedRef<Invoice[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one invoice on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<Invoice>>["findOne"];
  /** Finds one invoice on the page by id. */
  getOne: ReturnType<typeof useCollection<Invoice>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientInvoicesMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this scope has no invoices. */
  isEmpty: ComputedRef<boolean>;
  /** True while the list is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while there is a further page beyond the current one. */
  hasNextPage: ComputedRef<boolean>;
  /** True while there is a page before the current one. */
  hasPrevPage: ComputedRef<boolean>;
  /** True while the list spans more than one page. */
  hasPages: ComputedRef<boolean>;
};

/** Collection actions — list controls and lifecycle. */
export type UseClientInvoicesActions = {
  /**
   * Gathers the client's consolidatable invoices into one — legacy's
   * `consolidateInvoices`, resolving the document it raised.
   *
   * CHANGE (plan §3): legacy's staff-facing modal lets the actor narrow the
   * set and posts `invoice_ids`; the client's own banner offers the count it
   * just named and nothing else, so this seam takes no list.
   */
  consolidate: () => Promise<Invoice>;
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientInvoicesFilters;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the collection is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Fetches the next page. */
  nextPage: () => void;
  /** Fetches the previous page. */
  prevPage: () => void;
  /** Refetches the list from the server. */
  refresh: () => Promise<void>;
  /** Sorts the list by the given property and direction. */
  sort: (
    property?: ClientInvoicesSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientInvoicesInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useClientInvoice (manager)
// -----------------------------------------------------------------------------

/** Manager context — the addressed invoice and its payment history. */
export type UseClientInvoiceContext = {
  /** The invoice this scope resolved. */
  data: ComputedRef<Invoice | undefined>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** The payments recorded against this invoice. */
  payments: ComputedRef<Payment[]>;
};

/** Manager meta — one computed per state flag. */
export type UseClientInvoiceMeta = {
  /** True if the read or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this scope resolved no invoice. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while a mutation is in flight. */
  isProcessing: ComputedRef<boolean>;
  /** True once the invoice is settled in full. */
  isPaid: ComputedRef<boolean>;
  /** True while the invoice is a proforma. */
  isProforma: ComputedRef<boolean>;
  /** True while an outstanding balance can be paid by the client. */
  canPay: ComputedRef<boolean>;
};

/** Manager actions — the invoice's own capabilities plus lifecycle. */
export type UseClientInvoiceActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the invoice is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the invoice from the server. */
  refresh: () => Promise<void>;
  /**
   * Settles the invoice with a stored payment method, resolving the payment.
   * A currency names what the client hands over — the brand's own alternative
   * payment currency, where it publishes one; absent settles in the currency
   * the document was raised in.
   */
  pay: (
    paymentDetailId: PaymentDetail["id"],
    currencyCode?: ICurrency["code"],
    tender?: InvoicePaymentModel
  ) => Promise<Payment>;
  /** Resolves the invoice's public share link. */
  share: () => Promise<string>;
};

/** Manager internals (debugging) — exempt from conformance. */
export type UseClientInvoiceInternals = ContractInternals;
