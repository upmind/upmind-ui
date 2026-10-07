// -----------------------------------------------------------------------------
/**
 * @module portal/mock/collections
 * @description The mock twin of the headless scoped-composable collection
 * surface (docs/plans/portal-mock-composable-facades.md): the ADR-001
 * four-layer return (`useContext` / `useMeta` / `useActions` / `useInternals`)
 * with the platform pagination contract, typed against
 * `@upmind-automation/headless`'s own exported types so drift is a compile
 * error. Types only — a headless VALUE import executes the barrel (R3).
 *
 * Paging derives from the live store arrays on every read; the only owned
 * state is the requested page index (R7). The read-side clamp mirrors the
 * platform's safe-offset correction (`useQuery.ts:419-432`).
 */

import { computed, ref, unref } from "vue";
import {
  assign,
  filter,
  find,
  forEach,
  includes,
  isMatch,
  isObject,
  isString,
  get,
  map,
  slice,
  some,
  toLower
} from "lodash-es";
import type { MockFilterControl } from "./collection-filters";
import type { DataRouteContext } from "./injection";
import type { MockDataset } from "./types";
import type {
  PaginationInfo,
  RequestSortDirection,
  ResponseError,
  useCollection
} from "@upmind-automation/headless";
import type { ComputedRef, MaybeRef } from "vue";
// -----------------------------------------------------------------------------

/** Mirrors the platform default (`PAGINATION.limit`, `query.utils.ts:39`) — a runtime const the types-only fence keeps out of reach. */
export const MOCK_PAGE_LIMIT = 10;

/** The applied-filter criteria one facade's named filters compose onto. */
export type MockFilterCriteria = Record<string, unknown>;

/**
 * One NAMED sort a panel offers. The real `RequestSortDirection` is a runtime
 * enum behind the types-only fence, so no mock caller can build the platform's
 * tuple (R5) — a def declares its orders as comparators instead.
 */
export type MockSortOption<TRow> = {
  readonly value: string;
  readonly label: string;
  readonly compare: (a: TRow, b: TRow) => number;
};

/** The label-only slice a module renders — never the compare functions. */
export type MockSortOptionDescriptor = {
  readonly value: string;
  readonly label: string;
};

export type MockCollectionContext<TRow> = {
  /** The reactive CURRENT PAGE of this scope's rows (always an array). */
  data: ComputedRef<TRow[]>;
  /**
   * MOCK-SEAM ONLY: every row up to and including the current page — what a
   * LOAD-MORE list shows, derived from the page index rather than latched
   * anywhere. The platform accumulates in TanStack's own infinite-query
   * pages, which a mock has none of. Dies at go-real.
   */
  accumulated: ComputedRef<TRow[]>;
  /** The scope's captured error — a mock never has one. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds a single row on the current page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<TRow>>["findOne"];
  /** Finds a single row on the current page by id. */
  getOne: ReturnType<typeof useCollection<TRow>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
  /** MOCK-SEAM ONLY: the applied query, "" when none — the control selector's opening value. Dies at go-real. */
  appliedQuery: ComputedRef<string>;
  /** MOCK-SEAM ONLY: the active sort option's value; undefined is seed order. Dies at go-real. */
  activeSort: ComputedRef<string | undefined>;
  /** MOCK-SEAM ONLY: this def's sort options, labels only. Dies at go-real. */
  sortOptions: readonly MockSortOptionDescriptor[];
  /** MOCK-SEAM ONLY: this def's filter controls, as the band renders them. Dies at go-real. */
  filterControls: readonly MockFilterControl[];
  /** MOCK-SEAM ONLY: each declared control's applied value, "" when it narrows nothing. Dies at go-real. */
  appliedFilters: ComputedRef<Readonly<Record<string, string>>>;
  /** MOCK-SEAM ONLY: whether this def declares searchable props. Dies at go-real. */
  isSearchable: boolean;
};

export type MockCollectionMeta = {
  hasError: ComputedRef<boolean>;
  isAvailable: ComputedRef<boolean>;
  isEmpty: ComputedRef<boolean>;
  isLoading: ComputedRef<boolean>;
  hasNextPage: ComputedRef<boolean>;
  hasPrevPage: ComputedRef<boolean>;
  hasPages: ComputedRef<boolean>;
};

export type MockCollectionActions<
  TFilters,
  TSortProperty extends string = string
> = {
  /** Drops this instance from its registry so the next resolve re-mints. */
  destroy: () => void;
  /** The facade's named filters — compose onto one criteria ref, page kept (R12). */
  filters: TFilters;
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  isReady: () => Promise<boolean>;
  /** Moves to the next page; no-op at the bound (R11). */
  nextPage: () => void;
  /** Moves to the previous page; no-op at the bound (R11). */
  prevPage: () => void;
  refresh: () => Promise<void>;
  /** Records the sort tuple; no v1 caller can reach the direction enum (R5). */
  sort: (property?: TSortProperty, direction?: RequestSortDirection) => void;
  /** MOCK-SEAM ONLY: the uniform search door — writes `criteria.query`, which the core narrows by. Dies at go-real. */
  search: (text: string) => void;
  /** MOCK-SEAM ONLY: applies one NAMED sort option; empty or unknown restores seed order. Dies at go-real. */
  applySort: (value?: string) => void;
  /** MOCK-SEAM ONLY: writes ONE declared filter control's criteria; an empty value clears it. Dies at go-real. */
  applyNamedFilter: (key: string, value: string) => void;
  /**
   * MOCK-SEAM ONLY: resizes the page. A deliberate deviation from the platform,
   * which mints `limit` once per `loadList` and has no runtime setter — the
   * second such deviation, beside R11's bound no-ops. Dies at go-real.
   */
  setLimit: (value: number) => void;
};

/** R9: the real layer exposes the raw TanStack query, which a mock cannot honestly construct; portal never consumes it. */
export type MockCollectionInternals = {
  query: undefined;
};

export type MockCollection<
  TRow,
  TFilters,
  TSortProperty extends string = string
> = {
  useActions: () => MockCollectionActions<TFilters, TSortProperty>;
  useContext: () => MockCollectionContext<TRow>;
  useInternals: () => MockCollectionInternals;
  useMeta: () => MockCollectionMeta;
};

export type MockCollectionOptions<
  TRow,
  TFilters,
  TSortProperty extends string = string
> = {
  /** Reads the LIVE rows for this instance's scope, narrowed by the applied criteria. */
  source: (criteria: MockFilterCriteria) => readonly TRow[];
  /** Items per page; the platform default when absent. */
  limit?: number;
  /** Builds the named filter map over the shared criteria ref; pass `() => ({})` when the panel has none. */
  filters: (applyFilter: (patch: MockFilterCriteria) => void) => TFilters;
  /**
   * The criteria this instance opens with — a panel whose status tab is route
   * state mints one instance per tab, and this is that tab, applied through
   * the same criteria the runtime filters write to.
   */
  initialCriteria?: MockFilterCriteria;
  /** Sort tuple applied at mint — the seed order stands in for it in v1 (R5). */
  initialSort?: [RequestSortDirection, TSortProperty];
  /** Props `criteria.query` narrows by, case-insensitively. Absent = the panel offers no search. */
  searchProps?: readonly string[];
  /** The named orders this panel offers. Absent = seed order only, no select. */
  sortOptions?: readonly MockSortOption<TRow>[];
  /** The narrowings this panel's band offers; each key is a criteria key `source` reads. */
  filterControls?: readonly MockFilterControl[];
};

// -----------------------------------------------------------------------------

/**
 * One row's case-insensitive substring match over named props — the single
 * implementation behind `findOne`'s string form and the core's `criteria.query`
 * narrowing.
 */
function matchesQuery(
  entry: unknown,
  props: readonly string[],
  needle: string
): boolean {
  const wanted = toLower(needle);
  return some(props, prop =>
    includes(toLower(String(get(entry, prop) ?? "")), wanted)
  );
}

function createMockCollection<TRow, TFilters, TSortProperty extends string>(
  options: MockCollectionOptions<TRow, TFilters, TSortProperty>,
  onDestroy: () => void
): MockCollection<TRow, TFilters, TSortProperty> {
  // A ref, not a constant: `setLimit` resizes the page (the recorded
  // deviation on the actions type below).
  const limit = ref(options.limit ?? MOCK_PAGE_LIMIT);

  const criteria = ref<MockFilterCriteria>(options.initialCriteria ?? {});
  const requestedPage = ref(1);
  const appliedSort = ref(options.initialSort);
  // The FIRST declared option is the order the panel opens in, so a list is
  // always in an order the control can name. A collection declaring no options
  // keeps its seed order, and its panel renders no select at all.
  const openingSort = options.sortOptions?.at(0);
  const activeSortValue = ref<string | undefined>(openingSort?.value);

  /** The def's own narrowing, then the query — a def declaring no `searchProps` offers no search and passes through. */
  function narrowedRows(): TRow[] {
    const sourced = [...options.source(criteria.value)];
    const searchProps = options.searchProps;
    const query = criteria.value.query;
    if (searchProps === undefined) return sourced;
    if (!isString(query) || query === "") return sourced;
    return filter(sourced, entry => matchesQuery(entry, searchProps, query));
  }

  // Always a declared option where the def has any: the ref opens on the first
  // one and `applySort` only ever writes a value it resolved.
  function activeSortOption(): MockSortOption<TRow> | undefined {
    return find(options.sortOptions, { value: activeSortValue.value });
  }

  const rows = computed<TRow[]>(() => {
    const narrowed = narrowedRows();
    const option = activeSortOption();
    if (option === undefined) return narrowed;
    return [...narrowed].sort(option.compare);
  });
  const total = computed(() => rows.value.length);
  const pages = computed(() =>
    Math.max(Math.ceil(total.value / limit.value), 1)
  );

  // Read-side clamp: a shrink (filter change, store mutation) lands the
  // requested index past the end; the platform corrects the offset at fetch
  // time, this corrects it at read time.
  const page = computed(() =>
    Math.min(Math.max(requestedPage.value, 1), pages.value)
  );

  const pageRows = computed<TRow[]>(() =>
    slice(rows.value, (page.value - 1) * limit.value, page.value * limit.value)
  );

  const accumulatedRows = computed<TRow[]>(() =>
    slice(rows.value, 0, page.value * limit.value)
  );

  const from = computed(() => {
    if (total.value === 0) return 0;
    return limit.value * (page.value - 1) + 1;
  });

  const pagination = computed<PaginationInfo>(() => ({
    limit: limit.value,
    total: total.value,
    page: page.value,
    pages: pages.value,
    from: from.value,
    to: Math.min(limit.value * page.value, total.value)
  }));

  // --- context

  function getOne(
    id?: string | number,
    data: MaybeRef<TRow[] | null | undefined> = pageRows.value
  ): TRow | undefined {
    if (id === undefined || id === "") return undefined;
    return find(unref(data) ?? [], ["id", id]);
  }

  function findOne(
    mapping: string | Partial<TRow>,
    data: MaybeRef<TRow[] | null | undefined> = pageRows.value,
    searchableProps: string[] = []
  ): TRow | undefined {
    const entries = unref(data) ?? [];
    if (isString(mapping)) {
      return find(entries, entry =>
        matchesQuery(entry, searchableProps, mapping)
      );
    }
    return find(
      entries,
      entry => isObject(entry) && isObject(mapping) && isMatch(entry, mapping)
    );
  }

  const context: MockCollectionContext<TRow> = {
    data: pageRows,
    accumulated: accumulatedRows,
    error: computed<ResponseError | undefined>(() => undefined),
    findOne,
    getOne,
    pagination,
    appliedQuery: computed<string>(() => {
      const query = criteria.value.query;
      if (!isString(query)) return "";
      return query;
    }),
    activeSort: computed<string | undefined>(() => activeSortOption()?.value),
    sortOptions: map(options.sortOptions ?? [], option => ({
      value: option.value,
      label: option.label
    })),
    filterControls: options.filterControls ?? [],
    // TOTAL over the declared controls: the band reads a value for every
    // control it renders, so a control narrowing nothing answers "" rather
    // than going missing from the map.
    appliedFilters: computed<Readonly<Record<string, string>>>(() => {
      const applied: Record<string, string> = {};
      forEach(options.filterControls ?? [], control => {
        const value = criteria.value[control.key];
        if (!isString(value)) {
          applied[control.key] = "";
          return;
        }
        applied[control.key] = value;
      });
      return applied;
    }),
    isSearchable: options.searchProps !== undefined
  };

  // --- meta

  const meta: MockCollectionMeta = {
    hasError: computed<boolean>(() => false),
    isAvailable: computed<boolean>(() => true),
    isEmpty: computed<boolean>(() => total.value === 0),
    isLoading: computed<boolean>(() => false),
    hasNextPage: computed<boolean>(() => page.value < pages.value),
    hasPrevPage: computed<boolean>(() => page.value > 1),
    hasPages: computed<boolean>(() => pages.value > 1)
  };

  // --- actions

  function applyFilter(patch: MockFilterCriteria): void {
    criteria.value = assign({}, criteria.value, patch);
    // Materialise the clamp, as the platform's refetch does
    // (`useQuery.ts:419-432` writes the corrected index back): the page index
    // survives a filter change (R12) but never dangles past the new end.
    requestedPage.value = page.value;
  }

  function nextPage(): void {
    if (page.value >= pages.value) return;
    requestedPage.value = page.value + 1;
  }

  function prevPage(): void {
    if (page.value <= 1) return;
    requestedPage.value = page.value - 1;
  }

  function sort(
    property?: TSortProperty,
    direction?: RequestSortDirection
  ): void {
    if (property === undefined) {
      appliedSort.value = options.initialSort;
      return;
    }
    if (direction === undefined) {
      appliedSort.value = undefined;
      return;
    }
    appliedSort.value = [direction, property];
  }

  // Search rides the SAME criteria the named filters write, so it inherits
  // their page treatment: the index survives, clamped (R12/S10), never reset.
  function search(text: string): void {
    if (text === "") {
      applyFilter({ query: undefined });
      return;
    }
    applyFilter({ query: text });
  }

  // No clamp needed: a sort reorders the rows, it never changes their COUNT,
  // so the page index stays in range by construction. An absent or unknown
  // value falls back to the opening option rather than to an unnamed order.
  function applySort(value?: string): void {
    const option = find(options.sortOptions, { value });
    if (option === undefined) {
      activeSortValue.value = openingSort?.value;
      return;
    }
    activeSortValue.value = option.value;
  }

  // The band writes through the DECLARED controls only, so an unknown key
  // never reaches the criteria — the same quiet no-op an unknown verb gets.
  function applyNamedFilter(key: string, value: string): void {
    const control = find(options.filterControls, { key });
    if (control === undefined) return;
    if (value === "") {
      applyFilter({ [key]: undefined });
      return;
    }
    applyFilter({ [key]: value });
  }

  function setLimit(value: number): void {
    if (!Number.isInteger(value) || value < 1) return;
    limit.value = value;
    // The same materialised clamp a filter change gets: a bigger page can
    // strand the requested index past the new end.
    requestedPage.value = page.value;
  }

  const actions: MockCollectionActions<TFilters, TSortProperty> = {
    destroy: onDestroy,
    filters: options.filters(applyFilter),
    invalidate: <T>(data?: T): Promise<T | undefined> => Promise.resolve(data),
    isReady: (): Promise<boolean> => Promise.resolve(true),
    nextPage,
    prevPage,
    refresh: (): Promise<void> => Promise.resolve(),
    sort,
    search,
    applySort,
    applyNamedFilter,
    setLimit
  };

  return {
    useActions: () => actions,
    useContext: () => context,
    useInternals: () => ({ query: undefined }),
    useMeta: () => meta
  };
}

// -----------------------------------------------------------------------------

export type MockCollectionDefinition<
  TRow,
  TFilters,
  TSortProperty extends string = string
> = {
  /**
   * The memoised instance for this dataset + context — minted once per key,
   * like the scope registry (`scope.registry.ts`).
   */
  resolve: (
    data: MockDataset,
    context?: DataRouteContext
  ) => MockCollection<TRow, TFilters, TSortProperty>;
};

/**
 * Declares one paged collection. Each definition owns its registry —
 * `WeakMap` keyed on the reactive dataset object, so `resetMockData` (a new
 * object) resets page state for free and seedless shapes never mint anything.
 * `contextKey` is the R6 discriminator: MANDATORY wherever one definition
 * serves many route contexts (per group slug, per product id) — without it,
 * page state leaks between contexts. Context-free panels omit it.
 * Dev-only wart: HMR of a mock-layer file re-mints the registries while the
 * store's dataset map survives, so page indexes reset to 1 on hot reload.
 */
export function defineMockCollection<
  TRow,
  TFilters,
  TSortProperty extends string = string
>(
  make: (
    data: MockDataset,
    context: DataRouteContext
  ) => MockCollectionOptions<TRow, TFilters, TSortProperty>,
  contextKey?: (context: DataRouteContext) => string
): MockCollectionDefinition<TRow, TFilters, TSortProperty> {
  const registries = new WeakMap<
    MockDataset,
    Map<string, MockCollection<TRow, TFilters, TSortProperty>>
  >();

  function resolve(
    data: MockDataset,
    context: DataRouteContext = {}
  ): MockCollection<TRow, TFilters, TSortProperty> {
    let instances = registries.get(data);
    if (instances === undefined) {
      instances = new Map();
      registries.set(data, instances);
    }

    let key = "";
    if (contextKey !== undefined) key = contextKey(context);

    const existing = instances.get(key);
    if (existing !== undefined) return existing;

    const minted = createMockCollection(make(data, context), () => {
      instances.delete(key);
    });
    instances.set(key, minted);
    return minted;
  }

  return { resolve };
}
