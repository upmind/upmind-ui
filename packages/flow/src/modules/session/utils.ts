// --- utils
import {
  toNumber,
  isBoolean,
  toString,
  pick,
  first,
  slice,
  isEmpty,
} from "lodash-es";

// --- types
import type { Token } from "./types";
import { isString } from "xstate/lib/utils";

// -----------------------------------------------------------------------------

export function getTokenfromStorage(actor_type?: "guest" | "client") {
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
  return useTokenParser(token);
}

export function persistTokenToStorage(token: Token, history?: false) {
  if (!localStorage) return Promise.reject("No localStorage available");

  token = useTokenParser(token);
  const type = token.actor_type || "guest";

  if (history) {
    const prevGuestToken = getTokenfromStorage("guest");
    if (prevGuestToken) token.guest_token = prevGuestToken?.access_token;
  }

  // now remember to destroy any prev token as we have a new one
  localStorage.removeItem(`guest/auth/token`);
  localStorage.removeItem(`client/auth/token`);

  // finally, persist the new token
  localStorage.setItem(`${type}/auth/token`, JSON.stringify(token));
}

export function dumpTokensFromStorage() {
  localStorage.removeItem(`client/auth/token`);
  localStorage.removeItem(`guest/auth/token`);
}

// ---

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

export function useInitialsParser(user, chars: number = 1) {
  if (!user) return "";

  return slice(user?.display?.split(" "), 0, chars)
    ?.map(word => first(word))
    ?.join("");
}

export async function useUserParser(data: any) {
  const user = pick(data, [
    "id",
    "email",
    "username",
    "full_name",
    "first_name",
    "last_name",
    "image_url",
  ]);

  user.display = data?.public_name || data?.first_name || data?.email;
  user.avatar = {
    caption: useInitialsParser(user),
    src: await useAvatarParser(user.image_url),
  };

  return user;
}

async function useAvatarParser(url) {
  if (!url?.length) return false;
  url = url.replace("?d=blank", "?d=404");
  const response = await fetch(url);
  return response.ok ? url : null;
}
