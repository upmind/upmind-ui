// --- external
import { computed, onUnmounted, ref, watchEffect } from "vue";

// --- internal
import { useQuerySubscription } from "@upmind-automation/headless";

// --- utils
import { isEqual } from "lodash-es";

// ---types
import type {
  QueryCacheNotifyEvent,
  QuerySubscriptionFilter,
} from "@upmind-automation/headless";
import { isEmpty } from "lodash-es";
import { QueryKey } from "@tanstack/vue-query";
// -----------------------------------------------------------------------------

export const useQuery = (queryKey: QueryKey) => {
  const meta = ref({
    isLoading: false,
    isStale: false,
    hasError: false,
    isEmpty: false,
  });
  const data = ref([]);
  const error = ref(undefined);

  const queryFilter: QuerySubscriptionFilter = (event: QueryCacheNotifyEvent) =>
    isEqual(event.query.queryKey, queryKey);

  const unsubscrbe = useQuerySubscription(update, queryFilter);

  function update({ query, type }: QueryCacheNotifyEvent) {
    const newMeta = meta.value;

    switch (query.state.status) {
      case "error":
        error.value = query.state.error;
        newMeta.hasError = true;

      case "pending":
        newMeta.isLoading = true;
        newMeta.isStale = false;
        newMeta.isEmpty = false;
        newMeta.hasError = false;
        break;

      case "success":
        data.value = query.state.data;
        error.value = undefined;
        newMeta.isLoading = false;
        newMeta.isStale = false;
        newMeta.isEmpty = isEmpty(query.state.data);
        newMeta.hasError = false;
        break;
      default:
        break;
    }

    meta.value = newMeta;
  }

  watchEffect(() => {
    console.log("delta", {
      meta: meta.value,
      data: data.value,
      error: error.value,
    });
  });

  // --- housekeeping
  onUnmounted(() => {
    unsubscrbe();
  });
  // ---------------------------------------------------------------------------

  return {
    meta,
    data,
    error,
  };
};
