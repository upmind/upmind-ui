// --- external

// --- internal
import { useQuery } from "../query";
import { useProductCatalogue as useUpmindProductCatalogue } from "@upmind-automation/headless";

// --- utils
import { add, subtract } from "lodash-es";

// --- types
import type { Product } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

export const useProductCatalogue = ({
  limit = 12,
}: {
  limit?: number;
} = {}) => {
  const {
    isReady,
    queryOptions,
    invalidate,
    getAllFromCache,
    filter,
    getOne,
    findOne,
    getPaged,
  } = useUpmindProductCatalogue();

  const { error, meta, data, pagination } = useQuery<Product[]>(
    queryOptions.queryKey
  );

  // Create safe computed properties

  // ---------------------------------------------------------------------------
  return {
    error,
    meta,
    data,
    pagination,
    // ---
    isReady,
    getAllFromCache,
    filter,
    getOne,
    findOne,
    getPaged,
    invalidate,
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
