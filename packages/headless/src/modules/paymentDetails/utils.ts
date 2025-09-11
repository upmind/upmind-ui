// --- external
import { spawn } from "xstate";

// --- internal
import gatewayMachine from "./gateways/gateway.machine";
import stripeMachine from "./gateways/stripe/stripe.machine";
import braintreeMachine from "./gateways/braintree/braintree.machine";
import cardConfig from "./gateways/card";
import storedConfig from "./gateways/stored";
import openPayConfig from "./gateways/openPay";

// --- utils

// --- types
import {
  GatewayContext,
  GatewayCtx,
  GatewayTypesExtended
} from "./gateways/types";
import {
  GatewayProviderCodes,
  IGateway,
  GatewayTypes
} from "@upmind-automation/types";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// -----------------------------------------------------------------------------

export function spawnGateway({
  orderId,
  gateway,
  amount,
  currency,
  storedPaymentMethods,
  address
}: Partial<GatewayContext>) {
  // lets spawn and return the appropriate machine based on the gateway
  // the order her eis important and matches the original order in the legacy app
  if (!amount || !gateway) {
    return spawnGenericGateway(GatewayTypesExtended.FREE, {
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
    return spawnStripe({ orderId, gateway, amount, currency, address });

  if (isBankTransfer(gateway))
    return spawnGenericGateway(GatewayTypes.BANK_TRANSFER, {
      orderId,
      gateway,
      amount,
      currency,
      renderless: true
    });

  if (isBraintree(gateway))
    return spawnBraintree({
      orderId,
      gateway,
      amount,
      currency,
      address
    });

  if (isOpenPay(gateway))
    return spawnOpenPay({
      orderId,
      gateway,
      amount,
      currency
    });

  if (isAwaitingClient(gateway))
    return spawnGenericGateway(GatewayTypes.AWAITING_CLIENT, {
      orderId,
      gateway,
      amount,
      currency,
      renderless: true
    });

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
}: Partial<GatewayContext>) {
  if (!orderId || !currency || !amount) {
    throw new DetailedError(
      "orderId, amount, and currency are required",
      responseCodes.Bad_Request,
      ErrorOrigin.Headless
    );
  }

  return spawn(
    gatewayMachine.withConfig(storedConfig).withContext({
      storedPaymentMethods,
      orderId,
      amount,
      currency,
      type: GatewayTypesExtended.STORED
    }),
    { name: "stored", sync: true }
  );
}

export function spawnCard({
  orderId,
  gateway,
  amount,
  currency
}: Partial<GatewayContext>) {
  if (!orderId || !currency || !amount) {
    throw new DetailedError(
      "orderId, amount, and currency are required",
      responseCodes.Bad_Request,
      ErrorOrigin.Headless
    );
  }
  return spawn(
    gatewayMachine.withConfig(cardConfig).withContext({
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
}: Partial<GatewayContext>) {
  if (!orderId || !currency || !amount) {
    throw new DetailedError(
      "orderId, amount, and currency are required",
      responseCodes.Bad_Request,
      ErrorOrigin.Headless
    );
  }
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
    }),
    { name: gateway?.id, sync: true }
  );
}

export function spawnBraintree({
  orderId,
  gateway,
  amount,
  currency,
  address
}: Partial<GatewayContext>) {
  if (!orderId || !currency || !amount) {
    throw new DetailedError(
      "orderId, amount, and currency are required",
      responseCodes.Bad_Request,
      ErrorOrigin.Headless
    );
  }
  return spawn(
    braintreeMachine.withContext({
      orderId,
      gateway,
      ctx: GatewayCtx.PAY,
      amount,
      currency,
      type: GatewayTypes.CARD,
      code: gateway?.gateway_provider?.code,
      address
    }),
    { name: gateway?.id, sync: true }
  );
}

export function spawnOpenPay({
  orderId,
  gateway,
  amount,
  currency,
  address
}: Partial<GatewayContext>) {
  if (!orderId || !currency || !amount) {
    throw new DetailedError(
      "orderId, amount, and currency are required",
      responseCodes.Bad_Request,
      ErrorOrigin.Headless
    );
  }
  return spawn(
    gatewayMachine.withConfig(openPayConfig as any).withContext({
      orderId,
      gateway,
      ctx: GatewayCtx.PAY,
      amount,
      currency,
      type: GatewayTypes.CARD,
      code: gateway?.gateway_provider?.code,
      address
    }),
    { name: gateway?.id, sync: true }
  );
}

export function spawnGenericGateway(
  type: any,
  {
    orderId,
    gateway,
    amount,
    currency,
    renderless = false
  }: Partial<GatewayContext>
) {
  if (!orderId || !currency || !amount) {
    throw new DetailedError(
      "orderId, amount, and currency are required",
      responseCodes.Bad_Request,
      ErrorOrigin.Headless
    );
  }
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

export function spawnExternal({
  orderId,
  gateway,
  amount,
  currency
}: Partial<GatewayContext>) {
  if (!orderId || !currency || !amount) {
    throw new DetailedError(
      "orderId, amount, and currency are required",
      responseCodes.Bad_Request,
      ErrorOrigin.Headless
    );
  }
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

const isStored = (gateway: IGateway) =>
  gateway.type === (GatewayTypesExtended.STORED as any);

const isCard = (gateway: IGateway) => gateway.type === GatewayTypes.CARD;

const isStripe = (gateway: IGateway) =>
  gateway?.gateway_provider?.code === GatewayProviderCodes.STRIPE &&
  !!gateway?.use_frontend_implementation;

const isBraintree = (gateway: IGateway) =>
  gateway?.gateway_provider?.code === GatewayProviderCodes.BRAINTREE;

const isOpenPay = (gateway: IGateway) =>
  gateway?.gateway_provider?.code === GatewayProviderCodes.OPENPAY;

const isBankTransfer = (gateway: IGateway) =>
  gateway.type === GatewayTypes.BANK_TRANSFER;

const isDirectDebit = (gateway: IGateway) =>
  gateway.type === GatewayTypes.DIRECT_DEBIT;

const isSEPA = (gateway: IGateway) => gateway.type === GatewayTypes.SEPA;

const isMobile = (gateway: IGateway) => gateway.type === GatewayTypes.MOBILE;

const isOffline = (gateway: IGateway) => gateway.type === GatewayTypes.OFFLINE;

const isExternalCard = (gateway: IGateway) =>
  gateway.type === GatewayTypes.CARD &&
  gateway?.gateway_provider.external_payment;

const isExternalStore = (gateway: IGateway) =>
  gateway.gateway_provider.external_store;

const isAwaitingClient = (gateway: IGateway) =>
  gateway.type === GatewayTypes.AWAITING_CLIENT;
