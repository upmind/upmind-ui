// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/playwright-recorder
 * @description The headless-Playwright half of the fixture generator
 * (ADR 025 §A1.3 / FE-2937 mode (b)). A unit's `<unit>.fixtures.ts` launches a
 * real headless chromium session, drives a real staging flow, and attaches THIS
 * recorder to the browser context. The recorder is a network-interception
 * recorder — the SAME real recording pipeline the HTTP `recording-proxy.mjs`
 * uses (`sanitize` / `redactValue` / `generateFixtureName` from
 * `fixture-naming.mjs`, v3 `ApiFixtureV3` shape) — so a browser-driven capture
 * lands byte-identical to a proxy-driven one, PII-masked, deterministically
 * named, in the UNIT'S OWN co-located `recordingsDir` (no central pool).
 *
 * ## Why interception, not a forward proxy
 * `recording-proxy.mjs` is a reverse proxy the app must be pointed at; there is
 * no hosted storefront to point at staging here. `context.route('**')` is the
 * browser-native equivalent: every request the page issues is forwarded to the
 * real API (`route.fetch`), captured, then fulfilled back to the page. The
 * request's `Origin`/`Referer` are rewritten to the brand origin (the API
 * resolves the tenant from `Origin`; a headless page has none) and the response
 * is fulfilled with permissive CORS so the page's own `fetch` resolves — exactly
 * the header rewriting `recording-proxy.mjs` already performs.
 *
 * ## What is captured
 * Only JSON responses from the configured API host. CORS pre-flight (`OPTIONS`)
 * is answered locally and never captured (it carries no domain data). Every
 * status is kept, including the deliberate 4xx an invalid-basket flow needs —
 * a fixture named for a failure must contain the failure.
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  generateFixtureName,
  parseJsonOrNull,
  redactValue,
  sanitize,
  sanitizeHeaders
} from "./fixture-naming.mjs";

// -----------------------------------------------------------------------------

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "access-control-allow-headers":
    "Content-Type, Authorization, X-Requested-With, Accept, Origin, Referer"
};

// -----------------------------------------------------------------------------

/**
 * Attach the recorder to a Playwright `BrowserContext`. Registers a single
 * `context.route` handler, matched by a URL predicate so only API-host requests
 * reach it. Returns a small controller so the generator can read the capture
 * count (and fail loud if a flow captured nothing).
 *
 * @param {import("@playwright/test").BrowserContext} context
 * @param {{
 *   recordingsDir: string,      // the unit's own co-located fixtures/ dir
 *   origin: string,             // brand origin to rewrite onto every request
 *   apiHostPattern?: RegExp,    // which host is the API to capture
 *   source?: "journey"|"case",  // v3 source (default "journey")
 *   name?: string,              // v3 provenance label
 *   brandDomain?: string        // v3 brand_domain (default: origin hostname)
 * }} opts
 */
export async function attachRecorder(context, opts) {
  const {
    recordingsDir,
    origin,
    apiHostPattern = /api\.[\w.-]*upmind\.io$/,
    source = "journey",
    name = source,
    brandDomain = safeHostname(origin) ?? "example.com"
  } = opts ?? {};

  if (!recordingsDir) {
    throw new Error(
      "[playwright-recorder] recordingsDir is required — the unit's own " +
        "co-located fixtures/ dir (the central pool is retired, ADR 025)."
    );
  }
  if (!origin) {
    throw new Error(
      "[playwright-recorder] origin is required — the API resolves the brand " +
        'from the Origin header; without it every call returns 404 "Domain not found!".'
    );
  }

  if (!existsSync(recordingsDir)) mkdirSync(recordingsDir, { recursive: true });

  const provenance = source === "journey" ? { journey: name } : { case: name };
  let count = 0;

  // Match only the API host at the route layer, so non-API requests (assets,
  // the app document) never enter the handler — Playwright leaves them
  // un-intercepted. OPTIONS pre-flight is still answered locally, but only for
  // the API host now.
  await context.route(
    u => apiHostPattern.test(u.host),
    async route => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      // CORS pre-flight — answer locally, never forward or capture.
      if (method === "OPTIONS") {
        return route.fulfill({ status: 204, headers: CORS_HEADERS });
      }

      // Rewrite Origin/Referer to the brand so the API resolves the tenant — a
      // headless page has no meaningful origin (mirrors recording-proxy.mjs).
      const upstreamHeaders = {
        ...request.headers(),
        origin,
        referer: `${origin}/`
      };

      const response = await route.fetch({ headers: upstreamHeaders });
      const status = response.status();
      const bodyText = await response.text();
      const responseData = parseJsonOrNull(bodyText);

      // Fulfil the page with the REAL body + permissive CORS so its fetch resolves.
      const fulfilHeaders = { ...response.headers(), ...CORS_HEADERS };
      delete fulfilHeaders["content-encoding"];
      delete fulfilHeaders["content-length"];
      await route.fulfill({ status, headers: fulfilHeaders, body: bodyText });

      // Non-JSON (assets, HTML) is forwarded but not captured.
      if (responseData === null) return;

      // --- capture through the real pipeline ------------------------------------
      // Scrub PII from the path too, so no real ids land in the path/filename.
      const safePath = redactValue(url.pathname + url.search);
      const requestBody = parseJsonOrNull(request.postData());

      const fixture = {
        version: 3,
        request: {
          method,
          path: safePath,
          headers: sanitizeHeaders(request.headers()),
          body: requestBody !== null ? sanitize(requestBody) : null
        },
        response: {
          status,
          headers: {},
          body: sanitize(responseData)
        },
        captured_at: new Date().toISOString(),
        brand_domain: brandDomain,
        source,
        provenance
      };

      const filename = `${generateFixtureName(method, safePath, responseData)}.json`;
      writeFileSync(
        join(recordingsDir, filename),
        `${JSON.stringify(fixture, null, 2)}\n`,
        "utf-8"
      );
      count += 1;
      // eslint-disable-next-line no-console
      console.log(
        `[playwright-recorder] ${method} ${url.pathname} -> ${status}  (${filename})`
      );
    }
  );

  return { count: () => count };
}

function safeHostname(url) {
  try {
    return new URL(url).hostname || undefined;
  } catch {
    return undefined;
  }
}
