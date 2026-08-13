// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part A "Meta Properties Pattern"
 * + Part B "Four-Layer Return Shape" (Meta row). A disagreement between this
 * skeleton, its worked example, and the doctrine is a surfaced finding, never
 * silently resolved toward either.
 *
 * `@precedent` citations point at `client-email/` — the only query-backed scoped
 * module, and the FE-2824 implementation this bundle's anti-cosplay law was
 * written about. Cite it for facts; never copy its shape.
 */

import { computed } from "vue";
import { ScopeActorTypes } from "../scope";
import { isEmpty } from "lodash-es";
import type { ModuleListQuery } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.meta
 * @description Module collection meta factory — computed state flags,
 * `is`/`has`/`can` prefixed, one computed per flag.
 * @doctrine clause 2 — shared-only (armless).
 * @precedent `client-email/useClientEmails.meta.ts`.
 */
export function createModuleMeta(
  actorScope: ScopeActorTypes,
  query: ModuleListQuery
) {
  const hasError = computed(() => !isEmpty(query.error.value));

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const isLoading = computed(
    () => query?.isLoading.value || !query.isFetched.value
  );

  // --- actor-specific meta: none earned yet (clause 2 — fresh modules start
  // armless). When a scope earns one, import its factory and spread it LAST so
  // it wins, exactly as `auth/useAuth.actions.ts:196-201` does:
  //   const actorMeta =
  //     actorScope === ScopeActorTypes.CLIENT
  //       ? createClientModuleMeta(query)
  //       : {};
  // Never a `.base.ts` file (Part B "NO .base Files"); attach a `@decision`
  // block adjacent to the spread the day an arm overrides a shared member.

  return {
    /** True if the list query resolved with an error. */
    hasError,

    /** True if the collection has no items. */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseModuleMeta = ReturnType<typeof createModuleMeta>;
