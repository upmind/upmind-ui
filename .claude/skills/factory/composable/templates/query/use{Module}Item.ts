// TEMPLATE FILE — scaffold only when the module reads one record (SINGLE-READ.md).
import { createScopedComposable } from "../scope";
import { resolveClientId } from "../session-store";
import createModuleServices from "./module.services";
import { createModuleItemActions } from "./useModuleItem.actions";
import { createModuleItemContext } from "./useModuleItem.context";
import { createModuleItemInternals } from "./useModuleItem.internals";
import { createModuleItemMeta } from "./useModuleItem.meta";
import type { ModuleItemScopeMatrix } from "./module.types";
import type { ScopeActorTypes, ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModuleItem
 * @description Scoped, query-backed read of one module record, keyed by
 * `.withId(id)`.
 */

function createModuleItemForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;
  const clientId = resolveClientId(config.context);
  const service = createModuleServices(actorScope, config.context, clientId);
  const query = service.loadOne(config.id);

  return {
    /** Sub-composable for single-read actions (lifecycle). */
    useActions: () =>
      createModuleItemActions(actorScope, service, query, scopeKey, clientId),

    /** Sub-composable for single-read context (the mapped record + error). */
    useContext: () => createModuleItemContext(actorScope, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createModuleItemInternals(actorScope, query),

    /** Sub-composable for single-read meta (state flags). */
    useMeta: () => createModuleItemMeta(actorScope, query, clientId)
  };
}
// -----------------------------------------------------------------------------
/** Scoped read of one module record, e.g. `useModuleItem().withId(id)`. */
export const useModuleItem = createScopedComposable<
  ReturnType<typeof createModuleItemForScope>,
  ModuleItemScopeMatrix
>("module", createModuleItemForScope);

export type UseModuleItem = ReturnType<typeof useModuleItem>;
