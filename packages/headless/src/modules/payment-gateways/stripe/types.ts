import type { GatewayContext } from "../payment-gateways.types";
import type {
  Stripe,
  StripeElements,
  StripePaymentElement
} from "@stripe/stripe-js";

// -----------------------------------------------------------------------------

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
  IDEAL = "ideal",
  KLARNA = "klarna", // NYS
  KONBINI = "konbini", // NYS
  OXXO = "oxxo", // NYS
  P24 = "p24", // NYS
  PAYNOW = "paynow", // NYS
  PAYPAL = "paypal",
  PIX = "pix", // NYS
  PROMPTPAY = "promptpay", // NYS
  SEPA_DEBIT = "sepa_debit",
  SOFORT = "sofort", // NYS
  US_BANK_ACCOUNT = "us_bank_account", // NYS
  WECHAT_PAY = "wechat_pay" // NYS
}

export enum PAYPAL_PC {
  // PayPal Presentment Currencies
  AUD = "AUD", // Australian Dollar
  CAD = "CAD", // Canadian Dollar
  CHF = "CHF", // Swiss Franc
  CZK = "CZK", // Czech Koruna
  DKK = "DKK", // Danish Krone
  EUR = "EUR", // Euro
  GBP = "GBP", // British Pound
  HKD = "HKD", // Hong Kong Dollar
  NOK = "NOK", // Norwegian Krone
  NZD = "NZD", // New Zealand Dollar
  PLN = "PLN", // Polish Zloty
  SEK = "SEK", // Swedish Krona
  SGD = "SGD", // Singapore Dollar
  USD = "USD" // US Dollar
}

export enum SEPA_PC {
  // SEPA Presentment Currencies
  EUR = "EUR" // Euro
}

export enum IDEAL_PC {
  // iDEAL Presentment Currencies
  EUR = "EUR" // Euro
}

export type StripeContext = GatewayContext<{
  sdk?: {
    stripe: Stripe;
    elements: StripeElements;
    element: StripePaymentElement;
  };
}>;
