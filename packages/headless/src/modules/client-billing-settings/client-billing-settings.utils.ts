/** @internal */
import {
  RuleEffect,
  type EnumOption,
  type JsonSchema7,
  type Rule
} from "@jsonforms/core";
import {
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import { concat, map, orderBy, size, some } from "lodash-es";
import type { OptionedSchema } from "./client-billing-settings.types";
import type { ICurrency } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/client-billing-settings.utils
 * @description The schema-building helpers `client-billing-settings.schemas.ts`
 * uses more than once — pick-list options off a label map, the currency
 * `enum` + `options` pair, and the show/hide rules that mirror legacy's
 * `clientInvoiceConsolidationForm.vue` computeds. Every rule reads the FORM
 * DATA only, which is why the brand's defaults and the client's
 * `never_suspend` ride in the model (`BillingSettingsModel.brand` /
 * `.neverSuspend`).
 */

/**
 * The currencies both account-currency controls offer: the brand's supported
 * set ordered by name, plus the account's own currency when the brand list
 * omits it (rows B2/B3). Moved out of the services file — it derives view
 * data, it is not a request.
 */
export function combineCurrencyOptions(
  brandCurrencies: ICurrency[],
  accountCurrency?: ICurrency
): ICurrency[] {
  const list =
    accountCurrency && !some(brandCurrencies, { id: accountCurrency.id })
      ? concat(brandCurrencies, accountCurrency)
      : brandCurrencies;

  return orderBy(list, ["name"], ["asc"]);
}

/** One pick-list entry per member, its label read off the member's own map. */
export function enumOptions<T extends string | number>(
  members: T[],
  labels: Readonly<Record<T, string>>
): EnumOption[] {
  return map(members, value => ({ label: labels[value], value }));
}

/**
 * `enum` + `options` for a currency pick-list, or nothing while the list is
 * not loaded — an empty `enum` would invalidate every value, so the control
 * keeps its free-text shape instead (`client-address.schemas.ts`'s own
 * countries guard). `nullable` admits the clear (`null`) row B4 needs.
 */
export function currencyChoices(
  currencies: ICurrency[] | undefined,
  nullable = false
): Pick<OptionedSchema, "enum" | "options"> {
  if (!size(currencies)) return {};

  const ids = map(currencies, "id");

  return {
    enum: nullable ? concat(ids, null) : ids,
    options: map(currencies, currency => ({
      label: `${currency.code} - ${currency.name}`,
      value: currency.id
    }))
  };
}

// -----------------------------------------------------------------------------
// Show/hide rules — legacy `clientInvoiceConsolidationForm.vue:162-204`

/** A SHOW rule evaluated against the whole form data. */
function show(schema: JsonSchema7): Rule {
  return { effect: RuleEffect.SHOW, condition: { scope: "#", schema } };
}

/**
 * Legacy `effectiveBaseRule`: the client's own rule, or the brand's while the
 * client's is unset (`null` — or absent, which compaction makes of a `null`;
 * `properties` never fails on an absent key, so both read as unset).
 */
function effectiveRuleIs(rules: InvoiceConsolidationRuleTypes[]): JsonSchema7 {
  return {
    anyOf: [
      { required: ["baseRule"], properties: { baseRule: { enum: rules } } },
      {
        required: ["brand"],
        properties: {
          baseRule: { type: "null" },
          brand: {
            required: ["baseRule"],
            properties: { baseRule: { enum: rules } }
          }
        }
      }
    ]
  };
}

/**
 * Legacy `showBasicRuleFields`: the client consolidates, or follows a brand
 * that does. `brand.enabled` is the brand's boolean flag (`enabledBV`).
 */
export function whenScheduleApplies(): Rule {
  return show({
    anyOf: [
      {
        required: ["enabled"],
        properties: { enabled: { const: InvoiceConsolidationTypes.ENABLED } }
      },
      {
        required: ["enabled", "brand"],
        properties: {
          enabled: { const: InvoiceConsolidationTypes.INHERIT },
          brand: {
            required: ["enabled"],
            properties: { enabled: { const: true } }
          }
        }
      }
    ]
  });
}

/** Legacy `showDayOfWeekField` / `showDayOfMonthField` — the effective rule names the sub-control. */
export function whenEffectiveRule(
  rules: InvoiceConsolidationRuleTypes[]
): Rule {
  return show(effectiveRuleIs(rules));
}

/**
 * Legacy `showDueDateDayField`: a monthly effective rule
 * (`isMonthlyConsolidation`) AND the client's `never_suspend`
 * (`effectiveNeverSuspend`). The schedule gate itself is inherited from the
 * enclosing layout.
 */
export function whenDueDateApplies(): Rule {
  return show({
    allOf: [
      effectiveRuleIs([
        InvoiceConsolidationRuleTypes.FIRST_DAY_OF_MONTH,
        InvoiceConsolidationRuleTypes.LAST_DAY_OF_MONTH,
        InvoiceConsolidationRuleTypes.DAY_OF_MONTH
      ]),
      {
        required: ["neverSuspend"],
        properties: { neverSuspend: { const: true } }
      }
    ]
  });
}
