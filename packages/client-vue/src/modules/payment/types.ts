// -----------------------------------------------------------------------------
/**
 * @module payment/types
 * @description Type definitions for payment module components.
 */

import type {
  AccountCredit,
  PaymentDetailsContext
} from "@upmind-automation/headless";
import type { ButtonVariants } from "@upmind/ui";
import type { HtmlHTMLAttributes } from "vue";

// --- internal

// --- types

// -----------------------------------------------------------------------------

export type PaymentDetailsProps = {
  class?: HtmlHTMLAttributes["class"];
  label?: string;
  icon?: string;
  processing?: boolean;
  error?: string;
  /** Closes the section until the steps before it are done. */
  disabled?: boolean;
};

export type PaymentGatewayProps = {
  variant?: ButtonVariants["variant"];
  processing?: boolean;
  modelValue?: PaymentDetailsContext["model"]["gateway_id"];
  error?: string;
  singleGateway?: boolean;
};

export type PaymentGatewaysProps = {
  variant?: ButtonVariants["variant"];
  processing?: boolean;
  modelValue?: PaymentDetailsContext["model"]["payment_details_id"];
  schema: PaymentDetailsContext["schema"];
  uischema: PaymentDetailsContext["uischema"];
};

export type StoredPaymentMethodProps = {
  errors: PaymentDetailsContext["error"];
  processing?: boolean;
  modelValue?: PaymentDetailsContext["model"]["payment_details_id"];
  schema: PaymentDetailsContext["schema"];
  uischema: PaymentDetailsContext["uischema"];
};

export type PaymentActionsProps = {
  clickwrap?: string;
  processing?: boolean;
  disabled?: boolean;
  errors?: boolean;
  offline?: boolean;
  free?: boolean;
  settlement?: boolean;
};

export type AccountCreditProps = {
  processing?: boolean;
  amountsFormatted?: PaymentDetailsContext["lookups"]["amountsFormatted"];
  accountCredit: AccountCredit;
  amount: PaymentDetailsContext["model"]["amount"];
  modelValue: PaymentDetailsContext["model"]["wallet_amount"];
  schema: PaymentDetailsContext["schema"];
  uischema: PaymentDetailsContext["uischema"];
};

export type PaymentAmountProps = {
  amount?: PaymentDetailsContext["model"]["amount"];
  amountsFormatted?: PaymentDetailsContext["lookups"]["amountsFormatted"];
  processing?: boolean;
  modelValue?: PaymentDetailsContext["model"]["amount"];
  currency?: PaymentDetailsContext["currency"];
  schema: PaymentDetailsContext["schema"];
  uischema: PaymentDetailsContext["uischema"];
};

export type PaymentNotRequiredProps = {
  free?: boolean;
  processing?: boolean;
  hasErrors?: boolean;
  payOffline?: boolean;
};

export type PaymentGatewaysUnavailableProps = {
  clickwrap?: string;
  countryName?: string;
  currencyCode?: string;
  processing?: boolean;
};
