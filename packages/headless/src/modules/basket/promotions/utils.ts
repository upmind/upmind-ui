// --- external

// --- internal

// --- utils

// --- types
import type { PromotionsContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// ---
export const useSchema = (_context: PromotionsContext) => {
  const schema = {
    type: "object",
    title: "Promotions",
    required: ["promocode"],
    properties: {
      promocode: {
        title: "Promo code",
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
        i18n: "basket.promotions.promocode",
        options: {
          autoFocus: true,
          autocomplete: "off",
          placeholder: "Enter code here",
          noLabel: true,
        },
      },
    ],
  };

  return schema as UISchemaElement;
};
