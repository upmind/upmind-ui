/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-26) — queried
 * `auth gate choice` · `impersonate` · `scope chooser`: the only `AuthGateChoice`
 * node in the tree was this vocabulary's own former inline declaration in
 * `pages/overlays/auth.vue`, so there is nothing to consume and it is minted
 * once here. It cannot live beside the page: Nuxt scans `.ts` under `pages/`
 * as routes, so a types file there would mint `/overlays/auth.types`.
 */
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

/**
 * Impersonate is a GATE choice, never an actor: it runs the STAFF journey, and
 * the client being acted for is picked from `SessionSwitcher` after staff login.
 */
export const AUTH_GATE_IMPERSONATE = "impersonate";

/**
 * What the gate's chooser holds — the three journeys `R9` offers. It is the
 * CHOICE, not the actor it resolves to: Impersonate and Staff run the same
 * journey, so a group bound to the actor draws Staff pressed when Impersonate
 * was taken, and Impersonate can never read as chosen at all.
 *
 * Guest is absent by design — it collects no session, so it is a scope
 * route-out rather than a journey (see `pages/overlays/auth.vue`).
 */
export type AuthGateChoice =
  | ScopeActorTypes.CLIENT
  | ScopeActorTypes.STAFF
  | typeof AUTH_GATE_IMPERSONATE;

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
