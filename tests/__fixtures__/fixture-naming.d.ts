/**
 * Type declarations for fixture-naming.mjs
 */

/** Query params excluded from the fixture filename hash. */
export declare const EXCLUDE_PARAMS: string[];

/** Sensitive field patterns to sanitize in fixture data. */
export declare const SENSITIVE_PATTERNS: RegExp[];

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
 * Sanitize sensitive fields in fixture data.
 *
 * @param obj - Data to sanitize
 * @param depth - Current recursion depth
 * @returns Sanitized data
 */
export declare function sanitize(obj: unknown, depth?: number): unknown;
