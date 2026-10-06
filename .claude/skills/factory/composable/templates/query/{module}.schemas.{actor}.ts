/** @internal */
// TEMPLATE FILE — scaffold only when this actor earns a schemas arm (ARMS.md).
import {
  useSchema as useSharedSchema,
  useUischema as useSharedUischema
} from "./module.schemas";
import { find } from "lodash-es";
import type { JsonSchema7, Layout, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module module/module.schemas.client
 * @description Client-specific module schemas.
 */

const useSharedControl = (scope: string) =>
  find((useSharedUischema() as Layout).elements, { scope }) as UISchemaElement;

export const useClientRegisterSchema = (): JsonSchema7 => ({
  type: "object",
  title: "text.module_client_register_title",
  definitions: useSharedSchema().definitions,
  properties: {
    email: { $ref: "#/definitions/email" },
    acceptedTerms: { type: "boolean" },
    referralCode: { type: "string" }
  },
  required: ["email", "acceptedTerms"]
});

// The client sets its own `id`, so this arm makes it writable and required.
export const useSchema = (): JsonSchema7 => ({
  type: "object",
  title: "text.module_title",
  definitions: useSharedSchema().definitions,
  properties: {
    id: { type: "string", minLength: 6 },
    name: { type: "string", minLength: 3 },
    email: { $ref: "#/definitions/email" },
    phone: { type: "string" }
  },
  required: ["id", "name", "phone"]
});

export const useUischema = (): UISchemaElement =>
  ({
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/id",
        i18n: "form.module_client_reference"
      },
      {
        type: "Control",
        scope: "#/properties/name",
        i18n: "form.module_name",
        options: { focus: true }
      },
      useSharedControl("#/properties/email"),
      {
        type: "Control",
        scope: "#/properties/phone",
        i18n: "form.module_phone"
      }
    ]
  }) as UISchemaElement;
// -----------------------------------------------------------------------------
export function createClientModuleSchemas() {
  return {
    useSchema,
    useUischema
  };
}
