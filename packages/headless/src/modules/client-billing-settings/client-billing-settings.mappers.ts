/** @internal */
import type {
  BillingSettingsModel,
  BillingSettingsRecord,
  BillingSettingsUpdateBody
} from "./client-billing-settings.types";
import type { IClient } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/client-billing-settings.mappers
 * @description Wire <-> view-model shaping for a client's invoice-consolidation
 * preference. Pure — no side effects, no HTTP, and never actor-scoped.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useBillingSettings.ts` / `useBillingSettingsManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */

/** Maps the raw client record into the read half's own view-model (AC1, AC14). */
export function mapBillingSettings(raw: IClient): BillingSettingsRecord {
  return {
    id: raw.id,
    enabled: raw.invoice_consolidation_enabled,
    baseRule: raw.invoice_consolidation_base_rule,
    dayOfWeek: raw.invoice_consolidation_base_rule_day_of_week,
    dateOfMonthDay: raw.invoice_consolidation_base_rule_date_of_month_day,
    dueDateDay: raw.invoice_consolidation_due_date_day,
    isStaged: !!raw.staged_import
  };
}

/**
 * The dirty, per-field PUT body: keyed to the five persisted consolidation
 * fields ONLY, computed key by key against `baseModel`, never by a value
 * predicate. `undefined` for an empty diff so the caller can short-circuit
 * with zero requests (AC11), matching legacy's own `formIsChanged` guard
 * (`form:303`).
 *
 * Parity row X1: this per-field granularity is a RECORDED divergence from
 * the oracle's whole-form-or-nothing payload (`form:303,307`), absorbed by
 * C12 (design.md §6.2). It is what makes the shared cache key safe — two
 * modules can both `PUT clients/{id}` because each sends only its own diff.
 *
 * @decision compare every field with `!==` and never filter the resulting
 * diff object by truthiness.
 * what:    each key is set directly from the `!==` comparison; there is no
 *          `omitBy`/`filter` pass over `diff` afterwards.
 * why:     `InvoiceConsolidationTypes.DISABLED === 0` is falsy (hazard H5 /
 *          row X3). A truthiness filter over the built diff — the exact
 *          shape `client-personal-details.falsy-native.must-fail.patch`
 *          mutates in for the string half — would silently drop
 *          `invoice_consolidation_enabled: 0` from the outbound body,
 *          making the client's off-switch a no-op while every gate stays
 *          green (AC18). `client-billing-settings.falsy-enabled.must-fail.patch`
 *          is this module's numeric twin of that control.
 * rejected: `Object.fromEntries(Object.entries(diff).filter(([, v]) => !!v))`
 *          — rejected outright; it is the exact defect AC18 exists to close.
 */
export function mapIBillingSettingsFields(
  model: BillingSettingsModel,
  baseModel: BillingSettingsModel = {}
): BillingSettingsUpdateBody | undefined {
  const diff: BillingSettingsUpdateBody = {};

  if (model.enabled !== baseModel.enabled) {
    diff.invoice_consolidation_enabled = model.enabled;
  }
  if (model.baseRule !== baseModel.baseRule) {
    diff.invoice_consolidation_base_rule = model.baseRule;
  }
  if (model.dayOfWeek !== baseModel.dayOfWeek) {
    diff.invoice_consolidation_base_rule_day_of_week = model.dayOfWeek;
  }
  if (model.dateOfMonthDay !== baseModel.dateOfMonthDay) {
    diff.invoice_consolidation_base_rule_date_of_month_day =
      model.dateOfMonthDay;
  }
  if (model.dueDateDay !== baseModel.dueDateDay) {
    diff.invoice_consolidation_due_date_day = model.dueDateDay;
  }

  return Object.keys(diff).length ? diff : undefined;
}
