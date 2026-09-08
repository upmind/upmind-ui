// -----------------------------------------------------------------------------
/**
 * @module tests/product-lifecycle-actions
 * @description Gap doc §2 "Billing tab" (X6): the six lifecycle controls
 * legacy put on a product — end the trial early, call off a cancellation,
 * stop an auto-expiry, turn automatic renewal over, and raise the renewal
 * invoice by hand. Each is graded through the ONE door (`dispatchMockAction`),
 * because the confirmation half is the dispatcher's (plan R4) and a facade
 * receipt alone cannot prove a destructive verb asked first.
 *
 * The subjects are found by their own DATA — a trial still ahead, a lodged
 * cancellation, a standing auto-expiry, a renewal the brand has locked — so a
 * seed that stops carrying one fails loudly here rather than quietly skipping
 * the branch it was meant to prove.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  CancellationRequestStatusCodes,
  InvoiceStatus,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import { filter, find, map } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockProduct } from "~/portal/mock/types";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  MOCK_RECEIPT_REASON,
  useMockContractProduct
} from "~/portal/mock/facades";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const NO_CONTEXT: DataRouteContext = {};

/** Success is reserved for a write that happened; a refusal wears one of these. */
const REFUSAL_INTENTS = [MOCK_TOAST_INTENT.WARNING, MOCK_TOAST_INTENT.ERROR];

const TODAY = new Date().toISOString().slice(0, 10);

function seeded(
  data: MockDataset,
  trait: string,
  matches: (product: MockProduct) => boolean
): MockProduct {
  const product = find(data.products, matches);
  if (product === undefined) throw new Error(`seed carries no ${trait}`);
  return product;
}

function trialAhead(data: MockDataset): MockProduct {
  return seeded(
    data,
    "product on a trial still ahead",
    product =>
      product.trialEndsAt !== undefined &&
      Date.parse(product.trialEndsAt) > Date.now()
  );
}

function unpaidFor(data: MockDataset, productId: string) {
  return filter(
    data.invoices,
    invoice =>
      invoice.productId === productId &&
      InvoiceStatusGroups.UNPAID.includes(invoice.status)
  );
}

function dispatch(data: MockDataset, value: string) {
  return dispatchMockAction(data, NO_CONTEXT, value);
}

/** Runs the asking half and the accepted half — a destructive verb's whole journey. */
function confirmAndAccept(data: MockDataset, value: string) {
  const asked = dispatch(data, value);
  const then = asked?.confirm?.then;
  if (then === undefined) throw new Error(`${value} did not ask first`);
  return { asked, accepted: dispatch(data, then) };
}

function toastText(toast: { title: string; description?: string }): string {
  return `${toast.title} ${toast.description ?? ""}`;
}

describe("end trial — the client brings the first charge forward", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks before it ends anything, and the asking pass moves nothing", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = trialAhead(data);
    const trialWas = product.trialEndsAt;
    const dueWas = product.nextDueDate;

    const result = dispatch(
      data,
      mockActionValue(MOCK_ACTION.END_TRIAL, product.id)
    );

    expect(result?.confirm?.then).toBeTruthy();
    expect(result?.confirm?.actionLabel).toBeTruthy();
    expect(result?.toast).toBeUndefined();
    expect(product.trialEndsAt).toBe(trialWas);
    expect(product.nextDueDate).toBe(dueWas);
  });

  it("the accepted half clears the trial, charges from today, and says so", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = trialAhead(data);

    const { accepted } = confirmAndAccept(
      data,
      mockActionValue(MOCK_ACTION.END_TRIAL, product.id)
    );

    expect(product.trialEndsAt).toBeUndefined();
    expect(product.nextDueDate?.slice(0, 10)).toBe(TODAY);
    expect(accepted?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(accepted?.confirm).toBeUndefined();
  });

  it("refuses a product that is on no trial, and never asks", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = seeded(
      data,
      "product on no trial",
      candidate => candidate.trialEndsAt === undefined
    );
    const dueWas = product.nextDueDate;

    const result = dispatch(
      data,
      mockActionValue(MOCK_ACTION.END_TRIAL, product.id)
    );

    expect(result?.confirm).toBeUndefined();
    expect(REFUSAL_INTENTS).toContain(result?.toast?.intent);
    expect(toastText(result?.toast ?? { title: "" })).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOT_IN_TRIAL]
    );
    expect(product.nextDueDate).toBe(dueWas);
  });
});

describe("abort cancellation — legacy's don't-cancel control", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks first, then drops the lodged request entirely", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = seeded(
      data,
      "product with a scheduled future cancellation",
      candidate =>
        candidate.cancellationRequest?.status ===
        CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
    );

    const { asked, accepted } = confirmAndAccept(
      data,
      mockActionValue(MOCK_ACTION.ABORT_CANCELLATION, product.id)
    );

    expect(asked?.toast).toBeUndefined();
    expect(product.cancellationRequest).toBeUndefined();
    expect(accepted?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });
});

describe("disable auto-expire — the product keeps renewing after all", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks first, then clears the expiry AND turns renewal back on", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = seeded(
      data,
      "product with a standing auto-expiry",
      candidate => candidate.autoExpireAt !== undefined
    );

    const { asked, accepted } = confirmAndAccept(
      data,
      mockActionValue(MOCK_ACTION.DISABLE_AUTO_EXPIRE, product.id)
    );

    expect(asked?.toast).toBeUndefined();
    expect(product.autoExpireAt).toBeUndefined();
    expect(product.autoRenew).toBe(true);
    expect(accepted?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });
});

describe("auto-renew — off is destructive, on is not", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("turning it OFF asks first and leaves it on until the answer comes back", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = seeded(
      data,
      "renewing product the brand lets the client stop",
      candidate => candidate.autoRenew && candidate.canDisableAutoRenew
    );

    const asked = dispatch(
      data,
      mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, product.id)
    );

    expect(asked?.confirm?.then).toBeTruthy();
    expect(product.autoRenew).toBe(true);

    const accepted = dispatch(data, asked?.confirm?.then ?? "");

    expect(product.autoRenew).toBe(false);
    expect(accepted?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("turning it back ON just does it, with no question asked", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = seeded(
      data,
      "renewing product the brand lets the client stop",
      candidate => candidate.autoRenew && candidate.canDisableAutoRenew
    );
    confirmAndAccept(
      data,
      mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, product.id)
    );

    const result = dispatch(
      data,
      mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, product.id)
    );

    expect(result?.confirm).toBeUndefined();
    expect(product.autoRenew).toBe(true);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("refuses to stop a renewal the brand has locked, and names why", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = seeded(
      data,
      "product whose renewal the brand has locked",
      candidate => !candidate.canDisableAutoRenew && candidate.autoRenew
    );

    const result = dispatch(
      data,
      mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, product.id)
    );

    expect(result?.confirm).toBeUndefined();
    expect(REFUSAL_INTENTS).toContain(result?.toast?.intent);
    expect(toastText(result?.toast ?? { title: "" })).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.AUTO_RENEW_LOCKED]
    );
    expect(product.autoRenew).toBe(true);
  });
});

describe("create renewal invoice — only for a product that will not renew itself", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("raises an unpaid invoice for this product at this product's price", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = seeded(
      data,
      "renewing product the brand lets the client stop",
      candidate => candidate.autoRenew && candidate.canDisableAutoRenew
    );
    confirmAndAccept(
      data,
      mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, product.id)
    );
    const owedBefore = unpaidFor(data, product.id).length;
    const idsBefore = map(data.invoices, "id");

    const result = dispatch(
      data,
      mockActionValue(MOCK_ACTION.CREATE_RENEWAL_INVOICE, product.id)
    );
    const raised = data.invoices[0];

    expect(idsBefore).not.toContain(raised?.id);
    expect(raised?.productId).toBe(product.id);
    expect(raised?.status).toBe(InvoiceStatus.UNPAID);
    expect(raised?.total.amount).toBe(product.price?.amount);
    expect(raised?.total.currency).toBe(product.price?.currency);
    expect(unpaidFor(data, product.id)).toHaveLength(owedBefore + 1);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("refuses a product that renews itself, and raises nothing", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const product = seeded(
      data,
      "renewing product",
      candidate => candidate.autoRenew
    );
    const countBefore = data.invoices.length;

    const result = dispatch(
      data,
      mockActionValue(MOCK_ACTION.CREATE_RENEWAL_INVOICE, product.id)
    );

    expect(REFUSAL_INTENTS).toContain(result?.toast?.intent);
    expect(data.invoices).toHaveLength(countBefore);
  });
});

describe("the facade half — a lifecycle write on an id the dataset does not hold", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("writes nothing anywhere in the dataset", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const before = map(
      data.products,
      product => `${product.id}:${product.autoRenew}`
    );

    const receipt = useMockContractProduct(data, "no-such-product")
      .useActions()
      .endTrial();

    expect(receipt?.ok ?? false).toBe(false);
    expect(
      map(data.products, product => `${product.id}:${product.autoRenew}`)
    ).toEqual(before);
  });
});
