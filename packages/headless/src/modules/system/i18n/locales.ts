// ---utils
import { map, values, compact } from "lodash-es";
// -----------------------------------------------------------------------------

/**
 * WIPLocaleCodes are locale codes which we don't currently support from
 * a translation perspective, but do support when it comes to setting a default
 * currency code based on `navigator.language`.
 */

export enum WIPLocaleCodes {
  AF = "af", // Afrikaans
  AF_ZA = "af-ZA", // Afrikaans (South Africa)
  EN_AU = "en-AU", // English (Australia)
  EN_GB = "en-GB", // English (United Kingdom)
  EN_NZ = "en-NZ", // English (New Zealand)
  EN_ZA = "en-ZA", // English (South Africa)
  ES_CO = "es-CO", // Spanish (Colombia)
  ES_MX = "es-MX", // Spanish (Mexico)
  ZU = "zu", // Zulu
  ZU_ZA = "zu-ZA", // Zulu (South Africa)
}

export enum SupportedLocaleCodes {
  AZ = "az", // Azerbaijani
  BG = "bg", // Bulgarian
  CS = "cs", // Czech
  DA = "da", // Danish
  DE = "de", // German
  EL = "el", // Greek
  EN = "en", // English
  EN_US = "en-US", // English (US)
  ES = "es", // Spanish
  ES_419 = "es-419", // Latin American Spanish
  FR = "fr", // French
  FR_CA = "fr-CA", // Canadian French
  // HE= "he", // Hebrew
  ID = "id", // Indonesian
  IT = "it", // Italian
  // JA= "ja", // Japanese
  NB = "nb", // Norwegian Bokmål
  NL = "nl", // Dutch
  PL = "pl", // Polish
  PT = "pt", // Portuguese
  PT_BR = "pt-BR", // Brazilian Portuguese
  RO = "ro", // Romanian
  RU = "ru", // Russian
  SK = "sk", // Slovak
  SV = "sv", // Swedish
  TR = "tr", // Turkish
  UK = "uk", // Ukrainian
  UR = "ur", // Urdu
  ZH_TW = "zh-TW", // Chinese (Taiwan, Traditional)
}

/**
 * @name getSupportedLocaleCode
 * @desc This function checks native support for a given locale code. If
 * unsupported, it matches and checks the ISO-3166-2 country designator to give a
 * better fallback for regional variations – eg `es-CL (Spanish, Chile)` would
 * match and return the "es" locale. Failing that, "en" is returned as a default.
 * See: https://en.wikipedia.org/wiki/ISO_639-1 (Languages)
 * See: https://en.wikipedia.org/wiki/ISO_3166-2 (Principal Subdivisions)
 * @param {string} val Any ISO 639-1 code (with optional ISO 3166-2 designator)
 * @returns {SupportedLocaleCodes} An Upmind supported locale code
 **/

export function getSupportedLocaleCode(val: string) {
  // Enforce hyphenated format
  const localeCode = `${val}`.replace("_", "-");
  const supportedCodes = map(values(SupportedLocaleCodes), code =>
    code.toLowerCase()
  );
  /**
   * @desc If supported, return the locale code, forcing any designator part to
   * be uppercase. This is the required format for loading language packs (eg.
   * fr-CA).
   **/
  if (supportedCodes.includes(localeCode.toLowerCase())) {
    const parts = localeCode.split("-");
    return compact([parts?.[0], parts?.[1]?.toUpperCase()]).join("-");
  }
  // Construct regex to match language (ISO 639-1) and country (ISO 3166-2) designators
  const regex = new RegExp(`^([a-z]{2})(?:-|$)([a-z0-9]*)?$`, "i");
  // Run regex to return matched designators
  const [, country] = (localeCode.match(regex) as [string?, string?]) ?? [];
  // If supported, return country locale code
  if (country && supportedCodes.includes(country.toLowerCase())) return country;
  // Else, fallback to English (EN)
  return SupportedLocaleCodes.EN;
}

/**
 * @name getLocaleCountryCode
 * @desc This function maps ISO-639 Language Codes to ISO-3166 Country Codes.
 * See https://docs.oracle.com/cd/E13214_01/wli/docs92/xref/xqisocodes.html for
 * code tables
 * @param {string} code An 'ISO-639' language code
 * @returns {string} An 'ISO-3166' country code
 **/

export function getLocaleCountryCode(code: string) {
  switch (code) {
    case SupportedLocaleCodes.CS:
      return "cz"; // Czech Republic
    case SupportedLocaleCodes.DA:
      return "dk"; // Denmark
    case SupportedLocaleCodes.EL:
      return "gr"; // Greece
    case SupportedLocaleCodes.EN:
      return "gb"; // Great Britain
    case SupportedLocaleCodes.EN_US:
      return "us"; // USA
    case SupportedLocaleCodes.ES_419:
      return "es"; // Spain
    case SupportedLocaleCodes.FR_CA:
      return "ca"; // Canada
    case SupportedLocaleCodes.NB:
      return "no"; // Norway
    case SupportedLocaleCodes.PT_BR:
      return "br"; // Brazil
    case SupportedLocaleCodes.SV:
      return "se"; // Sweden
    case SupportedLocaleCodes.UK:
      return "ua"; // Ukraine
    case SupportedLocaleCodes.UR:
      return "pk"; // Pakistan
    case SupportedLocaleCodes.ZH_TW:
      return "tw"; // Taiwan, Province of China
    default:
      return code.toLowerCase();
  }
}
