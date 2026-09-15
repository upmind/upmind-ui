import { AccessRoleTypes } from "@upmind-automation/types";
import { flatMap, isArray, isPlainObject, isString } from "lodash-es";
import { useSessionStore } from "../session-store";
import { ScopeActorTypes, ScopeContextPatterns } from "./scope.types";
import type {
  ScopeActor,
  ScopeConfig,
  ScopeKey,
  SelectorContext
} from "./scope.types";
// -----------------------------------------------------------------------------
/**
 * @module scope/utils
 * @description Utility functions for scope key generation, matrix declaration
 * reading and actor resolution.
 */

/**
 * Declares a SELECTOR context member — `.for(type)`, no id. The type IS the
 * whole answer (which catalogue, which edition), so there is no entity to name.
 * A bare string cell declares a RETARGET member and needs no helper.
 *
 * @param type - The context type this member declares
 * @returns The selector declaration a matrix cell carries
 */
export function selector<const TContextType extends string>(
  type: TContextType
): SelectorContext<TContextType> {
  return { pattern: ScopeContextPatterns.SELECTOR, type };
}

/**
 * Every declaration a matrix cell holds, in declaration order. A bare string is
 * a RETARGET member; a `selector()` wrapper is a SELECTOR member; `null as never`
 * is an actor the module does not serve and yields none.
 *
 * This is the ONE reading of a matrix cell — every consumer that needs to know
 * what a cell declares reads through here rather than inspecting the value.
 *
 * @param cell - The matrix cell value for one actor
 * @returns One entry per declared member
 */
export function resolveContextDeclarations(
  cell: unknown
): { type: string; pattern: ScopeContextPatterns }[] {
  if (isArray(cell)) return flatMap(cell, resolveContextDeclarations);

  if (isString(cell)) {
    return cell ? [{ type: cell, pattern: ScopeContextPatterns.RETARGET }] : [];
  }

  if (
    isPlainObject(cell) &&
    (cell as SelectorContext).pattern === ScopeContextPatterns.SELECTOR &&
    isString((cell as SelectorContext).type)
  ) {
    return [
      {
        type: (cell as SelectorContext).type,
        pattern: ScopeContextPatterns.SELECTOR
      }
    ];
  }

  return [];
}

/**
 * The first declaration a matrix cell holds — the singular convenience over
 * `resolveContextDeclarations`, kept for callers that read one member.
 *
 * @param cell - The matrix cell value for one actor
 * @returns The first declared member, or null when the cell declares none
 */
export function resolveContextDeclaration(
  cell: unknown
): { type: string; pattern: ScopeContextPatterns } | null {
  return resolveContextDeclarations(cell)[0] ?? null;
}

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
 *
 * @example
 * generateScopeKey("client-email-history", { actor: "client", id: "abc" })
 * // Returns: "client-email-history:client:id:abc"
 *
 * @example
 * generateScopeKey("custom-fields", { actor: "client", context: { type: "invoice" } })
 * // Returns: "custom-fields:client:invoice"
 */
let freshInstanceCount = 0;

export function generateScopeKey(name: string, config: ScopeConfig): ScopeKey {
  const parts: string[] = [name, String(config.actor)];

  // A SELECTOR context contributes ONE unprefixed segment, a RETARGET context
  // TWO, and every other optional segment is prefixed (`id:`, `brand:`,
  // `fresh:`) — so a selector key can never collide with any other shape.
  if (config.context) {
    parts.push(config.context.type);

    if (config.context.id !== undefined) {
      parts.push(config.context.id);
    }
  }

  // The record id is what makes a single-record read keyed PER RECORD: without
  // it, every id served the one cached instance and the second row opened would
  // show the first row's email. Prefixed so it can never collide with a context
  // segment, and appended only when set, so a composable that never calls
  // `.withId()` keeps the key it had.
  if (config.id) {
    parts.push(`id:${config.id}`);
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
