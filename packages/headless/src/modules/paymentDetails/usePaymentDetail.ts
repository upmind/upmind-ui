// --- external
import { waitFor } from "xstate/lib/waitFor";
import { computed, toRaw, unref } from "vue";

// --- internal
import { useI18n } from "../system";

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
  useContextActor
} from "../../utils";
import { useBrand } from "../brand";
import { isEmpty, isEqual, isNil, filter, some } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { ComputedRef } from "vue";
import type { Actor, ErrorObject } from "../../utils";
import type { PaymentDetailModel, PaymentDetailsContext } from "./types";

// -----------------------------------------------------------------------------

/**
 * A composable function that provides access to the payment gateway actor.
 * in the PAY context
 * @param actor - A computed ref to the payment gateway actor.
 * @returns An object containing the payment gateway state and methods to make a payment.
 */
export const usePaymentDetail = (actor: ComputedRef<Actor | undefined>) => {
  const { t } = useI18n();

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
        state => stateMatches(state, ["available", "unavailable", "error"]),
        { timeout: Infinity }
      ).then(state => {
        if (stateMatches(state, ["error", "unavailable"])) return false;
        return true;
      })
    );
  }

  const meta = computed(() => ({
    isAvailable:
      !!actor.value && stateMatches(actor, ["available", "complete"]),
    isLoading: !actor.value || stateMatches(actor, ["loading"]),
    hasGateway: contextMatches(actor, ["gatewayHelper"]),
    hasGateways: contextMatches(actor, ["gateways"]),
    hasStoredPaymentMethods: contextMatches(actor, ["storedPaymentMethods"]),
    hasUnsupportedPaymentMethods: some(
      contextValue(actor, ["storedPaymentMethods"]),
      ["meta.isSupported", false]
    ),
    hasErrors: stateMatches(actor, ["error"]),
    isProcessing: stateMatches(actor, ["checking", "processing"]),
    isValid: stateMatches(actor, ["valid"]),
    isDirty: !isEmpty(
      contextValue<PaymentDetailsContext["model"]>(actor, "model")
    ),

    isFree: !contextValue(actor, "amount"),
    isComplete:
      !contextValue(actor, "amount") ||
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"])
  }));

  // --- context

  const context = useContext<PaymentDetailsContext>(actor);
  const gateway = useContextActor(actor, "gatewayHelper");
  const gateways = useContext<PaymentDetailsContext["gateways"]>(
    actor,
    "gateways"
  );
  const errors = useContext<PaymentDetailsContext["error"]>(actor, "error");
  const validationErrors = useContext<ErrorObject[]>(actor, "error.data");

  // ---
  const amount = useContext<PaymentDetailsContext["amount"]>(actor, "amount");
  const currency = useContext<PaymentDetailsContext["currency"]>(
    actor,
    "currency"
  );
  const address = useContext<PaymentDetailsContext["address"]>(
    actor,
    "address"
  );
  const model = useContext<PaymentDetailsContext["model"]>(actor, "model");
  const schema = useContext<PaymentDetailsContext["schema"]>(actor, "schema");
  const uischema = useContext<PaymentDetailsContext["uischema"]>(
    actor,
    "uischema"
  );

  const storedPaymentMethods = filter(
    useContext<PaymentDetailsContext["storedPaymentMethods"]>(
      actor,
      "storedPaymentMethods"
    ).value || [],
    method => method?.meta.isSupported
  );

  const { uiCart } = useBrand();
  const clickwrap = computed(() => uiCart.value?.clickwrap_disclaimer);

  // --- methods

  async function input(value: PaymentDetailModel) {
    actor.value?.send({ type: "SET", data: toRaw(unref(value)) });
  }

  async function update(value?: PaymentDetailModel): Promise<void> {
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
            error.message ?? t("error.payment_details_update_failed"),
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

  function useStoredPayment(model: PaymentDetailModel) {
    actor.value?.send({ type: "PAYMENT_DETAILS", data: model });
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    state: computed(() => actor.value?.state.value.toStrings()),

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
     * @property {boolean} hasStoredPaymentMethods - Indicates if there are stored payment methods available.
     * @property {boolean} hasGateways - Indicates if there are multiple payment gateways available.
     * @property {boolean} hasUnsupportedPaymentMethods - Indicates if some stored payment methods are being filtered out due to currency/country restrictions.
     * @property {boolean} isFree - Indicates if the payment amount is zero or not set.
     * @property {boolean} isComplete - Indicates if the payment details process is complete.
     * @type {PaymentDetailsMeta}
     */
    meta,

    // --- context

    /** The full payment details context object. */
    context,

    /** The available gateways. */
    gateways,

    /** The payment gateway actor. */
    gateway,

    /** The stored payment methods available. */
    storedPaymentMethods,

    /** Any error returned by the payment details actor. */
    errors,

    /**
     * Validation errors encountered during payment gateway operations.
     * Typically contains an array of error objects with details about the validation issues.
     * @type {ErrorObject[]}
     * @see https://ajv.js.org/guide/validation-errors.html#validation-error-object
     */
    validationErrors,

    /** The payment amount, if applicable. */
    amount,

    /** The payment currency */
    currency,

    /** The full address to be used for the order */
    address,

    /** The current payment details model. */
    model,

    /** The payment details schema. */
    schema,

    /** The payment details UI schema. */
    uischema,

    /** The payment details clickwrap disclaimer. */
    clickwrap,

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

    /** Updates the payment details with the stored Payment method ID.
     * @param {PaymentDetailModel} model The payment details model to use for checkout.
     * @returns {void} Does not return anything.
     */
    //
    useStoredPayment
  };
};

/** The return type of {@link usePaymentDetail} composable. */
export type UsePaymentDetails = ReturnType<typeof usePaymentDetail>;
