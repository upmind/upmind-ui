// --- external
import { computed, toRaw, unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasketPaymentDetails } from "./useBasketPaymentDetails";

// --- utils
import {
  contextMatches,
  contextValue,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches,
  stateValue,
  useContext,
} from "../../utils";
import { isEqual, isNil } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import { GatewayContext } from "../paymentDetails";
import { isFunction } from "xstate/lib/utils";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor' machine to be ready

export const useBasketPaymentGateway = () => {
  const { gateway: actor } = useBasketPaymentDetails();

  // --- state

  /**
   * Waits for the payment gateway actor to be ready (not loading or error state).
   * @returns {Promise<boolean>} Resolves true if ready, false if error.
   */
  async function isReady(): Promise<boolean> {
    return new Promise(resolve =>
      setTimeout(() => {
        if (!isNil(actor.value)) {
          resolve(actor.value);
        }
      }, 100)
    ).then(service => {
      if (!service) return false;
      return waitFor(
        service as ActorRef<any>,
        state => !stateMatches(state, ["loading", "error"]),
        { timeout: Infinity }
      ).then(state => !stateMatches(state, ["error"]));
    });
  }

  const meta = computed(() => ({
    isLoading: !actor.value || stateMatches(actor, ["loading"]),
    hasErrors: stateMatches(actor, ["error"]),
    hasInstructions: contextMatches(actor, "gateway.payment_instructions"),
    hasRenderer: contextMatches(actor, "renderer"),
    isAvailable: !!actor.value,
    isComplete:
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"]),
    isDirty: contextMatches(actor, ["dirty"]),
    isProcessing: stateMatches(actor, ["checking", "processing"]),
    isRenderless:
      contextMatches(actor, ["renderless"]) ||
      Object.values(contextValue(actor, "schema.properties") || {}).every(
        (property: any) => property.readOnly
      ),
    isValid: stateMatches(actor, ["valid"]),
  }));

  // --- context

  const context = useContext<GatewayContext>(actor);
  const errors = useContext<GatewayContext["error"]>(actor, "error");
  const model = useContext<GatewayContext["model"]>(actor, "model");
  const schema = useContext<GatewayContext["schema"]>(actor, "schema");
  const uischema = useContext<GatewayContext["uischema"]>(actor, "uischema");
  const renderer = useContext<GatewayContext["renderer"]>(actor, "renderer");
  const instructions = useContext<any>(actor, "gateway.payment_instructions");
  const type = useContext<GatewayContext["type"]>(actor, "type");
  const code = useContext<GatewayContext["code"]>(actor, "code");

  // --- methods

  function clear(): void {
    actor.value?.send({ type: "CLEAR" });
  }

  function input(value: any) {
    actor.value?.send({ type: "SET", data: toRaw(unref(value)) });
  }

  async function update(value: any): Promise<void> {
    value = toRaw(unref(value));
    if (!value) return;
    const model = contextValue(actor, "model");

    if (!isEqual(model, value)) {
      actor.value?.send({ type: "SET", data: value, update: true });
    } else {
      actor.value?.send({ type: "UPDATE" });
    }

    return waitFor(
      actor.value as ActorRef<any>,
      state => stateMatches(state, ["processed", "complete", "error"]),
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, "error")) throw state.context.error;
        return Promise.resolve();
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            "[headless] update PaymentGateway on basket failed",
            error?.status ?? responseCodes.Timeout,
            ErrorOrigin.Headless,
            {
              error,
              state: actor.value?.getSnapshot()?.value,
            }
          )
        );
      });
  }

  async function render(container?: HTMLElement): Promise<boolean> {
    const rendererFn = contextValue(actor, "renderer");
    return new Promise((resolve, reject) => {
      if (!container) {
        return reject(
          new DetailedError(
            "[headless] render on useBasketPaymentGateway does not have container",
            responseCodes.Not_Found,
            ErrorOrigin.Headless
          )
        );
      }
      if (isFunction(rendererFn)) {
        rendererFn(container);
        return resolve(true);
      } else {
        container.innerHTML = "";
        return reject(
          new DetailedError(
            "[headless] render on useBasketPaymentGateway thrown an error",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless
          )
        );
      }
    });
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state

    /**
     * Waits for the payment gateway actor to be ready (not loading or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta-information about the basket payment gateway state.
     * @type {Object} BasketPaymentGatewayMeta
     * @property {boolean} isAvailable - Indicates if the payment gateway actor is available.
     * @property {boolean} isLoading - Indicates if the payment gateway actor is loading.
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isProcessing - Indicates if the payment gateway is processing.
     * @property {boolean} isValid - Indicates if the payment gateway is valid.
     * @property {boolean} isDirty - Indicates if the payment gateway is dirty.
     * @property {boolean} isComplete - Indicates if the payment gateway is complete.
     * @property {boolean} isRenderless - Indicates if the payment gateway is renderless.
     * @property {boolean} hasRenderer - Indicates if the payment gateway has a renderer.
     * @property {boolean} hasInstructions - Indicates if the payment gateway has instructions.
     */
    meta,

    // --- context

    /** The payment gateway code. */
    code,

    /** The full payment gateway context object. */
    context,

    /** Any error returned by the payment gateway actor. */
    errors,

    /** The payment gateway instructions. */
    instructions,

    /** The current payment gateway model. */
    model,

    /** The payment gateway renderer. */
    renderer,

    /** The payment gateway schema. */
    schema,

    /** The payment gateway type. */
    type,

    /** The payment gateway UI schema. */
    uischema,

    // --- methods
    /** Clears the payment gateway state. */
    clear,

    /**
     * Sends a SET event to update the payment gateway model.
     * @param {any} value The payment gateway model to set.
     * @returns {void} Does not return anything.
     */
    input,

    /**
     * Updates the payment gateway if the model has changed.
     * @param {any} value The new payment gateway model to set.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    update,

    /**
     * Renders the payment gateway using the renderer function.
     * @param {HTMLElement} [container] The container element to render into.
     * @returns {Promise<boolean>} Resolves true if rendered, rejects on error.
     */
    render,
  };
};

/**
 * The return type of useBasketPaymentGateway composable.
 */
export type UseBasketPaymentGateway = ReturnType<
  typeof useBasketPaymentGateway
>;
