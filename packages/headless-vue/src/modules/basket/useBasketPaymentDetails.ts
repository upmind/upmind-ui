// --- external
import { computed, ref, unref, toRaw } from "vue";
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

import { isEqual } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketPaymentDetails = (actor?: ActorRef<any, any>) => {
  const { service, getSnapshot } = useBasket();
  const payment_details = ref(actor);

  if (!actor) {
    waitFor(
      service,
      newstate => contextMatches(newstate, ["actors.billing_details"]),
      { timeout: Infinity }
    ).then(validState => {
      payment_details.value = contextActor(
        validState,
        "actors.payment_details"
      );
    });
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(payment_details, "value")),
    context: computed(() => stateValue(payment_details, "context")),
    errors: computed(() => contextValue(payment_details, "error")),
    //messages: computed(()=> contextValue(payment_details, 'messages')),
    // ---
    meta: computed(() => ({
      isFree: !contextValue(payment_details, "model.amount"),
      isLoading:
        !payment_details.value || stateMatches(payment_details, ["loading"]),
      isAvailable:
        stateMatches(payment_details, ["available"]) &&
        !stateMatches(payment_details, ["available.loading"]),
      hasErrors: stateMatches(payment_details, ["error"]),
      isProcessing: stateMatches(payment_details, ["checking", "processing"]),
      isValid: stateMatches(payment_details, ["valid"]),
      isDirty: contextMatches(payment_details, ["dirty"]),
      isComplete:
        !contextValue(payment_details, "model.amount") ||
        stateValue(payment_details, "done", false) ||
        stateMatches(payment_details, ["processed", "complete"]),
    })),
    // ---
    model: computed(() => contextValue(payment_details, "model")),
    schema: computed(() => contextValue(payment_details, "schema")),
    uischema: computed(() => contextValue(payment_details, "uischema")),
    gateway: computed(() => contextActor(payment_details, "actors.gateway")),

    // ---
    clear: () => payment_details.value?.send({ type: "CLEAR" }),
    input: (model: any) =>
      // @ts-ignore
      payment_details.value?.send({ type: "SET", data: model }),
    update(model: any) {
      model = toRaw(unref(model));
      if (!model) return;

      // first check if our payment_details has change, ie: model.code has changed
      const selected = contextValue(payment_details, "model");

      // if it has not then bail
      if (!isEqual(selected, model)) {
        // if it has then send the new model to the machine
        // @ts-ignore
        payment_details.value?.send({ type: "SET", data: model, update: true });
      }
    },
  };
};
