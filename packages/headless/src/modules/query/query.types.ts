/**
 * @graphify-citation `graphify query "ListQuery TanStack query return type"`
 * (2026-08-04) — no existing `ListQuery`/`MutationResult` type/enum node in
 * `graphify-out/` (the graph still reflects the pre-remedy tree). No
 * duplicate to reuse; minting is warranted. See `graphify-out/GRAPH_REPORT.md`.
 *
 * @graphify-citation `graphify query "query criteria filter operator sort
 * direction"` (2026-08-07) — no `QueryCriteria` / `RequestFilterOperator` /
 * `SortDirection` node in `graphify-out/graph.json` (2717 nodes, same
 * pre-remedy tree). `config.types.ts`'s `ScalarOperator`/`ArrayOperator` are a
 * different domain (UI-meta conditions) and cross-module import is barred, so
 * there is no duplicate to consume.
 */
import type { responseCodes, ResponseError } from "../../utils";
import type { JsonSchema } from "@jsonforms/core";
import type {
  DefaultError,
  MutationObserverOptions,
  QueryObserverOptions,
  useMutation,
  useQuery as vueUseQuery
} from "@tanstack/vue-query";
import type { ComputedRef, MaybeRef } from "vue";

// -----------------------------------------------------------------------------

/**
 * Re-exports the `ErrorObject` type from `ajv` as `ValidationErrorObject` for clarity in form validation contexts.
 *
 * @see {@link https://ajv.js.org/api.html#validation-errors Ajv Validation Error Object}
 */
export type { ErrorObject as ValidationErrorObject } from "ajv";

/**
 * Interface representing a structured error response from an API query.
 */
export interface QueryResponseError {
  /**
   * An optional unique identifier for the error, typically `null` if not specified.
   */
  id: null;
  /**
   * A code identifying the type of error (e.g. "INVALID_INPUT", `responseCodes.BadRequest`).
   */
  code: string | responseCodes | number;
  /**
   * The type of the error, often mirroring the `code`.
   */
  type: string | responseCodes | number;
  /**
   * A human-readable message describing the error.
   */
  message: string;
  /**
   * Optional additional data related to the error, e.g. validation specifics.
   */
  data: any | null;
  /**
   * The HTTP status code associated with the error (e.g. 400, 500).
   */
  status: responseCodes | number;
}

/**
 * Represents the structure of a single page returned from an infinite query's `queryFn`.
 * This type is used internally by the `useInfiniteQuery` hook.
 *
 * @template TData - The type of the data array for the page.
 */
export type InfiniteQueryPage<TData> = {
  /**
   * The actual data payload for this specific page.
   */
  pageData: TData;
  /**
   * The offset for fetching the next page, or `undefined` if there are no more pages.
   */
  nextOffset: number | undefined;
};

/**
 * Interface representing a standardised response structure from an API query.
 * It encapsulates the status, data, total count, error, and messages.
 *
 * @template TData - The type of the main data payload (defaults to `unknown`).
 */
export interface QueryResponse<TData = unknown> {
  /**
   * The HTTP status code of the response.
   */
  status: number;
  /**
   * The main data payload of the response, or `null` if an error occurred or no data.
   */
  data: TData | null;
  /**
   * The total number of items available, typically used for pagination, or `null`.
   */
  total: number | null;
  /**
   * An {@link QueryResponseError} object if an error occurred, or `null`.
   */
  error: QueryResponseError | null;
  /**
   * An array of informational or success messages, or `null`.
   */
  messages: string[] | null;
  /**
   * Optional related resources included alongside the main data, e.g. `products`.
   */
  related?: Record<string, any> | null;
  /**
   * Optional metadata included alongside the main data, e.g. `total_pages`, `tlds`.
   */
  meta?: Record<string, any> | null;
}

/**
 * Type alias defining common properties for API queries, including sorting, filtering, and pagination.
 */
export type QueryProps = {
  /**
   * Optional sorting parameters: `[direction, property]`.
   * `direction` can be {@link RequestSortDirection.ASC} or {@link RequestSortDirection.DESC}.
   */
  sort?:
    | [direction: RequestSortDirection, property: string]
    | [direction: RequestSortDirection, property: string][];
  /**
   * Optional filtering parameters, represented as a record of key-value pairs.
   */
  filters?: RequestFilters;
  /**
   * Optional pagination parameters, defining `limit` and `offset`.
   */
  pagination?: RequestPagination;
};

/**
 * Type alias defining the parameters for an API request, combining {@link QueryProps}
 * with additional request-specific options.
 */
export type RequestParams = QueryProps & {
  /**
   * An optional asynchronous guard function that must resolve to `true` before the request is made.
   */
  guard?: () => Promise<boolean>;
  /**
   * The URL for the API request.
   */
  url: URL;
  /**
   * The data payload for the request body (e.g. for POST/PUT requests).
   */
  data?: unknown;
  /**
   * Optional standard `RequestInit` options for the fetch API.
   */
  init?: RequestInit;
  /**
   * `true` to automatically include the currency ID in the request headers.
   */
  withCurrency?: boolean;

  /**
   * `true` to automatically include the basket ID in the request headers.
   */
  withBasket?: boolean;
  /**
   * `true` to automatically include the access token in the request headers,
   * or a string representing the token itself, or `null`/`false` to omit.
   */
  withAccessToken?: boolean | string | null;
  /**
   * `true` to omit the locale from the request headers.
   */
  withoutLocale?: boolean;

  /**
   * `true` to use the split count logic. and fetch the count separately.
   */
  withSplitCount?: boolean;
};

/**
 * Type alias defining parameters for TanStack Query's `useQuery` hook,
 * extending {@link RequestParams} with `QueryObserverOptions` and omitting
 * `queryFn` and `initialData`, which are handled internally.
 *
 * @template TQueryFnData - The type of data returned by the `queryFn`.
 * @template TData - The type of data after the `select` transformation.
 */
export type QueryParams<
  TQueryFnData = unknown,
  TData = TQueryFnData
> = RequestParams &
  Omit<
    QueryObserverOptions<TQueryFnData, DefaultError, TData>,
    "queryFn" | "initialData"
  >;

/**
 * Type alias for reactive query keys used to create dynamic query keys for TanStack Query.
 * This allows query keys to automatically update based on reactive sources.
 */
export type ReactiveQueryKeys = {
  /**
   * A reactive reference to the locale string.
   */
  locale?: MaybeRef<string>;
  /**
   * A reactive reference to sorting parameters.
   */
  sort?: MaybeRef<
    | undefined
    | string[]
    | [RequestSortDirection, string]
    | [RequestSortDirection, string][]
  >;
  /**
   * A reactive reference to filter parameters.
   */
  filters?: MaybeRef<undefined | RequestFilters>;
  /**
   * A reactive reference to the currency code.
   */
  currencyCode?: MaybeRef<undefined | string>;

  /**
   * A reactive reference to the basket ID.
   */
  basketId?: MaybeRef<undefined | string>;
  /**
   * A reactive reference to the pagination limit.
   */
  limit?: MaybeRef<undefined | number>;
  /**
   * A reactive reference to the pagination offset.
   */
  offset?: MaybeRef<undefined | number>;
  /**
   * A reactive reference to the page index for pagination.
   */
  pageIndex?: MaybeRef<undefined | number>;
};

/**
 * Type alias defining parameters for TanStack Query's `useMutation` hook,
 * extending {@link RequestParams} with `MutationObserverOptions` and omitting `mutationFn`,
 * which is handled internally.
 *
 * @template TData - The type of data returned by the `mutationFn`.
 * @template TError - The type of error that can occur.
 * @template TVariables - The type of variables passed to the mutation.
 * @template TContext - The type of context used by the mutation.
 */
export type MutationParams<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown
> = RequestParams &
  Omit<
    MutationObserverOptions<TData, TError, TVariables, TContext>,
    "mutationFn"
  >;

/**
 * The `list()` query's return shape (`useQuery.ts`), parameterised by the raw
 * fetch type and the (optionally `select`-mapped) data type — mirrors
 * `list`'s own generic order/defaults. Extracted from `list`'s own inline
 * return-statement cast so a scoped module can express its list-query return
 * type without deriving `ReturnType<typeof localFn>` from its own
 * already-instantiated service function (graphify-out/ citation above — no
 * prior node for this type).
 *
 * @template TQueryFnData - The raw type `list`'s `queryFn` resolves.
 * @template TData - The type after `select`, defaults to `TQueryFnData`.
 */
export type ListQuery<
  TQueryFnData = unknown,
  TData = TQueryFnData
> = ReturnType<
  typeof vueUseQuery<TQueryFnData, DefaultError, QueryResponse<TData>>
> & {
  data: ComputedRef<TData>;
  pagination: ComputedRef<PaginationInfo>;
  meta: ComputedRef<{
    hasNextPage: boolean;
    hasPrevPage: boolean;
    hasPages: boolean;
  }>;
  total: ComputedRef<number>;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
  sort: (values?: QueryParams["sort"]) => void;
  filter: (values: QueryParams["filters"]) => void;
  resetQuery: () => Promise<void>;
};

/**
 * What a collection declares about its request state — the schema/model pair
 * JSONForms already pairs everywhere else. `list({ criteria: { schema } })` is
 * the whole integration; `criteria` names the same concept going in as
 * `query.criteria` does coming out.
 *
 * @template TModel - The module's own query model (filters · sort · pagination).
 */
export type QueryCriteriaOptions<
  TModel extends Record<string, unknown> = Record<string, unknown>
> = {
  /** The collection's declared query schema — filters · sort · pagination. */
  schema: JsonSchema;
  /**
   * The starting model, so a cold boot is already correct: a list rehydrated
   * from a url's page/sort/filters fetches once, rather than fetching
   * unfiltered and then correcting itself.
   *
   * UNTRUSTED — a user can edit that url. It takes the same compact → parse →
   * validate path as any `set`, and a candidate that fails validation is
   * discarded WHOLE back to the schema's defaults (a partially-honoured stale
   * url is worse than a clean default) with ajv's verdict surfaced on `error`.
   */
  model?: Partial<TModel>;
};

/**
 * A collection's REQUEST STATE as a schema-governed model: intent → parse →
 * validate → translate. Knows nothing about fetching, urls, vue-query or scope,
 * so it can be exercised with no HTTP at all. Constructed by `list()` from
 * {@link QueryCriteriaOptions} — a module never mints one, and so cannot mint
 * one wrongly.
 *
 * @template TModel - The module's own query model (filters · sort · pagination).
 */
export type QueryCriteria<
  TModel extends Record<string, unknown> = Record<string, unknown>
> = {
  /** The parsed, defaulted, compacted model. Read-only; write through `set`. */
  model: ComputedRef<TModel>;
  /** The declaration itself, so the handle can re-publish what is filterable/sortable. */
  schema: JsonSchema;
  /** The translated wire triple. `list()` is its only consumer. */
  props: ComputedRef<QueryProps>;
  /** ajv's verdict on the parsed model, as the module's normal error shape. Never swallowed. */
  error: ComputedRef<ResponseError | undefined>;
  /** Any declared filter column carries a non-nil operator value. */
  isFiltered: ComputedRef<boolean>;
  /** MERGES the given branches into the intent; never replaces the whole model. */
  set: (next: Partial<TModel>) => void;
};

/**
 * The `mutate()` mutation's return shape (`useQuery.ts`), parameterised by
 * its resolved data type. Extracted from `mutate`'s own inline return-
 * statement cast for the same reason as {@link ListQuery}.
 *
 * @template TData - The mutation's resolved data type.
 * @template TError - The mutation's error type, defaults to {@link DefaultError}.
 * @template TVariables - The mutation's input variables type, defaults to `void`.
 * @template TContext - The mutation's context type, defaults to `unknown`.
 */
export type MutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown
> = ReturnType<
  typeof useMutation<QueryResponse<TData>, TError, TVariables, TContext>
>;

// ---  ENUMS

/**
 * Enumeration defining the direction for sorting query results.
 *
 * @enum {string}
 */
export enum RequestSortDirection {
  /**
   * Ascending order.
   */
  ASC = "",
  /**
   * Descending order.
   */
  DESC = "-"
}

/**
 * A sort direction as the MODEL spells it — what a query schema's `dir` enum
 * declares and a consumer writes. {@link RequestSortDirection} is the same fact
 * in its wire form; the criteria's translator is the one place that maps
 * between them.
 *
 * @enum {string}
 */
export enum SortDirection {
  ASC = "asc",
  DESC = "desc"
}

/**
 * One entry in a query model's `sort` branch — precedence is position. The
 * MODEL's ordered form; {@link QueryProps.sort}'s `[direction, property]`
 * tuple is its wire form.
 */
export type QuerySortEntry = {
  field: string;
  dir: SortDirection;
};

/**
 * The filter operators the API accepts, as the `filter[column|operator]` key's
 * operator half. ONE vocabulary for all three consumers: the criteria's
 * translator, a query schema's declared operator leaves, and the filter
 * renderer's dispatch.
 *
 * Grounded on the legacy app's own `ApiOperators` enum
 * (`vue-app/src/data/table.ts:4-17`) — the parity oracle, not this module's
 * current usage. Two deliberate omissions: its `DEFAULT = ""` member is the
 * suffix-LESS form (`filter[column]`), not an operator a schema can name; and
 * `any` / `none` are UI-level members of its sibling `FilterOperators` enum
 * with no `ApiOperators` counterpart, so they are not wire vocabulary.
 *
 * A schema keeps PLAIN STRING KEYS so it stays a liftable JSON literal — a
 * computed key would break that. This enum names the operator in CODE; the two
 * are kept in step by the schema being walked at runtime, where an operator no
 * column declares is unspellable.
 *
 * @enum {string}
 */
export enum RequestFilterOperator {
  EQUAL = "eq",
  NOT_EQUAL = "neq",
  LIKE = "like",
  NOT_LIKE = "nlike",
  GREATER_THAN = "gt",
  GREATER_THAN_OR_EQUAL = "gte",
  LESS_THAN = "lt",
  LESS_THAN_OR_EQUAL = "lte",
  BEFORE = "before",
  AFTER = "after",
  ALL = "all"
}

/**
 * Interface representing a collection of filter parameters for a request.
 * It's a record where keys are filter names and values are the filter criteria.
 */
export type RequestFilters = Record<string, unknown>;

/**
 * Interface representing pagination parameters for a request.
 */
export interface RequestPagination {
  /**
   * The maximum number of items to return in a single page.
   */
  limit?: number;
  /**
   * The number of items to skip from the beginning of the result set.
   */
  offset?: number;
}

/**
 * Interface representing comprehensive pagination information, typically returned
 * by an API to describe the current state of paginated results.
 */
export interface PaginationInfo {
  /**
   * The maximum number of items per page.
   */
  limit: number;
  /**
   * The total number of items available across all pages.
   */
  total: number;
  /**
   * The current page number (1-indexed).
   */
  page: number;
  /**
   * The total number of available pages.
   */
  pages: number;
  /**
   * The index of the first item on the current page (1-indexed).
   */
  from: number;
  /**
   * The index of the last item on the current page (1-indexed).
   */
  to: number;
}
