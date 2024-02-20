// --- external

// --- internal
import { PaymentTypes, GatewayTypes } from "./services";

// --- utils
import {
  find,
  get,
  map,
  set,
  reduce,
  defaultsDeep,
  merge,
  concat,
  isEmpty,
  isArray,
  first
} from "lodash-es";

// --- types
import type { IPaymentDetail, PaymentDetailsContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = ({
  payment_types,
  gateways,
  model
}: PaymentDetailsContext) => {
  const schema = {
    type: "object",
    title: "Payment Details",
    required: ["amount", "type"],

    properties: {
      amount: {
        type: "number",
        title: "Amount",
        readOnly: true
      },
      type: {
        type: "string",
        title: "Payment Type",
        default: PaymentTypes.PAY_IN_FULL,
        oneOf: map(payment_types, (value, key) => ({
          const: value,
          title: key
        }))
      }
    }
  };

  return schema;
};

// --------------------------------------------------------

export const useUischema = ({ currency }: PaymentDetailsContext) => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/amount",
        options: {
          prefix: currency?.prefix,
          suffix: currency?.suffix,
          trim: true
        }
      },
      {
        type: "Control",
        scope: "#/properties/type",
        options: {
          format: "radio"
        }
      }
    ]
  };

  return uischema as UISchemaElement;
};

// --------------------------------------------------------

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

// --------------------------------------------------------

export const useInvoiceParser = (data: any) => {
  data = get(data, "data", data); // handle the reponse types from the api
  data = isArray(data) ? first(data) : data; // usually from the claims endpoint

  // TODO:...map properly...

  return data;
};
