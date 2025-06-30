// --- external
import { computed, ComputedRef, toRaw, unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal

// --- utils
import {
  contextMatches,
  contextValue,
  stateMatches,
  stateValue,
  useContext,
  DetailedError,
  responseCodes,
  useContextActor,
  Actor,
  ErrorOrigin
} from "../../utils";
import { isEmpty, isEqual, isNil } from "lodash-es";

// --- types
import { ActorRef } from "xstate";
import {
  PaymentDetailsContext,
  PaymentDetailModel,
  PaymentDetailsArgs
} from "./types";

// -----------------------------------------------------------------------------

/**
 * A composable function that provides access to the payment gateway actor.
 * @param actor - A computed ref to the payment gateway actor.
 * @returns An object containing the payment gateway state and methods.
 */
export const usePaymentDetails = (actor: ComputedRef<Actor | undefined>) => {
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
    isFree: !contextValue(actor, "amount"),
    isComplete:
      !contextValue(actor, "amount") ||
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"])
  }));

  // --- context

  const context = useContext<PaymentDetailsContext>(actor);
  const gateway = useContextActor(actor, "actors.gateway");
  const gateways = useContext<PaymentDetailsContext["gateways"]>(
    actor,
    "gateways"
  );
  const errors = useContext<PaymentDetailsContext["error"]>(actor, "error");
  const amount = useContext<PaymentDetailsContext["amount"]>(actor, "amount");
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

  function update(value?: PaymentDetailModel): Promise<void> {
    value = toRaw(unref(value));
    const model = contextValue<PaymentDetailModel>(actor, "model");

    if (!isEmpty(value) && !isEqual(model, value)) {
      actor.value?.send({ type: "SET", data: value, update: true });
    } else {
      actor.value?.send({ type: "UPDATE" });
    }
    // then wait for the paymentGateway actor to be updated
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
            error.message ??
              "[headless] update Payment Details on basket failed",
            error?.status ?? responseCodes.Timeout,
            error.origin ?? ErrorOrigin.Headless,
            {
              error,
              state: actor.value?.state?.value
            }
          )
        );
      });
  }

  function clear() {
    actor.value?.send({ type: "CLEAR" });
  }
  function checkout() {
    actor.value?.send({ type: "CHECKOUT" });
  }

  function refresh(context?: PaymentDetailsArgs) {
    actor.value?.send({ type: "REFRESH", data: context });
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
     * @typedef {Object} PaymentDetailsMeta
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

    /** The payment amount, if applicable. */
    amount,

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
    update
  };
};

/**
 * The return type of usePaymentDetails composable.
 */
export type UsePaymentDetails = ReturnType<typeof usePaymentDetails>;
