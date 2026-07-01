import { interpret } from "xstate";
import { GatewayContext as GatewayCtx } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useI18n } from "../system-localisation";
import paymentDetailMachine from "./payment-detail.machine";
import { usePaymentDetail } from "./usePaymentDetail";
import { DetailedError, responseCodes, ErrorOrigin } from "../../utils";
import type { PaymentDetailsAddArgs } from "./payment-details.types";
import type { ICurrency } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module paymentDetails/usePaymentDetailAdd
 * @description Composable for the ADD payment detail flow — storing a payment
 * method independently, outside of a payment/checkout flow.
 *
 * Uses the same paymentDetail machine as the PAY context, initialised with
 * ctx: GatewayCtx.ADD which activates ADD-specific guards and services.
 */

export const usePaymentDetailAdd = ({
  currency
}: PaymentDetailsAddArgs = {}) => {
  const { currency: brandCurrency } = useBrand();
  const { t } = useI18n();

  // Most gateways need a currency, so if we are not provided then fall back to the brand currency
  const safeCurrency = currency ?? brandCurrency.value;

  if (!safeCurrency) {
    throw new DetailedError(
      t("error.currency_not_available"),
      responseCodes.No_Content,
      ErrorOrigin.Headless
    );
  }

  const service = interpret(
    paymentDetailMachine.withContext({
      ...paymentDetailMachine.context,
      currency: safeCurrency,
      amount: 0.0,
      ctx: GatewayCtx.ADD
    }),
    {
      devTools: true
    }
  ).start();

  const detail = usePaymentDetail(service);

  /**
   * Refresh the ADD flow with a new currency.
   * Only sends the REFRESH event if the currency has actually changed.
   */
  function refresh(newCurrency: ICurrency) {
    const current = service.getSnapshot().context.currency;
    if (current?.id === newCurrency.id) return;
    service.send({ type: "REFRESH", data: { currency: newCurrency } });
  }

  //  --------------------------------------------------------------------------
  /**
   * Exclude PAY-only properties from the returned object.
   */
  return {
    // --- state
    /** Current machine state path. */
    state: detail.state,
    /** Waits for the machine to be ready. */
    isReady: detail.isReady,
    /** Meta flags for the payment detail state. */
    meta: detail.meta,

    // --- context
    /** The full payment details context. */
    context: detail.context,
    /** Any errors from the machine. */
    errors: detail.errors,
    /** The selected gateway actor. */
    gateway: detail.gateway,
    /** Available gateways for storing a payment method. */
    gateways: detail.gateways,
    /** The current model. */
    /** The payment currency */
    currency: detail.currency,
    /** The full address to be used for the order */
    address: detail.address,
    model: detail.model,
    /** The gateway form JSON schema. */
    schema: detail.schema,
    /** Gateway selection schema. */
    schemaGateways: detail.schemaGateways,
    /** The gateway form UI schema. */
    uischema: detail.uischema,
    /** Gateway selection UI schema. */
    uischemaGateways: detail.uischemaGateways,
    /** Validation errors from gateway form. */
    validationErrors: detail.validationErrors,
    /** Stored payment methods available to the client. */
    storedPaymentMethods: detail.storedPaymentMethods,

    // --- methods
    /** Cancel a 3DS/SCA challenge. */
    cancelChallenge: detail.cancelChallenge,
    /** Clear the payment detail state. */
    clear: detail.clear,
    /** Send form input to the machine. */
    input: detail.input,
    /** Render a 3DS/SCA challenge into a container. */
    render: detail.render,
    /** Select a gateway by ID. */
    setGateway: detail.setGateway,
    /** Submit the ADD flow — triggers beginSetup → SDK confirm → endSetup. */
    add: detail.add,
    /** Refresh the ADD flow with a new currency (only if changed). */
    refresh
  };
};

/** The return type of {@link usePaymentDetailAdd} composable. */
export type UsePaymentDetailAdd = ReturnType<typeof usePaymentDetailAdd>;
