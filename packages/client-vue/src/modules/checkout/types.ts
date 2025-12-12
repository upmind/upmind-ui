import type {
  AccountCredit,
  PaymentDetailsContext
} from "@upmind-automation/headless";
import type { ButtonProps } from "@upmind-automation/upmind-ui";
import type { HtmlHTMLAttributes } from "vue";
// ---
export type PaymentDetailsProps = {
  class?: HtmlHTMLAttributes["class"];
};

export type PaymentGatewayProps = {
  variant?: ButtonProps["variant"];
  color?: ButtonProps["color"];
  processing?: boolean;
  modelValue?: PaymentDetailsContext["model"]["gateway_id"];
};

export type PaymentGatewaysProps = {
  variant?: ButtonProps["variant"];
  color?: ButtonProps["color"];
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
  processing?: boolean;
  modelValue?: PaymentDetailsContext["model"]["amount"];
  currency?: PaymentDetailsContext["currency"];
  schema: PaymentDetailsContext["schema"];
  uischema: PaymentDetailsContext["uischema"];
};

export enum CHECKOUT_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed"
}

export interface CheckoutHeroProps {
  template?: CHECKOUT_TEMPLATE;
}
