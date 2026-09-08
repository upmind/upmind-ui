// -----------------------------------------------------------------------------
/**
 * @module tests/impersonation-flow
 * @description Plan R10 / gap X14: logging in as a child account is a PERSONA
 * SWAP, not a session. Graded through `dispatchMockAction` — the one door —
 * so a facade that swaps the persona without the dispatcher naming the next
 * step, or a ribbon raised with nobody swapped, both fail.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { find } from "lodash-es";
import type { MockChildAccount, MockDataset } from "~/portal/mock/types";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { useMockImpersonation } from "~/portal/mock/impersonation";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const NO_CONTEXT = {};

const CHILD_ACCOUNTS_PATH = "/account/child-accounts";

function relation(data: MockDataset, allowed: boolean): MockChildAccount {
  const row = find(data.childAccounts, { allow_impersonation: allowed });
  if (row === undefined) {
    throw new Error(
      `seed carries no child account with allow_impersonation=${allowed}`
    );
  }
  return row;
}

function loginAs(data: MockDataset, relationId: string) {
  return dispatchMockAction(
    data,
    NO_CONTEXT,
    mockActionValue(MOCK_ACTION.LOGIN_AS_CHILD, relationId)
  );
}

function endImpersonation(data: MockDataset) {
  return dispatchMockAction(
    data,
    NO_CONTEXT,
    mockActionValue(MOCK_ACTION.END_IMPERSONATION)
  );
}

describe("login-as-child — the persona swap (R10)", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    useMockImpersonation().end();
  });
  // Module-level ribbon state: a failed assertion mid-flow would otherwise
  // leave it raised for every later reader.
  afterEach(() => {
    useMockImpersonation().end();
  });

  it("becomes the child, raises the ribbon in the child's name, and lands on the portal home", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const child = relation(data, true);
    const parentName = data.persona.name;
    expect(child.name).not.toBe(parentName);

    const result = loginAs(data, child.id);

    expect(data.persona.name).toBe(child.name);
    expect(data.persona.email).toBe(child.email);
    expect(useMockImpersonation().isImpersonating.value).toBe(true);
    expect(useMockImpersonation().impersonatedName.value).toBe(child.name);
    expect(result?.to).toBe("/");
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(
      `${result?.toast?.title} ${result?.toast?.description ?? ""}`
    ).toContain(child.name);
  });

  it("refuses a child that has not allowed it — no swap, no ribbon, no navigation", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const child = relation(data, false);
    const parentName = data.persona.name;
    const parentEmail = data.persona.email;

    const result = loginAs(data, child.id);

    expect(data.persona.name).toBe(parentName);
    expect(data.persona.email).toBe(parentEmail);
    expect(useMockImpersonation().isImpersonating.value).toBe(false);
    expect(result?.to).toBeUndefined();
    expect(result?.toast).toBeDefined();
    expect(result?.toast?.intent).not.toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("ending it restores the parent and returns to the child-accounts list", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const child = relation(data, true);
    const parentName = data.persona.name;
    const parentEmail = data.persona.email;
    loginAs(data, child.id);
    expect(data.persona.name).toBe(child.name);

    const result = endImpersonation(data);

    expect(data.persona.name).toBe(parentName);
    expect(data.persona.email).toBe(parentEmail);
    expect(useMockImpersonation().isImpersonating.value).toBe(false);
    expect(result?.to).toBe(CHILD_ACCOUNTS_PATH);
  });

  it("a reseed drops the swap — the session's persona never outlives its dataset", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const child = relation(data, true);
    const parentName = data.persona.name;
    loginAs(data, child.id);
    expect(data.persona.name).toBe(child.name);

    resetMockData(MOCK_DATASET_ID.HOSTGRID);

    expect(useMockData(MOCK_DATASET_ID.HOSTGRID).persona.name).toBe(parentName);
  });

  it("on a dataset with no children at all, there is nobody to become", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    const parentName = data.persona.name;
    expect(data.childAccounts).toEqual([]);

    const result = loginAs(data, "rel-1");

    expect(data.persona.name).toBe(parentName);
    expect(useMockImpersonation().isImpersonating.value).toBe(false);
    expect(result?.to).toBeUndefined();
    expect(result?.toast?.intent).not.toBe(MOCK_TOAST_INTENT.SUCCESS);
  });
});
