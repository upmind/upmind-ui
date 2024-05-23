// --- external
import { computed, ref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "@upmind/flow";

// --- utils
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
  contextActor,
} from "../../utils";

// --- types
import type { TActor } from "./types";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine with some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketPromotions = (actor?: TActor<any>) => {
  const promotions = ref(actor);

  if (!actor) {
    const { service } = useBasket();
    waitFor(service, newstate =>
      ["checkout", "shopping.promotions"].some(newstate.matches)
    ).then(validState => {
      promotions.value = contextActor(validState, "actors.promotions");
    });
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(promotions.value?.state, "value")),
    context: computed(() => stateValue(promotions.value?.state, "context")),
    errors: computed(() => contextValue(promotions.value?.state, "error")),

    // ---
    meta: computed(() => ({
      isLoading:
        !promotions.value?.state ||
        stateMatches(promotions.value?.state, ["loading"]),
      hasErrors: stateMatches(promotions.value?.state, ["error"]),
      isProcessing: stateMatches(promotions.value?.state, [
        "checking",
        "processing",
      ]),
      isValid: stateMatches(promotions.value?.state, ["valid"]),
      isDirty: contextMatches(promotions.value?.state, ["dirty"]),
      isComplete:
        stateValue(promotions.value?.state, "done", false) ||
        stateMatches(promotions.value?.state, ["processed", "complete"]),
      hasPromotions: contextMatches(promotions.value?.state, ["promotions"]),
    })),
    // ---
    model: computed(() => contextValue(promotions.value?.state, "model")),
    schema: computed(() => contextValue(promotions.value?.state, "schema")),
    uischema: computed(() => contextValue(promotions.value?.state, "uischema")),
    promotions: computed(() =>
      contextValue(promotions.value?.state, "promotions")
    ), // ---
    clear: () => promotions.value?.send({ type: "CLEAR" }),
    input: model => promotions.value?.send({ type: "SET", data: model }),
    add: () => promotions.value?.send({ type: "ADD" }),
    remove: promotion =>
      promotions.value?.send({ type: "REMOVE", data: promotion }),
  };
};
