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
import { isEmpty, isEqual, isNil, filter, includes, some, gt } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { ComputedRef } from "vue";
import type { Actor, ErrorObject } from "../../utils";
import type {
  PaymentDetail,
  PaymentDetailModel,
  PaymentDetailsContext
} from "./types";
import { GatewayTypes, PaymentType } from "@upmind-automation/types";
import { useSchemaDefinitions, useUischemaDefinitions } from "./schemas";

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
    hasGateways: !isEmpty(gateways.value),
    hasStoredPaymentMethods: !isEmpty(storedPaymentMethods.value),
    hasSelectedPaymentMethod: !isEmpty(
      contextValue<PaymentDetailModel>(actor, "model.payment_details_id")
    ),
    hasUnsupportedPaymentMethods:
      (contextValue<PaymentDetail[]>(actor, ["raw.storedPaymentMethods"])
        ?.length ?? 0) < (storedPaymentMethods.value?.length ?? 0),
    hasAccountCredit: gt(accountCredit.value?.total.value, 0),
    hasErrors: !isEmpty(errors.value),
    isProcessing: stateMatches(actor, ["checking", "processing"]),
    isValid: gateway.value
      ? stateMatches(gateway.value, ["available.valid"])
      : stateMatches(actor, ["available.valid"]),

    isDirty: !isEmpty(
      contextValue<PaymentDetailsContext["model"]>(actor, "model")
    ),

    isFree: !contextValue(actor, "amount"),

    isPayLater: contextMatches(actor, "model.type", PaymentType.PAY_LATER),

    isPayOffline:
      contextMatches(actor, "model.type", PaymentType.PAY_LATER) ||
      contextMatches(gateway, "supported", false) ||
      includes(
        [GatewayTypes.OFFLINE, GatewayTypes.BANK_TRANSFER],
        contextValue(gateway, "gateway.type")
      ),

    needsPayment:
      !!contextValue(actor, "model.amount", 0)! &&
      !isEqual(
        contextValue(actor, "model.amount", 0)!,
        contextValue(actor, "model.wallet_amount", 0)!
      ) &&
      includes(
        [PaymentType.PARTIAL_PAYMENT, PaymentType.PAY_IN_FULL],
        contextValue(actor, "model.type")
      ),

    canMakePartialPayment: some(
      contextValue<PaymentType[]>(actor, "lookups.paymentTypes", []),
      value => value === PaymentType.PARTIAL_PAYMENT
    ),

    isComplete:
      !contextValue(actor, "amount") ||
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"])
  }));

  // --- context

  const context = useContext<PaymentDetailsContext>(actor);
  const gateway = useContextActor(actor, "gatewayHelper");
  const gateways = useContext<PaymentDetailsContext["lookups"]["gateways"]>(
    actor,
    "lookups.gateways"
  );
  const errors = useContext<PaymentDetailsContext["error"]>(actor, "error");
  const validationErrors = useContext<ErrorObject[]>(actor, "error.data");

  // ---
  const amount = useContext<PaymentDetailsContext["amount"]>(actor, "amount");
  const amountsFormatted = useContext<
    PaymentDetailsContext["lookups"]["amountsFormatted"]
  >(actor, "lookups.amountsFormatted");

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

  const schemaStoredPaymentMethods = computed(() => ({
    type: "object",
    definitions: useSchemaDefinitions(
      contextValue<PaymentDetailsContext>(actor)!
    ),
    properties: {
      // amount: { $ref: "#/definitions/amount" },
      // wallet_amount: { $ref: "#/definitions/wallet_amount" },
      // gateway_id: { $ref: "#/definitions/gateway_id" },
      payment_details_id: { $ref: "#/definitions/payment_details_id" }
    }
  }));

  const schemaGateways = computed(() => ({
    type: "object",
    definitions: useSchemaDefinitions(
      contextValue<PaymentDetailsContext>(actor)!
    ),
    properties: {
      gateway_id: { $ref: "#/definitions/gateway_id" }
    }
  }));

  const schemaAmount = computed(() => ({
    type: "object",
    definitions: useSchemaDefinitions(
      contextValue<PaymentDetailsContext>(actor)!
    ),
    properties: {
      type: {
        type: "string",
        const: PaymentType.PARTIAL_PAYMENT
      },
      amount: { $ref: "#/definitions/amount" },
      gateway_id: { $ref: "#/definitions/gateway_id" }
    }
  }));

  const schemaAmountCredit = computed(() => ({
    type: "object",
    definitions: useSchemaDefinitions(
      contextValue<PaymentDetailsContext>(actor)!
    ),
    properties: {
      wallet_amount: { $ref: "#/definitions/wallet_amount" }
    }
  }));

  const uischema = useContext<PaymentDetailsContext["uischema"]>(
    actor,
    "uischema"
  );

  const uischemaStoredPaymentMethods = computed(() => ({
    type: "VerticalLayout",
    elements: [
      useUischemaDefinitions(contextValue<PaymentDetailsContext>(actor)!)
        .payment_details_id
    ]
  }));

  const uischemaGateways = computed(() => ({
    type: "VerticalLayout",
    elements: [
      useUischemaDefinitions(contextValue<PaymentDetailsContext>(actor)!)
        .gateway_id
    ]
  }));

  const uischemaAmount = computed(() => ({
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/amount",
        options: {
          type: "currency",
          currency: currency.value?.code,
          noLabel: true
        }
      }
    ]
  }));

  const uischemaAmountCredit = computed(() => ({
    type: "VerticalLayout",
    elements: [
      useUischemaDefinitions(contextValue<PaymentDetailsContext>(actor)!)
        .wallet_amount
    ]
  }));
  const storedPaymentMethods = useContext<
    PaymentDetailsContext["lookups"]["storedPaymentMethods"]
  >(actor, "lookups.storedPaymentMethods", []);

  const accountCredit = useContext<
    PaymentDetailsContext["lookups"]["accountCredit"]
  >(actor, "lookups.accountCredit");

  const { uiCart } = useBrand();
  const clickwrap = computed(() => uiCart.value?.clickwrap_disclaimer);

  // --- methods

  async function setAmountCredit(value: PaymentDetailModel["wallet_amount"]) {
    actor.value?.send({
      type: "SET",
      data: { ...toRaw(unref(model)), wallet_amount: value }
    });
  }

  async function setAmount(value: PaymentDetailModel["wallet_amount"]) {
    actor.value?.send({
      type: "SET",
      data: {
        ...toRaw(unref(model)),
        amount: value,
        type: PaymentType.PARTIAL_PAYMENT
      }
    });
  }

  async function setGateway(value: PaymentDetailModel["gateway_id"] | null) {
    actor.value?.send({
      type: "SET",
      data: { ...toRaw(unref(model)), gateway_id: value }
    });
  }

  async function setStoredPaymentMethod(
    value: PaymentDetailModel["payment_details_id"]
  ) {
    actor.value?.send({
      type: "SET",
      data: { ...toRaw(unref(model)), payment_details_id: value }
    });
  }

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

    /** The account credit details. */
    accountCredit,

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

    /** The formatted payment and wallet amounts as per locale and currency. */
    amountsFormatted,

    /** The payment currency */
    currency,

    /** The full address to be used for the order */
    address,

    /** The current payment details model. */
    model,

    /** The payment details schema. */
    schema,

    /** Syntactic Sugar for partial forms */
    schemaStoredPaymentMethods,
    schemaGateways,
    schemaAmount,
    schemaAmountCredit,

    /** The payment details UI schema. */
    uischema,

    /** Syntactic Sugar for partial forms */
    uischemaStoredPaymentMethods,
    uischemaGateways,
    uischemaAmount,
    uischemaAmountCredit,

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
     * Updates the payment details with the specified amount.
     * @param {number} value The amount to set for the payment details.
     * @returns {void} Does not return anything.
     *
     */
    setAmount,

    /**
     * Updates the payment details with the specified wallet amount ( ie. account credit ) to be used for this payment.
     * @param {number} value The wallet amount to set for the payment details.
     * @returns {void} Does not return anything.
     *
     */
    setAmountCredit,

    /**
     * Updates the payment details with the specified gateway ID.
     * @param {string | null} value The gateway ID to set for the payment details.
     * @returns {void} Does not return anything.
     */
    setGateway,

    /**
     * Updates the payment details with the specified stored payment method ID.
     * @param {string | null} value The stored payment method ID to set for the payment details.
     * @returns {void} Does not return anything.
     */
    setStoredPaymentMethod,

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
