// --- external

// --- internal

// --- utils

// --- types
import { size } from "lodash-es";
import type { PromotionsContext } from "./types.d";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = (_context: PromotionsContext) => {
  const schema = {
    type: "object",
    title: "Promotions",
    required: ["promocode"],
    properties: {
      promocode: {
        type: ["string", "null"],
      },
    },
  };

  return schema as JsonSchema;
};

export const useUischema = (_context: PromotionsContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/promocode",
        options: {
          focus: true,
          autocomplete: "off",
          placeholder: "Enter code here",
          label: "",
          noStatus: true,
          noRequired: true,
          noLabel: true,
        },
      },
    ],
  };

  return schema as UISchemaElement;
};
