// --- external
import { waitFor } from "xstate/lib/waitFor";
import { computed } from "vue";
import { interpret } from "xstate";
import { useActor } from "@xstate/vue";

// --- internal
import { useI18n } from "../system";
import { useBrand } from "../brand";
import { QUERY_PARAMS, useQueryParams } from "../routing";
import domainMachine from "./domain.machine";

// --- utils
import {
  map,
  has,
  isArray,
  some,
  get,
  isEmpty,
  filter,
  includes
} from "lodash-es";
import {
  stopService,
  stateMatches,
  useContext,
  contextMatches,
  contextValue,
  DEBOUNCE_DELAY,
  useChildActor
} from "../../utils";
import { parseDomain, sanitiseDomainInput } from "./utils";

// --- types
import { DomainTypes, type DomainContext, type DomainProduct } from "./types";
import { PAGINATION } from "../query";
import { BrandConfigKeys, DomainSearchMethod } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Composable for managing domain selection and search logic using XState and Vue.
 * Provides state, context, and helpers for domain-related flows (DAC, existing, basket).
 *
 * @param value - Initial domain(s) to use as the model.
 * @param options - required configuration for the domain type.
 * @param options.type - The type of domain to manage (e.g., "dac", "existing", "basket").
 *                     If not provided, defaults to all available domain types.
 * @returns Domain management API (state, computed, and methods)
 */
export const useDomain = (
  value: string,
  options: {
    type?: DomainTypes;
  } = {
    type: undefined
  }
) => {
  const { t } = useI18n();
  const { getParam, setParam, unsetParam } = useQueryParams();
  const { getConfigValue } = useBrand();

  // safety check to ensure forcedType is valid
  const safeType =
    options?.type && has(DomainTypes, options.type) ? options.type : undefined;

  // Determine search flow from brand setting, fallback to legacy lookup.
  // Threaded into the parent context so `domain.machine` can pass it down
  // to the dac child actor — without this, the child defaults to legacy
  // and the new /suggestions + /suggestions/tlds flow never fires.
  const searchMethod =
    getConfigValue<DomainSearchMethod>(BrandConfigKeys.DOMAIN_SEARCH_METHOD) ??
    DomainSearchMethod.LEGACY_LOOKUP;
  const useSuggestions = searchMethod === DomainSearchMethod.SMART_SUGGEST;

  const service = interpret(
    domainMachine.withContext({
      type: safeType,
      choices: safeType,
      model: parseDomain(value),
      preferredCycle: getParam(QUERY_PARAMS.BILLING_CYCLE_MONTHS),
      coupons: getParam(QUERY_PARAMS.COUPONS),
      useSuggestions,
      search: {
        // Sanitise the URL-seeded query so the dac machine + search service
        // see the same shape they would for a runtime SEARCH event.
        query: sanitiseDomainInput(getParam(QUERY_PARAMS.SEARCH, "") ?? ""),
        limit: PAGINATION.limit,
        offset: PAGINATION.offset
      }
    } as any),
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
    return {
      isLoading: stateMatches(state, ["subscribing", "loading"]),

      isProcessing:
        stateMatches(state, ["dac"]) &&
        some(available.value, "meta.processing"),

      isSearching:
        stateMatches(state, ["dac"]) &&
        stateMatches(dac, "searching") &&
        (query.value?.length ?? 0) > 2,

      // True for the *entire* Load more cycle — covers both the brief
      // dac.loading sub-state and dac.searching. The page>1 / offset>0 guard
      // means this never fires for an initial search.
      isSearchingMore:
        stateMatches(state, ["dac"]) &&
        stateMatches(dac, ["loading", "searching"]) &&
        (query.value?.length ?? 0) > 2 &&
        (pagination.value.totalPages > 0
          ? pagination.value.page > 1
          : pagination.value.offset > 0),

      hasMoreSearchResults:
        stateMatches(state, ["dac"]) &&
        (pagination.value.totalPages > 0
          ? pagination.value.page < pagination.value.totalPages
          : pagination.value.offset + pagination.value.limit <
            pagination.value.total),

      hasErrors:
        stateMatches(state, ["error", "existing.error", "basket.error"]) ||
        stateMatches(dac, ["error"]),

      isEmpty: isEmpty(selected.value) && isEmpty(added.value),
      hasAvailable: !isEmpty(available.value),
      showChoices: contextValue(state, "choices", [])!.length > 1,
      showDac: stateMatches(state, ["dac"]),
      showSearchResults:
        stateMatches(state, "dac") &&
        !isEmpty(available.value) &&
        !!query.value,
      showExisting: stateMatches(state, ["existing"]),
      showBasket: stateMatches(state, ["basket"]),
      isValid:
        (stateMatches(dac, ["valid"]) && contextMatches(dac, "model")) ||
        (stateMatches(state, ["existing.valid", "basket.valid"]) &&
          contextMatches(state, "model")),
      showSelected:
        stateMatches(state, [
          "dac.complete",
          "existing.complete",
          "basket.complete"
        ]) && contextMatches(state, "model")
    };
  });

  // --- context

  const context = useContext<DomainContext>(state);

  const choices = computed(() =>
    map(
      contextValue<DomainContext["choices"]>(state, "choices"),
      (value, key) => ({ value: key, label: value })
    )
  );

  const model = computed(
    () => contextValue<DomainContext["model"]>(state, "model")?.domain
  );

  const type = useContext<DomainContext["type"]>(state, "type");

  const owned = useContext<DomainProduct[]>(state, "lookups.owned", []);

  const basket = useContext<DomainProduct[]>(state, "lookups.basket", []);

  const errors = useContext<DomainContext["error"]>(state, "error");

  const selected = computed(() => get(contextValue(state, "model"), "domain"));

  // --- dac context

  const dac = useChildActor(state, "dac");

  const available = useContext<DomainProduct[]>(dac, "lookups.searched", []);

  const added = computed(() =>
    map(contextValue<DomainProduct[]>(dac, "model"), "domain")
  );

  // Pagination state lives on the dac child actor — `setSearchResults`
  // mutates dac.search, not the parent context. Reading from the parent
  // would give a stale snapshot (totalPages never updates → no Load more).
  const search = useContext<DomainContext["search"]>(dac, "search");

  const query = useContext<string>(dac, "search.query");

  const pagination = computed(() => ({
    offset: search.value?.offset ?? PAGINATION.offset,
    limit: search.value?.limit ?? PAGINATION.limit,
    total: search.value?.total ?? 0,
    page: search.value?.page ?? 1,
    totalPages: search.value?.totalPages ?? 0
  }));

  // --- methods

  function choose(value?: string | DomainTypes): void {
    if (!value) return;

    send({
      type: "CHOOSE",
      data: value
    });
  }

  function searchDomains(query?: string) {
    if (!query) return;
    send({ type: "SEARCH", data: query });
  }

  function searchMore(): void {
    send({ type: "SEARCH.OFFSET" });
  }

  function toggle(value: string): void {
    const type =
      isArray(added.value) && some(added.value, { domain: value })
        ? "REMOVE"
        : "ADD";
    send({
      type,
      data: value
    });
  }

  function update(value?: string | Array<string>): void {
    if (!value) return;
    send({
      type: "UPDATE",
      data: isArray(value) ? value : [value]
    });
    // housekeeping: clear search param on update
    unsetParam("search");
  }

  function reset(): void {
    send({ type: "RESET" });
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

  function select(value?: string): void {
    if (!value) return;
    send({
      type: "SELECT",
      data: value
    });
  }

  function isSelected(value: string): boolean {
    return model.value == value;
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
     * @property {boolean} showSelected - Indicates if a selection is shown.
     */
    meta,

    // --- context

    context,

    /**
     * List of available choices.
     */
    choices,

    /**
     * The current search query.
     */
    query,

    searchParams: search,

    /**
     * The current model (selected domains).
     */
    model,

    /**
     * The current domain type.
     */
    type,

    /**
     * List of owned domains.
     */
    owned,

    /**
     * List of domains in the basket.
     */
    basket,

    /**
     * List of available domains.
     */
    available,

    /** List of domains added via the DAC */
    added,

    /**
     * Any errors encountered.
     */
    errors,

    /**
     * The currently selected domain.
     */
    selected,

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

    /** Choose a domain value.
     * @param {string} value - The domain value to choose.
     * @returns {void}
     */
    choose,

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

    /** Update the model with a new value or array of values.
     * @param {string | Array<string>} model - The new value or array of values to update the model with.
     * @returns {void}
     */
    update,

    /** Reset the domain state.
     * @returns {void}
     */
    reset,

    /** Select a domain value.
     * @param {string} value - The domain value to select.
     * @returns {void}
     */
    select,

    /** Check if a domain value is selected in the model.
     * @param {string} value - The domain value to check.
     * @returns {boolean} True if the value is selected, false otherwise.
     */
    isSelected,

    /** Stop the domain service.
     * @returns {void}
     */
    stop: () => stopService(service),

    stopDac: () => dac.value?.send("STOP")
  };
};

/** The return type of {@link useDomain} composable. */
export type UseDomain = ReturnType<typeof useDomain>;
