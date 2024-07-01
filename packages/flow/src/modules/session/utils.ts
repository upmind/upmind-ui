import { toNumber, isBoolean, toString, pick, first, slice } from "lodash-es";

export const getTokenfromStorage = () => {
  const clientToken = localStorage.getItem(`client/auth/token`);
  const guestToken = localStorage.getItem(`guest/auth/token`);

  return clientToken || guestToken;
};

export const useTokenParser = (data: any) => {
  return {
    access_token: toString(data?.access_token),
    created_at: toNumber(data?.created_at) || Date.now(),
    expires_in: toNumber(data?.expires_in),
    refresh_expires_in: toNumber(data?.refresh_expires_in),
    refresh_token: toString(data?.refresh_token),
    second_factor_required: isBoolean(data?.isBoolean)
      ? data?.isBoolean
      : data?.isBoolean === "true",
    token_type: toString(data?.token_type),
  };
};

async function useAvatarParser(url) {
  if (!url?.length) return false;
  url = url.replace("?d=blank", "?d=404");
  const response = await fetch(url);
  return response.ok ? url : null;
}

function useInitialsParser(user, chars: number = 1) {
  if (!user) return "";

  return slice(user?.display?.split(" "), 0, chars)
    ?.map(word => first(word))
    ?.join("");
}

export const useUserParser = async (data: any) => {
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
};
