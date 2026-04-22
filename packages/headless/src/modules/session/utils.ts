// --- internal
import { useI18n } from "../system";

// --- utils
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useCookies
} from "../../utils";
import {
  toNumber,
  isBoolean,
  toString,
  first,
  map,
  slice,
  isEmpty,
  includes,
  isString,
  isObject
} from "lodash-es";

// --- types
import type { Token, Client, Account } from "./types";
import {
  Contexts,
  type IAccount,
  type IClient
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------
function convertToCookie() {
  if (!localStorage) return;

  const { setTopLevel: setCookie } = useCookies();

  const guestToken = localStorage.getItem(`guest/auth/token`);
  const clientToken = localStorage.getItem(`client/auth/token`);

  if (clientToken) {
    console.warn(
      "Converting Client token to cookies. This is a one-time operation to migrate from localStorage to cookies."
    );
    setCookie("upm_client_session", mapToken(clientToken), {
      expires: "8h" //default : refresh token and access token are valid for 8 hours
    });
    localStorage.removeItem(`client/auth/token`);
  }

  if (guestToken) {
    console.warn(
      "Converting Guest token to cookies. This is a one-time operation to migrate from localStorage to cookies."
    );
    setCookie("upm_guest_session", mapToken(guestToken), {
      expires: "8h" //default : refresh token and access token are valid for 8 hours
    });
    localStorage.removeItem(`guest/auth/token`);
  }
}

export function getTokenFromStorage(actor_type?: Token["actor_type"]) {
  const { get: getCookie } = useCookies();
  // convert localStorage tokens to cookies if they exist
  // this is a one-time operation to migrate from localStorage to cookies
  convertToCookie();

  const clientCookie = getCookie("upm_client_session") as string | undefined;
  if (isObject(clientCookie))
    (clientCookie as Token).actor_type ??= Contexts.CLIENT; // NB ensure the actor type in case of impersonation

  const adminCookie = getCookie("upm_admin_session") as string | undefined;
  if (isObject(adminCookie))
    (adminCookie as Token).actor_type ??= Contexts.ADMIN; // NB ensure the actor type in case of impersonation

  const userCookie = getCookie("upm_user_session") as string | undefined;
  if (isObject(userCookie)) (userCookie as Token).actor_type ??= Contexts.USER; // NB ensure the actor type in case of impersonation

  // const guestToken = localStorage.getItem(`guest/auth/token`);
  const guestCookie = getCookie("upm_guest_session") as string | undefined;
  if (isObject(guestCookie))
    (guestCookie as Token).actor_type ??= Contexts.GUEST; // NB ensure the actor type in case of impersonation

  let token: string | Token;

  if (actor_type === Contexts.CLIENT) {
    token = clientCookie || "";
  } else if (actor_type === Contexts.ADMIN || actor_type === Contexts.USER) {
    token = userCookie || adminCookie || "";
  } else if (actor_type === Contexts.GUEST) {
    token = guestCookie || "";
  } else {
    token = userCookie || adminCookie || clientCookie || guestCookie || "";
  }

  return mapToken(token) as Token;
}

export function persistTokenToStorage(token: Token) {
  const { t } = useI18n();
  const { setTopLevel: setCookie } = useCookies();

  if (!token || !token.access_token)
    throw new DetailedError(
      t("error.token_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      token
    );

  if (!localStorage)
    return Promise.reject(
      new DetailedError(
        t("error.local_storage_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const type = token?.actor_type || Contexts.GUEST;

  // finally, persist the new token
  setCookie(`upm_${type}_session`, token, {
    expires: "8h" //default : refresh token and access token are valid for 8 hours
  });

  return Promise.resolve(token);
}

export function dumpTokenFromStorage(actor_type: Token["actor_type"]) {
  useCookies().removeTopLevel(`upm_${actor_type}_session`);
}

export function mapToken(data: string | Token): Token | undefined {
  if (isEmpty(data)) return undefined;

  if (isString(data)) {
    try {
      data = JSON.parse(data);
    } catch (e) {
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

export function mapInitials(client: IClient, chars: number = 1) {
  if (!client) return "";

  return slice(client?.public_name?.split(" "), 0, chars)
    ?.map((word: any) => first(word))
    ?.join("");
}

export function mapAccount(raw: IAccount): Account {
  return {
    currency: raw.currency,
    id: raw.id,
    pricelist: raw.pricelist,
    meta: {
      canTopup: raw.topup_enabled
    }
  };
}

export function mapClient(
  raw: IClient,
  accounts?: IAccount[]
): Client | undefined {
  return {
    accounts: map(accounts, mapAccount),
    avatar: {
      caption: mapInitials(raw),
      src: raw.image_url,
      forceCaption: includes(raw?.image_url, "gravatar")
    },
    customFields: raw?.custom_fields || [],
    display: raw?.firstname || raw?.public_name || raw?.email,
    email: raw.email,
    firstName: raw.firstname,
    fullName: raw.fullname,
    id: raw.id,
    isGuest: !!raw.is_guest,
    language: raw.interface_language_id,
    lastName: raw.lastname,
    locale: raw.interface_language_code,
    publicName: raw.public_name,
    username: raw.username
  } as Client;
}

export function mapIClient(client: Client): IClient {
  return {
    id: client.id,
    email: client.email,
    firstname: client.firstName,
    fullname: client.fullName,
    lastname: client.lastName,
    public_name: client.publicName,
    username: client.username
  } as IClient;
}
