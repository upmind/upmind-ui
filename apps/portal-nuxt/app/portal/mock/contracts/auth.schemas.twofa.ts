// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/auth.schemas.twofa
 * @standin packages/headless/src/modules/auth/auth.schemas.twofa.ts
 * @description A STAND-IN for the real module's own two-factor schema
 * builders, carrying the same two export names, the same optional provider
 * parameter and the same content — the six-digit pattern, its error message,
 * and the per-provider i18n/autocomplete defaults. go-real: swap this import
 * for the real module.
 *
 * It exists because the real file cannot be reached at runtime today: it is
 * `@internal` to `auth`, whose barrel module-load `interpret()`s the auth and
 * routing machines.
 *
 * `twoFactorDefaults()` is the one addition — the enable dialog's opening model
 * (plan F6). The OTP control binds a string, so the key is present and empty
 * rather than absent.
 *
 * @module-oracle vue-app `twoFactorAuthForm.vue`.
 */

import { TwofaProviders } from "@upmind-automation/types";
import { assign, omit } from "lodash-es";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

/** JSON Schema for the 2FA verification form. */
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

/** Per-provider 2FA UI defaults. */
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
  const resolved =
    (provider && TWOFA_PROVIDER_OPTIONS[provider]) ?? TWOFA_DEFAULT_OPTIONS;

  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/token",
        i18n: resolved.i18n,
        options: assign(
          { format: "otp", autoFocus: true },
          omit(resolved, ["i18n"])
        )
      }
    ]
  };
};

/** What the enable dialog opens with — the code box, empty. */
export const twoFactorDefaults = (): FormModel => ({ token: "" });
