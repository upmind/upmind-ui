// -----------------------------------------------------------------------------
/**
 * @module tests/form-dialog-seam
 * @description Plan F2: a row action may answer with a FORM instead of a
 * mutation. `open-form:<formId>:<entityId?>` writes nothing and names a
 * registered form; the registry turns that name into everything the `form`
 * module is fed; the shell's one dialog holds it; and the runner closes it
 * only on the open form's OWN answer — a success on that form's submit verb,
 * never on any success that happens to land while it is up.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { cloneDeep, find } from "lodash-es";
import type { MockDataset, MockPaymentMethod } from "~/portal/mock/types";
import { useFormDialog } from "~/composables/useFormDialog";
import { MOCK_ACTION, dispatchMockAction } from "~/portal/mock/actions";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const NO_CONTEXT = {};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function paymentMethod(
  data: MockDataset,
  isDefault: boolean
): MockPaymentMethod {
  const method = find(data.paymentMethods, { isDefault });
  if (method === undefined) throw new Error("seed carries no such method");
  return method;
}

function openFormValue(id: string, entityId?: string): string {
  if (entityId === undefined) return `${MOCK_ACTION.OPEN_FORM}:${id}`;
  return `${MOCK_ACTION.OPEN_FORM}:${id}:${entityId}`;
}

describe("form dialog seam — F2: the action names a form, the registry builds it", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    useFormDialog().close();
  });

  it("an unregistered form id answers nothing at all", () => {
    const data = hostgrid();

    expect(
      dispatchMockAction(data, NO_CONTEXT, openFormValue("not-a-form", "pm-1"))
    ).toBeUndefined();
    expect(
      dispatchMockAction(data, NO_CONTEXT, MOCK_ACTION.OPEN_FORM)
    ).toBeUndefined();
  });

  it("a malformed JSON tail answers nothing and writes nothing", () => {
    const data = hostgrid();
    const card = paymentMethod(data, false);
    const before = cloneDeep(data);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      `${MOCK_ACTION.PAYMENT_METHOD_RENAME}:${card.id}:{"displayName":`
    );

    expect(result).toBeUndefined();
    expect(data).toEqual(before);
  });
});
