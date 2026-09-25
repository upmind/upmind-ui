// -----------------------------------------------------------------------------
/**
 * @module components/form
 * @description Re-exports the form host from `@upmind-automation/foundation`.
 */

export { Form as UpmForm } from "@upmind-automation/foundation";
export { useFormI18n } from "@upmind-automation/foundation";
export * from "./renderers";

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
