// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/auth.schemas.reset
 * @description Legacy's `resetPasswordForm`: one new password, and the
 * second-step code where the account signs in with two-factor. The same form
 * sets the first password on an account-verification link, code unasked.
 */

import { VERIFICATION_CODE_PATTERN } from "./client-contacts.schemas";
import type {
  ControlElement,
  JsonSchema7,
  VerticalLayout
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

/** Legacy's own placeholder: "8+ characters, consisting of both numbers & letters". */
const PASSWORD_MIN_LENGTH = 8;

const PASSWORD_HINT = "8+ characters, consisting of both numbers & letters";

const PASSWORD_CONTROL: ControlElement = {
  type: "Control",
  scope: "#/properties/password",
  options: { autocomplete: "new-password", placeholder: PASSWORD_HINT }
};

const CODE_CONTROL: ControlElement = {
  type: "Control",
  scope: "#/properties/token",
  options: { autocomplete: "one-time-code" }
};

/** Schema for the new password; the code joins it only where two-factor is on. */
export const useResetPasswordSchema = (asksCode: boolean): JsonSchema7 => {
  const properties: Record<string, JsonSchema7> = {
    password: {
      type: "string",
      format: "password",
      title: "New password",
      minLength: PASSWORD_MIN_LENGTH
    }
  };
  const required = ["password"];
  if (asksCode) {
    properties["token"] = {
      type: "string",
      title: "Authentication code",
      pattern: VERIFICATION_CODE_PATTERN
    };
    required.push("token");
  }
  return { type: "object", required, properties };
};

export const useResetPasswordUischema = (asksCode: boolean): VerticalLayout => {
  const elements: ControlElement[] = [PASSWORD_CONTROL];
  if (asksCode) elements.push(CODE_CONTROL);
  return { type: "VerticalLayout", elements };
};

export const resetPasswordDefaults = (asksCode: boolean): FormModel => {
  const model: FormModel = { password: "" };
  if (asksCode) model["token"] = "";
  return model;
};
