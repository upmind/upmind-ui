// --- external

// --- internal

// --- utils

// --- types
import type { BillingDetailsContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = (_context: BillingDetailsContext) => {
  const schema = {
    type: "object",
    title: "BillingDetailss",
    anyOf: [
      {
        type: "object",
        required: ["address_id"],
        properties: {
          address_id: {
            type: ["string", "null"],
          },
        },
      },
      {
        type: "object",
        required: ["company_id"],
        properties: {
          company_id: {
            type: ["string", "null"],
          },
        },
      },
    ],
  };

  // @ts-ignore
  return schema as JsonSchema;
};

export const useUischema = (_context: BillingDetailsContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/address_id",
        i18n: "basket.billing_details.address_id",
        options: {
          autoFocus: true,
          autocomplete: "off",
        },
      },
      {
        type: "Control",
        scope: "#/properties/company_id",
        i18n: "basket.billing_details.company_id",
        options: {
          autoFocus: true,
          autocomplete: "off",
        },
      },
    ],
  };

  return schema as UISchemaElement;
};
