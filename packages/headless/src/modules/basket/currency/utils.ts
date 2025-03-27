// --- external

// --- internal

// --- utils
import { map } from "lodash-es";

// --- types
import type { CurrencyContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useSchema = ({ currencies, baseModel }: CurrencyContext) => {
  const schema = {
    type: "object",
    title: "Currency",
    required: ["code"],
    properties: {
      code: {
        type: ["string", "null"],
        default: baseModel?.code,
        oneOf: map(currencies, item => ({
          const: item.code,
          title: `${item?.prefix || item?.suffix} ${item.code}`,
        })),
      },
    },
  };

  return schema as JsonSchema;
};

export const useUischema = (_context: CurrencyContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/code",
        i18n: "basket.currency.code",
        options: {
          autoFocus: true,
          autocomplete: "off",
          placeholder: "Select currency...",
        },
      },
    ],
  };

  return schema as UISchemaElement;
};
