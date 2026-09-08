// -----------------------------------------------------------------------------
/**
 * @module tests/child-accounts
 * @description Gap doc §4 "Child accounts": the accounts this one manages —
 * the row's three ways in, the relation's own switches, and the appearance a
 * parent lends the children that inherit it.
 *
 * Every switch is round-tripped through the one action door and read back off
 * the relation, and each flip is graded on the two flags it must NOT move.
 * The gates are graded differentially across the two datasets (plan R9), so a
 * gate that only ever answers the way the shipped seed happens to sit fails.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rowBinding, stringsIn } from "./support/page-config";
import { find, map, some, values } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockChildAccount, MockDataset } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { ClientRelationToggleKeys } from "~/portal/mock/contracts";
import {
  DATA_REF_ID,
  isDataRef,
  resolveDataRef
} from "~/portal/mock/data-refs";
import { useMockBrandGates } from "~/portal/mock/gates";
import { useMockImpersonation } from "~/portal/mock/impersonation";
import {
  childAccountItems,
  hasParentBranding,
  parentBrandingItems,
  parentBrandingLogoItems,
  relationSpecItems,
  relationToggleItems
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const datasetChoice = vi.hoisted(() => ({ id: "" }));

vi.mock("~/composables/usePortalConfig", async () => {
  const { computed } = await import("vue");
  return {
    usePortalConfig: () => ({
      activeDatasetId: computed(() => datasetChoice.id)
    })
  };
});

const CHILD_ACCOUNTS_PATH = "/account/child-accounts";

const TOGGLE_KEYS = values(ClientRelationToggleKeys);

type ListRow = ReturnType<typeof childAccountItems>[number];

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function contextFor(relation: MockChildAccount): DataRouteContext {
  return { entityId: relation.id };
}

function relationWhere(
  data: MockDataset,
  trait: string,
  matches: (relation: MockChildAccount) => boolean
): MockChildAccount {
  const relation = find(data.childAccounts, matches);
  if (relation === undefined) throw new Error(`seed carries no ${trait}`);
  return relation;
}

function relationById(data: MockDataset, id: string): MockChildAccount {
  return relationWhere(data, `relation ${id}`, relation => relation.id === id);
}

function rowFor(rows: readonly ListRow[], id: string): ListRow {
  const row = find(rows, { id });
  if (row === undefined) throw new Error(`no row for relation ${id}`);
  return row;
}

function childPage(key: string): ConfigNode {
  const page = accountPages()[key];
  if (page === undefined) throw new Error(`no page config for ${key}`);
  return page;
}

/** The branding panel, wherever the child-accounts area seats it. */
function brandingRow(): ConfigNode {
  const pages = [
    childPage(PAGE_KEY.ACCOUNT_CHILD_ACCOUNT_DETAIL),
    childPage(PAGE_KEY.ACCOUNT_CHILD_ACCOUNTS)
  ];
  const row = find(
    map(pages, page => rowBinding(page, DATA_REF_ID.HAS_PARENT_BRANDING)),
    candidate => candidate !== undefined
  );
  if (row === undefined) {
    throw new Error("no child-accounts row binds the parent-branding gate");
  }
  return row;
}

function visibleFor(
  row: ConfigNode,
  data: MockDataset,
  context: DataRouteContext
): unknown {
  const ref = row.visible;
  if (!isDataRef(ref)) throw new Error("row declares no visibility ref");
  return resolveDataRef(ref, data, context);
}

function toggleFor(data: MockDataset, relation: MockChildAccount, key: string) {
  return find(
    relationToggleItems(data, contextFor(relation)),
    row => row.toggle?.value.endsWith(`:${key}`) === true
  );
}

function gatesFor(datasetId: string) {
  datasetChoice.id = datasetId;
  return useMockBrandGates();
}

describe("each child row offers the three ways legacy gave in", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("points at the relation and offers to break it, on every row", () => {
    const data = hostgrid();
    const rows = childAccountItems(data);

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const actions = map(row.moreActions ?? [], "value");
      expect(actions).toContain(
        mockActionValue(
          MOCK_ACTION.NAVIGATE,
          `${CHILD_ACCOUNTS_PATH}/${row.id}`
        )
      );
      expect(actions).toContain(
        mockActionValue(MOCK_ACTION.RELATION_DETACH, row.id)
      );
    }
  });

  it("offers to become the child only where the child has allowed it", () => {
    const data = hostgrid();
    const allowed = relationWhere(data, "impersonable child", relation =>
      Boolean(relation.allow_impersonation)
    );
    const refused = relationWhere(
      data,
      "child that forbids impersonation",
      relation => !relation.allow_impersonation
    );
    const rows = childAccountItems(data);

    expect(map(rowFor(rows, allowed.id).moreActions ?? [], "value")).toContain(
      mockActionValue(MOCK_ACTION.LOGIN_AS_CHILD, allowed.id)
    );
    expect(
      map(rowFor(rows, refused.id).moreActions ?? [], "value")
    ).not.toContain(mockActionValue(MOCK_ACTION.LOGIN_AS_CHILD, refused.id));
  });
});

describe("detaching a child asks first", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("keeps the relation on the first pass and drops it on the confirmed one", () => {
    const data = hostgrid();
    const target = relationWhere(data, "any child account", () => true);

    const asked = dispatchMockAction(
      data,
      {},
      mockActionValue(MOCK_ACTION.RELATION_DETACH, target.id)
    );

    expect(asked?.confirm?.destructive).toBe(true);
    expect(asked?.confirm?.then).toBeTruthy();
    expect(map(data.childAccounts, "id")).toContain(target.id);

    const confirmed = dispatchMockAction(data, {}, asked?.confirm?.then ?? "");

    expect(map(data.childAccounts, "id")).not.toContain(target.id);
    expect(confirmed?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(
      `${confirmed?.toast?.title} ${confirmed?.toast?.description ?? ""}`
    ).toContain(target.name);
  });
});

describe("the relation page states the child and its three switches", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("names the child it is about, and a different child reads differently", () => {
    const data = hostgrid();
    const first = relationWhere(data, "any child account", () => true);
    const second = relationWhere(
      data,
      "second child account",
      relation => relation.id !== first.id
    );

    const rows = relationSpecItems(data, contextFor(first));

    expect(rows.length).toBeGreaterThan(0);
    expect(stringsIn(rows).join(" ")).toContain(first.name);
    expect(stringsIn(rows).join(" ")).not.toBe(
      stringsIn(relationSpecItems(data, contextFor(second))).join(" ")
    );
  });

  it("renders one switch per relation flag, standing where the relation does", () => {
    const data = hostgrid();
    const relation = relationWhere(data, "any child account", () => true);
    const rows = relationToggleItems(data, contextFor(relation));

    expect(rows).toHaveLength(TOGGLE_KEYS.length);
    for (const key of TOGGLE_KEYS) {
      const row = toggleFor(data, relation, key);
      expect(row?.toggle?.value).toBe(
        mockActionValue(MOCK_ACTION.RELATION_TOGGLE, `${relation.id}:${key}`)
      );
      expect(row?.toggle?.label).toBeTruthy();
      expect(row?.toggle?.checked).toBe(Boolean(relation[key]));
    }
  });

  it.each(TOGGLE_KEYS)(
    "flips %s both ways and leaves the other two where they were",
    key => {
      const data = hostgrid();
      const relation = relationWhere(data, "any child account", () => true);
      const untouched = TOGGLE_KEYS.filter(candidate => candidate !== key);
      const before = Boolean(relation[key]);
      const others = map(untouched, candidate => Boolean(relation[candidate]));
      const value = mockActionValue(
        MOCK_ACTION.RELATION_TOGGLE,
        `${relation.id}:${key}`
      );

      const flipped = dispatchMockAction(data, {}, value);

      expect(Boolean(relationById(data, relation.id)[key])).toBe(!before);
      expect(
        map(untouched, candidate =>
          Boolean(relationById(data, relation.id)[candidate])
        )
      ).toEqual(others);
      expect(flipped?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
      expect(
        toggleFor(data, relationById(data, relation.id), key)?.toggle?.checked
      ).toBe(!before);

      dispatchMockAction(data, {}, value);

      expect(Boolean(relationById(data, relation.id)[key])).toBe(before);
    }
  );
});

describe("the brand a parent lends its children", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("stands on the brand that lends one and nowhere else", () => {
    const parent = hostgrid();
    const bare = minimal();
    const relation = relationWhere(parent, "any child account", () => true);

    expect(hasParentBranding(parent)).toBe(true);
    expect(hasParentBranding(bare)).toBe(false);
    expect(visibleFor(brandingRow(), parent, contextFor(relation))).toBe(true);
    expect(visibleFor(brandingRow(), bare, contextFor(relation))).toBe(false);
  });

  it("reports the appearance the seed lends, verbatim", () => {
    const data = hostgrid();
    const branding = data.parentBranding;
    if (branding === null) throw new Error("seed lends no parent branding");

    const stated = stringsIn(parentBrandingItems(data));

    expect(stated).toContain(branding.name);
    expect(stated).toContain(branding.colour);
    expect(stated).toContain(branding.font);
    expect(stringsIn(parentBrandingLogoItems(data))).toContain(
      branding.logoSrc
    );
  });
});

describe("the child-account gates answer for the account they are asked about", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    useMockImpersonation().end();
  });
  afterEach(() => {
    useMockImpersonation().end();
  });

  it("reports children only where there are any", () => {
    expect(gatesFor(MOCK_DATASET_ID.HOSTGRID).hasChildAccounts.value).toBe(
      true
    );
    expect(
      gatesFor(MOCK_DATASET_ID.HOSTGRID_MINIMAL).hasChildAccounts.value
    ).toBe(false);
  });

  it("reports the account as a child only while signed in as one", () => {
    const data = hostgrid();
    const relation = relationWhere(data, "impersonable child", candidate =>
      Boolean(candidate.allow_impersonation)
    );

    expect(gatesFor(MOCK_DATASET_ID.HOSTGRID).isChildAccount.value).toBe(false);

    dispatchMockAction(
      data,
      {},
      mockActionValue(MOCK_ACTION.LOGIN_AS_CHILD, relation.id)
    );

    expect(gatesFor(MOCK_DATASET_ID.HOSTGRID).isChildAccount.value).toBe(true);

    dispatchMockAction(
      data,
      {},
      mockActionValue(MOCK_ACTION.END_IMPERSONATION)
    );

    expect(gatesFor(MOCK_DATASET_ID.HOSTGRID).isChildAccount.value).toBe(false);
    expect(
      gatesFor(MOCK_DATASET_ID.HOSTGRID_MINIMAL).isChildAccount.value
    ).toBe(false);
  });
});

describe("the minimal dataset has nobody to manage", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("renders no child rows at all", () => {
    const data = minimal();

    expect(data.childAccounts).toEqual([]);
    expect(childAccountItems(data)).toEqual([]);
    expect(some(childAccountItems(data), row => row.id !== "")).toBe(false);
  });
});
