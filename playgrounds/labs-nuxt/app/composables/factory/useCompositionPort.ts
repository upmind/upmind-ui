// -----------------------------------------------------------------------------
/**
 * @module factory/useCompositionPort
 * @description Generic reflection of a live 4-layer scoped composable cell
 * into the scenario-harness `CompositionPort` seam (design.md FE-2977
 * §Block A) — the only framework-aware part of the flow factory. Reactivity
 * stays here; the core (`reflect`/`classify`) receives plain data only.
 */

import { computed, toRaw, unref } from "vue";
import { isArray, isPlainObject, mapValues, transform } from "lodash-es";
import type {
  LiveCompositionCell,
  LiveMeta,
  UseCompositionPortOptions
} from "./useCompositionPort.types";
import type {
  CompositionPort,
  ReflectedSnapshot
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

function normalize(value: unknown): unknown {
  return toRaw(unref(value));
}

// Mirrors `reflect()`'s own `isRevisitedRef`
// (packages/scenario-harness/src/reflection/reflect.ts) — same stack-safety
// contract, applied one layer upstream of it.
function isRevisitedRef(value: unknown, seen: WeakSet<object>): boolean {
  if (typeof value !== "object" || value === null) return false;
  if (seen.has(value)) return true;
  seen.add(value);
  return false;
}

/**
 * Unwraps `ref`/`computed`/`reactive` at every depth into plain, JSON-safe
 * data, omitting undefined-valued entries (including array holes) — mirrors
 * `reflect()`'s own `deepOmitUndefined`, so `port.snapshot()` is already
 * plain by the time it reaches the core.
 */
function deepUnref(
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): unknown {
  const raw = normalize(value);

  if (isArray(raw)) {
    const result: unknown[] = [];
    for (const entry of raw) {
      const normalized = normalize(entry);
      if (normalized === undefined || isRevisitedRef(normalized, seen))
        continue;
      result.push(deepUnref(normalized, seen));
    }
    return result;
  }

  if (isPlainObject(raw)) {
    return transform(
      raw as Record<string, unknown>,
      (result: Record<string, unknown>, entry, key) => {
        const normalized = normalize(entry);
        if (normalized === undefined || isRevisitedRef(normalized, seen))
          return;
        // `Object.defineProperty`, never `result[key] = …` — mirrors
        // `reflect()`'s own `__proto__`-safety (see reflect.ts).
        Object.defineProperty(result, key, {
          value: deepUnref(normalized, seen),
          enumerable: true,
          writable: true,
          configurable: true
        });
      },
      {}
    );
  }

  return raw;
}

function assertSyncBoolean(flag: string, value: unknown): boolean {
  if (typeof value === "boolean") return value;

  throw new Error(
    `useCompositionPort: meta flag "${flag}" did not deref to a sync boolean ` +
      `(ADR-027 Am.11) — got ${typeof value}. An async-derived meta flag must ` +
      "resolve to a sync boolean upstream in the composable; the adapter " +
      "never papers over it."
  );
}

function evalMeta(meta: LiveMeta): Record<string, boolean> {
  return mapValues(meta, (flagValue, flag) =>
    assertSyncBoolean(flag, unref(flagValue))
  );
}

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
  const snapshot = computed<ReflectedSnapshot>(() => ({
    actions: Object.keys(cell.useActions()),
    context: deepUnref(cell.useContext()) as Record<string, unknown>,
    meta: evalMeta(cell.useMeta())
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
