import { toNumber, isBoolean, toString } from "lodash-es";

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
