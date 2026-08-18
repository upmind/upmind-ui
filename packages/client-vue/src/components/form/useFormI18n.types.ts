// -----------------------------------------------------------------------------
/**
 * @module components/form/useFormI18n.types
 * @description The engine i18n state as `useFormI18n` actually returns it.
 */

import type {
  ErrorTranslator,
  JsonFormsI18nState,
  Translator
} from "@jsonforms/core";

// -----------------------------------------------------------------------------

/**
 * `JsonFormsI18nState` with both translators made REQUIRED. The engine types
 * them optional; this implementation always provides them, and without the
 * narrowing every consumer restates the missing-key degrade with `?.` and its
 * own `?? key`. Still assignable to `JsonFormsI18nState`, so `Form.vue`'s
 * `:i18n` binding is unaffected.
 */
export type FormI18n = JsonFormsI18nState & {
  translate: Translator;
  translateError: ErrorTranslator;
};
