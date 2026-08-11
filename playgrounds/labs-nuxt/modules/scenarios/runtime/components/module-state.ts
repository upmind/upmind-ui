// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/module-state
 * @description Resolves the cross-archetype module state a surface renders
 * instead of its normal content.
 */

import { MODULE_STATE_META_FLAG, ModuleState } from "./module-state.types";

// -----------------------------------------------------------------------------

/**
 * Resolves the module state from the already-evaluated meta booleans. A flag
 * the composable doesn't expose is `undefined` — treated as `false`, never a
 * false positive.
 * @param meta `ModuleDescriptor.snapshot.meta`.
 */
export function resolveModuleState(meta: Record<string, boolean>): ModuleState {
  if (meta[MODULE_STATE_META_FLAG.LOADING]) return ModuleState.LOADING;
  if (
    meta[MODULE_STATE_META_FLAG.HAS_ERROR] ||
    meta[MODULE_STATE_META_FLAG.HAS_ERRORS]
  )
    return ModuleState.ERROR;
  return ModuleState.READY;
}
