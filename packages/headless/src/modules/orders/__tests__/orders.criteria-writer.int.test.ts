// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the collection criteria writer and the
 * filtered flag (AC-7)
 *
 * ## Job To Be Done
 * Prove `useActions().setCriteria` writes ONE branch of the query model and
 * leaves the others as they stand: a `filters` write keeps the boot order
 * `-created_at`, and a `sort` write keeps the forced category. A `filters`
 * write replaces that branch whole, so a filter the write leaves out is
 * cleared while the forced category stays. Prove
 * `useMeta().isFiltered` tells a client filter apart from the forced
 * category: false on the boot model, true once the client searches, false
 * again when the client clears the search (design 8.3 "an absent value").
 *
 * ## Provenance
 * Each write lands on a recorded capture of the strict pool
 * (`orders-search`, `orders-sort-id`), so staging accepted each request.
 *
 * ## What Breaks If These Fail
 * The playground filter bar drops the sort or the forced category on a
 * write, or a consumer cannot tell an empty history that a filter caused
 * from one that holds no orders at all.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrdersSortableColumn, useOrders } from "..";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  observeOrderRequests,
  recordedParam,
  seedClientSession
} from "./orders.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

const NUMBER = recordedParam(
  "get-invoices-case-orders-search",
  "filter[number|eq]"
);
const BOOT_ORDER = recordedParam("get-invoices-case-orders-default", "order");
const SORT_ID_ORDER = recordedParam(
  "get-invoices-case-orders-sort-id",
  "order"
);

async function bootSelfCollection() {
  await seedClientSession();
  const orders = useOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

let orders: Awaited<ReturnType<typeof bootSelfCollection>>;
let observer: ReturnType<typeof observeOrderRequests>;

describe("orders — useActions().setCriteria writes one branch (AC-7)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
    observer = observeOrderRequests();
  }, 30000);

  it("a filters write sends the recorded number and keeps the boot order and the forced category (AC-7)", async () => {
    orders.useActions().setCriteria({ filters: { number: { eq: NUMBER } } });

    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[number|eq]")).toBe(NUMBER)
    );
    expect(observer.latestParams().get("order")).toBe(BOOT_ORDER);
    expect(observer.latestParams().getAll("filter[category.slug]")).toEqual([
      "new_contract"
    ]);
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );
    expect(orders.useContext().error.value).toBeUndefined();
  });

  it("a sort write sends the recorded id order and keeps the forced category (AC-7)", async () => {
    orders.useActions().setCriteria({
      sort: [{ field: OrdersSortableColumn.ID, dir: SortDirection.ASC }]
    });

    await vi.waitFor(() =>
      expect(observer.latestParams().get("order")).toBe(SORT_ID_ORDER)
    );
    expect(observer.latestParams().getAll("filter[category.slug]")).toEqual([
      "new_contract"
    ]);
    expect(observer.latestParams().has("filter[number|eq]")).toBe(false);
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );
    expect(orders.useContext().error.value).toBeUndefined();
  });

  it("a filters write replaces the filters branch, so the number an earlier write set leaves the wire (AC-7)", async () => {
    orders.useActions().setCriteria({ filters: { number: { eq: NUMBER } } });
    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[number|eq]")).toBe(NUMBER)
    );
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );

    orders.useActions().setCriteria({
      filters: {},
      sort: [{ field: OrdersSortableColumn.ID, dir: SortDirection.ASC }]
    });

    await vi.waitFor(() =>
      expect(observer.latestParams().get("order")).toBe(SORT_ID_ORDER)
    );
    expect(observer.latestParams().has("filter[number|eq]")).toBe(false);
    expect(observer.latestParams().getAll("filter[category.slug]")).toEqual([
      "new_contract"
    ]);
    expect(orders.useContext().query.value.filters?.number).toBeUndefined();
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );
    expect(orders.useContext().error.value).toBeUndefined();
  });
});

describe("orders — useMeta().isFiltered tells a client filter from the forced category (AC-7)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
    observer = observeOrderRequests();
  }, 30000);

  it("false on the boot model, true after a search, false after the search is cleared (AC-7)", async () => {
    const meta = orders.useMeta();
    expect(orders.useContext().query.value.filters?.["category.slug"]).toBe(
      "new_contract"
    );
    expect(meta.isFiltered.value).toBe(false);

    orders.useActions().filters.query(NUMBER);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[number|eq]")).toBe(NUMBER)
    );
    expect(meta.isFiltered.value).toBe(true);

    orders.useActions().filters.query();
    await vi.waitFor(() =>
      expect(orders.useContext().query.value.filters?.number).toBeUndefined()
    );
    expect(meta.isFiltered.value).toBe(false);
  });
});
