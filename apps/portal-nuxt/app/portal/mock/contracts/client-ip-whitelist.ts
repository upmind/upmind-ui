// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-ip-whitelist
 * @description Four-layer contract for the `client-ip-whitelist` collection
 * headless does not have yet (plan §3): the addresses a client restricts
 * access to, read, added and removed. Rows are the wire `IIpAddress`; the
 * add form's fields are `client-ip-whitelist.schemas.ts`.
 *
 * @decision Plan §3 recorded "portal-local" here; searched `packages/types` at
 * build and `IIpAddress` (`models/ipWhitelists.ts`) is the model, exported
 * from the barrel — rows are typed against it.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — Security →
 * restrict access by IP (whitelist tags, remove); gap-doc rows "4. Account →
 * Security".
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
import type { IIpAddress } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/** Context types for the collection — whose whitelist is read. */
export const ClientIpWhitelistContextTypes = {
  /** Reading a client's own IP whitelist. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientIpWhitelistContextTypes =
  (typeof ClientIpWhitelistContextTypes)[keyof typeof ClientIpWhitelistContextTypes];

/**
 * Scope matrix for `useClientIpWhitelist`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_IP_WHITELIST_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientIpWhitelistContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientIpWhitelist`. */
export type ClientIpWhitelistScopeMatrix =
  typeof CLIENT_IP_WHITELIST_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the whitelist can be sorted by. */
export const ClientIpWhitelistSortableProperties = {
  DEFAULT: "created_at",
  DATE_CREATED: "created_at",
  NAME: "name"
} as const;

export type ClientIpWhitelistSortableProperties =
  (typeof ClientIpWhitelistSortableProperties)[keyof typeof ClientIpWhitelistSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The collection's named filters — an absent value clears that key. */
export type ClientIpWhitelistFilters = {
  /** Free-text narrowing over address and description. */
  query: (value?: string) => void;
};

// -----------------------------------------------------------------------------
// MODEL
// -----------------------------------------------------------------------------

/** What the add form writes — the wire's two authored fields, in model spelling. */
export type IpWhitelistModel = {
  /** The address sign-in is allowed from, IPv4 or IPv6. */
  ipAddress: IIpAddress["ip_address"];
  /** The name the client knows it by; the wire's `name`. */
  description?: IIpAddress["name"];
};

// -----------------------------------------------------------------------------
// LAYERS — useClientIpWhitelist (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of whitelisted addresses. */
export type UseClientIpWhitelistContext = {
  /** The reactive current page of this scope's addresses (always an array). */
  data: ComputedRef<IIpAddress[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one address on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IIpAddress>>["findOne"];
  /** Finds one address on the page by id. */
  getOne: ReturnType<typeof useCollection<IIpAddress>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientIpWhitelistMeta = {
  /** True if the list query or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this client restricts access to nothing. */
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

/** Collection actions — list controls, the add form's write, removal, and lifecycle. */
export type UseClientIpWhitelistActions = {
  /** Adds one address to the whitelist, resolving the created row. */
  create: (model: IpWhitelistModel) => Promise<IIpAddress | undefined>;
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientIpWhitelistFilters;
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
    property?: ClientIpWhitelistSortableProperties,
    direction?: RequestSortDirection
  ) => void;
  /** Removes one address from the whitelist. */
  remove: (id: IIpAddress["id"]) => Promise<void>;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientIpWhitelistInternals = ContractInternals;
