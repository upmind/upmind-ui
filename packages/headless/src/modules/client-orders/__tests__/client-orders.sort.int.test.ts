// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the sort wire proof (AC-10, ruling R2)
 *
 * ## Job To Be Done
 * Prove the collection resolves `order=-created_at` on its very first
 * request with no sort chosen (design 8.3's default), and that a `sort`
 * criteria write carries each of the FOUR legacy sortable columns onto the
 * wire — `id` included. Operator ruling R2 (2026-09-23) overrules
 * requirements AC3's drop of the `id` sorter: "the sort enum keeps `id`"
 * (design.md §2, §5.2). A regression that silently drops `id` from
 * `ClientOrdersSortableColumn` would pass every other spec in this module
 * and only this one would catch it.
 *
 * ## Scope note (escalated, not silently worked around)
 * Design 8.6 documents `sortBy(intent)` and `sort(property, direction)` as
 * `useClientOrders` action members. Introspecting the REAL running
 * `useActions()` object (`Object.keys(orders.useActions())`) shows this
 * pass's build exposes only `destroy, invalidate, isReady, nextPage,
 * prevPage, refresh, reset, setPage, setLimit` — no `filters`, `filterBy`,
 * `sortBy`, or `sort`. That is a real gap in this pass's delivered surface
 * against design.md 8.6, outside the prover seat's remit to fix (it is
 * implementation code). This spec proves what CAN be proven today — the
 * schema/translateQuery wire form via the documented raw setter
 * (`useInternals().query.setCriteria`, same seam ruling 4 already uses for
 * `filters`) — and does not claim to prove the not-yet-built named
 * `sort()`/`sortBy()` actions, including AC-10's "a sort change keeps the
 * current page" clause, which is `sortBy`'s own documented behaviour
 * (design 8.3 write rules) and cannot be exercised without it. The raw-
 * setter equivalent (a `sort`-only write leaves an untouched `pagination`
 * branch, per design 8.3's "each branch independently replaces only when
 * written") is proven instead, as the closest available proxy.
 *
 * ## What Breaks If These Fail
 * A client's order history defaults to the wrong order, or loses the
 * ability to sort by order number (`id`) — a legacy capability ruling R2
 * explicitly restores against the mock contract's own drop.
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import { ClientOrdersSortableColumn, useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { SortDirection } from "../../query/query.types";
import {
  installClientOrdersHandlers,
  observeOrderRequests,
  seedClientSession
} from "./client-orders.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

async function bootSelfCollection() {
  await seedClientSession();
  installClientOrdersHandlers();

  const orders = useClientOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

/** One shared instance for the whole file — see the dotted-operators spec's
 * header for why a second `useClientOrders()` boot in one vitest file
 * throws (a real, verified implementation defect in the brand-settled
 * watch, out of the prover seat's remit to fix). */
let orders: Awaited<ReturnType<typeof bootSelfCollection>>;

beforeAll(async () => {
  orders = await bootSelfCollection();
}, 30000);

// -----------------------------------------------------------------------------

describe("client-orders — sort resolves the newest order first by default (AC-10)", () => {
  it("the first request, with no sort chosen, carries order=-created_at", async () => {
    const observed = observeOrderRequests();
    orders.useActions().refresh();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    expect(observed.lastParam("order")).toBe("-created_at");
  });
});

describe("client-orders — a raw sort write accepts each of the four legacy fields, id included (AC-10, ruling R2)", () => {
  it.each([
    [ClientOrdersSortableColumn.ID, SortDirection.ASC, "id"],
    [ClientOrdersSortableColumn.ID, SortDirection.DESC, "-id"],
    [
      ClientOrdersSortableColumn.TOTAL_AMOUNT,
      SortDirection.ASC,
      "total_amount"
    ],
    [
      ClientOrdersSortableColumn.TOTAL_AMOUNT,
      SortDirection.DESC,
      "-total_amount"
    ],
    [ClientOrdersSortableColumn.STATUS_ID, SortDirection.ASC, "status_id"],
    [ClientOrdersSortableColumn.STATUS_ID, SortDirection.DESC, "-status_id"],
    [ClientOrdersSortableColumn.CREATED_AT, SortDirection.ASC, "created_at"]
    // CREATED_AT/DESC is not repeated here — it is the query's cached
    // default-sort key (proven by the describe block above), and TanStack's
    // documented DAY-long staleTime (design 8.4) legitimately serves that
    // exact key from cache with no new network request; re-asserting it via
    // a fresh `observeOrderRequests()` here would flag a correct cache hit
    // as a failure.
  ] as const)(
    "setCriteria({ sort: [{ field: %s, dir: %s }] }) sends order=%s",
    async (field, dir, expectedWire) => {
      const observed = observeOrderRequests();

      orders.useInternals().query.setCriteria({ sort: [{ field, dir }] });

      await vi.waitFor(() =>
        expect(observed.lastParam("order")).toBe(expectedWire)
      );
    }
  );
});

describe("client-orders — AC-10's 'a sort change keeps the current page' clause is NOT provable this pass", () => {
  it("a raw sort-only write resets the page to offset 0 — it does NOT keep the current page", async () => {
    // Design 8.3's write rules are explicit that page-preservation on a
    // sort change is `sortBy(intent)`'s OWN behaviour: it writes
    // `{ sort: intent, pagination: <live pagination> }` — the setter itself
    // copies the live pagination forward. The general rule for any OTHER
    // write that omits `pagination` is the opposite: "the criteria put
    // offset back to 0" (design 8.3, parity row 6). Since `sortBy` does not
    // exist on this pass's `useActions()` (see the file header), there is
    // no named setter that copies pagination forward — only the raw
    // setter, which follows the general reset-to-0 rule. This test proves
    // the REAL, currently-observed behaviour, not the design's page-
    // preservation promise, which needs `sortBy` to exist before it can be
    // exercised at all — escalated as an open gap, not asserted away.
    const observed = observeOrderRequests();

    // A distinct limit makes the resulting (sort, offset, limit) triple a
    // key never seen earlier in this file, so the assertion below cannot
    // be satisfied by a stale cache hit instead of a real new request.
    orders.useActions().setLimit(15);
    await vi.waitFor(() => expect(observed.lastParam("limit")).toBe("15"));
    orders.useActions().setPage(2);
    await vi.waitFor(() => expect(observed.lastParam("offset")).toBe("15"));

    orders.useInternals().query.setCriteria({
      sort: [
        { field: ClientOrdersSortableColumn.STATUS_ID, dir: SortDirection.ASC }
      ]
    });

    await vi.waitFor(() =>
      expect(observed.lastParam("order")).toBe("status_id")
    );
    expect(observed.lastParam("offset")).toBe("0");
    expect(observed.lastParam("limit")).toBe("15");
  });
});
