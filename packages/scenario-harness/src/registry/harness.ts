import { reflect } from "../reflection/reflect";
import type { ComposableRegistry } from "./registry.types";
import type { ModuleDescriptor } from "../archetype/archetype.types";
import type { CompositionPort } from "../port/port.types";
import type { ScopeActor } from "../world/scope-actor";

/**
 * The registry-typed surface `createHarness` hands back — every member is
 * keyed by `K`, the consumer's own manifest union (item 4/4a).
 */
export interface Harness<K extends string> {
  readonly keys: readonly K[];
  reflect(
    key: K,
    actor: ScopeActor,
    port: CompositionPort
  ): ModuleDescriptor<K>;
}

/**
 * Initialises the harness WITH the consumer's own registry (Dom's ruling,
 * item 4a) — no manifest ships inside this package. `K` is inferred from
 * `registry`'s own type (`keyof typeof registry`, structurally via
 * {@link ComposableRegistry}), so every surface this call returns is typed
 * by that one argument alone.
 */
export function createHarness<K extends string, T = unknown>(
  registry: ComposableRegistry<K, T>
): Harness<K> {
  return {
    keys: Object.keys(registry) as K[],
    reflect: (key, actor, port) => reflect(key, actor, port)
  };
}
