// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
// import type { ImageObjectTypes } from "@upmind-automation/headless";
import { useSystemRecaptcha } from "@upmind-automation/headless";

// --- utils
import { isEmpty } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------

export const useRecaptcha = () => {
  const { service, stop, generate, clear, init } = useSystemRecaptcha();
  const { state } = useActor(service);

  // ---
  // ---------------------------------------------------------------------------
  return {
    state: computed(() => state.value.value),
    // ---
    token: computed(() => state.value.context.token),
    created: computed(() =>
      state.value.context?.created
        ? new Date(`${state.value.context.created} Z`)
        : null
    ),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isInitialised: !state.value.matches("subscribing"),
      isLoading: ["subscribing", "loading"].some(state.value.matches),
      isAvailable: state.value.matches("available"),
      isProcessing: ["available.processing"].some(state.value.matches),
      hasErrors: state.value.matches("available.error"),
      hasToken:
        state.value.matches("available.processed") &&
        !isEmpty(state.value.context?.token),
    })),
    // ---
    init,
    generate,
    clear,
    stop,
  };
};
