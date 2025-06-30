// --- external
import { computed, toRaw, unref } from "vue";
import { interpret } from "xstate";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import paymentDetailsMachine from "./paymentDetails.machine";

// --- utils
import {
  useContextActor,
  contextMatches,
  contextValue,
  stateMatches,
  stateValue,
  useContext,
  DetailedError,
  responseCodes
} from "../../utils";

// --- types
import {
  PaymentDetailsArgs,
  PaymentDetailModel,
  PaymentDetailsContext
} from "./types";
import { isEmpty, isEqual } from "lodash-es";

// -----------------------------------------------------------------------------

export const usePaymentDetails = (initialContext: PaymentDetailsArgs) => {
  const service = interpret(paymentDetailsMachine.withContext(initialContext), {
    devTools: false
  });

  const { state, send } = useActor(service.start());

  // --- state

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => stateMatches(state, ["available", "error"]),
      { timeout: Infinity }
    ).then(state => {
      if (stateMatches(state, ["error"])) return false;
      return true;
    });
  }

  const meta = computed(() => ({
    isFree: !contextValue(state, "model.amount"),
    isLoading: stateMatches(state, ["loading"]),
    isAvailable:
      stateMatches(state, ["available"]) &&
      !stateMatches(state, ["available.loading"]),
    hasErrors: stateMatches(state, ["error"]),
    isProcessing: stateMatches(state, ["checking", "processing"]),
    isValid: stateMatches(state, ["valid"]),
    isDirty: contextMatches(state, ["dirty"]),
    hasGateway: contextMatches(state, ["actors.gateway"]),
    isComplete:
      !contextValue(state, "model.amount") ||
      stateValue(state, "done", false) ||
      stateMatches(state, ["processed", "complete"])
  }));

  // --- context

  const context = useContext<PaymentDetailsContext>(state);

  const errors = useContext<PaymentDetailsContext["error"]>(state, "error");

  const model = useContext<PaymentDetailsContext["model"]>(state, "model");

  const schema = useContext<PaymentDetailsContext["schema"]>(state, "schema");

  const uischema = useContext<PaymentDetailsContext["uischema"]>(
    state,
    "uischema"
  );

  const gateways = useContext<PaymentDetailsContext["gateways"]>(
    state,
    "gateways"
  );

  const gateway = useContextActor(state, "actors.gateway");

  // --- methods (public methods)

  function input(value: PaymentDetailModel) {
    send({ type: "SET", data: toRaw(unref(value)) });
  }

  async function update(
    value: PaymentDetailModel | Record<string, any>
  ): Promise<void> {
    // first check if our fields have change, ie: model.code has changed
    value = toRaw(unref(value));
    const model = contextValue<PaymentDetailModel>(state, "model");

    if (!isEmpty(value) && !isEqual(model, value)) {
      send({ type: "SET", data: value, update: true });
    } else {
      send({ type: "UPDATE" });
    }
    // then wait for the paymentGateway actor to be updated
    return waitFor(
      service,
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
            "[headless] update PaymentDetails failed",
            error?.status ?? responseCodes.Timeout,
            {
              error,
              state: state.value
            }
          )
        );
      });
  }

  function clear() {
    send({ type: "CLEAR" });
  }

  function checkout() {
    send({ type: "CHECKOUT" });
  }

  function refresh(context?: PaymentDetailsArgs) {
    send({ type: "REFRESH", data: context });
  }

  // -----------------------------------------------------------------------------
  return {
    // --- state

    /**
     * Waits for the payment details machine to be ready (available or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the payment details state.
     * @typedef {Object} PaymentDetailsMeta
     * @property {boolean} isAvailable - True if payment details are available and not loading.
     * @property {boolean} isComplete - True if payment is complete or processed.
     * @property {boolean} isDirty - True if the model has unsaved changes.
     * @property {boolean} isFree - True if the payment amount is zero.
     * @property {boolean} isLoading - True if the machine is loading.
     * @property {boolean} isProcessing - True if the machine is checking or processing.
     * @property {boolean} isValid - True if the payment details are valid.
     * @property {boolean} hasErrors - True if there are errors.
     * @property {boolean} hasGateway - True if a gateway actor is present.
     */
    meta,

    // --- context

    /** The current payment context. */
    context,

    /** Any error returned by the machine. */
    errors,

    /** The payment details model. */
    model,

    /** The payment details schema. */
    schema,

    /** The UI schema for payment details. */
    uischema,

    /** The available gateways. */
    gateways,

    /** The current gateway actor. */
    gateway,

    // --- methods

    /** Clears the payment details state. */
    clear,

    /**
     * Inputs a model into the payment details machine.
     * @param {PaymentDetailModel} value - The model to input.
     * @returns {void}
     */
    input,

    /**
     * Updates the payment details model and triggers the machine to update payment details.
     * @param {PaymentDetailModel} model - The model to update.
     * @returns {Promise<void>} Resolves when the update is complete.
     */
    update,

    /** Triggers the machine to start the payment process. */
    checkout,

    /** Refreshes the payment details context. */
    refresh
  };
};

/**
 * The return type of the `usePaymentDetails` composable, ensuring type safety for consumers.
 */
export type UsePaymentDetails = ReturnType<typeof usePaymentDetails>;
