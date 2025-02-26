// --- external
import { spawn } from "xstate";

// --- internal
import gatewayMachine from "./gateways/gateway.machine";
import stripeMachine from "./gateways/stripe/stripe.machine";
import cardConfig from "./gateways/card";
import storedConfig from "./gateways/stored";

// --- utils
import { useTranslateName } from "../../utils";
import { omit, map } from "lodash-es";

// --- types
import { GatewayCtx, GatewayTypes } from "./gateways/types";
import { GatewayProviderCodes, PaymentType } from "@upmind-automation/types";
import type { PaymentDetailsContext } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const parsePaymentDetails = (raw: any): Record<string, any> => {
  // TODO: map the actual allowed params fr the endpoint
  return omit(raw, ["can_store"]);
};
// --------------------------------------------------------

export const useSchema = ({
  payment_types,
  gateways,
}: PaymentDetailsContext): JsonSchema => {
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
        const: PaymentType.PAY_IN_FULL,
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
              title: useTranslateName(gateway),
            })),
      },
    },

    if: {
      properties: {
        type: { const: PaymentType.PAY_IN_FULL },
      },
    },
    then: {
      oneOf: [
        { required: ["gateway_id"] },
        { required: ["payment_details_id"] },
      ],
    },
  };

  return schema as JsonSchema;
};

// --------------------------------------------------------

export const useUischema = () => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      // DISABLED FOR NOW: We only support pay in full for now
      // {
      //   type: "Control",
      //   scope: "#/properties/type",
      //   i18n: "basket.payment_details.type",
      //   options: {
      //     format: "radio",
      //     // layout: "inline",
      //     stretch: true,
      //     layout: payment_types?.length >= 3 ? "grid" : "inline",
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
          layout: "grid",
        },
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#",
            schema: {
              required: ["type", "amount"],
              properties: {
                amount: { not: { const: 0 } },
              },
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

export function spawnGateway({
  basketId,
  gateway,
  amount,
  currency,
  stored_payment_methods,
  address,
}: any) {
  // lets spawn and return the appropriate machine based on the gateway
  // the order her eis important and matches the original order in the legacy app
  if (!amount || !gateway) {
    return spawnGenericGateway(GatewayTypes.FREE, {
      basketId,
      gateway,
      amount,
      currency,
      renderless: true,
    });
  }
  if (isStored(gateway)) {
    return spawnStored({
      basketId,
      amount,
      currency,
      stored_payment_methods,
    });
  }
  if (isStripe(gateway))
    return spawnStripe({ basketId, gateway, amount, currency, address } as any);
  if (isBankTransfer(gateway))
    return spawnGenericGateway(GatewayTypes.BANK_TRANSFER, {
      basketId,
      gateway,
      amount,
      currency,
      renderless: true,
    });
  if (isDirectDebit(gateway))
    return spawnGenericGateway(GatewayTypes.DIRECT_DEBIT, {
      basketId,
      gateway,
      amount,
      currency,
      renderless: true,
    });
  if (isSEPA(gateway))
    return spawnGenericGateway(GatewayTypes.SEPA, {
      basketId,
      gateway,
      amount,
      currency,
      renderless: true,
      address,
    });
  if (isMobile(gateway))
    return spawnGenericGateway(GatewayTypes.MOBILE, {
      basketId,
      gateway,
      amount,
      currency,
      renderless: true,
      address,
    });
  if (isOffline(gateway))
    return spawnGenericGateway(GatewayTypes.OFFLINE, {
      basketId,
      gateway,
      amount,
      currency,
      renderless: true,
    });
  if (isExternal(gateway))
    return spawnExternal({
      basketId,
      gateway,
      amount,
      currency,
    });
  if (isCard(gateway))
    return spawnCard({ basketId, gateway, amount, currency });

  return null;
}

// --------------------------------------------------------
// Individual Gateway Machine Spawners

export function spawnStored({
  basketId,
  amount,
  currency,
  stored_payment_methods,
}: any) {
  return spawn(
    gatewayMachine.withConfig(storedConfig as any).withContext({
      stored_payment_methods,
      basketId,
      amount,
      currency,
      type: GatewayTypes.STORED,
    }),
    { name: "stored", sync: true }
  );
}

export function spawnCard({ basketId, gateway, amount, currency }: any) {
  return spawn(
    gatewayMachine.withConfig(cardConfig as any).withContext({
      basketId,
      gateway,
      amount,
      currency,
      type: GatewayTypes.CARD,
      code: gateway?.gateway_provider.code,
    }),
    { name: gateway.id, sync: true }
  );
}

export function spawnStripe({
  basketId,
  gateway,
  amount,
  currency,
  address,
}: PaymentDetailsContext) {
  return spawn(
    stripeMachine.withContext({
      basketId,
      gateway,
      ctx: GatewayCtx.PAY,
      amount,
      currency,
      type: GatewayTypes.CARD,
      code: gateway?.gateway_provider.code,
      address,
    } as any),
    { name: gateway?.id, sync: true }
  );
}

// Our generic gateway machine
export function spawnGenericGateway(
  type: any,
  { basketId, gateway, amount, currency, renderless = false }: any
) {
  return spawn(
    gatewayMachine.withContext({
      basketId,
      gateway,
      amount: amount || 0,
      currency,
      type,
      code: gateway?.gateway_provider.code,
      renderless,
    }),
    { name: gateway?.id, sync: true }
  );
}

export function spawnExternal({ basketId, gateway, amount, currency }: any) {
  return spawn(
    gatewayMachine.withContext({
      basketId,
      gateway,
      amount,
      currency,
      type: GatewayTypes.CARD,
      code: gateway?.gateway_provider.code,
      // external: gateway?.gateway_provider.external_payment,
    }),
    { name: gateway.id, sync: true }
  );
}

// --------------------------------------------------------
// Gateway Type Checks

const isStored = (gateway: any) => gateway.type === GatewayTypes.STORED;

const isCard = (gateway: any) => gateway.type === GatewayTypes.CARD;

const isStripe = (gateway: any) =>
  gateway?.gateway_provider?.code === GatewayProviderCodes.STRIPE &&
  !!gateway?.use_frontend_implementation;

const isBankTransfer = (gateway: any) =>
  gateway.type === GatewayTypes.BANK_TRANSFER;

const isDirectDebit = (gateway: any) =>
  gateway.type === GatewayTypes.DIRECT_DEBIT;

const isSEPA = (gateway: any) => gateway.type === GatewayTypes.SEPA;

const isMobile = (gateway: any) => gateway.type === GatewayTypes.MOBILE;

const isOffline = (gateway: any) => gateway.type === GatewayTypes.OFFLINE;

const isExternal = (gateway: any) =>
  gateway.type === GatewayTypes.CARD &&
  gateway?.gateway_provider.external_payment;
