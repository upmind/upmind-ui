// -----------------------------------------------------------------------------
/**
 * @module session-store/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW (see
 * `@upmind-automation/test-fixtures/replay-server`), failing loudly on any
 * unmatched request. Imported by session-store's `.int.test.ts` files so their
 * replay lifecycle registers for that file. Real network only in record/live
 * mode. Exports the server handle so tests can install per-test
 * `server.use(...)` overrides — required for the token-endpoint fixtures,
 * which share one MSW identity and differ only by request body.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
