import { computed, ref } from "vue";
import { QUERY_PARAMS } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useQueryParams } from "../routing";
import { useActiveSession } from "../session-store";
import { SupportedLocaleCodes as UpmindSupportedLocales } from "./system-localisation.locales";
import { useI18n } from "./useI18n";
import { useLocalStorage } from "../../utils";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";
import {
  uniq,
  map,
  compact,
  isEmpty,
  first,
  reduce,
  some,
  filter,
  includes
} from "lodash-es";
import type { RouteLocation } from "vue-router";

// -----------------------------------------------------------------------------

const defaultLocale = ref<string>("en");
const locale = ref<string>("en");

/**
 * Composable function to provide locale-related utilities and state management for internationalisation (i18n).
 *
 * This module is responsible for controlling and updating the current locale, determining supported languages,
 * and applying fallback logic for selecting appropriate locales based on user or system preferences.
 *
 * Note: Changing the locale is restricted while the user is authenticated to prevent inconsistencies, as
 * the locale is tied to the account's preferred language.
 */
export const useLocale = () => {
  const { t } = useI18n();
  const { get: getFromStorage, set: setStorage } = useLocalStorage();

  // --- state

  // NB: you can only change locales when not authenticated!
  //     this is because the locale is tied to the account's preferred language
  //     and changing it while authenticated could lead to unwanted side effects
  const meta = computed(() => {
    const { isAuthenticated } = useActiveSession().useMeta();
    return {
      isAvailable:
        !isEmpty(UpmindSupportedLocales) &&
        !isAuthenticated.value &&
        supportedLanguages.value.length > 1,
      hasLocale: !isEmpty(locale.value)
    };
  });

  // --- context

  const supportedLanguages = computed(() => {
    const { languages } = useBrand();
    return filter(languages.value, ({ code }) =>
      includes(UpmindSupportedLocales, code)
    );
  });

  // --- methods

  function getLocale(): string {
    // to set locale we do a few things:
    // 2. if not, check if we have any url params and use that if it is valid/supported by the brand
    // 2. if not, check if we have a stored locale
    // 3. if not, check if we have a preferred locale from the browser, and that it is supported by the brand
    // 4. if not, default to "null" (which will be handled by the API)
    const { consumeParam } = useQueryParams({
      query: Object.fromEntries(
        new URLSearchParams(window.location?.search).entries()
      )
    } as RouteLocation);

    const lang = consumeParam(
      QUERY_PARAMS.LOCALE,
      consumeParam(QUERY_PARAMS.LANG)
    );

    const preferredLocales: UpmindSupportedLocales[] = uniq(
      map(
        compact([
          lang,
          getFromStorage("i18n/locale"),
          window.navigator.language
        ]),
        code => code.replace("_", "-") as UpmindSupportedLocales
      )
    );

    return ensureLocale(preferredLocales);
  }

  function ensureLocale(preferredLocales: UpmindSupportedLocales[]): string {
    const { isSupportedLanguage, validateLanguage } = useBrand();

    let value: string | undefined;

    //  Ensure supported languages for the brand AND Upmind,
    //  there are some brand languages that are not supported by Upmind
    const langs = filter(UpmindSupportedLocales, isSupportedLanguage);

    /**
     * @desc Here we create an intersection to work out which of the preferred
     * locales are supported at a brand or Upmind level (depending on context),
     * when comparing the designator part (ISO 639-1) of the locale code (eg.
     * 'es' from 'es-MX') */

    if (isEmpty(langs)) {
      value = first(preferredLocales);
      return value ?? defaultLocale.value;
    } else {
      const localeIntersection = reduce(
        preferredLocales,
        (result: string[], code: UpmindSupportedLocales) => {
          const exactMatch = some(
            langs,
            supportedLocale =>
              supportedLocale?.toLocaleLowerCase() == code?.toLocaleLowerCase()
          );

          if (exactMatch) {
            result.push(code);
          } else {
            const designator = first(code.split("-"));
            const designatorMatch = some(
              langs,
              supportedLocale =>
                first(supportedLocale.split("-")) === designator
            );
            if (designator && designatorMatch) result.push(designator);
          }

          return uniq(result);
        },
        [] as string[]
      );

      // NB clear out any search params from in the url.

      /**
       * @desc Here we get the final localeCode, fully checking for Upmind level
       * support (including principal subdivisions) */
      value = first(localeIntersection);
    }

    return validateLanguage({ code: value })?.code ?? defaultLocale.value;
  }

  async function setLocale(code: string): Promise<string> {
    const validatedLocale = ensureLocale([code as UpmindSupportedLocales]);

    if (!validatedLocale)
      throw new DetailedError(
        t("error.locale_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless,
        { code }
      );

    setStorage("i18n/locale", validatedLocale);
    document.querySelector("html")?.setAttribute("lang", validatedLocale);
    locale.value = validatedLocale;
    return useI18n()
      .setLocale(validatedLocale)
      .then(() => validatedLocale);
  }

  // --- side effects

  // ---------------------------------------------------------------------------

  return {
    // --- state
    isReady: () => useBrand().isReady(),

    /**
     * Meta-information about the i18n state.
     * @type {Object} SystemI18nMeta
     * @property {boolean} isLoading - Indicates if the locale is currently loading.
     * @property {boolean} isAvailable - Indicates if there are supported locales available.
     * @property {boolean} hasLocale - Indicates if a locale is set.
     */
    meta,

    // --- context

    /**
     * The current locale (reactive).
     */
    locale: computed(() => locale.value),

    /**
     * The supported locales (reactive).
     */
    UpmindSupportedLocales,

    // --- methods

    /**
     * Sets the current locale asynchronously.
     * @param {string} newLocale - The new locale to set.
     * @returns {Promise<string | undefined>} Resolves with the new locale.
     */
    setLocale,

    /**
     * Sets the default locale based on all fallback logic.
     * @return {Promise<string>} Resolves with the default locale.
     */
    setDefaultLocale: async (value?: string) => {
      defaultLocale.value = value || defaultLocale.value;
      locale.value = getLocale();
      setStorage("i18n/locale", locale.value);
    },

    /** The list of supported languages, filtered by the brand's supported languages. */
    supportedLanguages
  };
};

/** The return type of {@link useLocale} composable. */
export type UseLocale = ReturnType<typeof useLocale>;
