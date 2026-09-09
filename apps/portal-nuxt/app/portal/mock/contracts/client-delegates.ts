// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-delegates
 * @description Four-layer contract for the `client-delegates` module headless
 * does not have yet (plan §3): the delegate collection
 * (`useClientDelegates`), the per-delegate manager (`useClientDelegate`), and
 * the two delegated-object listings its detail page renders
 * (`useClientDelegateProducts`, `useClientDelegateTickets`). Rows are the wire
 * `IClientDelegate` — it already carries the tags and counts the rows render.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the delegates
 * listing and overview (`delegatedObjectMsg.vue`); gap-doc rows "4. Account →
 * Delegates", X9.
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
  DelegateObjectTypes,
  IClientDelegate,
  IContractProduct,
  ITicket
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * How much of the account a delegate reaches.
 *
 * @decision Portal-local. Searched `packages/types` for a delegate access
 * enum — the wire carries the boolean `IClientDelegate.is_full_delegate` and
 * per-object `IDelegate` rows instead, so the two-way control legacy renders
 * has no enum to reuse.
 */
export const DelegateAccessTypes = {
  /** The delegate reaches every object on the account. */
  FULL: "full",
  /** The delegate reaches only the objects granted to them. */
  SPECIFIC: "specific"
} as const;

export type DelegateAccessTypes =
  (typeof DelegateAccessTypes)[keyof typeof DelegateAccessTypes];

/** What the invite form writes — legacy's `clientDelegateInviteModal` fields. */
export type DelegateInviteModel = {
  /** Who is being invited; the invitation is addressed to it. */
  email: string;
  accessType: DelegateAccessTypes;
  /** The products granted — meaningless, and empty, on a FULL invitation. */
  productIds?: IContractProduct["id"][];
  /** The tickets granted — likewise. */
  ticketIds?: ITicket["id"][];
};

/** What the invite schema is handed — everything a specific invitation may name. */
export type DelegateInviteContext = {
  /** The client's own products, as the picker's options. */
  readonly products: readonly Pick<IContractProduct, "id" | "name">[];
  /**
   * The client's own tickets, named by subject as legacy named them. The
   * reference is OPTIONAL: the wire declares it required, and a thread the
   * desk has not numbered yet carries none.
   */
  readonly tickets: readonly (Pick<ITicket, "id" | "subject"> & {
    readonly reference?: ITicket["reference"];
  })[];
};

// -----------------------------------------------------------------------------
// SCOPE — one matrix per composable
// -----------------------------------------------------------------------------

/** Context types for the delegate COLLECTION — whose delegates are read. */
export const ClientDelegatesContextTypes = {
  /** Reading a client's own delegates. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientDelegatesContextTypes =
  (typeof ClientDelegatesContextTypes)[keyof typeof ClientDelegatesContextTypes];

/**
 * Scope matrix for `useClientDelegates`. `client` is the only actor that
 * resolves; a delegate PERSONA is out of scope (plan §6).
 */
export const CLIENT_DELEGATES_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientDelegatesContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientDelegates`. */
export type ClientDelegatesScopeMatrix = typeof CLIENT_DELEGATES_SCOPE_MATRIX;

/**
 * Context types for the per-delegate MANAGER and its two delegated-object
 * listings — which delegate is addressed.
 */
export const ClientDelegateContextTypes = {
  /** Acting on one existing delegate by id. */
  DELEGATE: "delegate"
} as const;

export type ClientDelegateContextTypes =
  (typeof ClientDelegateContextTypes)[keyof typeof ClientDelegateContextTypes];

/**
 * Scope matrix for `useClientDelegate` and the delegated-object listings.
 * Separate from the collection's — they scope on the delegate, not the client.
 */
export const CLIENT_DELEGATE_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientDelegateContextTypes.DELEGATE,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientDelegate`. */
export type ClientDelegateScopeMatrix = typeof CLIENT_DELEGATE_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/**
 * Wire columns the delegate list can be sorted by. The gap doc records that
 * legacy sorts this list without itemising the set; these are the columns its
 * rows render.
 */
export const ClientDelegatesSortableProperties = {
  DEFAULT: "created_at",
  DATE_CREATED: "created_at",
  NAME: "public_name"
} as const;

export type ClientDelegatesSortableProperties =
  (typeof ClientDelegatesSortableProperties)[keyof typeof ClientDelegatesSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/**
 * The collection's named filters. Legacy's delegate filter file is not
 * recorded in the gap doc; these keys are the row tags its listing renders.
 */
export type ClientDelegatesFilters = {
  /** Free-text narrowing over name and email. */
  query: (value?: string) => void;
  /** Narrows to accepted (or still pending) invitations. */
  active: (value?: IClientDelegate["active"]) => void;
  /** Narrows to full-access delegates — the "Full access" tag. */
  isFullDelegate: (value?: IClientDelegate["is_full_delegate"]) => void;
};

/** The delegated-object listings offer no narrowing of their own. */
export type ClientDelegateObjectsFilters = Record<string, never>;

// -----------------------------------------------------------------------------
// LAYERS — useClientDelegates (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of delegates and its lookups. */
export type UseClientDelegatesContext = {
  /** The reactive current page of this scope's delegates (always an array). */
  data: ComputedRef<IClientDelegate[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one delegate on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IClientDelegate>>["findOne"];
  /** Finds one delegate on the page by id. */
  getOne: ReturnType<typeof useCollection<IClientDelegate>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientDelegatesMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this client has delegated nothing to anyone. */
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

/** Collection actions — list controls, the invitation, and lifecycle. */
export type UseClientDelegatesActions = {
  /** Invites one person, resolving the delegate the invitation created. */
  invite: (model: DelegateInviteModel) => Promise<IClientDelegate | undefined>;
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientDelegatesFilters;
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
    property?: ClientDelegatesSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientDelegatesInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useClientDelegate (manager)
// -----------------------------------------------------------------------------

/** Manager context — the addressed delegate. */
export type UseClientDelegateContext = {
  /** The delegate this scope resolved. */
  data: ComputedRef<IClientDelegate | undefined>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/** Manager meta — one computed per state flag. */
export type UseClientDelegateMeta = {
  /** True if the read or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this scope resolved no delegate. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while a mutation is in flight. */
  isProcessing: ComputedRef<boolean>;
  /** True until the invitation is accepted — the "Pending" tag. */
  isPending: ComputedRef<boolean>;
  /** True while the delegate reaches the whole account. */
  isFullDelegate: ComputedRef<boolean>;
};

/** Manager actions — the delegate's own capabilities plus lifecycle. */
export type UseClientDelegateActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the delegate is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the delegate from the server. */
  refresh: () => Promise<void>;
  /** Revokes the delegation entirely. */
  remove: () => Promise<void>;
  /** Switches the delegate between whole-account and per-object access. */
  setAccessType: (value: DelegateAccessTypes) => Promise<void>;
  /** Grants or revokes one object for this delegate. */
  toggleObject: (
    objectType: DelegateObjectTypes,
    objectId: string
  ) => Promise<void>;
};

/** Manager internals (debugging) — exempt from conformance. */
export type UseClientDelegateInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useClientDelegateProducts (collection)
// -----------------------------------------------------------------------------

/** Collection context — the products granted to the addressed delegate. */
export type UseClientDelegateProductsContext = {
  /** The reactive current page of delegated products (always an array). */
  data: ComputedRef<IContractProduct[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one product on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IContractProduct>>["findOne"];
  /** Finds one product on the page by id. */
  getOne: ReturnType<typeof useCollection<IContractProduct>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientDelegateProductsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if nothing is delegated to this delegate. */
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
export type UseClientDelegateProductsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query — this listing offers none. */
  filters: ClientDelegateObjectsFilters;
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
  sort: (property?: string, direction?: RequestSortDirection) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientDelegateProductsInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useClientDelegateTickets (collection)
// -----------------------------------------------------------------------------

/** Collection context — the tickets granted to the addressed delegate. */
export type UseClientDelegateTicketsContext = {
  /** The reactive current page of delegated tickets (always an array). */
  data: ComputedRef<ITicket[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one ticket on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<ITicket>>["findOne"];
  /** Finds one ticket on the page by id. */
  getOne: ReturnType<typeof useCollection<ITicket>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientDelegateTicketsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if no ticket is delegated to this delegate. */
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
export type UseClientDelegateTicketsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query — this listing offers none. */
  filters: ClientDelegateObjectsFilters;
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
  sort: (property?: string, direction?: RequestSortDirection) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientDelegateTicketsInternals = ContractInternals;
