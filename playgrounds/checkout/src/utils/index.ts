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

export const useLocaleImporter = () => {
  const messages = ref({});

  function load(path, locale) {
    path = trimStart(path, "/");
    path = trimEnd(path, "/");

    const asyncImport = find(
      locales,
      (fn, localePath) =>
        includes(localePath, `/${path}/`) &&
        includes(localePath, `/${locale}.json`)
    );

    if (!asyncImport) {
      console.warn("locale", "import not found", {
        path,
        locale,
        locales,
      });

      return;
    }

    return asyncImport()
      .then(values => {
        const oldMessages = toRaw(unref(messages));
        const newMessages = set({}, locale, values);
        messages.value = merge(oldMessages, newMessages);
        return messages;
      })
      .catch(error => {
        console.warn("locale", "import error", {
          path,
          locale,
          error,
          locales,
        });

        return {};
      });
  }

  // -----------------------------------------------------------------------------
  return {
    load,
    messages,
  };
};

// ---
// this will loadd ALL Global locales from the project assets and map them correctly
// ---

export function getGlobalMessages() {
  const messages = reduce(
    import.meta.glob("@locales/**/*.json", { eager: true }),
    (result, value, key) => {
      const locale = last(key.split("/"))?.replace(".json", "");
      if (!locale) return result;
      merge(result, { [locale]: value?.default || {} });
      return result;
    },
    {}
  );

  return messages;
}
