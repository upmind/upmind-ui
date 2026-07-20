/**
 * Type declarations for fixture-naming.mjs
 */

/** Query params excluded from the fixture filename hash. */
export declare const EXCLUDE_PARAMS: string[];

/** Sensitive field patterns to sanitize in fixture data. */
export declare const SENSITIVE_PATTERNS: RegExp[];

/** Value-level PII pattern descriptor. */
export type PiiValuePattern = {
  type: string;
  pattern: RegExp;
  replace: (n: number) => string;
};

/** Value-level PII patterns redacted regardless of key. */
export declare const PII_VALUE_PATTERNS: PiiValuePattern[];

/** A path/query token that is a (real or masked) id — varies per run. */
export declare function isId(token: string): boolean;

/**
 * The canonical identity of a request: method, id-templated path, and the
 * response-selecting query params (id-values masked to `null` = presence-only).
 * Filename, readable key, and the MSW matcher all derive from this.
 */
export declare function fixtureIdentity(
  method: string,
  path: string
): { method: string; path: string; params: Array<[string, string | null]> };

/**
 * Generate a stable fixture filename from method, path, and optional response body.
 * For token endpoints, appends actor_type from the response body.
 *
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - Request path with query string
 * @param responseBody - Parsed response body (used for actor_type on token endpoints)
 * @returns Fixture name without .json extension
 */
export declare function generateFixtureName(
  method: string,
  path: string,
  responseBody?: Record<string, unknown>
): string;

/**
 * Generate a human-readable index key for the fixture index.
 *
 * @param method - HTTP method
 * @param path - Request path with query string
 * @param actorType - Actor type from response body (for token endpoints)
 * @returns Readable key for fixture index
 */
export declare function generateReadableKey(
  method: string,
  path: string,
  actorType?: string
): string;

/**
 * Redact PII tokens inside a string at the value level, deterministically.
 *
 * @param value - String to scrub
 * @returns String with any UUID/email/E.164/JWT tokens replaced
 */
export declare function redactValue(value: string): string;

/**
 * Sanitize sensitive data in a fixture (key-based + value-based PII redaction).
 *
 * @param obj - Data to sanitize
 * @param depth - Current recursion depth
 * @returns Sanitized data
 */
export declare function sanitize(obj: unknown, depth?: number): unknown;
