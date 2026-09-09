// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-credit-notes
 * @description Four-layer contract for the `client-credit-notes` module
 * headless does not have yet (plan §3): the paged credit-note collection
 * (`useClientCreditNotes`) and the per-note read (`useClientCreditNote`). A
 * credit note IS a wire `IInvoice` carrying `InvoiceCategoryCode.CREDIT_NOTE`,
 * so no row type is minted here.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the credit
 * notes listing and its detail (refund payments, lines, offset invoice);
 * gap-doc rows "3. Billing → Credit notes", X8.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  PaginationInfo,
  RequestSortDirection,
  ResponseError,
  useCollection
} from "@upmind-automation/headless";
import type {
  CreditNoteStatus,
  IInvoice,
  IPayment
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the credit-note COLLECTION — whose notes are read. */
export const ClientCreditNotesContextTypes = {
  /** Reading a client's own credit-note collection. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientCreditNotesContextTypes =
  (typeof ClientCreditNotesContextTypes)[keyof typeof ClientCreditNotesContextTypes];

/**
 * Scope matrix for `useClientCreditNotes`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_CREDIT_NOTES_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientCreditNotesContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientCreditNotes`. */
export type ClientCreditNotesScopeMatrix =
  typeof CLIENT_CREDIT_NOTES_SCOPE_MATRIX;

/** Context types for the per-note read — which credit note is addressed. */
export const ClientCreditNoteContextTypes = {
  /** Reading one existing credit note by id. */
  CREDIT_NOTE: "credit-note"
} as const;

export type ClientCreditNoteContextTypes =
  (typeof ClientCreditNoteContextTypes)[keyof typeof ClientCreditNoteContextTypes];

/** Scope matrix for `useClientCreditNote`. Separate from the collection's. */
export const CLIENT_CREDIT_NOTE_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientCreditNoteContextTypes.CREDIT_NOTE,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientCreditNote`. */
export type ClientCreditNoteScopeMatrix =
  typeof CLIENT_CREDIT_NOTE_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the credit-note list can be sorted by. */
export const ClientCreditNotesSortableProperties = {
  DEFAULT: "created_at",
  DATE_CANCELLED: "cancellation_datetime",
  DATE_CREATED: "created_at",
  STATUS: "status_id",
  TOTAL: "total_amount"
} as const;

export type ClientCreditNotesSortableProperties =
  (typeof ClientCreditNotesSortableProperties)[keyof typeof ClientCreditNotesSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The collection's named filters — an absent value clears that key. */
export type ClientCreditNotesFilters = {
  /** Free-text narrowing — the listing's quick search. */
  query: (value?: string) => void;
  /** Narrows to allocated or unallocated notes — the legacy status column. */
  status: (value?: CreditNoteStatus) => void;
  /**
   * Narrows by what the note came to — legacy's own `total_amount` filter
   * (`data/filters/creditNotes.ts`), which the band offers as an amount band.
   */
  total: (value?: string) => void;
  /** Narrows by creation date. */
  dateCreated: (value?: IInvoice["created_at"]) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientCreditNotes (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of credit notes and its lookups. */
export type UseClientCreditNotesContext = {
  /** The reactive current page of this scope's credit notes (always an array). */
  data: ComputedRef<IInvoice[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one credit note on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IInvoice>>["findOne"];
  /** Finds one credit note on the page by id. */
  getOne: ReturnType<typeof useCollection<IInvoice>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientCreditNotesMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this scope has no credit notes. */
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
export type UseClientCreditNotesActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientCreditNotesFilters;
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
    property?: ClientCreditNotesSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientCreditNotesInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useClientCreditNote (single read)
// -----------------------------------------------------------------------------

/** Single-read context — the addressed note, its refunds and its offset. */
export type UseClientCreditNoteContext = {
  /** The credit note this scope resolved. */
  data: ComputedRef<IInvoice | undefined>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** The refund payments recorded against this note. */
  refunds: ComputedRef<IPayment[]>;
  /** The invoice this note credits, when it offsets one. */
  offsetInvoiceId: ComputedRef<IInvoice["id"] | undefined>;
};

/** Single-read meta — one computed per state flag. */
export type UseClientCreditNoteMeta = {
  /** True if the read failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this scope resolved no credit note. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True once the note's value has been allocated. */
  isAllocated: ComputedRef<boolean>;
};

/** Single-read actions — lifecycle only; a credit note has no client verb. */
export type UseClientCreditNoteActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the credit note is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the credit note from the server. */
  refresh: () => Promise<void>;
};

/** Single-read internals (debugging) — exempt from conformance. */
export type UseClientCreditNoteInternals = ContractInternals;
