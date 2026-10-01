// -----------------------------------------------------------------------------
/**
 * @module payment/__tests__/recorded-pool
 * @description The recorded make-payment traffic the integration lane replays, and its accessors.
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

const PAYMENT = pool("payment");
const PAYMENT_DETAILS = pool("payment-details");
const SESSION = pool("session-store");
const BRAND = pool("brand");
const QUERY = pool("query");
const INVOICES = pool("invoices");

const GATEWAYS_KEY = "get-brands-id-gateways-active-true-client-id-invoice-id";
const CHARGE_KEY = "post-payments-case-taken-up-paypal-express";
const REFUSAL_KEY = "post-payments-case-method-unusable";
const MISSING_KEY = "get-invoices-id-case-not-mine";
const PAID_KEY = "get-invoices-id-case-paid";

export const server = startReplayServer({ recordingsDir: PAYMENT });

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
  replayFrom("get", "*/brands/:brandId/gateways", GATEWAYS_KEY, PAYMENT);
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

export function replayRecordedRefusal(): void {
  replayFrom("post", "*/payments", REFUSAL_KEY, PAYMENT);
}

export function replayRecordedMissingInvoice(): void {
  replayFrom("get", "*/invoices/:invoiceId", MISSING_KEY, PAYMENT);
}

export function replayRecordedPaidInvoice(): void {
  replayFrom("get", "*/invoices/:invoiceId", PAID_KEY, INVOICES);
}

export function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// -----------------------------------------------------------------------------

function gatewayProviders(): string[] {
  const body = fixture(GATEWAYS_KEY, PAYMENT).response.body as {
    data?: Array<{ gateway?: { provider?: string } }>;
  };
  return (body.data ?? [])
    .map(row => row.gateway?.provider)
    .filter((provider): provider is string => Boolean(provider));
}

function invoiceIdFrom(key: string, dir = PAYMENT): string | undefined {
  return /\/api\/invoices\/([0-9a-f-]{36})/.exec(
    fixture(key, dir).request.path
  )?.[1];
}

export const recordedInvoiceId = invoiceIdFrom("get-invoices-id");

export const otherInvoiceId = invoiceIdFrom("get-invoices-id-case-not-mine");

export const paidInvoiceId = invoiceIdFrom(PAID_KEY, INVOICES);

export const recordedPaidInvoice = (
  fixture(PAID_KEY, INVOICES).response.body as {
    data?: { status?: { code?: string }; unpaid_amount?: number };
  }
).data;

export const recordedProviders = gatewayProviders();

export const chargedProvider = recordedProviders.find(
  provider =>
    slug(provider) ===
    slug(CHARGE_KEY.replace(/^post-payments-case-taken-up-/, ""))
);

export const recordedAmount = (
  fixture("post-cart-calculate", PAYMENT_DETAILS).response.body as {
    data?: { total_formatted?: string };
  }
).data?.total_formatted;

export const recordedMissingInvoiceStatus = fixture(MISSING_KEY, PAYMENT)
  .response.status;

export const recordedSession = {
  token: fixture("post-oauth-access-token-client", SESSION).response.body,
  self: (fixture("get-self", SESSION).response.body as { data: unknown }).data
};

if (
  !recordedInvoiceId ||
  !otherInvoiceId ||
  !paidInvoiceId ||
  !chargedProvider ||
  !recordedAmount
) {
  throw new Error(
    "The recorded pool is missing an invoice id, the charged provider or the " +
      "calculated total. Re-run " +
      "`pnpm fixtures:generate payment`, `pnpm fixtures:generate payment-details` " +
      "and `pnpm fixtures:generate invoices`."
  );
}
