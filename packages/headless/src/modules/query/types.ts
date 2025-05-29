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
  transformResponse?: (response: unknown) => unknown;
  mapPaginatedData?: (response?: QueryResponse<any>) => PaginatedData<any>;
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
  status: number;
  errors: RequestError | null;
  messages: string | string[];
  pagination?: {
    limit: number;
    offset: number;
  };
}

export interface PaginatedData<T extends unknown> {
  // response related
  data: T | null | undefined;
  // pagination related
  pagination?: {
    total: number;
    pages: number;
    limit: number;
    offset: number;
    current: number;
  };
  // meta related
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
