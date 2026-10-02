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
import { find, get, isNil, some } from "lodash-es";

// -----------------------------------------------------------------------------

/** The status a read comes back at for a record that is not there. */
const NOT_FOUND = 404;

/** Where a module publishes the status of the answer it is holding. */
const STATUS_KEYS = ["code", "status"] as const;

/**
 * The module's own copy of the answer it holds, under whichever name it
 * publishes it. A surface serves every archetype, so it reads the concept
 * rather than one module's spelling of it.
 */
function moduleAnswer(context: Record<string, unknown>): unknown {
  const key = find(
    MODULE_STATE_CONTEXT_ERROR,
    name => !isNil(get(context, name))
  );
  return key ? get(context, key) : undefined;
}

/**
 * Whether that answer says the RECORD is not there, rather than that the read
 * went wrong. A single-record surface's absence reaches this app as the API's
 * own NOT FOUND — the only status that names a missing record — and a state
 * with nothing in it is not a state that went wrong (FE-3113 `T1`). So it is
 * the empty state's evidence, never the failure's.
 */
function isAbsentRecord(context: Record<string, unknown>): boolean {
  const answer = moduleAnswer(context);

  return some(STATUS_KEYS, key => get(answer, key) === NOT_FOUND);
}

// -----------------------------------------------------------------------------

/**
 * Resolves the module state from the already-evaluated meta booleans. A flag
 * the composable doesn't expose is `undefined` — treated as `false`, never a
 * false positive.
 * @param meta `ModuleDescriptor.snapshot.meta`.
 * @param context `ModuleDescriptor.snapshot.context`, which says what the error
 * flag was raised OVER. Omitted, every raised flag reads as a failure.
 */
export function resolveModuleState(
  meta: Record<string, boolean>,
  context: Record<string, unknown> = {}
): ModuleState {
  // Read before loading: a module the port refused was never booted, so nothing
  // will ever move its other flags and a loading-first order would wait forever
  // on data that is not coming.
  if (meta[MODULE_STATE_META_FLAG.SERVED] === false)
    return ModuleState.UNSERVED;
  if (meta[MODULE_STATE_META_FLAG.LOADING]) return ModuleState.LOADING;
  if (
    meta[MODULE_STATE_META_FLAG.HAS_ERROR] ||
    meta[MODULE_STATE_META_FLAG.HAS_ERRORS]
  )
    return isAbsentRecord(context) ? ModuleState.ABSENT : ModuleState.ERROR;
  return ModuleState.READY;
}

/**
 * {@link resolveModuleState} for a single-record surface, which also reads the
 * module's `isUnavailable`: a record whose `hasError` is scoped to a loaded
 * record (the invoice's payment failure) says its read did not land only
 * there, and a record surface would otherwise wait on it forever.
 * @param meta `ModuleDescriptor.snapshot.meta`.
 * @param context `ModuleDescriptor.snapshot.context`.
 */
export function resolveRecordState(
  meta: Record<string, boolean>,
  context: Record<string, unknown> = {}
): ModuleState {
  const state = resolveModuleState(meta, context);
  if (state !== ModuleState.READY || !meta[MODULE_STATE_META_FLAG.UNAVAILABLE])
    return state;
  return isAbsentRecord(context) ? ModuleState.ABSENT : ModuleState.ERROR;
}

/**
 * The module's own copy of what went wrong. An absent record is WITHHELD: it is
 * not a failure, so no surface may draw it as one — neither in place of its
 * content nor as a verdict beside it.
 * @param context `ModuleDescriptor.snapshot.context`.
 */
export function resolveModuleDetail(context: Record<string, unknown>): unknown {
  return isAbsentRecord(context) ? undefined : moduleAnswer(context);
}
