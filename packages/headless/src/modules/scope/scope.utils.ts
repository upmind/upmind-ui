import { AccessRoleTypes } from "@upmind-automation/types";
import { useSessionStore } from "../session-store";
import { ScopeActorTypes } from "./scope.types";
import type { ScopeActor, ScopeConfig, ScopeKey } from "./scope.types";
// -----------------------------------------------------------------------------
/**
 * @module scope/utils
 * @description Utility functions for scope key generation and actor resolution.
 */

/**
 * Generates a unique scope key from a composable name and scope config.
 * Used for singleton instance lookup in the registry.
 *
 * @param name - The composable name (e.g., "basket", "invoices")
 * @param config - The scope configuration
 * @returns A unique key string
 *
 * @example
 * generateScopeKey("basket", { actor: "staff", context: { type: "client", id: "123" } })
 * // Returns: "basket:staff:client:123"
 */
let freshInstanceCount = 0;

export function generateScopeKey(name: string, config: ScopeConfig): ScopeKey {
  const parts: string[] = [name, String(config.actor)];

  if (config.context) {
    parts.push(config.context.type, config.context.id);
  }

  if (config.brandId) {
    parts.push(`brand:${config.brandId}`);
  }

  if (config.newSession) {
    // Unique per call: a fresh instance must NEVER be served from the registry
    // cache — a remounting consumer would otherwise adopt the previous fresh
    // instance (possibly already authenticated) just before its unmount
    // destroys it.
    parts.push(`fresh:${++freshInstanceCount}`);
  }

  return parts.join(":");
}

/**
 * Resolves ScopeActorTypes.SELF to the actual actor type from the current session.
 * Returns the active actor from session store, or GUEST if no session.
 *
 * @param actor - The actor to resolve
 * @returns The resolved actor type (never SELF)
 */
export function resolveSelfActor(
  actor: ScopeActor
): Exclude<ScopeActor, `${ScopeActorTypes.SELF}`> {
  if (actor !== ScopeActorTypes.SELF) {
    return actor;
  }

  const session = useSessionStore();
  const { activeActor } = session.useContext();

  return activeActor.value ?? AccessRoleTypes.GUEST;
}
