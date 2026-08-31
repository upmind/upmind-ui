// -----------------------------------------------------------------------------
/**
 * @module invoices/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW (see
 * `@upmind-automation/test-fixtures/replay-server`), failing loudly on any
 * unmatched request. Imported by `invoices.int.test.ts` so its replay lifecycle
 * registers for that file. Real network only in record/live mode.
 *
 * Background stubs for the endpoints session-store touches on init are installed
 * per-seed by the test (see `installBackgroundStubs`), because `resetHandlers()`
 * between tests drops any handler added at import time.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

export const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });

/**
 * Stubs the bootstrap endpoints session-store hits on `initStore()` — none of
 * them an invoices behaviour — so a suite scoped to invoices never blocks on
 * them. Re-applied on every seed; the replay server resets handlers per test.
 */
export function installBackgroundStubs(): void {
  server.use(
    http.get("*/org/modules", () =>
      HttpResponse.json({ status: "ok", data: [] })
    ),
    http.get("*/config/organisation/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/brand/settings", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/billing_cycles", () =>
      HttpResponse.json({ status: "ok", data: [] })
    )
  );
}
