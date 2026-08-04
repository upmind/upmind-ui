// -----------------------------------------------------------------------------
/**
 * @module factory/module-state
 * @description The one cross-archetype, non-business state a surface renders
 * instead of its normal content, resolved from `ModuleDescriptor.snapshot.meta`
 * (design.md FE-2977 §Block C).
 */

/**
 * The real meta flag names the client-emails canary exposes for these states
 * (grep-verified: no composable anywhere exposes `isScopeInvalid` — that
 * fabricated fourth state is deleted, not renamed, per R-D1). The error
 * concept itself is split across two names by headless's own composables —
 * `hasError` (collection, `useClientEmails.meta.ts`) vs `hasErrors` (manager,
 * `useClientEmailManager.meta.ts`) — the resolver tolerates both rather than
 * picking a side; normalising that split is headless's own parallel
 * composable refactor, out of bounds here.
 */
export const MODULE_STATE_META_FLAG = {
  LOADING: "isLoading",
  HAS_ERROR: "hasError",
  HAS_ERRORS: "hasErrors"
} as const;

export type ModuleState = "loading" | "error" | "ready";
