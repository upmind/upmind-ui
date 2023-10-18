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
    errors: computed(() => state.value.context?.errors),
    messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => {
      return {
        isLoading: ["loading"].some(state.value.matches),
        isProcessing: ["processing"].some(state.value.matches),
        isAvailable: ["shopping"].some(state.value.matches),
        isReadyForCheckout: ["readyForCheckout"].some(state.value.matches),
        hasError: ["error"].some(state.value.matches)
      };
    })
  };
};
