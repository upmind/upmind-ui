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

import { every, isEqual, isFunction } from "lodash-es";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketPaymentGateway = () => {
  const paymentDetails = useBasketPaymentDetails();
  const paymentGateway = paymentDetails.gateway; // payment details provides a computed gateway we can use
  // ---------------------------------------------------------------------------
  return {
    state: computed(() => stateValue(paymentGateway, "value")),
    context: computed(() => stateValue(paymentGateway, "context")),
    errors: computed(() => contextValue(paymentGateway, "error")),
    //messages: computed(()=> contextValue(paymentGateway, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading: !paymentGateway || stateMatches(paymentGateway, ["loading"]),
      hasErrors: stateMatches(paymentGateway, [
        "error",
        // "invalid",
      ]),
      isProcessing: stateMatches(paymentGateway, ["checking", "processing"]),
      isValid: stateMatches(paymentGateway, ["valid"]),
      isDirty: contextMatches(paymentGateway, ["dirty"]),
      isComplete:
        stateValue(paymentGateway, "done", false) ||
        stateMatches(paymentGateway, ["processed", "complete"]),
      isRenderless:
        contextMatches(paymentGateway, ["renderless"]) ||
        every(
          contextValue(paymentGateway, "schema.properties"),
          (property: any) => property.readOnly
        ),
      hasRenderer: !!contextValue(paymentGateway, "renderer"),
      hasInstructions: !!contextValue(
        paymentGateway,
        "gateway.payment_instructions"
      ),

      // !contextMatches(paymentGateway, [
      //   "schema.properties",
      //   "renderer",
      // ]),
    })),
    // ---
    model: computed(() => contextValue(paymentGateway, "model")),
    schema: computed(() => contextValue(paymentGateway, "schema")),
    uischema: computed(() => contextValue(paymentGateway, "uischema")),
    renderer: computed(() => contextValue(paymentGateway, "renderer")),
    instructions: computed(() =>
      contextValue(paymentGateway, "gateway.payment_instructions")
    ),

    type: computed(() => contextValue(paymentGateway, "type")),
    code: computed(() => contextValue(paymentGateway, "code")),

    // ---
    clear: () => paymentGateway.value?.send({ type: "CLEAR" }),
    input: (model: any) =>
      paymentGateway.value?.send({ type: "SET", data: model }),
    async update(model: any) {
      model = toRaw(unref(model));
      if (!model) return;

      // first check if our paymentGateway has change, ie: model.code has changed
      const selected = contextValue(paymentGateway, "model");

      // if it has not then bail
      if (!isEqual(selected, model)) {
        // if it has then send the new model to the machine
        paymentGateway.value?.send({ type: "SET", data: model });
      }

      // then wait for the paymentGateway actor to be valid
      // then send the update event to the paymentGateway actor
      return waitFor(
        paymentGateway.value,
        newstate => newstate.matches("valid"),
        { timeout: 60_000 }
      ).then(() => paymentGateway.value?.send({ type: "UPDATE" }));
    },

    async render(container: HTMLElement | null = null) {
      const renderer = contextValue(paymentGateway, "renderer");

      return new Promise((resolve, reject) => {
        if (!container) {
          return reject(new Error("No container available for the renderer"));
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
