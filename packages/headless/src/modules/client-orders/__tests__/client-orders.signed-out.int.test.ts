// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — a signed-out caller sends no request
 * (AC-23)
 *
 * ## Job To Be Done
 * Prove the second half of AC-23: "a signed-out caller triggers no
 * request". Design 6.1 step 2 and design 8.11's edge-condition table both
 * state the guard rejects and `enabled` stays false with no client signed
 * in — this spec drives the REAL guard, with no client session ever
 * seeded, and asserts zero outbound `/invoices` requests over a real
 * elapsed window (not a synchronous read, which could pass before an
 * async guard even runs).
 *
 * ## What Breaks If These Fail
 * A signed-out visitor (session expired mid-view, or the composable
 * mounted before the session settles) fires a request the platform will
 * 401 on, or worse, leaks a request shaped for one client's data before
 * any client is confirmed.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBootstrapStubs,
  observeOrderRequests,
  resetClientOrderScopes
} from "./client-orders.int-helpers";
import { server } from "./setup.integration";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-orders — a signed-out caller triggers no request (AC-23)", () => {
  it("useClientOrders().as('self') sends zero /invoices requests with no client session", async () => {
    resetClientOrderScopes();
    // Guest-token bootstrap only — never seeds a client session, so the
    // module's own guard is the thing under test, not this file's setup.
    installBootstrapStubs(server, { withBrandConfig: false });

    const observed = observeOrderRequests();
    useClientOrders().as(ScopeActorTypes.SELF);

    // No client ever resolves, so nothing here ever legitimately settles —
    // wait on a real elapsed window rather than a state transition that
    // may never occur.
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(observed.all()).toEqual([]);
  });
});
