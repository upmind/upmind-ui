// --- external

// --- internal
import { computed } from "vue";
import { useQuery } from "../query";
import { useSession } from "../session";
import { useBillingDetails as useUpmindBillingDetails } from "@upmind-automation/headless";

// --- utils

// --- types
import type { UnifiedAddress } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export const useBasketBillingDetails = () => {
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
    filter: filterUnifiedAddresses,
    getOne,
    findOne,
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
    filter: filterUnifiedAddresses,
    getOne,
    findOne,
    invalidate,
  };
};
