// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/custom-fields-context
 * @description The brand's own questions, as a form. `client-custom-fields`'s
 * parsers emit a schema of the FIELDS and controls scoped at
 * `#/properties/customFields/properties/<code>`, so the fields compose UNDER a
 * `customFields` property of a parent schema — this is that parent, and the
 * wrapper is the caller's job in the real app too.
 *
 * The definitions and their answers are one row in the dataset
 * (`MockClientCustomField`), which is what keeps the schema and the model in
 * step: a question the brand stops asking takes its answer with it.
 */

import {
  useCustomFieldsModel,
  useCustomFieldsSchema,
  useCustomFieldsUischema
} from "../contracts/client-custom-fields.schemas";
import type { MockDataset } from "../types";
import type { JsonSchema7, VerticalLayout } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";
import type { CustomField } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

/** The i18n prefix the real consumers pass; absent translations fall back to the key. */
const CUSTOM_FIELDS_I18N_KEY = "fields";

function definitions(data: MockDataset): CustomField[] {
  return [...data.customFields];
}

/** The parent schema the field definitions hang under. */
export function customFieldsFormSchema(data: MockDataset): JsonSchema7 {
  return {
    type: "object",
    properties: {
      customFields: useCustomFieldsSchema(definitions(data))
    }
  };
}

/** The controls, at the scopes the parser emits. */
export function customFieldsFormUischema(data: MockDataset): VerticalLayout {
  return {
    type: "VerticalLayout",
    elements: useCustomFieldsUischema(definitions(data), CUSTOM_FIELDS_I18N_KEY)
  };
}

/** The answers on file, under the same branch the controls are scoped to. */
export function customFieldsFormModel(data: MockDataset): FormModel {
  return { customFields: useCustomFieldsModel(definitions(data)) };
}
