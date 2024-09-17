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

// ---types
import type { ActorRef } from "xstate";

// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketCurrency = (actor?: ActorRef<any, any>) => {
  const { service, getSnapshot } = useBasket();
  const currency = ref(actor);

  if (!actor) {
    waitFor(
      service,
      newState => contextMatches(newState, ["actors.currency"]),
      { timeout: Infinity }
    ).then(validState => {
      currency.value = contextActor(validState, "actors.currency");
    });
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(currency, "value")),
    context: computed(() => stateValue(currency, "context")),
    errors: computed(() => contextValue(currency, "error")),
    //messages: computed(()=> contextValue(currency, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading: !currency.value || stateMatches(currency, ["loading"]),
      hasErrors: stateMatches(currency, ["error"]),
      isProcessing: stateMatches(currency, ["checking", "processing"]),
      isValid: stateMatches(currency, ["valid"]),
      isDirty: contextMatches(currency, ["dirty"]),
      isComplete:
        stateValue(currency, "done", false) ||
        stateMatches(currency, ["processed", "complete"]),
    })),
    // ---
    model: computed(() => contextValue(currency, "model")),
    schema: computed(() => contextValue(currency, "schema")),
    uischema: computed(() => contextValue(currency, "uischema")),
    currencies: computed(() => contextValue(currency, "currencies")),
    // ---
    clear: () => currency.value?.send({ type: "CLEAR" }),
    // @ts-ignore
    input: (model: any) => currency.value?.send({ type: "SET", data: model }),
    async update(model: any) {
      // first check if our currency has change, ie: model.code has changed

      const value = contextValue(currency, "model");

      // if it has not then bail
      if (!model?.code || model?.code == value?.code) return;
      currency.value?.send({ type: "SET", data: model, update: true });

      // then wait for the payment_gateway actor to be updated
      // @ts-ignore
      const currencyActor: ActorRef<any, any> =
        service.getSnapshot().context.actors.currency;

      if (currencyActor) {
        return waitFor(
          currencyActor,
          newState => !["loading"].some(newState.matches)
        );
      } else {
        return Promise.reject("Currency not available");
      }
    },
  };
};
