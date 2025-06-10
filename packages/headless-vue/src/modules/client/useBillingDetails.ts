// --- internal
import { computed } from "vue";
import { useQuery } from "../query";
import { useSession } from "../session";

// --- types
import {
  type UnifiedAddress,
  useBillingDetails as useUpmindBillingDetails,
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export const useBillingDetails = () => {
  // this will change to be a manager of ALL addresses, for now it's a single instance (add/update)

  const { meta: sessionMeta } = useSession();

  const {
    isReady,
    queryOptions,
    invalidate,
    remove,
    setDefault,
    getDefault,
    getCached,
    getAll,
    filter,
    getOne,
    findOne,
    refresh,
    meta: metaBillingDetails,
  } = useUpmindBillingDetails();

  const { error, meta, data } = useQuery<UnifiedAddress[]>(
    queryOptions.queryKey
  );

  // ---------------------------------------------------------------------------
  return {
    error,
    meta: computed(() => {
      return {
        ...meta.value,
        ...metaBillingDetails(),
        isAvailable: sessionMeta.value.isAuthenticated,
      };
    }),
    data,
    // ---
    isReady,
    remove,
    setDefault,
    getDefault,
    getCached,
    getAll,
    filter,
    getOne,
    findOne,
    invalidate,
    refresh,
  };
};
