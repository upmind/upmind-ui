// --- external
import { computed, unref, toRaw } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasketPaymentDetails } from "./useBasketPaymentDetails";

// --- utils
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
} from "../../utils";

import { isEqual, isFunction } from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketPaymentGateway = () => {
  const payment_details = useBasketPaymentDetails();
  const payment_gateway = payment_details.gateway; // payment details provides a computed gateway we can use
  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(payment_gateway, "value")),
    context: computed(() => stateValue(payment_gateway, "context")),
    errors: computed(() => contextValue(payment_gateway, "error")),
    //messages: computed(()=> contextValue(payment_gateway, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading: !payment_gateway || stateMatches(payment_gateway, ["loading"]),
      hasErrors: stateMatches(payment_gateway, [
        "error",
        // "invalid",
      ]),
      isProcessing: stateMatches(payment_gateway, ["checking", "processing"]),
      isValid: stateMatches(payment_gateway, ["valid"]),
      isDirty: contextMatches(payment_gateway, ["dirty"]),
      isComplete:
        stateValue(payment_gateway, "done", false) ||
        stateMatches(payment_gateway, ["processed", "complete"]),
      isRenderless: contextMatches(payment_gateway, ["renderless"]),
      hasRenderer: !!contextValue(payment_gateway, "renderer"),
      hasInstructions: !!contextValue(
        payment_gateway,
        "gateway.payment_instructions"
      ),

      // !contextMatches(payment_gateway, [
      //   "schema.properties",
      //   "renderer",
      // ]),
    })),
    // ---
    model: computed(() => contextValue(payment_gateway, "model")),
    schema: computed(() => contextValue(payment_gateway, "schema")),
    uischema: computed(() => contextValue(payment_gateway, "uischema")),
    renderer: computed(() => contextValue(payment_gateway, "renderer")),
    instructions: computed(() =>
      contextValue(payment_gateway, "gateway.payment_instructions")
    ),

    // ---
    clear: () => payment_gateway.value?.send({ type: "CLEAR" }),
    input: (model: any) =>
      payment_gateway.value?.send({ type: "SET", data: model }),
    update(model: any) {
      model = toRaw(unref(model));
      if (!model) return;

      // first check if our payment_gateway has change, ie: model.code has changed
      const selected = contextValue(payment_gateway, "model");

      // if it has not then bail
      if (!isEqual(selected, model)) {
        // if it has then send the new model to the machine
        payment_gateway.value?.send({ type: "SET", data: model });
      }

      // then wait for the payment_gateway actor to be valid
      // then send the update event to the payment_gateway actor
      // @ts-ignore
      waitFor(service.state.context.actors.payment_gateway, newstate =>
        newstate.matches("valid")
      ).then(() => payment_gateway.value?.send({ type: "UPDATE" }));
    },

    async render(container: HTMLElement | null = null) {
      const renderer = contextValue(payment_gateway, "renderer");

      return new Promise((resolve, reject) => {
        if (!container) {
          return reject("No container available for the renderer");
        }

        // NB: renderer MUST be a function, if not then we clear the container
        if (isFunction(renderer)) {
          renderer(container);
          return resolve(true);
        } else {
          container.innerHTML = "";
          return reject(false);
        }
      });
    },
  };
};
