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

// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasketCurrency = () => {
  const { service } = useBasket();

  const currency = ref(null);

  waitFor(service, newstate => newstate.matches("shopping.currency")).then(
    validState => {
      currency.value = contextActor(validState, "actors.currency");
    }
  );

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
        stateMatches(currency.value?.state, ["loading"]),
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
    input: model => currency.value?.send({ type: "SET", data: model }),
    update(model) {
      // first check if our currency has change, ie: model.code has changed

      // if it has not then bail
      if (model?.code == this.model.value?.code) return;

      // if it has then send the new model to the machine
      currency.value?.send({ type: "SET", data: model });

      // then wait for the currency actor to be valid
      // then send the update event to the currency actor
      waitFor(service.state.context.actors.currency, newstate =>
        newstate.matches("valid")
      ).then(() => currency.value?.send({ type: "UPDATE" }));
    },
  };
};
