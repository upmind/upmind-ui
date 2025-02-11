// --- external
import { computed, ref } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "@upmind-automation/headless";

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
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

export const useBasketCurrency = (actorRef?: ActorRef<any, any>) => {
  const { service: basket } = useBasket();
  let service = actorRef;
  const actor = ref();

  if (!actorRef) {
    waitFor(basket, newState => contextMatches(newState, ["actors.currency"]), {
      timeout: Infinity,
    }).then(validState => {
      service = contextValue(validState, "actors.currency");
      actor.value = contextActor(validState, "actors.currency");
    });
  } else {
    actor.value = useActor(actorRef);
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(actor, "value")),
    context: computed(() => stateValue(actor, "context")),
    errors: computed(() => contextValue(actor, "error")),

    // ---
    meta: computed(() => ({
      isAvailable: !!actor.value,
      isLoading: !actor.value || stateMatches(actor, ["loading"]),
      hasCurrency: contextMatches(actor, ["currency"]),
      hasErrors: stateMatches(actor, ["error"]),
      isProcessing: stateMatches(actor, ["checking", "processing"]),
      isValid: stateMatches(actor, ["valid"]),
      isDirty: contextMatches(actor, ["dirty"]),
      isComplete:
        stateValue(actor, "done", false) ||
        stateMatches(actor, ["processed", "complete"]),
    })),
    // ---
    model: computed(() => contextValue(actor, "model")),
    schema: computed(() => contextValue(actor, "schema")),
    uischema: computed(() => contextValue(actor, "uischema")),
    currencies: computed(() => contextValue(actor, "currencies")),
    // ---
    clear: () => actor.value?.send({ type: "CLEAR" }),

    input: (model: any) => actor.value?.send({ type: "SET", data: model }),

    async update(model: any) {
      // first check if our currency has change, ie: model.code has changed

      const code = model?.code?.toUpperCase();
      const value = contextValue(service, "model");

      // if it has not then bail
      if (!code || code == value?.code) return Promise.resolve();

      actor.value?.send({ type: "SET", data: { code }, update: true });

      // then wait for the paymentGateway actor to be updated
      return waitFor(service as ActorRef<any, any>, state => {
        return ["processed", "complete", "error"].some(state.matches);
      }).then(state => {
        if (["error"].some(state.matches)) {
          return Promise.reject(state.context.error);
        }
        return Promise.resolve();
      });
    },
  };
};
