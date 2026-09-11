import { map } from "lodash-es";
import type { MockInvoice } from "../types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

/**
 * Legacy's manual consolidation modal: a tick per unpaid recurring invoice,
 * and nothing happens below two of them.
 */
export const CONSOLIDATION_PICK_MIN = 2;

export function useConsolidationPickSchema(
  invoices: readonly MockInvoice[]
): JsonSchema {
  return {
    type: "object",
    properties: {
      invoiceIds: {
        type: "array",
        title: "Invoices to bring together",
        uniqueItems: true,
        minItems: CONSOLIDATION_PICK_MIN,
        items: {
          type: "string",
          oneOf: map(invoices, invoice => ({
            const: invoice.id,
            title: `${invoice.number} · ${invoice.total.formatted} · due ${invoice.dueDate}`
          }))
        }
      }
    },
    required: ["invoiceIds"]
  };
}

export function useConsolidationPickUischema(): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [{ type: "Control", scope: "#/properties/invoiceIds" }]
  };
}

/** Every gatherable invoice starts ticked — the one-click path legacy also offered. */
export function consolidationPickDefaults(
  invoices: readonly MockInvoice[]
): FormModel {
  return { invoiceIds: map(invoices, "id") };
}
