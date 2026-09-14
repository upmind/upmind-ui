// -----------------------------------------------------------------------------
/**
 * @module tests/sole-product-redirect
 * @description Gap doc §2 Listing: a client who owns exactly ONE product opens
 * on that product rather than on a listing of one row. The resolver is pure —
 * it reads a resolution and the route's query and answers with a path or with
 * nothing — so every branch is provable without a mount. The branch that
 * matters is the NEGATIVE one: a narrowed listing is a choice the client made,
 * and a choice is never skipped past.
 */

import { describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { assign } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import type { CatchAllResolution } from "~/portal/routes";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "~/portal/mock/hostgrid-minimal";
import { soleProductRedirect } from "~/portal/mock/selectors";
import { defineProductGroup } from "~/portal/routes";

const products = defineProductGroup({ slug: "products", label: "Products" });
const domains = defineProductGroup({ slug: "domains", label: "Domains" });

const LISTING: CatchAllResolution = { kind: "group-listing", group: products };
const NO_QUERY: DataRouteContext = {};

const NARROWED: readonly [string, DataRouteContext][] = [
  ["status", { status: "cancelled" }],
  ["type", { productType: "subscription" }],
  ["category", { category: "Subscription" }]
];

const NOT_A_LISTING: readonly [string, CatchAllResolution][] = [
  ["a product detail", { kind: "product-detail", group: products, id: "p1" }],
  [
    "a product action area",
    { kind: "product-action-area", group: products, id: "p1", area: "billing" }
  ],
  ["the buy flow", { kind: "group-order", group: products }],
  ["an unmatched path", { kind: "unmatched" }]
];

function withProducts(rows: MockDataset["products"]): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MINIMAL_MOCK_DATASET);
  return assign(dataset, { products: rows });
}

describe("soleProductRedirect — one product means one destination", () => {
  // Straight to the area the product OPENS on, never its root: the root is
  // itself a redirect position, so landing there would only navigate again.
  it("sends a client who owns exactly one product straight to it", () => {
    const data = HOSTGRID_MINIMAL_MOCK_DATASET;
    const sole = data.products[0];

    expect(data.products).toHaveLength(1);
    expect(sole?.status).toBe(ContractStatusCodes.ACTIVE);
    expect(soleProductRedirect(data, LISTING, NO_QUERY)).toBe(
      `/products/${sole?.id}/overview`
    );
  });

  it.each(NARROWED)(
    "leaves a listing the client narrowed by %s alone — that is a choice, not a way through",
    (_axis, query) => {
      expect(
        soleProductRedirect(HOSTGRID_MINIMAL_MOCK_DATASET, LISTING, query)
      ).toBeUndefined();
    }
  );

  it("leaves a client who owns several products on the listing", () => {
    expect(HOSTGRID_MOCK_DATASET.products.length).toBeGreaterThan(1);
    expect(
      soleProductRedirect(HOSTGRID_MOCK_DATASET, LISTING, NO_QUERY)
    ).toBeUndefined();
  });

  it.each(NOT_A_LISTING)(
    "redirects from a group listing only — never from %s",
    (_kind, resolution) => {
      expect(
        soleProductRedirect(HOSTGRID_MINIMAL_MOCK_DATASET, resolution, NO_QUERY)
      ).toBeUndefined();
    }
  );

  it("has nowhere to send a client who owns nothing", () => {
    expect(
      soleProductRedirect(withProducts([]), LISTING, NO_QUERY)
    ).toBeUndefined();
  });

  it("answers for the listing's OWN group — a product in another group is not this listing's one row", () => {
    const data = HOSTGRID_MINIMAL_MOCK_DATASET;
    const otherGroup: CatchAllResolution = {
      kind: "group-listing",
      group: domains
    };

    expect(data.products[0]?.groupSlug).toBe(products.slug);
    expect(soleProductRedirect(data, otherGroup, NO_QUERY)).toBeUndefined();
  });

  it("a shape with no seed at all resolves nowhere", () => {
    expect(soleProductRedirect(undefined, LISTING, NO_QUERY)).toBeUndefined();
  });
});
