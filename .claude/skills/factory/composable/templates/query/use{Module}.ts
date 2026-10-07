// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { createScopedComposable } from "../scope";
import { resolveClientId } from "../session-store";
import createModuleServices from "./module.services";
import { createModuleActions } from "./useModule.actions";
import { createModuleContext } from "./useModule.context";
import { createModuleInternals } from "./useModule.internals";
import { createModuleMeta } from "./useModule.meta";
import type { ModuleScopeMatrix } from "./module.types";
import type { ScopeActorTypes, ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule
 * @description Scoped, query-backed module collection: one list query per
 * scope, minted once and handed to every layer.
 */

function createModuleForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;
  const clientId = resolveClientId(config.context);
  const service = createModuleServices(actorScope, config.context, clientId);
  const query = service.loadList();

  return {
    /** Sub-composable for collection actions (mutations, refresh, lifecycle). */
    useActions: () =>
      createModuleActions(actorScope, service, query, scopeKey, clientId),

    /** Sub-composable for collection context (reactive data + lookups). */
    useContext: () => createModuleContext(actorScope, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createModuleInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createModuleMeta(actorScope, query, clientId)
  };
}
// -----------------------------------------------------------------------------
/** Scoped module collection, e.g. `useModule().as("self")`. */
export const useModule = createScopedComposable<
  ReturnType<typeof createModuleForScope>,
  ModuleScopeMatrix
>("module", createModuleForScope);

export type UseModule = ReturnType<typeof useModule>;
