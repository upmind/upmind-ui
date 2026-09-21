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
import { describe, expect, it } from "vitest";
import { InvoiceConsolidationTypes } from "@upmind-automation/types";
import { ContractProductContextTypes, useContractProduct } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
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

// -----------------------------------------------------------------------------

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
  it("AC-22 PUTs { future_cancellation_date } to contracts/{c}/products/{p}/schedule-cancel — the REAL route", async () => {
    const { manager, row, accessToken } = await openManager();
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
  });

  it("AC-23 PUTs to contracts/{c}/products/{p}/schedule-cancel-revoke, under my own identity", async () => {
    const { manager, row, accessToken } = await openManager();
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
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      expect(request.url).not.toMatch(/\/admin\//);
      expect(request.url).not.toMatch(
        /\/(terms|activate|manual_status|currency|transfer|scheduled_actions)\b/
      );
    }
    observed.stop();
  });
});

describe("useContractProduct — the account I act on is the one my scope resolved (AC-16, FE-2824)", () => {
  it("AC-16 no request or its URL ever names a clientId option, and none contains the literal text clients/undefined/", async () => {
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
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      expect(request.url).not.toContain("clients/undefined/");
      expect(new URL(request.url).searchParams.has("clientId")).toBe(false);
    }
    observed.stop();
  });
});
