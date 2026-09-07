// -----------------------------------------------------------------------------
/**
 * @module invoices/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW (see
 * `@upmind-automation/test-fixtures/replay-server`), failing loudly on any
 * unmatched request. Imported by every `*.int.test.ts` in this module so its
 * replay lifecycle registers for that file. Real network only in
 * record/live mode. Mirrors `client-email-history/__tests__/setup.integration.ts`.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

export const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
