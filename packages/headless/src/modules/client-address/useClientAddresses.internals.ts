import type { ClientAddressListQuery } from "./client-address.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-address/useClientAddresses.internals
 * @description Collection internals (debugging). The query half exposes the
 * raw `query` object; the manager half exposes `send`/`state`/`service`.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createClientAddressesInternals(
  actorScope: ScopeActorTypes,
  query: ClientAddressListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query
  };
}

// Type export for consumers
export type UseClientAddressesInternals = ReturnType<
  typeof createClientAddressesInternals
>;
