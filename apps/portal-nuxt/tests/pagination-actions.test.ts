// -----------------------------------------------------------------------------
/**
 * @module tests/pagination-actions
 * @description The pager's action seam (plan §2): PAGE_NEXT/PAGE_PREV verbs
 * ride `dispatchMockAction` to the SAME collection instance the selectors
 * read, so a dispatched page turn changes what the panel renders. Bounds
 * no-op (plan R11); seedless shapes and unknown ids stay silent, per the
 * action seam's contract.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  PAGED_COLLECTION_ID,
  pagedCollectionHandle
} from "~/portal/mock/collection-defs";
import { MOCK_PAGE_LIMIT } from "~/portal/mock/collections";
import { invoiceItems } from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const PAID_NEXT = mockActionValue(
  MOCK_ACTION.PAGE_NEXT,
  PAGED_COLLECTION_ID.INVOICES
);
const PAID_PREV = mockActionValue(
  MOCK_ACTION.PAGE_PREV,
  PAGED_COLLECTION_ID.INVOICES
);

describe("pagination actions — the PAGE verbs turn the panel's page", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("PAGE_NEXT advances the collection the selector renders", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    const { pagination } = pagedCollectionHandle(
      PAGED_COLLECTION_ID.INVOICES,
      data,
      {}
    ).useContext();

    // A full first page, and more than one page behind it.
    expect(invoiceItems(data)).toHaveLength(MOCK_PAGE_LIMIT);
    expect(pagination.value.pages).toBeGreaterThan(1);

    dispatchMockAction(data, {}, PAID_NEXT);
    expect(pagination.value.page).toBe(2);
    expect(invoiceItems(data)).toHaveLength(
      Math.min(MOCK_PAGE_LIMIT, pagination.value.total - MOCK_PAGE_LIMIT)
    );
  });

  it("the verbs no-op at the bounds (R11)", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { pagination } = pagedCollectionHandle(
      PAGED_COLLECTION_ID.INVOICES,
      data,
      {}
    ).useContext();

    dispatchMockAction(data, {}, PAID_PREV);
    expect(pagination.value.page).toBe(1);

    const lastPage = pagination.value.pages;
    for (let turn = 0; turn < lastPage + 2; turn += 1) {
      dispatchMockAction(data, {}, PAID_NEXT);
    }
    expect(pagination.value.page).toBe(lastPage);
  });

  it("an unknown paged id and a bare verb stay silent no-ops", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    expect(
      dispatchMockAction(data, {}, `${MOCK_ACTION.PAGE_NEXT}:no-such-panel`)
    ).toBeUndefined();
    expect(dispatchMockAction(data, {}, MOCK_ACTION.PAGE_NEXT)).toBeUndefined();
  });

  it("a seedless shape's page turn is a no-op, like every other mutation", () => {
    expect(dispatchMockAction(undefined, {}, PAID_NEXT)).toBeUndefined();
  });
});
