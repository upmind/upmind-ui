/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/schemas.login
 * @description Login form schemas.
 * Used for client/guest authentication via username/password.
 */

import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * JSON Schema for the login form.
 */
export const useLoginSchema = (): JsonSchema => ({
  type: "object",
  title: "Log in",
  required: ["username", "password"],
  properties: {
    username: {
      type: "string",
      minLength: 1,
      title: "Your username or email address"
    },
    password: {
      type: "string",
      format: "password",
      minLength: 1,
      title: "Your password"
    }
  }
});

/**
 * UI Schema for the login form.
 */
export const useLoginUischema = (): UISchemaElement => ({
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
    },
    {
      type: "Control",
      scope: "#/properties/password",
      i18n: "form.auth_password",
      options: {
        autocomplete: "current-password",
        placeholder: "password or passphrase"
      }
    }
  ]
});
