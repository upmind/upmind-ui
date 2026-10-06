// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import type { ScopeActorTypes } from "../scope";
import type { ModuleListQuery } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.internals
 * @description Module collection internals, for tests and debugging.
 */

export function createModuleInternals(
  actorScope: ScopeActorTypes,
  query: ModuleListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,

    /** Raw query backing the collection. */
    query
  };
}

export type UseModuleInternals = ReturnType<typeof createModuleInternals>;
