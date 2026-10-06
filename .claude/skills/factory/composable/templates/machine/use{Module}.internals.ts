// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.internals
 * @description Module internals, for tests and debugging.
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

export type UseModuleInternals = ReturnType<typeof createModuleInternals>;
