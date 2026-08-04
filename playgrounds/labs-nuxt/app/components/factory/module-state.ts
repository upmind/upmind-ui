// -----------------------------------------------------------------------------
/**
 * @module factory/module-state
 * @description Resolves the cross-archetype module state a surface renders
 * instead of its normal content (design.md FE-2977 §Block C).
 */

import { MODULE_STATE_META_FLAG } from "./module-state.types";
import type { ModuleState } from "./module-state.types";

// -----------------------------------------------------------------------------

/**
 * Resolves `scope-invalid` / `loading` / `error` / `ready` from the
 * already-evaluated meta booleans. A flag the composable doesn't expose is
 * `undefined` — treated as `false`, never a false positive.
 * @param meta `ModuleDescriptor.snapshot.meta`.
 */
export function resolveModuleState(meta: Record<string, boolean>): ModuleState {
  if (meta[MODULE_STATE_META_FLAG.SCOPE_INVALID]) return "scope-invalid";
  if (meta[MODULE_STATE_META_FLAG.LOADING]) return "loading";
  if (meta[MODULE_STATE_META_FLAG.HAS_ERRORS]) return "error";
  return "ready";
}
