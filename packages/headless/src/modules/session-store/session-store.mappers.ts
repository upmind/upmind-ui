/** @internal */
import { mapInitials, mapAccount } from "../client";
import {
  includes,
  isBoolean,
  isEmpty,
  isString,
  map,
  toNumber,
  toString
} from "lodash-es";
import type { SessionUser, Token } from "./session-store.types";
import type { IBrand, IClient, ISelf, IUser } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module session-store/mappers
 * @description Session data mappers.
 *
 * WARNING: Do not import directly. Internal use only.
 */
export function mapToken(data: string | Token): Token | undefined {
  if (isEmpty(data)) return undefined;

  if (isString(data)) {
    try {
      data = JSON.parse(data);
    } catch (_e) {
      console.error("[Session Utility] Failed to parse token JSON:", data);
      return undefined;
    }
  }

  const tokenData = data as Token;
  return {
    access_token: toString(tokenData.access_token),
    created_at: toNumber(tokenData.created_at) || Date.now(),
    expires_in: toNumber(tokenData.expires_in),
    refresh_expires_in: toNumber(tokenData.refresh_expires_in),
    refresh_token: toString(tokenData.refresh_token),
    second_factor_required: isBoolean(tokenData.second_factor_required)
      ? tokenData.second_factor_required
      : tokenData.second_factor_required === "true",
    actor_type: toString(tokenData.actor_type),
    actor_id: toString(tokenData.actor_id),
    guest_token: toString(tokenData.guest_token)
  } as Token;
}

/**
 * Map /self API response to SessionUser format.
 * Extracts user data from ISelf.actor field for session store.
 * Brand fields: brand_id from ISelf, brands from `with=brands` relation (staff).
 */
export function mapSessionUser(
  self: Pick<ISelf, "actor"> &
    Partial<
      Pick<ISelf, "analytics" | "accounts" | "brand_id" | "delegated_ids">
    > & {
      brands?: IBrand[];
    }
): SessionUser {
  const actor: IUser = self.actor;
  const client = actor as unknown as IClient;
  const defaultEmail = client.default_email;

  return {
    accounts: self.accounts ? map(self.accounts, mapAccount) : undefined,
    analytics: self.analytics,
    avatar: {
      caption: mapInitials(client),
      forceCaption: includes(client.image_url, "gravatar"),
      src: actor.image_url
    },
    display: actor.firstname || actor.public_name || actor.email,
    email: actor.email,
    firstName: actor.firstname,
    fullName: actor.fullname,
    id: actor.id,
    isGuest: !!client.is_guest,
    stagedImport: !!client.staged_import,
    hasLegacyInvoices: !!client.has_legacy_invoices,
    language: actor.interface_language_id,
    lastName: actor.lastname,
    locale: actor.interface_language_code,
    primaryEmail: defaultEmail
      ? {
          email: defaultEmail.email,
          id: defaultEmail.id,
          isVerified: !!defaultEmail.verified
        }
      : undefined,
    primaryEmailId: defaultEmail?.id,
    publicName: actor.public_name,
    username: actor.username,
    brandId: self.brand_id,
    brands: self.brands,
    // ?? {} defends against the wire's only recorded case (`null`), even
    // though ISelf.delegated_ids is typed non-nullable — never remove this.
    delegatedIds: self.delegated_ids ?? {},
    // FE-3229 AC18, ruling R2 — additive. No default: the wire value is
    // published verbatim, including a present empty bag.
    upmindPackageLimits: client.upmind_package_limits
  };
}
