// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/contract-product-provisioning.schemas
 * @description The setup blueprint as a form — legacy's
 * `cProdProvConfigManageForm`, which asked one control per field the provider
 * wants answered and confirmed them all in one step. Fields the provider
 * merely reports carry no `type` and are never asked.
 */

import { BlueprintFieldsTypes } from "@upmind-automation/types";
import { assign, filter, fromPairs, map } from "lodash-es";
import type { MockProvisionField } from "../types";
import type { JsonSchema7, VerticalLayout } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

/** The fields the blueprint asks for, in the provider's order. */
export function setupFields(
  fields: readonly MockProvisionField[]
): MockProvisionField[] {
  return filter(fields, field => field.type !== undefined);
}

/** How one field is typed — the provider's blueprint type, in the parser's own cases. */
function fieldTyping(field: MockProvisionField): JsonSchema7 {
  switch (field.type) {
    case BlueprintFieldsTypes.INPUT_NUMBER:
      return { type: "number" };
    case BlueprintFieldsTypes.CHECKBOX:
      return { type: "boolean" };
    case BlueprintFieldsTypes.INPUT_DATE:
    case BlueprintFieldsTypes.INPUT_DATETIME:
      return { type: "string", format: "date-time" };
    case BlueprintFieldsTypes.INPUT_TEL:
      return { type: "string", format: "phone" };
    case BlueprintFieldsTypes.INPUT_PASSWORD:
      return { type: "string", format: "password" };
    default:
      break;
  }
  if (field.options !== undefined) {
    return {
      type: "string",
      oneOf: map(field.options, option => ({
        const: option.value,
        title: option.label
      }))
    };
  }
  if (field.secret === true) return { type: "string", format: "password" };
  // `required` alone admits an empty answer; the provider will not.
  if (field.required === true) return { type: "string", minLength: 1 };
  return { type: "string" };
}

function fieldSchema(field: MockProvisionField): JsonSchema7 {
  return assign({ title: field.label }, fieldTyping(field));
}

/** Schema for the setup form — every asked field, the required ones named. */
export const useSetupSchema = (
  fields: readonly MockProvisionField[]
): JsonSchema7 => {
  const asked = setupFields(fields);
  return {
    type: "object",
    required: map(filter(asked, "required"), "code"),
    properties: fromPairs(map(asked, field => [field.code, fieldSchema(field)]))
  };
};

/** UI schema for the setup form — one control per asked field. */
export const useSetupUischema = (
  fields: readonly MockProvisionField[]
): VerticalLayout => ({
  type: "VerticalLayout",
  elements: map(setupFields(fields), field => ({
    type: "Control",
    scope: `#/properties/${field.code}`
  }))
});

/** What the setup form opens on — the provider's values as they stand. */
export const setupDefaults = (
  fields: readonly MockProvisionField[]
): FormModel =>
  fromPairs(map(setupFields(fields), field => [field.code, field.value]));
