import RandExp from "randexp";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useValidationTranslator } from "@upmind-automation/headless";
import { isEmpty, isFunction, trimStart } from "lodash-es";
import type { FormI18n } from "./useFormI18n.types";
import type { Translator } from "@jsonforms/core";

export type { FormI18n } from "./useFormI18n.types";

// -----------------------------------------------------------------------------

/** Interpolation data, and the shape a nested key answers with. */
type TranslateValues = Record<string, any>;

/**
 * The engine's own translator, as a plain library function. Read
 * `i18n.value.translate` INSIDE a computed or a render expression: destructuring
 * it at setup top level captures the locale that was live at setup, so a locale
 * switch silently stops re-labelling.
 */
export const useFormI18n = () => {
  const { t, tm, locale } = useI18n();

  return computed<FormI18n>((): FormI18n => {
    // Create a translator using vue-i18n's t function and the current locale

    const createTranslator = (_locale: string): Translator => {
      // Declared as an overload set, not one arrow: the engine's `Translator` is
      // overloaded on `defaultMessage`, and the IMPLEMENTATION answers wider than
      // either signature. A key naming a nested branch answers with that branch's
      // whole object, which `ui`'s Form merges into the control's options — that
      // is how a control's placeholder and hint copy reach it at all.
      function translate(
        key: string,
        defaultMessage: string,
        data?: TranslateValues
      ): string;
      function translate(
        key: string,
        defaultMessage?: string,
        data?: TranslateValues
      ): string | undefined;
      function translate(
        key: string,
        defaultMessage?: string,
        data?: TranslateValues
      ): string | TranslateValues | undefined {
        // No key names no message: `tm("")` answers with the WHOLE locale object,
        // which would ship as the translation.
        if (isEmpty(key)) return defaultMessage;

        // Handle any validation errors using the shared headless translator
        if (key.startsWith("validation.")) {
          const validationKey = trimStart(key, "validation.");

          // Handle pattern errors: show a human-readable example instead of the raw regex
          if (validationKey === "pattern" && data?.pattern) {
            try {
              const randexp = new RandExp(data.pattern);
              randexp.randInt = (from: number) => from;
              data = { ...data, pattern: randexp.gen() };
            } catch {
              // fallback: keep raw pattern if regex parsing fails
            }
          }

          return useValidationTranslator(key, defaultMessage ?? "", data ?? {});
        }

        //otherwise, try get the translation as an object for when the i18n key is nested
        let value: string | TranslateValues | undefined = isFunction(tm)
          ? tm(key)
          : undefined;

        // then we fall back to a regular translation
        if (isEmpty(value) && isFunction(t)) value = t(key, data ?? {});
        // finally we fall back to the default message if no translation is found or the key is the same as the value
        return !value || value == key ? defaultMessage : value;
      }

      return translate;
    };

    const safeLocale: string = locale.value;
    return {
      locale: safeLocale,
      translate: createTranslator(safeLocale),
      // ajv leaves `message` optional; the engine's ErrorTranslator promises a
      // string, so the absent case takes the empty default it already rendered.
      translateError: (error, translate, schema) =>
        translate(`validation.${error.keyword}`, error.message ?? "", schema)
    };
  });
};
