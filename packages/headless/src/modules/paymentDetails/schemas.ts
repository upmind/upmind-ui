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
import { useI18n } from "../system";

// -----------------------------------------------------------------------------

export const useSchema = ({
  paymentTypes,
  gateways,
  storedPaymentMethods,
  orderId
}: PaymentDetailsContext): JsonSchema => {
  const { t } = useI18n();

  const { cancelUrl, returnUrl } = generateResponseUrls(
    new URL(`order/${orderId}`, window.location.origin),
    { orderId }
  );
  const schema = {
    type: "object",
    title: "Payment details",
    required: ["type"],

    properties: {
      type: {
        type: "string",
        title: "Payment type",
        enum: !paymentTypes?.length ? undefined : map(paymentTypes, "value"),
        options: !paymentTypes
          ? undefined
          : map(paymentTypes, (value, key) => ({
              const: value,
              title: key
            }))
      },
      gateway_id: {
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
      payment_details_id: {
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
                  text: cardExpireDate
                    ? `${t("text.expires_abbr")} ${cardExpireDate}`
                    : "",
                  appendIcon: { name: cardType, path: "payment-providers" }
                };
              }
            )
      },
      return_url: {
        type: "string",
        format: "uri-reference",
        const: returnUrl
      },
      cancel_url: {
        type: "string",
        format: "uri",
        const: cancelUrl
      }
    }

    // if: {
    //   properties: {
    //     type: { const: PaymentType.PAY_IN_FULL }
    //   }
    // },
    // then: {
    //   oneOf: [{ required: ["gateway_id"] }, { required: ["payment_details_id"] }]
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
        scope: "#/properties/payment_details_id",
        i18n: "form.payment_details_id",
        options: {
          format: "radio"
        }
      }
    ]
  };

  return uischema as UISchemaElement;
};
