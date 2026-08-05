/** @internal */
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-email/client-email.schemas
 * @description Schema / uischema for the per-email form. They move as a PAIR:
 * a schema field with no control renders a required-but-invisible input.
 *
 * WARNING: Do not import directly. The manager's machine config adopts this
 * pair (`setSchemas`) and consumers read it off
 * `useClientEmailManager().useContext().schema` / `.uischema` — the barrel
 * exports neither, because a form rendered from a schema the machine has not
 * adopted validates against a different contract than the one that saves.
 */

/** Reusable field definitions the schema `$ref`s. */
export function useSchemaDefinitions(): JsonSchema7["definitions"] {
  return {
    id: {
      type: ["string", "null"],
      title: "ID",
      description: "The auto-generated ID of this email.",
      readOnly: true
    },
    email: {
      type: "string",
      format: "email",
      title: "Email"
    }
  };
}

export const useSchema = (): JsonSchema7 => {
  return {
    type: "object",
    title: "Email",
    required: ["email"],
    definitions: useSchemaDefinitions(),
    properties: {
      id: { $ref: "#/definitions/id" },
      email: { $ref: "#/definitions/email" }
    }
  };
};

/** Reusable control definitions — the uischema counterpart of the above. */
export function useUischemaDefinitions() {
  return {
    id: {
      type: "Control",
      scope: "#/properties/id",
      // Force-hidden: without the rule the auto-generated id renders in the
      // email field's place.
      rule: {
        effect: "HIDE",
        condition: { const: true }
      }
    },
    email: {
      type: "Control",
      scope: "#/properties/email",
      i18n: "form.email",
      options: {
        autoFocus: true,
        autocomplete: "email",
        placeholder: "name@email.com"
      }
    }
  };
}

export const useUischema = (): UISchemaElement => {
  const controls = useUischemaDefinitions();

  return {
    type: "VerticalLayout",
    elements: [controls.id, controls.email]
  } as UISchemaElement;
};
