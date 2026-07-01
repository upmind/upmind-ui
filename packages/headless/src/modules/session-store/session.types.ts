/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module session-store/session.types
 * @description Session scope matrix for scoped composable wiring.
 */

import { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * Session module scope matrix (runtime value - single source of truth).
 * Mirrors AUTH_SCOPE_MATRIX shape. Sessions don't act on behalf of other
 * sessions — each actor is its own identity, so all contexts are null.
 */
export const SESSION_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/**
 * Session module scope matrix type (derived from runtime const).
 */
export type SessionScopeMatrix = typeof SESSION_SCOPE_MATRIX;
