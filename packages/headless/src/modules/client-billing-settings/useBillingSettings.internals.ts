import type { ClientBillingSettingsRecordQuery } from "./client-billing-settings.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettings.internals
 * @description Read internals (debugging) — the raw TanStack `query` object.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createBillingSettingsInternals(
  actorScope: ScopeActorTypes,
  query: ClientBillingSettingsRecordQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the read. */
    query
  };
}

// Type export for consumers
export type UseBillingSettingsInternals = ReturnType<
  typeof createBillingSettingsInternals
>;
