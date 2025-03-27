// --- utils
import { reduce, set } from "lodash-es";

// -----------------------------------------------------------------------------

export const useBrandParser = (data: object) =>
  reduce(
    data,
    (result, value, key) => {
      set(result, key, value);
      return result;
    },
    {}
  );
