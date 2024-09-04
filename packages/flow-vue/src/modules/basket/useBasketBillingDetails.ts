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

// --- types
import type { TActor } from "./types";

// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketBillingDetails = (actor?: TActor<any>) => {
  const { service } = useBasket();
  const billing_details = ref(actor);

  if (!actor) {
    waitFor(
      service,
      newstate => ["checkout", "shopping"].some(newstate.matches),
      { timeout: Infinity }
    ).then(validState => {
      billing_details.value = contextActor(
        validState,
        "actors.billing_details"
      );
    });
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(billing_details.value?.state, "value")),
    context: computed(() =>
      stateValue(billing_details.value?.state, "context")
    ),
    errors: computed(() => contextValue(billing_details.value?.state, "error")),
    //messages: computed(()=> contextValue(billing_details.value?.state, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading:
        !billing_details.value?.state ||
        stateMatches(billing_details.value?.state, ["available"]),

      hasErrors: stateMatches(billing_details.value?.state, ["error"]),
      isProcessing: stateMatches(billing_details.value?.state, [
        "available.processing",
      ]),
      isValid: stateMatches(billing_details.value?.state, ["available.valid"]),
      isDirty: contextMatches(billing_details.value?.state, ["dirty"]),
      isComplete:
        stateValue(billing_details.value?.state, "done", false) ||
        stateMatches(billing_details.value?.state, [".complete"]),
    })),
    // ---
    model: computed(() => contextValue(billing_details.value?.state, "model")),
    schema: computed(() =>
      contextValue(billing_details.value?.state, "schema")
    ),
    uischema: computed(() =>
      contextValue(billing_details.value?.state, "uischema")
    ),

    // ---
    clear: () => billing_details.value?.send({ type: "CLEAR" }),
    // @ts-ignore
    input: (model: any) => billing_details.value?.send({ type: "SET", data: model }),
    update(model: any) {
      if (!model) return;

      // first check if our billing_details has change, ie: model.code has changed
      const selected = contextValue(billing_details.value?.state, "model");

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
