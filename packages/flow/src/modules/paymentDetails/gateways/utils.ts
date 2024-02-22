// --- external

// --- internal

// --- utils
import { reduce, defaultsDeep, get, set } from "lodash-es";

// --- types
import type { GatewayContext } from "./types.d";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = (_context: GatewayContext) => {
  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: [],
    properties: {}
  };

  return schema;
};

// --------------------------------------------------------

export const useUischema = (_context: GatewayContext) => {
  const uischema = {
    type: "VerticalLayout",
    elements: []
  };

  return uischema as UISchemaElement;
};

// --------------------------------------------------------

export const useModelParser = (schema: JsonSchema, values) => {
  const model = reduce(
    schema?.properties,
    (result, field, key) => {
      const value = get(values, key, field?.const || field?.default);
      set(result, key, value);
      return result;
    },
    {}
  );

  return defaultsDeep(model, values);
};
