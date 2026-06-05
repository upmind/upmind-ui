// -----------------------------------------------------------------------------
/**
 * @module session/client/utils
 * @description Schema/uischema parsers for the client machine's email
 * verification form. Mirrors the guest 2FA parsers so the cart's VerifyEmail
 * overlay can be rendered schema-driven via JSONForms.
 */

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
        options: {
          format: "otp",
          autoFocus: true,
          autocomplete: "one-time-code"
        }
      }
    ]
  };
};
