// -----------------------------------------------------------------------------
/**
 * @module tests/dispatcher-refusal-tiers
 * @description The operator's two-tier ruling for the one action door: a
 * KNOWN verb whose payload names a target this dataset does not hold refuses
 * OUT LOUD — a warning toast and nothing else — while an unknown verb and a
 * malformed payload stay a quiet `undefined`. A refusal is also a no-op: the
 * whole dataset is byte-identical either side of one, so a verb that mutates
 * and then apologises fails here.
 *
 * Swept as a TABLE rather than per verb, because the ruling is about the
 * door, not about any one case: a verb added to `MOCK_ACTION` that answers
 * its own way is what this is built to catch.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { DelegateObjectTypes } from "@upmind-automation/types";
import type { MockDataset } from "~/portal/mock/types";
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

/** An id no seed mints — the `<prefix>-<n>` spelling every seeded id uses is deliberately not followed. */
const ABSENT_ID = "no-such-row-9f3c";

/**
 * Every verb that names a SUBJECT, pointed at a subject that is not there.
 * Written as the value a control would emit, through `mockActionValue`, so a
 * change to the emitted protocol reaches this table.
 */
const ABSENT_SUBJECT_VALUES: readonly string[] = [
  mockActionValue(MOCK_ACTION.VIEW_PRODUCT, ABSENT_ID),
  mockActionValue(MOCK_ACTION.VAULT_REMOVE, ABSENT_ID),
  mockActionValue(MOCK_ACTION.VAULT_CONVERT, ABSENT_ID),
  mockActionValue(MOCK_ACTION.END_TRIAL, ABSENT_ID),
  mockActionValue(MOCK_ACTION.MIGRATE_PRODUCT, ABSENT_ID),
  mockActionValue(MOCK_ACTION.ABORT_CANCELLATION, ABSENT_ID),
  mockActionValue(MOCK_ACTION.DISABLE_AUTO_EXPIRE, ABSENT_ID),
  mockActionValue(MOCK_ACTION.TOGGLE_AUTO_RENEW, ABSENT_ID),
  mockActionValue(MOCK_ACTION.CREATE_RENEWAL_INVOICE, ABSENT_ID),
  mockActionValue(MOCK_ACTION.RUN_PROVISION_FUNCTION, `${ABSENT_ID}:reboot`),
  mockActionValue(MOCK_ACTION.PIN_REVEAL, ABSENT_ID),
  mockActionValue(MOCK_ACTION.NOTIFICATION_DISMISS, ABSENT_ID),
  mockActionValue(MOCK_ACTION.LOGIN_AS_CHILD, ABSENT_ID),
  mockActionValue(MOCK_ACTION.COMPANY_VALIDATE_TAX, ABSENT_ID),
  mockActionValue(MOCK_ACTION.IP_WHITELIST_REMOVE, ABSENT_ID),
  mockActionValue(
    MOCK_ACTION.DELEGATE_TOGGLE_OBJECT,
    `${ABSENT_ID}:${DelegateObjectTypes.CONTRACT_PRODUCT}:${ABSENT_ID}`
  ),
  mockActionValue(
    MOCK_ACTION.SET_PRODUCT_BILLING_ADDRESS,
    `${ABSENT_ID}:${ABSENT_ID}`
  )
];

/** Values this layer never authored — a payload segment outside the verb's own vocabulary. */
const MALFORMED_VALUES: readonly string[] = [
  `${MOCK_ACTION.DOWNLOAD}:not-a-document:${ABSENT_ID}`,
  `${MOCK_ACTION.NOTIFICATION_FILTER}:sideways`,
  `${MOCK_ACTION.SET_PAGE_SIZE}:not-a-collection:5`,
  `${MOCK_ACTION.COLLECTION_FILTER}:not-a-collection:read:yes`,
  `${MOCK_ACTION.COLLECTION_SEARCH}:not-a-collection:kestrel`,
  `${MOCK_ACTION.PAGE_NEXT}:not-a-collection`
];

/** Verbs nothing in this layer authored — chrome buttons emitting their own labels. */
const UNKNOWN_VALUES: readonly string[] = [
  "alerts",
  "support",
  "open-basket:3",
  "Mark all read"
];

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

describe("tier one — a known verb, a target the dataset does not hold", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it.each(ABSENT_SUBJECT_VALUES)("%s refuses out loud", value => {
    const result = dispatchMockAction(hostgrid(), NO_CONTEXT, value);

    expect(result).toBeDefined();
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(result?.toast?.title).toBeTruthy();
    expect(result?.confirm).toBeUndefined();
    expect(result?.to).toBeUndefined();
  });

  it.each(ABSENT_SUBJECT_VALUES)("%s leaves the dataset untouched", value => {
    const data = hostgrid();
    const before = JSON.stringify(data);

    dispatchMockAction(data, NO_CONTEXT, value);

    expect(JSON.stringify(data)).toBe(before);
  });
});

describe("tier two — nobody pressed anything this layer authored", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it.each(UNKNOWN_VALUES)("%s is a quiet no-op", value => {
    expect(dispatchMockAction(hostgrid(), NO_CONTEXT, value)).toBeUndefined();
  });

  it.each(MALFORMED_VALUES)("%s is a quiet no-op", value => {
    expect(dispatchMockAction(hostgrid(), NO_CONTEXT, value)).toBeUndefined();
  });

  it("a known verb with no payload at all says nothing either", () => {
    const data = hostgrid();

    expect(
      dispatchMockAction(data, NO_CONTEXT, MOCK_ACTION.NAVIGATE)
    ).toBeUndefined();
    expect(
      dispatchMockAction(data, NO_CONTEXT, MOCK_ACTION.COPY)
    ).toBeUndefined();
  });

  it("neither tier mutates anything", () => {
    const data = hostgrid();
    const before = JSON.stringify(data);

    for (const value of [...UNKNOWN_VALUES, ...MALFORMED_VALUES]) {
      dispatchMockAction(data, NO_CONTEXT, value);
    }

    expect(JSON.stringify(data)).toBe(before);
  });
});
