// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/replay-server
 * @description Stands up an MSW server seeded from the recorded fixture pool and
 * fails loudly on any request no fixture answers, so a test can never silently
 * hit the real network or a missing fixture. Generic — any package's vitest
 * setup can call {@link startReplayServer}. A no-op outside `replay` mode.
 */

import { afterAll, afterEach, beforeAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { captureGap } from "./fixture-handlers";
import type { ReplayTiming } from "./fixture-handlers";
import { buildHandlers } from "./msw-handlers";
import type { HttpHandler } from "msw";
import type { SetupServer } from "msw/node";

// -----------------------------------------------------------------------------

/** HTTP verbs the replay layer serves; mirrors the `http[...]` factory map. */
export type ReplayMethod = "get" | "post" | "patch" | "put" | "delete";

/**
 * Install a runtime override that serves `body` for `route`, on top of the
 * recorded handlers. Kept here (not in a journey) because `msw` only resolves
 * from this package — a journey/test can never import `http`/`HttpResponse`
 * directly (they live under `tests/fixtures/node_modules`).
 *
 * The override sits ahead of the recorded handler for the same route and is
 * torn down by the `afterEach` `resetHandlers()` that {@link startReplayServer}
 * already registers, so it never leaks between tests. A no-op when `server` is
 * `undefined` (i.e. outside `replay` mode).
 *
 * This is the seam a boot harness uses to supply a response the recording never
 * captured (e.g. the guest's empty current-basket that a transient 401 masked)
 * without hand-editing the co-located fixture JSON. It carries no domain data
 * of its own — callers pass a real captured body or a documented empty envelope.
 *
 * @param server - The live MSW handle from {@link startReplayServer}.
 * @param method - The HTTP verb to intercept.
 * @param route - An MSW route pattern (e.g. `"*​/api/orders/current"`).
 * @param body - The JSON body to serve.
 * @param status - The HTTP status to serve (default `200`).
 */
export function overrideRoute(
  server: SetupServer | undefined,
  method: ReplayMethod,
  route: string,
  body: unknown,
  status = 200
): void {
  server?.use(
    http[method](route, () => HttpResponse.json(body as object, { status }))
  );
}

// -----------------------------------------------------------------------------

/**
 * How a request no fixture answers reads in the log: the verb and the path, so
 * the gap names the recording somebody has to capture.
 */
function unansweredMessage(request: Request): string {
  const url = new URL(request.url);
  return `[MSW] No fixture for ${request.method} ${url.pathname}${url.search}`;
}

/**
 * The LAST handler on the server, after every recorded one: a request that
 * reached the bottom of the stack unanswered is a CAPTURE GAP, and this ends it
 * here rather than letting msw perform it as-is.
 *
 * It exists because `onUnhandledRequest` cannot carry this promise on its own.
 * That hook fires only when NO handler's ROUTE matched, and a replay legitimately
 * arms a catch-all over the whole API — what `createCorpusReplayHandlers` does
 * by default — so every `/api` request is "matched" and the hook is
 * structurally dead. msw then
 * takes a handler that matched but returned no response as an implicit
 * passthrough and sends it to the REAL API. That is how ~53 requests per run of
 * the headless replay lane reached production `https://api.upmind.io`, six of
 * them surfacing as `write ECANCELED Canceled because of SSL destruction` when
 * the suite tore the sockets down mid-flight.
 *
 * A handler cannot be shadowed the way a hook can: msw runs handlers in order
 * and stops at the first RESPONSE, so this one answers only what nothing above
 * it did, and `resetHandlers()` — which restores the initial list and drops
 * runtime `use()` handlers — keeps it last for the whole run.
 *
 * The answer is a NETWORK ERROR, not a status. A 5xx would be retried three
 * times by the query client's retry policy (`modules/query/client.ts` retries
 * only numeric statuses >= 500), turning one capture gap into four failures.
 */
function unansweredRequestWall(): HttpHandler[] {
  return [
    http.all("*", ({ request }) => {
      console.error(unansweredMessage(request));
      return HttpResponse.error();
    })
  ];
}

// -----------------------------------------------------------------------------

/**
 * Starts ONE scenario (FE-3145): nothing answers but the wall. The module's
 * shared `fixtures/` are dropped, so a request only a step's own fixtures can
 * answer — anything else is a capture gap, answered with a network error and
 * RECORDED, so the scenario fails naming the request rather than the check it
 * broke.
 *
 * The wall is a RUNTIME handler, in front of the unit's shared fixtures, and
 * each {@link replayStep} sits in front of the wall. So the `afterEach`
 * `resetHandlers()` drops the wall and every step with it: the next test in
 * the file starts on the shared fixtures again.
 *
 * @param server - The live MSW handle from {@link startReplayServer}.
 * @returns The capture gaps this scenario has hit so far.
 */
export function startScenarioReplay(server: SetupServer | undefined): {
  gaps: () => string[];
} {
  const gaps: string[] = [];

  server?.use(
    http.all("*", ({ request }) => {
      gaps.push(captureGap(request));
      console.error(`[MSW] ${captureGap(request)}`);
      return HttpResponse.error();
    })
  );

  return { gaps: () => [...gaps] };
}

/**
 * Arms the fixtures ONE scenario step recorded, in front of every step before
 * it. A request this step recorded gets this step's answer; one it did not
 * record keeps the answer of the latest step that did — the state a scenario
 * carries until a step changes it.
 *
 * @param server - The live MSW handle from {@link startReplayServer}.
 * @param recordingsDir - The step's own fixtures directory.
 * @param timing - When the step's answers are served; see `handlersFor`.
 */
export function replayStep(
  server: SetupServer | undefined,
  recordingsDir: string,
  timing?: ReplayTiming
): void {
  server?.use(...buildHandlers({ recordingsDir, ...timing }));
}

// -----------------------------------------------------------------------------

/**
 * Register MSW fixture replay for the current vitest project. Call once from a
 * project's `setupFiles`. Skips entirely unless `FIXTURE_MODE` is `replay`
 * (the default), letting record/live runs reach the real network.
 *
 * Returns the live MSW server handle (or `undefined` outside `replay` mode) so
 * a test can register per-test runtime overrides — e.g. forcing a recorded
 * route to fail — via `server.use(...)`. `resetHandlers()` already runs in
 * `afterEach`, so overrides are torn down between tests automatically.
 */
export function startReplayServer(opts?: {
  recordingsDir?: string;
}): SetupServer | undefined {
  if ((process.env.FIXTURE_MODE ?? "replay") !== "replay") return undefined;

  // The wall goes LAST, behind every recorded handler: it answers only a
  // request nothing above it did. Both live in the INITIAL handler list, so
  // `resetHandlers()` restores them and a runtime `use()` override still sits
  // in front of both.
  const server = setupServer(
    ...buildHandlers(opts),
    ...unansweredRequestWall()
  );

  beforeAll(() => {
    server.listen({
      // Kept for the requests the wall's own route cannot reach; the wall is
      // what actually ends an unanswered `/api` request. One message between
      // them, so a gap reads the same whichever of the two names it.
      onUnhandledRequest: req => {
        throw new Error(unansweredMessage(req));
      }
    });
  });

  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}
