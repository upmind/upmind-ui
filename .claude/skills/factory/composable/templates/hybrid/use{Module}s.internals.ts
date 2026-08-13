// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Four-Layer Return Shape"
 * (Internals row) + "TanStack Query variant". A disagreement between this
 * skeleton, its worked example, and the doctrine is a surfaced finding, never
 * silently resolved toward either.
 *
 * `@precedent` citations point at `client-email/` — the only query-backed scoped
 * module, and the FE-2824 implementation this bundle's anti-cosplay law was
 * written about. Cite it for facts; never copy its shape.
 */

import type { ScopeActorTypes } from "../scope";
import type { ModuleListQuery } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModules.internals
 * @description Module collection internals sub-composable (debugging). The
 * query-variant exposes the raw `query` object, not `send`/`state`/`service`
 * — `code-composables.md` Part B "TanStack Query variant".
 * @doctrine clause 1 (uniform four-layer default) — Part B "Four-Layer
 * Return Shape" (Internals row), TanStack-variant form.
 * @precedent `client-email/useClientEmails.internals.ts`.
 */
export function createModulesInternals(
  actorScope: ScopeActorTypes,
  query: ModuleListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query
  };
}

// Type export for consumers
export type UseModuleInternals = ReturnType<typeof createModulesInternals>;
