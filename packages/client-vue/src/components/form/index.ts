export { default as UpmForm } from "./Form.vue";
export * from "./renderers";
export * from "./useFormI18n";

// Form engine — the canonical client-vue source now the JSONForms host lives in
// ./engine (off the old lib). Chrome + composables + types for consumers.
export { default as FormField } from "./engine/FormField.vue";
export { default as FormControl } from "./engine/FormControl.vue";
export { default as FormMessage } from "./engine/FormMessage.vue";
export { default as FormLabel } from "./engine/FormLabel.vue";
export {
  useUpmindUIRenderer,
  registerEntry,
  toSafeControlId
} from "./engine/renderers/utils";
export type {
  FormProps,
  FormActionProps,
  FormActionsProps,
  FormAdditionalProps,
  FormFooterProps,
  FormMeta
} from "./engine/types";
