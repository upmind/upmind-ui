// -----------------------------------------------------------------------------
/**
 * @module tests/list-controls-dispatch
 * @description The control band's action seam: COLLECTION_SEARCH / COLLECTION_SORT
 * ride `dispatchMockAction` to the SAME collection instance the selectors read,
 * resolved with the live route context — so a dispatched search changes what
 * the panel renders. The payload splits at ITS first colon and the tail keeps
 * any further ones; an empty tail clears; an unknown collection id, a
 * colon-less payload and a seedless shape stay silent, per the seam's contract.
 *
 * Paired blind with tests/list-controls-dispatch.must-fail.patch.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { map, minBy } from "lodash-es";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  PAGED_COLLECTION_ID,
  invoicesCollection,
  pagedCollectionHandle,
  ticketsCollection
} from "~/portal/mock/collection-defs";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const TICKET_SEARCH = mockActionValue(
  MOCK_ACTION.COLLECTION_SEARCH,
  PAGED_COLLECTION_ID.TICKETS
);
const INVOICE_SORT = mockActionValue(
  MOCK_ACTION.COLLECTION_SORT,
  PAGED_COLLECTION_ID.INVOICES
);

describe("list-controls dispatch — the collection verbs refine the live panel", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  afterEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("a search narrows the instance the panel's own handle resolves", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { pagination, appliedQuery } = pagedCollectionHandle(
      PAGED_COLLECTION_ID.TICKETS,
      data,
      {}
    ).useContext();

    const before = pagination.value.total;
    expect(before).toBeGreaterThan(1);

    // "Archive Storage upload errors" is the only open ticket carrying it.
    dispatchMockAction(data, {}, `${TICKET_SEARCH}:archive`);
    expect(appliedQuery.value).toBe("archive");
    expect(pagination.value.total).toBe(1);

    dispatchMockAction(data, {}, `${TICKET_SEARCH}:`);
    expect(appliedQuery.value).toBe("");
    expect(pagination.value.total).toBe(before);
  });

  it("keys the instance by the route context — a search stays on its own tab", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const closed = pagedCollectionHandle(PAGED_COLLECTION_ID.TICKETS, data, {
      status: "closed"
    }).useContext();
    const active = pagedCollectionHandle(
      PAGED_COLLECTION_ID.TICKETS,
      data,
      {}
    ).useContext();

    dispatchMockAction(
      data,
      { status: "closed" },
      `${TICKET_SEARCH}:analytics`
    );

    expect(closed.appliedQuery.value).toBe("analytics");
    expect(active.appliedQuery.value).toBe("");
  });

  it("a sort reorders page 1, and an empty tail returns to the opening order", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { data: rows, activeSort } = invoicesCollection
      .resolve(data, {})
      .useContext();

    // The panel opens newest-first, so that IS the order it returns to.
    const openingOrder = map(rows.value, invoice => invoice.id);
    const oldest = minBy(data.invoices, invoice => invoice.issuedDate);
    expect(activeSort.value).toBe("newest");

    dispatchMockAction(data, {}, `${INVOICE_SORT}:oldest`);
    expect(activeSort.value).toBe("oldest");
    expect(rows.value[0]?.issuedDate).toBe(oldest?.issuedDate);

    dispatchMockAction(data, {}, `${INVOICE_SORT}:`);
    expect(activeSort.value).toBe("newest");
    expect(map(rows.value, invoice => invoice.id)).toEqual(openingOrder);
  });

  it("an unknown collection id, a colon-less payload and a bare verb are quiet no-ops", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { appliedQuery } = ticketsCollection.resolve(data, {}).useContext();

    expect(
      dispatchMockAction(
        data,
        {},
        `${MOCK_ACTION.COLLECTION_SEARCH}:no-such-panel:archive`
      )
    ).toBeUndefined();
    // No colon inside the payload: it names no collection, so nothing runs.
    expect(
      dispatchMockAction(data, {}, `${MOCK_ACTION.COLLECTION_SEARCH}:tickets`)
    ).toBeUndefined();
    expect(
      dispatchMockAction(data, {}, MOCK_ACTION.COLLECTION_SORT)
    ).toBeUndefined();

    expect(appliedQuery.value).toBe("");
  });

  it("a seedless shape's refinement is a no-op, like every other mutation", () => {
    expect(
      dispatchMockAction(undefined, {}, `${TICKET_SEARCH}:archive`)
    ).toBeUndefined();
  });

  it("keeps the tail's own colons — the search text is whatever follows the id", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { appliedQuery } = ticketsCollection.resolve(data, {}).useContext();

    dispatchMockAction(data, {}, `${TICKET_SEARCH}:a:b:c`);
    expect(appliedQuery.value).toBe("a:b:c");
  });
});
