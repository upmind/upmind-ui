// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useFeedback as useUpmindFeedback, utils } from "@upmind/flow";

// --- utils
// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useFeedback = () => {
  const { service, dismiss, add, addError, addSuccess } = useUpmindFeedback();
  const { state } = useActor(service);

  // --------------------------------------------------------

  const messages = computed(() => state.value.context?.messages);
  // ---
  const meta = computed(() => ({
    isProcessing: ["processing"].some(state.value.matches),
    isEmpty: ["empty"].some(state.value.matches)
  }));

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    messages,
    // ---
    meta,
    // ---
    add,
    addError,
    addSuccess,
    dismiss,
    // ---
    useTime: utils.useTime
  };
};
