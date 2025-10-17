// --- vue elements
export { default as UpmForm } from "./Form.vue";
export * from "./renderers";

// ---
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { get, has, isEmpty, isFunction, isString, trimStart } from "lodash-es";
import type { JsonFormsI18nState } from "@jsonforms/core";

// ---
export const useFormI18n = () => {
  const { t, tm, locale } = useI18n();

  return computed<JsonFormsI18nState>((): JsonFormsI18nState => {
    // Create a translator using vue-i18n's t function and the current locale

    const createTranslator =
      (_locale: string) => (key: string, defaultMessage: string, data: any) => {
        //Handle any validation errors first
        if (key.startsWith("validation.")) {
          const count = data?.[trimStart(key, "validation.")] ?? 0;
          // // Get the default error type translation base don the validation key and any count for pluralization
          let error: string | Record<string, any> | undefined = isFunction(t)
            ? t(key, { ...data, count })
            : undefined;

          // NB: Override the error if we have a specific i18n error message defined in the data object
          // If the data object contains an "i18n" property, attempt to retrieve a localized error message.
          // This property may be a string (overriding the default error message) or an object with specific messages keyed by validation error type.
          if (!isEmpty(data?.i18n) && isFunction(t)) {
            const errorOverride = tm(data.i18n)?.error;
            if (errorOverride) {
              error = isString(errorOverride)
                ? errorOverride
                : (get(errorOverride, key) ?? error); // fallback to the default error if specific one not found
            }
          }

          // Finally, return the error message if found, otherwise return the default message
          return isEmpty(error) || error == key ? defaultMessage : error;
        }

        //otherwise, try get the translation as an object for when the i18n key is nested
        let value: string | Record<string, any> | undefined = isFunction(tm)
          ? tm(key)
          : undefined;

        // then we fall back to a regular translation
        if (isEmpty(value) && isFunction(t)) value = t(key, data);
        // finally we fall back to the default message if no translation is found or the key is the same as the value
        return !value || value == key ? defaultMessage : value;
      };

    const safeLocale: string = locale.value;
    return {
      locale: safeLocale,
      translate: createTranslator(safeLocale),
      translateError: (error, translate, schema) =>
        translate(`validation.${error.keyword}`, error.message, schema)
    } as JsonFormsI18nState;
  });
};
