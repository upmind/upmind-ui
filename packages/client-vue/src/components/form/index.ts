// -----------------------------------------------------------------------------
/**
 * @module components/form
 * @description The form renderers and the `@upmind/ui` form-engine pass-through.
 */

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
