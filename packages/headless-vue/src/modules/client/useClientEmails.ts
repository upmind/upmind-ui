// --- internal
import { computed } from "vue";
import { useQuery } from "../query";
import { useSession } from "../session";
import { useClientEmails as useUpmindClientEmails } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export const useClientEmails = () => {
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
  } = useUpmindClientEmails();

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
