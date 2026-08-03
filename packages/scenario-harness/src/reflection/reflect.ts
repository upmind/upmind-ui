import { classify } from "../archetype/archetype";
import { isArray, isPlainObject, transform } from "lodash-es";
import type { ReflectedSnapshot } from "./reflection.types";
import type { ModuleDescriptor } from "../archetype/archetype.types";
import type { CompositionPort } from "../port/port.types";
import type { ScopeActor } from "../world/scope-actor";

// `seen` guards against a self-referential (or repeatedly-aliased) object
// graph: the second time the same reference is reached, that occurrence is
// dropped rather than re-descended — stack-safe, never throws.
function isRevisitedRef(entry: unknown, seen: WeakSet<object>): boolean {
  if (typeof entry !== "object" || entry === null) return false;
  if (seen.has(entry)) return true;
  seen.add(entry);
  return false;
}

function deepOmitUndefined<T>(
  value: T,
  seen: WeakSet<object> = new WeakSet()
): T {
  if (isArray(value)) {
    const result: unknown[] = [];
    for (const entry of value) {
      if (entry === undefined || isRevisitedRef(entry, seen)) continue;
      result.push(deepOmitUndefined(entry, seen));
    }
    return result as unknown as T;
  }
  if (isPlainObject(value)) {
    return transform(
      value as Record<string, unknown>,
      (result: Record<string, unknown>, entry, key) => {
        if (entry === undefined || isRevisitedRef(entry, seen)) return;
        // `Object.defineProperty`, never `result[key] = …`: an own
        // `__proto__` key in `value` becomes a normal own data property on
        // `result` instead of tripping `Object.prototype`'s `__proto__`
        // setter and replacing `result`'s own prototype.
        Object.defineProperty(result, key, {
          value: deepOmitUndefined(entry, seen),
          enumerable: true,
          writable: true,
          configurable: true
        });
      },
      {}
    ) as unknown as T;
  }
  return value;
}

/**
 * Reflects one already-booted composable cell into a point-in-time
 * {@link ModuleDescriptor}. Pure and stateless: pulls exactly one fresh
 * `port.snapshot()` per call and never caches across calls, so a
 * hot-reloaded or async-mutated composable is reflected correctly on the
 * next pull. Never enumerates `port` itself — only its named `snapshot`/
 * `table` members are read, so a builder-alike port is never
 * side-effectfully instantiated. Omits undefined-valued entries from
 * `context`/`meta` at every depth, including array elements (never a `null`
 * hole); `actions` is copied, never aliased to the port's own array; other
 * non-JSON values are the adapter's responsibility.
 */
export function reflect<K extends string>(
  key: K,
  actor: ScopeActor,
  port: CompositionPort
): ModuleDescriptor<K> {
  const raw = port.snapshot();
  const snapshot: ReflectedSnapshot = {
    actions: [...raw.actions],
    context: deepOmitUndefined(raw.context),
    meta: deepOmitUndefined(raw.meta)
  };
  const archetype = classify(snapshot, port.table !== undefined);

  return { key, actor, archetype, snapshot };
}
