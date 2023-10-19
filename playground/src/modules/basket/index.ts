// --- external
import { computed, ref } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBasket as useUpmindBasket } from "@upmind/flow";

// --- utils
import { map, find } from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasket = () => {
  const { service } = useUpmindBasket();
  const { state, send } = useActor(service);
  // --------------------------------------------------------

  // We can create reactive refs to the actors for machines that are spawned
  // so that we can listen to their state changes, and send them events
  const items = ref();
  service.onTransition(newState => {
    if (newState.context.items) {
      // update the items on any synced state change
      items.value = map(newState.context.items, item => item.getSnapshot()); // todo:
    } else {
      items.value = null;
    }
  });
  // --------------------------------------------------------

  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),

    // ---
    meta: computed(() => {
      return {
        isLoading: ["loading"].some(state.value.matches),
        isProcessing: ["processing"].some(state.value.matches),
        isAvailable: ["shopping"].some(state.value.matches),
        hasProducts: !["shopping.products.empty"].some(state.value.matches),
        needsConfiguring: ["shopping.items.configuring"].some(
          state.value.matches
        ),
        isReadyForCheckout: ["readyForCheckout"].some(state.value.matches),
        hasErrors: ["error"].some(state.value.matches)
      };
    }),
    //  ---
    basket: computed(() => state.value.context.basket),
    // ---
    items,
    products: computed(() => state.value.context.basket?.products || [])
  };
};
