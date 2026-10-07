// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-ip-whitelist.schemas
 * @description Schema/uischema for the SCOPED `client-ip-whitelist` module
 * headless does not have yet (plan F4) — written in the headless shape, so
 * `/scoped-composable-factory` consumes this file unchanged alongside
 * `client-ip-whitelist.ts`'s four-layer contract.
 *
 * The address takes either family: `anyOf` over the two `ajv-formats` IP
 * formats, under a `string` type so the string renderer still claims the
 * control. A single `format` would refuse every IPv6 address the wire accepts.
 *
 * @module-oracle vue-app `ipWhitelistManageComp.vue` — an address and the name
 * the client knows it by, and nothing else: the account is the scope.
 */

import type { JsonSchema7, VerticalLayout } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** Legacy's own bound on the label beside an address. */
const DESCRIPTION_MAX = 60;

/** Schema for the add-address form. */
export const useSchema = (): JsonSchema7 => ({
  type: "object",
  title: "IP address",
  required: ["ipAddress"],
  properties: {
    ipAddress: {
      type: "string",
      title: "IP address",
      anyOf: [{ format: "ipv4" }, { format: "ipv6" }]
    },
    description: {
      type: ["string", "null"],
      title: "Description",
      maxLength: DESCRIPTION_MAX
    }
  },
  errorMessage: {
    properties: {
      ipAddress: "Enter a valid IPv4 or IPv6 address."
    }
  }
});

/** UI schema for the add-address form. */
export const useUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/ipAddress",
      i18n: "form.ip_address",
      options: {
        autoFocus: true,
        autocomplete: "off",
        placeholder: "eg. 82.14.210.7"
      }
    },
    {
      type: "Control",
      scope: "#/properties/description",
      i18n: "form.description",
      options: {
        placeholder: "Where this address is — London office, home…"
      }
    }
  ]
});

/** What the add dialog opens with — the schema's own `required` does the rest. */
export const ipWhitelistDefaults = (): FormModel => ({});

/** What the EDIT dialog opens with — the entry as it stands. */
export const ipWhitelistEditDefaults = (entry: {
  readonly ip_address: string;
  readonly name?: string | null;
}): FormModel => ({
  ipAddress: entry.ip_address,
  description: entry.name ?? ""
});
