// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-custom-pages
 * @description Four-layer contract for the `client-custom-pages` collection
 * headless does not have yet (plan §3): the brand-authored pages the client
 * area serves, including the ones injected into the primary nav. Rows are the
 * wire `ICustomPage`; the page BODY is a template slot (plan R12), not a
 * member here.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area —
 * `views/client/custom/index.vue` and `navigationRibbon.vue`'s `show_on_menu`
 * injection; gap-doc row X15.
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
import type { ICustomPage } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/** Context types for the collection — whose brand's pages are read. */
export const ClientCustomPagesContextTypes = {
  /** Reading the brand's custom pages as a signed-in client. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientCustomPagesContextTypes =
  (typeof ClientCustomPagesContextTypes)[keyof typeof ClientCustomPagesContextTypes];

/**
 * Scope matrix for `useClientCustomPages`. `client` is the only actor that
 * resolves; the logged-out surface is out of scope (plan §6).
 */
export const CLIENT_CUSTOM_PAGES_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientCustomPagesContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientCustomPages`. */
export type ClientCustomPagesScopeMatrix =
  typeof CLIENT_CUSTOM_PAGES_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the custom-page list can be sorted by. */
export const ClientCustomPagesSortableProperties = {
  DEFAULT: "created_at",
  NAME: "name"
} as const;

export type ClientCustomPagesSortableProperties =
  (typeof ClientCustomPagesSortableProperties)[keyof typeof ClientCustomPagesSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The collection's named filters — an absent value clears that key. */
export type ClientCustomPagesFilters = {
  /** Narrows to the pages the nav injects. */
  showOnMenu: (value?: ICustomPage["show_on_menu"]) => void;
  /** Narrows to one page by its route slug. */
  slug: (value?: ICustomPage["slug"]) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientCustomPages (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of custom pages and its lookups. */
export type UseClientCustomPagesContext = {
  /** The reactive current page of the brand's custom pages. */
  data: ComputedRef<ICustomPage[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one page on the page by a partial mapping — the slug lookup. */
  findOne: ReturnType<typeof useCollection<ICustomPage>>["findOne"];
  /** Finds one page on the page by id. */
  getOne: ReturnType<typeof useCollection<ICustomPage>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientCustomPagesMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if the brand publishes no custom pages. */
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

/** Collection actions — list controls and lifecycle; pages are read-only. */
export type UseClientCustomPagesActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientCustomPagesFilters;
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
    property?: ClientCustomPagesSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientCustomPagesInternals = ContractInternals;
