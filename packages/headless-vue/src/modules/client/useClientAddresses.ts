// --- internal
import { computed } from "vue";
import { useQuery } from "../query";
import {
  useClientAddress as useUpmindClientAddress,
  useClientAddresses as useUpmindClientAddresses,
} from "@upmind-automation/headless";

import { useSession } from "../session";
// --- utils

// -----------------------------------------------------------------------------

export const useClientAddresses = () => {
  // this will change to be a manager of ALL addresses, for now its a single instance (add/update)

  const { meta: sessionMeta } = useSession();

  const {
    isReady,
    queryOptions,
    invalidate,
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

  const { error, meta, data } = useQuery(queryOptions.queryKey);
  // ---------------------------------------------------------------------------
  return {
    error,
    meta: computed(() => {
      return {
        ...meta.value,
        isAvailable: sessionMeta.value.isAuthenticated,
      };
    }),
    data,
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
    invalidate,
  };
};
