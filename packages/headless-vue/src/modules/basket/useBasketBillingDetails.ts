// --- external
import { computed, ref } from "vue";
import { useActor } from "@xstate/vue";
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

// --- types
import type { ActorRef } from "xstate";

// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketBillingDetails = (service?: ActorRef<any, any>) => {
  const { service: basket } = useBasket();

  const billing_details = ref();

  if (!service) {
    waitFor(
      basket,
      newstate => contextMatches(newstate, ["actors.billing_details"]),
      { timeout: Infinity }
    ).then(validState => {
      billing_details.value = contextActor(
        validState,
        "actors.billing_details"
      );
    });
  } else {
    billing_details.value = useActor(service);
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(billing_details, "value")),
    context: computed(() => stateValue(billing_details, "context")),
    errors: computed(() => contextValue(billing_details, "error")),
    //messages: computed(()=> contextValue(billing_details, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading:
        !billing_details.value || stateMatches(billing_details, ["available"]),

      hasErrors: stateMatches(billing_details, ["error"]),
      isProcessing: stateMatches(billing_details, ["available.processing"]),
      isValid: stateMatches(billing_details, ["available.valid"]),
      isDirty: contextMatches(billing_details, ["dirty"]),
      isComplete:
        stateValue(billing_details, "done", false) ||
        stateMatches(billing_details, [".complete"]),
    })),
    // ---
    model: computed(() => contextValue(billing_details, "model")),
    schema: computed(() => contextValue(billing_details, "schema")),
    uischema: computed(() => contextValue(billing_details, "uischema")),

    // ---
    clear: () => billing_details.value?.send({ type: "CLEAR" }),
    // @ts-ignore
    input: (model: any) =>
      // @ts-ignore
      billing_details.value?.send({ type: "SET", data: model }),
    update(model: any) {
      if (!model) return;

      // first check if our billing_details has change, ie: model.code has changed
      const selected = contextValue(billing_details, "model");

      // if it has not then bail
      if (
        model?.address_id == selected?.address_id &&
        model?.company_id == selected?.company_id
      ) {
        return;
      }

      // if it has then send the new model to the machine
      billing_details.value?.send({
        type: "SET",
        // @ts-ignore
        data: model,
        update: true,
      });
    },
  };
};
