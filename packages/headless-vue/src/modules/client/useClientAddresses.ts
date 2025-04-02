import { computed } from "vue";

// --- internal
import {
  useQuery as useUpmindQuery,
  useClientAddress as useUpmindClientAddress,
  useClientAddresses as useUpmindClientAddresses,
} from "@upmind-automation/headless";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

// --- utils
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

export const useClientAddresses = () => {
  // this will change to be a manager of ALL addresses, for now its a single instance (add/update)

  const {
    isReady,
    queryKey,
    remove,
    setDefault,
    getDefault,
    getAllFromCache,
    getAll,
    filter,
    getOne,
    findOne,
    getPaged,
  } = useUpmindClientAddresses();

  debugger;
  const queryClient = useQueryClient();
  debugger;
  const query = useQuery({ queryKey, queryFn: () => getAll() });
  debugger;
  // ---

  // ---------------------------------------------------------------------------
  return {
    errors: query.error,
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isAvailable: !query.isPending.value && !query.isError.value,
      isLoading: query.isPending.value,

      hasErrors: query.isError.value,
      isEmpty: isEmpty(query.data.value),
    })),
    // ---
    items: query.data,

    // ---
    isReady,
    remove,
    setDefault,
    getDefault,
    getAllFromCache,
    getAll,
    filter,
    getOne,
    findOne,
    getPaged,
    invalidate: () => {},
  };
};
