// --- external
import { computed } from "vue";

// --- internal

// --- utils
import {
  contextMatches,
  contextValue,
  stateMatches,
  stateValue,
  useContext,
  useState
} from "../../utils";

import { isFunction } from "lodash-es";

// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasketPaymentDetailsGateway = actor => {
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
      isDirty: contextMatches(state, ["dirty"]),
      isComplete:
        stateValue(state, "done", false) ||
        stateMatches(state, ["processed", "complete"]),
      isRenderless:
        contextMatches(state, ["renderless"]) ||
        !contextMatches(state, ["schema.properties", "renderer"])
    })),
    // ---
    model: useContext(state, "model"),
    schema: useContext(state, "schema"),
    uischema: useContext(state, "uischema"),
    renderer: useContext(state, "renderer"),

    // ---

    clear: () => send({ type: "CLEAR" }),
    input: model => send({ type: "SET", data: model }),
    update: () => send({ type: "UPDATE" }),
    render(container: HTMLElement | null = null) {
      const renderer = contextValue(state, "renderer");

      if (!container) {
        console.error("No container available for the renderer");
        return;
      }

      // NB: renderer MUST be a function, if not then we clear the container
      if (isFunction(renderer)) {
        renderer(container);
      } else {
        container.innerHTML = "";
      }
    }
  };
};
