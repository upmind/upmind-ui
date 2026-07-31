import type { ScopeActorTypes } from "../scope";
import type {
  ClientAddressDryListQuery,
  ClientAddressDryServices
} from "./client-address-dry.types";

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/useClientAddressesDry.internals
 * @description Advanced/debugging access (ADR-001 four-layer return shape).
 */
export function createClientAddressDryInternals(
  actorScope: ScopeActorTypes,
  query: ClientAddressDryListQuery,
  service: ClientAddressDryServices
) {
  return {
    /** Actor scope for this instance. */
    actorScope,

    /** Raw TanStack query object backing the collection. */
    query,

    /** The scoped services instance backing this collection. */
    service,

    /** The cache key this collection's list query is stored under. */
    queryKey: service.queryKey
  };
}

// Type export for consumers
export type UseClientAddressesDryInternals = ReturnType<
  typeof createClientAddressDryInternals
>;
