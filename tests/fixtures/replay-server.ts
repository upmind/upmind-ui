// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/replay-server
 * @description Stands up an MSW server seeded from the recorded fixture pool and
 * fails loudly on any unmatched request, so a test can never silently hit the
 * real network or a missing fixture. Generic — any package's vitest setup can
 * call {@link startReplayServer}. A no-op outside `replay` mode.
 */

import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { buildHandlers } from "./msw-handlers";
import type { SetupServerApi } from "msw/node";

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
}): SetupServerApi | undefined {
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
