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
  const { state, send } = useActor(brand.service);

  // --------------------------------------------------------

  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: [
        "organisation.loading",
        "config.loading",
        "settings.loading",
        "modules.loading",
        "currencies.loading"
      ].some(state.value.matches),
      isReady: [
        "organisation.complete",
        "config.complete",
        "settings.complete",
        "modules.complete",
        "currencies.complete"
      ].every(state.value.matches),

      hasErrors: [
        "organisation.error",
        "config.error",
        "settings.error",
        "modules.error",
        "currencies.error"
      ].some(state.value.matches)
    }))
  };
};
