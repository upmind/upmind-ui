// -----------------------------------------------------------------------------
/**
 * @module orders/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW (see
 * `@upmind-automation/test-fixtures/replay-server`), failing loudly on any
 * unmatched request. Imported by every `*.int.test.ts` in this module so its
 * replay lifecycle registers for that file. Real network only in
 * record/live mode. Mirrors `invoices/__tests__/setup.integration.ts`.
 *
 * Background stubs for the endpoints session-store and `useBrand()` touch on
 * init are installed per-seed by the test (see `installBackgroundStubs` in
 * `orders.int-helpers.ts`), because `resetHandlers()` between tests
 * drops any handler added at import time.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

export const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
