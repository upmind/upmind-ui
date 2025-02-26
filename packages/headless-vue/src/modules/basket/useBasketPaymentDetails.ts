// --- external
import { computed, ref, unref, toRaw } from "vue";
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

import { isEqual } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketPaymentDetails = (service?: ActorRef<any>) => {
  const { service: basket } = useBasket();
  const paymentDetails = ref();

  if (!service) {
    waitFor(
      basket,
      newstate => contextMatches(newstate, ["actors.billingDetails"]),
      { timeout: Infinity }
    ).then(validState => {
      paymentDetails.value = contextActor(validState, "actors.paymentDetails");
    });
  } else {
    paymentDetails.value = useActor(service);
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(paymentDetails, "value")),
    context: computed(() => stateValue(paymentDetails, "context")),
    errors: computed(() => contextValue(paymentDetails, "error")),
    //messages: computed(()=> contextValue(paymentDetails, 'messages')),
    // ---
    meta: computed(() => ({
      isFree: !contextValue(paymentDetails, "model.amount"),
      isLoading:
        !paymentDetails.value || stateMatches(paymentDetails, ["loading"]),
      isAvailable:
        stateMatches(paymentDetails, ["available"]) &&
        !stateMatches(paymentDetails, ["available.loading"]),
      hasErrors: stateMatches(paymentDetails, ["error"]),
      isProcessing: stateMatches(paymentDetails, ["checking", "processing"]),
      isValid: stateMatches(paymentDetails, ["valid"]),
      isDirty: contextMatches(paymentDetails, ["dirty"]),
      hasGateway: contextMatches(paymentDetails, ["actors.gateway"]),
      isComplete:
        !contextValue(paymentDetails, "model.amount") ||
        stateValue(paymentDetails, "done", false) ||
        stateMatches(paymentDetails, ["processed", "complete"]),
    })),
    // ---
    model: computed(() => contextValue(paymentDetails, "model")),
    schema: computed(() => contextValue(paymentDetails, "schema")),
    uischema: computed(() => contextValue(paymentDetails, "uischema")),
    gateways: computed(() => contextValue(paymentDetails, "gateways")),
    gateway: computed(() => contextActor(paymentDetails, "actors.gateway")),

    // ---
    clear: () => paymentDetails.value?.send({ type: "CLEAR" }),
    input: (model: any) =>
      paymentDetails.value?.send({ type: "SET", data: model }),
    update(model: any) {
      model = toRaw(unref(model));
      if (!model) return;

      // first check if our paymentDetails has change, ie: model.code has changed
      const selected = contextValue(paymentDetails, "model");

      // if it has not then bail
      if (!isEqual(selected, model)) {
        // if it has then send the new model to the machine
        paymentDetails.value?.send({ type: "SET", data: model, update: true });
      }
    },
  };
};
