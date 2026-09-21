// -----------------------------------------------------------------------------
/**
 * @module components/form
 * @description The form host moved down to `@upmind-automation/foundation` in
 * the ADR 023 cut, where it reads its Upmind-domain renderers from the §7
 * socket instead of importing them. `formRenderers` below is the set a host
 * provides into that socket at boot.
 */

export { Form as UpmForm } from "@upmind-automation/foundation";
export { useFormI18n } from "@upmind-automation/foundation";
export type { FormI18n } from "@upmind-automation/foundation";
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
