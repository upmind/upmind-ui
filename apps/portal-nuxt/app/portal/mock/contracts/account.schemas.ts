// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/account.schemas
 * @standin packages/headless/src/modules/account/account.schemas.ts
 * @description A STAND-IN for the real module's own parsers, carrying the
 * same five export names, the same parameters and the same content — the
 * six-digit verification code with its error message and OTP control, and the
 * guest-email trio beside it. go-real: swap this import for the real module.
 *
 * It exists because the real file cannot be reached at runtime today: it is
 * `@internal` to `account`, whose barrel module-load `interpret()`s the
 * account and routing machines.
 *
 * TWO declared divergences, both mechanical:
 *
 * 1. The real parsers return inferred object literals; these name their
 *    return types (`JsonSchema7`, `VerticalLayout`, `GuestEmailModel`). The
 *    emitted values are identical.
 * 2. The guest-email uischema merges its caller's `options` with `assign`
 *    rather than an object spread — the same merge, in this app's spelling
 *    (`auth.schemas.twofa`'s stand-in does the same).
 *
 * `verifyEmailDefaults()` is the one addition — the verify page's opening model
 * (plan F6). The OTP control binds a string, so the key is present and empty
 * rather than absent.
 *
 * @module-oracle vue-app `verifyEmail/index.vue`, `verify/index.vue`.
 */

import { assign } from "lodash-es";
import type { JsonSchema7, VerticalLayout } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";
import type { GuestEmailModel } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export const useVerifyEmailSchemaParser = (): JsonSchema7 => {
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

export const useVerifyEmailUischemaParser = (): VerticalLayout => {
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

export const useGuestEmailSchemaParser = (): JsonSchema7 => {
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
}): VerticalLayout => {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/email",
        // Simple field label ("Email") — the Section header carries the longer
        // "Email for order receipt" context.
        i18n: "form.email",
        options: assign(
          {
            noLabel: true,
            type: "email",
            format: "email",
            autocomplete: "email",
            placeholder: "name@email.com"
          },
          options
        )
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

/** What the verify page's code box opens with — empty, never a guessed code. */
export const verifyEmailDefaults = (): FormModel => ({ code: "" });
