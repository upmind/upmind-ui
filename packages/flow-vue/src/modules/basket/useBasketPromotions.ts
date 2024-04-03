// --- external
import { computed } from "vue";

// --- internal

// --- utils
import {
  contextMatches,
  stateMatches,
  stateValue,
  useContext,
  useState,
} from "../../utils";

// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasketPromotions = actor => {
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
      hasPromotions: contextMatches(state, ["promotions"]),
      isValid: stateMatches(state, ["valid"]),
      isDirty: contextMatches(state, ["dirty"]),
      isComplete:
        stateValue(state, "done", false) ||
        stateMatches(state, ["processed", "complete"]),
    })),
    // ---
    model: useContext(state, "model"),
    schema: useContext(state, "schema"),
    uischema: useContext(state, "uischema"),
    promotions: useContext(state, "promotions"),
    // ---
    clear: () => send({ type: "CLEAR" }),
    input: model => send({ type: "SET", data: model }),
    add: () => send({ type: "ADD" }),
    remove: promotion => send({ type: "REMOVE", data: promotion }),
  };
};
