// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBrand as useUpmindBrand } from "@upmind/flow";

// --- utils

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBrand = () => {
  const brand = useUpmindBrand();
  const { state } = useActor(brand.service);

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.toStrings()),
    values: computed(() => state.value.context),
    isAvailable: computed(() => ["available"].some(state.value.matches)),
    isProcessing: computed(() => ["loading"].some(state.value.matches)),
    isError: computed(() => ["error"].some(state.value.matches))
  };
};
