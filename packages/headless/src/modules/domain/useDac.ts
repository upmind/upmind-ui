// --- external
import { waitFor } from "xstate/lib/waitFor";
import { computed } from "vue";
import { interpret } from "xstate";
import { useActor } from "@xstate/vue";

// --- internal
import { useI18n } from "../system";
import { useBrand } from "../brand";
import { QUERY_PARAMS, useQueryParams } from "../routing";
import dacMachine from "./dac.machine";
import { sanitiseDomainInput } from "./utils";

// --- utils
import { map, isArray, some, isEmpty } from "lodash-es";
import {
  stopService,
  stateMatches,
  useContext,
  contextValue
} from "../../utils";

// --- types
import {
  type DacContext,
  type DomainContext,
  type DomainProduct,
  DomainMode
} from "./types";
import { PAGINATION } from "../query";
import { BrandConfigKeys, DomainSearchMethod } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Composable for managing domain selection and search logic using XState and Vue.
 * Provides state, context, and helpers for domain-related flows (DAC, existing, basket).
 *
 * @param value - Initial domain(s) to use as the model.
 * @param options - required configuration for the domain type.
 * @param options.mode - The domain operation mode (register or transfer). Defaults to register.
 * @returns Domain management API (state, computed, and methods)
 */
export const useDac = (options?: { mode?: DomainMode }) => {
  const { t } = useI18n();
  const { getParam, getParams, setParam, unsetParam } = useQueryParams();
  const { getConfigValue } = useBrand();

  // Determine search flow from brand setting, fallback to dac-search (legacy)
  const searchMethod =
    getConfigValue<DomainSearchMethod>(BrandConfigKeys.DOMAIN_SEARCH_METHOD) ??
    DomainSearchMethod.LEGACY_LOOKUP;
  const useSuggestions = searchMethod === DomainSearchMethod.SMART_SUGGEST;

  const service = interpret(
    dacMachine.withContext({
      mode: options?.mode ?? DomainMode.register,
      useSuggestions,
      preferredCycle: getParam(QUERY_PARAMS.BILLING_CYCLE_MONTHS),
      coupons: getParams(QUERY_PARAMS.COUPONS),
      search: {
        // Sanitise the URL-seeded query so the dac machine + search service
        // see the same shape they would for a runtime SEARCH event.
        query: sanitiseDomainInput(getParam(QUERY_PARAMS.SEARCH, "") ?? ""),
        limit: PAGINATION.limit,
        offset: PAGINATION.offset
      }
    } as unknown as DacContext),
    { devTools: true }
  );

  const { state, send } = useActor(service.start());

  // --- state

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => !stateMatches(state, ["subscribing", "loading"]),
      { timeout: Infinity }
    ).then(_state => {
      return true;
    });
  }

  const meta = computed(() => {
    const usingSuggestions = pagination.value.totalPages > 0;
    const hasMoreSearchResults = usingSuggestions
      ? pagination.value.page < pagination.value.totalPages
      : pagination.value.offset + pagination.value.limit <
        pagination.value.total;

    return {
      isLoading: stateMatches(state, ["subscribing", "loading"]),
      isChecking: stateMatches(state, ["checking"]),
      isProcessing:
        stateMatches(state, ["checking"]) ||
        some(available.value, "meta.processing"),
      isSearching:
        stateMatches(state, "searching") && (query.value?.length ?? 0) > 2,
      // True for the *entire* Load more cycle — covers both the brief
      // `loading` sub-state and the `searching` state. The page>1 / offset>0
      // guard means this never fires for an initial search.
      isSearchingMore:
        stateMatches(state, ["loading", "searching"]) &&
        (query.value?.length ?? 0) > 2 &&
        (usingSuggestions
          ? pagination.value.page > 1
          : pagination.value.offset > 0),
      hasMoreSearchResults,
      hasErrors: stateMatches(state, ["error"]),
      isEmpty: isEmpty(model.value),
      hasAdded: !isEmpty(added.value),
      hasAvailable: !isEmpty(available.value),
      hasTLD: !!query.value?.includes("."),
      showSearchResults: !isEmpty(available.value) && !!query.value,
      isValid: stateMatches(state, ["valid"])
    };
  });

  // --- context

  const context = useContext<DomainContext>(state);

  const model = computed(() =>
    map(contextValue<DomainContext["model"]>(state, "model"), "domain")
  );

  const errors = useContext<DomainContext["error"]>(state, "error");

  const query = useContext<string>(state, "search.query");

  const lookups = useContext<any>(state, "lookups", []);

  const available = useContext<DomainProduct[]>(state, "lookups.searched", []);

  const added = useContext<DomainProduct[]>(state, "lookups.basket", []);

  const search = useContext<DomainContext["search"]>(state, "search");

  const pagination = computed(() => ({
    offset: search.value?.offset ?? PAGINATION.offset,
    limit: search.value?.limit ?? PAGINATION.limit,
    total: search.value?.total ?? 0,
    page: search.value?.page ?? 1,
    totalPages: search.value?.totalPages ?? 0
  }));

  // --- methods

  function searchDomains(query?: string) {
    if (!query) return;
    send({ type: "SEARCH", data: query });
    // Update URL immediately when search is triggered
    setParam("search", query);
  }

  function searchMore(): void {
    send({ type: "SEARCH.OFFSET" });
  }

  function toggle(value: string): void {
    const type =
      isArray(model.value) && some(model.value, { domain: value })
        ? "REMOVE"
        : "ADD";
    send({
      type,
      data: value
    });
  }

  function reset(): void {
    send({
      type: "RESET"
    });
    // housekeeping: clear search param on reset
    unsetParam("search");
  }

  function add(value: string): void {
    send({
      type: "ADD",
      data: value
    });
  }

  function remove(value: string): void {
    send({
      type: "REMOVE",
      data: value
    });
  }

  // -----------------------------------------------------------------------------
  return {
    // --- state

    /**
     * Resolves when the brand service is ready or errors.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the domain state.
     * @typedef {Object} DomainMeta
     * @property {boolean} isEmpty - Indicates if no domains are selected.
     * @property {boolean} isChecking - Indicates if a domain availability check is in progress.
     * @property {boolean} isLoading - Indicates if the domain state is loading.
     * @property {boolean} isLoadingMore - Indicates if more search results are being loaded.
     * @property {boolean} isProcessing - Indicates if the domain state is syncing.
     * @property {boolean} isSearching - Indicates if a search is in progress.
     * @property {boolean} isValid - Indicates if the current model is valid.
     * @property {boolean} hasMoreSearchResults - Indicates if there are more search results.
     * @property {boolean} hasAvailable - Indicates if there are available domains.
     * @property {boolean} hasErrors - Indicates if there are any errors.
     * @property {boolean} showChoices - Indicates if choices should be shown.
     * @property {boolean} showDac - Indicates if DAC view is active.
     * @property {boolean} showExisting - Indicates if existing view is active.
     * @property {boolean} showBasket - Indicates if basket view is active.
     * @property {boolean} showSelected - Indicates if a selection is shown.
     */
    meta,

    // --- context

    context,

    /**
     * The current search query.
     */
    query,

    /**
     * The current model (selected domains).
     */
    model,

    /**  List of available domains.*/
    available,

    /** List of domains added to the basket. */
    added,

    /**
     * Any errors encountered.
     */
    errors,

    /**
     * Get the current pagination state.
     * @typedef {Object} DomaincPagination
     * @property {number} offset - The current offset for pagination.
     * @property {number} limit - The number of items per page.
     * @property {number} total - The total number of items available.
     * @returns {DomainPagination} The current pagination state.
     */
    pagination,

    // --- methods

    /**
     * Search for domains by query string.
     * @param {string} query - The search query string.
     * @returns {void}
     */
    search: searchDomains,

    /**
     * Fetch more search results (pagination).
     * @returns {void}
     */
    searchMore,

    /** Add a domain value to the model.
     * @param {string} value - The domain value to add.
     * @returns {void}
     */
    add,

    /** Remove a domain value from the model.
     * @param {string} value - The domain value to remove.
     * @returns {void}
     */
    remove,

    /** Toggle a domain value in the model.
     * @param {string} value - The domain value to toggle.
     * @returns {void}
     */
    toggle,

    /** Reset the domain state.
     * @returns {void}
     */
    reset,

    /** Stop the domain service.
     * @returns {void}
     */
    stop: () => stopService(service),

    lookups
  };
};

/** The return type of {@link useDac} composable. */
export type UseDac = ReturnType<typeof useDac>;
