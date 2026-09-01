// -----------------------------------------------------------------------------
/**
 * @fileoverview basket-billing services seam — billing.machine ↔ the billing API
 *
 * ## Job To Be Done
 * `basket-billing.services.ts` drives two HTTP seams through `billing.machine`:
 * `loadLookups` bootstraps the brand config so the machine can report which
 * billing fields the brand requires and offer a billing schema, and `update`
 * PUTs the chosen address/company/phone onto the basket order. This file drives
 * the REAL machine against recorded fixtures and proves both seams — the load
 * lands config + schema + the persisted snapshot, and the save carries the model
 * to the order — plus each failure mode fails closed rather than hanging.
 *
 * ## Provenance
 * Every body replayed here was captured by `pnpm fixtures:generate basket-billing`
 * into this module's own `fixtures/` dir. No body is authored in this file; the
 * session is seeded from the recorded session-store fixtures.
 *
 * ## What Breaks If These Fail
 * Checkout cannot tell a customer a phone/company/address is required, offers no
 * billing form, or silently drops the billing details the customer entered — the
 * order goes to payment with no valid billing address.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import { getFixture } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import billingMachine from "../billing.machine";
import { server } from "./setup.integration";
import type { BillingContext, BillingModel } from "../basket-billing.types";
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

const BASKET_ID =
  /\/api\/orders\/([0-9a-f-]{36})/.exec(
    getFixture("put-orders-id-case-billing", { recordingsDir }).request.path
  )?.[1] ?? "00000000-0000-0000-0000-000000000000";

type Service = Interpreter<BillingContext, never, never, never, never>;

function replay(
  method: "get" | "put",
  route: string,
  key: string,
  status?: number
): void {
  const recorded = getFixture(key, { recordingsDir }).response;
  server.use(
    http[method](route, () =>
      HttpResponse.json(recorded.body as Record<string, unknown>, {
        status: status ?? recorded.status
      })
    )
  );
}

/** Pin the recorded SUCCESS body on every brand endpoint `loadLookups` reads. */
function replayLoadLookups(): void {
  replay("get", "*/api/brand/settings", "get-brand-settings");
  replay("get", "*/api/config/brand/values", "get-config-brand-values");
  replay(
    "get",
    "*/api/config/organisation/values",
    "get-config-organisation-values"
  );
  replay("get", "*/api/org/modules", "get-org-modules");
}

/** Every mutating body the machine actually sent, in order. */
let putBodies: Record<string, unknown>[] = [];

/** Serve the recorded basket for the update PUT, recording what was sent. */
function replayUpdate(status = 200): void {
  const recorded = getFixture("put-orders-id-case-billing", {
    recordingsDir
  }).response;
  server.use(
    http.put("*/api/orders/:id", async ({ request }) => {
      putBodies.push((await request.clone().json()) as Record<string, unknown>);
      return HttpResponse.json(recorded.body as Record<string, unknown>, {
        status
      });
    })
  );
}

async function seedClientSession(): Promise<string> {
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

  return self.data.actor.id;
}

function boot(model: BillingModel = {}, clientId?: string): Service {
  const service = interpret(
    billingMachine.withContext({
      basketId: BASKET_ID,
      clientId,
      model
    } as BillingContext),
    { devTools: false }
  ) as unknown as Service;
  service.start();
  return service;
}

async function waitForLoad(service: Service): Promise<void> {
  await vi.waitFor(
    () => {
      const settled =
        service.state.matches("available") ||
        service.state.matches("complete") ||
        service.state.matches("unavailable") ||
        service.state.matches("error");
      expect(settled).toBe(true);
    },
    { timeout: 15000, interval: 50 }
  );
}

/** SET a model, then wait for the machine to finish parsing + validating it. */
async function setAndSettle(
  service: Service,
  model: BillingModel
): Promise<void> {
  service.send({ type: "SET", data: model });
  await vi.waitFor(
    () => {
      const ready =
        service.state.matches({ available: "valid" }) ||
        service.state.matches({ available: "invalid" }) ||
        service.state.matches("complete");
      expect(ready).toBe(true);
    },
    { timeout: 15000, interval: 50 }
  );
}

// -----------------------------------------------------------------------------

describe("basket-billing loadLookups + update seam", () => {
  let service: Service | undefined;
  let clientId: string;

  beforeEach(async () => {
    putBodies = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    clientId = await seedClientSession();
    replayLoadLookups();
    replayUpdate();
  });

  afterEach(() => {
    service?.stop();
    service = undefined;
    server.resetHandlers();
  });

  it("loadLookups fails closed to unavailable when the brand bootstrap rejects with a 5xx", async () => {
    server.use(
      http.get("*/api/brand/settings", () =>
        HttpResponse.json({ error: "server error" }, { status: 500 })
      ),
      http.get("*/api/config/brand/values", () =>
        HttpResponse.json({ error: "server error" }, { status: 500 })
      ),
      http.get("*/api/config/organisation/values", () =>
        HttpResponse.json({ error: "server error" }, { status: 500 })
      ),
      http.get("*/api/org/modules", () =>
        HttpResponse.json({ error: "server error" }, { status: 500 })
      )
    );

    service = boot({}, clientId);
    await waitForLoad(service);

    expect(
      service.state.matches("unavailable") || service.state.matches("error")
    ).toBe(true);
    expect(service.state.context.schema).toBeUndefined();
  });

  it("loadLookups lands the brand config, a billing schema and the persisted snapshot", async () => {
    service = boot({}, clientId);
    await waitForLoad(service);

    expect(service.state.matches("error")).toBe(false);
    expect(service.state.matches("unavailable")).toBe(false);

    // loadLookups derived the required-field config from the brand bootstrap and
    // offered a billing form schema — AC-6.
    expect(service.state.context.config).toBeDefined();
    expect(service.state.context.schema).toBeDefined();
    expect(service.state.context.uischema).toBeDefined();

    // The initial billing snapshot is captured from the persisted base — AC-7.
    expect(service.state.context.baseModel).toBeDefined();
  });

  it("update PUTs the chosen billing model onto the basket order", async () => {
    service = boot({}, clientId);
    await waitForLoad(service);

    await setAndSettle(service, {
      addressId: "addr-int-1",
      companyId: "co-int-1",
      phoneId: "ph-int-1"
    });
    service.send({ type: "UPDATE" });

    await vi.waitFor(
      () => {
        expect(putBodies.length).toBeGreaterThan(0);
      },
      { timeout: 15000, interval: 50 }
    );

    // The mutation carries exactly the model the customer chose — no stale or
    // dropped field on its way to the order.
    expect(putBodies[0]).toMatchObject({
      address_id: "addr-int-1",
      company_id: "co-int-1",
      phone_id: "ph-int-1"
    });
  });

  it("update surfaces a handled error when the order PUT rejects with a 5xx", async () => {
    service = boot({}, clientId);
    await waitForLoad(service);

    server.use(
      http.put("*/api/orders/:id", () =>
        HttpResponse.json({ error: "server error" }, { status: 500 })
      )
    );

    await setAndSettle(service, {
      addressId: "addr-int-2",
      companyId: "co-int-2",
      phoneId: "ph-int-2"
    });
    service.send({ type: "UPDATE" });

    await vi.waitFor(
      () => {
        expect(service?.state.context.error).toBeDefined();
      },
      { timeout: 15000, interval: 50 }
    );

    expect(service.state.context.error?.status).toBe(500);
  });
});
