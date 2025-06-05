// --- utils
import { responseCodes } from "src/utils";

// --- types
import type {
  DefaultError,
  QueryObserverOptions,
  MutationObserverOptions,
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
export interface QueryResponse<TData = unknown> {
  status: number;
  data: TData | null;
  total: number | null;
  error: QueryResponseError | null;
  messages: string[] | null;
}

export interface RequestParams {
  url: URL;
  data?: unknown;
  init?: RequestInit;
  withAccessToken?: boolean | string | null;
}

export type QueryParams<
  TQueryFnData = unknown,
  TData = TQueryFnData,
> = RequestParams &
  Omit<
    QueryObserverOptions<TQueryFnData, DefaultError, TData>,
    "queryFn" | "initialData" | "placeholderData"
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

export interface PaginatedParams {
  sort?: [direction: ApiSortDirection, property: string];
  filters?: IApiFilter[];
  pagination?: IAPIPagination;
}

// QueryResponse Types

// export interface PaginatedData<T extends unknown> {
//   // response related
//   data: T | null | undefined;
//   // pagination related
//   pagination?: {
//     total: number;
//     pages: number;
//     limit: number;
//     offset: number;
//     current: number;
//   };
//   // meta related
//   hasNextPage: boolean;
//   hasPrevPage: boolean;
//   // function related
//   nextPage: () => Promise<PaginatedData<T>>;
//   prevPage: () => Promise<PaginatedData<T>>;
// }

// ---  ENUMS

export enum ApiSortDirection {
  ASC = "",
  DESC = "-",
}

export interface IApiFilter {
  (url: URL): URL;
}

export interface IAPIPagination {
  limit?: number;
  offset?: number;
}
