// --- external
import { computed, ref, unref, toRaw } from "vue";
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
import { isEqual } from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketPaymentDetails = (actor?: TActor<any>) => {
  const { service } = useBasket();
  const payment_details = ref(actor);

  if (!actor) {
    waitFor(service, newstate =>
      ["checkout", "shopping.payment_details"].some(newstate.matches)
    ).then(validState => {
      payment_details.value = contextActor(
        validState,
        "actors.payment_details"
      );
    });
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(payment_details.value?.state, "value")),
    context: computed(() =>
      stateValue(payment_details.value?.state, "context")
    ),
    errors: computed(() => contextValue(payment_details.value?.state, "error")),
    //messages: computed(()=> contextValue(payment_details.value?.state, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading:
        !payment_details.value?.state ||
        stateMatches(payment_details.value?.state, ["loading"]),
      hasErrors: stateMatches(payment_details.value?.state, ["error"]),
      isProcessing: stateMatches(payment_details.value?.state, [
        "checking",
        "processing",
      ]),
      isValid: stateMatches(payment_details.value?.state, ["valid"]),
      isDirty: contextMatches(payment_details.value?.state, ["dirty"]),
      isComplete:
        stateValue(payment_details.value?.state, "done", false) ||
        stateMatches(payment_details.value?.state, ["processed", "complete"]),
    })),
    // ---
    model: computed(() => contextValue(payment_details.value?.state, "model")),
    schema: computed(() =>
      contextValue(payment_details.value?.state, "schema")
    ),
    uischema: computed(() =>
      contextValue(payment_details.value?.state, "uischema")
    ),
    gateway: computed(() =>
      contextActor(payment_details.value?.state, "actors.gateway")
    ),

    // ---
    clear: () => payment_details.value?.send({ type: "CLEAR" }),
    input: model => payment_details.value?.send({ type: "SET", data: model }),
    update(model) {
      model = toRaw(unref(model));
      if (!model) return;

      // first check if our payment_details has change, ie: model.code has changed
      const selected = contextValue(payment_details.value?.state, "model");

      // if it has not then bail
      if (!isEqual(selected, model)) {
        // if it has then send the new model to the machine
        payment_details.value?.send({ type: "SET", data: model });
      }

      // then wait for the payment_details actor to be valid
      // then send the update event to the payment_details actor
      waitFor(service.state.context.actors.payment_details, newstate =>
        newstate.matches("valid")
      ).then(() => payment_details.value?.send({ type: "UPDATE" }));
    },
  };
};
