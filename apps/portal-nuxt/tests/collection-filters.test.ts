// -----------------------------------------------------------------------------
/**
 * @module tests/collection-filters
 * @description Structured filters on the paged panels (plan R5, gap doc X1):
 * a declared control writes ONE criteria key through
 * `collection-filter:<id>:<key>:<value>`, the collection narrows its whole
 * source by it — not the showing page — and an empty value clears. A date
 * range is inclusive at both ends; a select offers only values the showing
 * tab's own rows carry, so no choice returns nothing; and a filter keeps the
 * page index it was applied on, clamping only when the narrowed set no longer
 * reaches it (facades R12).
 *
 * Every expectation is hand-counted off the live seed with lodash rather than
 * read back off the collection, so the two implementations have to agree.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  ContractStatusCodes,
  InvoiceStatus,
  TicketStatusCodes
} from "@upmind-automation/types";
import { every, filter, map, sortBy, uniq } from "lodash-es";
import type { MockFilterControl } from "~/portal/mock/collection-filters";
import type { MockDataset } from "~/portal/mock/types";
import type { ListControlsState } from "~/portal/modules/list-controls/types";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  INVOICE_STATUS_TAB,
  PAGED_COLLECTION_ID,
  PRODUCT_STATUS_TAB,
  groupProductsCollection,
  invoiceStatusTab,
  invoicesCollection,
  pagedCollectionHandle,
  productStatusTab,
  ticketsCollection,
  ticketStatusTab
} from "~/portal/mock/collection-defs";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { LIST_CONTROLS_RANGE_SEPARATOR } from "~/portal/modules/list-controls/types";

const PRODUCTS_CONTEXT = { groupSlug: "products" };

/** Legacy's Active tabs — the tab each collection opens on when the route names none. */
const PRODUCT_ACTIVE = PRODUCT_STATUS_TAB.ACTIVE;
const TICKET_ACTIVE = ticketStatusTab(TicketStatusCodes.OPEN);

function filterValue(id: string, key: string, value: string): string {
  return `${mockActionValue(MOCK_ACTION.COLLECTION_FILTER, id)}:${key}:${value}`;
}

/** Every row the collection holds, page by page — the proof a filter narrowed the SOURCE. */
function everyRow<TRow>(instance: {
  useActions: () => { nextPage: () => void; prevPage: () => void };
  useContext: () => {
    data: { value: TRow[] };
    pagination: { value: { page: number; pages: number } };
  };
}): TRow[] {
  const { data, pagination } = instance.useContext();
  const actions = instance.useActions();
  const startedOn = pagination.value.page;

  while (pagination.value.page > 1) actions.prevPage();
  const rows: TRow[] = [];
  for (let page = 1; page <= pagination.value.pages; page += 1) {
    rows.push(...data.value);
    actions.nextPage();
  }

  while (pagination.value.page > 1) actions.prevPage();
  for (let page = 1; page < startedOn; page += 1) actions.nextPage();
  return rows;
}

function controlsFor(id: string, context: Record<string, string>) {
  return pagedCollectionHandle(
    id as never,
    useMockData(MOCK_DATASET_ID.HOSTGRID),
    context
  ).useContext().filterControls;
}

function controlKeys(controls: readonly MockFilterControl[]): string[] {
  return map(controls, control => control.key);
}

function optionValues(
  controls: readonly MockFilterControl[],
  key: string
): string[] {
  const control = controls.find(candidate => candidate.key === key);
  return map(
    filter(control?.options ?? [], option => option.value !== "any"),
    option => option.value
  );
}

describe("collection filters — one declared key narrows the whole collection", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("narrows products to a status across every page, and an empty value clears", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = groupProductsCollection.resolve(data, PRODUCTS_CONTEXT);
    const { pagination } = instance.useContext();

    const running = filter(
      data.products,
      product =>
        productStatusTab(product.status) === PRODUCT_ACTIVE &&
        product.status === ContractStatusCodes.ACTIVE
    );
    const openingTotal = pagination.value.total;
    expect(running.length).toBeGreaterThan(10);
    expect(openingTotal).toBeGreaterThan(running.length);

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.GROUP_PRODUCTS,
        "status",
        ContractStatusCodes.ACTIVE
      )
    );

    expect(pagination.value.total).toBe(running.length);
    expect(pagination.value.pages).toBeGreaterThan(1);
    // The narrowing reached the SOURCE, not the page: every row on every page.
    const narrowed = everyRow(instance);
    expect(narrowed).toHaveLength(running.length);
    expect(map(narrowed, product => product.id).sort()).toEqual(
      map(running, product => product.id).sort()
    );

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(PAGED_COLLECTION_ID.GROUP_PRODUCTS, "status", "")
    );
    expect(pagination.value.total).toBe(openingTotal);
  });

  it("narrows tickets by the department its tab offers", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = ticketsCollection.resolve(data, {});
    const { pagination } = instance.useContext();

    const billing = filter(
      data.tickets,
      ticket =>
        ticketStatusTab(ticket.status) === TICKET_ACTIVE &&
        ticket.department === "Billing"
    );
    expect(billing.length).toBeGreaterThan(0);

    dispatchMockAction(
      data,
      {},
      filterValue(PAGED_COLLECTION_ID.TICKETS, "department", "Billing")
    );
    expect(pagination.value.total).toBe(billing.length);
    expect(
      every(everyRow(instance), ticket => ticket.department === "Billing")
    ).toBe(true);

    dispatchMockAction(
      data,
      {},
      filterValue(PAGED_COLLECTION_ID.TICKETS, "department", "")
    );
    expect(pagination.value.total).toBeGreaterThan(billing.length);
  });
});

describe("date-range filter — a period, both ends inclusive", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("keeps the rows purchased ON the boundary days and drops the days outside", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = groupProductsCollection.resolve(data, PRODUCTS_CONTEXT);
    const { pagination } = instance.useContext();

    const showing = filter(
      data.products,
      product => productStatusTab(product.status) === PRODUCT_ACTIVE
    );
    const days = sortBy(uniq(map(showing, product => product.createdAt)));
    // A window inside the seed's own range, so both ends have days beyond them.
    const from = days[2];
    const to = days[5];
    expect(from).toBeDefined();
    expect(to).toBeDefined();
    expect(days.length).toBeGreaterThan(7);

    const inside = filter(
      showing,
      product => product.createdAt >= from! && product.createdAt <= to!
    );
    expect(inside.length).toBeLessThan(showing.length);

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.GROUP_PRODUCTS,
        "datePurchased",
        `${from}${LIST_CONTROLS_RANGE_SEPARATOR}${to}`
      )
    );

    expect(pagination.value.total).toBe(inside.length);
    const dates = map(everyRow(instance), product => product.createdAt);
    // Inclusive: the first and last day of the window are both still here.
    expect(dates).toContain(from);
    expect(dates).toContain(to);
    expect(every(dates, date => date >= from! && date <= to!)).toBe(true);

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(PAGED_COLLECTION_ID.GROUP_PRODUCTS, "datePurchased", "")
    );
    expect(pagination.value.total).toBe(showing.length);
  });

  it("a single-day window keeps that day alone", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = groupProductsCollection.resolve(data, PRODUCTS_CONTEXT);
    const { pagination } = instance.useContext();

    const showing = filter(
      data.products,
      product => productStatusTab(product.status) === PRODUCT_ACTIVE
    );
    const day = showing[1]?.createdAt;
    expect(day).toBeDefined();
    const sameDay = filter(showing, product => product.createdAt === day);

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.GROUP_PRODUCTS,
        "datePurchased",
        `${day}${LIST_CONTROLS_RANGE_SEPARATOR}${day}`
      )
    );

    expect(pagination.value.total).toBe(sameDay.length);
  });
});

describe("a select offers only values the showing tab's rows carry", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("the Active product tab offers no status its rows never hold", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const showing = filter(
      data.products,
      product => productStatusTab(product.status) === PRODUCT_ACTIVE
    );
    const present = uniq(map(showing, product => product.status)).sort();

    const offered = optionValues(
      controlsFor(PAGED_COLLECTION_ID.GROUP_PRODUCTS, PRODUCTS_CONTEXT),
      "status"
    );

    expect(offered.sort()).toEqual(present);
    // The tab holds no cancelled contract, so it is not on the menu.
    expect(offered).not.toContain(ContractStatusCodes.CANCELLED);
    expect(
      filter(data.products, { status: ContractStatusCodes.CANCELLED }).length
    ).toBeGreaterThan(0);
  });

  it("every option a select offers would return at least one row", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = invoicesCollection.resolve(data, {});
    const { pagination } = instance.useContext();

    const offered = optionValues(
      controlsFor(PAGED_COLLECTION_ID.INVOICES, {}),
      "status"
    );
    expect(offered.length).toBeGreaterThan(1);

    for (const value of offered) {
      dispatchMockAction(
        data,
        {},
        filterValue(PAGED_COLLECTION_ID.INVOICES, "status", value)
      );
      expect(pagination.value.total).toBeGreaterThan(0);
    }
  });

  it("offers no control at all over a column the showing tab holds one value of", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const showing = filter(
      data.tickets,
      ticket => ticketStatusTab(ticket.status) === TICKET_ACTIVE
    );

    const bandKeys = controlKeys(controlsFor(PAGED_COLLECTION_ID.TICKETS, {}));

    expect(uniq(map(showing, ticket => ticket.status))).toHaveLength(1);
    // The two questions the tab CANNOT answer for itself, and only those:
    // a status control here would offer the one value the tab already holds.
    expect(bandKeys).toEqual(["department", "dateCreated"]);
    expect(
      uniq(map(showing, ticket => ticket.department)).length
    ).toBeGreaterThan(1);
  });

  it("the Credited invoice tab asks when it was credited, and which of its two statuses", () => {
    const all = controlsFor(PAGED_COLLECTION_ID.INVOICES, {});
    const credited = controlsFor(PAGED_COLLECTION_ID.INVOICES, {
      status: INVOICE_STATUS_TAB.CREDITED
    });
    const gathered = uniq(
      map(
        filter(
          useMockData(MOCK_DATASET_ID.HOSTGRID).invoices,
          invoice =>
            invoiceStatusTab(invoice.status) === INVOICE_STATUS_TAB.CREDITED
        ),
        invoice => invoice.status
      )
    );

    expect(controlKeys(all)).toContain("status");
    expect(controlKeys(all)).not.toContain("dateCancelled");

    // The tab gathers the platform's own credited pair — a written-off
    // document and a refunded one — so it asks WHICH as well as when, under
    // the rule every other tab is held to.
    expect(gathered.sort()).toEqual(
      [InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED].sort()
    );
    expect(controlKeys(credited)).toEqual(
      expect.arrayContaining(["dateCancelled", "status"])
    );
    expect(optionValues(credited, "status").sort()).toEqual(gathered.sort());
    // And the question it asks is narrower than the whole ledger's.
    expect(optionValues(all, "status").length).toBeGreaterThan(
      optionValues(credited, "status").length
    );
  });
});

describe("applying a filter never resets the page index", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("holds page 2 while the narrowed set still reaches it", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = groupProductsCollection.resolve(data, PRODUCTS_CONTEXT);
    const { pagination } = instance.useContext();

    instance.useActions().nextPage();
    expect(pagination.value.page).toBe(2);

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.GROUP_PRODUCTS,
        "status",
        ContractStatusCodes.ACTIVE
      )
    );

    expect(pagination.value.pages).toBeGreaterThan(1);
    expect(pagination.value.page).toBe(2);
  });

  it("clamps to the last page when the narrowed set no longer reaches it", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = groupProductsCollection.resolve(data, PRODUCTS_CONTEXT);
    const { data: rows, pagination } = instance.useContext();

    instance.useActions().nextPage();
    expect(pagination.value.page).toBe(2);

    const awaiting = filter(data.products, {
      status: ContractStatusCodes.AWAITING_ACTIVATION
    });
    expect(awaiting.length).toBeGreaterThan(0);
    expect(awaiting.length).toBeLessThan(pagination.value.limit);

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.GROUP_PRODUCTS,
        "status",
        ContractStatusCodes.AWAITING_ACTIVATION
      )
    );

    expect(pagination.value.pages).toBe(1);
    expect(pagination.value.page).toBe(1);
    expect(rows.value).toHaveLength(awaiting.length);
  });
});

describe("the applied value comes back out of the collection", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("the band's own control opens on the applied value, and clearing returns it", () => {
    const data: MockDataset = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { appliedFilters } = pagedCollectionHandle(
      PAGED_COLLECTION_ID.GROUP_PRODUCTS,
      data,
      PRODUCTS_CONTEXT
    ).useContext();

    const bandControl = (key: string) => {
      const state = resolveDataRefProps(
        { value: dataRef(DATA_REF_ID.GROUP_PRODUCTS_CONTROLS) },
        data,
        PRODUCTS_CONTEXT
      )?.value as ListControlsState;
      return filter(state.filters ?? [], { key })[0];
    };

    expect(bandControl("status")?.value).toBe("");
    expect(bandControl("status")?.action).toBe(
      `${mockActionValue(
        MOCK_ACTION.COLLECTION_FILTER,
        PAGED_COLLECTION_ID.GROUP_PRODUCTS
      )}:status`
    );

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.GROUP_PRODUCTS,
        "status",
        ContractStatusCodes.ACTIVE
      )
    );

    expect(appliedFilters.value.status).toBe(ContractStatusCodes.ACTIVE);
    expect(bandControl("status")?.value).toBe(ContractStatusCodes.ACTIVE);
    // One control per emit — narrowing by status left the period alone.
    expect(bandControl("datePurchased")?.value).toBe("");

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(PAGED_COLLECTION_ID.GROUP_PRODUCTS, "status", "")
    );
    expect(bandControl("status")?.value).toBe("");
  });

  /**
   * `MockCollectionContext.appliedFilters` is declared as "each declared
   * control's applied value, "" when it narrows nothing" — total over the
   * controls, so a band can read a value for every control it renders.
   */
  it("names every declared control, empty when that control narrows nothing", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { appliedFilters, filterControls } = pagedCollectionHandle(
      PAGED_COLLECTION_ID.GROUP_PRODUCTS,
      data,
      PRODUCTS_CONTEXT
    ).useContext();

    expect(controlKeys(filterControls).sort()).toEqual(
      Object.keys(appliedFilters.value).sort()
    );
    expect(appliedFilters.value.status).toBe("");

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.GROUP_PRODUCTS,
        "status",
        ContractStatusCodes.ACTIVE
      )
    );
    expect(appliedFilters.value.datePurchased).toBe("");
  });

  it("a key no control declares changes nothing", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { pagination } = groupProductsCollection
      .resolve(data, PRODUCTS_CONTEXT)
      .useContext();
    const { appliedFilters } = pagedCollectionHandle(
      PAGED_COLLECTION_ID.GROUP_PRODUCTS,
      data,
      PRODUCTS_CONTEXT
    ).useContext();
    const before = pagination.value.total;

    dispatchMockAction(
      data,
      PRODUCTS_CONTEXT,
      filterValue(
        PAGED_COLLECTION_ID.GROUP_PRODUCTS,
        "noSuchColumn",
        "anything"
      )
    );

    expect(pagination.value.total).toBe(before);
    expect(appliedFilters.value.noSuchColumn).toBeUndefined();
  });
});
