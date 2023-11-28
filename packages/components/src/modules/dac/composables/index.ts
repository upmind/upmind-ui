// --- external
import { computed, ref, watch } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useApi } from "@upmind/flow";

// --- utils
import { parseResults } from "../utils";

import { omitBy, isEmpty, isArray, first } from "lodash-es";

// ----------------------------------------------------------------------------

export function useDac({
  coupons = [],
  currencyCode,
  limit = 10,
  orderConfigUrl = "",
  modelValue = ""
}: {
  coupons?: string[];
  currencyCode?: string;
  limit: number;
  orderConfigUrl: string;
  modelValue: string | Array<string>;
}) {
  // --- Flow

  const { get, service, useUrl } = useApi();
  const { state, send } = useActor(service);

  // --- Composables

  // --- Data
  modelValue = isArray(modelValue) ? first(modelValue) : modelValue;

  const controller = ref(null as null | AbortController);
  const domain = ref(modelValue || "");
  const hasError = ref(false);
  const isProcessing = ref(false);
  const results = ref([] as any[]);
  const resultsTotal = ref(0);
  const timeout = ref(null as null | NodeJS.Timeout);

  // --- Computed

  const meta = computed(() => ({
    isProcessing: isProcessing.value,
    hasValue: !!domain.value,
    hasResults: !!results.value.length,
    isEmpty: !results.value.length && !isProcessing.value && !hasError.value,
    hasMore: !!results.value.length && results.value.length < resultsTotal.value
  }));

  const sanitised = computed(() => {
    debugger;
    const value = domain.value
      .replace(/(^https?:\/\/)?(w{3}\.)?[^a-z0-9\-\.]?/gi, "")
      .toLowerCase();

    return {
      value,
      tld: domain.value.match(/(?:^[^\.]+)(\..{2,})/i)?.[1] || "",
      sld: domain.value.split(".")?.[0] || ""
    };
  });

  // --- Watchers

  watch(sanitised, ({ value }) => debounceSearch(value), { immediate: true });

  // --- Methods

  function resetSearch() {
    if (controller.value) controller.value.abort();
    if (timeout.value) clearTimeout(timeout.value);
    hasError.value = false;
  }

  function doSearch(delay: number = 0): void {
    resetSearch();
    timeout.value = setTimeout(() => {
      resetResults();
      search(sanitised.value.sld, sanitised.value.tld);
    }, delay);
  }

  function debounceSearch(query: string) {
    if (!query) return Promise.all([resetSearch(), resetResults()]);
    doSearch(300);
  }

  function resetResults(): void {
    results.value = [];
    resultsTotal.value = 0;
  }

  function reset(target?: HTMLInputElement): void {
    domain.value = "";
    if (target) target.focus();
  }

  function loadMore() {
    return search(sanitisedSld.value, sanitisedTld.value, results.value.length);
  }

  // ---

  async function search(sld: string, tld: string, offset?: number) {
    if (!sld.length) return;

    isProcessing.value = true;
    controller.value = new AbortController();

    // --- Build the request, and Fetch the search results
    const params = omitBy(
      {
        sld,
        // with: ["prices", "options", "options.prices", "attributes"].join(),
        limit: limit?.toString(),
        offset: offset?.toString(),
        currency_code: currencyCode,
        tld,
        promotions: coupons?.join()
      },
      isEmpty
    );
    const response = await get({
      url: useUrl("modules/web_hosting/domains/search", params),
      useCache: true
    }).catch(error => {
      console.error("useDac", "search", error);
      // useErrorHandler(error, () => (hasError.value = true));
    });

    // --- Update response total
    resultsTotal.value = response.total;

    // --- Push new data to results array
    results.value = parseResults(
      sld,
      response.data,
      results.value,
      orderConfigUrl
    );

    // } catch (e) {
    // useErrorHandler(e, () => (hasError.value = true));
    // } finally {
    isProcessing.value = false;
    // }
  }

  // ---

  return {
    // --- Data
    domain,
    // --- Computed
    meta,
    results,
    resultsTotal,
    sanitised,
    // --- Methods
    reset,
    doSearch,
    loadMore
  };
}
