// -----------------------------------------------------------------------------
/**
 * @module tests/twelfth-closure
 * @description Phase F16: the ten client capabilities the twelfth audit read as
 * open. A client pays with a card they have not stored, and keeps it only if
 * they said so (O-1); a credit LIMIT is spendable beside the balance, and the
 * credit line reads all three of legacy's sentences (O-2); a credit note and an
 * order say when they arrived through a delegation (O-3); an invoice row names
 * whose document it is (O-4); a commission row reads its own standing and wears
 * its own tone (O-5); a thread interleaves the times its standing moved (O-6),
 * offers Messages and Attachments and pages past twenty entries (O-7); a topic
 * the ACCOUNT turned off cannot be turned on for one address (O-8); a settled
 * document is stamped and a clearing one is not (O-9); and the referrals table
 * is read from either end of the day they landed (O-10).
 *
 * Every figure is the seed's own or a facade's own — nothing here sums money
 * (plan R6). The limit is proved SPENDABLE differentially: by an account whose
 * balance alone could not reach the cap, and by clones carrying one half of the
 * credit each, so no assertion is satisfied by echoing one figure back.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  InvoiceStatus,
  InvoiceStatusGroups,
  NotificationChannelCodes,
  TicketStatusCodes
} from "@upmind-automation/types";
import {
  assign,
  difference,
  every,
  filter,
  find,
  first,
  get,
  includes,
  indexOf,
  intersection,
  isEqual,
  last,
  map,
  orderBy,
  reject,
  size,
  some,
  sortBy,
  uniq,
  values
} from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockAffiliate,
  MockCommissionStatus,
  MockDataset,
  MockDocumentPayment,
  MockInvoice,
  MockTicket
} from "~/portal/mock/types";
import type { ButtonModuleAction } from "~/portal/modules/button/types";
import type { DocumentModuleMessage } from "~/portal/modules/document/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { TabsModuleTab } from "~/portal/modules/tabs/types";
import { supportPages } from "~/portal/config/support-pages";
import { MOCK_ACTION } from "~/portal/mock/actions";
import {
  affiliateCommissionsCollection,
  affiliateReferralsCollection,
  invoicesCollection
} from "~/portal/mock/collection-defs";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  isInvoiceClearing,
  isTicketClosed,
  useMockTicket,
  useMockTickets
} from "~/portal/mock/facades";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { TICKET_THREAD_TAB } from "~/portal/mock/selectors";
import { TICKET_STATUS_LABEL } from "~/portal/mock/status-labels";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import {
  MOCK_COMMISSION_STATUS,
  MOCK_PAYMENT_STATUS
} from "~/portal/mock/types";

const NO_CONTEXT: DataRouteContext = {};

/** How many entries a thread shows before it offers to fetch the earlier ones (plan F16 O-7). */
const THREAD_PAGE = 20;

/** The length of an ISO date — the day a timeline row is stamped with. */
const ISO_DATE_LENGTH = 10;

/** A document already settled, and one still owed. */
const SETTLED_INVOICE = "inv-87";
const OWED_INVOICE = "inv-95";

/** The child account's document, and the one a delegation reached. */
const CHILD_INVOICE = "inv-92";
const DELEGATED_INVOICE = "inv-93";

const DELEGATED_CREDIT_NOTE = "cn-13";
const DELEGATED_ORDER = "ord-33";

/** The thread whose standing moved twice while it ran. */
const LOGGED_THREAD = "tkt-198";

/** The long thread — past one page, with a file on every third filler message. */
const LONG_THREAD = "tkt-209";

/** An open, unlocked thread carrying one message and one file. */
const OPEN_THREAD = "tkt-208";

/** An open thread whose only message names no file at all. */
const FILELESS_THREAD = "tkt-207";

/** The commission the desk approved, and dated. */
const APPROVED_COMMISSION = "com-1";

/** The rejected commission the desk recorded a reason against. */
const REJECTED_COMMISSION = "com-4";

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function bothSeeds(): void {
  resetMockData(MOCK_DATASET_ID.HOSTGRID);
  resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

/** A detached copy of the shipped brand — mutable where the live store is not. */
function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

/**
 * Widens a paged panel to its whole set, so a hero row is read off the TABLE
 * rather than off whichever ten rows page one happens to hold.
 */
function widen(
  definition:
    | typeof invoicesCollection
    | typeof affiliateCommissionsCollection
    | typeof affiliateReferralsCollection,
  data: MockDataset
): void {
  const instance = definition.resolve(data, NO_CONTEXT);
  instance
    .useActions()
    .setLimit(Math.max(instance.useContext().pagination.value.total, 1));
}

function refValue(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = NO_CONTEXT
): unknown {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value;
}

function refRows(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = NO_CONTEXT
): ListModuleItem[] {
  const value = refValue(data, id, context);
  if (!Array.isArray(value)) return [];
  return value;
}

function refActions(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = NO_CONTEXT
): ButtonModuleAction[] {
  const value = refValue(data, id, context);
  if (!Array.isArray(value)) return [];
  return value;
}

function refTabs(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = NO_CONTEXT
): TabsModuleTab[] {
  const value = refValue(data, id, context);
  if (!Array.isArray(value)) return [];
  return value;
}

function refNotices(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = NO_CONTEXT
): DocumentModuleMessage[] {
  const value = refValue(data, id, context);
  if (!Array.isArray(value)) return [];
  return value;
}

function refText(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = NO_CONTEXT
): string | undefined {
  const value = refValue(data, id, context);
  if (typeof value !== "string") return undefined;
  return value;
}

function refFlag(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = NO_CONTEXT
): boolean | undefined {
  const value = refValue(data, id, context);
  if (typeof value !== "boolean") return undefined;
  return value;
}

function seededInvoice(data: MockDataset, id: string): MockInvoice {
  const invoice = find(data.invoices, { id });
  if (invoice === undefined) throw new Error(`seed carries no ${id}`);
  return invoice;
}

function ticketById(data: MockDataset, id: string): MockTicket {
  const ticket = find(data.tickets, { id });
  if (ticket === undefined) throw new Error(`seed carries no ${id}`);
  return ticket;
}

function programme(data: MockDataset): MockAffiliate {
  if (data.affiliate === null) throw new Error("dataset runs no programme");
  return data.affiliate;
}

/** The one payment the seed records as taken but not yet arrived. */
function pendingPayment(data: MockDataset): MockDocumentPayment {
  const clearing = find(data.invoices, isInvoiceClearing);
  const payment = find(clearing?.payments ?? [], {
    status: MOCK_PAYMENT_STATUS.PENDING
  });
  if (payment === undefined) {
    throw new Error("seed records no payment still to arrive");
  }
  return payment;
}

/** A copy of the seed in which ONE named document is still clearing. */
function clearingCopy(invoiceId: string): MockDataset {
  const data = clone();
  seededInvoice(data, invoiceId).payments.push(
    assign({}, pendingPayment(data), { id: "pay-clearing" })
  );
  return data;
}

/** Every string one row prints, for a containment read that names no field. */
function rowText(row: ListModuleItem | undefined): string {
  return [
    row?.title ?? "",
    row?.description ?? "",
    row?.trailingText ?? "",
    row?.status?.label ?? "",
    row?.time ?? "",
    ...map(row?.tags ?? [], tag => tag.label),
    ...map(row?.cells ?? [], cell => cell.value)
  ].join(" | ");
}

function commissionRow(
  data: MockDataset,
  id: string
): ListModuleItem | undefined {
  widen(affiliateCommissionsCollection, data);
  return find(refRows(data, DATA_REF_ID.AFFILIATE_COMMISSION_ITEMS), { id });
}

/** The same commission with its standing moved, and every date cleared with it. */
function commissionUnder(
  status: MockCommissionStatus
): ListModuleItem | undefined {
  const data = clone();
  assign(programme(data), {
    commissions: map(programme(data).commissions, commission => {
      if (commission.id !== APPROVED_COMMISSION) return commission;
      return assign({}, commission, {
        status,
        approvedAt: undefined,
        rejectedAt: undefined,
        payoutCalculatedAt: undefined,
        rejectReason: undefined
      });
    })
  });
  return commissionRow(data, APPROVED_COMMISSION);
}

function threadRows(
  data: MockDataset,
  ticketId: string,
  context: DataRouteContext = NO_CONTEXT
): ListModuleItem[] {
  return refRows(data, DATA_REF_ID.TICKET_MESSAGE_ITEMS, {
    entityId: ticketId,
    ...context
  });
}

/** The whole feed of a thread as the SEED holds it, oldest first. */
function seededFeedIds(ticket: MockTicket): string[] {
  const entries = [
    ...map(ticket.messages, message => ({
      id: message.id,
      at: message.sentAt
    })),
    ...map(ticket.statusLog ?? [], change => ({ id: change.id, at: change.at }))
  ];
  return map(orderBy(entries, ["at"], ["asc"]), "id");
}

function futureIso(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

// -----------------------------------------------------------------------------
// O-1 — paying with a card the account has not stored
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// O-2 — the credit limit, and what the credit line says
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// O-3 — the documents a delegation reached
// -----------------------------------------------------------------------------

describe("O-3 — a delegated credit note and a delegated order say so", () => {
  beforeEach(bothSeeds);

  it("renders the delegated notice on a delegated credit note", () => {
    const data = hostgrid();
    const notices = (source: MockDataset, id: string | undefined) =>
      refNotices(source, DATA_REF_ID.CREDIT_NOTE_DOCUMENT_MESSAGES, {
        entityId: id
      });
    const delegated = map(
      filter(data.creditNotes, note => note.isDelegated === true),
      "id"
    );
    const noticed = map(
      filter(data.creditNotes, note => size(notices(data, note.id)) > 0),
      "id"
    );

    expect(delegated).toEqual([DELEGATED_CREDIT_NOTE]);
    expect(size(data.creditNotes)).toBeGreaterThan(size(delegated));
    expect(noticed).toEqual(delegated);
    expect(first(notices(data, DELEGATED_CREDIT_NOTE))?.message).toBeTruthy();

    // The notice reads the FLAG rather than the row: raised on a document that
    // never carried it, the same words follow.
    const copy = clone();
    const plain = find(copy.creditNotes, note => note.isDelegated !== true);
    copy.creditNotes = map(copy.creditNotes, note => {
      if (note.id !== plain?.id) return note;
      return assign({}, note, { isDelegated: true });
    });
    expect(first(notices(copy, plain?.id))?.message).toBe(
      first(notices(data, DELEGATED_CREDIT_NOTE))?.message
    );
  });

  it("renders the delegated notice on a delegated order", () => {
    const data = hostgrid();
    const shows = (source: MockDataset, id: string | undefined) =>
      refFlag(source, DATA_REF_ID.ORDER_IS_DELEGATED, { entityId: id }) ===
      true;
    const notice = (source: MockDataset, id: string | undefined) =>
      refText(source, DATA_REF_ID.ORDER_DELEGATED_MESSAGE, { entityId: id });
    const delegated = map(
      filter(data.orders, order => order.isDelegated === true),
      "id"
    );

    expect(delegated).toEqual([DELEGATED_ORDER]);
    expect(size(data.orders)).toBeGreaterThan(size(delegated));
    expect(
      map(
        filter(data.orders, order => shows(data, order.id)),
        "id"
      )
    ).toEqual(delegated);
    expect(notice(data, DELEGATED_ORDER)).toBeTruthy();

    // The same flag on another order carries the same notice.
    const copy = clone();
    const plain = find(copy.orders, order => order.isDelegated !== true);
    copy.orders = map(copy.orders, order => {
      if (order.id !== plain?.id) return order;
      return assign({}, order, { isDelegated: true });
    });
    expect(shows(copy, plain?.id)).toBe(true);
    expect(notice(copy, plain?.id)).toBe(notice(data, DELEGATED_ORDER));
  });
});

// -----------------------------------------------------------------------------
// O-4 — whose document a row is about
// -----------------------------------------------------------------------------

describe("O-4 — an invoice row names the account it belongs to", () => {
  beforeEach(bothSeeds);

  it("the row names the owner of a child-account or delegated invoice", () => {
    const data = hostgrid();
    widen(invoicesCollection, data);
    const rows = refRows(data, DATA_REF_ID.INVOICE_ITEMS);
    const child = seededInvoice(data, CHILD_INVOICE);
    const delegated = seededInvoice(data, DELEGATED_INVOICE);
    const readingOf = (id: string) => find(rows, { id })?.description ?? "";

    expect(child.ownerName).toBeTruthy();
    expect(child.isDelegated).toBeUndefined();
    expect(delegated.ownerName).toBeTruthy();
    expect(delegated.isDelegated).toBe(true);
    expect(readingOf(child.id)).toContain(child.ownerName);
    expect(readingOf(delegated.id)).toContain(delegated.ownerName);

    // Two owners, two different sentences: with each owner's name taken out,
    // what is left still differs — so the WORDING switched, not just the name.
    expect(readingOf(child.id).replace(child.ownerName ?? "", "")).not.toBe(
      readingOf(delegated.id).replace(delegated.ownerName ?? "", "")
    );

    // Every other row on the table reads its own two dates and names nobody.
    const plain = filter(
      rows,
      row => find(data.invoices, { id: row.id })?.ownerName === undefined
    );
    expect(size(plain)).toBeGreaterThan(1);
    for (const row of plain) {
      const invoice = seededInvoice(data, row.id);
      expect({
        id: row.id,
        dated: [
          includes(row.description, invoice.issuedDate),
          includes(row.description, invoice.dueDate)
        ],
        named: includes(row.description, child.ownerName ?? "")
      }).toEqual({ id: row.id, dated: [true, true], named: false });
    }
  });
});

// -----------------------------------------------------------------------------
// O-5 — where a commission stands
// -----------------------------------------------------------------------------

describe("O-5 — the commissions table reads six standings", () => {
  beforeEach(bothSeeds);

  it("an approved commission names the day it was approved", () => {
    const data = hostgrid();
    const approved = find(programme(data).commissions, {
      id: APPROVED_COMMISSION
    });

    expect(approved?.status).toBe(MOCK_COMMISSION_STATUS.APPROVED);
    expect(approved?.approvedAt).toBeTruthy();
    expect(rowText(commissionRow(data, APPROVED_COMMISSION))).toContain(
      approved?.approvedAt
    );

    // The day is read off the commission's own record: moved, the row moves.
    const moved = clone();
    assign(programme(moved), {
      commissions: map(programme(moved).commissions, commission => {
        if (commission.id !== APPROVED_COMMISSION) return commission;
        return assign({}, commission, { approvedAt: "2026-01-09" });
      })
    });
    expect(rowText(commissionRow(moved, APPROVED_COMMISSION))).toContain(
      "2026-01-09"
    );
    expect(rowText(commissionRow(moved, APPROVED_COMMISSION))).not.toContain(
      approved?.approvedAt
    );
  });

  it("each of the other five standings reads its own sentence", () => {
    const data = hostgrid();
    const commissions = programme(data).commissions;
    const wanted = [
      MOCK_COMMISSION_STATUS.REJECTED,
      MOCK_COMMISSION_STATUS.AWAITING_PAYMENT,
      MOCK_COMMISSION_STATUS.PENDING_APPROVAL,
      MOCK_COMMISSION_STATUS.ON_HOLD,
      MOCK_COMMISSION_STATUS.CANCELLED
    ];
    const readings = map(wanted, status => {
      const commission = find(commissions, { status });
      if (commission === undefined) {
        throw new Error(`seed carries no ${status} commission`);
      }
      return rowText(commissionRow(data, commission.id))
        .replace(commission.description, "")
        .replace(commission.amount.formatted, "")
        .replace(commission.rejectedAt ?? " ", "")
        .replace(commission.rejectReason ?? " ", "")
        .replace(commission.payoutCalculatedAt ?? " ", "");
    });

    expect(size(uniq(readings))).toBe(size(wanted));
    expect(every(readings, reading => reading.trim().length > 0)).toBe(true);

    // The two facts legacy printed beside a standing are the record's own.
    const rejected = find(commissions, { id: REJECTED_COMMISSION });
    const pending = find(commissions, {
      status: MOCK_COMMISSION_STATUS.PENDING_APPROVAL
    });
    const silent = find(
      commissions,
      commission =>
        commission.status === MOCK_COMMISSION_STATUS.REJECTED &&
        commission.rejectReason === undefined
    );
    expect(rejected?.rejectReason).toBeTruthy();
    expect(rowText(commissionRow(data, rejected?.id ?? ""))).toContain(
      rejected?.rejectedAt
    );
    expect(rowText(commissionRow(data, rejected?.id ?? ""))).toContain(
      rejected?.rejectReason
    );
    expect(pending?.payoutCalculatedAt).toBeTruthy();
    expect(rowText(commissionRow(data, pending?.id ?? ""))).toContain(
      pending?.payoutCalculatedAt
    );
    expect(silent?.rejectedAt).toBeTruthy();
    expect(rowText(commissionRow(data, silent?.id ?? ""))).not.toContain(
      rejected?.rejectReason
    );
  });

  it("tones the commission amount by where it stands", () => {
    const states = values(MOCK_COMMISSION_STATUS);
    const rows = map(states, status => commissionUnder(status));
    const tones = map(rows, row => row?.status?.tone);
    const toneOf = (status: MockCommissionStatus) =>
      tones[indexOf(states, status)];
    const amount = find(programme(hostgrid()).commissions, {
      id: APPROVED_COMMISSION
    })?.amount;

    expect(size(states)).toBe(6);
    expect(every(rows, row => row !== undefined)).toBe(true);
    expect(every(tones, tone => tone !== undefined)).toBe(true);
    // The badge IS the amount, and the amount itself never moves — only how
    // it is worn.
    expect(uniq(map(rows, row => row?.status?.label))).toEqual([
      amount?.formatted
    ]);
    expect(uniq(map(rows, row => row?.trailingText))).toEqual([
      amount?.formatted
    ]);
    // What was approved, what was refused, what is still being decided and
    // what is merely held do not read alike.
    expect(size(uniq(tones))).toBeGreaterThan(1);
    expect(toneOf(MOCK_COMMISSION_STATUS.APPROVED)).not.toBe(
      toneOf(MOCK_COMMISSION_STATUS.REJECTED)
    );
    expect(toneOf(MOCK_COMMISSION_STATUS.APPROVED)).not.toBe(
      toneOf(MOCK_COMMISSION_STATUS.ON_HOLD)
    );
    expect(toneOf(MOCK_COMMISSION_STATUS.APPROVED)).not.toBe(
      toneOf(MOCK_COMMISSION_STATUS.PENDING_APPROVAL)
    );
    expect(toneOf(MOCK_COMMISSION_STATUS.ON_HOLD)).not.toBe(
      toneOf(MOCK_COMMISSION_STATUS.REJECTED)
    );
  });
});

// -----------------------------------------------------------------------------
// O-6 — the times a thread's standing moved
// -----------------------------------------------------------------------------

describe("O-6 — the thread carries the standing changes too", () => {
  beforeEach(bothSeeds);

  it("interleaves the status changes with the messages, oldest first", () => {
    const data = hostgrid();
    const ticket = ticketById(data, LOGGED_THREAD);
    const rows = threadRows(data, ticket.id);
    const ids = map(rows, "id");
    const log = ticket.statusLog ?? [];

    expect(size(log)).toBe(2);
    expect(size(rows)).toBe(size(ticket.messages) + size(log));
    expect(sortBy(ids)).toEqual(sortBy(seededFeedIds(ticket)));

    // Oldest first, by WHEN each happened — the stamps never go backwards.
    const stamps = map(rows, row => row.datetime ?? "");
    expect(stamps).toEqual([...stamps].sort());
    expect(every(stamps, stamp => stamp.length > 0)).toBe(true);

    for (const change of log) {
      const row = find(rows, { id: change.id });
      expect({
        id: change.id,
        datetime: row?.datetime,
        time: row?.time
      }).toEqual({
        id: change.id,
        datetime: change.at,
        time: change.at.slice(0, ISO_DATE_LENGTH)
      });
      expect(rowText(row)).toContain(TICKET_STATUS_LABEL[change.status]);
    }

    // The first change happened between the two messages, and reads there.
    expect(indexOf(ids, first(log)?.id)).toBeGreaterThan(
      indexOf(ids, first(ticket.messages)?.id)
    );
    expect(indexOf(ids, first(log)?.id)).toBeLessThan(
      indexOf(ids, last(ticket.messages)?.id)
    );

    // A thread whose standing never moved reads as its messages alone.
    const plain = ticketById(data, OPEN_THREAD);
    expect(plain.statusLog).toBeUndefined();
    expect(map(threadRows(data, plain.id), "id")).toEqual(
      map(plain.messages, "id")
    );
  });

  it("a status entry breaks the run of one voice, and none of them is a run itself", () => {
    const thread = (log: boolean) => {
      const data = clone();
      const ticket = ticketById(data, FILELESS_THREAD);
      const first = ticket.messages[0];
      data.tickets = map(data.tickets, candidate => {
        if (candidate.id !== ticket.id) return candidate;
        return assign({}, candidate, {
          messages: [
            first,
            assign({}, first, {
              id: "msg-again",
              sentAt: "2026-08-22T17:00:00Z",
              body: "One more thing on the same point."
            })
          ],
          statusLog: log
            ? [
                {
                  id: "tsc-between",
                  status: TicketStatusCodes.IN_PROGRESS,
                  at: "2026-08-22T16:00:00Z"
                }
              ]
            : undefined
        });
      });
      return threadRows(data, ticket.id);
    };

    // Two messages in one voice, one after the other: the second continues it.
    const run = thread(false);
    expect(map(run, "id")).toEqual(["msg-1", "msg-again"]);
    expect(map(run, row => row.groupWithPrevious === true)).toEqual([
      false,
      true
    ]);

    // The same two messages with the standing moving between them: the entry
    // stands in the way, so the second message speaks for itself again.
    const broken = thread(true);
    expect(map(broken, "id")).toEqual(["msg-1", "tsc-between", "msg-again"]);
    expect(map(broken, row => row.groupWithPrevious === true)).toEqual([
      false,
      false,
      false
    ]);
  });

  it("closing a thread appends a status entry to its feed", () => {
    const data = clone();
    const ticket = ticketById(data, OPEN_THREAD);
    const log = (id: string) => ticketById(data, id).statusLog ?? [];
    const entryRow = (id: string) =>
      find(threadRows(data, id), { id: last(log(id))?.id });

    expect(size(log(ticket.id))).toBe(0);

    const closed = useMockTicket(data, ticket.id).useActions().close();
    expect(closed?.ok).toBe(true);
    expect(isTicketClosed(ticketById(data, ticket.id))).toBe(true);
    expect(size(log(ticket.id))).toBe(1);
    expect(last(log(ticket.id))?.status).toBe(
      ticketById(data, ticket.id).status
    );
    expect(entryRow(ticket.id)).toBeDefined();
    expect(rowText(entryRow(ticket.id))).toContain(
      TICKET_STATUS_LABEL[TicketStatusCodes.CLOSED]
    );

    // Reopening moves it back, and leaves its own entry behind.
    const reopened = useMockTicket(data, ticket.id).useActions().reopen();
    expect(reopened?.ok).toBe(true);
    expect(size(log(ticket.id))).toBe(2);
    expect(last(log(ticket.id))?.status).toBe(
      ticketById(data, ticket.id).status
    );
    expect(last(log(ticket.id))?.status).not.toBe(
      first(log(ticket.id))?.status
    );

    // A thread booked to open later is BORN at that standing rather than
    // moved to it, so it opens with the log its own writes will fill.
    const booked = useMockTickets(data).useActions().create({
      subject: "Scheduled follow-up",
      body: "Please call at the time booked.",
      scheduledAt: futureIso()
    });
    const fresh = find(data.tickets, { id: booked?.entity?.id });
    const booking = size(fresh?.statusLog ?? []);
    expect(booked?.ok).toBe(true);
    expect(fresh?.status).toBe(TicketStatusCodes.SCHEDULED);
    expect(size(threadRows(data, fresh?.id ?? ""))).toBe(
      size(fresh?.messages ?? []) + booking
    );

    // And closing THAT thread leaves an entry on it too, so the entry follows
    // the write rather than the thread it was raised on.
    useMockTicket(data, fresh?.id ?? "")
      .useActions()
      .close();
    expect(size(log(fresh?.id ?? ""))).toBe(booking + 1);
    expect(last(log(fresh?.id ?? ""))?.status).toBe(TicketStatusCodes.CLOSED);
  });
});

// -----------------------------------------------------------------------------
// O-7 — the thread's two views, and the page behind them
// -----------------------------------------------------------------------------

describe("O-7 — the thread offers Messages and Attachments, and pages", () => {
  beforeEach(bothSeeds);

  it("offers the two views as a rail the route drives", () => {
    const data = hostgrid();
    const ticket = ticketById(data, LONG_THREAD);
    const tabs = refTabs(data, DATA_REF_ID.TICKET_THREAD_TABS, {
      entityId: ticket.id
    });
    const active = (status?: string) =>
      refText(data, DATA_REF_ID.TICKET_THREAD_ACTIVE_TAB, {
        entityId: ticket.id,
        status
      });

    expect(map(tabs, "value")).toEqual([
      TICKET_THREAD_TAB.MESSAGES,
      TICKET_THREAD_TAB.ATTACHMENTS
    ]);
    for (const tab of tabs) {
      const action = tab.action ?? "";
      expect({ tab: tab.value, label: tab.label }).toEqual({
        tab: tab.value,
        label: expect.stringMatching(/\S/)
      });
      expect({
        tab: tab.value,
        navigates: action.startsWith(`${MOCK_ACTION.NAVIGATE}:`),
        names: includes(action, `status=${tab.value}`),
        thread: includes(action, ticket.id)
      }).toEqual({
        tab: tab.value,
        navigates: true,
        names: true,
        thread: true
      });
    }

    expect(active()).toBe(TICKET_THREAD_TAB.MESSAGES);
    expect(active(TICKET_THREAD_TAB.ATTACHMENTS)).toBe(
      TICKET_THREAD_TAB.ATTACHMENTS
    );
    expect(active("no-such-view")).toBe(TICKET_THREAD_TAB.MESSAGES);
    expect(JSON.stringify(supportPages())).toContain(
      DATA_REF_ID.TICKET_THREAD_TABS
    );
  });

  it("the Attachments tab shows only the messages carrying files", () => {
    const data = hostgrid();
    const ticket = ticketById(data, LONG_THREAD);
    const filed = filter(
      ticket.messages,
      message => size(message.attachments ?? []) > 0
    );
    const shown = threadRows(data, ticket.id, {
      status: TICKET_THREAD_TAB.ATTACHMENTS
    });

    expect(size(filed)).toBeGreaterThan(1);
    expect(size(filed)).toBeLessThan(size(ticket.messages));
    expect(map(shown, "id")).toEqual(map(filed, "id"));

    // The Messages view still carries the ones with nothing attached.
    const everything = threadRows(data, ticket.id, { page: "2" });
    expect(size(everything)).toBeGreaterThan(size(shown));
    expect(map(everything, "id")).toEqual(
      expect.arrayContaining(map(shown, "id"))
    );

    // A thread whose messages name no file shows nothing, under its own title.
    const bare = ticketById(data, FILELESS_THREAD);
    expect(
      some(bare.messages, message => size(message.attachments ?? []) > 0)
    ).toBe(false);
    expect(
      threadRows(data, bare.id, { status: TICKET_THREAD_TAB.ATTACHMENTS })
    ).toEqual([]);
    expect(
      refText(data, DATA_REF_ID.TICKET_THREAD_EMPTY_TITLE, {
        status: TICKET_THREAD_TAB.ATTACHMENTS
      })
    ).toBeTruthy();
    expect(
      refText(data, DATA_REF_ID.TICKET_THREAD_EMPTY_TITLE, {
        status: TICKET_THREAD_TAB.ATTACHMENTS
      })
    ).not.toBe(refText(data, DATA_REF_ID.TICKET_THREAD_EMPTY_TITLE));
  });

  it("a long thread offers to show the earlier messages", () => {
    const data = hostgrid();
    const ticket = ticketById(data, LONG_THREAD);
    const whole = seededFeedIds(ticket);
    const opening = threadRows(data, ticket.id);
    // The control rides the button module's GROUP variant, which reads a SET
    // of actions, so an empty set is a thread with nothing behind the fold
    // (plan F17 ruling: the single variant reads no action at all).
    const more = (page?: string) =>
      first(
        refActions(data, DATA_REF_ID.TICKET_THREAD_MORE_ACTIONS, {
          entityId: ticket.id,
          page
        })
      );

    expect(size(whole)).toBeGreaterThan(THREAD_PAGE);
    expect(size(opening)).toBe(THREAD_PAGE);
    // The LATEST page stands, oldest first inside it; the earlier entries are
    // the ones behind the control.
    expect(map(opening, "id")).toEqual(whole.slice(-THREAD_PAGE));
    expect(get(more(), "label", "")).toMatch(/\S/);
    expect(
      refFlag(data, DATA_REF_ID.TICKET_HAS_MORE_MESSAGES, {
        entityId: ticket.id
      })
    ).toBe(true);
    expect(get(more(), "value", "")).toContain("page=2");

    const second = threadRows(data, ticket.id, { page: "2" });
    expect(map(second, "id")).toEqual(whole);
    expect(more("2")).toBeUndefined();
    expect(
      refFlag(data, DATA_REF_ID.TICKET_HAS_MORE_MESSAGES, {
        entityId: ticket.id,
        page: "2"
      })
    ).toBe(false);

    // A thread that fits on one page offers nothing to fetch.
    const short = ticketById(data, OPEN_THREAD);
    expect(size(short.messages)).toBeLessThan(THREAD_PAGE);
    expect(
      refActions(data, DATA_REF_ID.TICKET_THREAD_MORE_ACTIONS, {
        entityId: short.id
      })
    ).toEqual([]);
  });

  it("the thread opens on its most recent entries, and Show earlier reveals the older ones", () => {
    const data = hostgrid();
    const ticket = ticketById(data, LONG_THREAD);
    const whole = seededFeedIds(ticket);
    const behind = whole.slice(0, size(whole) - THREAD_PAGE);
    const opening = map(threadRows(data, ticket.id), "id");
    const asked = map(threadRows(data, ticket.id, { page: "2" }), "id");

    expect(size(behind)).toBeGreaterThan(0);
    // The newest entry is in front of the client from the first draw, and the
    // oldest ones are the ones it has to ask for.
    expect(last(opening)).toBe(last(whole));
    expect(first(opening)).not.toBe(first(whole));
    expect(intersection(opening, behind)).toEqual([]);

    // Asking adds the older entries AT THE HEAD and moves nothing else.
    expect(asked.slice(0, size(behind))).toEqual(behind);
    expect(asked.slice(size(behind))).toEqual(opening);
    expect(first(asked)).toBe(first(whole));
    // Oldest first inside whichever page is drawn.
    const stamps = map(threadRows(data, ticket.id), row => row.datetime ?? "");
    expect(stamps).toEqual([...stamps].sort());
  });
});

// -----------------------------------------------------------------------------
// O-8 — the topic the account turned off
// -----------------------------------------------------------------------------

describe("O-8 — one address cannot opt back into what the account refused", () => {
  beforeEach(bothSeeds);

  it("an account-level opt-out locks the topic on the per-address form", () => {
    const data = hostgrid();
    const refused = find(
      data.notificationPreferences,
      preference =>
        preference.channels[NotificationChannelCodes.EMAIL] === false &&
        find(data.emailTopics, { id: preference.topic }) !== undefined
    );
    const address = find(data.emails, email =>
      includes(email.topicOptIns, refused?.topic)
    );
    if (refused === undefined || address === undefined) {
      throw new Error("no subscribed address on an account-refused topic");
    }
    const context: DataRouteContext = { email: address.email };
    const schema = refValue(
      data,
      DATA_REF_ID.EMAIL_OPT_INS_FORM_SCHEMA,
      context
    );
    const uischema = refValue(
      data,
      DATA_REF_ID.EMAIL_OPT_INS_FORM_UISCHEMA,
      context
    );
    const model = refValue(data, DATA_REF_ID.EMAIL_OPT_INS_FORM_MODEL, context);
    const controlFor = (topicId: string) =>
      find(
        get(uischema, "elements", []),
        element => get(element, "scope") === `#/properties/${topicId}`
      );
    const topic = find(data.emailTopics, { id: refused.topic });

    // The ADDRESS is subscribed and the ACCOUNT is not, so the form reads the
    // account's answer and locks the switch on it.
    expect(topic?.description).toBeTruthy();
    expect(get(model, refused.topic)).toBe(false);
    expect(get(schema, `properties.${refused.topic}.readOnly`)).toBe(true);
    expect(get(controlFor(refused.topic), "options.readonly")).toBe(true);
    expect(get(controlFor(refused.topic), "options.description")).toBeTruthy();
    expect(get(controlFor(refused.topic), "options.description")).not.toBe(
      topic?.description
    );

    // Every other topic stays the client's to answer, in the brand's own words.
    const others = reject(data.emailTopics, { id: refused.topic });
    expect(size(others)).toBeGreaterThan(0);
    for (const other of others) {
      expect({
        id: other.id,
        locked: get(schema, `properties.${other.id}.readOnly`),
        words: get(controlFor(other.id), "options.description"),
        on: get(model, other.id)
      }).toEqual({
        id: other.id,
        locked: false,
        words: other.description,
        on: includes(address.topicOptIns, other.id)
      });
    }

    // With the account receiving it again, the address's own answer stands.
    const opened = clone();
    assign(opened, {
      notificationPreferences: map(
        opened.notificationPreferences,
        preference => {
          if (preference.topic !== refused.topic) return preference;
          return assign({}, preference, {
            channels: assign({}, preference.channels, {
              [NotificationChannelCodes.EMAIL]: true
            })
          });
        }
      )
    });
    expect(
      get(
        refValue(opened, DATA_REF_ID.EMAIL_OPT_INS_FORM_MODEL, context),
        refused.topic
      )
    ).toBe(true);
    expect(
      get(
        refValue(opened, DATA_REF_ID.EMAIL_OPT_INS_FORM_SCHEMA, context),
        `properties.${refused.topic}.readOnly`
      )
    ).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// O-9 — the stamp on a settled document
// -----------------------------------------------------------------------------

describe("O-9 — the document says it has been paid", () => {
  beforeEach(bothSeeds);

  it("stamps PAID only on a settled document, never on a clearing one", () => {
    const data = hostgrid();
    const stampOn = (source: MockDataset, id: string) =>
      refText(source, DATA_REF_ID.INVOICE_DOCUMENT_PAID_STAMP, {
        entityId: id
      });
    const settled = seededInvoice(data, SETTLED_INVOICE);
    const owed = seededInvoice(data, OWED_INVOICE);

    expect(includes(InvoiceStatusGroups.PAID, settled.status)).toBe(true);
    expect(isInvoiceClearing(settled)).toBe(false);
    expect(stampOn(data, settled.id)).toBeTruthy();
    expect(includes(InvoiceStatusGroups.UNPAID, owed.status)).toBe(true);
    expect(stampOn(data, owed.id)).toBeUndefined();

    // Across the whole ledger: every settled document is stamped, nothing
    // still owed is, and nothing clearing is.
    const stamped = filter(
      data.invoices,
      invoice => stampOn(data, invoice.id) !== undefined
    );
    const settledSet = filter(
      data.invoices,
      invoice =>
        includes(InvoiceStatusGroups.PAID, invoice.status) &&
        !isInvoiceClearing(invoice)
    );
    const owedSet = filter(data.invoices, invoice =>
      includes(InvoiceStatusGroups.UNPAID, invoice.status)
    );
    expect(size(settledSet)).toBeGreaterThan(0);
    expect(size(owedSet)).toBeGreaterThan(0);
    expect(difference(map(settledSet, "id"), map(stamped, "id"))).toEqual([]);
    expect(intersection(map(stamped, "id"), map(owedSet, "id"))).toEqual([]);
    expect(map(filter(stamped, isInvoiceClearing), "id")).toEqual([]);

    // The same settled document with money recorded but not received carries
    // none — the one fact that moved is the payment still to arrive.
    const clearing = clearingCopy(SETTLED_INVOICE);
    expect(isInvoiceClearing(seededInvoice(clearing, SETTLED_INVOICE))).toBe(
      true
    );
    expect(seededInvoice(clearing, SETTLED_INVOICE).status).toBe(
      InvoiceStatus.PAID
    );
    expect(stampOn(clearing, SETTLED_INVOICE)).toBeUndefined();
  });

  it("the stamp is absent on a refunded and on a cancelled document", () => {
    const data = hostgrid();
    const stampOn = (source: MockDataset, id: string) =>
      refText(source, DATA_REF_ID.INVOICE_DOCUMENT_PAID_STAMP, {
        entityId: id
      });
    const credited = filter(data.invoices, invoice =>
      includes(InvoiceStatusGroups.CREDITED, invoice.status)
    );
    const refunded = find(credited, { status: InvoiceStatus.REFUNDED });
    const cancelled = find(credited, { status: InvoiceStatus.CANCELLED });
    const settled = seededInvoice(data, SETTLED_INVOICE);

    expect(refunded?.id).toBeTruthy();
    expect(cancelled?.id).toBeTruthy();
    // Both owe nothing, as the settled document owes nothing — so what the
    // stamp reads cannot be "there is nothing left to pay".
    expect(refunded?.unpaidAmount.amount).toBe(settled.unpaidAmount.amount);
    expect(cancelled?.unpaidAmount.amount).toBe(settled.unpaidAmount.amount);
    expect(stampOn(data, settled.id)).toBeTruthy();
    expect(stampOn(data, refunded?.id ?? "")).toBeUndefined();
    expect(stampOn(data, cancelled?.id ?? "")).toBeUndefined();

    // No credited document anywhere on the ledger wears it.
    expect(
      map(
        filter(credited, invoice => stampOn(data, invoice.id) !== undefined),
        "id"
      )
    ).toEqual([]);
    expect(size(credited)).toBeGreaterThan(2);

    // And the settled document keeps it when only its STATUS is moved onto a
    // credited one, so the stamp reads the standing and nothing else.
    const written = clone();
    written.invoices = map(written.invoices, invoice => {
      if (invoice.id !== SETTLED_INVOICE) return invoice;
      return assign({}, invoice, { status: InvoiceStatus.REFUNDED });
    });
    expect(stampOn(written, SETTLED_INVOICE)).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// O-10 — the referrals table, read from either end
// -----------------------------------------------------------------------------

describe("O-10 — the referrals table is ordered by the day it landed", () => {
  beforeEach(bothSeeds);

  it("orders the referrals by the day they landed, both ways round", () => {
    const data = hostgrid();
    const referrals = programme(data).referrals;
    const instance = affiliateReferralsCollection.resolve(data, NO_CONTEXT);
    const context = instance.useContext();
    const actions = instance.useActions();
    const showing = () => map(context.data.value, "id");
    const newest = map(orderBy(referrals, ["date"], ["desc"]), "id");
    const oldest = map(orderBy(referrals, ["date"], ["asc"]), "id");

    actions.setLimit(size(referrals));
    expect(size(referrals)).toBeGreaterThan(1);
    expect(newest).not.toEqual(oldest);
    // The table OPENS in one of the two orders rather than in seed order.
    expect(some([newest, oldest], order => isEqual(showing(), order))).toBe(
      true
    );

    const offered = map(context.sortOptions, option => option.value);
    const orders = map(offered, value => {
      actions.applySort(value);
      return showing();
    });

    expect(size(offered)).toBe(2);
    expect(size(uniq(map(context.sortOptions, "label")))).toBe(2);
    expect(
      every(context.sortOptions, option => option.label.trim().length > 0)
    ).toBe(true);
    expect(some(orders, order => isEqual(order, newest))).toBe(true);
    expect(some(orders, order => isEqual(order, oldest))).toBe(true);

    // The panel itself follows the collection it is drawn from.
    actions.applySort(first(offered));
    expect(
      map(refRows(data, DATA_REF_ID.AFFILIATE_REFERRAL_ITEMS), "id")
    ).toEqual(showing());
  });
});
