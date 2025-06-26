// --- external
import { computed, toRaw, unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "./";

// --- utils
import {
  DetailedError,
  responseCodes,
  useContext,
  useContextActor,
} from "../../utils";
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
} from "../../utils";
import { isEqual, isNil } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import {
  PaymentDetailsContext,
  PaymentDetailModel,
} from "../paymentDetails/types";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketPaymentDetails = () => {
  const { actors } = useBasket();
  const actor = actors.paymentDetails;

  // --- state

  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (!isNil(actor.value?.service)) {
          clearInterval(interval);
          resolve(actor.value.service);
        }
      }, 100);
    }).then(service =>
      waitFor(
        service as ActorRef<any>,
        state => !stateMatches(state, "loading"),
        { timeout: Infinity }
      ).then(state => {
        if (stateMatches(state, ["error"])) return false;
        return true;
      })
    );
  }

  const meta = computed(() => ({
    isAvailable:
      !!actor.value &&
      stateMatches(actor, ["available", "complete"]) &&
      !stateMatches(actor, ["available.loading"]),
    isLoading: !actor.value || stateMatches(actor, ["loading"]),
    hasGateway: contextMatches(actor, ["actors.gateway"]),
    hasErrors: stateMatches(actor, ["error"]),
    isProcessing: stateMatches(actor, ["checking", "processing"]),
    isValid: stateMatches(actor, ["valid"]),
    isDirty: contextMatches(actor, ["dirty"]),
    isFree: !contextValue(actor, "model.amount"),
    isComplete:
      !contextValue(actor, "model.amount") ||
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"]),
  }));

  // --- context

  const context = useContext<PaymentDetailsContext>(actor);
  const gateway = useContext<ActorRef<any>>(actor, "actors.gateway");
  const gateways = useContext<PaymentDetailsContext["gateways"]>(
    actor,
    "gateways"
  );
  const errors = useContext<PaymentDetailsContext["error"]>(actor, "error");
  const model = useContext<PaymentDetailsContext["model"]>(actor, "model");
  const schema = useContext<PaymentDetailsContext["schema"]>(actor, "schema");
  const uischema = useContext<PaymentDetailsContext["uischema"]>(
    actor,
    "uischema"
  );

  // --- methods

  function input(value: PaymentDetailModel) {
    actor.value?.send({ type: "SET", data: toRaw(unref(value)) });
  }

  function update(value: PaymentDetailModel): Promise<void> {
    value = toRaw(unref(value));
    if (!value) return Promise.reject(new Error("No value provided"));

    const model = contextValue(actor, "model");
    if (!isEqual(model, value)) {
      actor.value?.send({ type: "SET", data: value, update: true });
    } else {
      actor.value?.send({ type: "UPDATE" });
    }
    // then wait for the paymentGateway actor to be updated
    return waitFor(
      actor.value!.service,
      state => {
        return stateMatches(state, ["processed", "complete", "error"]);
      },
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, "error")) throw state.context.error;

        return Promise.resolve();
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            "[headless] update Payment Details on basket failed",
            error?.status ?? responseCodes.Timeout,
            {
              error,
              state: actor.value?.state?.value,
            }
          )
        );
      });
  }

  function clear(): void {
    actor.value?.send({ type: "CLEAR" });
  }
  // ---------------------------------------------------------------------------
  return {
    // --- state

    /**
     * Waits for the payment details actor to be ready (not loading or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the basket payment details state.
     * @typedef {Object} BasketPaymentDetailsMeta
     * @property {boolean} isAvailable - Indicates if the payment details actor is available.
     * @property {boolean} isLoading - Indicates if the payment details actor is loading.
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isProcessing - Indicates if the payment details is processing.
     * @property {boolean} isValid - Indicates if the payment details is valid.
     * @property {boolean} isDirty - Indicates if the payment details is dirty.
     * @property {boolean} hasGateway - Indicates if the payment details has a gateway actor.
     * @property {boolean} isComplete - Indicates if the payment details is complete.
     * @property {boolean} isFree - Indicates if the payment is free (no amount).
     */
    meta,

    // --- context

    /** The full payment details context object. */
    context,

    /** The available gateways. */
    gateways,

    /** The payment gateway actor. */
    gateway,

    /** Any error returned by the payment details actor. */
    errors,

    /** The current payment details model. */
    model,

    /** The payment details schema. */
    schema,

    /** The payment details UI schema. */
    uischema,

    // --- methods

    /** Clears the payment details state. */
    clear,

    /**
     * Sends a SET event to update the payment details model.
     * @param {PaymentDetailModel} value The payment details model to set.
     * @returns {void} Does not return anything.
     */
    input,

    /**
     * Updates the payment details if the model has changed.
     * @param {PaymentDetailModel} value The new payment details model to set.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    update,
  };
};

/**
 * The return type of useBasketPaymentDetails composable.
 */
export type UseBasketPaymentDetails = ReturnType<
  typeof useBasketPaymentDetails
>;
