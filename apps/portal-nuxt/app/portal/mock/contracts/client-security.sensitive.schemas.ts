import { compact } from "lodash-es";
import type { JsonSchema, JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

/**
 * Legacy's sensitive-action chain (`useSensitiveActionChain`): the current
 * password is always asked; the second-step code only where the account has
 * two-factor turned on. The code property mirrors `auth.schemas.twofa.ts`.
 */
export function useSensitiveSchema(asksCode: boolean): JsonSchema {
  const properties: Record<string, JsonSchema7> = {
    password: {
      type: "string",
      format: "password",
      title: "Current password",
      minLength: 1
    }
  };
  const required = ["password"];
  if (asksCode) {
    properties["token"] = {
      type: "string",
      pattern: "\\d{6}",
      title: "Two-factor authentication"
    };
    required.push("token");
  }
  return {
    type: "object",
    properties,
    required,
    errorMessage: {
      properties: { token: "Please enter a valid 6-digit code." }
    }
  };
}

export function useSensitiveUischema(asksCode: boolean): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: compact([
      { type: "Control", scope: "#/properties/password" },
      asksCode && { type: "Control", scope: "#/properties/token" }
    ])
  };
}

export function sensitiveDefaults(asksCode: boolean): FormModel {
  if (!asksCode) return { password: "" };
  return { password: "", token: "" };
}
