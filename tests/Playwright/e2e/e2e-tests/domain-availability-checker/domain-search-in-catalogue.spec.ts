// -----------------------------------------------------------------------------
/**
 * @fileoverview The catalogue shows the domain search only in a category set to show it.
 *
 * ## Job To Be Done
 * A guest browsing a category set to show the domain search can search for a
 * domain name there; a category not set to show it lists its products.
 *
 * ## What Breaks If These Fail
 * A domain category loses its search now that the catalogue loads it lazily, or
 * a product category draws a search where its products belong.
 *
 * Implements `tests/features/domain-availability-checker/domain-search-in-catalogue.feature`.
 */

import { expect, test } from "@playwright/test";
import type { BrowserContext, Route } from "@playwright/test";

import { URLs } from "../../support/constants/urls";
import { interceptUISchema } from "../../support/mocks/brand";
import { Dac } from "../../support/page-objects/templates/dac";

// -----------------------------------------------------------------------------

const CATEGORY_URL = URLs.categoryPage;

const CATEGORY_ID = new URL(CATEGORY_URL).searchParams.get("catid") ?? "";

const CATEGORIES_ENDPOINT = /\/api\/basket\/products_categories/;

const SEARCHED_NAME = "upmindcataloguesearch";

const PRODUCT_LIST = { GRID: "grid" } as const;

type CategoryRow = {
  id?: string;
  meta?: Record<string, unknown> | unknown[] | null;
  subcategories?: CategoryRow[];
};

// -----------------------------------------------------------------------------

function metaOf(row: CategoryRow): Record<string, unknown> {
  if (row.meta && !Array.isArray(row.meta)) return row.meta;
  return {};
}

/** The categories endpoint answers a list, or one category for a single-category read. */
function rowsOf(data: CategoryRow[] | CategoryRow | undefined): CategoryRow[] {
  if (Array.isArray(data)) return data;
  if (data) return [data];
  return [];
}

/** Sets or clears the category's own `meta.widgets.dac`, wherever it sits in the tree. */
function markCategory(rows: CategoryRow[], id: string, showsSearch: boolean) {
  for (const row of rows) {
    if (row.id === id) {
      const meta = metaOf(row);
      meta.widgets = { dac: showsSearch };
      row.meta = meta;
    }
    markCategory(row.subcategories ?? [], id, showsSearch);
  }
}

/** Replays the real categories response with the category's search setting set by the test. */
async function categorySetTo(context: BrowserContext, showsSearch: boolean) {
  await context.route(CATEGORIES_ENDPOINT, async (route: Route) => {
    const headers = route.request().headers();
    delete headers["if-none-match"];
    delete headers["if-modified-since"];
    const response = await route.fetch({ headers });
    const body = await response.json();
    markCategory(rowsOf(body?.data), CATEGORY_ID, showsSearch);
    await route.fulfill({ response, json: body });
  });
}

// -----------------------------------------------------------------------------

test.describe("The domain search in the catalogue", () => {
  test.beforeEach(async ({ context }) => {
    expect(CATEGORY_ID, "the category URL names no catid").not.toBe("");
    interceptUISchema(context, {
      "@context.catalogue.productList": PRODUCT_LIST.GRID
    });
  });

  test.afterEach(async ({ context }) => {
    await context.unrouteAll({ behavior: "wait" });
  });

  test("A domain category shows the domain search in the catalogue", async ({
    page,
    context
  }) => {
    const dac = new Dac(page);
    await categorySetTo(context, true);

    await page.goto(`${CATEGORY_URL}&search=${SEARCHED_NAME}`);

    await expect(dac.searchInput).toBeVisible({ timeout: 30000 });
    await expect(dac.firstCard).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("product-card")).toHaveCount(0);
  });

  test("A product category shows no domain search in the catalogue", async ({
    page,
    context
  }) => {
    const dac = new Dac(page);
    await categorySetTo(context, false);

    await page.goto(CATEGORY_URL);

    await expect(page.getByTestId("product-card").first()).toBeVisible({
      timeout: 30000
    });
    await expect(dac.searchInput).toHaveCount(0);
    await expect(dac.cards).toHaveCount(0);
  });
});
