// -----------------------------------------------------------------------------
/**
 * @fileoverview useOrders — each module writer re-asserts the forced
 * category (unit, AC-12, ADR-032 decision 5, D-3)
 *
 * ## Job To Be Done
 * Prove the composable side of D-3: `filterBy`, `setCriteria`, each named
 * setter and the search pass criteria to the raw setter `useInternals().query.setCriteria`
 * whose `category.slug` is `"new_contract"`, for an intent with no category
 * leaf and for an intent with `"renewal"`, and for each setter while the live
 * model holds `"renewal"`. The parser `const` is the second
 * guard, for raw writes only, and `orders.forced-category` proves it.
 *
 * ## What Breaks If These Fail
 * A module write relies on the parser alone, so a parser change lets another
 * invoice category into the placed-order history.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import type { OrdersFilterModel, OrdersQueryModel } from "..";

// -----------------------------------------------------------------------------

const RENEWAL = {
  "category.slug": "renewal"
} as unknown as OrdersFilterModel;

let orders: ReturnType<ReturnType<typeof useOrders>["as"]>;
let setCriteria: ReturnType<typeof vi.spyOn>;

const lastWrite = (): OrdersQueryModel =>
  setCriteria.mock.calls.at(-1)?.[0] as OrdersQueryModel;

beforeEach(() => {
  vi.useFakeTimers();
  orders = useOrders().as(ScopeActorTypes.SELF);
  setCriteria = vi.spyOn(orders.useInternals().query, "setCriteria");
});

afterEach(() => {
  setCriteria.mockRestore();
  vi.useRealTimers();
});

describe("useOrders — the module writers re-assert the forced category (AC-12)", () => {
  it('the object that filterBy passes to the raw setter holds category.slug equal to "new_contract" for an intent with "renewal"', () => {
    orders.useActions().filterBy({ ...RENEWAL, number: { eq: "QA-1" } });
    expect(lastWrite().filters?.["category.slug"]).toBe("new_contract");
  });

  it("filterBy with no category leaf adds category.slug new_contract", () => {
    orders.useActions().filterBy({ number: { eq: "QA-1" } });
    expect(lastWrite().filters?.["category.slug"]).toBe("new_contract");
  });

  it('the object that setCriteria passes to the raw setter holds category.slug equal to "new_contract" for a filters intent with "renewal"', () => {
    orders
      .useActions()
      .setCriteria({ filters: { ...RENEWAL, number: { eq: "QA-1" } } });
    expect(lastWrite().filters?.["category.slug"]).toBe("new_contract");
    expect(lastWrite().filters?.number).toEqual({ eq: "QA-1" });
  });

  it("setCriteria with a filters intent that holds no category leaf adds category.slug new_contract", () => {
    orders.useActions().setCriteria({ filters: { number: { eq: "QA-1" } } });
    expect(lastWrite().filters?.["category.slug"]).toBe("new_contract");
  });

  it.each([
    ["status", () => orders.useActions().filters.status(["invoice_paid"])],
    ["total", () => orders.useActions().filters.total(10, "gte")],
    [
      "dateCreated",
      () => orders.useActions().filters.dateCreated("-7_days", "after")
    ],
    [
      "datePaid",
      () => orders.useActions().filters.datePaid("2026-09-01 00:00:00", "gte")
    ],
    ["itemName", () => orders.useActions().filters.itemName("Hosting", "like")],
    [
      "categoryName",
      () => orders.useActions().filters.categoryName("Hosting", "eq")
    ],
    [
      "serviceIdentifier",
      () => orders.useActions().filters.serviceIdentifier("host", "neq")
    ],
    [
      "query",
      () => {
        orders.useActions().filters.query("QA-1");
        vi.advanceTimersByTime(250);
      }
    ]
  ] as const)(
    "the %s setter passes category.slug new_contract, while the live model holds renewal",
    (_setter, write) => {
      setCriteria.mockImplementation(() => undefined);
      // The raw setter is stubbed, so the parser const never restores the leaf.
      const live = orders.useContext().query.value.filters as Record<
        string,
        unknown
      >;
      live["category.slug"] = "renewal";
      try {
        write();
      } finally {
        live["category.slug"] = "new_contract";
      }

      expect(setCriteria).toHaveBeenCalled();
      expect(lastWrite().filters?.["category.slug"]).toBe("new_contract");
    }
  );
});
