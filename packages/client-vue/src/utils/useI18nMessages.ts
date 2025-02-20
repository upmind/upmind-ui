import { reduce, merge, includes, forEach, concat } from "lodash-es";

// Define the type for the loaded locales (adjust as needed)
interface Locale {
  [localeCode: string]: Record<string, string>;
}

// Define the type for the glob imports
interface GlobbedFiles {
  [path: string]: { default: Record<string, string> };
}

// const baseConfig: = {
//   global: {
//     dev: ["../**/i18n/[!_]*.json"],
//     prod: ["../locales/**/[!_]*.json"],
//   },
// };

/**
 * A composable to handle internationalization (i18n) messages.
 *
 * @param files - An array of file paths to be imported, usually using `import.meta.glob` with eager set to true.
 * @param debug - A boolean indicating if the environment is in development mode. Defaults to `import.meta.env.DEV`.
 *
 * @returns An object containing the `getMessages` function.
 *
 * @function parseLocale
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
export const useI18nMessages = (files: GlobbedFiles) => {
  // ---

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

  function parseLocale(
    key: string,
    value: Record<string, string> | undefined
  ): Locale | null {
    const localeCode = import.meta.env.DEV ? "en" : key.split("/").slice(-2)[0];
    return localeCode && value ? { [localeCode]: value } : null;
  }

  function getMessages(name?: string): Locale {
    return reduce<Record<string, { default: Record<string, string> }>, Locale>(
      files,
      (result, value, key) => {
        if (name && !includes(key, name)) return result;

        const locale = parseLocale(key, value?.default);
        return locale ? merge(result, locale) : result;
      },
      {}
    );
  }

  return {
    getMessages,
    messages: getMessages(),
  };
};
