// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/auth.schemas.register-org
 * @description Legacy's `orgRegistrationForm`, the screen behind "Get started
 * for free": the organisation, who runs it, how they sign in, the currency it
 * bills in, and whether to seed demo data.
 */

import { PORTAL_FORM_CURRENCIES } from "../forms/engine-data";
import { map } from "lodash-es";
import type {
  ControlElement,
  JsonSchema7,
  VerticalLayout
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

const PASSWORD_MIN_LENGTH = 8;

function control(
  scope: string,
  options?: Record<string, unknown>
): ControlElement {
  if (options === undefined) return { type: "Control", scope };
  return { type: "Control", scope, options };
}

export const useRegisterOrgSchema = (): JsonSchema7 => ({
  type: "object",
  required: ["orgName", "name", "email", "password", "currency"],
  properties: {
    orgName: { type: "string", title: "Organisation name", minLength: 1 },
    name: { type: "string", title: "Your name", minLength: 1 },
    email: { type: "string", title: "Your email", format: "email" },
    password: {
      type: "string",
      title: "Password",
      format: "password",
      minLength: PASSWORD_MIN_LENGTH
    },
    currency: {
      type: "string",
      title: "Currency",
      oneOf: map(PORTAL_FORM_CURRENCIES, code => ({ const: code, title: code }))
    },
    importDemoData: {
      type: "boolean",
      title: "Seed demo data?",
      description:
        "Seed demo data into your brand, so you can give Upmind a test-drive without setting things up. You can delete it at any time, even once real data flows through."
    }
  }
});

export const useRegisterOrgUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    control("#/properties/orgName", {
      autoFocus: true,
      autocomplete: "organization"
    }),
    control("#/properties/name", { autocomplete: "name" }),
    control("#/properties/email", { autocomplete: "email" }),
    control("#/properties/password", {
      autocomplete: "new-password",
      placeholder: "8+ characters, consisting of both numbers & letters"
    }),
    control("#/properties/currency", { placeholder: "Select currency" }),
    control("#/properties/importDemoData")
  ]
});

/** Legacy opened with the currency unpicked and demo data off. */
export const registerOrgDefaults = (): FormModel => ({
  orgName: "",
  name: "",
  email: "",
  password: "",
  currency: "",
  importDemoData: false
});
