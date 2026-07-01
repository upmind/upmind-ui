import { computed, unref, toRaw, type ComputedRef, isRef } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { GatewayTypes } from "@upmind-automation/types";
import { useConfig } from "../config";
import { useI18n } from "../system-localisation";
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
  useContext,
  DetailedError,
  responseCodes,
  type UseActor,
  ErrorOrigin,
  useActor
} from "../../utils";
import { isNil, isEqual, every, isEmpty } from "lodash-es";
import { isFunction } from "lodash-es";
import type { GatewayContext } from "../payment-details";
import type { QueryResponseError } from "../query";
import type { ErrorObject } from "ajv";
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------
/**
 * A composable function that provides access to the payment gateway actor.
 * @param actor - A computed ref to the payment gateway actor.
 * @returns An object containing the payment gateway state and methods.
 */
export const usePaymentGateway = (
  service: ActorRef<any, any> | ComputedRef<UseActor | undefined>
) => {
  // --- state
  const { t } = useI18n();

  const actor: ComputedRef<UseActor | undefined> = isRef(service)
    ? (service as ComputedRef<UseActor>)
    : useActor(service as ActorRef<any, any>);

  /**
   * Waits for the payment gateway actor to be ready (not loading or error state).
   * @returns {Promise<boolean>} Resolves true if ready, false if error.
   */
  async function isReady(): Promise<boolean> {
    return new Promise<UseActor>(resolve => {
      const interval = setInterval(() => {
        if (!isNil(actor.value?.service)) {
          clearInterval(interval);
          resolve(actor.value);
        }
      }, 100);
    }).then((actor: UseActor) => {
      return waitFor(
        actor.service,
        state => !stateMatches(state, ["loading"]),
        { timeout: Infinity }
      ).then(state => {
        if (stateMatches(state, ["unavailable", "complete"])) return false;
        return true;
      });
    });
  }

  const meta = computed(() => ({
    needsPayment:
      !!actor.value &&
      contextValue<number>(actor, "amount", 0)! >= 0 &&
      !contextMatches(actor, "gateway.type", GatewayTypes.OFFLINE) &&
      contextValue<boolean>(actor, "supported") === true,
    // contextMatches(actor, "gateway.payment_types", [
    //   PaymentType.PARTIAL_PAYMENT,
    //   PaymentType.PAY_IN_FULL
    // ]),
    isNotSupported:
      !actor.value || contextValue<boolean>(actor, "supported") !== true,
    isLoading: !!actor.value && stateMatches(actor, ["loading"]),
    isRendering: !actor.value || stateMatches(actor, ["rendering"]),
    isAvailable:
      !!actor.value && stateMatches(actor, ["available", "processing"]),
    isUnavailable: !!actor.value && stateMatches(actor, ["unavailable"]),
    hasErrors: stateMatches(actor, ["available.error"]),
    isProcessing: stateMatches(actor, ["processing"]),
    isValid: stateMatches(actor, ["available.valid"]),
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
    hasRenderer: isFunction(contextValue(actor, "renderer")),
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
  const gateway = useContext<any>(actor, "gateway");
  // const renderer = useContext<GatewayContext["renderer"]>(actor, "renderer");
  const instructions = useContext<any>(actor, "gateway.payment_instructions");
  // const type = useContext<GatewayContext["type"]>(actor, "type");
  // const code = useContext<GatewayContext["code"]>(actor, "code");

  const { data } = useConfig();
  const clickwrap = computed(() => data.clickwrapDisclaimer);

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
      state =>
        stateMatches(state, ["processed", "available.error", "complete"]),
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, "available.error")) throw state.context.error;
        return Promise.resolve();
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            error?.message ?? t("error.payment_gateway_update_failed"),
            error?.code ??
              error?.statusCode ??
              responseCodes.Unprocessable_Entity,
            error?.origin ?? ErrorOrigin.Headless,
            error?.data ?? error
          )
        );
      });
  }

  async function render(container: HTMLElement | null): Promise<void> {
    if (!container) {
      // don't throw, just log
      console.error(
        "Payment gateway render error",
        "No container element provided"
      );
      return;
    }

    return isReady().then(() => {
      waitFor(
        actor.value!.service,
        state => stateMatches(state, ["rendering", "available"]) || state.done
      )
        .then(state => {
          // NB bail we dont need to render
          if (
            state.done ||
            stateMatches(state, "available") ||
            contextMatches(state, "renderless") ||
            !contextMatches(state, "sdk")
          ) {
            return;
          }

          actor.value?.send({ type: "RENDER", data: { container } });
          // wait for the render to complete
          return waitFor(
            actor.value!.service,
            state => !stateMatches(state, ["available"])
          );
        })
        .catch(error => {
          // don't throw, just log
          console.error("Payment gateway render error", error);
        });
    });
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    state: computed(() => actor.value?.state.value.toStrings()),

    /**
     * Waits for the payment gateway actor to be ready (not loading or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the payment gateway state.
     * @typedef {Object} PaymentGatewayMeta
     * @property {boolean} isAvailable - Indicates if the payment gateway actor is available.
     * @property {boolean} isUnavailable - Indicates if the payment gateway is not available or errored during load
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
    // code,

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

    /** The current payment gateway object. */
    gateway,

    /** The payment gateway renderer. */
    // renderer,

    /** The payment gateway clickwrap disclaimer. */
    clickwrap,

    /** The payment gateway schema. */
    schema,

    /** The payment gateway type. */
    // type,

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
 * The return type of {@link usePaymentGateway} composable.
 */
export type UsePaymentGateway = ReturnType<typeof usePaymentGateway>;
