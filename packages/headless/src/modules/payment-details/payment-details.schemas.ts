/** @internal */
import {
  type ControlElement,
  type JsonSchema7,
  RuleEffect,
  type JsonSchema,
  type UISchemaElement
} from "@jsonforms/core";
import {
  PaymentType,
  GatewayContext as GatewayCtx
} from "@upmind-automation/types";
import {
  generateResponseUrls,
  zeroDecimalCurrencies
} from "../payment-gateways/payment-gateways.utils";
import { useI18n } from "../system-localisation";
import { useTranslateName } from "../../utils";
import { map, values, includes, isEmpty, size, compact } from "lodash-es";
import type {
  PaymentDetail,
  PaymentDetailsContext
} from "./payment-details.types";
// -----------------------------------------------------------------------------

/**
 * The stored-card pick list — one `enum` member per stored payment method,
 * each with its labelled `option`. `null` stays a member so a form may pick
 * a gateway instead. Shared by the PAY form and any surface that only picks
 * a stored card (e.g. a contract's payment method).
 */
export function useStoredPaymentMethodsSchema(
  storedPaymentMethods?: PaymentDetail[]
): JsonSchema7 {
  const { t } = useI18n();

  return {
    type: ["string", "null"],
    enum: isEmpty(storedPaymentMethods)
      ? undefined
      : [...map(storedPaymentMethods, "id"), null],
    options: map(
      storedPaymentMethods,
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
  } as JsonSchema7;
}

/** The stored-card control — a radio over {@link useStoredPaymentMethodsSchema}. */
export function useStoredPaymentMethodsUischema(
  scope = "#/properties/payment_details_id",
  i18n = "form.payment_details_id"
): ControlElement {
  return {
    type: "Control",
    scope,
    i18n,
    options: {
      format: "radio"
    }
  };
}
// -----------------------------------------------------------------------------

export function useSchemaDefinitions({
  lookups,
  amount,
  model
}: PaymentDetailsContext): JsonSchema7["definitions"] {
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
        label: useTranslateName(gateway),
        provider: gateway?.provider
      }))
    },

    payment_details_id: useStoredPaymentMethodsSchema(
      lookups.storedPaymentMethods
    )
  };

  return definitions;
}

// --- pay schema

/**
 * The BASE return legs — no operation reference.
 *
 * This schema is rebuilt on EVERY validation and pins `return_url` /
 * `cancel_url` with `const`, so whatever it emits must be deterministic. The
 * operation reference is not: it is minted once, at the point the payment
 * actually leaves for the gateway, and stamped onto the OUTBOUND payload there
 * (`stampPayOperation`). Minting here instead produced a fresh const on every
 * build — the model still carried the previous URL, so `validate()` failed every
 * off-site gateway and each keystroke leaked another operation.
 */
const usePaySchema = (context: PaymentDetailsContext): JsonSchema => {
  const { cancelUrl, returnUrl } = generateResponseUrls(
    new URL(`order/${context.orderId}`, window.location.origin)
  );

  return {
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
  } as JsonSchema;
};

// --- add schema

const useAddSchema = (context: PaymentDetailsContext): JsonSchema => {
  return {
    type: "object",
    title: "Payment details",
    required: ["gateway_id"],
    definitions: useSchemaDefinitions(context),

    properties: {
      gateway_id: { $ref: "#/definitions/gateway_id" }
    }
  } as JsonSchema;
};

export const useSchema = (context: PaymentDetailsContext): JsonSchema => {
  return context.ctx === GatewayCtx.ADD
    ? useAddSchema(context)
    : usePaySchema(context);
};

// --- pay uischema

export const usePayUischemaDefinitions = ({
  model,
  lookups,
  currency
}: PaymentDetailsContext) => {
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
    definitions.payment_details_id = useStoredPaymentMethodsUischema();
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

const usePayUischema = (context: PaymentDetailsContext): UISchemaElement => {
  return {
    type: "VerticalLayout",
    elements: usePayUischemaDefinitions(context)
  } as UISchemaElement;
};

// --- add uischema

const useAddUischemaDefinitions = ({ lookups }: PaymentDetailsContext) => {
  const definitions: Record<string, UISchemaElement> = {};

  if (!isEmpty(lookups?.gateways)) {
    definitions.gateway_id = {
      type: "Control",
      scope: "#/properties/gateway_id",
      i18n: "form.gateway_id",
      options: {
        width: size(lookups?.gateways) === 1 ? 1 : 2
      }
    };
  }

  return compact(values(definitions));
};

const useAddUischema = (context: PaymentDetailsContext): UISchemaElement => {
  return {
    type: "VerticalLayout",
    elements: useAddUischemaDefinitions(context)
  } as UISchemaElement;
};

export function useUischema(context: PaymentDetailsContext): UISchemaElement {
  return context.ctx === GatewayCtx.ADD
    ? useAddUischema(context)
    : usePayUischema(context);
}
