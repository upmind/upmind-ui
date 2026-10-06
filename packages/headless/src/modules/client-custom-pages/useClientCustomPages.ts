import { createScopedComposable } from "../scope";
import createClientCustomPagesServices from "./client-custom-pages.services";
import { createClientCustomPagesActions } from "./useClientCustomPages.actions";
import { createClientCustomPagesContext } from "./useClientCustomPages.context";
import { createClientCustomPagesInternals } from "./useClientCustomPages.internals";
import { createClientCustomPagesMeta } from "./useClientCustomPages.meta";
import type { ClientCustomPagesScopeMatrix } from "./client-custom-pages.types";
import type { ScopeActorTypes } from "../scope";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/useClientCustomPages
 * @description Scoped, query-backed collection of the brand's client-area
 * custom pages: one TanStack list query per concrete `(actor, context)`
 * scope, minted once at construction so it survives component lifecycles. No
 * machine — the oracle wires zero mutations for this resource (`get`/`list`
 * only; `design.md` §7). Its sibling is `useClientCustomPage`, the single
 * read by slug, registered under the SAME module name.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientCustomPagesForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  const service = createClientCustomPagesServices(actorScope);

  // Mint the list query ONCE per scope. `loadList()` takes nothing — the
  // request state is the declared query schema.
  const query = service.loadList();

  const actions = createClientCustomPagesActions(
    actorScope,
    service,
    query,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (list controls, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive page + lookups). */
    useContext: () => createClientCustomPagesContext(actorScope, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientCustomPagesInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientCustomPagesMeta(actorScope, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for the brand's client-area custom pages.
 *
 * @example
 * ```ts
 * const pages = useClientCustomPages().as('client')
 * const { data, findOne } = pages.useContext()
 * await pages.useActions().isReady()
 * pages.useActions().filters.showOnMenu(true)
 * ```
 */
export const useClientCustomPages = createScopedComposable<
  ReturnType<typeof createClientCustomPagesForScope>,
  ClientCustomPagesScopeMatrix
>("client-custom-pages", createClientCustomPagesForScope);

// Type export for consumers
export type UseClientCustomPages = ReturnType<typeof useClientCustomPages>;
