// --- external

// --- internal

// --- utils
import { defaultsDeep, get, map, reduce, set } from "lodash-es";

// --- types
import { PaymentTypes } from "./types.d";
import type { IPaymentDetail, PaymentDetailsContext } from "./types.d";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = ({
  payment_types,
  gateways
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
      },
      gateway_id: {
        type: ["string", "null"],
        title: "Select a payment method",
        oneOf: map(gateways, ({ gateway_id, gateway }) => ({
          const: gateway_id,
          title: gateway.name
        }))
      }
    },

    if: {
      properties: {
        type: { const: PaymentTypes.PAY_IN_FULL }
      }
    },
    then: {
      required: ["gateway_id"]
    }
  };

  return schema;
};

// --------------------------------------------------------

export const useUischema = ({ currency }: PaymentDetailsContext) => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      // {
      //   type: "Control",
      //   scope: "#/properties/amount",
      //   options: {
      //     prefix: currency?.prefix,
      //     suffix: currency?.suffix,
      //     trim: true
      //   }
      // },
      {
        type: "Control",
        scope: "#/properties/type",
        options: {
          format: "menu"
        }
      },
      {
        type: "Control",
        scope: "#/properties/gateway_id",
        options: {
          format: "menu"
        },
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#/properties/type",
            schema: { const: PaymentTypes.PAY_IN_FULL }
          }
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
