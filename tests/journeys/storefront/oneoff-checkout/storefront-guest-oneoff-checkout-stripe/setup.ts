// -----------------------------------------------------------------------------
/**
 * @module storefront-guest-oneoff-checkout-stripe/setup
 * @description Replays THIS journey's own co-located fixtures through MSW (ADR
 * 025 — per-unit fixtures, no central pool), failing loudly on any unmatched
 * request. Imported by the journey's `.int.test.ts` so the replay lifecycle
 * registers for that file. Exports the server handle so a test can install
 * per-test `server.use(...)` overrides. Real network only in record/live mode.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

// `import.meta.dirname` (not `fileURLToPath(new URL(...))`): under vitest's
// transform `import.meta.url` is not a file: URL here, so the URL form throws
// "URL must be of scheme file" and the int test fails to collect (mirrors the
// module setup.integration.ts note).
const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
