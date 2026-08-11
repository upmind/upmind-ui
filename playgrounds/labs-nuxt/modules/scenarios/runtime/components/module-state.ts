// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/module-state
 * @description Resolves the cross-archetype module state a surface renders
 * instead of its normal content.
 */

import {
  MODULE_STATE_CONTEXT_ERROR,
  MODULE_STATE_META_FLAG,
  ModuleState
} from "./module-state.types";
import { find, get, isNil } from "lodash-es";

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

/**
 * The module's own copy of what went wrong, under whichever name it publishes
 * it. A surface serves every archetype, so it reads the concept rather than one
 * module's spelling of it.
 * @param context `ModuleDescriptor.snapshot.context`.
 */
export function resolveModuleDetail(context: Record<string, unknown>): unknown {
  const key = find(
    MODULE_STATE_CONTEXT_ERROR,
    name => !isNil(get(context, name))
  );
  return key ? get(context, key) : undefined;
}
