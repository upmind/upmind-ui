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
  isString,
  isObject
} from "lodash-es";

// --- types
import type { Token, User } from "./types";
import { Contexts, type IUser } from "@upmind-automation/types";

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
  if (isObject(clientCookie))
    (clientCookie as Token).actor_type ??= Contexts.CLIENT; // NB ensure the actor type in case of impersonation

  // const guestToken = localStorage.getItem(`guest/auth/token`);
  const guestCookie = getCookie("upm_guest_session") as string | undefined;
  if (isObject(guestCookie))
    (guestCookie as Token).actor_type ??= Contexts.GUEST; // NB ensure the actor type in case of impersonation

  let token: string | Token;

  if (actor_type === Contexts.CLIENT) {
    token = clientCookie || "";
  } else if (actor_type === Contexts.GUEST) {
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

export function useUserParser(data: IUser): User | undefined {
  const user: any = pick(data, [
    "id",
    "email",
    "username",
    "fullname",
    "firstname",
    "lastname",
    "image_url"
  ]);

  user.display = data?.firstname || data?.public_name || data?.email;
  user.avatar = {
    caption: useInitialsParser(user),
    src: user.image_url,
    forceCaption: includes(user?.image_url, "gravatar")
  };
  user.locale = data?.interface_language_code;

  return user;
}
