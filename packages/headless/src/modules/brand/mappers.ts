// --- utils
import { BrandConfigKeys } from "@upmind-automation/types";
import { defaultsDeep, reduce, set } from "lodash-es";
// -----------------------------------------------------------------------------

export const mapBrandConfig = (data: object, keys: BrandConfigKeys[]) => {
  // create an object template with ALL the keys and set them to null
  // this is to ensure that the config object has all the keys that were requested
  const template = reduce(
    keys,
    (result: { [key: string]: any }, key: string) => {
      set(result, key, null);
      return result;
    },
    {}
  );

  const mapped = reduce(
    data,
    (result, value, key) => {
      set(result, key, value);
      return result;
    },
    {}
  );

  // now use the template as a fallback for the data
  return defaultsDeep(mapped, template);
};
