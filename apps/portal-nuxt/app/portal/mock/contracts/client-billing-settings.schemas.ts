// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-billing-settings.schemas
 * @description Schema/uischema for the SCOPED `client-billing-settings`
 * module headless does not have yet (plan F4) — written in the headless
 * shape, so `/scoped-composable-factory` consumes this file unchanged
 * alongside `client-billing-settings.ts`'s four-layer contract.
 *
 * Legacy showed two forms on one page; they save together here, because the
 * consolidation half is meaningless without the currency it is billed in and
 * a client who changes both should answer once.
 *
 * Three fields are CONDITIONAL on the context rather than on a rule: a brand
 * that offers no payment currency, and a client with one price list, have
 * nothing to choose — a control over a single option is a control that reads
 * as a choice and is not one.
 *
 * @module-oracle vue-app `clientBillingBasicConfigurationForm.vue`,
 * `clientInvoiceConsolidationForm.vue`.
 */

import { RuleEffect } from "@jsonforms/core";
import {
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import { compact, lowerFirst, map, size } from "lodash-es";
import type {
  BillingSettings,
  BillingSettingsContext
} from "./client-billing-settings";
import type {
  AndCondition,
  ControlElement,
  JsonSchema7,
  Rule,
  SchemaBasedCondition,
  VerticalLayout
} from "@jsonforms/core";

/** One pick-list choice as the UI renderers read it — not a core schema keyword. */
type SchemaChoice = { label: string; value: string | number };

type SchemaProperty = JsonSchema7 & { options?: SchemaChoice[] };

/**
 * The days a weekly consolidation may fall on.
 *
 * @decision Portal-local. `InvoiceConsolidationRuleTypes` names the RULE and
 * no platform enum names the day — the brand takes it as a bare config value
 * (`BrandConfigKeys.INVOICE_CONSOLIDATION_WEEK_DAY`).
 */
export const CONSOLIDATION_WEEKDAY = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday"
} as const;

export type ConsolidationWeekday =
  (typeof CONSOLIDATION_WEEKDAY)[keyof typeof CONSOLIDATION_WEEKDAY];

const WEEKDAY_LABEL: Readonly<Record<ConsolidationWeekday, string>> = {
  [CONSOLIDATION_WEEKDAY.MONDAY]: "Monday",
  [CONSOLIDATION_WEEKDAY.TUESDAY]: "Tuesday",
  [CONSOLIDATION_WEEKDAY.WEDNESDAY]: "Wednesday",
  [CONSOLIDATION_WEEKDAY.THURSDAY]: "Thursday",
  [CONSOLIDATION_WEEKDAY.FRIDAY]: "Friday",
  [CONSOLIDATION_WEEKDAY.SATURDAY]: "Saturday",
  [CONSOLIDATION_WEEKDAY.SUNDAY]: "Sunday"
};

/** What each consolidation state says to a client — legacy's own three answers. */
const CONSOLIDATION_LABEL: Readonly<Record<InvoiceConsolidationTypes, string>> =
  {
    [InvoiceConsolidationTypes.DISABLED]: "Invoice me for each product",
    [InvoiceConsolidationTypes.ENABLED]: "Consolidate my invoices into one",
    [InvoiceConsolidationTypes.INHERIT]: "Follow the brand's own setting"
  };

/**
 * The inherit choice, with the brand's OWN schedule named in it: a client
 * choosing to follow the brand is entitled to read what they are following
 * rather than agree to a setting nobody states.
 */
function inheritLabel(context: BillingSettingsContext): string {
  const brandLabel = CONSOLIDATION_LABEL[InvoiceConsolidationTypes.INHERIT];
  if (context.brandSchedule === undefined) return brandLabel;
  return `${brandLabel} (${context.brandSchedule})`;
}

/** What each rule says — when the one consolidated invoice is raised. */
const RULE_LABEL: Readonly<Record<InvoiceConsolidationRuleTypes, string>> = {
  [InvoiceConsolidationRuleTypes.DAILY]: "Every day",
  [InvoiceConsolidationRuleTypes.DAY_OF_WEEK]: "On a day of the week",
  [InvoiceConsolidationRuleTypes.DAY_OF_MONTH]: "On a day of the month",
  [InvoiceConsolidationRuleTypes.FIRST_DAY_OF_MONTH]: "On the 1st",
  [InvoiceConsolidationRuleTypes.LAST_DAY_OF_MONTH]: "On the last day"
};

/** A rule that fires every month can only name a day every month has. */
const DAY_OF_MONTH_MIN = 1;
const DAY_OF_MONTH_MAX = 28;

/** How far after it is raised a consolidated invoice may fall due. */
/** Every monthly rule: the day a consolidated invoice falls due is asked only under these. */
const MONTHLY_RULES = [
  InvoiceConsolidationRuleTypes.DAY_OF_MONTH,
  InvoiceConsolidationRuleTypes.FIRST_DAY_OF_MONTH,
  InvoiceConsolidationRuleTypes.LAST_DAY_OF_MONTH
];

/**
 * The brand's own consolidation schedule in words, off its three config
 * values (`INVOICE_CONSOLIDATION_BASE_RULE`, `_WEEK_DAY`, `_DATE`). The two
 * day values are read only by the rule that names a day, so a brand carrying
 * both states the one it runs on.
 */
export function brandConsolidationSchedule(
  rule: InvoiceConsolidationRuleTypes,
  weekday: ConsolidationWeekday,
  dayOfMonth: number
): string {
  if (rule === InvoiceConsolidationRuleTypes.DAY_OF_WEEK) {
    return `every ${WEEKDAY_LABEL[weekday]}`;
  }
  if (rule === InvoiceConsolidationRuleTypes.DAY_OF_MONTH) {
    return `on the ${ordinal(dayOfMonth)} of each month`;
  }
  return lowerFirst(RULE_LABEL[rule]);
}

/** The suffix a day of the month is spoken with — 1st, 2nd, 3rd, 21st. */
function ordinal(day: number): string {
  const teens = day % ORDINAL_TEEN_CYCLE;
  const last = day % ORDINAL_CYCLE;
  if (teens >= ORDINAL_TEEN_FROM && teens <= ORDINAL_TEEN_TO) {
    return `${day}th`;
  }
  return `${day}${ORDINAL_SUFFIX[last] ?? "th"}`;
}

const ORDINAL_CYCLE = 10;
const ORDINAL_TEEN_CYCLE = 100;
const ORDINAL_TEEN_FROM = 11;
const ORDINAL_TEEN_TO = 13;

const ORDINAL_SUFFIX: Readonly<Record<number, string>> = {
  1: "st",
  2: "nd",
  3: "rd"
};

/** A currency code is its own label — the codes are what a client is quoted in. */
function currencyChoices(codes: readonly string[]): SchemaChoice[] {
  return map(codes, code => ({ label: code, value: code }));
}

function consolidationChoices(context: BillingSettingsContext): SchemaChoice[] {
  return map(CONSOLIDATION_LABEL, (label, value) => ({
    label: consolidationLabel(context, Number(value), label),
    value: Number(value)
  }));
}

function consolidationLabel(
  context: BillingSettingsContext,
  value: number,
  label: string
): string {
  if (value !== InvoiceConsolidationTypes.INHERIT) return label;
  return inheritLabel(context);
}

/** Whether the brand publishes a second currency to pay in at all. */
function offersPaymentCurrency(context: BillingSettingsContext): boolean {
  return size(context.paymentCurrencies) > 0;
}

export const useSchema = (context: BillingSettingsContext): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    currencyCode: {
      type: "string",
      title: "Preferred currency",
      description: "The currency your prices and invoices are quoted in.",
      enum: [...context.currencies],
      options: currencyChoices(context.currencies)
    },
    consolidation: {
      type: "number",
      title: "Invoice consolidation",
      enum: map(consolidationChoices(context), "value"),
      options: consolidationChoices(context)
    },
    rule: {
      type: ["string", "null"],
      title: "Raise the consolidated invoice",
      enum: [null, ...map(RULE_LABEL, (label, value) => value)],
      options: map(RULE_LABEL, (label, value) => ({ label, value }))
    },
    dayOfWeek: {
      type: ["string", "null"],
      title: "Day of the week",
      enum: [null, ...map(WEEKDAY_LABEL, (label, value) => value)],
      options: map(WEEKDAY_LABEL, (label, value) => ({ label, value }))
    },
    dayOfMonth: {
      type: ["number", "null"],
      title: "Day of the month",
      minimum: DAY_OF_MONTH_MIN,
      maximum: DAY_OF_MONTH_MAX
    },
    dueDateDay: {
      type: ["number", "null"],
      title: "Due on this day of the month",
      description:
        "Leave it empty and the gathered invoices fall due with the soonest of them.",
      minimum: DAY_OF_MONTH_MIN,
      maximum: DAY_OF_MONTH_MAX
    }
  };

  if (offersPaymentCurrency(context)) {
    properties["paymentCurrencyCode"] = {
      type: ["string", "null"],
      title: "Preferred payment currency",
      description: "The currency we take payment in.",
      enum: [null, ...(context.paymentCurrencies ?? [])],
      options: currencyChoices(context.paymentCurrencies ?? [])
    };
  }
  return {
    type: "object",
    title: "Billing settings",
    required: ["currencyCode", "consolidation"],
    properties
  };
};

function control(scope: string, rule?: Rule): ControlElement {
  return { type: "Control", scope: `#/properties/${scope}`, rule };
}

/** The one arm of a schema-based condition every rule below is written with. */
function fulfilledBy(
  scope: string,
  values: readonly (string | number)[]
): SchemaBasedCondition {
  return {
    scope: `#/properties/${scope}`,
    schema: { enum: [...values] }
  };
}

/** Shown while the consolidation radio stands on ENABLED, and nowhere else. */
function whileConsolidated(): Rule {
  return {
    effect: RuleEffect.SHOW,
    condition: fulfilledBy("consolidation", [InvoiceConsolidationTypes.ENABLED])
  };
}

/**
 * Shown while consolidation is on AND the chosen rule names this day. Both
 * arms are needed: a stored rule outlives the switch being turned off, so the
 * rule alone would leave a day field standing under a disabled preference.
 */
/** Shown while consolidation is on AND the rule is one of these — legacy asks the due day only for monthly gathering. */
function whileRuleIn(rules: readonly InvoiceConsolidationRuleTypes[]): Rule {
  const condition: AndCondition = {
    type: "AND",
    conditions: [
      fulfilledBy("consolidation", [InvoiceConsolidationTypes.ENABLED]),
      fulfilledBy("rule", rules)
    ]
  };
  return { effect: RuleEffect.SHOW, condition };
}

function whileRuleIs(rule: InvoiceConsolidationRuleTypes): Rule {
  const condition: AndCondition = {
    type: "AND",
    conditions: [
      fulfilledBy("consolidation", [InvoiceConsolidationTypes.ENABLED]),
      fulfilledBy("rule", [rule])
    ]
  };
  return { effect: RuleEffect.SHOW, condition };
}

export const useUischema = (
  context: BillingSettingsContext
): VerticalLayout => ({
  type: "VerticalLayout",
  elements: compact([
    control("currencyCode"),
    offersPaymentCurrency(context) && control("paymentCurrencyCode"),
    {
      type: "Control",
      scope: "#/properties/consolidation",
      options: { format: "radio" }
    },
    control("rule", whileConsolidated()),
    control(
      "dayOfWeek",
      whileRuleIs(InvoiceConsolidationRuleTypes.DAY_OF_WEEK)
    ),
    control(
      "dayOfMonth",
      whileRuleIs(InvoiceConsolidationRuleTypes.DAY_OF_MONTH)
    ),
    control("dueDateDay", whileRuleIn(MONTHLY_RULES))
  ])
});

/** What the form opens on — the settings on file, never a blank page. */
export const billingSettingsDefaults = (
  context: BillingSettingsContext
): BillingSettings => ({
  currencyCode: context.model.currencyCode,
  paymentCurrencyCode: context.model.paymentCurrencyCode,
  // Carried, never offered: legacy lets only staff pick the price list a
  // client is quoted from, so the client's form shows no control for it.
  priceListId: context.model.priceListId,
  consolidation: context.model.consolidation,
  rule: context.model.rule,
  dayOfWeek: context.model.dayOfWeek,
  dayOfMonth: context.model.dayOfMonth,
  dueDateDay: context.model.dueDateDay
});
