// --- external
import { computed, ref } from "vue";
import { useActor } from "@xstate/vue";
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

export const useBasketPromotions = (service?: ActorRef<any, any>) => {
  const { service: basket } = useBasket();
  const promotionsService = ref(service);
  const actor = ref();

  if (!service) {
    waitFor(
      basket,
      newstate => contextMatches(newstate, ["actors.promotions"]),
      { timeout: Infinity }
    ).then(validState => {
      promotionsService.value = contextValue(validState, "actors.promotions");
      actor.value = contextActor(validState, "actors.promotions");
    });
  } else {
    actor.value = useActor(service);
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(actor, "value")),
    context: computed(() => stateValue(actor, "context")),
    errors: computed(() => contextValue(actor, "error")),

    // ---
    meta: computed(() => ({
      isLoading: !actor.value || stateMatches(actor, ["loading"]),
      hasErrors: stateMatches(actor, ["error"]),
      isProcessing: stateMatches(actor, ["checking", "processing"]),
      isValid: stateMatches(actor, ["valid"]),
      isDirty: contextMatches(actor, ["dirty"]),
      isComplete:
        stateValue(actor, "done", false) ||
        stateMatches(actor, ["processed", "complete"]),
      hasPromotions: contextMatches(actor, ["promotions"]),
    })),
    // ---
    model: computed(() => contextValue(actor, "model")),
    schema: computed(() => contextValue(actor, "schema")),
    uischema: computed(() => contextValue(actor, "uischema")),
    promotions: computed(() => contextValue(actor, "promotions")), // ---
    clear: () => actor.value?.send({ type: "CLEAR" }),
    // @ts-ignore
    input: model => actor.value?.send({ type: "SET", data: model }),
    add: async () => {
      actor.value?.send({ type: "ADD" });
      return waitFor(promotionsService.value as ActorRef<any, any>, state => {
        return ["processed", "complete", "processing.error"].some(
          state.matches
        );
      }).then(state => {
        if (["processing.error"].some(state.matches)) {
          return Promise.reject(state.context.error);
        }
        return Promise.resolve();
      });
    },
    remove: (promotion: any) => {
      actor.value?.send({ type: "REMOVE", data: promotion });
      return waitFor(promotionsService.value as ActorRef<any, any>, state => {
        return ["processed", "complete", "processing.error"].some(
          state.matches
        );
      }).then(state => {
        if (["processing.error"].some(state.matches)) {
          return Promise.reject(state.context.error);
        }
        return Promise.resolve();
      });
    },
  };
};
