// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — a second boot after the brand settles works
 * (design 5.3 F16)
 *
 * ## Job To Be Done
 * Prove that `useClientOrders().as('self')` can be instantiated a SECOND
 * time in one process, after `useBrand()` has already settled from a first
 * instance — with no error, and with each instance sending its own list
 * request. `useBrand()` is a long-lived singleton (design 8.8); by the time
 * a second scoped instance boots, the brand has already resolved, so any
 * self-stopping "brand settled" watch that runs its callback IMMEDIATELY on
 * an already-settled source (rather than only on the FIRST settle) is
 * exercised on this second boot, never on the first.
 *
 * ## What Breaks If These Fail
 * A client who navigates between two pages that both mount
 * `useClientOrders().as('self')` (or a page that remounts it) gets a thrown
 * error instead of a second order-history list, because the SECOND
 * instance's boot path is never proven to have to be able to serve a
 * second, independent load.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installClientOrdersBackgroundStubs,
  observeOrderRequests,
  resetClientOrderScopes,
  seedClientSession
} from "./client-orders.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

async function bootSelfCollection() {
  const orders = useClientOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

describe("client-orders — a second instance boots cleanly after the brand settles (AC-2, design 5.3 F16)", () => {
  beforeEach(async () => {
    await seedClientSession();
  }, 30000);

  it("a first and then a second useClientOrders().as('self') each resolve with no error and their own list request", async () => {
    const observed = observeOrderRequests();

    const first = await bootSelfCollection();
    expect(first.useMeta().hasError.value).toBe(false);
    expect(first.useContext().error.value).toBeUndefined();
    await vi.waitFor(() => expect(observed.all().length).toBe(1));

    resetClientOrderScopes();
    installClientOrdersBackgroundStubs();

    const second = await bootSelfCollection();
    expect(second.useMeta().hasError.value).toBe(false);
    expect(second.useContext().error.value).toBeUndefined();
    await vi.waitFor(() => expect(observed.all().length).toBe(2));

    expect(first.useContext().data.value?.length).toBeGreaterThan(0);
    expect(second.useContext().data.value?.length).toBeGreaterThan(0);
  });
});
