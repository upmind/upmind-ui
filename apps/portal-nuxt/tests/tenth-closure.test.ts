// -----------------------------------------------------------------------------
/**
 * @module tests/tenth-closure
 * @description Phase F14: the six client capabilities the tenth audit read as
 * open, and the one sorter it read as invented. The orders ledger asks when
 * the money landed, what an item was provisioned as and which catalogue
 * category it came from, and reads by number and by standing (O-1); the
 * products shelf reads by standing and narrows by the brand's own service tags
 * (O-2, O-3); a change option states what it buys and offers to be read in
 * full before it is chosen (O-4); a part-paid invoice is finished in the money
 * it already took (O-5); and the relations listing stops offering an order by
 * address, which legacy never published.
 *
 * Counts are read off the shipped seed, and every narrowed SET is cross-checked
 * against an independent predicate over the panel's own unnarrowed rows — a
 * count that happens to match cannot pass a predicate reading the wrong field.
 * Sorters are graded by the ORDER they produce, never by the label they wear.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  every,
  filter,
  find,
  includes,
  map,
  reject,
  size,
  some,
  sortBy,
  uniq
} from "lodash-es";
import type { MockCollectionContext } from "~/portal/mock/collections";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockProduct } from "~/portal/mock/types";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  childAccountsCollection,
  groupProductsCollection
} from "~/portal/mock/collection-defs";
import { productMigrationItems } from "~/portal/mock/selectors";
import { PRODUCT_STATUS_LABEL } from "~/portal/mock/status-labels";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import {
  LIST_CONTROLS_FILTER_ANY,
  LIST_CONTROLS_FILTER_KIND
} from "~/portal/modules/list-controls/types";

const NO_CONTEXT: DataRouteContext = {};

const PRODUCTS_CONTEXT: DataRouteContext = { groupSlug: "products" };

const ANALYTICS: DataRouteContext = {
  groupSlug: "products",
  productId: "prod-analytics"
};

const CLEARED = "";

/** An id no seed mints — the dispatcher's tier-one subject. */
const ABSENT_ID = "no-such-row-9f3c";

type Seam<TRow, TFilters> = {
  useActions: () => {
    filters: TFilters;
    applyNamedFilter: (key: string, value: string) => void;
    applySort: (value?: string) => void;
    search: (text: string) => void;
    setLimit: (value: number) => void;
  };
  useContext: () => MockCollectionContext<TRow>;
};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function bothSeeds(): void {
  resetMockData(MOCK_DATASET_ID.HOSTGRID);
  resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function wholeOf<TRow, TFilters>(seam: Seam<TRow, TFilters>): TRow[] {
  const view = seam.useContext();
  seam.useActions().setLimit(Math.max(view.pagination.value.total, 1));
  return view.data.value;
}

function idsOf<TRow extends { id: string }>(rows: readonly TRow[]): string[] {
  return sortBy(map(rows, "id"));
}

function controlKeys<TRow, TFilters>(seam: Seam<TRow, TFilters>): string[] {
  return map(seam.useContext().filterControls, "key");
}

/** Every order this panel offers, keyed by the option that produced it. */
function orderingsOf<TRow, TFilters>(
  seam: Seam<TRow, TFilters>
): Record<string, TRow[]> {
  const orders: Record<string, TRow[]> = {};
  for (const option of seam.useContext().sortOptions) {
    seam.useActions().applySort(option.value);
    orders[option.value] = [...wholeOf(seam)];
  }
  seam.useActions().applySort(CLEARED);
  return orders;
}

/** Whether every equal value stands in ONE run — what a sort by standing does. */
function isGrouped(values: readonly string[]): boolean {
  const firstSeen = map(uniq(values), value => values.indexOf(value));
  return every(
    uniq(values),
    (value, index) =>
      values.lastIndexOf(value) - (firstSeen[index] ?? 0) + 1 ===
      size(filter(values, candidate => candidate === value))
  );
}

function productsPanel(
  data: MockDataset
): Seam<MockProduct, { tag: (value?: string) => void }> {
  return groupProductsCollection.resolve(data, PRODUCTS_CONTEXT);
}

// -----------------------------------------------------------------------------
// O-1 — the orders ledger's three new narrowings and two new sorters
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// O-2 / O-3 — the products shelf's standing sort and service tags
// -----------------------------------------------------------------------------

describe("O-2 / O-3 — the products shelf reads by standing and by tag", () => {
  beforeEach(bothSeeds);

  it("orders the products by where each one stands", () => {
    const seam = productsPanel(hostgrid());
    const opening = [...wholeOf(seam)];

    expect(size(opening)).toBe(24);
    expect(
      isGrouped(map(opening, product => PRODUCT_STATUS_LABEL[product.status]))
    ).toBe(false);
    expect(size(uniq(map(opening, "status")))).toBeGreaterThan(1);

    const orders = orderingsOf(seam);
    expect(size(orders)).toBe(4);
    expect(
      some(orders, rows =>
        isGrouped(map(rows, product => PRODUCT_STATUS_LABEL[product.status]))
      )
    ).toBe(true);
    expect(every(orders, rows => size(rows) === size(opening))).toBe(true);
  });

  it("offers the brand's service tags as a choice on the products listing", () => {
    const seam = productsPanel(hostgrid());
    const showing = [...wholeOf(seam)];
    const control = find(seam.useContext().filterControls, { key: "tag" });

    // The choices are the tags the SHOWING products wear, in the panel's own
    // order, with the unnarrowed row heading them.
    expect(map(control?.options ?? [], "value")).toEqual([
      LIST_CONTROLS_FILTER_ANY,
      "Free trial",
      "Managed",
      "Payment overdue",
      "Renews monthly",
      "Setup pending"
    ]);
    expect(control?.kind).toBe(LIST_CONTROLS_FILTER_KIND.SELECT);
    expect(
      sortBy(
        uniq(
          reject(
            map(control?.options ?? [], "value"),
            value => value === LIST_CONTROLS_FILTER_ANY
          )
        )
      )
    ).toEqual(
      sortBy(uniq(showing.flatMap(product => [...(product.tags ?? [])])))
    );

    // The brand with ONE product still offers the choice, because one product
    // wears two tags — where its category and its status offer nothing,
    // having only one value each.
    const bare = productsPanel(minimal());
    expect(size(wholeOf(bare))).toBe(1);
    expect(
      map(
        find(bare.useContext().filterControls, { key: "tag" })?.options ?? [],
        "value"
      )
    ).toEqual([LIST_CONTROLS_FILTER_ANY, "Managed", "Renews monthly"]);
    expect(controlKeys(bare)).not.toContain("category");
    expect(controlKeys(bare)).not.toContain("status");
  });

  it("narrows the products to the ones wearing one service tag", () => {
    const seam = productsPanel(hostgrid());
    const showing = [...wholeOf(seam)];
    const wearing = (tag: string) =>
      filter(showing, product => includes(product.tags ?? [], tag));

    expect(size(wearing("Setup pending"))).toBe(3);
    expect(size(wearing("Managed"))).toBe(1);
    expect(size(wearing("Renews monthly"))).toBe(1);

    seam.useActions().filters.tag("Setup pending");
    expect(idsOf(wholeOf(seam))).toEqual(idsOf(wearing("Setup pending")));
    seam.useActions().filters.tag(undefined);
    expect(idsOf(wholeOf(seam))).toEqual(idsOf(showing));

    // A product wearing SEVERAL tags answers each of them — the narrowing is
    // over a set, so one match is enough.
    const many = find(showing, product => size(product.tags ?? []) > 1);
    if (many === undefined) throw new Error("no product wears two tags");
    for (const tag of many.tags ?? []) {
      seam.useActions().applyNamedFilter("tag", tag);
      expect(map(wholeOf(seam), "id")).toContain(many.id);
      expect(idsOf(wholeOf(seam))).toEqual(idsOf(wearing(tag)));
    }
    seam.useActions().applyNamedFilter("tag", CLEARED);
    expect(idsOf(wholeOf(seam))).toEqual(idsOf(showing));
  });
});

// -----------------------------------------------------------------------------
// O-4 — what a change buys, stated and readable in full
// -----------------------------------------------------------------------------

describe("O-4 — a change option says what it buys before it is chosen", () => {
  beforeEach(bothSeeds);

  it("each change option states its short description", () => {
    const data = hostgrid();
    const product = find(data.products, { id: "prod-analytics" });
    if (product === undefined)
      throw new Error("seed carries no prod-analytics");
    const rows = productMigrationItems(data, ANALYTICS);

    expect(size(rows)).toBe(size(product.migrationOptions));
    for (const option of product.migrationOptions) {
      const row = find(rows, { id: option.id });
      // Both lines are carried and they are DIFFERENT lines: the row states
      // the short one, the dialog holds the long one.
      expect(option.shortDescription).toBeTruthy();
      expect(option.description).toBeTruthy();
      expect(option.shortDescription).not.toBe(option.description);
      expect(row?.description).toBe(option.shortDescription);
    }
  });

  it("offers Review changes beside Change to this, and answers with the option's own prose", () => {
    const data = hostgrid();
    const product = find(data.products, { id: "prod-analytics" });
    if (product === undefined)
      throw new Error("seed carries no prod-analytics");
    const option = product.migrationOptions[0];
    if (option === undefined)
      throw new Error("prod-analytics offers no change");
    const row = find(productMigrationItems(data, ANALYTICS), { id: option.id });
    const reviewValue = mockActionValue(
      MOCK_ACTION.MIGRATION_REVIEW,
      `${product.id}:${option.id}`
    );

    // The committing control stays where it was; reading is the SECOND one.
    expect(row?.action?.label).toBe("Change to this");
    expect(row?.action?.value).toBe(
      mockActionValue(MOCK_ACTION.MIGRATE_PRODUCT, `${product.id}:${option.id}`)
    );
    expect(map(row?.moreActions ?? [], "value")).toEqual([reviewValue]);
    expect(map(row?.moreActions ?? [], "label")).toEqual(["Review changes"]);

    const before = JSON.stringify(data);
    const read = dispatchMockAction(data, ANALYTICS, reviewValue);

    // It asks nothing back and changes nothing — it is a READ.
    expect(read?.prose?.title).toBe(option.name);
    expect(read?.prose?.markdown).toBe(option.description);
    expect(read?.prose?.markdown).not.toBe(option.shortDescription);
    expect(read?.confirm).toBeUndefined();
    expect(read?.form).toBeUndefined();
    expect(read?.toast).toBeUndefined();
    expect(JSON.stringify(data)).toBe(before);

    // A product or an option this dataset does not hold refuses out loud.
    for (const absent of [
      mockActionValue(
        MOCK_ACTION.MIGRATION_REVIEW,
        `${ABSENT_ID}:${option.id}`
      ),
      mockActionValue(
        MOCK_ACTION.MIGRATION_REVIEW,
        `${product.id}:${ABSENT_ID}`
      )
    ]) {
      const refused = dispatchMockAction(data, ANALYTICS, absent);
      expect(refused?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
      expect(refused?.toast?.title).toBeTruthy();
      expect(refused?.prose).toBeUndefined();
      expect(refused?.confirm).toBeUndefined();
      expect(JSON.stringify(data)).toBe(before);
    }
  });
});

// -----------------------------------------------------------------------------
// O-5 — a part-paid invoice is finished in the money it took
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// The sorter legacy never published
// -----------------------------------------------------------------------------

describe("the relations listing offers legacy's own orders and no other", () => {
  beforeEach(bothSeeds);

  it("orders the child accounts by name and by the day they were added, and offers nothing else", () => {
    const seam: Seam<{ id: string; name: string; email: string }, unknown> =
      childAccountsCollection.resolve(hostgrid(), NO_CONTEXT);
    const showing = [...wholeOf(seam)];
    const orders = orderingsOf(seam);

    expect(size(showing)).toBe(3);
    expect(size(orders)).toBe(2);
    expect(map(orders, rows => map(rows, "id"))).toEqual([
      ["rel-2", "rel-3", "rel-1"],
      ["rel-3", "rel-2", "rel-1"]
    ]);

    // No option answers with the ADDRESS order, which is the shape of the
    // sorter legacy never published.
    const byAddress = map(
      sortBy(showing, child => child.email),
      "id"
    );
    expect(byAddress).toEqual(["rel-2", "rel-1", "rel-3"]);
    expect(map(orders, rows => map(rows, "id"))).not.toContainEqual(byAddress);
  });
});
