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
  const session = useUpmindSession();
  const { state } = useActor(session.service);

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.toStrings()),
    token: computed(() => state.value.context.token.access_token),
    role: computed(() => state.value.context.role),
    values: computed(() => state.value.context),
    // ---
    isLoading: computed(() => ["loading"].some(state.value.matches)),
    isProcessing: computed(() => ["processing"].some(state.value.matches)),
    isGenerating: computed(() =>
      ["processing.generating"].some(state.value.matches)
    ),
    isRefreshing: computed(() =>
      ["processing.generating"].some(state.value.matches)
    ),
    isPersisting: computed(() =>
      ["processing.persisting"].some(state.value.matches)
    ),
    isAvailable: computed(() => ["processed"].some(state.value.matches)),
    isStale: computed(() => ["processed.stale"].some(state.value.matches)),
    hasError: computed(() => ["error"].some(state.value.matches))
  };
};
