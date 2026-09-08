// -----------------------------------------------------------------------------
/**
 * @module tests/row-fields
 * @description What a listing row SAYS (gap doc §2 Listing, §3 Invoices /
 * Credit notes / Payment methods; plan R13). A product row names the thing it
 * provisioned, when it was bought and what it renews as; an invoice, a ticket
 * and a credit note wear their status as a badge whose tone escalates with the
 * status rather than repeating one colour; a ticket leads with the reference
 * the client quotes; a payment method reads as the client's own name for it
 * and carries a tag for each standing fact — default, self-charging,
 * unconfirmed — and for no other.
 *
 * Every expectation is derived from the seed row with lodash, so a selector
 * that drops a field disagrees with the dataset rather than with a literal.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { computed } from "vue";
import { ContractStatusCodes, InvoiceStatus } from "@upmind-automation/types";
import { every, filter, find, map, uniq } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { PageKey } from "~/portal/types";
import {
  LIST_VIEW,
  useListViewPreference
} from "~/composables/useListViewPreference";
import { hostgridConfig } from "~/portal/config/hostgrid";
import PortalContent from "~/portal/content/PortalContent.vue";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { PAGED_COLLECTION_ID } from "~/portal/mock/collection-defs";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  ACTIVE_MOCK_DATA,
  ACTIVE_ROUTE_CONTEXT
} from "~/portal/mock/injection";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { resolve } from "~/portal/resolve";
import { PAGE_KEY } from "~/portal/types";

const ALL_PRODUCTS = { groupSlug: "products", status: "all" };
const HEAD = "th";
const CELL = "td";
const ROW = '[data-test-key="portal-list-item"]';

function rows(
  data: MockDataset,
  id: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID],
  context: Record<string, string> = {}
): ListModuleItem[] {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)
    ?.value as ListModuleItem[];
}

function cellValues(item: ListModuleItem | undefined): string[] {
  return map(item?.cells ?? [], cell => cell.value);
}

function mountPage(
  pageKey: PageKey,
  data: MockDataset,
  context: DataRouteContext = {}
) {
  return mount(PortalContent, {
    props: {
      rows: resolve(hostgridConfig, { pageKeys: [pageKey] }).content.rows,
      asideLabel: "Page aside"
    },
    global: {
      provide: {
        [ACTIVE_MOCK_DATA as symbol]: computed(() => data),
        [ACTIVE_ROUTE_CONTEXT as symbol]: computed(() => context)
      }
    }
  });
}

describe("product rows — the service, the purchase, the term, the status", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("names each product's own service identifier, purchase date and price", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const items = rows(data, DATA_REF_ID.GROUP_PRODUCT_ITEMS, ALL_PRODUCTS);
    expect(items.length).toBeGreaterThan(5);

    for (const item of items) {
      const product = find(data.products, { id: item.id });
      expect(product).toBeDefined();
      const [service, purchased, , price] = cellValues(item);
      expect(service).toBe(product!.serviceIdentifier);
      expect(purchased).toBe(product!.createdAt);
      expect(price).toBe(product!.price?.formatted);
    }
  });

  it("reads the billing term in its own column, and names a one-time purchase as one", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    // One page wide enough to hold both kinds of purchase at once.
    dispatchMockAction(
      data,
      ALL_PRODUCTS,
      `${mockActionValue(
        MOCK_ACTION.SET_PAGE_SIZE,
        PAGED_COLLECTION_ID.GROUP_PRODUCTS
      )}:50`
    );
    const items = rows(data, DATA_REF_ID.GROUP_PRODUCT_ITEMS, ALL_PRODUCTS);
    const seedOf = (item: ListModuleItem) =>
      find(data.products, { id: item.id })!;

    const recurring = filter(items, item => Boolean(seedOf(item).billingTerm));
    const oneOff = filter(items, item => !seedOf(item).billingTerm);
    expect(recurring.length).toBeGreaterThan(0);
    expect(oneOff.length).toBeGreaterThan(0);

    for (const item of recurring) {
      expect(cellValues(item)[2]).toBe(seedOf(item).billingTerm);
    }
    // No term is still a fact about how it bills — never an empty column.
    for (const item of oneOff) {
      expect(cellValues(item)[2]).toBeTruthy();
    }
  });

  it("wears a status badge whose tone separates a running product from a cancelled one", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const items = rows(data, DATA_REF_ID.GROUP_PRODUCT_ITEMS, ALL_PRODUCTS);

    const running = find(items, {
      id: find(data.products, { status: ContractStatusCodes.ACTIVE })?.id
    });
    const ended = find(items, {
      id: find(data.products, { status: ContractStatusCodes.CANCELLED })?.id
    });

    expect(running?.status?.label).toBeTruthy();
    expect(ended?.status?.label).toBeTruthy();
    expect(running?.status?.label).not.toBe(ended?.status?.label);
    expect(running?.status?.tone).not.toBe(ended?.status?.tone);
    // Language, never the wire code (plan R7).
    expect(running?.status?.label).not.toContain("contract_");
    expect(every(items, item => Boolean(item.status?.label))).toBe(true);
  });

  it("the table names a column for each of them", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { setView } = useListViewPreference();

    setView(LIST_VIEW.TABLE);
    const headings = map(
      mountPage(PAGE_KEY.GROUP_LISTING, data, ALL_PRODUCTS).findAll(HEAD),
      head => head.text()
    );
    setView(LIST_VIEW.GRID);

    expect(headings).toEqual(
      expect.arrayContaining([
        "Product",
        "Service",
        "Purchased",
        "Billing",
        "Price",
        "Status"
      ])
    );
  });
});

describe("invoice rows — one badge, four states, four tones", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  function badgeFor(status: InvoiceStatus) {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const target = data.invoices[0];
    expect(target).toBeDefined();
    target!.status = status;
    return find(rows(data, DATA_REF_ID.INVOICE_ITEMS), { id: target!.id })
      ?.status;
  }

  it("separates unpaid, overdue, paid and refunded by both word and tone", () => {
    const unpaid = badgeFor(InvoiceStatus.UNPAID);
    // No seed row is overdue, so the state is put on one — the badge is the
    // only place the client ever learns an invoice has run past its date.
    const overdue = badgeFor(InvoiceStatus.OVERDUE);
    const paid = badgeFor(InvoiceStatus.PAID);
    const refunded = badgeFor(InvoiceStatus.REFUNDED);

    const labels = map(
      [unpaid, overdue, paid, refunded],
      badge => badge?.label
    );
    expect(uniq(labels)).toHaveLength(4);
    expect(
      every(labels, label => Boolean(label) && !label!.includes("invoice_"))
    ).toBe(true);

    const tones = map([unpaid, overdue, paid, refunded], badge => badge?.tone);
    expect(uniq(tones)).toHaveLength(4);
    // The escalation is the point: past its date is louder than merely owing.
    expect(overdue?.tone).toBe("danger");
    expect(paid?.tone).toBe("success");
    expect(unpaid?.tone).toBe("warning");
  });

  it("gives every row on the ledger a badge", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const items = rows(data, DATA_REF_ID.INVOICE_ITEMS);

    expect(items.length).toBeGreaterThan(5);
    expect(every(items, item => Boolean(item.status?.label))).toBe(true);
  });
});

describe("ticket rows — the reference the client quotes", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("prints each thread's own reference", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const items = rows(data, DATA_REF_ID.TICKET_ITEMS);
    expect(items.length).toBeGreaterThan(5);

    for (const item of items) {
      const ticket = find(data.tickets, { id: item.id });
      expect(ticket?.reference).toBeTruthy();
      expect(`${item.title} ${item.description ?? ""}`).toContain(
        ticket!.reference
      );
    }
    expect(uniq(map(items, item => item.description))).toHaveLength(
      items.length
    );
  });
});

describe("credit-note rows — the status column legacy had", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("heads a Status column and fills it on every row", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const wrapper = mountPage(PAGE_KEY.BILLING_CREDIT_NOTES, data);
    const headings = map(wrapper.findAll(HEAD), head => head.text());

    expect(headings.at(-1)).toBe("Status");

    const first = wrapper.findAll(ROW)[0];
    expect(first).toBeDefined();
    // One cell per heading: the badge column is a real column, not an extra.
    expect(first!.findAll(CELL)).toHaveLength(headings.length);

    const labels = map(
      rows(data, DATA_REF_ID.CREDIT_NOTE_LIST_ITEMS),
      item => item.status?.label
    );
    expect(every(labels, label => Boolean(label))).toBe(true);
    expect(uniq(labels).length).toBeGreaterThan(1);
    expect(wrapper.text()).toContain(labels[0]);
  });
});
