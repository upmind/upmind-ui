// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the page window (AC-3)
 *
 * ## Job To Be Done
 * Prove the three AC3 scenarios. A client moves between pages: the first
 * request carries `limit=10&offset=0`, `nextPage()` sends one request at
 * `offset=10`, and each page publishes its rows and the total of that one
 * request, with no count request beside it. A page or a page size out of
 * range becomes valid: `setPage(n)` moves the window by the live limit,
 * `setLimit(n)` returns to offset 0, a page under one becomes page one, a
 * page size under one becomes one, and a raw `limit: 0` write sends nothing
 * and sets `error`. A client with no orders sees an empty history.
 *
 * ## Provenance
 * The strict pool answers offset 0 with `orders-default` and offset 10 with
 * `orders-page-2`. Declared construction (design 8.8, "empty history"): the
 * recorded default list with `data: []` and `total: 0`.
 *
 * ## What Breaks If These Fail
 * A page move or a page-size change sends the wrong window, a second request
 * counts the history, or a client with no orders sees a spinner or an error.
 */

import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  observeOrderRequests,
  seedClientSession,
  settle
} from "./client-orders.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const DEFAULT = captured("get-invoices-case-orders-default");
const PAGE_2 = captured("get-invoices-case-orders-page-2");

async function bootSelfCollection() {
  await seedClientSession();
  const orders = useClientOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

let orders: Awaited<ReturnType<typeof bootSelfCollection>>;
let observer: ReturnType<typeof observeOrderRequests>;

describe("client-orders — a client moves between pages (AC-3)", () => {
  it("page one and page two each come from one request that carries the rows and the total", async () => {
    await seedClientSession();
    observer = observeOrderRequests();
    orders = useClientOrders().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );

    const first = new URL(observer.first().url).searchParams;
    expect(first.get("limit")).toBe("10");
    expect(first.get("offset")).toBe("0");
    expect(observer.all()).toHaveLength(1);
    expect(orders.useContext().pagination.value?.total).toBe(DEFAULT.total);
    expect(orders.useContext().data.value?.map(row => row.id)).toEqual(
      DEFAULT.data.map(row => row.id)
    );

    orders.useActions().nextPage();
    await vi.waitFor(() =>
      expect(orders.useContext().data.value?.map(row => row.id)).toEqual(
        PAGE_2.data.map(row => row.id)
      )
    );
    expect(observer.all()).toHaveLength(2);
    expect(observer.latestParams().get("offset")).toBe("10");
    expect(observer.latestParams().get("limit")).toBe("10");
    expect(orders.useContext().pagination.value?.page).toBe(2);
    expect(orders.useMeta().hasPrevPage.value).toBe(true);
    for (const request of observer.all()) {
      expect(new URL(request.url).searchParams.has("skip_count")).toBe(false);
    }

    orders.useActions().prevPage();
    await vi.waitFor(() =>
      expect(orders.useContext().pagination.value?.page).toBe(1)
    );
    expect(orders.useContext().data.value?.map(row => row.id)).toEqual(
      DEFAULT.data.map(row => row.id)
    );
  });
});

describe("client-orders — a page or a page size out of range becomes valid (AC-3)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
    observer = observeOrderRequests();
  }, 30000);

  it("setPage(3) sends offset=20", async () => {
    orders.useActions().setPage(3);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("offset")).toBe("20")
    );
    expect(observer.latestParams().get("limit")).toBe("10");
  });

  it("setLimit(25) on page 3 adopts the new limit AND resets offset to 0", async () => {
    orders.useActions().setPage(3);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("offset")).toBe("20")
    );

    orders.useActions().setLimit(25);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("limit")).toBe("25")
    );
    expect(observer.latestParams().get("offset")).toBe("0");
  });

  it("setPage(2) after setLimit(25) sends limit=25&offset=25 — the whole pagination branch on one write", async () => {
    orders.useActions().setLimit(25);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("limit")).toBe("25")
    );

    orders.useActions().setPage(2);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("offset")).toBe("25")
    );
    expect(observer.latestParams().get("limit")).toBe("25");
  });

  it.each([0, -2])("setPage(%s) becomes page one", async page => {
    orders.useActions().setPage(2);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("offset")).toBe("10")
    );

    orders.useActions().setPage(page);
    await vi.waitFor(() =>
      expect(orders.useContext().query.value.pagination?.offset).toBe(0)
    );
    expect(orders.useContext().pagination.value?.page).toBe(1);
  });

  it("setLimit(0) sends limit=1, never the platform's all-rows value", async () => {
    orders.useActions().setLimit(0);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("limit")).toBe("1")
    );
    expect(
      observer
        .all()
        .some(request => new URL(request.url).searchParams.get("limit") === "0")
    ).toBe(false);
  });

  it("a raw write of pagination: { limit: 0, offset: 0 } sends no request and sets error (F21a, schema minimum: 1)", async () => {
    const sent = observer.all().length;

    orders
      .useInternals()
      .query.setCriteria({ pagination: { limit: 0, offset: 0 } });

    await settle(50);
    expect(observer.all().length).toBe(sent);
    expect(orders.useContext().error.value).toBeTruthy();
  });
});

describe("client-orders — a client with no orders sees an empty history (AC-3)", () => {
  it("the empty-history construction publishes isEmpty, no error and a zero total", async () => {
    await seedClientSession();
    server?.use(
      http.get("*/api/invoices", () =>
        HttpResponse.json({ ...DEFAULT, data: [], total: 0 })
      )
    );

    orders = useClientOrders().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(orders.useMeta().isLoading.value).toBe(false)
    );

    expect(orders.useMeta().isEmpty.value).toBe(true);
    expect(orders.useMeta().hasError.value).toBe(false);
    expect(orders.useContext().pagination.value?.total).toBe(0);
    expect(orders.useMeta().hasNextPage.value).toBe(false);
  });
});
