/** @internal */
import { mapAccount, mapClientRecord } from "../client";
import { omitBy, isEqual, isEmpty } from "lodash-es";
import type {
  AccountCurrencyUpdateBody,
  BillingSettingsModel,
  BillingSettingsUpdateBody
} from "./client-billing-settings.types";
import type { IAccount, IClient } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/client-billing-settings.mappers
 * @description Wire <-> view-model shaping for a client's invoice-consolidation
 * preference. Pure — no side effects, no HTTP, and never actor-scoped. The
 * record read itself is mapped once by the `client` module (`mapClientRecord`);
 * this file owns only the write diffs.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useBillingSettings.ts` / the barrel only (`@internal/no-cross-module-imports`).
 */

/**
 * Normalises the wire's `""` spelling of "unset" onto this module's `null`
 * ("follow the brand"). Used on the brand's consolidation defaults, which the
 * API also returns as a bare `""`.
 */
export function emptyToNull<T>(value: T | ""): T | null {
  return value === "" ? null : value;
}

/** The five consolidation fields at wire shape; clearable leaves coerced `?? null`. */
function toBillingWire(model: BillingSettingsModel): BillingSettingsUpdateBody {
  return {
    invoice_consolidation_enabled: model.enabled,
    invoice_consolidation_base_rule: model.baseRule ?? null,
    invoice_consolidation_base_rule_day_of_week: model.dayOfWeek ?? null,
    invoice_consolidation_base_rule_date_of_month_day:
      model.dateOfMonthDay ?? null,
    invoice_consolidation_due_date_day: model.dueDateDay ?? null
  } as BillingSettingsUpdateBody;
}

/**
 * The dirty `PUT clients/{id}` body: model and baseModel mapped to wire shape,
 * clearables coerced `?? null` on BOTH sides, then `omitBy(isEqual)` — mirrors
 * `client-address.mappers.ts:130-151`. `undefined` for an empty diff so the
 * caller short-circuits. The comparison is `isEqual`, never truthiness, so the
 * falsy-but-meaningful `enabled: 0` (DISABLED) is never dropped.
 */
export function mapIBillingSettingsFields(
  model: BillingSettingsModel,
  baseModel: BillingSettingsModel = {}
): BillingSettingsUpdateBody | undefined {
  const next = toBillingWire(model);
  const previous = toBillingWire(baseModel);

  const diff = omitBy(next, (value, key) =>
    isEqual(previous[key as keyof BillingSettingsUpdateBody], value)
  ) as BillingSettingsUpdateBody;

  return Object.keys(diff).length ? diff : undefined;
}

/**
 * The PERSISTED model the `update` machine service resolves — the server truth
 * folded back onto `baseModel`, mirroring `client-address`'s `mapAddress(raw)`
 * return. A cleared leaf comes back as an explicit `null` from the write
 * response, which `useModelParser`'s `defaultsDeep` keeps rather than refilling
 * from the pre-write floor — the merge `{ ...baseModel, ...model }` could not,
 * because the compacted model drops a cleared key and the old value leaks back.
 * A write that short-circuited its empty diff resolves an empty response, so
 * that half keeps `baseModel`'s values untouched (AC-11 / AC-21 no-op).
 */
export function mapPersistedBillingModel(
  baseModel: BillingSettingsModel,
  client: IClient,
  account: IAccount
): BillingSettingsModel {
  const record = isEmpty(client) ? undefined : mapClientRecord(client);
  const persisted = isEmpty(account) ? undefined : mapAccount(account);

  return {
    ...baseModel,
    ...(record && {
      enabled: record.enabled,
      baseRule: record.baseRule,
      dayOfWeek: record.dayOfWeek,
      dateOfMonthDay: record.dateOfMonthDay,
      dueDateDay: record.dueDateDay,
      neverSuspend: record.neverSuspend
    }),
    ...(persisted && {
      currencyId: persisted.currencyId,
      preferredPaymentCurrencyId: persisted.preferredPaymentCurrencyId
    })
  };
}

/** The two account-currency fields at wire shape; the clearable coerced `?? null`. */
function toAccountWire(model: BillingSettingsModel): AccountCurrencyUpdateBody {
  return {
    currency_id: model.currencyId,
    preferred_payment_currency_id: model.preferredPaymentCurrencyId ?? null
  } as AccountCurrencyUpdateBody;
}

/**
 * The dirty `PUT accounts/{accountId}` body — same wire-diff shape as
 * `mapIBillingSettingsFields`. The cleared `preferred_payment_currency_id`
 * leaves as an explicit `null` and still diffs; an untouched pair is omitted.
 */
export function mapIAccountCurrencyFields(
  model: BillingSettingsModel,
  baseModel: BillingSettingsModel = {}
): AccountCurrencyUpdateBody | undefined {
  const next = toAccountWire(model);
  const previous = toAccountWire(baseModel);

  const diff = omitBy(next, (value, key) =>
    isEqual(previous[key as keyof AccountCurrencyUpdateBody], value)
  ) as AccountCurrencyUpdateBody;

  return Object.keys(diff).length ? diff : undefined;
}
