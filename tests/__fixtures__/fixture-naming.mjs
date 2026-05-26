/**
 * Shared Fixture Naming Utility
 *
 * Single source of truth for fixture file naming and index key generation.
 * Used by both the recording proxy and the API fixture generator.
 */

import { createHash } from "crypto";

// --- constants

/** Query params excluded from the fixture filename hash. */
export const EXCLUDE_PARAMS = [
  "lang",
  "currency_code",
  "order",
  "with",
  "with_count"
];

/** Sensitive field patterns to sanitize in fixture data. */
export const SENSITIVE_PATTERNS = [
  /token/i,
  /password/i,
  /secret/i,
  /key/i,
  /bearer/i,
  /cookie/i,
  /session/i,
  /credential/i,
  /authorization/i
];

// --- functions

/**
 * Generate a stable fixture filename from method, path, and optional response body.
 *
 * Format: `method-endpoint-hash[-actor_type]`
 *
 * For token endpoints (`/oauth/access_token`), appends `actor_type` from the
 * response body (e.g., `post--oauth-access_token-client`).
 *
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - Request path with query string
 * @param {object} [responseBody] - Parsed response body (used for actor_type on token endpoints)
 * @returns {string} Fixture name without .json extension
 */
export function generateFixtureName(method, path, responseBody) {
  const url = new URL(path, "http://localhost");
  const pathname = url.pathname;

  // Clean the endpoint path
  const cleanPath = pathname
    .replace(/^\/api\//, "")
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "_")
    .toLowerCase();

  // Sort params for consistent hashing, excluding common/default ones
  const params = [...url.searchParams.entries()]
    .filter(([k]) => !EXCLUDE_PARAMS.includes(k))
    .filter(([k, v]) => !(k === "limit" && v === "0"))
    .sort();
  const paramsStr = params.map(([k, v]) => `${k}=${v}`).join("&");

  // Create short hash only if there are meaningful params
  let hash = "";
  if (paramsStr) {
    hash = "-" + createHash("md5").update(paramsStr).digest("hex").slice(0, 8);
  }

  let name = `${method.toLowerCase()}-${cleanPath}${hash}`;

  // For token endpoints, append actor_type from response
  if (responseBody && typeof responseBody === "object") {
    const isTokenEndpoint = path.includes("/oauth/access_token");
    if (isTokenEndpoint && responseBody.actor_type) {
      name = `${name}-${responseBody.actor_type}`;
    }
  }

  return name;
}

/**
 * Generate a human-readable index key for the fixture index.
 *
 * Format: `METHOD endpoint [param:value, ...]`
 *
 * Examples:
 * - `GET brand/settings`
 * - `POST /oauth/access_token [actor:client]`
 * - `GET basket/products [limit:9]`
 *
 * @param {string} method - HTTP method
 * @param {string} path - Request path with query string
 * @param {string} [actorType] - Actor type from response body (for token endpoints)
 * @returns {string} Readable key for fixture index
 */
export function generateReadableKey(method, path, actorType) {
  const url = new URL(path, "http://localhost");
  const pathname = url.pathname.replace(/^\/api\//, "");

  // Extract key params that make this request unique
  const importantParams = [];
  const params = url.searchParams;

  // Include category/id filters in the key
  if (params.has("category_id"))
    importantParams.push(`category:${params.get("category_id")}`);
  if (params.has("id")) importantParams.push(`id:${params.get("id")}`);
  if (params.has("offset") && params.get("offset") !== "0")
    importantParams.push(`offset:${params.get("offset")}`);
  if (params.has("limit") && params.get("limit") !== "0")
    importantParams.push(`limit:${params.get("limit")}`);

  // For token endpoints, include actor_type
  if (actorType) {
    importantParams.push(`actor:${actorType}`);
  }

  // Create readable key like "GET brand/settings" or "POST /oauth/access_token [actor:client]"
  let readableKey = `${method} ${pathname}`;
  if (importantParams.length > 0) {
    readableKey += ` [${importantParams.join(", ")}]`;
  }

  return readableKey;
}

/**
 * Sanitize sensitive fields in fixture data.
 * Replaces string values whose keys match sensitive patterns with `mock-{key}`.
 *
 * @param {unknown} obj - Data to sanitize
 * @param {number} [depth=0] - Current recursion depth
 * @returns {unknown} Sanitized data
 */
export function sanitize(obj, depth = 0) {
  if (depth > 50) return obj;
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, depth + 1));
  }

  if (typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      if (isSensitive && typeof value === "string") {
        result[key] = `mock-${key}`;
      } else {
        result[key] = sanitize(value, depth + 1);
      }
    }
    return result;
  }

  return obj;
}
