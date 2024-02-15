// --- external
import { loadStripe } from "@stripe/stripe-js";

// --- internal
import { useApi, useSession } from "../api";

// --- utils
import { getSupportedPaymentMethods, getPublicKey } from "./utils";

// --- types
import type { StripeEvents, StripeContext } from "../types";

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

/**
 * @name beginSetup
 * @desc Here we obtain a client secret via the API, before creating a
 * Stripe 'Elements' instance.
 */
async function beginSetup(
  { gateway_id, gateway, isPayment, amount, currency }: StripeContext,
  _event: StripeEvents
) {
  const { post, useUrl } = useApi();

  const { getUserId } = useSession();
  const client_id = await getUserId();

  const stripe = await loadStripe(getPublicKey(gateway));

  return post({
    url: useUrl(`gateway/frontend/tokenize-begin/${gateway_id}`),
    withAccessToken: true,
    data: {
      client_id
    }
  }).then(({ data }) => {
    debugger;

    const response = {
      stripe, // NB: we need to return stripe here so we can use it in the machine
      // ---
      elements: [],
      element: null,
      clientPaymentDetailsId: data?.client_payment_details?.id,
      clientSecret: data?.gateway_specific?.client_secret
    };

    debugger;

    // --- create stripe elements

    if (isPayment) {
      debugger;
      response.elements = stripe.elements({
        amount: Math.round((amount || 0) * 100), // NB: Stripe expects amount in cents
        currency: currency.code.toLowerCase(), // NB: MUST be lowercase
        locale: "auto", // TODO: add i18n local
        mode: "payment",
        paymentMethodCreation: "manual",
        paymentMethodTypes: getSupportedPaymentMethods(gateway),
        setupFutureUsage: "off_session"
      });
    } else {
      debugger;
      response.elements = stripe.elements({
        clientSecret: response.clientSecret,
        locale: "auto" // TODO: add i18n local
      });
    }

    debugger;
    response.element = response.elements?.create("payment");
    debugger;
    // ---

    return response;
  });
}

/**
 * @name getPaymentData
 * @desc Here we create a new payment detail via the Stripe SDK, and return
 * the payment detail ID which we later relay to the BE (when executing
 * payment). We do not need to pass a client secret for this flow, as the
 * payment detail is attached to a customer and confirmed server-side.
 */
async function getPaymentData() {}

/**
 * @name confirmSetup
 * @desc Here we confirm the setup of a new detail using the Stripe SDK. We
 * may (or may not), be redirected off site at this point – hence we save the
 * operation (and next procedure) into session storage.
 */
async function confirmSetup() {}

/**
 * @name endSetup
 * @desc If this function is invoked, we in theory have a new payment detail
 * ID from Stripe. To finish up, we need to save this detail as a payment
 * method within the Upmind ecosystem.
 */
async function endSetup(paymentDetailId?: string) {}

// --------------------------------------------------------
// EXPORTS

export default {
  beginSetup,
  confirmSetup,
  endSetup,
  getPaymentData
};
