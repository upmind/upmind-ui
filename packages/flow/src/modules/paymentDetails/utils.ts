// --- external
import { spawn } from "xstate";

// --- internal
// import cardMachine from "./gateways/card/card.machine";
import stripeMachine from "./gateways/stripe/stripe.machine";
// import bankTransferMachine from "./gateways/bankTransfer/bankTransfer.machine";
// import directDebitMachine from "./gateways/directDebit/directDebit.machine";
// import sepaMachine from "./gateways/sepa/sepa.machine";
// import mobileMachine from "./gateways/mobile/mobile.machine";
// import offlineMachine from "./gateways/offline/offline.machine";
// import externalMachine from "./gateways/external/external.machine";

// --- utils
import { defaultsDeep, get, map, reduce, set } from "lodash-es";

// --- types

import {
  PaymentTypes,
  GatewayContext,
  GatewayTypes,
  GatewayProviderCodes
} from "./types.d";

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

// --------------------------------------------------------
// Gateway Machine Spawner (Factory)

export function spawnGateway({ gateway, amount, currency }) {
  // lets spawn and return the appropriate machine based on the gateway
  // the order her eis important and matches the original order in the legacy app

  // if (isCard(gateway)) return spawnCard({ gateway, amount, currency });

  if (isStripe(gateway)) return spawnStripe({ gateway, amount, currency });

  // if (isBankTransfer(gateway))
  //   return spawnBankTransfer({ gateway, amount, currency });

  // if (isDirectDebit(gateway))
  //   return spawnDirectDebit({ gateway, amount, currency });

  // if (isSEPA(gateway)) return spawnSEPA({ gateway, amount, currency });

  // if (isMobile(gateway)) return spawnMobile({ gateway, amount, currency });

  // if (isOffline(gateway)) return spawnOffline({ gateway, amount, currency });

  // if (isExternal(gateway)) return spawnExternal({ gateway, amount, currency });

  return null; // TODO provide a basic "renderless" machine as a fallback
}

// --------------------------------------------------------
// Individual Gateway Machine Spawners

// export function spawnCard({ gateway, amount, currency }) {
//   return spawn(
//     cardMachine.withContext({
//       gateway,
//       ctx: GatewayContext.PAY,
//       amount: amount || 0,
//       currency,
//       type: GatewayTypes.CARD
//     }),
//     { name: gateway.id, sync: true }
//   );
// }

export function spawnStripe({ gateway, amount, currency }) {
  return spawn(
    stripeMachine.withContext({
      gateway,
      ctx: GatewayContext.PAY,
      amount: amount || 0,
      currency,
      type: GatewayTypes.CARD
    }),
    { name: gateway.id, sync: true }
  );
}

// export function spawnBankTransfer({ gateway, amount, currency }) {
//   return spawn(
//     bankTransferMachine.withContext({
//       gateway,
//       ctx: GatewayContext.PAY,
//       amount: amount || 0,
//       currency,
//       type: GatewayTypes.BANK_TRANSFER
//     }),
//     { name: gateway.id, sync: true }
//   );
// }

// export function spawnDirectDebit({ gateway, amount, currency }) {
//   return spawn(
//     directDebitMachine.withContext({
//       gateway,
//       ctx: GatewayContext.PAY,
//       amount: amount || 0,
//       currency,
//       type: GatewayTypes.DIRECT_DEBIT
//     }),
//     { name: gateway.id, sync: true }
//   );
// }

// export function spawnSEPA({ gateway, amount, currency }) {
//   return spawn(
//     sepaMachine.withContext({
//       gateway,
//       ctx: GatewayContext.PAY,
//       amount: amount || 0,
//       currency,
//       type: GatewayTypes.DIRECT_DEBIT
//     }),
//     { name: gateway.id, sync: true }
//   );
// }

// export function spawnMobile({ gateway, amount, currency }) {
//   return spawn(
//     mobileMachine.withContext({
//       gateway,
//       ctx: GatewayContext.PAY,
//       amount: amount || 0,
//       currency,
//       type: GatewayTypes.MOBILE
//     }),
//     { name: gateway.id, sync: true }
//   );
// }

// export function spawnOffline({ gateway, amount, currency }) {
//   return spawn(
//     offlineMachine.withContext({
//       gateway,
//       ctx: GatewayContext.PAY,
//       amount: amount || 0,
//       currency,
//       type: GatewayTypes.OFFLINE
//     }),
//     { name: gateway.id, sync: true }
//   );
// }

// export function spawnExternal({ gateway, amount, currency }) {
//   return spawn(
//     externalMachine.withContext({
//       gateway,
//       ctx: GatewayContext.PAY,
//       amount: amount || 0,
//       currency,
//       type: gateway?.gateway_provider.external_store
//     }),
//     { name: gateway.id, sync: true }
//   );
// }

// --------------------------------------------------------
// Gateway Type Checks

const isCard = gateway => gateway.type === GatewayTypes.CARD;

const isStripe = gateway =>
  gateway?.gateway_provider?.code === GatewayProviderCodes.STRIPE &&
  !!gateway?.use_frontend_implementation;

const isBankTransfer = gateway => gateway.type === GatewayTypes.BANK_TRANSFER;

const isDirectDebit = gateway => gateway.type === GatewayTypes.DIRECT_DEBIT;

const isSEPA = gateway => gateway.type === GatewayTypes.SEPA;

const isMobile = gateway => gateway.type === GatewayTypes.MOBILE;

const isOffline = gateway => gateway.type === GatewayTypes.OFFLINE;

const isExternal = gateway =>
  gateway.type === gateway?.gateway_provider.external_store;
