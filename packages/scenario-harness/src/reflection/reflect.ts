import { classify } from "../archetype/archetype";
import { isArray, isPlainObject, transform } from "lodash-es";
import type { ReflectedSnapshot } from "./reflection.types";
import type { ModuleDescriptor } from "../archetype/archetype.types";
import type { CompositionPort } from "../port/port.types";
import type { ComposableKey } from "../registry/registry";
import type { ScopeActor } from "../world/scope-actor";

function deepOmitUndefined<T>(value: T): T {
  if (isArray(value)) {
    return value.map(deepOmitUndefined) as unknown as T;
  }
  if (isPlainObject(value)) {
    return transform(
      value as Record<string, unknown>,
      (result: Record<string, unknown>, entry, key) => {
        if (entry !== undefined) {
          result[key] = deepOmitUndefined(entry);
        }
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
 * side-effectfully instantiated. Omits undefined-valued entries at every
 * depth from `context`/`meta`; other non-JSON values are the adapter's
 * responsibility.
 */
export function reflect(
  key: ComposableKey,
  actor: ScopeActor,
  port: CompositionPort
): ModuleDescriptor {
  const raw = port.snapshot();
  const snapshot: ReflectedSnapshot = {
    actions: raw.actions,
    context: deepOmitUndefined(raw.context),
    meta: deepOmitUndefined(raw.meta)
  };
  const archetype = classify(snapshot, port.table !== undefined);

  return { key, actor, archetype, snapshot };
}
