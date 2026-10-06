/** @internal */
// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import type { ScopeActorTypes } from "../scope";
import type { ModuleContext, ModuleSchemas } from "./module.types";
import type { JsonSchema, JsonSchema7, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module module/module.schemas
 * @description Module schema and uischema parsers, and the per-actor parser
 * map the machine reads.
 */

function useSchemaDefinitions(): JsonSchema7["definitions"] {
  return {
    id: { type: "string", readOnly: true, default: "" },
    name: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" }
  };
}

export const useModuleSchemaParser = (): JsonSchema7 => ({
  type: "object",
  title: "text.module_title",
  definitions: useSchemaDefinitions(),
  properties: {
    id: { $ref: "#/definitions/id" },
    name: { $ref: "#/definitions/name" },
    email: { $ref: "#/definitions/email" }
  },
  required: ["name"]
});

// Keyed by field so an actor arm can reuse one control and replace another.
function useUischemaDefinitions() {
  return {
    name: {
      type: "Control",
      scope: "#/properties/name",
      i18n: "form.module_name"
    },
    email: {
      type: "Control",
      scope: "#/properties/email",
      i18n: "form.module_email"
    }
  };
}

export const useModuleUischemaParser = (): UISchemaElement => {
  const controls = useUischemaDefinitions();

  return {
    type: "VerticalLayout",
    elements: [controls.name, controls.email]
  } as UISchemaElement;
};
// -----------------------------------------------------------------------------
function scopedSchemas(scopeActor: ScopeActorTypes): Partial<ModuleSchemas> {
  switch (scopeActor) {
    default:
      return {};
  }
}

export const moduleSchemas = {
  useModuleSchemaParser: ({ scopeActor }: ModuleContext): JsonSchema =>
    scopedSchemas(scopeActor as ScopeActorTypes).useModuleSchemaParser?.() ??
    useModuleSchemaParser(),

  useModuleUischemaParser: ({ scopeActor }: ModuleContext): UISchemaElement =>
    scopedSchemas(scopeActor as ScopeActorTypes).useModuleUischemaParser?.() ??
    useModuleUischemaParser()
};

export default moduleSchemas;
