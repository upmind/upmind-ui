// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBasket as useUpmindBasket } from "@upmind/flow";

// --- utils

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasket = () => {
  const basket = useUpmindBasket();
  const { state, send } = useActor(basket.service);

  // --------------------------------------------------------

  return {
    send,
    state: computed(() => state.value.value),
    basket: computed(() => state.value.context.basket),
    values: computed(() => state.value.context),
    // ---
    isLoading: computed(() => ["loading"].some(state.value.matches)),
    isProcessing: computed(() => ["processing"].some(state.value.matches)),
    isAvailable: computed(() =>
      ["idle", "readyForCheckout"].some(state.value.matches)
    ),
    hasError: computed(() => ["error"].some(state.value.matches))
  };
};
