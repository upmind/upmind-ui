// -----------------------------------------------------------------------------
/**
 * @module tests/security-ip-whitelist
 * @description Gap doc §4 "Security": the addresses this account may sign in
 * from. Legacy listed each one with the name its owner gave it and let a
 * client lift a restriction; ADDING one asks for an address and a description,
 * which is a form (plan F1) — so the control the page offers must name a
 * REGISTERED one rather than promise nothing.
 *
 * The panel joins the security facts that were already there — password age,
 * two-factor, the sign-in history link — and this grades that it joined them
 * rather than replaced them.
 *
 * F15 turned the panel into a PAGED collection with a search over it, so the
 * rows on screen are one page of the account's restrictions rather than all
 * of them, and the whole count moved to the pager. Legacy's own edit came
 * with it: a row now LEADS with editing the entry and keeps lifting it in
 * the overflow.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { rowBinding } from "./support/page-config";
import {
  compact,
  every,
  filter,
  find,
  flatMap,
  includes,
  isObject,
  isString,
  join,
  map,
  some,
  startsWith
} from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { MockDataset, MockIpAddress } from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { PaginationModuleState } from "~/portal/modules/pagination/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import { accountPages } from "~/portal/config/account-pages";
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
import { FORM_ID, isFormId } from "~/portal/mock/forms/ids";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT = {};

const LOGS_PATH = "/account/logs";

const CREATION_VERB = /^(add|create|new)([-:\s]|$)/i;

type ActionLike = { readonly value: string; readonly label: string };

function resolveRef(data: MockDataset, id: DataRefId): unknown {
  return resolveDataRefProps({ value: dataRef(id) }, data)?.value;
}

/** Whether a resolved ref is the pager's own feed — the three figures it must carry. */
function isPagination(value: unknown): value is PaginationModuleState {
  if (typeof value !== "object" || value === null) return false;
  const record: Record<string, unknown> = { ...value };
  return (
    typeof record.total === "number" &&
    typeof record.itemsPerPage === "number" &&
    typeof record.page === "number"
  );
}

/** The allowlist panel's pager, narrowed rather than asserted. */
function whitelistPager(data: MockDataset): PaginationModuleState {
  const resolved = resolveRef(data, DATA_REF_ID.IP_WHITELIST_PAGER);
  if (!isPagination(resolved)) {
    throw new Error("the allowlist panel publishes no pager");
  }
  return resolved;
}

function whitelistRows(data: MockDataset): ListModuleItem[] {
  return resolveRef(data, DATA_REF_ID.IP_WHITELIST_ITEMS) as ListModuleItem[];
}

function securityRows(data: MockDataset): SpecModuleItem[] {
  return resolveRef(data, DATA_REF_ID.SECURITY_SPEC_ITEMS) as SpecModuleItem[];
}

function rowActionValues(item: ListModuleItem): string[] {
  return map(
    compact([item.action, item.secondaryAction, ...(item.moreActions ?? [])]),
    "value"
  );
}

function rowText(item: ListModuleItem): string {
  return join(compact([item.title, item.description, item.trailingText]), " ");
}

function actionsIn(node: unknown): ActionLike[] {
  if (Array.isArray(node)) return flatMap(node, actionsIn);
  if (!isObject(node)) return [];
  const record = node as Record<string, unknown>;
  const self =
    isString(record.value) && isString(record.label)
      ? [{ value: record.value, label: record.label }]
      : [];
  return [...self, ...flatMap(Object.values(record), actionsIn)];
}

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function restriction(data: MockDataset): MockIpAddress {
  const [row] = data.ipWhitelist;
  if (row === undefined) throw new Error("seed restricts sign-in to nothing");
  return row;
}

describe("restrict access by IP", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("lists a page of the restrictions, each carrying its address and its name, with the whole count on the pager", () => {
    const data = hostgrid();
    const rows = whitelistRows(data);
    const pager = whitelistPager(data);

    // A page of the account's restrictions, not the lot: the pager carries
    // what the panel spans and the rows carry one page of it.
    expect(data.ipWhitelist.length).toBeGreaterThan(rows.length);
    expect(rows.length).toBe(pager.itemsPerPage);
    expect(pager.total).toBe(data.ipWhitelist.length);
    expect(pager.page).toBe(1);

    const text = join(map(rows, rowText), " | ");
    for (const shown of filter(data.ipWhitelist, entry =>
      includes(map(rows, "id"), entry.id)
    )) {
      expect(text).toContain(shown.ip_address);
      expect(text).toContain(shown.name);
    }
  });

  it("leads each restriction with editing it, and keeps lifting it in the overflow", () => {
    const data = hostgrid();

    for (const row of whitelistRows(data)) {
      expect(row.action?.value).toBe(
        `${MOCK_ACTION.OPEN_FORM}:${FORM_ID.IP_WHITELIST_EDIT}:${row.id}`
      );
      expect(map(row.moreActions ?? [], "value")).toEqual([
        `${MOCK_ACTION.IP_WHITELIST_REMOVE}:${row.id}`
      ]);
      // The two are the whole menu — nothing else rides the row.
      expect(
        every(rowActionValues(row), value =>
          some(
            [
              `${MOCK_ACTION.OPEN_FORM}:${FORM_ID.IP_WHITELIST_EDIT}:`,
              `${MOCK_ACTION.IP_WHITELIST_REMOVE}:`
            ],
            prefix => startsWith(value, prefix)
          )
        )
      ).toBe(true);
    }
  });

  it("the page's way to add one names a registered form, rather than promising nothing", () => {
    const pages = accountPages();
    const page = pages[PAGE_KEY.ACCOUNT_SECURITY];
    // The walker finds an authored control where one exists, so the security
    // page's answer means presence rather than a blind search.
    expect(
      actionsIn(pages[PAGE_KEY.ACCOUNT_NOTIFICATIONS]).length
    ).toBeGreaterThan(0);

    expect(rowBinding(page, DATA_REF_ID.IP_WHITELIST_ITEMS)).toBeDefined();
    const created = filter(
      actionsIn(page),
      action =>
        CREATION_VERB.test(action.value) || CREATION_VERB.test(action.label)
    );

    expect(created.length).toBeGreaterThan(0);
    for (const action of created) {
      expect(startsWith(action.value, `${MOCK_ACTION.OPEN_FORM}:`)).toBe(true);
      expect(
        isFormId(action.value.slice(`${MOCK_ACTION.OPEN_FORM}:`.length))
      ).toBe(true);
    }
  });

  it("asks before lifting one, then lifts it and says so", () => {
    const data = hostgrid();
    const target = restriction(data);

    const asked = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.IP_WHITELIST_REMOVE, target.id)
    );
    expect(asked?.confirm?.destructive).toBe(true);
    expect(map(data.ipWhitelist, "id")).toContain(target.id);

    const done = dispatchMockAction(
      data,
      NO_CONTEXT,
      asked?.confirm?.then ?? ""
    );

    expect(map(data.ipWhitelist, "id")).not.toContain(target.id);
    expect(whitelistPager(data).total).toBe(data.ipWhitelist.length);
    expect(map(whitelistRows(data), "id")).not.toContain(target.id);
    expect(done?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("a brand restricting nothing renders no rows at all", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);

    expect(data.ipWhitelist.length).toBe(0);
    expect(whitelistRows(data)).toEqual([]);
  });
});

describe("the security facts the whitelist joined", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("still states the password's age and the two-factor position", () => {
    const rows = securityRows(hostgrid());

    expect(some(rows, row => /password/i.test(row.label))).toBe(true);
    expect(some(rows, row => /(two-factor|2fa)/i.test(row.label))).toBe(true);
    expect(find(rows, row => /password/i.test(row.label))?.value).toBeTruthy();
  });

  it("sends the client to their own sign-in history", () => {
    const rows = securityRows(hostgrid());

    const link = find(rows, { to: LOGS_PATH });

    expect(link).toBeDefined();
    expect(link?.label).toMatch(/(login|sign-in|sign in) history/i);
  });
});
