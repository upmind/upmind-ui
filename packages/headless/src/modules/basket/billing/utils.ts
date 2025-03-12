// --- external

// --- internal

// --- utils

// --- types
import type { BillingDetailsContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// ---
export const useSchema = (_context: BillingDetailsContext) => {
  const schema = {
    type: "object",
    title: "BillingDetailss",
    anyOf: [
      {
        type: "object",
        required: ["addressId"],
        properties: {
          addressId: {
            type: ["string", "null"],
          },
        },
      },
      {
        type: "object",
        required: ["companyId"],
        properties: {
          companyId: {
            type: ["string", "null"],
          },
        },
      },
    ],
  };

  return schema as unknown as JsonSchema;
};

export const useUischema = (_context: BillingDetailsContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/addressId",
        i18n: "basket.billingDetails.addressId",
        options: {
          autoFocus: true,
          autocomplete: "off",
        },
      },
      {
        type: "Control",
        scope: "#/properties/companyId",
        i18n: "basket.billingDetails.companyId",
        options: {
          autoFocus: true,
          autocomplete: "off",
        },
      },
    ],
  };

  return schema as UISchemaElement;
};
