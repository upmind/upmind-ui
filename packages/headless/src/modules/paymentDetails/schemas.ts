// --- external

// --- internal

// --- utils
import { useTranslateName } from "../../utils";
import { map, values, includes, isEmpty, size, compact } from "lodash-es";

// --- types
import type { PaymentDetailsContext } from "./types";
import {
  type JsonSchema7,
  RuleEffect,
  type JsonSchema,
  type UISchemaElement
} from "@jsonforms/core";
import { useI18n } from "../system";
import { PaymentType } from "@upmind-automation/types";
import { generateResponseUrls, zeroDecimalCurrencies } from "./gateways/utils";

// -----------------------------------------------------------------------------

export function useSchemaDefinitions({
  lookups,
  amount,
  model
}: PaymentDetailsContext): JsonSchema7["definitions"] {
  const { t } = useI18n();

  const definitions = {
    type: {
      type: "string",
      enum: values(lookups.paymentTypes),
      default: PaymentType.PAY_IN_FULL
    },

    amount: {
      type: "number",
      default: amount || 0,
      minimum: 0,
      maximum: amount
    },

    wallet_amount: {
      type: "number",
      minimum: 0,
      default: Math.min(
        model?.amount ?? amount,
        lookups.accountCredit?.total.value || 0
      ),
      maximum: Math.min(
        model?.amount ?? amount,
        lookups.accountCredit?.total.value || 0
      )
    },

    gateway_id: {
      type: ["string", "null"],
      enum: isEmpty(lookups.gateways)
        ? undefined
        : [...map(lookups.gateways, "gateway_id"), null],
      options: map(lookups.gateways, ({ gateway_id, gateway }) => ({
        value: gateway_id,
        label: useTranslateName(gateway)
      }))
    },

    payment_details_id: {
      type: ["string", "null"],
      enum: isEmpty(lookups.storedPaymentMethods)
        ? undefined
        : [...map(lookups.storedPaymentMethods, "id"), null],
      options: map(
        lookups.storedPaymentMethods,
        ({ id, name, cardType, cardExpireDate, meta }) => {
          return {
            value: id,
            label: name,
            text: cardExpireDate
              ? `${t("text.expires_abbr")} ${cardExpireDate}`
              : "",
            appendIcon: { name: cardType, path: "payment-providers" },
            isDefault: meta.isDefault
          };
        }
      )
    }
  };

  return definitions;
}

export const useSchema = (context: PaymentDetailsContext): JsonSchema => {
  // generate our return and cancel urls
  const { cancelUrl, returnUrl } = generateResponseUrls(
    new URL(`order/${context.orderId}`, window.location.origin),
    { orderId: context.orderId }
  );

  const schema = {
    type: "object",
    title: "Payment details",
    required: ["type"],
    definitions: useSchemaDefinitions(context),

    properties: {
      type: { $ref: "#/definitions/type" },
      amount: { $ref: "#/definitions/amount" },
      wallet_amount: { $ref: "#/definitions/wallet_amount" },
      gateway_id: { $ref: "#/definitions/gateway_id" },
      payment_details_id: { $ref: "#/definitions/payment_details_id" },
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
    },

    if: {
      properties: {
        type: { enum: [PaymentType.PAY_IN_FULL, PaymentType.PARTIAL_PAYMENT] }
      }
    },
    then: {
      oneOf: [
        {
          required: ["gateway_id"],
          properties: { payment_details_id: { const: null } }
        },
        {
          required: ["payment_details_id"],
          properties: { gateway_id: { const: null } }
        }
      ]
    }
  };

  return schema as JsonSchema;
};

export const useUischemaDefinitions = ({
  model,
  lookups,
  currency
}: PaymentDetailsContext) => {
  // add our base definitions
  const definitions: Record<string, UISchemaElement> = {
    type: {
      type: "Control",
      scope: "#/properties/type",
      i18n: "form.payment_method_type",
      options: {
        format: "radio"
      }
    },
    amount: {
      type: "Control",
      scope: "#/properties/amount",
      i18n: "form.amount",
      options: {
        type: "currency",
        step: 0.01,
        currency: currency?.code
      },
      rule: {
        effect: RuleEffect.SHOW,
        condition: {
          scope: "#/properties/type",
          schema: {
            enum: [PaymentType.PARTIAL_PAYMENT]
          }
        }
      }
    }
  };

  // conditionally add wallet amount control if we have account credit AND we have an amount to pay
  if (lookups.accountCredit?.total.value && (model?.amount ?? 0) > 0) {
    definitions.wallet_amount = {
      type: "Control",
      scope: "#/properties/wallet_amount",
      options: {
        type: "currency",
        currency: currency?.code,
        noLabel: true,
        step: includes(zeroDecimalCurrencies, currency?.code) ? 1 : 0.01
      }
    };
  }

  // Include payment method controls if lookups exist.
  // Visibility is controlled by the Vue template conditions (meta.hasStoredPaymentMethods, meta.hasGateways).
  // This prevents layout shifts during refresh/transitions.
  if (!isEmpty(lookups?.storedPaymentMethods)) {
    definitions.payment_details_id = {
      type: "Control",
      scope: "#/properties/payment_details_id",
      i18n: "form.payment_details_id",
      options: {
        format: "radio"
      }
    };
  }

  if (!isEmpty(lookups?.gateways)) {
    definitions.gateway_id = {
      type: "Control",
      scope: "#/properties/gateway_id",
      i18n: "form.gateway_id",
      options: {
        width:
          size(lookups?.gateways) === 1 &&
          !includes(lookups.paymentTypes, PaymentType.PAY_LATER)
            ? 1
            : 2
      }
    };
  }

  return compact(values(definitions));
};

export function useUischema(context: PaymentDetailsContext): UISchemaElement {
  const schema = {
    type: "VerticalLayout",
    elements: useUischemaDefinitions(context)
  };

  return schema as UISchemaElement;
}
