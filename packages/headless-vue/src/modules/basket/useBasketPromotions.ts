// --- external
import { computed, ref } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket, utils } from "@upmind-automation/headless";
const { DetailedError, responseCodes } = utils;

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
    )
      .then(validState => {
        service = contextValue(validState, "actors.promotions");
        actor.value = contextActor(validState, "actors.promotions");
      })

      .catch(error => {
        return Promise.reject(
          new DetailedError(
            "[headless] addPromotion on basket failed",
            responseCodes.Timeout,
            {
              error,
              state: basket.getSnapshot().value,
            }
          )
        );
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
        await waitFor(
          service as ActorRef<any>,
          state => ["valid", "error"].some(state.matches),
          { timeout: 60_000 }
        )
          .then(state => {
            if (state.matches("error")) throw state.context?.error;
          })
          .catch(error => {
            return Promise.reject(
              new DetailedError(
                "[headless] addPromotion on basket failed",
                responseCodes.Timeout,
                {
                  error,
                  state: actor.value?.state.value,
                }
              )
            );
          });
      }

      actor.value?.send({ type: "ADD" });

      // then wait for the paymentGateway actor to be updated
      return waitFor(
        service as ActorRef<any>,
        state => {
          return ["processed", "complete", "error"].some(state.matches);
        },
        { timeout: 60_000 }
      )
        .then(state => {
          if (state.matches("error")) throw state.context?.error;

          return Promise.resolve();
        })
        .catch(error => {
          return Promise.reject(
            new DetailedError(
              "[headless] addPromotion on basket failed",
              responseCodes.Timeout,
              {
                error,
                state: actor.value?.state.value,
              }
            )
          );
        });
    },

    remove: (promotion: any) => {
      actor.value?.send({ type: "REMOVE", data: promotion });
      return waitFor(
        service as ActorRef<any>,
        state => {
          return ["processed", "complete", "error"].some(state.matches);
        },
        { timeout: 60_000 }
      )
        .then(state => {
          if (state.matches("error")) throw state.context?.error;

          return Promise.resolve();
        })
        .catch(error => {
          return Promise.reject(
            new DetailedError(
              "[headless] addPromotion on basket failed",
              responseCodes.Timeout,
              {
                error,
                state: actor.value?.state.value,
              }
            )
          );
        });
    },
  };
};
