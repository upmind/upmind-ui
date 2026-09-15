// -----------------------------------------------------------------------------
/**
 * @module tests/account-switch-and-avatar
 * @description Plan F5 O1 — legacy's `tenancy/selectAccountModal`. One sign-in
 * may act for more than one account, so the control appears only where there
 * is a choice to make, and the account being acted for is what the card and
 * the menu then say about the client.
 *
 * The card's photo is covered here too, but only as something SHOWN: the
 * "Change photo" control was removed (ruled 2026-09-14) because legacy served
 * no client-facing change-photo at all, and the platform derives the picture
 * from an uploaded image relation rather than an address a client types.
 *
 * Both sides of the "more than one account" gate are graded against a dataset
 * standing on the other side of it (plan R9) — a control proven only on the
 * brand that happens to seed two accounts is a seed read-back.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { assign, every, find, join, map, size } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { MockDataset, MockPersonaAccount } from "~/portal/mock/types";
import type { AccountMenuItem } from "~/portal/modules/account-menu/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { personaAccounts } from "~/portal/mock/facades";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "~/portal/mock/hostgrid-minimal";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const NO_CONTEXT = {};

const SWITCH_CONTROL = mockActionValue(
  MOCK_ACTION.OPEN_FORM,
  FORM_ID.SWITCH_ACCOUNT
);

function ref<T>(data: MockDataset, id: DataRefId): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, NO_CONTEXT)
    ?.value as T;
}

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

/** A fresh clone of a shipped seed with the accounts this sign-in holds replaced. */
function holding(
  seed: MockDataset,
  accounts: readonly MockPersonaAccount[]
): MockDataset {
  const data: MockDataset = structuredClone(seed);
  return assign(data, {
    persona: assign({}, data.persona, {
      accounts,
      activeAccountId: accounts[0]?.id
    })
  });
}

function menuValues(data: MockDataset): string[] {
  return map(
    ref<AccountMenuItem[]>(data, DATA_REF_ID.ACCOUNT_MENU_ITEMS),
    "value"
  );
}

function cardText(data: MockDataset): string {
  return join(
    map(ref<ListModuleItem[]>(data, DATA_REF_ID.ACCOUNT_CARD_ITEMS), item =>
      join([item.title, item.description], " ")
    ),
    " "
  );
}

function cardImages(data: MockDataset): (string | undefined)[] {
  return map(
    ref<ListModuleItem[]>(data, DATA_REF_ID.ACCOUNT_CARD_ITEMS),
    "leadingImageSrc"
  );
}

function switchTo(data: MockDataset, accountId: string) {
  return dispatchMockAction(
    data,
    NO_CONTEXT,
    `${MOCK_ACTION.SWITCH_ACCOUNT}:${JSON.stringify({ accountId })}`
  );
}

function otherAccount(data: MockDataset): MockPersonaAccount {
  const account = find(
    personaAccounts(data.persona),
    candidate => candidate.id !== data.persona.activeAccountId
  );
  if (account === undefined) {
    throw new Error("the seed holds only the account already in play");
  }
  return account;
}

describe("switching account — offered only where there is a choice", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("puts the control in the account menu for a sign-in holding more than one", () => {
    expect(size(personaAccounts(hostgrid().persona))).toBeGreaterThan(1);
    expect(menuValues(hostgrid())).toContain(SWITCH_CONTROL);
  });

  it("keeps it out of a sign-in holding only its own account", () => {
    expect(size(personaAccounts(minimal().persona))).toBe(1);
    expect(menuValues(minimal())).not.toContain(SWITCH_CONTROL);
  });

  it("follows the accounts, not the brand — each seed flipped onto the other's side", () => {
    const [only] = personaAccounts(hostgrid().persona);
    const alone = holding(HOSTGRID_MOCK_DATASET, [
      only ?? otherAccount(hostgrid())
    ]);
    const paired = holding(
      HOSTGRID_MINIMAL_MOCK_DATASET,
      personaAccounts(hostgrid().persona)
    );

    expect(menuValues(alone)).not.toContain(SWITCH_CONTROL);
    expect(menuValues(paired)).toContain(SWITCH_CONTROL);
  });

  it("offers exactly the accounts the sign-in holds, each named with its brand", () => {
    const data = hostgrid();
    const accounts = personaAccounts(data.persona);
    const entry = resolveMockForm(data, FORM_ID.SWITCH_ACCOUNT, undefined);
    const property = entry?.schema as {
      properties?: {
        accountId?: {
          enum?: string[];
          options?: { label: string; value: string }[];
        };
      };
    };

    expect(property.properties?.accountId?.enum).toEqual(map(accounts, "id"));
    expect(map(property.properties?.accountId?.options, "value")).toEqual(
      map(accounts, "id")
    );
    for (const account of accounts) {
      const option = find(property.properties?.accountId?.options, {
        value: account.id
      });
      expect(option?.label).toContain(account.name);
      expect(option?.label).toContain(account.brandName);
    }
    expect(entry?.submit).toBe(MOCK_ACTION.SWITCH_ACCOUNT);
    expect(entry?.model).toEqual({ accountId: data.persona.activeAccountId });
  });
});

describe("switching account — what the client is then looking at", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("moves the account in play and says which one it moved to", () => {
    const data = hostgrid();
    const target = otherAccount(data);

    const result = switchTo(data, target.id);

    expect(data.persona.activeAccountId).toBe(target.id);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(result?.toast?.description).toBe(target.name);
  });

  it("the card and the menu then read the account being acted for", () => {
    const data = hostgrid();
    const before = find(personaAccounts(data.persona), {
      id: data.persona.activeAccountId
    });
    const target = otherAccount(data);
    expect(before?.name).toBeTruthy();
    expect(cardText(data)).toContain(before?.name ?? "");

    switchTo(data, target.id);

    expect(cardText(data)).toContain(target.name);
    expect(cardText(data)).not.toContain(before?.name ?? "no-such-name");
    expect(ref<string>(data, DATA_REF_ID.ACCOUNT_MENU_HEADING)).toContain(
      target.name
    );
  });

  it("an account this sign-in does not hold is refused, and nothing moves", () => {
    const data = hostgrid();
    const standing = data.persona.activeAccountId;
    const shown = cardText(data);

    const result = switchTo(data, "acc-not-held-4b81");

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(data.persona.activeAccountId).toBe(standing);
    expect(cardText(data)).toBe(shown);
  });
});

describe("the account photo is shown, and is not the client's to change", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("shows the picture the account carries", () => {
    const data = hostgrid();

    expect(data.persona.avatarSrc).toBeTruthy();
    expect(cardImages(data)).toContain(data.persona.avatarSrc);
  });

  it("offers no control to change it", () => {
    const rows = ref<ListModuleItem[]>(
      hostgrid(),
      DATA_REF_ID.ACCOUNT_CARD_ITEMS
    );

    expect(size(rows)).toBeGreaterThan(0);
    expect(every(rows, row => row.action === undefined)).toBe(true);
  });
});
