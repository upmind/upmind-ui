import { AccessRoleTypes } from "@upmind-automation/types"; // packages/types/src/data/enums.ts:16

/**
 * Mirror of headless `ScopeActorTypes` (`packages/headless/src/modules/scope/scope.types.ts:11-16`)
 * over the vue-free source enum — the core cannot import headless (design §1, §9).
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
