// --- internal
import { DetailedError, responseCodes } from "../../../utils";
import { useBrand } from "../../brand";
import type { SupportedLocaleCodes } from "./locales";

// --- utils
import { useLocalStorage } from "../../../utils";

import { uniq, map, compact, isEmpty, first, reduce, some } from "lodash-es";

// --- types
import { QUERY_PARAMS } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export const useSystemI18n = () => {
  const { validateLanguage, getLanguages, isReady } = useBrand();
  const { get, set } = useLocalStorage();

  function getLocale(): string | undefined {
    //  if we don't have a brand languages, we can't get the locale
    const languages = getLanguages();
    if (isEmpty(languages)) return get("i18n/locale");

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

    const localeIntersection = reduce(
      preferredLocales,
      (result: string[], code: SupportedLocaleCodes) => {
        const exactMatch = some(
          languages,
          language =>
            language.code.toLocaleLowerCase() == code.toLocaleLowerCase()
        );
        if (exactMatch) {
          result.push(code);
        } else {
          const designator = first(code.split("-"));
          const designatorMatch = some(
            languages,
            language => first(language.code.split("-")) === designator
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

    return first(localeIntersection);
  }

  async function setDefaultLocale(): Promise<string> {
    await isReady();
    const locale = getLocale();
    // /**
    //  * @desc Here we silently clean 'locale' and 'lang' params from the URL
    //  * in case any were passed from an external source. */

    // const cleanedUrl = new URL(window.location?.href);
    // cleanedUrl.searchParams.delete(QUERY_PARAMS.LOCALE);
    // cleanedUrl.searchParams.delete(QUERY_PARAMS.LANG);
    // window.history.replaceState("", "", cleanedUrl);

    if (!locale) {
      return Promise.reject(
        new DetailedError("No valid locale found", responseCodes.Not_Found, {
          locale,
        })
      );
    }

    return setLocale(locale);
  }

  async function setLocale(code: string): Promise<string> {
    await isReady();
    const locale = await validateLanguage({ code });
    // Switch i18n locale
    return new Promise((resolve, reject) => {
      if (locale?.code) {
        set("i18n/locale", locale.code);
        return resolve(locale.code);
      }
      return reject(
        new DetailedError("No valid locale found", responseCodes.Not_Found, {
          code,
        })
      );
    });
  }

  return {
    isReady,
    getLocale,
    setDefaultLocale,
    setLocale,
    getSupportedlocales: getLanguages,
  };
};
