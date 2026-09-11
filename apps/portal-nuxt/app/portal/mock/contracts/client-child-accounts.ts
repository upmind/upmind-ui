// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-child-accounts
 * @description Four-layer contract for the `client-child-accounts` module
 * headless does not have yet (plan §3): the child-account collection
 * (`useClientChildAccounts`) and the per-relation manager
 * (`useClientRelation`). Rows are the wire `IChildAccount`. Logging in as a
 * child is a persona swap in the mock (plan R10), not a module capability.
 *
 * @decision Plan §3 recorded "no wire model found" for the relation; searched
 * `packages/types` at build and `IChildAccount` (`models/clients.ts`) is the
 * model — it carries `allow_impersonation` and `inherit_payment_details`.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the child
 * accounts listing, the manage-relation modal and the brand-appearance panel;
 * gap-doc rows "4. Account → Child accounts", X14.
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
import type { IChildAccount } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * The switches the manage-relation panel offers.
 *
 * @decision `ALLOW_IMPERSONATION` and `INHERIT_PAYMENT_DETAILS` are
 * `IChildAccount` fields; searched `packages/types` for a parent-branding
 * field on `IChildAccount` / `IClient` / `IBrand` and found none, so
 * `USE_PARENT_BRANDING` is named here for the module to map.
 */
export const ClientRelationToggleKeys = {
  /** The parent may log in as this child. */
  ALLOW_IMPERSONATION: "allow_impersonation",
  /** The child bills against the parent's stored payment methods. */
  INHERIT_PAYMENT_DETAILS: "inherit_payment_details",
  /** The child's portal wears the parent's brand appearance. */
  USE_PARENT_BRANDING: "use_parent_branding"
} as const;

export type ClientRelationToggleKeys =
  (typeof ClientRelationToggleKeys)[keyof typeof ClientRelationToggleKeys];

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the child-account COLLECTION — whose children are read. */
export const ClientChildAccountsContextTypes = {
  /** Reading a client's own child accounts. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientChildAccountsContextTypes =
  (typeof ClientChildAccountsContextTypes)[keyof typeof ClientChildAccountsContextTypes];

/**
 * Scope matrix for `useClientChildAccounts`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_CHILD_ACCOUNTS_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientChildAccountsContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientChildAccounts`. */
export type ClientChildAccountsScopeMatrix =
  typeof CLIENT_CHILD_ACCOUNTS_SCOPE_MATRIX;

/** Context types for the per-relation MANAGER — which relation is addressed. */
export const ClientRelationContextTypes = {
  /** Acting on one existing parent/child relation by id. */
  RELATION: "relation"
} as const;

export type ClientRelationContextTypes =
  (typeof ClientRelationContextTypes)[keyof typeof ClientRelationContextTypes];

/** Scope matrix for `useClientRelation`. Separate from the collection's. */
export const CLIENT_RELATION_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientRelationContextTypes.RELATION,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientRelation`. */
export type ClientRelationScopeMatrix = typeof CLIENT_RELATION_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the child-account list can be sorted by. */
export const ClientChildAccountsSortableProperties = {
  DEFAULT: "created_at",
  DATE_CREATED: "created_at"
} as const;

export type ClientChildAccountsSortableProperties =
  (typeof ClientChildAccountsSortableProperties)[keyof typeof ClientChildAccountsSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The collection's named filters — an absent value clears that key. */
export type ClientChildAccountsFilters = {
  /** Free-text narrowing over the child's name and email. */
  query: (value?: string) => void;
  /** Narrows to the relations a parent may sign in as — legacy's `LoginAsChild`. */
  allowImpersonation: (value?: IChildAccount["allow_impersonation"]) => void;
  /**
   * Narrows to the relations that take the parent's cards — legacy's
   * `InheritPaymentDetails` (`data/filters/childAccounts.ts:18-24`).
   */
  inheritPaymentDetails: (
    value?: IChildAccount["inherit_payment_details"]
  ) => void;
  /** Narrows by the day the relation was made — legacy's `CreatedAtFilter`. */
  dateCreated: (value?: IChildAccount["created_at"]) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientChildAccounts (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of child accounts and its lookups. */
export type UseClientChildAccountsContext = {
  /** The reactive current page of this client's children (always an array). */
  data: ComputedRef<IChildAccount[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one relation on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IChildAccount>>["findOne"];
  /** Finds one relation on the page by id. */
  getOne: ReturnType<typeof useCollection<IChildAccount>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientChildAccountsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this client is not a parent. */
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
export type UseClientChildAccountsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientChildAccountsFilters;
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
    property?: ClientChildAccountsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientChildAccountsInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useClientRelation (manager)
// -----------------------------------------------------------------------------

/** Manager context — the addressed parent/child relation. */
export type UseClientRelationContext = {
  /** The relation this scope resolved. */
  data: ComputedRef<IChildAccount | undefined>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/** Manager meta — one computed per state flag. */
export type UseClientRelationMeta = {
  /** True if the read or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this scope resolved no relation. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while a mutation is in flight. */
  isProcessing: ComputedRef<boolean>;
  /** True while the parent may log in as this child. */
  allowsImpersonation: ComputedRef<boolean>;
  /** True while the child bills against the parent's payment methods. */
  inheritsPaymentDetails: ComputedRef<boolean>;
  /** True while the child wears the parent's brand appearance. */
  usesParentBranding: ComputedRef<boolean>;
};

/** Manager actions — the relation's own capabilities plus lifecycle. */
export type UseClientRelationActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the relation is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the relation from the server. */
  refresh: () => Promise<void>;
  /** Breaks the parent/child relation. */
  detach: () => Promise<void>;
  /** Flips one relation switch. */
  toggle: (key: ClientRelationToggleKeys) => Promise<void>;
};

/** Manager internals (debugging) — exempt from conformance. */
export type UseClientRelationInternals = ContractInternals;
