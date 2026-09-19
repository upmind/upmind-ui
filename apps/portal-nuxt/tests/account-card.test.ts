// -----------------------------------------------------------------------------
/**
 * @module tests/account-card
 * @description Gap doc §4 "Sidebar / summary": legacy's account pane — who
 * the client is (avatar, name, the username that opens security, their
 * standing tags), what kind of account it is (parent, personal, or a child
 * being stood in for), when they last signed in and how long they have been a
 * client — and under it the support PIN, masked until it is asked for and
 * re-mintable.
 *
 * Everything is driven through the surfaces a client actually reaches: the
 * pane the account area resolves, the values the PIN panel's own controls
 * emit, and the one action door. A selector read back against itself proves
 * nothing.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { propsBinding } from "./support/page-config";
import { filter, find, flatMap, join, map, some, startsWith } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { MockDataset } from "~/portal/mock/types";
import type { ButtonModuleAction } from "~/portal/modules/button/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import type { ResolvedContentRow } from "~/portal/resolve";
import { areaForPath } from "~/portal/areas";
import { hostgridConfig } from "~/portal/config/hostgrid";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { isSupportPinRevealed } from "~/portal/mock/facades";
import { useMockImpersonation } from "~/portal/mock/impersonation";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { resolve } from "~/portal/resolve";

const NO_CONTEXT = {};

const ACCOUNT_PATH = "/account/profile";

const SECURITY_PATH = "/account/security";

const CHILD_ACCOUNTS_PATH = "/account/child-accounts";

function resolveRef(data: MockDataset, id: DataRefId): unknown {
  return resolveDataRefProps({ value: dataRef(id) }, data)?.value;
}

function cardItems(data: MockDataset): ListModuleItem[] {
  return resolveRef(data, DATA_REF_ID.ACCOUNT_CARD_ITEMS) as ListModuleItem[];
}

function cardSpec(data: MockDataset): SpecModuleItem[] {
  return resolveRef(
    data,
    DATA_REF_ID.ACCOUNT_CARD_SPEC_ITEMS
  ) as SpecModuleItem[];
}

function pinPanel(data: MockDataset): SpecModuleItem[] {
  return resolveRef(
    data,
    DATA_REF_ID.SUPPORT_PIN_PANEL_ITEMS
  ) as SpecModuleItem[];
}

function pinPanelText(data: MockDataset): string {
  return join(map(pinPanel(data), "value"), " ");
}

/** Drives the panel to REVEALED whatever it was — the control is a toggle, so its state is read, never assumed. */
function ensureRevealed(data: MockDataset): void {
  if (isSupportPinRevealed(data.persona)) return;
  dispatchMockAction(
    data,
    NO_CONTEXT,
    pinControl(data, MOCK_ACTION.PIN_REVEAL).value
  );
}

/**
 * The reveal is held beside the dataset and outlives `resetMockData`, so a
 * read-back that leaves the PIN on screen used to decide what the next one
 * saw. Each starts masked.
 */
function ensureMasked(data: MockDataset): void {
  if (!isSupportPinRevealed(data.persona)) return;
  dispatchMockAction(
    data,
    NO_CONTEXT,
    pinControl(data, MOCK_ACTION.PIN_COPY_AND_HIDE).value
  );
}

function pinControl(data: MockDataset, verb: string): ButtonModuleAction {
  const actions = resolveRef(
    data,
    DATA_REF_ID.SUPPORT_PIN_ACTIONS
  ) as ButtonModuleAction[];
  const action = find(actions, candidate =>
    startsWith(candidate.value, `${verb}:`)
  );
  if (action === undefined) {
    throw new Error(`the PIN panel offers no ${verb} control`);
  }
  return action;
}

function accountAside(): readonly ResolvedContentRow[] {
  return resolve(hostgridConfig, {
    area: areaForPath(hostgridConfig, ACCOUNT_PATH)
  }).content.aside;
}

function asideRowBinding(id: DataRefId): ResolvedContentRow {
  const row = find(
    accountAside(),
    candidate => propsBinding(candidate, id) !== undefined
  );
  if (row === undefined) {
    throw new Error(`no account aside row binds ${id}`);
  }
  return row;
}

function itemText(item: ListModuleItem): string {
  return join(
    filter([item.title, item.description, item.trailingText, item.category]),
    " "
  );
}

function specText(items: readonly SpecModuleItem[]): string {
  return join(
    flatMap(items, item => [item.label, item.value]),
    " "
  );
}

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

describe("the account pane — the card the pillar opens with", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });
  // Module-level ribbon state: a failed assertion mid-swap would otherwise
  // leave the wrong persona standing for every later reader.
  afterEach(() => {
    useMockImpersonation().end();
  });

  it("carries the card, its standing facts and the PIN panel, in that order", () => {
    const aside = accountAside();

    const positions = map(
      [
        DATA_REF_ID.ACCOUNT_CARD_ITEMS,
        DATA_REF_ID.ACCOUNT_CARD_SPEC_ITEMS,
        DATA_REF_ID.SUPPORT_PIN_PANEL_ITEMS
      ],
      id => aside.findIndex(row => propsBinding(row, id) !== undefined)
    );

    expect(positions).not.toContain(-1);
    expect(positions[2]).toBeGreaterThan(positions[0] ?? 0);
  });

  it("shows the client themselves — avatar, name and their standing tags", () => {
    const data = hostgrid();
    const items = cardItems(data);
    const { persona } = data;

    expect(map(items, "leadingImageSrc")).toContain(persona.avatarSrc);
    expect(join(map(items, itemText), " ")).toContain(persona.name);

    const tags = map(
      flatMap(items, item => item.tags ?? []),
      "label"
    );
    for (const tag of persona.tags ?? []) {
      expect(tags).toContain(tag);
    }
    expect(persona.tags?.length).toBeGreaterThan(0);
  });

  it("opens security from the username the client signs in with", () => {
    const data = hostgrid();

    const link = find(cardItems(data), { to: SECURITY_PATH });

    expect(link).toBeDefined();
    expect(itemText(link ?? { id: "", title: "" })).toContain(
      data.persona.username
    );
  });

  // Two facts, so two rows. Joined by a middot they read as one long value the
  // card's narrow value column wraps mid-sentence.
  it("names the account type and counts its children on their own rows", () => {
    const data = hostgrid();
    const rows = cardSpec(data);

    const kind = find(rows, item => item.label === "Account type");
    const children = find(rows, item => /child accounts?/i.test(item.label));

    expect(kind?.value).toBe("Parent account");
    expect(kind?.to).toBeUndefined();
    expect(children?.value).toBe(String(data.childAccounts.length));
    expect(children?.to).toBe(CHILD_ACCOUNTS_PATH);
  });

  it("an account with nobody under it is a personal one, and links nowhere", () => {
    const data = minimal();
    expect(data.childAccounts.length).toBe(0);

    const rows = cardSpec(data);
    const row = find(rows, item => /account/i.test(item.label));

    expect(specText(rows)).toContain("Personal account");
    expect(row?.to).toBeUndefined();
  });

  it("standing on a child's account says whose it is", () => {
    const data = hostgrid();
    const parentName = data.persona.name;
    const child = find(data.childAccounts, { allow_impersonation: true });
    if (child === undefined) throw new Error("seed carries no reachable child");

    dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.LOGIN_AS_CHILD, child.id)
    );

    expect(specText(cardSpec(data))).toContain(`Child of ${parentName}`);
  });

  it("reports when the client last signed in and how long they have been one", () => {
    const data = hostgrid();
    const rows = cardSpec(data);

    const lastLogin = find(rows, item => /last (login|sign)/i.test(item.label));
    const since = find(rows, item =>
      /(client|customer) since/i.test(item.label)
    );

    expect(lastLogin?.value).toBeTruthy();
    expect(since?.value).toBeTruthy();
    expect(data.persona.lastLoginAt).toBeTruthy();
    expect(data.persona.clientSince).toBeTruthy();
  });
});

describe("the support PIN panel — gated, masked, re-mintable", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    ensureMasked(hostgrid());
  });

  it("the pane's own slot gate admits it where the brand offers a PIN, and nowhere else", () => {
    const gate = asideRowBinding(DATA_REF_ID.SUPPORT_PIN_PANEL_ITEMS).visible;

    expect(gate).toBeDefined();
    if (gate === undefined) return;
    expect(resolveDataRef(gate, hostgrid())).toBe(true);
    expect(resolveDataRef(gate, minimal())).toBe(false);
  });

  // Re-pointed 2026-09-06 (plan F18 O-6): masking it again is legacy's
  // `copy_and_hide` now — the client leaves with the number in hand.
  it("reveals the PIN the client would read out, and masks it again", () => {
    const data = hostgrid();
    const pin = data.persona.supportPin ?? "";
    expect(pin).toBeTruthy();

    const reveal = pinControl(data, MOCK_ACTION.PIN_REVEAL);
    expect(reveal.value).toBe(
      mockActionValue(MOCK_ACTION.PIN_REVEAL, data.persona.id)
    );
    expect(pinPanelText(data)).not.toContain(pin);

    dispatchMockAction(data, NO_CONTEXT, reveal.value);
    expect(pinPanelText(data)).toContain(pin);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      pinControl(data, MOCK_ACTION.PIN_COPY_AND_HIDE).value
    );
    expect(pinPanelText(data)).not.toContain(pin);
  });

  it("a reveal aimed at somebody else's account is refused, and reveals nothing", () => {
    const data = hostgrid();

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.PIN_REVEAL, "no-such-client-9f3c")
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(isSupportPinRevealed(data.persona)).toBe(false);
    expect(pinPanelText(data)).not.toContain(data.persona.supportPin ?? "");
  });

  it("minting a new PIN asks first, and the old one still works until it is answered", () => {
    const data = hostgrid();
    const before = data.persona.supportPin;

    const asked = dispatchMockAction(
      data,
      NO_CONTEXT,
      pinControl(data, MOCK_ACTION.PIN_REGENERATE).value
    );

    expect(asked?.confirm?.destructive).toBe(true);
    expect(asked?.confirm?.then).toBeTruthy();
    expect(data.persona.supportPin).toBe(before);
  });

  it("answering it mints a different four-digit PIN, says so, and both panels read the new one", () => {
    const data = hostgrid();
    const before = data.persona.supportPin ?? "";
    const asked = dispatchMockAction(
      data,
      NO_CONTEXT,
      pinControl(data, MOCK_ACTION.PIN_REGENERATE).value
    );

    const done = dispatchMockAction(
      data,
      NO_CONTEXT,
      asked?.confirm?.then ?? ""
    );

    const after = data.persona.supportPin ?? "";
    expect(after).toMatch(/^\d{4}$/);
    expect(after).not.toBe(before);
    expect(done?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);

    ensureRevealed(data);
    expect(pinPanelText(data)).toContain(after);
    expect(pinPanelText(data)).not.toContain(before);
  });

  it("a brand with no PIN feature has no PIN to show", () => {
    const data = minimal();

    expect(resolveRef(data, DATA_REF_ID.IS_SUPPORT_PIN_ENABLED)).toBe(false);
    expect(data.persona.supportPin).toBeUndefined();
    expect(some(pinPanel(data), item => /\d{4}/.test(item.value))).toBe(false);
  });
});
