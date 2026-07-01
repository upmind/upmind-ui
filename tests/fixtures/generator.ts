// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/generator
 * @description Headless, direct-API fixture generator (ADR 025 §A1.3). Ported
 * from the legacy `ApiFixtureGenerator`, it makes real `fetch` calls, sanitises
 * the response, and writes **v3 `ApiFixtureV3`** JSON into a unit's OWN
 * co-located `recordingsDir` — the producer half of the loader that already
 * reads/replays the same files. No central pool, no `_index.json`: the v3 loader
 * walks the dir and keys by relative path.
 *
 * Two deltas from the legacy engine:
 *   1. `.save()` emits the full v3 shape (version, request/response headers,
 *      a REAL `captured_at` refreshed on every capture, `brand_domain`,
 *      `source`, `provenance`) — never the legacy thin `{request,response}`.
 *   2. The constructor takes `{ recordingsDir, brandDomain, sanitize, source }`
 *      and writes into the unit's own dir (no flat `_index.json`).
 *
 * PII is scrubbed by the existing `sanitize()` / `redactValue()` from
 * `fixture-naming.mjs` — there is no second scrubber.
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  generateFixtureName,
  generateReadableKey,
  redactValue,
  sanitize
} from "./fixture-naming.mjs";
import type {
  ApiFixtureV3,
  FixtureProvenance,
  FixtureSource,
  HttpMethod
} from "./types";

// -----------------------------------------------------------------------------

export type ApiResponse = {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
};

export type GeneratorOptions = {
  /**
   * The unit's OWN co-located fixtures dir to write into, e.g.
   * `join(import.meta.dirname, "fixtures")`. Required — the central pool is
   * retired (ADR 025); there is no whole-pool default.
   */
  recordingsDir: string;
  /** Value written to each fixture's `brand_domain`. Defaults to the `origin` host, else the baseUrl host. */
  brandDomain?: string;
  /**
   * The brand/tenant origin the API resolves the brand from, e.g.
   * `"http://qa-automation.local:5173"`. Sent as the `Origin` request header
   * (a browser sets this automatically; a headless `fetch` does not) — without
   * it the API replies `404 "Domain not found!"`. Its hostname becomes the
   * default `brand_domain`.
   */
  origin?: string;
  /** Whether to sanitise sensitive data. Defaults to `true`. */
  sanitize?: boolean;
  /**
   * Where these captures come from: `"case"` for a module's own endpoint
   * captures (default), `"journey"` for a cross-module flow. Drives the v3
   * `source` and which `provenance` slot is filled.
   */
  source?: FixtureSource;
  /** Label written to v3 `provenance.case` / `provenance.journey`. */
  name?: string;
  /** Default headers sent on every request. */
  defaultHeaders?: Record<string, string>;
};

type CapturedFixture = { fixture: ApiFixtureV3; filename: string };

// -----------------------------------------------------------------------------

export class Generator {
  // --- state

  private baseUrl: string;
  private recordingsDir: string;
  private brandDomain: string;
  private shouldSanitize: boolean;
  private source: FixtureSource;
  private name: string;
  private defaultHeaders: Record<string, string>;
  private capturedFixtures = new Map<string, CapturedFixture>();

  constructor(baseUrl: string, options: GeneratorOptions) {
    if (!options?.recordingsDir) {
      throw new Error(
        "[fixtures] Generator needs { recordingsDir } — the unit's own " +
          "co-located fixtures/ dir. The central pool is retired (ADR 025)."
      );
    }

    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.recordingsDir = options.recordingsDir;
    this.shouldSanitize = options.sanitize ?? true;
    this.source = options.source ?? "case";
    this.name = options.name ?? this.source;
    this.brandDomain =
      options.brandDomain ??
      this.hostnameFromUrl(options.origin) ??
      this.hostFromBaseUrl() ??
      "example.com";
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.origin ? { Origin: options.origin } : {}),
      ...options.defaultHeaders
    };
  }

  // --- methods

  /** Make an API call and capture the response as a v3 fixture (in memory). */
  async capture(
    method: HttpMethod,
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    const response = await fetch(this.buildUrl(path), {
      method,
      headers: requestHeaders,
      body: this.encodeBody(body, requestHeaders)
    });

    // Raw body drives naming (needs the unsanitised `actor_type`); the
    // SANITISED body is what we store. This order is load-bearing.
    const responseBody = await response.json().catch(() => null);
    const sanitizedBody = this.shouldSanitize
      ? sanitize(responseBody)
      : responseBody;
    const sanitizedRequestBody = this.shouldSanitize
      ? sanitize(body ?? null)
      : (body ?? null);

    // Scrub PII from the path so no real ids land in the stored path/filename.
    const safePath = redactValue(path);

    const fixture: ApiFixtureV3 = {
      version: 3,
      request: {
        method,
        path: safePath,
        headers: this.shouldSanitize
          ? (sanitize(requestHeaders) as Record<string, string>)
          : requestHeaders,
        body: sanitizedRequestBody
      },
      response: {
        status: response.status,
        headers: this.headersToObject(response.headers),
        body: sanitizedBody
      },
      // REAL timestamp, refreshed on every capture — provenance of when the
      // BE last returned this response. Never normalised (FE-2937 decision 3).
      captured_at: new Date().toISOString(),
      brand_domain: this.brandDomain,
      source: this.source,
      provenance: this.buildProvenance()
    };

    const filename = `${generateFixtureName(method, safePath, responseBody)}.json`;
    const actorType =
      responseBody && typeof responseBody === "object"
        ? (responseBody as { actor_type?: string }).actor_type
        : undefined;
    const readableKey = generateReadableKey(method, safePath, actorType);

    this.capturedFixtures.set(readableKey, { fixture, filename });

    return { status: response.status, body: sanitizedBody };
  }

  /** GET + capture. */
  async get(
    path: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    return this.capture("GET", path, undefined, headers);
  }

  /** POST + capture. */
  async post(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    return this.capture("POST", path, body, headers);
  }

  /** PUT + capture. */
  async put(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    return this.capture("PUT", path, body, headers);
  }

  /** PATCH + capture. */
  async patch(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    return this.capture("PATCH", path, body, headers);
  }

  /** DELETE + capture. */
  async delete(
    path: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    return this.capture("DELETE", path, undefined, headers);
  }

  /** Set the bearer token sent on every subsequent request. */
  setBearerToken(token: string): void {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  /** Clear the bearer token. */
  clearBearerToken(): void {
    delete this.defaultHeaders.Authorization;
  }

  /**
   * Write every captured fixture into the unit's own `recordingsDir` as v3 JSON.
   * Creates the dir if missing. No `_index.json` — the loader walks the dir and
   * keys by relative path.
   */
  save(): void {
    if (!existsSync(this.recordingsDir)) {
      mkdirSync(this.recordingsDir, { recursive: true });
    }

    for (const { fixture, filename } of this.capturedFixtures.values()) {
      const fixturePath = join(this.recordingsDir, filename);
      writeFileSync(
        fixturePath,
        `${JSON.stringify(fixture, null, 2)}\n`,
        "utf-8"
      );
    }
  }

  /** Empty the in-memory capture buffer. */
  clear(): void {
    this.capturedFixtures.clear();
  }

  /** The captured fixtures keyed by readable key (for tests/inspection). */
  getCapturedFixtures(): Map<string, CapturedFixture> {
    return this.capturedFixtures;
  }

  // --- private

  private buildProvenance(): FixtureProvenance {
    return this.source === "journey"
      ? { journey: this.name }
      : { case: this.name };
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  private hostFromBaseUrl(): string | undefined {
    try {
      return new URL(this.baseUrl).host || undefined;
    } catch {
      return undefined;
    }
  }

  private hostnameFromUrl(url?: string): string | undefined {
    if (!url) return undefined;
    try {
      return new URL(url).hostname || undefined;
    } catch {
      return undefined;
    }
  }

  // Encodes the request body to match the Content-Type. OAuth token endpoints
  // (and similar) require `application/x-www-form-urlencoded`; everything else
  // is JSON.
  private encodeBody(
    body: unknown,
    headers: Record<string, string>
  ): string | undefined {
    if (body == null) return undefined;
    const contentType =
      headers["Content-Type"] ?? headers["content-type"] ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      return new URLSearchParams(body as Record<string, string>).toString();
    }
    return JSON.stringify(body);
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return this.shouldSanitize
      ? (sanitize(result) as Record<string, string>)
      : result;
  }
}

/** Convenience factory mirroring the legacy `createApiFixtureGenerator`. */
export function createGenerator(
  baseUrl: string,
  options: GeneratorOptions
): Generator {
  return new Generator(baseUrl, options);
}
