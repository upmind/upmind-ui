// --- utils
import { BrandConfigKeys, IBrandSettings } from "@upmind-automation/types";
import {
  defaultsDeep,
  forEach,
  get,
  isObject,
  keys,
  pick,
  reduce,
  set
} from "lodash-es";
import { parseFlattened } from "../../utils";
import { LocaleMessages } from "vue-i18n";
import { isString } from "xstate/lib/utils";
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

export const mapBrandSettings = (data: IBrandSettings) => {
  const settings = parseFlattened<IBrandSettings>(data);

  // We need to map the raw messages into the correct format for i18n
  // NB: If we are given a string for a given key, we apply it to all locales
  const rawI18n = get(data, "meta.i18n", {}) as Record<string, any>;
  const i18n = reduce(
    rawI18n,
    (acc: LocaleMessages<string, {}, {}>, message, key) => {
      if (isObject(message)) {
        forEach(keys(message) ?? [], locale => {
          set(acc, [locale, ...key.split(".")], get(message, locale));
        });
      }

      if (isString(message)) {
        forEach(settings?.languages ?? [], locale => {
          set(acc, [locale.code, ...key.split(".")], message);
        });
      }

      return acc;
    },
    {} as LocaleMessages<string, {}, {}>
  );
  // update the settings object with the mapped i18n messages
  set(settings, "meta.i18n", i18n);

  return settings;
};
