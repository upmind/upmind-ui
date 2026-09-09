// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-security.schemas
 * @description Schema/uischema for the SCOPED `client-security` module
 * headless does not have yet (plan F4) — written in the headless shape, so
 * `/scoped-composable-factory` consumes this file unchanged alongside
 * `client-security.ts`'s four-layer contract.
 *
 * The confirm field carries NO schema-level equality rule. The platform's own
 * `same` keyword (`useValidation`, transcribed in `mock/forms/ajv.ts`) reads
 * the sibling path off the value it is validating, so on a string field it
 * resolves `undefined` and on the object it compares the model with itself —
 * it can never express "confirm equals password". The refusal is therefore
 * the facade's (`useMockSecurity.changePassword`), which is where a
 * business-rule refusal belongs anyway (plan F5).
 *
 * @module-oracle vue-app `changeUsernameForm.vue`, `changePasswordForm.vue`.
 */

import type { JsonSchema7, VerticalLayout } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

/** The platform's own floor — `@upmind/ui` `src/form/password.ts` scores against it. */
const PASSWORD_MIN_LENGTH = 8;

/** Schema for the change-username form. */
export const useUsernameSchema = (): JsonSchema7 => ({
  type: "object",
  title: "Username",
  required: ["username"],
  properties: {
    username: {
      type: "string",
      title: "Username",
      minLength: 1
    }
  }
});

/** UI schema for the change-username form. */
export const useUsernameUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/username",
      i18n: "form.username",
      options: {
        autocomplete: "username",
        placeholder: "The name you sign in with"
      }
    }
  ]
});

/** Schema for the change-password form. */
export const usePasswordSchema = (): JsonSchema7 => ({
  type: "object",
  title: "Password",
  required: ["password", "passwordConfirm"],
  properties: {
    password: {
      type: "string",
      format: "password",
      title: "New password",
      minLength: PASSWORD_MIN_LENGTH
    },
    passwordConfirm: {
      type: "string",
      format: "password",
      title: "Confirm new password",
      minLength: PASSWORD_MIN_LENGTH
    }
  }
});

/** UI schema for the change-password form. */
export const usePasswordUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/password",
      i18n: "form.password",
      options: {
        autocomplete: "new-password",
        placeholder: "At least 8 characters"
      }
    },
    {
      type: "Control",
      scope: "#/properties/passwordConfirm",
      i18n: "form.password_confirm",
      options: {
        autocomplete: "new-password",
        placeholder: "Type it again"
      }
    }
  ]
});

/** What the username form opens with when the account has no username on file. */
export const usernameDefaults = (): FormModel => ({ username: "" });

/** What the password form opens with — never the current one, which is not readable. */
export const passwordDefaults = (): FormModel => ({
  password: "",
  passwordConfirm: ""
});
