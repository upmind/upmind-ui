// -----------------------------------------------------------------------------
/**
 * @module factory/useCompositionPort
 * @description Generic reflection of a live 4-layer scoped composable cell
 * into the scenario-harness `CompositionPort` seam (design.md FE-2977
 * §Block A) — the only framework-aware part of the flow factory. Reactivity
 * stays here; the core (`reflect`/`classify`) receives plain data only.
 */

import { computed, unref } from "vue";
import { isFunction, keys, mapValues, omitBy } from "lodash-es";
import type {
  LiveCompositionCell,
  UseCompositionPortOptions
} from "./useCompositionPort.types";
import type {
  CompositionPort,
  ReflectedSnapshot
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * Reflects a live, already-scoped 4-layer composable cell (`useActions()` /
 * `useContext()` / `useMeta()`) into a `CompositionPort`. Every pull rebuilds
 * inside a `computed` — the Inspector pull-snapshot pattern
 * (`app/components/inspector/useInspector.ts:96-98`) — so each read re-derives
 * from the cell's current reactive state rather than a cached value.
 * `getMeta()` reads the same computed's `meta` slice, so it can never
 * diverge from `snapshot().meta`.
 *
 * @param cell The already-scoped composable cell (e.g. `useAuth().as(actor)`).
 * @param options Optional wiring — `table` for a List module that owns table state.
 */
export function useCompositionPort(
  cell: LiveCompositionCell,
  options: UseCompositionPortOptions = {}
): CompositionPort {
  // One `unref` pass per layer, never a deep walk: the four-layer contract puts
  // refs at the TOP of a layer over plain values — confirmed against the live
  // client-email cell, which holds no ref and no cycle below it. Only the
  // function omission survives that: a context legitimately publishes callables
  // (`default`/`findOne`/`getOne`), the non-JSON values `reflect()` calls the
  // adapter's responsibility. `undefined` is left to `reflect()`'s own deep omit.
  const snapshot = computed<ReflectedSnapshot>(() => ({
    actions: keys(cell.useActions()),
    context: omitBy(mapValues(cell.useContext(), unref), isFunction),
    meta: mapValues(cell.useMeta(), flag => !!unref(flag))
  }));

  return {
    /** The live `useActions()` return, re-read on every access — never the builder itself. */
    get actions(): CompositionPort["actions"] {
      // Each real action types its own input; the port's contract is ONE opaque
      // input invoked by name (`world.fire(actionId, input?)`). Parameters are
      // contravariant, so no concretely-typed action map is assignable to it —
      // widening to the seam's contract is this adapter's job, done once here.
      return cell.useActions() as CompositionPort["actions"];
    },
    /** Reads `snapshot().meta` — the same computed slice, never a second evaluation. */
    getMeta: () => snapshot.value.meta,
    /** One fresh, plain-data pull per call — never cached across calls. */
    snapshot: () => snapshot.value,
    /** Present iff the caller wired a table channel — never fabricated here. */
    table: options.table
  };
}
