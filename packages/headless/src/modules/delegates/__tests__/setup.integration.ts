// -----------------------------------------------------------------------------
/**
 * @module delegates/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW (see
 * `@upmind-automation/test-fixtures/replay-server`), failing loudly on any
 * unmatched request. Imported by every `*.int.test.ts` in this module so its
 * replay lifecycle registers for that file. Real network only in record/live
 * mode. Exports the server handle so tests can install per-test
 * `server.use(...)` overrides — required here because several captures share
 * one route and differ only by their `case` marker.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

export const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
