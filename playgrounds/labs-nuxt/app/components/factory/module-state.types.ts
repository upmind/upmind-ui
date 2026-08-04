// -----------------------------------------------------------------------------
/**
 * @module factory/module-state
 * @description The one cross-archetype, non-business state a surface renders
 * instead of its normal content, resolved from `ModuleDescriptor.snapshot.meta`
 * (design.md FE-2977 §Block C).
 */

/** The well-known meta flag names every scoped composable already exposes for these states (ADR-001 precedent: `useAuth`'s `isLoading`/`hasErrors`). */
export const MODULE_STATE_META_FLAG = {
  SCOPE_INVALID: "isScopeInvalid",
  LOADING: "isLoading",
  HAS_ERRORS: "hasErrors"
} as const;

export type ModuleState = "scope-invalid" | "loading" | "error" | "ready";
