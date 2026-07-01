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
import type { IClient, ISelf, IUser } from "@upmind-automation/types";
import { mapInitials, mapAccount } from "../client";
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
 */
export function mapSessionUser(
  self: Pick<ISelf, "actor"> & Partial<Pick<ISelf, "analytics" | "accounts">>
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
    username: actor.username
  };
}
