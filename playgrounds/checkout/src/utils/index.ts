import { ref, unref, toRaw } from "vue";
import { useI18n } from "vue-i18n";

import {
  reduce,
  last,
  merge,
  includes,
  find,
  trimStart,
  trimEnd,
  set,
} from "lodash-es";

// -----------------------------------------------------------------------------

// load all our locales, but only their references, not the actual content
// we will load them on demand
const locales = import.meta.glob("@locales/**/*.json", {
  eager: false,
});

// -----------------------------------------------------------------------------

export const useCompositionI18n = () => {
  const { locale } = useI18n({ useScope: "global" });

  // a glob way of loading messages
  const messages = reduce(
    import.meta.glob("./locales/*.json", { eager: true }),
    (result, value, key) => {
      const locale = key.replace("./locales/", "").replace(".json", "");
      set(result, locale, value.default);
      return result;
    },
    {}
  );

  const { t } = useI18n({ messages });
};

// ---
// this will load ALL Global locales from the project assets and map them correctly
// global locales do NOT start with an underscore

export function getGlobalMessages(debug = import.meta.env.DEV) {
  let files;
  if (debug) {
    files = import.meta.glob(`@/**/i18n/[!_]*.json`, { eager: true });
  } else {
    files = import.meta.glob("@locales/**/[!_]*.json", { eager: true });
  }

  return reduce(
    files,
    (result, value, key) => {
      const locale = parseLocale(key, value?.default, debug);

      if (!locale) return result;

      merge(result, locale);
      return result;
    },
    {}
  );
}

// ---
// this will load the locales for a specific component/view base don the given name
// if we are debugging (on by default in DEV mode), we will load the source english version of the locales
export function getLocalMessages(name, debug = import.meta.env.DEV) {
  let files;
  if (debug) {
    files = import.meta.glob(`@/**/i18n/_*.json`, { eager: true });
  } else {
    files = import.meta.glob(`@locales/**/_*.json`, { eager: true });
  }

  return reduce(
    files,
    (result, value, key) => {
      if (!includes(key, name)) return result;
      const locale = parseLocale(key, value?.default, debug);
      if (!locale) return result;
      merge(result, locale);
      return result;
    },
    {}
  );
}

function parseLocale(key, value, debug) {
  let locale;

  if (debug) {
    // we are in debug mode, so we will always load the english version
    locale = "en";
  } else {
    // lets do some magic to get the locale
    // our paths are like: @locales/en/xyz.json so the local is always the 2nd last part
    locale = key.split("/");
    locale = locale[locale.length - 2];
  }
  if (!locale || !value) return null;

  return { [locale]: value };
}
