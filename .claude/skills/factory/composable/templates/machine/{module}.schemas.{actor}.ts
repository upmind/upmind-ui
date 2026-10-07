/** @internal */
// TEMPLATE FILE — scaffold only when this actor earns a schemas arm (ARMS.md).
import {
  useModuleSchemaParser as useSharedSchemaParser,
  useModuleUischemaParser as useSharedUischemaParser
} from "./module.schemas";
import { find } from "lodash-es";
import type { ModuleSchemas } from "./module.types";
import type { JsonSchema7, Layout, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module module/module.schemas.client
 * @description Client-specific module schema parsers.
 */

const useSharedControl = (scope: string) =>
  find((useSharedUischemaParser() as Layout).elements, {
    scope
  }) as UISchemaElement;

export const useClientModuleRegisterSchemaParser = (): JsonSchema7 => ({
  type: "object",
  title: "text.module_client_register_title",
  definitions: useSharedSchemaParser().definitions,
  properties: {
    email: { $ref: "#/definitions/email" },
    acceptedTerms: { type: "boolean" },
    referralCode: { type: "string" }
  },
  required: ["email", "acceptedTerms"]
});

// The client sets its own `id`, so this arm makes it writable and required.
export const useModuleSchemaParser = (): JsonSchema7 => ({
  type: "object",
  title: "text.module_title",
  definitions: useSharedSchemaParser().definitions,
  properties: {
    id: { type: "string", minLength: 6 },
    name: { type: "string", minLength: 3 },
    email: { $ref: "#/definitions/email" },
    phone: { type: "string" }
  },
  required: ["id", "name", "phone"]
});

export const useModuleUischemaParser = (): UISchemaElement =>
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
export function createClientModuleSchemas(): Partial<ModuleSchemas> {
  return {
    useModuleSchemaParser,
    useModuleUischemaParser
  };
}
