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
  const { service, stop, generate, clear } = useSystemRecaptcha();
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
      isLoading: state.value.matches("loading"),
      isAvailable: state.value.matches("available"),
      isProcessing: ["checking", "processing"].some(state.value.matches),
      hasErrors: state.value.matches("error"),
      hasToken:
        state.value.matches("complete") && !isEmpty(state.value.context?.token),
    })),
    // ---
    generate,
    clear,
    stop,
  };
};
