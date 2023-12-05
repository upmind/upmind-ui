// --- external
import { computed, ref, watch } from "vue";

// --- internal
import { useApi } from "@upmind/flow";

// --- utils
import { parseResults } from "../utils";

import {
  compact,
  delay,
  filter,
  find,
  first,
  includes,
  isEmpty,
  omitBy,
  some,
  uniq,
  without
} from "lodash-es";

// ----------------------------------------------------------------------------

export function useDac({
  coupons = [],
  currencyCode,
  limit = 10,
  orderConfigUrl = "",
  modelValue = "",
  multiple = false
}: {
  coupons?: string[];
  currencyCode?: string;
  limit: number;
  orderConfigUrl: string;
  modelValue: string | Array<string>;
  multiple: boolean;
}) {
  // --- Flow

  const { get, useUrl } = useApi();

  // --- Composables
  const controller = ref(null as null | AbortController);

  // --- Data
  const domain = ref(
    (multiple ? first(modelValue || []) : modelValue || "") as string
  );
  const model = ref(modelValue as string | string[]);
  const results = ref([] as any[]);
  const resultsTotal = ref(0);

  // --- State
  const active = ref(false);
  const errors = ref(null as any);
  const processing = ref(false);
  let timer = null as number | null;

  // --- Computed

  const meta = computed(() => ({
    isProcessing: processing.value,
    isEmpty: !results.value.length && !processing.value && !errors.value,
    hasErrors: !!errors.value,
    hasMore:
      !!results.value.length && results.value.length < resultsTotal.value,
    isActive: active.value
  }));

  const sanitised = computed(() => {
    const value = domain.value
      ?.replace(/(^https?:\/\/)?(w{3}\.)?[^a-z0-9\-\.]?/gi, "")
      ?.toLowerCase();

    return {
      value,
      tld: domain.value?.match(/(?:^[^\.]+)(\..{2,})/i)?.[1] || "",
      sld: domain.value?.split(".")?.[0] || ""
    };
  });

  // --- Watchers

  watch(sanitised, ({ sld }) => debounceSearch(sld), { immediate: true });

  // this will alutomatically select any exact matches on our domain search
  watch(results, value => {
    if (find(value, ["domain", domain.value])) {
      if (multiple) {
        model.value = compact(uniq([...model.value, domain.value]));
      } else {
        model.value = domain.value;
      }
    }
  });
  // --- Methods

  function update(value: string | string[]) {
    if (!value.length) {
      model.value = multiple ? [] : "";
    } else {
      // handle toggling of values
      if (multiple) {
        if (!includes(model.value, value)) {
          value = [...model.value, value];
        } else {
          value = without(model.value, value);
        }
      } else {
        value = model.value !== value ? value : "";
      }

      model.value = multiple
        ? compact(
            uniq(filter(value, domain => some(results.value, { domain })))
          )
        : some(results.value, { domain: value })
          ? value
          : "";
    }

    // now update the domain to match the model, or the first value in the model if multiple
    domain.value = multiple ? first(model.value) : model.value;
  }

  function resetSearch(clearErrors: boolean = true) {
    controller.value?.abort();
    controller.value = null;
    if (timer) clearTimeout(timer);
    if (clearErrors) errors.value = false;
  }

  function doSearch(wait: number = 0): void {
    resetSearch();
    // delay resetting the results, so we can show the loading state
    timer = delay(() => {
      resetResults();
      search(sanitised.value.sld, sanitised.value.tld);
    }, wait);
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
    resetSearch();
    if (target) target.focus();
  }

  function loadMore() {
    return search(
      sanitised.value.sld,
      sanitised.value.tld,
      results.value.length
    );
  }

  // ---

  function search(sld: string, tld: string, offset?: number) {
    if (!sld.length) return;
    controller.value = new AbortController();

    processing.value = true;

    // --- Build the request, and Fetch the search results
    const params = omitBy(
      {
        sld,
        with: ["prices", "options", "options.prices", "attributes"].join(),
        limit: limit?.toString(),
        offset: offset?.toString(),
        currency_code: currencyCode,
        // tld,
        promotions: coupons?.join()
      },
      isEmpty
    );

    get({
      url: useUrl("modules/web_hosting/domains/search", params),
      init: { signal: controller.value.signal },
      useCache: true
    })
      .then(response => {
        // --- Update response total

        resultsTotal.value = response?.total || 0;

        // --- Push new data to results array
        results.value = parseResults(
          sld,
          response?.data || [],
          results.value,
          orderConfigUrl
        );
      })
      .catch(error => {
        console.error("useDac", "search", error);
        errors.value = error;
        // useErrorHandler(error, () => (errors.value = error));
      })
      .finally(() => {
        processing.value = false;
      });
  }

  // ---

  return {
    // --- Data
    domain,
    active,
    model,
    // --- Computed
    meta,
    results,
    resultsTotal,
    sanitised,
    // --- Methods
    update,
    reset,
    doSearch,
    loadMore
  };
}
