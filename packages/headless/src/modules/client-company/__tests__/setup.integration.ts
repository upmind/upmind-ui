// -----------------------------------------------------------------------------
/**
 * @module client-company/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW, failing
 * loudly on any unmatched request. Imported by every `*.int.test.ts` here so the
 * replay lifecycle registers for that file.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

export const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
