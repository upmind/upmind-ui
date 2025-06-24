// --- external
import { computed } from "vue";
import { interpret } from "xstate";
import { useActor } from "@xstate/vue";

// --- internal
import domainMachine from "./domain.machine";

// --- utils
import { map, find, first, debounce, has, isArray, some, get } from "lodash-es";
import {
  stopService,
  DEBOUNCE_DELAY,
  stateMatches,
  useContext,
  contextMatches,
  contextValue,
} from "../../utils";
import { parseDomain } from "./utils";

// --- types
import { DomainTypes, DomainContext, DomainProduct } from "./types";
import type { InterpreterFrom } from "xstate";
import { PAGINATION } from "../query";
import { waitFor } from "xstate/lib/waitFor";

// -----------------------------------------------------------------------------

/**
 * Composable for managing domain selection and search logic using XState and Vue.
 * Provides state, context, and helpers for domain-related flows (DAC, existing, basket).
 *
 * @param value - Initial domain(s) to use as the model.
 * @param options - Optional configuration for the domain type.
 * @param options.type - The type of domain to manage (e.g., "dac", "existing", "basket").
 *                     If not provided, defaults to all available domain types.
 * @returns Domain management API (state, computed, and methods)
 */
export const useDomain = (
  value: string | Array<string> = "",
  options?: {
    type: DomainTypes;
  }
) => {
  // safetycheck to ensure forcedType is valid
  const safeType =
    options?.type && has(DomainTypes, options.type) ? options.type : null;

  const safeModel = map(isArray(value) ? value : [value], parseDomain);

  const context = {
    type: safeType,
    choices: safeType ? null : DomainTypes,
    model: safeModel,
  };

  const service = interpret(domainMachine.withContext(context as any), {
    devTools: false,
  });

  const { state, send }: any = useActor(service.start());

  // --- state

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => !stateMatches(state, ["subscribing", "loading"]),
      { timeout: Infinity }
    ).then(state => {
      return true;
    });
  }

  const meta = computed(() => {
    return {
      isLoading: stateMatches(state, ["subscribing", "loading"]),
      isSyncing: stateMatches(state, [
        "dac.processingBasket",
        "basket.processing",
      ]),
      isSearching: stateMatches(state, [
        "dac.loading",
        "dac.processing",
        "existing.loading",
        "existing.processing",
        "basket.loading",
      ]),
      isSearchingMore:
        stateMatches(state, ["dac.loading", "dac.processing"]) &&
        pagination.value.offset > 0,
      hasMoreSearchResults:
        stateMatches(state, ["dac"]) &&
        pagination.value.offset + pagination.value.limit <
          pagination.value.total,
      hasErrors: stateMatches(state, [
        "error",
        "dac.error",
        "existing.error",
        "basket.error",
      ]),
      showChoices: contextMatches(state, "choices"),
      showDac: stateMatches(state, ["dac"]),
      showExisting: stateMatches(state, ["existing"]),
      showBasket: stateMatches(state, ["basket"]),
      isValid:
        stateMatches(state, ["dac.valid", "existing.valid", "basket.valid"]) &&
        contextMatches(state, "model"),

      showSelected:
        stateMatches(state, [
          "dac.complete",
          "existing.complete",
          "basket.complete",
        ]) && contextMatches(state, "model"),
    };
  });

  // --- context

  const choices = computed(() =>
    map(
      contextValue<DomainContext["choices"]>(state, "choices"),
      (value, key) => ({ value: key, label: value })
    )
  );

  const query = useContext<string>(state, "search.query");

  const model = useContext<DomainContext["model"]>(state, "model");
  // model: computed(() => map(state.value.context.model, "domain")),

  const domains = computed(() => map(model.value, "domain"));

  const type = useContext<DomainContext["type"]>(state, "type");

  const owned = useContext<DomainProduct[]>(state, "lookups.owned", []);

  const basket = useContext<DomainProduct[]>(state, "lookups.basket", []);

  const available = useContext<DomainProduct[]>(state, "lookups.searched", []);

  const errors = useContext<DomainContext["error"]>(state, "error");

  const selected = computed(() => {
    const selected = find(model.value, "selected") || first(model.value);
    return get(selected, "domain");
  });

  const search = useContext<DomainContext["search"]>(state, "search");

  const pagination = computed(() => ({
    offset: search.value?.offset ?? PAGINATION.offset,
    limit: search.value?.limit ?? PAGINATION.pageSize,
    total: search.value?.total ?? 0,
  }));

  // --- methods

  function choose(value: string): void {
    send({
      type: "CHOOSE",
      data: value,
    });
  }

  function searchDomains(query: string): void {
    send({ type: "SEARCH", data: query });
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
      data: value,
    });
  }

  function update(model: string | Array<string>): void {
    send({
      type: "UPDATE",
      data: isArray(model) ? model : [model],
    });
  }

  function reset(): void {
    send({
      type: "RESET",
    });
  }

  function add(value: string): void {
    send({
      type: "ADD",
      data: value,
    });
  }

  function remove(value: string): void {
    send({
      type: "REMOVE",
      data: value,
    });
  }

  function select(value: string): void {
    send({
      type: "SELECT",
      data: value,
    });
  }

  function addToBasket(): void {
    send({
      type: "ADD_UPDATE_MANY",
    });
  }

  function isSelected(value: string): boolean {
    return some(model.value, { domain: value });
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
     * @property {boolean} isLoading - Indicates if the domain state is loading.
     * @property {boolean} isSyncing - Indicates if the domain state is syncing.
     * @property {boolean} isSearching - Indicates if a search is in progress.
     * @property {boolean} isSearchingMore - Indicates if more search results are being loaded.
     * @property {boolean} hasMoreSearchResults - Indicates if there are more search results.
     * @property {boolean} hasErrors - Indicates if there are any errors.
     * @property {boolean} showChoices - Indicates if choices should be shown.
     * @property {boolean} showDac - Indicates if DAC view is active.
     * @property {boolean} showExisting - Indicates if existing view is active.
     * @property {boolean} showBasket - Indicates if basket view is active.
     * @property {boolean} isValid - Indicates if the current model is valid.
     * @property {boolean} showSelected - Indicates if a selection is shown.
     */
    meta,

    // --- context

    /**
     * List of available choices.
     */
    choices,

    /**
     * The current search query.
     */
    query,

    /**
     * The current model (selected domains).
     */
    model,

    /**
     * List of domain values in the model.
     * @typedef {Array<string>} DomainValues
     */
    domains,

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
    search: debounce(searchDomains, DEBOUNCE_DELAY),

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

    /** Add all selected domains to the basket.
     * @returns {void}
     */
    addToBasket,

    /** Check if a domain value is selected in the model.
     * @param {string} value - The domain value to check.
     * @returns {boolean} True if the value is selected, false otherwise.
     */
    isSelected,

    /** Stop the domain service.
     * @returns {void}
     */
    stop: () => stopService(service as InterpreterFrom<any>),
  };
};

/**
 * The return type of useDomain composable.
 */
export type UseDomain = ReturnType<typeof useDomain>;
