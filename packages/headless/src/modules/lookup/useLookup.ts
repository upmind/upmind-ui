import { computed } from "vue";
import { set } from "lodash-es";
import type { ListQuery } from "../query/query.types";
// -----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
/**
 * @module lookup/useLookup
 * @description A THIN, endpoint-agnostic adapter over a criteria-driven
 * `listInfinite()` query — it reinvents nothing. Search, pagination ("load
 * more"), caching, dedup and loading-state all belong to the platform query
 * layer (`useQuery().listInfinite({ criteria })`, see `modules/query`); this
 * only maps that handle to the small surface a lookup CONTROL drives.
 *
 * The caller passes the SERVICE — a `listInfinite` query minted over its own
 * endpoint with a `criteria` schema declaring the searchable `like` filter and
 * `pagination`. The same composable looks up ANY module's data; it rides in a
 * control's schema `options.lookup` so `LookupRenderer` can drive it, exactly
 * as the manage renderer receives its list/mutate composables.
 */

/** One selectable option — the shape the control renders (the query's `select` output). */
export type LookupItem = {
  value: string;
  label: string;
  description?: string;
};

export type UseLookupOptions = {
  /**
   * The criteria model path of the search filter's `like` operator — the branch
   * the control's term writes. Defaults to `filters.search.like`.
   */
  searchScope?: string;
};

// ----------------------------------------------------------------------------

/**
 * @param query a criteria-driven `listInfinite()` handle whose `select` already
 *   maps rows to {@link LookupItem}. Its `data` accumulates across pages.
 * @param options the search filter's model path.
 */
export function useLookup(
  query: ListQuery<unknown, LookupItem[]>,
  options: UseLookupOptions = {}
) {
  const searchScope = options.searchScope ?? "filters.search.like";

  return {
    /** The accumulated options across every loaded page — the query's own data. */
    items: query.data,

    /**
     * The total number of matches the server reports for the current term.
     * Read off the pagination descriptor (`total` across all pages), not the
     * bare `query.total` — a `select` that reshapes the rows can strip the
     * envelope's own `total`, but the pagination descriptor keeps it.
     */
    total: computed(() => query.pagination.value.total),

    /** Load-state meta the control reads — all derived from the query handle. */
    meta: computed(() => ({
      isLoading: query.isFetching.value,
      hasMore: query.meta.value.hasNextPage,
      hasErrors: query.isError.value || query.criteriaError.value !== undefined,
      isEmpty: !query.isFetching.value && (query.data.value?.length ?? 0) === 0
    })),

    /** ajv's verdict on a rejected criteria write, read never raised. */
    error: query.criteriaError,

    /**
     * Set the search term — one MERGED criteria write of the `like` branch. A
     * result-set change returns the cursor to page 1 (the criteria seam's own
     * law); `null` clears the filter.
     */
    search: (term: string) =>
      query.setCriteria(set({}, searchScope, term || null)),

    /** Append the next page — the "Load more" control (the infinite query's own). */
    loadMore: () => query.fetchNextPage(),

    /** Discard and re-fetch the current combination. */
    refresh: () => query.resetQuery()
  };
}

/** The composable's public return, for a consumer's own typing. */
export type UseLookup = ReturnType<typeof useLookup>;
