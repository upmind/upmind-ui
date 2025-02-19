// --- vue elements
export { default as UpmForm } from "./Form.vue";
export * from "./renderers";

// ---
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { isEmpty, isFunction } from "lodash-es";
import type { JsonFormsI18nState } from "@jsonforms/core";

// ---
export const useFormI18n = () => {
  const { tm, t, locale } = useI18n();

  const i18n = computed<JsonFormsI18nState>((): JsonFormsI18nState => {
    // Create a translator using vue-i18n's t function and the current locale

    const createTranslator =
      (_locale: string) => (key: string, defaultMessage: string, data: any) => {
        // well try get the translation as an object for when the i18n key is nested
        let value: string | Record<string, any> | undefined = isFunction(tm)
          ? tm(key)
          : undefined;
        // then we fall back to a regular translation
        if (isEmpty(value) && isFunction(t)) value = t(key, data);
        // finally we fall back to the default message if no translation is found or the key is the same as the value
        value = !value || value == key ? defaultMessage : value;
        return value;
      };

    const safeLocale: string = locale.value;
    return {
      locale: safeLocale,
      translate: createTranslator(safeLocale),
    } as JsonFormsI18nState;
  });

  return i18n;
};
