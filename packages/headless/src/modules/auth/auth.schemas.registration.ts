/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/schemas.registration
 * @description Set-password form schemas of the registration-activation landing.
 */

import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * JSON Schema for the set-password form.
 * @param username - the link username; a prefilled username is read-only.
 */
export const useSetPasswordSchema = (username?: string): JsonSchema => ({
  type: "object",
  title: "Set password",
  required: ["username", "password", "password_confirmation"],
  properties: {
    username: {
      type: "string",
      minLength: 1,
      title: "Your username or email address",
      readOnly: !!username
    },
    password: {
      type: "string",
      title: "Set password",
      format: "password",
      minLength: 8,
      pattern: "(?=.*[a-zA-Z])(?=.*\\d)"
    },
    password_confirmation: {
      type: "string",
      title: "Confirm password",
      format: "password"
    }
  }
});

/**
 * UI Schema for the set-password form.
 */
export const useSetPasswordUischema = (): UISchemaElement => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/username",
      i18n: "form.auth_login",
      options: {
        autocomplete: "username"
      }
    },
    {
      type: "Control",
      scope: "#/properties/password",
      i18n: "form.auth_set_password",
      options: {
        type: "password",
        autocomplete: "new-password",
        // Keep these per-rule regexes, the schema `pattern` and the
        // `auth_set_password.error` keys in lockstep.
        requirements: {
          min_length: ".{8,}",
          letter: "(?=.*[a-zA-Z])",
          number: "(?=.*\\d)"
        }
      }
    },
    {
      type: "Control",
      scope: "#/properties/password_confirmation",
      i18n: "form.auth_set_password_confirmation",
      options: {
        type: "password",
        autocomplete: "current-password"
      }
    }
  ]
});
