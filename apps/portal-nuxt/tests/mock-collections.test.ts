// -----------------------------------------------------------------------------
/**
 * @module tests/mock-collections
 * @description The mock collection generic (portal/mock/collections.ts) pages
 * with the PLATFORM's semantics — the PaginationInfo math, the bound no-ops,
 * the materialised clamp, the registry lifetimes — proven against a live
 * dataset so store mutations shift boundaries the way `unshift` does in the
 * real store actions.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InvoiceStatus, InvoiceStatusGroups } from "@upmind-automation/types";
import { filter } from "lodash-es";
import type { MockDataset, MockInvoice } from "~/portal/mock/types";
import {
  defineMockCollection,
  MOCK_PAGE_LIMIT
} from "~/portal/mock/collections";
import { money } from "~/portal/mock/hostgrid.filler";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

type InvoiceFilters = {
  status: (value?: string) => void;
};

/** A fresh definition per test — each owns its registry, so page state never leaks between tests. */
function makeInvoicesDef(limit?: number) {
  return defineMockCollection<MockInvoice, InvoiceFilters>(
    (data: MockDataset) => ({
      source: criteria => {
        if (criteria.status === undefined) return data.invoices;
        return filter(
          data.invoices,
          invoice => invoice.status === criteria.status
        );
      },
      limit,
      filters: apply => ({
        status: value => apply({ status: value })
      })
    })
  );
}

describe("mock collections — the headless list contract, mocked", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("pages at the platform default and derives PaginationInfo exactly", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = makeInvoicesDef().resolve(data);
    const { data: rows, pagination } = instance.useContext();
    const meta = instance.useMeta();

    // The expectations derive from the live seed, so seed growth cannot
    // silently rot them; the >10 guard keeps the paging assertions real.
    const total = data.invoices.length;
    expect(total).toBeGreaterThan(MOCK_PAGE_LIMIT);
    expect(pagination.value).toEqual({
      limit: MOCK_PAGE_LIMIT,
      total,
      page: 1,
      pages: Math.ceil(total / MOCK_PAGE_LIMIT),
      from: 1,
      to: MOCK_PAGE_LIMIT
    });
    expect(rows.value).toHaveLength(MOCK_PAGE_LIMIT);
    expect(meta.hasPages.value).toBe(true);
    expect(meta.hasNextPage.value).toBe(true);
    expect(meta.hasPrevPage.value).toBe(false);
    expect(meta.isEmpty.value).toBe(false);
    expect(meta.isLoading.value).toBe(false);
  });

  it("nextPage/prevPage move within bounds and no-op at them (R11)", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = makeInvoicesDef().resolve(data);
    const { data: rows, pagination } = instance.useContext();
    const actions = instance.useActions();

    const total = data.invoices.length;
    const lastPage = Math.ceil(total / MOCK_PAGE_LIMIT);
    const lastPageRows = total - (lastPage - 1) * MOCK_PAGE_LIMIT;

    while (pagination.value.page < lastPage) actions.nextPage();
    expect(pagination.value.page).toBe(lastPage);
    expect(pagination.value.from).toBe((lastPage - 1) * MOCK_PAGE_LIMIT + 1);
    expect(pagination.value.to).toBe(total);
    expect(rows.value).toHaveLength(lastPageRows);

    actions.nextPage();
    expect(pagination.value.page).toBe(lastPage);

    while (pagination.value.page > 1) actions.prevPage();
    expect(pagination.value.page).toBe(1);
    actions.prevPage();
    expect(pagination.value.page).toBe(1);
  });

  it("an empty result derives the platform's zero shape", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = makeInvoicesDef().resolve(data);
    const { pagination } = instance.useContext();
    const meta = instance.useMeta();

    instance.useActions().filters.status("no-such-status");

    expect(pagination.value).toEqual({
      limit: MOCK_PAGE_LIMIT,
      total: 0,
      page: 1,
      pages: 1,
      from: 0,
      to: 0
    });
    expect(meta.isEmpty.value).toBe(true);
    expect(meta.hasPages.value).toBe(false);
  });

  it("a filter keeps the page index and materialises the clamp (R12/R7)", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = makeInvoicesDef(2).resolve(data);
    const { pagination } = instance.useContext();
    const actions = instance.useActions();

    // At limit 2 the whole collection spans many pages; walk to the end.
    const lastPage = Math.ceil(data.invoices.length / 2);
    while (pagination.value.page < pagination.value.pages) actions.nextPage();
    expect(pagination.value.page).toBe(lastPage);

    // Narrowing to one status shortens the collection: the index survives but
    // clamps to the new end, and clearing the filter STAYS on the clamped page
    // — the platform writes the corrected index back, never restoring the old.
    const unpaidPages = Math.ceil(
      filter(data.invoices, invoice =>
        InvoiceStatusGroups.UNPAID.includes(invoice.status)
      ).length / 2
    );
    expect(unpaidPages).toBeLessThan(lastPage);

    actions.filters.status(InvoiceStatus.UNPAID);
    expect(pagination.value.page).toBe(unpaidPages);
    actions.filters.status(undefined);
    expect(pagination.value.page).toBe(unpaidPages);
  });

  it("a store unshift shifts page boundaries — paging derives, never caches", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = makeInvoicesDef(2).resolve(data);
    const { data: rows } = instance.useContext();

    const firstBefore = rows.value[0];
    expect(firstBefore).toBeDefined();
    if (firstBefore === undefined) return;

    data.invoices.unshift({
      id: "inv-test-unshift",
      number: "INV-TEST",
      issuedDate: "2026-08-27",
      dueDate: "2026-08-27",
      total: money(1),
      status: InvoiceStatus.UNPAID
    });

    expect(rows.value[0]?.id).toBe("inv-test-unshift");
    expect(rows.value[1]?.id).toBe(firstBefore.id);
  });

  it("resetMockData resets page state — the registry keys the dataset object (R7)", () => {
    const definition = makeInvoicesDef();
    const first = definition.resolve(useMockData(MOCK_DATASET_ID.HOSTGRID));
    first.useActions().nextPage();
    expect(first.useContext().pagination.value.page).toBe(2);

    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    const second = definition.resolve(useMockData(MOCK_DATASET_ID.HOSTGRID));
    expect(second.useContext().pagination.value.page).toBe(1);
  });

  it("destroy drops the instance so the next resolve re-mints", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const definition = makeInvoicesDef();

    const first = definition.resolve(data);
    first.useActions().nextPage();
    first.useActions().destroy();

    const second = definition.resolve(data);
    expect(second).not.toBe(first);
    expect(second.useContext().pagination.value.page).toBe(1);
  });

  it("context keys hold independent page state (R6)", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const definition = defineMockCollection<MockInvoice, InvoiceFilters>(
      (datasetForScope: MockDataset) => ({
        source: () => datasetForScope.invoices,
        limit: 2,
        filters: apply => ({
          status: value => apply({ status: value })
        })
      }),
      context => context.groupSlug ?? ""
    );

    const websites = definition.resolve(data, { groupSlug: "websites" });
    const domains = definition.resolve(data, { groupSlug: "domains" });
    websites.useActions().nextPage();

    expect(websites.useContext().pagination.value.page).toBe(2);
    expect(domains.useContext().pagination.value.page).toBe(1);

    // The same context resolves the SAME instance — minted once per key.
    expect(definition.resolve(data, { groupSlug: "websites" })).toBe(websites);
  });

  it("findOne/getOne search the CURRENT PAGE, as the platform seeds useCollection(query.data)", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = makeInvoicesDef(2).resolve(data);
    const { data: rows, findOne, getOne } = instance.useContext();

    const onPage = rows.value[0];
    const offPage = data.invoices[4];
    expect(onPage).toBeDefined();
    expect(offPage).toBeDefined();
    if (onPage === undefined || offPage === undefined) return;

    expect(getOne(onPage.id)?.id).toBe(onPage.id);
    expect(getOne(offPage.id)).toBeUndefined();
    expect(findOne({ id: onPage.id })?.id).toBe(onPage.id);
    expect(getOne()).toBeUndefined();
  });
});
