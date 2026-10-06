// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/twofa-enrolment
 * @description The enrolment half of legacy's two-factor dialog
 * (`configure2faModal.vue:14-20`) — the setup key an authenticator app is
 * given, and the `otpauth://` address that carries it.
 *
 * It lives HERE rather than in `contracts/auth.schemas.twofa.ts` because that
 * file is a STAND-IN, transcribed export-for-export from the real headless
 * module (plan F3): a builder it does not have, or a parameter it does not
 * take, is drift that would survive the go-real swap. The dialog's own
 * composition is the mock's, so the mock's own layer carries it.
 *
 * Legacy drew a QR image over the same address. This build ships no image
 * assets, so the address stands alone beside the key.
 */

import {
  useTwoFASchema,
  useTwoFAUischema
} from "../contracts/auth.schemas.twofa";
import { assign } from "lodash-es";
import type { MockDataset } from "../types";
import type {
  ControlElement,
  JsonSchema,
  Layout,
  UISchemaElement
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** What the enrolment dialog states — the key, and the link that carries it. */
export type TwoFactorEnrolment = {
  readonly secret: string;
  readonly uri: string;
};

/** The account's own enrolment, off the seeded secret. */
export function twoFactorEnrolment(data: MockDataset): TwoFactorEnrolment {
  const secret = data.security.twoFactorSecret;
  return {
    secret,
    uri: twoFactorUri(secret, data.persona.email, data.brand.name)
  };
}

/**
 * The `otpauth://` address an authenticator app enrols from — the same one
 * legacy put behind its QR image.
 */
export function twoFactorUri(
  secret: string,
  account: string,
  issuer: string
): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * The verification schema with the enrolment facts added above the code box.
 *
 * The stand-in's own `\d{6}` is UNANCHORED, so seven digits pass it — that is
 * what headless carries, transcribed export-for-export (plan F3), and it is
 * not corrected here: a stand-in that fixed its source would stop being one.
 *
 * The stand-in's own schema is taken whole and widened here, so the swap to
 * the real module changes what is widened, never the widening.
 */
export function useEnrolmentSchema(): JsonSchema {
  const verify = useTwoFASchema();
  return assign({}, verify, {
    properties: assign(
      {
        secret: {
          type: "string",
          title: "Setup key",
          description:
            "Type this into your authenticator app, or follow the link below.",
          readOnly: true
        },
        uri: {
          type: "string",
          title: "Setup link",
          description: "Open this on the device your authenticator app is on.",
          readOnly: true
        }
      },
      verify.properties
    )
  });
}

/** The verification uischema with the two enrolment rows above the code box. */
export function useEnrolmentUischema(): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [readonlyRow("secret"), readonlyRow("uri"), ...verifyElements()]
  };
}

/**
 * The rows the stand-in's own uischema carries. It answers the base
 * `UISchemaElement`, whose `elements` only a LAYOUT arm has, so the shape is
 * asked rather than asserted — a stand-in that ever stopped answering a
 * layout would leave the code box out rather than crash on a cast.
 */
function verifyElements(): UISchemaElement[] {
  const verify = useTwoFAUischema();
  if (!isLayout(verify)) return [];
  return [...verify.elements];
}

function isLayout(element: UISchemaElement): element is Layout {
  return "elements" in element && Array.isArray(element.elements);
}

/** One enrolment fact, stated rather than asked for. */
function readonlyRow(scope: string): ControlElement {
  return {
    type: "Control",
    scope: `#/properties/${scope}`,
    options: { readonly: true }
  };
}

/** What the enrolment dialog opens on — the facts filled, the code box empty. */
export function enrolmentDefaults(enrolment: TwoFactorEnrolment): FormModel {
  return { secret: enrolment.secret, uri: enrolment.uri, token: "" };
}
