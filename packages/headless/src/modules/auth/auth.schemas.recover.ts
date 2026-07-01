/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/schemas.recover
 * @description Password recovery form schemas.
 * Used for initiating password reset requests.
 */

import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
/**
 * JSON Schema for the password recovery form.
 */
export const useRecoverSchema = (): JsonSchema => ({
  type: "object",
  title: "Send reset",
  required: ["username"],
  properties: {
    username: {
      type: "string",
      title: "Your username or email address"
    }
  }
});

/**
 * UI Schema for the password recovery form.
 */
export const useRecoverUischema = (): UISchemaElement => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/username",
      i18n: "form.auth_login",
      options: {
        autoFocus: true,
        autocomplete: "username",
        placeholder: "name@email.com"
      }
    }
  ]
});
