// -----------------------------------------------------------------------------
/**
 * @module client-notifications/useClientNotificationsManager.internals
 * @description Manager internals sub-composable (debugging) — the MACHINE
 * half of the hybrid, exposing `send`/`state`/`service`. The collection half
 * exposes the raw `query` objects instead (`useClientNotifications.internals.ts`).
 * @doctrine clause 1 (uniform four-layer default) — machine-variant form.
 */

import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------

export function createClientNotificationsManagerInternals(
  actorScope: ScopeActorTypes,
  actor: UseActor
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw send function for machine events. */
    send: actor.send,
    /** Raw XState service. */
    service: actor.service,
    /** Raw XState state ref. */
    state: actor.state
  };
}

// Type export for consumers
export type UseClientNotificationsManagerInternals = ReturnType<
  typeof createClientNotificationsManagerInternals
>;
