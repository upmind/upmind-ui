// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/module-state.types
 * @description The one cross-archetype, non-business state a surface renders
 * instead of its normal content, resolved from `ModuleDescriptor.snapshot.meta`.
 *
 * @graphify-citation `graphify query "module state loading error ready"`
 * (2026-08-10) — no `ModuleState` type/enum node in `graphify-out/graph.json`
 * beyond this module's own files; `funnels/types.ts`'s `ROUTE` carries
 * loading/error members for a different domain (routing), so there is no
 * duplicate to consume.
 */

/**
 * The real meta flag names the client-emails module exposes for these states.
 * The error concept itself is split across two names by headless's own
 * composables — `hasError` (collection, `useClientEmails.meta.ts`) vs
 * `hasErrors` (manager, `useClientEmailManager.meta.ts`) — so the resolver
 * tolerates both rather than picking a side.
 *
 * `isServed` is the PORT's own — published only where the matrix refuses the
 * scope, never a claim about a composable's meta. The module flag carrying the
 * same idea, `isAvailable`, is overloaded (collection: addressability; editor:
 * `stateMatches(state, "available")`, false for every booting form), so reading
 * it here would call a loading editor unavailable. Disambiguating it is
 * protected-core work, the split `R-D1` recorded for `hasError`/`hasErrors`.
 */
export const MODULE_STATE_META_FLAG = {
  SERVED: "isServed",
  LOADING: "isLoading",
  HAS_ERROR: "hasError",
  HAS_ERRORS: "hasErrors"
} as const;

/**
 * The context key carrying WHAT went wrong, split by the same two composables
 * under the same two names (`error` vs `errors`) — read in declaration order,
 * so a module publishing one is never asked for the other.
 */
export const MODULE_STATE_CONTEXT_ERROR = ["error", "errors"] as const;

export enum ModuleState {
  UNSERVED = "unserved",
  LOADING = "loading",
  ERROR = "error",
  READY = "ready"
}
