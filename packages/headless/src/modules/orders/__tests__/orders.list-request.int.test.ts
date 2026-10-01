// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the first list request (AC-1)
 *
 * ## Job To Be Done
 * Prove `useOrders().as('self')` reads `GET api/invoices`, never
 * `api/admin/invoices*`, with `filter[category.slug]=new_contract` and no
 * `client_id` on its FIRST request (design 8.1, D-18), and that the replay
 * pool answers that first request with the recorded default capture.
 *
 * ## What Breaks If These Fail
 * The client's order history widens past `new_contract` orders, reads the
 * admin surface, or leaks a `client_id` onto a client request.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  observeOrderRequests,
  seedClientSession
} from "./orders.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("orders — the first request reads the client self path with the forced category (AC-1)", () => {
  beforeEach(async () => {
    await seedClientSession();
  }, 30000);

  it("useOrders().as('self') sends GET api/invoices, never api/admin/invoices*, with filter[category.slug]=new_contract and no client_id, on the FIRST request", async () => {
    const observed = observeOrderRequests();

    const orders = useOrders().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );

    const first = new URL(observed.first().url);
    expect(observed.first().method).toBe("GET");
    expect(first.pathname).toBe("/api/invoices");
    expect(first.searchParams.get("filter[category.slug]")).toBe(
      "new_contract"
    );
    expect(first.searchParams.has("client_id")).toBe(false);

    await vi.waitFor(() =>
      expect(orders.useContext().pagination.value?.total).toBe(
        captured("get-invoices-case-orders-default").total
      )
    );
    expect(orders.useMeta().hasError.value).toBe(false);
  });
});
