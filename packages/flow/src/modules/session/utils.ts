import { toNumber, isBoolean, toString, pick } from "lodash-es";

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

function useInitialsParser(user) {
  if (!user) return "";

  return user?.display
    ?.split(" ")
    ?.map(word => word[0])
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
