// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the newest order comes first, and a sort
 * keeps the page (AC-10, ruling R2)
 *
 * ## Job To Be Done
 * Prove the first request with no sort chosen carries `order=-created_at`,
 * that `sortBy` sends each of the four legacy fields, `id` and ascending
 * `created_at` included (ruling R2), in both directions, and that `sortBy`
 * and `sort` keep the current page (design 8.3: `{ sort, pagination: <live> }`).
 *
 * ## Provenance
 * The four ascending sorts replay their recorded `orders-sort-<field>`
 * captures through the strict pool, so staging accepted each sort field.
 *
 * ## What Breaks If These Fail
 * The history opens in the wrong order, loses a legacy sort field, or a sort
 * choice sends the client back to page one.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrdersSortableColumn, useOrders } from "..";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  observeOrderRequests,
  seedClientSession
} from "./orders.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

async function bootSelfCollection() {
  await seedClientSession();
  const orders = useOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

let orders: Awaited<ReturnType<typeof bootSelfCollection>>;
let observer: ReturnType<typeof observeOrderRequests>;

describe("orders — the newest order comes first by default (AC-10)", () => {
  it("the first request, with no sort chosen, carries order=-created_at", async () => {
    await seedClientSession();
    observer = observeOrderRequests();
    orders = useOrders().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );

    expect(new URL(observer.first().url).searchParams.get("order")).toBe(
      "-created_at"
    );
  });
});

describe("orders — sortBy accepts each of the four legacy fields (AC-10, ruling R2)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
    observer = observeOrderRequests();
  }, 30000);

  it.each([
    OrdersSortableColumn.ID,
    OrdersSortableColumn.TOTAL_AMOUNT,
    OrdersSortableColumn.STATUS_ID,
    OrdersSortableColumn.CREATED_AT
  ])(
    "sortBy ascending on %s sends order=<field>, and the pool answers with its sort capture",
    async field => {
      orders.useActions().sortBy([{ field, dir: SortDirection.ASC }]);

      await vi.waitFor(() =>
        expect(observer.latestParams().get("order")).toBe(field)
      );
      await vi.waitFor(() =>
        expect(orders.useContext().data.value?.[0]?.id).toBe(
          captured(`get-invoices-case-orders-sort-${field}`).data[0].id
        )
      );
    }
  );

  it.each([
    OrdersSortableColumn.ID,
    OrdersSortableColumn.TOTAL_AMOUNT,
    OrdersSortableColumn.STATUS_ID
  ])("sortBy descending on %s sends order=-<field>", async field => {
    orders.useActions().sortBy([{ field, dir: SortDirection.DESC }]);

    await vi.waitFor(() =>
      expect(observer.latestParams().get("order")).toBe(`-${field}`)
    );
  });
});

describe("orders — a sort keeps the current page (AC-10)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
    observer = observeOrderRequests();
  }, 30000);

  it("a sortBy write on page two keeps offset 10, and carries the chosen sort", async () => {
    orders.useActions().setPage(2);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("offset")).toBe("10")
    );

    orders
      .useActions()
      .sortBy([
        { field: OrdersSortableColumn.STATUS_ID, dir: SortDirection.ASC }
      ]);

    await vi.waitFor(() =>
      expect(observer.latestParams().get("order")).toBe("status_id")
    );
    expect(observer.latestParams().get("offset")).toBe("10");
    expect(observer.latestParams().get("limit")).toBe("10");
  });

  it("sort(property, direction) keeps a page window of a custom page size", async () => {
    orders.useActions().setLimit(15);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("limit")).toBe("15")
    );
    orders.useActions().setPage(2);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("offset")).toBe("15")
    );

    orders.useActions().sort(OrdersSortableColumn.ID, SortDirection.DESC);

    await vi.waitFor(() =>
      expect(observer.latestParams().get("order")).toBe("-id")
    );
    expect(observer.latestParams().get("offset")).toBe("15");
    expect(observer.latestParams().get("limit")).toBe("15");
  });
});
