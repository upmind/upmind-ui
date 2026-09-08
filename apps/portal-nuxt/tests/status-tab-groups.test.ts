// -----------------------------------------------------------------------------
/**
 * @module tests/status-tab-groups
 * @description Plan R7: the tab vocabularies keep their ROUTE spellings while
 * the narrowing behind them is the platform's own enum grouping. The oracle
 * is `@upmind-automation/types` — `InvoiceStatusGroups`, `ContractStatusCodes`,
 * `TicketStatusCodes` — so a tab that files a refunded invoice under Paid, or
 * an overdue one outside Unpaid, is a red here and not a rename away from
 * green.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  ContractStatusCodes,
  InvoiceStatus,
  InvoiceStatusGroups,
  TicketStatusCodes
} from "@upmind-automation/types";
import { forEach, map, values, without } from "lodash-es";
import type { MockCollectionDefinition } from "~/portal/mock/collections";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import {
  INVOICE_STATUS_TAB,
  PRODUCT_STATUS_TAB,
  TICKET_STATUS_TAB,
  groupProductsCollection,
  invoiceStatusTab,
  invoicesCollection,
  productStatusTab,
  ticketStatusTab,
  ticketsCollection
} from "~/portal/mock/collection-defs";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

/**
 * The tabs page, so membership is a question about the whole panel rather
 * than about its first ten rows. Rewinds so a later read of the same
 * memoised instance opens where it did.
 */
function allRowIds<TRow extends { id: string }>(
  definition: MockCollectionDefinition<TRow, unknown>,
  data: MockDataset,
  context: DataRouteContext
): string[] {
  const instance = definition.resolve(data, context);
  const { data: page, pagination } = instance.useContext();
  const { nextPage, prevPage } = instance.useActions();

  while (pagination.value.page > 1) prevPage();
  const ids: string[] = [];
  const pages = pagination.value.pages;
  for (let index = 0; index < pages; index += 1) {
    ids.push(...map(page.value, "id"));
    nextPage();
  }
  while (pagination.value.page > 1) prevPage();
  return ids;
}

describe("status tabs — R7: route spellings outside, platform enums inside", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("the invoice tabs keep the query values legacy's routes became", () => {
    expect(INVOICE_STATUS_TAB).toEqual({
      ALL: "all",
      UNPAID: "unpaid",
      PAID: "paid",
      CREDITED: "credited"
    });
  });

  it("every wire status files under the tab its platform group names", () => {
    forEach(InvoiceStatusGroups.PAID, status =>
      expect(invoiceStatusTab(status)).toBe(INVOICE_STATUS_TAB.PAID)
    );
    forEach(InvoiceStatusGroups.UNPAID, status =>
      expect(invoiceStatusTab(status)).toBe(INVOICE_STATUS_TAB.UNPAID)
    );
    forEach(InvoiceStatusGroups.CREDITED, status =>
      expect(invoiceStatusTab(status)).toBe(INVOICE_STATUS_TAB.CREDITED)
    );
  });

  it("a refunded invoice shows under Credited and never under Paid", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const subject = data.invoices[0];
    if (subject === undefined) throw new Error("seed carries no invoices");
    subject.status = InvoiceStatus.REFUNDED;

    expect(
      allRowIds(invoicesCollection, data, {
        status: INVOICE_STATUS_TAB.CREDITED
      })
    ).toContain(subject.id);
    expect(
      allRowIds(invoicesCollection, data, { status: INVOICE_STATUS_TAB.PAID })
    ).not.toContain(subject.id);
  });

  it("an overdue invoice is still owed, so it shows under Unpaid", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const subject = data.invoices[1];
    if (subject === undefined) throw new Error("seed carries too few invoices");
    subject.status = InvoiceStatus.OVERDUE;

    expect(
      allRowIds(invoicesCollection, data, { status: INVOICE_STATUS_TAB.UNPAID })
    ).toContain(subject.id);
    expect(
      allRowIds(invoicesCollection, data, { status: INVOICE_STATUS_TAB.PAID })
    ).not.toContain(subject.id);
    expect(
      allRowIds(invoicesCollection, data, { status: INVOICE_STATUS_TAB.ALL })
    ).toContain(subject.id);
  });

  it("the product tabs put a cancelled contract on one side and every other code on the other", () => {
    expect(PRODUCT_STATUS_TAB).toEqual({
      ALL: "all",
      ACTIVE: "active",
      CANCELLED: "cancelled"
    });
    expect(productStatusTab(ContractStatusCodes.CANCELLED)).toBe(
      PRODUCT_STATUS_TAB.CANCELLED
    );
    forEach(
      without(values(ContractStatusCodes), ContractStatusCodes.CANCELLED),
      status => expect(productStatusTab(status)).toBe(PRODUCT_STATUS_TAB.ACTIVE)
    );
  });

  it("a cancelled product leaves the Active tab for the Cancelled one", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const subject = data.products[0];
    if (subject === undefined) throw new Error("seed carries no products");
    subject.status = ContractStatusCodes.CANCELLED;
    const context = { groupSlug: subject.groupSlug };

    expect(
      allRowIds(groupProductsCollection, data, {
        ...context,
        status: PRODUCT_STATUS_TAB.CANCELLED
      })
    ).toContain(subject.id);
    expect(
      allRowIds(groupProductsCollection, data, {
        ...context,
        status: PRODUCT_STATUS_TAB.ACTIVE
      })
    ).not.toContain(subject.id);
  });

  it("a suspended product is not cancelled, so the Active tab still carries it", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const subject = data.products[0];
    if (subject === undefined) throw new Error("seed carries no products");
    subject.status = ContractStatusCodes.SUSPENDED;

    expect(
      allRowIds(groupProductsCollection, data, {
        groupSlug: subject.groupSlug,
        status: PRODUCT_STATUS_TAB.ACTIVE
      })
    ).toContain(subject.id);
  });

  it("the ticket tabs close only what the platform calls closed", () => {
    expect(TICKET_STATUS_TAB).toEqual({ ACTIVE: "open", CLOSED: "closed" });
    expect(ticketStatusTab(TicketStatusCodes.CLOSED)).toBe(
      TICKET_STATUS_TAB.CLOSED
    );
    forEach(
      without(values(TicketStatusCodes), TicketStatusCodes.CLOSED),
      status => expect(ticketStatusTab(status)).toBe(TICKET_STATUS_TAB.ACTIVE)
    );
  });

  it("a closed thread leaves the Active tab; an awaiting-response one stays on it", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const closed = data.tickets[0];
    const waiting = data.tickets[1];
    if (closed === undefined || waiting === undefined) {
      throw new Error("seed carries too few tickets");
    }
    closed.status = TicketStatusCodes.CLOSED;
    waiting.status = TicketStatusCodes.AWAITING_RESPONSE;

    const active = allRowIds(ticketsCollection, data, {
      status: TICKET_STATUS_TAB.ACTIVE
    });
    const closedTab = allRowIds(ticketsCollection, data, {
      status: TICKET_STATUS_TAB.CLOSED
    });

    expect(active).not.toContain(closed.id);
    expect(active).toContain(waiting.id);
    expect(closedTab).toContain(closed.id);
    expect(closedTab).not.toContain(waiting.id);
  });
});
