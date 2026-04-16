// --- external
import { waitFor } from "xstate/lib/waitFor";
import { computed, isRef, toRaw, unref } from "vue";

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
  useActor,
  useContext,
  useContextActor
} from "../../utils";
import { useConfig } from "../config";
import { usePaymentState, isPayable, hasAmount } from "./utils";
import {
  isEmpty,
  isEqual,
  isNil,
  filter,
  includes,
  some,
  gt,
  size,
  defaultsDeep
} from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { ComputedRef } from "vue";
import type { UseActor, ErrorObject } from "../../utils";
import type {
  PaymentDetail,
  PaymentDetailModel,
  PaymentDetailsContext
} from "./types";
import {
  GatewayContext,
  GatewayTypes,
  PaymentType
} from "@upmind-automation/types";
import type { ControlElement } from "@jsonforms/core";
import { useSchemaDefinitions, usePayUischemaDefinitions } from "./schemas";
import { zeroDecimalCurrencies } from "./gateways/utils";

// -----------------------------------------------------------------------------

/**
 * A composable function that provides access to the payment gateway actor.
 * in the PAY context
 * @param service - A computed ref to the payment gateway actor or its underlying service.
 * @returns An object containing the payment gateway state and methods to make a payment.
 */
export const usePaymentDetail = (
  service: ActorRef<any, any> | ComputedRef<UseActor | undefined>
) => {
  const { t } = useI18n();

  // --- state

  const actor: ComputedRef<UseActor | undefined> = isRef(service)
    ? (service as ComputedRef<UseActor>)
    : useActor(service as ActorRef<any, any>);

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

  const meta = computed(() => {
    // --- gateway
    const hasSelectedGateway = contextMatches(actor, ["gatewayHelper"]);
    const hasGateways = !isEmpty(gateways.value);

    // --- payment
    const ctx = contextValue<GatewayContext>(actor, "ctx");
    const isPayContext = ctx == GatewayContext.PAY;
    const requirePaymentForFreeOrders = contextMatches(
      actor,
      "requirePaymentForFreeOrders"
    );

    // --- state (isRefreshing computed first — usePaymentState needs it)
    const isRefreshing =
      hasGateways &&
      (stateMatches(actor, ["loading"]) ||
        (stateMatches(actor, ["available.checking"]) &&
          (!isPayable(model.value, requirePaymentForFreeOrders, ctx) ||
            !hasAmount(model.value, ctx))));

    // Backfill amount & wallet_amount from context when model is empty.
    // During transient states (currency refresh, initial load) the model
    // is cleared while context-level amounts persist. Without this,
    // usePaymentState would see undefined amounts and incorrectly report
    // isFree / needsPayment, causing the payment section to flash.
    const { hasSelectedPaymentMethod, isFree, isPayLater, needsPayment } =
      usePaymentState(
        defaultsDeep(model.value, {
          amount: amount.value,
          wallet_amount: amountWallet.value
        } as Partial<PaymentDetailModel>),
        ctx,
        requirePaymentForFreeOrders,
        isRefreshing
      );

    // --- payment methods
    const hasStoredPaymentMethods = !isEmpty(storedPaymentMethods.value);

    const isAvailable =
      !!actor.value &&
      (stateMatches(actor, ["available", "processing"]) || isRefreshing);

    const isLoading =
      !actor.value ||
      stateMatches(actor, ["loading", "restoring", "finalising"]) ||
      isRefreshing;

    return {
      // --- state
      hasErrors: !isEmpty(errors.value),
      isAvailable,
      isDirty: !isEmpty(
        contextValue<PaymentDetailsContext["model"]>(actor, "model")
      ),
      isLoading,
      isProcessing:
        stateMatches(actor, [
          "checking",
          "processing",
          "finalising",
          "restoring"
        ]) || isRefreshing,
      isRefreshing,
      isValid: gateway.value
        ? stateMatches(gateway.value, ["available.valid"])
        : stateMatches(actor, ["available.valid"]),

      // --- gateway
      hasGateways,
      hasSelectedGateway,
      hasSingleGateway:
        size(gateways.value) === 1 &&
        !includes(paymentTypes.value, PaymentType.PAY_LATER),
      isUnavailable:
        !gateway.value || stateMatches(gateway.value, ["unavailable"]),

      // --- payment
      canMakePartialPayment:
        isPayContext &&
        some(
          contextValue<PaymentType[]>(actor, "lookups.paymentTypes", []),
          value => value === PaymentType.PARTIAL_PAYMENT
        ),
      hasAccountCredit: isPayContext && gt(accountCredit.value?.total.value, 0),
      isComplete:
        isFree ||
        stateValue(actor, "done", false) ||
        stateMatches(actor, ["processed", "complete"]),
      isFree,
      isPayLater,
      isPayOffline:
        isPayLater ||
        contextMatches(gateway, "supported", false) ||
        stateMatches(gateway, ["unavailable"]) ||
        includes(
          [GatewayTypes.OFFLINE, GatewayTypes.BANK_TRANSFER],
          contextValue(gateway, "gateway.type")
        ),
      isSettlement: isPayContext && contextMatches(actor, ["paidAmount"]),
      needsPayment,

      // --- payment methods
      hasSelectedPaymentMethod,
      hasStoredPaymentMethods,
      hasUnsupportedPaymentMethods:
        (contextValue<PaymentDetail[]>(actor, ["raw.storedPaymentMethods"])
          ?.length ?? 0) < (storedPaymentMethods.value?.length ?? 0),

      // --- visibility
      showGatewaySelection:
        needsPayment &&
        hasGateways &&
        !hasSelectedGateway &&
        !(isFree && hasStoredPaymentMethods),

      // SHOW if payment is NOT needed (free) to allow checkout without gateway or payment method
      // OR if a gateway is selected
      // OR if a existing payment method is selected
      // OR if refreshing AND there are stored payment methods (so user can still act)
      showPaymentActions:
        !needsPayment ||
        hasSelectedGateway ||
        hasSelectedPaymentMethod ||
        (isRefreshing && hasStoredPaymentMethods),

      // SHOW if payment details are available AND NOT free (or in ADD context)
      showPaymentSection:
        isAvailable &&
        (!isFree || !isPayContext || requirePaymentForFreeOrders),

      // SHOW if payment is needed
      // AND stored methods exist
      // AND gateway is NOT selected
      // AND payment details are available
      showStoredPaymentMethods:
        needsPayment &&
        hasStoredPaymentMethods &&
        !hasSelectedGateway &&
        isAvailable,

      isPayContext
    };
  });

  // --- context

  const context = useContext<PaymentDetailsContext>(actor);
  const gateway = useContextActor(actor, "gatewayHelper");
  const gateways = useContext<PaymentDetailsContext["lookups"]["gateways"]>(
    actor,
    "lookups.gateways"
  );
  const paymentTypes = useContext<
    PaymentDetailsContext["lookups"]["paymentTypes"]
  >(actor, "lookups.paymentTypes");

  const errors = useContext<PaymentDetailsContext["error"]>(actor, "error");
  const validationErrors = useContext<ErrorObject[]>(actor, "error.data");

  // ---
  const amount = useContext<PaymentDetailsContext["amount"]>(actor, "amount");

  const amountWallet = useContext<PaymentDetailsContext["amountWallet"]>(
    actor,
    "amountWallet"
  );

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
    required: ["payment_details_id"],
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
    elements: filter(
      usePayUischemaDefinitions(contextValue<PaymentDetailsContext>(actor)!),
      d => (d as ControlElement).scope === "#/properties/payment_details_id"
    )
  }));

  const uischemaGateways = computed(() => ({
    type: "VerticalLayout",
    elements: filter(
      usePayUischemaDefinitions(contextValue<PaymentDetailsContext>(actor)!),
      d => (d as ControlElement).scope === "#/properties/gateway_id"
    )
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
          noLabel: true,
          step: includes(zeroDecimalCurrencies, currency.value?.code) ? 1 : 0.01
        }
      }
    ]
  }));

  const uischemaAmountCredit = computed(() => ({
    type: "VerticalLayout",
    elements: filter(
      usePayUischemaDefinitions(contextValue<PaymentDetailsContext>(actor)!),
      d => (d as ControlElement).scope === "#/properties/wallet_amount"
    )
  }));

  const storedPaymentMethods = useContext<
    PaymentDetailsContext["lookups"]["storedPaymentMethods"]
  >(actor, "lookups.storedPaymentMethods", []);

  const accountCredit = useContext<
    PaymentDetailsContext["lookups"]["accountCredit"]
  >(actor, "lookups.accountCredit");

  const { data } = useConfig();

  // --- methods

  async function setAmountCredit(value: PaymentDetailModel["wallet_amount"]) {
    actor.value?.send({
      type: "SET_WALLET_AMOUNT",
      data: { ...toRaw(unref(model)), wallet_amount: value }
    });
  }

  async function setAmount(value: PaymentDetailModel["wallet_amount"]) {
    actor.value?.send({
      type: "SET_PARTIAL_PAYMENT",
      data: {
        amount: value,
        type: PaymentType.PARTIAL_PAYMENT
      }
    });
  }

  async function resetPartialAmount() {
    actor.value?.send({
      type: "SET_PARTIAL_PAYMENT",
      data: { amount: undefined }
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

  function add(): Promise<void> {
    const { t } = useI18n();

    actor.value?.send({ type: "ADD" });
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
            error?.message ?? t("error.payment_gateway_update_failed"),
            error?.status ?? responseCodes.Timeout,
            error?.origin ?? ErrorOrigin.Headless,
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

  function renderChallenge(container: HTMLElement) {
    actor.value?.send({ type: "RENDER", data: { container } });
  }

  function cancelChallenge() {
    actor.value?.send({ type: "CHALLENGE_CANCELLED" });
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
     * @property {boolean} isRefreshing - Indicates if the payment details is reloading (loading with previously loaded data).
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isProcessing - Indicates if the payment details is processing.
     * @property {boolean} isValid - Indicates if the payment details is valid.
     * @property {boolean} isDirty - Indicates if the payment details is dirty.
     * @property {boolean} hasSelectedGateway - Indicates if the payment details has a gateway actor.
     * @property {boolean} isComplete - Indicates if the payment details is complete.
     * @property {boolean} isFree - Indicates if the payment is free (no amount).
     * @property {boolean} hasStoredPaymentMethods - Indicates if there are stored payment methods available.
     * @property {boolean} hasGateways - Indicates if there are multiple payment gateways available.
     * @property {boolean} hasUnsupportedPaymentMethods - Indicates if some stored payment methods are being filtered out due to currency/country restrictions.
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
    clickwrap: data.clickwrapDisclaimer,

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
     * Resets the partial payment amount back to the full outstanding balance.
     * @returns {void} Does not return anything.
     */
    resetPartialAmount,

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
    useStoredPayment,

    /**
     * Renders the payment challenge into the specified container.
     * @param {HTMLElement} container The HTML element to render the challenge into.
     */
    render: renderChallenge,

    /**
     * Cancels the payment challenge.
     * @returns {void} Does not return anything.
     */
    cancelChallenge,

    /** Submit the ADD flow — triggers beginSetup → SDK confirm → endSetup. */
    add
  };
};

/** The return type of {@link usePaymentDetail} composable. */
export type UsePaymentDetail = ReturnType<typeof usePaymentDetail>;
