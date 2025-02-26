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

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketBillingDetails = (service?: ActorRef<any>) => {
  const { service: basket } = useBasket();

  const billingDetails = ref();

  if (!service) {
    waitFor(
      basket,
      newstate => contextMatches(newstate, ["actors.billingDetails"]),
      { timeout: Infinity }
    ).then(validState => {
      billingDetails.value = contextActor(validState, "actors.billingDetails");
    });
  } else {
    billingDetails.value = useActor(service);
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(billingDetails, "value")),
    context: computed(() => stateValue(billingDetails, "context")),
    errors: computed(() => contextValue(billingDetails, "error")),
    //messages: computed(()=> contextValue(billingDetails, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading:
        !billingDetails.value || stateMatches(billingDetails, ["available"]),

      hasErrors: stateMatches(billingDetails, ["error"]),
      isProcessing: stateMatches(billingDetails, ["available.processing"]),
      isValid: stateMatches(billingDetails, ["available.valid"]),
      isDirty: contextMatches(billingDetails, ["dirty"]),
      isComplete:
        stateValue(billingDetails, "done", false) ||
        stateMatches(billingDetails, [".complete"]),
    })),
    // ---
    model: computed(() => contextValue(billingDetails, "model")),
    schema: computed(() => contextValue(billingDetails, "schema")),
    uischema: computed(() => contextValue(billingDetails, "uischema")),

    // ---
    clear: () => billingDetails.value?.send({ type: "CLEAR" }),

    input: (model: any) =>
      billingDetails.value?.send({ type: "SET", data: model }),
    update(model: any) {
      if (!model) return;

      // first check if our billingDetails has change, ie: model.code has changed
      const selected = contextValue(billingDetails, "model");

      // if it has not then bail
      if (
        model?.addressId == selected?.addressId &&
        model?.companyId == selected?.companyId
      ) {
        return;
      }

      // if it has then send the new model to the machine
      billingDetails.value?.send({
        type: "SET",

        data: model,
        update: true,
      });
    },
  };
};
