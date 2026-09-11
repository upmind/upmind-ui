export { default as UpmForm } from "./Form.vue";
export * from "./renderers";
export * from "./useFormI18n";

// Form engine — a pass-through for @upmind/ui, which now hosts the JSONForms
// engine. Chrome + composables + types for consumers, under their old names.
export {
  FormField,
  FormControl,
  FormMessage,
  FormLabel,
  useUpmindUIRenderer,
  registerEntry,
  toSafeControlId
} from "@upmind/ui";
export type {
  FormProps,
  FormActionProps,
  FormActionsProps,
  FormAdditionalProps,
  FormFooterProps,
  FormMeta
} from "@upmind/ui";
