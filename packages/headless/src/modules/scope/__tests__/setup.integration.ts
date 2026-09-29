// -----------------------------------------------------------------------------
/**
 * @module scope/__tests__/setup.integration
 * @description Replay MSW server for scope's wire-level identity proof. The scope
 * module owns no endpoint of its own — its `resolveClientId` seam is proven at
 * the wire THROUGH a real consumer composable (`useClientAddresses`), so this
 * server replays scope's OWN co-located recordings of the three requests that
 * proof drives (`pnpm fixtures:generate scope`). Unmatched requests fail loudly.
 * Real network only in record/live mode.
 */

import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

/** Scope's own recordings — the address list read, the set-default PUT and the remove DELETE. */
export const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });
