// --- external
import { computed, unref, toRaw } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal

// --- utils
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
} from "../../utils";

import { every, isEqual, isFunction } from "lodash-es";
import type { ActorRef } from "xstate";
// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

/**
 * This is a composable to help with the paymentDetails.gateway actor
 * It will return the state, context, and meta information about the actor
 * It will also return the model, schema, uischema, renderer, and instructions
 * It will also return the input, update, and clear methods to help with the actor
 * It will also return the render method to help with the actor
 * @param paymentGateway The payment gateway actor to use from paymentDetails.gateway
 * @returns {object} The payment gateway actor
 * @example
 * const paymentGateway = useBasketPaymentGateway(paymentDetails.gateway);
 * const { state, context, meta, model, schema, uischema, renderer, instructions } = paymentGateway;
 * const { input, update, clear, render } = paymentGateway;
 */
export const usePaymentGateway = (paymentGateway: ActorRef<any>) => {
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
    clear: () => paymentGateway?.send({ type: "CLEAR" }),
    input: (model: any) => paymentGateway?.send({ type: "SET", data: model }),
    update(model: any) {
      model = toRaw(unref(model));
      if (!model) return;

      // first check if our paymentGateway has change, ie: model.code has changed
      const selected = contextValue(paymentGateway, "model");

      // if it has not then bail
      if (!isEqual(selected, model)) {
        // if it has then send the new model to the machine
        paymentGateway?.send({ type: "SET", data: model });
      }

      // then wait for the paymentGateway actor to be valid
      // then send the update event to the paymentGateway actor
      waitFor(paymentGateway, newstate => newstate.matches("valid")).then(() =>
        paymentGateway?.send({ type: "UPDATE" })
      );
    },

    async render(container: HTMLElement | null = null) {
      const renderer = contextValue(paymentGateway, "renderer");

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
