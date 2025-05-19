// --- external
import { computed, onUnmounted, ref } from "vue";

// --- internal
import { useQuerySubscription } from "@upmind-automation/headless";

// --- utils
import { isEmpty } from "lodash-es";

// ---types
import type { QueryKey } from "@tanstack/vue-query";
import type { QueryCacheNotifyEvent } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

export const useQuery = <T = unknown>(queryKey: QueryKey) => {
  const query = ref<QueryCacheNotifyEvent["query"]["state"]>();

  const observer = useQuerySubscription(
    queryKey,
    (response: QueryCacheNotifyEvent["query"]) => {
      query.value = response.state;
    }
  );

  // --- housekeeping
  onUnmounted(() => {
    observer.unsubscribe();
  });

  // ---------------------------------------------------------------------------

  return {
    meta: computed(() => ({
      isLoading: query.value?.fetchStatus === "fetching",
      isEmpty: isEmpty(query.value?.data?.data),
      isError: !isEmpty(query.value?.error),
      // isInvalid: query.value?.data.isInvalid,
      // isStale: query.value?.data.isStale,
      // isFetching: query.value?.fetchStatus === "fetching",
      // isSuccess: query.value?.status === "success",
      // isIdle: query.value?.fetchStatus === "idle",
    })),
    data: computed<T>(() => query.value?.data?.data ?? []),
    error: computed<QueryCacheNotifyEvent["query"]["state"]["error"]>(
      () => query.value?.error
    ),
  };
};
