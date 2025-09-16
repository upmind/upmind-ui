// --- external
import { createAjv, type JsonSchema } from "@jsonforms/core";
import Ajv from "ajv";

import localize from "ajv-i18n";
import ajvErrors from "ajv-errors";

// --- internal

// --- utils

// --- types
import type { ErrorObject } from "ajv";

const AJV_LOCALE_MAP: Record<string, keyof typeof localize> = {
  // Your locale -> AJV i18n locale
  de: "de",
  en: "en",
  es: "es",
  fr: "fr",
  it: "it",
  pt: "pt-BR", // Map Portuguese to Brazilian Portuguese
  ru: "ru"
};

/**
 * Maps your application locales to AJV i18n supported locales
 * @param locale Your application locale (e.g., 'pt', 'en', 'de')
 * @returns AJV i18n compatible locale (e.g., 'pt-BR', 'en', 'de')
 * @see https://github.com/ajv-validator/ajv-i18n/blob/master/messages/index.js for supported locales
 */
export const mapToAjvLocale = (locale: string): keyof typeof localize => {
  return AJV_LOCALE_MAP[locale] ?? locale ?? "en"; // if our mapper does not support the given locale, we assume it is an ajv-i18n compatible locale
};

// -----------------------------------------------------------------------------

export const useValidation = (ajv?: Ajv, currentLocale = "en") => {
  // use JSON Forms version of AJV as it has formats and other keywords already

  const initial = !ajv;
  const ajvInstance =
    ajv ??
    createAjv({
      useDefaults: true,
      verbose: false,
      allErrors: true
    });

  if (initial) {
    ajvErrors(ajvInstance, {
      keepErrors: false,
      singleError: true
    });
  }

  return {
    ajv: ajvInstance,
    validate: (
      schema: JsonSchema,
      data: Record<string, any>
    ): ErrorObject[] => {
      const validate = ajvInstance.compile(schema);
      const valid = validate(data);
      if (!valid) {
        localize[mapToAjvLocale(currentLocale)](validate.errors);
        return validate.errors ?? [];
      }
      return [];
    }
  };
};
