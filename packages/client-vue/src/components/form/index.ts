// --- vue elements
export { default as UpmForm } from "./Form.vue";
export * from "./renderers";

// ---
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { isFunction } from "lodash-es";
import type { JsonFormsI18nState } from "@jsonforms/core";

// ---
export const useFormI18n = () => {
  const { tm, locale } = useI18n();

  const i18n = computed<JsonFormsI18nState>((): JsonFormsI18nState => {
    // Create a translator using vue-i18n's t function and the current locale

    const createTranslator =
      (_locale: string) => (key: string, defaultMessage: string, data: any) => {
        const value = isFunction(tm) ? tm(key) : null;
        debugger;
        return !value || value == key ? defaultMessage : value;
      };

    const safeLocale: string = locale.value;
    return {
      locale: safeLocale,
      translate: createTranslator(safeLocale),
    } as JsonFormsI18nState;
  });

  return i18n;
};
