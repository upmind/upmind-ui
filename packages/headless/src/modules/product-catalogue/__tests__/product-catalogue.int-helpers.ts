// -----------------------------------------------------------------------------
/**
 * @module product-catalogue/__tests__/product-catalogue.int-helpers
 * @description The recorded bodies this module's integration specs replay, and
 * the param-branching handlers that answer with them.
 *
 * Every body comes from a fixture captured by
 * `pnpm fixtures:generate product-catalogue` / `product-categories` against real
 * staging — no spec builds a wire body of its own.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  heldFor,
  narrowByLike,
  windowOf
} from "../../../__tests__/criteria-int-kit";
import { recordingsDir } from "./setup.integration";
import type {
  Envelope,
  ResponseTiming
} from "../../../__tests__/criteria-int-kit";
import type { SetupServer } from "msw/node";

// -----------------------------------------------------------------------------

/** One product as the recorded wire carries it. */
export type WireProduct = {
  id: string;
  name: string;
  category?: { id: string } | null;
};

/** One category as the recorded wire carries it, subcategories expanded. */
export type WireCategory = {
  id: string;
  name: string;
  parent_id: string | null;
  subcategories?: WireCategory[];
};

/** The sibling module's own captures — the tree this module scopes against. */
const categoriesRecordingsDir = join(
  import.meta.dirname,
  "../../product-categories/__tests__/fixtures"
);

export const recorded = {
  /** `?limit=2&offset=0&order=order` — the real first page of 58. */
  pageOne: () =>
    getFixtureBody<Envelope<WireProduct[]>>(
      "get-basket-products-case-page-1-filter-provision-blueprint-category-code-neq-domain-names",
      { recordingsDir }
    ),
  /** `?limit=2&offset=2&order=order` — the real second page. */
  pageTwo: () =>
    getFixtureBody<Envelope<WireProduct[]>>(
      "get-basket-products-case-page-2-filter-provision-blueprint-category-code-neq-domain-names",
      { recordingsDir }
    ),
  // The three `case=` captures below carry identity params too long for a
  // filename, so `generateFixtureName` collapsed them to a hash. Each fixture's
  // own `request.path` names the call it recorded.
  /** `?filter[products_category_id|eq]=<id>` — the migrated operator form, 15 of 58. */
  categoryEq: () =>
    getFixtureBody<Envelope<WireProduct[]>>("get-basket-products-155ce1b8", {
      recordingsDir
    }),
  /** `?filter[products_category_id]=<id>` — the LEGACY bare key, also 15 of 58. */
  categoryBare: () =>
    getFixtureBody<Envelope<WireProduct[]>>("get-basket-products-5c3bdcbe", {
      recordingsDir
    }),
  /** `?filter[name|like]=%…%` — the migrated free-text key. */
  nameLike: () =>
    getFixtureBody<Envelope<WireProduct[]>>("get-basket-products-220a9665", {
      recordingsDir
    }),
  /** The category tree, unpaged, as `product-categories` captured it. */
  categories: () =>
    getFixtureBody<Envelope<WireCategory[]>>(
      "get-basket-products-categories-case-unpaged",
      { recordingsDir: categoriesRecordingsDir }
    )
};

/** The corpus the recorded product pages add up to. */
export function corpus(): WireProduct[] {
  const rows = [
    ...recorded.pageOne().data,
    ...recorded.pageTwo().data,
    ...recorded.categoryEq().data
  ];
  return [...new Map(rows.map(row => [row.id, row])).values()];
}

/** A product-name needle the recorded corpus really contains. */
export function recordedNeedle(): string {
  return corpus()[0].name.slice(0, 3);
}

/** A recorded category that really has subcategories, and its subtree ids. */
export function recordedCategoryWithChildren(): {
  id: string;
  subtreeIds: string[];
} {
  const collect = (node: WireCategory): string[] => [
    node.id,
    ...(node.subcategories ?? []).flatMap(collect)
  ];
  const parent = recorded
    .categories()
    .data.find(node => (node.subcategories ?? []).length > 0);
  if (!parent) {
    throw new Error(
      "No recorded category carries subcategories — the descendant expansion " +
        "has nothing real to expand. Re-capture product-categories."
    );
  }
  return { id: parent.id, subtreeIds: collect(parent) };
}

/**
 * Serves the recorded product corpus narrowed by the request's OWN
 * `filter[name|like]` and `filter[products_category_id|eq]`, windowed by its own
 * `limit`/`offset`.
 */
export function installProductsHandler(
  server: SetupServer | undefined,
  options?: ResponseTiming
): { reads: () => number } {
  const envelope = recorded.pageOne();
  let reads = 0;

  server?.use(
    http.get("*/basket/products", async ({ request }) => {
      reads += 1;
      const params = new URL(request.url).searchParams;
      let rows = narrowByLike(corpus(), params, "name", row => row.name);

      const categories = params.get("filter[products_category_id|eq]");
      if (categories) {
        const wanted = new Set(categories.split(","));
        rows = rows.filter(row => wanted.has(row.category?.id ?? ""));
      }

      await heldFor(params, options);
      return HttpResponse.json(
        { ...envelope, data: windowOf(rows, params), total: rows.length },
        { status: 200 }
      );
    })
  );

  return { reads: () => reads };
}

/** Serves the recorded category tree the catalogue resolves its scope from. */
export function installCategoriesHandler(
  server: SetupServer | undefined
): void {
  const envelope = recorded.categories();
  server?.use(
    http.get("*/basket/products_categories", () =>
      HttpResponse.json(envelope, { status: 200 })
    )
  );
}
