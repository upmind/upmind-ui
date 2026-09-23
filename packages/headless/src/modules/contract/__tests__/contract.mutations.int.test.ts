// -----------------------------------------------------------------------------
/**
 * @fileoverview useContract writes — payment method (integration, AC-8)
 *
 * ## Job To Be Done
 * Drive the REAL `useContract()` manager against RECORDED staging responses and
 * prove its ONE remaining write reaches the wire exactly as `design ✅.md` §8.3
 * states: `setPaymentMethod` PATCHes `{ payment_details_id }` to the contract's
 * own `payment_details` endpoint, and sends nothing when the selection changes
 * nothing (R31). The hard cancel request and its withdrawal moved to
 * `useContractProduct` (R33). Every response body is the module's OWN recorded
 * capture (`contract.fixtures.ts`) — never a hand-rolled mock.
 *
 * ## What Breaks If These Fail
 * A client's payment-method change is silently sent to the wrong contract, with
 * the wrong body, or under the wrong identity; or an unchanged selection still
 * fires a needless write.
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

describe("useContract — I point my contract at a different stored payment method (AC-8)", () => {
  /** `@proves contract.feature:174` — the `an active subscription` row of the
   * AC-8 Outline: the recorded contract capture's own products are active
   * subscriptions, and this is the row every other row is compared against. */
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

  /** `@proves contract.feature:175` — the `a suspended subscription` row of
   * the AC-8 Outline amendment A13 creates. The parity-loss direction: an
   * over-refusing surface would silently withhold this contract-level change
   * on a contract whose product is merely suspended, which the legacy account
   * area still offers it on. Ruling R11 withdrew the product-level gate, so
   * this row's outcome is the same as every other row's. */
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
 * `@proves contract.feature:176` — the `a one-off purchase` row of the AC-8
 * Outline (amendment A13 + A16). Ruling R11 withdrew the product-level gate,
 * so NO product state refuses this CONTRACT-level write; a module that
 * re-introduced a `isSubscription` read on this path would withhold from a
 * one-off contract a change the legacy account area still offers, and fails
 * this row alone.
 */
describe("useContract — a contract holding a one-off purchase is offered the payment-method change too (AC-8)", () => {
  it("AC-8 a one-off purchase on the contract refuses nothing — the PATCH reaches the wire unchanged", async () => {
    const { accessToken } = await seedClientSession();
    const base = recorded.one().data as Record<string, unknown> & {
      id: string;
      products?: Record<string, unknown>[];
    };
    const products = (base.products ?? []).map(product => ({
      ...product,
      billing_cycle_months: 0
    }));
    const row = { ...base, products };
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
 * KNOWN GAP — `@gap contract.feature:177`, the `delegated to me` row of the
 * AC-8 Outline. A delegated contract is one belonging to ANOTHER account that
 * my account has been granted access to; no such capture exists on disk in
 * this module's `fixtures/`, and the only way to fabricate one is to rewrite
 * the recorded row's owning account id — which would break the very
 * identity assertion (`assertClientIdentityTransport`) every other row of
 * this Outline leans on, and would be a synthesised, not a recorded,
 * delegation. Recording is forbidden this pass (`receipts.md`), so the row is
 * reported rather than faked green.
 */

/**
 * bdd.md amendment A22(d) — a `Scenario Outline` tagged `@AC-8 @manager
 * @mutation`, over ONE `<selection>` column with the rows "no method at
 * all" and "the method it already uses", whose outcome for BOTH rows is
 * that no request is sent. `contract.feature:188` states the same claim in
 * the host scenario ("nothing is sent when I have picked no method, or
 * picked the one it already uses"). This is the caller/action-layer
 * condition `design ✅.md` §8.3's AC8 row states in its condition column ("The
 * client selected a method, and it is different [o13]") — the machine
 * itself carries no guard (ADR-17), so this refusal is proven here, at the
 * action layer, never against the machine.
 */
describe("useContract — nothing is sent when my selection changes nothing (AC-8, bdd.md A22(d))", () => {
  /**
   * The two rows of AC-8's "Nothing is sent when my selection changes nothing"
   * Outline (amendment A22(d)):
   * - `@proves contract.feature:192` — no method at all
   * - `@proves contract.feature:193` — the method it already uses
   */
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

/**
 * The FORM path (`openPaymentMethod → set → submitPaymentMethod`) carries the
 * SAME R31 no-op refusal as the direct `setPaymentMethod` action: submitting an
 * empty selection, or the method the contract already uses, sends no request and
 * resolves `false` (mutant: `contract.payment-method-noop.must-fail.patch`).
 *
 * The AJV-INVALID payment-method model (an id NOT among the loaded stored cards
 * → a 422 in the form's error region, mutant
 * `contract.payment-method-enum.must-fail.patch`) is proven in
 * `contract.payment-method-enum.int.test.ts`, which serves the payment-details
 * module's OWN recorded stored-cards list so the form enum populates (D3).
 */
describe("useContract — the payment-method FORM submits nothing when the selection changes nothing (AC-8, R31)", () => {
  it("AC-8 the form sends no PATCH and resolves false when I submit an empty selection", async () => {
    const { manager, row } = await openManager();
    await manager.useActions().openPaymentMethod();
    await manager.useActions().set({ paymentDetailsId: "" });
    const observed = observeAllRequests();

    const result = await manager.useActions().submitPaymentMethod();

    expect(result).toBe(false);
    expect(
      observed.matching(`/contracts/${row.id}/payment_details`)
    ).toHaveLength(0);
    observed.stop();
  });

  it("AC-8 the form sends no PATCH and resolves false when I submit the method already on the contract", async () => {
    const { manager, row } = await openManager();
    const current = (row as { payment_details_id: string }).payment_details_id;
    await manager.useActions().openPaymentMethod();
    await manager.useActions().set({ paymentDetailsId: current });
    const observed = observeAllRequests();

    const result = await manager.useActions().submitPaymentMethod();

    expect(result).toBe(false);
    expect(
      observed.matching(`/contracts/${row.id}/payment_details`)
    ).toHaveLength(0);
    observed.stop();
  });
});

/**
 * The hard cancel request and its withdrawal moved to `useContractProduct`
 * with ruling R33 — `useContract` no longer exposes `requestCancellation` or
 * `withdrawCancellation`. AC-6 and AC-7 are proven in
 * `contract-product.mutations.int.test.ts`; this file keeps `setPaymentMethod`
 * (AC-8), the contract's only remaining write (R34).
 */

/**
 * AC-16's negative control. Every request the ONE write this manager keeps
 * (AC-8) actually sends is captured and inspected — never a synthetic request
 * built to pass — so a regression that routes it through a staff endpoint, or
 * leaks a `clientId` override, is caught on the SAME real traffic the write
 * above already proves correct.
 */
describe("useContract — no staff route is ever reachable from my contract surfaces (AC-16)", () => {
  /**
   * AC-16's staff-route scenario, for the contract's one remaining write:
   * - `@proves contract.feature:248` — opening one of my contracts
   * - `@proves contract.feature:249` — changing how a contract is paid for
   *
   * The cancel-request and withdraw rows moved to
   * `contract-product.mutations.int.test.ts` with R33.
   */
  it("AC-16 the payment-method write and its re-read are never addressed to a staff route", async () => {
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
    const allowed = [
      `/contracts/${row.id}/payment_details`,
      `/contracts/${row.id}`
    ];
    expect(requests.length).toBeGreaterThanOrEqual(1);
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
