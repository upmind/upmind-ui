// -----------------------------------------------------------------------------
/**
 * @module tests/delegate-panels-paged
 * @description The three panels that list an account's delegates are paged.
 *
 * All three mapped `data.delegates` raw, with no collection behind them: the
 * ticket thread rendered 24 rows in one column, and neither product panel had
 * a search box, a filter or a pager. `/account/delegates` had all three
 * already, which is what made the omission visible.
 *
 * Each panel gets its OWN definition keyed on the route's entity rather than
 * sharing the account page's instance. That is the part worth pinning: a
 * shared instance would move the account page's page whenever a panel moved
 * its own, and move every product's together (`collections.ts` `contextKey`).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { every, find, map, size } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import { MOCK_ACTION, dispatchMockAction } from "~/portal/mock/actions";
import {
  PAGED_COLLECTION_ID,
  pagedCollectionHandle
} from "~/portal/mock/collection-defs";
import { MOCK_PAGE_LIMIT } from "~/portal/mock/collections";
import {
  CONTROLS_REF_BY_ITEMS_REF,
  DATA_REF_ID,
  PAGER_REF_BY_ITEMS_REF
} from "~/portal/mock/data-refs";
import {
  accountDelegateItems,
  productDelegateAccessItems,
  productDelegateItems,
  ticketDelegateItems
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const data = (): MockDataset => useMockData(MOCK_DATASET_ID.HOSTGRID);

/** A product and a ticket to hang the panels off; each panel keys on its own. */
function positions(set: MockDataset) {
  const product = set.products[0];
  const ticket = set.tickets[0];
  if (product === undefined || ticket === undefined) {
    throw new Error("seed lacks a product or a ticket");
  }
  return {
    product: { productId: product.id, groupSlug: product.groupSlug },
    ticket: { entityId: ticket.id }
  };
}

describe("every delegate panel shows a page, not the whole account", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("has more delegates than one page holds, or this proves nothing", () => {
    expect(size(data().delegates)).toBeGreaterThan(MOCK_PAGE_LIMIT);
  });

  it.each([
    [
      "the ticket thread's picker",
      (s: MockDataset) => ticketDelegateItems(s, positions(s).ticket)
    ],
    [
      "the product's delegate-access panel",
      (s: MockDataset) => productDelegateAccessItems(s, positions(s).product)
    ],
    [
      "the product's delegates area",
      (s: MockDataset) => productDelegateItems(s, positions(s).product)
    ]
  ])("caps %s at one page", (_case, read) => {
    const set = data();
    const rows = read(set);

    expect(size(rows)).toBe(MOCK_PAGE_LIMIT);
    expect(
      every(rows, row => find(set.delegates, { id: row.id }) !== undefined)
    ).toBe(true);
  });
});

describe("each panel carries its own controls and its own pager", () => {
  it.each([
    DATA_REF_ID.TICKET_DELEGATE_ITEMS,
    DATA_REF_ID.PRODUCT_DELEGATE_ACCESS_ITEMS,
    DATA_REF_ID.PRODUCT_DELEGATE_ITEMS
  ])("maps %s to a pager and a control band", itemsRef => {
    expect(PAGER_REF_BY_ITEMS_REF[itemsRef]).toBeDefined();
    expect(CONTROLS_REF_BY_ITEMS_REF[itemsRef]).toBeDefined();
  });
});

describe("paging one panel leaves the others where they were", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("does not drag the account page along with a panel", () => {
    const set = data();
    const where = positions(set);
    const pageOf = (id: string, context: Record<string, string>) =>
      pagedCollectionHandle(id, set, context).useContext().pagination.value
        .page;

    dispatchMockAction(
      set,
      where.ticket,
      `${MOCK_ACTION.PAGE_NEXT}:${PAGED_COLLECTION_ID.TICKET_DELEGATES}`
    );

    expect(pageOf(PAGED_COLLECTION_ID.TICKET_DELEGATES, where.ticket)).toBe(2);
    // The account page and both product panels stay on page one — a shared
    // instance would have moved every one of them.
    expect(pageOf(PAGED_COLLECTION_ID.ACCOUNT_DELEGATES, {})).toBe(1);
    expect(
      pageOf(PAGED_COLLECTION_ID.PRODUCT_DELEGATE_ACCESS, where.product)
    ).toBe(1);
    expect(size(accountDelegateItems(set))).toBe(MOCK_PAGE_LIMIT);
  });

  it("keeps one product's panel off another product's page", () => {
    const set = data();
    const [first, second] = set.products;
    if (first === undefined || second === undefined) {
      throw new Error("seed lacks two products");
    }
    const pageOf = (productId: string) =>
      pagedCollectionHandle(PAGED_COLLECTION_ID.PRODUCT_DELEGATE_ACCESS, set, {
        productId
      }).useContext().pagination.value.page;

    dispatchMockAction(
      set,
      { productId: first.id },
      `${MOCK_ACTION.PAGE_NEXT}:${PAGED_COLLECTION_ID.PRODUCT_DELEGATE_ACCESS}`
    );

    expect(pageOf(first.id)).toBe(2);
    expect(pageOf(second.id)).toBe(1);
  });
});

describe("the rows still say what they said before they were paged", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("keeps every picker row's share action", () => {
    const set = data();
    const rows = ticketDelegateItems(set, positions(set).ticket);

    expect(size(rows)).toBeGreaterThan(0);
    expect(every(rows, row => row.action?.label === "Give access")).toBe(true);
    expect(every(map(rows, "title"), title => title !== "")).toBe(true);
  });
});
