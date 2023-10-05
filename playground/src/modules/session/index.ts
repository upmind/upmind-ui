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
  const { state, send } = useActor(session.service);

  // --------------------------------------------------------

  return {
    send,
    state: computed(() => state.value.value),
    values: computed(() => state.value.context),
    // ---
    isLoading: computed(() => ["loading"].some(state.value.matches)),
    isProcessing: computed(() =>
      ["loading.status.processing"].some(state.value.matches)
    ),

    isClient: computed(() =>
      ["idle.client", "loading.role.client"].some(state.value.matches)
    ),
    isLoggedIn: computed(() => ["idle.client"].some(state.value.matches)),
    isAvailable: computed(() => ["idle"].some(state.value.matches)),
    hasError: computed(() => ["loading.status.error"].some(state.value.matches))
  };
};
