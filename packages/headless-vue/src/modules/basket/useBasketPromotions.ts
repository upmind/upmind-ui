// --- external
import { computed, ref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "@upmind/headless";

// --- utils
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
  contextActor,
} from "../../utils";

// --- types
import type { ActorRef } from "xstate";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine with some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketPromotions = (actor?: ActorRef<any, any>) => {
  const { service, getSnapshot } = useBasket();
  const promotions = ref(actor);

  if (!actor) {
    waitFor(
      service,
      newstate => contextMatches(newstate, ["actors.promotions"]),
      { timeout: Infinity }
    ).then(validState => {
      promotions.value = contextActor(validState, "actors.promotions");
    });
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(promotions, "value")),
    context: computed(() => stateValue(promotions, "context")),
    errors: computed(() => contextValue(promotions, "error")),

    // ---
    meta: computed(() => ({
      isLoading: !promotions.value || stateMatches(promotions, ["loading"]),
      hasErrors: stateMatches(promotions, ["error"]),
      isProcessing: stateMatches(promotions, ["checking", "processing"]),
      isValid: stateMatches(promotions, ["valid"]),
      isDirty: contextMatches(promotions, ["dirty"]),
      isComplete:
        stateValue(promotions, "done", false) ||
        stateMatches(promotions, ["processed", "complete"]),
      hasPromotions: contextMatches(promotions, ["promotions"]),
    })),
    // ---
    model: computed(() => contextValue(promotions, "model")),
    schema: computed(() => contextValue(promotions, "schema")),
    uischema: computed(() => contextValue(promotions, "uischema")),
    promotions: computed(() => contextValue(promotions, "promotions")), // ---
    clear: () => promotions.value?.send({ type: "CLEAR" }),
    // @ts-ignore
    input: model => promotions.value?.send({ type: "SET", data: model }),
    add: () => promotions.value?.send({ type: "ADD" }),
    remove: (promotion: any) =>
      // @ts-ignore
      promotions.value?.send({ type: "REMOVE", data: promotion }),
  };
};
