// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/fixture-handlers
 * @description MSW request handlers from recorded fixtures — the matching, and
 * nothing that reads a file. Browser-safe by construction, so the playground
 * answers a scenario step from the same matcher the node lanes use:
 * {@link buildHandlers} (`./msw-handlers`) is this over a directory.
 *
 * Matching uses the SAME identity as fixture naming ({@link fixtureIdentity}):
 * a request is answered by the fixture whose identity EQUALS the request's —
 * the method, the id-templated path, and the response-selecting params, each
 * id-keyed param by presence (its value varies per run) and every other by
 * value. A request carrying a param the fixture does not, or lacking one it
 * does, is a different request, and no fixture recorded for another request
 * answers it (FE-3145, ADR 035). One identity, so the matcher can never drift
 * from the names on disk.
 */

import { delay, http, HttpResponse } from "msw";
import { find, forEach, groupBy, isEqual, omitBy } from "lodash-es";
import { fixtureIdentity, isId } from "./fixture-naming.mjs";
import type { HttpHandler } from "msw";
import type { ApiFixtureV3, NormalizedFixture } from "./types";

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

// -----------------------------------------------------------------------------

/** When a recorded answer is served — see {@link handlersFor}. */
export type ReplayTiming = {
  delayMs?: (request: Request) => number;
};

/**
 * Build the MSW handler list from `fixtures`. Fixtures sharing a (method,
 * templated-path) share one handler, which answers with the fixture whose
 * identity equals the request's.
 *
 * A request no fixture matches is DECLINED — the handler answers nothing, so
 * the next handler decides: an earlier scenario step that recorded it, or the
 * wall that fails it as a capture gap. It is never answered by a fixture
 * recorded for a different request (FE-3145, ADR 035).
 *
 * @param fixtures The fixtures to answer with — a directory's, or one
 * scenario step's.
 * @param options.delayMs How long to hold a request's answer, for a test that
 * reads the window BEFORE a response lands. It changes when the recorded body
 * is served, never the body.
 */
export function handlersFor(
  fixtures: NormalizedFixture[],
  options?: ReplayTiming
): HttpHandler[] {
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
      handlerFactory(route, async ({ request }) => {
        const { pathname, search } = new URL(request.url);
        const { params } = fixtureIdentity(
          request.method,
          `${pathname}${search}`
        );
        const pick = find(prepared, candidate =>
          isEqual(candidate.params, params)
        );
        if (!pick) return undefined;

        const held = options?.delayMs?.(request);
        if (held) await delay(held);

        return HttpResponse.json(pick.fixture.body as object, {
          status: pick.fixture.status,
          headers: replayableHeaders(pick.fixture.headers)
        });
      })
    );
  });

  return handlers;
}

/**
 * How a CAPTURE GAP reads — a request no recording answers, named by its method,
 * path and query, so the failure names the recording somebody has to capture.
 * One wording for every wall, node and browser alike.
 *
 * @param request The request that reached the wall.
 */
export function captureGap(request: Request): string {
  const { pathname, search } = new URL(request.url);

  return `no fixture for ${request.method} ${pathname}${search}`;
}

/**
 * One recorded v3 fixture as {@link handlersFor} reads it — the browser's way
 * in, where there is no directory to load from, only the recordings a bundle
 * carries.
 *
 * @param fixture The recording, as committed.
 * @param file The name it was committed under.
 */
export function normalizeRecording(
  fixture: ApiFixtureV3,
  file: string
): NormalizedFixture {
  return {
    body: fixture.response.body,
    file,
    headers: fixture.response.headers ?? {},
    method: fixture.request.method,
    path: fixture.request.path,
    source: fixture.source,
    status: fixture.response.status
  };
}
