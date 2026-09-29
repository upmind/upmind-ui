// -----------------------------------------------------------------------------
/**
 * @fileoverview paymentDetails machine — the capture lifecycle, driven directly
 * (AC-A1, AC-A12, AC-A18, AC-A20, AC-B1, AC-G2)
 *
 * ## Job To Be Done
 * The module's exported machine is what decides WHEN a client may choose. Every
 * other spec here proves a derivation in isolation — which gateways survive a
 * filter, what a selection payload carries. This file proves the lifecycle those
 * derivations hang off: the machine gathers the three sources a capture needs,
 * opens the choice, closes it again when the session goes, and refuses to call an
 * incomplete selection ready.
 *
 * No Vue app, no mounted component. `interpret(paymentDetailsMachine)` plus the
 * `AUTHENTICATED` signal is the whole harness — the same shape
 * `payment/__tests__/payment.escalation.test.ts` uses.
 *
 * ## Provenance
 * Every body replayed here was captured by
 * `pnpm fixtures:generate payment-details` into this module's own `fixtures/`
 * dir. No body is authored in this file, and the brand and client ids are read
 * back off the recorded request paths rather than typed in.
 *
 * ## What Breaks If These Fail
 * The payment step opens before the client's methods, gateways or credit have
 * arrived; it stays open after the session ends; or a half-made selection is
 * handed to the payment module and the charge goes out with nothing to charge.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { GatewayContext } from "@upmind-automation/types";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import paymentDetailsMachine from "../payment-detail.machine";
import { server } from "./setup.integration";
import type { PaymentDetailsContext } from "../payment-details.types";
import type { Interpreter } from "xstate";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");
const sessionRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "session-store",
  "__tests__",
  "fixtures"
);

const GATEWAYS_PAY =
  "get-brands-id-gateways-active-1-case-pay-client-id-country-id";
const STORED_LIST =
  "get-clients-id-payment-details-active-true-brand-id-country-id";
const WALLET = "get-wallet-balance";

/** The ids the recorder actually captured, read back off the recorded paths. */
function recordedIds(): { brandId: string; clientId: string } {
  const brandId = /\/api\/brands\/([0-9a-f-]{36})\/gateways/.exec(
    getFixture(GATEWAYS_PAY, { recordingsDir }).request.path
  )?.[1];
  const clientId = /\/api\/clients\/([0-9a-f-]{36})\/payment_details/.exec(
    getFixture(STORED_LIST, { recordingsDir }).request.path
  )?.[1];

  if (!brandId || !clientId) {
    throw new Error(
      "The recorded payment-details fixtures carry no brand id and client id. " +
        "Re-run `pnpm fixtures:generate payment-details`."
    );
  }
  return { brandId, clientId };
}

const { brandId, clientId } = recordedIds();

// Brand identity, currency and config are SETTINGS, not journey data — mocking
// them is sanctioned (ADR-021 "mock settings not data"). The id comes from the
// recorded gateway path, so the mock cannot drift from the capture.
const CURRENCY = { id: "e47d7382-4850-7931-56c8-1e642d59e063", code: "USD" };

/**
 * The brand switches in play for a test. Brand config is a SETTING, not journey
 * data, so supplying it here is sanctioned (ADR-021 "mock settings not data") —
 * and it is the only way to exercise a capability this recording brand happens
 * to have switched off.
 */
let brandConfig: Record<string, unknown> = {};

vi.mock("../../brand", () => ({
  useBrand: () => ({
    brandId: { value: brandId },
    currency: { value: CURRENCY },
    currencyId: { value: CURRENCY.id },
    countryId: { value: undefined },
    ensureConfig: () => brandConfig,
    getConfig: () => brandConfig,
    getConfigValue: (key: string) => brandConfig[key]
  })
}));

/** Replay one recorded response for a route, for this test only. */
function replay(method: "get" | "post", route: string, key: string): void {
  const recorded = getFixture(key, { recordingsDir }).response;
  server.use(
    http[method](route, () =>
      HttpResponse.json(recorded.body as Record<string, unknown>, {
        status: recorded.status
      })
    )
  );
}

/** Pin the SUCCESS fixture on every route the capture lifecycle reads. */
function replayHappyPath(): void {
  replay("get", "*/api/clients/:clientId/payment_details", STORED_LIST);
  replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_PAY);
  replay("get", "*/api/wallet/balance", WALLET);
  replay("post", "*/api/cart/calculate", "post-cart-calculate");
}

/** Every request the machine actually sent, in order. */
let outbound: string[] = [];

server.events.on("request:start", ({ request }) => {
  outbound.push(`${request.method} ${new URL(request.url).pathname}`);
});

/** Sign a real client in through the real session store. */
async function seedClientSession(): Promise<void> {
  const { useSessionStore, useActiveSession } =
    await import("../../session-store");
  const { mapSessionUser } =
    await import("../../session-store/session-store.mappers");

  const token = getFixtureBody<{ access_token: string }>(
    "post-oauth-access-token-client",
    { recordingsDir: sessionRecordingsDir }
  );
  const self = getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
    recordingsDir: sessionRecordingsDir
  });

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(token as never, true, mapSessionUser(self.data as never));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAuthenticated.value).toBe(true);
  });
}

/**
 * The context a PAY-context caller supplies. `orderId` and `orderStatus` are
 * load-bearing, not decoration: without them the machine never leaves its
 * pre-flight check, which is the module's documented PAY-context requirement
 * (`payment-details.types.ts`, `PaymentDetailsArgs`).
 */
function payContext(
  over: Partial<PaymentDetailsContext> = {}
): PaymentDetailsContext {
  return {
    ctx: GatewayContext.PAY,
    client: { id: clientId },
    currency: CURRENCY,
    amount: 50,
    orderId: "3de78642-de53-9714-76df-21208469530d",
    orderStatus: "invoice_draft",
    paidAmount: 0,
    address: { id: "825d96e7-63ed-0913-46df-417482528340", country_id: "1" },
    raw: {},
    lookups: { amountsFormatted: { amount: "", outstanding: "", wallet: "" } },
    model: { amount: 50, type: null },
    ...over
  } as unknown as PaymentDetailsContext;
}

type Service = Interpreter<PaymentDetailsContext, never, never, never, never>;

/** Start the machine as a caller does, and wait for it to settle or give up. */
async function boot(
  over: Partial<PaymentDetailsContext> = {}
): Promise<Service> {
  const service = interpret(
    paymentDetailsMachine.withContext(payContext(over)),
    { devTools: false }
  ) as unknown as Service;

  service.start();
  service.send({ type: "AUTHENTICATED" });

  await vi.waitFor(
    () => {
      const settled =
        service.state.matches("available") ||
        service.state.matches("unavailable") ||
        service.state.matches("error");
      expect(settled).toBe(true);
    },
    { timeout: 15000, interval: 50 }
  );

  return service;
}

// -----------------------------------------------------------------------------

describe("paymentDetails machine — the capture lifecycle", () => {
  let service: Service | undefined;

  beforeEach(async () => {
    outbound = [];
    brandConfig = {};
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replayHappyPath();
  });

  afterEach(() => {
    service?.stop();
    service = undefined;
    server.resetHandlers();
  });

  it("AC-A1 opens the choice only once the methods, the gateways and the credit are in", async () => {
    service = await boot();

    expect(service.state.matches("available")).toBe(true);

    const asked = outbound.filter(entry => entry.startsWith("GET /api"));
    expect(asked).toContain(`GET /api/clients/${clientId}/payment_details`);
    expect(asked).toContain("GET /api/wallet/balance");
    expect(asked.some(entry => entry.includes("/gateways"))).toBe(true);

    const lookups = service.state.context.lookups;
    expect(lookups.gateways?.length).toBeGreaterThan(0);
    expect(lookups.accountCredit?.owned?.value).toBeGreaterThan(0);
  });

  it("AC-A12 offers a form bounded by the amount the client actually owes", async () => {
    service = await boot({ amount: 50, model: { amount: 50, type: null } });

    const definitions = (
      service.state.context.schema as {
        definitions?: Record<string, { maximum?: number }>;
      }
    )?.definitions;

    expect(definitions?.amount?.maximum).toBe(50);
  });

  it("AC-A20 fetches everything again when the amount the client owes changes", async () => {
    service = await boot();

    expect(service.state.context.amount).toBe(50);
    outbound = [];

    service.send({
      type: "REFRESH",
      data: {
        id: "9de78642-de53-9714-76df-21208469530d",
        unpaid_amount_converted: 12.5,
        currency: CURRENCY
      }
    });

    await vi.waitFor(
      () => {
        expect(service?.state.matches("available")).toBe(true);
        expect(service?.state.context.amount).toBe(12.5);
      },
      { timeout: 15000 }
    );

    expect(service.state.context.model.amount).toBe(12.5);
    expect(outbound.some(entry => entry.includes("/payment_details"))).toBe(
      true
    );
    expect(outbound.some(entry => entry.includes("/gateways"))).toBe(true);
  });

  it("AC-A20 does not fetch again when the amount the client owes is unchanged", async () => {
    service = await boot();
    outbound = [];

    service.send({
      type: "REFRESH",
      data: {
        id: service.state.context.orderId,
        unpaid_amount_converted: 50,
        currency: CURRENCY
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    expect(service.state.matches("available")).toBe(true);
    expect(service.state.context.amount).toBe(50);
    expect(outbound.some(entry => entry.includes("/gateways"))).toBe(false);
  });

  it("AC-B1 reaches the choice in the add context too, with nothing outstanding", async () => {
    service = await boot({
      ctx: GatewayContext.ADD,
      amount: 0,
      orderId: undefined,
      orderStatus: undefined,
      model: { amount: 0, type: null }
    } as never);

    expect(service.state.matches("available")).toBe(true);
    expect(service.state.context.ctx).toBe(GatewayContext.ADD);
    expect(service.state.context.lookups.gateways?.length).toBeGreaterThan(0);
    expect(outbound.some(entry => entry.includes("/gateways"))).toBe(true);
  });

  it("AC-G2 closes the choice again the moment the session goes", async () => {
    service = await boot();
    expect(service.state.matches("available")).toBe(true);

    service.send({ type: "UNAUTHENTICATED" });

    await vi.waitFor(() => {
      expect(service?.state.matches("available")).toBe(false);
    });
  });

  // The machine is untouched by this story (money path, risk floor). With the
  // client's real default card now preselected at boot, sign-out leaves that
  // stale card in context. Pinned as an it.fails so the gap is visible, not
  // hidden — it must fail today.
  it.fails("a stale preselected card survives sign-out", async () => {
    service = await boot();
    expect(service.state.matches("available")).toBe(true);
    expect(service.state.context.paymentDetail).toBeDefined();

    service.send({ type: "UNAUTHENTICATED" });

    await vi.waitFor(() => {
      expect(service?.state.matches("available")).toBe(false);
    });
    expect(service.state.context.paymentDetail).toBeUndefined();
  });

  it("AC-A18 refuses to call a gateway choice ready while its own capture is missing", async () => {
    service = await boot();
    const chosen = service.state.context.lookups.gateways?.[0];
    const gatewayId = (chosen as { gateway_id?: string } | undefined)
      ?.gateway_id;

    expect(gatewayId).toEqual(expect.any(String));

    service.send({ type: "SET", data: { gateway_id: gatewayId } });

    await vi.waitFor(() => {
      expect(service?.state.matches({ available: "invalid" })).toBe(true);
    });
    expect(service.state.context.model.gateway_id).toBe(gatewayId);
    expect(service.state.context.paymentDetail).toBeUndefined();
  });
});
