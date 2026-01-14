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
  const settings = data;

  // Transform i18n from key-first to locale-first structure
  // API returns: { "cart.title": { "en": "...", "fr": "..." } }
  // We need: { "en": { "cart.title": "..." }, "fr": { "cart.title": "..." } }
  const rawI18n = get(data, "meta.i18n", {}) as Record<string, any>;
  const i18n = reduce(
    rawI18n,
    (acc: LocaleMessages<string, {}, {}>, localeValues, key) => {
      if (isObject(localeValues)) {
        // This key has per-locale values - invert the structure
        forEach(keys(localeValues) ?? [], locale => {
          set(acc, [locale, key], get(localeValues, locale));
        });
      } else if (isString(localeValues)) {
        forEach(settings?.languages ?? [], locale => {
          set(acc, [locale.code, key], localeValues);
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
