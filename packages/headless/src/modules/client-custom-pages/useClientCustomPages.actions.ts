import { nextTick, watch } from "vue";
import {
  invalidateQueryByKey,
  RequestSortDirection,
  SortDirection
} from "../query";
import { remove as removeFromRegistry } from "../scope";
import { assign } from "lodash-es";
import type {
  CustomPage,
  CustomPagesListQuery,
  CustomPagesFilters,
  CustomPagesSortableProperties,
  ClientCustomPagesServices
} from "./client-custom-pages.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/useClientCustomPages.actions
 * @description Collection actions — list controls and lifecycle. Read-only
 * (parity O24: `reloadData` is the oracle's ONLY method): no create/update/
 * delete. Query-backed: `destroy()` removes the registry entry, because there
 * is no service to stop.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useClientCustomPages.actions.{actor}.ts` file
 * exists.
 */
export function createClientCustomPagesActions(
  _actorScope: ScopeActorTypes,
  service: ClientCustomPagesServices,
  query: CustomPagesListQuery,
  scopeKey: string
) {
  /**
   * Resolves once the list query has completed its first fetch, deferred one
   * reactive flush (`nextTick()`): a filter/sort mutation lands on the
   * criteria ref synchronously, but the TanStack observer only switches onto
   * the new key on Vue's next flush — reading `isFetched` before that sees
   * the PREVIOUS key's already-settled state.
   */
  async function whenFetched(): Promise<boolean> {
    await nextTick();

    if (query.isFetched.value) return true;

    return new Promise<boolean>(resolve => {
      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        stop();
        resolve(true);
      });
    });
  }

  /**
   * Resolves once the collection is ready to read. Always settles — the list
   * needs no session (AC9), so there is nothing to gate on beyond the fetch
   * itself.
   */
  async function isReady(): Promise<boolean> {
    return whenFetched();
  }

  /** Forces a re-read of the list from the server. */
  async function refresh(): Promise<void> {
    await query.refetch();
  }

  /**
   * Narrows to the pages the nav injects (D4, parity O25) — an absent value
   * clears the filter. Reaches the wire ONLY through the declared query
   * schema (`useQuerySchema()`'s `filters` branch); this is the single write
   * verb, never a raw `filter[...]` key spelled beside `useQuery`.
   *
   * @decision
   * what:     Merges over `query.criteria.value.filters` before writing,
   *           rather than passing `{ show_on_menu: {...} }` alone.
   * why:      `setCriteria` (`useQueryCriteria.ts` `set()`) replaces the
   *           WHOLE `filters` branch it is given — a bare `{ show_on_menu }`
   *           write silently drops an already-set `slug` filter (W1),
   *           contradicting this module's own documented contract
   *           (`client-custom-pages.types.ts` `CustomPagesFilters` — "an
   *           absent value clears THAT key", singular).
   * rejected: A whole-model `filterBy(intent)` verb like the email-history
   *           sibling's. Rejected — this module already ships two named,
   *           independently-typed filter verbs (`showOnMenu`/`slug`) as its
   *           public contract; merging locally preserves that shape without
   *           a breaking API change mid-repair.
   */
  function showOnMenu(value?: CustomPage["showOnMenu"]): void {
    query.setCriteria({
      filters: assign({}, query.criteria.value.filters, {
        show_on_menu: { eq: value }
      })
    });
  }

  /**
   * Narrows the list to one page by its route slug (operator ruling C2 —
   * ships alongside the single-read door, neither drops the other). Merges
   * over the current `filters` branch for the same reason as `showOnMenu`
   * above (W1).
   */
  function slug(value?: CustomPage["slug"]): void {
    query.setCriteria({
      filters: assign({}, query.criteria.value.filters, {
        slug: { eq: value }
      })
    });
  }

  const filters: CustomPagesFilters = { showOnMenu, slug };

  /**
   * Sorts the list by the given property and direction — a thin typed
   * adapter over `setCriteria`'s `sort` branch, so a caller never spells a
   * raw sort tuple. An absent property clears the sort back to the oracle's
   * own insertion order (D4/O33: no default sort entry to refill to).
   */
  function sort(
    property?: CustomPagesSortableProperties,
    direction: RequestSortDirection = RequestSortDirection.ASC
  ): void {
    if (!property) {
      query.setCriteria({ sort: [] });
      return;
    }

    query.setCriteria({
      sort: [
        {
          field: property,
          dir:
            direction === RequestSortDirection.DESC
              ? SortDirection.DESC
              : SortDirection.ASC
        }
      ]
    });
  }

  /** Destroys this scoped instance — removes it from the registry. */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useClientCustomPages.actions.{actor}.ts` and spread it LAST so it wins.
  // Never a `.base.ts` file; attach a `@decision` block adjacent to the
  // spread the day an arm overrides a shared member.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Filters for the list query (AC2). */
    filters,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read. Always settles. */
    isReady,

    /** Fetches the next page. */
    nextPage: query.fetchNextPage,

    /** Fetches the previous page. */
    prevPage: query.fetchPreviousPage,

    /** Refetches the list from the server (AC8/O12). */
    refresh,

    /** Sorts the list by the given property and direction. */
    sort

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientCustomPagesActions = ReturnType<
  typeof createClientCustomPagesActions
>;
