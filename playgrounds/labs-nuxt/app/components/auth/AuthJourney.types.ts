// -----------------------------------------------------------------------------
/**
 * @module components/auth/AuthJourney.types
 * @description Type definitions for the shared auth journey.
 */

import type {
  AuthContextTypes,
  ScopeActorTypes,
  ScopeContext
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export type AuthJourneyProps = {
  /** The actor a session is collected for — the `/as/<actor>` segment's value. */
  actor: ScopeActorTypes;

  /** The context that actor acts for, when the url names one. */
  context?: ScopeContext<AuthContextTypes>;

  /**
   * Collect a session BESIDE the ones already held. Without it the composable
   * reads the live session of that scope and short-circuits to authenticated,
   * which is a journey that renders nothing.
   */
  fresh?: boolean;
};
