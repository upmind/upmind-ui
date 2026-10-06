// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-invoices.schemas
 * @description Schema/uischema for the pay form the SCOPED `client-invoices`
 * module headless does not have yet carries (plan F4) — legacy's
 * `invoicePaymentModal` and the account-credit box `selectPaymentMethodComp`
 * drew inside it. Written in the headless shape, so
 * `/scoped-composable-factory` consumes this file unchanged alongside
 * `client-invoices.ts`'s four-layer contract.
 *
 * Both controls are CONDITIONAL on the context rather than on a rule: a brand
 * that takes only the whole balance has no amount to offer, and an account
 * holding no credit in the currency being handed over has no credit to draw
 * on. What the client may still SAY is ruled: the credit figure shows while
 * the box is ticked, and reads as a stated fact where the amount is not the
 * client's to change.
 *
 * Every bound here arrives already worked out (`payableTender`); nothing on
 * this form computes a figure (plan R6).
 *
 * @module-oracle vue-app `invoicePaymentModal.vue`,
 * `selectPaymentMethodComp.vue`.
 */

import { RuleEffect } from "@jsonforms/core";
import { compact } from "lodash-es";
import type {
  InvoicePaymentContext,
  InvoicePaymentModel
} from "./client-invoices";
import type {
  ControlElement,
  JsonSchema7,
  Rule,
  VerticalLayout
} from "@jsonforms/core";
// -----------------------------------------------------------------------------

/** The smallest payment the ledger records — the facade refuses the same figure. */
const PAYMENT_MINIMUM = 0.01;

/** Two decimal places, the minor unit every seeded currency trades in. */
const AMOUNT_STEP = 0.01;

/** Whether this form has any credit to offer at all. */
export function offersAccountCredit(context: InvoicePaymentContext): boolean {
  return context.credit !== undefined;
}

/** Shown while the client has asked to draw on their credit. */
function whileUsingCredit(): Rule {
  return {
    effect: RuleEffect.SHOW,
    condition: {
      scope: "#/properties/useCredit",
      schema: { const: true }
    }
  };
}

/** Schema for the pay form. */
export const useSchema = (context: InvoicePaymentContext): JsonSchema7 => {
  const properties: Record<string, JsonSchema7> = {};
  const required: string[] = [];

  if (context.canChangeAmount) {
    properties["amount"] = {
      type: "number",
      title: "Payment amount",
      description: `Up to ${context.owedFormatted}, in ${context.currencyCode}.`,
      minimum: PAYMENT_MINIMUM,
      maximum: context.owed
    };
    required.push("amount");
  }

  if (offersAccountCredit(context)) {
    properties["useCredit"] = {
      type: "boolean",
      title: "Use account credit",
      description: context.creditSummary
    };
    properties["creditAmount"] = {
      type: "number",
      title: "Taken from credit",
      minimum: 0,
      maximum: context.creditCap ?? 0
    };
  }

  return {
    type: "object",
    title: `Pay invoice ${context.number}`,
    required,
    properties
  };
};

function control(
  scope: string,
  options?: ControlElement["options"],
  rule?: Rule
): ControlElement {
  return { type: "Control", scope: `#/properties/${scope}`, options, rule };
}

/** UI schema for the pay form. */
export const useUischema = (
  context: InvoicePaymentContext
): VerticalLayout => ({
  type: "VerticalLayout",
  elements: compact([
    context.canChangeAmount &&
      control("amount", {
        step: AMOUNT_STEP,
        placeholder: context.owedFormatted
      }),
    offersAccountCredit(context) && control("useCredit"),
    // The figure is a fact rather than a choice on a brand that takes only
    // the whole balance: how much credit applies is then arithmetic, not a
    // question, and it is stated so the client can see what is being drawn.
    offersAccountCredit(context) &&
      control(
        "creditAmount",
        { step: AMOUNT_STEP, readonly: !context.canChangeAmount },
        whileUsingCredit()
      )
  ])
});

/**
 * What the pay dialog opens on — the whole balance, and the credit untouched.
 * Legacy opened on the full amount and let the client lower it; the credit
 * box opened clear, with the most it could absorb already filled in behind it.
 */
export const invoicePaymentDefaults = (
  context: InvoicePaymentContext
): InvoicePaymentModel => {
  const model: InvoicePaymentModel = {};
  if (context.canChangeAmount) model.amount = context.owed;
  if (offersAccountCredit(context)) {
    model.useCredit = false;
    model.creditAmount = context.creditCap ?? 0;
  }
  return model;
};
