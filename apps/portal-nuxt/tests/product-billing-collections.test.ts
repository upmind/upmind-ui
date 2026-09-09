// -----------------------------------------------------------------------------
/**
 * @module tests/product-billing-collections
 * @description Plan R6's discriminator: a product's own invoices and credit
 * notes are the account ledger narrowed by `productId`, not a second ledger.
 * The narrowing has to survive every refinement — a search must not reach a
 * document raised for another product, and two products open on the same
 * definition must page independently, which is what a per-scope instance
 * buys and a shared one silently loses.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { assign, every, filter, find, map } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockInvoice } from "~/portal/mock/types";
import {
  PAGED_COLLECTION_ID,
  pagedCollectionHandle,
  productCreditNotesCollection,
  productInvoicesCollection
} from "~/portal/mock/collection-defs";
import { MOCK_PAGE_LIMIT } from "~/portal/mock/collections";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const PRODUCT_ID = "prod-analytics";
const OTHER_PRODUCT_ID = "prod-mail";
const ABSENT_PRODUCT_ID = "no-such-product";

function contextFor(productId: string): DataRouteContext {
  return { groupSlug: "products", productId };
}

/**
 * One dataset in which TWO products own documents — the seed bills only one,
 * so per-scope page state has nothing to be independent OF without this.
 */
function twoProductLedger(): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  const owned = filter(dataset.invoices, { productId: PRODUCT_ID });
  const moved = map(owned.slice(0, Math.floor(owned.length / 2)), invoice =>
    assign({}, invoice, { productId: OTHER_PRODUCT_ID })
  );
  return assign(dataset, {
    invoices: map(
      dataset.invoices,
      invoice => find(moved, { id: invoice.id }) ?? invoice
    )
  });
}

function unscopedInvoice(data: MockDataset): MockInvoice {
  const invoice = find(
    data.invoices,
    candidate => candidate.productId === undefined
  );
  if (invoice === undefined) {
    throw new Error("seed carries no invoice outside a product ledger");
  }
  return invoice;
}

describe("product invoices — the account ledger, narrowed to one product", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("resolves this product's documents and no others", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const owned = filter(data.invoices, { productId: PRODUCT_ID });
    const { data: rows, pagination } = productInvoicesCollection
      .resolve(data, contextFor(PRODUCT_ID))
      .useContext();

    expect(owned.length).toBeGreaterThan(0);
    expect(data.invoices.length).toBeGreaterThan(owned.length);
    expect(pagination.value.total).toBe(owned.length);
    expect(every(rows.value, { productId: PRODUCT_ID })).toBe(true);
  });

  it("pages at the platform's own limit", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const total = filter(data.invoices, { productId: PRODUCT_ID }).length;
    const { data: rows, pagination } = productInvoicesCollection
      .resolve(data, contextFor(PRODUCT_ID))
      .useContext();

    expect(total).toBeGreaterThan(MOCK_PAGE_LIMIT);
    expect(pagination.value.limit).toBe(MOCK_PAGE_LIMIT);
    expect(pagination.value.pages).toBe(Math.ceil(total / MOCK_PAGE_LIMIT));
    expect(rows.value).toHaveLength(MOCK_PAGE_LIMIT);
  });

  it("offers the search and sort the panel's control band renders", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = productInvoicesCollection.resolve(
      data,
      contextFor(PRODUCT_ID)
    );
    const { activeSort, appliedQuery, isSearchable, sortOptions } =
      instance.useContext();

    expect(isSearchable).toBe(true);
    expect(sortOptions.length).toBeGreaterThan(0);
    expect(appliedQuery.value).toBe("");

    instance.useActions().applySort(sortOptions[0]?.value);

    expect(activeSort.value).toBe(sortOptions[0]?.value);
  });

  it("keeps the narrowing while it searches — another product's document is never found here", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = productInvoicesCollection.resolve(
      data,
      contextFor(PRODUCT_ID)
    );
    const { data: rows } = instance.useContext();
    const owned = filter(data.invoices, { productId: PRODUCT_ID });

    instance.useActions().search(owned[0]?.number ?? "");
    expect(map(rows.value, "id")).toContain(owned[0]?.id);

    instance.useActions().search(unscopedInvoice(data).number);
    expect(rows.value).toEqual([]);
  });

  it("gives a product the client does not own an empty ledger, not the account's", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = productInvoicesCollection.resolve(
      data,
      contextFor(ABSENT_PRODUCT_ID)
    );

    expect(instance.useContext().data.value).toEqual([]);
    expect(instance.useContext().pagination.value.total).toBe(0);
    expect(instance.useMeta().isEmpty.value).toBe(true);
  });
});

describe("product credit notes — the same discriminator, the same ledger", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("resolves this product's credit notes and no others", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const owned = filter(data.creditNotes, { productId: PRODUCT_ID });
    const { data: rows, pagination } = productCreditNotesCollection
      .resolve(data, contextFor(PRODUCT_ID))
      .useContext();

    expect(owned.length).toBeGreaterThan(MOCK_PAGE_LIMIT);
    expect(data.creditNotes.length).toBeGreaterThan(owned.length);
    expect(pagination.value.total).toBe(owned.length);
    expect(pagination.value.limit).toBe(MOCK_PAGE_LIMIT);
    expect(every(rows.value, { productId: PRODUCT_ID })).toBe(true);
  });

  it("offers the search and sort its own control band renders", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { isSearchable, sortOptions } = productCreditNotesCollection
      .resolve(data, contextFor(PRODUCT_ID))
      .useContext();

    expect(isSearchable).toBe(true);
    expect(sortOptions.length).toBeGreaterThan(0);
  });

  it("gives a product the client does not own an empty ledger", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = productCreditNotesCollection.resolve(
      data,
      contextFor(ABSENT_PRODUCT_ID)
    );

    expect(instance.useContext().data.value).toEqual([]);
    expect(instance.useMeta().isEmpty.value).toBe(true);
  });
});

describe("R6 — one definition, one instance per product, one page position each", () => {
  it("moves the product being paged and leaves the other where it was", () => {
    const data = twoProductLedger();
    const mine = pagedCollectionHandle(
      PAGED_COLLECTION_ID.PRODUCT_INVOICES,
      data,
      contextFor(PRODUCT_ID)
    );
    const theirs = pagedCollectionHandle(
      PAGED_COLLECTION_ID.PRODUCT_INVOICES,
      data,
      contextFor(OTHER_PRODUCT_ID)
    );

    expect(mine.useContext().pagination.value.pages).toBeGreaterThan(1);
    expect(theirs.useContext().pagination.value.pages).toBeGreaterThan(1);

    mine.useActions().nextPage();

    expect(mine.useContext().pagination.value.page).toBe(2);
    expect(theirs.useContext().pagination.value.page).toBe(1);

    theirs.useActions().nextPage();

    expect(mine.useContext().pagination.value.page).toBe(2);
    expect(theirs.useContext().pagination.value.page).toBe(2);
  });

  it("never lends one product's rows to the other", () => {
    const data = twoProductLedger();
    const mine = productInvoicesCollection.resolve(
      data,
      contextFor(PRODUCT_ID)
    );
    const theirs = productInvoicesCollection.resolve(
      data,
      contextFor(OTHER_PRODUCT_ID)
    );
    const shared = filter(map(mine.useContext().data.value, "id"), id =>
      map(theirs.useContext().data.value, "id").includes(id)
    );

    expect(mine.useContext().data.value.length).toBeGreaterThan(0);
    expect(theirs.useContext().data.value.length).toBeGreaterThan(0);
    expect(shared).toEqual([]);
  });
});
