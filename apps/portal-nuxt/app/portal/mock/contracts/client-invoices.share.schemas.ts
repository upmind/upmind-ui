// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-invoices.share.schemas
 * @description Schema/uischema for the SHARE dialog the scoped
 * `client-invoices` module does not have yet (plan F4) — legacy's
 * `invoiceShareModal`, written in the headless shape so
 * `/scoped-composable-factory` consumes this file unchanged.
 *
 * The link itself is a STATED fact rather than a field: it is generated, and
 * the only thing a client does to it is copy it or ask for a new one. Its two
 * permissions are ruled on the switch above them — legacy hid the whole block
 * while sharing was off — and the payment permission is offered only where
 * the document is still owed, because a settled invoice has nothing to pay.
 *
 * @module-oracle vue-app `invoiceShareModal.vue:7-63`.
 */

import { RuleEffect } from "@jsonforms/core";
import { compact } from "lodash-es";
import type {
  ControlElement,
  JsonSchema7,
  Rule,
  VerticalLayout
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** What the share dialog is handed — the link as it stands, and what may be permitted. */
export type InvoiceShareContext = {
  /** The public address this document is reachable at. */
  readonly link: string;
  /** Whether the link is live. */
  readonly isShared: boolean;
  readonly allowDownload: boolean;
  readonly allowPayment: boolean;
  /**
   * Whether paying over the link may be permitted at all — legacy offered the
   * checkbox on an UNPAID, ADJUSTED or OVERDUE document and on nothing else.
   */
  readonly offersPayment: boolean;
};

export const useSchema = (context: InvoiceShareContext): JsonSchema7 => {
  const properties: Record<string, JsonSchema7> = {
    isShared: { type: "boolean", title: "Enable sharing" },
    link: { type: "string", title: "Link", readOnly: true },
    allowDownload: { type: "boolean", title: "Allow PDF download" }
  };
  if (context.offersPayment) {
    properties["allowPayment"] = { type: "boolean", title: "Allow payment" };
  }
  return {
    type: "object",
    title: "Share this invoice",
    required: ["isShared"],
    properties
  };
};

/** Shown while the sharing switch is on, and nowhere else. */
function whileShared(): Rule {
  return {
    effect: RuleEffect.SHOW,
    condition: {
      scope: "#/properties/isShared",
      schema: { const: true }
    }
  };
}

function sharedControl(scope: string): ControlElement {
  return {
    type: "Control",
    scope: `#/properties/${scope}`,
    rule: whileShared()
  };
}

export const useUischema = (context: InvoiceShareContext): VerticalLayout => ({
  type: "VerticalLayout",
  elements: compact([
    { type: "Control", scope: "#/properties/isShared" },
    {
      type: "Control",
      scope: "#/properties/link",
      rule: whileShared(),
      options: { readonly: true }
    },
    sharedControl("allowDownload"),
    context.offersPayment && sharedControl("allowPayment")
  ])
});

/** What the dialog opens on — the document's own sharing state. */
export const invoiceShareDefaults = (
  context: InvoiceShareContext
): FormModel => ({
  isShared: context.isShared,
  link: context.link,
  allowDownload: context.allowDownload,
  allowPayment: context.allowPayment
});
