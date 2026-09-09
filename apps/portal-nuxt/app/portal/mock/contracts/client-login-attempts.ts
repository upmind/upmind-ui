// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-login-attempts
 * @description Four-layer contract for the `client-login-attempts` collection
 * headless does not have yet (plan §3). Rows are the wire `ILoginAttempt`, so
 * nothing is minted here.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the logs area's
 * login attempts listing with its filters and sorters; gap-doc rows
 * "4. Account → Logs", X1.
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
import type { ILoginAttempt } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/** Context types for the collection — whose attempts are read. */
export const ClientLoginAttemptsContextTypes = {
  /** Reading a client's own login attempts. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientLoginAttemptsContextTypes =
  (typeof ClientLoginAttemptsContextTypes)[keyof typeof ClientLoginAttemptsContextTypes];

/**
 * Scope matrix for `useClientLoginAttempts`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_LOGIN_ATTEMPTS_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientLoginAttemptsContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientLoginAttempts`. */
export type ClientLoginAttemptsScopeMatrix =
  typeof CLIENT_LOGIN_ATTEMPTS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the login-attempt list can be sorted by. */
export const ClientLoginAttemptsSortableProperties = {
  DEFAULT: "created_at",
  DATE_CREATED: "created_at",
  SUCCESSFUL: "successful"
} as const;

export type ClientLoginAttemptsSortableProperties =
  (typeof ClientLoginAttemptsSortableProperties)[keyof typeof ClientLoginAttemptsSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The collection's named filters — an absent value clears that key. */
export type ClientLoginAttemptsFilters = {
  /** Free-text narrowing over IP address and user agent. */
  query: (value?: string) => void;
  /** Narrows to successful or failed attempts. */
  successful: (value?: ILoginAttempt["successful"]) => void;
  /** Narrows by attempt date. */
  dateCreated: (value?: ILoginAttempt["created_at"]) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientLoginAttempts (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of attempts and its lookups. */
export type UseClientLoginAttemptsContext = {
  /** The reactive current page of this scope's attempts (always an array). */
  data: ComputedRef<ILoginAttempt[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one attempt on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<ILoginAttempt>>["findOne"];
  /** Finds one attempt on the page by id. */
  getOne: ReturnType<typeof useCollection<ILoginAttempt>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientLoginAttemptsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this scope has no recorded attempts. */
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

/** Collection actions — list controls and lifecycle; the log is read-only. */
export type UseClientLoginAttemptsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientLoginAttemptsFilters;
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
    property?: ClientLoginAttemptsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientLoginAttemptsInternals = ContractInternals;
