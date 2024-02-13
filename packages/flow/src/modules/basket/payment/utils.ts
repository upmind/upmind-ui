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
  isEmpty
} from "lodash-es";

// --- types
import type { IPaymentDetail, PaymentDetailsContext } from "./types.d";
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

  // append our gateway specific schema
  const gatewaySchema = getGatewaySchema(model?.gateway_id, gateways);
  if (!isEmpty(gatewaySchema?.properties)) {
    schema.properties = merge(schema.properties, gatewaySchema?.properties);
    schema.required = concat(schema.required, gatewaySchema?.required);
  }

  return schema;
};

const getGatewaySchema = (gateway_id, providers) => {
  const gatewayProvider = find(providers, ["gateway_id", gateway_id]);
  switch (gatewayProvider?.gateway?.type) {
    case GatewayTypes.CARD:
      return useCardSchema();
    case GatewayTypes.BANK_TRANSFER:
      return useBankTransferSchema();
    case GatewayTypes.DIRECT_DEBIT:
      return useDirectDebitCardSchema();
    case GatewayTypes.SEPA:
      return useSepaCardSchema();
    case GatewayTypes.OFFLINE:
      return useOfflineCardSchema();
    case GatewayTypes.MOBILE:
      return useMobileCardSchema();
    case GatewayTypes.WALLET:
      return useWalletCardSchema();

    default:
      return null;
  }
};

const useCardSchema = () => ({
  required: ["card_number", "expiry_date", "cvv"],
  properties: {
    card_number: { type: "string", title: "Card Number" },
    expiry_date: { type: "string", title: "Expiry Date" },
    cvv: { type: "string", title: "CVV" }
  }
});
const useBankTransferSchema = () => {};
const useDirectDebitCardSchema = () => {};
const useSepaCardSchema = () => {};
const useOfflineCardSchema = () => {};
const useMobileCardSchema = () => {};
const useWalletCardSchema = () => {};

// ---

export const useUischema = ({
  currency,
  model,
  gateways
}: PaymentDetailsContext) => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/amount",
        options: {
          prefix: currency.prefix,
          suffix: currency.suffix
        }
      },
      {
        type: "Control",
        scope: "#/properties/type",
        options: {
          format: "radio"
        }
      },
      {
        type: "Control",
        scope: "#/properties/gateway_id",
        options: {
          format: "radio"
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

  // append our gateway specific uischema
  const gatewayUischema = getGatewayUischema(model?.gateway_id, gateways);
  if (!isEmpty(gatewayUischema?.elements)) {
    debugger;
    uischema.elements = concat(uischema.elements, gatewayUischema?.elements);
  }

  return uischema as UISchemaElement;
};

const getGatewayUischema = (gateway_id, providers) => {
  const gatewayProvider = find(providers, ["gateway_id", gateway_id]);

  switch (gatewayProvider?.gateway?.type) {
    case GatewayTypes.CARD:
      return useCardUischema();
    case GatewayTypes.BANK_TRANSFER:
      return useBankTransferUischema();
    case GatewayTypes.DIRECT_DEBIT:
      return useDirectDebitCardUischema();
    case GatewayTypes.SEPA:
      return useSepaCardUischema();
    case GatewayTypes.OFFLINE:
      return useOfflineCardUischema();
    case GatewayTypes.MOBILE:
      return useMobileCardUischema();
    case GatewayTypes.WALLET:
      return useWalletCardUischema();

    default:
      return null;
  }
};

const useCardUischema = () => ({
  elements: [
    {
      type: "Group",
      label: "Card Details",
      options: {
        styles: {
          group: {
            root: "group bg-base-300",
            label: "group-label divider ",
            item: "group-item"
          }
        }
      },
      elements: [
        {
          type: "Control",
          scope: "#/properties/card_number",
          options: {}
        },
        {
          type: "Control",
          scope: "#/properties/expiry_date",
          options: {}
        },
        {
          type: "Control",
          scope: "#/properties/cvv",
          options: {}
        }
      ]
    }
  ]
});
const useBankTransferUischema = () => [];
const useDirectDebitCardUischema = () => [];
const useSepaCardUischema = () => [];
const useOfflineCardUischema = () => [];
const useMobileCardUischema = () => [];
const useWalletCardUischema = () => [];

// ---

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
