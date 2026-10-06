// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-contract-product.schemas
 * @description Schema/uischema for the three forms the SCOPED
 * `client-contract-product` module headless does not have yet carries (plan
 * F4) — the product's own invoice-consolidation preference, the client's own
 * label for it, and the cancellation a client asks for. Written in the
 * headless shape, so `/scoped-composable-factory` consumes this file
 * unchanged alongside `client-contract-product.ts`'s four-layer contract.
 *
 * The cancellation form composes the brand's own questions UNDER a
 * `customFields` branch, parsed by `client-custom-fields.schemas.ts` exactly
 * as the profile page composes them — one parser, both callers.
 *
 * @module-oracle vue-app `cProdInvoiceConsolidationComp.vue`,
 * `cProdCustomLabelComp.vue`, `clientContractCancellationModal.vue`.
 */

import { RuleEffect } from "@jsonforms/core";
import { InvoiceConsolidationTypes } from "@upmind-automation/types";
import { CANCEL_OPTION } from "./client-contract-product";
import {
  useCustomFieldsModel,
  useCustomFieldsSchema,
  useCustomFieldsUischema
} from "./client-custom-fields.schemas";
import { compact, includes, map } from "lodash-es";
import type {
  CancellationContext,
  ContractCancelOption
} from "./client-contract-product";
import type {
  ControlElement,
  JsonSchema7,
  LabelElement,
  Rule,
  VerticalLayout
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** One pick-list choice as the UI renderers read it — not a core schema keyword. */
type SchemaChoice = { label: string; value: string | number };

type SchemaProperty = JsonSchema7 & {
  options?: SchemaChoice[];
  trim?: boolean;
};

/** The i18n prefix the cancellation questions are keyed under. */
const CANCELLATION_FIELDS_I18N_KEY = "cancellation";

/**
 * What each consolidation state means for ONE product. The client-level form
 * words the same three states differently: there, INHERIT follows the brand;
 * here it follows the account.
 */
const CONSOLIDATION_LABEL: Readonly<Record<InvoiceConsolidationTypes, string>> =
  {
    [InvoiceConsolidationTypes.DISABLED]: "Invoice this product on its own",
    [InvoiceConsolidationTypes.ENABLED]:
      "Include it in my consolidated invoice",
    [InvoiceConsolidationTypes.INHERIT]: "Follow my account setting"
  };

/** What each cancellation choice says — legacy's own three answers. */
const CANCEL_OPTION_LABEL: Readonly<Record<ContractCancelOption, string>> = {
  [CANCEL_OPTION.END_OF_BILLING_CYCLE]: "At the end of the billing term",
  [CANCEL_OPTION.IMMEDIATELY]: "Straight away",
  [CANCEL_OPTION.SCHEDULED]: "On a date I choose"
};

/** Legacy's own bound: a label is one line long. */
const LABEL_MAX_LENGTH = 60;

// --- invoice consolidation ----------------------------------------------------

function consolidationChoices(): SchemaChoice[] {
  return map(CONSOLIDATION_LABEL, (label, value) => ({
    label,
    value: Number(value)
  }));
}

/** Schema for the product's consolidation preference. */
export const useConsolidationSchema = (): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    invoiceConsolidation: {
      type: "number",
      title: "Invoice consolidation",
      enum: map(consolidationChoices(), "value"),
      options: consolidationChoices()
    }
  };
  return {
    type: "object",
    title: "Invoice consolidation",
    required: ["invoiceConsolidation"],
    properties
  };
};

/** UI schema for the product's consolidation preference. */
export const useConsolidationUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/invoiceConsolidation",
      i18n: "form.invoice_consolidation",
      options: { format: "radio", noLabel: true }
    }
  ]
});

// --- the client's own label ---------------------------------------------------

/** Schema for the custom-label form. */
export const useLabelSchema = (): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    label: {
      type: "string",
      title: "Your label for this",
      maxLength: LABEL_MAX_LENGTH,
      // The platform's own modifying keyword (mock/forms/ajv.ts): a label of
      // spaces is cleared before it is stored, not saved as blank text.
      trim: true
    }
  };
  return { type: "object", title: "Label", properties };
};

/** UI schema for the custom-label form. */
export const useLabelUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/label",
      i18n: "form.custom_label",
      options: { placeholder: "The name you know this product by" }
    }
  ]
});

// --- the cancellation request -------------------------------------------------

function cancelOptionChoices(
  options: readonly ContractCancelOption[]
): SchemaChoice[] {
  return map(options, option => ({
    label: CANCEL_OPTION_LABEL[option],
    value: option
  }));
}

/** Schema for the cancellation request — the brand's questions ride under `customFields`. */
export const useCancellationSchema = (
  context: CancellationContext
): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    option: {
      type: "string",
      title: "When should it stop?",
      enum: [...context.options],
      options: cancelOptionChoices(context.options)
    },
    cancelAt: {
      type: ["string", "null"],
      title: "Cancel on",
      format: "date"
    },
    reason: {
      type: "string",
      title: "Why are you cancelling?",
      minLength: 1,
      trim: true
    },
    customFields: useCustomFieldsSchema([...context.fields])
  };

  return {
    type: "object",
    title: "Cancellation request",
    required: ["option", "reason"],
    properties,
    // A date is asked for by the one choice that needs one, and only then —
    // the uischema hides it, and this is what stops a hidden field being
    // submitted empty (plan F5: validation is the engine's).
    if: {
      properties: { option: { const: CANCEL_OPTION.SCHEDULED } },
      required: ["option"]
    },
    then: {
      required: ["cancelAt"],
      properties: { cancelAt: { type: "string", minLength: 1 } }
    }
  };
};

/** Shown while the scheduled choice stands, and nowhere else. */
function whileScheduled(): Rule {
  return {
    effect: RuleEffect.SHOW,
    condition: {
      scope: "#/properties/option",
      schema: { enum: [CANCEL_OPTION.SCHEDULED] }
    }
  };
}

/** Shown while the choice that stops the product AT ONCE stands. */
function whileImmediate(): Rule {
  return {
    effect: RuleEffect.SHOW,
    condition: {
      scope: "#/properties/option",
      schema: { enum: [CANCEL_OPTION.IMMEDIATELY] }
    }
  };
}

/**
 * Legacy's `client_contract_cancellation_warning`, worded for the product it
 * is about. A contract that has not started yet takes nothing away when it
 * stops, so legacy withheld the warning there (`isHardCancellation &&
 * !isPendingContract`) — and a form that never offers the immediate choice
 * carries no element for it at all.
 */
function hardCancellationWarning(
  context: CancellationContext
): LabelElement | undefined {
  const isOffered = includes(context.options, CANCEL_OPTION.IMMEDIATELY);
  if (!isOffered || context.isPending) return undefined;
  return {
    type: "Label",
    text: `${context.productName} will be cancelled immediately and cannot be restored.`,
    rule: whileImmediate()
  };
}

/** UI schema for the cancellation request. */
export const useCancellationUischema = (
  context: CancellationContext
): VerticalLayout => {
  const cancelAt: ControlElement = {
    type: "Control",
    scope: "#/properties/cancelAt",
    i18n: "form.cancel_at",
    rule: whileScheduled()
  };

  return {
    type: "VerticalLayout",
    elements: compact([
      {
        type: "Control",
        scope: "#/properties/option",
        i18n: "form.cancel_option",
        options: { format: "radio" }
      },
      hardCancellationWarning(context),
      cancelAt,
      {
        type: "Control",
        scope: "#/properties/reason",
        i18n: "form.cancellation_reason",
        options: {
          multi: true,
          placeholder: "Tell us what made you decide"
        }
      },
      ...useCustomFieldsUischema(
        [...context.fields],
        CANCELLATION_FIELDS_I18N_KEY
      )
    ])
  };
};

/**
 * What the cancellation dialog opens on — the least destructive choice the
 * product allows, and the brand's questions at whatever they default to.
 */
export const cancellationDefaults = (
  context: CancellationContext
): FormModel => ({
  option: preferredOption(context.options),
  reason: "",
  customFields: useCustomFieldsModel([...context.fields])
});

/** End-of-term where it is offered — legacy opened on the gentlest option. */
function preferredOption(
  options: readonly ContractCancelOption[]
): ContractCancelOption | undefined {
  if (includes(options, CANCEL_OPTION.END_OF_BILLING_CYCLE)) {
    return CANCEL_OPTION.END_OF_BILLING_CYCLE;
  }
  return options[0];
}

/** What the label form opens on — the label on file, or nothing where none was given. */
export const labelDefaults = (label: string | undefined): FormModel => ({
  label: label ?? ""
});

/** What the consolidation form opens on — the preference on file. */
export const consolidationDefaults = (
  value: InvoiceConsolidationTypes
): FormModel => ({ invoiceConsolidation: value });
