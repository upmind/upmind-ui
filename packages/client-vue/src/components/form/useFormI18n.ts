// --- vue elements
export { default as UpmForm } from "./Form.vue";
export * from "./renderers";

// ---
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { isFunction, trimStart } from "lodash-es";
import type { JsonFormsI18nState } from "@jsonforms/core";

// ---
export const useFormI18n = () => {
  const { t, locale } = useI18n();

  return computed<JsonFormsI18nState>((): JsonFormsI18nState => {
    // Create a translator using vue-i18n's t function and the current locale

    const createTranslator =
      (_locale: string) => (key: string, defaultMessage: string, data: any) => {
        const count = data?.[trimStart(key, "validation.")] ?? 0;
        // well try get the translation as an object for when the i18n key is nested
        let value: string | Record<string, any> | undefined = isFunction(t)
          ? t(key, { ...data, count })
          : undefined;

        // finally, we fall back to the default message if no translation is found or the key is the same as the value
        value = !value || value == key ? defaultMessage : value;
        return value;
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
