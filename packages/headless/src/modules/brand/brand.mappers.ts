/** @internal */
import { isString } from "xstate/lib/utils";
import {
  defaultsDeep,
  forEach,
  get,
  isObject,
  keys,
  reduce,
  set
} from "lodash-es";
import type { IBrandSettings } from "@upmind-automation/types";
import type { BrandConfigKeys } from "@upmind-automation/types";
import type { LocaleMessages } from "vue-i18n";
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
    (acc: LocaleMessages<string, object, object>, localeValues, key) => {
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
    {} as LocaleMessages<string, object, object>
  );

  // update the settings object with the mapped i18n messages
  set(settings, "meta.i18n", i18n);

  return settings;
};
