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

// -----------------------------------------------------------------------------
// Per-action INPUT schemas (Task 33) — the coverage-gate map
// -----------------------------------------------------------------------------

/**
 * The input JSON Schema for an action whose only argument is an email id
 * (`remove`, `setDefault`, `verify`). An object schema rather than a bare
 * `{type:"string"}` because the harness's `isRealJsonSchema` guard accepts a
 * schema only when it is object-typed or carries `properties`.
 */
const idInputSchema: JsonSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: { id: { type: "string", title: "ID" } }
};

/**
 * Per-action INPUT schemas for the collection — the map `runGate` enumerates to
 * decide which actions are "input-taking" (ADR-027 Am.6): an action with an
 * entry takes input; one absent from the map does not, and absence is the whole
 * meaning of "not input-taking". Every entry is a real object JSON Schema so the
 * harness's `isRealJsonSchema` guard accepts it. Reached only through
 * `useClientEmails().useInternals().actionSchemas`; `runGate` is its sole
 * consumer.
 *
 * `ensure` takes an `EmailModel`, so its input schema IS the per-email form
 * schema. `remove`/`setDefault`/`verify` take an id.
 */
export function useActionInputSchemas(): Record<string, JsonSchema7> {
  return {
    ensure: useSchema(),
    remove: idInputSchema,
    setDefault: idInputSchema,
    verify: idInputSchema
  };
}
