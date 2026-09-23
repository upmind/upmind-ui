// -----------------------------------------------------------------------------
/**
 * @fileoverview useContractProduct writes — renew stop/abort, consolidation,
 * scheduled cancellation, hard cancel request + withdraw (integration,
 * AC-5/AC-6/AC-7/AC-9/AC-11/AC-22/AC-23; R33 moved the hard cancel request and
 * its withdrawal here from useContract)
 *
 * ## Job To Be Done
 * Drive the REAL `useContractProduct()` manager actions against RECORDED
 * staging responses and prove each write reaches the wire exactly as
 * `design ✅.md` §8.3 states. The exposed action names are `stopRenewing()` /
 * `resumeRenewing()` — `design ✅.md` §8.3's action column and
 * `ContractProductMachineServices`' key names (`requestSoftCancel` /
 * `abortSoftCancel`) name the INVOKED SERVICE, not the composable's public
 * action; `Object.keys(manager.useActions())` on the real module confirms
 * the exposed names used below. They PUT `{ renew }` to `modify_renew`;
 * `setConsolidation` PUTs
 * `{ invoice_consolidation_enabled }` to `properties`; `scheduleCancellation`/
 * `revokeScheduledCancellation` PUT to `schedule-cancel(-revoke)` under
 * `contracts/{c}/products/{p}/…` — the REAL route
 * (`contract-product.fixtures.ts` fileoverview limit 3; `design ✅.md` §8.3's
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
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import { useContractProduct, useContractProducts } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  ContractProductCancelOption,
  ContractProductFormTypes,
  type CancellationModel
} from "../contract-product.types";
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
    .withId(row.id);
  await manager.useActions().isReady();
  return { manager, row, accessToken };
}

/**
 * Opens the manager over the REAL recorded product row, with the `overrides`
 * fields replaced. Used to reach a record shape (`staged_import: true`, a
 * cancelled/lapsed/suspended `status.code`, a one-off
 * `billing_cycle_months: 0`) this staging client's own reachable products do
 * not carry (`contract-product.fixtures.ts` fileoverview limit 2), so AC-11's
 * guard refusals and its parity-loss positive control can still be driven
 * against the module's own real wire shape rather than skipped for want of a
 * live candidate.
 *
 * PROVENANCE, STATED EXACTLY. A scalar override (`staged_import`,
 * `billing_cycle_months`, `can_disable_auto_create_renew_invoice`) replaces
 * one real value with another real value of the same field. A `status`
 * override is NOT that: `{ status: { code } }` replaces the whole `status`
 * RELATION, so every other field the real capture's `status` object carries
 * (its id, its name, its type) is discarded. A row driven that way is
 * real-except-for-a-synthesised-status — never a wholly real row — and no
 * assertion below reads any `status` member other than `code`. Recording a
 * genuine suspended/cancelled row is forbidden this pass (`receipts.md`).
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
    .withId(row.id);
  await manager.useActions().isReady();
  return { manager, row, accessToken };
}

/**
 * Opens the manager over a row in the `expiring` node — a subscription that
 * already asked to stop. Assembled from two REAL captures: the base product
 * read, with `renew` and `calculated_cancel_date` taken from the server's own
 * recorded post-effect of the stop write (`put-…modify-renew-case-stop`),
 * never hand-typed.
 */
async function openExpiringManager() {
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
    .withId(row.id);
  await manager.useActions().isReady();
  return { manager, row, accessToken };
}

/**
 * The value an action SETTLED on: its rejection, a `{ resolved }` wrapper, or
 * the `never-settled` sentinel. Raced rather than awaited outright, matching
 * `contract-product.auth-guard.int.test.ts`'s own pattern — an action-level
 * refusal (`design ✅.md` §8.3) is expected to settle promptly with no request,
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
   * The three rows of `contract-product.feature`'s "A suspended subscription
   * is still offered every change" Outline (amendments A10 and A11), each
   * proven on the wire:
   *
   * - `@proves contract-product.feature:464` — stop it renewing
   * - `@proves contract-product.feature:465` — change whether it joins my
   *   consolidated invoice
   * - `@proves contract-product.feature:466` — book a cancellation for a date
   *   I choose
   *
   * This is the PARITY-LOSS direction the refusal tests above cannot prove:
   * they show a STAGED and a CANCELLED product are refused, never that a
   * SUSPENDED one is still offered every one of those three changes. An
   * over-refusing surface silently takes capability from the client. Driven
   * over a REAL row with the `status` relation overridden to `SUSPENDED` —
   * see `openManagerWith`'s provenance note for exactly what that override
   * does and does not replace.
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
      .withId(row.id);
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

  /**
   * The two rows of AC-5's `<what I supply>` Outline (amendment A19 + A21):
   * - `@proves contract-product.feature:402` — a reason and details
   * - `@proves contract-product.feature:403` — nothing
   */
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

  /** `@proves contract-product.feature:422` — the `not allowed` row of AC-5's
   * renewal-invoicing-permission Outline. Its `allowed` sibling is proven in
   * its own describe below. */
  it("AC-5 stopping renewal is not the renewal-invoicing permission — a product not allowed to switch that off still stops renewing normally", async () => {
    // `design ✅.md` §8.3 row C5: the gate `can_disable_auto_create_renew_invoice`
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
  /**
   * `@proves contract-product.feature:433` — "my account-level consolidation
   * preference is left exactly as it was". The `it.each` below proves the
   * per-product body; it cannot see a SECOND write this action might make
   * against the client's own account-level preference, because it only
   * inspects the one request it installed a handler for. This one observes
   * EVERY outbound request the write makes and holds it to a positive
   * allow-list — the product's own `properties` write and the re-read it
   * triggers — so a regression that also PUT/PATCHed the account-level
   * preference (`clients/{id}`, `clients/{id}/personal_details`, or any
   * other path) fails here, not only one that happened to spell a path this
   * file thought to ban.
   */
  it("AC-9 setting ONE product's consolidation writes to that product only — my account-level preference is never touched", async () => {
    const { manager, row } = await openManager();
    const observed = observeAllRequests();

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/properties`,
        () => HttpResponse.json(recorded.consolidationSet(), { status: 200 })
      )
    );

    await manager.useActions().setConsolidation({
      invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
    });

    const requests = observed.all();
    observed.stop();
    const allowed = [
      `/contracts/${row.contract_id}/products/${row.id}/properties`,
      `/contract_products/${row.id}`
    ];
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      const path = new URL(request.url).pathname;
      expect(allowed.some(allowedPath => path.endsWith(allowedPath))).toBe(
        true
      );
    }
    expect(
      requests.filter(request => request.method !== "GET").map(r => r.url)
    ).toHaveLength(1);
  });

  /**
   * The three rows of AC-9's consolidation Outline (amendment A8), each on its
   * own row so a module that honours two of the three fails one NAMED choice:
   * - `@proves contract-product.feature:437` — opted out
   * - `@proves contract-product.feature:438` — opted in
   * - `@proves contract-product.feature:439` — follow my account
   */
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
      .withId(row.id);
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
      .withId(row.id);
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

  /**
   * The two rows of AC-22's `<what I supply>` Outline (amendment A33):
   * - `@proves contract-product.feature:591` — a reason and details
   * - `@proves contract-product.feature:592` — nothing
   */
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
 * KNOWN GAP — `@gap contract-product.feature:520`, the THIRD reader of the
 * AC-13 scenario's `Given` ("my dashboard's count of them"). That surface is
 * the grouped-counts read, which `contract-product.traceability.test.ts`
 * already registers as an unproven AC-19 scenario: no grouped-by-category
 * capture exists on disk, and recording is forbidden this pass
 * (`receipts.md`). The test below therefore drives the two readers that ARE
 * reachable — the manager and the collection — and the count surface stays
 * unproven, registered here rather than silently discharged by them.
 */
/**
 * The five rows of `contract-product.feature`'s AC-13 Outline (amendment A7)
 * — one row per write this manager offers, so a module that re-reads after
 * four of the five fails one NAMED row:
 *
 * - `@proves contract-product.feature:527` — stop the renewal
 * - `@proves contract-product.feature:528` — abort that stop
 * - `@proves contract-product.feature:529` — set the consolidation value
 * - `@proves contract-product.feature:530` — book a cancellation for a date I choose
 * - `@proves contract-product.feature:531` — revoke that booking
 *
 * The load-bearing reader here is the COLLECTION, not the manager: the
 * manager's own re-read is already asserted beside each write, and a
 * cache-key regression that narrowed the invalidation to the single product
 * would leave the manager green and the products list stale — the exact
 * "I changed it and my list still says the old thing" the scenario names.
 */
describe("useContractProduct — a change I make shows up on my products list too, without reloading (AC-13, cross-surface)", () => {
  it.each([
    ["stop the renewal", false, "stopRenewing"],
    ["abort that stop", true, "resumeRenewing"],
    ["set the consolidation value", false, "setConsolidation"],
    ["book a cancellation for a date I choose", false, "scheduleCancellation"],
    ["revoke that booking", false, "revokeScheduledCancellation"]
  ] as const)(
    "AC-13 the products COLLECTION re-reads after I %s through the MANAGER — not only the manager's own re-read",
    async (_change, fromExpiring, action) => {
      await seedClientSession();
      installBackgroundStubs();
      const base = recorded.one().data as Record<string, unknown> & {
        id: string;
        contract_id: string;
      };
      const stopped = recorded.softCancelled().data as {
        renew: boolean;
        calculated_cancel_date: string;
      };
      const row = fromExpiring
        ? {
            ...base,
            renew: stopped.renew,
            calculated_cancel_date: stopped.calculated_cancel_date
          }
        : base;

      let listReads = 0;
      server?.use(
        http.get("*/contracts_products", () => {
          listReads += 1;
          return HttpResponse.json(recorded.list(), { status: 200 });
        }),
        http.put(
          `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
          () =>
            HttpResponse.json(
              fromExpiring
                ? recorded.softCancelAborted()
                : recorded.softCancelled(),
              { status: 200 }
            )
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
          () =>
            HttpResponse.json(recorded.cancellationRevoked(), { status: 200 })
        )
      );
      installProductHandler(server, row);

      const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
      await collection.useActions().isReady();
      const readsBeforeWrite = listReads;
      expect(readsBeforeWrite).toBeGreaterThan(0);

      const manager = useContractProduct()
        .as(ScopeActorTypes.CLIENT)
        .withId(row.id);
      await manager.useActions().isReady();

      const actions = manager.useActions() as unknown as Record<
        string,
        (model?: unknown) => Promise<unknown>
      >;
      const model =
        action === "setConsolidation"
          ? { invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED }
          : action === "scheduleCancellation"
            ? { futureCancellationDate: "2027-01-01" }
            : undefined;
      await actions[action]!(model);

      // The write's cache-key invalidation is whole (`design ✅.md` §8.4's base
      // "contracts" key), so a SEPARATE collection instance — never told about
      // this write directly — re-fetches too, not only the manager that made it.
      await vi.waitFor(() => {
        expect(listReads).toBeGreaterThan(readsBeforeWrite);
      });
    }
  );
});

/**
 * AC-16's negative controls. Every request the writes proven above actually
 * send is captured and inspected — never a synthetic request built to pass —
 * so a regression that routes a write through a staff endpoint, or leaks a
 * `clientId` override, is caught on the SAME real traffic those writes
 * already prove correct.
 */
describe("useContractProduct — no staff route is ever reachable from my product surfaces (AC-16)", () => {
  /**
   * The five rows of AC-16's staff-route Outline, all driven in this one
   * observation window — every request the four writes and the read they
   * trigger actually make is held to a positive allow-list:
   * - `@proves contract-product.feature:661` — opening one of my products
   * - `@proves contract-product.feature:662` — stopping one renewing
   * - `@proves contract-product.feature:663` — changing its consolidation
   * - `@proves contract-product.feature:664` — booking a cancellation
   * - `@proves contract-product.feature:665` — revoking that booking
   */
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
  it("AC-16 the request is addressed to the product `.withId()` resolved, never to any clientId option or an unresolved id", async () => {
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
    // REAL ids `.withId(row.id)` resolved: either the write
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

// -----------------------------------------------------------------------------

/**
 * The remaining rows of `contract-product.feature`'s AC-11 "A one-off purchase
 * is never offered a consolidation choice" Outline (amendment A12 + A16),
 * each on a row whose own `Given` sets its product kind and state up:
 *
 * - `@proves contract-product.feature:506` — a one-off purchase, live
 * - `@proves contract-product.feature:507` — a one-off purchase, still pending
 * - `@proves contract-product.feature:508` — a subscription
 * - `@proves contract-product.feature:509` — a subscription already asked to stop
 *
 * Rows 506 and 507 are the REFUSAL direction and assert BOTH limbs the
 * `<offered>` column names — the consolidation choice AND stopping it
 * renewing — never only the first. Rows 508 and 509 are the PARITY-LOSS
 * direction: an over-refusing surface silently withholds from a subscription
 * what this Outline only ever meant to withhold from a one-off.
 */
describe("useContractProduct — what a one-off purchase is offered, and what a subscription still is (AC-11)", () => {
  it.each([
    ["a one-off purchase, live", { billing_cycle_months: 0 }],
    [
      "a one-off purchase, still pending",
      {
        billing_cycle_months: 0,
        status: { code: ContractStatusCodes.PENDING }
      }
    ]
  ])(
    "AC-11 %s is offered neither the consolidation choice nor a renewal stop — forcing either makes no request",
    async (_kind, overrides) => {
      const { manager, row } = await openManagerWith(overrides);
      const observed = observeAllRequests();

      const consolidationSettled = await settlement(
        manager.useActions().setConsolidation({
          invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
        })
      );
      const stopSettled = await settlement(manager.useActions().stopRenewing());

      expect(consolidationSettled).toEqual({ resolved: false });
      expect(stopSettled).toEqual({ resolved: false });
      observed.stop();
      expect(
        observed.matching(
          `/contracts/${row.contract_id}/products/${row.id}/properties`
        )
      ).toEqual([]);
      expect(
        observed.matching(
          `/contracts/${row.contract_id}/products/${row.id}/modify_renew`
        )
      ).toEqual([]);
    }
  );

  it("AC-11 a subscription is offered both the consolidation choice and a renewal stop — each reaches the wire", async () => {
    const { manager, row, accessToken } = await openManager();
    const captured: { renew?: Captured; consolidation?: Captured } = {};

    server?.use(
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
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        async ({ request }) => {
          captured.renew = {};
          capture(request, captured.renew);
          captured.renew.body = await request.json();
          return HttpResponse.json(recorded.softCancelled(), { status: 200 });
        }
      )
    );

    await manager.useActions().setConsolidation({
      invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
    });
    await manager.useActions().stopRenewing();

    expect(captured.consolidation?.request).toBeDefined();
    expect(captured.renew?.request).toBeDefined();
    assertClientIdentityTransport(
      captured.consolidation!.request!,
      accessToken
    );
    assertClientIdentityTransport(captured.renew!.request!, accessToken);
    expect(captured.consolidation!.body).toEqual({
      invoice_consolidation_enabled: InvoiceConsolidationTypes.ENABLED
    });
    expect(captured.renew!.body).toEqual({ renew: false });
  });

  it("AC-11 a subscription that already asked to stop is still offered the consolidation choice, and aborting that stop in place of stopping it", async () => {
    const { manager, row, accessToken } = await openExpiringManager();
    const captured: { renew?: Captured; consolidation?: Captured } = {};

    server?.use(
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
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        async ({ request }) => {
          captured.renew = {};
          capture(request, captured.renew);
          captured.renew.body = await request.json();
          return HttpResponse.json(recorded.softCancelAborted(), {
            status: 200
          });
        }
      )
    );

    await manager.useActions().setConsolidation({
      invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
    });
    await manager.useActions().resumeRenewing();

    expect(captured.consolidation?.request).toBeDefined();
    expect(captured.renew?.request).toBeDefined();
    assertClientIdentityTransport(
      captured.consolidation!.request!,
      accessToken
    );
    assertClientIdentityTransport(captured.renew!.request!, accessToken);
    expect(captured.renew!.body).toEqual({ renew: true });
  });
});

/**
 * `@proves contract-product.feature:423` — the `allowed` row of AC-5's
 * renewal-invoicing-permission Outline (amendment A22(e)). Its sibling row,
 * `not allowed`, is proven above. Both rows exist because the permission
 * governs a DIFFERENT change: a module that read it either way — refusing the
 * stop when the permission is false, or only sending it when true — fails one
 * of the two.
 */
describe("useContractProduct — the renewal-invoicing permission governs neither direction of a renewal stop (AC-5)", () => {
  it("AC-5 a subscription ALLOWED to switch its renewal invoicing off still stops renewing by the same request", async () => {
    const { manager, row, accessToken } = await openManagerWith({
      can_disable_auto_create_renew_invoice: true
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
    assertClientIdentityTransport(captured.request!, accessToken);
    expect(captured.body).toEqual({ renew: false });
  });
});

/**
 * Opens the cancellation form over a real product, stubbing the empty
 * CANCEL_REQUEST catalogue read the form composes so the ABSENT-customFields
 * shape is deterministic. Returns the settled manager plus its real ids.
 */
async function openCancellationForm(
  row?: Record<string, unknown> & { id: string }
) {
  const { accessToken } = await seedClientSession();
  const base = recorded.one().data as Record<string, unknown> & {
    id: string;
    contract_id: string;
  };
  const served = row ?? base;
  installProductHandler(server, served);
  server?.use(
    http.get("*/clients/:id", () =>
      HttpResponse.json({ status: "ok", data: { custom_fields: [] } })
    )
  );
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(served.id);
  await manager.useActions().isReady();
  await manager.useActions().openCancellation();
  return { manager, row: served, accessToken };
}

/**
 * A real product row moved into the `cancelling` node — its `contract_request`
 * replaced with a REAL cancellation request whose status is
 * `request_cancellation_request`, the ONE state that derives `status.cancelling`
 * and offers a withdraw (probe-confirmed). Only `contract_request` is
 * synthesised; every other member is the real recorded product.
 */
function cancellingRow() {
  const base = recorded.one().data as Record<string, unknown> & {
    id: string;
    contract_id: string;
  };
  return {
    ...base,
    contract_request: {
      id: "785d26e9-6783-d169-9c11-314502e70439",
      status: {
        code: CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
      }
    }
  };
}

describe("useContractProduct — I ask for one of my products to be cancelled outright (AC-6, R33)", () => {
  /**
   * The `<what I supply>` Outline of `contract-product.feature`'s hard-cancel
   * scenario, driven through the ONE combined form's HARD option:
   * - a reason and details travel with the request
   * - nothing travels in their place
   */
  it("AC-6 submitting the form with the HARD option POSTs { product_ids, cancellation_reason } to cancel/request, naming my own product, under my own identity", async () => {
    const { manager, row, accessToken } = await openCancellationForm();
    const captured: Captured = {};

    server?.use(
      http.post(
        `*/contracts/${row.contract_id}/cancel/request`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.cancellationRequested(), {
            status: 200
          });
        }
      )
    );

    await manager.useActions().set(ContractProductFormTypes.CANCELLATION, {
      option: ContractProductCancelOption.HARD,
      reason: "no longer needed"
    });
    await manager.useActions().submitCancellation();

    expect(captured.request).toBeDefined();
    expect(captured.request!.method).toBe("POST");
    assertClientIdentityTransport(captured.request!, accessToken);
    expect(captured.body).toEqual({
      product_ids: [row.id],
      cancellation_reason: "no longer needed"
    });
  });

  it("AC-6 sends no cause field when I supply none — nothing travels in its place", async () => {
    const { manager, row } = await openCancellationForm();
    const captured: Captured = {};

    server?.use(
      http.post(
        `*/contracts/${row.contract_id}/cancel/request`,
        async ({ request }) => {
          captured.body = await request.json();
          return HttpResponse.json(recorded.cancellationRequested(), {
            status: 200
          });
        }
      )
    );

    await manager.useActions().set(ContractProductFormTypes.CANCELLATION, {
      option: ContractProductCancelOption.HARD
    });
    await manager.useActions().submitCancellation();

    expect(captured.body).toEqual({ product_ids: [row.id] });
  });

  it("AC-6 an invalid model makes NO request and lands a 422 in the form's error region, the form left open (R35)", async () => {
    const { manager } = await openCancellationForm();
    const before = new Date(
      new Date(
        manager.useContext().minFutureCancellationDate.value as string
      ).getTime() - 86400000
    )
      .toISOString()
      .slice(0, 10);
    const observed = observeAllRequests();

    await manager.useActions().set(ContractProductFormTypes.CANCELLATION, {
      option: ContractProductCancelOption.SCHEDULE_FUTURE,
      futureCancellationDate: before
    });
    await expect(
      manager.useActions().submitCancellation()
    ).rejects.toBeDefined();

    observed.stop();
    expect(observed.matching("/cancel/request")).toEqual([]);
    expect(observed.matching("/schedule-cancel")).toEqual([]);
    expect(manager.useMeta().hasError.value).toBe(true);
    const invalidError = manager.useContext().error.value as
      | { code?: number; message?: string }
      | undefined;
    expect(invalidError?.code).toBe(422);
    expect(invalidError?.message).toBe(
      "error.contract_product_validation_failed"
    );
    // The form stays open on its own status node — the write never left it.
    expect(manager.useContext().cancellation.value).toBeTruthy();
    expect(manager.useMeta().isActive.value).toBe(true);
  });

  /**
   * The validate-before-request guard on the hard-cancellation write. The
   * combined cancellation schema is `additionalProperties: false` and declares
   * only `option`, `futureCancellationDate`, `reason` and `customFields`, so a
   * model carrying an undeclared field is rejected BEFORE the
   * `POST cancel/request` fires: NO request leaves and the 422 lands in the
   * error region. Mutant: `contract-product.mutations.validation.must-fail.patch`.
   */
  it("AC-6 a HARD model carrying a field the form does not declare is refused before any request (422, no POST)", async () => {
    const { manager } = await openCancellationForm();
    const observed = observeAllRequests();

    const undeclaredFieldModel: Partial<CancellationModel> & {
      unexpected: boolean;
    } = { option: ContractProductCancelOption.HARD, unexpected: true };
    await manager
      .useActions()
      .set(ContractProductFormTypes.CANCELLATION, undeclaredFieldModel);
    await expect(
      manager.useActions().submitCancellation()
    ).rejects.toBeDefined();

    observed.stop();
    expect(observed.matching("/cancel/request")).toEqual([]);
    expect(manager.useMeta().hasError.value).toBe(true);
    const refusalError = manager.useContext().error.value as
      | { code?: number; message?: string }
      | undefined;
    expect(refusalError?.code).toBe(422);
    expect(refusalError?.message).toBe(
      "error.contract_product_validation_failed"
    );
  });
});

describe("useContractProduct — I change my mind about a cancellation I asked for (AC-7, R33)", () => {
  /**
   * KNOWN GAP — the success half of AC-7. This sandbox answers
   * `DELETE contracts/{id}/cancel/request` with a REAL 404
   * (`contract/__tests__/fixtures/delete-contracts-id-cancel-request.json`),
   * and no recorded 200 for it exists on disk; recording is forbidden this
   * pass (`receipts.md`). The REQUEST shape (`{ contract_request_id }`) and the
   * real-failure surfacing are proven here; the removed-and-carries-on outcome
   * is registered as a partial promise.
   */
  it("AC-7 DELETEs cancel/request with { contract_request_id } from my product's own request, under my own identity", async () => {
    const { manager, row, accessToken } = await (async () => {
      const r = cancellingRow();
      const { accessToken } = await seedClientSession();
      installProductHandler(server, r);
      const m = useContractProduct().as(ScopeActorTypes.CLIENT).withId(r.id);
      await m.useActions().isReady();
      return { manager: m, row: r, accessToken };
    })();
    const rejection = recorded.withdrawRejected();
    const captured: Captured = {};

    server?.use(
      http.delete(
        `*/contracts/${row.contract_id}/cancel/request`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json().catch(() => undefined);
          return HttpResponse.json(rejection.response.body as object, {
            status: rejection.response.status
          });
        }
      )
    );

    await expect(
      manager.useActions().withdrawCancellation()
    ).rejects.toBeDefined();

    expect(captured.request).toBeDefined();
    expect(captured.request!.method).toBe("DELETE");
    assertClientIdentityTransport(captured.request!, accessToken);
    expect(captured.body).toEqual({
      contract_request_id: "785d26e9-6783-d169-9c11-314502e70439"
    });
  });

  it("AC-7 the sandbox's real refusal lands as readable error state, not a silent success", async () => {
    const r = cancellingRow();
    await seedClientSession();
    installProductHandler(server, r);
    const rejection = recorded.withdrawRejected();
    server?.use(
      http.delete(`*/contracts/${r.contract_id}/cancel/request`, () =>
        HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        })
      )
    );
    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .withId(r.id);
    await manager.useActions().isReady();

    await expect(
      manager.useActions().withdrawCancellation()
    ).rejects.toBeDefined();

    expect(manager.useMeta().hasError.value).toBe(true);
    expect(manager.useContext().error.value).toBeTruthy();
  });
});

describe("useContractProduct — the cancellation form is hidden where legacy hides it (AC-11, R35)", () => {
  it("AC-11 an expiring subscription (auto-renew already off) is offered no cancellation form — the open is refused, its slot left empty", async () => {
    const { manager } = await openExpiringManager();
    await manager.useActions().openCancellation();
    expect(manager.useContext().cancellation.value).toBeFalsy();
  });

  /**
   * The legacy whole-entry hide ported (o7 `:257-258`, ADR-27): a product with
   * a scheduled future cancellation, and a product with a hard request already
   * pending, are each refused the cancellation form outright — `openCancellation`
   * leaves its slot empty. Mutant:
   * `contract-product.mutations.cancellation-whole-entry-hide.must-fail.patch`.
   */
  it("AC-11 a product with a scheduled future cancellation is offered no cancellation form — the open is refused, its slot left empty", async () => {
    const scheduled = {
      ...(recorded.one().data as Record<string, unknown> & { id: string }),
      contract_request: {
        status: {
          code: CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
        }
      }
    };
    const { manager } = await openCancellationForm(scheduled);
    expect(manager.useContext().cancellation.value).toBeFalsy();
  });

  it("AC-11 a product with a hard cancellation request already pending is offered no cancellation form — the open is refused, its slot left empty", async () => {
    const { manager } = await openCancellationForm(cancellingRow());
    expect(manager.useContext().cancellation.value).toBeFalsy();
  });

  /**
   * The parity-loss direction of the auto-expire hide (`hasAutoExpireEnabled` is
   * `!renew && calculated_cancel_date`): auto-renew off WITHOUT a calculated
   * cancel date is NOT the expiring state legacy hides, so the cancellation form
   * is still offered. An over-hiding surface silently withholds it.
   */
  it("AC-11 a subscription with auto-renew off but no calculated cancel date is still offered the cancellation form — legacy offers it", async () => {
    const offered = {
      ...(recorded.one().data as Record<string, unknown> & { id: string }),
      renew: false,
      calculated_cancel_date: null
    };
    const { manager } = await openCancellationForm(offered);
    expect(manager.useContext().cancellation.value).toBeTruthy();
  });

  /**
   * The pending-contract eligibility gate: a product on a PENDING contract is
   * not yet cancellable at the end of a term, so the cancellation form offers
   * only the immediate (HARD) option — SCHEDULE_FUTURE and the soft end-of-term
   * option are withheld. This proves the correct behaviour.
   *
   * DECLARED GAP on its mutant — `contract-product.pending-cancellation-eligibility.must-fail.patch`
   * applies cleanly but flips NO test in the whole contract-product suite
   * (verified: full suite stayed green under it), and it changed no reachable
   * behaviour under probing (the pending option enum, every cancellation-request
   * status, every meta flag, and the direct scheduleCancellation refusal were
   * all byte-identical with and without it). The mutant is inert against
   * reachable behaviour and needs re-authoring so it actually breaks the
   * pending-excludes-SCHEDULE_FUTURE rule this test asserts.
   */
  it("AC-11 a product whose contract is pending is not offered SCHEDULE_FUTURE in the cancellation form", async () => {
    const base = recorded.one().data as Record<string, unknown> & {
      id: string;
      contract?: Record<string, unknown>;
    };
    const pending = {
      ...base,
      contract: {
        ...(base.contract ?? {}),
        status: { code: ContractStatusCodes.PENDING }
      }
    };
    const { manager } = await openCancellationForm(pending);

    const options = (
      manager.useContext().cancellation.value?.schema as {
        properties?: { option?: { enum?: string[] } };
      }
    )?.properties?.option?.enum;
    expect(options).toBeDefined();
    expect(options).not.toContain(ContractProductCancelOption.SCHEDULE_FUTURE);
  });
});

/**
 * Opens the manager over a REAL row whose owning-client consolidation
 * preference (`contract.client.invoice_consolidation_enabled`) or catalogue
 * product setting (`product.invoice_consolidation_enabled`) is overridden — one
 * real scalar of that field replaced with another, the rest of the record real.
 */
async function openConsolidationManager(
  row: Record<string, unknown> & { id: string }
) {
  const { accessToken } = await seedClientSession();
  installProductHandler(server, row);
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(row.id);
  await manager.useActions().isReady();
  return { manager, accessToken };
}

type ConsolidationRow = Record<string, unknown> & {
  id: string;
  contract_id: string;
  contract?: Record<string, unknown> & { client?: Record<string, unknown> };
  product?: Record<string, unknown>;
};

function withClientConsolidation(value: number): ConsolidationRow {
  const base = recorded.one().data as ConsolidationRow;
  return {
    ...base,
    contract: {
      ...(base.contract ?? {}),
      client: {
        ...(base.contract?.client ?? {}),
        invoice_consolidation_enabled: value
      }
    }
  };
}

function withProductConsolidation(value: number | null): ConsolidationRow {
  const base = recorded.one().data as ConsolidationRow;
  return {
    ...base,
    product: { ...(base.product ?? {}), invoice_consolidation_enabled: value }
  };
}

/**
 * The consolidation form is offered only where BOTH the owning client's
 * consolidation preference is enabled or inherited (never DISABLED) AND the
 * catalogue product carries the setting (legacy `cProdInvoiceConsolidationComp`
 * :74-97, W1). A refused product leaves the form slot empty on open, and its
 * `setConsolidation` resolves `false` with no request. Mutant:
 * `contract-product.mutations.consolidation-open-guard.must-fail.patch`.
 */
describe("useContractProduct — the consolidation form is offered only where the client and the product both allow it (AC-9, R35)", () => {
  it.each([
    [
      "the client's consolidation preference is disabled",
      () => withClientConsolidation(InvoiceConsolidationTypes.DISABLED)
    ],
    [
      "the product carries no consolidation setting",
      () => withProductConsolidation(null)
    ]
  ])(
    "AC-9 %s: openConsolidation leaves the form empty, and setConsolidation resolves false without a request",
    async (_case, build) => {
      const row = build();
      const { manager } = await openConsolidationManager(row);

      await manager.useActions().openConsolidation();
      expect(manager.useContext().consolidation.value).toBeFalsy();

      const observed = observeAllRequests();
      const settled = await settlement(
        manager.useActions().setConsolidation({
          invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
        })
      );
      observed.stop();

      expect(settled).toEqual({ resolved: false });
      expect(
        observed.matching(
          `/contracts/${row.contract_id}/products/${row.id}/properties`
        )
      ).toEqual([]);
    }
  );

  it.each([
    ["enabled", InvoiceConsolidationTypes.ENABLED],
    ["inherited", InvoiceConsolidationTypes.INHERIT]
  ])(
    "AC-9 a subscription whose client consolidation preference is %s, with the product setting present, IS offered the form — legacy offers it",
    async (_case, clientValue) => {
      const { manager } = await openConsolidationManager(
        withClientConsolidation(clientValue)
      );

      await manager.useActions().openConsolidation();

      expect(manager.useContext().consolidation.value).toBeTruthy();
    }
  );
});

describe("useContractProduct — every write runs through the one processing state (AC-25)", () => {
  it("AC-25 reports itself submitting while a write is in flight, and settled once it lands", async () => {
    const { manager, row } = await openManagerWith({});
    let inFlight: boolean | undefined;

    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        async () => {
          // Read the flag from inside the request, while the machine is in
          // `processing` — the whole point of the spine (R20).
          inFlight = manager.useMeta().isSubmitting.value;
          return HttpResponse.json(recorded.softCancelled(), { status: 200 });
        }
      )
    );

    expect(manager.useMeta().isSubmitting.value).toBe(false);
    await manager.useActions().stopRenewing();

    expect(inFlight).toBe(true);
    expect(manager.useMeta().isSubmitting.value).toBe(false);
  });

  it("AC-25 comes back out of processing onto a settled node, having re-read the record", async () => {
    const { manager, row } = await openManagerWith({});
    let reads = 0;

    server?.use(
      http.get(`*/contract_products/${row.id}`, () => {
        reads += 1;
        return HttpResponse.json(recorded.one(), { status: 200 });
      }),
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/modify_renew`,
        () => HttpResponse.json(recorded.softCancelled(), { status: 200 })
      )
    );
    const before = reads;

    const settled = await manager.useActions().stopRenewing();

    // onDone leaves `processing` for `loading`, which re-reads and lets the
    // entry selector place the node again (R20). The action resolves the
    // re-read product, never `false`.
    expect(settled).not.toBe(false);
    expect(reads).toBeGreaterThan(before);
    expect(manager.useMeta().isSubmitting.value).toBe(false);
    expect(manager.useMeta().isAvailable.value).toBe(true);
  });
});

// -----------------------------------------------------------------------------

/** Settles the REAL manager over the recorded product with the empty
 * CANCEL_REQUEST catalogue stubbed, and leaves BOTH write forms closed. */
async function settledFormManager(
  row?: Record<string, unknown> & { id: string }
) {
  await seedClientSession();
  const served =
    row ??
    (recorded.one().data as Record<string, unknown> & {
      id: string;
      contract_id: string;
    });
  installProductHandler(server, served);
  server?.use(
    http.get("*/clients/:id", () =>
      HttpResponse.json({ status: "ok", data: { custom_fields: [] } })
    )
  );
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(served.id);
  await manager.useActions().isReady();
  return {
    manager,
    row: served as Record<string, unknown> & { id: string; contract_id: string }
  };
}

describe("useContractProduct — the cancellation form reports whether it is open and whether its model is valid (AC-6/AC-11, R35)", () => {
  it("is closed and not valid before I open it, open once I do, and closed again when I cancel the form", async () => {
    const { manager } = await settledFormManager();
    const meta = manager.useMeta();

    expect(meta.isCancellationOpen.value).toBe(false);
    expect(meta.isCancellationValid.value).toBe(false);

    await manager.useActions().openCancellation();
    expect(meta.isCancellationOpen.value).toBe(true);

    await manager
      .useActions()
      .cancelForm(ContractProductFormTypes.CANCELLATION);
    expect(meta.isCancellationOpen.value).toBe(false);
  });

  it("reports the open cancellation form valid for a complete model, staying open", async () => {
    const { manager } = await settledFormManager();
    const meta = manager.useMeta();
    await manager.useActions().openCancellation();

    await manager.useActions().set(ContractProductFormTypes.CANCELLATION, {
      option: ContractProductCancelOption.HARD
    });

    await vi.waitFor(() => {
      expect(meta.isCancellationValid.value).toBe(true);
    });
    expect(meta.isCancellationOpen.value).toBe(true);
  });

  it("reports the open cancellation form invalid for a model the schema rejects, staying open", async () => {
    const { manager } = await settledFormManager();
    const meta = manager.useMeta();
    await manager.useActions().openCancellation();
    const beforeFloor = new Date(
      new Date(
        manager.useContext().minFutureCancellationDate.value as string
      ).getTime() - 86400000
    )
      .toISOString()
      .slice(0, 10);

    await manager.useActions().set(ContractProductFormTypes.CANCELLATION, {
      option: ContractProductCancelOption.SCHEDULE_FUTURE,
      futureCancellationDate: beforeFloor
    });

    await vi.waitFor(() => {
      expect(meta.hasError.value).toBe(true);
    });
    expect(meta.isCancellationValid.value).toBe(false);
    expect(meta.isCancellationOpen.value).toBe(true);
  });

  it("closes the cancellation form after a successful submit", async () => {
    const { manager, row } = await settledFormManager();
    server?.use(
      http.post(`*/contracts/${row.contract_id}/cancel/request`, () =>
        HttpResponse.json(recorded.cancellationRequested(), { status: 200 })
      )
    );
    await manager.useActions().openCancellation();
    await manager.useActions().set(ContractProductFormTypes.CANCELLATION, {
      option: ContractProductCancelOption.HARD
    });
    expect(manager.useMeta().isCancellationOpen.value).toBe(true);

    await manager.useActions().submitCancellation();

    await vi.waitFor(() => {
      expect(manager.useMeta().isCancellationOpen.value).toBe(false);
    });
  });
});

describe("useContractProduct — the consolidation form reports whether it is open and whether its model is valid (AC-9, R35)", () => {
  it("is closed and not valid before I open it, open once I do, and closed again when I cancel the form", async () => {
    const { manager } = await settledFormManager();
    const meta = manager.useMeta();

    expect(meta.isConsolidationOpen.value).toBe(false);
    expect(meta.isConsolidationValid.value).toBe(false);

    await manager.useActions().openConsolidation();
    expect(meta.isConsolidationOpen.value).toBe(true);

    await manager
      .useActions()
      .cancelForm(ContractProductFormTypes.CONSOLIDATION);
    expect(meta.isConsolidationOpen.value).toBe(false);
  });

  it("reports the open consolidation form valid for a value in the enum, staying open", async () => {
    const { manager } = await settledFormManager();
    const meta = manager.useMeta();
    await manager.useActions().openConsolidation();

    await manager.useActions().set(ContractProductFormTypes.CONSOLIDATION, {
      invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
    });

    await vi.waitFor(() => {
      expect(meta.isConsolidationValid.value).toBe(true);
    });
    expect(meta.isConsolidationOpen.value).toBe(true);
  });

  it("reports the open consolidation form invalid for a value outside the enum, staying open", async () => {
    const { manager } = await settledFormManager();
    const meta = manager.useMeta();
    await manager.useActions().openConsolidation();

    await manager.useActions().set(ContractProductFormTypes.CONSOLIDATION, {
      invoiceConsolidationEnabled: 7 as InvoiceConsolidationTypes
    });

    await vi.waitFor(() => {
      expect(meta.hasError.value).toBe(true);
    });
    expect(meta.isConsolidationValid.value).toBe(false);
    expect(meta.isConsolidationOpen.value).toBe(true);
  });

  it("closes the consolidation form after a successful submit", async () => {
    const { manager, row } = await settledFormManager();
    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/properties`,
        () => HttpResponse.json(recorded.consolidationSet(), { status: 200 })
      )
    );
    await manager.useActions().openConsolidation();
    await manager.useActions().set(ContractProductFormTypes.CONSOLIDATION, {
      invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
    });
    expect(manager.useMeta().isConsolidationOpen.value).toBe(true);

    await manager.useActions().submitConsolidation();

    await vi.waitFor(() => {
      expect(manager.useMeta().isConsolidationOpen.value).toBe(false);
    });
  });
});
