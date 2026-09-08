/**
 * @module foundation/forms
 * @description The form-host wrapper ADR 023 §2 assigns to this layer: it hands
 * `ui`'s engine the app's glyph, reference data, ajv instance and i18n, and
 * takes its Upmind-domain renderers from the §7 socket rather than an import.
 */

export { default as Form } from "./Form.vue";
export { default as FormModal } from "./FormModal.vue";
export { useFormI18n } from "./useFormI18n";
export type { FormI18n } from "./useFormI18n.types";
export type { FormModalProps } from "./types";
