// --- external
import { computed, unref, toRaw, MaybeRef, ComputedRef } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal

// --- utils
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
  useContext,
  DetailedError,
  responseCodes,
  Actor,
  ErrorOrigin
} from "../../utils";
import { isNil, isEqual, every, isEmpty } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import { GatewayContext } from "../paymentDetails";
import { isFunction } from "xstate/lib/utils";
import { QueryResponseError } from "../query";
import { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------
/**
 * A composable function that provides access to the payment gateway actor.
 * @param actor - A computed ref to the payment gateway actor.
 * @returns An object containing the payment gateway state and methods.
 */
export const usePaymentGateway = (actor: ComputedRef<Actor | undefined>) => {
  // --- state

  /**
   * Waits for the payment gateway actor to be ready (not loading or error state).
   * @returns {Promise<boolean>} Resolves true if ready, false if error.
   */
  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (!isNil(actor.value)) {
          clearInterval(interval);
          resolve(actor.value);
        }
      }, 100);
    }).then(service => {
      if (!service) return false;
      return waitFor(
        service as ActorRef<any>,
        state => !stateMatches(state, ["loading", "error"]),
        { timeout: Infinity }
      ).then(state => {
        if (stateMatches(state, ["error"])) return false;
        return true;
      });
    });
  }

  const meta = computed(() => ({
    isAvailable: !!actor.value,
    isLoading: !actor.value || stateMatches(actor.value, ["loading"]),
    hasErrors: stateMatches(actor, ["error"]),
    isProcessing: stateMatches(actor, ["checking", "processing"]),
    isValid: stateMatches(actor, ["valid"]),
    isDirty: !isEmpty(contextValue<GatewayContext["model"]>(actor, "model")),
    isComplete:
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"]),
    isRenderless:
      contextMatches(actor, ["renderless"]) ||
      every(
        contextValue(actor, "schema.properties"),
        (property: any) => property.readOnly
      ),
    hasRenderer: contextMatches(actor, "renderer"),
    hasInstructions: contextMatches(actor, "gateway.payment_instructions")
  }));

  // --- context

  const context = useContext<GatewayContext>(actor);

  const errors = useContext<QueryResponseError["message"]>(
    actor,
    "error.message"
  );
  const validationErrors = useContext<ErrorObject[]>(actor, "error.data");

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
      actor.value!.service,
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
            error?.message ?? "Update Payment Gateway failed",
            error?.code ??
              error?.statusCode ??
              responseCodes.Unprocessable_Entity,
            error?.origin ?? ErrorOrigin.Headless,
            error?.data ?? error
          )
        );
      });
  }

  async function render(container?: HTMLElement): Promise<boolean> {
    const rendererFn = contextValue(actor, "renderer");
    return new Promise((resolve, reject) => {
      if (container && isFunction(rendererFn)) {
        rendererFn(container);
        return resolve(true);
      } else {
        if (container) container.innerHTML;
        return reject(false);
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
     * Meta information about the payment gateway state.
     * @typedef {Object} PaymentGatewayMeta
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

    /**
     * Any errors message(s) encountered during payment gateway operations.
     */
    errors,

    /**
     * Validation errors encountered during payment gateway operations.
     * Typically contains an array of error objects with details about the validation issues.
     * @type {ErrorObject[]}
     * @see https://ajv.js.org/guide/validation-errors.html#validation-error-object
     */
    validationErrors,

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
    render
  };
};

/**
 * The return type of usePaymentGateway composable.
 */
export type UsePaymentGateway = ReturnType<typeof usePaymentGateway>;
