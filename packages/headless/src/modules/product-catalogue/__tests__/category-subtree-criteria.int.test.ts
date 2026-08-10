// -----------------------------------------------------------------------------
/**
 * @fileoverview product-catalogue — the category scope as a DECLARED column
 *
 * ## Job To Be Done
 * The storefront's category filter used to leave as the operator-less
 * `filter[products_category_id]`, a key the translator cannot produce. It is now
 * a declared column — `products_category_id.eq` — resolved by the catalogue
 * itself through `useProductCategories`, not assembled by the caller. This
 * drives the REAL `useProductCatalogue({ categoryId })` against MSW-replayed
 * staging recordings and reads back the criteria the handle publishes: the
 * chosen category lands on the declared column, an unscoped catalogue declares
 * no category at all, and the free text and sort branches sit beside it in the
 * same one model.
 *
 * ## Recorded evidence for the wire form
 * `pnpm fixtures:generate product-catalogue` captured BOTH spellings against
 * real staging: `filter[products_category_id|eq]=<id>` narrows 15 of 58
 * (`fixtures/get-basket-products-155ce1b8.json`) and the legacy
 * `filter[products_category_id]=<id>` narrows the same 15
 * (`…-5c3bdcbe.json`). The migration changes the spelling, not the rows.
 *
 * ## What this file does NOT prove, and why
 * The DESCENDANT expansion (`includeDescendants`) and the outbound request
 * itself are not asserted here. `loadList` is `enabled: () => !!currencyCode`,
 * and the currency is a child actor of the basket machine; the staging account
 * has no live basket (`fixtures/get-orders-current.json` is a real 204), so no
 * `basket/products` or `basket/products_categories` read fires and the tree the
 * expansion walks is empty. Closing that needs a basket-seeded capture — the
 * headless-Playwright flavour `product-setup.fixtures.ts` already uses — and is
 * escalated rather than faked with a hand-built basket.
 *
 * ## What Breaks If These Fail
 * The category scope silently emptying shows the whole catalogue on a category
 * page, with no error anywhere.
 */

import { describe, expect, it, vi } from "vitest";
import { useProductCatalogue } from "..";
import {
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import { PRODUCT_DEFAULT_SORT } from "../product-catalogue.types";
import {
  installCategoriesHandler,
  installProductsHandler,
  recordedCategoryWithChildren,
  recordedNeedle
} from "./product-catalogue.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** Long enough for the category watcher's immediate run to have settled. */
const SETTLED_MS = 1000;

async function bootCatalogue(
  initial?: Parameters<typeof useProductCatalogue>[0]
): Promise<ReturnType<typeof useProductCatalogue>> {
  await seedClientSession(server, { withBrandConfig: false });
  installCategoriesHandler(server);
  installProductsHandler(server);
  return useProductCatalogue(initial);
}

// -----------------------------------------------------------------------------

describe("product-catalogue — the category scope is a declared column", () => {
  it("lands the chosen category on products_category_id.eq", async () => {
    const { id } = recordedCategoryWithChildren();

    const catalogue = await bootCatalogue({ categoryId: id });

    await vi.waitFor(() =>
      expect(
        catalogue.criteria.value.filters?.products_category_id?.eq
      ).toContain(id)
    );
  });

  it("declares no category at all when the caller scopes to nothing", async () => {
    const catalogue = await bootCatalogue();

    await new Promise(resolve => setTimeout(resolve, SETTLED_MS));

    expect(
      catalogue.criteria.value.filters?.products_category_id?.eq
    ).toBeUndefined();
  });

  it("carries free text on the declared name column beside the category, in one model", async () => {
    const { id } = recordedCategoryWithChildren();
    const needle = recordedNeedle();

    const catalogue = await bootCatalogue({ categoryId: id, search: needle });

    await vi.waitFor(() =>
      expect(catalogue.criteria.value.filters).toEqual({
        products_category_id: { eq: expect.arrayContaining([id]) },
        name: { like: needle }
      })
    );
  });

  it("boots on the merchant order the schema declares as its sort default", async () => {
    const catalogue = await bootCatalogue();

    await new Promise(resolve => setTimeout(resolve, SETTLED_MS));

    expect(catalogue.criteria.value.sort).toEqual(PRODUCT_DEFAULT_SORT);
  });
});

describe("product-catalogue — the criteria surface WidgetGrid consumes", () => {
  it("publishes the declared schema, the live model and the ONE write verb", async () => {
    const catalogue = await bootCatalogue();

    expect(catalogue.schema).toMatchObject({
      properties: {
        filters: { properties: { products_category_id: {}, name: {} } },
        sort: {}
      }
    });
    expect(typeof catalogue.setCriteria).toBe("function");
    expect(catalogue.criteriaError.value).toBeUndefined();
  });

  it("has no raw sort()/filter() setters beside setCriteria", async () => {
    const catalogue = await bootCatalogue();

    expect(catalogue).not.toHaveProperty("sort");
    expect(catalogue).not.toHaveProperty("filter");
  });

  it("never spells the legacy operator-less filter[products_category_id]", async () => {
    const { id } = recordedCategoryWithChildren();
    const observed = observeRequests(server, "/basket/products");

    const catalogue = await bootCatalogue({ categoryId: id });
    await vi.waitFor(() =>
      expect(
        catalogue.criteria.value.filters?.products_category_id?.eq
      ).toContain(id)
    );
    observed.stop();

    for (const request of observed.all()) {
      expect([...new URL(request.url).searchParams.keys()]).not.toContain(
        "filter[products_category_id]"
      );
    }
  });
});
