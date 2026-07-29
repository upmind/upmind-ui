// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Four-Layer Return Shape"
 * (Context row) + "TanStack Query variant". A disagreement between this
 * skeleton, its worked example, and the doctrine is a surfaced finding, never
 * silently resolved toward either.
 *
 * `@precedent` citations point at `client-email/` — the only query-backed scoped
 * module, and the FE-2824 implementation this bundle's anti-cosplay law was
 * written about. Cite it for facts; never copy its shape.
 */

import { computed } from "vue";
import { ScopeActorTypes } from "../scope";
import { useCollection } from "../../utils";
import { castArray } from "lodash-es";
import type { ModuleItem, ModuleListQuery } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.context
 * @description Module collection context factory — the reactive list and its
 * lookup helpers. Reads directly from the shared TanStack query minted once
 * per scope; data is mapped in `module.services.ts` via `select`, never here
 * (`code-composables.md` Part B "TanStack Query variant").
 *
 * @doctrine clause 2 — shared-only (armless).
 * @precedent `client-email/useClientEmails.context.ts`.
 */

/**
 * The base reference-data set, at module scope and exported so an arm's
 * `lookups` override SPREADS it rather than re-declaring its entries — the same
 * reason `module.services.ts` exports `queryKey`. Re-declaring is how the two
 * copies silently drift the day a base entry changes.
 */
export const baseLookups = [{ key: "currencies" }, { key: "languages" }];

export function createModuleContext(
  actorScope: ScopeActorTypes,
  query: ModuleListQuery
) {
  const { findOne, getOne } = useCollection<ModuleItem>(query.data);

  const data = computed(() => castArray(query.data.value ?? []));

  /**
   * Base reference data every actor needs. Canonical A vs A+B override
   * candidate: shared returns A (`baseLookups`); an arm spreads that same const
   * and appends its own, returning A + B, and its `lookups` is spread LAST.
   * See `useModule.context.{actor}.ts` for the arm-side override shape.
   */
  const lookups = computed(() => baseLookups);

  // --- actor-specific context: none earned yet (clause 2 — fresh modules start
  // armless). When a scope earns one, import its factory and spread it LAST so
  // it wins, exactly as `auth/useAuth.actions.ts:196-201` does:
  //   const actorContext =
  //     actorScope === ScopeActorTypes.CLIENT
  //       ? createClientModuleContext(query)
  //       : {};
  // Never a `.base.ts` file (Part B "NO .base Files"); attach a `@decision`
  // block adjacent to the spread the day an arm overrides a shared member.

  return {
    /** The reactive list (always an array). */
    data,

    /** The list query's current error state, if any. */
    error: query.error,

    /** Finds a single item by a partial mapping. */
    findOne,

    /** Finds a single item by id. */
    getOne,

    /** Base reference data every actor needs (see JSDoc — override candidate). */
    lookups,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorContext
  };
}

// Type export for consumers
export type UseModuleContext = ReturnType<typeof createModuleContext>;
