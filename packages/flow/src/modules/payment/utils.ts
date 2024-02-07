// --- external

// --- internal

// --- utils
import { get, set, reduce, defaultsDeep } from "lodash-es";

// --- types
import type { IPaymentDetail, PaymentDetailsContext } from "./types.d";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = (context: PaymentDetailsContext) => {
  const schema = {
    type: "object",
    title: "Payment Details Fields",
    required: [],
    properties: {}
  };

  return schema as JsonSchema;
};

export const useUischema = (context: PaymentDetailsContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: []
  };

  return schema as UISchemaElement;
};

export const useModelParser = (schema: JsonSchema, values: IPaymentDetail) => {
  const model = reduce(
    schema?.properties,
    (result, field, key) => {
      const value = get(values, key, field?.const || field?.default);
      set(result, key, value);
      return result;
    },
    {}
  );

  return defaultsDeep(model, values) as IPaymentDetail;
};
