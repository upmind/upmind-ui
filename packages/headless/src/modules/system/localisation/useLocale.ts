// --- external
import { computed, ref } from "vue";

// --- internal
import { useI18n } from "./useI18n";
import { useBrand } from "../../brand";
import { useSession } from "../../session";
import { useRouteQueryParams } from "../../routing";
import { SupportedLocaleCodes } from "./locales";

// --- utils
import {
  uniq,
  map,
  compact,
  isEmpty,
  first,
  reduce,
  some,
  isNil
} from "lodash-es";
import { useLocalStorage } from "../../../utils";
import { DetailedError, ErrorOrigin, responseCodes } from "../../../utils";

// --- types
import { QUERY_PARAMS } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const defaultLocale = ref<string>("en");
const locale = ref<string>("");

export const useLocale = () => {
  const { t } = useI18n();
  const { get: getFromStorage, set: setStorage } = useLocalStorage();
  const { meta: sessionMeta } = useSession();

  // --- state
  const loading = ref<boolean>(true);

  async function isReady(): Promise<boolean> {
    const { isReady: brandIsReady } = useBrand();
    return brandIsReady().then(() => {
      loading.value = false;
      return !isNil(locale.value);
    });
  }

  // NB: you can only change locales when not authenticated!
  //     this is because the locale is tied to the account's preferred language
  //     and changing it while authenticated could lead to unwanted side effects
  const meta = computed(() => ({
    isLoading: loading.value || sessionMeta.value.isLoading,
    isAvailable:
      !isEmpty(SupportedLocaleCodes) && !sessionMeta.value.isAuthenticated,
    hasLocale: !isEmpty(locale.value)
  }));

  // --- context

  // --- methods

  function getLocale(): string {
    // to set locale we do a few things:
    // 2. if not, check if we have any url params and use that if it is valid/supported by the brand
    // 2. if not, check if we have a stored locale
    // 3. if not, check if we have a preferred locale from the browser, and that it is supported by the brand
    // 4. if not, default to "null" (which will be handled by the API)
    const { consumeParam } = useRouteQueryParams({
      query: Object.fromEntries(
        new URLSearchParams(window.location?.search).entries()
      )
    });

    const lang = consumeParam(
      QUERY_PARAMS.LOCALE,
      consumeParam(QUERY_PARAMS.LANG)
    );

    const preferredLocales: SupportedLocaleCodes[] = uniq(
      map(
        compact([
          lang,
          getFromStorage("i18n/locale"),
          window.navigator.language
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
      return first(preferredLocales) ?? defaultLocale.value;
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

    // NB clear out any search params from nthe url.

    /**
     * @desc Here we get the final localeCode, fully checking for Upmind level
     * support (including principal subdivisions) */
    return first(localeIntersection) ?? defaultLocale.value;
  }

  async function setLocale(code: string): Promise<string> {
    await isReady();
    const { validateLanguage } = useBrand();
    const validatedLocale = await validateLanguage({ code });
    // Switch i18n locale
    return new Promise((resolve, reject) => {
      if (validatedLocale?.code) {
        setStorage("i18n/locale", validatedLocale.code);
        useI18n().setLocale(validatedLocale.code);
        document
          .querySelector("html")
          ?.setAttribute("lang", validatedLocale.code);
        locale.value = validatedLocale.code;

        return resolve(validatedLocale.code);
      }
      return reject(
        new DetailedError(
          t("error.locale_not_available"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless,
          { code }
        )
      );
    });
  }

  // --- side effects

  // ---------------------------------------------------------------------------

  return {
    // --- state

    /**
     * Checks if the i18n system is ready.
     * @returns {Promise<boolean>} Resolves true if ready.
     */
    isReady,

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
    setDefaultLocale: async (value: string) => {
      await isReady();
      defaultLocale.value = value || defaultLocale.value;
      locale.value = getLocale();
    }
  };
};

/**
 * The return type of useSystem composable.
 */
export type useLocale = ReturnType<typeof useLocale>;
