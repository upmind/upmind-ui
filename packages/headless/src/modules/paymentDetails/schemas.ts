// --- external

// --- internal

// --- utils
import { useTranslateName } from "../../utils";
import { map, filter } from "lodash-es";

// --- types
import { PaymentType, QUERY_PARAMS } from "@upmind-automation/types";
import type { PaymentDetailsContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { useI18n } from "../system";

// -----------------------------------------------------------------------------

export const useSchema = ({
  paymentTypes,
  gateways,
  storedPaymentMethods,
  orderId
}: PaymentDetailsContext): JsonSchema => {
  const { t } = useI18n();

  const suppotedPaymentMethods = filter(
    storedPaymentMethods,
    method => method?.meta.isSupported
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
        enum: !suppotedPaymentMethods?.length
          ? undefined
          : [...map(suppotedPaymentMethods, "id"), null],
        options: !suppotedPaymentMethods
          ? undefined
          : map(
              suppotedPaymentMethods,
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
        readonly: true
      },
      cancel_url: {
        type: "string",
        format: "uri",
        readonly: true
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
