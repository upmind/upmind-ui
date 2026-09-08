// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-contract-products
 * @description Four-layer contract for the `client-contract-products`
 * collection headless does not have yet (plan §3) — the `product*` modules are
 * catalogue-side. Rows are the wire `IContractProduct`; its per-product
 * manager lives in `./client-contract-product`.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the products
 * listing (`cProdRowItem.vue`, `cProdRowWithFuncs.vue`) and its filter set
 * (`src/data/filters/contractProducts.ts`); gap-doc rows "2. Products →
 * Listing", X1.
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
  ContractStatusCodes,
  IContractProduct,
  IProductCategory
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/** Context types for the product COLLECTION — whose products are read. */
export const ClientContractProductsContextTypes = {
  /** Reading a client's own contract products. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientContractProductsContextTypes =
  (typeof ClientContractProductsContextTypes)[keyof typeof ClientContractProductsContextTypes];

/**
 * Scope matrix for `useClientContractProducts`. `client` is the only actor
 * that resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_CONTRACT_PRODUCTS_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientContractProductsContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientContractProducts`. */
export type ClientContractProductsScopeMatrix =
  typeof CLIENT_CONTRACT_PRODUCTS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the product list can be sorted by (list + Cancelled tab). */
export const ClientContractProductsSortableProperties = {
  DEFAULT: "created_at",
  DATE_CANCELLED: "cancelled_date",
  DATE_PURCHASED: "created_at",
  NEXT_DUE_DATE: "next_due_date",
  STATUS: "status_id"
} as const;

export type ClientContractProductsSortableProperties =
  (typeof ClientContractProductsSortableProperties)[keyof typeof ClientContractProductsSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The collection's named filters — one per legacy filter control. */
export type ClientContractProductsFilters = {
  /** Free-text narrowing — the listing's quick search. */
  query: (value?: string) => void;
  /** Narrows by purchase date. */
  datePurchased: (value?: IContractProduct["created_at"]) => void;
  /** Narrows by the next invoice date. */
  nextDueDate: (value?: IContractProduct["next_due_date"]) => void;
  /** Narrows by recurring price. */
  price: (value?: IContractProduct["selling_price"]) => void;
  /** Narrows by product name. */
  name: (value?: IContractProduct["name"]) => void;
  /** Narrows to one catalogue category — the group slugs ride this. */
  category: (value?: IProductCategory["id"]) => void;
  /** Narrows to one lifecycle status — the status tabs ride this. */
  status: (value?: ContractStatusCodes) => void;
  /** Narrows to the products wearing one of the brand's service tags. */
  tag: (value?: string) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientContractProducts (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of products and its lookups. */
export type UseClientContractProductsContext = {
  /** The reactive current page of this scope's products (always an array). */
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
export type UseClientContractProductsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this scope has no products. */
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
export type UseClientContractProductsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientContractProductsFilters;
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
    property?: ClientContractProductsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientContractProductsInternals = ContractInternals;
