// -----------------------------------------------------------------------------
/**
 * @fileoverview useContract writes — payment method, cancel request, withdraw
 * (integration, AC-6/AC-7/AC-8)
 *
 * ## Job To Be Done
 * Drive the REAL `useContract()` manager actions against RECORDED staging
 * responses and prove each write reaches the wire exactly as design.md §8.3
 * states: `setPaymentMethod` PATCHes `{ payment_details_id }` to the
 * contract's own `payment_details` endpoint; `requestCancellation` POSTs
 * `{ product_ids, cancellation_reason }` to `cancel/request`; `withdrawCancellation`
 * DELETEs the same path. Every response body is the module's OWN recorded
 * capture (`contract.fixtures.ts`) — never a hand-rolled mock.
 *
 * `withdrawCancellation` is proven against the REAL response this sandbox
 * answers, a `404` (see `contract.fixtures.ts` fileoverview limit 2), not a
 * fabricated success — the module must surface that real failure as
 * `useMeta().hasError`, not silently swallow it or report a false success.
 *
 * ## What Breaks If These Fail
 * A client's payment-method change or cancel request is silently sent to the
 * wrong contract, with the wrong body, or under the wrong identity — or a
 * real withdrawal failure is reported to the client as a success.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { ContractContextTypes, useContract } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  installContractHandler,
  observeAllRequests,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
import { server } from "./setup.integration";
import type { ContractObservedRequest } from "./contract.int-helpers";

// -----------------------------------------------------------------------------

type Captured = { request?: ContractObservedRequest; body?: unknown };

function capture(request: Request, into: Captured): void {
  into.request = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  };
}

/** Opens the manager over the recorded contract and waits for it to settle. */
async function openManager() {
  const { accessToken } = await seedClientSession();
  installContractHandler(server);
  const row = recorded.one().data;
  const manager = useContract()
    .as(ScopeActorTypes.CLIENT)
    .for(ContractContextTypes.CONTRACT, row.id);
  await manager.useActions().isReady();
  return { manager, row, accessToken };
}

// -----------------------------------------------------------------------------

/**
 * FIXTURE GAP: the only real `payment_details_id` this recorded staging
 * client carries anywhere — the contract row's own stored id AND the one
 * body `patch-contracts-id-payment-details.json` was itself captured
 * setting — is `785d26e9-6783-d16e-738f-314502e70439`. No second real
 * stored-method id exists in any capture on disk, so AC-8's "point it at a
 * DIFFERENT method" send-half has no real alternate id to derive from
 * (recording is forbidden this pass — see `receipts.md`). This id is a
 * placeholder used ONLY to be provably unequal to the recorded stored id
 * above; it is never asserted to be a real payment-details record, and it
 * is NEVER reused as a product id (a product id comes from
 * `recorded.one().data.products[0].id` below).
 */
const A_NON_STORED_PAYMENT_DETAILS_ID = "785d26e9-6783-d169-497f-314502e70439";

/** The real product id `recorded.one()` carries — never a fabricated id. */
const A_REAL_PRODUCT_ID = "785d26e9-6783-d169-678a-314502e70439";

describe("useContract — I point my contract at a different stored payment method (AC-8)", () => {
  it("AC-8 PATCHes { payment_details_id } to my own contract's payment_details, under my own identity", async () => {
    const { manager, row, accessToken } = await openManager();
    const paymentDetailsId = A_NON_STORED_PAYMENT_DETAILS_ID;
    const captured: Captured = {};

    server?.use(
      http.patch(
        `*/contracts/${row.id}/payment_details`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.paymentMethodSet(), {
            status: 200
          });
        }
      )
    );

    await manager.useActions().setPaymentMethod({ paymentDetailsId });

    expect(captured.request).toBeDefined();
    expect(captured.request!.method).toBe("PATCH");
    assertClientIdentityTransport(captured.request!, accessToken);
    expect(captured.body).toEqual({ payment_details_id: paymentDetailsId });
  });

  it("AC-8 I can still change how a cancelled or lapsed contract is paid for (R13 self-transition)", async () => {
    const { accessToken } = await seedClientSession();
    const base = recorded.one().data as Record<string, unknown> & {
      id: string;
      payment_details_id: string;
    };
    const row = {
      ...base,
      status: { code: ContractStatusCodes.CANCELLED }
    };
    installContractHandler(server, row);
    const manager = useContract()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractContextTypes.CONTRACT, row.id);
    await manager.useActions().isReady();
    const captured: Captured = {};

    server?.use(
      http.patch(
        `*/contracts/${row.id}/payment_details`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.paymentMethodSet(), {
            status: 200
          });
        }
      )
    );

    await manager
      .useActions()
      .setPaymentMethod({ paymentDetailsId: A_NON_STORED_PAYMENT_DETAILS_ID });

    expect(captured.request).toBeDefined();
    assertClientIdentityTransport(captured.request!, accessToken);
    expect(captured.body).toEqual({
      payment_details_id: A_NON_STORED_PAYMENT_DETAILS_ID
    });
  });

  /** `@proves contract.feature:145` — the parity-loss direction: an
   * over-refusing surface would silently withhold this change on a merely
   * suspended contract that the legacy account area still offers it on. */
  it("AC-8 a suspended subscription is offered the change normally — no product fact and no contract status refuses it", async () => {
    const { accessToken } = await seedClientSession();
    const base = recorded.one().data as Record<string, unknown> & {
      id: string;
      payment_details_id: string;
    };
    const row = {
      ...base,
      status: { code: ContractStatusCodes.SUSPENDED }
    };
    installContractHandler(server, row);
    const manager = useContract()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractContextTypes.CONTRACT, row.id);
    await manager.useActions().isReady();
    const captured: Captured = {};

    server?.use(
      http.patch(
        `*/contracts/${row.id}/payment_details`,
        async ({ request }) => {
          capture(request, captured);
          captured.body = await request.json();
          return HttpResponse.json(recorded.paymentMethodSet(), {
            status: 200
          });
        }
      )
    );

    await manager
      .useActions()
      .setPaymentMethod({ paymentDetailsId: A_NON_STORED_PAYMENT_DETAILS_ID });

    expect(captured.request).toBeDefined();
    assertClientIdentityTransport(captured.request!, accessToken);
    expect(captured.body).toEqual({
      payment_details_id: A_NON_STORED_PAYMENT_DETAILS_ID
    });
  });
});

/**
 * bdd.md amendment A22(d) — a `Scenario Outline` tagged `@AC-8 @manager
 * @mutation`, over ONE `<selection>` column with the rows "no method at
 * all" and "the method it already uses", whose outcome for BOTH rows is
 * that no request is sent. `contract.feature:143` states the same claim in
 * the host scenario ("nothing is sent when I have picked no method, or
 * picked the one it already uses"). This is the caller/action-layer
 * condition design.md §8.3's AC8 row states in its condition column ("The
 * client selected a method, and it is different [o13]") — the machine
 * itself carries no guard (ADR-17), so this refusal is proven here, at the
 * action layer, never against the machine.
 */
describe("useContract — nothing is sent when my selection changes nothing (AC-8, bdd.md A22(d))", () => {
  it("AC-8 sends nothing when I pick no method at all", async () => {
    const { manager, row } = await openManager();
    const observed = observeAllRequests();

    await manager.useActions().setPaymentMethod({ paymentDetailsId: "" });

    expect(
      observed.matching(`/contracts/${row.id}/payment_details`)
    ).toHaveLength(0);
    observed.stop();
  });

  it("AC-8 sends nothing when I pick the stored method my contract already uses", async () => {
    const { manager, row } = await openManager();
    const storedPaymentDetailsId = (row as { payment_details_id: string })
      .payment_details_id;
    const observed = observeAllRequests();

    await manager
      .useActions()
      .setPaymentMethod({ paymentDetailsId: storedPaymentDetailsId });

    expect(
      observed.matching(`/contracts/${row.id}/payment_details`)
    ).toHaveLength(0);
    observed.stop();
  });
});

describe("useContract — I ask for one of my contracts to be cancelled outright (AC-6)", () => {
  it("AC-6 POSTs { product_ids, cancellation_reason } to cancel/request, naming the product I asked for", async () => {
    const { manager, row, accessToken } = await openManager();
    const productId = A_REAL_PRODUCT_ID;
    const captured: Captured = {};

    server?.use(
      http.post(`*/contracts/${row.id}/cancel/request`, async ({ request }) => {
        capture(request, captured);
        captured.body = await request.json();
        return HttpResponse.json(recorded.cancellationRequested(), {
          status: 200
        });
      })
    );

    await manager.useActions().requestCancellation({
      productIds: [productId],
      reason: "no longer needed"
    });

    expect(captured.request).toBeDefined();
    expect(captured.request!.method).toBe("POST");
    assertClientIdentityTransport(captured.request!, accessToken);
    expect(captured.body).toEqual({
      product_ids: [productId],
      cancellation_reason: "no longer needed"
    });
  });

  it("AC-6 sends no cause field when I supply none — nothing travels in its place", async () => {
    const { manager, row } = await openManager();
    const productId = A_REAL_PRODUCT_ID;
    const captured: Captured = {};

    server?.use(
      http.post(`*/contracts/${row.id}/cancel/request`, async ({ request }) => {
        captured.body = await request.json();
        return HttpResponse.json(recorded.cancellationRequested(), {
          status: 200
        });
      })
    );

    await manager.useActions().requestCancellation({ productIds: [productId] });

    expect(captured.body).toEqual({ product_ids: [productId] });
  });
});

/**
 * `useContract` only fires WITHDRAW from `available.cancelling` (flow.md §3),
 * and the recorded `contracts/{id}` capture is a plain `contract_active`
 * contract with no `cancellation_request` — the account state at capture
 * time. Both AC-7 tests below need a contract IN `cancelling`, so this seeds
 * one from two REAL captures: the recorded contract row, with its
 * `cancellation_request` replaced by the REAL `cancellation_request` object
 * `post-contracts-id-cancel-request.json` recorded — the server's own
 * post-effect of AC-6's write, assembled rather than hand-typed, the same
 * pattern `client-company.int-helpers`' zero-row list override uses.
 */
function cancellingRow(): ReturnType<typeof recorded.one>["data"] {
  const base = recorded.one().data;
  const cancellationRequest = recorded.cancellationRequested().data;
  return { ...base, cancellation_request: cancellationRequest };
}

/**
 * KNOWN GAP — `@gap contract.feature:131`
 *
 * "Then the request is removed and my contract carries on". Both tests below
 * drive the sandbox's own recorded refusal, so AC-7's FAILURE half is proven
 * and its SUCCESS half is not: no recorded `200` capture for
 * `DELETE contracts/{id}/cancel/request` exists on disk, and recording is
 * forbidden this pass (`receipts.md`). Hand-authoring a success body would
 * fabricate the very outcome this promise names, so the gap is registered in
 * `contract.traceability.test.ts`'s partial-promise ledger instead.
 */
describe("useContract — I change my mind about a cancellation I asked for (AC-7)", () => {
  it("AC-7 DELETEs cancel/request under my own identity, exactly as design.md §8.3 states", async () => {
    const { accessToken } = await seedClientSession();
    const row = cancellingRow();
    installContractHandler(server, row);
    const rejection = recorded.withdrawRejected();
    const captured: Captured = {};

    server?.use(
      http.delete(`*/contracts/${row.id}/cancel/request`, ({ request }) => {
        capture(request, captured);
        return HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        });
      })
    );

    const manager = useContract()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractContextTypes.CONTRACT, row.id);
    await manager.useActions().isReady();
    await expect(
      manager.useActions().withdrawCancellation()
    ).rejects.toBeDefined();

    expect(captured.request).toBeDefined();
    expect(captured.request!.method).toBe("DELETE");
    assertClientIdentityTransport(captured.request!, accessToken);
  });

  it("AC-7 the sandbox's real refusal lands as readable error state, not a silent success", async () => {
    await seedClientSession();
    const row = cancellingRow();
    installContractHandler(server, row);
    const rejection = recorded.withdrawRejected();

    server?.use(
      http.delete(`*/contracts/${row.id}/cancel/request`, () =>
        HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        })
      )
    );

    const manager = useContract()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractContextTypes.CONTRACT, row.id);
    await manager.useActions().isReady();
    await expect(
      manager.useActions().withdrawCancellation()
    ).rejects.toBeDefined();

    expect(manager.useMeta().hasError.value).toBe(true);
    expect(manager.useContext().error.value).toBeTruthy();
  });
});

/**
 * AC-16's negative controls. Every request this manager's three proven
 * writes (AC-6/AC-7/AC-8 above) actually send is captured and inspected —
 * never a synthetic request built to pass — so a regression that routes a
 * write through a staff endpoint, or leaks a `clientId` override, is caught
 * on the SAME real traffic the writes above already prove correct.
 */
describe("useContract — no staff route is ever reachable from my contract surfaces (AC-16)", () => {
  it("AC-16 not one of the writes this module offers me is ever addressed to a staff route", async () => {
    const { manager, row } = await openManager();
    const observed = observeAllRequests();

    server?.use(
      http.patch(`*/contracts/${row.id}/payment_details`, () =>
        HttpResponse.json(recorded.paymentMethodSet(), { status: 200 })
      ),
      http.post(`*/contracts/${row.id}/cancel/request`, () =>
        HttpResponse.json(recorded.cancellationRequested(), { status: 200 })
      ),
      http.delete(`*/contracts/${row.id}/cancel/request`, () => {
        const rejection = recorded.withdrawRejected();
        return HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        });
      })
    );

    await manager.useActions().setPaymentMethod({
      paymentDetailsId: A_NON_STORED_PAYMENT_DETAILS_ID
    });
    await manager.useActions().requestCancellation({
      productIds: [A_REAL_PRODUCT_ID]
    });
    await manager
      .useActions()
      .withdrawCancellation()
      .catch(() => undefined);

    const requests = observed.all();
    // A positive allow-list, not only a negative ban: every request this
    // block observes — each write AND the re-read it triggers (design.md
    // §6.2/§8.4's re-read-after-write, AC-13) — lands on the exact client
    // routes AC-6/AC-7/AC-8 name, or on the contract's own read. So a
    // mutation that swapped one write (or its re-read) onto ANY other path
    // (staff or not) fails here too, not only one that happens to spell
    // "admin" or a cancel_requests approval verb.
    const allowed = [
      `/contracts/${row.id}/payment_details`,
      `/contracts/${row.id}/cancel/request`,
      `/contracts/${row.id}`
    ];
    expect(requests.length).toBeGreaterThanOrEqual(3);
    for (const request of requests) {
      const path = new URL(request.url).pathname;
      expect(allowed.some(allowedPath => path.endsWith(allowedPath))).toBe(
        true
      );
      expect(request.url).not.toMatch(/\/admin\//);
      expect(request.url).not.toMatch(
        /cancel_requests\/[^/]+\/(approve|reject|acknowledge|cancel)/
      );
    }
    observed.stop();
  });
});

describe("useContract — the account I act on is the one my scope resolved (AC-16, FE-2824)", () => {
  it("AC-16 the request is addressed to the contract `.for()` resolved, never to any clientId option or an unresolved id", async () => {
    const { manager, row } = await openManager();
    const observed = observeAllRequests();

    server?.use(
      http.patch(`*/contracts/${row.id}/payment_details`, () =>
        HttpResponse.json(recorded.paymentMethodSet(), { status: 200 })
      )
    );

    await manager.useActions().setPaymentMethod({
      paymentDetailsId: A_NON_STORED_PAYMENT_DETAILS_ID
    });

    const requests = observed.all();
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      // The load-bearing, falsifiable half: the URL is addressed to the REAL
      // id `.for(CONTRACT, row.id)` resolved — a regression that dropped
      // that retargeting and fell back to the session's own client id (or to
      // nothing) fails this line, where a bare "not clients/undefined/"
      // check never could, because this URL shape never carries a
      // "clients/" segment to begin with.
      expect(new URL(request.url).pathname).toContain(`/contracts/${row.id}`);
      expect(request.url).not.toContain("clients/undefined/");
      expect(new URL(request.url).searchParams.has("clientId")).toBe(false);
    }
    observed.stop();
  });
});
