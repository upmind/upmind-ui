// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Four-Layer Return Shape"
 * (Internals row). A disagreement between this skeleton, its worked example,
 * and the doctrine is a surfaced finding, never silently resolved toward
 * either.
 */

import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.internals
 * @description Module internals sub-composable (advanced/debugging/testing
 * access). Same for every actor — no routing needed at this layer.
 * @doctrine clause 1 (uniform four-layer default) — `code-composables.md`
 * Part B "Four-Layer Return Shape" (Internals row): raw `send`/`state`/
 * `service`, identical shape regardless of actor.
 * @worked-example `account/useAccount.internals.ts`.
 */
export function createModuleInternals(
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
export type UseModuleInternals = ReturnType<typeof createModuleInternals>;
