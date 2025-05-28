// --- external

// --- internal
import { useQuery } from "../query";
import {
  buildDynamicQueryKey,
  type PaginatedParams,
  useProductCatalogue as useUpmindProductCatalogue,
  useProductCategories as useUpmindProductCategories,
} from "@upmind-automation/headless";

// --- utils
import { add, subtract } from "lodash-es";

// --- types
import type { Product } from "@upmind-automation/headless";
import { ref } from "vue";
import { QueryKey } from "@tanstack/vue-query";
// -----------------------------------------------------------------------------

export const useProductCatalogue = () => {
  const {
    filter,
    getOne,
    isReady,
    findOne,
    getPaged,
    invalidate,
    queryOptions,
    getAllFromCache,
  } = useUpmindProductCatalogue();
  const queryKey = ref<QueryKey>(queryOptions.queryKey);

  const { error, meta, data, pagination } = useQuery<Product[]>(queryKey.value);

  // ---------------------------------------------------------------------------
  return {
    data,
    meta,
    error,
    pagination,
    // ---
    isReady,
    getAllFromCache,
    filter,
    getOne,
    findOne,
    // this "hack" is needed to ensure that the queryKey is dynamic
    getPaged: (
      paginationParams: PaginatedParams,
      { allowStale = true }: { allowStale?: boolean } = {}
    ) => {
      queryKey.value = buildDynamicQueryKey({
        queryKey: queryOptions.queryKey,
        paginatedParams: paginationParams,
      });
      return getPaged(paginationParams, { allowStale });
    },
    invalidate,
    categories: useUpmindProductCategories(),
    getNextPage: async () => {
      if (
        pagination.value.pages <= 0 ||
        pagination.value.total >= data.value?.length
      )
        return Promise.resolve(data.value ?? []);

      return getPaged({
        pagination: {
          limit: pagination.value.limit,
          offset: Math.min(
            add(pagination.value.offset, pagination.value.limit),
            pagination.value.total
          ),
        },
      });
    },
    getPrevPage: async () => {
      if (pagination.value.pages <= 0 || !data.value?.length)
        return Promise.resolve(data.value ?? []);

      return getPaged({
        pagination: {
          limit: pagination.value.limit,
          offset: Math.max(
            subtract(pagination.value.offset, pagination.value.limit),
            0
          ),
        },
      });
    },
  };
};
