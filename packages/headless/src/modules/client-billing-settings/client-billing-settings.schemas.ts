/** @internal */
import {
  DaysOfWeekTypes,
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import type { BillingSettingsContext } from "./client-billing-settings.types";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/client-billing-settings.schemas
 * @description Schema/uischema generation for the invoice-consolidation
 * editor — the five persisted fields. Enum members are read off the
 * CONSUMED `@upmind-automation/types` enums, never a local literal list
 * (AC3).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useBillingSettingsManager.ts` / the barrel only.
 */

/**
 * TypeScript's numeric enums reverse-map their keys, so `Object.values`
 * yields both the numeric values and their string keys. This filters to the
 * numeric members only — `InvoiceConsolidationTypes`' own `enum-options`
 * seam (design.md §11).
 */
function numericEnumValues<T extends Record<string, string | number>>(
  source: T
): number[] {
  return Object.values(source).filter(
    (value): value is number => typeof value === "number"
  );
}

/** Schema for the invoice-consolidation editor — the five native controls. */
export const useSchema = (_context: BillingSettingsContext): JsonSchema7 => ({
  type: "object",
  required: [],
  properties: {
    enabled: {
      type: "number",
      enum: numericEnumValues(InvoiceConsolidationTypes)
    },
    baseRule: {
      type: ["string", "null"],
      enum: [...Object.values(InvoiceConsolidationRuleTypes), null]
    },
    dayOfWeek: {
      type: ["string", "null"],
      enum: [...Object.values(DaysOfWeekTypes), null]
    },
    dateOfMonthDay: {
      type: ["integer", "null"],
      minimum: 1,
      maximum: 31
    },
    dueDateDay: {
      type: ["integer", "null"],
      minimum: 1,
      maximum: 28
    }
  }
});

/** UI schema for the invoice-consolidation editor. */
export const useUischema = (
  _context: BillingSettingsContext
): UISchemaElement => {
  const elements: ControlElement[] = [
    {
      type: "Control",
      scope: "#/properties/enabled",
      i18n: "form.invoice_consolidation_enabled"
    },
    {
      type: "Control",
      scope: "#/properties/baseRule",
      i18n: "form.invoice_consolidation_base_rule"
    },
    {
      type: "Control",
      scope: "#/properties/dayOfWeek",
      i18n: "form.invoice_consolidation_base_rule_day_of_week"
    },
    {
      type: "Control",
      scope: "#/properties/dateOfMonthDay",
      i18n: "form.invoice_consolidation_base_rule_date_of_month_day"
    },
    {
      type: "Control",
      scope: "#/properties/dueDateDay",
      i18n: "form.invoice_consolidation_due_date_day"
    }
  ];

  return {
    type: "VerticalLayout",
    elements
  } as UISchemaElement;
};
