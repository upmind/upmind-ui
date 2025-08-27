// --- external

// --- internal

// --- utils
import { useTranslateName } from "../../utils";
import { omit, map } from "lodash-es";

// --- types
import { PaymentType } from "@upmind-automation/types";
import type { PaymentDetailsContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useSchema = ({
  paymentTypes,
  gateways
}: PaymentDetailsContext): JsonSchema => {
  const schema = {
    type: "object",
    title: "Payment details",
    required: ["type"],

    properties: {
      type: {
        type: "string",
        title: "Payment type",
        const: PaymentType.PAY_IN_FULL,
        oneOf: !paymentTypes
          ? undefined
          : map(paymentTypes, (value, key) => ({
              const: value,
              title: key
            }))
      },
      gateway_id: {
        type: ["string", "null"],
        title: "Select a payment method",
        oneOf: !gateways?.length
          ? undefined
          : map(gateways, ({ gateway_id, gateway }) => ({
              const: gateway_id,
              title: useTranslateName(gateway)
            }))
      }
    },

    if: {
      properties: {
        type: { const: PaymentType.PAY_IN_FULL }
      }
    },
    then: {
      oneOf: [
        { required: ["gateway_id"] },
        { required: ["payment_details_id"] }
      ]
    }
  };

  return schema as JsonSchema;
};

export const useUischema = () => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      // DISABLED FOR NOW: We only support pay in full for now
      // {
      //   type: "Control",
      //   scope: "#/properties/type",
      //   i18n: "payment_details.type",
      //   options: {
      //     format: "radio",
      //     // layout: "inline",
      //     stretch: true,
      //     layout: paymentTypes?.length >= 3 ? "grid" : "inline",
      //   },
      //   rule: {
      //     effect: "SHOW",
      //     condition: {
      //       scope: "#",
      //       schema: {
      //         required: ["amount"],
      //         properties: {
      //           amount: { not: { const: 0 } },
      //         },
      //       },
      //     },
      //   },
      // },

      {
        type: "Control",
        scope: "#/properties/gateway_id",
        options: {
          format: "radio",
          stretch: true,
          layout: "grid"
        }
        // rule: {
        //   effect: "SHOW",
        //   condition: {
        //     scope: "#",
        //     schema: {
        //       required: ["type", "amount"],
        //       properties: {
        //         amount: { not: { const: 0 } }
        //       }
        //     }
        //   }
        // }
      }
    ]
  };

  return uischema as UISchemaElement;
};
