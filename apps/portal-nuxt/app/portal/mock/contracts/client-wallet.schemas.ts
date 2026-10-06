// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-wallet.schemas
 * @description Schema/uischema for the top-up half of the SCOPED
 * `client-wallet` module headless does not have yet (plan F4) — written in
 * the headless shape, so `/scoped-composable-factory` consumes this file
 * unchanged alongside `client-wallet.ts`'s four-layer contract.
 *
 * The currency picker offers the currencies this client already HOLDS credit
 * in: a balance is per currency, and topping up one the account has never
 * traded in would mint a bucket the rest of the portal cannot spend.
 *
 * The amount carries no upper bound — a client may add as much credit as they
 * like; the floor is there because a top-up of nothing is not a top-up.
 *
 * @module-oracle vue-app `topUpWalletModal.vue`.
 */

import { assign, map, size } from "lodash-es";
import type { WalletTopUpContext } from "./client-wallet";
import type {
  ControlElement,
  JsonSchema7,
  VerticalLayout
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** One pick-list choice as the UI renderers read it — not a core schema keyword. */
type SchemaChoice = { label: string; value: string };

type SchemaProperty = JsonSchema7 & { options?: SchemaChoice[] };

/** The smallest movement the ledger records — anything under it is nothing. */
const AMOUNT_MINIMUM = 0.01;

/** Two decimal places, which is what every seeded currency trades in. */
const AMOUNT_STEP = 0.01;

export const useSchema = (context: WalletTopUpContext): JsonSchema7 => {
  const currency: SchemaProperty = {
    type: "string",
    title: "Currency",
    enum: [...context.currencies],
    options: map(context.currencies, code => ({ label: code, value: code }))
  };

  const properties: Record<string, SchemaProperty> = {
    currency,
    amount: {
      type: "number",
      title: "Amount",
      minimum: AMOUNT_MINIMUM
    }
  };
  if (offersMethodChoice(context)) {
    properties["paymentDetailId"] = {
      type: "string",
      title: "Pay with",
      enum: map(context.methods, "id"),
      options: map(context.methods, method => ({
        label: method.label,
        value: method.id
      }))
    };
  }

  return {
    type: "object",
    title: "Top up",
    required: ["currency", "amount"],
    properties
  };
};

/** The card row, where there is a card to choose — an empty list asks nothing. */
function methodControl(context: WalletTopUpContext): ControlElement[] {
  if (!offersMethodChoice(context)) return [];
  return [{ type: "Control", scope: "#/properties/paymentDetailId" }];
}

/** Whether the account holds a card for this to be charged to at all. */
function offersMethodChoice(context: WalletTopUpContext): boolean {
  return size(context.methods) > 0;
}

export const useUischema = (context: WalletTopUpContext): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/currency",
      i18n: "form.currency",
      // One currency is a fact, not a choice, so it is stated rather than
      // offered — the field stays for the model's sake and reads as settled.
      options: { readonly: size(context.currencies) < 2 }
    },
    {
      type: "Control",
      scope: "#/properties/amount",
      i18n: "form.amount",
      options: { step: AMOUNT_STEP }
    },
    ...methodControl(context)
  ]
});

/** What the dialog opens on — the account's first currency, and no figure. */
export const walletTopUpDefaults = (context: WalletTopUpContext): FormModel => {
  const opening: FormModel = { currency: context.currencies[0] ?? "" };
  if (!offersMethodChoice(context)) return opening;
  return assign(opening, { paymentDetailId: context.defaultMethodId ?? "" });
};
