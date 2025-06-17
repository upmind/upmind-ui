// --- internal
import { DetailedError, responseCodes } from "../../../utils";
import { useBrand } from "../../brand";
import { SupportedLocaleCodes } from "./locales";

// --- utils
import { useLocalStorage } from "../../../utils";
import {
  uniq,
  map,
  compact,
  isEmpty,
  first,
  reduce,
  some,
  isNil,
} from "lodash-es";
import { computed, readonly, ref } from "vue";

// --- types
import { QUERY_PARAMS } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export const useLocale = (defaultLocale: string = "en") => {
  const {
    validateLanguage,
    // languages: supportedLocales,
    isReady: brandIsReady,
  } = useBrand();
  const { get, set } = useLocalStorage();

  // --- state
  const loading = ref<boolean>(true);
  const locale = ref<string>(defaultLocale);
  // immediately check if the brand is ready and set the locale

  async function isReady(): Promise<boolean> {
    return brandIsReady().then(() => {
      loading.value = false;
      const hasLocale = !isNil(locale.value);
      return hasLocale;
    });
  }

  const meta = computed(() => ({
    isLoading: loading.value,
    isAvailable: !isEmpty(SupportedLocaleCodes),
    hasLocale: !isEmpty(locale.value),
  }));

  // --- context

  // --- methods

  function getLocale(): string {
    // to set locale we do a few things:
    // 2. if not, check if we have any url params and use that if it is valid/supported by the brand
    // 2. if not, check if we have a stored locale
    // 3. if not, check if we have a preferred locale from the browser, and that it is supported by the brand
    // 4. if not, default to "null" (which will be handled by the API)

    const searchParams = new URLSearchParams(window.location?.search);
    const preferredLocales: SupportedLocaleCodes[] = uniq(
      map(
        compact([
          searchParams.get(QUERY_PARAMS.LOCALE),
          searchParams.get(QUERY_PARAMS.LANG),
          get("i18n/locale"),
          window.navigator.language,
        ]),
        code => code.replace("_", "-") as SupportedLocaleCodes
      )
    );

    /**
     * @desc Here we create an intersection to work out which of the preferred
     * locales are supported at a brand or Upmind level (depending on context),
     * when comparing the designator part (ISO 639-1) of the locale code (eg.
     * 'es' from 'es-MX') */

    //  if we don't have a brand languages, we can't get the locale
    if (isEmpty(SupportedLocaleCodes)) {
      return first(preferredLocales) ?? defaultLocale;
    }

    const localeIntersection = reduce(
      preferredLocales,
      (result: string[], code: SupportedLocaleCodes) => {
        const exactMatch = some(
          SupportedLocaleCodes,
          language => language.toLocaleLowerCase() == code.toLocaleLowerCase()
        );
        if (exactMatch) {
          result.push(code);
        } else {
          const designator = first(code.split("-"));
          const designatorMatch = some(
            SupportedLocaleCodes,
            language => first(language.split("-")) === designator
          );
          if (designator && designatorMatch) result.push(designator);
        }
        return result;
      },
      [] as string[]
    );

    /**
     * @desc Here we get the final localeCode, fully checking for Upmind level
     * support (including principal subdivisions) */
    return first(localeIntersection) ?? defaultLocale;
  }

  async function setDefaultLocale(): Promise<string> {
    const currentLocale = getLocale();

    // /**
    //  * @desc Here we silently clean 'locale' and 'lang' params from the URL
    //  * in case any were passed from an external source. */

    // const cleanedUrl = new URL(window.location?.href);
    // cleanedUrl.searchParams.delete(QUERY_PARAMS.LOCALE);
    // cleanedUrl.searchParams.delete(QUERY_PARAMS.LANG);
    // window.history.replaceState("", "", cleanedUrl);

    return setLocale(currentLocale);
  }

  async function setLocale(code: string): Promise<string> {
    await isReady();
    const validatedLocale = await validateLanguage({ code });

    // Switch i18n locale
    return new Promise((resolve, reject) => {
      if (validatedLocale?.code) {
        set("i18n/locale", validatedLocale.code);
        locale.value = validatedLocale.code;
        return resolve(validatedLocale.code);
      }
      return reject(
        new DetailedError("No valid locale found", responseCodes.Not_Found, {
          code,
        })
      );
    });
  }

  // ---------------------------------------------------------------------------

  return {
    // --- state

    /**
     * Checks if the i18n system is ready.
     * @returns {Promise<boolean>} Resolves true if ready.
     */
    isReady,

    /**
     * Meta information about the i18n state.
     * @typedef {Object} SystemI18nMeta
     * @property {boolean} isLoading - Indicates if the locale is currently loading.
     * @property {boolean} isAvailable - Indicates if there are supported locales available.
     * @property {boolean} hasLocale - Indicates if a locale is set.
     */
    meta,

    // --- context

    /**
     * The current locale (reactive).
     */
    locale: readonly(locale),

    /**
     * The supported locales (reactive).
     */
    SupportedLocaleCodes,

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
    setDefaultLocale,
  };
};

/**
 * The return type of useSystem composable.
 */
export type useLocale = ReturnType<typeof useLocale>;
