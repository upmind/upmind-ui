// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/msw-handlers
 * @description Builds MSW request handlers from the recorded fixture pool.
 *
 * Matching uses the SAME identity as fixture naming ({@link fixtureIdentity}):
 * requests are grouped by method + id-templated path; when several fixtures
 * share a route, the resolver picks the one whose response-selecting params
 * best match the request — an id-keyed param matches on PRESENCE (its value
 * varies per run), a concrete param must match by value, and a request missing
 * a param the fixture requires disqualifies it. One identity, so the matcher
 * can never drift from the names on disk.
 */

import { http, HttpResponse } from "msw";
import { forEach, groupBy, maxBy, omitBy } from "lodash-es";
import { fixtureIdentity, isId } from "./fixture-naming.mjs";
import { loadAllFixtures } from "./index";
import type { HttpHandler } from "msw";
import type { NormalizedFixture } from "./types";

// -----------------------------------------------------------------------------

/**
 * Headers that describe the recorded wire transfer, not the stored body. The
 * generator stores the DECOMPRESSED JSON body, so replaying a recorded
 * `content-encoding: br` (or a stale `content-length`) makes the consumer's
 * `fetch` try to brotli-decode plain JSON — it throws "Decompression failed",
 * the client's `.catch(() => ({ data: null }))` swallows it, and a 200 surfaces
 * `data: null`. Strip these so the served body matches what was stored.
 */
const STALE_TRANSFER_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding"
]);

/** Drop transfer-only headers whose recorded value no longer matches the stored (decompressed) body. */
function replayableHeaders(
  headers: NormalizedFixture["headers"]
): NormalizedFixture["headers"] {
  return omitBy(headers, (_value, key) =>
    STALE_TRANSFER_HEADERS.has(key.toLowerCase())
  );
}

/** MSW route pattern: id path segments become unique positional `:pN` wildcards. */
function routePattern(path: string): string {
  const { pathname } = new URL(path, "http://placeholder.local");
  const segments = pathname
    .split("/")
    .map((segment, index) => (isId(segment) ? `:p${index}` : segment));
  return `*${segments.join("/")}`;
}

/**
 * Score a fixture's identity params against a request: `-1` if the request is
 * missing a param the fixture needs or contradicts a concrete value; otherwise
 * the count of matched params (more specific = higher).
 */
function matchScore(
  params: Array<[string, string | null]>,
  requestParams: URLSearchParams
): number {
  let score = 0;
  for (const [key, value] of params) {
    if (!requestParams.has(key)) return -1;
    if (value !== null && requestParams.get(key) !== value) return -1;
    score += 1;
  }
  return score;
}

// -----------------------------------------------------------------------------

/**
 * Build the MSW handler list from every fixture in the pool. Fixtures sharing a
 * (method, templated-path) share one handler; the resolver picks the best
 * fixture by identity-param match, falling back to the least-specific one.
 */
export function buildHandlers(opts?: {
  recordingsDir?: string;
}): HttpHandler[] {
  const fixtures = loadAllFixtures(opts);
  const groups = groupBy(fixtures, fixture => {
    const id = fixtureIdentity(fixture.method, fixture.path);
    return `${id.method} ${id.path}`;
  });

  const handlers: HttpHandler[] = [];

  forEach(groups, candidates => {
    const sample = candidates[0];
    const method = sample.method.toLowerCase() as keyof typeof http;
    const route = routePattern(sample.path);
    const prepared = candidates.map(fixture => ({
      fixture,
      params: fixtureIdentity(fixture.method, fixture.path).params
    }));

    const handlerFactory = http[method] as (typeof http)["get"];
    handlers.push(
      handlerFactory(route, ({ request }) => {
        const requestParams = new URL(request.url).searchParams;
        const scored = prepared.map(candidate => ({
          ...candidate,
          score: matchScore(candidate.params, requestParams)
        }));
        const top = maxBy(scored, candidate => candidate.score);
        const pick =
          top && top.score >= 0
            ? top
            : (maxBy(scored, candidate => -candidate.params.length) ??
              scored[0]);

        return HttpResponse.json(pick.fixture.body as object, {
          status: pick.fixture.status,
          headers: replayableHeaders(pick.fixture.headers)
        });
      })
    );
  });

  return handlers;
}

export type { NormalizedFixture };
