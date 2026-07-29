// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Implementation Pattern" +
 * "TanStack Query variant" + `code-composables.companion.md` "Variance law"
 * clauses 1/2/4. A disagreement between this skeleton, its worked example,
 * and the doctrine is a surfaced finding, never silently resolved toward
 * either.
 *
 * `@precedent` citations point at `client-email/` — the only query-backed scoped
 * module, and the FE-2824 implementation this bundle's anti-cosplay law was
 * written about. Cite it for facts; never copy its shape.
 */

import { createScopedComposable } from "../scope";
import createModuleServices from "./module.services";
import { createModuleActions } from "./useModule.actions";
import { createModuleContext } from "./useModule.context";
import { createModuleInternals } from "./useModule.internals";
import { createModuleMeta } from "./useModule.meta";
import type { ModuleScopeMatrix } from "./module.types";
import { ScopeActorTypes } from "../scope";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { IToken } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule
 * @description Scoped, query-backed collection composable (no machine): one
 * TanStack query per concrete `(actor, context)` scope, minted once at
 * construction so it survives component lifecycles. Returns ONLY the four
 * sub-composable factories — no direct props.
 *
 * @doctrine clause 1 (uniform four-layer default) — same return shape as the
 * machine variant.
 * @doctrine clause 4 (`.as('self')` builder-owned) — `config.actor` arriving
 * here is ALREADY a concrete actor.
 * @precedent `client-email/useClientEmails.ts`.
 */
function createModuleForScope(
  config: ScopeConfig,
  _session: IToken | undefined,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  const service = createModuleServices(actorScope, config.context);

  // Mint the list query ONCE per scope — a `service.loadList()` inside a layer
  // factory mints a second query, with its own refs, key and effect scope.
  const query = service.loadList({ pagination: { limit: 0 } });

  return {
    // --- Sub-composables (no direct props — clause 1 / Part B Four-Layer Return Shape)
    /** Sub-composable for collection actions (mutations, refresh, lifecycle). */
    useActions: () => createModuleActions(actorScope, service, query, scopeKey),

    /** Sub-composable for collection context (reactive data + lookups). */
    useContext: () => createModuleContext(actorScope, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createModuleInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createModuleMeta(actorScope, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable — replace this JSDoc with the module's real usage example.
 *
 * @example
 * ```ts
 * const module = useModule().as('self')
 * ```
 */
export const useModule = createScopedComposable<
  ReturnType<typeof createModuleForScope>,
  ModuleScopeMatrix
>("module", createModuleForScope);

// Type export for consumers
export type UseModule = ReturnType<typeof useModule>;
