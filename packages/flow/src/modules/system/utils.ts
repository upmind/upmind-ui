import { reduce, set } from "lodash-es";

export const useSystemParser = (data: Object) =>
  reduce(
    data,
    (result, value, key) => {
      set(result, key, value);
      return result;
    },
    {}
  );
