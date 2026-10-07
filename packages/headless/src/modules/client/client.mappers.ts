/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/mappers
 * @description Auth model mappers.
 */

import { UserMetaKeys } from "@upmind-automation/types";
import { map, slice, first, includes } from "lodash-es";
import type { Account, Client, ClientRecord } from "./";
import type { IAccount, IClient } from "@upmind-automation/types";
// -----------------------------------------------------------------------------

/** The wire's `""` spelling of "unset" onto this model's `null` (follow the brand). */
function emptyToNull<T>(value: T | ""): T | null {
  return value === "" ? null : value;
}

/** `"1"`/`1` → true, `"0"`/`0` → false, absent → undefined. */
function mapExcludeDelegatedProducts(value: unknown): boolean | undefined {
  if (value === "1" || value === 1) return true;
  if (value === "0" || value === 0) return false;
  return undefined;
}

/**
 * Maps the raw client record into the one shared view-model the sibling client
 * modules read their own slice from.
 */
export function mapClientRecord(raw: IClient): ClientRecord {
  return {
    id: raw.id,
    brandId: raw.brand_id,
    firstName: raw.firstname,
    lastName: raw.lastname,
    publicName: raw.public_name,
    language: raw.interface_language_id,
    interfaceLanguageCode: raw.interface_language_code,
    excludeDelegatedProducts: mapExcludeDelegatedProducts(
      raw.meta?.[UserMetaKeys.UI_PRODUCTS_EXCLUDE_DELEGATES]
    ),
    customFieldValues: raw.custom_fields ?? [],
    enabled: raw.invoice_consolidation_enabled,
    baseRule: emptyToNull(raw.invoice_consolidation_base_rule),
    dayOfWeek: emptyToNull(raw.invoice_consolidation_base_rule_day_of_week),
    dateOfMonthDay: raw.invoice_consolidation_base_rule_date_of_month_day,
    dueDateDay: raw.invoice_consolidation_due_date_day,
    neverSuspend: !!raw.never_suspend,
    meta: raw.meta,
    account: raw.accounts?.length ? mapAccount(first(raw.accounts)!) : null
  };
}

/**
 * Compute avatar initials from the client's public name.
 */
export function mapInitials(client: IClient, chars: number = 1): string {
  if (!client) return "";
  return slice(client?.public_name?.split(" "), 0, chars)
    ?.map((word: string) => first(word))
    ?.join("");
}

/**
 * Map a raw IAccount to a parsed Account.
 */
export function mapAccount(raw: IAccount): Account {
  return {
    currency: raw.currency,
    currencyId: raw.currency_id,
    id: raw.id,
    meta: {
      canTopup: raw.topup_enabled
    },
    preferredPaymentCurrencyId: raw.preferred_payment_currency_id,
    pricelist: raw.pricelist
  };
}

/**
 * Map a raw IClient (plus optional accounts) to the Client view model.
 *
 * F5 invariant: isGuest is NOT set here.
 * The single actor.is_guest → isGuest mapping lives in
 * session-store/session-store.mappers.ts mapSessionUser.
 */
export function mapClient(
  raw: IClient,
  accounts?: IAccount[]
): Client | undefined {
  if (!raw) return undefined;
  return {
    accounts: map(accounts, mapAccount),
    avatar: {
      caption: mapInitials(raw),
      forceCaption: includes(raw?.image_url, "gravatar"),
      src: raw.image_url
    },
    customFields: raw?.custom_fields || [],
    display: raw?.firstname || raw?.public_name || raw?.email,
    email: raw.email,
    firstName: raw.firstname,
    fullName: raw.fullname,
    id: raw.id,
    language: raw.interface_language_id,
    lastName: raw.lastname,
    locale: raw.interface_language_code,
    primaryEmail: raw?.default_email
      ? {
          email: raw.default_email.email,
          id: raw.default_email.id,
          isVerified: !!raw.default_email.verified
        }
      : undefined,
    publicName: raw.public_name,
    username: raw.username
  } as Client;
}
