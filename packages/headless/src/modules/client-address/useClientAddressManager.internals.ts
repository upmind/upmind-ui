import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-address/useClientAddressManager.internals
 * @description Manager internals (debugging). The machine half exposes
 * `send`/`state`/`service`; the collection half exposes the raw `query`.
 * @doctrine clause 1 (uniform four-layer default) — machine-variant form.
 */
export function createClientAddressManagerInternals(
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
export type UseClientAddressManagerInternals = ReturnType<
  typeof createClientAddressManagerInternals
>;
