// -----------------------------------------------------------------------------
/**
 * @module tests/order-complete
 * @description Gap doc §2 Listing, order-complete state (plan Phase 3): legacy
 * threw a confetti MODAL after an order; the mock lands the client back on the
 * group listing with the order named in the query, and the listing raises a
 * band (plan R9's `announcement-bar` route). The band is therefore ROUTE
 * state, not stored state — which is what makes the unknown-order case worth
 * grading: a query anyone can type must render nothing rather than a band
 * about an order that does not exist.
 *
 * The order is found by DIFFING the dataset either side of the write, so the
 * test never assumes where a new order is filed.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { boundRefId, rowBinding } from "./support/page-config";
import { find, map } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockCatalogueItem,
  MockDataset,
  MockOrder
} from "~/portal/mock/types";
import { productPages } from "~/portal/config/product-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { DATA_REF_ID, resolveDataRef } from "~/portal/mock/data-refs";
import {
  hasOrderComplete,
  orderCompleteAction,
  orderCompleteDismiss,
  orderCompleteMessage
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const ABSENT_ORDER = "no-such-order";

function catalogueItem(data: MockDataset): MockCatalogueItem {
  const item = data.catalogue[0];
  if (item === undefined) throw new Error("seed carries no catalogue item");
  return item;
}

/** Places the order and hands back both the receipt and the row it created. */
function placeOrder(data: MockDataset, item: MockCatalogueItem) {
  const before = map(data.orders, "id");
  const result = dispatchMockAction(
    data,
    { groupSlug: item.groupSlug },
    mockActionValue(MOCK_ACTION.PLACE_ORDER, item.id)
  );
  const created = find(data.orders, order => !before.includes(order.id));
  if (created === undefined) throw new Error("placing the order created none");
  return { result, created };
}

function contextFor(
  item: MockCatalogueItem,
  order?: MockOrder
): DataRouteContext {
  return { groupSlug: item.groupSlug, orderComplete: order?.id };
}

function bandRow() {
  const row = rowBinding(
    productPages()[PAGE_KEY.GROUP_LISTING],
    DATA_REF_ID.ORDER_COMPLETE_MESSAGE
  );
  if (row === undefined) throw new Error("no listing row raises the band");
  return row;
}

describe("placing an order lands back on the listing, naming what was placed", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("returns the group's own path carrying the new order's id", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const item = catalogueItem(data);

    const { result, created } = placeOrder(data, item);

    expect(result?.to).toBe(`/${item.groupSlug}?orderComplete=${created.id}`);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });
});

describe("the listing's band is raised by the route, and only for a real order", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("stands only while the query names an order the client actually has", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const item = catalogueItem(data);
    const { created } = placeOrder(data, item);
    const row = bandRow();

    expect(boundRefId(row, "visible")).toBe(DATA_REF_ID.HAS_ORDER_COMPLETE);
    expect(hasOrderComplete(data, contextFor(item, created))).toBe(true);
    expect(resolveDataRef(row.visible, data, contextFor(item, created))).toBe(
      true
    );
    expect(hasOrderComplete(data, contextFor(item))).toBe(false);
  });

  it("names the order it is congratulating the client on", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const item = catalogueItem(data);
    const { created } = placeOrder(data, item);

    expect(orderCompleteMessage(data, contextFor(item, created))).toContain(
      created.number
    );
  });

  it("points at that order's own page, and dismisses back to the plain listing", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const item = catalogueItem(data);
    const { created } = placeOrder(data, item);

    expect(orderCompleteAction(data, contextFor(item, created))?.value).toBe(
      mockActionValue(MOCK_ACTION.NAVIGATE, `/billing/orders/${created.id}`)
    );
    expect(orderCompleteDismiss(data, contextFor(item, created))).toBe(
      mockActionValue(MOCK_ACTION.NAVIGATE, `/${item.groupSlug}`)
    );
  });

  it("renders nothing at all for a query naming an order that does not exist", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const item = catalogueItem(data);
    const invented: DataRouteContext = {
      groupSlug: item.groupSlug,
      orderComplete: ABSENT_ORDER
    };
    const row = bandRow();

    expect(hasOrderComplete(data, invented)).toBe(false);
    expect(resolveDataRef(row.visible, data, invented)).toBe(false);
    expect(orderCompleteMessage(data, invented)).toBe("");
    expect(orderCompleteAction(data, invented)).toBeUndefined();
  });
});
