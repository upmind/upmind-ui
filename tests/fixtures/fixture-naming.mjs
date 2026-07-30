/**
 * Shared Fixture Naming Utility
 *
 * Single source of truth for fixture file naming and index key generation.
 * Used by both the recording proxy and the API fixture generator.
 */

// --- constants

/**
 * Query params that never change WHICH response you get — locale, expansion,
 * ordering, pagination. Excluded from a fixture's identity so the name keys on
 * what actually selects the response. (If a journey ever needs page-2 fixtures,
 * pull `offset`/`limit` out of here — they become identity then.)
 */
export const EXCLUDE_PARAMS = [
  "lang",
  "currency_code",
  "order",
  "with",
  "with_count",
  "limit",
  "offset"
];

const UUID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MOCK_ID_SEGMENT = /^mock-uuid-\d+$/;

/** A path/query token that is a (real or masked) id — varies per run. */
export function isId(token) {
  return UUID_SEGMENT.test(token) || MOCK_ID_SEGMENT.test(token);
}

/**
 * The canonical identity of a request: method, id-templated path, and the query
 * params that actually select a different response — with id-VALUES masked to
 * presence-only (`null`) so a re-record's fresh ids never shift the identity.
 * Filename, readable key, and the MSW matcher all derive from THIS one
 * definition, so they cannot drift apart.
 *
 * @param {string} method - HTTP method
 * @param {string} path - request path with query string
 * @returns {{ method: string, path: string, params: Array<[string, string|null]> }}
 */
export function fixtureIdentity(method, path) {
  const url = new URL(path, "http://localhost");

  const pathname = url.pathname
    .replace(/^\/api\//, "")
    .split("/")
    .filter(Boolean)
    .map(segment => (isId(segment) ? ":id" : segment))
    .join("/");

  const params = [...url.searchParams.entries()]
    .filter(([key]) => !EXCLUDE_PARAMS.includes(key))
    .map(([key, value]) => [key, isId(value) ? null : value])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  return { method: method.toUpperCase(), path: pathname, params };
}

/** Render identity params back to a query string; masked ids show as key-only. */
function renderParams(params) {
  return params
    .map(([key, value]) => (value === null ? key : `${key}=${value}`))
    .join("&");
}

/**
 * Stable 8-hex-char hash of a string (FNV-1a). Used to keep a fixture FILENAME
 * bounded when a route's identity params render too long for the filesystem
 * (e.g. a `config brand values?keys=<40 keys>` request — ENAMETOOLONG otherwise).
 * The filename is cosmetic + a uniqueness key; MSW matching and the `[dup]` lint
 * read the request's identity from the fixture JSON, never the filename — so a
 * hashed name never changes which fixture serves. Deterministic: the same params
 * always hash the same, so a re-record overwrites in place.
 */
function hashParams(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// A fixture filename beyond this collapses its params to a hash. Chosen well
// under the 255-byte POSIX/macOS limit while keeping short names readable.
const MAX_FIXTURE_NAME = 100;

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

/**
 * Value-level PII patterns, redacted regardless of the key they live under.
 * Each match is replaced with a deterministic `mock-*` placeholder so the same
 * source value always maps to the same placeholder within a single run.
 */
export const PII_VALUE_PATTERNS = [
  {
    type: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replace: n => `mock-email-${n}@example.com`
  },
  {
    type: "jwt",
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    replace: n => `mock-token-${n}`
  },
  {
    type: "phone",
    pattern: /\+\d{7,15}\b/g,
    replace: n => `mock-phone-${n}`
  }
];

// --- state

/** Per-run deterministic maps: source value → placeholder, keyed by PII type. */
const piiMaps = new Map();
const piiCounters = new Map();

// --- functions

/**
 * Generate a stable fixture filename from the request's identity.
 *
 * Format: `method-endpoint[-param...][-actor_type]`, derived from
 * {@link fixtureIdentity} — no hash, so re-recording the same request yields
 * the same filename. For token endpoints (`/oauth/access_token`), appends
 * `actor_type` from the response body (e.g. `post-oauth-access_token-client`).
 *
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - Request path with query string
 * @param {object} [responseBody] - Parsed response body (used for actor_type on token endpoints)
 * @returns {string} Fixture name without .json extension
 */
export function generateFixtureName(method, path, responseBody) {
  const { path: endpoint, params } = fixtureIdentity(method, path);
  const paramsStr = renderParams(params);

  const clean = str =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  let name = clean(
    `${method.toLowerCase()}-${endpoint}${paramsStr ? `-${paramsStr}` : ""}`
  );

  // Long identity params (e.g. a giant `?keys=` list) would overflow the
  // filesystem name limit — collapse just the params to a stable hash, mirroring
  // the pilot journey's `…-<hash8>` fixtures. Identity/matching are unaffected.
  if (name.length > MAX_FIXTURE_NAME && paramsStr) {
    name = clean(`${method.toLowerCase()}-${endpoint}-${hashParams(paramsStr)}`);
  }

  if (responseBody && typeof responseBody === "object") {
    const isTokenEndpoint = path.includes("/oauth/access_token");
    if (isTokenEndpoint && responseBody.actor_type) {
      name = `${name}-${responseBody.actor_type}`;
    }
  }

  return name;
}

/**
 * Generate a human-readable lookup key for a fixture — the same identity the
 * filename and MSW matcher use, rendered for humans. Masked id params show as
 * key-only (presence), concrete params as `key=value`.
 *
 * Format: `METHOD endpoint[?param&param=value][ [actor:type]]`
 *
 * Examples:
 * - `GET brand/settings`
 * - `GET basket/products?basket_id&filter[products_category_id]`
 * - `POST oauth/access_token [actor:client]`
 *
 * @param {string} method - HTTP method
 * @param {string} path - Request path with query string
 * @param {string} [actorType] - Actor type from response body (for token endpoints)
 * @returns {string} Readable key
 */
export function generateReadableKey(method, path, actorType) {
  const { method: verb, path: endpoint, params } = fixtureIdentity(method, path);
  const paramsStr = renderParams(params);

  let key = `${verb} ${endpoint}`;
  if (paramsStr) key += `?${paramsStr}`;
  if (actorType) key += ` [actor:${actorType}]`;

  return key;
}

/**
 * Redact PII tokens inside a string at the value level, deterministically.
 * The same source token always maps to the same placeholder within a run.
 *
 * @param {string} value - String to scrub
 * @returns {string} String with any UUID/email/E.164/JWT tokens replaced
 */
export function redactValue(value) {
  let result = value;

  for (const { type, pattern, replace } of PII_VALUE_PATTERNS) {
    if (!piiMaps.has(type)) piiMaps.set(type, new Map());
    if (!piiCounters.has(type)) piiCounters.set(type, 0);
    const seen = piiMaps.get(type);

    result = result.replace(pattern, match => {
      if (!seen.has(match)) {
        const next = piiCounters.get(type) + 1;
        piiCounters.set(type, next);
        seen.set(match, replace(next));
      }
      return seen.get(match);
    });
  }

  return result;
}

/**
 * Sanitize sensitive data in a fixture.
 *
 * Two layers, both applied:
 * 1. Key-based: string values under sensitive keys (`token`, `password`, …)
 *    become `mock-{key}`.
 * 2. Value-based: any string (regardless of key) has UUID / email / E.164
 *    phone / JWT tokens replaced with deterministic `mock-*` placeholders.
 *
 * @param {unknown} obj - Data to sanitize
 * @param {number} [depth=0] - Current recursion depth
 * @returns {unknown} Sanitized data
 */
export function sanitize(obj, depth = 0) {
  if (depth > 50) return obj;
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") return redactValue(obj);

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

// --- HTTP transport helpers (shared by both recorders) -----------------------
// The reverse proxy (`recording-proxy.mjs`) and the browser interception
// recorder (`playwright-recorder.mjs`) sanitize headers and parse bodies
// identically — one definition here keeps them from drifting apart.

/** Header names whose values are redacted before a request lands in a fixture. */
export const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token"
]);

/**
 * Redact the values of {@link SENSITIVE_HEADERS}, preserving any auth scheme
 * prefix for readability (e.g. `Bearer <REDACTED>`). Null-safe: a missing header
 * bag yields an empty object.
 *
 * @param {Record<string, unknown>} [headers]
 * @returns {Record<string, unknown>}
 */
export function sanitizeHeaders(headers) {
  const result = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      const schemeMatch = String(value).match(/^(\S+)\s+/);
      result[key] = schemeMatch ? `${schemeMatch[1]} <REDACTED>` : "<REDACTED>";
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Parse a JSON string, returning `null` for empty or non-JSON input (assets,
 * HTML) rather than throwing.
 *
 * @param {string | null | undefined} text
 * @returns {unknown}
 */
export function parseJsonOrNull(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
