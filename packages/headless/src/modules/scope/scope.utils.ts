import { computed } from "vue";
import { AccessRoleTypes } from "@upmind-automation/types";
import { useActiveSession, useSessionStore } from "../session-store";
import { ScopeActorTypes } from "./scope.types";
import type {
  ScopeActor,
  ScopeConfig,
  ScopeContext,
  ScopeKey
} from "./scope.types";
import type { ComputedRef } from "vue";
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

/**
 * Derives the target client id from the RESOLVED scope — the one seam every
 * request-issuing services file shares, and the FE-2824 fix for a services
 * layer that hardwires the session's own client for every call and so silently
 * drops `.for('client', id)` retargeting.
 *
 * A `client` context names the client being addressed; with none it falls back
 * to the active session's own client (the self case). It compares the CONTEXT
 * the scope builder resolved, never the actor, so it is not a branch on
 * `ScopeActorTypes.SELF`. A context naming some other entity (an email, an
 * invoice) falls through to the session — such a context names the entity, not
 * its owner.
 *
 * The result is a computed, never a snapshot: an authenticated cold boot
 * carries no `activeUser` until `/self` lands, so a caller that reads the id at
 * mint time addresses `undefined`.
 *
 * @param scopeContext - The resolved scope context, if the scope carries one
 * @returns The client id to address, or `undefined` while none resolves
 */
export function resolveClientId(
  scopeContext?: ScopeContext
): ComputedRef<string | undefined> {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === AccessRoleTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );
}
