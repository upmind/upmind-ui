// --- external
import { loadStripe } from "@stripe/stripe-js";

// --- internal
import { useApi, useSession } from "../../../";

// --- utils
import { getSupportedPaymentMethods, getPublicKey } from "./utils";

// --- types
import type { StripeEvent, StripeContext } from "./types.d";

// --------------------------------------------------------
//  ENUMS

export enum STRIPE_QUERY_PARAMS {
  STRIPE_REDIRECT_STATUS = "redirect_status",
  STRIPE_SETUP_INTENT = "setup_intent",
  STRIPE_SETUP_INTENT_CLIENT_SECRET = "setup_intent_client_secret"
}

// NYS = "Not Yet Supported"

export enum STRIPE_PAYMENT_METHOD_TYPES {
  ACSS_DEBIT = "acss_debit", // NYS
  AFFIRM = "affirm", // NYS
  AFTERPAY_CLEARPAY = "afterpay_clearpay", // NYS
  ALIPAY = "alipay", // NYS
  AU_BECS_DEBIT = "au_becs_debit", // NYS
  BACS_DEBIT = "bacs_debit", // NYS
  BANCONTACT = "bancontact", // NYS
  BLIK = "blik", // NYS
  BOLETO = "boleto", // NYS
  CARD = "card",
  CASHAPP = "cashapp", // NYS
  EPS = "eps", // NYS
  FPX = "fpx", // NYS
  GIROPAY = "giropay", // NYS
  GRABPAY = "grabpay", // NYS
  IDEAL = "ideal", // NYS
  KLARNA = "klarna", // NYS
  KONBINI = "konbini", // NYS
  OXXO = "oxxo", // NYS
  P24 = "p24", // NYS
  PAYNOW = "paynow", // NYS
  PAYPAL = "paypal",
  PIX = "pix", // NYS
  PROMPTPAY = "promptpay", // NYS
  SEPA_DEBIT = "sepa_debit", // NYS
  SOFORT = "sofort", // NYS
  US_BANK_ACCOUNT = "us_bank_account", // NYS
  WECHAT_PAY = "wechat_pay" // NYS
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
async function load(
  { gateway, isPayment, amount, currency }: StripeContext,
  _event: StripeEvent
) {
  const key = getPublicKey(gateway);
  if (!key) return Promise.reject("Stripe public key not found.");

  const stripe = await loadStripe(key);

  return new Promise(resolve => {
    resolve(stripe);
  });
}

// --------------------------------------------------------
// PAYMENT METHODS

async function createPaymentElement(
  { amount, currency, gateway, stripe }: StripeContext,
  _event: StripeEvent
) {
  // Flow ref: https://stripe.com/docs/payments/finalize-payments-on-the-server?platform=web&type=payment#additional-options
  const elements = stripe.elements({
    amount: Math.round((amount || 0) * 100), // NB: Stripe expects amount in cents
    currency: currency.code.toLowerCase(), // NB: MUST be lowercase
    locale: "auto", // TODO: add i18n local
    mode: "payment",
    paymentMethodCreation: "manual",
    paymentMethodTypes: getSupportedPaymentMethods(gateway),
    setupFutureUsage: "off_session"
  });
  const element = elements?.create("payment");

  return new Promise(resolve => {
    resolve({
      elements,
      element
    });
  });
}
/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Stripe SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function makePayment({ gateway, elements, stripe }) {
  if (!elements || !stripe)
    return Promise.reject("Gateway elements not found.");
  // return Promise.reject($t("_sentence.payments.gateway_elements_not_found"));

  // Submit form to validate fields
  const { error: submitError } = await elements.submit();
  if (submitError) return Promise.reject(submitError);

  // Create PaymentMethod using details collected via Payment Element
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    elements
  });

  return new Promise((resolve, reject) => {
    if (error) {
      reject(error);
    } else {
      /* Here we don't pass 'auto_payment' flag as 'store_on_payment_auto_payment' is injected from parent gatewayComponent */
      resolve({
        gateway_id: gateway.id,
        payment_method_addition: {
          payment_method_type: paymentMethod?.type,
          payment_method_id: paymentMethod?.id
        }
      });
    }
  });
}

// --------------------------------------------------------
// ADD ASYNC PAYMENT METHODS
/**
 * @name beginSetup
 * @desc Here we obtain a client secret via the API, before creating a
 * Stripe 'Elements' instance.
 */
async function createAddElement(
  { stripe, gateway, isPayment, amount, currency }: StripeContext,
  _event: StripeEvent
) {
  const { post, useUrl } = useApi();
  const { getUserId } = useSession();
  const client_id = await getUserId();

  return post({
    url: useUrl(`gateway/frontend/tokenize-begin/${gateway.id}`),
    withAccessToken: true,
    data: {
      client_id
    }
  }).then(({ data }) => {
    // Flow ref: https://stripe.com/docs/payments/save-and-reuse?platform=web&ui=elements#enable-payment-methods
    debugger;
    const clientPaymentDetailsId = data?.client_payment_details?.id;
    const clientSecret = data?.gateway_specific?.client_secret;

    // --- create stripe elements
    const elements = stripe.elements({
      clientSecret,
      locale: "auto" // TODO: add i18n local
    });

    debugger;
    const element = elements?.create("payment");
    debugger;
    // ---

    return {
      elements,
      element,
      clientSecret,
      clientPaymentDetailsId
    };
  });
}

/**
 * @name confirmSetup
 * @desc Here we confirm the setup of a new detail using the Stripe SDK. We
 * may (or may not), be redirected off site at point – hence we save the
 * operation (and next procedure) into session storage.
 */
async function confirmSetup() {}

/**
 * @name endSetup
 * @desc If function is invoked, we in theory have a new payment detail
 * ID from Stripe. To finish up, we need to save detail as a payment
 * method within the Upmind ecosystem.
 */
async function endSetup(paymentDetailId?: string) {}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  // ---
  createPaymentElement,
  createAddElement,
  // ---
  confirmSetup,
  endSetup,
  makePayment
};
