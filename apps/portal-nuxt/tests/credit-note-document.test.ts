// -----------------------------------------------------------------------------
/**
 * @module tests/credit-note-document
 * @description Plan Phase 2, gap doc §3 Credit notes: the credit note is the
 * same DOCUMENT as an invoice — a header, the lines it credits, what it comes
 * to, and what was actually sent back rendered as the document's payments
 * list — plus the one thing only it has: a way back to the invoice it offsets.
 * Downloading either document opens its print view (plan R11), and both print
 * views are real routes rather than destinations nothing serves.
 */

import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { every, filter, find, map, some, sumBy, values } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockCreditNote, MockDataset } from "~/portal/mock/types";
import type {
  DocumentModuleAction,
  DocumentModuleHeader,
  DocumentModuleLine,
  DocumentModulePayment,
  DocumentModuleParty,
  DocumentModuleTotals
} from "~/portal/modules/document/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import { MOCK_ACTION, dispatchMockAction } from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { formatMoney } from "~/portal/mock/money";
import { PAYMENT_STATUS_LABEL } from "~/portal/mock/status-labels";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_PAYMENT_STATUS } from "~/portal/mock/types";
import { PAGE_KEY } from "~/portal/types";

/** jsdom rewrites import.meta.url to an http URL, so the app root comes from the vitest root instead. */
const PAGES_DIR = resolve(import.meta.dirname ?? process.cwd(), "../app/pages");

function resolveRef<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function creditNote(data: MockDataset): MockCreditNote {
  const note = find(
    data.creditNotes,
    candidate => candidate.refunds.length > 0
  );
  if (note === undefined) throw new Error("seed carries no refunded note");
  return note;
}

/** Is there a page file at this route path — `[id]` directories and all. */
function servesRoute(segments: readonly string[]): boolean {
  const directory = resolve(PAGES_DIR, ...segments.slice(0, -1));
  if (!existsSync(directory)) return false;
  return some(
    readdirSync(directory, { withFileTypes: true }),
    entry => entry.name === `${segments.at(-1)}.vue`
  );
}

describe("credit-note document — the same document, crediting rather than charging", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("heads it with its number, where it stands, and the day it was issued", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const note = creditNote(data);

    const header = resolveRef<DocumentModuleHeader>(
      data,
      DATA_REF_ID.CREDIT_NOTE_DOCUMENT_HEADER,
      { entityId: note.id }
    );
    const party = resolveRef<DocumentModuleParty>(
      data,
      DATA_REF_ID.CREDIT_NOTE_DOCUMENT_PARTY,
      { entityId: note.id }
    );

    expect(header.number).toBe(note.number);
    expect(header.title).toBeTruthy();
    expect(header.title).not.toBe("Invoice");
    expect(find(header.dates, { id: "issued" })?.value).toBe(note.issuedDate);
    expect(header.status?.label).not.toBe(note.status);
    expect(party.brand.name).toBe(data.brand.name);
    expect(party.client.name).toBe(note.address.name);
    expect(party.client.lines).toEqual(note.address.lines);
  });

  it("credits exactly the lines the seed carries, rates and quantities included", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const note = creditNote(data);

    const lines = resolveRef<DocumentModuleLine[]>(
      data,
      DATA_REF_ID.CREDIT_NOTE_DOCUMENT_LINES,
      { entityId: note.id }
    );

    expect(map(lines, "description")).toEqual(map(note.lines, "description"));
    expect(map(lines, "amount")).toEqual(
      map(note.lines, line => line.amount.formatted)
    );
    expect(map(lines, "unit")).toEqual(
      map(note.lines, line => line.unitPrice?.formatted)
    );
    expect(map(lines, "quantity")).toEqual(
      map(note.lines, line =>
        line.quantity === undefined ? undefined : String(line.quantity)
      )
    );
  });

  it("totals it, and leaves on account exactly what was not sent back", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    for (const note of data.creditNotes) {
      const totals = resolveRef<DocumentModuleTotals>(
        data,
        DATA_REF_ID.CREDIT_NOTE_DOCUMENT_TOTALS,
        { entityId: note.id }
      );
      // The test's own arithmetic over the seed's refunds — never the module's.
      const sentBack = sumBy(
        filter(note.refunds, {
          status: MOCK_PAYMENT_STATUS.SUCCESSFUL
        }),
        refund => refund.amount.amount
      );

      expect(totals.total.value).toBe(note.total.formatted);
      expect(totals.paid.value).toBe(
        formatMoney(sentBack, note.total.currency)
      );
      expect(totals.balance.value).toBe(
        formatMoney(note.total.amount - sentBack, note.total.currency)
      );
    }
  });

  it("renders what was sent back as the document's own payments list", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const note = creditNote(data);

    const refunds = resolveRef<DocumentModulePayment[]>(
      data,
      DATA_REF_ID.CREDIT_NOTE_DOCUMENT_PAYMENTS,
      { entityId: note.id }
    );

    expect(map(refunds, "id")).toEqual(map(note.refunds, "id"));
    expect(map(refunds, "date")).toEqual(map(note.refunds, "date"));
    expect(map(refunds, "method")).toEqual(map(note.refunds, "method"));
    expect(map(refunds, "amount")).toEqual(
      map(note.refunds, refund => refund.amount.formatted)
    );
    expect(map(refunds, refund => refund.status.label)).toEqual(
      map(note.refunds, refund => PAYMENT_STATUS_LABEL[refund.status])
    );
  });

  it("links back to the invoice it offsets, and to nothing where it offsets none", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    for (const note of data.creditNotes) {
      const rows = resolveRef<ListModuleItem[]>(
        data,
        DATA_REF_ID.CREDIT_NOTE_INVOICE_ITEMS,
        { entityId: note.id }
      );

      expect(map(rows, "id")).toEqual(
        note.invoiceId === undefined ? [] : [note.invoiceId]
      );
      expect(map(rows, "to")).toEqual(
        note.invoiceId === undefined
          ? []
          : [`/billing/invoices/${note.invoiceId}`]
      );
    }
  });
});

describe("download — both documents open a print view that a page actually serves", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("sends a credit note to its own print route, offering no Pay along the way", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const note = creditNote(data);

    const result = dispatchMockAction(
      data,
      {},
      `${MOCK_ACTION.DOWNLOAD}:credit-note:${note.id}`
    );
    const actions = resolveRef<DocumentModuleAction[]>(
      data,
      DATA_REF_ID.CREDIT_NOTE_DOCUMENT_ACTIONS,
      { entityId: note.id }
    );

    expect(result?.to).toBe(`/billing/credit-notes/${note.id}/print`);
    expect(map(actions, action => action.value.split(":")[0])).toContain(
      MOCK_ACTION.DOWNLOAD
    );
    expect(map(actions, action => action.value.split(":")[0])).not.toContain(
      MOCK_ACTION.PAY_INVOICE
    );
  });

  it("declares a page key for each print view, and ships the page file behind it", () => {
    expect(values(PAGE_KEY)).toContain(PAGE_KEY.BILLING_INVOICE_PRINT);
    expect(values(PAGE_KEY)).toContain(PAGE_KEY.BILLING_CREDIT_NOTE_PRINT);

    expect(servesRoute(["billing", "invoices", "[id]", "print"])).toBe(true);
    expect(servesRoute(["billing", "credit-notes", "[id]", "print"])).toBe(
      true
    );
  });

  it("names a print destination the route tree really has, for both kinds", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const note = creditNote(data);
    const invoice = data.invoices[0];

    const destinations = [
      dispatchMockAction(
        data,
        {},
        `${MOCK_ACTION.DOWNLOAD}:invoice:${invoice?.id}`
      )?.to,
      dispatchMockAction(
        data,
        {},
        `${MOCK_ACTION.DOWNLOAD}:credit-note:${note.id}`
      )?.to
    ];

    expect(
      every(destinations, destination => destination?.endsWith("/print"))
    ).toBe(true);
    expect(destinations[0]).toContain("/billing/invoices/");
    expect(destinations[1]).toContain("/billing/credit-notes/");
  });
});
