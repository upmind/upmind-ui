// --- utils
import { responseCodes } from "../../utils";

// --- types
import type {
  DefaultError,
  QueryObserverOptions,
  MutationObserverOptions,
  QueryKey,
} from "@tanstack/vue-query";
import { MaybeRef } from "vue";

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
  guard?: () => Promise<boolean>;
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

export interface QueryListParamsRaw {
  sort?: [direction: ApiSortDirection, property: string];
  filters?: IApiFilter[] | undefined;
  pagination?: IAPIPagination | undefined;
}

export type QueryListParams = MaybeRef<QueryListParamsRaw>;

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
