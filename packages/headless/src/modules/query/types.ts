// --- types
import type { EnsureQueryDataOptions } from "@tanstack/query-core";

// -----------------------------------------------------------------------------

export interface RequestError {
  data?: unknown;
  status?: number;
  message?: string;
}

export interface PaginatedError {
  id: null;
  code: number;
  data: null;
  type: number;
  message: string;
}

export interface RequestParams {
  url: URL;
  data?: unknown;
  init?: RequestInit;
  withAccessToken?: boolean | string | null;
}

export interface QueryParams<T extends unknown>
  extends RequestParams,
    Omit<EnsureQueryDataOptions<T>, "queryFn"> {
  allowStale?: boolean;
}

export interface PaginatedParams {
  sort?: [direction: ApiSortDirection, property: string];
  filters?: IApiFilter[];
  pagination?: IAPIPagination;
}

// Response Types

export interface QueryResponse<T extends unknown = unknown> {
  data: T;
  total: number | null;
  status: ResponseStatus; // TODO: check if "ok" and "error" are the only possible values
  errors: RequestError | null;
  messages: string | string[];
}

export interface PaginatedData<T extends unknown> {
  // response related
  data: T | null | undefined;
  // item related
  itemTo: number;
  itemFrom: number;
  itemTotal: number;
  // page related
  pageSize: number;
  pageIndex: number;
  pageTotal: number;
  // pagination related
  hasNextPage: boolean;
  hasPrevPage: boolean;
  // function related
  nextPage: () => Promise<PaginatedData<T>>;
  prevPage: () => Promise<PaginatedData<T>>;
}

// ---  ENUMS

export enum ResponseStatus {
  OK = "ok",
  ERROR = "error",
}

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
