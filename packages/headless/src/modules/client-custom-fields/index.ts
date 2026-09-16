// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields
 * @description A client's own custom field definitions and values. This
 * module ships TWO scoped composables: the definitions collection
 * (`useClientCustomFields`) and the per-field IMAGE value editor
 * (`useClientCustomFieldImage`, wrapping `system-upload`).
 *
 * This barrel is the module's ONLY public surface — `client-custom-fields.services.ts`,
 * `client-custom-fields.mappers.ts` and `client-custom-fields.schemas.ts` each
 * carry a line-1 internal marker and are never imported directly by
 * another module. Curated named re-exports only; no `export *`.
 */

// --- Composables (collection + image editor)
export {
  useClientCustomFields,
  type UseClientCustomFields
} from "./useClientCustomFields";
export {
  useClientCustomFieldImage,
  type UseClientCustomFieldImage
} from "./useClientCustomFieldImage";

// --- Scope matrices — one per composable, both public
export {
  CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX,
  ClientCustomFieldsContextTypes,
  CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX,
  ClientCustomFieldContextTypes
} from "./client-custom-fields.types";
export type {
  ClientCustomFieldsScopeMatrix,
  ClientCustomFieldImageScopeMatrix
} from "./client-custom-fields.types";

// --- Public model types (shared by both composables — seam A-1/A-2)
export type {
  CustomField,
  CustomFieldModel,
  CustomFieldDisplay,
  CustomFieldImageContext
} from "./client-custom-fields.types";

// --- The value-semantics contract (seam A-3/A-4/A-5, R4 re-export)
export {
  useCustomFieldsSchema,
  useCustomFieldsUischema,
  useCustomFieldsModel
} from "./client-custom-fields.schemas";

// --- The value/mapping seam (A-6/A-7/A-8/A-9)
export {
  mapCustomField,
  mapCustomFieldValue,
  mapCustomFieldValues,
  mapCustomFieldValuesToRequest,
  resolveFieldByValue,
  mapCustomFieldDisplay
} from "./client-custom-fields.mappers";

// --- Sub-composable type exports for consumers (collection)
export type { UseClientCustomFieldsActions } from "./useClientCustomFields.actions";
export type { UseClientCustomFieldsContext } from "./useClientCustomFields.context";
export type { UseClientCustomFieldsMeta } from "./useClientCustomFields.meta";
export type { UseClientCustomFieldsInternals } from "./useClientCustomFields.internals";

// --- Sub-composable type exports for consumers (image editor)
export type { UseClientCustomFieldImageActions } from "./useClientCustomFieldImage.actions";
export type { UseClientCustomFieldImageContext } from "./useClientCustomFieldImage.context";
export type { UseClientCustomFieldImageMeta } from "./useClientCustomFieldImage.meta";
export type { UseClientCustomFieldImageInternals } from "./useClientCustomFieldImage.internals";
