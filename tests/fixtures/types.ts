// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/types
 * @description Versioned schema for recorded API fixtures (v1 → v3) plus the
 * normalized shape consumed by the loader and MSW handlers. v3 is the canonical
 * recorded form; v1/v2 are tolerated for legacy pool entries.
 */

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type FixtureSource = "journey" | "case";

/**
 * HTTP error statuses a forced fixture may carry (see `Generator` forceStatus).
 * Copied from headless `responseCodes` (packages/headless/src/utils/useError.ts,
 * node `responseCodes` in graphify-out/graph.json community 2) — the error
 * members only. Copied, not imported: this low-level test-fixtures package must
 * not depend on headless.
 */
export enum ForcedErrorCode {
  Bad_Request = 400,
  Unauthorized = 401,
  Forbidden = 403,
  Not_Found = 404,
  Timeout = 408,
  Conflict = 409,
  Unprocessable_Entity = 422,
  Too_Many_Requests = 429,
  Internal_Server_Error = 500,
  Bad_Gateway = 502,
  Service_Unavailable = 503,
  Gateway_Timeout = 504
}

/**
 * The API's structured error object. Copied from headless `QueryResponseError`
 * (packages/headless/src/modules/query/query.types.ts, node `QueryResponseError`
 * in graphify-out/graph.json) — copied, not imported: test-fixtures must not
 * depend on headless.
 */
export type QueryResponseError = {
  id: null;
  code: ForcedErrorCode | string | number;
  type: ForcedErrorCode | string | number;
  message: string;
  data: unknown | null;
};

/**
 * The API wire error envelope a forced fixture stores — the `QueryResponse`
 * shape (headless query.types.ts, graphify-out/graph.json) narrowed to the
 * error case. Copied, not imported, for the same reason as `QueryResponseError`.
 */
export type ForcedErrorResponse = {
  status: "error";
  data: null;
  related: null;
  total: null;
  error: QueryResponseError;
  messages: null;
  meta: null;
};

export type FixtureProvenance = {
  journey?: string;
  case?: string;
};

export type ApiFixtureV1 = {
  request: {
    method: string;
    path: string;
  };
  response: {
    status: number;
    body: unknown;
  };
};

export type ApiFixtureV2 = {
  version?: 2;
  request: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body: unknown;
  };
  captured_at?: string;
  brand_domain?: string | null;
};

export type ApiFixtureV3 = {
  version: 3;
  request: {
    method: HttpMethod;
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body: unknown;
  };
  captured_at: string;
  brand_domain: string;
  source: FixtureSource;
  provenance: FixtureProvenance;
};

export type AnyApiFixture = ApiFixtureV1 | ApiFixtureV2 | ApiFixtureV3;

export type FixtureIndexEntry = {
  file: string;
  method: string;
  path: string;
  status?: number;
  source?: FixtureSource;
  provenance?: FixtureProvenance;
  bodyHash?: string;
};

export type FixtureIndex = Record<string, FixtureIndexEntry>;

export type NormalizedFixture = {
  method: string;
  path: string;
  status: number;
  headers: Record<string, string>;
  body: unknown;
  source?: FixtureSource;
  journey?: string;
  file: string;
};
