import { nextTick } from "vue";
import { useBrand } from "../brand";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  parseFlattened
} from "../../utils";
import {
  get,
  includes,
  isEmpty,
  last,
  merge,
  nth,
  reduce,
  set,
  split,
  isFunction
} from "lodash-es";
import type { GlobbedFiles } from "./system-localisation.types";
import type { I18n, LocaleMessages, Composer } from "vue-i18n";

// -----------------------------------------------------------------------------

/**
 * Composable function to handle internationalisation (i18n) messages.
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

let i18n: Composer | null = null;
let files: GlobbedFiles = {};
let sourceFiles: GlobbedFiles = {};
let overrides: LocaleMessages<string, object, object>;
let globalOverrides: Record<string, any> = {};

/**
 * Composable function to provide functionality for initialising and managing internationalisation (i18n) in an application.
 * The `useI18n` variable offers methods to configure the i18n instance, load locale messages, and set the active locale.
 */
export const useI18n = () => {
  /**
   * Initialises the i18n instance and loads the specified globbed files.
   *
   * @param instance - The i18n instance to initialize.
   * @param glob - An optional globbed files object.
   */
  function init(instance: I18n, glob?: GlobbedFiles) {
    if (!instance) console.warn("i18n instance not provided to useI18n");
    const { i18nMessages } = useBrand();
    i18n = instance.global as Composer;
    files = glob ?? {};

    const parsed = parseFlattened(i18nMessages.value ?? {});

    // Extract global overrides (using "*" wildcard key) that apply to all locales
    globalOverrides = get(parsed, "*", {});
    overrides = parsed;

    // NB: in DEV mode we MUST also load in our Source files over and above our provided glob files
    //     this is to account for any keys or overrides that have not been updated into Localazy yet.
    if (import.meta.env.DEV) {
      sourceFiles = import.meta.glob<Record<string, string>>(
        `@upmind-automation/i18n/**/*-en.json`,
        { eager: true }
      );
    }
  }

  /**
   * Parse the locale from the given key and value.
   * NOTE: key is the file path, and the locale is derived from the file name or parent folder.
   * eg: /path/to/module/action-en.json  => locale: en, module: action
   *     /path/to/module/en.json         => locale: en, module: module
   * @param key
   * @param value
   * @returns
   */
  function parse(
    key: string,
    value: Record<string, string> | undefined
  ): LocaleMessages<string, object, object> | null {
    if (!includes(key, "/")) return null;

    const fileName = last(split(key, "/")) as string;
    const parentFolder = nth(split(key, "/"), -2) as string;

    // Try to extract locale from filename suffix: action-en.json
    const fileParts = split(fileName, "-");
    const hasSuffixLocale =
      fileParts.length > 1 &&
      includes(fileParts[fileParts.length - 1], ".json");
    let localeCode: string | undefined;
    let moduleName: string;

    if (hasSuffixLocale) {
      // Suffix case
      const [name, localeWithExt] = [
        fileParts.slice(0, -1).join("-"),
        last(fileParts) as string
      ];
      localeCode = split(localeWithExt, ".")[0];
      moduleName = name;
    } else {
      // Folder case
      localeCode = parentFolder;
      moduleName = split(fileName, ".")[0];
    }

    if (!localeCode || !moduleName) return null;

    return set({}, `${localeCode}.${moduleName}`, value ?? {});
  }

  async function getMessages(
    name: string
  ): Promise<LocaleMessages<string, object, object>> {
    const promises = await Promise.all(
      reduce(
        { ...files, ...sourceFiles },
        (result: Promise<any>[], value: any, key: string) => {
          if (name && !includes(key, name)) return result;
          if (isFunction(value)) {
            result.push(
              value().then(
                (
                  msgs:
                    | Record<string, string>
                    | { default: Record<string, string> }
                ) => {
                  msgs = (msgs?.default ?? msgs) as Record<string, string>; // in case default import is not specified in the glob definition https://vite.dev/guide/features.html#named-imports
                  return get(parse(key, { ...msgs }), name);
                }
              )
            );
          } else {
            value = value?.default ?? value; // in case default import is not specified in the glob definition https://vite.dev/guide/features.html#named-imports
            const msgs = get(parse(key, value), name);
            result.push(Promise.resolve(msgs));
          }

          return result;
        },
        [] as Promise<any>[]
      )
    );

    let messages = reduce(
      promises,
      (result, value) => merge(result, value),
      {}
    );

    // Apply brand meta overrides: global first, then locale-specific
    const localeOverrides = get(overrides, name, {});

    if (!isEmpty(globalOverrides)) {
      messages = merge(messages, globalOverrides);
    }

    if (!isEmpty(localeOverrides)) {
      messages = merge(messages, localeOverrides);
    }

    return messages;
  }

  async function setLocale(locale: string) {
    if (!i18n)
      throw new DetailedError(
        "i18n instance not provided",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );

    if (!isEmpty(locale)) {
      return loadLocaleMessages(locale).then(
        () => (i18n!.locale.value = locale)
      );
    }
  }

  async function loadLocaleMessages(locale: string) {
    if (!i18n)
      throw new DetailedError(
        "i18n instance not provided",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );
    //
    const messages = await getMessages(locale);

    // apply the locale messages to the i18n instance
    i18n.setLocaleMessage(locale, messages);

    return nextTick();
  }

  // ---------------------------------------------------------------------------

  return {
    init,
    setLocale,
    loadLocaleMessages,
    ...(i18n ??
      ({
        t: (key: string, _values?: Record<string, unknown>) => key
      } as Composer))
  } as Composer & {
    init: (instance: I18n, glob?: GlobbedFiles) => void;
    setLocale: (locale: string) => Promise<void>;
    loadLocaleMessages: (locale: string) => Promise<void>;
  };
};
