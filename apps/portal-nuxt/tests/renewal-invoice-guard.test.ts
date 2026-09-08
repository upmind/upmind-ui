// -----------------------------------------------------------------------------
/**
 * @module tests/renewal-invoice-guard
 * @description Legacy raised the next renewal invoice early only where the
 * product would NOT raise it itself. The guard is graded on all three
 * branches through the one action door: a product that renews itself is
 * refused, a one-time purchase that never renews is refused in different
 * words, and a stopped subscription gets exactly one invoice for its own
 * price.
 *
 * The three products are put into their state IN THE TEST rather than found
 * in whatever state the seed happens to ship, so the guard is proven on the
 * condition rather than on a fixture.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  ContractStatusCodes,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import { assign, filter, find, map, size } from "lodash-es";
import type {
  MockDataset,
  MockInvoice,
  MockProduct
} from "~/portal/mock/types";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { MOCK_DATASET_ID, resetMockData } from "~/portal/mock/store";
import { MOCK_BILLING_TYPE } from "~/portal/mock/types";

function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

function seeded(
  data: MockDataset,
  trait: string,
  matches: (product: MockProduct) => boolean
): MockProduct {
  const product = find(data.products, matches);
  if (product === undefined) throw new Error(`seed carries no ${trait}`);
  return product;
}

/** A live subscription with a price, clear of every other renewal guard. */
function subscription(data: MockDataset): MockProduct {
  return seeded(
    data,
    "running subscription priced for renewal",
    product =>
      product.billingType === MOCK_BILLING_TYPE.SUBSCRIPTION &&
      product.status === ContractStatusCodes.ACTIVE &&
      product.price !== undefined &&
      product.cancellationRequest === undefined &&
      product.autoExpireAt === undefined
  );
}

function raise(data: MockDataset, product: MockProduct) {
  return dispatchMockAction(
    data,
    {},
    mockActionValue(MOCK_ACTION.CREATE_RENEWAL_INVOICE, product.id)
  );
}

function toastText(result: {
  toast?: { title: string; description?: string };
}) {
  return `${result.toast?.title ?? ""} ${result.toast?.description ?? ""}`;
}

function invoicesAdded(
  data: MockDataset,
  before: readonly string[]
): MockInvoice[] {
  return filter(data.invoices, invoice => !before.includes(invoice.id));
}

describe("raising the next renewal invoice early", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("refuses a product that raises its own, and says why", () => {
    const data = clone();
    const renewing = subscription(data);
    assign(renewing, { autoRenew: true, pendingProRata: false });
    const before = map(data.invoices, "id");

    const result = raise(data, renewing);

    expect(invoicesAdded(data, before)).toEqual([]);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(toastText(result ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.RENEWS_ITSELF]
    );
  });

  it("refuses a one-time purchase, which has no renewal to bring forward", () => {
    const data = clone();
    const bought = seeded(
      data,
      "one-time purchase",
      product => product.billingType === MOCK_BILLING_TYPE.ONE_TIME
    );
    assign(bought, { autoRenew: false, pendingProRata: false });
    const before = map(data.invoices, "id");

    const result = raise(data, bought);

    expect(invoicesAdded(data, before)).toEqual([]);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(toastText(result ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOT_RENEWABLE]
    );
  });

  it("raises exactly one unpaid invoice, for that product, at its own price", () => {
    const data = clone();
    const stopped = subscription(data);
    assign(stopped, { autoRenew: false, pendingProRata: false });
    const price = stopped.price;
    if (price === undefined)
      throw new Error("the subscription carries no price");
    const before = map(data.invoices, "id");

    const result = raise(data, stopped);
    const raised = invoicesAdded(data, before);

    expect(size(raised)).toBe(1);
    expect(raised[0]?.productId).toBe(stopped.id);
    expect(raised[0]?.total.amount).toBe(price.amount);
    expect(raised[0]?.total.currency).toBe(price.currency);
    expect(raised[0]?.unpaidAmount.amount).toBe(price.amount);
    expect(InvoiceStatusGroups.UNPAID).toContain(raised[0]?.status);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });
});
