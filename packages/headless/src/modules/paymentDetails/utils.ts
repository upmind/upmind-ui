// --- external
import { spawn } from "xstate";

// --- internal
import gatewayMachine from "./gateways/gateway.machine";
import stripeMachine from "./gateways/stripe/stripe.machine";
import cardConfig from "./gateways/card";
import storedConfig from "./gateways/stored";

// --- utils

// --- types
import { GatewayCtx, GatewayTypes } from "./gateways/types";
import { GatewayProviderCodes } from "@upmind-automation/types";
import type { PaymentDetailsContext } from "./types";

// -----------------------------------------------------------------------------

export function spawnGateway({
  orderId,
  gateway,
  amount,
  currency,
  storedPaymentMethods,
  address
}: any) {
  // lets spawn and return the appropriate machine based on the gateway
  // the order her eis important and matches the original order in the legacy app
  if (!amount || !gateway) {
    return spawnGenericGateway(GatewayTypes.FREE, {
      orderId,
      gateway,
      amount,
      currency,
      renderless: true
    });
  }
  if (isStored(gateway)) {
    return spawnStored({
      orderId,
      amount,
      currency,
      storedPaymentMethods
    });
  }
  if (isStripe(gateway))
    return spawnStripe({ orderId, gateway, amount, currency, address } as any);
  if (isBankTransfer(gateway))
    return spawnGenericGateway(GatewayTypes.BANK_TRANSFER, {
      orderId,
      gateway,
      amount,
      currency,
      renderless: true
    });
  if (isDirectDebit(gateway))
    return spawnGenericGateway(GatewayTypes.DIRECT_DEBIT, {
      orderId,
      gateway,
      amount,
      currency,
      renderless: true
    });
  if (isSEPA(gateway))
    return spawnGenericGateway(GatewayTypes.SEPA, {
      orderId,
      gateway,
      amount,
      currency,
      renderless: true,
      address
    });
  if (isMobile(gateway))
    return spawnGenericGateway(GatewayTypes.MOBILE, {
      orderId,
      gateway,
      amount,
      currency,
      renderless: true,
      address
    });
  if (isOffline(gateway))
    return spawnGenericGateway(GatewayTypes.OFFLINE, {
      orderId,
      gateway,
      amount,
      currency,
      renderless: true
    });
  if (isExternalCard(gateway))
    return spawnExternal({
      orderId,
      gateway,
      amount,
      currency
    });
  if (isCard(gateway)) return spawnCard({ orderId, gateway, amount, currency });

  return null;
}

export function spawnStored({
  orderId,
  amount,
  currency,
  storedPaymentMethods
}: any) {
  return spawn(
    gatewayMachine.withConfig(storedConfig as any).withContext({
      storedPaymentMethods,
      orderId,
      amount,
      currency,
      type: GatewayTypes.STORED
    }),
    { name: "stored", sync: true }
  );
}

export function spawnCard({ orderId, gateway, amount, currency }: any) {
  return spawn(
    gatewayMachine.withConfig(cardConfig as any).withContext({
      orderId,
      gateway,
      amount,
      currency,
      type: GatewayTypes.CARD,
      code: gateway?.gateway_provider?.code
    }),
    { name: gateway?.id, sync: true }
  );
}

export function spawnStripe({
  orderId,
  gateway,
  amount,
  currency,
  address
}: PaymentDetailsContext) {
  return spawn(
    stripeMachine.withContext({
      orderId,
      gateway,
      ctx: GatewayCtx.PAY,
      amount,
      currency,
      type: GatewayTypes.CARD,
      code: gateway?.gateway_provider?.code,
      address
    } as any),
    { name: gateway?.id, sync: true }
  );
}

export function spawnGenericGateway(
  type: any,
  { orderId, gateway, amount, currency, renderless = false }: any
) {
  return spawn(
    gatewayMachine.withContext({
      orderId,
      gateway,
      amount: amount || 0,
      currency,
      type,
      code: gateway?.gateway_provider?.code,
      renderless
    }),
    { name: gateway?.id, sync: true }
  );
}

export function spawnExternal({ orderId, gateway, amount, currency }: any) {
  return spawn(
    gatewayMachine.withContext({
      orderId,
      gateway,
      amount: amount || 0,
      currency,
      type: GatewayTypes.CARD,
      code: gateway?.gateway_provider?.code
      // external: gateway?.gateway_provider.external_payment,
    }),
    { name: gateway?.id, sync: true }
  );
}

// -----------------------------------------------------------------------------

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

const isExternalCard = (gateway: any) =>
  gateway.type === GatewayTypes.CARD &&
  gateway?.gateway_provider.external_payment;

const isExternalStore = (gateway: any) =>
  gateway.gateway_provider.external_store;
