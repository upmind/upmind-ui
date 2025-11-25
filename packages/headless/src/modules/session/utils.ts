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
  pick,
  first,
  slice,
  isEmpty,
  includes,
  isString
} from "lodash-es";

// --- types
import type { Token, Client } from "./types";
import type { IClient } from "@upmind-automation/types";

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
    setCookie("upm_client_session", useTokenParser(clientToken), {
      expires: "8h" //default : refresh token and access token are valid for 8 hours
    });
    localStorage.removeItem(`client/auth/token`);
  }

  if (guestToken) {
    console.warn(
      "Converting Guest token to cookies. This is a one-time operation to migrate from localStorage to cookies."
    );
    setCookie("upm_guest_session", useTokenParser(guestToken), {
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

  // const guestToken = localStorage.getItem(`guest/auth/token`);
  const guestCookie = getCookie("upm_guest_session") as string | undefined;

  let token: string | Token;

  if (actor_type === "client") {
    token = clientCookie || "";
  } else if (actor_type === "guest") {
    token = guestCookie || "";
  } else {
    token = clientCookie || guestCookie || "";
  }
  token = useTokenParser(token) as Token;
  return token;
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

  const type = token?.actor_type || "guest";

  // finally, persist the new token
  setCookie(`upm_${type}_session`, token, {
    expires: "8h" //default : refresh token and access token are valid for 8 hours
  });

  return Promise.resolve(token);
}

export function dumpTokenFromStorage(actor_type: Token["actor_type"]) {
  useCookies().removeTopLevel(`upm_${actor_type}_session`);
}

export function useTokenParser(data: string | Token): Token | undefined {
  if (isEmpty(data)) return undefined;

  if (isString(data)) data = JSON.parse(data);

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

export function useInitialsParser(user: any, chars: number = 1) {
  if (!user) return "";

  return slice(user?.display?.split(" "), 0, chars)
    ?.map((word: any) => first(word))
    ?.join("");
}

export function useClientParser(raw: IClient): Client | undefined {
  return {
    avatar: {
      caption: useInitialsParser(raw),
      src: raw.image_url,
      forceCaption: includes(raw?.image_url, "gravatar")
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
    publicName: raw.public_name,
    username: raw.username
  } as Client;
}
