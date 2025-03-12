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

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

export const useBasketPromotions = (actorRef?: ActorRef<any>) => {
  const { service: basket } = useBasket();
  let service = actorRef;
  const actor = ref();

  if (!actorRef) {
    waitFor(
      basket,
      newstate => contextMatches(newstate, ["actors.promotions"]),
      { timeout: Infinity }
    ).then(validState => {
      service = contextValue(validState, "actors.promotions");
      actor.value = contextActor(validState, "actors.promotions");
    });
  } else {
    actor.value = useActor(actorRef);
  }

  // ---------------------------------------------------------------------------
  return {
    state: computed(() => stateValue(actor, "value")),
    context: computed(() => stateValue(actor, "context")),
    errors: computed(() => contextValue(actor, "error")),

    // ---
    meta: computed(() => ({
      isLoading: !actor.value || stateMatches(actor, ["loading"]),
      hasPromotions: contextMatches(actor, ["promotions"]),
      hasErrors: stateMatches(actor, ["error"]),
      isProcessing: stateMatches(actor, [
        "processing.update",
        "processing.remove",
      ]),
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
    promotions: computed(() => contextValue(actor, "promotions")), // ---
    clear: () => actor.value?.send({ type: "CLEAR" }),
    input: (model: any) => actor.value?.send({ type: "SET", data: model }),

    async add(coupon?: string) {
      if (coupon) {
        actor.value?.send({ type: "SET", data: { promocode: coupon } });
        const state = await waitFor(service as ActorRef<any>, state =>
          ["valid", "error"].some(state.matches)
        );
        if (state.matches("error")) {
          return Promise.reject(state.context.error);
        }
      }

      actor.value?.send({ type: "ADD" });

      // then wait for the paymentGateway actor to be updated
      return waitFor(service as ActorRef<any>, state => {
        return ["processed", "complete", "error"].some(state.matches);
      }).then(state => {
        if (["error"].some(state.matches)) {
          return Promise.reject(state.context.error);
        }
        return Promise.resolve();
      });
    },

    remove: (promotion: any) => {
      actor.value?.send({ type: "REMOVE", data: promotion });
      return waitFor(service as ActorRef<any>, state => {
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
