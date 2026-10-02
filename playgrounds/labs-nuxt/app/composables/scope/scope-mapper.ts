/**
 * @module scope/scope-parser
 * @description Utilities for parsing scope from URL path segments
 */

import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  compact,
  dropRight,
  filter,
  includes,
  isArray,
  join,
  size,
  split,
  values
} from "lodash-es";
import type { ScopeContext } from "@upmind-automation/headless";

export type ParsedScope = {
  valid: boolean;
  actor?: ScopeActorTypes;
  context?: ScopeContext;
  error?: string;
};

/**
 * Parse scope suffix from URL path segment.
 *
 * The grammar is `[as/:actor][/for/:type[/:id]]` — both halves optional, in
 * that order. No `as/` segment means SELF (whoever is active), so a context can
 * be named on its own: `for/invoice` scopes the active actor to the invoice
 * catalogue exactly as `as/client/for/invoice` scopes a named client to it.
 *
 * @param suffix - The scope suffix string from route param
 * @returns Parsed scope configuration with validation status
 *
 * @example
 * parseScopeSuffix("as/staff")
 * // => { valid: true, actor: 'staff' }
 *
 * parseScopeSuffix("as/staff/for/client/123")
 * // => { valid: true, actor: 'staff', context: { type: 'client', id: '123' } }
 *
 * parseScopeSuffix("for/invoice")
 * // => { valid: true, context: { type: 'invoice' } }   (actor: SELF)
 *
 * parseScopeSuffix("invalid")
 * // => { valid: false, error: "..." }
 */
export function parseScopeSuffix(suffix: string | undefined): ParsedScope {
  if (!suffix) {
    return { valid: true }; // No scope suffix is valid (defaults to SELF)
  }

  const parts = filter(suffix.split("/"), Boolean);
  let cursor = 0;
  let actor: ScopeActorTypes | undefined;

  // --- Optional actor: `as/:actor`
  if (parts[cursor] === "as") {
    const actorStr = parts[cursor + 1];
    if (!actorStr) {
      return {
        valid: false,
        error: "Missing actor after 'as/'"
      };
    }

    // Validate actor against enum values (NEVER hardcode strings!)
    // SELF is never written to a url — its absence IS self.
    const validActors: ScopeActorTypes[] = filter(
      values(ScopeActorTypes),
      v => v !== ScopeActorTypes.SELF
    );

    if (!includes(validActors, actorStr as ScopeActorTypes)) {
      return {
        valid: false,
        error: `Invalid actor '${actorStr}'. Must be one of: ${validActors.join(", ")}`
      };
    }

    actor = actorStr as ScopeActorTypes;
    cursor += 2;
  }

  // Actor only, or nothing left to read.
  if (cursor >= parts.length) {
    return actor ? { valid: true, actor } : { valid: true };
  }

  // --- Optional context: `for/:type[/:id]`
  if (parts[cursor] !== "for") {
    return {
      valid: false,
      error: actor
        ? `Expected 'for' after actor, got: ${parts[cursor]}`
        : `Scope suffix must start with 'as/' or 'for/', got: ${suffix}`
    };
  }

  const contextType = parts[cursor + 1];
  const contextId = parts[cursor + 2];

  // A SELECTOR context is the type alone, so only a missing TYPE is invalid.
  if (!contextType) {
    return {
      valid: false,
      error: "Context requires a type: [as/:actor/]for/:type[/:id]"
    };
  }

  const context: ScopeContext = contextId
    ? { type: contextType, id: contextId }
    : { type: contextType };

  return actor ? { valid: true, actor, context } : { valid: true, context };
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
 *
 * stripScopeSuffix("/useClientCustomFields/for/invoice")
 * // => "/useClientCustomFields"
 */
export function stripScopeSuffix(path: string): string {
  return path.replace(
    /\/(?:as\/[^/]+(?:\/for\/[^/]+(?:\/[^/]+)?)?|for\/[^/]+(?:\/[^/]+)?)$/,
    ""
  );
}

/**
 * Strip a route's WHOLE `scopeSuffix` catch-all from its path.
 * Used for redirecting an invalid scope back to base route: an invalid suffix
 * need not look like a scope, so `stripScopeSuffix` can leave the path as it
 * is and the redirect lands on itself. Counts segments, so a trailing slash or
 * an encoded path does not matter.
 *
 * @param path - Full route path
 * @param suffix - The route's `scopeSuffix` param, as the router gives it
 * @returns Path without the catch-all segments
 *
 * @example
 * stripScopeCatchAll("/useContractProduct/78985742/as/client/", ["78985742", "as", "client", ""])
 * // => "/useContractProduct"
 */
export function stripScopeCatchAll(
  path: string,
  suffix: string | string[]
): string {
  const suffixSegments = compact(isArray(suffix) ? suffix : split(suffix, "/"));
  const pathSegments = compact(split(path, "/"));
  return `/${join(dropRight(pathSegments, size(suffixSegments)), "/")}`;
}
