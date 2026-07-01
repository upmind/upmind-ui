/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/mappers
 * @description Auth model mappers.
 */

import { map, slice, first, includes } from "lodash-es";
import type { IAccount, IClient } from "@upmind-automation/types";
import type { GrantTypes } from "@upmind-automation/types";
import type { Account, Client } from "./";
// -----------------------------------------------------------------------------

/**
 * Compute avatar initials from the client's public name.
 */
export function mapInitials(client: IClient, chars: number = 1): string {
  if (!client) return "";
  return slice(client?.public_name?.split(" "), 0, chars)
    ?.map((word: any) => first(word))
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
