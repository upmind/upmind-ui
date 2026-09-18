// -----------------------------------------------------------------------------
/**
 * @module tests/ticket-actions
 * @description Plan Phase 5 / gap doc §5: what a support thread SAYS and what
 * the client may do to it. The row markers, the summary rows, the status
 * banner, the four verbs (reopen, close, remove related product, delegate) and
 * the three controls whose presence is a function of the thread's own state —
 * the Manage-ticket header, the delegate picker and the reply composer.
 *
 * Every expectation is swept across the whole seed and derived from the
 * ticket's own fields, so a selector that hardwires one thread's answer
 * disagrees with the dataset rather than with a literal. The verbs run through
 * `dispatchMockAction` — the one door — so a facade that mutates without the
 * dispatcher naming a receipt fails here too.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { TicketStatusCodes } from "@upmind-automation/types";
import { rowBinding } from "./support/page-config";
import { every, filter, find, flatMap, map, size, sortBy } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockTicket } from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import { supportPages } from "~/portal/config/support-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  isDataRef,
  resolveDataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { FORM_ID } from "~/portal/mock/forms/ids";
import {
  ticketDelegateItems,
  ticketItems,
  ticketManageActions,
  ticketManageVariant,
  ticketSpecItems,
  ticketStatusMessage,
  ticketStatusTitle,
  ticketStatusTone,
  ticketTabs
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import ButtonModule from "~/portal/modules/button/Button.vue";
import { BUTTON_MODULE_VARIANT } from "~/portal/modules/button/types";
import { PAGE_KEY } from "~/portal/types";

const DELEGATED_TAG = "Delegated";

const SCHEDULED_TAG = "Scheduled";

const LOCKED_TAG = "Locked";

/** An id no seed mints — the `<prefix>-<n>` spelling every seeded id uses is deliberately not followed. */
const ABSENT_TICKET_ID = "no-such-ticket-6b1e";

function live(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function contextFor(ticketId: string): DataRouteContext {
  return { entityId: ticketId };
}

function ticketBy(
  data: MockDataset,
  trait: string,
  matches: (ticket: MockTicket) => boolean
): MockTicket {
  const ticket = find(data.tickets, matches);
  if (ticket === undefined) throw new Error(`seed carries no ${trait}`);
  return ticket;
}

function isClosed(ticket: MockTicket): boolean {
  return ticket.status === TicketStatusCodes.CLOSED;
}

function tagLabels(row: ListModuleItem): string[] {
  return map(row.tags ?? [], "label");
}

function specRow(
  rows: readonly SpecModuleItem[],
  id: string
): SpecModuleItem | undefined {
  return find(rows, { id });
}

/** The rows both status tabs show — one page each, so closed threads are swept too. */
function everyRow(data: MockDataset): ListModuleItem[] {
  return flatMap(ticketTabs(), tab => ticketItems(data, { status: tab.value }));
}

function detailPage(): ConfigNode {
  const page = supportPages()[PAGE_KEY.SUPPORT_TICKET_DETAIL];
  if (page === undefined) throw new Error("no ticket detail page config");
  return page;
}

function detailRow(refId: string): ConfigNode {
  const row = rowBinding(detailPage(), refId);
  if (row === undefined) throw new Error(`no detail row binds ${refId}`);
  return row;
}

function visibleFor(row: ConfigNode, data: MockDataset, ticketId: string) {
  const ref = row.visible;
  if (!isDataRef(ref)) throw new Error("row declares no visibility ref");
  return resolveDataRef(ref, data, contextFor(ticketId));
}

/**
 * What the client may do to this thread, read off the thread rather than off
 * the selector: reopen a closed one, close an open one, detach its product.
 * A locked thread takes no client-side change at all.
 */
/** A form door names the form it opens: two doors are two forms, not two counts. */
function formDoor(formId: string): string {
  return `${MOCK_ACTION.OPEN_FORM}:${formId}`;
}

/** What a control emits, kept only as far as it identifies the control. */
function controlToken(value: string): string {
  const [verb, tail] = value.split(":");
  if (verb === MOCK_ACTION.OPEN_FORM) return formDoor(tail ?? "");
  return verb ?? "";
}

function applicableVerbs(ticket: MockTicket): string[] {
  const verbs: string[] = [];
  if (isClosed(ticket)) verbs.push(MOCK_ACTION.TICKET_REOPEN);
  if (!isClosed(ticket) && ticket.locked !== true) {
    verbs.push(MOCK_ACTION.TICKET_CLOSE);
  }
  if (ticket.productId !== undefined && ticket.locked !== true) {
    verbs.push(MOCK_ACTION.TICKET_REMOVE_PRODUCT);
  }
  // Renaming is offered on a running thread the desk has not locked. Its
  // control OPENS the registered form rather than carrying a verb of its own
  // (plan F2), so the verb it emits is the door, not the write — and the two
  // doors are told apart by the form each names, never by how many there are.
  if (!isClosed(ticket) && ticket.locked !== true) {
    verbs.push(formDoor(FORM_ID.TICKET_SUBJECT_SAVE));
  }
  // The related-product picker is the second such door, on the same two
  // conditions — legacy's `add_related_product` / `change_related_product`,
  // one control under two labels (this seed holds products for it to list).
  if (!isClosed(ticket) && ticket.locked !== true) {
    verbs.push(formDoor(FORM_ID.TICKET_SET_PRODUCT));
  }
  return verbs;
}

/** The Manage-ticket control as the page's own header would render it. */
function mountManageControl(data: MockDataset, ticketId: string) {
  const header = detailRow(DATA_REF_ID.TICKET_SPEC_ITEMS)["header"];
  if (header === null || typeof header !== "object") {
    throw new Error("the summary row carries no header");
  }
  const actions = Reflect.get(header, "actions");
  if (actions === null || typeof actions !== "object") {
    throw new Error("the summary header carries no actions module");
  }
  const props = resolveDataRefProps(
    Reflect.get(actions, "props"),
    data,
    contextFor(ticketId)
  );
  return mount(ButtonModule, { props });
}

describe("ticket rows — the markers legacy printed beside a thread", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("carries Delegated and Scheduled exactly where the thread carries the flag", () => {
    const data = live();
    const rows = everyRow(data);

    for (const row of rows) {
      const ticket = ticketBy(data, `ticket ${row.id}`, { id: row.id });
      expect(tagLabels(row).includes(DELEGATED_TAG)).toBe(
        ticket.isDelegated === true
      );
      expect(tagLabels(row).includes(SCHEDULED_TAG)).toBe(
        ticket.scheduledAt !== undefined
      );
    }
    // Rows carrying neither marker anywhere would pass the sweep vacuously.
    const marked = map(rows, row => tagLabels(row));
    expect(
      size(filter(marked, labels => labels.includes(DELEGATED_TAG)))
    ).toBeGreaterThan(0);
    expect(
      size(filter(marked, labels => labels.includes(SCHEDULED_TAG)))
    ).toBeGreaterThan(0);
    expect(size(filter(marked, labels => size(labels) === 0))).toBeGreaterThan(
      0
    );
  });
});

describe("the summary spec — legacy's own detail panel", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("leads with the reference the client quotes, and offers to copy it", () => {
    const data = live();

    for (const ticket of data.tickets) {
      const rows = ticketSpecItems(data, contextFor(ticket.id));
      const reference = specRow(rows, "reference");

      expect(reference?.value).toBe(ticket.reference);
      expect(reference?.value).toBeTruthy();
      expect(reference?.copyable).toBe(true);
    }
    expect(size(data.tickets)).toBeGreaterThan(5);
  });

  it("states the department, and tags the status Locked only on a locked thread", () => {
    const data = live();

    for (const ticket of data.tickets) {
      const rows = ticketSpecItems(data, contextFor(ticket.id));

      expect(specRow(rows, "department")?.value).toBe(ticket.department);
      expect(specRow(rows, "status")?.tag?.label === LOCKED_TAG).toBe(
        ticket.locked === true
      );
    }
    expect(size(filter(data.tickets, { locked: true }))).toBeGreaterThan(0);
  });

  it("always dates the thread, and dates its close and names its agent only where the seed does", () => {
    const data = live();

    for (const ticket of data.tickets) {
      const rows = ticketSpecItems(data, contextFor(ticket.id));
      const created = specRow(rows, "created");

      expect(created?.value).toBeTruthy();
      expect(ticket.createdAt.startsWith(created?.value ?? "")).toBe(true);

      const closed = specRow(rows, "closed");
      expect(closed !== undefined).toBe(ticket.closedAt !== undefined);
      if (ticket.closedAt !== undefined) {
        expect(ticket.closedAt.startsWith(closed?.value ?? "")).toBe(true);
      }

      const agent = specRow(rows, "agent");
      expect(agent !== undefined).toBe(ticket.assignedAgent !== undefined);
      expect(agent?.value).toBe(ticket.assignedAgent);
    }
    expect(
      size(filter(data.tickets, ticket => ticket.closedAt !== undefined))
    ).toBeGreaterThan(0);
    expect(
      size(filter(data.tickets, ticket => ticket.assignedAgent === undefined))
    ).toBeGreaterThan(0);
  });

  it("links the related product where the thread names one, and nowhere else", () => {
    const data = live();

    for (const ticket of data.tickets) {
      const related = specRow(
        ticketSpecItems(data, contextFor(ticket.id)),
        "related-product"
      );

      expect(related !== undefined).toBe(ticket.productId !== undefined);
      if (ticket.productId !== undefined) {
        expect(related?.to).toBe(`/products/${ticket.productId}`);
      }
    }
    expect(
      size(filter(data.tickets, ticket => ticket.productId === undefined))
    ).toBeGreaterThan(0);
  });
});

describe("the status banner — an open thread and a closed one do not read alike", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("rises on a thread the dataset holds, and on nothing else", () => {
    const data = live();
    const row = detailRow(DATA_REF_ID.TICKET_STATUS_TITLE);
    const open = ticketBy(data, "open ticket", ticket => !isClosed(ticket));
    const closed = ticketBy(data, "closed ticket", isClosed);

    expect(visibleFor(row, data, open.id)).toBe(true);
    expect(visibleFor(row, data, closed.id)).toBe(true);
    expect(visibleFor(row, data, ABSENT_TICKET_ID)).toBe(false);
  });

  it("changes its tone and its words with the thread's status", () => {
    const data = live();
    const open = ticketBy(data, "open ticket", ticket => !isClosed(ticket));
    const closed = ticketBy(data, "closed ticket", isClosed);

    expect(ticketStatusTone(data, contextFor(open.id))).not.toBe(
      ticketStatusTone(data, contextFor(closed.id))
    );
    expect(ticketStatusTitle(data, contextFor(open.id))).not.toBe(
      ticketStatusTitle(data, contextFor(closed.id))
    );
    expect(ticketStatusMessage(data, contextFor(open.id))).toBeTruthy();
    expect(ticketStatusMessage(data, contextFor(closed.id))).toBeTruthy();
  });
});

describe("reopen — a closed thread only", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("puts a closed thread back with the team, with no dialog in the way", () => {
    const data = live();
    const ticket = ticketBy(data, "closed ticket", isClosed);

    const result = dispatchMockAction(
      data,
      contextFor(ticket.id),
      mockActionValue(MOCK_ACTION.TICKET_REOPEN, ticket.id)
    );

    expect(result?.confirm).toBeUndefined();
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(ticket.status).toBe(TicketStatusCodes.OPEN);
  });

  it("refuses an open thread out loud, and leaves it alone", () => {
    const data = live();
    const ticket = ticketBy(
      data,
      "open ticket",
      candidate => !isClosed(candidate)
    );
    const before = ticket.status;

    const result = dispatchMockAction(
      data,
      contextFor(ticket.id),
      mockActionValue(MOCK_ACTION.TICKET_REOPEN, ticket.id)
    );

    expect(result?.confirm).toBeUndefined();
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(ticket.status).toBe(before);
  });
});

describe("close — confirmed first, and never on a locked thread", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks before it closes, and closes only on the way back through the door", () => {
    const data = live();
    const ticket = ticketBy(
      data,
      "open unlocked ticket",
      candidate => !isClosed(candidate) && candidate.locked !== true
    );

    const asked = dispatchMockAction(
      data,
      contextFor(ticket.id),
      mockActionValue(MOCK_ACTION.TICKET_CLOSE, ticket.id)
    );

    expect(asked?.confirm?.then).toBe(
      mockActionValue(MOCK_ACTION.TICKET_CLOSE_CONFIRMED, ticket.id)
    );
    expect(asked?.toast).toBeUndefined();
    expect(ticket.status).toBe(TicketStatusCodes.OPEN);
    expect(ticket.closedAt).toBeUndefined();

    const done = dispatchMockAction(
      data,
      contextFor(ticket.id),
      asked?.confirm?.then ?? ""
    );

    expect(done?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(ticket.status).toBe(TicketStatusCodes.CLOSED);
    expect(ticket.closedAt).toBeTruthy();
  });

  it("refuses a locked thread BEFORE any dialog is raised", () => {
    const data = live();
    const ticket = ticketBy(data, "locked ticket", { locked: true });

    const result = dispatchMockAction(
      data,
      contextFor(ticket.id),
      mockActionValue(MOCK_ACTION.TICKET_CLOSE, ticket.id)
    );

    expect(result?.confirm).toBeUndefined();
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(ticket.status).not.toBe(TicketStatusCodes.CLOSED);
  });
});

describe("remove related product — the thread keeps its subject, loses its product", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("detaches the product it was raised about", () => {
    const data = live();
    const ticket = ticketBy(
      data,
      "unlocked ticket about a product",
      candidate =>
        candidate.productId !== undefined && candidate.locked !== true
    );

    const result = dispatchMockAction(
      data,
      contextFor(ticket.id),
      mockActionValue(MOCK_ACTION.TICKET_REMOVE_PRODUCT, ticket.id)
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(ticket.productId).toBeUndefined();
    expect(
      specRow(ticketSpecItems(data, contextFor(ticket.id)), "related-product")
    ).toBeUndefined();
  });

  it("refuses on a locked thread, and the product stays put", () => {
    const data = live();
    const ticket = ticketBy(data, "locked ticket with a product", {
      locked: true
    });
    const before = ticket.productId;
    expect(before).toBeDefined();

    const result = dispatchMockAction(
      data,
      contextFor(ticket.id),
      mockActionValue(MOCK_ACTION.TICKET_REMOVE_PRODUCT, ticket.id)
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(ticket.productId).toBe(before);
  });
});

describe("delegate access — somebody else may read this thread", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks first, then shares — through the value the picker row emits", () => {
    const data = live();
    const ticket = ticketBy(
      data,
      "open undelegated ticket",
      candidate => !isClosed(candidate) && candidate.isDelegated !== true
    );
    const picker = ticketDelegateItems(data, contextFor(ticket.id));
    const chosen = picker[0];
    if (chosen?.action === undefined) throw new Error("no delegate to offer");

    // ONE PAGE of the account's delegates, not all of them — the picker used
    // to render every row in one column, 24 deep on this seed.
    expect(size(picker)).toBeLessThan(size(data.delegates));
    expect(
      every(picker, row => find(data.delegates, { id: row.id }) !== undefined)
    ).toBe(true);

    const asked = dispatchMockAction(
      data,
      contextFor(ticket.id),
      chosen.action.value
    );

    expect(asked?.confirm?.then).toBe(
      mockActionValue(
        MOCK_ACTION.TICKET_DELEGATE_CONFIRMED,
        `${ticket.id}:${chosen.id}`
      )
    );
    expect(ticket.isDelegated).not.toBe(true);

    const done = dispatchMockAction(
      data,
      contextFor(ticket.id),
      asked?.confirm?.then ?? ""
    );

    expect(done?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(ticket.isDelegated).toBe(true);
  });

  it("refuses a thread that is already shared", () => {
    const data = live();
    const ticket = ticketBy(data, "delegated ticket", { isDelegated: true });
    const delegate = data.delegates[0];
    if (delegate === undefined) throw new Error("seed carries no delegate");

    const result = dispatchMockAction(
      data,
      contextFor(ticket.id),
      mockActionValue(
        MOCK_ACTION.TICKET_DELEGATE,
        `${ticket.id}:${delegate.id}`
      )
    );

    expect(result?.confirm).toBeUndefined();
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
  });

  it("refuses a closed thread — there is nothing left to give access to", () => {
    const data = live();
    const ticket = ticketBy(data, "closed ticket", isClosed);
    const delegate = data.delegates[0];
    if (delegate === undefined) throw new Error("seed carries no delegate");

    const result = dispatchMockAction(
      data,
      contextFor(ticket.id),
      mockActionValue(
        MOCK_ACTION.TICKET_DELEGATE,
        `${ticket.id}:${delegate.id}`
      )
    );

    expect(result?.confirm).toBeUndefined();
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(ticket.isDelegated).not.toBe(true);
  });
});

describe("the Manage-ticket control — its form follows how much there is to do", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("offers exactly the verbs the thread's own state admits", () => {
    const data = live();

    for (const ticket of data.tickets) {
      const offered = map(
        ticketManageActions(data, contextFor(ticket.id)),
        action => controlToken(action.value)
      );

      expect(sortBy(offered)).toEqual(sortBy(applicableVerbs(ticket)));
    }
  });

  it("is a dropdown above one verb and a group at exactly one", () => {
    const data = live();
    const many = ticketBy(
      data,
      "ticket with two verbs",
      ticket => size(applicableVerbs(ticket)) > 1
    );
    const one = ticketBy(
      data,
      "ticket with one verb",
      ticket => size(applicableVerbs(ticket)) === 1
    );

    expect(ticketManageVariant(data, contextFor(many.id))).toBe(
      BUTTON_MODULE_VARIANT.DROPDOWN
    );
    expect(ticketManageVariant(data, contextFor(one.id))).toBe(
      BUTTON_MODULE_VARIANT.GROUP
    );
  });

  it("renders no control at all on a thread that admits none", () => {
    const data = live();
    const none = ticketBy(
      data,
      "ticket with no verbs",
      ticket => size(applicableVerbs(ticket)) === 0
    );
    const one = ticketBy(
      data,
      "ticket with one verb",
      ticket => size(applicableVerbs(ticket)) === 1
    );

    expect(mountManageControl(data, none.id).find("button").exists()).toBe(
      false
    );
    expect(mountManageControl(data, one.id).find("button").exists()).toBe(true);
  });
});

describe("the panels that come and go with the thread's state", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("shows the delegate picker only while the thread is open and unshared", () => {
    const data = live();
    const row = detailRow(DATA_REF_ID.TICKET_DELEGATE_ITEMS);

    for (const ticket of data.tickets) {
      expect(visibleFor(row, data, ticket.id)).toBe(
        !isClosed(ticket) && ticket.isDelegated !== true
      );
    }
  });

  it("takes the reply composer away once the thread is closed", () => {
    const data = live();
    const row = detailRow(DATA_REF_ID.TICKET_IS_OPEN);
    const ticket = ticketBy(
      data,
      "open unlocked ticket",
      candidate => !isClosed(candidate) && candidate.locked !== true
    );

    expect(visibleFor(row, data, ticket.id)).toBe(true);

    dispatchMockAction(
      data,
      contextFor(ticket.id),
      mockActionValue(MOCK_ACTION.TICKET_CLOSE_CONFIRMED, ticket.id)
    );

    expect(visibleFor(row, data, ticket.id)).toBe(false);
  });
});
