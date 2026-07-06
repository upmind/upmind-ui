// -----------------------------------------------------------------------------
/**
 * @module account/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW (see
 * `@upmind-automation/test-fixtures/replay-server`), failing loudly on any
 * unmatched request. Imported by `account.int.test.ts` so its replay lifecycle
 * registers for that file. Real network only in record/live mode.
 *
 * The brand enforce-email-verification stub (D3) lives in the test file, NOT
 * here: the integration project registers no `setupFiles`, so a `vi.mock` in
 * this plain imported helper never hoists and silently no-ops.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
