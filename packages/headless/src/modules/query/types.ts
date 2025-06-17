// --- utils
import { responseCodes } from "../../utils";

// --- types
import type {
  DefaultError,
  QueryObserverOptions,
  MutationObserverOptions,
  QueryKey,
  InfiniteData,
} from "@tanstack/vue-query";

// -----------------------------------------------------------------------------

export interface QueryResponseError {
  id: null;
  code: string | responseCodes | number;
  type: string | responseCodes | number;
  message: string;
  data: any | null;
  status: responseCodes | number;
}

/**
 * Represents the structure of a single page returned from an infinite query's queryFn.
 * @template TData The type of the data array for the page.
 */
export type InfiniteQueryPage<TData> = {
  pageData: TData;
  nextOffset: number | undefined;
};

/**
 * The raw data structure provided by TanStack's `useInfiniteQuery`
 * to the `select` function before transformation.
 *
 * @template TPageData The type of the data within each page (e.g., IProduct[]).
 */
export type RawInfiniteQueryData<TPageData> = InfiniteData<
  InfiniteQueryPage<TPageData>
>;

export interface QueryResponse<TData = unknown> {
  status: number;
  data: TData | null;
  total: number | null;
  error: QueryResponseError | null;
  messages: string[] | null;
}

export type QueryProps = {
  sort?: [direction: RequestSortDirection, property: string];
  filters?: RequestFilters;
  pagination?: RequestPagination;
};

export type RequestParams = QueryProps & {
  guard?: () => Promise<boolean>;
  url: URL;
  data?: unknown;
  init?: RequestInit;
  withAccessToken?: boolean | string | null;
};

export type QueryParams<
  TQueryFnData = unknown,
  TData = TQueryFnData,
> = RequestParams &
  Omit<
    QueryObserverOptions<TQueryFnData, DefaultError, TData>,
    "queryFn" | "initialData"
  >;

export type MutationParams<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = RequestParams &
  Omit<
    MutationObserverOptions<TData, TError, TVariables, TContext>,
    "mutationFn"
  >;

// ---  ENUMS

export enum RequestSortDirection {
  ASC = "",
  DESC = "-",
}

export interface RequestFilters extends Record<string, unknown> {}

export interface RequestPagination {
  limit?: number;
  offset?: number;
}
