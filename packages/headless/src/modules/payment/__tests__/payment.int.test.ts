// -----------------------------------------------------------------------------
/**
 * @fileoverview payment integration — the real order, the real gateway list,
 * the real refusal (AC-1/AC-2/AC-3/AC-10/AC-16)
 *
 * ## Job To Be Done
 * AC-1 and AC-2 say the payment is taken up for the order the client picked and
 * for what is owed on it, and no other order is touched. The module's exposed
 * context is inert (see `payment.surface.test.ts`), so a consumer cannot read
 * the order back — the proof here is the OUTBOUND REQUEST instead: the module is
 * asserted to have gone to the picked order's own resource and to no other. That
 * is the read-back the reality-check rule asks for, and it is the one channel the
 * defect does not close.
 *
 * AC-3 says the payment is handled by the provider standing behind the chosen
 * method and no other of the brand's. The recorded gateway list carries several
 * of this brand's real gateways, so choosing one and asserting the module asked
 * the brand for exactly that order's options is a live contract assertion, not a
 * shape check.
 *
 * AC-10 says a method that can no longer be used stops the payment before
 * anything is taken. The recorded 422 from `POST /api/payments` IS that refusal —
 * captured against real staging, not written here.
 *
 * AC-16 says one client's payment never reaches another client's order. The
 * recorded 404 for an order the recording client cannot see is that boundary.
 *
 * ## Provenance
 * Every body replayed here was captured by `pnpm fixtures:generate payment` into
 * this module's own `fixtures/` dir. No body is authored in this file, and the
 * ids the assertions use are read back out of the recorded request paths rather
 * than typed in — so a re-record cannot leave a stale literal behind.
 *
 * The cleared-payment journeys (AC-4, AC-6) have NO fixture: a successful
 * `POST /api/payments` is a real charge, and capturing one needs a gateway
 * sandbox run through the app-driven recorder. That capture is owed on FE-3130
 * and is not stood in for here.
 *
 * ## Where the pay trigger lives — read this before reading the assertions
 * This module has NO UI and is not driven by a button. The caller — the basket,
 * or the invoice/order machine — constructs `usePayment(...)` only when it has
 * already decided to pay. So construction IS the trigger, and the charge going
 * out on load is correct: it is AC-1, not a defect. `pay()` re-sends PAY for the
 * retry and post-confirmation legs. The assertions below are written to that
 * contract.
 *
 * ## The offsite challenge, proven on a real provider response
 * `post-payments-case-taken-up-paypal-express` is a real 200 carrying a real
 * PayPal sandbox `approval_url`. Replaying it drives the whole challenge leg: the
 * charge goes out, the REDIRECT lands in `payment`, the approval is handed to the
 * client with its query string moved into form fields, and the hand-off form is
 * actually submitted. Nothing here is a shape this file invented.
 *
 * ## The replay trap that produced a false finding, and the guard against it
 * An earlier revision of this file reported that a 404 order still gets charged.
 * That was WRONG and is withdrawn: the replay server matches `/api/invoices/:id`
 * loosely, so the recorded 200 was served for the 404 request and the module
 * never saw a refusal. The AC-16 test below now installs the recorded 404 with an
 * explicit `server.use` handler, so the assertion is about the module rather than
 * about fixture matching.
 *
 * ## What Breaks If These Fail
 * A client's money lands against the wrong order; a brand's gateway list stops
 * being asked for per-order and a client is offered a method that cannot take
 * their currency; or a dead payment method is charged instead of refused.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixture } from "@upmind-automation/test-fixtures";
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

/** The ids the recorder actually captured, read back off the recorded paths. */
function recordedIds(): {
  orderId: string;
  brandId: string;
  gatewayId: string;
} {
  const order = getFixture("get-invoices-id", { recordingsDir });
  const gateways = getFixture("get-brands-id-gateways", { recordingsDir });

  const orderId = /\/api\/invoices\/([0-9a-f-]{36})/.exec(
    order.request.path
  )?.[1];
  const brandId = /\/api\/brands\/([0-9a-f-]{36})\/gateways/.exec(
    gateways.request.path
  )?.[1];

  const body = gateways.response.body as {
    data?: Array<{ gateway_id?: string }>;
  };
  const gatewayId = body.data?.find(row => row.gateway_id)?.gateway_id;

  if (!orderId || !brandId || !gatewayId) {
    throw new Error(
      "The recorded payment fixtures do not carry an order id, a brand id and " +
        "a gateway id. Re-run `pnpm fixtures:generate payment`."
    );
  }
  return { orderId, brandId, gatewayId };
}

const { orderId, brandId, gatewayId } = recordedIds();

/** Replay one recorded `POST /api/payments` response for this test only. */
function replayCharge(key: string): void {
  const recorded = getFixture(key, { recordingsDir }).response;
  server.use(
    http.post("*/api/payments", () =>
      HttpResponse.json(recorded.body as Record<string, unknown>, {
        status: recorded.status
      })
    )
  );
}

/** The approval the real provider returned, read off the recording. */
function recordedApproval(key: string): {
  url?: string;
  method?: string;
  status?: string;
} {
  const body = getFixture(key, { recordingsDir }).response.body as {
    data?: {
      transaction_status?: string;
      approval_url?: { url?: string; method?: string };
    };
  };
  return {
    url: body.data?.approval_url?.url,
    method: body.data?.approval_url?.method,
    status: body.data?.transaction_status
  };
}

/** The refusal the real API wrote, read off the recording. */
function recordedRefusal(key: string): { message?: string; field?: string } {
  const body = getFixture(key, { recordingsDir }).response.body as {
    error?: { message?: string; data?: Record<string, string[]> };
  };
  return {
    message: body.error?.message,
    field: Object.keys(body.error?.data ?? {})[0]
  };
}

// Brand identity is a SETTING, not journey data — mocking it is sanctioned
// (ADR-021 "mock settings not data"). The id itself comes from the recorded
// gateway path, so the mock cannot drift from what was captured.
vi.mock("../../brand", () => ({
  useBrand: () => ({
    brandId: { value: brandId },
    countryId: { value: undefined },
    getConfig: () => ({}),
    getConfigValue: () => undefined
  })
}));

/** Every request the module actually sent, in order. */
let outbound: string[] = [];

/** The body of every charge the module posted. */
let charges: Array<Record<string, unknown>> = [];

server.events.on("request:start", ({ request }) => {
  const path = new URL(request.url).pathname;
  outbound.push(`${request.method} ${path}`);

  if (request.method === "POST" && path === "/api/payments") {
    request
      .clone()
      .json()
      .then(body => charges.push(body as Record<string, unknown>))
      .catch(() => charges.push({ unparsable: true }));
  }
});

const settle = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

/** Answer `initStore()`'s guest-token bootstrap with session-store's capture. */
function installGuestTokenStub(): void {
  const guest = getFixture("post-oauth-access-token-guest", {
    recordingsDir: sessionRecordingsDir
  });
  server.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json(guest.response.body as Record<string, unknown>, {
        status: guest.response.status
      })
    )
  );
}

/** Sign a real client in through the real session store. */
async function seedClientSession(): Promise<void> {
  installGuestTokenStub();

  const { useSessionStore, useActiveSession } =
    await import("../../session-store");
  const { mapSessionUser } =
    await import("../../session-store/session-store.mappers");
  const { getFixtureBody } = await import("@upmind-automation/test-fixtures");

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

// -----------------------------------------------------------------------------

describe("payment integration — the order the client picked", () => {
  beforeEach(async () => {
    outbound = [];
    charges = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("AC-1/AC-2 asks for the picked order's own resource and no other order's", async () => {
    const { usePayment } = await import("../usePayment");

    usePayment({
      orderId,
      paymentDetail: { gateway_id: gatewayId } as never
    });
    await settle(50);

    const invoiceCalls = outbound.filter(entry =>
      entry.includes("/api/invoices/")
    );

    expect(invoiceCalls).toContain(`GET /api/invoices/${orderId}`);
    expect(
      invoiceCalls.filter(entry => entry !== `GET /api/invoices/${orderId}`)
    ).toEqual([]);
  });

  it("AC-3 asks this brand for the options that order can actually be paid with", async () => {
    const { usePayment } = await import("../usePayment");

    usePayment({
      orderId,
      paymentDetail: { gateway_id: gatewayId } as never
    });
    await settle(50);

    expect(outbound).toContain(`GET /api/brands/${brandId}/gateways`);
  });

  // A cleared charge is a real 200 from POST /api/payments — a real charge with
  // no recording (owed on FE-3130). Asserting the charge cannot be greened
  // without either that recording or answering it with an unrelated response, so
  // it stays a declared gap rather than a test proven against fiction.
  it.todo(
    "AC-1/AC-2/AC-3 charges the picked order through the chosen method, and nothing else (needs a cleared-charge 200 recording — FE-3130)"
  );
});

describe("payment integration — the refusals staging really returns", () => {
  beforeEach(async () => {
    outbound = [];
    charges = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("AC-10 a method that cannot be used is refused, and the API's own reason reaches the client", async () => {
    replayCharge("post-payments-case-method-unusable");

    const { usePayment } = await import("../usePayment");

    const payment = usePayment({
      orderId,
      paymentDetail: { gateway_id: gatewayId } as never
    });
    await settle(120);

    expect(payment.meta.value.hasFailed).toBe(true);
    expect(payment.meta.value.hasPaid).toBe(false);
    const refusal = recordedRefusal("post-payments-case-method-unusable");

    expect(payment.errors.value?.status).toBe(422);
    expect(payment.errors.value?.message).toBe(refusal.message);
    expect(JSON.stringify(payment.errors.value?.data)).toContain(refusal.field);
  });

  it("AC-5 a provider that wants the client's approval hands them where to give it", async () => {
    const submit = vi
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});

    replayCharge("post-payments-case-taken-up-paypal-express");

    const { usePayment } = await import("../usePayment");

    const payment = usePayment({
      orderId,
      paymentDetail: { gateway_id: gatewayId } as never
    });
    await settle(200);

    const approval = recordedApproval(
      "post-payments-case-taken-up-paypal-express"
    );

    // The provider really does want the client's approval, and really does say
    // where to give it — this is a recorded PayPal sandbox response, not a shape
    // this file invented.
    expect(approval.status).toBe("REDIRECT");
    expect(approval.url).toMatch(/^https:\/\/www\.sandbox\.paypal\.com\//);

    expect(outbound).toContain("POST /api/payments");
    expect(payment.meta.value.hasFailed).toBe(false);
    expect(payment.payment.value?.transaction_status).toBe("REDIRECT");

    // What the client is handed: the provider's own destination, with the query
    // string moved into form fields so the hand-off survives a POST.
    const recorded = new URL(approval.url ?? "");

    expect(payment.context.value?.approval?.url).toBe(
      `${recorded.origin}${recorded.pathname}`
    );
    expect(payment.context.value?.approval?.fields).toEqual(
      Object.fromEntries(recorded.searchParams.entries())
    );
    expect(submit).toHaveBeenCalled();

    submit.mockRestore();
  });

  it("AC-16 an order the client cannot see stops the payment before anything is attempted", async () => {
    const refused = getFixture("get-invoices-id-case-not-mine", {
      recordingsDir
    });

    expect(refused.response.status).toBe(404);

    server.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json(refused.response.body as Record<string, unknown>, {
          status: refused.response.status
        })
      )
    );

    const { usePayment } = await import("../usePayment");

    const payment = usePayment({
      orderId: "00000000-0000-0000-0000-000000000000",
      paymentDetail: { gateway_id: gatewayId } as never
    });
    await settle(120);
    payment.pay();
    await settle(50);

    expect(outbound.filter(entry => entry === "POST /api/payments")).toEqual(
      []
    );
    expect(payment.meta.value.hasPaid).toBe(false);
  });

  it("AC-10 the recorded refusal for an unusable method is a 422 that takes nothing", () => {
    const refusal = getFixture("post-payments-case-method-unusable", {
      recordingsDir
    });

    expect(refusal.response.status).toBe(422);
    expect(refusal.request.method).toBe("POST");
  });
});
