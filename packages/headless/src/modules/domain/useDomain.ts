// --- external
import { waitFor } from "xstate/lib/waitFor";
import { computed } from "vue";
import { interpret } from "xstate";
import { useActor } from "@xstate/vue";

// --- internal
import { useI18n } from "../system";
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
  find,
  first,
  includes,
  reject
} from "lodash-es";
import {
  stopService,
  stateMatches,
  useContext,
  contextMatches,
  contextValue,
  DEBOUNCE_DELAY,
  DOMAIN_LIKE_VALIDATION,
  useChildActor
} from "../../utils";
import { parseDomain } from "./utils";
import { parsePrice } from "../product/utils";

// --- types
import {
  DomainTypes,
  type DomainContext,
  type DomainProduct,
  type IDomainAvailabilityResponse
} from "./types";
import { PAGINATION } from "../query";

export type DomainChoice = { value: DomainTypes; label: string };

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
    required?: boolean;
  } = {
    type: undefined
  }
) => {
  const { t } = useI18n();
  const { getParam, setParam, unsetParam } = useQueryParams();

  // safety check to ensure forcedType is valid
  const safeType =
    options?.type && has(DomainTypes, options.type) ? options.type : undefined;

  const service = interpret(
    domainMachine.withContext({
      type: safeType,
      choices: safeType,
      required: options?.required,
      model: parseDomain(value),
      preferredCycle: getParam(QUERY_PARAMS.BILLING_CYCLE_MONTHS),
      coupons: getParam(QUERY_PARAMS.COUPONS),
      search: {
        query: getParam(QUERY_PARAMS.SEARCH, ""), // Get any initial search query from URL
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
    const domain = contextValue<DomainContext["model"]>(state, "model")?.domain;
    const isInBasket =
      !!domain &&
      some(contextValue<DomainProduct[]>(state, "lookups.basket"), [
        "domain",
        domain
      ]);

    return {
      isLoading: stateMatches(state, ["subscribing", "loading"]),

      isProcessing:
        stateMatches(state, ["dac"]) &&
        some(available.value, "meta.processing"),

      isSearching:
        stateMatches(state, ["dac"]) &&
        stateMatches(dac, "searching") &&
        (query.value?.length ?? 0) > 2,

      isSearchingMore:
        stateMatches(state, ["dac"]) &&
        stateMatches(dac, "searching") &&
        (query.value?.length ?? 0) > 2 &&
        pagination.value.offset > 0,

      hasMoreSearchResults:
        stateMatches(state, ["dac"]) &&
        pagination.value.offset + pagination.value.limit <
          pagination.value.total,

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
      showSummary:
        (stateMatches(state, ["basket"]) &&
          stateMatches(state, ["basket.valid"]) &&
          contextMatches(state, "model")) ||
        (stateMatches(state, ["existing"]) &&
          !!contextValue<DomainContext["model"]>(state, "model")?.domain),
      isValid:
        (stateMatches(dac, ["valid"]) && contextMatches(dac, "model")) ||
        (stateMatches(state, ["existing.valid", "basket.valid"]) &&
          contextMatches(state, "model")),
      showSelected:
        stateMatches(state, [
          "dac.complete",
          "existing.complete",
          "basket.complete"
        ]) && contextMatches(state, "model"),

      // --- SmartDomainField canonical flags
      isSkip: stateMatches(state, "skip"),
      isExistingInvalid: stateMatches(state, "existing.invalid"),
      isExistingValidating: stateMatches(state, "existing.validating"),
      isExistingChecked: stateMatches(state, "existing.checked"),
      isExistingRegisterable: stateMatches(state, "existing.registerable"),
      isExistingRegistering:
        stateMatches(state, "existing.registering") ||
        (stateMatches(state, "existing.valid") && !isInBasket),
      isExistingTransferring:
        stateMatches(state, "existing.transferring") ||
        (stateMatches(state, "existing.transferred") && !isInBasket),
      isExistingTransferred:
        stateMatches(state, "existing.transferred") && isInBasket,
      isExistingRemoving: stateMatches(state, "existing.removing"),
      isExistingUnavailable: stateMatches(state, "existing.unavailable"),
      isExistingValid: stateMatches(state, "existing.valid") && isInBasket,
      isExistingError: stateMatches(state, "existing.error"),
      canTransfer:
        stateMatches(state, ["existing.checked", "existing.transferred"]) &&
        !!contextValue(state, "availabilityResult")
    };
  });

  // --- context

  const context = useContext<DomainContext>(state);

  const choices = computed((): DomainChoice[] =>
    map(contextValue<DomainContext["choices"]>(state, "choices"), type => ({
      value: type,
      label: type
    }))
  );

  const model = computed(
    () => contextValue<DomainContext["model"]>(state, "model")?.domain
  );

  const type = useContext<DomainContext["type"]>(state, "type");

  const owned = useContext<DomainProduct[]>(state, "lookups.owned", []);

  const filteredOwned = computed(() => {
    const domain = model.value;
    if (!domain || DOMAIN_LIKE_VALIDATION.test(domain)) return null;
    const matches = reject(
      filter(owned.value, item => includes(item.domain, domain)),
      ["domain", domain]
    );
    return matches.length ? matches : null;
  });

  const basket = useContext<DomainProduct[]>(state, "lookups.basket", []);

  const errors = useContext<DomainContext["error"]>(state, "error");

  const selected = computed(() => get(contextValue(state, "model"), "domain"));

  // --- dac context

  const dac = useChildActor(state, "dac");

  const available = useContext<DomainProduct[]>(dac, "lookups.searched", []);

  const added = computed(() =>
    map(contextValue<DomainProduct[]>(dac, "model"), "domain")
  );

  const search = useContext<DomainContext["search"]>(state, "search");

  const query = useContext<string>(dac, "search.query");

  const pagination = computed(() => ({
    offset: search.value?.offset ?? PAGINATION.offset,
    limit: search.value?.limit ?? PAGINATION.limit,
    total: search.value?.total ?? 0
  }));

  // --- methods

  function choose(value?: string | DomainTypes): void {
    if (!value) return;

    if (import.meta.env.DEV && typeof value === "number") {
      console.error(
        `[useDomain] choose() received a number (${value}) — expected a DomainTypes string. This likely means a consumer is passing choice.value from the old numeric-index format. Update to use the new DomainChoice shape.`
      );
    }

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

  // --- existing flow methods

  const availabilityResult = useContext<
    IDomainAvailabilityResponse | undefined
  >(state, "availabilityResult");

  const pricing = computed(() => {
    const product = availabilityResult.value?.product;
    if (product) {
      const prices = product.prices ?? [];
      const annual = find(prices, (p: any) => p.billing_cycle_months === 12);
      const priceEntry = annual ?? first(prices);
      if (priceEntry) {
        return {
          price: parsePrice(priceEntry).currentPrice,
          cycle: priceEntry.billing_cycle_months ?? 12
        };
      }
    }
    // Fallback: basket product pricing (on remount, availabilityResult
    // is lost but the basket product has its own price data)
    const domain = selected.value;
    if (domain) {
      const matched = find(basket.value, ["domain", domain]);
      if (matched) {
        return {
          price: matched.price?.currentAmount
            ? matched.price.currentPrice
            : (matched?.meta?.renewalPrice ?? ""),
          cycle: 12
        };
      }
    }
    return null;
  });

  function addTransfer(): void {
    send({ type: "ADD_TRANSFER" });
  }

  function addRegistration(): void {
    send({ type: "ADD_REGISTRATION" });
  }

  function removeTransfer(): void {
    send({ type: "REMOVE_TRANSFER" });
  }

  function clearExisting(): void {
    send({ type: "UPDATE", data: [""] });
  }

  /** Re-enter editing from summary, auto-selecting basket type if the domain is in the basket. */
  function change(): void {
    if (some(basket.value, ["domain", model.value])) {
      choose(DomainTypes.basket);
    }
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
     * Owned domains filtered by the current model value.
     * Excludes exact matches and returns null when domain-like.
     */
    filteredOwned,

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

    // --- existing flow

    /** Availability result for the current domain (transfer price, renewal info). */
    availabilityResult,

    /** Pricing derived from the availability result with basket fallback ({ price, cycle }). */
    pricing,

    /** Add a transfer product to the basket for the current domain. */
    addTransfer,

    /** Add a registration product to the basket for the current domain. */
    addRegistration,

    /** Remove the transfer product from the basket. */
    removeTransfer,

    /** Clear the existing domain input and reset to invalid state. */
    clearExisting,

    /** Re-enter editing from summary, auto-selecting basket type if the domain is in the basket. */
    change,

    /** Check if a string looks like a valid domain name. */
    isDomainLike: computed(() =>
      DOMAIN_LIKE_VALIDATION.test(
        get(contextValue(state, "model"), "domain") ?? ""
      )
    ),

    /** Stop the domain service.
     * @returns {void}
     */
    stop: () => stopService(service),

    stopDac: () => dac.value?.send("STOP")
  };
};

/** The return type of {@link useDomain} composable. */
export type UseDomain = ReturnType<typeof useDomain>;
