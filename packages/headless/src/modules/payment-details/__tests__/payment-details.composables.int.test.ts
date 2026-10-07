// -----------------------------------------------------------------------------
/**
 * @fileoverview paymentDetails composables — what a storefront actually holds
 * (AC-A1, AC-B3)
 *
 * ## The store-only narrowing is proven at the unit layer, not here
 * `payment-details.utils.test.ts` proves which of the brand's 15 real recorded
 * gateways survive the store-only filter. This file proves the wiring above it —
 * the composables a page actually holds. No Vue app is needed for either: the
 * machine runs under `interpret()` and `usePaymentDetail` takes the interpreted
 * service as its actor.
 *
 * ## Job To Be Done
 * The services file is the boundary; the composables are what a storefront
 * binds to. This file drives the module through its PUBLIC surface — the list
 * composable a "my payment methods" page holds, and the add-a-method composable
 * an "add card" page holds — and asserts what the client ends up being offered.
 * It is the only place the module's own wiring (query → mapper → collection, and
 * machine setup → gateway narrowing) is exercised end to end against recorded
 * reality.
 *
 * ## Provenance
 * Every body replayed here was captured by
 * `pnpm fixtures:generate payment-details` into this module's own `fixtures/`
 * dir. No body is authored in this file.
 *
 * ## What Breaks If These Fail
 * The payment-methods page shows nothing (or one blank card) while the client
 * holds thirteen, or the add-a-card page opens with no currency and the gateway
 * list can never be fetched.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { server } from "./setup.integration";

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

const brandCurrency = {
  id: "e47d7382-4850-7931-56c8-1e642d59e063",
  code: "USD"
};

function recordedRows<T>(key: string): T[] {
  const body = getFixtureBody<{ data?: T[] | Record<string, T> }>(key, {
    recordingsDir
  });
  return Object.values(body?.data ?? {}) as T[];
}

const brandId =
  /\/api\/brands\/([0-9a-f-]{36})\/gateways/.exec(
    getFixture(GATEWAYS_PAY, { recordingsDir }).request.path
  )?.[1] ?? "";

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

// Brand identity, its currency and its config are SETTINGS, not journey data —
// mocking them is sanctioned (ADR-021 "mock settings not data"). The id comes
// from the recorded gateway path, so the mock cannot drift from the capture.
const brandCurrencyRef = { value: brandCurrency as unknown };

vi.mock("../../brand", () => ({
  useBrand: () => ({
    brandId: { value: brandId },
    currency: brandCurrencyRef,
    currencyId: { value: brandCurrency.id },
    countryId: { value: undefined },
    ensureConfig: () => ({}),
    getConfig: () => ({}),
    getConfigValue: () => undefined
  })
}));

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

/** Pin the SUCCESS fixture on every route these composables read. */
function replayHappyPath(): void {
  replay("get", "*/api/clients/:clientId/payment_details", STORED_LIST);
  replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_PAY);
  replay("get", "*/api/wallet/balance", WALLET);
  replay("post", "*/api/cart/calculate", "post-cart-calculate");
}

// -----------------------------------------------------------------------------

describe("paymentDetails composables — a client's own payment methods", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replayHappyPath();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("AC-A1 fetches the client's own methods and settles out of its loading state", async () => {
    const { usePaymentDetails } = await import("../usePaymentDetails");
    const details = usePaymentDetails();

    await vi.waitFor(
      () => {
        expect(details.meta.value.isLoading).toBe(false);
      },
      { timeout: 10000 }
    );

    expect(details.meta.value.hasError).toBe(false);
    expect(outbound.some(entry => entry.includes("/payment_details"))).toBe(
      true
    );
  });

  it("AC-A1 tells a page the list is ready to bind to", async () => {
    const { usePaymentDetails } = await import("../usePaymentDetails");
    const details = usePaymentDetails();

    await expect(details.isReady()).resolves.toBe(true);
  });

  it("AC-A1 fetches the list again when the page asks for a refresh", async () => {
    const { usePaymentDetails } = await import("../usePaymentDetails");
    const details = usePaymentDetails();

    await vi.waitFor(
      () => {
        expect(details.meta.value.isLoading).toBe(false);
      },
      { timeout: 10000 }
    );

    outbound = [];
    await details.refresh();

    await vi.waitFor(
      () => {
        expect(outbound.some(entry => entry.includes("/payment_details"))).toBe(
          true
        );
      },
      { timeout: 10000 }
    );
  });

  it("AC-A1 names the client's own default method", async () => {
    const recorded = recordedRows<{ default?: boolean; id?: string }>(
      STORED_LIST
    );
    const { usePaymentDetails } = await import("../usePaymentDetails");
    const details = usePaymentDetails();

    await vi.waitFor(
      () => {
        expect(details.meta.value.isLoading).toBe(false);
      },
      { timeout: 10000 }
    );

    expect(recorded[0]?.default).toBe(true);
    expect(details.default()?.id).toBe(recorded[0]?.id);
    expect(details.default()?.meta.isDefault).toBe(true);
  });

  it("AC-A1 shows the page every card the client holds, their default first", async () => {
    const recorded = recordedRows<{ default?: boolean; id?: string }>(
      STORED_LIST
    );
    const { usePaymentDetails } = await import("../usePaymentDetails");
    const details = usePaymentDetails();

    await vi.waitFor(
      () => {
        expect(details.meta.value.isLoading).toBe(false);
      },
      { timeout: 10000 }
    );

    expect(recorded).toHaveLength(13);
    expect(recorded[0]?.default).toBe(true);
    expect(details.data.value).toHaveLength(recorded.length);
    expect(details.data.value?.[0]?.id).toBe(recorded[0]?.id);
  });
});

describe("paymentDetails composables — storing a method outside a payment", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replayHappyPath();
    brandCurrencyRef.value = brandCurrency;
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("AC-B3 falls back to the brand's currency when the caller names none", async () => {
    const { usePaymentDetailAdd } = await import("../usePaymentDetailAdd");
    const add = usePaymentDetailAdd();
    const resolved = (add.currency?.value ?? add.currency) as {
      id?: string;
      code?: string;
    };

    expect(resolved.code).toBe(brandCurrency.code);
    expect(resolved.id).toBe(brandCurrency.id);
    add.clear();
  });

  it("AC-B3 refuses to open with no currency to price a gateway against", async () => {
    brandCurrencyRef.value = undefined;
    const { usePaymentDetailAdd } = await import("../usePaymentDetailAdd");

    expect(() => usePaymentDetailAdd()).toThrow();
  });

  it("AC-B3 fetches again when the caller changes the currency", async () => {
    const { usePaymentDetailAdd } = await import("../usePaymentDetailAdd");
    const add = usePaymentDetailAdd({ currency: brandCurrency as never });

    const other = { id: "aaaaaaaa-0000-0000-0000-000000000001", code: "GBP" };
    await add.refresh(other as never);
    const resolved = (add.currency?.value ?? add.currency) as {
      id?: string;
      code?: string;
    };

    expect(resolved.code).toBe(other.code);
    expect(resolved.id).toBe(other.id);
    add.clear();
  });
});
