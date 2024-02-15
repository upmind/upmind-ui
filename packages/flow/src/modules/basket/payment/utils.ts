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

  // append our gateway specific schema,
  // NB: we use this function as some of the conditions to apply the schema
  // cannot be determined from within the schema directly, eg using gateway type from the gateway based on gateway_id
  // so the use of allOf or anyOf is not possible
  const gatewaySchema = getGatewaySchema(model?.gateway_id, gateways);
  if (!isEmpty(gatewaySchema?.properties)) {
    schema.properties = merge(schema.properties, gatewaySchema?.properties);
    schema.required = concat(schema.required, gatewaySchema?.required);
  }

  return schema;
};
const getGatewaySchema = (gateway_id, gateways) => {
  const brandGateway = find(gateways, ["gateway_id", gateway_id]);
  const gateway_provider = get(brandGateway, "gateway.gateway_provider", {});

  // ---
  const isExternal = get(gateway_provider, "external_payment", false);
  if (isExternal) return useExternalCardSchema(gateway_provider);

  // ---
  switch (brandGateway?.gateway?.type) {
    case GatewayTypes.CARD:
      return useCardSchema(gateway_provider);
    case GatewayTypes.BANK_TRANSFER:
      return useBankTransferSchema(gateway_provider);
    case GatewayTypes.DIRECT_DEBIT:
      return useDirectDebitCardSchema(gateway_provider);
    case GatewayTypes.SEPA:
      return useSepaCardSchema(gateway_provider);
    case GatewayTypes.OFFLINE:
      return useOfflineCardSchema(gateway_provider);
    case GatewayTypes.MOBILE:
      return useMobileCardSchema(gateway_provider);
    case GatewayTypes.WALLET:
      return useWalletCardSchema(gateway_provider);

    default:
      return null;
  }
};
const useExternalCardSchema = gateway_provider => ({
  required: ["external"],
  properties: {
    requires_address: {
      type: "boolean",
      title: "Requires Address",
      const: get(gateway_provider, "needs_address", false)
    },
    external: {
      type: "boolean",
      title: "Use external payment gateway",
      const: true
    }
  }
});
const useCardSchema = gateway_provider => {
  const schema = {
    required: ["card_num", "card_expiry", "card_cvv"],
    properties: {
      cardholder_name: { type: "string", title: "Cardholder Name" },
      card_num: {
        type: "string",
        title: "Card Number",
        description: "The 16 digit number on the front of your card.",
        minLength: 0,
        maxLength: 22,
        pattern: "[0-9]*"
      },
      card_expiry: {
        type: "string",
        description: 'Expiry Date of the card. Date Format: MM/YY"',
        title: "Expiry Date",
        pattern: "^(0[1-9]|1[0-2])/[0-9]{2}$"
      },
      card_cvv: {
        type: "string",
        title: "CVV",
        description:
          "card security code found on the back of your card that provides an additional measure of credit card security.",
        pattern: "^[0-9]*$",
        minLength: 3,
        maxLength: 5
      }, // todo: get from gateway card type cvv_length
      external: {
        type: "boolean",
        title: "Use external payment gateway",
        const: false
      }
    }
  };

  // conditioanlly add the cardholder_name to the required fields
  if (gateway_provider?.requires_name) {
    schema.required.push("cardholder_name");
  }

  return schema;
};
const useBankTransferSchema = gateway_provider => {};
const useDirectDebitCardSchema = gateway_provider => {};
const useSepaCardSchema = gateway_provider => {};
const useOfflineCardSchema = gateway_provider => {};
const useMobileCardSchema = gateway_provider => {};
const useWalletCardSchema = gateway_provider => {};

// --------------------------------------------------------

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
          prefix: currency?.prefix,
          suffix: currency?.suffix
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
    uischema.elements = concat(uischema.elements, gatewayUischema?.elements);
  }

  return uischema as UISchemaElement;
};
const getGatewayUischema = (gateway_id, gateways) => {
  const brandGateway = find(gateways, ["gateway_id", gateway_id]);
  const gateway_provider = get(brandGateway, "gateway.gateway_provider", {});

  // ---
  const isExternal = get(gateway_provider, "external_payment", false);
  if (isExternal) return useExternalCardUischema(gateway_provider);

  // ---

  switch (brandGateway?.gateway?.type) {
    case GatewayTypes.CARD:
      return useCardUischema(gateway_provider);
    case GatewayTypes.BANK_TRANSFER:
      return useBankTransferUischema(gateway_provider);
    case GatewayTypes.DIRECT_DEBIT:
      return useDirectDebitCardUischema(gateway_provider);
    case GatewayTypes.SEPA:
      return useSepaCardUischema(gateway_provider);
    case GatewayTypes.OFFLINE:
      return useOfflineCardUischema(gateway_provider);
    case GatewayTypes.MOBILE:
      return useMobileCardUischema(gateway_provider);
    case GatewayTypes.WALLET:
      return useWalletCardUischema(gateway_provider);

    default:
      return null;
  }
};
const useExternalCardUischema = gateway_provider => [];
const useCardUischema = gateway_provider => ({
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
          scope: "#/properties/cardholder_name",
          options: {
            autocomplete: "cc-name"
          },
          // only show this field if its in the required fields
          // as NOT ALL gateways require the cardholder_name
          rule: {
            effect: "SHOW",
            condition: {
              scope: "#/required",
              schema: { enum: ["cardholder_name"] }
            }
          }
        },
        {
          type: "Control",
          scope: "#/properties/card_num",
          options: {
            autocomplete: "cc-number"
          }
        },
        {
          type: "HorizontalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/card_expiry",
              options: {
                autocomplete: "cc-exp",
                trim: true
              }
            },
            {
              type: "Control",
              scope: "#/properties/card_cvv",
              options: {
                autocomplete: "cc-csc",
                trim: true
              }
            }
          ]
        }
      ]
    }
  ]
});
const useBankTransferUischema = gateway_provider => [];
const useDirectDebitCardUischema = gateway_provider => [];
const useSepaCardUischema = gateway_provider => [];
const useOfflineCardUischema = gateway_provider => [];
const useMobileCardUischema = gateway_provider => [];
const useWalletCardUischema = gateway_provider => [];

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
