// --- external
import { computed } from "vue";

// --- internal

// --- utils
import { stateMatches, stateValue, useContext, useState } from "../../utils";

// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasketFields = actor => {
  const { state, send } = actor;

  // --------------------------------------------------------

  return {
    state: useState(state, "value"),
    context: useContext(state),
    errors: useContext(state, "error"),
    //messages: useContext(state, 'messages'),
    // ---
    meta: computed(() => ({
      isLoading: stateMatches(state, ["loading"]),
      hasErrors: stateMatches(state, ["error"]),
      isProcessing: stateMatches(state, ["checking", "processing"]),
      isValid: stateMatches(state, ["valid"]),
      isComplete:
        stateValue(state, "done", false) ||
        stateMatches(state, ["processed", "complete"]),
    })),
    // ---
    model: useContext(state, "model"),
    schema: useContext(state, "schema"),
    uischema: useContext(state, "uischema"),
    // ---
    clear: () => send({ type: "CLEAR" }),
    input: model => send({ type: "SET", data: model }),
    update: () => send({ type: "UPDATE" }),
  };
};
