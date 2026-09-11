// -----------------------------------------------------------------------------
/**
 * @module tests/delegates
 * @description Gap doc §4 "Delegates": who else reaches this account, what
 * they reach, and how a client takes it back. The list states each
 * delegation's standing and its size; the detail page switches one between
 * whole-account and per-object access and grants objects one at a time.
 *
 * Grants are round-tripped through the one action door and read back off the
 * dataset, never off the row that emitted them — a toggle that reports its
 * own payload back proves nothing. Inviting is a form, so the pages must
 * offer no such control at all (plan §6).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { DelegateObjectTypes } from "@upmind-automation/types";
import { rowBinding, stringsIn } from "./support/page-config";
import { filter, find, map, size, some } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockDelegate } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { DelegateAccessTypes } from "~/portal/mock/contracts";
import {
  DATA_REF_ID,
  isDataRef,
  resolveDataRef
} from "~/portal/mock/data-refs";
import { FORM_ID } from "~/portal/mock/forms/ids";
import {
  accountDelegateItems,
  delegateAccessItems,
  delegateProductItems,
  delegateSpecItems,
  delegateTicketItems
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_DELEGATE_STATUS } from "~/portal/mock/types";
import { PAGE_KEY } from "~/portal/types";

const PENDING_TAG = /^pending$/i;

const FULL_ACCESS_TAG = "Full access";

const COUNT_SEPARATOR = "·";

const ABSENT_DELEGATE_ID = "no-such-delegate-4b71";

type ListRow = ReturnType<typeof accountDelegateItems>[number];

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function contextFor(delegate: MockDelegate): DataRouteContext {
  return { entityId: delegate.id };
}

function seeded(
  data: MockDataset,
  trait: string,
  matches: (delegate: MockDelegate) => boolean
): MockDelegate {
  const delegate = find(data.delegates, matches);
  if (delegate === undefined) throw new Error(`seed carries no ${trait}`);
  return delegate;
}

function delegateById(data: MockDataset, id: string): MockDelegate {
  return seeded(data, `delegate ${id}`, delegate => delegate.id === id);
}

function rowFor(rows: readonly ListRow[], id: string): ListRow {
  const row = find(rows, { id });
  if (row === undefined) throw new Error(`no row for delegate ${id}`);
  return row;
}

function tagLabels(row: ListRow): string[] {
  return map(row.tags ?? [], "label");
}

function rowActionValues(row: ListRow): string[] {
  return [
    ...map(row.moreActions ?? [], "value"),
    ...(row.action === undefined ? [] : [row.action.value]),
    ...(row.toggle === undefined ? [] : [row.toggle.value])
  ];
}

function grantsOfType(
  delegate: MockDelegate,
  type: DelegateObjectTypes
): number {
  return size(filter(delegate.objects, { type }));
}

function holdsObject(
  delegate: MockDelegate,
  type: DelegateObjectTypes,
  objectId: string
): boolean {
  return some(delegate.objects, { type, id: objectId });
}

function delegatePage(key: string): ConfigNode {
  const page = accountPages()[key];
  if (page === undefined) throw new Error(`no page config for ${key}`);
  return page;
}

function detailRow(refId: string): ConfigNode {
  const row = rowBinding(delegatePage(PAGE_KEY.ACCOUNT_DELEGATE_DETAIL), refId);
  if (row === undefined) throw new Error(`no detail row binds ${refId}`);
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

/** The object id one grant toggle names — the row's own subject, as it emitted it. */
function toggledObjectId(row: ListRow): string {
  const segments = (row.toggle?.value ?? "").split(":");
  const objectId = segments[segments.length - 1];
  if (objectId === undefined || objectId === "") {
    throw new Error(`grant row ${row.id} emits no object id`);
  }
  return objectId;
}

describe("the delegates list states each delegation's standing and size", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("tags the invitations still outstanding, and only those", () => {
    const data = hostgrid();
    const pending = seeded(
      data,
      "pending delegate",
      delegate => delegate.status === MOCK_DELEGATE_STATUS.PENDING
    );
    const accepted = seeded(
      data,
      "accepted delegate",
      delegate => delegate.status === MOCK_DELEGATE_STATUS.ACCEPTED
    );
    const rows = accountDelegateItems(data);

    expect(
      some(tagLabels(rowFor(rows, pending.id)), label =>
        PENDING_TAG.test(label)
      )
    ).toBe(true);
    expect(
      some(tagLabels(rowFor(rows, accepted.id)), label =>
        PENDING_TAG.test(label)
      )
    ).toBe(false);
  });

  it("tags whole-account access, and only where it is held", () => {
    const data = hostgrid();
    const rows = accountDelegateItems(data);

    for (const row of rows) {
      const delegate = delegateById(data, row.id);
      expect(tagLabels(row).includes(FULL_ACCESS_TAG)).toBe(
        delegate.isFullDelegate === true
      );
    }
    expect(some(data.delegates, { isFullDelegate: true })).toBe(true);
  });

  it("counts what a per-object delegate reaches, and names the person a full one is", () => {
    const data = hostgrid();
    const specific = seeded(
      data,
      "specific delegate holding grants",
      delegate => delegate.isFullDelegate !== true && size(delegate.objects) > 0
    );
    const full = seeded(
      data,
      "full-access delegate",
      delegate => delegate.isFullDelegate === true
    );
    const rows = accountDelegateItems(data);
    const counted = rowFor(rows, specific.id).description ?? "";

    expect(counted).toContain(
      `${grantsOfType(specific, DelegateObjectTypes.CONTRACT_PRODUCT)} product`
    );
    expect(counted).toContain(
      `${grantsOfType(specific, DelegateObjectTypes.TICKET)} ticket`
    );
    expect(counted).toContain(COUNT_SEPARATOR);

    const named = rowFor(rows, full.id).description ?? "";
    expect(named).toContain(full.email);
    expect(named).not.toMatch(/\d+ (product|ticket)/);
  });

  it("offers to revoke each delegation from its own row", () => {
    const data = hostgrid();
    const rows = accountDelegateItems(data);

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(map(row.moreActions ?? [], "value")).toContain(
        mockActionValue(MOCK_ACTION.DELEGATE_REMOVE, row.id)
      );
    }
  });
});

describe("revoking a delegation asks first", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("keeps the delegate on the first pass and drops it on the confirmed one", () => {
    const data = hostgrid();
    const target = seeded(data, "any delegate", () => true);

    const asked = dispatchMockAction(
      data,
      {},
      mockActionValue(MOCK_ACTION.DELEGATE_REMOVE, target.id)
    );

    expect(asked?.confirm?.destructive).toBe(true);
    expect(asked?.confirm?.then).toBeTruthy();
    expect(map(data.delegates, "id")).toContain(target.id);

    const confirmed = dispatchMockAction(data, {}, asked?.confirm?.then ?? "");

    expect(map(data.delegates, "id")).not.toContain(target.id);
    expect(confirmed?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(
      `${confirmed?.toast?.title} ${confirmed?.toast?.description ?? ""}`
    ).toContain(target.name);
  });

  it("refuses a delegate this account does not hold, and touches nothing", () => {
    const data = hostgrid();
    const before = JSON.stringify(data.delegates);

    const removal = dispatchMockAction(
      data,
      {},
      mockActionValue(MOCK_ACTION.DELEGATE_REMOVE, ABSENT_DELEGATE_ID)
    );
    const access = dispatchMockAction(
      data,
      {},
      mockActionValue(
        MOCK_ACTION.DELEGATE_SET_ACCESS,
        `${ABSENT_DELEGATE_ID}:${DelegateAccessTypes.FULL}`
      )
    );

    expect(removal?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(removal?.confirm).toBeUndefined();
    expect(access?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(JSON.stringify(data.delegates)).toBe(before);
  });
});

describe("the detail page switches one delegate between the two access types", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("shows the switch standing where the delegate does, and moves them when pressed", () => {
    const data = hostgrid();
    const full = seeded(
      data,
      "full-access delegate",
      delegate => delegate.isFullDelegate === true
    );
    const specific = seeded(
      data,
      "specific delegate",
      delegate => delegate.isFullDelegate !== true
    );

    const fullSwitch = find(
      delegateAccessItems(data, contextFor(full)),
      row => row.toggle !== undefined
    );
    const specificSwitch = find(
      delegateAccessItems(data, contextFor(specific)),
      row => row.toggle !== undefined
    );

    expect(fullSwitch?.toggle?.checked).toBe(true);
    expect(specificSwitch?.toggle?.checked).toBe(false);
    expect(fullSwitch?.toggle?.label).toBeTruthy();

    dispatchMockAction(
      data,
      contextFor(specific),
      specificSwitch?.toggle?.value ?? ""
    );
    const moved = find(
      delegateAccessItems(data, contextFor(specific)),
      row => row.toggle !== undefined
    );

    expect(moved?.toggle?.checked).toBe(true);
  });

  it("whole-account access supersedes the named grants; per-object access keeps them", () => {
    const data = hostgrid();
    const specific = seeded(
      data,
      "specific delegate holding grants",
      delegate => delegate.isFullDelegate !== true && size(delegate.objects) > 0
    );
    const held = map(specific.objects, "id");

    const kept = dispatchMockAction(
      data,
      {},
      mockActionValue(
        MOCK_ACTION.DELEGATE_SET_ACCESS,
        `${specific.id}:${DelegateAccessTypes.SPECIFIC}`
      )
    );

    expect(map(delegateById(data, specific.id).objects, "id")).toEqual(held);
    expect(kept?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);

    const cleared = dispatchMockAction(
      data,
      {},
      mockActionValue(
        MOCK_ACTION.DELEGATE_SET_ACCESS,
        `${specific.id}:${DelegateAccessTypes.FULL}`
      )
    );

    expect(delegateById(data, specific.id).isFullDelegate).toBe(true);
    expect(delegateById(data, specific.id).objects).toEqual([]);
    expect(cleared?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("names the delegate it is about", () => {
    const data = hostgrid();
    const first = seeded(data, "any delegate", () => true);
    const second = seeded(
      data,
      "second delegate",
      delegate => delegate.id !== first.id
    );

    const rows = delegateSpecItems(data, contextFor(first));

    expect(rows.length).toBeGreaterThan(0);
    expect(stringsIn(rows)).toContain(first.email);
    expect(stringsIn(rows)).not.toContain(second.email);
  });
});

describe("the grant panels stand only where grants mean anything", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("hides the products and tickets panels from a whole-account delegate", () => {
    const data = hostgrid();
    const full = seeded(
      data,
      "full-access delegate",
      delegate => delegate.isFullDelegate === true
    );
    const specific = seeded(
      data,
      "specific delegate",
      delegate => delegate.isFullDelegate !== true
    );
    const products = detailRow(DATA_REF_ID.DELEGATE_PRODUCT_ITEMS);
    const tickets = detailRow(DATA_REF_ID.DELEGATE_TICKET_ITEMS);

    for (const row of [products, tickets]) {
      expect(visibleFor(row, data, contextFor(specific))).toBe(true);
      expect(visibleFor(row, data, contextFor(full))).toBe(false);
    }
  });

  it("checks a grant row where the delegate holds that object, and only there", () => {
    const data = hostgrid();
    const specific = seeded(
      data,
      "specific delegate holding grants",
      delegate => delegate.isFullDelegate !== true && size(delegate.objects) > 0
    );
    const products = delegateProductItems(data, contextFor(specific));
    const tickets = delegateTicketItems(data, contextFor(specific));

    expect(products.length).toBeGreaterThan(0);
    expect(tickets.length).toBeGreaterThan(0);
    expect(some(products, row => row.toggle?.checked === true)).toBe(true);

    for (const row of [...products, ...tickets]) {
      expect(row.toggle).toBeDefined();
      const objectId = toggledObjectId(row);
      const held =
        holdsObject(specific, DelegateObjectTypes.CONTRACT_PRODUCT, objectId) ||
        holdsObject(specific, DelegateObjectTypes.TICKET, objectId);
      expect(row.toggle?.checked).toBe(held);
    }
  });

  it("grants a ticket and takes it back through the same verb", () => {
    const data = hostgrid();
    const specific = seeded(
      data,
      "specific delegate",
      delegate => delegate.isFullDelegate !== true
    );
    const ticket = find(
      data.tickets,
      candidate =>
        !holdsObject(specific, DelegateObjectTypes.TICKET, candidate.id)
    );
    if (ticket === undefined)
      throw new Error("seed carries no ungranted ticket");
    const grant = mockActionValue(
      MOCK_ACTION.DELEGATE_TOGGLE_OBJECT,
      `${specific.id}:${DelegateObjectTypes.TICKET}:${ticket.id}`
    );

    const granted = dispatchMockAction(data, {}, grant);

    expect(
      holdsObject(
        delegateById(data, specific.id),
        DelegateObjectTypes.TICKET,
        ticket.id
      )
    ).toBe(true);
    expect(granted?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);

    const revoked = dispatchMockAction(data, {}, grant);

    expect(
      holdsObject(
        delegateById(data, specific.id),
        DelegateObjectTypes.TICKET,
        ticket.id
      )
    ).toBe(false);
    expect(revoked?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });
});

describe("inviting is a form, so the way in is the door that opens it", () => {
  it("opens the registered form from the list, and nowhere else", () => {
    const list = stringsIn(delegatePage(PAGE_KEY.ACCOUNT_DELEGATES));
    const detail = stringsIn(delegatePage(PAGE_KEY.ACCOUNT_DELEGATE_DETAIL));

    expect(list.length).toBeGreaterThan(0);
    expect(filter(list, text => /invite/i.test(text))).toContain(
      mockActionValue(MOCK_ACTION.OPEN_FORM, FORM_ID.DELEGATE_INVITE)
    );
    // The detail page manages one delegate; inviting another is the list's.
    expect(filter(detail, text => /invite/i.test(text))).toEqual([]);
  });

  it("carries no invite verb on any delegate row", () => {
    const data = hostgrid();
    const emitted = accountDelegateItems(data).flatMap(rowActionValues);

    expect(emitted.length).toBeGreaterThan(0);
    expect(filter(emitted, value => /invite/i.test(value))).toEqual([]);
  });
});
