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

describe("useContract — I point my contract at a different stored payment method (AC-8)", () => {
  it("AC-8 PATCHes { payment_details_id } to my own contract's payment_details, under my own identity", async () => {
    const { manager, row, accessToken } = await openManager();
    const paymentDetailsId = "785d26e9-6783-d16e-738f-314502e70439";
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
});

describe("useContract — I ask for one of my contracts to be cancelled outright (AC-6)", () => {
  it("AC-6 POSTs { product_ids, cancellation_reason } to cancel/request, naming the product I asked for", async () => {
    const { manager, row, accessToken } = await openManager();
    const productId = "785d26e9-6783-d169-497f-314502e70439";
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
    const productId = "785d26e9-6783-d169-497f-314502e70439";
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
      paymentDetailsId: "785d26e9-6783-d16e-738f-314502e70439"
    });
    await manager.useActions().requestCancellation({
      productIds: ["785d26e9-6783-d169-497f-314502e70439"]
    });
    await manager
      .useActions()
      .withdrawCancellation()
      .catch(() => undefined);

    const requests = observed.all();
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      expect(request.url).not.toMatch(/\/admin\//);
      expect(request.url).not.toMatch(
        /cancel_requests\/[^/]+\/(approve|reject|acknowledge|cancel)/
      );
    }
    observed.stop();
  });
});

describe("useContract — the account I act on is the one my scope resolved (AC-16, FE-2824)", () => {
  it("AC-16 no request or its URL ever names a clientId option, and none contains the literal text clients/undefined/", async () => {
    const { manager, row } = await openManager();
    const observed = observeAllRequests();

    server?.use(
      http.patch(`*/contracts/${row.id}/payment_details`, () =>
        HttpResponse.json(recorded.paymentMethodSet(), { status: 200 })
      )
    );

    await manager.useActions().setPaymentMethod({
      paymentDetailsId: "785d26e9-6783-d16e-738f-314502e70439"
    });

    const requests = observed.all();
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      expect(request.url).not.toContain("clients/undefined/");
      expect(new URL(request.url).searchParams.has("clientId")).toBe(false);
    }
    observed.stop();
  });
});
