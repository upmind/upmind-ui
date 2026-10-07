import { AccessRoleTypes } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module world/scope-actor
 * @description The actor vocabulary a scope-matrix cell is booted for.
 */

/**
 * Mirror of headless `ScopeActorTypes` (`packages/headless/src/modules/scope/scope.types.ts:11-16`)
 * over the vue-free source enum — the core cannot import headless
 * (enforced by the package-scoped no-vue lint boundary, see README).
 * Only "self" is a local literal; the rest share the wire values of
 * {@link AccessRoleTypes}, including `STAFF`'s `"user"` value.
 */
export const SCOPE_ACTOR = {
  SELF: "self",
  GUEST: AccessRoleTypes.GUEST,
  CLIENT: AccessRoleTypes.CLIENT,
  STAFF: AccessRoleTypes.STAFF
} as const;

export type ScopeActor = (typeof SCOPE_ACTOR)[keyof typeof SCOPE_ACTOR];
