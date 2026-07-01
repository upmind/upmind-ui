/**
 * @fileoverview Simple API-Based Fixture Generator
 *
 * ## Job To Be Done
 * Generate fixtures by making direct API calls (like curl) instead of browser automation.
 * This is simpler, faster, and more reliable for API-only scenarios.
 *
 * ## When to Use This vs Playwright
 *
 * **Use API Generator (this file):**
 * - Pure API testing (no UI interaction needed)
 * - Simple request/response capture
 * - Faster fixture generation
 * - Easier to debug
 *
 * **Use Playwright Generator:**
 * - Complex UI flows (click, fill forms, etc.)
 * - Testing UI state alongside API calls
 * - CSRF token handling from UI
 * - Cookie/session management from browser
 *
 * ## Usage
 * ```typescript
 * import { test } from 'vitest';
 * import { ApiFixtureGenerator } from './api-fixture-generator';
 *
 * test('generate auth fixtures', async () => {
 *   const generator = new ApiFixtureGenerator('http://localhost:3000');
 *
 *   // Login and capture response
 *   await generator.capture('POST', '/api/oauth/access_token', {
 *     username: 'client@example.com',
 *     password: 'password123',
 *   });
 *
 *   // Save all fixtures
 *   generator.save();
 * });
 * ```
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import {
  generateFixtureName,
  generateReadableKey,
  redactValue,
  sanitize
} from "./fixture-naming.mjs";

export type ApiRequest = {
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
};

export type ApiResponse = {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
};

export type Fixture = {
  version: 3;
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
  captured_at: string;
  brand_domain: string;
  source: "case";
  provenance: { case?: string };
};

export type FixtureIndexEntry = {
  file: string;
  method: string;
  path: string;
  status: number;
  source: "case";
  provenance: { case?: string };
};

export type FixtureIndex = Record<string, FixtureIndexEntry>;

export type ApiFixtureGeneratorOptions = {
  /** Directory for saving fixture files. Defaults to recordings/cases */
  fixturesDir?: string;
  /** Whether to sanitize sensitive data. Defaults to true */
  sanitize?: boolean;
  /** Default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
  /** Case label written to v3 provenance. Defaults to "case" */
  caseName?: string;
};

// --- constants

const RECORDINGS_ROOT = join(process.cwd(), "tests", "fixtures", "recordings");

const DEFAULT_FIXTURES_DIR = join(RECORDINGS_ROOT, "cases");

// --- ApiFixtureGenerator class

export class ApiFixtureGenerator {
  private baseUrl: string;
  private fixturesDir: string;
  private shouldSanitize: boolean;
  private defaultHeaders: Record<string, string>;
  private caseName: string;
  private capturedFixtures: Map<
    string,
    { fixture: Fixture; filename: string }
  > = new Map();

  constructor(baseUrl: string, options: ApiFixtureGeneratorOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.fixturesDir = options.fixturesDir || DEFAULT_FIXTURES_DIR;
    this.shouldSanitize = options.sanitize ?? true;
    this.caseName = options.caseName || "case";
    this.defaultHeaders = options.defaultHeaders || {
      "Content-Type": "application/json",
      Accept: "application/json"
    };
  }

  /**
   * Make an API call and capture the response as a fixture
   */
  async capture(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    const url = this.buildUrl(path);
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    console.log(`[ApiFixtureGenerator] ${method} ${path}`);

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    const responseBody = await response.json().catch(() => null);

    const sanitizedBody = this.shouldSanitize
      ? sanitize(responseBody)
      : responseBody;
    const sanitizedRequestBody = this.shouldSanitize
      ? sanitize(body ?? null)
      : (body ?? null);

    const apiResponse: ApiResponse = {
      status: response.status,
      body: sanitizedBody
    };

    // Scrub PII from the path so no real ids land in the stored path/filename.
    const safePath = redactValue(path);

    const fixture: Fixture = {
      version: 3,
      request: {
        method,
        path: safePath,
        headers: requestHeaders,
        body: sanitizedRequestBody
      },
      response: {
        status: response.status,
        headers: {},
        body: sanitizedBody
      },
      captured_at: new Date().toISOString(),
      brand_domain: new URL(this.baseUrl).host || "example.com",
      source: "case",
      provenance: { case: this.caseName }
    };

    // Generate filename using shared utility (pass response body for actor_type detection)
    const name = generateFixtureName(method, safePath, responseBody);
    const filename = `${name}.json`;

    // Generate readable key using shared utility
    const actorType = responseBody?.actor_type;
    const readableKey = generateReadableKey(method, safePath, actorType);

    // Store captured fixture
    this.capturedFixtures.set(readableKey, { fixture, filename });

    console.log(`[ApiFixtureGenerator] Captured: ${readableKey} → ${filename}`);

    return apiResponse;
  }

  /**
   * Make a GET request and capture
   */
  async get(
    path: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    return this.capture("GET", path, undefined, headers);
  }

  /**
   * Make a POST request and capture
   */
  async post(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    return this.capture("POST", path, body, headers);
  }

  /**
   * Make a PUT request and capture
   */
  async put(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    return this.capture("PUT", path, body, headers);
  }

  /**
   * Make a PATCH request and capture
   */
  async patch(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    return this.capture("PATCH", path, body, headers);
  }

  /**
   * Make a DELETE request and capture
   */
  async delete(
    path: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    return this.capture("DELETE", path, undefined, headers);
  }

  /**
   * Set bearer token for authenticated requests
   */
  setBearerToken(token: string): void {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  /**
   * Clear bearer token
   */
  clearBearerToken(): void {
    delete this.defaultHeaders.Authorization;
  }

  /**
   * Save all captured fixtures to disk
   */
  save(): void {
    if (!existsSync(this.fixturesDir)) {
      mkdirSync(this.fixturesDir, { recursive: true });
    }

    for (const [, { fixture, filename }] of this.capturedFixtures) {
      const fixturePath = join(this.fixturesDir, filename);
      writeFileSync(fixturePath, JSON.stringify(fixture, null, 2), "utf-8");
      console.log(`[ApiFixtureGenerator] Wrote: ${fixturePath}`);
    }

    console.log(
      `[ApiFixtureGenerator] Total fixtures: ${this.capturedFixtures.size}`
    );
  }

  /**
   * Clear all captured fixtures
   */
  clear(): void {
    this.capturedFixtures.clear();
  }

  /**
   * Get all captured fixtures
   */
  getCapturedFixtures(): Map<string, { fixture: Fixture; filename: string }> {
    return this.capturedFixtures;
  }

  // --- Private methods

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }
}

/**
 * Helper function to create an API fixture generator
 */
export function createApiFixtureGenerator(
  baseUrl: string,
  options?: ApiFixtureGeneratorOptions
): ApiFixtureGenerator {
  return new ApiFixtureGenerator(baseUrl, options);
}
