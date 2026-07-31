import type { ScopeActorTypes } from "../scope";
import type {
  ClientPhoneDryListQuery,
  ClientPhoneDryServices
} from "./client-phone-dry.types";

// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/useClientPhonesDry.internals
 * @description Advanced/debugging access (ADR-001 four-layer return shape).
 */
export function createClientPhoneDryInternals(
  actorScope: ScopeActorTypes,
  query: ClientPhoneDryListQuery,
  service: ClientPhoneDryServices
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
export type UseClientPhonesDryInternals = ReturnType<
  typeof createClientPhoneDryInternals
>;
