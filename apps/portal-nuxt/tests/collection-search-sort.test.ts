// -----------------------------------------------------------------------------
/**
 * @module tests/collection-search-sort
 * @description Search and sort on the collection generic
 * (portal/mock/collections.ts). Search narrows `source()` output by
 * `criteria.query` over the def's declared `searchProps`, case-insensitively,
 * and keeps the page index CLAMPED rather than reset (plan R12/S10). Sort is
 * named options over a copy, never the platform's direction enum (R5/S3), and
 * the FIRST declared option is the order the panel opens in — there is no
 * unnamed order to fall back to, so the select always names what it shows.
 * A def declaring no options keeps its seed order and offers no select.
 *
 * Paired blind with tests/collection-search-sort.must-fail.patch.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { filter, map, maxBy, minBy } from "lodash-es";
import type { MockSortOption } from "~/portal/mock/collections";
import {
  PAGED_COLLECTION_ID,
  groupProductsCollection,
  invoicesCollection,
  pagedCollectionHandle
} from "~/portal/mock/collection-defs";
import { defineMockCollection } from "~/portal/mock/collections";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

/** The inline defs ignore the dataset; a definition's registry is keyed on the object, so any real one serves. */
const KEY_DATASET = HOSTGRID_MOCK_DATASET;

type Row = { readonly id: string; readonly name: string; readonly tag: string };

/** Seed order is r1…r6; "alpha" hits r1 (tag), r2 (name) and r4 (tag, mixed case), "one" hits r2 alone. */
const ROWS: readonly Row[] = [
  { id: "r1", name: "Delta", tag: "alpha" },
  { id: "r2", name: "Alpha one", tag: "zed" },
  { id: "r3", name: "Bravo", tag: "beta" },
  { id: "r4", name: "Charlie", tag: "ALPHAbet" },
  { id: "r5", name: "Echo", tag: "gamma" },
  { id: "r6", name: "Foxtrot", tag: "delta" }
];

const ROW_SORT_OPTIONS: readonly MockSortOption<Row>[] = [
  {
    value: "name-az",
    label: "Name A–Z",
    compare: (a, b) => a.name.localeCompare(b.name)
  },
  {
    value: "name-za",
    label: "Name Z–A",
    compare: (a, b) => b.name.localeCompare(a.name)
  }
];

/**
 * A fresh definition per test — each owns its registry, so state never leaks
 * between tests. Searchable with NO sort options, so these rows stay in seed
 * order and a search assertion reads the one axis it is about.
 */
function makeRowsDef(limit?: number) {
  return defineMockCollection<Row, Record<string, never>>(() => ({
    source: () => ROWS,
    limit,
    filters: () => ({}),
    searchProps: ["name", "tag"]
  }));
}

/** The same rows with an order declared — the first option is what it opens in. */
function makeSortedRowsDef(limit?: number) {
  return defineMockCollection<Row, Record<string, never>>(() => ({
    source: () => ROWS,
    limit,
    filters: () => ({}),
    searchProps: ["name", "tag"],
    sortOptions: ROW_SORT_OPTIONS
  }));
}

function pageIds(rows: readonly Row[]): string[] {
  return map(rows, row => row.id);
}

describe("collection search — the core narrows by criteria.query", () => {
  it("matches case-insensitively across every declared prop, and clearing restores", () => {
    const instance = makeRowsDef(10).resolve(KEY_DATASET);
    const { data: rows, pagination, appliedQuery } = instance.useContext();
    const actions = instance.useActions();

    expect(appliedQuery.value).toBe("");
    expect(pageIds(rows.value)).toEqual(["r1", "r2", "r3", "r4", "r5", "r6"]);

    // "ALPHAbet" is the case proof; r1 matches on `tag`, r2 on `name`.
    actions.search("alpha");
    expect(pageIds(rows.value)).toEqual(["r1", "r2", "r4"]);
    expect(pagination.value.total).toBe(3);
    expect(appliedQuery.value).toBe("alpha");

    actions.search("");
    expect(pagination.value.total).toBe(6);
    expect(appliedQuery.value).toBe("");
  });

  it("shrinks the page count, and a def with no searchProps never narrows", () => {
    const searchable = makeRowsDef(2).resolve(KEY_DATASET);
    expect(searchable.useContext().pagination.value.pages).toBe(3);
    searchable.useActions().search("alpha");
    expect(searchable.useContext().pagination.value.pages).toBe(2);

    const plain = defineMockCollection<Row, Record<string, never>>(() => ({
      source: () => ROWS,
      limit: 2,
      filters: () => ({})
    })).resolve(KEY_DATASET);

    plain.useActions().search("alpha");
    expect(plain.useContext().pagination.value.total).toBe(6);
  });

  it("CLAMPS the page into the new range, and keeps it where it still fits (R12/S10)", () => {
    const deepDef = makeRowsDef(2);
    const deep = deepDef.resolve(KEY_DATASET);
    const { data: rows, pagination } = deep.useContext();

    deep.useActions().nextPage();
    deep.useActions().nextPage();
    expect(pagination.value.page).toBe(3);

    // One match left — one page — so the index clamps to 1 and the row shows.
    deep.useActions().search("one");
    expect(pagination.value.page).toBe(1);
    expect(pageIds(rows.value)).toEqual(["r2"]);

    // Clearing keeps the CLAMPED page: the platform writes the corrected index
    // back, it never restores the one you left.
    deep.useActions().search("");
    expect(pagination.value.page).toBe(1);
    expect(pagination.value.total).toBe(6);

    // A search that still leaves two pages holds the page you were on.
    const shallow = makeRowsDef(2).resolve(KEY_DATASET);
    shallow.useActions().nextPage();
    expect(shallow.useContext().pagination.value.page).toBe(2);
    shallow.useActions().search("alpha");
    expect(shallow.useContext().pagination.value.page).toBe(2);
    expect(pageIds(shallow.useContext().data.value)).toEqual(["r4"]);
  });
});

describe("collection sort — named options, the first one applied", () => {
  it("opens on the first option, and an empty or unknown value falls back to it", () => {
    const instance = makeSortedRowsDef(10).resolve(KEY_DATASET);
    const { data: rows, activeSort } = instance.useContext();
    const actions = instance.useActions();

    // The panel opens in a NAMED order, so the select can label what it shows.
    expect(activeSort.value).toBe("name-az");
    expect(pageIds(rows.value)).toEqual(["r2", "r3", "r4", "r1", "r5", "r6"]);

    actions.applySort("name-za");
    expect(activeSort.value).toBe("name-za");
    expect(pageIds(rows.value)).toEqual(["r6", "r5", "r1", "r4", "r3", "r2"]);

    // Nothing to clear TO: an empty, unknown or absent value is the opening one.
    actions.applySort("");
    expect(activeSort.value).toBe("name-az");
    expect(pageIds(rows.value)).toEqual(["r2", "r3", "r4", "r1", "r5", "r6"]);

    actions.applySort("name-za");
    actions.applySort("no-such-order");
    expect(activeSort.value).toBe("name-az");

    actions.applySort("name-za");
    actions.applySort(undefined);
    expect(activeSort.value).toBe("name-az");

    // The source array is never reordered in place — the seed still reads r1 first.
    expect(ROWS[0]?.id).toBe("r1");
  });

  it("a def with no options keeps its seed order and offers no select", () => {
    const {
      data: rows,
      activeSort,
      sortOptions
    } = makeRowsDef(10).resolve(KEY_DATASET).useContext();

    expect(sortOptions).toEqual([]);
    expect(activeSort.value).toBeUndefined();
    expect(pageIds(rows.value)).toEqual(["r1", "r2", "r3", "r4", "r5", "r6"]);
  });

  it("keeps the page — a sort reorders rows, it never changes their count", () => {
    const instance = makeSortedRowsDef(2).resolve(KEY_DATASET);
    const { pagination, data: rows } = instance.useContext();

    instance.useActions().nextPage();
    expect(pagination.value.page).toBe(2);
    expect(pageIds(rows.value)).toEqual(["r4", "r1"]);

    instance.useActions().applySort("name-za");
    expect(pagination.value.page).toBe(2);
    expect(pageIds(rows.value)).toEqual(["r1", "r4"]);
  });

  it("publishes label-only descriptors — never the compare functions", () => {
    const { sortOptions } = makeSortedRowsDef()
      .resolve(KEY_DATASET)
      .useContext();

    expect(sortOptions).toEqual([
      { value: "name-az", label: "Name A–Z" },
      { value: "name-za", label: "Name Z–A" }
    ]);
    expect(sortOptions.every(option => !("compare" in option))).toBe(true);
  });
});

describe("search and sort against the live seeds", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("an invoice number narrows the panel's own collection, case-insensitively", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const handle = pagedCollectionHandle(
      PAGED_COLLECTION_ID.INVOICES,
      data,
      {}
    );
    const { pagination } = handle.useContext();

    expect(pagination.value.total).toBeGreaterThan(1);

    handle.useActions().search("inv-0094");
    expect(pagination.value.total).toBe(1);

    handle.useActions().search("");
    expect(pagination.value.total).toBeGreaterThan(1);
  });

  it("sorts invoices newest-first off the ISO issue date", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = invoicesCollection.resolve(data, {});
    const { data: rows, activeSort } = instance.useContext();

    const newest = maxBy(data.invoices, invoice => invoice.issuedDate);
    const oldest = minBy(data.invoices, invoice => invoice.issuedDate);
    expect(newest?.issuedDate).toBeDefined();
    expect(oldest?.issuedDate).toBeDefined();
    expect(newest?.issuedDate).not.toBe(oldest?.issuedDate);

    // The ledger OPENS newest-first — the order the seed already reads in, so
    // the select names the order rather than presenting an unlabelled one.
    expect(activeSort.value).toBe("newest");
    expect(rows.value[0]?.issuedDate).toBe(newest?.issuedDate);

    instance.useActions().applySort("oldest");
    expect(rows.value[0]?.issuedDate).toBe(oldest?.issuedDate);

    // The pager seam resolves the SAME instance the panel renders.
    expect(
      pagedCollectionHandle(PAGED_COLLECTION_ID.INVOICES, data, {}).useContext()
        .activeSort.value
    ).toBe("oldest");
  });

  it("the products listing opens newest-first, and ranks undated one-time rows last by renewal", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const context = { groupSlug: "products" };
    const instance = groupProductsCollection.resolve(data, context);
    const { data: rows, activeSort, sortOptions } = instance.useContext();

    expect(map(sortOptions, option => option.value)).toEqual([
      "newest",
      "name-az",
      "renewal-soonest",
      "status"
    ]);
    // What the client bought last leads — `createdAt` is the platform's own
    // `created_at`, and the only date a product carries in every status.
    expect(activeSort.value).toBe("newest");
    const acquired = map(rows.value, product => product.createdAt);
    expect(acquired).toEqual([...acquired].sort().reverse());

    instance.useActions().applySort("name-az");
    const names = map(rows.value, product => product.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

    instance.useActions().applySort("renewal-soonest");
    const dated = filter(
      rows.value,
      product => product.nextDueDate !== undefined
    );
    const dates = map(dated, product => product.nextDueDate);
    expect(dates.length).toBeGreaterThan(1);
    expect(dates).toEqual([...dates].sort());
    // A product with no renewal never displaces one that has a date.
    expect(
      map(rows.value, product => product.nextDueDate !== undefined)
    ).toEqual(
      [...map(rows.value, product => product.nextDueDate !== undefined)].sort(
        (a, b) => Number(b) - Number(a)
      )
    );
  });
});
