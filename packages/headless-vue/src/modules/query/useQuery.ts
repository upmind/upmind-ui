// --- external
import { computed, onUnmounted, ref } from "vue";

// --- internal
import { PAGINATION, useQuerySubscription } from "@upmind-automation/headless";

// --- utils
import { isEmpty } from "lodash-es";

// ---types
import type {
  PaginatedData,
  QueryCacheNotifyEvent,
} from "@upmind-automation/headless";
import type { QueryFilters, QueryKey } from "@tanstack/vue-query";
// -----------------------------------------------------------------------------

export const useQuery = <T = unknown>(
  queryKey: QueryKey,
  options: Omit<QueryFilters, "queryKey"> = { exact: true }
) => {
  const query = ref<QueryCacheNotifyEvent["query"]["state"]>();

  const pagination = ref({
    pages: 0,
    total: 0,
    limit: PAGINATION.pageSize,
    offset: PAGINATION.offset,
  });

  const hasNextPage = ref<boolean>(false);
  const hasPreviousPage = ref<boolean>(false);

  const observer = useQuerySubscription(
    queryKey,
    (response: QueryCacheNotifyEvent["query"]) => {
      query.value = response.state;

      const paged = response.state.data
        ?.pagination as PaginatedData<T>["pagination"];

      if (response.state.status == "success") {
        pagination.value = {
          total: paged?.total ?? response.state.data?.total ?? 0,
          pages: paged?.pages ?? 0,
          limit: paged?.limit ?? PAGINATION.pageSize,
          offset: paged?.offset ?? PAGINATION.offset,
        };

        hasNextPage.value = response.state?.data?.hasNextPage ?? false;
        hasPreviousPage.value = response.state?.data?.hasPreviousPage ?? false;
      }
    },
    options
  );

  // --- housekeeping
  onUnmounted(() => {
    observer.unsubscribe();
  });

  // ---------------------------------------------------------------------------

  return {
    meta: computed(() => {
      return {
        isLoading: query.value?.fetchStatus === "fetching",
        isEmpty: isEmpty(query.value?.data?.data),
        isError: !isEmpty(query.value?.error),
        // isInvalid: query.value?.data.isInvalid,
        // isStale: query.value?.data.isStale,
        // isFetching: query.value?.fetchStatus === "fetching",
        // isSuccess: query.value?.status === "success",
        // isIdle: query.value?.fetchStatus === "idle",
        hasNextPage: hasNextPage.value,
        hasPreviousPage: hasPreviousPage.value,
      };
    }),
    data: computed<T>(() => query.value?.data?.data ?? []),
    error: computed<QueryCacheNotifyEvent["query"]["state"]["error"]>(
      () => query.value?.error
    ),
    pagination: computed(() => pagination.value),
  };
};
