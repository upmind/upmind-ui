// -----------------------------------------------------------------------------
/**
 * @module session/client/utils
 * @description Form schema/uischema/model parsers owned by the client machine
 * for guest-client flows. The register/upgrade form reuses the generic
 * `useRegister*` parsers from `../guest/utils`; the guest-email form is defined
 * here. Mirrors the parser pattern used by the guest machine.
 */

// --- types
import type { GuestEmailModel } from "./types";

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

export const useGuestEmailUischemaParser = () => {
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
          placeholder: "name@email.com"
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
