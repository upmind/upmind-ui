/** @internal */
import {
  DaysOfWeekTypes,
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import type { BillingSettingsContext } from "./client-billing-settings.types";
import type { ScopeContext } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
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
 * (AC3). The shared field/control definitions live in
 * `useSchemaDefinitions()` / `useUischemaDefinitions()` and the parsers
 * `$ref` / reference them (`templates/ARMS.md`'s "shape armed or armless"
 * rule), and `createClientBillingSettingsSchemas` carries the same
 * arm-resolution seam `client-billing-settings.services.ts` already does —
 * armless today, a one-file change the day a scope earns one.
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

/**
 * Shared field definitions — the five native controls' schema shapes, kept
 * behind `$ref` rather than inlined in `useSchema`, so an arm overriding one
 * field can reference the other four unchanged (`templates/ARMS.md`
 * "definitions / $ref is the shape armed or armless";
 * `client-address.schemas.ts`'s own `useSchemaDefinitions`).
 */
export function useSchemaDefinitions(): JsonSchema7["definitions"] {
  return {
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
  };
}

/** Schema for the invoice-consolidation editor — the five native controls. */
export const useSchema = (_context: BillingSettingsContext): JsonSchema7 => ({
  type: "object",
  required: [],
  definitions: useSchemaDefinitions(),
  properties: {
    enabled: { $ref: "#/definitions/enabled" },
    baseRule: { $ref: "#/definitions/baseRule" },
    dayOfWeek: { $ref: "#/definitions/dayOfWeek" },
    dateOfMonthDay: { $ref: "#/definitions/dateOfMonthDay" },
    dueDateDay: { $ref: "#/definitions/dueDateDay" }
  }
});

/**
 * Shared control definitions — the uischema counterpart of
 * `useSchemaDefinitions()`, keyed by the field each renders
 * (`templates/ARMS.md`'s keyed-map contract for the schemas layer). An arm
 * overriding one field's control references the other four unchanged.
 */
export function useUischemaDefinitions(): Record<string, ControlElement> {
  return {
    enabled: {
      type: "Control",
      scope: "#/properties/enabled",
      i18n: "form.invoice_consolidation_enabled"
    },
    baseRule: {
      type: "Control",
      scope: "#/properties/baseRule",
      i18n: "form.invoice_consolidation_base_rule"
    },
    dayOfWeek: {
      type: "Control",
      scope: "#/properties/dayOfWeek",
      i18n: "form.invoice_consolidation_base_rule_day_of_week"
    },
    dateOfMonthDay: {
      type: "Control",
      scope: "#/properties/dateOfMonthDay",
      i18n: "form.invoice_consolidation_base_rule_date_of_month_day"
    },
    dueDateDay: {
      type: "Control",
      scope: "#/properties/dueDateDay",
      i18n: "form.invoice_consolidation_due_date_day"
    }
  };
}

/** UI schema for the invoice-consolidation editor. */
export const useUischema = (
  _context: BillingSettingsContext
): UISchemaElement => {
  const controls = useUischemaDefinitions();

  return {
    type: "VerticalLayout",
    elements: [
      controls.enabled,
      controls.baseRule,
      controls.dayOfWeek,
      controls.dateOfMonthDay,
      controls.dueDateDay
    ]
  } as UISchemaElement;
};

// -----------------------------------------------------------------------------
// Schemas Factory

/**
 * The contract `scopedSchemas()` resolves to and `createClientBillingSettingsSchemas`
 * returns — same role as `ClientBillingSettingsServices`
 * (`client-billing-settings.types.ts`) for the schemas layer. Declared here
 * rather than in that types file: this module's schemas seam is net-new
 * (`templates/ARMS.md` — no `.schemas.{actor}.ts` file exists anywhere in
 * this codebase yet), and the contract type is consumed only within this
 * file's own factory.
 */
export type ClientBillingSettingsSchemas = {
  useSchema: (context: BillingSettingsContext) => JsonSchema7;
  useUischema: (context: BillingSettingsContext) => UISchemaElement;
};

/**
 * Schema matrix: maps scopeActor types to their parser implementations. The
 * shape is the same armed or armless — an armless module has only the
 * `default:` case, so nothing here or downstream changes when an arm is
 * earned. This module's arms determination is `none` at every layer
 * (`parity.yaml`'s `arms:` block, independently re-derived at Code) — the
 * ONLY resolving actor is `client`, so clause 3's comparative test never
 * fires (mirrors `client-billing-settings.services.ts`'s own `scopedServices`).
 */
function scopedSchemas(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ClientBillingSettingsSchemas> {
  switch (scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Schemas

/**
 * Parsers factory — same shape as `client-billing-settings.services.ts`'s own
 * `createClientBillingSettingsServices`: the concrete actor and the context
 * it acts upon arrive first, at construction.
 */
export const createClientBillingSettingsSchemas = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientBillingSettingsSchemas => ({
  useSchema,
  useUischema,
  ...scopedSchemas(scopeActor, scopeContext)
});

export default createClientBillingSettingsSchemas;
