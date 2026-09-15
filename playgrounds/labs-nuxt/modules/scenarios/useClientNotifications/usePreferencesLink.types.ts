// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientNotifications/usePreferencesLink.types
 * @description Types for the preferences-link page action — the progress phases
 * the orchestration walks while it mints and opens a notification-preferences
 * link.
 *
 * @graphify-citation `graphify query "scenario page action labs orchestration
 * header action instance"` (2026-09-08, `graphify-out/graph.json`) — no
 * preferences-link or progress-phase node exists in the tree; this is minted
 * here for the labs orchestration and consumed only by `usePreferencesLink.ts`.
 */

// -----------------------------------------------------------------------------

/** Where the preferences-link orchestration is in its trigger → poll → open walk. */
export enum PreferencesLinkPhase {
  IDLE = "idle",
  REQUESTING = "requesting",
  WAITING = "waiting",
  FOUND = "found",
  OPENING = "opening",
  FAILED = "failed"
}
