// --- utils
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
} from "lodash-es";

// --- types
import type { Token, User } from "./types";
import type { IUser } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export function getTokenFromStorage(actor_type?: Token["actor_type"]) {
  let token: string = "";
  if (actor_type === "client") {
    token = localStorage.getItem(`client/auth/token`) || "";
  } else if (actor_type === "guest") {
    token = localStorage.getItem(`guest/auth/token`) || "";
  } else {
    const clientToken = localStorage.getItem(`client/auth/token`);
    const guestToken = localStorage.getItem(`guest/auth/token`);
    token = clientToken || guestToken || "";
  }
  return useTokenParser(token) as Token;
}

export function persistTokenToStorage(token: Token) {
  if (!localStorage)
    return Promise.reject(new Error("No localStorage available"));

  const type = token?.actor_type || "guest";

  // finally, persist the new token
  localStorage.setItem(
    `${type}/auth/token`,
    JSON.stringify(useTokenParser(token))
  );

  return Promise.resolve(token);
}

export function dumpTokenFromStorage(actor_type: Token["actor_type"]) {
  localStorage.removeItem(`${actor_type}/auth/token`);
}

export function useTokenParser(data: any) {
  if (isEmpty(data)) return null;

  if (isString(data)) data = JSON.parse(data);

  return {
    access_token: toString(data?.access_token),
    created_at: toNumber(data?.created_at) || Date.now(),
    expires_in: toNumber(data?.expires_in),
    refresh_expires_in: toNumber(data?.refresh_expires_in),
    refresh_token: toString(data?.refresh_token),
    second_factor_required: isBoolean(data?.isBoolean)
      ? data?.isBoolean
      : data?.isBoolean === "true",
    actor_type: toString(data?.actor_type),
    actor_id: toString(data?.actor_id),
    guest_token: toString(data?.guest_token),
  };
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
    "image_url",
  ]);

  user.display = data?.firstname || data?.public_name || data?.email;
  user.avatar = {
    caption: useInitialsParser(user),
    src: user.image_url,
    forceCaption: includes(user?.image_url, "gravatar"),
  };
  user.locale = data?.interface_language_code;

  return user;
}
