// -----------------------------------------------------------------------------
/**
 * @module tests/invoice-document
 * @description Plan Phase 2, gap doc §3 Invoices: the invoice DOCUMENT — what
 * legacy printed and the rebuild summarised. It says who raised it and who
 * for, what it charges for, what it comes to line by line and band by band,
 * what has landed against it and what is still owed; it says which card will
 * take it and whether one already is; and it offers the three things a client
 * may do with it. Paying names the card and the amount before it takes
 * anything, sharing puts the public link on the clipboard, and downloading is
 * the print view (plan R11).
 *
 * Every figure is read back against the SEED, and the balance against this
 * test's own arithmetic — the mock layer is the server, so a document that
 * agrees with itself proves nothing.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceStatusGroups } from "@upmind-automation/types";
import { find, map, some } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockInvoice } from "~/portal/mock/types";
import type {
  DocumentModuleHeader,
  DocumentModuleLine,
  DocumentModuleMessage,
  DocumentModuleParty,
  DocumentModulePayment,
  DocumentModuleTotals
} from "~/portal/modules/document/types";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
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

function resolveRef<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function unpaidInvoice(data: MockDataset): MockInvoice {
  const invoice = find(data.invoices, candidate =>
    InvoiceStatusGroups.UNPAID.includes(candidate.status)
  );
  if (invoice === undefined) throw new Error("seed carries no unpaid invoice");
  return invoice;
}

function setClipboard(clipboard: unknown) {
  Object.defineProperty(navigator, "clipboard", {
    value: clipboard,
    configurable: true,
    writable: true
  });
}

describe("invoice document — the whole document, from the seed", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("heads the document with its number, where it stands, and the dates it carries", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const invoice = unpaidInvoice(data);

    const header = resolveRef<DocumentModuleHeader>(
      data,
      DATA_REF_ID.INVOICE_DOCUMENT_HEADER,
      { entityId: invoice.id }
    );

    expect(header.number).toBe(invoice.number);
    expect(header.title).toBe(invoice.category);
    expect(header.status?.label).toBeTruthy();
    expect(header.status?.label).not.toBe(invoice.status);
    expect(find(header.dates, { id: "issued" })?.value).toBe(
      invoice.issuedDate
    );
    expect(find(header.dates, { id: "due" })?.value).toBe(invoice.dueDate);
  });

  it("names both parties — the brand that raised it and the address it was raised for", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const invoice = unpaidInvoice(data);

    const party = resolveRef<DocumentModuleParty>(
      data,
      DATA_REF_ID.INVOICE_DOCUMENT_PARTY,
      { entityId: invoice.id }
    );

    expect(party.brand.name).toBe(data.brand.name);
    expect(party.brand.company).toBe(data.brand.company);
    expect(party.brand.lines).toEqual(data.brand.lines);
    // The address the document was RAISED for, not the address book's row.
    expect(party.client.name).toBe(invoice.address.name);
    expect(party.client.company).toBe(invoice.address.company);
    expect(party.client.lines).toEqual(invoice.address.lines);
    expect(party.client.taxNumber).toContain(invoice.address.taxNumber);
    expect(party.brand.label).not.toBe(party.client.label);
  });

  it("charges for exactly the lines the seed carries, in the seed's own words", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const invoice = unpaidInvoice(data);

    const lines = resolveRef<DocumentModuleLine[]>(
      data,
      DATA_REF_ID.INVOICE_DOCUMENT_LINES,
      { entityId: invoice.id }
    );

    expect(map(lines, "id")).toEqual(map(invoice.lines, "id"));
    expect(map(lines, "description")).toEqual(
      map(invoice.lines, "description")
    );
    expect(map(lines, "amount")).toEqual(
      map(invoice.lines, line => line.amount.formatted)
    );
  });

  it("totals it as subtotal, every tax band, total, paid — and a balance that is total less paid", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const invoice = unpaidInvoice(data);

    const totals = resolveRef<DocumentModuleTotals>(
      data,
      DATA_REF_ID.INVOICE_DOCUMENT_TOTALS,
      { entityId: invoice.id }
    );

    expect(totals.subtotal.value).toBe(invoice.subtotal.formatted);
    expect(map(totals.taxes, "value")).toEqual(
      map(invoice.taxes, tax => tax.amount.formatted)
    );
    expect(totals.taxes[0]?.label).toContain(invoice.taxes[0]?.label);
    expect(totals.taxes[0]?.label).toContain(String(invoice.taxes[0]?.rate));
    expect(totals.total.value).toBe(invoice.total.formatted);
    expect(totals.paid.value).toBe(invoice.paidAmount.formatted);
    // The test's own arithmetic — the only sum allowed on this side.
    expect(totals.balance.value).toBe(
      formatMoney(
        invoice.total.amount - invoice.paidAmount.amount,
        invoice.total.currency
      )
    );
  });

  it("lists every payment taken against it, as the seed holds them", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const invoice = unpaidInvoice(data);
    expect(invoice.payments).toEqual([]);

    invoice.payments.push({
      id: "pay-in-flight",
      date: "2026-08-30",
      method: "Visa ···· 4242",
      amount: invoice.total,
      status: "pending"
    });
    const payments = resolveRef<DocumentModulePayment[]>(
      data,
      DATA_REF_ID.INVOICE_DOCUMENT_PAYMENTS,
      { entityId: invoice.id }
    );

    expect(map(payments, "id")).toEqual(map(invoice.payments, "id"));
    expect(map(payments, "method")).toEqual(map(invoice.payments, "method"));
    expect(map(payments, "date")).toEqual(map(invoice.payments, "date"));
    expect(map(payments, "amount")).toEqual(
      map(invoice.payments, payment => payment.amount.formatted)
    );
    expect(map(payments, payment => payment.status.label)).toEqual(
      map(invoice.payments, payment => PAYMENT_STATUS_LABEL[payment.status])
    );
  });

  it("warns of a payment still with the gateway, and only while one is", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const invoice = unpaidInvoice(data);
    const inFlight = () =>
      some(
        resolveRef<DocumentModuleMessage[]>(
          data,
          DATA_REF_ID.INVOICE_DOCUMENT_MESSAGES,
          { entityId: invoice.id }
        ),
        message =>
          /pending|progress|still with/i.test(
            `${message.title ?? ""} ${message.message}`
          )
      );

    expect(inFlight()).toBe(false);

    invoice.payments.push({
      id: "pay-in-flight",
      date: "2026-08-30",
      method: "Visa ···· 4242",
      amount: invoice.total,
      status: "pending"
    });

    expect(inFlight()).toBe(true);
  });
});

describe("invoice document — sharing and downloading", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("puts the document's own public link on the clipboard and says so", async () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const invoice = unpaidInvoice(data);
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    const result = dispatchMockAction(
      data,
      {},
      `${MOCK_ACTION.SHARE_INVOICE}:${invoice.id}`
    );
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());

    expect(writeText.mock.calls[0]?.[0]).toMatch(
      new RegExp(`/invoice/${invoice.shareToken}$`)
    );
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(`${result?.toast?.title} ${result?.toast?.description}`).toContain(
      invoice.number
    );
  });

  it("downloads by opening the document's print view (R11), and mutates nothing", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const invoice = unpaidInvoice(data);
    const before = invoice.status;

    const result = dispatchMockAction(
      data,
      {},
      `${MOCK_ACTION.DOWNLOAD}:invoice:${invoice.id}`
    );

    expect(result?.to).toBe(`/billing/invoices/${invoice.id}/print`);
    expect(result?.toast).toBeUndefined();
    expect(find(data.invoices, { id: invoice.id })?.status).toBe(before);
  });
});
