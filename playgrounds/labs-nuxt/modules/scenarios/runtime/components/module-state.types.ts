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

/**
 * `ABSENT` is the single-record twin of a collection's zero rows: the read
 * landed and the RECORD is not there. It is named apart from `ERROR` because a
 * record that is absent is not a record that failed to load (operator ruling,
 * 2026-08-29 · FE-3113 `Y2`) — one conflated arm would draw the same picture for
 * both, which is the very distinction this vocabulary exists to keep.
 *
 * @graphify-citation `graphify query "module state absent record not found empty
 * state enum"` (2026-08-29) — `graphify-out/graph.json` carries no absent/
 * not-found state member outside this enum, so the state joins it rather than
 * minting a parallel one.
 */
export enum ModuleState {
  UNSERVED = "unserved",
  LOADING = "loading",
  ERROR = "error",
  ABSENT = "absent",
  READY = "ready"
}
