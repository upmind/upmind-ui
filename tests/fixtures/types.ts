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
