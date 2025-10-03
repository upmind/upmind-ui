// --- external

// --- internal

// --- utils
import { useTranslateName } from "../../utils";
import { omit, map } from "lodash-es";

// --- types
import { PaymentType, QUERY_PARAMS } from "@upmind-automation/types";
import type { PaymentDetailsContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { generateResponseUrls } from "./gateways/utils";

// -----------------------------------------------------------------------------

export const useSchema = ({
  paymentTypes,
  gateways,
  storedPaymentMethods,
  orderId
}: PaymentDetailsContext): JsonSchema => {
  const { cancel, success, fail } = generateResponseUrls(
    window.location.origin,
    { orderId }
  );
  debugger;
  const schema = {
    type: "object",
    title: "Payment details",
    required: ["type"],

    properties: {
      type: {
        type: "string",
        title: "Payment type",
        const: PaymentType.PAY_IN_FULL,
        enum: !paymentTypes?.length ? undefined : map(paymentTypes, "value"),
        options: !paymentTypes
          ? undefined
          : map(paymentTypes, (value, key) => ({
              const: value,
              title: key
            }))
      },
      gatewayId: {
        type: ["string", "null"],
        title: "Select a payment method",
        enum: !gateways?.length
          ? undefined
          : [...map(gateways, "gateway_id"), null],
        options: !gateways?.length
          ? undefined
          : map(gateways, ({ gateway_id, gateway }) => ({
              value: gateway_id,
              label: useTranslateName(gateway)
            }))
      },
      paymentDetailId: {
        type: ["string", "null"],
        title: "Select one of your stored payment methods",
        enum: !storedPaymentMethods?.length
          ? undefined
          : [...map(storedPaymentMethods, "id"), null],
        options: !storedPaymentMethods
          ? undefined
          : map(
              storedPaymentMethods,
              ({ id, name, cardType, cardExpireDate }) => {
                return {
                  value: id,
                  label: name,
                  text: cardExpireDate ? `Exp ${cardExpireDate}` : "",
                  appendIcon: { name: cardType, path: "payment-providers" }
                };
              }
            )
      },
      returnUrl: {
        type: "string",
        format: "uri-reference",
        const: `?${QUERY_PARAMS.SUCCESS}=${encodeURIComponent(success)}&${QUERY_PARAMS.FAILED}=${encodeURIComponent(fail)}`
      },
      cancelUrl: {
        type: "string",
        format: "uri",
        const: cancel
      }
    }

    // if: {
    //   properties: {
    //     type: { const: PaymentType.PAY_IN_FULL }
    //   }
    // },
    // then: {
    //   oneOf: [{ required: ["gatewayId"] }, { required: ["paymentDetailId"] }]
    // }
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
        scope: "#/properties/paymentDetailId",
        i18n: "form.payment_details_id",
        options: {
          format: "radio"
        }
      }
    ]
  };

  return uischema as UISchemaElement;
};
