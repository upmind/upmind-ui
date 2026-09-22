// -----------------------------------------------------------------------------
/**
 * @fileoverview useContractProduct writes — renew stop/abort, consolidation,
 * scheduled cancellation (integration, AC-5/AC-9/AC-22/AC-23)
 *
 * ## Job To Be Done
 * Drive the REAL `useContractProduct()` manager actions against RECORDED
 * staging responses and prove each write reaches the wire exactly as
 * design.md §8.3 states. The exposed action names are `stopRenewing()` /
 * `resumeRenewing()` — design.md §8.3's action column and
 * `ContractProductMachineServices`' key names (`requestSoftCancel` /
 * `abortSoftCancel`) name the INVOKED SERVICE, not the composable's public
 * action; `Object.keys(manager.useActions())` on the real module confirms
 * the exposed names used below. They PUT `{ renew }` to `modify_renew`;
 * `setConsolidation` PUTs
 * `{ invoice_consolidation_enabled }` to `properties`; `scheduleCancellation`/
 * `revokeScheduledCancellation` PUT to `schedule-cancel(-revoke)` under
 * `contracts/{c}/products/{p}/…` — the REAL route
 * (`contract-product.fixtures.ts` fileoverview limit 3; design.md §8.3's
 * stated `contract_products/{p}/…` path 404s on this API). Every response
 * body is the module's OWN recorded capture — never a hand-rolled mock.
 *
 * ## What Breaks If These Fail
 * A client's renewal stop, consolidation choice, or scheduled cancellation is
 * silently sent to the wrong product, with the wrong body, or under the
 * wrong identity.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  ContractStatusCodes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import {
  ContractProductContextTypes,
  useContractProduct,
  useContractProducts
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  installBackgroundStubs,
  installProductHandler,
  observeAllRequests,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";
import type { ContractProductObservedRequest } from "./contract-product.int-helpers";

// -----------------------------------------------------------------------------

type Captured = { request?: ContractProductObservedRequest; body?: unknown };

function capture(request: Request, into: Captured): void {
  into.request = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  };
}

/** Opens the manager over the recorded product and waits for it to settle. */
async function openManager() {
  const { accessToken } = await seedClientSession();
  installProductHandler(server);
  const row = recorded.one().data;
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
  await manager.useActions().isReady();
  return { manager, row, accessToken };
}

/**
 * Opens the manager over the REAL recorded product row, with ONLY the
 * `overrides` fields replaced — never a hand-typed body. Used to reach a
 * record shape (`staged_import: true`, a cancelled/lapsed `status.code`, a
 * one-off `billing_cycle_months: 0`) this staging client's own reachable
 * products do not carry (`contract-product.fixtures.ts` fileoverview
 * limit 2), so AC-11's guard refusals can still be proven against the
 * module's own real wire shape rather than skipped for want of a live
 * candidate.
 */
async function openManagerWith(overrides: Record<string, unknown>) {
  const { accessToken } = await seedClientSession();
  const base = recorded.one().data as Record<string, unknown> & {
    id: string;
    contract_id: string;
  };
  const row = { ...base, ...overrides };
  installProductHandler(server, row);
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
  await manager.useActions().isReady();
  return { manager, row, accessToken };
}

/**
 * The value an action SETTLED on: its rejection, a `{ resolved }` wrapper, or
 * the `never-settled` sentinel. Raced rather than awaited outright, matching
 * `contract-product.auth-guard.int.test.ts`'s own pattern — an action-level
 * refusal (design.md §8.3) is expected to settle promptly with no request,
 * never to hang.
 */
async function settlement(action: Promise<unknown>): Promise<unknown> {
  return Promise.race([
    action.then(
      resolved => ({ resolved }),
      rejection => rejection
    ),
    new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
  ]);
}

// -----------------------------------------------------------------------------

/**
 * `contract-product.feature`'s `@AC-11` scenarios promise that a refused
 * change is NEVER sent — "not one that is sent and refused". Each guard
 * below opens the manager over a REAL row shaped into the refused state
 * (staged, cancelled/lapsed, or one-off), attempts the write, and proves
 * BOTH halves of that promise: the action does not resolve as a normal
 * success, and `observeAllRequests()` sees no matching outbound call at all
 * — never merely that a response was rejected server-side.
 */
describe("useContractProduct — a product I cannot act on refuses my changes without sending a request (AC-11)", () => {
  it("AC-11 a staged product refuses stopRenewing and setConsolidation, sending no request to either endpoint", async () => {
    const { manager, row } = await openManagerWith({ staged_import: true });
    const observed = observeAllRequests();

    const stopSettled = await settlement(manager.useActions().stopRenewing());
    const consolidationSettled = await settlement(
      manager.useActions().setConsolidation({
        invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
      })
    );

    // The action-level half of the promise: both settlements resolve
    // PROMPTLY (never `never-settled`) to the refusal's own `false` — not to
    // a truthy payload that would signal the write actually went through,
    // and not a hang. A regression that let a refused write resolve as if it
    // had succeeded is caught here, not only by the absence of a request
    // below.
    expect(stopSettled).toEqual({ resolved: false });
    expect(consolidationSettled).toEqual({ resolved: false });

    observed.stop();
    expect(
      observed
        .matching(
          `/contracts/${row.contract_id}/products/${row.id}/modify_renew`
        )
        .map(request => request.url)
    ).toEqual([]);
    expect(
      observed
        .matching(`/contracts/${row.contract_id}/products/${row.id}/properties`)
        .map(request => request.url)
    ).toEqual([]);
  });

  it("AC-11 a cancelled product refuses setConsolidation, sending no request", async () => {
    const { manager, row } = await openManagerWith({
      status: { code: ContractStatusCodes.CANCELLED }
    });
    const observed = observeAllRequests();

    const settled = await settlement(
      manager.useActions().setConsolidation({
        invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
      })
    );

    expect(settled).toEqual({ resolved: false });
    observed.stop();
    expect(
      observed
        .matching(`/contracts/${row.contract_id}/products/${row.id}/properties`)
        .map(request => request.url)
    ).toEqual([]);
  });

  /**
   * `contract-product.feature:265` — "a product that is merely suspended is
   * not one I have finished with — on that one I can still stop it renewing,
   * change how it is invoiced, and book a scheduled cancellation, exactly as
   * my account area lets me today". This is the PARITY-LOSS direction the
   * refusal test above cannot prove: it shows a CANCELLED product is
   * refused, never that a SUSPENDED one is still offered every one of those
   * three changes. Driven over a REAL row with only `status.code` overridden
   * to `SUSPENDED` (`openManagerWith`'s own documented pattern for a state
   * this staging client's reachable products do not carry) — never a
   * fabricated body.
   */
  it("AC-11 a merely suspended product is NOT one I have finished with — stopRenewing, setConsolidation and scheduleCancellation are all still offered normally", async () => {
    const { manager, row, accessToken } = await openManagerWith({
      status: { code: ContractStatusCodes.SUSPENDED }
    });
    const captured: {
      renew?: Captured;
      consolidation?: Captured;
      schedule?: Captured;
    } = {};

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        async ({ request }) => {
          captured.renew = {};
          capture(request, captured.renew);
          captured.renew.body = await request.json();
          return HttpResponse.json(recorded.softCancelled(), { status: 200 });
        }
      ),
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/properties`,
        async ({ request }) => {
          captured.consolidation = {};
          capture(request, captured.consolidation);
          captured.consolidation.body = await request.json();
          return HttpResponse.json(recorded.consolidationSet(), {
            status: 200
          });
        }
      ),
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/schedule-cancel`,
        async ({ request }) => {
          captured.schedule = {};
          capture(request, captured.schedule);
          captured.schedule.body = await request.json();
          return HttpResponse.json(recorded.cancellationScheduled(), {
            status: 200
          });
        }
      )
    );

    await manager.useActions().stopRenewing();
    await manager.useActions().setConsolidation({
      invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
    });
    await manager
      .useActions()
      .scheduleCancellation({ futureCancellationDate: "2027-01-01" });

    expect(captured.renew?.request).toBeDefined();
    expect(captured.consolidation?.request).toBeDefined();
    expect(captured.schedule?.request).toBeDefined();
    assertClientIdentityTransport(captured.renew!.request!, accessToken);
    assertClientIdentityTransport(
      captured.consolidation!.request!,
      accessToken
    );
    assertClientIdentityTransport(captured.schedule!.request!, accessToken);
    expect(captured.renew!.body).toEqual({ renew: false });
    expect(captured.consolidation!.body).toEqual({
      invoice_consolidation_enabled: InvoiceConsolidationTypes.ENABLED
    });
    expect(captured.schedule!.body).toEqual({
      future_cancellation_date: "2027-01-01"
    });
  });

  it("AC-11 a one-off purchase refuses setConsolidation, sending no request — the choice is not offered to a subscription-only change", async () => {
    const { manager, row } = await openManagerWith({
      billing_cycle_months: 0
    });
    const observed = observeAllRequests();

    const settled = await settlement(
      manager.useActions().setConsolidation({
        invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
      })
    );

    expect(settled).toEqual({ resolved: false });
    observed.stop();
    expect(
      observed
        .matching(`/contracts/${row.contract_id}/products/${row.id}/properties`)
        .map(request => request.url)
    ).toEqual([]);
  });
});

describe("useContractProduct — I stop one of my subscriptions renewing, and change my mind (AC-5)", () => {
  it("AC-5 PUTs {renew:false} to modify_renew, under my own identity", async () => {
    const { manager, row, accessToken } = await openManager();
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.softCancelled(), { status: 200 });
        }
      )
    );

    await manager.useActions().stopRenewing();

    expect(captured.request).toBeDefined();
    expect(captured.request!.method).toBe("PUT");
    assertClientIdentityTransport(captured.request!, accessToken);
    expect(captured.body).toEqual({ renew: false });
  });

  it("AC-5 PUTs {renew:true} to modify_renew when I carry on instead", async () => {
    // RESUME only fires from `status.expiring` (flow.md §3) — a plain
    // `active` row no-ops it. Seed an expiring row from two REAL captures:
    // the base product read, with `renew`/`calculated_cancel_date`
    // overridden to the REAL values `put-…modify-renew-case-stop` recorded —
    // the server's own post-effect of the stop write, assembled rather than
    // hand-typed.
    const { accessToken } = await seedClientSession();
    const base = recorded.one().data as Record<string, unknown> & {
      id: string;
      contract_id: string;
    };
    const stopped = recorded.softCancelled().data as {
      renew: boolean;
      calculated_cancel_date: string;
    };
    const row = {
      ...base,
      renew: stopped.renew,
      calculated_cancel_date: stopped.calculated_cancel_date
    };
    installProductHandler(server, row);
    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
    await manager.useActions().isReady();
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.softCancelAborted(), {
            status: 200
          });
        }
      )
    );

    await manager.useActions().resumeRenewing();

    expect(captured.request).toBeDefined();
    assertClientIdentityTransport(captured.request!, accessToken);
    expect(captured.body).toEqual({ renew: true });
  });

  it("AC-5 carries my reason and custom fields when I supply them, and nothing travels in their place when I don't", async () => {
    const { manager, row } = await openManager();
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        async ({ request }) => {
          captured.body = await request.json();
          return HttpResponse.json(recorded.softCancelled(), { status: 200 });
        }
      )
    );

    await manager.useActions().stopRenewing({ reason: "too expensive" });

    expect(captured.body).toEqual({
      renew: false,
      cancellation_reason: "too expensive"
    });
  });

  it("AC-5 stopping renewal is not the renewal-invoicing permission — a product not allowed to switch that off still stops renewing normally", async () => {
    // design.md §8.3 row C5: the gate `can_disable_auto_create_renew_invoice`
    // goes with the excluded auto-renew-invoicing endpoint, never with this
    // stop-renewing write. A REAL row with that gate forced false proves the
    // module ignores it — the request still reaches the wire unchanged.
    const { manager, row } = await openManagerWith({
      can_disable_auto_create_renew_invoice: false
    });
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.softCancelled(), { status: 200 });
        }
      )
    );

    await manager.useActions().stopRenewing();

    expect(captured.request).toBeDefined();
    expect(captured.body).toEqual({ renew: false });
  });
});

describe("useContractProduct — I decide whether one subscription joins my consolidated invoice (AC-9)", () => {
  it.each([
    ["opted out", InvoiceConsolidationTypes.DISABLED],
    ["opted in", InvoiceConsolidationTypes.ENABLED],
    ["follow my account", InvoiceConsolidationTypes.INHERIT]
  ])(
    "AC-9 setting my choice to %s PUTs { invoice_consolidation_enabled: %i } to properties, in the platform's existing consolidation vocabulary",
    async (_choice, expected) => {
      const { manager, row, accessToken } = await openManager();
      const captured: Captured = {};

      server?.use(
        http.put(
          `*/contracts/${row.contract_id}/products/${row.id}/properties`,
          async ({ request }) => {
            capture(request, captured);
            captured.body = await request.json();
            return HttpResponse.json(recorded.consolidationSet(), {
              status: 200
            });
          }
        )
      );

      await manager
        .useActions()
        .setConsolidation({ invoiceConsolidationEnabled: expected });

      expect(captured.request).toBeDefined();
      assertClientIdentityTransport(captured.request!, accessToken);
      expect(captured.body).toEqual({
        invoice_consolidation_enabled: expected
      });
    }
  );
});

describe("useContractProduct — I book a cancellation for a date I choose, and revoke it (AC-22/AC-23)", () => {
  it("AC-22 PUTs { future_cancellation_date } to contracts/{c}/products/{p}/schedule-cancel — the REAL route, my own status unchanged, and every reader re-reads (AC-13)", async () => {
    const { accessToken } = await seedClientSession();
    const row = recorded.one().data as Record<string, unknown> & {
      id: string;
      contract_id: string;
      status: { code: string };
    };
    const handler = installProductHandler(server);
    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
    await manager.useActions().isReady();
    const readsBeforeWrite = handler.reads();
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/schedule-cancel`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.cancellationScheduled(), {
            status: 200
          });
        }
      )
    );

    await manager
      .useActions()
      .scheduleCancellation({ futureCancellationDate: "2027-01-01" });

    expect(captured.request).toBeDefined();
    assertClientIdentityTransport(captured.request!, accessToken);
    expect(captured.body).toEqual({ future_cancellation_date: "2027-01-01" });
    // The REAL capture `put-…-schedule-cancel.json` still carries
    // `status.code: contract_active`, exactly as the base read does — a
    // booked cancellation is a self-transition (flow.md §3), never the hard
    // request that moves the node.
    expect(manager.useContext().contractProduct.value?.status?.code).toBe(
      row.status.code
    );
    // Every reader re-reads (AC-13's own promise, exercised here for the
    // manager itself): the product GET fires again after the write.
    expect(handler.reads()).toBeGreaterThan(readsBeforeWrite);
  });

  it("AC-23 PUTs to contracts/{c}/products/{p}/schedule-cancel-revoke, under my own identity, my own status unchanged, and every reader re-reads (AC-13)", async () => {
    const { accessToken } = await seedClientSession();
    const row = recorded.one().data as Record<string, unknown> & {
      id: string;
      contract_id: string;
      status: { code: string };
    };
    const handler = installProductHandler(server);
    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
    await manager.useActions().isReady();
    const readsBeforeWrite = handler.reads();
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/schedule-cancel-revoke`,
        ({ request }) => {
          capture(request, captured);
          return HttpResponse.json(recorded.cancellationRevoked(), {
            status: 200
          });
        }
      )
    );

    await manager.useActions().revokeScheduledCancellation();

    expect(captured.request).toBeDefined();
    expect(captured.request!.method).toBe("PUT");
    assertClientIdentityTransport(captured.request!, accessToken);
    // The REAL capture `put-…-schedule-cancel-revoke.json` also still
    // carries `status.code: contract_active` — the revoke leaves the node
    // exactly as the booking left it unchanged.
    expect(manager.useContext().contractProduct.value?.status?.code).toBe(
      row.status.code
    );
    expect(handler.reads()).toBeGreaterThan(readsBeforeWrite);
  });

  it("AC-22 carries my reason and custom fields when I supply them, and nothing travels in their place when I don't", async () => {
    const { manager, row } = await openManager();
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/schedule-cancel`,
        async ({ request }) => {
          captured.body = await request.json();
          return HttpResponse.json(recorded.cancellationScheduled(), {
            status: 200
          });
        }
      )
    );

    await manager.useActions().scheduleCancellation({
      futureCancellationDate: "2027-01-01",
      reason: "too expensive"
    });

    expect(captured.body).toEqual({
      future_cancellation_date: "2027-01-01",
      cancellation_reason: "too expensive"
    });
  });

  it("AC-22 sends no reason field when I supply none — nothing travels in its place", async () => {
    const { manager, row } = await openManager();
    const captured: Captured = {};

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/schedule-cancel`,
        async ({ request }) => {
          captured.body = await request.json();
          return HttpResponse.json(recorded.cancellationScheduled(), {
            status: 200
          });
        }
      )
    );

    await manager
      .useActions()
      .scheduleCancellation({ futureCancellationDate: "2027-01-01" });

    expect(captured.body).toEqual({ future_cancellation_date: "2027-01-01" });
  });
});

describe("useContractProduct — a change I make shows up on my products list too, without reloading (AC-13, cross-surface)", () => {
  it("AC-13 the products COLLECTION re-reads after a write made through the MANAGER — not only the manager's own re-read", async () => {
    await seedClientSession();
    installBackgroundStubs();
    const row = recorded.one().data as Record<string, unknown> & {
      id: string;
      contract_id: string;
    };
    let listReads = 0;
    server?.use(
      http.get("*/contracts_products", () => {
        listReads += 1;
        return HttpResponse.json(recorded.list(), { status: 200 });
      }),
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        () => HttpResponse.json(recorded.softCancelled(), { status: 200 })
      )
    );
    installProductHandler(server, row);

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const readsBeforeWrite = listReads;
    expect(readsBeforeWrite).toBeGreaterThan(0);

    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
    await manager.useActions().isReady();
    await manager.useActions().stopRenewing();

    // The write's cache-key invalidation is whole (design.md §8.4's base
    // "contracts" key), so a SEPARATE collection instance — never told about
    // this write directly — re-fetches too, not only the manager that made it.
    await vi.waitFor(() => {
      expect(listReads).toBeGreaterThan(readsBeforeWrite);
    });
  });
});

/**
 * AC-16's negative controls. Every request the writes proven above actually
 * send is captured and inspected — never a synthetic request built to pass —
 * so a regression that routes a write through a staff endpoint, or leaks a
 * `clientId` override, is caught on the SAME real traffic those writes
 * already prove correct.
 */
describe("useContractProduct — no staff route is ever reachable from my product surfaces (AC-16)", () => {
  it("AC-16 not one of the writes this module offers me is ever addressed to a staff route", async () => {
    const { manager, row } = await openManager();
    const observed = observeAllRequests();

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        () => HttpResponse.json(recorded.softCancelled(), { status: 200 })
      ),
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/properties`,
        () => HttpResponse.json(recorded.consolidationSet(), { status: 200 })
      ),
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/schedule-cancel`,
        () =>
          HttpResponse.json(recorded.cancellationScheduled(), { status: 200 })
      ),
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/schedule-cancel-revoke`,
        () => HttpResponse.json(recorded.cancellationRevoked(), { status: 200 })
      )
    );

    await manager.useActions().stopRenewing();
    await manager.useActions().setConsolidation({
      invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
    });
    await manager
      .useActions()
      .scheduleCancellation({ futureCancellationDate: "2027-01-01" });
    await manager.useActions().revokeScheduledCancellation();

    const requests = observed.all();
    // A positive allow-list, not only a negative ban: every request this
    // block observes — each write AND the re-read it triggers (design.md
    // §6.2/§8.4's re-read-after-write, AC-13) — lands on the exact client
    // routes AC-5/AC-9/AC-22/AC-23 name, or on the product's own read. So a
    // mutation that swapped one write (or its re-read) onto ANY other path
    // (staff or not) fails here too, not only one that happens to spell
    // "admin" or a named staff verb.
    const allowed = [
      `/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
      `/contracts/${row.contract_id}/products/${row.id}/properties`,
      `/contracts/${row.contract_id}/products/${row.id}/schedule-cancel`,
      `/contracts/${row.contract_id}/products/${row.id}/schedule-cancel-revoke`,
      `/contract_products/${row.id}`
    ];
    expect(requests.length).toBeGreaterThanOrEqual(4);
    for (const request of requests) {
      const path = new URL(request.url).pathname;
      expect(allowed.some(allowedPath => path.endsWith(allowedPath))).toBe(
        true
      );
      expect(request.url).not.toMatch(/\/admin\//);
      expect(request.url).not.toMatch(
        /\/(terms|activate|manual_status|currency|transfer|scheduled_actions)\b/
      );
    }
    observed.stop();
  });
});

describe("useContractProduct — the account I act on is the one my scope resolved (AC-16, FE-2824)", () => {
  it("AC-16 the request is addressed to the product `.for()` resolved, never to any clientId option or an unresolved id", async () => {
    const { manager, row } = await openManager();
    const observed = observeAllRequests();

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        () => HttpResponse.json(recorded.softCancelled(), { status: 200 })
      )
    );

    await manager.useActions().stopRenewing();

    const requests = observed.all();
    // Every observed URL — the write AND its re-read — is addressed to the
    // REAL ids `.for(CONTRACT_PRODUCT, row.id)` resolved: either the write
    // path (nested under the resolved contract AND product id) or the
    // manager's own re-read of that same product. A regression that dropped
    // the retargeting and fell back to the session's own client id (or to
    // nothing) fails this line, where a bare "not clients/undefined/" check
    // never could, because neither URL shape carries a "clients/" segment.
    const allowed = [
      `/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
      `/contract_products/${row.id}`
    ];
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      const path = new URL(request.url).pathname;
      expect(allowed.some(allowedPath => path.endsWith(allowedPath))).toBe(
        true
      );
      expect(request.url).not.toContain("clients/undefined/");
      expect(new URL(request.url).searchParams.has("clientId")).toBe(false);
    }
    observed.stop();
  });
});
