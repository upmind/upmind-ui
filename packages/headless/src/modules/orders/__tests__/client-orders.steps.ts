// -----------------------------------------------------------------------------
/**
 * @module client-orders/__tests__/client-orders.steps
 * @description The module's ONE step catalog — one definition per phrase of
 * the six driven scenarios of `client-orders.feature` (design 8.12, bdd.md).
 * Engine-free: it imports `defineSteps`, `World` and the actor enum only, so
 * the labs-nuxt `bdd` project, the in-page player and the Node replay all
 * register the same catalog.
 *
 * Every step fires a real action id of `useClientOrders().useActions()` or
 * reads the world after one. Each Then reads World-visible state only: the
 * `query` model, `pagination`, `data` and the meta (design 8.12, World
 * surface). The wire literals stay in the integration specs and the lane spec.
 *
 * ADR-020 Amendment 5: the catalog defines steps for the six collection
 * scenarios only, and has no no-op step. Each other scenario keeps a phrase no
 * catalog defines, so `missingSteps: "skip-scenario"` skips it. The pair route
 * boots the collection only, so no manager scenario runs here (D-27). Each
 * phrase names the order history, so none collides with another module's
 * phrase in the one global registry.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  flatMap,
  fromPairs,
  isEqual,
  isFunction,
  last,
  map,
  mapValues,
  split,
  toPairs,
  trim,
  values,
  without
} from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under — the `key` of
 * `playgrounds/labs-nuxt/modules/scenarios/useClientOrders/client-orders.scenario.ts`.
 */
export const CLIENT_ORDERS_SCENARIO = "client-orders";

/** The action ids these steps fire, exported as the gate's `coveredActionIds`. */
export const CLIENT_ORDERS_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  nextPage: "nextPage",
  prevPage: "prevPage",
  filterBy: "filterBy",
  search: "filters.query",
  sortBy: "sortBy",
  setCriteria: "setCriteria"
} as const;

export const coveredActionIds: readonly string[] = values(
  CLIENT_ORDERS_COVERED_ACTIONS
);

/**
 * The values the recordings hold. A `World` step cannot read a capture, so
 * each value is named here with the capture it comes from.
 *
 * @see fixtures/get-invoices-case-orders-default.json — `total: 919`, the
 * first row `52098d3d-…` (`QA-INV-25144`).
 * @see fixtures/get-invoices-case-orders-page-2.json — the first row
 * `e78642de-…` at offset 10.
 * @see fixtures/get-invoices-case-orders-*-probe.json — the probe value of
 * each operator-form capture (design 8.8).
 */
const RECORDED = {
  total: 919,
  pages: 92,
  pageSize: 10,
  firstRowId: "52098d3d-e409-17e0-d957-c31578626e34",
  pageTwoFirstRowId: "e78642de-5397-145d-8688-b21208469530",
  orderNumber: "QA-INV-25144",
  totalAmount: 4.8,
  absoluteDate: "2026-09-01 00:00:00",
  relativeDate: { after: "-7_days", before: "+7_days" },
  itemName: " Starter Hosting",
  categoryName: " Shared Hosting",
  serviceIdentifier: "DGyTC25827.com",
  status: { eq: ["invoice_paid"], neq: ["invoice_cancelled"] }
} as const;

const FORCED_CATEGORY = { "category.slug": "new_contract" } as const;

const NEWEST_FIRST = [{ field: "created_at", dir: "desc" }];

const LEGACY_SORT_FIELDS = ["id", "total_amount", "status_id", "created_at"];

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the collection settles on it. */
async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    const failure = await assertion()
      .then(() => undefined)
      .catch((error: unknown) => error);
    if (!failure) return;
    await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
  }
  return assertion();
}

const settled = (world: World) =>
  settles(() => world.expectMeta({ isLoading: false, hasError: false }));

const expectContext = (world: World, expected: Record<string, unknown>) =>
  settles(() => {
    if (!world.expectContext)
      throw new Error("the world publishes no expectContext");
    return world.expectContext(expected);
  });

const onPage = (world: World, page: number) =>
  expectContext(world, { pagination: { page } });

async function openHistory(world: World): Promise<void> {
  await world.boot(CLIENT_ORDERS_SCENARIO, { actor: ScopeActorTypes.SELF });
  await world.fire(CLIENT_ORDERS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
  await settled(world);
}

async function toPageTwo(world: World): Promise<void> {
  await world.fire(CLIENT_ORDERS_COVERED_ACTIONS.nextPage);
  await onPage(world, 2);
  await settled(world);
}

/** The value each column's comparison is written with, from the recordings. */
function probeValue(column: string, comparison: string): unknown {
  if (column === "number") return RECORDED.orderNumber;
  if (column === "total_amount") return RECORDED.totalAmount;
  if (column === "status.code")
    return RECORDED.status[comparison as keyof typeof RECORDED.status];
  if (column === "created_at" || column === "paid_datetime")
    return (
      RECORDED.relativeDate[comparison as keyof typeof RECORDED.relativeDate] ??
      RECORDED.absoluteDate
    );
  if (column === "products.product.name") return RECORDED.itemName;
  if (column === "products.product.category.name") return RECORDED.categoryName;
  if (column === "products.service_identifier")
    return RECORDED.serviceIdentifier;
  throw new Error(`the order history has no client column "${column}"`);
}

/** Each client column and its comparisons, design 8.3 — the AC-7 step table. */
const CLIENT_COMPARISONS: Record<string, string[]> = {
  number: ["like", "eq", "neq"],
  total_amount: ["eq", "neq", "gt", "gte", "lt", "lte"],
  "status.code": ["eq", "neq"],
  created_at: ["gt", "gte", "lt", "lte", "after", "before"],
  paid_datetime: ["gt", "gte", "lt", "lte", "after", "before"],
  "products.product.name": ["like", "eq", "neq"],
  "products.product.category.name": ["like", "eq", "neq"],
  "products.service_identifier": ["like", "eq", "neq"]
};

/** The columns that hold one comparison at a time (design 8.3, D-24). */
const ONE_FILTER_COLUMNS = [
  "number",
  "status.code",
  "products.product.name",
  "products.product.category.name",
  "products.service_identifier"
];

/**
 * The AC-7 step table, read as `column -> comparisons`. playwright-bdd hands
 * a `DataTable`. The Node replay hands no table, so there the design 8.3 set
 * stands alone.
 */
function tableComparisons(
  table: unknown
): Record<string, string[]> | undefined {
  const hashes = (
    table as
      | { hashes?: () => { column: string; comparisons: string }[] }
      | undefined
  )?.hashes;
  if (!isFunction(hashes)) return undefined;
  return fromPairs(
    map(hashes.call(table), row => [
      trim(row.column),
      map(split(row.comparisons, ","), trim)
    ])
  );
}

// -----------------------------------------------------------------------------

export const clientOrdersSteps = defineSteps(({ Given, When, Then }) => {
  // --- AC-1: a signed-in client reads the history ----------------------------

  Given(
    "a signed-in client with placed orders opens the order history",
    openHistory
  );

  When("the order history settles its first page", async world => {
    await world.fire(CLIENT_ORDERS_COVERED_ACTIONS.refresh);
    await settled(world);
  });

  Then("the order history publishes the client's own orders", async world => {
    await settles(() => world.expectMeta({ isEmpty: false, hasError: false }));
    await expectContext(world, {
      pagination: { page: 1, total: RECORDED.total },
      data: [{ id: RECORDED.firstRowId }]
    });
  });

  Then("the order history criteria hold the forced order category", world =>
    expectContext(world, { query: { filters: FORCED_CATEGORY } })
  );

  // --- AC-3: a client moves between pages ------------------------------------

  Given(
    "a signed-in client with more than one page of orders in the order history",
    async world => {
      await openHistory(world);
      await settles(() => world.expectMeta({ hasNextPage: true }));
    }
  );

  When(
    "the client moves to page two of the order history and back to page one",
    async world => {
      await world.fire(CLIENT_ORDERS_COVERED_ACTIONS.nextPage);
      await expectContext(world, {
        pagination: {
          page: 2,
          limit: RECORDED.pageSize,
          total: RECORDED.total
        },
        data: [{ id: RECORDED.pageTwoFirstRowId }]
      });
      await world.fire(CLIENT_ORDERS_COVERED_ACTIONS.prevPage);
    }
  );

  Then(
    "the order history pagination shows each page of ten orders and the total",
    async world => {
      await expectContext(world, {
        pagination: {
          page: 1,
          limit: RECORDED.pageSize,
          total: RECORDED.total,
          pages: RECORDED.pages
        },
        data: [{ id: RECORDED.firstRowId }]
      });
      await settles(() =>
        world.expectMeta({ hasPrevPage: false, hasNextPage: true })
      );
    }
  );

  // --- AC-7: each client column and comparison -------------------------------

  Given("a signed-in client on page two of the order history", async world => {
    await openHistory(world);
    await toPageTwo(world);
  });

  When(
    "the client sets each order history filter below",
    async (world, ...args) => {
      const table = tableComparisons(args[args.length - 1]);
      if (table && !isEqual(table, CLIENT_COMPARISONS))
        throw new Error(
          `the order history filter table ${JSON.stringify(table)} is not the design 8.3 set`
        );
      const pairs = flatMap(toPairs(CLIENT_COMPARISONS), ([column, ops]) =>
        map(ops, comparison => ({ column, comparison }))
      );
      for (const { column, comparison } of pairs) {
        const leaf = { [comparison]: probeValue(column, comparison) };
        await world.fire(CLIENT_ORDERS_COVERED_ACTIONS.filterBy, {
          [column]: leaf
        });
        await expectContext(world, {
          query: { filters: { ...FORCED_CATEGORY, [column]: leaf } }
        });
      }
      await settled(world);
    }
  );

  Then(
    "the order history criteria hold each filter under its own comparison",
    world =>
      expectContext(world, {
        query: {
          filters: {
            ...FORCED_CATEGORY,
            ...mapValues(CLIENT_COMPARISONS, (ops, column) => {
              const kept = last(ops) as string;
              const replaced = ONE_FILTER_COLUMNS.includes(column)
                ? fromPairs(map(without(ops, kept), op => [op, null]))
                : {};
              return { ...replaced, [kept]: probeValue(column, kept) };
            })
          }
        }
      })
  );

  Then("the order history returns to page one", world => onPage(world, 1));

  Then(
    "a second filter on the same text column of the order history replaces the first",
    async world => {
      await world.fire(CLIENT_ORDERS_COVERED_ACTIONS.filterBy, {
        "products.product.name": { like: RECORDED.itemName }
      });
      await expectContext(world, {
        query: {
          filters: { "products.product.name": { like: RECORDED.itemName } }
        }
      });
      await world.fire(CLIENT_ORDERS_COVERED_ACTIONS.filterBy, {
        "products.product.name": { eq: RECORDED.itemName }
      });
      await expectContext(world, {
        query: {
          filters: {
            ...FORCED_CATEGORY,
            "products.product.name": { eq: RECORDED.itemName, like: null }
          }
        }
      });
    }
  );

  // --- AC-10: the newest order first, and a sort keeps the page --------------

  Given(
    "with no sort chosen the order history criteria put the newest order first",
    world => expectContext(world, { query: { sort: NEWEST_FIRST } })
  );

  When(
    "the client sorts the order history by each legacy field",
    async world => {
      for (const field of LEGACY_SORT_FIELDS) {
        await world.fire(CLIENT_ORDERS_COVERED_ACTIONS.sortBy, [
          { field, dir: "asc" }
        ]);
        await expectContext(world, {
          query: { sort: [{ field, dir: "asc" }] }
        });
      }
      await settled(world);
    }
  );

  Then("the order history criteria hold the chosen field", world =>
    expectContext(world, {
      query: { sort: [{ field: "created_at", dir: "asc" }] }
    })
  );

  Then("the order history stays on page two", world => onPage(world, 2));

  // --- AC-11: search and filters live together -------------------------------

  Given(
    "a status filter is active on page two of the order history",
    async world => {
      await openHistory(world);
      await world.fire(CLIENT_ORDERS_COVERED_ACTIONS.filterBy, {
        "status.code": { eq: RECORDED.status.eq }
      });
      await expectContext(world, {
        query: { filters: { "status.code": { eq: RECORDED.status.eq } } }
      });
      await settled(world);
      await toPageTwo(world);
    }
  );

  When(
    "the client searches the order history for an order number",
    async world => {
      await world.fire(
        CLIENT_ORDERS_COVERED_ACTIONS.search,
        RECORDED.orderNumber
      );
      await expectContext(world, {
        query: { filters: { number: { eq: RECORDED.orderNumber } } }
      });
    }
  );

  Then(
    "the order history criteria hold the status filter and the exact order number together",
    world =>
      expectContext(world, {
        query: {
          filters: {
            ...FORCED_CATEGORY,
            "status.code": { eq: RECORDED.status.eq },
            number: { eq: RECORDED.orderNumber, like: null }
          }
        }
      })
  );

  // --- AC-12: the forced category survives each writer -----------------------

  Given("a signed-in client reads the order history", openHistory);

  When(
    "each order history writer changes the criteria, the playground filter bar included",
    async world => {
      const writes: [string, unknown][] = [
        [
          CLIENT_ORDERS_COVERED_ACTIONS.filterBy,
          { number: { like: RECORDED.orderNumber } }
        ],
        [CLIENT_ORDERS_COVERED_ACTIONS.search, RECORDED.orderNumber],
        [
          CLIENT_ORDERS_COVERED_ACTIONS.sortBy,
          [{ field: "total_amount", dir: "desc" }]
        ],
        [
          CLIENT_ORDERS_COVERED_ACTIONS.setCriteria,
          { filters: { "status.code": { neq: RECORDED.status.neq } } }
        ],
        [
          CLIENT_ORDERS_COVERED_ACTIONS.setCriteria,
          {
            filters: {
              "category.slug": "renewal",
              number: { eq: RECORDED.orderNumber }
            }
          }
        ]
      ];
      for (const [actionId, input] of writes) {
        await world.fire(actionId, input);
        await settled(world);
      }
      await expectContext(world, {
        query: {
          filters: { number: { eq: RECORDED.orderNumber } },
          sort: [{ field: "total_amount", dir: "desc" }]
        }
      });
    }
  );

  Then(
    "the order history criteria still hold the forced order category",
    async world => {
      await expectContext(world, { query: { filters: FORCED_CATEGORY } });
      await settles(() => world.expectMeta({ hasError: false }));
    }
  );
});

export default clientOrdersSteps;
