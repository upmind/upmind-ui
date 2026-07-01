import { effectScope } from "vue";
import { refreshDevtools } from "./scope.devtools";
import type { ScopeKey } from "./scope.types";
import type { EffectScope } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module scope/registry
 * @description Singleton registry for scoped composable instances.
 */
/**
 * A registry entry containing the composable instance and its detached effect scope.
 */
export type RegistryEntry<T = unknown> = {
  instance: T;
  scope: EffectScope;
};
// --- state
/**
 * Global registry mapping scope keys to composable entries.
 * Each unique scope key gets exactly one entry containing the instance
 * and its detached effect scope for lifecycle management.
 */
const registry = new Map<ScopeKey, RegistryEntry>();
// -----------------------------------------------------------------------------
/**
 * Gets the registry Map for devtools integration.
 * Should only be used by the devtools setup function.
 */
export function getRegistry(): Map<ScopeKey, RegistryEntry> {
  return registry;
}

/**
 * Gets an existing instance or creates a new one using the factory.
 * Guarantees singleton behavior per scope key.
 * Wraps factory execution in a detached effect scope so Vue watchers
 * created during factory execution persist beyond component lifecycles.
 *
 * @param key - The unique scope key
 * @param factory - Factory function to create new instance if not found
 * @returns The existing or newly created instance
 */
export function ensure<T>(key: ScopeKey, factory: () => T): T {
  const existing = registry.get(key);

  if (existing !== undefined) {
    return existing.instance as T;
  }

  const scope = effectScope(true);
  let instance: T;
  scope.run(() => {
    instance = factory();
  });

  registry.set(key, { instance: instance!, scope });

  // Notify DevTools of new entry
  refreshDevtools();

  return instance!;
}

/**
 * Removes a specific instance from the registry.
 * Stops the associated effect scope to prevent orphaned watchers.
 *
 * @param key - The scope key to remove
 */
export function remove(key: ScopeKey): void {
  registry.get(key)?.scope.stop();
  registry.delete(key);
  refreshDevtools();
}

/**
 * Clears all instances from the registry.
 * Stops all associated effect scopes.
 * Primarily for testing.
 */
export function clearAll(): void {
  registry.forEach(entry => entry.scope.stop());
  registry.clear();
  refreshDevtools();
}

/**
 * Returns the current size of the registry.
 * Primarily for testing and debugging.
 */
export function size(): number {
  return registry.size;
}
