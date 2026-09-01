// -----------------------------------------------------------------------------
/**
 * @fileoverview basket-billing loadLookups — brand-bootstrap failure mode
 *
 * ## Job To Be Done
 * Prove the billing seam fails CLOSED when the brand bootstrap the billing form
 * cannot be built without rejects with a 5xx: the seam never reaches `available`
 * and never offers a billing schema — it degrades to a handled failure, never an
 * unhandled hang. The real basket machine is booted and targeted at the claimed
 * basket exactly as in the happy-path file; the whole brand bootstrap the load
 * warms for billing (`brand/settings`, `config/brand/values`,
 * `config/organisation/values`, `org/modules`) is forced to 500.
 *
 * This lives in its OWN file so the failing brand read runs against fresh module
 * state — the brand config is served by a module-level cache the happy-path file
 * has already populated, so the 5xx must be exercised in isolation to reach the
 * real boundary (mirrors `unified/unified.loadLookups-failure.int.test.ts`).
 *
 * ## Provenance
 * The success bodies are this module's co-located recorded fixtures. The
 * representative 5xx is the recorded FORCED control variant
 * (`get-brand-settings-case-server-error`, status 500); the collateral brand
 * reads are failed with inline control 5xx envelopes, which the provenance rule
 * exempts (status ≥ 400 control responses — mirrors
 * `unified/unified.loadLookups-failure.int.test.ts`). The session is seeded from
 * the recorded session-store fixtures.
 *
 * ## What Breaks If These Fail
 * A transient brand-config outage hangs the checkout billing form forever
 * instead of degrading to a handled failure the customer can retry.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import { getFixture } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import "../../basket/useBasket";
import basketMachine from "../../basket/basket.machine";
import { server } from "./setup.integration";
import type { BasketContext } from "../../basket/basket.types";
import type { ActorRef, Interpreter } from "xstate";

// Analytics is a fire-and-forget side-effect the basket machine runs on
// `shopping` entry; it throws without a fully hydrated ecommerce basket and is
// not the seam under test. Stub only `useDataLayer`, leaving the machine real.
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

const PERSISTENT_BASKET_ID = "85d26e96-783d-1652-d98f-314502e70439";

type BasketService = Interpreter<BasketContext, never, never, never, never>;
type BillingActor = ActorRef<
  never,
  { matches: (value: unknown) => boolean; context: Record<string, unknown> }
>;

/** Force a 5xx across the whole brand bootstrap the billing seam needs. */
function replayBrandBootstrap5xx(): void {
  const forced = getFixture("get-brand-settings-case-server-error", {
    recordingsDir
  }).response;
  const controlError = { status: "error", data: null };
  server.use(
    http.get("*/api/brand/settings", () =>
      HttpResponse.json(forced.body as Record<string, unknown>, {
        status: forced.status
      })
    ),
    http.get("*/api/config/brand/values", () =>
      HttpResponse.json(controlError, { status: 500 })
    ),
    http.get("*/api/config/organisation/values", () =>
      HttpResponse.json(controlError, { status: 500 })
    ),
    http.get("*/api/org/modules", () =>
      HttpResponse.json(controlError, { status: 500 })
    )
  );
}

async function seedClientSession(): Promise<void> {
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

function billingChild(svc: BasketService): BillingActor | undefined {
  return svc.state.context.actors?.billing as BillingActor | undefined;
}

function billingIsUp(svc: BasketService): boolean {
  const billing = billingChild(svc);
  if (!billing) return false;
  const snapshot = billing.getSnapshot();
  return snapshot.matches("available") || snapshot.matches("complete");
}

// -----------------------------------------------------------------------------

describe("basket-billing loadLookups — brand bootstrap fails closed", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replayBrandBootstrap5xx();
  });

  afterEach(() => {
    service?.stop();
    service = undefined;
    server.resetHandlers();
  });

  it("never brings the billing seam up when the brand bootstrap rejects with a 5xx", async () => {
    service = interpret(basketMachine).start() as unknown as BasketService;
    service.send({ type: "SET_TARGET_BASKET", data: PERSISTENT_BASKET_ID });

    await vi.waitFor(
      () => {
        const svc = service!;
        const settledFailure =
          svc.state.matches("error") ||
          svc.state.matches("unavailable") ||
          (() => {
            const billing = billingChild(svc);
            if (!billing) return false;
            const snapshot = billing.getSnapshot();
            return snapshot.matches("unavailable") || snapshot.matches("error");
          })();
        expect(settledFailure).toBe(true);
      },
      { timeout: 20000, interval: 50 }
    );

    expect(billingIsUp(service)).toBe(false);
    const billing = billingChild(service);
    if (billing) {
      expect(billing.getSnapshot().context.schema).toBeUndefined();
    }
  });
});
