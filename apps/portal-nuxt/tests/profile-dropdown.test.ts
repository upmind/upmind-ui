// -----------------------------------------------------------------------------
/**
 * @module tests/profile-dropdown
 * @description Plan Phase 6 / gap doc §6: the topbar's own menu — who is
 * signed in, the support PIN the desk asks for, the two account destinations
 * and the way out. The PIN is masked until the client asks for it, which is
 * what makes it a secret rather than a printed field.
 *
 * Every gate is graded against the dataset sitting on its other branch
 * (plan R9), and the identity line is graded while impersonating a child, so
 * a heading that reads the seed rather than the ACTIVE persona fails here.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { find, map } from "lodash-es";
import type { MockChildAccount, MockDataset } from "~/portal/mock/types";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { isSupportPinRevealed } from "~/portal/mock/facades";
import { useMockImpersonation } from "~/portal/mock/impersonation";
import { accountMenuHeading, accountMenuItems } from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const PROFILE_ITEM = mockActionValue(MOCK_ACTION.NAVIGATE, "/account/profile");

const SECURITY_ITEM = mockActionValue(
  MOCK_ACTION.NAVIGATE,
  "/account/security"
);

const SIGN_OUT_ITEM = mockActionValue(MOCK_ACTION.NAVIGATE, "/logout");

const NO_CONTEXT = {};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function identityLine(data: MockDataset): string {
  return `${data.persona.name} · ${data.persona.email}`;
}

function pinItem(data: MockDataset) {
  return find(accountMenuItems(data), item =>
    item.value.startsWith(MOCK_ACTION.PIN_REVEAL)
  );
}

function revealPin(data: MockDataset) {
  return dispatchMockAction(
    data,
    NO_CONTEXT,
    mockActionValue(MOCK_ACTION.PIN_REVEAL, data.persona.id)
  );
}

function childThatAllowsIt(data: MockDataset): MockChildAccount {
  const child = find(data.childAccounts, { allow_impersonation: true });
  if (child === undefined) {
    throw new Error("seed carries no child account that allows impersonation");
  }
  return child;
}

describe("the identity line — who the portal thinks you are", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    useMockImpersonation().end();
  });
  afterEach(() => {
    useMockImpersonation().end();
  });

  it("names the signed-in client and the address they signed in with", () => {
    expect(accountMenuHeading(hostgrid())).toBe(identityLine(hostgrid()));
    expect(accountMenuHeading(minimal())).toBe(identityLine(minimal()));
    expect(accountMenuHeading(hostgrid())).toContain(hostgrid().persona.email);
  });

  it("names the CHILD while its parent is looking through it", () => {
    const data = hostgrid();
    const parentLine = identityLine(data);
    const child = childThatAllowsIt(data);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.LOGIN_AS_CHILD, child.id)
    );

    expect(accountMenuHeading(data)).toBe(`${child.name} · ${child.email}`);
    expect(accountMenuHeading(data)).not.toBe(parentLine);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.END_IMPERSONATION)
    );

    expect(accountMenuHeading(data)).toBe(parentLine);
  });
});

describe("the menu's destinations", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("offers the account, the security page and the way out, in that order", () => {
    const values = map(accountMenuItems(hostgrid()), "value");

    expect(values.slice(-3)).toEqual([
      PROFILE_ITEM,
      SECURITY_ITEM,
      SIGN_OUT_ITEM
    ]);
    expect(map(accountMenuItems(minimal()), "value").slice(-3)).toEqual([
      PROFILE_ITEM,
      SECURITY_ITEM,
      SIGN_OUT_ITEM
    ]);
  });

  it("names each of them", () => {
    const items = accountMenuItems(hostgrid());

    expect(find(items, { value: PROFILE_ITEM })?.label).toBe("My account");
    expect(find(items, { value: SECURITY_ITEM })?.label).toBe("Security");
    expect(find(items, { value: SIGN_OUT_ITEM })?.label).toBe("Sign out");
  });
});

describe("the support PIN — printed only when the client asks", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    if (isSupportPinRevealed(hostgrid().persona)) revealPin(hostgrid());
  });
  // The reveal is module-level state keyed by persona id, and both datasets'
  // personas share one — a failed assertion mid-flow would leave it revealed.
  afterEach(() => {
    if (isSupportPinRevealed(hostgrid().persona)) revealPin(hostgrid());
  });

  it("sits in the menu masked, and prints the brand's PIN once toggled", () => {
    const data = hostgrid();
    const pin = data.persona.supportPin;
    expect(pin).toBeTruthy();

    const masked = pinItem(data);
    expect(masked?.value).toBe(
      mockActionValue(MOCK_ACTION.PIN_REVEAL, data.persona.id)
    );
    expect(masked?.label).not.toContain(pin);
    expect(isSupportPinRevealed(data.persona)).toBe(false);

    revealPin(data);

    const revealed = pinItem(data);
    expect(isSupportPinRevealed(data.persona)).toBe(true);
    expect(revealed?.label).toContain(pin);
    expect(revealed?.label).not.toBe(masked?.label);
  });

  it("masks it again on a second press — the control toggles, it does not latch", () => {
    const data = hostgrid();

    revealPin(data);
    revealPin(data);

    expect(isSupportPinRevealed(data.persona)).toBe(false);
    expect(pinItem(data)?.label).not.toContain(data.persona.supportPin);
  });

  it("is absent altogether on a brand with the PIN gate off", () => {
    expect(minimal().features.SUPPORT_PIN_ENABLED).toBe(false);
    expect(hostgrid().features.SUPPORT_PIN_ENABLED).toBe(true);
    expect(pinItem(minimal())).toBeUndefined();
    expect(pinItem(hostgrid())).toBeDefined();
  });
});
