// -----------------------------------------------------------------------------
/**
 * @fileoverview basket-billing seam — driven through the REAL basket machine
 *
 * ## Job To Be Done
 * Prove the billing seam the way the basket machine actually reaches it, not via
 * a scaffold host. The basket machine (`basket.machine`) is booted, targeted at
 * a persistent CLAIMED basket with SET_TARGET_BASKET, and a client session is
 * seeded; AUTHENTICATED drives `load` → `spawnActors`, which spawns the REAL
 * billing child once the loaded basket carries a `client_id`. Against that child
 * this file proves: the owner's basket load brings billing to `available`
 * (AC-17); a load that is denied because the basket is not the client's never
 * brings billing up (AC-18); an unclaimed basket that loads (200) but carries no
 * `client_id` reaches `shopping` yet still never spawns billing (AC-19 — the
 * client_id spawn-gate control); the billing update carries the chosen model to
 * the order; and a 5xx on that update fails closed with a handled error.
 *
 * ## Provenance
 * Every body replayed here is recorded reality. The claimed basket
 * (`get-orders-id`), its real ownership denial (`get-orders-id-case-not-mine` —
 * a real 403), the four brand-bootstrap reads, the billing PUT, and the
 * forced-5xx control variant of that PUT were captured by
 * `pnpm fixtures:generate basket-billing` into this module's own `fixtures/` dir.
 * The unclaimed-basket body (`get-orders-current-case-guest` — a 200 GET orders
 * with `client_id: null`) is a genuinely-recorded guest basket reused from the
 * product-setup guest journey, its capture provenance preserved verbatim in the
 * fixture; basket-billing records no guest basket of its own. No body is authored
 * here; the session is seeded from the recorded session-store fixtures.
 *
 * ## What Breaks If These Fail
 * Checkout offers no billing form on a real basket, silently drops the billing
 * details on their way to the order, or lets a client reach a basket that is not
 * theirs.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import { getFixture } from "@upmind-automation/test-fixtures";
import { replayStep } from "@upmind-automation/test-fixtures/replay-server";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
// Load useBasket first: it owns the module-level `interpret(basketMachine)`
// singleton, which crashes with an undefined machine if basket.machine is the
// entry that re-enters the basket barrel mid-evaluation. Importing useBasket
// first forces basket.machine to fully evaluate before that singleton is built.
import "../../basket/useBasket";
// This integration test drives the REAL basket parent so it spawns the billing
// child exactly as production does. The public surface (useBasket) is a global
// singleton, unfit for the fresh, isolated machine each test boots here — so the
// test reaches basket.machine directly. Justified test-only exception to the
// production cross-module rule.
// eslint-disable-next-line @internal/no-cross-module-imports
import basketMachine from "../../basket/basket.machine";
import { server } from "./setup.integration";
import type { BasketContext } from "../../basket/basket.types";
import type { BillingModel } from "../basket-billing.types";
import type { ActorRef, Interpreter } from "xstate";

// -----------------------------------------------------------------------------

// The basket machine fires fire-and-forget analytics on `shopping` entry
// (`pushShippingInfo` → `useDataLayer().dataLayer().withEcommerce()`), which
// throws `basket_not_available` here because the sibling actors (currency,
// payment-detail, custom-fields) have no fixtures and never hydrate an
// ecommerce-ready basket. Analytics is not the seam under test; stub only
// `useDataLayer` to a no-op chain, leaving the rest of the machine real.
vi.mock("../../system-analytics", async importActual => {
  const actual = await importActual<typeof import("../../system-analytics")>();
  const noop: unknown = new Proxy(
    function () {
      return noop;
    },
    {
      get: () => noop,
      apply: () => noop
    }
  );
  return { ...actual, useDataLayer: () => noop };
});

const recordingsDir = join(import.meta.dirname, "fixtures");
const sessionRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "session-store",
  "__tests__",
  "fixtures"
);
const brandRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "brand",
  "__tests__",
  "fixtures"
);
const systemRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "system",
  "__tests__",
  "fixtures"
);
const basketRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "basket",
  "__tests__",
  "fixtures"
);

/**
 * The boot reads a signed-in client makes — the brand's settings and config, the
 * system reference data, the guest token grant `initStore()` mints, the basket
 * claim the machine issues — answered by the RECORDINGS of the modules that own
 * them (brand, system, session-store, basket), never by a body copied into this
 * module (ADR 035, FE-3145). This module's own `orders/{id}` captures stay its
 * own and win as initial handlers or per-test `server.use` overrides.
 */
function installBackgroundStubs(): void {
  replayStep(server, brandRecordingsDir);
  replayStep(server, systemRecordingsDir);
  replayStep(server, sessionRecordingsDir);
  replayStep(server, basketRecordingsDir);
  // Every token grant shares one url and differs only by body, so name the
  // guest grant `initStore()` mints (session-store owns the recording).
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

const PERSISTENT_BASKET_ID = "85d26e96-783d-1652-d98f-314502e70439";

// The id inside the recorded unclaimed-basket body; targeting it makes the load
// URL and the served (client_id: null) body agree.
const GUEST_BASKET_ID = "mock-uuid-262";

type BasketService = Interpreter<BasketContext, never, never, never, never>;
type BillingActor = ActorRef<
  never,
  { matches: (value: unknown) => boolean; context: Record<string, unknown> }
>;

/** Serve the recorded ownership denial for the basket load (a real 403). */
function replayNotMineLoad(): void {
  const denial = getFixture("get-orders-id-case-not-mine", {
    recordingsDir
  }).response;
  server.use(
    http.get("*/api/orders/:id", () =>
      HttpResponse.json(denial.body as Record<string, unknown>, {
        status: denial.status
      })
    )
  );
}

/** Serve the recorded unclaimed (guest) basket for the load (a 200, client_id null). */
function replayGuestLoad(): void {
  const guest = getFixture("get-orders-current-case-guest", {
    recordingsDir
  }).response;
  server.use(
    http.get("*/api/orders/:id", () =>
      HttpResponse.json(guest.body as Record<string, unknown>, {
        status: guest.status
      })
    )
  );
}

/** Every mutating body the billing child actually sent, in order. */
let putBodies: Record<string, unknown>[] = [];

/** Serve the recorded basket for the billing PUT, recording what was sent. */
function replayUpdate(
  status?: number,
  key = "put-orders-id-case-billing"
): void {
  const recorded = getFixture(key, { recordingsDir }).response;
  server.use(
    http.put("*/api/orders/:id", async ({ request }) => {
      putBodies.push((await request.clone().json()) as Record<string, unknown>);
      return HttpResponse.json(recorded.body as Record<string, unknown>, {
        status: status ?? recorded.status
      });
    })
  );
}

async function seedClientSession(): Promise<void> {
  installBackgroundStubs();

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
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
  });
}

let service: BasketService | undefined;

/** Boot a fresh basket machine and target a basket (the persistent one by default). */
function bootBasket(basketId: string = PERSISTENT_BASKET_ID): BasketService {
  const svc = interpret(basketMachine).start() as unknown as BasketService;
  service = svc;
  svc.send({ type: "SET_TARGET_BASKET", data: basketId });
  return svc;
}

function billingChild(svc: BasketService): BillingActor | undefined {
  return svc.state.context.actors?.billing as BillingActor | undefined;
}

async function waitForBillingAvailable(
  svc: BasketService
): Promise<BillingActor> {
  let billing: BillingActor | undefined;
  await vi.waitFor(
    () => {
      billing = billingChild(svc);
      expect(billing).toBeDefined();
      const snapshot = billing!.getSnapshot();
      expect(
        snapshot.matches("available") || snapshot.matches("complete")
      ).toBe(true);
    },
    { timeout: 20000, interval: 50 }
  );
  return billing!;
}

/** SET a model on the billing child, then wait for it to settle. */
async function setAndSettle(
  billing: BillingActor,
  model: BillingModel
): Promise<void> {
  billing.send({ type: "SET", data: model } as never);
  await vi.waitFor(
    () => {
      const snapshot = billing.getSnapshot();
      expect(
        snapshot.matches({ available: "valid" }) ||
          snapshot.matches({ available: "invalid" })
      ).toBe(true);
    },
    { timeout: 20000, interval: 50 }
  );
}

// -----------------------------------------------------------------------------

describe("basket-billing seam — the real basket machine spawns billing", () => {
  beforeEach(async () => {
    putBodies = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    service?.stop();
    service = undefined;
    server.resetHandlers();
  });

  it("AC-17 brings billing to available when a client loads their own claimed basket", async () => {
    const svc = bootBasket();
    const billing = await waitForBillingAvailable(svc);

    const snapshot = billing.getSnapshot();
    expect(snapshot.matches("error")).toBe(false);
    expect(snapshot.matches("unavailable")).toBe(false);
    expect(snapshot.context.config).toBeDefined();
    expect(snapshot.context.schema).toBeDefined();
  });

  /**
   * The session under test is the primary client throughout; this test performs
   * no in-test identity switch. It replays the recorded ownership denial a
   * DIFFERENT client received at capture (the GET issued under that other
   * client's token → a real 403) — the differing identity lives in the fixture's
   * provenance, not in the running session. The denied load settles the basket
   * machine at `unavailable` (its invalid-target-basket outcome), so billing
   * never spawns.
   */
  it("AC-18 never brings billing up when a client loads a basket that is not theirs", async () => {
    replayNotMineLoad();

    const svc = bootBasket();

    await vi.waitFor(
      () => {
        expect(svc.state.matches("unavailable")).toBe(true);
      },
      { timeout: 20000, interval: 50 }
    );

    const billing = billingChild(svc);
    const availableUp =
      !!billing &&
      (billing.getSnapshot().matches("available") ||
        billing.getSnapshot().matches("complete"));
    expect(availableUp).toBe(false);
  });

  it("AC-19 never brings billing up when a loaded basket has no owner", async () => {
    replayGuestLoad();

    const svc = bootBasket(GUEST_BASKET_ID);

    await vi.waitFor(
      () => {
        expect(svc.state.matches("shopping")).toBe(true);
      },
      { timeout: 20000, interval: 50 }
    );

    expect(billingChild(svc)).toBeUndefined();
  });

  it("PUTs the chosen billing model onto the basket order", async () => {
    replayUpdate();

    const svc = bootBasket();
    const billing = await waitForBillingAvailable(svc);

    await setAndSettle(billing, {
      addressId: "addr-int-1",
      companyId: "co-int-1",
      phoneId: "ph-int-1"
    });
    billing.send({ type: "UPDATE" } as never);

    await vi.waitFor(
      () => {
        expect(putBodies.length).toBeGreaterThan(0);
      },
      { timeout: 20000, interval: 50 }
    );

    expect(putBodies[0]).toMatchObject({
      address_id: "addr-int-1",
      company_id: "co-int-1",
      phone_id: "ph-int-1"
    });
  });

  it("surfaces a handled error when the billing PUT rejects with a 5xx", async () => {
    const svc = bootBasket();
    const billing = await waitForBillingAvailable(svc);

    const forced = getFixture("put-orders-id-case-billing-server-error", {
      recordingsDir
    }).response;
    server.use(
      http.put("*/api/orders/:id", () =>
        HttpResponse.json(forced.body as Record<string, unknown>, {
          status: forced.status
        })
      )
    );

    await setAndSettle(billing, {
      addressId: "addr-int-2",
      companyId: "co-int-2",
      phoneId: "ph-int-2"
    });
    billing.send({ type: "UPDATE" } as never);

    await vi.waitFor(
      () => {
        expect(billing.getSnapshot().context.error).toBeDefined();
      },
      { timeout: 20000, interval: 50 }
    );

    expect(
      (billing.getSnapshot().context.error as { status?: number }).status
    ).toBe(500);
  });
});
