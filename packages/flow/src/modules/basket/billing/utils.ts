// --- external

// --- internal

// --- utils

// --- types
import type { BillingDetailsContext } from "./types.d";
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
            title: "Use Address"
          }
        }
      },
      {
        type: "object",
        required: ["company_id"],
        properties: {
          company_id: {
            type: ["string", "null"],
            title: "Use Company"
          }
        }
      }
    ]
  };

  return schema as JsonSchema;
};

export const useUischema = (_context: BillingDetailsContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/address_id",
        options: {
          focus: true,
          autocomplete: "off",
          placeholder: "Select Address"
        }
      },
      {
        type: "Control",
        scope: "#/properties/company_id",
        options: {
          focus: true,
          autocomplete: "off",
          placeholder: "Select Company"
        }
      }
    ]
  };

  return schema as UISchemaElement;
};
