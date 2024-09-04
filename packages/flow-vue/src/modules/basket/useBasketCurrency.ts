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

// ---types
import type { TActor } from "./types";

// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketCurrency = (actor?: TActor<any>) => {
  const { service, getSnapshot } = useBasket();
  const currency = ref(actor);

  if (!actor) {
    waitFor(
      service,
      newstate => ["checkout", "shopping"].some(newstate.matches),
      { timeout: Infinity }
    ).then(validState => {
      currency.value = contextActor(validState, "actors.currency");
    });
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(currency.value?.state, "value")),
    context: computed(() => stateValue(currency.value?.state, "context")),
    errors: computed(() => contextValue(currency.value?.state, "error")),
    //messages: computed(()=> contextValue(currency.value?.state, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading:
        !currency.value?.state ||
        stateMatches(currency.value?.state, ["loading"]) ||
        stateMatches(getSnapshot(), [
          "subscribing",
          "loading",
          "generating",
          "claiming",
        ]),
      hasErrors: stateMatches(currency.value?.state, ["error"]),
      isProcessing: stateMatches(currency.value?.state, [
        "checking",
        "processing",
      ]),
      isValid: stateMatches(currency.value?.state, ["valid"]),
      isDirty: contextMatches(currency.value?.state, ["dirty"]),
      isComplete:
        stateValue(currency.value?.state, "done", false) ||
        stateMatches(currency.value?.state, ["processed", "complete"]),
    })),
    // ---
    model: computed(() => contextValue(currency.value?.state, "model")),
    schema: computed(() => contextValue(currency.value?.state, "schema")),
    uischema: computed(() => contextValue(currency.value?.state, "uischema")),
    currencies: computed(() =>
      contextValue(currency.value?.state, "currencies")
    ),
    // ---
    clear: () => currency.value?.send({ type: "CLEAR" }),
    // @ts-ignore
    input: (model: any) => currency.value?.send({ type: "SET", data: model }),
    update(model: any) {
      // first check if our currency has change, ie: model.code has changed

      const { code } = contextValue(currency.value?.state, "model");

      // if it has not then bail
      if (model?.code == code) return;

      // if it has then send the new model to the machine
      // @ts-ignore
      currency.value?.send({ type: "SET", data: model, update: true });
    },
  };
};
