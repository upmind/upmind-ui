// -----------------------------------------------------------------------------
/**
 * @module invoice/__tests__/recorded-orders
 * @description The recorded order traffic the integration lane replays, and the two orders it tells apart.
 */

import { join } from "node:path";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  overrideRoute,
  startReplayServer
} from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

const HEADLESS_MODULES = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "headless",
  "src",
  "modules"
);

function pool(unit: string): string {
  return join(HEADLESS_MODULES, unit, "__tests__", "fixtures");
}

const INVOICES = pool("invoices");
const SESSION = pool("session-store");
const BRAND = pool("brand");
const PAYMENT_DETAILS = pool("payment-details");
const QUERY = pool("query");

export const server = startReplayServer({ recordingsDir: INVOICES });

function fixture(key: string, dir: string) {
  return getFixture(key, { recordingsDir: dir });
}

function replayFrom(
  method: "get" | "post",
  route: string,
  key: string,
  dir: string
): void {
  const recorded = fixture(key, dir).response;
  overrideRoute(
    server,
    method,
    route,
    recorded.body as object,
    recorded.status
  );
}

const EMPTY_LIST = { status: "ok", data: [] };
const EMPTY_OBJECT = { status: "ok", data: {} };

export function installBootRoutes(): void {
  replayFrom(
    "post",
    "*/oauth/access_token",
    "post-oauth-access-token-client",
    SESSION
  );
  replayFrom("get", "*/self", "get-self", SESSION);
  replayFrom("get", "*/brand/settings", "get-brand-settings", BRAND);
  replayFrom("get", "*/org/modules", "get-org-modules", BRAND);
  replayFrom(
    "get",
    "*/config/organisation/values",
    "get-config-organisation-values",
    BRAND
  );
  replayFrom(
    "get",
    "*/clients/:clientId/payment_details",
    "get-clients-id-payment-details-active-true-brand-id-country-id",
    PAYMENT_DETAILS
  );
  replayFrom(
    "post",
    "*/cart/calculate",
    "post-cart-calculate",
    PAYMENT_DETAILS
  );
  replayFrom("get", "*/wallet/balance", "get-wallet-balance", PAYMENT_DETAILS);
  replayFrom("get", "*/countries", "get-countries", QUERY);
  overrideRoute(server, "get", "*/billing_cycles", EMPTY_LIST);
  overrideRoute(server, "get", "*/config/brand/values", EMPTY_OBJECT);
}

// -----------------------------------------------------------------------------

export type RecordedOrder = {
  id: string;
  number: string;
  body: unknown;
};

function recordedOrder(key: string): RecordedOrder {
  const body = fixture(key, INVOICES).response.body as {
    data?: { id?: string; number?: string };
  };
  const id = body.data?.id;
  const number = body.data?.number;

  if (!id || !number) {
    throw new Error(
      `The recorded order pool's ${key} carries no id or no invoice number, ` +
        `so nothing can tell it apart from another order. Re-run ` +
        `\`pnpm fixtures:generate invoices\`.`
    );
  }

  return { id, number, body: body as unknown };
}

export const paidOrder = recordedOrder("get-invoices-id-case-paid");
export const unpaidOrder = recordedOrder("get-invoices-id-case-unpaid");

if (
  paidOrder.id === unpaidOrder.id ||
  paidOrder.number === unpaidOrder.number
) {
  throw new Error(
    "Both recorded orders carry the same id or the same invoice number, so " +
      "`the prop won` and `the route won` are no longer distinguishable " +
      "outcomes. Re-run `pnpm fixtures:generate invoices`."
  );
}

export function serveRecordedOrders(): void {
  for (const order of [paidOrder, unpaidOrder]) {
    overrideRoute(server, "get", `*/invoices/${order.id}`, order.body);
  }
}

export const recordedSession = {
  token: fixture("post-oauth-access-token-client", SESSION).response.body,
  self: (fixture("get-self", SESSION).response.body as { data: unknown }).data
};

// -----------------------------------------------------------------------------

const outbound: string[] = [];

server?.events.on("request:start", ({ request }) => {
  const url = new URL(request.url);
  outbound.push(`${request.method} ${url.pathname}${url.search}`);
});

export function clearOutbound(): void {
  outbound.length = 0;
}

export function outboundRequests(): string[] {
  return [...outbound];
}

export function invoiceRequests(): string[] {
  return outbound.filter(entry => /\/invoices\//.test(entry));
}
