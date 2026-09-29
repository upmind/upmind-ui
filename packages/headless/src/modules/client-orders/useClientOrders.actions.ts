import { nextTick, watch } from "vue";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import { debounce, forEach, isEmpty, keys } from "lodash-es";
import type {
  ClientOrderStatusChoice,
  ClientOrdersComparisonLeaf,
  ClientOrdersDateLeaf,
  ClientOrdersFilterActions,
  ClientOrdersFilterModel,
  ClientOrdersListQuery,
  ClientOrdersQueryModel,
  ClientOrdersServices,
  ClientOrdersSortEntry,
  ClientOrdersSortModel,
  ClientOrdersSortableColumn
} from "./client-orders.types";
import type { ScopeActorTypes } from "../scope/scope.types";

/** D-3 — every module writer re-asserts the forced leaf on its fresh copy (ADR-032 decision 5 rule 2). */
const FORCED_CATEGORY = "new_contract" as const;

/** D-8 — the oracle's own search debounce, distinct from the shared 350 ms constant. */
const SEARCH_DEBOUNCE_MS = 250;
// -----------------------------------------------------------------------------
/**
 * @module client-orders/useClientOrders.actions
 * @description Collection actions — readiness, paging (design 8.3), the P5b
 * zero-row recovery watch (D-6), and lifecycle. Query-backed: `destroy()`
 * removes the registry entry, because there is no service to stop.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useClientOrders.actions.{actor}.ts` file exists.
 */
export function createClientOrdersActions(
  _actorScope: ScopeActorTypes,
  service: ClientOrdersServices,
  query: ClientOrdersListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * A first fetch that never settles would otherwise leave `isReady()`
   * waiting forever. This bound is the fix: `isReady()` always SETTLES,
   * resolving `false` on exhaustion rather than hanging a caller's `await`.
   */
  const READY_TIMEOUT_MS = 10_000;

  function addressableOutcome(): boolean | undefined {
    const { isAuthenticated } = useActiveSession().useMeta();
    if (isAuthenticated.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  function whenSessionSettles(): Promise<boolean> {
    const settled = addressableOutcome();
    if (settled !== undefined) return Promise.resolve(settled);

    return new Promise<boolean>(resolve => {
      const stop = watch([isSessionInitialised, isSessionSettling], () => {
        const outcome = addressableOutcome();
        if (outcome === undefined) return;
        stop();
        resolve(outcome);
      });
    });
  }

  async function whenFetched(): Promise<boolean> {
    await nextTick();

    if (query.isFetched.value) return !query.error.value;

    return new Promise<boolean>(resolve => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        stop();
        resolve(false);
      }, READY_TIMEOUT_MS);
      const stop = watch(query.isFetched, fetched => {
        if (!fetched || settled) return;
        settled = true;
        clearTimeout(timer);
        stop();
        resolve(!query.error.value);
      });
    });
  }

  /**
   * Resolves once the collection is ready to read.
   * @returns true once the first fetch has settled with no error; false if
   * it settled with an error (design 6.1 step 6), if the session settles
   * with no addressable client, or once the fetch itself times out.
   * Always SETTLES.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenFetched();
  }

  /**
   * Forces a re-read of the list from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * Design 8.3 pagination write rule — a page write replaces the WHOLE
   * `pagination` branch, so `limit` always rides along with `offset`.
   */
  function writePage(page: number): void {
    const limit = query.criteria.value.pagination?.limit ?? 10;
    query.setCriteria({
      pagination: { limit, offset: (Math.max(1, page) - 1) * limit }
    });
  }

  /** Advances the list one page forward. */
  function nextPage(): void {
    const { page = 1, pages = 1 } = query.pagination.value ?? {};
    writePage(Math.min(pages, page + 1));
  }

  /** Steps the list one page back. */
  function prevPage(): void {
    const { page = 1 } = query.pagination.value ?? {};
    writePage(Math.max(1, page - 1));
  }

  /** Jumps to the given page (design 8.3). */
  function setPage(page: number): void {
    writePage(page);
  }

  /** Sets the page size and returns to the first page (design 8.3). */
  function setLimit(limit: number): void {
    query.setCriteria({
      pagination: { limit: Math.max(1, limit), offset: 0 }
    });
  }

  /**
   * D-6 — the P5b watch: on a SETTLED read with no error, zero total rows
   * and a non-zero offset, writes offset 0 at the module edge. The core
   * does not recover on a zero total (ruling R4 bars the query-core change
   * this would otherwise be).
   */
  watch(
    () => [
      query.isFetched.value,
      !!query.error.value,
      query.pagination.value?.total,
      query.criteria.value.pagination?.offset
    ],
    ([isFetched, hasError, total, offset]) => {
      if (!isFetched || hasError || total !== 0) return;
      if (!offset) return;
      query.setCriteria({
        pagination: {
          limit: query.criteria.value.pagination?.limit ?? 10,
          offset: 0
        }
      });
    }
  );

  /**
   * Destroys this scoped instance — removes it from the registry so the
   * next `.as()` mints a fresh collection.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // -----------------------------------------------------------------------
  // The criteria surface (design 8.3). ONE state — every writer below
  // composes a fresh copy of the LIVE `query.criteria.value.filters`, never
  // a second module `ref` (D-7, ADR-032 decision 5). Every writer
  // re-asserts `"category.slug"` on its own copy before it writes (D-3).

  /** Composes a fresh filters copy, lets `mutate` change it, then writes it. */
  function writeFilters(
    mutate: (filters: ClientOrdersFilterModel) => void
  ): void {
    const filters: ClientOrdersFilterModel = {
      ...(query.criteria.value.filters ?? {})
    };
    mutate(filters);
    filters["category.slug"] = FORCED_CATEGORY;
    query.setCriteria({ filters });
  }

  const searchDebounced = debounce((term?: string) => {
    writeFilters(filters => {
      const number = { ...(filters.number ?? {}) };
      if (term) number.eq = term;
      else delete number.eq;

      if (isEmpty(number)) delete filters.number;
      else filters.number = number;
    });
  }, SEARCH_DEBOUNCE_MS);

  /** The quick search — writes `filters.number.eq` (design 8.3, D-8). Debounced 250 ms. */
  function search(term?: string): void {
    searchDebounced(term);
  }

  /** A comparison-keyed leaf (`{ eq?, neq?, gt?, ... }`), touched by column name only. */
  type ComparisonLeafRecord = Partial<Record<string, unknown>>;

  /** A many-comparison numeric/date column — adds or replaces ONE comparison, others stay (design 8.3). */
  function writeComparison<TValue>(
    column: "total_amount" | "created_at" | "paid_datetime",
    value: TValue | undefined,
    op?: string
  ): void {
    writeFilters(filters => {
      const filterBag = filters as unknown as Record<
        string,
        ComparisonLeafRecord | undefined
      >;
      const leaf: ComparisonLeafRecord = { ...(filterBag[column] ?? {}) };

      if (value === undefined || value === null || value === "") {
        if (op) delete leaf[op];
        else forEach(keys(leaf), key => delete leaf[key]);
      } else {
        leaf[op ?? "eq"] = value;
      }

      if (isEmpty(leaf)) delete filterBag[column];
      else filterBag[column] = leaf;
    });
  }

  /** A one-filter text column — REPLACES the whole branch, so one filter stays on it (design 8.3 [o33]). */
  function writeTextColumn(
    column:
      | "products.product.name"
      | "products.product.category.name"
      | "products.service_identifier",
    value: string | undefined,
    op: "like" | "eq" | "neq"
  ): void {
    writeFilters(filters => {
      const filterBag = filters as unknown as Record<
        string,
        ComparisonLeafRecord | undefined
      >;
      if (!value) delete filterBag[column];
      else filterBag[column] = { [op]: value };
    });
  }

  /** The status filter — REPLACES the whole branch, so `maxProperties: 1` never fails a module write (design 8.3, D-24). */
  function status(
    values?: ClientOrderStatusChoice[],
    op: "eq" | "neq" = "eq"
  ): void {
    writeFilters(filters => {
      if (!values || values.length === 0) delete filters["status.code"];
      else filters["status.code"] = { [op]: values };
    });
  }

  function total(
    value?: number,
    op?: keyof ClientOrdersComparisonLeaf<number>
  ): void {
    writeComparison("total_amount", value, op);
  }

  function dateCreated(value?: string, op?: keyof ClientOrdersDateLeaf): void {
    writeComparison("created_at", value, op);
  }

  function datePaid(value?: string, op?: keyof ClientOrdersDateLeaf): void {
    writeComparison("paid_datetime", value, op);
  }

  function itemName(value?: string, op: "like" | "eq" | "neq" = "like"): void {
    writeTextColumn("products.product.name", value, op);
  }

  function categoryName(
    value?: string,
    op: "like" | "eq" | "neq" = "like"
  ): void {
    writeTextColumn("products.product.category.name", value, op);
  }

  function serviceIdentifier(
    value?: string,
    op: "like" | "eq" | "neq" = "like"
  ): void {
    writeTextColumn("products.service_identifier", value, op);
  }

  const filters: ClientOrdersFilterActions = {
    query: search,
    status,
    total,
    dateCreated,
    datePaid,
    itemName,
    categoryName,
    serviceIdentifier
  };

  /**
   * The raw-intent filter write (design 8.3 write rules). A FRESH copy of
   * `intent`, never `intent` itself: keeps the live `number.eq` leaf when
   * `intent` does not name `number`, and re-asserts the forced leaf (D-3).
   */
  function filterBy(intent: ClientOrdersFilterModel): void {
    writeFilters(filters => {
      Object.assign(filters, intent);

      if (!("number" in intent)) {
        const liveNumber = query.criteria.value.filters?.number;
        if (liveNumber) filters.number = { ...liveNumber };
        else delete filters.number;
      }

      const statusBranch = filters["status.code"];
      if (statusBranch?.eq && statusBranch?.neq) {
        filters["status.code"] = { eq: statusBranch.eq };
      }
    });
  }

  /**
   * The raw-intent criteria write (design 8.3 write rules, ADR-032 decision
   * 5 rule 2). A MODULE WRITER, not the bare `query.setCriteria`: the
   * `filters` branch routes through {@link writeFilters}, so every write
   * re-asserts the forced `category.slug` leaf on a fresh copy of the live
   * filters; `sort` and `pagination` pass through as given.
   */
  function setCriteria(intent: Partial<ClientOrdersQueryModel>): void {
    if (intent.filters) {
      writeFilters(filters => {
        Object.assign(filters, intent.filters);

        const statusBranch = filters["status.code"];
        if (statusBranch?.eq && statusBranch?.neq) {
          filters["status.code"] = { eq: statusBranch.eq };
        }
      });
    }

    if (intent.sort !== undefined || intent.pagination !== undefined) {
      query.setCriteria({
        ...(intent.sort !== undefined && { sort: intent.sort }),
        ...(intent.pagination !== undefined && {
          pagination: intent.pagination
        })
      } as never);
    }
  }

  /** Writes the whole `sort` branch. The page stays — `pagination` rides along unchanged (design 8.3, P4). */
  function sortBy(intent: ClientOrdersSortModel): void {
    query.setCriteria({
      sort: intent,
      pagination: query.criteria.value.pagination
    } as never);
  }

  /** Convenience single-column sort over {@link sortBy} (design 8.6). */
  function sort(
    property: ClientOrdersSortableColumn,
    direction: ClientOrdersSortEntry["dir"]
  ): void {
    sortBy([{ field: property, dir: direction }]);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useClientOrders.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** The named filter setters of design 8.3 — each a fresh copy, forced leaf re-asserted. */
    filters,

    /** The raw-intent filter write — keeps the live search leaf, re-asserts the forced leaf. */
    filterBy,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read. Always settles. */
    isReady,

    /** Advances the list one page forward. */
    nextPage,

    /** Steps the list one page back. */
    prevPage,

    /** Refetches the list from the server; rejects if it cannot address one. */
    refresh,

    /**
     * Drops this collection's cached pages outright, so the next read
     * starts from the server rather than from what is held.
     *
     * @scenario-exclude internal cache-key reset, not a user-facing capability
     */
    reset: resetQueryByKey(service.queryKey),

    /** Jumps to the given page — replaces the whole `pagination` branch (design 8.3). */
    setPage,

    /** Sets the page size and returns to page one (design 8.3). */
    setLimit,

    /**
     * Applies a criteria intent — merges `filters` / `sort` / `pagination`
     * into the ONE query model; the `filters` branch re-asserts the forced
     * `category.slug` leaf (D-3, ADR-032 decision 5 rule 2).
     */
    setCriteria,

    /** Convenience single-column sort over {@link sortBy} (design 8.6). */
    sort,

    /** Writes the whole `sort` branch; the page stays (design 8.3, P4). */
    sortBy

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers. Named `...Collection...` — `UseClientOrdersActions`
// collides with the portal mock contract (`client-orders.types.ts` head `@decision`).
export type UseClientOrdersCollectionActions = ReturnType<
  typeof createClientOrdersActions
>;
