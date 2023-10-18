// --- external
import { computed, ref } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBasket as useUpmindBasket } from "@upmind/flow";

// --- utils

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasket = () => {
  const { service } = useUpmindBasket();
  const { state, send } = useActor(service);
  // --------------------------------------------------------

  // We can create reactive refs to the child machines,
  // so that when they are invoked we can listen to their state changes
  const queue = ref();
  service.onTransition(newState => {
    if (newState.children?.queue) {
      newState.children.queue.onTransition(
        queueState => (queue.value = queueState)
      );
    } else {
      queue.value = null;
    }
  });
  // --------------------------------------------------------

  return {
    send,
    state: computed(() => state.value.value),
    values: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),

    // ---
    meta: computed(() => {
      return {
        isLoading: ["loading"].some(state.value.matches),
        isProcessing: ["processing"].some(state.value.matches),
        isAvailable: ["shopping"].some(state.value.matches),
        hasItems: ["shopping.items.processed"].some(state.value.matches),
        needsConfiguring: ["shopping.queue.processing"].some(
          state.value.matches
        ),
        isReadyForCheckout: ["readyForCheckout"].some(state.value.matches),
        hasErrors: ["error"].some(state.value.matches)
      };
    }),
    //  ---
    basket: computed(() => state.value.context.basket),
    queue
  };
};
