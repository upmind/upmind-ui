// --- external

// --- internal

// --- utils
import { get, set, reduce, defaultsDeep } from "lodash-es";

// --- types
import type { IBillingDetail, BillingDetailsContext } from "./types.d";
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

export const useModelParser = (schema: JsonSchema, values: IBillingDetail) => {
  const model = reduce(
    schema.properties,
    (result, field, key) => {
      const value = get(values, key, field?.const || field?.default);
      set(result, key, value);
      return result;
    },
    {}
  );

  return defaultsDeep(model, values) as IBillingDetail;
};
