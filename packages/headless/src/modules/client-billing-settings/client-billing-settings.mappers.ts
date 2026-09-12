/** @internal */
import type {
  AccountCurrencyUpdateBody,
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

/**
 * Normalises the wire's SECOND spelling of "unset" onto the one this module
 * models. `packages/types/src/models/clients.ts:58,60` types both string
 * consolidation fields `null | <enum>`, and `useSchema` declares them
 * `{ type: ["string","null"], enum: [...members, null] }` — but the API also
 * returns a bare `""`.
 *
 * Observed live 2026-09-11 (MinistryOfPhotography, self):
 * `invoice_consolidation_base_rule_day_of_week: ""`. Left verbatim, that `""`
 * survives `restoreCompactedFields` (`""` is `!== undefined`, so it is
 * explicitly restored after `useModelParser` compacts it away), reaches
 * `validate` on the machine's own LOAD path — `data-manager.machine.ts:61-84`
 * runs `parsing` -> `validating` on entering `available` — and is rejected
 * with `/dayOfWeek must be equal to one of the allowed values`. The editor
 * lands in `invalid` and the form never renders at all.
 *
 * Normalised HERE, at the one wire -> view-model boundary both halves share,
 * so the read half never publishes an off-contract `""` either.
 *
 * @decision map `""` to `null`, never to `undefined` and never at the schema.
 * what:    an `""` -> `null` coercion on the two STRING fields only.
 * why:     `null` is this module's declared "follow the brand" value
 *          (design.md §4.2), so `""` and `null` are two spellings of one
 *          state. `undefined` would instead read as "untouched" to
 *          `mapIBillingSettingsFields`, which diffs key by key — a client
 *          whose stored day is `""` would then diff against `undefined` and
 *          write a spurious `null` on the next unrelated save.
 * rejected: widening the schema's enum with `""` — it would make the editor
 *          able to SEND `""`, which is not a member of `DaysOfWeekTypes` and
 *          is not what the oracle writes (`clientInvoiceConsolidationForm.vue`
 *          submits the picked enum member or `null`).
 *
 * Scoped to the two string fields: the numeric pair came back as proper
 * `null` in the same capture, and `enabled` is non-nullable by design.
 */
export function emptyToNull<T>(value: T | ""): T | null {
  return value === "" ? null : (value as T);
}

/** Maps the raw client record into the read half's own view-model (AC1, AC14). */
export function mapBillingSettings(raw: IClient): BillingSettingsRecord {
  return {
    id: raw.id,
    enabled: raw.invoice_consolidation_enabled,
    baseRule: emptyToNull(raw.invoice_consolidation_base_rule),
    dayOfWeek: emptyToNull(raw.invoice_consolidation_base_rule_day_of_week),
    dateOfMonthDay: raw.invoice_consolidation_base_rule_date_of_month_day,
    dueDateDay: raw.invoice_consolidation_due_date_day,
    isStaged: !!raw.staged_import,
    neverSuspend: !!raw.never_suspend
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

/**
 * The dirty, per-field `PUT accounts/{accountId}` body: keyed to the two
 * account-currency fields ONLY, computed key by key against `baseModel`,
 * never by a value predicate. `undefined` for an empty diff (row B9).
 *
 * Parity row B9: unlike `mapIBillingSettingsFields` (row X1, a RECORDED
 * divergence from the consolidation form's whole-form diff gate), this
 * per-field diff is straight PARITY — the oracle's own account write is
 * already a per-changed-key diff (`basicForm:197-202` `omitBy` +
 * `basicForm:361-364` `pick`). Do not carry row X1's divergence reasoning
 * across to this write (design.md §15.4).
 *
 * @decision compare every field with `!==` and never filter the resulting
 * diff object by truthiness.
 * what:    each key is set directly from the `!==` comparison; there is no
 *          `omitBy`/`filter` pass over `diff` afterwards.
 * why:     a currency id is never falsy, but the cleared `preferredPaymentCurrencyId`
 *          IS `null` — hazard H5b / row X5. A truthiness filter over the
 *          built diff would silently drop the `null` clear from the outbound
 *          body, making the client's clear a no-op while every gate stays
 *          green. `client-billing-settings.account-clear-null.must-fail.patch`
 *          is this write's negative control for exactly that shape.
 * rejected: `Object.fromEntries(Object.entries(diff).filter(([, v]) => !!v))`
 *          — rejected outright; it is the exact defect AC21's clear case
 *          exists to close.
 */
export function mapIAccountCurrencyFields(
  model: BillingSettingsModel,
  baseModel: BillingSettingsModel = {}
): AccountCurrencyUpdateBody | undefined {
  const diff: AccountCurrencyUpdateBody = {};

  if (model.currencyId !== baseModel.currencyId) {
    diff.currency_id = model.currencyId;
  }
  if (
    model.preferredPaymentCurrencyId !== baseModel.preferredPaymentCurrencyId
  ) {
    diff.preferred_payment_currency_id = model.preferredPaymentCurrencyId;
  }

  return Object.keys(diff).length ? diff : undefined;
}
