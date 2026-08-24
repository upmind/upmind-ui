import { useActor } from "@xstate/vue";
import { computed } from "vue";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import {
  calculateBillingTerm,
  parseTermDetails
} from "../product/product.utils";
import { PAGINATION } from "../query";
import { QUERY_PARAMS, useQueryParams } from "../routing";
import { useI18n } from "../system-localisation";
import domainMachine from "./domain.machine";
import {
  DomainTypes,
  type DomainContext,
  type DomainProduct,
  type DomainOptions
} from "./domain.types";
import {
  getTransferOptionPrice,
  parseDomain,
  sanitiseDomainInput,
  useDomainSearchMethod
} from "./domain.utils";
import {
  stopService,
  stateMatches,
  useContext,
  contextMatches,
  contextValue,
  DOMAIN_LIKE_VALIDATION,
  useChildActor
} from "../../utils";
import {
  map,
  has,
  isArray,
  some,
  get,
  isEmpty,
  filter,
  find,
  includes,
  reject
} from "lodash-es";
import type { BasketProduct } from "../basket-product/basket-product.types";
import type { IDomainAvailabilityResponse } from "@upmind-automation/types";

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
 * @param options.tlds - Restricts the DAC search to these TLDs.
 * @returns Domain management API (state, computed, and methods)
 */
export const useDomain = (
  value: string,
  options: DomainOptions = { type: undefined }
) => {
  const { t: _t } = useI18n();
  const { getParam, setParam: _setParam, unsetParam } = useQueryParams();

  // safety check to ensure forcedType is valid
  const safeType =
    options?.type && has(DomainTypes, options.type) ? options.type : undefined;

  // Determine search flow from brand setting. Threaded into the parent
  // context so `domain.machine` can pass it down to the dac child actor —
  // without this, the child defaults to legacy and the new /suggestions
  // + /suggestions/tlds flow never fires.
  const { useSuggestions } = useDomainSearchMethod();

  const service = interpret(
    domainMachine.withContext({
      type: safeType,
      // `choices` is the *array* of available {@link DomainTypes} the user
      // can pick between — when the parent forces a single type, narrow to
      // that one; otherwise let `setContext` fill all types as the default.
      choices: safeType ? [safeType] : [],
      required: options?.required ?? true,
      model: parseDomain(value),
      preferredCycle: getParam(QUERY_PARAMS.BILLING_CYCLE_MONTHS),
      coupons: getParam(QUERY_PARAMS.COUPONS),
      tlds: options?.tlds,
      useSuggestions,
      // `setContext` + `setBasketHelper` overwrite these on entry, but
      // `withContext` requires the full `DomainContext` shape — keeping
      // the placeholders explicit avoids an `as any` cast.
      lookups: { owned: [], basket: [] },
      parseBasketProduct: () => undefined,
      parseProductModel: () => undefined,
      search: {
        // Sanitise the URL-seeded query so the dac machine + search service
        // see the same shape they would for a runtime SEARCH event.
        query: sanitiseDomainInput(getParam(QUERY_PARAMS.SEARCH, "") ?? ""),
        limit: PAGINATION.limit,
        offset: PAGINATION.offset
      }
    }),
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
    const isOwned =
      !!domain &&
      some(contextValue<DomainProduct[]>(state, "lookups.owned"), [
        "domain",
        domain
      ]);

    return {
      isLoading: stateMatches(state, ["subscribing", "loading"]),

      isProcessing:
        stateMatches(state, ["dac"]) &&
        some(available.value, "meta.processing"),

      // Cover dac.loading (the brief between-request sub-state) as well as
      // dac.searching — like isSearchingMore below — so the flag doesn't dip
      // between the multi-phase search's requests and flicker the loader off/on.
      isSearching:
        stateMatches(state, ["dac"]) &&
        stateMatches(dac, ["loading", "searching"]) &&
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
      showChoices: contextValue<string[]>(state, "choices", [])!.length > 1,
      showDac: stateMatches(state, ["dac"]),
      showSearchResults:
        stateMatches(state, "dac") &&
        !isEmpty(available.value) &&
        !!query.value,
      showExisting: stateMatches(state, ["existing"]),
      showBasket: stateMatches(state, ["basket"]),
      showSummary:
        (stateMatches(state, ["basket.valid"]) &&
          contextMatches(state, "model")) ||
        stateMatches(state, ["existing.valid", "existing.transferred"]),
      isValid:
        (stateMatches(dac, ["valid"]) && contextMatches(dac, "model")) ||
        (stateMatches(state, ["existing.valid", "basket.valid"]) &&
          contextMatches(state, "model")),
      showSelected:
        stateMatches(state, "basket.complete") &&
        contextMatches(state, "model"),

      // --- SmartDomainField canonical flags
      isSkip: stateMatches(state, "skip"),
      isExistingValidating: stateMatches(state, "existing.validating"),
      isExistingChecked: stateMatches(state, "existing.checked"),
      isExistingRegisterable: stateMatches(state, "existing.registerable"),
      // True while registration is in-flight OR completed but not yet reflected in basket
      isExistingPendingRegistration:
        stateMatches(state, "existing.registering") ||
        (stateMatches(state, "existing.valid") && !isInBasket && !isOwned),
      // True while transfer is in-flight OR completed but not yet reflected in basket
      isExistingPendingTransfer:
        stateMatches(state, "existing.transferring") ||
        (stateMatches(state, "existing.transferred") && !isInBasket),
      isExistingTransferred:
        stateMatches(state, "existing.transferred") && isInBasket,
      isExistingRemoving: stateMatches(state, "existing.removing"),
      isExistingUnavailable: stateMatches(state, "existing.unavailable"),
      isExistingValid: stateMatches(state, "existing.valid") && isInBasket,
      isExistingOwned: stateMatches(state, "existing.valid") && isOwned,
      isExistingError: stateMatches(state, "existing.error"),
      // Denylist over allowlist: any new `existing.X` sub-state
      // inherits `hasInfo: true` by default — opt OUT here only if the
      // info panel should stay hidden (e.g. validating spinner,
      // unavailable terminal state, or the initial `invalid` state
      // reached while the user is still typing a non-domain string).
      hasInfo:
        stateMatches(state, "existing") &&
        !stateMatches(state, [
          "existing.invalid",
          "existing.validating",
          "existing.unavailable"
        ])
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

  const availability = useContext<IDomainAvailabilityResponse | undefined>(
    state,
    "availability"
  );

  const pricing = computed(() => {
    const product = availability.value?.product;
    if (product) {
      // Use the same term-selection pipeline as the DAC's `parseSuggestions`
      // (`parseTermDetails` + `calculateBillingTerm`). Without this we were
      // hard-coding `billing_cycle_months: 12` here while the DAC respected
      // the brand's `default_payment_period` / `INHERIT_FROM_BRAND` /
      // `LOWEST_PRICE` etc., so a `.com` whose brand default is 36mo would
      // render as "£22.50/3yr" in the DAC card but "£8.98/yr" in the
      // SmartDomainField transfer copy. Match the DAC source of truth.
      const preferredCycle = contextValue<number | undefined>(
        state,
        "preferredCycle"
      );
      const terms = parseTermDetails(product);
      const termDetails = !isEmpty(terms)
        ? calculateBillingTerm(
            preferredCycle ?? product.default_payment_period,
            terms
          )
        : undefined;
      if (termDetails) {
        const matchingPrice = find(product.prices, {
          billing_cycle_months: termDetails.cycle
        });
        const transferOption = getTransferOptionPrice(
          product,
          matchingPrice?.currency_code
        );
        return {
          price: termDetails.price?.currentPrice ?? "",
          // Always-undiscounted price the user pays on every renewal,
          // exposed separately so the SmartDomainField transfer copy
          // ("Subsequent renewals charged at …") can stay aligned with
          // the DAC card's "Renewals start from {regularPrice}/{term}"
          // line — both must reflect the regular price, not the promo.
          regularPrice: termDetails.price?.regularPrice ?? "",
          cycle: termDetails.cycle,
          transferOptionPrice: transferOption?.price,
          transferOptionIsFree: transferOption?.isFree
        };
      }
    }
    // Fallback: basket product pricing (on remount / re-entry of the
    // existing-domain flow, the availability check has not re-run so
    // `availability.value?.product` is undefined, but the basket entry
    // still carries the parent IProduct on `matched.product`).
    //
    // CRITICAL: do NOT use `matched.price` as the renewal price. For a
    // transferred domain the basket entry IS the transfer sub-product —
    // `matched.price` is the one-off TRANSFER cost (often £0 for free
    // transfers), not the parent product's renewal price. Reading it
    // would render "Subsequent renewals charged at £0.00/yr".
    //
    // Instead, run the parent IProduct (`matched.product`) through the
    // same `parseTermDetails` + `calculateBillingTerm` pipeline used by
    // the availability path, so the renewal line and transfer copy show
    // the same numbers the DAC card and the first-visit availability
    // check would have shown.
    const domain = selected.value;
    if (domain) {
      const matched = find(basket.value, ["domain", domain]);
      // `parseBasketProduct` (basketProduct/utils) attaches the raw parent
      // IProduct as `product` on the returned BasketProduct. The machine
      // casts it to `DomainProduct` for type ergonomics, which loses that
      // field in the type system even though it's there at runtime — narrow
      // back to access it.
      const matchedProduct = (matched as BasketProduct | undefined)?.product;
      if (matched && matchedProduct) {
        const preferredCycle = contextValue<number | undefined>(
          state,
          "preferredCycle"
        );
        const terms = parseTermDetails(matchedProduct);
        const termDetails = !isEmpty(terms)
          ? calculateBillingTerm(
              preferredCycle ?? matchedProduct.default_payment_period,
              terms
            )
          : undefined;
        if (termDetails) {
          const matchingPrice = find(matchedProduct.prices, {
            billing_cycle_months: termDetails.cycle
          });
          const transferOption = getTransferOptionPrice(
            matchedProduct,
            matchingPrice?.currency_code
          );
          return {
            price: termDetails.price?.currentPrice ?? "",
            // See `regularPrice` note on the availability path above.
            regularPrice: termDetails.price?.regularPrice ?? "",
            cycle: termDetails.cycle,
            transferOptionPrice: transferOption?.price,
            transferOptionIsFree: transferOption?.isFree
          };
        }
      }
      // Last-resort fallback when no parent product was captured at
      // basket-parse time — better to show *something* than crash.
      if (matched) {
        return {
          price: matched.price?.currentAmount
            ? matched.price.currentPrice
            : (matched.price?.regularPrice ?? ""),
          regularPrice: matched.price?.regularPrice ?? "",
          cycle: matched.configuration?.term ?? matched.productDetails?.cycle,
          transferOptionPrice: matched.meta?.transferOptionPrice,
          transferOptionIsFree: matched.meta?.transferOptionIsFree
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

  /** Re-enter editing from summary, auto-selecting basket or existing type. */
  function change(): void {
    if (some(basket.value, ["domain", model.value])) {
      choose(DomainTypes.basket);
    } else {
      choose(DomainTypes.existing);
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

    /** Availability response for the current domain (transfer price, renewal info). */
    availability,

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
