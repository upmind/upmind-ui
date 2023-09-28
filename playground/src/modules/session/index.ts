// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useSession as useUpmindSession } from "@upmind/flow";

// --- utils

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useSession = () => {
  const brand = useUpmindSession();
  const { state } = useActor(brand.service);

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.toStrings()),
    values: computed(() => state.value.context),
    isAvailable: computed(() => ["processed"].some(state.value.matches)),
    isLoading: computed(() => ["loading"].some(state.value.matches)),
    isGenerating: computed(() => ["generating"].some(state.value.matches)),
    isProcessing: computed(() => ["processing"].some(state.value.matches)),
    isError: computed(() => ["error"].some(state.value.matches))
  };
};
