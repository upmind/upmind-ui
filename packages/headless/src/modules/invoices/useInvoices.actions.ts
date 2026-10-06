import { until } from "@vueuse/core";
import { watch } from "vue";
import { invalidateQueryByKey, PAGINATION, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { CONSOLIDATABLE_FILTER, CREDIT_NOTE_FILTER } from "./invoices.types";
import { NotAuthenticatedError } from "../../utils";
import {
  assign,
  debounce,
  has,
  isEmpty,
  isNil,
  isNumber,
  omit,
  omitBy,
  set,
  unset
} from "lodash-es";
import type {
  InvoiceComparisonLeaf,
  InvoiceDateLeaf,
  InvoiceFilterModel,
  InvoiceOrderFilterModel,
  InvoiceOrderStatusChoice,
  InvoiceSortModel,
  InvoicesListQuery,
  InvoicesServices
} from "./invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";

/** The legacy quick-search pause, distinct from the shared 350 ms input debounce. */
const SEARCH_DEBOUNCE_MS = 250;

const RELATIVE_DATE_PATTERN = /^[+-]/;

type CriteriaWrite = Parameters<InvoicesListQuery["setCriteria"]>[0];
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoices.actions
 * @description Collection actions — list controls (page writes, the number
 * search, the order history's named filter setters, and the empty-page
 * recovery), the criteria presets AC2 and AC7 apply (`CONSOLIDATABLE_FILTER` / `CREDIT_NOTE_FILTER`, defined in
 * `invoices.types.ts`), and lifecycle. Query-backed: `destroy()` removes the
 * registry entry, because there is no service to stop. The single invoice's
 * payment-method write lives on `useInvoice` (the flat single-invoice
 * composable), never on the list.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useInvoices.actions.{actor}.ts` file exists.
 */
export function createInvoicesActions(
  _actorScope: ScopeActorTypes,
  service: InvoicesServices,
  query: InvoicesListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /**
   * Resolves once the collection is ready to read. The session gate is
   * load-bearing: the list query is disabled until this scope can address a
   * client, so readiness first waits for the session to settle — either this
   * scope becomes addressable, or the session finishes settling without one —
   * then, only when addressable, for the first fetch to complete.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client.
   */
  async function isReady(): Promise<boolean> {
    await until(
      () =>
        service.isAvailable.value ||
        isSessionInitialised.value ||
        !isSessionSettling.value
    ).toBe(true);

    if (!service.isAvailable.value) return false;

    await until(query.isFetched).toBe(true);
    return true;
  }

  /**
   * Forces a re-read of the list from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  function liveFilters(): Record<string, unknown> {
    return { ...(query.criteria.value.filters ?? {}) };
  }

  /** Writes a fresh copy of the live filters after `mutate` changed it; the page returns to one. */
  function writeFilters(mutate: (filters: Record<string, unknown>) => void) {
    const filters = liveFilters();
    mutate(filters);
    query.setCriteria({ filters } as CriteriaWrite);
  }

  /**
   * Applies a filter INTENT over the LIVE filters: each column the intent
   * names replaces the live one, a nil column goes away, and every other live
   * column stays. The page returns to one.
   */
  function filterBy(
    intent: InvoiceFilterModel | InvoiceOrderFilterModel
  ): void {
    query.setCriteria({
      filters: omitBy(assign(liveFilters(), intent), isNil)
    } as CriteriaWrite);
  }

  /** Applies a sort INTENT; the live page window rides along, so the page stays. */
  function sortBy(intent: InvoiceSortModel): void {
    query.setCriteria({
      sort: intent,
      pagination: query.criteria.value.pagination
    });
  }

  function liveLimit(): number {
    const limit = query.criteria.value.pagination?.limit;
    return isNumber(limit) ? limit : PAGINATION.limit;
  }

  /** Goes to page `page`; a page under one becomes one. The page size stays. */
  function setPage(page: number): void {
    const limit = liveLimit();
    query.setCriteria({
      pagination: { limit, offset: (Math.max(1, page) - 1) * limit }
    });
  }

  /** Sets the page size and goes back to page one; a size under one becomes one. */
  function setLimit(limit: number): void {
    query.setCriteria({ pagination: { limit: Math.max(1, limit), offset: 0 } });
  }

  // A settled read past page one with no rows and a zero total goes back to
  // page one. A non-zero total past the last page is the core's to recover.
  watch(
    () =>
      [
        query.isFetched.value && !query.isFetching.value,
        !!query.error.value,
        query.pagination.value.total,
        query.criteria.value.pagination?.offset
      ] as const,
    ([isSettled, hasError, total, offset]) => {
      if (!isSettled || hasError || total !== 0 || !offset) return;
      query.setCriteria({ pagination: { limit: liveLimit(), offset: 0 } });
    }
  );

  /** The number column's leaf path: the operator branch `number.eq` where the schema declares one, else the bare column. */
  function numberLeafPath(): string[] {
    return has(query.schema, [
      "properties",
      "filters",
      "properties",
      "number",
      "properties",
      "eq"
    ])
      ? ["number", "eq"]
      : ["number"];
  }

  const writeSearch = debounce((term?: string) => {
    writeFilters(filters => {
      const path = numberLeafPath();
      if (path.length > 1) filters.number = { ...(filters.number as object) };
      if (term) set(filters, path, term);
      else unset(filters, path);
      if (path.length > 1 && isEmpty(filters.number)) unset(filters, "number");
    });
  }, SEARCH_DEBOUNCE_MS);

  /**
   * Searches for an exact invoice number, after a 250 ms pause; the last term
   * of a burst wins. An empty term removes the search. The live filters stay,
   * and the page returns to one.
   */
  function search(term?: string): void {
    writeSearch(term);
  }

  function writeTextColumn(
    column: string,
    value: string | undefined,
    op: "like" | "eq" | "neq"
  ): void {
    writeFilters(filters => {
      if (value) filters[column] = { [op]: value };
      else unset(filters, [column]);
    });
  }

  function writeComparison(
    column: string,
    value: number | string | undefined,
    op: string | undefined
  ): void {
    writeFilters(filters => {
      const leaf = { ...(filters[column] as Record<string, unknown>) };
      if (isNil(value) || value === "") {
        const next = op ? omit(leaf, op) : {};
        if (isEmpty(next)) unset(filters, [column]);
        else filters[column] = next;
        return;
      }
      filters[column] = { ...leaf, [op ?? "eq"]: value };
    });
  }

  function dateOp(value?: string, op?: keyof InvoiceDateLeaf) {
    if (op || isNil(value) || value === "") return op;
    return RELATIVE_DATE_PATTERN.test(value) ? "after" : "gte";
  }

  /**
   * The order history's named filter setters. Each writes a fresh copy of the
   * live filters with its one leaf changed, and the page returns to one. A
   * text setter replaces its column; a number or date setter adds or replaces
   * the comparison of `op`. An absent value removes the leaf of `op`, or the
   * whole column with no `op`.
   */
  const filters = {
    /** The status narrowing — replaces the column; `eq` by default. */
    status(values?: InvoiceOrderStatusChoice[], op: "eq" | "neq" = "eq") {
      writeFilters(next => {
        if (isEmpty(values)) unset(next, ["status.code"]);
        else next["status.code"] = { [op]: values };
      });
    },

    /** The total amount; `eq` by default. */
    total(value?: number, op?: keyof InvoiceComparisonLeaf<number>) {
      writeComparison("total_amount", value, op);
    },

    /** When the order was placed; a relative period defaults to `after`, an absolute moment to `gte`. */
    dateCreated(value?: string, op?: keyof InvoiceDateLeaf) {
      writeComparison("create_datetime", value, dateOp(value, op));
    },

    /** When the order was paid; the same defaults as `dateCreated`. */
    datePaid(value?: string, op?: keyof InvoiceDateLeaf) {
      writeComparison("paid_datetime", value, dateOp(value, op));
    },

    /** An item name; `like` by default. */
    itemName(value?: string, op: "like" | "eq" | "neq" = "like") {
      writeTextColumn("products.product.name", value, op);
    },

    /** An item category name; `like` by default. */
    categoryName(value?: string, op: "like" | "eq" | "neq" = "like") {
      writeTextColumn("products.product.category.name", value, op);
    },

    /** An item service identifier; `like` by default. */
    serviceIdentifier(value?: string, op: "like" | "eq" | "neq" = "like") {
      writeTextColumn("products.service_identifier", value, op);
    }
  };

  /** AC2 — narrows the list to invoices this client could consolidate. */
  function filterConsolidatable(clientId?: string): void {
    query.setCriteria({
      filters: {
        ...CONSOLIDATABLE_FILTER,
        client_id: clientId ?? service.clientId.value
      }
    });
  }

  /** AC7 — credit notes as a filtered view of this same collection. */
  function filterCreditNotes(): void {
    query.setCriteria({ filters: CREDIT_NOTE_FILTER });
  }

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.as()` mints a fresh collection.
   */
  function destroy(): void {
    writeSearch.cancel();
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useInvoices.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Applies a filter intent over the live filters — a nil column goes away. */
    filterBy,

    /** The order history's named filter setters. */
    filters,

    /** AC2 — applies the consolidatable-count criteria preset. */
    filterConsolidatable,

    /** AC7 — applies the credit-notes criteria preset. */
    filterCreditNotes,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read. Always settles. */
    isReady,

    /** Advances the list one page forward. */
    nextPage: query.fetchNextPage,

    /** Steps the list one page back. */
    prevPage: query.fetchPreviousPage,

    /** Refetches the list from the server; rejects if it cannot address one. */
    refresh,

    /** Searches for an exact invoice number after a 250 ms pause. */
    search,

    /**
     * Drops this collection's cached pages outright, so the next read starts
     * from the server rather than from what is held. `invalidate` marks the
     * key stale and keeps the rows on screen; this clears them.
     *
     * @scenario-exclude internal cache-key reset, not a user-facing capability
     */
    reset: resetQueryByKey(service.queryKey),

    /**
     * Applies a criteria INTENT — merges the given `filters` / `sort` /
     * `pagination` branches into the ONE query model; branches left out are
     * untouched. The single write verb: the schema governs what is
     * spellable, so a legacy `filter[col]` key or a raw sort tuple is
     * unreachable here.
     */
    setCriteria: query.setCriteria,

    /** Sets the page size and goes back to page one. */
    setLimit,

    /** Goes to the given page, keeping the page size. */
    setPage,

    /** Applies a sort intent to the list; the page stays. */
    sortBy

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseInvoicesActions = ReturnType<typeof createInvoicesActions>;
