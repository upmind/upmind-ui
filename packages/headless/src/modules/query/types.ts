// --- types
import type { EnsureQueryDataOptions } from "@tanstack/query-core";

// -----------------------------------------------------------------------------
// Request Types

export interface RequestError {
  status?: number;
  message?: string;
  data?: unknown;
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
    Omit<EnsureQueryDataOptions<T>, "queryFn"> {}

export interface PaginatedParams {
  sort?: [direction: ApiSortDirection, property: string];
  filters?: IApiFilter[];
  pagination?: IAPIPagination;
}

export interface PaginatedResponse<T extends unknown> {
  data: T;
  total: number;
  status: "ok" | "error"; // TODO: check if this is correct
  errors: PaginatedError;
  messages: string | string[];
}

export interface PaginatedData<T extends unknown> {
  // response related
  data: T | undefined;
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

export enum ApiSortDirection {
  ASC = "",
  DESC = "-",
}

// ---  API Interfaces

export interface IApiFilter {
  (url: URL): URL;
}

export interface IAPIPagination {
  limit?: number;
  offset?: number;
}
