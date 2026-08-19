/** @internal */
import {
  useFieldsModelParser,
  useFieldsSchemaParser,
  useFieldsUischemaParser
} from "../../utils";
import type {
  CustomField,
  CustomFieldModel
} from "./client-custom-fields.types";
import type { JsonSchema7, ControlElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/client-custom-fields.schemas
 * @description A's contract-ownership-by-RE-EXPORT seam (R4). The three
 * shared field parsers stay at `utils/useFields.ts` — imported there by
 * `auth/auth.schemas.register.ts` and `basket-fields/basket-fields.utils.ts`,
 * both out of this run's scope — and this module takes ownership of the
 * CONTRACT by re-exporting them under its own names (seam A-3/A-4/A-5).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientCustomFields.ts` / the barrel only.
 */

/** Re-export of `useFieldsSchemaParser` (seam A-3). */
export const useCustomFieldsSchema = (fields?: CustomField[]): JsonSchema7 =>
  useFieldsSchemaParser(fields);

/** Re-export of `useFieldsUischemaParser` (seam A-4). */
export const useCustomFieldsUischema = (
  fields?: CustomField[],
  i18nKey?: string
): ControlElement[] => useFieldsUischemaParser(fields, i18nKey);

/** Re-export of `useFieldsModelParser` (seam A-5). */
export const useCustomFieldsModel = (
  fields: CustomField[],
  values?: CustomFieldModel
): CustomFieldModel => useFieldsModelParser(fields, values);
