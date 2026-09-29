// -----------------------------------------------------------------------------
/**
 * @fileoverview paymentDetails integration — the real methods, the real
 * gateways, the real credit (AC-A1, AC-A2, AC-A3, AC-A14, AC-A17)
 *
 * ## Job To Be Done
 * Everything a client is offered at capture time crosses the HTTP boundary
 * first: the methods they already hold, the gateways this brand will accept for
 * the currency in play, and the credit standing on their account. The co-located
 * `payment-details.feature` states each as a capability; this file proves them
 * against what staging actually returned, and proves the refusal that must never
 * be read as "there is nothing here" — a client asking for someone else's
 * methods.
 *
 * ## Provenance
 * Every body replayed here was captured by
 * `pnpm fixtures:generate payment-details` into this module's own `fixtures/`
 * dir. No body is authored in this file, and the ids the assertions use are read
 * back out of the recorded request paths rather than typed in — so a re-record
 * cannot leave a stale literal behind.
 *
 * ## The gap-keyed stored list AC-A1 pins — fixed on FE-3130
 * The recorded stored-method list is a REAL 13-record response whose `data` is
 * an object with NON-SEQUENTIAL keys (`0…5`, `13…19`) rather than an array — the
 * platform filtered rows out server-side and did not reindex, so PHP emitted an
 * associative array. `mapPaymentDetails` now reads that gap-keyed object as its
 * list of cards, so the client is offered every card they hold, their default
 * one first — not one blank method. Before the fix the checkout page showed ZERO
 * stored cards; after it the client's real cards flow. Fixed on FE-3130, so this
 * receipt is a live `it` again, no longer an `it.fails`.
 *
 * ## What is NOT proven here
 * The write half of the add flow. Anything needing a browser — the tokenise
 * handshake, the 3DS challenge, storing a card end to end, every off-site
 * redirect — carries NO scenario in this module's contract at all; it is e2e
 * work. What IS owed on FE-3130 is a recording gap only: a throwaway stored
 * method to delete, a PUT capture (the route refuses PATCH with 405), a brand
 * with the forced-storage keys on, and the oauth refresh leg beside the
 * recorded 401.
 *
 * ## What Breaks If These Fail
 * A client is offered a method or a gateway the platform will reject at submit;
 * their account credit stops being offered and they are asked for the full
 * amount; or a forbidden read is presented as an empty wallet of cards, which is
 * how one client's page comes to look like another's.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { GatewayContext } from "@upmind-automation/types";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { server } from "./setup.integration";
import type { PaymentDetailsContext } from "../payment-details.types";
import type { IClient, ICurrency } from "@upmind-automation/types";

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
const GATEWAYS_OTHER_CURRENCY =
  "get-brands-id-gateways-active-1-case-currency-unsupported-client-id";
const STORED_LIST =
  "get-clients-id-payment-details-active-true-brand-id-country-id";
const FORBIDDEN_LIST = "get-clients-id-payment-details-case-not-mine";
const WALLET = "get-wallet-balance";

/** The ids the recorder actually captured, read back off the recorded paths. */
function recordedIds(): { brandId: string; clientId: string } {
  const gateways = getFixture(GATEWAYS_PAY, { recordingsDir });
  const stored = getFixture(STORED_LIST, { recordingsDir });

  const brandId = /\/api\/brands\/([0-9a-f-]{36})\/gateways/.exec(
    gateways.request.path
  )?.[1];
  const clientId = /\/api\/clients\/([0-9a-f-]{36})\/payment_details/.exec(
    stored.request.path
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

function recordedRows<T>(key: string): T[] {
  const body = getFixtureBody<{ data?: T[] | Record<string, T> }>(key, {
    recordingsDir
  });
  return Object.values(body?.data ?? {}) as T[];
}

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

// Brand identity and its config are SETTINGS, not journey data — mocking them is
// sanctioned (ADR-021 "mock settings not data"). The id comes from the recorded
// gateway path, so the mock cannot drift from what was captured.
vi.mock("../../brand", () => ({
  useBrand: () => ({
    brandId: { value: brandId },
    currencyId: { value: undefined },
    countryId: { value: undefined },
    ensureConfig: () => ({}),
    getConfig: () => ({}),
    getConfigValue: () => undefined
  })
}));

/** Every request the module actually sent, in order. */
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

const currency = { id: "e47d7382-4850-7931-56c8-1e642d59e063", code: "USD" };

function context(
  over: Partial<PaymentDetailsContext> = {}
): PaymentDetailsContext {
  return {
    ctx: GatewayContext.PAY,
    client: { id: clientId } as IClient,
    currency: currency as ICurrency,
    amount: 50,
    lookups: { amountsFormatted: { amount: "", outstanding: "", wallet: "" } },
    raw: {},
    model: { amount: 50, type: null },
    ...over
  } as PaymentDetailsContext;
}

/** Ask the module for everything the client may choose between. */
async function loadLookups(over: Partial<PaymentDetailsContext> = {}) {
  const services = (await import("../payment-details.services")).default;
  return services.loadLookups(context(over), { type: "LOAD" });
}

/**
 * Pin the SUCCESS fixture on every route this module reads.
 *
 * The replay server matches a route loosely, and this module's recordings carry
 * a refusal on the same path as every success (a forbidden read on the stored
 * list, a narrower currency on the gateway list). Without
 * this the refusal wins the match and every assertion becomes a statement about
 * fixture ordering rather than about the module.
 */
function replayHappyPath(): void {
  replay("get", "*/api/clients/:clientId/payment_details", STORED_LIST);
  replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_PAY);
  replay("get", "*/api/wallet/balance", WALLET);
  replay("post", "*/api/cart/calculate", "post-cart-calculate");
}

// -----------------------------------------------------------------------------

describe("paymentDetails integration — what the client is offered", () => {
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

  it("AC-A1 offers the client every method they hold, their default one first", async () => {
    const recorded = recordedRows<{ default?: boolean; id?: string }>(
      STORED_LIST
    );
    const result = await loadLookups();
    const offered = result?.storedPaymentMethods ?? [];

    expect(recorded).toHaveLength(13);
    expect(recorded[0]?.default).toBe(true);

    expect(offered).toHaveLength(recorded.length);
    expect(offered[0]?.id).toBe(recorded[0]?.id);
    expect(offered[0]?.meta?.isDefault).toBe(true);
  });

  it("AC-A1 asks the client's own resource for the methods, and no other client's", async () => {
    await loadLookups();

    expect(
      outbound.filter(entry => entry.includes("/payment_details"))
    ).toEqual([`GET /api/clients/${clientId}/payment_details`]);
  });

  it("AC-A2 offers the brand's gateways in the order the brand curated", async () => {
    const curated = recordedRows<{ order?: number }>(GATEWAYS_PAY).map(row =>
      Number(row.order)
    );

    const result = await loadLookups();

    expect(curated).toEqual([...curated].sort((a, b) => a - b));
    expect(result?.gateways).toHaveLength(curated.length);
    expect(outbound.some(entry => entry.includes("/gateways"))).toBe(true);
  });

  it("AC-A3 offers the credit standing on the client's account in the chosen currency", async () => {
    const wallet = getFixtureBody<{
      data?: { total?: Record<string, { amount_converted?: number }> };
    }>(WALLET, { recordingsDir });
    const recordedCredit =
      wallet?.data?.total?.[currency.code]?.amount_converted;

    const result = await loadLookups();

    expect(recordedCredit).toBeGreaterThan(0);
    expect(result?.accountCredit?.owned?.value).toBe(recordedCredit);
    expect(result?.accountCredit?.owned?.amount).toMatch(/\d/);
    expect(outbound).toContain("GET /api/wallet/balance");
  });

  it("AC-A14 re-offers a narrower set of gateways for a currency the brand takes less widely", async () => {
    const wide = recordedRows<unknown>(GATEWAYS_PAY).length;
    const narrow = recordedRows<unknown>(GATEWAYS_OTHER_CURRENCY).length;

    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OTHER_CURRENCY);
    const result = await loadLookups();

    expect(narrow).toBeLessThan(wide);
    expect(result?.gateways).toHaveLength(narrow);
  });

  it("AC-A17 refuses a client asking for another client's methods rather than reporting none", async () => {
    const refusal = getFixture(FORBIDDEN_LIST, { recordingsDir }).response;
    const message = (refusal.body as { error?: { message?: string } })?.error
      ?.message;

    replay("get", "*/api/clients/:clientId/payment_details", FORBIDDEN_LIST);

    await expect(loadLookups()).rejects.toThrow(String(message));
    expect(refusal.status).toBeGreaterThanOrEqual(400);
  });
});
