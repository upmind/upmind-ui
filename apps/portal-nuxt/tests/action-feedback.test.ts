// -----------------------------------------------------------------------------
/**
 * @module tests/action-feedback
 * @description Plan R4: feedback is the DISPATCHER's concern, not a module's.
 * A write answers with a toast, a destructive one answers with a confirmation
 * whose `then` is re-dispatched through the same door, a navigation answers
 * with a destination and says nothing, and an unrecognised verb stays silent.
 * The shell's half of the contract is `useConfirmDialog`, tested as the unit
 * it is — mounting it would need the Nuxt runtime the mock layer never has.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { includes, values } from "lodash-es";
import type { MockActionConfirm } from "~/portal/mock/actions";
import { useConfirmDialog } from "~/composables/useConfirmDialog";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const NO_CONTEXT = {};

describe("action feedback — R4: the dispatcher names what happens next", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    useConfirmDialog().cancel();
  });

  it("a navigation is a destination and nothing else — no toast, no dialog", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.NAVIGATE, "/billing/invoices")
    );

    expect(result?.to).toBe("/billing/invoices");
    expect(result?.toast).toBeUndefined();
    expect(result?.confirm).toBeUndefined();
  });

  it("placing an order both tells the client and moves them on", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const item = data.catalogue[0];

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.PLACE_ORDER, item?.id)
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(result?.to).toBeTruthy();
  });

  it("a verb the seam does not know stays silent", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    expect(dispatchMockAction(data, NO_CONTEXT, "sing:loudly")).toBeUndefined();
    expect(dispatchMockAction(data, NO_CONTEXT, "sing")).toBeUndefined();
    expect(includes(values(MOCK_ACTION), "sing")).toBe(false);
  });
});

describe("confirm dialog — the shell holds one confirmation until it is answered", () => {
  const CONFIRM: MockActionConfirm = {
    title: "Remove this card?",
    description: "You can add another at any time.",
    actionLabel: "Remove",
    destructive: true,
    then: "remove-payment-method-confirmed:pm-1"
  };

  beforeEach(() => {
    useConfirmDialog().cancel();
  });

  it("opens on a request and holds the confirmation it was handed", () => {
    const { pending, request } = useConfirmDialog();
    expect(pending.value).toBeUndefined();

    request(CONFIRM, vi.fn());

    expect(pending.value).toEqual(CONFIRM);
  });

  it("accepting runs the held verb through the caller that raised it, and closes", () => {
    const { pending, request, accept } = useConfirmDialog();
    const run = vi.fn();
    request(CONFIRM, run);

    accept();

    expect(run).toHaveBeenCalledWith(CONFIRM.then);
    expect(pending.value).toBeUndefined();
  });

  it("cancelling closes and reports nothing back", () => {
    const { pending, request, accept, cancel } = useConfirmDialog();
    const run = vi.fn();
    request(CONFIRM, run);

    cancel();
    accept();

    expect(run).not.toHaveBeenCalled();
    expect(pending.value).toBeUndefined();
  });

  it("survives the dialog closing itself before it emits — the verb still runs once", () => {
    const { request, accept, close } = useConfirmDialog();
    const run = vi.fn();
    request(CONFIRM, run);

    close();
    accept();
    accept();

    expect(run).toHaveBeenCalledTimes(1);
  });
});
