import type { responseCodes } from "../../utils";
import type {
  DefaultError,
  MutationObserverOptions,
  QueryObserverOptions
} from "@tanstack/vue-query";
import type { MaybeRef } from "vue";

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
