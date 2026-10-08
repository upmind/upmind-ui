// -----------------------------------------------------------------------------
/**
 * @module scenarios/declared-params
 * @description The ONE scanner for a declaration's `params` literal
 * (`params: ["oid"]`, `params: ["id([0-9a-fA-F-]{36})?"]`) and its `page`
 * literal (`page: "StatsPage.vue"`). The registrar and its route spec both read
 * the source with them, so they cannot disagree.
 */

import { map } from "lodash-es";

// -----------------------------------------------------------------------------

// The array body is read quote by quote, so a `]` inside a patterned param
// (`[0-9a-fA-F-]`) does not end it.
const PARAMS_ARRAY =
  /params\s*:\s*\[((?:\s*(["'])(?:(?!\2)[^\\])*\2\s*,?)*)\s*\]/;
const PAGE_LITERAL = /\bpage\s*:\s*(["'])([^"'\\]+\.vue)\1/;
const QUOTED = /(["'])((?:(?!\1)[^\\])*)\1/g;

/** The params a declaration's source declares, or `[]` when it declares none. */
export function scanDeclaredParams(source: string): string[] {
  const match = source.match(PARAMS_ARRAY);
  if (!match) return [];
  return map([...match[1]!.matchAll(QUOTED)], hit => hit[2]!);
}

/** The page file a declaration names for itself, or `undefined` when the shared playground draws it. */
export function scanDeclaredPage(source: string): string | undefined {
  return source.match(PAGE_LITERAL)?.[2];
}
