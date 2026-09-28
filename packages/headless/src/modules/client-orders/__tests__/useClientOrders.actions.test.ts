// -----------------------------------------------------------------------------
/**
 * @fileoverview useClientOrders — each write composes a fresh filters object
 * (unit, AC-7, AC-11, D-7)
 *
 * ## Job To Be Done
 * Prove design 8.3 write rules D-7: each module writer passes the raw setter
 * a fresh `filters` object, never the intent it was given and never the one
 * a previous write passed, and a later writer keeps the leaves an earlier one
 * wrote on other columns.
 *
 * ## What Breaks If These Fail
 * Two writes share one object, so a later setter changes an earlier model in
 * place, and the criteria key never changes: the history stops reloading.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toRaw } from "vue";
import { useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import type { ClientOrdersFilterModel, ClientOrdersQueryModel } from "..";

// -----------------------------------------------------------------------------

let orders: ReturnType<ReturnType<typeof useClientOrders>["as"]>;
let setCriteria: ReturnType<typeof vi.spyOn>;

const writes = (): ClientOrdersFilterModel[] =>
  setCriteria.mock.calls.map(
    call => (call[0] as ClientOrdersQueryModel).filters!
  );

beforeEach(() => {
  vi.useFakeTimers();
  orders = useClientOrders().as(ScopeActorTypes.SELF);
  setCriteria = vi.spyOn(orders.useInternals().query, "setCriteria");
});

afterEach(() => {
  setCriteria.mockRestore();
  vi.useRealTimers();
});

describe("useClientOrders — each write composes a fresh filters object (AC-7, D-7)", () => {
  it("two writes share no filters object, and neither changes the live model in place", () => {
    const liveBefore = orders.useContext().query.value.filters;
    const snapshotBefore = structuredClone(toRaw(liveBefore));
    orders.useActions().filters.status(["invoice_paid"]);

    const liveBetween = orders.useContext().query.value.filters;
    const snapshotBetween = structuredClone(toRaw(liveBetween));
    orders.useActions().filters.status(["invoice_overdue"]);

    const [first, second] = writes();
    expect(second).not.toBe(first);
    expect(toRaw(first)).not.toBe(toRaw(liveBefore));
    expect(toRaw(second)).not.toBe(toRaw(liveBetween));
    expect(toRaw(liveBefore)).toEqual(snapshotBefore);
    expect(toRaw(liveBetween)).toEqual(snapshotBetween);
    expect(first["status.code"]).toEqual({ eq: ["invoice_paid"] });
    expect(second["status.code"]).toEqual({ eq: ["invoice_overdue"] });
  });

  it("filterBy passes a copy of its intent, never the intent itself", () => {
    const intent: ClientOrdersFilterModel = { number: { eq: "QA-1" } };
    orders.useActions().filterBy(intent);

    expect(writes()[0]).not.toBe(intent);
    expect(intent).toEqual({ number: { eq: "QA-1" } });
  });

  it("a named setter never passes the live model object back", () => {
    orders.useActions().filters.total(10, "gte");
    expect(writes()[0]).not.toBe(orders.useContext().query.value.filters);
  });
});
