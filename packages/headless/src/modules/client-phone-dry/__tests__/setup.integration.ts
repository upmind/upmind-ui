// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW (see
 * `@upmind-automation/test-fixtures/replay-server`), failing loudly on any
 * unmatched request. Imported by `*.int.test.ts` so its replay lifecycle
 * registers for that file. Real network only in record/live mode.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
