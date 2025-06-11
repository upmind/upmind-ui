// --- external
import { nextTick, unref } from "vue";
import type { I18n, LocaleMessages } from "vue-i18n";

// --- internal

// --- utils
import { reduce, merge, includes, isEmpty, isEqual, get } from "lodash-es";

// --- types
import type { GlobbedFiles } from "./types";

// const baseConfig: = {
//   global: {
//     dev: ["../**/i18n/[!_]*.json"],
//     prod: ["../locales/**/[!_]*.json"],
//   },
// };

// -----------------------------------------------------------------------------

/**
 * A composable to handle internationalization (i18n) messages.
 *
 * @param files - An array of file paths to be imported, usually using `import.meta.glob` with eager set to true.
 * @param debug - A boolean indicating if the environment is in development mode. Defaults to `import.meta.env.DEV`.
 *
 * @returns An object containing the `getMessages` function.
 *
 * @function parse
 * Parses the locale from the given key and value.
 *
 * @param key - The key representing the file path.
 * @param value - The content of the file as a record of strings.
 * @returns A locale object or null if the locale code or value is not valid.
 *
 * @function getMessages
 * Retrieves the i18n messages for the specified type and optional name.
 *
 * @param type - The type of i18n messages to retrieve. Defaults to `i18nType.global`.
 * @param name - An optional name to filter the messages by.
 * @returns A locale object containing the i18n messages.
 */
export const useI18n = (i18n: I18n, files?: GlobbedFiles) => {
  // TODO:
  //  in DEV mode dont forget our i18n within client-vue:
  //  in production we will use the compiled locales from localazy
  // if (import.meta.env.DEV) {
  //   files = import.meta.glob(`./**/i18n/*-en.json`, { eager: true });
  //   files = import.meta.glob(`@/**/i18n/*-en.json`, { eager: true });
  // } else {
  //   // files = import.meta.glob("./locales/**/*.json", { eager: true });
  //   files = import.meta.glob("@locales/**/*.json", { eager: true });
  // }
  // }

  function parse(
    key: string,
    value: Record<string, string> | undefined
  ): LocaleMessages<string, {}, {}> | null {
    const localeCode = import.meta.env.DEV ? "en" : key.split("/").slice(-2)[0];
    return localeCode && value ? { [localeCode]: value } : null;
  }

  // TODo filter file by Locale
  function getMessages(name?: string): LocaleMessages<string, {}, {}> {
    // TODO, make async
    // for (const path in files) {
    //   files[path]().then(mod => {
    //     console.debug(path, mod);
    //   });
    // }

    return reduce(
      files,
      (result, value, key) => {
        if (name && !includes(key, name)) return result;
        const parsed = parse(key, value?.default ?? value);
        return parsed ? merge(result, parsed) : result;
      },
      {}
    );
  }

  function setLocale(locale: string) {
    const currentLocale = unref(i18n.global.locale) as string;

    // bail out if the locale is empty or the same as the current locale
    if ((isEmpty(locale), isEqual(locale, currentLocale))) return;

    i18n.global.locale = locale;

    /**
     * NOTE:
     * If you need to specify the language setting for headers, such as the `fetch` API, set it here.
     * The following is an example for axios.
     *
     * axios.defaults.headers.common['Accept-Language'] = locale
     */

    // finally update our document
    document.querySelector("html")?.setAttribute("lang", locale);
  }

  async function loadLocaleMessages(locale: string) {
    // Load ALL messages with dynamic import of files provided
    // then get the messages for the specified locale
    // TODO make this more intelligent with async loading
    const messages = get(getMessages(), locale, {}) as LocaleMessages<
      string,
      {},
      {}
    >;

    // apply the locale messages to the i18n instance
    i18n.global.setLocaleMessage(locale, messages);

    return nextTick();
  }

  return {
    setLocale,
    loadLocaleMessages,
  };
};
