/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module account/account.schemas
 * @description Schema/uischema/model parsers owned by the account machine.
 * Includes the email-verification form (mirrors the guest 2FA parsers, used by
 * the cart's VerifyEmail overlay so it renders schema-driven via JSONForms) and
 * the guest-email form for guest-client flows. The register/upgrade form reuses
 * the generic `useRegister*` parsers from `../auth`. Mirrors the parser
 * pattern used by the guest machine.
 */

import type { GuestEmailModel } from "./account.types";

// -----------------------------------------------------------------------------

export const useVerifyEmailSchemaParser = () => {
  return {
    type: "object",
    title: "Verify email",
    required: ["code"],
    properties: {
      code: {
        type: "string",
        pattern: "\\d{6}",
        title: "Email verification"
      }
    },
    errorMessage: {
      properties: {
        code: "Please enter a valid 6-digit code."
      }
    }
  };
};

export const useVerifyEmailUischemaParser = () => {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/code",
        i18n: "form.verify_email",
        label: "",
        options: {
          format: "otp",
          autoFocus: true,
          autocomplete: "one-time-code",
          size: "lg",
          align: "center"
        }
      }
    ]
  };
};

// -----------------------------------------------------------------------------

export const useGuestEmailSchemaParser = () => {
  return {
    type: "object",
    title: "Email",
    properties: {
      email: {
        type: "string",
        format: "email",
        title: "Email for order receipt"
      }
    }
  };
};

export const useGuestEmailUischemaParser = (options?: {
  loading?: boolean;
  success?: boolean;
}) => {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/email",
        // Simple field label ("Email") — the Section header carries the longer
        // "Email for order receipt" context.
        i18n: "form.email",
        options: {
          noLabel: true,
          type: "email",
          format: "email",
          autocomplete: "email",
          placeholder: "name@email.com",
          ...options
        }
      }
    ]
  };
};

export const useGuestEmailModelParser = (
  model?: GuestEmailModel
): GuestEmailModel => {
  return {
    email: model?.email
  };
};
