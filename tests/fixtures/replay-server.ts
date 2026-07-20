// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/replay-server
 * @description Stands up an MSW server seeded from the recorded fixture pool and
 * fails loudly on any unmatched request, so a test can never silently hit the
 * real network or a missing fixture. Generic — any package's vitest setup can
 * call {@link startReplayServer}. A no-op outside `replay` mode.
 */

import { afterAll, afterEach, beforeAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { buildHandlers } from "./msw-handlers";
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

  const server = setupServer(...buildHandlers(opts));

  beforeAll(() => {
    server.listen({
      onUnhandledRequest: req => {
        throw new Error(
          `[MSW] No fixture for ${req.method} ${new URL(req.url).pathname}`
        );
      }
    });
  });

  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}
