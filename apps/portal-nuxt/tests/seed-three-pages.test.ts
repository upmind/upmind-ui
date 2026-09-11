import { describe, expect, it } from "vitest";
import { gatesOffDataset, sparseDataset } from "./support/counter-dataset";
import type { PagedCollectionId } from "~/portal/mock/collection-defs";
import type { DataRouteContext } from "~/portal/mock/injection";
import {
  PAGED_COLLECTION_ID,
  pagedCollectionHandle
} from "~/portal/mock/collection-defs";
import { MOCK_DATASET_ID, useMockData } from "~/portal/mock/store";

/**
 * Every results list carries THREE pages (operator request 2026-08-27), so a
 * pager always has a middle page to land on rather than only a first and a
 * last. The seed is what delivers this, and a seed is easy to shrink by
 * accident — this is the gate that notices.
 *
 * Child accounts is the one list neither shipped dataset pages three deep:
 * hostgrid carries a parent's three hand-authored relations and the minimal
 * dataset carries none, so the list is paged against the counter-fixture,
 * which pads it (tests/support/counter-dataset.ts).
 *
 * Paired blind with tests/seed-three-pages.must-fail.patch.
 */
const REQUIRED_PAGES = 3;

/** The route context each context-keyed collection needs to resolve its rows. */
const CONTEXT_BY_COLLECTION: Partial<
  Record<PagedCollectionId, DataRouteContext>
> = {
  [PAGED_COLLECTION_ID.GROUP_PRODUCTS]: { groupSlug: "products" },
  [PAGED_COLLECTION_ID.GROUP_CATALOGUE]: { groupSlug: "products" },
  [PAGED_COLLECTION_ID.PRODUCT_TICKETS]: { productId: "prod-team" },
  [PAGED_COLLECTION_ID.PRODUCT_INVOICES]: { productId: "prod-analytics" },
  [PAGED_COLLECTION_ID.PRODUCT_CREDIT_NOTES]: { productId: "prod-analytics" }
};

/** The lists the shipped seed leaves empty on purpose — paged on the counter-fixture instead. */
const COUNTER_FIXTURE_ONLY: readonly PagedCollectionId[] = [
  PAGED_COLLECTION_ID.CHILD_ACCOUNTS
];

/** Legacy's "Address and company details" carries a find box and no pager (`billableEntities.vue`). */
const UNPAGED: readonly PagedCollectionId[] = [
  PAGED_COLLECTION_ID.BILLABLE_ENTITIES
];

const COLLECTIONS = Object.values(PAGED_COLLECTION_ID).filter(
  collection => !UNPAGED.includes(collection)
);

describe("seed — every results list carries three pages", () => {
  it.each(COLLECTIONS)("%s pages three deep", collection => {
    const data = COUNTER_FIXTURE_ONLY.includes(collection)
      ? gatesOffDataset()
      : useMockData(MOCK_DATASET_ID.HOSTGRID);
    const context = CONTEXT_BY_COLLECTION[collection] ?? {};

    const { pagination } = pagedCollectionHandle(
      collection,
      data,
      context
    ).useContext();

    expect(pagination.value.pages).toBeGreaterThanOrEqual(REQUIRED_PAGES);
  });

  /**
   * A status tab narrows the list it rides, so EVERY tab needs its own three
   * pages — a rail whose second tab runs out after one page is the sparse
   * page the seed exists to prevent.
   */
  it.each([
    [PAGED_COLLECTION_ID.INVOICES, ["all", "unpaid", "paid", "credited"]],
    [PAGED_COLLECTION_ID.TICKETS, ["open", "closed"]],
    [PAGED_COLLECTION_ID.GROUP_PRODUCTS, ["all", "active", "cancelled"]]
  ] as const)("%s pages three deep on every status tab", (collection, tabs) => {
    for (const status of tabs) {
      const context = {
        ...(CONTEXT_BY_COLLECTION[collection] ?? {}),
        status
      };
      const { pagination } = pagedCollectionHandle(
        collection,
        useMockData(MOCK_DATASET_ID.HOSTGRID),
        context
      ).useContext();

      expect({ status, pages: pagination.value.pages }).toEqual({
        status,
        pages: expect.any(Number)
      });
      expect(pagination.value.pages).toBeGreaterThanOrEqual(REQUIRED_PAGES);
    }
  });

  it("the counter-fixtures keep the empty and single-page branches, which a three-page seed can never show", () => {
    const sparse = sparseDataset();

    // Under one page — the self-hiding pager's other branch.
    expect(sparse.invoices.length).toBeLessThan(10);
    expect(sparse.tickets.length).toBeLessThan(10);

    // hostgrid is the parent that HAS children; the minimal dataset is the
    // account that has none, which is the nav gate's other branch.
    expect(
      useMockData(MOCK_DATASET_ID.HOSTGRID).childAccounts.length
    ).toBeGreaterThan(0);
    expect(
      useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL).childAccounts
    ).toHaveLength(0);
  });
});
