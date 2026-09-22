// -----------------------------------------------------------------------------
/**
 * @fileoverview useContractProduct writes — renew stop/abort, consolidation,
 * scheduled cancellation (integration, AC-5/AC-9/AC-22/AC-23)
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
    .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
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
    .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
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
        .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
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
