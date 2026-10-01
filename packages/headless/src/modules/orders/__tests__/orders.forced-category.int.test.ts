// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the forced category survives each writer
 * (AC-12, D-3)
 *
 * ## Job To Be Done
 * Prove `filter[category.slug]=new_contract` is on the latest request after
 * each writer of design 8.3: `filterBy`, a named setter, the search, a raw
 * write with no category leaf, and a raw write that holds
 * `category.slug: "renewal"`. The composable writers re-assert the leaf, and
 * the parser `const` guards the raw setter; the raw write is not refused, so
 * `error` stays unset. Each write adds a recorded filter, so each one sends a
 * new request and the wire is observed, not a cached key.
 *
 * ## What Breaks If These Fail
 * A write drops or replaces the forced category, and orders of another
 * invoice category leak into the client's placed-order history.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  observeOrderRequests,
  probeName,
  recordedParam,
  seedClientSession
} from "./orders.int-helpers";
import "./setup.integration";
import type { OrdersFilterModel } from "..";

// -----------------------------------------------------------------------------

const NUMBER = recordedParam(
  "get-invoices-case-orders-search",
  "filter[number|eq]"
);
const ITEM_NAME = recordedParam(
  probeName("products.product.name", "eq"),
  "filter[products.product.name|eq]"
);
const RENEWAL = {
  "category.slug": "renewal"
} as unknown as OrdersFilterModel;

async function bootSelfCollection() {
  await seedClientSession();
  const orders = useOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

let orders: Awaited<ReturnType<typeof bootSelfCollection>>;
let observer: ReturnType<typeof observeOrderRequests>;

describe("orders — filter[category.slug]=new_contract survives each writer (AC-12, D-3)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
    observer = observeOrderRequests();
  }, 30000);

  it.each([
    [
      "filterBy with no category leaf",
      () => orders.useActions().filterBy({ number: { eq: NUMBER } }),
      "filter[number|eq]"
    ],
    [
      "filterBy with category.slug renewal",
      () =>
        orders.useActions().filterBy({ ...RENEWAL, number: { eq: NUMBER } }),
      "filter[number|eq]"
    ],
    [
      "the itemName setter",
      () => orders.useActions().filters.itemName(ITEM_NAME, "eq"),
      "filter[products.product.name|eq]"
    ],
    [
      "the search",
      () => orders.useActions().filters.query(NUMBER),
      "filter[number|eq]"
    ],
    [
      "the actions setCriteria writer the playground filter bar drives",
      () =>
        orders
          .useActions()
          .setCriteria({ filters: { ...RENEWAL, number: { eq: NUMBER } } }),
      "filter[number|eq]"
    ],
    [
      "a raw write with no category leaf",
      () =>
        orders
          .useInternals()
          .query.setCriteria({ filters: { number: { eq: NUMBER } } }),
      "filter[number|eq]"
    ]
  ] as const)("survives %s", async (_writer, write, key) => {
    write();

    await vi.waitFor(
      () => expect(observer.latestParams().has(key)).toBe(true),
      {
        timeout: 2000
      }
    );
    expect(observer.latestParams().getAll("filter[category.slug]")).toEqual([
      "new_contract"
    ]);
    expect(orders.useContext().error.value).toBeUndefined();
  });

  it("a raw write that HOLDS category.slug renewal is not refused — the parser const overwrites it, and error stays unset", async () => {
    orders.useInternals().query.setCriteria({
      filters: { ...RENEWAL, number: { eq: NUMBER } }
    });

    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[number|eq]")).toBe(NUMBER)
    );
    expect(observer.latestParams().getAll("filter[category.slug]")).toEqual([
      "new_contract"
    ]);
    expect(orders.useContext().query.value.filters?.["category.slug"]).toBe(
      "new_contract"
    );
    expect(orders.useContext().error.value).toBeUndefined();
  });
});
