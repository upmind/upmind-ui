// -----------------------------------------------------------------------------
/**
 * @module tests/fifth-closure
 * @description Phase F9: what a client may do to their OWN words, and what the
 * brand has already filed against their credit. A message the persona wrote
 * can be rewritten, withdrawn and stripped of one named file — each behind a
 * guard the door answers BEFORE it offers a dialog (C1, C2, C3, C4, C5); the
 * closed-off credit periods read as a panel, a print view and a CSV (C6); the
 * composer's own keys answer the brand until the client says otherwise (C7);
 * and the pay dialog's credit bound is the same bound the write applies (C8).
 *
 * Every figure is read off a facade output or off the seed — no amount is
 * added up here (plan R6) — and each gate is graded on BOTH seeds, or on the
 * seed plus the same seed with that one fact moved (plan R9). The minimal seed
 * carries no threads and no credit limit, so its branch is "nothing offered".
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { propsBinding } from "./support/page-config";
import {
  cloneDeep,
  find,
  first,
  flatMap,
  get,
  last,
  map,
  size,
  some,
  sortBy
} from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockDataset,
  MockTicket,
  MockTicketMessage
} from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import type { PageKey } from "~/portal/types";
import { billingPages } from "~/portal/config/billing-pages";
import {
  MOCK_ACTION,
  MOCK_DOCUMENT_KIND,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { NEW_LINE_KEY } from "~/portal/mock/contracts/client-tickets";
import * as ticketSchemas from "~/portal/mock/contracts/client-tickets.schemas";
import {
  DATA_REF_ID,
  dataRef,
  isDataRef,
  resolveDataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  MOCK_RECEIPT_REASON,
  composerSubmitKey,
  isTicketClosed,
  isTicketLocked,
  newLineKey,
  submitsWithShortcut,
  useMockTicket,
  useMockWallet
} from "~/portal/mock/facades";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_ENTER_KEY_ACTION } from "~/portal/mock/types";
import Composer from "~/portal/modules/composer/Composer.vue";
import { COMPOSER_SUBMIT_KEY } from "~/portal/modules/composer/types";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

/** The open thread the seed gives a client message with a file named on it. */
const OPEN_THREAD_ID = "tkt-208";

/** The closed thread carrying the same shape — a client message with a file. */
const CLOSED_THREAD_ID = "tkt-198";

const SEEDED_MESSAGE_ID = "msg-1";

const OPEN_ATTACHMENT = "invoice-0093.pdf";

const CLOSED_ATTACHMENT = "accounts-request.pdf";

/** A file name no message names — the attachment guard's own missing subject. */
const ABSENT_ATTACHMENT = "nothing-of-the-sort.pdf";

/** An id no seed mints, in neither seeded spelling. */
const ABSENT_MESSAGE_ID = "msg-no-such-4d71";

const REWRITTEN = "The PDF still cuts the VAT number off at the margin.";

const TWO_FILES = "first.log, second.log";

const TWO_FILE_NAMES = ["first.log", "second.log"];

const REPLY_BODY = "Both logs are attached.";

const CSV_COLUMNS = ["Date", "Description", "Amount", "Balance"];

/** How many pages of a thread hold the seed's longest one whole. */
const WHOLE_THREAD = "2";

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

/** The seed with no threads, no statements and no credit limit. */
function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
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

function ticketById(data: MockDataset, id: string): MockTicket {
  return ticketBy(data, `thread ${id}`, candidate => candidate.id === id);
}

function messageOn(
  data: MockDataset,
  ticketId: string,
  messageId: string
): MockTicketMessage {
  const message = find(ticketById(data, ticketId).messages, { id: messageId });
  if (message === undefined) {
    throw new Error(`thread ${ticketId} carries no ${messageId}`);
  }
  return message;
}

function threadActions(data: MockDataset, ticketId: string) {
  return useMockTicket(data, ticketId).useActions();
}

/** The three guards, as the codes they answer with — undefined where they allow it. */
function refusalReasons(
  data: MockDataset,
  ticketId: string,
  messageId: string,
  attachment: string
): (string | undefined)[] {
  const actions = threadActions(data, ticketId);
  return [
    actions.whyNotEditable(messageId)?.reason,
    actions.whyNotDeletable(messageId)?.reason,
    actions.whyNotAttachmentRemovable(messageId, attachment)?.reason
  ];
}

/**
 * Every message of a thread, drawn. The feed stops at one page and offers the
 * rest (plan F16 O-7), and the seed's longest thread sits inside two, so the
 * page is asked for here rather than grading the menu on a partial thread.
 */
function messageRows(data: MockDataset, ticketId: string): ListModuleItem[] {
  return (
    ref<ListModuleItem[]>(data, DATA_REF_ID.TICKET_MESSAGE_ITEMS, {
      entityId: ticketId,
      page: WHOLE_THREAD
    }) ?? []
  );
}

function rowFor(
  data: MockDataset,
  ticketId: string,
  messageId: string
): ListModuleItem {
  const row = find(messageRows(data, ticketId), { id: messageId });
  if (row === undefined) throw new Error(`no rendered row for ${messageId}`);
  return row;
}

function offered(row: ListModuleItem): string[] {
  return map(row.moreActions ?? [], "value");
}

function editValue(ticketId: string, messageId: string): string {
  return mockActionValue(
    MOCK_ACTION.OPEN_FORM,
    `${FORM_ID.TICKET_MESSAGE_EDIT}:${ticketId}:${messageId}`
  );
}

function deleteValue(messageId: string): string {
  return mockActionValue(MOCK_ACTION.TICKET_MESSAGE_DELETE, messageId);
}

function removeFileValue(messageId: string, name: string): string {
  return mockActionValue(
    MOCK_ACTION.TICKET_ATTACHMENT_DELETE,
    `${messageId}:${name}`
  );
}

function refusalOf(reason: keyof typeof MOCK_REFUSAL_MESSAGE): string {
  return MOCK_REFUSAL_MESSAGE[reason];
}

function payload(verb: string, model: unknown): string {
  return `${verb}:${JSON.stringify(model)}`;
}

/** What the thread's own menu offers on a message, by the contract's own rule. */
function expectedEntries(
  ticket: MockTicket,
  message: MockTicketMessage
): string[] {
  const manageable =
    !isTicketClosed(ticket) &&
    !isTicketLocked(ticket) &&
    message.isDeleted !== true &&
    message.authorType === "client";
  if (!manageable) return [];
  return [
    editValue(ticket.id, message.id),
    deleteValue(message.id),
    ...map(message.attachments ?? [], name => removeFileValue(message.id, name))
  ];
}

// -----------------------------------------------------------------------------
// C1 — the menu on a message the client wrote
// -----------------------------------------------------------------------------

describe("C1 — what the thread offers on each message", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("offers Edit, Delete and one Remove per file on the client's own open message", () => {
    const data = hostgrid();
    const ticket = ticketById(data, OPEN_THREAD_ID);
    const message = messageOn(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID);

    expect(message.authorType).toBe("client");
    expect(message.attachments).toEqual([OPEN_ATTACHMENT]);
    expect(isTicketClosed(ticket)).toBe(false);
    expect(isTicketLocked(ticket)).toBe(false);
    expect(offered(rowFor(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID))).toEqual([
      editValue(OPEN_THREAD_ID, SEEDED_MESSAGE_ID),
      deleteValue(SEEDED_MESSAGE_ID),
      removeFileValue(SEEDED_MESSAGE_ID, OPEN_ATTACHMENT)
    ]);
  });

  it("offers nothing on the same shape once the thread is finished", () => {
    const data = hostgrid();
    const message = messageOn(data, CLOSED_THREAD_ID, SEEDED_MESSAGE_ID);

    expect(isTicketClosed(ticketById(data, CLOSED_THREAD_ID))).toBe(true);
    expect(message.authorType).toBe("client");
    expect(message.attachments).toEqual([CLOSED_ATTACHMENT]);
    expect(offered(rowFor(data, CLOSED_THREAD_ID, SEEDED_MESSAGE_ID))).toEqual(
      []
    );
  });

  it("offers nothing on a message the desk wrote, on an open thread", () => {
    const data = hostgrid();
    const thread = ticketBy(
      data,
      "open, unlocked thread the desk has answered",
      candidate =>
        !isTicketClosed(candidate) &&
        !isTicketLocked(candidate) &&
        find(candidate.messages, { authorType: "agent" }) !== undefined
    );
    const staff = find(thread.messages, { authorType: "agent" });
    const own = find(thread.messages, { authorType: "client" });

    expect(offered(rowFor(data, thread.id, staff?.id ?? ""))).toEqual([]);
    // …and the same thread still offers the client their own message, so the
    // silence is about authorship rather than about the thread.
    expect(offered(rowFor(data, thread.id, own?.id ?? ""))).not.toEqual([]);
  });

  it("offers nothing on a thread the desk has locked", () => {
    const data = hostgrid();
    const locked = ticketBy(
      data,
      "desk-locked thread that is still open",
      candidate => isTicketLocked(candidate) && !isTicketClosed(candidate)
    );

    expect(map(messageRows(data, locked.id), row => offered(row))).toEqual(
      map(locked.messages, () => [])
    );
  });

  it("follows the same rule on every seeded message of every thread", () => {
    const data = hostgrid();

    for (const ticket of data.tickets) {
      for (const message of ticket.messages) {
        expect(offered(rowFor(data, ticket.id, message.id))).toEqual(
          expectedEntries(ticket, message)
        );
      }
    }
    // The rule discriminates on this seed rather than answering one way.
    expect(
      some(
        flatMap(data.tickets, ticket =>
          map(ticket.messages, message => expectedEntries(ticket, message))
        ),
        entries => size(entries) > 0
      )
    ).toBe(true);
  });

  it("offers nothing at all on the seed that carries no threads", () => {
    const bare = minimal();

    expect(bare.tickets).toEqual([]);
    expect(messageRows(bare, OPEN_THREAD_ID)).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// C2 — the guards, asked before any dialog is offered
// -----------------------------------------------------------------------------

describe("C2 — why a message cannot be touched", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("allows all three on the client's own message, on an open thread", () => {
    const data = hostgrid();

    expect(
      refusalReasons(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID, OPEN_ATTACHMENT)
    ).toEqual([undefined, undefined, undefined]);
  });

  it("answers ALREADY_CLOSED on a finished thread", () => {
    const data = hostgrid();

    expect(
      refusalReasons(
        data,
        CLOSED_THREAD_ID,
        SEEDED_MESSAGE_ID,
        CLOSED_ATTACHMENT
      )
    ).toEqual([
      MOCK_RECEIPT_REASON.ALREADY_CLOSED,
      MOCK_RECEIPT_REASON.ALREADY_CLOSED,
      MOCK_RECEIPT_REASON.ALREADY_CLOSED
    ]);
  });

  it("answers LOCKED while the desk holds the thread", () => {
    const data = hostgrid();
    const locked = ticketBy(
      data,
      "desk-locked thread that is still open",
      candidate => isTicketLocked(candidate) && !isTicketClosed(candidate)
    );
    const own = find(locked.messages, { authorType: "client" });

    expect(
      refusalReasons(
        data,
        locked.id,
        own?.id ?? "",
        first(own?.attachments ?? []) ?? ABSENT_ATTACHMENT
      )
    ).toEqual([
      MOCK_RECEIPT_REASON.LOCKED,
      MOCK_RECEIPT_REASON.LOCKED,
      MOCK_RECEIPT_REASON.LOCKED
    ]);
  });

  it("answers NOT_PERMITTED on a message somebody else wrote", () => {
    const data = hostgrid();
    const thread = ticketBy(
      data,
      "open, unlocked thread the desk has answered",
      candidate =>
        !isTicketClosed(candidate) &&
        !isTicketLocked(candidate) &&
        find(candidate.messages, { authorType: "agent" }) !== undefined
    );
    const staff = find(thread.messages, { authorType: "agent" });

    expect(
      refusalReasons(data, thread.id, staff?.id ?? "", ABSENT_ATTACHMENT)
    ).toEqual([
      MOCK_RECEIPT_REASON.NOT_PERMITTED,
      MOCK_RECEIPT_REASON.NOT_PERMITTED,
      MOCK_RECEIPT_REASON.NOT_PERMITTED
    ]);
  });

  it("answers ALREADY_DELETED once the client has withdrawn it", () => {
    const data = hostgrid();

    threadActions(data, OPEN_THREAD_ID).deleteMessage(SEEDED_MESSAGE_ID);

    expect(messageOn(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID).isDeleted).toBe(
      true
    );
    expect(
      refusalReasons(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID, OPEN_ATTACHMENT)
    ).toEqual([
      MOCK_RECEIPT_REASON.ALREADY_DELETED,
      MOCK_RECEIPT_REASON.ALREADY_DELETED,
      MOCK_RECEIPT_REASON.ALREADY_DELETED
    ]);
  });

  it("answers NOT_FOUND for a message this thread does not hold", () => {
    const data = hostgrid();

    expect(
      refusalReasons(data, OPEN_THREAD_ID, ABSENT_MESSAGE_ID, OPEN_ATTACHMENT)
    ).toEqual([
      MOCK_RECEIPT_REASON.NOT_FOUND,
      MOCK_RECEIPT_REASON.NOT_FOUND,
      MOCK_RECEIPT_REASON.NOT_FOUND
    ]);
  });

  it("answers NOT_FOUND for a file the message does not name", () => {
    const data = hostgrid();

    expect(
      threadActions(data, OPEN_THREAD_ID).whyNotAttachmentRemovable(
        SEEDED_MESSAGE_ID,
        ABSENT_ATTACHMENT
      )?.reason
    ).toBe(MOCK_RECEIPT_REASON.NOT_FOUND);
  });

  it.each([
    ["editing", editValue(CLOSED_THREAD_ID, SEEDED_MESSAGE_ID)],
    ["deleting", deleteValue(SEEDED_MESSAGE_ID)],
    ["removing a file", removeFileValue(SEEDED_MESSAGE_ID, CLOSED_ATTACHMENT)]
  ])("refuses %s at the door, before any confirm or form", (_door, value) => {
    const data = hostgrid();
    const stood = JSON.stringify(data);

    const result = dispatchMockAction(
      data,
      { entityId: CLOSED_THREAD_ID },
      value
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(result?.toast?.title).toBe(
      refusalOf(MOCK_RECEIPT_REASON.ALREADY_CLOSED)
    );
    expect(result?.confirm).toBeUndefined();
    expect(result?.form).toBeUndefined();
    expect(JSON.stringify(data)).toBe(stood);
  });

  it("withholds the edit form itself wherever a guard refuses", () => {
    const data = hostgrid();

    expect(
      resolveMockForm(
        data,
        FORM_ID.TICKET_MESSAGE_EDIT,
        `${CLOSED_THREAD_ID}:${SEEDED_MESSAGE_ID}`
      )
    ).toBeUndefined();
    expect(
      resolveMockForm(
        data,
        FORM_ID.TICKET_MESSAGE_EDIT,
        `${OPEN_THREAD_ID}:${SEEDED_MESSAGE_ID}`
      )
    ).toBeDefined();
  });
});

// -----------------------------------------------------------------------------
// C3 — rewriting what was said
// -----------------------------------------------------------------------------

describe("C3 — the client rewrites their own message", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("opens the registered form on the body as it reads now, and insists on one", () => {
    const data = hostgrid();
    const message = messageOn(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID);

    const opened = dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      editValue(OPEN_THREAD_ID, SEEDED_MESSAGE_ID)
    );
    const entry = resolveMockForm(
      data,
      FORM_ID.TICKET_MESSAGE_EDIT,
      `${OPEN_THREAD_ID}:${SEEDED_MESSAGE_ID}`
    );

    expect(opened?.form).toEqual({
      id: FORM_ID.TICKET_MESSAGE_EDIT,
      entityId: `${OPEN_THREAD_ID}:${SEEDED_MESSAGE_ID}`
    });
    expect(entry?.schema).toEqual(ticketSchemas.useMessageSchema());
    expect(entry?.model).toEqual(
      ticketSchemas.messageDefaults({ body: message.body })
    );
    expect(get(entry?.schema, "required")).toEqual(["body"]);
    expect(entry?.submit).toBe(
      `${MOCK_ACTION.TICKET_MESSAGE_EDIT}:${SEEDED_MESSAGE_ID}`
    );
  });

  it("refuses a body rewritten to nothing, and leaves what was said", () => {
    const data = hostgrid();
    const stood = messageOn(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID).body;

    const result = dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      payload(`${MOCK_ACTION.TICKET_MESSAGE_EDIT}:${SEEDED_MESSAGE_ID}`, {
        body: "   "
      })
    );

    const message = messageOn(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(result?.toast?.title).toBe(
      refusalOf(MOCK_RECEIPT_REASON.EMPTY_MESSAGE)
    );
    expect(message.body).toBe(stood);
    expect(message.editedAt).toBeUndefined();
  });

  it("replaces the body, stamps the edit, and tells the client nothing about it", () => {
    const data = hostgrid();
    const original = messageOn(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID).body;

    const result = dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      payload(`${MOCK_ACTION.TICKET_MESSAGE_EDIT}:${SEEDED_MESSAGE_ID}`, {
        body: REWRITTEN
      })
    );

    const message = messageOn(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID);
    const row = rowFor(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(message.body).toBe(REWRITTEN);
    expect(message.body).not.toBe(original);
    expect(message.editedAt).toBeDefined();
    expect(message.attachments).toEqual([OPEN_ATTACHMENT]);
    // Legacy marked an edit for STAFF only, so the client's own thread says
    // nothing about it while the stamp sits on the data.
    expect(row.description).toContain(REWRITTEN);
    expect(JSON.stringify(row)).not.toMatch(/edited/i);
  });
});

// -----------------------------------------------------------------------------
// C4 — withdrawing a message
// -----------------------------------------------------------------------------

describe("C4 — the client withdraws their own message", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks first, and writes nothing until the answer comes back", () => {
    const data = hostgrid();
    const stood = JSON.stringify(data);

    const result = dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      deleteValue(SEEDED_MESSAGE_ID)
    );

    expect(result?.confirm?.then).toBe(
      `${MOCK_ACTION.TICKET_MESSAGE_DELETE_CONFIRMED}:${SEEDED_MESSAGE_ID}`
    );
    expect(result?.confirm?.destructive).toBe(true);
    expect(result?.toast).toBeUndefined();
    expect(JSON.stringify(data)).toBe(stood);
  });

  it("prints a notice where the body was, and keeps what it said readable", () => {
    const data = hostgrid();
    const original = messageOn(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID).body;

    dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      `${MOCK_ACTION.TICKET_MESSAGE_DELETE_CONFIRMED}:${SEEDED_MESSAGE_ID}`
    );

    const message = messageOn(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID);
    const row = rowFor(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID);
    const viewValue = mockActionValue(
      MOCK_ACTION.TICKET_MESSAGE_VIEW_DELETED,
      SEEDED_MESSAGE_ID
    );
    expect(message.isDeleted).toBe(true);
    expect(message.body).toBe(original);
    expect(row.description).not.toContain(original);
    expect(row.description).toBeTruthy();
    expect(offered(row)).toEqual([viewValue]);

    const read = dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      viewValue
    );
    expect(read?.prose?.markdown).toContain(original);
    expect(read?.prose?.title).toBeTruthy();
  });

  it("refuses a second withdrawal, before the question is asked again", () => {
    const data = hostgrid();

    dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      `${MOCK_ACTION.TICKET_MESSAGE_DELETE_CONFIRMED}:${SEEDED_MESSAGE_ID}`
    );
    const stood = JSON.stringify(data);
    const again = dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      deleteValue(SEEDED_MESSAGE_ID)
    );

    expect(again?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(again?.toast?.title).toBe(
      refusalOf(MOCK_RECEIPT_REASON.ALREADY_DELETED)
    );
    expect(again?.confirm).toBeUndefined();
    expect(JSON.stringify(data)).toBe(stood);
  });
});

// -----------------------------------------------------------------------------
// C5 — taking one named file off a message
// -----------------------------------------------------------------------------

describe("C5 — one file, off one message", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  function postTwoFiles(data: MockDataset): MockTicketMessage {
    dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      payload(MOCK_ACTION.REPLY_TICKET, {
        body: REPLY_BODY,
        attachments: TWO_FILES
      })
    );
    const posted = last(ticketById(data, OPEN_THREAD_ID).messages);
    if (posted === undefined) throw new Error("the reply was not recorded");
    return posted;
  }

  it("asks first, then removes exactly the file it named", () => {
    const data = hostgrid();
    const posted = postTwoFiles(data);
    const [going, staying] = TWO_FILE_NAMES;

    const asked = dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      removeFileValue(posted.id, going ?? "")
    );
    expect(posted.attachments).toEqual(TWO_FILE_NAMES);
    expect(asked?.confirm?.then).toBe(
      `${MOCK_ACTION.TICKET_ATTACHMENT_DELETE_CONFIRMED}:${posted.id}:${going ?? ""}`
    );

    const done = dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      asked?.confirm?.then ?? ""
    );

    expect(done?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(messageOn(data, OPEN_THREAD_ID, posted.id).attachments).toEqual([
      staying
    ]);
    // The message the seed named a file on keeps it — one removal, one message.
    expect(
      messageOn(data, OPEN_THREAD_ID, SEEDED_MESSAGE_ID).attachments
    ).toEqual([OPEN_ATTACHMENT]);
  });

  it("refuses a file the message does not name, and removes none of them", () => {
    const data = hostgrid();
    const posted = postTwoFiles(data);
    const stood = JSON.stringify(data);

    const result = dispatchMockAction(
      data,
      { entityId: OPEN_THREAD_ID },
      removeFileValue(posted.id, ABSENT_ATTACHMENT)
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(result?.toast?.title).toBe(refusalOf(MOCK_RECEIPT_REASON.NOT_FOUND));
    expect(result?.confirm).toBeUndefined();
    expect(JSON.stringify(data)).toBe(stood);
  });
});

// -----------------------------------------------------------------------------
// C6 — the periods the brand has closed off
// -----------------------------------------------------------------------------

function statementViews(data: MockDataset) {
  return useMockWallet(data).useContext().data.value.statements;
}

function statementView(data: MockDataset, id: string) {
  const statement = find(statementViews(data), { id });
  if (statement === undefined) throw new Error(`no statement ${id}`);
  return statement;
}

/** The page row whose presence hangs on a ref — the config's own wiring. */
function gateOf(pageKey: PageKey, refId: DataRefId) {
  const rows: ConfigNode[] = get(billingPages()[pageKey], "rows", []);
  const row = find(rows, candidate => {
    const gate = candidate["visible"];
    return isDataRef(gate) && gate.id === refId;
  });
  const gate = row?.["visible"];
  if (!isDataRef(gate)) throw new Error(`no row gated on ${refId}`);
  return gate;
}

function csvRows(href: string): string[][] {
  const body = decodeURIComponent(href.slice(href.indexOf(",") + 1));
  return map(body.split("\n"), line =>
    map(line.split('","'), cell => cell.replace(/^"|"$/g, ""))
  );
}

describe("C6 — credit statements, filed and readable", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("lists the periods the seed filed, each with its four figures", () => {
    const data = hostgrid();
    const seeded = data.wallet.statements ?? [];

    const views = statementViews(data);

    expect(map(views, "id")).toEqual(map(seeded, "id"));
    for (const view of views) {
      for (const figure of [
        view.opening,
        view.credits,
        view.debits,
        view.closing
      ]) {
        expect(typeof figure.amount).toBe("number");
        expect(figure.currency).toBe(first(data.wallet.balances)?.currency);
        expect(figure.formatted).toBeTruthy();
      }
      expect(view.movements.length).toBeGreaterThan(0);
    }
  });

  it("closes each period where the next one opens", () => {
    const data = hostgrid();
    const inOrder = sortBy(statementViews(data), "fromDate");

    expect(inOrder.length).toBeGreaterThan(1);
    for (const [index, period] of inOrder.entries()) {
      const next = inOrder[index + 1];
      if (next === undefined) continue;
      expect(period.closing).toEqual(next.opening);
    }
  });

  it("shows the panel only to an account the brand grants an allowance", () => {
    const granted = hostgrid();
    const bare = minimal();
    const withdrawn = cloneDeep(granted);
    Reflect.deleteProperty(withdrawn.wallet, "creditLimit");
    const gate = gateOf(
      PAGE_KEY.BILLING_CREDIT,
      DATA_REF_ID.WALLET_HAS_CREDIT_STATEMENTS
    );

    expect(granted.wallet.creditLimit).toBeDefined();
    expect(bare.wallet.creditLimit).toBeUndefined();
    expect(resolveDataRef(gate, granted)).toBe(true);
    expect(resolveDataRef(gate, bare)).toBe(false);
    expect(resolveDataRef(gate, withdrawn)).toBe(false);
    expect(
      ref<ListModuleItem[]>(bare, DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS)
    ).toEqual([]);
  });

  it("prints one period on its own page, carrying the same figures", () => {
    const data = hostgrid();
    const statement = first(statementViews(data));
    const page = billingPages()[PAGE_KEY.BILLING_CREDIT_STATEMENT_PRINT];

    const opened = dispatchMockAction(
      data,
      NO_CONTEXT,
      `${MOCK_ACTION.DOWNLOAD}:${MOCK_DOCUMENT_KIND.CREDIT_STATEMENT}:${statement?.id ?? ""}`
    );

    expect(opened?.to).toBe(
      `/billing/credit-statements/${statement?.id ?? ""}/print`
    );
    expect(
      propsBinding(page, DATA_REF_ID.CREDIT_STATEMENT_SPEC_ITEMS)
    ).toBeDefined();
    expect(
      propsBinding(page, DATA_REF_ID.CREDIT_STATEMENT_MOVEMENT_ITEMS)
    ).toBeDefined();

    const spec = ref<SpecModuleItem[]>(
      data,
      DATA_REF_ID.CREDIT_STATEMENT_SPEC_ITEMS,
      { entityId: statement?.id }
    );
    const movements = ref<ListModuleItem[]>(
      data,
      DATA_REF_ID.CREDIT_STATEMENT_MOVEMENT_ITEMS,
      { entityId: statement?.id }
    );

    expect(map(spec, "value")).toEqual(
      expect.arrayContaining([
        statement?.opening.formatted,
        statement?.credits.formatted,
        statement?.debits.formatted,
        statement?.closing.formatted
      ])
    );
    expect(map(movements, "id")).toEqual(map(statement?.movements, "id"));
    expect(map(movements, row => map(row.cells, "value"))).toEqual(
      map(statement?.movements, movement => [
        movement.date,
        movement.amount.formatted,
        movement.balanceAfter.formatted
      ])
    );
  });

  it("hands over the period as a CSV that closes on the closing figure", () => {
    const data = hostgrid();
    const statement = statementView(data, "cs-2026-07");

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.CREDIT_STATEMENT_CSV, statement.id)
    );
    const href = result?.href ?? "";
    const rows = csvRows(href);

    expect(href.startsWith("data:text/csv")).toBe(true);
    expect(href).toBe(
      useMockWallet(data).useActions().statementFile(statement.id)?.entity?.href
    );
    expect(first(rows)).toEqual(CSV_COLUMNS);
    expect(rows.length).toBe(size(statement.movements) + 1);
    for (const row of rows.slice(1)) {
      const movement = find(statement.movements, { date: row[0] });
      expect(movement).toBeDefined();
      expect(row[1]).toBe(movement?.description);
      expect(row[2]).toBe(String(movement?.amount.amount));
      expect(row[3]).toBe(String(movement?.balanceAfter.amount));
    }
    expect(last(rows)?.[3]).toBe(String(statement.closing.amount));
  });

  it("refuses a period the brand never filed, out loud and with no file", () => {
    const data = hostgrid();
    const stood = JSON.stringify(data);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.CREDIT_STATEMENT_CSV, "cs-1999-01")
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(result?.toast?.title).toBeTruthy();
    expect(result?.href).toBeUndefined();
    expect(JSON.stringify(data)).toBe(stood);
  });
});

// -----------------------------------------------------------------------------
// C7 — what the keys do in the reply box
// -----------------------------------------------------------------------------

function preferencesForm(data: MockDataset) {
  return resolveMockForm(data, FORM_ID.SUPPORT_PREFERENCES, undefined);
}

function savePreferences(data: MockDataset, model: object) {
  return dispatchMockAction(
    data,
    NO_CONTEXT,
    payload(MOCK_ACTION.SUPPORT_PREFERENCES_SAVE, model)
  );
}

async function driveComposer(
  data: MockDataset,
  key: { key: string; shiftKey?: boolean }
): Promise<number> {
  const wrapper = mount(Composer, {
    props: {
      label: "Your reply",
      submitLabel: "Send reply",
      action: MOCK_ACTION.REPLY_TICKET,
      attachmentsLabel: "Attachments",
      optionsLabel: "Post options",
      optionsValue: mockActionValue(
        MOCK_ACTION.OPEN_FORM,
        FORM_ID.SUPPORT_PREFERENCES
      ),
      submitWithShortcut: ref<boolean>(
        data,
        DATA_REF_ID.TICKET_COMPOSER_SUBMITS_WITH_SHORTCUT
      ),
      submitKey: ref<string>(data, DATA_REF_ID.TICKET_COMPOSER_SUBMIT_KEY)
    }
  });
  await wrapper.find("textarea").setValue(REPLY_BODY);
  await wrapper.find("textarea").trigger("keydown", key);
  return size(wrapper.emitted("select"));
}

describe("C7 — the new-line key, the send key, and who decides", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("asks both questions, opening on the key the brand's own setting seeds", () => {
    const sends = hostgrid();
    const opens = minimal();

    expect(
      Object.keys(get(preferencesForm(sends), "schema.properties", {}))
    ).toEqual(["newLineKey", "submitWithShortcut"]);
    expect(
      get(preferencesForm(sends), "schema.properties.newLineKey.enum")
    ).toEqual([NEW_LINE_KEY.ENTER, NEW_LINE_KEY.SHIFT_ENTER]);
    expect(get(preferencesForm(sends), "schema.required")).toContain(
      "newLineKey"
    );

    expect(sends.features.UI_ENTER_KEY_ACTION).toBe(
      MOCK_ENTER_KEY_ACTION.SUBMIT
    );
    expect(newLineKey(sends)).toBe(NEW_LINE_KEY.SHIFT_ENTER);
    expect(get(preferencesForm(sends), "model.newLineKey")).toBe(
      NEW_LINE_KEY.SHIFT_ENTER
    );

    expect(opens.features.UI_ENTER_KEY_ACTION).toBe(
      MOCK_ENTER_KEY_ACTION.NEWLINE
    );
    expect(newLineKey(opens)).toBe(NEW_LINE_KEY.ENTER);
    expect(get(preferencesForm(opens), "model.newLineKey")).toBe(
      NEW_LINE_KEY.ENTER
    );
  });

  it("sends on the OTHER key, on each seed, while the shortcut is on", async () => {
    for (const data of [hostgrid(), minimal()]) {
      savePreferences(data, {
        submitWithShortcut: true,
        newLineKey: newLineKey(data)
      });
      const startsLine = newLineKey(data);
      const sendsOnShift = startsLine === NEW_LINE_KEY.ENTER;

      expect(composerSubmitKey(data)).toBe(
        sendsOnShift
          ? COMPOSER_SUBMIT_KEY.SHIFT_ENTER
          : COMPOSER_SUBMIT_KEY.ENTER
      );
      expect(
        await driveComposer(data, { key: "Enter", shiftKey: sendsOnShift })
      ).toBe(1);
      expect(
        await driveComposer(data, { key: "Enter", shiftKey: !sendsOnShift })
      ).toBe(0);
    }
  });

  it("sends on no key at all while the shortcut is off", async () => {
    for (const data of [hostgrid(), minimal()]) {
      savePreferences(data, {
        submitWithShortcut: false,
        newLineKey: newLineKey(data)
      });

      expect(submitsWithShortcut(data)).toBe(false);
      expect(await driveComposer(data, { key: "Enter" })).toBe(0);
      expect(await driveComposer(data, { key: "Enter", shiftKey: true })).toBe(
        0
      );
    }
  });

  it("keeps the key the client is on when the save does not name one", () => {
    for (const data of [hostgrid(), minimal()]) {
      const standing = newLineKey(data);

      const saved = savePreferences(data, { submitWithShortcut: true });

      expect(saved?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
      expect(newLineKey(data)).toBe(standing);
      expect(data.persona.supportPreferences).toEqual({
        submitWithShortcut: true,
        newLineKey: standing
      });
    }
  });
});

// -----------------------------------------------------------------------------
// C8 — paying with the credit the account holds
// -----------------------------------------------------------------------------
