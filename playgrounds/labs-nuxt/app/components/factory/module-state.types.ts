// -----------------------------------------------------------------------------
/**
 * @module factory/module-state
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
 * The real meta flag names the client-emails canary exposes for these states.
 * The error concept itself is split across two names by headless's own
 * composables — `hasError` (collection, `useClientEmails.meta.ts`) vs
 * `hasErrors` (manager, `useClientEmailManager.meta.ts`) — so the resolver
 * tolerates both rather than picking a side.
 */
export const MODULE_STATE_META_FLAG = {
  LOADING: "isLoading",
  HAS_ERROR: "hasError",
  HAS_ERRORS: "hasErrors"
} as const;

export enum ModuleState {
  LOADING = "loading",
  ERROR = "error",
  READY = "ready"
}
