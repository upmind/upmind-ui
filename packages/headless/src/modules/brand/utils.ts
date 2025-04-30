// --- utils
import { reduce, set, defaultsDeep } from "lodash-es";
import { BrandContext } from "./types";

// -----------------------------------------------------------------------------

export const useBrandParser = (context: BrandContext, data: object) => {
  const mapped = reduce(
    data,
    (result, value, key) => {
      set(result, key, value);
      return result;
    },
    {}
  );

  return defaultsDeep(mapped, context);
};
