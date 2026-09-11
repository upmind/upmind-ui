// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/scope
 * @description Shared ADR-001 scope vocabulary for the contract files: the
 * actor keys every `*_SCOPE_MATRIX` is built from, the uninhabited-cell
 * constant, and the internals layer every contract aliases. Portal consumes
 * headless as TYPES ONLY (facades plan R3), so the runtime `ScopeActorTypes`
 * enum is out of reach here — `satisfies` proves this mirror still carries
 * its values.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import type { ScopeActorTypes } from "@upmind-automation/headless";

/** Actor keys for a scope matrix — the values of headless `ScopeActorTypes`. */
export const SCOPE_ACTOR = {
  SELF: "self",
  GUEST: AccessRoleTypes.GUEST,
  CLIENT: AccessRoleTypes.CLIENT,
  STAFF: AccessRoleTypes.STAFF
} as const satisfies Record<string, `${ScopeActorTypes}`>;

/**
 * A matrix cell for an actor that does not resolve — `never` is what removes
 * `.for()` for that actor (`scope.types.ts` `ContextsForActor`). Headless
 * spells this `null as never` inline in every module matrix; the mock era
 * names it once so the contracts carry no assertions of their own.
 */
export const NO_ACTOR_CONTEXT = null as never;

/**
 * The internals layer every contract declares. Facades plan R9: the real layer
 * exposes the raw TanStack query object, which a mock cannot honestly
 * construct and portal never consumes, so conformance exempts this layer.
 */
export type ContractInternals = {
  /** Actor scope for this instance. */
  actorScope: ScopeActorTypes;
  /** Raw query object backing the instance — absent in the mock era. */
  query: undefined;
};
