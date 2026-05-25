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

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  generateFixtureName,
  generateReadableKey,
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
  request: {
    method: string;
    path: string;
  };
  response: {
    status: number;
    body: unknown;
  };
};

export type FixtureIndexEntry = {
  file: string;
  path: string;
  method: string;
};

export type FixtureIndex = Record<string, FixtureIndexEntry>;

export type ApiFixtureGeneratorOptions = {
  /** Base directory for saving fixtures. Defaults to tests/__fixtures__/recordings */
  fixturesDir?: string;
  /** Whether to sanitize sensitive data. Defaults to true */
  sanitize?: boolean;
  /** Default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
};

// --- constants

const DEFAULT_FIXTURES_DIR = join(
  process.cwd(),
  "tests",
  "__fixtures__",
  "recordings"
);

// --- ApiFixtureGenerator class

export class ApiFixtureGenerator {
  private baseUrl: string;
  private fixturesDir: string;
  private shouldSanitize: boolean;
  private defaultHeaders: Record<string, string>;
  private capturedFixtures: Map<
    string,
    { fixture: Fixture; filename: string }
  > = new Map();

  constructor(baseUrl: string, options: ApiFixtureGeneratorOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.fixturesDir = options.fixturesDir || DEFAULT_FIXTURES_DIR;
    this.shouldSanitize = options.sanitize ?? true;
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

    const apiResponse: ApiResponse = {
      status: response.status,
      body: this.shouldSanitize ? sanitize(responseBody) : responseBody
    };

    // Create fixture
    const fixture: Fixture = {
      request: {
        method,
        path
      },
      response: apiResponse
    };

    // Generate filename using shared utility (pass response body for actor_type detection)
    const name = generateFixtureName(method, path, responseBody);
    const filename = `${name}.json`;

    // Generate readable key using shared utility
    const actorType = responseBody?.actor_type;
    const readableKey = generateReadableKey(method, path, actorType);

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
    // Load existing index
    const indexPath = join(this.fixturesDir, "_index.json");
    let index: FixtureIndex = {};

    if (existsSync(indexPath)) {
      try {
        index = JSON.parse(readFileSync(indexPath, "utf-8"));
      } catch {
        console.warn("[ApiFixtureGenerator] Failed to load existing index");
      }
    }

    // Write each fixture and update index
    for (const [readableKey, { fixture, filename }] of this.capturedFixtures) {
      const fixturePath = join(this.fixturesDir, filename);

      // Write fixture file
      writeFileSync(fixturePath, JSON.stringify(fixture, null, 2), "utf-8");

      // Update index
      index[readableKey] = {
        file: filename,
        path: fixture.request.path,
        method: fixture.request.method
      };

      console.log(`[ApiFixtureGenerator] Wrote: ${fixturePath}`);
    }

    // Write updated index
    writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
    console.log(`[ApiFixtureGenerator] Updated index: ${indexPath}`);
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
