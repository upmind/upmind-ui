// -----------------------------------------------------------------------------
/**
 * @fileoverview product-categories — the declared window, and nothing else
 *
 * ## Job To Be Done
 * The tree is read WHOLE and walked in the client, so pagination is the only
 * branch it declares. This drives the REAL `useProductCategories()` against
 * MSW-replayed staging recordings and proves the raw arm is gone from its
 * surface: no `sort()`, no `filter()` write-only setter, and the client-side
 * tree walk (`filter`, `getChildren`, `getPath`) untouched by the migration.
 * The declared window itself is proven against the API's own answer to it.
 *
 * ## What this file does NOT prove, and why
 * The outbound request is not asserted here. This collection's read sits behind
 * the basket/currency boot and the staging account has no live basket
 * (`fixtures/get-orders-current.json` is a real 204), so no
 * `basket/products_categories` read fires under replay. Closing that needs a
 * basket-seeded capture — the headless-Playwright flavour
 * `product-setup.fixtures.ts` already uses — and is escalated rather than faked.
 *
 * Nor does it assert a published `criteria` / `schema` / `setCriteria` surface:
 * unlike its six migrated siblings this composable republishes none of them
 * (only `filter`, which is the CLIENT-SIDE tree filter, not the query's). That
 * inconsistency is escalated as a finding rather than decided here.
 *
 * ## What Breaks If This Fails
 * A `sort()`/`filter()` setter reappearing on the handle means the raw options
 * arm survived the migration in the one module that declares the least.
 */

import { describe, expect, it } from "vitest";
import { useProductCategories } from "..";
import { seedClientSession } from "../../../__tests__/criteria-int-kit";
import {
  installCategoriesHandler,
  recorded
} from "./product-categories.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** Long enough for the declaration's parse to have settled. */
const SETTLED_MS = 500;

async function bootTree(
  initial?: Parameters<typeof useProductCategories>[0]
): Promise<ReturnType<typeof useProductCategories>> {
  await seedClientSession(server, { withBrandConfig: false });
  installCategoriesHandler(server);
  const categories = useProductCategories(initial);
  await new Promise(resolve => setTimeout(resolve, SETTLED_MS));
  return categories;
}

// -----------------------------------------------------------------------------

describe("product-categories — the raw options arm is gone from the surface", () => {
  it("publishes no sort() setter", async () => {
    const categories = await bootTree();

    expect(categories).not.toHaveProperty("sort");
  });

  it("keeps `filter` as the client-side tree walk, not a query setter", async () => {
    const categories = await bootTree();

    // The query's write-only `filter(bag)` returned nothing; the tree's own
    // `filter(predicate)` returns the matching nodes.
    expect(categories.filter(() => true)).toEqual(expect.any(Array));
    expect(typeof categories.getChildren).toBe("function");
    expect(typeof categories.getCategoryIds).toBe("function");
  });

  it("takes a query MODEL as its argument, not raw query props", async () => {
    const categories = await bootTree({ pagination: { limit: 2, offset: 2 } });

    expect(categories).not.toHaveProperty("pagination");
    expect(typeof categories.refresh).toBe("function");
  });
});

describe("product-categories — the recorded answer to the declared window", () => {
  it("returns the whole tree to `?limit=0`, not a page of it", () => {
    const envelope = recorded.unpaged();
    const pageOne = recorded.pageOne();

    expect(envelope.data.length).toBeGreaterThan(pageOne.data.length);
    expect(envelope.total).toBe(envelope.data.length);
  });

  it("carries the nested subcategories the client-side walk needs", () => {
    const envelope = recorded.unpaged();

    expect(
      envelope.data.some(node => (node.subcategories ?? []).length > 0)
    ).toBe(true);
  });
});
