// --- external
import { spawn } from "xstate";

// --- internal
import gatewayMachine from "./gateways/gateway.machine";
import stripeMachine from "./gateways/stripe/stripe.machine";
import cardConfig from "./gateways/card";

// --- utils
import { map } from "lodash-es";

// --- types
import { PaymentTypes } from "./types.d";
import {
  GatewayCtx,
  GatewayTypes,
  GatewayProviderCodes,
} from "./gateways/types.d";

import type { PaymentDetailsContext } from "./types.d";
import type { UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = ({
  payment_types,
  gateways,
}: PaymentDetailsContext) => {
  const schema = {
    type: "object",
    title: "Payment details",
    required: ["amount", "type"],

    properties: {
      amount: {
        type: "number",
        title: "Amount",
        readOnly: true,
        exclusiveMinimum: 0,
      },
      type: {
        type: "string",
        title: "Payment type",
        default: PaymentTypes.PAY_IN_FULL,
        oneOf: !payment_types
          ? undefined
          : map(payment_types, (value, key) => ({
              const: value,
              title: key,
            })),
      },
      gateway_id: {
        type: ["string", "null"],
        title: "Select a payment method",
        oneOf: !gateways?.length
          ? undefined
          : map(gateways, ({ gateway_id, gateway }) => ({
              const: gateway_id,
              title: gateway.name,
            })),
      },
    },

    if: {
      properties: {
        type: { const: PaymentTypes.PAY_IN_FULL },
      },
    },
    then: {
      required: ["gateway_id"],
    },
  };

  return schema;
};

// --------------------------------------------------------

export const useUischema = ({
  payment_types,
  gateways,
}: PaymentDetailsContext) => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/type",
        i18n: "basket.payment_details.type",
        options: {
          format: "radio",
          // layout: "inline",
          stretch: true,
          layout: payment_types?.length >= 3 ? "grid" : "inline",
        },
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#/properties/amount",
            schema: { not: { const: 0 } },
          },
        },
      },
      {
        type: "Control",
        scope: "#/properties/gateway_id",
        options: {
          format: "radio",
          // layout: "inline",
          stretch: true,
          layout: gateways?.length >= 3 ? "grid" : "inline",
        },
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#",
            schema: {
              required: ["type", "amount"],
              amount: { not: { const: 0 } },
              type: { const: PaymentTypes.PAY_IN_FULL },
            },
          },
        },
      },
    ],
  };

  return uischema as UISchemaElement;
};

// --------------------------------------------------------
// Gateway Machine Spawner (Factory)

export function spawnGateway({ basket_id, gateway, amount, currency }) {
  // lets spawn and return the appropriate machine based on the gateway
  // the order her eis important and matches the original order in the legacy app

  if (isStripe(gateway))
    return spawnStripe({ basket_id, gateway, amount, currency });

  if (isBankTransfer(gateway))
    return spawnGenericGateway(GatewayTypes.BANK_TRANSFER, {
      basket_id,
      gateway,
      amount,
      currency,
      renderless: true,
    });

  if (isDirectDebit(gateway))
    return spawnGenericGateway(GatewayTypes.DIRECT_DEBIT, {
      basket_id,
      gateway,
      amount,
      currency,
      renderless: true,
    });

  if (isSEPA(gateway))
    return spawnGenericGateway(GatewayTypes.SEPA, {
      basket_id,
      gateway,
      amount,
      currency,
      renderless: true,
    });

  if (isMobile(gateway))
    return spawnGenericGateway(GatewayTypes.MOBILE, {
      basket_id,
      gateway,
      amount,
      currency,
      renderless: true,
    });

  if (isOffline(gateway))
    return spawnGenericGateway(GatewayTypes.OFFLINE, {
      basket_id,
      gateway,
      amount,
      currency,
      renderless: true,
    });

  if (isExternal(gateway))
    return spawnExternal({ basket_id, gateway, amount, currency });

  if (isCard(gateway))
    return spawnCard({ basket_id, gateway, amount, currency });

  return null;
}

// --------------------------------------------------------
// Individual Gateway Machine Spawners

export function spawnCard({ basket_id, gateway, amount, currency }) {
  return spawn(
    gatewayMachine.withConfig(cardConfig).withContext({
      basket_id,
      gateway,
      amount: amount || 0,
      currency,
      type: GatewayTypes.CARD,
    }),
    { name: gateway.id, sync: true }
  );
}

export function spawnStripe({ basket_id, gateway, amount, currency }) {
  return spawn(
    stripeMachine.withContext({
      basket_id,
      gateway,
      ctx: GatewayCtx.PAY,
      amount: amount || 0,
      currency,
      type: GatewayTypes.CARD,
    }),
    { name: gateway.id, sync: true }
  );
}

// Our generic gateway machine
export function spawnGenericGateway(
  type,
  { basket_id, gateway, amount, currency, renderless = false }
) {
  return spawn(
    gatewayMachine.withContext({
      basket_id,
      gateway,
      amount: amount || 0,
      currency,
      type,
      renderless,
    }),
    { name: gateway.id, sync: true }
  );
}

export function spawnExternal({ basket_id, gateway, amount, currency }) {
  return spawn(
    gatewayMachine.withContext({
      basket_id,
      gateway,
      amount: amount || 0,
      currency,
      type: gateway?.gateway_provider.external_store,
    }),
    { name: gateway.id, sync: true }
  );
}

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
