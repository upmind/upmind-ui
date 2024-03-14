// --- external

// --- internal

// --- utils

// --- types
import type { PromotionsContext } from "./types.d";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = (_context: PromotionsContext) => {
  const schema = {
    type: "object",
    title: "Promotions",
    required: ["code"],
    properties: {
      code: {
        type: ["string", "null"],
        title: "Code"
      }
    }
  };

  return schema as JsonSchema;
};

export const useUischema = (_context: PromotionsContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/code",
        options: {
          focus: true,
          autocomplete: "off",
          placeholder: "Enter code...",
          styles: {
            control: {
              label: {
                root: "label sr-only",
                text: "label-text"
              },
              input: "input input-bordered w-full "
            }
          }
        }
      }
    ]
  };

  return schema as UISchemaElement;
};
