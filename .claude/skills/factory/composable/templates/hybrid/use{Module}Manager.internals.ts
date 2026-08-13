// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Four-Layer Return Shape"
 * (Internals row) + "State Machine vs TanStack Query". A disagreement between
 * this skeleton, its worked example, and the doctrine is a surfaced finding,
 * never silently resolved toward either.
 *
 * `@precedent` the recovered `client-email/useClientEmailManager.internals.ts`.
 */

import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModuleManager.internals
 * @description Manager internals sub-composable (debugging). The MACHINE half
 * of the hybrid exposes `send`/`state`/`service` — the collection half exposes
 * the raw `query` object instead (`useModules.internals.ts`). Same layer, two
 * different backings: that asymmetry is Part B's, not a slip.
 * @doctrine clause 1 (uniform four-layer default) — machine-variant form.
 */
export function createModuleManagerInternals(
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
export type UseModuleManagerInternals = ReturnType<
  typeof createModuleManagerInternals
>;
