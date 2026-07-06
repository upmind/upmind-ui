// -----------------------------------------------------------------------------
/**
 * @module auth/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW (see
 * `@upmind-automation/test-fixtures/replay-server`), failing loudly on any
 * unmatched request. Imported by `auth.int.test.ts` so its replay lifecycle
 * registers for that file. Real network only in record/live mode.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

// NOTE: `import.meta.dirname` (not `fileURLToPath(new URL(..., import.meta.url))`)
// — under vitest's transform `import.meta.url` is not a file: URL here, so the
// URL form throws "URL must be of scheme file" and the int test fails to collect.
const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
