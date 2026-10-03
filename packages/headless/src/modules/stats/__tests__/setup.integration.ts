// -----------------------------------------------------------------------------
/**
 * @module stats/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW (see
 * `@upmind-automation/test-fixtures/replay-server`), failing loudly on any
 * unmatched request. Imported by every `*.int.test.ts` in this module so its
 * replay lifecycle registers for that file. Real network only in
 * record/live mode.
 *
 * **Why this module freezes the clock, and its siblings do not.** Each stat
 * read sends `date_to=<today>` (`stats.utils.ts`), and the replay matches a
 * recording by its WHOLE query sentence, `date_to` included. This module's
 * `fixtures/*.json` were recorded on {@link RECORDED_DATE} and carry that day
 * in their recorded path, so from the day after the recording an unfrozen
 * clock makes every stat read miss its fixture.
 *
 * **The freeze is LOCAL noon, not UTC midnight.** `statsDateTo()` formats the
 * frozen instant in LOCAL time, so a UTC-midnight freeze reads as the previous
 * calendar day on any host west of UTC. Building the frozen `Date` from its
 * LOCAL-time constructor overload pins the calendar date on every host, and
 * noon keeps a margin either side of midnight for any DST shift.
 */

import { join } from "node:path";
import { afterAll, beforeAll, vi } from "vitest";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

/**
 * The day this module's `fixtures/*.json` were recorded against staging, and
 * therefore the `date_to` their recorded request paths carry. Re-record the
 * fixtures (`pnpm fixtures:generate stats`) and this constant moves with them.
 */
export const RECORDED_DATE = "2026-10-03";

export const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });

beforeAll(() => {
  const [year, month, day] = RECORDED_DATE.split("-").map(Number);
  vi.setSystemTime(new Date(year, month - 1, day, 12, 0, 0, 0));

  // The usage read only fires inside the Upmind context, which the oracle
  // decides by matching the browser hostname against this allowlist (vue-app
  // `src/store/index.ts:66-69`). The DOM environment serves `localhost`, so
  // naming it here puts the lane IN context — the state the recorded 409 was
  // captured in. Without it every usage read is gated off and its spec waits
  // for a request that correctly never fires.
  vi.stubEnv("VITE_APP_UPMIND_HOSTNAMES", "localhost");
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
