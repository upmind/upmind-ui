// -----------------------------------------------------------------------------
/**
 * @module product-setup/__tests__/setup.integration
 * @description Replays THIS module's co-located, headless-Playwright-generated
 * fixtures (see `product-setup.fixtures.ts`) through MSW, failing loudly on any
 * unmatched request. Imported by `product-setup.int.test.ts` so the replay
 * lifecycle registers for that file. Exports the server handle so a test can
 * install per-test `server.use(...)` overrides. Real network only in
 * record/live mode.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
