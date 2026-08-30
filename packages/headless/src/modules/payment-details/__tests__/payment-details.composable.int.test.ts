// -----------------------------------------------------------------------------
/**
 * @fileoverview paymentDetails composable — the gates a storefront binds to
 * (AC-A1, AC-A4, AC-A6, AC-A7, AC-A8, AC-A9, AC-A13, AC-A18)
 *
 * ## Job To Be Done
 * `usePaymentDetail` is what a payment page actually holds. It exposes a bag of
 * capability flags — may this client part-pay, is the selection complete, should
 * the pay button show — and a set of actions the page calls when the client
 * chooses. Nothing else in this module's suite proves either: the unit specs
 * prove the derivations underneath, and the machine spec proves the lifecycle
 * around them. This file proves the surface in between, which is the only part a
 * consumer can see.
 *
 * No Vue app and no mounted component. The composable takes the interpreted
 * machine as its actor — exactly as `basket/useBasketPaymentDetails.ts` passes
 * `actors.paymentDetail` — so `interpret()` plus an `AUTHENTICATED` signal is the
 * whole harness.
 *
 * ## Provenance
 * Every body replayed here was captured by
 * `pnpm fixtures:generate payment-details` into this module's own `fixtures/`
 * dir. No body is authored in this file, and the brand and client ids are read
 * back off the recorded request paths rather than typed in.
 *
 * ## `showPaymentActions` is NOT the pay gate — do not assert on it here
 * With a gateway picked and nothing else, `meta.showPaymentActions` is true while
 * the machine sits `available.invalid`. That is correct: the flag renders the
 * actions SECTION, and the button inside it guards itself —
 * `PaymentDetails.vue:93` binds `:disabled="meta.hasSelectedGateway &&
 * !meta.isValid"`. `isComplete` / `isValid` are the readiness gates, and they are
 * what the AC-A18 case below asserts.
 *
 * ## What Breaks If These Fail
 * A half-made selection reads as complete and reaches the payment module; a
 * client is offered a part payment their brand forbids; or the credit they chose
 * to spend never reaches the selection and they are charged the full amount.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { BrandConfigKeys, GatewayContext } from "@upmind-automation/types";
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
 * data, so supplying it here is sanctioned (ADR-021 "mock settings not data").
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

/**
 * Serve the recorded `POST /api/cart/calculate` that matches the price list the
 * module actually asked about.
 *
 * The module formats three amounts over ONE route — what is being paid, what is
 * outstanding, and what the credit covers. Route-level replay would answer all
 * three with the same body and the three strings would agree by construction
 * rather than by behaviour. Matching on the request body is what separates them.
 * `useCalculate` also dedupes equal values, so a case where all three happen to
 * be equal proves nothing — AC-A13 below drives them apart first.
 */
function replayCalculateByPrice(): void {
  const byTotal = new Map<number, { status: number; body: unknown }>();

  for (const key of [
    "post-cart-calculate-case-amount",
    "post-cart-calculate-case-outstanding",
    "post-cart-calculate-case-wallet",
    "post-cart-calculate-case-wallet-small"
  ]) {
    const recorded = getFixture(key, { recordingsDir }).response;
    const total = (recorded.body as { data?: { total?: number } })?.data?.total;

    if (typeof total !== "number") {
      throw new Error(
        `The recorded "${key}" carries no total. Re-run ` +
          "`pnpm fixtures:generate payment-details`."
      );
    }
    byTotal.set(total, recorded);
  }

  const generic = getFixture("post-cart-calculate", { recordingsDir }).response;

  server.use(
    http.post("*/api/cart/calculate", async ({ request }) => {
      const body = (await request.json()) as { prices?: number[] };
      const asked = (body.prices ?? []).reduce(
        (sum, price) => sum + Number(price),
        0
      );
      const recorded = byTotal.get(asked) ?? generic;

      return HttpResponse.json(recorded.body as Record<string, unknown>, {
        status: recorded.status
      });
    })
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

describe("paymentDetails composable — the gates a storefront binds to", () => {
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

  /** What a payment page holds, over a machine that has finished loading. */
  async function held() {
    service = await boot();
    const { usePaymentDetail } = await import("../usePaymentDetail");
    return usePaymentDetail(service as never);
  }

  it("AC-A13 reads each of the three amounts back as its own money string", async () => {
    brandConfig = { [BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED]: true };
    replayCalculateByPrice();

    const detail = await held();
    detail.setAmount(30);
    detail.setAmountCredit(5);

    await vi.waitFor(
      () => {
        expect(service?.state.context.model.amount).toBe(30);
        expect(service?.state.context.model.wallet_amount).toBe(5);
      },
      { timeout: 10000 }
    );

    await vi.waitFor(
      () => {
        const formatted = detail.amountsFormatted.value;
        expect(formatted.amount).toBe("$30.00");
        expect(formatted.outstanding).toBe("$50.00");
        expect(formatted.wallet).toBe("$5.00");
      },
      { timeout: 10000 }
    );
  });

  it("AC-A8 lets a client part-pay, and put the full amount back", async () => {
    brandConfig = { [BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED]: true };
    const detail = await held();

    expect(service?.state.context.model.amount).toBe(50);

    detail.setAmount(30);
    await vi.waitFor(() => {
      expect(service?.state.context.model.amount).toBe(30);
    });

    detail.resetPartialAmount();
    await vi.waitFor(() => {
      expect(service?.state.context.model.amount).toBe(50);
    });
  });

  it("AC-A1 tells a page the capture surface is ready to bind to", async () => {
    const detail = await held();

    await expect(detail.isReady()).resolves.toBe(true);
    expect(detail.meta.value.isLoading).toBe(false);
    expect(detail.meta.value.isAvailable).toBe(true);
  });

  it("AC-A9 withholds the part-payment gate while the brand has not permitted one", async () => {
    const detail = await held();

    expect(detail.meta.value.isPayContext).toBe(true);
    expect(detail.meta.value.canMakePartialPayment).toBe(false);
  });

  it("AC-A4 records the credit the client chooses to spend, and leaves the amount whole", async () => {
    const detail = await held();

    expect(detail.meta.value.hasAccountCredit).toBe(true);
    detail.setAmountCredit(5);

    await vi.waitFor(() => {
      expect(service?.state.context.model.wallet_amount).toBe(5);
    });
    expect(service?.state.context.model.amount).toBe(50);
  });

  it("AC-A7 carries the gateway the client picks through to the selection", async () => {
    const detail = await held();
    const chosen = service?.state.context.lookups.gateways?.[0] as
      | { gateway_id?: string }
      | undefined;

    expect(chosen?.gateway_id).toEqual(expect.any(String));
    detail.setGateway(chosen?.gateway_id as string);

    await vi.waitFor(() => {
      expect(service?.state.context.model.gateway_id).toBe(chosen?.gateway_id);
    });
    expect(detail.meta.value.hasSelectedGateway).toBe(true);
  });

  it("AC-A18 does not call a half-made selection complete", async () => {
    const detail = await held();
    const chosen = service?.state.context.lookups.gateways?.[0] as
      | { gateway_id?: string }
      | undefined;

    detail.setGateway(chosen?.gateway_id as string);

    await vi.waitFor(() => {
      expect(service?.state.matches({ available: "invalid" })).toBe(true);
    });
    expect(detail.meta.value.isComplete).toBe(false);
    expect(detail.meta.value.isValid).toBe(false);
  });

  it("AC-A6 drops the client's choice again when they clear it", async () => {
    const detail = await held();
    const chosen = service?.state.context.lookups.gateways?.[0] as
      | { gateway_id?: string }
      | undefined;

    detail.setGateway(chosen?.gateway_id as string);
    await vi.waitFor(() => {
      expect(service?.state.context.model.gateway_id).toBe(chosen?.gateway_id);
    });

    detail.clear();

    await vi.waitFor(() => {
      expect(service?.state.matches({ available: "valid" })).toBe(true);
    });
    expect(detail.meta.value.hasSelectedGateway).toBe(false);
  });
});
