// --- external

// --- internal

// --- utils
import { get, map, set, reduce, defaultsDeep } from "lodash-es";

// --- types
import type { ICurrency, CurrencyContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = ({ currencies, baseModel }: CurrencyContext) => {
  const schema = {
    type: "object",
    title: "Currency",
    required: ["code"],
    properties: {
      code: {
        type: ["string", "null"],
        title: "Currency",
        default: baseModel?.code,
        oneOf: map(currencies, item => ({
          const: item.code,
          title: `${item?.prefix || item?.suffix} ${item.code}`
        }))
      }
    }
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
        options: {
          focus: true,
          autocomplete: "off",
          placeholder: "Select currency..."
        }
      }
    ]
  };

  return schema as UISchemaElement;
};

export const useModelParser = (schema: JsonSchema, values: ICurrency) => {
  const model = reduce(
    schema.properties,
    (result, field, key) => {
      const value = get(values, key, field?.const || field?.default);
      set(result, key, value);
      return result;
    },
    {}
  );

  return defaultsDeep(model, values) as ICurrency;
};
