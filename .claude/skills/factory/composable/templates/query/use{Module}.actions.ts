// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Actor-Specific
 * Sub-Composables" / "Where Shared Code Lives — NO .base Files" / "TanStack
 * Query variant" + `code-composables.companion.md` "Variance law" clauses
 * 2/3/5. A disagreement between this skeleton, its worked example, and the
 * doctrine is a surfaced finding, never silently resolved toward either.
 *
 * `@precedent` citations point at `client-email/` — the only query-backed scoped
 * module, and the FE-2824 implementation this bundle's anti-cosplay law was
 * written about. Cite it for facts; never copy its shape.
 */

import { resetQueryByKey } from "../query";
import { remove } from "../scope";
import { ScopeActorTypes } from "../scope";
import type { FilterModel, SortModel } from "./module.types";
import { useActiveSession } from "../session-store";
import { useDataLayer } from "../system-analytics";
import { queryKey } from "./module.services";
import type {
  ModuleListQuery,
  ModuleModel,
  ModuleServices
} from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.actions
 * @description Module collection actions factory (mutations, refresh,
 * lifecycle). Query-backed — `destroy()` removes the registry entry, there is
 * no service to stop (`code-composables.md` Part B "TanStack Query variant").
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useModule.actions.{actor}.ts` file exists yet.
 * @precedent `client-email/useClientEmails.actions.ts` (armless — no arm
 * file anywhere in that module's actions layer). That file imports `remove as
 * removeFromRegistry` because IT ALSO defines its own `remove(id)` collection
 * mutation and the alias avoids shadowing; this skeleton defines no such
 * mutation, so the bare `remove` import (matching `templates/machine/`'s
 * equivalent) is correct here — copying the alias un-examined would have been
 * cargo-culting a collision that doesn't exist in this file.
 */
export function createModuleActions(
  actorScope: ScopeActorTypes,
  service: ModuleServices,
  query: ModuleListQuery,
  scopeKey: string
) {
  function destroy(): void {
    remove(scopeKey);
  }

  /**
   * Domain action worked example — the canonical A vs A+B override candidate.
   * Shared does A: call the service, then push the tracking event every actor
   * needs. An arm spreads its own `login` LAST to do A + B — see
   * `useModule.actions.{actor}.ts`.
   */
  function login(credentials: ModuleModel): Promise<unknown> {
    return service.login(credentials).then(result => {
      // @worked-example `basket/basket.machine.ts:768-772` — same
      // `useDataLayer().dataLayer({ event }).with*().push()` chain.
      useDataLayer().dataLayer({ event: "login" }).withUser().push();

      return result;
    });
  }

  const { isReady: ensureAuth } = useActiveSession().useActions();
  const { isAuthenticated } = useActiveSession().useMeta();

  /**
   * @precedent `client-phone/useClientPhones.ts:42-55` — the session gate is
   * load-bearing: `{module}.services.ts`'s `enabled:` disables the query until
   * authenticated, so a bare `refetch()` resolves without fetching and would
   * report ready over an empty list.
   */
  async function isReady(): Promise<boolean> {
    if (isAuthenticated.value)
      return new Promise(resolve => {
        const interval = setInterval(() => {
          if (query.isFetched.value) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
      });
    return ensureAuth()
      .then(ok => (ok ? query.refetch().then(() => true) : false))
      .catch(() => false);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules start
  // armless). When a scope earns one, import its factory and spread it LAST so
  // it wins, exactly as `auth/useAuth.actions.ts:196-201` does:
  //   const actorActions =
  //     actorScope === ScopeActorTypes.CLIENT
  //       ? createClientModuleActions(service)
  //       : {};
  // Never a `.base.ts` file (Part B "NO .base Files"); attach a `@decision`
  // block adjacent to the spread the day an arm overrides a shared member.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Resolves once the collection is ready to read. */
    isReady,

    /** Domain action — the canonical override candidate (see JSDoc). */
    login,

    /**
     * Applies a FILTER intent — merges the given filter model into the ONE
     * query model's `filters` branch; `sort` and `pagination` are untouched by
     * construction.
     */
    filterBy: (intent: FilterModel): void => query.setCriteria({ filters: intent }),

    /** Fetches the next page. */
    nextPage: async (): Promise<void> => query.fetchNextPage(),

    /** Fetches the previous page. */
    prevPage: async (): Promise<void> => query.fetchPreviousPage(),

    /** Refetches the list from the server. */
    refresh: query.refetch,

    /**
     * Applies a criteria INTENT — merges the given `filters` / `sort` /
     * `pagination` branches into the ONE query model; branches left out are
     * untouched. This is the door a consumer calls to set the page size:
     * `setCriteria({ pagination: { limit } })`, then drives `nextPage()`.
     */
    setCriteria: query.setCriteria,

    /**
     * Applies a SORT intent — merges into the query model's `sort` branch;
     * `filters` and `pagination` are untouched. The intent is the module's
     * sortable-properties ENUM, never a raw string.
     */
    sortBy: (intent: SortModel): void => query.setCriteria({ sort: intent }),

    /**
     * Drops the module's cache entries so the next read fetches from scratch —
     * the redial the labs force handle needs (`useForcedState`: "the preset is
     * only visible because the page asks again"). Not `refresh`: a refetch
     * keeps the stale rows on screen; a removed entry redraws from nothing.
     */
    reset: resetQueryByKey(queryKey)

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorActions
  };
}

export type UseModuleActions = ReturnType<typeof createModuleActions>;
