/**
 * @module scope/scope-parser
 * @description Utilities for parsing scope from URL path segments
 */

import { ScopeActorTypes } from "@upmind-automation/headless";
import { filter, values } from "lodash-es";
import type { ScopeContext } from "@upmind-automation/headless";

export type ParsedScope = {
  valid: boolean;
  actor?: ScopeActorTypes;
  context?: ScopeContext;
  error?: string;
};

/**
 * Parse scope suffix from URL path segment.
 * Expects format: "as/user" or "as/user/for/client/123"
 *
 * @param suffix - The scope suffix string from route param
 * @returns Parsed scope configuration with validation status
 *
 * @example
 * parseScopeSuffix("as/user")
 * // => { valid: true, actor: 'user' }
 *
 * parseScopeSuffix("as/user/for/client/123")
 * // => { valid: true, actor: 'user', context: { type: 'client', id: '123' } }
 *
 * parseScopeSuffix("invalid")
 * // => { valid: false, error: "..." }
 */
export function parseScopeSuffix(suffix: string | undefined): ParsedScope {
  if (!suffix) {
    return { valid: true }; // No scope suffix is valid (defaults to SELF)
  }

  const parts = filter(suffix.split("/"), Boolean);

  // Must start with "as"
  if (parts[0] !== "as") {
    return {
      valid: false,
      error: `Scope suffix must start with 'as/', got: ${suffix}`
    };
  }

  // Extract actor
  const actorStr = parts[1];
  if (!actorStr) {
    return {
      valid: false,
      error: "Missing actor after 'as/'"
    };
  }

  // Validate actor against enum values (NEVER hardcode strings!)
  // Use lodash values() and filter() to get all non-SELF enum values
  const validActors: ScopeActorTypes[] = filter(
    values(ScopeActorTypes),
    v => v !== ScopeActorTypes.SELF
  );

  if (!validActors.includes(actorStr as ScopeActorTypes)) {
    return {
      valid: false,
      error: `Invalid actor '${actorStr}'. Must be one of: ${validActors.join(", ")}`
    };
  }

  const actor = actorStr as ScopeActorTypes;

  // Check for context (optional)
  if (parts.length > 2) {
    if (parts[2] !== "for") {
      return {
        valid: false,
        error: `Expected 'for' after actor, got: ${parts[2]}`
      };
    }

    const contextType = parts[3];
    const contextId = parts[4];

    if (!contextType || !contextId) {
      return {
        valid: false,
        error: "Context requires both type and ID: as/staff/for/:type/:id"
      };
    }

    return {
      valid: true,
      actor,
      context: {
        type: contextType,
        id: contextId
      }
    };
  }

  // Just actor, no context
  return {
    valid: true,
    actor
  };
}

/**
 * Strip scope suffix from a path.
 * Used for redirecting invalid scopes back to base route.
 *
 * @param path - Full route path
 * @returns Path without scope suffix
 *
 * @example
 * stripScopeSuffix("/org/useAuth/as/user")
 * // => "/org/useAuth"
 */
export function stripScopeSuffix(path: string): string {
  return path.replace(/\/as\/[^/]+(?:\/for\/[^/]+\/[^/]+)?$/, "");
}
