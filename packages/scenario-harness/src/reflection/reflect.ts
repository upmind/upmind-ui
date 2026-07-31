import { classify } from "../archetype/archetype";
import type { ModuleDescriptor } from "../archetype/archetype.types";
import type { CompositionPort } from "../port/port.types";
import type { ComposableKey } from "../registry/registry";
import type { ScopeActor } from "../world/scope-actor";

/**
 * Reflects one already-booted composable cell into a point-in-time
 * {@link ModuleDescriptor} (design §2). Pure and stateless: pulls exactly one
 * fresh `port.snapshot()` per call and never caches across calls, so a
 * hot-reloaded or async-mutated composable is reflected correctly on the
 * next pull (design §7). Never enumerates `port` itself — only its named
 * `snapshot`/`table` members are read, so a builder-alike port is never
 * side-effectfully instantiated (design §11.1).
 */
export function reflect(
  key: ComposableKey,
  actor: ScopeActor,
  port: CompositionPort
): ModuleDescriptor {
  const snapshot = port.snapshot();
  const archetype = classify(snapshot, port.table !== undefined);

  return { key, actor, archetype, snapshot };
}
