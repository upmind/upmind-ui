/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module auth/schemas.twofa
 * @description Two-factor authentication form schemas.
 * Used for 2FA code verification.
 */

import { TwofaProviders } from "@upmind-automation/types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------

/**
 * JSON Schema for the 2FA verification form.
 */
export const useTwoFASchema = (): JsonSchema => ({
  type: "object",
  title: "Verify 2FA",
  required: ["token"],
  properties: {
    token: {
      type: "string",
      pattern: "\\d{6}",
      title: "Two-factor authentication"
    }
  },
  errorMessage: {
    properties: {
      token: "Please enter a valid 6-digit code."
    }
  }
});

// Per-provider 2FA UI defaults.
const TWOFA_PROVIDER_OPTIONS = {
  [TwofaProviders.EMAIL]: {
    i18n: "form.twofa_email",
    autocomplete: "off"
  },
  [TwofaProviders.TOTP]: {
    i18n: "form.twofa_totp",
    autocomplete: "one-time-code"
  }
} as const;

const TWOFA_DEFAULT_OPTIONS = {
  i18n: "form.twofa",
  autocomplete: "off"
} as const;

/**
 * UI Schema for the 2FA verification form.
 * @param provider - Optional 2FA provider for provider-specific i18n/autocomplete.
 */
export const useTwoFAUischema = (
  provider?: TwofaProviders
): UISchemaElement => {
  const { i18n, ...controlOptions } =
    (provider && TWOFA_PROVIDER_OPTIONS[provider]) ?? TWOFA_DEFAULT_OPTIONS;

  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/token",
        i18n,
        options: {
          format: "otp",
          autoFocus: true,
          ...controlOptions
        }
      }
    ]
  };
};
